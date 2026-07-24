#!/usr/bin/env node
/**
 * Shopify CLI predev — skip prisma when Supabase sessions are used or client exists.
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const enginePath = path.join(
  appRoot,
  "node_modules",
  ".prisma",
  "client",
  "query_engine-windows.dll.node",
);

const useSupabase = Boolean(
  process.env.SUPABASE_URL?.trim() &&
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
);

if (useSupabase && existsSync(enginePath)) {
  console.log(
    "[predev] Supabase sessions + Prisma client present — skipping generate",
  );
  process.exit(0);
}

if (existsSync(enginePath)) {
  console.log("[predev] Prisma client already generated — skipping");
  process.exit(0);
}

try {
  execSync("npx prisma generate", { cwd: appRoot, stdio: "inherit" });
} catch (error) {
  if (existsSync(enginePath)) {
    console.warn(
      "[predev] prisma generate failed but client exists (file lock?) — continuing",
    );
    process.exit(0);
  }
  throw error;
}
