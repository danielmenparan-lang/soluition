import { AppLink } from "../AppLink";
import { POSITIONING, ADVISOR_STARTERS } from "../../config/positioning";

export function AdvisorQuickAsk() {
  return (
    <div className="ms-advisor-quick">
      <div className="ms-advisor-quick-copy">
        <p className="ms-advisor-quick-kicker">{POSITIONING.advisorKicker}</p>
        <h3 className="ms-advisor-quick-title">{POSITIONING.advisorTitle}</h3>
        <p className="ms-advisor-quick-text">{POSITIONING.advisorText}</p>
      </div>
      <div className="ms-advisor-quick-chips">
        {ADVISOR_STARTERS.map((q) => (
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
        Open conversion coach →
      </AppLink>
    </div>
  );
}
