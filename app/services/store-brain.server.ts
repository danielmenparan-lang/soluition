import { getStoreHealthSummary, getDashboardMetrics } from "./analytics.server";
import { getStoreDiagnostic } from "./store-diagnostic.server";
import { getRecommendations } from "./ai.server";
import { sortByPriority } from "./recommendations.server";
import { getSegments } from "./segmentation.server";
import type { AIRecommendation } from "../types/database.types";
import type {
  BrainInput,
  BrainOutput,
  BrainSkill,
  BrainTodayAction,
  StoreBrain,
} from "../types/store-brain.types";
import type { StoreDiagnostic } from "../types/store-diagnostic.types";
import {
  buildSkillTrainingBlock,
  countSkillsByMode,
  resolveSkillDomains,
} from "../config/marketing-skills";

function buildTodayAction(
  diagnostic: StoreDiagnostic | null,
  topRec: AIRecommendation | null,
): BrainTodayAction | null {
  if (topRec) {
    const actions = Array.isArray(topRec.action_items)
      ? (topRec.action_items as string[])
      : [];
    return {
      title: topRec.title,
      why: topRec.description,
      proof: topRec.expected_impact ?? "From your latest store scan",
      source: "recommendation",
    };
  }

  const blocker = diagnostic?.blockers[0];
  if (blocker) {
    return {
      title: blocker.label,
      why: blocker.detail,
      proof: blocker.fixHint,
      source: "blocker",
    };
  }

  const drop = diagnostic?.dropOffs[0];
  if (drop) {
    return {
      title: drop.title,
      why: drop.detail,
      proof: drop.evidence,
      source: "dropoff",
    };
  }

  if (!diagnostic?.hasEnoughData) {
    return {
      title: "Turn on store tracking",
      why: "The brain needs visitor data before it can suggest marketing moves.",
      proof: "Enable Solution Tracker → browse 2–3 product pages",
      source: "setup",
    };
  }

  return null;
}

function buildVerdictSharp(diagnostic: StoreDiagnostic | null): string {
  if (!diagnostic?.hasEnoughData) {
    return "Connect tracking — then your data tells you what to do today.";
  }
  if (diagnostic.readyForAds) {
    return "Your data supports testing ads — start small and watch checkout.";
  }
  const topBlocker = diagnostic.blockers[0];
  if (topBlocker) {
    return `Don't run ads yet — fix ${topBlocker.label.toLowerCase()} first.`;
  }
  const topDrop = diagnostic.dropOffs[0];
  if (topDrop) {
    return `Fix ${topDrop.title.toLowerCase()} before you spend on marketing.`;
  }
  return diagnostic.summary;
}

function buildThinkingLine(
  visitorCount: number,
  hasOrders: boolean,
  diagnostic: StoreDiagnostic | null,
  segmentCount: number,
  actionCount: number,
): string {
  if (!diagnostic?.hasEnoughData) {
    return "Waiting for visitor signals — enable tracking to wake the brain.";
  }
  const parts: string[] = [];
  if (visitorCount > 0) parts.push(`${visitorCount} visitors`);
  if (hasOrders) parts.push("orders");
  parts.push("funnel");
  if (segmentCount > 0) parts.push(`${segmentCount} audience groups`);
  const focus =
    diagnostic.blockers[0]?.label ??
    diagnostic.dropOffs[0]?.title ??
    "conversion";
  return `Read ${parts.join(", ")} → ${focus} drives today's action${actionCount ? ` (+ ${actionCount} saved ideas)` : ""}.`;
}

function confidenceFrom(
  diagnostic: StoreDiagnostic | null,
  visitorCount: number,
): "high" | "medium" | "low" {
  if (!diagnostic?.hasEnoughData || visitorCount < 15) return "low";
  if (visitorCount >= 100 && diagnostic.checks.filter((c) => c.status === "pass").length >= 3) {
    return "high";
  }
  return "medium";
}

