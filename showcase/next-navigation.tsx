import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Navigation = { pathname: string; push: (href: string) => void };
const Context = createContext<Navigation>({ pathname: "/workbench", push: () => undefined });

export function ShowcaseNavigation({ children }: { children: ReactNode }) {
  const base = "/shuomi";
  const readPath = () => {
    const hashRoute = window.location.hash.slice(1);
    if (hashRoute.startsWith("/")) return hashRoute.split("?")[0] || "/workbench";
    const raw = window.location.pathname;
    const withoutBase = raw.startsWith(base) ? raw.slice(base.length) : raw;
    return withoutBase && withoutBase !== "/" ? withoutBase : "/workbench";
  };
  const [pathname, setPathname] = useState(readPath);
  useEffect(() => {
    const sync = () => setPathname(readPath());
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => { window.removeEventListener("popstate", sync); window.removeEventListener("hashchange", sync); };
  }, []);
  const navigation = useMemo<Navigation>(() => ({
    pathname,
    push(href) {
      const [path, search = ""] = href.split("?");
      const clean = path?.startsWith("/") ? path : `/${path}`;
      window.location.hash = `${clean}${search ? `?${search}` : ""}`;
      setPathname(clean);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
  }), [pathname]);
  return <Context.Provider value={navigation}>{children}</Context.Provider>;
}

export function useRouter() { return useContext(Context); }
export function usePathname() { return useContext(Context).pathname; }
export function useSearchParams() { return new URLSearchParams(window.location.hash.split("?").slice(1).join("?")); }
