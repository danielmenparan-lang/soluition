import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useEffect } from "react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getOrCreateShop } from "../services/shop.server";
import {
  generateRecommendations,
  getRecommendations,
} from "../services/ai.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const recommendations = await getRecommendations(shop.id);
  return { recommendations };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  await generateRecommendations(shop.id);
  return { success: true };
};

const CATEGORY_LABELS: Record<string, string> = {
  marketing: "שיווק",
  product: "מוצר",
  conversion: "Conversion",
  retargeting: "Retargeting",
};

export default function Recommendations() {
  const { recommendations } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();

  useEffect(() => {
    if (fetcher.data?.success) {
      shopify.toast.show("המלצות חדשות נוצרו");
    }
  }, [fetcher.data, shopify]);

  const grouped = recommendations.reduce(
    (acc, rec) => {
      const cat = rec.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(rec);
      return acc;
    },
    {} as Record<string, typeof recommendations>,
  );

  return (
    <s-page heading="המלצות AI">
      <s-button
        slot="primary-action"
        onClick={() => fetcher.submit({}, { method: "POST" })}
      >
        {fetcher.state !== "idle" ? "מייצר..." : "יצירת המלצות חדשות"}
      </s-button>

      {recommendations.length === 0 ? (
        <s-section>
          <s-paragraph>
            אין המלצות עדיין. לחץ על &quot;יצירת המלצות חדשות&quot; כדי שה-AI
            ינתח את נתוני החנות ויציע פעולות.
          </s-paragraph>
        </s-section>
      ) : (
        Object.entries(grouped).map(([category, recs]) => (
          <s-section key={category} heading={CATEGORY_LABELS[category] ?? category}>
            {recs.map((rec) => (
              <s-box
                key={rec.id}
                padding="base"
                borderWidth="base"
                borderRadius="base"
              >
                <s-stack direction="block" gap="small">
                  <s-stack direction="inline" gap="small">
                    <s-text type="strong">{rec.title}</s-text>
                    <s-badge
                      tone={
                        rec.priority === "high"
                          ? "critical"
                          : rec.priority === "medium"
                            ? "warning"
                            : "info"
                      }
                    >
                      {rec.priority}
                    </s-badge>
                  </s-stack>
                  <s-paragraph>{rec.description}</s-paragraph>
                  {rec.expected_impact && (
                    <s-text color="subdued">
                      Impact צפוי: {rec.expected_impact}
                    </s-text>
                  )}
                  {Array.isArray(rec.action_items) && rec.action_items.length > 0 && (
                    <s-unordered-list>
                      {(rec.action_items as string[]).map((item, i) => (
                        <s-list-item key={i}>{item}</s-list-item>
                      ))}
                    </s-unordered-list>
                  )}
                </s-stack>
              </s-box>
            ))}
          </s-section>
        ))
      )}
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
