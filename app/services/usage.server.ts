import getSupabase from "../supabase.server";
import { STARTER_PLAN, UNLIMITED_PLAN } from "../shopify.server";
import { PLAN_LIMITS, type PlanTier, type UsageSummary } from "../config/plans";

export type { PlanTier, UsageSummary };

type UsageSettings = {
  plan: PlanTier;
  scansUsed: number;
  outputsUsed: number;
  periodStart: string;
};

function currentPeriodStart(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function parseSettings(raw: unknown): UsageSettings {
  const periodStart = currentPeriodStart();
  const base: UsageSettings = {
    plan: "free",
    scansUsed: 0,
    outputsUsed: 0,
    periodStart,
  };

  if (!raw || typeof raw !== "object") return base;
  const s = raw as Record<string, unknown>;
  const storedPeriod =
    typeof s.usagePeriodStart === "string" ? s.usagePeriodStart : periodStart;

  if (storedPeriod !== periodStart) {
    return { ...base, plan: normalizePlan(s.plan) };
  }

  return {
    plan: normalizePlan(s.plan),
    scansUsed: typeof s.scansUsed === "number" ? s.scansUsed : 0,
    outputsUsed: typeof s.outputsUsed === "number" ? s.outputsUsed : 0,
    periodStart: storedPeriod,
  };
}

function normalizePlan(value: unknown): PlanTier {
  if (value === "starter" || value === "unlimited") return value;
  return "free";
}

export function planFromSubscriptionName(name: string | undefined): PlanTier {
  if (!name) return "free";
  if (name === UNLIMITED_PLAN) return "unlimited";
  if (name === STARTER_PLAN) return "starter";
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
  const updated = { ...usage, plan };
  await saveUsage(shopId, updated);
  return updated;
}

export function usageSummary(usage: UsageSettings) {
  const limits = PLAN_LIMITS[usage.plan];
  const scanLimit =
    limits.scans === Number.POSITIVE_INFINITY ? "Unlimited" : String(limits.scans);
  const outputLimit =
    limits.outputs === Number.POSITIVE_INFINITY
      ? "Unlimited"
      : String(limits.outputs);
  return {
    ...usage,
    scanLimit,
    outputLimit,
    scansRemaining:
      limits.scans === Number.POSITIVE_INFINITY
        ? Number.POSITIVE_INFINITY
        : Math.max(0, limits.scans - usage.scansUsed),
    outputsRemaining:
      limits.outputs === Number.POSITIVE_INFINITY
        ? Number.POSITIVE_INFINITY
        : Math.max(0, limits.outputs - usage.outputsUsed),
    planLabel: limits.label,
    planPrice: limits.price,
  };
}

export class UsageLimitError extends Error {
  kind: "scan" | "output";
  constructor(kind: "scan" | "output") {
    super(
      kind === "scan"
        ? "Scan limit reached. Upgrade your plan on the Billing page."
        : "Output limit reached. Upgrade your plan on the Billing page.",
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
  if (!canUse(usage.scansUsed, limit)) throw new UsageLimitError("scan");
  return usage;
}

export async function assertCanOutput(shopId: string): Promise<UsageSettings> {
  const usage = await getUsage(shopId);
  const limit = PLAN_LIMITS[usage.plan].outputs;
  if (!canUse(usage.outputsUsed, limit)) throw new UsageLimitError("output");
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
