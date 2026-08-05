import getSupabase from "../supabase.server";
import { STARTER_PLAN, UNLIMITED_PLAN, PRO_PLAN } from "../shopify.server";
import {
  PLAN_LIMITS,
  normalizePlanTier,
  periodLabelFor,
  type PlanTier,
  type UsageSummary,
} from "../config/plans";

export type { PlanTier, UsageSummary };

type UsageSettings = {
  plan: PlanTier;
  scansUsed: number;
  outputsUsed: number;
  periodStart: string;
};

const LIFETIME_PERIOD = "lifetime";

function currentWeekStartUtc(): string {
  const now = new Date();
  const weekday = now.getUTCDay();
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysFromMonday),
  );
  return monday.toISOString().slice(0, 10);
}

function currentPeriodStart(plan: PlanTier): string {
  const period = PLAN_LIMITS[plan].usagePeriod;
  if (period === "lifetime") return LIFETIME_PERIOD;
  if (period === "weekly") return currentWeekStartUtc();
  return "unlimited";
}

function parseSettings(raw: unknown): UsageSettings {
  const s = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const plan = normalizePlanTier(s.plan);
  const periodStart = currentPeriodStart(plan);
  const base: UsageSettings = {
    plan,
    scansUsed: 0,
    outputsUsed: 0,
    periodStart,
  };

  const storedPeriod =
    typeof s.usagePeriodStart === "string" ? s.usagePeriodStart : periodStart;

  if (plan === "free") {
    const scansUsed = typeof s.scansUsed === "number" ? s.scansUsed : 0;
    const outputsUsed = typeof s.outputsUsed === "number" ? s.outputsUsed : 0;
    return {
      plan,
      scansUsed,
      outputsUsed,
      periodStart: LIFETIME_PERIOD,
    };
  }

  if (storedPeriod !== periodStart) {
    return base;
  }

  return {
    plan,
    scansUsed: typeof s.scansUsed === "number" ? s.scansUsed : 0,
    outputsUsed: typeof s.outputsUsed === "number" ? s.outputsUsed : 0,
    periodStart: storedPeriod,
  };
}

export function planFromSubscriptionName(name: string | undefined): PlanTier {
  if (!name) return "free";
  if (name === STARTER_PLAN) return "starter";
  if (name === PRO_PLAN || name === UNLIMITED_PLAN) return "pro";
  return "free";
}

export async function getShopSettings(shopId: string): Promise<Record<string, unknown>> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("shops")
    .select("settings")
    .eq("id", shopId)
    .maybeSingle();
  if (!data?.settings || typeof data.settings !== "object") return {};
  return data.settings as Record<string, unknown>;
}

export async function getUsage(shopId: string): Promise<UsageSettings> {
  const settings = await getShopSettings(shopId);
  return parseSettings(settings);
}

async function saveUsage(shopId: string, usage: UsageSettings): Promise<void> {
  const supabase = getSupabase();
  const settings = await getShopSettings(shopId);
  const next = {
    ...settings,
    plan: usage.plan,
    scansUsed: usage.scansUsed,
    outputsUsed: usage.outputsUsed,
    usagePeriodStart: usage.periodStart,
  };
  const { error } = await supabase
    .from("shops")
    .update({ settings: next })
    .eq("id", shopId);
  if (error) throw new Error(error.message);
}

export async function syncPlanFromBilling(
  shopId: string,
  plan: PlanTier,
): Promise<UsageSettings> {
  const usage = await getUsage(shopId);
  if (usage.plan === plan) return usage;
  const updated = {
    ...usage,
    plan,
    scansUsed: 0,
    outputsUsed: 0,
    periodStart: currentPeriodStart(plan),
  };
  await saveUsage(shopId, updated);
  return updated;
}

export function usageSummary(usage: UsageSettings): UsageSummary {
  const limits = PLAN_LIMITS[usage.plan];
  const scanLimit = formatLimit(limits.scans);
  const outputLimit = formatLimit(limits.outputs);

  return {
    ...usage,
    scanLimit,
    outputLimit,
    scansRemaining: remaining(limits.scans, usage.scansUsed),
    outputsRemaining: remaining(limits.outputs, usage.outputsUsed),
    planLabel: limits.label,
    planPrice: limits.price,
    periodLabel: periodLabelFor(usage.plan),
    visibleRecommendations: limits.visibleRecommendations,
  };
}

function formatLimit(value: number): string {
  return value === Number.POSITIVE_INFINITY ? "Unlimited" : String(value);
}

function remaining(limit: number, used: number): number {
  if (limit === Number.POSITIVE_INFINITY) return Number.POSITIVE_INFINITY;
  return Math.max(0, limit - used);
}

export class UsageLimitError extends Error {
  kind: "scan" | "output";
  constructor(kind: "scan" | "output", plan: PlanTier) {
    const period = periodLabelFor(plan);
    super(
      kind === "scan"
        ? `Marketing scan limit reached (${period}). Upgrade on Billing.`
        : `Chat limit reached (${period}). Upgrade on Billing.`,
    );
    this.name = "UsageLimitError";
    this.kind = kind;
  }
}

function canUse(used: number, limit: number): boolean {
  if (limit === Number.POSITIVE_INFINITY) return true;
  return used < limit;
}

export async function assertCanScan(shopId: string): Promise<UsageSettings> {
  const usage = await getUsage(shopId);
  const limit = PLAN_LIMITS[usage.plan].scans;
  if (!canUse(usage.scansUsed, limit)) throw new UsageLimitError("scan", usage.plan);
  return usage;
}

export async function assertCanOutput(shopId: string): Promise<UsageSettings> {
  const usage = await getUsage(shopId);
  const limit = PLAN_LIMITS[usage.plan].outputs;
  if (!canUse(usage.outputsUsed, limit)) throw new UsageLimitError("output", usage.plan);
  return usage;
}

export async function recordScan(shopId: string): Promise<void> {
  const usage = await assertCanScan(shopId);
  await saveUsage(shopId, { ...usage, scansUsed: usage.scansUsed + 1 });
}

export async function recordOutput(shopId: string): Promise<void> {
  const usage = await assertCanOutput(shopId);
  await saveUsage(shopId, { ...usage, outputsUsed: usage.outputsUsed + 1 });
}
