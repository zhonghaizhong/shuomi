import type { AnchorHTMLAttributes, ReactNode } from "react";
import { useRouter } from "./next-navigation";

export default function Link({ href, children, onClick, prefetch: _prefetch, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode; prefetch?: boolean }) {
  const router = useRouter();
  const path = href.startsWith("/") ? href : `/${href}`;
  return <a {...props} href={`/shuomi/#${path}`} onClick={event => {
    onClick?.(event);
    // Keep native browser behavior for modified clicks, new tabs and downloads.
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target === "_blank" || props.download) return;
    event.preventDefault();
    router.push(href);
  }}>{children}</a>;
}
