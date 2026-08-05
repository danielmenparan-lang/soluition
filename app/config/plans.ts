export type PlanTier = "free" | "starter" | "pro";

export type UsagePeriod = "lifetime" | "weekly" | "unlimited";

export type PlanDefinition = {
  scans: number;
  outputs: number;
  visibleRecommendations: number;
  label: string;
  price: string;
  priceDetail: string;
  billingAmount: number;
  description: string;
  highlights: string[];
  usagePeriod: UsagePeriod;
};

export const PLAN_LIMITS: Record<PlanTier, PlanDefinition> = {
  free: {
    scans: 3,
    outputs: 2,
    visibleRecommendations: 3,
    label: "Free",
    price: "$0",
    priceDetail: "One-time trial",
    billingAmount: 0,
    usagePeriod: "lifetime",
    description:
      "Try once — 3 marketing scans and 2 chat messages, lifetime per store.",
    highlights: [
      "3 marketing scans (once ever)",
      "2 chat messages (once ever)",
      "Ad readiness score",
      "Funnel & drop-off view",
      "Upgrade for weekly limits",
    ],
  },
  starter: {
    scans: 10,
    outputs: 10,
    visibleRecommendations: 10,
    label: "Starter",
    price: "$9.99",
    priceDetail: "$9.99 / month",
    billingAmount: 9.99,
    usagePeriod: "weekly",
    description:
      "10 marketing scans and 10 chat messages per week — reset every Monday.",
    highlights: [
      "10 scans / week",
      "10 chat messages / week",
      "All marketing action cards",
      "Ad readiness + funnel",
      "Shopify order sync",
    ],
  },
  pro: {
    scans: Number.POSITIVE_INFINITY,
    outputs: Number.POSITIVE_INFINITY,
    visibleRecommendations: Number.POSITIVE_INFINITY,
    label: "Pro",
    price: "$19.99",
    priceDetail: "$19.99 / month",
    billingAmount: 19.99,
    usagePeriod: "unlimited",
    description: "Unlimited scans, chat, order sync, and repeat-buyer insights.",
    highlights: [
      "Unlimited scans & chat",
      "Unlimited marketing actions",
      "Shopify order + catalog sync",
      "LTV & repeat-buyer insights",
      "Weekly AI summaries",
    ],
  },
};

export type UsageSummary = {
  plan: PlanTier;
  scansUsed: number;
  outputsUsed: number;
  periodStart: string;
  scanLimit: string;
  outputLimit: string;
  scansRemaining: number;
  outputsRemaining: number;
  planLabel: string;
  planPrice: string;
  periodLabel: string;
  visibleRecommendations: number;
};

export function formatScanLimit(scans: number): string {
  return scans === Number.POSITIVE_INFINITY ? "Unlimited" : String(scans);
}

export function formatOutputLimit(outputs: number): string {
  return outputs === Number.POSITIVE_INFINITY ? "Unlimited" : String(outputs);
}

export function getRecommendationCap(plan: PlanTier): number {
  const limit = PLAN_LIMITS[plan].visibleRecommendations;
  return limit === Number.POSITIVE_INFINITY ? 15 : limit;
}

export function periodLabelFor(plan: PlanTier): string {
  const period = PLAN_LIMITS[plan].usagePeriod;
  if (period === "lifetime") return "one-time";
  if (period === "weekly") return "this week";
  return "unlimited";
}

/** Maps legacy stored plan values to current tiers */
export function normalizePlanTier(value: unknown): PlanTier {
  if (value === "pro" || value === "unlimited") return "pro";
  if (value === "starter") return "starter";
  return "free";
}

export function isPaidPlan(plan: PlanTier): boolean {
  return plan === "starter" || plan === "pro";
}
