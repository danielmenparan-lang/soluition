export type PlanTier = "free" | "pro";

export type PlanDefinition = {
  scans: number;
  outputs: number;
  label: string;
  price: string;
  priceDetail: string;
  billingAmount: number;
  description: string;
  highlights: string[];
};

export const PLAN_LIMITS: Record<PlanTier, PlanDefinition> = {
  free: {
    scans: 2,
    outputs: 3,
    label: "Free",
    price: "$0",
    priceDetail: "Free forever",
    billingAmount: 0,
    description:
      "Conversion funnel, Store Health Score, and ranked AI fixes — free tier to diagnose blockers.",
    highlights: [
      "2 scans per month",
      "3 AI outputs per month",
      "Visitor tracking & funnel",
      "Store Health Score",
      "Top fixes ranked by impact",
    ],
  },
  pro: {
    scans: Number.POSITIVE_INFINITY,
    outputs: Number.POSITIVE_INFINITY,
    label: "Pro",
    price: "$29",
    priceDetail: "$29 / month",
    billingAmount: 29,
    description:
      "Full conversion intelligence — order sync, LTV, repeat buyers, unlimited AI fixes.",
    highlights: [
      "Unlimited scans & AI outputs",
      "Shopify order + catalog sync",
      "LTV, RFM & repeat-buyer insights",
      "Funnel + exit-page diagnosis",
      "Weekly conversion reports",
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
};

export function formatScanLimit(scans: number): string {
  return scans === Number.POSITIVE_INFINITY
    ? "Unlimited scans"
    : `${scans} scan${scans === 1 ? "" : "s"}`;
}

export function formatOutputLimit(outputs: number): string {
  return outputs === Number.POSITIVE_INFINITY
    ? "Unlimited AI outputs"
    : `${outputs} AI output${outputs === 1 ? "" : "s"}`;
}

/** Maps legacy stored plan values to current tiers */
export function normalizePlanTier(value: unknown): PlanTier {
  if (value === "pro" || value === "starter" || value === "unlimited") {
    return "pro";
  }
  return "free";
}
