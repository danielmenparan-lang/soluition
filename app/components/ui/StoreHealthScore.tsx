import type { StoreIntelligence } from "../../types/store-intelligence.types";
import { formatMoney } from "../../utils/format-currency";

type StoreHealthScoreProps = {
  intelligence: StoreIntelligence;
};

function gradeColor(grade: StoreIntelligence["storeHealthGrade"]): string {
  switch (grade) {
    case "A":
      return "ms-health-a";
    case "B":
      return "ms-health-b";
    case "C":
      return "ms-health-c";
    case "D":
      return "ms-health-d";
    default:
      return "ms-health-f";
  }
}

export function StoreHealthScore({ intelligence }: StoreHealthScoreProps) {
  const { storeHealthScore, storeHealthGrade, hasShopifyOrders, primaryCurrency } =
    intelligence;
  const fmt = (n: number) => formatMoney(n, primaryCurrency);

  return (
    <div className={`ms-card ms-health-card ${gradeColor(storeHealthGrade)}`}>
      <div className="ms-health-header">
        <div>
          <s-text type="strong">Store Health Score</s-text>
          <s-text color="subdued">
            Composite score from orders, repeat rate, inventory, and discounts
          </s-text>
        </div>
        <div className="ms-health-badge">
          <span className="ms-health-grade">{storeHealthGrade}</span>
          <span className="ms-health-score">{storeHealthScore}/100</span>
        </div>
      </div>

      <div className="ms-health-bar" aria-hidden>
        <div
          className="ms-health-bar-fill"
          style={{ width: `${storeHealthScore}%` }}
        />
      </div>

      <details className="ms-health-method">
        <summary>How is this score calculated?</summary>
        <p>
          Base 40, plus points for order volume, repeat buyer rate, in-stock
          catalog %, reasonable discount levels, and a healthy RFM mix (fewer
          at-risk/hibernating customers). Not a industry benchmark — use it to
          track your own progress over time.
        </p>
      </details>

      <div className="ms-metric-grid ms-health-metrics">
        <div>
          <s-text color="subdued">Revenue ({intelligence.periodDays}d)</s-text>
          <div className="ms-metric-value">
            {hasShopifyOrders
              ? fmt(intelligence.revenue.totalRevenue)
              : "—"}
          </div>
        </div>
        <div>
          <s-text color="subdued">Orders</s-text>
          <div className="ms-metric-value">{intelligence.orders.totalOrders}</div>
        </div>
        <div>
          <s-text color="subdued">AOV</s-text>
          <div className="ms-metric-value">
            {hasShopifyOrders
              ? fmt(intelligence.revenue.averageOrderValue)
              : "—"}
          </div>
        </div>
        <div>
          <s-text color="subdued">Repeat buyers</s-text>
          <div className="ms-metric-value">
            {intelligence.customers.repeatBuyerRatePct}%
          </div>
        </div>
      </div>

      {!hasShopifyOrders ? (
        <s-banner tone="info">
          <s-paragraph>
            Connect Shopify orders — re-install the app to approve read_orders,
            then run Sync on Home (Pro).
          </s-paragraph>
        </s-banner>
      ) : null}
    </div>
  );
}
