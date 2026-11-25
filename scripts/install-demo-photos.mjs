import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
import {inflateRawSync} from "node:zlib";

// Public demonstration images only, never use for private customer uploads.
// Run: node scripts/install-demo-photos.mjs /path/to/shuomi-crocs-demo-18-images.zip
const zipPath=process.argv[2];
if(!zipPath)throw Error("Usage: node scripts/install-demo-photos.mjs <verified-demo-images.zip>");
const data=fs.readFileSync(zipPath);
let eocd=-1;
for(let p=data.length-22;p>=Math.max(0,data.length-65557);p--){
 if(data.readUInt32LE(p)===0x06054b50){eocd=p;break;}
}
if(eocd<0)throw Error("Invalid ZIP");
const count=data.readUInt16LE(eocd+10);
let cursor=data.readUInt32LE(eocd+16);
const entries=new Map();
for(let i=0;i<count;i++){
 if(data.readUInt32LE(cursor)!==0x02014b50)throw Error("Invalid ZIP central directory");
 const method=data.readUInt16LE(cursor+10),packed=data.readUInt32LE(cursor+20),size=data.readUInt32LE(cursor+24);
 const nameLength=data.readUInt16LE(cursor+28),extraLength=data.readUInt16LE(cursor+30),commentLength=data.readUInt16LE(cursor+32);
 const offset=data.readUInt32LE(cursor+42),name=data.subarray(cursor+46,cursor+46+nameLength).toString("utf8");
 cursor+=46+nameLength+extraLength+commentLength;
 if(!name||name.endsWith("/"))continue;
 if(name!=="manifest.json"&&!/^crocs\/(black|white|navy)\/0[1-6]_[a-z_]+\.jpg$/.test(name))throw Error("Unexpected ZIP entry "+name);
 if(data.readUInt32LE(offset)!==0x04034b50)throw Error("Invalid ZIP local record");
 const start=offset+30+data.readUInt16LE(offset+26)+data.readUInt16LE(offset+28);
 const bytes=data.subarray(start,start+packed);
 const image=method===0?Buffer.from(bytes):method===8?inflateRawSync(bytes):null;
 if(!image||image.length!==size)throw Error("Invalid ZIP image "+name);
 entries.set(name,image);
}
const manifest=JSON.parse(entries.get("manifest.json")?.toString("utf8")??"null");
if(manifest?.count!==18||manifest?.source!=="ai-generated"||manifest.images?.length!==18||
 ["black","white","navy"].some(color=>!manifest.colors?.includes(color)))throw Error("Invalid AI demo manifest");
const records=[];
for(const image of manifest.images){
 const bytes=entries.get(image.path);
 if(image.method!=="ai-generated"||!bytes||bytes[0]!==255||bytes[1]!==216||
 createHash("sha256").update(bytes).digest("hex")!==image.sha256)throw Error("Image verification failed: "+image.path);
 records.push([image.path,bytes]);
}
if(records.length!==18)throw Error("Incomplete pack");
// Validate every byte before publishing any assets.
for(const [relative,bytes] of records){
 const file=path.join("public","assets","demo-products",relative);
 fs.mkdirSync(path.dirname(file),{recursive:true});
 fs.writeFileSync(file,bytes);
}
console.log("Installed "+records.length+" verified demo photos. Commit public/assets/demo-products/crocs.");
