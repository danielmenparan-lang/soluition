import { useId, type CSSProperties, type ReactNode } from "react";
import type { useShopifyFetcher } from "../hooks/useShopifyFetcher";

type ShopifyFetcher = ReturnType<typeof useShopifyFetcher>;

type SubmitButtonProps = {
  fetcher: ShopifyFetcher;
  children: ReactNode;
  slot?: string;
  intent?: string;
  fields?: Record<string, string>;
  variant?: "primary" | "secondary";
};

const buttonStyle: Record<NonNullable<SubmitButtonProps["variant"]>, CSSProperties> = {
  primary: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    background: "#303030",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "14px",
  },
  secondary: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    background: "#fff",
    color: "#303030",
    fontWeight: 500,
    cursor: "pointer",
    fontSize: "14px",
  },
};

export function SubmitButton({
  fetcher,
  children,
  slot,
  intent,
  fields,
  variant = "primary",
}: SubmitButtonProps) {
  const { Form, actionUrl, state } = fetcher;
  const formId = useId().replace(/:/g, "");
  const disabled = state !== "idle";

  return (
    <>
      <Form id={formId} method="post" action={actionUrl} style={{ display: "none" }}>
        {intent ? <input type="hidden" name="intent" value={intent} /> : null}
        {fields
          ? Object.entries(fields).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))
          : null}
      </Form>
      <button
        type="submit"
        form={formId}
        slot={slot}
        disabled={disabled}
        style={{
          ...buttonStyle[variant],
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {children}
      </button>
    </>
  );
}
