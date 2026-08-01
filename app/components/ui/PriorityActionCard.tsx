import { CATEGORY_LABELS, PRIORITY_LABELS, priorityClass } from "./labels";
import { asStringArray } from "../../utils/safe-json";
import { SubmitButton } from "../SubmitButton";
import type { useShopifyFetcher } from "../../hooks/useShopifyFetcher";
import type { AIRecommendation } from "../../types/database.types";

type ShopifyFetcher = ReturnType<typeof useShopifyFetcher>;

type PriorityActionCardProps = {
  rec: AIRecommendation;
  fetcher: ShopifyFetcher;
  rank: number;
};

export function PriorityActionCard({ rec, fetcher, rank }: PriorityActionCardProps) {
  const actions = asStringArray(rec.action_items);
  const firstAction = actions[0];

  return (
    <article className="ms-action-card">
      <div className="ms-action-rank">{rank}</div>
      <div className="ms-action-body">
        <div className="ms-action-meta">
          <span className={priorityClass(rec.priority)}>
            {PRIORITY_LABELS[rec.priority] ?? rec.priority}
          </span>
          <span className="ms-badge ms-badge-category">
            {CATEGORY_LABELS[rec.category] ?? rec.category}
          </span>
        </div>
        <h3 className="ms-action-title">{rec.title}</h3>
        <p className="ms-action-desc">{rec.description}</p>
        {firstAction ? (
          <p className="ms-action-next">
            <strong>Do this:</strong> {firstAction}
          </p>
        ) : null}
        {rec.expected_impact ? (
          <p className="ms-action-impact">Why: {rec.expected_impact}</p>
        ) : null}
      </div>
      <div className="ms-action-buttons">
        <SubmitButton
          fetcher={fetcher}
          variant="secondary"
          intent="dismiss_recommendation"
          fields={{ recommendationId: rec.id }}
        >
          Dismiss
        </SubmitButton>
        <SubmitButton
          fetcher={fetcher}
          intent="complete_recommendation"
          fields={{ recommendationId: rec.id }}
        >
          Done
        </SubmitButton>
      </div>
    </article>
  );
}
