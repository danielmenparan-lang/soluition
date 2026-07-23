import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";
import {
  isSupabaseSessionStorageConfigured,
  SupabaseSessionStorage,
} from "./services/supabase-session-storage.server";

export const isShopifyConfigured = Boolean(
  process.env.SHOPIFY_API_KEY?.trim() && process.env.SHOPIFY_API_SECRET?.trim(),
);

process.on("unhandledRejection", (reason) => {
  console.error("[shopify-app] Unhandled rejection (non-fatal):", reason);
});

const useSupabaseSessions = isSupabaseSessionStorageConfigured();

const sessionStorageImpl = useSupabaseSessions
  ? new SupabaseSessionStorage()
  : new PrismaSessionStorage(prisma, {
      connectionRetries: 1,
      connectionRetryIntervalMs: 1000,
    });

if (useSupabaseSessions) {
  console.log("[shopify] Using Supabase REST for OAuth sessions (no DATABASE_URL needed)");
  void (sessionStorageImpl as SupabaseSessionStorage).isReady().then((ready) => {
    if (!ready) {
      console.error(
        "[shopify] Session storage unavailable. Run supabase/session-table.sql in Supabase SQL Editor",
      );
    }
  });
} else {
  void (sessionStorageImpl as PrismaSessionStorage).isReady().then((ready) => {
    if (!ready) {
      console.error(
        "[shopify] Session storage unavailable. Set SUPABASE keys or fix DATABASE_URL",
      );
    }
  });
}

// Placeholders allow the server to boot on Render while env vars are being configured.
const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY || "not-configured",
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "not-configured",
  apiVersion: ApiVersion.October25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: sessionStorageImpl,
  distribution: AppDistribution.AppStore,
  future: {
    expiringOfflineAccessTokens: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
export const sessionStorageMode = useSupabaseSessions ? "supabase" : "prisma";
