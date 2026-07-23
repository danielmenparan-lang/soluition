import prisma from "../db.server";
import { getShopifyConfigStatus } from "../config/shopify-app.server";

export const loader = async () => {
  const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
  const shopifyConfig = getShopifyConfigStatus();

  let dbConnected = false;
  let sessionTableReady = false;
  let dbError: string | null = null;

  if (databaseUrl.startsWith("postgres")) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
      sessionTableReady =
        (await prisma.session.count().catch(() => -1)) >= 0;
    } catch (error) {
      dbError = error instanceof Error ? error.message : "Database connection failed";
    }
  }

  const configOk =
    shopifyConfig.apiKeyMatchesApp &&
    shopifyConfig.appUrlMatches &&
    dbConnected &&
    sessionTableReady;

  return Response.json(
    {
      ok: configOk,
      shopify: {
        apiKeySet: Boolean(process.env.SHOPIFY_API_KEY?.trim()),
        apiSecretSet: Boolean(process.env.SHOPIFY_API_SECRET?.trim()),
        apiKeyPrefix: shopifyConfig.apiKeyPrefix,
        apiKeyMatchesApp: shopifyConfig.apiKeyMatchesApp,
        expectedApiKeyPrefix: shopifyConfig.expectedApiKeyPrefix,
        appUrl: shopifyConfig.appUrl || "missing",
        appUrlMatches: shopifyConfig.appUrlMatches,
        expectedAppUrl: shopifyConfig.expectedAppUrl,
      },
      database: {
        configured: databaseUrl.startsWith("postgres"),
        usesPooler: databaseUrl.includes("pooler.supabase.com"),
        connected: dbConnected,
        sessionTableReady,
        error: dbError,
      },
      supabase: {
        urlSet: Boolean(process.env.SUPABASE_URL?.trim()),
        keySet: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
      },
      hints: [
        !shopifyConfig.apiKeyMatchesApp
          ? "SHOPIFY_API_KEY in Render is WRONG — must be 00eb38f774ffba914d98a6800f4c5df5 (solution app, NOT Profit Brain fe4d2284...)"
          : null,
        !shopifyConfig.appUrlMatches
          ? "SHOPIFY_APP_URL must be https://shopify-marketing-solution.onrender.com (NOT fly.dev)"
          : null,
        dbError?.includes("ECIRCUITBREAKER")
          ? "Supabase blocked connections — reset DB password in Supabase, update DATABASE_URL, wait 15 min"
          : null,
        dbConnected && !sessionTableReady
          ? "Run supabase/session-table.sql in Supabase SQL Editor"
          : null,
      ].filter(Boolean),
    },
    { status: 200 },
  );
};
