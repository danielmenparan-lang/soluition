#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { validateDatabaseUrl } from "./validate-database-url.mjs";

const envPath = new URL("../.env", import.meta.url);
let envText = "";
try {
  envText = readFileSync(envPath, "utf8");
} catch {
  console.log("No local .env file found");
  process.exit(1);
}

const match = envText.match(/^DATABASE_URL=(.+)$/m);
const databaseUrl = match?.[1]?.trim().replace(/^["']|["']$/g, "") ?? "";
const check = validateDatabaseUrl(databaseUrl);

console.log("Local .env DATABASE_URL:");
console.log(JSON.stringify({ formatValid: check.valid, issues: check.issues, parsed: check.parsed }, null, 2));

if (!databaseUrl || !check.valid) {
  process.exit(1);
}

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

try {
  await prisma.$queryRaw`SELECT 1`;
  console.log("Connection: OK");
  const count = await prisma.session.count();
  console.log(`Session table: OK (${count} rows)`);
} catch (error) {
  console.log("Connection: FAILED");
  const message = error instanceof Error ? error.message : String(error);
  console.log(message.split("\n").slice(0, 4).join(" "));
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
