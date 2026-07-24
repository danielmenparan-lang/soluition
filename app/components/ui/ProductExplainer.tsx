export function ProductExplainer({ compact = false }: { compact?: boolean }) {
  const steps = [
    {
      icon: "📡",
      title: "מעקב",
      text: "Solution סופרת מי נכנס לחנות, מאיפה הגיע, ומה צפה.",
      tone: "brand",
    },
    {
      icon: "🔍",
      title: "ניתוח",
      text: "המערכת מזהה מה מביא מכירות, מה חוסם, ואיפה מפסידים.",
      tone: "info",
    },
    {
      icon: "🎯",
      title: "פעולה",
      text: "מקבלים המלצות, צ'אט, ודוחות — מה לעשות עכשיו.",
      tone: "ai",
    },
  ];

  return (
    <div className={`ms-explainer ${compact ? "ms-explainer-compact" : ""}`}>
      {!compact ? (
        <p className="ms-explainer-heading">איך Solution עובדת?</p>
      ) : null}
      <div className="ms-explainer-steps">
        {steps.map((step, index) => (
          <div key={step.title} className={`ms-explainer-step ms-explainer-${step.tone}`}>
            <span className="ms-explainer-icon" aria-hidden>
              {step.icon}
            </span>
            <div>
              <strong className="ms-explainer-title">
                {index + 1}. {step.title}
              </strong>
              <p className="ms-explainer-text">{step.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
