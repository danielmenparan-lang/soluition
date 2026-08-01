import { formatMoney } from "../../utils/format-currency";
import type { StoreIntelligence } from "../../types/store-intelligence.types";

type HomeHeroProps = {
  intelligence: StoreIntelligence;
  visitorCount: number | null;
  sessionConversion: number | null;
};

function gradeClass(grade: string): string {
  return `ms-hero-grade ms-hero-grade-${grade.toLowerCase()}`;
}

export function HomeHero({
  intelligence,
  visitorCount,
  sessionConversion,
}: HomeHeroProps) {
  const currency = intelligence.primaryCurrency;
  const revChange = intelligence.periodComparison.revenueChangePct;

  return (
    <div className="ms-dashboard-hero">
      <div className="ms-hero-score-card">
        <p className="ms-hero-label">Store health</p>
        <div className="ms-hero-score-row">
          <span className={gradeClass(intelligence.storeHealthGrade)}>
            {intelligence.storeHealthGrade}
          </span>
          <span className="ms-hero-score-value">{intelligence.storeHealthScore}</span>
        </div>
        <div className="ms-hero-score-bar">
          <div
            className="ms-hero-score-fill"
            style={{ width: `${intelligence.storeHealthScore}%` }}
          />
        </div>
        <p className="ms-hero-score-hint">Score reflects orders, repeat buyers, discounts & stock issues</p>
      </div>

      <div className="ms-hero-kpis">
        <div className="ms-hero-kpi">
          <span className="ms-hero-kpi-label">Revenue (30d)</span>
          <strong className="ms-hero-kpi-value">
            {intelligence.hasShopifyOrders
              ? formatMoney(intelligence.revenue.totalRevenue, currency)
              : "—"}
          </strong>
          {revChange !== null ? (
            <span className={revChange >= 0 ? "ms-trend-up" : "ms-trend-down"}>
              {revChange >= 0 ? "+" : ""}
              {revChange}% vs prior period
            </span>
          ) : null}
        </div>
        <div className="ms-hero-kpi">
          <span className="ms-hero-kpi-label">Orders</span>
          <strong className="ms-hero-kpi-value">{intelligence.orders.totalOrders}</strong>
        </div>
        <div className="ms-hero-kpi">
          <span className="ms-hero-kpi-label">Visitors</span>
          <strong className="ms-hero-kpi-value">
            {visitorCount !== null ? visitorCount : "—"}
          </strong>
        </div>
        <div className="ms-hero-kpi">
          <span className="ms-hero-kpi-label">Session conversion</span>
          <strong className="ms-hero-kpi-value">
            {sessionConversion !== null ? `${sessionConversion}%` : "—"}
          </strong>
        </div>
      </div>
    </div>
  );
}
