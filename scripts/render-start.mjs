#!/usr/bin/env node
/**
 * Render production entrypoint — must bind PORT in THIS process (no spawn wrapper).
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
