/** Expected Shopify app for this project (solution). */
export const EXPECTED_SHOPIFY_CLIENT_ID = "00eb38f774ffba914d98a6800f4c5df5";
export const EXPECTED_APP_URL = "https://shopify-marketing-solution.onrender.com";

export function getShopifyConfigStatus() {
  const apiKey = process.env.SHOPIFY_API_KEY?.trim() ?? "";
  const appUrl = process.env.SHOPIFY_APP_URL?.trim() ?? "";

  return {
    apiKeyPrefix: apiKey ? apiKey.slice(0, 8) : null,
    apiKeyMatchesApp:
      apiKey === EXPECTED_SHOPIFY_CLIENT_ID ||
      apiKey.startsWith(EXPECTED_SHOPIFY_CLIENT_ID.slice(0, 8)),
    expectedApiKeyPrefix: EXPECTED_SHOPIFY_CLIENT_ID.slice(0, 8),
    appUrl,
    appUrlMatches: appUrl === EXPECTED_APP_URL,
    expectedAppUrl: EXPECTED_APP_URL,
  };
}
