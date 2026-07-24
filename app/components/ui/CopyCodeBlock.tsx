import { useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

type CopyCodeBlockProps = {
  code: string;
};

export function CopyCodeBlock({ code }: CopyCodeBlockProps) {
  const shopify = useAppBridge();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      shopify.toast.show("הועתק ללוח");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      shopify.toast.show("לא הצלחנו להעתיק — העתק ידנית");
    }
  };

  return (
    <div className="ms-code-block">
      <button type="button" className="ms-copy-btn" onClick={copy}>
        {copied ? "הועתק ✓" : "העתק"}
      </button>
      {code}
    </div>
  );
}
