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
      detail: "Turn on the Solution embed in your theme (30 seconds).",
      done: input.hasVisitorData,
      href: input.themeEmbedUrl,
      external: true,
    },
    {
      id: "data",
      label: "Collect store data",
      detail: input.hasShopifyData
        ? "Shopify orders connected."
        : "Browse your storefront or sync Shopify orders (Pro).",
      done: trackingDone,
      href: "/app/analytics",
    },
    {
      id: "insight",
      label: "Get your first insight",
      detail: "Generate AI recommendations from your data.",
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
