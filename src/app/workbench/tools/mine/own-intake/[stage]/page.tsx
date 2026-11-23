import {notFound} from "next/navigation";
import {ShowcaseOwnProductIntakePage} from "@/components/workbench/showcase-own-product-intake-page";
export default async function Page({params}:{params:Promise<{stage:string}>}){
 const {stage}=await params;
 if(stage!=="pending"&&stage!=="review")notFound();
 return <ShowcaseOwnProductIntakePage stage={stage}/>;
}
