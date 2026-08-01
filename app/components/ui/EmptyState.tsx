import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: "chart" | "spark" | "box" | "chat" | "report";
};

function EmptyIcon({ type }: { type: NonNullable<EmptyStateProps["icon"]> }) {
  const common = {
    width: 48,
    height: 48,
    viewBox: "0 0 48 48",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
  };

  switch (type) {
    case "chart":
      return (
        <svg {...common} aria-hidden>
          <rect x="6" y="24" width="8" height="18" rx="2" fill="#0a9b7a" opacity="0.85" />
          <rect x="20" y="16" width="8" height="26" rx="2" fill="#6d5ef7" opacity="0.85" />
          <rect x="34" y="10" width="8" height="32" rx="2" fill="#3d7ee8" opacity="0.85" />
        </svg>
      );
    case "chat":
      return (
        <svg {...common} aria-hidden>
          <path
            d="M10 8h28a4 4 0 014 4v16a4 4 0 01-4 4H22l-8 8v-8H10a4 4 0 01-4-4V12a4 4 0 014-4z"
            fill="#6d5ef7"
            opacity="0.9"
          />
        </svg>
      );
    case "report":
      return (
        <svg {...common} aria-hidden>
          <rect x="10" y="6" width="28" height="36" rx="4" fill="#e0950d" opacity="0.2" />
          <rect x="14" y="14" width="20" height="3" rx="1.5" fill="#e0950d" />
          <rect x="14" y="22" width="16" height="3" rx="1.5" fill="#e0950d" opacity="0.7" />
          <rect x="14" y="30" width="18" height="3" rx="1.5" fill="#e0950d" opacity="0.5" />
        </svg>
      );
    case "box":
      return (
        <svg {...common} aria-hidden>
          <path d="M8 16l16-8 16 8v20l-16 8-16-8V16z" fill="#5c6b7a" opacity="0.25" />
          <path d="M24 8v40M8 16l16 8 16-8" stroke="#5c6b7a" strokeWidth="2" />
        </svg>
      );
    default:
      return (
        <svg {...common} aria-hidden>
          <path
            d="M24 4l4.5 13.5H42L30 27l4.5 13.5L24 34 13.5 40.5 18 27 6 17.5h13.5L24 4z"
            fill="#0a9b7a"
            opacity="0.85"
          />
        </svg>
      );
  }
}

export function EmptyState({
  title,
  description,
  action,
  icon = "spark",
}: EmptyStateProps) {
  return (
    <div className="ms-empty ms-empty-polished">
      <div className="ms-empty-icon-wrap" aria-hidden>
        <EmptyIcon type={icon} />
      </div>
      <h3 className="ms-empty-title">{title}</h3>
      <p className="ms-empty-text">{description}</p>
      {action ? <div className="ms-empty-action">{action}</div> : null}
    </div>
  );
}
