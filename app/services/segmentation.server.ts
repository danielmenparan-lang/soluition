import getSupabase from "../supabase.server";
import type { Segment, SegmentType } from "../types/database.types";

const DEFAULT_SEGMENTS: Array<{
  name: string;
  slug: string;
  description: string;
  segment_type: SegmentType;
}> = [
  {
    name: "High Intent Visitors",
    slug: "high_intent",
    description: "Visitors who viewed 3+ products, added to cart, or spent 3+ minutes",
    segment_type: "high_intent",
  },
  {
    name: "Window Shoppers",
    slug: "window_shoppers",
    description: "Visitors who browsed but took no meaningful action",
    segment_type: "window_shoppers",
  },
  {
    name: "Returning Customers",
    slug: "returning_customers",
    description: "Visitors who have returned to the store multiple times",
    segment_type: "returning_customers",
  },
  {
    name: "Facebook Mobile Visitors",
    slug: "facebook_mobile",
    description: "Mobile visitors arriving from Facebook ads or social",
    segment_type: "facebook_mobile",
  },
  {
    name: "Google Desktop Shoppers",
    slug: "google_desktop",
    description: "Desktop visitors arriving from Google search or ads",
    segment_type: "google_desktop",
  },
  {
    name: "TikTok Traffic",
    slug: "tiktok_traffic",
    description: "Visitors arriving from TikTok campaigns or organic links",
    segment_type: "tiktok_traffic",
  },
  {
    name: "International Visitors",
    slug: "international",
    description: "Visitors from outside the store's primary country",
    segment_type: "international",
  },
];

export async function ensureDefaultSegments(shopId: string): Promise<void> {
  const supabase = getSupabase();

  for (const seg of DEFAULT_SEGMENTS) {
    await supabase.from("segments").upsert(
      {
        shop_id: shopId,
        name: seg.name,
        slug: seg.slug,
        description: seg.description,
        segment_type: seg.segment_type,
      },
      { onConflict: "shop_id,slug" },
    );
  }
}

export async function refreshSegments(shopId: string): Promise<Segment[]> {
  const supabase = getSupabase();
  await ensureDefaultSegments(shopId);

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: segments } = await supabase
    .from("segments")
    .select("*")
    .eq("shop_id", shopId);

  for (const segment of segments ?? []) {
    const memberIds = await computeSegmentMembers(shopId, segment.segment_type, since);
    await supabase
      .from("segment_members")
      .delete()
      .eq("segment_id", segment.id);

    if (memberIds.length > 0) {
      await supabase.from("segment_members").insert(
        memberIds.map((visitorUuid) => ({
          segment_id: segment.id,
          visitor_uuid: visitorUuid,
        })),
      );
    }

    await supabase
      .from("segments")
      .update({
        member_count: memberIds.length,
        refreshed_at: new Date().toISOString(),
      })
      .eq("id", segment.id);
  }

  const { data: updated } = await supabase
    .from("segments")
    .select("*")
    .eq("shop_id", shopId)
    .order("member_count", { ascending: false });

  return updated ?? [];
}

async function getPrimaryCountry(shopId: string, since: Date): Promise<string | null> {
  const supabase = getSupabase();
  const { data: visitors } = await supabase
    .from("visitors")
    .select("country")
    .eq("shop_id", shopId)
    .gte("last_seen_at", since.toISOString())
    .not("country", "is", null);

  const counts = new Map<string, number>();
  for (const visitor of visitors ?? []) {
    if (!visitor.country) continue;
    counts.set(visitor.country, (counts.get(visitor.country) ?? 0) + 1);
  }

  let primaryCountry: string | null = null;
  let maxCount = 0;
  for (const [country, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      primaryCountry = country;
    }
  }

  return primaryCountry;
}

async function getVisitorsByTrafficAndDevice(
  shopId: string,
  since: Date,
  trafficSource: string,
  deviceType?: string,
): Promise<string[]> {
  const supabase = getSupabase();
  const { data: sessions } = await supabase
    .from("visitor_sessions")
    .select("visitor_uuid")
    .eq("shop_id", shopId)
    .eq("traffic_source", trafficSource)
    .gte("started_at", since.toISOString());

  const visitorIds = [...new Set((sessions ?? []).map((s) => s.visitor_uuid))];
  if (visitorIds.length === 0) return [];

  if (!deviceType) {
    return visitorIds;
  }

  const matched: string[] = [];
  for (let i = 0; i < visitorIds.length; i += 100) {
    const chunk = visitorIds.slice(i, i + 100);
    const { data: visitors } = await supabase
      .from("visitors")
      .select("id")
      .in("id", chunk)
      .eq("device_type", deviceType);

    matched.push(...(visitors ?? []).map((v) => v.id));
  }

  return matched;
}

