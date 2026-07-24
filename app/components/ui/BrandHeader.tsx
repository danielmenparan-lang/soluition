import { AppLink } from "../AppLink";
import type { UsageSummary } from "../config/plans";

export function BrandHeader({ usage }: { usage?: UsageSummary }) {
  return (
    <header className="ms-brand-header" role="banner">
      <div className="ms-brand-header-inner">
        <span className="ms-brand-mark" aria-hidden>
          S
        </span>
        <div className="ms-brand-copy">
          <strong className="ms-brand-name">Solution</strong>
          <span className="ms-brand-tagline">
            See what happens in your store — and what to do next
          </span>
        </div>
        {usage ? (
          <AppLink to="/app/billing" className="ms-usage-pill">
            {usage.planLabel} · {usage.outputsUsed}/{usage.outputLimit} outputs
          </AppLink>
        ) : null}
      </div>
    </header>
  );
}
