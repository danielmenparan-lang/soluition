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
};

export function PriorityActionCard({ rec, fetcher, rank }: PriorityActionCardProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const actions = asStringArray(rec.action_items);
  const firstAction = actions[0];
  const isFirst = rank === 1 || rec.priority === "high";

  return (
    <article className="ms-fix-item ms-marketing-card">
      <div className="ms-fix-item-head">
        {isFirst ? <span className="ms-fix-flag">{rank === 1 ? "Do today" : "Start here"}</span> : null}
        <span className="ms-marketing-tag">Marketing action</span>
        <h3 className="ms-fix-title">{rec.title}</h3>
      </div>
      <p className="ms-fix-desc">{rec.description}</p>
      {rec.expected_impact ? <p className="ms-fix-why">{rec.expected_impact}</p> : null}
      {firstAction ? <p className="ms-fix-step">{firstAction}</p> : null}
      <label className="ms-responsibility-check">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
        />
        {POSITIONING.responsibilityAck}
      </label>
      <div className="ms-fix-actions">
        <SubmitButton
          fetcher={fetcher}
          variant="secondary"
          intent="dismiss_recommendation"
          fields={{ recommendationId: rec.id }}
        >
          Skip
        </SubmitButton>
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
      </div>
    </article>
  );
}
