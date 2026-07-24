import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
  ShouldRevalidateFunctionArgs,
} from "react-router";
import { useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useEffect } from "react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { useShopifyFetcher } from "../hooks/useShopifyFetcher";
import { SubmitButton } from "../components/SubmitButton";
import { AutoGenerateRecommendations } from "../components/AutoGenerateRecommendations";
import { getOrCreateShop } from "../services/shop.server";
import { getDashboardMetrics } from "../services/analytics.server";
import { getRecommendations } from "../services/ai.server";
import { getSegments } from "../services/segmentation.server";
import {
  generateRecommendations,
  generateWeeklyReport,
} from "../services/ai.server";
import { refreshSegments } from "../services/segmentation.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

  const [metrics, recommendations, segments] = await Promise.all([
    getDashboardMetrics(shop.id).catch(() => null),
    getRecommendations(shop.id).catch(() => []),
    getSegments(shop.id).catch(() => []),
  ]);

  return {
    shop,
    metrics,
    recommendations: recommendations.slice(0, 3),
    segments: segments.slice(0, 3),
    trackingScriptUrl: `${process.env.SHOPIFY_APP_URL}/tracker.js`,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "generate_recommendations") {
      await generateRecommendations(shop.id);
      return { success: true, message: "המלצות נוצרו בהצלחה" };
    }
    if (intent === "refresh_segments") {
      await refreshSegments(shop.id);
      return { success: true, message: "קהלים עודכנו בהצלחה" };
    }
    if (intent === "generate_report") {
      await generateWeeklyReport(shop.id);
      return { success: true, message: "דוח שבועי נוצר בהצלחה" };
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "הפעולה נכשלה";
    return { success: false, message };
  }

  return { success: false, message: "פעולה לא מוכרת" };
};

export default function Overview() {
  const { shop, metrics, recommendations, segments, trackingScriptUrl } =
    useLoaderData<typeof loader>();
  const fetcher = useShopifyFetcher<typeof action>();
  const shopify = useAppBridge();

  useEffect(() => {
    if (fetcher.data?.message) {
      shopify.toast.show(fetcher.data.message);
    }
  }, [fetcher.data, shopify]);

  return (
    <s-page heading="Marketing Solution — סקירה כללית">
      <AutoGenerateRecommendations
        fetcher={fetcher}
        hasRecommendations={recommendations.length > 0}
        intent="generate_recommendations"
      />
      <SubmitButton
        fetcher={fetcher}
        slot="primary-action"
        intent="generate_recommendations"
      >
        {fetcher.state !== "idle" ? "מעבד..." : "יצירת המלצות AI"}
      </SubmitButton>

      <s-section heading="פתיחה נכונה של האפליקציה">
        <s-banner tone="warning">
          <s-paragraph>
            אל תפתח כתובות <s-text type="strong">trycloudflare.com</s-text> — הן זמניות
            ונמחקות. פתח תמיד דרך Shopify Admin → Apps → solution.
          </s-paragraph>
        </s-banner>
        <s-paragraph>
          כתובת production:{" "}
          <s-text type="strong">https://shopify-marketing-solution.onrender.com</s-text>
        </s-paragraph>
      </s-section>

      <s-section heading="מזהה מעקב">
        <s-paragraph>
          הוסף את סקריפט המעקב לחנות שלך. Tracking ID:{" "}
          <s-text type="strong">{shop.tracking_id}</s-text>
        </s-paragraph>
        <s-box padding="base" background="subdued" borderRadius="base">
          <pre style={{ margin: 0, fontSize: "12px", direction: "ltr", textAlign: "left" }}>
            {`<script src="${trackingScriptUrl}" data-tracking-id="${shop.tracking_id}" async></script>`}
          </pre>
        </s-box>
      </s-section>

      {metrics && (
        <s-section heading="מדדים מרכזיים (30 יום)">
          <s-grid gridTemplateColumns="repeat(4, 1fr)" gap="base">
            <MetricCard label="מבקרים" value={metrics.totalVisitors} />
            <MetricCard label="Sessions" value={metrics.totalSessions} />
            <MetricCard
              label="Conversion Rate"
              value={`${metrics.conversionRate}%`}
            />
            <MetricCard
              label="זמן Session ממוצע"
              value={`${Math.round(metrics.avgSessionDuration / 60)}m`}
            />
          </s-grid>
        </s-section>
      )}

      <s-section heading="פעולות מהירות">
        <s-stack direction="inline" gap="base">
          <SubmitButton fetcher={fetcher} intent="generate_recommendations">
            Generate Recommendations
          </SubmitButton>
          <SubmitButton fetcher={fetcher} intent="refresh_segments">
            Refresh Segments
          </SubmitButton>
          <SubmitButton fetcher={fetcher} intent="generate_report">
            Generate Report
          </SubmitButton>
        </s-stack>
      </s-section>

      {recommendations.length === 0 && fetcher.state !== "idle" && (
        <s-section heading="יוצר המלצות AI">
          <s-paragraph>
            מושך נתונים מ-Supabase, שולח ל-Claude, ויוצר המלצות שיווק...
          </s-paragraph>
        </s-section>
      )}

      {recommendations.length > 0 && (
        <s-section heading="המלצות AI אחרונות">
          {recommendations.map((rec) => (
            <s-box key={rec.id} padding="base" borderWidth="base" borderRadius="base">
              <s-stack direction="block" gap="small">
                <s-text type="strong">{rec.title}</s-text>
                <s-badge tone={rec.priority === "high" ? "critical" : rec.priority === "medium" ? "warning" : "info"}>
                  {rec.priority}
                </s-badge>
                <s-paragraph>{rec.description}</s-paragraph>
              </s-stack>
            </s-box>
          ))}
        </s-section>
      )}

      {segments.length > 0 && (
        <s-section heading="קהלים">
          <s-grid gridTemplateColumns="repeat(3, 1fr)" gap="base">
            {segments.map((seg) => (
              <s-box key={seg.id} padding="base" background="subdued" borderRadius="base">
                <s-text type="strong">{seg.name}</s-text>
                <s-paragraph>{seg.member_count} חברים</s-paragraph>
              </s-box>
            ))}
          </s-grid>
        </s-section>
      )}
    </s-page>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <s-box padding="base" background="subdued" borderRadius="base">
      <s-text color="subdued">{label}</s-text>
      <s-heading>{String(value)}</s-heading>
    </s-box>
  );
}

export function shouldRevalidate({
  formAction,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  if (formAction) return true;
  return defaultShouldRevalidate;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
