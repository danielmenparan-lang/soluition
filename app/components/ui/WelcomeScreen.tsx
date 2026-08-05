import { AppLink } from "../AppLink";
import { BrandLogo } from "./BrandLogo";
import { THEME_EMBED_NAME } from "../../config/theme-embed";
import { LANDING_BENEFITS, POSITIONING } from "../../config/positioning";
import type { OnboardingProgress } from "../../services/onboarding.server";

type WelcomeScreenProps = {
  themeEmbedUrl: string;
  storefrontUrl: string;
  progress: OnboardingProgress;
};

export function WelcomeScreen({
  themeEmbedUrl,
  storefrontUrl,
  progress,
}: WelcomeScreenProps) {
  const nextStep = progress.steps.find((step) => !step.done);
  const currentIndex = nextStep
    ? progress.steps.findIndex((s) => s.id === nextStep.id) + 1
    : progress.totalSteps;

  return (
    <div className="ms-landing">
      <header className="ms-landing-hero">
        <BrandLogo size={44} className="ms-landing-logo" />
        <h1 className="ms-landing-headline">{POSITIONING.landingHeadline}</h1>
        <p className="ms-landing-subhead">{POSITIONING.landingSubhead}</p>
      </header>

      <div className="ms-landing-progress" role="status" aria-live="polite">
        <div className="ms-landing-progress-track">
          <div
            className="ms-landing-progress-fill"
            style={{ width: `${progress.progressPct}%` }}
          />
        </div>
        <p className="ms-landing-progress-text">
          Step {currentIndex} of {progress.totalSteps} · {POSITIONING.landingTime}
        </p>
      </div>

      <section className="ms-landing-setup ms-card" aria-labelledby="setup-heading">
        <h2 id="setup-heading" className="ms-landing-setup-title">
          {nextStep ? nextStep.label : "Setup complete"}
        </h2>
        <p className="ms-landing-setup-detail">
          {nextStep?.detail ?? POSITIONING.landingOutcome}
        </p>

        <ol className="ms-landing-steps">
          {progress.steps.map((step, index) => {
            const isCurrent = step.id === nextStep?.id;
            const isDone = step.done;
            return (
              <li
                key={step.id}
                className={`ms-landing-step ${isDone ? "is-done" : ""} ${isCurrent ? "is-current" : ""}`}
              >
                <span className="ms-landing-step-num" aria-hidden>
                  {isDone ? "✓" : index + 1}
                </span>
                <span className="ms-landing-step-label">{step.label}</span>
              </li>
            );
          })}
        </ol>

        {nextStep?.id === "embed" ? (
          <a
            href={themeEmbedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ms-btn ms-btn-primary ms-landing-cta"
          >
            Enable {THEME_EMBED_NAME}
          </a>
        ) : null}

        {nextStep?.id === "data" ? (
          <a
            href={storefrontUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ms-btn ms-btn-primary ms-landing-cta"
          >
            Open my store — browse 2–3 pages
          </a>
        ) : null}

        {nextStep?.id === "insight" ? (
          <p className="ms-landing-wait">
            Refresh this page after browsing your store — then tap{" "}
            <strong>Scan for actions</strong> in the top right.
          </p>
        ) : null}

        {!nextStep ? (
          <AppLink to="/app" className="ms-btn ms-btn-primary ms-landing-cta">
            Go to Home
          </AppLink>
        ) : null}
      </section>

      <section className="ms-landing-benefits" aria-label="What you get">
        <h2 className="ms-landing-benefits-title">What you get</h2>
        <div className="ms-landing-benefits-grid">
          {LANDING_BENEFITS.map((item) => (
            <article key={item.id} className="ms-landing-benefit ms-card ms-card-soft">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
