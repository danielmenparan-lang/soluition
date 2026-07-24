import type { Shop } from "../types/database.types";

export function buildNoDataChatReply(shop: Shop, hebrew = false): string {
  if (hebrew) {
    return `בקצרה: אין עדיין נתוני מבקרים ב-${shop.shop_domain} — הבעיה היא שעדיין לא נכנסו אנשים לחנות.

מה זה אומר:
החנות כנראה לא מוכנה להביא קונים, או שהמעקב לא פעיל. בלי מבקרים אי אפשר לדעת למה אין מכירות — קודם צריך תנועה.

מה לעשות עכשיו:
1. Solution → Home → הפעל Solution Tracker בתבנית → שמור → גלוש 3 דפים בחנות.
2. בדף הבית: כותרת ברורה — מה אתה מוכר ולמי. מוצר אחד בולט עם תמונה טובה.
3. בדף מוצר: מחיר, משלוח, והחזרות — גלוי ליד כפתור הקנייה.
4. בחר ערוץ אחד להשבוע הראשון (גוגל, פייסבוק, או אינסטגרם) — לא הכל ביחד.
5. יעד ל-14 יום: 50 מבקרים ו-3 הוספות לעגלה — לא בהכרח מכירה עדיין.`;
  }

  return `Summary: No visitor data yet for ${shop.shop_domain} — the issue is that people are not reaching your store.

What this means:
Your store may not be ready to attract buyers, or tracking is off. Without visitors, you cannot diagnose sales — you need traffic first.

What to do now:
1. Solution → Home → enable Solution Tracker in your theme → Save → browse 3 pages on your store.
2. Homepage: clear headline — what you sell and who it is for. One featured product with a strong photo.
3. Product page: price, shipping, and returns visible near the Buy button.
4. Pick one channel for week one (Google, Facebook, or Instagram) — not all at once.
5. Goal for 14 days: 50 visitors and 3 add-to-carts — sales can come later.`;
}
