import { useState } from "react";
import { createRoot } from "react-dom/client";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { ShowcaseTopbarActions, ShowcaseNotifications } from "./topbar-interactions";
import { DemoWorkbenchPreview } from "@/components/workbench/demo-workbench-preview";
import { CockpitPreview } from "@/components/workbench/cockpit/cockpit-preview";
import { ConsoleNavigation } from "@/components/workbench/console/console-navigation";
import { ShowcaseNavigation, useRouter } from "./next-navigation";
import "@/app/globals.css";
import "./showcase.css";

function Showcase() {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [readNoticeIds,setReadNoticeIds] = useState<number[]>([4]);
  const [isLightTheme, setIsLightTheme] = useState(false);
  const cockpitPermissions = ["workbench.cockpit.goals.read", "workbench.cockpit.stores.read", "workbench.cockpit.alerts.read", "workbench.cockpit.advice.read"];
  return <div className={isLightTheme ? "light" : "dark"}>
  <div className="console-frame showcase-shell console-theme" data-sidebar-collapsed={sidebarCollapsed || undefined}>
    <aside className="console-sidebar showcase-sidebar" id="workbench-desktop-navigation">
      <div className="console-sidebar-head"><a className="console-brand" href="/shuomi/#/workbench" aria-label="硕米智能引擎首页" onClick={event => { event.preventDefault(); router.push("/workbench"); }}><img src="/shuomi/console/sumi-logo.png" alt="" width="42" height="42" /><span className="console-brand-label"><strong>硕米智能引擎</strong><small>SHUOMI AI ENGINE</small></span></a><button className="console-sidebar-toggle" type="button" aria-label={sidebarCollapsed ? "展开侧栏" : "收窄侧栏"} title={sidebarCollapsed ? "展开侧栏" : "收窄侧栏"} aria-expanded={!sidebarCollapsed} aria-controls="workbench-desktop-navigation" onClick={() => setSidebarCollapsed(value => !value)}>{sidebarCollapsed ? <PanelLeftOpen aria-hidden="true" size={18} /> : <PanelLeftClose aria-hidden="true" size={18} />}</button></div>
      <ConsoleNavigation pathname={router.pathname} ariaLabel="工作台导航" showcaseMode dataServicesAvailable reportCenterAvailable toolMarketAvailable supplyMarketAvailable productAcquisitionAvailable productCollectionsAvailable supplyChainAvailable supplyPreparationAvailable supplyCompletionDraftsAvailable knowledgeAvailable projectCenterAvailable operationsCockpitAvailable cockpitPermissions={cockpitPermissions} storeProductsAvailable storeOrdersAvailable fulfillmentAvailable aiWorkbenchAvailable nativeRunsAvailable={false} productReviewAvailable ecoservicesAvailable sheinRecordsAvailable />
    </aside>
    <div className="showcase-main">
      <header className="showcase-topbar">
        <div className="showcase-brand-message"><strong>打造属于自己的AI电商团队</strong><span>SHUOMI AI ENGINE</span></div>
        <ShowcaseTopbarActions navigate={router.push} pathname={router.pathname} light={isLightTheme} onTheme={() => setIsLightTheme(value => !value)} read={readNoticeIds} />
      </header>
      <main className="showcase-content">{router.pathname === "/workbench/notifications" ? <ShowcaseNotifications navigate={router.push} read={readNoticeIds} markRead={id => setReadNoticeIds(ids => ids.includes(id) ? ids : [...ids,id])} markAll={ids => setReadNoticeIds(current => [...new Set([...current,...ids])])} /> : router.pathname === "/workbench" ? <CockpitPreview /> : <DemoWorkbenchPreview pathname={router.pathname} />}</main>
    </div>
  </div>;
  </div>;
}

createRoot(document.getElementById("root")!).render(<ShowcaseNavigation><Showcase /></ShowcaseNavigation>);
