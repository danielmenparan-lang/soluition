import { AppLink } from "../AppLink";
import { POSITIONING } from "../../config/positioning";

export function ChatPromo() {
  return (
    <div className="ms-chat-promo">
      <div className="ms-chat-promo-copy">
        <p className="ms-chat-promo-kicker">{POSITIONING.advisorKicker}</p>
        <h3 className="ms-chat-promo-title">Why aren't visitors buying?</h3>
        <p className="ms-chat-promo-text">{POSITIONING.advisorText}</p>
      </div>
      <AppLink to="/app/chat" className="ms-btn ms-btn-primary ms-chat-promo-btn">
        Ask the coach
      </AppLink>
    </div>
  );
}
