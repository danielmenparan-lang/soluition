import { useState } from "react";
import { asStringArray } from "../../utils/safe-json";
import { POSITIONING } from "../../config/positioning";
import { SubmitButton } from "../SubmitButton";
import type { useShopifyFetcher } from "../../hooks/useShopifyFetcher";
import type { AIRecommendation } from "../../types/database.types";

type ShopifyFetcher = ReturnType<typeof useShopifyFetcher>;

type PriorityActionCardProps = {
  rec: AIRecommendation;
  fetcher: ShopifyFetcher;
  rank: number;
  spotlight?: boolean;
};

export function PriorityActionCard({ rec, fetcher, rank, spotlight = false }: PriorityActionCardProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const actions = asStringArray(rec.action_items);
  const firstAction = actions[0];

  return (
    <article className={`ms-action-card ${spotlight ? "ms-action-card-spotlight" : ""}`}>
      {spotlight ? <span className="ms-action-card-badge">{POSITIONING.todayLabel}</span> : null}
      <h3 className="ms-action-card-title">{rec.title}</h3>
      <p className="ms-action-card-desc">{rec.description}</p>
      {rec.expected_impact ? <p className="ms-action-card-impact">{rec.expected_impact}</p> : null}
      {firstAction ? <p className="ms-action-card-step">{firstAction}</p> : null}

      <label className="ms-responsibility-check">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
        />
        {POSITIONING.responsibilityAck}
      </label>

      {acknowledged ? (
        <SubmitButton
          fetcher={fetcher}
          intent="complete_recommendation"
          fields={{ recommendationId: rec.id }}
        >
          I applied it
        </SubmitButton>
      ) : (
        <button type="button" className="ms-btn ms-btn-primary" disabled>
          I applied it
        </button>
      )}
    </article>
  );
}
