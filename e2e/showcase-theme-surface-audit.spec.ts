import {expect,test} from "@playwright/test";

// Traverse actual registered navigation links instead of maintaining an incomplete route list.
const start="/shuomi/#/workbench";
test("all navigable showcase pages keep readable dark/light panels, nested cards and dialogs",async({page},testInfo)=>{
 test.setTimeout(360000);
 await page.setViewportSize({width:1440,height:900});
 await page.goto(start);
 // Expand the full menu tree so second- and third-level routes are included.
 const nav=page.getByRole("navigation",{name:"工作台导航"});
 for(let i=0;i<90;i++){
  const closed=nav.locator('button[aria-expanded="false"]:visible').first();
  if(!await closed.count())break;
  await closed.click();
 }
 const routes=await page.getByRole("navigation",{name:"工作台导航"}).locator('a[href*="#/workbench"]').evaluateAll(links=>
  [...new Set(links.map(a=>(a as HTMLAnchorElement).href.split("#")[1]).filter(Boolean))]
    .filter(p=>p.startsWith("/workbench"))
 );
 const failures:string[]=[];
 const coverage:{route:string;theme:string;panels:number;dialogs:number;contrastSamples:number}[]=[];
 for(const theme of ["dark","light"] as const){
  for(const route of routes){
   await page.goto("/shuomi/#"+route,{waitUntil:"domcontentloaded"});
   const themeToggle=page.getByRole("button",{name:theme==="light"?"切换浅色主题":"切换深色主题"});
   if(await themeToggle.count())await themeToggle.click();
   await expect(page.locator("html")).toHaveClass(new RegExp("\\b"+theme+"\\b"));
   const result=await page.locator("main.showcase-content").evaluate((main,expected)=>{
    const issues:string[]=[];
    const rgb=(v:string):number[]|null=>{
     const m=v.match(/^rgba?\(([^)]+)\)$/);
     if(!m)return null;
     const n=m[1].split(/[,\s/]+/).map(Number);
     return n.length>=3&&n.slice(0,3).every(Number.isFinite)?n.slice(0,3):null;
    };
    const lum=(c:number[])=>{const t=c.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return .2126*t[0]+.7152*t[1]+.0722*t[2]};
    const bg=(el:Element):number[]=>{
     for(let p:Element|null=el;p;p=p.parentElement){
      const computed=getComputedStyle(p),c=rgb(computed.backgroundColor);
      if(c&&computed.backgroundColor!=="rgba(0, 0, 0, 0)")return c;
     }
     return expected==="light"?[255,255,255]:[11,20,34];
    };
    const shown=(el:Element)=>{
     const r=el.getBoundingClientRect(),s=getComputedStyle(el);
     return r.width>10&&r.height>8&&s.visibility!=="hidden"&&s.display!=="none";
    };
    const panelElements=[...main.querySelectorAll('header,article,section,aside,[class*="card" i],[class*="panel" i],[class*="dialog" i]')]
      .filter(el=>shown(el)&&/header|card|panel|dialog|filter|metric|summary|surface/i.test(String((el as HTMLElement).className)) && !el.closest('[role="status"]'));
    let checked=0;
    for(const el of panelElements.slice(0,45)){
     const s=getComputedStyle(el),c=rgb(s.backgroundColor);
     if(!c||s.backgroundColor==="rgba(0, 0, 0, 0)")continue;
     const chroma=Math.max(...c)-Math.min(...c);
     if(chroma>70)continue; // Intentional colorful status/brand surfaces
     const lightness=lum(c);
     if(expected==="light"&&lightness<.52)issues.push("dark panel in light mode: "+String((el as HTMLElement).className).slice(0,80)+" "+s.backgroundColor);
     if(expected==="dark"&&lightness>.63)issues.push("light panel in dark mode: "+String((el as HTMLElement).className).slice(0,80)+" "+s.backgroundColor);
     checked++;
    }
    let samples=0;
    for(const el of [...main.querySelectorAll('h1,h2,h3,p,small,label,th,td')].filter(shown).slice(0,65)){
     const s=getComputedStyle(el),fg=rgb(s.color);
     if(!fg||Number.parseFloat(s.fontSize)<12)continue;
     const surface=bg(el),l1=lum(fg),l2=lum(surface),contrast=(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
     // The cockpit hero paints its background using a gradient; the
     // ancestor solid-color fallback is not the visible pixel color.
     // Its gradient text and copy are separately checked by cockpit tests.
     const gradientHero=Boolean(el.closest('[class*="overviewFeature"] [class*="heroCopy"]'));
     const clippedText=s.webkitTextFillColor==="rgba(0, 0, 0, 0)"&&s.backgroundClip==="text";
     if(contrast<3.8&&!gradientHero&&!clippedText)issues.push("low text contrast "+contrast.toFixed(2)+" "+el.tagName+" "+el.textContent?.trim().slice(0,35)+" | fg="+s.color+" bg="+surface.join(",")+" class="+String((el as HTMLElement).className).slice(0,55));
     samples++;
    }
    return {issues:issues.slice(0,25),panels:checked,dialogs:[...document.querySelectorAll('[role="dialog"],dialog[open]')].filter(shown).length,contrastSamples:samples};
   },theme);
   // Explicitly exercise real dialogs: closed dialogs cannot be audited by a passive scan.
   if(route==="/workbench/agents/skills/official"){
    const first=page.locator('[data-skill-name]').first();
    if(await first.isVisible()){
     await first.getByRole("button",{name:"介绍"}).click();
     const dlg=page.getByRole("dialog",{name:"官方技能介绍"});
     await expect(dlg).toBeVisible();
     const dialogBg=await dlg.evaluate(el=>getComputedStyle(el).backgroundColor);
     const matched=dialogBg.match(/\d+/g)?.slice(0,3).map(Number)??[];
     if(matched.length===3){
      const avg=matched.reduce((a,b)=>a+b,0)/3;
      if(theme==="light"&&avg<200)failures.push(theme+" "+route+": modal retains dark background "+dialogBg);
      if(theme==="dark"&&avg>160)failures.push(theme+" "+route+": modal retains light background "+dialogBg);
     }
     result.dialogs++;
     await dlg.getByRole("button",{name:"关闭",exact:true}).click();
    }
   }
   coverage.push({route,theme,panels:result.panels,dialogs:result.dialogs,contrastSamples:result.contrastSamples});
   failures.push(...result.issues.map(x=>theme+" "+route+": "+x));
  }
 }
 await testInfo.attach("theme-page-audit.json",{body:JSON.stringify({coverage,failures},null,2),contentType:"application/json"});
 expect(routes.length,"No navigation routes were discovered").toBeGreaterThan(10);
 expect(failures.slice(0,35).join("\\n"),"Theme regressions found across navigable pages").toBe("");
});
