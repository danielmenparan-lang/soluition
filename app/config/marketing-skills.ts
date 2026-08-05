import type { BrainSignalStatus, StoreBrain } from "../types/store-brain.types";

/** Context for activating CMO skill domains from live store data */
export type BrainSkillContext = {
  hasVisitors: boolean;
  hasOrders: boolean;
  hasDiagnostic: boolean;
  hasDropOffs: boolean;
  hasSegments: boolean;
  hasActions: boolean;
  readyForAds: boolean;
  visitorCount: number;
  conversionRate: number;
};

export type MarketingSkillCategory = {
  id: string;
  label: string;
  skills: readonly string[];
  status: (ctx: BrainSkillContext) => BrainSignalStatus;
  headline: (ctx: BrainSkillContext) => string;
};

export const MARKETING_SKILL_DOMAINS: readonly MarketingSkillCategory[] = [
  {
    id: "strategy",
    label: "Strategy",
    skills: ["CMO thinking", "Goals", "Bottlenecks", "ROI", "Funnel", "Priority", "Long term", "Edge", "Opportunities", "Growth"],
    status: (ctx) => (ctx.hasDiagnostic ? "active" : ctx.hasVisitors ? "pending" : "off"),
    headline: (ctx) => (ctx.readyForAds ? "Scale what works" : "Fix blockers before spend"),
  },
  {
    id: "analytics",
    label: "Analytics",
    skills: ["Traffic", "Shopify", "CR", "CAC", "LTV", "Drop-offs", "Funnels", "Winners", "Weak SKUs", "Data-only"],
    status: (ctx) => (ctx.hasVisitors ? (ctx.visitorCount >= 30 ? "active" : "pending") : "off"),
    headline: (ctx) => (ctx.hasVisitors ? `${ctx.conversionRate}% conversion` : "Waiting for data"),
  },
  {
    id: "cro",
    label: "CRO",
    skills: ["Product page", "Home", "Checkout", "Speed", "UX", "A/B", "Lift", "Trust", "Nav", "Mobile"],
    status: (ctx) => (ctx.hasDropOffs ? "active" : ctx.hasDiagnostic ? "pending" : "off"),
    headline: () => "Fix where buyers leave",
  },
  {
    id: "copy",
    label: "Copy",
    skills: ["Headlines", "Descriptions", "FB ads", "Google ads", "Email", "SMS", "Hooks", "Psychology", "Urgency", "Value prop"],
    status: (ctx) => (ctx.hasActions ? "active" : ctx.hasDiagnostic ? "pending" : "off"),
    headline: () => "Copy matched to data",
  },
  {
    id: "psychology",
    label: "Psychology",
    skills: ["Why buy", "Fears", "Desires", "Scarcity", "Social proof", "Authority", "FOMO", "Objections", "Trust", "Audience fit"],
    status: (ctx) => (ctx.hasSegments ? "active" : ctx.hasVisitors ? "pending" : "off"),
    headline: () => "Message per audience",
  },
  {
    id: "paid",
    label: "Paid",
    skills: ["Meta", "TikTok", "Google", "Audiences", "Creatives", "Winners", "CPA", "ROAS", "Remarketing", "Scale"],
    status: (ctx) => (ctx.readyForAds ? "active" : ctx.hasDiagnostic ? "pending" : "off"),
    headline: (ctx) => (ctx.readyForAds ? "Ready to test ads" : "Hold ad spend"),
  },
  {
    id: "automation",
    label: "AI",
    skills: ["Automate", "Agents", "Real-time", "Personalize", "Churn", "Predict", "Content", "Reviews", "Competitors", "Learn"],
    status: () => "active",
    headline: () => "Brain updates live",
  },
  {
    id: "ecommerce",
    label: "Commerce",
    skills: ["Winners", "Trends", "Upsell", "Cross-sell", "Bundles", "Pricing", "Promos", "AOV", "Loyalty", "Retention"],
    status: (ctx) => (ctx.hasOrders ? "active" : "off"),
    headline: () => "Orders linked",
  },
  {
    id: "research",
    label: "Research",
    skills: ["Competitors", "Prices", "Reviews", "Pain points", "Ideas", "Trends", "Social", "Niche", "Segments", "Personas"],
    status: (ctx) => (ctx.hasSegments ? "active" : ctx.hasVisitors ? "pending" : "off"),
    headline: (ctx) => (ctx.hasSegments ? "Audiences mapped" : "Build from traffic"),
  },
  {
    id: "genius",
    label: "Genius",
    skills: ["Curiosity", "Skepticism", "Creativity", "Connect dots", "Human", "Simple", "Decide fast", "Learn", "Small gains", "Owner"],
    status: (ctx) => {
      const n = [ctx.hasVisitors, ctx.hasDiagnostic, ctx.hasDropOffs, ctx.hasActions].filter(Boolean).length;
      if (n >= 3) return "active";
      if (n >= 1) return "pending";
      return "off";
    },
    headline: () => "One sharp move wins",
  },
];

