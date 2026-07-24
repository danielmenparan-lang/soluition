import type { ReactNode } from "react";
import type { useShopifyFetcher } from "../hooks/useShopifyFetcher";

type ShopifyFetcher = ReturnType<typeof useShopifyFetcher>;

type SubmitButtonProps = {
  fetcher: ShopifyFetcher;
  children: ReactNode;
  slot?: string;
  intent?: string;
  fields?: Record<string, string>;
};

export function SubmitButton({
  fetcher,
  children,
  slot,
  intent,
  fields,
}: SubmitButtonProps) {
  const { Form, actionUrl, state } = fetcher;

  return (
    <Form method="post" action={actionUrl} slot={slot}>
      {intent ? <input type="hidden" name="intent" value={intent} /> : null}
      {fields
        ? Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))
        : null}
      <s-button type="submit" disabled={state !== "idle"}>
        {children}
      </s-button>
    </Form>
  );
}
