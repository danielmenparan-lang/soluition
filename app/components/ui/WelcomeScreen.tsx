import { SetupGuide } from "./SetupGuide";
import { ChatPromo } from "./ChatPromo";
import { ProductExplainer } from "./ProductExplainer";

type WelcomeScreenProps = {
  shopDomain: string;
  trackingId: string;
  trackingScriptUrl: string;
  hasData: boolean;
  hasRecommendations: boolean;
};

export function WelcomeScreen({
  shopDomain,
  trackingId,
  trackingScriptUrl,
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
            ? "Solution tracks visitors, analyzes behavior, and gives clear recommendations. First, turn on tracking — it takes about a minute."
            : step === 2
              ? "Tracking is connected. Open your storefront, browse a few pages, then come back so we can collect data."
              : "You have enough data. Click Get recommendations above to see what to improve."}
        </p>
      </div>

      {step === 1 ? <ProductExplainer /> : null}

      <SetupGuide
        shopDomain={shopDomain}
        trackingId={trackingId}
        trackingScriptUrl={trackingScriptUrl}
        hasData={hasData}
        hasRecommendations={hasRecommendations}
        embedded
      />

      <ChatPromo />
    </div>
  );
}
