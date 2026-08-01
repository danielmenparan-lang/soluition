import type { Shop } from "../types/database.types";

export function buildNoDataChatReply(shop: Shop, hebrew = false): string {
  if (hebrew) {
    return `בקצרה: אין נתוני מבקרים ב-${shop.shop_domain}.

מה זה אומר: עדיין לא נכנסו אנשים לחנות, או שהמעקב לא פעיל.

מה לעשות:
1. Solution → Home → הפעל Solution Tracker → Save → גלוש 3 דפים בחנות.
2. כותרת ברורה בדף הבית — מה אתה מוכר ולמי.
3. בדף מוצר: מחיר, משלוח והחזרות ליד כפתור הקנייה.
4. ערוץ שיווק אחד בשבוע הראשון — לא הכל ביחד.`;
  }

  return `In short: No visitor data yet for ${shop.shop_domain}.

What it means: People are not reaching your store yet, or tracking is not on.

Do this:
1. Solution → Home → turn on Solution Tracker in your theme → Save → browse 3 store pages.
2. Add a clear homepage headline — what you sell and who it is for.
3. On the product page, show price, shipping, and returns near the Buy button.
4. Pick one marketing channel for week one — not every platform at once.
5. Aim for 50 visitors in 14 days before you judge sales.`;
}
