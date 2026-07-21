import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getOrCreateShop } from "../services/shop.server";
import { getDashboardMetrics, getHighBouncePages } from "../services/analytics.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

  const [metrics, bouncePages] = await Promise.all([
    getDashboardMetrics(shop.id),
    getHighBouncePages(shop.id),
  ]);

  return { metrics, bouncePages };
};

export default function Analytics() {
  const { metrics, bouncePages } = useLoaderData<typeof loader>();

  return (
    <s-page heading="אנליטיקה">
      <s-section heading="מדדים">
        <s-grid gridTemplateColumns="repeat(3, 1fr)" gap="base">
          <Stat label="מבקרים" value={metrics.totalVisitors} />
          <Stat label="Sessions" value={metrics.totalSessions} />
          <Stat label="Events" value={metrics.totalEvents} />
          <Stat label="Conversion Rate" value={`${metrics.conversionRate}%`} />
          <Stat label="Abandonment Rate" value={`${metrics.abandonmentRate}%`} />
          <Stat
            label="Session Duration"
            value={`${Math.round(metrics.avgSessionDuration / 60)} min`}
          />
        </s-grid>
      </s-section>

      <s-section heading="מקורות תנועה מובילים">
        <s-table>
          <s-table-header-row>
            <s-table-header>מקור</s-table-header>
            <s-table-header>Sessions</s-table-header>
            <s-table-header>Conversions</s-table-header>
            <s-table-header>Revenue</s-table-header>
            <s-table-header>Conversion Rate</s-table-header>
          </s-table-header-row>
          <s-table-body>
            {metrics.topTrafficSources.map((src) => (
              <s-table-row key={src.source}>
                <s-table-cell>{src.source}</s-table-cell>
                <s-table-cell>{src.sessions}</s-table-cell>
                <s-table-cell>{src.conversions}</s-table-cell>
                <s-table-cell>${src.revenue}</s-table-cell>
                <s-table-cell>{src.conversionRate}%</s-table-cell>
              </s-table-row>
            ))}
          </s-table-body>
        </s-table>
      </s-section>

      <s-section heading="מוצרים מובילים">
        <s-table>
          <s-table-header-row>
            <s-table-header>מוצר</s-table-header>
            <s-table-header>צפיות</s-table-header>
            <s-table-header>רכישות</s-table-header>
            <s-table-header>Conversion</s-table-header>
            <s-table-header>Revenue</s-table-header>
          </s-table-header-row>
          <s-table-body>
            {metrics.topProducts.map((p) => (
              <s-table-row key={p.productId}>
                <s-table-cell>{p.productTitle}</s-table-cell>
                <s-table-cell>{p.views}</s-table-cell>
                <s-table-cell>{p.purchases}</s-table-cell>
                <s-table-cell>{p.conversionRate}%</s-table-cell>
                <s-table-cell>${p.revenue}</s-table-cell>
              </s-table-row>
            ))}
          </s-table-body>
        </s-table>
      </s-section>

      <s-section heading="מדינות מובילות">
        <s-grid gridTemplateColumns="repeat(5, 1fr)" gap="base">
          {metrics.topCountries.map((c) => (
            <s-box key={c.country} padding="base" background="subdued" borderRadius="base">
              <s-text type="strong">{c.country}</s-text>
              <s-paragraph>{c.count} מבקרים</s-paragraph>
            </s-box>
          ))}
        </s-grid>
      </s-section>

      <s-section heading="שעות Peak Conversion">
        <s-grid gridTemplateColumns="repeat(5, 1fr)" gap="base">
          {metrics.peakConversionHours.map((h) => (
            <s-box key={h.hour} padding="base" background="subdued" borderRadius="base">
              <s-text type="strong">{h.hour}:00</s-text>
              <s-paragraph>{h.conversions} conversions</s-paragraph>
            </s-box>
          ))}
        </s-grid>
      </s-section>

      <s-section heading="דפים עם נטישה גבוהה">
        <s-table>
          <s-table-header-row>
            <s-table-header>URL</s-table-header>
            <s-table-header>כותרת</s-table-header>
            <s-table-header>יציאות</s-table-header>
          </s-table-header-row>
          <s-table-body>
            {bouncePages.map((p) => (
              <s-table-row key={p.url}>
                <s-table-cell>{p.url}</s-table-cell>
                <s-table-cell>{p.pageTitle ?? "—"}</s-table-cell>
                <s-table-cell>{p.exitCount}</s-table-cell>
              </s-table-row>
            ))}
          </s-table-body>
        </s-table>
      </s-section>
    </s-page>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <s-box padding="base" background="subdued" borderRadius="base">
      <s-text color="subdued">{label}</s-text>
      <s-heading>{String(value)}</s-heading>
    </s-box>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
