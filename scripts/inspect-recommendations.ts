import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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

await import(pathToFileURL(path.join(appRoot, "app/node-polyfills.server.ts")).href);

const { getOrCreateShop } = await import("../app/services/shop.server");
const { getRecommendations } = await import("../app/services/ai.server");
const { prepareAnalyticsSummary } = await import("../app/services/analytics.server");

const shopDomain = process.argv[2]?.trim() || "solution-vyndgruj.myshopify.com";
const shop = await getOrCreateShop(shopDomain);
const recs = await getRecommendations(shop.id);
const summary = await prepareAnalyticsSummary(shop.id);

console.log("=== ANALYTICS ===");
console.log(summary);
console.log(`\n=== RECOMMENDATIONS (${recs.length}) ===`);
for (const rec of recs) {
  console.log("\n---");
  console.log("TITLE:", rec.title);
  console.log("CATEGORY:", rec.category, "| PRIORITY:", rec.priority);
  console.log("DESC:", rec.description);
  console.log("IMPACT:", rec.expected_impact);
  console.log("ACTIONS:", JSON.stringify(rec.action_items, null, 2));
}
