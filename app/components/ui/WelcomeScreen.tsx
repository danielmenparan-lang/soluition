import { BrandLogo } from "./BrandLogo";
import { ProductExplainer } from "./ProductExplainer";
import { ChatPromo } from "./ChatPromo";
import { THEME_EMBED_NAME } from "../../config/theme-embed";
import type { OnboardingProgress } from "../../services/onboarding.server";

type WelcomeScreenProps = {
  themeEmbedUrl: string;
  progress: OnboardingProgress;
};

export function WelcomeScreen({ themeEmbedUrl, progress }: WelcomeScreenProps) {
  const step = progress.completedCount === 0 ? 1 : progress.isComplete ? 3 : 2;

  return (
    <div className="ms-welcome">
      <div className="ms-welcome-intro ms-welcome-intro-v2">
        <BrandLogo size={56} className="ms-welcome-logo" />
        <p className="ms-welcome-kicker">Welcome to Solution</p>
        <h1 className="ms-welcome-title">
          {step === 1
            ? "Your AI marketing advisor starts here"
            : step === 2
              ? "Almost there — one more step"
              : "You're set up — let's grow sales"}
        </h1>
        <p className="ms-welcome-lead">
          {step === 1
            ? "Turn on the app embed in your theme, then browse your storefront once. Solution tracks visitors, syncs Shopify orders on Pro, and tells you exactly what to fix."
            : step === 2
              ? "Tracking is connected. Browse a few product pages on your live store, or upgrade to Pro to sync orders for LTV and RFM insights."
              : "Generate your first priorities — Solution ranks what will move revenue fastest."}
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
        <div className="ms-welcome-progress-pill" aria-hidden>
          {progress.progressPct}% complete
        </div>
      </div>

      {step === 1 ? <ProductExplainer /> : null}
      <ChatPromo />
    </div>
  );
}
