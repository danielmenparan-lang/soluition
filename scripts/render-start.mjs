#!/usr/bin/env node
/**
 * Fast Render startup — start the HTTP server immediately.
 * Prisma migrations run in the background and must not block health checks.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(root, "..");

function logStartup() {
  const keys = [
    "NODE_ENV",
    "NODE_VERSION",
    "PORT",
    "HOST",
    "DATABASE_URL",
    "SHOPIFY_API_KEY",
    "SHOPIFY_API_SECRET",
    "SHOPIFY_APP_URL",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  console.log("[render-start] Boot diagnostics:");
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
      continue;
    }
    console.log(`  ${key}: set (${value.length} chars)`);
  }

  if (process.env.PORT && process.env.PORT !== "10000") {
    console.warn(
      `[render-start] PORT=${process.env.PORT}. Render sets PORT automatically — do not override unless Render docs say so.`,
    );
  }
}

function runBackgroundMigrate() {
  const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
  if (!databaseUrl.startsWith("postgres")) {
    console.warn("[render-start] Skipping background migrate — no postgres DATABASE_URL");
    return;
  }

  const migrate = spawn(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["prisma", "migrate", "deploy"],
    {
      cwd: appRoot,
      stdio: "inherit",
      env: process.env,
      detached: true,
    },
  );
  migrate.unref();
  console.log("[render-start] Started background prisma migrate deploy");
}

logStartup();
runBackgroundMigrate();

const serveCli = path.join(
  appRoot,
  "node_modules/@react-router/serve/dist/cli.js",
);
const serverBuild = path.join(appRoot, "build/server/index.js");

console.log(
  `[render-start] Listening on ${process.env.HOST || "0.0.0.0"}:${process.env.PORT || "10000"}`,
);

const server = spawn(process.execPath, [serveCli, serverBuild], {
  cwd: appRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    HOST: process.env.HOST || "0.0.0.0",
  },
});

server.on("error", (error) => {
  console.error("[render-start] Failed to launch server:", error);
  process.exit(1);
});

server.on("exit", (code, signal) => {
  console.error(`[render-start] Server exited (code=${code}, signal=${signal})`);
  process.exit(code ?? 1);
});

process.on("SIGTERM", () => server.kill("SIGTERM"));
process.on("SIGINT", () => server.kill("SIGINT"));
