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
    <s-section heading="התחלה מהירה — 3 שלבים">
      <div className="ms-steps">
        <div className={`ms-step ${hasData ? "ms-step-done" : ""}`}>
          <div className="ms-step-num">1</div>
          <div>
            <s-text type="strong">התקן את סקריפט המעקב</s-text>
            <s-paragraph>
              הוסף את הקוד הבא ל-Theme → theme.liquid לפני {"</head>"}, או הפעל את
              App Embed דרך Online Store → Themes → Customize.
            </s-paragraph>
            <CopyCodeBlock code={script} />
          </div>
        </div>

        <div className={`ms-step ${hasData ? "ms-step-done" : ""}`}>
          <div className="ms-step-num">2</div>
          <div>
            <s-text type="strong">אסוף נתונים מהחנות</s-text>
            <s-paragraph>
              {hasData
                ? "מעולה — נתונים מתחילים להגיע. ככל שיותר מבקרים, ההמלצות יהיו מדויקות יותר."
                : "אחרי התקנת הסקריפט, בקר בחנות פעם אחת כדי ליצור session ראשון. מזהה מעקב: "}
              {!hasData ? <s-text type="strong">{trackingId}</s-text> : null}
            </s-paragraph>
          </div>
        </div>

        <div className={`ms-step ${hasRecommendations ? "ms-step-done" : ""}`}>
          <div className="ms-step-num">3</div>
          <div>
            <s-text type="strong">קבל המלצות AI</s-text>
            <s-paragraph>
              {hasRecommendations
                ? "המלצות AI פעילות — עבור לעמוד 'המלצות AI' לראות את כולן."
                : "לחץ 'יצירת המלצות AI' למעלה. המערכת תמשוך נתונים מ-Supabase, תשלח ל-Claude, ותשמור המלצות."}
            </s-paragraph>
          </div>
        </div>
      </div>
    </s-section>
  );
}
