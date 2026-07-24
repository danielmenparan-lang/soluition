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

const DEFER_PATTERNS = [
  /come back/i,
  /check again/i,
  /wait \d/i,
  /24.?48 hour/i,
  /20.?30 visitors/i,
  /once you have (more|enough)/i,
  /when you have (more|enough|at least)/i,
  /after (a|one) week/i,
  /then we can analyze/i,
  /נתונים (אמיתיים )?בעוד/i,
  /חזור (ל|אל)/i,
  /אחרי שיהיו/i,
];

/** Remove lines that tell the merchant to wait or return later. */
export function stripDeferredAdvice(text: string): string {
  const lines = text.split("\n");
  const filtered = lines.filter(
    (line) => !DEFER_PATTERNS.some((pattern) => pattern.test(line)),
  );
  return (filtered.length > 0 ? filtered : lines).join("\n").trim();
}

export function hasAnalyticsData(summaryJson: string): boolean {
  try {
    const data = JSON.parse(summaryJson) as {
      metrics?: { totalVisitors?: number; totalSessions?: number };
    };
    const visitors = data.metrics?.totalVisitors ?? 0;
    const sessions = data.metrics?.totalSessions ?? 0;
    return visitors > 0 || sessions > 0;
  } catch {
    return false;
  }
}

/** Too little data for trend analysis — still enough to give action items. */
export function isSparseAnalyticsData(summaryJson: string): boolean {
  try {
    const data = JSON.parse(summaryJson) as {
      metrics?: {
        totalVisitors?: number;
        totalSessions?: number;
        totalEvents?: number;
      };
    };
    const visitors = data.metrics?.totalVisitors ?? 0;
    const sessions = data.metrics?.totalSessions ?? 0;
    const events = data.metrics?.totalEvents ?? 0;
    return visitors < 10 && sessions < 10 && events < 25;
  } catch {
    return true;
  }
}
