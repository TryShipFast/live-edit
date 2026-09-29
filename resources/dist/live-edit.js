var bo=Object.defineProperty;var Ie=(o,a)=>()=>(o&&(a=o(o=0)),a);var ht=(o,a)=>{for(var i in a)bo(o,i,{get:a[i],enumerable:!0})};var Kt,Xt,Qt,Eo,Zt,en,bt,se,tn,nn,on,Ge,So,Ke,mt=Ie(()=>{Kt=o=>{let[a,...i]=String(o??"").split(":");return{kind:a,key:i.join(":"),parts:i}},Xt=(o,a={})=>({...a,headers:{"X-CSRF-TOKEN":o,Accept:"application/json",...a.headers??{}}}),Qt=o=>(o?.headers?.get?.("content-type")??"").includes("json"),Eo=/\.((?:fa|fas|far|fab|fal|fad|bi|ti|icon|flaticon|glyphicon|ion|mdi)-[a-z0-9][a-z0-9-]*)::?before/gi,Zt=o=>{let a=[];for(let i of String(o??"").split("}")){let l=i.indexOf("{");if(l===-1)continue;let f=i.slice(l+1).match(/content\s*:\s*(["'])(.*?)\1/);if(!f)continue;let c=f[2].match(/^\\([0-9a-f]{1,6})\s*$/i),x=c?String.fromCodePoint(parseInt(c[1],16)):f[2];if([...x].length===1)for(let L of i.slice(0,l).matchAll(Eo))a.push({name:L[1],glyph:x})}return a},en=(o,a,i,l,f)=>{let c=o.filter(x=>x!==i&&!l.includes(x));return f.forEach(x=>c.includes(x)||c.push(x)),c.push(a),c.join(" ")},bt=({editValue:o,ownText:a,fullText:i})=>(o??"")!==""?o:(a??"").trim()!==""?a:i??"",se=o=>o.children.length?[...o.childNodes].filter(a=>a.nodeType===3).map(a=>a.textContent).join(""):o.textContent,tn=o=>{let a=new Set,i=[];for(let l of o)for(let f of l.icons)a.has(f.name)||(a.add(f.name),i.push({...f,face:l.face,variant:l.variant}));return i.sort((l,f)=>l.name.localeCompare(f.name))},nn=(o,a)=>{let i=Object.keys(a??{}),l=String(o??"").split(",").map(f=>f.trim()).filter(Boolean);return l.length===0?i:i.length===0?l:l.filter(f=>i.includes(f))},on=(o,a={},i)=>{let l=String(i?.base??"").replace(/\/$/,""),[f,c]=String(o).split("?"),x={"/live-edit/setting":`${l}/${i?.site}/content`,"/live-edit/style":`${l}/${i?.site}/styles`,"/live-edit/publish":`${l}/${i?.site}/publish`,"/live-edit/image":`${l}/${i?.site}/media`,"/live-edit/upload":`${l}/${i?.site}/media`,"/live-edit/changes":`${l}/${i?.site}/changes`,"/live-edit/versions":`${l}/${i?.site}/versions`,"/live-edit/content":`${l}/${i?.site}/content`,"/live-edit/credits":`${l}/${i?.site}/credits`,"/live-edit/assist":`${l}/${i?.site}/assist`,"/live-edit/photos":`${l}/${i?.site}/photos`,"/live-edit/photos/used":`${l}/${i?.site}/photos/used`,"/live-edit/imagine":`${l}/${i?.site}/imagine`},L=i?.routes?.[f]??(f==="/live-edit/publish"?i?.publishUrl:null);if(L)return{url:c?`${L}?${c}`:L,init:{...a,headers:{...a.headers??{},...i.routeHeaders??i.publishHeaders??{},Accept:"application/json"},credentials:"same-origin"}};let B=x[f];if(!l||!i?.site||!i?.token)throw new Error("The content API is not configured on this page.");if(!B)throw new Error(`Editing that is not available over the content API yet (${f}).`);return{url:c?`${B}?${c}`:B,init:{...a,headers:{...a.headers??{},Authorization:`Bearer ${i.token}`,Accept:"application/json"}}}},Ge=(o,a,i)=>o.hasAttribute(a)?o.getAttribute(a):o.dataset?.[i]??"",So=(o,a)=>a==null?!0:a===408||a===425||a===429||a>=500,Ke=async(o,{tries:a=3,waits:i=[200,500],sleep:l=null}={})=>{let f=l??(x=>new Promise(L=>setTimeout(L,x))),c=null;for(let x=0;x<a;x++)try{return await o()}catch(L){if(c=L,x===a-1||!So(L,L.status))throw L;await f(i[Math.min(x,i.length-1)])}throw c}});var vt={};ht(vt,{applyTags:()=>yt,autoTag:()=>Xe,elementAt:()=>rn,ensureBackgroundsAreFound:()=>To,fingerprint:()=>an,refreshBackgrounds:()=>No,resolveBackgrounds:()=>wt,watchForLateBackgrounds:()=>dn});var Co,an,rn,yt,Lo,Ao,sn,ln,wt,To,No,dn,Xe,xt=Ie(()=>{Co="kb_tags_",an=o=>{let a=2166136261;for(let i=0;i<o.length;i++)a^=o.charCodeAt(i),a=Math.imul(a,16777619);return(a>>>0).toString(16)},rn=(o,a)=>{let i=o.documentElement;for(let l of a)if(i=[...i?.children??[]][l],!i)return null;return i},yt=(o,a)=>{let i=0;for(let{at:l,attributes:f}of a??[]){let c=rn(o,l);if(c){for(let[x,L]of Object.entries(f))c.hasAttribute(x)||c.setAttribute(x,L);i++}}return i},Lo=o=>{try{return JSON.parse(window.sessionStorage?.getItem(o)??"null")}catch{return null}},Ao=(o,a)=>{try{window.sessionStorage?.setItem(o,JSON.stringify(a))}catch{}},sn=o=>o.hasAttribute("data-kb-bg")||o.hasAttribute("data-background")||o.hasAttribute("data-bg")||o.hasAttribute("data-background-image")||/background-image|url\(/i.test(o.getAttribute("style")??""),ln=(o,a)=>{if(sn(o))return!1;let i=a.getComputedStyle(o).backgroundImage;if(!i||i==="none"||!i.includes("url("))return!1;let l=i.match(/url\(\s*["']?([^"')]+)/)?.[1];return!l||l.startsWith("data:")?!1:(o.setAttribute("data-kb-bg",l),!0)},wt=(o=document)=>{let a=o.defaultView??window;if(!a?.getComputedStyle)return 0;let i=0;for(let l of o.querySelectorAll("body *"))ln(l,a)&&i++;return i},To=async(o,a=document)=>{let i=a.defaultView??window;if(i.liveEditBackgroundsWatched)return 0;i.liveEditBackgroundsWatched=!0;let l=await Xe(o,a);return dn(a,()=>{Xe(o,a).catch(f=>{console.warn("[live-edit] could not tag a late background:",f.message)})}),l},No=async(o,a=document)=>wt(a)===0&&a.querySelector("[data-kb-bg]:not([data-edit-bg])")===null?0:Xe(o,a),dn=(o=document,a=()=>{})=>{let i=o.defaultView??window;if(!i?.IntersectionObserver||!i.getComputedStyle)return null;let l=new Set,f=null,c=()=>{if(f=null,l.size===0)return;let T=[...l];l.clear(),a(T)},x=5,L=new WeakMap,B=T=>{if(ln(T,i))return l.add(T),P.unobserve(T),f||(f=i.setTimeout(c,250)),!0;let X=(L.get(T)??0)+1;return L.set(T,X),X>=x&&P.unobserve(T),!1},P=new i.IntersectionObserver(T=>{for(let X of T){if(!X.isIntersecting)continue;let $=X.target;B($)||i.setTimeout(()=>B($),400)}},{rootMargin:"300px"}),D=[...o.querySelectorAll("body *")].filter(T=>!sn(T)),N=4e3;return D.length>N&&console.warn(`[live-edit] watching the first ${N} of ${D.length} elements for late backgrounds`),D.slice(0,N).forEach(T=>P.observe(T)),P},Xe=async({base:o,site:a,key:i,page:l},f=document)=>{let c=f.querySelector("[data-edit], [data-edit-img]")!==null;if(wt(f),c&&!(f.querySelector("[data-kb-bg]:not([data-edit-bg])")!==null))return 0;let L=f.documentElement.outerHTML,B=Co+an(L),P=Lo(B);if(P)return yt(f,P);let D=await fetch(`${String(o).replace(/\/$/,"")}/${a}/tag`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json",Authorization:`Bearer ${i}`},body:JSON.stringify({html:L,page:l??f.location?.pathname??""})});if(!D.ok)throw new Error(`Tagging answered ${D.status}`);let{elements:N}=await D.json();return Ao(B,N),yt(f,N)}});var $o,Oo,Bo,cn,pn,un=Ie(()=>{$o=new Set(["svg","g","defs","symbol","use","title","desc","path","circle","ellipse","line","polygon","polyline","rect","text","tspan","textpath","lineargradient","radialgradient","stop","clippath","mask","pattern"]),Oo=new Set(["viewbox","xmlns","width","height","fill","fill-rule","fill-opacity","stroke","stroke-width","stroke-linecap","stroke-linejoin","stroke-dasharray","stroke-dashoffset","stroke-opacity","stroke-miterlimit","opacity","d","points","x","y","x1","y1","x2","y2","cx","cy","r","rx","ry","transform","offset","stop-color","stop-opacity","gradientunits","gradienttransform","patternunits","clip-rule","clip-path","mask","id","class","role","aria-label","aria-hidden","focusable","preserveaspectratio","vector-effect","text-anchor","font-size","font-family"]),Bo=8,cn=o=>{let a=String(o??"").trim();if(a===""||!/<svg/i.test(a))return null;let i=new DOMParser().parseFromString(a,"image/svg+xml"),l=i.documentElement;return!l||l.tagName?.toLowerCase()!=="svg"||i.querySelector("parsererror")||(pn(l),l.children.length===0&&l.textContent.trim()==="")?null:l},pn=o=>{for(let a of[...o.childNodes]){if(a.nodeType===Bo){a.remove();continue}if(a.nodeType===1){if(!$o.has(a.tagName.toLowerCase())){a.remove();continue}pn(a)}}for(let a of[...o.attributes]){let i=a.name.toLowerCase(),l=a.value,c=i==="href"||i==="xlink:href"?l.trim().startsWith("#"):Oo.has(i);c&&/url\(/i.test(l)&&!/^url\(\s*#/i.test(l.trim())&&(c=!1),c||o.removeAttribute(a.name)}}});var Ct={};ht(Ct,{applyBackground:()=>yn,applyContent:()=>vn,applyIcon:()=>mn,applyOrder:()=>wn,applyStyles:()=>En,applySvg:()=>bn,applyValue:()=>Et,defendContent:()=>xn,fetchContent:()=>Cn,fetchSnapshot:()=>Sn,resolve:()=>Ln,styleRules:()=>kn});var kt,hn,Et,St,fn,Po,bn,mn,yn,wn,vn,xn,kn,En,Sn,Cn,gn,Io,Ln,Lt=Ie(()=>{un();mt();kt=(o,a)=>Object.assign(new Error(o),{status:a}),hn="setting:",Et=(o,a,{keepRuns:i=!1}={})=>{let l=o.tagName?.toLowerCase();if(l==="img"){o.setAttribute("src",a);return}if(l==="source"){o.setAttribute("srcset",a);return}St(o,a,i)},St=(o,a,i=!1)=>{let l=[...o.childNodes].filter($=>$.nodeType===Po);if(l.length===0){let $=[...o.children];if($.length===1&&$[0].children.length===0){St($[0],a);return}o.append(a);return}if(l.length===1){fn(l[0],a);return}let f=l.map($=>$.nodeValue),c=f.join(""),x=0;for(;x<c.length&&x<a.length&&c[x]===a[x];)x+=1;let L=0;for(;L<c.length-x&&L<a.length-x&&c[c.length-1-L]===a[a.length-1-L];)L+=1;let B=x,P=c.length-L,D=a.slice(x,a.length-L),N=0,T=!1,X=f.map($=>{let K=N,k=N+$.length;return N=k,T||B<K||P>k?$:(T=!0,$.slice(0,B-K)+D+$.slice(P-K))});if(T){l.forEach(($,K)=>{$.nodeValue=X[K]});return}fn(l[0],a),l.slice(1).forEach($=>{if(i){$.nodeValue="";return}$.remove()})},fn=(o,a)=>{let i=o.nodeValue,l=/^\s/.test(i)&&!/^\s/.test(a)?" ":"",f=/\s$/.test(i)&&!/\s$/.test(a)?" ":"";o.nodeValue=l+a+f},Po=3,bn=(o,a)=>{let i=cn(a);if(!i)return!1;let l=document.importNode(i,!0);for(let f of["class","width","height","style","data-edit-svg","data-edit-label"])o.hasAttribute(f)&&l.setAttribute(f,o.getAttribute(f));return o.replaceWith(l),!0},mn=(o,a)=>{let i=String(a).replace(/[^A-Za-z0-9_\- ]/g,"").split(/\s+/).filter(Boolean),l=o.getAttribute("data-edit-icon-current");if(i.length===0||!l)return!1;let f=i.length===1?(o.getAttribute("class")??"").trim().split(/\s+/).map(c=>c===l?i[0]:c):i;return o.setAttribute("class",f.join(" ")),o.setAttribute("data-edit-icon-current",i.length===1?i[0]:i[i.length-1]),!0},yn=(o,a)=>{for(let l of["data-background","data-bg","data-background-image"])o.hasAttribute(l)&&o.setAttribute(l,a);let i=(o.getAttribute("style")??"").replace(/background-image\s*:[^;]*;?/gi,"").trim();o.setAttribute("style",`${i?i.replace(/;?$/,";"):""}background-image:url('${a}')`)},wn=(o,a)=>{let i=0;for(let l of o.querySelectorAll("[data-edit-list]")){let f=l.getAttribute("data-edit-list");if(!Object.hasOwn(a,f))continue;let c;try{c=JSON.parse(a[f])}catch{continue}if(!Array.isArray(c)||c.length===0)continue;let x=new Map;for(let B of[...l.children])B.hasAttribute("data-edit-item")&&(x.set(B.getAttribute("data-edit-item"),B),l.removeChild(B));if(x.size===0)continue;let L=x.values().next().value;for(let B of c){let P=x.get(String(B));if(P){l.appendChild(P);continue}let D=L.cloneNode(!0);D.setAttribute("data-edit-item",String(B)),l.appendChild(D)}i++}return i},vn=(o,a)=>{let i=0;wn(o,a);for(let l of o.querySelectorAll("[data-edit]")){let f=l.getAttribute("data-edit")??"";if(!f.startsWith(hn))continue;let c=f.slice(hn.length);Object.hasOwn(a,c)&&(Et(l,a[c]),i++)}for(let l of o.querySelectorAll("[data-edit-img]")){let f=(l.getAttribute("data-edit-img")??"").replace(/^setting:/,"");Object.hasOwn(a,f)&&(Et(l,a[f]),i++);for(let[c,x]of[["Alt","alt"],["Title","title"]])if(Object.hasOwn(a,f+c)){let L=a[f+c];L===""&&x==="title"?l.removeAttribute("title"):l.setAttribute(x,L),i++}}for(let l of o.querySelectorAll("[data-edit-svg]")){let f=(l.getAttribute("data-edit-svg")??"").replace(/^setting:/,""),c=a[f];!Object.hasOwn(a,f)||String(c??"").trim()===""||bn(l,c)&&i++}for(let l of o.querySelectorAll("[data-edit-icon]")){let f=(l.getAttribute("data-edit-icon")??"").replace(/^setting:/,""),c=a[f];!Object.hasOwn(a,f)||c===""||mn(l,c)&&i++}for(let l of o.querySelectorAll("[data-edit-bg]")){let f=(l.getAttribute("data-edit-bg")??"").replace(/^setting:/,""),c=a[f];!Object.hasOwn(a,f)||c===""||(yn(l,c),i++)}for(let l of o.querySelectorAll("[data-edit-href]")){let f=l.getAttribute("data-edit-href");Object.hasOwn(a,f)&&(l.setAttribute("href",a[f]),i++)}return i},xn=(o,{limit:a=12,debounce:i=60}={})=>{let l=o.defaultView??(typeof window>"u"?null:window);if(!l?.MutationObserver)return null;let f=o.querySelectorAll("[data-edit], [data-edit-img], [data-edit-href]");if(f.length===0)return null;let c=new Map;for(let N of f)c.set(N,{words:N.hasAttribute("data-edit")?se(N):null,src:N.getAttribute("src"),href:N.hasAttribute("data-edit-href")?N.getAttribute("href"):null});let x=0,L=!1,B=null,P=()=>{if(B=null,!o.body?.classList?.contains("editing")){x++,L=!0;for(let[N,T]of c)N.isConnected&&(T.words!==null&&se(N)!==T.words&&St(N,T.words),T.src!==null&&N.getAttribute("src")!==T.src&&(N.setAttribute("src",T.src),N.removeAttribute("srcset")),T.href!==null&&N.getAttribute("href")!==T.href&&N.setAttribute("href",T.href));D.takeRecords(),L=!1,x>=a&&(D.disconnect(),console.warn(`[live-edit] this page keeps rewriting itself; the client's content was put back ${x} times and is now being left alone.`))}},D=new l.MutationObserver(()=>{L||B||x>=a||(B=l.setTimeout(P,i))});for(let N of f)D.observe(N,{characterData:!0,childList:!0,subtree:!0,attributes:!0,attributeFilter:["src","srcset","href"]});return D},kn=(o,a)=>{let i=`[data-style="${o}"]`,l="",f="";for(let[c,x]of Object.entries(a??{}))if(!(x===""||x===null||x===void 0)){if(c==="hidden"){l+=`body:not(.editing) ${i}{display:none !important}`,l+=`body.editing ${i}{opacity:.45}`;continue}f+={backgroundImage:`background-image:url('${x}') !important;background-size:cover !important;background-position:center !important;`,background:`background:${x} !important;`,textColor:`color:${x} !important;`,fontSize:`font-size:${x}px !important;`,radius:`border-radius:${x}px !important;`,paddingX:`padding-left:${x}px !important;padding-right:${x}px !important;`,paddingY:`padding-top:${x}px !important;padding-bottom:${x}px !important;`}[c]??""}return f===""?l:l+`${i}{${f}}`},En=(o,a)=>{let i=Object.entries(a??{}).map(([x,L])=>kn(x,L)).join("");if(i==="")return 0;let l="live-edit-styles",f=o.getElementById?.(l)??o.querySelector?.(`#${l}`)??null,c=f??o.createElement("style");return c.id=l,c.textContent=i,f||(o.head??o.body)?.appendChild(c),Object.keys(a).length},Sn=async({snapshot:o,locale:a})=>{let i=String(o).replace(/\/$/,""),l=await Ke(()=>fetch(`${i}/current.json`).then(c=>{if(!c.ok)throw kt(`Pointer answered ${c.status}`,c.status);return c.json()}));if(!l.version)return{settings:{},styles:{}};let f=a??"en";return Ke(async()=>{let c=await fetch(`${i}/v${l.version}/${f}.json`);if(!c.ok)throw kt(`Version answered ${c.status}`,c.status);return c.json()})},Cn=async({base:o,site:a,key:i,locale:l})=>{let f=`${String(o).replace(/\/$/,"")}/${a}/content${l?`?locale=${encodeURIComponent(l)}`:""}`;return Ke(async()=>{let c=await fetch(f,{headers:{Authorization:`Bearer ${i}`,Accept:"application/json"}});if(!c.ok)throw kt(`Content service answered ${c.status}`,c.status);return c.json()})},gn=async()=>{let o=typeof window<"u"?window.liveEditContent:null;if(!o)return;let a=null,i=null;try{let l=await Ln(o);l&&(l.styleProps&&(window.liveEditStyleProps=l.styleProps),typeof l.pending=="number"&&l.styleProps&&(window.liveEditPublishing={...window.liveEditPublishing??{},pending:l.pending}),a=vn(document,l.settings??{}),En(document,l.styles??{}),window.liveEditStyles=l.styles??{},xn(document))}catch(l){i=l,console.warn("[live-edit] serving the words already in the page:",l.message)}Io({applied:a,failed:i?i.message:null})},Io=o=>{window.liveEditContentDone=o,document.dispatchEvent(new CustomEvent("live-edit:content",{detail:o}))},Ln=async o=>{if(o.snapshot)try{return await Sn(o)}catch(a){let i=a.message.includes("fetch")?" (if the files are on another origin, the bucket or CDN must allow cross-origin reads)":"";if(!o.base)throw new Error(a.message+i);console.warn("[live-edit] falling back to the content API:",a.message+i)}return o.base&&o.site&&o.key?Cn(o):null};typeof document<"u"&&(document.readyState==="loading"?document.addEventListener("DOMContentLoaded",gn):gn())});var On={};ht(On,{collectFromFragment:()=>Tn,contentConfigFor:()=>Ro,currentSession:()=>Fo,forget:()=>zo,requestLink:()=>jo,store:()=>Nn,stored:()=>$n});var At,An,Tn,Nn,$n,zo,jo,Fo,Ro,Bn=Ie(()=>{At="kb_session",An="kb_session=",Tn=(o=window)=>{let a=o.location?.hash??"",i=a.indexOf(An);if(i===-1)return null;let l=decodeURIComponent(a.slice(i+An.length).split("&")[0]);if(l==="")return null;Nn(l,o);let f=a.slice(0,i).replace(/[#&]$/,"");return o.history?.replaceState?.(null,"",o.location.pathname+o.location.search+f),l},Nn=(o,a=window)=>{try{a.sessionStorage?.setItem(At,o)}catch{}},$n=(o=window)=>{try{return o.sessionStorage?.getItem(At)??null}catch{return null}},zo=(o=window)=>{try{o.sessionStorage?.removeItem(At)}catch{}},jo=async({base:o,site:a},i,l=window)=>(await fetch(`${String(o).replace(/\/$/,"")}/sign-in`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({site:a,email:i,return_to:l.location.origin+l.location.pathname})})).ok,Fo=(o=window)=>Tn(o)??$n(o),Ro=(o,a)=>{let i={base:o.api,site:o.site,locale:o.locale??null};return a?{...i,key:a,snapshot:null}:{...i,key:o.key,snapshot:o.snapshot??null}}});var mo=`
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
`,C=(o,a,i)=>{let l=document.createElement(o);return a&&(l.className=a),i!==void 0&&(l.textContent=i),l};function Vt(){let o=document.createElement("style");o.id="live-edit-page-css",o.textContent=yo,document.head.append(o);let a=document.createElement("div");a.id="live-edit-ui",document.body.append(a);let i=a.attachShadow({mode:"open"}),l=document.createElement("style");l.textContent=mo,i.append(l);let f=window.liveEditToolbar??{},c=C("div","le-toolbar"),x=window.liveEditEditor?.console??null,L=C(x?"a":"span","le-mark");L.innerHTML='<svg width="16" height="16" viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="3" width="20" height="20" rx="3" fill="none" stroke="#0B0C0F" stroke-width="2.5"/><path d="M16 15 L16 30 L19.6 26.4 L22.2 31.2 L24.6 30 L22 25.3 L27 25.3 Z" fill="#3148F5" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>',x&&(L.href=x,L.target="_blank",L.rel="noopener",L.title="Your dashboard: licence, editors, settings",L.setAttribute("aria-label","Open your dashboard"));let B=C("span","le-status le-when-roomy"),P=C("span","le-dot"),D=C("span",null,"");B.append(P,D),c.append(L,B);let N=window.liveEditEditor??null;if(N?.greeting){let O=C("span","le-hello le-when-roomy","Welcome "+N.greeting);c.append(O)}let T=null,X=f.locales??{};Object.keys(X).length>1&&(T=C("select","le-locale"),T.title="Language you are editing",Object.entries(X).forEach(([O,F])=>{let W=C("option",null,F);W.value=O,W.selected=O===(f.locale??"en"),T.append(W)}),T.addEventListener("change",()=>{window.location.search="?locale="+T.value}),c.append(T));let $=C("button","le-bar-btn","Edit site");$.type="button";let K=O=>'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"'+(O?' style="transform: scaleX(-1)"':"")+'><path d="M9 14 4 9l5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 9h7a6 6 0 0 1 0 12H8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',k=C("button","le-round");k.type="button",k.title="Undo the last change you have not published",k.setAttribute("aria-label","Undo"),k.innerHTML=K(!1);let H=C("button","le-round");H.type="button",H.title="Put back what you just undid",H.setAttribute("aria-label","Redo"),H.innerHTML=K(!0);let ne=C("div","le-pages");ne.hidden=!0,ne.setAttribute("role","group"),ne.setAttribute("aria-label","Pages");let le=C("button","le-bar-btn le-when-roomy","Changes");le.type="button",le.title="Everything you have changed and not published";let V=C("button","le-bar-btn le-when-roomy","Preview");V.type="button",V.title="See the page the way a visitor will",V.hidden=!0;let Q=C("button","le-publish");Q.type="button",Q.title="Put your changes live",Q.hidden=!0;let w=C("span",null,"Publish"),de=C("span","le-publish-count");if(de.hidden=!0,Q.append(w,de),c.append(C("span","le-sep"),$,k,H,C("span","le-sep"),ne,le,V,Q),(f.links??[]).forEach(O=>{let F=C("a","le-btn-ghost",O.label);F.href=O.href,O.title&&(F.title=O.title),c.append(F)}),f.logout?.href)if((f.logout.method??"get").toLowerCase()==="post"){let O=document.createElement("form");O.method="POST",O.action=f.logout.href;let F=document.createElement("input");F.type="hidden",F.name="_token",F.value=document.body.dataset.csrf??"";let W=C("button","le-btn-ghost","Log out");W.type="submit",O.append(F,W),c.append(O)}else{let O=C("a","le-btn-ghost","Log out");O.href=f.logout.href,c.append(O)}let J=C("div","le-drawer");J.setAttribute("role","dialog"),J.setAttribute("aria-modal","true"),J.setAttribute("aria-label","Edit content");let ze=C("div","le-drawer-head"),ce=C("div","le-tabs");ce.setAttribute("role","tablist");let je={};["Edit","Changes","History"].forEach(O=>{let F=C("button","le-tab",O);F.type="button",F.dataset.tab=O,F.setAttribute("role","tab"),O==="Edit"&&F.classList.add("is-on"),je[O]=F,ce.append(F)});let ge=C("button","le-close","\xD7");ge.type="button",ge.setAttribute("aria-label","Close"),ze.append(ce,ge);let Le=C("div","le-subject"),Fe=C("div","le-trail"),Re=C("div","le-title","Text");Le.append(C("div","le-eyebrow","Selected"),Fe,Re);let De=C("div","le-fields"),pe=C("div","le-foot"),Ae=C("button","le-btn-danger le-start le-hidden","Delete");Ae.type="button";let be=C("button","le-btn-outline","Cancel");be.type="button";let me=C("button","le-btn","Save changes");me.type="button",pe.append(Ae,be,me),J.append(ze,Le,De,pe);let oe=C("button","le-handle");oe.type="button",oe.setAttribute("aria-label","Edit this link"),oe.innerHTML="&#9998;";let ee=C("button","le-handle le-handle-bg");ee.type="button",ee.setAttribute("aria-label","Replace this background image"),ee.title="Replace background image",ee.textContent="Replace background";let ye=C("div","le-hover"),we=C("span","le-hover-label");return ye.append(we),i.append(c,J,oe,ee,ye),{root:a,shadow:i,toolbar:c,toggleButton:$,undoButton:k,redoButton:H,pageSwitcher:ne,statusText:D,dot:P,localeSelect:T,drawer:J,drawerFoot:pe,drawerTabs:je,drawerSubject:Le,drawerTitle:Re,drawerTrail:Fe,drawerFields:De,drawerDelete:Ae,publishButton:Q,publishLabel:w,publishCount:de,previewButton:V,changesButton:le,closeButton:ge,cancelButton:be,saveButton:me,linkHandle:oe,bgHandle:ee,hoverBox:ye,hoverLabel:we,toast:(O,F=1800)=>{let W=C("div","le-toast",O);i.append(W),setTimeout(()=>W.style.opacity="0",F),setTimeout(()=>W.remove(),F+600)},modal:({title:O,subtitle:F,size:W="",dismissable:Te=!0}={})=>{let q=C("div","le-scrim"),M=C("div",`le-modal ${W}`.trim());M.setAttribute("role","dialog"),M.setAttribute("aria-modal","true");let qe=C("div","le-modal-heading"),_e=C("div","le-modal-title",O??""),ve=C("div","le-modal-sub",F??"");ve.hidden=!F,qe.append(_e,ve),M.setAttribute("aria-label",O??"Dialog");let ae=C("button","le-close","\xD7");ae.type="button",ae.setAttribute("aria-label","Close");let Me=C("div","le-modal-head");Me.append(qe,ae);let Ne=C("div","le-modal-tabs");Ne.hidden=!0;let Ue=C("div","le-modal-body"),$e=C("div","le-modal-foot");$e.hidden=!0,M.append(Me,Ne,Ue,$e),q.append(M);let Oe=document.activeElement,He=!1,xe=()=>{He||(He=!0,document.removeEventListener("keydown",ke,!0),q.remove(),Oe?.focus?.(),re.dismissable=!0)},ke=Y=>{Y.key==="Escape"&&re.dismissable&&(Y.stopPropagation(),xe())},re={dismissable:Te};return ae.addEventListener("click",xe),q.addEventListener("mousedown",Y=>{Y.target===q&&re.dismissable&&xe()}),document.addEventListener("keydown",ke,!0),i.append(q),ae.focus(),{card:M,body:Ue,foot:$e,tabs:Ne,close:xe,title:Y=>_e.textContent=Y,subtitle:Y=>{ve.textContent=Y??"",ve.hidden=!Y},allowDismiss:Y=>{re.dismissable=Y,ae.hidden=!Y}}}}}var gt="kb_verify",Jt=(o,a=globalThis)=>{try{a.sessionStorage?.setItem(gt,JSON.stringify(o))}catch{}},Yt=(o=globalThis)=>{try{let a=o.sessionStorage?.getItem(gt);return o.sessionStorage?.removeItem(gt),a?JSON.parse(a):null}catch{return null}},wo=(o,a)=>!a?.attr||!a?.marker?null:o.querySelector(`[${a.attr}="${a.marker.replace(/"/g,'\\"')}"]`),vo=(o,a)=>{if(!o)return null;if(a==="image"){let l=xo(o);return l?l.getAttribute("src"):null}if(a==="href")return o.getAttribute("href");if(a==="icon")return o.getAttribute("class")??"";let i=[...o.childNodes].filter(l=>l.nodeType===3).map(l=>l.textContent).join(" ").trim();return te(i===""?o.textContent:i)},xo=o=>o.tagName?.toLowerCase()==="img"?o:o.querySelector("img")??o.parentElement?.querySelector("img")??null,te=o=>String(o??"").replace(/\s+/g," ").trim(),ko=(o,a,i)=>{if(i===null)return!1;if(o==="image")return ft(i)!==""&&ft(i)===ft(a);if(o==="icon"){let l=te(a).split(" ").filter(Boolean),f=te(i).split(" ").filter(Boolean);return l.length>0&&l.every(c=>f.includes(c))}return o==="href"?te(i)===te(a)||te(i).endsWith(te(a)):te(i)===te(a)},ft=o=>String(o??"").split(/[?#]/)[0].split("/").filter(Boolean).pop()??"",Gt=(o,a)=>{if(!a?.kind)return null;let i=wo(o,a);if(!i)return null;let l=vo(i,a.kind);return{ok:ko(a.kind,a.value,l),wanted:a.value,saw:l,kind:a.kind}};mt();var Do=()=>{let o=window.liveEditApi;o?.base&&o?.site&&Promise.resolve().then(()=>(xt(),vt)).then(i=>i.ensureBackgroundsAreFound({base:o.base,site:o.site,key:o.token})).catch(i=>console.warn("[live-edit] could not look for backgrounds:",i.message)),window.liveEditContent||Promise.resolve().then(()=>(Lt(),Ct)).then(i=>i.defendContent(document)).catch(i=>console.warn("[live-edit] could not guard this page's content:",i.message));let a=document.querySelector("[data-login-modal]");if(a){let i=()=>{a.classList.remove("hidden"),a.classList.add("flex"),a.querySelector("input[type=email]")?.focus()},l=()=>{a.classList.add("hidden"),a.classList.remove("flex")};document.querySelectorAll("[data-login-open]").forEach(f=>{f.addEventListener("click",c=>{c.preventDefault(),i()})}),a.querySelector("[data-login-close]")?.addEventListener("click",l),a.addEventListener("click",f=>{f.target===a&&l()}),a.dataset.error==="1"&&i()}if(document.body.hasAttribute("data-admin")){let i=document.body.dataset.csrf,l=()=>{sessionStorage.setItem("tb_scroll",String(window.scrollY)),window.location.reload()},f=sessionStorage.getItem("tb_scroll");f!==null&&(sessionStorage.removeItem("tb_scroll"),window.scrollTo(0,Number(f)));let c=Vt(),x=e=>c.toast(String(e??"").trim()||"Something went wrong.",9e3),L=sessionStorage.getItem("tb_toast");L&&(sessionStorage.removeItem("tb_toast"),c.toast(L));let B=()=>new Promise(e=>{if(!window.liveEditContent||window.liveEditContentDone){e(window.liveEditContentDone??null);return}let t=n=>e(n?.detail??null);document.addEventListener("live-edit:content",t,{once:!0}),setTimeout(()=>e(null),5e3)});B().then(e=>{let t=Yt();if(e?.failed){c.toast(t?"Saved \u2014 but this page could not load the latest content, so it may be showing an older version. Reload to try again.":"This page could not load your saved content, so it is showing the original. Nothing has been lost \u2014 reload to try again.",9e3);return}let n=t?Gt(document,t):null;n&&!n.ok&&(console.warn("[live-edit] the change was saved but the page still shows:",n.saw,`
  expected:`,n.wanted),c.toast("Saved \u2014 but this page is still showing the old version. Your change is stored; reload, and tell us if it stays this way.",9e3))});let P=e=>{sessionStorage.setItem("tb_toast",e),l()},D=(e,t=null,n=null)=>{let r=window.__liveEditReact;if(!r){P(e);return}let d=t!==null&&(r.apply??r.set)(t,n);c.toast(e),d||r.refresh()},{drawer:N,drawerTabs:T,drawerSubject:X,drawerTitle:$,drawerTrail:K,drawerFields:k,drawerDelete:H,toggleButton:ne,statusText:le,linkHandle:V,bgHandle:Q}=c,w=null,de=(e,t,n,r,d=!1)=>{let u=document.createElement("label");u.className="le-field",u.append(t);let p=e==="icon"?window.liveEditIcons:(window.liveEditSelects??{})[e],s=document.querySelector("[data-icon-templates]");if(e==="icon"&&Array.isArray(p)&&s){let g=document.createElement("input");g.type="hidden",g.name=e,g.value=n??"";let y=document.createElement("div");return y.className="le-icons",p.forEach(m=>{let b=document.createElement("button");b.type="button",b.title=m,b.dataset.iconChoice=m,b.className="le-icon"+(m===g.value?" is-active":"");let v=s.querySelector(`template[data-icon="${m}"]`);v?b.append(v.content.cloneNode(!0)):b.textContent=m,b.addEventListener("click",()=>{g.value=m,y.querySelectorAll("[data-icon-choice]").forEach(E=>{let A=E.dataset.iconChoice===m;E.className="le-icon"+(A?" is-active":"")}),g.dispatchEvent(new Event("input",{bubbles:!0}))}),y.append(b)}),u.append(g,y),u}if(Array.isArray(p)&&p.length<=6){let g=document.createElement("input");g.type="hidden",g.name=e,g.value=n??p[0];let y=document.createElement("div");return y.className="le-choices",p.forEach(m=>{let b=document.createElement("label");b.className="le-choice"+(m===g.value?" is-selected":"");let v=document.createElement("input");v.type="radio",v.name="le-choice-"+e,v.checked=m===g.value,v.addEventListener("change",()=>{g.value=m,y.querySelectorAll(".le-choice").forEach(E=>E.classList.remove("is-selected")),b.classList.add("is-selected"),g.dispatchEvent(new Event("input",{bubbles:!0}))}),b.append(v,document.createTextNode(m)),y.append(b)}),u.append(g,y),u}let h;if(Array.isArray(p)?(h=document.createElement("select"),p.forEach(g=>{let y=document.createElement("option");y.value=g,y.textContent=g,y.selected=g===n,h.append(y)})):(h=document.createElement("textarea"),h.rows=r,h.value=n??""),h.name=e,h.className="le-input",h.tagName==="TEXTAREA"){h.classList.add("le-prose");let g=()=>{h.style.height="auto",h.style.height=Math.min(h.scrollHeight+2,420)+"px"};h.addEventListener("input",g),requestAnimationFrame(g)}if(d&&h.tagName==="TEXTAREA"){let g=document.createElement("div");g.className="le-tools";let y=(v,E)=>{let A=h.selectionStart,S=h.selectionEnd,z=h.value.slice(A,S)||"text";h.setRangeText(v+z+E,A,S,"select"),h.dispatchEvent(new Event("input",{bubbles:!0})),h.focus()},m=(v,E,A,S="")=>{let z=document.createElement("button");return z.type="button",z.title=E,z.textContent=v,z.className="le-tool "+S,z.addEventListener("click",A),z};g.append(m("B","Bold",()=>y("**","**"),"is-bold"),m("I","Italic",()=>y("*","*"),"is-italic"),m("Link","Insert link",()=>{let v=window.prompt("Link URL (https://\u2026 or /page):");if(!v)return;let E=h.selectionStart,A=h.selectionEnd,S=h.value.slice(E,A)||"link text";h.setRangeText("["+S+"]("+v+")",E,A,"select"),h.dispatchEvent(new Event("input",{bubbles:!0})),h.focus()}));let b=document.createElement("span");b.className="le-hint",b.textContent="**bold** \xB7 *italic* \xB7 [text](url)",g.append(b),u.append(g)}return u.append(h),u},J=e=>{let t=e.tagName;if(e.dataset.editRegion)return e.dataset.editRegion;if(t==="IMG")return"Image";if(t==="BUTTON")return"Button";if(t==="A")return/\b(btn|button)\b/i.test(String(e.className))?"Button":"Link";if(/^H[1-6]$/.test(t))return"Heading";if(t==="P")return"Paragraph";if(t==="LI")return"List item";if(t==="UL"||t==="OL")return"List";if(t==="NAV")return"Menu";if(t==="HEADER")return"Header";if(t==="FOOTER")return"Footer";if(t==="FORM")return"Form";if(e.hasAttribute("data-edit-item"))return"Card";if(e.hasAttribute("data-edit-icon"))return"Icon";if(e.hasAttribute("data-edit-svg"))return"Drawing";if(e.hasAttribute("data-edit"))return"Text";if(e.hasAttribute("data-has-bg")||e.hasAttribute("data-edit-bg"))return"Background";if(t==="SECTION"||t==="MAIN"||t==="ARTICLE")return"Section";let n=e.getBoundingClientRect();return n.width>window.innerWidth*.6&&n.height>180?"Section":"Group"},ze=(e,t)=>{let n=e.tagName,r;return n==="IMG"?r=["radius","hidden"]:n==="A"||n==="BUTTON"?r=["background","textColor","fontSize","radius","hidden"]:/^(H[1-6]|P|SPAN|LI|BLOCKQUOTE|FIGCAPTION|DT|DD|TD|TH|CAPTION|CITE|Q|LABEL|STRONG|EM)$/.test(n)?r=["textColor","fontSize","hidden"]:r=["background","backgroundImage","paddingY","paddingX","radius","hidden"],t.filter(d=>r.includes(d.trim()))},ce=({hint:e="PNG, JPG or WEBP, or drag one here",onFile:t}={})=>{let n=document.createElement("label");n.className="le-upload";let r=document.createElement("div");r.className="le-upload-inner";let d=document.createElement("span");d.className="le-upload-icon",d.textContent="\u2191";let u=document.createElement("span");u.className="le-upload-text";let p=document.createElement("span");p.className="le-upload-title",p.textContent="Upload from your computer";let s=document.createElement("span");s.className="le-upload-hint",s.textContent=e,u.append(p,s);let h=document.createElement("span");h.className="le-upload-btn",h.textContent="Choose file",r.append(d,u,h);let g=document.createElement("input");g.type="file",g.accept="image/*";let y=m=>{m&&(s.textContent=m.name,t?.(m))};return g.addEventListener("change",()=>y(g.files[0])),["dragenter","dragover"].forEach(m=>n.addEventListener(m,b=>{b.preventDefault(),n.classList.add("is-dragover")})),["dragleave","drop"].forEach(m=>n.addEventListener(m,b=>{b.preventDefault(),n.classList.remove("is-dragover")})),n.addEventListener("drop",m=>{let b=m.dataTransfer?.files?.[0];if(!b)return;let v=new DataTransfer;v.items.add(b),g.files=v.files,y(b)}),n.append(r,g),n},je=e=>{let t=String(e).match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);return!t||t[4]!==void 0&&Number(t[4])===0?"":"#"+[1,2,3].map(n=>Number(t[n]).toString(16).padStart(2,"0")).join("")},ge=e=>{if(!e)return"";let t=e.dataset.background||e.dataset.bg||e.dataset.backgroundImage;if(t)return t;let r=(getComputedStyle(e).backgroundImage||"").match(/url\((['"]?)(.*?)\1\)/);return r&&!r[2].startsWith("data:")?r[2]:""},Le={background:"Background colour",backgroundImage:"Background image",textColor:"Text colour",fontSize:"Text size",paddingY:"Space above and below",paddingX:"Space left and right",radius:"Corner rounding"},Fe=(e,t,n,r)=>{let d=document.createElement("label");d.className="le-field";let u=e.replace(/([A-Z])/g," $1").toLowerCase(),p=Le[e]??u.charAt(0).toUpperCase()+u.slice(1);if(d.append(p),t==="toggle"){let s=document.createElement("div");s.className="le-row";let h=document.createElement("input");h.type="checkbox",h.checked=n==="1",h.dataset.styleProp=e;let g=document.createElement("span");g.className="le-hint",g.textContent="Hidden from visitors. You still see it, dimmed, while editing.",s.append(h,g);let y=r?J(r).toLowerCase():"section";return d.replaceChildren(`Hide this ${y}`,s),d.className="le-field le-divided",d}if(t==="color"){let s=document.createElement("div");s.className="le-row";let h=document.createElement("input");h.type="color";let g=r?je(getComputedStyle(r)[e==="textColor"?"color":"backgroundColor"]):"";h.value=n||g||"#ffffff",h.dataset.styleProp=e,h.className="le-color";let y=document.createElement("label");y.className="le-default";let m=document.createElement("input");m.type="checkbox",m.checked=!n,h.addEventListener("input",()=>m.checked=!1),y.append(m,"Use default"),s.append(h,y),d.append(s)}else if(t==="url"){let s=document.createElement("input");s.type="text",s.value=n??"",s.placeholder="Paste an image URL, or upload below",s.dataset.styleProp=e,s.className="le-input";let h=document.createElement("img");h.className="le-thumb",h.alt="";let g=S=>{h.src=S||"",h.style.display=S?"":"none"},y=n?"":ge(r),m=document.createElement("span");m.className="le-hint";let b=(S,z)=>{m.textContent=S?z?"Current image (from the theme) \u2014 upload or paste a link to replace it":"Replacing with this image":"No image set",m.title=S||""};g(n||y),b(n||y,!n&&!!y),s.addEventListener("input",()=>{let S=s.value.trim();g(S||y),b(S||y,!S&&!!y)});let v=ce({onFile:async S=>{g(URL.createObjectURL(S));let z=new FormData;z.append("file",S);try{let R=await(await I("/live-edit/upload",{method:"POST",body:z})).json();s.value=R.url,g(R.url),b(R.url,!1),s.dispatchEvent(new Event("input",{bubbles:!0}))}catch(_){x(q(_,"save that"))}}}),E=j("div","le-ways"),A=j("button","le-btn le-wide","Replace background");A.type="button",A.addEventListener("click",()=>It(r,async S=>{let{url:z,file:_,credit:R}=S,U=z;if(_){g(URL.createObjectURL(_));let Z=new FormData;Z.append("file",_);try{U=(await(await I("/live-edit/upload",{method:"POST",body:Z})).json()).url}catch(ie){c.toast(q(ie,"save that"));return}}U&&(s.value=U,g(U),b(U,!1),s.dispatchEvent(new Event("input",{bubbles:!0})),s.dataset.kbCreditFor=U,s.dataset.kbCredit=JSON.stringify({credit:R??"",creditBy:S.creditBy??"",creditUrl:S.creditUrl??"",creditSource:S.creditSource??"",creditSourceUrl:S.creditSourceUrl??""}),R&&c.toast(R,4e3))},"Free photos","background")),E.append(A),s.hidden=!0,v.hidden=!0,d.append(E,s,v,h,m)}else{let s=document.createElement("input");s.type="number",s.min=0,s.max=400,s.value=n??"",s.placeholder="default",s.dataset.styleProp=e,s.className="le-input",d.append(s)}return d},Re={background:"color",backgroundImage:"url",textColor:"color",fontSize:"px",paddingX:"px",paddingY:"px",radius:"px",hidden:"toggle"},De=(e,t,n)=>{w.styleKey=e;let r=(window.liveEditStyles??{})[e]??{},d=document.createElement("div");d.className="le-section-heading",d.textContent="Style",k.append(d);let u=0;if((n?ze(n,t):t).forEach(p=>{let s=(window.liveEditStyleProps??{})[p]??Re[p];s&&(k.append(Fe(p,s,r[p],n)),u++)}),u===0){let p=document.createElement("div");p.className="le-hint",p.textContent="Nothing on this element can be restyled.",k.append(p)}},pe=document.createElement("style");document.head.append(pe);let Ae=(e,t)=>{let n=`[data-style="${e}"]`,r="",d="";for(let[u,p]of Object.entries(t))p&&(r+={hidden:"opacity:.45 !important;",backgroundImage:`background-image:url('${p}') !important;background-size:cover !important;background-position:center !important;`,background:`background:${p} !important;`,textColor:`color:${p} !important;`,fontSize:`font-size:${p}px !important;`,radius:`border-radius:${p}px !important;`,paddingX:`padding-left:${p}px !important;padding-right:${p}px !important;`,paddingY:`padding-top:${p}px !important;padding-bottom:${p}px !important;`}[u]??"",u==="paddingY"&&(d+=`section${n}>div{padding-top:0 !important;padding-bottom:0 !important}`));return r?d+`${n}{${r}}`:d},be=()=>{if(!w?.styleKey)return;let e=oe(),t=w.styleKey,n=Ae(t,e),r={background:"background",textColor:"color",fontSize:"font-size",radius:"border-radius",backgroundImage:"background-image"};for(let[d,u]of Object.entries(e))u||(d==="hidden"&&(n+=`body.editing [data-style="${t}"]{opacity:1 !important}`),r[d]&&(n+=`[data-style="${t}"]{${r[d]}:revert-layer !important}`),d==="paddingY"&&(n+=`[data-style="${t}"]{padding-top:revert-layer !important;padding-bottom:revert-layer !important}section[data-style="${t}"]>div{padding-top:revert-layer !important;padding-bottom:revert-layer !important}`),d==="paddingX"&&(n+=`[data-style="${t}"]{padding-left:revert-layer !important;padding-right:revert-layer !important}`));pe.textContent=n},me=()=>{pe.textContent=""};k.addEventListener("input",()=>{w&&(w.dirty=!0),be()}),k.addEventListener("change",()=>{w&&(w.dirty=!0),be()});let oe=()=>{let e={};return k.querySelectorAll("[data-style-prop]").forEach(t=>{if(t.type==="checkbox")e[t.dataset.styleProp]=t.checked?"1":"";else if(t.type==="color"){let n=t.closest("div").querySelector("input[type=checkbox]").checked;e[t.dataset.styleProp]=n?"":t.value}else e[t.dataset.styleProp]=t.value;if(t.dataset.kbCredit&&t.dataset.kbCreditFor===t.value)try{Object.assign(e,JSON.parse(t.dataset.kbCredit))}catch{}}),e},ee=null,ye=()=>{!ee||!w||w.dirty||!N.classList.contains("is-open")||W!=="Edit"||ee.isConnected&&Qe(ee)},we=e=>e.dataset.editRegion?e.dataset.editRegion:e.dataset.editLabel?e.dataset.editLabel:e.querySelector(":scope > [data-style-edit]")?.dataset.editLabel??J(e),Qe=e=>{if(ee=e,e.dataset.editImg!==void 0)rt(e);else if(e.dataset.edit!==void 0)We(e);else if(e.dataset.svgEdit!==void 0||e.dataset.editSvg!==void 0)jt(e);else if(e.dataset.editHref!==void 0)nt(e);else if(e.dataset.style!==void 0){let t=e.querySelector(":scope > [data-style-edit]");at(t??e)}},Ze=e=>{w?.dirty&&!window.confirm("Discard unsaved changes?")||(me(),Qe(e))},O=null,F=e=>{let t=O;O=e??null;let n=[],r=e?.parentElement;for(;r&&r!==document.body;)r.dataset&&(r.dataset.edit!==void 0||r.dataset.style!==void 0)&&n.unshift(r),r=r.parentElement;let d=[];n.forEach(p=>{let s=we(p);if(d.length&&d[d.length-1].label===s){d[d.length-1].node=p;return}d.push({node:p,label:s})});let u=d.slice(-3);t&&t!==e&&document.contains(t)&&!u.some(p=>p.node===t)&&u.unshift({node:t,label:`\u2190 ${we(t)}`}),K.replaceChildren(),K.classList.toggle("is-visible",u.length>0),u.forEach((p,s)=>{let h=p.node;s>0&&K.append("\u203A");let g=document.createElement("button");g.type="button",g.textContent=p.label,g.className="le-crumb",g.addEventListener("click",()=>Ze(h)),K.append(g)})},W="Edit",Te=e=>{W=e,Object.entries(T).forEach(([t,n])=>{n.classList.toggle("is-on",t===e),n.setAttribute("aria-selected",t===e?"true":"false")}),X.classList.toggle("le-hidden",e!=="Edit"),c.drawerFoot.classList.toggle("le-hidden",e!=="Edit"),e==="Changes"&&xe(),e==="History"&&Pn()};Object.entries(T).forEach(([e,t])=>{t.addEventListener("click",()=>{e!=="Edit"&&w?.dirty&&!window.confirm("Discard unsaved changes?")||(Te(e),N.classList.contains("is-open")||et())})});let q=(e,t)=>{console.warn(`[live-edit] ${t}:`,e);let n=String(e?.message??"");return/failed to fetch|networkerror|load failed/i.test(n)?"No connection just now. Nothing has been lost; try again in a moment.":/\b401\b|\b403\b|unauthor|forbidden/i.test(n)?"Your editing session has expired. Reload the page to carry on.":/\b429\b|too many/i.test(n)?"That was a lot at once. Give it a few seconds and try again.":`Could not ${t}. Nothing has been lost; try again in a moment.`},M=null,qe=async()=>{if(window.liveEditApi)try{M=await(await I("/live-edit/credits",{method:"GET"})).json(),ye()}catch(e){console.warn("[live-edit] could not read the credit balance:",e),M=null}},_e=async()=>{if(!(window.liveEditStyleProps&&window.liveEditStyles)&&window.liveEditApi)try{let t=await(await I("/live-edit/content",{method:"GET"})).json();t?.styleProps&&(window.liveEditStyleProps=t.styleProps),t?.styles&&(window.liveEditStyles=t.styles),ye()}catch(e){console.warn("[live-edit] could not read what this site allows to be styled:",e)}},ve=(e,t)=>{if(!M?.available||!t)return;let n=document.createElement("div");n.className="le-assist-head",n.append(Me("AI assist"),ae()),k.append(n),[["rewrite","Rewrite"],["shorten","Shorten"]].forEach(([r,d])=>{let u=M.costs?.[r]??1,p=document.createElement("button");p.type="button",p.className="le-assist";let s=document.createElement("span");s.textContent=d;let h=document.createElement("span");h.className="le-assist-cost",h.textContent=`${u} credit${u===1?"":"s"}`,p.append(s,h),(M.balance??0)<u&&(p.disabled=!0,h.classList.add("is-short"),p.title="Not enough credits"),p.addEventListener("click",()=>void $e(r,d,e,t,p,s)),k.append(p)})},ae=()=>{let e=document.createElement("span");return e.className="le-assist-balance",e.textContent=`${M?.balance??0} credits left`,e},Me=e=>{let t=document.createElement("div");return t.className="le-section-heading",t.textContent=e,t},Ne=()=>(document.querySelector('meta[property="og:site_name"]')?.content??document.querySelector('meta[name="application-name"]')?.content??(document.title??"").split(/\s+[|\u2013\u2014-]\s+/).pop()??"").replace(/\s+/g," ").trim().slice(0,120),Ue=()=>(document.querySelector('meta[name="description"]')?.content??document.querySelector('meta[property="og:description"]')?.content??"").replace(/\s+/g," ").trim().slice(0,400),$e=async(e,t,n,r,d,u)=>{d.disabled=!0,u.textContent="Thinking\u2026";let p;try{p=await(await I("/live-edit/assist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:e,text:r.value,heading:Oe(n),role:J(n),page:window.location.pathname,site:Ne(),about:Ue()})})).json()}catch(s){d.disabled=!1,u.textContent=t,c.toast(q(s,"rewrite that"));return}if(typeof p?.balance=="number"&&M&&(M.balance=p.balance),!p?.text){d.disabled=!1,u.textContent=t,c.toast(He(p?.reason));return}r.value=p.text,r.dispatchEvent(new Event("input",{bubbles:!0})),r.focus(),d.disabled=!1,u.textContent=t,c.toast(`Rewritten. ${p.balance} credits left.`)},Oe=e=>(((e.closest("section, article, header, div[data-style]")??document.body).querySelector("h1, h2, h3")??document.querySelector("h1"))?.textContent??"").replace(/\s+/g," ").trim().slice(0,200),He=e=>({not_enough_credits:"Not enough credits for that. You can buy more from your account.",no_suggestion:"No suggestion for this one. Your words are unchanged.",not_configured:"Rewriting is not switched on for this site yet.",nothing_to_work_with:"There are no words here to rewrite yet."})[e]??"Could not rewrite that just now. Your words are unchanged.",xe=async()=>{k.replaceChildren(G("Loading\u2026"));let e;try{e=await(await I("/live-edit/changes",{method:"GET"})).json()}catch(n){k.replaceChildren(G(q(n,"show your changes")));return}let t=e?.changes??[];if(t.length===0){k.replaceChildren(G("No unpublished changes."));return}k.replaceChildren(),t.forEach(n=>{let r=document.createElement("div");r.className="le-change";let d=document.createElement("div");d.className="le-row le-change-head";let u=document.createElement("span");u.className="le-change-label",u.textContent=re(n);let p=document.createElement("button");if(p.type="button",p.className="le-chip-btn",p.textContent="Revert",p.addEventListener("click",()=>void Y(n,p)),d.append(u,p),r.append(d),n.before){let h=document.createElement("p");h.className="le-change-before",h.textContent=ke(n.before),r.append(h)}let s=document.createElement("p");s.className="le-change-after",s.textContent=ke(n.after)||"(empty)",r.append(s),k.append(r)})},ke=e=>{let t=String(e??"").replace(/\s+/g," ").trim();return t.length>70?`${t.slice(0,70)}\u2026`:t},re=e=>{let t=document.querySelector(`[data-edit="setting:${CSS.escape(e.key)}"], [data-edit-img="setting:${CSS.escape(e.key)}"], [data-style="${CSS.escape(e.key)}"]`);return t?J(t):e.kind==="style"?"Styling":"Text"},Y=async(e,t)=>{t.disabled=!0,t.textContent="Reverting\u2026";try{await I("/live-edit/changes",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:e.key,kind:e.kind})})}catch(n){t.disabled=!1,t.textContent="Revert",c.toast(q(n,"put that back"));return}P("Reverted \u2713")},Pn=async()=>{k.replaceChildren(G("Loading\u2026"));let e;try{e=await(await I("/live-edit/versions",{method:"GET"})).json()}catch(n){k.replaceChildren(G(q(n,"show what has been published")));return}let t=e?.versions??[];if(t.length===0){k.replaceChildren(G("Nothing published yet. Your first publish will appear here."));return}k.replaceChildren(),t.forEach((n,r)=>{let d=document.createElement("div");d.className="le-version";let u=document.createElement("span");u.className=r===0?"le-version-dot is-latest":"le-version-dot";let p=document.createElement("div"),s=document.createElement("p");s.className="le-change-after",s.textContent=n.restored_from?`Restored version ${n.restored_from}`:`Published ${n.changes??0} change${n.changes===1?"":"s"}`;let h=document.createElement("p");h.className="le-change-when",h.textContent=In(n.published_at),p.append(s,h),d.append(u,p),k.append(d)})},G=e=>{let t=document.createElement("p");return t.className="le-hint",t.textContent=e,t},In=e=>{if(!e)return"";let t=Math.round((Date.now()-new Date(e).getTime())/1e3);return t<90?"Just now":t<3600?`${Math.round(t/60)} minutes ago`:t<86400?`${Math.round(t/3600)} hours ago`:t<86400*8?`${Math.round(t/86400)} days ago`:new Date(e).toLocaleDateString()},et=()=>{Be(),dt(),N.classList.add("is-open"),c.toolbar.classList.add("is-compact"),W==="Edit"&&k.querySelector("textarea, input:not([type=checkbox]), select")?.focus()},Ee=(e=!1)=>{!e&&w?.dirty&&!window.confirm("Discard unsaved changes?")||(w?.restore?.(),me(),N.classList.remove("is-open"),c.toolbar.classList.remove("is-compact"),w=null)},zn=()=>document.querySelectorAll("[data-edit], [data-edit-img], [data-edit-bg], [data-edit-href], [data-edit-icon], [data-edit-svg]"),tt=async(e,t=0)=>{try{if(e.cssRules){let n=[];for(let r of e.cssRules)r.styleSheet&&t<4?n.push(await tt(r.styleSheet,t+1)):n.push(r.cssText);return n.join("")}}catch{}if(!e.href)return"";try{let n=await fetch(e.href);if(!n.ok)return"";let r=await n.text();if(t>=4)return r;let d=[...r.matchAll(/@import\s+(?:url\(\s*(["']?)([^"')]+)\1\s*\)|(["'])([^"']+)\3)/gi)].map(p=>p[2]||p[4]).filter(Boolean),u=await Promise.all(d.map(p=>tt({href:new URL(p,e.href).href},t+1)));return r+u.join("")}catch{return""}},jn=null,Fn=async()=>{let e=new Map;return(await Promise.all([...document.styleSheets].map(n=>tt(n)))).forEach(n=>Zt(n).forEach(r=>e.set(r.name,r.glyph))),[...e].map(([n,r])=>({name:n,glyph:r})).sort((n,r)=>n.name.localeCompare(r.name))},Nt=()=>jn??(jn=Fn()),$t=()=>{document.querySelectorAll("[data-style]").forEach(e=>{if(e.hasAttribute("data-edit-bg"))return;let n=(getComputedStyle(e).backgroundImage||"").match(/url\((['"]?)(.*?)\1\)/),r=e.getBoundingClientRect(),d=n&&!n[2].startsWith("data:")&&r.width>=120&&r.height>=120;e.toggleAttribute("data-has-bg",!!d)})},Rn=()=>{document.querySelectorAll("[data-edit-icon]").forEach(e=>{let t=getComputedStyle(e,"::before").content;(t==="none"||t==="normal"||t==='""'||t==="")&&e.removeAttribute("data-edit-icon")})},Se=e=>{e&&Rn(),document.body.classList.toggle("editing",e),zn().forEach(t=>{e?t.setAttribute("tabindex","0"):t.removeAttribute("tabindex")}),sessionStorage.setItem("tb_editing",e?"1":"0"),le.textContent=e?"Click any outlined text or image":"",le.parentElement?.classList.toggle("is-saying",e),!e&&typeof Be=="function"&&Be(),c.toolbar.classList.toggle("is-editing",e),ne.textContent=e?"Done editing":"Edit site",e?($t(),document.querySelector("[data-edit-icon]")&&Nt(),o?.base&&o?.site&&Promise.resolve().then(()=>(xt(),vt)).then(t=>t.refreshBackgrounds({base:o.base,site:o.site,key:o.token})).then(t=>{t&&$t()}).catch(t=>console.warn("[live-edit] could not look again for backgrounds:",t.message))):(dt(),fe()),e||Ee(!0)},Dn=async()=>{let e=window.liveEditApi,t=await Promise.resolve().then(()=>(Bn(),On)).catch(()=>null);if(t?.forget(window),!e||!t){window.location.reload();return}let n=window.prompt("Your editing session has ended. Enter your email address and we will send you a new link.");n&&(await t.requestLink(e,n,window).catch(()=>{}),x("If that address can edit this site, a link is on its way.")),window.location.reload()},I=async(e,t)=>{let n=window.liveEditApi,r=n?on(e,t,n):null,d=r?await fetch(r.url,r.init):await fetch(e,Xt(i,t));if(d.status===419||d.status===401)throw await Dn(),new Error("Your editing session has ended.");if(!d.ok){let u=await d.json().catch(()=>({}));throw new Error(u.error?.message??u.message??"Could not save. Try again.")}if(!Qt(d))throw new Error("That did not save. Reload the page and try again.");return d},qn=(e,t)=>{if(!e?.element)return null;let n=r=>{let d=e.element.getAttribute(r);return d===null?null:{attr:r,marker:d}};if(e.kind==="image"){let r=t.querySelector("input[type=url]")?.value.trim(),d=t.querySelector("input[type=file]")?.files?.[0],u=n("data-edit-img")??n("data-edit-bg");return r&&u?{...u,kind:"image",value:r}:null}if(e.kind==="icon"){let r=n("data-edit-icon");return r&&e.value?{...r,kind:"icon",value:e.value}:null}if(e.kind==="setting"&&typeof e.savedValue=="string"){let r=n("data-edit");return!r||/<[a-z][\s\S]*>/i.test(e.savedValue)||e.element.hasAttribute("data-edit-attr")?null:{...r,kind:"text",value:e.savedValue}}return null},_n=async e=>{let t=window.liveEditApi?.builderUrl;if(!t||e?.kind!=="setting"||typeof e.savedValue!="string"||!e.element)return;let n=e.element.closest(".elementor-element[data-id]");if(n)try{await fetch(t,{method:"POST",headers:{"Content-Type":"application/json",...window.liveEditApi?.publishHeaders??{}},body:JSON.stringify({page:window.location.href,element:n.dataset.id,value:e.savedValue})})}catch(r){console.warn("[live-edit] could not tell the page builder about this change:",r.message)}},Mn=async()=>{if(!w)return;let e=c.saveButton;e.disabled=!0,e.textContent="Saving\u2026";let t=()=>{e.disabled=!1,e.textContent="Save changes"};try{if(w.kind==="setting")await I("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:w.key,value:w.savedValue=w.value??k.querySelector("textarea, input[name=icon]")?.value??"",locale:window.liveEditLocale})});else if(w.kind==="record"){let n={};k.querySelectorAll("textarea, select, input[type=hidden][name]").forEach(r=>n[r.name]=r.value),await I("/live-edit/record",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:w.type,id:w.id,fields:n})})}else if(w.kind==="icon")await I("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:w.key,value:w.value})});else if(w.kind==="image"){let n=new FormData;n.append("target",w.target);let r=k.querySelector("input[type=file]").files[0],d=k.querySelector("input[type=url]").value.trim(),u=w.element?.getBoundingClientRect?.();u&&u.width>=1&&u.height>=1&&(n.append("fitWidth",String(Math.round(u.width))),n.append("fitHeight",String(Math.round(u.height))));let p=r!==void 0||d!==""&&d!==void 0;w.credit&&w.creditFor===w.target&&p&&Object.entries(w.credit).forEach(([h,g])=>n.append(h,g));let s=[...k.querySelectorAll("[data-img-attr]")];if(r?n.append("file",r):d&&n.append("url",d.startsWith("http")?d:`https://${d}`),s.forEach(h=>n.append(h.dataset.imgAttr,h.value)),!r&&!d&&s.length===0){t(),x("Choose a file from your computer or paste an image URL first.");return}await I("/live-edit/image",{method:"POST",body:n})}if(w.hrefKey){let n=k.querySelector("[data-link-field=href]").value.trim(),r=k.querySelector("[data-link-field=target]").checked;await I("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:w.hrefKey,value:n})}),w.targetKey&&await I("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:w.targetKey,value:r?"_blank":""})})}w.styleKey&&await I("/live-edit/style",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:w.styleKey,props:oe()})}),await _n(w),Jt(qn(w,k)),D("Saved \u2713",w.key??null,w.savedValue??null)}catch(n){t(),x(n.message)}};qe(),_e();let j=(e,t,n)=>{let r=document.createElement(e);return t&&(r.className=t),n!=null&&(r.textContent=n),r},Ot=e=>{let t=e.closest("section, article, header, div[data-style]");for(;t&&!t.querySelector("h1, h2, h3");)t=t.parentElement?.closest("section, article, header, div[data-style]")??null;let n=t?.querySelector("h1, h2, h3");return!t||!n?"":[...t.querySelectorAll("p, span, div, h4, h5, h6")].filter(d=>d.children.length===0).filter(d=>n.compareDocumentPosition(d)&Node.DOCUMENT_POSITION_PRECEDING).map(d=>(d.textContent??"").replace(/\s+/g," ").trim()).find(d=>d.length>3&&d.length<42)??""},Un=/^(the|and|with|for|your|our|from|that|this|they|them|will|have|more|about|into|just|than|then|when|what|where|very|been|here|there)$/,Bt=e=>{let t=new Set((document.title??"").toLowerCase().split(/[^a-z0-9]+/i).filter(Boolean));return(e??"").toLowerCase().split(/[^a-z0-9]+/i).filter(n=>n.length>3&&!Un.test(n)&&!t.has(n))},Hn=e=>{let t=Bt(Ot(e)).slice(0,3);if(t.length>0)return t.join(" ");let n=Bt(Oe(e)).slice(0,3);return n.length>0?n.join(" "):"workplace"},Pt=e=>{let t=Hn(e),n=(e.dataset.editLabel??"").toLowerCase().trim(),r=/hero|banner|header|cover/.test(n);return[...new Set([t,r?`${t} wide`:`${t} close up`,"workplace"].filter(Boolean))].slice(0,4)},Wn=e=>`${(Ot(e)||Oe(e)||"This page").replace(/[.\s]+$/,"")}. Photographic, natural daylight, calm and editorial, soft neutral tones to match the rest of the site. No text.`,It=(e,t,n="Free photos",r="image")=>{let d=c.modal({title:`Replace ${r}`,subtitle:e.dataset.editLabel??J(e)}),u=document.createElement("div");d.body.append(u),d.tabs.hidden=!1;let p=y=>{d.close(),t(y)},s={Upload:()=>Vn(u,p),"Free photos":()=>void Jn(u,e,p),"Generate with AI":()=>Gn(u,e,p)},h=Object.keys(s).map(y=>{let m=document.createElement("button");return m.type="button",m.className="le-modal-tab",m.textContent=y,m.addEventListener("click",()=>g(y)),d.tabs.append(m),[y,m]}),g=y=>{h.forEach(([m,b])=>b.classList.toggle("is-on",m===y)),u.replaceChildren(),s[y]()};return g(s[n]?n:"Free photos"),d},Vn=(e,t)=>{e.append(ce({hint:"PNG, JPG or WEBP, or drag one here",onFile:s=>t({file:s})}));let n=j("div","le-row-tight"),r=document.createElement("input");r.type="url",r.className="le-search",r.placeholder="Or paste a link to a picture";let d=j("button","le-btn-outline","Use it");d.type="button";let u=()=>{let s=r.value.trim();s&&t({url:s.startsWith("http")?s:`https://${s}`})};d.addEventListener("click",u),r.addEventListener("keydown",s=>{s.key==="Enter"&&(s.preventDefault(),u())}),n.append(r,d),e.append(n);let p=j("p","le-hint","You can also drag a picture straight onto the image on the page.");p.style.marginTop="14px",e.append(p)},Jn=async(e,t,n)=>{let r=document.createElement("input");r.type="search",r.className="le-search",r.placeholder="Search free photographs";let d=document.createElement("div");d.className="le-chips";let u=document.createElement("div");u.className="le-grid";let p=document.createElement("p");p.className="le-hint",p.style.marginTop="16px",e.append(r,d,u,p);let s=()=>{u.replaceChildren();for(let g=0;g<6;g+=1)u.append(j("div","le-shimmer"))},h=async g=>{r.value=g,s();let y;try{y=await(await I(`/live-edit/photos?q=${encodeURIComponent(g)}`,{method:"GET"})).json()}catch(b){u.replaceChildren(G(q(b,"look for photographs")));return}let m=y?.photos??[];if(p.textContent=y?.source==="openverse"?"Free to use, including commercially. The photographer is credited automatically.":"Free to use under the Unsplash licence. The photographer is credited automatically.",m.length===0){u.replaceChildren(G(Yn(y?.reason,g)));return}u.replaceChildren(),m.forEach(b=>{let v=document.createElement("button");v.type="button",v.className="le-pick";let E=document.createElement("img");E.className="le-pick-shot",E.src=b.thumb??b.full,E.alt=b.alt??"",E.loading="lazy";let A=j("span","le-pick-by",b.by?`Photo by ${b.by}`:"");v.append(E,A),v.addEventListener("click",()=>{b.downloadLocation&&I("/live-edit/photos/used",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({download_location:b.downloadLocation})}).catch(()=>{}),n({url:b.full,alt:b.alt??"",credit:b.credit??(b.by?`Photo by ${b.by}`:""),creditBy:b.by??"",creditUrl:b.byUrl??"",creditSource:b.source??"",creditSourceUrl:b.sourceUrl??""})}),u.append(v)})};Pt(t).forEach((g,y)=>{let m=document.createElement("button");m.type="button",m.className="le-chip",m.textContent=g,m.addEventListener("click",()=>void h(g)),d.append(m),y===0&&m.classList.add("is-on")}),r.addEventListener("keydown",g=>{g.key==="Enter"&&(g.preventDefault(),r.value.trim()&&h(r.value.trim()))}),await h(Pt(t)[0])},Yn=(e,t)=>({not_configured:"Free photographs are not switched on for this site yet.",not_allowed:"The photo library would not accept this site\u2019s key. It needs setting up again.",unreachable:"Could not reach the photo library just now. Try again in a moment.",nothing_to_search_for:"Type what the picture should show."})[e]??`Nothing found for "${t}". Try fewer words.`,Gn=(e,t,n)=>{let r=Wn(t),d=j("div","le-suggest");d.append(j("div","le-eyebrow","Suggested for this spot"),j("div","le-suggest-text",r));let u=document.createElement("button");u.type="button",u.className="le-chip",u.style.marginTop="10px",u.textContent="Use this description",d.append(u);let p=document.createElement("textarea");p.className="le-textarea",p.placeholder="Describe the picture you want",u.addEventListener("click",()=>{p.value=r,p.focus()});let s=document.createElement("button");s.type="button",s.className="le-btn-publish",s.style.marginTop="14px",s.textContent="Make a picture \xB7 5 credits";let h=j("div","le-grid is-square");h.style.display="none",e.append(d,p,s,h),s.addEventListener("click",async()=>{let g=p.value.trim()||r;s.disabled=!0,s.textContent="Making\u2026",h.style.display="",h.replaceChildren();for(let b=0;b<4;b+=1)h.append(j("div","le-shimmer"));let y;try{y=await(await I("/live-edit/imagine",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:g})})).json()}catch(b){h.replaceChildren(G(q(b,"make a picture"))),s.disabled=!1,s.textContent="Try again \xB7 5 credits";return}let m=y?.images??[];if(typeof y?.balance=="number"&&(M={...M??{},balance:y.balance}),m.length===0){h.replaceChildren(G(Kn(y?.reason))),s.disabled=!1,s.textContent="Try again \xB7 5 credits";return}h.replaceChildren(),m.forEach(b=>{let v=document.createElement("button");v.type="button",v.className="le-pick";let E=document.createElement("img");E.className="le-pick-shot",E.src=b,E.alt="",v.append(E,j("span","le-tag","MADE")),v.addEventListener("click",()=>n({url:b,credit:"",creditSource:"Generated"})),h.append(v)}),s.disabled=!1,s.textContent="Make four more \xB7 5 credits"})},Kn=e=>({not_enough_credits:"Not enough credits to make a picture. You can buy more from your account.",not_configured:"Making pictures is not switched on for this site yet.",no_suggestion:"Nothing usable came back, so you have not been charged. Try describing it differently.",nothing_to_work_with:"Describe the picture you want first."})[e]??"Could not make a picture just now. You have not been charged.",Ce=null,Xn=(e,t)=>{if(!t)return;let n=se(e),r=s=>[...s.childNodes].filter(h=>h.nodeType===3),d=r(e).map(s=>s.nodeValue),u=()=>{let s=r(e);return s.length!==d.length?!1:(s.forEach((h,g)=>{h.nodeValue=d[g]}),!0)},p=!1;w.restore=()=>{!p||!Ce||u()||Ce(e,n)},t.addEventListener("input",()=>{Ce&&(p=!0,u(),Ce(e,t.value,{keepRuns:!0}))}),Ce===null&&Promise.resolve().then(()=>(Lt(),Ct)).then(s=>Ce=s.applyValue).catch(s=>console.warn("[live-edit] could not preview words as you type:",s.message))},Qn=e=>{w.hrefKey=e.dataset.editHref,w.targetKey=e.dataset.editTarget;let t=document.createElement("div");t.className="le-field le-divided",t.append("Link");let n=document.createElement("input");n.type="text",n.dataset.linkField="href";let r=e.getAttribute("href")??"";n.value=r==="#"?"":r,n.placeholder="/contact or https://...",n.className="le-input le-link";let d=document.createElement("label");d.className="le-default";let u=document.createElement("input");u.type="checkbox",u.dataset.linkField="target",u.checked=e.getAttribute("target")==="_blank",d.append(u,"Open in a new tab"),t.append(n,d),k.append(t)},nt=e=>{w={kind:"link"},$.textContent=e.dataset.editLabel??"Link",k.replaceChildren(),H.classList.add("le-hidden"),ue(e)},We=e=>{let{kind:t,key:n,parts:r}=Kt(e.dataset.edit);if(k.replaceChildren(),H.classList.add("le-hidden"),t==="setting"){w={kind:t,key:n,element:e},$.textContent=e.dataset.editLabel??J(e);let d=(window.liveEditRich?.settings??[]).includes(r[0]),u=bt({editValue:e.dataset.editValue,ownText:se(e),fullText:e.textContent}),p=d?u.trim():u.replace(/\s+/g," ").trim(),s=e.dataset.editAs==="icon";k.append(s?de("icon","Icon",e.dataset.editValue??"",1,!1):de("value","Text",p,6,d)),s||ve(e,k.querySelector("textarea")),!s&&!d&&Xn(e,k.querySelector("textarea"))}else{let[d,u]=r;w={kind:"record",type:d,id:Number(u)};let p=e.dataset.editLabel??"Item",s=JSON.parse(e.dataset.editValues??"{}"),h=s.title??s.question??s.label??s.number;if($.textContent=h?`${p}: ${h.slice(0,40)}`:p,Object.entries(s).forEach(([b,v])=>{let E=b.replace(/_/g," "),A=E.charAt(0).toUpperCase()+E.slice(1),S=(window.liveEditRich?.fields??[]).includes(`${d}.${b}`);k.append(de(b,A,v,b==="detail"||b==="answer"?6:3,S))}),window.liveEditPublishing){let b=document.createElement("div");b.className="le-hint le-immediate",b.textContent="Changes here go live as soon as you save, without publishing.",k.append(b)}e.hasAttribute("data-edit-deletable")&&(H.textContent=`Delete this ${p.toLowerCase()}`,H.classList.remove("le-hidden"));let g=document.createElement("div");g.className="le-row";let y=document.createElement("span");y.className="le-label",y.textContent="Order";let m=(b,v)=>{let E=document.createElement("button");return E.type="button",E.textContent=v,E.className="le-chip-btn",E.addEventListener("click",async()=>{(await(await I("/live-edit/record/move",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:w.type,id:w.id,direction:b})})).json()).moved?P("Reordered \u2713"):x(b==="up"?"Already first.":"Already last.")}),E};g.append(y,m("up","\u2191 Move up"),m("down","\u2193 Move down")),k.prepend(g)}ue(e)},Zn=e=>{let t=e.closest?.("[data-edit-item]"),n=t?.parentElement?.dataset?.editList?t.parentElement:e.closest?.("[data-edit-list]");if(!n?.dataset?.editList)return;let r=()=>[...n.children].filter(h=>h.dataset.editItem).map(h=>h.dataset.editItem),d=async(h,g)=>{try{await I("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:n.dataset.editList,value:JSON.stringify(h)})}),P(g)}catch(y){x(y.message)}},u=document.createElement("div");u.className="le-section-heading",u.textContent="List";let p=document.createElement("div");p.className="le-row";let s=document.createElement("button");if(s.type="button",s.className="le-chip-btn",s.textContent=t?"+ Add another":"+ Add item",s.addEventListener("click",()=>{let h=r(),g=t?h.indexOf(t.dataset.editItem):h.length-1;h.splice(g+1,0,"n"+Date.now().toString(36)),d(h,"Added \u2713")}),p.append(s),t){let h=document.createElement("button");h.type="button",h.className="le-btn-danger",h.textContent="Delete this item",h.addEventListener("click",()=>{window.confirm("Delete this item?")&&d(r().filter(g=>g!==t.dataset.editItem),"Deleted \u2713")}),p.append(h)}k.append(u,p)},ot=!1,eo=e=>{ot=!0,e.click(),window.setTimeout(()=>{ot=!1},0)},to=e=>e.closest?.('a[href^="#"], [aria-controls], [aria-expanded], [data-toggle], [role="button"]')??null,no=e=>{let t=to(e);if(t){let p=document.createElement("div");p.className="le-row";let s=document.createElement("button");s.type="button",s.className="le-chip-btn",s.textContent="Open this menu",s.title="Runs the control so you can edit what it reveals",s.addEventListener("click",()=>{Ee(!0),eo(t)}),p.append(s),k.append(p)}let n=e.closest?.("a[href]"),r=n?.getAttribute("href");if(!r||r==="#"||r.startsWith("javascript:"))return;let d=document.createElement("div");d.className="le-row";let u=document.createElement("button");u.type="button",u.className="le-chip-btn",u.textContent="Open this link \u2192",u.addEventListener("click",()=>{window.location.href=n.href}),d.append(u),k.append(d)},ue=(e,{styleKey:t=null,styleOn:n=e}={})=>{e.dataset.editHref!==void 0&&Qn(e),no(e);let r=t??n.dataset.styleEdit??n.dataset.style,d=nn(n.dataset.styleProps,window.liveEditStyleProps);r&&d.length&&De(r,d,n),ao(e),Zn(e),F(e.dataset.styleEdit?e.closest("[data-style]")??e.parentElement:e),Te("Edit"),et()},oo=e=>{let t=(se(e)||e.textContent||"").replace(/\s+/g," ").trim();if(t)return t.slice(0,28);let n=(e.getAttribute("aria-label")??e.getAttribute("title")??"").trim();if(n)return n.slice(0,28);let r=e.className.toString().match(/(?:social-icon-|fa-|bi-|icon-)([a-z][a-z0-9-]{2,})/i)?.[1]??[...e.querySelectorAll("[class]")].map(d=>d.className.toString().match(/(?:social-icon-|fa-|bi-|icon-)([a-z][a-z0-9-]{2,})/i)?.[1]).find(Boolean);return r?r.charAt(0).toUpperCase()+r.slice(1):we(e)},ao=e=>{let t="[data-edit], [data-edit-img], [data-edit-bg], [data-edit-href], [data-edit-icon], [data-edit-svg]",n=[...e.querySelectorAll(t)].filter(p=>p.parentElement?.closest(t)===null||!e.contains(p.parentElement.closest(t))).filter(p=>p!==e&&p.getBoundingClientRect().width>0);if(n.length===0)return;let r=n.slice(0,24),d=document.createElement("div");d.className="le-section-heading",d.textContent=n.length>r.length?`Inside this \u2014 first ${r.length} of ${n.length}`:"Inside this",k.append(d);let u=document.createElement("div");u.className="le-row",r.forEach(p=>{let s=document.createElement("button");s.type="button",s.className="le-chip-btn",s.textContent=oo(p),s.addEventListener("click",()=>Ze(p)),u.append(s)}),k.append(u)},at=e=>{w={kind:"style"};let t=e.dataset.styleEdit??e.dataset.style;$.textContent=e.dataset.editLabel??J(e),k.replaceChildren(),H.classList.add("le-hidden"),ue(e,{styleKey:t})},Ve=e=>{let t=getComputedStyle(e,"::before");return`${t.fontStyle} ${t.fontWeight} 20px ${t.fontFamily}`},zt=(e,t)=>{let n=e.cloneNode(!1);n.removeAttribute("data-edit-icon"),Object.assign(n.style,{position:"absolute",visibility:"hidden",pointerEvents:"none"}),(e.parentNode??document.body).append(n);let r=Ve(n),d=[];return[...n.classList].forEach(u=>{u!==t&&(n.classList.remove(u),Ve(n)!==r&&d.push(u),n.classList.add(u))}),n.remove(),d},ro=(e,t,n,r)=>en([...e.classList],n,r,zt(e,r),zt(t,t.dataset.editIconCurrent)),io=(e,t)=>{let n=document.createElement("canvas").getContext("2d");return n.font=t,e.filter(({glyph:r})=>{let d=n.measureText(r);return(d.actualBoundingBoxAscent||0)+(d.actualBoundingBoxDescent||0)>0})},so=async e=>{let t=e.dataset.editIconCurrent;w={kind:"icon",key:e.dataset.editIcon.replace(/^setting:/,""),value:t,element:e},$.textContent="Icon",k.replaceChildren(),H.classList.add("le-hidden");let n=Ve(e),r=await Nt();if(w?.element!==e)return;let d=new Map([[n,null]]);document.querySelectorAll("[data-edit-icon]").forEach(b=>{let v=Ve(b);d.has(v)||d.set(v,b)});let u=tn([...d].map(([b,v])=>({face:b,variant:v,icons:io(r,b)})));if(u.length===0){let b=document.createElement("div");b.className="le-hint",b.textContent="This theme loads its icons from somewhere this page cannot read, so they cannot be listed. Type the icon name instead.";let v=document.createElement("label");v.className="le-field",v.append("Icon name");let E=document.createElement("input");E.type="text",E.className="le-input",E.value=t??"",E.addEventListener("input",()=>{w.value=E.value.trim(),w.dirty=!0}),v.append(E,b),k.append(v),ue(e);return}let p=e.className;w.restore=()=>{e.className=p,e.dataset.editIconCurrent=t};let s=document.createElement("input");s.type="search",s.className="le-input",s.placeholder=`Search ${u.length} icons\u2026`;let h=document.createElement("div");h.className="le-icon-grid";let g=document.createElement("div");g.className="le-hint";let y=400,m=b=>{let v=b.trim().toLowerCase().replace(/\s+/g,"-"),E=v?u.filter(({name:A})=>A.includes(v)):u;if(h.replaceChildren(),E.slice(0,y).forEach(({name:A,glyph:S,face:z,variant:_})=>{let R=document.createElement("button");R.type="button",R.className="le-icon-choice",R.title=A.replace(/^[a-z]+-/,"").replace(/-/g," "),R.classList.toggle("is-current",A===t),R.style.font=z,R.textContent=S,R.addEventListener("click",()=>{e.className=p,e.dataset.editIconCurrent=t;let U=_?ro(e,_,A,t):A;_?e.className=U:e.classList.replace(t,A),e.dataset.editIconCurrent=A,w.value=U,w.dirty=!0,h.querySelectorAll(".le-icon-choice").forEach(Z=>Z.classList.remove("is-current")),R.classList.add("is-current")}),h.append(R)}),E.length===0){let A=document.createElement("div");A.className="le-hint",A.textContent="No icon matches that name.",h.append(A)}g.textContent=E.length>y?`Showing ${y} of ${E.length}. Type to narrow it down.`:""};s.addEventListener("input",()=>m(s.value)),m(""),k.append(s,h,g),ue(e)},jt=e=>{let t=e.outerHTML;w={kind:"setting",key:e.dataset.editSvg.replace(/^setting:/,""),element:e},$.textContent=e.dataset.editLabel??"Drawing",k.replaceChildren(),H.classList.add("le-hidden");let n=()=>{e.outerHTML=t};w.restore=n;let r=new Set,d=[];document.querySelectorAll("svg").forEach(m=>{let b=m.outerHTML,v=b.replace(/\s+(class|style|width|height|data-[\w-]+)="[^"]*"/g,"");r.has(v)||m.getBoundingClientRect().width<4||(r.add(v),d.push(b))});let u=document.createElement("div");u.className="le-icon-grid";let p=null;d.slice(0,120).forEach(m=>{let b=document.createElement("button");b.type="button",b.className="le-icon-choice",b.innerHTML=m;let v=b.firstElementChild;v&&(v.removeAttribute("class"),v.setAttribute("width","20"),v.setAttribute("height","20")),b.classList.toggle("is-current",m===t),b.addEventListener("click",()=>{p=m,w.value=m,w.dirty=!0;let E=document.querySelector(`[data-edit-svg="${e.dataset.editSvg}"]`)??e,A=new DOMParser().parseFromString(m,"image/svg+xml").documentElement;["class","width","height","style","data-edit-svg","data-edit-label"].forEach(S=>{E.hasAttribute(S)&&A.setAttribute(S,E.getAttribute(S))}),E.replaceWith(A),u.querySelectorAll(".le-icon-choice").forEach(S=>S.classList.remove("is-current")),b.classList.add("is-current")}),u.append(b)});let s=document.createElement("label");s.className="le-field le-divided",s.append("Or paste an SVG");let h=document.createElement("textarea");h.className="le-input le-prose",h.placeholder='<svg viewBox="0 0 24 24">\u2026</svg>',h.addEventListener("input",()=>{h.value.trim()!==""&&(w.value=h.value.trim(),w.dirty=!0)});let g=document.createElement("div");g.className="le-hint",g.textContent="Anything that could run or fetch is stripped before it is saved.",s.append(h,g);let y=document.createElement("div");y.className="le-section-heading",y.textContent=d.length?"Drawings on this site":"No other drawings here",k.append(y,u,s),ue(e)},rt=e=>{let t=e.dataset.editKind==="background";w={kind:"image",target:e.dataset.editImg??e.dataset.editBg,element:e},$.textContent=e.dataset.editLabel??(t?"Background image":"Image"),k.replaceChildren(),H.classList.add("le-hidden");let n=document.createElement("div");n.className="le-preview";let r=document.createElement("img");r.alt="",r.className="";let d=e.dataset.editPreview;d?(r.src=d,n.append(r)):n.textContent="No image yet";let u=S=>{n.replaceChildren(r),r.src=S},p=ce({onFile:S=>u(URL.createObjectURL(S))}),s=document.createElement("label");s.className="le-field",s.append("Or paste an image URL");let h=document.createElement("input");h.type="url",h.placeholder="https://...",h.className="le-input",h.addEventListener("change",()=>{let S=h.value.trim();S&&u(S.startsWith("http")?S:`https://${S}`)}),s.append(h);let g=document.createElement("div");g.className="le-hint",g.textContent="Nothing changes on your site until you publish.";let y=(S,z,_,R)=>{let U=document.createElement("label");U.className="le-field le-divided",U.append(z);let Z=document.createElement("input");if(Z.type="text",Z.dataset.imgAttr=S,Z.value=_??"",Z.className="le-input",U.append(Z),R){let ie=document.createElement("span");ie.className="le-hint",ie.textContent=R,U.append(ie)}return U},m=j("div","le-ways"),b=({url:S,file:z,credit:_,alt:R,creditBy:U,creditUrl:Z,creditSource:ie,creditSourceUrl:go})=>{if(z){let Wt=new DataTransfer;Wt.items.add(z),p.querySelector("input[type=file]").files=Wt.files,u(URL.createObjectURL(z))}else S&&(h.value=S,u(S));let ut=k.querySelector('[data-img-attr="alt"]');R&&ut&&ut.value.trim()===""&&(ut.value=R),w.credit={credit:_??"",creditBy:U??"",creditUrl:Z??"",creditSource:ie??"",creditSourceUrl:go??""},w.creditFor=w.target,E(w.credit),c.saveButton.click()},v=j("p","le-credit"),E=S=>{let z=(S?.credit??"").trim();v.textContent=z,v.hidden=z===""};E({credit:Ge(e,"data-edit-credit","editCredit")});let A=j("button","le-btn le-wide",t?"Replace background":"Replace image");if(A.type="button",A.addEventListener("click",()=>It(e,b,"Free photos",t?"background":"image")),m.append(A),p.hidden=!0,s.hidden=!0,k.append(n,v,m,p,s,g),w.target.startsWith("setting:")&&!t&&k.append(y("alt","Alt text",Ge(e,"alt","editAlt"),"Describes the image for search engines and screen readers."),y("imgTitle","Title attribute",Ge(e,"title","editTitle"),"Optional tooltip shown on hover.")),w.target.startsWith("setting:")){let S=document.createElement("button");S.type="button",S.textContent=t?"Remove background":"Remove image",S.className="le-btn-danger",S.addEventListener("click",async()=>{let z=t?"Remove this background image? The section keeps its layout and colour.":"Remove this image? The section keeps its layout; you can add a new image any time.";if(!window.confirm(z))return;let _=new FormData;_.append("target",w.target),_.append("remove","1"),await I("/live-edit/image",{method:"POST",body:_}),P("Removed \u2713")}),k.append(S)}ue(e)},Ft=e=>e?.closest?.("a[data-edit], a[data-edit-href]")??null,lo=e=>{let t=e?.getAttribute("href")??"";return t!==""&&t!=="#"&&!t.startsWith("javascript:")},he=null,it=!1,Je=null,st=()=>{Je&&(clearTimeout(Je),Je=null)},Rt=()=>{st(),Je=setTimeout(()=>{it||Be()},140)},co=e=>{if(e===he&&!V.classList.contains("hidden"))return;he=e;let t=e.getBoundingClientRect();V.style.top=`${t.top+window.scrollY-10}px`,V.style.left=`${t.right+window.scrollX-10}px`,V.classList.add("is-visible")},Be=()=>{V.classList.remove("is-visible"),he=null},Dt=e=>{if(!e?.closest)return null;let t=e.closest("[data-style-edit]");if(t)return{element:t,kind:"style"};let n=e.closest("[data-edit-img]");if(n)return{element:n,kind:"image"};let r=e.closest("[data-edit-icon]");if(r)return{element:r,kind:"icon"};let d=e.closest("[data-edit-svg]");if(d)return{element:d,kind:"svg"};let u=e.closest("[data-edit]");if(u)return{element:u,kind:"text"};let p=e.closest("[data-edit-href]:not([data-edit])");if(p)return{element:p,kind:"link"};let s=e.closest("[data-edit-bg]");if(s)return{element:s,kind:"image"};let h=e.closest("[data-style]:not([data-style-edit])");return h?{element:h,kind:"style"}:null},po=({element:e,kind:t})=>{t==="image"?rt(e):t==="icon"?so(e):t==="svg"?jt(e):t==="text"?We(e):t==="link"?nt(e):at(e)},lt=null,fe=()=>c.hoverBox.classList.remove("is-visible"),uo=e=>{let t=e.getBoundingClientRect();if(t.width<4||t.height<4){fe();return}Object.assign(c.hoverBox.style,{top:`${t.top}px`,left:`${t.left}px`,width:`${t.width}px`,height:`${t.height}px`}),c.hoverBox.classList.toggle("is-flipped",t.top<26),c.hoverLabel.textContent=e.dataset.editLabel??J(e),c.hoverBox.classList.add("is-visible")};document.addEventListener("pointermove",e=>{if(!document.body.classList.contains("editing")){fe();return}if(e.target===c.root||c.root.contains(e.target)){fe();return}lt||(lt=requestAnimationFrame(()=>{lt=null;let t=Dt(e.target);t?uo(t.element):fe()}))}),document.addEventListener("scroll",fe,!0),document.addEventListener("pointerleave",fe);let Ye=null,dt=()=>{Q.classList.remove("is-visible"),Ye=null},ho=e=>{Ye=e;let t=e.getBoundingClientRect();Q.style.top=`${Math.max(t.top,8)+8}px`,Q.style.left=`${t.left+8}px`,Q.classList.add("is-visible")};Q.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),Ye&&at(Ye),dt()}),document.addEventListener("pointerover",e=>{if(!document.body.classList.contains("editing"))return;let t=e.target.closest?.("[data-has-bg]");t&&ho(t);let n=Ft(e.target);n&&lo(n)&&(st(),co(n))}),document.addEventListener("pointerout",e=>{document.body.classList.contains("editing")&&e.relatedTarget!==V&&(Ft(e.relatedTarget)===he&&he||Rt())}),V.addEventListener("pointerenter",()=>{it=!0,st()}),V.addEventListener("pointerleave",()=>{it=!1,Rt()}),V.addEventListener("click",e=>{if(e.preventDefault(),e.stopPropagation(),!he)return;let t=he;t.dataset.edit!==void 0?We(t):nt(t),Be()}),document.addEventListener("click",e=>{if(!document.body.classList.contains("editing")||ot||e.target===c.root||c.root.contains(e.target)||e.target.closest("[data-live-create]"))return;let t=Dt(e.target);t&&(e.preventDefault(),e.stopPropagation(),po(t))},!0),document.addEventListener("keydown",e=>{if(e.key==="Escape"&&N.classList.contains("is-open")&&Ee(),!document.body.classList.contains("editing")||e.key!=="Enter"&&e.key!==" "||c.shadow.activeElement)return;let t=document.activeElement;t?.matches("[data-edit-img], [data-edit-bg]")?(e.preventDefault(),rt(t)):t?.matches("[data-edit]")&&!t.matches("button, a")&&(e.preventDefault(),We(t))}),ne?.addEventListener("click",()=>Se(!document.body.classList.contains("editing"))),c.changesButton?.addEventListener("click",()=>{document.body.classList.contains("editing")||Se(!0),Te("Changes"),et()});let qt=e=>{if(window.liveEditPublishing){e(window.liveEditPublishing);return}B().then(()=>window.liveEditPublishing&&e(window.liveEditPublishing))};qt(e=>{let t=e.pending??0,n=()=>{c.publishButton.hidden=!1,c.previewButton.hidden=!1,c.publishLabel.textContent=t>0?"Publish":"Published",c.publishCount.textContent=String(t),c.publishCount.hidden=t===0,c.publishButton.disabled=t===0,c.publishButton.title=t>0?`Put ${t} change${t===1?"":"s"} live`:"Nothing is waiting to be published"};n();let r=async()=>{let u=t===1?"":"s",p=e.domain??window.location.host,s=c.modal({title:`Publish ${t} change${u}`,subtitle:`They go live on ${p} right away.`,size:"is-narrow"});s.body.append(G("Loading\u2026"));let h=j("button","le-btn-outline","Keep editing");h.type="button",h.addEventListener("click",()=>s.close());let g=j("button","le-btn-publish","Publish now");g.type="button",s.foot.hidden=!1,s.foot.append(h,g),g.focus();try{let b=(await(await I("/live-edit/changes",{method:"GET"})).json())?.changes??[],v=j("div","le-review");b.forEach(E=>{let A=j("div","le-review-row");A.append(j("div","le-review-what",re(E)),j("div","le-review-to",ke(E.after)||"(empty)")),v.append(A)}),s.body.replaceChildren(b.length>0?v:G("Nothing is waiting."))}catch(y){s.body.replaceChildren(G(q(y,"list what is waiting")))}g.addEventListener("click",async()=>{g.disabled=!0,h.disabled=!0,g.textContent="Publishing\u2026",s.allowDismiss(!1);try{await I("/live-edit/publish",{method:"POST"}),t=0,n(),s.close(),P(`Live on ${p} \u2713`)}catch(y){s.allowDismiss(!0),g.disabled=!1,h.disabled=!1,g.textContent="Try again",s.body.replaceChildren(G(q(y,"publish that")))}})};c.publishButton.addEventListener("click",()=>{t!==0&&(document.activeElement?.blur?.(),r())});let d=()=>{let u=document.body.classList.contains("editing");Ee(!0),Se(!1),c.toolbar.style.display="none";let p=document.createElement("div");p.className="le-back";let s=null,h=v=>{if(v&&!s){s=document.createElement("div"),s.className="le-phone";let E=document.createElement("iframe"),A=new URL(window.location.href);A.searchParams.set("live-edit","off"),E.src=A.toString(),E.title="This page on a phone",s.append(E),c.shadow.append(s)}else!v&&s&&(s.remove(),s=null)},y=[["Desktop",!1],["Phone",!0]].map(([v,E])=>{let A=j("button","le-back-btn",v);return A.type="button",A.addEventListener("click",()=>{y.forEach(S=>S.classList.remove("is-on")),A.classList.add("is-on"),h(E)}),p.append(A),A});if(y[0].classList.add("is-on"),e.previewUrl){let v=j("button","le-back-btn","Copy a link to this");v.type="button",v.title="A link that shows this unpublished version to somebody else",v.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(e.previewUrl),c.toast("Link copied \u2713")}catch{window.prompt("Copy this link:",e.previewUrl)}}),p.append(v)}let m=j("button","le-back-btn","Back to editing");m.type="button",m.addEventListener("click",()=>{h(!1),p.remove(),document.removeEventListener("keydown",b,!0),c.toolbar.style.display="",Se(u)});let b=v=>{v.key==="Escape"&&m.click()};document.addEventListener("keydown",b,!0),p.append(m),c.shadow.append(p),m.focus()};c.previewButton.addEventListener("click",d)});let fo=()=>{let e=document.querySelectorAll('nav, [role="navigation"], header ul'),t=new Map,n=r=>r.closest("#wpadminbar, #adminmenu, #wp-toolbar, #live-edit-ui, [data-no-edit], [data-live-edit-chrome]")!==null;return e.forEach(r=>{n(r)||r.querySelectorAll("a[href]").forEach(d=>{if(n(d))return;let u;try{u=new URL(d.getAttribute("href"),window.location.href)}catch{return}if(u.origin!==window.location.origin||/\.(pdf|zip|jpe?g|png|gif|svg|webp|mp4|mp3)$/i.test(u.pathname)||u.pathname===window.location.pathname&&u.hash)return;let p=(d.textContent??"").replace(/\s+/g," ").trim();p===""||p.length>22||t.has(u.pathname)||t.set(u.pathname,{label:p,href:u.href})})}),[...t.values()].slice(0,6)};(()=>{let e=fo();if(e.length<2)return;let t=window.location.pathname.replace(/\/$/,"");e.forEach(n=>{let r=j("button","le-page-btn",n.label);r.type="button",r.title=n.href,new URL(n.href).pathname.replace(/\/$/,"")===t?r.classList.add("is-on"):r.addEventListener("click",()=>{sessionStorage.setItem("tb_editing","1"),window.location.href=n.href}),c.pageSwitcher.append(r)}),c.pageSwitcher.hidden=!1})();let _t=`live-edit:redo:${o?.site??window.location.host}`,ct=()=>{try{return JSON.parse(sessionStorage.getItem(_t)??"[]")}catch{return[]}},Mt=e=>{try{sessionStorage.setItem(_t,JSON.stringify(e.slice(-20)))}catch{}},Pe=()=>{c.undoButton.disabled=(window.liveEditPublishing?.pending??0)===0,c.redoButton.disabled=ct().length===0};qt(Pe),Pe();let Ut=async()=>{c.undoButton.disabled=!0;let e;try{e=((await(await I("/live-edit/changes",{method:"GET"})).json())?.changes??[])[0]}catch(n){c.toast(q(n,"undo that")),Pe();return}if(!e){c.toast("There is nothing left to undo. Everything is published."),Pe();return}let t=re(e);try{await I("/live-edit/changes",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:e.key,kind:e.kind})})}catch(n){c.toast(q(n,"undo that")),Pe();return}Mt([...ct(),{key:e.key,kind:e.kind,value:e.after,label:t}]),P(`Undone: ${t}`)},Ht=async()=>{let e=ct(),t=e.pop();if(!t){c.toast("There is nothing to put back.");return}c.redoButton.disabled=!0;try{if(t.kind==="style")throw new Error("A styling change cannot be put back automatically yet.");await I("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:t.key,value:t.value,locale:window.liveEditLocale})})}catch(n){c.toast(q(n,"put that back")),c.redoButton.disabled=!1;return}Mt(e),P(`Put back: ${t.label}`)};c.undoButton.addEventListener("click",()=>void Ut()),c.redoButton.addEventListener("click",()=>void Ht()),document.addEventListener("keydown",e=>{!(e.metaKey||e.ctrlKey)||e.key.toLowerCase()!=="z"||(c.shadow.activeElement??document.activeElement)?.closest?.('input, textarea, [contenteditable="true"]')||(e.preventDefault(),e.shiftKey?Ht():Ut())}),c.closeButton.addEventListener("click",()=>Ee()),c.cancelButton.addEventListener("click",()=>Ee()),c.saveButton.addEventListener("click",Mn),H?.addEventListener("click",async()=>{!w||w.kind!=="record"||window.confirm("Delete this item?")&&(await I(`/live-edit/record/${w.type}/${w.id}`,{method:"DELETE"}),P("Deleted \u2713"))}),document.querySelectorAll("[data-live-create]").forEach(e=>{e.addEventListener("click",async()=>{await I("/live-edit/record/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:e.dataset.liveCreate})}),P("Added \u2713 \u2014 click it to edit")})});let pt=new URLSearchParams(window.location.search);if(pt.has("edit")){pt.delete("edit");let e=pt.toString();window.history.replaceState(null,"",window.location.pathname+(e?`?${e}`:"")),Se(!0)}else Se(sessionStorage.getItem("tb_editing")==="1")}};window.liveEditDisplayedValue=o=>bt({editValue:o.dataset.editValue,ownText:se(o),fullText:o.textContent});var Tt=(()=>{let o=!1;return()=>{o||new URLSearchParams(window.location.search).get("live-edit")!=="off"&&(o=!0,Do())}})();document.readyState==="complete"?Tt():(window.addEventListener("load",Tt,{once:!0}),window.setTimeout(Tt,2e3));
