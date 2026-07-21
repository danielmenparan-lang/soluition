import getSupabase from "../supabase.server";
import {
  computeAttributionMetrics,
  type AttributionMetrics,
} from "./attribution.server";
import { getProductMetrics, type ProductMetrics } from "./product-intelligence.server";

export interface DashboardMetrics {
  totalVisitors: number;
  totalSessions: number;
  totalEvents: number;
  conversionRate: number;
  avgSessionDuration: number;
  abandonmentRate: number;
  topTrafficSources: AttributionMetrics[];
  topProducts: ProductMetrics[];
  topCountries: Array<{ country: string; count: number }>;
  peakConversionHours: Array<{ hour: number; conversions: number }>;
}

export async function getDashboardMetrics(
  shopId: string,
  days = 30,
): Promise<DashboardMetrics> {
  const supabase = getSupabase();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString();

  const [
    { count: totalVisitors },
    { count: totalSessions },
    { count: totalEvents },
    { data: sessions },
    { data: visitors },
    { data: events },
  ] = await Promise.all([
    supabase
      .from("visitors")
      .select("*", { count: "exact", head: true })
      .eq("shop_id", shopId)
      .gte("last_seen_at", sinceIso),
    supabase
      .from("visitor_sessions")
      .select("*", { count: "exact", head: true })
      .eq("shop_id", shopId)
      .gte("started_at", sinceIso),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("shop_id", shopId)
      .gte("created_at", sinceIso),
    supabase
      .from("visitor_sessions")
      .select("traffic_source, converted, order_value, duration_seconds, started_at")
      .eq("shop_id", shopId)
      .gte("started_at", sinceIso),
    supabase
      .from("visitors")
      .select("country")
      .eq("shop_id", shopId)
      .gte("last_seen_at", sinceIso)
      .not("country", "is", null),
    supabase
      .from("events")
      .select("event_type, created_at")
      .eq("shop_id", shopId)
      .gte("created_at", sinceIso),
  ]);

  const sessionList = sessions ?? [];
  const converted = sessionList.filter((s) => s.converted).length;
  const conversionRate =
    sessionList.length > 0
      ? Math.round((converted / sessionList.length) * 10000) / 100
      : 0;

  const durations = sessionList
    .map((s) => s.duration_seconds ?? 0)
    .filter((d) => d > 0);
  const avgSessionDuration =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

  const checkoutStarts =
    events?.filter((e) => e.event_type === "checkout_start").length ?? 0;
  const purchases =
    events?.filter((e) => e.event_type === "purchase").length ?? 0;
  const abandonmentRate =
    checkoutStarts > 0
      ? Math.round(((checkoutStarts - purchases) / checkoutStarts) * 10000) / 100
      : 0;

  const countryMap = new Map<string, number>();
  for (const v of visitors ?? []) {
    if (v.country) {
      countryMap.set(v.country, (countryMap.get(v.country) ?? 0) + 1);
    }
  }

  const hourMap = new Map<number, number>();
  for (const s of sessionList.filter((s) => s.converted)) {
    const hour = new Date(s.started_at).getHours();
    hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1);
  }

  const topProducts = await getProductMetrics(shopId, days);

  return {
    totalVisitors: totalVisitors ?? 0,
    totalSessions: totalSessions ?? 0,
    totalEvents: totalEvents ?? 0,
    conversionRate,
    avgSessionDuration,
    abandonmentRate,
    topTrafficSources: computeAttributionMetrics(sessionList),
    topProducts: topProducts.slice(0, 10),
    topCountries: Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    peakConversionHours: Array.from(hourMap.entries())
      .map(([hour, conversions]) => ({ hour, conversions }))
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, 5),
  };
}

export async function getHighBouncePages(
  shopId: string,
  days = 30,
  limit = 10,
): Promise<Array<{ url: string; pageTitle: string | null; exitCount: number }>> {
  const supabase = getSupabase();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data } = await supabase
    .from("page_views")
    .select("url, page_title, is_exit")
    .eq("shop_id", shopId)
    .gte("viewed_at", since.toISOString())
    .eq("is_exit", true);

  const map = new Map<string, { pageTitle: string | null; exitCount: number }>();
  for (const pv of data ?? []) {
    const existing = map.get(pv.url) ?? { pageTitle: pv.page_title, exitCount: 0 };
    existing.exitCount += 1;
    map.set(pv.url, existing);
  }

  return Array.from(map.entries())
    .map(([url, info]) => ({ url, ...info }))
    .sort((a, b) => b.exitCount - a.exitCount)
    .slice(0, limit);
}

export async function prepareAnalyticsSummary(
  shopId: string,
  days = 30,
): Promise<string> {
  const metrics = await getDashboardMetrics(shopId, days);
  const bouncePages = await getHighBouncePages(shopId, days, 5);

  return JSON.stringify(
    {
      period: `Last ${days} days`,
      metrics: {
        totalVisitors: metrics.totalVisitors,
        totalSessions: metrics.totalSessions,
        totalEvents: metrics.totalEvents,
        conversionRate: `${metrics.conversionRate}%`,
        avgSessionDuration: `${metrics.avgSessionDuration}s`,
        abandonmentRate: `${metrics.abandonmentRate}%`,
      },
      topTrafficSources: metrics.topTrafficSources.slice(0, 5),
      topProducts: metrics.topProducts.slice(0, 10).map((p) => ({
        title: p.productTitle,
        views: p.views,
        purchases: p.purchases,
        conversionRate: `${p.conversionRate}%`,
        revenue: p.revenue,
      })),
      topCountries: metrics.topCountries.slice(0, 5),
      peakConversionHours: metrics.peakConversionHours,
      highBouncePages: bouncePages,
    },
    null,
    2,
  );
}
