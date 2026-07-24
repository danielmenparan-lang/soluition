import getSupabase from "../supabase.server";

export interface ProductMetrics {
  productId: string;
  productTitle: string;
  views: number;
  purchases: number;
  addToCarts: number;
  revenue: number;
  conversionRate: number;
  returningPurchasers: number;
}

export interface ProductInsight {
  type:
    | "high_views_low_sales"
    | "high_conversion"
    | "growth_potential"
    | "exit_driver";
  productId: string;
  productTitle: string;
  metric: number;
  description: string;
}

export interface ProductExitDriver {
  productId: string;
  productTitle: string;
  exitCount: number;
  viewCount: number;
  exitRate: number;
}

export async function getProductMetrics(
  shopId: string,
  days = 30,
): Promise<ProductMetrics[]> {
  const supabase = getSupabase();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: analytics } = await supabase
    .from("product_analytics")
    .select("*")
    .eq("shop_id", shopId)
    .gte("date", since.toISOString().split("T")[0]);

  const map = new Map<string, ProductMetrics>();

  for (const row of analytics ?? []) {
    const existing = map.get(row.product_id) ?? {
      productId: row.product_id,
      productTitle: row.product_title ?? row.product_id,
      views: 0,
      purchases: 0,
      addToCarts: 0,
      revenue: 0,
      conversionRate: 0,
      returningPurchasers: 0,
    };
    existing.views += row.views;
    existing.purchases += row.purchases;
    existing.addToCarts += row.add_to_carts;
    existing.revenue += Number(row.revenue);
    map.set(row.product_id, existing);
  }

  return Array.from(map.values())
    .map((p) => ({
      ...p,
      conversionRate:
        p.views > 0 ? Math.round((p.purchases / p.views) * 10000) / 100 : 0,
      revenue: Math.round(p.revenue * 100) / 100,
    }))
    .sort((a, b) => b.views - a.views);
}

export function analyzeProducts(metrics: ProductMetrics[]): ProductInsight[] {
  const insights: ProductInsight[] = [];
  if (metrics.length === 0) return insights;

  const avgConversion =
    metrics.reduce((s, m) => s + m.conversionRate, 0) / metrics.length;

  for (const p of metrics) {
    if (p.views >= 100 && p.conversionRate < avgConversion * 0.5) {
      insights.push({
        type: "high_views_low_sales",
        productId: p.productId,
        productTitle: p.productTitle,
        metric: p.views,
        description: `${p.views} views but only ${p.conversionRate}% conversion — product page may need optimization`,
      });
    }
    if (p.conversionRate >= avgConversion * 1.5 && p.purchases >= 5) {
      insights.push({
        type: "high_conversion",
        productId: p.productId,
        productTitle: p.productTitle,
        metric: p.conversionRate,
        description: `Strong ${p.conversionRate}% conversion — consider promoting this product`,
      });
    }
    if (p.views >= 50 && p.addToCarts >= 10 && p.purchases < p.addToCarts * 0.3) {
      insights.push({
        type: "growth_potential",
        productId: p.productId,
        productTitle: p.productTitle,
        metric: p.addToCarts,
        description: `High cart interest (${p.addToCarts} adds) but low purchases — retargeting opportunity`,
      });
    }
  }

  return insights.slice(0, 20);
}

