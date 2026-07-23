export default function Privacy() {
  return (
    <div style={{ maxWidth: "720px", margin: "40px auto", padding: "24px", fontFamily: "system-ui, sans-serif", lineHeight: 1.6 }}>
      <h1>Privacy Policy — Marketing Solution</h1>
      <p>Last updated: July 2026</p>

      <h2>What we collect</h2>
      <p>
        Marketing Solution collects storefront visitor behavior (page views, product views,
        cart actions, traffic source, device type, country) to provide analytics and AI
        recommendations to merchants who install the app.
      </p>

      <h2>How we use data</h2>
      <p>
        Data is used solely to power merchant dashboards, audience segments, and marketing
        recommendations within the Shopify Admin app. We do not sell visitor data.
      </p>

      <h2>Data storage</h2>
      <p>
        Analytics data is stored in Supabase (PostgreSQL). Shopify OAuth session data is stored
        securely for app authentication.
      </p>

      <h2>Third parties</h2>
      <p>
        We use Anthropic Claude for AI-generated insights. Data sent to AI is aggregated store
        analytics, not raw customer PII.
      </p>

      <h2>Contact</h2>
      <p>
        For privacy questions contact the app developer via the Shopify App Store listing or
        your store admin support channel.
      </p>
    </div>
  );
}
