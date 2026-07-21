import type { LoaderFunctionArgs } from "react-router";
import { redirect, Form, useLoaderData } from "react-router";
import { login } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }
  return { showForm: Boolean(login) };
};

export default function Index() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div style={{ fontFamily: "system-ui", maxWidth: "600px", margin: "80px auto", padding: "0 24px" }}>
      <h1>Marketing Solution</h1>
      <p>AI Marketing Intelligence Platform for Shopify</p>
      {showForm && (
        <Form method="post" action="/auth/login" style={{ marginTop: "32px" }}>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Shop domain
            <input
              type="text"
              name="shop"
              placeholder="my-shop.myshopify.com"
              style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
            />
          </label>
          <button type="submit" style={{ marginTop: "12px", padding: "8px 16px" }}>
            Log in
          </button>
        </Form>
      )}
    </div>
  );
}
