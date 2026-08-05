import { AppLink } from "../AppLink";
import { POSITIONING } from "../../config/positioning";
import { countSkillsByMode } from "../../config/marketing-skills";
import type { StoreBrain } from "../../types/store-brain.types";

type StoreBrainVisualProps = {
  brain: StoreBrain;
};

function statusClass(status: string): string {
  if (status === "active") return "is-active";
  if (status === "pending") return "is-pending";
  return "is-off";
}

export function StoreBrainVisual({ brain }: StoreBrainVisualProps) {
  const { inputs, skills, domains, activeDomainCount, output, thinkingLine } = brain;
  const skillModes = countSkillsByMode(domains.map((d) => d.status));

  return (
    <section className="ms-brain" aria-label="Store marketing brain">
      <div className="ms-brain-header">
        <h2 className="ms-brain-title">{POSITIONING.brainTitle}</h2>
        <p className="ms-brain-tagline">{POSITIONING.tagline}</p>
        <p className="ms-brain-skill-count">
          {activeDomainCount}/10 domains · {skillModes.trainableNow}/100 skills active now (
          {skillModes.live} live data, {skillModes.ai} AI guidance)
        </p>
      </div>

      <div className="ms-brain-flow">
        <div className="ms-brain-column ms-brain-inputs">
          <p className="ms-brain-column-label">Signals</p>
          <ul className="ms-brain-nodes">
            {inputs.map((input) => (
              <li
                key={input.id}
                className={`ms-brain-node ${statusClass(input.status)}`}
                title={input.detail}
              >
                <span className="ms-brain-node-dot" aria-hidden />
                <span className="ms-brain-node-label">{input.label}</span>
                <span className="ms-brain-node-detail">{input.detail}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="ms-brain-core-wrap">
          <div className="ms-brain-connector" aria-hidden />
          <div className="ms-brain-core">
            <span className="ms-brain-core-label">CMO brain · 100 skills</span>
            <ul className="ms-brain-domains">
              {domains.map((domain) => (
                <li
                  key={domain.id}
                  className={`ms-brain-domain ${statusClass(domain.status)}`}
                  title={domain.headline}
                >
                  <span className="ms-brain-domain-label">{domain.label}</span>
                  <span className="ms-brain-domain-meta">
                    {domain.status === "active"
                      ? `${domain.activeCount}/${domain.totalCount}`
                      : domain.status === "pending"
                        ? "…"
                        : "—"}
                  </span>
                </li>
              ))}
            </ul>
            <ul className="ms-brain-skills ms-brain-skills-compact">
              {skills.map((skill) => (
                <li
                  key={skill.id}
                  className={`ms-brain-skill ${statusClass(skill.status)}`}
                  title={skill.summary}
                >
                  {skill.label}
                </li>
              ))}
            </ul>
            <p className="ms-brain-thinking">{thinkingLine}</p>
          </div>
          <div className="ms-brain-connector" aria-hidden />
        </div>

        <div className="ms-brain-column ms-brain-output">
          <p className="ms-brain-column-label">Output</p>
          <div className={`ms-brain-verdict ${output.readyForAds ? "is-ready" : "is-hold"}`}>
            <p className="ms-brain-verdict-sharp">{output.verdictSharp}</p>
            <div className="ms-brain-score-row">
              <span className="ms-brain-score">{output.score}</span>
              <span className="ms-brain-score-max">/100</span>
              <span className="ms-brain-confidence">{output.confidence} confidence</span>
            </div>
          </div>

          {output.todayAction ? (
            <div className="ms-brain-today">
              <p className="ms-brain-today-label">{POSITIONING.todayLabel}</p>
              <h3 className="ms-brain-today-title">{output.todayAction.title}</h3>
              <p className="ms-brain-today-why">{output.todayAction.why}</p>
              <p className="ms-brain-today-proof">
                <strong>Proof:</strong> {output.todayAction.proof}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <nav className="ms-brain-links" aria-label="Brain skills in app">
        <AppLink to="/app/analytics">Funnel</AppLink>
        <AppLink to="/app/segments">Segments</AppLink>
        <AppLink to="/app/recommendations">Marketing</AppLink>
        <AppLink to="/app/chat">Chat</AppLink>
        <AppLink to="/app/reports">Reports</AppLink>
      </nav>
    </section>
  );
}
