import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const embedded = url.searchParams.get("embedded");
  const host = url.searchParams.get("host");

  // Shopify Admin / install — go straight to the embedded app (normal flow).
  if (shop || embedded || host) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return null;
};

export default function Index() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: "520px",
        margin: "80px auto",
        padding: "0 24px",
        textAlign: "center",
        lineHeight: 1.6,
      }}
    >
      <h1 style={{ fontSize: "1.5rem" }}>Marketing Solution</h1>
      <p>AI Marketing Intelligence for Shopify</p>
      <p style={{ color: "#555", marginTop: "24px" }}>
        פתח את האפליקציה מ-<strong>Shopify Admin → Apps → solution</strong>.
        <br />
        אין צורך להזין כתובת חנות כאן.
      </p>
    </div>
  );
}
