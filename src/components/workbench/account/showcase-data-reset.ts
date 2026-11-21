"use client";
// One-time local-only migration for the account demo. Never touches cookies, auth tokens,
// server data, unrelated modules or any production database.
const MARKER="shuomi-account-fixture-reset-20261121-v2";
const OLD_KEYS=[
 "shuomi-demo-account-settings",
 "shuomi-demo-business-profile",
 "shuomi-demo-account-settings-SM-ENT-000001",
 "shuomi-demo-business-profile-SM-ENT-000001",
 "shuomi-demo-security-SM-ENT-000001",
 "shuomi-demo-credential-files-SM-ENT-000001",
 "shuomi-demo-account-suite-SM-ENT-000001-v1",
];
const OLD_PREFIXES=[
 "shuomi-demo-account-settings-",
 "shuomi-demo-business-profile-",
 "shuomi-demo-security-",
 "shuomi-demo-credential-files-",
 "shuomi-demo-account-suite-",
 "shuomi-demo-enterprise-",
 "shuomi-demo-referrals-",
];
function clean(storage:Storage){
 for(let i=storage.length-1;i>=0;i--){
  const key=storage.key(i);
  if(key&&(OLD_KEYS.includes(key)||OLD_PREFIXES.some(prefix=>key.startsWith(prefix))))storage.removeItem(key);
 }
}
export function resetLegacyAccountDemoOnce():void{
 if(typeof window==="undefined")return;
 try{
  if(localStorage.getItem(MARKER)==="done")return;
  clean(localStorage);
  clean(sessionStorage);
  localStorage.setItem(MARKER,"done");
 }catch{
  // In restricted/private browser mode, the default fixture remains the source of truth.
 }
}
