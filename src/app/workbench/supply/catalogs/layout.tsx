import type {ReactNode} from "react";
import {SectionPageTabs} from "@/components/workbench/console/section-page-tabs";
export default function Layout({children}:{children:ReactNode}){
 return <><SectionPageTabs section="catalogs"/>{children}</>;
}
