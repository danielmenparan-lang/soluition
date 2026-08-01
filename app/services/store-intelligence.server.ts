import getSupabase from "../supabase.server";
import { dominantCurrency } from "../utils/format-currency";
import type {
  RfmSegment,
  StoreIntelligence,
} from "../types/store-intelligence.types";

export type { RfmSegment, StoreIntelligence };

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EXCLUDED_FINANCIAL = new Set([
  "REFUNDED",
  "VOIDED",
  "EXPIRED",
]);

type OrderRow = {
  shopify_order_id: number;
  customer_id: number | null;
  total_price: number;
  subtotal_price: number | null;
  total_tax: number | null;
  total_discounts: number | null;
  currency: string | null;
  financial_status: string | null;
  fulfillment_status: string | null;
  country_code: string | null;
  source_name: string | null;
  utm_source: string | null;
  ordered_at: string;
  raw_line_items: unknown;
};

function round(n: number, digits = 2): number {
  const m = 10 ** digits;
  return Math.round(n * m) / m;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function pct(part: number, whole: number): number {
  return whole > 0 ? round((part / whole) * 100) : 0;
}

function isPaidOrder(status: string | null | undefined): boolean {
  const s = String(status ?? "").toUpperCase();
  return !EXCLUDED_FINANCIAL.has(s);
}

function isPartiallyRefunded(status: string | null | undefined): boolean {
  return String(status ?? "").toUpperCase().includes("PARTIALLY");
}

function classifyRfm(
  recencyDays: number,
  frequency: number,
  monetary: number,
  avgMonetary: number,
): RfmSegment {
  if (recencyDays <= 30 && frequency >= 3 && monetary >= avgMonetary) {
    return "champions";
  }
  if (recencyDays <= 60 && frequency >= 2) return "loyal";
  if (recencyDays <= 30 && frequency === 1) return "new";
  if (recencyDays <= 90 && monetary >= avgMonetary * 0.8) return "potential";
  if (recencyDays <= 120 && frequency >= 2) return "at_risk";
  return "hibernating";
}

function healthGrade(score: number): StoreIntelligence["storeHealthGrade"] {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

/** Counts distinct scalar KPIs only — no array inflation. */
function countMetrics(report: Omit<StoreIntelligence, "metricCount">): number {
  let count = 0;
  const walk = (obj: unknown): void => {
    if (obj === null || obj === undefined) return;
    if (Array.isArray(obj)) return;
    if (typeof obj === "object") {
      for (const value of Object.values(obj as Record<string, unknown>)) {
        if (typeof value === "number" || typeof value === "string") count += 1;
        else if (typeof value === "boolean") count += 1;
        else if (value && typeof value === "object" && !Array.isArray(value)) {
          walk(value);
        }
      }
    }
  };
  walk(report);
  return count;
}

function assertNoError(label: string, error: { message: string } | null): void {
  if (error) throw new Error(`${label}: ${error.message}`);
}

export async function getStoreIntelligence(
  shopId: string,
  days = 30,
): Promise<StoreIntelligence> {
  const supabase = getSupabase();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString();

  const prevSince = new Date(since);
  prevSince.setDate(prevSince.getDate() - days);
  const prevSinceIso = prevSince.toISOString();

  const [
    periodResult,
    prevResult,
    lifetimeResult,
    priorCustomersResult,
    productsResult,
  ] = await Promise.all([
    supabase
      .from("shop_orders")
      .select("*")
      .eq("shop_id", shopId)
      .gte("ordered_at", sinceIso)
      .order("ordered_at", { ascending: false }),
    supabase
      .from("shop_orders")
      .select("total_price, financial_status, currency")
      .eq("shop_id", shopId)
      .gte("ordered_at", prevSinceIso)
      .lt("ordered_at", sinceIso),
    supabase
      .from("shop_orders")
      .select("customer_id, total_price, financial_status, ordered_at")
      .eq("shop_id", shopId)
      .not("customer_id", "is", null),
    supabase
      .from("shop_orders")
      .select("customer_id")
      .eq("shop_id", shopId)
      .not("customer_id", "is", null)
      .lt("ordered_at", sinceIso),
    supabase.from("shop_products").select("*").eq("shop_id", shopId),
  ]);

  assertNoError("shop_orders period", periodResult.error);
  assertNoError("shop_orders previous period", prevResult.error);
  assertNoError("shop_orders lifetime", lifetimeResult.error);
  assertNoError("shop_orders prior customers", priorCustomersResult.error);
  assertNoError("shop_products", productsResult.error);

  const orderList = (periodResult.data ?? []) as OrderRow[];
  const prevList = prevResult.data ?? [];
  const lifetimeOrders = lifetimeResult.data ?? [];
  const priorCustomerIds = new Set(
    (priorCustomersResult.data ?? []).map((r) => Number(r.customer_id)),
  );
  const productList = productsResult.data ?? [];
  const hasShopifyOrders = orderList.length > 0;
  const primaryCurrency = dominantCurrency(orderList);

  const paidOrders = orderList.filter((o) => isPaidOrder(o.financial_status));
  const partiallyRefunded = paidOrders.filter((o) =>
    isPartiallyRefunded(o.financial_status),
  ).length;

  const totalRevenue = paidOrders.reduce(
    (s, o) => s + Number(o.total_price),
    0,
  );
  const totalTax = paidOrders.reduce((s, o) => s + Number(o.total_tax ?? 0), 0);
  const totalDiscounts = paidOrders.reduce(
    (s, o) => s + Number(o.total_discounts ?? 0),
    0,
  );
  const subtotalSum = paidOrders.reduce(
    (s, o) => s + Number(o.subtotal_price ?? o.total_price),
    0,
  );
  const orderCount = paidOrders.length;
  const aov = orderCount > 0 ? totalRevenue / orderCount : 0;

  const prevPaid = prevList.filter((o) => isPaidOrder(o.financial_status));
  const prevRevenue = prevPaid.reduce((s, o) => s + Number(o.total_price), 0);
  const prevOrderCount = prevPaid.length;
  const prevAov = prevOrderCount > 0 ? prevRevenue / prevOrderCount : 0;

  let newCustomerOrders = 0;
  let returningCustomerOrders = 0;
  let guestOrdersInPeriod = 0;

  const customerMap = new Map<
    number,
    { orders: number; revenue: number; lastOrder: Date; firstOrder: Date }
  >();

  for (const order of paidOrders) {
    if (!order.customer_id) {
      guestOrdersInPeriod += 1;
      continue;
    }
    const cid = Number(order.customer_id);
    const orderedAt = new Date(order.ordered_at);
    const hadPriorOrder =
      priorCustomerIds.has(cid) ||
      (customerMap.has(cid) &&
        customerMap.get(cid)!.firstOrder.getTime() < orderedAt.getTime());

    if (hadPriorOrder) returningCustomerOrders += 1;
    else newCustomerOrders += 1;

    const existing = customerMap.get(cid) ?? {
      orders: 0,
      revenue: 0,
      lastOrder: orderedAt,
      firstOrder: orderedAt,
    };
    existing.orders += 1;
    existing.revenue += Number(order.total_price);
    if (orderedAt > existing.lastOrder) existing.lastOrder = orderedAt;
    if (orderedAt < existing.firstOrder) existing.firstOrder = orderedAt;
    customerMap.set(cid, existing);
  }

  const periodSpendValues = Array.from(customerMap.values()).map(
    (c) => c.revenue,
  );
  const avgSpendInPeriod =
    periodSpendValues.length > 0
      ? periodSpendValues.reduce((a, b) => a + b, 0) / periodSpendValues.length
      : 0;

  const lifetimeMap = new Map<number, number>();
  for (const order of lifetimeOrders) {
    if (!isPaidOrder(order.financial_status) || !order.customer_id) continue;
    const cid = Number(order.customer_id);
    lifetimeMap.set(cid, (lifetimeMap.get(cid) ?? 0) + Number(order.total_price));
  }
  const ltvValues = Array.from(lifetimeMap.values());
  const avgLifetimeValue =
    ltvValues.length > 0
      ? ltvValues.reduce((a, b) => a + b, 0) / ltvValues.length
      : 0;
  const medLifetimeValue = median(ltvValues);
  const sortedLtv = [...ltvValues].sort((a, b) => b - a);
  const top10Count = Math.max(1, Math.ceil(sortedLtv.length * 0.1));
  const top10Revenue = sortedLtv.slice(0, top10Count).reduce((a, b) => a + b, 0);
  const totalLifetimeRevenue = ltvValues.reduce((a, b) => a + b, 0);

  const oneTimeBuyers = Array.from(customerMap.values()).filter(
    (c) => c.orders === 1,
  ).length;
  const repeatBuyers = customerMap.size - oneTimeBuyers;

  const rfm: Record<RfmSegment, number> = {
    champions: 0,
    loyal: 0,
    potential: 0,
    new: 0,
    at_risk: 0,
    hibernating: 0,
  };
  const now = Date.now();
  for (const c of customerMap.values()) {
    const recencyDays = (now - c.lastOrder.getTime()) / (1000 * 60 * 60 * 24);
    const segment = classifyRfm(
      recencyDays,
      c.orders,
      c.revenue,
      avgSpendInPeriod || aov,
    );
    rfm[segment] += 1;
  }

  const productRevenue = new Map<
    string,
    { title: string; units: number; revenue: number }
  >();
  let totalLineItems = 0;
  for (const order of paidOrders) {
    const items = Array.isArray(order.raw_line_items)
      ? (order.raw_line_items as Array<{
          productId?: string;
          title?: string;
          quantity?: number;
          price?: number;
        }>)
      : [];
    for (const item of items) {
      totalLineItems += Number(item.quantity ?? 1);
      const pid = String(item.productId ?? "unknown");
      const existing = productRevenue.get(pid) ?? {
        title: String(item.title ?? pid),
        units: 0,
        revenue: 0,
      };
      existing.units += Number(item.quantity ?? 1);
      existing.revenue +=
        Number(item.price ?? 0) * Number(item.quantity ?? 1);
      productRevenue.set(pid, existing);
    }
  }

  const hourMap = new Map<number, number>();
  const dayMap = new Map<string, number>();
  let weekdayOrders = 0;
  let weekendOrders = 0;

  for (const order of paidOrders) {
    const d = new Date(order.ordered_at);
    hourMap.set(d.getHours(), (hourMap.get(d.getHours()) ?? 0) + 1);
    dayMap.set(DAY_NAMES[d.getDay()], (dayMap.get(DAY_NAMES[d.getDay()]) ?? 0) + 1);
    if (d.getDay() === 0 || d.getDay() === 6) weekendOrders += 1;
    else weekdayOrders += 1;
  }

  const geoMap = new Map<string, { orders: number; revenue: number }>();
  const sourceMap = new Map<string, { orders: number; revenue: number }>();
  const utmMap = new Map<string, { orders: number; revenue: number }>();

  for (const order of paidOrders) {
    const rev = Number(order.total_price);
    const country = order.country_code || "Unknown";
    const geo = geoMap.get(country) ?? { orders: 0, revenue: 0 };
    geo.orders += 1;
    geo.revenue += rev;
    geoMap.set(country, geo);

    const source = order.source_name || "unknown";
    const src = sourceMap.get(source) ?? { orders: 0, revenue: 0 };
    src.orders += 1;
    src.revenue += rev;
    sourceMap.set(source, src);

    if (order.utm_source) {
      const utm = utmMap.get(order.utm_source) ?? { orders: 0, revenue: 0 };
      utm.orders += 1;
      utm.revenue += rev;
      utmMap.set(order.utm_source, utm);
    }
  }

  const cohortMap = new Map<string, Set<number>>();
  const cohortRepeat = new Map<string, number>();
  for (const [cid, c] of customerMap) {
    const month = `${c.firstOrder.getUTCFullYear()}-${String(c.firstOrder.getUTCMonth() + 1).padStart(2, "0")}`;
    if (!cohortMap.has(month)) cohortMap.set(month, new Set());
    cohortMap.get(month)!.add(cid);
    if (c.orders > 1) {
      cohortRepeat.set(month, (cohortRepeat.get(month) ?? 0) + 1);
    }
  }

  const activeProducts = productList.filter((p) => p.status === "ACTIVE");
  const outOfStock = productList.filter(
    (p) => Number(p.total_inventory) <= 0 && p.status === "ACTIVE",
  );
  const prices = productList
    .map((p) => Number(p.price_min))
    .filter((p) => p > 0);
  const typeMap = new Map<string, number>();
  const vendorMap = new Map<string, number>();
  for (const p of productList) {
    typeMap.set(p.product_type || "Uncategorized", (typeMap.get(p.product_type || "Uncategorized") ?? 0) + 1);
    vendorMap.set(p.vendor || "Unknown", (vendorMap.get(p.vendor || "Unknown") ?? 0) + 1);
  }

  const cancelledOrRefunded = orderList.filter(
    (o) => !isPaidOrder(o.financial_status),
  ).length;

  const unfulfilled = paidOrders.filter(
    (o) => !o.fulfillment_status || o.fulfillment_status === "UNFULFILLED",
  ).length;
  const partiallyFulfilled = paidOrders.filter(
    (o) => o.fulfillment_status === "PARTIAL",
  ).length;
  const fulfilled = paidOrders.filter(
    (o) => o.fulfillment_status === "FULFILLED",
  ).length;

  const inStockRate =
    activeProducts.length > 0
      ? pct(activeProducts.length - outOfStock.length, activeProducts.length)
      : 0;

  const repeatRate = pct(repeatBuyers, customerMap.size);
  const discountRate = pct(totalDiscounts, subtotalSum + totalDiscounts);

  const warnings: string[] = [];
  if (guestOrdersInPeriod > 0) {
    warnings.push(
      `${guestOrdersInPeriod} guest checkout order(s) in this period — LTV/RFM exclude guests.`,
    );
  }
  if (partiallyRefunded > 0) {
    warnings.push(
      `${partiallyRefunded} partially refunded order(s) — revenue uses gross order total.`,
    );
  }
  if (productList.length === 0) {
    warnings.push("Catalog not synced yet — run Shopify sync (Pro plan).");
  }

  let healthScore = 40;
  if (orderCount >= 10) healthScore += 12;
  else if (orderCount >= 3) healthScore += 6;
  if (repeatRate >= 25) healthScore += 18;
  else if (repeatRate >= 12) healthScore += 10;
  else if (repeatRate >= 5) healthScore += 4;
  if (inStockRate >= 85) healthScore += 12;
  else if (inStockRate >= 65) healthScore += 6;
  if (discountRate <= 12) healthScore += 8;
  else if (discountRate <= 20) healthScore += 3;
  if (customerMap.size >= 5 && rfm.at_risk + rfm.hibernating <= customerMap.size * 0.35) {
    healthScore += 10;
  }
  healthScore = Math.min(100, Math.max(0, healthScore));

  const base: Omit<StoreIntelligence, "metricCount"> = {
    storeHealthScore: Math.round(healthScore),
    storeHealthGrade: healthGrade(healthScore),
    hasShopifyOrders,
    periodDays: days,
    primaryCurrency,

    dataQuality: {
      guestOrdersInPeriod,
      ordersMissingCustomer: guestOrdersInPeriod,
      catalogSynced: productList.length > 0,
      warnings,
    },

    revenue: {
      totalRevenue: round(totalRevenue),
      totalTax: round(totalTax),
      totalDiscounts: round(totalDiscounts),
      discountRatePct: discountRate,
      averageOrderValue: round(aov),
      revenuePerDay: round(totalRevenue / Math.max(days, 1)),
      partiallyRefundedOrders: partiallyRefunded,
    },

    orders: {
      totalOrders: orderCount,
      ordersPerDay: round(orderCount / Math.max(days, 1), 2),
      newCustomerOrders,
      returningCustomerOrders,
      repeatPurchaseRatePct: pct(returningCustomerOrders, orderCount),
      avgItemsPerOrder: orderCount > 0 ? round(totalLineItems / orderCount) : 0,
      cancelledOrRefunded,
      unfulfilled,
      partiallyFulfilled,
      fulfilled,
    },

    customers: {
      uniqueCustomers: customerMap.size,
      avgOrdersPerCustomer:
        customerMap.size > 0 ? round(orderCount / customerMap.size) : 0,
      avgSpendInPeriod: round(avgSpendInPeriod),
      medianSpendInPeriod: round(median(periodSpendValues)),
      avgLifetimeValue: round(avgLifetimeValue),
      medianLifetimeValue: round(medLifetimeValue),
      top10PctLtvSharePct: pct(top10Revenue, totalLifetimeRevenue),
      oneTimeBuyers,
      repeatBuyers,
      repeatBuyerRatePct: repeatRate,
    },

    rfm,

    catalog: {
      totalProducts: productList.length,
      activeProducts: activeProducts.length,
      draftProducts: productList.filter((p) => p.status === "DRAFT").length,
      archivedProducts: productList.filter((p) => p.status === "ARCHIVED").length,
      outOfStockProducts: outOfStock.length,
      inStockRatePct: inStockRate,
      totalInventoryUnits: productList.reduce(
        (s, p) => s + Number(p.total_inventory ?? 0),
        0,
      ),
      avgProductPrice:
        prices.length > 0
          ? round(prices.reduce((a, b) => a + b, 0) / prices.length)
          : 0,
      medianProductPrice: round(median(prices)),
      topProductTypes: Array.from(typeMap.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      topVendors: Array.from(vendorMap.entries())
        .map(([vendor, count]) => ({ vendor, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
    },

    orderTiming: {
      peakOrderHours: Array.from(hourMap.entries())
        .map(([hour, orders]) => ({ hour, orders }))
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 6),
      peakOrderDays: Array.from(dayMap.entries())
        .map(([day, orders]) => ({ day, orders }))
        .sort((a, b) => b.orders - a.orders),
      weekdayOrders,
      weekendOrders,
    },

    orderGeo: Array.from(geoMap.entries())
      .map(([country, v]) => ({
        country,
        orders: v.orders,
        revenue: round(v.revenue),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10),

    orderSources: Array.from(sourceMap.entries())
      .map(([source, v]) => ({
        source,
        orders: v.orders,
        revenue: round(v.revenue),
      }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 8),

    orderUtmSources: Array.from(utmMap.entries())
      .map(([source, v]) => ({
        source,
        orders: v.orders,
        revenue: round(v.revenue),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8),

    topProductsByRevenue: Array.from(productRevenue.entries())
      .map(([productId, v]) => ({
        productId,
        title: v.title,
        units: v.units,
        revenue: round(v.revenue),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15),

    cohorts: Array.from(cohortMap.entries())
      .map(([month, set]) => ({
        month,
        customers: set.size,
        repeatWithinCohortPct: pct(cohortRepeat.get(month) ?? 0, set.size),
      }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 6),

    periodComparison: {
      revenueChangePct:
        prevRevenue > 0
          ? round(((totalRevenue - prevRevenue) / prevRevenue) * 100)
          : null,
      ordersChangePct:
        prevOrderCount > 0
          ? round(((orderCount - prevOrderCount) / prevOrderCount) * 100)
          : null,
      aovChangePct:
        prevAov > 0 ? round(((aov - prevAov) / prevAov) * 100) : null,
    },
  };

  return {
    ...base,
    metricCount: countMetrics(base),
  };
}
