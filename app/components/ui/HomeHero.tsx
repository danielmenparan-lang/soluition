import { AppLink } from "../AppLink";
import { formatMoney } from "../../utils/format-currency";
import { getStoreScoreCopy } from "../../utils/store-score-copy";
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
          <p className="ms-store-snapshot-label">How is your store doing?</p>
          <h2 className="ms-store-snapshot-verdict">{copy.verdict}</h2>
          <p className="ms-store-snapshot-explain">{copy.explain}</p>
        </div>
        <div
          className={`ms-store-snapshot-score ms-store-snapshot-grade-${storeHealthGrade.toLowerCase()}`}
          aria-label={`Store score ${storeHealthScore} out of 100, grade ${storeHealthGrade}`}
        >
          <span className="ms-store-snapshot-number">{storeHealthScore}</span>
          <span className="ms-store-snapshot-outof">/ 100</span>
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
          <span className="ms-store-snapshot-kpi-label">Visitors (30d)</span>
          <strong>{visitorCount !== null ? visitorCount : "—"}</strong>
        </div>
        <div className="ms-store-snapshot-kpi">
          <span className="ms-store-snapshot-kpi-label">Sales rate</span>
          <strong>{sessionConversion !== null ? `${sessionConversion}%` : "—"}</strong>
          <span className="ms-store-snapshot-kpi-hint">Visitors who buy</span>
        </div>
        <div className="ms-store-snapshot-kpi">
          <span className="ms-store-snapshot-kpi-label">Orders (30d)</span>
          <strong>{intelligence.orders.totalOrders}</strong>
        </div>
        <div className="ms-store-snapshot-kpi">
          <span className="ms-store-snapshot-kpi-label">Revenue (30d)</span>
          <strong>
            {intelligence.hasShopifyOrders
              ? formatMoney(intelligence.revenue.totalRevenue, currency)
              : "—"}
          </strong>
        </div>
      </div>

      <div className="ms-store-snapshot-actions">
        <AppLink to="/app/chat" className="ms-btn ms-btn-primary">
          Ask Chat — why no sales?
        </AppLink>
        <AppLink to="/app/recommendations" className="ms-btn ms-btn-secondary">
          See all fixes
        </AppLink>
      </div>
    </div>
  );
}
