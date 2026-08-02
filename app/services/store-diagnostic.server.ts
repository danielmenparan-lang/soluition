import { getDashboardMetrics, getStoreHealthSummary } from "./analytics.server";
import { getConversionFunnel } from "./funnel.server";
import { getRevenueLeakReport } from "./revenue-leak.server";
import type {
  DiagnosticCheck,
  DropOffSpot,
  StoreDiagnostic,
} from "../types/store-diagnostic.types";

export async function getStoreDiagnostic(
  shopId: string,
  shopDomain: string,
  days = 30,
): Promise<StoreDiagnostic> {
  const [health, metrics, funnel, leakReport] = await Promise.all([
    getStoreHealthSummary(shopId).catch(() => null),
    getDashboardMetrics(shopId, days).catch(() => null),
    getConversionFunnel(shopId, days).catch(() => []),
    getRevenueLeakReport(shopId, shopDomain, days).catch(() => null),
  ]);

  const intelligence = health?.intelligence ?? null;
  const hasVisitorData = Boolean(metrics && metrics.totalVisitors >= 15);
  const conversionRate = metrics?.conversionRate ?? 0;
  const abandonmentRate = metrics?.abandonmentRate ?? 0;

  const checks: DiagnosticCheck[] = [];

  // 1. Tracking
  checks.push({
    id: "tracking",
    category: "tracking",
    label: "Visitor tracking",
    status: metrics && metrics.totalVisitors >= 5 ? "pass" : "fail",
    detail:
      metrics && metrics.totalVisitors >= 5
        ? `${metrics.totalVisitors} visitors tracked in ${days} days`
        : "No visitor data yet — enable the app embed in your theme",
    fixHint: "Theme editor → App embeds → Solution Tracker → Save",
    adminUrl: null,
  });

  // 2. Overall conversion
  checks.push({
    id: "conversion",
    category: "funnel",
    label: "Store conversion",
    status:
      !hasVisitorData
        ? "warn"
        : conversionRate >= 1.5
          ? "pass"
          : conversionRate >= 0.5
            ? "warn"
            : "fail",
    detail: hasVisitorData
      ? `${conversionRate}% of sessions ended in a purchase`
      : "Need more visitors to measure",
    fixHint: "Fix product pages and checkout before running ads",
    adminUrl: null,
  });

  // 3. Checkout
  const checkoutStep = funnel.find((s) => s.id === "checkout");
  const purchaseStep = funnel.find((s) => s.id === "purchase");
  const checkoutStarts = checkoutStep?.count ?? 0;
  checks.push({
    id: "checkout",
    category: "checkout",
    label: "Checkout completion",
    status:
      checkoutStarts < 3
        ? "warn"
        : abandonmentRate <= 55
          ? "pass"
          : abandonmentRate <= 75
            ? "warn"
            : "fail",
    detail:
      checkoutStarts >= 3
        ? `${abandonmentRate}% abandon checkout (${purchaseStep?.count ?? 0} of ${checkoutStarts} finished)`
        : "Not enough checkout attempts yet",
    fixHint: "Check shipping cost, guest checkout, and trust badges",
    adminUrl: `https://${shopDomain}/admin/settings/checkout`,
  });

  // 4. Product pages — funnel drop
  const productViews = funnel.find((s) => s.id === "product_views");
  const addToCart = funnel.find((s) => s.id === "add_to_cart");
  const productDrop =
    productViews && addToCart && productViews.count > 0
      ? Math.round(
          ((productViews.count - addToCart.count) / productViews.count) * 100,
        )
      : null;
  checks.push({
    id: "product_pages",
    category: "product_page",
    label: "Product page → cart",
    status:
      productDrop === null
        ? "warn"
        : productDrop <= 85
          ? "pass"
          : productDrop <= 92
            ? "warn"
            : "fail",
    detail:
      productDrop !== null
        ? `${productViews!.count} viewed products, ${addToCart!.count} added to cart (${productDrop}% drop)`
        : "Need more product views",
    fixHint: "Improve photos, price clarity, reviews, and Add to cart button",
    adminUrl: null,
  });

  // 5. Traffic quality
  const wasteful = metrics?.topTrafficSources.filter(
    (s) => s.sessions >= 20 && s.conversionRate < 0.5,
  );
  const badSource = wasteful?.[0];
  checks.push({
    id: "traffic",
    category: "traffic",
    label: "Traffic quality",
    status: !hasVisitorData
      ? "warn"
      : !badSource
        ? "pass"
        : badSource.conversionRate < 0.2
          ? "fail"
          : "warn",
    detail: badSource
      ? `${badSource.source}: ${badSource.sessions} sessions, ${badSource.conversionRate}% bought`
      : hasVisitorData
        ? "Traffic sources convert at a reasonable rate"
        : "Need more data",
    fixHint: badSource
      ? "Pause or fix ads for this source — or improve the landing page"
      : "Keep monitoring after you start ads",
    adminUrl: null,
  });

  const blockers = checks.filter((c) => c.status === "fail").slice(0, 3);
  const warns = checks.filter((c) => c.status === "warn");
  const passCount = checks.filter((c) => c.status === "pass").length;

  let adReadinessScore = Math.round((passCount / checks.length) * 100);
  if (blockers.length > 0) adReadinessScore = Math.min(adReadinessScore, 55);
  if (conversionRate > 0 && conversionRate < 0.5) {
    adReadinessScore = Math.min(adReadinessScore, 45);
  }
  if (intelligence?.storeHealthScore) {
    adReadinessScore = Math.round(
      adReadinessScore * 0.6 + intelligence.storeHealthScore * 0.4,
    );
  }

  const readyForAds =
    hasVisitorData &&
    adReadinessScore >= 65 &&
    blockers.length === 0 &&
    conversionRate >= 0.8;

  const verdict = !hasVisitorData
    ? "Connect tracking first"
    : readyForAds
      ? "Ready for ads"
      : blockers.length > 0
        ? "Fix blockers before ads"
        : "Almost ready — a few fixes left";

  const summary = readyForAds
    ? "Conversion looks healthy enough to test paid traffic."
    : blockers.length > 0
      ? `Fix ${blockers.length} blocker${blockers.length > 1 ? "s" : ""} before spending on ads.`
      : warns.length > 0
        ? "Improve conversion first — ads will waste money otherwise."
        : "Browse your store to collect more data.";

  const dropOffs: DropOffSpot[] = (leakReport?.leaks ?? [])
    .slice(0, 3)
    .map((leak) => ({
      id: leak.id,
      title: leak.title,
      detail: leak.detail,
      evidence: leak.evidence,
      fixHint: leak.fixAction,
      adminUrl: leak.adminUrl,
    }));

  return {
    adReadinessScore,
    readyForAds,
    verdict,
    summary,
    checks,
    blockers: blockers.length > 0 ? blockers : warns.slice(0, 3),
    dropOffs,
    hasEnoughData: hasVisitorData,
  };
}

/** JSON for AI prompts */
export function formatDiagnosticForAi(diagnostic: StoreDiagnostic): string {
  return JSON.stringify(
    {
      adReadinessScore: diagnostic.adReadinessScore,
      readyForAds: diagnostic.readyForAds,
      verdict: diagnostic.verdict,
      blockers: diagnostic.blockers.map((b) => ({
        label: b.label,
        detail: b.detail,
        fix: b.fixHint,
      })),
      dropOffs: diagnostic.dropOffs.map((d) => ({
        title: d.title,
        detail: d.detail,
        evidence: d.evidence,
      })),
    },
    null,
    2,
  );
}
