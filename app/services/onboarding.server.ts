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
      label: "Enable store tracking",
      detail: "Required to see your funnel and where visitors drop off.",
      done: input.hasVisitorData,
      href: input.themeEmbedUrl,
      external: true,
    },
    {
      id: "data",
      label: "Collect conversion data",
      detail: input.hasShopifyData
        ? "Orders synced — funnel + revenue active."
        : "Browse your storefront or sync orders (Starter+) to diagnose blockers.",
      done: trackingDone,
      href: "/app/analytics",
    },
    {
      id: "insight",
      label: "Get marketing actions",
      detail: "Scan your store data — ranked marketing steps appear on Home.",
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
