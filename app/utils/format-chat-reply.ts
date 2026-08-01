/** Makes AI chat replies readable in plain UI (no markdown). */
export function formatChatReply(text: string): string {
  let out = text.trim();

  out = out.replace(/```[\s\S]*?```/g, (block) =>
    block.replace(/```\w*\n?/g, "").trim(),
  );
  out = out.replace(/^#{1,6}\s+/gm, "");
  out = out.replace(/\*\*(.*?)\*\*/g, "$1");
  out = out.replace(/\*(.*?)\*/g, "$1");
  out = out.replace(/^-{3,}\s*$/gm, "");
  out = out.replace(/^[ \t]*[-*]\s+/gm, "• ");
  out = out.replace(/\n{3,}/g, "\n\n");

  return out.trim();
}

export function hasAnalyticsData(summaryJson: string): boolean {
  try {
    const data = JSON.parse(summaryJson) as {
      visitorAnalytics?: { totalVisitors?: number; totalSessions?: number };
      metrics?: { totalVisitors?: number; totalSessions?: number };
      shopifyStoreIntelligence?: { orders?: { totalOrders?: number } };
    };
    const visitors =
      data.visitorAnalytics?.totalVisitors ?? data.metrics?.totalVisitors ?? 0;
    const sessions =
      data.visitorAnalytics?.totalSessions ?? data.metrics?.totalSessions ?? 0;
    const orders = data.shopifyStoreIntelligence?.orders?.totalOrders ?? 0;
    return visitors > 0 || sessions > 0 || orders > 0;
  } catch {
    return false;
  }
}

/** Too little data for trend analysis — still enough to give action items. */
export function isSparseAnalyticsData(summaryJson: string): boolean {
  try {
    const data = JSON.parse(summaryJson) as {
      visitorAnalytics?: {
        totalVisitors?: number;
        totalSessions?: number;
        totalEvents?: number;
      };
      metrics?: {
        totalVisitors?: number;
        totalSessions?: number;
        totalEvents?: number;
      };
      shopifyStoreIntelligence?: { orders?: { totalOrders?: number } };
    };
    const va = data.visitorAnalytics ?? data.metrics;
    const visitors = va?.totalVisitors ?? 0;
    const sessions = va?.totalSessions ?? 0;
    const events = va?.totalEvents ?? 0;
    const orders = data.shopifyStoreIntelligence?.orders?.totalOrders ?? 0;
    return visitors < 10 && sessions < 10 && events < 25 && orders < 3;
  } catch {
    return true;
  }
}
