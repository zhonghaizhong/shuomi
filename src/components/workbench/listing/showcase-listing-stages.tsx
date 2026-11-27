"use client";
import type {ReactNode} from "react";
import {useEffect,useMemo,useRef,useState} from "react";
import {readOwnProductBatches,listOwnReadyProducts,ownProductUpdated} from "../showcase-own-product-data";
import {readOptimizedDatasets,optimizedDatasetsChanged} from "../showcase-optimized-datasets";
import {readDemoCollectionBatches} from "../showcase-collection-batches";
import {readShowcaseEnabledAgents,readShowcaseAgentTemplates,showcaseAgentId,showcaseAgentStateChanged} from "../showcase-agent-demo-state";
import {useDemoStoreBindings,demoStoreServiceActive} from "../store-binding-demo";
import {addShowcaseUploadTask,readShowcaseUploadTasks,refreshAmazonFiveDemoPhotos,simulateAmazonFiveListingWorkflow,simulateAmazonMultiVariantListingWorkflow,simulateApprovedLodgeSubmission,saveListingVariantPhoto,saveShowcaseGalleryEdits,listingVariantPhotoRoles,listingVariantGalleryCards,variantGroupReady,type ListingVariantPhotoRole,completeShowcaseUploadTask,approveShowcaseUploadTask,saveShowcaseListingTextEdits,showcaseUploadTasksEvent,showcaseUploadBatchKey,showcaseUploadBatchLabel,showcaseUploadBatchPreferenceKey,type ShowcaseUploadTask} from "./showcase-upload-tasks";
import {useRouter} from "next/navigation";
import {AdaptationRulesDialog} from "./showcase-adaptation-rules-dialog";
import {fieldSchemaMatches,scopedFieldKey,findUnambiguousEnumOption,type FieldScope} from "./showcase-platform-field-schema";
import {initialVariantStructure,variantStructureImpact,variantStructureValidation,type VariantStructureDraft} from "./showcase-variant-structure";
import {readAdaptationRules,type AdaptationRule} from "./showcase-adaptation-rules";
import {ShowcaseBatchVersionPicker,type PickBatch,type PickSource} from "./showcase-batch-version-picker";
import styles from "./showcase-listing-stages.module.css";
import {importAmazonVariantBundle,importSingleColorAIReconstruction,importThreeColorAIReconstruction,recoverLocalListingPhotos,linkHostedCrocsDemoPhotos,readVariantBundlePhoto,saveListingLocalPhoto,isVariantBundleUrl} from "./showcase-variant-bundle-import";
import {ShowcaseListingStageHeader} from "./showcase-listing-stage-header";
import {parseListingPhoto,listingPhotoAtlasUrl} from "./showcase-listing-ai-images";

type Stage="waiting"|"missing"|"review";
type Item={sku:string;name:string;source:string;store:string;status:string;missing:string[];ai:boolean;taskId?:string;originalName?:string;originalDescription?:string;originalImages?:string[];optimizedDescription?:string;optimizedImages?:string[];batchKey?:string;batchName?:string;sourceVersionId?:string;targetPlatform?:string;targetRegion?:string;targetStoreType?:string;detailImages?:string[]};
const seed:Item[]=[];
/** The six photographic roles are independently authored tiles of the approved atlas. */
function ListingProductPhoto({src,alt,size}:{src:string;alt:string;size:number}){
 const tile=parseListingPhoto(src);
 if(!tile)return <img src={src} alt={alt} style={{width:size,height:size,objectFit:"contain",background:"white",borderRadius:8,flexShrink:0}}/>;
 return <span role="img" aria-label={alt} title={alt} style={{
  display:"inline-block",width:size,height:size,flexShrink:0,borderRadius:8,
  backgroundColor:"#fff",backgroundImage:`url("${listingPhotoAtlasUrl()}")`,
  backgroundRepeat:"no-repeat",backgroundSize:"600% 500%",
  backgroundPosition:`${tile.col*20}% ${tile.row*25}%`
 }}/>;
}

