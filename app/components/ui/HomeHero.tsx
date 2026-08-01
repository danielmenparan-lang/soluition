import { formatMoney } from "../../utils/format-currency";
import { getStoreScoreCopy, getScoreHint } from "../../utils/store-score-copy";
import type { StoreIntelligence } from "../../types/store-intelligence.types";

type HomeHeroProps = {
  intelligence: StoreIntelligence;
  visitorCount: number | null;
  sessionConversion: number | null;
};

export function HomeHero({
  intelligence,
  visitorCount,
  sessionConversion,
}: HomeHeroProps) {
  const currency = intelligence.primaryCurrency;
  const { storeHealthGrade, storeHealthScore } = intelligence;
  const copy = getStoreScoreCopy(storeHealthGrade, storeHealthScore);

  return (
    <div className={`ms-store-snapshot ms-store-snapshot-${copy.tone}`}>
      <div className="ms-store-snapshot-top">
        <div className="ms-store-snapshot-copy">
          <p className="ms-store-snapshot-label">Your store today</p>
          <h2 className="ms-store-snapshot-verdict">{copy.verdict}</h2>
          <p className="ms-store-snapshot-explain">{copy.explain}</p>
        </div>
        <div
          className={`ms-store-snapshot-score ms-store-snapshot-grade-${storeHealthGrade.toLowerCase()}`}
          aria-label={`Store score ${storeHealthScore} out of 100`}
        >
          <span className="ms-store-snapshot-number">{storeHealthScore}</span>
          <span className="ms-store-snapshot-outof">/ 100</span>
          <span className="ms-store-snapshot-hint">{getScoreHint(storeHealthScore)}</span>
        </div>
      </div>

      <div
        className="ms-store-snapshot-bar"
        role="progressbar"
        aria-valuenow={storeHealthScore}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="ms-store-snapshot-bar-fill"
          style={{ width: `${storeHealthScore}%` }}
        />
      </div>

      <div className="ms-store-snapshot-kpis">
        <div className="ms-store-snapshot-kpi">
          <span className="ms-store-snapshot-kpi-label">Visitors</span>
          <strong>{visitorCount !== null ? visitorCount : "—"}</strong>
        </div>
        <div className="ms-store-snapshot-kpi">
          <span className="ms-store-snapshot-kpi-label">Sales rate</span>
          <strong>{sessionConversion !== null ? `${sessionConversion}%` : "—"}</strong>
        </div>
        <div className="ms-store-snapshot-kpi">
          <span className="ms-store-snapshot-kpi-label">Orders</span>
          <strong>{intelligence.orders.totalOrders}</strong>
        </div>
        <div className="ms-store-snapshot-kpi">
          <span className="ms-store-snapshot-kpi-label">Revenue</span>
          <strong>
            {intelligence.hasShopifyOrders
              ? formatMoney(intelligence.revenue.totalRevenue, currency)
              : "—"}
          </strong>
        </div>
      </div>
    </div>
  );
}
