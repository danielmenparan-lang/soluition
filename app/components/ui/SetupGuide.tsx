import { CopyCodeBlock } from "./CopyCodeBlock";
import { SectionBlock } from "./SectionBlock";
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

  if (hasData && hasRecommendations) {
    return null;
  }

  return (
    <SectionBlock
      title="התקנה — צעד אחר צעד"
      subtitle="אל תדלג — בלי זה אין מספרים ואין המלצות"
    >
      <div className="ms-timeline">
        <div className={`ms-timeline-item ${hasData ? "is-done" : "is-active"}`}>
          <div className="ms-timeline-marker">1</div>
          <div className="ms-timeline-content">
            <h3 className="ms-timeline-title">הפעל מעקב בחנות</h3>
            <p className="ms-timeline-text">
              לחץ «פתח עיצוב חנות» → App embeds → הפעל «מעקב Solution» →
              הדבק את המזהה → שמור.
            </p>
            <a
              href={themeEditorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ms-btn ms-btn-primary ms-step-action"
            >
              פתח עיצוב חנות
            </a>
            <CopyCodeBlock code={trackingId} label="מזהה המעקב שלך:" />
            <details className="ms-details">
              <summary>דרך מתקדמת — הדבקת קוד ידנית</summary>
              <CopyCodeBlock code={script} label="שורת הקוד:" />
            </details>
          </div>
        </div>

        <div
          className={`ms-timeline-item ${hasData ? "is-done" : ""} ${!hasData ? "is-next" : "is-active"}`}
        >
          <div className="ms-timeline-marker">2</div>
          <div className="ms-timeline-content">
            <h3 className="ms-timeline-title">בקר בחנות פעם אחת</h3>
            <p className="ms-timeline-text">
              {hasData
                ? "מעולה — המעקב עובד."
                : "פתח את החנות, גלוש ב-2–3 דפים, וחזור לכאן."}
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
                : "לחץ «קבל המלצות» למעלה."}
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
    </SectionBlock>
  );
}
