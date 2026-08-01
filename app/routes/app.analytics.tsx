import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getOrCreateShop } from "../services/shop.server";
import {
  getHighBouncePages,
  getHighTrafficLowConversionPages,
  getStoreHealthSummary,
} from "../services/analytics.server";
import { getProductExitDrivers } from "../services/product-intelligence.server";
import { getConversionFunnel } from "../services/funnel.server";
import { getRevenueTimeline, getVisitorTimeline } from "../services/revenue-timeline.server";
import { getSyncStatus } from "../services/sync-status.server";
import { getUsage } from "../services/usage.server";
import { MetricCard } from "../components/ui/MetricCard";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHero } from "../components/ui/PageHero";
import { HelpPanel } from "../components/ui/HelpPanel";
import { StoreIntelligencePanel } from "../components/ui/StoreIntelligencePanel";
import { TrendChart } from "../components/ui/TrendChart";
import { FunnelChart } from "../components/ui/FunnelChart";
import { HorizontalBarChart } from "../components/ui/HorizontalBarChart";
import { AppLink } from "../components/AppLink";
import { PAGE_HELP } from "../config/page-help";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

  const [
    health,
    bouncePages,
    lowConversionPages,
    productExitDrivers,
    syncStatus,
    usage,
    funnel,
    revenueTimeline,
    visitorTimeline,
  ] = await Promise.all([
    getStoreHealthSummary(shop.id).catch(() => null),
    getHighBouncePages(shop.id).catch(() => []),
    getHighTrafficLowConversionPages(shop.id).catch(() => []),
    getProductExitDrivers(shop.id).catch(() => []),
    getSyncStatus(shop.id).catch(() => null),
    getUsage(shop.id),
    getConversionFunnel(shop.id).catch(() => []),
    getRevenueTimeline(shop.id, 30).catch(() => []),
    getVisitorTimeline(shop.id, 30).catch(() => []),
  ]);

  return {
    metrics: health?.metrics ?? null,
    intelligence: health?.intelligence ?? null,
    syncStatus,
    plan: usage.plan,
    funnel,
    revenueTimeline,
    visitorTimeline,
    bouncePages,
    lowConversionPages,
    productExitDrivers,
  };
};

export default function Analytics() {
  const {
    metrics,
    intelligence,
    syncStatus,
    plan,
    funnel,
    revenueTimeline,
    visitorTimeline,
    bouncePages,
    lowConversionPages,
    productExitDrivers,
  } = useLoaderData<typeof loader>();

  const help = PAGE_HELP.analytics;
  const hasVisitorData = Boolean(metrics && metrics.totalVisitors > 0);
  const hasShopifyData = Boolean(intelligence?.hasShopifyOrders);
  const hasData = hasVisitorData || hasShopifyData;

  if (!hasData) {
    return (
      <s-page heading="Analytics">
        <s-section>
          <EmptyState
            icon="chart"
            title="No analytics yet"
            description="Enable the theme tracker on Home, or sync Shopify orders on Pro. Your charts and funnel will appear here."
            action={
              <AppLink to="/app" className="ms-btn ms-btn-primary">
                Set up on Home
              </AppLink>
            }
          />
        </s-section>
      </s-page>
    );
  }

  const chartPoints = hasShopifyData
    ? revenueTimeline.map((p) => ({ date: p.date, value: p.revenue }))
    : visitorTimeline.map((p) => ({ date: p.date, value: p.visitors }));

  return (
    <s-page heading="Analytics">
      <PageHero title={help.title} subtitle={help.subtitle} variant="analytics" compact />
      <HelpPanel title={help.helpTitle} items={help.helpItems} />

      <s-section>
        <div className="ms-home-charts">
          <TrendChart
            title={hasShopifyData ? "Revenue" : "Visitors"}
            subtitle="Daily trend — last 30 days"
            points={chartPoints}
            currency={hasShopifyData ? intelligence?.primaryCurrency : undefined}
            valueLabel="30-day total"
            accent={hasShopifyData ? "#0a9b7a" : "#6d5ef7"}
          />
          {hasVisitorData ? <FunnelChart steps={funnel} /> : null}
        </div>
      </s-section>

      {intelligence ? (
        <s-section>
          <StoreIntelligencePanel
            intelligence={intelligence}
            syncStatus={syncStatus}
            showSyncHint={plan !== "pro"}
          />
        </s-section>
      ) : null}

      {hasVisitorData ? (
        <>
          <s-section heading="Overview">
            <div className="ms-metric-grid">
              <MetricCard label="Visitors" value={metrics!.totalVisitors} accent="brand" />
              <MetricCard label="Sessions" value={metrics!.totalSessions} accent="info" />
              <MetricCard label="Conversion" value={`${metrics!.conversionRate}%`} accent="ai" />
              <MetricCard label="Cart abandonment" value={`${metrics!.abandonmentRate}%`} accent="warning" />
            </div>
          </s-section>

          <s-section>
            <div className="ms-home-charts">
              <HorizontalBarChart
                title="Traffic sources"
                subtitle="Sessions by channel"
                accent="#3d7ee8"
                items={metrics!.topTrafficSources.slice(0, 8).map((s) => ({
                  label: s.source,
                  value: s.sessions,
                }))}
                emptyMessage="No traffic sources yet."
              />
              <HorizontalBarChart
                title="Top countries"
                accent="#0a9b7a"
                items={metrics!.topCountries.slice(0, 8).map((c) => ({
                  label: c.country,
                  value: c.count,
                }))}
                emptyMessage="No geo data yet."
              />
            </div>
          </s-section>

          {lowConversionPages.length > 0 ? (
            <s-section heading="Pages to fix (high traffic, high exit)">
              <s-table>
                <s-table-header-row>
                  <s-table-header>Page</s-table-header>
                  <s-table-header>Views</s-table-header>
                  <s-table-header>Exit rate</s-table-header>
                </s-table-header-row>
                <s-table-body>
                  {lowConversionPages.slice(0, 8).map((p) => (
                    <s-table-row key={p.url}>
                      <s-table-cell>{p.pageTitle ?? p.url}</s-table-cell>
                      <s-table-cell>{p.views}</s-table-cell>
                      <s-table-cell>{p.exitRate}%</s-table-cell>
                    </s-table-row>
                  ))}
                </s-table-body>
              </s-table>
            </s-section>
          ) : null}

          {productExitDrivers.length > 0 ? (
            <s-section heading="Products linked to exits">
              <s-table>
                <s-table-header-row>
                  <s-table-header>Product</s-table-header>
                  <s-table-header>Exits</s-table-header>
                  <s-table-header>Exit rate</s-table-header>
                </s-table-header-row>
                <s-table-body>
                  {productExitDrivers.slice(0, 8).map((p) => (
                    <s-table-row key={p.productId}>
                      <s-table-cell>{p.productTitle}</s-table-cell>
                      <s-table-cell>{p.exitCount}</s-table-cell>
                      <s-table-cell>{p.exitRate}%</s-table-cell>
                    </s-table-row>
                  ))}
                </s-table-body>
              </s-table>
            </s-section>
          ) : null}
        </>
      ) : (
        <s-section>
          <s-banner tone="info">
            <s-paragraph>
              Visitor funnel and traffic charts need the theme embed. Shopify order
              intelligence above is already active.
            </s-paragraph>
          </s-banner>
        </s-section>
      )}
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
