import { createRequire } from "node:module";

const nodeRequire = createRequire(import.meta.url);

if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = nodeRequire("ws");
}
