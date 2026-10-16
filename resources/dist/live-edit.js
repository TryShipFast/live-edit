var ia=Object.defineProperty;var Re=(n,o)=>()=>(n&&(o=n(n=0)),o);var Pt=(n,o)=>{for(var i in o)ia(n,i,{get:o[i],enumerable:!0})};var An,Ge,Ln,Tn,Nn,ua,$n,On,Rt,me,In,Pn,Bn,ct,pt,ha,Fe,Ft,jn,zn,Rn,Dt,Fn,Dn,qn,ut=Re(()=>{An=n=>{let[o,...i]=String(n??"").split(":");return{kind:o,key:i.join(":"),parts:i}},Ge=(n=3e4)=>{if(typeof AbortSignal<"u"&&typeof AbortSignal.timeout=="function")return AbortSignal.timeout(n);if(typeof AbortController>"u")return;let o=new AbortController;return setTimeout(()=>o.abort(),n),o.signal},Ln=n=>n?.name==="TimeoutError"||n?.name==="AbortError",Tn=(n,o={})=>({...o,headers:{"X-CSRF-TOKEN":n,Accept:"application/json",...o.headers??{}}}),Nn=n=>(n?.headers?.get?.("content-type")??"").includes("json"),ua=/\.((?:fa|fas|far|fab|fal|fad|bi|ti|icon|flaticon|glyphicon|ion|mdi)-[a-z0-9][a-z0-9-]*)::?before/gi,$n=n=>{let o=[];for(let i of String(n??"").split("}")){let r=i.indexOf("{");if(r===-1)continue;let f=i.slice(r+1).match(/content\s*:\s*(["'])(.*?)\1/);if(!f)continue;let b=f[2].match(/^\\([0-9a-f]{1,6})\s*$/i),c=b?String.fromCodePoint(parseInt(b[1],16)):f[2];if([...c].length===1)for(let x of i.slice(0,r).matchAll(ua))o.push({name:x[1],glyph:c})}return o},On=(n,o,i,r,f)=>{let b=n.filter(c=>c!==i&&!r.includes(c));return f.forEach(c=>b.includes(c)||b.push(c)),b.push(o),b.join(" ")},Rt=({editValue:n,ownText:o,fullText:i})=>(n??"")!==""?n:(o??"").trim()!==""?o:i??"",me=n=>n.children.length?[...n.childNodes].filter(o=>o.nodeType===3).map(o=>o.textContent).join(""):n.textContent,In=n=>{let o=new Set,i=[];for(let r of n)for(let f of r.icons)o.has(f.name)||(o.add(f.name),i.push({...f,face:r.face,variant:r.variant}));return i.sort((r,f)=>r.name.localeCompare(f.name))},Pn=(n,o)=>{let i=Object.keys(o??{}),r=String(n??"").split(",").map(f=>f.trim()).filter(Boolean);return r.length===0?i:i.length===0?r:r.filter(f=>i.includes(f))},Bn=(n,o={},i)=>{let r=String(i?.base??"").replace(/\/$/,""),[f,b]=String(n).split("?"),c={"/live-edit/setting":`${r}/${i?.site}/content`,"/live-edit/style":`${r}/${i?.site}/styles`,"/live-edit/publish":`${r}/${i?.site}/publish`,"/live-edit/image":`${r}/${i?.site}/media`,"/live-edit/upload":`${r}/${i?.site}/media`,"/live-edit/changes":`${r}/${i?.site}/changes`,"/live-edit/versions":`${r}/${i?.site}/versions`,"/live-edit/content":`${r}/${i?.site}/content`,"/live-edit/translations":`${r}/${i?.site}/translations`,"/live-edit/credits":`${r}/${i?.site}/credits`,"/live-edit/assist":`${r}/${i?.site}/assist`,"/live-edit/photos":`${r}/${i?.site}/photos`,"/live-edit/photos/used":`${r}/${i?.site}/photos/used`,"/live-edit/imagine":`${r}/${i?.site}/imagine`},x=i?.routes?.[f]??(f==="/live-edit/publish"?i?.publishUrl:null);if(x)return{url:b?`${x}?${b}`:x,init:{...o,headers:{...o.headers??{},...i.routeHeaders??i.publishHeaders??{},Accept:"application/json"},credentials:"same-origin"}};let C=c[f];if(!r||!i?.site||!i?.token)throw new Error("The content API is not configured on this page.");if(!C)throw new Error(`Editing that is not available over the content API yet (${f}).`);return{url:b?`${C}?${b}`:C,init:{...o,headers:{...o.headers??{},Authorization:`Bearer ${i.token}`,Accept:"application/json"}}}},ct=(n,o,i)=>n.hasAttribute(o)?n.getAttribute(o):n.dataset?.[i]??"",pt=n=>{let o=String(n??"").trim();return o===""?!1:/^data:image\//i.test(o)||/\/live-edit\/(sites|media)\//i.test(o)?!0:/\.(jpe?g|png|gif|webp|avif|svg)(\?|#|$)/i.test(o)},ha=(n,o)=>o==null?!0:o===408||o===425||o===429||o>=500,Fe=async(n,{tries:o=3,waits:i=[200,500],sleep:r=null}={})=>{let f=r??(c=>new Promise(x=>setTimeout(x,c))),b=null;for(let c=0;c<o;c++)try{return await n()}catch(x){if(b=x,c===o-1||!ha(x,x.status))throw x;await f(i[Math.min(c,i.length-1)])}throw b},Ft=(n,o=null)=>{if(!n)return"";let i=n.dataset?.background||n.dataset?.bg||n.dataset?.backgroundImage;if(i)return i;let r=o??n.ownerDocument?.defaultView??(typeof window>"u"?null:window),b=(r?.getComputedStyle&&r.getComputedStyle(n).backgroundImage||"").match(/url\((['"]?)(.*?)\1\)/);if(b&&!b[2].startsWith("data:"))return b[2];let c=n.dataset?.kbBg||"";return c.startsWith("data:")?"":c},jn=(n,o)=>{let i=[...n?.childNodes??[]].filter(r=>r.nodeType===3);return i.length<2?String(o??"").replace(/\s+/g," ").trim():i.map(r=>(r.nodeValue??"").replace(/\s+/g," ")).join("").trim()},zn={background:"background",textColor:"color",fontSize:"font-size",radius:"border-radius",backgroundImage:"background-image"},Rn=(n,o,i={})=>o?!1:n==="hidden"?!0:!!i[n],Dt=(n,o=24)=>[...n?.children??[]].map(i=>(i.textContent??"").replace(/\s+/g," ").trim()).filter(i=>i!=="").map(i=>i.length>o?`${i.slice(0,o-1).trimEnd()}\u2026`:i),Fn=n=>{let o=n?.closest?.('a[href^="#"], [aria-controls], [aria-expanded], [data-toggle], [role="button"], [role="tab"], summary, button')??null;return!o||o.tagName==="BUTTON"&&o.form&&(o.getAttribute("type")||"submit").toLowerCase()!=="button"?null:o},Dn=n=>{let o=(n?.getAttribute?.("aria-label")||n?.getAttribute?.("title")||n?.textContent||"").replace(/\s+/g," ").trim();return o===""||o.length>80?"":o.length>32?`${o.slice(0,31).trimEnd()}\u2026`:o},qn=(n,o)=>{let i=n.tagName,r;i==="IMG"?r=["radius","hidden"]:i==="A"||i==="BUTTON"?r=["background","textColor","fontSize","radius","hidden"]:/^(H[1-6]|P|SPAN|LI|BLOCKQUOTE|FIGCAPTION|DT|DD|TD|TH|CAPTION|CITE|Q|LABEL|STRONG|EM)$/.test(i)?r=["textColor","fontSize","hidden"]:r=["background","backgroundImage","paddingY","paddingX","radius","hidden"];let f=Ft(n)!=="",b=n.hasAttribute?.("data-edit-bg")===!0;return(!f||b)&&(r=r.filter(c=>c!=="backgroundImage")),o.filter(c=>r.includes(c.trim()))}});var ga,qt,Mn=Re(()=>{ga=[[/(<meta[^>]+name=["']csrf-token["'][^>]+content=["'])[^"']*/gi,"$1"],[/(\sdata-csrf=["'])[^"']*/gi,"$1"],[/(\swire:snapshot=["'])[^"']*/gi,"$1"],[/(\swire:effects=["'])[^"']*/gi,"$1"],[/(\swire:id=["'])[^"']*/gi,"$1"],[/(name=["']_token["'][^>]+value=["'])[^"']*/gi,"$1"],[/(\snonce=["'])[^"']*/gi,"$1"],[/(=["'])lofi-[0-9a-z-]*/gi,"$1"],[/(\sstyle=["'])display:\s*none;?(?=["'])/gi,"$1"]],qt=n=>ga.reduce((o,[i,r])=>o.replace(i,r),String(n??""))});var Ht={};Pt(Ht,{applyTags:()=>Mt,autoTag:()=>Xe,elementAt:()=>Un,ensureBackgroundsAreFound:()=>ba,fingerprint:()=>Ut,refreshBackgrounds:()=>ma,resolveBackgrounds:()=>_t,watchForLateBackgrounds:()=>Jn,watchForLateContent:()=>Vn,worthSending:()=>Wt});var fa,Ut,Un,Mt,_n,Wn,Hn,Yn,_t,ba,ma,Wt,Vn,Jn,wa,ya,Xe,Yt=Re(()=>{Mn();ut();fa="kb_tags_",Ut=n=>{let o=2166136261;for(let i=0;i<n.length;i++)o^=n.charCodeAt(i),o=Math.imul(o,16777619);return(o>>>0).toString(16)},Un=(n,o)=>{let i=n.documentElement;for(let r of o)if(i=[...i?.children??[]][r],!i)return null;return i},Mt=(n,o)=>{let i=0;for(let{at:r,attributes:f}of o??[]){let b=Un(n,r);if(b){for(let[c,x]of Object.entries(f))b.hasAttribute(c)||b.setAttribute(c,x);i++}}return i},_n=n=>{try{return JSON.parse(window.sessionStorage?.getItem(n)??"null")}catch{return null}},Wn=(n,o)=>{try{window.sessionStorage?.setItem(n,JSON.stringify(o))}catch{}},Hn=n=>n.hasAttribute("data-kb-bg")||n.hasAttribute("data-background")||n.hasAttribute("data-bg")||n.hasAttribute("data-background-image")||/background-image|url\(/i.test(n.getAttribute("style")??""),Yn=(n,o)=>{if(Hn(n))return!1;let i=o.getComputedStyle(n).backgroundImage;if(!i||i==="none"||!i.includes("url("))return!1;let r=i.match(/url\(\s*["']?([^"')]+)/)?.[1];return!r||r.startsWith("data:")?!1:(n.setAttribute("data-kb-bg",r),!0)},_t=(n=document)=>{let o=n.defaultView??window;if(!o?.getComputedStyle)return 0;let i=0;for(let r of n.querySelectorAll("body *"))Yn(r,o)&&i++;return i},ba=async(n,o=document)=>{let i=o.defaultView??window;if(i.liveEditBackgroundsWatched)return 0;i.liveEditBackgroundsWatched=!0;let r=await Xe(n,o);return Jn(o,()=>{Xe(n,o).catch(f=>{console.warn("[live-edit] could not tag a late background:",f.message)})}),Vn(o,()=>{Xe(n,o,{because:"new content"}).catch(f=>{console.warn("[live-edit] could not tag what just appeared:",f.message)})}),r},ma=async(n,o=document)=>_t(o)===0&&o.querySelector("[data-kb-bg]:not([data-edit-bg])")===null?0:Xe(n,o),Wt=n=>{let o=n.documentElement.cloneNode(!0);for(let i of o.querySelectorAll("script, style, noscript"))for(let r of[...i.childNodes])r.nodeType===3&&r.remove();return o.outerHTML},Vn=(n=document,o=()=>{})=>{let i=n.defaultView??window;if(!i?.MutationObserver)return null;let r=10,f="[data-edit], [data-edit-img], [data-edit-bg]",b=0,c=null,x=j=>!j||j.nodeType!==1||j.matches?.("[data-edit], [data-edit-img], [data-style]")?!1:(j.textContent??"").trim()!==""&&!j.querySelector?.("[data-edit]")?!0:!!(j.matches?.("img:not([data-edit-img])")||j.querySelector?.("img:not([data-edit-img])")),C=j=>j?.nodeType===1&&!!(j.matches?.(f)||j.querySelector?.(f)),q=j=>(j.textContent??"").replace(/\s+/g," ").trim(),I=new WeakMap,z=(j,$)=>{let R=I.get(j)??new Set;R.add(q($)),I.set(j,R)},T=j=>{let $=new Set,R=new Map;for(let k of j){for(let K of k.removedNodes)C(K)&&($.add(k.target),K.hasAttribute?.("data-kb-swaps")||z(k.target,K));let _=[...k.addedNodes].filter(K=>K.nodeType===1);_.length>0&&R.set(k.target,(R.get(k.target)??[]).concat(_))}for(let[k,_]of R){if(!$.has(k))continue;let K=I.get(k)??new Set;for(let ae of _)K.has(q(ae))||ae.setAttribute("data-kb-swaps","1")}},H=new i.MutationObserver(j=>{if(b>=r){H.disconnect();return}T(j),!(!j.some(R=>[...R.addedNodes].some(x))||c)&&(c=i.setTimeout(()=>{c=null,b+=1,o()},600))});return H.observe(n.body??n.documentElement,{childList:!0,subtree:!0}),H},Jn=(n=document,o=()=>{})=>{let i=n.defaultView??window;if(!i?.IntersectionObserver||!i.getComputedStyle)return null;let r=new Set,f=null,b=()=>{if(f=null,r.size===0)return;let T=[...r];r.clear(),o(T)},c=5,x=new WeakMap,C=T=>{if(Yn(T,i))return r.add(T),q.unobserve(T),f||(f=i.setTimeout(b,250)),!0;let H=(x.get(T)??0)+1;return x.set(T,H),H>=c&&q.unobserve(T),!1},q=new i.IntersectionObserver(T=>{for(let H of T){if(!H.isIntersecting)continue;let j=H.target;C(j)||i.setTimeout(()=>C(j),400)}},{rootMargin:"300px"}),I=[...n.querySelectorAll("body *")].filter(T=>!Hn(T)),z=4e3;return I.length>z&&console.warn(`[live-edit] watching the first ${z} of ${I.length} elements for late backgrounds`),I.slice(0,z).forEach(T=>q.observe(T)),q},wa="kb_locks_",ya=async({base:n,site:o,key:i,page:r},f)=>{if(f.querySelector("[data-live-lock], [data-live-edit-lock]"))try{let b=Wt(f),c=wa+Ut(qt(b));if(_n(c))return;(await fetch(`${String(n).replace(/\/$/,"")}/${o}/locks`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json",Authorization:`Bearer ${i}`},body:JSON.stringify({html:b,page:r??f.location?.pathname??""}),signal:Ge(2e4)})).ok&&Wn(c,!0)}catch{}},Xe=async({base:n,site:o,key:i,page:r},f=document,{because:b=null}={})=>{let c=f.querySelector("[data-edit], [data-edit-img]")!==null;if(_t(f),c&&!(f.querySelector("[data-kb-bg]:not([data-edit-bg])")!==null)&&b===null)return ya({base:n,site:o,key:i,page:r},f),0;let C=Wt(f),q=fa+Ut(qt(C)),I=_n(q);if(I)return Mt(f,I);let z=JSON.stringify({html:C,page:r??f.location?.pathname??""}),{elements:T}=await Fe(async()=>{let H=await fetch(`${String(n).replace(/\/$/,"")}/${o}/tag`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json",Authorization:`Bearer ${i}`},body:z,signal:Ge(2e4)});if(!H.ok){let j=new Error(`Tagging answered ${H.status}`);throw j.status=H.status,j}return H.json()});return Wn(q,T),Mt(f,T)}});var va,xa,ka,Kn,Gn,Xn=Re(()=>{va=new Set(["svg","g","defs","symbol","use","title","desc","path","circle","ellipse","line","polygon","polyline","rect","text","tspan","textpath","lineargradient","radialgradient","stop","clippath","mask","pattern"]),xa=new Set(["viewbox","xmlns","width","height","fill","fill-rule","fill-opacity","stroke","stroke-width","stroke-linecap","stroke-linejoin","stroke-dasharray","stroke-dashoffset","stroke-opacity","stroke-miterlimit","opacity","d","points","x","y","x1","y1","x2","y2","cx","cy","r","rx","ry","transform","offset","stop-color","stop-opacity","gradientunits","gradienttransform","patternunits","clip-rule","clip-path","mask","id","class","role","aria-label","aria-hidden","focusable","preserveaspectratio","vector-effect","text-anchor","font-size","font-family"]),ka=8,Kn=n=>{let o=String(n??"").trim();if(o===""||!/<svg/i.test(o))return null;let i=new DOMParser().parseFromString(o,"image/svg+xml"),r=i.documentElement;return!r||r.tagName?.toLowerCase()!=="svg"||i.querySelector("parsererror")||(Gn(r),r.children.length===0&&r.textContent.trim()==="")?null:r},Gn=n=>{for(let o of[...n.childNodes]){if(o.nodeType===ka){o.remove();continue}if(o.nodeType===1){if(!va.has(o.tagName.toLowerCase())){o.remove();continue}Gn(o)}}for(let o of[...n.attributes]){let i=o.name.toLowerCase(),r=o.value,b=i==="href"||i==="xlink:href"?r.trim().startsWith("#"):xa.has(i);b&&/url\(/i.test(r)&&!/^url\(\s*#/i.test(r.trim())&&(b=!1),b||n.removeAttribute(o.name)}}});var gt={};Pt(gt,{applyBackground:()=>ao,applyContent:()=>ro,applyIcon:()=>oo,applyOrder:()=>io,applyStyles:()=>co,applySvg:()=>no,applyValue:()=>Jt,defendContent:()=>so,fetchContent:()=>uo,fetchSnapshot:()=>po,resolve:()=>ho,styleRules:()=>lo});var Vt,Qn,Ea,Sa,Jt,Ca,Zn,Aa,ht,La,Ta,Na,eo,$a,no,oo,ao,io,ro,so,lo,co,po,uo,to,Oa,ho,ft=Re(()=>{Xn();ut();Vt=(n,o)=>Object.assign(new Error(n),{status:o}),Qn="setting:",Ea=(n,o)=>{let i=n.currentSrc||n.getAttribute("src")||"";if(i!==""&&new URL(i,document.baseURI).href===new URL(o,document.baseURI).href)return;let f=i!==""&&n.complete;if(n.setAttribute("src",o),!f)return;n.style.transition="opacity 120ms ease-out",n.style.opacity="0";let b=()=>{n.style.opacity="1",setTimeout(()=>{n.style.removeProperty("transition"),n.style.removeProperty("opacity")},160)};if(n.decode){n.decode().then(b,b);return}n.addEventListener("load",b,{once:!0}),n.addEventListener("error",b,{once:!0})},Sa=(n,o)=>{for(let i of n.querySelectorAll("[data-edit-img]")){let r=(i.getAttribute("data-edit-img")??"").replace(/^setting:/,""),f=o[r];if(typeof f!="string"||f==="")continue;let b=i.currentSrc||i.getAttribute("src")||"";if(b!==""&&new URL(b,document.baseURI).href===new URL(f,document.baseURI).href)continue;let c=new Image;c.decoding="async",c.src=f}},Jt=(n,o,{keepRuns:i=!1}={})=>{let r=n.tagName?.toLowerCase();if(r==="img"){Ea(n,o),Ca(n);return}if(r==="source"){n.setAttribute("srcset",o);return}ht(n,o,i)},Ca=n=>{if(n.removeAttribute("srcset"),n.removeAttribute("sizes"),n.parentElement?.tagName==="PICTURE")for(let o of[...n.parentElement.children])o.tagName==="SOURCE"&&o.remove()},Zn=n=>String(n??"").replace(/\s+/g," ").trim(),Aa=(n,o)=>Zn(n)===Zn(o),ht=(n,o,i=!1)=>{let r=[...n.childNodes].filter($=>$.nodeType===$a);if(r.length===0){if(Aa(n.textContent,o))return;let $=[...n.children].filter(R=>R.textContent.trim()!=="");if($.length===1){ht($[0],o);return}if($.length>1){ht($[0],o),$.slice(1).forEach(R=>{R.textContent=""});return}n.append(o);return}if(r.length===1){eo(r[0],o);return}let f=r.map($=>$.nodeValue),b=f.join(""),c=0;for(;c<b.length&&c<o.length&&b[c]===o[c];)c+=1;let x=0;for(;x<b.length-c&&x<o.length-c&&b[b.length-1-x]===o[o.length-1-x];)x+=1;let C=c,q=b.length-x,I=o.slice(c,o.length-x),z=0,T=!1,H=f.map($=>{let R=z,k=z+$.length;if(z=k,T||C<R||q>k)return $;T=!0;let _=$.slice(0,C-R),K=$.slice(q-R),ae=_===""&&/^\s/.test($)&&!/^\s/.test(I)?$.match(/^\s+/)[0]:"",X=K===""&&/\s$/.test($)&&!/\s$/.test(I)?$.match(/\s+$/)[0]:"";return _+ae+I+X+K});if(T){r.forEach(($,R)=>{$.nodeValue=H[R]});return}let j=Na(f,o);if(j!==null){r.forEach(($,R)=>{$.nodeValue=j[R]});return}eo(r[0],o),r.slice(1).forEach($=>{if(i){$.nodeValue="";return}$.remove()})},La=(n,o)=>{let i=n.length,r=o.length,f=r+1,b=new Int32Array((i+1)*f);for(let x=i-1;x>=0;x-=1)for(let C=r-1;C>=0;C-=1)b[x*f+C]=n[x]===o[C]?b[(x+1)*f+C+1]+1:Math.max(b[(x+1)*f+C],b[x*f+C+1]);let c=[];for(let x=0,C=0;x<i&&C<r;)n[x]===o[C]?(c.push([x,C]),x+=1,C+=1):b[(x+1)*f+C]>=b[x*f+C+1]?x+=1:C+=1;return c},Ta=(n,o)=>{let i=new Map(n.map(([f,b])=>[f,b])),r=f=>{let b=0;for(let c=f<0?o-1:o;i.has(c);c+=f){let x=i.get(c+f);if(b+=1,x===void 0||Math.abs(x-i.get(c))!==1)break}return b};return Math.max(r(-1),r(1))},Na=(n,o)=>{let i=n.join("");if(i.length===0||o.length===0||i.length*o.length>25e4)return null;let r=La(i,o),f=new Map(r.map(([C,q])=>[C,q])),b=[],c=0,x=0;for(let C of n.slice(0,-1)){if(x+=C.length,Ta(r,x)<3)return null;let q=c;for(let I=x-1;I>=0;I-=1)if(f.has(I)){q=Math.max(c,f.get(I)+1);break}b.push(o.slice(c,q)),c=q}return b.push(o.slice(c)),b},eo=(n,o)=>{let i=n.nodeValue,r=/^\s/.test(i)&&!/^\s/.test(o)?" ":"",f=/\s$/.test(i)&&!/\s$/.test(o)?" ":"";n.nodeValue=r+o+f},$a=3,no=(n,o)=>{let i=Kn(o);if(!i)return!1;let r=document.importNode(i,!0);for(let f of["class","width","height","style","data-edit-svg","data-edit-label"])n.hasAttribute(f)&&r.setAttribute(f,n.getAttribute(f));return n.replaceWith(r),!0},oo=(n,o)=>{let i=String(o).replace(/[^A-Za-z0-9_\- ]/g,"").split(/\s+/).filter(Boolean),r=n.getAttribute("data-edit-icon-current");if(i.length===0||!r)return!1;let f=i.length===1?(n.getAttribute("class")??"").trim().split(/\s+/).map(b=>b===r?i[0]:b):i;return n.setAttribute("class",f.join(" ")),n.setAttribute("data-edit-icon-current",i.length===1?i[0]:i[i.length-1]),!0},ao=(n,o)=>{for(let r of["data-background","data-bg","data-background-image"])n.hasAttribute(r)&&n.setAttribute(r,o);let i=(n.getAttribute("style")??"").replace(/background-image\s*:[^;]*;?/gi,"").trim();n.setAttribute("style",`${i?i.replace(/;?$/,";"):""}background-image:url('${o}')`)},io=(n,o)=>{let i=0;for(let r of n.querySelectorAll("[data-edit-list]")){let f=r.getAttribute("data-edit-list");if(!Object.hasOwn(o,f))continue;let b;try{b=JSON.parse(o[f])}catch{continue}if(!Array.isArray(b)||b.length===0)continue;let c=new Map;for(let C of[...r.children])C.hasAttribute("data-edit-item")&&(c.set(C.getAttribute("data-edit-item"),C),r.removeChild(C));if(c.size===0)continue;let x=c.values().next().value;for(let C of b){let q=c.get(String(C));if(q){r.appendChild(q);continue}let I=x.cloneNode(!0);I.setAttribute("data-edit-item",String(C)),r.appendChild(I)}i++}return i},ro=(n,o)=>{let i=0;io(n,o),Sa(n,o);for(let r of n.querySelectorAll("[data-edit]")){let f=r.getAttribute("data-edit")??"";if(!f.startsWith(Qn))continue;let b=f.slice(Qn.length);Object.hasOwn(o,b)&&(Jt(r,o[b]),i++)}for(let r of n.querySelectorAll("[data-edit-img]")){let f=(r.getAttribute("data-edit-img")??"").replace(/^setting:/,"");Object.hasOwn(o,f)&&(Jt(r,o[f]),o[f]?r.dataset.editPreview=o[f]:delete r.dataset.editPreview,i++);for(let[b,c]of[["Alt","alt"],["Title","title"],["Srcset","srcset"]])if(Object.hasOwn(o,f+b)){let x=o[f+b];x===""&&c!=="alt"?r.removeAttribute(c):r.setAttribute(c,x),i++}}for(let r of n.querySelectorAll("[data-edit-svg]")){let f=(r.getAttribute("data-edit-svg")??"").replace(/^setting:/,""),b=o[f];!Object.hasOwn(o,f)||String(b??"").trim()===""||no(r,b)&&i++}for(let r of n.querySelectorAll("[data-edit-icon]")){let f=(r.getAttribute("data-edit-icon")??"").replace(/^setting:/,""),b=o[f];!Object.hasOwn(o,f)||b===""||oo(r,b)&&i++}for(let r of n.querySelectorAll("[data-edit-bg]")){let f=(r.getAttribute("data-edit-bg")??"").replace(/^setting:/,""),b=o[f];!Object.hasOwn(o,f)||b===""||(ao(r,b),i++)}for(let r of n.querySelectorAll("[data-edit-href]")){let f=r.getAttribute("data-edit-href");Object.hasOwn(o,f)&&(r.setAttribute("href",o[f]),i++)}return i},so=(n,{limit:o=12,debounce:i=60}={})=>{let r=n.defaultView??(typeof window>"u"?null:window);if(!r?.MutationObserver)return null;let f=n.querySelectorAll("[data-edit], [data-edit-img], [data-edit-href]");if(f.length===0)return null;let b=new Map;for(let z of f)b.set(z,{words:z.hasAttribute("data-edit")?me(z):null,src:z.getAttribute("src"),href:z.hasAttribute("data-edit-href")?z.getAttribute("href"):null});let c=0,x=!1,C=null,q=()=>{if(C=null,!n.body?.classList?.contains("editing")){c++,x=!0;for(let[z,T]of b)z.isConnected&&(T.words!==null&&me(z)!==T.words&&ht(z,T.words),T.src!==null&&z.getAttribute("src")!==T.src&&(z.setAttribute("src",T.src),z.removeAttribute("srcset")),T.href!==null&&z.getAttribute("href")!==T.href&&z.setAttribute("href",T.href));I.takeRecords(),x=!1,c>=o&&(I.disconnect(),console.warn(`[live-edit] this page keeps rewriting itself; the client's content was put back ${c} times and is now being left alone.`))}},I=new r.MutationObserver(()=>{x||C||c>=o||(C=r.setTimeout(q,i))});for(let z of f)I.observe(z,{characterData:!0,childList:!0,subtree:!0,attributes:!0,attributeFilter:["src","srcset","href"]});return I},lo=(n,o)=>{let i=`[data-style="${n}"]`,r="",f="";for(let[b,c]of Object.entries(o??{}))if(!(c===""||c===null||c===void 0)){if(b==="hidden"){r+=`body:not(.editing) ${i}{display:none !important}`,r+=`body.editing ${i}{opacity:.45}`;continue}f+={backgroundImage:`background-image:url('${c}') !important;background-size:cover !important;background-position:center !important;`,background:`background:${c} !important;`,textColor:`color:${c} !important;`,fontSize:`font-size:${c}px !important;`,radius:`border-radius:${c}px !important;`,paddingX:`padding-left:${c}px !important;padding-right:${c}px !important;`,paddingY:`padding-top:${c}px !important;padding-bottom:${c}px !important;`}[b]??""}return f===""?r:r+`${i}{${f}}`},co=(n,o)=>{let i=Object.entries(o??{}).map(([c,x])=>lo(c,x)).join("");if(i==="")return 0;let r="live-edit-styles",f=n.getElementById?.(r)??n.querySelector?.(`#${r}`)??null,b=f??n.createElement("style");return b.id=r,b.textContent=i,f||(n.head??n.body)?.appendChild(b),Object.keys(o).length},po=async({snapshot:n,locale:o})=>{let i=String(n).replace(/\/$/,""),r=await Fe(()=>fetch(`${i}/current.json`).then(b=>{if(!b.ok)throw Vt(`Pointer answered ${b.status}`,b.status);return b.json()}));if(!r.version)return{settings:{},styles:{}};let f=o??"en";return Fe(async()=>{let b=await fetch(`${i}/v${r.version}/${f}.json`);if(!b.ok)throw Vt(`Version answered ${b.status}`,b.status);return b.json()})},uo=async({base:n,site:o,key:i,locale:r})=>{let f=`${String(n).replace(/\/$/,"")}/${o}/content${r?`?locale=${encodeURIComponent(r)}`:""}`;return Fe(async()=>{let b=await fetch(f,{headers:{Authorization:`Bearer ${i}`,Accept:"application/json"}});if(!b.ok)throw Vt(`Content service answered ${b.status}`,b.status);return b.json()})},to=async()=>{let n=typeof window<"u"?window.liveEditContent:null;if(!n)return;let o=null,i=null;try{let r=await ho(n);r&&(r.styleProps&&(window.liveEditStyleProps=r.styleProps),typeof r.pending=="number"&&r.styleProps&&(window.liveEditPublishing={...window.liveEditPublishing??{},pending:r.pending,version:r.version??null}),o=ro(document,r.settings??{}),co(document,r.styles??{}),window.liveEditStyles=r.styles??{},so(document))}catch(r){i=r,console.warn("[live-edit] serving the words already in the page:",r.message)}Oa({applied:o,failed:i?i.message:null})},Oa=n=>{window.liveEditContentDone=n,document.dispatchEvent(new CustomEvent("live-edit:content",{detail:n}))},ho=async n=>{if(n.snapshot)try{return await po(n)}catch(o){let i=o.message.includes("fetch")?" (if the files are on another origin, the bucket or CDN must allow cross-origin reads)":"";if(!n.base)throw new Error(o.message+i);console.warn("[live-edit] falling back to the content API:",o.message+i)}return n.base&&n.site&&n.key?uo(n):null};typeof document<"u"&&(document.readyState==="loading"?document.addEventListener("DOMContentLoaded",to):to())});var wo={};Pt(wo,{collectFromFragment:()=>fo,contentConfigFor:()=>ja,currentSession:()=>Ba,forget:()=>Ia,requestLink:()=>Pa,store:()=>bo,stored:()=>mo});var Kt,go,fo,bo,mo,Ia,Pa,Ba,ja,yo=Re(()=>{Kt="kb_session",go="kb_session=",fo=(n=window)=>{let o=n.location?.hash??"",i=o.indexOf(go);if(i===-1)return null;let r=decodeURIComponent(o.slice(i+go.length).split("&")[0]);if(r==="")return null;bo(r,n);let f=o.slice(0,i).replace(/[#&]$/,"");return n.history?.replaceState?.(null,"",n.location.pathname+n.location.search+f),r},bo=(n,o=window)=>{try{o.sessionStorage?.setItem(Kt,n)}catch{}},mo=(n=window)=>{try{return n.sessionStorage?.getItem(Kt)??null}catch{return null}},Ia=(n=window)=>{try{n.sessionStorage?.removeItem(Kt)}catch{}},Pa=async({base:n,site:o},i,r=window)=>(await fetch(`${String(n).replace(/\/$/,"")}/sign-in`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({site:o,email:i,return_to:r.location.origin+r.location.pathname})})).ok,Ba=(n=window)=>fo(n)??mo(n),ja=(n,o)=>{let i={base:n.api,site:n.site,locale:n.locale??null};return o?{...i,key:o,snapshot:null}:{...i,key:n.key,snapshot:n.snapshot??null}}});var ra=`
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

/* The page as a visitor is being served it, at full width. Same idea as the
   phone frame and the same reason: loaded again rather than redrawn, because
   what is published is fetched with a different key and cannot be faked by
   hiding things. */
.le-whole {
  position: fixed; inset: 0; z-index: 2147483003; background: #fff;
}
.le-whole iframe { width: 100%; height: 100%; border: 0; display: block; }

.le-back-sep {
  width: 1px; align-self: stretch; margin: 4px 4px;
  background: rgba(255,255,255,.18);
}

.le-back-note {
  font-size: 12px; color: rgba(255,255,255,.62);
  padding: 0 10px 0 4px; white-space: nowrap; align-self: center;
}

/* So nobody mistakes one for the other at a glance. */
.le-back.is-live { outline: 2px solid #4ADE80; outline-offset: 2px; }

/* ---- what is about to go live ---- */
.le-review { display: flex; flex-direction: column; gap: 2px; }
.le-review-row { padding: 11px 0; border-bottom: 1px solid var(--le-line-soft, #EEEFF1); }
.le-review-row:last-child { border-bottom: 0; }
.le-review-what { font-size: 12px; color: var(--le-muted); }
.le-review-to { font-size: 14px; font-weight: 500; color: var(--le-ink); margin-top: 2px; }
`,sa=`
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
/* The editor is mounted on <html> rather than inside <body> (see
   createChrome), so the clearance is asked for through the root. */
html:has(#live-edit-ui) > body {
  padding-bottom: 96px;
}
/* Sticky footers and cookie bars sit at the bottom too, and two things
   claiming the same corner is how a client ends up unable to reach either.
   The bar is ours and is the newer arrival, so it lifts itself rather than
   covering theirs. */
@media (max-width: 700px) {
  html:has(#live-edit-ui) { scroll-padding-bottom: 112px; }
  html:has(#live-edit-ui) > body { padding-bottom: 112px; }
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
`,A=(n,o,i)=>{let r=document.createElement(n);return o&&(r.className=o),i!==void 0&&(r.textContent=i),r};function mn(){let n=document.createElement("style");n.id="live-edit-page-css",n.textContent=sa,document.head.append(n);let o=document.createElement("div");o.id="live-edit-ui",document.documentElement.append(o);let i=o.attachShadow({mode:"open"}),r=document.createElement("style");r.textContent=ra,i.append(r);let f=window.liveEditToolbar??{},b=A("div","le-toolbar"),c=window.liveEditEditor?.console??null,x=A(c?"a":"span","le-mark");x.innerHTML='<svg width="16" height="16" viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="3" width="20" height="20" rx="3" fill="none" stroke="#0B0C0F" stroke-width="2.5"/><path d="M16 15 L16 30 L19.6 26.4 L22.2 31.2 L24.6 30 L22 25.3 L27 25.3 Z" fill="#3148F5" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>',c&&(x.href=c,x.target="_blank",x.rel="noopener",x.title="Your dashboard: licence, editors, settings",x.setAttribute("aria-label","Open your dashboard"));let C=A("span","le-status le-when-roomy"),q=A("span","le-dot"),I=A("span",null,"");C.append(q,I),b.append(x,C);let z=window.liveEditEditor??null;if(z?.greeting){let F=A("span","le-hello le-when-roomy","Welcome "+z.greeting);b.append(F)}let T=null,H=f.locales??{};Object.keys(H).length>1&&(T=A("select","le-locale"),T.title="Language you are editing",Object.entries(H).forEach(([F,U])=>{let oe=A("option",null,U);oe.value=F,oe.selected=F===(f.locale??"en"),T.append(oe)}),T.addEventListener("change",()=>{window.location.search="?locale="+T.value}),b.append(T));let j=A("button","le-bar-btn","Edit site");j.type="button";let $=F=>'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"'+(F?' style="transform: scaleX(-1)"':"")+'><path d="M9 14 4 9l5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 9h7a6 6 0 0 1 0 12H8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',R=A("button","le-round");R.type="button",R.title="Undo the last change you have not published",R.setAttribute("aria-label","Undo"),R.innerHTML=$(!1);let k=A("button","le-round");k.type="button",k.title="Put back what you just undid",k.setAttribute("aria-label","Redo"),k.innerHTML=$(!0);let _=A("div","le-pages");_.hidden=!0,_.setAttribute("role","group"),_.setAttribute("aria-label","Pages");let K=A("select","le-lang");K.hidden=!0,K.title="Which language you are editing",K.setAttribute("aria-label","Language");let ae=A("button","le-bar-btn le-when-roomy","Changes");ae.type="button",ae.title="Everything you have changed and not published";let X=A("button","le-bar-btn le-when-roomy","Preview");X.type="button",X.title="See the page the way a visitor will",X.hidden=!0;let ie=A("button","le-publish");ie.type="button",ie.title="Put your changes live",ie.hidden=!0;let v=A("span",null,"Publish"),we=A("span","le-publish-count");if(we.hidden=!0,ie.append(v,we),b.append(A("span","le-sep"),j,R,k,A("span","le-sep"),_,K,ae,X,ie),(f.links??[]).forEach(F=>{let U=A("a","le-btn-ghost",F.label);U.href=F.href,F.title&&(U.title=F.title),b.append(U)}),f.logout?.href)if((f.logout.method??"get").toLowerCase()==="post"){let F=document.createElement("form");F.method="POST",F.action=f.logout.href;let U=document.createElement("input");U.type="hidden",U.name="_token",U.value=document.body.dataset.csrf??"";let oe=A("button","le-btn-ghost","Log out");oe.type="submit",F.append(U,oe),b.append(F)}else{let F=A("a","le-btn-ghost","Log out");F.href=f.logout.href,b.append(F)}let ee=A("div","le-drawer");ee.setAttribute("role","dialog"),ee.setAttribute("aria-modal","true"),ee.setAttribute("aria-label","Edit content");let Se=A("div","le-drawer-head"),De=A("div","le-tabs");De.setAttribute("role","tablist");let qe={};["Edit","Changes","History"].forEach(F=>{let U=A("button","le-tab",F);U.type="button",U.dataset.tab=F,U.setAttribute("role","tab"),F==="Edit"&&U.classList.add("is-on"),qe[F]=U,De.append(U)});let Ce=A("button","le-close","\xD7");Ce.type="button",Ce.setAttribute("aria-label","Close"),Se.append(De,Ce);let Me=A("div","le-subject"),Qe=A("div","le-trail"),Ze=A("div","le-title","Text");Me.append(A("div","le-eyebrow","Selected"),Qe,Ze);let Ae=A("div","le-fields"),Ue=A("div","le-foot"),Le=A("button","le-btn-danger le-start le-hidden","Delete");Le.type="button";let Te=A("button","le-btn-outline","Cancel");Te.type="button";let Ne=A("button","le-btn","Save changes");Ne.type="button",Ue.append(Le,Te,Ne),ee.append(Se,Me,Ae,Ue);let de=A("button","le-handle");de.type="button",de.setAttribute("aria-label","Edit this link"),de.innerHTML="&#9998;";let pe=A("button","le-handle le-handle-bg");pe.type="button",pe.setAttribute("aria-label","Replace this background image"),pe.title="Replace background image",pe.textContent="Replace background";let ye=A("div","le-hover"),_e=A("span","le-hover-label");return ye.append(_e),i.append(b,ee,de,pe,ye),{root:o,shadow:i,toolbar:b,toggleButton:j,undoButton:R,redoButton:k,pageSwitcher:_,languagePicker:K,statusText:I,dot:q,localeSelect:T,drawer:ee,drawerFoot:Ue,drawerTabs:qe,drawerSubject:Me,drawerTitle:Ze,drawerTrail:Qe,drawerFields:Ae,drawerDelete:Le,publishButton:ie,publishLabel:v,publishCount:we,previewButton:X,changesButton:ae,closeButton:Ce,cancelButton:Te,saveButton:Ne,linkHandle:de,bgHandle:pe,hoverBox:ye,hoverLabel:_e,toast:(F,U=1800)=>{let oe=A("div","le-toast",F);i.append(oe),setTimeout(()=>oe.style.opacity="0",U),setTimeout(()=>oe.remove(),U+600)},modal:({title:F,subtitle:U,size:oe="",dismissable:We=!0}={})=>{let ce=A("div","le-scrim"),V=A("div",`le-modal ${oe}`.trim());V.setAttribute("role","dialog"),V.setAttribute("aria-modal","true");let te=A("div","le-modal-heading"),et=A("div","le-modal-title",F??""),$e=A("div","le-modal-sub",U??"");$e.hidden=!U,te.append(et,$e),V.setAttribute("aria-label",F??"Dialog");let fe=A("button","le-close","\xD7");fe.type="button",fe.setAttribute("aria-label","Close");let tt=A("div","le-modal-head");tt.append(te,fe);let He=A("div","le-modal-tabs");He.hidden=!0;let nt=A("div","le-modal-body"),Ye=A("div","le-modal-foot");Ye.hidden=!0,V.append(tt,He,nt,Ye),ce.append(V);let yt=document.activeElement,Oe=!1,Ie=()=>{Oe||(Oe=!0,document.removeEventListener("keydown",ot,!0),ce.remove(),yt?.focus?.(),ue.dismissable=!0)},ot=Q=>{Q.key==="Escape"&&ue.dismissable&&(Q.stopPropagation(),Ie())},ue={dismissable:We};return fe.addEventListener("click",Ie),ce.addEventListener("mousedown",Q=>{Q.target===ce&&ue.dismissable&&Ie()}),document.addEventListener("keydown",ot,!0),i.append(ce),fe.focus(),{card:V,body:nt,foot:Ye,tabs:He,close:Ie,title:Q=>et.textContent=Q,subtitle:Q=>{$e.textContent=Q??"",$e.hidden=!Q},allowDismiss:Q=>{ue.dismissable=Q,fe.hidden=!Q}}}}}var dt=n=>Math.min(Math.max(Math.round(n),1),4e3),Bt=n=>{if(!n)return null;let o=Number(n.naturalWidth??0),i=Number(n.naturalHeight??0),r=n.getBoundingClientRect?.(),f=r&&r.width>=1&&r.height>=1?{width:dt(r.width),height:dt(r.height),exact:!1}:null;return o>=1&&i>=1&&(f===null||o>=r.width*2&&i>=r.height*2)?{width:dt(o),height:dt(i),exact:!0}:f},wn=(n,o)=>{let i=n.width,r=i/o;return r>n.height&&(r=n.height,i=r*o),{x:(n.width-i)/2,y:(n.height-r)/2,width:i,height:r}},yn=(n,o,i)=>{let r=i/(o||1);return{x:Math.max(0,Math.round(n.x*r)),y:Math.max(0,Math.round(n.y*r)),width:Math.max(1,Math.round(n.width*r)),height:Math.max(1,Math.round(n.height*r))}},vn=(n,o,i)=>{let r=(f,b)=>Math.max(0,Math.min(f,b));return{...n,x:r(n.x+o.x,i.width-n.width),y:r(n.y+o.y,i.height-n.height)}};var xn=n=>Object.entries(n??{}).filter(([,o])=>String(o??"")!==""),kn=n=>[...n??[]].filter(o=>o.value!==(o.dataset?.imgAttrWas??""));var zt="kb_verify",En=(n,o=globalThis)=>{try{o.sessionStorage?.setItem(zt,JSON.stringify(n))}catch{}},Sn=(n=globalThis)=>{try{let o=n.sessionStorage?.getItem(zt);return n.sessionStorage?.removeItem(zt),o?JSON.parse(o):null}catch{return null}},la=(n,o)=>!o?.attr||!o?.marker?null:n.querySelector(`[${o.attr}="${o.marker.replace(/"/g,'\\"')}"]`),da=(n,o)=>{if(!n)return null;if(o==="image"){let r=ca(n);return r?r.getAttribute("src"):null}if(o==="href")return n.getAttribute("href");if(o==="icon")return n.getAttribute("class")??"";let i=[...n.childNodes].filter(r=>r.nodeType===3).map(r=>r.textContent).join(" ").trim();return ge(i===""?n.textContent:i)},ca=n=>n.tagName?.toLowerCase()==="img"?n:n.querySelector("img")??n.parentElement?.querySelector("img")??null,ge=n=>String(n??"").replace(/\s+/g," ").trim(),pa=(n,o,i)=>{if(i===null)return!1;if(n==="image")return jt(i)!==""&&jt(i)===jt(o);if(n==="icon"){let r=ge(o).split(" ").filter(Boolean),f=ge(i).split(" ").filter(Boolean);return r.length>0&&r.every(b=>f.includes(b))}return n==="href"?ge(i)===ge(o)||ge(i).endsWith(ge(o)):ge(i)===ge(o)},jt=n=>String(n??"").split(/[?#]/)[0].split("/").filter(Boolean).pop()??"",Cn=(n,o)=>{if(!o?.kind)return null;let i=la(n,o);if(!i)return null;let r=da(i,o.kind);return{ok:pa(o.kind,o.value,r),wanted:o.value,saw:r,kind:o.kind}};ut();var xo="whole",za=()=>{let n=window.liveEditApi,o=!0;n?.base&&n?.site&&n?.token&&(o=null,fetch(`${String(n.base).replace(/\/$/,"")}/${n.site}/session`,{headers:{Accept:"application/json",Authorization:`Bearer ${n.token}`}}).then(r=>r.ok?r.json():null).then(r=>{o=r?.session?.valid?r.session.may_edit_locked===!0:!1}).catch(()=>{o=!1})),n?.base&&n?.site&&Promise.resolve().then(()=>(Yt(),Ht)).then(r=>r.ensureBackgroundsAreFound({base:n.base,site:n.site,key:n.token})).catch(r=>console.warn("[live-edit] could not look for backgrounds:",r.message)),window.liveEditContent||Promise.resolve().then(()=>(ft(),gt)).then(r=>r.defendContent(document)).catch(r=>console.warn("[live-edit] could not guard this page's content:",r.message));let i=document.querySelector("[data-login-modal]");if(i){let r=()=>{i.classList.remove("hidden"),i.classList.add("flex"),i.querySelector("input[type=email]")?.focus()},f=()=>{i.classList.add("hidden"),i.classList.remove("flex")};document.querySelectorAll("[data-login-open]").forEach(b=>{b.addEventListener("click",c=>{c.preventDefault(),r()})}),i.querySelector("[data-login-close]")?.addEventListener("click",f),i.addEventListener("click",b=>{b.target===i&&f()}),i.dataset.error==="1"&&r()}if(document.body.hasAttribute("data-admin")){let r=document.body.dataset.csrf,f=()=>{sessionStorage.setItem("tb_scroll",String(window.scrollY)),window.location.reload()},b=sessionStorage.getItem("tb_scroll");b!==null&&(sessionStorage.removeItem("tb_scroll"),window.scrollTo(0,Number(b)));let c=mn(),x=e=>c.toast(String(e??"").trim()||"Something went wrong.",9e3),C=sessionStorage.getItem("tb_toast");C&&(sessionStorage.removeItem("tb_toast"),c.toast(C));let q=()=>new Promise(e=>{if(!window.liveEditContent||window.liveEditContentDone){e(window.liveEditContentDone??null);return}let t=a=>e(a?.detail??null);document.addEventListener("live-edit:content",t,{once:!0}),setTimeout(()=>e(null),5e3)});q().then(e=>{let t=Sn();if(e?.failed){c.toast(t?"Saved \u2014 but this page could not load the latest content, so it may be showing an older version. Reload to try again.":"This page could not load your saved content, so it is showing the original. Nothing has been lost \u2014 reload to try again.",9e3);return}let a=t?Cn(document,t):null;a&&!a.ok&&(console.warn("[live-edit] the change was saved but the page still shows:",a.saw,`
  expected:`,a.wanted),c.toast("Saved \u2014 but this page is still showing the old version. Your change is stored; reload, and tell us if it stays this way.",9e3))});let I=e=>{sessionStorage.setItem("tb_toast",e),f()},z=(e,t=null,a=null)=>{let s=window.__liveEditReact;if(!s){I(e);return}let p=t!==null&&(s.apply??s.set)(t,a);c.toast(e),p||s.refresh()},{drawer:T,drawerTabs:H,drawerSubject:j,drawerTitle:$,drawerTrail:R,drawerFields:k,drawerDelete:_,toggleButton:K,statusText:ae,linkHandle:X,bgHandle:ie}=c,v=null,we=(e,t,a,s,p=!1)=>{let h=document.createElement("label");h.className="le-field",h.append(t);let d=e==="icon"?window.liveEditIcons:(window.liveEditSelects??{})[e],l=document.querySelector("[data-icon-templates]");if(e==="icon"&&Array.isArray(d)&&l){let u=document.createElement("input");u.type="hidden",u.name=e,u.value=a??"";let w=document.createElement("div");return w.className="le-icons",d.forEach(y=>{let m=document.createElement("button");m.type="button",m.title=y,m.dataset.iconChoice=y,m.className="le-icon"+(y===u.value?" is-active":"");let E=l.querySelector(`template[data-icon="${y}"]`);E?m.append(E.content.cloneNode(!0)):m.textContent=y,m.addEventListener("click",()=>{u.value=y,w.querySelectorAll("[data-icon-choice]").forEach(S=>{let L=S.dataset.iconChoice===y;S.className="le-icon"+(L?" is-active":"")}),u.dispatchEvent(new Event("input",{bubbles:!0}))}),w.append(m)}),h.append(u,w),h}if(Array.isArray(d)&&d.length<=6){let u=document.createElement("input");u.type="hidden",u.name=e,u.value=a??d[0];let w=document.createElement("div");return w.className="le-choices",d.forEach(y=>{let m=document.createElement("label");m.className="le-choice"+(y===u.value?" is-selected":"");let E=document.createElement("input");E.type="radio",E.name="le-choice-"+e,E.checked=y===u.value,E.addEventListener("change",()=>{u.value=y,w.querySelectorAll(".le-choice").forEach(S=>S.classList.remove("is-selected")),m.classList.add("is-selected"),u.dispatchEvent(new Event("input",{bubbles:!0}))}),m.append(E,document.createTextNode(y)),w.append(m)}),h.append(u,w),h}let g;if(Array.isArray(d)?(g=document.createElement("select"),d.forEach(u=>{let w=document.createElement("option");w.value=u,w.textContent=u,w.selected=u===a,g.append(w)})):(g=document.createElement("textarea"),g.rows=s,g.value=a??""),g.name=e,g.className="le-input",g.tagName==="TEXTAREA"){g.classList.add("le-prose");let u=()=>{g.style.height="auto",g.style.height=Math.min(g.scrollHeight+2,420)+"px"};g.addEventListener("input",u),requestAnimationFrame(u)}if(p&&g.tagName==="TEXTAREA"){let u=document.createElement("div");u.className="le-tools";let w=(E,S)=>{let L=g.selectionStart,N=g.selectionEnd,B=g.value.slice(L,N)||"text";g.setRangeText(E+B+S,L,N,"select"),g.dispatchEvent(new Event("input",{bubbles:!0})),g.focus()},y=(E,S,L,N="")=>{let B=document.createElement("button");return B.type="button",B.title=S,B.textContent=E,B.className="le-tool "+N,B.addEventListener("click",L),B};u.append(y("B","Bold",()=>w("**","**"),"is-bold"),y("I","Italic",()=>w("*","*"),"is-italic"),y("Link","Insert link",()=>{let E=window.prompt("Link URL (https://\u2026 or /page):");if(!E)return;let S=g.selectionStart,L=g.selectionEnd,N=g.value.slice(S,L)||"link text";g.setRangeText("["+N+"]("+E+")",S,L,"select"),g.dispatchEvent(new Event("input",{bubbles:!0})),g.focus()}));let m=document.createElement("span");m.className="le-hint",m.textContent="**bold** \xB7 *italic* \xB7 [text](url)",u.append(m),h.append(u)}return h.append(g),h},ee=e=>{let t=e.tagName;if(e.dataset.editRegion)return e.dataset.editRegion;if(t==="IMG")return"Image";if(t==="BUTTON")return"Button";if(t==="A")return/\b(btn|button)\b/i.test(String(e.className))?"Button":"Link";if(/^H[1-6]$/.test(t))return"Heading";if(t==="P")return"Paragraph";if(t==="LI")return"List item";if(t==="UL"||t==="OL")return"List";if(t==="NAV")return"Menu";if(t==="HEADER")return"Header";if(t==="FOOTER")return"Footer";if(t==="FORM")return"Form";if(e.hasAttribute("data-edit-item"))return"Card";if(e.hasAttribute("data-edit-icon"))return"Icon";if(e.hasAttribute("data-edit-svg"))return"Drawing";if(e.hasAttribute("data-edit"))return"Text";if(e.hasAttribute("data-has-bg")||e.hasAttribute("data-edit-bg"))return"Background";if(t==="SECTION"||t==="MAIN"||t==="ARTICLE")return"Section";let a=e.getBoundingClientRect();return a.width>window.innerWidth*.6&&a.height>180?"Section":"Group"},Se=({hint:e="PNG, JPG or WEBP, or drag one here",onFile:t}={})=>{let a=document.createElement("label");a.className="le-upload";let s=document.createElement("div");s.className="le-upload-inner";let p=document.createElement("span");p.className="le-upload-icon",p.textContent="\u2191";let h=document.createElement("span");h.className="le-upload-text";let d=document.createElement("span");d.className="le-upload-title",d.textContent="Upload from your computer";let l=document.createElement("span");l.className="le-upload-hint",l.textContent=e,h.append(d,l);let g=document.createElement("span");g.className="le-upload-btn",g.textContent="Choose file",s.append(p,h,g);let u=document.createElement("input");u.type="file",u.accept="image/*";let w=y=>{y&&(l.textContent=y.name,t?.(y))};return u.addEventListener("change",()=>w(u.files[0])),["dragenter","dragover"].forEach(y=>a.addEventListener(y,m=>{m.preventDefault(),a.classList.add("is-dragover")})),["dragleave","drop"].forEach(y=>a.addEventListener(y,m=>{m.preventDefault(),a.classList.remove("is-dragover")})),a.addEventListener("drop",y=>{let m=y.dataTransfer?.files?.[0];if(!m)return;let E=new DataTransfer;E.items.add(m),u.files=E.files,w(m)}),a.append(s,u),a},De=e=>{let t=String(e).match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);return!t||t[4]!==void 0&&Number(t[4])===0?"":"#"+[1,2,3].map(a=>Number(t[a]).toString(16).padStart(2,"0")).join("")},qe=e=>Ft(e),Ce={background:"Background colour",backgroundImage:"Background image",textColor:"Text colour",fontSize:"Text size",paddingY:"Space above and below",paddingX:"Space left and right",radius:"Corner rounding"},Me=(e,t,a,s)=>{let p=document.createElement("label");p.className="le-field";let h=e.replace(/([A-Z])/g," $1").toLowerCase(),d=Ce[e]??h.charAt(0).toUpperCase()+h.slice(1);if(p.append(d),t==="toggle"){let l=document.createElement("div");l.className="le-row";let g=document.createElement("input");g.type="checkbox",g.checked=a==="1",g.dataset.styleProp=e;let u=document.createElement("span");u.className="le-hint",u.textContent="Hidden from visitors. You still see it, dimmed, while editing.",l.append(g,u);let w=s?ee(s).toLowerCase():"section";return p.replaceChildren(`Hide this ${w}`,l),p.className="le-field le-divided",p}if(t==="color"){let l=document.createElement("div");l.className="le-row";let g=document.createElement("input");g.type="color";let u=s?De(getComputedStyle(s)[e==="textColor"?"color":"backgroundColor"]):"";g.value=a||u||"#ffffff",g.dataset.styleProp=e,g.className="le-color";let w=document.createElement("label");w.className="le-default";let y=document.createElement("input");y.type="checkbox",y.checked=!a,g.addEventListener("input",()=>y.checked=!1),w.append(y,"Use default"),l.append(g,w),p.append(l)}else if(t==="url"){let l=document.createElement("input");l.type="text",l.value=a??"",l.placeholder="Paste an image URL, or upload below",l.dataset.styleProp=e,l.className="le-input";let g=document.createElement("img");g.className="le-thumb",g.alt="";let u=N=>{g.src=N||"",g.style.display=N?"":"none"},w=a?"":qe(s),y=document.createElement("span");y.className="le-hint";let m=(N,B)=>{y.textContent=N?B?"Current image (from the theme) \u2014 upload or paste a link to replace it":"Replacing with this image":"No image set",y.title=N||""};u(a||w),m(a||w,!a&&!!w),l.addEventListener("input",()=>{let N=l.value.trim();u(N||w),m(N||w,!N&&!!w)});let E=Se({onFile:async N=>{u(URL.createObjectURL(N));let B=new FormData;B.append("file",N);try{let M=await(await D("/live-edit/upload",{method:"POST",body:B})).json();l.value=M.url,u(M.url),m(M.url,!1),l.dispatchEvent(new Event("input",{bubbles:!0}))}catch(G){x(V(G,"save that"))}}}),S=O("div","le-ways"),L=O("button","le-btn le-wide","Replace background");L.type="button",L.addEventListener("click",()=>an(s,async N=>{let{url:B,file:G,credit:M}=N,P=B;if(G){u(URL.createObjectURL(G));let W=new FormData;W.append("file",G);try{P=(await(await D("/live-edit/upload",{method:"POST",body:W})).json()).url}catch(J){c.toast(V(J,"save that"));return}}P&&(l.value=P,u(P),m(P,!1),l.dispatchEvent(new Event("input",{bubbles:!0})),l.dataset.kbCreditFor=P,l.dataset.kbCredit=JSON.stringify({credit:M??"",creditBy:N.creditBy??"",creditUrl:N.creditUrl??"",creditSource:N.creditSource??"",creditSourceUrl:N.creditSourceUrl??""}),M&&c.toast(M,4e3))},"Free photos","background")),S.append(L),l.hidden=!0,E.hidden=!0,p.append(S,l,E,g,y)}else{let l=document.createElement("input");l.type="number",l.min=0,l.max=400,l.value=a??"",l.placeholder="default",l.dataset.styleProp=e,l.className="le-input",p.append(l)}return p},Qe={background:"color",backgroundImage:"url",textColor:"color",fontSize:"px",paddingX:"px",paddingY:"px",radius:"px",hidden:"toggle"},Ze=(e,t,a)=>{v.styleKey=e;let s=(window.liveEditStyles??{})[e]??{},p=document.createElement("div");p.className="le-section-heading",p.textContent="Style",k.append(p);let h=0;if((a?qn(a,t):t).forEach(d=>{let l=(window.liveEditStyleProps??{})[d]??Qe[d];l&&(k.append(Me(d,l,s[d],a)),h++)}),h===0){let d=document.createElement("div");d.className="le-hint",d.textContent="Nothing on this element can be restyled.",k.append(d)}},Ae=document.createElement("style");document.head.append(Ae);let Ue=(e,t)=>{let a=`[data-style="${e}"]`,s="",p="";for(let[h,d]of Object.entries(t))d&&(s+={hidden:"opacity:.45 !important;",backgroundImage:`background-image:url('${d}') !important;background-size:cover !important;background-position:center !important;`,background:`background:${d} !important;`,textColor:`color:${d} !important;`,fontSize:`font-size:${d}px !important;`,radius:`border-radius:${d}px !important;`,paddingX:`padding-left:${d}px !important;padding-right:${d}px !important;`,paddingY:`padding-top:${d}px !important;padding-bottom:${d}px !important;`}[h]??"",h==="paddingY"&&(p+=`section${a}>div{padding-top:0 !important;padding-bottom:0 !important}`));return s?p+`${a}{${s}}`:p},Le=()=>{if(!v?.styleKey)return;let e=Ne(),t=v.styleKey,a=Ue(t,e),s=zn,p=(window.liveEditStyles??{})[t]??{};for(let[h,d]of Object.entries(e))Rn(h,d,p)&&(h==="hidden"&&(a+=`body.editing [data-style="${t}"]{opacity:1 !important}`),s[h]&&(a+=`[data-style="${t}"]{${s[h]}:revert-layer !important}`),h==="paddingY"&&(a+=`[data-style="${t}"]{padding-top:revert-layer !important;padding-bottom:revert-layer !important}section[data-style="${t}"]>div{padding-top:revert-layer !important;padding-bottom:revert-layer !important}`),h==="paddingX"&&(a+=`[data-style="${t}"]{padding-left:revert-layer !important;padding-right:revert-layer !important}`));Ae.textContent=a},Te=()=>{Ae.textContent=""};k.addEventListener("input",()=>{v&&(v.dirty=!0),Le()}),k.addEventListener("change",()=>{v&&(v.dirty=!0),Le()});let Ne=()=>{let e={};return k.querySelectorAll("[data-style-prop]").forEach(t=>{if(t.type==="checkbox")e[t.dataset.styleProp]=t.checked?"1":"";else if(t.type==="color"){let a=t.closest("div").querySelector("input[type=checkbox]").checked;e[t.dataset.styleProp]=a?"":t.value}else e[t.dataset.styleProp]=t.value;if(t.dataset.kbCredit&&t.dataset.kbCreditFor===t.value)try{Object.assign(e,JSON.parse(t.dataset.kbCredit))}catch{}}),e},de=null,pe=()=>{!de||!v||v.dirty||!T.classList.contains("is-open")||We!=="Edit"||de.isConnected&&_e(de)},ye=e=>e.dataset.editRegion?e.dataset.editRegion:e.dataset.editLabel?e.dataset.editLabel:e.querySelector(":scope > [data-style-edit]")?.dataset.editLabel??ee(e),_e=e=>{if(de=e,e.dataset.editImg!==void 0)At(e);else if(e.dataset.edit!==void 0)at(e);else if(e.dataset.svgEdit!==void 0||e.dataset.editSvg!==void 0)sn(e);else if(e.dataset.editHref!==void 0)Et(e);else if(e.dataset.style!==void 0){let t=e.querySelector(":scope > [data-style-edit]");Ct(t??e)}},mt=()=>new Promise(e=>{let t=c.modal({title:"Discard what you typed?",subtitle:"Your changes to this element have not been saved.",size:"is-narrow"}),a=!1,s=d=>{a||(a=!0,t.close(),e(d))},p=O("button","le-btn-outline","Keep editing");p.type="button",p.addEventListener("click",()=>s(!1));let h=O("button","le-btn-danger","Discard");h.type="button",h.addEventListener("click",()=>s(!0)),t.foot.hidden=!1,t.foot.append(p,h),p.focus(),t.card.querySelector(".le-close")?.addEventListener("click",()=>s(!1)),t.card.parentElement?.addEventListener("mousedown",d=>{d.target===t.card.parentElement&&s(!1)}),document.addEventListener("keydown",function d(l){l.key==="Escape"&&(document.removeEventListener("keydown",d,!0),s(!1))},!0)}),wt=e=>{if(!v?.dirty){e();return}mt().then(t=>{t&&e()})},F=e=>wt(()=>{Te(),_e(e)}),U=null,oe=e=>{let t=U;U=e??null;let a=[],s=e?.parentElement;for(;s&&s!==document.body;)s.dataset&&(s.dataset.edit!==void 0||s.dataset.style!==void 0)&&a.unshift(s),s=s.parentElement;let p=[];a.forEach(d=>{let l=ye(d);if(p.length&&p[p.length-1].label===l){p[p.length-1].node=d;return}p.push({node:d,label:l})});let h=p.slice(-3);t&&t!==e&&document.contains(t)&&!h.some(d=>d.node===t)&&h.unshift({node:t,label:`\u2190 ${ye(t)}`}),R.replaceChildren(),R.classList.toggle("is-visible",h.length>0),h.forEach((d,l)=>{let g=d.node;l>0&&R.append("\u203A");let u=document.createElement("button");u.type="button",u.textContent=d.label,u.className="le-crumb",u.addEventListener("click",()=>F(g)),R.append(u)})},We="Edit",ce=e=>{We=e,Object.entries(H).forEach(([t,a])=>{a.classList.toggle("is-on",t===e),a.setAttribute("aria-selected",t===e?"true":"false")}),j.classList.toggle("le-hidden",e!=="Edit"),c.drawerFoot.classList.toggle("le-hidden",e!=="Edit"),e==="Changes"&&ot(),e==="History"&&So()};Object.entries(H).forEach(([e,t])=>{t.addEventListener("click",()=>{if(e==="Edit"){ce(e);return}wt(()=>ce(e)),T.classList.contains("is-open")||xt()})});let V=(e,t)=>{console.warn(`[live-edit] ${t}:`,e);let a=String(e?.message??"");return/failed to fetch|networkerror|load failed/i.test(a)?"No connection just now. Nothing has been lost; try again in a moment.":/\b401\b|\b403\b|unauthor|forbidden/i.test(a)?"Your editing session has expired. Reload the page to carry on.":/\b429\b|too many/i.test(a)?"That was a lot at once. Give it a few seconds and try again.":`Could not ${t}. Nothing has been lost; try again in a moment.`},te=null,et=async()=>{if(window.liveEditApi)try{te=await(await D("/live-edit/credits",{method:"GET"})).json(),pe()}catch(e){console.warn("[live-edit] could not read the credit balance:",e),te=null}},$e=async()=>{if(!(window.liveEditStyleProps&&window.liveEditStyles)&&window.liveEditApi)try{let t=await(await D("/live-edit/content",{method:"GET"})).json();t?.styleProps&&(window.liveEditStyleProps=t.styleProps),t?.styles&&(window.liveEditStyles=t.styles),pe()}catch(e){console.warn("[live-edit] could not read what this site allows to be styled:",e)}},fe=(e,t)=>{if(!te?.available||!t)return;let a=document.createElement("div");a.className="le-assist-head",a.append(He("AI assist"),tt()),k.append(a),[["rewrite","Rewrite"],["shorten","Shorten"]].forEach(([s,p])=>{let h=te.costs?.[s]??1,d=document.createElement("button");d.type="button",d.className="le-assist";let l=document.createElement("span");l.textContent=p;let g=document.createElement("span");g.className="le-assist-cost",g.textContent=`${h} credit${h===1?"":"s"}`,d.append(l,g),(te.balance??0)<h&&(d.disabled=!0,g.classList.add("is-short"),d.title="Not enough credits"),d.addEventListener("click",()=>void yt(s,p,e,t,d,l)),k.append(d)})},tt=()=>{let e=document.createElement("span");return e.className="le-assist-balance",e.textContent=`${te?.balance??0} credits left`,e},He=e=>{let t=document.createElement("div");return t.className="le-section-heading",t.textContent=e,t},nt=()=>(document.querySelector('meta[property="og:site_name"]')?.content??document.querySelector('meta[name="application-name"]')?.content??(document.title??"").split(/\s+[|\u2013\u2014-]\s+/).pop()??"").replace(/\s+/g," ").trim().slice(0,120),Ye=()=>(document.querySelector('meta[name="description"]')?.content??document.querySelector('meta[property="og:description"]')?.content??"").replace(/\s+/g," ").trim().slice(0,400),yt=async(e,t,a,s,p,h)=>{p.disabled=!0,h.textContent="Thinking\u2026";let d;try{d=await(await D("/live-edit/assist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:e,text:s.value,heading:Oe(a),role:ee(a),page:window.location.pathname,site:nt(),about:Ye()})})).json()}catch(l){p.disabled=!1,h.textContent=t,c.toast(V(l,"rewrite that"));return}if(typeof d?.balance=="number"&&te&&(te.balance=d.balance),!d?.text){p.disabled=!1,h.textContent=t,c.toast(Ie(d?.reason));return}s.value=d.text,s.dispatchEvent(new Event("input",{bubbles:!0})),s.focus(),p.disabled=!1,h.textContent=t,c.toast(`Rewritten. ${d.balance} credits left.`)},Oe=e=>(((e.closest("section, article, header, div[data-style]")??document.body).querySelector("h1, h2, h3")??document.querySelector("h1"))?.textContent??"").replace(/\s+/g," ").trim().slice(0,200),Ie=e=>({not_enough_credits:"Not enough credits for that. You can buy more from your account.",no_suggestion:"No suggestion for this one. Your words are unchanged.",not_configured:"Rewriting is not switched on for this site yet.",nothing_to_work_with:"There are no words here to rewrite yet."})[e]??"Could not rewrite that just now. Your words are unchanged.",ot=async()=>{k.replaceChildren(ne("Loading\u2026"));let e;try{e=await(await D("/live-edit/changes",{method:"GET"})).json()}catch(a){k.replaceChildren(ne(V(a,"show your changes")));return}let t=e?.changes??[];if(t.length===0){k.replaceChildren(ne("No unpublished changes."));return}k.replaceChildren(),t.forEach(a=>{let s=document.createElement("div");s.className="le-change";let p=document.createElement("div");p.className="le-row le-change-head";let h=document.createElement("span");h.className="le-change-label",h.textContent=vt(a);let d=document.createElement("button");if(d.type="button",d.className="le-chip-btn",d.textContent="Revert",d.addEventListener("click",()=>void Eo(a,d)),p.append(h,d),s.append(p),Q(a)){s.append(ko(a)),k.append(s);return}if(a.before){let g=document.createElement("p");g.className="le-change-before",g.textContent=ue(a.before),s.append(g)}let l=document.createElement("p");l.className="le-change-after",l.textContent=Xt(a)||"(empty)",s.append(l),k.append(s)})},ue=e=>{let t=String(e??"").replace(/\s+/g," ").trim();return t.length>70?`${t.slice(0,70)}\u2026`:t},Q=e=>e.kind==="style"?!1:document.querySelector(`[data-edit-img="setting:${CSS.escape(e.key)}"]`)?!0:pt(e.after)||pt(e.before),ko=e=>{let t=document.createElement("div");t.className="le-change-pictures";let a=(s,p,h)=>{let d=document.createElement("figure");d.className=h;let l=document.createElement("figcaption");if(l.textContent=p,d.append(l),pt(s)){let u=document.createElement("img");return u.src=s,u.alt="",u.loading="lazy",u.addEventListener("error",()=>{u.remove();let w=document.createElement("span");w.className="le-change-missing",w.textContent="Cannot be shown",d.append(w)},{once:!0}),d.append(u),d}let g=document.createElement("span");return g.className="le-change-missing",g.textContent=String(s??"").trim()===""?"No picture":ue(s),d.append(g),d};return e.before&&t.append(a(e.before,"Was","le-change-shot is-before")),t.append(a(e.after,"Now","le-change-shot is-after")),t},Gt=e=>document.querySelector(`[data-edit="setting:${CSS.escape(e.key)}"], [data-edit-img="setting:${CSS.escape(e.key)}"], [data-style="${CSS.escape(e.key)}"]`),vt=e=>{let t=Gt(e);return t?ee(t):e.kind==="style"?"Styling":Q(e)?"Picture":"Text"},Xt=e=>{let t=ue(e.after),a=Gt(e);return!a||e.kind==="style"||Q(e)?t:Dt(a).length>0&&ue(a.textContent)||t},Eo=async(e,t)=>{t.disabled=!0,t.textContent="Reverting\u2026";try{await D("/live-edit/changes",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:e.key,kind:e.kind})})}catch(a){t.disabled=!1,t.textContent="Revert",c.toast(V(a,"put that back"));return}I("Reverted \u2713")},Qt=()=>{let e=window.liveEditApi?.engine;if(!e)return null;let t=O("p","le-hint");return t.textContent=`Live Edit ${e}`,t.title="Quote this if you report a problem",t},So=async()=>{k.replaceChildren(ne("Loading\u2026"));let e;try{e=await(await D("/live-edit/versions",{method:"GET"})).json()}catch(s){k.replaceChildren(ne(V(s,"show what has been published")));return}let t=e?.versions??[];if(t.length===0){k.replaceChildren(ne("Nothing published yet. Your first publish will appear here."));let s=Qt();s&&k.append(s);return}k.replaceChildren(),t.forEach((s,p)=>{let h=document.createElement("div");h.className="le-version";let d=document.createElement("span");d.className=p===0?"le-version-dot is-latest":"le-version-dot";let l=document.createElement("div"),g=document.createElement("p");g.className="le-change-after",g.textContent=s.restored_from?`Restored version ${s.restored_from}`:`Published ${s.changes??0} change${s.changes===1?"":"s"}`;let u=document.createElement("p");u.className="le-change-when",u.textContent=Co(s.published_at),l.append(g,u),h.append(d,l),k.append(h)});let a=Qt();a&&k.append(a)},ne=e=>{let t=document.createElement("p");return t.className="le-hint",t.textContent=e,t},Co=e=>{if(!e)return"";let t=Math.round((Date.now()-new Date(e).getTime())/1e3);return t<90?"Just now":t<3600?`${Math.round(t/60)} minutes ago`:t<86400?`${Math.round(t/3600)} hours ago`:t<86400*8?`${Math.round(t/86400)} days ago`:new Date(e).toLocaleDateString()},xt=()=>{Ve(),$t(),T.classList.add("is-open"),c.toolbar.classList.add("is-compact"),We==="Edit"&&k.querySelector("textarea, input:not([type=checkbox]), select")?.focus()},be=(e=!1)=>{if(!e&&v?.dirty){mt().then(t=>{t&&be(!0)});return}v?.restore?.(),Te(),T.classList.remove("is-open"),c.toolbar.classList.remove("is-compact"),v=null},Ao=()=>[...document.querySelectorAll("[data-edit], [data-edit-img], [data-edit-bg], [data-edit-href], [data-edit-icon], [data-edit-svg]")].filter(e=>o===!0||!e.closest("[data-live-lock]")),kt=async(e,t=0)=>{try{if(e.cssRules){let a=[];for(let s of e.cssRules)s.styleSheet&&t<4?a.push(await kt(s.styleSheet,t+1)):a.push(s.cssText);return a.join("")}}catch{}if(!e.href)return"";try{let a=await fetch(e.href);if(!a.ok)return"";let s=await a.text();if(t>=4)return s;let p=[...s.matchAll(/@import\s+(?:url\(\s*(["']?)([^"')]+)\1\s*\)|(["'])([^"']+)\3)/gi)].map(d=>d[2]||d[4]).filter(Boolean),h=await Promise.all(p.map(d=>kt({href:new URL(d,e.href).href},t+1)));return s+h.join("")}catch{return""}},Lo=null,To=async()=>{let e=new Map;return(await Promise.all([...document.styleSheets].map(a=>kt(a)))).forEach(a=>$n(a).forEach(s=>e.set(s.name,s.glyph))),[...e].map(([a,s])=>({name:a,glyph:s})).sort((a,s)=>a.name.localeCompare(s.name))},Zt=()=>Lo??(Lo=To()),en=()=>{document.querySelectorAll("[data-style]").forEach(e=>{if(e.hasAttribute("data-edit-bg"))return;let a=(getComputedStyle(e).backgroundImage||"").match(/url\((['"]?)(.*?)\1\)/),s=e.getBoundingClientRect(),p=a&&!a[2].startsWith("data:")&&s.width>=120&&s.height>=120;e.toggleAttribute("data-has-bg",!!p&&(o===!0||!e.closest("[data-live-lock]")))})},No=()=>{document.querySelectorAll("[data-edit-icon]").forEach(e=>{let t=getComputedStyle(e,"::before").content;(t==="none"||t==="normal"||t==='""'||t==="")&&e.removeAttribute("data-edit-icon")})},Pe=e=>{e&&No(),document.body.classList.toggle("editing",e),Ao().forEach(t=>{e?t.setAttribute("tabindex","0"):t.removeAttribute("tabindex")}),sessionStorage.setItem("tb_editing",e?"1":"0"),ae.textContent=e?"Click any outlined text or image":"",ae.parentElement?.classList.toggle("is-saying",e),!e&&typeof Ve=="function"&&Ve(),c.toolbar.classList.toggle("is-editing",e),K.textContent=e?"Done editing":"Edit site",e?(en(),document.querySelector("[data-edit-icon]")&&Zt(),n?.base&&n?.site&&Promise.resolve().then(()=>(Yt(),Ht)).then(t=>t.refreshBackgrounds({base:n.base,site:n.site,key:n.token})).then(t=>{t&&en()}).catch(t=>console.warn("[live-edit] could not look again for backgrounds:",t.message))):($t(),ke()),e||be(!0)},$o=async()=>{let e=window.liveEditApi,t=await Promise.resolve().then(()=>(yo(),wo)).catch(()=>null),a=t?.currentSession?.(window)??null;if(t?.forget(window),!a)return;if(!e||!t){window.location.reload();return}let s=window.prompt("Your editing session has ended. Enter your email address and we will send you a new link.");s&&(await t.requestLink(e,s,window).catch(()=>{}),x("If that address can edit this site, a link is on its way.")),window.location.reload()},D=async(e,t)=>{let a=window.liveEditApi,s=a?Bn(e,t,a):null,p=s?s.init:Tn(r,t),h=typeof FormData<"u"&&p.body instanceof FormData,d={...p,signal:p.signal??Ge(h?3e4*4:3e4)},l;try{l=await fetch(s?s.url:e,d)}catch(g){throw Ln(g)?new Error("That is taking too long. Your change is still here \u2014 check your connection and press Save again."):g}if(l.status===419||l.status===401)throw await $o(),new Error("Your editing session has ended.");if(!l.ok){let g=await l.json().catch(()=>({}));throw new Error(g.error?.message??g.message??"Could not save. Try again.")}if(!Nn(l))throw new Error("That did not save. Reload the page and try again.");return l},Oo=(e,t)=>{if(!e?.element)return null;let a=s=>{let p=e.element.getAttribute(s);return p===null?null:{attr:s,marker:p}};if(e.kind==="image"){let s=t.querySelector("input[type=url]")?.value.trim(),p=t.querySelector("input[type=file]")?.files?.[0],h=a("data-edit-img")??a("data-edit-bg");return s&&h?{...h,kind:"image",value:s}:null}if(e.kind==="icon"){let s=a("data-edit-icon");return s&&e.value?{...s,kind:"icon",value:e.value}:null}if(e.kind==="setting"&&typeof e.savedValue=="string"){let s=a("data-edit");return!s||/<[a-z][\s\S]*>/i.test(e.savedValue)||e.element.hasAttribute("data-edit-attr")?null:{...s,kind:"text",value:e.savedValue}}return null},Io=async e=>{let t=window.liveEditApi?.builderUrl;if(!t||e?.kind!=="setting"||typeof e.savedValue!="string"||!e.element)return;let a=e.element.closest(".elementor-element[data-id]");if(a)try{await fetch(t,{method:"POST",headers:{"Content-Type":"application/json",...window.liveEditApi?.publishHeaders??{}},body:JSON.stringify({page:window.location.href,element:a.dataset.id,value:e.savedValue})})}catch(s){console.warn("[live-edit] could not tell the page builder about this change:",s.message)}},Po=async()=>{if(!v)return;let e=c.saveButton;e.disabled=!0,e.textContent="Saving\u2026";let t=()=>{e.disabled=!1,e.textContent="Save changes"};try{if(v.kind==="setting"){let a=v.value??k.querySelector("textarea, input[name=icon]")?.value??"";if(typeof v.openedWith=="string"&&a===v.openedWith){t(),be();return}await D("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:v.key,value:v.savedValue=v.value??k.querySelector("textarea, input[name=icon]")?.value??"",locale:window.liveEditLocale})})}else if(v.kind==="record"){let a={};k.querySelectorAll("textarea, select, input[type=hidden][name]").forEach(s=>a[s.name]=s.value),await D("/live-edit/record",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:v.type,id:v.id,fields:a})})}else if(v.kind==="icon")await D("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:v.key,value:v.value})});else if(v.kind==="image"){let a=new FormData;a.append("target",v.target);let s=k.querySelector("input[type=file]").files[0],p=k.querySelector("input[type=url]").value.trim(),h=v.crop===xo,d=h?null:Bt(v.element);d&&(a.append("fitWidth",String(d.width)),a.append("fitHeight",String(d.height)),d.exact&&a.append("fitExact","1")),v.crop&&!h&&(a.append("cropX",String(v.crop.x)),a.append("cropY",String(v.crop.y)),a.append("cropWidth",String(v.crop.width)),a.append("cropHeight",String(v.crop.height)));let l=s!==void 0||p!==""&&p!==void 0;v.credit&&v.creditFor===v.target&&l&&xn(v.credit).forEach(([w,y])=>a.append(w,y));let g=[...k.querySelectorAll("[data-img-attr]")],u=kn(g);if(window.liveEditLocale&&a.append("locale",window.liveEditLocale),s?a.append("file",s):p&&a.append("url",p.startsWith("http")?p:`https://${p}`),u.forEach(w=>a.append(w.dataset.imgAttr,w.value)),!s&&!p&&u.length===0){t(),x(g.length>0?"Nothing has changed yet. Choose a picture, or edit the description.":"Choose a file from your computer or paste an image URL first.");return}await D("/live-edit/image",{method:"POST",body:a})}if(v.hrefKey){let a=k.querySelector("[data-link-field=href]").value.trim(),s=k.querySelector("[data-link-field=target]").checked;await D("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:v.hrefKey,value:a})}),v.targetKey&&await D("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:v.targetKey,value:s?"_blank":""})})}v.styleKey&&await D("/live-edit/style",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:v.styleKey,props:Ne()})}),await Io(v),En(Oo(v,k)),z("Saved \u2713",v.key??null,v.savedValue??null)}catch(a){t(),x(a.message)}finally{t()}};et(),$e();let O=(e,t,a)=>{let s=document.createElement(e);return t&&(s.className=t),a!=null&&(s.textContent=a),s},tn=e=>{let t=e.closest("section, article, header, div[data-style]");for(;t&&!t.querySelector("h1, h2, h3");)t=t.parentElement?.closest("section, article, header, div[data-style]")??null;let a=t?.querySelector("h1, h2, h3");return!t||!a?"":[...t.querySelectorAll("p, span, div, h4, h5, h6")].filter(p=>p.children.length===0).filter(p=>a.compareDocumentPosition(p)&Node.DOCUMENT_POSITION_PRECEDING).map(p=>(p.textContent??"").replace(/\s+/g," ").trim()).find(p=>p.length>3&&p.length<42)??""},Bo=/^(the|and|with|for|your|our|from|that|this|they|them|will|have|more|about|into|just|than|then|when|what|where|very|been|here|there)$/,nn=e=>{let t=new Set((document.title??"").toLowerCase().split(/[^a-z0-9]+/i).filter(Boolean));return(e??"").toLowerCase().split(/[^a-z0-9]+/i).filter(a=>a.length>3&&!Bo.test(a)&&!t.has(a))},jo=e=>{let t=nn(tn(e)).slice(0,3);if(t.length>0)return t.join(" ");let a=nn(Oe(e)).slice(0,3);return a.length>0?a.join(" "):"workplace"},on=e=>{let t=jo(e),a=(e.dataset.editLabel??"").toLowerCase().trim(),s=/hero|banner|header|cover/.test(a);return[...new Set([t,s?`${t} wide`:`${t} close up`,"workplace"].filter(Boolean))].slice(0,4)},zo=e=>`${(tn(e)||Oe(e)||"This page").replace(/[.\s]+$/,"")}. Photographic, natural daylight, calm and editorial, soft neutral tones to match the rest of the site. No text.`,an=(e,t,a="Free photos",s="image")=>{let p=c.modal({title:`Replace ${s}`,subtitle:e.dataset.editLabel??ee(e)}),h=document.createElement("div");p.body.append(h),p.tabs.hidden=!1;let d=w=>{p.close(),t(w)},l={Upload:()=>Ro(h,d),"Free photos":()=>void Fo(h,e,d),"Generate with AI":()=>qo(h,e,d)},g=Object.keys(l).map(w=>{let y=document.createElement("button");return y.type="button",y.className="le-modal-tab",y.textContent=w,y.addEventListener("click",()=>u(w)),p.tabs.append(y),[w,y]}),u=w=>{g.forEach(([y,m])=>m.classList.toggle("is-on",y===w)),h.replaceChildren(),l[w]()};return u(l[a]?a:"Free photos"),p},Ro=(e,t)=>{e.append(Se({hint:"PNG, JPG or WEBP, or drag one here",onFile:l=>t({file:l})}));let a=O("div","le-row-tight"),s=document.createElement("input");s.type="url",s.className="le-search",s.placeholder="Or paste a link to a picture";let p=O("button","le-btn-outline","Use it");p.type="button";let h=()=>{let l=s.value.trim();l&&t({url:l.startsWith("http")?l:`https://${l}`})};p.addEventListener("click",h),s.addEventListener("keydown",l=>{l.key==="Enter"&&(l.preventDefault(),h())}),a.append(s,p),e.append(a);let d=O("p","le-hint","You can also drag a picture straight onto the image on the page.");d.style.marginTop="14px",e.append(d)},Fo=async(e,t,a)=>{let s=document.createElement("input");s.type="search",s.className="le-search",s.placeholder="Search free photographs";let p=document.createElement("div");p.className="le-chips";let h=document.createElement("div");h.className="le-grid";let d=document.createElement("p");d.className="le-hint",d.style.marginTop="16px",e.append(s,p,h,d);let l=()=>{h.replaceChildren();for(let u=0;u<6;u+=1)h.append(O("div","le-shimmer"))},g=async u=>{s.value=u,l();let w;try{w=await(await D(`/live-edit/photos?q=${encodeURIComponent(u)}`,{method:"GET"})).json()}catch(m){h.replaceChildren(ne(V(m,"look for photographs")));return}let y=w?.photos??[];if(d.textContent=w?.source==="openverse"?"Free to use, including commercially. The photographer is credited automatically.":"Free to use under the Unsplash licence. The photographer is credited automatically.",y.length===0){h.replaceChildren(ne(Do(w?.reason,u)));return}h.replaceChildren(),y.forEach(m=>{let E=document.createElement("button");E.type="button",E.className="le-pick";let S=document.createElement("img");S.className="le-pick-shot",S.src=m.thumb??m.full,S.alt=m.alt??"",S.loading="lazy";let L=O("span","le-pick-by",m.by?`Photo by ${m.by}`:"");E.append(S,L),E.addEventListener("click",()=>{m.downloadLocation&&D("/live-edit/photos/used",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({download_location:m.downloadLocation})}).catch(()=>{}),a({url:m.full,alt:m.alt??"",credit:m.credit??(m.by?`Photo by ${m.by}`:""),creditBy:m.by??"",creditUrl:m.byUrl??"",creditSource:m.source??"",creditSourceUrl:m.sourceUrl??""})}),h.append(E)})};on(t).forEach((u,w)=>{let y=document.createElement("button");y.type="button",y.className="le-chip",y.textContent=u,y.addEventListener("click",()=>void g(u)),p.append(y),w===0&&y.classList.add("is-on")}),s.addEventListener("keydown",u=>{u.key==="Enter"&&(u.preventDefault(),s.value.trim()&&g(s.value.trim()))}),await g(on(t)[0])},Do=(e,t)=>({not_configured:"Free photographs are not switched on for this site yet.",not_allowed:"The photo library would not accept this site\u2019s key. It needs setting up again.",unreachable:"Could not reach the photo library just now. Try again in a moment.",nothing_to_search_for:"Type what the picture should show."})[e]??`Nothing found for "${t}". Try fewer words.`,qo=(e,t,a)=>{let s=zo(t),p=O("div","le-suggest");p.append(O("div","le-eyebrow","Suggested for this spot"),O("div","le-suggest-text",s));let h=document.createElement("button");h.type="button",h.className="le-chip",h.style.marginTop="10px",h.textContent="Use this description",p.append(h);let d=document.createElement("textarea");d.className="le-textarea",d.placeholder="Describe the picture you want",h.addEventListener("click",()=>{d.value=s,d.focus()});let l=te?.costs?.generate_image??5,g=te?.balance??0,u=document.createElement("button");u.type="button",u.className="le-btn-publish",u.style.marginTop="14px",u.textContent=`Make a picture \xB7 ${l} credits`;let w=O("div","le-grid is-square");if(w.style.display="none",e.append(p,d,u,w),g<l){p.remove(),d.remove(),u.remove(),e.append(O("div","le-section-heading","Making pictures costs credits"),O("div","le-hint",`A picture costs ${l} credits. You have ${g}.`));let y=window.liveEditEditor?.console??null;if(y){let m=O("button","le-btn-publish","Buy credits");m.type="button",m.style.marginTop="14px",m.addEventListener("click",()=>{window.open(`${y.replace(/\/$/,"")}/billing`,"_blank","noopener")}),e.append(m)}e.append(ne("Uploading your own picture and the free photo library cost nothing, and they are the other two tabs here."));return}{let y=O("div","le-hint",`${l} credits a picture \xB7 ${g} left`);e.insertBefore(y,u)}u.addEventListener("click",async()=>{let y=d.value.trim()||s;u.disabled=!0,u.textContent="Making\u2026",w.style.display="",w.replaceChildren();for(let S=0;S<4;S+=1)w.append(O("div","le-shimmer"));let m;try{m=await(await D("/live-edit/imagine",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:y})})).json()}catch(S){w.replaceChildren(ne(V(S,"make a picture"))),u.disabled=!1,u.textContent="Try again \xB7 5 credits";return}let E=m?.images??[];if(typeof m?.balance=="number"&&(te={...te??{},balance:m.balance}),E.length===0){w.replaceChildren(ne(Mo(m?.reason))),u.disabled=!1,u.textContent="Try again \xB7 5 credits";return}w.replaceChildren(),E.forEach(S=>{let L=document.createElement("button");L.type="button",L.className="le-pick";let N=document.createElement("img");N.className="le-pick-shot",N.src=S,N.alt="",L.append(N,O("span","le-tag","MADE")),L.addEventListener("click",()=>a({url:S,credit:"",creditSource:"Generated"})),w.append(L)}),u.disabled=!1,u.textContent="Make four more \xB7 5 credits"})},Mo=e=>({not_enough_credits:"Not enough credits to make a picture. You can buy more from your account.",not_configured:"Making pictures is not switched on for this site yet.",no_suggestion:"Nothing usable came back, so you have not been charged. Try describing it differently.",nothing_to_work_with:"Describe the picture you want first."})[e]??"Could not make a picture just now. You have not been charged.",Be=null,Uo=(e,t)=>{if(!t)return;let a=me(e),s=l=>[...l.childNodes].filter(g=>g.nodeType===3),p=s(e).map(l=>l.nodeValue),h=()=>{let l=s(e);return l.length!==p.length?!1:(l.forEach((g,u)=>{g.nodeValue=p[u]}),!0)},d=!1;v.restore=()=>{!d||!Be||h()||Be(e,a)},t.addEventListener("input",()=>{Be&&(d=!0,h(),Be(e,t.value,{keepRuns:!0}))}),Be===null&&Promise.resolve().then(()=>(ft(),gt)).then(l=>Be=l.applyValue).catch(l=>console.warn("[live-edit] could not preview words as you type:",l.message))},_o=e=>{v.hrefKey=e.dataset.editHref,v.targetKey=e.dataset.editTarget;let t=document.createElement("div");t.className="le-field le-divided",t.append("Link");let a=document.createElement("input");a.type="text",a.dataset.linkField="href";let s=e.getAttribute("href")??"";a.value=s==="#"?"":s,a.placeholder="/contact or https://...",a.className="le-input le-link";let p=document.createElement("label");p.className="le-default";let h=document.createElement("input");h.type="checkbox",h.dataset.linkField="target",h.checked=e.getAttribute("target")==="_blank",p.append(h,"Open in a new tab"),t.append(a,p),k.append(t)},Et=e=>{v={kind:"link"},$.textContent=e.dataset.editLabel??"Link",k.replaceChildren(),_.classList.add("le-hidden"),ve(e)},at=e=>{let{kind:t,key:a,parts:s}=An(e.dataset.edit);if(k.replaceChildren(),_.classList.add("le-hidden"),t==="setting"){v={kind:t,key:a,element:e},$.textContent=e.dataset.editLabel??ee(e);let p=(window.liveEditRich?.settings??[]).includes(s[0]),h=Rt({editValue:e.dataset.editValue,ownText:me(e),fullText:e.textContent}),d=p?h.trim():jn(e,h);v.openedWith=d;let l=e.dataset.editAs==="icon";if(k.append(l?we("icon","Icon",e.dataset.editValue??"",1,!1):we("value","Text",d,6,p)),!l&&!p){let g=Dt(e).map(u=>`\u201C${u}\u201D`);if(g.length>0){let u=document.createElement("p");u.className="le-hint",u.textContent=`${g.join(", ")} ${g.length===1?"sits":"sit"} inside their own formatting and stay on the page \u2014 click the words themselves to change them. This box rewrites only what is around them, so there is no need to type them again.`,k.append(u)}}l||fe(e,k.querySelector("textarea")),!l&&!p&&Uo(e,k.querySelector("textarea"))}else{let[p,h]=s;v={kind:"record",type:p,id:Number(h)};let d=e.dataset.editLabel??"Item",l=JSON.parse(e.dataset.editValues??"{}"),g=l.title??l.question??l.label??l.number;if($.textContent=g?`${d}: ${g.slice(0,40)}`:d,Object.entries(l).forEach(([m,E])=>{let S=m.replace(/_/g," "),L=S.charAt(0).toUpperCase()+S.slice(1),N=(window.liveEditRich?.fields??[]).includes(`${p}.${m}`);k.append(we(m,L,E,m==="detail"||m==="answer"?6:3,N))}),window.liveEditPublishing){let m=document.createElement("div");m.className="le-hint le-immediate",m.textContent="Changes here go live as soon as you save, without publishing.",k.append(m)}e.hasAttribute("data-edit-deletable")&&(_.textContent=`Delete this ${d.toLowerCase()}`,_.classList.remove("le-hidden"));let u=document.createElement("div");u.className="le-row";let w=document.createElement("span");w.className="le-label",w.textContent="Order";let y=(m,E)=>{let S=document.createElement("button");return S.type="button",S.textContent=E,S.className="le-chip-btn",S.addEventListener("click",async()=>{(await(await D("/live-edit/record/move",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:v.type,id:v.id,direction:m})})).json()).moved?I("Reordered \u2713"):x(m==="up"?"Already first.":"Already last.")}),S};u.append(w,y("up","\u2191 Move up"),y("down","\u2193 Move down")),k.prepend(u)}ve(e)},Wo=e=>{let t=e.closest?.("[data-edit-item]"),a=t?.parentElement?.dataset?.editList?t.parentElement:e.closest?.("[data-edit-list]");if(!a?.dataset?.editList)return;let s=()=>[...a.children].filter(g=>g.dataset.editItem).map(g=>g.dataset.editItem),p=async(g,u)=>{try{await D("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:a.dataset.editList,value:JSON.stringify(g)})}),I(u)}catch(w){x(w.message)}},h=document.createElement("div");h.className="le-section-heading",h.textContent="List";let d=document.createElement("div");d.className="le-row";let l=document.createElement("button");if(l.type="button",l.className="le-chip-btn",l.textContent=t?"+ Add another":"+ Add item",l.addEventListener("click",()=>{let g=s(),u=t?g.indexOf(t.dataset.editItem):g.length-1;g.splice(u+1,0,"n"+Date.now().toString(36)),p(g,"Added \u2713")}),d.append(l),t){let g=document.createElement("button");g.type="button",g.className="le-btn-danger",g.textContent="Delete this item",g.addEventListener("click",()=>{window.confirm("Delete this item?")&&p(s().filter(u=>u!==t.dataset.editItem),"Deleted \u2713")}),d.append(g)}k.append(h,d)},St=!1,Ho=e=>{St=!0,e.click(),window.setTimeout(()=>{St=!1},0)},Yo=e=>{let t=Fn(e);if(t){let d=document.createElement("div");d.className="le-row";let l=document.createElement("button");l.type="button",l.className="le-chip-btn";let g=Dn(t);l.textContent=g===""?"Run this control":`Press \u201C${g}\u201D`,l.title="Runs the control so you can edit what it reveals",l.addEventListener("click",()=>{be(!0),Ho(t)}),d.append(l),k.append(d)}let a=e.closest?.("a[href]"),s=a?.getAttribute("href");if(!s||s==="#"||s.startsWith("javascript:"))return;let p=document.createElement("div");p.className="le-row";let h=document.createElement("button");h.type="button",h.className="le-chip-btn",h.textContent="Open this link \u2192",h.addEventListener("click",()=>{window.location.href=a.href}),p.append(h),k.append(p)},ve=(e,{styleKey:t=null,styleOn:a=e}={})=>{e.dataset.editHref!==void 0&&_o(e),Yo(e);let s=t??a.dataset.styleEdit??a.dataset.style,p=Pn(a.dataset.styleProps,window.liveEditStyleProps);s&&p.length&&Ze(s,p,a),Jo(e),Wo(e),oe(e.dataset.styleEdit?e.closest("[data-style]")??e.parentElement:e),ce("Edit"),xt()},Vo=e=>{let t=(me(e)||e.textContent||"").replace(/\s+/g," ").trim();if(t)return t.slice(0,28);let a=(e.getAttribute("aria-label")??e.getAttribute("title")??"").trim();if(a)return a.slice(0,28);let s=e.className.toString().match(/(?:social-icon-|fa-|bi-|icon-)([a-z][a-z0-9-]{2,})/i)?.[1]??[...e.querySelectorAll("[class]")].map(p=>p.className.toString().match(/(?:social-icon-|fa-|bi-|icon-)([a-z][a-z0-9-]{2,})/i)?.[1]).find(Boolean);return s?s.charAt(0).toUpperCase()+s.slice(1):ye(e)},Jo=e=>{let t="[data-edit], [data-edit-img], [data-edit-bg], [data-edit-href], [data-edit-icon], [data-edit-svg]",a=[...e.querySelectorAll(t)].filter(d=>d.parentElement?.closest(t)===null||!e.contains(d.parentElement.closest(t))).filter(d=>d!==e&&d.getBoundingClientRect().width>0);if(a.length===0)return;let s=a.slice(0,24),p=document.createElement("div");p.className="le-section-heading",p.textContent=a.length>s.length?`Inside this \u2014 first ${s.length} of ${a.length}`:"Inside this",k.append(p);let h=document.createElement("div");h.className="le-row",s.forEach(d=>{let l=document.createElement("button");l.type="button",l.className="le-chip-btn",l.textContent=Vo(d),l.addEventListener("click",()=>F(d)),h.append(l)}),k.append(h)},Ct=e=>{v={kind:"style"};let t=e.dataset.styleEdit??e.dataset.style;$.textContent=e.dataset.editLabel??ee(e),k.replaceChildren(),_.classList.add("le-hidden"),ve(e,{styleKey:t})},it=e=>{let t=getComputedStyle(e,"::before");return`${t.fontStyle} ${t.fontWeight} 20px ${t.fontFamily}`},rn=(e,t)=>{let a=e.cloneNode(!1);a.removeAttribute("data-edit-icon"),Object.assign(a.style,{position:"absolute",visibility:"hidden",pointerEvents:"none"}),(e.parentNode??document.body).append(a);let s=it(a),p=[];return[...a.classList].forEach(h=>{h!==t&&(a.classList.remove(h),it(a)!==s&&p.push(h),a.classList.add(h))}),a.remove(),p},Ko=(e,t,a,s)=>On([...e.classList],a,s,rn(e,s),rn(t,t.dataset.editIconCurrent)),Go=(e,t)=>{let a=document.createElement("canvas").getContext("2d");return a.font=t,e.filter(({glyph:s})=>{let p=a.measureText(s);return(p.actualBoundingBoxAscent||0)+(p.actualBoundingBoxDescent||0)>0})},Xo=async e=>{let t=e.dataset.editIconCurrent;v={kind:"icon",key:e.dataset.editIcon.replace(/^setting:/,""),value:t,element:e},$.textContent="Icon",k.replaceChildren(),_.classList.add("le-hidden");let a=it(e),s=await Zt();if(v?.element!==e)return;let p=new Map([[a,null]]);document.querySelectorAll("[data-edit-icon]").forEach(m=>{let E=it(m);p.has(E)||p.set(E,m)});let h=In([...p].map(([m,E])=>({face:m,variant:E,icons:Go(s,m)})));if(h.length===0){let m=document.createElement("div");m.className="le-hint",m.textContent="This theme loads its icons from somewhere this page cannot read, so they cannot be listed. Type the icon name instead.";let E=document.createElement("label");E.className="le-field",E.append("Icon name");let S=document.createElement("input");S.type="text",S.className="le-input",S.value=t??"",S.addEventListener("input",()=>{v.value=S.value.trim(),v.dirty=!0}),E.append(S,m),k.append(E),ve(e);return}let d=e.className;v.restore=()=>{e.className=d,e.dataset.editIconCurrent=t};let l=document.createElement("input");l.type="search",l.className="le-input",l.placeholder=`Search ${h.length} icons\u2026`;let g=document.createElement("div");g.className="le-icon-grid";let u=document.createElement("div");u.className="le-hint";let w=400,y=m=>{let E=m.trim().toLowerCase().replace(/\s+/g,"-"),S=E?h.filter(({name:L})=>L.includes(E)):h;if(g.replaceChildren(),S.slice(0,w).forEach(({name:L,glyph:N,face:B,variant:G})=>{let M=document.createElement("button");M.type="button",M.className="le-icon-choice",M.title=L.replace(/^[a-z]+-/,"").replace(/-/g," "),M.classList.toggle("is-current",L===t),M.style.font=B,M.textContent=N,M.addEventListener("click",()=>{e.className=d,e.dataset.editIconCurrent=t;let P=G?Ko(e,G,L,t):L;G?e.className=P:e.classList.replace(t,L),e.dataset.editIconCurrent=L,v.value=P,v.dirty=!0,g.querySelectorAll(".le-icon-choice").forEach(W=>W.classList.remove("is-current")),M.classList.add("is-current")}),g.append(M)}),S.length===0){let L=document.createElement("div");L.className="le-hint",L.textContent="No icon matches that name.",g.append(L)}u.textContent=S.length>w?`Showing ${w} of ${S.length}. Type to narrow it down.`:""};l.addEventListener("input",()=>y(l.value)),y(""),k.append(l,g,u),ve(e)},sn=e=>{let t=e.outerHTML;v={kind:"setting",key:e.dataset.editSvg.replace(/^setting:/,""),element:e},$.textContent=e.dataset.editLabel??"Drawing",k.replaceChildren(),_.classList.add("le-hidden");let a=()=>{e.outerHTML=t};v.restore=a;let s=new Set,p=[];document.querySelectorAll("svg").forEach(y=>{let m=y.outerHTML,E=m.replace(/\s+(class|style|width|height|data-[\w-]+)="[^"]*"/g,"");s.has(E)||y.getBoundingClientRect().width<4||(s.add(E),p.push(m))});let h=document.createElement("div");h.className="le-icon-grid";let d=null;p.slice(0,120).forEach(y=>{let m=document.createElement("button");m.type="button",m.className="le-icon-choice",m.innerHTML=y;let E=m.firstElementChild;E&&(E.removeAttribute("class"),E.setAttribute("width","20"),E.setAttribute("height","20")),m.classList.toggle("is-current",y===t),m.addEventListener("click",()=>{d=y,v.value=y,v.dirty=!0;let S=document.querySelector(`[data-edit-svg="${e.dataset.editSvg}"]`)??e,L=new DOMParser().parseFromString(y,"image/svg+xml").documentElement;["class","width","height","style","data-edit-svg","data-edit-label"].forEach(N=>{S.hasAttribute(N)&&L.setAttribute(N,S.getAttribute(N))}),S.replaceWith(L),h.querySelectorAll(".le-icon-choice").forEach(N=>N.classList.remove("is-current")),m.classList.add("is-current")}),h.append(m)});let l=document.createElement("label");l.className="le-field le-divided",l.append("Or paste an SVG");let g=document.createElement("textarea");g.className="le-input le-prose",g.placeholder='<svg viewBox="0 0 24 24">\u2026</svg>',g.addEventListener("input",()=>{g.value.trim()!==""&&(v.value=g.value.trim(),v.dirty=!0)});let u=document.createElement("div");u.className="le-hint",u.textContent="Anything that could run or fetch is stripped before it is saved.",l.append(g,u);let w=document.createElement("div");w.className="le-section-heading",w.textContent=p.length?"Drawings on this site":"No other drawings here",k.append(w,h,l),ve(e)},At=e=>{let t=e.dataset.editKind==="background";v={kind:"image",target:e.dataset.editImg??e.dataset.editBg,element:e},$.textContent=e.dataset.editLabel??(t?"Background image":"Image"),k.replaceChildren(),_.classList.add("le-hidden");let a=document.createElement("div");a.className="le-preview";let s=document.createElement("img");s.alt="",s.className="";let p=t?qe(e):e.currentSrc||e.getAttribute("src")||"",d=(p&&!p.startsWith("data:")?p:"")||e.dataset.editPreview;d?(s.src=d,a.append(s)):a.textContent="No image yet";let l=P=>{a.replaceChildren(s),s.src=P},g=Se({onFile:P=>l(URL.createObjectURL(P))}),u=document.createElement("label");u.className="le-field",u.append("Or paste an image URL");let w=document.createElement("input");w.type="url",w.placeholder="https://...",w.className="le-input",w.addEventListener("change",()=>{let P=w.value.trim();P&&l(P.startsWith("http")?P:`https://${P}`)}),u.append(w);let y=document.createElement("div");y.className="le-hint",y.textContent="Nothing changes on your site until you publish.";let m=(P,W,J,se)=>{let le=document.createElement("label");le.className="le-field le-divided",le.append(W);let Y=document.createElement("input");if(Y.type="text",Y.dataset.imgAttr=P,Y.value=J??"",Y.dataset.imgAttrWas=J??"",Y.className="le-input",le.append(Y),se){let Z=document.createElement("span");Z.className="le-hint",Z.textContent=se,le.append(Z)}return le},E=O("div","le-ways"),S=()=>{k.querySelectorAll(".le-staged").forEach(W=>W.remove());let P=O("div","le-hint le-staged","This is a preview. Press Save changes to keep it.");k.prepend(P)},L=(P,W)=>new Promise(J=>{let se=c.modal({title:"Which part of the picture?",subtitle:"The shape is the spot it has to fill. Drag to choose what stays in it."}),le=O("div","le-crop-stage");le.style.cssText="position:relative;display:inline-block;max-width:100%;line-height:0;touch-action:none;";let Y=document.createElement("img");Y.alt="",Y.style.cssText="max-width:100%;max-height:52vh;display:block;",Y.src=URL.createObjectURL(P);let Z=O("div","le-crop-frame");Z.style.cssText="position:absolute;border:2px solid #fff;box-shadow:0 0 0 9999px rgba(0,0,0,.45);cursor:move;",le.append(Y,Z),se.body.append(le);let Ke=O("div","le-row");Ke.style.marginTop="14px";let Ee=O("button","le-btn-publish","Use this part");Ee.type="button";let je=O("button","le-btn-outline","Whole picture");je.type="button",Ke.append(Ee,je),se.body.append(Ke);let re={x:0,y:0,width:0,height:0},lt=()=>{Z.style.left=`${re.x}px`,Z.style.top=`${re.y}px`,Z.style.width=`${re.width}px`,Z.style.height=`${re.height}px`},aa=()=>{re=wn({width:Y.clientWidth,height:Y.clientHeight},W),lt()};Y.addEventListener("load",aa);let ze=null;Z.addEventListener("pointerdown",he=>{ze={x:he.clientX,y:he.clientY,at:{...re}},Z.setPointerCapture(he.pointerId),he.preventDefault()}),Z.addEventListener("pointermove",he=>{ze&&(re=vn(ze.at,{x:he.clientX-ze.x,y:he.clientY-ze.y},{width:Y.clientWidth,height:Y.clientHeight}),lt())}),Z.addEventListener("pointerup",()=>{ze=null});let bn=he=>{URL.revokeObjectURL(Y.src),se.close(),J(he)};Ee.addEventListener("click",()=>{bn(yn(re,Y.clientWidth,Y.naturalWidth))}),je.addEventListener("click",()=>bn(xo))}),N=({url:P,file:W,credit:J,alt:se,creditBy:le,creditUrl:Y,creditSource:Z,creditSourceUrl:Ke})=>{if(v.crop=null,W){let je=new DataTransfer;je.items.add(W),g.querySelector("input[type=file]").files=je.files,l(URL.createObjectURL(W));let re=Bt(v.element);re&&L(W,re.width/re.height).then(lt=>{v.crop=lt})}else P&&(w.value=P,l(P));let Ee=k.querySelector('[data-img-attr="alt"]');se&&Ee&&Ee.value.trim()===""&&(Ee.value=se),v.credit={credit:J??"",creditBy:le??"",creditUrl:Y??"",creditSource:Z??"",creditSourceUrl:Ke??""},v.creditFor=v.target,G(v.credit),S()},B=O("p","le-credit"),G=P=>{let W=(P?.credit??"").trim();B.textContent=W,B.hidden=W===""};G({credit:ct(e,"data-edit-credit","editCredit")});let M=O("button","le-btn le-wide",t?"Replace background":"Replace image");if(M.type="button",M.addEventListener("click",()=>an(e,N,"Free photos",t?"background":"image")),E.append(M),g.hidden=!0,u.hidden=!0,k.append(a,B,E,g,u,y),v.target.startsWith("setting:")&&!t&&k.append(m("alt","Alt text",ct(e,"alt","editAlt"),"Describes the image for search engines and screen readers."),m("imgTitle","Title attribute",ct(e,"title","editTitle"),"Optional tooltip shown on hover.")),v.target.startsWith("setting:")){let P=document.createElement("button");P.type="button",P.textContent=t?"Remove background":"Remove image",P.className="le-btn-danger",P.addEventListener("click",async()=>{let W=t?"Remove this background image? The section keeps its layout and colour.":"Remove this image? The section keeps its layout; you can add a new image any time.";if(!window.confirm(W))return;let J=new FormData;J.append("target",v.target),J.append("remove","1"),await D("/live-edit/image",{method:"POST",body:J}),I("Removed \u2713")}),k.append(P)}ve(e)},ln=e=>{let t=e?.closest?.("a[data-edit], a[data-edit-href]")??null;return t&&(o===!0||!t.closest("[data-live-lock]"))?t:null},Qo=e=>{let t=e?.getAttribute("href")??"";return t!==""&&t!=="#"&&!t.startsWith("javascript:")},xe=null,Lt=!1,rt=null,Tt=()=>{rt&&(clearTimeout(rt),rt=null)},dn=()=>{Tt(),rt=setTimeout(()=>{Lt||Ve()},140)},Zo=e=>{if(e===xe&&!X.classList.contains("hidden"))return;xe=e;let t=e.getBoundingClientRect();X.style.top=`${t.top+window.scrollY-10}px`,X.style.left=`${t.right+window.scrollX-10}px`,X.classList.add("is-visible")},Ve=()=>{X.classList.remove("is-visible"),xe=null},cn=e=>{if(!e?.closest||o!==!0&&e.closest("[data-live-lock]"))return null;let t=e.closest("[data-style-edit]");if(t)return{element:t,kind:"style"};let a=e.closest("[data-edit-img]");if(a)return{element:a,kind:"image"};let s=e.closest("[data-edit-icon]");if(s)return{element:s,kind:"icon"};let p=e.closest("[data-edit-svg]");if(p)return{element:p,kind:"svg"};let h=e.closest("[data-edit]");if(h)return{element:h,kind:"text"};let d=e.closest("[data-edit-href]:not([data-edit])");if(d)return{element:d,kind:"link"};let l=e.closest("[data-edit-bg]");if(l)return{element:l,kind:"image"};let g=e.closest("[data-style]:not([data-style-edit])");return g?{element:g,kind:"style"}:null},ea=({element:e,kind:t})=>{t==="image"?At(e):t==="icon"?Xo(e):t==="svg"?sn(e):t==="text"?at(e):t==="link"?Et(e):Ct(e)},Nt=null,ke=()=>c.hoverBox.classList.remove("is-visible"),ta=e=>{let t=e.getBoundingClientRect();if(t.width<4||t.height<4){ke();return}Object.assign(c.hoverBox.style,{top:`${t.top}px`,left:`${t.left}px`,width:`${t.width}px`,height:`${t.height}px`}),c.hoverBox.classList.toggle("is-flipped",t.top<26),c.hoverLabel.textContent=e.dataset.editLabel??ee(e),c.hoverBox.classList.add("is-visible")};document.addEventListener("pointermove",e=>{if(!document.body.classList.contains("editing")){ke();return}if(e.target===c.root||c.root.contains(e.target)){ke();return}Nt||(Nt=requestAnimationFrame(()=>{Nt=null;let t=cn(e.target);t?ta(t.element):ke()}))}),document.addEventListener("scroll",ke,!0),document.addEventListener("pointerleave",ke);let st=null,$t=()=>{ie.classList.remove("is-visible"),st=null},na=e=>{st=e;let t=e.getBoundingClientRect();ie.style.top=`${Math.max(t.top,8)+8}px`,ie.style.left=`${t.left+8}px`,ie.classList.add("is-visible")};ie.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),st&&Ct(st),$t()}),document.addEventListener("pointerover",e=>{if(!document.body.classList.contains("editing"))return;let t=e.target.closest?.("[data-has-bg]");t&&(o===!0||!t.closest("[data-live-lock]"))&&na(t);let a=ln(e.target);a&&Qo(a)&&(Tt(),Zo(a))}),document.addEventListener("pointerout",e=>{document.body.classList.contains("editing")&&e.relatedTarget!==X&&(ln(e.relatedTarget)===xe&&xe||dn())}),X.addEventListener("pointerenter",()=>{Lt=!0,Tt()}),X.addEventListener("pointerleave",()=>{Lt=!1,dn()}),X.addEventListener("click",e=>{if(e.preventDefault(),e.stopPropagation(),!xe)return;let t=xe;t.dataset.edit!==void 0?at(t):Et(t),Ve()}),document.addEventListener("click",e=>{if(!document.body.classList.contains("editing")||St||e.target===c.root||c.root.contains(e.target)||e.target.closest("[data-live-create]"))return;let t=cn(e.target);t&&(e.preventDefault(),e.stopImmediatePropagation(),ea(t))},!0),document.addEventListener("keydown",e=>{if(e.key==="Escape"&&c.shadow.querySelector(".le-scrim")||(e.key==="Escape"&&T.classList.contains("is-open")&&be(),!document.body.classList.contains("editing"))||e.key!=="Enter"&&e.key!==" "||c.shadow.activeElement)return;let t=document.activeElement;t?.matches("[data-edit-img], [data-edit-bg]")?(e.preventDefault(),At(t)):t?.matches("[data-edit]")&&!t.matches("button, a")&&(e.preventDefault(),at(t))}),K?.addEventListener("click",()=>Pe(!document.body.classList.contains("editing"))),c.changesButton?.addEventListener("click",()=>{document.body.classList.contains("editing")||Pe(!0),ce("Changes"),xt()});let pn=e=>{if(window.liveEditPublishing){e(window.liveEditPublishing);return}q().then(()=>window.liveEditPublishing&&e(window.liveEditPublishing))};pn(e=>{let t=e.pending??0,a=()=>{c.publishButton.hidden=!1,c.previewButton.hidden=!1,c.publishLabel.textContent=t>0?"Publish":"Published",c.publishCount.textContent=String(t),c.publishCount.hidden=t===0,c.publishButton.disabled=t===0,c.publishButton.title=t>0?`Put ${t} change${t===1?"":"s"} live`:"Nothing is waiting to be published"};a();let s=async()=>{let h=t===1?"":"s",d=e.domain??window.location.host,l=c.modal({title:`Publish ${t} change${h}`,subtitle:`They go live on ${d} right away.`,size:"is-narrow"});l.body.append(ne("Loading\u2026"));let g=O("button","le-btn-outline","Keep editing");g.type="button",g.addEventListener("click",()=>l.close());let u=O("button","le-btn-publish","Publish now");u.type="button",l.foot.hidden=!1,l.foot.append(g,u),u.focus();try{let m=(await(await D("/live-edit/changes",{method:"GET"})).json())?.changes??[],E=O("div","le-review");m.forEach(S=>{let L=O("div","le-review-row");L.append(O("div","le-review-what",vt(S)),O("div","le-review-to",Xt(S)||"(empty)")),E.append(L)}),l.body.replaceChildren(m.length>0?E:ne("Nothing is waiting."))}catch(w){l.body.replaceChildren(ne(V(w,"list what is waiting")))}u.addEventListener("click",async()=>{u.disabled=!0,g.disabled=!0,u.textContent="Publishing\u2026",l.allowDismiss(!1);try{await D("/live-edit/publish",{method:"POST"}),t=0,a(),l.close(),I(`Live on ${d} \u2713`)}catch(w){l.allowDismiss(!0),u.disabled=!1,g.disabled=!1,u.textContent="Try again",l.body.replaceChildren(ne(V(w,"publish that")))}})};c.publishButton.addEventListener("click",()=>{t!==0&&(document.activeElement?.blur?.(),s())});let p=()=>{let h=document.body.classList.contains("editing");be(!0),Pe(!1),c.toolbar.style.display="none";let d=document.createElement("div");d.className="le-back";let l=null,g=!1,u=!1,w=()=>{if(!(g||u)){l?.remove(),l=null;return}let G=new URL(window.location.href);G.searchParams.set("live-edit",u?"published":"off"),l?.remove(),l=document.createElement("div"),l.className=g?"le-phone":"le-whole";let M=document.createElement("iframe");M.src=G.toString(),M.title=u?"This page as a visitor is being served it":"This page on a phone",l.append(M),c.shadow.append(l)},y=(B,G)=>B.map(([M,P,W])=>{let J=O("button","le-back-btn",M);return J.type="button",W&&(J.title=W),J.addEventListener("click",()=>{B.buttons.forEach(se=>se.classList.remove("is-on")),J.classList.add("is-on"),G(P),w()}),d.append(J),J}),m=[["Desktop",!1],["Phone",!0]];m.buttons=y(m,B=>{g=B}),m.buttons[0].classList.add("is-on"),d.append(O("span","le-back-sep"));let E=[["Your drafts",!1,"The page with your unpublished work applied"],["What's live",!0,"The page exactly as a visitor is being served it right now"]];E.buttons=y(E,B=>{u=B,d.classList.toggle("is-live",B)}),E.buttons[0].classList.add("is-on");let S=O("span","le-back-note",e.version?`Published version ${e.version}`:"Nothing published yet");if(d.append(S),e.previewUrl){let B=O("button","le-back-btn","Copy a link to this");B.type="button",B.title="A link that shows this unpublished version to somebody else",B.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(e.previewUrl),c.toast("Link copied \u2713")}catch{window.prompt("Copy this link:",e.previewUrl)}}),d.append(B)}let L=O("button","le-back-btn","Back to editing");L.type="button",L.addEventListener("click",()=>{l?.remove(),l=null,d.remove(),document.removeEventListener("keydown",N,!0),c.toolbar.style.display="",Pe(h)});let N=B=>{B.key==="Escape"&&L.click()};document.addEventListener("keydown",N,!0),d.append(L),c.shadow.append(d),L.focus()};c.previewButton.addEventListener("click",p)});let oa=()=>{let e=document.querySelectorAll('nav, [role="navigation"], header ul'),t=new Map,a=s=>s.closest("#wpadminbar, #adminmenu, #wp-toolbar, #live-edit-ui, [data-no-edit], [data-live-edit-chrome]")!==null;return e.forEach(s=>{a(s)||s.querySelectorAll("a[href]").forEach(p=>{if(a(p))return;let h;try{h=new URL(p.getAttribute("href"),window.location.href)}catch{return}if(h.origin!==window.location.origin||/\.(pdf|zip|jpe?g|png|gif|svg|webp|mp4|mp3)$/i.test(h.pathname)||h.pathname===window.location.pathname&&h.hash)return;let d=(p.textContent??"").replace(/\s+/g," ").trim();d===""||d.length>22||t.has(h.pathname)||t.set(h.pathname,{label:d,href:h.href})})}),[...t.values()].slice(0,6)};(()=>{let e=oa();if(e.length<2)return;let t=window.location.pathname.replace(/\/$/,"");e.forEach(a=>{let s=O("button","le-page-btn",a.label);s.type="button",s.title=a.href,new URL(a.href).pathname.replace(/\/$/,"")===t?s.classList.add("is-on"):s.addEventListener("click",()=>{sessionStorage.setItem("tb_editing","1"),window.location.href=a.href}),c.pageSwitcher.append(s)}),c.pageSwitcher.hidden=!1})();let Fa=(async()=>{let e=c.languagePicker;if(!e)return;let t;try{t=await(await D("/live-edit/translations",{method:"GET"})).json()}catch{return}let a=t?.locales??[],s=t?.default_locale??"en";if(a.length<2)return;a.forEach(u=>{let w=O("option",null,t?.names?.[u]??u.toUpperCase());w.value=u,e.append(w)});let p=window.liveEditLocale??s;e.value=p,e.hidden=!1;let h=(u,w)=>{if(document.querySelectorAll("[data-live-edit-stale]").forEach(m=>m.removeAttribute("data-live-edit-stale")),w===s)return 0;let y=0;return(u??[]).filter(m=>m.locale===w&&m.current===!1).forEach(m=>{document.querySelectorAll(`[data-edit="setting:${CSS.escape(m.key)}"]`).forEach(E=>{E.setAttribute("data-live-edit-stale",""),y++})}),y},d=t?.stale??[];if(h(d,p),(t?.counts?.stale??0)>0&&p===s){let u=Object.keys(t?.needing_review??{}).length;x(u===1?`1 translation may need updating since the ${s.toUpperCase()} changed.`:`${u} languages have translations that may need updating.`)}let g=0;e.addEventListener("change",async()=>{let u=e.value,w=++g;e.disabled=!0;try{let y=await(await D(`/live-edit/content?locale=${encodeURIComponent(u)}`,{method:"GET"})).json();if(w!==g)return;window.liveEditLocale=u;let{applyContent:m}=await Promise.resolve().then(()=>(ft(),gt));m(document,y?.settings??{});try{d=(await(await D("/live-edit/translations",{method:"GET"})).json())?.stale??d}catch{}let E=h(d,u);x(u===s?"Editing the original.":E>0?`Editing in ${e.options[e.selectedIndex]?.text??u}. ${E===1?"1 sentence on this page has":`${E} sentences on this page have`} fallen behind the original.`:`Editing in ${e.options[e.selectedIndex]?.text??u}. Saves here do not change the original.`)}catch{if(w!==g)return;e.value=window.liveEditLocale??s,x("Could not load that language. Nothing has been changed.")}finally{w===g&&(e.disabled=!1)}})})(),un=`live-edit:redo:${n?.site??window.location.host}`,Ot=()=>{try{return JSON.parse(sessionStorage.getItem(un)??"[]")}catch{return[]}},hn=e=>{try{sessionStorage.setItem(un,JSON.stringify(e.slice(-20)))}catch{}},Je=()=>{c.undoButton.disabled=(window.liveEditPublishing?.pending??0)===0,c.redoButton.disabled=Ot().length===0};pn(Je),Je();let gn=async()=>{c.undoButton.disabled=!0;let e;try{e=((await(await D("/live-edit/changes",{method:"GET"})).json())?.changes??[])[0]}catch(a){c.toast(V(a,"undo that")),Je();return}if(!e){c.toast("There is nothing left to undo. Everything is published."),Je();return}let t=vt(e);try{await D("/live-edit/changes",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:e.key,kind:e.kind})})}catch(a){c.toast(V(a,"undo that")),Je();return}hn([...Ot(),{key:e.key,kind:e.kind,value:e.after,label:t}]),I(`Undone: ${t}`)},fn=async()=>{let e=Ot(),t=e.pop();if(!t){c.toast("There is nothing to put back.");return}c.redoButton.disabled=!0;try{if(t.kind==="style")throw new Error("A styling change cannot be put back automatically yet.");await D("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:t.key,value:t.value,locale:window.liveEditLocale})})}catch(a){c.toast(V(a,"put that back")),c.redoButton.disabled=!1;return}hn(e),I(`Put back: ${t.label}`)};c.undoButton.addEventListener("click",()=>void gn()),c.redoButton.addEventListener("click",()=>void fn()),document.addEventListener("keydown",e=>{!(e.metaKey||e.ctrlKey)||e.key.toLowerCase()!=="z"||(c.shadow.activeElement??document.activeElement)?.closest?.('input, textarea, [contenteditable="true"]')||(e.preventDefault(),e.shiftKey?fn():gn())}),c.closeButton.addEventListener("click",()=>be()),c.cancelButton.addEventListener("click",()=>be()),c.saveButton.addEventListener("click",Po),_?.addEventListener("click",async()=>{!v||v.kind!=="record"||window.confirm("Delete this item?")&&(await D(`/live-edit/record/${v.type}/${v.id}`,{method:"DELETE"}),I("Deleted \u2713"))}),document.querySelectorAll("[data-live-create]").forEach(e=>{e.addEventListener("click",async()=>{await D("/live-edit/record/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:e.dataset.liveCreate})}),I("Added \u2713 \u2014 click it to edit")})});let It=new URLSearchParams(window.location.search);if(It.has("edit")){It.delete("edit");let e=It.toString();window.history.replaceState(null,"",window.location.pathname+(e?`?${e}`:"")),Pe(!0)}else Pe(sessionStorage.getItem("tb_editing")==="1")}};window.liveEditDisplayedValue=n=>Rt({editValue:n.dataset.editValue,ownText:me(n),fullText:n.textContent});var bt=(()=>{let n=!1,o=null;return()=>{if(n)return;let i=new URLSearchParams(window.location.search).get("live-edit");if(!(i==="off"||i==="published")){if(!document.body?.hasAttribute("data-admin")){window.liveEditApi?.token&&!o&&typeof MutationObserver<"u"&&(o=new MutationObserver(()=>{document.body?.hasAttribute("data-admin")&&(o.disconnect(),o=null,bt())}),o.observe(document.body,{attributes:!0,attributeFilter:["data-admin"]}));return}n=!0,o?.disconnect(),za()}}})();document.readyState==="complete"?bt():(window.addEventListener("load",bt,{once:!0}),window.setTimeout(bt,2e3));export{xo as WHOLE_PICTURE};
