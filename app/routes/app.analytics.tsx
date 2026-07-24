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
    return <EmptyState title="אין נתונים" description={emptyMessage} />;
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
      <s-page heading="מה קורה בחנות">
        <s-section>
          <EmptyState
            icon="chart"
            title="עדיין אין נתונים כאן"
            description="קודם צריך להפעיל מעקב בחנות ולגלוש בה פעם אחת. אחרי זה המספרים יופיעו כאן אוטומטית."
            action={
              <AppLink to="/app" className="ms-btn ms-btn-primary">
                ← חזור להתחלה והפעל מעקב
              </AppLink>
            }
          />
        </s-section>
      </s-page>
    );
  }

  return (
    <s-page>
      <PageHero
        title={help.title}
        subtitle={help.subtitle}
        variant="analytics"
        compact
      />
      <HelpPanel title={help.helpTitle} items={help.helpItems} />

      <s-section heading="המספרים בקצרה">
        <div className="ms-metric-grid">
          <MetricCard label="מבקרים" value={metrics.totalVisitors} />
          <MetricCard label="ביקורים" value={metrics.totalSessions} accent="info" />
          <MetricCard label="פעולות" value={metrics.totalEvents} accent="ai" />
          <MetricCard label="אחוז קונים" value={`${metrics.conversionRate}%`} accent="brand" />
          <MetricCard label="עזיבה" value={`${metrics.abandonmentRate}%`} accent="warning" />
          <MetricCard
            label="זמן ממוצע בחנות"
            value={`${Math.round(metrics.avgSessionDuration / 60)} דק'`}
          />
        </div>
      </s-section>

      <s-section heading="מאיפה מגיעים">
        <DataTable
          headers={["מקור", "ביקורים", "רכישות", "הכנסות", "אחוז קונים"]}
          rows={metrics.topTrafficSources.map((src) => [
            src.source,
            src.sessions,
            src.conversions,
            `$${src.revenue}`,
            `${src.conversionRate}%`,
          ])}
          emptyMessage="אין נתונים עדיין — ודא שהמעקב פעיל."
        />
      </s-section>

      <s-section heading="מוצרים פופולריים">
        <DataTable
          headers={["מוצר", "צפיות", "רכישות", "אחוז קונים", "הכנסות"]}
          rows={metrics.topProducts.map((p) => [
            p.productTitle,
            p.views,
            p.purchases,
            `${p.conversionRate}%`,
            `$${p.revenue}`,
          ])}
          emptyMessage="אין נתוני מוצרים — גלוש בדפי מוצר בחנות."
        />
      </s-section>

      {metrics.topCountries.length > 0 && (
        <s-section heading="מדינות">
          <div className="ms-metric-grid">
            {metrics.topCountries.map((c) => (
              <div key={c.country} className="ms-card">
                <s-text type="strong">{c.country}</s-text>
                <s-paragraph>{c.count} מבקרים</s-paragraph>
              </div>
            ))}
          </div>
        </s-section>
      )}

      {metrics.peakConversionHours.length > 0 && (
        <s-section heading="שעות עם הכי הרבה רכישות">
          <div className="ms-metric-grid">
            {metrics.peakConversionHours.map((h) => (
              <div key={h.hour} className="ms-card">
                <s-text type="strong">{h.hour}:00</s-text>
                <s-paragraph>{h.conversions} המרות</s-paragraph>
              </div>
            ))}
          </div>
        </s-section>
      )}

      <s-section heading="דפים שמושכים תנועה אבל לא מוכרים">
        <DataTable
          headers={["כתובת", "שם", "צפיות", "עזיבות", "אחוז עזיבה"]}
          rows={lowConversionPages.map((p) => [
            p.url,
            p.pageTitle ?? "—",
            p.views,
            p.exits,
            `${p.exitRate}%`,
          ])}
          emptyMessage="אין מספיק נתונים לזיהוי דפים בעייתיים."
        />
      </s-section>

      <s-section heading="מוצרים שגורמים לעזוב">
        <DataTable
          headers={["מוצר", "צפיות", "עזיבות", "אחוז עזיבה"]}
          rows={productExitDrivers.map((p) => [
            p.productTitle,
            p.viewCount,
            p.exitCount,
            `${p.exitRate}%`,
          ])}
          emptyMessage="אין נתוני נטישת מוצרים עדיין."
        />
      </s-section>

      <s-section heading="דפים שאנשים עוזבים מהר">
        <DataTable
          headers={["כתובת", "שם", "עזיבות"]}
          rows={bouncePages.map((p) => [
            p.url,
            p.pageTitle ?? "—",
            p.exitCount,
          ])}
          emptyMessage="אין נתוני bounce עדיין."
        />
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
