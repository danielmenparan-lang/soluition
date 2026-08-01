import { POSITIONING } from "../../config/positioning";

const STEPS = [
  { num: "1", label: "We check your store" },
  { num: "2", label: "You see what to fix" },
  { num: "3", label: "Chat helps you act" },
] as const;

export function HomePitch() {
  return (
    <div className="ms-home-pitch">
      <p className="ms-home-pitch-tagline">{POSITIONING.homePitch}</p>
      <div className="ms-home-pitch-steps" aria-hidden>
        {STEPS.map((step) => (
          <div key={step.num} className="ms-home-pitch-step">
            <span className="ms-home-pitch-num">{step.num}</span>
            <span>{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
