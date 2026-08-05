import { POSITIONING } from "../../config/positioning";

type HomePageIntroProps = {
  hasActions: boolean;
};

export function HomePageIntro({ hasActions }: HomePageIntroProps) {
  return (
    <header className="ms-home-intro">
      <p className="ms-home-intro-tagline">{POSITIONING.tagline}</p>
      <p className="ms-home-intro-lead">
        {hasActions
          ? POSITIONING.actionsLead
          : "Tap Scan for actions — we'll rank what to market or fix first."}
      </p>
    </header>
  );
}
