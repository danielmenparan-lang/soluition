import { useEffect, useRef } from "react";
import type { useShopifyFetcher } from "../hooks/useShopifyFetcher";

type ShopifyFetcher = ReturnType<typeof useShopifyFetcher>;

type AutoGenerateRecommendationsProps = {
  fetcher: ShopifyFetcher;
  hasRecommendations: boolean;
  enabled?: boolean;
  intent?: string;
};

export function AutoGenerateRecommendations({
  fetcher,
  hasRecommendations,
  enabled = true,
  intent,
}: AutoGenerateRecommendationsProps) {
  const started = useRef(false);

  useEffect(() => {
    if (!enabled || hasRecommendations || started.current || fetcher.state !== "idle") {
      return;
    }

    started.current = true;
    fetcher.submit(intent ? { intent } : {}, { method: "POST" });
  }, [enabled, hasRecommendations, fetcher, intent]);

  return null;
}
