import { useCallback, useEffect, useMemo, useRef } from "react";
import type { useShopifyFetcher } from "../hooks/useShopifyFetcher";
import {
  clearAutoGenerateLock,
  isAutoGenerateLocked,
  setAutoGenerateLock,
} from "../utils/auto-generate-lock";

type ShopifyFetcher = ReturnType<typeof useShopifyFetcher>;

type AutoGenerateRecommendationsProps = {
  shopId: string;
  fetcher: ShopifyFetcher;
  hasRecommendations: boolean;
  enabled?: boolean;
  intent?: string;
};

export function AutoGenerateRecommendations({
  shopId,
  fetcher,
  hasRecommendations,
  enabled = true,
  intent,
}: AutoGenerateRecommendationsProps) {
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (fetcher.state !== "idle") return;

    if (
      fetcher.data &&
      typeof fetcher.data === "object" &&
      "success" in fetcher.data &&
      fetcher.data.success === false
    ) {
      attemptedRef.current = false;
      clearAutoGenerateLock(shopId);
    }
  }, [fetcher.state, fetcher.data, shopId]);

  useEffect(() => {
    if (!enabled || hasRecommendations || attemptedRef.current) return;
    if (fetcher.state !== "idle") return;
    if (isAutoGenerateLocked(shopId)) return;

    attemptedRef.current = true;
    setAutoGenerateLock(shopId);
    fetcher.submit(intent ? { intent } : {}, { method: "POST" });
  }, [
    enabled,
    hasRecommendations,
    shopId,
    intent,
    fetcher.state,
    fetcher.submit,
  ]);

  return null;
}
