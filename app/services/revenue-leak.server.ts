import getSupabase from "../supabase.server";
import {
  getDashboardMetrics,
  getHighTrafficLowConversionPages,
} from "./analytics.server";
import { findWastefulSources } from "./attribution.server";
import { getConversionFunnel } from "./funnel.server";
import { getProductExitDrivers } from "./product-intelligence.server";
import { getStoreIntelligence } from "./store-intelligence.server";
import type {
  RevenueLeak,
  RevenueLeakReport,
  RevenueLeakType,
} from "../types/revenue-leak.types";
import {
  checkoutSettingsUrl,
  productAdminUrl,
} from "../utils/shopify-admin-links";

const DEFAULT_AOV = 45;
const MIN_VISITORS = 15;

function toMonthly(amount: number, days: number): number {
  if (days <= 0) return amount;
  return Math.round((amount * (30 / days)) * 100) / 100;
}

function resolveAov(
  intelligence: Awaited<ReturnType<typeof getStoreIntelligence>>,
  sessionOrderValues: number[],
): number {
  if (
    intelligence.hasShopifyOrders &&
    intelligence.revenue.averageOrderValue > 0
  ) {
    return intelligence.revenue.averageOrderValue;
  }
  if (sessionOrderValues.length > 0) {
    const sum = sessionOrderValues.reduce((a, b) => a + b, 0);
    return Math.round((sum / sessionOrderValues.length) * 100) / 100;
  }
  if (intelligence.catalog.avgProductPrice > 0) {
    return intelligence.catalog.avgProductPrice;
  }
  return DEFAULT_AOV;
}

function leakId(type: RevenueLeakType, key: string): string {
  return `${type}:${key}`;
}

export async function getRevenueLeakReport(
  shopId: string,
  shopDomain: string,
  days = 30,
): Promise<RevenueLeakReport> {
  const [
    metrics,
    intelligence,
    funnel,
    exitDrivers,
    lowConversionPages,
    checkoutCounts,
  ] = await Promise.all([
    getDashboardMetrics(shopId, days),
    getStoreIntelligence(shopId, days),
    getConversionFunnel(shopId, days),
    getProductExitDrivers(shopId, days, 5),
    getHighTrafficLowConversionPages(shopId, days, 5),
    getCheckoutEventCounts(shopId, days),
  ]);

  const currency = intelligence.primaryCurrency || "USD";
  const conversionRate = metrics.conversionRate / 100;
  const sessionOrderValues = await getConvertedSessionValues(shopId, days);
  const aov = resolveAov(intelligence, sessionOrderValues);

  const leaks: RevenueLeak[] = [];

  // 1. Cart abandonment — checkout started but no purchase
  const abandoned = Math.max(
    0,
    checkoutCounts.checkoutStarts - checkoutCounts.purchases,
  );
  if (abandoned >= 3) {
    const periodLoss = abandoned * aov;
    leaks.push({
      id: leakId("cart_abandonment", "checkout"),
      type: "cart_abandonment",
      title: "Checkout abandonment",
      detail: `${abandoned} people started checkout and didn't finish in the last ${days} days.`,
      monthlyLoss: toMonthly(periodLoss, days),
      evidence: `${metrics.abandonmentRate}% checkout drop-off`,
      fixAction: "Review checkout — shipping cost, trust badges, guest checkout",
      adminUrl: checkoutSettingsUrl(shopDomain),
    });
  }

  // 2. Product exit — last product viewed before leaving without buying
  const topExitProduct = exitDrivers[0];
  if (topExitProduct && topExitProduct.exitCount >= 5) {
    const recoverable = topExitProduct.exitCount;
    const periodLoss = recoverable * aov * Math.max(conversionRate, 0.012);
    leaks.push({
      id: leakId("product_exit", topExitProduct.productId),
      type: "product_exit",
      title: `"${truncateTitle(topExitProduct.productTitle)}" loses buyers`,
      detail: `${topExitProduct.exitCount} sessions ended on this product without buying.`,
      monthlyLoss: toMonthly(periodLoss, days),
      evidence: `${topExitProduct.exitRate}% exit rate after viewing`,
      fixAction: "Fix photos, price clarity, reviews, and add-to-cart button",
      adminUrl: productAdminUrl(shopDomain, topExitProduct.productId),
    });
  }

  // 3. High-traffic page where people leave
  const worstPage = lowConversionPages[0];
  if (worstPage && worstPage.views >= 10) {
    const periodLoss = worstPage.exits * aov * Math.max(conversionRate, 0.01);
    leaks.push({
      id: leakId("page_exit", worstPage.url),
      type: "page_exit",
      title: pageLeakTitle(worstPage.pageTitle, worstPage.url),
      detail: `${worstPage.views} views, ${worstPage.exits} left from this page.`,
      monthlyLoss: toMonthly(periodLoss, days),
      evidence: `${worstPage.exitRate}% exit rate`,
      fixAction: "Improve content, speed, and clear next step on this page",
      adminUrl: null,
    });
  }

  // 4. Wasted ad/social traffic
  const wasteful = findWastefulSources(metrics.topTrafficSources, 20);
  for (const source of wasteful.slice(0, 2)) {
    const avgConv =
      metrics.topTrafficSources.reduce((s, m) => s + m.conversionRate, 0) /
      (metrics.topTrafficSources.length || 1);
    const gapPct = Math.max(0, avgConv - source.conversionRate);
    if (gapPct < 0.3) continue;

    const periodLoss = source.sessions * (gapPct / 100) * aov;
    leaks.push({
      id: leakId("wasted_traffic", source.source),
      type: "wasted_traffic",
      title: `${capitalizeSource(source.source)} traffic underperforms`,
      detail: `${source.sessions} sessions, ${source.conversionRate}% sales rate vs ${Math.round(avgConv * 10) / 10}% store avg.`,
      monthlyLoss: toMonthly(periodLoss, days),
      evidence: `${source.conversions} purchases from this source`,
      fixAction: "Pause or fix ads for this source — or improve landing page",
      adminUrl: null,
    });
  }

  // 5. Funnel drop — viewed product but didn't add to cart
  const productViewStep = funnel.find((s) => s.id === "product_views");
  const cartStep = funnel.find((s) => s.id === "add_to_cart");
  if (
    productViewStep &&
    cartStep &&
    productViewStep.count >= 10 &&
    productViewStep.count > cartStep.count
  ) {
    const drop = productViewStep.count - cartStep.count;
    if (drop >= 5) {
      const periodLoss = drop * aov * Math.max(conversionRate, 0.008);
      leaks.push({
        id: leakId("funnel_drop", "product_to_cart"),
        type: "funnel_drop",
        title: "Product pages don't push Add to cart",
        detail: `${drop} people viewed products but didn't add anything to cart.`,
        monthlyLoss: toMonthly(periodLoss, days),
        evidence: `${productViewStep.dropOffFromPrevPct ?? 0}% drop after product view`,
        fixAction: "Stronger price, size guide, shipping info above the fold",
        adminUrl: null,
      });
    }
  }

  leaks.sort((a, b) => b.monthlyLoss - a.monthlyLoss);

  const topLeaks = leaks.slice(0, 5);
  const totalMonthlyLoss = Math.round(
    topLeaks.reduce((sum, leak) => sum + leak.monthlyLoss, 0) * 100,
  ) / 100;

  const hasEnoughData =
    metrics.totalVisitors >= MIN_VISITORS && topLeaks.length > 0;

  return {
    totalMonthlyLoss,
    periodDays: days,
    currency,
    leaks: topLeaks,
    hasEnoughData,
    aovUsed: aov,
    disclaimer:
      "Estimated from your store traffic. Uses your avg order value where available.",
  };
}

