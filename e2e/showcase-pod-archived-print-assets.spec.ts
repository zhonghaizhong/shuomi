import {expect,test} from "@playwright/test";

test("POD artwork archives are real cross-browser files, one source plus three review designs",async({page})=>{
 const base="/shuomi/assets/pod-prints/v1/";
 const files=[
  ["butterfly-peony-original.webp",900000],
  ["butterfly-peony-monochrome.webp",750000],
  ["butterfly-peony-warm.webp",800000],
  ["butterfly-peony-cluster.webp",1100000]
 ] as const;
 for(const [filename,minBytes] of files){
  const response=await page.request.get(base+filename);
  expect(response.status(),filename+" must be served by Pages").toBe(200);
  expect(response.headers()["content-type"],filename).toContain("image/webp");
  const data=await response.body();
  expect(data.byteLength,filename+" must be full-resolution artwork, not a placeholder").toBeGreaterThan(minBytes);
  expect(data.subarray(0,4).toString("ascii")).toBe("RIFF");
 }
 const response=await page.request.get(base+"manifest.json");
 expect(response.status()).toBe(200);
 const manifest=await response.json();
 expect(manifest.origin.role).toBe("my_assets");
 expect(manifest.fissions).toHaveLength(3);
 expect(manifest.fissions.every((p:{status:string})=>p.status==="待审核")).toBe(true);
 expect(manifest.productMockupsGenerated).toBe(false);
});
