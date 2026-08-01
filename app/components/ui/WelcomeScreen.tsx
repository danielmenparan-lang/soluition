import { BrandLogo } from "./BrandLogo";
import { ProductExplainer } from "./ProductExplainer";
import { ChatPromo } from "./ChatPromo";
import { THEME_EMBED_NAME } from "../../config/theme-embed";
import { POSITIONING } from "../../config/positioning";
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
        <p className="ms-welcome-kicker">Welcome to {POSITIONING.productName}</p>
        <h1 className="ms-welcome-title">
          {step === 1
            ? POSITIONING.welcomeTitle
            : step === 2
              ? "Almost there — one more browse"
              : "Ready — see what's blocking sales"}
        </h1>
        <p className="ms-welcome-lead">
          {step === 1
            ? POSITIONING.welcomeLead
            : step === 2
              ? "Tracking is on. Open your live store, visit 2–3 product pages, then come back for your funnel and fixes."
              : "Ready — tap Get fixes or open Chat."}
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
