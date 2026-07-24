import { CopyCodeBlock } from "./CopyCodeBlock";
import { SectionBlock } from "./SectionBlock";
import { AppLink } from "../AppLink";

type SetupGuideProps = {
  shopDomain: string;
  trackingId: string;
  trackingScriptUrl: string;
  hasData: boolean;
  hasRecommendations: boolean;
  embedded?: boolean;
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
  embedded = false,
}: SetupGuideProps) {
  const script = `<script src="${trackingScriptUrl}" data-tracking-id="${trackingId}" async></script>`;
  const themeEditorUrl = `https://admin.shopify.com/store/${storeHandle(shopDomain)}/themes/current/editor?context=apps`;
  const storefrontUrl = `https://${shopDomain}`;

  if (hasData && hasRecommendations) {
    return null;
  }

  const timeline = (
    <div className="ms-timeline">
      <div className={`ms-timeline-item ${hasData ? "is-done" : "is-active"}`}>
        <div className="ms-timeline-marker">1</div>
        <div className="ms-timeline-content">
          <h3 className="ms-timeline-title">הפעל מעקב בחנות</h3>
          <p className="ms-timeline-text">
            {hasData
              ? "מעולה — המעקב מחובר."
              : "לחץ «פתח הגדרות עיצוב» → App embeds → הפעל «מעקב Solution» → הדבק את המזהה → שמור."}
          </p>
          {!hasData ? (
            <>
              <a
                href={themeEditorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ms-btn ms-btn-primary ms-step-action"
              >
                פתח הגדרות עיצוב
              </a>
              <CopyCodeBlock code={trackingId} label="המזהה שלך — העתק והדבק:" />
              <details className="ms-details">
                <summary>יש בעיה? דרך ידנית עם קוד</summary>
                <CopyCodeBlock code={script} label="הדבק את השורה הזו ב-<head> של החנות:" />
              </details>
            </>
          ) : null}
        </div>
      </div>

      <div
        className={`ms-timeline-item ${hasData ? "is-done" : ""} ${!hasData ? "is-next" : "is-active"}`}
      >
        <div className="ms-timeline-marker">2</div>
        <div className="ms-timeline-content">
          <h3 className="ms-timeline-title">גלוש בחנות פעם אחת</h3>
          <p className="ms-timeline-text">
            {hasData
              ? "יש נתונים — אפשר להמשיך."
              : "פתח את החנות בטאב חדש, כנס ל-2–3 דפים (בית, מוצר, עגלה), וחזור לכאן."}
          </p>
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

      <div
        className={`ms-timeline-item ${hasRecommendations ? "is-done" : ""} ${hasData ? "is-active" : "is-next"}`}
      >
        <div className="ms-timeline-marker">3</div>
        <div className="ms-timeline-content">
          <h3 className="ms-timeline-title">קבל המלצות</h3>
          <p className="ms-timeline-text">
            {hasRecommendations
              ? "יש המלצות מוכנות — עבור ל«מה כדאי לעשות»."
              : hasData
                ? "לחץ «קבל המלצות» בראש הדף — Solution ינתח את הנתונים ויגיד לך מה לשפר."
                : "אחרי שיש נתונים — Solution יכין לך רשימת פעולות ברורה."}
          </p>
          {hasRecommendations ? (
            <AppLink
              to="/app/recommendations"
              className="ms-btn ms-btn-primary ms-step-action"
            >
              לך להמלצות →
            </AppLink>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="ms-setup-embedded">
        <h2 className="ms-setup-embedded-title">
          {hasData ? "המשך מהנקודה שבה עצרת" : "התחל כאן — 3 צעדים"}
        </h2>
        {timeline}
      </div>
    );
  }

  return (
    <SectionBlock
      title="התחלה — 3 צעדים"
      subtitle={hasData ? "המשך מהנקודה שבה עצרת" : "עקוב אחרי הצעדים — כל אחד לוקח דקה"}
    >
      {timeline}
    </SectionBlock>
  );
}
