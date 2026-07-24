import type { Shop } from "../types/database.types";

export function buildNoDataChatReply(shop: Shop, hebrew = true): string {
  if (!hebrew) {
    return `Summary: No visitor data yet for ${shop.shop_domain}.

What this means:
People are not reaching your store yet, or tracking is off.

What to do now:
1. Solution → Home → enable Solution Tracker → Save → browse 3 store pages.
2. Homepage: clear headline — what you sell and who it is for.
3. Product page: price, shipping, returns near the Buy button.
4. Pick one marketing channel for week one — not all at once.
5. Goal: 50 visitors in 14 days before judging sales.`;
  }

  return `בקצרה: אין עדיין נתוני מבקרים ב-${shop.shop_domain}.

מה זה אומר:
עדיין לא נכנסו אנשים לחנות, או שהמעקב לא פעיל. בלי מבקרים אי אפשר לדעת למה אין מכירות.

מה לעשות עכשיו:
1. Solution → Home → הפעל Solution Tracker בתבנית → שמור → גלוש 3 דפים בחנות.
2. דף הבית: כותרת ברורה — מה אתה מוכר ולמי.
3. דף מוצר: מחיר, משלוח והחזרות ליד כפתור הקנייה.
4. בחר ערוץ שיווק אחד לשבוע הראשון — לא הכל ביחד.
5. יעד: 50 מבקרים ב-14 יום — לפני ששופטים מכירות.`;
}
