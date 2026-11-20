import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Menu, X } from "lucide-react";
import { ShowcaseTopbarActions, ShowcaseNotifications } from "./topbar-interactions";
import { DemoWorkbenchPreview } from "@/components/workbench/demo-workbench-preview";
import { CockpitPreview } from "@/components/workbench/cockpit/cockpit-preview";
import { ConsoleNavigation } from "@/components/workbench/console/console-navigation";
import { ShowcaseNavigation, useRouter } from "./next-navigation";
import "@/app/globals.css";
import "./showcase.css";

// Vuexy-style outlined panel icon, with direction reflecting the sidebar state.
function SidebarToggleGlyph({ collapsed }: { collapsed: boolean }) {
  return <svg className="showcase-sidebar-toggle-glyph" width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="2.25" y="2.5" width="15.5" height="15" rx="2.25" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7.25 3.5V16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    {collapsed
      ? <path d="M10.25 10H15M12.5 7.75L15 10L12.5 12.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      : <path d="M15 10H10.25M12.75 7.75L10.25 10L12.75 12.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
  </svg>;
}

function Showcase() {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [readNoticeIds,setReadNoticeIds] = useState<number[]>([4]);
  // Preserve the selected theme across refreshes and direct navigation.
  const [isLightTheme, setIsLightTheme] = useState(() => {
    try { return window.localStorage.getItem("shuomi-showcase-theme") === "light"; }
    catch { return false; }
  });
  // Match the document-level theme to the preview. Portaled menus and dialogs
  // render outside .showcase-shell and otherwise inherit the dark root palette.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", isLightTheme);
    root.classList.toggle("dark", !isLightTheme);
    root.style.colorScheme = isLightTheme ? "light" : "dark";
    try { window.localStorage.setItem("shuomi-showcase-theme", isLightTheme ? "light" : "dark"); }
    catch { /* Storage can be blocked; theme still works for this session. */ }
    return () => {
      root.classList.remove("light", "dark");
      root.style.removeProperty("color-scheme");
    };
  }, [isLightTheme]);
  useEffect(() => { setMobileMenuOpen(false); }, [router.pathname]);
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileMenuOpen(false); };
    const onDesktop = () => { if (window.innerWidth > 900) setMobileMenuOpen(false); };
    window.addEventListener("keydown", onEscape);
    window.addEventListener("resize", onDesktop);
    return () => { window.removeEventListener("keydown", onEscape); window.removeEventListener("resize", onDesktop); };
  }, [mobileMenuOpen]);
  const cockpitPermissions = ["workbench.cockpit.goals.read", "workbench.cockpit.stores.read", "workbench.cockpit.alerts.read", "workbench.cockpit.advice.read"];
  return <div className={isLightTheme ? "light" : "dark"}>
  <div className="console-frame showcase-shell console-theme" data-sidebar-collapsed={sidebarCollapsed || undefined} data-mobile-menu-open={mobileMenuOpen || undefined}>
    {mobileMenuOpen && <button type="button" className="showcase-sidebar-backdrop" aria-label="关闭导航菜单" onClick={() => setMobileMenuOpen(false)} />}
    <aside className="console-sidebar showcase-sidebar" id="workbench-desktop-navigation" data-mobile-open={mobileMenuOpen || undefined}>
      <div className="console-sidebar-head"><a className="console-brand" href="/shuomi/#/workbench" aria-label="硕米智能引擎首页" onClick={event => { event.preventDefault(); router.push("/workbench"); }}><img src="/shuomi/console/sumi-logo.png" alt="" width="42" height="42" /><span className="console-brand-label"><strong>硕米智能引擎</strong><small>SHUOMI AI ENGINE</small></span></a><button className="showcase-sidebar-mobile-close" type="button" aria-label="关闭侧边栏" title="关闭侧边栏" onClick={() => setMobileMenuOpen(false)}><X size={20} aria-hidden="true" /></button><button className="console-sidebar-toggle" type="button" aria-label={sidebarCollapsed ? "展开侧栏" : "收窄侧栏"} title={sidebarCollapsed ? "展开侧栏" : "收窄侧栏"} aria-expanded={!sidebarCollapsed} aria-controls="workbench-desktop-navigation" onClick={() => setSidebarCollapsed(value => !value)}><SidebarToggleGlyph collapsed={sidebarCollapsed} /></button></div>
      <ConsoleNavigation pathname={router.pathname} ariaLabel="工作台导航" onNavigate={() => setMobileMenuOpen(false)} showcaseMode dataServicesAvailable reportCenterAvailable toolMarketAvailable supplyMarketAvailable productAcquisitionAvailable productCollectionsAvailable supplyChainAvailable supplyPreparationAvailable supplyCompletionDraftsAvailable knowledgeAvailable projectCenterAvailable operationsCockpitAvailable cockpitPermissions={cockpitPermissions} storeProductsAvailable storeOrdersAvailable fulfillmentAvailable aiWorkbenchAvailable nativeRunsAvailable={false} productReviewAvailable ecoservicesAvailable sheinRecordsAvailable />
    </aside>
    <div className="showcase-main">
      <header className="showcase-topbar">
        <button className="showcase-mobile-menu-toggle" type="button" aria-label="打开侧边栏" aria-expanded={mobileMenuOpen} aria-controls="workbench-desktop-navigation" onClick={() => setMobileMenuOpen(true)}><Menu size={22} aria-hidden="true" /></button>
        <div className="showcase-brand-message"><strong>打造属于自己的AI电商团队</strong><span>SHUOMI AI ENGINE</span></div>
        <ShowcaseTopbarActions navigate={router.push} pathname={router.pathname} light={isLightTheme} onTheme={() => setIsLightTheme(value => !value)} read={readNoticeIds} />
      </header>
      <main className="showcase-content">{router.pathname === "/workbench/notifications" ? <ShowcaseNotifications navigate={router.push} read={readNoticeIds} markRead={id => setReadNoticeIds(ids => ids.includes(id) ? ids : [...ids,id])} markAll={ids => setReadNoticeIds(current => [...new Set([...current,...ids])])} /> : router.pathname === "/workbench" ? <CockpitPreview /> : <DemoWorkbenchPreview pathname={router.pathname} />}</main>
    </div>
  </div>;
  </div>;
}

createRoot(document.getElementById("root")!).render(<ShowcaseNavigation><Showcase /></ShowcaseNavigation>);
