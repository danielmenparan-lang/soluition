import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
  ShouldRevalidateFunctionArgs,
} from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { useShopifyFetcher } from "../hooks/useShopifyFetcher";
import { useFetcherToast } from "../hooks/useFetcherToast";
import { SubmitButton } from "../components/SubmitButton";
import { AutoGenerateRecommendations } from "../components/AutoGenerateRecommendations";
import { RecommendationCard } from "../components/ui/RecommendationCard";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHero } from "../components/ui/PageHero";
import { HelpPanel } from "../components/ui/HelpPanel";
import { PAGE_HELP } from "../config/page-help";
import { CATEGORY_LABELS } from "../components/ui/labels";
import { getOrCreateShop } from "../services/shop.server";
import {
  generateRecommendations,
  getRecommendations,
} from "../services/ai.server";
import {
  assertCanOutput,
  recordOutput,
  UsageLimitError,
} from "../services/usage.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const recommendations = await getRecommendations(shop.id).catch(() => []);
  return { shop, recommendations };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

  try {
    await assertCanOutput(shop.id);
    await generateRecommendations(shop.id);
    await recordOutput(shop.id);
    return { success: true, message: "Recommendations are ready" };
  } catch (error) {
    if (error instanceof UsageLimitError) {
      return { success: false, message: error.message };
    }
    const message =
      error instanceof Error ? error.message : "Failed to generate recommendations";
    return { success: false, message };
  }
};

export default function Recommendations() {
  const { shop, recommendations } = useLoaderData<typeof loader>();
  const fetcher = useShopifyFetcher<typeof action>();
  const isGenerating = fetcher.state !== "idle";

  useFetcherToast(fetcher);
  const help = PAGE_HELP.recommendations;

  const grouped = recommendations.reduce(
    (acc, rec) => {
      const cat = rec.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(rec);
      return acc;
    },
    {} as Record<string, (typeof recommendations)[number][]>,
  );

  return (
    <s-page>
      <PageHero
        title={help.title}
        subtitle={help.subtitle}
        variant="ai"
        compact
      />
      <HelpPanel title={help.helpTitle} items={help.helpItems} />

      <AutoGenerateRecommendations
        shopId={shop.id}
        fetcher={fetcher}
        hasRecommendations={recommendations.length > 0}
      />
      <SubmitButton fetcher={fetcher} slot="primary-action">
        {isGenerating ? "Preparing..." : "New recommendations"}
      </SubmitButton>

      {isGenerating && (
        <s-section>
          <s-banner tone="info">
            <s-paragraph>Analyzing your data — one moment...</s-paragraph>
          </s-banner>
        </s-section>
      )}

      {recommendations.length === 0 ? (
        <s-section>
          <EmptyState
            title="No recommendations yet"
            description="Recommendations generate when you open this page, or click New recommendations above."
            action={
              <SubmitButton fetcher={fetcher}>
                {isGenerating ? "Preparing..." : "Get recommendations now"}
              </SubmitButton>
            }
          />
        </s-section>
      ) : (
        Object.entries(grouped).map(([category, recs]) => (
          <s-section
            key={category}
            heading={`${CATEGORY_LABELS[category] ?? category} (${recs.length})`}
          >
            <s-stack direction="block" gap="base">
              {recs.map((rec) => (
                <RecommendationCard key={rec.id} rec={rec} />
              ))}
            </s-stack>
          </s-section>
        ))
      )}
    </s-page>
  );
}

export function shouldRevalidate({
  formAction,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  if (formAction) return true;
  return defaultShouldRevalidate;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
