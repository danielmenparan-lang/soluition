import { SetupGuide } from "./SetupGuide";

type WelcomeScreenProps = {
  shopDomain: string;
  trackingId: string;
  trackingScriptUrl: string;
  hasData: boolean;
  hasRecommendations: boolean;
};

const VALUE_POINTS = [
  {
    icon: "👀",
    title: "רואה מי נכנס לחנות",
    text: "כמה אנשים ביקרו, מאיפה הגיעו, ומה הם צפו.",
  },
  {
    icon: "📈",
    title: "מבינה מה עובד ומה לא",
    text: "איזה מוצרים מושכים, איפה אנשים עוזבים, ומה מביא מכירות.",
  },
  {
    icon: "✅",
    title: "אומרת לך מה לעשות",
    text: "רשימה ברורה — מה לפרסם, מה לשפר, ומה לתקן קודם.",
  },
];

export function WelcomeScreen({
  shopDomain,
  trackingId,
  trackingScriptUrl,
  hasData,
  hasRecommendations,
}: WelcomeScreenProps) {
  const step = hasRecommendations ? 3 : hasData ? 2 : 1;

  return (
    <div className="ms-welcome">
      <div className="ms-welcome-intro">
        <p className="ms-welcome-kicker">ברוך הבא ל-Solution</p>
        <h1 className="ms-welcome-title">
          {step === 1
            ? "בוא נחבר את Solution לחנות שלך"
            : step === 2
              ? "כמעט שם — רק עוד צעד קטן"
              : "מוכן — בוא נראה מה כדאי לעשות"}
        </h1>
        <p className="ms-welcome-lead">
          {step === 1
            ? "Solution עוקב אחרי מי שנכנס לחנות, מנתח את ההתנהגות שלו, ונותן לך המלצות ברורות כדי למכור יותר. קודם צריך להפעיל מעקב — זה לוקח בערך דקה."
            : step === 2
              ? "המעקב מחובר. עכשיו פתח את החנות, גלוש בכמה דפים, וחזור — כך נתחיל לאסוף נתונים."
              : "יש מספיק נתונים. לחץ «קבל המלצות» למעלה ותראה מה כדאי לשפר בחנות."}
        </p>
      </div>

      {step === 1 ? (
        <div className="ms-welcome-values">
          <p className="ms-welcome-values-title">מה Solution עושה בשבילך?</p>
          <div className="ms-welcome-value-grid">
            {VALUE_POINTS.map((point) => (
              <div key={point.title} className="ms-welcome-value-card">
                <span className="ms-welcome-value-icon" aria-hidden>
                  {point.icon}
                </span>
                <strong className="ms-welcome-value-name">{point.title}</strong>
                <p className="ms-welcome-value-text">{point.text}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <SetupGuide
        shopDomain={shopDomain}
        trackingId={trackingId}
        trackingScriptUrl={trackingScriptUrl}
        hasData={hasData}
        hasRecommendations={hasRecommendations}
        embedded
      />
    </div>
  );
}
