import { AppLink } from "../AppLink";
import type { OnboardingProgress } from "../../services/onboarding.server";

type OnboardingChecklistProps = {
  progress: OnboardingProgress;
};

export function OnboardingChecklist({ progress }: OnboardingChecklistProps) {
  if (progress.isComplete) return null;

  return (
    <section className="ms-setup">
      <h2 className="ms-section-title">Setup</h2>
      <p className="ms-section-lead">
        {progress.completedCount} of {progress.totalSteps} done
      </p>
      <ol className="ms-setup-steps">
        {progress.steps.map((step) => (
          <li key={step.id} className={step.done ? "is-done" : ""}>
            <span className="ms-setup-check" aria-hidden>
              {step.done ? "✓" : "○"}
            </span>
            <div>
              <strong>{step.label}</strong>
              {!step.done && step.detail ? <p>{step.detail}</p> : null}
              {!step.done && step.href && step.external ? (
                <a
                  href={step.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ms-text-link"
                >
                  Open theme editor
                </a>
              ) : null}
              {!step.done && step.href && !step.external ? (
                <AppLink to={step.href} className="ms-text-link">
                  Open analytics
                </AppLink>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
