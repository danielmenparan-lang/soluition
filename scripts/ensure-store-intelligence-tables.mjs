#!/usr/bin/env node
/**
 * Verify shop_orders + shop_products exist in Supabase (REST probe).
 */
const url = process.env.SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !key) {
  console.log("[ensure-store-intelligence] Supabase not configured — skip");
  process.exit(0);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
};

async function tableReady(name) {
  const response = await fetch(`${url}/rest/v1/${name}?select=id&limit=1`, {
    headers,
  });
  return response.ok;
}

const ordersOk = await tableReady("shop_orders");
const productsOk = await tableReady("shop_products");

if (ordersOk && productsOk) {
  console.log("[ensure-store-intelligence] shop_orders + shop_products: OK");
  process.exit(0);
}

console.error("[ensure-store-intelligence] Missing tables:");
if (!ordersOk) console.error("  - shop_orders");
if (!productsOk) console.error("  - shop_products");
console.error(
  "[ensure-store-intelligence] Run supabase/migrations/002_store_intelligence.sql in Supabase SQL Editor.",
);
process.exit(1);
