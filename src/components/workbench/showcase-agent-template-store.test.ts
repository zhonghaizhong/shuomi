// @vitest-environment jsdom
import {beforeEach,describe,expect,it,vi} from "vitest";
import {agentPreviewTemplatesChanged,readAgentPreviewTemplates,writeAgentPreviewTemplates,agentPreviewTemplateKey} from "./showcase-agent-template-store";

describe("saved agent templates in the own-product listing selector",()=>{
 beforeEach(()=>sessionStorage.clear());
 const org="org-A",member="member-1",agent="商品优化智能体";
 const saved={id:"template-1",name:"商品优化-美国站",createdAt:"2026-11-24",config:{skills:["商品标题整理"]}};
 it("reads the same saved template for the selected agent and account",()=>{
  writeAgentPreviewTemplates(org,member,agent,[saved]);
  expect(readAgentPreviewTemplates(org,member,agent).map(x=>x.name)).toEqual(["商品优化-美国站"]);
  expect(readAgentPreviewTemplates(org,member,"POD刊登智能体")).toEqual([]);
  expect(readAgentPreviewTemplates("org-B",member,agent)).toEqual([]);
  expect(readAgentPreviewTemplates(org,"member-2",agent)).toEqual([]);
 });
 it("uses scoped v2 templates instead of unscoped legacy data",()=>{
  sessionStorage.setItem("shuomi-demo-agent-templates-"+agent,JSON.stringify([{id:"old",name:"旧版模板"}]));
  expect(readAgentPreviewTemplates(org,member,agent)).toEqual([]);
  writeAgentPreviewTemplates(org,member,agent,[saved]);
  expect(readAgentPreviewTemplates(org,member,agent)).toEqual([saved]);
 });
 it("retains an empty scoped list after deleting the last template",()=>{
  sessionStorage.setItem("shuomi-demo-agent-templates-"+agent,JSON.stringify([{id:"old",name:"旧模板"}]));
  writeAgentPreviewTemplates("SM-ENT-000001","admin",agent,[saved]);
  writeAgentPreviewTemplates("SM-ENT-000001","admin",agent,[]);
  expect(readAgentPreviewTemplates("SM-ENT-000001","admin",agent)).toEqual([]);
  expect(sessionStorage.getItem(agentPreviewTemplateKey("SM-ENT-000001","admin",agent))).toBe("[]");
 });
 it("notifies same-tab selectors after save, rename or deletion",()=>{
  const callback=vi.fn();
  window.addEventListener(agentPreviewTemplatesChanged,callback);
  writeAgentPreviewTemplates(org,member,agent,[saved]);
  expect(callback).toHaveBeenCalledOnce();
  expect((callback.mock.calls[0][0] as CustomEvent).detail).toEqual({organizationId:org,memberId:member,agent});
  window.removeEventListener(agentPreviewTemplatesChanged,callback);
 });
});
