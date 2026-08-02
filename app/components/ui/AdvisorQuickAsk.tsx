import { AppLink } from "../AppLink";
import { POSITIONING, CHAT_STARTERS } from "../../config/positioning";

export function AdvisorQuickAsk() {
  return (
    <section className="ms-chat-block">
      <h2 className="ms-section-title">{POSITIONING.chatTitle}</h2>
      <p className="ms-section-lead">{POSITIONING.chatLead}</p>
      <ul className="ms-suggested-questions">
        {CHAT_STARTERS.map((q) => (
          <li key={q}>
            <AppLink to={`/app/chat?q=${encodeURIComponent(q)}`} className="ms-suggested-link">
              {q}
            </AppLink>
          </li>
        ))}
      </ul>
      <AppLink to="/app/chat" className="ms-btn ms-btn-primary">
        Open chat
      </AppLink>
    </section>
  );
}
