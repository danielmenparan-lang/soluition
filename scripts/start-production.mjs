#!/usr/bin/env node
/**
 * Production startup for Render:
 * 1. Log env diagnostics (no secrets)
 * 2. Start HTTP server immediately (health checks pass)
 * 3. Set up Prisma/DB in the background
 */
import { spawn, execSync } from "node:child_process";

function logEnvDiagnostics() {
  const keys = [
    "DATABASE_URL",
    "SHOPIFY_API_KEY",
    "SHOPIFY_API_SECRET",
    "SHOPIFY_APP_URL",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "ANTHROPIC_API_KEY",
    "HOST",
    "PORT",
  ];

  console.log("[startup] Environment diagnostics:");
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (!value) {
      console.log(`  ${key}: MISSING`);
      continue;
    }
    if (key === "DATABASE_URL") {
      const host = value.includes("@")
        ? value.split("@")[1]?.split("/")[0]
        : "(unparseable)";
      const usesPooler = value.includes("pooler.supabase.com");
      const usesDirect = /@db\.[a-z0-9]+\.supabase\.co/i.test(value);
      console.log(
        `  ${key}: set (host=${host}, pooler=${usesPooler}, direct=${usesDirect})`,
      );
    } else {
      console.log(`  ${key}: set (${value.length} chars)`);
    }
  }
}

function ensureDatabaseUrlParams() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url || !url.startsWith("postgres")) return;

  if (!url.includes("sslmode=") && !url.includes("ssl=")) {
    const separator = url.includes("?") ? "&" : "?";
    process.env.DATABASE_URL = `${url}${separator}sslmode=require`;
    console.log("[startup] Added sslmode=require to DATABASE_URL");
  }
}

async function setupDatabase() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("[startup] DATABASE_URL missing — skipping DB setup");
    return;
  }

  if (!/^postgres(ql)?:\/\//.test(process.env.DATABASE_URL)) {
    console.error(
      "[startup] DATABASE_URL must be postgres:// — skipping DB setup",
    );
    return;
  }

  ensureDatabaseUrlParams();

  try {
    execSync("npx prisma generate", { stdio: "inherit" });
  } catch (error) {
    console.error("[startup] prisma generate failed:", error.message);
    return;
  }

  try {
    console.log("[startup] Running prisma migrate deploy...");
    execSync("npx prisma migrate deploy", {
      stdio: "inherit",
      timeout: 120_000,
    });
    console.log("[startup] Migrations applied");
    return;
  } catch (error) {
    console.warn("[startup] migrate deploy failed:", error.message);
  }

  try {
    console.log("[startup] Trying prisma db push fallback...");
    execSync("npx prisma db push --skip-generate", {
      stdio: "inherit",
      timeout: 120_000,
    });
    console.log("[startup] db push succeeded");
  } catch (error) {
    console.error(
      "[startup] Database setup failed completely. Shopify login will not work until DATABASE_URL is fixed.",
    );
    console.error("[startup]", error.message);
  }
}

logEnvDiagnostics();

try {
  execSync("node scripts/validate-env.mjs", { stdio: "inherit" });
} catch {
  console.warn(
    "[startup] Env validation failed — starting server anyway for /health debugging.",
  );
}

const port = process.env.PORT || "10000";
const host = process.env.HOST || "0.0.0.0";
console.log(`[startup] Launching HTTP server on ${host}:${port}...`);

const server = spawn(
  "npx",
  ["react-router-serve", "./build/server/index.js"],
  {
    stdio: "inherit",
    env: { ...process.env, HOST: host, PORT: port },
    shell: true,
  },
);

server.on("error", (error) => {
  console.error("[startup] Server process error:", error);
  process.exit(1);
});

server.on("exit", (code, signal) => {
  if (signal) {
    console.error(`[startup] Server stopped by signal ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 0);
});

process.on("SIGTERM", () => server.kill("SIGTERM"));
process.on("SIGINT", () => server.kill("SIGINT"));

void setupDatabase();