export async function getStoreBrain(
  shopId: string,
  shopDomain: string,
  days = 30,
): Promise<StoreBrain> {
  const [health, metrics, diagnostic, recommendations, segments] = await Promise.all([
    getStoreHealthSummary(shopId).catch(() => null),
    getDashboardMetrics(shopId, days).catch(() => null),
    getStoreDiagnostic(shopId, shopDomain, days).catch(() => null),
    getRecommendations(shopId).catch(() => []),
    getSegments(shopId).catch(() => []),
  ]);

  const intelligence = health?.intelligence ?? null;
  const visitorCount = metrics?.totalVisitors ?? 0;
  const hasOrders = Boolean(intelligence?.hasShopifyOrders);
  const hasVisitors = visitorCount > 0;
  const sortedRecs = sortByPriority(recommendations);
  const topRec = sortedRecs[0] ?? null;

  const inputs: BrainInput[] = [
    {
      id: "visitors",
      label: "Visitors",
      status: hasVisitors ? "active" : "pending",
      detail: hasVisitors ? `${visitorCount} in ${days}d` : "Enable tracking",
    },
    {
      id: "orders",
      label: "Orders",
      status: hasOrders ? "active" : hasVisitors ? "pending" : "off",
      detail: hasOrders
        ? `${intelligence!.orders.totalOrders} synced`
        : "Sync on Starter+",
    },
    {
      id: "funnel",
      label: "Funnel",
      status: diagnostic?.hasEnoughData ? "active" : hasVisitors ? "pending" : "off",
      detail: diagnostic?.hasEnoughData
        ? `${metrics?.conversionRate ?? 0}% conversion`
        : "Needs more sessions",
    },
    {
      id: "traffic",
      label: "Traffic sources",
      status:
        diagnostic?.checks.find((c) => c.id === "traffic")?.status === "pass"
          ? "active"
          : hasVisitors
            ? "pending"
            : "off",
      detail:
        diagnostic?.checks.find((c) => c.id === "traffic")?.detail?.slice(0, 48) ??
        "After first visits",
    },
    {
      id: "products",
      label: "Products",
      status: hasOrders ? "active" : "off",
      detail: hasOrders ? "Exit + performance linked" : "Needs order sync",
    },
  ];

  const skills: BrainSkill[] = [
    {
      id: "diagnostic",
      label: "Ad readiness",
      status: diagnostic?.hasEnoughData ? "active" : "pending",
      summary: diagnostic?.verdict ?? "Waiting for data",
    },
    {
      id: "dropoffs",
      label: "Drop-offs",
      status: (diagnostic?.dropOffs.length ?? 0) > 0 ? "active" : "pending",
      summary:
        diagnostic?.dropOffs[0]?.title ?? "Maps where buyers leave",
    },
    {
      id: "segments",
      label: "Audiences",
      status: segments.length > 0 ? "active" : hasVisitors ? "pending" : "off",
      summary:
        segments.length > 0
          ? `${segments.length} groups ready`
          : "Refresh after traffic",
    },
    {
      id: "actions",
      label: "Marketing actions",
      status: sortedRecs.length > 0 ? "active" : diagnostic?.hasEnoughData ? "pending" : "off",
      summary:
        sortedRecs.length > 0
          ? `${sortedRecs.length} ranked ideas`
          : "Scan to generate",
    },
    {
      id: "chat",
      label: "Marketing chat",
      status: diagnostic?.hasEnoughData ? "active" : "pending",
      summary: "Ask → data-backed answer",
    },
  ];

  const todayAction = buildTodayAction(diagnostic, topRec);
  const verdictSharp = buildVerdictSharp(diagnostic);

  const skillContext = {
    hasVisitors,
    hasOrders,
    hasDiagnostic: Boolean(diagnostic?.hasEnoughData),
    hasDropOffs: (diagnostic?.dropOffs.length ?? 0) > 0,
    hasSegments: segments.length > 0,
    hasActions: sortedRecs.length > 0,
    readyForAds: diagnostic?.readyForAds ?? false,
    visitorCount,
    conversionRate: metrics?.conversionRate ?? 0,
  };

  const domains = resolveSkillDomains(skillContext);
  const activeDomainCount = domains.filter((d) => d.status === "active").length;
  const totalSkillCount = domains.reduce((sum, d) => sum + d.totalCount, 0);

  const output: BrainOutput = {
    verdict: diagnostic?.verdict ?? "Connect your store",
    verdictSharp,
    score: diagnostic?.adReadinessScore ?? 0,
    readyForAds: diagnostic?.readyForAds ?? false,
    summary: diagnostic?.summary ?? "Enable tracking to start.",
    todayAction,
    confidence: confidenceFrom(diagnostic, visitorCount),
  };

  return {
    hasEnoughData: Boolean(diagnostic?.hasEnoughData),
    inputs,
    skills,
    domains,
    activeDomainCount,
    totalSkillCount,
    output,
    thinkingLine: buildThinkingLine(
      visitorCount,
      hasOrders,
      diagnostic,
      segments.length,
      sortedRecs.length,
    ),
  };
}

export function formatBrainForAi(brain: StoreBrain): string {
  const modes = countSkillsByMode(brain.domains.map((d) => d.status));
  return JSON.stringify(
    {
      thinkingLine: brain.thinkingLine,
      confidence: brain.output.confidence,
      verdict: brain.output.verdict,
      verdictSharp: brain.output.verdictSharp,
      adReadinessScore: brain.output.score,
      readyForAds: brain.output.readyForAds,
      summary: brain.output.summary,
      todayAction: brain.output.todayAction,
      activeInputs: brain.inputs.filter((i) => i.status === "active").map((i) => i.label),
      activeSkills: brain.skills.filter((s) => s.status === "active").map((s) => s.label),
      cmoDomains: brain.domains.map((d) => ({
        label: d.label,
        status: d.status,
        activeSkills: d.activeCount,
        headline: d.headline,
      })),
      activeDomainCount: brain.activeDomainCount,
      skillLibrary: {
        total: 100,
        liveData: modes.live,
        aiGuidance: modes.ai,
        needsIntegration: modes.blocked,
        executableNow: modes.trainableNow,
      },
      skillTraining: buildSkillTrainingBlock(brain),
    },
    null,
    2,
  );
}
