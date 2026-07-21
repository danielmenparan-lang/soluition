import type { TrafficSource } from "../types/database.types";

const SOURCE_PATTERNS: Record<TrafficSource, RegExp[]> = {
  google: [/google\./i, /googleads/i, /gclid/i],
  facebook: [/facebook\./i, /fb\./i, /fbclid/i],
  instagram: [/instagram\./i, /ig\./i],
  tiktok: [/tiktok\./i, /ttclid/i],
  email: [/mail\./i, /email/i, /newsletter/i],
  direct: [],
  other: [],
};

export function resolveTrafficSource(params: {
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
}): TrafficSource {
  const utm = (params.utmSource ?? "").toLowerCase();
  const medium = (params.utmMedium ?? "").toLowerCase();
  const referrer = (params.referrer ?? "").toLowerCase();

  if (utm.includes("google") || referrer.includes("google")) return "google";
  if (utm.includes("facebook") || utm.includes("fb")) return "facebook";
  if (utm.includes("instagram") || utm.includes("ig")) return "instagram";
  if (utm.includes("tiktok")) return "tiktok";
  if (utm.includes("email") || medium === "email") return "email";

  if (!referrer && !utm) return "direct";

  for (const [source, patterns] of Object.entries(SOURCE_PATTERNS)) {
    if (source === "direct" || source === "other") continue;
    if (patterns.some((p) => p.test(referrer) || p.test(utm))) {
      return source as TrafficSource;
    }
  }

  return "other";
}

export interface AttributionMetrics {
  source: string;
  sessions: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
}

export function computeAttributionMetrics(
  sessions: Array<{
    traffic_source: string | null;
    converted: boolean;
    order_value: number | null;
  }>,
): AttributionMetrics[] {
  const map = new Map<
    string,
    { sessions: number; conversions: number; revenue: number }
  >();

  for (const s of sessions) {
    const source = s.traffic_source ?? "direct";
    const current = map.get(source) ?? {
      sessions: 0,
      conversions: 0,
      revenue: 0,
    };
    current.sessions += 1;
    if (s.converted) {
      current.conversions += 1;
      current.revenue += Number(s.order_value ?? 0);
    }
    map.set(source, current);
  }

  return Array.from(map.entries())
    .map(([source, data]) => ({
      source,
      sessions: data.sessions,
      conversions: data.conversions,
      revenue: Math.round(data.revenue * 100) / 100,
      conversionRate:
        data.sessions > 0
          ? Math.round((data.conversions / data.sessions) * 10000) / 100
          : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function findWastefulSources(
  metrics: AttributionMetrics[],
  minSessions = 50,
): AttributionMetrics[] {
  const avgConversionRate =
    metrics.reduce((sum, m) => sum + m.conversionRate, 0) /
    (metrics.length || 1);

  return metrics.filter(
    (m) => m.sessions >= minSessions && m.conversionRate < avgConversionRate * 0.5,
  );
}

export function findTopRevenueSource(
  metrics: AttributionMetrics[],
): AttributionMetrics | null {
  if (metrics.length === 0) return null;
  return metrics.reduce((best, m) => (m.revenue > best.revenue ? m : best));
}
