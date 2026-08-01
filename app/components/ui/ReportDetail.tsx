import { AppLink } from "../AppLink";
import { asActionItems, asStringArray } from "../../utils/safe-json";
import type { WeeklyReport } from "../../types/database.types";

type ReportDetailProps = {
  report: WeeklyReport;
};

export function ReportDetail({ report }: ReportDetailProps) {
  const insights = asStringArray(report.insights);
  const topActions = asActionItems(report.top_actions);
  const growthOpportunities = asStringArray(report.growth_opportunities);
  const wastePoints = asStringArray(report.waste_points);

  return (
    <div className="ms-report-detail">
      <div className="ms-report-header">
        <div>
          <p className="ms-report-kicker">Weekly report</p>
          <h2 className="ms-report-week">
            {report.week_start} — {report.week_end}
          </h2>
          <p className="ms-report-generated">
            Generated {new Date(report.generated_at).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="ms-report-summary ms-card ms-card-ai">
        <p>{report.performance_summary}</p>
      </div>

      <div className="ms-report-grid">
        <section className="ms-report-section">
          <h3>Key takeaways</h3>
          {insights.length > 0 ? (
            <ul className="ms-report-list">
              {insights.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="ms-report-muted">No insights in this report.</p>
          )}
        </section>

        <section className="ms-report-section">
          <h3>Actions for this week</h3>
          {topActions.length > 0 ? (
            <div className="ms-report-actions">
              {topActions.map((item, i) => (
                <div key={i} className="ms-card ms-card-soft">
                  <strong>{item.action}</strong>
                  <p>Why: {item.impact}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="ms-report-muted">No actions listed.</p>
          )}
        </section>

        <section className="ms-report-section">
          <h3>Growth opportunities</h3>
          {growthOpportunities.length > 0 ? (
            <ul className="ms-report-list">
              {growthOpportunities.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="ms-report-muted">None listed.</p>
          )}
        </section>

        <section className="ms-report-section">
          <h3>Budget waste signals</h3>
          {wastePoints.length > 0 ? (
            <ul className="ms-report-list ms-report-list-warn">
              {wastePoints.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="ms-report-muted">None flagged.</p>
          )}
        </section>
      </div>

      <AppLink to="/app/recommendations" className="ms-text-link">
        Turn actions into tracked priorities →
      </AppLink>
    </div>
  );
}

type ReportHistoryProps = {
  reports: WeeklyReport[];
  selectedId: string;
};

export function ReportHistory({ reports, selectedId }: ReportHistoryProps) {
  if (reports.length <= 1) return null;

  return (
    <div className="ms-report-history">
      <h3 className="ms-report-history-title">Report history</h3>
      <div className="ms-report-history-list">
        {reports.map((report) => (
          <AppLink
            key={report.id}
            to={`/app/reports?report=${report.id}`}
            className={`ms-report-history-item ${report.id === selectedId ? "is-active" : ""}`}
          >
            <span>{report.week_start} — {report.week_end}</span>
            <span className="ms-report-history-date">
              {new Date(report.generated_at).toLocaleDateString()}
            </span>
          </AppLink>
        ))}
      </div>
    </div>
  );
}
