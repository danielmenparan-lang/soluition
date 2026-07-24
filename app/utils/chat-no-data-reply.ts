import type { Shop } from "../types/database.types";

export function buildNoDataChatReply(shop: Shop): string {
  return `Summary: No visitor events are recorded for ${shop.shop_domain}, so performance analysis cannot run yet.

Analysis: Solution Tracker is either disabled in the theme or the storefront has not received traffic since activation. Without session data, traffic, conversion, and product metrics are unavailable.

Recommended actions:
1. Solution → Home → enable the Solution Tracker app embed in the live theme and save.
2. Visit the storefront (home, product, cart) to generate baseline sessions.
3. Review homepage value proposition and primary product presentation before driving external traffic.
4. Return after baseline sessions appear in Analytics to receive data-backed recommendations.`;
}
