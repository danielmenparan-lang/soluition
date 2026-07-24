type ChatNoticeProps = {
  variant: "owner" | "not-for-customers";
};

export function ChatNotice({ variant }: ChatNoticeProps) {
  if (variant === "not-for-customers") {
    return (
      <div className="ms-chat-notice ms-chat-notice-info ms-chat-rtl">
        <strong>שים לב:</strong> הצ'אט הזה בשבילך — בעל החנות. לקוחות לא רואים אותו.
        האפליקציה לא מציגה צ'אט בחנות עצמה.
      </div>
    );
  }

  return (
    <div className="ms-chat-notice ms-chat-notice-success ms-chat-rtl">
      <strong>יועץ שיווק זמין.</strong> שאל על מכירות, מוצרים ושיווק.
      התשובות מבוססות על נתוני המעקב האמיתיים שלך.
    </div>
  );
}
