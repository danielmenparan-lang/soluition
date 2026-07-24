type MetricCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "brand" | "ai" | "info" | "warning";
};

const accents: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  brand: "#008060",
  ai: "#5c6ac4",
  info: "#2c6ecb",
  warning: "#b98900",
};

export function MetricCard({
  label,
  value,
  hint,
  accent = "brand",
}: MetricCardProps) {
  return (
    <div className="ms-metric-card" style={{ ["--ms-accent" as string]: accents[accent] }}>
      <div className="ms-metric-label">{label}</div>
      <div className="ms-metric-value">{value}</div>
      {hint ? <div className="ms-metric-hint">{hint}</div> : null}
    </div>
  );
}
