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
  const { storeHealthScore } = intelligence;
  const copy = getStoreScoreCopy(intelligence.storeHealthGrade, storeHealthScore);

  return (
    <section className="ms-store-status">
      <div className="ms-store-status-main">
        <h2 className="ms-store-status-headline">{copy.verdict}</h2>
        <p className="ms-store-status-note">{copy.explain}</p>
      </div>
      <div className="ms-store-status-score" title={getScoreHint(storeHealthScore)}>
        <span className="ms-store-status-value">{storeHealthScore}</span>
        <span className="ms-store-status-max">/100</span>
      </div>

      <dl className="ms-store-stats">
        <div>
          <dt>Visitors</dt>
          <dd>{visitorCount !== null ? visitorCount : "—"}</dd>
        </div>
        <div>
          <dt>Sales rate</dt>
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
