import type { PlanTier } from "../../config/plans";
import { PLAN_LIMITS, isPaidPlan } from "../../config/plans";
import { POSITIONING } from "../../config/positioning";
import { AppLink } from "../AppLink";

type ProUpgradeCardProps = {
  plan: PlanTier;
};

export function ProUpgradeCard({ plan }: ProUpgradeCardProps) {
  if (plan === "pro") return null;

  const isFree = plan === "free";
  const title = isFree ? POSITIONING.starterTitle : POSITIONING.proTitle;
  const text = isFree ? POSITIONING.starterText : POSITIONING.proText;
  const upgradePlan = isFree ? "starter" : "pro";
  const cta = isFree ? "Upgrade to Starter" : "Upgrade to Pro";

  return (
    <section className="ms-pro-panel">
      <h3 className="ms-section-title">{title}</h3>
      <p className="ms-section-lead">{text}</p>
      {!isPaidPlan(plan) ? (
        <p className="ms-pro-stats">
          Free: {PLAN_LIMITS.free.visibleRecommendations} actions +{" "}
          {PLAN_LIMITS.free.outputs} chat / month
        </p>
      ) : null}
      <AppLink to={`/app/billing?plan=${upgradePlan}`} className="ms-btn ms-btn-secondary">
        {cta}
      </AppLink>
    </section>
  );
}
