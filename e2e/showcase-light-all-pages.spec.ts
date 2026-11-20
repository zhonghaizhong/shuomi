import { test, expect } from "@playwright/test";
import { consoleNavigation, type ConsoleNavNode } from "../src/lib/workbench/console-navigation";

/** Comprehensive light-mode traversal: every known sidebar level and standalone
 * showcase detail page. A route is opened in Chromium, not just statically scanned. */
function navigationRoutes(nodes: readonly ConsoleNavNode[]): string[] {
  const found: string[] = [];
  for (const n of nodes) {
    if (n.href.startsWith("/workbench") && !n.href.includes("["))
      found.push(n.href.split("#")[0]);
    if (n.children) found.push(...navigationRoutes(n.children));
  }
  return found;
}
const detailRoutes = [
  "/workbench/ai/chat/new", "/workbench/ai/chat/recent",
  "/workbench/ai/chat/saved", "/workbench/ai/chat/archived",
  "/workbench/ai/tasks/running", "/workbench/ai/tasks/pending",
  "/workbench/ai/tasks/completed", "/workbench/ai/tasks/errors",
  "/workbench/ai/tasks/scheduled",
  "/workbench/ai/projects/active", "/workbench/ai/projects/recent",
  "/workbench/ai/projects/templates", "/workbench/ai/projects/archived",
  "/workbench/ai/projects/mine", "/workbench/tools/custom/new",
  "/workbench/tools/custom/progress", "/workbench/agents/custom/new",
  "/workbench/agents/custom/progress",
  "/workbench/store-products", "/workbench/store-orders",
  "/workbench/overview/goals/settings",
  "/workbench/account/organization/resources/source-accounts",
  "/workbench/data/mine/own/new",
  "/workbench/store-orders/fulfill", "/workbench/store-orders/records",
];
const routes = [...new Set(["/workbench", ...navigationRoutes(consoleNavigation), ...detailRoutes])];
const CHUNK_SIZE = 8;
const chunks: string[][] = [];
for (let i = 0; i < routes.length; i += CHUNK_SIZE) chunks.push(routes.slice(i,i+CHUNK_SIZE));

