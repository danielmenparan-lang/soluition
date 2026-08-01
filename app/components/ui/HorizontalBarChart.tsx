type BarItem = {
  label: string;
  value: number;
  suffix?: string;
};

type HorizontalBarChartProps = {
  title: string;
  subtitle?: string;
  items: BarItem[];
  accent?: string;
  emptyMessage?: string;
};

export function HorizontalBarChart({
  title,
  subtitle,
  items,
  accent = "#0a9b7a",
  emptyMessage = "No data yet.",
}: HorizontalBarChartProps) {
  const max = Math.max(...items.map((i) => i.value), 1);
  const hasData = items.some((i) => i.value > 0);

  return (
    <div className="ms-chart-card">
      <div className="ms-chart-header">
        <div>
          <s-text type="strong">{title}</s-text>
          {subtitle ? <s-text color="subdued">{subtitle}</s-text> : null}
        </div>
      </div>
      {!hasData ? (
        <div className="ms-chart-empty">{emptyMessage}</div>
      ) : (
        <div className="ms-hbar-list">
          {items.map((item) => (
            <div key={item.label} className="ms-hbar-row">
              <span className="ms-hbar-label">{item.label}</span>
              <div className="ms-hbar-track">
                <div
                  className="ms-hbar-fill"
                  style={{
                    width: `${(item.value / max) * 100}%`,
                    background: accent,
                  }}
                />
              </div>
              <span className="ms-hbar-value">
                {item.value.toLocaleString()}
                {item.suffix ?? ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
