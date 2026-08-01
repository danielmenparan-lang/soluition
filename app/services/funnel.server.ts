import getSupabase from "../supabase.server";

export type FunnelStep = {
  id: string;
  label: string;
  count: number;
  rateFromTopPct: number;
  dropOffFromPrevPct: number | null;
};

export async function getConversionFunnel(
  shopId: string,
  days = 30,
): Promise<FunnelStep[]> {
  const supabase = getSupabase();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString();

  const [{ count: visitorCount }, { count: sessionCount }, { data: events }] =
    await Promise.all([
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
        .select("event_type, visitor_uuid")
        .eq("shop_id", shopId)
        .gte("created_at", sinceIso)
        .in("event_type", [
          "product_view",
          "add_to_cart",
          "checkout_start",
          "purchase",
        ]),
    ]);

  const visitors = visitorCount ?? 0;
  const sessions = sessionCount ?? 0;
  const eventList = events ?? [];

  const productViewers = new Set(
    eventList
      .filter((e) => e.event_type === "product_view")
      .map((e) => e.visitor_uuid),
  ).size;
  const addToCarts = eventList.filter((e) => e.event_type === "add_to_cart").length;
  const checkouts = eventList.filter((e) => e.event_type === "checkout_start").length;
  const purchases = eventList.filter((e) => e.event_type === "purchase").length;

  const steps = [
    { id: "visitors", label: "Visitors", count: visitors },
    { id: "sessions", label: "Sessions", count: sessions },
    { id: "product_views", label: "Viewed a product", count: productViewers },
    { id: "add_to_cart", label: "Added to cart", count: addToCarts },
    { id: "checkout", label: "Started checkout", count: checkouts },
    { id: "purchase", label: "Purchased", count: purchases },
  ];

  const top = visitors || sessions || 1;

  return steps.map((step, index) => {
    const prev = index > 0 ? steps[index - 1].count : null;
    return {
      ...step,
      rateFromTopPct:
        top > 0 ? Math.round((step.count / top) * 1000) / 10 : 0,
      dropOffFromPrevPct:
        prev !== null && prev > 0
          ? Math.round(((prev - step.count) / prev) * 1000) / 10
          : null,
    };
  });
}
