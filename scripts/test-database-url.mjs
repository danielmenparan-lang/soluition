#!/usr/bin/env node
/**
 * Test DATABASE_URL before putting it in Render.
 * Usage: DATABASE_URL="postgresql://..." node scripts/test-database-url.mjs
 */
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

console.log("Checking DATABASE_URL format...");

if (!databaseUrl.startsWith("postgres")) {
  console.error("DATABASE_URL must start with postgresql:// or postgres://");
  process.exit(1);
}

if (databaseUrl.includes("db.") && databaseUrl.includes(".supabase.co") && !databaseUrl.includes("pooler")) {
  console.error("Use Session pooler URL, not direct db.*.supabase.co");
  process.exit(1);
}

if (databaseUrl.includes("pooler.supabase.com")) {
  const userMatch = databaseUrl.match(/^postgres(ql)?:\/\/([^:@/]+)/i);
  const dbUser = userMatch?.[2] ?? "";
  if (!dbUser.includes(".")) {
    console.error('Pooler username must be postgres.PROJECT_REF, not plain "postgres"');
    process.exit(1);
  }
  console.log(`Pooler username looks OK: ${dbUser}`);
}

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
});

try {
  console.log("Connecting...");
  await prisma.$queryRaw`SELECT 1`;
  console.log("Connection: OK");

  const count = await prisma.session.count();
  console.log(`Session table: OK (${count} rows)`);
  console.log("\nDATABASE_URL is valid. Paste it into Render and redeploy.");
} catch (error) {
  console.error("\nConnection failed:");
  console.error(error instanceof Error ? error.message : error);
  console.error("\nFix in Supabase → Connect → Session pooler → copy URI again.");
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
