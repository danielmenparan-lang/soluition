#!/usr/bin/env node
/**
 * Verify Shopify OAuth Session table exists in Supabase (REST API).
 */
import { createRequire } from "node:module";

const nodeRequire = createRequire(import.meta.url);
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = nodeRequire("ws");
}

const url = process.env.SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !key) {
  console.error("[ensure-session] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const response = await fetch(`${url}/rest/v1/Session?select=id&limit=1`, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
  },
});

if (response.ok) {
  console.log("[ensure-session] Session table: OK");
  process.exit(0);
}

const body = await response.text();
console.error("[ensure-session] Session table check failed:", response.status, body);
console.error("[ensure-session] Run supabase/session-table.sql in Supabase SQL Editor once.");
process.exit(1);