export function ShowcaseListingStage({stage,organizationId,memberId,tabNavigation}:{stage:Stage;organizationId:string;memberId:string;tabNavigation?:ReactNode}){
 const router=useRouter();
 const [source,setSource]=useState<PickSource>("采集批次"),[batch,setBatch]=useState(""),[selectedVersionId,setSelectedVersionId]=useState("original"),[batchDialog,setBatchDialog]=useState(false),[store,setStore]=useState(""),[agent,setAgent]=useState(false),[agentId,setAgentId]=useState(""),[templateId,setTemplateId]=useState(""),[rules,setRules]=useState(true),[mode,setMode]=useState<"平台草稿"|"直接上传到平台"|"定时上传">("平台草稿");
 const [scheduledDate,setScheduledDate]=useState(""),[scheduledTime,setScheduledTime]=useState("");
 const [scheduleEnabled,setScheduleEnabled]=useState(false),[showTimeSettings,setShowTimeSettings]=useState(false);
 const [platformSite,setPlatformSite]=useState("");
 const [targetDialog,setTargetDialog]=useState(false),[draftPlatform,setDraftPlatform]=useState(""),[draftRegion,setDraftRegion]=useState(""),[draftType,setDraftType]=useState(""),[draftStore,setDraftStore]=useState("");
 const [currentRule,setCurrentRule]=useState<AdaptationRule>(()=>{const data=readAdaptationRules(organizationId,memberId);return data.rules.find(rule=>rule.id===data.currentId)??data.rules[0]});
 const {visible:availableStoreBindings}=useDemoStoreBindings(organizationId,memberId,memberId==="admin");
 const boundStores=availableStoreBindings.filter(s=>s.platformStoreId&&!s.archived&&!s.connectionIssue&&s.platformIdStatus!=="获取失败"&&demoStoreServiceActive(s));
 const siteChoices=Array.from(new Set(boundStores.map(s=>s.platform+" · "+s.region)));
 const platformChoices=Array.from(new Set(boundStores.map(s=>s.platform)));
 const regionChoices=Array.from(new Set(boundStores.filter(s=>s.platform===draftPlatform).map(s=>s.region)));
 const typeChoices=Array.from(new Set(boundStores.filter(s=>s.platform===draftPlatform&&s.region===draftRegion).map(s=>s.type)));
 const filteredTargetStores=boundStores.filter(s=>s.platform===draftPlatform&&s.region===draftRegion&&s.type===draftType);
 const beginTargetSelection=()=>{
  const current=boundStores.find(s=>s.id===store&&s.platform+" · "+s.region===platformSite);
  setDraftPlatform(current?.platform??"");
  setDraftRegion(current?.region??"");
  setDraftType(current?.type??"");
  setDraftStore(current?.id??"");
  setTargetDialog(true);
 };
 const siteStores=boundStores.filter(s=>s.platform+" · "+s.region===platformSite);
 const chosenStore=siteStores.find(s=>s.id===store);
 useEffect(()=>{if(platformSite&&!siteChoices.includes(platformSite)){setPlatformSite("");setStore("")}},[platformSite,siteChoices.join("|")]);
 const [agentDemoVersion,setAgentDemoVersion]=useState(0);
 useEffect(()=>{const refresh=(event:Event)=>{if((event as CustomEvent<{organizationId:string}>).detail?.organizationId===organizationId)setAgentDemoVersion(v=>v+1)};window.addEventListener(showcaseAgentStateChanged,refresh);return()=>window.removeEventListener(showcaseAgentStateChanged,refresh)},[organizationId]);
 const demoAgentNames=useMemo(()=>readShowcaseEnabledAgents(organizationId),[organizationId,agentDemoVersion]);
 const enabledAgents=demoAgentNames.map(name=>({id:showcaseAgentId(name),name}));
 const chosenAgent=enabledAgents.find(e=>e.id===agentId);
 const demoTemplates=useMemo(()=>chosenAgent?readShowcaseAgentTemplates(organizationId,memberId,chosenAgent.name):[],[organizationId,memberId,chosenAgent?.name,agentDemoVersion]);
 const availableTemplates=[{id:"default",name:"默认配置（演示）"},...demoTemplates];
 const chosenTemplate=availableTemplates.find(t=>t.id===templateId);
 const [filter,setFilter]=useState(""),[applied,setApplied]=useState(""),[stageBatchDialog,setStageBatchDialog]=useState(false),[stagePickSource,setStagePickSource]=useState<PickSource>("采集批次"),[listPage,setListPage]=useState(1),[batchFilter,setBatchFilter]=useState(()=>typeof window==="undefined"?"":sessionStorage.getItem(showcaseUploadBatchPreferenceKey(organizationId,memberId))||""),[appliedBatch,setAppliedBatch]=useState(()=>typeof window==="undefined"?"":sessionStorage.getItem(showcaseUploadBatchPreferenceKey(organizationId,memberId))||""),[items,setItems]=useState(seed),[selected,setSelected]=useState<Item|null>(null),[photoIndex,setPhotoIndex]=useState(0),[notice,setNotice]=useState(""),[ruleDialog,setRuleDialog]=useState(false),[submitted,setSubmitted]=useState(false);
 const [form,setForm]=useState<Record<string,string>>({});
 const [dataVersion,setDataVersion]=useState(0);
 const [taskVersion,setTaskVersion]=useState(0);
 useEffect(()=>{const refresh=(event:Event)=>{const d=(event as CustomEvent<{organizationId:string}>).detail;if(!d||d.organizationId===organizationId)setDataVersion(v=>v+1)};window.addEventListener("shuomi:demo-batches-updated",refresh);window.addEventListener("focus",refresh);return()=>{window.removeEventListener("shuomi:demo-batches-updated",refresh);window.removeEventListener("focus",refresh)}},[organizationId]);
 useEffect(()=>{const onChange=(event:Event)=>{const d=(event as CustomEvent<{organizationId:string;memberId:string}>).detail;if(d?.organizationId===organizationId&&d.memberId===memberId)setTaskVersion(v=>v+1)};window.addEventListener(showcaseUploadTasksEvent,onChange);return()=>window.removeEventListener(showcaseUploadTasksEvent,onChange)},[organizationId,memberId]);
 useEffect(()=>{const handle=(e:Event)=>{const d=(e as CustomEvent<{organizationId:string;memberId:string}>).detail;if(d?.organizationId===organizationId&&d?.memberId===memberId)setDataVersion(n=>n+1)};window.addEventListener(ownProductUpdated,handle);return()=>window.removeEventListener(ownProductUpdated,handle)},[organizationId,memberId]);
 useEffect(()=>{const handle=(e:Event)=>{const d=(e as CustomEvent<{organizationId:string;memberId:string}>).detail;if(d?.organizationId===organizationId&&d.memberId===memberId)setDataVersion(v=>v+1)};window.addEventListener(optimizedDatasetsChanged,handle);return()=>window.removeEventListener(optimizedDatasetsChanged,handle)},[organizationId,memberId]);
 const optimizedSets=useMemo(()=>readOptimizedDatasets(organizationId,memberId),[organizationId,memberId,dataVersion]);
 useEffect(()=>{
  const key="shuomi:listing-dataset-prefill:"+organizationId+":"+memberId;
  const id=sessionStorage.getItem(key);
  const chosen=optimizedSets.find(d=>d.id===id);if(chosen){setSource(chosen.sourceKind);setBatch(chosen.sourceBatchId);setSelectedVersionId(chosen.id);sessionStorage.removeItem(key)}
 },[organizationId,memberId,optimizedSets]);
 const ownBatches=useMemo(()=>readOwnProductBatches(organizationId,memberId),[organizationId,memberId,dataVersion]);
 const ownProducts=useMemo(()=>listOwnReadyProducts(organizationId,memberId),[organizationId,memberId,dataVersion]);
 const collectedBatches=useMemo(()=>readDemoCollectionBatches(organizationId,memberId),[organizationId,memberId,dataVersion]);
 const availableBatches=source==="自有商品库"?ownBatches:collectedBatches;
 const pickerBatches:PickBatch[]=availableBatches.map(b=>{
  const originalProducts=source==="采集批次"&&"products"in b?b.products.map(p=>({id:p.id,name:p.name})):ownProducts.filter(p=>p.batchId===b.id).map(p=>({id:p.id,name:p.name}));
  const revisions=optimizedSets.filter(d=>d.sourceKind===source&&d.sourceBatchId===b.id).sort((a,b)=>b.version-a.version);
  return {id:b.id,name:b.name,sourceName:source==="采集批次"&&"source"in b?b.source:source,date:b.createdAt,products:originalProducts,versions:[
   {id:"original",label:"原始版本",count:originalProducts.length,isOriginal:true},
   ...revisions.map(d=>({id:d.id,label:"V"+d.version+" · "+d.platform+" "+d.site+" 优化版",count:d.products.length,isOriginal:false,platform:d.platform,site:d.site,language:d.language,date:d.createdAt}))
  ]};
 });
 const chosenBatch=pickerBatches.find(b=>b.id===batch);
 const selectedOwnBatch=source==="自有商品库"?ownBatches.find(x=>x.id===batch):undefined;
 const selectedCollectedBatch=source==="采集批次"?collectedBatches.find(x=>x.id===batch):undefined;
 const selectedOptimizedSet=selectedVersionId!=="original"?optimizedSets.find(d=>d.id===selectedVersionId&&d.sourceKind===source&&d.sourceBatchId===batch):undefined;
 const selectedVersion=chosenBatch?.versions.find(v=>v.id===selectedVersionId);
 const selectableProducts=selectedOwnBatch?ownProducts.filter(p=>p.batchId===selectedOwnBatch.id):[];
 const selectedProductIds=selectedOptimizedSet?selectedOptimizedSet.products.map(p=>p.sourceProductId):selectedCollectedBatch?selectedCollectedBatch.products.map(p=>p.id):selectableProducts.map(p=>p.id);
 const selectedCount=selectedProductIds.length;
 // First-stage intake is already complete; third-party missing fields are evaluated separately by the platform adapter.
 const missingCount=0;
 const savedTasks=useMemo(()=>readShowcaseUploadTasks(organizationId,memberId),[organizationId,memberId,taskVersion]);
 useEffect(()=>{
  // One-time safe migration for people who already ran the 8-SVG preview.
  refreshAmazonFiveDemoPhotos(organizationId,memberId);
 },[organizationId,memberId]);

 // Existing and freshly seeded demo tasks auto-link only after all public images load.
 useEffect(()=>{
  if(organizationId!=="SM-ENT-000001"||memberId!=="admin")return;
  void linkHostedCrocsDemoPhotos(organizationId,memberId).catch(()=>{/* A partial deploy must not affect the demo task. */});
 },[organizationId,memberId,taskVersion]);
 const demoTaskInitialized=useRef(false);
 useEffect(()=>{
  if(demoTaskInitialized.current||organizationId!=="SM-ENT-000001"||memberId!=="admin")return;
  const selectedAmazon=collectedBatches.find(b=>b.id==="SIM-AMAZON-US-5-20261124");
  const target=boundStores.find(b=>b.platform==="SHEIN"&&b.name==="管理员演示店铺01"&&b.region==="美国站");
  const template=readShowcaseAgentTemplates(organizationId,memberId,"商品优化智能体").find(t=>t.name==="测试模板");
  if(!selectedAmazon||!target||!template||!readShowcaseEnabledAgents(organizationId).includes("商品优化智能体"))return;
  try{
   const result=simulateAmazonFiveListingWorkflow({
    organizationId,memberId,batchId:selectedAmazon.id,batchName:selectedAmazon.name,products:selectedAmazon.products,
    storeId:target.id,storeName:target.name,region:target.region,storeType:target.type,
    rule:"硕米规则",agentName:"商品优化智能体",templateId:template.id
   });
   const extra=simulateAmazonMultiVariantListingWorkflow({
    organizationId,memberId,batchId:selectedAmazon.id,batchName:selectedAmazon.name,products:selectedAmazon.products,
    storeId:target.id,storeName:target.name,region:target.region,storeType:target.type,
    rule:"硕米规则",agentName:"商品优化智能体",templateId:template.id
   });
   const lodgeSimulated=simulateApprovedLodgeSubmission(organizationId,memberId,target.id);
   demoTaskInitialized.current=true;
   const preference=JSON.stringify(["采集批次",selectedAmazon.id,"original"]);
   sessionStorage.setItem(showcaseUploadBatchPreferenceKey(organizationId,memberId),preference);
   setBatchFilter(preference);setAppliedBatch(preference);
   if(lodgeSimulated)setNotice("Lodge 铸铁煎锅已模拟审核并提交至 SHEIN 美国站 · 管理员演示店铺01。仅本地演示，没有实际平台上传或回执。");
   else if(result.created||extra.created)setNotice("已新增两款真实图片多变体商品到原批次：Crocs 待补全、Stanley 待审核；仅保存模拟任务，未上传 SHEIN。");
  }catch(e){setNotice(e instanceof Error?e.message:"五款商品演示初始化失败");}
 },[organizationId,memberId,dataVersion,agentDemoVersion,availableStoreBindings.length,collectedBatches]);

 const currentBatchName=(task:ShowcaseUploadTask)=>collectedBatches.find(b=>b.id===task.batchId)?.name??task.batchName;
 const batchOptions=Array.from(new Map(savedTasks.map(task=>[showcaseUploadBatchKey(task),{key:showcaseUploadBatchKey(task),label:showcaseUploadBatchLabel({...task,batchName:currentBatchName(task)}),source:task.source,name:currentBatchName(task),version:task.sourceVersionId||"original"}])).values());
 const activeBatch=batchOptions.find(option=>option.key===appliedBatch);
 const stagePickerBatches:PickBatch[]=savedTasks.filter(t=>t.source===stagePickSource).reduce<PickBatch[]>((acc,t)=>{
  let b=acc.find(x=>x.id===t.batchId);
  if(!b){b={id:t.batchId,name:currentBatchName(t),sourceName:t.source,date:t.createdAt,products:[],versions:[]};acc.push(b)}
  for(const id of t.productIds){if(!b.products.some(p=>p.id===id))b.products.push({id,name:id})}
  const id=t.sourceVersionId||"original";let v=b.versions.find(v=>v.id===id);
  if(!v){v={id,label:t.sourceVersionLabel||"原始版本",count:0,isOriginal:id==="original"};b.versions.push(v)}
  v.count+=t.productIds.length;
  return acc;
 },[]);
 const chooseStageBatch=(batchId:string,versionId:string)=>{const key=JSON.stringify([stagePickSource,batchId,versionId]);setBatchFilter(key);setAppliedBatch(key);setListPage(1);sessionStorage.setItem(showcaseUploadBatchPreferenceKey(organizationId,memberId),key);setStageBatchDialog(false)};

 const taskItems:Item[]=savedTasks.filter(task=>stage==="missing"?task.status==="待补全":task.status==="待审核").flatMap(task=>task.productIds.map((id,i)=>({sku:id+" · "+task.id.slice(-8),name:task.demoProduct?.optimizedName??task.batchName+(task.productCount>1?` · 商品 ${i+1}`:""),source:task.source,store:task.storeName,status:task.status,missing:task.demoProduct?.missingFields??(task.status==="待补全"?["商品必填资料"]:[]),ai:Boolean(task.agentId),taskId:task.id,originalName:task.demoProduct?.sourceName,originalDescription:task.demoProduct?.sourceDescription,originalImages:task.demoProduct?.sourceImages,optimizedDescription:task.demoProduct?.optimizedDescription,optimizedImages:task.demoProduct?.optimizedImages,batchKey:showcaseUploadBatchKey(task),batchName:currentBatchName(task),sourceVersionId:task.sourceVersionId||"original",targetPlatform:task.platform,targetRegion:task.region,targetStoreType:task.storeType})));
 const applyBatchFilter=()=>{setListPage(1);const next=batchOptions.some(option=>option.key===batchFilter)?batchFilter:"";setApplied(filter.trim());setAppliedBatch(next);sessionStorage.setItem(showcaseUploadBatchPreferenceKey(organizationId,memberId),next);};
 const resetBatchFilter=()=>{setListPage(1);setFilter("");setApplied("");setBatchFilter("");setAppliedBatch("");sessionStorage.removeItem(showcaseUploadBatchPreferenceKey(organizationId,memberId));};

 const [pictureTab,setPictureTab]=useState<"main"|"detail">("main");
 const [variantColorId,setVariantColorId]=useState("");
 const [photoMode,setPhotoMode]=useState<"optimized"|"original">("optimized");
 const [editingPhotoRole,setEditingPhotoRole]=useState<ListingVariantPhotoRole|null>(null);
 const [photoDraft,setPhotoDraft]=useState("");
 const photoFileInput=useRef<HTMLInputElement>(null);
 const [photoFileAction,setPhotoFileAction]=useState<"upload"|"replace">("upload");
 const [photoAiOpen,setPhotoAiOpen]=useState(false),[photoAiPrompt,setPhotoAiPrompt]=useState("");
 const [photoBusy,setPhotoBusy]=useState(false);
 const [recoveringPhotos,setRecoveringPhotos]=useState(false);
 const aiSixImportRef=useRef<HTMLInputElement>(null);
 const aiAllColorImportRef=useRef<HTMLInputElement>(null);
 const [aiSixImporting,setAiSixImporting]=useState(false);
 const autoRecoveryAttempted=useRef<Set<string>>(new Set());
 const [fieldTab,setFieldTab]=useState<"common"|"shared"|"variant"|"sku">("common");
 const [activeSkuId,setActiveSkuId]=useState("");
 const [textDraft,setTextDraft]=useState<{title:string;description:string;colorDescriptions:Record<string,string>;skuDescriptions:Record<string,string>;skuNames:Record<string,string>;merchantSkuCodes:Record<string,string>;fieldValues:Record<string,string>;legacyMissingValues:Record<string,string>}>({title:"",description:"",colorDescriptions:{},skuDescriptions:{},skuNames:{},merchantSkuCodes:{},fieldValues:{},legacyMissingValues:{}});
 const [batchAiOpen,setBatchAiOpen]=useState(false),[batchAiScope,setBatchAiScope]=useState<"current"|"all">("current");
 const [batchAiRequired,setBatchAiRequired]=useState(true),[batchAiOptional,setBatchAiOptional]=useState(false);
 const [batchAiInstructions,setBatchAiInstructions]=useState(""),[aiTargetField,setAiTargetField]=useState<string|null>(null),[aiFeedback,setAiFeedback]=useState("");
 const [aiGroupTarget,setAiGroupTarget]=useState<{scope:FieldScope;kind:"missing"|"filled"|"optional"|"required";fields:string[]}|null>(null);
 const [selectedQualification,setSelectedQualification]=useState<Record<string,string>>({});
 const [demoPackaging,setDemoPackaging]=useState("");
 const [demoSellingPoint,setDemoSellingPoint]=useState("");
 const [demoUploadedName,setDemoUploadedName]=useState("");
 const [demoSharedRequired,setDemoSharedRequired]=useState("");
 const [demoSharedFilled,setDemoSharedFilled]=useState("演示已填资料");
 const [demoSharedOptional,setDemoSharedOptional]=useState("");
 const [fieldSectionsOpen,setFieldSectionsOpen]=useState<Record<string,boolean>>({});
 const sectionOpen=(id:string,required:boolean)=>fieldSectionsOpen[id]??required;
 const toggleSection=(id:string,required:boolean)=>setFieldSectionsOpen(old=>({...old,[id]:!(old[id]??required)}));
 const [categoryEdit,setCategoryEdit]=useState(false);
 const [categoryDraft,setCategoryDraft]=useState("");
 const [categoryImpactConfirmed,setCategoryImpactConfirmed]=useState(false);
 const [batchSkuPattern,setBatchSkuPattern]=useState("");
 const [bulkSkuOpen,setBulkSkuOpen]=useState(false);
 const [variantDraft,setVariantDraft]=useState<VariantStructureDraft>({dimensions:[],revision:0});
 const [confirmVariantChange,setConfirmVariantChange]=useState(false);
 const [imagePreview,setImagePreview]=useState(false);
 const [variantPreviewIndex,setVariantPreviewIndex]=useState<number|null>(null);
 const [bundleImporting,setBundleImporting]=useState(false),[bundlePhotoUrls,setBundlePhotoUrls]=useState<Record<string,string>>({});
 const go=(s:string)=>router.push("/workbench/listing/"+s+"?preview=1");
 const filtered=(items.length?items:taskItems).filter(x=>(x.name+" "+x.sku+" "+x.source+" "+x.status+" "+(x.batchName||"")+" "+(x.taskId?Object.values(savedTasks.find(t=>t.id===x.taskId)?.textEdits?.skuNames??{}).join(" ")+" "+Object.values(savedTasks.find(t=>t.id===x.taskId)?.textEdits?.merchantSkuCodes??{}).join(" "):"")).toLowerCase().includes(applied.toLowerCase())&&(!appliedBatch||x.batchKey===appliedBatch));
 const totalPages=Math.max(1,Math.ceil(filtered.length/15));
 const currentPage=Math.min(listPage,totalPages);
 const pageItems=filtered.slice((currentPage-1)*15,currentPage*15);
 const selectedItem=selected?items.find(x=>x.sku===selected.sku)??selected:null;
 const selectedTask=selectedItem?.taskId?savedTasks.find(task=>task.id===selectedItem.taskId):undefined;
 const variantDetails=selectedTask?.demoProduct?.variantDetails??[];
 const selectedSkuCount=variantDetails.length||(selectedTask?.productIds.length??1);
 const variantImageGroups=selectedTask?.demoProduct?.variantImageGroups??[];
 const selectedVariantGroup=variantImageGroups.find(g=>g.id===variantColorId)??variantImageGroups[0];
 const selectedVariantSkus=variantDetails.filter(v=>v.color.trim().toLowerCase()===selectedVariantGroup?.id);
 const activeSku=selectedVariantSkus.find(v=>v.sku===activeSkuId)??selectedVariantSkus[0];
 const editingColorKey=selectedVariantGroup?.id??"default";
 const editingSkuKey=activeSku?.sku??selectedTask?.productIds[0]??selectedItem?.sku??"";
 const aiEligibleFields=[
  {key:"title",label:"商品标题",scope:"common",required:true},
  {key:"description",label:"商品描述",scope:"common",required:true},
  ...(variantImageGroups.length?[{key:"colorDescription",label:"当前颜色描述",scope:"variant",required:false}]:[]),
  ...(variantDetails.length?[{key:"skuDescription",label:"当前 SKU 补充描述",scope:"sku",required:false}]:[])
 ];
 const selectedAiFields=aiEligibleFields.filter(f=>(batchAiScope==="all"||f.scope===fieldTab)&&((f.required&&batchAiRequired)||(!f.required&&batchAiOptional)));
 useEffect(()=>{
  let cancelled=false;
  const urls:string[]=[];
  const galleryRefs=Object.values(selectedTask?.imageEdits??{}).flatMap(x=>[...(x.main??[]),...(x.detail??[])]);
  const referenced=[...new Set([...(selectedVariantGroup?.optimizedImages.map(x=>x.url)??[]),...galleryRefs].filter(isVariantBundleUrl))];
  setBundlePhotoUrls({});
  if(referenced.length){
   Promise.all(referenced.map(async ref=>{
    const blob=await readVariantBundlePhoto(ref);
    if(!blob)return [ref,""] as const;
    const src=URL.createObjectURL(blob);urls.push(src);
    return [ref,src] as const;
   })).then(pairs=>{if(!cancelled)setBundlePhotoUrls(Object.fromEntries(pairs));}).catch(()=>{if(!cancelled)setNotice("导入的图片无法从本浏览器读取，请重新导入 ZIP");});
  }
  return ()=>{cancelled=true;urls.forEach(src=>URL.revokeObjectURL(src));};
 },[selectedTask?.id,selectedVariantGroup?.id,taskVersion]);
 const mediaUrl=(src:string|null|undefined):string|undefined=>src?(isVariantBundleUrl(src)?bundlePhotoUrls[src]:src.startsWith("/assets/")&&typeof window!=="undefined"&&window.location.pathname.startsWith("/shuomi")?"/shuomi"+src:src):undefined;
 const importBundle=async(file:File|undefined)=>{
  if(!file)return;
  setBundleImporting(true);
  try{
   const result=await importAmazonVariantBundle(organizationId,memberId,file);
   setNotice("已从图片包自动关联 "+result.imported+" 张素材到 Crocs 和 Stanley 的六个颜色组；原有人工审核成果保留。演示素材未被视为真实 AI 成品。");
   setPhotoIndex(0);setVariantPreviewIndex(null);
  }catch(e){setNotice(e instanceof Error?e.message:"图片包导入失败");}
  finally{setBundleImporting(false);}
 };

 const uploadAllAIImages=async(file:File|undefined)=>{
  if(!file||!selectedTask)return;
  setAiSixImporting(true);
  try{
   const result=await importThreeColorAIReconstruction(organizationId,memberId,selectedTask.id,file);
   setPictureTab("main");setPhotoMode("optimized");setPhotoIndex(0);
   setNotice("已关联 "+result.colors+" 种颜色、共 "+result.count+" 张独立生成的 AI 图片至当前刊登任务。切换 Black、White、Navy 可以查看对应图片；所有图片仍须人工核对后才能审核。");
  }catch(e){setNotice(e instanceof Error?e.message:"关联已生成图片失败");}
  finally{setAiSixImporting(false);}
 };
 const uploadSixAIImages=async(file:File|undefined)=>{
  if(!file||!selectedTask||!selectedVariantGroup)return;
  setAiSixImporting(true);
  try{
   const imported=await importSingleColorAIReconstruction(organizationId,memberId,selectedTask.id,selectedVariantGroup.id,file);
   setPhotoMode("optimized");setPictureTab("main");setPhotoIndex(0);
   setNotice("已为 "+selectedVariantGroup.color+" 关联 "+imported+" 张新生成的 AI 重构图片；同色尺码共享，保存原始图，进入人工审核后再上架。");
  }catch(e){setNotice(e instanceof Error?e.message:"导入 AI 重构图片包失败");}
  finally{setAiSixImporting(false);}
 };
  const restoreHistoricalPhotos=async()=>{
  if(!selectedTask)return;
  setRecoveringPhotos(true);
  try{
   const found=await recoverLocalListingPhotos(organizationId,memberId,selectedTask.id);
   if(!found.restored){setPhotoAiOpen(true);setPictureTab("main");setPhotoMode("original");setPhotoIndex(0);}
   setNotice(found.restored
    ?"已找回 "+found.restored+" 张历史图片并恢复了商品/颜色/图片位次关联；请核对来源，之前真实的 AI 成品不会被覆盖。"
    :found.found?"此商品本地已有图片记录，但没有新的缺失关联可恢复。已打开原图重构入口；真实生成需要连接图片 AI 服务。"
    :"此浏览器没有找到可恢复的历史成品。已切换到原始图片并打开单张重构配置；演示站未接通图片生成服务，暂不能自动生成。");
  }catch(e){setNotice(e instanceof Error?e.message:"检查本地历史图片失败");}
  finally{setRecoveringPhotos(false);}
 };
 useEffect(()=>{
  if(!selectedTask?.id.startsWith("SHUOMI-AMZ-AI-MULTI:")||!selectedTask.demoProduct?.variantImageGroups?.length)return;
  const key=organizationId+"|"+memberId+"|"+selectedTask.id;
  if(autoRecoveryAttempted.current.has(key))return;
  autoRecoveryAttempted.current.add(key);
  void recoverLocalListingPhotos(organizationId,memberId,selectedTask.id).then(result=>{
   if(result.restored)setNotice("已自动找回 "+result.restored+" 张该商品的历史图片，并关联回对应颜色与图片位置；请核对图片来源。");
  }).catch(()=>{/* Optional recovery never blocks the listing dialog. */});
 },[organizationId,memberId,selectedTask?.id]);
  const selectedColorOptimizedImages=selectedVariantGroup?listingVariantPhotoRoles.map(role=>selectedVariantGroup.optimizedImages.find(img=>img.role===role)?.url).filter((src):src is string=>Boolean(src)):[];
 const colorPhotoComplete=variantImageGroups.length===0||variantImageGroups.every(variantGroupReady);
 const selectedColorOriginalImages=selectedVariantGroup?.originalImages??(selectedItem?.originalImages??[]);
 const galleryKey=selectedVariantGroup?.id??"default";
 const galleryEditKey=galleryKey+":"+(pictureTab==="detail"?"detail":photoMode);
 const originalMain=photoMode==="optimized"?(selectedVariantGroup?selectedColorOptimizedImages:(selectedItem?.optimizedImages?.length?selectedItem.optimizedImages:selectedColorOriginalImages)):selectedColorOriginalImages;

 const savedMainImages=selectedTask?.imageEdits?.[galleryKey+":"+photoMode]?.main;
 // An older empty gallery edit must not hide recovered AI images after refresh.
 const selectedMainImages=savedMainImages?.length?savedMainImages:originalMain;
 const selectedDetailImages=selectedTask?.imageEdits?.[galleryKey+":detail"]?.detail??(selectedItem?.detailImages??[]);
 // Do not silently substitute source photos when the optimized gallery has no saved results.
 const rawGalleryImages=pictureTab==="main"?selectedMainImages:selectedDetailImages;
 const galleryImages=rawGalleryImages.map(src=>mediaUrl(src)).filter((src):src is string=>Boolean(src));
 const photoSelected=Math.min(photoIndex,Math.max(rawGalleryImages.length-1,0));
 const aiPhotoSource=rawGalleryImages[photoSelected]??selectedColorOriginalImages[0]??selectedItem?.originalImages?.[0];
 const aiPhotoDisplay=mediaUrl(aiPhotoSource);
 const updateGallery=(next:string[])=>{
  if(!selectedTask){setNotice("此商品尚无可编辑的刊登任务。");return}
  try{saveShowcaseGalleryEdits(organizationId,memberId,selectedTask.id,galleryEditKey,pictureTab,next);setPhotoIndex(i=>Math.min(i,Math.max(next.length-1,0)));}
  catch(e){setNotice(e instanceof Error?e.message:"保存图片变更失败");}
 };
 const handlePhotoUpload=async(file:File|undefined)=>{
  if(!file||!selectedTask)return;
  setPhotoBusy(true);
  try{
   const url=await saveListingLocalPhoto(organizationId,memberId,selectedTask.id,galleryEditKey,file);
   const current=[...rawGalleryImages];
   if(photoFileAction==="replace"&&current.length)current[photoSelected]=url;
   else{if(current.length>=24)throw new Error("当前图片区最多 24 张图片");current.push(url);}
   updateGallery(current);
   setPhotoIndex(photoFileAction==="replace"?photoSelected:current.length-1);
   setNotice("图片已保存至当前浏览器的本地图库；未执行 AI 生成，也未上传到第三方平台。");
  }catch(e){setNotice(e instanceof Error?e.message:"图片保存失败");}
  finally{setPhotoBusy(false);}
 };
 const moveCurrentPhoto=(by:number)=>{
  const next=[...rawGalleryImages],j=photoSelected+by;
  if(j<0||j>=next.length)return;
  [next[photoSelected],next[j]]=[next[j],next[photoSelected]];
  updateGallery(next);setPhotoIndex(j);
 };
 const removeCurrentPhoto=()=>{
  if(!rawGalleryImages.length)return;
  updateGallery(rawGalleryImages.filter((_,i)=>i!==photoSelected));
 };
 const saveColorPhoto=(role:ListingVariantPhotoRole)=>{
  if(!selectedTask||!selectedVariantGroup)return;
  try{saveListingVariantPhoto(organizationId,memberId,selectedTask.id,selectedVariantGroup.id,role,photoDraft);setEditingPhotoRole(null);setPhotoDraft("");setNotice("已保存 "+selectedVariantGroup.color+" 的「"+role+"」图片链接；其同色不同尺码 SKU 自动继承。");}
  catch(error){setNotice(error instanceof Error?error.message:"保存变体图片失败");}
 };
 const savedCategory=selectedTask?.textEdits?.categoryPath??"";
 const classChanged=categoryDraft.trim()!==savedCategory;
 const categoryNeedsReview=classChanged||Boolean(selectedTask?.textEdits?.categoryRulePending);
 const skuIdentityDraft=textDraft.merchantSkuCodes[editingSkuKey]??editingSkuKey;
 const skuCodes=variantDetails.length?variantDetails.map(v=>v.sku):selectedTask?.productIds??[];
 const invalidSkuCode=!skuIdentityDraft.trim()||skuCodes.some(id=>id!==editingSkuKey&&(textDraft.merchantSkuCodes[id]??id).trim().toLowerCase()===skuIdentityDraft.trim().toLowerCase());
 const skuDisplayName=textDraft.skuNames[editingSkuKey]??activeSku?.label??editingSkuKey;
 const firstValues=variantDraft.dimensions.find(d=>d.id==="first")?.values??[];
 const secondValues=variantDraft.dimensions.find(d=>d.id==="second")?.values??[];
 const displayVariantColor=(color:string)=>firstValues.find(v=>v.sourceId===color.trim().toLowerCase())?.label??color;
 const displayVariantSize=(size:string)=>secondValues.find(v=>v.sourceId===size)?.label??size;
 const structureImpact=variantStructureImpact(variantDetails,variantDraft);
 const structureIssues=variantStructureValidation(variantDraft);
 const structureChanged=variantDetails.length>0&&structureImpact.changed;
 const structureBlocked=structureChanged&&(!confirmVariantChange||structureIssues.length>0);
 const changeVariantName=(id:"first"|"second",name:string)=>{setVariantDraft(d=>({...d,dimensions:d.dimensions.map(g=>g.id===id?{...g,name}:g)}));setConfirmVariantChange(false)};
 const changeVariantValue=(id:"first"|"second",valueId:string,label:string)=>{setVariantDraft(d=>({...d,dimensions:d.dimensions.map(g=>g.id===id?{...g,values:g.values.map(v=>v.id===valueId?{...v,label}:v)}:g)}));setConfirmVariantChange(false)};
 const addVariantValue=(id:"first"|"second")=>{setVariantDraft(d=>({...d,dimensions:d.dimensions.map(g=>g.id===id?{...g,values:[...g.values,{id:"new:"+crypto.randomUUID(),label:""}]}:g)}));setConfirmVariantChange(false)};
 const removeVariantValue=(id:"first"|"second",valueId:string)=>{setVariantDraft(d=>({...d,dimensions:d.dimensions.map(g=>g.id===id?{...g,values:g.values.filter(v=>v.id!==valueId)}:g)}));setConfirmVariantChange(false)};
 const schema=selectedTask?.platformFieldSchema;
 const schemaValid=fieldSchemaMatches(schema,{platform:selectedTask?.platform??"",region:selectedTask?.region??"",storeType:selectedTask?.storeType??"",categoryPath:categoryDraft.trim()});
 const scopeEntity=(scope:FieldScope)=>scope==="variant"?editingColorKey:scope==="sku"?editingSkuKey:"all";
 const scopedValue=(scope:FieldScope,id:string)=>textDraft.fieldValues[scopedFieldKey(scope,id,scopeEntity(scope))]??"";
 const editScopedValue=(scope:FieldScope,id:string,value:string)=>setTextDraft(d=>({...d,fieldValues:{...d.fieldValues,[scopedFieldKey(scope,id,scopeEntity(scope))]:value}}));
 const scopedValueFor=(scope:FieldScope,id:string)=>textDraft.fieldValues[scopedFieldKey(scope,id,scopeEntity(scope))]??"";
 const eligibleGroupFields=(scope:FieldScope,kind:"missing"|"filled"|"optional"|"required")=>{
  const fields=(schemaValid?schema!.fields:[]).filter(f=>f.scope===scope&&(f.kind==="text"||f.kind==="enum")&&f.aiEditable&&
   (kind==="optional"?f.requirement==="optional":f.requirement==="required"&&(kind==="required"|| (kind==="filled"?!!scopedValueFor(scope,f.id).trim():!scopedValueFor(scope,f.id).trim()))))
   .map(f=>f.label);
  if(scope==="common"&&kind!=="optional"){
   if(kind==="required"||(kind==="missing"?!textDraft.title.trim():!!textDraft.title.trim()))fields.push("商品标题");
   if(kind==="required"||(kind==="missing"?!textDraft.description.trim():!!textDraft.description.trim()))fields.push("商品描述");
  }
  if(selectedTask?.demo&&!schemaValid&&kind==="optional"){
   if(scope==="common")fields.push("补充卖点（演示）");
   if(scope==="shared")fields.push("变体公共备注（演示）");
   if(scope==="sku")fields.push("SKU备注（演示）");
  }
  return fields;
 };
 const launchGroupAi=(scope:FieldScope,kind:"missing"|"filled"|"optional"|"required",fields:string[])=>{
  setAiGroupTarget({scope,kind,fields});setAiTargetField(null);setBatchAiOpen(true);
  setAiFeedback(fields.length?"当前演示尚未接入可执行的AI服务；不会自动填写或覆盖资料。":"当前分组暂无平台明确允许AI处理的字段。按钮仍可使用，待平台规则接入后自动筛选。");
 };
 const scopedGroup=(scope:FieldScope,kind:"missing"|"filled"|"optional"|"required",extra?:ReactNode)=>{
  const fields=schemaValid?schema!.fields.filter(field=>field.scope===scope&&(kind==="optional"?field.requirement==="optional":field.requirement==="required"&&(kind==="required"||(kind==="filled"?Boolean(scopedValueFor(scope,field.id).trim()):!scopedValueFor(scope,field.id).trim())))):[];
  if(!fields.length&&!extra)return null;
  const label=kind==="required"?"必填信息":kind==="missing"?"必填信息（缺失）":kind==="filled"?"必填信息（已填）":"可填信息";
  const id=scope+":"+kind;
  return <div className={styles.fieldFold} key={id}>
   <div className={styles.fieldFoldHeading}>
    <button type="button" className={styles.fieldFoldToggle} aria-expanded={sectionOpen(id,kind!=="optional")} onClick={()=>toggleSection(id,kind!=="optional")}>
     <strong>{label}</strong>
    </button>
    <button type="button" className={styles.fieldFoldAi} onClick={()=>launchGroupAi(scope,kind,eligibleGroupFields(scope,kind))}>✦ AI重构</button>
    <button type="button" className={styles.fieldFoldExpand} aria-label={label+(sectionOpen(id,kind!=="optional")?"收起":"展开")} onClick={()=>toggleSection(id,kind!=="optional")}>{sectionOpen(id,kind!=="optional")?"收起":"展开"}</button>
   </div>
   {sectionOpen(id,kind!=="optional")?<div className={styles.fieldFoldBody}>
    {extra}
    {fields.map(field=><div className={styles.individualField} key={field.id}>
     <div className={styles.individualFieldHeading}><strong>{field.label}</strong></div>
     {field.kind==="enum"?<select aria-label={field.label} value={scopedValueFor(scope,field.id)} onChange={e=>editScopedValue(scope,field.id,e.target.value)}><option value="">请选择</option>{field.options?.map(option=><option value={option} key={option}>{option}</option>)}</select>
     :<input aria-label={field.label} type={field.kind==="number"?"number":"text"} maxLength={field.maxLength??500} value={scopedValueFor(scope,field.id)} onChange={e=>editScopedValue(scope,field.id,e.target.value)}/>}
    </div>)}
   </div>:null}
  </div>;
 };
 const openAiForField=(field:string)=>{
  const candidate=field.startsWith("platform:")?schema?.fields.find(f=>field==="platform:"+f.scope+":"+f.id):undefined;
  if(candidate&&(!candidate.aiEditable||!["text","enum"].includes(candidate.kind))){setNotice("该字段需要使用平台允许的真实属性值，不能由AI编造。");return}
  setAiTargetField(field);setBatchAiScope("current");setBatchAiOpen(true);
  setAiFeedback("已选择字段："+(candidate?.label??aiEligibleFields.find(x=>x.key===field)?.label??field)+"。当前演示没有接入AI文本生成服务，尚未自动填写。");
 };
 const demoLegacyFields=()=>{
  const fields=selectedItem?.missing??[];
  return fields.filter(field=>!(form[field]??textDraft.legacyMissingValues[field]??"").trim()).map(field=>
   <div className={styles.individualField} key={field}>
    <div className={styles.individualFieldHeading}><strong>{field}</strong></div>
    {/(资质|认证|证书|检测|报告|文件|许可)/.test(field)?
     <label className={styles.demoUploadButton}>选择文件（演示）
      <input type="file" accept=".pdf,.png,.jpg,.jpeg" aria-label={"上传"+field} onChange={e=>setSelectedQualification(x=>({...x,[field]:e.target.files?.[0]?.name??""}))}/>
      {selectedQualification[field]?<span>已选择：{selectedQualification[field]}（未上传）</span>:null}
     </label>:
     <input aria-label={field} placeholder="请填写真实资料" value={form[field]??textDraft.legacyMissingValues[field]??""} onChange={e=>setForm(prev=>({...prev,[field]:e.target.value}))}/>}
   </div>);
 };
 const demoOptionalFields=selectedTask?.demo&&!schemaValid?<div className={styles.demoOptionalFields}>
  <div className={styles.individualField}>
   <div className={styles.individualFieldHeading}><strong>补充卖点（演示文本）</strong></div>
   <textarea rows={2} aria-label="补充卖点（演示文本）" placeholder="可自行填写" value={demoSellingPoint} onChange={e=>setDemoSellingPoint(e.target.value)}/>
  </div>
  <div className={styles.individualField}>
   <strong>包装形式（演示下拉选项）</strong>
   <select aria-label="包装形式（演示）" value={demoPackaging} onChange={e=>setDemoPackaging(e.target.value)}>
    <option value="">请选择</option><option value="single">单件包装</option><option value="bundle">组合包装</option>
   </select>
  </div>
  <div className={styles.individualField}>
   <strong>附件材料（演示上传）</strong>
   <label className={styles.demoUploadButton}>选择文件
    <input type="file" accept=".pdf,.png,.jpg,.jpeg" aria-label="演示上传附件材料" onChange={e=>setDemoUploadedName(e.target.files?.[0]?.name??"")}/>
   </label>
   {demoUploadedName?<span>已选择：{demoUploadedName}（未上传服务器）</span>:null}
  </div>
  <small>以上为本地交互演示，并非平台返回的正式属性。</small>
 </div>:null;
 const applyBatchSkuNames=()=>{
  if(!batchSkuPattern.trim()){setNotice("请输入批量命名模板，例如 {color}-{size}");return}
  if(!variantDetails.length){setNotice("当前商品没有可批量命名的变体SKU");return}
  const first=variantDraft.dimensions[0]?.values??[],second=variantDraft.dimensions[1]?.values??[];
  const values=Object.fromEntries(variantDetails.map(v=>{
   const color=first.find(x=>x.sourceId===v.color.trim().toLowerCase())?.label??v.color;
   const size=second.find(x=>x.sourceId===v.size)?.label??v.size;
   return [v.sku,batchSkuPattern.replace(/\{color\}/gi,color).replace(/\{size\}/gi,size).replace(/\{sku\}/gi,v.sku).trim()];
  }));
  if(Object.values(values).some(v=>!v||v.length>160)){setNotice("批量命名存在空名称或超过160字符，请调整模板");return}
  setTextDraft(d=>({...d,skuNames:{...d.skuNames,...values}}));
  setNotice("已预览应用 "+variantDetails.length+" 个SKU名称；点击保存补全资料后写入编辑版本。");
 };
 const action=(next:string)=>{setNotice(next);setSubmitted(true)};
 const submitUpload=(uploadMode:"平台草稿"|"直接上传到平台"|"定时上传")=>{
  if(!selectedCount||!chosenStore||!rules){setNotice("请先选择商品、有效目标店铺及适配规则。");return}
  if(agent&&(!chosenAgent||!chosenTemplate)){setNotice("请先选择当前企业已启用的智能体及执行模板。");return}
  if(uploadMode==="定时上传"){setNotice("定时上传尚未连接正式调度服务，已保留时间配置，但未创建自动执行任务。");return}
  if(selectedOptimizedSet&&selectedOptimizedSet.platform!==chosenStore.platform){setNotice("提示：优化版本源自 "+selectedOptimizedSet.platform+"，目标店铺为 "+chosenStore.platform+"。本演示未接入跨平台字段映射，不能把旧版内容直接提交为新平台数据。");return}
  if(source==="采集批次"&&selectedCollectedBatch?.id==="SIM-AMAZON-US-5-20261124"&&agent&&chosenAgent?.name==="商品优化智能体"&&chosenTemplate?.name==="测试模板"){
   try{
    const report=simulateAmazonFiveListingWorkflow({
     organizationId,memberId,batchId:selectedCollectedBatch.id,batchName:selectedCollectedBatch.name,
     products:selectedCollectedBatch.products,storeId:chosenStore.id,storeName:chosenStore.name,
     region:chosenStore.region,storeType:chosenStore.type,
     rule:currentRule.name,agentName:chosenAgent.name,templateId:chosenTemplate.id
    });
    const extra=simulateAmazonMultiVariantListingWorkflow({
     organizationId,memberId,batchId:selectedCollectedBatch.id,batchName:selectedCollectedBatch.name,
     products:selectedCollectedBatch.products,storeId:chosenStore.id,storeName:chosenStore.name,
     region:chosenStore.region,storeType:chosenStore.type,
     rule:currentRule.name,agentName:chosenAgent.name,templateId:chosenTemplate.id
    });
    const picked=JSON.stringify(["采集批次",selectedCollectedBatch.id,"original"]);
    setBatchFilter(picked);setAppliedBatch(picked);
    sessionStorage.setItem(showcaseUploadBatchPreferenceKey(organizationId,memberId),picked);
    setSubmitted(true);
    setNotice(report.alreadyInstalled&&extra.alreadyInstalled?"演示任务已存在，保留已完成的补全与审核记录。":"原五款任务按原状态保留，新增 Crocs 一件待补全、Stanley 一件待审核；未真实执行 SHEIN 上传。");
   }catch(e){setNotice(e instanceof Error?e.message:"智能体模拟执行失败");}
   return;
  }
  const status:ShowcaseUploadTask["status"]=missingCount?"待补全":agent?"待执行智能体":"待平台提交";
  const record:ShowcaseUploadTask={id:"LIST-"+crypto.randomUUID(),organizationId,memberId,source:source,batchId:batch,batchName:chosenBatch?.name??batch,sourceVersionId:selectedVersionId,sourceVersionLabel:selectedVersion?.label??"原始版本",productIds:selectedProductIds,productCount:selectedCount,missingCount,storeId:chosenStore.id,storeName:chosenStore.name,platform:"SHEIN",region:chosenStore.region,storeType:chosenStore.type,rule:currentRule.name,ruleConfig:{...currentRule},agentId:agent?agentId:null,agentName:agent?chosenAgent?.name??null:null,templateId:agent?templateId:null,mode:uploadMode,status,createdAt:new Date().toISOString(),demo:true};
  if(addShowcaseUploadTask(record)){sessionStorage.setItem(showcaseUploadBatchPreferenceKey(organizationId,memberId),showcaseUploadBatchKey(record));setBatchFilter(showcaseUploadBatchKey(record));setAppliedBatch(showcaseUploadBatchKey(record));setSubmitted(true);setNotice("已保存本次演示刊登任务（"+selectedCount+" 件，"+chosenStore.name+"，"+status+"）。已记住本次来源、批次与版本，后续阶段按同一批次筛选；未执行真实平台上传。")}else setNotice("演示任务保存失败，请检查会话存储。");
 };
 const persistText=()=>{if(!selectedTask)return false;try{saveShowcaseListingTextEdits(organizationId,memberId,selectedTask.id,{...textDraft,categoryPath:categoryDraft.trim(),categoryRulePending:classChanged?true:selectedTask.textEdits?.categoryRulePending??false,legacyMissingValues:{...textDraft.legacyMissingValues,...form},variantStructure:variantDetails.length?variantDraft:undefined});return true}catch(e){setNotice(e instanceof Error?e.message:"保存文本资料失败");return false}};
 const saveTextOnly=()=>{if(structureBlocked){setNotice(structureIssues[0]??"请确认变体结构变更及受影响的SKU后再保存");return}if(invalidSkuCode||!skuDisplayName.trim()){setNotice("请先检查SKU显示名称和商家SKU编码，编码不可重复。");return}if(categoryNeedsReview&&!categoryImpactConfirmed){setNotice("请先确认分类变更影响。");return}if(persistText())setNotice(categoryNeedsReview?"已保存分类变更和SKU编辑的新草稿版本；原资料完整保留，等待平台分类规则复核。":"已保存商品、颜色及SKU名称和编码修改；原始数据保持不变。")};
 const requestAiSuggestions=()=>{
  if(aiGroupTarget&&!aiGroupTarget.fields.length){setAiFeedback("当前分组没有经平台规则确认可由AI处理的字段，不会修改任何资料。");return}
  if(!aiGroupTarget&&!selectedAiFields.length&&!aiTargetField){setAiFeedback("当前分组没有可重构的字段。");return}
  if(aiGroupTarget&&schemaValid){
   const sourceEvidence=[selectedItem?.originalName??"",selectedItem?.optimizedDescription??"",textDraft.title,textDraft.description].filter(Boolean).join(" ");
   const eligible=schema!.fields.filter(f=>f.scope===aiGroupTarget.scope&&f.kind==="enum"&&f.aiEditable&&f.options?.length&&
    (aiGroupTarget.kind==="optional"?f.requirement==="optional":f.requirement==="required"&&
    (aiGroupTarget.kind==="required"||(aiGroupTarget.kind==="filled"?!!scopedValueFor(f.scope,f.id).trim():!scopedValueFor(f.scope,f.id).trim()))));
   const matched=eligible.flatMap(f=>{const selected=findUnambiguousEnumOption(f,sourceEvidence);return selected?[{field:f,value:selected}]:[]});
   if(matched.length){
    setTextDraft(old=>({...old,fieldValues:{...old.fieldValues,...Object.fromEntries(matched.map(x=>[scopedFieldKey(x.field.scope,x.field.id,scopeEntity(x.field.scope)),x.value]))}}));
   }
   setAiFeedback(matched.length?"已根据商品原始资料中的明确匹配，从平台合法选项中预选 "+matched.length+" 项，请核对后保存。其余无充分依据的选项未自动选择。":"暂未在商品原始资料中找到唯一且有依据的合法选项，保持待确认。当前尚未连接真实AI服务。");
   return;
  }
  setAiFeedback("已筛选可由AI处理的文本及平台许可的下拉字段；尚未接入真实AI服务，未生成或覆盖内容。资质、图片、价格、库存等真实资料不会猜测。");
 };
 const save=()=>{
  if(!selectedItem)return;
  if(structureBlocked){setNotice(structureIssues[0]??"请先确认变体结构调整影响");return}
  if(invalidSkuCode){setNotice("商家SKU编码不能为空，且同一商品内不能重复。");return}
  if(!skuDisplayName.trim()){setNotice("SKU显示名称不能为空。");return}
  if(categoryNeedsReview){if(!categoryImpactConfirmed){setNotice("请确认分类变更影响，然后保存草稿。");return}persistText();setNotice("分类变更保存为新草稿。目标平台类目规则未接入，原数据保留，必须完成规则校验才能提交审核。");return}
  if(selectedTask&&!persistText())return;
  const allFilled=selectedItem.missing.every(field=>(form[field]??textDraft.legacyMissingValues[field]??"").trim().length>0);
  if(!allFilled){setNotice("请补齐所有必填字段后保存。");return}
  if(selectedItem.taskId){try{completeShowcaseUploadTask(organizationId,memberId,selectedItem.taskId,{...textDraft.legacyMissingValues,...form});setSelected(null);setForm({});setNotice("资料已补齐，进入待审核；必须审核智能体结果后才能提交目标店铺。");}catch(e){setNotice(e instanceof Error?e.message:"保存失败");}return;}
  setItems(arr=>arr.map(x=>x.sku===selectedItem.sku?{...x,missing:[],status:"手动已补全"}:x));
  setSelected(null);setForm({});action("资料已保存到演示记录。请核对原任务，确认继续上传；启用智能体时先进入待审核。");
 };
 return <div className={styles.page} data-listing-stage={stage}>
  <ShowcaseListingStageHeader stage={stage}/>
  {tabNavigation}
  {notice?<div className={styles.notice} role="status">{notice}<button type="button" onClick={()=>setNotice("")} aria-label="关闭提示">×</button></div>:null}
  {stage==="waiting"?<>
   <section className={styles.flowHeader}><div><h2>商品上传流程</h2><p>商品 · 规则必选 · 智能体按需 · 平台上传</p></div><div className={styles.flowSteps}>{[["选择商品","待选择"],["平台与店铺","当前"],["启用智能体","按需"],["启用规则","必选"]].map(([name,state],i)=><span key={name}><b>{i+1}</b><strong>{name}</strong><small>{state}</small></span>)}</div></section>
   <section className={styles.configuration}>
    <article><header><b>01</b><h2>选择商品</h2></header><p>从我的数据中选择商品来源、批次和使用版本。</p>
     <label>商品来源<select aria-label="商品来源" value={source} onChange={e=>{setSource(e.target.value as PickSource);setBatch("");setSelectedVersionId("original")}}><option value="采集批次">采集批次</option><option value="自有商品库">自有商品库</option></select></label>
     {chosenBatch&&selectedVersion?<div className={styles.selectedProductVersion} role="status"><strong>{chosenBatch.name}</strong><span>{selectedVersion.label} · {selectedCount} 件商品</span>{selectedOptimizedSet?<span>{selectedOptimizedSet.platform} · {selectedOptimizedSet.site} · {selectedOptimizedSet.language}</span>:<span>原始数据 · 等待目标平台适配</span>}</div>:<p className={styles.sourceGuide}>请从「我的数据」选择本次刊登使用的商品批次和版本。</p>}
     <button type="button" onClick={()=>setBatchDialog(true)}>{chosenBatch?"更换商品批次与版本":"选择商品批次与版本"}</button>
     <small>{selectedCount>0?"已选择 "+selectedCount+" 件商品，历史版本与原始数据均保留。":"未选择商品；请选择批次和版本后继续。"}</small>
     <button type="button" onClick={()=>router.push("/workbench/data/mine?preview=1")}>查看我的数据</button>
    </article>
    <article><header><b>02</b><h2>目标平台与店铺</h2></header><p>选择平台站点及目标店铺</p><button type="button" onClick={beginTargetSelection}>{platformSite||"请选择店铺"}</button><button type="button" onClick={()=>{if(chosenStore){setNotice("已确认目标店铺："+chosenStore.name+"（"+chosenStore.region+"）")}else{beginTargetSelection()}}}>{chosenStore?"已确认："+chosenStore.name:"确认目标店铺"}</button><small>{chosenStore?`提交后将按 ${chosenStore.platform} · ${chosenStore.region} 的要求校验，目标店铺：${chosenStore.name}`:"提交后　资料完整后自动分流"}</small></article>
    <article><header><b>03</b><h2>智能体（按需）</h2></header><p>按需重构商品后进入审核</p>
     <label className={styles.agentToggleRow}><span>启用智能体</span><input aria-label="启用智能体" type="checkbox" checked={agent} onChange={e=>{setAgent(e.target.checked);setAgentId("");setTemplateId("")}}/></label>
     <div className={styles.agentStatusRow}><strong>智能体</strong><span>{agent?chosenAgent?.name??"请选择智能体":"未启用，无需选择"}</span></div>
     {agent?<><label>选择智能体<select aria-label="选择执行智能体" value={agentId} onChange={e=>{setAgentId(e.target.value);setTemplateId("")}}><option value="">请选择智能体</option>{enabledAgents.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label><label>执行模板<select aria-label="执行模板" disabled={!chosenAgent} value={templateId} onChange={e=>setTemplateId(e.target.value)}><option value="">{chosenAgent?"请选择模板":"请先选择智能体"}</option>{availableTemplates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label></>:null}
     <small>{agent&&!enabledAgents.length?"当前没有已启用的智能体。":chosenAgent?.id==="pod.design.agent"?"POD 成品图生成后进入素材管理审核":agent?"执行结果经审核后继续原任务":"开启后配置执行模板"}</small><button type="button" onClick={()=>router.push("/workbench/agents/mine?preview=1")}>前往我的智能体</button>
    </article>
    <article><header><b>04</b><h2>启用规则</h2></header><p>规则必须启用才能上传</p>
     <label className={styles.ruleRequiredRow}><span>标准适配规则</span><input aria-label="启用标准适配规则" type="checkbox" checked={rules} onChange={e=>setRules(e.target.checked)}/></label>
     <div className={styles.ruleSelectedRow}><strong>本次适配规则</strong><span>{rules?"必选启用":"未启用"}</span></div>
     <button type="button" className={styles.ruleSettingsButton} onClick={()=>setRuleDialog(true)}>适配规则设置</button>
     <small>适用范围　{currentRule.name} · 本次生效，原始资料不变</small>
    </article>
   </section>
   <section className={styles.submit}>
     <div className={styles.uploadSummary}><header><h2>本次上传</h2><p>按目标平台校验资料：缺失先补全，启用智能体需审核</p></header>
      <div className={styles.uploadFacts}>{[
       ["商品来源",source==="自有商品库"?"自有商品库":"采集批次"],["已选商品",selectedCount?selectedCount+" 件 · "+(selectedVersion?.label??"原始版"):"请选择商品"],["目标平台与店铺",chosenStore?.name??"请选择店铺"],
       ["智能体",agent?chosenAgent?.name??"请选择智能体":"未启用"],["适配规则",rules?currentRule.name:"必须启用"]
      ].map(([label,value],i)=><div key={label} className={styles.uploadFact} data-kind={i}><strong>{label}</strong><span>{value}</span></div>)}</div>
     </div>
     <div className={styles.uploadActions}><div className={styles.scheduleRow}><label>定时上传<input aria-label="启用定时上传" type="checkbox" checked={scheduleEnabled} onChange={e=>{setScheduleEnabled(e.target.checked);setMode(e.target.checked?"定时上传":"直接上传到平台")}}/></label><button type="button" onClick={()=>setShowTimeSettings(true)}>设置时间</button></div>
      {scheduleEnabled&&scheduledDate&&scheduledTime?<small>计划时间：{scheduledDate} {scheduledTime}（演示，未实际预约）</small>:null}
      <div className={styles.uploadActionButtons}><button type="button" disabled={!selectedCount||!chosenStore||!rules||(agent&&(!chosenAgent||!chosenTemplate))} onClick={()=>submitUpload("平台草稿")}>上传到草稿箱</button><button type="button" className={styles.primary} disabled={!selectedCount||!chosenStore||!rules||(agent&&(!chosenAgent||!chosenTemplate))||(scheduleEnabled&&(!scheduledDate||!scheduledTime))} onClick={()=>submitUpload(scheduleEnabled?"定时上传":"直接上传到平台")}>{scheduleEnabled?"确认定时上传":"直接上传到平台"}</button></div>
     </div>
   </section>
   {showTimeSettings?<div className={styles.overlay} role="presentation" onMouseDown={e=>e.target===e.currentTarget&&setShowTimeSettings(false)}><section className={styles.dialog} role="dialog" aria-modal="true" aria-label="设置上传时间"><h2>设置上传时间</h2><p>设置本次上传的执行日期与时间。演示模式不执行真实调度。</p><label>日期<input aria-label="定时上传日期" type="date" value={scheduledDate} onChange={e=>setScheduledDate(e.target.value)}/></label><label>时间<input aria-label="定时上传时间" type="time" value={scheduledTime} onChange={e=>setScheduledTime(e.target.value)}/></label><footer><button type="button" onClick={()=>setShowTimeSettings(false)}>取消</button><button type="button" className={styles.primary} disabled={!scheduledDate||!scheduledTime} onClick={()=>{setScheduleEnabled(true);setMode("定时上传");setShowTimeSettings(false)}}>确认</button></footer></section></div>:null}
   <p className={styles.hint}>按照 Figma 保留平台草稿、直接上传和定时上传配置入口；当前展示只创建本账号任务记录，不模拟真实平台提交或智能体执行。</p>
  </>:<>
   <section className={styles.listPanel}><div className={styles.filters} data-listing-batch-filter>
    <div className={styles.filterChoices}><label>商品批次<button type="button" aria-label="选择刊登批次" onClick={()=>{setStagePickSource(activeBatch?.source==="自有商品库"?"自有商品库":"采集批次");setStageBatchDialog(true)}}>{activeBatch?.label||"全部批次"} · 选择批次与版本</button></label></div>
    <div className={styles.filterSearch}><input placeholder="搜索商品名称 / SKU" aria-label="搜索商品" value={filter} onChange={e=>setFilter(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")applyBatchFilter()}}/><button type="button" onClick={resetBatchFilter}>重置</button><button type="button" className={styles.primary} onClick={applyBatchFilter}>确认</button></div>
   </div>
   
    <header className={styles.listHeader}><h2>商品列表（共 {filtered.length} 个商品）</h2><button type="button" onClick={()=>action(stage==="missing"?"批量 AI 补全需先选择真实商品、授权与策略；当前未执行。":"批量审核需逐项确认实际建议；当前未执行。")}>{stage==="missing"?"批量AI补全":"批量审核"}</button></header>
    <div className={styles.tableScroll}><div className={`${styles.table} ${styles.compactListingTable}`}><div className={styles.columns}><span>商品 / SKU</span><span>所属批次</span><span>目标平台</span><span>站点</span><span>店铺类型</span><span>目标店铺</span><span>状态</span><span>操作</span></div>
    {filtered.length===0?<div className={styles.emptyListingRow} role="status">{activeBatch?"当前批次在本阶段暂无待处理商品。":"暂无商品记录；请先在「待上传」选择批次并创建刊登任务。"}</div>:null}
    {pageItems.map(item=>{const data=optimizedSets.find(d=>d.id===item.sourceVersionId);const product=data?.products.find(p=>item.sku.startsWith(p.sourceProductId+" · "));const image=item.optimizedImages?.[0]??item.originalImages?.[0];return <div className={styles.item} key={item.sku}>
      <div className={styles.compactProductCell}>{image?<ListingProductPhoto src={image} alt={item.name+"商品图片"} size={46}/>:<span className={styles.compactProductPlaceholder}>暂无图片</span>}<div className={styles.compactProductText}><strong title={product?.name||item.name}>{product?.name||item.name}</strong><small title={item.sku}>{item.taskId?(()=>{const task=savedTasks.find(t=>t.id===item.taskId);const names=Object.values(task?.textEdits?.skuNames??{});const codes=Object.values(task?.textEdits?.merchantSkuCodes??{});return names.length?names[0]+(names.length>1?" 等"+names.length+"个SKU":"")+(codes.length?" · "+codes[0]:""):item.sku})():item.sku}</small></div></div>
      <div className={styles.compactBatchCell}><strong title={item.batchName??item.source}>{item.batchName??item.source}</strong><small>{item.sourceVersionId==="original"?"原始版本":item.sourceVersionId?"优化版本":"—"}</small></div>
      <span className={styles.compactPlainCell}>{item.targetPlatform||"—"}</span>
      <span className={styles.compactPlainCell}>{item.targetRegion||"—"}</span>
      <span className={styles.compactStoreType}>{item.targetStoreType||"—"}</span>
      <span className={styles.compactPlainCell} title={item.store}>{item.store||"—"}</span>
      <span className={styles.compactStatus}>{item.status}</span>
      <button type="button" className={styles.compactAction} onClick={()=>{setSelected(item);setPhotoIndex(0);setVariantColorId("");setVariantPreviewIndex(null);setPhotoMode((()=>{const t=savedTasks.find(x=>x.id===item.taskId);const g=t?.demoProduct?.variantImageGroups?.[0];return g&&!g.optimizedImages.length?"original":"optimized"})());setEditingPhotoRole(null);setPhotoDraft("");setPictureTab("main");setFieldTab("common");setActiveSkuId("");setTextDraft((()=>{const record=savedTasks.find(t=>t.id===item.taskId);return {title:record?.textEdits?.title??item.name,description:record?.textEdits?.description??item.optimizedDescription??"",colorDescriptions:{...record?.textEdits?.colorDescriptions},skuDescriptions:{...record?.textEdits?.skuDescriptions},skuNames:{...record?.textEdits?.skuNames},merchantSkuCodes:{...record?.textEdits?.merchantSkuCodes},fieldValues:{...record?.textEdits?.fieldValues},legacyMissingValues:{...record?.textEdits?.legacyMissingValues}}})());setBatchAiOpen(false);setAiGroupTarget(null);setBatchAiScope("current");setBatchAiRequired(true);setBatchAiOptional(false);setBatchAiInstructions("");setAiTargetField(null);setAiFeedback("");setSelectedQualification({});setDemoPackaging("");setDemoSellingPoint("");setDemoUploadedName("");setDemoSharedRequired("");setDemoSharedFilled("演示已填资料");setDemoSharedOptional("");setFieldSectionsOpen({});setCategoryEdit(false);setCategoryDraft(savedTasks.find(t=>t.id===item.taskId)?.textEdits?.categoryPath??"");setCategoryImpactConfirmed(false);setBatchSkuPattern("");setBulkSkuOpen(false);setVariantDraft((()=>{const record=savedTasks.find(t=>t.id===item.taskId);return record?.textEdits?.variantStructure??initialVariantStructure(record?.demoProduct?.variantDetails??[])})());setConfirmVariantChange(false);setImagePreview(false);setForm({...savedTasks.find(t=>t.id===item.taskId)?.textEdits?.legacyMissingValues});}}>{stage==="missing"?(item.missing.length?"查看并补全":"查看结果"):"审核"}</button>
     </div>})}</div></div>{filtered.length>15?<nav className={styles.listPagination} aria-label="商品分页"><span>共 {filtered.length} 条 · 每页 15 条 · 第 {currentPage} / {totalPages} 页</span><div><button type="button" disabled={currentPage===1} onClick={()=>setListPage(p=>Math.max(1,p-1))}>上一页</button><button type="button" disabled={currentPage===totalPages} onClick={()=>setListPage(p=>Math.min(totalPages,p+1))}>下一页</button></div></nav>:null}
    <footer className={styles.foot}>演示记录 · 按原任务与目标店铺继续处理，不自动执行上传</footer>
   </section>
   <section className={styles.explanation}><h2>{stage==="missing"?"为什么需要补全商品信息？":"为什么需要人工审核 AI 建议？"}</h2><p>{stage==="missing"?"补全目标平台必填信息，可减少审核退回并提高发布效率；补全后明确返回原任务继续。":"确认图片、属性、标题、描述等修改与平台要求一致，应用后明确继续上传；未启用智能体的商品不进入待审核。"}</p><button onClick={()=>go(stage==="missing"?"waiting":"uploaded")}>{stage==="missing"?"返回待上传":"查看已上传记录"}</button></section>
  </>}
  {stageBatchDialog?<ShowcaseBatchVersionPicker source={stagePickSource} batches={stagePickerBatches} selected={activeBatch&&activeBatch.source===stagePickSource?{batchId:JSON.parse(activeBatch.key)[1],versionId:activeBatch.version}:null} onSourceChange={setStagePickSource} onClose={()=>setStageBatchDialog(false)} onConfirm={v=>chooseStageBatch(v.batchId,v.versionId)}/>:null}
  {batchDialog?<ShowcaseBatchVersionPicker source={source} batches={pickerBatches} selected={chosenBatch?{batchId:batch,versionId:selectedVersionId}:null} onClose={()=>setBatchDialog(false)} onConfirm={value=>{setBatch(value.batchId);setSelectedVersionId(value.versionId);setBatchDialog(false);setNotice("已选择商品批次及数据版本。")}}/>:null}
  {targetDialog?<div className={styles.overlay} role="presentation" onMouseDown={e=>e.target===e.currentTarget&&setTargetDialog(false)}><section className={`${styles.dialog} ${styles.targetDialog}`} role="dialog" aria-modal="true" aria-label="选择目标平台与店铺">
   <header><h2>选择目标平台与店铺</h2><p>分别选择平台、站点及店铺类型，再从连接正常、服务有效且当前账号可管理的店铺中选择。</p></header>
   <label>平台<select aria-label="选择目标平台" value={draftPlatform} onChange={e=>{setDraftPlatform(e.target.value);setDraftRegion("");setDraftType("");setDraftStore("")}}><option value="">请选择平台</option>{platformChoices.map(value=><option key={value} value={value}>{value}</option>)}</select></label>
   <label>站点<select aria-label="选择目标站点" disabled={!draftPlatform} value={draftRegion} onChange={e=>{setDraftRegion(e.target.value);setDraftType("");setDraftStore("")}}><option value="">请选择站点</option>{regionChoices.map(value=><option key={value} value={value}>{value}</option>)}</select></label>
   <label>店铺类型<select aria-label="选择目标店铺类型" disabled={!draftRegion} value={draftType} onChange={e=>{setDraftType(e.target.value);setDraftStore("")}}><option value="">请选择店铺类型</option>{typeChoices.map(value=><option key={value} value={value}>{value}</option>)}</select></label>
   <label>目标店铺<select aria-label="选择本次目标店铺" disabled={!draftType} value={draftStore} onChange={e=>setDraftStore(e.target.value)}><option value="">请选择店铺</option>{filteredTargetStores.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
   <p>{!draftPlatform?"请先选择平台。":!draftRegion?"请选择目标站点。":!draftType?"请选择店铺类型。":filteredTargetStores.length?"仅显示符合筛选条件的可用店铺。":"当前筛选条件下暂无可用店铺。"}</p>
   <footer><button type="button" onClick={()=>setTargetDialog(false)}>取消</button><button type="button" className={styles.primary} disabled={!draftPlatform||!draftRegion||!draftType||!filteredTargetStores.some(s=>s.id===draftStore)} onClick={()=>{setPlatformSite(draftPlatform+" · "+draftRegion);setStore(draftStore);setTargetDialog(false);setNotice("已确认本次上传的目标平台、站点、店铺类型和店铺。")}}>确认目标店铺</button></footer>
  </section></div>:null}
   {ruleDialog?<AdaptationRulesDialog organizationId={organizationId} memberId={memberId} site={platformSite} storeName={chosenStore?.name??""} onClose={()=>setRuleDialog(false)} onSave={next=>{setCurrentRule(next);setRuleDialog(false);setNotice("适配规则已保存；将在本次上传任务中使用「"+next.name+"」，不会改动原始商品。")}}/>:null}
   {selectedItem?<div className={styles.overlay} role="presentation" onMouseDown={e=>e.target===e.currentTarget&&setSelected(null)}>
 <section role="dialog" aria-modal="true" aria-label={stage==="missing"?"查看并补全":"审核智能体建议"} className={`${styles.dialog} ${styles.productDetailDialog}`}>
  <header className={styles.productDetailHeader}>
   <div><h2>{stage==="missing"?"查看并补全商品资料":"审核智能体优化结果"}</h2><p>商品原始信息与 AI 优化版本独立保留，补全完成后进入审核。</p></div>
   <button type="button" className={styles.productDialogClose} aria-label="关闭查看并补全弹窗" onClick={()=>setSelected(null)}>×</button>
  </header>
  <div className={styles.productDetailBody}>
   <section className={styles.productDialogLeft}>

    <div className={styles.productPhotoPanel}>
     <div className={styles.productSectionHeading}><strong>图片管理{selectedVariantGroup?" · "+selectedVariantGroup.color+(activeSku?" / "+activeSku.size:""):""}</strong></div>
     {variantImageGroups.length?<div className={styles.variantSelectionPanel}>
      <div className={styles.variantSelectorLine}><strong>颜色</strong><div className={styles.variantColorPicker} role="group" aria-label="选择颜色变体">
       {variantImageGroups.map(group=><button type="button" key={group.id} aria-pressed={selectedVariantGroup?.id===group.id} onClick={()=>{setVariantColorId(group.id);setActiveSkuId("");setPhotoIndex(0);setPictureTab("main");setPhotoMode(group.optimizedImages.length?"optimized":"original");setPhotoAiOpen(false)}}><span>{displayVariantColor(group.color)}</span></button>)}
      </div></div>
      <div className={styles.variantSelectorLine}><strong>尺码</strong><div className={styles.variantSizePicker} role="group" aria-label="选择尺码变体">
       {selectedVariantSkus.map(v=><button type="button" key={v.sku} aria-pressed={activeSku?.sku===v.sku} onClick={()=>{setActiveSkuId(v.sku);setFieldTab("sku")}}>{displayVariantSize(v.size)}</button>)}
      </div></div>
     </div>:null}
     <div className={styles.pictureTabs} role="tablist" aria-label="商品图片区">
      <button type="button" role="tab" aria-selected={pictureTab==="main"} onClick={()=>{setPictureTab("main");setPhotoIndex(0);setPhotoAiOpen(false)}}>主图（{selectedMainImages.length}）</button>
      <button type="button" role="tab" aria-selected={pictureTab==="detail"} onClick={()=>{setPictureTab("detail");setPhotoIndex(0);setPhotoAiOpen(false)}}>详情图（{selectedDetailImages.length}）</button>
     </div>
     {selectedVariantGroup&&pictureTab==="main"?<div className={styles.variantImageMode} role="group" aria-label="主图图片版本">
      <button type="button" aria-pressed={photoMode==="optimized"} onClick={()=>{setPhotoMode("optimized");setPhotoIndex(0);setPhotoAiOpen(false)}}>优化图区（{selectedColorOptimizedImages.length}/6）</button>
      <button type="button" aria-pressed={photoMode==="original"} onClick={()=>{setPhotoMode("original");setPhotoIndex(0);setPhotoAiOpen(false)}}>原始图片（{selectedColorOriginalImages.length}）</button>
     </div>:null}
     {selectedVariantGroup&&pictureTab==="main"&&photoMode==="optimized"&&selectedVariantGroup.optimizedImages.length<6?<div className={styles.galleryRecoverRow}>
      <span>此次模拟已优化文字，图片须单独导入到本任务</span>
      <button type="button" disabled={!selectedTask||recoveringPhotos} onClick={()=>void restoreHistoricalPhotos()}>{recoveringPhotos?"正在查找…":"恢复已生成的 AI 重构图片"}</button>
      {selectedTask?.id.startsWith("SHUOMI-AMZ-AI-MULTI:")&&["black","white","navy"].includes(selectedVariantGroup?.id??"")?<>
       <input ref={aiAllColorImportRef} className={styles.galleryFileInput} type="file" accept=".zip,application/zip" aria-label="导入Black White Navy三色共18张AI成品" onChange={e=>{const file=e.currentTarget.files?.[0];void uploadAllAIImages(file);e.currentTarget.value=""}}/>
       <button type="button" disabled={!selectedTask||aiSixImporting} onClick={()=>aiAllColorImportRef.current?.click()}>{aiSixImporting?"正在关联…":"导入三色18张AI成品"}</button>
       <details className={styles.galleryImportAdvanced}><summary>仅导入当前颜色</summary>
        <input ref={aiSixImportRef} type="file" accept=".zip,application/zip" aria-label="导入本颜色的六张AI重构图片包" onChange={e=>{const file=e.currentTarget.files?.[0];void uploadSixAIImages(file);e.currentTarget.value=""}}/>
       </details>
      </>:null}
     </div>:null}
     {selectedVariantGroup&&pictureTab==="main"&&photoMode==="optimized"&&selectedVariantGroup.optimizedImages.some(x=>x.source==="demo-import")?<p className={styles.galleryImportedNote}>已找回 {selectedVariantGroup.optimizedImages.filter(x=>x.source==="demo-import").length} 张历史文件；请确认它们是 AI 重构成品还是其他来源，系统不会擅自改写来源证明。</p>:null}
     {galleryImages.length?<div className={styles.compactGallery}>
      <div className={styles.productHeroImage}>
       <button type="button" className={styles.galleryNav} aria-label="上一张图片" disabled={photoSelected===0} onClick={()=>setPhotoIndex(i=>Math.max(0,i-1))}>‹</button>
       <button type="button" className={styles.pictureZoom} aria-label="放大当前商品图" onClick={()=>setImagePreview(true)}><ListingProductPhoto src={galleryImages[photoSelected]} alt={pictureTab==="main"?"商品主图":"商品详情图"} size={400}/></button>
       <button type="button" className={styles.galleryNav} aria-label="下一张图片" disabled={photoSelected===galleryImages.length-1} onClick={()=>setPhotoIndex(i=>Math.min(galleryImages.length-1,i+1))}>›</button>
       <span className={styles.galleryCounter}>{photoSelected+1} / {galleryImages.length}</span>
      </div>
      <div className={styles.productPhotoThumbnails}>{galleryImages.map((src,i)=><button key={src+i} type="button" aria-label={`查看第 ${i+1} 张图片`} aria-pressed={photoSelected===i} onClick={()=>setPhotoIndex(i)}><ListingProductPhoto src={src} alt={`图片 ${i+1}`} size={72}/></button>)}</div>
     </div>:<div className={styles.pictureEmpty}><strong>{pictureTab==="detail"?"暂无详情图":photoMode==="optimized"?"此模拟任务尚未关联 AI 图片":"暂无图片"}</strong><span>{pictureTab==="main"&&photoMode==="optimized"?"AI 文案优化与图片生成分别保存。请在上方导入已生成的图片包，系统会自动匹配当前商品与颜色；不会用原图冒充优化图。":"可在下方上传图片。"}</span></div>}
     <div className={styles.galleryActions}>
      <input ref={photoFileInput} type="file" accept="image/jpeg,image/png,image/webp" aria-label="上传当前商品图片" className={styles.galleryFileInput} onChange={e=>{const file=e.currentTarget.files?.[0];void handlePhotoUpload(file);e.currentTarget.value=""}}/>
      <button type="button" disabled={photoBusy||!selectedTask} onClick={()=>{setPhotoFileAction("upload");photoFileInput.current?.click()}}>上传图片</button>
      <button type="button" disabled={photoBusy||!rawGalleryImages.length||!selectedTask} onClick={()=>{setPhotoFileAction("replace");photoFileInput.current?.click()}}>替换图片</button>
      <button type="button" disabled={photoSelected===0||!selectedTask} onClick={()=>moveCurrentPhoto(-1)} aria-label="当前图片左移">左移</button>
      <button type="button" disabled={photoSelected>=rawGalleryImages.length-1||!selectedTask} onClick={()=>moveCurrentPhoto(1)} aria-label="当前图片右移">右移</button>
      <button type="button" disabled={!rawGalleryImages.length||!selectedTask} onClick={removeCurrentPhoto}>删除</button>
      <button type="button" className={styles.galleryAiButton} disabled={!aiPhotoSource} onClick={()=>setPhotoAiOpen(v=>!v)}>✦ AI 重构单张</button>
     </div>
     {photoAiOpen?<div className={styles.galleryAiPanel}>
      <strong>单张图片 AI 重构 · {rawGalleryImages.length?"第 "+(photoSelected+1)+" 张":"使用当前变体原图"}</strong>
      {aiPhotoDisplay?<div className={styles.aiSourcePreview}><ListingProductPhoto src={aiPhotoDisplay} alt="当前单张重构的原始参考图片" size={80}/><span>仅使用这一张图片作为重构参考，保留原始文件。</span></div>:null}
      <textarea aria-label="图片 AI 重构要求" rows={2} value={photoAiPrompt} onChange={e=>setPhotoAiPrompt(e.target.value)} placeholder="描述希望如何优化当前图片，例如调整背景与构图，保留商品真实外观。"/>
      <button type="button" onClick={()=>setNotice("当前 GitHub Pages 演示版没有可调用的图片生成后端。原图与重构指令已准备好，但未执行生成；请连接正式图片生成服务后重试，或上传已生成的图片。")}>生成单张重构建议</button>
      <small>此处只针对当前选中的图片；未接通图片生成接口前不会伪造 AI 成品。</small>
     </div>:null}
     {selectedVariantGroup&&selectedTask?.id.startsWith("SHUOMI-AMZ-AI-MULTI:")?<details className={styles.galleryImportAdvanced}>
      <summary>导入已生成的图片包 / 已生成图片地址</summary>
      <div className={styles.variantPhotoAdvancedBody}>
       <label>导入现有图片包<input type="file" accept=".zip,application/zip" disabled={bundleImporting} onChange={e=>{const file=e.currentTarget.files?.[0];void importBundle(file);e.currentTarget.value=""}}/></label>
       <label>图片用途<select aria-label="要关联的优化图用途" value={editingPhotoRole??listingVariantPhotoRoles[0]} onChange={e=>setEditingPhotoRole(e.target.value as ListingVariantPhotoRole)}>{listingVariantPhotoRoles.map(role=><option key={role} value={role}>{role}</option>)}</select></label>
       <label>成品图片地址<input value={photoDraft} onChange={e=>setPhotoDraft(e.target.value)} placeholder="已生成图片的 HTTPS 地址"/></label>
       <button type="button" onClick={()=>saveColorPhoto(editingPhotoRole??listingVariantPhotoRoles[0])}>保存图片关联</button>
      </div>
     </details>:null}
    </div>
   </section>
   <section className={styles.productDialogRight}>
    <div className={styles.productInfoBlock}>
     <div className={styles.productSectionHeading}><strong>平台与商品分类</strong><span className={styles.productStagePill}>{stage==="missing"?"待补全":"待审核"}</span></div>
     <div className={styles.dialogPlatformFacts}>
      <div><small>目标平台</small><strong>{selectedItem.targetPlatform??selectedTask?.platform??"—"}</strong></div>
      <div><small>站点</small><strong>{selectedItem.targetRegion??selectedTask?.region??"—"}</strong></div>
      <div><small>店铺类型</small><strong>{selectedItem.targetStoreType??selectedTask?.storeType??"—"}</strong></div>
      <div><small>目标店铺</small><strong>{selectedItem.store}</strong></div>
     </div>
     <div className={styles.categoryEditor}><div><span>商品分类</span><small>{classChanged?"修改草稿 · 需要重新适配":"当前任务尚未保存已确认的平台类目路径"}</small></div>
      {categoryEdit?<input aria-label="修改目标商品分类" placeholder="输入目标平台分类路径（演示草稿）" value={categoryDraft} onChange={e=>{setCategoryDraft(e.target.value);setCategoryImpactConfirmed(false)}}/>:<span>{categoryDraft||"等待平台类目数据接入"}</span>}
      <button type="button" onClick={()=>setCategoryEdit(v=>!v)}>{categoryEdit?"完成编辑":"修改分类"}</button>
     </div>
     {classChanged?<p className={styles.categoryNotice}>分类改变后商品公共、变体公共、当前变体和SKU字段都需要重新匹配。旧资料及历史版本保留；未验证规则前不能送审。</p>:null}
     {categoryNeedsReview?<div className={styles.aiRuleNote} role="status">
      <strong>分类影响预览 · 等待平台规则复核</strong>
      <p>目标分类：{categoryDraft||"未设置"}。可能影响：公共属性、变体主题、颜色字段、SKU属性及其合法选项。</p>
      <p>演示站点尚未接入该分类的官方规则，不会伪造新必填字段。原图、SKU内部ID、旧分类资料和历史版本都将保留。</p>
      <label><input type="checkbox" checked={categoryImpactConfirmed} onChange={e=>setCategoryImpactConfirmed(e.target.checked)}/> 确认影响并保存待适配草稿</label>
     </div>:null}
    </div>
    <div className={styles.productInfoBlock}>

     <div className={styles.dialogFieldTabs} role="tablist" aria-label="商品资料分组">
      <button type="button" role="tab" aria-selected={fieldTab==="common"} onClick={()=>{setFieldTab("common");setAiTargetField(null);setAiGroupTarget(null);setBatchAiOpen(false)}}>商品公共信息</button>
      <button type="button" role="tab" aria-selected={fieldTab==="shared"} onClick={()=>{setFieldTab("shared");setAiTargetField(null);setAiGroupTarget(null);setBatchAiOpen(false)}}>变体公用信息</button>
      <button type="button" role="tab" aria-selected={fieldTab==="variant"} onClick={()=>{setFieldTab("variant");setAiTargetField(null);setAiGroupTarget(null);setBatchAiOpen(false)}}>变体结构</button>
      <button type="button" role="tab" aria-selected={fieldTab==="sku"} onClick={()=>{setFieldTab("sku");setAiTargetField(null);setAiGroupTarget(null);setBatchAiOpen(false)}}>SKU信息</button>
     </div>
          {batchAiOpen?<section className={styles.aiBatchPanel} aria-label="AI 批量重构配置">
      <header><strong>✦ {aiGroupTarget?"AI重构":aiTargetField?"AI字段重构":"AI批量重构"}</strong><button type="button" aria-label="收起重构配置" onClick={()=>{setBatchAiOpen(false);setAiTargetField(null);setAiGroupTarget(null)}}>×</button></header>
      {aiGroupTarget?<p>{aiGroupTarget.fields.length?"仅处理当前分组允许AI处理的文本和下拉字段："+aiGroupTarget.fields.join("、"):"当前分组暂无已验证可由AI处理的字段，等待平台规则，不会擅自修改资料。"}</p>:aiTargetField?<p>指定字段：{(aiTargetField?.startsWith("platform:")?schema?.fields.find(f=>aiTargetField==="platform:"+f.scope+":"+f.id)?.label:aiEligibleFields.find(f=>f.key===aiTargetField)?.label)??aiTargetField}。仅在符合平台规则时允许重构。</p>:<>
       <label>重构范围
        <select aria-label="重构信息范围" value={batchAiScope} onChange={e=>setBatchAiScope(e.target.value as "current"|"all")}><option value="current">当前信息标签</option><option value="all">整个商品的可编辑文字字段</option></select>
       </label>
       <div className={styles.aiBatchChecks}>
        <label><input type="checkbox" checked={batchAiRequired} onChange={e=>setBatchAiRequired(e.target.checked)}/> 必填信息</label>
        <label><input type="checkbox" checked={batchAiOptional} onChange={e=>setBatchAiOptional(e.target.checked)}/> 选填信息</label>
       </div>
       <p>本次可处理：{selectedAiFields.map(f=>f.label).join("、")||"暂无符合条件的字段"}。未获取平台规则的字段不会擅自纳入。</p>
      </>}
      <label>补充要求（选填）
       <textarea value={batchAiInstructions} onChange={e=>setBatchAiInstructions(e.target.value)} rows={2} maxLength={500} placeholder="优化英文表达，保留真实属性，不添加未经证实的卖点"/>
      </label>
      <div className={styles.aiRuleNote}>平台固定枚举、类目、认证资料、真实参数、价格、库存和所有图片均不会进入批量重构；AI 结果需要人工确认才能应用。</div>
      {aiFeedback?<p role="status" className={styles.aiFeedback}>{aiFeedback}</p>:null}
      <button type="button" className={styles.aiBatchSubmit} disabled={aiGroupTarget?!aiGroupTarget.fields.length:!aiTargetField&&!selectedAiFields.length} onClick={requestAiSuggestions}>生成重构建议</button>
     </section>:null}
     {fieldTab==="common"?<>
      {stage==="review"?scopedGroup("common","required",<>
       <div className={styles.aiEditableField}><div><label htmlFor="listing-edit-title">商品标题</label></div><input id="listing-edit-title" value={textDraft.title} maxLength={500} onChange={e=>setTextDraft(d=>({...d,title:e.target.value}))}/></div>
       <div className={styles.aiEditableField}><div><label htmlFor="listing-edit-desc">商品描述</label></div><textarea id="listing-edit-desc" rows={3} maxLength={6000} value={textDraft.description} onChange={e=>setTextDraft(d=>({...d,description:e.target.value}))}/></div>
       {selectedItem?.missing.length?demoLegacyFields():null}
      </>):<>
      {scopedGroup("common","missing",
       (selectedItem?.missing?.some(field=>!(form[field]??textDraft.legacyMissingValues[field]??"").trim())||!textDraft.title.trim()||!textDraft.description.trim())?<>
        {!textDraft.title.trim()?<div className={styles.aiEditableField}><div><label htmlFor="listing-edit-title">商品标题</label></div><input id="listing-edit-title" value={textDraft.title} onChange={e=>setTextDraft(d=>({...d,title:e.target.value}))}/></div>:null}
        {!textDraft.description.trim()?<div className={styles.aiEditableField}><div><label htmlFor="listing-edit-desc">商品描述</label></div><textarea id="listing-edit-desc" rows={3} value={textDraft.description} onChange={e=>setTextDraft(d=>({...d,description:e.target.value}))}/></div>:null}
        {demoLegacyFields()}
       </>:undefined)}
      {scopedGroup("common","filled",(textDraft.title.trim()||textDraft.description.trim())?<>
       {textDraft.title.trim()?<div className={styles.aiEditableField}><div><label htmlFor="listing-edit-title">商品标题</label></div><input id="listing-edit-title" value={textDraft.title} maxLength={500} onChange={e=>setTextDraft(d=>({...d,title:e.target.value}))}/></div>:null}
       {textDraft.description.trim()?<div className={styles.aiEditableField}><div><label htmlFor="listing-edit-desc">商品描述</label></div><textarea id="listing-edit-desc" rows={3} maxLength={6000} value={textDraft.description} onChange={e=>setTextDraft(d=>({...d,description:e.target.value}))}/></div>:null}
      </>:undefined)}
      </>}
      {scopedGroup("common","optional",demoOptionalFields)}
     </>:fieldTab==="shared"?<div className={styles.aiVariantEditor}>
       {stage==="review"?scopedGroup("shared","required",selectedTask?.demo&&!schemaValid?<div className={styles.individualField}><strong>已填公共属性（演示）</strong><input aria-label="已填公共属性（演示）" value={demoSharedFilled} onChange={e=>setDemoSharedFilled(e.target.value)}/></div>:undefined):null}
       {stage==="missing"?scopedGroup("shared","missing",selectedTask?.demo&&!schemaValid&&!demoSharedRequired.trim()?<div className={styles.individualField}><strong>变体公共补充属性（演示）</strong><input aria-label="变体公共补充属性（演示）" value={demoSharedRequired} placeholder="输入演示资料" onChange={e=>setDemoSharedRequired(e.target.value)}/></div>:undefined):null}
       {stage==="missing"?scopedGroup("shared","filled",selectedTask?.demo&&!schemaValid?<div className={styles.demoOptionalFields}>
        <div className={styles.individualField}><strong>已填公共属性（演示）</strong><input aria-label="已填公共属性（演示）" value={demoSharedFilled} onChange={e=>setDemoSharedFilled(e.target.value)}/></div>
        {demoSharedRequired.trim()?<div className={styles.individualField}><strong>变体公共补充属性（演示）</strong><input aria-label="变体公共补充属性已填（演示）" value={demoSharedRequired} onChange={e=>setDemoSharedRequired(e.target.value)}/></div>:null}
       </div>:undefined):null}
       {scopedGroup("shared","optional",selectedTask?.demo&&!schemaValid?<div className={styles.individualField}><div className={styles.individualFieldHeading}><strong>变体公共备注（演示）</strong></div><textarea rows={2} aria-label="变体公共备注（演示）" value={demoSharedOptional} onChange={e=>setDemoSharedOptional(e.target.value)}/></div>:undefined)}
      </div>
     :fieldTab==="variant"?<div className={styles.variantStructureEditor}>
      {variantDraft.dimensions.map((group,index)=><section className={styles.variantStructureGroup} key={group.id}>
       <div className={styles.variantStructureHeading}><strong>第{index+1}层变体</strong><button type="button" onClick={()=>addVariantValue(group.id)}>＋ 添加</button></div>
       <label className={styles.variantStructureLabel}>变体名称<input aria-label={"第"+(index+1)+"层变体名称"} maxLength={60} value={group.name} onChange={e=>changeVariantName(group.id,e.target.value)}/></label>
       <div className={styles.variantStructureLabel}>变体值<div className={styles.variantStructureValues}>
        {group.values.map(value=><div className={styles.variantStructureValueRow} key={value.id}>
         <input aria-label={group.name+"变体值"} placeholder="输入变体值" maxLength={100} value={value.label} onChange={e=>changeVariantValue(group.id,value.id,e.target.value)}/>
         <button type="button" aria-label={"删除变体值 "+value.label} onClick={()=>removeVariantValue(group.id,value.id)}>删除</button>
        </div>)}
       </div></div>
      </section>)}
      {!variantDraft.dimensions.length?<p className={styles.productHint}>当前商品没有多变体结构。</p>:null}
      {variantDraft.dimensions.length>0?<div className={styles.variantStructureSummary}><span>SKU组合</span><strong>{variantDraft.dimensions.reduce((n,g)=>n*g.values.length,1)} 个</strong></div>:null}
      {structureChanged?<div className={styles.variantStructureReview} role="status">
       <strong>保存前确认</strong>
       <p>保留 {structureImpact.retained} 个原组合 · 新增 {structureImpact.added.length} 个 · 待停用 {structureImpact.removed.length} 个SKU。</p>
       {structureImpact.removed.length>0?<p>受影响原SKU：{structureImpact.removed.join("、")}。原图和历史数据不会删除。</p>:null}
       {structureIssues.map((message,i)=><p key={i} role="alert">{message}</p>)}
       <label><input type="checkbox" checked={confirmVariantChange} onChange={e=>setConfirmVariantChange(e.target.checked)}/> 确认影响，保存为待平台复核草稿</label>
      </div>:null}
      </div>:<div className={styles.aiVariantEditor}>
       {variantDetails.length>0?<div className={styles.aiSkuPills} role="group" aria-label="切换SKU">
        {variantDetails.map(v=><button type="button" key={v.sku} aria-label={"选择SKU："+displayVariantColor(v.color)+" / "+displayVariantSize(v.size)} aria-pressed={editingSkuKey===v.sku} onClick={()=>{setVariantColorId(v.color.trim().toLowerCase());setActiveSkuId(v.sku);setPhotoMode((variantImageGroups.find(g=>g.id===v.color.trim().toLowerCase())?.optimizedImages.length??0)?"optimized":"original");setPhotoIndex(0);setAiTargetField(null);setBatchAiOpen(false)}}>{displayVariantColor(v.color)} / {displayVariantSize(v.size)}</button>)}
       </div>:null}
       {stage==="missing"?scopedGroup("sku","missing",selectedTask?.demo&&!schemaValid&&!scopedValueFor("sku","demo-required").trim()?<div className={styles.individualField}><strong>SKU补充规格（演示）</strong><input aria-label="SKU补充规格（演示）" placeholder="填写当前SKU的演示资料" value={scopedValueFor("sku","demo-required")} onChange={e=>editScopedValue("sku","demo-required",e.target.value)}/></div>:undefined):null}
       {stage==="missing"?scopedGroup("sku","filled",<div className={styles.demoOptionalFields}>
        {selectedTask?.demo&&!schemaValid&&scopedValueFor("sku","demo-required").trim()?<div className={styles.individualField}><strong>SKU补充规格（演示）</strong><input aria-label="SKU已填补充规格（演示）" value={scopedValueFor("sku","demo-required")} onChange={e=>editScopedValue("sku","demo-required",e.target.value)}/></div>:null}
        <div className={styles.aiEditableField}><label htmlFor="listing-merchant-sku">商家SKU编码</label><input id="listing-merchant-sku" aria-label="商家SKU编码" maxLength={100} value={skuIdentityDraft} onChange={e=>setTextDraft(d=>({...d,merchantSkuCodes:{...d.merchantSkuCodes,[editingSkuKey]:e.target.value}}))}/>{invalidSkuCode?<p role="alert">编码不能为空或重复。</p>:null}</div>
       </div>):null}
       {stage==="review"?scopedGroup("sku","required",<div className={styles.aiEditableField}><label htmlFor="listing-merchant-sku">商家SKU编码</label><input id="listing-merchant-sku" aria-label="商家SKU编码" maxLength={100} value={skuIdentityDraft} onChange={e=>setTextDraft(d=>({...d,merchantSkuCodes:{...d.merchantSkuCodes,[editingSkuKey]:e.target.value}}))}/>{invalidSkuCode?<p role="alert">编码不能为空或重复。</p>:null}</div>):null}
       {scopedGroup("sku","optional",selectedTask?.demo&&!schemaValid?<div className={styles.individualField}><div className={styles.individualFieldHeading}><strong>SKU备注（演示）</strong></div><textarea rows={2} aria-label="SKU备注（演示）" value={scopedValueFor("sku","demo-note")} onChange={e=>editScopedValue("sku","demo-note",e.target.value)}/></div>:undefined)}
      </div>}
    </div>

   </section>
  </div>
  {variantPreviewIndex!==null&&selectedVariantGroup?<div className={styles.dialogImageLightbox} role="dialog" aria-modal="true" aria-label="颜色变体图片预览">
    <button type="button" aria-label="关闭变体图片预览" onClick={()=>setVariantPreviewIndex(null)}>关闭</button>
    {(()=>{
      const role=listingVariantPhotoRoles[variantPreviewIndex];
      const image=selectedVariantGroup.optimizedImages.find(img=>img.role===role);
      const src=mediaUrl(image?.url)??selectedVariantGroup.originalImages[0];
      return <div className={styles.variantPreviewLightboxBody}>
       {src?<img src={src} alt={selectedVariantGroup.color+" "+role}/>:null}
       <strong>{selectedVariantGroup.color} · {role}</strong>
       <span>{image?.source==="demo-import"?"已绑定演示素材，尚未完成独立 AI 重构验收":image?"已保存优化结果":"演示预览：原始商品实拍，尚未实际 AI 重构"}</span>
      </div>;
    })()}
   </div>:null}
  {imagePreview&&galleryImages.length?<div className={styles.dialogImageLightbox} role="dialog" aria-modal="true" aria-label="商品图片大图预览">
    <button type="button" onClick={()=>setImagePreview(false)} aria-label="关闭商品图片大图">关闭</button>
    <ListingProductPhoto src={galleryImages[Math.min(photoIndex,galleryImages.length-1)]} alt="商品放大图片" size={640}/>
   </div>:null}
  <footer className={styles.productDetailFooter}>
   <span>{stage==="missing"?"补齐必填资料后提交检查":"核对优化结果；需要调整可直接修改或使用分组AI重构"}</span>
   <div><button type="button" onClick={()=>setSelected(null)}>取消</button><button type="button" onClick={saveTextOnly}>保存修改</button>
    <button type="button" className={styles.primary} onClick={()=>{
     if(stage==="missing"){save();return}
     if(!selectedItem?.taskId){setNotice("当前任务缺少可审核的记录");return}
     if(structureBlocked){setNotice(structureIssues[0]??"请先确认变体结构的变更影响");return}
     if(invalidSkuCode||!skuDisplayName.trim()){setNotice("请检查SKU编码及名称，不能留空或重复");return}
     if(categoryNeedsReview&&!categoryImpactConfirmed){setNotice("请先确认分类变更影响");return}
     if(!persistText())return;
     try{
      approveShowcaseUploadTask(organizationId,memberId,selectedItem.taskId);
      setSelected(null);setNotice("审核通过，已进入待平台提交；本次没有执行真实平台上传。");
     }catch(e){setNotice(e instanceof Error?e.message:"审核失败，请核对必填资料和图片")}
    }}>{stage==="missing"?"提交检查":"审核通过"}</button></div>
  </footer>
 </section>
</div>:null}
 </div>;
}
