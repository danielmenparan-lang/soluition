import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";
import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const errors = loginErrorMessage(await login(request));
  return { errors, apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const errors = loginErrorMessage(await login(request));
  return { errors };
};

export default function Auth() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [shop, setShop] = useState("");
  const { errors, apiKey } = actionData || loaderData;

  return (
    <AppProvider embedded={false} apiKey={apiKey}>
      <div style={{ maxWidth: "400px", margin: "80px auto", padding: "24px" }}>
        <h1>Marketing Solution</h1>
        <Form method="post">
          <label style={{ display: "block", marginBottom: "8px" }}>
            Shop domain
            <input
              type="text"
              name="shop"
              value={shop}
              onChange={(e) => setShop(e.currentTarget.value)}
              autoComplete="on"
              placeholder="my-shop.myshopify.com"
              style={{
                display: "block",
                width: "100%",
                padding: "8px",
                marginTop: "4px",
                border: errors.shop ? "1px solid red" : "1px solid #ccc",
              }}
            />
          </label>
          {errors.shop && (
            <p style={{ color: "red", fontSize: "14px" }}>{errors.shop}</p>
          )}
          <button type="submit" style={{ marginTop: "12px", padding: "8px 16px" }}>
            Log in
          </button>
        </Form>
      </div>
    </AppProvider>
  );
}
