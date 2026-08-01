import { AppLink } from "../AppLink";
import type { OnboardingProgress } from "../../services/onboarding.server";

type OnboardingChecklistProps = {
  progress: OnboardingProgress;
};

export function OnboardingChecklist({ progress }: OnboardingChecklistProps) {
  if (progress.isComplete) return null;

  return (
    <div className="ms-onboarding">
      <div className="ms-onboarding-head">
        <div>
          <p className="ms-onboarding-kicker">Getting started</p>
          <h2 className="ms-onboarding-title">Set up Solution in 3 steps</h2>
        </div>
        <div className="ms-onboarding-progress-ring" aria-hidden>
          <span>{progress.progressPct}%</span>
        </div>
      </div>
      <div className="ms-onboarding-bar">
        <div
          className="ms-onboarding-bar-fill"
          style={{ width: `${progress.progressPct}%` }}
        />
      </div>
      <ol className="ms-onboarding-steps">
        {progress.steps.map((step, index) => (
          <li
            key={step.id}
            className={`ms-onboarding-step ${step.done ? "is-done" : ""}`}
          >
            <span className="ms-onboarding-step-num">
              {step.done ? "✓" : index + 1}
            </span>
            <div className="ms-onboarding-step-body">
              <strong>{step.label}</strong>
              <p>{step.detail}</p>
              {!step.done && step.href && step.external ? (
                <a
                  href={step.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ms-text-link"
                >
                  Open theme editor →
                </a>
              ) : null}
              {!step.done && step.href && !step.external ? (
                <AppLink to={step.href} className="ms-text-link">
                  View analytics →
                </AppLink>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
