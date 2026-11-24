import {afterEach,beforeEach,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import {AgentUseConfigurationDialog} from "./agent-use-configuration-dialog";

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
