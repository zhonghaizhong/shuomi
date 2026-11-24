"use client";
/** Original vector product renders: eight independent white-background illustrative
 * previews per product. These are not seller photographs or a live model service.
 * SVG data URLs avoid remote CORS, Pages asset-copy rules and broken stock images.
 */
export type ListingArtKind="cream"|"charger"|"skillet"|"ereader"|"battery";
const labels:Record<ListingArtKind,[string,string]>={
 cream:["Moisturizing Cream","19 oz"],
 charger:["USB-C Wall Charger","20W"],
 skillet:["Cast Iron Skillet","10.25 inch"],
 ereader:["E-Reader","16GB"],
 battery:["AAA Alkaline Batteries","20 Count"]
};
const views=["Front View","Angled View","Side View","Product Detail","Close-Up","Profile","Feature View","Final Preview"];
const products:Record<ListingArtKind,string>={
 cream:'<ellipse cx="300" cy="490" rx="125" ry="19" fill="#e4e8ed"/><rect x="190" y="230" width="220" height="254" rx="36" fill="url(#white)" stroke="#b8c9d3" stroke-width="4"/><rect x="181" y="214" width="238" height="62" rx="19" fill="#dce8ed" stroke="#b8c9d3" stroke-width="4"/><rect x="211" y="314" width="178" height="114" rx="8" fill="#fff"/><path d="M211 341h178" stroke="#3d87aa" stroke-width="10"/><text x="300" y="384" font-size="22" text-anchor="middle" fill="#246384" font-weight="700">MOISTURIZER</text><text x="300" y="408" font-size="15" text-anchor="middle" fill="#64748b">FACE + BODY</text>',
 charger:'<ellipse cx="300" cy="492" rx="95" ry="14" fill="#e4e8ed"/><rect x="216" y="235" width="168" height="252" rx="28" fill="url(#white)" stroke="#c5cbd2" stroke-width="4"/><rect x="254" y="193" width="18" height="55" rx="5" fill="#afb8c1"/><rect x="326" y="193" width="18" height="55" rx="5" fill="#afb8c1"/><rect x="273" y="286" width="54" height="22" rx="9" fill="#26313f"/><text x="300" y="394" font-size="38" font-weight="700" text-anchor="middle" fill="#465264">20W</text><text x="300" y="423" font-size="17" text-anchor="middle" fill="#64748b">USB-C</text>',
 skillet:'<ellipse cx="300" cy="490" rx="182" ry="17" fill="#e5e7eb"/><path d="M381 332h155q25 0 25 24t-25 24H381" fill="#20252a" stroke="#535960" stroke-width="5"/><ellipse cx="262" cy="362" rx="143" ry="116" fill="#1d2329" stroke="#454b51" stroke-width="10"/><ellipse cx="262" cy="358" rx="121" ry="96" fill="url(#pan)" stroke="#15191d" stroke-width="5"/><circle cx="262" cy="362" r="43" fill="none" stroke="#444c52" stroke-dasharray="5 8"/>',
 ereader:'<ellipse cx="300" cy="500" rx="126" ry="17" fill="#e5e7eb"/><rect x="203" y="148" width="194" height="353" rx="20" fill="#1d2633" stroke="#56606a" stroke-width="5"/><rect x="222" y="181" width="156" height="288" rx="7" fill="#f2f1e9"/><path d="M222 359q35-66 76-10t80-17v137H222z" fill="#c5d6db"/><text x="300" y="260" font-size="22" text-anchor="middle" fill="#3f596d">READ MORE</text>',
 battery:Array.from({length:5},(_,i)=>'<g transform="translate('+(156+i*57)+' '+(i%2*14)+')"><ellipse cx="0" cy="480" rx="24" ry="9" fill="#e2e8f0"/><rect x="-20" y="223" width="40" height="249" rx="8" fill="url(#metal)"/><rect x="-13" y="211" width="26" height="18" rx="4" fill="#bcc4cb"/><rect x="-20" y="342" width="40" height="75" fill="#25384d"/><text x="0" y="390" text-anchor="middle" font-size="19" font-weight="700" fill="#fff">AAA</text></g>').join("")
};
export function renderListingDemoArt(kind:ListingArtKind,index:number):string{
 if(!Number.isInteger(index)||index<0||index>7)throw Error("图片位置仅支持 1–8");
 const angle=[-9,-5,0,6,10,-6,3,0][index];
 const scale=[1,0.92,0.83,1.11,1.19,0.88,1.02,1][index];
 const [title,detail]=labels[kind];
 const inner=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><linearGradient id="white"><stop stop-color="#dce6ee"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#d4dfe6"/></linearGradient><linearGradient id="metal"><stop stop-color="#a4abb5"/><stop offset=".5" stop-color="#f9fafb"/><stop offset="1" stop-color="#9fa7b0"/></linearGradient><radialGradient id="pan"><stop stop-color="#3e464d"/><stop offset="1" stop-color="#161b20"/></radialGradient></defs><rect width="600" height="600" fill="#fff"/><rect x="16" y="16" width="568" height="568" rx="12" fill="none" stroke="#edf0f4" stroke-width="2"/><text x="34" y="60" fill="#536273" font-family="Arial" font-size="19" font-weight="700">${views[index].toUpperCase()}</text><g transform="translate(300 338) rotate(${angle}) scale(${scale}) translate(-300 -338)">${products[kind]}</g><text x="300" y="534" text-anchor="middle" font-family="Arial" font-size="23" fill="#334155" font-weight="700">${title}</text><text x="300" y="558" text-anchor="middle" font-family="Arial" font-size="14" fill="#64748b">${detail} · ILLUSTRATIVE DEMO ${index+1}/8</text></svg>`;
 return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(inner);
}
export const listingDemoArtSet=(kind:ListingArtKind)=>Array.from({length:8},(_,i)=>renderListingDemoArt(kind,i));
