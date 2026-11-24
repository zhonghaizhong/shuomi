import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {expect,test} from "@playwright/test";

/* Static safety gate complementing the browser theme/dialog audits.
   Prevents later dark token overrides from undoing approved Vuexy surfaces. */
const modules: Array<{path:string;required:string[]}> = [
 {path:"showcase-skill-library.module.css",required:["--s-bg:#2f3349","--s-panel:#393d55"]},
 {path:"showcase-agent-dialog.module.css",required:["--agent-dialog-surface:#2f3349","--agent-dialog-raised:#393d55"]},
 {path:"showcase-agent-customization.module.css",required:["--custom-surface:#2f3349","--custom-raised:#393d55"]},
 {path:"stores/showcase-store-center.module.css",required:["--st-bg:#2f3349","--st-surface:#393d55","--st-card-1:#393d55"]},
 {path:"showcase-task-center.module.css",required:["--task-surface:#2f3349","--task-raised:#393d55"]},
 {path:"showcase-project-center.module.css",required:["--bg:#2f3349","--panel:#393d55"]},
 {path:"account/showcase-enterprise.module.css",required:["--surface:#2f3349","--sub:#393d55"]},
 {path:"showcase-optimized-dataset-library.module.css",required:["--bg:#2f3349","--panel:#393d55"]},
 {path:"preferred-application-preview.module.css",required:["--surface:#2f3349","--subtle:#393d55"]},
 {path:"showcase-chat-collections.module.css",required:["--collections-bg:#2f3349","--collections-card:#393d55"]},
 {path:"showcase-tool-customization.module.css",required:["--tm-bg:#2f3349","--tm-card:#393d55"]},
 {path:"showcase-pod-management-dialog.module.css",required:["--podassets-bg:#2f3349","--podassets-card:#393d55"]}
];
for (const entry of modules) {
 test("Vuexy dark token consistency: "+entry.path,()=>{
  const css=readFileSync(resolve("src/components/workbench",entry.path),"utf8").toLowerCase();
  for(const token of entry.required)expect(css,token+" missing from "+entry.path).toContain(token);
  expect(css,entry.path+" needs an independent light palette").toContain(":global(.light)");
 });
}
