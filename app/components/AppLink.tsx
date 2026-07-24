import { Link, type LinkProps, useSearchParams } from "react-router";

function appendSearchParams(path: string, search: string): string {
  if (!search) return path;
  return path.includes("?") ? `${path}&${search}` : `${path}?${search}`;
}

export function AppLink({ to, ...props }: LinkProps) {
  const [searchParams] = useSearchParams();
  const query = searchParams.toString();

  if (typeof to === "string") {
    return <Link to={appendSearchParams(to, query)} {...props} />;
  }

  if (typeof to === "object" && to !== null) {
    const pathname = typeof to.pathname === "string" ? to.pathname : "";
    const existingSearch =
      typeof to.search === "string" ? to.search.replace(/^\?/, "") : "";
    const mergedSearch = [existingSearch, query].filter(Boolean).join("&");

    return (
      <Link
        to={{
          ...to,
          pathname,
          search: mergedSearch ? `?${mergedSearch}` : undefined,
        }}
        {...props}
      />
    );
  }

  return <Link to={to} {...props} />;
}
