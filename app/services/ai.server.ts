import Anthropic from "@anthropic-ai/sdk";
import getSupabase from "../supabase.server";
import { prepareAnalyticsSummary } from "./analytics.server";
import {
  analyzeProducts,
  analyzeProductExitDrivers,
  getProductExitDrivers,
  getProductMetrics,
} from "./product-intelligence.server";
import {
  computeAttributionMetrics,
  findWastefulSources,
} from "./attribution.server";
import { getSegments } from "./segmentation.server";
import {
  formatChatReply,
  hasAnalyticsData,
} from "../utils/format-chat-reply";
import { buildNoDataChatReply } from "../utils/chat-no-data-reply";
import type {
  AIRecommendation,
  RecommendationCategory,
} from "../types/database.types";

const MARKETING_MANAGER_SYSTEM_PROMPT = `You are the Chief Marketing Officer (CMO) of a Shopify store.
Your goal is to increase revenue through data analysis, problem identification, and actionable recommendations.

You analyze visitor behavior, product performance, traffic sources, and conversion funnels.
You provide specific, actionable marketing recommendations — not generic advice.

Always respond in valid JSON when asked for structured output.
Be direct, data-driven, and prioritize high-impact actions.
Respond in the same language as the user's question (Hebrew or English).`;

const CHAT_SYSTEM_PROMPT = `You are a friendly marketing assistant for a Shopify store owner.
You speak simple, clear Hebrew (unless the user writes in English).
Rules for every reply:
- Plain text only. NO markdown: no # headers, no **bold**, no \`\`\` code blocks, no --- lines.
- NO emojis.
- NO English jargon: say "מעקב" not tracking, "ביקורים" not sessions, "מבקרים" not visitors.
- Short paragraphs. Use numbered steps (1. 2. 3.) or bullet lines starting with • when listing.
- Be direct and practical, like talking to a shop owner who is not technical.
- If store data shows zero visitors, explain that tracking must be enabled first and give concrete steps from the app home page (App embed "מעקב Solution", tracking ID).
- Never invent numbers. If data is missing, say so honestly and guide setup.
- Keep answers under 12 lines unless the user asks for detail.`;

function isSetupQuestion(message: string): boolean {
  return /מעקב|הפעל|התק|מתחיל|setup|install|איך|עוזר|הורא|embed|עיצוב/i.test(
    message,
  );
}

function needsStoreData(message: string): boolean {
  return /מכיר|ירד|על|תנוע|מוצר|קהל|המר|כסף|ביצוע|פרסום|analytics|traffic|conversion|revenue|sales/i.test(
    message,
  );
}

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable");
  }
  return new Anthropic({ apiKey });
}

export interface GeneratedRecommendation {
  category: RecommendationCategory;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  expected_impact: string;
  action_items: string[];
}

export interface WeeklyReportData {
  insights: string[];
  top_actions: Array<{ action: string; impact: string }>;
  growth_opportunities: string[];
  waste_points: string[];
  performance_summary: string;
}

function getAnthropicModel(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-6";
}

async function callClaude(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 4096,
): Promise<string> {
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: getAnthropicModel(),
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const block = response.content[0];
  if (block.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }
  return block.text;
}

function parseJsonResponse<T>(text: string): T {
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ?? text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : text;
  return JSON.parse(jsonStr.trim()) as T;
}

export async function generateRecommendations(
  shopId: string,
): Promise<AIRecommendation[]> {
  const supabase = getSupabase();
  const analyticsSummary = await prepareAnalyticsSummary(shopId);
  const productMetrics = await getProductMetrics(shopId);
  const productInsights = [
    ...analyzeProducts(productMetrics),
    ...analyzeProductExitDrivers(await getProductExitDrivers(shopId)),
  ];
  const segments = await getSegments(shopId);

  const hasData = analyticsSummary.includes('"totalVisitors":') &&
    !analyticsSummary.includes('"totalVisitors": 0');

  const prompt = `Analyze this Shopify store data and generate marketing recommendations.

Store Analytics:
${analyticsSummary}

Product Insights:
${JSON.stringify(productInsights.slice(0, 10), null, 2)}

Audience Segments:
${JSON.stringify(segments.map((s) => ({ name: s.name, members: s.member_count })), null, 2)}

${hasData ? "" : "Note: The store has little or no tracking data yet. Base recommendations on e-commerce best practices for a new Shopify store, and mention installing the tracking script to unlock deeper insights.\n"}

Generate 8-12 recommendations across these categories: marketing, product, conversion, retargeting.

Return JSON array:
[
  {
    "category": "marketing|product|conversion|retargeting",
    "title": "Short title",
    "description": "Detailed explanation based on the data",
    "priority": "high|medium|low",
    "expected_impact": "Estimated impact (e.g. +15% conversion)",
    "action_items": ["Step 1", "Step 2", "Step 3"]
  }
]`;

  const response = await callClaude(MARKETING_MANAGER_SYSTEM_PROMPT, prompt);
  const recommendations = parseJsonResponse<GeneratedRecommendation[]>(response);

  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    throw new Error("Claude returned no recommendations");
  }

  const inserts = recommendations.map((rec) => ({
    shop_id: shopId,
    category: rec.category,
    title: rec.title,
    description: rec.description,
    priority: rec.priority,
    expected_impact: rec.expected_impact,
    action_items: rec.action_items,
    status: "active" as const,
  }));

  const { data, error } = await supabase
    .from("ai_recommendations")
    .insert(inserts)
    .select("*");

  if (error) {
    throw new Error(`Failed to save recommendations: ${error.message}`);
  }

  if (!data?.length) {
    throw new Error("Recommendations were not saved to the database");
  }

  const newIds = data.map((row) => row.id);
  await supabase
    .from("ai_recommendations")
    .update({ status: "dismissed" })
    .eq("shop_id", shopId)
    .eq("status", "active")
    .not("id", "in", `(${newIds.join(",")})`);

  return data;
}

