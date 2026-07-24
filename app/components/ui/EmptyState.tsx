import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="ms-empty">
      <h3 className="ms-empty-title">{title}</h3>
      <p className="ms-empty-text">{description}</p>
      {action}
    </div>
  );
}