export async function getProductExitDrivers(
  shopId: string,
  days = 30,
  limit = 10,
): Promise<ProductExitDriver[]> {
  const supabase = getSupabase();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: exitSessions } = await supabase
    .from("visitor_sessions")
    .select("id")
    .eq("shop_id", shopId)
    .eq("converted", false)
    .not("ended_at", "is", null)
    .gte("started_at", since.toISOString());

  const sessionIds = (exitSessions ?? []).map((s) => s.id);
  if (sessionIds.length === 0) return [];

  const exitMap = new Map<string, { productTitle: string; exitCount: number }>();

  for (let i = 0; i < sessionIds.length; i += 100) {
    const chunk = sessionIds.slice(i, i + 100);
    const { data: events } = await supabase
      .from("events")
      .select("session_uuid, event_type, product_id, product_title, created_at")
      .in("session_uuid", chunk)
      .in("event_type", ["product_view", "session_end", "purchase"])
      .order("created_at", { ascending: true });

    const bySession = new Map<
      string,
      Array<{
        session_uuid: string;
        event_type: string;
        product_id: string | null;
        product_title: string | null;
        created_at: string;
      }>
    >();
    for (const event of events ?? []) {
      const list = bySession.get(event.session_uuid) ?? [];
      list.push(event);
      bySession.set(event.session_uuid, list);
    }

    for (const sessionEvents of bySession.values()) {
      if (sessionEvents.some((event) => event.event_type === "purchase")) {
        continue;
      }

      const productViews = sessionEvents.filter(
        (event) => event.event_type === "product_view" && event.product_id,
      );
      if (productViews.length === 0) continue;

      const hasSessionEnd = sessionEvents.some(
        (event) => event.event_type === "session_end",
      );
      if (!hasSessionEnd) continue;

      const lastProduct = productViews[productViews.length - 1];
      if (!lastProduct.product_id) continue;

      const existing = exitMap.get(lastProduct.product_id) ?? {
        productTitle: lastProduct.product_title ?? lastProduct.product_id,
        exitCount: 0,
      };
      existing.exitCount += 1;
      exitMap.set(lastProduct.product_id, existing);
    }
  }

  const metrics = await getProductMetrics(shopId, days);
  const viewsByProduct = new Map(
    metrics.map((metric) => [metric.productId, metric.views]),
  );

  return Array.from(exitMap.entries())
    .map(([productId, info]) => {
      const viewCount = viewsByProduct.get(productId) ?? 0;
      const exitRate =
        viewCount > 0
          ? Math.round((info.exitCount / viewCount) * 10000) / 100
          : 100;
      return {
        productId,
        productTitle: info.productTitle,
        exitCount: info.exitCount,
        viewCount,
        exitRate,
      };
    })
    .sort((a, b) => b.exitCount - a.exitCount || b.exitRate - a.exitRate)
    .slice(0, limit);
}

export function analyzeProductExitDrivers(
  drivers: ProductExitDriver[],
): ProductInsight[] {
  return drivers
    .filter((driver) => driver.exitCount >= 3)
    .slice(0, 10)
    .map((driver) => ({
      type: "exit_driver" as const,
      productId: driver.productId,
      productTitle: driver.productTitle,
      metric: driver.exitCount,
      description: `${driver.exitCount} visitors left the site after viewing this product (${driver.exitRate}% exit rate) — review pricing, images, or page layout`,
    }));
}

export async function upsertProductAnalytics(
  shopId: string,
  productId: string,
  productTitle: string,
  field: "views" | "add_to_carts" | "purchases" | "revenue",
  increment = 1,
  revenueAmount = 0,
): Promise<void> {
  const supabase = getSupabase();
  const today = new Date().toISOString().split("T")[0];

  const { data: existing } = await supabase
    .from("product_analytics")
    .select("*")
    .eq("shop_id", shopId)
    .eq("product_id", productId)
    .eq("date", today)
    .single();

  if (existing) {
    const updates: {
      views?: number;
      add_to_carts?: number;
      purchases?: number;
      revenue?: number;
    } = {};
    if (field === "views") updates.views = existing.views + increment;
    if (field === "add_to_carts")
      updates.add_to_carts = existing.add_to_carts + increment;
    if (field === "purchases")
      updates.purchases = existing.purchases + increment;
    if (field === "revenue")
      updates.revenue = Number(existing.revenue) + revenueAmount;

    await supabase
      .from("product_analytics")
      .update(updates)
      .eq("id", existing.id);
  } else {
    await supabase.from("product_analytics").insert({
      shop_id: shopId,
      product_id: productId,
      product_title: productTitle,
      date: today,
      views: field === "views" ? increment : 0,
      add_to_carts: field === "add_to_carts" ? increment : 0,
      purchases: field === "purchases" ? increment : 0,
      revenue: field === "revenue" ? revenueAmount : 0,
    });
  }
}
