import getSupabase from "../supabase.server";
import type { AIRecommendation } from "../types/database.types";

export type RecommendationStatus = "active" | "dismissed" | "completed";

export async function updateRecommendationStatus(
  shopId: string,
  recommendationId: string,
  status: RecommendationStatus,
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("ai_recommendations")
    .update({ status })
    .eq("id", recommendationId)
    .eq("shop_id", shopId);

  if (error) {
    throw new Error(`Failed to update recommendation: ${error.message}`);
  }
}

export function sortByPriority(recs: AIRecommendation[]): AIRecommendation[] {
  const order = { high: 0, medium: 1, low: 2 };
  return [...recs].sort(
    (a, b) =>
      (order[a.priority as keyof typeof order] ?? 9) -
      (order[b.priority as keyof typeof order] ?? 9),
  );
}
