import { CATEGORY_LABELS, PRIORITY_LABELS, priorityClass } from "./labels";
import { asStringArray } from "../../utils/safe-json";
import type { AIRecommendation } from "../../types/database.types";

export function RecommendationCard({ rec }: { rec: AIRecommendation }) {
  const actions = asStringArray(rec.action_items);

  return (
    <div className="ms-card ms-card-ai">
      <s-stack direction="block" gap="small">
        <s-stack direction="inline" gap="small">
          <s-text type="strong">{rec.title}</s-text>
          <span className={priorityClass(rec.priority)}>
            {PRIORITY_LABELS[rec.priority] ?? rec.priority}
          </span>
          <span className="ms-badge ms-badge-category">
            {CATEGORY_LABELS[rec.category] ?? rec.category}
          </span>
        </s-stack>
        <s-paragraph>{rec.description}</s-paragraph>
        {rec.expected_impact ? (
          <s-text color="subdued">Why it matters: {rec.expected_impact}</s-text>
        ) : null}
        {actions.length > 0 ? (
          <div className="ms-rec-actions">
            <p className="ms-rec-actions-title">What to do:</p>
            <s-unordered-list>
              {actions.map((item, i) => (
                <s-list-item key={i}>{item}</s-list-item>
              ))}
            </s-unordered-list>
          </div>
        ) : null}
      </s-stack>
    </div>
  );
}
