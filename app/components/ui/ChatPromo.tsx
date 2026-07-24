import { AppLink } from "../AppLink";

export function ChatPromo() {
  return (
    <div className="ms-chat-promo">
      <div className="ms-chat-promo-copy">
        <p className="ms-chat-promo-kicker">צ&apos;אט חי</p>
        <h3 className="ms-chat-promo-title">דבר עם העוזר על החנות שלך</h3>
        <p className="ms-chat-promo-text">
          שאל על מכירות, מוצרים, פרסום או התקנה — העוזר מקבל את הנתונים מהחנות,
          מנתח אותם, ועונה בעברית פשוטה.
        </p>
      </div>
      <AppLink to="/app/chat" className="ms-btn ms-btn-primary ms-chat-promo-btn">
        פתח צ&apos;אט →
      </AppLink>
    </div>
  );
}
