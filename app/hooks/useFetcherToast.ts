import { useEffect, useRef } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

type FetcherLike = {
  state: string;
  data?: {
    success?: boolean;
    message?: string;
    error?: string;
  } | null;
};

export function useFetcherToast(fetcher: FetcherLike) {
  const shopify = useAppBridge();
  const toastedRef = useRef<unknown>(null);

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if (fetcher.data === toastedRef.current) return;

    toastedRef.current = fetcher.data;

    if (fetcher.data.message) {
      shopify.toast.show(fetcher.data.message);
    } else if (fetcher.data.error) {
      shopify.toast.show(fetcher.data.error);
    }
  }, [fetcher.state, fetcher.data, shopify]);
}
