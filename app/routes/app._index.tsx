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
import { MetricCard } from "../components/ui/MetricCard";
import { RecommendationCard } from "../components/ui/RecommendationCard";
import { EmptyState } from "../components/ui/EmptyState";
import { WelcomeScreen } from "../components/ui/WelcomeScreen";
import { ChatPromo } from "../components/ui/ChatPromo";
import { ProductJourney, QuickNav } from "../components/ui/ProductJourney";
import { SectionBlock } from "../components/ui/SectionBlock";
import { getOrCreateShop } from "../services/shop.server";
import { getDashboardMetrics } from "../services/analytics.server";
import { getRecommendations } from "../services/ai.server";
import { getSegments } from "../services/segmentation.server";
import {
  generateRecommendations,
  generateWeeklyReport,
} from "../services/ai.server";
import { refreshSegments } from "../services/segmentation.server";
import {
  assertCanOutput,
  assertCanScan,
  recordOutput,
  recordScan,
  UsageLimitError,
} from "../services/usage.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

  const [metrics, recommendations, segments] = await Promise.all([
    getDashboardMetrics(shop.id).catch(() => null),
    getRecommendations(shop.id).catch(() => []),
    getSegments(shop.id).catch(() => []),
  ]);

  return {
    shop,
    metrics,
    recommendations: recommendations.slice(0, 3),
    recommendationCount: recommendations.length,
    segments: segments.slice(0, 3),
    trackingScriptUrl: process.env.SHOPIFY_APP_URL
      ? `${process.env.SHOPIFY_APP_URL}/tracker.js`
      : "/tracker.js",
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "generate_recommendations") {
      await assertCanOutput(shop.id);
      await generateRecommendations(shop.id);
      await recordOutput(shop.id);
      return {
        success: true,
        message: "Recommendations are ready — scroll down or open Recommendations",
      };
    }
    if (intent === "refresh_segments") {
      await assertCanScan(shop.id);
      await refreshSegments(shop.id);
      await recordScan(shop.id);
      return { success: true, message: "Customer segments updated" };
    }
    if (intent === "generate_report") {
      await assertCanOutput(shop.id);
      await generateWeeklyReport(shop.id);
      await recordOutput(shop.id);
      return { success: true, message: "Weekly report is ready" };
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
    recommendations,
    recommendationCount,
    segments,
    trackingScriptUrl,
  } = useLoaderData<typeof loader>();
  const fetcher = useShopifyFetcher<typeof action>();
  const isGenerating = fetcher.state !== "idle";

  useFetcherToast(fetcher);

  const hasData = Boolean(metrics && metrics.totalVisitors > 0);
  const isNewUser = !hasData || recommendationCount === 0;

  if (!hasData) {
    return (
      <s-page heading="Home">
        <s-section>
          <WelcomeScreen
            shopDomain={shop.shop_domain}
            trackingId={shop.tracking_id}
            trackingScriptUrl={trackingScriptUrl}
            hasData={hasData}
            hasRecommendations={recommendationCount > 0}
          />
        </s-section>
      </s-page>
    );
  }

  return (
    <s-page heading="Store overview">
      {hasData ? (
        <SubmitButton
          fetcher={fetcher}
          slot="primary-action"
          intent="generate_recommendations"
        >
          {isGenerating ? "Preparing..." : "Get recommendations"}
        </SubmitButton>
      ) : null}

      {isGenerating ? (
        <s-section>
          <div className="ms-status-banner">
            <span className="ms-loading">Analyzing your data — one moment...</span>
          </div>
        </s-section>
      ) : null}

      {isNewUser ? (
        <s-section>
          <WelcomeScreen
            shopDomain={shop.shop_domain}
            trackingId={shop.tracking_id}
            trackingScriptUrl={trackingScriptUrl}
            hasData={hasData}
            hasRecommendations={recommendationCount > 0}
          />
        </s-section>
      ) : (
        <s-section>
          <ProductJourney
            hasTracking={hasData}
            hasData={hasData}
            hasRecommendations={recommendationCount > 0}
          />
        </s-section>
      )}

      <s-section>
        <SectionBlock title="Your numbers" subtitle="Last 30 days">
          <div className="ms-metric-grid">
            <MetricCard label="Visitors" value={metrics!.totalVisitors} accent="brand" hint="Unique people who visited" />
            <MetricCard label="Sessions" value={metrics!.totalSessions} accent="info" hint="Total store visits" />
            <MetricCard label="Conversion" value={`${metrics!.conversionRate}%`} accent="ai" hint="Visitors who purchased" />
            <MetricCard
              label="Avg. time"
              value={`${Math.round(metrics!.avgSessionDuration / 60)} min`}
              accent="warning"
              hint="Time spent in your store"
            />
          </div>
        </SectionBlock>
      </s-section>

      <s-section>
        <SectionBlock
          title={recommendationCount > 0 ? "What to do next" : "Action recommendations"}
          subtitle={
            recommendationCount > 0
              ? "Highest-impact improvements for your store"
              : "Click Get recommendations above — Solution will analyze your data"
          }
        >
          {recommendations.length > 0 ? (
            <div className="ms-stack">
              {recommendations.map((rec) => (
                <RecommendationCard key={rec.id} rec={rec} />
              ))}
              {recommendationCount > 3 ? (
                <AppLink to="/app/recommendations" className="ms-text-link">
                  View all {recommendationCount} recommendations
                </AppLink>
              ) : null}
            </div>
          ) : (
            <EmptyState
              icon="spark"
              title="No recommendations yet"
              description="Click Get recommendations at the top. Solution will review your data and suggest improvements."
              action={
                <SubmitButton fetcher={fetcher} intent="generate_recommendations">
                  {isGenerating ? "Preparing..." : "Get recommendations now"}
                </SubmitButton>
              }
            />
          )}
        </SectionBlock>
      </s-section>

      <s-section>
        <SectionBlock title="Where to next?" subtitle="Everything Solution offers">
          <QuickNav />
        </SectionBlock>
      </s-section>

      <s-section>
        <ChatPromo />
      </s-section>

      {segments.length > 0 ? (
        <s-section>
          <SectionBlock title="Customer segments" subtitle="Visitors grouped by source and device">
            <div className="ms-metric-grid">
              {segments.map((seg) => (
                <div key={seg.id} className="ms-card ms-card-soft">
                  <s-text type="strong">{seg.name}</s-text>
                  <div className="ms-metric-value">{seg.member_count}</div>
                  <s-text color="subdued">people in segment</s-text>
                </div>
              ))}
            </div>
            <AppLink to="/app/segments" className="ms-text-link">
              View all segments
            </AppLink>
          </SectionBlock>
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

