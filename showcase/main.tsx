import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Bell, Headset, MoonStar, PanelLeftClose, PanelLeftOpen, UserRound } from "lucide-react";
import { DemoWorkbenchPreview } from "@/components/workbench/demo-workbench-preview";
import { CockpitPreview } from "@/components/workbench/cockpit/cockpit-preview";
import { ConsoleNavigation } from "@/components/workbench/console/console-navigation";
import { ShowcaseNavigation, useRouter } from "./next-navigation";
import "@/app/globals.css";
import "./showcase.css";

function Showcase() {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [isLightTheme, setIsLightTheme] = useState(false);
  const cockpitPermissions = ["workbench.cockpit.goals.read", "workbench.cockpit.stores.read", "workbench.cockpit.alerts.read", "workbench.cockpit.advice.read"];
  return <div className={isLightTheme ? "light" : "dark"}>
  <div className="console-frame showcase-shell console-theme" data-sidebar-collapsed={sidebarCollapsed || undefined}>
    <aside className="console-sidebar showcase-sidebar" id="workbench-desktop-navigation">
      <div className="console-sidebar-head"><a className="console-brand" href="/shuomi/#/workbench" aria-label="硕米智能引擎首页" onClick={event => { event.preventDefault(); router.push("/workbench"); }}><img src="/shuomi/console/sumi-logo.png" alt="" width="42" height="42" /><span className="console-brand-label"><strong>硕米智能引擎</strong><small>SUMI AI ENGINE</small></span></a><button className="console-sidebar-toggle" type="button" aria-label={sidebarCollapsed ? "展开侧栏" : "收窄侧栏"} title={sidebarCollapsed ? "展开侧栏" : "收窄侧栏"} aria-expanded={!sidebarCollapsed} aria-controls="workbench-desktop-navigation" onClick={() => setSidebarCollapsed(value => !value)}>{sidebarCollapsed ? <PanelLeftOpen aria-hidden="true" size={18} /> : <PanelLeftClose aria-hidden="true" size={18} />}</button></div>
      <ConsoleNavigation pathname={router.pathname} ariaLabel="工作台导航" showcaseMode dataServicesAvailable reportCenterAvailable toolMarketAvailable supplyMarketAvailable productAcquisitionAvailable productCollectionsAvailable supplyChainAvailable supplyPreparationAvailable supplyCompletionDraftsAvailable knowledgeAvailable projectCenterAvailable operationsCockpitAvailable cockpitPermissions={cockpitPermissions} storeProductsAvailable storeOrdersAvailable fulfillmentAvailable aiWorkbenchAvailable nativeRunsAvailable={false} productReviewAvailable ecoservicesAvailable sheinRecordsAvailable />
    </aside>
    <div className="showcase-main">
      <header className="showcase-topbar">
        <div className="showcase-brand-message"><strong>打造属于自己的AI电商团队</strong><span>SHUOMI AI ENGINE</span></div>
        <div className="showcase-top-actions" aria-label="全局操作">
          <a className="showcase-action-icon" href="mailto:support@shuomiai.com" aria-label="联系客户" title="联系客户"><Headset size={19} aria-hidden="true" /></a>
          <div className="showcase-action-wrap"><button className="showcase-action-icon" type="button" aria-label="通知" title="通知" aria-expanded={showNotifications} onClick={() => { setShowNotifications(value => !value); setShowAccount(false); }}><Bell size={19} aria-hidden="true" /><i className="showcase-notification-dot" /></button>{showNotifications ? <div className="showcase-action-popover"><strong>通知</strong><span>3 条未读通知</span></div> : null}</div>
          <button className="showcase-action-icon" type="button" aria-label={isLightTheme ? "切换深色主题" : "切换浅色主题"} title={isLightTheme ? "切换深色主题" : "切换浅色主题"} onClick={() => setIsLightTheme(value => !value)}><MoonStar size={19} aria-hidden="true" /></button>
          <div className="showcase-action-wrap"><button className="showcase-account-icon" type="button" aria-label="示例用户账户" title="示例用户" aria-expanded={showAccount} onClick={() => { setShowAccount(value => !value); setShowNotifications(false); }}><UserRound size={21} aria-hidden="true" /><i /></button>{showAccount ? <div className="showcase-action-popover"><strong>示例用户</strong><span>演示账户</span></div> : null}</div>
        </div>
      </header>
      <main className="showcase-content">{router.pathname === "/workbench" ? <CockpitPreview /> : <DemoWorkbenchPreview pathname={router.pathname} />}</main>
    </div>
  </div>;
  </div>;
}

createRoot(document.getElementById("root")!).render(<ShowcaseNavigation><Showcase /></ShowcaseNavigation>);
