import { AppLink } from "../AppLink";
import { BrandLogo } from "./BrandLogo";
import type { UsageSummary } from "../../config/plans";
import { POSITIONING } from "../../config/positioning";

export function BrandHeader({ usage }: { usage?: UsageSummary }) {
  return (
    <header className="ms-brand-header" role="banner">
      <div className="ms-brand-header-inner">
        <BrandLogo size={44} />
        <div className="ms-brand-copy">
          <strong className="ms-brand-name">Solution</strong>
          <span className="ms-brand-tagline">{POSITIONING.brandTagline}</span>
        </div>
        {usage ? (
          <AppLink to="/app/billing" className="ms-usage-pill">
            {usage.planLabel}
            {usage.plan === "free"
              ? ` · ${usage.outputsUsed}/${usage.outputLimit} AI`
              : " · Pro"}
          </AppLink>
        ) : null}
      </div>
    </header>
  );
}
