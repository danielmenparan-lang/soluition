import { THEME_EMBED_NAME } from "../../config/theme-embed";

type SetupBannerProps = {
  themeEmbedUrl: string;
  storefrontUrl: string;
  show: boolean;
};

/** Optional one-line nudge — never blocks the app */
export function SetupBanner({ themeEmbedUrl, storefrontUrl, show }: SetupBannerProps) {
  if (!show) return null;

  return (
    <aside className="ms-setup-banner" role="note">
      <p>
        <strong>Optional:</strong> turn on {THEME_EMBED_NAME} for visitor funnel data, then browse
        your store once.
      </p>
      <div className="ms-setup-banner-actions">
        <a
          href={themeEmbedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ms-btn ms-btn-secondary ms-btn-sm"
        >
          Theme editor
        </a>
        <a
          href={storefrontUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ms-text-link"
        >
          Open store
        </a>
      </div>
    </aside>
  );
}
