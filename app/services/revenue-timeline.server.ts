import getSupabase from "../supabase.server";

export type RevenueTimelinePoint = {
  date: string;
  revenue: number;
  orders: number;
};

const EXCLUDED = new Set(["REFUNDED", "VOIDED", "EXPIRED"]);

export async function getRevenueTimeline(
  shopId: string,
  days = 30,
): Promise<RevenueTimelinePoint[]> {
  const supabase = getSupabase();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("shop_orders")
    .select("ordered_at, total_price, financial_status")
    .eq("shop_id", shopId)
    .gte("ordered_at", since.toISOString())
    .order("ordered_at", { ascending: true });

  if (error) throw new Error(error.message);

  const buckets = new Map<string, { revenue: number; orders: number }>();

  for (let i = 0; i <= days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    buckets.set(key, { revenue: 0, orders: 0 });
  }

  for (const row of data ?? []) {
    const status = String(row.financial_status ?? "").toUpperCase();
    if (EXCLUDED.has(status)) continue;
    const key = new Date(row.ordered_at).toISOString().split("T")[0];
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.revenue += Number(row.total_price);
    bucket.orders += 1;
  }

  return Array.from(buckets.entries()).map(([date, v]) => ({
    date,
    revenue: Math.round(v.revenue * 100) / 100,
    orders: v.orders,
  }));
}

export async function getVisitorTimeline(
  shopId: string,
  days = 30,
): Promise<Array<{ date: string; visitors: number }>> {
  const supabase = getSupabase();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("visitors")
    .select("last_seen_at")
    .eq("shop_id", shopId)
    .gte("last_seen_at", since.toISOString());

  if (error) throw new Error(error.message);

  const buckets = new Map<string, number>();
  for (let i = 0; i <= days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    buckets.set(d.toISOString().split("T")[0], 0);
  }

  for (const row of data ?? []) {
    const key = new Date(row.last_seen_at).toISOString().split("T")[0];
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return Array.from(buckets.entries()).map(([date, visitors]) => ({
    date,
    visitors,
  }));
}
