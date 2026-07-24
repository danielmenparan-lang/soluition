import { CopyCodeBlock } from "./CopyCodeBlock";

type SetupGuideProps = {
  trackingId: string;
  trackingScriptUrl: string;
  hasData: boolean;
  hasRecommendations: boolean;
};

export function SetupGuide({
  trackingId,
  trackingScriptUrl,
  hasData,
  hasRecommendations,
}: SetupGuideProps) {
  const script = `<script src="${trackingScriptUrl}" data-tracking-id="${trackingId}" async></script>`;

  return (
    <s-section heading="איך מתחילים? — 3 צעדים">
      <div className="ms-steps">
        <div className={`ms-step ${hasData ? "ms-step-done" : ""}`}>
          <div className="ms-step-num">1</div>
          <div>
            <s-text type="strong">הדבק שורת מעקב בחנות</s-text>
            <s-paragraph>
              לך לעיצוב החנות (Online Store → עיצוב → ערוך קוד) והדבק את השורה
              הבאה לפני סגירת תג ה-head. אפשר גם דרך «התאמה אישית» אם יש App Embed
              של האפליקציה.
            </s-paragraph>
            <CopyCodeBlock code={script} />
          </div>
        </div>

        <div className={`ms-step ${hasData ? "ms-step-done" : ""}`}>
          <div className="ms-step-num">2</div>
          <div>
            <s-text type="strong">היכנס לחנות פעם אחת</s-text>
            <s-paragraph>
              {hasData
                ? "מעולה — הנתונים מתחילים להגיע. ככל שיותר אנשים יבקרו, ההמלצות יהיו מדויקות יותר."
                : "פתח את החנות שלך בדפדפן (כמו לקוח רגיל) וגלוש בכמה דפים. זה מפעיל את המעקב."}
            </s-paragraph>
          </div>
        </div>

        <div className={`ms-step ${hasRecommendations ? "ms-step-done" : ""}`}>
          <div className="ms-step-num">3</div>
          <div>
            <s-text type="strong">קבל המלצות</s-text>
            <s-paragraph>
              {hasRecommendations
                ? "יש לך המלצות — עבור ל«מה כדאי לעשות» לראות את כולן."
                : "לחץ «קבל המלצות» למעלה. המערכת תבדוק את הנתונים ותציע מה לשפר."}
            </s-paragraph>
          </div>
        </div>
      </div>
    </s-section>
  );
}