async function getCheckoutEventCounts(
  shopId: string,
  days: number,
): Promise<{ checkoutStarts: number; purchases: number }> {
  const supabase = getSupabase();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: events } = await supabase
    .from("events")
    .select("event_type")
    .eq("shop_id", shopId)
    .gte("created_at", since.toISOString())
    .in("event_type", ["checkout_start", "purchase"]);

  const list = events ?? [];
  return {
    checkoutStarts: list.filter((e) => e.event_type === "checkout_start").length,
    purchases: list.filter((e) => e.event_type === "purchase").length,
  };
}

async function getConvertedSessionValues(
  shopId: string,
  days: number,
): Promise<number[]> {
  const supabase = getSupabase();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: sessions } = await supabase
    .from("visitor_sessions")
    .select("order_value")
    .eq("shop_id", shopId)
    .eq("converted", true)
    .gte("started_at", since.toISOString())
    .not("order_value", "is", null);

  return (sessions ?? [])
    .map((s) => Number(s.order_value))
    .filter((v) => v > 0);
}

function truncateTitle(title: string, max = 36): string {
  if (title.length <= max) return title;
  return `${title.slice(0, max - 1)}…`;
}

function pageLeakTitle(pageTitle: string | null, url: string): string {
  if (pageTitle?.trim()) {
    return `"${truncateTitle(pageTitle)}" page loses visitors`;
  }
  try {
    const path = new URL(url, "https://store.test").pathname;
    return `${truncateTitle(path || url, 40)} loses visitors`;
  } catch {
    return "High-traffic page loses visitors";
  }
}

function capitalizeSource(source: string): string {
  if (source === "direct") return "Direct";
  return source.charAt(0).toUpperCase() + source.slice(1);
}

/** JSON summary for AI prompts */
export function formatLeaksForAi(report: RevenueLeakReport): string {
  if (!report.hasEnoughData) {
    return JSON.stringify({ revenueLeaks: [], note: "Not enough visitor data" });
  }
  return JSON.stringify(
    {
      totalEstimatedMonthlyLoss: report.totalMonthlyLoss,
      currency: report.currency,
      avgOrderValueUsed: report.aovUsed,
      leaks: report.leaks.map((leak) => ({
        type: leak.type,
        title: leak.title,
        monthlyLoss: leak.monthlyLoss,
        evidence: leak.evidence,
        fixAction: leak.fixAction,
      })),
    },
    null,
    2,
  );
}
