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
    description:
      "Visitors who viewed many products, spent significant time, or added to cart",
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

      if ((productViews ?? 0) >= 5 || (cartAdds ?? 0) >= 1 || maxDuration >= 180) {
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

  const { data: visitors } = await supabase
    .from("visitors")
    .select("country, city, device_type")
    .eq("shop_id", shopId)
    .gte("last_seen_at", since.toISOString());

  const byCountry = new Map<string, number>();
  const byDevice = new Map<string, number>();

  for (const v of visitors ?? []) {
    if (v.country) byCountry.set(v.country, (byCountry.get(v.country) ?? 0) + 1);
    if (v.device_type)
      byDevice.set(v.device_type, (byDevice.get(v.device_type) ?? 0) + 1);
  }

  return {
    byCountry: Array.from(byCountry.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count),
    byDevice: Array.from(byDevice.entries())
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count),
  };
}
