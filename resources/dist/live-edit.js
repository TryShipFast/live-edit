var fo=Object.defineProperty;var ze=(o,a)=>()=>(o&&(a=o(o=0)),a);var ut=(o,a)=>{for(var r in a)fo(o,r,{get:a[r],enumerable:!0})};var Gt,Kt,Xt,ko,Qt,Zt,ft,de,en,tn,nn,Ye,Eo,Ge,bt=ze(()=>{Gt=o=>{let[a,...r]=String(o??"").split(":");return{kind:a,key:r.join(":"),parts:r}},Kt=(o,a={})=>({...a,headers:{"X-CSRF-TOKEN":o,Accept:"application/json",...a.headers??{}}}),Xt=o=>(o?.headers?.get?.("content-type")??"").includes("json"),ko=/\.((?:fa|fas|far|fab|fal|fad|bi|ti|icon|flaticon|glyphicon|ion|mdi)-[a-z0-9][a-z0-9-]*)::?before/gi,Qt=o=>{let a=[];for(let r of String(o??"").split("}")){let s=r.indexOf("{");if(s===-1)continue;let b=r.slice(s+1).match(/content\s*:\s*(["'])(.*?)\1/);if(!b)continue;let c=b[2].match(/^\\([0-9a-f]{1,6})\s*$/i),k=c?String.fromCodePoint(parseInt(c[1],16)):b[2];if([...k].length===1)for(let T of r.slice(0,s).matchAll(ko))a.push({name:T[1],glyph:k})}return a},Zt=(o,a,r,s,b)=>{let c=o.filter(k=>k!==r&&!s.includes(k));return b.forEach(k=>c.includes(k)||c.push(k)),c.push(a),c.join(" ")},ft=({editValue:o,ownText:a,fullText:r})=>(o??"")!==""?o:(a??"").trim()!==""?a:r??"",de=o=>o.children.length?[...o.childNodes].filter(a=>a.nodeType===3).map(a=>a.textContent).join(" "):o.textContent,en=o=>{let a=new Set,r=[];for(let s of o)for(let b of s.icons)a.has(b.name)||(a.add(b.name),r.push({...b,face:s.face,variant:s.variant}));return r.sort((s,b)=>s.name.localeCompare(b.name))},tn=(o,a)=>{let r=Object.keys(a??{}),s=String(o??"").split(",").map(b=>b.trim()).filter(Boolean);return s.length===0?r:r.length===0?s:s.filter(b=>r.includes(b))},nn=(o,a={},r)=>{let s=String(r?.base??"").replace(/\/$/,""),[b,c]=String(o).split("?"),k={"/live-edit/setting":`${s}/${r?.site}/content`,"/live-edit/style":`${s}/${r?.site}/styles`,"/live-edit/publish":`${s}/${r?.site}/publish`,"/live-edit/image":`${s}/${r?.site}/media`,"/live-edit/upload":`${s}/${r?.site}/media`,"/live-edit/changes":`${s}/${r?.site}/changes`,"/live-edit/versions":`${s}/${r?.site}/versions`,"/live-edit/content":`${s}/${r?.site}/content`,"/live-edit/credits":`${s}/${r?.site}/credits`,"/live-edit/assist":`${s}/${r?.site}/assist`,"/live-edit/photos":`${s}/${r?.site}/photos`,"/live-edit/photos/used":`${s}/${r?.site}/photos/used`,"/live-edit/imagine":`${s}/${r?.site}/imagine`};if(o==="/live-edit/publish"&&r?.publishUrl)return{url:r.publishUrl,init:{...a,headers:{...a.headers??{},...r.publishHeaders??{},Accept:"application/json"},credentials:"same-origin"}};let T=k[b];if(!s||!r?.site||!r?.token)throw new Error("The content API is not configured on this page.");if(!T)throw new Error(`Editing that is not available over the content API yet (${b}).`);return{url:c?`${T}?${c}`:T,init:{...a,headers:{...a.headers??{},Authorization:`Bearer ${r.token}`,Accept:"application/json"}}}},Ye=(o,a,r)=>o.hasAttribute(a)?o.getAttribute(a):o.dataset?.[r]??"",Eo=(o,a)=>a==null?!0:a===408||a===425||a===429||a>=500,Ge=async(o,{tries:a=3,waits:r=[200,500],sleep:s=null}={})=>{let b=s??(k=>new Promise(T=>setTimeout(T,k))),c=null;for(let k=0;k<a;k++)try{return await o()}catch(T){if(c=T,k===a-1||!Eo(T,T.status))throw T;await b(r[Math.min(k,r.length-1)])}throw c}});var wt={};ut(wt,{applyTags:()=>mt,autoTag:()=>Ke,elementAt:()=>an,ensureBackgroundsAreFound:()=>Ao,fingerprint:()=>on,refreshBackgrounds:()=>To,resolveBackgrounds:()=>yt,watchForLateBackgrounds:()=>ln});var So,on,an,mt,Co,Lo,rn,sn,yt,Ao,To,ln,Ke,vt=ze(()=>{So="kb_tags_",on=o=>{let a=2166136261;for(let r=0;r<o.length;r++)a^=o.charCodeAt(r),a=Math.imul(a,16777619);return(a>>>0).toString(16)},an=(o,a)=>{let r=o.documentElement;for(let s of a)if(r=[...r?.children??[]][s],!r)return null;return r},mt=(o,a)=>{let r=0;for(let{at:s,attributes:b}of a??[]){let c=an(o,s);if(c){for(let[k,T]of Object.entries(b))c.hasAttribute(k)||c.setAttribute(k,T);r++}}return r},Co=o=>{try{return JSON.parse(window.sessionStorage?.getItem(o)??"null")}catch{return null}},Lo=(o,a)=>{try{window.sessionStorage?.setItem(o,JSON.stringify(a))}catch{}},rn=o=>o.hasAttribute("data-kb-bg")||o.hasAttribute("data-background")||o.hasAttribute("data-bg")||o.hasAttribute("data-background-image")||/background-image|url\(/i.test(o.getAttribute("style")??""),sn=(o,a)=>{if(rn(o))return!1;let r=a.getComputedStyle(o).backgroundImage;if(!r||r==="none"||!r.includes("url("))return!1;let s=r.match(/url\(\s*["']?([^"')]+)/)?.[1];return!s||s.startsWith("data:")?!1:(o.setAttribute("data-kb-bg",s),!0)},yt=(o=document)=>{let a=o.defaultView??window;if(!a?.getComputedStyle)return 0;let r=0;for(let s of o.querySelectorAll("body *"))sn(s,a)&&r++;return r},Ao=async(o,a=document)=>{let r=a.defaultView??window;if(r.liveEditBackgroundsWatched)return 0;r.liveEditBackgroundsWatched=!0;let s=await Ke(o,a);return ln(a,()=>{Ke(o,a).catch(b=>{console.warn("[live-edit] could not tag a late background:",b.message)})}),s},To=async(o,a=document)=>yt(a)===0&&a.querySelector("[data-kb-bg]:not([data-edit-bg])")===null?0:Ke(o,a),ln=(o=document,a=()=>{})=>{let r=o.defaultView??window;if(!r?.IntersectionObserver||!r.getComputedStyle)return null;let s=new Set,b=null,c=()=>{if(b=null,s.size===0)return;let $=[...s];s.clear(),a($)},k=5,T=new WeakMap,F=$=>{if(sn($,r))return s.add($),I.unobserve($),b||(b=r.setTimeout(c,250)),!0;let K=(T.get($)??0)+1;return T.set($,K),K>=k&&I.unobserve($),!1},I=new r.IntersectionObserver($=>{for(let K of $){if(!K.isIntersecting)continue;let J=K.target;F(J)||r.setTimeout(()=>F(J),400)}},{rootMargin:"300px"}),R=[...o.querySelectorAll("body *")].filter($=>!rn($)),A=4e3;return R.length>A&&console.warn(`[live-edit] watching the first ${A} of ${R.length} elements for late backgrounds`),R.slice(0,A).forEach($=>I.observe($)),I},Ke=async({base:o,site:a,key:r,page:s},b=document)=>{let c=b.querySelector("[data-edit], [data-edit-img]")!==null;if(yt(b),c&&!(b.querySelector("[data-kb-bg]:not([data-edit-bg])")!==null))return 0;let T=b.documentElement.outerHTML,F=So+on(T),I=Co(F);if(I)return mt(b,I);let R=await fetch(`${String(o).replace(/\/$/,"")}/${a}/tag`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json",Authorization:`Bearer ${r}`},body:JSON.stringify({html:T,page:s??b.location?.pathname??""})});if(!R.ok)throw new Error(`Tagging answered ${R.status}`);let{elements:A}=await R.json();return Lo(F,A),mt(b,A)}});var No,$o,Oo,dn,cn,pn=ze(()=>{No=new Set(["svg","g","defs","symbol","use","title","desc","path","circle","ellipse","line","polygon","polyline","rect","text","tspan","textpath","lineargradient","radialgradient","stop","clippath","mask","pattern"]),$o=new Set(["viewbox","xmlns","width","height","fill","fill-rule","fill-opacity","stroke","stroke-width","stroke-linecap","stroke-linejoin","stroke-dasharray","stroke-dashoffset","stroke-opacity","stroke-miterlimit","opacity","d","points","x","y","x1","y1","x2","y2","cx","cy","r","rx","ry","transform","offset","stop-color","stop-opacity","gradientunits","gradienttransform","patternunits","clip-rule","clip-path","mask","id","class","role","aria-label","aria-hidden","focusable","preserveaspectratio","vector-effect","text-anchor","font-size","font-family"]),Oo=8,dn=o=>{let a=String(o??"").trim();if(a===""||!/<svg/i.test(a))return null;let r=new DOMParser().parseFromString(a,"image/svg+xml"),s=r.documentElement;return!s||s.tagName?.toLowerCase()!=="svg"||r.querySelector("parsererror")||(cn(s),s.children.length===0&&s.textContent.trim()==="")?null:s},cn=o=>{for(let a of[...o.childNodes]){if(a.nodeType===Oo){a.remove();continue}if(a.nodeType===1){if(!No.has(a.tagName.toLowerCase())){a.remove();continue}cn(a)}}for(let a of[...o.attributes]){let r=a.name.toLowerCase(),s=a.value,c=r==="href"||r==="xlink:href"?s.trim().startsWith("#"):$o.has(r);c&&/url\(/i.test(s)&&!/^url\(\s*#/i.test(s.trim())&&(c=!1),c||o.removeAttribute(a.name)}}});var St={};ut(St,{applyBackground:()=>bn,applyContent:()=>yn,applyIcon:()=>fn,applyOrder:()=>mn,applyStyles:()=>xn,applySvg:()=>gn,applyValue:()=>kt,defendContent:()=>wn,fetchContent:()=>En,fetchSnapshot:()=>kn,resolve:()=>Sn,styleRules:()=>vn});var xt,un,kt,Et,Po,gn,fn,bn,mn,yn,wn,vn,xn,kn,En,hn,Io,Sn,Ct=ze(()=>{pn();bt();xt=(o,a)=>Object.assign(new Error(o),{status:a}),un="setting:",kt=(o,a)=>{let r=o.tagName?.toLowerCase();if(r==="img"){o.setAttribute("src",a);return}if(r==="source"){o.setAttribute("srcset",a);return}Et(o,a)},Et=(o,a)=>{let r=[...o.childNodes].filter(s=>s.nodeType===Po);if(r.length===0){let s=[...o.children];if(s.length===1&&s[0].children.length===0){Et(s[0],a);return}o.append(a);return}r.forEach((s,b)=>{if(b>0){s.remove();return}s.nodeValue=a+(/\s$/.test(s.nodeValue)?" ":"")})},Po=3,gn=(o,a)=>{let r=dn(a);if(!r)return!1;let s=document.importNode(r,!0);for(let b of["class","width","height","style","data-edit-svg","data-edit-label"])o.hasAttribute(b)&&s.setAttribute(b,o.getAttribute(b));return o.replaceWith(s),!0},fn=(o,a)=>{let r=String(a).replace(/[^A-Za-z0-9_\- ]/g,"").split(/\s+/).filter(Boolean),s=o.getAttribute("data-edit-icon-current");if(r.length===0||!s)return!1;let b=r.length===1?(o.getAttribute("class")??"").trim().split(/\s+/).map(c=>c===s?r[0]:c):r;return o.setAttribute("class",b.join(" ")),o.setAttribute("data-edit-icon-current",r.length===1?r[0]:r[r.length-1]),!0},bn=(o,a)=>{for(let s of["data-background","data-bg","data-background-image"])o.hasAttribute(s)&&o.setAttribute(s,a);let r=(o.getAttribute("style")??"").replace(/background-image\s*:[^;]*;?/gi,"").trim();o.setAttribute("style",`${r?r.replace(/;?$/,";"):""}background-image:url('${a}')`)},mn=(o,a)=>{let r=0;for(let s of o.querySelectorAll("[data-edit-list]")){let b=s.getAttribute("data-edit-list");if(!Object.hasOwn(a,b))continue;let c;try{c=JSON.parse(a[b])}catch{continue}if(!Array.isArray(c)||c.length===0)continue;let k=new Map;for(let F of[...s.children])F.hasAttribute("data-edit-item")&&(k.set(F.getAttribute("data-edit-item"),F),s.removeChild(F));if(k.size===0)continue;let T=k.values().next().value;for(let F of c){let I=k.get(String(F));if(I){s.appendChild(I);continue}let R=T.cloneNode(!0);R.setAttribute("data-edit-item",String(F)),s.appendChild(R)}r++}return r},yn=(o,a)=>{let r=0;mn(o,a);for(let s of o.querySelectorAll("[data-edit]")){let b=s.getAttribute("data-edit")??"";if(!b.startsWith(un))continue;let c=b.slice(un.length);Object.hasOwn(a,c)&&(kt(s,a[c]),r++)}for(let s of o.querySelectorAll("[data-edit-img]")){let b=(s.getAttribute("data-edit-img")??"").replace(/^setting:/,"");Object.hasOwn(a,b)&&(kt(s,a[b]),r++);for(let[c,k]of[["Alt","alt"],["Title","title"]])if(Object.hasOwn(a,b+c)){let T=a[b+c];T===""&&k==="title"?s.removeAttribute("title"):s.setAttribute(k,T),r++}}for(let s of o.querySelectorAll("[data-edit-svg]")){let b=(s.getAttribute("data-edit-svg")??"").replace(/^setting:/,""),c=a[b];!Object.hasOwn(a,b)||String(c??"").trim()===""||gn(s,c)&&r++}for(let s of o.querySelectorAll("[data-edit-icon]")){let b=(s.getAttribute("data-edit-icon")??"").replace(/^setting:/,""),c=a[b];!Object.hasOwn(a,b)||c===""||fn(s,c)&&r++}for(let s of o.querySelectorAll("[data-edit-bg]")){let b=(s.getAttribute("data-edit-bg")??"").replace(/^setting:/,""),c=a[b];!Object.hasOwn(a,b)||c===""||(bn(s,c),r++)}for(let s of o.querySelectorAll("[data-edit-href]")){let b=s.getAttribute("data-edit-href");Object.hasOwn(a,b)&&(s.setAttribute("href",a[b]),r++)}return r},wn=(o,{limit:a=12,debounce:r=60}={})=>{let s=o.defaultView??(typeof window>"u"?null:window);if(!s?.MutationObserver)return null;let b=o.querySelectorAll("[data-edit], [data-edit-img], [data-edit-href]");if(b.length===0)return null;let c=new Map;for(let A of b)c.set(A,{words:A.hasAttribute("data-edit")?de(A):null,src:A.getAttribute("src"),href:A.hasAttribute("data-edit-href")?A.getAttribute("href"):null});let k=0,T=!1,F=null,I=()=>{if(F=null,!o.body?.classList?.contains("editing")){k++,T=!0;for(let[A,$]of c)A.isConnected&&($.words!==null&&de(A)!==$.words&&Et(A,$.words),$.src!==null&&A.getAttribute("src")!==$.src&&(A.setAttribute("src",$.src),A.removeAttribute("srcset")),$.href!==null&&A.getAttribute("href")!==$.href&&A.setAttribute("href",$.href));R.takeRecords(),T=!1,k>=a&&(R.disconnect(),console.warn(`[live-edit] this page keeps rewriting itself; the client's content was put back ${k} times and is now being left alone.`))}},R=new s.MutationObserver(()=>{T||F||k>=a||(F=s.setTimeout(I,r))});for(let A of b)R.observe(A,{characterData:!0,childList:!0,subtree:!0,attributes:!0,attributeFilter:["src","srcset","href"]});return R},vn=(o,a)=>{let r=`[data-style="${o}"]`,s="",b="";for(let[c,k]of Object.entries(a??{}))if(!(k===""||k===null||k===void 0)){if(c==="hidden"){s+=`body:not(.editing) ${r}{display:none !important}`,s+=`body.editing ${r}{opacity:.45}`;continue}b+={backgroundImage:`background-image:url('${k}') !important;background-size:cover !important;background-position:center !important;`,background:`background:${k} !important;`,textColor:`color:${k} !important;`,fontSize:`font-size:${k}px !important;`,radius:`border-radius:${k}px !important;`,paddingX:`padding-left:${k}px !important;padding-right:${k}px !important;`,paddingY:`padding-top:${k}px !important;padding-bottom:${k}px !important;`}[c]??""}return b===""?s:s+`${r}{${b}}`},xn=(o,a)=>{let r=Object.entries(a??{}).map(([k,T])=>vn(k,T)).join("");if(r==="")return 0;let s="live-edit-styles",b=o.getElementById?.(s)??o.querySelector?.(`#${s}`)??null,c=b??o.createElement("style");return c.id=s,c.textContent=r,b||(o.head??o.body)?.appendChild(c),Object.keys(a).length},kn=async({snapshot:o,locale:a})=>{let r=String(o).replace(/\/$/,""),s=await Ge(()=>fetch(`${r}/current.json`).then(c=>{if(!c.ok)throw xt(`Pointer answered ${c.status}`,c.status);return c.json()}));if(!s.version)return{settings:{},styles:{}};let b=a??"en";return Ge(async()=>{let c=await fetch(`${r}/v${s.version}/${b}.json`);if(!c.ok)throw xt(`Version answered ${c.status}`,c.status);return c.json()})},En=async({base:o,site:a,key:r,locale:s})=>{let b=`${String(o).replace(/\/$/,"")}/${a}/content${s?`?locale=${encodeURIComponent(s)}`:""}`;return Ge(async()=>{let c=await fetch(b,{headers:{Authorization:`Bearer ${r}`,Accept:"application/json"}});if(!c.ok)throw xt(`Content service answered ${c.status}`,c.status);return c.json()})},hn=async()=>{let o=typeof window<"u"?window.liveEditContent:null;if(!o)return;let a=null,r=null;try{let s=await Sn(o);s&&(s.styleProps&&(window.liveEditStyleProps=s.styleProps),typeof s.pending=="number"&&s.styleProps&&(window.liveEditPublishing={...window.liveEditPublishing??{},pending:s.pending}),a=yn(document,s.settings??{}),xn(document,s.styles??{}),window.liveEditStyles=s.styles??{},wn(document))}catch(s){r=s,console.warn("[live-edit] serving the words already in the page:",s.message)}Io({applied:a,failed:r?r.message:null})},Io=o=>{window.liveEditContentDone=o,document.dispatchEvent(new CustomEvent("live-edit:content",{detail:o}))},Sn=async o=>{if(o.snapshot)try{return await kn(o)}catch(a){let r=a.message.includes("fetch")?" (if the files are on another origin, the bucket or CDN must allow cross-origin reads)":"";if(!o.base)throw new Error(a.message+r);console.warn("[live-edit] falling back to the content API:",a.message+r)}return o.base&&o.site&&o.key?En(o):null};typeof document<"u"&&(document.readyState==="loading"?document.addEventListener("DOMContentLoaded",hn):hn())});var Nn={};ut(Nn,{collectFromFragment:()=>Ln,contentConfigFor:()=>Fo,currentSession:()=>jo,forget:()=>Bo,requestLink:()=>zo,store:()=>An,stored:()=>Tn});var Lt,Cn,Ln,An,Tn,Bo,zo,jo,Fo,$n=ze(()=>{Lt="kb_session",Cn="kb_session=",Ln=(o=window)=>{let a=o.location?.hash??"",r=a.indexOf(Cn);if(r===-1)return null;let s=decodeURIComponent(a.slice(r+Cn.length).split("&")[0]);if(s==="")return null;An(s,o);let b=a.slice(0,r).replace(/[#&]$/,"");return o.history?.replaceState?.(null,"",o.location.pathname+o.location.search+b),s},An=(o,a=window)=>{try{a.sessionStorage?.setItem(Lt,o)}catch{}},Tn=(o=window)=>{try{return o.sessionStorage?.getItem(Lt)??null}catch{return null}},Bo=(o=window)=>{try{o.sessionStorage?.removeItem(Lt)}catch{}},zo=async({base:o,site:a},r,s=window)=>(await fetch(`${String(o).replace(/\/$/,"")}/sign-in`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({site:a,email:r,return_to:s.location.origin+s.location.pathname})})).ok,jo=(o=window)=>Ln(o)??Tn(o),Fo=(o,a)=>{let r={base:o.api,site:o.site,locale:o.locale??null};return a?{...r,key:a,snapshot:null}:{...r,key:o.key,snapshot:o.snapshot??null}}});var bo=`
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
`,mo=`
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
`,C=(o,a,r)=>{let s=document.createElement(o);return a&&(s.className=a),r!==void 0&&(s.textContent=r),s};function Wt(){let o=document.createElement("style");o.id="live-edit-page-css",o.textContent=mo,document.head.append(o);let a=document.createElement("div");a.id="live-edit-ui",document.body.append(a);let r=a.attachShadow({mode:"open"}),s=document.createElement("style");s.textContent=bo,r.append(s);let b=window.liveEditToolbar??{},c=C("div","le-toolbar"),k=C("span","le-mark");k.innerHTML='<svg width="16" height="16" viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="3" width="20" height="20" rx="3" fill="none" stroke="#0B0C0F" stroke-width="2.5"/><path d="M16 15 L16 30 L19.6 26.4 L22.2 31.2 L24.6 30 L22 25.3 L27 25.3 Z" fill="#3148F5" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>';let T=C("span","le-status le-when-roomy"),F=C("span","le-dot"),I=C("span",null,"");T.append(F,I),c.append(k,T);let R=window.liveEditEditor??null;if(R?.greeting){let N=C("span","le-hello le-when-roomy","Welcome "+R.greeting);c.append(N)}let A=null,$=b.locales??{};Object.keys($).length>1&&(A=C("select","le-locale"),A.title="Language you are editing",Object.entries($).forEach(([N,B])=>{let H=C("option",null,B);H.value=N,H.selected=N===(b.locale??"en"),A.append(H)}),A.addEventListener("change",()=>{window.location.search="?locale="+A.value}),c.append(A));let K=C("button","le-bar-btn","Edit site");K.type="button";let J=N=>'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"'+(N?' style="transform: scaleX(-1)"':"")+'><path d="M9 14 4 9l5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 9h7a6 6 0 0 1 0 12H8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',X=C("button","le-round");X.type="button",X.title="Undo the last change you have not published",X.setAttribute("aria-label","Undo"),X.innerHTML=J(!1);let E=C("button","le-round");E.type="button",E.title="Put back what you just undid",E.setAttribute("aria-label","Redo"),E.innerHTML=J(!0);let U=C("div","le-pages");U.hidden=!0,U.setAttribute("role","group"),U.setAttribute("aria-label","Pages");let ce=C("button","le-bar-btn le-when-roomy","Changes");ce.type="button",ce.title="Everything you have changed and not published";let oe=C("button","le-bar-btn le-when-roomy","Preview");oe.type="button",oe.title="See the page the way a visitor will",oe.hidden=!0;let M=C("button","le-publish");M.type="button",M.title="Put your changes live",M.hidden=!0;let ae=C("span",null,"Publish"),y=C("span","le-publish-count");if(y.hidden=!0,M.append(ae,y),c.append(C("span","le-sep"),K,X,E,C("span","le-sep"),U,ce,oe,M),(b.links??[]).forEach(N=>{let B=C("a","le-btn-ghost",N.label);B.href=N.href,N.title&&(B.title=N.title),c.append(B)}),b.logout?.href)if((b.logout.method??"get").toLowerCase()==="post"){let N=document.createElement("form");N.method="POST",N.action=b.logout.href;let B=document.createElement("input");B.type="hidden",B.name="_token",B.value=document.body.dataset.csrf??"";let H=C("button","le-btn-ghost","Log out");H.type="submit",N.append(B,H),c.append(N)}else{let N=C("a","le-btn-ghost","Log out");N.href=b.logout.href,c.append(N)}let Z=C("div","le-drawer");Z.setAttribute("role","dialog"),Z.setAttribute("aria-modal","true"),Z.setAttribute("aria-label","Edit content");let Q=C("div","le-drawer-head"),Se=C("div","le-tabs");Se.setAttribute("role","tablist");let fe={};["Edit","Changes","History"].forEach(N=>{let B=C("button","le-tab",N);B.type="button",B.dataset.tab=N,B.setAttribute("role","tab"),N==="Edit"&&B.classList.add("is-on"),fe[N]=B,Se.append(B)});let be=C("button","le-close","\xD7");be.type="button",be.setAttribute("aria-label","Close"),Q.append(Se,be);let Ce=C("div","le-subject"),je=C("div","le-trail"),Fe=C("div","le-title","Text");Ce.append(C("div","le-eyebrow","Selected"),je,Fe);let Re=C("div","le-fields"),Le=C("div","le-foot"),pe=C("button","le-btn-danger le-start le-hidden","Delete");pe.type="button";let Ae=C("button","le-btn-outline","Cancel");Ae.type="button";let me=C("button","le-btn","Save changes");me.type="button",Le.append(pe,Ae,me),Z.append(Q,Ce,Re,Le);let ie=C("button","le-handle");ie.type="button",ie.setAttribute("aria-label","Edit this link"),ie.innerHTML="&#9998;";let ee=C("button","le-handle le-handle-bg");ee.type="button",ee.setAttribute("aria-label","Replace this background image"),ee.title="Replace background image",ee.textContent="Replace background";let re=C("div","le-hover"),Te=C("span","le-hover-label");return re.append(Te),r.append(c,Z,ie,ee,re),{root:a,shadow:r,toolbar:c,toggleButton:K,undoButton:X,redoButton:E,pageSwitcher:U,statusText:I,dot:F,localeSelect:A,drawer:Z,drawerFoot:Le,drawerTabs:fe,drawerSubject:Ce,drawerTitle:Fe,drawerTrail:je,drawerFields:Re,drawerDelete:pe,publishButton:M,publishLabel:ae,publishCount:y,previewButton:oe,changesButton:ce,closeButton:be,cancelButton:Ae,saveButton:me,linkHandle:ie,bgHandle:ee,hoverBox:re,hoverLabel:Te,toast:(N,B=1800)=>{let H=C("div","le-toast",N);r.append(H),setTimeout(()=>H.style.opacity="0",B),setTimeout(()=>H.remove(),B+600)},modal:({title:N,subtitle:B,size:H="",dismissable:Ne=!0}={})=>{let te=C("div","le-scrim"),D=C("div",`le-modal ${H}`.trim());D.setAttribute("role","dialog"),D.setAttribute("aria-modal","true");let V=C("div","le-modal-heading"),qe=C("div","le-modal-title",N??""),ye=C("div","le-modal-sub",B??"");ye.hidden=!B,V.append(qe,ye),D.setAttribute("aria-label",N??"Dialog");let se=C("button","le-close","\xD7");se.type="button",se.setAttribute("aria-label","Close");let Me=C("div","le-modal-head");Me.append(V,se);let $e=C("div","le-modal-tabs");$e.hidden=!0;let _e=C("div","le-modal-body"),Oe=C("div","le-modal-foot");Oe.hidden=!0,D.append(Me,$e,_e,Oe),te.append(D);let Qe=document.activeElement,we=!1,ve=()=>{we||(we=!0,document.removeEventListener("keydown",Ue,!0),te.remove(),Qe?.focus?.(),le.dismissable=!0)},Ue=_=>{_.key==="Escape"&&le.dismissable&&(_.stopPropagation(),ve())},le={dismissable:Ne};return se.addEventListener("click",ve),te.addEventListener("mousedown",_=>{_.target===te&&le.dismissable&&ve()}),document.addEventListener("keydown",Ue,!0),r.append(te),se.focus(),{card:D,body:_e,foot:Oe,tabs:$e,close:ve,title:_=>qe.textContent=_,subtitle:_=>{ye.textContent=_??"",ye.hidden=!_},allowDismiss:_=>{le.dismissable=_,se.hidden=!_}}}}}var gt="kb_verify",Jt=(o,a=globalThis)=>{try{a.sessionStorage?.setItem(gt,JSON.stringify(o))}catch{}},Vt=(o=globalThis)=>{try{let a=o.sessionStorage?.getItem(gt);return o.sessionStorage?.removeItem(gt),a?JSON.parse(a):null}catch{return null}},yo=(o,a)=>!a?.attr||!a?.marker?null:o.querySelector(`[${a.attr}="${a.marker.replace(/"/g,'\\"')}"]`),wo=(o,a)=>{if(!o)return null;if(a==="image"){let s=vo(o);return s?s.getAttribute("src"):null}if(a==="href")return o.getAttribute("href");if(a==="icon")return o.getAttribute("class")??"";let r=[...o.childNodes].filter(s=>s.nodeType===3).map(s=>s.textContent).join(" ").trim();return ne(r===""?o.textContent:r)},vo=o=>o.tagName?.toLowerCase()==="img"?o:o.querySelector("img")??o.parentElement?.querySelector("img")??null,ne=o=>String(o??"").replace(/\s+/g," ").trim(),xo=(o,a,r)=>{if(r===null)return!1;if(o==="image")return ht(r)!==""&&ht(r)===ht(a);if(o==="icon"){let s=ne(a).split(" ").filter(Boolean),b=ne(r).split(" ").filter(Boolean);return s.length>0&&s.every(c=>b.includes(c))}return o==="href"?ne(r)===ne(a)||ne(r).endsWith(ne(a)):ne(r)===ne(a)},ht=o=>String(o??"").split(/[?#]/)[0].split("/").filter(Boolean).pop()??"",Yt=(o,a)=>{if(!a?.kind)return null;let r=yo(o,a);if(!r)return null;let s=wo(r,a.kind);return{ok:xo(a.kind,a.value,s),wanted:a.value,saw:s,kind:a.kind}};bt();var Ro=()=>{let o=window.liveEditApi;o?.base&&o?.site&&Promise.resolve().then(()=>(vt(),wt)).then(r=>r.ensureBackgroundsAreFound({base:o.base,site:o.site,key:o.token})).catch(r=>console.warn("[live-edit] could not look for backgrounds:",r.message)),window.liveEditContent||Promise.resolve().then(()=>(Ct(),St)).then(r=>r.defendContent(document)).catch(r=>console.warn("[live-edit] could not guard this page's content:",r.message));let a=document.querySelector("[data-login-modal]");if(a){let r=()=>{a.classList.remove("hidden"),a.classList.add("flex"),a.querySelector("input[type=email]")?.focus()},s=()=>{a.classList.add("hidden"),a.classList.remove("flex")};document.querySelectorAll("[data-login-open]").forEach(b=>{b.addEventListener("click",c=>{c.preventDefault(),r()})}),a.querySelector("[data-login-close]")?.addEventListener("click",s),a.addEventListener("click",b=>{b.target===a&&s()}),a.dataset.error==="1"&&r()}if(document.body.hasAttribute("data-admin")){let r=document.body.dataset.csrf,s=()=>{sessionStorage.setItem("tb_scroll",String(window.scrollY)),window.location.reload()},b=sessionStorage.getItem("tb_scroll");b!==null&&(sessionStorage.removeItem("tb_scroll"),window.scrollTo(0,Number(b)));let c=Wt(),k=e=>c.toast(String(e??"").trim()||"Something went wrong.",9e3),T=sessionStorage.getItem("tb_toast");T&&(sessionStorage.removeItem("tb_toast"),c.toast(T));let F=()=>new Promise(e=>{if(!window.liveEditContent||window.liveEditContentDone){e(window.liveEditContentDone??null);return}let t=n=>e(n?.detail??null);document.addEventListener("live-edit:content",t,{once:!0}),setTimeout(()=>e(null),5e3)});F().then(e=>{let t=Vt();if(e?.failed){c.toast(t?"Saved \u2014 but this page could not load the latest content, so it may be showing an older version. Reload to try again.":"This page could not load your saved content, so it is showing the original. Nothing has been lost \u2014 reload to try again.",9e3);return}let n=t?Yt(document,t):null;n&&!n.ok&&(console.warn("[live-edit] the change was saved but the page still shows:",n.saw,`
  expected:`,n.wanted),c.toast("Saved \u2014 but this page is still showing the old version. Your change is stored; reload, and tell us if it stays this way.",9e3))});let I=e=>{sessionStorage.setItem("tb_toast",e),s()},R=(e,t=null,n=null)=>{let i=window.__liveEditReact;if(!i){I(e);return}let d=t!==null&&(i.apply??i.set)(t,n);c.toast(e),d||i.refresh()},{drawer:A,drawerTabs:$,drawerSubject:K,drawerTitle:J,drawerTrail:X,drawerFields:E,drawerDelete:U,toggleButton:ce,statusText:oe,linkHandle:M,bgHandle:ae}=c,y=null,Z=(e,t,n,i,d=!1)=>{let u=document.createElement("label");u.className="le-field",u.append(t);let p=e==="icon"?window.liveEditIcons:(window.liveEditSelects??{})[e],l=document.querySelector("[data-icon-templates]");if(e==="icon"&&Array.isArray(p)&&l){let g=document.createElement("input");g.type="hidden",g.name=e,g.value=n??"";let w=document.createElement("div");return w.className="le-icons",p.forEach(m=>{let f=document.createElement("button");f.type="button",f.title=m,f.dataset.iconChoice=m,f.className="le-icon"+(m===g.value?" is-active":"");let v=l.querySelector(`template[data-icon="${m}"]`);v?f.append(v.content.cloneNode(!0)):f.textContent=m,f.addEventListener("click",()=>{g.value=m,w.querySelectorAll("[data-icon-choice]").forEach(x=>{let L=x.dataset.iconChoice===m;x.className="le-icon"+(L?" is-active":"")}),g.dispatchEvent(new Event("input",{bubbles:!0}))}),w.append(f)}),u.append(g,w),u}if(Array.isArray(p)&&p.length<=6){let g=document.createElement("input");g.type="hidden",g.name=e,g.value=n??p[0];let w=document.createElement("div");return w.className="le-choices",p.forEach(m=>{let f=document.createElement("label");f.className="le-choice"+(m===g.value?" is-selected":"");let v=document.createElement("input");v.type="radio",v.name="le-choice-"+e,v.checked=m===g.value,v.addEventListener("change",()=>{g.value=m,w.querySelectorAll(".le-choice").forEach(x=>x.classList.remove("is-selected")),f.classList.add("is-selected"),g.dispatchEvent(new Event("input",{bubbles:!0}))}),f.append(v,document.createTextNode(m)),w.append(f)}),u.append(g,w),u}let h;if(Array.isArray(p)?(h=document.createElement("select"),p.forEach(g=>{let w=document.createElement("option");w.value=g,w.textContent=g,w.selected=g===n,h.append(w)})):(h=document.createElement("textarea"),h.rows=i,h.value=n??""),h.name=e,h.className="le-input",h.tagName==="TEXTAREA"){h.classList.add("le-prose");let g=()=>{h.style.height="auto",h.style.height=Math.min(h.scrollHeight+2,420)+"px"};h.addEventListener("input",g),requestAnimationFrame(g)}if(d&&h.tagName==="TEXTAREA"){let g=document.createElement("div");g.className="le-tools";let w=(v,x)=>{let L=h.selectionStart,S=h.selectionEnd,O=h.value.slice(L,S)||"text";h.setRangeText(v+O+x,L,S,"select"),h.dispatchEvent(new Event("input",{bubbles:!0})),h.focus()},m=(v,x,L,S="")=>{let O=document.createElement("button");return O.type="button",O.title=x,O.textContent=v,O.className="le-tool "+S,O.addEventListener("click",L),O};g.append(m("B","Bold",()=>w("**","**"),"is-bold"),m("I","Italic",()=>w("*","*"),"is-italic"),m("Link","Insert link",()=>{let v=window.prompt("Link URL (https://\u2026 or /page):");if(!v)return;let x=h.selectionStart,L=h.selectionEnd,S=h.value.slice(x,L)||"link text";h.setRangeText("["+S+"]("+v+")",x,L,"select"),h.dispatchEvent(new Event("input",{bubbles:!0})),h.focus()}));let f=document.createElement("span");f.className="le-hint",f.textContent="**bold** \xB7 *italic* \xB7 [text](url)",g.append(f),u.append(g)}return u.append(h),u},Q=e=>{let t=e.tagName;if(t==="IMG")return"Image";if(t==="BUTTON")return"Button";if(t==="A")return/\b(btn|button)\b/i.test(String(e.className))?"Button":"Link";if(/^H[1-6]$/.test(t))return"Heading";if(t==="P")return"Paragraph";if(t==="LI")return"List item";if(t==="UL"||t==="OL")return"List";if(t==="NAV")return"Menu";if(t==="HEADER")return"Header";if(t==="FOOTER")return"Footer";if(t==="FORM")return"Form";if(e.dataset.editRegion)return e.dataset.editRegion;if(e.hasAttribute("data-edit-item"))return"Card";if(e.hasAttribute("data-edit-icon"))return"Icon";if(e.hasAttribute("data-edit-svg"))return"Drawing";if(e.hasAttribute("data-edit"))return"Text";if(e.hasAttribute("data-has-bg")||e.hasAttribute("data-edit-bg"))return"Background";if(t==="SECTION"||t==="MAIN"||t==="ARTICLE")return"Section";let n=e.getBoundingClientRect();return n.width>window.innerWidth*.6&&n.height>180?"Section":"Group"},Se=(e,t)=>{let n=e.tagName,i;return n==="IMG"?i=["radius","hidden"]:n==="A"||n==="BUTTON"?i=["background","textColor","fontSize","radius","hidden"]:/^(H[1-6]|P|SPAN|LI|BLOCKQUOTE|FIGCAPTION|DT|DD|TD|TH|CAPTION|CITE|Q|LABEL|STRONG|EM)$/.test(n)?i=["textColor","fontSize","hidden"]:i=["background","backgroundImage","paddingY","paddingX","radius","hidden"],t.filter(d=>i.includes(d.trim()))},fe=({hint:e="PNG, JPG or WEBP, or drag one here",onFile:t}={})=>{let n=document.createElement("label");n.className="le-upload";let i=document.createElement("div");i.className="le-upload-inner";let d=document.createElement("span");d.className="le-upload-icon",d.textContent="\u2191";let u=document.createElement("span");u.className="le-upload-text";let p=document.createElement("span");p.className="le-upload-title",p.textContent="Upload from your computer";let l=document.createElement("span");l.className="le-upload-hint",l.textContent=e,u.append(p,l);let h=document.createElement("span");h.className="le-upload-btn",h.textContent="Choose file",i.append(d,u,h);let g=document.createElement("input");g.type="file",g.accept="image/*";let w=m=>{m&&(l.textContent=m.name,t?.(m))};return g.addEventListener("change",()=>w(g.files[0])),["dragenter","dragover"].forEach(m=>n.addEventListener(m,f=>{f.preventDefault(),n.classList.add("is-dragover")})),["dragleave","drop"].forEach(m=>n.addEventListener(m,f=>{f.preventDefault(),n.classList.remove("is-dragover")})),n.addEventListener("drop",m=>{let f=m.dataTransfer?.files?.[0];if(!f)return;let v=new DataTransfer;v.items.add(f),g.files=v.files,w(f)}),n.append(i,g),n},be=e=>{let t=String(e).match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);return!t||t[4]!==void 0&&Number(t[4])===0?"":"#"+[1,2,3].map(n=>Number(t[n]).toString(16).padStart(2,"0")).join("")},Ce=e=>{if(!e)return"";let t=e.dataset.background||e.dataset.bg||e.dataset.backgroundImage;if(t)return t;let i=(getComputedStyle(e).backgroundImage||"").match(/url\((['"]?)(.*?)\1\)/);return i&&!i[2].startsWith("data:")?i[2]:""},je={background:"Background colour",backgroundImage:"Background image",textColor:"Text colour",fontSize:"Text size",paddingY:"Space above and below",paddingX:"Space left and right",radius:"Corner rounding"},Fe=(e,t,n,i)=>{let d=document.createElement("label");d.className="le-field";let u=e.replace(/([A-Z])/g," $1").toLowerCase(),p=je[e]??u.charAt(0).toUpperCase()+u.slice(1);if(d.append(p),t==="toggle"){let l=document.createElement("div");l.className="le-row";let h=document.createElement("input");h.type="checkbox",h.checked=n==="1",h.dataset.styleProp=e;let g=document.createElement("span");g.className="le-hint",g.textContent="Hidden from visitors. You still see it, dimmed, while editing.",l.append(h,g);let w=i?Q(i).toLowerCase():"section";return d.replaceChildren(`Hide this ${w}`,l),d.className="le-field le-divided",d}if(t==="color"){let l=document.createElement("div");l.className="le-row";let h=document.createElement("input");h.type="color";let g=i?be(getComputedStyle(i)[e==="textColor"?"color":"backgroundColor"]):"";h.value=n||g||"#ffffff",h.dataset.styleProp=e,h.className="le-color";let w=document.createElement("label");w.className="le-default";let m=document.createElement("input");m.type="checkbox",m.checked=!n,h.addEventListener("input",()=>m.checked=!1),w.append(m,"Use default"),l.append(h,w),d.append(l)}else if(t==="url"){let l=document.createElement("input");l.type="text",l.value=n??"",l.placeholder="Paste an image URL, or upload below",l.dataset.styleProp=e,l.className="le-input";let h=document.createElement("img");h.className="le-thumb",h.alt="";let g=S=>{h.src=S||"",h.style.display=S?"":"none"},w=n?"":Ce(i),m=document.createElement("span");m.className="le-hint";let f=(S,O)=>{m.textContent=S?O?"Current image (from the theme) \u2014 upload or paste a link to replace it":"Replacing with this image":"No image set",m.title=S||""};g(n||w),f(n||w,!n&&!!w),l.addEventListener("input",()=>{let S=l.value.trim();g(S||w),f(S||w,!S&&!!w)});let v=fe({onFile:async S=>{g(URL.createObjectURL(S));let O=new FormData;O.append("file",S);try{let j=await(await P("/live-edit/upload",{method:"POST",body:O})).json();l.value=j.url,g(j.url),f(j.url,!1),l.dispatchEvent(new Event("input",{bubbles:!0}))}catch(q){k(D(q,"save that"))}}}),x=z("div","le-ways"),L=z("button","le-btn le-wide","Replace background");L.type="button",L.addEventListener("click",()=>It(i,async({url:S,file:O,credit:q})=>{let j=S;if(O){g(URL.createObjectURL(O));let Y=new FormData;Y.append("file",O);try{j=(await(await P("/live-edit/upload",{method:"POST",body:Y})).json()).url}catch(G){c.toast(D(G,"save that"));return}}j&&(l.value=j,g(j),f(j,!1),l.dispatchEvent(new Event("input",{bubbles:!0})),q&&c.toast(q,4e3))},"Free photos","background")),x.append(L),l.hidden=!0,v.hidden=!0,d.append(x,l,v,h,m)}else{let l=document.createElement("input");l.type="number",l.min=0,l.max=400,l.value=n??"",l.placeholder="default",l.dataset.styleProp=e,l.className="le-input",d.append(l)}return d},Re={background:"color",backgroundImage:"url",textColor:"color",fontSize:"px",paddingX:"px",paddingY:"px",radius:"px",hidden:"toggle"},Le=(e,t,n)=>{y.styleKey=e;let i=(window.liveEditStyles??{})[e]??{},d=document.createElement("div");d.className="le-section-heading",d.textContent="Style",E.append(d);let u=0;if((n?Se(n,t):t).forEach(p=>{let l=(window.liveEditStyleProps??{})[p]??Re[p];l&&(E.append(Fe(p,l,i[p],n)),u++)}),u===0){let p=document.createElement("div");p.className="le-hint",p.textContent="Nothing on this element can be restyled.",E.append(p)}},pe=document.createElement("style");document.head.append(pe);let Ae=(e,t)=>{let n=`[data-style="${e}"]`,i="",d="";for(let[u,p]of Object.entries(t))p&&(i+={hidden:"opacity:.45 !important;",backgroundImage:`background-image:url('${p}') !important;background-size:cover !important;background-position:center !important;`,background:`background:${p} !important;`,textColor:`color:${p} !important;`,fontSize:`font-size:${p}px !important;`,radius:`border-radius:${p}px !important;`,paddingX:`padding-left:${p}px !important;padding-right:${p}px !important;`,paddingY:`padding-top:${p}px !important;padding-bottom:${p}px !important;`}[u]??"",u==="paddingY"&&(d+=`section${n}>div{padding-top:0 !important;padding-bottom:0 !important}`));return i?d+`${n}{${i}}`:d},me=()=>{if(!y?.styleKey)return;let e=ee(),t=y.styleKey,n=Ae(t,e),i={background:"background",textColor:"color",fontSize:"font-size",radius:"border-radius",backgroundImage:"background-image"};for(let[d,u]of Object.entries(e))u||(d==="hidden"&&(n+=`body.editing [data-style="${t}"]{opacity:1 !important}`),i[d]&&(n+=`[data-style="${t}"]{${i[d]}:revert-layer !important}`),d==="paddingY"&&(n+=`[data-style="${t}"]{padding-top:revert-layer !important;padding-bottom:revert-layer !important}section[data-style="${t}"]>div{padding-top:revert-layer !important;padding-bottom:revert-layer !important}`),d==="paddingX"&&(n+=`[data-style="${t}"]{padding-left:revert-layer !important;padding-right:revert-layer !important}`));pe.textContent=n},ie=()=>{pe.textContent=""};E.addEventListener("input",()=>{y&&(y.dirty=!0),me()}),E.addEventListener("change",()=>{y&&(y.dirty=!0),me()});let ee=()=>{let e={};return E.querySelectorAll("[data-style-prop]").forEach(t=>{if(t.type==="checkbox")e[t.dataset.styleProp]=t.checked?"1":"";else if(t.type==="color"){let n=t.closest("div").querySelector("input[type=checkbox]").checked;e[t.dataset.styleProp]=n?"":t.value}else e[t.dataset.styleProp]=t.value}),e},re=null,Te=()=>{!re||!y||y.dirty||!A.classList.contains("is-open")||Ne!=="Edit"||re.isConnected&&Xe(re)},De=e=>e.dataset.editRegion?e.dataset.editRegion:e.dataset.editLabel?e.dataset.editLabel:e.querySelector(":scope > [data-style-edit]")?.dataset.editLabel??Q(e),Xe=e=>{if(re=e,e.dataset.editImg!==void 0)at(e);else if(e.dataset.edit!==void 0)He(e);else if(e.dataset.svgEdit!==void 0||e.dataset.editSvg!==void 0)zt(e);else if(e.dataset.editHref!==void 0)tt(e);else if(e.dataset.style!==void 0){let t=e.querySelector(":scope > [data-style-edit]");ot(t??e)}},N=e=>{y?.dirty&&!window.confirm("Discard unsaved changes?")||(ie(),Xe(e))},B=null,H=e=>{let t=B;B=e??null;let n=[],i=e?.parentElement;for(;i&&i!==document.body;)i.dataset&&(i.dataset.edit!==void 0||i.dataset.style!==void 0)&&n.unshift(i),i=i.parentElement;let d=[];n.forEach(p=>{let l=De(p);if(d.length&&d[d.length-1].label===l){d[d.length-1].node=p;return}d.push({node:p,label:l})});let u=d.slice(-3);t&&t!==e&&document.contains(t)&&!u.some(p=>p.node===t)&&u.unshift({node:t,label:`\u2190 ${De(t)}`}),X.replaceChildren(),X.classList.toggle("is-visible",u.length>0),u.forEach((p,l)=>{let h=p.node;l>0&&X.append("\u203A");let g=document.createElement("button");g.type="button",g.textContent=p.label,g.className="le-crumb",g.addEventListener("click",()=>N(h)),X.append(g)})},Ne="Edit",te=e=>{Ne=e,Object.entries($).forEach(([t,n])=>{n.classList.toggle("is-on",t===e),n.setAttribute("aria-selected",t===e?"true":"false")}),K.classList.toggle("le-hidden",e!=="Edit"),c.drawerFoot.classList.toggle("le-hidden",e!=="Edit"),e==="Changes"&&Ue(),e==="History"&&Pn()};Object.entries($).forEach(([e,t])=>{t.addEventListener("click",()=>{e!=="Edit"&&y?.dirty&&!window.confirm("Discard unsaved changes?")||(te(e),A.classList.contains("is-open")||Ze())})});let D=(e,t)=>{console.warn(`[live-edit] ${t}:`,e);let n=String(e?.message??"");return/failed to fetch|networkerror|load failed/i.test(n)?"No connection just now. Nothing has been lost; try again in a moment.":/\b401\b|\b403\b|unauthor|forbidden/i.test(n)?"Your editing session has expired. Reload the page to carry on.":/\b429\b|too many/i.test(n)?"That was a lot at once. Give it a few seconds and try again.":`Could not ${t}. Nothing has been lost; try again in a moment.`},V=null,qe=async()=>{if(window.liveEditApi)try{V=await(await P("/live-edit/credits",{method:"GET"})).json(),Te()}catch(e){console.warn("[live-edit] could not read the credit balance:",e),V=null}},ye=async()=>{if(!(window.liveEditStyleProps&&window.liveEditStyles)&&window.liveEditApi)try{let t=await(await P("/live-edit/content",{method:"GET"})).json();t?.styleProps&&(window.liveEditStyleProps=t.styleProps),t?.styles&&(window.liveEditStyles=t.styles),Te()}catch(e){console.warn("[live-edit] could not read what this site allows to be styled:",e)}},se=(e,t)=>{if(!V?.available||!t)return;let n=document.createElement("div");n.className="le-assist-head",n.append($e("AI assist"),Me()),E.append(n),[["rewrite","Rewrite"],["shorten","Shorten"]].forEach(([i,d])=>{let u=V.costs?.[i]??1,p=document.createElement("button");p.type="button",p.className="le-assist";let l=document.createElement("span");l.textContent=d;let h=document.createElement("span");h.className="le-assist-cost",h.textContent=`${u} credit${u===1?"":"s"}`,p.append(l,h),(V.balance??0)<u&&(p.disabled=!0,h.classList.add("is-short"),p.title="Not enough credits"),p.addEventListener("click",()=>void Qe(i,d,e,t,p,l)),E.append(p)})},Me=()=>{let e=document.createElement("span");return e.className="le-assist-balance",e.textContent=`${V?.balance??0} credits left`,e},$e=e=>{let t=document.createElement("div");return t.className="le-section-heading",t.textContent=e,t},_e=()=>(document.querySelector('meta[property="og:site_name"]')?.content??document.querySelector('meta[name="application-name"]')?.content??(document.title??"").split(/\s+[|\u2013\u2014-]\s+/).pop()??"").replace(/\s+/g," ").trim().slice(0,120),Oe=()=>(document.querySelector('meta[name="description"]')?.content??document.querySelector('meta[property="og:description"]')?.content??"").replace(/\s+/g," ").trim().slice(0,400),Qe=async(e,t,n,i,d,u)=>{d.disabled=!0,u.textContent="Thinking\u2026";let p;try{p=await(await P("/live-edit/assist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:e,text:i.value,heading:we(n),role:Q(n),page:window.location.pathname,site:_e(),about:Oe()})})).json()}catch(l){d.disabled=!1,u.textContent=t,c.toast(D(l,"rewrite that"));return}if(typeof p?.balance=="number"&&V&&(V.balance=p.balance),!p?.text){d.disabled=!1,u.textContent=t,c.toast(ve(p?.reason));return}i.value=p.text,i.dispatchEvent(new Event("input",{bubbles:!0})),i.focus(),d.disabled=!1,u.textContent=t,c.toast(`Rewritten. ${p.balance} credits left.`)},we=e=>(((e.closest("section, article, header, div[data-style]")??document.body).querySelector("h1, h2, h3")??document.querySelector("h1"))?.textContent??"").replace(/\s+/g," ").trim().slice(0,200),ve=e=>({not_enough_credits:"Not enough credits for that. You can buy more from your account.",no_suggestion:"No suggestion for this one. Your words are unchanged.",not_configured:"Rewriting is not switched on for this site yet.",nothing_to_work_with:"There are no words here to rewrite yet."})[e]??"Could not rewrite that just now. Your words are unchanged.",Ue=async()=>{E.replaceChildren(W("Loading\u2026"));let e;try{e=await(await P("/live-edit/changes",{method:"GET"})).json()}catch(n){E.replaceChildren(W(D(n,"show your changes")));return}let t=e?.changes??[];if(t.length===0){E.replaceChildren(W("No unpublished changes."));return}E.replaceChildren(),t.forEach(n=>{let i=document.createElement("div");i.className="le-change";let d=document.createElement("div");d.className="le-row le-change-head";let u=document.createElement("span");u.className="le-change-label",u.textContent=_(n);let p=document.createElement("button");if(p.type="button",p.className="le-chip-btn",p.textContent="Revert",p.addEventListener("click",()=>void On(n,p)),d.append(u,p),i.append(d),n.before){let h=document.createElement("p");h.className="le-change-before",h.textContent=le(n.before),i.append(h)}let l=document.createElement("p");l.className="le-change-after",l.textContent=le(n.after)||"(empty)",i.append(l),E.append(i)})},le=e=>{let t=String(e??"").replace(/\s+/g," ").trim();return t.length>70?`${t.slice(0,70)}\u2026`:t},_=e=>{let t=document.querySelector(`[data-edit="setting:${CSS.escape(e.key)}"], [data-edit-img="setting:${CSS.escape(e.key)}"], [data-style="${CSS.escape(e.key)}"]`);return t?Q(t):e.kind==="style"?"Styling":"Text"},On=async(e,t)=>{t.disabled=!0,t.textContent="Reverting\u2026";try{await P("/live-edit/changes",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:e.key,kind:e.kind})})}catch(n){t.disabled=!1,t.textContent="Revert",c.toast(D(n,"put that back"));return}I("Reverted \u2713")},Pn=async()=>{E.replaceChildren(W("Loading\u2026"));let e;try{e=await(await P("/live-edit/versions",{method:"GET"})).json()}catch(n){E.replaceChildren(W(D(n,"show what has been published")));return}let t=e?.versions??[];if(t.length===0){E.replaceChildren(W("Nothing published yet. Your first publish will appear here."));return}E.replaceChildren(),t.forEach((n,i)=>{let d=document.createElement("div");d.className="le-version";let u=document.createElement("span");u.className=i===0?"le-version-dot is-latest":"le-version-dot";let p=document.createElement("div"),l=document.createElement("p");l.className="le-change-after",l.textContent=n.restored_from?`Restored version ${n.restored_from}`:`Published ${n.changes??0} change${n.changes===1?"":"s"}`;let h=document.createElement("p");h.className="le-change-when",h.textContent=In(n.published_at),p.append(l,h),d.append(u,p),E.append(d)})},W=e=>{let t=document.createElement("p");return t.className="le-hint",t.textContent=e,t},In=e=>{if(!e)return"";let t=Math.round((Date.now()-new Date(e).getTime())/1e3);return t<90?"Just now":t<3600?`${Math.round(t/60)} minutes ago`:t<86400?`${Math.round(t/3600)} hours ago`:t<86400*8?`${Math.round(t/86400)} days ago`:new Date(e).toLocaleDateString()},Ze=()=>{Pe(),lt(),A.classList.add("is-open"),c.toolbar.classList.add("is-compact"),Ne==="Edit"&&E.querySelector("textarea, input:not([type=checkbox]), select")?.focus()},xe=(e=!1)=>{!e&&y?.dirty&&!window.confirm("Discard unsaved changes?")||(y?.restore?.(),ie(),A.classList.remove("is-open"),c.toolbar.classList.remove("is-compact"),y=null)},Bn=()=>document.querySelectorAll("[data-edit], [data-edit-img], [data-edit-bg], [data-edit-href], [data-edit-icon], [data-edit-svg]"),et=async(e,t=0)=>{try{if(e.cssRules){let n=[];for(let i of e.cssRules)i.styleSheet&&t<4?n.push(await et(i.styleSheet,t+1)):n.push(i.cssText);return n.join("")}}catch{}if(!e.href)return"";try{let n=await fetch(e.href);if(!n.ok)return"";let i=await n.text();if(t>=4)return i;let d=[...i.matchAll(/@import\s+(?:url\(\s*(["']?)([^"')]+)\1\s*\)|(["'])([^"']+)\3)/gi)].map(p=>p[2]||p[4]).filter(Boolean),u=await Promise.all(d.map(p=>et({href:new URL(p,e.href).href},t+1)));return i+u.join("")}catch{return""}},zn=null,jn=async()=>{let e=new Map;return(await Promise.all([...document.styleSheets].map(n=>et(n)))).forEach(n=>Qt(n).forEach(i=>e.set(i.name,i.glyph))),[...e].map(([n,i])=>({name:n,glyph:i})).sort((n,i)=>n.name.localeCompare(i.name))},Tt=()=>zn??(zn=jn()),Nt=()=>{document.querySelectorAll("[data-style]").forEach(e=>{if(e.hasAttribute("data-edit-bg"))return;let n=(getComputedStyle(e).backgroundImage||"").match(/url\((['"]?)(.*?)\1\)/),i=e.getBoundingClientRect(),d=n&&!n[2].startsWith("data:")&&i.width>=120&&i.height>=120;e.toggleAttribute("data-has-bg",!!d)})},Fn=()=>{document.querySelectorAll("[data-edit-icon]").forEach(e=>{let t=getComputedStyle(e,"::before").content;(t==="none"||t==="normal"||t==='""'||t==="")&&e.removeAttribute("data-edit-icon")})},ke=e=>{e&&Fn(),document.body.classList.toggle("editing",e),Bn().forEach(t=>{e?t.setAttribute("tabindex","0"):t.removeAttribute("tabindex")}),sessionStorage.setItem("tb_editing",e?"1":"0"),oe.textContent=e?"Click any outlined text or image":"",oe.parentElement?.classList.toggle("is-saying",e),!e&&typeof Pe=="function"&&Pe(),c.toolbar.classList.toggle("is-editing",e),ce.textContent=e?"Done editing":"Edit site",e?(Nt(),document.querySelector("[data-edit-icon]")&&Tt(),o?.base&&o?.site&&Promise.resolve().then(()=>(vt(),wt)).then(t=>t.refreshBackgrounds({base:o.base,site:o.site,key:o.token})).then(t=>{t&&Nt()}).catch(t=>console.warn("[live-edit] could not look again for backgrounds:",t.message))):(lt(),ge()),e||xe(!0)},Rn=async()=>{let e=window.liveEditApi,t=await Promise.resolve().then(()=>($n(),Nn)).catch(()=>null);if(t?.forget(window),!e||!t){window.location.reload();return}let n=window.prompt("Your editing session has ended. Enter your email address and we will send you a new link.");n&&(await t.requestLink(e,n,window).catch(()=>{}),k("If that address can edit this site, a link is on its way.")),window.location.reload()},P=async(e,t)=>{let n=window.liveEditApi,i=n?nn(e,t,n):null,d=i?await fetch(i.url,i.init):await fetch(e,Kt(r,t));if(d.status===419||d.status===401)throw await Rn(),new Error("Your editing session has ended.");if(!d.ok){let u=await d.json().catch(()=>({}));throw new Error(u.error?.message??u.message??"Could not save. Try again.")}if(!Xt(d))throw new Error("That did not save. Reload the page and try again.");return d},Dn=(e,t)=>{if(!e?.element)return null;let n=i=>{let d=e.element.getAttribute(i);return d===null?null:{attr:i,marker:d}};if(e.kind==="image"){let i=t.querySelector("input[type=url]")?.value.trim(),d=t.querySelector("input[type=file]")?.files?.[0],u=n("data-edit-img")??n("data-edit-bg");return i&&u?{...u,kind:"image",value:i}:null}if(e.kind==="icon"){let i=n("data-edit-icon");return i&&e.value?{...i,kind:"icon",value:e.value}:null}if(e.kind==="setting"&&typeof e.savedValue=="string"){let i=n("data-edit");return!i||/<[a-z][\s\S]*>/i.test(e.savedValue)||e.element.hasAttribute("data-edit-attr")?null:{...i,kind:"text",value:e.savedValue}}return null},qn=async e=>{let t=window.liveEditApi?.builderUrl;if(!t||e?.kind!=="setting"||typeof e.savedValue!="string"||!e.element)return;let n=e.element.closest(".elementor-element[data-id]");if(n)try{await fetch(t,{method:"POST",headers:{"Content-Type":"application/json",...window.liveEditApi?.publishHeaders??{}},body:JSON.stringify({page:window.location.href,element:n.dataset.id,value:e.savedValue})})}catch(i){console.warn("[live-edit] could not tell the page builder about this change:",i.message)}},Mn=async()=>{if(!y)return;let e=c.saveButton;e.disabled=!0,e.textContent="Saving\u2026";let t=()=>{e.disabled=!1,e.textContent="Save changes"};try{if(y.kind==="setting")await P("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:y.key,value:y.savedValue=y.value??E.querySelector("textarea, input[name=icon]")?.value??"",locale:window.liveEditLocale})});else if(y.kind==="record"){let n={};E.querySelectorAll("textarea, select, input[type=hidden][name]").forEach(i=>n[i.name]=i.value),await P("/live-edit/record",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:y.type,id:y.id,fields:n})})}else if(y.kind==="icon")await P("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:y.key,value:y.value})});else if(y.kind==="image"){let n=new FormData;n.append("target",y.target);let i=E.querySelector("input[type=file]").files[0],d=E.querySelector("input[type=url]").value.trim(),u=y.element?.getBoundingClientRect?.();u&&u.width>=1&&u.height>=1&&(n.append("fitWidth",String(Math.round(u.width))),n.append("fitHeight",String(Math.round(u.height))));let p=i!==void 0||d!==""&&d!==void 0;y.credit&&y.creditFor===y.target&&p&&Object.entries(y.credit).forEach(([h,g])=>n.append(h,g));let l=[...E.querySelectorAll("[data-img-attr]")];if(i?n.append("file",i):d&&n.append("url",d.startsWith("http")?d:`https://${d}`),l.forEach(h=>n.append(h.dataset.imgAttr,h.value)),!i&&!d&&l.length===0){t(),k("Choose a file from your computer or paste an image URL first.");return}await P("/live-edit/image",{method:"POST",body:n})}if(y.hrefKey){let n=E.querySelector("[data-link-field=href]").value.trim(),i=E.querySelector("[data-link-field=target]").checked;await P("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:y.hrefKey,value:n})}),y.targetKey&&await P("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:y.targetKey,value:i?"_blank":""})})}y.styleKey&&await P("/live-edit/style",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:y.styleKey,props:ee()})}),await qn(y),Jt(Dn(y,E)),R("Saved \u2713",y.key??null,y.savedValue??null)}catch(n){t(),k(n.message)}};qe(),ye();let z=(e,t,n)=>{let i=document.createElement(e);return t&&(i.className=t),n!=null&&(i.textContent=n),i},$t=e=>{let t=e.closest("section, article, header, div[data-style]");for(;t&&!t.querySelector("h1, h2, h3");)t=t.parentElement?.closest("section, article, header, div[data-style]")??null;let n=t?.querySelector("h1, h2, h3");return!t||!n?"":[...t.querySelectorAll("p, span, div, h4, h5, h6")].filter(d=>d.children.length===0).filter(d=>n.compareDocumentPosition(d)&Node.DOCUMENT_POSITION_PRECEDING).map(d=>(d.textContent??"").replace(/\s+/g," ").trim()).find(d=>d.length>3&&d.length<42)??""},_n=/^(the|and|with|for|your|our|from|that|this|they|them|will|have|more|about|into|just|than|then|when|what|where|very|been|here|there)$/,Ot=e=>{let t=new Set((document.title??"").toLowerCase().split(/[^a-z0-9]+/i).filter(Boolean));return(e??"").toLowerCase().split(/[^a-z0-9]+/i).filter(n=>n.length>3&&!_n.test(n)&&!t.has(n))},Un=e=>{let t=Ot($t(e)).slice(0,3);if(t.length>0)return t.join(" ");let n=Ot(we(e)).slice(0,3);return n.length>0?n.join(" "):"workplace"},Pt=e=>{let t=Un(e),n=(e.dataset.editLabel??"").toLowerCase().trim(),i=/hero|banner|header|cover/.test(n);return[...new Set([t,i?`${t} wide`:`${t} close up`,"workplace"].filter(Boolean))].slice(0,4)},Hn=e=>`${($t(e)||we(e)||"This page").replace(/[.\s]+$/,"")}. Photographic, natural daylight, calm and editorial, soft neutral tones to match the rest of the site. No text.`,It=(e,t,n="Free photos",i="image")=>{let d=c.modal({title:`Replace ${i}`,subtitle:e.dataset.editLabel??Q(e)}),u=document.createElement("div");d.body.append(u),d.tabs.hidden=!1;let p=w=>{d.close(),t(w)},l={Upload:()=>Wn(u,p),"Free photos":()=>void Jn(u,e,p),"Generate with AI":()=>Yn(u,e,p)},h=Object.keys(l).map(w=>{let m=document.createElement("button");return m.type="button",m.className="le-modal-tab",m.textContent=w,m.addEventListener("click",()=>g(w)),d.tabs.append(m),[w,m]}),g=w=>{h.forEach(([m,f])=>f.classList.toggle("is-on",m===w)),u.replaceChildren(),l[w]()};return g(l[n]?n:"Free photos"),d},Wn=(e,t)=>{e.append(fe({hint:"PNG, JPG or WEBP, or drag one here",onFile:l=>t({file:l})}));let n=z("div","le-row-tight"),i=document.createElement("input");i.type="url",i.className="le-search",i.placeholder="Or paste a link to a picture";let d=z("button","le-btn-outline","Use it");d.type="button";let u=()=>{let l=i.value.trim();l&&t({url:l.startsWith("http")?l:`https://${l}`})};d.addEventListener("click",u),i.addEventListener("keydown",l=>{l.key==="Enter"&&(l.preventDefault(),u())}),n.append(i,d),e.append(n);let p=z("p","le-hint","You can also drag a picture straight onto the image on the page.");p.style.marginTop="14px",e.append(p)},Jn=async(e,t,n)=>{let i=document.createElement("input");i.type="search",i.className="le-search",i.placeholder="Search free photographs";let d=document.createElement("div");d.className="le-chips";let u=document.createElement("div");u.className="le-grid";let p=document.createElement("p");p.className="le-hint",p.style.marginTop="16px",e.append(i,d,u,p);let l=()=>{u.replaceChildren();for(let g=0;g<6;g+=1)u.append(z("div","le-shimmer"))},h=async g=>{i.value=g,l();let w;try{w=await(await P(`/live-edit/photos?q=${encodeURIComponent(g)}`,{method:"GET"})).json()}catch(f){u.replaceChildren(W(D(f,"look for photographs")));return}let m=w?.photos??[];if(p.textContent=w?.source==="openverse"?"Free to use, including commercially. The photographer is credited automatically.":"Free to use under the Unsplash licence. The photographer is credited automatically.",m.length===0){u.replaceChildren(W(Vn(w?.reason,g)));return}u.replaceChildren(),m.forEach(f=>{let v=document.createElement("button");v.type="button",v.className="le-pick";let x=document.createElement("img");x.className="le-pick-shot",x.src=f.thumb??f.full,x.alt=f.alt??"",x.loading="lazy";let L=z("span","le-pick-by",f.by?`Photo by ${f.by}`:"");v.append(x,L),v.addEventListener("click",()=>{f.downloadLocation&&P("/live-edit/photos/used",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({download_location:f.downloadLocation})}).catch(()=>{}),n({url:f.full,alt:f.alt??"",credit:f.credit??(f.by?`Photo by ${f.by}`:""),creditBy:f.by??"",creditUrl:f.byUrl??"",creditSource:f.source??"",creditSourceUrl:f.sourceUrl??""})}),u.append(v)})};Pt(t).forEach((g,w)=>{let m=document.createElement("button");m.type="button",m.className="le-chip",m.textContent=g,m.addEventListener("click",()=>void h(g)),d.append(m),w===0&&m.classList.add("is-on")}),i.addEventListener("keydown",g=>{g.key==="Enter"&&(g.preventDefault(),i.value.trim()&&h(i.value.trim()))}),await h(Pt(t)[0])},Vn=(e,t)=>({not_configured:"Free photographs are not switched on for this site yet.",not_allowed:"The photo library would not accept this site\u2019s key. It needs setting up again.",unreachable:"Could not reach the photo library just now. Try again in a moment.",nothing_to_search_for:"Type what the picture should show."})[e]??`Nothing found for "${t}". Try fewer words.`,Yn=(e,t,n)=>{let i=Hn(t),d=z("div","le-suggest");d.append(z("div","le-eyebrow","Suggested for this spot"),z("div","le-suggest-text",i));let u=document.createElement("button");u.type="button",u.className="le-chip",u.style.marginTop="10px",u.textContent="Use this description",d.append(u);let p=document.createElement("textarea");p.className="le-textarea",p.placeholder="Describe the picture you want",u.addEventListener("click",()=>{p.value=i,p.focus()});let l=document.createElement("button");l.type="button",l.className="le-btn-publish",l.style.marginTop="14px",l.textContent="Make a picture \xB7 5 credits";let h=z("div","le-grid is-square");h.style.display="none",e.append(d,p,l,h),l.addEventListener("click",async()=>{let g=p.value.trim()||i;l.disabled=!0,l.textContent="Making\u2026",h.style.display="",h.replaceChildren();for(let f=0;f<4;f+=1)h.append(z("div","le-shimmer"));let w;try{w=await(await P("/live-edit/imagine",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:g})})).json()}catch(f){h.replaceChildren(W(D(f,"make a picture"))),l.disabled=!1,l.textContent="Try again \xB7 5 credits";return}let m=w?.images??[];if(typeof w?.balance=="number"&&(V={...V??{},balance:w.balance}),m.length===0){h.replaceChildren(W(Gn(w?.reason))),l.disabled=!1,l.textContent="Try again \xB7 5 credits";return}h.replaceChildren(),m.forEach(f=>{let v=document.createElement("button");v.type="button",v.className="le-pick";let x=document.createElement("img");x.className="le-pick-shot",x.src=f,x.alt="",v.append(x,z("span","le-tag","MADE")),v.addEventListener("click",()=>n({url:f,credit:"",creditSource:"Generated"})),h.append(v)}),l.disabled=!1,l.textContent="Make four more \xB7 5 credits"})},Gn=e=>({not_enough_credits:"Not enough credits to make a picture. You can buy more from your account.",not_configured:"Making pictures is not switched on for this site yet.",no_suggestion:"Nothing usable came back, so you have not been charged. Try describing it differently.",nothing_to_work_with:"Describe the picture you want first."})[e]??"Could not make a picture just now. You have not been charged.",Ee=null,Kn=(e,t)=>{if(!t)return;let n=de(e),i=!1;y.restore=()=>{i&&Ee&&Ee(e,n)},t.addEventListener("input",()=>{Ee&&(i=!0,Ee(e,t.value))}),Ee===null&&Promise.resolve().then(()=>(Ct(),St)).then(d=>Ee=d.applyValue).catch(d=>console.warn("[live-edit] could not preview words as you type:",d.message))},Xn=e=>{y.hrefKey=e.dataset.editHref,y.targetKey=e.dataset.editTarget;let t=document.createElement("div");t.className="le-field le-divided",t.append("Link");let n=document.createElement("input");n.type="text",n.dataset.linkField="href";let i=e.getAttribute("href")??"";n.value=i==="#"?"":i,n.placeholder="/contact or https://...",n.className="le-input le-link";let d=document.createElement("label");d.className="le-default";let u=document.createElement("input");u.type="checkbox",u.dataset.linkField="target",u.checked=e.getAttribute("target")==="_blank",d.append(u,"Open in a new tab"),t.append(n,d),E.append(t)},tt=e=>{y={kind:"link"},J.textContent=e.dataset.editLabel??"Link",E.replaceChildren(),U.classList.add("le-hidden"),ue(e)},He=e=>{let{kind:t,key:n,parts:i}=Gt(e.dataset.edit);if(E.replaceChildren(),U.classList.add("le-hidden"),t==="setting"){y={kind:t,key:n,element:e},J.textContent=e.dataset.editLabel??Q(e);let d=(window.liveEditRich?.settings??[]).includes(i[0]),u=ft({editValue:e.dataset.editValue,ownText:de(e),fullText:e.textContent}),p=d?u.trim():u.replace(/\s+/g," ").trim(),l=e.dataset.editAs==="icon";E.append(l?Z("icon","Icon",e.dataset.editValue??"",1,!1):Z("value","Text",p,6,d)),l||se(e,E.querySelector("textarea")),!l&&!d&&Kn(e,E.querySelector("textarea"))}else{let[d,u]=i;y={kind:"record",type:d,id:Number(u)};let p=e.dataset.editLabel??"Item",l=JSON.parse(e.dataset.editValues??"{}"),h=l.title??l.question??l.label??l.number;if(J.textContent=h?`${p}: ${h.slice(0,40)}`:p,Object.entries(l).forEach(([f,v])=>{let x=f.replace(/_/g," "),L=x.charAt(0).toUpperCase()+x.slice(1),S=(window.liveEditRich?.fields??[]).includes(`${d}.${f}`);E.append(Z(f,L,v,f==="detail"||f==="answer"?6:3,S))}),window.liveEditPublishing){let f=document.createElement("div");f.className="le-hint le-immediate",f.textContent="Changes here go live as soon as you save, without publishing.",E.append(f)}e.hasAttribute("data-edit-deletable")&&(U.textContent=`Delete this ${p.toLowerCase()}`,U.classList.remove("le-hidden"));let g=document.createElement("div");g.className="le-row";let w=document.createElement("span");w.className="le-label",w.textContent="Order";let m=(f,v)=>{let x=document.createElement("button");return x.type="button",x.textContent=v,x.className="le-chip-btn",x.addEventListener("click",async()=>{(await(await P("/live-edit/record/move",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:y.type,id:y.id,direction:f})})).json()).moved?I("Reordered \u2713"):k(f==="up"?"Already first.":"Already last.")}),x};g.append(w,m("up","\u2191 Move up"),m("down","\u2193 Move down")),E.prepend(g)}ue(e)},Qn=e=>{let t=e.closest?.("[data-edit-item]"),n=t?.parentElement?.dataset?.editList?t.parentElement:e.closest?.("[data-edit-list]");if(!n?.dataset?.editList)return;let i=()=>[...n.children].filter(h=>h.dataset.editItem).map(h=>h.dataset.editItem),d=async(h,g)=>{try{await P("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:n.dataset.editList,value:JSON.stringify(h)})}),I(g)}catch(w){k(w.message)}},u=document.createElement("div");u.className="le-section-heading",u.textContent="List";let p=document.createElement("div");p.className="le-row";let l=document.createElement("button");if(l.type="button",l.className="le-chip-btn",l.textContent=t?"+ Add another":"+ Add item",l.addEventListener("click",()=>{let h=i(),g=t?h.indexOf(t.dataset.editItem):h.length-1;h.splice(g+1,0,"n"+Date.now().toString(36)),d(h,"Added \u2713")}),p.append(l),t){let h=document.createElement("button");h.type="button",h.className="le-btn-danger",h.textContent="Delete this item",h.addEventListener("click",()=>{window.confirm("Delete this item?")&&d(i().filter(g=>g!==t.dataset.editItem),"Deleted \u2713")}),p.append(h)}E.append(u,p)},nt=!1,Zn=e=>{nt=!0,e.click(),window.setTimeout(()=>{nt=!1},0)},eo=e=>e.closest?.('a[href^="#"], [aria-controls], [aria-expanded], [data-toggle], [role="button"]')??null,to=e=>{let t=eo(e);if(t){let p=document.createElement("div");p.className="le-row";let l=document.createElement("button");l.type="button",l.className="le-chip-btn",l.textContent="Open this menu",l.title="Runs the control so you can edit what it reveals",l.addEventListener("click",()=>{xe(!0),Zn(t)}),p.append(l),E.append(p)}let n=e.closest?.("a[href]"),i=n?.getAttribute("href");if(!i||i==="#"||i.startsWith("javascript:"))return;let d=document.createElement("div");d.className="le-row";let u=document.createElement("button");u.type="button",u.className="le-chip-btn",u.textContent="Open this link \u2192",u.addEventListener("click",()=>{window.location.href=n.href}),d.append(u),E.append(d)},ue=(e,{styleKey:t=null,styleOn:n=e}={})=>{e.dataset.editHref!==void 0&&Xn(e),to(e);let i=t??n.dataset.styleEdit??n.dataset.style,d=tn(n.dataset.styleProps,window.liveEditStyleProps);i&&d.length&&Le(i,d,n),oo(e),Qn(e),H(e.dataset.styleEdit?e.closest("[data-style]")??e.parentElement:e),te("Edit"),Ze()},no=e=>{let t=(de(e)||e.textContent||"").replace(/\s+/g," ").trim();if(t)return t.slice(0,28);let n=(e.getAttribute("aria-label")??e.getAttribute("title")??"").trim();if(n)return n.slice(0,28);let i=e.className.toString().match(/(?:social-icon-|fa-|bi-|icon-)([a-z][a-z0-9-]{2,})/i)?.[1]??[...e.querySelectorAll("[class]")].map(d=>d.className.toString().match(/(?:social-icon-|fa-|bi-|icon-)([a-z][a-z0-9-]{2,})/i)?.[1]).find(Boolean);return i?i.charAt(0).toUpperCase()+i.slice(1):De(e)},oo=e=>{let t="[data-edit], [data-edit-img], [data-edit-bg], [data-edit-href], [data-edit-icon], [data-edit-svg]",n=[...e.querySelectorAll(t)].filter(p=>p.parentElement?.closest(t)===null||!e.contains(p.parentElement.closest(t))).filter(p=>p!==e&&p.getBoundingClientRect().width>0);if(n.length===0)return;let i=n.slice(0,24),d=document.createElement("div");d.className="le-section-heading",d.textContent=n.length>i.length?`Inside this \u2014 first ${i.length} of ${n.length}`:"Inside this",E.append(d);let u=document.createElement("div");u.className="le-row",i.forEach(p=>{let l=document.createElement("button");l.type="button",l.className="le-chip-btn",l.textContent=no(p),l.addEventListener("click",()=>N(p)),u.append(l)}),E.append(u)},ot=e=>{y={kind:"style"};let t=e.dataset.styleEdit??e.dataset.style;J.textContent=e.dataset.editLabel??Q(e),E.replaceChildren(),U.classList.add("le-hidden"),ue(e,{styleKey:t})},We=e=>{let t=getComputedStyle(e,"::before");return`${t.fontStyle} ${t.fontWeight} 20px ${t.fontFamily}`},Bt=(e,t)=>{let n=e.cloneNode(!1);n.removeAttribute("data-edit-icon"),Object.assign(n.style,{position:"absolute",visibility:"hidden",pointerEvents:"none"}),(e.parentNode??document.body).append(n);let i=We(n),d=[];return[...n.classList].forEach(u=>{u!==t&&(n.classList.remove(u),We(n)!==i&&d.push(u),n.classList.add(u))}),n.remove(),d},ao=(e,t,n,i)=>Zt([...e.classList],n,i,Bt(e,i),Bt(t,t.dataset.editIconCurrent)),io=(e,t)=>{let n=document.createElement("canvas").getContext("2d");return n.font=t,e.filter(({glyph:i})=>{let d=n.measureText(i);return(d.actualBoundingBoxAscent||0)+(d.actualBoundingBoxDescent||0)>0})},ro=async e=>{let t=e.dataset.editIconCurrent;y={kind:"icon",key:e.dataset.editIcon.replace(/^setting:/,""),value:t,element:e},J.textContent="Icon",E.replaceChildren(),U.classList.add("le-hidden");let n=We(e),i=await Tt();if(y?.element!==e)return;let d=new Map([[n,null]]);document.querySelectorAll("[data-edit-icon]").forEach(f=>{let v=We(f);d.has(v)||d.set(v,f)});let u=en([...d].map(([f,v])=>({face:f,variant:v,icons:io(i,f)})));if(u.length===0){let f=document.createElement("div");f.className="le-hint",f.textContent="This theme loads its icons from somewhere this page cannot read, so they cannot be listed. Type the icon name instead.";let v=document.createElement("label");v.className="le-field",v.append("Icon name");let x=document.createElement("input");x.type="text",x.className="le-input",x.value=t??"",x.addEventListener("input",()=>{y.value=x.value.trim(),y.dirty=!0}),v.append(x,f),E.append(v),ue(e);return}let p=e.className;y.restore=()=>{e.className=p,e.dataset.editIconCurrent=t};let l=document.createElement("input");l.type="search",l.className="le-input",l.placeholder=`Search ${u.length} icons\u2026`;let h=document.createElement("div");h.className="le-icon-grid";let g=document.createElement("div");g.className="le-hint";let w=400,m=f=>{let v=f.trim().toLowerCase().replace(/\s+/g,"-"),x=v?u.filter(({name:L})=>L.includes(v)):u;if(h.replaceChildren(),x.slice(0,w).forEach(({name:L,glyph:S,face:O,variant:q})=>{let j=document.createElement("button");j.type="button",j.className="le-icon-choice",j.title=L.replace(/^[a-z]+-/,"").replace(/-/g," "),j.classList.toggle("is-current",L===t),j.style.font=O,j.textContent=S,j.addEventListener("click",()=>{e.className=p,e.dataset.editIconCurrent=t;let Y=q?ao(e,q,L,t):L;q?e.className=Y:e.classList.replace(t,L),e.dataset.editIconCurrent=L,y.value=Y,y.dirty=!0,h.querySelectorAll(".le-icon-choice").forEach(G=>G.classList.remove("is-current")),j.classList.add("is-current")}),h.append(j)}),x.length===0){let L=document.createElement("div");L.className="le-hint",L.textContent="No icon matches that name.",h.append(L)}g.textContent=x.length>w?`Showing ${w} of ${x.length}. Type to narrow it down.`:""};l.addEventListener("input",()=>m(l.value)),m(""),E.append(l,h,g),ue(e)},zt=e=>{let t=e.outerHTML;y={kind:"setting",key:e.dataset.editSvg.replace(/^setting:/,""),element:e},J.textContent=e.dataset.editLabel??"Drawing",E.replaceChildren(),U.classList.add("le-hidden");let n=()=>{e.outerHTML=t};y.restore=n;let i=new Set,d=[];document.querySelectorAll("svg").forEach(m=>{let f=m.outerHTML,v=f.replace(/\s+(class|style|width|height|data-[\w-]+)="[^"]*"/g,"");i.has(v)||m.getBoundingClientRect().width<4||(i.add(v),d.push(f))});let u=document.createElement("div");u.className="le-icon-grid";let p=null;d.slice(0,120).forEach(m=>{let f=document.createElement("button");f.type="button",f.className="le-icon-choice",f.innerHTML=m;let v=f.firstElementChild;v&&(v.removeAttribute("class"),v.setAttribute("width","20"),v.setAttribute("height","20")),f.classList.toggle("is-current",m===t),f.addEventListener("click",()=>{p=m,y.value=m,y.dirty=!0;let x=document.querySelector(`[data-edit-svg="${e.dataset.editSvg}"]`)??e,L=new DOMParser().parseFromString(m,"image/svg+xml").documentElement;["class","width","height","style","data-edit-svg","data-edit-label"].forEach(S=>{x.hasAttribute(S)&&L.setAttribute(S,x.getAttribute(S))}),x.replaceWith(L),u.querySelectorAll(".le-icon-choice").forEach(S=>S.classList.remove("is-current")),f.classList.add("is-current")}),u.append(f)});let l=document.createElement("label");l.className="le-field le-divided",l.append("Or paste an SVG");let h=document.createElement("textarea");h.className="le-input le-prose",h.placeholder='<svg viewBox="0 0 24 24">\u2026</svg>',h.addEventListener("input",()=>{h.value.trim()!==""&&(y.value=h.value.trim(),y.dirty=!0)});let g=document.createElement("div");g.className="le-hint",g.textContent="Anything that could run or fetch is stripped before it is saved.",l.append(h,g);let w=document.createElement("div");w.className="le-section-heading",w.textContent=d.length?"Drawings on this site":"No other drawings here",E.append(w,u,l),ue(e)},at=e=>{let t=e.dataset.editKind==="background";y={kind:"image",target:e.dataset.editImg??e.dataset.editBg,element:e},J.textContent=e.dataset.editLabel??(t?"Background image":"Image"),E.replaceChildren(),U.classList.add("le-hidden");let n=document.createElement("div");n.className="le-preview";let i=document.createElement("img");i.alt="",i.className="";let d=e.dataset.editPreview;d?(i.src=d,n.append(i)):n.textContent="No image yet";let u=S=>{n.replaceChildren(i),i.src=S},p=fe({onFile:S=>u(URL.createObjectURL(S))}),l=document.createElement("label");l.className="le-field",l.append("Or paste an image URL");let h=document.createElement("input");h.type="url",h.placeholder="https://...",h.className="le-input",h.addEventListener("change",()=>{let S=h.value.trim();S&&u(S.startsWith("http")?S:`https://${S}`)}),l.append(h);let g=document.createElement("div");g.className="le-hint",g.textContent="Nothing changes on your site until you publish.";let w=(S,O,q,j)=>{let Y=document.createElement("label");Y.className="le-field le-divided",Y.append(O);let G=document.createElement("input");if(G.type="text",G.dataset.imgAttr=S,G.value=q??"",G.className="le-input",Y.append(G),j){let Be=document.createElement("span");Be.className="le-hint",Be.textContent=j,Y.append(Be)}return Y},m=z("div","le-ways"),f=({url:S,file:O,credit:q,alt:j,creditBy:Y,creditUrl:G,creditSource:Be,creditSourceUrl:go})=>{if(O){let Ht=new DataTransfer;Ht.items.add(O),p.querySelector("input[type=file]").files=Ht.files,u(URL.createObjectURL(O))}else S&&(h.value=S,u(S));let pt=E.querySelector('[data-img-attr="alt"]');j&&pt&&pt.value.trim()===""&&(pt.value=j),y.credit={credit:q??"",creditBy:Y??"",creditUrl:G??"",creditSource:Be??"",creditSourceUrl:go??""},y.creditFor=y.target,x(y.credit),c.saveButton.click()},v=z("p","le-credit"),x=S=>{let O=(S?.credit??"").trim();v.textContent=O,v.hidden=O===""};x({credit:Ye(e,"data-edit-credit","editCredit")});let L=z("button","le-btn le-wide",t?"Replace background":"Replace image");if(L.type="button",L.addEventListener("click",()=>It(e,f,"Free photos",t?"background":"image")),m.append(L),p.hidden=!0,l.hidden=!0,E.append(n,v,m,p,l,g),y.target.startsWith("setting:")&&!t&&E.append(w("alt","Alt text",Ye(e,"alt","editAlt"),"Describes the image for search engines and screen readers."),w("imgTitle","Title attribute",Ye(e,"title","editTitle"),"Optional tooltip shown on hover.")),y.target.startsWith("setting:")){let S=document.createElement("button");S.type="button",S.textContent=t?"Remove background":"Remove image",S.className="le-btn-danger",S.addEventListener("click",async()=>{let O=t?"Remove this background image? The section keeps its layout and colour.":"Remove this image? The section keeps its layout; you can add a new image any time.";if(!window.confirm(O))return;let q=new FormData;q.append("target",y.target),q.append("remove","1"),await P("/live-edit/image",{method:"POST",body:q}),I("Removed \u2713")}),E.append(S)}ue(e)},jt=e=>e?.closest?.("a[data-edit], a[data-edit-href]")??null,so=e=>{let t=e?.getAttribute("href")??"";return t!==""&&t!=="#"&&!t.startsWith("javascript:")},he=null,it=!1,Je=null,rt=()=>{Je&&(clearTimeout(Je),Je=null)},Ft=()=>{rt(),Je=setTimeout(()=>{it||Pe()},140)},lo=e=>{if(e===he&&!M.classList.contains("hidden"))return;he=e;let t=e.getBoundingClientRect();M.style.top=`${t.top+window.scrollY-10}px`,M.style.left=`${t.right+window.scrollX-10}px`,M.classList.add("is-visible")},Pe=()=>{M.classList.remove("is-visible"),he=null},Rt=e=>{if(!e?.closest)return null;let t=e.closest("[data-style-edit]");if(t)return{element:t,kind:"style"};let n=e.closest("[data-edit-img]");if(n)return{element:n,kind:"image"};let i=e.closest("[data-edit-icon]");if(i)return{element:i,kind:"icon"};let d=e.closest("[data-edit-svg]");if(d)return{element:d,kind:"svg"};let u=e.closest("[data-edit]");if(u)return{element:u,kind:"text"};let p=e.closest("[data-edit-href]:not([data-edit])");if(p)return{element:p,kind:"link"};let l=e.closest("[data-edit-bg]");if(l)return{element:l,kind:"image"};let h=e.closest("[data-style]:not([data-style-edit])");return h?{element:h,kind:"style"}:null},co=({element:e,kind:t})=>{t==="image"?at(e):t==="icon"?ro(e):t==="svg"?zt(e):t==="text"?He(e):t==="link"?tt(e):ot(e)},st=null,ge=()=>c.hoverBox.classList.remove("is-visible"),po=e=>{let t=e.getBoundingClientRect();if(t.width<4||t.height<4){ge();return}Object.assign(c.hoverBox.style,{top:`${t.top}px`,left:`${t.left}px`,width:`${t.width}px`,height:`${t.height}px`}),c.hoverBox.classList.toggle("is-flipped",t.top<26),c.hoverLabel.textContent=e.dataset.editLabel??Q(e),c.hoverBox.classList.add("is-visible")};document.addEventListener("pointermove",e=>{if(!document.body.classList.contains("editing")){ge();return}if(e.target===c.root||c.root.contains(e.target)){ge();return}st||(st=requestAnimationFrame(()=>{st=null;let t=Rt(e.target);t?po(t.element):ge()}))}),document.addEventListener("scroll",ge,!0),document.addEventListener("pointerleave",ge);let Ve=null,lt=()=>{ae.classList.remove("is-visible"),Ve=null},uo=e=>{Ve=e;let t=e.getBoundingClientRect();ae.style.top=`${Math.max(t.top,8)+8}px`,ae.style.left=`${t.left+8}px`,ae.classList.add("is-visible")};ae.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),Ve&&ot(Ve),lt()}),document.addEventListener("pointerover",e=>{if(!document.body.classList.contains("editing"))return;let t=e.target.closest?.("[data-has-bg]");t&&uo(t);let n=jt(e.target);n&&so(n)&&(rt(),lo(n))}),document.addEventListener("pointerout",e=>{document.body.classList.contains("editing")&&e.relatedTarget!==M&&(jt(e.relatedTarget)===he&&he||Ft())}),M.addEventListener("pointerenter",()=>{it=!0,rt()}),M.addEventListener("pointerleave",()=>{it=!1,Ft()}),M.addEventListener("click",e=>{if(e.preventDefault(),e.stopPropagation(),!he)return;let t=he;t.dataset.edit!==void 0?He(t):tt(t),Pe()}),document.addEventListener("click",e=>{if(!document.body.classList.contains("editing")||nt||e.target===c.root||c.root.contains(e.target)||e.target.closest("[data-live-create]"))return;let t=Rt(e.target);t&&(e.preventDefault(),e.stopPropagation(),co(t))},!0),document.addEventListener("keydown",e=>{if(e.key==="Escape"&&A.classList.contains("is-open")&&xe(),!document.body.classList.contains("editing")||e.key!=="Enter"&&e.key!==" "||c.shadow.activeElement)return;let t=document.activeElement;t?.matches("[data-edit-img], [data-edit-bg]")?(e.preventDefault(),at(t)):t?.matches("[data-edit]")&&!t.matches("button, a")&&(e.preventDefault(),He(t))}),ce?.addEventListener("click",()=>ke(!document.body.classList.contains("editing"))),c.changesButton?.addEventListener("click",()=>{document.body.classList.contains("editing")||ke(!0),te("Changes"),Ze()});let Dt=e=>{if(window.liveEditPublishing){e(window.liveEditPublishing);return}F().then(()=>window.liveEditPublishing&&e(window.liveEditPublishing))};Dt(e=>{let t=e.pending??0,n=()=>{c.publishButton.hidden=!1,c.previewButton.hidden=!1,c.publishLabel.textContent=t>0?"Publish":"Published",c.publishCount.textContent=String(t),c.publishCount.hidden=t===0,c.publishButton.disabled=t===0,c.publishButton.title=t>0?`Put ${t} change${t===1?"":"s"} live`:"Nothing is waiting to be published"};n();let i=async()=>{let u=t===1?"":"s",p=e.domain??window.location.host,l=c.modal({title:`Publish ${t} change${u}`,subtitle:`They go live on ${p} right away.`,size:"is-narrow"});l.body.append(W("Loading\u2026"));let h=z("button","le-btn-outline","Keep editing");h.type="button",h.addEventListener("click",()=>l.close());let g=z("button","le-btn-publish","Publish now");g.type="button",l.foot.hidden=!1,l.foot.append(h,g),g.focus();try{let f=(await(await P("/live-edit/changes",{method:"GET"})).json())?.changes??[],v=z("div","le-review");f.forEach(x=>{let L=z("div","le-review-row");L.append(z("div","le-review-what",_(x)),z("div","le-review-to",le(x.after)||"(empty)")),v.append(L)}),l.body.replaceChildren(f.length>0?v:W("Nothing is waiting."))}catch(w){l.body.replaceChildren(W(D(w,"list what is waiting")))}g.addEventListener("click",async()=>{g.disabled=!0,h.disabled=!0,g.textContent="Publishing\u2026",l.allowDismiss(!1);try{await P("/live-edit/publish",{method:"POST"}),t=0,n(),l.close(),I(`Live on ${p} \u2713`)}catch(w){l.allowDismiss(!0),g.disabled=!1,h.disabled=!1,g.textContent="Try again",l.body.replaceChildren(W(D(w,"publish that")))}})};c.publishButton.addEventListener("click",()=>{t!==0&&(document.activeElement?.blur?.(),i())});let d=()=>{let u=document.body.classList.contains("editing");xe(!0),ke(!1),c.toolbar.style.display="none";let p=document.createElement("div");p.className="le-back";let l=null,h=v=>{if(v&&!l){l=document.createElement("div"),l.className="le-phone";let x=document.createElement("iframe"),L=new URL(window.location.href);L.searchParams.set("live-edit","off"),x.src=L.toString(),x.title="This page on a phone",l.append(x),c.shadow.append(l)}else!v&&l&&(l.remove(),l=null)},w=[["Desktop",!1],["Phone",!0]].map(([v,x])=>{let L=z("button","le-back-btn",v);return L.type="button",L.addEventListener("click",()=>{w.forEach(S=>S.classList.remove("is-on")),L.classList.add("is-on"),h(x)}),p.append(L),L});if(w[0].classList.add("is-on"),e.previewUrl){let v=z("button","le-back-btn","Copy a link to this");v.type="button",v.title="A link that shows this unpublished version to somebody else",v.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(e.previewUrl),c.toast("Link copied \u2713")}catch{window.prompt("Copy this link:",e.previewUrl)}}),p.append(v)}let m=z("button","le-back-btn","Back to editing");m.type="button",m.addEventListener("click",()=>{h(!1),p.remove(),document.removeEventListener("keydown",f,!0),c.toolbar.style.display="",ke(u)});let f=v=>{v.key==="Escape"&&m.click()};document.addEventListener("keydown",f,!0),p.append(m),c.shadow.append(p),m.focus()};c.previewButton.addEventListener("click",d)});let ho=()=>{let e=document.querySelectorAll('nav, [role="navigation"], header ul'),t=new Map,n=i=>i.closest("#wpadminbar, #adminmenu, #wp-toolbar, #live-edit-ui, [data-no-edit], [data-live-edit-chrome]")!==null;return e.forEach(i=>{n(i)||i.querySelectorAll("a[href]").forEach(d=>{if(n(d))return;let u;try{u=new URL(d.getAttribute("href"),window.location.href)}catch{return}if(u.origin!==window.location.origin||/\.(pdf|zip|jpe?g|png|gif|svg|webp|mp4|mp3)$/i.test(u.pathname)||u.pathname===window.location.pathname&&u.hash)return;let p=(d.textContent??"").replace(/\s+/g," ").trim();p===""||p.length>22||t.has(u.pathname)||t.set(u.pathname,{label:p,href:u.href})})}),[...t.values()].slice(0,6)};(()=>{let e=ho();if(e.length<2)return;let t=window.location.pathname.replace(/\/$/,"");e.forEach(n=>{let i=z("button","le-page-btn",n.label);i.type="button",i.title=n.href,new URL(n.href).pathname.replace(/\/$/,"")===t?i.classList.add("is-on"):i.addEventListener("click",()=>{sessionStorage.setItem("tb_editing","1"),window.location.href=n.href}),c.pageSwitcher.append(i)}),c.pageSwitcher.hidden=!1})();let qt=`live-edit:redo:${o?.site??window.location.host}`,dt=()=>{try{return JSON.parse(sessionStorage.getItem(qt)??"[]")}catch{return[]}},Mt=e=>{try{sessionStorage.setItem(qt,JSON.stringify(e.slice(-20)))}catch{}},Ie=()=>{c.undoButton.disabled=(window.liveEditPublishing?.pending??0)===0,c.redoButton.disabled=dt().length===0};Dt(Ie),Ie();let _t=async()=>{c.undoButton.disabled=!0;let e;try{e=((await(await P("/live-edit/changes",{method:"GET"})).json())?.changes??[])[0]}catch(n){c.toast(D(n,"undo that")),Ie();return}if(!e){c.toast("There is nothing left to undo. Everything is published."),Ie();return}let t=_(e);try{await P("/live-edit/changes",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:e.key,kind:e.kind})})}catch(n){c.toast(D(n,"undo that")),Ie();return}Mt([...dt(),{key:e.key,kind:e.kind,value:e.after,label:t}]),I(`Undone: ${t}`)},Ut=async()=>{let e=dt(),t=e.pop();if(!t){c.toast("There is nothing to put back.");return}c.redoButton.disabled=!0;try{if(t.kind==="style")throw new Error("A styling change cannot be put back automatically yet.");await P("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:t.key,value:t.value,locale:window.liveEditLocale})})}catch(n){c.toast(D(n,"put that back")),c.redoButton.disabled=!1;return}Mt(e),I(`Put back: ${t.label}`)};c.undoButton.addEventListener("click",()=>void _t()),c.redoButton.addEventListener("click",()=>void Ut()),document.addEventListener("keydown",e=>{!(e.metaKey||e.ctrlKey)||e.key.toLowerCase()!=="z"||(c.shadow.activeElement??document.activeElement)?.closest?.('input, textarea, [contenteditable="true"]')||(e.preventDefault(),e.shiftKey?Ut():_t())}),c.closeButton.addEventListener("click",()=>xe()),c.cancelButton.addEventListener("click",()=>xe()),c.saveButton.addEventListener("click",Mn),U?.addEventListener("click",async()=>{!y||y.kind!=="record"||window.confirm("Delete this item?")&&(await P(`/live-edit/record/${y.type}/${y.id}`,{method:"DELETE"}),I("Deleted \u2713"))}),document.querySelectorAll("[data-live-create]").forEach(e=>{e.addEventListener("click",async()=>{await P("/live-edit/record/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:e.dataset.liveCreate})}),I("Added \u2713 \u2014 click it to edit")})});let ct=new URLSearchParams(window.location.search);if(ct.has("edit")){ct.delete("edit");let e=ct.toString();window.history.replaceState(null,"",window.location.pathname+(e?`?${e}`:"")),ke(!0)}else ke(sessionStorage.getItem("tb_editing")==="1")}};window.liveEditDisplayedValue=o=>ft({editValue:o.dataset.editValue,ownText:de(o),fullText:o.textContent});var At=(()=>{let o=!1;return()=>{o||new URLSearchParams(window.location.search).get("live-edit")!=="off"&&(o=!0,Ro())}})();document.readyState==="complete"?At():(window.addEventListener("load",At,{once:!0}),window.setTimeout(At,2e3));
