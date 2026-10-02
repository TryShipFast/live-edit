var Mo=Object.defineProperty;var De=(n,o)=>()=>(n&&(o=n(n=0)),o);var Tt=(n,o)=>{for(var i in o)Mo(n,i,{get:o[i],enumerable:!0})};var mn,wn,yn,Jo,vn,xn,It,be,kn,En,Sn,dt,ct,Go,qe,Cn,Ln,pt=De(()=>{mn=n=>{let[o,...i]=String(n??"").split(":");return{kind:o,key:i.join(":"),parts:i}},wn=(n,o={})=>({...o,headers:{"X-CSRF-TOKEN":n,Accept:"application/json",...o.headers??{}}}),yn=n=>(n?.headers?.get?.("content-type")??"").includes("json"),Jo=/\.((?:fa|fas|far|fab|fal|fad|bi|ti|icon|flaticon|glyphicon|ion|mdi)-[a-z0-9][a-z0-9-]*)::?before/gi,vn=n=>{let o=[];for(let i of String(n??"").split("}")){let r=i.indexOf("{");if(r===-1)continue;let h=i.slice(r+1).match(/content\s*:\s*(["'])(.*?)\1/);if(!h)continue;let l=h[2].match(/^\\([0-9a-f]{1,6})\s*$/i),w=l?String.fromCodePoint(parseInt(l[1],16)):h[2];if([...w].length===1)for(let k of i.slice(0,r).matchAll(Jo))o.push({name:k[1],glyph:w})}return o},xn=(n,o,i,r,h)=>{let l=n.filter(w=>w!==i&&!r.includes(w));return h.forEach(w=>l.includes(w)||l.push(w)),l.push(o),l.join(" ")},It=({editValue:n,ownText:o,fullText:i})=>(n??"")!==""?n:(o??"").trim()!==""?o:i??"",be=n=>n.children.length?[...n.childNodes].filter(o=>o.nodeType===3).map(o=>o.textContent).join(""):n.textContent,kn=n=>{let o=new Set,i=[];for(let r of n)for(let h of r.icons)o.has(h.name)||(o.add(h.name),i.push({...h,face:r.face,variant:r.variant}));return i.sort((r,h)=>r.name.localeCompare(h.name))},En=(n,o)=>{let i=Object.keys(o??{}),r=String(n??"").split(",").map(h=>h.trim()).filter(Boolean);return r.length===0?i:i.length===0?r:r.filter(h=>i.includes(h))},Sn=(n,o={},i)=>{let r=String(i?.base??"").replace(/\/$/,""),[h,l]=String(n).split("?"),w={"/live-edit/setting":`${r}/${i?.site}/content`,"/live-edit/style":`${r}/${i?.site}/styles`,"/live-edit/publish":`${r}/${i?.site}/publish`,"/live-edit/image":`${r}/${i?.site}/media`,"/live-edit/upload":`${r}/${i?.site}/media`,"/live-edit/changes":`${r}/${i?.site}/changes`,"/live-edit/versions":`${r}/${i?.site}/versions`,"/live-edit/content":`${r}/${i?.site}/content`,"/live-edit/translations":`${r}/${i?.site}/translations`,"/live-edit/credits":`${r}/${i?.site}/credits`,"/live-edit/assist":`${r}/${i?.site}/assist`,"/live-edit/photos":`${r}/${i?.site}/photos`,"/live-edit/photos/used":`${r}/${i?.site}/photos/used`,"/live-edit/imagine":`${r}/${i?.site}/imagine`},k=i?.routes?.[h]??(h==="/live-edit/publish"?i?.publishUrl:null);if(k)return{url:l?`${k}?${l}`:k,init:{...o,headers:{...o.headers??{},...i.routeHeaders??i.publishHeaders??{},Accept:"application/json"},credentials:"same-origin"}};let C=w[h];if(!r||!i?.site||!i?.token)throw new Error("The content API is not configured on this page.");if(!C)throw new Error(`Editing that is not available over the content API yet (${h}).`);return{url:l?`${C}?${l}`:C,init:{...o,headers:{...o.headers??{},Authorization:`Bearer ${i.token}`,Accept:"application/json"}}}},dt=(n,o,i)=>n.hasAttribute(o)?n.getAttribute(o):n.dataset?.[i]??"",ct=n=>{let o=String(n??"").trim();return o===""?!1:/^data:image\//i.test(o)||/\/live-edit\/(sites|media)\//i.test(o)?!0:/\.(jpe?g|png|gif|webp|avif|svg)(\?|#|$)/i.test(o)},Go=(n,o)=>o==null?!0:o===408||o===425||o===429||o>=500,qe=async(n,{tries:o=3,waits:i=[200,500],sleep:r=null}={})=>{let h=r??(w=>new Promise(k=>setTimeout(k,w))),l=null;for(let w=0;w<o;w++)try{return await n()}catch(k){if(l=k,w===o-1||!Go(k,k.status))throw k;await h(i[Math.min(w,i.length-1)])}throw l},Cn=(n,o=null)=>{if(!n)return"";let i=n.dataset?.background||n.dataset?.bg||n.dataset?.backgroundImage;if(i)return i;let r=o??n.ownerDocument?.defaultView??(typeof window>"u"?null:window),l=(r?.getComputedStyle&&r.getComputedStyle(n).backgroundImage||"").match(/url\((['"]?)(.*?)\1\)/);if(l&&!l[2].startsWith("data:"))return l[2];let w=n.dataset?.kbBg||"";return w.startsWith("data:")?"":w},Ln=(n,o)=>{let i=n.tagName,r;return i==="IMG"?r=["radius","hidden"]:i==="A"||i==="BUTTON"?r=["background","textColor","fontSize","radius","hidden"]:/^(H[1-6]|P|SPAN|LI|BLOCKQUOTE|FIGCAPTION|DT|DD|TD|TH|CAPTION|CITE|Q|LABEL|STRONG|EM)$/.test(i)?r=["textColor","fontSize","hidden"]:r=["background","backgroundImage","paddingY","paddingX","radius","hidden"],n.hasAttribute?.("data-edit-bg")&&(r=r.filter(h=>h!=="backgroundImage")),o.filter(h=>r.includes(h.trim()))}});var Ko,An,Tn=De(()=>{Ko=[[/(<meta[^>]+name=["']csrf-token["'][^>]+content=["'])[^"']*/gi,"$1"],[/(\sdata-csrf=["'])[^"']*/gi,"$1"],[/(\swire:snapshot=["'])[^"']*/gi,"$1"],[/(\swire:effects=["'])[^"']*/gi,"$1"],[/(\swire:id=["'])[^"']*/gi,"$1"],[/(name=["']_token["'][^>]+value=["'])[^"']*/gi,"$1"],[/(\snonce=["'])[^"']*/gi,"$1"],[/(=["'])lofi-[0-9a-z-]*/gi,"$1"],[/(\sstyle=["'])display:\s*none;?(?=["'])/gi,"$1"]],An=n=>Ko.reduce((o,[i,r])=>o.replace(i,r),String(n??""))});var jt={};Tt(jt,{applyTags:()=>Pt,autoTag:()=>Je,elementAt:()=>$n,ensureBackgroundsAreFound:()=>ea,fingerprint:()=>Nn,refreshBackgrounds:()=>ta,resolveBackgrounds:()=>Bt,watchForLateBackgrounds:()=>Bn,watchForLateContent:()=>Pn});var Xo,Nn,$n,Pt,Qo,Zo,On,In,Bt,ea,ta,Pn,Bn,Je,Rt=De(()=>{Tn();pt();Xo="kb_tags_",Nn=n=>{let o=2166136261;for(let i=0;i<n.length;i++)o^=n.charCodeAt(i),o=Math.imul(o,16777619);return(o>>>0).toString(16)},$n=(n,o)=>{let i=n.documentElement;for(let r of o)if(i=[...i?.children??[]][r],!i)return null;return i},Pt=(n,o)=>{let i=0;for(let{at:r,attributes:h}of o??[]){let l=$n(n,r);if(l){for(let[w,k]of Object.entries(h))l.hasAttribute(w)||l.setAttribute(w,k);i++}}return i},Qo=n=>{try{return JSON.parse(window.sessionStorage?.getItem(n)??"null")}catch{return null}},Zo=(n,o)=>{try{window.sessionStorage?.setItem(n,JSON.stringify(o))}catch{}},On=n=>n.hasAttribute("data-kb-bg")||n.hasAttribute("data-background")||n.hasAttribute("data-bg")||n.hasAttribute("data-background-image")||/background-image|url\(/i.test(n.getAttribute("style")??""),In=(n,o)=>{if(On(n))return!1;let i=o.getComputedStyle(n).backgroundImage;if(!i||i==="none"||!i.includes("url("))return!1;let r=i.match(/url\(\s*["']?([^"')]+)/)?.[1];return!r||r.startsWith("data:")?!1:(n.setAttribute("data-kb-bg",r),!0)},Bt=(n=document)=>{let o=n.defaultView??window;if(!o?.getComputedStyle)return 0;let i=0;for(let r of n.querySelectorAll("body *"))In(r,o)&&i++;return i},ea=async(n,o=document)=>{let i=o.defaultView??window;if(i.liveEditBackgroundsWatched)return 0;i.liveEditBackgroundsWatched=!0;let r=await Je(n,o);return Bn(o,()=>{Je(n,o).catch(h=>{console.warn("[live-edit] could not tag a late background:",h.message)})}),Pn(o,()=>{Je(n,o,{because:"new content"}).catch(h=>{console.warn("[live-edit] could not tag what just appeared:",h.message)})}),r},ta=async(n,o=document)=>Bt(o)===0&&o.querySelector("[data-kb-bg]:not([data-edit-bg])")===null?0:Je(n,o),Pn=(n=document,o=()=>{})=>{let i=n.defaultView??window;if(!i?.MutationObserver)return null;let r=10,h=0,l=null,w=C=>!C||C.nodeType!==1||C.matches?.("[data-edit], [data-edit-img], [data-style]")?!1:(C.textContent??"").trim()!==""&&!C.querySelector?.("[data-edit]")?!0:!!(C.matches?.("img:not([data-edit-img])")||C.querySelector?.("img:not([data-edit-img])")),k=new i.MutationObserver(C=>{if(h>=r){k.disconnect();return}!C.some(z=>[...z.addedNodes].some(w))||l||(l=i.setTimeout(()=>{l=null,h+=1,o()},600))});return k.observe(n.body??n.documentElement,{childList:!0,subtree:!0}),k},Bn=(n=document,o=()=>{})=>{let i=n.defaultView??window;if(!i?.IntersectionObserver||!i.getComputedStyle)return null;let r=new Set,h=null,l=()=>{if(h=null,r.size===0)return;let N=[...r];r.clear(),o(N)},w=5,k=new WeakMap,C=N=>{if(In(N,i))return r.add(N),O.unobserve(N),h||(h=i.setTimeout(l,250)),!0;let Y=(k.get(N)??0)+1;return k.set(N,Y),Y>=w&&O.unobserve(N),!1},O=new i.IntersectionObserver(N=>{for(let Y of N){if(!Y.isIntersecting)continue;let _=Y.target;C(_)||i.setTimeout(()=>C(_),400)}},{rootMargin:"300px"}),z=[...n.querySelectorAll("body *")].filter(N=>!On(N)),I=4e3;return z.length>I&&console.warn(`[live-edit] watching the first ${I} of ${z.length} elements for late backgrounds`),z.slice(0,I).forEach(N=>O.observe(N)),O},Je=async({base:n,site:o,key:i,page:r},h=document,{because:l=null}={})=>{let w=h.querySelector("[data-edit], [data-edit-img]")!==null;if(Bt(h),w&&!(h.querySelector("[data-kb-bg]:not([data-edit-bg])")!==null)&&l===null)return 0;let C=h.documentElement.outerHTML,O=Xo+Nn(An(C)),z=Qo(O);if(z)return Pt(h,z);let I=JSON.stringify({html:C,page:r??h.location?.pathname??""}),{elements:N}=await qe(async()=>{let Y=await fetch(`${String(n).replace(/\/$/,"")}/${o}/tag`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json",Authorization:`Bearer ${i}`},body:I});if(!Y.ok){let _=new Error(`Tagging answered ${Y.status}`);throw _.status=Y.status,_}return Y.json()});return Zo(O,N),Pt(h,N)}});var na,oa,aa,jn,Rn,zn=De(()=>{na=new Set(["svg","g","defs","symbol","use","title","desc","path","circle","ellipse","line","polygon","polyline","rect","text","tspan","textpath","lineargradient","radialgradient","stop","clippath","mask","pattern"]),oa=new Set(["viewbox","xmlns","width","height","fill","fill-rule","fill-opacity","stroke","stroke-width","stroke-linecap","stroke-linejoin","stroke-dasharray","stroke-dashoffset","stroke-opacity","stroke-miterlimit","opacity","d","points","x","y","x1","y1","x2","y2","cx","cy","r","rx","ry","transform","offset","stop-color","stop-opacity","gradientunits","gradienttransform","patternunits","clip-rule","clip-path","mask","id","class","role","aria-label","aria-hidden","focusable","preserveaspectratio","vector-effect","text-anchor","font-size","font-family"]),aa=8,jn=n=>{let o=String(n??"").trim();if(o===""||!/<svg/i.test(o))return null;let i=new DOMParser().parseFromString(o,"image/svg+xml"),r=i.documentElement;return!r||r.tagName?.toLowerCase()!=="svg"||i.querySelector("parsererror")||(Rn(r),r.children.length===0&&r.textContent.trim()==="")?null:r},Rn=n=>{for(let o of[...n.childNodes]){if(o.nodeType===aa){o.remove();continue}if(o.nodeType===1){if(!na.has(o.tagName.toLowerCase())){o.remove();continue}Rn(o)}}for(let o of[...n.attributes]){let i=o.name.toLowerCase(),r=o.value,l=i==="href"||i==="xlink:href"?r.trim().startsWith("#"):oa.has(i);l&&/url\(/i.test(r)&&!/^url\(\s*#/i.test(r.trim())&&(l=!1),l||n.removeAttribute(o.name)}}});var ut={};Tt(ut,{applyBackground:()=>_n,applyContent:()=>Hn,applyIcon:()=>Un,applyOrder:()=>Wn,applyStyles:()=>Jn,applySvg:()=>Mn,applyValue:()=>Ft,defendContent:()=>Yn,fetchContent:()=>Kn,fetchSnapshot:()=>Gn,resolve:()=>Xn,styleRules:()=>Vn});var zt,Fn,ia,ra,Ft,sa,Dt,la,da,ca,Dn,pa,Mn,Un,_n,Wn,Hn,Yn,Vn,Jn,Gn,Kn,qn,ua,Xn,ht=De(()=>{zn();pt();zt=(n,o)=>Object.assign(new Error(n),{status:o}),Fn="setting:",ia=(n,o)=>{let i=n.currentSrc||n.getAttribute("src")||"";if(i!==""&&new URL(i,document.baseURI).href===new URL(o,document.baseURI).href)return;let h=i!==""&&n.complete;if(n.setAttribute("src",o),!h)return;n.style.transition="opacity 120ms ease-out",n.style.opacity="0";let l=()=>{n.style.opacity="1",setTimeout(()=>{n.style.removeProperty("transition"),n.style.removeProperty("opacity")},160)};if(n.decode){n.decode().then(l,l);return}n.addEventListener("load",l,{once:!0}),n.addEventListener("error",l,{once:!0})},ra=(n,o)=>{for(let i of n.querySelectorAll("[data-edit-img]")){let r=(i.getAttribute("data-edit-img")??"").replace(/^setting:/,""),h=o[r];if(typeof h!="string"||h==="")continue;let l=i.currentSrc||i.getAttribute("src")||"";if(l!==""&&new URL(l,document.baseURI).href===new URL(h,document.baseURI).href)continue;let w=new Image;w.decoding="async",w.src=h}},Ft=(n,o,{keepRuns:i=!1}={})=>{let r=n.tagName?.toLowerCase();if(r==="img"){ia(n,o),sa(n);return}if(r==="source"){n.setAttribute("srcset",o);return}Dt(n,o,i)},sa=n=>{if(n.removeAttribute("srcset"),n.removeAttribute("sizes"),n.parentElement?.tagName==="PICTURE")for(let o of[...n.parentElement.children])o.tagName==="SOURCE"&&o.remove()},Dt=(n,o,i=!1)=>{let r=[...n.childNodes].filter(j=>j.nodeType===pa);if(r.length===0){let j=[...n.children];if(j.length===1&&j[0].children.length===0){Dt(j[0],o);return}n.append(o);return}if(r.length===1){Dn(r[0],o);return}let h=r.map(j=>j.nodeValue),l=h.join(""),w=0;for(;w<l.length&&w<o.length&&l[w]===o[w];)w+=1;let k=0;for(;k<l.length-w&&k<o.length-w&&l[l.length-1-k]===o[o.length-1-k];)k+=1;let C=w,O=l.length-k,z=o.slice(w,o.length-k),I=0,N=!1,Y=h.map(j=>{let E=I,H=I+j.length;if(I=H,N||C<E||O>H)return j;N=!0;let oe=j.slice(0,C-E),ae=j.slice(O-E),V=oe===""&&/^\s/.test(j)&&!/^\s/.test(z)?j.match(/^\s+/)[0]:"",Q=ae===""&&/\s$/.test(j)&&!/\s$/.test(z)?j.match(/\s+$/)[0]:"";return oe+V+z+Q+ae});if(N){r.forEach((j,E)=>{j.nodeValue=Y[E]});return}let _=ca(h,o);if(_!==null){r.forEach((j,E)=>{j.nodeValue=_[E]});return}Dn(r[0],o),r.slice(1).forEach(j=>{if(i){j.nodeValue="";return}j.remove()})},la=(n,o)=>{let i=n.length,r=o.length,h=r+1,l=new Int32Array((i+1)*h);for(let k=i-1;k>=0;k-=1)for(let C=r-1;C>=0;C-=1)l[k*h+C]=n[k]===o[C]?l[(k+1)*h+C+1]+1:Math.max(l[(k+1)*h+C],l[k*h+C+1]);let w=[];for(let k=0,C=0;k<i&&C<r;)n[k]===o[C]?(w.push([k,C]),k+=1,C+=1):l[(k+1)*h+C]>=l[k*h+C+1]?k+=1:C+=1;return w},da=(n,o)=>{let i=new Map(n.map(([h,l])=>[h,l])),r=h=>{let l=0;for(let w=h<0?o-1:o;i.has(w);w+=h){let k=i.get(w+h);if(l+=1,k===void 0||Math.abs(k-i.get(w))!==1)break}return l};return Math.max(r(-1),r(1))},ca=(n,o)=>{let i=n.join("");if(i.length===0||o.length===0||i.length*o.length>25e4)return null;let r=la(i,o),h=new Map(r.map(([C,O])=>[C,O])),l=[],w=0,k=0;for(let C of n.slice(0,-1)){if(k+=C.length,da(r,k)<3)return null;let O=w;for(let z=k-1;z>=0;z-=1)if(h.has(z)){O=Math.max(w,h.get(z)+1);break}l.push(o.slice(w,O)),w=O}return l.push(o.slice(w)),l},Dn=(n,o)=>{let i=n.nodeValue,r=/^\s/.test(i)&&!/^\s/.test(o)?" ":"",h=/\s$/.test(i)&&!/\s$/.test(o)?" ":"";n.nodeValue=r+o+h},pa=3,Mn=(n,o)=>{let i=jn(o);if(!i)return!1;let r=document.importNode(i,!0);for(let h of["class","width","height","style","data-edit-svg","data-edit-label"])n.hasAttribute(h)&&r.setAttribute(h,n.getAttribute(h));return n.replaceWith(r),!0},Un=(n,o)=>{let i=String(o).replace(/[^A-Za-z0-9_\- ]/g,"").split(/\s+/).filter(Boolean),r=n.getAttribute("data-edit-icon-current");if(i.length===0||!r)return!1;let h=i.length===1?(n.getAttribute("class")??"").trim().split(/\s+/).map(l=>l===r?i[0]:l):i;return n.setAttribute("class",h.join(" ")),n.setAttribute("data-edit-icon-current",i.length===1?i[0]:i[i.length-1]),!0},_n=(n,o)=>{for(let r of["data-background","data-bg","data-background-image"])n.hasAttribute(r)&&n.setAttribute(r,o);let i=(n.getAttribute("style")??"").replace(/background-image\s*:[^;]*;?/gi,"").trim();n.setAttribute("style",`${i?i.replace(/;?$/,";"):""}background-image:url('${o}')`)},Wn=(n,o)=>{let i=0;for(let r of n.querySelectorAll("[data-edit-list]")){let h=r.getAttribute("data-edit-list");if(!Object.hasOwn(o,h))continue;let l;try{l=JSON.parse(o[h])}catch{continue}if(!Array.isArray(l)||l.length===0)continue;let w=new Map;for(let C of[...r.children])C.hasAttribute("data-edit-item")&&(w.set(C.getAttribute("data-edit-item"),C),r.removeChild(C));if(w.size===0)continue;let k=w.values().next().value;for(let C of l){let O=w.get(String(C));if(O){r.appendChild(O);continue}let z=k.cloneNode(!0);z.setAttribute("data-edit-item",String(C)),r.appendChild(z)}i++}return i},Hn=(n,o)=>{let i=0;Wn(n,o),ra(n,o);for(let r of n.querySelectorAll("[data-edit]")){let h=r.getAttribute("data-edit")??"";if(!h.startsWith(Fn))continue;let l=h.slice(Fn.length);Object.hasOwn(o,l)&&(Ft(r,o[l]),i++)}for(let r of n.querySelectorAll("[data-edit-img]")){let h=(r.getAttribute("data-edit-img")??"").replace(/^setting:/,"");Object.hasOwn(o,h)&&(Ft(r,o[h]),o[h]?r.dataset.editPreview=o[h]:delete r.dataset.editPreview,i++);for(let[l,w]of[["Alt","alt"],["Title","title"],["Srcset","srcset"]])if(Object.hasOwn(o,h+l)){let k=o[h+l];k===""&&w!=="alt"?r.removeAttribute(w):r.setAttribute(w,k),i++}}for(let r of n.querySelectorAll("[data-edit-svg]")){let h=(r.getAttribute("data-edit-svg")??"").replace(/^setting:/,""),l=o[h];!Object.hasOwn(o,h)||String(l??"").trim()===""||Mn(r,l)&&i++}for(let r of n.querySelectorAll("[data-edit-icon]")){let h=(r.getAttribute("data-edit-icon")??"").replace(/^setting:/,""),l=o[h];!Object.hasOwn(o,h)||l===""||Un(r,l)&&i++}for(let r of n.querySelectorAll("[data-edit-bg]")){let h=(r.getAttribute("data-edit-bg")??"").replace(/^setting:/,""),l=o[h];!Object.hasOwn(o,h)||l===""||(_n(r,l),i++)}for(let r of n.querySelectorAll("[data-edit-href]")){let h=r.getAttribute("data-edit-href");Object.hasOwn(o,h)&&(r.setAttribute("href",o[h]),i++)}return i},Yn=(n,{limit:o=12,debounce:i=60}={})=>{let r=n.defaultView??(typeof window>"u"?null:window);if(!r?.MutationObserver)return null;let h=n.querySelectorAll("[data-edit], [data-edit-img], [data-edit-href]");if(h.length===0)return null;let l=new Map;for(let I of h)l.set(I,{words:I.hasAttribute("data-edit")?be(I):null,src:I.getAttribute("src"),href:I.hasAttribute("data-edit-href")?I.getAttribute("href"):null});let w=0,k=!1,C=null,O=()=>{if(C=null,!n.body?.classList?.contains("editing")){w++,k=!0;for(let[I,N]of l)I.isConnected&&(N.words!==null&&be(I)!==N.words&&Dt(I,N.words),N.src!==null&&I.getAttribute("src")!==N.src&&(I.setAttribute("src",N.src),I.removeAttribute("srcset")),N.href!==null&&I.getAttribute("href")!==N.href&&I.setAttribute("href",N.href));z.takeRecords(),k=!1,w>=o&&(z.disconnect(),console.warn(`[live-edit] this page keeps rewriting itself; the client's content was put back ${w} times and is now being left alone.`))}},z=new r.MutationObserver(()=>{k||C||w>=o||(C=r.setTimeout(O,i))});for(let I of h)z.observe(I,{characterData:!0,childList:!0,subtree:!0,attributes:!0,attributeFilter:["src","srcset","href"]});return z},Vn=(n,o)=>{let i=`[data-style="${n}"]`,r="",h="";for(let[l,w]of Object.entries(o??{}))if(!(w===""||w===null||w===void 0)){if(l==="hidden"){r+=`body:not(.editing) ${i}{display:none !important}`,r+=`body.editing ${i}{opacity:.45}`;continue}h+={backgroundImage:`background-image:url('${w}') !important;background-size:cover !important;background-position:center !important;`,background:`background:${w} !important;`,textColor:`color:${w} !important;`,fontSize:`font-size:${w}px !important;`,radius:`border-radius:${w}px !important;`,paddingX:`padding-left:${w}px !important;padding-right:${w}px !important;`,paddingY:`padding-top:${w}px !important;padding-bottom:${w}px !important;`}[l]??""}return h===""?r:r+`${i}{${h}}`},Jn=(n,o)=>{let i=Object.entries(o??{}).map(([w,k])=>Vn(w,k)).join("");if(i==="")return 0;let r="live-edit-styles",h=n.getElementById?.(r)??n.querySelector?.(`#${r}`)??null,l=h??n.createElement("style");return l.id=r,l.textContent=i,h||(n.head??n.body)?.appendChild(l),Object.keys(o).length},Gn=async({snapshot:n,locale:o})=>{let i=String(n).replace(/\/$/,""),r=await qe(()=>fetch(`${i}/current.json`).then(l=>{if(!l.ok)throw zt(`Pointer answered ${l.status}`,l.status);return l.json()}));if(!r.version)return{settings:{},styles:{}};let h=o??"en";return qe(async()=>{let l=await fetch(`${i}/v${r.version}/${h}.json`);if(!l.ok)throw zt(`Version answered ${l.status}`,l.status);return l.json()})},Kn=async({base:n,site:o,key:i,locale:r})=>{let h=`${String(n).replace(/\/$/,"")}/${o}/content${r?`?locale=${encodeURIComponent(r)}`:""}`;return qe(async()=>{let l=await fetch(h,{headers:{Authorization:`Bearer ${i}`,Accept:"application/json"}});if(!l.ok)throw zt(`Content service answered ${l.status}`,l.status);return l.json()})},qn=async()=>{let n=typeof window<"u"?window.liveEditContent:null;if(!n)return;let o=null,i=null;try{let r=await Xn(n);r&&(r.styleProps&&(window.liveEditStyleProps=r.styleProps),typeof r.pending=="number"&&r.styleProps&&(window.liveEditPublishing={...window.liveEditPublishing??{},pending:r.pending}),o=Hn(document,r.settings??{}),Jn(document,r.styles??{}),window.liveEditStyles=r.styles??{},Yn(document))}catch(r){i=r,console.warn("[live-edit] serving the words already in the page:",r.message)}ua({applied:o,failed:i?i.message:null})},ua=n=>{window.liveEditContentDone=n,document.dispatchEvent(new CustomEvent("live-edit:content",{detail:n}))},Xn=async n=>{if(n.snapshot)try{return await Gn(n)}catch(o){let i=o.message.includes("fetch")?" (if the files are on another origin, the bucket or CDN must allow cross-origin reads)":"";if(!n.base)throw new Error(o.message+i);console.warn("[live-edit] falling back to the content API:",o.message+i)}return n.base&&n.site&&n.key?Kn(n):null};typeof document<"u"&&(document.readyState==="loading"?document.addEventListener("DOMContentLoaded",qn):qn())});var no={};Tt(no,{collectFromFragment:()=>Zn,contentConfigFor:()=>ba,currentSession:()=>fa,forget:()=>ha,requestLink:()=>ga,store:()=>eo,stored:()=>to});var qt,Qn,Zn,eo,to,ha,ga,fa,ba,oo=De(()=>{qt="kb_session",Qn="kb_session=",Zn=(n=window)=>{let o=n.location?.hash??"",i=o.indexOf(Qn);if(i===-1)return null;let r=decodeURIComponent(o.slice(i+Qn.length).split("&")[0]);if(r==="")return null;eo(r,n);let h=o.slice(0,i).replace(/[#&]$/,"");return n.history?.replaceState?.(null,"",n.location.pathname+n.location.search+h),r},eo=(n,o=window)=>{try{o.sessionStorage?.setItem(qt,n)}catch{}},to=(n=window)=>{try{return n.sessionStorage?.getItem(qt)??null}catch{return null}},ha=(n=window)=>{try{n.sessionStorage?.removeItem(qt)}catch{}},ga=async({base:n,site:o},i,r=window)=>(await fetch(`${String(n).replace(/\/$/,"")}/sign-in`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({site:o,email:i,return_to:r.location.origin+r.location.pathname})})).ok,fa=(n=window)=>Zn(n)??to(n),ba=(n,o)=>{let i={base:n.api,site:n.site,locale:n.locale??null};return o?{...i,key:o,snapshot:null}:{...i,key:n.key,snapshot:n.snapshot??null}}});var Uo=`
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
/* A replaced picture, shown rather than described. Two addresses truncated to
   seventy characters told somebody nothing about which row to revert. */
.le-change-pictures { display: flex; gap: 12px; align-items: flex-start; margin-top: 6px; }
/* Sized by the picture rather than by the row: one frame on its own, which is
   the commonest case, stretched across the drawer and left most of it grey. */
.le-change-shot { margin: 0; flex: 0 1 auto; min-width: 0; }
.le-change-shot figcaption { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #9A9DA5; margin-bottom: 4px; }
/* Contained rather than cropped: which picture it is matters here, and the
   shape is part of recognising it. */
.le-change-shot img { display: block; height: 72px; width: auto; max-width: 100%; object-fit: contain; border-radius: 6px; background: #F4F5F7; }
.le-change-shot.is-before img { opacity: .55; }
.le-change-missing { display: block; font-size: 12px; color: #9A9DA5; word-break: break-all; }
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
`,_o=`
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
`,A=(n,o,i)=>{let r=document.createElement(n);return o&&(r.className=o),i!==void 0&&(r.textContent=i),r};function ln(){let n=document.createElement("style");n.id="live-edit-page-css",n.textContent=_o,document.head.append(n);let o=document.createElement("div");o.id="live-edit-ui",document.body.append(o);let i=o.attachShadow({mode:"open"}),r=document.createElement("style");r.textContent=Uo,i.append(r);let h=window.liveEditToolbar??{},l=A("div","le-toolbar"),w=window.liveEditEditor?.console??null,k=A(w?"a":"span","le-mark");k.innerHTML='<svg width="16" height="16" viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="3" width="20" height="20" rx="3" fill="none" stroke="#0B0C0F" stroke-width="2.5"/><path d="M16 15 L16 30 L19.6 26.4 L22.2 31.2 L24.6 30 L22 25.3 L27 25.3 Z" fill="#3148F5" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>',w&&(k.href=w,k.target="_blank",k.rel="noopener",k.title="Your dashboard: licence, editors, settings",k.setAttribute("aria-label","Open your dashboard"));let C=A("span","le-status le-when-roomy"),O=A("span","le-dot"),z=A("span",null,"");C.append(O,z),l.append(k,C);let I=window.liveEditEditor??null;if(I?.greeting){let B=A("span","le-hello le-when-roomy","Welcome "+I.greeting);l.append(B)}let N=null,Y=h.locales??{};Object.keys(Y).length>1&&(N=A("select","le-locale"),N.title="Language you are editing",Object.entries(Y).forEach(([B,F])=>{let D=A("option",null,F);D.value=B,D.selected=B===(h.locale??"en"),N.append(D)}),N.addEventListener("change",()=>{window.location.search="?locale="+N.value}),l.append(N));let _=A("button","le-bar-btn","Edit site");_.type="button";let j=B=>'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"'+(B?' style="transform: scaleX(-1)"':"")+'><path d="M9 14 4 9l5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 9h7a6 6 0 0 1 0 12H8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',E=A("button","le-round");E.type="button",E.title="Undo the last change you have not published",E.setAttribute("aria-label","Undo"),E.innerHTML=j(!1);let H=A("button","le-round");H.type="button",H.title="Put back what you just undid",H.setAttribute("aria-label","Redo"),H.innerHTML=j(!0);let oe=A("div","le-pages");oe.hidden=!0,oe.setAttribute("role","group"),oe.setAttribute("aria-label","Pages");let ae=A("select","le-lang");ae.hidden=!0,ae.title="Which language you are editing",ae.setAttribute("aria-label","Language");let V=A("button","le-bar-btn le-when-roomy","Changes");V.type="button",V.title="Everything you have changed and not published";let Q=A("button","le-bar-btn le-when-roomy","Preview");Q.type="button",Q.title="See the page the way a visitor will",Q.hidden=!0;let y=A("button","le-publish");y.type="button",y.title="Put your changes live",y.hidden=!0;let Ce=A("span",null,"Publish"),te=A("span","le-publish-count");if(te.hidden=!0,y.append(Ce,te),l.append(A("span","le-sep"),_,E,H,A("span","le-sep"),oe,ae,V,Q,y),(h.links??[]).forEach(B=>{let F=A("a","le-btn-ghost",B.label);F.href=B.href,B.title&&(F.title=B.title),l.append(F)}),h.logout?.href)if((h.logout.method??"get").toLowerCase()==="post"){let B=document.createElement("form");B.method="POST",B.action=h.logout.href;let F=document.createElement("input");F.type="hidden",F.name="_token",F.value=document.body.dataset.csrf??"";let D=A("button","le-btn-ghost","Log out");D.type="submit",B.append(F,D),l.append(B)}else{let B=A("a","le-btn-ghost","Log out");B.href=h.logout.href,l.append(B)}let re=A("div","le-drawer");re.setAttribute("role","dialog"),re.setAttribute("aria-modal","true"),re.setAttribute("aria-label","Edit content");let Ge=A("div","le-drawer-head"),Le=A("div","le-tabs");Le.setAttribute("role","tablist");let Ke={};["Edit","Changes","History"].forEach(B=>{let F=A("button","le-tab",B);F.type="button",F.dataset.tab=B,F.setAttribute("role","tab"),B==="Edit"&&F.classList.add("is-on"),Ke[B]=F,Le.append(F)});let Ae=A("button","le-close","\xD7");Ae.type="button",Ae.setAttribute("aria-label","Close"),Ge.append(Le,Ae);let Me=A("div","le-subject"),Xe=A("div","le-trail"),Te=A("div","le-title","Text");Me.append(A("div","le-eyebrow","Selected"),Xe,Te);let Qe=A("div","le-fields"),Ne=A("div","le-foot"),$e=A("button","le-btn-danger le-start le-hidden","Delete");$e.type="button";let Oe=A("button","le-btn-outline","Cancel");Oe.type="button";let pe=A("button","le-btn","Save changes");pe.type="button",Ne.append($e,Oe,pe),re.append(Ge,Me,Qe,Ne);let ue=A("button","le-handle");ue.type="button",ue.setAttribute("aria-label","Edit this link"),ue.innerHTML="&#9998;";let se=A("button","le-handle le-handle-bg");se.type="button",se.setAttribute("aria-label","Replace this background image"),se.title="Replace background image",se.textContent="Replace background";let Ie=A("div","le-hover"),Ue=A("span","le-hover-label");return Ie.append(Ue),i.append(l,re,ue,se,Ie),{root:o,shadow:i,toolbar:l,toggleButton:_,undoButton:E,redoButton:H,pageSwitcher:oe,languagePicker:ae,statusText:z,dot:O,localeSelect:N,drawer:re,drawerFoot:Ne,drawerTabs:Ke,drawerSubject:Me,drawerTitle:Te,drawerTrail:Xe,drawerFields:Qe,drawerDelete:$e,publishButton:y,publishLabel:Ce,publishCount:te,previewButton:Q,changesButton:V,closeButton:Ae,cancelButton:Oe,saveButton:pe,linkHandle:ue,bgHandle:se,hoverBox:Ie,hoverLabel:Ue,toast:(B,F=1800)=>{let D=A("div","le-toast",B);i.append(D),setTimeout(()=>D.style.opacity="0",F),setTimeout(()=>D.remove(),F+600)},modal:({title:B,subtitle:F,size:D="",dismissable:K=!0}={})=>{let me=A("div","le-scrim"),he=A("div",`le-modal ${D}`.trim());he.setAttribute("role","dialog"),he.setAttribute("aria-modal","true");let Ze=A("div","le-modal-heading"),et=A("div","le-modal-title",B??""),Pe=A("div","le-modal-sub",F??"");Pe.hidden=!F,Ze.append(et,Pe),he.setAttribute("aria-label",B??"Dialog");let ge=A("button","le-close","\xD7");ge.type="button",ge.setAttribute("aria-label","Close");let tt=A("div","le-modal-head");tt.append(Ze,ge);let _e=A("div","le-modal-tabs");_e.hidden=!0;let Be=A("div","le-modal-body"),We=A("div","le-modal-foot");We.hidden=!0,he.append(tt,_e,Be,We),me.append(he);let ft=document.activeElement,we=!1,ye=()=>{we||(we=!0,document.removeEventListener("keydown",nt,!0),me.remove(),ft?.focus?.(),fe.dismissable=!0)},nt=X=>{X.key==="Escape"&&fe.dismissable&&(X.stopPropagation(),ye())},fe={dismissable:K};return ge.addEventListener("click",ye),me.addEventListener("mousedown",X=>{X.target===me&&fe.dismissable&&ye()}),document.addEventListener("keydown",nt,!0),i.append(me),ge.focus(),{card:he,body:Be,foot:We,tabs:_e,close:ye,title:X=>et.textContent=X,subtitle:X=>{Pe.textContent=X??"",Pe.hidden=!X},allowDismiss:X=>{fe.dismissable=X,ge.hidden=!X}}}}}var lt=n=>Math.min(Math.max(Math.round(n),1),4e3),Nt=n=>{if(!n)return null;let o=Number(n.naturalWidth??0),i=Number(n.naturalHeight??0),r=n.getBoundingClientRect?.(),h=r&&r.width>=1&&r.height>=1?{width:lt(r.width),height:lt(r.height),exact:!1}:null;return o>=1&&i>=1&&(h===null||o>=r.width*2&&i>=r.height*2)?{width:lt(o),height:lt(i),exact:!0}:h},dn=(n,o)=>{let i=n.width,r=i/o;return r>n.height&&(r=n.height,i=r*o),{x:(n.width-i)/2,y:(n.height-r)/2,width:i,height:r}},cn=(n,o,i)=>{let r=i/(o||1);return{x:Math.max(0,Math.round(n.x*r)),y:Math.max(0,Math.round(n.y*r)),width:Math.max(1,Math.round(n.width*r)),height:Math.max(1,Math.round(n.height*r))}},pn=(n,o,i)=>{let r=(h,l)=>Math.max(0,Math.min(h,l));return{...n,x:r(n.x+o.x,i.width-n.width),y:r(n.y+o.y,i.height-n.height)}};var un=n=>Object.entries(n??{}).filter(([,o])=>String(o??"")!==""),hn=n=>[...n??[]].filter(o=>o.value!==(o.dataset?.imgAttrWas??""));var Ot="kb_verify",gn=(n,o=globalThis)=>{try{o.sessionStorage?.setItem(Ot,JSON.stringify(n))}catch{}},fn=(n=globalThis)=>{try{let o=n.sessionStorage?.getItem(Ot);return n.sessionStorage?.removeItem(Ot),o?JSON.parse(o):null}catch{return null}},Wo=(n,o)=>!o?.attr||!o?.marker?null:n.querySelector(`[${o.attr}="${o.marker.replace(/"/g,'\\"')}"]`),Ho=(n,o)=>{if(!n)return null;if(o==="image"){let r=Yo(n);return r?r.getAttribute("src"):null}if(o==="href")return n.getAttribute("href");if(o==="icon")return n.getAttribute("class")??"";let i=[...n.childNodes].filter(r=>r.nodeType===3).map(r=>r.textContent).join(" ").trim();return ce(i===""?n.textContent:i)},Yo=n=>n.tagName?.toLowerCase()==="img"?n:n.querySelector("img")??n.parentElement?.querySelector("img")??null,ce=n=>String(n??"").replace(/\s+/g," ").trim(),Vo=(n,o,i)=>{if(i===null)return!1;if(n==="image")return $t(i)!==""&&$t(i)===$t(o);if(n==="icon"){let r=ce(o).split(" ").filter(Boolean),h=ce(i).split(" ").filter(Boolean);return r.length>0&&r.every(l=>h.includes(l))}return n==="href"?ce(i)===ce(o)||ce(i).endsWith(ce(o)):ce(i)===ce(o)},$t=n=>String(n??"").split(/[?#]/)[0].split("/").filter(Boolean).pop()??"",bn=(n,o)=>{if(!o?.kind)return null;let i=Wo(n,o);if(!i)return null;let r=Ho(i,o.kind);return{ok:Vo(o.kind,o.value,r),wanted:o.value,saw:r,kind:o.kind}};pt();var ma=()=>{let n=window.liveEditApi;n?.base&&n?.site&&Promise.resolve().then(()=>(Rt(),jt)).then(i=>i.ensureBackgroundsAreFound({base:n.base,site:n.site,key:n.token})).catch(i=>console.warn("[live-edit] could not look for backgrounds:",i.message)),window.liveEditContent||Promise.resolve().then(()=>(ht(),ut)).then(i=>i.defendContent(document)).catch(i=>console.warn("[live-edit] could not guard this page's content:",i.message));let o=document.querySelector("[data-login-modal]");if(o){let i=()=>{o.classList.remove("hidden"),o.classList.add("flex"),o.querySelector("input[type=email]")?.focus()},r=()=>{o.classList.add("hidden"),o.classList.remove("flex")};document.querySelectorAll("[data-login-open]").forEach(h=>{h.addEventListener("click",l=>{l.preventDefault(),i()})}),o.querySelector("[data-login-close]")?.addEventListener("click",r),o.addEventListener("click",h=>{h.target===o&&r()}),o.dataset.error==="1"&&i()}if(document.body.hasAttribute("data-admin")){let i=document.body.dataset.csrf,r=()=>{sessionStorage.setItem("tb_scroll",String(window.scrollY)),window.location.reload()},h=sessionStorage.getItem("tb_scroll");h!==null&&(sessionStorage.removeItem("tb_scroll"),window.scrollTo(0,Number(h)));let l=ln(),w=e=>l.toast(String(e??"").trim()||"Something went wrong.",9e3),k=sessionStorage.getItem("tb_toast");k&&(sessionStorage.removeItem("tb_toast"),l.toast(k));let C=()=>new Promise(e=>{if(!window.liveEditContent||window.liveEditContentDone){e(window.liveEditContentDone??null);return}let t=a=>e(a?.detail??null);document.addEventListener("live-edit:content",t,{once:!0}),setTimeout(()=>e(null),5e3)});C().then(e=>{let t=fn();if(e?.failed){l.toast(t?"Saved \u2014 but this page could not load the latest content, so it may be showing an older version. Reload to try again.":"This page could not load your saved content, so it is showing the original. Nothing has been lost \u2014 reload to try again.",9e3);return}let a=t?bn(document,t):null;a&&!a.ok&&(console.warn("[live-edit] the change was saved but the page still shows:",a.saw,`
  expected:`,a.wanted),l.toast("Saved \u2014 but this page is still showing the old version. Your change is stored; reload, and tell us if it stays this way.",9e3))});let O=e=>{sessionStorage.setItem("tb_toast",e),r()},z=(e,t=null,a=null)=>{let s=window.__liveEditReact;if(!s){O(e);return}let c=t!==null&&(s.apply??s.set)(t,a);l.toast(e),c||s.refresh()},{drawer:I,drawerTabs:N,drawerSubject:Y,drawerTitle:_,drawerTrail:j,drawerFields:E,drawerDelete:H,toggleButton:oe,statusText:ae,linkHandle:V,bgHandle:Q}=l,y=null,Ce=(e,t,a,s,c=!1)=>{let g=document.createElement("label");g.className="le-field",g.append(t);let p=e==="icon"?window.liveEditIcons:(window.liveEditSelects??{})[e],d=document.querySelector("[data-icon-templates]");if(e==="icon"&&Array.isArray(p)&&d){let u=document.createElement("input");u.type="hidden",u.name=e,u.value=a??"";let m=document.createElement("div");return m.className="le-icons",p.forEach(v=>{let b=document.createElement("button");b.type="button",b.title=v,b.dataset.iconChoice=v,b.className="le-icon"+(v===u.value?" is-active":"");let x=d.querySelector(`template[data-icon="${v}"]`);x?b.append(x.content.cloneNode(!0)):b.textContent=v,b.addEventListener("click",()=>{u.value=v,m.querySelectorAll("[data-icon-choice]").forEach(S=>{let L=S.dataset.iconChoice===v;S.className="le-icon"+(L?" is-active":"")}),u.dispatchEvent(new Event("input",{bubbles:!0}))}),m.append(b)}),g.append(u,m),g}if(Array.isArray(p)&&p.length<=6){let u=document.createElement("input");u.type="hidden",u.name=e,u.value=a??p[0];let m=document.createElement("div");return m.className="le-choices",p.forEach(v=>{let b=document.createElement("label");b.className="le-choice"+(v===u.value?" is-selected":"");let x=document.createElement("input");x.type="radio",x.name="le-choice-"+e,x.checked=v===u.value,x.addEventListener("change",()=>{u.value=v,m.querySelectorAll(".le-choice").forEach(S=>S.classList.remove("is-selected")),b.classList.add("is-selected"),u.dispatchEvent(new Event("input",{bubbles:!0}))}),b.append(x,document.createTextNode(v)),m.append(b)}),g.append(u,m),g}let f;if(Array.isArray(p)?(f=document.createElement("select"),p.forEach(u=>{let m=document.createElement("option");m.value=u,m.textContent=u,m.selected=u===a,f.append(m)})):(f=document.createElement("textarea"),f.rows=s,f.value=a??""),f.name=e,f.className="le-input",f.tagName==="TEXTAREA"){f.classList.add("le-prose");let u=()=>{f.style.height="auto",f.style.height=Math.min(f.scrollHeight+2,420)+"px"};f.addEventListener("input",u),requestAnimationFrame(u)}if(c&&f.tagName==="TEXTAREA"){let u=document.createElement("div");u.className="le-tools";let m=(x,S)=>{let L=f.selectionStart,T=f.selectionEnd,q=f.value.slice(L,T)||"text";f.setRangeText(x+q+S,L,T,"select"),f.dispatchEvent(new Event("input",{bubbles:!0})),f.focus()},v=(x,S,L,T="")=>{let q=document.createElement("button");return q.type="button",q.title=S,q.textContent=x,q.className="le-tool "+T,q.addEventListener("click",L),q};u.append(v("B","Bold",()=>m("**","**"),"is-bold"),v("I","Italic",()=>m("*","*"),"is-italic"),v("Link","Insert link",()=>{let x=window.prompt("Link URL (https://\u2026 or /page):");if(!x)return;let S=f.selectionStart,L=f.selectionEnd,T=f.value.slice(S,L)||"link text";f.setRangeText("["+T+"]("+x+")",S,L,"select"),f.dispatchEvent(new Event("input",{bubbles:!0})),f.focus()}));let b=document.createElement("span");b.className="le-hint",b.textContent="**bold** \xB7 *italic* \xB7 [text](url)",u.append(b),g.append(u)}return g.append(f),g},te=e=>{let t=e.tagName;if(e.dataset.editRegion)return e.dataset.editRegion;if(t==="IMG")return"Image";if(t==="BUTTON")return"Button";if(t==="A")return/\b(btn|button)\b/i.test(String(e.className))?"Button":"Link";if(/^H[1-6]$/.test(t))return"Heading";if(t==="P")return"Paragraph";if(t==="LI")return"List item";if(t==="UL"||t==="OL")return"List";if(t==="NAV")return"Menu";if(t==="HEADER")return"Header";if(t==="FOOTER")return"Footer";if(t==="FORM")return"Form";if(e.hasAttribute("data-edit-item"))return"Card";if(e.hasAttribute("data-edit-icon"))return"Icon";if(e.hasAttribute("data-edit-svg"))return"Drawing";if(e.hasAttribute("data-edit"))return"Text";if(e.hasAttribute("data-has-bg")||e.hasAttribute("data-edit-bg"))return"Background";if(t==="SECTION"||t==="MAIN"||t==="ARTICLE")return"Section";let a=e.getBoundingClientRect();return a.width>window.innerWidth*.6&&a.height>180?"Section":"Group"},re=({hint:e="PNG, JPG or WEBP, or drag one here",onFile:t}={})=>{let a=document.createElement("label");a.className="le-upload";let s=document.createElement("div");s.className="le-upload-inner";let c=document.createElement("span");c.className="le-upload-icon",c.textContent="\u2191";let g=document.createElement("span");g.className="le-upload-text";let p=document.createElement("span");p.className="le-upload-title",p.textContent="Upload from your computer";let d=document.createElement("span");d.className="le-upload-hint",d.textContent=e,g.append(p,d);let f=document.createElement("span");f.className="le-upload-btn",f.textContent="Choose file",s.append(c,g,f);let u=document.createElement("input");u.type="file",u.accept="image/*";let m=v=>{v&&(d.textContent=v.name,t?.(v))};return u.addEventListener("change",()=>m(u.files[0])),["dragenter","dragover"].forEach(v=>a.addEventListener(v,b=>{b.preventDefault(),a.classList.add("is-dragover")})),["dragleave","drop"].forEach(v=>a.addEventListener(v,b=>{b.preventDefault(),a.classList.remove("is-dragover")})),a.addEventListener("drop",v=>{let b=v.dataTransfer?.files?.[0];if(!b)return;let x=new DataTransfer;x.items.add(b),u.files=x.files,m(b)}),a.append(s,u),a},Ge=e=>{let t=String(e).match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);return!t||t[4]!==void 0&&Number(t[4])===0?"":"#"+[1,2,3].map(a=>Number(t[a]).toString(16).padStart(2,"0")).join("")},Le=e=>Cn(e),Ke={background:"Background colour",backgroundImage:"Background image",textColor:"Text colour",fontSize:"Text size",paddingY:"Space above and below",paddingX:"Space left and right",radius:"Corner rounding"},Ae=(e,t,a,s)=>{let c=document.createElement("label");c.className="le-field";let g=e.replace(/([A-Z])/g," $1").toLowerCase(),p=Ke[e]??g.charAt(0).toUpperCase()+g.slice(1);if(c.append(p),t==="toggle"){let d=document.createElement("div");d.className="le-row";let f=document.createElement("input");f.type="checkbox",f.checked=a==="1",f.dataset.styleProp=e;let u=document.createElement("span");u.className="le-hint",u.textContent="Hidden from visitors. You still see it, dimmed, while editing.",d.append(f,u);let m=s?te(s).toLowerCase():"section";return c.replaceChildren(`Hide this ${m}`,d),c.className="le-field le-divided",c}if(t==="color"){let d=document.createElement("div");d.className="le-row";let f=document.createElement("input");f.type="color";let u=s?Ge(getComputedStyle(s)[e==="textColor"?"color":"backgroundColor"]):"";f.value=a||u||"#ffffff",f.dataset.styleProp=e,f.className="le-color";let m=document.createElement("label");m.className="le-default";let v=document.createElement("input");v.type="checkbox",v.checked=!a,f.addEventListener("input",()=>v.checked=!1),m.append(v,"Use default"),d.append(f,m),c.append(d)}else if(t==="url"){let d=document.createElement("input");d.type="text",d.value=a??"",d.placeholder="Paste an image URL, or upload below",d.dataset.styleProp=e,d.className="le-input";let f=document.createElement("img");f.className="le-thumb",f.alt="";let u=T=>{f.src=T||"",f.style.display=T?"":"none"},m=a?"":Le(s),v=document.createElement("span");v.className="le-hint";let b=(T,q)=>{v.textContent=T?q?"Current image (from the theme) \u2014 upload or paste a link to replace it":"Replacing with this image":"No image set",v.title=T||""};u(a||m),b(a||m,!a&&!!m),d.addEventListener("input",()=>{let T=d.value.trim();u(T||m),b(T||m,!T&&!!m)});let x=re({onFile:async T=>{u(URL.createObjectURL(T));let q=new FormData;q.append("file",T);try{let M=await(await R("/live-edit/upload",{method:"POST",body:q})).json();d.value=M.url,u(M.url),b(M.url,!1),d.dispatchEvent(new Event("input",{bubbles:!0}))}catch(Z){w(D(Z,"save that"))}}}),S=$("div","le-ways"),L=$("button","le-btn le-wide","Replace background");L.type="button",L.addEventListener("click",()=>Gt(s,async T=>{let{url:q,file:Z,credit:M}=T,P=q;if(Z){u(URL.createObjectURL(Z));let W=new FormData;W.append("file",Z);try{P=(await(await R("/live-edit/upload",{method:"POST",body:W})).json()).url}catch(ee){l.toast(D(ee,"save that"));return}}P&&(d.value=P,u(P),b(P,!1),d.dispatchEvent(new Event("input",{bubbles:!0})),d.dataset.kbCreditFor=P,d.dataset.kbCredit=JSON.stringify({credit:M??"",creditBy:T.creditBy??"",creditUrl:T.creditUrl??"",creditSource:T.creditSource??"",creditSourceUrl:T.creditSourceUrl??""}),M&&l.toast(M,4e3))},"Free photos","background")),S.append(L),d.hidden=!0,x.hidden=!0,c.append(S,d,x,f,v)}else{let d=document.createElement("input");d.type="number",d.min=0,d.max=400,d.value=a??"",d.placeholder="default",d.dataset.styleProp=e,d.className="le-input",c.append(d)}return c},Me={background:"color",backgroundImage:"url",textColor:"color",fontSize:"px",paddingX:"px",paddingY:"px",radius:"px",hidden:"toggle"},Xe=(e,t,a)=>{y.styleKey=e;let s=(window.liveEditStyles??{})[e]??{},c=document.createElement("div");c.className="le-section-heading",c.textContent="Style",E.append(c);let g=0;if((a?Ln(a,t):t).forEach(p=>{let d=(window.liveEditStyleProps??{})[p]??Me[p];d&&(E.append(Ae(p,d,s[p],a)),g++)}),g===0){let p=document.createElement("div");p.className="le-hint",p.textContent="Nothing on this element can be restyled.",E.append(p)}},Te=document.createElement("style");document.head.append(Te);let Qe=(e,t)=>{let a=`[data-style="${e}"]`,s="",c="";for(let[g,p]of Object.entries(t))p&&(s+={hidden:"opacity:.45 !important;",backgroundImage:`background-image:url('${p}') !important;background-size:cover !important;background-position:center !important;`,background:`background:${p} !important;`,textColor:`color:${p} !important;`,fontSize:`font-size:${p}px !important;`,radius:`border-radius:${p}px !important;`,paddingX:`padding-left:${p}px !important;padding-right:${p}px !important;`,paddingY:`padding-top:${p}px !important;padding-bottom:${p}px !important;`}[g]??"",g==="paddingY"&&(c+=`section${a}>div{padding-top:0 !important;padding-bottom:0 !important}`));return s?c+`${a}{${s}}`:c},Ne=()=>{if(!y?.styleKey)return;let e=Oe(),t=y.styleKey,a=Qe(t,e),s={background:"background",textColor:"color",fontSize:"font-size",radius:"border-radius",backgroundImage:"background-image"};for(let[c,g]of Object.entries(e))g||(c==="hidden"&&(a+=`body.editing [data-style="${t}"]{opacity:1 !important}`),s[c]&&(a+=`[data-style="${t}"]{${s[c]}:revert-layer !important}`),c==="paddingY"&&(a+=`[data-style="${t}"]{padding-top:revert-layer !important;padding-bottom:revert-layer !important}section[data-style="${t}"]>div{padding-top:revert-layer !important;padding-bottom:revert-layer !important}`),c==="paddingX"&&(a+=`[data-style="${t}"]{padding-left:revert-layer !important;padding-right:revert-layer !important}`));Te.textContent=a},$e=()=>{Te.textContent=""};E.addEventListener("input",()=>{y&&(y.dirty=!0),Ne()}),E.addEventListener("change",()=>{y&&(y.dirty=!0),Ne()});let Oe=()=>{let e={};return E.querySelectorAll("[data-style-prop]").forEach(t=>{if(t.type==="checkbox")e[t.dataset.styleProp]=t.checked?"1":"";else if(t.type==="color"){let a=t.closest("div").querySelector("input[type=checkbox]").checked;e[t.dataset.styleProp]=a?"":t.value}else e[t.dataset.styleProp]=t.value;if(t.dataset.kbCredit&&t.dataset.kbCreditFor===t.value)try{Object.assign(e,JSON.parse(t.dataset.kbCredit))}catch{}}),e},pe=null,ue=()=>{!pe||!y||y.dirty||!I.classList.contains("is-open")||B!=="Edit"||pe.isConnected&&Ie(pe)},se=e=>e.dataset.editRegion?e.dataset.editRegion:e.dataset.editLabel?e.dataset.editLabel:e.querySelector(":scope > [data-style-edit]")?.dataset.editLabel??te(e),Ie=e=>{if(pe=e,e.dataset.editImg!==void 0)xt(e);else if(e.dataset.edit!==void 0)ot(e);else if(e.dataset.svgEdit!==void 0||e.dataset.editSvg!==void 0)Xt(e);else if(e.dataset.editHref!==void 0)wt(e);else if(e.dataset.style!==void 0){let t=e.querySelector(":scope > [data-style-edit]");vt(t??e)}},Ue=e=>{y?.dirty&&!window.confirm("Discard unsaved changes?")||($e(),Ie(e))},gt=null,Ut=e=>{let t=gt;gt=e??null;let a=[],s=e?.parentElement;for(;s&&s!==document.body;)s.dataset&&(s.dataset.edit!==void 0||s.dataset.style!==void 0)&&a.unshift(s),s=s.parentElement;let c=[];a.forEach(p=>{let d=se(p);if(c.length&&c[c.length-1].label===d){c[c.length-1].node=p;return}c.push({node:p,label:d})});let g=c.slice(-3);t&&t!==e&&document.contains(t)&&!g.some(p=>p.node===t)&&g.unshift({node:t,label:`\u2190 ${se(t)}`}),j.replaceChildren(),j.classList.toggle("is-visible",g.length>0),g.forEach((p,d)=>{let f=p.node;d>0&&j.append("\u203A");let u=document.createElement("button");u.type="button",u.textContent=p.label,u.className="le-crumb",u.addEventListener("click",()=>Ue(f)),j.append(u)})},B="Edit",F=e=>{B=e,Object.entries(N).forEach(([t,a])=>{a.classList.toggle("is-on",t===e),a.setAttribute("aria-selected",t===e?"true":"false")}),Y.classList.toggle("le-hidden",e!=="Edit"),l.drawerFoot.classList.toggle("le-hidden",e!=="Edit"),e==="Changes"&&ft(),e==="History"&&ao()};Object.entries(N).forEach(([e,t])=>{t.addEventListener("click",()=>{e!=="Edit"&&y?.dirty&&!window.confirm("Discard unsaved changes?")||(F(e),I.classList.contains("is-open")||bt())})});let D=(e,t)=>{console.warn(`[live-edit] ${t}:`,e);let a=String(e?.message??"");return/failed to fetch|networkerror|load failed/i.test(a)?"No connection just now. Nothing has been lost; try again in a moment.":/\b401\b|\b403\b|unauthor|forbidden/i.test(a)?"Your editing session has expired. Reload the page to carry on.":/\b429\b|too many/i.test(a)?"That was a lot at once. Give it a few seconds and try again.":`Could not ${t}. Nothing has been lost; try again in a moment.`},K=null,me=async()=>{if(window.liveEditApi)try{K=await(await R("/live-edit/credits",{method:"GET"})).json(),ue()}catch(e){console.warn("[live-edit] could not read the credit balance:",e),K=null}},he=async()=>{if(!(window.liveEditStyleProps&&window.liveEditStyles)&&window.liveEditApi)try{let t=await(await R("/live-edit/content",{method:"GET"})).json();t?.styleProps&&(window.liveEditStyleProps=t.styleProps),t?.styles&&(window.liveEditStyles=t.styles),ue()}catch(e){console.warn("[live-edit] could not read what this site allows to be styled:",e)}},Ze=(e,t)=>{if(!K?.available||!t)return;let a=document.createElement("div");a.className="le-assist-head",a.append(Pe("AI assist"),et()),E.append(a),[["rewrite","Rewrite"],["shorten","Shorten"]].forEach(([s,c])=>{let g=K.costs?.[s]??1,p=document.createElement("button");p.type="button",p.className="le-assist";let d=document.createElement("span");d.textContent=c;let f=document.createElement("span");f.className="le-assist-cost",f.textContent=`${g} credit${g===1?"":"s"}`,p.append(d,f),(K.balance??0)<g&&(p.disabled=!0,f.classList.add("is-short"),p.title="Not enough credits"),p.addEventListener("click",()=>void _e(s,c,e,t,p,d)),E.append(p)})},et=()=>{let e=document.createElement("span");return e.className="le-assist-balance",e.textContent=`${K?.balance??0} credits left`,e},Pe=e=>{let t=document.createElement("div");return t.className="le-section-heading",t.textContent=e,t},ge=()=>(document.querySelector('meta[property="og:site_name"]')?.content??document.querySelector('meta[name="application-name"]')?.content??(document.title??"").split(/\s+[|\u2013\u2014-]\s+/).pop()??"").replace(/\s+/g," ").trim().slice(0,120),tt=()=>(document.querySelector('meta[name="description"]')?.content??document.querySelector('meta[property="og:description"]')?.content??"").replace(/\s+/g," ").trim().slice(0,400),_e=async(e,t,a,s,c,g)=>{c.disabled=!0,g.textContent="Thinking\u2026";let p;try{p=await(await R("/live-edit/assist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:e,text:s.value,heading:Be(a),role:te(a),page:window.location.pathname,site:ge(),about:tt()})})).json()}catch(d){c.disabled=!1,g.textContent=t,l.toast(D(d,"rewrite that"));return}if(typeof p?.balance=="number"&&K&&(K.balance=p.balance),!p?.text){c.disabled=!1,g.textContent=t,l.toast(We(p?.reason));return}s.value=p.text,s.dispatchEvent(new Event("input",{bubbles:!0})),s.focus(),c.disabled=!1,g.textContent=t,l.toast(`Rewritten. ${p.balance} credits left.`)},Be=e=>(((e.closest("section, article, header, div[data-style]")??document.body).querySelector("h1, h2, h3")??document.querySelector("h1"))?.textContent??"").replace(/\s+/g," ").trim().slice(0,200),We=e=>({not_enough_credits:"Not enough credits for that. You can buy more from your account.",no_suggestion:"No suggestion for this one. Your words are unchanged.",not_configured:"Rewriting is not switched on for this site yet.",nothing_to_work_with:"There are no words here to rewrite yet."})[e]??"Could not rewrite that just now. Your words are unchanged.",ft=async()=>{E.replaceChildren(G("Loading\u2026"));let e;try{e=await(await R("/live-edit/changes",{method:"GET"})).json()}catch(a){E.replaceChildren(G(D(a,"show your changes")));return}let t=e?.changes??[];if(t.length===0){E.replaceChildren(G("No unpublished changes."));return}E.replaceChildren(),t.forEach(a=>{let s=document.createElement("div");s.className="le-change";let c=document.createElement("div");c.className="le-row le-change-head";let g=document.createElement("span");g.className="le-change-label",g.textContent=fe(a);let p=document.createElement("button");if(p.type="button",p.className="le-chip-btn",p.textContent="Revert",p.addEventListener("click",()=>void X(a,p)),c.append(g,p),s.append(c),ye(a)){s.append(nt(a)),E.append(s);return}if(a.before){let f=document.createElement("p");f.className="le-change-before",f.textContent=we(a.before),s.append(f)}let d=document.createElement("p");d.className="le-change-after",d.textContent=we(a.after)||"(empty)",s.append(d),E.append(s)})},we=e=>{let t=String(e??"").replace(/\s+/g," ").trim();return t.length>70?`${t.slice(0,70)}\u2026`:t},ye=e=>e.kind==="style"?!1:document.querySelector(`[data-edit-img="setting:${CSS.escape(e.key)}"]`)?!0:ct(e.after)||ct(e.before),nt=e=>{let t=document.createElement("div");t.className="le-change-pictures";let a=(s,c,g)=>{let p=document.createElement("figure");p.className=g;let d=document.createElement("figcaption");if(d.textContent=c,p.append(d),ct(s)){let u=document.createElement("img");return u.src=s,u.alt="",u.loading="lazy",u.addEventListener("error",()=>{u.remove();let m=document.createElement("span");m.className="le-change-missing",m.textContent="Cannot be shown",p.append(m)},{once:!0}),p.append(u),p}let f=document.createElement("span");return f.className="le-change-missing",f.textContent=String(s??"").trim()===""?"No picture":we(s),p.append(f),p};return e.before&&t.append(a(e.before,"Was","le-change-shot is-before")),t.append(a(e.after,"Now","le-change-shot is-after")),t},fe=e=>{let t=document.querySelector(`[data-edit="setting:${CSS.escape(e.key)}"], [data-edit-img="setting:${CSS.escape(e.key)}"], [data-style="${CSS.escape(e.key)}"]`);return t?te(t):e.kind==="style"?"Styling":ye(e)?"Picture":"Text"},X=async(e,t)=>{t.disabled=!0,t.textContent="Reverting\u2026";try{await R("/live-edit/changes",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:e.key,kind:e.kind})})}catch(a){t.disabled=!1,t.textContent="Revert",l.toast(D(a,"put that back"));return}O("Reverted \u2713")},_t=()=>{let e=window.liveEditApi?.engine;if(!e)return null;let t=$("p","le-hint");return t.textContent=`Live Edit ${e}`,t.title="Quote this if you report a problem",t},ao=async()=>{E.replaceChildren(G("Loading\u2026"));let e;try{e=await(await R("/live-edit/versions",{method:"GET"})).json()}catch(s){E.replaceChildren(G(D(s,"show what has been published")));return}let t=e?.versions??[];if(t.length===0){E.replaceChildren(G("Nothing published yet. Your first publish will appear here."));let s=_t();s&&E.append(s);return}E.replaceChildren(),t.forEach((s,c)=>{let g=document.createElement("div");g.className="le-version";let p=document.createElement("span");p.className=c===0?"le-version-dot is-latest":"le-version-dot";let d=document.createElement("div"),f=document.createElement("p");f.className="le-change-after",f.textContent=s.restored_from?`Restored version ${s.restored_from}`:`Published ${s.changes??0} change${s.changes===1?"":"s"}`;let u=document.createElement("p");u.className="le-change-when",u.textContent=io(s.published_at),d.append(f,u),g.append(p,d),E.append(g)});let a=_t();a&&E.append(a)},G=e=>{let t=document.createElement("p");return t.className="le-hint",t.textContent=e,t},io=e=>{if(!e)return"";let t=Math.round((Date.now()-new Date(e).getTime())/1e3);return t<90?"Just now":t<3600?`${Math.round(t/60)} minutes ago`:t<86400?`${Math.round(t/3600)} hours ago`:t<86400*8?`${Math.round(t/86400)} days ago`:new Date(e).toLocaleDateString()},bt=()=>{He(),Ct(),I.classList.add("is-open"),l.toolbar.classList.add("is-compact"),B==="Edit"&&E.querySelector("textarea, input:not([type=checkbox]), select")?.focus()},ve=(e=!1)=>{!e&&y?.dirty&&!window.confirm("Discard unsaved changes?")||(y?.restore?.(),$e(),I.classList.remove("is-open"),l.toolbar.classList.remove("is-compact"),y=null)},ro=()=>document.querySelectorAll("[data-edit], [data-edit-img], [data-edit-bg], [data-edit-href], [data-edit-icon], [data-edit-svg]"),mt=async(e,t=0)=>{try{if(e.cssRules){let a=[];for(let s of e.cssRules)s.styleSheet&&t<4?a.push(await mt(s.styleSheet,t+1)):a.push(s.cssText);return a.join("")}}catch{}if(!e.href)return"";try{let a=await fetch(e.href);if(!a.ok)return"";let s=await a.text();if(t>=4)return s;let c=[...s.matchAll(/@import\s+(?:url\(\s*(["']?)([^"')]+)\1\s*\)|(["'])([^"']+)\3)/gi)].map(p=>p[2]||p[4]).filter(Boolean),g=await Promise.all(c.map(p=>mt({href:new URL(p,e.href).href},t+1)));return s+g.join("")}catch{return""}},so=null,lo=async()=>{let e=new Map;return(await Promise.all([...document.styleSheets].map(a=>mt(a)))).forEach(a=>vn(a).forEach(s=>e.set(s.name,s.glyph))),[...e].map(([a,s])=>({name:a,glyph:s})).sort((a,s)=>a.name.localeCompare(s.name))},Wt=()=>so??(so=lo()),Ht=()=>{document.querySelectorAll("[data-style]").forEach(e=>{if(e.hasAttribute("data-edit-bg"))return;let a=(getComputedStyle(e).backgroundImage||"").match(/url\((['"]?)(.*?)\1\)/),s=e.getBoundingClientRect(),c=a&&!a[2].startsWith("data:")&&s.width>=120&&s.height>=120;e.toggleAttribute("data-has-bg",!!c)})},co=()=>{document.querySelectorAll("[data-edit-icon]").forEach(e=>{let t=getComputedStyle(e,"::before").content;(t==="none"||t==="normal"||t==='""'||t==="")&&e.removeAttribute("data-edit-icon")})},je=e=>{e&&co(),document.body.classList.toggle("editing",e),ro().forEach(t=>{e?t.setAttribute("tabindex","0"):t.removeAttribute("tabindex")}),sessionStorage.setItem("tb_editing",e?"1":"0"),ae.textContent=e?"Click any outlined text or image":"",ae.parentElement?.classList.toggle("is-saying",e),!e&&typeof He=="function"&&He(),l.toolbar.classList.toggle("is-editing",e),oe.textContent=e?"Done editing":"Edit site",e?(Ht(),document.querySelector("[data-edit-icon]")&&Wt(),n?.base&&n?.site&&Promise.resolve().then(()=>(Rt(),jt)).then(t=>t.refreshBackgrounds({base:n.base,site:n.site,key:n.token})).then(t=>{t&&Ht()}).catch(t=>console.warn("[live-edit] could not look again for backgrounds:",t.message))):(Ct(),Ee()),e||ve(!0)},po=async()=>{let e=window.liveEditApi,t=await Promise.resolve().then(()=>(oo(),no)).catch(()=>null);if(t?.forget(window),!e||!t){window.location.reload();return}let a=window.prompt("Your editing session has ended. Enter your email address and we will send you a new link.");a&&(await t.requestLink(e,a,window).catch(()=>{}),w("If that address can edit this site, a link is on its way.")),window.location.reload()},R=async(e,t)=>{let a=window.liveEditApi,s=a?Sn(e,t,a):null,c=s?await fetch(s.url,s.init):await fetch(e,wn(i,t));if(c.status===419||c.status===401)throw await po(),new Error("Your editing session has ended.");if(!c.ok){let g=await c.json().catch(()=>({}));throw new Error(g.error?.message??g.message??"Could not save. Try again.")}if(!yn(c))throw new Error("That did not save. Reload the page and try again.");return c},uo=(e,t)=>{if(!e?.element)return null;let a=s=>{let c=e.element.getAttribute(s);return c===null?null:{attr:s,marker:c}};if(e.kind==="image"){let s=t.querySelector("input[type=url]")?.value.trim(),c=t.querySelector("input[type=file]")?.files?.[0],g=a("data-edit-img")??a("data-edit-bg");return s&&g?{...g,kind:"image",value:s}:null}if(e.kind==="icon"){let s=a("data-edit-icon");return s&&e.value?{...s,kind:"icon",value:e.value}:null}if(e.kind==="setting"&&typeof e.savedValue=="string"){let s=a("data-edit");return!s||/<[a-z][\s\S]*>/i.test(e.savedValue)||e.element.hasAttribute("data-edit-attr")?null:{...s,kind:"text",value:e.savedValue}}return null},ho=async e=>{let t=window.liveEditApi?.builderUrl;if(!t||e?.kind!=="setting"||typeof e.savedValue!="string"||!e.element)return;let a=e.element.closest(".elementor-element[data-id]");if(a)try{await fetch(t,{method:"POST",headers:{"Content-Type":"application/json",...window.liveEditApi?.publishHeaders??{}},body:JSON.stringify({page:window.location.href,element:a.dataset.id,value:e.savedValue})})}catch(s){console.warn("[live-edit] could not tell the page builder about this change:",s.message)}},go=async()=>{if(!y)return;let e=l.saveButton;e.disabled=!0,e.textContent="Saving\u2026";let t=()=>{e.disabled=!1,e.textContent="Save changes"};try{if(y.kind==="setting"){let a=y.value??E.querySelector("textarea, input[name=icon]")?.value??"";if(typeof y.openedWith=="string"&&a===y.openedWith){t(),ve();return}await R("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:y.key,value:y.savedValue=y.value??E.querySelector("textarea, input[name=icon]")?.value??"",locale:window.liveEditLocale})})}else if(y.kind==="record"){let a={};E.querySelectorAll("textarea, select, input[type=hidden][name]").forEach(s=>a[s.name]=s.value),await R("/live-edit/record",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:y.type,id:y.id,fields:a})})}else if(y.kind==="icon")await R("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:y.key,value:y.value})});else if(y.kind==="image"){let a=new FormData;a.append("target",y.target);let s=E.querySelector("input[type=file]").files[0],c=E.querySelector("input[type=url]").value.trim(),g=Nt(y.element);g&&(a.append("fitWidth",String(g.width)),a.append("fitHeight",String(g.height)),g.exact&&a.append("fitExact","1")),y.crop&&(a.append("cropX",String(y.crop.x)),a.append("cropY",String(y.crop.y)),a.append("cropWidth",String(y.crop.width)),a.append("cropHeight",String(y.crop.height)));let p=s!==void 0||c!==""&&c!==void 0;y.credit&&y.creditFor===y.target&&p&&un(y.credit).forEach(([u,m])=>a.append(u,m));let d=[...E.querySelectorAll("[data-img-attr]")],f=hn(d);if(window.liveEditLocale&&a.append("locale",window.liveEditLocale),s?a.append("file",s):c&&a.append("url",c.startsWith("http")?c:`https://${c}`),f.forEach(u=>a.append(u.dataset.imgAttr,u.value)),!s&&!c&&f.length===0){t(),w(d.length>0?"Nothing has changed yet. Choose a picture, or edit the description.":"Choose a file from your computer or paste an image URL first.");return}await R("/live-edit/image",{method:"POST",body:a})}if(y.hrefKey){let a=E.querySelector("[data-link-field=href]").value.trim(),s=E.querySelector("[data-link-field=target]").checked;await R("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:y.hrefKey,value:a})}),y.targetKey&&await R("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:y.targetKey,value:s?"_blank":""})})}y.styleKey&&await R("/live-edit/style",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:y.styleKey,props:Oe()})}),await ho(y),gn(uo(y,E)),z("Saved \u2713",y.key??null,y.savedValue??null)}catch(a){t(),w(a.message)}};me(),he();let $=(e,t,a)=>{let s=document.createElement(e);return t&&(s.className=t),a!=null&&(s.textContent=a),s},Yt=e=>{let t=e.closest("section, article, header, div[data-style]");for(;t&&!t.querySelector("h1, h2, h3");)t=t.parentElement?.closest("section, article, header, div[data-style]")??null;let a=t?.querySelector("h1, h2, h3");return!t||!a?"":[...t.querySelectorAll("p, span, div, h4, h5, h6")].filter(c=>c.children.length===0).filter(c=>a.compareDocumentPosition(c)&Node.DOCUMENT_POSITION_PRECEDING).map(c=>(c.textContent??"").replace(/\s+/g," ").trim()).find(c=>c.length>3&&c.length<42)??""},fo=/^(the|and|with|for|your|our|from|that|this|they|them|will|have|more|about|into|just|than|then|when|what|where|very|been|here|there)$/,Vt=e=>{let t=new Set((document.title??"").toLowerCase().split(/[^a-z0-9]+/i).filter(Boolean));return(e??"").toLowerCase().split(/[^a-z0-9]+/i).filter(a=>a.length>3&&!fo.test(a)&&!t.has(a))},bo=e=>{let t=Vt(Yt(e)).slice(0,3);if(t.length>0)return t.join(" ");let a=Vt(Be(e)).slice(0,3);return a.length>0?a.join(" "):"workplace"},Jt=e=>{let t=bo(e),a=(e.dataset.editLabel??"").toLowerCase().trim(),s=/hero|banner|header|cover/.test(a);return[...new Set([t,s?`${t} wide`:`${t} close up`,"workplace"].filter(Boolean))].slice(0,4)},mo=e=>`${(Yt(e)||Be(e)||"This page").replace(/[.\s]+$/,"")}. Photographic, natural daylight, calm and editorial, soft neutral tones to match the rest of the site. No text.`,Gt=(e,t,a="Free photos",s="image")=>{let c=l.modal({title:`Replace ${s}`,subtitle:e.dataset.editLabel??te(e)}),g=document.createElement("div");c.body.append(g),c.tabs.hidden=!1;let p=m=>{c.close(),t(m)},d={Upload:()=>wo(g,p),"Free photos":()=>void yo(g,e,p),"Generate with AI":()=>xo(g,e,p)},f=Object.keys(d).map(m=>{let v=document.createElement("button");return v.type="button",v.className="le-modal-tab",v.textContent=m,v.addEventListener("click",()=>u(m)),c.tabs.append(v),[m,v]}),u=m=>{f.forEach(([v,b])=>b.classList.toggle("is-on",v===m)),g.replaceChildren(),d[m]()};return u(d[a]?a:"Free photos"),c},wo=(e,t)=>{e.append(re({hint:"PNG, JPG or WEBP, or drag one here",onFile:d=>t({file:d})}));let a=$("div","le-row-tight"),s=document.createElement("input");s.type="url",s.className="le-search",s.placeholder="Or paste a link to a picture";let c=$("button","le-btn-outline","Use it");c.type="button";let g=()=>{let d=s.value.trim();d&&t({url:d.startsWith("http")?d:`https://${d}`})};c.addEventListener("click",g),s.addEventListener("keydown",d=>{d.key==="Enter"&&(d.preventDefault(),g())}),a.append(s,c),e.append(a);let p=$("p","le-hint","You can also drag a picture straight onto the image on the page.");p.style.marginTop="14px",e.append(p)},yo=async(e,t,a)=>{let s=document.createElement("input");s.type="search",s.className="le-search",s.placeholder="Search free photographs";let c=document.createElement("div");c.className="le-chips";let g=document.createElement("div");g.className="le-grid";let p=document.createElement("p");p.className="le-hint",p.style.marginTop="16px",e.append(s,c,g,p);let d=()=>{g.replaceChildren();for(let u=0;u<6;u+=1)g.append($("div","le-shimmer"))},f=async u=>{s.value=u,d();let m;try{m=await(await R(`/live-edit/photos?q=${encodeURIComponent(u)}`,{method:"GET"})).json()}catch(b){g.replaceChildren(G(D(b,"look for photographs")));return}let v=m?.photos??[];if(p.textContent=m?.source==="openverse"?"Free to use, including commercially. The photographer is credited automatically.":"Free to use under the Unsplash licence. The photographer is credited automatically.",v.length===0){g.replaceChildren(G(vo(m?.reason,u)));return}g.replaceChildren(),v.forEach(b=>{let x=document.createElement("button");x.type="button",x.className="le-pick";let S=document.createElement("img");S.className="le-pick-shot",S.src=b.thumb??b.full,S.alt=b.alt??"",S.loading="lazy";let L=$("span","le-pick-by",b.by?`Photo by ${b.by}`:"");x.append(S,L),x.addEventListener("click",()=>{b.downloadLocation&&R("/live-edit/photos/used",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({download_location:b.downloadLocation})}).catch(()=>{}),a({url:b.full,alt:b.alt??"",credit:b.credit??(b.by?`Photo by ${b.by}`:""),creditBy:b.by??"",creditUrl:b.byUrl??"",creditSource:b.source??"",creditSourceUrl:b.sourceUrl??""})}),g.append(x)})};Jt(t).forEach((u,m)=>{let v=document.createElement("button");v.type="button",v.className="le-chip",v.textContent=u,v.addEventListener("click",()=>void f(u)),c.append(v),m===0&&v.classList.add("is-on")}),s.addEventListener("keydown",u=>{u.key==="Enter"&&(u.preventDefault(),s.value.trim()&&f(s.value.trim()))}),await f(Jt(t)[0])},vo=(e,t)=>({not_configured:"Free photographs are not switched on for this site yet.",not_allowed:"The photo library would not accept this site\u2019s key. It needs setting up again.",unreachable:"Could not reach the photo library just now. Try again in a moment.",nothing_to_search_for:"Type what the picture should show."})[e]??`Nothing found for "${t}". Try fewer words.`,xo=(e,t,a)=>{let s=mo(t),c=$("div","le-suggest");c.append($("div","le-eyebrow","Suggested for this spot"),$("div","le-suggest-text",s));let g=document.createElement("button");g.type="button",g.className="le-chip",g.style.marginTop="10px",g.textContent="Use this description",c.append(g);let p=document.createElement("textarea");p.className="le-textarea",p.placeholder="Describe the picture you want",g.addEventListener("click",()=>{p.value=s,p.focus()});let d=K?.costs?.generate_image??5,f=K?.balance??0,u=document.createElement("button");u.type="button",u.className="le-btn-publish",u.style.marginTop="14px",u.textContent=`Make a picture \xB7 ${d} credits`;let m=$("div","le-grid is-square");if(m.style.display="none",e.append(c,p,u,m),f<d){c.remove(),p.remove(),u.remove(),e.append($("div","le-section-heading","Making pictures costs credits"),$("div","le-hint",`A picture costs ${d} credits. You have ${f}.`));let v=window.liveEditEditor?.console??null;if(v){let b=$("button","le-btn-publish","Buy credits");b.type="button",b.style.marginTop="14px",b.addEventListener("click",()=>{window.open(`${v.replace(/\/$/,"")}/billing`,"_blank","noopener")}),e.append(b)}e.append(G("Uploading your own picture and the free photo library cost nothing, and they are the other two tabs here."));return}{let v=$("div","le-hint",`${d} credits a picture \xB7 ${f} left`);e.insertBefore(v,u)}u.addEventListener("click",async()=>{let v=p.value.trim()||s;u.disabled=!0,u.textContent="Making\u2026",m.style.display="",m.replaceChildren();for(let S=0;S<4;S+=1)m.append($("div","le-shimmer"));let b;try{b=await(await R("/live-edit/imagine",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:v})})).json()}catch(S){m.replaceChildren(G(D(S,"make a picture"))),u.disabled=!1,u.textContent="Try again \xB7 5 credits";return}let x=b?.images??[];if(typeof b?.balance=="number"&&(K={...K??{},balance:b.balance}),x.length===0){m.replaceChildren(G(ko(b?.reason))),u.disabled=!1,u.textContent="Try again \xB7 5 credits";return}m.replaceChildren(),x.forEach(S=>{let L=document.createElement("button");L.type="button",L.className="le-pick";let T=document.createElement("img");T.className="le-pick-shot",T.src=S,T.alt="",L.append(T,$("span","le-tag","MADE")),L.addEventListener("click",()=>a({url:S,credit:"",creditSource:"Generated"})),m.append(L)}),u.disabled=!1,u.textContent="Make four more \xB7 5 credits"})},ko=e=>({not_enough_credits:"Not enough credits to make a picture. You can buy more from your account.",not_configured:"Making pictures is not switched on for this site yet.",no_suggestion:"Nothing usable came back, so you have not been charged. Try describing it differently.",nothing_to_work_with:"Describe the picture you want first."})[e]??"Could not make a picture just now. You have not been charged.",Re=null,Eo=(e,t)=>{if(!t)return;let a=be(e),s=d=>[...d.childNodes].filter(f=>f.nodeType===3),c=s(e).map(d=>d.nodeValue),g=()=>{let d=s(e);return d.length!==c.length?!1:(d.forEach((f,u)=>{f.nodeValue=c[u]}),!0)},p=!1;y.restore=()=>{!p||!Re||g()||Re(e,a)},t.addEventListener("input",()=>{Re&&(p=!0,g(),Re(e,t.value,{keepRuns:!0}))}),Re===null&&Promise.resolve().then(()=>(ht(),ut)).then(d=>Re=d.applyValue).catch(d=>console.warn("[live-edit] could not preview words as you type:",d.message))},So=e=>{y.hrefKey=e.dataset.editHref,y.targetKey=e.dataset.editTarget;let t=document.createElement("div");t.className="le-field le-divided",t.append("Link");let a=document.createElement("input");a.type="text",a.dataset.linkField="href";let s=e.getAttribute("href")??"";a.value=s==="#"?"":s,a.placeholder="/contact or https://...",a.className="le-input le-link";let c=document.createElement("label");c.className="le-default";let g=document.createElement("input");g.type="checkbox",g.dataset.linkField="target",g.checked=e.getAttribute("target")==="_blank",c.append(g,"Open in a new tab"),t.append(a,c),E.append(t)},wt=e=>{y={kind:"link"},_.textContent=e.dataset.editLabel??"Link",E.replaceChildren(),H.classList.add("le-hidden"),xe(e)},ot=e=>{let{kind:t,key:a,parts:s}=mn(e.dataset.edit);if(E.replaceChildren(),H.classList.add("le-hidden"),t==="setting"){y={kind:t,key:a,element:e},_.textContent=e.dataset.editLabel??te(e);let c=(window.liveEditRich?.settings??[]).includes(s[0]),g=It({editValue:e.dataset.editValue,ownText:be(e),fullText:e.textContent}),p=c?g.trim():g.replace(/\s+/g," ").trim();y.openedWith=p;let d=e.dataset.editAs==="icon";if(E.append(d?Ce("icon","Icon",e.dataset.editValue??"",1,!1):Ce("value","Text",p,6,c)),!d&&!c){let f=[...e.childNodes].filter(m=>m.nodeType===3);if(e.children.length>0&&f.some(m=>m.textContent.trim()!=="")){let m=document.createElement("p");m.className="le-hint",m.textContent="Some words here sit inside their own formatting and are edited separately. Changing this box rewrites only the words around them, and leaves them as they are.",E.append(m)}}d||Ze(e,E.querySelector("textarea")),!d&&!c&&Eo(e,E.querySelector("textarea"))}else{let[c,g]=s;y={kind:"record",type:c,id:Number(g)};let p=e.dataset.editLabel??"Item",d=JSON.parse(e.dataset.editValues??"{}"),f=d.title??d.question??d.label??d.number;if(_.textContent=f?`${p}: ${f.slice(0,40)}`:p,Object.entries(d).forEach(([b,x])=>{let S=b.replace(/_/g," "),L=S.charAt(0).toUpperCase()+S.slice(1),T=(window.liveEditRich?.fields??[]).includes(`${c}.${b}`);E.append(Ce(b,L,x,b==="detail"||b==="answer"?6:3,T))}),window.liveEditPublishing){let b=document.createElement("div");b.className="le-hint le-immediate",b.textContent="Changes here go live as soon as you save, without publishing.",E.append(b)}e.hasAttribute("data-edit-deletable")&&(H.textContent=`Delete this ${p.toLowerCase()}`,H.classList.remove("le-hidden"));let u=document.createElement("div");u.className="le-row";let m=document.createElement("span");m.className="le-label",m.textContent="Order";let v=(b,x)=>{let S=document.createElement("button");return S.type="button",S.textContent=x,S.className="le-chip-btn",S.addEventListener("click",async()=>{(await(await R("/live-edit/record/move",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:y.type,id:y.id,direction:b})})).json()).moved?O("Reordered \u2713"):w(b==="up"?"Already first.":"Already last.")}),S};u.append(m,v("up","\u2191 Move up"),v("down","\u2193 Move down")),E.prepend(u)}xe(e)},Co=e=>{let t=e.closest?.("[data-edit-item]"),a=t?.parentElement?.dataset?.editList?t.parentElement:e.closest?.("[data-edit-list]");if(!a?.dataset?.editList)return;let s=()=>[...a.children].filter(f=>f.dataset.editItem).map(f=>f.dataset.editItem),c=async(f,u)=>{try{await R("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:a.dataset.editList,value:JSON.stringify(f)})}),O(u)}catch(m){w(m.message)}},g=document.createElement("div");g.className="le-section-heading",g.textContent="List";let p=document.createElement("div");p.className="le-row";let d=document.createElement("button");if(d.type="button",d.className="le-chip-btn",d.textContent=t?"+ Add another":"+ Add item",d.addEventListener("click",()=>{let f=s(),u=t?f.indexOf(t.dataset.editItem):f.length-1;f.splice(u+1,0,"n"+Date.now().toString(36)),c(f,"Added \u2713")}),p.append(d),t){let f=document.createElement("button");f.type="button",f.className="le-btn-danger",f.textContent="Delete this item",f.addEventListener("click",()=>{window.confirm("Delete this item?")&&c(s().filter(u=>u!==t.dataset.editItem),"Deleted \u2713")}),p.append(f)}E.append(g,p)},yt=!1,Lo=e=>{yt=!0,e.click(),window.setTimeout(()=>{yt=!1},0)},Ao=e=>e.closest?.('a[href^="#"], [aria-controls], [aria-expanded], [data-toggle], [role="button"]')??null,To=e=>{let t=Ao(e);if(t){let p=document.createElement("div");p.className="le-row";let d=document.createElement("button");d.type="button",d.className="le-chip-btn",d.textContent="Open this menu",d.title="Runs the control so you can edit what it reveals",d.addEventListener("click",()=>{ve(!0),Lo(t)}),p.append(d),E.append(p)}let a=e.closest?.("a[href]"),s=a?.getAttribute("href");if(!s||s==="#"||s.startsWith("javascript:"))return;let c=document.createElement("div");c.className="le-row";let g=document.createElement("button");g.type="button",g.className="le-chip-btn",g.textContent="Open this link \u2192",g.addEventListener("click",()=>{window.location.href=a.href}),c.append(g),E.append(c)},xe=(e,{styleKey:t=null,styleOn:a=e}={})=>{e.dataset.editHref!==void 0&&So(e),To(e);let s=t??a.dataset.styleEdit??a.dataset.style,c=En(a.dataset.styleProps,window.liveEditStyleProps);s&&c.length&&Xe(s,c,a),$o(e),Co(e),Ut(e.dataset.styleEdit?e.closest("[data-style]")??e.parentElement:e),F("Edit"),bt()},No=e=>{let t=(be(e)||e.textContent||"").replace(/\s+/g," ").trim();if(t)return t.slice(0,28);let a=(e.getAttribute("aria-label")??e.getAttribute("title")??"").trim();if(a)return a.slice(0,28);let s=e.className.toString().match(/(?:social-icon-|fa-|bi-|icon-)([a-z][a-z0-9-]{2,})/i)?.[1]??[...e.querySelectorAll("[class]")].map(c=>c.className.toString().match(/(?:social-icon-|fa-|bi-|icon-)([a-z][a-z0-9-]{2,})/i)?.[1]).find(Boolean);return s?s.charAt(0).toUpperCase()+s.slice(1):se(e)},$o=e=>{let t="[data-edit], [data-edit-img], [data-edit-bg], [data-edit-href], [data-edit-icon], [data-edit-svg]",a=[...e.querySelectorAll(t)].filter(p=>p.parentElement?.closest(t)===null||!e.contains(p.parentElement.closest(t))).filter(p=>p!==e&&p.getBoundingClientRect().width>0);if(a.length===0)return;let s=a.slice(0,24),c=document.createElement("div");c.className="le-section-heading",c.textContent=a.length>s.length?`Inside this \u2014 first ${s.length} of ${a.length}`:"Inside this",E.append(c);let g=document.createElement("div");g.className="le-row",s.forEach(p=>{let d=document.createElement("button");d.type="button",d.className="le-chip-btn",d.textContent=No(p),d.addEventListener("click",()=>Ue(p)),g.append(d)}),E.append(g)},vt=e=>{y={kind:"style"};let t=e.dataset.styleEdit??e.dataset.style;_.textContent=e.dataset.editLabel??te(e),E.replaceChildren(),H.classList.add("le-hidden"),xe(e,{styleKey:t})},at=e=>{let t=getComputedStyle(e,"::before");return`${t.fontStyle} ${t.fontWeight} 20px ${t.fontFamily}`},Kt=(e,t)=>{let a=e.cloneNode(!1);a.removeAttribute("data-edit-icon"),Object.assign(a.style,{position:"absolute",visibility:"hidden",pointerEvents:"none"}),(e.parentNode??document.body).append(a);let s=at(a),c=[];return[...a.classList].forEach(g=>{g!==t&&(a.classList.remove(g),at(a)!==s&&c.push(g),a.classList.add(g))}),a.remove(),c},Oo=(e,t,a,s)=>xn([...e.classList],a,s,Kt(e,s),Kt(t,t.dataset.editIconCurrent)),Io=(e,t)=>{let a=document.createElement("canvas").getContext("2d");return a.font=t,e.filter(({glyph:s})=>{let c=a.measureText(s);return(c.actualBoundingBoxAscent||0)+(c.actualBoundingBoxDescent||0)>0})},Po=async e=>{let t=e.dataset.editIconCurrent;y={kind:"icon",key:e.dataset.editIcon.replace(/^setting:/,""),value:t,element:e},_.textContent="Icon",E.replaceChildren(),H.classList.add("le-hidden");let a=at(e),s=await Wt();if(y?.element!==e)return;let c=new Map([[a,null]]);document.querySelectorAll("[data-edit-icon]").forEach(b=>{let x=at(b);c.has(x)||c.set(x,b)});let g=kn([...c].map(([b,x])=>({face:b,variant:x,icons:Io(s,b)})));if(g.length===0){let b=document.createElement("div");b.className="le-hint",b.textContent="This theme loads its icons from somewhere this page cannot read, so they cannot be listed. Type the icon name instead.";let x=document.createElement("label");x.className="le-field",x.append("Icon name");let S=document.createElement("input");S.type="text",S.className="le-input",S.value=t??"",S.addEventListener("input",()=>{y.value=S.value.trim(),y.dirty=!0}),x.append(S,b),E.append(x),xe(e);return}let p=e.className;y.restore=()=>{e.className=p,e.dataset.editIconCurrent=t};let d=document.createElement("input");d.type="search",d.className="le-input",d.placeholder=`Search ${g.length} icons\u2026`;let f=document.createElement("div");f.className="le-icon-grid";let u=document.createElement("div");u.className="le-hint";let m=400,v=b=>{let x=b.trim().toLowerCase().replace(/\s+/g,"-"),S=x?g.filter(({name:L})=>L.includes(x)):g;if(f.replaceChildren(),S.slice(0,m).forEach(({name:L,glyph:T,face:q,variant:Z})=>{let M=document.createElement("button");M.type="button",M.className="le-icon-choice",M.title=L.replace(/^[a-z]+-/,"").replace(/-/g," "),M.classList.toggle("is-current",L===t),M.style.font=q,M.textContent=T,M.addEventListener("click",()=>{e.className=p,e.dataset.editIconCurrent=t;let P=Z?Oo(e,Z,L,t):L;Z?e.className=P:e.classList.replace(t,L),e.dataset.editIconCurrent=L,y.value=P,y.dirty=!0,f.querySelectorAll(".le-icon-choice").forEach(W=>W.classList.remove("is-current")),M.classList.add("is-current")}),f.append(M)}),S.length===0){let L=document.createElement("div");L.className="le-hint",L.textContent="No icon matches that name.",f.append(L)}u.textContent=S.length>m?`Showing ${m} of ${S.length}. Type to narrow it down.`:""};d.addEventListener("input",()=>v(d.value)),v(""),E.append(d,f,u),xe(e)},Xt=e=>{let t=e.outerHTML;y={kind:"setting",key:e.dataset.editSvg.replace(/^setting:/,""),element:e},_.textContent=e.dataset.editLabel??"Drawing",E.replaceChildren(),H.classList.add("le-hidden");let a=()=>{e.outerHTML=t};y.restore=a;let s=new Set,c=[];document.querySelectorAll("svg").forEach(v=>{let b=v.outerHTML,x=b.replace(/\s+(class|style|width|height|data-[\w-]+)="[^"]*"/g,"");s.has(x)||v.getBoundingClientRect().width<4||(s.add(x),c.push(b))});let g=document.createElement("div");g.className="le-icon-grid";let p=null;c.slice(0,120).forEach(v=>{let b=document.createElement("button");b.type="button",b.className="le-icon-choice",b.innerHTML=v;let x=b.firstElementChild;x&&(x.removeAttribute("class"),x.setAttribute("width","20"),x.setAttribute("height","20")),b.classList.toggle("is-current",v===t),b.addEventListener("click",()=>{p=v,y.value=v,y.dirty=!0;let S=document.querySelector(`[data-edit-svg="${e.dataset.editSvg}"]`)??e,L=new DOMParser().parseFromString(v,"image/svg+xml").documentElement;["class","width","height","style","data-edit-svg","data-edit-label"].forEach(T=>{S.hasAttribute(T)&&L.setAttribute(T,S.getAttribute(T))}),S.replaceWith(L),g.querySelectorAll(".le-icon-choice").forEach(T=>T.classList.remove("is-current")),b.classList.add("is-current")}),g.append(b)});let d=document.createElement("label");d.className="le-field le-divided",d.append("Or paste an SVG");let f=document.createElement("textarea");f.className="le-input le-prose",f.placeholder='<svg viewBox="0 0 24 24">\u2026</svg>',f.addEventListener("input",()=>{f.value.trim()!==""&&(y.value=f.value.trim(),y.dirty=!0)});let u=document.createElement("div");u.className="le-hint",u.textContent="Anything that could run or fetch is stripped before it is saved.",d.append(f,u);let m=document.createElement("div");m.className="le-section-heading",m.textContent=c.length?"Drawings on this site":"No other drawings here",E.append(m,g,d),xe(e)},xt=e=>{let t=e.dataset.editKind==="background";y={kind:"image",target:e.dataset.editImg??e.dataset.editBg,element:e},_.textContent=e.dataset.editLabel??(t?"Background image":"Image"),E.replaceChildren(),H.classList.add("le-hidden");let a=document.createElement("div");a.className="le-preview";let s=document.createElement("img");s.alt="",s.className="";let c=t?Le(e):e.currentSrc||e.getAttribute("src")||"",p=(c&&!c.startsWith("data:")?c:"")||e.dataset.editPreview;p?(s.src=p,a.append(s)):a.textContent="No image yet";let d=P=>{a.replaceChildren(s),s.src=P},f=re({onFile:P=>d(URL.createObjectURL(P))}),u=document.createElement("label");u.className="le-field",u.append("Or paste an image URL");let m=document.createElement("input");m.type="url",m.placeholder="https://...",m.className="le-input",m.addEventListener("change",()=>{let P=m.value.trim();P&&d(P.startsWith("http")?P:`https://${P}`)}),u.append(m);let v=document.createElement("div");v.className="le-hint",v.textContent="Nothing changes on your site until you publish.";let b=(P,W,ee,le)=>{let ie=document.createElement("label");ie.className="le-field le-divided",ie.append(W);let U=document.createElement("input");if(U.type="text",U.dataset.imgAttr=P,U.value=ee??"",U.dataset.imgAttrWas=ee??"",U.className="le-input",ie.append(U),le){let J=document.createElement("span");J.className="le-hint",J.textContent=le,ie.append(J)}return ie},x=$("div","le-ways"),S=()=>{E.querySelectorAll(".le-staged").forEach(W=>W.remove());let P=$("div","le-hint le-staged","This is a preview. Press Save changes to keep it.");E.prepend(P)},L=(P,W)=>new Promise(ee=>{let le=l.modal({title:"Which part of the picture?",subtitle:"The shape is the spot it has to fill. Drag to choose what stays in it."}),ie=$("div","le-crop-stage");ie.style.cssText="position:relative;display:inline-block;max-width:100%;line-height:0;touch-action:none;";let U=document.createElement("img");U.alt="",U.style.cssText="max-width:100%;max-height:52vh;display:block;",U.src=URL.createObjectURL(P);let J=$("div","le-crop-frame");J.style.cssText="position:absolute;border:2px solid #fff;box-shadow:0 0 0 9999px rgba(0,0,0,.45);cursor:move;",ie.append(U,J),le.body.append(ie);let Ve=$("div","le-row");Ve.style.marginTop="14px";let Se=$("button","le-btn-publish","Use this part");Se.type="button";let ze=$("button","le-btn-outline","Whole picture");ze.type="button",Ve.append(Se,ze),le.body.append(Ve);let ne={x:0,y:0,width:0,height:0},st=()=>{J.style.left=`${ne.x}px`,J.style.top=`${ne.y}px`,J.style.width=`${ne.width}px`,J.style.height=`${ne.height}px`},qo=()=>{ne=dn({width:U.clientWidth,height:U.clientHeight},W),st()};U.addEventListener("load",qo);let Fe=null;J.addEventListener("pointerdown",de=>{Fe={x:de.clientX,y:de.clientY,at:{...ne}},J.setPointerCapture(de.pointerId),de.preventDefault()}),J.addEventListener("pointermove",de=>{Fe&&(ne=pn(Fe.at,{x:de.clientX-Fe.x,y:de.clientY-Fe.y},{width:U.clientWidth,height:U.clientHeight}),st())}),J.addEventListener("pointerup",()=>{Fe=null});let sn=de=>{URL.revokeObjectURL(U.src),le.close(),ee(de)};Se.addEventListener("click",()=>{sn(cn(ne,U.clientWidth,U.naturalWidth))}),ze.addEventListener("click",()=>sn(null))}),T=({url:P,file:W,credit:ee,alt:le,creditBy:ie,creditUrl:U,creditSource:J,creditSourceUrl:Ve})=>{if(y.crop=null,W){let ze=new DataTransfer;ze.items.add(W),f.querySelector("input[type=file]").files=ze.files,d(URL.createObjectURL(W));let ne=Nt(y.element);ne&&L(W,ne.width/ne.height).then(st=>{y.crop=st})}else P&&(m.value=P,d(P));let Se=E.querySelector('[data-img-attr="alt"]');le&&Se&&Se.value.trim()===""&&(Se.value=le),y.credit={credit:ee??"",creditBy:ie??"",creditUrl:U??"",creditSource:J??"",creditSourceUrl:Ve??""},y.creditFor=y.target,Z(y.credit),S()},q=$("p","le-credit"),Z=P=>{let W=(P?.credit??"").trim();q.textContent=W,q.hidden=W===""};Z({credit:dt(e,"data-edit-credit","editCredit")});let M=$("button","le-btn le-wide",t?"Replace background":"Replace image");if(M.type="button",M.addEventListener("click",()=>Gt(e,T,"Free photos",t?"background":"image")),x.append(M),f.hidden=!0,u.hidden=!0,E.append(a,q,x,f,u,v),y.target.startsWith("setting:")&&!t&&E.append(b("alt","Alt text",dt(e,"alt","editAlt"),"Describes the image for search engines and screen readers."),b("imgTitle","Title attribute",dt(e,"title","editTitle"),"Optional tooltip shown on hover.")),y.target.startsWith("setting:")){let P=document.createElement("button");P.type="button",P.textContent=t?"Remove background":"Remove image",P.className="le-btn-danger",P.addEventListener("click",async()=>{let W=t?"Remove this background image? The section keeps its layout and colour.":"Remove this image? The section keeps its layout; you can add a new image any time.";if(!window.confirm(W))return;let ee=new FormData;ee.append("target",y.target),ee.append("remove","1"),await R("/live-edit/image",{method:"POST",body:ee}),O("Removed \u2713")}),E.append(P)}xe(e)},Qt=e=>e?.closest?.("a[data-edit], a[data-edit-href]")??null,Bo=e=>{let t=e?.getAttribute("href")??"";return t!==""&&t!=="#"&&!t.startsWith("javascript:")},ke=null,kt=!1,it=null,Et=()=>{it&&(clearTimeout(it),it=null)},Zt=()=>{Et(),it=setTimeout(()=>{kt||He()},140)},jo=e=>{if(e===ke&&!V.classList.contains("hidden"))return;ke=e;let t=e.getBoundingClientRect();V.style.top=`${t.top+window.scrollY-10}px`,V.style.left=`${t.right+window.scrollX-10}px`,V.classList.add("is-visible")},He=()=>{V.classList.remove("is-visible"),ke=null},en=e=>{if(!e?.closest)return null;let t=e.closest("[data-style-edit]");if(t)return{element:t,kind:"style"};let a=e.closest("[data-edit-img]");if(a)return{element:a,kind:"image"};let s=e.closest("[data-edit-icon]");if(s)return{element:s,kind:"icon"};let c=e.closest("[data-edit-svg]");if(c)return{element:c,kind:"svg"};let g=e.closest("[data-edit]");if(g)return{element:g,kind:"text"};let p=e.closest("[data-edit-href]:not([data-edit])");if(p)return{element:p,kind:"link"};let d=e.closest("[data-edit-bg]");if(d)return{element:d,kind:"image"};let f=e.closest("[data-style]:not([data-style-edit])");return f?{element:f,kind:"style"}:null},Ro=({element:e,kind:t})=>{t==="image"?xt(e):t==="icon"?Po(e):t==="svg"?Xt(e):t==="text"?ot(e):t==="link"?wt(e):vt(e)},St=null,Ee=()=>l.hoverBox.classList.remove("is-visible"),zo=e=>{let t=e.getBoundingClientRect();if(t.width<4||t.height<4){Ee();return}Object.assign(l.hoverBox.style,{top:`${t.top}px`,left:`${t.left}px`,width:`${t.width}px`,height:`${t.height}px`}),l.hoverBox.classList.toggle("is-flipped",t.top<26),l.hoverLabel.textContent=e.dataset.editLabel??te(e),l.hoverBox.classList.add("is-visible")};document.addEventListener("pointermove",e=>{if(!document.body.classList.contains("editing")){Ee();return}if(e.target===l.root||l.root.contains(e.target)){Ee();return}St||(St=requestAnimationFrame(()=>{St=null;let t=en(e.target);t?zo(t.element):Ee()}))}),document.addEventListener("scroll",Ee,!0),document.addEventListener("pointerleave",Ee);let rt=null,Ct=()=>{Q.classList.remove("is-visible"),rt=null},Fo=e=>{rt=e;let t=e.getBoundingClientRect();Q.style.top=`${Math.max(t.top,8)+8}px`,Q.style.left=`${t.left+8}px`,Q.classList.add("is-visible")};Q.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),rt&&vt(rt),Ct()}),document.addEventListener("pointerover",e=>{if(!document.body.classList.contains("editing"))return;let t=e.target.closest?.("[data-has-bg]");t&&Fo(t);let a=Qt(e.target);a&&Bo(a)&&(Et(),jo(a))}),document.addEventListener("pointerout",e=>{document.body.classList.contains("editing")&&e.relatedTarget!==V&&(Qt(e.relatedTarget)===ke&&ke||Zt())}),V.addEventListener("pointerenter",()=>{kt=!0,Et()}),V.addEventListener("pointerleave",()=>{kt=!1,Zt()}),V.addEventListener("click",e=>{if(e.preventDefault(),e.stopPropagation(),!ke)return;let t=ke;t.dataset.edit!==void 0?ot(t):wt(t),He()}),document.addEventListener("click",e=>{if(!document.body.classList.contains("editing")||yt||e.target===l.root||l.root.contains(e.target)||e.target.closest("[data-live-create]"))return;let t=en(e.target);t&&(e.preventDefault(),e.stopImmediatePropagation(),Ro(t))},!0),document.addEventListener("keydown",e=>{if(e.key==="Escape"&&l.shadow.querySelector(".le-scrim")||(e.key==="Escape"&&I.classList.contains("is-open")&&ve(),!document.body.classList.contains("editing"))||e.key!=="Enter"&&e.key!==" "||l.shadow.activeElement)return;let t=document.activeElement;t?.matches("[data-edit-img], [data-edit-bg]")?(e.preventDefault(),xt(t)):t?.matches("[data-edit]")&&!t.matches("button, a")&&(e.preventDefault(),ot(t))}),oe?.addEventListener("click",()=>je(!document.body.classList.contains("editing"))),l.changesButton?.addEventListener("click",()=>{document.body.classList.contains("editing")||je(!0),F("Changes"),bt()});let tn=e=>{if(window.liveEditPublishing){e(window.liveEditPublishing);return}C().then(()=>window.liveEditPublishing&&e(window.liveEditPublishing))};tn(e=>{let t=e.pending??0,a=()=>{l.publishButton.hidden=!1,l.previewButton.hidden=!1,l.publishLabel.textContent=t>0?"Publish":"Published",l.publishCount.textContent=String(t),l.publishCount.hidden=t===0,l.publishButton.disabled=t===0,l.publishButton.title=t>0?`Put ${t} change${t===1?"":"s"} live`:"Nothing is waiting to be published"};a();let s=async()=>{let g=t===1?"":"s",p=e.domain??window.location.host,d=l.modal({title:`Publish ${t} change${g}`,subtitle:`They go live on ${p} right away.`,size:"is-narrow"});d.body.append(G("Loading\u2026"));let f=$("button","le-btn-outline","Keep editing");f.type="button",f.addEventListener("click",()=>d.close());let u=$("button","le-btn-publish","Publish now");u.type="button",d.foot.hidden=!1,d.foot.append(f,u),u.focus();try{let b=(await(await R("/live-edit/changes",{method:"GET"})).json())?.changes??[],x=$("div","le-review");b.forEach(S=>{let L=$("div","le-review-row");L.append($("div","le-review-what",fe(S)),$("div","le-review-to",we(S.after)||"(empty)")),x.append(L)}),d.body.replaceChildren(b.length>0?x:G("Nothing is waiting."))}catch(m){d.body.replaceChildren(G(D(m,"list what is waiting")))}u.addEventListener("click",async()=>{u.disabled=!0,f.disabled=!0,u.textContent="Publishing\u2026",d.allowDismiss(!1);try{await R("/live-edit/publish",{method:"POST"}),t=0,a(),d.close(),O(`Live on ${p} \u2713`)}catch(m){d.allowDismiss(!0),u.disabled=!1,f.disabled=!1,u.textContent="Try again",d.body.replaceChildren(G(D(m,"publish that")))}})};l.publishButton.addEventListener("click",()=>{t!==0&&(document.activeElement?.blur?.(),s())});let c=()=>{let g=document.body.classList.contains("editing");ve(!0),je(!1),l.toolbar.style.display="none";let p=document.createElement("div");p.className="le-back";let d=null,f=x=>{if(x&&!d){d=document.createElement("div"),d.className="le-phone";let S=document.createElement("iframe"),L=new URL(window.location.href);L.searchParams.set("live-edit","off"),S.src=L.toString(),S.title="This page on a phone",d.append(S),l.shadow.append(d)}else!x&&d&&(d.remove(),d=null)},m=[["Desktop",!1],["Phone",!0]].map(([x,S])=>{let L=$("button","le-back-btn",x);return L.type="button",L.addEventListener("click",()=>{m.forEach(T=>T.classList.remove("is-on")),L.classList.add("is-on"),f(S)}),p.append(L),L});if(m[0].classList.add("is-on"),e.previewUrl){let x=$("button","le-back-btn","Copy a link to this");x.type="button",x.title="A link that shows this unpublished version to somebody else",x.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(e.previewUrl),l.toast("Link copied \u2713")}catch{window.prompt("Copy this link:",e.previewUrl)}}),p.append(x)}let v=$("button","le-back-btn","Back to editing");v.type="button",v.addEventListener("click",()=>{f(!1),p.remove(),document.removeEventListener("keydown",b,!0),l.toolbar.style.display="",je(g)});let b=x=>{x.key==="Escape"&&v.click()};document.addEventListener("keydown",b,!0),p.append(v),l.shadow.append(p),v.focus()};l.previewButton.addEventListener("click",c)});let Do=()=>{let e=document.querySelectorAll('nav, [role="navigation"], header ul'),t=new Map,a=s=>s.closest("#wpadminbar, #adminmenu, #wp-toolbar, #live-edit-ui, [data-no-edit], [data-live-edit-chrome]")!==null;return e.forEach(s=>{a(s)||s.querySelectorAll("a[href]").forEach(c=>{if(a(c))return;let g;try{g=new URL(c.getAttribute("href"),window.location.href)}catch{return}if(g.origin!==window.location.origin||/\.(pdf|zip|jpe?g|png|gif|svg|webp|mp4|mp3)$/i.test(g.pathname)||g.pathname===window.location.pathname&&g.hash)return;let p=(c.textContent??"").replace(/\s+/g," ").trim();p===""||p.length>22||t.has(g.pathname)||t.set(g.pathname,{label:p,href:g.href})})}),[...t.values()].slice(0,6)};(()=>{let e=Do();if(e.length<2)return;let t=window.location.pathname.replace(/\/$/,"");e.forEach(a=>{let s=$("button","le-page-btn",a.label);s.type="button",s.title=a.href,new URL(a.href).pathname.replace(/\/$/,"")===t?s.classList.add("is-on"):s.addEventListener("click",()=>{sessionStorage.setItem("tb_editing","1"),window.location.href=a.href}),l.pageSwitcher.append(s)}),l.pageSwitcher.hidden=!1})();let ya=(async()=>{let e=l.languagePicker;if(!e)return;let t;try{t=await(await R("/live-edit/translations",{method:"GET"})).json()}catch{return}let a=t?.locales??[],s=t?.default_locale??"en";if(a.length<2)return;a.forEach(u=>{let m=$("option",null,t?.names?.[u]??u.toUpperCase());m.value=u,e.append(m)});let c=window.liveEditLocale??s;e.value=c,e.hidden=!1;let g=(u,m)=>{if(document.querySelectorAll("[data-live-edit-stale]").forEach(b=>b.removeAttribute("data-live-edit-stale")),m===s)return 0;let v=0;return(u??[]).filter(b=>b.locale===m&&b.current===!1).forEach(b=>{document.querySelectorAll(`[data-edit="setting:${CSS.escape(b.key)}"]`).forEach(x=>{x.setAttribute("data-live-edit-stale",""),v++})}),v},p=t?.stale??[];if(g(p,c),(t?.counts?.stale??0)>0&&c===s){let u=Object.keys(t?.needing_review??{}).length;w(u===1?`1 translation may need updating since the ${s.toUpperCase()} changed.`:`${u} languages have translations that may need updating.`)}let f=0;e.addEventListener("change",async()=>{let u=e.value,m=++f;e.disabled=!0;try{let v=await(await R(`/live-edit/content?locale=${encodeURIComponent(u)}`,{method:"GET"})).json();if(m!==f)return;window.liveEditLocale=u;let{applyContent:b}=await Promise.resolve().then(()=>(ht(),ut));b(document,v?.settings??{});try{p=(await(await R("/live-edit/translations",{method:"GET"})).json())?.stale??p}catch{}let x=g(p,u);w(u===s?"Editing the original.":x>0?`Editing in ${e.options[e.selectedIndex]?.text??u}. ${x===1?"1 sentence on this page has":`${x} sentences on this page have`} fallen behind the original.`:`Editing in ${e.options[e.selectedIndex]?.text??u}. Saves here do not change the original.`)}catch{if(m!==f)return;e.value=window.liveEditLocale??s,w("Could not load that language. Nothing has been changed.")}finally{m===f&&(e.disabled=!1)}})})(),nn=`live-edit:redo:${n?.site??window.location.host}`,Lt=()=>{try{return JSON.parse(sessionStorage.getItem(nn)??"[]")}catch{return[]}},on=e=>{try{sessionStorage.setItem(nn,JSON.stringify(e.slice(-20)))}catch{}},Ye=()=>{l.undoButton.disabled=(window.liveEditPublishing?.pending??0)===0,l.redoButton.disabled=Lt().length===0};tn(Ye),Ye();let an=async()=>{l.undoButton.disabled=!0;let e;try{e=((await(await R("/live-edit/changes",{method:"GET"})).json())?.changes??[])[0]}catch(a){l.toast(D(a,"undo that")),Ye();return}if(!e){l.toast("There is nothing left to undo. Everything is published."),Ye();return}let t=fe(e);try{await R("/live-edit/changes",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:e.key,kind:e.kind})})}catch(a){l.toast(D(a,"undo that")),Ye();return}on([...Lt(),{key:e.key,kind:e.kind,value:e.after,label:t}]),O(`Undone: ${t}`)},rn=async()=>{let e=Lt(),t=e.pop();if(!t){l.toast("There is nothing to put back.");return}l.redoButton.disabled=!0;try{if(t.kind==="style")throw new Error("A styling change cannot be put back automatically yet.");await R("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:t.key,value:t.value,locale:window.liveEditLocale})})}catch(a){l.toast(D(a,"put that back")),l.redoButton.disabled=!1;return}on(e),O(`Put back: ${t.label}`)};l.undoButton.addEventListener("click",()=>void an()),l.redoButton.addEventListener("click",()=>void rn()),document.addEventListener("keydown",e=>{!(e.metaKey||e.ctrlKey)||e.key.toLowerCase()!=="z"||(l.shadow.activeElement??document.activeElement)?.closest?.('input, textarea, [contenteditable="true"]')||(e.preventDefault(),e.shiftKey?rn():an())}),l.closeButton.addEventListener("click",()=>ve()),l.cancelButton.addEventListener("click",()=>ve()),l.saveButton.addEventListener("click",go),H?.addEventListener("click",async()=>{!y||y.kind!=="record"||window.confirm("Delete this item?")&&(await R(`/live-edit/record/${y.type}/${y.id}`,{method:"DELETE"}),O("Deleted \u2713"))}),document.querySelectorAll("[data-live-create]").forEach(e=>{e.addEventListener("click",async()=>{await R("/live-edit/record/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:e.dataset.liveCreate})}),O("Added \u2713 \u2014 click it to edit")})});let At=new URLSearchParams(window.location.search);if(At.has("edit")){At.delete("edit");let e=At.toString();window.history.replaceState(null,"",window.location.pathname+(e?`?${e}`:"")),je(!0)}else je(sessionStorage.getItem("tb_editing")==="1")}};window.liveEditDisplayedValue=n=>It({editValue:n.dataset.editValue,ownText:be(n),fullText:n.textContent});var Mt=(()=>{let n=!1;return()=>{n||new URLSearchParams(window.location.search).get("live-edit")!=="off"&&(n=!0,ma())}})();document.readyState==="complete"?Mt():(window.addEventListener("load",Mt,{once:!0}),window.setTimeout(Mt,2e3));
