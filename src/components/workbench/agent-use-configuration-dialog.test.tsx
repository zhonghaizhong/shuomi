import {afterEach,beforeEach,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import {AgentUseConfigurationDialog} from "./agent-use-configuration-dialog";
import {savePodLibrary} from "./pod-asset-library";

beforeEach(()=>{
 Object.defineProperty(HTMLDialogElement.prototype,"showModal",{configurable:true,value:function(this:HTMLDialogElement){this.open=true;}});
 Object.defineProperty(HTMLDialogElement.prototype,"close",{configurable:true,value:function(this:HTMLDialogElement){this.open=false;}});
});
afterEach(cleanup);

it("switches official shared-image tasks and example labels to detail images, then back to main",()=>{
 const save=vi.fn();
 render(<AgentUseConfigurationDialog mode="pod-ai" agentKind="pod"
  initial={{optimizationSource:"官方方案",imageUse:"共用视觉素材",imageTarget:"主图",sharedImageSource:"主图"}}
  onClose={vi.fn()} onSave={save}/>);
 expect(screen.getByText("商品识别主图 · 查看示例")).toBeTruthy();
 fireEvent.click(screen.getByRole("button",{name:/以详情图为准/}));
 expect(screen.getByText("核心购买理由 · 查看示例")).toBeTruthy();
 expect(screen.queryByText("商品识别主图 · 查看示例")).toBeNull();
 const detailCheck=screen.getByRole("checkbox",{name:"详情图第1张"});
 fireEvent.click(detailCheck);
 expect(screen.getByRole("button",{name:/共用视觉素材/}).getAttribute("aria-pressed")).toBe("true");
 fireEvent.click(screen.getByRole("button",{name:"查看详情图第1张示例"}));
 expect(screen.getByText("示例说明 · 详情图第 1 张")).toBeTruthy();
 fireEvent.click(screen.getByRole("button",{name:"关闭示例"}));
 fireEvent.click(screen.getByRole("button",{name:/以主图为准/}));
 expect(screen.getByText("商品识别主图 · 查看示例")).toBeTruthy();
 expect(screen.queryByRole("checkbox",{name:"详情图第1张"})).toBeNull();
 fireEvent.click(screen.getByRole("button",{name:"确认选择"}));
 expect(save).toHaveBeenCalledWith(expect.objectContaining({imageUse:"共用视觉素材",sharedImageSource:"主图"}));
});


it("product optimization settings follow the chosen official shared source without changing strategies",()=>{
 const onSave=vi.fn();
 render(<AgentUseConfigurationDialog mode="product-image" agentKind="product"
  initial={{optimizationSource:"官方方案",imageUse:"共用视觉素材",imageTarget:"主图",sharedImageSource:"主图",selectedMainImages:[1,2],selectedDetailImages:[1,2]}}
  onClose={vi.fn()} onSave={onSave}/>);
 expect(screen.getByRole("button",{name:"查看主图第1张示例"})).toBeTruthy();
 fireEvent.click(screen.getByRole("button",{name:/以详情图为准/}));
 expect(screen.getByRole("button",{name:"查看详情图第1张示例"})).toBeTruthy();
 expect(screen.getByText("核心购买理由 · 查看示例")).toBeTruthy();
 fireEvent.click(screen.getByRole("checkbox",{name:"详情图第2张"}));
 expect(screen.getByRole("button",{name:/共用视觉素材/}).getAttribute("aria-pressed")).toBe("true");
 fireEvent.click(screen.getByRole("button",{name:"查看详情图第1张示例"}));
 expect(screen.getByText("示例说明 · 详情图第 1 张")).toBeTruthy();
 fireEvent.click(screen.getByRole("button",{name:"关闭示例"}));
 fireEvent.click(screen.getByRole("button",{name:"确认选择"}));
 expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
  imageUse:"共用视觉素材",sharedImageSource:"详情图",selectedMainImages:[1],selectedDetailImages:[1],selectedImages:[1]
 }));
});


