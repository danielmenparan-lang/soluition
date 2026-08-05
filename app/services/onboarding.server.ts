import { hasWorkingTracking } from "../utils/store-readiness";

export type OnboardingStep = {
  id: "embed" | "data" | "insight";
  label: string;
  detail: string;
  done: boolean;
  href?: string;
  external?: boolean;
};

export type OnboardingProgress = {
  steps: OnboardingStep[];
  completedCount: number;
  totalSteps: number;
  isComplete: boolean;
  progressPct: number;
};

type BuildOnboardingInput = {
  totalVisitors: number;
  hasShopifyOrders: boolean;
  hasRecommendations: boolean;
  themeEmbedUrl: string;
};

export function buildOnboardingProgress(
  input: BuildOnboardingInput,
): OnboardingProgress {
  const trackingWorking = hasWorkingTracking(
    input.totalVisitors,
    input.hasShopifyOrders,
  );
  const steps: OnboardingStep[] = [
    {
      id: "embed",
      label: "Turn on tracking",
      detail: "Open your theme editor and enable the Solution app embed — about 2 minutes.",
      done: trackingWorking,
      href: input.themeEmbedUrl,
      external: true,
    },
    {
      id: "data",
      label: "Visit your store once",
      detail: "Open your live storefront and browse 2–3 pages so we can read your funnel.",
      done: trackingWorking,
      href: "/app/analytics",
    },
    {
      id: "insight",
      label: "Get your first action",
      detail: "Scan your store — one clear marketing move appears here on Home.",
      done: input.hasRecommendations && trackingWorking,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  return {
    steps,
    completedCount,
    totalSteps: steps.length,
    isComplete: completedCount === steps.length,
    progressPct: Math.round((completedCount / steps.length) * 100),
  };
}
