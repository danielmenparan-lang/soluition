import { AppLink } from "../AppLink";

export function ChatPromo() {
  return (
    <div className="ms-chat-promo">
      <div className="ms-chat-promo-copy">
        <p className="ms-chat-promo-kicker">Marketing advisor</p>
        <h3 className="ms-chat-promo-title">Ask about your store</h3>
        <p className="ms-chat-promo-text">
          Sales, products, ads, or setup — clear professional answers based on your
          tracking data.
        </p>
      </div>
      <AppLink to="/app/chat" className="ms-btn ms-btn-primary ms-chat-promo-btn">
        Open advisor
      </AppLink>
    </div>
  );
}
