import { BrandLogo } from "./BrandLogo";
import { THEME_EMBED_NAME } from "../../config/theme-embed";
import type { OnboardingProgress } from "../../services/onboarding.server";

type WelcomeScreenProps = {
  themeEmbedUrl: string;
  progress: OnboardingProgress;
};

export function WelcomeScreen({ themeEmbedUrl, progress }: WelcomeScreenProps) {
  const nextStep = progress.steps.find((step) => !step.done);

  return (
    <div className="ms-welcome ms-card">
      <BrandLogo size={40} className="ms-welcome-logo" />
      <h2 className="ms-welcome-title">Get your first marketing action</h2>
      <p className="ms-welcome-lead">
        Enable tracking, browse your store once, then scan for clear next steps.
      </p>

      <ol className="ms-welcome-steps">
        {progress.steps.map((step) => (
          <li key={step.id} className={step.done ? "is-done" : step.id === nextStep?.id ? "is-current" : ""}>
            <span className="ms-welcome-step-icon" aria-hidden>
              {step.done ? "✓" : "○"}
            </span>
            <div>
              <strong>{step.label}</strong>
              {!step.done && step.detail ? <p>{step.detail}</p> : null}
            </div>
          </li>
        ))}
      </ol>

      {nextStep?.href && nextStep.external ? (
        <a
          href={themeEmbedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ms-btn ms-btn-primary ms-welcome-cta"
        >
          Enable {THEME_EMBED_NAME}
        </a>
      ) : (
        <p className="ms-welcome-note">Open your storefront in a new tab and visit a few pages.</p>
      )}

      <p className="ms-welcome-progress">
        {progress.completedCount} of {progress.totalSteps} setup steps done
      </p>
    </div>
  );
}
