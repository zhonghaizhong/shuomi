// @vitest-environment jsdom
import {beforeEach,describe,expect,it,vi} from "vitest";
import {agentPreviewTemplatesChanged,readAgentPreviewTemplates,writeAgentPreviewTemplates,agentPreviewTemplateKey,serializeAgentTemplateForSharing,SHUOMI_ADAPTATION_TEMPLATE_ID,SHUOMI_ADAPTATION_TEMPLATE_NAME} from "./showcase-agent-template-store";

describe("saved agent templates in the own-product listing selector",()=>{
 beforeEach(()=>sessionStorage.clear());
 const org="org-A",member="member-1",agent="商品优化智能体";
 const saved={id:"template-1",name:"商品优化-美国站",createdAt:"2026-11-24",config:{skills:["商品标题整理"]}};
 it("reads the same saved template for the selected agent and account",()=>{
  writeAgentPreviewTemplates(org,member,agent,[saved]);
  expect(readAgentPreviewTemplates(org,member,agent).map(x=>x.name)).toEqual(["硕米适配","商品优化-美国站"]);
  expect(readAgentPreviewTemplates(org,member,"POD刊登智能体")).toEqual([]);
  expect(readAgentPreviewTemplates("org-B",member,agent).map(x=>x.id)).toEqual([SHUOMI_ADAPTATION_TEMPLATE_ID]);
  expect(readAgentPreviewTemplates(org,"member-2",agent).map(x=>x.id)).toEqual([SHUOMI_ADAPTATION_TEMPLATE_ID]);
 });
 it("uses scoped v2 templates instead of unscoped legacy data",()=>{
  sessionStorage.setItem("shuomi-demo-agent-templates-"+agent,JSON.stringify([{id:"old",name:"旧版模板"}]));
  expect(readAgentPreviewTemplates(org,member,agent).map(x=>x.id)).toEqual([SHUOMI_ADAPTATION_TEMPLATE_ID]);
  writeAgentPreviewTemplates(org,member,agent,[saved]);
  expect(readAgentPreviewTemplates(org,member,agent).map(x=>x.id)).toEqual([SHUOMI_ADAPTATION_TEMPLATE_ID,saved.id]);
 });
 it("retains an empty scoped list after deleting the last template",()=>{
  sessionStorage.setItem("shuomi-demo-agent-templates-"+agent,JSON.stringify([{id:"old",name:"旧模板"}]));
  writeAgentPreviewTemplates("SM-ENT-000001","admin",agent,[saved]);
  writeAgentPreviewTemplates("SM-ENT-000001","admin",agent,[]);
  expect(readAgentPreviewTemplates("SM-ENT-000001","admin",agent).map(x=>x.id)).toEqual([SHUOMI_ADAPTATION_TEMPLATE_ID]);
  expect(JSON.parse(sessionStorage.getItem(agentPreviewTemplateKey("SM-ENT-000001","admin",agent))||"[]").map((x:{id:string})=>x.id)).toEqual([SHUOMI_ADAPTATION_TEMPLATE_ID]);
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

it("enforces a non-removable system adaptation template and rejects a same-name override",()=>{
 const org="tenant-2",member="worker-1",agent="商品优化智能体";
 const original=readAgentPreviewTemplates(org,member,agent)[0];
 expect(original.name).toBe(SHUOMI_ADAPTATION_TEMPLATE_NAME);
 writeAgentPreviewTemplates(org,member,agent,[]);
 expect(readAgentPreviewTemplates(org,member,agent)[0]).toEqual(original);
 writeAgentPreviewTemplates(org,member,agent,[{id:"fake",name:SHUOMI_ADAPTATION_TEMPLATE_NAME,createdAt:"today",config:{}}]);
 expect(readAgentPreviewTemplates(org,member,agent)).toEqual([original]);
 expect(readAgentPreviewTemplates(org,member,"POD刊登智能体")).toEqual([]);
});

it("exports the exact saved template including full image settings without organization or member identity",()=>{
 const config={skills:["sku-skill"],knowledge:["knowledge-1"],imageOptimization:true,
  imageInstructions:"保留商品主体结构",
  useConfig:{imageLanguage:"英语",imageBackground:"自定义背景要求",
   imageBackgroundCustom:"灰色摄影棚",optimizationSource:"自定义指令",
   selectedMainImages:[1,3],selectedDetailImages:[2,4],
   imageTasks:[{id:1,target:"主图",position:1,prompt:"主体居中"}]}};
 const template={id:"saved-1",name:"测试模板",createdAt:"2026-11-24",config};
 const serialized=serializeAgentTemplateForSharing("商品优化智能体",template);
 const result=JSON.parse(serialized);
 expect(result).toEqual({format:"shuomi-agent-template",version:1,
  agent:"商品优化智能体",templateName:"测试模板",savedAt:"2026-11-24",config});
 expect(serialized).not.toContain("org-A");
 expect(serialized).not.toContain("member-1");
 expect(result.config.useConfig.imageTasks[0].prompt).toBe("主体居中");
});
