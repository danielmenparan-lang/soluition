import { POSITIONING } from "../../config/positioning";
import type { StoreDiagnostic } from "../../types/store-diagnostic.types";

type StoreDiagnosticPanelProps = {
  diagnostic: StoreDiagnostic;
};

export function StoreDiagnosticPanel({ diagnostic }: StoreDiagnosticPanelProps) {
  if (!diagnostic.hasEnoughData) {
    return (
      <section className="ms-diagnostic ms-diagnostic-pending">
        <h2 className="ms-diagnostic-title">{POSITIONING.diagnosticTitle}</h2>
        <p className="ms-section-lead">Need more store visits for ad readiness.</p>
      </section>
    );
  }

  return (
    <section className="ms-diagnostic">
      <div className="ms-readiness">
        <div className="ms-readiness-main">
          <p className="ms-readiness-label">Ad readiness</p>
          <p
            className={`ms-readiness-verdict ${diagnostic.readyForAds ? "is-ready" : "is-not-ready"}`}
          >
            {diagnostic.verdict}
          </p>
          <p className="ms-readiness-summary">{diagnostic.summary}</p>
        </div>
        <div
          className="ms-readiness-score"
          title="Higher = safer to spend on ads"
        >
          <span className="ms-readiness-value">{diagnostic.adReadinessScore}</span>
          <span className="ms-readiness-max">/100</span>
        </div>
      </div>

      {diagnostic.blockers.length > 0 ? (
        <div className="ms-blockers">
          <h3 className="ms-blockers-title">Fix before ads</h3>
          <ul className="ms-blockers-list">
            {diagnostic.blockers.map((check) => (
              <li key={check.id} className={`ms-blocker is-${check.status}`}>
                <strong>{check.label}</strong>
                <span>{check.detail}</span>
                <p className="ms-blocker-fix">{check.fixHint}</p>
                {check.adminUrl ? (
                  <a
                    href={check.adminUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ms-text-link"
                  >
                    Open in Shopify Admin →
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {diagnostic.dropOffs.length > 0 ? (
        <div className="ms-dropoffs">
          <h3 className="ms-dropoffs-title">{POSITIONING.dropOffTitle}</h3>
          <ol className="ms-dropoffs-list">
            {diagnostic.dropOffs.map((spot, index) => (
              <li key={spot.id} className="ms-dropoff-item">
                <span className="ms-dropoff-rank">{index + 1}</span>
                <div>
                  <h4 className="ms-dropoff-name">{spot.title}</h4>
                  <p className="ms-dropoff-detail">{spot.detail}</p>
                  <p className="ms-dropoff-evidence">{spot.evidence}</p>
                  <p className="ms-dropoff-fix">
                    <strong>Try:</strong> {spot.fixHint}
                  </p>
                  {spot.adminUrl ? (
                    <a
                      href={spot.adminUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ms-text-link"
                    >
                      Open in Shopify Admin →
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
