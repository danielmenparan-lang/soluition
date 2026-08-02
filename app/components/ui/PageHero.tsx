type PageHeroProps = {
  title: string;
  subtitle: string;
  tips?: string[];
  variant?: "default" | "ai" | "analytics" | "reports";
  compact?: boolean;
};

export function PageHero({ title, subtitle, tips, compact = false }: PageHeroProps) {
  return (
    <header className={`ms-page-header ${compact ? "ms-page-header-compact" : ""}`}>
      <h1 className="ms-page-header-title">{title}</h1>
      <p className="ms-page-header-sub">{subtitle}</p>
      {!compact && tips && tips.length > 0 ? (
        <ul className="ms-page-header-tips">
          {tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      ) : null}
    </header>
  );
}
