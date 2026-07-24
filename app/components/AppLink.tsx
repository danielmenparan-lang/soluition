import { type AnchorHTMLAttributes } from "react";
import { useNavigate, useSearchParams } from "react-router";

function appendSearchParams(path: string, search: string): string {
  if (!search) return path;
  return path.includes("?") ? `${path}&${search}` : `${path}?${search}`;
}

function resolvePath(to: string, query: string): string {
  return appendSearchParams(to, query);
}

type AppLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
};

export function AppLink({ to, onClick, ...props }: AppLinkProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.toString();
  const href = resolvePath(to, query);

  return (
    <a
      href={href}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        navigate(href);
      }}
    />
  );
}
