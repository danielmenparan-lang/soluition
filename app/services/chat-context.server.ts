import getSupabase from "../supabase.server";
import { prepareAnalyticsSummary } from "./analytics.server";
import { getSegments } from "./segmentation.server";
import { computeAttributionMetrics, findWastefulSources } from "./attribution.server";
import {
  hasAnalyticsData,
  isSparseAnalyticsData,
} from "../utils/format-chat-reply";

export type ChatStoreStage = "pre_traffic" | "early_traffic" | "growth";

async function loadRecommendations(shopId: string) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("ai_recommendations")
    .select("title, priority, category, description")
    .eq("shop_id", shopId)
    .eq("status", "active")
    .order("generated_at", { ascending: false })
    .limit(5);
  return data ?? [];
}

async function loadAttribution(shopId: string): Promise<string> {
  const supabase = getSupabase();
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: sessions } = await supabase
    .from("visitor_sessions")
    .select("traffic_source, converted, order_value")
    .eq("shop_id", shopId)
    .gte("started_at", since.toISOString());

  const metrics = computeAttributionMetrics(sessions ?? []);
  const wasteful = findWastefulSources(metrics);
  return JSON.stringify({ attribution: metrics, wastefulSources: wasteful }, null, 2);
}

export async function prepareChatContext(shopId: string): Promise<{
  analyticsSummary: string;
  stage: ChatStoreStage;
  segmentsJson: string;
  recommendationsJson: string;
  attributionJson: string;
}> {
  const [analyticsSummary, segments, recommendations, attributionJson] =
    await Promise.all([
      prepareAnalyticsSummary(shopId),
      getSegments(shopId).catch(() => []),
      loadRecommendations(shopId),
      loadAttribution(shopId).catch(() => "{}"),
    ]);

  let stage: ChatStoreStage = "growth";
  if (!hasAnalyticsData(analyticsSummary)) {
    stage = "pre_traffic";
  } else if (isSparseAnalyticsData(analyticsSummary)) {
    stage = "early_traffic";
  }

  const segmentsJson = JSON.stringify(
    segments.slice(0, 8).map((s) => ({
      name: s.name,
      members: s.member_count,
      criteria: s.criteria,
    })),
    null,
    2,
  );

  const recommendationsJson = JSON.stringify(recommendations, null, 2);

  return {
    analyticsSummary,
    stage,
    segmentsJson,
    recommendationsJson,
    attributionJson,
  };
}
