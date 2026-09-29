var bo=Object.defineProperty;var Ie=(o,a)=>()=>(o&&(a=o(o=0)),a);var ht=(o,a)=>{for(var r in a)bo(o,r,{get:a[r],enumerable:!0})};var Kt,Xt,Qt,Eo,Zt,en,bt,se,tn,nn,on,Ge,So,Ke,mt=Ie(()=>{Kt=o=>{let[a,...r]=String(o??"").split(":");return{kind:a,key:r.join(":"),parts:r}},Xt=(o,a={})=>({...a,headers:{"X-CSRF-TOKEN":o,Accept:"application/json",...a.headers??{}}}),Qt=o=>(o?.headers?.get?.("content-type")??"").includes("json"),Eo=/\.((?:fa|fas|far|fab|fal|fad|bi|ti|icon|flaticon|glyphicon|ion|mdi)-[a-z0-9][a-z0-9-]*)::?before/gi,Zt=o=>{let a=[];for(let r of String(o??"").split("}")){let s=r.indexOf("{");if(s===-1)continue;let f=r.slice(s+1).match(/content\s*:\s*(["'])(.*?)\1/);if(!f)continue;let d=f[2].match(/^\\([0-9a-f]{1,6})\s*$/i),m=d?String.fromCodePoint(parseInt(d[1],16)):f[2];if([...m].length===1)for(let k of r.slice(0,s).matchAll(Eo))a.push({name:k[1],glyph:m})}return a},en=(o,a,r,s,f)=>{let d=o.filter(m=>m!==r&&!s.includes(m));return f.forEach(m=>d.includes(m)||d.push(m)),d.push(a),d.join(" ")},bt=({editValue:o,ownText:a,fullText:r})=>(o??"")!==""?o:(a??"").trim()!==""?a:r??"",se=o=>o.children.length?[...o.childNodes].filter(a=>a.nodeType===3).map(a=>a.textContent).join(""):o.textContent,tn=o=>{let a=new Set,r=[];for(let s of o)for(let f of s.icons)a.has(f.name)||(a.add(f.name),r.push({...f,face:s.face,variant:s.variant}));return r.sort((s,f)=>s.name.localeCompare(f.name))},nn=(o,a)=>{let r=Object.keys(a??{}),s=String(o??"").split(",").map(f=>f.trim()).filter(Boolean);return s.length===0?r:r.length===0?s:s.filter(f=>r.includes(f))},on=(o,a={},r)=>{let s=String(r?.base??"").replace(/\/$/,""),[f,d]=String(o).split("?"),m={"/live-edit/setting":`${s}/${r?.site}/content`,"/live-edit/style":`${s}/${r?.site}/styles`,"/live-edit/publish":`${s}/${r?.site}/publish`,"/live-edit/image":`${s}/${r?.site}/media`,"/live-edit/upload":`${s}/${r?.site}/media`,"/live-edit/changes":`${s}/${r?.site}/changes`,"/live-edit/versions":`${s}/${r?.site}/versions`,"/live-edit/content":`${s}/${r?.site}/content`,"/live-edit/credits":`${s}/${r?.site}/credits`,"/live-edit/assist":`${s}/${r?.site}/assist`,"/live-edit/photos":`${s}/${r?.site}/photos`,"/live-edit/photos/used":`${s}/${r?.site}/photos/used`,"/live-edit/imagine":`${s}/${r?.site}/imagine`},k=r?.routes?.[f]??(f==="/live-edit/publish"?r?.publishUrl:null);if(k)return{url:d?`${k}?${d}`:k,init:{...a,headers:{...a.headers??{},...r.routeHeaders??r.publishHeaders??{},Accept:"application/json"},credentials:"same-origin"}};let L=m[f];if(!s||!r?.site||!r?.token)throw new Error("The content API is not configured on this page.");if(!L)throw new Error(`Editing that is not available over the content API yet (${f}).`);return{url:d?`${L}?${d}`:L,init:{...a,headers:{...a.headers??{},Authorization:`Bearer ${r.token}`,Accept:"application/json"}}}},Ge=(o,a,r)=>o.hasAttribute(a)?o.getAttribute(a):o.dataset?.[r]??"",So=(o,a)=>a==null?!0:a===408||a===425||a===429||a>=500,Ke=async(o,{tries:a=3,waits:r=[200,500],sleep:s=null}={})=>{let f=s??(m=>new Promise(k=>setTimeout(k,m))),d=null;for(let m=0;m<a;m++)try{return await o()}catch(k){if(d=k,m===a-1||!So(k,k.status))throw k;await f(r[Math.min(m,r.length-1)])}throw d}});var vt={};ht(vt,{applyTags:()=>yt,autoTag:()=>Xe,elementAt:()=>rn,ensureBackgroundsAreFound:()=>To,fingerprint:()=>an,refreshBackgrounds:()=>No,resolveBackgrounds:()=>wt,watchForLateBackgrounds:()=>dn});var Co,an,rn,yt,Lo,Ao,sn,ln,wt,To,No,dn,Xe,xt=Ie(()=>{Co="kb_tags_",an=o=>{let a=2166136261;for(let r=0;r<o.length;r++)a^=o.charCodeAt(r),a=Math.imul(a,16777619);return(a>>>0).toString(16)},rn=(o,a)=>{let r=o.documentElement;for(let s of a)if(r=[...r?.children??[]][s],!r)return null;return r},yt=(o,a)=>{let r=0;for(let{at:s,attributes:f}of a??[]){let d=rn(o,s);if(d){for(let[m,k]of Object.entries(f))d.hasAttribute(m)||d.setAttribute(m,k);r++}}return r},Lo=o=>{try{return JSON.parse(window.sessionStorage?.getItem(o)??"null")}catch{return null}},Ao=(o,a)=>{try{window.sessionStorage?.setItem(o,JSON.stringify(a))}catch{}},sn=o=>o.hasAttribute("data-kb-bg")||o.hasAttribute("data-background")||o.hasAttribute("data-bg")||o.hasAttribute("data-background-image")||/background-image|url\(/i.test(o.getAttribute("style")??""),ln=(o,a)=>{if(sn(o))return!1;let r=a.getComputedStyle(o).backgroundImage;if(!r||r==="none"||!r.includes("url("))return!1;let s=r.match(/url\(\s*["']?([^"')]+)/)?.[1];return!s||s.startsWith("data:")?!1:(o.setAttribute("data-kb-bg",s),!0)},wt=(o=document)=>{let a=o.defaultView??window;if(!a?.getComputedStyle)return 0;let r=0;for(let s of o.querySelectorAll("body *"))ln(s,a)&&r++;return r},To=async(o,a=document)=>{let r=a.defaultView??window;if(r.liveEditBackgroundsWatched)return 0;r.liveEditBackgroundsWatched=!0;let s=await Xe(o,a);return dn(a,()=>{Xe(o,a).catch(f=>{console.warn("[live-edit] could not tag a late background:",f.message)})}),s},No=async(o,a=document)=>wt(a)===0&&a.querySelector("[data-kb-bg]:not([data-edit-bg])")===null?0:Xe(o,a),dn=(o=document,a=()=>{})=>{let r=o.defaultView??window;if(!r?.IntersectionObserver||!r.getComputedStyle)return null;let s=new Set,f=null,d=()=>{if(f=null,s.size===0)return;let N=[...s];s.clear(),a(N)},m=5,k=new WeakMap,L=N=>{if(ln(N,r))return s.add(N),O.unobserve(N),f||(f=r.setTimeout(d,250)),!0;let X=(k.get(N)??0)+1;return k.set(N,X),X>=m&&O.unobserve(N),!1},O=new r.IntersectionObserver(N=>{for(let X of N){if(!X.isIntersecting)continue;let U=X.target;L(U)||r.setTimeout(()=>L(U),400)}},{rootMargin:"300px"}),j=[...o.querySelectorAll("body *")].filter(N=>!sn(N)),$=4e3;return j.length>$&&console.warn(`[live-edit] watching the first ${$} of ${j.length} elements for late backgrounds`),j.slice(0,$).forEach(N=>O.observe(N)),O},Xe=async({base:o,site:a,key:r,page:s},f=document)=>{let d=f.querySelector("[data-edit], [data-edit-img]")!==null;if(wt(f),d&&!(f.querySelector("[data-kb-bg]:not([data-edit-bg])")!==null))return 0;let k=f.documentElement.outerHTML,L=Co+an(k),O=Lo(L);if(O)return yt(f,O);let j=await fetch(`${String(o).replace(/\/$/,"")}/${a}/tag`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json",Authorization:`Bearer ${r}`},body:JSON.stringify({html:k,page:s??f.location?.pathname??""})});if(!j.ok)throw new Error(`Tagging answered ${j.status}`);let{elements:$}=await j.json();return Ao(L,$),yt(f,$)}});var $o,Oo,Po,cn,pn,un=Ie(()=>{$o=new Set(["svg","g","defs","symbol","use","title","desc","path","circle","ellipse","line","polygon","polyline","rect","text","tspan","textpath","lineargradient","radialgradient","stop","clippath","mask","pattern"]),Oo=new Set(["viewbox","xmlns","width","height","fill","fill-rule","fill-opacity","stroke","stroke-width","stroke-linecap","stroke-linejoin","stroke-dasharray","stroke-dashoffset","stroke-opacity","stroke-miterlimit","opacity","d","points","x","y","x1","y1","x2","y2","cx","cy","r","rx","ry","transform","offset","stop-color","stop-opacity","gradientunits","gradienttransform","patternunits","clip-rule","clip-path","mask","id","class","role","aria-label","aria-hidden","focusable","preserveaspectratio","vector-effect","text-anchor","font-size","font-family"]),Po=8,cn=o=>{let a=String(o??"").trim();if(a===""||!/<svg/i.test(a))return null;let r=new DOMParser().parseFromString(a,"image/svg+xml"),s=r.documentElement;return!s||s.tagName?.toLowerCase()!=="svg"||r.querySelector("parsererror")||(pn(s),s.children.length===0&&s.textContent.trim()==="")?null:s},pn=o=>{for(let a of[...o.childNodes]){if(a.nodeType===Po){a.remove();continue}if(a.nodeType===1){if(!$o.has(a.tagName.toLowerCase())){a.remove();continue}pn(a)}}for(let a of[...o.attributes]){let r=a.name.toLowerCase(),s=a.value,d=r==="href"||r==="xlink:href"?s.trim().startsWith("#"):Oo.has(r);d&&/url\(/i.test(s)&&!/^url\(\s*#/i.test(s.trim())&&(d=!1),d||o.removeAttribute(a.name)}}});var Ct={};ht(Ct,{applyBackground:()=>yn,applyContent:()=>vn,applyIcon:()=>mn,applyOrder:()=>wn,applyStyles:()=>En,applySvg:()=>bn,applyValue:()=>Et,defendContent:()=>xn,fetchContent:()=>Cn,fetchSnapshot:()=>Sn,resolve:()=>Ln,styleRules:()=>kn});var kt,hn,Et,St,Bo,Io,jo,fn,zo,bn,mn,yn,wn,vn,xn,kn,En,Sn,Cn,gn,Fo,Ln,Lt=Ie(()=>{un();mt();kt=(o,a)=>Object.assign(new Error(o),{status:a}),hn="setting:",Et=(o,a,{keepRuns:r=!1}={})=>{let s=o.tagName?.toLowerCase();if(s==="img"){o.setAttribute("src",a);return}if(s==="source"){o.setAttribute("srcset",a);return}St(o,a,r)},St=(o,a,r=!1)=>{let s=[...o.childNodes].filter(z=>z.nodeType===zo);if(s.length===0){let z=[...o.children];if(z.length===1&&z[0].children.length===0){St(z[0],a);return}o.append(a);return}if(s.length===1){fn(s[0],a);return}let f=s.map(z=>z.nodeValue),d=f.join(""),m=0;for(;m<d.length&&m<a.length&&d[m]===a[m];)m+=1;let k=0;for(;k<d.length-m&&k<a.length-m&&d[d.length-1-k]===a[a.length-1-k];)k+=1;let L=m,O=d.length-k,j=a.slice(m,a.length-k),$=0,N=!1,X=f.map(z=>{let E=$,q=$+z.length;return $=q,N||L<E||O>q?z:(N=!0,z.slice(0,L-E)+j+z.slice(O-E))});if(N){s.forEach((z,E)=>{z.nodeValue=X[E]});return}let U=jo(f,a);if(U!==null){s.forEach((z,E)=>{z.nodeValue=U[E]});return}fn(s[0],a),s.slice(1).forEach(z=>{if(r){z.nodeValue="";return}z.remove()})},Bo=(o,a)=>{let r=o.length,s=a.length,f=s+1,d=new Int32Array((r+1)*f);for(let k=r-1;k>=0;k-=1)for(let L=s-1;L>=0;L-=1)d[k*f+L]=o[k]===a[L]?d[(k+1)*f+L+1]+1:Math.max(d[(k+1)*f+L],d[k*f+L+1]);let m=[];for(let k=0,L=0;k<r&&L<s;)o[k]===a[L]?(m.push([k,L]),k+=1,L+=1):d[(k+1)*f+L]>=d[k*f+L+1]?k+=1:L+=1;return m},Io=(o,a)=>{let r=new Map(o.map(([f,d])=>[f,d])),s=f=>{let d=0;for(let m=f<0?a-1:a;r.has(m);m+=f){let k=r.get(m+f);if(d+=1,k===void 0||Math.abs(k-r.get(m))!==1)break}return d};return Math.max(s(-1),s(1))},jo=(o,a)=>{let r=o.join("");if(r.length===0||a.length===0||r.length*a.length>25e4)return null;let s=Bo(r,a),f=new Map(s.map(([L,O])=>[L,O])),d=[],m=0,k=0;for(let L of o.slice(0,-1)){if(k+=L.length,Io(s,k)<3)return null;let O=m;for(let j=k-1;j>=0;j-=1)if(f.has(j)){O=Math.max(m,f.get(j)+1);break}d.push(a.slice(m,O)),m=O}return d.push(a.slice(m)),d},fn=(o,a)=>{let r=o.nodeValue,s=/^\s/.test(r)&&!/^\s/.test(a)?" ":"",f=/\s$/.test(r)&&!/\s$/.test(a)?" ":"";o.nodeValue=s+a+f},zo=3,bn=(o,a)=>{let r=cn(a);if(!r)return!1;let s=document.importNode(r,!0);for(let f of["class","width","height","style","data-edit-svg","data-edit-label"])o.hasAttribute(f)&&s.setAttribute(f,o.getAttribute(f));return o.replaceWith(s),!0},mn=(o,a)=>{let r=String(a).replace(/[^A-Za-z0-9_\- ]/g,"").split(/\s+/).filter(Boolean),s=o.getAttribute("data-edit-icon-current");if(r.length===0||!s)return!1;let f=r.length===1?(o.getAttribute("class")??"").trim().split(/\s+/).map(d=>d===s?r[0]:d):r;return o.setAttribute("class",f.join(" ")),o.setAttribute("data-edit-icon-current",r.length===1?r[0]:r[r.length-1]),!0},yn=(o,a)=>{for(let s of["data-background","data-bg","data-background-image"])o.hasAttribute(s)&&o.setAttribute(s,a);let r=(o.getAttribute("style")??"").replace(/background-image\s*:[^;]*;?/gi,"").trim();o.setAttribute("style",`${r?r.replace(/;?$/,";"):""}background-image:url('${a}')`)},wn=(o,a)=>{let r=0;for(let s of o.querySelectorAll("[data-edit-list]")){let f=s.getAttribute("data-edit-list");if(!Object.hasOwn(a,f))continue;let d;try{d=JSON.parse(a[f])}catch{continue}if(!Array.isArray(d)||d.length===0)continue;let m=new Map;for(let L of[...s.children])L.hasAttribute("data-edit-item")&&(m.set(L.getAttribute("data-edit-item"),L),s.removeChild(L));if(m.size===0)continue;let k=m.values().next().value;for(let L of d){let O=m.get(String(L));if(O){s.appendChild(O);continue}let j=k.cloneNode(!0);j.setAttribute("data-edit-item",String(L)),s.appendChild(j)}r++}return r},vn=(o,a)=>{let r=0;wn(o,a);for(let s of o.querySelectorAll("[data-edit]")){let f=s.getAttribute("data-edit")??"";if(!f.startsWith(hn))continue;let d=f.slice(hn.length);Object.hasOwn(a,d)&&(Et(s,a[d]),r++)}for(let s of o.querySelectorAll("[data-edit-img]")){let f=(s.getAttribute("data-edit-img")??"").replace(/^setting:/,"");Object.hasOwn(a,f)&&(Et(s,a[f]),r++);for(let[d,m]of[["Alt","alt"],["Title","title"]])if(Object.hasOwn(a,f+d)){let k=a[f+d];k===""&&m==="title"?s.removeAttribute("title"):s.setAttribute(m,k),r++}}for(let s of o.querySelectorAll("[data-edit-svg]")){let f=(s.getAttribute("data-edit-svg")??"").replace(/^setting:/,""),d=a[f];!Object.hasOwn(a,f)||String(d??"").trim()===""||bn(s,d)&&r++}for(let s of o.querySelectorAll("[data-edit-icon]")){let f=(s.getAttribute("data-edit-icon")??"").replace(/^setting:/,""),d=a[f];!Object.hasOwn(a,f)||d===""||mn(s,d)&&r++}for(let s of o.querySelectorAll("[data-edit-bg]")){let f=(s.getAttribute("data-edit-bg")??"").replace(/^setting:/,""),d=a[f];!Object.hasOwn(a,f)||d===""||(yn(s,d),r++)}for(let s of o.querySelectorAll("[data-edit-href]")){let f=s.getAttribute("data-edit-href");Object.hasOwn(a,f)&&(s.setAttribute("href",a[f]),r++)}return r},xn=(o,{limit:a=12,debounce:r=60}={})=>{let s=o.defaultView??(typeof window>"u"?null:window);if(!s?.MutationObserver)return null;let f=o.querySelectorAll("[data-edit], [data-edit-img], [data-edit-href]");if(f.length===0)return null;let d=new Map;for(let $ of f)d.set($,{words:$.hasAttribute("data-edit")?se($):null,src:$.getAttribute("src"),href:$.hasAttribute("data-edit-href")?$.getAttribute("href"):null});let m=0,k=!1,L=null,O=()=>{if(L=null,!o.body?.classList?.contains("editing")){m++,k=!0;for(let[$,N]of d)$.isConnected&&(N.words!==null&&se($)!==N.words&&St($,N.words),N.src!==null&&$.getAttribute("src")!==N.src&&($.setAttribute("src",N.src),$.removeAttribute("srcset")),N.href!==null&&$.getAttribute("href")!==N.href&&$.setAttribute("href",N.href));j.takeRecords(),k=!1,m>=a&&(j.disconnect(),console.warn(`[live-edit] this page keeps rewriting itself; the client's content was put back ${m} times and is now being left alone.`))}},j=new s.MutationObserver(()=>{k||L||m>=a||(L=s.setTimeout(O,r))});for(let $ of f)j.observe($,{characterData:!0,childList:!0,subtree:!0,attributes:!0,attributeFilter:["src","srcset","href"]});return j},kn=(o,a)=>{let r=`[data-style="${o}"]`,s="",f="";for(let[d,m]of Object.entries(a??{}))if(!(m===""||m===null||m===void 0)){if(d==="hidden"){s+=`body:not(.editing) ${r}{display:none !important}`,s+=`body.editing ${r}{opacity:.45}`;continue}f+={backgroundImage:`background-image:url('${m}') !important;background-size:cover !important;background-position:center !important;`,background:`background:${m} !important;`,textColor:`color:${m} !important;`,fontSize:`font-size:${m}px !important;`,radius:`border-radius:${m}px !important;`,paddingX:`padding-left:${m}px !important;padding-right:${m}px !important;`,paddingY:`padding-top:${m}px !important;padding-bottom:${m}px !important;`}[d]??""}return f===""?s:s+`${r}{${f}}`},En=(o,a)=>{let r=Object.entries(a??{}).map(([m,k])=>kn(m,k)).join("");if(r==="")return 0;let s="live-edit-styles",f=o.getElementById?.(s)??o.querySelector?.(`#${s}`)??null,d=f??o.createElement("style");return d.id=s,d.textContent=r,f||(o.head??o.body)?.appendChild(d),Object.keys(a).length},Sn=async({snapshot:o,locale:a})=>{let r=String(o).replace(/\/$/,""),s=await Ke(()=>fetch(`${r}/current.json`).then(d=>{if(!d.ok)throw kt(`Pointer answered ${d.status}`,d.status);return d.json()}));if(!s.version)return{settings:{},styles:{}};let f=a??"en";return Ke(async()=>{let d=await fetch(`${r}/v${s.version}/${f}.json`);if(!d.ok)throw kt(`Version answered ${d.status}`,d.status);return d.json()})},Cn=async({base:o,site:a,key:r,locale:s})=>{let f=`${String(o).replace(/\/$/,"")}/${a}/content${s?`?locale=${encodeURIComponent(s)}`:""}`;return Ke(async()=>{let d=await fetch(f,{headers:{Authorization:`Bearer ${r}`,Accept:"application/json"}});if(!d.ok)throw kt(`Content service answered ${d.status}`,d.status);return d.json()})},gn=async()=>{let o=typeof window<"u"?window.liveEditContent:null;if(!o)return;let a=null,r=null;try{let s=await Ln(o);s&&(s.styleProps&&(window.liveEditStyleProps=s.styleProps),typeof s.pending=="number"&&s.styleProps&&(window.liveEditPublishing={...window.liveEditPublishing??{},pending:s.pending}),a=vn(document,s.settings??{}),En(document,s.styles??{}),window.liveEditStyles=s.styles??{},xn(document))}catch(s){r=s,console.warn("[live-edit] serving the words already in the page:",s.message)}Fo({applied:a,failed:r?r.message:null})},Fo=o=>{window.liveEditContentDone=o,document.dispatchEvent(new CustomEvent("live-edit:content",{detail:o}))},Ln=async o=>{if(o.snapshot)try{return await Sn(o)}catch(a){let r=a.message.includes("fetch")?" (if the files are on another origin, the bucket or CDN must allow cross-origin reads)":"";if(!o.base)throw new Error(a.message+r);console.warn("[live-edit] falling back to the content API:",a.message+r)}return o.base&&o.site&&o.key?Cn(o):null};typeof document<"u"&&(document.readyState==="loading"?document.addEventListener("DOMContentLoaded",gn):gn())});var On={};ht(On,{collectFromFragment:()=>Tn,contentConfigFor:()=>Mo,currentSession:()=>qo,forget:()=>Ro,requestLink:()=>Do,store:()=>Nn,stored:()=>$n});var At,An,Tn,Nn,$n,Ro,Do,qo,Mo,Pn=Ie(()=>{At="kb_session",An="kb_session=",Tn=(o=window)=>{let a=o.location?.hash??"",r=a.indexOf(An);if(r===-1)return null;let s=decodeURIComponent(a.slice(r+An.length).split("&")[0]);if(s==="")return null;Nn(s,o);let f=a.slice(0,r).replace(/[#&]$/,"");return o.history?.replaceState?.(null,"",o.location.pathname+o.location.search+f),s},Nn=(o,a=window)=>{try{a.sessionStorage?.setItem(At,o)}catch{}},$n=(o=window)=>{try{return o.sessionStorage?.getItem(At)??null}catch{return null}},Ro=(o=window)=>{try{o.sessionStorage?.removeItem(At)}catch{}},Do=async({base:o,site:a},r,s=window)=>(await fetch(`${String(o).replace(/\/$/,"")}/sign-in`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({site:a,email:r,return_to:s.location.origin+s.location.pathname})})).ok,qo=(o=window)=>Tn(o)??$n(o),Mo=(o,a)=>{let r={base:o.api,site:o.site,locale:o.locale??null};return a?{...r,key:a,snapshot:null}:{...r,key:o.key,snapshot:o.snapshot??null}}});var mo=`
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
`,yo=`
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
`,A=(o,a,r)=>{let s=document.createElement(o);return a&&(s.className=a),r!==void 0&&(s.textContent=r),s};function Vt(){let o=document.createElement("style");o.id="live-edit-page-css",o.textContent=yo,document.head.append(o);let a=document.createElement("div");a.id="live-edit-ui",document.body.append(a);let r=a.attachShadow({mode:"open"}),s=document.createElement("style");s.textContent=mo,r.append(s);let f=window.liveEditToolbar??{},d=A("div","le-toolbar"),m=window.liveEditEditor?.console??null,k=A(m?"a":"span","le-mark");k.innerHTML='<svg width="16" height="16" viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="3" width="20" height="20" rx="3" fill="none" stroke="#0B0C0F" stroke-width="2.5"/><path d="M16 15 L16 30 L19.6 26.4 L22.2 31.2 L24.6 30 L22 25.3 L27 25.3 Z" fill="#3148F5" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>',m&&(k.href=m,k.target="_blank",k.rel="noopener",k.title="Your dashboard: licence, editors, settings",k.setAttribute("aria-label","Open your dashboard"));let L=A("span","le-status le-when-roomy"),O=A("span","le-dot"),j=A("span",null,"");L.append(O,j),d.append(k,L);let $=window.liveEditEditor??null;if($?.greeting){let P=A("span","le-hello le-when-roomy","Welcome "+$.greeting);d.append(P)}let N=null,X=f.locales??{};Object.keys(X).length>1&&(N=A("select","le-locale"),N.title="Language you are editing",Object.entries(X).forEach(([P,R])=>{let V=A("option",null,R);V.value=P,V.selected=P===(f.locale??"en"),N.append(V)}),N.addEventListener("change",()=>{window.location.search="?locale="+N.value}),d.append(N));let U=A("button","le-bar-btn","Edit site");U.type="button";let z=P=>'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"'+(P?' style="transform: scaleX(-1)"':"")+'><path d="M9 14 4 9l5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 9h7a6 6 0 0 1 0 12H8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',E=A("button","le-round");E.type="button",E.title="Undo the last change you have not published",E.setAttribute("aria-label","Undo"),E.innerHTML=z(!1);let q=A("button","le-round");q.type="button",q.title="Put back what you just undid",q.setAttribute("aria-label","Redo"),q.innerHTML=z(!0);let ne=A("div","le-pages");ne.hidden=!0,ne.setAttribute("role","group"),ne.setAttribute("aria-label","Pages");let le=A("button","le-bar-btn le-when-roomy","Changes");le.type="button",le.title="Everything you have changed and not published";let J=A("button","le-bar-btn le-when-roomy","Preview");J.type="button",J.title="See the page the way a visitor will",J.hidden=!0;let Q=A("button","le-publish");Q.type="button",Q.title="Put your changes live",Q.hidden=!0;let v=A("span",null,"Publish"),de=A("span","le-publish-count");if(de.hidden=!0,Q.append(v,de),d.append(A("span","le-sep"),U,E,q,A("span","le-sep"),ne,le,J,Q),(f.links??[]).forEach(P=>{let R=A("a","le-btn-ghost",P.label);R.href=P.href,P.title&&(R.title=P.title),d.append(R)}),f.logout?.href)if((f.logout.method??"get").toLowerCase()==="post"){let P=document.createElement("form");P.method="POST",P.action=f.logout.href;let R=document.createElement("input");R.type="hidden",R.name="_token",R.value=document.body.dataset.csrf??"";let V=A("button","le-btn-ghost","Log out");V.type="submit",P.append(R,V),d.append(P)}else{let P=A("a","le-btn-ghost","Log out");P.href=f.logout.href,d.append(P)}let Y=A("div","le-drawer");Y.setAttribute("role","dialog"),Y.setAttribute("aria-modal","true"),Y.setAttribute("aria-label","Edit content");let je=A("div","le-drawer-head"),ce=A("div","le-tabs");ce.setAttribute("role","tablist");let ze={};["Edit","Changes","History"].forEach(P=>{let R=A("button","le-tab",P);R.type="button",R.dataset.tab=P,R.setAttribute("role","tab"),P==="Edit"&&R.classList.add("is-on"),ze[P]=R,ce.append(R)});let ge=A("button","le-close","\xD7");ge.type="button",ge.setAttribute("aria-label","Close"),je.append(ce,ge);let Le=A("div","le-subject"),Fe=A("div","le-trail"),Re=A("div","le-title","Text");Le.append(A("div","le-eyebrow","Selected"),Fe,Re);let De=A("div","le-fields"),pe=A("div","le-foot"),Ae=A("button","le-btn-danger le-start le-hidden","Delete");Ae.type="button";let be=A("button","le-btn-outline","Cancel");be.type="button";let me=A("button","le-btn","Save changes");me.type="button",pe.append(Ae,be,me),Y.append(je,Le,De,pe);let oe=A("button","le-handle");oe.type="button",oe.setAttribute("aria-label","Edit this link"),oe.innerHTML="&#9998;";let ee=A("button","le-handle le-handle-bg");ee.type="button",ee.setAttribute("aria-label","Replace this background image"),ee.title="Replace background image",ee.textContent="Replace background";let ye=A("div","le-hover"),we=A("span","le-hover-label");return ye.append(we),r.append(d,Y,oe,ee,ye),{root:a,shadow:r,toolbar:d,toggleButton:U,undoButton:E,redoButton:q,pageSwitcher:ne,statusText:j,dot:O,localeSelect:N,drawer:Y,drawerFoot:pe,drawerTabs:ze,drawerSubject:Le,drawerTitle:Re,drawerTrail:Fe,drawerFields:De,drawerDelete:Ae,publishButton:Q,publishLabel:v,publishCount:de,previewButton:J,changesButton:le,closeButton:ge,cancelButton:be,saveButton:me,linkHandle:oe,bgHandle:ee,hoverBox:ye,hoverLabel:we,toast:(P,R=1800)=>{let V=A("div","le-toast",P);r.append(V),setTimeout(()=>V.style.opacity="0",R),setTimeout(()=>V.remove(),R+600)},modal:({title:P,subtitle:R,size:V="",dismissable:Te=!0}={})=>{let M=A("div","le-scrim"),H=A("div",`le-modal ${V}`.trim());H.setAttribute("role","dialog"),H.setAttribute("aria-modal","true");let qe=A("div","le-modal-heading"),Me=A("div","le-modal-title",P??""),ve=A("div","le-modal-sub",R??"");ve.hidden=!R,qe.append(Me,ve),H.setAttribute("aria-label",P??"Dialog");let ae=A("button","le-close","\xD7");ae.type="button",ae.setAttribute("aria-label","Close");let _e=A("div","le-modal-head");_e.append(qe,ae);let Ne=A("div","le-modal-tabs");Ne.hidden=!0;let Ue=A("div","le-modal-body"),$e=A("div","le-modal-foot");$e.hidden=!0,H.append(_e,Ne,Ue,$e),M.append(H);let Oe=document.activeElement,He=!1,xe=()=>{He||(He=!0,document.removeEventListener("keydown",ke,!0),M.remove(),Oe?.focus?.(),re.dismissable=!0)},ke=G=>{G.key==="Escape"&&re.dismissable&&(G.stopPropagation(),xe())},re={dismissable:Te};return ae.addEventListener("click",xe),M.addEventListener("mousedown",G=>{G.target===M&&re.dismissable&&xe()}),document.addEventListener("keydown",ke,!0),r.append(M),ae.focus(),{card:H,body:Ue,foot:$e,tabs:Ne,close:xe,title:G=>Me.textContent=G,subtitle:G=>{ve.textContent=G??"",ve.hidden=!G},allowDismiss:G=>{re.dismissable=G,ae.hidden=!G}}}}}var gt="kb_verify",Jt=(o,a=globalThis)=>{try{a.sessionStorage?.setItem(gt,JSON.stringify(o))}catch{}},Yt=(o=globalThis)=>{try{let a=o.sessionStorage?.getItem(gt);return o.sessionStorage?.removeItem(gt),a?JSON.parse(a):null}catch{return null}},wo=(o,a)=>!a?.attr||!a?.marker?null:o.querySelector(`[${a.attr}="${a.marker.replace(/"/g,'\\"')}"]`),vo=(o,a)=>{if(!o)return null;if(a==="image"){let s=xo(o);return s?s.getAttribute("src"):null}if(a==="href")return o.getAttribute("href");if(a==="icon")return o.getAttribute("class")??"";let r=[...o.childNodes].filter(s=>s.nodeType===3).map(s=>s.textContent).join(" ").trim();return te(r===""?o.textContent:r)},xo=o=>o.tagName?.toLowerCase()==="img"?o:o.querySelector("img")??o.parentElement?.querySelector("img")??null,te=o=>String(o??"").replace(/\s+/g," ").trim(),ko=(o,a,r)=>{if(r===null)return!1;if(o==="image")return ft(r)!==""&&ft(r)===ft(a);if(o==="icon"){let s=te(a).split(" ").filter(Boolean),f=te(r).split(" ").filter(Boolean);return s.length>0&&s.every(d=>f.includes(d))}return o==="href"?te(r)===te(a)||te(r).endsWith(te(a)):te(r)===te(a)},ft=o=>String(o??"").split(/[?#]/)[0].split("/").filter(Boolean).pop()??"",Gt=(o,a)=>{if(!a?.kind)return null;let r=wo(o,a);if(!r)return null;let s=vo(r,a.kind);return{ok:ko(a.kind,a.value,s),wanted:a.value,saw:s,kind:a.kind}};mt();var _o=()=>{let o=window.liveEditApi;o?.base&&o?.site&&Promise.resolve().then(()=>(xt(),vt)).then(r=>r.ensureBackgroundsAreFound({base:o.base,site:o.site,key:o.token})).catch(r=>console.warn("[live-edit] could not look for backgrounds:",r.message)),window.liveEditContent||Promise.resolve().then(()=>(Lt(),Ct)).then(r=>r.defendContent(document)).catch(r=>console.warn("[live-edit] could not guard this page's content:",r.message));let a=document.querySelector("[data-login-modal]");if(a){let r=()=>{a.classList.remove("hidden"),a.classList.add("flex"),a.querySelector("input[type=email]")?.focus()},s=()=>{a.classList.add("hidden"),a.classList.remove("flex")};document.querySelectorAll("[data-login-open]").forEach(f=>{f.addEventListener("click",d=>{d.preventDefault(),r()})}),a.querySelector("[data-login-close]")?.addEventListener("click",s),a.addEventListener("click",f=>{f.target===a&&s()}),a.dataset.error==="1"&&r()}if(document.body.hasAttribute("data-admin")){let r=document.body.dataset.csrf,s=()=>{sessionStorage.setItem("tb_scroll",String(window.scrollY)),window.location.reload()},f=sessionStorage.getItem("tb_scroll");f!==null&&(sessionStorage.removeItem("tb_scroll"),window.scrollTo(0,Number(f)));let d=Vt(),m=e=>d.toast(String(e??"").trim()||"Something went wrong.",9e3),k=sessionStorage.getItem("tb_toast");k&&(sessionStorage.removeItem("tb_toast"),d.toast(k));let L=()=>new Promise(e=>{if(!window.liveEditContent||window.liveEditContentDone){e(window.liveEditContentDone??null);return}let t=n=>e(n?.detail??null);document.addEventListener("live-edit:content",t,{once:!0}),setTimeout(()=>e(null),5e3)});L().then(e=>{let t=Yt();if(e?.failed){d.toast(t?"Saved \u2014 but this page could not load the latest content, so it may be showing an older version. Reload to try again.":"This page could not load your saved content, so it is showing the original. Nothing has been lost \u2014 reload to try again.",9e3);return}let n=t?Gt(document,t):null;n&&!n.ok&&(console.warn("[live-edit] the change was saved but the page still shows:",n.saw,`
  expected:`,n.wanted),d.toast("Saved \u2014 but this page is still showing the old version. Your change is stored; reload, and tell us if it stays this way.",9e3))});let O=e=>{sessionStorage.setItem("tb_toast",e),s()},j=(e,t=null,n=null)=>{let i=window.__liveEditReact;if(!i){O(e);return}let c=t!==null&&(i.apply??i.set)(t,n);d.toast(e),c||i.refresh()},{drawer:$,drawerTabs:N,drawerSubject:X,drawerTitle:U,drawerTrail:z,drawerFields:E,drawerDelete:q,toggleButton:ne,statusText:le,linkHandle:J,bgHandle:Q}=d,v=null,de=(e,t,n,i,c=!1)=>{let u=document.createElement("label");u.className="le-field",u.append(t);let p=e==="icon"?window.liveEditIcons:(window.liveEditSelects??{})[e],l=document.querySelector("[data-icon-templates]");if(e==="icon"&&Array.isArray(p)&&l){let g=document.createElement("input");g.type="hidden",g.name=e,g.value=n??"";let w=document.createElement("div");return w.className="le-icons",p.forEach(y=>{let b=document.createElement("button");b.type="button",b.title=y,b.dataset.iconChoice=y,b.className="le-icon"+(y===g.value?" is-active":"");let x=l.querySelector(`template[data-icon="${y}"]`);x?b.append(x.content.cloneNode(!0)):b.textContent=y,b.addEventListener("click",()=>{g.value=y,w.querySelectorAll("[data-icon-choice]").forEach(S=>{let T=S.dataset.iconChoice===y;S.className="le-icon"+(T?" is-active":"")}),g.dispatchEvent(new Event("input",{bubbles:!0}))}),w.append(b)}),u.append(g,w),u}if(Array.isArray(p)&&p.length<=6){let g=document.createElement("input");g.type="hidden",g.name=e,g.value=n??p[0];let w=document.createElement("div");return w.className="le-choices",p.forEach(y=>{let b=document.createElement("label");b.className="le-choice"+(y===g.value?" is-selected":"");let x=document.createElement("input");x.type="radio",x.name="le-choice-"+e,x.checked=y===g.value,x.addEventListener("change",()=>{g.value=y,w.querySelectorAll(".le-choice").forEach(S=>S.classList.remove("is-selected")),b.classList.add("is-selected"),g.dispatchEvent(new Event("input",{bubbles:!0}))}),b.append(x,document.createTextNode(y)),w.append(b)}),u.append(g,w),u}let h;if(Array.isArray(p)?(h=document.createElement("select"),p.forEach(g=>{let w=document.createElement("option");w.value=g,w.textContent=g,w.selected=g===n,h.append(w)})):(h=document.createElement("textarea"),h.rows=i,h.value=n??""),h.name=e,h.className="le-input",h.tagName==="TEXTAREA"){h.classList.add("le-prose");let g=()=>{h.style.height="auto",h.style.height=Math.min(h.scrollHeight+2,420)+"px"};h.addEventListener("input",g),requestAnimationFrame(g)}if(c&&h.tagName==="TEXTAREA"){let g=document.createElement("div");g.className="le-tools";let w=(x,S)=>{let T=h.selectionStart,C=h.selectionEnd,I=h.value.slice(T,C)||"text";h.setRangeText(x+I+S,T,C,"select"),h.dispatchEvent(new Event("input",{bubbles:!0})),h.focus()},y=(x,S,T,C="")=>{let I=document.createElement("button");return I.type="button",I.title=S,I.textContent=x,I.className="le-tool "+C,I.addEventListener("click",T),I};g.append(y("B","Bold",()=>w("**","**"),"is-bold"),y("I","Italic",()=>w("*","*"),"is-italic"),y("Link","Insert link",()=>{let x=window.prompt("Link URL (https://\u2026 or /page):");if(!x)return;let S=h.selectionStart,T=h.selectionEnd,C=h.value.slice(S,T)||"link text";h.setRangeText("["+C+"]("+x+")",S,T,"select"),h.dispatchEvent(new Event("input",{bubbles:!0})),h.focus()}));let b=document.createElement("span");b.className="le-hint",b.textContent="**bold** \xB7 *italic* \xB7 [text](url)",g.append(b),u.append(g)}return u.append(h),u},Y=e=>{let t=e.tagName;if(e.dataset.editRegion)return e.dataset.editRegion;if(t==="IMG")return"Image";if(t==="BUTTON")return"Button";if(t==="A")return/\b(btn|button)\b/i.test(String(e.className))?"Button":"Link";if(/^H[1-6]$/.test(t))return"Heading";if(t==="P")return"Paragraph";if(t==="LI")return"List item";if(t==="UL"||t==="OL")return"List";if(t==="NAV")return"Menu";if(t==="HEADER")return"Header";if(t==="FOOTER")return"Footer";if(t==="FORM")return"Form";if(e.hasAttribute("data-edit-item"))return"Card";if(e.hasAttribute("data-edit-icon"))return"Icon";if(e.hasAttribute("data-edit-svg"))return"Drawing";if(e.hasAttribute("data-edit"))return"Text";if(e.hasAttribute("data-has-bg")||e.hasAttribute("data-edit-bg"))return"Background";if(t==="SECTION"||t==="MAIN"||t==="ARTICLE")return"Section";let n=e.getBoundingClientRect();return n.width>window.innerWidth*.6&&n.height>180?"Section":"Group"},je=(e,t)=>{let n=e.tagName,i;return n==="IMG"?i=["radius","hidden"]:n==="A"||n==="BUTTON"?i=["background","textColor","fontSize","radius","hidden"]:/^(H[1-6]|P|SPAN|LI|BLOCKQUOTE|FIGCAPTION|DT|DD|TD|TH|CAPTION|CITE|Q|LABEL|STRONG|EM)$/.test(n)?i=["textColor","fontSize","hidden"]:i=["background","backgroundImage","paddingY","paddingX","radius","hidden"],t.filter(c=>i.includes(c.trim()))},ce=({hint:e="PNG, JPG or WEBP, or drag one here",onFile:t}={})=>{let n=document.createElement("label");n.className="le-upload";let i=document.createElement("div");i.className="le-upload-inner";let c=document.createElement("span");c.className="le-upload-icon",c.textContent="\u2191";let u=document.createElement("span");u.className="le-upload-text";let p=document.createElement("span");p.className="le-upload-title",p.textContent="Upload from your computer";let l=document.createElement("span");l.className="le-upload-hint",l.textContent=e,u.append(p,l);let h=document.createElement("span");h.className="le-upload-btn",h.textContent="Choose file",i.append(c,u,h);let g=document.createElement("input");g.type="file",g.accept="image/*";let w=y=>{y&&(l.textContent=y.name,t?.(y))};return g.addEventListener("change",()=>w(g.files[0])),["dragenter","dragover"].forEach(y=>n.addEventListener(y,b=>{b.preventDefault(),n.classList.add("is-dragover")})),["dragleave","drop"].forEach(y=>n.addEventListener(y,b=>{b.preventDefault(),n.classList.remove("is-dragover")})),n.addEventListener("drop",y=>{let b=y.dataTransfer?.files?.[0];if(!b)return;let x=new DataTransfer;x.items.add(b),g.files=x.files,w(b)}),n.append(i,g),n},ze=e=>{let t=String(e).match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);return!t||t[4]!==void 0&&Number(t[4])===0?"":"#"+[1,2,3].map(n=>Number(t[n]).toString(16).padStart(2,"0")).join("")},ge=e=>{if(!e)return"";let t=e.dataset.background||e.dataset.bg||e.dataset.backgroundImage;if(t)return t;let i=(getComputedStyle(e).backgroundImage||"").match(/url\((['"]?)(.*?)\1\)/);return i&&!i[2].startsWith("data:")?i[2]:""},Le={background:"Background colour",backgroundImage:"Background image",textColor:"Text colour",fontSize:"Text size",paddingY:"Space above and below",paddingX:"Space left and right",radius:"Corner rounding"},Fe=(e,t,n,i)=>{let c=document.createElement("label");c.className="le-field";let u=e.replace(/([A-Z])/g," $1").toLowerCase(),p=Le[e]??u.charAt(0).toUpperCase()+u.slice(1);if(c.append(p),t==="toggle"){let l=document.createElement("div");l.className="le-row";let h=document.createElement("input");h.type="checkbox",h.checked=n==="1",h.dataset.styleProp=e;let g=document.createElement("span");g.className="le-hint",g.textContent="Hidden from visitors. You still see it, dimmed, while editing.",l.append(h,g);let w=i?Y(i).toLowerCase():"section";return c.replaceChildren(`Hide this ${w}`,l),c.className="le-field le-divided",c}if(t==="color"){let l=document.createElement("div");l.className="le-row";let h=document.createElement("input");h.type="color";let g=i?ze(getComputedStyle(i)[e==="textColor"?"color":"backgroundColor"]):"";h.value=n||g||"#ffffff",h.dataset.styleProp=e,h.className="le-color";let w=document.createElement("label");w.className="le-default";let y=document.createElement("input");y.type="checkbox",y.checked=!n,h.addEventListener("input",()=>y.checked=!1),w.append(y,"Use default"),l.append(h,w),c.append(l)}else if(t==="url"){let l=document.createElement("input");l.type="text",l.value=n??"",l.placeholder="Paste an image URL, or upload below",l.dataset.styleProp=e,l.className="le-input";let h=document.createElement("img");h.className="le-thumb",h.alt="";let g=C=>{h.src=C||"",h.style.display=C?"":"none"},w=n?"":ge(i),y=document.createElement("span");y.className="le-hint";let b=(C,I)=>{y.textContent=C?I?"Current image (from the theme) \u2014 upload or paste a link to replace it":"Replacing with this image":"No image set",y.title=C||""};g(n||w),b(n||w,!n&&!!w),l.addEventListener("input",()=>{let C=l.value.trim();g(C||w),b(C||w,!C&&!!w)});let x=ce({onFile:async C=>{g(URL.createObjectURL(C));let I=new FormData;I.append("file",C);try{let D=await(await B("/live-edit/upload",{method:"POST",body:I})).json();l.value=D.url,g(D.url),b(D.url,!1),l.dispatchEvent(new Event("input",{bubbles:!0}))}catch(_){m(M(_,"save that"))}}}),S=F("div","le-ways"),T=F("button","le-btn le-wide","Replace background");T.type="button",T.addEventListener("click",()=>It(i,async C=>{let{url:I,file:_,credit:D}=C,W=I;if(_){g(URL.createObjectURL(_));let Z=new FormData;Z.append("file",_);try{W=(await(await B("/live-edit/upload",{method:"POST",body:Z})).json()).url}catch(ie){d.toast(M(ie,"save that"));return}}W&&(l.value=W,g(W),b(W,!1),l.dispatchEvent(new Event("input",{bubbles:!0})),l.dataset.kbCreditFor=W,l.dataset.kbCredit=JSON.stringify({credit:D??"",creditBy:C.creditBy??"",creditUrl:C.creditUrl??"",creditSource:C.creditSource??"",creditSourceUrl:C.creditSourceUrl??""}),D&&d.toast(D,4e3))},"Free photos","background")),S.append(T),l.hidden=!0,x.hidden=!0,c.append(S,l,x,h,y)}else{let l=document.createElement("input");l.type="number",l.min=0,l.max=400,l.value=n??"",l.placeholder="default",l.dataset.styleProp=e,l.className="le-input",c.append(l)}return c},Re={background:"color",backgroundImage:"url",textColor:"color",fontSize:"px",paddingX:"px",paddingY:"px",radius:"px",hidden:"toggle"},De=(e,t,n)=>{v.styleKey=e;let i=(window.liveEditStyles??{})[e]??{},c=document.createElement("div");c.className="le-section-heading",c.textContent="Style",E.append(c);let u=0;if((n?je(n,t):t).forEach(p=>{let l=(window.liveEditStyleProps??{})[p]??Re[p];l&&(E.append(Fe(p,l,i[p],n)),u++)}),u===0){let p=document.createElement("div");p.className="le-hint",p.textContent="Nothing on this element can be restyled.",E.append(p)}},pe=document.createElement("style");document.head.append(pe);let Ae=(e,t)=>{let n=`[data-style="${e}"]`,i="",c="";for(let[u,p]of Object.entries(t))p&&(i+={hidden:"opacity:.45 !important;",backgroundImage:`background-image:url('${p}') !important;background-size:cover !important;background-position:center !important;`,background:`background:${p} !important;`,textColor:`color:${p} !important;`,fontSize:`font-size:${p}px !important;`,radius:`border-radius:${p}px !important;`,paddingX:`padding-left:${p}px !important;padding-right:${p}px !important;`,paddingY:`padding-top:${p}px !important;padding-bottom:${p}px !important;`}[u]??"",u==="paddingY"&&(c+=`section${n}>div{padding-top:0 !important;padding-bottom:0 !important}`));return i?c+`${n}{${i}}`:c},be=()=>{if(!v?.styleKey)return;let e=oe(),t=v.styleKey,n=Ae(t,e),i={background:"background",textColor:"color",fontSize:"font-size",radius:"border-radius",backgroundImage:"background-image"};for(let[c,u]of Object.entries(e))u||(c==="hidden"&&(n+=`body.editing [data-style="${t}"]{opacity:1 !important}`),i[c]&&(n+=`[data-style="${t}"]{${i[c]}:revert-layer !important}`),c==="paddingY"&&(n+=`[data-style="${t}"]{padding-top:revert-layer !important;padding-bottom:revert-layer !important}section[data-style="${t}"]>div{padding-top:revert-layer !important;padding-bottom:revert-layer !important}`),c==="paddingX"&&(n+=`[data-style="${t}"]{padding-left:revert-layer !important;padding-right:revert-layer !important}`));pe.textContent=n},me=()=>{pe.textContent=""};E.addEventListener("input",()=>{v&&(v.dirty=!0),be()}),E.addEventListener("change",()=>{v&&(v.dirty=!0),be()});let oe=()=>{let e={};return E.querySelectorAll("[data-style-prop]").forEach(t=>{if(t.type==="checkbox")e[t.dataset.styleProp]=t.checked?"1":"";else if(t.type==="color"){let n=t.closest("div").querySelector("input[type=checkbox]").checked;e[t.dataset.styleProp]=n?"":t.value}else e[t.dataset.styleProp]=t.value;if(t.dataset.kbCredit&&t.dataset.kbCreditFor===t.value)try{Object.assign(e,JSON.parse(t.dataset.kbCredit))}catch{}}),e},ee=null,ye=()=>{!ee||!v||v.dirty||!$.classList.contains("is-open")||V!=="Edit"||ee.isConnected&&Qe(ee)},we=e=>e.dataset.editRegion?e.dataset.editRegion:e.dataset.editLabel?e.dataset.editLabel:e.querySelector(":scope > [data-style-edit]")?.dataset.editLabel??Y(e),Qe=e=>{if(ee=e,e.dataset.editImg!==void 0)rt(e);else if(e.dataset.edit!==void 0)We(e);else if(e.dataset.svgEdit!==void 0||e.dataset.editSvg!==void 0)zt(e);else if(e.dataset.editHref!==void 0)nt(e);else if(e.dataset.style!==void 0){let t=e.querySelector(":scope > [data-style-edit]");at(t??e)}},Ze=e=>{v?.dirty&&!window.confirm("Discard unsaved changes?")||(me(),Qe(e))},P=null,R=e=>{let t=P;P=e??null;let n=[],i=e?.parentElement;for(;i&&i!==document.body;)i.dataset&&(i.dataset.edit!==void 0||i.dataset.style!==void 0)&&n.unshift(i),i=i.parentElement;let c=[];n.forEach(p=>{let l=we(p);if(c.length&&c[c.length-1].label===l){c[c.length-1].node=p;return}c.push({node:p,label:l})});let u=c.slice(-3);t&&t!==e&&document.contains(t)&&!u.some(p=>p.node===t)&&u.unshift({node:t,label:`\u2190 ${we(t)}`}),z.replaceChildren(),z.classList.toggle("is-visible",u.length>0),u.forEach((p,l)=>{let h=p.node;l>0&&z.append("\u203A");let g=document.createElement("button");g.type="button",g.textContent=p.label,g.className="le-crumb",g.addEventListener("click",()=>Ze(h)),z.append(g)})},V="Edit",Te=e=>{V=e,Object.entries(N).forEach(([t,n])=>{n.classList.toggle("is-on",t===e),n.setAttribute("aria-selected",t===e?"true":"false")}),X.classList.toggle("le-hidden",e!=="Edit"),d.drawerFoot.classList.toggle("le-hidden",e!=="Edit"),e==="Changes"&&xe(),e==="History"&&Bn()};Object.entries(N).forEach(([e,t])=>{t.addEventListener("click",()=>{e!=="Edit"&&v?.dirty&&!window.confirm("Discard unsaved changes?")||(Te(e),$.classList.contains("is-open")||et())})});let M=(e,t)=>{console.warn(`[live-edit] ${t}:`,e);let n=String(e?.message??"");return/failed to fetch|networkerror|load failed/i.test(n)?"No connection just now. Nothing has been lost; try again in a moment.":/\b401\b|\b403\b|unauthor|forbidden/i.test(n)?"Your editing session has expired. Reload the page to carry on.":/\b429\b|too many/i.test(n)?"That was a lot at once. Give it a few seconds and try again.":`Could not ${t}. Nothing has been lost; try again in a moment.`},H=null,qe=async()=>{if(window.liveEditApi)try{H=await(await B("/live-edit/credits",{method:"GET"})).json(),ye()}catch(e){console.warn("[live-edit] could not read the credit balance:",e),H=null}},Me=async()=>{if(!(window.liveEditStyleProps&&window.liveEditStyles)&&window.liveEditApi)try{let t=await(await B("/live-edit/content",{method:"GET"})).json();t?.styleProps&&(window.liveEditStyleProps=t.styleProps),t?.styles&&(window.liveEditStyles=t.styles),ye()}catch(e){console.warn("[live-edit] could not read what this site allows to be styled:",e)}},ve=(e,t)=>{if(!H?.available||!t)return;let n=document.createElement("div");n.className="le-assist-head",n.append(_e("AI assist"),ae()),E.append(n),[["rewrite","Rewrite"],["shorten","Shorten"]].forEach(([i,c])=>{let u=H.costs?.[i]??1,p=document.createElement("button");p.type="button",p.className="le-assist";let l=document.createElement("span");l.textContent=c;let h=document.createElement("span");h.className="le-assist-cost",h.textContent=`${u} credit${u===1?"":"s"}`,p.append(l,h),(H.balance??0)<u&&(p.disabled=!0,h.classList.add("is-short"),p.title="Not enough credits"),p.addEventListener("click",()=>void $e(i,c,e,t,p,l)),E.append(p)})},ae=()=>{let e=document.createElement("span");return e.className="le-assist-balance",e.textContent=`${H?.balance??0} credits left`,e},_e=e=>{let t=document.createElement("div");return t.className="le-section-heading",t.textContent=e,t},Ne=()=>(document.querySelector('meta[property="og:site_name"]')?.content??document.querySelector('meta[name="application-name"]')?.content??(document.title??"").split(/\s+[|\u2013\u2014-]\s+/).pop()??"").replace(/\s+/g," ").trim().slice(0,120),Ue=()=>(document.querySelector('meta[name="description"]')?.content??document.querySelector('meta[property="og:description"]')?.content??"").replace(/\s+/g," ").trim().slice(0,400),$e=async(e,t,n,i,c,u)=>{c.disabled=!0,u.textContent="Thinking\u2026";let p;try{p=await(await B("/live-edit/assist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:e,text:i.value,heading:Oe(n),role:Y(n),page:window.location.pathname,site:Ne(),about:Ue()})})).json()}catch(l){c.disabled=!1,u.textContent=t,d.toast(M(l,"rewrite that"));return}if(typeof p?.balance=="number"&&H&&(H.balance=p.balance),!p?.text){c.disabled=!1,u.textContent=t,d.toast(He(p?.reason));return}i.value=p.text,i.dispatchEvent(new Event("input",{bubbles:!0})),i.focus(),c.disabled=!1,u.textContent=t,d.toast(`Rewritten. ${p.balance} credits left.`)},Oe=e=>(((e.closest("section, article, header, div[data-style]")??document.body).querySelector("h1, h2, h3")??document.querySelector("h1"))?.textContent??"").replace(/\s+/g," ").trim().slice(0,200),He=e=>({not_enough_credits:"Not enough credits for that. You can buy more from your account.",no_suggestion:"No suggestion for this one. Your words are unchanged.",not_configured:"Rewriting is not switched on for this site yet.",nothing_to_work_with:"There are no words here to rewrite yet."})[e]??"Could not rewrite that just now. Your words are unchanged.",xe=async()=>{E.replaceChildren(K("Loading\u2026"));let e;try{e=await(await B("/live-edit/changes",{method:"GET"})).json()}catch(n){E.replaceChildren(K(M(n,"show your changes")));return}let t=e?.changes??[];if(t.length===0){E.replaceChildren(K("No unpublished changes."));return}E.replaceChildren(),t.forEach(n=>{let i=document.createElement("div");i.className="le-change";let c=document.createElement("div");c.className="le-row le-change-head";let u=document.createElement("span");u.className="le-change-label",u.textContent=re(n);let p=document.createElement("button");if(p.type="button",p.className="le-chip-btn",p.textContent="Revert",p.addEventListener("click",()=>void G(n,p)),c.append(u,p),i.append(c),n.before){let h=document.createElement("p");h.className="le-change-before",h.textContent=ke(n.before),i.append(h)}let l=document.createElement("p");l.className="le-change-after",l.textContent=ke(n.after)||"(empty)",i.append(l),E.append(i)})},ke=e=>{let t=String(e??"").replace(/\s+/g," ").trim();return t.length>70?`${t.slice(0,70)}\u2026`:t},re=e=>{let t=document.querySelector(`[data-edit="setting:${CSS.escape(e.key)}"], [data-edit-img="setting:${CSS.escape(e.key)}"], [data-style="${CSS.escape(e.key)}"]`);return t?Y(t):e.kind==="style"?"Styling":"Text"},G=async(e,t)=>{t.disabled=!0,t.textContent="Reverting\u2026";try{await B("/live-edit/changes",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:e.key,kind:e.kind})})}catch(n){t.disabled=!1,t.textContent="Revert",d.toast(M(n,"put that back"));return}O("Reverted \u2713")},Bn=async()=>{E.replaceChildren(K("Loading\u2026"));let e;try{e=await(await B("/live-edit/versions",{method:"GET"})).json()}catch(n){E.replaceChildren(K(M(n,"show what has been published")));return}let t=e?.versions??[];if(t.length===0){E.replaceChildren(K("Nothing published yet. Your first publish will appear here."));return}E.replaceChildren(),t.forEach((n,i)=>{let c=document.createElement("div");c.className="le-version";let u=document.createElement("span");u.className=i===0?"le-version-dot is-latest":"le-version-dot";let p=document.createElement("div"),l=document.createElement("p");l.className="le-change-after",l.textContent=n.restored_from?`Restored version ${n.restored_from}`:`Published ${n.changes??0} change${n.changes===1?"":"s"}`;let h=document.createElement("p");h.className="le-change-when",h.textContent=In(n.published_at),p.append(l,h),c.append(u,p),E.append(c)})},K=e=>{let t=document.createElement("p");return t.className="le-hint",t.textContent=e,t},In=e=>{if(!e)return"";let t=Math.round((Date.now()-new Date(e).getTime())/1e3);return t<90?"Just now":t<3600?`${Math.round(t/60)} minutes ago`:t<86400?`${Math.round(t/3600)} hours ago`:t<86400*8?`${Math.round(t/86400)} days ago`:new Date(e).toLocaleDateString()},et=()=>{Pe(),dt(),$.classList.add("is-open"),d.toolbar.classList.add("is-compact"),V==="Edit"&&E.querySelector("textarea, input:not([type=checkbox]), select")?.focus()},Ee=(e=!1)=>{!e&&v?.dirty&&!window.confirm("Discard unsaved changes?")||(v?.restore?.(),me(),$.classList.remove("is-open"),d.toolbar.classList.remove("is-compact"),v=null)},jn=()=>document.querySelectorAll("[data-edit], [data-edit-img], [data-edit-bg], [data-edit-href], [data-edit-icon], [data-edit-svg]"),tt=async(e,t=0)=>{try{if(e.cssRules){let n=[];for(let i of e.cssRules)i.styleSheet&&t<4?n.push(await tt(i.styleSheet,t+1)):n.push(i.cssText);return n.join("")}}catch{}if(!e.href)return"";try{let n=await fetch(e.href);if(!n.ok)return"";let i=await n.text();if(t>=4)return i;let c=[...i.matchAll(/@import\s+(?:url\(\s*(["']?)([^"')]+)\1\s*\)|(["'])([^"']+)\3)/gi)].map(p=>p[2]||p[4]).filter(Boolean),u=await Promise.all(c.map(p=>tt({href:new URL(p,e.href).href},t+1)));return i+u.join("")}catch{return""}},zn=null,Fn=async()=>{let e=new Map;return(await Promise.all([...document.styleSheets].map(n=>tt(n)))).forEach(n=>Zt(n).forEach(i=>e.set(i.name,i.glyph))),[...e].map(([n,i])=>({name:n,glyph:i})).sort((n,i)=>n.name.localeCompare(i.name))},Nt=()=>zn??(zn=Fn()),$t=()=>{document.querySelectorAll("[data-style]").forEach(e=>{if(e.hasAttribute("data-edit-bg"))return;let n=(getComputedStyle(e).backgroundImage||"").match(/url\((['"]?)(.*?)\1\)/),i=e.getBoundingClientRect(),c=n&&!n[2].startsWith("data:")&&i.width>=120&&i.height>=120;e.toggleAttribute("data-has-bg",!!c)})},Rn=()=>{document.querySelectorAll("[data-edit-icon]").forEach(e=>{let t=getComputedStyle(e,"::before").content;(t==="none"||t==="normal"||t==='""'||t==="")&&e.removeAttribute("data-edit-icon")})},Se=e=>{e&&Rn(),document.body.classList.toggle("editing",e),jn().forEach(t=>{e?t.setAttribute("tabindex","0"):t.removeAttribute("tabindex")}),sessionStorage.setItem("tb_editing",e?"1":"0"),le.textContent=e?"Click any outlined text or image":"",le.parentElement?.classList.toggle("is-saying",e),!e&&typeof Pe=="function"&&Pe(),d.toolbar.classList.toggle("is-editing",e),ne.textContent=e?"Done editing":"Edit site",e?($t(),document.querySelector("[data-edit-icon]")&&Nt(),o?.base&&o?.site&&Promise.resolve().then(()=>(xt(),vt)).then(t=>t.refreshBackgrounds({base:o.base,site:o.site,key:o.token})).then(t=>{t&&$t()}).catch(t=>console.warn("[live-edit] could not look again for backgrounds:",t.message))):(dt(),fe()),e||Ee(!0)},Dn=async()=>{let e=window.liveEditApi,t=await Promise.resolve().then(()=>(Pn(),On)).catch(()=>null);if(t?.forget(window),!e||!t){window.location.reload();return}let n=window.prompt("Your editing session has ended. Enter your email address and we will send you a new link.");n&&(await t.requestLink(e,n,window).catch(()=>{}),m("If that address can edit this site, a link is on its way.")),window.location.reload()},B=async(e,t)=>{let n=window.liveEditApi,i=n?on(e,t,n):null,c=i?await fetch(i.url,i.init):await fetch(e,Xt(r,t));if(c.status===419||c.status===401)throw await Dn(),new Error("Your editing session has ended.");if(!c.ok){let u=await c.json().catch(()=>({}));throw new Error(u.error?.message??u.message??"Could not save. Try again.")}if(!Qt(c))throw new Error("That did not save. Reload the page and try again.");return c},qn=(e,t)=>{if(!e?.element)return null;let n=i=>{let c=e.element.getAttribute(i);return c===null?null:{attr:i,marker:c}};if(e.kind==="image"){let i=t.querySelector("input[type=url]")?.value.trim(),c=t.querySelector("input[type=file]")?.files?.[0],u=n("data-edit-img")??n("data-edit-bg");return i&&u?{...u,kind:"image",value:i}:null}if(e.kind==="icon"){let i=n("data-edit-icon");return i&&e.value?{...i,kind:"icon",value:e.value}:null}if(e.kind==="setting"&&typeof e.savedValue=="string"){let i=n("data-edit");return!i||/<[a-z][\s\S]*>/i.test(e.savedValue)||e.element.hasAttribute("data-edit-attr")?null:{...i,kind:"text",value:e.savedValue}}return null},Mn=async e=>{let t=window.liveEditApi?.builderUrl;if(!t||e?.kind!=="setting"||typeof e.savedValue!="string"||!e.element)return;let n=e.element.closest(".elementor-element[data-id]");if(n)try{await fetch(t,{method:"POST",headers:{"Content-Type":"application/json",...window.liveEditApi?.publishHeaders??{}},body:JSON.stringify({page:window.location.href,element:n.dataset.id,value:e.savedValue})})}catch(i){console.warn("[live-edit] could not tell the page builder about this change:",i.message)}},_n=async()=>{if(!v)return;let e=d.saveButton;e.disabled=!0,e.textContent="Saving\u2026";let t=()=>{e.disabled=!1,e.textContent="Save changes"};try{if(v.kind==="setting")await B("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:v.key,value:v.savedValue=v.value??E.querySelector("textarea, input[name=icon]")?.value??"",locale:window.liveEditLocale})});else if(v.kind==="record"){let n={};E.querySelectorAll("textarea, select, input[type=hidden][name]").forEach(i=>n[i.name]=i.value),await B("/live-edit/record",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:v.type,id:v.id,fields:n})})}else if(v.kind==="icon")await B("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:v.key,value:v.value})});else if(v.kind==="image"){let n=new FormData;n.append("target",v.target);let i=E.querySelector("input[type=file]").files[0],c=E.querySelector("input[type=url]").value.trim(),u=v.element?.getBoundingClientRect?.();u&&u.width>=1&&u.height>=1&&(n.append("fitWidth",String(Math.round(u.width))),n.append("fitHeight",String(Math.round(u.height))));let p=i!==void 0||c!==""&&c!==void 0;v.credit&&v.creditFor===v.target&&p&&Object.entries(v.credit).forEach(([h,g])=>n.append(h,g));let l=[...E.querySelectorAll("[data-img-attr]")];if(i?n.append("file",i):c&&n.append("url",c.startsWith("http")?c:`https://${c}`),l.forEach(h=>n.append(h.dataset.imgAttr,h.value)),!i&&!c&&l.length===0){t(),m("Choose a file from your computer or paste an image URL first.");return}await B("/live-edit/image",{method:"POST",body:n})}if(v.hrefKey){let n=E.querySelector("[data-link-field=href]").value.trim(),i=E.querySelector("[data-link-field=target]").checked;await B("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:v.hrefKey,value:n})}),v.targetKey&&await B("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:v.targetKey,value:i?"_blank":""})})}v.styleKey&&await B("/live-edit/style",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:v.styleKey,props:oe()})}),await Mn(v),Jt(qn(v,E)),j("Saved \u2713",v.key??null,v.savedValue??null)}catch(n){t(),m(n.message)}};qe(),Me();let F=(e,t,n)=>{let i=document.createElement(e);return t&&(i.className=t),n!=null&&(i.textContent=n),i},Ot=e=>{let t=e.closest("section, article, header, div[data-style]");for(;t&&!t.querySelector("h1, h2, h3");)t=t.parentElement?.closest("section, article, header, div[data-style]")??null;let n=t?.querySelector("h1, h2, h3");return!t||!n?"":[...t.querySelectorAll("p, span, div, h4, h5, h6")].filter(c=>c.children.length===0).filter(c=>n.compareDocumentPosition(c)&Node.DOCUMENT_POSITION_PRECEDING).map(c=>(c.textContent??"").replace(/\s+/g," ").trim()).find(c=>c.length>3&&c.length<42)??""},Un=/^(the|and|with|for|your|our|from|that|this|they|them|will|have|more|about|into|just|than|then|when|what|where|very|been|here|there)$/,Pt=e=>{let t=new Set((document.title??"").toLowerCase().split(/[^a-z0-9]+/i).filter(Boolean));return(e??"").toLowerCase().split(/[^a-z0-9]+/i).filter(n=>n.length>3&&!Un.test(n)&&!t.has(n))},Hn=e=>{let t=Pt(Ot(e)).slice(0,3);if(t.length>0)return t.join(" ");let n=Pt(Oe(e)).slice(0,3);return n.length>0?n.join(" "):"workplace"},Bt=e=>{let t=Hn(e),n=(e.dataset.editLabel??"").toLowerCase().trim(),i=/hero|banner|header|cover/.test(n);return[...new Set([t,i?`${t} wide`:`${t} close up`,"workplace"].filter(Boolean))].slice(0,4)},Wn=e=>`${(Ot(e)||Oe(e)||"This page").replace(/[.\s]+$/,"")}. Photographic, natural daylight, calm and editorial, soft neutral tones to match the rest of the site. No text.`,It=(e,t,n="Free photos",i="image")=>{let c=d.modal({title:`Replace ${i}`,subtitle:e.dataset.editLabel??Y(e)}),u=document.createElement("div");c.body.append(u),c.tabs.hidden=!1;let p=w=>{c.close(),t(w)},l={Upload:()=>Vn(u,p),"Free photos":()=>void Jn(u,e,p),"Generate with AI":()=>Gn(u,e,p)},h=Object.keys(l).map(w=>{let y=document.createElement("button");return y.type="button",y.className="le-modal-tab",y.textContent=w,y.addEventListener("click",()=>g(w)),c.tabs.append(y),[w,y]}),g=w=>{h.forEach(([y,b])=>b.classList.toggle("is-on",y===w)),u.replaceChildren(),l[w]()};return g(l[n]?n:"Free photos"),c},Vn=(e,t)=>{e.append(ce({hint:"PNG, JPG or WEBP, or drag one here",onFile:l=>t({file:l})}));let n=F("div","le-row-tight"),i=document.createElement("input");i.type="url",i.className="le-search",i.placeholder="Or paste a link to a picture";let c=F("button","le-btn-outline","Use it");c.type="button";let u=()=>{let l=i.value.trim();l&&t({url:l.startsWith("http")?l:`https://${l}`})};c.addEventListener("click",u),i.addEventListener("keydown",l=>{l.key==="Enter"&&(l.preventDefault(),u())}),n.append(i,c),e.append(n);let p=F("p","le-hint","You can also drag a picture straight onto the image on the page.");p.style.marginTop="14px",e.append(p)},Jn=async(e,t,n)=>{let i=document.createElement("input");i.type="search",i.className="le-search",i.placeholder="Search free photographs";let c=document.createElement("div");c.className="le-chips";let u=document.createElement("div");u.className="le-grid";let p=document.createElement("p");p.className="le-hint",p.style.marginTop="16px",e.append(i,c,u,p);let l=()=>{u.replaceChildren();for(let g=0;g<6;g+=1)u.append(F("div","le-shimmer"))},h=async g=>{i.value=g,l();let w;try{w=await(await B(`/live-edit/photos?q=${encodeURIComponent(g)}`,{method:"GET"})).json()}catch(b){u.replaceChildren(K(M(b,"look for photographs")));return}let y=w?.photos??[];if(p.textContent=w?.source==="openverse"?"Free to use, including commercially. The photographer is credited automatically.":"Free to use under the Unsplash licence. The photographer is credited automatically.",y.length===0){u.replaceChildren(K(Yn(w?.reason,g)));return}u.replaceChildren(),y.forEach(b=>{let x=document.createElement("button");x.type="button",x.className="le-pick";let S=document.createElement("img");S.className="le-pick-shot",S.src=b.thumb??b.full,S.alt=b.alt??"",S.loading="lazy";let T=F("span","le-pick-by",b.by?`Photo by ${b.by}`:"");x.append(S,T),x.addEventListener("click",()=>{b.downloadLocation&&B("/live-edit/photos/used",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({download_location:b.downloadLocation})}).catch(()=>{}),n({url:b.full,alt:b.alt??"",credit:b.credit??(b.by?`Photo by ${b.by}`:""),creditBy:b.by??"",creditUrl:b.byUrl??"",creditSource:b.source??"",creditSourceUrl:b.sourceUrl??""})}),u.append(x)})};Bt(t).forEach((g,w)=>{let y=document.createElement("button");y.type="button",y.className="le-chip",y.textContent=g,y.addEventListener("click",()=>void h(g)),c.append(y),w===0&&y.classList.add("is-on")}),i.addEventListener("keydown",g=>{g.key==="Enter"&&(g.preventDefault(),i.value.trim()&&h(i.value.trim()))}),await h(Bt(t)[0])},Yn=(e,t)=>({not_configured:"Free photographs are not switched on for this site yet.",not_allowed:"The photo library would not accept this site\u2019s key. It needs setting up again.",unreachable:"Could not reach the photo library just now. Try again in a moment.",nothing_to_search_for:"Type what the picture should show."})[e]??`Nothing found for "${t}". Try fewer words.`,Gn=(e,t,n)=>{let i=Wn(t),c=F("div","le-suggest");c.append(F("div","le-eyebrow","Suggested for this spot"),F("div","le-suggest-text",i));let u=document.createElement("button");u.type="button",u.className="le-chip",u.style.marginTop="10px",u.textContent="Use this description",c.append(u);let p=document.createElement("textarea");p.className="le-textarea",p.placeholder="Describe the picture you want",u.addEventListener("click",()=>{p.value=i,p.focus()});let l=document.createElement("button");l.type="button",l.className="le-btn-publish",l.style.marginTop="14px",l.textContent="Make a picture \xB7 5 credits";let h=F("div","le-grid is-square");h.style.display="none",e.append(c,p,l,h),l.addEventListener("click",async()=>{let g=p.value.trim()||i;l.disabled=!0,l.textContent="Making\u2026",h.style.display="",h.replaceChildren();for(let b=0;b<4;b+=1)h.append(F("div","le-shimmer"));let w;try{w=await(await B("/live-edit/imagine",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:g})})).json()}catch(b){h.replaceChildren(K(M(b,"make a picture"))),l.disabled=!1,l.textContent="Try again \xB7 5 credits";return}let y=w?.images??[];if(typeof w?.balance=="number"&&(H={...H??{},balance:w.balance}),y.length===0){h.replaceChildren(K(Kn(w?.reason))),l.disabled=!1,l.textContent="Try again \xB7 5 credits";return}h.replaceChildren(),y.forEach(b=>{let x=document.createElement("button");x.type="button",x.className="le-pick";let S=document.createElement("img");S.className="le-pick-shot",S.src=b,S.alt="",x.append(S,F("span","le-tag","MADE")),x.addEventListener("click",()=>n({url:b,credit:"",creditSource:"Generated"})),h.append(x)}),l.disabled=!1,l.textContent="Make four more \xB7 5 credits"})},Kn=e=>({not_enough_credits:"Not enough credits to make a picture. You can buy more from your account.",not_configured:"Making pictures is not switched on for this site yet.",no_suggestion:"Nothing usable came back, so you have not been charged. Try describing it differently.",nothing_to_work_with:"Describe the picture you want first."})[e]??"Could not make a picture just now. You have not been charged.",Ce=null,Xn=(e,t)=>{if(!t)return;let n=se(e),i=l=>[...l.childNodes].filter(h=>h.nodeType===3),c=i(e).map(l=>l.nodeValue),u=()=>{let l=i(e);return l.length!==c.length?!1:(l.forEach((h,g)=>{h.nodeValue=c[g]}),!0)},p=!1;v.restore=()=>{!p||!Ce||u()||Ce(e,n)},t.addEventListener("input",()=>{Ce&&(p=!0,u(),Ce(e,t.value,{keepRuns:!0}))}),Ce===null&&Promise.resolve().then(()=>(Lt(),Ct)).then(l=>Ce=l.applyValue).catch(l=>console.warn("[live-edit] could not preview words as you type:",l.message))},Qn=e=>{v.hrefKey=e.dataset.editHref,v.targetKey=e.dataset.editTarget;let t=document.createElement("div");t.className="le-field le-divided",t.append("Link");let n=document.createElement("input");n.type="text",n.dataset.linkField="href";let i=e.getAttribute("href")??"";n.value=i==="#"?"":i,n.placeholder="/contact or https://...",n.className="le-input le-link";let c=document.createElement("label");c.className="le-default";let u=document.createElement("input");u.type="checkbox",u.dataset.linkField="target",u.checked=e.getAttribute("target")==="_blank",c.append(u,"Open in a new tab"),t.append(n,c),E.append(t)},nt=e=>{v={kind:"link"},U.textContent=e.dataset.editLabel??"Link",E.replaceChildren(),q.classList.add("le-hidden"),ue(e)},We=e=>{let{kind:t,key:n,parts:i}=Kt(e.dataset.edit);if(E.replaceChildren(),q.classList.add("le-hidden"),t==="setting"){v={kind:t,key:n,element:e},U.textContent=e.dataset.editLabel??Y(e);let c=(window.liveEditRich?.settings??[]).includes(i[0]),u=bt({editValue:e.dataset.editValue,ownText:se(e),fullText:e.textContent}),p=c?u.trim():u.replace(/\s+/g," ").trim(),l=e.dataset.editAs==="icon";E.append(l?de("icon","Icon",e.dataset.editValue??"",1,!1):de("value","Text",p,6,c)),l||ve(e,E.querySelector("textarea")),!l&&!c&&Xn(e,E.querySelector("textarea"))}else{let[c,u]=i;v={kind:"record",type:c,id:Number(u)};let p=e.dataset.editLabel??"Item",l=JSON.parse(e.dataset.editValues??"{}"),h=l.title??l.question??l.label??l.number;if(U.textContent=h?`${p}: ${h.slice(0,40)}`:p,Object.entries(l).forEach(([b,x])=>{let S=b.replace(/_/g," "),T=S.charAt(0).toUpperCase()+S.slice(1),C=(window.liveEditRich?.fields??[]).includes(`${c}.${b}`);E.append(de(b,T,x,b==="detail"||b==="answer"?6:3,C))}),window.liveEditPublishing){let b=document.createElement("div");b.className="le-hint le-immediate",b.textContent="Changes here go live as soon as you save, without publishing.",E.append(b)}e.hasAttribute("data-edit-deletable")&&(q.textContent=`Delete this ${p.toLowerCase()}`,q.classList.remove("le-hidden"));let g=document.createElement("div");g.className="le-row";let w=document.createElement("span");w.className="le-label",w.textContent="Order";let y=(b,x)=>{let S=document.createElement("button");return S.type="button",S.textContent=x,S.className="le-chip-btn",S.addEventListener("click",async()=>{(await(await B("/live-edit/record/move",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:v.type,id:v.id,direction:b})})).json()).moved?O("Reordered \u2713"):m(b==="up"?"Already first.":"Already last.")}),S};g.append(w,y("up","\u2191 Move up"),y("down","\u2193 Move down")),E.prepend(g)}ue(e)},Zn=e=>{let t=e.closest?.("[data-edit-item]"),n=t?.parentElement?.dataset?.editList?t.parentElement:e.closest?.("[data-edit-list]");if(!n?.dataset?.editList)return;let i=()=>[...n.children].filter(h=>h.dataset.editItem).map(h=>h.dataset.editItem),c=async(h,g)=>{try{await B("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:n.dataset.editList,value:JSON.stringify(h)})}),O(g)}catch(w){m(w.message)}},u=document.createElement("div");u.className="le-section-heading",u.textContent="List";let p=document.createElement("div");p.className="le-row";let l=document.createElement("button");if(l.type="button",l.className="le-chip-btn",l.textContent=t?"+ Add another":"+ Add item",l.addEventListener("click",()=>{let h=i(),g=t?h.indexOf(t.dataset.editItem):h.length-1;h.splice(g+1,0,"n"+Date.now().toString(36)),c(h,"Added \u2713")}),p.append(l),t){let h=document.createElement("button");h.type="button",h.className="le-btn-danger",h.textContent="Delete this item",h.addEventListener("click",()=>{window.confirm("Delete this item?")&&c(i().filter(g=>g!==t.dataset.editItem),"Deleted \u2713")}),p.append(h)}E.append(u,p)},ot=!1,eo=e=>{ot=!0,e.click(),window.setTimeout(()=>{ot=!1},0)},to=e=>e.closest?.('a[href^="#"], [aria-controls], [aria-expanded], [data-toggle], [role="button"]')??null,no=e=>{let t=to(e);if(t){let p=document.createElement("div");p.className="le-row";let l=document.createElement("button");l.type="button",l.className="le-chip-btn",l.textContent="Open this menu",l.title="Runs the control so you can edit what it reveals",l.addEventListener("click",()=>{Ee(!0),eo(t)}),p.append(l),E.append(p)}let n=e.closest?.("a[href]"),i=n?.getAttribute("href");if(!i||i==="#"||i.startsWith("javascript:"))return;let c=document.createElement("div");c.className="le-row";let u=document.createElement("button");u.type="button",u.className="le-chip-btn",u.textContent="Open this link \u2192",u.addEventListener("click",()=>{window.location.href=n.href}),c.append(u),E.append(c)},ue=(e,{styleKey:t=null,styleOn:n=e}={})=>{e.dataset.editHref!==void 0&&Qn(e),no(e);let i=t??n.dataset.styleEdit??n.dataset.style,c=nn(n.dataset.styleProps,window.liveEditStyleProps);i&&c.length&&De(i,c,n),ao(e),Zn(e),R(e.dataset.styleEdit?e.closest("[data-style]")??e.parentElement:e),Te("Edit"),et()},oo=e=>{let t=(se(e)||e.textContent||"").replace(/\s+/g," ").trim();if(t)return t.slice(0,28);let n=(e.getAttribute("aria-label")??e.getAttribute("title")??"").trim();if(n)return n.slice(0,28);let i=e.className.toString().match(/(?:social-icon-|fa-|bi-|icon-)([a-z][a-z0-9-]{2,})/i)?.[1]??[...e.querySelectorAll("[class]")].map(c=>c.className.toString().match(/(?:social-icon-|fa-|bi-|icon-)([a-z][a-z0-9-]{2,})/i)?.[1]).find(Boolean);return i?i.charAt(0).toUpperCase()+i.slice(1):we(e)},ao=e=>{let t="[data-edit], [data-edit-img], [data-edit-bg], [data-edit-href], [data-edit-icon], [data-edit-svg]",n=[...e.querySelectorAll(t)].filter(p=>p.parentElement?.closest(t)===null||!e.contains(p.parentElement.closest(t))).filter(p=>p!==e&&p.getBoundingClientRect().width>0);if(n.length===0)return;let i=n.slice(0,24),c=document.createElement("div");c.className="le-section-heading",c.textContent=n.length>i.length?`Inside this \u2014 first ${i.length} of ${n.length}`:"Inside this",E.append(c);let u=document.createElement("div");u.className="le-row",i.forEach(p=>{let l=document.createElement("button");l.type="button",l.className="le-chip-btn",l.textContent=oo(p),l.addEventListener("click",()=>Ze(p)),u.append(l)}),E.append(u)},at=e=>{v={kind:"style"};let t=e.dataset.styleEdit??e.dataset.style;U.textContent=e.dataset.editLabel??Y(e),E.replaceChildren(),q.classList.add("le-hidden"),ue(e,{styleKey:t})},Ve=e=>{let t=getComputedStyle(e,"::before");return`${t.fontStyle} ${t.fontWeight} 20px ${t.fontFamily}`},jt=(e,t)=>{let n=e.cloneNode(!1);n.removeAttribute("data-edit-icon"),Object.assign(n.style,{position:"absolute",visibility:"hidden",pointerEvents:"none"}),(e.parentNode??document.body).append(n);let i=Ve(n),c=[];return[...n.classList].forEach(u=>{u!==t&&(n.classList.remove(u),Ve(n)!==i&&c.push(u),n.classList.add(u))}),n.remove(),c},ro=(e,t,n,i)=>en([...e.classList],n,i,jt(e,i),jt(t,t.dataset.editIconCurrent)),io=(e,t)=>{let n=document.createElement("canvas").getContext("2d");return n.font=t,e.filter(({glyph:i})=>{let c=n.measureText(i);return(c.actualBoundingBoxAscent||0)+(c.actualBoundingBoxDescent||0)>0})},so=async e=>{let t=e.dataset.editIconCurrent;v={kind:"icon",key:e.dataset.editIcon.replace(/^setting:/,""),value:t,element:e},U.textContent="Icon",E.replaceChildren(),q.classList.add("le-hidden");let n=Ve(e),i=await Nt();if(v?.element!==e)return;let c=new Map([[n,null]]);document.querySelectorAll("[data-edit-icon]").forEach(b=>{let x=Ve(b);c.has(x)||c.set(x,b)});let u=tn([...c].map(([b,x])=>({face:b,variant:x,icons:io(i,b)})));if(u.length===0){let b=document.createElement("div");b.className="le-hint",b.textContent="This theme loads its icons from somewhere this page cannot read, so they cannot be listed. Type the icon name instead.";let x=document.createElement("label");x.className="le-field",x.append("Icon name");let S=document.createElement("input");S.type="text",S.className="le-input",S.value=t??"",S.addEventListener("input",()=>{v.value=S.value.trim(),v.dirty=!0}),x.append(S,b),E.append(x),ue(e);return}let p=e.className;v.restore=()=>{e.className=p,e.dataset.editIconCurrent=t};let l=document.createElement("input");l.type="search",l.className="le-input",l.placeholder=`Search ${u.length} icons\u2026`;let h=document.createElement("div");h.className="le-icon-grid";let g=document.createElement("div");g.className="le-hint";let w=400,y=b=>{let x=b.trim().toLowerCase().replace(/\s+/g,"-"),S=x?u.filter(({name:T})=>T.includes(x)):u;if(h.replaceChildren(),S.slice(0,w).forEach(({name:T,glyph:C,face:I,variant:_})=>{let D=document.createElement("button");D.type="button",D.className="le-icon-choice",D.title=T.replace(/^[a-z]+-/,"").replace(/-/g," "),D.classList.toggle("is-current",T===t),D.style.font=I,D.textContent=C,D.addEventListener("click",()=>{e.className=p,e.dataset.editIconCurrent=t;let W=_?ro(e,_,T,t):T;_?e.className=W:e.classList.replace(t,T),e.dataset.editIconCurrent=T,v.value=W,v.dirty=!0,h.querySelectorAll(".le-icon-choice").forEach(Z=>Z.classList.remove("is-current")),D.classList.add("is-current")}),h.append(D)}),S.length===0){let T=document.createElement("div");T.className="le-hint",T.textContent="No icon matches that name.",h.append(T)}g.textContent=S.length>w?`Showing ${w} of ${S.length}. Type to narrow it down.`:""};l.addEventListener("input",()=>y(l.value)),y(""),E.append(l,h,g),ue(e)},zt=e=>{let t=e.outerHTML;v={kind:"setting",key:e.dataset.editSvg.replace(/^setting:/,""),element:e},U.textContent=e.dataset.editLabel??"Drawing",E.replaceChildren(),q.classList.add("le-hidden");let n=()=>{e.outerHTML=t};v.restore=n;let i=new Set,c=[];document.querySelectorAll("svg").forEach(y=>{let b=y.outerHTML,x=b.replace(/\s+(class|style|width|height|data-[\w-]+)="[^"]*"/g,"");i.has(x)||y.getBoundingClientRect().width<4||(i.add(x),c.push(b))});let u=document.createElement("div");u.className="le-icon-grid";let p=null;c.slice(0,120).forEach(y=>{let b=document.createElement("button");b.type="button",b.className="le-icon-choice",b.innerHTML=y;let x=b.firstElementChild;x&&(x.removeAttribute("class"),x.setAttribute("width","20"),x.setAttribute("height","20")),b.classList.toggle("is-current",y===t),b.addEventListener("click",()=>{p=y,v.value=y,v.dirty=!0;let S=document.querySelector(`[data-edit-svg="${e.dataset.editSvg}"]`)??e,T=new DOMParser().parseFromString(y,"image/svg+xml").documentElement;["class","width","height","style","data-edit-svg","data-edit-label"].forEach(C=>{S.hasAttribute(C)&&T.setAttribute(C,S.getAttribute(C))}),S.replaceWith(T),u.querySelectorAll(".le-icon-choice").forEach(C=>C.classList.remove("is-current")),b.classList.add("is-current")}),u.append(b)});let l=document.createElement("label");l.className="le-field le-divided",l.append("Or paste an SVG");let h=document.createElement("textarea");h.className="le-input le-prose",h.placeholder='<svg viewBox="0 0 24 24">\u2026</svg>',h.addEventListener("input",()=>{h.value.trim()!==""&&(v.value=h.value.trim(),v.dirty=!0)});let g=document.createElement("div");g.className="le-hint",g.textContent="Anything that could run or fetch is stripped before it is saved.",l.append(h,g);let w=document.createElement("div");w.className="le-section-heading",w.textContent=c.length?"Drawings on this site":"No other drawings here",E.append(w,u,l),ue(e)},rt=e=>{let t=e.dataset.editKind==="background";v={kind:"image",target:e.dataset.editImg??e.dataset.editBg,element:e},U.textContent=e.dataset.editLabel??(t?"Background image":"Image"),E.replaceChildren(),q.classList.add("le-hidden");let n=document.createElement("div");n.className="le-preview";let i=document.createElement("img");i.alt="",i.className="";let c=e.dataset.editPreview;c?(i.src=c,n.append(i)):n.textContent="No image yet";let u=C=>{n.replaceChildren(i),i.src=C},p=ce({onFile:C=>u(URL.createObjectURL(C))}),l=document.createElement("label");l.className="le-field",l.append("Or paste an image URL");let h=document.createElement("input");h.type="url",h.placeholder="https://...",h.className="le-input",h.addEventListener("change",()=>{let C=h.value.trim();C&&u(C.startsWith("http")?C:`https://${C}`)}),l.append(h);let g=document.createElement("div");g.className="le-hint",g.textContent="Nothing changes on your site until you publish.";let w=(C,I,_,D)=>{let W=document.createElement("label");W.className="le-field le-divided",W.append(I);let Z=document.createElement("input");if(Z.type="text",Z.dataset.imgAttr=C,Z.value=_??"",Z.className="le-input",W.append(Z),D){let ie=document.createElement("span");ie.className="le-hint",ie.textContent=D,W.append(ie)}return W},y=F("div","le-ways"),b=({url:C,file:I,credit:_,alt:D,creditBy:W,creditUrl:Z,creditSource:ie,creditSourceUrl:go})=>{if(I){let Wt=new DataTransfer;Wt.items.add(I),p.querySelector("input[type=file]").files=Wt.files,u(URL.createObjectURL(I))}else C&&(h.value=C,u(C));let ut=E.querySelector('[data-img-attr="alt"]');D&&ut&&ut.value.trim()===""&&(ut.value=D),v.credit={credit:_??"",creditBy:W??"",creditUrl:Z??"",creditSource:ie??"",creditSourceUrl:go??""},v.creditFor=v.target,S(v.credit),d.saveButton.click()},x=F("p","le-credit"),S=C=>{let I=(C?.credit??"").trim();x.textContent=I,x.hidden=I===""};S({credit:Ge(e,"data-edit-credit","editCredit")});let T=F("button","le-btn le-wide",t?"Replace background":"Replace image");if(T.type="button",T.addEventListener("click",()=>It(e,b,"Free photos",t?"background":"image")),y.append(T),p.hidden=!0,l.hidden=!0,E.append(n,x,y,p,l,g),v.target.startsWith("setting:")&&!t&&E.append(w("alt","Alt text",Ge(e,"alt","editAlt"),"Describes the image for search engines and screen readers."),w("imgTitle","Title attribute",Ge(e,"title","editTitle"),"Optional tooltip shown on hover.")),v.target.startsWith("setting:")){let C=document.createElement("button");C.type="button",C.textContent=t?"Remove background":"Remove image",C.className="le-btn-danger",C.addEventListener("click",async()=>{let I=t?"Remove this background image? The section keeps its layout and colour.":"Remove this image? The section keeps its layout; you can add a new image any time.";if(!window.confirm(I))return;let _=new FormData;_.append("target",v.target),_.append("remove","1"),await B("/live-edit/image",{method:"POST",body:_}),O("Removed \u2713")}),E.append(C)}ue(e)},Ft=e=>e?.closest?.("a[data-edit], a[data-edit-href]")??null,lo=e=>{let t=e?.getAttribute("href")??"";return t!==""&&t!=="#"&&!t.startsWith("javascript:")},he=null,it=!1,Je=null,st=()=>{Je&&(clearTimeout(Je),Je=null)},Rt=()=>{st(),Je=setTimeout(()=>{it||Pe()},140)},co=e=>{if(e===he&&!J.classList.contains("hidden"))return;he=e;let t=e.getBoundingClientRect();J.style.top=`${t.top+window.scrollY-10}px`,J.style.left=`${t.right+window.scrollX-10}px`,J.classList.add("is-visible")},Pe=()=>{J.classList.remove("is-visible"),he=null},Dt=e=>{if(!e?.closest)return null;let t=e.closest("[data-style-edit]");if(t)return{element:t,kind:"style"};let n=e.closest("[data-edit-img]");if(n)return{element:n,kind:"image"};let i=e.closest("[data-edit-icon]");if(i)return{element:i,kind:"icon"};let c=e.closest("[data-edit-svg]");if(c)return{element:c,kind:"svg"};let u=e.closest("[data-edit]");if(u)return{element:u,kind:"text"};let p=e.closest("[data-edit-href]:not([data-edit])");if(p)return{element:p,kind:"link"};let l=e.closest("[data-edit-bg]");if(l)return{element:l,kind:"image"};let h=e.closest("[data-style]:not([data-style-edit])");return h?{element:h,kind:"style"}:null},po=({element:e,kind:t})=>{t==="image"?rt(e):t==="icon"?so(e):t==="svg"?zt(e):t==="text"?We(e):t==="link"?nt(e):at(e)},lt=null,fe=()=>d.hoverBox.classList.remove("is-visible"),uo=e=>{let t=e.getBoundingClientRect();if(t.width<4||t.height<4){fe();return}Object.assign(d.hoverBox.style,{top:`${t.top}px`,left:`${t.left}px`,width:`${t.width}px`,height:`${t.height}px`}),d.hoverBox.classList.toggle("is-flipped",t.top<26),d.hoverLabel.textContent=e.dataset.editLabel??Y(e),d.hoverBox.classList.add("is-visible")};document.addEventListener("pointermove",e=>{if(!document.body.classList.contains("editing")){fe();return}if(e.target===d.root||d.root.contains(e.target)){fe();return}lt||(lt=requestAnimationFrame(()=>{lt=null;let t=Dt(e.target);t?uo(t.element):fe()}))}),document.addEventListener("scroll",fe,!0),document.addEventListener("pointerleave",fe);let Ye=null,dt=()=>{Q.classList.remove("is-visible"),Ye=null},ho=e=>{Ye=e;let t=e.getBoundingClientRect();Q.style.top=`${Math.max(t.top,8)+8}px`,Q.style.left=`${t.left+8}px`,Q.classList.add("is-visible")};Q.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),Ye&&at(Ye),dt()}),document.addEventListener("pointerover",e=>{if(!document.body.classList.contains("editing"))return;let t=e.target.closest?.("[data-has-bg]");t&&ho(t);let n=Ft(e.target);n&&lo(n)&&(st(),co(n))}),document.addEventListener("pointerout",e=>{document.body.classList.contains("editing")&&e.relatedTarget!==J&&(Ft(e.relatedTarget)===he&&he||Rt())}),J.addEventListener("pointerenter",()=>{it=!0,st()}),J.addEventListener("pointerleave",()=>{it=!1,Rt()}),J.addEventListener("click",e=>{if(e.preventDefault(),e.stopPropagation(),!he)return;let t=he;t.dataset.edit!==void 0?We(t):nt(t),Pe()}),document.addEventListener("click",e=>{if(!document.body.classList.contains("editing")||ot||e.target===d.root||d.root.contains(e.target)||e.target.closest("[data-live-create]"))return;let t=Dt(e.target);t&&(e.preventDefault(),e.stopPropagation(),po(t))},!0),document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$.classList.contains("is-open")&&Ee(),!document.body.classList.contains("editing")||e.key!=="Enter"&&e.key!==" "||d.shadow.activeElement)return;let t=document.activeElement;t?.matches("[data-edit-img], [data-edit-bg]")?(e.preventDefault(),rt(t)):t?.matches("[data-edit]")&&!t.matches("button, a")&&(e.preventDefault(),We(t))}),ne?.addEventListener("click",()=>Se(!document.body.classList.contains("editing"))),d.changesButton?.addEventListener("click",()=>{document.body.classList.contains("editing")||Se(!0),Te("Changes"),et()});let qt=e=>{if(window.liveEditPublishing){e(window.liveEditPublishing);return}L().then(()=>window.liveEditPublishing&&e(window.liveEditPublishing))};qt(e=>{let t=e.pending??0,n=()=>{d.publishButton.hidden=!1,d.previewButton.hidden=!1,d.publishLabel.textContent=t>0?"Publish":"Published",d.publishCount.textContent=String(t),d.publishCount.hidden=t===0,d.publishButton.disabled=t===0,d.publishButton.title=t>0?`Put ${t} change${t===1?"":"s"} live`:"Nothing is waiting to be published"};n();let i=async()=>{let u=t===1?"":"s",p=e.domain??window.location.host,l=d.modal({title:`Publish ${t} change${u}`,subtitle:`They go live on ${p} right away.`,size:"is-narrow"});l.body.append(K("Loading\u2026"));let h=F("button","le-btn-outline","Keep editing");h.type="button",h.addEventListener("click",()=>l.close());let g=F("button","le-btn-publish","Publish now");g.type="button",l.foot.hidden=!1,l.foot.append(h,g),g.focus();try{let b=(await(await B("/live-edit/changes",{method:"GET"})).json())?.changes??[],x=F("div","le-review");b.forEach(S=>{let T=F("div","le-review-row");T.append(F("div","le-review-what",re(S)),F("div","le-review-to",ke(S.after)||"(empty)")),x.append(T)}),l.body.replaceChildren(b.length>0?x:K("Nothing is waiting."))}catch(w){l.body.replaceChildren(K(M(w,"list what is waiting")))}g.addEventListener("click",async()=>{g.disabled=!0,h.disabled=!0,g.textContent="Publishing\u2026",l.allowDismiss(!1);try{await B("/live-edit/publish",{method:"POST"}),t=0,n(),l.close(),O(`Live on ${p} \u2713`)}catch(w){l.allowDismiss(!0),g.disabled=!1,h.disabled=!1,g.textContent="Try again",l.body.replaceChildren(K(M(w,"publish that")))}})};d.publishButton.addEventListener("click",()=>{t!==0&&(document.activeElement?.blur?.(),i())});let c=()=>{let u=document.body.classList.contains("editing");Ee(!0),Se(!1),d.toolbar.style.display="none";let p=document.createElement("div");p.className="le-back";let l=null,h=x=>{if(x&&!l){l=document.createElement("div"),l.className="le-phone";let S=document.createElement("iframe"),T=new URL(window.location.href);T.searchParams.set("live-edit","off"),S.src=T.toString(),S.title="This page on a phone",l.append(S),d.shadow.append(l)}else!x&&l&&(l.remove(),l=null)},w=[["Desktop",!1],["Phone",!0]].map(([x,S])=>{let T=F("button","le-back-btn",x);return T.type="button",T.addEventListener("click",()=>{w.forEach(C=>C.classList.remove("is-on")),T.classList.add("is-on"),h(S)}),p.append(T),T});if(w[0].classList.add("is-on"),e.previewUrl){let x=F("button","le-back-btn","Copy a link to this");x.type="button",x.title="A link that shows this unpublished version to somebody else",x.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(e.previewUrl),d.toast("Link copied \u2713")}catch{window.prompt("Copy this link:",e.previewUrl)}}),p.append(x)}let y=F("button","le-back-btn","Back to editing");y.type="button",y.addEventListener("click",()=>{h(!1),p.remove(),document.removeEventListener("keydown",b,!0),d.toolbar.style.display="",Se(u)});let b=x=>{x.key==="Escape"&&y.click()};document.addEventListener("keydown",b,!0),p.append(y),d.shadow.append(p),y.focus()};d.previewButton.addEventListener("click",c)});let fo=()=>{let e=document.querySelectorAll('nav, [role="navigation"], header ul'),t=new Map,n=i=>i.closest("#wpadminbar, #adminmenu, #wp-toolbar, #live-edit-ui, [data-no-edit], [data-live-edit-chrome]")!==null;return e.forEach(i=>{n(i)||i.querySelectorAll("a[href]").forEach(c=>{if(n(c))return;let u;try{u=new URL(c.getAttribute("href"),window.location.href)}catch{return}if(u.origin!==window.location.origin||/\.(pdf|zip|jpe?g|png|gif|svg|webp|mp4|mp3)$/i.test(u.pathname)||u.pathname===window.location.pathname&&u.hash)return;let p=(c.textContent??"").replace(/\s+/g," ").trim();p===""||p.length>22||t.has(u.pathname)||t.set(u.pathname,{label:p,href:u.href})})}),[...t.values()].slice(0,6)};(()=>{let e=fo();if(e.length<2)return;let t=window.location.pathname.replace(/\/$/,"");e.forEach(n=>{let i=F("button","le-page-btn",n.label);i.type="button",i.title=n.href,new URL(n.href).pathname.replace(/\/$/,"")===t?i.classList.add("is-on"):i.addEventListener("click",()=>{sessionStorage.setItem("tb_editing","1"),window.location.href=n.href}),d.pageSwitcher.append(i)}),d.pageSwitcher.hidden=!1})();let Mt=`live-edit:redo:${o?.site??window.location.host}`,ct=()=>{try{return JSON.parse(sessionStorage.getItem(Mt)??"[]")}catch{return[]}},_t=e=>{try{sessionStorage.setItem(Mt,JSON.stringify(e.slice(-20)))}catch{}},Be=()=>{d.undoButton.disabled=(window.liveEditPublishing?.pending??0)===0,d.redoButton.disabled=ct().length===0};qt(Be),Be();let Ut=async()=>{d.undoButton.disabled=!0;let e;try{e=((await(await B("/live-edit/changes",{method:"GET"})).json())?.changes??[])[0]}catch(n){d.toast(M(n,"undo that")),Be();return}if(!e){d.toast("There is nothing left to undo. Everything is published."),Be();return}let t=re(e);try{await B("/live-edit/changes",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:e.key,kind:e.kind})})}catch(n){d.toast(M(n,"undo that")),Be();return}_t([...ct(),{key:e.key,kind:e.kind,value:e.after,label:t}]),O(`Undone: ${t}`)},Ht=async()=>{let e=ct(),t=e.pop();if(!t){d.toast("There is nothing to put back.");return}d.redoButton.disabled=!0;try{if(t.kind==="style")throw new Error("A styling change cannot be put back automatically yet.");await B("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:t.key,value:t.value,locale:window.liveEditLocale})})}catch(n){d.toast(M(n,"put that back")),d.redoButton.disabled=!1;return}_t(e),O(`Put back: ${t.label}`)};d.undoButton.addEventListener("click",()=>void Ut()),d.redoButton.addEventListener("click",()=>void Ht()),document.addEventListener("keydown",e=>{!(e.metaKey||e.ctrlKey)||e.key.toLowerCase()!=="z"||(d.shadow.activeElement??document.activeElement)?.closest?.('input, textarea, [contenteditable="true"]')||(e.preventDefault(),e.shiftKey?Ht():Ut())}),d.closeButton.addEventListener("click",()=>Ee()),d.cancelButton.addEventListener("click",()=>Ee()),d.saveButton.addEventListener("click",_n),q?.addEventListener("click",async()=>{!v||v.kind!=="record"||window.confirm("Delete this item?")&&(await B(`/live-edit/record/${v.type}/${v.id}`,{method:"DELETE"}),O("Deleted \u2713"))}),document.querySelectorAll("[data-live-create]").forEach(e=>{e.addEventListener("click",async()=>{await B("/live-edit/record/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:e.dataset.liveCreate})}),O("Added \u2713 \u2014 click it to edit")})});let pt=new URLSearchParams(window.location.search);if(pt.has("edit")){pt.delete("edit");let e=pt.toString();window.history.replaceState(null,"",window.location.pathname+(e?`?${e}`:"")),Se(!0)}else Se(sessionStorage.getItem("tb_editing")==="1")}};window.liveEditDisplayedValue=o=>bt({editValue:o.dataset.editValue,ownText:se(o),fullText:o.textContent});var Tt=(()=>{let o=!1;return()=>{o||new URLSearchParams(window.location.search).get("live-edit")!=="off"&&(o=!0,_o())}})();document.readyState==="complete"?Tt():(window.addEventListener("load",Tt,{once:!0}),window.setTimeout(Tt,2e3));
