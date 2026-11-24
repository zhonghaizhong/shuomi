import {beforeEach,expect,it} from "vitest";
import {loadAgentCatalog} from "./agent-resource-catalog";
import {savePersonalPreviewSkill} from "./showcase-skill-library";

beforeEach(()=>sessionStorage.clear());

it("links only the current organization and member's saved My Skills, not canned samples",async()=>{
 savePersonalPreviewSkill({name:"我的图片校验技能",description:"检查图片属性"},"org-a","member-a");
 savePersonalPreviewSkill({name:"其他同事的技能",description:"其他用户私有"},"org-a","member-b");
 savePersonalPreviewSkill({name:"其他企业的技能",description:"其他企业私有"},"org-b","member-a");
 const active=await loadAgentCatalog("skills",{organizationId:"org-a",memberId:"member-a",preview:true},new AbortController().signal);
 expect(active.items.map(item=>item.name)).toEqual(["我的图片校验技能"]);
 expect(active.items[0]?.key).toBe("preview:personal:我的图片校验技能");
 const other=await loadAgentCatalog("skills",{organizationId:"org-a",memberId:"member-b",preview:true},new AbortController().signal);
 expect(other.items.map(item=>item.name)).toEqual(["其他同事的技能"]);
});

it("does not fabricate knowledge bases when the preview cannot reach the real enterprise library",async()=>{
 const result=await loadAgentCatalog("knowledge",{organizationId:"org-a",memberId:"member-a",preview:true},new AbortController().signal);
 expect(result.items).toEqual([]);
 expect(result.notice).toContain("尚未连接正式知识库服务");
});
