import { AppLink } from "../AppLink";

const STARTERS = [
  "What should I fix first this week?",
  "Why is conversion low?",
  "Which product should I promote?",
];

export function AdvisorQuickAsk() {
  return (
    <div className="ms-advisor-quick">
      <div className="ms-advisor-quick-copy">
        <p className="ms-advisor-quick-kicker">AI Marketing Advisor</p>
        <h3 className="ms-advisor-quick-title">Ask anything about your store</h3>
        <p className="ms-advisor-quick-text">
          Plain-language answers based on your visitor data and Shopify orders.
        </p>
      </div>
      <div className="ms-advisor-quick-chips">
        {STARTERS.map((q) => (
          <AppLink
            key={q}
            to={`/app/chat?q=${encodeURIComponent(q)}`}
            className="ms-btn ms-btn-chip"
          >
            {q}
          </AppLink>
        ))}
      </div>
      <AppLink to="/app/chat" className="ms-btn ms-btn-secondary">
        Open full advisor →
      </AppLink>
    </div>
  );
}
