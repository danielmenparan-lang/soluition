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
  const { storeHealthScore } = intelligence;
  const copy = getStoreScoreCopy(intelligence.storeHealthGrade, storeHealthScore);

  return (
    <section className="ms-home-summary ms-card">
      <div className="ms-home-summary-top">
        <div>
          <p className="ms-home-summary-label">Store health</p>
          <h2 className="ms-home-summary-headline">{copy.verdict}</h2>
        </div>
        <div className="ms-home-summary-score">
          <span className="ms-home-summary-value">{storeHealthScore}</span>
          <span className="ms-home-summary-max">/100</span>
        </div>
      </div>

      <dl className="ms-home-summary-stats">
        <div>
          <dt>Visitors</dt>
          <dd>{visitorCount !== null ? visitorCount : "—"}</dd>
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
