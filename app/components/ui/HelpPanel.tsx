type HelpPanelProps = {
  title: string;
  items: Array<{ label: string; text: string }>;
};

export function HelpPanel({ title, items }: HelpPanelProps) {
  return (
    <div className="ms-help-panel">
      <div className="ms-help-panel-header">
        <span className="ms-help-icon" aria-hidden>
          💡
        </span>
        <h2 className="ms-help-panel-title">{title}</h2>
      </div>
      <div className="ms-help-grid">
        {items.map((item) => (
          <div key={item.label} className="ms-help-item">
            <div className="ms-help-item-label">{item.label}</div>
            <p className="ms-help-item-text">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
