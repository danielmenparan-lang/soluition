type SupportFooterProps = {
  email: string;
};

export function SupportFooter({ email }: SupportFooterProps) {
  return (
    <footer className="ms-support-footer">
      <div className="ms-support-inner">
        <div className="ms-support-block">
          <span className="ms-support-label">Questions? Email us:</span>
          <a className="ms-support-email" href={`mailto:${email}?subject=Solution%20Support`}>
            {email}
          </a>
        </div>
        <p className="ms-support-note">
          Typical response time: within 24 hours ·{" "}
          <a href="/privacy" target="_blank" rel="noopener noreferrer">
            Privacy policy
          </a>
        </p>
      </div>
    </footer>
  );
}
