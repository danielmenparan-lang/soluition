import { AppLink } from "../AppLink";
import type { StoreDiagnostic } from "../../types/store-diagnostic.types";

type AdReadinessCompactProps = {
  diagnostic: StoreDiagnostic;
};

export function AdReadinessCompact({ diagnostic }: AdReadinessCompactProps) {
  if (!diagnostic.hasEnoughData) return null;

  const topBlocker = diagnostic.blockers.find((b) => b.status !== "pass");

  return (
    <section className="ms-readiness-compact ms-card ms-card-soft">
      <div className="ms-readiness-compact-main">
        <p className="ms-readiness-compact-label">Ad readiness</p>
        <p
          className={`ms-readiness-compact-verdict ${diagnostic.readyForAds ? "is-ready" : "is-not-ready"}`}
        >
          {diagnostic.verdict}
        </p>
        {topBlocker ? (
          <p className="ms-readiness-compact-hint">{topBlocker.fixHint}</p>
        ) : (
          <p className="ms-readiness-compact-hint">{diagnostic.summary}</p>
        )}
      </div>
      <div className="ms-readiness-compact-score">
        <span className="ms-readiness-compact-value">{diagnostic.adReadinessScore}</span>
        <span className="ms-readiness-compact-max">/100</span>
      </div>
      <AppLink to="/app/analytics" className="ms-readiness-compact-link">
        View funnel →
      </AppLink>
    </section>
  );

}
