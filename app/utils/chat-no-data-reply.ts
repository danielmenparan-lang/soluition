import type { Shop } from "../types/database.types";

export function buildNoDataChatReply(shop: Shop): string {
  return `Summary: ${shop.shop_domain} has no recorded sessions — you are in pre-traffic stage, not a conversion problem yet.

Analysis: Without baseline sessions, funnel and channel analysis cannot run. The priority is launch architecture: clear ICP, a single hero offer, proof elements on the product page, and a defined first acquisition channel before scaling spend.

Recommended actions:
1. Solution → Home → enable Solution Tracker on the live theme, then browse home, product, and cart to validate event capture.
2. Rewrite the homepage above-the-fold: one headline (who it is for + outcome), one hero product, one proof element (review, guarantee, or credential).
3. Pick one acquisition wedge for week 1 (e.g. search intent, creator seeding, or retargeting-ready content) — do not spray across every channel.
4. Audit the product page for the top purchase objection (shipping, returns, sizing, trust) and address it within one scroll of Add to cart.
5. Define success for the next 14 days: target session count and one micro-conversion (email capture or add-to-cart), not revenue yet.`;
}
