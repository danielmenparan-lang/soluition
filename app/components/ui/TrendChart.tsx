import { formatMoney } from "../../utils/format-currency";

export type ChartPoint = {
  date: string;
  value: number;
};

type TrendChartProps = {
  title: string;
  subtitle?: string;
  points: ChartPoint[];
  currency?: string;
  valueLabel?: string;
  emptyMessage?: string;
  accent?: string;
};

function formatShortDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function TrendChart({
  title,
  subtitle,
  points,
  currency,
  valueLabel = "Total",
  emptyMessage = "No data for this period yet.",
  accent = "#0a9b7a",
}: TrendChartProps) {
  const values = points.map((p) => p.value);
  const max = Math.max(...values, 1);
  const total = values.reduce((a, b) => a + b, 0);
  const hasData = total > 0;

  const width = 640;
  const height = 160;
  const padX = 8;
  const padY = 12;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const coords = points.map((p, i) => {
    const x = padX + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
    const y = padY + innerH - (p.value / max) * innerH;
    return { x, y, ...p };
  });

  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(padY + innerH).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(padY + innerH).toFixed(1)} Z`
      : "";

  return (
    <div className="ms-chart-card">
      <div className="ms-chart-header">
        <div>
          <s-text type="strong">{title}</s-text>
          {subtitle ? <s-text color="subdued">{subtitle}</s-text> : null}
        </div>
        <div className="ms-chart-total">
          <span className="ms-chart-total-label">{valueLabel}</span>
          <span className="ms-chart-total-value">
            {currency ? formatMoney(total, currency) : total.toLocaleString()}
          </span>
        </div>
      </div>

      {!hasData ? (
        <div className="ms-chart-empty">{emptyMessage}</div>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="ms-chart-svg"
          role="img"
          aria-label={`${title} chart`}
        >
          <defs>
            <linearGradient id="ms-chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((t) => (
            <line
              key={t}
              x1={padX}
              x2={width - padX}
              y1={padY + innerH * (1 - t)}
              y2={padY + innerH * (1 - t)}
              className="ms-chart-grid-line"
            />
          ))}
          {areaPath ? <path d={areaPath} fill="url(#ms-chart-fill)" /> : null}
          {linePath ? (
            <path
              d={linePath}
              fill="none"
              stroke={accent}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
          {coords
            .filter((_, i) => i % Math.ceil(points.length / 6) === 0 || i === points.length - 1)
            .map((c) => (
              <circle key={c.date} cx={c.x} cy={c.y} r="3.5" fill={accent} />
            ))}
        </svg>
      )}

      {hasData && points.length > 0 ? (
        <div className="ms-chart-axis">
          <span>{formatShortDate(points[0].date)}</span>
          <span>{formatShortDate(points[points.length - 1].date)}</span>
        </div>
      ) : null}
    </div>
  );
}
