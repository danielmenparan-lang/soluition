import { useId, type ReactNode } from "react";
import type { useShopifyFetcher } from "../hooks/useShopifyFetcher";

type ShopifyFetcher = ReturnType<typeof useShopifyFetcher>;

type SubmitButtonProps = {
  fetcher: ShopifyFetcher;
  children: ReactNode;
  slot?: string;
  intent?: string;
  fields?: Record<string, string>;
  variant?: "primary" | "secondary" | "chip";
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
  const className =
    variant === "secondary"
      ? "ms-btn ms-btn-secondary"
      : variant === "chip"
        ? "ms-btn ms-btn-chip"
        : "ms-btn ms-btn-primary";

  if (slot) {
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
        <s-button
          slot={slot}
          variant={variant === "secondary" ? "secondary" : "primary"}
          disabled={disabled || undefined}
          {...({
            onClick: () => {
              const form = document.getElementById(formId) as HTMLFormElement | null;
              form?.requestSubmit();
            },
          } as Record<string, unknown>)}
        >
          {children}
        </s-button>
      </>
    );
  }

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
        className={className}
      >
        {children}
      </button>
    </>
  );
}
