import Anthropic from "@anthropic-ai/sdk";
import getSupabase from "../supabase.server";
import { getDashboardMetrics, prepareAnalyticsSummary } from "./analytics.server";
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
import {
  CHAT_SYSTEM_PROMPT,
  chatReplyFormatHint,
  chatStageHint,
  prefersHebrewReply,
} from "../config/chat-voice";
import { prepareChatContext } from "./chat-context.server";
import {
  formatDiagnosticForAi,
  getStoreDiagnostic,
} from "./store-diagnostic.server";
import {
  formatLeaksForAi,
  getRevenueLeakReport,
} from "./revenue-leak.server";
import { getRecommendationCap } from "../config/plans";
import { getUsage } from "./usage.server";
import { rejectLowValueReply } from "../utils/chat-quality";
import type {
  AIRecommendation,
  RecommendationCategory,
} from "../types/database.types";

const MARKETING_MANAGER_SYSTEM_PROMPT = `You help Shopify store owners sell more. Use visitor tracking and order data when available.

Write for non-marketers. Simple words. No jargon.
When asked for JSON, return valid JSON only.
Prioritize fixes that unblock sales fastest.`;

const RECOMMENDATIONS_SYSTEM_PROMPT = `You are a Shopify marketing advisor. Turn store data into clear marketing actions — ads, product focus, email angles, page fixes.

Rules:
- Titles: max 8 words. Marketing-focused (what to promote, fix, or test).
- description: max 2 short sentences. Tie to store data.
- expected_impact: one short sentence — "This could help you ..." in plain words.
- action_items: 2–3 steps the merchant runs themselves in Shopify Admin or ad platforms.
- Never use jargon: funnel, CRO, attribution, LTV, RFM, cohort, retargeting, leverage, KPI.
- Do NOT invent numbers. Use only data from the JSON.
- Never suggest paid ads if ad readiness is low or readyForAds is false.
- Remind implicitly that the merchant chooses whether to act.
- No markdown, no emojis.`;

function isSetupQuestion(message: string): boolean {
  return /מעקב|הפעל|התק|מתחיל|setup|install|איך|עוזר|הורא|embed|עיצוב/i.test(
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

const PRIORITY_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function sortRecommendations<T extends { priority: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) =>
      (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9),
  );
}

function buildRecommendationsPrompt(
  analyticsSummary: string,
  productInsights: unknown[],
  segments: Array<{ name: string; members: number }>,
  attributionContext: string | null,
  revenueLeaksJson: string,
  storeDiagnosticJson: string,
  hasData: boolean,
  maxCount: number,
): string {
  const countRule = hasData
    ? `Create exactly ${maxCount} marketing actions. Prioritize ad readiness blockers, then drop-offs, then growth.`
    : `Data is empty (0 visitors). Create only ${Math.min(maxCount, 3)} actions — focus on enabling tracking and first marketing steps. Do not suggest paid ads.`;

  const dataRule = hasData
    ? "- Every recommendation must cite a number, product, page, or traffic source from the JSON.\n- If readyForAds is false — do NOT suggest increasing ad spend.\n- Prefer fixes for blockers and dropOffs first.\n- If no data supports a recommendation — omit it."
    : "- Metrics are zero — explain there is no data yet and what to do to collect it.";

  return `Create marketing actions for this store. Plain English. Reading level: grade 6.
${countRule}

Store diagnostic (ad readiness + blockers):
${storeDiagnosticJson}

Drop-off estimates ($/month — use in expected_impact when relevant):
${revenueLeaksJson}

Store data (30 days):
${analyticsSummary}

Traffic sources:
${attributionContext ?? "[]"}

Product notes:
${JSON.stringify(productInsights.slice(0, 10), null, 2)}

Visitor groups:
${JSON.stringify(segments, null, 2)}

Rules:
${dataRule}
- No duplicate fixes.
- "Return buyers" category only if the data shows return visitors or buyers.

Return JSON array:
[
  {
    "category": "marketing|product|conversion|retargeting",
    "title": "Short simple title (max 8 words)",
    "description": "1-2 short sentences. What the data shows.",
    "priority": "high|medium|low",
    "expected_impact": "This could ... (one short sentence)",
    "action_items": ["Step 1", "Step 2"]
  }
]`;
}

