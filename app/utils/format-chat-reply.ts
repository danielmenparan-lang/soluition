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
      metrics?: { totalVisitors?: number; totalSessions?: number };
    };
    const visitors = data.metrics?.totalVisitors ?? 0;
    const sessions = data.metrics?.totalSessions ?? 0;
    return visitors > 0 || sessions > 0;
  } catch {
    return false;
  }
}
