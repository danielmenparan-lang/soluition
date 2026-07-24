import type {
  ActionFunctionArgs,
  HeadersFunction,
  LinksFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { AppLink } from "../components/AppLink";
import { BrandHeader } from "../components/ui/BrandHeader";
import { SupportFooter } from "../components/ui/SupportFooter";
import { getSupportEmail } from "../config/support.server";
import appStyles from "../styles/app.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: appStyles },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    supportEmail: getSupportEmail(),
  };
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
  const { apiKey, supportEmail } = useLoaderData<typeof loader>();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <NavMenu>
        <AppLink to="/app" rel="home">
          התחלה
        </AppLink>
        <AppLink to="/app/recommendations">מה כדאי לעשות</AppLink>
        <AppLink to="/app/analytics">מה קורה בחנות</AppLink>
        <AppLink to="/app/chat">צ&apos;אט</AppLink>
        <AppLink to="/app/segments">קבוצות לקוחות</AppLink>
        <AppLink to="/app/reports">סיכום שבועי</AppLink>
      </NavMenu>
      <div className="ms-app-shell">
        <BrandHeader />
        <div className="ms-app-content ms-app-container">
          <Outlet context={{ supportEmail }} />
        </div>
        <SupportFooter email={supportEmail} />
      </div>
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
