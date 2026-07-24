import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useEffect } from "react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { useShopifyFetcher } from "../hooks/useShopifyFetcher";
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
    getSegments(shop.id),
    getSegmentBreakdown(shop.id),
  ]);

  return { segments, breakdown };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  await refreshSegments(shop.id);
  return { success: true };
};

export default function Segments() {
  const { segments, breakdown } = useLoaderData<typeof loader>();
  const fetcher = useShopifyFetcher<typeof action>();
  const shopify = useAppBridge();

  useEffect(() => {
    if (fetcher.data?.success) {
      shopify.toast.show("קהלים עודכנו בהצלחה");
    }
  }, [fetcher.data, shopify]);

  return (
    <s-page heading="קהלים (Segments)">
      <s-button
        slot="primary-action"
        onClick={() => fetcher.submit({}, { method: "POST" })}
      >
        {fetcher.state !== "idle" ? "מעדכן..." : "רענון קהלים"}
      </s-button>

      <s-section heading="קהלים אוטומטיים">
        <s-grid gridTemplateColumns="repeat(3, 1fr)" gap="base">
          {segments.map((seg) => (
            <s-box key={seg.id} padding="base" borderWidth="base" borderRadius="base">
              <s-stack direction="block" gap="small">
                <s-text type="strong">{seg.name}</s-text>
                <s-badge>{seg.segment_type}</s-badge>
                <s-paragraph>{seg.description}</s-paragraph>
                <s-heading>{seg.member_count}</s-heading>
                <s-text color="subdued">חברים בקהל</s-text>
                {seg.refreshed_at && (
                  <s-text color="subdued">
                    עודכן: {new Date(seg.refreshed_at).toLocaleDateString("he-IL")}
                  </s-text>
                )}
              </s-stack>
            </s-box>
          ))}
        </s-grid>
      </s-section>

      <s-section heading="פילוח לפי מקור תנועה">
        <s-grid gridTemplateColumns="repeat(4, 1fr)" gap="base">
          {breakdown.byTrafficSource.slice(0, 8).map((s) => (
            <s-box key={s.source} padding="base" background="subdued" borderRadius="base">
              <s-text type="strong">{s.source}</s-text>
              <s-paragraph>{s.count} sessions</s-paragraph>
            </s-box>
          ))}
        </s-grid>
      </s-section>

      <s-section heading="פילוח לפי מדינה">
        <s-grid gridTemplateColumns="repeat(4, 1fr)" gap="base">
          {breakdown.byCountry.slice(0, 8).map((c) => (
            <s-box key={c.country} padding="base" background="subdued" borderRadius="base">
              <s-text type="strong">{c.country}</s-text>
              <s-paragraph>{c.count} מבקרים</s-paragraph>
            </s-box>
          ))}
        </s-grid>
      </s-section>

      <s-section heading="פילוח לפי מכשיר">
        <s-grid gridTemplateColumns="repeat(3, 1fr)" gap="base">
          {breakdown.byDevice.map((d) => (
            <s-box key={d.device} padding="base" background="subdued" borderRadius="base">
              <s-text type="strong">{d.device}</s-text>
              <s-paragraph>{d.count} מבקרים</s-paragraph>
            </s-box>
          ))}
        </s-grid>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
