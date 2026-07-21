#!/usr/bin/env node
/**
 * Minimal production startup for Render (Docker/Alpine-safe).
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
      console.log(
        `  ${key}: set (host=${host}, pooler=${value.includes("pooler.supabase.com")})`,
      );
    } else {
      console.log(`  ${key}: set (${value.length} chars)`);
    }
  }
}

function setupDatabaseAsync() {
  if (!process.env.DATABASE_URL?.trim()?.startsWith("postgres")) {
    console.warn("[startup] Skipping DB migrate — no postgres DATABASE_URL");
    return;
  }

  let url = process.env.DATABASE_URL.trim();
  if (!url.includes("sslmode=")) {
    url += url.includes("?") ? "&sslmode=require" : "?sslmode=require";
    process.env.DATABASE_URL = url;
  }

  const migrate = spawn(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["prisma", "migrate", "deploy"],
    { stdio: "inherit", env: process.env },
  );

  migrate.on("exit", (code) => {
    if (code === 0) {
      console.log("[startup] Migrations OK");
      return;
    }
    console.warn("[startup] migrate failed, trying db push...");
    spawn(
      process.platform === "win32" ? "npx.cmd" : "npx",
      ["prisma", "db", "push", "--skip-generate"],
      { stdio: "inherit", env: process.env },
    );
  });
}

logEnvDiagnostics();

try {
  execSync("npx prisma generate", { stdio: "inherit", timeout: 120_000 });
} catch (error) {
  console.error("[startup] prisma generate failed:", error.message);
  process.exit(1);
}

setupDatabaseAsync();

console.log(
  `[startup] Starting server on ${process.env.HOST || "0.0.0.0"}:${process.env.PORT || "10000"}...`,
);

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const server = spawn(npm, ["run", "start"], {
  stdio: "inherit",
  env: {
    ...process.env,
    HOST: process.env.HOST || "0.0.0.0",
    PORT: process.env.PORT || "10000",
  },
});

server.on("error", (error) => {
  console.error("[startup] Failed to launch server:", error);
  process.exit(1);
});

server.on("exit", (code, signal) => {
  console.error(`[startup] Server exited (code=${code}, signal=${signal})`);
  process.exit(code ?? 1);
});

process.on("SIGTERM", () => server.kill("SIGTERM"));
process.on("SIGINT", () => server.kill("SIGINT"));
