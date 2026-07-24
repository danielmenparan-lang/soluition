type PageHeroProps = {
  title: string;
  subtitle: string;
  tips?: string[];
  variant?: "default" | "ai" | "analytics" | "reports";
};

const variantClass: Record<NonNullable<PageHeroProps["variant"]>, string> = {
  default: "ms-hero-default",
  ai: "ms-hero-ai",
  analytics: "ms-hero-analytics",
  reports: "ms-hero-reports",
};

export function PageHero({
  title,
  subtitle,
  tips,
  variant = "default",
}: PageHeroProps) {
  return (
    <div className={`ms-hero ${variantClass[variant]}`}>
      <div className="ms-hero-content">
        <h1 className="ms-hero-title">{title}</h1>
        <p className="ms-hero-subtitle">{subtitle}</p>
        {tips && tips.length > 0 ? (
          <ul className="ms-hero-tips">
            {tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
