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
  hasVisitorData: boolean;
  hasShopifyData: boolean;
  hasRecommendations: boolean;
  themeEmbedUrl: string;
};

export function buildOnboardingProgress(
  input: BuildOnboardingInput,
): OnboardingProgress {
  const trackingDone = input.hasVisitorData || input.hasShopifyData;
  const steps: OnboardingStep[] = [
    {
      id: "embed",
      label: "Turn on tracking",
      detail: "Open your theme editor and enable the Solution app embed — about 2 minutes.",
      done: input.hasVisitorData,
      href: input.themeEmbedUrl,
      external: true,
    },
    {
      id: "data",
      label: "Visit your store once",
      detail: "Open your live storefront and browse 2–3 pages so we can read your funnel.",
      done: trackingDone,
      href: "/app/analytics",
    },
    {
      id: "insight",
      label: "Get your first action",
      detail: "Tap Scan for actions — you'll see one clear marketing move ranked first.",
      done: input.hasRecommendations,
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
