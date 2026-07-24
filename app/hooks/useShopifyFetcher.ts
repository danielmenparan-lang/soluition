import {
  useFetcher,
  useLocation,
  useSearchParams,
  type FetcherSubmitOptions,
} from "react-router";

type SubmitTarget = Parameters<ReturnType<typeof useFetcher>["submit"]>[0];

export function useShopifyFetcher<T>() {
  const fetcher = useFetcher<T>();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const submit = (target: SubmitTarget, options?: FetcherSubmitOptions) => {
    const query = searchParams.toString();
    const action =
      options?.action ??
      (query ? `${location.pathname}?${query}` : location.pathname);

    fetcher.submit(target, { ...options, action });
  };

  return { ...fetcher, submit };
}
