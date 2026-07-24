import type { ReactNode } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getOrCreateShop } from "../services/shop.server";
import {
  getDashboardMetrics,
  getHighBouncePages,
  getHighTrafficLowConversionPages,
} from "../services/analytics.server";
import { getProductExitDrivers } from "../services/product-intelligence.server";
import { MetricCard } from "../components/ui/MetricCard";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHero } from "../components/ui/PageHero";
import { HelpPanel } from "../components/ui/HelpPanel";
import { AppLink } from "../components/AppLink";
import { PAGE_HELP } from "../config/page-help";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

  const [metrics, bouncePages, lowConversionPages, productExitDrivers] =
    await Promise.all([
      getDashboardMetrics(shop.id).catch(() => null),
      getHighBouncePages(shop.id).catch(() => []),
      getHighTrafficLowConversionPages(shop.id).catch(() => []),
      getProductExitDrivers(shop.id).catch(() => []),
    ]);

  return { metrics, bouncePages, lowConversionPages, productExitDrivers };
};

function DataTable({
  headers,
  rows,
  emptyMessage,
}: {
  headers: string[];
  rows: ReactNode[][];
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return <EmptyState title="No data" description={emptyMessage} />;
  }

  return (
    <s-table>
      <s-table-header-row>
        {headers.map((h) => (
          <s-table-header key={h}>{h}</s-table-header>
        ))}
      </s-table-header-row>
      <s-table-body>
        {rows.map((cells, i) => (
          <s-table-row key={i}>
            {cells.map((cell, j) => (
              <s-table-cell key={j}>{cell}</s-table-cell>
            ))}
          </s-table-row>
        ))}
      </s-table-body>
    </s-table>
  );
}

export default function Analytics() {
  const { metrics, bouncePages, lowConversionPages, productExitDrivers } =
    useLoaderData<typeof loader>();

  const help = PAGE_HELP.analytics;

  if (!metrics) {
    return (
      <s-page heading="Analytics">
        <s-section>
          <EmptyState
            icon="chart"
            title="No data yet"
            description="Enable tracking in your theme and browse the storefront once. Numbers will appear here automatically."
            action={
              <AppLink to="/app" className="ms-btn ms-btn-primary">
                Go to Home and enable tracking
              </AppLink>
            }
          />
        </s-section>
      </s-page>
    );
  }

  return (
    <s-page>
      <PageHero title={help.title} subtitle={help.subtitle} variant="analytics" compact />
      <HelpPanel title={help.helpTitle} items={help.helpItems} />

      <s-section heading="At a glance">
        <div className="ms-metric-grid">
          <MetricCard label="Visitors" value={metrics.totalVisitors} />
          <MetricCard label="Sessions" value={metrics.totalSessions} accent="info" />
          <MetricCard label="Events" value={metrics.totalEvents} accent="ai" />
          <MetricCard label="Conversion" value={`${metrics.conversionRate}%`} accent="brand" />
          <MetricCard label="Abandonment" value={`${metrics.abandonmentRate}%`} accent="warning" />
          <MetricCard
            label="Avg. time on site"
            value={`${Math.round(metrics.avgSessionDuration / 60)} min`}
          />
        </div>
      </s-section>

      <s-section heading="Traffic sources">
        <DataTable
          headers={["Source", "Sessions", "Purchases", "Revenue", "Conversion"]}
          rows={metrics.topTrafficSources.map((src) => [
            src.source,
            src.sessions,
            src.conversions,
            `$${src.revenue}`,
            `${src.conversionRate}%`,
          ])}
          emptyMessage="No data yet — make sure tracking is active."
        />
      </s-section>

      <s-section heading="Top products">
        <DataTable
          headers={["Product", "Views", "Purchases", "Conversion", "Revenue"]}
          rows={metrics.topProducts.map((p) => [
            p.productTitle,
            p.views,
            p.purchases,
            `${p.conversionRate}%`,
            `$${p.revenue}`,
          ])}
          emptyMessage="No product data — visit product pages on your storefront."
        />
      </s-section>

      {metrics.topCountries.length > 0 && (
        <s-section heading="Countries">
          <div className="ms-metric-grid">
            {metrics.topCountries.map((c) => (
              <div key={c.country} className="ms-card">
                <s-text type="strong">{c.country}</s-text>
                <s-paragraph>{c.count} visitors</s-paragraph>
              </div>
            ))}
          </div>
        </s-section>
      )}

      {metrics.peakConversionHours.length > 0 && (
        <s-section heading="Peak conversion hours">
          <div className="ms-metric-grid">
            {metrics.peakConversionHours.map((h) => (
              <div key={h.hour} className="ms-card">
                <s-text type="strong">{h.hour}:00</s-text>
                <s-paragraph>{h.conversions} conversions</s-paragraph>
              </div>
            ))}
          </div>
        </s-section>
      )}

      <s-section heading="High traffic, low conversion pages">
        <DataTable
          headers={["URL", "Title", "Views", "Exits", "Exit rate"]}
          rows={lowConversionPages.map((p) => [
            p.url,
            p.pageTitle ?? "—",
            p.views,
            p.exits,
            `${p.exitRate}%`,
          ])}
          emptyMessage="Not enough data to flag problem pages."
        />
      </s-section>

      <s-section heading="Products linked to exits">
        <DataTable
          headers={["Product", "Views", "Exits", "Exit rate"]}
          rows={productExitDrivers.map((p) => [
            p.productTitle,
            p.viewCount,
            p.exitCount,
            `${p.exitRate}%`,
          ])}
          emptyMessage="No product exit data yet."
        />
      </s-section>

      <s-section heading="Quick-exit pages">
        <DataTable
          headers={["URL", "Title", "Exits"]}
          rows={bouncePages.map((p) => [p.url, p.pageTitle ?? "—", p.exitCount])}
          emptyMessage="No bounce data yet."
        />
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
