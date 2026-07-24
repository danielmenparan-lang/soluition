import { AppLink } from "../AppLink";

export function ChatPromo() {
  return (
    <div className="ms-chat-promo ms-chat-rtl">
      <div className="ms-chat-promo-copy">
        <p className="ms-chat-promo-kicker">יועץ שיווק</p>
        <h3 className="ms-chat-promo-title">שאל על החנות שלך</h3>
        <p className="ms-chat-promo-text">
          מכירות, מוצרים, פרסום או הגדרות — התשובות מבוססות על נתוני המעקב שלך, בעברית
          פשוטה.
        </p>
      </div>
      <AppLink to="/app/chat" className="ms-btn ms-btn-primary ms-chat-promo-btn">
        פתח יועץ
      </AppLink>
    </div>
  );
}
