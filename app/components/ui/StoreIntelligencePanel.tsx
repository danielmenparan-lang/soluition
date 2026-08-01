import type {
  RfmSegment,
  ShopifySyncStatus,
  StoreIntelligence,
} from "../../types/store-intelligence.types";
import { RFM_LABELS } from "../../types/store-intelligence.types";
import { formatMoney } from "../../utils/format-currency";
import { SectionBlock } from "./SectionBlock";

type StoreIntelligencePanelProps = {
  intelligence: StoreIntelligence;
  syncStatus?: ShopifySyncStatus | null;
  showSyncHint?: boolean;
};

function formatSyncTime(iso: string | null): string {
  if (!iso) return "Never";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function ChangeBadge({ value }: { value: number | null }) {
  if (value === null) return <s-text color="subdued">—</s-text>;
  const tone = value >= 0 ? "success" : "critical";
  const prefix = value >= 0 ? "+" : "";
  return (
    <s-text tone={tone}>
      {prefix}
      {value}%
    </s-text>
  );
}

export function StoreIntelligencePanel({
  intelligence,
  syncStatus,
  showSyncHint = false,
}: StoreIntelligencePanelProps) {
  const currency = intelligence.primaryCurrency;
  const fmt = (n: number) => formatMoney(n, currency);

  if (!intelligence.hasShopifyOrders) {
    return (
      <SectionBlock
        title="Shopify store intelligence"
        subtitle="Order sync brings revenue, LTV, RFM, and catalog metrics"
      >
        <s-banner tone="info">
          <s-paragraph>
            No Shopify orders synced yet.
            {showSyncHint
              ? " Pro plan: use Sync Shopify data on Home, or re-install the app to grant read_orders."
              : " Enable tracking or connect Shopify order sync."}
          </s-paragraph>
        </s-banner>
        {syncStatus?.lastSyncError ? (
          <s-banner tone="warning">
            <s-paragraph>Last sync error: {syncStatus.lastSyncError}</s-paragraph>
          </s-banner>
        ) : null}
      </SectionBlock>
    );
  }

  const rfmEntries = (
    Object.entries(intelligence.rfm) as Array<
      [keyof typeof intelligence.rfm, number]
    >
  ).filter(([, count]) => count > 0);

  return (
    <div className="ms-stack ms-stack-loose">
      {syncStatus ? (
        <div className="ms-card ms-card-soft ms-sync-status">
          <s-text type="strong">Shopify sync</s-text>
          <s-text color="subdued">
            Last sync: {formatSyncTime(syncStatus.lastSyncAt)}
            {syncStatus.lastOrdersSynced > 0
              ? ` · ${syncStatus.lastOrdersSynced} orders, ${syncStatus.lastProductsSynced} products`
              : ""}
          </s-text>
          {syncStatus.lastSyncError ? (
            <s-text tone="critical">Error: {syncStatus.lastSyncError}</s-text>
          ) : null}
        </div>
      ) : null}

      {intelligence.dataQuality.warnings.length > 0 ? (
        <s-banner tone="warning">
          <s-stack direction="block" gap="small">
            {intelligence.dataQuality.warnings.map((warning) => (
              <s-paragraph key={warning}>{warning}</s-paragraph>
            ))}
          </s-stack>
        </s-banner>
      ) : null}

      <SectionBlock
        title="Revenue & period trend"
        subtitle={`Last ${intelligence.periodDays} days · ${intelligence.metricCount} KPIs tracked`}
      >
        <div className="ms-metric-grid">
          <div className="ms-card ms-card-soft">
            <s-text color="subdued">Revenue</s-text>
            <div className="ms-metric-value">{fmt(intelligence.revenue.totalRevenue)}</div>
            <ChangeBadge value={intelligence.periodComparison.revenueChangePct} />
          </div>
          <div className="ms-card ms-card-soft">
            <s-text color="subdued">Orders</s-text>
            <div className="ms-metric-value">{intelligence.orders.totalOrders}</div>
            <ChangeBadge value={intelligence.periodComparison.ordersChangePct} />
          </div>
          <div className="ms-card ms-card-soft">
            <s-text color="subdued">AOV</s-text>
            <div className="ms-metric-value">
              {fmt(intelligence.revenue.averageOrderValue)}
            </div>
            <ChangeBadge value={intelligence.periodComparison.aovChangePct} />
          </div>
          <div className="ms-card ms-card-soft">
            <s-text color="subdued">Discount rate</s-text>
            <div className="ms-metric-value">
              {intelligence.revenue.discountRatePct}%
            </div>
          </div>
        </div>
      </SectionBlock>

      <SectionBlock
        title="Customer value"
        subtitle="Period spend vs all-time lifetime value (identified customers only)"
      >
        <div className="ms-metric-grid">
          <div className="ms-card ms-card-soft">
            <s-text color="subdued">Avg spend (period)</s-text>
            <div className="ms-metric-value">
              {fmt(intelligence.customers.avgSpendInPeriod)}
            </div>
          </div>
          <div className="ms-card ms-card-soft">
            <s-text color="subdued">Avg LTV (all time)</s-text>
            <div className="ms-metric-value">
              {fmt(intelligence.customers.avgLifetimeValue)}
            </div>
          </div>
          <div className="ms-card ms-card-soft">
            <s-text color="subdued">Repeat buyer rate</s-text>
            <div className="ms-metric-value">
              {intelligence.customers.repeatBuyerRatePct}%
            </div>
            <s-text color="subdued">
              {intelligence.customers.repeatBuyers} repeat ·{" "}
              {intelligence.customers.oneTimeBuyers} one-time
            </s-text>
          </div>
          <div className="ms-card ms-card-soft">
            <s-text color="subdued">Top 10% revenue share</s-text>
            <div className="ms-metric-value">
              {intelligence.customers.top10PctLtvSharePct}%
            </div>
          </div>
        </div>
      </SectionBlock>

      {rfmEntries.length > 0 ? (
        <SectionBlock title="RFM segments" subtitle="Recency, frequency, monetary — this period">
          <div className="ms-metric-grid">
            {rfmEntries.map(([segment, count]) => (
              <div key={String(segment)} className="ms-card ms-card-soft">
                <s-text type="strong">{RFM_LABELS[segment as RfmSegment]}</s-text>
                <div className="ms-metric-value">{count}</div>
                <s-text color="subdued">customers</s-text>
              </div>
            ))}
          </div>
        </SectionBlock>
      ) : null}

      {intelligence.cohorts.length > 0 ? (
        <SectionBlock
          title="First-order cohorts"
          subtitle="Customers grouped by month of first purchase in this period"
        >
          <s-table>
            <s-table-header-row>
              <s-table-header>Cohort</s-table-header>
              <s-table-header>Customers</s-table-header>
              <s-table-header>Repeat in period</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {intelligence.cohorts.map((cohort) => (
                <s-table-row key={cohort.month}>
                  <s-table-cell>{cohort.month}</s-table-cell>
                  <s-table-cell>{cohort.customers}</s-table-cell>
                  <s-table-cell>{cohort.repeatWithinCohortPct}%</s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        </SectionBlock>
      ) : null}

      {intelligence.orderGeo.length > 0 ? (
        <SectionBlock title="Orders by country">
          <s-table>
            <s-table-header-row>
              <s-table-header>Country</s-table-header>
              <s-table-header>Orders</s-table-header>
              <s-table-header>Revenue</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {intelligence.orderGeo.map((row) => (
                <s-table-row key={row.country}>
                  <s-table-cell>{row.country}</s-table-cell>
                  <s-table-cell>{row.orders}</s-table-cell>
                  <s-table-cell>{fmt(row.revenue)}</s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        </SectionBlock>
      ) : null}

      {intelligence.topProductsByRevenue.length > 0 ? (
        <SectionBlock title="Top products by revenue (orders)">
          <s-table>
            <s-table-header-row>
              <s-table-header>Product</s-table-header>
              <s-table-header>Units</s-table-header>
              <s-table-header>Revenue</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {intelligence.topProductsByRevenue.slice(0, 10).map((p) => (
                <s-table-row key={p.productId}>
                  <s-table-cell>{p.title}</s-table-cell>
                  <s-table-cell>{p.units}</s-table-cell>
                  <s-table-cell>{fmt(p.revenue)}</s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        </SectionBlock>
      ) : null}
    </div>
  );
}
