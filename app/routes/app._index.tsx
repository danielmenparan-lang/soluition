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
import { ProductJourney, QuickNav } from "../components/ui/ProductJourney";
import { SectionBlock } from "../components/ui/SectionBlock";
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

  return (
    <s-page>
      <PageHero
        title="Solution"
        subtitle="מנהל השיווק החכם שלך — פשוט, ברור, בתוך Shopify."
        variant="default"
        compact
      />

      <ProductJourney
        hasTracking={hasData}
        hasData={hasData}
        hasRecommendations={recommendationCount > 0}
      />

      <SubmitButton
        fetcher={fetcher}
        slot="primary-action"
        intent="generate_recommendations"
      >
        {isGenerating ? "מכין המלצות..." : "קבל המלצות"}
      </SubmitButton>

      {isGenerating && (
        <div className="ms-status-banner">
          <span className="ms-loading">בודק נתונים ומכין המלצות — רגע...</span>
        </div>
      )}

      <SetupGuide
        shopDomain={shop.shop_domain}
        trackingId={shop.tracking_id}
        trackingScriptUrl={trackingScriptUrl}
        hasData={hasData}
        hasRecommendations={recommendationCount > 0}
      />

      <SectionBlock title="המספרים שלך" subtitle="30 הימים האחרונים">
        {metrics && hasData ? (
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
            icon="chart"
            title="עדיין אין מספרים"
            description="אחרי שתפעיל מעקב ותבקר בחנות — המספרים יופיעו כאן אוטומטית."
          />
        )}
      </SectionBlock>

      <SectionBlock title="לאן ממשיכים?" subtitle="בחר מה שמתאים לך עכשיו">
        <QuickNav />
      </SectionBlock>

      {(recommendationCount > 0 || !hasData) && (
        <SectionBlock title="המלצות אחרונות">
          {recommendations.length > 0 ? (
            <div className="ms-stack">
              {recommendations.map((rec) => (
                <RecommendationCard key={rec.id} rec={rec} />
              ))}
              {recommendationCount > 3 ? (
                <AppLink to="/app/recommendations" className="ms-text-link">
                  צפה בכל {recommendationCount} ההמלצות →
                </AppLink>
              ) : null}
            </div>
          ) : (
            <EmptyState
              icon="spark"
              title="עדיין אין המלצות"
              description="לחץ «קבל המלצות» למעלה כשיהיו נתונים."
              action={
                <SubmitButton fetcher={fetcher} intent="generate_recommendations">
                  {isGenerating ? "מכין..." : "קבל המלצות"}
                </SubmitButton>
              }
            />
          )}
        </SectionBlock>
      )}

      {segments.length > 0 && (
        <SectionBlock title="קבוצות גדולות" subtitle="לפי מקור תנועה ומכשיר">
          <div className="ms-metric-grid">
            {segments.map((seg) => (
              <div key={seg.id} className="ms-card ms-card-soft">
                <s-text type="strong">{seg.name}</s-text>
                <div className="ms-metric-value">{seg.member_count}</div>
                <s-text color="subdued">אנשים בקבוצה</s-text>
              </div>
            ))}
          </div>
          <AppLink to="/app/segments" className="ms-text-link">
            → כל הקבוצות
          </AppLink>
        </SectionBlock>
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
