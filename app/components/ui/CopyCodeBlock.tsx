import { useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

type CopyCodeBlockProps = {
  code: string;
  label?: string;
};

export function CopyCodeBlock({ code, label = "העתק:" }: CopyCodeBlockProps) {
  const shopify = useAppBridge();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      shopify.toast.show("הועתק — עכשיו הדבק במקום הנכון");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      shopify.toast.show("לא הצלחנו להעתיק — סמן והעתק ידנית");
    }
  };

  return (
    <div className="ms-code-wrap">
      <div className="ms-code-toolbar">
        <span className="ms-code-label">{label}</span>
        <button type="button" className="ms-copy-btn" onClick={copy}>
          {copied ? "הועתק ✓" : "העתק"}
        </button>
      </div>
      <pre className="ms-code-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}
