import { BrandLogo } from "./BrandLogo";
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
      <BrandLogo size={48} className="ms-welcome-logo" />
      <h1 className="ms-welcome-title">
        {step === 1 ? POSITIONING.welcomeTitle : "Browse your store once"}
      </h1>
      <p className="ms-welcome-lead">
        {step === 1
          ? POSITIONING.welcomeLead
          : "Open your live store, visit a few pages, then come back for fixes."}
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
      <ChatPromo />
    </div>
  );
}
