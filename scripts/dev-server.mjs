#!/usr/bin/env node
/**
 * Local dev entry — migrate only when Prisma sessions are required.
 */
import { execSync, spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const useSupabase = Boolean(
  process.env.SUPABASE_URL?.trim() &&
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
);
const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";

if (!useSupabase && databaseUrl) {
  console.log("[dev] Running prisma migrate deploy...");
  execSync("npx prisma migrate deploy", { cwd: appRoot, stdio: "inherit" });
} else {
  console.log(
    "[dev] Skipping prisma migrate (Supabase sessions or no DATABASE_URL)",
  );
}

const child = spawn("npx react-router dev", {
  cwd: appRoot,
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
