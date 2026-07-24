import { useLoaderData } from "react-router";
import { getSupportEmail } from "../config/support.server";

export const loader = () => ({ supportEmail: getSupportEmail() });

export default function Privacy() {
  const { supportEmail } = useLoaderData<typeof loader>();

  return (
    <div className="ms-static-page">
      <h1>מדיניות פרטיות — Solution AI Marketing</h1>
      <p>עודכן: יולי 2026</p>

      <h2>מה אנחנו אוספים</h2>
      <p>
        Solution אוספת נתוני התנהגות מבקרים בחנות (צפיות בדפים, מוצרים, עגלת
        קניות, מקור תנועה, סוג מכשיר, מדינה) כדי לספק אנליטיקה והמלצות AI
        לסוחרים שהתקינו את האפליקציה.
      </p>

      <h2>איך משתמשים בנתונים</h2>
      <p>
        הנתונים משמשים אך ורק להצגת דשבord, קהלים והמלצות שיווק בתוך Shopify
        Admin. אנחנו לא מוכרים נתוני מבקרים.
      </p>

      <h2>אחסון</h2>
      <p>
        נתוני אנליטיקה נשמרים ב-Supabase (PostgreSQL). נתוני OAuth של Shopify
        נשמרים בצורה מאובטחת לצורך אימות.
      </p>

      <h2>צד שלישי</h2>
      <p>
        אנחנו משתמשים ב-Anthropic Claude ליצירת תובנות AI. הנתונים שנשלחים
        הם סיכומים מצטברים — לא PII גolמי של לקוחות.
      </p>

      <h2>יצירת קשר</h2>
      <p>
        לשאלות פרטיות או תמיכה:{" "}
        <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
      </p>
    </div>
  );
}
