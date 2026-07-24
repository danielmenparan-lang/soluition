import { AppLink } from "../AppLink";

export function ChatPromo() {
  return (
    <div className="ms-chat-promo">
      <div className="ms-chat-promo-copy">
        <p className="ms-chat-promo-kicker">Live chat</p>
        <h3 className="ms-chat-promo-title">Talk to the assistant about your store</h3>
        <p className="ms-chat-promo-text">
          Ask about sales, products, ads, or setup — the assistant reads your tracking
          data and replies in plain English.
        </p>
      </div>
      <AppLink to="/app/chat" className="ms-btn ms-btn-primary ms-chat-promo-btn">
        Open chat
      </AppLink>
    </div>
  );
}
