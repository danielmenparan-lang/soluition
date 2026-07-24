import { SetupGuide } from "./SetupGuide";
import { ChatPromo } from "./ChatPromo";
import { ProductExplainer } from "./ProductExplainer";
import { THEME_EMBED_NAME } from "../../config/theme-embed";

type WelcomeScreenProps = {
  shopDomain: string;
  trackingId: string;
  trackingScriptUrl: string;
  themeEmbedUrl: string;
  themesAdminUrl: string;
  hasData: boolean;
  hasRecommendations: boolean;
};

export function WelcomeScreen({
  shopDomain,
  trackingId,
  trackingScriptUrl,
  themeEmbedUrl,
  themesAdminUrl,
  hasData,
  hasRecommendations,
}: WelcomeScreenProps) {
  const step = hasRecommendations ? 3 : hasData ? 2 : 1;

  return (
    <div className="ms-welcome">
      <div className="ms-welcome-intro">
        <p className="ms-welcome-kicker">Welcome to Solution</p>
        <h1 className="ms-welcome-title">
          {step === 1
            ? "Connect Solution to your store"
            : step === 2
              ? "Almost there — one more step"
              : "Ready — let's see what to improve"}
        </h1>
        <p className="ms-welcome-lead">
          {step === 1
            ? "Solution tracks visitors, analyzes behavior, and gives clear recommendations. First, turn on tracking in your theme — about one minute."
            : step === 2
              ? "Tracking is connected. Open your storefront, browse a few pages, then come back so we can collect data."
              : "You have enough data. Click Get recommendations above to see what to improve."}
        </p>
        {step === 1 ? (
          <a
            href={themeEmbedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ms-btn ms-btn-primary ms-welcome-cta"
          >
            Enable {THEME_EMBED_NAME}
          </a>
        ) : null}
      </div>

      {step === 1 ? <ProductExplainer /> : null}

      <SetupGuide
        shopDomain={shopDomain}
        trackingId={trackingId}
        trackingScriptUrl={trackingScriptUrl}
        themeEmbedUrl={themeEmbedUrl}
        themesAdminUrl={themesAdminUrl}
        hasData={hasData}
        hasRecommendations={hasRecommendations}
        embedded
      />

      <ChatPromo />
    </div>
  );
}
