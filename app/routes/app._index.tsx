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

import { TrendChart } from "../components/ui/TrendChart";

import { RfmBarChart } from "../components/ui/RfmBarChart";

import { PriorityActionCard } from "../components/ui/PriorityActionCard";

import { AdvisorQuickAsk } from "../components/ui/AdvisorQuickAsk";

import { ProUpgradeCard } from "../components/ui/ProUpgradeCard";

import { getOrCreateShop } from "../services/shop.server";

import { getStoreHealthSummary } from "../services/analytics.server";

import {

  generateRecommendations,

  getRecommendations,

} from "../services/ai.server";

import { buildOnboardingProgress } from "../services/onboarding.server";

import { getRevenueTimeline, getVisitorTimeline } from "../services/revenue-timeline.server";

import { updateRecommendationStatus, sortByPriority } from "../services/recommendations.server";

import { syncShopifyData } from "../services/shopify-sync.server";

import { getSyncStatus } from "../services/sync-status.server";

import {

  assertCanOutput,

  assertCanScan,

  getUsage,

  recordOutput,

  recordScan,

  UsageLimitError,

} from "../services/usage.server";

import {

  buildThemeEmbedActivateUrl,

  buildThemesAdminUrl,

} from "../config/theme-embed";



export const loader = async ({ request }: LoaderFunctionArgs) => {

  const { session } = await authenticate.admin(request);

  const shop = await getOrCreateShop(session.shop);



  const [health, recommendations, revenueTimeline, visitorTimeline, syncStatus, usage] =

    await Promise.all([

      getStoreHealthSummary(shop.id).catch(() => null),

      getRecommendations(shop.id).catch(() => []),

      getRevenueTimeline(shop.id, 30).catch(() => []),

      getVisitorTimeline(shop.id, 30).catch(() => []),

      getSyncStatus(shop.id).catch(() => null),

      getUsage(shop.id),

    ]);



  const metrics = health?.metrics ?? null;

  const intelligence = health?.intelligence ?? null;

  const hasVisitorData = Boolean(metrics && metrics.totalVisitors > 0);

  const hasShopifyData = Boolean(intelligence?.hasShopifyOrders);

  const hasData = hasVisitorData || hasShopifyData;



  const onboarding = buildOnboardingProgress({

    hasVisitorData,

    hasShopifyData,

    hasRecommendations: recommendations.length > 0,

    themeEmbedUrl: buildThemeEmbedActivateUrl(

      session.shop,

      process.env.SHOPIFY_API_KEY ?? "00eb38f774ffba914d98a6800f4c5df5",

    ),

  });



  const priorityActions = sortByPriority(recommendations).slice(0, 3);



  return {

    shop,

    metrics,

    intelligence,

    hasData,

    hasVisitorData,

    hasShopifyData,

    onboarding,

    priorityActions,

    recommendationCount: recommendations.length,

    revenueTimeline,

    visitorTimeline,

    syncStatus,

    plan: usage.plan,

    themeEmbedUrl: buildThemeEmbedActivateUrl(

      session.shop,

      process.env.SHOPIFY_API_KEY ?? "00eb38f774ffba914d98a6800f4c5df5",

    ),

    themesAdminUrl: buildThemesAdminUrl(session.shop),

    trackingScriptUrl: process.env.SHOPIFY_APP_URL

      ? `${process.env.SHOPIFY_APP_URL}/tracker.js`

      : "/tracker.js",

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

      if (usage.plan !== "pro") {

        return {

          success: false,

          message: "Shopify sync is included with Pro — upgrade on Billing.",

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

      await assertCanOutput(shop.id);

      await generateRecommendations(shop.id);

      await recordOutput(shop.id);

      return {

        success: true,

        message: "Your priority actions are ready below.",

      };

    }



    if (intent === "dismiss_recommendation") {

      const id = formData.get("recommendationId");

      if (typeof id === "string" && id) {

        await updateRecommendationStatus(shop.id, id, "dismissed");

        return { success: true, message: "Dismissed — we'll suggest something else next time." };

      }

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

    shop,

    metrics,

    intelligence,

    hasData,

    hasVisitorData,

    hasShopifyData,

    onboarding,

    priorityActions,

    recommendationCount,

    revenueTimeline,

    visitorTimeline,

    plan,

    themeEmbedUrl,

    themesAdminUrl,

    trackingScriptUrl,

  } = useLoaderData<typeof loader>();



  const fetcher = useShopifyFetcher<typeof action>();

  const isBusy = fetcher.state !== "idle";

  useFetcherToast(fetcher);



  if (!hasData) {

    return (

      <s-page heading="Home">

        <s-section>

          <WelcomeScreen
            themeEmbedUrl={themeEmbedUrl}
            progress={onboarding}
          />

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

        {isBusy ? "Analyzing…" : "Refresh priorities"}

      </SubmitButton>



      {plan === "pro" ? (

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



      <s-section>

        <div className="ms-home-charts">

          <TrendChart

            title={hasShopifyData ? "Revenue trend" : "Visitor trend"}

            subtitle="Last 30 days"

            points={chartPoints}

            currency={hasShopifyData ? intelligence?.primaryCurrency : undefined}

            valueLabel={hasShopifyData ? "30-day total" : "30-day visitors"}

            emptyMessage={

              hasShopifyData

                ? "Sync Shopify orders to see revenue over time."

                : "Enable tracking and browse your storefront."

            }

            accent={hasShopifyData ? "#0a9b7a" : "#6d5ef7"}

          />

          {intelligence?.hasShopifyOrders ? (

            <RfmBarChart segments={intelligence.rfm} />

          ) : null}

        </div>

      </s-section>



      <s-section heading="This week's priorities">

        {priorityActions.length > 0 ? (

          <div className="ms-action-list">

            {priorityActions.map((rec, i) => (

              <PriorityActionCard key={rec.id} rec={rec} fetcher={fetcher} rank={i + 1} />

            ))}

            {recommendationCount > 3 ? (

              <AppLink to="/app/recommendations" className="ms-text-link">

                View all {recommendationCount} recommendations →

              </AppLink>

            ) : null}

          </div>

        ) : (

          <EmptyState

            icon="spark"

            title="No priorities yet"

            description="Solution will analyze your store and surface the highest-impact actions here."

            action={

              <SubmitButton fetcher={fetcher} intent="generate_recommendations">

                {isBusy ? "Analyzing…" : "Generate priorities"}

              </SubmitButton>

            }

          />

        )}

      </s-section>



      <s-section>

        <AdvisorQuickAsk />

      </s-section>



      {plan === "free" ? (

        <s-section>

          <ProUpgradeCard intelligence={intelligence} />

        </s-section>

      ) : null}



      <s-section>

        <div className="ms-home-footer-links">

          <AppLink to="/app/analytics" className="ms-home-link-card">

            <strong>Full analytics</strong>

            <span>Traffic, products, Shopify intelligence</span>

          </AppLink>

          <AppLink to="/app/segments" className="ms-home-link-card">

            <strong>Segments</strong>

            <span>Visitor groups by source & device</span>

          </AppLink>

          <AppLink to="/app/reports" className="ms-home-link-card">

            <strong>Reports</strong>

            <span>Weekly AI summaries</span>

          </AppLink>

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


