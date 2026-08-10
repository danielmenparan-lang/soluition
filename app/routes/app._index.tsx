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
import { WelcomeScreen } from "../components/ui/WelcomeScreen";
import { OnboardingChecklist } from "../components/ui/OnboardingChecklist";
import { HomeHero } from "../components/ui/HomeHero";
import { StoreDiagnosticPanel } from "../components/ui/StoreDiagnosticPanel";
import { TrendChart } from "../components/ui/TrendChart";
import { PriorityActionCard } from "../components/ui/PriorityActionCard";
import { AdvisorQuickAsk } from "../components/ui/AdvisorQuickAsk";
import { ProUpgradeCard } from "../components/ui/ProUpgradeCard";
import { MarketingResponsibilityNotice } from "../components/ui/MarketingResponsibilityNotice";
import { POSITIONING } from "../config/positioning";
import { getOrCreateShop } from "../services/shop.server";
import { getStoreHealthSummary } from "../services/analytics.server";
import {
  generateRecommendations,
  getRecommendations,
} from "../services/ai.server";
import { buildOnboardingProgress } from "../services/onboarding.server";
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
  const hasVisitorData = Boolean(metrics && metrics.totalVisitors > 0);
  const hasShopifyData = Boolean(intelligence?.hasShopifyOrders);
  const hasData = hasVisitorData || hasShopifyData;

  const themeEmbedUrl = buildThemeEmbedActivateUrl(
    session.shop,
    process.env.SHOPIFY_API_KEY ?? "00eb38f774ffba914d98a6800f4c5df5",
  );

  const onboarding = buildOnboardingProgress({
    hasVisitorData,
    hasShopifyData,
    hasRecommendations: recommendations.length > 0,
    themeEmbedUrl,
  });

  const usageInfo = usageSummary(usage);
  const homeActionLimit =
    usageInfo.visibleRecommendations === Number.POSITIVE_INFINITY
      ? 3
      : Math.min(usageInfo.visibleRecommendations, 3);
  const priorityActions = sortByPriority(recommendations).slice(0, homeActionLimit);
  const storeDiagnostic = hasData
    ? await getStoreDiagnostic(shop.id, session.shop, 30).catch(() => null)
    : null;

  return {
    metrics,
    intelligence,
    hasData,
    hasVisitorData,
    hasShopifyData,
    onboarding,
    priorityActions,
    recommendationCount: recommendations.length,
    storeDiagnostic,
    revenueTimeline,
    visitorTimeline,
    plan: usage.plan,
    usage: usageInfo,
    homeActionLimit,
    themeEmbedUrl,
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
          message: "Shopify sync is included with Starter or Pro — upgrade on Billing.",
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
      return {
        success: true,
        message: "Your marketing actions are ready below.",
      };
    }

    if (intent === "complete_recommendation") {
      const id = formData.get("recommendationId");
      if (typeof id === "string" && id) {
        await updateRecommendationStatus(shop.id, id, "completed");
        return { success: true, message: "Nice — marked as done." };
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
    hasData,
    hasVisitorData,
    hasShopifyData,
    onboarding,
    priorityActions,
    recommendationCount,
    storeDiagnostic,
    revenueTimeline,
    visitorTimeline,
    plan,
    homeActionLimit,
    themeEmbedUrl,
  } = useLoaderData<typeof loader>();

  const fetcher = useShopifyFetcher<typeof action>();
  const isBusy = fetcher.state !== "idle";
  useFetcherToast(fetcher);

  if (!hasData) {
    return (
      <s-page heading="Home">
        <s-section>
          <WelcomeScreen themeEmbedUrl={themeEmbedUrl} progress={onboarding} />
        </s-section>
        <s-section>
          <OnboardingChecklist progress={onboarding} />
        </s-section>
      </s-page>
    );
  }

  const chartPoints = hasShopifyData
    ? revenueTimeline.map((p) => ({ date: p.date, value: p.revenue }))
    : visitorTimeline.map((p) => ({ date: p.date, value: p.visitors }));

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
          {isBusy ? "Syncing…" : "Sync Shopify"}
        </SubmitButton>
      ) : null}

      {isBusy ? (
        <s-section>
          <div className="ms-status-banner ms-status-banner-animate">
            <span className="ms-loading">Working on your store data…</span>
          </div>
        </s-section>
      ) : null}

      {!onboarding.isComplete ? (
        <s-section>
          <OnboardingChecklist progress={onboarding} />
        </s-section>
      ) : null}

      {intelligence ? (
        <s-section>
          <HomeHero
            intelligence={intelligence}
            visitorCount={hasVisitorData ? metrics!.totalVisitors : null}
            sessionConversion={hasVisitorData ? metrics!.conversionRate : null}
          />
        </s-section>
      ) : null}

      <s-section heading={POSITIONING.actionsTitle}>
        <MarketingResponsibilityNotice compact />
        <p className="ms-section-lead">{POSITIONING.actionsLead}</p>
        {priorityActions.length > 0 ? (
          <div className="ms-action-list">
            {priorityActions.map((rec, i) => (
              <PriorityActionCard key={rec.id} rec={rec} fetcher={fetcher} rank={i + 1} />
            ))}
            {recommendationCount > homeActionLimit ? (
              <AppLink to="/app/recommendations" className="ms-text-link">
                View all {recommendationCount} actions →
              </AppLink>
            ) : null}
          </div>
        ) : (
          <EmptyState
            icon="box"
            title="No marketing actions yet"
            description="Scan your store data — we'll suggest what to market and fix first."
            action={
              <SubmitButton fetcher={fetcher} intent="generate_recommendations">
                {isBusy ? "Scanning…" : "Scan for actions"}
              </SubmitButton>
            }
          />
        )}
      </s-section>

      {storeDiagnostic ? (
        <s-section heading={POSITIONING.diagnosticTitle}>
          <StoreDiagnosticPanel diagnostic={storeDiagnostic} />
        </s-section>
      ) : null}

      <s-section>
        <AdvisorQuickAsk />
      </s-section>

      <s-section heading="Last 30 days">
        <div className="ms-home-charts ms-home-charts-compact">
          <TrendChart
            title={hasShopifyData ? "Revenue" : "Visitors"}
            subtitle="Daily trend"
            points={chartPoints}
            currency={hasShopifyData ? intelligence?.primaryCurrency : undefined}
            valueLabel="Total"
            emptyMessage={
              hasShopifyData
                ? "Sync orders to see revenue."
                : "Turn on tracking and browse your store."
            }
            accent="#0d9488"
          />
        </div>
      </s-section>

      {plan !== "pro" ? (
        <s-section>
          <ProUpgradeCard plan={plan} />
        </s-section>
      ) : null}
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
