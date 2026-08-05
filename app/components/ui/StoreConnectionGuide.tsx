import { CopyCodeBlock } from "./CopyCodeBlock";
import { THEME_EMBED_NAME } from "../../config/theme-embed";
import { PUBLIC_APP_URL } from "../../config/public-app-url";

type StoreConnectionGuideProps = {
  themeEmbedUrl: string;
  themesAdminUrl: string;
  storefrontUrl: string;
  step: "embed" | "data" | "insight";
};

export function StoreConnectionGuide({
  themeEmbedUrl,
  themesAdminUrl,
  storefrontUrl,
  step,
}: StoreConnectionGuideProps) {
  if (step === "insight") {
    return (
      <div className="ms-connect-guide">
        <p className="ms-connect-note">
          After tracking works, tap <strong>Scan for my first action</strong> above.
        </p>
      </div>
    );
  }

  return (
    <div className="ms-connect-guide">
      {step === "embed" ? (
        <>
          <ol className="ms-connect-steps">
            <li>
              Click <strong>Enable {THEME_EMBED_NAME}</strong> above (opens Theme editor).
            </li>
            <li>
              Left sidebar → <strong>App embeds</strong> (puzzle icon) → turn on{" "}
              <strong>{THEME_EMBED_NAME}</strong>.
            </li>
            <li>
              Under embed settings, set <strong>App server URL</strong> to:
            </li>
          </ol>
          <CopyCodeBlock code={PUBLIC_APP_URL} label="App server URL (required):" />
          <p className="ms-connect-warning">
            If this field still shows <code>app.solution.com.im</code>, replace it with the URL
            above — the old domain does not work.
          </p>
          <ol className="ms-connect-steps ms-connect-steps-continue" start={4}>
            <li>
              Click <strong>Save</strong> in the theme editor (top right).
            </li>
          </ol>
          <details className="ms-connect-details">
            <summary>Don&apos;t see {THEME_EMBED_NAME}?</summary>
            <ul>
              <li>Use your <strong>live / published</strong> theme, not an old draft.</li>
              <li>
                Open{" "}
                <a href={themesAdminUrl} target="_blank" rel="noopener noreferrer">
                  Online Store → Themes
                </a>{" "}
                → Customize on the current theme.
              </li>
              <li>
                Still missing? Re-open Solution from Apps — the theme extension may need a minute
                after install.
              </li>
            </ul>
          </details>
        </>
      ) : null}

      {step === "data" ? (
        <>
          <ol className="ms-connect-steps">
            <li>
              Open your{" "}
              <a href={storefrontUrl} target="_blank" rel="noopener noreferrer">
                live storefront
              </a>{" "}
              (not the admin preview).
            </li>
            <li>Visit home, one product page, and cart or checkout.</li>
            <li>Return here and refresh — visitor count should increase within a minute.</li>
          </ol>
          <details className="ms-connect-details">
            <summary>Still 0 visitors?</summary>
            <ul>
              <li>
                <strong>Password protection:</strong> Online Store → Preferences → disable
                password or use a share link that bypasses it.
              </li>
              <li>
                Confirm <strong>{THEME_EMBED_NAME}</strong> is on and <strong>Saved</strong> on
                your published theme.
              </li>
              <li>
                App server URL must be{" "}
                <code>{PUBLIC_APP_URL}</code> — not <code>app.solution.com.im</code>.
              </li>
              <li>Try a private/incognito window on your storefront.</li>
            </ul>
          </details>
        </>
      ) : null}
    </div>
  );
}
