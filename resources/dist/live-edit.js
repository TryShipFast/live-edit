var fo=Object.defineProperty;var Ie=(o,a)=>()=>(o&&(a=o(o=0)),a);var ut=(o,a)=>{for(var r in a)fo(o,r,{get:a[r],enumerable:!0})};var Gt,Kt,Xt,xo,Qt,Zt,gt,ie,en,tn,nn,Ye,ko,Ge,bt=Ie(()=>{Gt=o=>{let[a,...r]=String(o??"").split(":");return{kind:a,key:r.join(":"),parts:r}},Kt=(o,a={})=>({...a,headers:{"X-CSRF-TOKEN":o,Accept:"application/json",...a.headers??{}}}),Xt=o=>(o?.headers?.get?.("content-type")??"").includes("json"),xo=/\.((?:fa|fas|far|fab|fal|fad|bi|ti|icon|flaticon|glyphicon|ion|mdi)-[a-z0-9][a-z0-9-]*)::?before/gi,Qt=o=>{let a=[];for(let r of String(o??"").split("}")){let s=r.indexOf("{");if(s===-1)continue;let b=r.slice(s+1).match(/content\s*:\s*(["'])(.*?)\1/);if(!b)continue;let c=b[2].match(/^\\([0-9a-f]{1,6})\s*$/i),E=c?String.fromCodePoint(parseInt(c[1],16)):b[2];if([...E].length===1)for(let A of r.slice(0,s).matchAll(xo))a.push({name:A[1],glyph:E})}return a},Zt=(o,a,r,s,b)=>{let c=o.filter(E=>E!==r&&!s.includes(E));return b.forEach(E=>c.includes(E)||c.push(E)),c.push(a),c.join(" ")},gt=({editValue:o,ownText:a,fullText:r})=>(o??"")!==""?o:(a??"").trim()!==""?a:r??"",ie=o=>o.children.length?[...o.childNodes].filter(a=>a.nodeType===3).map(a=>a.textContent).join(" "):o.textContent,en=o=>{let a=new Set,r=[];for(let s of o)for(let b of s.icons)a.has(b.name)||(a.add(b.name),r.push({...b,face:s.face,variant:s.variant}));return r.sort((s,b)=>s.name.localeCompare(b.name))},tn=(o,a)=>{let r=Object.keys(a??{}),s=String(o??"").split(",").map(b=>b.trim()).filter(Boolean);return s.length===0?r:r.length===0?s:s.filter(b=>r.includes(b))},nn=(o,a={},r)=>{let s=String(r?.base??"").replace(/\/$/,""),[b,c]=String(o).split("?"),E={"/live-edit/setting":`${s}/${r?.site}/content`,"/live-edit/style":`${s}/${r?.site}/styles`,"/live-edit/publish":`${s}/${r?.site}/publish`,"/live-edit/image":`${s}/${r?.site}/media`,"/live-edit/upload":`${s}/${r?.site}/media`,"/live-edit/changes":`${s}/${r?.site}/changes`,"/live-edit/versions":`${s}/${r?.site}/versions`,"/live-edit/content":`${s}/${r?.site}/content`,"/live-edit/credits":`${s}/${r?.site}/credits`,"/live-edit/assist":`${s}/${r?.site}/assist`,"/live-edit/photos":`${s}/${r?.site}/photos`,"/live-edit/photos/used":`${s}/${r?.site}/photos/used`,"/live-edit/imagine":`${s}/${r?.site}/imagine`};if(o==="/live-edit/publish"&&r?.publishUrl)return{url:r.publishUrl,init:{...a,headers:{...a.headers??{},...r.publishHeaders??{},Accept:"application/json"},credentials:"same-origin"}};let A=E[b];if(!s||!r?.site||!r?.token)throw new Error("The content API is not configured on this page.");if(!A)throw new Error(`Editing that is not available over the content API yet (${b}).`);return{url:c?`${A}?${c}`:A,init:{...a,headers:{...a.headers??{},Authorization:`Bearer ${r.token}`,Accept:"application/json"}}}},Ye=(o,a,r)=>o.hasAttribute(a)?o.getAttribute(a):o.dataset?.[r]??"",ko=(o,a)=>a==null?!0:a===408||a===425||a===429||a>=500,Ge=async(o,{tries:a=3,waits:r=[200,500],sleep:s=null}={})=>{let b=s??(E=>new Promise(A=>setTimeout(A,E))),c=null;for(let E=0;E<a;E++)try{return await o()}catch(A){if(c=A,E===a-1||!ko(A,A.status))throw A;await b(r[Math.min(E,r.length-1)])}throw c}});var wt={};ut(wt,{applyTags:()=>mt,autoTag:()=>Ke,elementAt:()=>an,ensureBackgroundsAreFound:()=>Lo,fingerprint:()=>on,refreshBackgrounds:()=>Ao,resolveBackgrounds:()=>yt,watchForLateBackgrounds:()=>ln});var Eo,on,an,mt,Co,So,rn,sn,yt,Lo,Ao,ln,Ke,vt=Ie(()=>{Eo="kb_tags_",on=o=>{let a=2166136261;for(let r=0;r<o.length;r++)a^=o.charCodeAt(r),a=Math.imul(a,16777619);return(a>>>0).toString(16)},an=(o,a)=>{let r=o.documentElement;for(let s of a)if(r=[...r?.children??[]][s],!r)return null;return r},mt=(o,a)=>{let r=0;for(let{at:s,attributes:b}of a??[]){let c=an(o,s);if(c){for(let[E,A]of Object.entries(b))c.hasAttribute(E)||c.setAttribute(E,A);r++}}return r},Co=o=>{try{return JSON.parse(window.sessionStorage?.getItem(o)??"null")}catch{return null}},So=(o,a)=>{try{window.sessionStorage?.setItem(o,JSON.stringify(a))}catch{}},rn=o=>o.hasAttribute("data-kb-bg")||o.hasAttribute("data-background")||o.hasAttribute("data-bg")||o.hasAttribute("data-background-image")||/background-image|url\(/i.test(o.getAttribute("style")??""),sn=(o,a)=>{if(rn(o))return!1;let r=a.getComputedStyle(o).backgroundImage;if(!r||r==="none"||!r.includes("url("))return!1;let s=r.match(/url\(\s*["']?([^"')]+)/)?.[1];return!s||s.startsWith("data:")?!1:(o.setAttribute("data-kb-bg",s),!0)},yt=(o=document)=>{let a=o.defaultView??window;if(!a?.getComputedStyle)return 0;let r=0;for(let s of o.querySelectorAll("body *"))sn(s,a)&&r++;return r},Lo=async(o,a=document)=>{let r=a.defaultView??window;if(r.liveEditBackgroundsWatched)return 0;r.liveEditBackgroundsWatched=!0;let s=await Ke(o,a);return ln(a,()=>{Ke(o,a).catch(b=>{console.warn("[live-edit] could not tag a late background:",b.message)})}),s},Ao=async(o,a=document)=>yt(a)===0&&a.querySelector("[data-kb-bg]:not([data-edit-bg])")===null?0:Ke(o,a),ln=(o=document,a=()=>{})=>{let r=o.defaultView??window;if(!r?.IntersectionObserver||!r.getComputedStyle)return null;let s=new Set,b=null,c=()=>{if(b=null,s.size===0)return;let P=[...s];s.clear(),a(P)},E=5,A=new WeakMap,N=P=>{if(sn(P,r))return s.add(P),D.unobserve(P),b||(b=r.setTimeout(c,250)),!0;let q=(A.get(P)??0)+1;return A.set(P,q),q>=E&&D.unobserve(P),!1},D=new r.IntersectionObserver(P=>{for(let q of P){if(!q.isIntersecting)continue;let Z=q.target;N(Z)||r.setTimeout(()=>N(Z),400)}},{rootMargin:"300px"}),F=[...o.querySelectorAll("body *")].filter(P=>!rn(P)),T=4e3;return F.length>T&&console.warn(`[live-edit] watching the first ${T} of ${F.length} elements for late backgrounds`),F.slice(0,T).forEach(P=>D.observe(P)),D},Ke=async({base:o,site:a,key:r,page:s},b=document)=>{let c=b.querySelector("[data-edit], [data-edit-img]")!==null;if(yt(b),c&&!(b.querySelector("[data-kb-bg]:not([data-edit-bg])")!==null))return 0;let A=b.documentElement.outerHTML,N=Eo+on(A),D=Co(N);if(D)return mt(b,D);let F=await fetch(`${String(o).replace(/\/$/,"")}/${a}/tag`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json",Authorization:`Bearer ${r}`},body:JSON.stringify({html:A,page:s??b.location?.pathname??""})});if(!F.ok)throw new Error(`Tagging answered ${F.status}`);let{elements:T}=await F.json();return So(N,T),mt(b,T)}});var To,No,$o,dn,cn,pn=Ie(()=>{To=new Set(["svg","g","defs","symbol","use","title","desc","path","circle","ellipse","line","polygon","polyline","rect","text","tspan","textpath","lineargradient","radialgradient","stop","clippath","mask","pattern"]),No=new Set(["viewbox","xmlns","width","height","fill","fill-rule","fill-opacity","stroke","stroke-width","stroke-linecap","stroke-linejoin","stroke-dasharray","stroke-dashoffset","stroke-opacity","stroke-miterlimit","opacity","d","points","x","y","x1","y1","x2","y2","cx","cy","r","rx","ry","transform","offset","stop-color","stop-opacity","gradientunits","gradienttransform","patternunits","clip-rule","clip-path","mask","id","class","role","aria-label","aria-hidden","focusable","preserveaspectratio","vector-effect","text-anchor","font-size","font-family"]),$o=8,dn=o=>{let a=String(o??"").trim();if(a===""||!/<svg/i.test(a))return null;let r=new DOMParser().parseFromString(a,"image/svg+xml"),s=r.documentElement;return!s||s.tagName?.toLowerCase()!=="svg"||r.querySelector("parsererror")||(cn(s),s.children.length===0&&s.textContent.trim()==="")?null:s},cn=o=>{for(let a of[...o.childNodes]){if(a.nodeType===$o){a.remove();continue}if(a.nodeType===1){if(!To.has(a.tagName.toLowerCase())){a.remove();continue}cn(a)}}for(let a of[...o.attributes]){let r=a.name.toLowerCase(),s=a.value,c=r==="href"||r==="xlink:href"?s.trim().startsWith("#"):No.has(r);c&&/url\(/i.test(s)&&!/^url\(\s*#/i.test(s.trim())&&(c=!1),c||o.removeAttribute(a.name)}}});var Ct={};ut(Ct,{applyBackground:()=>bn,applyContent:()=>yn,applyIcon:()=>gn,applyOrder:()=>mn,applyStyles:()=>xn,applySvg:()=>fn,applyValue:()=>kt,defendContent:()=>wn,fetchContent:()=>En,fetchSnapshot:()=>kn,resolve:()=>Cn,styleRules:()=>vn});var xt,un,kt,Et,Oo,fn,gn,bn,mn,yn,wn,vn,xn,kn,En,hn,Po,Cn,St=Ie(()=>{pn();bt();xt=(o,a)=>Object.assign(new Error(o),{status:a}),un="setting:",kt=(o,a)=>{let r=o.tagName?.toLowerCase();if(r==="img"){o.setAttribute("src",a);return}if(r==="source"){o.setAttribute("srcset",a);return}Et(o,a)},Et=(o,a)=>{let r=[...o.childNodes].filter(s=>s.nodeType===Oo);if(r.length===0){let s=[...o.children];if(s.length===1&&s[0].children.length===0){Et(s[0],a);return}o.append(a);return}r.forEach((s,b)=>{if(b>0){s.remove();return}s.nodeValue=a+(/\s$/.test(s.nodeValue)?" ":"")})},Oo=3,fn=(o,a)=>{let r=dn(a);if(!r)return!1;let s=document.importNode(r,!0);for(let b of["class","width","height","style","data-edit-svg","data-edit-label"])o.hasAttribute(b)&&s.setAttribute(b,o.getAttribute(b));return o.replaceWith(s),!0},gn=(o,a)=>{let r=String(a).replace(/[^A-Za-z0-9_\- ]/g,"").split(/\s+/).filter(Boolean),s=o.getAttribute("data-edit-icon-current");if(r.length===0||!s)return!1;let b=r.length===1?(o.getAttribute("class")??"").trim().split(/\s+/).map(c=>c===s?r[0]:c):r;return o.setAttribute("class",b.join(" ")),o.setAttribute("data-edit-icon-current",r.length===1?r[0]:r[r.length-1]),!0},bn=(o,a)=>{for(let s of["data-background","data-bg","data-background-image"])o.hasAttribute(s)&&o.setAttribute(s,a);let r=(o.getAttribute("style")??"").replace(/background-image\s*:[^;]*;?/gi,"").trim();o.setAttribute("style",`${r?r.replace(/;?$/,";"):""}background-image:url('${a}')`)},mn=(o,a)=>{let r=0;for(let s of o.querySelectorAll("[data-edit-list]")){let b=s.getAttribute("data-edit-list");if(!Object.hasOwn(a,b))continue;let c;try{c=JSON.parse(a[b])}catch{continue}if(!Array.isArray(c)||c.length===0)continue;let E=new Map;for(let N of[...s.children])N.hasAttribute("data-edit-item")&&(E.set(N.getAttribute("data-edit-item"),N),s.removeChild(N));if(E.size===0)continue;let A=E.values().next().value;for(let N of c){let D=E.get(String(N));if(D){s.appendChild(D);continue}let F=A.cloneNode(!0);F.setAttribute("data-edit-item",String(N)),s.appendChild(F)}r++}return r},yn=(o,a)=>{let r=0;mn(o,a);for(let s of o.querySelectorAll("[data-edit]")){let b=s.getAttribute("data-edit")??"";if(!b.startsWith(un))continue;let c=b.slice(un.length);Object.hasOwn(a,c)&&(kt(s,a[c]),r++)}for(let s of o.querySelectorAll("[data-edit-img]")){let b=(s.getAttribute("data-edit-img")??"").replace(/^setting:/,"");Object.hasOwn(a,b)&&(kt(s,a[b]),r++);for(let[c,E]of[["Alt","alt"],["Title","title"]])if(Object.hasOwn(a,b+c)){let A=a[b+c];A===""&&E==="title"?s.removeAttribute("title"):s.setAttribute(E,A),r++}}for(let s of o.querySelectorAll("[data-edit-svg]")){let b=(s.getAttribute("data-edit-svg")??"").replace(/^setting:/,""),c=a[b];!Object.hasOwn(a,b)||String(c??"").trim()===""||fn(s,c)&&r++}for(let s of o.querySelectorAll("[data-edit-icon]")){let b=(s.getAttribute("data-edit-icon")??"").replace(/^setting:/,""),c=a[b];!Object.hasOwn(a,b)||c===""||gn(s,c)&&r++}for(let s of o.querySelectorAll("[data-edit-bg]")){let b=(s.getAttribute("data-edit-bg")??"").replace(/^setting:/,""),c=a[b];!Object.hasOwn(a,b)||c===""||(bn(s,c),r++)}for(let s of o.querySelectorAll("[data-edit-href]")){let b=s.getAttribute("data-edit-href");Object.hasOwn(a,b)&&(s.setAttribute("href",a[b]),r++)}return r},wn=(o,{limit:a=12,debounce:r=60}={})=>{let s=o.defaultView??(typeof window>"u"?null:window);if(!s?.MutationObserver)return null;let b=o.querySelectorAll("[data-edit], [data-edit-img], [data-edit-href]");if(b.length===0)return null;let c=new Map;for(let T of b)c.set(T,{words:T.hasAttribute("data-edit")?ie(T):null,src:T.getAttribute("src"),href:T.hasAttribute("data-edit-href")?T.getAttribute("href"):null});let E=0,A=!1,N=null,D=()=>{if(N=null,!o.body?.classList?.contains("editing")){E++,A=!0;for(let[T,P]of c)T.isConnected&&(P.words!==null&&ie(T)!==P.words&&Et(T,P.words),P.src!==null&&T.getAttribute("src")!==P.src&&(T.setAttribute("src",P.src),T.removeAttribute("srcset")),P.href!==null&&T.getAttribute("href")!==P.href&&T.setAttribute("href",P.href));F.takeRecords(),A=!1,E>=a&&(F.disconnect(),console.warn(`[live-edit] this page keeps rewriting itself; the client's content was put back ${E} times and is now being left alone.`))}},F=new s.MutationObserver(()=>{A||N||E>=a||(N=s.setTimeout(D,r))});for(let T of b)F.observe(T,{characterData:!0,childList:!0,subtree:!0,attributes:!0,attributeFilter:["src","srcset","href"]});return F},vn=(o,a)=>{let r=`[data-style="${o}"]`,s="",b="";for(let[c,E]of Object.entries(a??{}))if(!(E===""||E===null||E===void 0)){if(c==="hidden"){s+=`body:not(.editing) ${r}{display:none !important}`,s+=`body.editing ${r}{opacity:.45}`;continue}b+={backgroundImage:`background-image:url('${E}') !important;background-size:cover !important;background-position:center !important;`,background:`background:${E} !important;`,textColor:`color:${E} !important;`,fontSize:`font-size:${E}px !important;`,radius:`border-radius:${E}px !important;`,paddingX:`padding-left:${E}px !important;padding-right:${E}px !important;`,paddingY:`padding-top:${E}px !important;padding-bottom:${E}px !important;`}[c]??""}return b===""?s:s+`${r}{${b}}`},xn=(o,a)=>{let r=Object.entries(a??{}).map(([E,A])=>vn(E,A)).join("");if(r==="")return 0;let s="live-edit-styles",b=o.getElementById?.(s)??o.querySelector?.(`#${s}`)??null,c=b??o.createElement("style");return c.id=s,c.textContent=r,b||(o.head??o.body)?.appendChild(c),Object.keys(a).length},kn=async({snapshot:o,locale:a})=>{let r=String(o).replace(/\/$/,""),s=await Ge(()=>fetch(`${r}/current.json`).then(c=>{if(!c.ok)throw xt(`Pointer answered ${c.status}`,c.status);return c.json()}));if(!s.version)return{settings:{},styles:{}};let b=a??"en";return Ge(async()=>{let c=await fetch(`${r}/v${s.version}/${b}.json`);if(!c.ok)throw xt(`Version answered ${c.status}`,c.status);return c.json()})},En=async({base:o,site:a,key:r,locale:s})=>{let b=`${String(o).replace(/\/$/,"")}/${a}/content${s?`?locale=${encodeURIComponent(s)}`:""}`;return Ge(async()=>{let c=await fetch(b,{headers:{Authorization:`Bearer ${r}`,Accept:"application/json"}});if(!c.ok)throw xt(`Content service answered ${c.status}`,c.status);return c.json()})},hn=async()=>{let o=typeof window<"u"?window.liveEditContent:null;if(!o)return;let a=null,r=null;try{let s=await Cn(o);s&&(s.styleProps&&(window.liveEditStyleProps=s.styleProps),typeof s.pending=="number"&&s.styleProps&&(window.liveEditPublishing={...window.liveEditPublishing??{},pending:s.pending}),a=yn(document,s.settings??{}),xn(document,s.styles??{}),window.liveEditStyles=s.styles??{},wn(document))}catch(s){r=s,console.warn("[live-edit] serving the words already in the page:",s.message)}Po({applied:a,failed:r?r.message:null})},Po=o=>{window.liveEditContentDone=o,document.dispatchEvent(new CustomEvent("live-edit:content",{detail:o}))},Cn=async o=>{if(o.snapshot)try{return await kn(o)}catch(a){let r=a.message.includes("fetch")?" (if the files are on another origin, the bucket or CDN must allow cross-origin reads)":"";if(!o.base)throw new Error(a.message+r);console.warn("[live-edit] falling back to the content API:",a.message+r)}return o.base&&o.site&&o.key?En(o):null};typeof document<"u"&&(document.readyState==="loading"?document.addEventListener("DOMContentLoaded",hn):hn())});var Nn={};ut(Nn,{collectFromFragment:()=>Ln,contentConfigFor:()=>jo,currentSession:()=>zo,forget:()=>Io,requestLink:()=>Bo,store:()=>An,stored:()=>Tn});var Lt,Sn,Ln,An,Tn,Io,Bo,zo,jo,$n=Ie(()=>{Lt="kb_session",Sn="kb_session=",Ln=(o=window)=>{let a=o.location?.hash??"",r=a.indexOf(Sn);if(r===-1)return null;let s=decodeURIComponent(a.slice(r+Sn.length).split("&")[0]);if(s==="")return null;An(s,o);let b=a.slice(0,r).replace(/[#&]$/,"");return o.history?.replaceState?.(null,"",o.location.pathname+o.location.search+b),s},An=(o,a=window)=>{try{a.sessionStorage?.setItem(Lt,o)}catch{}},Tn=(o=window)=>{try{return o.sessionStorage?.getItem(Lt)??null}catch{return null}},Io=(o=window)=>{try{o.sessionStorage?.removeItem(Lt)}catch{}},Bo=async({base:o,site:a},r,s=window)=>(await fetch(`${String(o).replace(/\/$/,"")}/sign-in`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({site:a,email:r,return_to:s.location.origin+s.location.pathname})})).ok,zo=(o=window)=>Ln(o)??Tn(o),jo=(o,a)=>{let r={base:o.api,site:o.site,locale:o.locale??null};return a?{...r,key:a,snapshot:null}:{...r,key:o.key,snapshot:o.snapshot??null}}});var go=`
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
`,bo=`
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
`,S=(o,a,r)=>{let s=document.createElement(o);return a&&(s.className=a),r!==void 0&&(s.textContent=r),s};function Wt(){let o=document.createElement("style");o.id="live-edit-page-css",o.textContent=bo,document.head.append(o);let a=document.createElement("div");a.id="live-edit-ui",document.body.append(a);let r=a.attachShadow({mode:"open"}),s=document.createElement("style");s.textContent=go,r.append(s);let b=window.liveEditToolbar??{},c=S("div","le-toolbar"),E=S("span","le-mark");E.innerHTML='<svg width="16" height="16" viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="3" width="20" height="20" rx="3" fill="none" stroke="#0B0C0F" stroke-width="2.5"/><path d="M16 15 L16 30 L19.6 26.4 L22.2 31.2 L24.6 30 L22 25.3 L27 25.3 Z" fill="#3148F5" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>';let A=S("span","le-status le-when-roomy"),N=S("span","le-dot"),D=S("span",null,"");A.append(N,D),c.append(E,A);let F=window.liveEditEditor??null;if(F?.greeting){let $=S("span","le-hello le-when-roomy","Welcome "+F.greeting);c.append($)}let T=null,P=b.locales??{};Object.keys(P).length>1&&(T=S("select","le-locale"),T.title="Language you are editing",Object.entries(P).forEach(([$,z])=>{let H=S("option",null,z);H.value=$,H.selected=$===(b.locale??"en"),T.append(H)}),T.addEventListener("change",()=>{window.location.search="?locale="+T.value}),c.append(T));let q=S("button","le-bar-btn","Edit site");q.type="button";let Z=$=>'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"'+($?' style="transform: scaleX(-1)"':"")+'><path d="M9 14 4 9l5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 9h7a6 6 0 0 1 0 12H8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',k=S("button","le-round");k.type="button",k.title="Undo the last change you have not published",k.setAttribute("aria-label","Undo"),k.innerHTML=Z(!1);let U=S("button","le-round");U.type="button",U.title="Put back what you just undid",U.setAttribute("aria-label","Redo"),U.innerHTML=Z(!0);let te=S("div","le-pages");te.hidden=!0,te.setAttribute("role","group"),te.setAttribute("aria-label","Pages");let re=S("button","le-bar-btn le-when-roomy","Changes");re.type="button",re.title="Everything you have changed and not published";let W=S("button","le-bar-btn le-when-roomy","Preview");W.type="button",W.title="See the page the way a visitor will",W.hidden=!0;let K=S("button","le-publish");K.type="button",K.title="Put your changes live",K.hidden=!0;let w=S("span",null,"Publish"),se=S("span","le-publish-count");if(se.hidden=!0,K.append(w,se),c.append(S("span","le-sep"),q,k,U,S("span","le-sep"),te,re,W,K),(b.links??[]).forEach($=>{let z=S("a","le-btn-ghost",$.label);z.href=$.href,$.title&&(z.title=$.title),c.append(z)}),b.logout?.href)if((b.logout.method??"get").toLowerCase()==="post"){let $=document.createElement("form");$.method="POST",$.action=b.logout.href;let z=document.createElement("input");z.type="hidden",z.name="_token",z.value=document.body.dataset.csrf??"";let H=S("button","le-btn-ghost","Log out");H.type="submit",$.append(z,H),c.append($)}else{let $=S("a","le-btn-ghost","Log out");$.href=b.logout.href,c.append($)}let J=S("div","le-drawer");J.setAttribute("role","dialog"),J.setAttribute("aria-modal","true"),J.setAttribute("aria-label","Edit content");let Be=S("div","le-drawer-head"),le=S("div","le-tabs");le.setAttribute("role","tablist");let ze={};["Edit","Changes","History"].forEach($=>{let z=S("button","le-tab",$);z.type="button",z.dataset.tab=$,z.setAttribute("role","tab"),$==="Edit"&&z.classList.add("is-on"),ze[$]=z,le.append(z)});let he=S("button","le-close","\xD7");he.type="button",he.setAttribute("aria-label","Close"),Be.append(le,he);let Ce=S("div","le-subject"),je=S("div","le-trail"),Fe=S("div","le-title","Text");Ce.append(S("div","le-eyebrow","Selected"),je,Fe);let Re=S("div","le-fields"),de=S("div","le-foot"),Se=S("button","le-btn-danger le-start le-hidden","Delete");Se.type="button";let fe=S("button","le-btn-outline","Cancel");fe.type="button";let ge=S("button","le-btn","Save changes");ge.type="button",de.append(Se,fe,ge),J.append(Be,Ce,Re,de);let ne=S("button","le-handle");ne.type="button",ne.setAttribute("aria-label","Edit this link"),ne.innerHTML="&#9998;";let Q=S("button","le-handle le-handle-bg");Q.type="button",Q.setAttribute("aria-label","Replace this background image"),Q.title="Replace background image",Q.textContent="Replace background";let be=S("div","le-hover"),me=S("span","le-hover-label");return be.append(me),r.append(c,J,ne,Q,be),{root:a,shadow:r,toolbar:c,toggleButton:q,undoButton:k,redoButton:U,pageSwitcher:te,statusText:D,dot:N,localeSelect:T,drawer:J,drawerFoot:de,drawerTabs:ze,drawerSubject:Ce,drawerTitle:Fe,drawerTrail:je,drawerFields:Re,drawerDelete:Se,publishButton:K,publishLabel:w,publishCount:se,previewButton:W,changesButton:re,closeButton:he,cancelButton:fe,saveButton:ge,linkHandle:ne,bgHandle:Q,hoverBox:be,hoverLabel:me,toast:($,z=1800)=>{let H=S("div","le-toast",$);r.append(H),setTimeout(()=>H.style.opacity="0",z),setTimeout(()=>H.remove(),z+600)},modal:({title:$,subtitle:z,size:H="",dismissable:Le=!0}={})=>{let R=S("div","le-scrim"),M=S("div",`le-modal ${H}`.trim());M.setAttribute("role","dialog"),M.setAttribute("aria-modal","true");let De=S("div","le-modal-heading"),qe=S("div","le-modal-title",$??""),ye=S("div","le-modal-sub",z??"");ye.hidden=!z,De.append(qe,ye),M.setAttribute("aria-label",$??"Dialog");let oe=S("button","le-close","\xD7");oe.type="button",oe.setAttribute("aria-label","Close");let Me=S("div","le-modal-head");Me.append(De,oe);let Ae=S("div","le-modal-tabs");Ae.hidden=!0;let _e=S("div","le-modal-body"),Te=S("div","le-modal-foot");Te.hidden=!0,M.append(Me,Ae,_e,Te),R.append(M);let Ne=document.activeElement,Ue=!1,we=()=>{Ue||(Ue=!0,document.removeEventListener("keydown",ve,!0),R.remove(),Ne?.focus?.(),ae.dismissable=!0)},ve=V=>{V.key==="Escape"&&ae.dismissable&&(V.stopPropagation(),we())},ae={dismissable:Le};return oe.addEventListener("click",we),R.addEventListener("mousedown",V=>{V.target===R&&ae.dismissable&&we()}),document.addEventListener("keydown",ve,!0),r.append(R),oe.focus(),{card:M,body:_e,foot:Te,tabs:Ae,close:we,title:V=>qe.textContent=V,subtitle:V=>{ye.textContent=V??"",ye.hidden=!V},allowDismiss:V=>{ae.dismissable=V,oe.hidden=!V}}}}}var ft="kb_verify",Jt=(o,a=globalThis)=>{try{a.sessionStorage?.setItem(ft,JSON.stringify(o))}catch{}},Vt=(o=globalThis)=>{try{let a=o.sessionStorage?.getItem(ft);return o.sessionStorage?.removeItem(ft),a?JSON.parse(a):null}catch{return null}},mo=(o,a)=>!a?.attr||!a?.marker?null:o.querySelector(`[${a.attr}="${a.marker.replace(/"/g,'\\"')}"]`),yo=(o,a)=>{if(!o)return null;if(a==="image"){let s=wo(o);return s?s.getAttribute("src"):null}if(a==="href")return o.getAttribute("href");if(a==="icon")return o.getAttribute("class")??"";let r=[...o.childNodes].filter(s=>s.nodeType===3).map(s=>s.textContent).join(" ").trim();return ee(r===""?o.textContent:r)},wo=o=>o.tagName?.toLowerCase()==="img"?o:o.querySelector("img")??o.parentElement?.querySelector("img")??null,ee=o=>String(o??"").replace(/\s+/g," ").trim(),vo=(o,a,r)=>{if(r===null)return!1;if(o==="image")return ht(r)!==""&&ht(r)===ht(a);if(o==="icon"){let s=ee(a).split(" ").filter(Boolean),b=ee(r).split(" ").filter(Boolean);return s.length>0&&s.every(c=>b.includes(c))}return o==="href"?ee(r)===ee(a)||ee(r).endsWith(ee(a)):ee(r)===ee(a)},ht=o=>String(o??"").split(/[?#]/)[0].split("/").filter(Boolean).pop()??"",Yt=(o,a)=>{if(!a?.kind)return null;let r=mo(o,a);if(!r)return null;let s=yo(r,a.kind);return{ok:vo(a.kind,a.value,s),wanted:a.value,saw:s,kind:a.kind}};bt();var Fo=()=>{let o=window.liveEditApi;o?.base&&o?.site&&Promise.resolve().then(()=>(vt(),wt)).then(r=>r.ensureBackgroundsAreFound({base:o.base,site:o.site,key:o.token})).catch(r=>console.warn("[live-edit] could not look for backgrounds:",r.message)),window.liveEditContent||Promise.resolve().then(()=>(St(),Ct)).then(r=>r.defendContent(document)).catch(r=>console.warn("[live-edit] could not guard this page's content:",r.message));let a=document.querySelector("[data-login-modal]");if(a){let r=()=>{a.classList.remove("hidden"),a.classList.add("flex"),a.querySelector("input[type=email]")?.focus()},s=()=>{a.classList.add("hidden"),a.classList.remove("flex")};document.querySelectorAll("[data-login-open]").forEach(b=>{b.addEventListener("click",c=>{c.preventDefault(),r()})}),a.querySelector("[data-login-close]")?.addEventListener("click",s),a.addEventListener("click",b=>{b.target===a&&s()}),a.dataset.error==="1"&&r()}if(document.body.hasAttribute("data-admin")){let r=document.body.dataset.csrf,s=()=>{sessionStorage.setItem("tb_scroll",String(window.scrollY)),window.location.reload()},b=sessionStorage.getItem("tb_scroll");b!==null&&(sessionStorage.removeItem("tb_scroll"),window.scrollTo(0,Number(b)));let c=Wt(),E=sessionStorage.getItem("tb_toast");E&&(sessionStorage.removeItem("tb_toast"),c.toast(E));let A=()=>new Promise(e=>{if(!window.liveEditContent||window.liveEditContentDone){e(window.liveEditContentDone??null);return}let t=n=>e(n?.detail??null);document.addEventListener("live-edit:content",t,{once:!0}),setTimeout(()=>e(null),5e3)});A().then(e=>{let t=Vt();if(e?.failed){c.toast(t?"Saved \u2014 but this page could not load the latest content, so it may be showing an older version. Reload to try again.":"This page could not load your saved content, so it is showing the original. Nothing has been lost \u2014 reload to try again.",9e3);return}let n=t?Yt(document,t):null;n&&!n.ok&&(console.warn("[live-edit] the change was saved but the page still shows:",n.saw,`
  expected:`,n.wanted),c.toast("Saved \u2014 but this page is still showing the old version. Your change is stored; reload, and tell us if it stays this way.",9e3))});let N=e=>{sessionStorage.setItem("tb_toast",e),s()},D=(e,t=null,n=null)=>{let i=window.__liveEditReact;if(!i){N(e);return}let d=t!==null&&(i.apply??i.set)(t,n);c.toast(e),d||i.refresh()},{drawer:F,drawerTabs:T,drawerSubject:P,drawerTitle:q,drawerTrail:Z,drawerFields:k,drawerDelete:U,toggleButton:te,statusText:re,linkHandle:W,bgHandle:K}=c,w=null,se=(e,t,n,i,d=!1)=>{let u=document.createElement("label");u.className="le-field",u.append(t);let p=e==="icon"?window.liveEditIcons:(window.liveEditSelects??{})[e],l=document.querySelector("[data-icon-templates]");if(e==="icon"&&Array.isArray(p)&&l){let f=document.createElement("input");f.type="hidden",f.name=e,f.value=n??"";let y=document.createElement("div");return y.className="le-icons",p.forEach(m=>{let g=document.createElement("button");g.type="button",g.title=m,g.dataset.iconChoice=m,g.className="le-icon"+(m===f.value?" is-active":"");let v=l.querySelector(`template[data-icon="${m}"]`);v?g.append(v.content.cloneNode(!0)):g.textContent=m,g.addEventListener("click",()=>{f.value=m,y.querySelectorAll("[data-icon-choice]").forEach(x=>{let L=x.dataset.iconChoice===m;x.className="le-icon"+(L?" is-active":"")}),f.dispatchEvent(new Event("input",{bubbles:!0}))}),y.append(g)}),u.append(f,y),u}if(Array.isArray(p)&&p.length<=6){let f=document.createElement("input");f.type="hidden",f.name=e,f.value=n??p[0];let y=document.createElement("div");return y.className="le-choices",p.forEach(m=>{let g=document.createElement("label");g.className="le-choice"+(m===f.value?" is-selected":"");let v=document.createElement("input");v.type="radio",v.name="le-choice-"+e,v.checked=m===f.value,v.addEventListener("change",()=>{f.value=m,y.querySelectorAll(".le-choice").forEach(x=>x.classList.remove("is-selected")),g.classList.add("is-selected"),f.dispatchEvent(new Event("input",{bubbles:!0}))}),g.append(v,document.createTextNode(m)),y.append(g)}),u.append(f,y),u}let h;if(Array.isArray(p)?(h=document.createElement("select"),p.forEach(f=>{let y=document.createElement("option");y.value=f,y.textContent=f,y.selected=f===n,h.append(y)})):(h=document.createElement("textarea"),h.rows=i,h.value=n??""),h.name=e,h.className="le-input",h.tagName==="TEXTAREA"){h.classList.add("le-prose");let f=()=>{h.style.height="auto",h.style.height=Math.min(h.scrollHeight+2,420)+"px"};h.addEventListener("input",f),requestAnimationFrame(f)}if(d&&h.tagName==="TEXTAREA"){let f=document.createElement("div");f.className="le-tools";let y=(v,x)=>{let L=h.selectionStart,C=h.selectionEnd,O=h.value.slice(L,C)||"text";h.setRangeText(v+O+x,L,C,"select"),h.dispatchEvent(new Event("input",{bubbles:!0})),h.focus()},m=(v,x,L,C="")=>{let O=document.createElement("button");return O.type="button",O.title=x,O.textContent=v,O.className="le-tool "+C,O.addEventListener("click",L),O};f.append(m("B","Bold",()=>y("**","**"),"is-bold"),m("I","Italic",()=>y("*","*"),"is-italic"),m("Link","Insert link",()=>{let v=window.prompt("Link URL (https://\u2026 or /page):");if(!v)return;let x=h.selectionStart,L=h.selectionEnd,C=h.value.slice(x,L)||"link text";h.setRangeText("["+C+"]("+v+")",x,L,"select"),h.dispatchEvent(new Event("input",{bubbles:!0})),h.focus()}));let g=document.createElement("span");g.className="le-hint",g.textContent="**bold** \xB7 *italic* \xB7 [text](url)",f.append(g),u.append(f)}return u.append(h),u},J=e=>{let t=e.tagName;if(t==="IMG")return"Image";if(t==="BUTTON")return"Button";if(t==="A")return/\b(btn|button)\b/i.test(String(e.className))?"Button":"Link";if(/^H[1-6]$/.test(t))return"Heading";if(t==="P")return"Paragraph";if(t==="LI")return"List item";if(t==="UL"||t==="OL")return"List";if(t==="NAV")return"Menu";if(t==="HEADER")return"Header";if(t==="FOOTER")return"Footer";if(t==="FORM")return"Form";if(e.dataset.editRegion)return e.dataset.editRegion;if(e.hasAttribute("data-edit-item"))return"Card";if(e.hasAttribute("data-edit-icon"))return"Icon";if(e.hasAttribute("data-edit-svg"))return"Drawing";if(e.hasAttribute("data-edit"))return"Text";if(e.hasAttribute("data-has-bg")||e.hasAttribute("data-edit-bg"))return"Background";if(t==="SECTION"||t==="MAIN"||t==="ARTICLE")return"Section";let n=e.getBoundingClientRect();return n.width>window.innerWidth*.6&&n.height>180?"Section":"Group"},Be=(e,t)=>{let n=e.tagName,i;return n==="IMG"?i=["radius","hidden"]:n==="A"||n==="BUTTON"?i=["background","textColor","fontSize","radius","hidden"]:/^(H[1-6]|P|SPAN|LI|BLOCKQUOTE|FIGCAPTION|DT|DD|TD|TH|CAPTION|CITE|Q|LABEL|STRONG|EM)$/.test(n)?i=["textColor","fontSize","hidden"]:i=["background","backgroundImage","paddingY","paddingX","radius","hidden"],t.filter(d=>i.includes(d.trim()))},le=({hint:e="PNG, JPG or WEBP, or drag one here",onFile:t}={})=>{let n=document.createElement("label");n.className="le-upload";let i=document.createElement("div");i.className="le-upload-inner";let d=document.createElement("span");d.className="le-upload-icon",d.textContent="\u2191";let u=document.createElement("span");u.className="le-upload-text";let p=document.createElement("span");p.className="le-upload-title",p.textContent="Upload from your computer";let l=document.createElement("span");l.className="le-upload-hint",l.textContent=e,u.append(p,l);let h=document.createElement("span");h.className="le-upload-btn",h.textContent="Choose file",i.append(d,u,h);let f=document.createElement("input");f.type="file",f.accept="image/*";let y=m=>{m&&(l.textContent=m.name,t?.(m))};return f.addEventListener("change",()=>y(f.files[0])),["dragenter","dragover"].forEach(m=>n.addEventListener(m,g=>{g.preventDefault(),n.classList.add("is-dragover")})),["dragleave","drop"].forEach(m=>n.addEventListener(m,g=>{g.preventDefault(),n.classList.remove("is-dragover")})),n.addEventListener("drop",m=>{let g=m.dataTransfer?.files?.[0];if(!g)return;let v=new DataTransfer;v.items.add(g),f.files=v.files,y(g)}),n.append(i,f),n},ze=e=>{let t=String(e).match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);return!t||t[4]!==void 0&&Number(t[4])===0?"":"#"+[1,2,3].map(n=>Number(t[n]).toString(16).padStart(2,"0")).join("")},he=e=>{if(!e)return"";let t=e.dataset.background||e.dataset.bg||e.dataset.backgroundImage;if(t)return t;let i=(getComputedStyle(e).backgroundImage||"").match(/url\((['"]?)(.*?)\1\)/);return i&&!i[2].startsWith("data:")?i[2]:""},Ce={background:"Background colour",backgroundImage:"Background image",textColor:"Text colour",fontSize:"Text size",paddingY:"Space above and below",paddingX:"Space left and right",radius:"Corner rounding"},je=(e,t,n,i)=>{let d=document.createElement("label");d.className="le-field";let u=e.replace(/([A-Z])/g," $1").toLowerCase(),p=Ce[e]??u.charAt(0).toUpperCase()+u.slice(1);if(d.append(p),t==="toggle"){let l=document.createElement("div");l.className="le-row";let h=document.createElement("input");h.type="checkbox",h.checked=n==="1",h.dataset.styleProp=e;let f=document.createElement("span");f.className="le-hint",f.textContent="Hidden from visitors. You still see it, dimmed, while editing.",l.append(h,f);let y=i?J(i).toLowerCase():"section";return d.replaceChildren(`Hide this ${y}`,l),d.className="le-field le-divided",d}if(t==="color"){let l=document.createElement("div");l.className="le-row";let h=document.createElement("input");h.type="color";let f=i?ze(getComputedStyle(i)[e==="textColor"?"color":"backgroundColor"]):"";h.value=n||f||"#ffffff",h.dataset.styleProp=e,h.className="le-color";let y=document.createElement("label");y.className="le-default";let m=document.createElement("input");m.type="checkbox",m.checked=!n,h.addEventListener("input",()=>m.checked=!1),y.append(m,"Use default"),l.append(h,y),d.append(l)}else if(t==="url"){let l=document.createElement("input");l.type="text",l.value=n??"",l.placeholder="Paste an image URL, or upload below",l.dataset.styleProp=e,l.className="le-input";let h=document.createElement("img");h.className="le-thumb",h.alt="";let f=C=>{h.src=C||"",h.style.display=C?"":"none"},y=n?"":he(i),m=document.createElement("span");m.className="le-hint";let g=(C,O)=>{m.textContent=C?O?"Current image (from the theme) \u2014 upload or paste a link to replace it":"Replacing with this image":"No image set",m.title=C||""};f(n||y),g(n||y,!n&&!!y),l.addEventListener("input",()=>{let C=l.value.trim();f(C||y),g(C||y,!C&&!!y)});let v=le({onFile:async C=>{f(URL.createObjectURL(C));let O=new FormData;O.append("file",C);try{let j=await(await I("/live-edit/upload",{method:"POST",body:O})).json();l.value=j.url,f(j.url),g(j.url,!1),l.dispatchEvent(new Event("input",{bubbles:!0}))}catch(_){window.alert(R(_,"save that"))}}}),x=B("div","le-ways"),L=B("button","le-btn le-wide","Replace background");L.type="button",L.addEventListener("click",()=>It(i,async({url:C,file:O,credit:_})=>{let j=C;if(O){f(URL.createObjectURL(O));let G=new FormData;G.append("file",O);try{j=(await(await I("/live-edit/upload",{method:"POST",body:G})).json()).url}catch(X){c.toast(R(X,"save that"));return}}j&&(l.value=j,f(j),g(j,!1),l.dispatchEvent(new Event("input",{bubbles:!0})),_&&c.toast(_,4e3))},"Free photos","background")),x.append(L),l.hidden=!0,v.hidden=!0,d.append(x,l,v,h,m)}else{let l=document.createElement("input");l.type="number",l.min=0,l.max=400,l.value=n??"",l.placeholder="default",l.dataset.styleProp=e,l.className="le-input",d.append(l)}return d},Fe={background:"color",backgroundImage:"url",textColor:"color",fontSize:"px",paddingX:"px",paddingY:"px",radius:"px",hidden:"toggle"},Re=(e,t,n)=>{w.styleKey=e;let i=(window.liveEditStyles??{})[e]??{},d=document.createElement("div");d.className="le-section-heading",d.textContent="Style",k.append(d);let u=0;if((n?Be(n,t):t).forEach(p=>{let l=(window.liveEditStyleProps??{})[p]??Fe[p];l&&(k.append(je(p,l,i[p],n)),u++)}),u===0){let p=document.createElement("div");p.className="le-hint",p.textContent="Nothing on this element can be restyled.",k.append(p)}},de=document.createElement("style");document.head.append(de);let Se=(e,t)=>{let n=`[data-style="${e}"]`,i="",d="";for(let[u,p]of Object.entries(t))p&&(i+={hidden:"opacity:.45 !important;",backgroundImage:`background-image:url('${p}') !important;background-size:cover !important;background-position:center !important;`,background:`background:${p} !important;`,textColor:`color:${p} !important;`,fontSize:`font-size:${p}px !important;`,radius:`border-radius:${p}px !important;`,paddingX:`padding-left:${p}px !important;padding-right:${p}px !important;`,paddingY:`padding-top:${p}px !important;padding-bottom:${p}px !important;`}[u]??"",u==="paddingY"&&(d+=`section${n}>div{padding-top:0 !important;padding-bottom:0 !important}`));return i?d+`${n}{${i}}`:d},fe=()=>{if(!w?.styleKey)return;let e=ne(),t=w.styleKey,n=Se(t,e),i={background:"background",textColor:"color",fontSize:"font-size",radius:"border-radius",backgroundImage:"background-image"};for(let[d,u]of Object.entries(e))u||(d==="hidden"&&(n+=`body.editing [data-style="${t}"]{opacity:1 !important}`),i[d]&&(n+=`[data-style="${t}"]{${i[d]}:revert-layer !important}`),d==="paddingY"&&(n+=`[data-style="${t}"]{padding-top:revert-layer !important;padding-bottom:revert-layer !important}section[data-style="${t}"]>div{padding-top:revert-layer !important;padding-bottom:revert-layer !important}`),d==="paddingX"&&(n+=`[data-style="${t}"]{padding-left:revert-layer !important;padding-right:revert-layer !important}`));de.textContent=n},ge=()=>{de.textContent=""};k.addEventListener("input",()=>{w&&(w.dirty=!0),fe()}),k.addEventListener("change",()=>{w&&(w.dirty=!0),fe()});let ne=()=>{let e={};return k.querySelectorAll("[data-style-prop]").forEach(t=>{if(t.type==="checkbox")e[t.dataset.styleProp]=t.checked?"1":"";else if(t.type==="color"){let n=t.closest("div").querySelector("input[type=checkbox]").checked;e[t.dataset.styleProp]=n?"":t.value}else e[t.dataset.styleProp]=t.value}),e},Q=null,be=()=>{!Q||!w||w.dirty||!F.classList.contains("is-open")||H!=="Edit"||Q.isConnected&&Xe(Q)},me=e=>e.dataset.editRegion?e.dataset.editRegion:e.dataset.editLabel?e.dataset.editLabel:e.querySelector(":scope > [data-style-edit]")?.dataset.editLabel??J(e),Xe=e=>{if(Q=e,e.dataset.editImg!==void 0)at(e);else if(e.dataset.edit!==void 0)He(e);else if(e.dataset.svgEdit!==void 0||e.dataset.editSvg!==void 0)zt(e);else if(e.dataset.editHref!==void 0)tt(e);else if(e.dataset.style!==void 0){let t=e.querySelector(":scope > [data-style-edit]");ot(t??e)}},Qe=e=>{w?.dirty&&!window.confirm("Discard unsaved changes?")||(ge(),Xe(e))},$=null,z=e=>{let t=$;$=e??null;let n=[],i=e?.parentElement;for(;i&&i!==document.body;)i.dataset&&(i.dataset.edit!==void 0||i.dataset.style!==void 0)&&n.unshift(i),i=i.parentElement;let d=[];n.forEach(p=>{let l=me(p);if(d.length&&d[d.length-1].label===l){d[d.length-1].node=p;return}d.push({node:p,label:l})});let u=d.slice(-3);t&&t!==e&&document.contains(t)&&!u.some(p=>p.node===t)&&u.unshift({node:t,label:`\u2190 ${me(t)}`}),Z.replaceChildren(),Z.classList.toggle("is-visible",u.length>0),u.forEach((p,l)=>{let h=p.node;l>0&&Z.append("\u203A");let f=document.createElement("button");f.type="button",f.textContent=p.label,f.className="le-crumb",f.addEventListener("click",()=>Qe(h)),Z.append(f)})},H="Edit",Le=e=>{H=e,Object.entries(T).forEach(([t,n])=>{n.classList.toggle("is-on",t===e),n.setAttribute("aria-selected",t===e?"true":"false")}),P.classList.toggle("le-hidden",e!=="Edit"),c.drawerFoot.classList.toggle("le-hidden",e!=="Edit"),e==="Changes"&&we(),e==="History"&&On()};Object.entries(T).forEach(([e,t])=>{t.addEventListener("click",()=>{e!=="Edit"&&w?.dirty&&!window.confirm("Discard unsaved changes?")||(Le(e),F.classList.contains("is-open")||Ze())})});let R=(e,t)=>{console.warn(`[live-edit] ${t}:`,e);let n=String(e?.message??"");return/failed to fetch|networkerror|load failed/i.test(n)?"No connection just now. Nothing has been lost; try again in a moment.":/\b401\b|\b403\b|unauthor|forbidden/i.test(n)?"Your editing session has expired. Reload the page to carry on.":/\b429\b|too many/i.test(n)?"That was a lot at once. Give it a few seconds and try again.":`Could not ${t}. Nothing has been lost; try again in a moment.`},M=null,De=async()=>{try{M=await(await I("/live-edit/credits",{method:"GET"})).json(),be()}catch(e){console.warn("[live-edit] could not read the credit balance:",e),M=null}},qe=async()=>{if(!(window.liveEditStyleProps&&window.liveEditStyles))try{let t=await(await I("/live-edit/content",{method:"GET"})).json();t?.styleProps&&(window.liveEditStyleProps=t.styleProps),t?.styles&&(window.liveEditStyles=t.styles),be()}catch(e){console.warn("[live-edit] could not read what this site allows to be styled:",e)}},ye=(e,t)=>{if(!M?.available||!t)return;let n=document.createElement("div");n.className="le-assist-head",n.append(Me("AI assist"),oe()),k.append(n),[["rewrite","Rewrite"],["shorten","Shorten"]].forEach(([i,d])=>{let u=M.costs?.[i]??1,p=document.createElement("button");p.type="button",p.className="le-assist";let l=document.createElement("span");l.textContent=d;let h=document.createElement("span");h.className="le-assist-cost",h.textContent=`${u} credit${u===1?"":"s"}`,p.append(l,h),(M.balance??0)<u&&(p.disabled=!0,h.classList.add("is-short"),p.title="Not enough credits"),p.addEventListener("click",()=>void Te(i,d,e,t,p,l)),k.append(p)})},oe=()=>{let e=document.createElement("span");return e.className="le-assist-balance",e.textContent=`${M?.balance??0} credits left`,e},Me=e=>{let t=document.createElement("div");return t.className="le-section-heading",t.textContent=e,t},Ae=()=>(document.querySelector('meta[property="og:site_name"]')?.content??document.querySelector('meta[name="application-name"]')?.content??(document.title??"").split(/\s+[|\u2013\u2014-]\s+/).pop()??"").replace(/\s+/g," ").trim().slice(0,120),_e=()=>(document.querySelector('meta[name="description"]')?.content??document.querySelector('meta[property="og:description"]')?.content??"").replace(/\s+/g," ").trim().slice(0,400),Te=async(e,t,n,i,d,u)=>{d.disabled=!0,u.textContent="Thinking\u2026";let p;try{p=await(await I("/live-edit/assist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:e,text:i.value,heading:Ne(n),role:J(n),page:window.location.pathname,site:Ae(),about:_e()})})).json()}catch(l){d.disabled=!1,u.textContent=t,c.toast(R(l,"rewrite that"));return}if(typeof p?.balance=="number"&&M&&(M.balance=p.balance),!p?.text){d.disabled=!1,u.textContent=t,c.toast(Ue(p?.reason));return}i.value=p.text,i.dispatchEvent(new Event("input",{bubbles:!0})),i.focus(),d.disabled=!1,u.textContent=t,c.toast(`Rewritten. ${p.balance} credits left.`)},Ne=e=>(((e.closest("section, article, header, div[data-style]")??document.body).querySelector("h1, h2, h3")??document.querySelector("h1"))?.textContent??"").replace(/\s+/g," ").trim().slice(0,200),Ue=e=>({not_enough_credits:"Not enough credits for that. You can buy more from your account.",no_suggestion:"No suggestion for this one. Your words are unchanged.",not_configured:"Rewriting is not switched on for this site yet.",nothing_to_work_with:"There are no words here to rewrite yet."})[e]??"Could not rewrite that just now. Your words are unchanged.",we=async()=>{k.replaceChildren(Y("Loading\u2026"));let e;try{e=await(await I("/live-edit/changes",{method:"GET"})).json()}catch(n){k.replaceChildren(Y(R(n,"show your changes")));return}let t=e?.changes??[];if(t.length===0){k.replaceChildren(Y("No unpublished changes."));return}k.replaceChildren(),t.forEach(n=>{let i=document.createElement("div");i.className="le-change";let d=document.createElement("div");d.className="le-row le-change-head";let u=document.createElement("span");u.className="le-change-label",u.textContent=ae(n);let p=document.createElement("button");if(p.type="button",p.className="le-chip-btn",p.textContent="Revert",p.addEventListener("click",()=>void V(n,p)),d.append(u,p),i.append(d),n.before){let h=document.createElement("p");h.className="le-change-before",h.textContent=ve(n.before),i.append(h)}let l=document.createElement("p");l.className="le-change-after",l.textContent=ve(n.after)||"(empty)",i.append(l),k.append(i)})},ve=e=>{let t=String(e??"").replace(/\s+/g," ").trim();return t.length>70?`${t.slice(0,70)}\u2026`:t},ae=e=>{let t=document.querySelector(`[data-edit="setting:${CSS.escape(e.key)}"], [data-edit-img="setting:${CSS.escape(e.key)}"], [data-style="${CSS.escape(e.key)}"]`);return t?J(t):e.kind==="style"?"Styling":"Text"},V=async(e,t)=>{t.disabled=!0,t.textContent="Reverting\u2026";try{await I("/live-edit/changes",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:e.key,kind:e.kind})})}catch(n){t.disabled=!1,t.textContent="Revert",c.toast(R(n,"put that back"));return}N("Reverted \u2713")},On=async()=>{k.replaceChildren(Y("Loading\u2026"));let e;try{e=await(await I("/live-edit/versions",{method:"GET"})).json()}catch(n){k.replaceChildren(Y(R(n,"show what has been published")));return}let t=e?.versions??[];if(t.length===0){k.replaceChildren(Y("Nothing published yet. Your first publish will appear here."));return}k.replaceChildren(),t.forEach((n,i)=>{let d=document.createElement("div");d.className="le-version";let u=document.createElement("span");u.className=i===0?"le-version-dot is-latest":"le-version-dot";let p=document.createElement("div"),l=document.createElement("p");l.className="le-change-after",l.textContent=n.restored_from?`Restored version ${n.restored_from}`:`Published ${n.changes??0} change${n.changes===1?"":"s"}`;let h=document.createElement("p");h.className="le-change-when",h.textContent=Pn(n.published_at),p.append(l,h),d.append(u,p),k.append(d)})},Y=e=>{let t=document.createElement("p");return t.className="le-hint",t.textContent=e,t},Pn=e=>{if(!e)return"";let t=Math.round((Date.now()-new Date(e).getTime())/1e3);return t<90?"Just now":t<3600?`${Math.round(t/60)} minutes ago`:t<86400?`${Math.round(t/3600)} hours ago`:t<86400*8?`${Math.round(t/86400)} days ago`:new Date(e).toLocaleDateString()},Ze=()=>{$e(),lt(),F.classList.add("is-open"),c.toolbar.classList.add("is-compact"),H==="Edit"&&k.querySelector("textarea, input:not([type=checkbox]), select")?.focus()},xe=(e=!1)=>{!e&&w?.dirty&&!window.confirm("Discard unsaved changes?")||(w?.restore?.(),ge(),F.classList.remove("is-open"),c.toolbar.classList.remove("is-compact"),w=null)},In=()=>document.querySelectorAll("[data-edit], [data-edit-img], [data-edit-bg], [data-edit-href], [data-edit-icon], [data-edit-svg]"),et=async(e,t=0)=>{try{if(e.cssRules){let n=[];for(let i of e.cssRules)i.styleSheet&&t<4?n.push(await et(i.styleSheet,t+1)):n.push(i.cssText);return n.join("")}}catch{}if(!e.href)return"";try{let n=await fetch(e.href);if(!n.ok)return"";let i=await n.text();if(t>=4)return i;let d=[...i.matchAll(/@import\s+(?:url\(\s*(["']?)([^"')]+)\1\s*\)|(["'])([^"']+)\3)/gi)].map(p=>p[2]||p[4]).filter(Boolean),u=await Promise.all(d.map(p=>et({href:new URL(p,e.href).href},t+1)));return i+u.join("")}catch{return""}},Bn=null,zn=async()=>{let e=new Map;return(await Promise.all([...document.styleSheets].map(n=>et(n)))).forEach(n=>Qt(n).forEach(i=>e.set(i.name,i.glyph))),[...e].map(([n,i])=>({name:n,glyph:i})).sort((n,i)=>n.name.localeCompare(i.name))},Tt=()=>Bn??(Bn=zn()),Nt=()=>{document.querySelectorAll("[data-style]").forEach(e=>{if(e.hasAttribute("data-edit-bg"))return;let n=(getComputedStyle(e).backgroundImage||"").match(/url\((['"]?)(.*?)\1\)/),i=e.getBoundingClientRect(),d=n&&!n[2].startsWith("data:")&&i.width>=120&&i.height>=120;e.toggleAttribute("data-has-bg",!!d)})},jn=()=>{document.querySelectorAll("[data-edit-icon]").forEach(e=>{let t=getComputedStyle(e,"::before").content;(t==="none"||t==="normal"||t==='""'||t==="")&&e.removeAttribute("data-edit-icon")})},ke=e=>{e&&jn(),document.body.classList.toggle("editing",e),In().forEach(t=>{e?t.setAttribute("tabindex","0"):t.removeAttribute("tabindex")}),sessionStorage.setItem("tb_editing",e?"1":"0"),re.textContent=e?"Click any outlined text or image":"",re.parentElement?.classList.toggle("is-saying",e),!e&&typeof $e=="function"&&$e(),c.toolbar.classList.toggle("is-editing",e),te.textContent=e?"Done editing":"Edit site",e?(Nt(),document.querySelector("[data-edit-icon]")&&Tt(),o?.base&&o?.site&&Promise.resolve().then(()=>(vt(),wt)).then(t=>t.refreshBackgrounds({base:o.base,site:o.site,key:o.token})).then(t=>{t&&Nt()}).catch(t=>console.warn("[live-edit] could not look again for backgrounds:",t.message))):(lt(),ue()),e||xe(!0)},Fn=async()=>{let e=window.liveEditApi,t=await Promise.resolve().then(()=>($n(),Nn)).catch(()=>null);if(t?.forget(window),!e||!t){window.location.reload();return}let n=window.prompt("Your editing session has ended. Enter your email address and we will send you a new link.");n&&(await t.requestLink(e,n,window).catch(()=>{}),window.alert("If that address can edit this site, a link is on its way.")),window.location.reload()},I=async(e,t)=>{let n=window.liveEditApi,i=n?nn(e,t,n):null,d=i?await fetch(i.url,i.init):await fetch(e,Kt(r,t));if(d.status===419||d.status===401)throw await Fn(),new Error("Your editing session has ended.");if(!d.ok){let u=await d.json().catch(()=>({}));throw new Error(u.error?.message??u.message??"Could not save. Try again.")}if(!Xt(d))throw new Error("That did not save. Reload the page and try again.");return d},Rn=(e,t)=>{if(!e?.element)return null;let n=i=>{let d=e.element.getAttribute(i);return d===null?null:{attr:i,marker:d}};if(e.kind==="image"){let i=t.querySelector("input[type=url]")?.value.trim(),d=t.querySelector("input[type=file]")?.files?.[0],u=n("data-edit-img")??n("data-edit-bg");return i&&u?{...u,kind:"image",value:i}:null}if(e.kind==="icon"){let i=n("data-edit-icon");return i&&e.value?{...i,kind:"icon",value:e.value}:null}if(e.kind==="setting"&&typeof e.savedValue=="string"){let i=n("data-edit");return!i||/<[a-z][\s\S]*>/i.test(e.savedValue)||e.element.hasAttribute("data-edit-attr")?null:{...i,kind:"text",value:e.savedValue}}return null},Dn=async e=>{let t=window.liveEditApi?.builderUrl;if(!t||e?.kind!=="setting"||typeof e.savedValue!="string"||!e.element)return;let n=e.element.closest(".elementor-element[data-id]");if(n)try{await fetch(t,{method:"POST",headers:{"Content-Type":"application/json",...window.liveEditApi?.publishHeaders??{}},body:JSON.stringify({page:window.location.href,element:n.dataset.id,value:e.savedValue})})}catch(i){console.warn("[live-edit] could not tell the page builder about this change:",i.message)}},qn=async()=>{if(!w)return;let e=c.saveButton;e.disabled=!0,e.textContent="Saving\u2026";let t=()=>{e.disabled=!1,e.textContent="Save changes"};try{if(w.kind==="setting")await I("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:w.key,value:w.savedValue=w.value??k.querySelector("textarea, input[name=icon]")?.value??"",locale:window.liveEditLocale})});else if(w.kind==="record"){let n={};k.querySelectorAll("textarea, select, input[type=hidden][name]").forEach(i=>n[i.name]=i.value),await I("/live-edit/record",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:w.type,id:w.id,fields:n})})}else if(w.kind==="icon")await I("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:w.key,value:w.value})});else if(w.kind==="image"){let n=new FormData;n.append("target",w.target);let i=k.querySelector("input[type=file]").files[0],d=k.querySelector("input[type=url]").value.trim(),u=w.element?.getBoundingClientRect?.();u&&u.width>=1&&u.height>=1&&(n.append("fitWidth",String(Math.round(u.width))),n.append("fitHeight",String(Math.round(u.height))));let p=i!==void 0||d!==""&&d!==void 0;w.credit&&w.creditFor===w.target&&p&&Object.entries(w.credit).forEach(([h,f])=>n.append(h,f));let l=[...k.querySelectorAll("[data-img-attr]")];if(i?n.append("file",i):d&&n.append("url",d.startsWith("http")?d:`https://${d}`),l.forEach(h=>n.append(h.dataset.imgAttr,h.value)),!i&&!d&&l.length===0){t(),window.alert("Choose a file from your computer or paste an image URL first.");return}await I("/live-edit/image",{method:"POST",body:n})}if(w.hrefKey){let n=k.querySelector("[data-link-field=href]").value.trim(),i=k.querySelector("[data-link-field=target]").checked;await I("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:w.hrefKey,value:n})}),w.targetKey&&await I("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:w.targetKey,value:i?"_blank":""})})}w.styleKey&&await I("/live-edit/style",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:w.styleKey,props:ne()})}),await Dn(w),Jt(Rn(w,k)),D("Saved \u2713",w.key??null,w.savedValue??null)}catch(n){t(),window.alert(n.message)}};De(),qe();let B=(e,t,n)=>{let i=document.createElement(e);return t&&(i.className=t),n!=null&&(i.textContent=n),i},$t=e=>{let t=e.closest("section, article, header, div[data-style]");for(;t&&!t.querySelector("h1, h2, h3");)t=t.parentElement?.closest("section, article, header, div[data-style]")??null;let n=t?.querySelector("h1, h2, h3");return!t||!n?"":[...t.querySelectorAll("p, span, div, h4, h5, h6")].filter(d=>d.children.length===0).filter(d=>n.compareDocumentPosition(d)&Node.DOCUMENT_POSITION_PRECEDING).map(d=>(d.textContent??"").replace(/\s+/g," ").trim()).find(d=>d.length>3&&d.length<42)??""},Mn=/^(the|and|with|for|your|our|from|that|this|they|them|will|have|more|about|into|just|than|then|when|what|where|very|been|here|there)$/,Ot=e=>{let t=new Set((document.title??"").toLowerCase().split(/[^a-z0-9]+/i).filter(Boolean));return(e??"").toLowerCase().split(/[^a-z0-9]+/i).filter(n=>n.length>3&&!Mn.test(n)&&!t.has(n))},_n=e=>{let t=Ot($t(e)).slice(0,3);if(t.length>0)return t.join(" ");let n=Ot(Ne(e)).slice(0,3);return n.length>0?n.join(" "):"workplace"},Pt=e=>{let t=_n(e),n=(e.dataset.editLabel??"").toLowerCase().trim(),i=/hero|banner|header|cover/.test(n);return[...new Set([t,i?`${t} wide`:`${t} close up`,"workplace"].filter(Boolean))].slice(0,4)},Un=e=>`${($t(e)||Ne(e)||"This page").replace(/[.\s]+$/,"")}. Photographic, natural daylight, calm and editorial, soft neutral tones to match the rest of the site. No text.`,It=(e,t,n="Free photos",i="image")=>{let d=c.modal({title:`Replace ${i}`,subtitle:e.dataset.editLabel??J(e)}),u=document.createElement("div");d.body.append(u),d.tabs.hidden=!1;let p=y=>{d.close(),t(y)},l={Upload:()=>Hn(u,p),"Free photos":()=>void Wn(u,e,p),"Generate with AI":()=>Vn(u,e,p)},h=Object.keys(l).map(y=>{let m=document.createElement("button");return m.type="button",m.className="le-modal-tab",m.textContent=y,m.addEventListener("click",()=>f(y)),d.tabs.append(m),[y,m]}),f=y=>{h.forEach(([m,g])=>g.classList.toggle("is-on",m===y)),u.replaceChildren(),l[y]()};return f(l[n]?n:"Free photos"),d},Hn=(e,t)=>{e.append(le({hint:"PNG, JPG or WEBP, or drag one here",onFile:l=>t({file:l})}));let n=B("div","le-row-tight"),i=document.createElement("input");i.type="url",i.className="le-search",i.placeholder="Or paste a link to a picture";let d=B("button","le-btn-outline","Use it");d.type="button";let u=()=>{let l=i.value.trim();l&&t({url:l.startsWith("http")?l:`https://${l}`})};d.addEventListener("click",u),i.addEventListener("keydown",l=>{l.key==="Enter"&&(l.preventDefault(),u())}),n.append(i,d),e.append(n);let p=B("p","le-hint","You can also drag a picture straight onto the image on the page.");p.style.marginTop="14px",e.append(p)},Wn=async(e,t,n)=>{let i=document.createElement("input");i.type="search",i.className="le-search",i.placeholder="Search free photographs";let d=document.createElement("div");d.className="le-chips";let u=document.createElement("div");u.className="le-grid";let p=document.createElement("p");p.className="le-hint",p.style.marginTop="16px",e.append(i,d,u,p);let l=()=>{u.replaceChildren();for(let f=0;f<6;f+=1)u.append(B("div","le-shimmer"))},h=async f=>{i.value=f,l();let y;try{y=await(await I(`/live-edit/photos?q=${encodeURIComponent(f)}`,{method:"GET"})).json()}catch(g){u.replaceChildren(Y(R(g,"look for photographs")));return}let m=y?.photos??[];if(p.textContent=y?.source==="openverse"?"Free to use, including commercially. The photographer is credited automatically.":"Free to use under the Unsplash licence. The photographer is credited automatically.",m.length===0){u.replaceChildren(Y(Jn(y?.reason,f)));return}u.replaceChildren(),m.forEach(g=>{let v=document.createElement("button");v.type="button",v.className="le-pick";let x=document.createElement("img");x.className="le-pick-shot",x.src=g.thumb??g.full,x.alt=g.alt??"",x.loading="lazy";let L=B("span","le-pick-by",g.by?`Photo by ${g.by}`:"");v.append(x,L),v.addEventListener("click",()=>{g.downloadLocation&&I("/live-edit/photos/used",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({download_location:g.downloadLocation})}).catch(()=>{}),n({url:g.full,alt:g.alt??"",credit:g.credit??(g.by?`Photo by ${g.by}`:""),creditBy:g.by??"",creditUrl:g.byUrl??"",creditSource:g.source??"",creditSourceUrl:g.sourceUrl??""})}),u.append(v)})};Pt(t).forEach((f,y)=>{let m=document.createElement("button");m.type="button",m.className="le-chip",m.textContent=f,m.addEventListener("click",()=>void h(f)),d.append(m),y===0&&m.classList.add("is-on")}),i.addEventListener("keydown",f=>{f.key==="Enter"&&(f.preventDefault(),i.value.trim()&&h(i.value.trim()))}),await h(Pt(t)[0])},Jn=(e,t)=>({not_configured:"Free photographs are not switched on for this site yet.",not_allowed:"The photo library would not accept this site\u2019s key. It needs setting up again.",unreachable:"Could not reach the photo library just now. Try again in a moment.",nothing_to_search_for:"Type what the picture should show."})[e]??`Nothing found for "${t}". Try fewer words.`,Vn=(e,t,n)=>{let i=Un(t),d=B("div","le-suggest");d.append(B("div","le-eyebrow","Suggested for this spot"),B("div","le-suggest-text",i));let u=document.createElement("button");u.type="button",u.className="le-chip",u.style.marginTop="10px",u.textContent="Use this description",d.append(u);let p=document.createElement("textarea");p.className="le-textarea",p.placeholder="Describe the picture you want",u.addEventListener("click",()=>{p.value=i,p.focus()});let l=document.createElement("button");l.type="button",l.className="le-btn-publish",l.style.marginTop="14px",l.textContent="Make a picture \xB7 5 credits";let h=B("div","le-grid is-square");h.style.display="none",e.append(d,p,l,h),l.addEventListener("click",async()=>{let f=p.value.trim()||i;l.disabled=!0,l.textContent="Making\u2026",h.style.display="",h.replaceChildren();for(let g=0;g<4;g+=1)h.append(B("div","le-shimmer"));let y;try{y=await(await I("/live-edit/imagine",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:f})})).json()}catch(g){h.replaceChildren(Y(R(g,"make a picture"))),l.disabled=!1,l.textContent="Try again \xB7 5 credits";return}let m=y?.images??[];if(typeof y?.balance=="number"&&(M={...M??{},balance:y.balance}),m.length===0){h.replaceChildren(Y(Yn(y?.reason))),l.disabled=!1,l.textContent="Try again \xB7 5 credits";return}h.replaceChildren(),m.forEach(g=>{let v=document.createElement("button");v.type="button",v.className="le-pick";let x=document.createElement("img");x.className="le-pick-shot",x.src=g,x.alt="",v.append(x,B("span","le-tag","MADE")),v.addEventListener("click",()=>n({url:g,credit:"",creditSource:"Generated"})),h.append(v)}),l.disabled=!1,l.textContent="Make four more \xB7 5 credits"})},Yn=e=>({not_enough_credits:"Not enough credits to make a picture. You can buy more from your account.",not_configured:"Making pictures is not switched on for this site yet.",no_suggestion:"Nothing usable came back, so you have not been charged. Try describing it differently.",nothing_to_work_with:"Describe the picture you want first."})[e]??"Could not make a picture just now. You have not been charged.",Ee=null,Gn=(e,t)=>{if(!t)return;let n=ie(e),i=!1;w.restore=()=>{i&&Ee&&Ee(e,n)},t.addEventListener("input",()=>{Ee&&(i=!0,Ee(e,t.value))}),Ee===null&&Promise.resolve().then(()=>(St(),Ct)).then(d=>Ee=d.applyValue).catch(d=>console.warn("[live-edit] could not preview words as you type:",d.message))},Kn=e=>{w.hrefKey=e.dataset.editHref,w.targetKey=e.dataset.editTarget;let t=document.createElement("div");t.className="le-field le-divided",t.append("Link");let n=document.createElement("input");n.type="text",n.dataset.linkField="href";let i=e.getAttribute("href")??"";n.value=i==="#"?"":i,n.placeholder="/contact or https://...",n.className="le-input le-link";let d=document.createElement("label");d.className="le-default";let u=document.createElement("input");u.type="checkbox",u.dataset.linkField="target",u.checked=e.getAttribute("target")==="_blank",d.append(u,"Open in a new tab"),t.append(n,d),k.append(t)},tt=e=>{w={kind:"link"},q.textContent=e.dataset.editLabel??"Link",k.replaceChildren(),U.classList.add("le-hidden"),ce(e)},He=e=>{let{kind:t,key:n,parts:i}=Gt(e.dataset.edit);if(k.replaceChildren(),U.classList.add("le-hidden"),t==="setting"){w={kind:t,key:n,element:e},q.textContent=e.dataset.editLabel??J(e);let d=(window.liveEditRich?.settings??[]).includes(i[0]),u=gt({editValue:e.dataset.editValue,ownText:ie(e),fullText:e.textContent}),p=d?u.trim():u.replace(/\s+/g," ").trim(),l=e.dataset.editAs==="icon";k.append(l?se("icon","Icon",e.dataset.editValue??"",1,!1):se("value","Text",p,6,d)),l||ye(e,k.querySelector("textarea")),!l&&!d&&Gn(e,k.querySelector("textarea"))}else{let[d,u]=i;w={kind:"record",type:d,id:Number(u)};let p=e.dataset.editLabel??"Item",l=JSON.parse(e.dataset.editValues??"{}"),h=l.title??l.question??l.label??l.number;if(q.textContent=h?`${p}: ${h.slice(0,40)}`:p,Object.entries(l).forEach(([g,v])=>{let x=g.replace(/_/g," "),L=x.charAt(0).toUpperCase()+x.slice(1),C=(window.liveEditRich?.fields??[]).includes(`${d}.${g}`);k.append(se(g,L,v,g==="detail"||g==="answer"?6:3,C))}),window.liveEditPublishing){let g=document.createElement("div");g.className="le-hint le-immediate",g.textContent="Changes here go live as soon as you save, without publishing.",k.append(g)}e.hasAttribute("data-edit-deletable")&&(U.textContent=`Delete this ${p.toLowerCase()}`,U.classList.remove("le-hidden"));let f=document.createElement("div");f.className="le-row";let y=document.createElement("span");y.className="le-label",y.textContent="Order";let m=(g,v)=>{let x=document.createElement("button");return x.type="button",x.textContent=v,x.className="le-chip-btn",x.addEventListener("click",async()=>{(await(await I("/live-edit/record/move",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:w.type,id:w.id,direction:g})})).json()).moved?N("Reordered \u2713"):window.alert(g==="up"?"Already first.":"Already last.")}),x};f.append(y,m("up","\u2191 Move up"),m("down","\u2193 Move down")),k.prepend(f)}ce(e)},Xn=e=>{let t=e.closest?.("[data-edit-item]"),n=t?.parentElement?.dataset?.editList?t.parentElement:e.closest?.("[data-edit-list]");if(!n?.dataset?.editList)return;let i=()=>[...n.children].filter(h=>h.dataset.editItem).map(h=>h.dataset.editItem),d=async(h,f)=>{try{await I("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:n.dataset.editList,value:JSON.stringify(h)})}),N(f)}catch(y){window.alert(y.message)}},u=document.createElement("div");u.className="le-section-heading",u.textContent="List";let p=document.createElement("div");p.className="le-row";let l=document.createElement("button");if(l.type="button",l.className="le-chip-btn",l.textContent=t?"+ Add another":"+ Add item",l.addEventListener("click",()=>{let h=i(),f=t?h.indexOf(t.dataset.editItem):h.length-1;h.splice(f+1,0,"n"+Date.now().toString(36)),d(h,"Added \u2713")}),p.append(l),t){let h=document.createElement("button");h.type="button",h.className="le-btn-danger",h.textContent="Delete this item",h.addEventListener("click",()=>{window.confirm("Delete this item?")&&d(i().filter(f=>f!==t.dataset.editItem),"Deleted \u2713")}),p.append(h)}k.append(u,p)},nt=!1,Qn=e=>{nt=!0,e.click(),window.setTimeout(()=>{nt=!1},0)},Zn=e=>e.closest?.('a[href^="#"], [aria-controls], [aria-expanded], [data-toggle], [role="button"]')??null,eo=e=>{let t=Zn(e);if(t){let p=document.createElement("div");p.className="le-row";let l=document.createElement("button");l.type="button",l.className="le-chip-btn",l.textContent="Open this menu",l.title="Runs the control so you can edit what it reveals",l.addEventListener("click",()=>{xe(!0),Qn(t)}),p.append(l),k.append(p)}let n=e.closest?.("a[href]"),i=n?.getAttribute("href");if(!i||i==="#"||i.startsWith("javascript:"))return;let d=document.createElement("div");d.className="le-row";let u=document.createElement("button");u.type="button",u.className="le-chip-btn",u.textContent="Open this link \u2192",u.addEventListener("click",()=>{window.location.href=n.href}),d.append(u),k.append(d)},ce=(e,{styleKey:t=null,styleOn:n=e}={})=>{e.dataset.editHref!==void 0&&Kn(e),eo(e);let i=t??n.dataset.styleEdit??n.dataset.style,d=tn(n.dataset.styleProps,window.liveEditStyleProps);i&&d.length&&Re(i,d,n),no(e),Xn(e),z(e.dataset.styleEdit?e.closest("[data-style]")??e.parentElement:e),Le("Edit"),Ze()},to=e=>{let t=(ie(e)||e.textContent||"").replace(/\s+/g," ").trim();if(t)return t.slice(0,28);let n=(e.getAttribute("aria-label")??e.getAttribute("title")??"").trim();if(n)return n.slice(0,28);let i=e.className.toString().match(/(?:social-icon-|fa-|bi-|icon-)([a-z][a-z0-9-]{2,})/i)?.[1]??[...e.querySelectorAll("[class]")].map(d=>d.className.toString().match(/(?:social-icon-|fa-|bi-|icon-)([a-z][a-z0-9-]{2,})/i)?.[1]).find(Boolean);return i?i.charAt(0).toUpperCase()+i.slice(1):me(e)},no=e=>{let t="[data-edit], [data-edit-img], [data-edit-bg], [data-edit-href], [data-edit-icon], [data-edit-svg]",n=[...e.querySelectorAll(t)].filter(p=>p.parentElement?.closest(t)===null||!e.contains(p.parentElement.closest(t))).filter(p=>p!==e&&p.getBoundingClientRect().width>0);if(n.length===0)return;let i=n.slice(0,24),d=document.createElement("div");d.className="le-section-heading",d.textContent=n.length>i.length?`Inside this \u2014 first ${i.length} of ${n.length}`:"Inside this",k.append(d);let u=document.createElement("div");u.className="le-row",i.forEach(p=>{let l=document.createElement("button");l.type="button",l.className="le-chip-btn",l.textContent=to(p),l.addEventListener("click",()=>Qe(p)),u.append(l)}),k.append(u)},ot=e=>{w={kind:"style"};let t=e.dataset.styleEdit??e.dataset.style;q.textContent=e.dataset.editLabel??J(e),k.replaceChildren(),U.classList.add("le-hidden"),ce(e,{styleKey:t})},We=e=>{let t=getComputedStyle(e,"::before");return`${t.fontStyle} ${t.fontWeight} 20px ${t.fontFamily}`},Bt=(e,t)=>{let n=e.cloneNode(!1);n.removeAttribute("data-edit-icon"),Object.assign(n.style,{position:"absolute",visibility:"hidden",pointerEvents:"none"}),(e.parentNode??document.body).append(n);let i=We(n),d=[];return[...n.classList].forEach(u=>{u!==t&&(n.classList.remove(u),We(n)!==i&&d.push(u),n.classList.add(u))}),n.remove(),d},oo=(e,t,n,i)=>Zt([...e.classList],n,i,Bt(e,i),Bt(t,t.dataset.editIconCurrent)),ao=(e,t)=>{let n=document.createElement("canvas").getContext("2d");return n.font=t,e.filter(({glyph:i})=>{let d=n.measureText(i);return(d.actualBoundingBoxAscent||0)+(d.actualBoundingBoxDescent||0)>0})},io=async e=>{let t=e.dataset.editIconCurrent;w={kind:"icon",key:e.dataset.editIcon.replace(/^setting:/,""),value:t,element:e},q.textContent="Icon",k.replaceChildren(),U.classList.add("le-hidden");let n=We(e),i=await Tt();if(w?.element!==e)return;let d=new Map([[n,null]]);document.querySelectorAll("[data-edit-icon]").forEach(g=>{let v=We(g);d.has(v)||d.set(v,g)});let u=en([...d].map(([g,v])=>({face:g,variant:v,icons:ao(i,g)})));if(u.length===0){let g=document.createElement("div");g.className="le-hint",g.textContent="This theme loads its icons from somewhere this page cannot read, so they cannot be listed. Type the icon name instead.";let v=document.createElement("label");v.className="le-field",v.append("Icon name");let x=document.createElement("input");x.type="text",x.className="le-input",x.value=t??"",x.addEventListener("input",()=>{w.value=x.value.trim(),w.dirty=!0}),v.append(x,g),k.append(v),ce(e);return}let p=e.className;w.restore=()=>{e.className=p,e.dataset.editIconCurrent=t};let l=document.createElement("input");l.type="search",l.className="le-input",l.placeholder=`Search ${u.length} icons\u2026`;let h=document.createElement("div");h.className="le-icon-grid";let f=document.createElement("div");f.className="le-hint";let y=400,m=g=>{let v=g.trim().toLowerCase().replace(/\s+/g,"-"),x=v?u.filter(({name:L})=>L.includes(v)):u;if(h.replaceChildren(),x.slice(0,y).forEach(({name:L,glyph:C,face:O,variant:_})=>{let j=document.createElement("button");j.type="button",j.className="le-icon-choice",j.title=L.replace(/^[a-z]+-/,"").replace(/-/g," "),j.classList.toggle("is-current",L===t),j.style.font=O,j.textContent=C,j.addEventListener("click",()=>{e.className=p,e.dataset.editIconCurrent=t;let G=_?oo(e,_,L,t):L;_?e.className=G:e.classList.replace(t,L),e.dataset.editIconCurrent=L,w.value=G,w.dirty=!0,h.querySelectorAll(".le-icon-choice").forEach(X=>X.classList.remove("is-current")),j.classList.add("is-current")}),h.append(j)}),x.length===0){let L=document.createElement("div");L.className="le-hint",L.textContent="No icon matches that name.",h.append(L)}f.textContent=x.length>y?`Showing ${y} of ${x.length}. Type to narrow it down.`:""};l.addEventListener("input",()=>m(l.value)),m(""),k.append(l,h,f),ce(e)},zt=e=>{let t=e.outerHTML;w={kind:"setting",key:e.dataset.editSvg.replace(/^setting:/,""),element:e},q.textContent=e.dataset.editLabel??"Drawing",k.replaceChildren(),U.classList.add("le-hidden");let n=()=>{e.outerHTML=t};w.restore=n;let i=new Set,d=[];document.querySelectorAll("svg").forEach(m=>{let g=m.outerHTML,v=g.replace(/\s+(class|style|width|height|data-[\w-]+)="[^"]*"/g,"");i.has(v)||m.getBoundingClientRect().width<4||(i.add(v),d.push(g))});let u=document.createElement("div");u.className="le-icon-grid";let p=null;d.slice(0,120).forEach(m=>{let g=document.createElement("button");g.type="button",g.className="le-icon-choice",g.innerHTML=m;let v=g.firstElementChild;v&&(v.removeAttribute("class"),v.setAttribute("width","20"),v.setAttribute("height","20")),g.classList.toggle("is-current",m===t),g.addEventListener("click",()=>{p=m,w.value=m,w.dirty=!0;let x=document.querySelector(`[data-edit-svg="${e.dataset.editSvg}"]`)??e,L=new DOMParser().parseFromString(m,"image/svg+xml").documentElement;["class","width","height","style","data-edit-svg","data-edit-label"].forEach(C=>{x.hasAttribute(C)&&L.setAttribute(C,x.getAttribute(C))}),x.replaceWith(L),u.querySelectorAll(".le-icon-choice").forEach(C=>C.classList.remove("is-current")),g.classList.add("is-current")}),u.append(g)});let l=document.createElement("label");l.className="le-field le-divided",l.append("Or paste an SVG");let h=document.createElement("textarea");h.className="le-input le-prose",h.placeholder='<svg viewBox="0 0 24 24">\u2026</svg>',h.addEventListener("input",()=>{h.value.trim()!==""&&(w.value=h.value.trim(),w.dirty=!0)});let f=document.createElement("div");f.className="le-hint",f.textContent="Anything that could run or fetch is stripped before it is saved.",l.append(h,f);let y=document.createElement("div");y.className="le-section-heading",y.textContent=d.length?"Drawings on this site":"No other drawings here",k.append(y,u,l),ce(e)},at=e=>{let t=e.dataset.editKind==="background";w={kind:"image",target:e.dataset.editImg??e.dataset.editBg,element:e},q.textContent=e.dataset.editLabel??(t?"Background image":"Image"),k.replaceChildren(),U.classList.add("le-hidden");let n=document.createElement("div");n.className="le-preview";let i=document.createElement("img");i.alt="",i.className="";let d=e.dataset.editPreview;d?(i.src=d,n.append(i)):n.textContent="No image yet";let u=C=>{n.replaceChildren(i),i.src=C},p=le({onFile:C=>u(URL.createObjectURL(C))}),l=document.createElement("label");l.className="le-field",l.append("Or paste an image URL");let h=document.createElement("input");h.type="url",h.placeholder="https://...",h.className="le-input",h.addEventListener("change",()=>{let C=h.value.trim();C&&u(C.startsWith("http")?C:`https://${C}`)}),l.append(h);let f=document.createElement("div");f.className="le-hint",f.textContent="Nothing changes on your site until you publish.";let y=(C,O,_,j)=>{let G=document.createElement("label");G.className="le-field le-divided",G.append(O);let X=document.createElement("input");if(X.type="text",X.dataset.imgAttr=C,X.value=_??"",X.className="le-input",G.append(X),j){let Pe=document.createElement("span");Pe.className="le-hint",Pe.textContent=j,G.append(Pe)}return G},m=B("div","le-ways"),g=({url:C,file:O,credit:_,alt:j,creditBy:G,creditUrl:X,creditSource:Pe,creditSourceUrl:ho})=>{if(O){let Ht=new DataTransfer;Ht.items.add(O),p.querySelector("input[type=file]").files=Ht.files,u(URL.createObjectURL(O))}else C&&(h.value=C,u(C));let pt=k.querySelector('[data-img-attr="alt"]');j&&pt&&pt.value.trim()===""&&(pt.value=j),w.credit={credit:_??"",creditBy:G??"",creditUrl:X??"",creditSource:Pe??"",creditSourceUrl:ho??""},w.creditFor=w.target,x(w.credit),c.saveButton.click()},v=B("p","le-credit"),x=C=>{let O=(C?.credit??"").trim();v.textContent=O,v.hidden=O===""};x({credit:Ye(e,"data-edit-credit","editCredit")});let L=B("button","le-btn le-wide",t?"Replace background":"Replace image");if(L.type="button",L.addEventListener("click",()=>It(e,g,"Free photos",t?"background":"image")),m.append(L),p.hidden=!0,l.hidden=!0,k.append(n,v,m,p,l,f),w.target.startsWith("setting:")&&!t&&k.append(y("alt","Alt text",Ye(e,"alt","editAlt"),"Describes the image for search engines and screen readers."),y("imgTitle","Title attribute",Ye(e,"title","editTitle"),"Optional tooltip shown on hover.")),w.target.startsWith("setting:")){let C=document.createElement("button");C.type="button",C.textContent=t?"Remove background":"Remove image",C.className="le-btn-danger",C.addEventListener("click",async()=>{let O=t?"Remove this background image? The section keeps its layout and colour.":"Remove this image? The section keeps its layout; you can add a new image any time.";if(!window.confirm(O))return;let _=new FormData;_.append("target",w.target),_.append("remove","1"),await I("/live-edit/image",{method:"POST",body:_}),N("Removed \u2713")}),k.append(C)}ce(e)},jt=e=>e?.closest?.("a[data-edit], a[data-edit-href]")??null,ro=e=>{let t=e?.getAttribute("href")??"";return t!==""&&t!=="#"&&!t.startsWith("javascript:")},pe=null,it=!1,Je=null,rt=()=>{Je&&(clearTimeout(Je),Je=null)},Ft=()=>{rt(),Je=setTimeout(()=>{it||$e()},140)},so=e=>{if(e===pe&&!W.classList.contains("hidden"))return;pe=e;let t=e.getBoundingClientRect();W.style.top=`${t.top+window.scrollY-10}px`,W.style.left=`${t.right+window.scrollX-10}px`,W.classList.add("is-visible")},$e=()=>{W.classList.remove("is-visible"),pe=null},Rt=e=>{if(!e?.closest)return null;let t=e.closest("[data-style-edit]");if(t)return{element:t,kind:"style"};let n=e.closest("[data-edit-img]");if(n)return{element:n,kind:"image"};let i=e.closest("[data-edit-icon]");if(i)return{element:i,kind:"icon"};let d=e.closest("[data-edit-svg]");if(d)return{element:d,kind:"svg"};let u=e.closest("[data-edit]");if(u)return{element:u,kind:"text"};let p=e.closest("[data-edit-href]:not([data-edit])");if(p)return{element:p,kind:"link"};let l=e.closest("[data-edit-bg]");if(l)return{element:l,kind:"image"};let h=e.closest("[data-style]:not([data-style-edit])");return h?{element:h,kind:"style"}:null},lo=({element:e,kind:t})=>{t==="image"?at(e):t==="icon"?io(e):t==="svg"?zt(e):t==="text"?He(e):t==="link"?tt(e):ot(e)},st=null,ue=()=>c.hoverBox.classList.remove("is-visible"),co=e=>{let t=e.getBoundingClientRect();if(t.width<4||t.height<4){ue();return}Object.assign(c.hoverBox.style,{top:`${t.top}px`,left:`${t.left}px`,width:`${t.width}px`,height:`${t.height}px`}),c.hoverBox.classList.toggle("is-flipped",t.top<26),c.hoverLabel.textContent=e.dataset.editLabel??J(e),c.hoverBox.classList.add("is-visible")};document.addEventListener("pointermove",e=>{if(!document.body.classList.contains("editing")){ue();return}if(e.target===c.root||c.root.contains(e.target)){ue();return}st||(st=requestAnimationFrame(()=>{st=null;let t=Rt(e.target);t?co(t.element):ue()}))}),document.addEventListener("scroll",ue,!0),document.addEventListener("pointerleave",ue);let Ve=null,lt=()=>{K.classList.remove("is-visible"),Ve=null},po=e=>{Ve=e;let t=e.getBoundingClientRect();K.style.top=`${Math.max(t.top,8)+8}px`,K.style.left=`${t.left+8}px`,K.classList.add("is-visible")};K.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),Ve&&ot(Ve),lt()}),document.addEventListener("pointerover",e=>{if(!document.body.classList.contains("editing"))return;let t=e.target.closest?.("[data-has-bg]");t&&po(t);let n=jt(e.target);n&&ro(n)&&(rt(),so(n))}),document.addEventListener("pointerout",e=>{document.body.classList.contains("editing")&&e.relatedTarget!==W&&(jt(e.relatedTarget)===pe&&pe||Ft())}),W.addEventListener("pointerenter",()=>{it=!0,rt()}),W.addEventListener("pointerleave",()=>{it=!1,Ft()}),W.addEventListener("click",e=>{if(e.preventDefault(),e.stopPropagation(),!pe)return;let t=pe;t.dataset.edit!==void 0?He(t):tt(t),$e()}),document.addEventListener("click",e=>{if(!document.body.classList.contains("editing")||nt||e.target===c.root||c.root.contains(e.target)||e.target.closest("[data-live-create]"))return;let t=Rt(e.target);t&&(e.preventDefault(),e.stopPropagation(),lo(t))},!0),document.addEventListener("keydown",e=>{if(e.key==="Escape"&&F.classList.contains("is-open")&&xe(),!document.body.classList.contains("editing")||e.key!=="Enter"&&e.key!==" "||c.shadow.activeElement)return;let t=document.activeElement;t?.matches("[data-edit-img], [data-edit-bg]")?(e.preventDefault(),at(t)):t?.matches("[data-edit]")&&!t.matches("button, a")&&(e.preventDefault(),He(t))}),te?.addEventListener("click",()=>ke(!document.body.classList.contains("editing"))),c.changesButton?.addEventListener("click",()=>{document.body.classList.contains("editing")||ke(!0),Le("Changes"),Ze()});let Dt=e=>{if(window.liveEditPublishing){e(window.liveEditPublishing);return}A().then(()=>window.liveEditPublishing&&e(window.liveEditPublishing))};Dt(e=>{let t=e.pending??0,n=()=>{c.publishButton.hidden=!1,c.previewButton.hidden=!1,c.publishLabel.textContent=t>0?"Publish":"Published",c.publishCount.textContent=String(t),c.publishCount.hidden=t===0,c.publishButton.disabled=t===0,c.publishButton.title=t>0?`Put ${t} change${t===1?"":"s"} live`:"Nothing is waiting to be published"};n();let i=async()=>{let u=t===1?"":"s",p=e.domain??window.location.host,l=c.modal({title:`Publish ${t} change${u}`,subtitle:`They go live on ${p} right away.`,size:"is-narrow"});l.body.append(Y("Loading\u2026"));let h=B("button","le-btn-outline","Keep editing");h.type="button",h.addEventListener("click",()=>l.close());let f=B("button","le-btn-publish","Publish now");f.type="button",l.foot.hidden=!1,l.foot.append(h,f),f.focus();try{let g=(await(await I("/live-edit/changes",{method:"GET"})).json())?.changes??[],v=B("div","le-review");g.forEach(x=>{let L=B("div","le-review-row");L.append(B("div","le-review-what",ae(x)),B("div","le-review-to",ve(x.after)||"(empty)")),v.append(L)}),l.body.replaceChildren(g.length>0?v:Y("Nothing is waiting."))}catch(y){l.body.replaceChildren(Y(R(y,"list what is waiting")))}f.addEventListener("click",async()=>{f.disabled=!0,h.disabled=!0,f.textContent="Publishing\u2026",l.allowDismiss(!1);try{await I("/live-edit/publish",{method:"POST"}),t=0,n(),l.close(),N(`Live on ${p} \u2713`)}catch(y){l.allowDismiss(!0),f.disabled=!1,h.disabled=!1,f.textContent="Try again",l.body.replaceChildren(Y(R(y,"publish that")))}})};c.publishButton.addEventListener("click",()=>{t!==0&&(document.activeElement?.blur?.(),i())});let d=()=>{let u=document.body.classList.contains("editing");xe(!0),ke(!1),c.toolbar.style.display="none";let p=document.createElement("div");p.className="le-back";let l=null,h=v=>{if(v&&!l){l=document.createElement("div"),l.className="le-phone";let x=document.createElement("iframe"),L=new URL(window.location.href);L.searchParams.set("live-edit","off"),x.src=L.toString(),x.title="This page on a phone",l.append(x),c.shadow.append(l)}else!v&&l&&(l.remove(),l=null)},y=[["Desktop",!1],["Phone",!0]].map(([v,x])=>{let L=B("button","le-back-btn",v);return L.type="button",L.addEventListener("click",()=>{y.forEach(C=>C.classList.remove("is-on")),L.classList.add("is-on"),h(x)}),p.append(L),L});if(y[0].classList.add("is-on"),e.previewUrl){let v=B("button","le-back-btn","Copy a link to this");v.type="button",v.title="A link that shows this unpublished version to somebody else",v.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(e.previewUrl),c.toast("Link copied \u2713")}catch{window.prompt("Copy this link:",e.previewUrl)}}),p.append(v)}let m=B("button","le-back-btn","Back to editing");m.type="button",m.addEventListener("click",()=>{h(!1),p.remove(),document.removeEventListener("keydown",g,!0),c.toolbar.style.display="",ke(u)});let g=v=>{v.key==="Escape"&&m.click()};document.addEventListener("keydown",g,!0),p.append(m),c.shadow.append(p),m.focus()};c.previewButton.addEventListener("click",d)});let uo=()=>{let e=document.querySelectorAll('nav, [role="navigation"], header ul'),t=new Map,n=i=>i.closest("#wpadminbar, #adminmenu, #wp-toolbar, #live-edit-ui, [data-no-edit], [data-live-edit-chrome]")!==null;return e.forEach(i=>{n(i)||i.querySelectorAll("a[href]").forEach(d=>{if(n(d))return;let u;try{u=new URL(d.getAttribute("href"),window.location.href)}catch{return}if(u.origin!==window.location.origin||/\.(pdf|zip|jpe?g|png|gif|svg|webp|mp4|mp3)$/i.test(u.pathname)||u.pathname===window.location.pathname&&u.hash)return;let p=(d.textContent??"").replace(/\s+/g," ").trim();p===""||p.length>22||t.has(u.pathname)||t.set(u.pathname,{label:p,href:u.href})})}),[...t.values()].slice(0,6)};(()=>{let e=uo();if(e.length<2)return;let t=window.location.pathname.replace(/\/$/,"");e.forEach(n=>{let i=B("button","le-page-btn",n.label);i.type="button",i.title=n.href,new URL(n.href).pathname.replace(/\/$/,"")===t?i.classList.add("is-on"):i.addEventListener("click",()=>{sessionStorage.setItem("tb_editing","1"),window.location.href=n.href}),c.pageSwitcher.append(i)}),c.pageSwitcher.hidden=!1})();let qt=`live-edit:redo:${o?.site??window.location.host}`,dt=()=>{try{return JSON.parse(sessionStorage.getItem(qt)??"[]")}catch{return[]}},Mt=e=>{try{sessionStorage.setItem(qt,JSON.stringify(e.slice(-20)))}catch{}},Oe=()=>{c.undoButton.disabled=(window.liveEditPublishing?.pending??0)===0,c.redoButton.disabled=dt().length===0};Dt(Oe),Oe();let _t=async()=>{c.undoButton.disabled=!0;let e;try{e=((await(await I("/live-edit/changes",{method:"GET"})).json())?.changes??[])[0]}catch(n){c.toast(R(n,"undo that")),Oe();return}if(!e){c.toast("There is nothing left to undo. Everything is published."),Oe();return}let t=ae(e);try{await I("/live-edit/changes",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:e.key,kind:e.kind})})}catch(n){c.toast(R(n,"undo that")),Oe();return}Mt([...dt(),{key:e.key,kind:e.kind,value:e.after,label:t}]),N(`Undone: ${t}`)},Ut=async()=>{let e=dt(),t=e.pop();if(!t){c.toast("There is nothing to put back.");return}c.redoButton.disabled=!0;try{if(t.kind==="style")throw new Error("A styling change cannot be put back automatically yet.");await I("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:t.key,value:t.value,locale:window.liveEditLocale})})}catch(n){c.toast(R(n,"put that back")),c.redoButton.disabled=!1;return}Mt(e),N(`Put back: ${t.label}`)};c.undoButton.addEventListener("click",()=>void _t()),c.redoButton.addEventListener("click",()=>void Ut()),document.addEventListener("keydown",e=>{!(e.metaKey||e.ctrlKey)||e.key.toLowerCase()!=="z"||(c.shadow.activeElement??document.activeElement)?.closest?.('input, textarea, [contenteditable="true"]')||(e.preventDefault(),e.shiftKey?Ut():_t())}),c.closeButton.addEventListener("click",()=>xe()),c.cancelButton.addEventListener("click",()=>xe()),c.saveButton.addEventListener("click",qn),U?.addEventListener("click",async()=>{!w||w.kind!=="record"||window.confirm("Delete this item?")&&(await I(`/live-edit/record/${w.type}/${w.id}`,{method:"DELETE"}),N("Deleted \u2713"))}),document.querySelectorAll("[data-live-create]").forEach(e=>{e.addEventListener("click",async()=>{await I("/live-edit/record/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:e.dataset.liveCreate})}),N("Added \u2713 \u2014 click it to edit")})});let ct=new URLSearchParams(window.location.search);if(ct.has("edit")){ct.delete("edit");let e=ct.toString();window.history.replaceState(null,"",window.location.pathname+(e?`?${e}`:"")),ke(!0)}else ke(sessionStorage.getItem("tb_editing")==="1")}};window.liveEditDisplayedValue=o=>gt({editValue:o.dataset.editValue,ownText:ie(o),fullText:o.textContent});var At=(()=>{let o=!1;return()=>{o||new URLSearchParams(window.location.search).get("live-edit")!=="off"&&(o=!0,Fo())}})();document.readyState==="complete"?At():(window.addEventListener("load",At,{once:!0}),window.setTimeout(At,2e3));
