import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { AppLink } from "../components/AppLink";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

/** Safety net: POST to /app without ?index hits the layout and would 405 otherwise. */
export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return new Response(null, { status: 405 });
  }

  return {
    success: false,
    message: "שגיאת ניווט — רענן את הדף ונסה שוב",
  };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <NavMenu>
        <AppLink to="/app" rel="home">
          סקירה
        </AppLink>
        <AppLink to="/app/analytics">אנליטיקה</AppLink>
        <AppLink to="/app/segments">קהלים</AppLink>
        <AppLink to="/app/recommendations">המלצות AI</AppLink>
        <AppLink to="/app/reports">דוחות</AppLink>
        <AppLink to="/app/chat">צ'אט AI</AppLink>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
