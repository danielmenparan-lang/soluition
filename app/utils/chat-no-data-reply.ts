import type { Shop } from "../types/database.types";

export function buildNoDataChatReply(shop: Shop): string {
  return `Hi! There is no store data yet, so I cannot answer questions like "why did sales drop" accurately.

Why?
• Tracking is not enabled in your theme yet, or
• No visitors have been recorded since you enabled it.

What to do now (about 3 minutes):

1. Open Solution → Home
2. Click "Enable Solution Tracker" (or: Online Store → Themes → Customize → App embeds)
3. Turn on Solution Tracker and click Save (no tracking ID required)
4. Browse your storefront (2–3 pages), then return to the app

Once data flows, I can help with:
• Where buyers come from
• Which products to promote
• Where budget may be wasted

Need help enabling tracking? Ask "how do I enable tracking" and I will walk you through it.`;
}
