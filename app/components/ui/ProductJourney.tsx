import { AppLink } from "../AppLink";

type JourneyStep = {
  id: string;
  label: string;
  done: boolean;
  current: boolean;
};

type ProductJourneyProps = {
  hasTracking: boolean;
  hasData: boolean;
  hasRecommendations: boolean;
};

export function ProductJourney({
  hasTracking,
  hasData,
  hasRecommendations,
}: ProductJourneyProps) {
  const steps: JourneyStep[] = [
    {
      id: "track",
      label: "חיבור מעקב",
      done: hasTracking || hasData,
      current: !hasData,
    },
    {
      id: "data",
      label: "איסוף נתונים",
      done: hasData,
      current: hasTracking && !hasData,
    },
    {
      id: "insights",
      label: "קבלת המלצות",
      done: hasRecommendations,
      current: hasData && !hasRecommendations,
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const progress = Math.round((completed / steps.length) * 100);

  return (
    <div className="ms-journey">
      <div className="ms-journey-head">
        <div>
          <p className="ms-journey-kicker">המסלול שלך</p>
          <h2 className="ms-journey-title">
            {completed === steps.length
              ? "הכל מוכן — החנות שלך פעילה"
              : completed === 0
                ? "בוא נתחיל — 3 צעדים פשוטים"
                : `עוד ${steps.length - completed} צעדים ואתה בפנים`}
          </h2>
        </div>
        <div className="ms-journey-progress-ring" aria-hidden>
          <span>{progress}%</span>
        </div>
      </div>

      <div className="ms-journey-track">
        <div
          className="ms-journey-fill"
          style={{ width: `${Math.max(progress, 8)}%` }}
        />
      </div>

      <div className="ms-journey-steps">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`ms-journey-step ${step.done ? "is-done" : ""} ${step.current ? "is-current" : ""}`}
          >
            <div className="ms-journey-dot">{step.done ? "✓" : index + 1}</div>
            <span className="ms-journey-label">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type QuickNavItem = {
  to: string;
  title: string;
  desc: string;
  tone: "green" | "purple" | "blue" | "gold";
};

const NAV_ITEMS: QuickNavItem[] = [
  {
    to: "/app/recommendations",
    title: "מה כדאי לעשות",
    desc: "רשימת פעולות — מה לשפר קודם",
    tone: "green",
  },
  {
    to: "/app/analytics",
    title: "מה קורה בחנות",
    desc: "מי נכנס, מאיפה הגיע, מה צפה",
    tone: "blue",
  },
  {
    to: "/app/chat",
    title: "צ'אט",
    desc: "שאל שאלה — העוזר מנתח את הנתונים ועונה",
    tone: "purple",
  },
  {
    to: "/app/reports",
    title: "סיכום שבועי",
    desc: "מה השתנה השבוע ומה לעשות",
    tone: "gold",
  },
];

export function QuickNav() {
  return (
    <div className="ms-quick-nav">
      {NAV_ITEMS.map((item) => (
        <AppLink
          key={item.to}
          to={item.to}
          className={`ms-quick-card ms-quick-${item.tone}`}
        >
          <span className="ms-quick-title">{item.title}</span>
          <span className="ms-quick-desc">{item.desc}</span>
          <span className="ms-quick-arrow">←</span>
        </AppLink>
      ))}
    </div>
  );
}
