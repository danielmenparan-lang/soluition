type ChatNoticeProps = {
  variant: "owner" | "not-for-customers";
};

export function ChatNotice({ variant }: ChatNoticeProps) {
  if (variant === "not-for-customers") {
    return (
      <div className="ms-notice ms-notice-info">
        <strong>חשוב לדעת:</strong> הצ&apos;אט הזה בשבילך — בעל החנות. לקוחות שמבקרים
        בחנות לא רואים אותו. אי אפשר כרגע לשים צ&apos;אט כזה בחנות עצמה מתוך
        האפליקציה הזו.
      </div>
    );
  }

  return (
    <div className="ms-notice ms-notice-success">
      <strong>כן — יש לך צ&apos;אט.</strong> שאל כאן כל שאלה על המכירות, המוצרים
      והפרסום שלך. העוזר עונה לפי הנתונים האמיתיים מהחנות.
    </div>
  );
}
