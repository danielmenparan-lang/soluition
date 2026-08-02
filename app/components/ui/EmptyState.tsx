import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: "chart" | "box" | "chat" | "report";
};

function EmptyIcon({ type }: { type: NonNullable<EmptyStateProps["icon"]> }) {
  const common = {
    width: 40,
    height: 40,
    viewBox: "0 0 48 48",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
  };
  const fill = "#64748b";

  switch (type) {
    case "chart":
      return (
        <svg {...common} aria-hidden>
          <rect x="8" y="26" width="7" height="14" rx="1" fill={fill} opacity="0.5" />
          <rect x="20" y="18" width="7" height="22" rx="1" fill={fill} opacity="0.7" />
          <rect x="32" y="12" width="7" height="28" rx="1" fill={fill} />
        </svg>
      );
    case "chat":
      return (
        <svg {...common} aria-hidden>
          <path
            d="M10 8h28a4 4 0 014 4v16a4 4 0 01-4 4H22l-8 8v-8H10a4 4 0 01-4-4V12a4 4 0 014-4z"
            fill={fill}
            opacity="0.55"
          />
        </svg>
      );
    case "report":
      return (
        <svg {...common} aria-hidden>
          <rect x="12" y="8" width="24" height="32" rx="2" stroke={fill} strokeWidth="2" opacity="0.4" />
          <rect x="16" y="16" width="16" height="2" rx="1" fill={fill} opacity="0.5" />
          <rect x="16" y="22" width="12" height="2" rx="1" fill={fill} opacity="0.35" />
        </svg>
      );
    default:
      return (
        <svg {...common} aria-hidden>
          <path d="M10 14h28v22H10z" stroke={fill} strokeWidth="2" opacity="0.45" />
          <path d="M10 14l14 10 14-10" stroke={fill} strokeWidth="2" opacity="0.35" />
        </svg>
      );
  }
}

export function EmptyState({
  title,
  description,
  action,
  icon = "box",
}: EmptyStateProps) {
  return (
    <div className="ms-empty">
      <div className="ms-empty-icon-wrap" aria-hidden>
        <EmptyIcon type={icon} />
      </div>
      <h3 className="ms-empty-title">{title}</h3>
      <p className="ms-empty-text">{description}</p>
      {action ? <div className="ms-empty-action">{action}</div> : null}
    </div>
  );
}
