export function ProductExplainer({ compact = false }: { compact?: boolean }) {
  const steps = [
    {
      title: "Track",
      text: "Solution counts who visits your store, where they came from, and what they viewed.",
      tone: "brand",
    },
    {
      title: "Analyze",
      text: "We identify what drives sales, what blocks buyers, and where you lose revenue.",
      tone: "info",
    },
    {
      title: "Act",
      text: "Get recommendations, chat answers, and weekly reports — what to do next.",
      tone: "ai",
    },
  ];

  return (
    <div className={`ms-explainer ${compact ? "ms-explainer-compact" : ""}`}>
      {!compact ? (
        <p className="ms-explainer-heading">How Solution works</p>
      ) : null}
      <div className="ms-explainer-steps">
        {steps.map((step, index) => (
          <div key={step.title} className={`ms-explainer-step ms-explainer-${step.tone}`}>
            <span className="ms-explainer-step-num" aria-hidden>
              {index + 1}
            </span>
            <div>
              <strong className="ms-explainer-title">{step.title}</strong>
              <p className="ms-explainer-text">{step.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
