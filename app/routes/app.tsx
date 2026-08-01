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
import { authenticate, PRO_PLAN, STARTER_PLAN, UNLIMITED_PLAN } from "../shopify.server";
import { AppLink } from "../components/AppLink";
import { BrandHeader } from "../components/ui/BrandHeader";
import { SupportFooter } from "../components/ui/SupportFooter";
import { getSupportEmail } from "../config/support.server";
import { getOrCreateShop } from "../services/shop.server";
import { maybeSyncShopifyData } from "../services/shopify-sync.server";
import {
  getUsage,
  planFromSubscriptionName,
  syncPlanFromBilling,
  usageSummary,
} from "../services/usage.server";
import appStyles from "../styles/app.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: appStyles },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, billing, admin } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

  const usage = await getUsage(shop.id);
  if (usage.plan === "pro") {
    void maybeSyncShopifyData(admin, shop.id);
  }

  const check = await billing.check({
    plans: [PRO_PLAN, STARTER_PLAN, UNLIMITED_PLAN],
    isTest: process.env.NODE_ENV !== "production",
  });

  if (check.hasActivePayment && check.appSubscriptions.length > 0) {
    const plan = planFromSubscriptionName(check.appSubscriptions[0].name);
    await syncPlanFromBilling(shop.id, plan);
  } else {
    await syncPlanFromBilling(shop.id, "free");
  }

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    supportEmail: getSupportEmail(),
    usage: usageSummary(await getUsage(shop.id)),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return new Response(null, { status: 405 });
  }

  return {
    success: false,
    message: "Navigation error — refresh the page and try again",
  };
};

export default function App() {
  const { apiKey, supportEmail, usage } = useLoaderData<typeof loader>();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <NavMenu>
        <AppLink to="/app" rel="home">
          Home
        </AppLink>
        <AppLink to="/app/chat">Ask</AppLink>
        <AppLink to="/app/analytics">Analytics</AppLink>
        <AppLink to="/app/recommendations">Fixes</AppLink>
        <AppLink to="/app/segments">Segments</AppLink>
        <AppLink to="/app/reports">Reports</AppLink>
        <AppLink to="/app/billing">Billing</AppLink>
      </NavMenu>
      <div className="ms-app-shell">
        <BrandHeader usage={usage} />
        <div className="ms-app-content ms-app-container">
          <Outlet context={{ supportEmail, usage }} />
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
