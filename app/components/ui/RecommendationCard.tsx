import { useState } from "react";
import { asStringArray } from "../../utils/safe-json";
import { POSITIONING } from "../../config/positioning";
import { SubmitButton } from "../SubmitButton";
import type { useShopifyFetcher } from "../../hooks/useShopifyFetcher";
import type { AIRecommendation } from "../../types/database.types";

type ShopifyFetcher = ReturnType<typeof useShopifyFetcher>;

export function RecommendationCard({
  rec,
  fetcher,
}: {
  rec: AIRecommendation;
  fetcher?: ShopifyFetcher;
}) {
  const [acknowledged, setAcknowledged] = useState(false);
  const actions = asStringArray(rec.action_items);

  return (
    <div className="ms-fix-item ms-fix-item-flat ms-marketing-card">
      <div className="ms-fix-item-head">
        {rec.priority === "high" ? <span className="ms-fix-flag">Do today</span> : null}
        <span className="ms-marketing-tag">Marketing action</span>
        <h3 className="ms-fix-title">{rec.title}</h3>
      </div>
      <p className="ms-fix-desc">{rec.description}</p>
      {rec.expected_impact ? <p className="ms-fix-why">{rec.expected_impact}</p> : null}
      {actions.length > 0 ? (
        <ul className="ms-fix-steps">
          {actions.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : null}
      {fetcher ? (
        <>
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
        </>
      ) : null}
    </div>
  );
}
