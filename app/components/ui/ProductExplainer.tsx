export function ProductExplainer({ compact = false }: { compact?: boolean }) {
  const steps = [
    {
      title: "Track",
      text: "See who visits, what they view, and where they leave without buying.",
      tone: "brand",
    },
    {
      title: "Diagnose",
      text: "Find funnel drop-offs, exit pages, and products that get views but no sales.",
      tone: "info",
    },
    {
      title: "Fix",
      text: "Get ranked fixes — what to change first for the biggest conversion lift.",
      tone: "ai",
    },
  ];

  return (
    <div className={`ms-explainer ${compact ? "ms-explainer-compact" : ""}`}>
      {!compact ? (
        <p className="ms-explainer-heading">How Solution finds blockers</p>
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
