#!/usr/bin/env node
/**
 * Render production entrypoint — must bind PORT in THIS process (no spawn wrapper).
 */
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { validateDatabaseUrl } from "./validate-database-url.mjs";

const nodeRequire = createRequire(import.meta.url);
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = nodeRequire("ws");
}

const EXPECTED_CLIENT_ID = "00eb38f774ffba914d98a6800f4c5df5";
const EXPECTED_APP_URL = "https://shopify-marketing-solution.onrender.com";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

process.env.HOST = process.env.HOST || "0.0.0.0";

if (!process.env.PORT?.trim()) {
  console.error("[render-start] Missing PORT — Render injects PORT automatically.");
  process.exit(1);
}

const apiKey = process.env.SHOPIFY_API_KEY?.trim() ?? "";
const appUrl = process.env.SHOPIFY_APP_URL?.trim() ?? "";

if (apiKey && !apiKey.startsWith(EXPECTED_CLIENT_ID.slice(0, 8))) {
  console.error(
    `[render-start] WRONG SHOPIFY_API_KEY (${apiKey.slice(0, 8)}...) — expected ${EXPECTED_CLIENT_ID.slice(0, 8)}... (solution app)`,
  );
  console.error(
    "[render-start] You likely pasted Profit Brain keys (fe4d2284...) — fix Render Environment.",
  );
}

if (appUrl && appUrl.includes("fly.dev")) {
  console.error(
    `[render-start] WRONG SHOPIFY_APP_URL (${appUrl}) — must be ${EXPECTED_APP_URL}`,
  );
}

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
const dbCheck = validateDatabaseUrl(databaseUrl);
const useSupabaseSessions = Boolean(
  process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
);

if (useSupabaseSessions) {
  console.log("[render-start] OAuth sessions via Supabase REST — skipping prisma migrate");
  try {
    execSync("node scripts/ensure-session-table.mjs", {
      cwd: appRoot,
      stdio: "inherit",
      env: process.env,
    });
  } catch {
    console.error("[render-start] Session table missing — app login will fail until SQL is run");
  }
} else if (!dbCheck.valid) {
  console.error("[render-start] DATABASE_URL problems:");
  for (const issue of dbCheck.issues) {
    console.error(`  - ${issue}`);
  }
} else if (dbCheck.parsed) {
  console.log(
    `[render-start] DATABASE_URL format OK (user=${dbCheck.parsed.username}, host=${dbCheck.parsed.host}:${dbCheck.parsed.port})`,
  );

  try {
    console.log("[render-start] Running prisma migrate deploy (creates Session table)...");
    execSync("npx prisma migrate deploy", {
      cwd: appRoot,
      stdio: "inherit",
      env: process.env,
    });
    console.log("[render-start] Prisma migrate deploy: OK");
  } catch (error) {
    console.error(
      "[render-start] prisma migrate deploy failed — fix DATABASE_URL in Render, then redeploy once.",
    );
    if (error instanceof Error && error.message) {
      console.error(`[render-start] ${error.message}`);
    }
  }
}

process.on("unhandledRejection", (reason) => {
  console.error("[render-start] Unhandled rejection (keeping process alive):", reason);
});

console.log(
  `[render-start] Starting on ${process.env.HOST}:${process.env.PORT}`,
);

process.argv = [
  process.argv[0],
  "react-router-serve",
  path.join(appRoot, "build/server/index.js"),
];

await import(
  pathToFileURL(
    path.join(appRoot, "node_modules/@react-router/serve/dist/cli.js"),
  ).href
);