export async function generateWeeklyReport(
  shopId: string,
): Promise<WeeklyReportData> {
  const supabase = getSupabase();
  const analyticsSummary = await prepareAnalyticsSummary(shopId, 7);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const weekEnd = now;

  const prompt = `Generate a weekly marketing report for this Shopify store.

Data (last 7 days):
${analyticsSummary}

Return JSON:
{
  "insights": ["10 key insights about store performance"],
  "top_actions": [{"action": "Specific action", "impact": "Expected impact"}],
  "growth_opportunities": ["Opportunity 1", "Opportunity 2"],
  "waste_points": ["Where money is being wasted"],
  "performance_summary": "2-3 sentence executive summary"
}

Provide exactly 10 insights and exactly 5 top_actions with high impact.`;

  const response = await callClaude(MARKETING_MANAGER_SYSTEM_PROMPT, prompt, 6000);
  const reportData = parseJsonResponse<WeeklyReportData>(response);

  await supabase.from("weekly_reports").upsert(
    {
      shop_id: shopId,
      week_start: weekStart.toISOString().split("T")[0],
      week_end: weekEnd.toISOString().split("T")[0],
      insights: reportData.insights,
      top_actions: reportData.top_actions,
      growth_opportunities: reportData.growth_opportunities,
      waste_points: reportData.waste_points,
      performance_summary: reportData.performance_summary,
    },
    { onConflict: "shop_id,week_start" },
  );

  return reportData;
}

export async function chatWithAI(
  shopId: string,
  conversationId: string | null,
  userMessage: string,
): Promise<{ conversationId: string; reply: string }> {
  const supabase = getSupabase();
  const analyticsSummary = await prepareAnalyticsSummary(shopId);
  const hasData = hasAnalyticsData(analyticsSummary);

  const { data: shop } = await supabase
    .from("shops")
    .select("*")
    .eq("id", shopId)
    .single();

  let convId = conversationId;
  if (!convId) {
    const { data: conv, error: convError } = await supabase
      .from("chat_conversations")
      .insert({ shop_id: shopId, title: userMessage.slice(0, 80) })
      .select("id")
      .single();
    if (convError || !conv) {
      throw new Error("Failed to create conversation");
    }
    convId = conv.id;
  }

  await supabase.from("chat_messages").insert({
    conversation_id: convId,
    role: "user",
    content: userMessage,
  });

  let reply: string;

  if (!hasData && shop && needsStoreData(userMessage) && !isSetupQuestion(userMessage)) {
    reply = buildNoDataChatReply(shop);
  } else {
    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(20);

    const dataNote = hasData
      ? "Store has analytics data — use the numbers below."
      : "Store has NO analytics data yet (all zeros). Do not analyze sales or traffic. Guide setup or answer setup questions only.";

    const trackingNote = shop
      ? `Tracking ID for this shop: ${shop.tracking_id}`
      : "";

    const contextPrompt = `${dataNote}
${trackingNote}

Store data:
${analyticsSummary}

Recent chat:
${(history ?? [])
  .slice(-6)
  .map((m) => `${m.role}: ${m.content}`)
  .join("\n")}

User question: ${userMessage}

Answer in plain Hebrew. No markdown. No emojis.`;

    const rawReply = await callClaude(CHAT_SYSTEM_PROMPT, contextPrompt, 1200);
    reply = formatChatReply(rawReply);
  }

  await supabase.from("chat_messages").insert({
    conversation_id: convId,
    role: "assistant",
    content: reply,
  });

  await supabase
    .from("chat_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", convId);

  return { conversationId: convId, reply };
}

export async function getRecommendations(
  shopId: string,
): Promise<AIRecommendation[]> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("ai_recommendations")
    .select("*")
    .eq("shop_id", shopId)
    .eq("status", "active")
    .order("generated_at", { ascending: false });
  return data ?? [];
}

export async function getWeeklyReports(shopId: string) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("weekly_reports")
    .select("*")
    .eq("shop_id", shopId)
    .order("week_start", { ascending: false })
    .limit(12);
  return data ?? [];
}

export async function getChatConversations(shopId: string) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("chat_conversations")
    .select("*")
    .eq("shop_id", shopId)
    .order("updated_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

export async function getChatMessages(conversationId: string) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function buildAttributionContext(shopId: string): Promise<string> {
  const supabase = getSupabase();
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: sessions } = await supabase
    .from("visitor_sessions")
    .select("traffic_source, converted, order_value")
    .eq("shop_id", shopId)
    .gte("started_at", since.toISOString());

  const metrics = computeAttributionMetrics(sessions ?? []);
  const wasteful = findWastefulSources(metrics);

  return JSON.stringify({ attribution: metrics, wastefulSources: wasteful }, null, 2);
}
