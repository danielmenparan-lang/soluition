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
import { SegmentCard } from "../components/ui/SegmentCard";
import { HorizontalBarChart } from "../components/ui/HorizontalBarChart";
import { AppLink } from "../components/AppLink";
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
    return { success: true, message: "Segments updated from latest data." };
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
  const isRefreshing = fetcher.state !== "idle";

  return (
    <s-page heading="Segments">
      <PageHero title={help.title} subtitle={help.subtitle} variant="default" compact />
      <HelpPanel title={help.helpTitle} items={help.helpItems} />

      <SubmitButton fetcher={fetcher} slot="primary-action" intent="refresh_segments">
        {isRefreshing ? "Refreshing…" : "Refresh segments"}
      </SubmitButton>

      <s-section heading="Audience groups">
        {segments.length === 0 ? (
          <EmptyState
            icon="chart"
            title="No segments yet"
            description="Enable tracking on Home, browse your storefront, then refresh segments to group visitors by source, device, and country."
            action={
              <div className="ms-empty-actions-row">
                <AppLink to="/app" className="ms-btn ms-btn-secondary">
                  Go to Home
                </AppLink>
                <SubmitButton fetcher={fetcher} intent="refresh_segments">
                  {isRefreshing ? "Refreshing…" : "Refresh now"}
                </SubmitButton>
              </div>
            }
          />
        ) : (
          <div className="ms-segment-grid">
            {segments.map((seg) => (
              <SegmentCard
                key={seg.id}
                name={seg.name}
                description={seg.description}
                segmentType={seg.segment_type}
                memberCount={seg.member_count}
                refreshedAt={seg.refreshed_at}
              />
            ))}
          </div>
        )}
      </s-section>

      {(breakdown.byTrafficSource.length > 0 ||
        breakdown.byCountry.length > 0 ||
        breakdown.byDevice.length > 0) && (
        <s-section>
          <div className="ms-home-charts">
            {breakdown.byTrafficSource.length > 0 ? (
              <HorizontalBarChart
                title="Sessions by source"
                accent="#3d7ee8"
                items={breakdown.byTrafficSource.slice(0, 8).map((s) => ({
                  label: s.source,
                  value: s.count,
                }))}
              />
            ) : null}
            {breakdown.byCountry.length > 0 ? (
              <HorizontalBarChart
                title="Visitors by country"
                accent="#0a9b7a"
                items={breakdown.byCountry.slice(0, 8).map((c) => ({
                  label: c.country,
                  value: c.count,
                }))}
              />
            ) : null}
            {breakdown.byDevice.length > 0 ? (
              <HorizontalBarChart
                title="Visitors by device"
                accent="#6d5ef7"
                items={breakdown.byDevice.map((d) => ({
                  label: d.device,
                  value: d.count,
                }))}
              />
            ) : null}
          </div>
        </s-section>
      )}
    </s-page>
  );
}

export const headers = boundary.headers;
