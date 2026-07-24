import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: "chart" | "spark" | "box";
};

const icons = {
  chart: "📊",
  spark: "✨",
  box: "📦",
};

export function EmptyState({
  title,
  description,
  action,
  icon = "spark",
}: EmptyStateProps) {
  return (
    <div className="ms-empty">
      <div className="ms-empty-icon" aria-hidden>
        {icons[icon]}
      </div>
      <h3 className="ms-empty-title">{title}</h3>
      <p className="ms-empty-text">{description}</p>
      {action ? <div className="ms-empty-action">{action}</div> : null}
    </div>
  );
}
