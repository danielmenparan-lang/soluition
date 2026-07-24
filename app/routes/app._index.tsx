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
      return { success: true, message: "ההמלצות מוכנות — תראה אותן למטה" };
    }
    if (intent === "refresh_segments") {
      await refreshSegments(shop.id);
      return { success: true, message: "קבוצות הלקוחות עודכנו" };
    }
    if (intent === "generate_report") {
      await generateWeeklyReport(shop.id);
      return { success: true, message: "סיכום השבוע מוכן" };
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
        {isGenerating ? "מכין המלצות..." : "קבל המלצות"}
      </SubmitButton>

      {isGenerating && (
        <s-section>
          <s-banner tone="info">
            <s-paragraph>
              <span className="ms-loading">בודק את הנתונים ומכין המלצות — זה לוקח כדקה...</span>
            </s-paragraph>
          </s-banner>
        </s-section>
      )}

      <SetupGuide
        shopDomain={shop.shop_domain}
        trackingId={shop.tracking_id}
        trackingScriptUrl={trackingScriptUrl}
        hasData={hasData}
        hasRecommendations={recommendationCount > 0}
      />

      <s-section heading="המספרים שלך — 30 יום אחרונים">
        {metrics ? (
          <div className="ms-metric-grid">
            <MetricCard label="מבקרים" value={metrics.totalVisitors} accent="brand" hint="אנשים שונים שנכנסו" />
            <MetricCard label="ביקורים" value={metrics.totalSessions} accent="info" hint="כמה פעמים נכנסו לחנות" />
            <MetricCard label="אחוז קונים" value={`${metrics.conversionRate}%`} accent="ai" hint="מבקרים שהפכו לקונים" />
            <MetricCard
              label="זמן ממוצע"
              value={`${Math.round(metrics.avgSessionDuration / 60)} דק'`}
              accent="warning"
              hint="כמה זמן נשארו בחנות"
            />
          </div>
        ) : (
          <EmptyState
            title="עדיין אין נתונים"
            description="קודם הדבק את שורת המעקב (למעלה) והיכנס לחנות פעם אחת. תוך דקות המספרים יופיעו כאן."
          />
        )}
      </s-section>

      <s-section heading="מה אפשר לעשות מכאן">
        <s-stack direction="inline" gap="base">
          <SubmitButton fetcher={fetcher} intent="generate_recommendations" variant="primary">
            {isGenerating ? "מכין..." : "קבל המלצות"}
          </SubmitButton>
          <SubmitButton fetcher={fetcher} intent="refresh_segments" variant="secondary">
            עדכן קבוצות
          </SubmitButton>
          <SubmitButton fetcher={fetcher} intent="generate_report" variant="secondary">
            סיכום שבועי
          </SubmitButton>
        </s-stack>
        <div className="ms-link-row">
          <AppLink to="/app/analytics">→ מה קורה בחנות</AppLink>
          <AppLink to="/app/recommendations">→ מה כדאי לעשות</AppLink>
          <AppLink to="/app/chat">→ שאל את העוזר</AppLink>
        </div>
      </s-section>

      <s-section heading="המלצות אחרונות">
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
            title="עדיין אין המלצות"
            description="לחץ «קבל המלצות» למעלה — המערכת תבדוק את הנתונים ותגיד לך מה כדאי לעשות."
            action={
              <SubmitButton fetcher={fetcher} intent="generate_recommendations">
                {isGenerating ? "מכין..." : "קבל המלצות עכשיו"}
              </SubmitButton>
            }
          />
        )}
      </s-section>

      {segments.length > 0 && (
        <s-section heading="קבוצות גדולות">
          <div className="ms-metric-grid">
            {segments.map((seg) => (
              <div key={seg.id} className="ms-card">
                <s-text type="strong">{seg.name}</s-text>
                <div className="ms-metric-value" style={{ fontSize: 22 }}>
                  {seg.member_count}
                </div>
                <s-text color="subdued">אנשים בקבוצה</s-text>
              </div>
            ))}
          </div>
          <div className="ms-link-row">
            <AppLink to="/app/segments">→ כל הקבוצות</AppLink>
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
