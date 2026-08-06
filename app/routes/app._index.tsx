import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
  ShouldRevalidateFunctionArgs,
} from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { useShopifyFetcher } from "../hooks/useShopifyFetcher";
import { useFetcherToast } from "../hooks/useFetcherToast";
import { SubmitButton } from "../components/SubmitButton";
import { AppLink } from "../components/AppLink";
import { EmptyState } from "../components/ui/EmptyState";
import { SetupBanner } from "../components/ui/SetupBanner";
import { HomeMetricsStrip } from "../components/ui/HomeMetricsStrip";
import { TrendChart } from "../components/ui/TrendChart";
import { PriorityActionCard } from "../components/ui/PriorityActionCard";
import { ProUpgradeCard } from "../components/ui/ProUpgradeCard";
import { AdReadinessCompact } from "../components/ui/AdReadinessCompact";
import { POSITIONING } from "../config/positioning";
import { getOrCreateShop } from "../services/shop.server";
import { getStoreHealthSummary } from "../services/analytics.server";
import {
  generateRecommendations,
  getRecommendations,
} from "../services/ai.server";
import { getRevenueTimeline, getVisitorTimeline } from "../services/revenue-timeline.server";
import { updateRecommendationStatus, sortByPriority } from "../services/recommendations.server";
import {
  ensureInitialShopifySync,
  syncShopifyData,
} from "../services/shopify-sync.server";
import { getStoreDiagnostic } from "../services/store-diagnostic.server";
import {
  assertCanScan,
  getUsage,
  recordScan,
  usageSummary,
  UsageLimitError,
} from "../services/usage.server";
import { buildThemeEmbedActivateUrl } from "../config/theme-embed";

function storefrontUrl(shopDomain: string): string {
  return `https://${shopDomain}`;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

  await ensureInitialShopifySync(admin, shop.id);

  const [health, recommendations, revenueTimeline, visitorTimeline, usage] =
    await Promise.all([
      getStoreHealthSummary(shop.id).catch(() => null),
      getRecommendations(shop.id).catch(() => []),
      getRevenueTimeline(shop.id, 30).catch(() => []),
      getVisitorTimeline(shop.id, 30).catch(() => []),
      getUsage(shop.id),
    ]);

  const metrics = health?.metrics ?? null;
  const intelligence = health?.intelligence ?? null;
  const totalVisitors = metrics?.totalVisitors ?? 0;
  const hasShopifyData = Boolean(intelligence?.hasShopifyOrders);
  const themeEmbedUrl = buildThemeEmbedActivateUrl(
    session.shop,
    process.env.SHOPIFY_API_KEY ?? "00eb38f774ffba914d98a6800f4c5df5",
  );

  const usageInfo = usageSummary(usage);
  const topAction = sortByPriority(recommendations)[0] ?? null;
  const storeDiagnostic = await getStoreDiagnostic(shop.id, session.shop, 30).catch(
    () => null,
  );

  return {
    metrics,
    intelligence,
    totalVisitors,
    hasShopifyData,
    topAction,
    recommendationCount: recommendations.length,
    storeDiagnostic,
    revenueTimeline,
    visitorTimeline,
    plan: usage.plan,
    usage: usageInfo,
    themeEmbedUrl,
    storefrontUrl: storefrontUrl(session.shop),
    showTrackingBanner: totalVisitors === 0,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "sync_shopify") {
      const usage = await getUsage(shop.id);
      if (usage.plan !== "pro" && usage.plan !== "starter") {
        return {
          success: false,
          message: "Order sync on Starter or Pro — upgrade on Billing.",
        };
      }
      await assertCanScan(shop.id);
      const result = await syncShopifyData(admin, shop.id);
      await recordScan(shop.id);
      if (!result.ok) {
        return { success: false, message: result.error ?? "Sync failed." };
      }
      return {
        success: true,
        message: `Synced ${result.ordersSynced} orders and ${result.productsSynced} products.`,
      };
    }

    if (intent === "generate_recommendations") {
      await assertCanScan(shop.id);
      await generateRecommendations(shop.id);
      await recordScan(shop.id);
      return { success: true, message: "Your action is ready below." };
    }

    if (intent === "complete_recommendation") {
      const id = formData.get("recommendationId");
      if (typeof id === "string" && id) {
        await updateRecommendationStatus(shop.id, id, "completed");
        return { success: true, message: "Marked as done." };
      }
    }
  } catch (error) {
    if (error instanceof UsageLimitError) {
      return { success: false, message: error.message };
    }
    const message = error instanceof Error ? error.message : "Action failed";
    return { success: false, message };
  }

  return { success: false, message: "Unknown action" };
};

