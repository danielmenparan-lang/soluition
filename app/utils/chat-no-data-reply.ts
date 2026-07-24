import type { Shop } from "../types/database.types";

export function buildNoDataChatReply(shop: Shop, hebrew = false): string {
  if (hebrew) {
    return `בקצרה: אין נתוני מבקרים ב-${shop.shop_domain}.

מה זה אומר: עדיין לא נכנסו אנשים לחנות, או שהמעקב לא פעיל.

מה לעשות עכשיו:
1. Solution → Home → enable Solution Tracker → Save → browse 3 store pages.
2. Clear homepage headline — what you sell and who it is for.
3. Product page: price, shipping, returns near Buy button.
4. One marketing channel for week one — not all at once.`;
  }

  return `Summary: No visitor data yet for ${shop.shop_domain}.

What this means: People are not reaching your store yet, or tracking is not active. Without visitors, sales analysis is not possible.

What to do now:
1. Solution → Home → enable Solution Tracker in your theme → Save → browse 3 store pages.
2. Add a clear homepage headline — what you sell and who it is for.
3. On the product page, show price, shipping, and returns near the Buy button.
4. Pick one marketing channel for week one — do not spread across every platform at once.
5. Target for 14 days: 50 visitors before judging conversion.`;
}
