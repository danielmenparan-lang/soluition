type SupportFooterProps = {
  email: string;
};

export function SupportFooter({ email }: SupportFooterProps) {
  return (
    <footer className="ms-support-footer">
      <div className="ms-support-inner">
        <div className="ms-support-block">
          <span className="ms-support-label">יש שאלה? כתוב לנו:</span>
          <a className="ms-support-email" href={`mailto:${email}?subject=Solution%20AI%20Support`}>
            {email}
          </a>
        </div>
        <p className="ms-support-note">
          זמן תגובה ממוצע: עד 24 שעות ·{" "}
          <a href="/privacy" target="_blank" rel="noopener noreferrer">
            מדיניות פרטיות
          </a>
        </p>
      </div>
    </footer>
  );
}
