export type PlanTier = "free" | "starter" | "pro";

export type UsagePeriod = "monthly" | "daily";

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
    scans: 1,
    outputs: 1,
    visibleRecommendations: 2,
    label: "Free",
    price: "$0",
    priceDetail: "Free forever",
    billingAmount: 0,
    usagePeriod: "monthly",
    description:
      "Your store data turned into marketing actions — 2 action cards and 1 chat question.",
    highlights: [
      "2 marketing action cards",
      "1 chat question / month",
      "Store data → marketing suggestions",
      "Ad readiness score",
      "Funnel & drop-off view",
    ],
  },
  starter: {
    scans: 10,
    outputs: 5,
    visibleRecommendations: 10,
    label: "Starter",
    price: "$9.99",
    priceDetail: "$9.99 / month",
    billingAmount: 9.99,
    usagePeriod: "daily",
    description:
      "10 marketing scans and 5 chat messages per day — your data, daily action ideas.",
    highlights: [
      "10 recommendation scans / day",
      "5 chat messages / day",
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
    usagePeriod: "daily",
    description:
      "Unlimited marketing scans, chat, order sync, and repeat-buyer insights.",
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
  return scans === Number.POSITIVE_INFINITY
    ? "Unlimited"
    : String(scans);
}

export function formatOutputLimit(outputs: number): string {
  return outputs === Number.POSITIVE_INFINITY
    ? "Unlimited"
    : String(outputs);
}

export function getRecommendationCap(plan: PlanTier): number {
  const limit = PLAN_LIMITS[plan].visibleRecommendations;
  return limit === Number.POSITIVE_INFINITY ? 15 : limit;
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
