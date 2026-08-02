/** Numeric Shopify product ID from tracker GID or raw id */
export function normalizeProductId(productId: string): string {
  const gidMatch = productId.match(/Product\/(\d+)/);
  if (gidMatch) return gidMatch[1];
  if (/^\d+$/.test(productId)) return productId;
  return productId;
}

export function shopifyAdminPath(shopDomain: string, path: string): string {
  const base = shopDomain.startsWith("http") ? shopDomain : `https://${shopDomain}`;
  return `${base}/admin${path.startsWith("/") ? path : `/${path}`}`;
}

export function productAdminUrl(shopDomain: string, productId: string): string {
  return shopifyAdminPath(
    shopDomain,
    `/products/${normalizeProductId(productId)}`,
  );
}

export function checkoutSettingsUrl(shopDomain: string): string {
  return shopifyAdminPath(shopDomain, "/settings/checkout");
}

export function themesAdminUrl(shopDomain: string): string {
  return shopifyAdminPath(shopDomain, "/themes");
}

export function onlineStorePreferencesUrl(shopDomain: string): string {
  return shopifyAdminPath(shopDomain, "/online_store/preferences");
}
