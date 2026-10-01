var vo=Object.defineProperty;var De=(o,a)=>()=>(o&&(a=o(o=0)),a);var wt=(o,a)=>{for(var r in a)vo(o,r,{get:a[r],enumerable:!0})};var en,tn,nn,Ao,on,an,xt,de,rn,sn,ln,Xe,To,Qe,kt=De(()=>{en=o=>{let[a,...r]=String(o??"").split(":");return{kind:a,key:r.join(":"),parts:r}},tn=(o,a={})=>({...a,headers:{"X-CSRF-TOKEN":o,Accept:"application/json",...a.headers??{}}}),nn=o=>(o?.headers?.get?.("content-type")??"").includes("json"),Ao=/\.((?:fa|fas|far|fab|fal|fad|bi|ti|icon|flaticon|glyphicon|ion|mdi)-[a-z0-9][a-z0-9-]*)::?before/gi,on=o=>{let a=[];for(let r of String(o??"").split("}")){let s=r.indexOf("{");if(s===-1)continue;let f=r.slice(s+1).match(/content\s*:\s*(["'])(.*?)\1/);if(!f)continue;let l=f[2].match(/^\\([0-9a-f]{1,6})\s*$/i),y=l?String.fromCodePoint(parseInt(l[1],16)):f[2];if([...y].length===1)for(let k of r.slice(0,s).matchAll(Ao))a.push({name:k[1],glyph:y})}return a},an=(o,a,r,s,f)=>{let l=o.filter(y=>y!==r&&!s.includes(y));return f.forEach(y=>l.includes(y)||l.push(y)),l.push(a),l.join(" ")},xt=({editValue:o,ownText:a,fullText:r})=>(o??"")!==""?o:(a??"").trim()!==""?a:r??"",de=o=>o.children.length?[...o.childNodes].filter(a=>a.nodeType===3).map(a=>a.textContent).join(""):o.textContent,rn=o=>{let a=new Set,r=[];for(let s of o)for(let f of s.icons)a.has(f.name)||(a.add(f.name),r.push({...f,face:s.face,variant:s.variant}));return r.sort((s,f)=>s.name.localeCompare(f.name))},sn=(o,a)=>{let r=Object.keys(a??{}),s=String(o??"").split(",").map(f=>f.trim()).filter(Boolean);return s.length===0?r:r.length===0?s:s.filter(f=>r.includes(f))},ln=(o,a={},r)=>{let s=String(r?.base??"").replace(/\/$/,""),[f,l]=String(o).split("?"),y={"/live-edit/setting":`${s}/${r?.site}/content`,"/live-edit/style":`${s}/${r?.site}/styles`,"/live-edit/publish":`${s}/${r?.site}/publish`,"/live-edit/image":`${s}/${r?.site}/media`,"/live-edit/upload":`${s}/${r?.site}/media`,"/live-edit/changes":`${s}/${r?.site}/changes`,"/live-edit/versions":`${s}/${r?.site}/versions`,"/live-edit/content":`${s}/${r?.site}/content`,"/live-edit/translations":`${s}/${r?.site}/translations`,"/live-edit/credits":`${s}/${r?.site}/credits`,"/live-edit/assist":`${s}/${r?.site}/assist`,"/live-edit/photos":`${s}/${r?.site}/photos`,"/live-edit/photos/used":`${s}/${r?.site}/photos/used`,"/live-edit/imagine":`${s}/${r?.site}/imagine`},k=r?.routes?.[f]??(f==="/live-edit/publish"?r?.publishUrl:null);if(k)return{url:l?`${k}?${l}`:k,init:{...a,headers:{...a.headers??{},...r.routeHeaders??r.publishHeaders??{},Accept:"application/json"},credentials:"same-origin"}};let A=y[f];if(!s||!r?.site||!r?.token)throw new Error("The content API is not configured on this page.");if(!A)throw new Error(`Editing that is not available over the content API yet (${f}).`);return{url:l?`${A}?${l}`:A,init:{...a,headers:{...a.headers??{},Authorization:`Bearer ${r.token}`,Accept:"application/json"}}}},Xe=(o,a,r)=>o.hasAttribute(a)?o.getAttribute(a):o.dataset?.[r]??"",To=(o,a)=>a==null?!0:a===408||a===425||a===429||a>=500,Qe=async(o,{tries:a=3,waits:r=[200,500],sleep:s=null}={})=>{let f=s??(y=>new Promise(k=>setTimeout(k,y))),l=null;for(let y=0;y<a;y++)try{return await o()}catch(k){if(l=k,y===a-1||!To(k,k.status))throw k;await f(r[Math.min(y,r.length-1)])}throw l}});var Ct={};wt(Ct,{applyTags:()=>Et,autoTag:()=>Ze,elementAt:()=>cn,ensureBackgroundsAreFound:()=>Io,fingerprint:()=>dn,refreshBackgrounds:()=>Po,resolveBackgrounds:()=>St,watchForLateBackgrounds:()=>hn});var No,dn,cn,Et,$o,Oo,pn,un,St,Io,Po,hn,Ze,Lt=De(()=>{No="kb_tags_",dn=o=>{let a=2166136261;for(let r=0;r<o.length;r++)a^=o.charCodeAt(r),a=Math.imul(a,16777619);return(a>>>0).toString(16)},cn=(o,a)=>{let r=o.documentElement;for(let s of a)if(r=[...r?.children??[]][s],!r)return null;return r},Et=(o,a)=>{let r=0;for(let{at:s,attributes:f}of a??[]){let l=cn(o,s);if(l){for(let[y,k]of Object.entries(f))l.hasAttribute(y)||l.setAttribute(y,k);r++}}return r},$o=o=>{try{return JSON.parse(window.sessionStorage?.getItem(o)??"null")}catch{return null}},Oo=(o,a)=>{try{window.sessionStorage?.setItem(o,JSON.stringify(a))}catch{}},pn=o=>o.hasAttribute("data-kb-bg")||o.hasAttribute("data-background")||o.hasAttribute("data-bg")||o.hasAttribute("data-background-image")||/background-image|url\(/i.test(o.getAttribute("style")??""),un=(o,a)=>{if(pn(o))return!1;let r=a.getComputedStyle(o).backgroundImage;if(!r||r==="none"||!r.includes("url("))return!1;let s=r.match(/url\(\s*["']?([^"')]+)/)?.[1];return!s||s.startsWith("data:")?!1:(o.setAttribute("data-kb-bg",s),!0)},St=(o=document)=>{let a=o.defaultView??window;if(!a?.getComputedStyle)return 0;let r=0;for(let s of o.querySelectorAll("body *"))un(s,a)&&r++;return r},Io=async(o,a=document)=>{let r=a.defaultView??window;if(r.liveEditBackgroundsWatched)return 0;r.liveEditBackgroundsWatched=!0;let s=await Ze(o,a);return hn(a,()=>{Ze(o,a).catch(f=>{console.warn("[live-edit] could not tag a late background:",f.message)})}),s},Po=async(o,a=document)=>St(a)===0&&a.querySelector("[data-kb-bg]:not([data-edit-bg])")===null?0:Ze(o,a),hn=(o=document,a=()=>{})=>{let r=o.defaultView??window;if(!r?.IntersectionObserver||!r.getComputedStyle)return null;let s=new Set,f=null,l=()=>{if(f=null,s.size===0)return;let N=[...s];s.clear(),a(N)},y=5,k=new WeakMap,A=N=>{if(un(N,r))return s.add(N),O.unobserve(N),f||(f=r.setTimeout(l,250)),!0;let K=(k.get(N)??0)+1;return k.set(N,K),K>=y&&O.unobserve(N),!1},O=new r.IntersectionObserver(N=>{for(let K of N){if(!K.isIntersecting)continue;let H=K.target;A(H)||r.setTimeout(()=>A(H),400)}},{rootMargin:"300px"}),R=[...o.querySelectorAll("body *")].filter(N=>!pn(N)),$=4e3;return R.length>$&&console.warn(`[live-edit] watching the first ${$} of ${R.length} elements for late backgrounds`),R.slice(0,$).forEach(N=>O.observe(N)),O},Ze=async({base:o,site:a,key:r,page:s},f=document)=>{let l=f.querySelector("[data-edit], [data-edit-img]")!==null;if(St(f),l&&!(f.querySelector("[data-kb-bg]:not([data-edit-bg])")!==null))return 0;let k=f.documentElement.outerHTML,A=No+dn(k),O=$o(A);if(O)return Et(f,O);let R=await fetch(`${String(o).replace(/\/$/,"")}/${a}/tag`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json",Authorization:`Bearer ${r}`},body:JSON.stringify({html:k,page:s??f.location?.pathname??""})});if(!R.ok)throw new Error(`Tagging answered ${R.status}`);let{elements:$}=await R.json();return Oo(A,$),Et(f,$)}});var Bo,jo,zo,gn,fn,bn=De(()=>{Bo=new Set(["svg","g","defs","symbol","use","title","desc","path","circle","ellipse","line","polygon","polyline","rect","text","tspan","textpath","lineargradient","radialgradient","stop","clippath","mask","pattern"]),jo=new Set(["viewbox","xmlns","width","height","fill","fill-rule","fill-opacity","stroke","stroke-width","stroke-linecap","stroke-linejoin","stroke-dasharray","stroke-dashoffset","stroke-opacity","stroke-miterlimit","opacity","d","points","x","y","x1","y1","x2","y2","cx","cy","r","rx","ry","transform","offset","stop-color","stop-opacity","gradientunits","gradienttransform","patternunits","clip-rule","clip-path","mask","id","class","role","aria-label","aria-hidden","focusable","preserveaspectratio","vector-effect","text-anchor","font-size","font-family"]),zo=8,gn=o=>{let a=String(o??"").trim();if(a===""||!/<svg/i.test(a))return null;let r=new DOMParser().parseFromString(a,"image/svg+xml"),s=r.documentElement;return!s||s.tagName?.toLowerCase()!=="svg"||r.querySelector("parsererror")||(fn(s),s.children.length===0&&s.textContent.trim()==="")?null:s},fn=o=>{for(let a of[...o.childNodes]){if(a.nodeType===zo){a.remove();continue}if(a.nodeType===1){if(!Bo.has(a.tagName.toLowerCase())){a.remove();continue}fn(a)}}for(let a of[...o.attributes]){let r=a.name.toLowerCase(),s=a.value,l=r==="href"||r==="xlink:href"?s.trim().startsWith("#"):jo.has(r);l&&/url\(/i.test(s)&&!/^url\(\s*#/i.test(s.trim())&&(l=!1),l||o.removeAttribute(a.name)}}});var et={};wt(et,{applyBackground:()=>kn,applyContent:()=>Sn,applyIcon:()=>xn,applyOrder:()=>En,applyStyles:()=>An,applySvg:()=>vn,applyValue:()=>Tt,defendContent:()=>Cn,fetchContent:()=>Nn,fetchSnapshot:()=>Tn,resolve:()=>$n,styleRules:()=>Ln});var At,mn,Tt,Ro,Nt,Fo,Do,qo,wn,Mo,vn,xn,kn,En,Sn,Cn,Ln,An,Tn,Nn,yn,Uo,$n,tt=De(()=>{bn();kt();At=(o,a)=>Object.assign(new Error(o),{status:a}),mn="setting:",Tt=(o,a,{keepRuns:r=!1}={})=>{let s=o.tagName?.toLowerCase();if(s==="img"){o.setAttribute("src",a),Ro(o);return}if(s==="source"){o.setAttribute("srcset",a);return}Nt(o,a,r)},Ro=o=>{if(o.removeAttribute("srcset"),o.removeAttribute("sizes"),o.parentElement?.tagName==="PICTURE")for(let a of[...o.parentElement.children])a.tagName==="SOURCE"&&a.remove()},Nt=(o,a,r=!1)=>{let s=[...o.childNodes].filter(F=>F.nodeType===Mo);if(s.length===0){let F=[...o.children];if(F.length===1&&F[0].children.length===0){Nt(F[0],a);return}o.append(a);return}if(s.length===1){wn(s[0],a);return}let f=s.map(F=>F.nodeValue),l=f.join(""),y=0;for(;y<l.length&&y<a.length&&l[y]===a[y];)y+=1;let k=0;for(;k<l.length-y&&k<a.length-y&&l[l.length-1-k]===a[a.length-1-k];)k+=1;let A=y,O=l.length-k,R=a.slice(y,a.length-k),$=0,N=!1,K=f.map(F=>{let E=$,M=$+F.length;return $=M,N||A<E||O>M?F:(N=!0,F.slice(0,A-E)+R+F.slice(O-E))});if(N){s.forEach((F,E)=>{F.nodeValue=K[E]});return}let H=qo(f,a);if(H!==null){s.forEach((F,E)=>{F.nodeValue=H[E]});return}wn(s[0],a),s.slice(1).forEach(F=>{if(r){F.nodeValue="";return}F.remove()})},Fo=(o,a)=>{let r=o.length,s=a.length,f=s+1,l=new Int32Array((r+1)*f);for(let k=r-1;k>=0;k-=1)for(let A=s-1;A>=0;A-=1)l[k*f+A]=o[k]===a[A]?l[(k+1)*f+A+1]+1:Math.max(l[(k+1)*f+A],l[k*f+A+1]);let y=[];for(let k=0,A=0;k<r&&A<s;)o[k]===a[A]?(y.push([k,A]),k+=1,A+=1):l[(k+1)*f+A]>=l[k*f+A+1]?k+=1:A+=1;return y},Do=(o,a)=>{let r=new Map(o.map(([f,l])=>[f,l])),s=f=>{let l=0;for(let y=f<0?a-1:a;r.has(y);y+=f){let k=r.get(y+f);if(l+=1,k===void 0||Math.abs(k-r.get(y))!==1)break}return l};return Math.max(s(-1),s(1))},qo=(o,a)=>{let r=o.join("");if(r.length===0||a.length===0||r.length*a.length>25e4)return null;let s=Fo(r,a),f=new Map(s.map(([A,O])=>[A,O])),l=[],y=0,k=0;for(let A of o.slice(0,-1)){if(k+=A.length,Do(s,k)<3)return null;let O=y;for(let R=k-1;R>=0;R-=1)if(f.has(R)){O=Math.max(y,f.get(R)+1);break}l.push(a.slice(y,O)),y=O}return l.push(a.slice(y)),l},wn=(o,a)=>{let r=o.nodeValue,s=/^\s/.test(r)&&!/^\s/.test(a)?" ":"",f=/\s$/.test(r)&&!/\s$/.test(a)?" ":"";o.nodeValue=s+a+f},Mo=3,vn=(o,a)=>{let r=gn(a);if(!r)return!1;let s=document.importNode(r,!0);for(let f of["class","width","height","style","data-edit-svg","data-edit-label"])o.hasAttribute(f)&&s.setAttribute(f,o.getAttribute(f));return o.replaceWith(s),!0},xn=(o,a)=>{let r=String(a).replace(/[^A-Za-z0-9_\- ]/g,"").split(/\s+/).filter(Boolean),s=o.getAttribute("data-edit-icon-current");if(r.length===0||!s)return!1;let f=r.length===1?(o.getAttribute("class")??"").trim().split(/\s+/).map(l=>l===s?r[0]:l):r;return o.setAttribute("class",f.join(" ")),o.setAttribute("data-edit-icon-current",r.length===1?r[0]:r[r.length-1]),!0},kn=(o,a)=>{for(let s of["data-background","data-bg","data-background-image"])o.hasAttribute(s)&&o.setAttribute(s,a);let r=(o.getAttribute("style")??"").replace(/background-image\s*:[^;]*;?/gi,"").trim();o.setAttribute("style",`${r?r.replace(/;?$/,";"):""}background-image:url('${a}')`)},En=(o,a)=>{let r=0;for(let s of o.querySelectorAll("[data-edit-list]")){let f=s.getAttribute("data-edit-list");if(!Object.hasOwn(a,f))continue;let l;try{l=JSON.parse(a[f])}catch{continue}if(!Array.isArray(l)||l.length===0)continue;let y=new Map;for(let A of[...s.children])A.hasAttribute("data-edit-item")&&(y.set(A.getAttribute("data-edit-item"),A),s.removeChild(A));if(y.size===0)continue;let k=y.values().next().value;for(let A of l){let O=y.get(String(A));if(O){s.appendChild(O);continue}let R=k.cloneNode(!0);R.setAttribute("data-edit-item",String(A)),s.appendChild(R)}r++}return r},Sn=(o,a)=>{let r=0;En(o,a);for(let s of o.querySelectorAll("[data-edit]")){let f=s.getAttribute("data-edit")??"";if(!f.startsWith(mn))continue;let l=f.slice(mn.length);Object.hasOwn(a,l)&&(Tt(s,a[l]),r++)}for(let s of o.querySelectorAll("[data-edit-img]")){let f=(s.getAttribute("data-edit-img")??"").replace(/^setting:/,"");Object.hasOwn(a,f)&&(Tt(s,a[f]),a[f]?s.dataset.editPreview=a[f]:delete s.dataset.editPreview,r++);for(let[l,y]of[["Alt","alt"],["Title","title"],["Srcset","srcset"]])if(Object.hasOwn(a,f+l)){let k=a[f+l];k===""&&y!=="alt"?s.removeAttribute(y):s.setAttribute(y,k),r++}}for(let s of o.querySelectorAll("[data-edit-svg]")){let f=(s.getAttribute("data-edit-svg")??"").replace(/^setting:/,""),l=a[f];!Object.hasOwn(a,f)||String(l??"").trim()===""||vn(s,l)&&r++}for(let s of o.querySelectorAll("[data-edit-icon]")){let f=(s.getAttribute("data-edit-icon")??"").replace(/^setting:/,""),l=a[f];!Object.hasOwn(a,f)||l===""||xn(s,l)&&r++}for(let s of o.querySelectorAll("[data-edit-bg]")){let f=(s.getAttribute("data-edit-bg")??"").replace(/^setting:/,""),l=a[f];!Object.hasOwn(a,f)||l===""||(kn(s,l),r++)}for(let s of o.querySelectorAll("[data-edit-href]")){let f=s.getAttribute("data-edit-href");Object.hasOwn(a,f)&&(s.setAttribute("href",a[f]),r++)}return r},Cn=(o,{limit:a=12,debounce:r=60}={})=>{let s=o.defaultView??(typeof window>"u"?null:window);if(!s?.MutationObserver)return null;let f=o.querySelectorAll("[data-edit], [data-edit-img], [data-edit-href]");if(f.length===0)return null;let l=new Map;for(let $ of f)l.set($,{words:$.hasAttribute("data-edit")?de($):null,src:$.getAttribute("src"),href:$.hasAttribute("data-edit-href")?$.getAttribute("href"):null});let y=0,k=!1,A=null,O=()=>{if(A=null,!o.body?.classList?.contains("editing")){y++,k=!0;for(let[$,N]of l)$.isConnected&&(N.words!==null&&de($)!==N.words&&Nt($,N.words),N.src!==null&&$.getAttribute("src")!==N.src&&($.setAttribute("src",N.src),$.removeAttribute("srcset")),N.href!==null&&$.getAttribute("href")!==N.href&&$.setAttribute("href",N.href));R.takeRecords(),k=!1,y>=a&&(R.disconnect(),console.warn(`[live-edit] this page keeps rewriting itself; the client's content was put back ${y} times and is now being left alone.`))}},R=new s.MutationObserver(()=>{k||A||y>=a||(A=s.setTimeout(O,r))});for(let $ of f)R.observe($,{characterData:!0,childList:!0,subtree:!0,attributes:!0,attributeFilter:["src","srcset","href"]});return R},Ln=(o,a)=>{let r=`[data-style="${o}"]`,s="",f="";for(let[l,y]of Object.entries(a??{}))if(!(y===""||y===null||y===void 0)){if(l==="hidden"){s+=`body:not(.editing) ${r}{display:none !important}`,s+=`body.editing ${r}{opacity:.45}`;continue}f+={backgroundImage:`background-image:url('${y}') !important;background-size:cover !important;background-position:center !important;`,background:`background:${y} !important;`,textColor:`color:${y} !important;`,fontSize:`font-size:${y}px !important;`,radius:`border-radius:${y}px !important;`,paddingX:`padding-left:${y}px !important;padding-right:${y}px !important;`,paddingY:`padding-top:${y}px !important;padding-bottom:${y}px !important;`}[l]??""}return f===""?s:s+`${r}{${f}}`},An=(o,a)=>{let r=Object.entries(a??{}).map(([y,k])=>Ln(y,k)).join("");if(r==="")return 0;let s="live-edit-styles",f=o.getElementById?.(s)??o.querySelector?.(`#${s}`)??null,l=f??o.createElement("style");return l.id=s,l.textContent=r,f||(o.head??o.body)?.appendChild(l),Object.keys(a).length},Tn=async({snapshot:o,locale:a})=>{let r=String(o).replace(/\/$/,""),s=await Qe(()=>fetch(`${r}/current.json`).then(l=>{if(!l.ok)throw At(`Pointer answered ${l.status}`,l.status);return l.json()}));if(!s.version)return{settings:{},styles:{}};let f=a??"en";return Qe(async()=>{let l=await fetch(`${r}/v${s.version}/${f}.json`);if(!l.ok)throw At(`Version answered ${l.status}`,l.status);return l.json()})},Nn=async({base:o,site:a,key:r,locale:s})=>{let f=`${String(o).replace(/\/$/,"")}/${a}/content${s?`?locale=${encodeURIComponent(s)}`:""}`;return Qe(async()=>{let l=await fetch(f,{headers:{Authorization:`Bearer ${r}`,Accept:"application/json"}});if(!l.ok)throw At(`Content service answered ${l.status}`,l.status);return l.json()})},yn=async()=>{let o=typeof window<"u"?window.liveEditContent:null;if(!o)return;let a=null,r=null;try{let s=await $n(o);s&&(s.styleProps&&(window.liveEditStyleProps=s.styleProps),typeof s.pending=="number"&&s.styleProps&&(window.liveEditPublishing={...window.liveEditPublishing??{},pending:s.pending}),a=Sn(document,s.settings??{}),An(document,s.styles??{}),window.liveEditStyles=s.styles??{},Cn(document))}catch(s){r=s,console.warn("[live-edit] serving the words already in the page:",s.message)}Uo({applied:a,failed:r?r.message:null})},Uo=o=>{window.liveEditContentDone=o,document.dispatchEvent(new CustomEvent("live-edit:content",{detail:o}))},$n=async o=>{if(o.snapshot)try{return await Tn(o)}catch(a){let r=a.message.includes("fetch")?" (if the files are on another origin, the bucket or CDN must allow cross-origin reads)":"";if(!o.base)throw new Error(a.message+r);console.warn("[live-edit] falling back to the content API:",a.message+r)}return o.base&&o.site&&o.key?Nn(o):null};typeof document<"u"&&(document.readyState==="loading"?document.addEventListener("DOMContentLoaded",yn):yn())});var jn={};wt(jn,{collectFromFragment:()=>In,contentConfigFor:()=>Vo,currentSession:()=>Wo,forget:()=>_o,requestLink:()=>Ho,store:()=>Pn,stored:()=>Bn});var $t,On,In,Pn,Bn,_o,Ho,Wo,Vo,zn=De(()=>{$t="kb_session",On="kb_session=",In=(o=window)=>{let a=o.location?.hash??"",r=a.indexOf(On);if(r===-1)return null;let s=decodeURIComponent(a.slice(r+On.length).split("&")[0]);if(s==="")return null;Pn(s,o);let f=a.slice(0,r).replace(/[#&]$/,"");return o.history?.replaceState?.(null,"",o.location.pathname+o.location.search+f),s},Pn=(o,a=window)=>{try{a.sessionStorage?.setItem($t,o)}catch{}},Bn=(o=window)=>{try{return o.sessionStorage?.getItem($t)??null}catch{return null}},_o=(o=window)=>{try{o.sessionStorage?.removeItem($t)}catch{}},Ho=async({base:o,site:a},r,s=window)=>(await fetch(`${String(o).replace(/\/$/,"")}/sign-in`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({site:a,email:r,return_to:s.location.origin+s.location.pathname})})).ok,Wo=(o=window)=>In(o)??Bn(o),Vo=(o,a)=>{let r={base:o.api,site:o.site,locale:o.locale??null};return a?{...r,key:a,snapshot:null}:{...r,key:o.key,snapshot:o.snapshot??null}}});var xo=`
:host { all: initial; }
*, *::before, *::after { box-sizing: border-box; }
/* A class that sets display beats the browser's rule for [hidden], so a button
   hidden in script stayed on screen. The preview link showed on every site
   without publishing, doing nothing when pressed. */
[hidden] { display: none !important; }
/* The brand's palette, from the design handoff. The frame was brought over
   and the inside of the panel was not, so the tabs sat on carbon and every
   field under them was still blue-grey. One set of names, one look. */
:host {
  --le-ink: #0B0C0F;
  --le-body: #45484F;
  --le-muted: #9A9DA5;
  --le-line: #E6E7EA;
  --le-field: #DADCE0;
  --le-soft: #F4F5F7;
  --le-accent: #0B0C0F;
  --le-accent-soft: rgba(11, 12, 15, .08);
  /* Cobalt is the accent and the handoff is strict about it: one primary
     action per view. It marks selection and focus, not every button. */
  /* The brand blue, and it is spent in exactly one place: Publish. Anything
     else on the bar that wants attention gets white on the dark ground, so
     the blue keeps meaning "this is the button that puts it live". */
  --le-blue: #1B6EF3;
  --le-blue-hover: #145CD4;
  --le-on-dark: #FFFFFF;
  --le-on-dark-hover: #E6E7EA;
  --le-danger: #C0392B;
  --le-shadow: 0 30px 80px -20px rgba(11, 12, 15, .3);
  font-family: 'Schibsted Grotesk', ui-sans-serif, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 14px; line-height: 1.5; color: var(--le-body);
  -webkit-font-smoothing: antialiased;
}
/* The overlay's own typography, set on what it draws rather than on :host.
 *
 * A rule in the page that MATCHES the host element beats a :host rule \u2014 that
 * is the cascade, not a bug \u2014 and almost every bought template ships a reset
 * like "html, body, div, span, \u2026 { font: inherit }", which matches the div the
 * shadow root is attached to. The host then inherits the site's typeface and
 * every inheritable property crosses the boundary with it, so the panel wore
 * Merriweather on one site and something else on the next.
 *
 * These children live in the shadow tree, where no rule in the page can reach
 * them. Stated rather than reset, because the point is that the editor looks
 * the same on every site it is a guest on. */
:host > * {
  font-family: 'Schibsted Grotesk', ui-sans-serif, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  font-weight: 400;
  font-style: normal;
  line-height: 1.5;
  letter-spacing: normal;
  text-transform: none;
  text-align: left;
  color: var(--le-body);
}
button, input, select, textarea { font: inherit; color: inherit; margin: 0; }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }

/* ---- the floating bar ---- */
/* One dark pill, bottom-centre. Solid rather than translucent: over a
   photograph a blurred bar takes on whatever is behind it, so the same control
   looked different on every page and washed out entirely on a pale hero. */
.le-toolbar {
  position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
  z-index: 2147483000; display: flex; align-items: center; gap: 6px;
  max-width: calc(100vw - 24px); overflow-x: auto; white-space: nowrap;
  padding: 6px; border-radius: 999px;
  background: #0B0C0F;
  color: #fff; font-size: 13px;
  box-shadow: 0 20px 50px -10px rgba(11,12,15,.45);
  scrollbar-width: none;
}
.le-hello {
  font-size: 13px; color: rgba(255,255,255,.72); white-space: nowrap;
  padding-left: 10px; margin-left: 2px; border-left: 1px solid rgba(255,255,255,.14);
}
.le-mark {
  width: 34px; height: 34px; flex: none; border-radius: 999px; background: #fff;
  display: inline-flex; align-items: center; justify-content: center;
}
/* Only when it goes somewhere. A mark that lifts under the pointer and then
   does nothing is a worse lie than one that never moved. */
a.le-mark { cursor: pointer; transition: transform .12s ease, box-shadow .12s ease; }
a.le-mark:hover { transform: translateY(-1px); box-shadow: 0 0 0 3px rgba(255,255,255,.16); }
a.le-mark:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
.le-sep { width: 1px; height: 20px; flex: none; background: #2A2C31; }
/* A round button for the one-glyph controls: undo, redo. */
.le-round {
  width: 34px; height: 34px; flex: none; cursor: pointer; border: 0;
  border-radius: 999px; background: none; color: #fff;
  display: inline-flex; align-items: center; justify-content: center;
  transition: background .15s ease, opacity .15s ease;
}
.le-round:hover { background: #2A2C31; }
.le-round:disabled { opacity: .3; cursor: default; background: none; }
.le-bar-btn {
  cursor: pointer; border: 0; border-radius: 999px; padding: 8px 14px;
  background: none; color: #fff; font-size: 13px; font-weight: 500;
  transition: background .15s ease;
}
.le-bar-btn:hover { background: #2A2C31; }
.le-bar-btn.is-on { background: #2A2C31; }
/* The site's other pages, so editing one does not mean hunting for the next.
   A segmented track rather than separate buttons, because these are one
   choice with several answers and only one of them can be true. */
.le-pages {
  display: flex; align-items: center; gap: 2px; flex: none;
  background: #1B1D22; border-radius: 999px; padding: 3px;
}
.le-page-btn {
  cursor: pointer; border: 0; background: none; color: #fff;
  border-radius: 999px; padding: 5px 12px; font-size: 12px; font-weight: 500;
  white-space: nowrap; transition: background .15s ease;
}
.le-page-btn:hover { background: #2A2C31; }
.le-page-btn.is-on { background: #fff; color: #0B0C0F; font-weight: 600; }
.le-page-btn.is-on:hover { background: #fff; }

/* Which language is being edited. A native select, so it works with a
   keyboard, a screen reader and a phone without any of that being rebuilt
   here - styled to sit in the bar rather than replaced by something that only
   looks like a menu. */
.le-lang {
  cursor: pointer; flex: none; appearance: none;
  background: #1B1D22 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23fff' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 10px center;
  color: #fff; border: 0; border-radius: 999px;
  padding: 7px 26px 7px 12px; font-size: 12px; font-weight: 500;
  font-family: inherit; line-height: 1.2;
}
.le-lang:hover { background-color: #2A2C31; }
.le-lang:disabled { opacity: .5; cursor: progress; }
.le-lang:focus-visible { outline: 2px solid var(--le-blue); outline-offset: 2px; }
/* The options themselves are drawn by the operating system, which does not
   inherit the bar's colours. Naming both keeps a dark menu from rendering as
   white text on white. */
.le-lang option { background: #1B1D22; color: #fff; }

/* Publish is the one accent on the view, and it carries how much is waiting.
   A count is the difference between "publish" as a habit and as a decision. */
.le-publish {
  cursor: pointer; border: 0; border-radius: 999px; padding: 8px 16px;
  background: var(--le-blue); color: #fff; font-size: 13px; font-weight: 500;
  display: inline-flex; align-items: center; gap: 8px;
  transition: background .15s ease, opacity .15s ease;
}
.le-publish:hover { background: var(--le-blue-hover); }
.le-publish[disabled] { opacity: .45; cursor: default; background: var(--le-blue); }
.le-publish-count {
  min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px;
  background: rgba(255,255,255,.22); font-size: 12px; line-height: 20px; text-align: center;
}
/* With the panel open the bar has far less room, and four of its controls are
   reachable inside the panel anyway. */
.le-toolbar.is-compact .le-when-roomy { display: none; }
.le-toolbar::-webkit-scrollbar { display: none; }
/* On a narrow screen the bar clipped its own controls behind a scrollbar it
   hides, so a phone showed the status sentence and no buttons at all. The
   sentence is the widest thing in it and the least useful \u2014 the dot already
   says whether editing is on \u2014 so it goes, and what is left wraps rather than
   scrolling out of reach. */
@media (max-width: 760px) {
  .le-toolbar {
    left: 10px; right: 10px; transform: none; max-width: none;
    flex-wrap: wrap; justify-content: center; gap: 6px;
    border-radius: 18px; padding: 8px; overflow-x: visible; white-space: normal;
  }
  .le-status { padding-right: 0; }
  .le-status span { display: none; }
}
.le-status { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #9A9DA5; padding: 0 6px 0 2px; }
/* No gap where no words are: an empty label still reserved its padding, which
   left the greeting sitting oddly far from the mark. */
.le-status:not(.is-saying) { gap: 0; padding-right: 0; }
.le-dot { width: 7px; height: 7px; border-radius: 999px; background: #64748b; flex: none; box-shadow: 0 0 0 3px rgba(100,116,139,.18); transition: background .2s ease, box-shadow .2s ease; }
.le-toolbar.is-editing .le-dot { background: var(--le-on-dark); box-shadow: 0 0 0 3px rgba(255,255,255,.18); }
.le-btn {
  cursor: pointer; border: 0; border-radius: 999px; padding: 9px 18px;
  font-size: 13px; font-weight: 600; background: var(--le-accent); color: #fff;
  text-decoration: none; display: inline-flex; align-items: center; gap: 6px;
  box-shadow: 0 6px 16px -8px rgba(11,18,32,.6); transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
}
.le-btn:hover { background: #000; transform: translateY(-1px); }
.le-btn:active { transform: translateY(0); }
.le-btn-ghost {
  cursor: pointer; border: 1px solid rgba(255,255,255,.16); background: rgba(255,255,255,.04);
  color: #cbd5e1; border-radius: 999px; padding: 8px 14px; font-size: 13px; font-weight: 500;
  text-decoration: none; display: inline-flex; align-items: center; transition: background .15s ease, color .15s ease;
}
.le-btn-ghost:hover { background: rgba(255,255,255,.12); color: #fff; }
.le-toolbar .le-btn { background: #fff; color: #0b1220; box-shadow: none; }
.le-toolbar .le-btn:hover { background: #e9edf3; }
.le-locale {
  cursor: pointer; border: 1px solid rgba(255,255,255,.16); background: rgba(255,255,255,.04);
  color: #cbd5e1; border-radius: 999px; padding: 8px 12px; font-size: 13px;
}

/* ---- drawer ---- */
/* A floating card rather than a panel welded to the edge.
   The handoff is specific about this and it is not decoration: an
   edge-attached drawer reads as part of the browser, and the thing it is
   attached to is somebody else's website. Held off every edge by 12px, the
   page underneath stays visibly theirs and the editor stays visibly ours. */
.le-drawer {
  position: fixed; top: 12px; right: 12px; bottom: 12px; z-index: 2147483000;
  width: min(340px, calc(100vw - 24px)); display: none; flex-direction: column;
  background: #fff; border: 1px solid var(--le-line);
  border-radius: 16px; box-shadow: 0 30px 80px -20px rgba(11,12,15,.3); overflow: hidden;
}
.le-drawer.is-open { display: flex; animation: le-slide .28s cubic-bezier(.2,.7,.2,1); }
@keyframes le-slide { from { transform: translateX(16px); opacity: 0; } to { transform: none; opacity: 1; } }
.le-drawer-head {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 0 12px 0 20px; border-bottom: 1px solid var(--le-line); background: #fff;
}
.le-tabs { display: flex; align-items: center; gap: 18px; }
.le-tab {
  cursor: pointer; border: 0; background: none; padding: 16px 0 14px;
  font-size: 13px; font-weight: 500; color: #9A9DA5;
  border-bottom: 2px solid transparent; transition: color .15s ease;
}
.le-tab:hover { color: #45484F; }
.le-tab.is-on { color: #0B0C0F; border-bottom-color: #0B0C0F; }
:host :is(input, textarea, select):focus { border-color: var(--le-accent); outline: 1px solid var(--le-accent); }
.le-tab-count {
  display: inline-block; margin-left: 5px; min-width: 16px; padding: 0 4px;
  border-radius: 999px; background: #EEEFF1; color: #45484F;
  font-size: 11px; font-weight: 500; line-height: 16px; text-align: center;
}
.le-tab.is-on .le-tab-count { background: #0B0C0F; color: #fff; }
/* ---- AI assist ---- */
.le-assist-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.le-assist-balance { font-size: 12px; color: #9A9DA5; }
.le-assist {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  width: 100%; cursor: pointer; border: 0; border-radius: 10px;
  padding: 11px 14px; background: #F4F5F7; color: #0B0C0F;
  font-size: 14px; font-weight: 500; text-align: left;
  transition: background .15s ease, opacity .15s ease;
}
.le-assist:hover { background: #EBECEF; }
.le-assist:disabled { opacity: .5; cursor: default; background: #F4F5F7; }
/* The price, next to the thing it buys. Somebody about to spend a credit
   should not have to remember what it costs. */
.le-assist-cost { font-size: 12px; color: #9A9DA5; font-weight: 400; }
.le-assist-cost.is-short { color: #C0392B; }

/* ---- the Changes and History lists ---- */
.le-change { display: flex; flex-direction: column; gap: 4px; padding-bottom: 16px; border-bottom: 1px solid #EEEFF1; }
.le-change:last-child { border-bottom: 0; padding-bottom: 0; }
.le-change-head { justify-content: space-between; align-items: baseline; }
.le-change-label { font-size: 13px; font-weight: 500; color: #0B0C0F; }
/* Struck through, because it is what the page USED to say. Somebody checking
   a change reads these two lines as a before and an after. */
.le-change-before { font-size: 13px; color: #9A9DA5; text-decoration: line-through; margin: 0; }
.le-change-after { font-size: 14px; font-weight: 500; color: #2A2C31; margin: 0; }
.le-change-when { font-size: 12px; color: #9A9DA5; margin: 2px 0 0; }
.le-version { display: flex; gap: 12px; align-items: flex-start; padding-bottom: 14px; }
.le-version-dot { width: 8px; height: 8px; margin-top: 6px; border-radius: 999px; background: #DADCE0; flex: none; }
.le-version-dot.is-latest { background: var(--le-ink); }

/* What the panel is editing, under the tabs rather than beside them. */
.le-subject { padding: 18px 20px 0; }
.le-subject .le-eyebrow { letter-spacing: .04em; }
.le-eyebrow { font-size: 10px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: var(--le-muted); margin-bottom: 6px; }
.le-title { font-size: 19px; font-weight: 700; color: var(--le-ink); letter-spacing: -.01em; }
.le-trail { display: none; flex-wrap: wrap; align-items: center; gap: 4px; font-size: 11px; color: var(--le-muted); margin-bottom: 6px; }
.le-trail.is-visible { display: flex; }
.le-crumb {
  cursor: pointer; border: 0; background: var(--le-soft); color: var(--le-accent);
  padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; transition: background .15s ease, color .15s ease;
}
.le-crumb:hover { background: var(--le-accent); color: #fff; }
.le-close {
  cursor: pointer; width: 32px; height: 32px; flex: none; border-radius: 10px;
  border: 1px solid var(--le-line); background: #fff; color: var(--le-body);
  font-size: 17px; line-height: 1; transition: background .15s ease, color .15s ease;
}
.le-close:hover { background: var(--le-soft); color: var(--le-ink); }
.le-fields { flex: 1; overflow: auto; padding: 22px 24px; display: flex; flex-direction: column; gap: 18px; }
/*
 * Nothing in this column gets squeezed; the column scrolls instead.
 *
 * A flex child shrinks by default, so every fixed height in here was a
 * suggestion that held only while the panel was short enough. The image
 * preview is 190px tall and was measured at 2px \u2014 its own borders, nothing in
 * between \u2014 so a client replacing a picture could not see the picture they
 * were replacing. Nothing errored and the field worked; it was simply blank.
 *
 * It appeared the day the panel started showing an element's styling and its
 * contents as well as its own fields, which made panels tall enough to
 * overflow. The height was never really being honoured \u2014 it just had not been
 * asked to prove it yet.
 */
.le-fields > * { flex-shrink: 0; }
.le-foot {
  display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  padding: 14px 24px; border-top: 1px solid var(--le-line); background: var(--le-soft);
}
.le-btn-outline {
  cursor: pointer; border: 1px solid var(--le-field); background: #fff; color: var(--le-body);
  border-radius: 999px; padding: 10px 18px; font-size: 13px; font-weight: 600; transition: background .15s ease, border-color .15s ease;
}
.le-btn-outline:hover { background: var(--le-soft); border-color: var(--le-muted); }
.le-btn-danger {
  cursor: pointer; border: 1px solid rgba(225,29,72,.3); background: rgba(225,29,72,.05);
  color: var(--le-danger); border-radius: 999px; padding: 8px 16px; font-size: 13px; font-weight: 600; transition: background .15s ease;
}
.le-btn-danger:hover { background: rgba(225,29,72,.12); }
.le-btn-danger.le-start { margin-right: auto; }
.le-hidden { display: none !important; }

/* ---- fields ---- */
.le-field { display: flex; flex-direction: column; gap: 7px; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--le-muted); }
.le-field.le-divided { border-top: 1px solid var(--le-line); padding-top: 18px; }
.le-input {
  width: 100%; border: 1px solid var(--le-field); border-radius: 12px; background: #fff;
  padding: 11px 14px; font-size: 14px; font-weight: 400; letter-spacing: normal; text-transform: none;
  color: var(--le-ink); outline: none; resize: vertical; transition: border-color .15s ease, box-shadow .15s ease;
}
.le-input::placeholder { color: #aab4c2; }
/* The text box holds the client's own words, so it reads like a page rather
   than a form control: a longer measure, room to breathe, and a surface that
   lifts to white as they type. */
.le-prose {
  font-size: 15px; line-height: 1.65; padding: 14px 16px; min-height: 76px;
  background: var(--le-soft); border-radius: 14px; resize: none; overflow: hidden;
  transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
}
.le-prose:hover { background: #fff; }
.le-prose:focus { background: #fff; }
/* The address sits beside the words, so it is built from the same surface:
   one field, not a form control bolted under a designed one. */
.le-link {
  font-size: 15px; padding: 13px 16px; border-radius: 14px; background: var(--le-soft);
  transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
}
.le-link:hover, .le-link:focus { background: #fff; }
.le-input:focus { border-color: var(--le-accent); box-shadow: 0 0 0 4px var(--le-accent-soft); }
.le-icon-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(52px, 1fr));
    gap: 6px;
    max-height: 320px;
    overflow-y: auto;
    padding: 4px 2px;
}
.le-icon-choice {
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    font-size: 19px;
    color: var(--le-ink);
    background: #fff;
    border: 1px solid var(--le-field);
    border-radius: 8px;
    cursor: pointer;
    transition: border-color .12s, background .12s;
}
.le-icon-choice:hover { border-color: var(--le-accent); background: var(--le-soft); }
.le-icon-choice.is-current { border-color: var(--le-accent); box-shadow: inset 0 0 0 1px var(--le-accent); }
/* The glyph is drawn with the page's icon font, set inline per element. */
.le-icon-choice { line-height: 1; }
/* The publish button inside the panel. Same blue as the one on the bar,
   because it does the same thing; it was left carrying dark green text from
   when the accent was green, which on blue is close to unreadable. */
.le-btn-publish {
  border: none; background: var(--le-blue); color: #fff; font-weight: 600;
  border-radius: 999px; padding: 8px 16px; cursor: pointer; font-size: 13px;
  transition: filter .15s ease;
}
.le-btn-publish:hover { filter: brightness(1.06); }
.le-btn-publish:disabled { opacity: .5; cursor: default; filter: none; }
.le-immediate {
  margin-top: 10px; padding: 10px 12px; border-radius: 10px;
  background: #fff8e6; border: 1px solid #f0dfae; color: #7a5b12;
}
.le-hint { font-size: 11px; font-weight: 400; letter-spacing: normal; text-transform: none; color: var(--le-muted); }
.le-section-heading {
  margin-top: 4px; border-top: 1px solid var(--le-line); padding-top: 18px;
  font-size: 10px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: var(--le-muted);
}
.le-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.le-label { font-size: 13px; font-weight: 600; color: var(--le-body); letter-spacing: normal; text-transform: none; }
.le-chip-btn {
  cursor: pointer; border: 1px solid var(--le-field); background: #fff; color: var(--le-body);
  border-radius: 999px; padding: 8px 14px; font-size: 12px; font-weight: 600; transition: background .15s ease, border-color .15s ease;
}
.le-chip-btn:hover { background: var(--le-soft); border-color: var(--le-accent); color: var(--le-accent); }
.le-color { width: 56px; height: 38px; cursor: pointer; border: 1px solid var(--le-field); border-radius: 10px; background: #fff; padding: 3px; }
.le-default { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px; font-weight: 500; letter-spacing: normal; text-transform: none; color: var(--le-muted); }
.le-tools { display: flex; align-items: center; gap: 5px; }
.le-tool { height: 28px; min-width: 28px; cursor: pointer; border: 1px solid var(--le-field); border-radius: 8px; background: #fff; color: var(--le-body); padding: 0 7px; font-size: 12px; transition: background .15s ease; }
.le-tool:hover { background: var(--le-soft); }
.le-tool.is-bold { font-weight: 700; }
.le-tool.is-italic { font-style: italic; }
.le-icons { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }
.le-icon { display: flex; height: 40px; cursor: pointer; align-items: center; justify-content: center; border: 1px solid var(--le-field); border-radius: 10px; background: #fff; color: var(--le-body); transition: background .15s ease, border-color .15s ease; }
.le-icon:hover { background: var(--le-soft); border-color: var(--le-accent); }
.le-icon.is-active { border-color: var(--le-accent); background: var(--le-accent); color: #fff; }
.le-icon svg { width: 20px; height: 20px; }
.le-preview { display: flex; height: 190px; align-items: center; justify-content: center; overflow: hidden; border-radius: 14px; background: var(--le-soft); border: 1px solid var(--le-line); font-size: 13px; font-weight: 400; letter-spacing: normal; text-transform: none; color: var(--le-muted); }
.le-preview img { width: 100%; height: 100%; object-fit: cover; }
.le-thumb { height: 92px; width: 100%; object-fit: cover; border-radius: 12px; border: 1px solid var(--le-line); }
.le-upload {
  display: flex; cursor: pointer; flex-direction: column; gap: 8px;
  border: 1.5px dashed var(--le-field); border-radius: 14px; background: var(--le-soft);
  padding: 14px 16px; font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--le-muted);
  transition: border-color .15s ease, background .15s ease;
}
.le-upload:hover { border-color: var(--le-accent); background: #fff; }
.le-upload input[type=file] { cursor: pointer; font-size: 13px; font-weight: 400; letter-spacing: normal; text-transform: none; color: var(--le-body); }

/* ---- form controls ---- */
input[type=checkbox], input[type=radio] {
  appearance: none; -webkit-appearance: none; width: 18px; height: 18px; flex: none;
  cursor: pointer; border: 1.5px solid var(--le-field); background: #fff;
  display: inline-grid; place-content: center;
  transition: border-color .15s ease, background .15s ease;
}
input[type=checkbox] { border-radius: 6px; }
input[type=radio] { border-radius: 999px; }
input[type=checkbox]:hover, input[type=radio]:hover { border-color: var(--le-ink); }
input[type=checkbox]::after {
  content: ''; width: 10px; height: 10px; transform: scale(0); transition: transform .12s ease-in-out;
  box-shadow: inset 1em 1em #fff;
  clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
}
input[type=radio]::after {
  content: ''; width: 8px; height: 8px; border-radius: 999px; transform: scale(0);
  transition: transform .12s ease-in-out; box-shadow: inset 1em 1em #fff;
}
input[type=checkbox]:checked, input[type=radio]:checked { background: var(--le-ink); border-color: var(--le-ink); }
input[type=checkbox]:checked::after, input[type=radio]:checked::after { transform: scale(1); }
input:focus-visible, select:focus-visible, button:focus-visible { outline: 2px solid var(--le-ink); outline-offset: 2px; }

select.le-input {
  appearance: none; -webkit-appearance: none; cursor: pointer; padding-right: 38px;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237c8899' stroke-width='2.5' stroke-linecap='round'><path d='M6 9l6 6 6-6'/></svg>");
  background-repeat: no-repeat; background-position: right 13px center; background-size: 13px;
}

/* radio pills, for short option sets */
.le-choices { display: flex; flex-wrap: wrap; gap: 8px; }
.le-choice {
  display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
  border: 1px solid var(--le-field); border-radius: 999px; padding: 7px 14px;
  font-size: 13px; font-weight: 500; letter-spacing: normal; text-transform: none;
  color: var(--le-body); background: #fff; transition: border-color .15s ease, background .15s ease, color .15s ease;
}
.le-choice:hover { border-color: var(--le-ink); }
.le-choice.is-selected { border-color: var(--le-ink); background: var(--le-ink); color: #fff; }
.le-choice.is-selected input[type=radio] { background: #fff; border-color: #fff; }
.le-choice.is-selected input[type=radio]::after { box-shadow: inset 1em 1em var(--le-ink); transform: scale(1); }

/* upload widget */
.le-upload input[type=file] { display: none; }
.le-upload.is-dragover { border-color: var(--le-ink); background: #fff; }
.le-upload-inner { display: flex; align-items: center; gap: 12px; }
.le-upload-icon {
  width: 36px; height: 36px; flex: none; border-radius: 10px; background: #fff;
  border: 1px solid var(--le-line); display: grid; place-content: center; font-size: 15px; color: var(--le-body);
}
.le-upload-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.le-upload-title { font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--le-body); }
.le-upload-hint { font-size: 11px; font-weight: 400; letter-spacing: normal; text-transform: none; color: var(--le-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.le-upload-btn {
  margin-left: auto; flex: none; border: 1px solid var(--le-field); background: #fff;
  border-radius: 999px; padding: 7px 14px; font-size: 12px; font-weight: 600; color: var(--le-ink);
  transition: background .15s ease, color .15s ease, border-color .15s ease;
}
.le-upload:hover .le-upload-btn { background: var(--le-ink); color: #fff; border-color: var(--le-ink); }

/* ---- hover indicator ---- */
.le-hover {
  position: fixed; z-index: 2147482999; pointer-events: none; display: none;
  border: 2px solid var(--le-ink); border-radius: 5px;
  background: rgba(17, 24, 39, .06);
  transition: top .06s linear, left .06s linear, width .06s linear, height .06s linear;
}
.le-hover.is-visible { display: block; }
.le-hover-label {
  position: absolute; top: -23px; left: -2px;
  background: var(--le-ink); color: #fff; font-size: 11px; font-weight: 600;
  letter-spacing: .02em; padding: 3px 8px; border-radius: 5px; white-space: nowrap;
}
.le-hover.is-flipped .le-hover-label { top: auto; bottom: -23px; }

/* ---- floating pencil ---- */
.le-handle {
  position: fixed; z-index: 2147483001; display: none; width: 26px; height: 26px;
  align-items: center; justify-content: center; border-radius: 999px;
  border: 0; background: var(--le-accent); color: #fff;
  font-size: 12px; line-height: 1; cursor: pointer; box-shadow: 0 6px 16px -4px rgba(11,18,32,.6);
}
.le-handle.is-visible { display: flex; }
.le-handle-bg {
  width: auto; height: auto; padding: 7px 13px; border-radius: 999px;
  font-size: 12px; font-weight: 600; letter-spacing: .01em; background: #0b1220; color: #fff;
  box-shadow: 0 8px 20px -6px rgba(11,18,32,.7);
}

/* ---- toast ---- */
.le-toast {
  position: fixed; bottom: 86px; left: 50%; transform: translateX(-50%);
  z-index: 2147483002; border-radius: 999px; background: var(--le-ink); color: #fff;
  padding: 10px 20px; font-size: 13px; font-weight: 600;
  box-shadow: var(--le-shadow); transition: opacity .5s ease;
}

/* ---- modals ----------------------------------------------------------
   Choosing a picture, and publishing, are the two moments in this product
   worth taking over the whole screen: one needs room to compare options, the
   other needs somebody to read a list before it goes out to the public. */
.le-scrim {
  position: fixed; inset: 0; z-index: 2147483003;
  background: rgba(11, 12, 15, .45); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.le-modal {
  display: flex; flex-direction: column; width: 100%; max-width: 760px;
  max-height: min(640px, 86vh); background: #fff; color: var(--le-body);
  border-radius: 16px; box-shadow: var(--le-shadow); overflow: hidden;
}
.le-modal.is-narrow { max-width: 480px; }
.le-modal.is-medium { max-width: 500px; }
.le-modal-head { display: flex; align-items: flex-start; gap: 12px; padding: 22px 24px 0; }
.le-modal-heading { flex: 1; min-width: 0; }
.le-modal-title { font-size: 19px; font-weight: 700; color: var(--le-ink); letter-spacing: -.01em; }
.le-modal-sub { font-size: 13px; color: var(--le-muted); margin-top: 3px; }
.le-modal-tabs { display: flex; gap: 22px; padding: 16px 24px 0; border-bottom: 1px solid var(--le-line); }
.le-modal-tab {
  cursor: pointer; border: 0; background: none; padding: 0 0 10px;
  font-size: 13px; font-weight: 600; color: var(--le-muted);
  border-bottom: 2px solid transparent; margin-bottom: -1px;
}
.le-modal-tab.is-on { color: var(--le-ink); border-bottom-color: var(--le-ink); }
.le-modal-body { flex: 1; min-height: 0; overflow-y: auto; padding: 22px 24px; }
.le-modal-foot {
  display: flex; align-items: center; gap: 10px; justify-content: flex-end;
  padding: 16px 24px; border-top: 1px solid var(--le-line); background: #fff;
}
.le-modal-foot .le-modal-note { margin-right: auto; font-size: 12px; color: var(--le-muted); }

/* Who took the picture. Quiet, but present: on most of these the client is
   obliged to name the photographer wherever the picture appears, and a credit
   nobody can see is one nobody knows they have to honour. */
.le-credit {
  margin: 10px 0 0; font-size: 12px; color: var(--le-muted); line-height: 1.45;
}

/* One obvious action in the panel; the choosing happens in the dialog. */
.le-ways { margin: 14px 0 4px; }
.le-wide { width: 100%; justify-content: center; }
.le-row-tight { display: flex; gap: 8px; margin-top: 16px; }
.le-row-tight .le-search { flex: 1; min-width: 0; }
.le-row-tight .le-btn-outline { flex: none; }

/* ---- picking a photograph ---- */
.le-search {
  width: 100%; border: 1px solid var(--le-line-strong, #DADCE0); border-radius: 999px;
  padding: 10px 16px; font: inherit; font-size: 14px; color: var(--le-ink); background: #fff;
}
.le-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.le-chip {
  cursor: pointer; border: 1px solid var(--le-line); background: var(--le-soft);
  border-radius: 999px; padding: 5px 11px; font-size: 12px; color: var(--le-body);
}
.le-chip:hover { border-color: var(--le-accent); color: var(--le-accent); }
.le-chip.is-on { background: var(--le-accent); border-color: var(--le-accent); color: #fff; }
.le-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 18px; }
.le-grid.is-square { grid-template-columns: repeat(2, 1fr); }
.le-pick { cursor: pointer; border: 0; padding: 0; background: none; text-align: left; }
.le-pick-shot {
  width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block;
  border-radius: 10px; border: 1px solid var(--le-line); background: var(--le-soft);
}
.le-grid.is-square .le-pick-shot { aspect-ratio: 1 / 1; }
.le-pick:hover .le-pick-shot { border-color: var(--le-accent); box-shadow: 0 0 0 3px var(--le-accent-soft); }
.le-pick-by { display: block; font-size: 11px; color: var(--le-muted); margin-top: 6px; }
.le-shimmer {
  width: 100%; aspect-ratio: 4 / 3; border-radius: 10px;
  background: linear-gradient(100deg, #EEEFF1 30%, #F7F8F9 50%, #EEEFF1 70%);
  background-size: 200% 100%; animation: le-slide 1.2s linear infinite;
}
.le-grid.is-square .le-shimmer { aspect-ratio: 1 / 1; }
@keyframes le-slide { to { background-position: -200% 0; } }
@media (prefers-reduced-motion: reduce) { .le-shimmer { animation: none; } }

/* The prompt the page writes for itself. Somebody who cannot describe the
   picture they want can press one button and get a usable one. */
.le-suggest { background: var(--le-soft); border-radius: 12px; padding: 14px 16px; }
.le-suggest-text { font-size: 13px; color: var(--le-body); font-style: italic; }
.le-textarea {
  width: 100%; min-height: 84px; margin-top: 14px; resize: vertical;
  border: 1px solid var(--le-line-strong, #DADCE0); border-radius: 12px;
  padding: 11px 13px; font: inherit; font-size: 14px; color: var(--le-ink); background: #fff;
}
.le-tag {
  position: absolute; top: 8px; left: 8px; border-radius: 999px;
  background: rgba(11,12,15,.7); color: #fff; font-size: 10px; font-weight: 700;
  letter-spacing: .08em; padding: 3px 7px;
}
.le-pick { position: relative; }
.le-empty { padding: 28px 0; text-align: center; font-size: 13px; color: var(--le-muted); }

/* ---- seeing it as a visitor would ----------------------------------
   The editor's own furniture is the one thing a client cannot judge the page
   without removing: outlines on everything, a bar across the bottom, a panel
   down the side. This takes all of it away and leaves one way back. */
.le-back {
  position: fixed; bottom: 22px; left: 50%; transform: translateX(-50%);
  z-index: 2147483004; display: flex; align-items: center; gap: 6px;
  background: var(--le-ink); border-radius: 999px; padding: 6px;
  box-shadow: 0 20px 50px -10px rgba(11,12,15,.45);
}
.le-back-btn {
  cursor: pointer; border: 0; background: none; color: #fff;
  border-radius: 999px; padding: 8px 16px; font-size: 13px; font-weight: 500;
}
.le-back-btn:hover { background: #2A2C31; }
.le-back-btn.is-on { background: #fff; color: var(--le-ink); font-weight: 600; }

/* A phone is a different width, and a width is what a stylesheet listens to.
   Shrinking the page in place would keep the desktop layout and only make it
   narrow, which shows nobody anything true, so the phone view is the real
   page loaded at a real phone width. */
.le-phone {
  position: fixed; inset: 0; z-index: 2147483003; background: var(--le-canvas, #E9EAED);
  display: flex; align-items: center; justify-content: center; padding: 28px 0 90px;
}
.le-phone iframe {
  width: 390px; height: 100%; max-height: 844px; border: 0;
  border-radius: 14px; background: #fff;
  box-shadow: 0 30px 80px -30px rgba(11,12,15,.45);
}

/* ---- what is about to go live ---- */
.le-review { display: flex; flex-direction: column; gap: 2px; }
.le-review-row { padding: 11px 0; border-bottom: 1px solid var(--le-line-soft, #EEEFF1); }
.le-review-row:last-child { border-bottom: 0; }
.le-review-what { font-size: 12px; color: var(--le-muted); }
.le-review-to { font-size: 14px; font-weight: 500; color: var(--le-ink); margin-top: 2px; }
`,ko=`
/*
 * Room for the bar.
 *
 * It is fixed to the bottom of the viewport and floats over whatever is
 * there, which for most sites is the last line of the footer and, on a short
 * page, the very thing somebody came to edit. Scrolling does not help: the
 * page ends underneath it. So the document is given a strip of clearance for
 * as long as the editor is on screen, and gets it back the moment the editor
 * goes.
 *
 * scroll-padding as well as padding, so anchoring to something near the end
 * of the page does not land it behind the bar either.
 */
html:has(#live-edit-ui) {
  scroll-padding-bottom: 96px;
}
body:has(#live-edit-ui) {
  padding-bottom: 96px;
}
/* Sticky footers and cookie bars sit at the bottom too, and two things
   claiming the same corner is how a client ends up unable to reach either.
   The bar is ours and is the newer arrival, so it lifts itself rather than
   covering theirs. */
@media (max-width: 700px) {
  html:has(#live-edit-ui) { scroll-padding-bottom: 112px; }
  body:has(#live-edit-ui) { padding-bottom: 112px; }
}
body.editing [data-edit],
body.editing [data-edit-href]:not([data-edit]),
/* The picture itself is marked the same way the words are. */
body.editing img[data-edit-img],
body.editing [data-edit-bg] {
  outline: 1px dashed rgba(17, 24, 39, .35);
  outline-offset: 3px;
  border-radius: 3px;
  cursor: pointer;
}
/* A sentence whose original has changed since it was translated.
 *
 * Marked where it sits, because a count cannot be acted on: told that six
 * translations need updating, somebody still has to open every string on the
 * site to find which six. The page already knows where every key is.
 *
 * Amber and dashed rather than red and solid: this is not an error and the
 * translation is not wrong. It was true when it was written and the original
 * has moved since, which is a thing to look at rather than a thing to fix.
 * Only ever shown while editing that language - marking them in the original
 * would be scolding somebody for editing their own words. */
body.editing [data-live-edit-stale] {
  outline: 2px dashed rgba(180, 83, 9, .75);
  outline-offset: 3px;
  background: rgba(251, 191, 36, .10);
}

/* The marker means two different things, and one rule used to serve both.
 *
 * A host that writes its own templates lays a panel OVER a picture and marks
 * the panel \u2014 it says "Replace image" and is hidden until wanted. A scanned
 * page has no such panel, so the marker lands on the <img> itself. Hiding
 * both made every picture on a scanned page vanish until the pointer crossed
 * it, and the one person who must see a picture is the one deciding whether
 * to replace it. Revealing both left the panel covering the picture the whole
 * time. The tag says which is which. */
body.editing :not(img)[data-edit-img] {
  display: flex;
  opacity: 0;
  transition: opacity .15s ease;
}
body.editing :not(img)[data-edit-img]:hover,
body.editing :not(img)[data-edit-img]:focus-visible { opacity: 1; }
`,L=(o,a,r)=>{let s=document.createElement(o);return a&&(s.className=a),r!==void 0&&(s.textContent=r),s};function Kt(){let o=document.createElement("style");o.id="live-edit-page-css",o.textContent=ko,document.head.append(o);let a=document.createElement("div");a.id="live-edit-ui",document.body.append(a);let r=a.attachShadow({mode:"open"}),s=document.createElement("style");s.textContent=xo,r.append(s);let f=window.liveEditToolbar??{},l=L("div","le-toolbar"),y=window.liveEditEditor?.console??null,k=L(y?"a":"span","le-mark");k.innerHTML='<svg width="16" height="16" viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="3" width="20" height="20" rx="3" fill="none" stroke="#0B0C0F" stroke-width="2.5"/><path d="M16 15 L16 30 L19.6 26.4 L22.2 31.2 L24.6 30 L22 25.3 L27 25.3 Z" fill="#3148F5" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>',y&&(k.href=y,k.target="_blank",k.rel="noopener",k.title="Your dashboard: licence, editors, settings",k.setAttribute("aria-label","Open your dashboard"));let A=L("span","le-status le-when-roomy"),O=L("span","le-dot"),R=L("span",null,"");A.append(O,R),l.append(k,A);let $=window.liveEditEditor??null;if($?.greeting){let P=L("span","le-hello le-when-roomy","Welcome "+$.greeting);l.append(P)}let N=null,K=f.locales??{};Object.keys(K).length>1&&(N=L("select","le-locale"),N.title="Language you are editing",Object.entries(K).forEach(([P,D])=>{let V=L("option",null,D);V.value=P,V.selected=P===(f.locale??"en"),N.append(V)}),N.addEventListener("change",()=>{window.location.search="?locale="+N.value}),l.append(N));let H=L("button","le-bar-btn","Edit site");H.type="button";let F=P=>'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"'+(P?' style="transform: scaleX(-1)"':"")+'><path d="M9 14 4 9l5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 9h7a6 6 0 0 1 0 12H8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',E=L("button","le-round");E.type="button",E.title="Undo the last change you have not published",E.setAttribute("aria-label","Undo"),E.innerHTML=F(!1);let M=L("button","le-round");M.type="button",M.title="Put back what you just undid",M.setAttribute("aria-label","Redo"),M.innerHTML=F(!0);let ae=L("div","le-pages");ae.hidden=!0,ae.setAttribute("role","group"),ae.setAttribute("aria-label","Pages");let ie=L("select","le-lang");ie.hidden=!0,ie.title="Which language you are editing",ie.setAttribute("aria-label","Language");let Y=L("button","le-bar-btn le-when-roomy","Changes");Y.type="button",Y.title="Everything you have changed and not published";let Q=L("button","le-bar-btn le-when-roomy","Preview");Q.type="button",Q.title="See the page the way a visitor will",Q.hidden=!0;let v=L("button","le-publish");v.type="button",v.title="Put your changes live",v.hidden=!0;let fe=L("span",null,"Publish"),X=L("span","le-publish-count");if(X.hidden=!0,v.append(fe,X),l.append(L("span","le-sep"),H,E,M,L("span","le-sep"),ae,ie,Y,Q,v),(f.links??[]).forEach(P=>{let D=L("a","le-btn-ghost",P.label);D.href=P.href,P.title&&(D.title=P.title),l.append(D)}),f.logout?.href)if((f.logout.method??"get").toLowerCase()==="post"){let P=document.createElement("form");P.method="POST",P.action=f.logout.href;let D=document.createElement("input");D.type="hidden",D.name="_token",D.value=document.body.dataset.csrf??"";let V=L("button","le-btn-ghost","Log out");V.type="submit",P.append(D,V),l.append(P)}else{let P=L("a","le-btn-ghost","Log out");P.href=f.logout.href,l.append(P)}let re=L("div","le-drawer");re.setAttribute("role","dialog"),re.setAttribute("aria-modal","true"),re.setAttribute("aria-label","Edit content");let be=L("div","le-drawer-head"),Te=L("div","le-tabs");Te.setAttribute("role","tablist");let Ne={};["Edit","Changes","History"].forEach(P=>{let D=L("button","le-tab",P);D.type="button",D.dataset.tab=P,D.setAttribute("role","tab"),P==="Edit"&&D.classList.add("is-on"),Ne[P]=D,Te.append(D)});let me=L("button","le-close","\xD7");me.type="button",me.setAttribute("aria-label","Close"),be.append(Te,me);let $e=L("div","le-subject"),qe=L("div","le-trail"),Me=L("div","le-title","Text");$e.append(L("div","le-eyebrow","Selected"),qe,Me);let we=L("div","le-fields"),Oe=L("div","le-foot"),ye=L("button","le-btn-danger le-start le-hidden","Delete");ye.type="button";let ve=L("button","le-btn-outline","Cancel");ve.type="button";let xe=L("button","le-btn","Save changes");xe.type="button",Oe.append(ye,ve,xe),re.append(be,$e,we,Oe);let Z=L("button","le-handle");Z.type="button",Z.setAttribute("aria-label","Edit this link"),Z.innerHTML="&#9998;";let ne=L("button","le-handle le-handle-bg");ne.type="button",ne.setAttribute("aria-label","Replace this background image"),ne.title="Replace background image",ne.textContent="Replace background";let ce=L("div","le-hover"),Ie=L("span","le-hover-label");return ce.append(Ie),r.append(l,re,Z,ne,ce),{root:a,shadow:r,toolbar:l,toggleButton:H,undoButton:E,redoButton:M,pageSwitcher:ae,languagePicker:ie,statusText:R,dot:O,localeSelect:N,drawer:re,drawerFoot:Oe,drawerTabs:Ne,drawerSubject:$e,drawerTitle:Me,drawerTrail:qe,drawerFields:we,drawerDelete:ye,publishButton:v,publishLabel:fe,publishCount:X,previewButton:Q,changesButton:Y,closeButton:me,cancelButton:ve,saveButton:xe,linkHandle:Z,bgHandle:ne,hoverBox:ce,hoverLabel:Ie,toast:(P,D=1800)=>{let V=L("div","le-toast",P);r.append(V),setTimeout(()=>V.style.opacity="0",D),setTimeout(()=>V.remove(),D+600)},modal:({title:P,subtitle:D,size:V="",dismissable:at=!0}={})=>{let U=L("div","le-scrim"),_=L("div",`le-modal ${V}`.trim());_.setAttribute("role","dialog"),_.setAttribute("aria-modal","true");let Ue=L("div","le-modal-heading"),_e=L("div","le-modal-title",P??""),ke=L("div","le-modal-sub",D??"");ke.hidden=!D,Ue.append(_e,ke),_.setAttribute("aria-label",P??"Dialog");let se=L("button","le-close","\xD7");se.type="button",se.setAttribute("aria-label","Close");let He=L("div","le-modal-head");He.append(Ue,se);let Pe=L("div","le-modal-tabs");Pe.hidden=!0;let We=L("div","le-modal-body"),Be=L("div","le-modal-foot");Be.hidden=!0,_.append(He,Pe,We,Be),U.append(_);let je=document.activeElement,Ve=!1,Ee=()=>{Ve||(Ve=!0,document.removeEventListener("keydown",Se,!0),U.remove(),je?.focus?.(),le.dismissable=!0)},Se=G=>{G.key==="Escape"&&le.dismissable&&(G.stopPropagation(),Ee())},le={dismissable:at};return se.addEventListener("click",Ee),U.addEventListener("mousedown",G=>{G.target===U&&le.dismissable&&Ee()}),document.addEventListener("keydown",Se,!0),r.append(U),se.focus(),{card:_,body:We,foot:Be,tabs:Pe,close:Ee,title:G=>_e.textContent=G,subtitle:G=>{ke.textContent=G??"",ke.hidden=!G},allowDismiss:G=>{le.dismissable=G,se.hidden=!G}}}}}var vt="kb_verify",Xt=(o,a=globalThis)=>{try{a.sessionStorage?.setItem(vt,JSON.stringify(o))}catch{}},Qt=(o=globalThis)=>{try{let a=o.sessionStorage?.getItem(vt);return o.sessionStorage?.removeItem(vt),a?JSON.parse(a):null}catch{return null}},Eo=(o,a)=>!a?.attr||!a?.marker?null:o.querySelector(`[${a.attr}="${a.marker.replace(/"/g,'\\"')}"]`),So=(o,a)=>{if(!o)return null;if(a==="image"){let s=Co(o);return s?s.getAttribute("src"):null}if(a==="href")return o.getAttribute("href");if(a==="icon")return o.getAttribute("class")??"";let r=[...o.childNodes].filter(s=>s.nodeType===3).map(s=>s.textContent).join(" ").trim();return oe(r===""?o.textContent:r)},Co=o=>o.tagName?.toLowerCase()==="img"?o:o.querySelector("img")??o.parentElement?.querySelector("img")??null,oe=o=>String(o??"").replace(/\s+/g," ").trim(),Lo=(o,a,r)=>{if(r===null)return!1;if(o==="image")return yt(r)!==""&&yt(r)===yt(a);if(o==="icon"){let s=oe(a).split(" ").filter(Boolean),f=oe(r).split(" ").filter(Boolean);return s.length>0&&s.every(l=>f.includes(l))}return o==="href"?oe(r)===oe(a)||oe(r).endsWith(oe(a)):oe(r)===oe(a)},yt=o=>String(o??"").split(/[?#]/)[0].split("/").filter(Boolean).pop()??"",Zt=(o,a)=>{if(!a?.kind)return null;let r=Eo(o,a);if(!r)return null;let s=So(r,a.kind);return{ok:Lo(a.kind,a.value,s),wanted:a.value,saw:s,kind:a.kind}};kt();var Jo=()=>{let o=window.liveEditApi;o?.base&&o?.site&&Promise.resolve().then(()=>(Lt(),Ct)).then(r=>r.ensureBackgroundsAreFound({base:o.base,site:o.site,key:o.token})).catch(r=>console.warn("[live-edit] could not look for backgrounds:",r.message)),window.liveEditContent||Promise.resolve().then(()=>(tt(),et)).then(r=>r.defendContent(document)).catch(r=>console.warn("[live-edit] could not guard this page's content:",r.message));let a=document.querySelector("[data-login-modal]");if(a){let r=()=>{a.classList.remove("hidden"),a.classList.add("flex"),a.querySelector("input[type=email]")?.focus()},s=()=>{a.classList.add("hidden"),a.classList.remove("flex")};document.querySelectorAll("[data-login-open]").forEach(f=>{f.addEventListener("click",l=>{l.preventDefault(),r()})}),a.querySelector("[data-login-close]")?.addEventListener("click",s),a.addEventListener("click",f=>{f.target===a&&s()}),a.dataset.error==="1"&&r()}if(document.body.hasAttribute("data-admin")){let r=document.body.dataset.csrf,s=()=>{sessionStorage.setItem("tb_scroll",String(window.scrollY)),window.location.reload()},f=sessionStorage.getItem("tb_scroll");f!==null&&(sessionStorage.removeItem("tb_scroll"),window.scrollTo(0,Number(f)));let l=Kt(),y=e=>l.toast(String(e??"").trim()||"Something went wrong.",9e3),k=sessionStorage.getItem("tb_toast");k&&(sessionStorage.removeItem("tb_toast"),l.toast(k));let A=()=>new Promise(e=>{if(!window.liveEditContent||window.liveEditContentDone){e(window.liveEditContentDone??null);return}let t=n=>e(n?.detail??null);document.addEventListener("live-edit:content",t,{once:!0}),setTimeout(()=>e(null),5e3)});A().then(e=>{let t=Qt();if(e?.failed){l.toast(t?"Saved \u2014 but this page could not load the latest content, so it may be showing an older version. Reload to try again.":"This page could not load your saved content, so it is showing the original. Nothing has been lost \u2014 reload to try again.",9e3);return}let n=t?Zt(document,t):null;n&&!n.ok&&(console.warn("[live-edit] the change was saved but the page still shows:",n.saw,`
  expected:`,n.wanted),l.toast("Saved \u2014 but this page is still showing the old version. Your change is stored; reload, and tell us if it stays this way.",9e3))});let O=e=>{sessionStorage.setItem("tb_toast",e),s()},R=(e,t=null,n=null)=>{let i=window.__liveEditReact;if(!i){O(e);return}let d=t!==null&&(i.apply??i.set)(t,n);l.toast(e),d||i.refresh()},{drawer:$,drawerTabs:N,drawerSubject:K,drawerTitle:H,drawerTrail:F,drawerFields:E,drawerDelete:M,toggleButton:ae,statusText:ie,linkHandle:Y,bgHandle:Q}=l,v=null,fe=(e,t,n,i,d=!1)=>{let u=document.createElement("label");u.className="le-field",u.append(t);let p=e==="icon"?window.liveEditIcons:(window.liveEditSelects??{})[e],c=document.querySelector("[data-icon-templates]");if(e==="icon"&&Array.isArray(p)&&c){let h=document.createElement("input");h.type="hidden",h.name=e,h.value=n??"";let m=document.createElement("div");return m.className="le-icons",p.forEach(w=>{let b=document.createElement("button");b.type="button",b.title=w,b.dataset.iconChoice=w,b.className="le-icon"+(w===h.value?" is-active":"");let x=c.querySelector(`template[data-icon="${w}"]`);x?b.append(x.content.cloneNode(!0)):b.textContent=w,b.addEventListener("click",()=>{h.value=w,m.querySelectorAll("[data-icon-choice]").forEach(S=>{let C=S.dataset.iconChoice===w;S.className="le-icon"+(C?" is-active":"")}),h.dispatchEvent(new Event("input",{bubbles:!0}))}),m.append(b)}),u.append(h,m),u}if(Array.isArray(p)&&p.length<=6){let h=document.createElement("input");h.type="hidden",h.name=e,h.value=n??p[0];let m=document.createElement("div");return m.className="le-choices",p.forEach(w=>{let b=document.createElement("label");b.className="le-choice"+(w===h.value?" is-selected":"");let x=document.createElement("input");x.type="radio",x.name="le-choice-"+e,x.checked=w===h.value,x.addEventListener("change",()=>{h.value=w,m.querySelectorAll(".le-choice").forEach(S=>S.classList.remove("is-selected")),b.classList.add("is-selected"),h.dispatchEvent(new Event("input",{bubbles:!0}))}),b.append(x,document.createTextNode(w)),m.append(b)}),u.append(h,m),u}let g;if(Array.isArray(p)?(g=document.createElement("select"),p.forEach(h=>{let m=document.createElement("option");m.value=h,m.textContent=h,m.selected=h===n,g.append(m)})):(g=document.createElement("textarea"),g.rows=i,g.value=n??""),g.name=e,g.className="le-input",g.tagName==="TEXTAREA"){g.classList.add("le-prose");let h=()=>{g.style.height="auto",g.style.height=Math.min(g.scrollHeight+2,420)+"px"};g.addEventListener("input",h),requestAnimationFrame(h)}if(d&&g.tagName==="TEXTAREA"){let h=document.createElement("div");h.className="le-tools";let m=(x,S)=>{let C=g.selectionStart,T=g.selectionEnd,q=g.value.slice(C,T)||"text";g.setRangeText(x+q+S,C,T,"select"),g.dispatchEvent(new Event("input",{bubbles:!0})),g.focus()},w=(x,S,C,T="")=>{let q=document.createElement("button");return q.type="button",q.title=S,q.textContent=x,q.className="le-tool "+T,q.addEventListener("click",C),q};h.append(w("B","Bold",()=>m("**","**"),"is-bold"),w("I","Italic",()=>m("*","*"),"is-italic"),w("Link","Insert link",()=>{let x=window.prompt("Link URL (https://\u2026 or /page):");if(!x)return;let S=g.selectionStart,C=g.selectionEnd,T=g.value.slice(S,C)||"link text";g.setRangeText("["+T+"]("+x+")",S,C,"select"),g.dispatchEvent(new Event("input",{bubbles:!0})),g.focus()}));let b=document.createElement("span");b.className="le-hint",b.textContent="**bold** \xB7 *italic* \xB7 [text](url)",h.append(b),u.append(h)}return u.append(g),u},X=e=>{let t=e.tagName;if(e.dataset.editRegion)return e.dataset.editRegion;if(t==="IMG")return"Image";if(t==="BUTTON")return"Button";if(t==="A")return/\b(btn|button)\b/i.test(String(e.className))?"Button":"Link";if(/^H[1-6]$/.test(t))return"Heading";if(t==="P")return"Paragraph";if(t==="LI")return"List item";if(t==="UL"||t==="OL")return"List";if(t==="NAV")return"Menu";if(t==="HEADER")return"Header";if(t==="FOOTER")return"Footer";if(t==="FORM")return"Form";if(e.hasAttribute("data-edit-item"))return"Card";if(e.hasAttribute("data-edit-icon"))return"Icon";if(e.hasAttribute("data-edit-svg"))return"Drawing";if(e.hasAttribute("data-edit"))return"Text";if(e.hasAttribute("data-has-bg")||e.hasAttribute("data-edit-bg"))return"Background";if(t==="SECTION"||t==="MAIN"||t==="ARTICLE")return"Section";let n=e.getBoundingClientRect();return n.width>window.innerWidth*.6&&n.height>180?"Section":"Group"},re=(e,t)=>{let n=e.tagName,i;return n==="IMG"?i=["radius","hidden"]:n==="A"||n==="BUTTON"?i=["background","textColor","fontSize","radius","hidden"]:/^(H[1-6]|P|SPAN|LI|BLOCKQUOTE|FIGCAPTION|DT|DD|TD|TH|CAPTION|CITE|Q|LABEL|STRONG|EM)$/.test(n)?i=["textColor","fontSize","hidden"]:i=["background","backgroundImage","paddingY","paddingX","radius","hidden"],t.filter(d=>i.includes(d.trim()))},be=({hint:e="PNG, JPG or WEBP, or drag one here",onFile:t}={})=>{let n=document.createElement("label");n.className="le-upload";let i=document.createElement("div");i.className="le-upload-inner";let d=document.createElement("span");d.className="le-upload-icon",d.textContent="\u2191";let u=document.createElement("span");u.className="le-upload-text";let p=document.createElement("span");p.className="le-upload-title",p.textContent="Upload from your computer";let c=document.createElement("span");c.className="le-upload-hint",c.textContent=e,u.append(p,c);let g=document.createElement("span");g.className="le-upload-btn",g.textContent="Choose file",i.append(d,u,g);let h=document.createElement("input");h.type="file",h.accept="image/*";let m=w=>{w&&(c.textContent=w.name,t?.(w))};return h.addEventListener("change",()=>m(h.files[0])),["dragenter","dragover"].forEach(w=>n.addEventListener(w,b=>{b.preventDefault(),n.classList.add("is-dragover")})),["dragleave","drop"].forEach(w=>n.addEventListener(w,b=>{b.preventDefault(),n.classList.remove("is-dragover")})),n.addEventListener("drop",w=>{let b=w.dataTransfer?.files?.[0];if(!b)return;let x=new DataTransfer;x.items.add(b),h.files=x.files,m(b)}),n.append(i,h),n},Te=e=>{let t=String(e).match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);return!t||t[4]!==void 0&&Number(t[4])===0?"":"#"+[1,2,3].map(n=>Number(t[n]).toString(16).padStart(2,"0")).join("")},Ne=e=>{if(!e)return"";let t=e.dataset.background||e.dataset.bg||e.dataset.backgroundImage;if(t)return t;let i=(getComputedStyle(e).backgroundImage||"").match(/url\((['"]?)(.*?)\1\)/);return i&&!i[2].startsWith("data:")?i[2]:""},me={background:"Background colour",backgroundImage:"Background image",textColor:"Text colour",fontSize:"Text size",paddingY:"Space above and below",paddingX:"Space left and right",radius:"Corner rounding"},$e=(e,t,n,i)=>{let d=document.createElement("label");d.className="le-field";let u=e.replace(/([A-Z])/g," $1").toLowerCase(),p=me[e]??u.charAt(0).toUpperCase()+u.slice(1);if(d.append(p),t==="toggle"){let c=document.createElement("div");c.className="le-row";let g=document.createElement("input");g.type="checkbox",g.checked=n==="1",g.dataset.styleProp=e;let h=document.createElement("span");h.className="le-hint",h.textContent="Hidden from visitors. You still see it, dimmed, while editing.",c.append(g,h);let m=i?X(i).toLowerCase():"section";return d.replaceChildren(`Hide this ${m}`,c),d.className="le-field le-divided",d}if(t==="color"){let c=document.createElement("div");c.className="le-row";let g=document.createElement("input");g.type="color";let h=i?Te(getComputedStyle(i)[e==="textColor"?"color":"backgroundColor"]):"";g.value=n||h||"#ffffff",g.dataset.styleProp=e,g.className="le-color";let m=document.createElement("label");m.className="le-default";let w=document.createElement("input");w.type="checkbox",w.checked=!n,g.addEventListener("input",()=>w.checked=!1),m.append(w,"Use default"),c.append(g,m),d.append(c)}else if(t==="url"){let c=document.createElement("input");c.type="text",c.value=n??"",c.placeholder="Paste an image URL, or upload below",c.dataset.styleProp=e,c.className="le-input";let g=document.createElement("img");g.className="le-thumb",g.alt="";let h=T=>{g.src=T||"",g.style.display=T?"":"none"},m=n?"":Ne(i),w=document.createElement("span");w.className="le-hint";let b=(T,q)=>{w.textContent=T?q?"Current image (from the theme) \u2014 upload or paste a link to replace it":"Replacing with this image":"No image set",w.title=T||""};h(n||m),b(n||m,!n&&!!m),c.addEventListener("input",()=>{let T=c.value.trim();h(T||m),b(T||m,!T&&!!m)});let x=be({onFile:async T=>{h(URL.createObjectURL(T));let q=new FormData;q.append("file",T);try{let z=await(await B("/live-edit/upload",{method:"POST",body:q})).json();c.value=z.url,h(z.url),b(z.url,!1),c.dispatchEvent(new Event("input",{bubbles:!0}))}catch(I){y(U(I,"save that"))}}}),S=j("div","le-ways"),C=j("button","le-btn le-wide","Replace background");C.type="button",C.addEventListener("click",()=>Ft(i,async T=>{let{url:q,file:I,credit:z}=T,W=q;if(I){h(URL.createObjectURL(I));let ee=new FormData;ee.append("file",I);try{W=(await(await B("/live-edit/upload",{method:"POST",body:ee})).json()).url}catch(te){l.toast(U(te,"save that"));return}}W&&(c.value=W,h(W),b(W,!1),c.dispatchEvent(new Event("input",{bubbles:!0})),c.dataset.kbCreditFor=W,c.dataset.kbCredit=JSON.stringify({credit:z??"",creditBy:T.creditBy??"",creditUrl:T.creditUrl??"",creditSource:T.creditSource??"",creditSourceUrl:T.creditSourceUrl??""}),z&&l.toast(z,4e3))},"Free photos","background")),S.append(C),c.hidden=!0,x.hidden=!0,d.append(S,c,x,g,w)}else{let c=document.createElement("input");c.type="number",c.min=0,c.max=400,c.value=n??"",c.placeholder="default",c.dataset.styleProp=e,c.className="le-input",d.append(c)}return d},qe={background:"color",backgroundImage:"url",textColor:"color",fontSize:"px",paddingX:"px",paddingY:"px",radius:"px",hidden:"toggle"},Me=(e,t,n)=>{v.styleKey=e;let i=(window.liveEditStyles??{})[e]??{},d=document.createElement("div");d.className="le-section-heading",d.textContent="Style",E.append(d);let u=0;if((n?re(n,t):t).forEach(p=>{let c=(window.liveEditStyleProps??{})[p]??qe[p];c&&(E.append($e(p,c,i[p],n)),u++)}),u===0){let p=document.createElement("div");p.className="le-hint",p.textContent="Nothing on this element can be restyled.",E.append(p)}},we=document.createElement("style");document.head.append(we);let Oe=(e,t)=>{let n=`[data-style="${e}"]`,i="",d="";for(let[u,p]of Object.entries(t))p&&(i+={hidden:"opacity:.45 !important;",backgroundImage:`background-image:url('${p}') !important;background-size:cover !important;background-position:center !important;`,background:`background:${p} !important;`,textColor:`color:${p} !important;`,fontSize:`font-size:${p}px !important;`,radius:`border-radius:${p}px !important;`,paddingX:`padding-left:${p}px !important;padding-right:${p}px !important;`,paddingY:`padding-top:${p}px !important;padding-bottom:${p}px !important;`}[u]??"",u==="paddingY"&&(d+=`section${n}>div{padding-top:0 !important;padding-bottom:0 !important}`));return i?d+`${n}{${i}}`:d},ye=()=>{if(!v?.styleKey)return;let e=xe(),t=v.styleKey,n=Oe(t,e),i={background:"background",textColor:"color",fontSize:"font-size",radius:"border-radius",backgroundImage:"background-image"};for(let[d,u]of Object.entries(e))u||(d==="hidden"&&(n+=`body.editing [data-style="${t}"]{opacity:1 !important}`),i[d]&&(n+=`[data-style="${t}"]{${i[d]}:revert-layer !important}`),d==="paddingY"&&(n+=`[data-style="${t}"]{padding-top:revert-layer !important;padding-bottom:revert-layer !important}section[data-style="${t}"]>div{padding-top:revert-layer !important;padding-bottom:revert-layer !important}`),d==="paddingX"&&(n+=`[data-style="${t}"]{padding-left:revert-layer !important;padding-right:revert-layer !important}`));we.textContent=n},ve=()=>{we.textContent=""};E.addEventListener("input",()=>{v&&(v.dirty=!0),ye()}),E.addEventListener("change",()=>{v&&(v.dirty=!0),ye()});let xe=()=>{let e={};return E.querySelectorAll("[data-style-prop]").forEach(t=>{if(t.type==="checkbox")e[t.dataset.styleProp]=t.checked?"1":"";else if(t.type==="color"){let n=t.closest("div").querySelector("input[type=checkbox]").checked;e[t.dataset.styleProp]=n?"":t.value}else e[t.dataset.styleProp]=t.value;if(t.dataset.kbCredit&&t.dataset.kbCreditFor===t.value)try{Object.assign(e,JSON.parse(t.dataset.kbCredit))}catch{}}),e},Z=null,ne=()=>{!Z||!v||v.dirty||!$.classList.contains("is-open")||D!=="Edit"||Z.isConnected&&Ie(Z)},ce=e=>e.dataset.editRegion?e.dataset.editRegion:e.dataset.editLabel?e.dataset.editLabel:e.querySelector(":scope > [data-style-edit]")?.dataset.editLabel??X(e),Ie=e=>{if(Z=e,e.dataset.editImg!==void 0)ct(e);else if(e.dataset.edit!==void 0)Je(e);else if(e.dataset.svgEdit!==void 0||e.dataset.editSvg!==void 0)qt(e);else if(e.dataset.editHref!==void 0)st(e);else if(e.dataset.style!==void 0){let t=e.querySelector(":scope > [data-style-edit]");dt(t??e)}},nt=e=>{v?.dirty&&!window.confirm("Discard unsaved changes?")||(ve(),Ie(e))},ot=null,P=e=>{let t=ot;ot=e??null;let n=[],i=e?.parentElement;for(;i&&i!==document.body;)i.dataset&&(i.dataset.edit!==void 0||i.dataset.style!==void 0)&&n.unshift(i),i=i.parentElement;let d=[];n.forEach(p=>{let c=ce(p);if(d.length&&d[d.length-1].label===c){d[d.length-1].node=p;return}d.push({node:p,label:c})});let u=d.slice(-3);t&&t!==e&&document.contains(t)&&!u.some(p=>p.node===t)&&u.unshift({node:t,label:`\u2190 ${ce(t)}`}),F.replaceChildren(),F.classList.toggle("is-visible",u.length>0),u.forEach((p,c)=>{let g=p.node;c>0&&F.append("\u203A");let h=document.createElement("button");h.type="button",h.textContent=p.label,h.className="le-crumb",h.addEventListener("click",()=>nt(g)),F.append(h)})},D="Edit",V=e=>{D=e,Object.entries(N).forEach(([t,n])=>{n.classList.toggle("is-on",t===e),n.setAttribute("aria-selected",t===e?"true":"false")}),K.classList.toggle("le-hidden",e!=="Edit"),l.drawerFoot.classList.toggle("le-hidden",e!=="Edit"),e==="Changes"&&Ee(),e==="History"&&Rn()};Object.entries(N).forEach(([e,t])=>{t.addEventListener("click",()=>{e!=="Edit"&&v?.dirty&&!window.confirm("Discard unsaved changes?")||(V(e),$.classList.contains("is-open")||it())})});let at=e=>{if(!e)return null;let t=u=>Math.min(Math.max(Math.round(u),1),4e3),n=Number(e.naturalWidth??0),i=Number(e.naturalHeight??0);if(n>=1&&i>=1)return{width:t(n),height:t(i),exact:!0};let d=e.getBoundingClientRect?.();return d&&d.width>=1&&d.height>=1?{width:t(d.width),height:t(d.height),exact:!1}:null},U=(e,t)=>{console.warn(`[live-edit] ${t}:`,e);let n=String(e?.message??"");return/failed to fetch|networkerror|load failed/i.test(n)?"No connection just now. Nothing has been lost; try again in a moment.":/\b401\b|\b403\b|unauthor|forbidden/i.test(n)?"Your editing session has expired. Reload the page to carry on.":/\b429\b|too many/i.test(n)?"That was a lot at once. Give it a few seconds and try again.":`Could not ${t}. Nothing has been lost; try again in a moment.`},_=null,Ue=async()=>{if(window.liveEditApi)try{_=await(await B("/live-edit/credits",{method:"GET"})).json(),ne()}catch(e){console.warn("[live-edit] could not read the credit balance:",e),_=null}},_e=async()=>{if(!(window.liveEditStyleProps&&window.liveEditStyles)&&window.liveEditApi)try{let t=await(await B("/live-edit/content",{method:"GET"})).json();t?.styleProps&&(window.liveEditStyleProps=t.styleProps),t?.styles&&(window.liveEditStyles=t.styles),ne()}catch(e){console.warn("[live-edit] could not read what this site allows to be styled:",e)}},ke=(e,t)=>{if(!_?.available||!t)return;let n=document.createElement("div");n.className="le-assist-head",n.append(He("AI assist"),se()),E.append(n),[["rewrite","Rewrite"],["shorten","Shorten"]].forEach(([i,d])=>{let u=_.costs?.[i]??1,p=document.createElement("button");p.type="button",p.className="le-assist";let c=document.createElement("span");c.textContent=d;let g=document.createElement("span");g.className="le-assist-cost",g.textContent=`${u} credit${u===1?"":"s"}`,p.append(c,g),(_.balance??0)<u&&(p.disabled=!0,g.classList.add("is-short"),p.title="Not enough credits"),p.addEventListener("click",()=>void Be(i,d,e,t,p,c)),E.append(p)})},se=()=>{let e=document.createElement("span");return e.className="le-assist-balance",e.textContent=`${_?.balance??0} credits left`,e},He=e=>{let t=document.createElement("div");return t.className="le-section-heading",t.textContent=e,t},Pe=()=>(document.querySelector('meta[property="og:site_name"]')?.content??document.querySelector('meta[name="application-name"]')?.content??(document.title??"").split(/\s+[|\u2013\u2014-]\s+/).pop()??"").replace(/\s+/g," ").trim().slice(0,120),We=()=>(document.querySelector('meta[name="description"]')?.content??document.querySelector('meta[property="og:description"]')?.content??"").replace(/\s+/g," ").trim().slice(0,400),Be=async(e,t,n,i,d,u)=>{d.disabled=!0,u.textContent="Thinking\u2026";let p;try{p=await(await B("/live-edit/assist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:e,text:i.value,heading:je(n),role:X(n),page:window.location.pathname,site:Pe(),about:We()})})).json()}catch(c){d.disabled=!1,u.textContent=t,l.toast(U(c,"rewrite that"));return}if(typeof p?.balance=="number"&&_&&(_.balance=p.balance),!p?.text){d.disabled=!1,u.textContent=t,l.toast(Ve(p?.reason));return}i.value=p.text,i.dispatchEvent(new Event("input",{bubbles:!0})),i.focus(),d.disabled=!1,u.textContent=t,l.toast(`Rewritten. ${p.balance} credits left.`)},je=e=>(((e.closest("section, article, header, div[data-style]")??document.body).querySelector("h1, h2, h3")??document.querySelector("h1"))?.textContent??"").replace(/\s+/g," ").trim().slice(0,200),Ve=e=>({not_enough_credits:"Not enough credits for that. You can buy more from your account.",no_suggestion:"No suggestion for this one. Your words are unchanged.",not_configured:"Rewriting is not switched on for this site yet.",nothing_to_work_with:"There are no words here to rewrite yet."})[e]??"Could not rewrite that just now. Your words are unchanged.",Ee=async()=>{E.replaceChildren(J("Loading\u2026"));let e;try{e=await(await B("/live-edit/changes",{method:"GET"})).json()}catch(n){E.replaceChildren(J(U(n,"show your changes")));return}let t=e?.changes??[];if(t.length===0){E.replaceChildren(J("No unpublished changes."));return}E.replaceChildren(),t.forEach(n=>{let i=document.createElement("div");i.className="le-change";let d=document.createElement("div");d.className="le-row le-change-head";let u=document.createElement("span");u.className="le-change-label",u.textContent=le(n);let p=document.createElement("button");if(p.type="button",p.className="le-chip-btn",p.textContent="Revert",p.addEventListener("click",()=>void G(n,p)),d.append(u,p),i.append(d),n.before){let g=document.createElement("p");g.className="le-change-before",g.textContent=Se(n.before),i.append(g)}let c=document.createElement("p");c.className="le-change-after",c.textContent=Se(n.after)||"(empty)",i.append(c),E.append(i)})},Se=e=>{let t=String(e??"").replace(/\s+/g," ").trim();return t.length>70?`${t.slice(0,70)}\u2026`:t},le=e=>{let t=document.querySelector(`[data-edit="setting:${CSS.escape(e.key)}"], [data-edit-img="setting:${CSS.escape(e.key)}"], [data-style="${CSS.escape(e.key)}"]`);return t?X(t):e.kind==="style"?"Styling":"Text"},G=async(e,t)=>{t.disabled=!0,t.textContent="Reverting\u2026";try{await B("/live-edit/changes",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:e.key,kind:e.kind})})}catch(n){t.disabled=!1,t.textContent="Revert",l.toast(U(n,"put that back"));return}O("Reverted \u2713")},It=()=>{let e=window.liveEditApi?.engine;if(!e)return null;let t=j("p","le-hint");return t.textContent=`Live Edit ${e}`,t.title="Quote this if you report a problem",t},Rn=async()=>{E.replaceChildren(J("Loading\u2026"));let e;try{e=await(await B("/live-edit/versions",{method:"GET"})).json()}catch(i){E.replaceChildren(J(U(i,"show what has been published")));return}let t=e?.versions??[];if(t.length===0){E.replaceChildren(J("Nothing published yet. Your first publish will appear here."));let i=It();i&&E.append(i);return}E.replaceChildren(),t.forEach((i,d)=>{let u=document.createElement("div");u.className="le-version";let p=document.createElement("span");p.className=d===0?"le-version-dot is-latest":"le-version-dot";let c=document.createElement("div"),g=document.createElement("p");g.className="le-change-after",g.textContent=i.restored_from?`Restored version ${i.restored_from}`:`Published ${i.changes??0} change${i.changes===1?"":"s"}`;let h=document.createElement("p");h.className="le-change-when",h.textContent=Fn(i.published_at),c.append(g,h),u.append(p,c),E.append(u)});let n=It();n&&E.append(n)},J=e=>{let t=document.createElement("p");return t.className="le-hint",t.textContent=e,t},Fn=e=>{if(!e)return"";let t=Math.round((Date.now()-new Date(e).getTime())/1e3);return t<90?"Just now":t<3600?`${Math.round(t/60)} minutes ago`:t<86400?`${Math.round(t/3600)} hours ago`:t<86400*8?`${Math.round(t/86400)} days ago`:new Date(e).toLocaleDateString()},it=()=>{ze(),gt(),$.classList.add("is-open"),l.toolbar.classList.add("is-compact"),D==="Edit"&&E.querySelector("textarea, input:not([type=checkbox]), select")?.focus()},Ce=(e=!1)=>{!e&&v?.dirty&&!window.confirm("Discard unsaved changes?")||(v?.restore?.(),ve(),$.classList.remove("is-open"),l.toolbar.classList.remove("is-compact"),v=null)},Dn=()=>document.querySelectorAll("[data-edit], [data-edit-img], [data-edit-bg], [data-edit-href], [data-edit-icon], [data-edit-svg]"),rt=async(e,t=0)=>{try{if(e.cssRules){let n=[];for(let i of e.cssRules)i.styleSheet&&t<4?n.push(await rt(i.styleSheet,t+1)):n.push(i.cssText);return n.join("")}}catch{}if(!e.href)return"";try{let n=await fetch(e.href);if(!n.ok)return"";let i=await n.text();if(t>=4)return i;let d=[...i.matchAll(/@import\s+(?:url\(\s*(["']?)([^"')]+)\1\s*\)|(["'])([^"']+)\3)/gi)].map(p=>p[2]||p[4]).filter(Boolean),u=await Promise.all(d.map(p=>rt({href:new URL(p,e.href).href},t+1)));return i+u.join("")}catch{return""}},qn=null,Mn=async()=>{let e=new Map;return(await Promise.all([...document.styleSheets].map(n=>rt(n)))).forEach(n=>on(n).forEach(i=>e.set(i.name,i.glyph))),[...e].map(([n,i])=>({name:n,glyph:i})).sort((n,i)=>n.name.localeCompare(i.name))},Pt=()=>qn??(qn=Mn()),Bt=()=>{document.querySelectorAll("[data-style]").forEach(e=>{if(e.hasAttribute("data-edit-bg"))return;let n=(getComputedStyle(e).backgroundImage||"").match(/url\((['"]?)(.*?)\1\)/),i=e.getBoundingClientRect(),d=n&&!n[2].startsWith("data:")&&i.width>=120&&i.height>=120;e.toggleAttribute("data-has-bg",!!d)})},Un=()=>{document.querySelectorAll("[data-edit-icon]").forEach(e=>{let t=getComputedStyle(e,"::before").content;(t==="none"||t==="normal"||t==='""'||t==="")&&e.removeAttribute("data-edit-icon")})},Le=e=>{e&&Un(),document.body.classList.toggle("editing",e),Dn().forEach(t=>{e?t.setAttribute("tabindex","0"):t.removeAttribute("tabindex")}),sessionStorage.setItem("tb_editing",e?"1":"0"),ie.textContent=e?"Click any outlined text or image":"",ie.parentElement?.classList.toggle("is-saying",e),!e&&typeof ze=="function"&&ze(),l.toolbar.classList.toggle("is-editing",e),ae.textContent=e?"Done editing":"Edit site",e?(Bt(),document.querySelector("[data-edit-icon]")&&Pt(),o?.base&&o?.site&&Promise.resolve().then(()=>(Lt(),Ct)).then(t=>t.refreshBackgrounds({base:o.base,site:o.site,key:o.token})).then(t=>{t&&Bt()}).catch(t=>console.warn("[live-edit] could not look again for backgrounds:",t.message))):(gt(),he()),e||Ce(!0)},_n=async()=>{let e=window.liveEditApi,t=await Promise.resolve().then(()=>(zn(),jn)).catch(()=>null);if(t?.forget(window),!e||!t){window.location.reload();return}let n=window.prompt("Your editing session has ended. Enter your email address and we will send you a new link.");n&&(await t.requestLink(e,n,window).catch(()=>{}),y("If that address can edit this site, a link is on its way.")),window.location.reload()},B=async(e,t)=>{let n=window.liveEditApi,i=n?ln(e,t,n):null,d=i?await fetch(i.url,i.init):await fetch(e,tn(r,t));if(d.status===419||d.status===401)throw await _n(),new Error("Your editing session has ended.");if(!d.ok){let u=await d.json().catch(()=>({}));throw new Error(u.error?.message??u.message??"Could not save. Try again.")}if(!nn(d))throw new Error("That did not save. Reload the page and try again.");return d},Hn=(e,t)=>{if(!e?.element)return null;let n=i=>{let d=e.element.getAttribute(i);return d===null?null:{attr:i,marker:d}};if(e.kind==="image"){let i=t.querySelector("input[type=url]")?.value.trim(),d=t.querySelector("input[type=file]")?.files?.[0],u=n("data-edit-img")??n("data-edit-bg");return i&&u?{...u,kind:"image",value:i}:null}if(e.kind==="icon"){let i=n("data-edit-icon");return i&&e.value?{...i,kind:"icon",value:e.value}:null}if(e.kind==="setting"&&typeof e.savedValue=="string"){let i=n("data-edit");return!i||/<[a-z][\s\S]*>/i.test(e.savedValue)||e.element.hasAttribute("data-edit-attr")?null:{...i,kind:"text",value:e.savedValue}}return null},Wn=async e=>{let t=window.liveEditApi?.builderUrl;if(!t||e?.kind!=="setting"||typeof e.savedValue!="string"||!e.element)return;let n=e.element.closest(".elementor-element[data-id]");if(n)try{await fetch(t,{method:"POST",headers:{"Content-Type":"application/json",...window.liveEditApi?.publishHeaders??{}},body:JSON.stringify({page:window.location.href,element:n.dataset.id,value:e.savedValue})})}catch(i){console.warn("[live-edit] could not tell the page builder about this change:",i.message)}},Vn=async()=>{if(!v)return;let e=l.saveButton;e.disabled=!0,e.textContent="Saving\u2026";let t=()=>{e.disabled=!1,e.textContent="Save changes"};try{if(v.kind==="setting")await B("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:v.key,value:v.savedValue=v.value??E.querySelector("textarea, input[name=icon]")?.value??"",locale:window.liveEditLocale})});else if(v.kind==="record"){let n={};E.querySelectorAll("textarea, select, input[type=hidden][name]").forEach(i=>n[i.name]=i.value),await B("/live-edit/record",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:v.type,id:v.id,fields:n})})}else if(v.kind==="icon")await B("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:v.key,value:v.value})});else if(v.kind==="image"){let n=new FormData;n.append("target",v.target);let i=E.querySelector("input[type=file]").files[0],d=E.querySelector("input[type=url]").value.trim(),u=at(v.element);u&&(n.append("fitWidth",String(u.width)),n.append("fitHeight",String(u.height)),u.exact&&n.append("fitExact","1"));let p=i!==void 0||d!==""&&d!==void 0;v.credit&&v.creditFor===v.target&&p&&Object.entries(v.credit).forEach(([g,h])=>n.append(g,h));let c=[...E.querySelectorAll("[data-img-attr]")];if(window.liveEditLocale&&n.append("locale",window.liveEditLocale),i?n.append("file",i):d&&n.append("url",d.startsWith("http")?d:`https://${d}`),c.forEach(g=>n.append(g.dataset.imgAttr,g.value)),!i&&!d&&c.length===0){t(),y("Choose a file from your computer or paste an image URL first.");return}await B("/live-edit/image",{method:"POST",body:n})}if(v.hrefKey){let n=E.querySelector("[data-link-field=href]").value.trim(),i=E.querySelector("[data-link-field=target]").checked;await B("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:v.hrefKey,value:n})}),v.targetKey&&await B("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:v.targetKey,value:i?"_blank":""})})}v.styleKey&&await B("/live-edit/style",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:v.styleKey,props:xe()})}),await Wn(v),Xt(Hn(v,E)),R("Saved \u2713",v.key??null,v.savedValue??null)}catch(n){t(),y(n.message)}};Ue(),_e();let j=(e,t,n)=>{let i=document.createElement(e);return t&&(i.className=t),n!=null&&(i.textContent=n),i},jt=e=>{let t=e.closest("section, article, header, div[data-style]");for(;t&&!t.querySelector("h1, h2, h3");)t=t.parentElement?.closest("section, article, header, div[data-style]")??null;let n=t?.querySelector("h1, h2, h3");return!t||!n?"":[...t.querySelectorAll("p, span, div, h4, h5, h6")].filter(d=>d.children.length===0).filter(d=>n.compareDocumentPosition(d)&Node.DOCUMENT_POSITION_PRECEDING).map(d=>(d.textContent??"").replace(/\s+/g," ").trim()).find(d=>d.length>3&&d.length<42)??""},Jn=/^(the|and|with|for|your|our|from|that|this|they|them|will|have|more|about|into|just|than|then|when|what|where|very|been|here|there)$/,zt=e=>{let t=new Set((document.title??"").toLowerCase().split(/[^a-z0-9]+/i).filter(Boolean));return(e??"").toLowerCase().split(/[^a-z0-9]+/i).filter(n=>n.length>3&&!Jn.test(n)&&!t.has(n))},Yn=e=>{let t=zt(jt(e)).slice(0,3);if(t.length>0)return t.join(" ");let n=zt(je(e)).slice(0,3);return n.length>0?n.join(" "):"workplace"},Rt=e=>{let t=Yn(e),n=(e.dataset.editLabel??"").toLowerCase().trim(),i=/hero|banner|header|cover/.test(n);return[...new Set([t,i?`${t} wide`:`${t} close up`,"workplace"].filter(Boolean))].slice(0,4)},Gn=e=>`${(jt(e)||je(e)||"This page").replace(/[.\s]+$/,"")}. Photographic, natural daylight, calm and editorial, soft neutral tones to match the rest of the site. No text.`,Ft=(e,t,n="Free photos",i="image")=>{let d=l.modal({title:`Replace ${i}`,subtitle:e.dataset.editLabel??X(e)}),u=document.createElement("div");d.body.append(u),d.tabs.hidden=!1;let p=m=>{d.close(),t(m)},c={Upload:()=>Kn(u,p),"Free photos":()=>void Xn(u,e,p),"Generate with AI":()=>Zn(u,e,p)},g=Object.keys(c).map(m=>{let w=document.createElement("button");return w.type="button",w.className="le-modal-tab",w.textContent=m,w.addEventListener("click",()=>h(m)),d.tabs.append(w),[m,w]}),h=m=>{g.forEach(([w,b])=>b.classList.toggle("is-on",w===m)),u.replaceChildren(),c[m]()};return h(c[n]?n:"Free photos"),d},Kn=(e,t)=>{e.append(be({hint:"PNG, JPG or WEBP, or drag one here",onFile:c=>t({file:c})}));let n=j("div","le-row-tight"),i=document.createElement("input");i.type="url",i.className="le-search",i.placeholder="Or paste a link to a picture";let d=j("button","le-btn-outline","Use it");d.type="button";let u=()=>{let c=i.value.trim();c&&t({url:c.startsWith("http")?c:`https://${c}`})};d.addEventListener("click",u),i.addEventListener("keydown",c=>{c.key==="Enter"&&(c.preventDefault(),u())}),n.append(i,d),e.append(n);let p=j("p","le-hint","You can also drag a picture straight onto the image on the page.");p.style.marginTop="14px",e.append(p)},Xn=async(e,t,n)=>{let i=document.createElement("input");i.type="search",i.className="le-search",i.placeholder="Search free photographs";let d=document.createElement("div");d.className="le-chips";let u=document.createElement("div");u.className="le-grid";let p=document.createElement("p");p.className="le-hint",p.style.marginTop="16px",e.append(i,d,u,p);let c=()=>{u.replaceChildren();for(let h=0;h<6;h+=1)u.append(j("div","le-shimmer"))},g=async h=>{i.value=h,c();let m;try{m=await(await B(`/live-edit/photos?q=${encodeURIComponent(h)}`,{method:"GET"})).json()}catch(b){u.replaceChildren(J(U(b,"look for photographs")));return}let w=m?.photos??[];if(p.textContent=m?.source==="openverse"?"Free to use, including commercially. The photographer is credited automatically.":"Free to use under the Unsplash licence. The photographer is credited automatically.",w.length===0){u.replaceChildren(J(Qn(m?.reason,h)));return}u.replaceChildren(),w.forEach(b=>{let x=document.createElement("button");x.type="button",x.className="le-pick";let S=document.createElement("img");S.className="le-pick-shot",S.src=b.thumb??b.full,S.alt=b.alt??"",S.loading="lazy";let C=j("span","le-pick-by",b.by?`Photo by ${b.by}`:"");x.append(S,C),x.addEventListener("click",()=>{b.downloadLocation&&B("/live-edit/photos/used",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({download_location:b.downloadLocation})}).catch(()=>{}),n({url:b.full,alt:b.alt??"",credit:b.credit??(b.by?`Photo by ${b.by}`:""),creditBy:b.by??"",creditUrl:b.byUrl??"",creditSource:b.source??"",creditSourceUrl:b.sourceUrl??""})}),u.append(x)})};Rt(t).forEach((h,m)=>{let w=document.createElement("button");w.type="button",w.className="le-chip",w.textContent=h,w.addEventListener("click",()=>void g(h)),d.append(w),m===0&&w.classList.add("is-on")}),i.addEventListener("keydown",h=>{h.key==="Enter"&&(h.preventDefault(),i.value.trim()&&g(i.value.trim()))}),await g(Rt(t)[0])},Qn=(e,t)=>({not_configured:"Free photographs are not switched on for this site yet.",not_allowed:"The photo library would not accept this site\u2019s key. It needs setting up again.",unreachable:"Could not reach the photo library just now. Try again in a moment.",nothing_to_search_for:"Type what the picture should show."})[e]??`Nothing found for "${t}". Try fewer words.`,Zn=(e,t,n)=>{let i=Gn(t),d=j("div","le-suggest");d.append(j("div","le-eyebrow","Suggested for this spot"),j("div","le-suggest-text",i));let u=document.createElement("button");u.type="button",u.className="le-chip",u.style.marginTop="10px",u.textContent="Use this description",d.append(u);let p=document.createElement("textarea");p.className="le-textarea",p.placeholder="Describe the picture you want",u.addEventListener("click",()=>{p.value=i,p.focus()});let c=_?.costs?.generate_image??5,g=_?.balance??0,h=document.createElement("button");h.type="button",h.className="le-btn-publish",h.style.marginTop="14px",h.textContent=`Make a picture \xB7 ${c} credits`;let m=j("div","le-grid is-square");if(m.style.display="none",e.append(d,p,h,m),g<c){h.disabled=!0,h.textContent=`Not enough credits \xB7 ${c} needed`;let w=J(`Making a picture costs ${c} credits and you have ${g}. Everything else here is free: upload your own, or pick a free photograph.`);w.classList.add("is-short"),e.insertBefore(w,h)}else{let w=j("div","le-hint",`${c} credits a picture \xB7 ${g} left`);e.insertBefore(w,h)}h.addEventListener("click",async()=>{let w=p.value.trim()||i;h.disabled=!0,h.textContent="Making\u2026",m.style.display="",m.replaceChildren();for(let S=0;S<4;S+=1)m.append(j("div","le-shimmer"));let b;try{b=await(await B("/live-edit/imagine",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:w})})).json()}catch(S){m.replaceChildren(J(U(S,"make a picture"))),h.disabled=!1,h.textContent="Try again \xB7 5 credits";return}let x=b?.images??[];if(typeof b?.balance=="number"&&(_={..._??{},balance:b.balance}),x.length===0){m.replaceChildren(J(eo(b?.reason))),h.disabled=!1,h.textContent="Try again \xB7 5 credits";return}m.replaceChildren(),x.forEach(S=>{let C=document.createElement("button");C.type="button",C.className="le-pick";let T=document.createElement("img");T.className="le-pick-shot",T.src=S,T.alt="",C.append(T,j("span","le-tag","MADE")),C.addEventListener("click",()=>n({url:S,credit:"",creditSource:"Generated"})),m.append(C)}),h.disabled=!1,h.textContent="Make four more \xB7 5 credits"})},eo=e=>({not_enough_credits:"Not enough credits to make a picture. You can buy more from your account.",not_configured:"Making pictures is not switched on for this site yet.",no_suggestion:"Nothing usable came back, so you have not been charged. Try describing it differently.",nothing_to_work_with:"Describe the picture you want first."})[e]??"Could not make a picture just now. You have not been charged.",Ae=null,to=(e,t)=>{if(!t)return;let n=de(e),i=c=>[...c.childNodes].filter(g=>g.nodeType===3),d=i(e).map(c=>c.nodeValue),u=()=>{let c=i(e);return c.length!==d.length?!1:(c.forEach((g,h)=>{g.nodeValue=d[h]}),!0)},p=!1;v.restore=()=>{!p||!Ae||u()||Ae(e,n)},t.addEventListener("input",()=>{Ae&&(p=!0,u(),Ae(e,t.value,{keepRuns:!0}))}),Ae===null&&Promise.resolve().then(()=>(tt(),et)).then(c=>Ae=c.applyValue).catch(c=>console.warn("[live-edit] could not preview words as you type:",c.message))},no=e=>{v.hrefKey=e.dataset.editHref,v.targetKey=e.dataset.editTarget;let t=document.createElement("div");t.className="le-field le-divided",t.append("Link");let n=document.createElement("input");n.type="text",n.dataset.linkField="href";let i=e.getAttribute("href")??"";n.value=i==="#"?"":i,n.placeholder="/contact or https://...",n.className="le-input le-link";let d=document.createElement("label");d.className="le-default";let u=document.createElement("input");u.type="checkbox",u.dataset.linkField="target",u.checked=e.getAttribute("target")==="_blank",d.append(u,"Open in a new tab"),t.append(n,d),E.append(t)},st=e=>{v={kind:"link"},H.textContent=e.dataset.editLabel??"Link",E.replaceChildren(),M.classList.add("le-hidden"),pe(e)},Je=e=>{let{kind:t,key:n,parts:i}=en(e.dataset.edit);if(E.replaceChildren(),M.classList.add("le-hidden"),t==="setting"){v={kind:t,key:n,element:e},H.textContent=e.dataset.editLabel??X(e);let d=(window.liveEditRich?.settings??[]).includes(i[0]),u=xt({editValue:e.dataset.editValue,ownText:de(e),fullText:e.textContent}),p=d?u.trim():u.replace(/\s+/g," ").trim(),c=e.dataset.editAs==="icon";E.append(c?fe("icon","Icon",e.dataset.editValue??"",1,!1):fe("value","Text",p,6,d)),c||ke(e,E.querySelector("textarea")),!c&&!d&&to(e,E.querySelector("textarea"))}else{let[d,u]=i;v={kind:"record",type:d,id:Number(u)};let p=e.dataset.editLabel??"Item",c=JSON.parse(e.dataset.editValues??"{}"),g=c.title??c.question??c.label??c.number;if(H.textContent=g?`${p}: ${g.slice(0,40)}`:p,Object.entries(c).forEach(([b,x])=>{let S=b.replace(/_/g," "),C=S.charAt(0).toUpperCase()+S.slice(1),T=(window.liveEditRich?.fields??[]).includes(`${d}.${b}`);E.append(fe(b,C,x,b==="detail"||b==="answer"?6:3,T))}),window.liveEditPublishing){let b=document.createElement("div");b.className="le-hint le-immediate",b.textContent="Changes here go live as soon as you save, without publishing.",E.append(b)}e.hasAttribute("data-edit-deletable")&&(M.textContent=`Delete this ${p.toLowerCase()}`,M.classList.remove("le-hidden"));let h=document.createElement("div");h.className="le-row";let m=document.createElement("span");m.className="le-label",m.textContent="Order";let w=(b,x)=>{let S=document.createElement("button");return S.type="button",S.textContent=x,S.className="le-chip-btn",S.addEventListener("click",async()=>{(await(await B("/live-edit/record/move",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:v.type,id:v.id,direction:b})})).json()).moved?O("Reordered \u2713"):y(b==="up"?"Already first.":"Already last.")}),S};h.append(m,w("up","\u2191 Move up"),w("down","\u2193 Move down")),E.prepend(h)}pe(e)},oo=e=>{let t=e.closest?.("[data-edit-item]"),n=t?.parentElement?.dataset?.editList?t.parentElement:e.closest?.("[data-edit-list]");if(!n?.dataset?.editList)return;let i=()=>[...n.children].filter(g=>g.dataset.editItem).map(g=>g.dataset.editItem),d=async(g,h)=>{try{await B("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:n.dataset.editList,value:JSON.stringify(g)})}),O(h)}catch(m){y(m.message)}},u=document.createElement("div");u.className="le-section-heading",u.textContent="List";let p=document.createElement("div");p.className="le-row";let c=document.createElement("button");if(c.type="button",c.className="le-chip-btn",c.textContent=t?"+ Add another":"+ Add item",c.addEventListener("click",()=>{let g=i(),h=t?g.indexOf(t.dataset.editItem):g.length-1;g.splice(h+1,0,"n"+Date.now().toString(36)),d(g,"Added \u2713")}),p.append(c),t){let g=document.createElement("button");g.type="button",g.className="le-btn-danger",g.textContent="Delete this item",g.addEventListener("click",()=>{window.confirm("Delete this item?")&&d(i().filter(h=>h!==t.dataset.editItem),"Deleted \u2713")}),p.append(g)}E.append(u,p)},lt=!1,ao=e=>{lt=!0,e.click(),window.setTimeout(()=>{lt=!1},0)},io=e=>e.closest?.('a[href^="#"], [aria-controls], [aria-expanded], [data-toggle], [role="button"]')??null,ro=e=>{let t=io(e);if(t){let p=document.createElement("div");p.className="le-row";let c=document.createElement("button");c.type="button",c.className="le-chip-btn",c.textContent="Open this menu",c.title="Runs the control so you can edit what it reveals",c.addEventListener("click",()=>{Ce(!0),ao(t)}),p.append(c),E.append(p)}let n=e.closest?.("a[href]"),i=n?.getAttribute("href");if(!i||i==="#"||i.startsWith("javascript:"))return;let d=document.createElement("div");d.className="le-row";let u=document.createElement("button");u.type="button",u.className="le-chip-btn",u.textContent="Open this link \u2192",u.addEventListener("click",()=>{window.location.href=n.href}),d.append(u),E.append(d)},pe=(e,{styleKey:t=null,styleOn:n=e}={})=>{e.dataset.editHref!==void 0&&no(e),ro(e);let i=t??n.dataset.styleEdit??n.dataset.style,d=sn(n.dataset.styleProps,window.liveEditStyleProps);i&&d.length&&Me(i,d,n),lo(e),oo(e),P(e.dataset.styleEdit?e.closest("[data-style]")??e.parentElement:e),V("Edit"),it()},so=e=>{let t=(de(e)||e.textContent||"").replace(/\s+/g," ").trim();if(t)return t.slice(0,28);let n=(e.getAttribute("aria-label")??e.getAttribute("title")??"").trim();if(n)return n.slice(0,28);let i=e.className.toString().match(/(?:social-icon-|fa-|bi-|icon-)([a-z][a-z0-9-]{2,})/i)?.[1]??[...e.querySelectorAll("[class]")].map(d=>d.className.toString().match(/(?:social-icon-|fa-|bi-|icon-)([a-z][a-z0-9-]{2,})/i)?.[1]).find(Boolean);return i?i.charAt(0).toUpperCase()+i.slice(1):ce(e)},lo=e=>{let t="[data-edit], [data-edit-img], [data-edit-bg], [data-edit-href], [data-edit-icon], [data-edit-svg]",n=[...e.querySelectorAll(t)].filter(p=>p.parentElement?.closest(t)===null||!e.contains(p.parentElement.closest(t))).filter(p=>p!==e&&p.getBoundingClientRect().width>0);if(n.length===0)return;let i=n.slice(0,24),d=document.createElement("div");d.className="le-section-heading",d.textContent=n.length>i.length?`Inside this \u2014 first ${i.length} of ${n.length}`:"Inside this",E.append(d);let u=document.createElement("div");u.className="le-row",i.forEach(p=>{let c=document.createElement("button");c.type="button",c.className="le-chip-btn",c.textContent=so(p),c.addEventListener("click",()=>nt(p)),u.append(c)}),E.append(u)},dt=e=>{v={kind:"style"};let t=e.dataset.styleEdit??e.dataset.style;H.textContent=e.dataset.editLabel??X(e),E.replaceChildren(),M.classList.add("le-hidden"),pe(e,{styleKey:t})},Ye=e=>{let t=getComputedStyle(e,"::before");return`${t.fontStyle} ${t.fontWeight} 20px ${t.fontFamily}`},Dt=(e,t)=>{let n=e.cloneNode(!1);n.removeAttribute("data-edit-icon"),Object.assign(n.style,{position:"absolute",visibility:"hidden",pointerEvents:"none"}),(e.parentNode??document.body).append(n);let i=Ye(n),d=[];return[...n.classList].forEach(u=>{u!==t&&(n.classList.remove(u),Ye(n)!==i&&d.push(u),n.classList.add(u))}),n.remove(),d},co=(e,t,n,i)=>an([...e.classList],n,i,Dt(e,i),Dt(t,t.dataset.editIconCurrent)),po=(e,t)=>{let n=document.createElement("canvas").getContext("2d");return n.font=t,e.filter(({glyph:i})=>{let d=n.measureText(i);return(d.actualBoundingBoxAscent||0)+(d.actualBoundingBoxDescent||0)>0})},uo=async e=>{let t=e.dataset.editIconCurrent;v={kind:"icon",key:e.dataset.editIcon.replace(/^setting:/,""),value:t,element:e},H.textContent="Icon",E.replaceChildren(),M.classList.add("le-hidden");let n=Ye(e),i=await Pt();if(v?.element!==e)return;let d=new Map([[n,null]]);document.querySelectorAll("[data-edit-icon]").forEach(b=>{let x=Ye(b);d.has(x)||d.set(x,b)});let u=rn([...d].map(([b,x])=>({face:b,variant:x,icons:po(i,b)})));if(u.length===0){let b=document.createElement("div");b.className="le-hint",b.textContent="This theme loads its icons from somewhere this page cannot read, so they cannot be listed. Type the icon name instead.";let x=document.createElement("label");x.className="le-field",x.append("Icon name");let S=document.createElement("input");S.type="text",S.className="le-input",S.value=t??"",S.addEventListener("input",()=>{v.value=S.value.trim(),v.dirty=!0}),x.append(S,b),E.append(x),pe(e);return}let p=e.className;v.restore=()=>{e.className=p,e.dataset.editIconCurrent=t};let c=document.createElement("input");c.type="search",c.className="le-input",c.placeholder=`Search ${u.length} icons\u2026`;let g=document.createElement("div");g.className="le-icon-grid";let h=document.createElement("div");h.className="le-hint";let m=400,w=b=>{let x=b.trim().toLowerCase().replace(/\s+/g,"-"),S=x?u.filter(({name:C})=>C.includes(x)):u;if(g.replaceChildren(),S.slice(0,m).forEach(({name:C,glyph:T,face:q,variant:I})=>{let z=document.createElement("button");z.type="button",z.className="le-icon-choice",z.title=C.replace(/^[a-z]+-/,"").replace(/-/g," "),z.classList.toggle("is-current",C===t),z.style.font=q,z.textContent=T,z.addEventListener("click",()=>{e.className=p,e.dataset.editIconCurrent=t;let W=I?co(e,I,C,t):C;I?e.className=W:e.classList.replace(t,C),e.dataset.editIconCurrent=C,v.value=W,v.dirty=!0,g.querySelectorAll(".le-icon-choice").forEach(ee=>ee.classList.remove("is-current")),z.classList.add("is-current")}),g.append(z)}),S.length===0){let C=document.createElement("div");C.className="le-hint",C.textContent="No icon matches that name.",g.append(C)}h.textContent=S.length>m?`Showing ${m} of ${S.length}. Type to narrow it down.`:""};c.addEventListener("input",()=>w(c.value)),w(""),E.append(c,g,h),pe(e)},qt=e=>{let t=e.outerHTML;v={kind:"setting",key:e.dataset.editSvg.replace(/^setting:/,""),element:e},H.textContent=e.dataset.editLabel??"Drawing",E.replaceChildren(),M.classList.add("le-hidden");let n=()=>{e.outerHTML=t};v.restore=n;let i=new Set,d=[];document.querySelectorAll("svg").forEach(w=>{let b=w.outerHTML,x=b.replace(/\s+(class|style|width|height|data-[\w-]+)="[^"]*"/g,"");i.has(x)||w.getBoundingClientRect().width<4||(i.add(x),d.push(b))});let u=document.createElement("div");u.className="le-icon-grid";let p=null;d.slice(0,120).forEach(w=>{let b=document.createElement("button");b.type="button",b.className="le-icon-choice",b.innerHTML=w;let x=b.firstElementChild;x&&(x.removeAttribute("class"),x.setAttribute("width","20"),x.setAttribute("height","20")),b.classList.toggle("is-current",w===t),b.addEventListener("click",()=>{p=w,v.value=w,v.dirty=!0;let S=document.querySelector(`[data-edit-svg="${e.dataset.editSvg}"]`)??e,C=new DOMParser().parseFromString(w,"image/svg+xml").documentElement;["class","width","height","style","data-edit-svg","data-edit-label"].forEach(T=>{S.hasAttribute(T)&&C.setAttribute(T,S.getAttribute(T))}),S.replaceWith(C),u.querySelectorAll(".le-icon-choice").forEach(T=>T.classList.remove("is-current")),b.classList.add("is-current")}),u.append(b)});let c=document.createElement("label");c.className="le-field le-divided",c.append("Or paste an SVG");let g=document.createElement("textarea");g.className="le-input le-prose",g.placeholder='<svg viewBox="0 0 24 24">\u2026</svg>',g.addEventListener("input",()=>{g.value.trim()!==""&&(v.value=g.value.trim(),v.dirty=!0)});let h=document.createElement("div");h.className="le-hint",h.textContent="Anything that could run or fetch is stripped before it is saved.",c.append(g,h);let m=document.createElement("div");m.className="le-section-heading",m.textContent=d.length?"Drawings on this site":"No other drawings here",E.append(m,u,c),pe(e)},ct=e=>{let t=e.dataset.editKind==="background";v={kind:"image",target:e.dataset.editImg??e.dataset.editBg,element:e},H.textContent=e.dataset.editLabel??(t?"Background image":"Image"),E.replaceChildren(),M.classList.add("le-hidden");let n=document.createElement("div");n.className="le-preview";let i=document.createElement("img");i.alt="",i.className="";let d=t?Ne(e):e.currentSrc||e.getAttribute("src")||"",p=(d&&!d.startsWith("data:")?d:"")||e.dataset.editPreview;p?(i.src=p,n.append(i)):n.textContent="No image yet";let c=I=>{n.replaceChildren(i),i.src=I},g=be({onFile:I=>c(URL.createObjectURL(I))}),h=document.createElement("label");h.className="le-field",h.append("Or paste an image URL");let m=document.createElement("input");m.type="url",m.placeholder="https://...",m.className="le-input",m.addEventListener("change",()=>{let I=m.value.trim();I&&c(I.startsWith("http")?I:`https://${I}`)}),h.append(m);let w=document.createElement("div");w.className="le-hint",w.textContent="Nothing changes on your site until you publish.";let b=(I,z,W,ee)=>{let te=document.createElement("label");te.className="le-field le-divided",te.append(z);let ge=document.createElement("input");if(ge.type="text",ge.dataset.imgAttr=I,ge.value=W??"",ge.className="le-input",te.append(ge),ee){let Fe=document.createElement("span");Fe.className="le-hint",Fe.textContent=ee,te.append(Fe)}return te},x=j("div","le-ways"),S=({url:I,file:z,credit:W,alt:ee,creditBy:te,creditUrl:ge,creditSource:Fe,creditSourceUrl:yo})=>{if(z){let Gt=new DataTransfer;Gt.items.add(z),g.querySelector("input[type=file]").files=Gt.files,c(URL.createObjectURL(z))}else I&&(m.value=I,c(I));let mt=E.querySelector('[data-img-attr="alt"]');ee&&mt&&mt.value.trim()===""&&(mt.value=ee),v.credit={credit:W??"",creditBy:te??"",creditUrl:ge??"",creditSource:Fe??"",creditSourceUrl:yo??""},v.creditFor=v.target,T(v.credit),l.saveButton.click()},C=j("p","le-credit"),T=I=>{let z=(I?.credit??"").trim();C.textContent=z,C.hidden=z===""};T({credit:Xe(e,"data-edit-credit","editCredit")});let q=j("button","le-btn le-wide",t?"Replace background":"Replace image");if(q.type="button",q.addEventListener("click",()=>Ft(e,S,"Free photos",t?"background":"image")),x.append(q),g.hidden=!0,h.hidden=!0,E.append(n,C,x,g,h,w),v.target.startsWith("setting:")&&!t&&E.append(b("alt","Alt text",Xe(e,"alt","editAlt"),"Describes the image for search engines and screen readers."),b("imgTitle","Title attribute",Xe(e,"title","editTitle"),"Optional tooltip shown on hover.")),v.target.startsWith("setting:")){let I=document.createElement("button");I.type="button",I.textContent=t?"Remove background":"Remove image",I.className="le-btn-danger",I.addEventListener("click",async()=>{let z=t?"Remove this background image? The section keeps its layout and colour.":"Remove this image? The section keeps its layout; you can add a new image any time.";if(!window.confirm(z))return;let W=new FormData;W.append("target",v.target),W.append("remove","1"),await B("/live-edit/image",{method:"POST",body:W}),O("Removed \u2713")}),E.append(I)}pe(e)},Mt=e=>e?.closest?.("a[data-edit], a[data-edit-href]")??null,ho=e=>{let t=e?.getAttribute("href")??"";return t!==""&&t!=="#"&&!t.startsWith("javascript:")},ue=null,pt=!1,Ge=null,ut=()=>{Ge&&(clearTimeout(Ge),Ge=null)},Ut=()=>{ut(),Ge=setTimeout(()=>{pt||ze()},140)},go=e=>{if(e===ue&&!Y.classList.contains("hidden"))return;ue=e;let t=e.getBoundingClientRect();Y.style.top=`${t.top+window.scrollY-10}px`,Y.style.left=`${t.right+window.scrollX-10}px`,Y.classList.add("is-visible")},ze=()=>{Y.classList.remove("is-visible"),ue=null},_t=e=>{if(!e?.closest)return null;let t=e.closest("[data-style-edit]");if(t)return{element:t,kind:"style"};let n=e.closest("[data-edit-img]");if(n)return{element:n,kind:"image"};let i=e.closest("[data-edit-icon]");if(i)return{element:i,kind:"icon"};let d=e.closest("[data-edit-svg]");if(d)return{element:d,kind:"svg"};let u=e.closest("[data-edit]");if(u)return{element:u,kind:"text"};let p=e.closest("[data-edit-href]:not([data-edit])");if(p)return{element:p,kind:"link"};let c=e.closest("[data-edit-bg]");if(c)return{element:c,kind:"image"};let g=e.closest("[data-style]:not([data-style-edit])");return g?{element:g,kind:"style"}:null},fo=({element:e,kind:t})=>{t==="image"?ct(e):t==="icon"?uo(e):t==="svg"?qt(e):t==="text"?Je(e):t==="link"?st(e):dt(e)},ht=null,he=()=>l.hoverBox.classList.remove("is-visible"),bo=e=>{let t=e.getBoundingClientRect();if(t.width<4||t.height<4){he();return}Object.assign(l.hoverBox.style,{top:`${t.top}px`,left:`${t.left}px`,width:`${t.width}px`,height:`${t.height}px`}),l.hoverBox.classList.toggle("is-flipped",t.top<26),l.hoverLabel.textContent=e.dataset.editLabel??X(e),l.hoverBox.classList.add("is-visible")};document.addEventListener("pointermove",e=>{if(!document.body.classList.contains("editing")){he();return}if(e.target===l.root||l.root.contains(e.target)){he();return}ht||(ht=requestAnimationFrame(()=>{ht=null;let t=_t(e.target);t?bo(t.element):he()}))}),document.addEventListener("scroll",he,!0),document.addEventListener("pointerleave",he);let Ke=null,gt=()=>{Q.classList.remove("is-visible"),Ke=null},mo=e=>{Ke=e;let t=e.getBoundingClientRect();Q.style.top=`${Math.max(t.top,8)+8}px`,Q.style.left=`${t.left+8}px`,Q.classList.add("is-visible")};Q.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),Ke&&dt(Ke),gt()}),document.addEventListener("pointerover",e=>{if(!document.body.classList.contains("editing"))return;let t=e.target.closest?.("[data-has-bg]");t&&mo(t);let n=Mt(e.target);n&&ho(n)&&(ut(),go(n))}),document.addEventListener("pointerout",e=>{document.body.classList.contains("editing")&&e.relatedTarget!==Y&&(Mt(e.relatedTarget)===ue&&ue||Ut())}),Y.addEventListener("pointerenter",()=>{pt=!0,ut()}),Y.addEventListener("pointerleave",()=>{pt=!1,Ut()}),Y.addEventListener("click",e=>{if(e.preventDefault(),e.stopPropagation(),!ue)return;let t=ue;t.dataset.edit!==void 0?Je(t):st(t),ze()}),document.addEventListener("click",e=>{if(!document.body.classList.contains("editing")||lt||e.target===l.root||l.root.contains(e.target)||e.target.closest("[data-live-create]"))return;let t=_t(e.target);t&&(e.preventDefault(),e.stopImmediatePropagation(),fo(t))},!0),document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$.classList.contains("is-open")&&Ce(),!document.body.classList.contains("editing")||e.key!=="Enter"&&e.key!==" "||l.shadow.activeElement)return;let t=document.activeElement;t?.matches("[data-edit-img], [data-edit-bg]")?(e.preventDefault(),ct(t)):t?.matches("[data-edit]")&&!t.matches("button, a")&&(e.preventDefault(),Je(t))}),ae?.addEventListener("click",()=>Le(!document.body.classList.contains("editing"))),l.changesButton?.addEventListener("click",()=>{document.body.classList.contains("editing")||Le(!0),V("Changes"),it()});let Ht=e=>{if(window.liveEditPublishing){e(window.liveEditPublishing);return}A().then(()=>window.liveEditPublishing&&e(window.liveEditPublishing))};Ht(e=>{let t=e.pending??0,n=()=>{l.publishButton.hidden=!1,l.previewButton.hidden=!1,l.publishLabel.textContent=t>0?"Publish":"Published",l.publishCount.textContent=String(t),l.publishCount.hidden=t===0,l.publishButton.disabled=t===0,l.publishButton.title=t>0?`Put ${t} change${t===1?"":"s"} live`:"Nothing is waiting to be published"};n();let i=async()=>{let u=t===1?"":"s",p=e.domain??window.location.host,c=l.modal({title:`Publish ${t} change${u}`,subtitle:`They go live on ${p} right away.`,size:"is-narrow"});c.body.append(J("Loading\u2026"));let g=j("button","le-btn-outline","Keep editing");g.type="button",g.addEventListener("click",()=>c.close());let h=j("button","le-btn-publish","Publish now");h.type="button",c.foot.hidden=!1,c.foot.append(g,h),h.focus();try{let b=(await(await B("/live-edit/changes",{method:"GET"})).json())?.changes??[],x=j("div","le-review");b.forEach(S=>{let C=j("div","le-review-row");C.append(j("div","le-review-what",le(S)),j("div","le-review-to",Se(S.after)||"(empty)")),x.append(C)}),c.body.replaceChildren(b.length>0?x:J("Nothing is waiting."))}catch(m){c.body.replaceChildren(J(U(m,"list what is waiting")))}h.addEventListener("click",async()=>{h.disabled=!0,g.disabled=!0,h.textContent="Publishing\u2026",c.allowDismiss(!1);try{await B("/live-edit/publish",{method:"POST"}),t=0,n(),c.close(),O(`Live on ${p} \u2713`)}catch(m){c.allowDismiss(!0),h.disabled=!1,g.disabled=!1,h.textContent="Try again",c.body.replaceChildren(J(U(m,"publish that")))}})};l.publishButton.addEventListener("click",()=>{t!==0&&(document.activeElement?.blur?.(),i())});let d=()=>{let u=document.body.classList.contains("editing");Ce(!0),Le(!1),l.toolbar.style.display="none";let p=document.createElement("div");p.className="le-back";let c=null,g=x=>{if(x&&!c){c=document.createElement("div"),c.className="le-phone";let S=document.createElement("iframe"),C=new URL(window.location.href);C.searchParams.set("live-edit","off"),S.src=C.toString(),S.title="This page on a phone",c.append(S),l.shadow.append(c)}else!x&&c&&(c.remove(),c=null)},m=[["Desktop",!1],["Phone",!0]].map(([x,S])=>{let C=j("button","le-back-btn",x);return C.type="button",C.addEventListener("click",()=>{m.forEach(T=>T.classList.remove("is-on")),C.classList.add("is-on"),g(S)}),p.append(C),C});if(m[0].classList.add("is-on"),e.previewUrl){let x=j("button","le-back-btn","Copy a link to this");x.type="button",x.title="A link that shows this unpublished version to somebody else",x.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(e.previewUrl),l.toast("Link copied \u2713")}catch{window.prompt("Copy this link:",e.previewUrl)}}),p.append(x)}let w=j("button","le-back-btn","Back to editing");w.type="button",w.addEventListener("click",()=>{g(!1),p.remove(),document.removeEventListener("keydown",b,!0),l.toolbar.style.display="",Le(u)});let b=x=>{x.key==="Escape"&&w.click()};document.addEventListener("keydown",b,!0),p.append(w),l.shadow.append(p),w.focus()};l.previewButton.addEventListener("click",d)});let wo=()=>{let e=document.querySelectorAll('nav, [role="navigation"], header ul'),t=new Map,n=i=>i.closest("#wpadminbar, #adminmenu, #wp-toolbar, #live-edit-ui, [data-no-edit], [data-live-edit-chrome]")!==null;return e.forEach(i=>{n(i)||i.querySelectorAll("a[href]").forEach(d=>{if(n(d))return;let u;try{u=new URL(d.getAttribute("href"),window.location.href)}catch{return}if(u.origin!==window.location.origin||/\.(pdf|zip|jpe?g|png|gif|svg|webp|mp4|mp3)$/i.test(u.pathname)||u.pathname===window.location.pathname&&u.hash)return;let p=(d.textContent??"").replace(/\s+/g," ").trim();p===""||p.length>22||t.has(u.pathname)||t.set(u.pathname,{label:p,href:u.href})})}),[...t.values()].slice(0,6)};(()=>{let e=wo();if(e.length<2)return;let t=window.location.pathname.replace(/\/$/,"");e.forEach(n=>{let i=j("button","le-page-btn",n.label);i.type="button",i.title=n.href,new URL(n.href).pathname.replace(/\/$/,"")===t?i.classList.add("is-on"):i.addEventListener("click",()=>{sessionStorage.setItem("tb_editing","1"),window.location.href=n.href}),l.pageSwitcher.append(i)}),l.pageSwitcher.hidden=!1})();let Go=(async()=>{let e=l.languagePicker;if(!e)return;let t;try{t=await(await B("/live-edit/translations",{method:"GET"})).json()}catch{return}let n=t?.locales??[],i=t?.default_locale??"en";if(n.length<2)return;n.forEach(h=>{let m=j("option",null,t?.names?.[h]??h.toUpperCase());m.value=h,e.append(m)});let d=window.liveEditLocale??i;e.value=d,e.hidden=!1;let u=(h,m)=>{if(document.querySelectorAll("[data-live-edit-stale]").forEach(b=>b.removeAttribute("data-live-edit-stale")),m===i)return 0;let w=0;return(h??[]).filter(b=>b.locale===m&&b.current===!1).forEach(b=>{document.querySelectorAll(`[data-edit="setting:${CSS.escape(b.key)}"]`).forEach(x=>{x.setAttribute("data-live-edit-stale",""),w++})}),w},p=t?.stale??[];if(u(p,d),(t?.counts?.stale??0)>0&&d===i){let h=Object.keys(t?.needing_review??{}).length;y(h===1?`1 translation may need updating since the ${i.toUpperCase()} changed.`:`${h} languages have translations that may need updating.`)}let g=0;e.addEventListener("change",async()=>{let h=e.value,m=++g;e.disabled=!0;try{let w=await(await B(`/live-edit/content?locale=${encodeURIComponent(h)}`,{method:"GET"})).json();if(m!==g)return;window.liveEditLocale=h;let{applyContent:b}=await Promise.resolve().then(()=>(tt(),et));b(document,w?.settings??{});try{p=(await(await B("/live-edit/translations",{method:"GET"})).json())?.stale??p}catch{}let x=u(p,h);y(h===i?"Editing the original.":x>0?`Editing in ${e.options[e.selectedIndex]?.text??h}. ${x===1?"1 sentence on this page has":`${x} sentences on this page have`} fallen behind the original.`:`Editing in ${e.options[e.selectedIndex]?.text??h}. Saves here do not change the original.`)}catch{if(m!==g)return;e.value=window.liveEditLocale??i,y("Could not load that language. Nothing has been changed.")}finally{m===g&&(e.disabled=!1)}})})(),Wt=`live-edit:redo:${o?.site??window.location.host}`,ft=()=>{try{return JSON.parse(sessionStorage.getItem(Wt)??"[]")}catch{return[]}},Vt=e=>{try{sessionStorage.setItem(Wt,JSON.stringify(e.slice(-20)))}catch{}},Re=()=>{l.undoButton.disabled=(window.liveEditPublishing?.pending??0)===0,l.redoButton.disabled=ft().length===0};Ht(Re),Re();let Jt=async()=>{l.undoButton.disabled=!0;let e;try{e=((await(await B("/live-edit/changes",{method:"GET"})).json())?.changes??[])[0]}catch(n){l.toast(U(n,"undo that")),Re();return}if(!e){l.toast("There is nothing left to undo. Everything is published."),Re();return}let t=le(e);try{await B("/live-edit/changes",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:e.key,kind:e.kind})})}catch(n){l.toast(U(n,"undo that")),Re();return}Vt([...ft(),{key:e.key,kind:e.kind,value:e.after,label:t}]),O(`Undone: ${t}`)},Yt=async()=>{let e=ft(),t=e.pop();if(!t){l.toast("There is nothing to put back.");return}l.redoButton.disabled=!0;try{if(t.kind==="style")throw new Error("A styling change cannot be put back automatically yet.");await B("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:t.key,value:t.value,locale:window.liveEditLocale})})}catch(n){l.toast(U(n,"put that back")),l.redoButton.disabled=!1;return}Vt(e),O(`Put back: ${t.label}`)};l.undoButton.addEventListener("click",()=>void Jt()),l.redoButton.addEventListener("click",()=>void Yt()),document.addEventListener("keydown",e=>{!(e.metaKey||e.ctrlKey)||e.key.toLowerCase()!=="z"||(l.shadow.activeElement??document.activeElement)?.closest?.('input, textarea, [contenteditable="true"]')||(e.preventDefault(),e.shiftKey?Yt():Jt())}),l.closeButton.addEventListener("click",()=>Ce()),l.cancelButton.addEventListener("click",()=>Ce()),l.saveButton.addEventListener("click",Vn),M?.addEventListener("click",async()=>{!v||v.kind!=="record"||window.confirm("Delete this item?")&&(await B(`/live-edit/record/${v.type}/${v.id}`,{method:"DELETE"}),O("Deleted \u2713"))}),document.querySelectorAll("[data-live-create]").forEach(e=>{e.addEventListener("click",async()=>{await B("/live-edit/record/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:e.dataset.liveCreate})}),O("Added \u2713 \u2014 click it to edit")})});let bt=new URLSearchParams(window.location.search);if(bt.has("edit")){bt.delete("edit");let e=bt.toString();window.history.replaceState(null,"",window.location.pathname+(e?`?${e}`:"")),Le(!0)}else Le(sessionStorage.getItem("tb_editing")==="1")}};window.liveEditDisplayedValue=o=>xt({editValue:o.dataset.editValue,ownText:de(o),fullText:o.textContent});var Ot=(()=>{let o=!1;return()=>{o||new URLSearchParams(window.location.search).get("live-edit")!=="off"&&(o=!0,Jo())}})();document.readyState==="complete"?Ot():(window.addEventListener("load",Ot,{once:!0}),window.setTimeout(Ot,2e3));
