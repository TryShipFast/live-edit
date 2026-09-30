var yo=Object.defineProperty;var De=(o,a)=>()=>(o&&(a=o(o=0)),a);var wt=(o,a)=>{for(var r in a)yo(o,r,{get:a[r],enumerable:!0})};var Zt,en,tn,Lo,nn,on,xt,ce,an,rn,sn,Xe,Ao,Qe,kt=De(()=>{Zt=o=>{let[a,...r]=String(o??"").split(":");return{kind:a,key:r.join(":"),parts:r}},en=(o,a={})=>({...a,headers:{"X-CSRF-TOKEN":o,Accept:"application/json",...a.headers??{}}}),tn=o=>(o?.headers?.get?.("content-type")??"").includes("json"),Lo=/\.((?:fa|fas|far|fab|fal|fad|bi|ti|icon|flaticon|glyphicon|ion|mdi)-[a-z0-9][a-z0-9-]*)::?before/gi,nn=o=>{let a=[];for(let r of String(o??"").split("}")){let s=r.indexOf("{");if(s===-1)continue;let g=r.slice(s+1).match(/content\s*:\s*(["'])(.*?)\1/);if(!g)continue;let d=g[2].match(/^\\([0-9a-f]{1,6})\s*$/i),m=d?String.fromCodePoint(parseInt(d[1],16)):g[2];if([...m].length===1)for(let k of r.slice(0,s).matchAll(Lo))a.push({name:k[1],glyph:m})}return a},on=(o,a,r,s,g)=>{let d=o.filter(m=>m!==r&&!s.includes(m));return g.forEach(m=>d.includes(m)||d.push(m)),d.push(a),d.join(" ")},xt=({editValue:o,ownText:a,fullText:r})=>(o??"")!==""?o:(a??"").trim()!==""?a:r??"",ce=o=>o.children.length?[...o.childNodes].filter(a=>a.nodeType===3).map(a=>a.textContent).join(""):o.textContent,an=o=>{let a=new Set,r=[];for(let s of o)for(let g of s.icons)a.has(g.name)||(a.add(g.name),r.push({...g,face:s.face,variant:s.variant}));return r.sort((s,g)=>s.name.localeCompare(g.name))},rn=(o,a)=>{let r=Object.keys(a??{}),s=String(o??"").split(",").map(g=>g.trim()).filter(Boolean);return s.length===0?r:r.length===0?s:s.filter(g=>r.includes(g))},sn=(o,a={},r)=>{let s=String(r?.base??"").replace(/\/$/,""),[g,d]=String(o).split("?"),m={"/live-edit/setting":`${s}/${r?.site}/content`,"/live-edit/style":`${s}/${r?.site}/styles`,"/live-edit/publish":`${s}/${r?.site}/publish`,"/live-edit/image":`${s}/${r?.site}/media`,"/live-edit/upload":`${s}/${r?.site}/media`,"/live-edit/changes":`${s}/${r?.site}/changes`,"/live-edit/versions":`${s}/${r?.site}/versions`,"/live-edit/content":`${s}/${r?.site}/content`,"/live-edit/translations":`${s}/${r?.site}/translations`,"/live-edit/credits":`${s}/${r?.site}/credits`,"/live-edit/assist":`${s}/${r?.site}/assist`,"/live-edit/photos":`${s}/${r?.site}/photos`,"/live-edit/photos/used":`${s}/${r?.site}/photos/used`,"/live-edit/imagine":`${s}/${r?.site}/imagine`},k=r?.routes?.[g]??(g==="/live-edit/publish"?r?.publishUrl:null);if(k)return{url:d?`${k}?${d}`:k,init:{...a,headers:{...a.headers??{},...r.routeHeaders??r.publishHeaders??{},Accept:"application/json"},credentials:"same-origin"}};let L=m[g];if(!s||!r?.site||!r?.token)throw new Error("The content API is not configured on this page.");if(!L)throw new Error(`Editing that is not available over the content API yet (${g}).`);return{url:d?`${L}?${d}`:L,init:{...a,headers:{...a.headers??{},Authorization:`Bearer ${r.token}`,Accept:"application/json"}}}},Xe=(o,a,r)=>o.hasAttribute(a)?o.getAttribute(a):o.dataset?.[r]??"",Ao=(o,a)=>a==null?!0:a===408||a===425||a===429||a>=500,Qe=async(o,{tries:a=3,waits:r=[200,500],sleep:s=null}={})=>{let g=s??(m=>new Promise(k=>setTimeout(k,m))),d=null;for(let m=0;m<a;m++)try{return await o()}catch(k){if(d=k,m===a-1||!Ao(k,k.status))throw k;await g(r[Math.min(m,r.length-1)])}throw d}});var St={};wt(St,{applyTags:()=>Et,autoTag:()=>Ze,elementAt:()=>dn,ensureBackgroundsAreFound:()=>Oo,fingerprint:()=>ln,refreshBackgrounds:()=>Po,resolveBackgrounds:()=>Ct,watchForLateBackgrounds:()=>un});var To,ln,dn,Et,No,$o,cn,pn,Ct,Oo,Po,un,Ze,Lt=De(()=>{To="kb_tags_",ln=o=>{let a=2166136261;for(let r=0;r<o.length;r++)a^=o.charCodeAt(r),a=Math.imul(a,16777619);return(a>>>0).toString(16)},dn=(o,a)=>{let r=o.documentElement;for(let s of a)if(r=[...r?.children??[]][s],!r)return null;return r},Et=(o,a)=>{let r=0;for(let{at:s,attributes:g}of a??[]){let d=dn(o,s);if(d){for(let[m,k]of Object.entries(g))d.hasAttribute(m)||d.setAttribute(m,k);r++}}return r},No=o=>{try{return JSON.parse(window.sessionStorage?.getItem(o)??"null")}catch{return null}},$o=(o,a)=>{try{window.sessionStorage?.setItem(o,JSON.stringify(a))}catch{}},cn=o=>o.hasAttribute("data-kb-bg")||o.hasAttribute("data-background")||o.hasAttribute("data-bg")||o.hasAttribute("data-background-image")||/background-image|url\(/i.test(o.getAttribute("style")??""),pn=(o,a)=>{if(cn(o))return!1;let r=a.getComputedStyle(o).backgroundImage;if(!r||r==="none"||!r.includes("url("))return!1;let s=r.match(/url\(\s*["']?([^"')]+)/)?.[1];return!s||s.startsWith("data:")?!1:(o.setAttribute("data-kb-bg",s),!0)},Ct=(o=document)=>{let a=o.defaultView??window;if(!a?.getComputedStyle)return 0;let r=0;for(let s of o.querySelectorAll("body *"))pn(s,a)&&r++;return r},Oo=async(o,a=document)=>{let r=a.defaultView??window;if(r.liveEditBackgroundsWatched)return 0;r.liveEditBackgroundsWatched=!0;let s=await Ze(o,a);return un(a,()=>{Ze(o,a).catch(g=>{console.warn("[live-edit] could not tag a late background:",g.message)})}),s},Po=async(o,a=document)=>Ct(a)===0&&a.querySelector("[data-kb-bg]:not([data-edit-bg])")===null?0:Ze(o,a),un=(o=document,a=()=>{})=>{let r=o.defaultView??window;if(!r?.IntersectionObserver||!r.getComputedStyle)return null;let s=new Set,g=null,d=()=>{if(g=null,s.size===0)return;let N=[...s];s.clear(),a(N)},m=5,k=new WeakMap,L=N=>{if(pn(N,r))return s.add(N),O.unobserve(N),g||(g=r.setTimeout(d,250)),!0;let K=(k.get(N)??0)+1;return k.set(N,K),K>=m&&O.unobserve(N),!1},O=new r.IntersectionObserver(N=>{for(let K of N){if(!K.isIntersecting)continue;let U=K.target;L(U)||r.setTimeout(()=>L(U),400)}},{rootMargin:"300px"}),R=[...o.querySelectorAll("body *")].filter(N=>!cn(N)),$=4e3;return R.length>$&&console.warn(`[live-edit] watching the first ${$} of ${R.length} elements for late backgrounds`),R.slice(0,$).forEach(N=>O.observe(N)),O},Ze=async({base:o,site:a,key:r,page:s},g=document)=>{let d=g.querySelector("[data-edit], [data-edit-img]")!==null;if(Ct(g),d&&!(g.querySelector("[data-kb-bg]:not([data-edit-bg])")!==null))return 0;let k=g.documentElement.outerHTML,L=To+ln(k),O=No(L);if(O)return Et(g,O);let R=await fetch(`${String(o).replace(/\/$/,"")}/${a}/tag`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json",Authorization:`Bearer ${r}`},body:JSON.stringify({html:k,page:s??g.location?.pathname??""})});if(!R.ok)throw new Error(`Tagging answered ${R.status}`);let{elements:$}=await R.json();return $o(L,$),Et(g,$)}});var Io,Bo,jo,hn,gn,fn=De(()=>{Io=new Set(["svg","g","defs","symbol","use","title","desc","path","circle","ellipse","line","polygon","polyline","rect","text","tspan","textpath","lineargradient","radialgradient","stop","clippath","mask","pattern"]),Bo=new Set(["viewbox","xmlns","width","height","fill","fill-rule","fill-opacity","stroke","stroke-width","stroke-linecap","stroke-linejoin","stroke-dasharray","stroke-dashoffset","stroke-opacity","stroke-miterlimit","opacity","d","points","x","y","x1","y1","x2","y2","cx","cy","r","rx","ry","transform","offset","stop-color","stop-opacity","gradientunits","gradienttransform","patternunits","clip-rule","clip-path","mask","id","class","role","aria-label","aria-hidden","focusable","preserveaspectratio","vector-effect","text-anchor","font-size","font-family"]),jo=8,hn=o=>{let a=String(o??"").trim();if(a===""||!/<svg/i.test(a))return null;let r=new DOMParser().parseFromString(a,"image/svg+xml"),s=r.documentElement;return!s||s.tagName?.toLowerCase()!=="svg"||r.querySelector("parsererror")||(gn(s),s.children.length===0&&s.textContent.trim()==="")?null:s},gn=o=>{for(let a of[...o.childNodes]){if(a.nodeType===jo){a.remove();continue}if(a.nodeType===1){if(!Io.has(a.tagName.toLowerCase())){a.remove();continue}gn(a)}}for(let a of[...o.attributes]){let r=a.name.toLowerCase(),s=a.value,d=r==="href"||r==="xlink:href"?s.trim().startsWith("#"):Bo.has(r);d&&/url\(/i.test(s)&&!/^url\(\s*#/i.test(s.trim())&&(d=!1),d||o.removeAttribute(a.name)}}});var et={};wt(et,{applyBackground:()=>xn,applyContent:()=>En,applyIcon:()=>vn,applyOrder:()=>kn,applyStyles:()=>Ln,applySvg:()=>yn,applyValue:()=>Tt,defendContent:()=>Cn,fetchContent:()=>Tn,fetchSnapshot:()=>An,resolve:()=>Nn,styleRules:()=>Sn});var At,bn,Tt,zo,Nt,Ro,Fo,Do,mn,qo,yn,vn,xn,kn,En,Cn,Sn,Ln,An,Tn,wn,Mo,Nn,tt=De(()=>{fn();kt();At=(o,a)=>Object.assign(new Error(o),{status:a}),bn="setting:",Tt=(o,a,{keepRuns:r=!1}={})=>{let s=o.tagName?.toLowerCase();if(s==="img"){o.setAttribute("src",a),zo(o);return}if(s==="source"){o.setAttribute("srcset",a);return}Nt(o,a,r)},zo=o=>{if(o.removeAttribute("srcset"),o.removeAttribute("sizes"),o.parentElement?.tagName==="PICTURE")for(let a of[...o.parentElement.children])a.tagName==="SOURCE"&&a.remove()},Nt=(o,a,r=!1)=>{let s=[...o.childNodes].filter(F=>F.nodeType===qo);if(s.length===0){let F=[...o.children];if(F.length===1&&F[0].children.length===0){Nt(F[0],a);return}o.append(a);return}if(s.length===1){mn(s[0],a);return}let g=s.map(F=>F.nodeValue),d=g.join(""),m=0;for(;m<d.length&&m<a.length&&d[m]===a[m];)m+=1;let k=0;for(;k<d.length-m&&k<a.length-m&&d[d.length-1-k]===a[a.length-1-k];)k+=1;let L=m,O=d.length-k,R=a.slice(m,a.length-k),$=0,N=!1,K=g.map(F=>{let E=$,M=$+F.length;return $=M,N||L<E||O>M?F:(N=!0,F.slice(0,L-E)+R+F.slice(O-E))});if(N){s.forEach((F,E)=>{F.nodeValue=K[E]});return}let U=Do(g,a);if(U!==null){s.forEach((F,E)=>{F.nodeValue=U[E]});return}mn(s[0],a),s.slice(1).forEach(F=>{if(r){F.nodeValue="";return}F.remove()})},Ro=(o,a)=>{let r=o.length,s=a.length,g=s+1,d=new Int32Array((r+1)*g);for(let k=r-1;k>=0;k-=1)for(let L=s-1;L>=0;L-=1)d[k*g+L]=o[k]===a[L]?d[(k+1)*g+L+1]+1:Math.max(d[(k+1)*g+L],d[k*g+L+1]);let m=[];for(let k=0,L=0;k<r&&L<s;)o[k]===a[L]?(m.push([k,L]),k+=1,L+=1):d[(k+1)*g+L]>=d[k*g+L+1]?k+=1:L+=1;return m},Fo=(o,a)=>{let r=new Map(o.map(([g,d])=>[g,d])),s=g=>{let d=0;for(let m=g<0?a-1:a;r.has(m);m+=g){let k=r.get(m+g);if(d+=1,k===void 0||Math.abs(k-r.get(m))!==1)break}return d};return Math.max(s(-1),s(1))},Do=(o,a)=>{let r=o.join("");if(r.length===0||a.length===0||r.length*a.length>25e4)return null;let s=Ro(r,a),g=new Map(s.map(([L,O])=>[L,O])),d=[],m=0,k=0;for(let L of o.slice(0,-1)){if(k+=L.length,Fo(s,k)<3)return null;let O=m;for(let R=k-1;R>=0;R-=1)if(g.has(R)){O=Math.max(m,g.get(R)+1);break}d.push(a.slice(m,O)),m=O}return d.push(a.slice(m)),d},mn=(o,a)=>{let r=o.nodeValue,s=/^\s/.test(r)&&!/^\s/.test(a)?" ":"",g=/\s$/.test(r)&&!/\s$/.test(a)?" ":"";o.nodeValue=s+a+g},qo=3,yn=(o,a)=>{let r=hn(a);if(!r)return!1;let s=document.importNode(r,!0);for(let g of["class","width","height","style","data-edit-svg","data-edit-label"])o.hasAttribute(g)&&s.setAttribute(g,o.getAttribute(g));return o.replaceWith(s),!0},vn=(o,a)=>{let r=String(a).replace(/[^A-Za-z0-9_\- ]/g,"").split(/\s+/).filter(Boolean),s=o.getAttribute("data-edit-icon-current");if(r.length===0||!s)return!1;let g=r.length===1?(o.getAttribute("class")??"").trim().split(/\s+/).map(d=>d===s?r[0]:d):r;return o.setAttribute("class",g.join(" ")),o.setAttribute("data-edit-icon-current",r.length===1?r[0]:r[r.length-1]),!0},xn=(o,a)=>{for(let s of["data-background","data-bg","data-background-image"])o.hasAttribute(s)&&o.setAttribute(s,a);let r=(o.getAttribute("style")??"").replace(/background-image\s*:[^;]*;?/gi,"").trim();o.setAttribute("style",`${r?r.replace(/;?$/,";"):""}background-image:url('${a}')`)},kn=(o,a)=>{let r=0;for(let s of o.querySelectorAll("[data-edit-list]")){let g=s.getAttribute("data-edit-list");if(!Object.hasOwn(a,g))continue;let d;try{d=JSON.parse(a[g])}catch{continue}if(!Array.isArray(d)||d.length===0)continue;let m=new Map;for(let L of[...s.children])L.hasAttribute("data-edit-item")&&(m.set(L.getAttribute("data-edit-item"),L),s.removeChild(L));if(m.size===0)continue;let k=m.values().next().value;for(let L of d){let O=m.get(String(L));if(O){s.appendChild(O);continue}let R=k.cloneNode(!0);R.setAttribute("data-edit-item",String(L)),s.appendChild(R)}r++}return r},En=(o,a)=>{let r=0;kn(o,a);for(let s of o.querySelectorAll("[data-edit]")){let g=s.getAttribute("data-edit")??"";if(!g.startsWith(bn))continue;let d=g.slice(bn.length);Object.hasOwn(a,d)&&(Tt(s,a[d]),r++)}for(let s of o.querySelectorAll("[data-edit-img]")){let g=(s.getAttribute("data-edit-img")??"").replace(/^setting:/,"");Object.hasOwn(a,g)&&(Tt(s,a[g]),a[g]?s.dataset.editPreview=a[g]:delete s.dataset.editPreview,r++);for(let[d,m]of[["Alt","alt"],["Title","title"],["Srcset","srcset"]])if(Object.hasOwn(a,g+d)){let k=a[g+d];k===""&&m!=="alt"?s.removeAttribute(m):s.setAttribute(m,k),r++}}for(let s of o.querySelectorAll("[data-edit-svg]")){let g=(s.getAttribute("data-edit-svg")??"").replace(/^setting:/,""),d=a[g];!Object.hasOwn(a,g)||String(d??"").trim()===""||yn(s,d)&&r++}for(let s of o.querySelectorAll("[data-edit-icon]")){let g=(s.getAttribute("data-edit-icon")??"").replace(/^setting:/,""),d=a[g];!Object.hasOwn(a,g)||d===""||vn(s,d)&&r++}for(let s of o.querySelectorAll("[data-edit-bg]")){let g=(s.getAttribute("data-edit-bg")??"").replace(/^setting:/,""),d=a[g];!Object.hasOwn(a,g)||d===""||(xn(s,d),r++)}for(let s of o.querySelectorAll("[data-edit-href]")){let g=s.getAttribute("data-edit-href");Object.hasOwn(a,g)&&(s.setAttribute("href",a[g]),r++)}return r},Cn=(o,{limit:a=12,debounce:r=60}={})=>{let s=o.defaultView??(typeof window>"u"?null:window);if(!s?.MutationObserver)return null;let g=o.querySelectorAll("[data-edit], [data-edit-img], [data-edit-href]");if(g.length===0)return null;let d=new Map;for(let $ of g)d.set($,{words:$.hasAttribute("data-edit")?ce($):null,src:$.getAttribute("src"),href:$.hasAttribute("data-edit-href")?$.getAttribute("href"):null});let m=0,k=!1,L=null,O=()=>{if(L=null,!o.body?.classList?.contains("editing")){m++,k=!0;for(let[$,N]of d)$.isConnected&&(N.words!==null&&ce($)!==N.words&&Nt($,N.words),N.src!==null&&$.getAttribute("src")!==N.src&&($.setAttribute("src",N.src),$.removeAttribute("srcset")),N.href!==null&&$.getAttribute("href")!==N.href&&$.setAttribute("href",N.href));R.takeRecords(),k=!1,m>=a&&(R.disconnect(),console.warn(`[live-edit] this page keeps rewriting itself; the client's content was put back ${m} times and is now being left alone.`))}},R=new s.MutationObserver(()=>{k||L||m>=a||(L=s.setTimeout(O,r))});for(let $ of g)R.observe($,{characterData:!0,childList:!0,subtree:!0,attributes:!0,attributeFilter:["src","srcset","href"]});return R},Sn=(o,a)=>{let r=`[data-style="${o}"]`,s="",g="";for(let[d,m]of Object.entries(a??{}))if(!(m===""||m===null||m===void 0)){if(d==="hidden"){s+=`body:not(.editing) ${r}{display:none !important}`,s+=`body.editing ${r}{opacity:.45}`;continue}g+={backgroundImage:`background-image:url('${m}') !important;background-size:cover !important;background-position:center !important;`,background:`background:${m} !important;`,textColor:`color:${m} !important;`,fontSize:`font-size:${m}px !important;`,radius:`border-radius:${m}px !important;`,paddingX:`padding-left:${m}px !important;padding-right:${m}px !important;`,paddingY:`padding-top:${m}px !important;padding-bottom:${m}px !important;`}[d]??""}return g===""?s:s+`${r}{${g}}`},Ln=(o,a)=>{let r=Object.entries(a??{}).map(([m,k])=>Sn(m,k)).join("");if(r==="")return 0;let s="live-edit-styles",g=o.getElementById?.(s)??o.querySelector?.(`#${s}`)??null,d=g??o.createElement("style");return d.id=s,d.textContent=r,g||(o.head??o.body)?.appendChild(d),Object.keys(a).length},An=async({snapshot:o,locale:a})=>{let r=String(o).replace(/\/$/,""),s=await Qe(()=>fetch(`${r}/current.json`).then(d=>{if(!d.ok)throw At(`Pointer answered ${d.status}`,d.status);return d.json()}));if(!s.version)return{settings:{},styles:{}};let g=a??"en";return Qe(async()=>{let d=await fetch(`${r}/v${s.version}/${g}.json`);if(!d.ok)throw At(`Version answered ${d.status}`,d.status);return d.json()})},Tn=async({base:o,site:a,key:r,locale:s})=>{let g=`${String(o).replace(/\/$/,"")}/${a}/content${s?`?locale=${encodeURIComponent(s)}`:""}`;return Qe(async()=>{let d=await fetch(g,{headers:{Authorization:`Bearer ${r}`,Accept:"application/json"}});if(!d.ok)throw At(`Content service answered ${d.status}`,d.status);return d.json()})},wn=async()=>{let o=typeof window<"u"?window.liveEditContent:null;if(!o)return;let a=null,r=null;try{let s=await Nn(o);s&&(s.styleProps&&(window.liveEditStyleProps=s.styleProps),typeof s.pending=="number"&&s.styleProps&&(window.liveEditPublishing={...window.liveEditPublishing??{},pending:s.pending}),a=En(document,s.settings??{}),Ln(document,s.styles??{}),window.liveEditStyles=s.styles??{},Cn(document))}catch(s){r=s,console.warn("[live-edit] serving the words already in the page:",s.message)}Mo({applied:a,failed:r?r.message:null})},Mo=o=>{window.liveEditContentDone=o,document.dispatchEvent(new CustomEvent("live-edit:content",{detail:o}))},Nn=async o=>{if(o.snapshot)try{return await An(o)}catch(a){let r=a.message.includes("fetch")?" (if the files are on another origin, the bucket or CDN must allow cross-origin reads)":"";if(!o.base)throw new Error(a.message+r);console.warn("[live-edit] falling back to the content API:",a.message+r)}return o.base&&o.site&&o.key?Tn(o):null};typeof document<"u"&&(document.readyState==="loading"?document.addEventListener("DOMContentLoaded",wn):wn())});var Bn={};wt(Bn,{collectFromFragment:()=>On,contentConfigFor:()=>Wo,currentSession:()=>Ho,forget:()=>Uo,requestLink:()=>_o,store:()=>Pn,stored:()=>In});var $t,$n,On,Pn,In,Uo,_o,Ho,Wo,jn=De(()=>{$t="kb_session",$n="kb_session=",On=(o=window)=>{let a=o.location?.hash??"",r=a.indexOf($n);if(r===-1)return null;let s=decodeURIComponent(a.slice(r+$n.length).split("&")[0]);if(s==="")return null;Pn(s,o);let g=a.slice(0,r).replace(/[#&]$/,"");return o.history?.replaceState?.(null,"",o.location.pathname+o.location.search+g),s},Pn=(o,a=window)=>{try{a.sessionStorage?.setItem($t,o)}catch{}},In=(o=window)=>{try{return o.sessionStorage?.getItem($t)??null}catch{return null}},Uo=(o=window)=>{try{o.sessionStorage?.removeItem($t)}catch{}},_o=async({base:o,site:a},r,s=window)=>(await fetch(`${String(o).replace(/\/$/,"")}/sign-in`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({site:a,email:r,return_to:s.location.origin+s.location.pathname})})).ok,Ho=(o=window)=>On(o)??In(o),Wo=(o,a)=>{let r={base:o.api,site:o.site,locale:o.locale??null};return a?{...r,key:a,snapshot:null}:{...r,key:o.key,snapshot:o.snapshot??null}}});var vo=`
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
`,xo=`
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
`,S=(o,a,r)=>{let s=document.createElement(o);return a&&(s.className=a),r!==void 0&&(s.textContent=r),s};function Gt(){let o=document.createElement("style");o.id="live-edit-page-css",o.textContent=xo,document.head.append(o);let a=document.createElement("div");a.id="live-edit-ui",document.body.append(a);let r=a.attachShadow({mode:"open"}),s=document.createElement("style");s.textContent=vo,r.append(s);let g=window.liveEditToolbar??{},d=S("div","le-toolbar"),m=window.liveEditEditor?.console??null,k=S(m?"a":"span","le-mark");k.innerHTML='<svg width="16" height="16" viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="3" width="20" height="20" rx="3" fill="none" stroke="#0B0C0F" stroke-width="2.5"/><path d="M16 15 L16 30 L19.6 26.4 L22.2 31.2 L24.6 30 L22 25.3 L27 25.3 Z" fill="#3148F5" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>',m&&(k.href=m,k.target="_blank",k.rel="noopener",k.title="Your dashboard: licence, editors, settings",k.setAttribute("aria-label","Open your dashboard"));let L=S("span","le-status le-when-roomy"),O=S("span","le-dot"),R=S("span",null,"");L.append(O,R),d.append(k,L);let $=window.liveEditEditor??null;if($?.greeting){let I=S("span","le-hello le-when-roomy","Welcome "+$.greeting);d.append(I)}let N=null,K=g.locales??{};Object.keys(K).length>1&&(N=S("select","le-locale"),N.title="Language you are editing",Object.entries(K).forEach(([I,D])=>{let H=S("option",null,D);H.value=I,H.selected=I===(g.locale??"en"),N.append(H)}),N.addEventListener("change",()=>{window.location.search="?locale="+N.value}),d.append(N));let U=S("button","le-bar-btn","Edit site");U.type="button";let F=I=>'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"'+(I?' style="transform: scaleX(-1)"':"")+'><path d="M9 14 4 9l5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 9h7a6 6 0 0 1 0 12H8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',E=S("button","le-round");E.type="button",E.title="Undo the last change you have not published",E.setAttribute("aria-label","Undo"),E.innerHTML=F(!1);let M=S("button","le-round");M.type="button",M.title="Put back what you just undid",M.setAttribute("aria-label","Redo"),M.innerHTML=F(!0);let ae=S("div","le-pages");ae.hidden=!0,ae.setAttribute("role","group"),ae.setAttribute("aria-label","Pages");let ie=S("select","le-lang");ie.hidden=!0,ie.title="Which language you are editing",ie.setAttribute("aria-label","Language");let Y=S("button","le-bar-btn le-when-roomy","Changes");Y.type="button",Y.title="Everything you have changed and not published";let Q=S("button","le-bar-btn le-when-roomy","Preview");Q.type="button",Q.title="See the page the way a visitor will",Q.hidden=!0;let v=S("button","le-publish");v.type="button",v.title="Put your changes live",v.hidden=!0;let me=S("span",null,"Publish"),X=S("span","le-publish-count");if(X.hidden=!0,v.append(me,X),d.append(S("span","le-sep"),U,E,M,S("span","le-sep"),ae,ie,Y,Q,v),(g.links??[]).forEach(I=>{let D=S("a","le-btn-ghost",I.label);D.href=I.href,I.title&&(D.title=I.title),d.append(D)}),g.logout?.href)if((g.logout.method??"get").toLowerCase()==="post"){let I=document.createElement("form");I.method="POST",I.action=g.logout.href;let D=document.createElement("input");D.type="hidden",D.name="_token",D.value=document.body.dataset.csrf??"";let H=S("button","le-btn-ghost","Log out");H.type="submit",I.append(D,H),d.append(I)}else{let I=S("a","le-btn-ghost","Log out");I.href=g.logout.href,d.append(I)}let re=S("div","le-drawer");re.setAttribute("role","dialog"),re.setAttribute("aria-modal","true"),re.setAttribute("aria-label","Edit content");let we=S("div","le-drawer-head"),$e=S("div","le-tabs");$e.setAttribute("role","tablist");let Oe={};["Edit","Changes","History"].forEach(I=>{let D=S("button","le-tab",I);D.type="button",D.dataset.tab=I,D.setAttribute("role","tab"),I==="Edit"&&D.classList.add("is-on"),Oe[I]=D,$e.append(D)});let ye=S("button","le-close","\xD7");ye.type="button",ye.setAttribute("aria-label","Close"),we.append($e,ye);let Pe=S("div","le-subject"),qe=S("div","le-trail"),Me=S("div","le-title","Text");Pe.append(S("div","le-eyebrow","Selected"),qe,Me);let ve=S("div","le-fields"),Ie=S("div","le-foot"),xe=S("button","le-btn-danger le-start le-hidden","Delete");xe.type="button";let ke=S("button","le-btn-outline","Cancel");ke.type="button";let Ee=S("button","le-btn","Save changes");Ee.type="button",Ie.append(xe,ke,Ee),re.append(we,Pe,ve,Ie);let Z=S("button","le-handle");Z.type="button",Z.setAttribute("aria-label","Edit this link"),Z.innerHTML="&#9998;";let ne=S("button","le-handle le-handle-bg");ne.type="button",ne.setAttribute("aria-label","Replace this background image"),ne.title="Replace background image",ne.textContent="Replace background";let pe=S("div","le-hover"),Be=S("span","le-hover-label");return pe.append(Be),r.append(d,re,Z,ne,pe),{root:a,shadow:r,toolbar:d,toggleButton:U,undoButton:E,redoButton:M,pageSwitcher:ae,languagePicker:ie,statusText:R,dot:O,localeSelect:N,drawer:re,drawerFoot:Ie,drawerTabs:Oe,drawerSubject:Pe,drawerTitle:Me,drawerTrail:qe,drawerFields:ve,drawerDelete:xe,publishButton:v,publishLabel:me,publishCount:X,previewButton:Q,changesButton:Y,closeButton:ye,cancelButton:ke,saveButton:Ee,linkHandle:Z,bgHandle:ne,hoverBox:pe,hoverLabel:Be,toast:(I,D=1800)=>{let H=S("div","le-toast",I);r.append(H),setTimeout(()=>H.style.opacity="0",D),setTimeout(()=>H.remove(),D+600)},modal:({title:I,subtitle:D,size:H="",dismissable:V=!0}={})=>{let W=S("div","le-scrim"),se=S("div",`le-modal ${H}`.trim());se.setAttribute("role","dialog"),se.setAttribute("aria-modal","true");let Ue=S("div","le-modal-heading"),_e=S("div","le-modal-title",I??""),Ce=S("div","le-modal-sub",D??"");Ce.hidden=!D,Ue.append(_e,Ce),se.setAttribute("aria-label",I??"Dialog");let le=S("button","le-close","\xD7");le.type="button",le.setAttribute("aria-label","Close");let He=S("div","le-modal-head");He.append(Ue,le);let je=S("div","le-modal-tabs");je.hidden=!0;let We=S("div","le-modal-body"),ue=S("div","le-modal-foot");ue.hidden=!0,se.append(He,je,We,ue),W.append(se);let at=document.activeElement,Ve=!1,de=()=>{Ve||(Ve=!0,document.removeEventListener("keydown",Se,!0),W.remove(),at?.focus?.(),Le.dismissable=!0)},Se=J=>{J.key==="Escape"&&Le.dismissable&&(J.stopPropagation(),de())},Le={dismissable:V};return le.addEventListener("click",de),W.addEventListener("mousedown",J=>{J.target===W&&Le.dismissable&&de()}),document.addEventListener("keydown",Se,!0),r.append(W),le.focus(),{card:se,body:We,foot:ue,tabs:je,close:de,title:J=>_e.textContent=J,subtitle:J=>{Ce.textContent=J??"",Ce.hidden=!J},allowDismiss:J=>{Le.dismissable=J,le.hidden=!J}}}}}var vt="kb_verify",Kt=(o,a=globalThis)=>{try{a.sessionStorage?.setItem(vt,JSON.stringify(o))}catch{}},Xt=(o=globalThis)=>{try{let a=o.sessionStorage?.getItem(vt);return o.sessionStorage?.removeItem(vt),a?JSON.parse(a):null}catch{return null}},ko=(o,a)=>!a?.attr||!a?.marker?null:o.querySelector(`[${a.attr}="${a.marker.replace(/"/g,'\\"')}"]`),Eo=(o,a)=>{if(!o)return null;if(a==="image"){let s=Co(o);return s?s.getAttribute("src"):null}if(a==="href")return o.getAttribute("href");if(a==="icon")return o.getAttribute("class")??"";let r=[...o.childNodes].filter(s=>s.nodeType===3).map(s=>s.textContent).join(" ").trim();return oe(r===""?o.textContent:r)},Co=o=>o.tagName?.toLowerCase()==="img"?o:o.querySelector("img")??o.parentElement?.querySelector("img")??null,oe=o=>String(o??"").replace(/\s+/g," ").trim(),So=(o,a,r)=>{if(r===null)return!1;if(o==="image")return yt(r)!==""&&yt(r)===yt(a);if(o==="icon"){let s=oe(a).split(" ").filter(Boolean),g=oe(r).split(" ").filter(Boolean);return s.length>0&&s.every(d=>g.includes(d))}return o==="href"?oe(r)===oe(a)||oe(r).endsWith(oe(a)):oe(r)===oe(a)},yt=o=>String(o??"").split(/[?#]/)[0].split("/").filter(Boolean).pop()??"",Qt=(o,a)=>{if(!a?.kind)return null;let r=ko(o,a);if(!r)return null;let s=Eo(r,a.kind);return{ok:So(a.kind,a.value,s),wanted:a.value,saw:s,kind:a.kind}};kt();var Vo=()=>{let o=window.liveEditApi;o?.base&&o?.site&&Promise.resolve().then(()=>(Lt(),St)).then(r=>r.ensureBackgroundsAreFound({base:o.base,site:o.site,key:o.token})).catch(r=>console.warn("[live-edit] could not look for backgrounds:",r.message)),window.liveEditContent||Promise.resolve().then(()=>(tt(),et)).then(r=>r.defendContent(document)).catch(r=>console.warn("[live-edit] could not guard this page's content:",r.message));let a=document.querySelector("[data-login-modal]");if(a){let r=()=>{a.classList.remove("hidden"),a.classList.add("flex"),a.querySelector("input[type=email]")?.focus()},s=()=>{a.classList.add("hidden"),a.classList.remove("flex")};document.querySelectorAll("[data-login-open]").forEach(g=>{g.addEventListener("click",d=>{d.preventDefault(),r()})}),a.querySelector("[data-login-close]")?.addEventListener("click",s),a.addEventListener("click",g=>{g.target===a&&s()}),a.dataset.error==="1"&&r()}if(document.body.hasAttribute("data-admin")){let r=document.body.dataset.csrf,s=()=>{sessionStorage.setItem("tb_scroll",String(window.scrollY)),window.location.reload()},g=sessionStorage.getItem("tb_scroll");g!==null&&(sessionStorage.removeItem("tb_scroll"),window.scrollTo(0,Number(g)));let d=Gt(),m=e=>d.toast(String(e??"").trim()||"Something went wrong.",9e3),k=sessionStorage.getItem("tb_toast");k&&(sessionStorage.removeItem("tb_toast"),d.toast(k));let L=()=>new Promise(e=>{if(!window.liveEditContent||window.liveEditContentDone){e(window.liveEditContentDone??null);return}let t=n=>e(n?.detail??null);document.addEventListener("live-edit:content",t,{once:!0}),setTimeout(()=>e(null),5e3)});L().then(e=>{let t=Xt();if(e?.failed){d.toast(t?"Saved \u2014 but this page could not load the latest content, so it may be showing an older version. Reload to try again.":"This page could not load your saved content, so it is showing the original. Nothing has been lost \u2014 reload to try again.",9e3);return}let n=t?Qt(document,t):null;n&&!n.ok&&(console.warn("[live-edit] the change was saved but the page still shows:",n.saw,`
  expected:`,n.wanted),d.toast("Saved \u2014 but this page is still showing the old version. Your change is stored; reload, and tell us if it stays this way.",9e3))});let O=e=>{sessionStorage.setItem("tb_toast",e),s()},R=(e,t=null,n=null)=>{let i=window.__liveEditReact;if(!i){O(e);return}let c=t!==null&&(i.apply??i.set)(t,n);d.toast(e),c||i.refresh()},{drawer:$,drawerTabs:N,drawerSubject:K,drawerTitle:U,drawerTrail:F,drawerFields:E,drawerDelete:M,toggleButton:ae,statusText:ie,linkHandle:Y,bgHandle:Q}=d,v=null,me=(e,t,n,i,c=!1)=>{let h=document.createElement("label");h.className="le-field",h.append(t);let p=e==="icon"?window.liveEditIcons:(window.liveEditSelects??{})[e],l=document.querySelector("[data-icon-templates]");if(e==="icon"&&Array.isArray(p)&&l){let f=document.createElement("input");f.type="hidden",f.name=e,f.value=n??"";let w=document.createElement("div");return w.className="le-icons",p.forEach(y=>{let b=document.createElement("button");b.type="button",b.title=y,b.dataset.iconChoice=y,b.className="le-icon"+(y===f.value?" is-active":"");let x=l.querySelector(`template[data-icon="${y}"]`);x?b.append(x.content.cloneNode(!0)):b.textContent=y,b.addEventListener("click",()=>{f.value=y,w.querySelectorAll("[data-icon-choice]").forEach(C=>{let A=C.dataset.iconChoice===y;C.className="le-icon"+(A?" is-active":"")}),f.dispatchEvent(new Event("input",{bubbles:!0}))}),w.append(b)}),h.append(f,w),h}if(Array.isArray(p)&&p.length<=6){let f=document.createElement("input");f.type="hidden",f.name=e,f.value=n??p[0];let w=document.createElement("div");return w.className="le-choices",p.forEach(y=>{let b=document.createElement("label");b.className="le-choice"+(y===f.value?" is-selected":"");let x=document.createElement("input");x.type="radio",x.name="le-choice-"+e,x.checked=y===f.value,x.addEventListener("change",()=>{f.value=y,w.querySelectorAll(".le-choice").forEach(C=>C.classList.remove("is-selected")),b.classList.add("is-selected"),f.dispatchEvent(new Event("input",{bubbles:!0}))}),b.append(x,document.createTextNode(y)),w.append(b)}),h.append(f,w),h}let u;if(Array.isArray(p)?(u=document.createElement("select"),p.forEach(f=>{let w=document.createElement("option");w.value=f,w.textContent=f,w.selected=f===n,u.append(w)})):(u=document.createElement("textarea"),u.rows=i,u.value=n??""),u.name=e,u.className="le-input",u.tagName==="TEXTAREA"){u.classList.add("le-prose");let f=()=>{u.style.height="auto",u.style.height=Math.min(u.scrollHeight+2,420)+"px"};u.addEventListener("input",f),requestAnimationFrame(f)}if(c&&u.tagName==="TEXTAREA"){let f=document.createElement("div");f.className="le-tools";let w=(x,C)=>{let A=u.selectionStart,T=u.selectionEnd,q=u.value.slice(A,T)||"text";u.setRangeText(x+q+C,A,T,"select"),u.dispatchEvent(new Event("input",{bubbles:!0})),u.focus()},y=(x,C,A,T="")=>{let q=document.createElement("button");return q.type="button",q.title=C,q.textContent=x,q.className="le-tool "+T,q.addEventListener("click",A),q};f.append(y("B","Bold",()=>w("**","**"),"is-bold"),y("I","Italic",()=>w("*","*"),"is-italic"),y("Link","Insert link",()=>{let x=window.prompt("Link URL (https://\u2026 or /page):");if(!x)return;let C=u.selectionStart,A=u.selectionEnd,T=u.value.slice(C,A)||"link text";u.setRangeText("["+T+"]("+x+")",C,A,"select"),u.dispatchEvent(new Event("input",{bubbles:!0})),u.focus()}));let b=document.createElement("span");b.className="le-hint",b.textContent="**bold** \xB7 *italic* \xB7 [text](url)",f.append(b),h.append(f)}return h.append(u),h},X=e=>{let t=e.tagName;if(e.dataset.editRegion)return e.dataset.editRegion;if(t==="IMG")return"Image";if(t==="BUTTON")return"Button";if(t==="A")return/\b(btn|button)\b/i.test(String(e.className))?"Button":"Link";if(/^H[1-6]$/.test(t))return"Heading";if(t==="P")return"Paragraph";if(t==="LI")return"List item";if(t==="UL"||t==="OL")return"List";if(t==="NAV")return"Menu";if(t==="HEADER")return"Header";if(t==="FOOTER")return"Footer";if(t==="FORM")return"Form";if(e.hasAttribute("data-edit-item"))return"Card";if(e.hasAttribute("data-edit-icon"))return"Icon";if(e.hasAttribute("data-edit-svg"))return"Drawing";if(e.hasAttribute("data-edit"))return"Text";if(e.hasAttribute("data-has-bg")||e.hasAttribute("data-edit-bg"))return"Background";if(t==="SECTION"||t==="MAIN"||t==="ARTICLE")return"Section";let n=e.getBoundingClientRect();return n.width>window.innerWidth*.6&&n.height>180?"Section":"Group"},re=(e,t)=>{let n=e.tagName,i;return n==="IMG"?i=["radius","hidden"]:n==="A"||n==="BUTTON"?i=["background","textColor","fontSize","radius","hidden"]:/^(H[1-6]|P|SPAN|LI|BLOCKQUOTE|FIGCAPTION|DT|DD|TD|TH|CAPTION|CITE|Q|LABEL|STRONG|EM)$/.test(n)?i=["textColor","fontSize","hidden"]:i=["background","backgroundImage","paddingY","paddingX","radius","hidden"],t.filter(c=>i.includes(c.trim()))},we=({hint:e="PNG, JPG or WEBP, or drag one here",onFile:t}={})=>{let n=document.createElement("label");n.className="le-upload";let i=document.createElement("div");i.className="le-upload-inner";let c=document.createElement("span");c.className="le-upload-icon",c.textContent="\u2191";let h=document.createElement("span");h.className="le-upload-text";let p=document.createElement("span");p.className="le-upload-title",p.textContent="Upload from your computer";let l=document.createElement("span");l.className="le-upload-hint",l.textContent=e,h.append(p,l);let u=document.createElement("span");u.className="le-upload-btn",u.textContent="Choose file",i.append(c,h,u);let f=document.createElement("input");f.type="file",f.accept="image/*";let w=y=>{y&&(l.textContent=y.name,t?.(y))};return f.addEventListener("change",()=>w(f.files[0])),["dragenter","dragover"].forEach(y=>n.addEventListener(y,b=>{b.preventDefault(),n.classList.add("is-dragover")})),["dragleave","drop"].forEach(y=>n.addEventListener(y,b=>{b.preventDefault(),n.classList.remove("is-dragover")})),n.addEventListener("drop",y=>{let b=y.dataTransfer?.files?.[0];if(!b)return;let x=new DataTransfer;x.items.add(b),f.files=x.files,w(b)}),n.append(i,f),n},$e=e=>{let t=String(e).match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);return!t||t[4]!==void 0&&Number(t[4])===0?"":"#"+[1,2,3].map(n=>Number(t[n]).toString(16).padStart(2,"0")).join("")},Oe=e=>{if(!e)return"";let t=e.dataset.background||e.dataset.bg||e.dataset.backgroundImage;if(t)return t;let i=(getComputedStyle(e).backgroundImage||"").match(/url\((['"]?)(.*?)\1\)/);return i&&!i[2].startsWith("data:")?i[2]:""},ye={background:"Background colour",backgroundImage:"Background image",textColor:"Text colour",fontSize:"Text size",paddingY:"Space above and below",paddingX:"Space left and right",radius:"Corner rounding"},Pe=(e,t,n,i)=>{let c=document.createElement("label");c.className="le-field";let h=e.replace(/([A-Z])/g," $1").toLowerCase(),p=ye[e]??h.charAt(0).toUpperCase()+h.slice(1);if(c.append(p),t==="toggle"){let l=document.createElement("div");l.className="le-row";let u=document.createElement("input");u.type="checkbox",u.checked=n==="1",u.dataset.styleProp=e;let f=document.createElement("span");f.className="le-hint",f.textContent="Hidden from visitors. You still see it, dimmed, while editing.",l.append(u,f);let w=i?X(i).toLowerCase():"section";return c.replaceChildren(`Hide this ${w}`,l),c.className="le-field le-divided",c}if(t==="color"){let l=document.createElement("div");l.className="le-row";let u=document.createElement("input");u.type="color";let f=i?$e(getComputedStyle(i)[e==="textColor"?"color":"backgroundColor"]):"";u.value=n||f||"#ffffff",u.dataset.styleProp=e,u.className="le-color";let w=document.createElement("label");w.className="le-default";let y=document.createElement("input");y.type="checkbox",y.checked=!n,u.addEventListener("input",()=>y.checked=!1),w.append(y,"Use default"),l.append(u,w),c.append(l)}else if(t==="url"){let l=document.createElement("input");l.type="text",l.value=n??"",l.placeholder="Paste an image URL, or upload below",l.dataset.styleProp=e,l.className="le-input";let u=document.createElement("img");u.className="le-thumb",u.alt="";let f=T=>{u.src=T||"",u.style.display=T?"":"none"},w=n?"":Oe(i),y=document.createElement("span");y.className="le-hint";let b=(T,q)=>{y.textContent=T?q?"Current image (from the theme) \u2014 upload or paste a link to replace it":"Replacing with this image":"No image set",y.title=T||""};f(n||w),b(n||w,!n&&!!w),l.addEventListener("input",()=>{let T=l.value.trim();f(T||w),b(T||w,!T&&!!w)});let x=we({onFile:async T=>{f(URL.createObjectURL(T));let q=new FormData;q.append("file",T);try{let z=await(await B("/live-edit/upload",{method:"POST",body:q})).json();l.value=z.url,f(z.url),b(z.url,!1),l.dispatchEvent(new Event("input",{bubbles:!0}))}catch(P){m(V(P,"save that"))}}}),C=j("div","le-ways"),A=j("button","le-btn le-wide","Replace background");A.type="button",A.addEventListener("click",()=>Rt(i,async T=>{let{url:q,file:P,credit:z}=T,_=q;if(P){f(URL.createObjectURL(P));let ee=new FormData;ee.append("file",P);try{_=(await(await B("/live-edit/upload",{method:"POST",body:ee})).json()).url}catch(te){d.toast(V(te,"save that"));return}}_&&(l.value=_,f(_),b(_,!1),l.dispatchEvent(new Event("input",{bubbles:!0})),l.dataset.kbCreditFor=_,l.dataset.kbCredit=JSON.stringify({credit:z??"",creditBy:T.creditBy??"",creditUrl:T.creditUrl??"",creditSource:T.creditSource??"",creditSourceUrl:T.creditSourceUrl??""}),z&&d.toast(z,4e3))},"Free photos","background")),C.append(A),l.hidden=!0,x.hidden=!0,c.append(C,l,x,u,y)}else{let l=document.createElement("input");l.type="number",l.min=0,l.max=400,l.value=n??"",l.placeholder="default",l.dataset.styleProp=e,l.className="le-input",c.append(l)}return c},qe={background:"color",backgroundImage:"url",textColor:"color",fontSize:"px",paddingX:"px",paddingY:"px",radius:"px",hidden:"toggle"},Me=(e,t,n)=>{v.styleKey=e;let i=(window.liveEditStyles??{})[e]??{},c=document.createElement("div");c.className="le-section-heading",c.textContent="Style",E.append(c);let h=0;if((n?re(n,t):t).forEach(p=>{let l=(window.liveEditStyleProps??{})[p]??qe[p];l&&(E.append(Pe(p,l,i[p],n)),h++)}),h===0){let p=document.createElement("div");p.className="le-hint",p.textContent="Nothing on this element can be restyled.",E.append(p)}},ve=document.createElement("style");document.head.append(ve);let Ie=(e,t)=>{let n=`[data-style="${e}"]`,i="",c="";for(let[h,p]of Object.entries(t))p&&(i+={hidden:"opacity:.45 !important;",backgroundImage:`background-image:url('${p}') !important;background-size:cover !important;background-position:center !important;`,background:`background:${p} !important;`,textColor:`color:${p} !important;`,fontSize:`font-size:${p}px !important;`,radius:`border-radius:${p}px !important;`,paddingX:`padding-left:${p}px !important;padding-right:${p}px !important;`,paddingY:`padding-top:${p}px !important;padding-bottom:${p}px !important;`}[h]??"",h==="paddingY"&&(c+=`section${n}>div{padding-top:0 !important;padding-bottom:0 !important}`));return i?c+`${n}{${i}}`:c},xe=()=>{if(!v?.styleKey)return;let e=Ee(),t=v.styleKey,n=Ie(t,e),i={background:"background",textColor:"color",fontSize:"font-size",radius:"border-radius",backgroundImage:"background-image"};for(let[c,h]of Object.entries(e))h||(c==="hidden"&&(n+=`body.editing [data-style="${t}"]{opacity:1 !important}`),i[c]&&(n+=`[data-style="${t}"]{${i[c]}:revert-layer !important}`),c==="paddingY"&&(n+=`[data-style="${t}"]{padding-top:revert-layer !important;padding-bottom:revert-layer !important}section[data-style="${t}"]>div{padding-top:revert-layer !important;padding-bottom:revert-layer !important}`),c==="paddingX"&&(n+=`[data-style="${t}"]{padding-left:revert-layer !important;padding-right:revert-layer !important}`));ve.textContent=n},ke=()=>{ve.textContent=""};E.addEventListener("input",()=>{v&&(v.dirty=!0),xe()}),E.addEventListener("change",()=>{v&&(v.dirty=!0),xe()});let Ee=()=>{let e={};return E.querySelectorAll("[data-style-prop]").forEach(t=>{if(t.type==="checkbox")e[t.dataset.styleProp]=t.checked?"1":"";else if(t.type==="color"){let n=t.closest("div").querySelector("input[type=checkbox]").checked;e[t.dataset.styleProp]=n?"":t.value}else e[t.dataset.styleProp]=t.value;if(t.dataset.kbCredit&&t.dataset.kbCreditFor===t.value)try{Object.assign(e,JSON.parse(t.dataset.kbCredit))}catch{}}),e},Z=null,ne=()=>{!Z||!v||v.dirty||!$.classList.contains("is-open")||D!=="Edit"||Z.isConnected&&Be(Z)},pe=e=>e.dataset.editRegion?e.dataset.editRegion:e.dataset.editLabel?e.dataset.editLabel:e.querySelector(":scope > [data-style-edit]")?.dataset.editLabel??X(e),Be=e=>{if(Z=e,e.dataset.editImg!==void 0)ct(e);else if(e.dataset.edit!==void 0)Je(e);else if(e.dataset.svgEdit!==void 0||e.dataset.editSvg!==void 0)Dt(e);else if(e.dataset.editHref!==void 0)st(e);else if(e.dataset.style!==void 0){let t=e.querySelector(":scope > [data-style-edit]");dt(t??e)}},nt=e=>{v?.dirty&&!window.confirm("Discard unsaved changes?")||(ke(),Be(e))},ot=null,I=e=>{let t=ot;ot=e??null;let n=[],i=e?.parentElement;for(;i&&i!==document.body;)i.dataset&&(i.dataset.edit!==void 0||i.dataset.style!==void 0)&&n.unshift(i),i=i.parentElement;let c=[];n.forEach(p=>{let l=pe(p);if(c.length&&c[c.length-1].label===l){c[c.length-1].node=p;return}c.push({node:p,label:l})});let h=c.slice(-3);t&&t!==e&&document.contains(t)&&!h.some(p=>p.node===t)&&h.unshift({node:t,label:`\u2190 ${pe(t)}`}),F.replaceChildren(),F.classList.toggle("is-visible",h.length>0),h.forEach((p,l)=>{let u=p.node;l>0&&F.append("\u203A");let f=document.createElement("button");f.type="button",f.textContent=p.label,f.className="le-crumb",f.addEventListener("click",()=>nt(u)),F.append(f)})},D="Edit",H=e=>{D=e,Object.entries(N).forEach(([t,n])=>{n.classList.toggle("is-on",t===e),n.setAttribute("aria-selected",t===e?"true":"false")}),K.classList.toggle("le-hidden",e!=="Edit"),d.drawerFoot.classList.toggle("le-hidden",e!=="Edit"),e==="Changes"&&Ve(),e==="History"&&zn()};Object.entries(N).forEach(([e,t])=>{t.addEventListener("click",()=>{e!=="Edit"&&v?.dirty&&!window.confirm("Discard unsaved changes?")||(H(e),$.classList.contains("is-open")||it())})});let V=(e,t)=>{console.warn(`[live-edit] ${t}:`,e);let n=String(e?.message??"");return/failed to fetch|networkerror|load failed/i.test(n)?"No connection just now. Nothing has been lost; try again in a moment.":/\b401\b|\b403\b|unauthor|forbidden/i.test(n)?"Your editing session has expired. Reload the page to carry on.":/\b429\b|too many/i.test(n)?"That was a lot at once. Give it a few seconds and try again.":`Could not ${t}. Nothing has been lost; try again in a moment.`},W=null,se=async()=>{if(window.liveEditApi)try{W=await(await B("/live-edit/credits",{method:"GET"})).json(),ne()}catch(e){console.warn("[live-edit] could not read the credit balance:",e),W=null}},Ue=async()=>{if(!(window.liveEditStyleProps&&window.liveEditStyles)&&window.liveEditApi)try{let t=await(await B("/live-edit/content",{method:"GET"})).json();t?.styleProps&&(window.liveEditStyleProps=t.styleProps),t?.styles&&(window.liveEditStyles=t.styles),ne()}catch(e){console.warn("[live-edit] could not read what this site allows to be styled:",e)}},_e=(e,t)=>{if(!W?.available||!t)return;let n=document.createElement("div");n.className="le-assist-head",n.append(le("AI assist"),Ce()),E.append(n),[["rewrite","Rewrite"],["shorten","Shorten"]].forEach(([i,c])=>{let h=W.costs?.[i]??1,p=document.createElement("button");p.type="button",p.className="le-assist";let l=document.createElement("span");l.textContent=c;let u=document.createElement("span");u.className="le-assist-cost",u.textContent=`${h} credit${h===1?"":"s"}`,p.append(l,u),(W.balance??0)<h&&(p.disabled=!0,u.classList.add("is-short"),p.title="Not enough credits"),p.addEventListener("click",()=>void We(i,c,e,t,p,l)),E.append(p)})},Ce=()=>{let e=document.createElement("span");return e.className="le-assist-balance",e.textContent=`${W?.balance??0} credits left`,e},le=e=>{let t=document.createElement("div");return t.className="le-section-heading",t.textContent=e,t},He=()=>(document.querySelector('meta[property="og:site_name"]')?.content??document.querySelector('meta[name="application-name"]')?.content??(document.title??"").split(/\s+[|\u2013\u2014-]\s+/).pop()??"").replace(/\s+/g," ").trim().slice(0,120),je=()=>(document.querySelector('meta[name="description"]')?.content??document.querySelector('meta[property="og:description"]')?.content??"").replace(/\s+/g," ").trim().slice(0,400),We=async(e,t,n,i,c,h)=>{c.disabled=!0,h.textContent="Thinking\u2026";let p;try{p=await(await B("/live-edit/assist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:e,text:i.value,heading:ue(n),role:X(n),page:window.location.pathname,site:He(),about:je()})})).json()}catch(l){c.disabled=!1,h.textContent=t,d.toast(V(l,"rewrite that"));return}if(typeof p?.balance=="number"&&W&&(W.balance=p.balance),!p?.text){c.disabled=!1,h.textContent=t,d.toast(at(p?.reason));return}i.value=p.text,i.dispatchEvent(new Event("input",{bubbles:!0})),i.focus(),c.disabled=!1,h.textContent=t,d.toast(`Rewritten. ${p.balance} credits left.`)},ue=e=>(((e.closest("section, article, header, div[data-style]")??document.body).querySelector("h1, h2, h3")??document.querySelector("h1"))?.textContent??"").replace(/\s+/g," ").trim().slice(0,200),at=e=>({not_enough_credits:"Not enough credits for that. You can buy more from your account.",no_suggestion:"No suggestion for this one. Your words are unchanged.",not_configured:"Rewriting is not switched on for this site yet.",nothing_to_work_with:"There are no words here to rewrite yet."})[e]??"Could not rewrite that just now. Your words are unchanged.",Ve=async()=>{E.replaceChildren(G("Loading\u2026"));let e;try{e=await(await B("/live-edit/changes",{method:"GET"})).json()}catch(n){E.replaceChildren(G(V(n,"show your changes")));return}let t=e?.changes??[];if(t.length===0){E.replaceChildren(G("No unpublished changes."));return}E.replaceChildren(),t.forEach(n=>{let i=document.createElement("div");i.className="le-change";let c=document.createElement("div");c.className="le-row le-change-head";let h=document.createElement("span");h.className="le-change-label",h.textContent=Se(n);let p=document.createElement("button");if(p.type="button",p.className="le-chip-btn",p.textContent="Revert",p.addEventListener("click",()=>void Le(n,p)),c.append(h,p),i.append(c),n.before){let u=document.createElement("p");u.className="le-change-before",u.textContent=de(n.before),i.append(u)}let l=document.createElement("p");l.className="le-change-after",l.textContent=de(n.after)||"(empty)",i.append(l),E.append(i)})},de=e=>{let t=String(e??"").replace(/\s+/g," ").trim();return t.length>70?`${t.slice(0,70)}\u2026`:t},Se=e=>{let t=document.querySelector(`[data-edit="setting:${CSS.escape(e.key)}"], [data-edit-img="setting:${CSS.escape(e.key)}"], [data-style="${CSS.escape(e.key)}"]`);return t?X(t):e.kind==="style"?"Styling":"Text"},Le=async(e,t)=>{t.disabled=!0,t.textContent="Reverting\u2026";try{await B("/live-edit/changes",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:e.key,kind:e.kind})})}catch(n){t.disabled=!1,t.textContent="Revert",d.toast(V(n,"put that back"));return}O("Reverted \u2713")},J=()=>{let e=window.liveEditApi?.engine;if(!e)return null;let t=j("p","le-hint");return t.textContent=`Live Edit ${e}`,t.title="Quote this if you report a problem",t},zn=async()=>{E.replaceChildren(G("Loading\u2026"));let e;try{e=await(await B("/live-edit/versions",{method:"GET"})).json()}catch(i){E.replaceChildren(G(V(i,"show what has been published")));return}let t=e?.versions??[];if(t.length===0){E.replaceChildren(G("Nothing published yet. Your first publish will appear here."));let i=J();i&&E.append(i);return}E.replaceChildren(),t.forEach((i,c)=>{let h=document.createElement("div");h.className="le-version";let p=document.createElement("span");p.className=c===0?"le-version-dot is-latest":"le-version-dot";let l=document.createElement("div"),u=document.createElement("p");u.className="le-change-after",u.textContent=i.restored_from?`Restored version ${i.restored_from}`:`Published ${i.changes??0} change${i.changes===1?"":"s"}`;let f=document.createElement("p");f.className="le-change-when",f.textContent=Rn(i.published_at),l.append(u,f),h.append(p,l),E.append(h)});let n=J();n&&E.append(n)},G=e=>{let t=document.createElement("p");return t.className="le-hint",t.textContent=e,t},Rn=e=>{if(!e)return"";let t=Math.round((Date.now()-new Date(e).getTime())/1e3);return t<90?"Just now":t<3600?`${Math.round(t/60)} minutes ago`:t<86400?`${Math.round(t/3600)} hours ago`:t<86400*8?`${Math.round(t/86400)} days ago`:new Date(e).toLocaleDateString()},it=()=>{ze(),gt(),$.classList.add("is-open"),d.toolbar.classList.add("is-compact"),D==="Edit"&&E.querySelector("textarea, input:not([type=checkbox]), select")?.focus()},Ae=(e=!1)=>{!e&&v?.dirty&&!window.confirm("Discard unsaved changes?")||(v?.restore?.(),ke(),$.classList.remove("is-open"),d.toolbar.classList.remove("is-compact"),v=null)},Fn=()=>document.querySelectorAll("[data-edit], [data-edit-img], [data-edit-bg], [data-edit-href], [data-edit-icon], [data-edit-svg]"),rt=async(e,t=0)=>{try{if(e.cssRules){let n=[];for(let i of e.cssRules)i.styleSheet&&t<4?n.push(await rt(i.styleSheet,t+1)):n.push(i.cssText);return n.join("")}}catch{}if(!e.href)return"";try{let n=await fetch(e.href);if(!n.ok)return"";let i=await n.text();if(t>=4)return i;let c=[...i.matchAll(/@import\s+(?:url\(\s*(["']?)([^"')]+)\1\s*\)|(["'])([^"']+)\3)/gi)].map(p=>p[2]||p[4]).filter(Boolean),h=await Promise.all(c.map(p=>rt({href:new URL(p,e.href).href},t+1)));return i+h.join("")}catch{return""}},Dn=null,qn=async()=>{let e=new Map;return(await Promise.all([...document.styleSheets].map(n=>rt(n)))).forEach(n=>nn(n).forEach(i=>e.set(i.name,i.glyph))),[...e].map(([n,i])=>({name:n,glyph:i})).sort((n,i)=>n.name.localeCompare(i.name))},Pt=()=>Dn??(Dn=qn()),It=()=>{document.querySelectorAll("[data-style]").forEach(e=>{if(e.hasAttribute("data-edit-bg"))return;let n=(getComputedStyle(e).backgroundImage||"").match(/url\((['"]?)(.*?)\1\)/),i=e.getBoundingClientRect(),c=n&&!n[2].startsWith("data:")&&i.width>=120&&i.height>=120;e.toggleAttribute("data-has-bg",!!c)})},Mn=()=>{document.querySelectorAll("[data-edit-icon]").forEach(e=>{let t=getComputedStyle(e,"::before").content;(t==="none"||t==="normal"||t==='""'||t==="")&&e.removeAttribute("data-edit-icon")})},Te=e=>{e&&Mn(),document.body.classList.toggle("editing",e),Fn().forEach(t=>{e?t.setAttribute("tabindex","0"):t.removeAttribute("tabindex")}),sessionStorage.setItem("tb_editing",e?"1":"0"),ie.textContent=e?"Click any outlined text or image":"",ie.parentElement?.classList.toggle("is-saying",e),!e&&typeof ze=="function"&&ze(),d.toolbar.classList.toggle("is-editing",e),ae.textContent=e?"Done editing":"Edit site",e?(It(),document.querySelector("[data-edit-icon]")&&Pt(),o?.base&&o?.site&&Promise.resolve().then(()=>(Lt(),St)).then(t=>t.refreshBackgrounds({base:o.base,site:o.site,key:o.token})).then(t=>{t&&It()}).catch(t=>console.warn("[live-edit] could not look again for backgrounds:",t.message))):(gt(),fe()),e||Ae(!0)},Un=async()=>{let e=window.liveEditApi,t=await Promise.resolve().then(()=>(jn(),Bn)).catch(()=>null);if(t?.forget(window),!e||!t){window.location.reload();return}let n=window.prompt("Your editing session has ended. Enter your email address and we will send you a new link.");n&&(await t.requestLink(e,n,window).catch(()=>{}),m("If that address can edit this site, a link is on its way.")),window.location.reload()},B=async(e,t)=>{let n=window.liveEditApi,i=n?sn(e,t,n):null,c=i?await fetch(i.url,i.init):await fetch(e,en(r,t));if(c.status===419||c.status===401)throw await Un(),new Error("Your editing session has ended.");if(!c.ok){let h=await c.json().catch(()=>({}));throw new Error(h.error?.message??h.message??"Could not save. Try again.")}if(!tn(c))throw new Error("That did not save. Reload the page and try again.");return c},_n=(e,t)=>{if(!e?.element)return null;let n=i=>{let c=e.element.getAttribute(i);return c===null?null:{attr:i,marker:c}};if(e.kind==="image"){let i=t.querySelector("input[type=url]")?.value.trim(),c=t.querySelector("input[type=file]")?.files?.[0],h=n("data-edit-img")??n("data-edit-bg");return i&&h?{...h,kind:"image",value:i}:null}if(e.kind==="icon"){let i=n("data-edit-icon");return i&&e.value?{...i,kind:"icon",value:e.value}:null}if(e.kind==="setting"&&typeof e.savedValue=="string"){let i=n("data-edit");return!i||/<[a-z][\s\S]*>/i.test(e.savedValue)||e.element.hasAttribute("data-edit-attr")?null:{...i,kind:"text",value:e.savedValue}}return null},Hn=async e=>{let t=window.liveEditApi?.builderUrl;if(!t||e?.kind!=="setting"||typeof e.savedValue!="string"||!e.element)return;let n=e.element.closest(".elementor-element[data-id]");if(n)try{await fetch(t,{method:"POST",headers:{"Content-Type":"application/json",...window.liveEditApi?.publishHeaders??{}},body:JSON.stringify({page:window.location.href,element:n.dataset.id,value:e.savedValue})})}catch(i){console.warn("[live-edit] could not tell the page builder about this change:",i.message)}},Wn=async()=>{if(!v)return;let e=d.saveButton;e.disabled=!0,e.textContent="Saving\u2026";let t=()=>{e.disabled=!1,e.textContent="Save changes"};try{if(v.kind==="setting")await B("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:v.key,value:v.savedValue=v.value??E.querySelector("textarea, input[name=icon]")?.value??"",locale:window.liveEditLocale})});else if(v.kind==="record"){let n={};E.querySelectorAll("textarea, select, input[type=hidden][name]").forEach(i=>n[i.name]=i.value),await B("/live-edit/record",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:v.type,id:v.id,fields:n})})}else if(v.kind==="icon")await B("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:v.key,value:v.value})});else if(v.kind==="image"){let n=new FormData;n.append("target",v.target);let i=E.querySelector("input[type=file]").files[0],c=E.querySelector("input[type=url]").value.trim(),h=v.element?.getBoundingClientRect?.();h&&h.width>=1&&h.height>=1&&(n.append("fitWidth",String(Math.round(h.width))),n.append("fitHeight",String(Math.round(h.height))));let p=i!==void 0||c!==""&&c!==void 0;v.credit&&v.creditFor===v.target&&p&&Object.entries(v.credit).forEach(([u,f])=>n.append(u,f));let l=[...E.querySelectorAll("[data-img-attr]")];if(i?n.append("file",i):c&&n.append("url",c.startsWith("http")?c:`https://${c}`),l.forEach(u=>n.append(u.dataset.imgAttr,u.value)),!i&&!c&&l.length===0){t(),m("Choose a file from your computer or paste an image URL first.");return}await B("/live-edit/image",{method:"POST",body:n})}if(v.hrefKey){let n=E.querySelector("[data-link-field=href]").value.trim(),i=E.querySelector("[data-link-field=target]").checked;await B("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:v.hrefKey,value:n})}),v.targetKey&&await B("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:v.targetKey,value:i?"_blank":""})})}v.styleKey&&await B("/live-edit/style",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:v.styleKey,props:Ee()})}),await Hn(v),Kt(_n(v,E)),R("Saved \u2713",v.key??null,v.savedValue??null)}catch(n){t(),m(n.message)}};se(),Ue();let j=(e,t,n)=>{let i=document.createElement(e);return t&&(i.className=t),n!=null&&(i.textContent=n),i},Bt=e=>{let t=e.closest("section, article, header, div[data-style]");for(;t&&!t.querySelector("h1, h2, h3");)t=t.parentElement?.closest("section, article, header, div[data-style]")??null;let n=t?.querySelector("h1, h2, h3");return!t||!n?"":[...t.querySelectorAll("p, span, div, h4, h5, h6")].filter(c=>c.children.length===0).filter(c=>n.compareDocumentPosition(c)&Node.DOCUMENT_POSITION_PRECEDING).map(c=>(c.textContent??"").replace(/\s+/g," ").trim()).find(c=>c.length>3&&c.length<42)??""},Vn=/^(the|and|with|for|your|our|from|that|this|they|them|will|have|more|about|into|just|than|then|when|what|where|very|been|here|there)$/,jt=e=>{let t=new Set((document.title??"").toLowerCase().split(/[^a-z0-9]+/i).filter(Boolean));return(e??"").toLowerCase().split(/[^a-z0-9]+/i).filter(n=>n.length>3&&!Vn.test(n)&&!t.has(n))},Jn=e=>{let t=jt(Bt(e)).slice(0,3);if(t.length>0)return t.join(" ");let n=jt(ue(e)).slice(0,3);return n.length>0?n.join(" "):"workplace"},zt=e=>{let t=Jn(e),n=(e.dataset.editLabel??"").toLowerCase().trim(),i=/hero|banner|header|cover/.test(n);return[...new Set([t,i?`${t} wide`:`${t} close up`,"workplace"].filter(Boolean))].slice(0,4)},Yn=e=>`${(Bt(e)||ue(e)||"This page").replace(/[.\s]+$/,"")}. Photographic, natural daylight, calm and editorial, soft neutral tones to match the rest of the site. No text.`,Rt=(e,t,n="Free photos",i="image")=>{let c=d.modal({title:`Replace ${i}`,subtitle:e.dataset.editLabel??X(e)}),h=document.createElement("div");c.body.append(h),c.tabs.hidden=!1;let p=w=>{c.close(),t(w)},l={Upload:()=>Gn(h,p),"Free photos":()=>void Kn(h,e,p),"Generate with AI":()=>Qn(h,e,p)},u=Object.keys(l).map(w=>{let y=document.createElement("button");return y.type="button",y.className="le-modal-tab",y.textContent=w,y.addEventListener("click",()=>f(w)),c.tabs.append(y),[w,y]}),f=w=>{u.forEach(([y,b])=>b.classList.toggle("is-on",y===w)),h.replaceChildren(),l[w]()};return f(l[n]?n:"Free photos"),c},Gn=(e,t)=>{e.append(we({hint:"PNG, JPG or WEBP, or drag one here",onFile:l=>t({file:l})}));let n=j("div","le-row-tight"),i=document.createElement("input");i.type="url",i.className="le-search",i.placeholder="Or paste a link to a picture";let c=j("button","le-btn-outline","Use it");c.type="button";let h=()=>{let l=i.value.trim();l&&t({url:l.startsWith("http")?l:`https://${l}`})};c.addEventListener("click",h),i.addEventListener("keydown",l=>{l.key==="Enter"&&(l.preventDefault(),h())}),n.append(i,c),e.append(n);let p=j("p","le-hint","You can also drag a picture straight onto the image on the page.");p.style.marginTop="14px",e.append(p)},Kn=async(e,t,n)=>{let i=document.createElement("input");i.type="search",i.className="le-search",i.placeholder="Search free photographs";let c=document.createElement("div");c.className="le-chips";let h=document.createElement("div");h.className="le-grid";let p=document.createElement("p");p.className="le-hint",p.style.marginTop="16px",e.append(i,c,h,p);let l=()=>{h.replaceChildren();for(let f=0;f<6;f+=1)h.append(j("div","le-shimmer"))},u=async f=>{i.value=f,l();let w;try{w=await(await B(`/live-edit/photos?q=${encodeURIComponent(f)}`,{method:"GET"})).json()}catch(b){h.replaceChildren(G(V(b,"look for photographs")));return}let y=w?.photos??[];if(p.textContent=w?.source==="openverse"?"Free to use, including commercially. The photographer is credited automatically.":"Free to use under the Unsplash licence. The photographer is credited automatically.",y.length===0){h.replaceChildren(G(Xn(w?.reason,f)));return}h.replaceChildren(),y.forEach(b=>{let x=document.createElement("button");x.type="button",x.className="le-pick";let C=document.createElement("img");C.className="le-pick-shot",C.src=b.thumb??b.full,C.alt=b.alt??"",C.loading="lazy";let A=j("span","le-pick-by",b.by?`Photo by ${b.by}`:"");x.append(C,A),x.addEventListener("click",()=>{b.downloadLocation&&B("/live-edit/photos/used",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({download_location:b.downloadLocation})}).catch(()=>{}),n({url:b.full,alt:b.alt??"",credit:b.credit??(b.by?`Photo by ${b.by}`:""),creditBy:b.by??"",creditUrl:b.byUrl??"",creditSource:b.source??"",creditSourceUrl:b.sourceUrl??""})}),h.append(x)})};zt(t).forEach((f,w)=>{let y=document.createElement("button");y.type="button",y.className="le-chip",y.textContent=f,y.addEventListener("click",()=>void u(f)),c.append(y),w===0&&y.classList.add("is-on")}),i.addEventListener("keydown",f=>{f.key==="Enter"&&(f.preventDefault(),i.value.trim()&&u(i.value.trim()))}),await u(zt(t)[0])},Xn=(e,t)=>({not_configured:"Free photographs are not switched on for this site yet.",not_allowed:"The photo library would not accept this site\u2019s key. It needs setting up again.",unreachable:"Could not reach the photo library just now. Try again in a moment.",nothing_to_search_for:"Type what the picture should show."})[e]??`Nothing found for "${t}". Try fewer words.`,Qn=(e,t,n)=>{let i=Yn(t),c=j("div","le-suggest");c.append(j("div","le-eyebrow","Suggested for this spot"),j("div","le-suggest-text",i));let h=document.createElement("button");h.type="button",h.className="le-chip",h.style.marginTop="10px",h.textContent="Use this description",c.append(h);let p=document.createElement("textarea");p.className="le-textarea",p.placeholder="Describe the picture you want",h.addEventListener("click",()=>{p.value=i,p.focus()});let l=document.createElement("button");l.type="button",l.className="le-btn-publish",l.style.marginTop="14px",l.textContent="Make a picture \xB7 5 credits";let u=j("div","le-grid is-square");u.style.display="none",e.append(c,p,l,u),l.addEventListener("click",async()=>{let f=p.value.trim()||i;l.disabled=!0,l.textContent="Making\u2026",u.style.display="",u.replaceChildren();for(let b=0;b<4;b+=1)u.append(j("div","le-shimmer"));let w;try{w=await(await B("/live-edit/imagine",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:f})})).json()}catch(b){u.replaceChildren(G(V(b,"make a picture"))),l.disabled=!1,l.textContent="Try again \xB7 5 credits";return}let y=w?.images??[];if(typeof w?.balance=="number"&&(W={...W??{},balance:w.balance}),y.length===0){u.replaceChildren(G(Zn(w?.reason))),l.disabled=!1,l.textContent="Try again \xB7 5 credits";return}u.replaceChildren(),y.forEach(b=>{let x=document.createElement("button");x.type="button",x.className="le-pick";let C=document.createElement("img");C.className="le-pick-shot",C.src=b,C.alt="",x.append(C,j("span","le-tag","MADE")),x.addEventListener("click",()=>n({url:b,credit:"",creditSource:"Generated"})),u.append(x)}),l.disabled=!1,l.textContent="Make four more \xB7 5 credits"})},Zn=e=>({not_enough_credits:"Not enough credits to make a picture. You can buy more from your account.",not_configured:"Making pictures is not switched on for this site yet.",no_suggestion:"Nothing usable came back, so you have not been charged. Try describing it differently.",nothing_to_work_with:"Describe the picture you want first."})[e]??"Could not make a picture just now. You have not been charged.",Ne=null,eo=(e,t)=>{if(!t)return;let n=ce(e),i=l=>[...l.childNodes].filter(u=>u.nodeType===3),c=i(e).map(l=>l.nodeValue),h=()=>{let l=i(e);return l.length!==c.length?!1:(l.forEach((u,f)=>{u.nodeValue=c[f]}),!0)},p=!1;v.restore=()=>{!p||!Ne||h()||Ne(e,n)},t.addEventListener("input",()=>{Ne&&(p=!0,h(),Ne(e,t.value,{keepRuns:!0}))}),Ne===null&&Promise.resolve().then(()=>(tt(),et)).then(l=>Ne=l.applyValue).catch(l=>console.warn("[live-edit] could not preview words as you type:",l.message))},to=e=>{v.hrefKey=e.dataset.editHref,v.targetKey=e.dataset.editTarget;let t=document.createElement("div");t.className="le-field le-divided",t.append("Link");let n=document.createElement("input");n.type="text",n.dataset.linkField="href";let i=e.getAttribute("href")??"";n.value=i==="#"?"":i,n.placeholder="/contact or https://...",n.className="le-input le-link";let c=document.createElement("label");c.className="le-default";let h=document.createElement("input");h.type="checkbox",h.dataset.linkField="target",h.checked=e.getAttribute("target")==="_blank",c.append(h,"Open in a new tab"),t.append(n,c),E.append(t)},st=e=>{v={kind:"link"},U.textContent=e.dataset.editLabel??"Link",E.replaceChildren(),M.classList.add("le-hidden"),he(e)},Je=e=>{let{kind:t,key:n,parts:i}=Zt(e.dataset.edit);if(E.replaceChildren(),M.classList.add("le-hidden"),t==="setting"){v={kind:t,key:n,element:e},U.textContent=e.dataset.editLabel??X(e);let c=(window.liveEditRich?.settings??[]).includes(i[0]),h=xt({editValue:e.dataset.editValue,ownText:ce(e),fullText:e.textContent}),p=c?h.trim():h.replace(/\s+/g," ").trim(),l=e.dataset.editAs==="icon";E.append(l?me("icon","Icon",e.dataset.editValue??"",1,!1):me("value","Text",p,6,c)),l||_e(e,E.querySelector("textarea")),!l&&!c&&eo(e,E.querySelector("textarea"))}else{let[c,h]=i;v={kind:"record",type:c,id:Number(h)};let p=e.dataset.editLabel??"Item",l=JSON.parse(e.dataset.editValues??"{}"),u=l.title??l.question??l.label??l.number;if(U.textContent=u?`${p}: ${u.slice(0,40)}`:p,Object.entries(l).forEach(([b,x])=>{let C=b.replace(/_/g," "),A=C.charAt(0).toUpperCase()+C.slice(1),T=(window.liveEditRich?.fields??[]).includes(`${c}.${b}`);E.append(me(b,A,x,b==="detail"||b==="answer"?6:3,T))}),window.liveEditPublishing){let b=document.createElement("div");b.className="le-hint le-immediate",b.textContent="Changes here go live as soon as you save, without publishing.",E.append(b)}e.hasAttribute("data-edit-deletable")&&(M.textContent=`Delete this ${p.toLowerCase()}`,M.classList.remove("le-hidden"));let f=document.createElement("div");f.className="le-row";let w=document.createElement("span");w.className="le-label",w.textContent="Order";let y=(b,x)=>{let C=document.createElement("button");return C.type="button",C.textContent=x,C.className="le-chip-btn",C.addEventListener("click",async()=>{(await(await B("/live-edit/record/move",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:v.type,id:v.id,direction:b})})).json()).moved?O("Reordered \u2713"):m(b==="up"?"Already first.":"Already last.")}),C};f.append(w,y("up","\u2191 Move up"),y("down","\u2193 Move down")),E.prepend(f)}he(e)},no=e=>{let t=e.closest?.("[data-edit-item]"),n=t?.parentElement?.dataset?.editList?t.parentElement:e.closest?.("[data-edit-list]");if(!n?.dataset?.editList)return;let i=()=>[...n.children].filter(u=>u.dataset.editItem).map(u=>u.dataset.editItem),c=async(u,f)=>{try{await B("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:n.dataset.editList,value:JSON.stringify(u)})}),O(f)}catch(w){m(w.message)}},h=document.createElement("div");h.className="le-section-heading",h.textContent="List";let p=document.createElement("div");p.className="le-row";let l=document.createElement("button");if(l.type="button",l.className="le-chip-btn",l.textContent=t?"+ Add another":"+ Add item",l.addEventListener("click",()=>{let u=i(),f=t?u.indexOf(t.dataset.editItem):u.length-1;u.splice(f+1,0,"n"+Date.now().toString(36)),c(u,"Added \u2713")}),p.append(l),t){let u=document.createElement("button");u.type="button",u.className="le-btn-danger",u.textContent="Delete this item",u.addEventListener("click",()=>{window.confirm("Delete this item?")&&c(i().filter(f=>f!==t.dataset.editItem),"Deleted \u2713")}),p.append(u)}E.append(h,p)},lt=!1,oo=e=>{lt=!0,e.click(),window.setTimeout(()=>{lt=!1},0)},ao=e=>e.closest?.('a[href^="#"], [aria-controls], [aria-expanded], [data-toggle], [role="button"]')??null,io=e=>{let t=ao(e);if(t){let p=document.createElement("div");p.className="le-row";let l=document.createElement("button");l.type="button",l.className="le-chip-btn",l.textContent="Open this menu",l.title="Runs the control so you can edit what it reveals",l.addEventListener("click",()=>{Ae(!0),oo(t)}),p.append(l),E.append(p)}let n=e.closest?.("a[href]"),i=n?.getAttribute("href");if(!i||i==="#"||i.startsWith("javascript:"))return;let c=document.createElement("div");c.className="le-row";let h=document.createElement("button");h.type="button",h.className="le-chip-btn",h.textContent="Open this link \u2192",h.addEventListener("click",()=>{window.location.href=n.href}),c.append(h),E.append(c)},he=(e,{styleKey:t=null,styleOn:n=e}={})=>{e.dataset.editHref!==void 0&&to(e),io(e);let i=t??n.dataset.styleEdit??n.dataset.style,c=rn(n.dataset.styleProps,window.liveEditStyleProps);i&&c.length&&Me(i,c,n),so(e),no(e),I(e.dataset.styleEdit?e.closest("[data-style]")??e.parentElement:e),H("Edit"),it()},ro=e=>{let t=(ce(e)||e.textContent||"").replace(/\s+/g," ").trim();if(t)return t.slice(0,28);let n=(e.getAttribute("aria-label")??e.getAttribute("title")??"").trim();if(n)return n.slice(0,28);let i=e.className.toString().match(/(?:social-icon-|fa-|bi-|icon-)([a-z][a-z0-9-]{2,})/i)?.[1]??[...e.querySelectorAll("[class]")].map(c=>c.className.toString().match(/(?:social-icon-|fa-|bi-|icon-)([a-z][a-z0-9-]{2,})/i)?.[1]).find(Boolean);return i?i.charAt(0).toUpperCase()+i.slice(1):pe(e)},so=e=>{let t="[data-edit], [data-edit-img], [data-edit-bg], [data-edit-href], [data-edit-icon], [data-edit-svg]",n=[...e.querySelectorAll(t)].filter(p=>p.parentElement?.closest(t)===null||!e.contains(p.parentElement.closest(t))).filter(p=>p!==e&&p.getBoundingClientRect().width>0);if(n.length===0)return;let i=n.slice(0,24),c=document.createElement("div");c.className="le-section-heading",c.textContent=n.length>i.length?`Inside this \u2014 first ${i.length} of ${n.length}`:"Inside this",E.append(c);let h=document.createElement("div");h.className="le-row",i.forEach(p=>{let l=document.createElement("button");l.type="button",l.className="le-chip-btn",l.textContent=ro(p),l.addEventListener("click",()=>nt(p)),h.append(l)}),E.append(h)},dt=e=>{v={kind:"style"};let t=e.dataset.styleEdit??e.dataset.style;U.textContent=e.dataset.editLabel??X(e),E.replaceChildren(),M.classList.add("le-hidden"),he(e,{styleKey:t})},Ye=e=>{let t=getComputedStyle(e,"::before");return`${t.fontStyle} ${t.fontWeight} 20px ${t.fontFamily}`},Ft=(e,t)=>{let n=e.cloneNode(!1);n.removeAttribute("data-edit-icon"),Object.assign(n.style,{position:"absolute",visibility:"hidden",pointerEvents:"none"}),(e.parentNode??document.body).append(n);let i=Ye(n),c=[];return[...n.classList].forEach(h=>{h!==t&&(n.classList.remove(h),Ye(n)!==i&&c.push(h),n.classList.add(h))}),n.remove(),c},lo=(e,t,n,i)=>on([...e.classList],n,i,Ft(e,i),Ft(t,t.dataset.editIconCurrent)),co=(e,t)=>{let n=document.createElement("canvas").getContext("2d");return n.font=t,e.filter(({glyph:i})=>{let c=n.measureText(i);return(c.actualBoundingBoxAscent||0)+(c.actualBoundingBoxDescent||0)>0})},po=async e=>{let t=e.dataset.editIconCurrent;v={kind:"icon",key:e.dataset.editIcon.replace(/^setting:/,""),value:t,element:e},U.textContent="Icon",E.replaceChildren(),M.classList.add("le-hidden");let n=Ye(e),i=await Pt();if(v?.element!==e)return;let c=new Map([[n,null]]);document.querySelectorAll("[data-edit-icon]").forEach(b=>{let x=Ye(b);c.has(x)||c.set(x,b)});let h=an([...c].map(([b,x])=>({face:b,variant:x,icons:co(i,b)})));if(h.length===0){let b=document.createElement("div");b.className="le-hint",b.textContent="This theme loads its icons from somewhere this page cannot read, so they cannot be listed. Type the icon name instead.";let x=document.createElement("label");x.className="le-field",x.append("Icon name");let C=document.createElement("input");C.type="text",C.className="le-input",C.value=t??"",C.addEventListener("input",()=>{v.value=C.value.trim(),v.dirty=!0}),x.append(C,b),E.append(x),he(e);return}let p=e.className;v.restore=()=>{e.className=p,e.dataset.editIconCurrent=t};let l=document.createElement("input");l.type="search",l.className="le-input",l.placeholder=`Search ${h.length} icons\u2026`;let u=document.createElement("div");u.className="le-icon-grid";let f=document.createElement("div");f.className="le-hint";let w=400,y=b=>{let x=b.trim().toLowerCase().replace(/\s+/g,"-"),C=x?h.filter(({name:A})=>A.includes(x)):h;if(u.replaceChildren(),C.slice(0,w).forEach(({name:A,glyph:T,face:q,variant:P})=>{let z=document.createElement("button");z.type="button",z.className="le-icon-choice",z.title=A.replace(/^[a-z]+-/,"").replace(/-/g," "),z.classList.toggle("is-current",A===t),z.style.font=q,z.textContent=T,z.addEventListener("click",()=>{e.className=p,e.dataset.editIconCurrent=t;let _=P?lo(e,P,A,t):A;P?e.className=_:e.classList.replace(t,A),e.dataset.editIconCurrent=A,v.value=_,v.dirty=!0,u.querySelectorAll(".le-icon-choice").forEach(ee=>ee.classList.remove("is-current")),z.classList.add("is-current")}),u.append(z)}),C.length===0){let A=document.createElement("div");A.className="le-hint",A.textContent="No icon matches that name.",u.append(A)}f.textContent=C.length>w?`Showing ${w} of ${C.length}. Type to narrow it down.`:""};l.addEventListener("input",()=>y(l.value)),y(""),E.append(l,u,f),he(e)},Dt=e=>{let t=e.outerHTML;v={kind:"setting",key:e.dataset.editSvg.replace(/^setting:/,""),element:e},U.textContent=e.dataset.editLabel??"Drawing",E.replaceChildren(),M.classList.add("le-hidden");let n=()=>{e.outerHTML=t};v.restore=n;let i=new Set,c=[];document.querySelectorAll("svg").forEach(y=>{let b=y.outerHTML,x=b.replace(/\s+(class|style|width|height|data-[\w-]+)="[^"]*"/g,"");i.has(x)||y.getBoundingClientRect().width<4||(i.add(x),c.push(b))});let h=document.createElement("div");h.className="le-icon-grid";let p=null;c.slice(0,120).forEach(y=>{let b=document.createElement("button");b.type="button",b.className="le-icon-choice",b.innerHTML=y;let x=b.firstElementChild;x&&(x.removeAttribute("class"),x.setAttribute("width","20"),x.setAttribute("height","20")),b.classList.toggle("is-current",y===t),b.addEventListener("click",()=>{p=y,v.value=y,v.dirty=!0;let C=document.querySelector(`[data-edit-svg="${e.dataset.editSvg}"]`)??e,A=new DOMParser().parseFromString(y,"image/svg+xml").documentElement;["class","width","height","style","data-edit-svg","data-edit-label"].forEach(T=>{C.hasAttribute(T)&&A.setAttribute(T,C.getAttribute(T))}),C.replaceWith(A),h.querySelectorAll(".le-icon-choice").forEach(T=>T.classList.remove("is-current")),b.classList.add("is-current")}),h.append(b)});let l=document.createElement("label");l.className="le-field le-divided",l.append("Or paste an SVG");let u=document.createElement("textarea");u.className="le-input le-prose",u.placeholder='<svg viewBox="0 0 24 24">\u2026</svg>',u.addEventListener("input",()=>{u.value.trim()!==""&&(v.value=u.value.trim(),v.dirty=!0)});let f=document.createElement("div");f.className="le-hint",f.textContent="Anything that could run or fetch is stripped before it is saved.",l.append(u,f);let w=document.createElement("div");w.className="le-section-heading",w.textContent=c.length?"Drawings on this site":"No other drawings here",E.append(w,h,l),he(e)},ct=e=>{let t=e.dataset.editKind==="background";v={kind:"image",target:e.dataset.editImg??e.dataset.editBg,element:e},U.textContent=e.dataset.editLabel??(t?"Background image":"Image"),E.replaceChildren(),M.classList.add("le-hidden");let n=document.createElement("div");n.className="le-preview";let i=document.createElement("img");i.alt="",i.className="";let c=t?Oe(e):e.currentSrc||e.getAttribute("src")||"",p=(c&&!c.startsWith("data:")?c:"")||e.dataset.editPreview;p?(i.src=p,n.append(i)):n.textContent="No image yet";let l=P=>{n.replaceChildren(i),i.src=P},u=we({onFile:P=>l(URL.createObjectURL(P))}),f=document.createElement("label");f.className="le-field",f.append("Or paste an image URL");let w=document.createElement("input");w.type="url",w.placeholder="https://...",w.className="le-input",w.addEventListener("change",()=>{let P=w.value.trim();P&&l(P.startsWith("http")?P:`https://${P}`)}),f.append(w);let y=document.createElement("div");y.className="le-hint",y.textContent="Nothing changes on your site until you publish.";let b=(P,z,_,ee)=>{let te=document.createElement("label");te.className="le-field le-divided",te.append(z);let be=document.createElement("input");if(be.type="text",be.dataset.imgAttr=P,be.value=_??"",be.className="le-input",te.append(be),ee){let Fe=document.createElement("span");Fe.className="le-hint",Fe.textContent=ee,te.append(Fe)}return te},x=j("div","le-ways"),C=({url:P,file:z,credit:_,alt:ee,creditBy:te,creditUrl:be,creditSource:Fe,creditSourceUrl:wo})=>{if(z){let Yt=new DataTransfer;Yt.items.add(z),u.querySelector("input[type=file]").files=Yt.files,l(URL.createObjectURL(z))}else P&&(w.value=P,l(P));let mt=E.querySelector('[data-img-attr="alt"]');ee&&mt&&mt.value.trim()===""&&(mt.value=ee),v.credit={credit:_??"",creditBy:te??"",creditUrl:be??"",creditSource:Fe??"",creditSourceUrl:wo??""},v.creditFor=v.target,T(v.credit),d.saveButton.click()},A=j("p","le-credit"),T=P=>{let z=(P?.credit??"").trim();A.textContent=z,A.hidden=z===""};T({credit:Xe(e,"data-edit-credit","editCredit")});let q=j("button","le-btn le-wide",t?"Replace background":"Replace image");if(q.type="button",q.addEventListener("click",()=>Rt(e,C,"Free photos",t?"background":"image")),x.append(q),u.hidden=!0,f.hidden=!0,E.append(n,A,x,u,f,y),v.target.startsWith("setting:")&&!t&&E.append(b("alt","Alt text",Xe(e,"alt","editAlt"),"Describes the image for search engines and screen readers."),b("imgTitle","Title attribute",Xe(e,"title","editTitle"),"Optional tooltip shown on hover.")),v.target.startsWith("setting:")){let P=document.createElement("button");P.type="button",P.textContent=t?"Remove background":"Remove image",P.className="le-btn-danger",P.addEventListener("click",async()=>{let z=t?"Remove this background image? The section keeps its layout and colour.":"Remove this image? The section keeps its layout; you can add a new image any time.";if(!window.confirm(z))return;let _=new FormData;_.append("target",v.target),_.append("remove","1"),await B("/live-edit/image",{method:"POST",body:_}),O("Removed \u2713")}),E.append(P)}he(e)},qt=e=>e?.closest?.("a[data-edit], a[data-edit-href]")??null,uo=e=>{let t=e?.getAttribute("href")??"";return t!==""&&t!=="#"&&!t.startsWith("javascript:")},ge=null,pt=!1,Ge=null,ut=()=>{Ge&&(clearTimeout(Ge),Ge=null)},Mt=()=>{ut(),Ge=setTimeout(()=>{pt||ze()},140)},ho=e=>{if(e===ge&&!Y.classList.contains("hidden"))return;ge=e;let t=e.getBoundingClientRect();Y.style.top=`${t.top+window.scrollY-10}px`,Y.style.left=`${t.right+window.scrollX-10}px`,Y.classList.add("is-visible")},ze=()=>{Y.classList.remove("is-visible"),ge=null},Ut=e=>{if(!e?.closest)return null;let t=e.closest("[data-style-edit]");if(t)return{element:t,kind:"style"};let n=e.closest("[data-edit-img]");if(n)return{element:n,kind:"image"};let i=e.closest("[data-edit-icon]");if(i)return{element:i,kind:"icon"};let c=e.closest("[data-edit-svg]");if(c)return{element:c,kind:"svg"};let h=e.closest("[data-edit]");if(h)return{element:h,kind:"text"};let p=e.closest("[data-edit-href]:not([data-edit])");if(p)return{element:p,kind:"link"};let l=e.closest("[data-edit-bg]");if(l)return{element:l,kind:"image"};let u=e.closest("[data-style]:not([data-style-edit])");return u?{element:u,kind:"style"}:null},go=({element:e,kind:t})=>{t==="image"?ct(e):t==="icon"?po(e):t==="svg"?Dt(e):t==="text"?Je(e):t==="link"?st(e):dt(e)},ht=null,fe=()=>d.hoverBox.classList.remove("is-visible"),fo=e=>{let t=e.getBoundingClientRect();if(t.width<4||t.height<4){fe();return}Object.assign(d.hoverBox.style,{top:`${t.top}px`,left:`${t.left}px`,width:`${t.width}px`,height:`${t.height}px`}),d.hoverBox.classList.toggle("is-flipped",t.top<26),d.hoverLabel.textContent=e.dataset.editLabel??X(e),d.hoverBox.classList.add("is-visible")};document.addEventListener("pointermove",e=>{if(!document.body.classList.contains("editing")){fe();return}if(e.target===d.root||d.root.contains(e.target)){fe();return}ht||(ht=requestAnimationFrame(()=>{ht=null;let t=Ut(e.target);t?fo(t.element):fe()}))}),document.addEventListener("scroll",fe,!0),document.addEventListener("pointerleave",fe);let Ke=null,gt=()=>{Q.classList.remove("is-visible"),Ke=null},bo=e=>{Ke=e;let t=e.getBoundingClientRect();Q.style.top=`${Math.max(t.top,8)+8}px`,Q.style.left=`${t.left+8}px`,Q.classList.add("is-visible")};Q.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),Ke&&dt(Ke),gt()}),document.addEventListener("pointerover",e=>{if(!document.body.classList.contains("editing"))return;let t=e.target.closest?.("[data-has-bg]");t&&bo(t);let n=qt(e.target);n&&uo(n)&&(ut(),ho(n))}),document.addEventListener("pointerout",e=>{document.body.classList.contains("editing")&&e.relatedTarget!==Y&&(qt(e.relatedTarget)===ge&&ge||Mt())}),Y.addEventListener("pointerenter",()=>{pt=!0,ut()}),Y.addEventListener("pointerleave",()=>{pt=!1,Mt()}),Y.addEventListener("click",e=>{if(e.preventDefault(),e.stopPropagation(),!ge)return;let t=ge;t.dataset.edit!==void 0?Je(t):st(t),ze()}),document.addEventListener("click",e=>{if(!document.body.classList.contains("editing")||lt||e.target===d.root||d.root.contains(e.target)||e.target.closest("[data-live-create]"))return;let t=Ut(e.target);t&&(e.preventDefault(),e.stopImmediatePropagation(),go(t))},!0),document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$.classList.contains("is-open")&&Ae(),!document.body.classList.contains("editing")||e.key!=="Enter"&&e.key!==" "||d.shadow.activeElement)return;let t=document.activeElement;t?.matches("[data-edit-img], [data-edit-bg]")?(e.preventDefault(),ct(t)):t?.matches("[data-edit]")&&!t.matches("button, a")&&(e.preventDefault(),Je(t))}),ae?.addEventListener("click",()=>Te(!document.body.classList.contains("editing"))),d.changesButton?.addEventListener("click",()=>{document.body.classList.contains("editing")||Te(!0),H("Changes"),it()});let _t=e=>{if(window.liveEditPublishing){e(window.liveEditPublishing);return}L().then(()=>window.liveEditPublishing&&e(window.liveEditPublishing))};_t(e=>{let t=e.pending??0,n=()=>{d.publishButton.hidden=!1,d.previewButton.hidden=!1,d.publishLabel.textContent=t>0?"Publish":"Published",d.publishCount.textContent=String(t),d.publishCount.hidden=t===0,d.publishButton.disabled=t===0,d.publishButton.title=t>0?`Put ${t} change${t===1?"":"s"} live`:"Nothing is waiting to be published"};n();let i=async()=>{let h=t===1?"":"s",p=e.domain??window.location.host,l=d.modal({title:`Publish ${t} change${h}`,subtitle:`They go live on ${p} right away.`,size:"is-narrow"});l.body.append(G("Loading\u2026"));let u=j("button","le-btn-outline","Keep editing");u.type="button",u.addEventListener("click",()=>l.close());let f=j("button","le-btn-publish","Publish now");f.type="button",l.foot.hidden=!1,l.foot.append(u,f),f.focus();try{let b=(await(await B("/live-edit/changes",{method:"GET"})).json())?.changes??[],x=j("div","le-review");b.forEach(C=>{let A=j("div","le-review-row");A.append(j("div","le-review-what",Se(C)),j("div","le-review-to",de(C.after)||"(empty)")),x.append(A)}),l.body.replaceChildren(b.length>0?x:G("Nothing is waiting."))}catch(w){l.body.replaceChildren(G(V(w,"list what is waiting")))}f.addEventListener("click",async()=>{f.disabled=!0,u.disabled=!0,f.textContent="Publishing\u2026",l.allowDismiss(!1);try{await B("/live-edit/publish",{method:"POST"}),t=0,n(),l.close(),O(`Live on ${p} \u2713`)}catch(w){l.allowDismiss(!0),f.disabled=!1,u.disabled=!1,f.textContent="Try again",l.body.replaceChildren(G(V(w,"publish that")))}})};d.publishButton.addEventListener("click",()=>{t!==0&&(document.activeElement?.blur?.(),i())});let c=()=>{let h=document.body.classList.contains("editing");Ae(!0),Te(!1),d.toolbar.style.display="none";let p=document.createElement("div");p.className="le-back";let l=null,u=x=>{if(x&&!l){l=document.createElement("div"),l.className="le-phone";let C=document.createElement("iframe"),A=new URL(window.location.href);A.searchParams.set("live-edit","off"),C.src=A.toString(),C.title="This page on a phone",l.append(C),d.shadow.append(l)}else!x&&l&&(l.remove(),l=null)},w=[["Desktop",!1],["Phone",!0]].map(([x,C])=>{let A=j("button","le-back-btn",x);return A.type="button",A.addEventListener("click",()=>{w.forEach(T=>T.classList.remove("is-on")),A.classList.add("is-on"),u(C)}),p.append(A),A});if(w[0].classList.add("is-on"),e.previewUrl){let x=j("button","le-back-btn","Copy a link to this");x.type="button",x.title="A link that shows this unpublished version to somebody else",x.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(e.previewUrl),d.toast("Link copied \u2713")}catch{window.prompt("Copy this link:",e.previewUrl)}}),p.append(x)}let y=j("button","le-back-btn","Back to editing");y.type="button",y.addEventListener("click",()=>{u(!1),p.remove(),document.removeEventListener("keydown",b,!0),d.toolbar.style.display="",Te(h)});let b=x=>{x.key==="Escape"&&y.click()};document.addEventListener("keydown",b,!0),p.append(y),d.shadow.append(p),y.focus()};d.previewButton.addEventListener("click",c)});let mo=()=>{let e=document.querySelectorAll('nav, [role="navigation"], header ul'),t=new Map,n=i=>i.closest("#wpadminbar, #adminmenu, #wp-toolbar, #live-edit-ui, [data-no-edit], [data-live-edit-chrome]")!==null;return e.forEach(i=>{n(i)||i.querySelectorAll("a[href]").forEach(c=>{if(n(c))return;let h;try{h=new URL(c.getAttribute("href"),window.location.href)}catch{return}if(h.origin!==window.location.origin||/\.(pdf|zip|jpe?g|png|gif|svg|webp|mp4|mp3)$/i.test(h.pathname)||h.pathname===window.location.pathname&&h.hash)return;let p=(c.textContent??"").replace(/\s+/g," ").trim();p===""||p.length>22||t.has(h.pathname)||t.set(h.pathname,{label:p,href:h.href})})}),[...t.values()].slice(0,6)};(()=>{let e=mo();if(e.length<2)return;let t=window.location.pathname.replace(/\/$/,"");e.forEach(n=>{let i=j("button","le-page-btn",n.label);i.type="button",i.title=n.href,new URL(n.href).pathname.replace(/\/$/,"")===t?i.classList.add("is-on"):i.addEventListener("click",()=>{sessionStorage.setItem("tb_editing","1"),window.location.href=n.href}),d.pageSwitcher.append(i)}),d.pageSwitcher.hidden=!1})();let Yo=(async()=>{let e=d.languagePicker;if(!e)return;let t;try{t=await(await B("/live-edit/translations",{method:"GET"})).json()}catch{return}let n=t?.locales??[],i=t?.default_locale??"en";if(n.length<2)return;n.forEach(l=>{let u=j("option",null,t?.names?.[l]??l.toUpperCase());u.value=l,e.append(u)});let c=window.liveEditLocale??i;if(e.value=c,e.hidden=!1,(t?.counts?.stale??0)>0&&c===i){let l=Object.keys(t?.needing_review??{}).length;m(l===1?`1 translation may need updating since the ${i.toUpperCase()} changed.`:`${l} languages have translations that may need updating.`)}let p=0;e.addEventListener("change",async()=>{let l=e.value,u=++p;e.disabled=!0;try{let f=await(await B(`/live-edit/content?locale=${encodeURIComponent(l)}`,{method:"GET"})).json();if(u!==p)return;window.liveEditLocale=l;let{applyContent:w}=await Promise.resolve().then(()=>(tt(),et));w(document,f?.settings??{}),m(l===i?"Editing the original.":`Editing in ${e.options[e.selectedIndex]?.text??l}. Saves here do not change the original.`)}catch{if(u!==p)return;e.value=window.liveEditLocale??i,m("Could not load that language. Nothing has been changed.")}finally{u===p&&(e.disabled=!1)}})})(),Ht=`live-edit:redo:${o?.site??window.location.host}`,ft=()=>{try{return JSON.parse(sessionStorage.getItem(Ht)??"[]")}catch{return[]}},Wt=e=>{try{sessionStorage.setItem(Ht,JSON.stringify(e.slice(-20)))}catch{}},Re=()=>{d.undoButton.disabled=(window.liveEditPublishing?.pending??0)===0,d.redoButton.disabled=ft().length===0};_t(Re),Re();let Vt=async()=>{d.undoButton.disabled=!0;let e;try{e=((await(await B("/live-edit/changes",{method:"GET"})).json())?.changes??[])[0]}catch(n){d.toast(V(n,"undo that")),Re();return}if(!e){d.toast("There is nothing left to undo. Everything is published."),Re();return}let t=Se(e);try{await B("/live-edit/changes",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:e.key,kind:e.kind})})}catch(n){d.toast(V(n,"undo that")),Re();return}Wt([...ft(),{key:e.key,kind:e.kind,value:e.after,label:t}]),O(`Undone: ${t}`)},Jt=async()=>{let e=ft(),t=e.pop();if(!t){d.toast("There is nothing to put back.");return}d.redoButton.disabled=!0;try{if(t.kind==="style")throw new Error("A styling change cannot be put back automatically yet.");await B("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:t.key,value:t.value,locale:window.liveEditLocale})})}catch(n){d.toast(V(n,"put that back")),d.redoButton.disabled=!1;return}Wt(e),O(`Put back: ${t.label}`)};d.undoButton.addEventListener("click",()=>void Vt()),d.redoButton.addEventListener("click",()=>void Jt()),document.addEventListener("keydown",e=>{!(e.metaKey||e.ctrlKey)||e.key.toLowerCase()!=="z"||(d.shadow.activeElement??document.activeElement)?.closest?.('input, textarea, [contenteditable="true"]')||(e.preventDefault(),e.shiftKey?Jt():Vt())}),d.closeButton.addEventListener("click",()=>Ae()),d.cancelButton.addEventListener("click",()=>Ae()),d.saveButton.addEventListener("click",Wn),M?.addEventListener("click",async()=>{!v||v.kind!=="record"||window.confirm("Delete this item?")&&(await B(`/live-edit/record/${v.type}/${v.id}`,{method:"DELETE"}),O("Deleted \u2713"))}),document.querySelectorAll("[data-live-create]").forEach(e=>{e.addEventListener("click",async()=>{await B("/live-edit/record/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:e.dataset.liveCreate})}),O("Added \u2713 \u2014 click it to edit")})});let bt=new URLSearchParams(window.location.search);if(bt.has("edit")){bt.delete("edit");let e=bt.toString();window.history.replaceState(null,"",window.location.pathname+(e?`?${e}`:"")),Te(!0)}else Te(sessionStorage.getItem("tb_editing")==="1")}};window.liveEditDisplayedValue=o=>xt({editValue:o.dataset.editValue,ownText:ce(o),fullText:o.textContent});var Ot=(()=>{let o=!1;return()=>{o||new URLSearchParams(window.location.search).get("live-edit")!=="off"&&(o=!0,Vo())}})();document.readyState==="complete"?Ot():(window.addEventListener("load",Ot,{once:!0}),window.setTimeout(Ot,2e3));