export default function Overview() {
  const {
    metrics,
    intelligence,
    totalVisitors,
    hasShopifyData,
    topAction,
    recommendationCount,
    storeDiagnostic,
    revenueTimeline,
    visitorTimeline,
    plan,
    themeEmbedUrl,
    storefrontUrl,
    showTrackingBanner,
  } = useLoaderData<typeof loader>();

  const fetcher = useShopifyFetcher<typeof action>();
  const isBusy = fetcher.state !== "idle";
  useFetcherToast(fetcher);

  const chartPoints = hasShopifyData
    ? revenueTimeline.map((p) => ({ date: p.date, value: p.revenue }))
    : visitorTimeline.map((p) => ({ date: p.date, value: p.visitors }));

  const healthScore = intelligence?.storeHealthScore ?? 0;

  return (
    <s-page heading="Home">
      <SubmitButton
        fetcher={fetcher}
        slot="primary-action"
        intent="generate_recommendations"
      >
        {isBusy ? "Scanning…" : "Scan for actions"}
      </SubmitButton>

      {(plan === "pro" || plan === "starter") ? (
        <SubmitButton fetcher={fetcher} slot="secondary-actions" intent="sync_shopify">
          {isBusy ? "Syncing…" : "Sync orders"}
        </SubmitButton>
      ) : null}

      <s-section>
        <div className="ms-home-stack">
          <SetupBanner
            show={showTrackingBanner}
            themeEmbedUrl={themeEmbedUrl}
            storefrontUrl={storefrontUrl}
          />

          {topAction ? (
            <section aria-labelledby="today-heading">
              <h2 id="today-heading" className="ms-home-section-title">
                {POSITIONING.actionsTitle}
              </h2>
              <PriorityActionCard
                rec={topAction}
                fetcher={fetcher}
                rank={1}
                spotlight
                compact
              />
              {recommendationCount > 1 ? (
                <AppLink to="/app/recommendations" className="ms-text-link ms-home-more">
                  {recommendationCount - 1} more →
                </AppLink>
              ) : null}
            </section>
          ) : (
            <EmptyState
              icon="box"
              title="Ready when you are"
              description="We sync your Shopify catalog and orders automatically. Tap Scan for your first marketing action."
              action={
                <SubmitButton fetcher={fetcher} intent="generate_recommendations">
                  {isBusy ? "Scanning…" : "Scan for actions"}
                </SubmitButton>
              }
            />
          )}

          {intelligence ? (
            <HomeMetricsStrip
              intelligence={intelligence}
              visitorCount={totalVisitors}
              sessionConversion={metrics?.conversionRate ?? null}
              healthScore={healthScore}
            />
          ) : null}

          {storeDiagnostic?.hasEnoughData ? (
            <AdReadinessCompact diagnostic={storeDiagnostic} />
          ) : null}

          <details className="ms-home-details">
            <summary>Last 30 days</summary>
            <TrendChart
              title={hasShopifyData ? "Revenue" : "Visitors"}
              subtitle="Daily"
              points={chartPoints}
              currency={hasShopifyData ? intelligence?.primaryCurrency : undefined}
              valueLabel="Total"
              emptyMessage="Data appears after orders or store visits."
              accent="#0d9488"
            />
          </details>

          {plan !== "pro" ? <ProUpgradeCard plan={plan} /> : null}
        </div>
      </s-section>
    </s-page>
  );
}

export function shouldRevalidate({
  formAction,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  if (formAction) return true;
  return defaultShouldRevalidate;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
