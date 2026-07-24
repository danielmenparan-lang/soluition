import { useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

type CopyCodeBlockProps = {
  code: string;
  label?: string;
};

export function CopyCodeBlock({ code, label = "Copy:" }: CopyCodeBlockProps) {
  const shopify = useAppBridge();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      shopify.toast.show("Copied — paste it in the theme editor");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      shopify.toast.show("Could not copy — select and copy manually");
    }
  }

  return (
    <div className="ms-copy-block">
      {label ? <p className="ms-copy-label">{label}</p> : null}
      <div className="ms-copy-row">
        <code className="ms-copy-code">{code}</code>
        <button type="button" className="ms-btn ms-btn-secondary" onClick={handleCopy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