export async function generateRecommendations(
  shopId: string,
): Promise<AIRecommendation[]> {
  const supabase = getSupabase();
  const usage = await getUsage(shopId);
  const maxCount = getRecommendationCap(usage.plan);
  const metrics = await getDashboardMetrics(shopId);
  const hasData = metrics.totalVisitors > 0;

  const { data: shopRow } = await supabase
    .from("shops")
    .select("shop_domain")
    .eq("id", shopId)
    .maybeSingle();

  const shopDomain = shopRow?.shop_domain ?? "";

  const analyticsSummary = await prepareAnalyticsSummary(shopId);
  const productMetrics = await getProductMetrics(shopId);
  const productInsights = [
    ...analyzeProducts(productMetrics),
    ...analyzeProductExitDrivers(await getProductExitDrivers(shopId)),
  ];
  const segments = await getSegments(shopId);
  const attributionContext = hasData
    ? await buildAttributionContext(shopId)
    : null;

  const storeDiagnostic = shopDomain
    ? await getStoreDiagnostic(shopId, shopDomain, 30).catch(() => null)
    : null;
  const storeDiagnosticJson = storeDiagnostic
    ? formatDiagnosticForAi(storeDiagnostic)
    : JSON.stringify({ note: "No diagnostic data" });

  const revenueLeaks = shopDomain
    ? await getRevenueLeakReport(shopId, shopDomain, 30).catch(() => null)
    : null;
  const revenueLeaksJson = revenueLeaks
    ? formatLeaksForAi(revenueLeaks)
    : JSON.stringify({ revenueLeaks: [] });

  const prompt = buildRecommendationsPrompt(
    analyticsSummary,
    productInsights,
    segments.map((s) => ({ name: s.name, members: s.member_count })),
    attributionContext,
    revenueLeaksJson,
    storeDiagnosticJson,
    hasData,
    maxCount,
  );

  const response = await callClaude(RECOMMENDATIONS_SYSTEM_PROMPT, prompt);
  const recommendations = sortRecommendations(
    parseJsonResponse<GeneratedRecommendation[]>(response),
  ).slice(0, maxCount);

  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    throw new Error("Claude returned no recommendations");
  }

  return saveRecommendations(shopId, recommendations);
}

async function saveRecommendations(
  shopId: string,
  recommendations: GeneratedRecommendation[],
): Promise<AIRecommendation[]> {
  const supabase = getSupabase();
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
  if (newIds.length > 0) {
    const { error: dismissError } = await supabase
      .from("ai_recommendations")
      .update({ status: "dismissed" })
      .eq("shop_id", shopId)
      .eq("status", "active")
      .not("id", "in", `(${newIds.map((id) => `"${id}"`).join(",")})`);

    if (dismissError) {
      console.error(
        "[ai] Failed to dismiss old recommendations:",
        dismissError.message,
      );
    }
  }

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
  const chatContext = await prepareChatContext(shopId);
  const { analyticsSummary, stage, segmentsJson, recommendationsJson, attributionJson } =
    chatContext;
  const hasData = hasAnalyticsData(analyticsSummary);

  const { data: shop } = await supabase
    .from("shops")
    .select("*")
    .eq("id", shopId)
    .single();

  const storeDiagnostic =
    shop?.shop_domain && hasData
      ? await getStoreDiagnostic(shopId, shop.shop_domain, 30).catch(() => null)
      : null;
  const diagnosticJson = storeDiagnostic
    ? formatDiagnosticForAi(storeDiagnostic)
    : "{}";

  let convId = conversationId;
  if (convId) {
    const { data: ownedConversation } = await supabase
      .from("chat_conversations")
      .select("id")
      .eq("id", convId)
      .eq("shop_id", shopId)
      .maybeSingle();

    if (!ownedConversation) {
      throw new Error("Invalid conversation");
    }
  } else {
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

  if (!hasData && shop && isSetupQuestion(userMessage)) {
    reply = buildNoDataChatReply(shop, prefersHebrewReply(userMessage));
  } else {
    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(20);

    const hebrew = prefersHebrewReply(userMessage);

    const contextPrompt = `${chatStageHint(stage, hebrew)}

Shop: ${shop?.shop_domain ?? "unknown"}

Store diagnostic (ad readiness):
${diagnosticJson}

Analytics:
${analyticsSummary}

Attribution:
${attributionJson}

Segments:
${segmentsJson}

Existing recommendations:
${recommendationsJson}

Recent chat:
${(history ?? [])
  .slice(-6)
  .map((m) => `${m.role}: ${m.content}`)
  .join("\n")}

User question: ${userMessage}

${chatReplyFormatHint(userMessage)}`;

    let rawReply = await callClaude(CHAT_SYSTEM_PROMPT, contextPrompt, 1800);
    reply = formatChatReply(rawReply);

    if (rejectLowValueReply(reply)) {
      rawReply = await callClaude(
        `${CHAT_SYSTEM_PROMPT}\n\nRewrite in plain professional English. No jargon. No generic social tips.`,
        contextPrompt,
        1800,
      );
      reply = formatChatReply(rawReply);
    }
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

  const rows = data ?? [];
  return sortRecommendations(rows);
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
