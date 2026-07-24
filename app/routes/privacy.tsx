import { useLoaderData } from "react-router";
import { getSupportEmail } from "../config/support.server";

export const loader = () => ({ supportEmail: getSupportEmail() });

export default function Privacy() {
  const { supportEmail } = useLoaderData<typeof loader>();

  return (
    <div className="ms-static-page">
      <h1>מדיניות פרטיות — Solution</h1>
      <p className="ms-static-meta">עודכן: יולי 2026</p>

      <h2>מה אנחנו אוספים</h2>
      <p>
        Solution אוספת נתוני התנהגות מבקרים בחנות (צפיות בדפים, מוצרים, עגלת
        קניות, מקור תנועה, סוג מכשיר, מדינה) כדי לספק אנליטיקה והמלצות
        לבעלי החנות שהתקינו את האפליקציה.
      </p>

      <h2>איך משתמשים בנתונים</h2>
      <p>
        הנתונים משמשים אך ורק להצגת דשבורד, קבוצות לקוחות והמלצות שיווק בתוך
        Shopify Admin. אנחנו לא מוכרים נתוני מבקרים.
      </p>

      <h2>אחסון</h2>
      <p>
        נתוני אנליטיקה נשמרים ב-Supabase (PostgreSQL). נתוני OAuth של Shopify
        נשמרים בצורה מאובטחת לצורך אימות.
      </p>

      <h2>שירות AI</h2>
      <p>
        אנחנו משתמשים ב-AI (Anthropic) ליצירת תובנות והמלצות. הנתונים שנשלחים
        הם סיכומים מצטברים — לא מידע מזהה של קונים.
      </p>

      <h2>מחיקת נתונים</h2>
      <p>
        עם הסרת האפליקציה, נתוני החנות נמחקים בהתאם לדרישות Shopify (webhooks
        GDPR).
      </p>

      <h2>יצירת קשר</h2>
      <p>
        לשאלות פרטיות או תמיכה:{" "}
        <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
      </p>
    </div>
  );
}
