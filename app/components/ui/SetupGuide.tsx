import { CopyCodeBlock } from "./CopyCodeBlock";
import { AppLink } from "../AppLink";

type SetupGuideProps = {
  shopDomain: string;
  trackingId: string;
  trackingScriptUrl: string;
  hasData: boolean;
  hasRecommendations: boolean;
};

function storeHandle(shopDomain: string): string {
  return shopDomain.replace(".myshopify.com", "");
}

export function SetupGuide({
  shopDomain,
  trackingId,
  trackingScriptUrl,
  hasData,
  hasRecommendations,
}: SetupGuideProps) {
  const script = `<script src="${trackingScriptUrl}" data-tracking-id="${trackingId}" async></script>`;
  const themeEditorUrl = `https://admin.shopify.com/store/${storeHandle(shopDomain)}/themes/current/editor?context=apps`;
  const storefrontUrl = `https://${shopDomain}`;

  return (
    <s-section heading="איך מתחילים? — 3 צעדים">
      <div className="ms-steps">
        <div className={`ms-step ${hasData ? "ms-step-done" : ""}`}>
          <div className="ms-step-num">1</div>
          <div>
            <s-text type="strong">הפעל מעקב בחנות (הדרך הקלה)</s-text>
            <s-paragraph>
              לא צריך לגעת בקוד. עושים את זה מתוך עיצוב החנות:
            </s-paragraph>
            <ol className="ms-step-list">
              <li>
                לחץ «פתח עיצוב חנות» (נפתח בחלון חדש)
              </li>
              <li>
                בצד שמאל למטה: «App embeds» / «הטמעות אפליקציה»
              </li>
              <li>
                הפעל את «מעקב Solution»
              </li>
              <li>
                בשדה «מזהה מעקב» — הדבק את המזהה שלך (למטה)
              </li>
              <li>לחץ «שמור» למעלה</li>
            </ol>

            <a
              href={themeEditorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ms-btn ms-btn-primary ms-step-action"
            >
              פתח עיצוב חנות
            </a>

            <CopyCodeBlock
              code={trackingId}
              label="מזהה המעקב שלך — העתק והדבק בשדה באפליקציה:"
            />

            <details className="ms-details">
              <summary>דרך מתקדמת — הדבקה ידנית של קוד</summary>
              <s-paragraph>
                רק אם אין לך «App embeds»: חנות מקוון → עיצוב → ערוך קוד →
                theme.liquid → הדבק לפני {"</head>"}:
              </s-paragraph>
              <CopyCodeBlock code={script} label="שורת הקוד:" />
            </details>
          </div>
        </div>

        <div className={`ms-step ${hasData ? "ms-step-done" : ""}`}>
          <div className="ms-step-num">2</div>
          <div>
            <s-text type="strong">בקר בחנות פעם אחת</s-text>
            <s-paragraph>
              {hasData ? (
                "מעולה — המעקב עובד והנתונים מתחילים להגיע."
              ) : (
                <>
                  אחרי ששמרת בשלב 1, פתח את החנות כמו לקוח רגיל וגלוש ב-2–3
                  דפים. כך המערכת יודעת שהמעקב פעיל.
                </>
              )}
            </s-paragraph>
            {!hasData ? (
              <a
                href={storefrontUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ms-btn ms-btn-secondary ms-step-action"
              >
                פתח את החנות שלי
              </a>
            ) : null}
          </div>
        </div>

        <div className={`ms-step ${hasRecommendations ? "ms-step-done" : ""}`}>
          <div className="ms-step-num">3</div>
          <div>
            <s-text type="strong">קבל המלצות</s-text>
            <s-paragraph>
              {hasRecommendations ? (
                <>
                  יש לך המלצות מוכנות. עבור לדף «מה כדאי לעשות» לראות מה לשפר
                  בחנות.
                </>
              ) : (
                <>
                  לחץ «קבל המלצות» למעלה. המערכת תבדוק את הנתונים ותגיד לך מה
                  כדאי לעשות.
                </>
              )}
            </s-paragraph>
            {hasRecommendations ? (
              <AppLink to="/app/recommendations" className="ms-btn ms-btn-primary ms-step-action">
                לך להמלצות →
              </AppLink>
            ) : null}
          </div>
        </div>
      </div>
    </s-section>
  );
}
