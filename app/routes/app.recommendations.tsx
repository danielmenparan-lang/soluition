import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
  ShouldRevalidateFunctionArgs,
} from "react-router";
import { useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useEffect } from "react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { useShopifyFetcher } from "../hooks/useShopifyFetcher";
import { SubmitButton } from "../components/SubmitButton";
import { AutoGenerateRecommendations } from "../components/AutoGenerateRecommendations";
import { RecommendationCard } from "../components/ui/RecommendationCard";
import { EmptyState } from "../components/ui/EmptyState";
import { CATEGORY_LABELS } from "../components/ui/labels";
import { getOrCreateShop } from "../services/shop.server";
import {
  generateRecommendations,
  getRecommendations,
} from "../services/ai.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const recommendations = await getRecommendations(shop.id);
  return { recommendations };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

  try {
    await generateRecommendations(shop.id);
    return { success: true, message: "המלצות חדשות נוצרו בהצלחה" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "יצירת המלצות נכשלה";
    return { success: false, message };
  }
};

export default function Recommendations() {
  const { recommendations } = useLoaderData<typeof loader>();
  const fetcher = useShopifyFetcher<typeof action>();
  const shopify = useAppBridge();
  const isGenerating = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.data?.message) {
      shopify.toast.show(fetcher.data.message);
    } else if (fetcher.data?.success) {
      shopify.toast.show("המלצות חדשות נוצרו");
    }
  }, [fetcher.data, shopify]);

  const grouped = recommendations.reduce(
    (acc, rec) => {
      const cat = rec.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(rec);
      return acc;
    },
    {} as Record<string, typeof recommendations>,
  );

  return (
    <s-page heading="המלצות AI">
      <AutoGenerateRecommendations
        fetcher={fetcher}
        hasRecommendations={recommendations.length > 0}
      />
      <SubmitButton fetcher={fetcher} slot="primary-action">
        {isGenerating ? "מייצר..." : "יצירת המלצות חדשות"}
      </SubmitButton>

      <s-section>
        <p className="ms-page-intro">
          Claude מנתח את נתוני החנות שלך — תנועה, מוצרים, קהלים — ומציע פעולות
          שיווק ממוקדות עם עדיפות והשפעה צפויה.
        </p>
      </s-section>

      {isGenerating && (
        <s-section>
          <s-banner tone="info">
            <s-paragraph>
              מושך נתונים מ-Supabase, שולח ל-Claude, ושומר המלצות...
            </s-paragraph>
          </s-banner>
        </s-section>
      )}

      {recommendations.length === 0 ? (
        <s-section>
          <EmptyState
            title="אין המלצות עדיין"
            description="ההמלצות ייווצרו אוטומטית בכניסה לדף, או לחץ על הכפתור למעלה."
            action={
              <SubmitButton fetcher={fetcher}>
                {isGenerating ? "מייצר..." : "יצירת המלצות עכשיו"}
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
