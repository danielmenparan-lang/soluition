import type { Shop } from "../types/database.types";

export function buildNoDataChatReply(shop: Shop): string {
  return `Your store has no visitor data yet, so I cannot cite traffic or sales numbers.

What this means:
• Solution Tracker may not be enabled in your theme yet, or
• No one has browsed your storefront since you enabled it.

Action items:
1. Open Solution → Home → click Enable Solution Tracker → Save in the theme editor.
2. Open your storefront in a new tab and browse Home, a product page, and the cart.
3. Add a clear headline and one strong product image on your homepage today.
4. Share your store link with 5 people and ask what confused them on the product page.
5. Add shipping/returns info near the Add to cart button to reduce buyer hesitation.

Optional tracking ID override: ${shop.tracking_id}`;
}
