/**
 * Test: Supabase data → Claude → save recommendations.
 * Run: npx tsx scripts/test-ai-pipeline.ts [shop-domain]
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

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

const nodeRequire = createRequire(import.meta.url);
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = nodeRequire("ws");
}

await import(pathToFileURL(path.join(appRoot, "app/node-polyfills.server.ts")).href);

const { getOrCreateShop } = await import("../app/services/shop.server");
const { generateRecommendations, getRecommendations } = await import(
  "../app/services/ai.server"
);
const { prepareAnalyticsSummary } = await import(
  "../app/services/analytics.server"
);

const shopDomain =
  process.argv[2]?.trim() || "solution-vyndgruj.myshopify.com";

async function main() {
  console.log("Shop:", shopDomain);
  console.log("ANTHROPIC_API_KEY:", process.env.ANTHROPIC_API_KEY ? "set" : "MISSING");
  console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "set" : "MISSING");

  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const shop = await getOrCreateShop(shopDomain);
  console.log("Shop ID:", shop.id, "tracking:", shop.tracking_id);

  const summary = await prepareAnalyticsSummary(shop.id);
  console.log("Analytics summary preview:", summary.slice(0, 300), "...");

  console.log("Calling Claude to generate recommendations...");
  const created = await generateRecommendations(shop.id);
  console.log("Created", created.length, "recommendations");

  const active = await getRecommendations(shop.id);
  for (const rec of active.slice(0, 3)) {
    console.log("-", rec.title, `(${rec.priority})`);
  }

  console.log("Pipeline OK");
}

main().catch((error) => {
  console.error("Pipeline FAILED:", error instanceof Error ? error.message : error);
  process.exit(1);
});
