import {
  useFetcher,
  useLocation,
  useMatches,
  useSearchParams,
  type FetcherSubmitOptions,
} from "react-router";
import { useCallback, useMemo } from "react";

type SubmitTarget = Parameters<ReturnType<typeof useFetcher>["submit"]>[0];

function isIndexRoute(matches: ReturnType<typeof useMatches>): boolean {
  if (matches.length < 2) return false;
  const leaf = matches[matches.length - 1];
  const parent = matches[matches.length - 2];
  return leaf.pathname === parent.pathname;
}

/** Index routes share the parent URL — POST must target ?index or React Router returns 405. */
function needsIndexParam(
  pathname: string,
  targetPath: string,
  matches: ReturnType<typeof useMatches>,
): boolean {
  if (targetPath !== pathname) return false;
  if (pathname === "/app") return true;
  return isIndexRoute(matches);
}

function buildActionUrl(
  pathname: string,
  searchParams: URLSearchParams,
  matches: ReturnType<typeof useMatches>,
  targetPath: string,
): string {
  const params = new URLSearchParams(searchParams.toString());

  if (needsIndexParam(pathname, targetPath, matches)) {
    params.set("index", "");
  }

  const query = params.toString();
  return query ? `${targetPath}?${query}` : targetPath;
}

export function useShopifyFetcher<T>() {
  const fetcher = useFetcher<T>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const matches = useMatches();

  const actionUrl = useMemo(
    () =>
      buildActionUrl(
        location.pathname,
        searchParams,
        matches,
        location.pathname,
      ),
    [location.pathname, searchParams, matches],
  );

  const submit = useCallback(
    (target: SubmitTarget, options?: FetcherSubmitOptions) => {
      const actionPath =
        typeof options?.action === "string"
          ? options.action.split("?")[0]
          : location.pathname;

      const action = buildActionUrl(
        location.pathname,
        searchParams,
        matches,
        actionPath,
      );

      fetcher.submit(target, { ...options, action });
    },
    [fetcher, location.pathname, searchParams, matches],
  );

  return useMemo(
    () => ({ ...fetcher, submit, actionUrl, Form: fetcher.Form }),
    [fetcher, submit, actionUrl],
  );
}
