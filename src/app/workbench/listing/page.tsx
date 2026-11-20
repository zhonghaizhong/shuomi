import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { isAcquisitionUUID } from "@/lib/contracts/product-acquisition";
import { listingStageHref } from "@/lib/workbench/listing-navigation";
import { ListingOverview } from "@/components/workbench/listing/listing-overview";

export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 await connection();
 const params=await searchParams;
 const read=(name:string)=>{
  const value=params[name];
  if(value===undefined)return undefined;
  if(typeof value!=="string"||!isAcquisitionUUID(value))notFound();
  return value;
 };
 const context={preparation:read("preparation"),store:read("store"),operation:read("operation"),plan:read("plan")};
 if(Object.values(context).some(Boolean))redirect(listingStageHref("waiting",context));
 return <ListingOverview/>;
}
