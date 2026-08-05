import { formatMoney } from "../../utils/format-currency";
import type { StoreIntelligence } from "../../types/store-intelligence.types";

type HomeMetricsStripProps = {
  intelligence: StoreIntelligence;
  visitorCount: number | null;
  sessionConversion: number | null;
  healthScore: number;
};

export function HomeMetricsStrip({
  intelligence,
  visitorCount,
  sessionConversion,
  healthScore,
}: HomeMetricsStripProps) {
  const currency = intelligence.primaryCurrency;

  return (
    <section className="ms-metrics-strip" aria-label="Store snapshot">
      <div className="ms-metrics-strip-score">
        <span className="ms-metrics-strip-value">{healthScore}</span>
        <span className="ms-metrics-strip-label">Health</span>
      </div>
      <dl className="ms-metrics-strip-items">
        <div>
          <dt>Visitors</dt>
          <dd>{visitorCount ?? "—"}</dd>
        </div>
        <div>
          <dt>Conversion</dt>
          <dd>{sessionConversion !== null ? `${sessionConversion}%` : "—"}</dd>
        </div>
        <div>
          <dt>Orders</dt>
          <dd>{intelligence.orders.totalOrders}</dd>
        </div>
        <div>
          <dt>Revenue</dt>
          <dd>
            {intelligence.hasShopifyOrders
              ? formatMoney(intelligence.revenue.totalRevenue, currency)
              : "—"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
