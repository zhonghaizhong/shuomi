import type { AnchorHTMLAttributes, ReactNode } from "react";
import { useRouter } from "./next-navigation";

export default function Link({ href, children, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode; prefetch?: boolean }) {
  const router = useRouter();
  return <a {...props} href={`/shuomi/#${href.startsWith("/") ? href : `/${href}`}`} onClick={event => {
    onClick?.(event);
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    router.push(href);
  }}>{children}</a>;
}
