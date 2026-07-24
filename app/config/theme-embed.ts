/** Theme app embed block filename (without .liquid) */
export const THEME_EMBED_HANDLE = "tracker";

/** Label merchants see in Theme editor → App embeds */
export const THEME_EMBED_NAME = "Solution Tracker";

export function storeHandle(shopDomain: string): string {
  return shopDomain.replace(".myshopify.com", "");
}

/** Shopify deep link — opens live theme editor on this app's embed (2026 Admin). */
export function buildThemeEmbedActivateUrl(
  shopDomain: string,
  apiKey: string,
): string {
  const handle = storeHandle(shopDomain);
  return `https://admin.shopify.com/store/${handle}/themes/current/editor?context=apps&activateAppId=${apiKey}/${THEME_EMBED_HANDLE}`;
}

/** Fallback when deep link opens the wrong theme — manual path in Admin. */
export function buildThemesAdminUrl(shopDomain: string): string {
  const handle = storeHandle(shopDomain);
  return `https://admin.shopify.com/store/${handle}/themes`;
}
