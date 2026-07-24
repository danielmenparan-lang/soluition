import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
  ShouldRevalidateFunctionArgs,
} from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { useShopifyFetcher } from "../hooks/useShopifyFetcher";
import { useFetcherToast } from "../hooks/useFetcherToast";
import { SubmitButton } from "../components/SubmitButton";
import { AppLink } from "../components/AppLink";
import { MetricCard } from "../components/ui/MetricCard";
import { SetupGuide } from "../components/ui/SetupGuide";
import { RecommendationCard } from "../components/ui/RecommendationCard";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHero } from "../components/ui/PageHero";
import { HelpPanel } from "../components/ui/HelpPanel";
import { PAGE_HELP } from "../config/page-help";
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
    recommendationCount: recommendations.length,
    segments: segments.slice(0, 3),
    trackingScriptUrl: process.env.SHOPIFY_APP_URL
      ? `${process.env.SHOPIFY_APP_URL}/tracker.js`
      : "/tracker.js",
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
      return { success: true, message: "המלצות AI נוצרו בהצלחה" };
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
  const {
    shop,
    metrics,
    recommendations,
    recommendationCount,
    segments,
    trackingScriptUrl,
  } = useLoaderData<typeof loader>();
  const fetcher = useShopifyFetcher<typeof action>();
  const isGenerating = fetcher.state !== "idle";

  useFetcherToast(fetcher);

  const hasData = Boolean(metrics && metrics.totalVisitors > 0);
  const help = PAGE_HELP.overview;

  return (
    <s-page>
      <PageHero
        title={help.title}
        subtitle={help.subtitle}
        tips={help.tips}
        variant="default"
      />
      <HelpPanel title={help.helpTitle} items={help.helpItems} />

      <SubmitButton
        fetcher={fetcher}
        slot="primary-action"
        intent="generate_recommendations"
      >
        {isGenerating ? "מייצר המלצות..." : "יצירת המלצות AI"}
      </SubmitButton>

      {isGenerating && (
        <s-section>
          <s-banner tone="info">
            <s-paragraph>
              <span className="ms-loading">⏳ מושך נתונים → שולח ל-Claude → שומר המלצות...</span>
            </s-paragraph>
          </s-banner>
        </s-section>
      )}

      <SetupGuide
        trackingId={shop.tracking_id}
        trackingScriptUrl={trackingScriptUrl}
        hasData={hasData}
        hasRecommendations={recommendationCount > 0}
      />

      <s-section heading="מדדים מרכזיים — 30 יום אחרונים">
        {metrics ? (
          <div className="ms-metric-grid">
            <MetricCard label="מבקרים" value={metrics.totalVisitors} accent="brand" hint="גולשים ייחודיים" />
            <MetricCard label="Sessions" value={metrics.totalSessions} accent="info" hint="ביקורים" />
            <MetricCard label="שיעור המרה" value={`${metrics.conversionRate}%`} accent="ai" hint="רכישות / sessions" />
            <MetricCard
              label="זמן ממוצע"
              value={`${Math.round(metrics.avgSessionDuration / 60)} דק'`}
              accent="warning"
              hint="משך session"
            />
          </div>
        ) : (
          <EmptyState
            title="אין נתונים עדיין"
            description="התקן את סקריפט המעקב ובקר בחנות — הנתונים יופיעו כאן תוך דקות."
          />
        )}
      </s-section>

      <s-section heading="פעולות מהירות">
        <s-stack direction="inline" gap="base">
          <SubmitButton fetcher={fetcher} intent="generate_recommendations" variant="primary">
            {isGenerating ? "מעבד..." : "המלצות AI"}
          </SubmitButton>
          <SubmitButton fetcher={fetcher} intent="refresh_segments" variant="secondary">
            רענון קהלים
          </SubmitButton>
          <SubmitButton fetcher={fetcher} intent="generate_report" variant="secondary">
            דוח שבועי
          </SubmitButton>
        </s-stack>
        <div className="ms-link-row">
          <AppLink to="/app/analytics">→ אנליטיקה מלאה</AppLink>
          <AppLink to="/app/recommendations">→ כל ההמלצות</AppLink>
          <AppLink to="/app/chat">→ צ'אט AI</AppLink>
        </div>
      </s-section>

      <s-section heading="המלצות AI אחרונות">
        {recommendations.length > 0 ? (
          <s-stack direction="block" gap="base">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.id} rec={rec} />
            ))}
            {recommendationCount > 3 ? (
              <AppLink to="/app/recommendations">
                צפה בכל {recommendationCount} ההמלצות →
              </AppLink>
            ) : null}
          </s-stack>
        ) : (
          <EmptyState
            title="אין המלצות עדיין"
            description="המערכת תיצור המלצות אוטומטית, או לחץ 'יצירת המלצות AI' למעלה."
            action={
              <SubmitButton fetcher={fetcher} intent="generate_recommendations">
                {isGenerating ? "מייצר..." : "יצירת המלצות עכשיו"}
              </SubmitButton>
            }
          />
        )}
      </s-section>

      {segments.length > 0 && (
        <s-section heading="קהלים מובילים">
          <div className="ms-metric-grid">
            {segments.map((seg) => (
              <div key={seg.id} className="ms-card">
                <s-text type="strong">{seg.name}</s-text>
                <div className="ms-metric-value" style={{ fontSize: 22 }}>
                  {seg.member_count}
                </div>
                <s-text color="subdued">חברים בקהל</s-text>
              </div>
            ))}
          </div>
          <div className="ms-link-row">
            <AppLink to="/app/segments">→ כל הקהלים</AppLink>
          </div>
        </s-section>
      )}
    </s-page>
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
