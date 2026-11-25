import {render,screen,fireEvent,cleanup} from "@testing-library/react";
import {afterEach,expect,it,vi} from "vitest";
import {SectionPageTabs,sectionForPath} from "./section-page-tabs";
vi.mock("next/navigation",()=>({usePathname:()=>"/workbench/listing",useSearchParams:()=>new URLSearchParams("preview=1")}));
afterEach(()=>cleanup());
it("keeps a stationary tab bar while changing only the selected content state",()=>{
 const onSelect=vi.fn();
 const {rerender}=render(<SectionPageTabs section="listing" showHelp activeHref="/workbench/listing" onSelect={onSelect}/>);
 const navigation=screen.getByRole("navigation",{name:"刊登管理分类"});
 const tabs=screen.getAllByRole("button");
 expect(tabs).toHaveLength(5);
 expect(screen.getByRole("button",{name:"刊登总览"})).toHaveAttribute("aria-current","page");
 fireEvent.click(screen.getByRole("button",{name:"待补全"}));
 expect(onSelect).toHaveBeenCalledWith("/workbench/listing/missing");
 expect(screen.queryByRole("link",{name:"待补全"})).not.toBeInTheDocument();
 rerender(<SectionPageTabs section="listing" showHelp activeHref="/workbench/listing/missing" onSelect={onSelect}/>);
 expect(screen.getByRole("navigation",{name:"刊登管理分类"})).toBe(navigation);
 expect(screen.getByRole("button",{name:"待补全"})).toHaveAttribute("aria-current","page");
 expect(screen.getAllByRole("button")).toHaveLength(5);
});
it.each(["chat","tasks","projects","knowledge","skills","reports","catalogs"])("provides local switchable tabs for %s",(section)=>{
 const onSelect=vi.fn();
 render(<SectionPageTabs section={section} activeHref={section==="chat"?"/workbench/ai/chat":undefined} onSelect={onSelect}/>);
 const buttons=screen.getAllByRole("button");
 expect(buttons.length).toBeGreaterThanOrEqual(3);
 fireEvent.click(buttons[1]);
 expect(onSelect).toHaveBeenCalledTimes(1);
 const href=onSelect.mock.lastCall?.[0];
 expect(sectionForPath(href)).toBe(section);
});

it("renders new conversation as a fourth equal-status tab and switches locally without navigation",()=>{
 const select=vi.fn();
 const {rerender}=render(<SectionPageTabs section="chat" activeHref="/workbench/ai/chat" onSelect={select}/>);
 const tabs=screen.getAllByRole("button");
 expect(tabs.map(tab=>tab.textContent)).toEqual(["会话首页","＋ 新建会话","最近会话","收藏会话"]);
 expect(tabs).toHaveLength(4);
 expect(screen.queryByRole("link",{name:/新建会话/})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole("button",{name:"＋ 新建会话"}));
 expect(select).toHaveBeenCalledWith("/workbench/ai/chat/new");
 expect(sectionForPath("/workbench/ai/chat/new")).toBe("chat");
 rerender(<SectionPageTabs section="chat" activeHref="/workbench/ai/chat/new" onSelect={select}/>);
 expect(screen.getAllByRole("button")).toHaveLength(4);
 expect(screen.getByRole("button",{name:"＋ 新建会话"})).toHaveAttribute("aria-current","page");
});

it("shows six equal-status project tabs including 我的项目 and switches within the page",()=>{
 const select=vi.fn();
 const {rerender}=render(<SectionPageTabs section="projects" activeHref="/workbench/ai/projects" onSelect={select}/>);
 const navigation=screen.getByRole("navigation",{name:"项目中心分类"});
 const buttons=withinProjectButtons(navigation);
 expect(buttons.map(tab=>tab.textContent)).toEqual(["项目总览","我的项目","进行中项目","最近访问","项目模板","已归档"]);
 expect(buttons).toHaveLength(6);
 expect(buttons[0]).toHaveAttribute("aria-current","page");
 fireEvent.click(screen.getByRole("button",{name:"我的项目"}));
 expect(select).toHaveBeenCalledWith("/workbench/ai/projects/mine");
 expect(sectionForPath("/workbench/ai/projects/mine")).toBe("projects");
 rerender(<SectionPageTabs section="projects" activeHref="/workbench/ai/projects/mine" onSelect={select}/>);
 expect(screen.getByRole("navigation",{name:"项目中心分类"})).toBe(navigation);
 expect(screen.getByRole("button",{name:"我的项目"})).toHaveAttribute("aria-current","page");
});
function withinProjectButtons(navigation:HTMLElement){return Array.from(navigation.querySelectorAll("button"));}
