import { AppLink } from "../AppLink";
import { BrandLogo } from "./BrandLogo";
import type { UsageSummary } from "../../config/plans";

export function BrandHeader({ usage }: { usage?: UsageSummary }) {
  return (
    <header className="ms-brand-header" role="banner">
      <div className="ms-brand-header-inner">
        <BrandLogo size={36} />
        <strong className="ms-brand-name">Solution</strong>
        {usage ? (
          <AppLink to="/app/billing" className="ms-usage-pill">
            {usage.planLabel}
            {usage.plan !== "pro"
              ? ` · ${usage.scansUsed}/${usage.scanLimit} scans · ${usage.outputsUsed}/${usage.outputLimit} chat`
              : null}
          </AppLink>
        ) : null}
      </div>
    </header>
  );
}