export function resolveSkillDomains(ctx: BrainSkillContext) {
  return MARKETING_SKILL_DOMAINS.map((domain) => {
    const status = domain.status(ctx);
    const activeCount = status === "active" ? domain.skills.length : status === "pending" ? 3 : 0;
    return {
      id: domain.id,
      label: domain.label,
      status,
      activeCount,
      totalCount: domain.skills.length,
      headline: domain.headline(ctx),
    };
  });
}

/** What the product can actually do today vs AI-only vs future integration */
export type SkillMode = "live" | "ai" | "blocked";

export type SkillDefinition = {
  id: number;
  name: string;
  mode: SkillMode;
  whenActive: string;
  blockedNote?: string;
};

/**
 * All 100 skills with honest capability mode.
 * live = uses store data in code/prompts today
 * ai = brain suggests; merchant executes manually
 * blocked = do NOT claim done; say what data/integration is missing
 */
export const ALL_MARKETING_SKILLS: readonly SkillDefinition[] = [
  // 1–10 Strategy
  { id: 1, name: "CMO-level thinking", mode: "ai", whenActive: "Frame every answer as revenue impact" },
  { id: 2, name: "Business goals first", mode: "ai", whenActive: "Ask implicit goal: more sales vs ready for ads" },
  { id: 3, name: "Growth bottlenecks", mode: "live", whenActive: "Use blockers + dropOffs from brain" },
  { id: 4, name: "ROI thinking", mode: "ai", whenActive: "Compare fix effort vs wasted ad spend" },
  { id: 5, name: "Full sales funnel", mode: "live", whenActive: "Use funnel steps in analytics JSON" },
  { id: 6, name: "Impact prioritization", mode: "live", whenActive: "Rank by priority + todayAction first" },
  { id: 7, name: "Short and long term", mode: "ai", whenActive: "Today action + one 30-day note max" },
  { id: 8, name: "Competitive edge", mode: "blocked", whenActive: "", blockedNote: "No competitor API — suggest manual check only" },
  { id: 9, name: "Market opportunities", mode: "ai", whenActive: "From traffic sources + product winners" },
  { id: 10, name: "Growth strategy", mode: "ai", whenActive: "One strategy sentence from verdictSharp" },
  // 11–20 Analytics
  { id: 11, name: "Traffic analysis", mode: "live", whenActive: "visitorCount + sources in JSON" },
  { id: 12, name: "Shopify analytics", mode: "live", whenActive: "Orders, revenue, conversion from store" },
  { id: 13, name: "Conversion rate", mode: "live", whenActive: "Cite conversionRate from brain" },
  { id: 14, name: "Customer acquisition cost", mode: "blocked", whenActive: "", blockedNote: "No ad spend data — never invent CPA" },
  { id: 15, name: "Lifetime value", mode: "live", whenActive: "Use LTV when orders synced (Pro)" },
  { id: 16, name: "Drop-off patterns", mode: "live", whenActive: "Use dropOffs + leak report" },
  { id: 17, name: "Purchase funnels", mode: "live", whenActive: "Funnel chart data" },
  { id: 18, name: "Winning products", mode: "live", whenActive: "Product metrics when orders exist" },
  { id: 19, name: "Weak products", mode: "live", whenActive: "Exit drivers + low converters" },
  { id: 20, name: "Data-only advice", mode: "live", whenActive: "Refuse if no number in JSON" },
  // 21–30 CRO
  { id: 21, name: "Product page fixes", mode: "live", whenActive: "From product exit + drop-offs" },
  { id: 22, name: "Homepage fixes", mode: "ai", whenActive: "Suggest tests; no homepage heatmap yet" },
  { id: 23, name: "Checkout fixes", mode: "live", whenActive: "Checkout blocker in diagnostic" },
  { id: 24, name: "Site speed", mode: "blocked", whenActive: "", blockedNote: "No speed API — mention PageSpeed manually" },
  { id: 25, name: "UX issues", mode: "live", whenActive: "Infer from exit pages + funnel" },
  { id: 26, name: "A/B test ideas", mode: "ai", whenActive: "Propose one test; merchant runs it" },
  { id: 27, name: "Conversion lift", mode: "ai", whenActive: "Directional only; no guaranteed %" },
  { id: 28, name: "Trust building", mode: "ai", whenActive: "Checkout/product trust copy steps" },
  { id: 29, name: "Navigation", mode: "ai", whenActive: "If high exit on collection pages" },
  { id: 30, name: "Mobile", mode: "live", whenActive: "Device segments when available" },
  // 31–40 Copy
  { id: 31, name: "Headlines", mode: "ai", whenActive: "Write 1 headline tied to proof" },
  { id: 32, name: "Product descriptions", mode: "ai", whenActive: "For weak product from data" },
  { id: 33, name: "Facebook ad copy", mode: "ai", whenActive: "Only if readyForAds" },
  { id: 34, name: "Google ad copy", mode: "ai", whenActive: "Only if readyForAds" },
  { id: 35, name: "Email copy", mode: "ai", whenActive: "Merchant sends; provide draft" },
  { id: 36, name: "SMS copy", mode: "ai", whenActive: "Draft only" },
  { id: 37, name: "Hooks", mode: "ai", whenActive: "One hook in recommendations" },
  { id: 38, name: "Word psychology", mode: "ai", whenActive: "Plain urgency without fake scarcity" },
  { id: 39, name: "Urgency", mode: "ai", whenActive: "Real inventory/behavior only" },
  { id: 40, name: "Value proposition", mode: "ai", whenActive: "One sentence from top drop-off" },
  // 41–50 Psychology
  { id: 41, name: "Why people buy", mode: "ai", whenActive: "From segment + product data" },
  { id: 42, name: "Customer fears", mode: "ai", whenActive: "Checkout/shipping objections" },
  { id: 43, name: "Deep desires", mode: "ai", whenActive: "Infer from product category" },
  { id: 44, name: "Scarcity", mode: "ai", whenActive: "Never fake stock" },
  { id: 45, name: "Social proof", mode: "ai", whenActive: "Suggest reviews near CTA" },
  { id: 46, name: "Authority", mode: "ai", whenActive: "Trust badges at checkout" },
  { id: 47, name: "FOMO", mode: "ai", whenActive: "Only with real deadline/stock" },
  { id: 48, name: "Objections", mode: "live", whenActive: "Map to drop-off step" },
  { id: 49, name: "Trust", mode: "ai", whenActive: "Checkout completion fixes" },
  { id: 50, name: "Audience messaging", mode: "live", whenActive: "Per segment in JSON" },
  // 51–60 Paid
  { id: 51, name: "Meta ads analysis", mode: "blocked", whenActive: "", blockedNote: "No Meta API — use traffic source proxy" },
  { id: 52, name: "TikTok ads", mode: "blocked", whenActive: "", blockedNote: "No TikTok API" },
  { id: 53, name: "Google ads", mode: "blocked", whenActive: "", blockedNote: "No Google Ads API" },
  { id: 54, name: "Audience building", mode: "ai", whenActive: "From segments; merchant builds in Ads" },
  { id: 55, name: "Creative ideas", mode: "ai", whenActive: "One angle from top product" },
  { id: 56, name: "Winning ads", mode: "blocked", whenActive: "", blockedNote: "No ad creative data" },
  { id: 57, name: "Lower CPA", mode: "blocked", whenActive: "", blockedNote: "No spend data" },
  { id: 58, name: "Higher ROAS", mode: "blocked", whenActive: "", blockedNote: "No ROAS data" },
  { id: 59, name: "Remarketing", mode: "ai", whenActive: "Suggest if return visitors segment exists" },
  { id: 60, name: "Campaign scaling", mode: "ai", whenActive: "Only when readyForAds true" },
  // 61–70 AI
  { id: 61, name: "Automatable tasks", mode: "ai", whenActive: "List what merchant can automate externally" },
  { id: 62, name: "AI agents", mode: "live", whenActive: "This app is the agent" },
  { id: 63, name: "Real-time recommendations", mode: "live", whenActive: "Scan + todayAction" },
  { id: 64, name: "Personalization", mode: "live", whenActive: "Segment-based suggestions" },
  { id: 65, name: "Churn prediction", mode: "blocked", whenActive: "", blockedNote: "No subscription churn model" },
  { id: 66, name: "Purchase prediction", mode: "blocked", whenActive: "", blockedNote: "No ML model" },
  { id: 67, name: "Auto content", mode: "ai", whenActive: "Draft copy in chat/scan" },
  { id: 68, name: "Review analysis", mode: "blocked", whenActive: "", blockedNote: "No review import" },
  { id: 69, name: "Competitor scan", mode: "blocked", whenActive: "", blockedNote: "No competitor data" },
  { id: 70, name: "Continuous learning", mode: "live", whenActive: "Each visit updates brain" },
  // 71–80 Commerce
  { id: 71, name: "Winner products", mode: "live", whenActive: "Product intelligence" },
  { id: 72, name: "Trend analysis", mode: "live", whenActive: "30-day timelines" },
  { id: 73, name: "Upsell", mode: "ai", whenActive: "From order patterns when synced" },
  { id: 74, name: "Cross-sell", mode: "ai", whenActive: "From product pairs when synced" },
  { id: 75, name: "Bundles", mode: "ai", whenActive: "Suggest bundle for weak + strong SKU" },
  { id: 76, name: "Pricing", mode: "blocked", whenActive: "", blockedNote: "No price elasticity model" },
  { id: 77, name: "Promotions", mode: "ai", whenActive: "Suggest offer for drop-off step" },
  { id: 78, name: "Higher AOV", mode: "live", whenActive: "AOV from orders when synced" },
  { id: 79, name: "Loyalty", mode: "ai", whenActive: "Repeat buyer rate when synced" },
  { id: 80, name: "Retention", mode: "live", whenActive: "Repeat buyers + segments" },
  // 81–90 Research
  { id: 81, name: "Competitors", mode: "blocked", whenActive: "", blockedNote: "Manual research only" },
  { id: 82, name: "Price tracking", mode: "blocked", whenActive: "", blockedNote: "No competitor prices" },
  { id: 83, name: "Amazon reviews", mode: "blocked", whenActive: "", blockedNote: "No Amazon integration" },
  { id: 84, name: "Customer pain points", mode: "live", whenActive: "Exit pages + checkout drops" },
  { id: 85, name: "Product ideas", mode: "ai", whenActive: "From search + exits only" },
  { id: 86, name: "Early trends", mode: "live", whenActive: "Visitor timeline trend" },
  { id: 87, name: "Social listening", mode: "blocked", whenActive: "", blockedNote: "No social API" },
  { id: 88, name: "Niche fit", mode: "ai", whenActive: "From traffic + product mix" },
  { id: 89, name: "Segmentation", mode: "live", whenActive: "Segments page data" },
  { id: 90, name: "Personas", mode: "live", whenActive: "Segment names + behavior" },
  // 91–100 Genius
  { id: 91, name: "Curiosity", mode: "ai", whenActive: "Question one assumption in data" },
  { id: 92, name: "Question assumptions", mode: "ai", whenActive: "If traffic but no sales, challenge source" },
  { id: 93, name: "Creativity", mode: "ai", whenActive: "One non-obvious angle max" },
  { id: 94, name: "Connect data dots", mode: "live", whenActive: "thinkingLine pattern" },
  { id: 95, name: "Human insight", mode: "ai", whenActive: "Plain language" },
  { id: 96, name: "Simple explanations", mode: "ai", whenActive: "Grade 6 English" },
  { id: 97, name: "Decide with partial data", mode: "live", whenActive: "confidence low/medium still acts" },
  { id: 98, name: "Learn from tests", mode: "ai", whenActive: "Ask merchant to mark action done" },
  { id: 99, name: "Small gains obsession", mode: "ai", whenActive: "One step not ten" },
  { id: 100, name: "Owner mindset", mode: "ai", whenActive: "P&L language not agency fluff" },
];

