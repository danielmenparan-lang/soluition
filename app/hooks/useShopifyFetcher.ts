import {
  useFetcher,
  useLocation,
  useMatches,
  useSearchParams,
  type FetcherSubmitOptions,
} from "react-router";

type SubmitTarget = Parameters<ReturnType<typeof useFetcher>["submit"]>[0];

function isIndexRoute(matches: ReturnType<typeof useMatches>): boolean {
  if (matches.length < 2) return false;
  const leaf = matches[matches.length - 1];
  const parent = matches[matches.length - 2];
  return leaf.pathname === parent.pathname;
}

export function useShopifyFetcher<T>() {
  const fetcher = useFetcher<T>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const matches = useMatches();

  const submit = (target: SubmitTarget, options?: FetcherSubmitOptions) => {
    const actionPath =
      typeof options?.action === "string"
        ? options.action.split("?")[0]
        : location.pathname;

    const params = new URLSearchParams(searchParams.toString());

    if (isIndexRoute(matches) && actionPath === location.pathname) {
      params.set("index", "");
    }

    const query = params.toString();
    const action = query ? `${actionPath}?${query}` : actionPath;

    fetcher.submit(target, { ...options, action });
  };

  return { ...fetcher, submit };
}
