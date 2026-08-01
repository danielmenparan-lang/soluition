/**
 * Reset monthly usage counters for a shop (support / dev).
 * Run: npx tsx scripts/reset-usage.ts [shop-domain]
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(appRoot, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

const shopDomain =
  process.argv[2]?.trim() || "solution-vyndgruj.myshopify.com";

const { getShopByDomain } = await import("../app/services/shop.server");
const { getUsage, getShopSettings } = await import("../app/services/usage.server");
const { default: getSupabase } = await import("../app/supabase.server");

const shop = await getShopByDomain(shopDomain);
if (!shop) {
  throw new Error(`Shop not found: ${shopDomain}`);
}

const before = await getUsage(shop.id);
const settings = await getShopSettings(shop.id);
const now = new Date();
const periodStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;

const next = {
  ...settings,
  plan: "free",
  scansUsed: 0,
  outputsUsed: 0,
  usagePeriodStart: periodStart,
};

const supabase = getSupabase();
const { error } = await supabase
  .from("shops")
  .update({ settings: next })
  .eq("id", shop.id);

if (error) throw new Error(error.message);

const after = await getUsage(shop.id);
console.log(`Reset usage for ${shopDomain}`);
console.log(`Before: ${before.scansUsed} scans, ${before.outputsUsed} outputs`);
console.log(`After:  ${after.scansUsed} scans, ${after.outputsUsed} outputs`);
