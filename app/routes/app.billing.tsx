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

const BILLABLE_PLANS: ("Pro" | "Starter" | "Unlimited")[] = [
  PRO_PLAN,
  STARTER_PLAN,
  UNLIMITED_PLAN,
];

const COMPARE_ROWS = [
  { feature: "Storefront visitor tracking", free: true, pro: true },
  { feature: "Store Health Score", free: true, pro: true },
  { feature: "Analytics & funnel charts", free: true, pro: true },
  { feature: "Shopify order sync", free: false, pro: true },
  { feature: "LTV, RFM & cohorts", free: false, pro: true },
  { feature: "AI outputs / month", free: "3", pro: "Unlimited" },
  { feature: "Scans / month", free: "2", pro: "Unlimited" },
  { feature: "Weekly AI reports", free: "Limited", pro: "Unlimited" },
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

  if (plan === "pro") {
    return billing.request({
      plan: PRO_PLAN,
      isTest,
      returnUrl,
    });
  }

  return redirect("/app/billing");
};

export default function BillingPage() {
  const { usage } = useLoaderData<typeof loader>();
  const fetcher = useShopifyFetcher<typeof action>();

  const tiers = (["free", "pro"] as const).map((id) => {
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
        title="Plans"
        subtitle="Free to start. Pro adds order sync and unlimited chat + fixes."
        variant="default"
        compact
      />

      <s-section>
        <SectionBlock
          title="Your usage this month"
          subtitle={`${usage.planLabel} · ${usage.planPrice}`}
        >
          <div className="ms-metric-grid">
            <div className="ms-card ms-card-soft">
              <s-text type="strong">Scans</s-text>
              <div className="ms-metric-value">
                {usage.scansUsed} / {usage.scanLimit}
              </div>
              <s-text color="subdued">Segments & Shopify sync</s-text>
            </div>
            <div className="ms-card ms-card-soft">
              <s-text type="strong">AI outputs</s-text>
              <div className="ms-metric-value">
                {usage.outputsUsed} / {usage.outputLimit}
              </div>
              <s-text color="subdued">Chat, fixes, reports</s-text>
            </div>
          </div>
        </SectionBlock>
      </s-section>

      <s-section>
        <div className="ms-plan-grid">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`ms-card ms-plan-card ${tier.current ? "ms-plan-current" : ""} ${tier.id === "pro" ? "ms-plan-featured" : ""}`}
            >
              {tier.id === "pro" ? (
                <span className="ms-plan-badge">Most popular</span>
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
                  Upgrade to Pro
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
                <th>Pro</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.feature}>
                  <td>{row.feature}</td>
                  <td>
                    {typeof row.free === "boolean"
                      ? row.free
                        ? "✓"
                        : "—"
                      : row.free}
                  </td>
                  <td>
                    {typeof row.pro === "boolean"
                      ? row.pro
                        ? "✓"
                        : "—"
                      : row.pro}
                  </td>
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
