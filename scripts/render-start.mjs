#!/usr/bin/env node
/**
 * Render production entrypoint — must bind PORT in THIS process (no spawn wrapper).
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

process.env.HOST = process.env.HOST || "0.0.0.0";

if (!process.env.PORT?.trim()) {
  console.error("[render-start] Missing PORT — Render injects PORT automatically.");
  console.error("[render-start] Remove any manual PORT override from Render Environment.");
  process.exit(1);
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
