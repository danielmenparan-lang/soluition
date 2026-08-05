/** Public URL where the app is hosted (storefront tracker + OAuth). */
export const PUBLIC_APP_URL = "https://shopify-marketing-solution.onrender.com";

export function trackerScriptUrl(baseUrl: string = PUBLIC_APP_URL): string {
  return `${baseUrl.replace(/\/$/, "")}/tracker.js`;
}