type Audit = {
  darkSurfaces: {selector:string;background:string,area:number}[];
  missingContrast: {text:string,ratio:number,foreground:string,background:string,selector:string,parent:string}[];
  path:string;
};
const auditInBrowser = () => {
  const main = document.querySelector("main.showcase-content");
  if (!main) return { darkSurfaces:[], missingContrast:[], path:location.hash } as Audit;
  const darkSurfaces: Audit["darkSurfaces"] = [];
  const missingContrast: Audit["missingContrast"] = [];
  function channels(c:string):number[]|null {
    if (!c || c==="transparent") return null;
    const values = c.match(/[\d.]+/g)?.slice(0,3).map(Number);
    if (!values || values.length!==3) return null;
    return c.startsWith("color(srgb")?values.map(v=>v*255):values;
  }
  function lightness(rgb:number[]):number {
    const lin = rgb.map(value => {const n=value/255;return n<=.04045?n/12.92:Math.pow((n+.055)/1.055,2.4);});
    return lin[0]*.2126+lin[1]*.7152+lin[2]*.0722;
  }
  function opaqueBackground(el:Element):number[]|null {
    let current:Element|null=el;
    while(current) {
      const style=getComputedStyle(current);
      if(style.backgroundImage!=="none") return null;
      const rgba=style.backgroundColor;
      if(rgba && rgba!=="transparent" && !rgba.startsWith("rgba(0, 0, 0, 0)")) {
        const m = rgba.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/);
        if(m && Number(m[1])<.98){current=current.parentElement;continue;}
        return channels(rgba);
      }
      current=current.parentElement;
    }
    return null;
  }
  const excluded = '[class*="overviewFeature"],[class*="featureMetric"],canvas,svg,[class*="globe"]';
  for(const el of Array.from(main.querySelectorAll('section,article,aside,textarea,[class*="card"],[class*="Card"],[class*="panel"],[class*="Panel"]')).slice(0,500)) {
    if(el.closest(excluded))continue;
    const box=el.getBoundingClientRect();
    if(box.width<135 || box.height<65 || box.width*box.height<13000 || box.bottom<0 || box.top>innerHeight) continue;
    const css=getComputedStyle(el);
    if(css.backgroundImage!=="none")continue;
    const rgb=channels(css.backgroundColor);
    if(!rgb || css.backgroundColor.startsWith("rgba(0, 0, 0, 0)"))continue;
    const luminance=lightness(rgb);
    if(luminance<.27){
      darkSurfaces.push({selector:el.tagName.toLowerCase()+"."+(String(el.className).split(" ")[0]||""),background:css.backgroundColor,area:Math.round(box.width*box.height)});
    }
  }
  for (const el of Array.from(main.querySelectorAll('h1,h2,h3,h4,p,label,small,span,button,a,strong,td,th')).slice(0,600)) {
    if(el.closest(excluded))continue;
    const box=el.getBoundingClientRect();
    if(box.width<3 || box.height<7 || box.bottom<0 || box.top>innerHeight)continue;
    const text=(el.textContent||"").trim().slice(0,28);
    if(!text)continue;
    const css=getComputedStyle(el);
    if(css.visibility!=="visible" || css.opacity==="0" || css.display==="none")continue;
    const fore=channels(css.color),back=opaqueBackground(el);
    if(!fore || !back)continue;
    const a=lightness(fore),b=lightness(back);
    const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    if(ratio<2.5)missingContrast.push({text,ratio:Number(ratio.toFixed(2)),foreground:css.color,background:back.map(v=>Math.round(v)).join(","),selector:el.tagName.toLowerCase()+"."+String(el.className).split(" ")[0],parent:el.parentElement?.tagName.toLowerCase()+"."+String(el.parentElement?.className||"").split(" ")[0]});
  }
  return {darkSurfaces:darkSurfaces.slice(0,20),missingContrast:missingContrast.slice(0,25),path:location.hash} as Audit;
};

test.describe("click-through light-mode visual audit of every workbench menu route",()=>{
  test.describe.configure({mode:"parallel"});
  for(const [index,chunk] of chunks.entries()) {
    test("route batch "+(index+1)+"/"+chunks.length,async ({page},testInfo)=>{
      test.setTimeout(120000);
      await page.setViewportSize({width:1440,height:900});
      await page.goto("/shuomi/#/workbench/ai/chat/new");
      await page.getByRole("button",{name:"切换浅色主题"}).click();
      const failures:string[]=[];
      for(const route of chunk) {
        await page.goto("/shuomi/#"+route);
        await expect(page.locator(".light .showcase-shell")).toBeVisible();
        await expect(page.locator("main.showcase-content")).toBeVisible();
        await page.screenshot({path:testInfo.outputPath("light-"+route.replace(/[^a-z0-9]+/gi,"-")+".png"),fullPage:false});
        const audit=await page.evaluate(auditInBrowser);
        if(audit.darkSurfaces.length || audit.missingContrast.length) {
          failures.push(route+": "+JSON.stringify(audit));
        }
      }
      expect(failures,"Light-mode visual issues on visited pages").toEqual([]);
    });
  }
});

test("click sidebar submenu links and verify theme is preserved",async ({page})=>{
  await page.goto("/shuomi/#/workbench/ai/chat/new");
  await page.getByRole("button",{name:"切换浅色主题"}).click();
  const nav=page.getByRole("navigation",{name:"工作台导航"});
  for(const [name,part] of [["最近会话","/workbench/ai/chat/recent"],["收藏会话","/workbench/ai/chat/saved"]] as const) {
    await nav.getByRole("link",{name,exact:true}).click();
    await expect(page).toHaveURL(new RegExp("#"+part+"$"));
    await expect(page.locator(".light .showcase-shell")).toBeVisible();
  }
});
