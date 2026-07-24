import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate, STARTER_PLAN, UNLIMITED_PLAN } from "../shopify.server";
import { getOrCreateShop } from "../services/shop.server";
import { PLAN_LIMITS, formatOutputLimit, formatScanLimit } from "../config/plans";
import {
  getUsage,
  planFromSubscriptionName,
  syncPlanFromBilling,
  usageSummary,
} from "../services/usage.server";
import { SubmitButton } from "../components/SubmitButton";
import { useShopifyFetcher } from "../hooks/useShopifyFetcher";
import { SectionBlock } from "../components/ui/SectionBlock";

async function resolveActivePlan(
  shopId: string,
  billing: Awaited<ReturnType<typeof authenticate.admin>>["billing"],
) {
  const check = await billing.check({
    plans: [STARTER_PLAN, UNLIMITED_PLAN],
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

  if (plan === "unlimited") {
    return billing.request({
      plan: UNLIMITED_PLAN,
      isTest,
      returnUrl,
    });
  }

  return redirect("/app/billing");
};

export default function BillingPage() {
  const { usage } = useLoaderData<typeof loader>();
  const fetcher = useShopifyFetcher<typeof action>();

  const tiers = (["free", "starter", "unlimited"] as const).map((id) => {
    const plan = PLAN_LIMITS[id];
    return {
      id,
      name: plan.label,
      price: id === "free" ? "$0" : plan.price.replace("/mo", " / month"),
      scans: formatScanLimit(plan.scans),
      outputs: formatOutputLimit(plan.outputs),
      current: usage.plan === id,
    };
  });

  return (
    <s-page heading="Plans & usage">
      <s-section>
        <SectionBlock
          title="Your usage this month"
          subtitle={`Current plan: ${usage.planLabel} (${usage.planPrice})`}
        >
          <div className="ms-metric-grid">
            <div className="ms-card ms-card-soft">
              <s-text type="strong">Scans</s-text>
              <div className="ms-metric-value">
                {usage.scansUsed} / {usage.scanLimit}
              </div>
              <s-text color="subdued">Segment refresh & data recompute</s-text>
            </div>
            <div className="ms-card ms-card-soft">
              <s-text type="strong">AI outputs</s-text>
              <div className="ms-metric-value">
                {usage.outputsUsed} / {usage.outputLimit}
              </div>
              <s-text color="subdued">
                Recommendations, reports, and chat replies
              </s-text>
            </div>
          </div>
        </SectionBlock>
      </s-section>

      <s-section>
        <SectionBlock
          title="Choose a plan"
          subtitle={`Free includes ${PLAN_LIMITS.free.scans} scan and ${PLAN_LIMITS.free.outputs} AI outputs. Upgrade when you need more.`}
        >
          <div className="ms-plan-grid">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={`ms-card ms-plan-card ${tier.current ? "ms-plan-current" : ""}`}
              >
                <s-text type="strong">{tier.name}</s-text>
                <div className="ms-plan-price">{tier.price}</div>
                <ul className="ms-plan-list">
                  <li>{tier.scans}</li>
                  <li>{tier.outputs}</li>
                  <li>Visitor behavior tracking</li>
                  <li>Analytics dashboard</li>
                </ul>
                {tier.current ? (
                  <s-text color="subdued">Current plan</s-text>
                ) : tier.id === "free" ? (
                  <s-text color="subdued">Default for new installs</s-text>
                ) : (
                  <SubmitButton fetcher={fetcher} fields={{ plan: tier.id }}>
                    Upgrade to {tier.name}
                  </SubmitButton>
                )}
              </div>
            ))}
          </div>
        </SectionBlock>
      </s-section>

      <s-section>
        <SectionBlock title="What counts as usage?" subtitle="Simple and predictable">
          <div className="ms-stack">
            <p>
              <strong>Scan</strong> — refreshing customer groups / recomputing segments
              from your tracking data.
            </p>
            <p>
              <strong>AI output</strong> — generating recommendations, weekly reports,
              or each assistant chat reply powered by Claude.
            </p>
            <p>
              Viewing analytics and setup steps are always free on every plan (
              {PLAN_LIMITS.free.scans} scan + {PLAN_LIMITS.free.outputs} output on Free).
            </p>
          </div>
        </SectionBlock>
      </s-section>
    </s-page>
  );
}

export const headers = boundary.headers;
