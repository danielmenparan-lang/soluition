import { useLoaderData } from "react-router";
import { getSupportEmail } from "../config/support.server";

export const loader = () => ({ supportEmail: getSupportEmail() });

export default function Privacy() {
  const { supportEmail } = useLoaderData<typeof loader>();

  return (
    <div className="ms-static-page">
      <h1>Privacy Policy — Solution</h1>
      <p className="ms-static-meta">Last updated: July 2026</p>

      <h2>What we collect</h2>
      <p>
        Solution collects visitor behavior on your storefront (page views, products
        viewed, cart activity, traffic source, device type, country) to provide
        analytics and AI recommendations inside Shopify Admin.
      </p>

      <h2>Cookies and local storage</h2>
      <p>
        Our storefront tracker stores anonymous visitor and session IDs in the
        browser localStorage and sessionStorage. These IDs are not Shopify customer
        accounts unless explicitly linked through a purchase event.
      </p>

      <h2>Third-party services</h2>
      <p>
        We use Supabase (database), Anthropic Claude (AI insights), and ip-api.com
        (approximate country from IP on the server). We do not sell visitor data.
      </p>

      <h2>How data is used</h2>
      <p>
        Data is used only to show dashboards, segments, recommendations, chat, and
        reports to merchants who installed the app.
      </p>

      <h2>Retention</h2>
      <p>
        Analytics data is kept while the app is installed. When you uninstall,
        shop data is deleted via Shopify GDPR webhooks within 30 days.
      </p>

      <h2>Billing</h2>
      <p>
        Paid plans are billed through Shopify. Free includes 1 scan and 1 AI output
        per month; Starter ($15/mo) includes 10 each; Unlimited ($29/mo) has no caps.
      </p>

      <h2>GDPR data requests</h2>
      <p>
        When a customer requests their data, we export linked visitor analytics and
        store it securely for the merchant to retrieve from app settings. Data is
        deleted on customer/shop redact webhooks.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy or support:{" "}
        <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
      </p>
    </div>
  );
}