it("hybrid shared strategy is first and configures main and detail together",()=>{
 const save=vi.fn();
 render(<AgentUseConfigurationDialog mode="pod-hybrid" agentKind="pod"
  initial={{hybridStrategy:"共用视觉素材",hybridTarget:"主图",hybridSlots:["AI·商品识别主图",null,null,null,null,null,null,null]}}
  onClose={vi.fn()} onSave={save}/>);
 const strategy=screen.getByText("视觉策略");
 const target=screen.getByText("配置对象");
 expect(strategy.compareDocumentPosition(target)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 const paired=screen.getByLabelText("共用视觉素材同步应用对象");
 expect(paired.textContent).toContain("主图 ✓");
 expect(paired.textContent).toContain("详情图 ✓");
 expect(screen.getByText("最终图片编排 · 主图及详情图共用")).toBeTruthy();
 fireEvent.click(screen.getByRole("button",{name:"保存组合"}));
 expect(save).toHaveBeenCalledWith(expect.objectContaining({
  hybridStrategy:"共用视觉素材",
  hybridMainSlots:["AI·商品识别主图",null,null,null,null,null,null,null],
  hybridDetailSlots:["AI·商品识别主图",null,null,null,null,null,null,null]
 }));
});

it("hybrid independent strategy separates main and detail image layouts",()=>{
 const save=vi.fn();
 render(<AgentUseConfigurationDialog mode="pod-hybrid" agentKind="pod"
  initial={{hybridStrategy:"共用视觉素材",hybridTarget:"主图",hybridSlots:["AI·商品识别主图",null,null,null,null,null,null,null]}}
  onClose={vi.fn()} onSave={save}/>);
 fireEvent.click(screen.getByRole("button",{name:"分别生成"}));
 fireEvent.click(screen.getByRole("button",{name:/^详情图$/}));
 expect(screen.getByText("最终图片编排 · 详情图")).toBeTruthy();
 fireEvent.click(screen.getByRole("button",{name:"添加第 2 张图片"}));
 fireEvent.click(screen.getByRole("button",{name:"预设指令AI重构"}));
 fireEvent.click(screen.getByRole("button",{name:/核心购买理由/}));
 fireEvent.click(screen.getByRole("button",{name:/^主图$/}));
 expect(screen.getByText("最终图片编排 · 主图")).toBeTruthy();
 fireEvent.click(screen.getByRole("button",{name:"保存组合"}));
 expect(save).toHaveBeenCalledWith(expect.objectContaining({
  hybridStrategy:"分别生成",
  hybridMainSlots:["AI·商品识别主图",null,null,null,null,null,null,null],
  hybridDetailSlots:["AI·商品识别主图","AI·核心购买理由",null,null,null,null,null,null]
 }));
});


it("add-image picker matches four Figma source cards and blocks skill use when none are enabled",()=>{
 const save=vi.fn();
 render(<AgentUseConfigurationDialog mode="pod-hybrid" agentKind="pod" initial={{hybridStrategy:"共用视觉素材",selectedSkills:[]}} onClose={vi.fn()} onSave={save}/>);
 fireEvent.click(screen.getByRole("button",{name:"添加第 1 张图片"}));
 const sources=screen.getByLabelText("图片来源");
 expect(sources.querySelectorAll("button")).toHaveLength(4);
 expect(screen.getByText("步骤 3 未启用技能",{exact:false})).toBeTruthy();
 expect(screen.getByRole("button",{name:"确认应用"}).hasAttribute("disabled")).toBe(true);
 expect(screen.getByText("图片位置自动匹配")).toBeTruthy();
 expect(screen.getByText("主图 / 详情图第1张")).toBeTruthy();
 fireEvent.click(screen.getByRole("button",{name:"预设指令AI重构"}));
 expect(screen.getByRole("button",{name:/01 · 商品识别主图/})).toBeTruthy();
 fireEvent.click(screen.getByRole("button",{name:/01 · 商品识别主图/}));
 fireEvent.click(screen.getByRole("button",{name:"保存组合"}));
 expect(save).toHaveBeenCalledWith(expect.objectContaining({hybridSlots:["AI·商品识别主图",null,null,null,null,null,null,null]}));
});

it("add-image skill matching applies the shared slot to both main and detail",()=>{
 const save=vi.fn();
 render(<AgentUseConfigurationDialog mode="pod-hybrid" agentKind="pod"
  initial={{hybridStrategy:"共用视觉素材",selectedSkills:["POD图片优化（示例）"]}}
  onClose={vi.fn()} onSave={save}/>);
 fireEvent.click(screen.getByRole("button",{name:"添加第 1 张图片"}));
 expect(screen.getByText("已启用 1 项技能")).toBeTruthy();
 fireEvent.click(screen.getByRole("button",{name:"确认应用"}));
 fireEvent.click(screen.getByRole("button",{name:"保存组合"}));
 expect(save).toHaveBeenCalledWith(expect.objectContaining({
  hybridMainSlots:["技能·主图/详情图第1张",null,null,null,null,null,null,null],
  hybridDetailSlots:["技能·主图/详情图第1张",null,null,null,null,null,null,null]
 }));
});

it("renders actual scoped My Assets images and returns the selected reference",()=>{
 const save=vi.fn();
 const asset={id:9001,name:"已上传的图片.png",category:"设计素材",style:0,prompt:"",dataUrl:"data:image/png;base64,iVBORw0KGgo="};
 savePodLibrary("org-alpha","member-a",[asset]);
 render(<AgentUseConfigurationDialog mode="pod-pattern-split" agentKind="pod" organizationId="org-alpha" memberId="member-a"
  initial={{}} onClose={vi.fn()} onSave={save}/>);
 fireEvent.click(screen.getByRole("button",{name:"上传图片 / 从素材库选择"}));
 fireEvent.click(screen.getByRole("button",{name:/素材库 · 选择已保存图片/}));
 expect(screen.getByRole("img",{name:"已上传的图片.png"})).toBeTruthy();
 expect(screen.getByText("设计素材")).toBeTruthy();
 fireEvent.click(screen.getByRole("button",{name:"预览素材 已上传的图片.png"}));
 expect(screen.getByRole("dialog",{name:"预览素材 已上传的图片.png"})).toBeTruthy();
 fireEvent.click(screen.getByRole("button",{name:"关闭素材预览"}));
 fireEvent.click(screen.getByRole("button",{name:"选择素材 已上传的图片.png"}));
 fireEvent.click(screen.getByRole("button",{name:"确认选择"}));
 expect(screen.getByText(/已引用我的素材库图片/)).toBeTruthy();
 fireEvent.click(screen.getByRole("button",{name:"保存配置"}));
 expect(save).toHaveBeenCalledWith(expect.objectContaining({splitSource:"素材库",splitReference:"asset:9001"}));
});

it("does not reveal a different enterprise or member's image library",()=>{
 savePodLibrary("org-alpha","member-a",[{id:11,name:"私人图案",category:"私有",style:0,prompt:"",dataUrl:"data:image/png;base64,AA=="}]);
 render(<AgentUseConfigurationDialog mode="pod-pattern-split" agentKind="pod" organizationId="org-beta" memberId="member-a" initial={{}} onClose={vi.fn()} onSave={vi.fn()}/>);
 fireEvent.click(screen.getByRole("button",{name:"上传图片 / 从素材库选择"}));
 fireEvent.click(screen.getByRole("button",{name:/素材库 · 选择已保存图片/}));
 expect(screen.getByText("我的素材库暂无图片")).toBeTruthy();
 expect(screen.queryByText("私人图案")).toBeNull();
 expect(screen.getByRole("button",{name:"确认选择"}).hasAttribute("disabled")).toBe(true);
});


it("drags filled hybrid image slots to reorder, with shared layout persisted for both targets",()=>{
 const save=vi.fn();
 render(<AgentUseConfigurationDialog mode="pod-hybrid" agentKind="pod"
  initial={{hybridStrategy:"共用视觉素材",hybridSlots:["官方·第一张","AI·核心购买理由",null,null,null,null,null,null]}}
  onClose={vi.fn()} onSave={save}/>);
 expect(screen.queryByRole("button",{name:"智能排序"})).toBeNull();
 expect(screen.queryByRole("button",{name:"多选调整"})).toBeNull();
 const first=screen.getByLabelText("图片位置 1 · 官方·第一张");
 const second=screen.getByLabelText("图片位置 2 · AI·核心购买理由");
 const transfer={setData:vi.fn(),effectAllowed:"move",dropEffect:"move"};
 fireEvent.dragStart(first,{dataTransfer:transfer});
 fireEvent.dragOver(second,{dataTransfer:transfer});
 fireEvent.drop(second,{dataTransfer:transfer});
 fireEvent.dragEnd(first,{dataTransfer:transfer});
 expect(screen.getByLabelText("图片位置 1 · AI·核心购买理由")).toBeTruthy();
 expect(screen.getByLabelText("图片位置 2 · 官方·第一张")).toBeTruthy();
 fireEvent.click(screen.getByRole("button",{name:"保存组合"}));
 expect(save).toHaveBeenCalledWith(expect.objectContaining({
  hybridMainSlots:["AI·核心购买理由","官方·第一张",null,null,null,null,null,null],
  hybridDetailSlots:["AI·核心购买理由","官方·第一张",null,null,null,null,null,null]
 }));
});


it("shows eight existing preview images for preset reconstruction and removes a filled tile without an ellipsis",()=>{
 const save=vi.fn();
 render(<AgentUseConfigurationDialog mode="pod-hybrid" agentKind="pod"
  initial={{hybridStrategy:"共用视觉素材",hybridSlots:["官方·第一张",null,null,null,null,null,null,null]}}
  onClose={vi.fn()} onSave={save}/>);
 expect(screen.queryByRole("button",{name:"调整第 1 张图片"})).toBeNull();
 fireEvent.click(screen.getByRole("button",{name:"添加第 1 张图片"}));
 expect(screen.getByRole("button",{name:"移除第 1 张图片"})).toBeTruthy();
 fireEvent.click(screen.getByRole("button",{name:"预设指令AI重构"}));
 const gallery=screen.getByLabelText("预设指令设计图示例");
 expect(gallery.querySelectorAll("button")).toHaveLength(8);
 const examples=gallery.querySelectorAll("img");
 expect(examples).toHaveLength(8);
 expect(examples[0].getAttribute("src")).toContain("/assets/agent-image-examples/main-1.png");
 fireEvent.click(screen.getByRole("button",{name:"01 · 商品识别主图"}));
 expect(screen.queryByRole("button",{name:"调整第 1 张图片"})).toBeNull();
 fireEvent.click(screen.getByRole("button",{name:"保存组合"}));
 expect(save).toHaveBeenCalledWith(expect.objectContaining({
  hybridMainSlots:["AI·商品识别主图",null,null,null,null,null,null,null],
  hybridDetailSlots:["AI·商品识别主图",null,null,null,null,null,null,null]
 }));
});
