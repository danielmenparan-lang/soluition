import { getShopifyConfigStatus } from "../config/shopify-app.server";
import {
  checkSupabaseSessionTable,
  getSupabaseKeyRole,
  isSupabaseSessionStorageConfigured,
} from "../services/supabase-session-storage.server";

export const loader = async () => {
  const shopifyConfig = getShopifyConfigStatus();
  const sessionStorageMode = isSupabaseSessionStorageConfigured()
    ? "supabase"
    : "prisma";
  const supabaseKeyRole = getSupabaseKeyRole();
  const sessionCheck = await checkSupabaseSessionTable();

  const sessionReady = sessionCheck.ready;
  const configOk =
    shopifyConfig.apiKeyMatchesApp &&
    shopifyConfig.appUrlMatches &&
    sessionReady;

  return Response.json(
    {
      ok: configOk,
      sessionStorage: sessionStorageMode,
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
      sessions: {
        provider: sessionStorageMode,
        tableReady: sessionReady,
        error: sessionCheck.error,
      },
      supabase: {
        urlSet: Boolean(process.env.SUPABASE_URL?.trim()),
        keySet: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
        keyRole: supabaseKeyRole,
        serviceRoleKeyValid: supabaseKeyRole === "service_role",
      },
      hints: [
        !shopifyConfig.apiKeyMatchesApp
          ? "SHOPIFY_API_KEY wrong — must be 00eb38f774ffba914d98a6800f4c5df5"
          : null,
        !shopifyConfig.appUrlMatches
          ? "SHOPIFY_APP_URL must be https://shopify-marketing-solution.onrender.com"
          : null,
        supabaseKeyRole && supabaseKeyRole !== "service_role"
          ? "SUPABASE_SERVICE_ROLE_KEY on Render is wrong — must be service_role key from Supabase API settings (not anon)"
          : null,
        sessionCheck.error?.includes("Invalid API key")
          ? "Update SUPABASE_SERVICE_ROLE_KEY in Render from Supabase → Project Settings → API → service_role secret"
          : null,
        !sessionReady && sessionCheck.error?.includes("WebSocket")
          ? "WebSocket fix deploying — upgrade Node to 22 or wait for next deploy"
          : null,
        !sessionReady &&
        !sessionCheck.error?.includes("WebSocket") &&
        !sessionCheck.error?.includes("Invalid API key")
          ? "Run supabase/session-table.sql in Supabase SQL Editor (creates Session table)"
          : null,
      ].filter(Boolean),
    },
    { status: 200 },
  );
};
