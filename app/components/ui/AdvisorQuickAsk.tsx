import { AppLink } from "../AppLink";
import { POSITIONING, CHAT_STARTERS } from "../../config/positioning";

type AdvisorQuickAskProps = {
  featured?: boolean;
};

export function AdvisorQuickAsk({ featured = false }: AdvisorQuickAskProps) {
  return (
    <div className={featured ? "ms-chat-featured" : "ms-advisor-quick"}>
      <div className="ms-chat-featured-badge">Start here</div>
      <div className="ms-advisor-quick-copy">
        <p className="ms-advisor-quick-kicker">{POSITIONING.chatKicker}</p>
        <h3 className="ms-advisor-quick-title">{POSITIONING.chatTitle}</h3>
        <p className="ms-advisor-quick-text">{POSITIONING.chatText}</p>
      </div>
      <div className="ms-advisor-quick-chips">
        {CHAT_STARTERS.map((q) => (
          <AppLink
            key={q}
            to={`/app/chat?q=${encodeURIComponent(q)}`}
            className="ms-btn ms-btn-chip ms-btn-chip-light"
          >
            {q}
          </AppLink>
        ))}
      </div>
      <AppLink to="/app/chat" className="ms-btn ms-btn-primary ms-chat-featured-cta">
        Open chat →
      </AppLink>
    </div>
  );
}
