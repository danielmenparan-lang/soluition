#!/usr/bin/env node
/**
 * Validates required production env vars before Render startup.
 * Exits with code 1 and clear messages when misconfigured.
 */
const required = [
  "DATABASE_URL",
  "SHOPIFY_API_KEY",
  "SHOPIFY_API_SECRET",
  "SHOPIFY_APP_URL",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

let failed = false;

for (const key of required) {
  const value = process.env[key]?.trim();
  if (!value) {
    console.error(`[env] Missing required variable: ${key}`);
    failed = true;
  }
}

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
if (databaseUrl && !/^postgres(ql)?:\/\//.test(databaseUrl)) {
  console.error(
    "[env] DATABASE_URL must start with postgresql:// or postgres:// (SQLite file URLs break Prisma on Render).",
  );
  failed = true;
}

if (failed) {
  console.error(
    "[env] Fix Environment variables in Render Dashboard, then redeploy.",
  );
  process.exit(1);
}

console.log("[env] Production environment looks OK.");
