import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  authenticate,
  PRO_PLAN,
  STARTER_PLAN,
  UNLIMITED_PLAN,
} from "../shopify.server";
import { getOrCreateShop } from "../services/shop.server";
import { PLAN_LIMITS } from "../config/plans";
import {
  getUsage,
  planFromSubscriptionName,
  syncPlanFromBilling,
  usageSummary,
} from "../services/usage.server";
import { SubmitButton } from "../components/SubmitButton";
import { useShopifyFetcher } from "../hooks/useShopifyFetcher";
import { SectionBlock } from "../components/ui/SectionBlock";
import { PageHero } from "../components/ui/PageHero";
import { MarketingResponsibilityNotice } from "../components/ui/MarketingResponsibilityNotice";

const BILLABLE_PLANS: ("Pro" | "Starter" | "Unlimited")[] = [
  PRO_PLAN,
  STARTER_PLAN,
  UNLIMITED_PLAN,
];

const COMPARE_ROWS: Array<{
  feature: string;
  free: string | boolean;
  starter: string | boolean;
  pro: string | boolean;
}> = [
  { feature: "Marketing scans", free: "3 (once ever)", starter: "10 / week", pro: "Unlimited" },
  { feature: "Chat messages", free: "2 (once ever)", starter: "10 / week", pro: "Unlimited" },
  { feature: "Action cards per scan", free: "3", starter: "10", pro: "Unlimited" },
  { feature: "Ad readiness score", free: true, starter: true, pro: true },
  { feature: "Resets", free: "Never", starter: "Every Monday", pro: "—" },
  { feature: "Shopify order sync", free: false, starter: true, pro: true },
  { feature: "LTV & repeat buyers", free: false, starter: false, pro: true },
];

async function resolveActivePlan(
  shopId: string,
  billing: Awaited<ReturnType<typeof authenticate.admin>>["billing"],
) {
  const check = await billing.check({
    plans: BILLABLE_PLANS,
    isTest: process.env.NODE_ENV !== "production",
  });

  if (!check.hasActivePayment || check.appSubscriptions.length === 0) {
    return syncPlanFromBilling(shopId, "free");
  }

  const subscription = check.appSubscriptions[0];
  const plan = planFromSubscriptionName(subscription.name);
  return syncPlanFromBilling(shopId, plan);
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  await resolveActivePlan(shop.id, billing);
  const usage = usageSummary(await getUsage(shop.id));

  return { usage };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { billing } = await authenticate.admin(request);
  const formData = await request.formData();
  const plan = formData.get("plan");

  const appUrl = process.env.SHOPIFY_APP_URL || "";
  const returnUrl = `${appUrl}/app/billing`;
  const isTest = process.env.NODE_ENV !== "production";

  if (plan === "starter") {
    return billing.request({
      plan: STARTER_PLAN,
      isTest,
      returnUrl,
    });
  }

  if (plan === "pro") {
    return billing.request({
      plan: PRO_PLAN,
      isTest,
      returnUrl,
    });
  }

  return redirect("/app/billing");
};

function cellValue(value: string | boolean): string {
  if (typeof value === "boolean") return value ? "✓" : "—";
  return value;
}

export default function BillingPage() {
  const { usage } = useLoaderData<typeof loader>();
  const fetcher = useShopifyFetcher<typeof action>();

  const tiers = (["free", "starter", "pro"] as const).map((id) => {
    const plan = PLAN_LIMITS[id];
    return {
      id,
      name: plan.label,
      price: plan.price,
      priceDetail: plan.priceDetail,
      description: plan.description,
      highlights: plan.highlights,
      current: usage.plan === id,
    };
  });

  return (
    <s-page heading="Billing">
      <PageHero
        title="Marketing plans"
        subtitle="Store data → marketing actions. You approve every step."
        variant="default"
        compact
      />

      <s-section>
        <MarketingResponsibilityNotice />
      </s-section>

      <s-section>
        <SectionBlock
          title={`Usage ${usage.periodLabel}`}
          subtitle={`${usage.planLabel} · ${usage.planPrice}`}
        >
          <div className="ms-metric-grid">
            <div className="ms-card ms-card-soft">
              <s-text type="strong">Marketing scans</s-text>
              <div className="ms-metric-value">
                {usage.scansUsed} / {usage.scanLimit}
              </div>
              <s-text color="subdued">Generate action cards from your data</s-text>
            </div>
            <div className="ms-card ms-card-soft">
              <s-text type="strong">Chat messages</s-text>
              <div className="ms-metric-value">
                {usage.outputsUsed} / {usage.outputLimit}
              </div>
              <s-text color="subdued">Ask → marketing suggestions</s-text>
            </div>
          </div>
        </SectionBlock>
      </s-section>

      <s-section>
        <div className="ms-plan-grid ms-plan-grid-3">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`ms-card ms-plan-card ${tier.current ? "ms-plan-current" : ""} ${tier.id === "pro" ? "ms-plan-featured" : ""}`}
            >
              {tier.id === "pro" ? (
                <span className="ms-plan-badge">Best value</span>
              ) : null}
              <s-text type="strong">{tier.name}</s-text>
              <div className="ms-plan-price">{tier.price}</div>
              <s-text color="subdued">{tier.priceDetail}</s-text>
              <p className="ms-plan-description">{tier.description}</p>
              <ul className="ms-plan-list">
                {tier.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {tier.current ? (
                <s-text color="subdued">Current plan</s-text>
              ) : tier.id === "free" ? (
                <s-text color="subdued">Included for all stores</s-text>
              ) : (
                <SubmitButton fetcher={fetcher} fields={{ plan: tier.id }}>
                  Upgrade to {tier.name}
                </SubmitButton>
              )}
            </div>
          ))}
        </div>
      </s-section>

      <s-section heading="Compare plans">
        <div className="ms-compare-table-wrap">
          <table className="ms-compare-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Free</th>
                <th>Starter</th>
                <th>Pro</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.feature}>
                  <td>{row.feature}</td>
                  <td>{cellValue(row.free)}</td>
                  <td>{cellValue(row.starter)}</td>
                  <td>{cellValue(row.pro)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </s-section>
    </s-page>
  );
}

export const headers = boundary.headers;
