import { AppLink } from "../AppLink";
import { formatMoney } from "../../utils/format-currency";
import { POSITIONING } from "../../config/positioning";
import type { StoreIntelligence } from "../../types/store-intelligence.types";

type ProUpgradeCardProps = {
  intelligence: StoreIntelligence | null;
};

export function ProUpgradeCard({ intelligence }: ProUpgradeCardProps) {
  const currency = intelligence?.primaryCurrency ?? "USD";
  const hasTeaser = Boolean(intelligence?.hasShopifyOrders);

  return (
    <div className="ms-pro-card">
      <div className="ms-pro-card-glow" aria-hidden />
      <div className="ms-pro-card-inner">
        <p className="ms-pro-kicker">Pro — $29/mo</p>
        <h3 className="ms-pro-title">{POSITIONING.proTitle}</h3>
        <p className="ms-pro-text">{POSITIONING.proText}</p>
        {hasTeaser && intelligence ? (
          <div className="ms-pro-teaser">
            <div>
              <span className="ms-pro-teaser-label">Avg LTV</span>
              <strong>{formatMoney(intelligence.customers.avgLifetimeValue, currency)}</strong>
            </div>
            <div>
              <span className="ms-pro-teaser-label">Repeat rate</span>
              <strong>{intelligence.customers.repeatBuyerRatePct}%</strong>
            </div>
            <div>
              <span className="ms-pro-teaser-label">Customers</span>
              <strong>{intelligence.customers.uniqueCustomers}</strong>
            </div>
          </div>
        ) : (
          <p className="ms-pro-text ms-pro-text-muted">
            Sync orders to see why repeat buyers matter — included in Pro.
          </p>
        )}
        <AppLink to="/app/billing" className="ms-btn ms-btn-primary ms-pro-cta">
          Upgrade to Pro
        </AppLink>
      </div>
    </div>
  );
}