async function computeSegmentMembers(
  shopId: string,
  segmentType: string,
  since: Date,
): Promise<string[]> {
  const supabase = getSupabase();

  if (segmentType === "returning_customers") {
    const { data } = await supabase
      .from("visitors")
      .select("id")
      .eq("shop_id", shopId)
      .eq("is_returning", true)
      .gte("last_seen_at", since.toISOString());
    return (data ?? []).map((v) => v.id);
  }

  if (segmentType === "facebook_mobile") {
    return getVisitorsByTrafficAndDevice(shopId, since, "facebook", "mobile");
  }

  if (segmentType === "google_desktop") {
    return getVisitorsByTrafficAndDevice(shopId, since, "google", "desktop");
  }

  if (segmentType === "tiktok_traffic") {
    return getVisitorsByTrafficAndDevice(shopId, since, "tiktok");
  }

  if (segmentType === "international") {
    const primaryCountry = await getPrimaryCountry(shopId, since);
    if (!primaryCountry) return [];

    const { data } = await supabase
      .from("visitors")
      .select("id")
      .eq("shop_id", shopId)
      .gte("last_seen_at", since.toISOString())
      .not("country", "is", null)
      .neq("country", primaryCountry);

    return (data ?? []).map((v) => v.id);
  }

  if (segmentType === "window_shoppers") {
    const { data: visitors } = await supabase
      .from("visitors")
      .select("id")
      .eq("shop_id", shopId)
      .gte("last_seen_at", since.toISOString());

    const windowShoppers: string[] = [];
    for (const v of visitors ?? []) {
      const { count } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("visitor_uuid", v.id)
        .in("event_type", ["add_to_cart", "checkout_start", "purchase"]);

      if ((count ?? 0) === 0) {
        const { count: viewCount } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("visitor_uuid", v.id)
          .eq("event_type", "product_view");

        if ((viewCount ?? 0) >= 2) {
          windowShoppers.push(v.id);
        }
      }
    }
    return windowShoppers;
  }

  if (segmentType === "high_intent") {
    const highIntent: string[] = [];
    const { data: visitors } = await supabase
      .from("visitors")
      .select("id")
      .eq("shop_id", shopId)
      .gte("last_seen_at", since.toISOString());

    for (const v of visitors ?? []) {
      const { count: productViews } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("visitor_uuid", v.id)
        .eq("event_type", "product_view");

      const { count: cartAdds } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("visitor_uuid", v.id)
        .eq("event_type", "add_to_cart");

      const { data: sessions } = await supabase
        .from("visitor_sessions")
        .select("duration_seconds")
        .eq("visitor_uuid", v.id)
        .gte("started_at", since.toISOString());

      const maxDuration = Math.max(
        ...(sessions ?? []).map((s) => s.duration_seconds ?? 0),
        0,
      );

      if ((productViews ?? 0) >= 3 || (cartAdds ?? 0) >= 1 || maxDuration >= 180) {
        highIntent.push(v.id);
      }
    }
    return highIntent;
  }

  return [];
}

export async function getSegments(shopId: string): Promise<Segment[]> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("segments")
    .select("*")
    .eq("shop_id", shopId)
    .order("member_count", { ascending: false });
  return data ?? [];
}

export async function getSegmentBreakdown(shopId: string) {
  const supabase = getSupabase();
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [{ data: visitors }, { data: sessions }] = await Promise.all([
    supabase
      .from("visitors")
      .select("country, device_type")
      .eq("shop_id", shopId)
      .gte("last_seen_at", since.toISOString()),
    supabase
      .from("visitor_sessions")
      .select("traffic_source")
      .eq("shop_id", shopId)
      .gte("started_at", since.toISOString()),
  ]);

  const byCountry = new Map<string, number>();
  const byDevice = new Map<string, number>();
  const byTrafficSource = new Map<string, number>();

  for (const v of visitors ?? []) {
    if (v.country) byCountry.set(v.country, (byCountry.get(v.country) ?? 0) + 1);
    if (v.device_type)
      byDevice.set(v.device_type, (byDevice.get(v.device_type) ?? 0) + 1);
  }

  for (const session of sessions ?? []) {
    const source = session.traffic_source ?? "direct";
    byTrafficSource.set(source, (byTrafficSource.get(source) ?? 0) + 1);
  }

  return {
    byCountry: Array.from(byCountry.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count),
    byDevice: Array.from(byDevice.entries())
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count),
    byTrafficSource: Array.from(byTrafficSource.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count),
  };
}
