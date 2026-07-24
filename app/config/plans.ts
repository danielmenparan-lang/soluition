export type PlanTier = "free" | "starter" | "unlimited";

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
    scans: 1,
    outputs: 2,
    label: "Free",
    price: "$0",
    priceDetail: "Free forever",
    billingAmount: 0,
    description: "Try Solution on your store — tracking, analytics, and your first AI insights.",
    highlights: [
      "1 scan per month",
      "2 AI outputs per month",
      "Visitor tracking & analytics",
      "Setup guide included",
    ],
  },
  starter: {
    scans: 5,
    outputs: 5,
    label: "Starter",
    price: "$9",
    priceDetail: "$9 / month",
    billingAmount: 9,
    description: "For stores ready to run regular scans, recommendations, and advisor chats.",
    highlights: [
      "5 scans per month",
      "5 AI outputs per month",
      "Recommendations & weekly reports",
      "Marketing advisor chat",
      "All Free features",
    ],
  },
  unlimited: {
    scans: Number.POSITIVE_INFINITY,
    outputs: Number.POSITIVE_INFINITY,
    label: "Unlimited",
    price: "$19",
    priceDetail: "$19 / month",
    billingAmount: 19,
    description: "No caps — for active stores using AI weekly across chat, reports, and segments.",
    highlights: [
      "Unlimited scans",
      "Unlimited AI outputs",
      "Recommendations & weekly reports",
      "Marketing advisor chat",
      "Priority for growing stores",
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
