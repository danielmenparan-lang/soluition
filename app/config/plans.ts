export type PlanTier = "free" | "starter" | "unlimited";

export const PLAN_LIMITS: Record<
  PlanTier,
  { scans: number; outputs: number; label: string; price: string; billingAmount: number }
> = {
  free: { scans: 1, outputs: 2, label: "Free", price: "$0", billingAmount: 0 },
  starter: {
    scans: 5,
    outputs: 5,
    label: "Starter",
    price: "$9/mo",
    billingAmount: 9,
  },
  unlimited: {
    scans: Number.POSITIVE_INFINITY,
    outputs: Number.POSITIVE_INFINITY,
    label: "Unlimited",
    price: "$19/mo",
    billingAmount: 19,
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
  return scans === Number.POSITIVE_INFINITY ? "Unlimited scans" : `${scans} scan${scans === 1 ? "" : "s"}`;
}

export function formatOutputLimit(outputs: number): string {
  return outputs === Number.POSITIVE_INFINITY
    ? "Unlimited AI outputs"
    : `${outputs} AI output${outputs === 1 ? "" : "s"}`;
}
