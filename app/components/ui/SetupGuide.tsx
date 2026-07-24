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
          <h3 className="ms-timeline-title">Enable tracking</h3>
          <p className="ms-timeline-text">
            {hasData
              ? "Tracking is connected."
              : "Open theme editor → App embeds → enable Solution Tracker → paste your ID → Save."}
          </p>
          {!hasData ? (
            <>
              <a
                href={themeEditorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ms-btn ms-btn-primary ms-step-action"
              >
                Open theme editor
              </a>
              <CopyCodeBlock code={trackingId} label="Your tracking ID — copy and paste:" />
              <details className="ms-details">
                <summary>Manual install with code</summary>
                <CopyCodeBlock code={script} label="Paste this line in your theme <head>:" />
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
          <h3 className="ms-timeline-title">Browse your storefront once</h3>
          <p className="ms-timeline-text">
            {hasData
              ? "Data is flowing — you're good to continue."
              : "Open your store in a new tab, visit 2–3 pages (home, product, cart), then return here."}
          </p>
          {!hasData ? (
            <a
              href={storefrontUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ms-btn ms-btn-secondary ms-step-action"
            >
              Open my storefront
            </a>
          ) : null}
        </div>
      </div>

      <div
        className={`ms-timeline-item ${hasRecommendations ? "is-done" : ""} ${hasData ? "is-active" : "is-next"}`}
      >
        <div className="ms-timeline-marker">3</div>
        <div className="ms-timeline-content">
          <h3 className="ms-timeline-title">Get recommendations</h3>
          <p className="ms-timeline-text">
            {hasRecommendations
              ? "Recommendations are ready — open the Recommendations page."
              : hasData
                ? "Click Get recommendations at the top — Solution will analyze your data and suggest improvements."
                : "Once you have traffic data, Solution will prepare a clear action list."}
          </p>
          {hasRecommendations ? (
            <AppLink
              to="/app/recommendations"
              className="ms-btn ms-btn-primary ms-step-action"
            >
              View recommendations
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
          {hasData ? "Pick up where you left off" : "Start here — 3 steps"}
        </h2>
        {timeline}
      </div>
    );
  }

  return (
    <SectionBlock
      title="Getting started — 3 steps"
      subtitle={hasData ? "Continue from where you stopped" : "Each step takes about a minute"}
    >
      {timeline}
    </SectionBlock>
  );
}
