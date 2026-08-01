import { AppLink } from "../AppLink";
import { POSITIONING, CHAT_STARTERS } from "../../config/positioning";

export function ChatPromo() {
  return (
    <div className="ms-chat-promo">
      <div className="ms-chat-promo-copy">
        <p className="ms-chat-promo-kicker">{POSITIONING.chatKicker}</p>
        <h3 className="ms-chat-promo-title">{POSITIONING.chatTitle}</h3>
        <p className="ms-chat-promo-text">{POSITIONING.chatText}</p>
      </div>
      <AppLink to="/app/chat" className="ms-btn ms-btn-primary ms-chat-promo-btn">
        Open chat
      </AppLink>
    </div>
  );
}
