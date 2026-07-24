import type { Shop } from "../types/database.types";

export function buildNoDataChatReply(shop: Shop): string {
  return `Hi! There is no store data yet, so I cannot answer questions like "why did sales drop" accurately.

Why?
• Tracking is not enabled in your theme yet, or
• No visitors have been recorded since you enabled it.

What to do now (about 3 minutes):

1. Go to the Home page in this app
2. Click Open theme editor
3. Enable Solution Tracker and paste your tracking ID:
   ${shop.tracking_id}
4. Save, then open your storefront and browse a few pages

Once data flows, I can help with:
• Where buyers come from
• Which products to promote
• Where budget may be wasted

Need help enabling tracking? Ask "how do I enable tracking" and I will walk you through it.`;
}
