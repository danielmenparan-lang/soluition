import { RFM_LABELS, type RfmSegment } from "../../types/store-intelligence.types";

const RFM_COLORS: Record<RfmSegment, string> = {
  champions: "#0a9b7a",
  loyal: "#3d7ee8",
  potential: "#6d5ef7",
  new: "#47c1bf",
  at_risk: "#e0950d",
  hibernating: "#8c9196",
};

type RfmBarChartProps = {
  segments: Record<RfmSegment, number>;
};

export function RfmBarChart({ segments }: RfmBarChartProps) {
  const entries = (Object.entries(segments) as Array<[RfmSegment, number]>).filter(
    ([, count]) => count > 0,
  );
  const max = Math.max(...entries.map(([, c]) => c), 1);
  const total = entries.reduce((s, [, c]) => s + c, 0);

  if (total === 0) {
    return (
      <div className="ms-chart-card">
        <s-text type="strong">Customer segments (RFM)</s-text>
        <div className="ms-chart-empty">
          Need identified customers with orders in this period.
        </div>
      </div>
    );
  }

  return (
    <div className="ms-chart-card">
      <div className="ms-chart-header">
        <div>
          <s-text type="strong">Customer segments (RFM)</s-text>
          <s-text color="subdued">{total} customers in period</s-text>
        </div>
      </div>
      <div className="ms-rfm-bars">
        {entries.map(([segment, count]) => (
          <div key={segment} className="ms-rfm-row">
            <span className="ms-rfm-label">{RFM_LABELS[segment]}</span>
            <div className="ms-rfm-track">
              <div
                className="ms-rfm-fill"
                style={{
                  width: `${(count / max) * 100}%`,
                  background: RFM_COLORS[segment],
                }}
              />
            </div>
            <span className="ms-rfm-count">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
