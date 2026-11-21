"use client";
// Compatibility entry for former enterprise showcase routes.
// All former hardcoded members, shops, credits and mock activities have been retired.
import {ShowcaseAccountSuite} from "./showcase-account-suite";
type Screen="overview"|"members"|"roles"|"resources"|"audit";
export function ShowcaseEnterprise({screen}:{screen:Screen}){
 return <ShowcaseAccountSuite pathname={"/workbench/account/organization"+(screen==="overview"?"":"/"+screen)}/>;
}
