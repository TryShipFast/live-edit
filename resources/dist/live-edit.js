var Bo=Object.defineProperty;var Ve=(n,o)=>()=>(n&&(o=n(n=0)),o);var At=(n,o)=>{for(var i in o)Bo(n,i,{get:o[i],enumerable:!0})};var fn,bn,mn,Mo,wn,yn,Ot,be,vn,xn,kn,st,Uo,lt,It=Ve(()=>{fn=n=>{let[o,...i]=String(n??"").split(":");return{kind:o,key:i.join(":"),parts:i}},bn=(n,o={})=>({...o,headers:{"X-CSRF-TOKEN":n,Accept:"application/json",...o.headers??{}}}),mn=n=>(n?.headers?.get?.("content-type")??"").includes("json"),Mo=/\.((?:fa|fas|far|fab|fal|fad|bi|ti|icon|flaticon|glyphicon|ion|mdi)-[a-z0-9][a-z0-9-]*)::?before/gi,wn=n=>{let o=[];for(let i of String(n??"").split("}")){let s=i.indexOf("{");if(s===-1)continue;let g=i.slice(s+1).match(/content\s*:\s*(["'])(.*?)\1/);if(!g)continue;let l=g[2].match(/^\\([0-9a-f]{1,6})\s*$/i),w=l?String.fromCodePoint(parseInt(l[1],16)):g[2];if([...w].length===1)for(let k of i.slice(0,s).matchAll(Mo))o.push({name:k[1],glyph:w})}return o},yn=(n,o,i,s,g)=>{let l=n.filter(w=>w!==i&&!s.includes(w));return g.forEach(w=>l.includes(w)||l.push(w)),l.push(o),l.join(" ")},Ot=({editValue:n,ownText:o,fullText:i})=>(n??"")!==""?n:(o??"").trim()!==""?o:i??"",be=n=>n.children.length?[...n.childNodes].filter(o=>o.nodeType===3).map(o=>o.textContent).join(""):n.textContent,vn=n=>{let o=new Set,i=[];for(let s of n)for(let g of s.icons)o.has(g.name)||(o.add(g.name),i.push({...g,face:s.face,variant:s.variant}));return i.sort((s,g)=>s.name.localeCompare(g.name))},xn=(n,o)=>{let i=Object.keys(o??{}),s=String(n??"").split(",").map(g=>g.trim()).filter(Boolean);return s.length===0?i:i.length===0?s:s.filter(g=>i.includes(g))},kn=(n,o={},i)=>{let s=String(i?.base??"").replace(/\/$/,""),[g,l]=String(n).split("?"),w={"/live-edit/setting":`${s}/${i?.site}/content`,"/live-edit/style":`${s}/${i?.site}/styles`,"/live-edit/publish":`${s}/${i?.site}/publish`,"/live-edit/image":`${s}/${i?.site}/media`,"/live-edit/upload":`${s}/${i?.site}/media`,"/live-edit/changes":`${s}/${i?.site}/changes`,"/live-edit/versions":`${s}/${i?.site}/versions`,"/live-edit/content":`${s}/${i?.site}/content`,"/live-edit/translations":`${s}/${i?.site}/translations`,"/live-edit/credits":`${s}/${i?.site}/credits`,"/live-edit/assist":`${s}/${i?.site}/assist`,"/live-edit/photos":`${s}/${i?.site}/photos`,"/live-edit/photos/used":`${s}/${i?.site}/photos/used`,"/live-edit/imagine":`${s}/${i?.site}/imagine`},k=i?.routes?.[g]??(g==="/live-edit/publish"?i?.publishUrl:null);if(k)return{url:l?`${k}?${l}`:k,init:{...o,headers:{...o.headers??{},...i.routeHeaders??i.publishHeaders??{},Accept:"application/json"},credentials:"same-origin"}};let A=w[g];if(!s||!i?.site||!i?.token)throw new Error("The content API is not configured on this page.");if(!A)throw new Error(`Editing that is not available over the content API yet (${g}).`);return{url:l?`${A}?${l}`:A,init:{...o,headers:{...o.headers??{},Authorization:`Bearer ${i.token}`,Accept:"application/json"}}}},st=(n,o,i)=>n.hasAttribute(o)?n.getAttribute(o):n.dataset?.[i]??"",Uo=(n,o)=>o==null?!0:o===408||o===425||o===429||o>=500,lt=async(n,{tries:o=3,waits:i=[200,500],sleep:s=null}={})=>{let g=s??(w=>new Promise(k=>setTimeout(k,w))),l=null;for(let w=0;w<o;w++)try{return await n()}catch(k){if(l=k,w===o-1||!Uo(k,k.status))throw k;await g(i[Math.min(w,i.length-1)])}throw l}});var jt={};At(jt,{applyTags:()=>Pt,autoTag:()=>dt,elementAt:()=>Sn,ensureBackgroundsAreFound:()=>Yo,fingerprint:()=>En,refreshBackgrounds:()=>Vo,resolveBackgrounds:()=>Bt,watchForLateBackgrounds:()=>An});var _o,En,Sn,Pt,Wo,Ho,Cn,Ln,Bt,Yo,Vo,An,dt,Rt=Ve(()=>{_o="kb_tags_",En=n=>{let o=2166136261;for(let i=0;i<n.length;i++)o^=n.charCodeAt(i),o=Math.imul(o,16777619);return(o>>>0).toString(16)},Sn=(n,o)=>{let i=n.documentElement;for(let s of o)if(i=[...i?.children??[]][s],!i)return null;return i},Pt=(n,o)=>{let i=0;for(let{at:s,attributes:g}of o??[]){let l=Sn(n,s);if(l){for(let[w,k]of Object.entries(g))l.hasAttribute(w)||l.setAttribute(w,k);i++}}return i},Wo=n=>{try{return JSON.parse(window.sessionStorage?.getItem(n)??"null")}catch{return null}},Ho=(n,o)=>{try{window.sessionStorage?.setItem(n,JSON.stringify(o))}catch{}},Cn=n=>n.hasAttribute("data-kb-bg")||n.hasAttribute("data-background")||n.hasAttribute("data-bg")||n.hasAttribute("data-background-image")||/background-image|url\(/i.test(n.getAttribute("style")??""),Ln=(n,o)=>{if(Cn(n))return!1;let i=o.getComputedStyle(n).backgroundImage;if(!i||i==="none"||!i.includes("url("))return!1;let s=i.match(/url\(\s*["']?([^"')]+)/)?.[1];return!s||s.startsWith("data:")?!1:(n.setAttribute("data-kb-bg",s),!0)},Bt=(n=document)=>{let o=n.defaultView??window;if(!o?.getComputedStyle)return 0;let i=0;for(let s of n.querySelectorAll("body *"))Ln(s,o)&&i++;return i},Yo=async(n,o=document)=>{let i=o.defaultView??window;if(i.liveEditBackgroundsWatched)return 0;i.liveEditBackgroundsWatched=!0;let s=await dt(n,o);return An(o,()=>{dt(n,o).catch(g=>{console.warn("[live-edit] could not tag a late background:",g.message)})}),s},Vo=async(n,o=document)=>Bt(o)===0&&o.querySelector("[data-kb-bg]:not([data-edit-bg])")===null?0:dt(n,o),An=(n=document,o=()=>{})=>{let i=n.defaultView??window;if(!i?.IntersectionObserver||!i.getComputedStyle)return null;let s=new Set,g=null,l=()=>{if(g=null,s.size===0)return;let N=[...s];s.clear(),o(N)},w=5,k=new WeakMap,A=N=>{if(Ln(N,i))return s.add(N),P.unobserve(N),g||(g=i.setTimeout(l,250)),!0;let ee=(k.get(N)??0)+1;return k.set(N,ee),ee>=w&&P.unobserve(N),!1},P=new i.IntersectionObserver(N=>{for(let ee of N){if(!ee.isIntersecting)continue;let H=ee.target;A(H)||i.setTimeout(()=>A(H),400)}},{rootMargin:"300px"}),R=[...n.querySelectorAll("body *")].filter(N=>!Cn(N)),O=4e3;return R.length>O&&console.warn(`[live-edit] watching the first ${O} of ${R.length} elements for late backgrounds`),R.slice(0,O).forEach(N=>P.observe(N)),P},dt=async({base:n,site:o,key:i,page:s},g=document)=>{let l=g.querySelector("[data-edit], [data-edit-img]")!==null;if(Bt(g),l&&!(g.querySelector("[data-kb-bg]:not([data-edit-bg])")!==null))return 0;let k=g.documentElement.outerHTML,A=_o+En(k),P=Wo(A);if(P)return Pt(g,P);let R=await fetch(`${String(n).replace(/\/$/,"")}/${o}/tag`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json",Authorization:`Bearer ${i}`},body:JSON.stringify({html:k,page:s??g.location?.pathname??""})});if(!R.ok)throw new Error(`Tagging answered ${R.status}`);let{elements:O}=await R.json();return Ho(A,O),Pt(g,O)}});var Jo,Go,Ko,Tn,Nn,$n=Ve(()=>{Jo=new Set(["svg","g","defs","symbol","use","title","desc","path","circle","ellipse","line","polygon","polyline","rect","text","tspan","textpath","lineargradient","radialgradient","stop","clippath","mask","pattern"]),Go=new Set(["viewbox","xmlns","width","height","fill","fill-rule","fill-opacity","stroke","stroke-width","stroke-linecap","stroke-linejoin","stroke-dasharray","stroke-dashoffset","stroke-opacity","stroke-miterlimit","opacity","d","points","x","y","x1","y1","x2","y2","cx","cy","r","rx","ry","transform","offset","stop-color","stop-opacity","gradientunits","gradienttransform","patternunits","clip-rule","clip-path","mask","id","class","role","aria-label","aria-hidden","focusable","preserveaspectratio","vector-effect","text-anchor","font-size","font-family"]),Ko=8,Tn=n=>{let o=String(n??"").trim();if(o===""||!/<svg/i.test(o))return null;let i=new DOMParser().parseFromString(o,"image/svg+xml"),s=i.documentElement;return!s||s.tagName?.toLowerCase()!=="svg"||i.querySelector("parsererror")||(Nn(s),s.children.length===0&&s.textContent.trim()==="")?null:s},Nn=n=>{for(let o of[...n.childNodes]){if(o.nodeType===Ko){o.remove();continue}if(o.nodeType===1){if(!Jo.has(o.tagName.toLowerCase())){o.remove();continue}Nn(o)}}for(let o of[...n.attributes]){let i=o.name.toLowerCase(),s=o.value,l=i==="href"||i==="xlink:href"?s.trim().startsWith("#"):Go.has(i);l&&/url\(/i.test(s)&&!/^url\(\s*#/i.test(s.trim())&&(l=!1),l||n.removeAttribute(o.name)}}});var ct={};At(ct,{applyBackground:()=>Rn,applyContent:()=>Fn,applyIcon:()=>jn,applyOrder:()=>zn,applyStyles:()=>Mn,applySvg:()=>Bn,applyValue:()=>Ft,defendContent:()=>Dn,fetchContent:()=>_n,fetchSnapshot:()=>Un,resolve:()=>Wn,styleRules:()=>qn});var zt,On,Xo,Qo,Ft,Zo,Dt,ea,ta,na,In,oa,Bn,jn,Rn,zn,Fn,Dn,qn,Mn,Un,_n,Pn,aa,Wn,pt=Ve(()=>{$n();It();zt=(n,o)=>Object.assign(new Error(n),{status:o}),On="setting:",Xo=(n,o)=>{let i=n.currentSrc||n.getAttribute("src")||"";if(i!==""&&new URL(i,document.baseURI).href===new URL(o,document.baseURI).href)return;let g=i!==""&&n.complete;if(n.setAttribute("src",o),!g)return;n.style.transition="opacity 120ms ease-out",n.style.opacity="0";let l=()=>{n.style.opacity="1",setTimeout(()=>{n.style.removeProperty("transition"),n.style.removeProperty("opacity")},160)};if(n.decode){n.decode().then(l,l);return}n.addEventListener("load",l,{once:!0}),n.addEventListener("error",l,{once:!0})},Qo=(n,o)=>{for(let i of n.querySelectorAll("[data-edit-img]")){let s=(i.getAttribute("data-edit-img")??"").replace(/^setting:/,""),g=o[s];if(typeof g!="string"||g==="")continue;let l=i.currentSrc||i.getAttribute("src")||"";if(l!==""&&new URL(l,document.baseURI).href===new URL(g,document.baseURI).href)continue;let w=new Image;w.decoding="async",w.src=g}},Ft=(n,o,{keepRuns:i=!1}={})=>{let s=n.tagName?.toLowerCase();if(s==="img"){Xo(n,o),Zo(n);return}if(s==="source"){n.setAttribute("srcset",o);return}Dt(n,o,i)},Zo=n=>{if(n.removeAttribute("srcset"),n.removeAttribute("sizes"),n.parentElement?.tagName==="PICTURE")for(let o of[...n.parentElement.children])o.tagName==="SOURCE"&&o.remove()},Dt=(n,o,i=!1)=>{let s=[...n.childNodes].filter(z=>z.nodeType===oa);if(s.length===0){let z=[...n.children];if(z.length===1&&z[0].children.length===0){Dt(z[0],o);return}n.append(o);return}if(s.length===1){In(s[0],o);return}let g=s.map(z=>z.nodeValue),l=g.join(""),w=0;for(;w<l.length&&w<o.length&&l[w]===o[w];)w+=1;let k=0;for(;k<l.length-w&&k<o.length-w&&l[l.length-1-k]===o[o.length-1-k];)k+=1;let A=w,P=l.length-k,R=o.slice(w,o.length-k),O=0,N=!1,ee=g.map(z=>{let E=O,_=O+z.length;return O=_,N||A<E||P>_?z:(N=!0,z.slice(0,A-E)+R+z.slice(P-E))});if(N){s.forEach((z,E)=>{z.nodeValue=ee[E]});return}let H=na(g,o);if(H!==null){s.forEach((z,E)=>{z.nodeValue=H[E]});return}In(s[0],o),s.slice(1).forEach(z=>{if(i){z.nodeValue="";return}z.remove()})},ea=(n,o)=>{let i=n.length,s=o.length,g=s+1,l=new Int32Array((i+1)*g);for(let k=i-1;k>=0;k-=1)for(let A=s-1;A>=0;A-=1)l[k*g+A]=n[k]===o[A]?l[(k+1)*g+A+1]+1:Math.max(l[(k+1)*g+A],l[k*g+A+1]);let w=[];for(let k=0,A=0;k<i&&A<s;)n[k]===o[A]?(w.push([k,A]),k+=1,A+=1):l[(k+1)*g+A]>=l[k*g+A+1]?k+=1:A+=1;return w},ta=(n,o)=>{let i=new Map(n.map(([g,l])=>[g,l])),s=g=>{let l=0;for(let w=g<0?o-1:o;i.has(w);w+=g){let k=i.get(w+g);if(l+=1,k===void 0||Math.abs(k-i.get(w))!==1)break}return l};return Math.max(s(-1),s(1))},na=(n,o)=>{let i=n.join("");if(i.length===0||o.length===0||i.length*o.length>25e4)return null;let s=ea(i,o),g=new Map(s.map(([A,P])=>[A,P])),l=[],w=0,k=0;for(let A of n.slice(0,-1)){if(k+=A.length,ta(s,k)<3)return null;let P=w;for(let R=k-1;R>=0;R-=1)if(g.has(R)){P=Math.max(w,g.get(R)+1);break}l.push(o.slice(w,P)),w=P}return l.push(o.slice(w)),l},In=(n,o)=>{let i=n.nodeValue,s=/^\s/.test(i)&&!/^\s/.test(o)?" ":"",g=/\s$/.test(i)&&!/\s$/.test(o)?" ":"";n.nodeValue=s+o+g},oa=3,Bn=(n,o)=>{let i=Tn(o);if(!i)return!1;let s=document.importNode(i,!0);for(let g of["class","width","height","style","data-edit-svg","data-edit-label"])n.hasAttribute(g)&&s.setAttribute(g,n.getAttribute(g));return n.replaceWith(s),!0},jn=(n,o)=>{let i=String(o).replace(/[^A-Za-z0-9_\- ]/g,"").split(/\s+/).filter(Boolean),s=n.getAttribute("data-edit-icon-current");if(i.length===0||!s)return!1;let g=i.length===1?(n.getAttribute("class")??"").trim().split(/\s+/).map(l=>l===s?i[0]:l):i;return n.setAttribute("class",g.join(" ")),n.setAttribute("data-edit-icon-current",i.length===1?i[0]:i[i.length-1]),!0},Rn=(n,o)=>{for(let s of["data-background","data-bg","data-background-image"])n.hasAttribute(s)&&n.setAttribute(s,o);let i=(n.getAttribute("style")??"").replace(/background-image\s*:[^;]*;?/gi,"").trim();n.setAttribute("style",`${i?i.replace(/;?$/,";"):""}background-image:url('${o}')`)},zn=(n,o)=>{let i=0;for(let s of n.querySelectorAll("[data-edit-list]")){let g=s.getAttribute("data-edit-list");if(!Object.hasOwn(o,g))continue;let l;try{l=JSON.parse(o[g])}catch{continue}if(!Array.isArray(l)||l.length===0)continue;let w=new Map;for(let A of[...s.children])A.hasAttribute("data-edit-item")&&(w.set(A.getAttribute("data-edit-item"),A),s.removeChild(A));if(w.size===0)continue;let k=w.values().next().value;for(let A of l){let P=w.get(String(A));if(P){s.appendChild(P);continue}let R=k.cloneNode(!0);R.setAttribute("data-edit-item",String(A)),s.appendChild(R)}i++}return i},Fn=(n,o)=>{let i=0;zn(n,o),Qo(n,o);for(let s of n.querySelectorAll("[data-edit]")){let g=s.getAttribute("data-edit")??"";if(!g.startsWith(On))continue;let l=g.slice(On.length);Object.hasOwn(o,l)&&(Ft(s,o[l]),i++)}for(let s of n.querySelectorAll("[data-edit-img]")){let g=(s.getAttribute("data-edit-img")??"").replace(/^setting:/,"");Object.hasOwn(o,g)&&(Ft(s,o[g]),o[g]?s.dataset.editPreview=o[g]:delete s.dataset.editPreview,i++);for(let[l,w]of[["Alt","alt"],["Title","title"],["Srcset","srcset"]])if(Object.hasOwn(o,g+l)){let k=o[g+l];k===""&&w!=="alt"?s.removeAttribute(w):s.setAttribute(w,k),i++}}for(let s of n.querySelectorAll("[data-edit-svg]")){let g=(s.getAttribute("data-edit-svg")??"").replace(/^setting:/,""),l=o[g];!Object.hasOwn(o,g)||String(l??"").trim()===""||Bn(s,l)&&i++}for(let s of n.querySelectorAll("[data-edit-icon]")){let g=(s.getAttribute("data-edit-icon")??"").replace(/^setting:/,""),l=o[g];!Object.hasOwn(o,g)||l===""||jn(s,l)&&i++}for(let s of n.querySelectorAll("[data-edit-bg]")){let g=(s.getAttribute("data-edit-bg")??"").replace(/^setting:/,""),l=o[g];!Object.hasOwn(o,g)||l===""||(Rn(s,l),i++)}for(let s of n.querySelectorAll("[data-edit-href]")){let g=s.getAttribute("data-edit-href");Object.hasOwn(o,g)&&(s.setAttribute("href",o[g]),i++)}return i},Dn=(n,{limit:o=12,debounce:i=60}={})=>{let s=n.defaultView??(typeof window>"u"?null:window);if(!s?.MutationObserver)return null;let g=n.querySelectorAll("[data-edit], [data-edit-img], [data-edit-href]");if(g.length===0)return null;let l=new Map;for(let O of g)l.set(O,{words:O.hasAttribute("data-edit")?be(O):null,src:O.getAttribute("src"),href:O.hasAttribute("data-edit-href")?O.getAttribute("href"):null});let w=0,k=!1,A=null,P=()=>{if(A=null,!n.body?.classList?.contains("editing")){w++,k=!0;for(let[O,N]of l)O.isConnected&&(N.words!==null&&be(O)!==N.words&&Dt(O,N.words),N.src!==null&&O.getAttribute("src")!==N.src&&(O.setAttribute("src",N.src),O.removeAttribute("srcset")),N.href!==null&&O.getAttribute("href")!==N.href&&O.setAttribute("href",N.href));R.takeRecords(),k=!1,w>=o&&(R.disconnect(),console.warn(`[live-edit] this page keeps rewriting itself; the client's content was put back ${w} times and is now being left alone.`))}},R=new s.MutationObserver(()=>{k||A||w>=o||(A=s.setTimeout(P,i))});for(let O of g)R.observe(O,{characterData:!0,childList:!0,subtree:!0,attributes:!0,attributeFilter:["src","srcset","href"]});return R},qn=(n,o)=>{let i=`[data-style="${n}"]`,s="",g="";for(let[l,w]of Object.entries(o??{}))if(!(w===""||w===null||w===void 0)){if(l==="hidden"){s+=`body:not(.editing) ${i}{display:none !important}`,s+=`body.editing ${i}{opacity:.45}`;continue}g+={backgroundImage:`background-image:url('${w}') !important;background-size:cover !important;background-position:center !important;`,background:`background:${w} !important;`,textColor:`color:${w} !important;`,fontSize:`font-size:${w}px !important;`,radius:`border-radius:${w}px !important;`,paddingX:`padding-left:${w}px !important;padding-right:${w}px !important;`,paddingY:`padding-top:${w}px !important;padding-bottom:${w}px !important;`}[l]??""}return g===""?s:s+`${i}{${g}}`},Mn=(n,o)=>{let i=Object.entries(o??{}).map(([w,k])=>qn(w,k)).join("");if(i==="")return 0;let s="live-edit-styles",g=n.getElementById?.(s)??n.querySelector?.(`#${s}`)??null,l=g??n.createElement("style");return l.id=s,l.textContent=i,g||(n.head??n.body)?.appendChild(l),Object.keys(o).length},Un=async({snapshot:n,locale:o})=>{let i=String(n).replace(/\/$/,""),s=await lt(()=>fetch(`${i}/current.json`).then(l=>{if(!l.ok)throw zt(`Pointer answered ${l.status}`,l.status);return l.json()}));if(!s.version)return{settings:{},styles:{}};let g=o??"en";return lt(async()=>{let l=await fetch(`${i}/v${s.version}/${g}.json`);if(!l.ok)throw zt(`Version answered ${l.status}`,l.status);return l.json()})},_n=async({base:n,site:o,key:i,locale:s})=>{let g=`${String(n).replace(/\/$/,"")}/${o}/content${s?`?locale=${encodeURIComponent(s)}`:""}`;return lt(async()=>{let l=await fetch(g,{headers:{Authorization:`Bearer ${i}`,Accept:"application/json"}});if(!l.ok)throw zt(`Content service answered ${l.status}`,l.status);return l.json()})},Pn=async()=>{let n=typeof window<"u"?window.liveEditContent:null;if(!n)return;let o=null,i=null;try{let s=await Wn(n);s&&(s.styleProps&&(window.liveEditStyleProps=s.styleProps),typeof s.pending=="number"&&s.styleProps&&(window.liveEditPublishing={...window.liveEditPublishing??{},pending:s.pending}),o=Fn(document,s.settings??{}),Mn(document,s.styles??{}),window.liveEditStyles=s.styles??{},Dn(document))}catch(s){i=s,console.warn("[live-edit] serving the words already in the page:",s.message)}aa({applied:o,failed:i?i.message:null})},aa=n=>{window.liveEditContentDone=n,document.dispatchEvent(new CustomEvent("live-edit:content",{detail:n}))},Wn=async n=>{if(n.snapshot)try{return await Un(n)}catch(o){let i=o.message.includes("fetch")?" (if the files are on another origin, the bucket or CDN must allow cross-origin reads)":"";if(!n.base)throw new Error(o.message+i);console.warn("[live-edit] falling back to the content API:",o.message+i)}return n.base&&n.site&&n.key?_n(n):null};typeof document<"u"&&(document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Pn):Pn())});var Gn={};At(Gn,{collectFromFragment:()=>Yn,contentConfigFor:()=>la,currentSession:()=>sa,forget:()=>ia,requestLink:()=>ra,store:()=>Vn,stored:()=>Jn});var qt,Hn,Yn,Vn,Jn,ia,ra,sa,la,Kn=Ve(()=>{qt="kb_session",Hn="kb_session=",Yn=(n=window)=>{let o=n.location?.hash??"",i=o.indexOf(Hn);if(i===-1)return null;let s=decodeURIComponent(o.slice(i+Hn.length).split("&")[0]);if(s==="")return null;Vn(s,n);let g=o.slice(0,i).replace(/[#&]$/,"");return n.history?.replaceState?.(null,"",n.location.pathname+n.location.search+g),s},Vn=(n,o=window)=>{try{o.sessionStorage?.setItem(qt,n)}catch{}},Jn=(n=window)=>{try{return n.sessionStorage?.getItem(qt)??null}catch{return null}},ia=(n=window)=>{try{n.sessionStorage?.removeItem(qt)}catch{}},ra=async({base:n,site:o},i,s=window)=>(await fetch(`${String(n).replace(/\/$/,"")}/sign-in`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({site:o,email:i,return_to:s.location.origin+s.location.pathname})})).ok,sa=(n=window)=>Yn(n)??Jn(n),la=(n,o)=>{let i={base:n.api,site:n.site,locale:n.locale??null};return o?{...i,key:o,snapshot:null}:{...i,key:n.key,snapshot:n.snapshot??null}}});var jo=`
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
`,Ro=`
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
`,L=(n,o,i)=>{let s=document.createElement(n);return o&&(s.className=o),i!==void 0&&(s.textContent=i),s};function rn(){let n=document.createElement("style");n.id="live-edit-page-css",n.textContent=Ro,document.head.append(n);let o=document.createElement("div");o.id="live-edit-ui",document.body.append(o);let i=o.attachShadow({mode:"open"}),s=document.createElement("style");s.textContent=jo,i.append(s);let g=window.liveEditToolbar??{},l=L("div","le-toolbar"),w=window.liveEditEditor?.console??null,k=L(w?"a":"span","le-mark");k.innerHTML='<svg width="16" height="16" viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="3" width="20" height="20" rx="3" fill="none" stroke="#0B0C0F" stroke-width="2.5"/><path d="M16 15 L16 30 L19.6 26.4 L22.2 31.2 L24.6 30 L22 25.3 L27 25.3 Z" fill="#3148F5" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>',w&&(k.href=w,k.target="_blank",k.rel="noopener",k.title="Your dashboard: licence, editors, settings",k.setAttribute("aria-label","Open your dashboard"));let A=L("span","le-status le-when-roomy"),P=L("span","le-dot"),R=L("span",null,"");A.append(P,R),l.append(k,A);let O=window.liveEditEditor??null;if(O?.greeting){let B=L("span","le-hello le-when-roomy","Welcome "+O.greeting);l.append(B)}let N=null,ee=g.locales??{};Object.keys(ee).length>1&&(N=L("select","le-locale"),N.title="Language you are editing",Object.entries(ee).forEach(([B,F])=>{let Y=L("option",null,F);Y.value=B,Y.selected=B===(g.locale??"en"),N.append(Y)}),N.addEventListener("change",()=>{window.location.search="?locale="+N.value}),l.append(N));let H=L("button","le-bar-btn","Edit site");H.type="button";let z=B=>'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"'+(B?' style="transform: scaleX(-1)"':"")+'><path d="M9 14 4 9l5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 9h7a6 6 0 0 1 0 12H8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',E=L("button","le-round");E.type="button",E.title="Undo the last change you have not published",E.setAttribute("aria-label","Undo"),E.innerHTML=z(!1);let _=L("button","le-round");_.type="button",_.title="Put back what you just undid",_.setAttribute("aria-label","Redo"),_.innerHTML=z(!0);let ce=L("div","le-pages");ce.hidden=!0,ce.setAttribute("role","group"),ce.setAttribute("aria-label","Pages");let pe=L("select","le-lang");pe.hidden=!0,pe.title="Which language you are editing",pe.setAttribute("aria-label","Language");let X=L("button","le-bar-btn le-when-roomy","Changes");X.type="button",X.title="Everything you have changed and not published";let oe=L("button","le-bar-btn le-when-roomy","Preview");oe.type="button",oe.title="See the page the way a visitor will",oe.hidden=!0;let v=L("button","le-publish");v.type="button",v.title="Put your changes live",v.hidden=!0;let Ee=L("span",null,"Publish"),te=L("span","le-publish-count");if(te.hidden=!0,v.append(Ee,te),l.append(L("span","le-sep"),H,E,_,L("span","le-sep"),ce,pe,X,oe,v),(g.links??[]).forEach(B=>{let F=L("a","le-btn-ghost",B.label);F.href=B.href,B.title&&(F.title=B.title),l.append(F)}),g.logout?.href)if((g.logout.method??"get").toLowerCase()==="post"){let B=document.createElement("form");B.method="POST",B.action=g.logout.href;let F=document.createElement("input");F.type="hidden",F.name="_token",F.value=document.body.dataset.csrf??"";let Y=L("button","le-btn-ghost","Log out");Y.type="submit",B.append(F,Y),l.append(B)}else{let B=L("a","le-btn-ghost","Log out");B.href=g.logout.href,l.append(B)}let ue=L("div","le-drawer");ue.setAttribute("role","dialog"),ue.setAttribute("aria-modal","true"),ue.setAttribute("aria-label","Edit content");let Se=L("div","le-drawer-head"),Fe=L("div","le-tabs");Fe.setAttribute("role","tablist");let De={};["Edit","Changes","History"].forEach(B=>{let F=L("button","le-tab",B);F.type="button",F.dataset.tab=B,F.setAttribute("role","tab"),B==="Edit"&&F.classList.add("is-on"),De[B]=F,Fe.append(F)});let Ce=L("button","le-close","\xD7");Ce.type="button",Ce.setAttribute("aria-label","Close"),Se.append(Fe,Ce);let qe=L("div","le-subject"),Je=L("div","le-trail"),Ge=L("div","le-title","Text");qe.append(L("div","le-eyebrow","Selected"),Je,Ge);let Le=L("div","le-fields"),Me=L("div","le-foot"),Ae=L("button","le-btn-danger le-start le-hidden","Delete");Ae.type="button";let Te=L("button","le-btn-outline","Cancel");Te.type="button";let Ne=L("button","le-btn","Save changes");Ne.type="button",Me.append(Ae,Te,Ne),ue.append(Se,qe,Le,Me);let ie=L("button","le-handle");ie.type="button",ie.setAttribute("aria-label","Edit this link"),ie.innerHTML="&#9998;";let re=L("button","le-handle le-handle-bg");re.type="button",re.setAttribute("aria-label","Replace this background image"),re.title="Replace background image",re.textContent="Replace background";let me=L("div","le-hover"),Ue=L("span","le-hover-label");return me.append(Ue),i.append(l,ue,ie,re,me),{root:o,shadow:i,toolbar:l,toggleButton:H,undoButton:E,redoButton:_,pageSwitcher:ce,languagePicker:pe,statusText:R,dot:P,localeSelect:N,drawer:ue,drawerFoot:Me,drawerTabs:De,drawerSubject:qe,drawerTitle:Ge,drawerTrail:Je,drawerFields:Le,drawerDelete:Ae,publishButton:v,publishLabel:Ee,publishCount:te,previewButton:oe,changesButton:X,closeButton:Ce,cancelButton:Te,saveButton:Ne,linkHandle:ie,bgHandle:re,hoverBox:me,hoverLabel:Ue,toast:(B,F=1800)=>{let Y=L("div","le-toast",B);i.append(Y),setTimeout(()=>Y.style.opacity="0",F),setTimeout(()=>Y.remove(),F+600)},modal:({title:B,subtitle:F,size:Y="",dismissable:J=!0}={})=>{let W=L("div","le-scrim"),he=L("div",`le-modal ${Y}`.trim());he.setAttribute("role","dialog"),he.setAttribute("aria-modal","true");let Ke=L("div","le-modal-heading"),Xe=L("div","le-modal-title",B??""),$e=L("div","le-modal-sub",F??"");$e.hidden=!F,Ke.append(Xe,$e),he.setAttribute("aria-label",B??"Dialog");let ge=L("button","le-close","\xD7");ge.type="button",ge.setAttribute("aria-label","Close");let Qe=L("div","le-modal-head");Qe.append(Ke,ge);let _e=L("div","le-modal-tabs");_e.hidden=!0;let Ze=L("div","le-modal-body"),we=L("div","le-modal-foot");we.hidden=!0,he.append(Qe,_e,Ze,we),W.append(he);let gt=document.activeElement,et=!1,fe=()=>{et||(et=!0,document.removeEventListener("keydown",Oe,!0),W.remove(),gt?.focus?.(),Ie.dismissable=!0)},Oe=G=>{G.key==="Escape"&&Ie.dismissable&&(G.stopPropagation(),fe())},Ie={dismissable:J};return ge.addEventListener("click",fe),W.addEventListener("mousedown",G=>{G.target===W&&Ie.dismissable&&fe()}),document.addEventListener("keydown",Oe,!0),i.append(W),ge.focus(),{card:he,body:Ze,foot:we,tabs:_e,close:fe,title:G=>Xe.textContent=G,subtitle:G=>{$e.textContent=G??"",$e.hidden=!G},allowDismiss:G=>{Ie.dismissable=G,ge.hidden=!G}}}}}var rt=n=>Math.min(Math.max(Math.round(n),1),4e3),Tt=n=>{if(!n)return null;let o=Number(n.naturalWidth??0),i=Number(n.naturalHeight??0),s=n.getBoundingClientRect?.(),g=s&&s.width>=1&&s.height>=1?{width:rt(s.width),height:rt(s.height),exact:!1}:null;return o>=1&&i>=1&&(g===null||o>=s.width*2&&i>=s.height*2)?{width:rt(o),height:rt(i),exact:!0}:g},sn=(n,o)=>{let i=n.width,s=i/o;return s>n.height&&(s=n.height,i=s*o),{x:(n.width-i)/2,y:(n.height-s)/2,width:i,height:s}},ln=(n,o,i)=>{let s=i/(o||1);return{x:Math.max(0,Math.round(n.x*s)),y:Math.max(0,Math.round(n.y*s)),width:Math.max(1,Math.round(n.width*s)),height:Math.max(1,Math.round(n.height*s))}},dn=(n,o,i)=>{let s=(g,l)=>Math.max(0,Math.min(g,l));return{...n,x:s(n.x+o.x,i.width-n.width),y:s(n.y+o.y,i.height-n.height)}};var cn=n=>Object.entries(n??{}).filter(([,o])=>String(o??"")!==""),pn=n=>[...n??[]].filter(o=>o.value!==(o.dataset?.imgAttrWas??""));var $t="kb_verify",un=(n,o=globalThis)=>{try{o.sessionStorage?.setItem($t,JSON.stringify(n))}catch{}},hn=(n=globalThis)=>{try{let o=n.sessionStorage?.getItem($t);return n.sessionStorage?.removeItem($t),o?JSON.parse(o):null}catch{return null}},zo=(n,o)=>!o?.attr||!o?.marker?null:n.querySelector(`[${o.attr}="${o.marker.replace(/"/g,'\\"')}"]`),Fo=(n,o)=>{if(!n)return null;if(o==="image"){let s=Do(n);return s?s.getAttribute("src"):null}if(o==="href")return n.getAttribute("href");if(o==="icon")return n.getAttribute("class")??"";let i=[...n.childNodes].filter(s=>s.nodeType===3).map(s=>s.textContent).join(" ").trim();return de(i===""?n.textContent:i)},Do=n=>n.tagName?.toLowerCase()==="img"?n:n.querySelector("img")??n.parentElement?.querySelector("img")??null,de=n=>String(n??"").replace(/\s+/g," ").trim(),qo=(n,o,i)=>{if(i===null)return!1;if(n==="image")return Nt(i)!==""&&Nt(i)===Nt(o);if(n==="icon"){let s=de(o).split(" ").filter(Boolean),g=de(i).split(" ").filter(Boolean);return s.length>0&&s.every(l=>g.includes(l))}return n==="href"?de(i)===de(o)||de(i).endsWith(de(o)):de(i)===de(o)},Nt=n=>String(n??"").split(/[?#]/)[0].split("/").filter(Boolean).pop()??"",gn=(n,o)=>{if(!o?.kind)return null;let i=zo(n,o);if(!i)return null;let s=Fo(i,o.kind);return{ok:qo(o.kind,o.value,s),wanted:o.value,saw:s,kind:o.kind}};It();var da=()=>{let n=window.liveEditApi;n?.base&&n?.site&&Promise.resolve().then(()=>(Rt(),jt)).then(i=>i.ensureBackgroundsAreFound({base:n.base,site:n.site,key:n.token})).catch(i=>console.warn("[live-edit] could not look for backgrounds:",i.message)),window.liveEditContent||Promise.resolve().then(()=>(pt(),ct)).then(i=>i.defendContent(document)).catch(i=>console.warn("[live-edit] could not guard this page's content:",i.message));let o=document.querySelector("[data-login-modal]");if(o){let i=()=>{o.classList.remove("hidden"),o.classList.add("flex"),o.querySelector("input[type=email]")?.focus()},s=()=>{o.classList.add("hidden"),o.classList.remove("flex")};document.querySelectorAll("[data-login-open]").forEach(g=>{g.addEventListener("click",l=>{l.preventDefault(),i()})}),o.querySelector("[data-login-close]")?.addEventListener("click",s),o.addEventListener("click",g=>{g.target===o&&s()}),o.dataset.error==="1"&&i()}if(document.body.hasAttribute("data-admin")){let i=document.body.dataset.csrf,s=()=>{sessionStorage.setItem("tb_scroll",String(window.scrollY)),window.location.reload()},g=sessionStorage.getItem("tb_scroll");g!==null&&(sessionStorage.removeItem("tb_scroll"),window.scrollTo(0,Number(g)));let l=rn(),w=e=>l.toast(String(e??"").trim()||"Something went wrong.",9e3),k=sessionStorage.getItem("tb_toast");k&&(sessionStorage.removeItem("tb_toast"),l.toast(k));let A=()=>new Promise(e=>{if(!window.liveEditContent||window.liveEditContentDone){e(window.liveEditContentDone??null);return}let t=a=>e(a?.detail??null);document.addEventListener("live-edit:content",t,{once:!0}),setTimeout(()=>e(null),5e3)});A().then(e=>{let t=hn();if(e?.failed){l.toast(t?"Saved \u2014 but this page could not load the latest content, so it may be showing an older version. Reload to try again.":"This page could not load your saved content, so it is showing the original. Nothing has been lost \u2014 reload to try again.",9e3);return}let a=t?gn(document,t):null;a&&!a.ok&&(console.warn("[live-edit] the change was saved but the page still shows:",a.saw,`
  expected:`,a.wanted),l.toast("Saved \u2014 but this page is still showing the old version. Your change is stored; reload, and tell us if it stays this way.",9e3))});let P=e=>{sessionStorage.setItem("tb_toast",e),s()},R=(e,t=null,a=null)=>{let r=window.__liveEditReact;if(!r){P(e);return}let d=t!==null&&(r.apply??r.set)(t,a);l.toast(e),d||r.refresh()},{drawer:O,drawerTabs:N,drawerSubject:ee,drawerTitle:H,drawerTrail:z,drawerFields:E,drawerDelete:_,toggleButton:ce,statusText:pe,linkHandle:X,bgHandle:oe}=l,v=null,Ee=(e,t,a,r,d=!1)=>{let h=document.createElement("label");h.className="le-field",h.append(t);let p=e==="icon"?window.liveEditIcons:(window.liveEditSelects??{})[e],c=document.querySelector("[data-icon-templates]");if(e==="icon"&&Array.isArray(p)&&c){let u=document.createElement("input");u.type="hidden",u.name=e,u.value=a??"";let m=document.createElement("div");return m.className="le-icons",p.forEach(y=>{let b=document.createElement("button");b.type="button",b.title=y,b.dataset.iconChoice=y,b.className="le-icon"+(y===u.value?" is-active":"");let x=c.querySelector(`template[data-icon="${y}"]`);x?b.append(x.content.cloneNode(!0)):b.textContent=y,b.addEventListener("click",()=>{u.value=y,m.querySelectorAll("[data-icon-choice]").forEach(S=>{let C=S.dataset.iconChoice===y;S.className="le-icon"+(C?" is-active":"")}),u.dispatchEvent(new Event("input",{bubbles:!0}))}),m.append(b)}),h.append(u,m),h}if(Array.isArray(p)&&p.length<=6){let u=document.createElement("input");u.type="hidden",u.name=e,u.value=a??p[0];let m=document.createElement("div");return m.className="le-choices",p.forEach(y=>{let b=document.createElement("label");b.className="le-choice"+(y===u.value?" is-selected":"");let x=document.createElement("input");x.type="radio",x.name="le-choice-"+e,x.checked=y===u.value,x.addEventListener("change",()=>{u.value=y,m.querySelectorAll(".le-choice").forEach(S=>S.classList.remove("is-selected")),b.classList.add("is-selected"),u.dispatchEvent(new Event("input",{bubbles:!0}))}),b.append(x,document.createTextNode(y)),m.append(b)}),h.append(u,m),h}let f;if(Array.isArray(p)?(f=document.createElement("select"),p.forEach(u=>{let m=document.createElement("option");m.value=u,m.textContent=u,m.selected=u===a,f.append(m)})):(f=document.createElement("textarea"),f.rows=r,f.value=a??""),f.name=e,f.className="le-input",f.tagName==="TEXTAREA"){f.classList.add("le-prose");let u=()=>{f.style.height="auto",f.style.height=Math.min(f.scrollHeight+2,420)+"px"};f.addEventListener("input",u),requestAnimationFrame(u)}if(d&&f.tagName==="TEXTAREA"){let u=document.createElement("div");u.className="le-tools";let m=(x,S)=>{let C=f.selectionStart,T=f.selectionEnd,D=f.value.slice(C,T)||"text";f.setRangeText(x+D+S,C,T,"select"),f.dispatchEvent(new Event("input",{bubbles:!0})),f.focus()},y=(x,S,C,T="")=>{let D=document.createElement("button");return D.type="button",D.title=S,D.textContent=x,D.className="le-tool "+T,D.addEventListener("click",C),D};u.append(y("B","Bold",()=>m("**","**"),"is-bold"),y("I","Italic",()=>m("*","*"),"is-italic"),y("Link","Insert link",()=>{let x=window.prompt("Link URL (https://\u2026 or /page):");if(!x)return;let S=f.selectionStart,C=f.selectionEnd,T=f.value.slice(S,C)||"link text";f.setRangeText("["+T+"]("+x+")",S,C,"select"),f.dispatchEvent(new Event("input",{bubbles:!0})),f.focus()}));let b=document.createElement("span");b.className="le-hint",b.textContent="**bold** \xB7 *italic* \xB7 [text](url)",u.append(b),h.append(u)}return h.append(f),h},te=e=>{let t=e.tagName;if(e.dataset.editRegion)return e.dataset.editRegion;if(t==="IMG")return"Image";if(t==="BUTTON")return"Button";if(t==="A")return/\b(btn|button)\b/i.test(String(e.className))?"Button":"Link";if(/^H[1-6]$/.test(t))return"Heading";if(t==="P")return"Paragraph";if(t==="LI")return"List item";if(t==="UL"||t==="OL")return"List";if(t==="NAV")return"Menu";if(t==="HEADER")return"Header";if(t==="FOOTER")return"Footer";if(t==="FORM")return"Form";if(e.hasAttribute("data-edit-item"))return"Card";if(e.hasAttribute("data-edit-icon"))return"Icon";if(e.hasAttribute("data-edit-svg"))return"Drawing";if(e.hasAttribute("data-edit"))return"Text";if(e.hasAttribute("data-has-bg")||e.hasAttribute("data-edit-bg"))return"Background";if(t==="SECTION"||t==="MAIN"||t==="ARTICLE")return"Section";let a=e.getBoundingClientRect();return a.width>window.innerWidth*.6&&a.height>180?"Section":"Group"},ue=(e,t)=>{let a=e.tagName,r;return a==="IMG"?r=["radius","hidden"]:a==="A"||a==="BUTTON"?r=["background","textColor","fontSize","radius","hidden"]:/^(H[1-6]|P|SPAN|LI|BLOCKQUOTE|FIGCAPTION|DT|DD|TD|TH|CAPTION|CITE|Q|LABEL|STRONG|EM)$/.test(a)?r=["textColor","fontSize","hidden"]:r=["background","backgroundImage","paddingY","paddingX","radius","hidden"],t.filter(d=>r.includes(d.trim()))},Se=({hint:e="PNG, JPG or WEBP, or drag one here",onFile:t}={})=>{let a=document.createElement("label");a.className="le-upload";let r=document.createElement("div");r.className="le-upload-inner";let d=document.createElement("span");d.className="le-upload-icon",d.textContent="\u2191";let h=document.createElement("span");h.className="le-upload-text";let p=document.createElement("span");p.className="le-upload-title",p.textContent="Upload from your computer";let c=document.createElement("span");c.className="le-upload-hint",c.textContent=e,h.append(p,c);let f=document.createElement("span");f.className="le-upload-btn",f.textContent="Choose file",r.append(d,h,f);let u=document.createElement("input");u.type="file",u.accept="image/*";let m=y=>{y&&(c.textContent=y.name,t?.(y))};return u.addEventListener("change",()=>m(u.files[0])),["dragenter","dragover"].forEach(y=>a.addEventListener(y,b=>{b.preventDefault(),a.classList.add("is-dragover")})),["dragleave","drop"].forEach(y=>a.addEventListener(y,b=>{b.preventDefault(),a.classList.remove("is-dragover")})),a.addEventListener("drop",y=>{let b=y.dataTransfer?.files?.[0];if(!b)return;let x=new DataTransfer;x.items.add(b),u.files=x.files,m(b)}),a.append(r,u),a},Fe=e=>{let t=String(e).match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);return!t||t[4]!==void 0&&Number(t[4])===0?"":"#"+[1,2,3].map(a=>Number(t[a]).toString(16).padStart(2,"0")).join("")},De=e=>{if(!e)return"";let t=e.dataset.background||e.dataset.bg||e.dataset.backgroundImage;if(t)return t;let r=(getComputedStyle(e).backgroundImage||"").match(/url\((['"]?)(.*?)\1\)/);return r&&!r[2].startsWith("data:")?r[2]:""},Ce={background:"Background colour",backgroundImage:"Background image",textColor:"Text colour",fontSize:"Text size",paddingY:"Space above and below",paddingX:"Space left and right",radius:"Corner rounding"},qe=(e,t,a,r)=>{let d=document.createElement("label");d.className="le-field";let h=e.replace(/([A-Z])/g," $1").toLowerCase(),p=Ce[e]??h.charAt(0).toUpperCase()+h.slice(1);if(d.append(p),t==="toggle"){let c=document.createElement("div");c.className="le-row";let f=document.createElement("input");f.type="checkbox",f.checked=a==="1",f.dataset.styleProp=e;let u=document.createElement("span");u.className="le-hint",u.textContent="Hidden from visitors. You still see it, dimmed, while editing.",c.append(f,u);let m=r?te(r).toLowerCase():"section";return d.replaceChildren(`Hide this ${m}`,c),d.className="le-field le-divided",d}if(t==="color"){let c=document.createElement("div");c.className="le-row";let f=document.createElement("input");f.type="color";let u=r?Fe(getComputedStyle(r)[e==="textColor"?"color":"backgroundColor"]):"";f.value=a||u||"#ffffff",f.dataset.styleProp=e,f.className="le-color";let m=document.createElement("label");m.className="le-default";let y=document.createElement("input");y.type="checkbox",y.checked=!a,f.addEventListener("input",()=>y.checked=!1),m.append(y,"Use default"),c.append(f,m),d.append(c)}else if(t==="url"){let c=document.createElement("input");c.type="text",c.value=a??"",c.placeholder="Paste an image URL, or upload below",c.dataset.styleProp=e,c.className="le-input";let f=document.createElement("img");f.className="le-thumb",f.alt="";let u=T=>{f.src=T||"",f.style.display=T?"":"none"},m=a?"":De(r),y=document.createElement("span");y.className="le-hint";let b=(T,D)=>{y.textContent=T?D?"Current image (from the theme) \u2014 upload or paste a link to replace it":"Replacing with this image":"No image set",y.title=T||""};u(a||m),b(a||m,!a&&!!m),c.addEventListener("input",()=>{let T=c.value.trim();u(T||m),b(T||m,!T&&!!m)});let x=Se({onFile:async T=>{u(URL.createObjectURL(T));let D=new FormData;D.append("file",T);try{let q=await(await j("/live-edit/upload",{method:"POST",body:D})).json();c.value=q.url,u(q.url),b(q.url,!1),c.dispatchEvent(new Event("input",{bubbles:!0}))}catch(Q){w(J(Q,"save that"))}}}),S=$("div","le-ways"),C=$("button","le-btn le-wide","Replace background");C.type="button",C.addEventListener("click",()=>Vt(r,async T=>{let{url:D,file:Q,credit:q}=T,I=D;if(Q){u(URL.createObjectURL(Q));let U=new FormData;U.append("file",Q);try{I=(await(await j("/live-edit/upload",{method:"POST",body:U})).json()).url}catch(Z){l.toast(J(Z,"save that"));return}}I&&(c.value=I,u(I),b(I,!1),c.dispatchEvent(new Event("input",{bubbles:!0})),c.dataset.kbCreditFor=I,c.dataset.kbCredit=JSON.stringify({credit:q??"",creditBy:T.creditBy??"",creditUrl:T.creditUrl??"",creditSource:T.creditSource??"",creditSourceUrl:T.creditSourceUrl??""}),q&&l.toast(q,4e3))},"Free photos","background")),S.append(C),c.hidden=!0,x.hidden=!0,d.append(S,c,x,f,y)}else{let c=document.createElement("input");c.type="number",c.min=0,c.max=400,c.value=a??"",c.placeholder="default",c.dataset.styleProp=e,c.className="le-input",d.append(c)}return d},Je={background:"color",backgroundImage:"url",textColor:"color",fontSize:"px",paddingX:"px",paddingY:"px",radius:"px",hidden:"toggle"},Ge=(e,t,a)=>{v.styleKey=e;let r=(window.liveEditStyles??{})[e]??{},d=document.createElement("div");d.className="le-section-heading",d.textContent="Style",E.append(d);let h=0;if((a?ue(a,t):t).forEach(p=>{let c=(window.liveEditStyleProps??{})[p]??Je[p];c&&(E.append(qe(p,c,r[p],a)),h++)}),h===0){let p=document.createElement("div");p.className="le-hint",p.textContent="Nothing on this element can be restyled.",E.append(p)}},Le=document.createElement("style");document.head.append(Le);let Me=(e,t)=>{let a=`[data-style="${e}"]`,r="",d="";for(let[h,p]of Object.entries(t))p&&(r+={hidden:"opacity:.45 !important;",backgroundImage:`background-image:url('${p}') !important;background-size:cover !important;background-position:center !important;`,background:`background:${p} !important;`,textColor:`color:${p} !important;`,fontSize:`font-size:${p}px !important;`,radius:`border-radius:${p}px !important;`,paddingX:`padding-left:${p}px !important;padding-right:${p}px !important;`,paddingY:`padding-top:${p}px !important;padding-bottom:${p}px !important;`}[h]??"",h==="paddingY"&&(d+=`section${a}>div{padding-top:0 !important;padding-bottom:0 !important}`));return r?d+`${a}{${r}}`:d},Ae=()=>{if(!v?.styleKey)return;let e=Ne(),t=v.styleKey,a=Me(t,e),r={background:"background",textColor:"color",fontSize:"font-size",radius:"border-radius",backgroundImage:"background-image"};for(let[d,h]of Object.entries(e))h||(d==="hidden"&&(a+=`body.editing [data-style="${t}"]{opacity:1 !important}`),r[d]&&(a+=`[data-style="${t}"]{${r[d]}:revert-layer !important}`),d==="paddingY"&&(a+=`[data-style="${t}"]{padding-top:revert-layer !important;padding-bottom:revert-layer !important}section[data-style="${t}"]>div{padding-top:revert-layer !important;padding-bottom:revert-layer !important}`),d==="paddingX"&&(a+=`[data-style="${t}"]{padding-left:revert-layer !important;padding-right:revert-layer !important}`));Le.textContent=a},Te=()=>{Le.textContent=""};E.addEventListener("input",()=>{v&&(v.dirty=!0),Ae()}),E.addEventListener("change",()=>{v&&(v.dirty=!0),Ae()});let Ne=()=>{let e={};return E.querySelectorAll("[data-style-prop]").forEach(t=>{if(t.type==="checkbox")e[t.dataset.styleProp]=t.checked?"1":"";else if(t.type==="color"){let a=t.closest("div").querySelector("input[type=checkbox]").checked;e[t.dataset.styleProp]=a?"":t.value}else e[t.dataset.styleProp]=t.value;if(t.dataset.kbCredit&&t.dataset.kbCreditFor===t.value)try{Object.assign(e,JSON.parse(t.dataset.kbCredit))}catch{}}),e},ie=null,re=()=>{!ie||!v||v.dirty||!O.classList.contains("is-open")||F!=="Edit"||ie.isConnected&&Ue(ie)},me=e=>e.dataset.editRegion?e.dataset.editRegion:e.dataset.editLabel?e.dataset.editLabel:e.querySelector(":scope > [data-style-edit]")?.dataset.editLabel??te(e),Ue=e=>{if(ie=e,e.dataset.editImg!==void 0)vt(e);else if(e.dataset.edit!==void 0)tt(e);else if(e.dataset.svgEdit!==void 0||e.dataset.editSvg!==void 0)Gt(e);else if(e.dataset.editHref!==void 0)mt(e);else if(e.dataset.style!==void 0){let t=e.querySelector(":scope > [data-style-edit]");yt(t??e)}},ut=e=>{v?.dirty&&!window.confirm("Discard unsaved changes?")||(Te(),Ue(e))},ht=null,B=e=>{let t=ht;ht=e??null;let a=[],r=e?.parentElement;for(;r&&r!==document.body;)r.dataset&&(r.dataset.edit!==void 0||r.dataset.style!==void 0)&&a.unshift(r),r=r.parentElement;let d=[];a.forEach(p=>{let c=me(p);if(d.length&&d[d.length-1].label===c){d[d.length-1].node=p;return}d.push({node:p,label:c})});let h=d.slice(-3);t&&t!==e&&document.contains(t)&&!h.some(p=>p.node===t)&&h.unshift({node:t,label:`\u2190 ${me(t)}`}),z.replaceChildren(),z.classList.toggle("is-visible",h.length>0),h.forEach((p,c)=>{let f=p.node;c>0&&z.append("\u203A");let u=document.createElement("button");u.type="button",u.textContent=p.label,u.className="le-crumb",u.addEventListener("click",()=>ut(f)),z.append(u)})},F="Edit",Y=e=>{F=e,Object.entries(N).forEach(([t,a])=>{a.classList.toggle("is-on",t===e),a.setAttribute("aria-selected",t===e?"true":"false")}),ee.classList.toggle("le-hidden",e!=="Edit"),l.drawerFoot.classList.toggle("le-hidden",e!=="Edit"),e==="Changes"&&et(),e==="History"&&Xn()};Object.entries(N).forEach(([e,t])=>{t.addEventListener("click",()=>{e!=="Edit"&&v?.dirty&&!window.confirm("Discard unsaved changes?")||(Y(e),O.classList.contains("is-open")||ft())})});let J=(e,t)=>{console.warn(`[live-edit] ${t}:`,e);let a=String(e?.message??"");return/failed to fetch|networkerror|load failed/i.test(a)?"No connection just now. Nothing has been lost; try again in a moment.":/\b401\b|\b403\b|unauthor|forbidden/i.test(a)?"Your editing session has expired. Reload the page to carry on.":/\b429\b|too many/i.test(a)?"That was a lot at once. Give it a few seconds and try again.":`Could not ${t}. Nothing has been lost; try again in a moment.`},W=null,he=async()=>{if(window.liveEditApi)try{W=await(await j("/live-edit/credits",{method:"GET"})).json(),re()}catch(e){console.warn("[live-edit] could not read the credit balance:",e),W=null}},Ke=async()=>{if(!(window.liveEditStyleProps&&window.liveEditStyles)&&window.liveEditApi)try{let t=await(await j("/live-edit/content",{method:"GET"})).json();t?.styleProps&&(window.liveEditStyleProps=t.styleProps),t?.styles&&(window.liveEditStyles=t.styles),re()}catch(e){console.warn("[live-edit] could not read what this site allows to be styled:",e)}},Xe=(e,t)=>{if(!W?.available||!t)return;let a=document.createElement("div");a.className="le-assist-head",a.append(ge("AI assist"),$e()),E.append(a),[["rewrite","Rewrite"],["shorten","Shorten"]].forEach(([r,d])=>{let h=W.costs?.[r]??1,p=document.createElement("button");p.type="button",p.className="le-assist";let c=document.createElement("span");c.textContent=d;let f=document.createElement("span");f.className="le-assist-cost",f.textContent=`${h} credit${h===1?"":"s"}`,p.append(c,f),(W.balance??0)<h&&(p.disabled=!0,f.classList.add("is-short"),p.title="Not enough credits"),p.addEventListener("click",()=>void Ze(r,d,e,t,p,c)),E.append(p)})},$e=()=>{let e=document.createElement("span");return e.className="le-assist-balance",e.textContent=`${W?.balance??0} credits left`,e},ge=e=>{let t=document.createElement("div");return t.className="le-section-heading",t.textContent=e,t},Qe=()=>(document.querySelector('meta[property="og:site_name"]')?.content??document.querySelector('meta[name="application-name"]')?.content??(document.title??"").split(/\s+[|\u2013\u2014-]\s+/).pop()??"").replace(/\s+/g," ").trim().slice(0,120),_e=()=>(document.querySelector('meta[name="description"]')?.content??document.querySelector('meta[property="og:description"]')?.content??"").replace(/\s+/g," ").trim().slice(0,400),Ze=async(e,t,a,r,d,h)=>{d.disabled=!0,h.textContent="Thinking\u2026";let p;try{p=await(await j("/live-edit/assist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:e,text:r.value,heading:we(a),role:te(a),page:window.location.pathname,site:Qe(),about:_e()})})).json()}catch(c){d.disabled=!1,h.textContent=t,l.toast(J(c,"rewrite that"));return}if(typeof p?.balance=="number"&&W&&(W.balance=p.balance),!p?.text){d.disabled=!1,h.textContent=t,l.toast(gt(p?.reason));return}r.value=p.text,r.dispatchEvent(new Event("input",{bubbles:!0})),r.focus(),d.disabled=!1,h.textContent=t,l.toast(`Rewritten. ${p.balance} credits left.`)},we=e=>(((e.closest("section, article, header, div[data-style]")??document.body).querySelector("h1, h2, h3")??document.querySelector("h1"))?.textContent??"").replace(/\s+/g," ").trim().slice(0,200),gt=e=>({not_enough_credits:"Not enough credits for that. You can buy more from your account.",no_suggestion:"No suggestion for this one. Your words are unchanged.",not_configured:"Rewriting is not switched on for this site yet.",nothing_to_work_with:"There are no words here to rewrite yet."})[e]??"Could not rewrite that just now. Your words are unchanged.",et=async()=>{E.replaceChildren(K("Loading\u2026"));let e;try{e=await(await j("/live-edit/changes",{method:"GET"})).json()}catch(a){E.replaceChildren(K(J(a,"show your changes")));return}let t=e?.changes??[];if(t.length===0){E.replaceChildren(K("No unpublished changes."));return}E.replaceChildren(),t.forEach(a=>{let r=document.createElement("div");r.className="le-change";let d=document.createElement("div");d.className="le-row le-change-head";let h=document.createElement("span");h.className="le-change-label",h.textContent=Oe(a);let p=document.createElement("button");if(p.type="button",p.className="le-chip-btn",p.textContent="Revert",p.addEventListener("click",()=>void Ie(a,p)),d.append(h,p),r.append(d),a.before){let f=document.createElement("p");f.className="le-change-before",f.textContent=fe(a.before),r.append(f)}let c=document.createElement("p");c.className="le-change-after",c.textContent=fe(a.after)||"(empty)",r.append(c),E.append(r)})},fe=e=>{let t=String(e??"").replace(/\s+/g," ").trim();return t.length>70?`${t.slice(0,70)}\u2026`:t},Oe=e=>{let t=document.querySelector(`[data-edit="setting:${CSS.escape(e.key)}"], [data-edit-img="setting:${CSS.escape(e.key)}"], [data-style="${CSS.escape(e.key)}"]`);return t?te(t):e.kind==="style"?"Styling":"Text"},Ie=async(e,t)=>{t.disabled=!0,t.textContent="Reverting\u2026";try{await j("/live-edit/changes",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:e.key,kind:e.kind})})}catch(a){t.disabled=!1,t.textContent="Revert",l.toast(J(a,"put that back"));return}P("Reverted \u2713")},G=()=>{let e=window.liveEditApi?.engine;if(!e)return null;let t=$("p","le-hint");return t.textContent=`Live Edit ${e}`,t.title="Quote this if you report a problem",t},Xn=async()=>{E.replaceChildren(K("Loading\u2026"));let e;try{e=await(await j("/live-edit/versions",{method:"GET"})).json()}catch(r){E.replaceChildren(K(J(r,"show what has been published")));return}let t=e?.versions??[];if(t.length===0){E.replaceChildren(K("Nothing published yet. Your first publish will appear here."));let r=G();r&&E.append(r);return}E.replaceChildren(),t.forEach((r,d)=>{let h=document.createElement("div");h.className="le-version";let p=document.createElement("span");p.className=d===0?"le-version-dot is-latest":"le-version-dot";let c=document.createElement("div"),f=document.createElement("p");f.className="le-change-after",f.textContent=r.restored_from?`Restored version ${r.restored_from}`:`Published ${r.changes??0} change${r.changes===1?"":"s"}`;let u=document.createElement("p");u.className="le-change-when",u.textContent=Qn(r.published_at),c.append(f,u),h.append(p,c),E.append(h)});let a=G();a&&E.append(a)},K=e=>{let t=document.createElement("p");return t.className="le-hint",t.textContent=e,t},Qn=e=>{if(!e)return"";let t=Math.round((Date.now()-new Date(e).getTime())/1e3);return t<90?"Just now":t<3600?`${Math.round(t/60)} minutes ago`:t<86400?`${Math.round(t/3600)} hours ago`:t<86400*8?`${Math.round(t/86400)} days ago`:new Date(e).toLocaleDateString()},ft=()=>{We(),St(),O.classList.add("is-open"),l.toolbar.classList.add("is-compact"),F==="Edit"&&E.querySelector("textarea, input:not([type=checkbox]), select")?.focus()},Pe=(e=!1)=>{!e&&v?.dirty&&!window.confirm("Discard unsaved changes?")||(v?.restore?.(),Te(),O.classList.remove("is-open"),l.toolbar.classList.remove("is-compact"),v=null)},Zn=()=>document.querySelectorAll("[data-edit], [data-edit-img], [data-edit-bg], [data-edit-href], [data-edit-icon], [data-edit-svg]"),bt=async(e,t=0)=>{try{if(e.cssRules){let a=[];for(let r of e.cssRules)r.styleSheet&&t<4?a.push(await bt(r.styleSheet,t+1)):a.push(r.cssText);return a.join("")}}catch{}if(!e.href)return"";try{let a=await fetch(e.href);if(!a.ok)return"";let r=await a.text();if(t>=4)return r;let d=[...r.matchAll(/@import\s+(?:url\(\s*(["']?)([^"')]+)\1\s*\)|(["'])([^"']+)\3)/gi)].map(p=>p[2]||p[4]).filter(Boolean),h=await Promise.all(d.map(p=>bt({href:new URL(p,e.href).href},t+1)));return r+h.join("")}catch{return""}},eo=null,to=async()=>{let e=new Map;return(await Promise.all([...document.styleSheets].map(a=>bt(a)))).forEach(a=>wn(a).forEach(r=>e.set(r.name,r.glyph))),[...e].map(([a,r])=>({name:a,glyph:r})).sort((a,r)=>a.name.localeCompare(r.name))},Ut=()=>eo??(eo=to()),_t=()=>{document.querySelectorAll("[data-style]").forEach(e=>{if(e.hasAttribute("data-edit-bg"))return;let a=(getComputedStyle(e).backgroundImage||"").match(/url\((['"]?)(.*?)\1\)/),r=e.getBoundingClientRect(),d=a&&!a[2].startsWith("data:")&&r.width>=120&&r.height>=120;e.toggleAttribute("data-has-bg",!!d)})},no=()=>{document.querySelectorAll("[data-edit-icon]").forEach(e=>{let t=getComputedStyle(e,"::before").content;(t==="none"||t==="normal"||t==='""'||t==="")&&e.removeAttribute("data-edit-icon")})},Be=e=>{e&&no(),document.body.classList.toggle("editing",e),Zn().forEach(t=>{e?t.setAttribute("tabindex","0"):t.removeAttribute("tabindex")}),sessionStorage.setItem("tb_editing",e?"1":"0"),pe.textContent=e?"Click any outlined text or image":"",pe.parentElement?.classList.toggle("is-saying",e),!e&&typeof We=="function"&&We(),l.toolbar.classList.toggle("is-editing",e),ce.textContent=e?"Done editing":"Edit site",e?(_t(),document.querySelector("[data-edit-icon]")&&Ut(),n?.base&&n?.site&&Promise.resolve().then(()=>(Rt(),jt)).then(t=>t.refreshBackgrounds({base:n.base,site:n.site,key:n.token})).then(t=>{t&&_t()}).catch(t=>console.warn("[live-edit] could not look again for backgrounds:",t.message))):(St(),xe()),e||Pe(!0)},oo=async()=>{let e=window.liveEditApi,t=await Promise.resolve().then(()=>(Kn(),Gn)).catch(()=>null);if(t?.forget(window),!e||!t){window.location.reload();return}let a=window.prompt("Your editing session has ended. Enter your email address and we will send you a new link.");a&&(await t.requestLink(e,a,window).catch(()=>{}),w("If that address can edit this site, a link is on its way.")),window.location.reload()},j=async(e,t)=>{let a=window.liveEditApi,r=a?kn(e,t,a):null,d=r?await fetch(r.url,r.init):await fetch(e,bn(i,t));if(d.status===419||d.status===401)throw await oo(),new Error("Your editing session has ended.");if(!d.ok){let h=await d.json().catch(()=>({}));throw new Error(h.error?.message??h.message??"Could not save. Try again.")}if(!mn(d))throw new Error("That did not save. Reload the page and try again.");return d},ao=(e,t)=>{if(!e?.element)return null;let a=r=>{let d=e.element.getAttribute(r);return d===null?null:{attr:r,marker:d}};if(e.kind==="image"){let r=t.querySelector("input[type=url]")?.value.trim(),d=t.querySelector("input[type=file]")?.files?.[0],h=a("data-edit-img")??a("data-edit-bg");return r&&h?{...h,kind:"image",value:r}:null}if(e.kind==="icon"){let r=a("data-edit-icon");return r&&e.value?{...r,kind:"icon",value:e.value}:null}if(e.kind==="setting"&&typeof e.savedValue=="string"){let r=a("data-edit");return!r||/<[a-z][\s\S]*>/i.test(e.savedValue)||e.element.hasAttribute("data-edit-attr")?null:{...r,kind:"text",value:e.savedValue}}return null},io=async e=>{let t=window.liveEditApi?.builderUrl;if(!t||e?.kind!=="setting"||typeof e.savedValue!="string"||!e.element)return;let a=e.element.closest(".elementor-element[data-id]");if(a)try{await fetch(t,{method:"POST",headers:{"Content-Type":"application/json",...window.liveEditApi?.publishHeaders??{}},body:JSON.stringify({page:window.location.href,element:a.dataset.id,value:e.savedValue})})}catch(r){console.warn("[live-edit] could not tell the page builder about this change:",r.message)}},ro=async()=>{if(!v)return;let e=l.saveButton;e.disabled=!0,e.textContent="Saving\u2026";let t=()=>{e.disabled=!1,e.textContent="Save changes"};try{if(v.kind==="setting")await j("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:v.key,value:v.savedValue=v.value??E.querySelector("textarea, input[name=icon]")?.value??"",locale:window.liveEditLocale})});else if(v.kind==="record"){let a={};E.querySelectorAll("textarea, select, input[type=hidden][name]").forEach(r=>a[r.name]=r.value),await j("/live-edit/record",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:v.type,id:v.id,fields:a})})}else if(v.kind==="icon")await j("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:v.key,value:v.value})});else if(v.kind==="image"){let a=new FormData;a.append("target",v.target);let r=E.querySelector("input[type=file]").files[0],d=E.querySelector("input[type=url]").value.trim(),h=Tt(v.element);h&&(a.append("fitWidth",String(h.width)),a.append("fitHeight",String(h.height)),h.exact&&a.append("fitExact","1")),v.crop&&(a.append("cropX",String(v.crop.x)),a.append("cropY",String(v.crop.y)),a.append("cropWidth",String(v.crop.width)),a.append("cropHeight",String(v.crop.height)));let p=r!==void 0||d!==""&&d!==void 0;v.credit&&v.creditFor===v.target&&p&&cn(v.credit).forEach(([u,m])=>a.append(u,m));let c=[...E.querySelectorAll("[data-img-attr]")],f=pn(c);if(window.liveEditLocale&&a.append("locale",window.liveEditLocale),r?a.append("file",r):d&&a.append("url",d.startsWith("http")?d:`https://${d}`),f.forEach(u=>a.append(u.dataset.imgAttr,u.value)),!r&&!d&&f.length===0){t(),w(c.length>0?"Nothing has changed yet. Choose a picture, or edit the description.":"Choose a file from your computer or paste an image URL first.");return}await j("/live-edit/image",{method:"POST",body:a})}if(v.hrefKey){let a=E.querySelector("[data-link-field=href]").value.trim(),r=E.querySelector("[data-link-field=target]").checked;await j("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:v.hrefKey,value:a})}),v.targetKey&&await j("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:v.targetKey,value:r?"_blank":""})})}v.styleKey&&await j("/live-edit/style",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:v.styleKey,props:Ne()})}),await io(v),un(ao(v,E)),R("Saved \u2713",v.key??null,v.savedValue??null)}catch(a){t(),w(a.message)}};he(),Ke();let $=(e,t,a)=>{let r=document.createElement(e);return t&&(r.className=t),a!=null&&(r.textContent=a),r},Wt=e=>{let t=e.closest("section, article, header, div[data-style]");for(;t&&!t.querySelector("h1, h2, h3");)t=t.parentElement?.closest("section, article, header, div[data-style]")??null;let a=t?.querySelector("h1, h2, h3");return!t||!a?"":[...t.querySelectorAll("p, span, div, h4, h5, h6")].filter(d=>d.children.length===0).filter(d=>a.compareDocumentPosition(d)&Node.DOCUMENT_POSITION_PRECEDING).map(d=>(d.textContent??"").replace(/\s+/g," ").trim()).find(d=>d.length>3&&d.length<42)??""},so=/^(the|and|with|for|your|our|from|that|this|they|them|will|have|more|about|into|just|than|then|when|what|where|very|been|here|there)$/,Ht=e=>{let t=new Set((document.title??"").toLowerCase().split(/[^a-z0-9]+/i).filter(Boolean));return(e??"").toLowerCase().split(/[^a-z0-9]+/i).filter(a=>a.length>3&&!so.test(a)&&!t.has(a))},lo=e=>{let t=Ht(Wt(e)).slice(0,3);if(t.length>0)return t.join(" ");let a=Ht(we(e)).slice(0,3);return a.length>0?a.join(" "):"workplace"},Yt=e=>{let t=lo(e),a=(e.dataset.editLabel??"").toLowerCase().trim(),r=/hero|banner|header|cover/.test(a);return[...new Set([t,r?`${t} wide`:`${t} close up`,"workplace"].filter(Boolean))].slice(0,4)},co=e=>`${(Wt(e)||we(e)||"This page").replace(/[.\s]+$/,"")}. Photographic, natural daylight, calm and editorial, soft neutral tones to match the rest of the site. No text.`,Vt=(e,t,a="Free photos",r="image")=>{let d=l.modal({title:`Replace ${r}`,subtitle:e.dataset.editLabel??te(e)}),h=document.createElement("div");d.body.append(h),d.tabs.hidden=!1;let p=m=>{d.close(),t(m)},c={Upload:()=>po(h,p),"Free photos":()=>void uo(h,e,p),"Generate with AI":()=>go(h,e,p)},f=Object.keys(c).map(m=>{let y=document.createElement("button");return y.type="button",y.className="le-modal-tab",y.textContent=m,y.addEventListener("click",()=>u(m)),d.tabs.append(y),[m,y]}),u=m=>{f.forEach(([y,b])=>b.classList.toggle("is-on",y===m)),h.replaceChildren(),c[m]()};return u(c[a]?a:"Free photos"),d},po=(e,t)=>{e.append(Se({hint:"PNG, JPG or WEBP, or drag one here",onFile:c=>t({file:c})}));let a=$("div","le-row-tight"),r=document.createElement("input");r.type="url",r.className="le-search",r.placeholder="Or paste a link to a picture";let d=$("button","le-btn-outline","Use it");d.type="button";let h=()=>{let c=r.value.trim();c&&t({url:c.startsWith("http")?c:`https://${c}`})};d.addEventListener("click",h),r.addEventListener("keydown",c=>{c.key==="Enter"&&(c.preventDefault(),h())}),a.append(r,d),e.append(a);let p=$("p","le-hint","You can also drag a picture straight onto the image on the page.");p.style.marginTop="14px",e.append(p)},uo=async(e,t,a)=>{let r=document.createElement("input");r.type="search",r.className="le-search",r.placeholder="Search free photographs";let d=document.createElement("div");d.className="le-chips";let h=document.createElement("div");h.className="le-grid";let p=document.createElement("p");p.className="le-hint",p.style.marginTop="16px",e.append(r,d,h,p);let c=()=>{h.replaceChildren();for(let u=0;u<6;u+=1)h.append($("div","le-shimmer"))},f=async u=>{r.value=u,c();let m;try{m=await(await j(`/live-edit/photos?q=${encodeURIComponent(u)}`,{method:"GET"})).json()}catch(b){h.replaceChildren(K(J(b,"look for photographs")));return}let y=m?.photos??[];if(p.textContent=m?.source==="openverse"?"Free to use, including commercially. The photographer is credited automatically.":"Free to use under the Unsplash licence. The photographer is credited automatically.",y.length===0){h.replaceChildren(K(ho(m?.reason,u)));return}h.replaceChildren(),y.forEach(b=>{let x=document.createElement("button");x.type="button",x.className="le-pick";let S=document.createElement("img");S.className="le-pick-shot",S.src=b.thumb??b.full,S.alt=b.alt??"",S.loading="lazy";let C=$("span","le-pick-by",b.by?`Photo by ${b.by}`:"");x.append(S,C),x.addEventListener("click",()=>{b.downloadLocation&&j("/live-edit/photos/used",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({download_location:b.downloadLocation})}).catch(()=>{}),a({url:b.full,alt:b.alt??"",credit:b.credit??(b.by?`Photo by ${b.by}`:""),creditBy:b.by??"",creditUrl:b.byUrl??"",creditSource:b.source??"",creditSourceUrl:b.sourceUrl??""})}),h.append(x)})};Yt(t).forEach((u,m)=>{let y=document.createElement("button");y.type="button",y.className="le-chip",y.textContent=u,y.addEventListener("click",()=>void f(u)),d.append(y),m===0&&y.classList.add("is-on")}),r.addEventListener("keydown",u=>{u.key==="Enter"&&(u.preventDefault(),r.value.trim()&&f(r.value.trim()))}),await f(Yt(t)[0])},ho=(e,t)=>({not_configured:"Free photographs are not switched on for this site yet.",not_allowed:"The photo library would not accept this site\u2019s key. It needs setting up again.",unreachable:"Could not reach the photo library just now. Try again in a moment.",nothing_to_search_for:"Type what the picture should show."})[e]??`Nothing found for "${t}". Try fewer words.`,go=(e,t,a)=>{let r=co(t),d=$("div","le-suggest");d.append($("div","le-eyebrow","Suggested for this spot"),$("div","le-suggest-text",r));let h=document.createElement("button");h.type="button",h.className="le-chip",h.style.marginTop="10px",h.textContent="Use this description",d.append(h);let p=document.createElement("textarea");p.className="le-textarea",p.placeholder="Describe the picture you want",h.addEventListener("click",()=>{p.value=r,p.focus()});let c=W?.costs?.generate_image??5,f=W?.balance??0,u=document.createElement("button");u.type="button",u.className="le-btn-publish",u.style.marginTop="14px",u.textContent=`Make a picture \xB7 ${c} credits`;let m=$("div","le-grid is-square");if(m.style.display="none",e.append(d,p,u,m),f<c){d.remove(),p.remove(),u.remove(),e.append($("div","le-section-heading","Making pictures costs credits"),$("div","le-hint",`A picture costs ${c} credits. You have ${f}.`));let y=window.liveEditEditor?.console??null;if(y){let b=$("button","le-btn-publish","Buy credits");b.type="button",b.style.marginTop="14px",b.addEventListener("click",()=>{window.open(`${y.replace(/\/$/,"")}/billing`,"_blank","noopener")}),e.append(b)}e.append(K("Uploading your own picture and the free photo library cost nothing, and they are the other two tabs here."));return}{let y=$("div","le-hint",`${c} credits a picture \xB7 ${f} left`);e.insertBefore(y,u)}u.addEventListener("click",async()=>{let y=p.value.trim()||r;u.disabled=!0,u.textContent="Making\u2026",m.style.display="",m.replaceChildren();for(let S=0;S<4;S+=1)m.append($("div","le-shimmer"));let b;try{b=await(await j("/live-edit/imagine",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:y})})).json()}catch(S){m.replaceChildren(K(J(S,"make a picture"))),u.disabled=!1,u.textContent="Try again \xB7 5 credits";return}let x=b?.images??[];if(typeof b?.balance=="number"&&(W={...W??{},balance:b.balance}),x.length===0){m.replaceChildren(K(fo(b?.reason))),u.disabled=!1,u.textContent="Try again \xB7 5 credits";return}m.replaceChildren(),x.forEach(S=>{let C=document.createElement("button");C.type="button",C.className="le-pick";let T=document.createElement("img");T.className="le-pick-shot",T.src=S,T.alt="",C.append(T,$("span","le-tag","MADE")),C.addEventListener("click",()=>a({url:S,credit:"",creditSource:"Generated"})),m.append(C)}),u.disabled=!1,u.textContent="Make four more \xB7 5 credits"})},fo=e=>({not_enough_credits:"Not enough credits to make a picture. You can buy more from your account.",not_configured:"Making pictures is not switched on for this site yet.",no_suggestion:"Nothing usable came back, so you have not been charged. Try describing it differently.",nothing_to_work_with:"Describe the picture you want first."})[e]??"Could not make a picture just now. You have not been charged.",je=null,bo=(e,t)=>{if(!t)return;let a=be(e),r=c=>[...c.childNodes].filter(f=>f.nodeType===3),d=r(e).map(c=>c.nodeValue),h=()=>{let c=r(e);return c.length!==d.length?!1:(c.forEach((f,u)=>{f.nodeValue=d[u]}),!0)},p=!1;v.restore=()=>{!p||!je||h()||je(e,a)},t.addEventListener("input",()=>{je&&(p=!0,h(),je(e,t.value,{keepRuns:!0}))}),je===null&&Promise.resolve().then(()=>(pt(),ct)).then(c=>je=c.applyValue).catch(c=>console.warn("[live-edit] could not preview words as you type:",c.message))},mo=e=>{v.hrefKey=e.dataset.editHref,v.targetKey=e.dataset.editTarget;let t=document.createElement("div");t.className="le-field le-divided",t.append("Link");let a=document.createElement("input");a.type="text",a.dataset.linkField="href";let r=e.getAttribute("href")??"";a.value=r==="#"?"":r,a.placeholder="/contact or https://...",a.className="le-input le-link";let d=document.createElement("label");d.className="le-default";let h=document.createElement("input");h.type="checkbox",h.dataset.linkField="target",h.checked=e.getAttribute("target")==="_blank",d.append(h,"Open in a new tab"),t.append(a,d),E.append(t)},mt=e=>{v={kind:"link"},H.textContent=e.dataset.editLabel??"Link",E.replaceChildren(),_.classList.add("le-hidden"),ye(e)},tt=e=>{let{kind:t,key:a,parts:r}=fn(e.dataset.edit);if(E.replaceChildren(),_.classList.add("le-hidden"),t==="setting"){v={kind:t,key:a,element:e},H.textContent=e.dataset.editLabel??te(e);let d=(window.liveEditRich?.settings??[]).includes(r[0]),h=Ot({editValue:e.dataset.editValue,ownText:be(e),fullText:e.textContent}),p=d?h.trim():h.replace(/\s+/g," ").trim(),c=e.dataset.editAs==="icon";E.append(c?Ee("icon","Icon",e.dataset.editValue??"",1,!1):Ee("value","Text",p,6,d)),c||Xe(e,E.querySelector("textarea")),!c&&!d&&bo(e,E.querySelector("textarea"))}else{let[d,h]=r;v={kind:"record",type:d,id:Number(h)};let p=e.dataset.editLabel??"Item",c=JSON.parse(e.dataset.editValues??"{}"),f=c.title??c.question??c.label??c.number;if(H.textContent=f?`${p}: ${f.slice(0,40)}`:p,Object.entries(c).forEach(([b,x])=>{let S=b.replace(/_/g," "),C=S.charAt(0).toUpperCase()+S.slice(1),T=(window.liveEditRich?.fields??[]).includes(`${d}.${b}`);E.append(Ee(b,C,x,b==="detail"||b==="answer"?6:3,T))}),window.liveEditPublishing){let b=document.createElement("div");b.className="le-hint le-immediate",b.textContent="Changes here go live as soon as you save, without publishing.",E.append(b)}e.hasAttribute("data-edit-deletable")&&(_.textContent=`Delete this ${p.toLowerCase()}`,_.classList.remove("le-hidden"));let u=document.createElement("div");u.className="le-row";let m=document.createElement("span");m.className="le-label",m.textContent="Order";let y=(b,x)=>{let S=document.createElement("button");return S.type="button",S.textContent=x,S.className="le-chip-btn",S.addEventListener("click",async()=>{(await(await j("/live-edit/record/move",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:v.type,id:v.id,direction:b})})).json()).moved?P("Reordered \u2713"):w(b==="up"?"Already first.":"Already last.")}),S};u.append(m,y("up","\u2191 Move up"),y("down","\u2193 Move down")),E.prepend(u)}ye(e)},wo=e=>{let t=e.closest?.("[data-edit-item]"),a=t?.parentElement?.dataset?.editList?t.parentElement:e.closest?.("[data-edit-list]");if(!a?.dataset?.editList)return;let r=()=>[...a.children].filter(f=>f.dataset.editItem).map(f=>f.dataset.editItem),d=async(f,u)=>{try{await j("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:a.dataset.editList,value:JSON.stringify(f)})}),P(u)}catch(m){w(m.message)}},h=document.createElement("div");h.className="le-section-heading",h.textContent="List";let p=document.createElement("div");p.className="le-row";let c=document.createElement("button");if(c.type="button",c.className="le-chip-btn",c.textContent=t?"+ Add another":"+ Add item",c.addEventListener("click",()=>{let f=r(),u=t?f.indexOf(t.dataset.editItem):f.length-1;f.splice(u+1,0,"n"+Date.now().toString(36)),d(f,"Added \u2713")}),p.append(c),t){let f=document.createElement("button");f.type="button",f.className="le-btn-danger",f.textContent="Delete this item",f.addEventListener("click",()=>{window.confirm("Delete this item?")&&d(r().filter(u=>u!==t.dataset.editItem),"Deleted \u2713")}),p.append(f)}E.append(h,p)},wt=!1,yo=e=>{wt=!0,e.click(),window.setTimeout(()=>{wt=!1},0)},vo=e=>e.closest?.('a[href^="#"], [aria-controls], [aria-expanded], [data-toggle], [role="button"]')??null,xo=e=>{let t=vo(e);if(t){let p=document.createElement("div");p.className="le-row";let c=document.createElement("button");c.type="button",c.className="le-chip-btn",c.textContent="Open this menu",c.title="Runs the control so you can edit what it reveals",c.addEventListener("click",()=>{Pe(!0),yo(t)}),p.append(c),E.append(p)}let a=e.closest?.("a[href]"),r=a?.getAttribute("href");if(!r||r==="#"||r.startsWith("javascript:"))return;let d=document.createElement("div");d.className="le-row";let h=document.createElement("button");h.type="button",h.className="le-chip-btn",h.textContent="Open this link \u2192",h.addEventListener("click",()=>{window.location.href=a.href}),d.append(h),E.append(d)},ye=(e,{styleKey:t=null,styleOn:a=e}={})=>{e.dataset.editHref!==void 0&&mo(e),xo(e);let r=t??a.dataset.styleEdit??a.dataset.style,d=xn(a.dataset.styleProps,window.liveEditStyleProps);r&&d.length&&Ge(r,d,a),Eo(e),wo(e),B(e.dataset.styleEdit?e.closest("[data-style]")??e.parentElement:e),Y("Edit"),ft()},ko=e=>{let t=(be(e)||e.textContent||"").replace(/\s+/g," ").trim();if(t)return t.slice(0,28);let a=(e.getAttribute("aria-label")??e.getAttribute("title")??"").trim();if(a)return a.slice(0,28);let r=e.className.toString().match(/(?:social-icon-|fa-|bi-|icon-)([a-z][a-z0-9-]{2,})/i)?.[1]??[...e.querySelectorAll("[class]")].map(d=>d.className.toString().match(/(?:social-icon-|fa-|bi-|icon-)([a-z][a-z0-9-]{2,})/i)?.[1]).find(Boolean);return r?r.charAt(0).toUpperCase()+r.slice(1):me(e)},Eo=e=>{let t="[data-edit], [data-edit-img], [data-edit-bg], [data-edit-href], [data-edit-icon], [data-edit-svg]",a=[...e.querySelectorAll(t)].filter(p=>p.parentElement?.closest(t)===null||!e.contains(p.parentElement.closest(t))).filter(p=>p!==e&&p.getBoundingClientRect().width>0);if(a.length===0)return;let r=a.slice(0,24),d=document.createElement("div");d.className="le-section-heading",d.textContent=a.length>r.length?`Inside this \u2014 first ${r.length} of ${a.length}`:"Inside this",E.append(d);let h=document.createElement("div");h.className="le-row",r.forEach(p=>{let c=document.createElement("button");c.type="button",c.className="le-chip-btn",c.textContent=ko(p),c.addEventListener("click",()=>ut(p)),h.append(c)}),E.append(h)},yt=e=>{v={kind:"style"};let t=e.dataset.styleEdit??e.dataset.style;H.textContent=e.dataset.editLabel??te(e),E.replaceChildren(),_.classList.add("le-hidden"),ye(e,{styleKey:t})},nt=e=>{let t=getComputedStyle(e,"::before");return`${t.fontStyle} ${t.fontWeight} 20px ${t.fontFamily}`},Jt=(e,t)=>{let a=e.cloneNode(!1);a.removeAttribute("data-edit-icon"),Object.assign(a.style,{position:"absolute",visibility:"hidden",pointerEvents:"none"}),(e.parentNode??document.body).append(a);let r=nt(a),d=[];return[...a.classList].forEach(h=>{h!==t&&(a.classList.remove(h),nt(a)!==r&&d.push(h),a.classList.add(h))}),a.remove(),d},So=(e,t,a,r)=>yn([...e.classList],a,r,Jt(e,r),Jt(t,t.dataset.editIconCurrent)),Co=(e,t)=>{let a=document.createElement("canvas").getContext("2d");return a.font=t,e.filter(({glyph:r})=>{let d=a.measureText(r);return(d.actualBoundingBoxAscent||0)+(d.actualBoundingBoxDescent||0)>0})},Lo=async e=>{let t=e.dataset.editIconCurrent;v={kind:"icon",key:e.dataset.editIcon.replace(/^setting:/,""),value:t,element:e},H.textContent="Icon",E.replaceChildren(),_.classList.add("le-hidden");let a=nt(e),r=await Ut();if(v?.element!==e)return;let d=new Map([[a,null]]);document.querySelectorAll("[data-edit-icon]").forEach(b=>{let x=nt(b);d.has(x)||d.set(x,b)});let h=vn([...d].map(([b,x])=>({face:b,variant:x,icons:Co(r,b)})));if(h.length===0){let b=document.createElement("div");b.className="le-hint",b.textContent="This theme loads its icons from somewhere this page cannot read, so they cannot be listed. Type the icon name instead.";let x=document.createElement("label");x.className="le-field",x.append("Icon name");let S=document.createElement("input");S.type="text",S.className="le-input",S.value=t??"",S.addEventListener("input",()=>{v.value=S.value.trim(),v.dirty=!0}),x.append(S,b),E.append(x),ye(e);return}let p=e.className;v.restore=()=>{e.className=p,e.dataset.editIconCurrent=t};let c=document.createElement("input");c.type="search",c.className="le-input",c.placeholder=`Search ${h.length} icons\u2026`;let f=document.createElement("div");f.className="le-icon-grid";let u=document.createElement("div");u.className="le-hint";let m=400,y=b=>{let x=b.trim().toLowerCase().replace(/\s+/g,"-"),S=x?h.filter(({name:C})=>C.includes(x)):h;if(f.replaceChildren(),S.slice(0,m).forEach(({name:C,glyph:T,face:D,variant:Q})=>{let q=document.createElement("button");q.type="button",q.className="le-icon-choice",q.title=C.replace(/^[a-z]+-/,"").replace(/-/g," "),q.classList.toggle("is-current",C===t),q.style.font=D,q.textContent=T,q.addEventListener("click",()=>{e.className=p,e.dataset.editIconCurrent=t;let I=Q?So(e,Q,C,t):C;Q?e.className=I:e.classList.replace(t,C),e.dataset.editIconCurrent=C,v.value=I,v.dirty=!0,f.querySelectorAll(".le-icon-choice").forEach(U=>U.classList.remove("is-current")),q.classList.add("is-current")}),f.append(q)}),S.length===0){let C=document.createElement("div");C.className="le-hint",C.textContent="No icon matches that name.",f.append(C)}u.textContent=S.length>m?`Showing ${m} of ${S.length}. Type to narrow it down.`:""};c.addEventListener("input",()=>y(c.value)),y(""),E.append(c,f,u),ye(e)},Gt=e=>{let t=e.outerHTML;v={kind:"setting",key:e.dataset.editSvg.replace(/^setting:/,""),element:e},H.textContent=e.dataset.editLabel??"Drawing",E.replaceChildren(),_.classList.add("le-hidden");let a=()=>{e.outerHTML=t};v.restore=a;let r=new Set,d=[];document.querySelectorAll("svg").forEach(y=>{let b=y.outerHTML,x=b.replace(/\s+(class|style|width|height|data-[\w-]+)="[^"]*"/g,"");r.has(x)||y.getBoundingClientRect().width<4||(r.add(x),d.push(b))});let h=document.createElement("div");h.className="le-icon-grid";let p=null;d.slice(0,120).forEach(y=>{let b=document.createElement("button");b.type="button",b.className="le-icon-choice",b.innerHTML=y;let x=b.firstElementChild;x&&(x.removeAttribute("class"),x.setAttribute("width","20"),x.setAttribute("height","20")),b.classList.toggle("is-current",y===t),b.addEventListener("click",()=>{p=y,v.value=y,v.dirty=!0;let S=document.querySelector(`[data-edit-svg="${e.dataset.editSvg}"]`)??e,C=new DOMParser().parseFromString(y,"image/svg+xml").documentElement;["class","width","height","style","data-edit-svg","data-edit-label"].forEach(T=>{S.hasAttribute(T)&&C.setAttribute(T,S.getAttribute(T))}),S.replaceWith(C),h.querySelectorAll(".le-icon-choice").forEach(T=>T.classList.remove("is-current")),b.classList.add("is-current")}),h.append(b)});let c=document.createElement("label");c.className="le-field le-divided",c.append("Or paste an SVG");let f=document.createElement("textarea");f.className="le-input le-prose",f.placeholder='<svg viewBox="0 0 24 24">\u2026</svg>',f.addEventListener("input",()=>{f.value.trim()!==""&&(v.value=f.value.trim(),v.dirty=!0)});let u=document.createElement("div");u.className="le-hint",u.textContent="Anything that could run or fetch is stripped before it is saved.",c.append(f,u);let m=document.createElement("div");m.className="le-section-heading",m.textContent=d.length?"Drawings on this site":"No other drawings here",E.append(m,h,c),ye(e)},vt=e=>{let t=e.dataset.editKind==="background";v={kind:"image",target:e.dataset.editImg??e.dataset.editBg,element:e},H.textContent=e.dataset.editLabel??(t?"Background image":"Image"),E.replaceChildren(),_.classList.add("le-hidden");let a=document.createElement("div");a.className="le-preview";let r=document.createElement("img");r.alt="",r.className="";let d=t?De(e):e.currentSrc||e.getAttribute("src")||"",p=(d&&!d.startsWith("data:")?d:"")||e.dataset.editPreview;p?(r.src=p,a.append(r)):a.textContent="No image yet";let c=I=>{a.replaceChildren(r),r.src=I},f=Se({onFile:I=>c(URL.createObjectURL(I))}),u=document.createElement("label");u.className="le-field",u.append("Or paste an image URL");let m=document.createElement("input");m.type="url",m.placeholder="https://...",m.className="le-input",m.addEventListener("change",()=>{let I=m.value.trim();I&&c(I.startsWith("http")?I:`https://${I}`)}),u.append(m);let y=document.createElement("div");y.className="le-hint",y.textContent="Nothing changes on your site until you publish.";let b=(I,U,Z,se)=>{let ae=document.createElement("label");ae.className="le-field le-divided",ae.append(U);let M=document.createElement("input");if(M.type="text",M.dataset.imgAttr=I,M.value=Z??"",M.dataset.imgAttrWas=Z??"",M.className="le-input",ae.append(M),se){let V=document.createElement("span");V.className="le-hint",V.textContent=se,ae.append(V)}return ae},x=$("div","le-ways"),S=()=>{E.querySelectorAll(".le-staged").forEach(U=>U.remove());let I=$("div","le-hint le-staged","This is a preview. Press Save changes to keep it.");E.prepend(I)},C=(I,U)=>new Promise(Z=>{let se=l.modal({title:"Which part of the picture?",subtitle:"The shape is the spot it has to fill. Drag to choose what stays in it."}),ae=$("div","le-crop-stage");ae.style.cssText="position:relative;display:inline-block;max-width:100%;line-height:0;touch-action:none;";let M=document.createElement("img");M.alt="",M.style.cssText="max-width:100%;max-height:52vh;display:block;",M.src=URL.createObjectURL(I);let V=$("div","le-crop-frame");V.style.cssText="position:absolute;border:2px solid #fff;box-shadow:0 0 0 9999px rgba(0,0,0,.45);cursor:move;",ae.append(M,V),se.body.append(ae);let Ye=$("div","le-row");Ye.style.marginTop="14px";let ke=$("button","le-btn-publish","Use this part");ke.type="button";let Re=$("button","le-btn-outline","Whole picture");Re.type="button",Ye.append(ke,Re),se.body.append(Ye);let ne={x:0,y:0,width:0,height:0},it=()=>{V.style.left=`${ne.x}px`,V.style.top=`${ne.y}px`,V.style.width=`${ne.width}px`,V.style.height=`${ne.height}px`},Po=()=>{ne=sn({width:M.clientWidth,height:M.clientHeight},U),it()};M.addEventListener("load",Po);let ze=null;V.addEventListener("pointerdown",le=>{ze={x:le.clientX,y:le.clientY,at:{...ne}},V.setPointerCapture(le.pointerId),le.preventDefault()}),V.addEventListener("pointermove",le=>{ze&&(ne=dn(ze.at,{x:le.clientX-ze.x,y:le.clientY-ze.y},{width:M.clientWidth,height:M.clientHeight}),it())}),V.addEventListener("pointerup",()=>{ze=null});let an=le=>{URL.revokeObjectURL(M.src),se.close(),Z(le)};ke.addEventListener("click",()=>{an(ln(ne,M.clientWidth,M.naturalWidth))}),Re.addEventListener("click",()=>an(null))}),T=({url:I,file:U,credit:Z,alt:se,creditBy:ae,creditUrl:M,creditSource:V,creditSourceUrl:Ye})=>{if(v.crop=null,U){let Re=new DataTransfer;Re.items.add(U),f.querySelector("input[type=file]").files=Re.files,c(URL.createObjectURL(U));let ne=Tt(v.element);ne&&C(U,ne.width/ne.height).then(it=>{v.crop=it})}else I&&(m.value=I,c(I));let ke=E.querySelector('[data-img-attr="alt"]');se&&ke&&ke.value.trim()===""&&(ke.value=se),v.credit={credit:Z??"",creditBy:ae??"",creditUrl:M??"",creditSource:V??"",creditSourceUrl:Ye??""},v.creditFor=v.target,Q(v.credit),S()},D=$("p","le-credit"),Q=I=>{let U=(I?.credit??"").trim();D.textContent=U,D.hidden=U===""};Q({credit:st(e,"data-edit-credit","editCredit")});let q=$("button","le-btn le-wide",t?"Replace background":"Replace image");if(q.type="button",q.addEventListener("click",()=>Vt(e,T,"Free photos",t?"background":"image")),x.append(q),f.hidden=!0,u.hidden=!0,E.append(a,D,x,f,u,y),v.target.startsWith("setting:")&&!t&&E.append(b("alt","Alt text",st(e,"alt","editAlt"),"Describes the image for search engines and screen readers."),b("imgTitle","Title attribute",st(e,"title","editTitle"),"Optional tooltip shown on hover.")),v.target.startsWith("setting:")){let I=document.createElement("button");I.type="button",I.textContent=t?"Remove background":"Remove image",I.className="le-btn-danger",I.addEventListener("click",async()=>{let U=t?"Remove this background image? The section keeps its layout and colour.":"Remove this image? The section keeps its layout; you can add a new image any time.";if(!window.confirm(U))return;let Z=new FormData;Z.append("target",v.target),Z.append("remove","1"),await j("/live-edit/image",{method:"POST",body:Z}),P("Removed \u2713")}),E.append(I)}ye(e)},Kt=e=>e?.closest?.("a[data-edit], a[data-edit-href]")??null,Ao=e=>{let t=e?.getAttribute("href")??"";return t!==""&&t!=="#"&&!t.startsWith("javascript:")},ve=null,xt=!1,ot=null,kt=()=>{ot&&(clearTimeout(ot),ot=null)},Xt=()=>{kt(),ot=setTimeout(()=>{xt||We()},140)},To=e=>{if(e===ve&&!X.classList.contains("hidden"))return;ve=e;let t=e.getBoundingClientRect();X.style.top=`${t.top+window.scrollY-10}px`,X.style.left=`${t.right+window.scrollX-10}px`,X.classList.add("is-visible")},We=()=>{X.classList.remove("is-visible"),ve=null},Qt=e=>{if(!e?.closest)return null;let t=e.closest("[data-style-edit]");if(t)return{element:t,kind:"style"};let a=e.closest("[data-edit-img]");if(a)return{element:a,kind:"image"};let r=e.closest("[data-edit-icon]");if(r)return{element:r,kind:"icon"};let d=e.closest("[data-edit-svg]");if(d)return{element:d,kind:"svg"};let h=e.closest("[data-edit]");if(h)return{element:h,kind:"text"};let p=e.closest("[data-edit-href]:not([data-edit])");if(p)return{element:p,kind:"link"};let c=e.closest("[data-edit-bg]");if(c)return{element:c,kind:"image"};let f=e.closest("[data-style]:not([data-style-edit])");return f?{element:f,kind:"style"}:null},No=({element:e,kind:t})=>{t==="image"?vt(e):t==="icon"?Lo(e):t==="svg"?Gt(e):t==="text"?tt(e):t==="link"?mt(e):yt(e)},Et=null,xe=()=>l.hoverBox.classList.remove("is-visible"),$o=e=>{let t=e.getBoundingClientRect();if(t.width<4||t.height<4){xe();return}Object.assign(l.hoverBox.style,{top:`${t.top}px`,left:`${t.left}px`,width:`${t.width}px`,height:`${t.height}px`}),l.hoverBox.classList.toggle("is-flipped",t.top<26),l.hoverLabel.textContent=e.dataset.editLabel??te(e),l.hoverBox.classList.add("is-visible")};document.addEventListener("pointermove",e=>{if(!document.body.classList.contains("editing")){xe();return}if(e.target===l.root||l.root.contains(e.target)){xe();return}Et||(Et=requestAnimationFrame(()=>{Et=null;let t=Qt(e.target);t?$o(t.element):xe()}))}),document.addEventListener("scroll",xe,!0),document.addEventListener("pointerleave",xe);let at=null,St=()=>{oe.classList.remove("is-visible"),at=null},Oo=e=>{at=e;let t=e.getBoundingClientRect();oe.style.top=`${Math.max(t.top,8)+8}px`,oe.style.left=`${t.left+8}px`,oe.classList.add("is-visible")};oe.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),at&&yt(at),St()}),document.addEventListener("pointerover",e=>{if(!document.body.classList.contains("editing"))return;let t=e.target.closest?.("[data-has-bg]");t&&Oo(t);let a=Kt(e.target);a&&Ao(a)&&(kt(),To(a))}),document.addEventListener("pointerout",e=>{document.body.classList.contains("editing")&&e.relatedTarget!==X&&(Kt(e.relatedTarget)===ve&&ve||Xt())}),X.addEventListener("pointerenter",()=>{xt=!0,kt()}),X.addEventListener("pointerleave",()=>{xt=!1,Xt()}),X.addEventListener("click",e=>{if(e.preventDefault(),e.stopPropagation(),!ve)return;let t=ve;t.dataset.edit!==void 0?tt(t):mt(t),We()}),document.addEventListener("click",e=>{if(!document.body.classList.contains("editing")||wt||e.target===l.root||l.root.contains(e.target)||e.target.closest("[data-live-create]"))return;let t=Qt(e.target);t&&(e.preventDefault(),e.stopImmediatePropagation(),No(t))},!0),document.addEventListener("keydown",e=>{if(e.key==="Escape"&&l.shadow.querySelector(".le-scrim")||(e.key==="Escape"&&O.classList.contains("is-open")&&Pe(),!document.body.classList.contains("editing"))||e.key!=="Enter"&&e.key!==" "||l.shadow.activeElement)return;let t=document.activeElement;t?.matches("[data-edit-img], [data-edit-bg]")?(e.preventDefault(),vt(t)):t?.matches("[data-edit]")&&!t.matches("button, a")&&(e.preventDefault(),tt(t))}),ce?.addEventListener("click",()=>Be(!document.body.classList.contains("editing"))),l.changesButton?.addEventListener("click",()=>{document.body.classList.contains("editing")||Be(!0),Y("Changes"),ft()});let Zt=e=>{if(window.liveEditPublishing){e(window.liveEditPublishing);return}A().then(()=>window.liveEditPublishing&&e(window.liveEditPublishing))};Zt(e=>{let t=e.pending??0,a=()=>{l.publishButton.hidden=!1,l.previewButton.hidden=!1,l.publishLabel.textContent=t>0?"Publish":"Published",l.publishCount.textContent=String(t),l.publishCount.hidden=t===0,l.publishButton.disabled=t===0,l.publishButton.title=t>0?`Put ${t} change${t===1?"":"s"} live`:"Nothing is waiting to be published"};a();let r=async()=>{let h=t===1?"":"s",p=e.domain??window.location.host,c=l.modal({title:`Publish ${t} change${h}`,subtitle:`They go live on ${p} right away.`,size:"is-narrow"});c.body.append(K("Loading\u2026"));let f=$("button","le-btn-outline","Keep editing");f.type="button",f.addEventListener("click",()=>c.close());let u=$("button","le-btn-publish","Publish now");u.type="button",c.foot.hidden=!1,c.foot.append(f,u),u.focus();try{let b=(await(await j("/live-edit/changes",{method:"GET"})).json())?.changes??[],x=$("div","le-review");b.forEach(S=>{let C=$("div","le-review-row");C.append($("div","le-review-what",Oe(S)),$("div","le-review-to",fe(S.after)||"(empty)")),x.append(C)}),c.body.replaceChildren(b.length>0?x:K("Nothing is waiting."))}catch(m){c.body.replaceChildren(K(J(m,"list what is waiting")))}u.addEventListener("click",async()=>{u.disabled=!0,f.disabled=!0,u.textContent="Publishing\u2026",c.allowDismiss(!1);try{await j("/live-edit/publish",{method:"POST"}),t=0,a(),c.close(),P(`Live on ${p} \u2713`)}catch(m){c.allowDismiss(!0),u.disabled=!1,f.disabled=!1,u.textContent="Try again",c.body.replaceChildren(K(J(m,"publish that")))}})};l.publishButton.addEventListener("click",()=>{t!==0&&(document.activeElement?.blur?.(),r())});let d=()=>{let h=document.body.classList.contains("editing");Pe(!0),Be(!1),l.toolbar.style.display="none";let p=document.createElement("div");p.className="le-back";let c=null,f=x=>{if(x&&!c){c=document.createElement("div"),c.className="le-phone";let S=document.createElement("iframe"),C=new URL(window.location.href);C.searchParams.set("live-edit","off"),S.src=C.toString(),S.title="This page on a phone",c.append(S),l.shadow.append(c)}else!x&&c&&(c.remove(),c=null)},m=[["Desktop",!1],["Phone",!0]].map(([x,S])=>{let C=$("button","le-back-btn",x);return C.type="button",C.addEventListener("click",()=>{m.forEach(T=>T.classList.remove("is-on")),C.classList.add("is-on"),f(S)}),p.append(C),C});if(m[0].classList.add("is-on"),e.previewUrl){let x=$("button","le-back-btn","Copy a link to this");x.type="button",x.title="A link that shows this unpublished version to somebody else",x.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(e.previewUrl),l.toast("Link copied \u2713")}catch{window.prompt("Copy this link:",e.previewUrl)}}),p.append(x)}let y=$("button","le-back-btn","Back to editing");y.type="button",y.addEventListener("click",()=>{f(!1),p.remove(),document.removeEventListener("keydown",b,!0),l.toolbar.style.display="",Be(h)});let b=x=>{x.key==="Escape"&&y.click()};document.addEventListener("keydown",b,!0),p.append(y),l.shadow.append(p),y.focus()};l.previewButton.addEventListener("click",d)});let Io=()=>{let e=document.querySelectorAll('nav, [role="navigation"], header ul'),t=new Map,a=r=>r.closest("#wpadminbar, #adminmenu, #wp-toolbar, #live-edit-ui, [data-no-edit], [data-live-edit-chrome]")!==null;return e.forEach(r=>{a(r)||r.querySelectorAll("a[href]").forEach(d=>{if(a(d))return;let h;try{h=new URL(d.getAttribute("href"),window.location.href)}catch{return}if(h.origin!==window.location.origin||/\.(pdf|zip|jpe?g|png|gif|svg|webp|mp4|mp3)$/i.test(h.pathname)||h.pathname===window.location.pathname&&h.hash)return;let p=(d.textContent??"").replace(/\s+/g," ").trim();p===""||p.length>22||t.has(h.pathname)||t.set(h.pathname,{label:p,href:h.href})})}),[...t.values()].slice(0,6)};(()=>{let e=Io();if(e.length<2)return;let t=window.location.pathname.replace(/\/$/,"");e.forEach(a=>{let r=$("button","le-page-btn",a.label);r.type="button",r.title=a.href,new URL(a.href).pathname.replace(/\/$/,"")===t?r.classList.add("is-on"):r.addEventListener("click",()=>{sessionStorage.setItem("tb_editing","1"),window.location.href=a.href}),l.pageSwitcher.append(r)}),l.pageSwitcher.hidden=!1})();let pa=(async()=>{let e=l.languagePicker;if(!e)return;let t;try{t=await(await j("/live-edit/translations",{method:"GET"})).json()}catch{return}let a=t?.locales??[],r=t?.default_locale??"en";if(a.length<2)return;a.forEach(u=>{let m=$("option",null,t?.names?.[u]??u.toUpperCase());m.value=u,e.append(m)});let d=window.liveEditLocale??r;e.value=d,e.hidden=!1;let h=(u,m)=>{if(document.querySelectorAll("[data-live-edit-stale]").forEach(b=>b.removeAttribute("data-live-edit-stale")),m===r)return 0;let y=0;return(u??[]).filter(b=>b.locale===m&&b.current===!1).forEach(b=>{document.querySelectorAll(`[data-edit="setting:${CSS.escape(b.key)}"]`).forEach(x=>{x.setAttribute("data-live-edit-stale",""),y++})}),y},p=t?.stale??[];if(h(p,d),(t?.counts?.stale??0)>0&&d===r){let u=Object.keys(t?.needing_review??{}).length;w(u===1?`1 translation may need updating since the ${r.toUpperCase()} changed.`:`${u} languages have translations that may need updating.`)}let f=0;e.addEventListener("change",async()=>{let u=e.value,m=++f;e.disabled=!0;try{let y=await(await j(`/live-edit/content?locale=${encodeURIComponent(u)}`,{method:"GET"})).json();if(m!==f)return;window.liveEditLocale=u;let{applyContent:b}=await Promise.resolve().then(()=>(pt(),ct));b(document,y?.settings??{});try{p=(await(await j("/live-edit/translations",{method:"GET"})).json())?.stale??p}catch{}let x=h(p,u);w(u===r?"Editing the original.":x>0?`Editing in ${e.options[e.selectedIndex]?.text??u}. ${x===1?"1 sentence on this page has":`${x} sentences on this page have`} fallen behind the original.`:`Editing in ${e.options[e.selectedIndex]?.text??u}. Saves here do not change the original.`)}catch{if(m!==f)return;e.value=window.liveEditLocale??r,w("Could not load that language. Nothing has been changed.")}finally{m===f&&(e.disabled=!1)}})})(),en=`live-edit:redo:${n?.site??window.location.host}`,Ct=()=>{try{return JSON.parse(sessionStorage.getItem(en)??"[]")}catch{return[]}},tn=e=>{try{sessionStorage.setItem(en,JSON.stringify(e.slice(-20)))}catch{}},He=()=>{l.undoButton.disabled=(window.liveEditPublishing?.pending??0)===0,l.redoButton.disabled=Ct().length===0};Zt(He),He();let nn=async()=>{l.undoButton.disabled=!0;let e;try{e=((await(await j("/live-edit/changes",{method:"GET"})).json())?.changes??[])[0]}catch(a){l.toast(J(a,"undo that")),He();return}if(!e){l.toast("There is nothing left to undo. Everything is published."),He();return}let t=Oe(e);try{await j("/live-edit/changes",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:e.key,kind:e.kind})})}catch(a){l.toast(J(a,"undo that")),He();return}tn([...Ct(),{key:e.key,kind:e.kind,value:e.after,label:t}]),P(`Undone: ${t}`)},on=async()=>{let e=Ct(),t=e.pop();if(!t){l.toast("There is nothing to put back.");return}l.redoButton.disabled=!0;try{if(t.kind==="style")throw new Error("A styling change cannot be put back automatically yet.");await j("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:t.key,value:t.value,locale:window.liveEditLocale})})}catch(a){l.toast(J(a,"put that back")),l.redoButton.disabled=!1;return}tn(e),P(`Put back: ${t.label}`)};l.undoButton.addEventListener("click",()=>void nn()),l.redoButton.addEventListener("click",()=>void on()),document.addEventListener("keydown",e=>{!(e.metaKey||e.ctrlKey)||e.key.toLowerCase()!=="z"||(l.shadow.activeElement??document.activeElement)?.closest?.('input, textarea, [contenteditable="true"]')||(e.preventDefault(),e.shiftKey?on():nn())}),l.closeButton.addEventListener("click",()=>Pe()),l.cancelButton.addEventListener("click",()=>Pe()),l.saveButton.addEventListener("click",ro),_?.addEventListener("click",async()=>{!v||v.kind!=="record"||window.confirm("Delete this item?")&&(await j(`/live-edit/record/${v.type}/${v.id}`,{method:"DELETE"}),P("Deleted \u2713"))}),document.querySelectorAll("[data-live-create]").forEach(e=>{e.addEventListener("click",async()=>{await j("/live-edit/record/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:e.dataset.liveCreate})}),P("Added \u2713 \u2014 click it to edit")})});let Lt=new URLSearchParams(window.location.search);if(Lt.has("edit")){Lt.delete("edit");let e=Lt.toString();window.history.replaceState(null,"",window.location.pathname+(e?`?${e}`:"")),Be(!0)}else Be(sessionStorage.getItem("tb_editing")==="1")}};window.liveEditDisplayedValue=n=>Ot({editValue:n.dataset.editValue,ownText:be(n),fullText:n.textContent});var Mt=(()=>{let n=!1;return()=>{n||new URLSearchParams(window.location.search).get("live-edit")!=="off"&&(n=!0,da())}})();document.readyState==="complete"?Mt():(window.addEventListener("load",Mt,{once:!0}),window.setTimeout(Mt,2e3));
