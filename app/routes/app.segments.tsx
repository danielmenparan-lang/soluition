import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { useShopifyFetcher } from "../hooks/useShopifyFetcher";
import { useFetcherToast } from "../hooks/useFetcherToast";
import { SubmitButton } from "../components/SubmitButton";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHero } from "../components/ui/PageHero";
import { HelpPanel } from "../components/ui/HelpPanel";
import { PAGE_HELP } from "../config/page-help";
import { getOrCreateShop } from "../services/shop.server";
import {
  getSegments,
  getSegmentBreakdown,
  refreshSegments,
} from "../services/segmentation.server";
import {
  assertCanScan,
  recordScan,
  UsageLimitError,
} from "../services/usage.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

  const [segments, breakdown] = await Promise.all([
    getSegments(shop.id).catch(() => []),
    getSegmentBreakdown(shop.id).catch(() => ({
      byTrafficSource: [],
      byCountry: [],
      byDevice: [],
    })),
  ]);

  return { segments, breakdown };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

  try {
    await assertCanScan(shop.id);
    await refreshSegments(shop.id);
    await recordScan(shop.id);
    return { success: true, message: "Customer segments updated" };
  } catch (error) {
    if (error instanceof UsageLimitError) {
      return { success: false, message: error.message };
    }
    const message = error instanceof Error ? error.message : "Failed to refresh segments";
    return { success: false, message };
  }
};

export default function Segments() {
  const { segments, breakdown } = useLoaderData<typeof loader>();
  const fetcher = useShopifyFetcher<typeof action>();
  useFetcherToast(fetcher);
  const help = PAGE_HELP.segments;

  return (
    <s-page>
      <PageHero title={help.title} subtitle={help.subtitle} variant="default" compact />
      <HelpPanel title={help.helpTitle} items={help.helpItems} />

      <SubmitButton fetcher={fetcher} slot="primary-action">
        {fetcher.state !== "idle" ? "Refreshing..." : "Refresh segments"}
      </SubmitButton>

      <s-section heading="Your segments">
        {segments.length === 0 ? (
          <EmptyState
            title="No segments yet"
            description="Enable tracking first, then click Refresh segments."
            action={
              <SubmitButton fetcher={fetcher}>
                {fetcher.state !== "idle" ? "Refreshing..." : "Refresh segments"}
              </SubmitButton>
            }
          />
        ) : (
          <div className="ms-metric-grid">
            {segments.map((seg) => (
              <div key={seg.id} className="ms-card">
                <s-stack direction="block" gap="small">
                  <s-text type="strong">{seg.name}</s-text>
                  <s-badge>{seg.segment_type}</s-badge>
                  <s-paragraph>{seg.description}</s-paragraph>
                  <div className="ms-metric-value" style={{ fontSize: 24 }}>
                    {seg.member_count}
                  </div>
                  <s-text color="subdued">people in segment</s-text>
                  {seg.refreshed_at ? (
                    <s-text color="subdued">
                      Updated: {new Date(seg.refreshed_at).toLocaleDateString("en-US")}
                    </s-text>
                  ) : null}
                </s-stack>
              </div>
            ))}
          </div>
        )}
      </s-section>

      {breakdown.byTrafficSource.length > 0 && (
        <s-section heading="Traffic sources">
          <div className="ms-metric-grid">
            {breakdown.byTrafficSource.slice(0, 8).map((s) => (
              <div key={s.source} className="ms-card">
                <s-text type="strong">{s.source}</s-text>
                <s-paragraph>{s.count} sessions</s-paragraph>
              </div>
            ))}
          </div>
        </s-section>
      )}

      {breakdown.byCountry.length > 0 && (
        <s-section heading="By country">
          <div className="ms-metric-grid">
            {breakdown.byCountry.slice(0, 8).map((c) => (
              <div key={c.country} className="ms-card">
                <s-text type="strong">{c.country}</s-text>
                <s-paragraph>{c.count} visitors</s-paragraph>
              </div>
            ))}
          </div>
        </s-section>
      )}

      {breakdown.byDevice.length > 0 && (
        <s-section heading="By device">
          <div className="ms-metric-grid">
            {breakdown.byDevice.map((d) => (
              <div key={d.device} className="ms-card">
                <s-text type="strong">{d.device}</s-text>
                <s-paragraph>{d.count} visitors</s-paragraph>
              </div>
            ))}
          </div>
        </s-section>
      )}
    </s-page>
  );
}

export const headers = boundary.headers;
