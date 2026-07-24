import type { ReactNode } from "react";

type SectionBlockProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function SectionBlock({ title, subtitle, children }: SectionBlockProps) {
  return (
    <section className="ms-section-block">
      <div className="ms-section-head">
        <h2 className="ms-section-title">{title}</h2>
        {subtitle ? <p className="ms-section-subtitle">{subtitle}</p> : null}
      </div>
      <div className="ms-section-body">{children}</div>
    </section>
  );
}
