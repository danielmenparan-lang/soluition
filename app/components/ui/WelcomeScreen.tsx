import { SetupGuide } from "./SetupGuide";
import { ChatPromo } from "./ChatPromo";
import { ProductExplainer } from "./ProductExplainer";

type WelcomeScreenProps = {
  shopDomain: string;
  trackingId: string;
  trackingScriptUrl: string;
  hasData: boolean;
  hasRecommendations: boolean;
};

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

      {step === 1 ? <ProductExplainer /> : null}

      <SetupGuide
        shopDomain={shopDomain}
        trackingId={trackingId}
        trackingScriptUrl={trackingScriptUrl}
        hasData={hasData}
        hasRecommendations={hasRecommendations}
        embedded
      />

      <ChatPromo />
    </div>
  );
}
