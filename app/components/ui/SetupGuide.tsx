import { CopyCodeBlock } from "./CopyCodeBlock";
import { SectionBlock } from "./SectionBlock";
import { AppLink } from "../AppLink";
import {
  THEME_EMBED_NAME,
  buildThemeEmbedActivateUrl,
  buildThemesAdminUrl,
} from "../../config/theme-embed";

type SetupGuideProps = {
  shopDomain: string;
  trackingId: string;
  trackingScriptUrl: string;
  themeEmbedUrl: string;
  themesAdminUrl: string;
  hasData: boolean;
  hasRecommendations: boolean;
  embedded?: boolean;
};

export function SetupGuide({
  shopDomain,
  trackingId,
  trackingScriptUrl,
  themeEmbedUrl,
  themesAdminUrl,
  hasData,
  hasRecommendations,
  embedded = false,
}: SetupGuideProps) {
  const script = `<script src="${trackingScriptUrl}" data-tracking-id="${trackingId}" async></script>`;
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
              : `Enable "${THEME_EMBED_NAME}" in your live theme, paste your tracking ID, then click Save.`}
          </p>
          {!hasData ? (
            <>
              <a
                href={themeEmbedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ms-btn ms-btn-primary ms-step-action"
              >
                Enable {THEME_EMBED_NAME}
              </a>
              <CopyCodeBlock code={trackingId} label="Your tracking ID — copy and paste in the embed settings:" />
              <ol className="ms-step-list">
                <li>
                  Click <strong>Enable {THEME_EMBED_NAME}</strong> above (opens Theme editor in a new tab).
                </li>
                <li>
                  Or manually: Shopify Admin → <strong>Online Store</strong> → <strong>Themes</strong> →{" "}
                  <strong>Customize</strong> on your live theme.
                </li>
                <li>
                  In the left sidebar, open <strong>App embeds</strong> (puzzle icon), turn on{" "}
                  <strong>{THEME_EMBED_NAME}</strong>, paste your tracking ID, then <strong>Save</strong>.
                </li>
              </ol>
              <a
                href={themesAdminUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ms-text-link ms-step-action"
              >
                Open Online Store → Themes
              </a>
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