export function countSkillsByMode(activeDomainStatuses: BrainSignalStatus[]): {
  live: number;
  ai: number;
  blocked: number;
  trainableNow: number;
} {
  void activeDomainStatuses;
  const live = ALL_MARKETING_SKILLS.filter((s) => s.mode === "live").length;
  const ai = ALL_MARKETING_SKILLS.filter((s) => s.mode === "ai").length;
  const blocked = ALL_MARKETING_SKILLS.filter((s) => s.mode === "blocked").length;
  return { live, ai, blocked, trainableNow: live + ai };
}

/** Training block injected into every AI call — teaches what to do per skill */
export function buildSkillTrainingBlock(brain: StoreBrain): string {
  const activeDomainIds = new Set(
    brain.domains.filter((d) => d.status === "active").map((d) => d.id),
  );

  const domainSkillRanges: Record<string, [number, number]> = {
    strategy: [1, 10],
    analytics: [11, 20],
    cro: [21, 30],
    copy: [31, 40],
    psychology: [41, 50],
    paid: [51, 60],
    automation: [61, 70],
    ecommerce: [71, 80],
    research: [81, 90],
    genius: [91, 100],
  };

  const lines: string[] = [
    "SKILL TRAINING (100 skills — execute honestly):",
    `- Live (${ALL_MARKETING_SKILLS.filter((s) => s.mode === "live").length}): use store JSON — you MUST apply these when domain is active.`,
    `- AI (${ALL_MARKETING_SKILLS.filter((s) => s.mode === "ai").length}): write the action/copy/strategy — merchant runs it.`,
    `- Blocked (${ALL_MARKETING_SKILLS.filter((s) => s.mode === "blocked").length}): NEVER claim you analyzed external platforms. Say what's missing.`,
    "",
    "Active domains this session:",
  ];

  for (const domain of brain.domains) {
    if (domain.status !== "active") continue;
    const range = domainSkillRanges[domain.id];
    if (!range) continue;
    lines.push(`\n[${domain.label}]`);
    const skills = ALL_MARKETING_SKILLS.filter((s) => s.id >= range[0] && s.id <= range[1]);
    for (const skill of skills) {
      if (skill.mode === "blocked") {
        lines.push(`  #${skill.id} ${skill.name}: BLOCKED — ${skill.blockedNote}`);
      } else {
        lines.push(`  #${skill.id} ${skill.name} (${skill.mode}): ${skill.whenActive}`);
      }
    }
  }

  if (activeDomainIds.size === 0) {
    lines.push("  None fully active — focus on skills #1-2, #11, #62-63, #70, #96-97 (setup + tracking).");
  }

  lines.push(
    "",
    "Output rule: Apply every LIVE skill from active domains. Apply AI skills as written suggestions. Skip BLOCKED without faking data.",
  );

  return lines.join("\n");
}

export const CMO_PERSONA_PROMPT = `You think like a CMO of a growing Shopify brand — not a generic assistant.

Core rules:
1. Business goal first — tie to revenue or wasted spend avoided.
2. ROI thinking — prioritize what moves conversion fastest.
3. Data only — cite one number from JSON; never invent CPA, ROAS, or competitor stats.
4. One bottleneck — single biggest blocker in verdictSharp.
5. Merchant decides — suggest only; they approve and run.

Follow the SKILL TRAINING block in each request — it lists which of the 100 skills you must execute now.`;
