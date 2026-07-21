#!/usr/bin/env node
/**
 * Validates required production env vars before Render startup.
 * Exits with code 1 and clear messages when misconfigured.
 */
const required = [
  "DATABASE_URL",
  "SHOPIFY_APP_URL",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const recommended = ["SHOPIFY_API_KEY", "SHOPIFY_API_SECRET"];

let failed = false;

for (const key of required) {
  const value = process.env[key]?.trim();
  if (!value) {
    console.error(`[env] Missing required variable: ${key}`);
    failed = true;
  }
}

for (const key of recommended) {
  const value = process.env[key]?.trim();
  if (!value) {
    console.warn(
      `[env] Warning: ${key} is empty — server will start, but Shopify login won't work yet.`,
    );
  }
}

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
if (databaseUrl && !/^postgres(ql)?:\/\//.test(databaseUrl)) {
  console.error(
    "[env] DATABASE_URL must start with postgresql:// or postgres:// (SQLite file URLs break Prisma on Render).",
  );
  failed = true;
}

// Render is IPv4-only — direct db.*.supabase.co connections use IPv6 and hang/fail.
if (
  databaseUrl &&
  /@db\.[a-z0-9]+\.supabase\.co/i.test(databaseUrl) &&
  !databaseUrl.includes("pooler.supabase.com")
) {
  console.error(
    "[env] DATABASE_URL uses Supabase direct connection (db.*.supabase.co).",
  );
  console.error(
    "[env] Render is IPv4-only — use Session pooler from Supabase Connect button:",
  );
  console.error(
    "[env] postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres?connect_timeout=30",
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
