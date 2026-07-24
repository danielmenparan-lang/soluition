import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
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
    await refreshSegments(shop.id);
    return { success: true, message: "קבוצות הלקוחות עודכנו" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "רענון קהלים נכשל";
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
      <PageHero
        title={help.title}
        subtitle={help.subtitle}
        tips={help.tips}
        variant="default"
      />
      <HelpPanel title={help.helpTitle} items={help.helpItems} />

      <SubmitButton fetcher={fetcher} slot="primary-action">
        {fetcher.state !== "idle" ? "מעדכן..." : "עדכן קבוצות"}
      </SubmitButton>

      <s-section heading="הקבוצות שלך">
        {segments.length === 0 ? (
          <EmptyState
            title="עדיין אין קבוצות"
            description="קודם ודא שיש מעקב פעיל בחנות, ואז לחץ «עדכן קבוצות»."
            action={
              <SubmitButton fetcher={fetcher}>
                {fetcher.state !== "idle" ? "מעדכן..." : "עדכן קבוצות"}
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
                  <s-text color="subdued">אנשים בקבוצה</s-text>
                  {seg.refreshed_at ? (
                    <s-text color="subdued">
                      עודכן: {new Date(seg.refreshed_at).toLocaleDateString("he-IL")}
                    </s-text>
                  ) : null}
                </s-stack>
              </div>
            ))}
          </div>
        )}
      </s-section>

      {breakdown.byTrafficSource.length > 0 && (
        <s-section heading="מאיפה הגיעו">
          <div className="ms-metric-grid">
            {breakdown.byTrafficSource.slice(0, 8).map((s) => (
              <div key={s.source} className="ms-card">
                <s-text type="strong">{s.source}</s-text>
                <s-paragraph>{s.count} ביקורים</s-paragraph>
              </div>
            ))}
          </div>
        </s-section>
      )}

      {breakdown.byCountry.length > 0 && (
        <s-section heading="פילוח לפי מדינה">
          <div className="ms-metric-grid">
            {breakdown.byCountry.slice(0, 8).map((c) => (
              <div key={c.country} className="ms-card">
                <s-text type="strong">{c.country}</s-text>
                <s-paragraph>{c.count} מבקרים</s-paragraph>
              </div>
            ))}
          </div>
        </s-section>
      )}

      {breakdown.byDevice.length > 0 && (
        <s-section heading="פילוח לפי מכשיר">
          <div className="ms-metric-grid">
            {breakdown.byDevice.map((d) => (
              <div key={d.device} className="ms-card">
                <s-text type="strong">{d.device}</s-text>
                <s-paragraph>{d.count} מבקרים</s-paragraph>
              </div>
            ))}
          </div>
        </s-section>
      )}
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
