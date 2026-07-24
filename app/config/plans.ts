export type PlanTier = "free" | "starter" | "unlimited";

export const PLAN_LIMITS: Record<
  PlanTier,
  { scans: number; outputs: number; label: string; price: string }
> = {
  free: { scans: 1, outputs: 1, label: "Free", price: "$0" },
  starter: { scans: 10, outputs: 10, label: "Starter", price: "$15/mo" },
  unlimited: {
    scans: Number.POSITIVE_INFINITY,
    outputs: Number.POSITIVE_INFINITY,
    label: "Unlimited",
    price: "$29/mo",
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
