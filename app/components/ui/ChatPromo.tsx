import { AppLink } from "../AppLink";
import { POSITIONING } from "../../config/positioning";

export function ChatPromo() {
  return (
    <div className="ms-chat-promo">
      <p className="ms-section-lead">{POSITIONING.chatLead}</p>
      <AppLink to="/app/chat" className="ms-text-link">
        Open chat
      </AppLink>
    </div>
  );
}
