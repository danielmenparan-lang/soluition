import type { FunnelStep } from "../../services/funnel.server";

type FunnelChartProps = {
  steps: FunnelStep[];
};

export function FunnelChart({ steps }: FunnelChartProps) {
  const max = Math.max(...steps.map((s) => s.count), 1);
  const hasData = steps.some((s) => s.count > 0);

  if (!hasData) {
    return (
      <div className="ms-chart-card">
        <s-text type="strong">Conversion funnel</s-text>
        <div className="ms-chart-empty">
          Enable tracking and browse your storefront to see the funnel.
        </div>
      </div>
    );
  }

  return (
    <div className="ms-chart-card ms-funnel-card">
      <div className="ms-chart-header">
        <div>
          <s-text type="strong">Conversion funnel</s-text>
          <s-text color="subdued">Last 30 days — where visitors drop off</s-text>
        </div>
      </div>
      <div className="ms-funnel-steps">
        {steps.map((step, index) => {
          const widthPct = Math.max(8, (step.count / max) * 100);
          return (
            <div key={step.id} className="ms-funnel-step">
              <div className="ms-funnel-step-meta">
                <span className="ms-funnel-step-label">{step.label}</span>
                <span className="ms-funnel-step-count">{step.count.toLocaleString()}</span>
              </div>
              <div className="ms-funnel-bar-track">
                <div
                  className="ms-funnel-bar-fill"
                  style={{
                    width: `${widthPct}%`,
                    opacity: 1 - index * 0.08,
                  }}
                />
              </div>
              <div className="ms-funnel-step-stats">
                <span>{step.rateFromTopPct}% of top</span>
                {step.dropOffFromPrevPct !== null && step.dropOffFromPrevPct > 0 ? (
                  <span className="ms-funnel-drop">
                    −{step.dropOffFromPrevPct}% from previous step
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
