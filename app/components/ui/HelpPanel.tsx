import { useState } from "react";

type HelpPanelProps = {
  title: string;
  items: Array<{ label: string; text: string }>;
  defaultOpen?: boolean;
};

export function HelpPanel({
  title,
  items,
  defaultOpen = false,
}: HelpPanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`ms-help-panel ${open ? "is-open" : "is-collapsed"}`}>
      <button
        type="button"
        className="ms-help-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="ms-help-icon" aria-hidden>
          ?
        </span>
        <span className="ms-help-panel-title">{title}</span>
        <span className="ms-help-chevron">{open ? "▲" : "▼"}</span>
      </button>
      {open ? (
        <div className="ms-help-grid">
          {items.map((item) => (
            <div key={item.label} className="ms-help-item">
              <div className="ms-help-item-label">{item.label}</div>
              <p className="ms-help-item-text">{item.text}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
