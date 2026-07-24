import type { Shop } from "../types/database.types";

export function buildNoDataChatReply(shop: Shop): string {
  return `Your store has no visitor data yet, so I cannot analyze sales or traffic patterns.

What this means:
• Solution Tracker may not be enabled in your theme yet, or
• No one has browsed your storefront since you enabled it.

Action items:
1. Open Solution → Home → click Enable Solution Tracker → Save in the theme editor.
2. Open your storefront in a new tab and browse Home, a product page, and the cart.
3. Add a clear headline and one strong product image on your homepage — do this now while tracking starts.
4. Share your store link with 3–5 people and ask them to visit one product page each.
5. Return here and ask: "What should I focus on this week?" once Visitors shows 3 or more.

Optional tracking ID override: ${shop.tracking_id}`;
}
