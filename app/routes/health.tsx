import { getShopifyConfigStatus } from "../config/shopify-app.server";
import {
  checkSupabaseSessionTable,
  isSupabaseSessionStorageConfigured,
} from "../services/supabase-session-storage.server";

export const loader = async ({ request }: { request: Request }) => {
  const shopifyConfig = getShopifyConfigStatus();
  const sessionStorageMode = isSupabaseSessionStorageConfigured()
    ? "supabase"
    : "prisma";
  const sessionCheck = await checkSupabaseSessionTable();
  const sessionReady = sessionCheck.ready;
  const configOk =
    shopifyConfig.apiKeyMatchesApp &&
    shopifyConfig.appUrlMatches &&
    sessionReady;

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const detailed = Boolean(
    process.env.HEALTH_CHECK_TOKEN &&
      token &&
      token === process.env.HEALTH_CHECK_TOKEN,
  );

  if (!detailed) {
    return Response.json(
      {
        ok: configOk,
        sessionStorage: sessionStorageMode,
        sessionsReady: sessionReady,
        aiReady: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
      },
      { status: configOk ? 200 : 503 },
    );
  }

  return Response.json(
    {
      ok: configOk,
      sessionStorage: sessionStorageMode,
      shopify: {
        apiKeySet: Boolean(process.env.SHOPIFY_API_KEY?.trim()),
        apiSecretSet: Boolean(process.env.SHOPIFY_API_SECRET?.trim()),
        apiKeyMatchesApp: shopifyConfig.apiKeyMatchesApp,
        appUrlMatches: shopifyConfig.appUrlMatches,
      },
      sessions: {
        provider: sessionStorageMode,
        tableReady: sessionReady,
        error: sessionCheck.error,
      },
      anthropic: {
        apiKeySet: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
        model: process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-6",
      },
    },
    { status: configOk ? 200 : 503 },
  );
};
