var oa=Object.defineProperty;var Fe=(n,o)=>()=>(n&&(o=n(n=0)),o);var Ot=(n,o)=>{for(var i in o)oa(n,i,{get:o[i],enumerable:!0})};var An,Je,Ln,Tn,Nn,ca,$n,On,jt,me,In,Pn,Bn,pt,ut,pa,De,Rt,jn,Rn,zn,zt,Fn,Dn,qn,ht=Fe(()=>{An=n=>{let[o,...i]=String(n??"").split(":");return{kind:o,key:i.join(":"),parts:i}},Je=(n=3e4)=>{if(typeof AbortSignal<"u"&&typeof AbortSignal.timeout=="function")return AbortSignal.timeout(n);if(typeof AbortController>"u")return;let o=new AbortController;return setTimeout(()=>o.abort(),n),o.signal},Ln=n=>n?.name==="TimeoutError"||n?.name==="AbortError",Tn=(n,o={})=>({...o,headers:{"X-CSRF-TOKEN":n,Accept:"application/json",...o.headers??{}}}),Nn=n=>(n?.headers?.get?.("content-type")??"").includes("json"),ca=/\.((?:fa|fas|far|fab|fal|fad|bi|ti|icon|flaticon|glyphicon|ion|mdi)-[a-z0-9][a-z0-9-]*)::?before/gi,$n=n=>{let o=[];for(let i of String(n??"").split("}")){let r=i.indexOf("{");if(r===-1)continue;let h=i.slice(r+1).match(/content\s*:\s*(["'])(.*?)\1/);if(!h)continue;let l=h[2].match(/^\\([0-9a-f]{1,6})\s*$/i),m=l?String.fromCodePoint(parseInt(l[1],16)):h[2];if([...m].length===1)for(let k of i.slice(0,r).matchAll(ca))o.push({name:k[1],glyph:m})}return o},On=(n,o,i,r,h)=>{let l=n.filter(m=>m!==i&&!r.includes(m));return h.forEach(m=>l.includes(m)||l.push(m)),l.push(o),l.join(" ")},jt=({editValue:n,ownText:o,fullText:i})=>(n??"")!==""?n:(o??"").trim()!==""?o:i??"",me=n=>n.children.length?[...n.childNodes].filter(o=>o.nodeType===3).map(o=>o.textContent).join(""):n.textContent,In=n=>{let o=new Set,i=[];for(let r of n)for(let h of r.icons)o.has(h.name)||(o.add(h.name),i.push({...h,face:r.face,variant:r.variant}));return i.sort((r,h)=>r.name.localeCompare(h.name))},Pn=(n,o)=>{let i=Object.keys(o??{}),r=String(n??"").split(",").map(h=>h.trim()).filter(Boolean);return r.length===0?i:i.length===0?r:r.filter(h=>i.includes(h))},Bn=(n,o={},i)=>{let r=String(i?.base??"").replace(/\/$/,""),[h,l]=String(n).split("?"),m={"/live-edit/setting":`${r}/${i?.site}/content`,"/live-edit/style":`${r}/${i?.site}/styles`,"/live-edit/publish":`${r}/${i?.site}/publish`,"/live-edit/image":`${r}/${i?.site}/media`,"/live-edit/upload":`${r}/${i?.site}/media`,"/live-edit/changes":`${r}/${i?.site}/changes`,"/live-edit/versions":`${r}/${i?.site}/versions`,"/live-edit/content":`${r}/${i?.site}/content`,"/live-edit/translations":`${r}/${i?.site}/translations`,"/live-edit/credits":`${r}/${i?.site}/credits`,"/live-edit/assist":`${r}/${i?.site}/assist`,"/live-edit/photos":`${r}/${i?.site}/photos`,"/live-edit/photos/used":`${r}/${i?.site}/photos/used`,"/live-edit/imagine":`${r}/${i?.site}/imagine`},k=i?.routes?.[h]??(h==="/live-edit/publish"?i?.publishUrl:null);if(k)return{url:l?`${k}?${l}`:k,init:{...o,headers:{...o.headers??{},...i.routeHeaders??i.publishHeaders??{},Accept:"application/json"},credentials:"same-origin"}};let C=m[h];if(!r||!i?.site||!i?.token)throw new Error("The content API is not configured on this page.");if(!C)throw new Error(`Editing that is not available over the content API yet (${h}).`);return{url:l?`${C}?${l}`:C,init:{...o,headers:{...o.headers??{},Authorization:`Bearer ${i.token}`,Accept:"application/json"}}}},pt=(n,o,i)=>n.hasAttribute(o)?n.getAttribute(o):n.dataset?.[i]??"",ut=n=>{let o=String(n??"").trim();return o===""?!1:/^data:image\//i.test(o)||/\/live-edit\/(sites|media)\//i.test(o)?!0:/\.(jpe?g|png|gif|webp|avif|svg)(\?|#|$)/i.test(o)},pa=(n,o)=>o==null?!0:o===408||o===425||o===429||o>=500,De=async(n,{tries:o=3,waits:i=[200,500],sleep:r=null}={})=>{let h=r??(m=>new Promise(k=>setTimeout(k,m))),l=null;for(let m=0;m<o;m++)try{return await n()}catch(k){if(l=k,m===o-1||!pa(k,k.status))throw k;await h(i[Math.min(m,i.length-1)])}throw l},Rt=(n,o=null)=>{if(!n)return"";let i=n.dataset?.background||n.dataset?.bg||n.dataset?.backgroundImage;if(i)return i;let r=o??n.ownerDocument?.defaultView??(typeof window>"u"?null:window),l=(r?.getComputedStyle&&r.getComputedStyle(n).backgroundImage||"").match(/url\((['"]?)(.*?)\1\)/);if(l&&!l[2].startsWith("data:"))return l[2];let m=n.dataset?.kbBg||"";return m.startsWith("data:")?"":m},jn=(n,o)=>{let i=[...n?.childNodes??[]].filter(r=>r.nodeType===3);return i.length<2?String(o??"").replace(/\s+/g," ").trim():i.map(r=>(r.nodeValue??"").replace(/\s+/g," ")).join("").trim()},Rn={background:"background",textColor:"color",fontSize:"font-size",radius:"border-radius",backgroundImage:"background-image"},zn=(n,o,i={})=>o?!1:n==="hidden"?!0:!!i[n],zt=(n,o=24)=>[...n?.children??[]].map(i=>(i.textContent??"").replace(/\s+/g," ").trim()).filter(i=>i!=="").map(i=>i.length>o?`${i.slice(0,o-1).trimEnd()}\u2026`:i),Fn=n=>{let o=n?.closest?.('a[href^="#"], [aria-controls], [aria-expanded], [data-toggle], [role="button"], [role="tab"], summary, button')??null;return!o||o.tagName==="BUTTON"&&o.form&&(o.getAttribute("type")||"submit").toLowerCase()!=="button"?null:o},Dn=n=>{let o=(n?.getAttribute?.("aria-label")||n?.getAttribute?.("title")||n?.textContent||"").replace(/\s+/g," ").trim();return o===""||o.length>80?"":o.length>32?`${o.slice(0,31).trimEnd()}\u2026`:o},qn=(n,o)=>{let i=n.tagName,r;i==="IMG"?r=["radius","hidden"]:i==="A"||i==="BUTTON"?r=["background","textColor","fontSize","radius","hidden"]:/^(H[1-6]|P|SPAN|LI|BLOCKQUOTE|FIGCAPTION|DT|DD|TD|TH|CAPTION|CITE|Q|LABEL|STRONG|EM)$/.test(i)?r=["textColor","fontSize","hidden"]:r=["background","backgroundImage","paddingY","paddingX","radius","hidden"];let h=Rt(n)!=="",l=n.hasAttribute?.("data-edit-bg")===!0;return(!h||l)&&(r=r.filter(m=>m!=="backgroundImage")),o.filter(m=>r.includes(m.trim()))}});var ua,Ft,Mn=Fe(()=>{ua=[[/(<meta[^>]+name=["']csrf-token["'][^>]+content=["'])[^"']*/gi,"$1"],[/(\sdata-csrf=["'])[^"']*/gi,"$1"],[/(\swire:snapshot=["'])[^"']*/gi,"$1"],[/(\swire:effects=["'])[^"']*/gi,"$1"],[/(\swire:id=["'])[^"']*/gi,"$1"],[/(name=["']_token["'][^>]+value=["'])[^"']*/gi,"$1"],[/(\snonce=["'])[^"']*/gi,"$1"],[/(=["'])lofi-[0-9a-z-]*/gi,"$1"],[/(\sstyle=["'])display:\s*none;?(?=["'])/gi,"$1"]],Ft=n=>ua.reduce((o,[i,r])=>o.replace(i,r),String(n??""))});var _t={};Ot(_t,{applyTags:()=>Dt,autoTag:()=>Ke,elementAt:()=>Un,ensureBackgroundsAreFound:()=>ga,fingerprint:()=>qt,refreshBackgrounds:()=>fa,resolveBackgrounds:()=>Mt,watchForLateBackgrounds:()=>Jn,watchForLateContent:()=>Vn,worthSending:()=>Ut});var ha,qt,Un,Dt,_n,Wn,Hn,Yn,Mt,ga,fa,Ut,Vn,Jn,ba,ma,Ke,Wt=Fe(()=>{Mn();ht();ha="kb_tags_",qt=n=>{let o=2166136261;for(let i=0;i<n.length;i++)o^=n.charCodeAt(i),o=Math.imul(o,16777619);return(o>>>0).toString(16)},Un=(n,o)=>{let i=n.documentElement;for(let r of o)if(i=[...i?.children??[]][r],!i)return null;return i},Dt=(n,o)=>{let i=0;for(let{at:r,attributes:h}of o??[]){let l=Un(n,r);if(l){for(let[m,k]of Object.entries(h))l.hasAttribute(m)||l.setAttribute(m,k);i++}}return i},_n=n=>{try{return JSON.parse(window.sessionStorage?.getItem(n)??"null")}catch{return null}},Wn=(n,o)=>{try{window.sessionStorage?.setItem(n,JSON.stringify(o))}catch{}},Hn=n=>n.hasAttribute("data-kb-bg")||n.hasAttribute("data-background")||n.hasAttribute("data-bg")||n.hasAttribute("data-background-image")||/background-image|url\(/i.test(n.getAttribute("style")??""),Yn=(n,o)=>{if(Hn(n))return!1;let i=o.getComputedStyle(n).backgroundImage;if(!i||i==="none"||!i.includes("url("))return!1;let r=i.match(/url\(\s*["']?([^"')]+)/)?.[1];return!r||r.startsWith("data:")?!1:(n.setAttribute("data-kb-bg",r),!0)},Mt=(n=document)=>{let o=n.defaultView??window;if(!o?.getComputedStyle)return 0;let i=0;for(let r of n.querySelectorAll("body *"))Yn(r,o)&&i++;return i},ga=async(n,o=document)=>{let i=o.defaultView??window;if(i.liveEditBackgroundsWatched)return 0;i.liveEditBackgroundsWatched=!0;let r=await Ke(n,o);return Jn(o,()=>{Ke(n,o).catch(h=>{console.warn("[live-edit] could not tag a late background:",h.message)})}),Vn(o,()=>{Ke(n,o,{because:"new content"}).catch(h=>{console.warn("[live-edit] could not tag what just appeared:",h.message)})}),r},fa=async(n,o=document)=>Mt(o)===0&&o.querySelector("[data-kb-bg]:not([data-edit-bg])")===null?0:Ke(n,o),Ut=n=>{let o=n.documentElement.cloneNode(!0);for(let i of o.querySelectorAll("script, style, noscript"))for(let r of[...i.childNodes])r.nodeType===3&&r.remove();return o.outerHTML},Vn=(n=document,o=()=>{})=>{let i=n.defaultView??window;if(!i?.MutationObserver)return null;let r=10,h="[data-edit], [data-edit-img], [data-edit-bg]",l=0,m=null,k=$=>!$||$.nodeType!==1||$.matches?.("[data-edit], [data-edit-img], [data-style]")?!1:($.textContent??"").trim()!==""&&!$.querySelector?.("[data-edit]")?!0:!!($.matches?.("img:not([data-edit-img])")||$.querySelector?.("img:not([data-edit-img])")),C=$=>$?.nodeType===1&&!!($.matches?.(h)||$.querySelector?.(h)),I=$=>($.textContent??"").replace(/\s+/g," ").trim(),z=new WeakMap,P=($,B)=>{let x=z.get($)??new Set;x.add(I(B)),z.set($,x)},N=$=>{let B=new Set,x=new Map;for(let q of $){for(let V of q.removedNodes)C(V)&&(B.add(q.target),V.hasAttribute?.("data-kb-swaps")||P(q.target,V));let Q=[...q.addedNodes].filter(V=>V.nodeType===1);Q.length>0&&x.set(q.target,(x.get(q.target)??[]).concat(Q))}for(let[q,Q]of x){if(!B.has(q))continue;let V=z.get(q)??new Set;for(let J of Q)V.has(I(J))||J.setAttribute("data-kb-swaps","1")}},W=new i.MutationObserver($=>{if(l>=r){W.disconnect();return}N($),!(!$.some(x=>[...x.addedNodes].some(k))||m)&&(m=i.setTimeout(()=>{m=null,l+=1,o()},600))});return W.observe(n.body??n.documentElement,{childList:!0,subtree:!0}),W},Jn=(n=document,o=()=>{})=>{let i=n.defaultView??window;if(!i?.IntersectionObserver||!i.getComputedStyle)return null;let r=new Set,h=null,l=()=>{if(h=null,r.size===0)return;let N=[...r];r.clear(),o(N)},m=5,k=new WeakMap,C=N=>{if(Yn(N,i))return r.add(N),I.unobserve(N),h||(h=i.setTimeout(l,250)),!0;let W=(k.get(N)??0)+1;return k.set(N,W),W>=m&&I.unobserve(N),!1},I=new i.IntersectionObserver(N=>{for(let W of N){if(!W.isIntersecting)continue;let $=W.target;C($)||i.setTimeout(()=>C($),400)}},{rootMargin:"300px"}),z=[...n.querySelectorAll("body *")].filter(N=>!Hn(N)),P=4e3;return z.length>P&&console.warn(`[live-edit] watching the first ${P} of ${z.length} elements for late backgrounds`),z.slice(0,P).forEach(N=>I.observe(N)),I},ba="kb_locks_",ma=async({base:n,site:o,key:i,page:r},h)=>{if(h.querySelector("[data-live-lock], [data-live-edit-lock]"))try{let l=Ut(h),m=ba+qt(Ft(l));if(_n(m))return;(await fetch(`${String(n).replace(/\/$/,"")}/${o}/locks`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json",Authorization:`Bearer ${i}`},body:JSON.stringify({html:l,page:r??h.location?.pathname??""}),signal:Je(2e4)})).ok&&Wn(m,!0)}catch{}},Ke=async({base:n,site:o,key:i,page:r},h=document,{because:l=null}={})=>{let m=h.querySelector("[data-edit], [data-edit-img]")!==null;if(Mt(h),m&&!(h.querySelector("[data-kb-bg]:not([data-edit-bg])")!==null)&&l===null)return ma({base:n,site:o,key:i,page:r},h),0;let C=Ut(h),I=ha+qt(Ft(C)),z=_n(I);if(z)return Dt(h,z);let P=JSON.stringify({html:C,page:r??h.location?.pathname??""}),{elements:N}=await De(async()=>{let W=await fetch(`${String(n).replace(/\/$/,"")}/${o}/tag`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json",Authorization:`Bearer ${i}`},body:P,signal:Je(2e4)});if(!W.ok){let $=new Error(`Tagging answered ${W.status}`);throw $.status=W.status,$}return W.json()});return Wn(I,N),Dt(h,N)}});var wa,ya,va,Kn,Gn,Xn=Fe(()=>{wa=new Set(["svg","g","defs","symbol","use","title","desc","path","circle","ellipse","line","polygon","polyline","rect","text","tspan","textpath","lineargradient","radialgradient","stop","clippath","mask","pattern"]),ya=new Set(["viewbox","xmlns","width","height","fill","fill-rule","fill-opacity","stroke","stroke-width","stroke-linecap","stroke-linejoin","stroke-dasharray","stroke-dashoffset","stroke-opacity","stroke-miterlimit","opacity","d","points","x","y","x1","y1","x2","y2","cx","cy","r","rx","ry","transform","offset","stop-color","stop-opacity","gradientunits","gradienttransform","patternunits","clip-rule","clip-path","mask","id","class","role","aria-label","aria-hidden","focusable","preserveaspectratio","vector-effect","text-anchor","font-size","font-family"]),va=8,Kn=n=>{let o=String(n??"").trim();if(o===""||!/<svg/i.test(o))return null;let i=new DOMParser().parseFromString(o,"image/svg+xml"),r=i.documentElement;return!r||r.tagName?.toLowerCase()!=="svg"||i.querySelector("parsererror")||(Gn(r),r.children.length===0&&r.textContent.trim()==="")?null:r},Gn=n=>{for(let o of[...n.childNodes]){if(o.nodeType===va){o.remove();continue}if(o.nodeType===1){if(!wa.has(o.tagName.toLowerCase())){o.remove();continue}Gn(o)}}for(let o of[...n.attributes]){let i=o.name.toLowerCase(),r=o.value,l=i==="href"||i==="xlink:href"?r.trim().startsWith("#"):ya.has(i);l&&/url\(/i.test(r)&&!/^url\(\s*#/i.test(r.trim())&&(l=!1),l||n.removeAttribute(o.name)}}});var gt={};Ot(gt,{applyBackground:()=>oo,applyContent:()=>io,applyIcon:()=>no,applyOrder:()=>ao,applyStyles:()=>lo,applySvg:()=>to,applyValue:()=>Yt,defendContent:()=>ro,fetchContent:()=>po,fetchSnapshot:()=>co,resolve:()=>uo,styleRules:()=>so});var Ht,Qn,xa,ka,Yt,Ea,Vt,Sa,Ca,Aa,Zn,La,to,no,oo,ao,io,ro,so,lo,co,po,eo,Ta,uo,ft=Fe(()=>{Xn();ht();Ht=(n,o)=>Object.assign(new Error(n),{status:o}),Qn="setting:",xa=(n,o)=>{let i=n.currentSrc||n.getAttribute("src")||"";if(i!==""&&new URL(i,document.baseURI).href===new URL(o,document.baseURI).href)return;let h=i!==""&&n.complete;if(n.setAttribute("src",o),!h)return;n.style.transition="opacity 120ms ease-out",n.style.opacity="0";let l=()=>{n.style.opacity="1",setTimeout(()=>{n.style.removeProperty("transition"),n.style.removeProperty("opacity")},160)};if(n.decode){n.decode().then(l,l);return}n.addEventListener("load",l,{once:!0}),n.addEventListener("error",l,{once:!0})},ka=(n,o)=>{for(let i of n.querySelectorAll("[data-edit-img]")){let r=(i.getAttribute("data-edit-img")??"").replace(/^setting:/,""),h=o[r];if(typeof h!="string"||h==="")continue;let l=i.currentSrc||i.getAttribute("src")||"";if(l!==""&&new URL(l,document.baseURI).href===new URL(h,document.baseURI).href)continue;let m=new Image;m.decoding="async",m.src=h}},Yt=(n,o,{keepRuns:i=!1}={})=>{let r=n.tagName?.toLowerCase();if(r==="img"){xa(n,o),Ea(n);return}if(r==="source"){n.setAttribute("srcset",o);return}Vt(n,o,i)},Ea=n=>{if(n.removeAttribute("srcset"),n.removeAttribute("sizes"),n.parentElement?.tagName==="PICTURE")for(let o of[...n.parentElement.children])o.tagName==="SOURCE"&&o.remove()},Vt=(n,o,i=!1)=>{let r=[...n.childNodes].filter(B=>B.nodeType===La);if(r.length===0){let B=[...n.children];if(B.length===1&&B[0].children.length===0){Vt(B[0],o);return}n.append(o);return}if(r.length===1){Zn(r[0],o);return}let h=r.map(B=>B.nodeValue),l=h.join(""),m=0;for(;m<l.length&&m<o.length&&l[m]===o[m];)m+=1;let k=0;for(;k<l.length-m&&k<o.length-m&&l[l.length-1-k]===o[o.length-1-k];)k+=1;let C=m,I=l.length-k,z=o.slice(m,o.length-k),P=0,N=!1,W=h.map(B=>{let x=P,q=P+B.length;if(P=q,N||C<x||I>q)return B;N=!0;let Q=B.slice(0,C-x),V=B.slice(I-x),J=Q===""&&/^\s/.test(B)&&!/^\s/.test(z)?B.match(/^\s+/)[0]:"",oe=V===""&&/\s$/.test(B)&&!/\s$/.test(z)?B.match(/\s+$/)[0]:"";return Q+J+z+oe+V});if(N){r.forEach((B,x)=>{B.nodeValue=W[x]});return}let $=Aa(h,o);if($!==null){r.forEach((B,x)=>{B.nodeValue=$[x]});return}Zn(r[0],o),r.slice(1).forEach(B=>{if(i){B.nodeValue="";return}B.remove()})},Sa=(n,o)=>{let i=n.length,r=o.length,h=r+1,l=new Int32Array((i+1)*h);for(let k=i-1;k>=0;k-=1)for(let C=r-1;C>=0;C-=1)l[k*h+C]=n[k]===o[C]?l[(k+1)*h+C+1]+1:Math.max(l[(k+1)*h+C],l[k*h+C+1]);let m=[];for(let k=0,C=0;k<i&&C<r;)n[k]===o[C]?(m.push([k,C]),k+=1,C+=1):l[(k+1)*h+C]>=l[k*h+C+1]?k+=1:C+=1;return m},Ca=(n,o)=>{let i=new Map(n.map(([h,l])=>[h,l])),r=h=>{let l=0;for(let m=h<0?o-1:o;i.has(m);m+=h){let k=i.get(m+h);if(l+=1,k===void 0||Math.abs(k-i.get(m))!==1)break}return l};return Math.max(r(-1),r(1))},Aa=(n,o)=>{let i=n.join("");if(i.length===0||o.length===0||i.length*o.length>25e4)return null;let r=Sa(i,o),h=new Map(r.map(([C,I])=>[C,I])),l=[],m=0,k=0;for(let C of n.slice(0,-1)){if(k+=C.length,Ca(r,k)<3)return null;let I=m;for(let z=k-1;z>=0;z-=1)if(h.has(z)){I=Math.max(m,h.get(z)+1);break}l.push(o.slice(m,I)),m=I}return l.push(o.slice(m)),l},Zn=(n,o)=>{let i=n.nodeValue,r=/^\s/.test(i)&&!/^\s/.test(o)?" ":"",h=/\s$/.test(i)&&!/\s$/.test(o)?" ":"";n.nodeValue=r+o+h},La=3,to=(n,o)=>{let i=Kn(o);if(!i)return!1;let r=document.importNode(i,!0);for(let h of["class","width","height","style","data-edit-svg","data-edit-label"])n.hasAttribute(h)&&r.setAttribute(h,n.getAttribute(h));return n.replaceWith(r),!0},no=(n,o)=>{let i=String(o).replace(/[^A-Za-z0-9_\- ]/g,"").split(/\s+/).filter(Boolean),r=n.getAttribute("data-edit-icon-current");if(i.length===0||!r)return!1;let h=i.length===1?(n.getAttribute("class")??"").trim().split(/\s+/).map(l=>l===r?i[0]:l):i;return n.setAttribute("class",h.join(" ")),n.setAttribute("data-edit-icon-current",i.length===1?i[0]:i[i.length-1]),!0},oo=(n,o)=>{for(let r of["data-background","data-bg","data-background-image"])n.hasAttribute(r)&&n.setAttribute(r,o);let i=(n.getAttribute("style")??"").replace(/background-image\s*:[^;]*;?/gi,"").trim();n.setAttribute("style",`${i?i.replace(/;?$/,";"):""}background-image:url('${o}')`)},ao=(n,o)=>{let i=0;for(let r of n.querySelectorAll("[data-edit-list]")){let h=r.getAttribute("data-edit-list");if(!Object.hasOwn(o,h))continue;let l;try{l=JSON.parse(o[h])}catch{continue}if(!Array.isArray(l)||l.length===0)continue;let m=new Map;for(let C of[...r.children])C.hasAttribute("data-edit-item")&&(m.set(C.getAttribute("data-edit-item"),C),r.removeChild(C));if(m.size===0)continue;let k=m.values().next().value;for(let C of l){let I=m.get(String(C));if(I){r.appendChild(I);continue}let z=k.cloneNode(!0);z.setAttribute("data-edit-item",String(C)),r.appendChild(z)}i++}return i},io=(n,o)=>{let i=0;ao(n,o),ka(n,o);for(let r of n.querySelectorAll("[data-edit]")){let h=r.getAttribute("data-edit")??"";if(!h.startsWith(Qn))continue;let l=h.slice(Qn.length);Object.hasOwn(o,l)&&(Yt(r,o[l]),i++)}for(let r of n.querySelectorAll("[data-edit-img]")){let h=(r.getAttribute("data-edit-img")??"").replace(/^setting:/,"");Object.hasOwn(o,h)&&(Yt(r,o[h]),o[h]?r.dataset.editPreview=o[h]:delete r.dataset.editPreview,i++);for(let[l,m]of[["Alt","alt"],["Title","title"],["Srcset","srcset"]])if(Object.hasOwn(o,h+l)){let k=o[h+l];k===""&&m!=="alt"?r.removeAttribute(m):r.setAttribute(m,k),i++}}for(let r of n.querySelectorAll("[data-edit-svg]")){let h=(r.getAttribute("data-edit-svg")??"").replace(/^setting:/,""),l=o[h];!Object.hasOwn(o,h)||String(l??"").trim()===""||to(r,l)&&i++}for(let r of n.querySelectorAll("[data-edit-icon]")){let h=(r.getAttribute("data-edit-icon")??"").replace(/^setting:/,""),l=o[h];!Object.hasOwn(o,h)||l===""||no(r,l)&&i++}for(let r of n.querySelectorAll("[data-edit-bg]")){let h=(r.getAttribute("data-edit-bg")??"").replace(/^setting:/,""),l=o[h];!Object.hasOwn(o,h)||l===""||(oo(r,l),i++)}for(let r of n.querySelectorAll("[data-edit-href]")){let h=r.getAttribute("data-edit-href");Object.hasOwn(o,h)&&(r.setAttribute("href",o[h]),i++)}return i},ro=(n,{limit:o=12,debounce:i=60}={})=>{let r=n.defaultView??(typeof window>"u"?null:window);if(!r?.MutationObserver)return null;let h=n.querySelectorAll("[data-edit], [data-edit-img], [data-edit-href]");if(h.length===0)return null;let l=new Map;for(let P of h)l.set(P,{words:P.hasAttribute("data-edit")?me(P):null,src:P.getAttribute("src"),href:P.hasAttribute("data-edit-href")?P.getAttribute("href"):null});let m=0,k=!1,C=null,I=()=>{if(C=null,!n.body?.classList?.contains("editing")){m++,k=!0;for(let[P,N]of l)P.isConnected&&(N.words!==null&&me(P)!==N.words&&Vt(P,N.words),N.src!==null&&P.getAttribute("src")!==N.src&&(P.setAttribute("src",N.src),P.removeAttribute("srcset")),N.href!==null&&P.getAttribute("href")!==N.href&&P.setAttribute("href",N.href));z.takeRecords(),k=!1,m>=o&&(z.disconnect(),console.warn(`[live-edit] this page keeps rewriting itself; the client's content was put back ${m} times and is now being left alone.`))}},z=new r.MutationObserver(()=>{k||C||m>=o||(C=r.setTimeout(I,i))});for(let P of h)z.observe(P,{characterData:!0,childList:!0,subtree:!0,attributes:!0,attributeFilter:["src","srcset","href"]});return z},so=(n,o)=>{let i=`[data-style="${n}"]`,r="",h="";for(let[l,m]of Object.entries(o??{}))if(!(m===""||m===null||m===void 0)){if(l==="hidden"){r+=`body:not(.editing) ${i}{display:none !important}`,r+=`body.editing ${i}{opacity:.45}`;continue}h+={backgroundImage:`background-image:url('${m}') !important;background-size:cover !important;background-position:center !important;`,background:`background:${m} !important;`,textColor:`color:${m} !important;`,fontSize:`font-size:${m}px !important;`,radius:`border-radius:${m}px !important;`,paddingX:`padding-left:${m}px !important;padding-right:${m}px !important;`,paddingY:`padding-top:${m}px !important;padding-bottom:${m}px !important;`}[l]??""}return h===""?r:r+`${i}{${h}}`},lo=(n,o)=>{let i=Object.entries(o??{}).map(([m,k])=>so(m,k)).join("");if(i==="")return 0;let r="live-edit-styles",h=n.getElementById?.(r)??n.querySelector?.(`#${r}`)??null,l=h??n.createElement("style");return l.id=r,l.textContent=i,h||(n.head??n.body)?.appendChild(l),Object.keys(o).length},co=async({snapshot:n,locale:o})=>{let i=String(n).replace(/\/$/,""),r=await De(()=>fetch(`${i}/current.json`).then(l=>{if(!l.ok)throw Ht(`Pointer answered ${l.status}`,l.status);return l.json()}));if(!r.version)return{settings:{},styles:{}};let h=o??"en";return De(async()=>{let l=await fetch(`${i}/v${r.version}/${h}.json`);if(!l.ok)throw Ht(`Version answered ${l.status}`,l.status);return l.json()})},po=async({base:n,site:o,key:i,locale:r})=>{let h=`${String(n).replace(/\/$/,"")}/${o}/content${r?`?locale=${encodeURIComponent(r)}`:""}`;return De(async()=>{let l=await fetch(h,{headers:{Authorization:`Bearer ${i}`,Accept:"application/json"}});if(!l.ok)throw Ht(`Content service answered ${l.status}`,l.status);return l.json()})},eo=async()=>{let n=typeof window<"u"?window.liveEditContent:null;if(!n)return;let o=null,i=null;try{let r=await uo(n);r&&(r.styleProps&&(window.liveEditStyleProps=r.styleProps),typeof r.pending=="number"&&r.styleProps&&(window.liveEditPublishing={...window.liveEditPublishing??{},pending:r.pending,version:r.version??null}),o=io(document,r.settings??{}),lo(document,r.styles??{}),window.liveEditStyles=r.styles??{},ro(document))}catch(r){i=r,console.warn("[live-edit] serving the words already in the page:",r.message)}Ta({applied:o,failed:i?i.message:null})},Ta=n=>{window.liveEditContentDone=n,document.dispatchEvent(new CustomEvent("live-edit:content",{detail:n}))},uo=async n=>{if(n.snapshot)try{return await co(n)}catch(o){let i=o.message.includes("fetch")?" (if the files are on another origin, the bucket or CDN must allow cross-origin reads)":"";if(!n.base)throw new Error(o.message+i);console.warn("[live-edit] falling back to the content API:",o.message+i)}return n.base&&n.site&&n.key?po(n):null};typeof document<"u"&&(document.readyState==="loading"?document.addEventListener("DOMContentLoaded",eo):eo())});var mo={};Ot(mo,{collectFromFragment:()=>go,contentConfigFor:()=>Ia,currentSession:()=>Oa,forget:()=>Na,requestLink:()=>$a,store:()=>fo,stored:()=>bo});var Jt,ho,go,fo,bo,Na,$a,Oa,Ia,wo=Fe(()=>{Jt="kb_session",ho="kb_session=",go=(n=window)=>{let o=n.location?.hash??"",i=o.indexOf(ho);if(i===-1)return null;let r=decodeURIComponent(o.slice(i+ho.length).split("&")[0]);if(r==="")return null;fo(r,n);let h=o.slice(0,i).replace(/[#&]$/,"");return n.history?.replaceState?.(null,"",n.location.pathname+n.location.search+h),r},fo=(n,o=window)=>{try{o.sessionStorage?.setItem(Jt,n)}catch{}},bo=(n=window)=>{try{return n.sessionStorage?.getItem(Jt)??null}catch{return null}},Na=(n=window)=>{try{n.sessionStorage?.removeItem(Jt)}catch{}},$a=async({base:n,site:o},i,r=window)=>(await fetch(`${String(n).replace(/\/$/,"")}/sign-in`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({site:o,email:i,return_to:r.location.origin+r.location.pathname})})).ok,Oa=(n=window)=>go(n)??bo(n),Ia=(n,o)=>{let i={base:n.api,site:n.site,locale:n.locale??null};return o?{...i,key:o,snapshot:null}:{...i,key:n.key,snapshot:n.snapshot??null}}});var aa=`
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
`,ia=`
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
`,A=(n,o,i)=>{let r=document.createElement(n);return o&&(r.className=o),i!==void 0&&(r.textContent=i),r};function mn(){let n=document.createElement("style");n.id="live-edit-page-css",n.textContent=ia,document.head.append(n);let o=document.createElement("div");o.id="live-edit-ui",document.body.append(o);let i=o.attachShadow({mode:"open"}),r=document.createElement("style");r.textContent=aa,i.append(r);let h=window.liveEditToolbar??{},l=A("div","le-toolbar"),m=window.liveEditEditor?.console??null,k=A(m?"a":"span","le-mark");k.innerHTML='<svg width="16" height="16" viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="3" width="20" height="20" rx="3" fill="none" stroke="#0B0C0F" stroke-width="2.5"/><path d="M16 15 L16 30 L19.6 26.4 L22.2 31.2 L24.6 30 L22 25.3 L27 25.3 Z" fill="#3148F5" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>',m&&(k.href=m,k.target="_blank",k.rel="noopener",k.title="Your dashboard: licence, editors, settings",k.setAttribute("aria-label","Open your dashboard"));let C=A("span","le-status le-when-roomy"),I=A("span","le-dot"),z=A("span",null,"");C.append(I,z),l.append(k,C);let P=window.liveEditEditor??null;if(P?.greeting){let F=A("span","le-hello le-when-roomy","Welcome "+P.greeting);l.append(F)}let N=null,W=h.locales??{};Object.keys(W).length>1&&(N=A("select","le-locale"),N.title="Language you are editing",Object.entries(W).forEach(([F,U])=>{let Z=A("option",null,U);Z.value=F,Z.selected=F===(h.locale??"en"),N.append(Z)}),N.addEventListener("change",()=>{window.location.search="?locale="+N.value}),l.append(N));let $=A("button","le-bar-btn","Edit site");$.type="button";let B=F=>'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"'+(F?' style="transform: scaleX(-1)"':"")+'><path d="M9 14 4 9l5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 9h7a6 6 0 0 1 0 12H8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',x=A("button","le-round");x.type="button",x.title="Undo the last change you have not published",x.setAttribute("aria-label","Undo"),x.innerHTML=B(!1);let q=A("button","le-round");q.type="button",q.title="Put back what you just undid",q.setAttribute("aria-label","Redo"),q.innerHTML=B(!0);let Q=A("div","le-pages");Q.hidden=!0,Q.setAttribute("role","group"),Q.setAttribute("aria-label","Pages");let V=A("select","le-lang");V.hidden=!0,V.title="Which language you are editing",V.setAttribute("aria-label","Language");let J=A("button","le-bar-btn le-when-roomy","Changes");J.type="button",J.title="Everything you have changed and not published";let oe=A("button","le-bar-btn le-when-roomy","Preview");oe.type="button",oe.title="See the page the way a visitor will",oe.hidden=!0;let y=A("button","le-publish");y.type="button",y.title="Put your changes live",y.hidden=!0;let Ee=A("span",null,"Publish"),ae=A("span","le-publish-count");if(ae.hidden=!0,y.append(Ee,ae),l.append(A("span","le-sep"),$,x,q,A("span","le-sep"),Q,V,J,oe,y),(h.links??[]).forEach(F=>{let U=A("a","le-btn-ghost",F.label);U.href=F.href,F.title&&(U.title=F.title),l.append(U)}),h.logout?.href)if((h.logout.method??"get").toLowerCase()==="post"){let F=document.createElement("form");F.method="POST",F.action=h.logout.href;let U=document.createElement("input");U.type="hidden",U.name="_token",U.value=document.body.dataset.csrf??"";let Z=A("button","le-btn-ghost","Log out");Z.type="submit",F.append(U,Z),l.append(F)}else{let F=A("a","le-btn-ghost","Log out");F.href=h.logout.href,l.append(F)}let le=A("div","le-drawer");le.setAttribute("role","dialog"),le.setAttribute("aria-modal","true"),le.setAttribute("aria-label","Edit content");let Ge=A("div","le-drawer-head"),Se=A("div","le-tabs");Se.setAttribute("role","tablist");let Xe={};["Edit","Changes","History"].forEach(F=>{let U=A("button","le-tab",F);U.type="button",U.dataset.tab=F,U.setAttribute("role","tab"),F==="Edit"&&U.classList.add("is-on"),Xe[F]=U,Se.append(U)});let Ce=A("button","le-close","\xD7");Ce.type="button",Ce.setAttribute("aria-label","Close"),Ge.append(Se,Ce);let qe=A("div","le-subject"),Qe=A("div","le-trail"),Ae=A("div","le-title","Text");qe.append(A("div","le-eyebrow","Selected"),Qe,Ae);let Ze=A("div","le-fields"),Le=A("div","le-foot"),Te=A("button","le-btn-danger le-start le-hidden","Delete");Te.type="button";let Ne=A("button","le-btn-outline","Cancel");Ne.type="button";let ue=A("button","le-btn","Save changes");ue.type="button",Le.append(Te,Ne,ue),le.append(Ge,qe,Ze,Le);let he=A("button","le-handle");he.type="button",he.setAttribute("aria-label","Edit this link"),he.innerHTML="&#9998;";let de=A("button","le-handle le-handle-bg");de.type="button",de.setAttribute("aria-label","Replace this background image"),de.title="Replace background image",de.textContent="Replace background";let $e=A("div","le-hover"),Me=A("span","le-hover-label");return $e.append(Me),i.append(l,le,he,de,$e),{root:o,shadow:i,toolbar:l,toggleButton:$,undoButton:x,redoButton:q,pageSwitcher:Q,languagePicker:V,statusText:z,dot:I,localeSelect:N,drawer:le,drawerFoot:Le,drawerTabs:Xe,drawerSubject:qe,drawerTitle:Ae,drawerTrail:Qe,drawerFields:Ze,drawerDelete:Te,publishButton:y,publishLabel:Ee,publishCount:ae,previewButton:oe,changesButton:J,closeButton:Ce,cancelButton:Ne,saveButton:ue,linkHandle:he,bgHandle:de,hoverBox:$e,hoverLabel:Me,toast:(F,U=1800)=>{let Z=A("div","le-toast",F);i.append(Z),setTimeout(()=>Z.style.opacity="0",U),setTimeout(()=>Z.remove(),U+600)},modal:({title:F,subtitle:U,size:Z="",dismissable:Oe=!0}={})=>{let K=A("div","le-scrim"),G=A("div",`le-modal ${Z}`.trim());G.setAttribute("role","dialog"),G.setAttribute("aria-modal","true");let et=A("div","le-modal-heading"),tt=A("div","le-modal-title",F??""),Ie=A("div","le-modal-sub",U??"");Ie.hidden=!U,et.append(tt,Ie),G.setAttribute("aria-label",F??"Dialog");let ge=A("button","le-close","\xD7");ge.type="button",ge.setAttribute("aria-label","Close");let nt=A("div","le-modal-head");nt.append(et,ge);let Ue=A("div","le-modal-tabs");Ue.hidden=!0;let ot=A("div","le-modal-body"),_e=A("div","le-modal-foot");_e.hidden=!0,G.append(nt,Ue,ot,_e),K.append(G);let We=document.activeElement,at=!1,Pe=()=>{at||(at=!0,document.removeEventListener("keydown",we,!0),K.remove(),We?.focus?.(),fe.dismissable=!0)},we=ne=>{ne.key==="Escape"&&fe.dismissable&&(ne.stopPropagation(),Pe())},fe={dismissable:Oe};return ge.addEventListener("click",Pe),K.addEventListener("mousedown",ne=>{ne.target===K&&fe.dismissable&&Pe()}),document.addEventListener("keydown",we,!0),i.append(K),ge.focus(),{card:G,body:ot,foot:_e,tabs:Ue,close:Pe,title:ne=>tt.textContent=ne,subtitle:ne=>{Ie.textContent=ne??"",Ie.hidden=!ne},allowDismiss:ne=>{fe.dismissable=ne,ge.hidden=!ne}}}}}var ct=n=>Math.min(Math.max(Math.round(n),1),4e3),It=n=>{if(!n)return null;let o=Number(n.naturalWidth??0),i=Number(n.naturalHeight??0),r=n.getBoundingClientRect?.(),h=r&&r.width>=1&&r.height>=1?{width:ct(r.width),height:ct(r.height),exact:!1}:null;return o>=1&&i>=1&&(h===null||o>=r.width*2&&i>=r.height*2)?{width:ct(o),height:ct(i),exact:!0}:h},wn=(n,o)=>{let i=n.width,r=i/o;return r>n.height&&(r=n.height,i=r*o),{x:(n.width-i)/2,y:(n.height-r)/2,width:i,height:r}},yn=(n,o,i)=>{let r=i/(o||1);return{x:Math.max(0,Math.round(n.x*r)),y:Math.max(0,Math.round(n.y*r)),width:Math.max(1,Math.round(n.width*r)),height:Math.max(1,Math.round(n.height*r))}},vn=(n,o,i)=>{let r=(h,l)=>Math.max(0,Math.min(h,l));return{...n,x:r(n.x+o.x,i.width-n.width),y:r(n.y+o.y,i.height-n.height)}};var xn=n=>Object.entries(n??{}).filter(([,o])=>String(o??"")!==""),kn=n=>[...n??[]].filter(o=>o.value!==(o.dataset?.imgAttrWas??""));var Bt="kb_verify",En=(n,o=globalThis)=>{try{o.sessionStorage?.setItem(Bt,JSON.stringify(n))}catch{}},Sn=(n=globalThis)=>{try{let o=n.sessionStorage?.getItem(Bt);return n.sessionStorage?.removeItem(Bt),o?JSON.parse(o):null}catch{return null}},ra=(n,o)=>!o?.attr||!o?.marker?null:n.querySelector(`[${o.attr}="${o.marker.replace(/"/g,'\\"')}"]`),sa=(n,o)=>{if(!n)return null;if(o==="image"){let r=la(n);return r?r.getAttribute("src"):null}if(o==="href")return n.getAttribute("href");if(o==="icon")return n.getAttribute("class")??"";let i=[...n.childNodes].filter(r=>r.nodeType===3).map(r=>r.textContent).join(" ").trim();return pe(i===""?n.textContent:i)},la=n=>n.tagName?.toLowerCase()==="img"?n:n.querySelector("img")??n.parentElement?.querySelector("img")??null,pe=n=>String(n??"").replace(/\s+/g," ").trim(),da=(n,o,i)=>{if(i===null)return!1;if(n==="image")return Pt(i)!==""&&Pt(i)===Pt(o);if(n==="icon"){let r=pe(o).split(" ").filter(Boolean),h=pe(i).split(" ").filter(Boolean);return r.length>0&&r.every(l=>h.includes(l))}return n==="href"?pe(i)===pe(o)||pe(i).endsWith(pe(o)):pe(i)===pe(o)},Pt=n=>String(n??"").split(/[?#]/)[0].split("/").filter(Boolean).pop()??"",Cn=(n,o)=>{if(!o?.kind)return null;let i=ra(n,o);if(!i)return null;let r=sa(i,o.kind);return{ok:da(o.kind,o.value,r),wanted:o.value,saw:r,kind:o.kind}};ht();var vo="whole",Pa=()=>{let n=window.liveEditApi;n?.base&&n?.site&&Promise.resolve().then(()=>(Wt(),_t)).then(i=>i.ensureBackgroundsAreFound({base:n.base,site:n.site,key:n.token})).catch(i=>console.warn("[live-edit] could not look for backgrounds:",i.message)),window.liveEditContent||Promise.resolve().then(()=>(ft(),gt)).then(i=>i.defendContent(document)).catch(i=>console.warn("[live-edit] could not guard this page's content:",i.message));let o=document.querySelector("[data-login-modal]");if(o){let i=()=>{o.classList.remove("hidden"),o.classList.add("flex"),o.querySelector("input[type=email]")?.focus()},r=()=>{o.classList.add("hidden"),o.classList.remove("flex")};document.querySelectorAll("[data-login-open]").forEach(h=>{h.addEventListener("click",l=>{l.preventDefault(),i()})}),o.querySelector("[data-login-close]")?.addEventListener("click",r),o.addEventListener("click",h=>{h.target===o&&r()}),o.dataset.error==="1"&&i()}if(document.body.hasAttribute("data-admin")){let i=document.body.dataset.csrf,r=()=>{sessionStorage.setItem("tb_scroll",String(window.scrollY)),window.location.reload()},h=sessionStorage.getItem("tb_scroll");h!==null&&(sessionStorage.removeItem("tb_scroll"),window.scrollTo(0,Number(h)));let l=mn(),m=e=>l.toast(String(e??"").trim()||"Something went wrong.",9e3),k=sessionStorage.getItem("tb_toast");k&&(sessionStorage.removeItem("tb_toast"),l.toast(k));let C=()=>new Promise(e=>{if(!window.liveEditContent||window.liveEditContentDone){e(window.liveEditContentDone??null);return}let t=a=>e(a?.detail??null);document.addEventListener("live-edit:content",t,{once:!0}),setTimeout(()=>e(null),5e3)});C().then(e=>{let t=Sn();if(e?.failed){l.toast(t?"Saved \u2014 but this page could not load the latest content, so it may be showing an older version. Reload to try again.":"This page could not load your saved content, so it is showing the original. Nothing has been lost \u2014 reload to try again.",9e3);return}let a=t?Cn(document,t):null;a&&!a.ok&&(console.warn("[live-edit] the change was saved but the page still shows:",a.saw,`
  expected:`,a.wanted),l.toast("Saved \u2014 but this page is still showing the old version. Your change is stored; reload, and tell us if it stays this way.",9e3))});let I=e=>{sessionStorage.setItem("tb_toast",e),r()},z=(e,t=null,a=null)=>{let s=window.__liveEditReact;if(!s){I(e);return}let p=t!==null&&(s.apply??s.set)(t,a);l.toast(e),p||s.refresh()},{drawer:P,drawerTabs:N,drawerSubject:W,drawerTitle:$,drawerTrail:B,drawerFields:x,drawerDelete:q,toggleButton:Q,statusText:V,linkHandle:J,bgHandle:oe}=l,y=null,Ee=(e,t,a,s,p=!1)=>{let g=document.createElement("label");g.className="le-field",g.append(t);let c=e==="icon"?window.liveEditIcons:(window.liveEditSelects??{})[e],d=document.querySelector("[data-icon-templates]");if(e==="icon"&&Array.isArray(c)&&d){let u=document.createElement("input");u.type="hidden",u.name=e,u.value=a??"";let w=document.createElement("div");return w.className="le-icons",c.forEach(v=>{let b=document.createElement("button");b.type="button",b.title=v,b.dataset.iconChoice=v,b.className="le-icon"+(v===u.value?" is-active":"");let E=d.querySelector(`template[data-icon="${v}"]`);E?b.append(E.content.cloneNode(!0)):b.textContent=v,b.addEventListener("click",()=>{u.value=v,w.querySelectorAll("[data-icon-choice]").forEach(S=>{let L=S.dataset.iconChoice===v;S.className="le-icon"+(L?" is-active":"")}),u.dispatchEvent(new Event("input",{bubbles:!0}))}),w.append(b)}),g.append(u,w),g}if(Array.isArray(c)&&c.length<=6){let u=document.createElement("input");u.type="hidden",u.name=e,u.value=a??c[0];let w=document.createElement("div");return w.className="le-choices",c.forEach(v=>{let b=document.createElement("label");b.className="le-choice"+(v===u.value?" is-selected":"");let E=document.createElement("input");E.type="radio",E.name="le-choice-"+e,E.checked=v===u.value,E.addEventListener("change",()=>{u.value=v,w.querySelectorAll(".le-choice").forEach(S=>S.classList.remove("is-selected")),b.classList.add("is-selected"),u.dispatchEvent(new Event("input",{bubbles:!0}))}),b.append(E,document.createTextNode(v)),w.append(b)}),g.append(u,w),g}let f;if(Array.isArray(c)?(f=document.createElement("select"),c.forEach(u=>{let w=document.createElement("option");w.value=u,w.textContent=u,w.selected=u===a,f.append(w)})):(f=document.createElement("textarea"),f.rows=s,f.value=a??""),f.name=e,f.className="le-input",f.tagName==="TEXTAREA"){f.classList.add("le-prose");let u=()=>{f.style.height="auto",f.style.height=Math.min(f.scrollHeight+2,420)+"px"};f.addEventListener("input",u),requestAnimationFrame(u)}if(p&&f.tagName==="TEXTAREA"){let u=document.createElement("div");u.className="le-tools";let w=(E,S)=>{let L=f.selectionStart,T=f.selectionEnd,R=f.value.slice(L,T)||"text";f.setRangeText(E+R+S,L,T,"select"),f.dispatchEvent(new Event("input",{bubbles:!0})),f.focus()},v=(E,S,L,T="")=>{let R=document.createElement("button");return R.type="button",R.title=S,R.textContent=E,R.className="le-tool "+T,R.addEventListener("click",L),R};u.append(v("B","Bold",()=>w("**","**"),"is-bold"),v("I","Italic",()=>w("*","*"),"is-italic"),v("Link","Insert link",()=>{let E=window.prompt("Link URL (https://\u2026 or /page):");if(!E)return;let S=f.selectionStart,L=f.selectionEnd,T=f.value.slice(S,L)||"link text";f.setRangeText("["+T+"]("+E+")",S,L,"select"),f.dispatchEvent(new Event("input",{bubbles:!0})),f.focus()}));let b=document.createElement("span");b.className="le-hint",b.textContent="**bold** \xB7 *italic* \xB7 [text](url)",u.append(b),g.append(u)}return g.append(f),g},ae=e=>{let t=e.tagName;if(e.dataset.editRegion)return e.dataset.editRegion;if(t==="IMG")return"Image";if(t==="BUTTON")return"Button";if(t==="A")return/\b(btn|button)\b/i.test(String(e.className))?"Button":"Link";if(/^H[1-6]$/.test(t))return"Heading";if(t==="P")return"Paragraph";if(t==="LI")return"List item";if(t==="UL"||t==="OL")return"List";if(t==="NAV")return"Menu";if(t==="HEADER")return"Header";if(t==="FOOTER")return"Footer";if(t==="FORM")return"Form";if(e.hasAttribute("data-edit-item"))return"Card";if(e.hasAttribute("data-edit-icon"))return"Icon";if(e.hasAttribute("data-edit-svg"))return"Drawing";if(e.hasAttribute("data-edit"))return"Text";if(e.hasAttribute("data-has-bg")||e.hasAttribute("data-edit-bg"))return"Background";if(t==="SECTION"||t==="MAIN"||t==="ARTICLE")return"Section";let a=e.getBoundingClientRect();return a.width>window.innerWidth*.6&&a.height>180?"Section":"Group"},le=({hint:e="PNG, JPG or WEBP, or drag one here",onFile:t}={})=>{let a=document.createElement("label");a.className="le-upload";let s=document.createElement("div");s.className="le-upload-inner";let p=document.createElement("span");p.className="le-upload-icon",p.textContent="\u2191";let g=document.createElement("span");g.className="le-upload-text";let c=document.createElement("span");c.className="le-upload-title",c.textContent="Upload from your computer";let d=document.createElement("span");d.className="le-upload-hint",d.textContent=e,g.append(c,d);let f=document.createElement("span");f.className="le-upload-btn",f.textContent="Choose file",s.append(p,g,f);let u=document.createElement("input");u.type="file",u.accept="image/*";let w=v=>{v&&(d.textContent=v.name,t?.(v))};return u.addEventListener("change",()=>w(u.files[0])),["dragenter","dragover"].forEach(v=>a.addEventListener(v,b=>{b.preventDefault(),a.classList.add("is-dragover")})),["dragleave","drop"].forEach(v=>a.addEventListener(v,b=>{b.preventDefault(),a.classList.remove("is-dragover")})),a.addEventListener("drop",v=>{let b=v.dataTransfer?.files?.[0];if(!b)return;let E=new DataTransfer;E.items.add(b),u.files=E.files,w(b)}),a.append(s,u),a},Ge=e=>{let t=String(e).match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);return!t||t[4]!==void 0&&Number(t[4])===0?"":"#"+[1,2,3].map(a=>Number(t[a]).toString(16).padStart(2,"0")).join("")},Se=e=>Rt(e),Xe={background:"Background colour",backgroundImage:"Background image",textColor:"Text colour",fontSize:"Text size",paddingY:"Space above and below",paddingX:"Space left and right",radius:"Corner rounding"},Ce=(e,t,a,s)=>{let p=document.createElement("label");p.className="le-field";let g=e.replace(/([A-Z])/g," $1").toLowerCase(),c=Xe[e]??g.charAt(0).toUpperCase()+g.slice(1);if(p.append(c),t==="toggle"){let d=document.createElement("div");d.className="le-row";let f=document.createElement("input");f.type="checkbox",f.checked=a==="1",f.dataset.styleProp=e;let u=document.createElement("span");u.className="le-hint",u.textContent="Hidden from visitors. You still see it, dimmed, while editing.",d.append(f,u);let w=s?ae(s).toLowerCase():"section";return p.replaceChildren(`Hide this ${w}`,d),p.className="le-field le-divided",p}if(t==="color"){let d=document.createElement("div");d.className="le-row";let f=document.createElement("input");f.type="color";let u=s?Ge(getComputedStyle(s)[e==="textColor"?"color":"backgroundColor"]):"";f.value=a||u||"#ffffff",f.dataset.styleProp=e,f.className="le-color";let w=document.createElement("label");w.className="le-default";let v=document.createElement("input");v.type="checkbox",v.checked=!a,f.addEventListener("input",()=>v.checked=!1),w.append(v,"Use default"),d.append(f,w),p.append(d)}else if(t==="url"){let d=document.createElement("input");d.type="text",d.value=a??"",d.placeholder="Paste an image URL, or upload below",d.dataset.styleProp=e,d.className="le-input";let f=document.createElement("img");f.className="le-thumb",f.alt="";let u=T=>{f.src=T||"",f.style.display=T?"":"none"},w=a?"":Se(s),v=document.createElement("span");v.className="le-hint";let b=(T,R)=>{v.textContent=T?R?"Current image (from the theme) \u2014 upload or paste a link to replace it":"Replacing with this image":"No image set",v.title=T||""};u(a||w),b(a||w,!a&&!!w),d.addEventListener("input",()=>{let T=d.value.trim();u(T||w),b(T||w,!T&&!!w)});let E=le({onFile:async T=>{u(URL.createObjectURL(T));let R=new FormData;R.append("file",T);try{let M=await(await D("/live-edit/upload",{method:"POST",body:R})).json();d.value=M.url,u(M.url),b(M.url,!1),d.dispatchEvent(new Event("input",{bubbles:!0}))}catch(X){m(K(X,"save that"))}}}),S=O("div","le-ways"),L=O("button","le-btn le-wide","Replace background");L.type="button",L.addEventListener("click",()=>an(s,async T=>{let{url:R,file:X,credit:M}=T,j=R;if(X){u(URL.createObjectURL(X));let _=new FormData;_.append("file",X);try{j=(await(await D("/live-edit/upload",{method:"POST",body:_})).json()).url}catch(Y){l.toast(K(Y,"save that"));return}}j&&(d.value=j,u(j),b(j,!1),d.dispatchEvent(new Event("input",{bubbles:!0})),d.dataset.kbCreditFor=j,d.dataset.kbCredit=JSON.stringify({credit:M??"",creditBy:T.creditBy??"",creditUrl:T.creditUrl??"",creditSource:T.creditSource??"",creditSourceUrl:T.creditSourceUrl??""}),M&&l.toast(M,4e3))},"Free photos","background")),S.append(L),d.hidden=!0,E.hidden=!0,p.append(S,d,E,f,v)}else{let d=document.createElement("input");d.type="number",d.min=0,d.max=400,d.value=a??"",d.placeholder="default",d.dataset.styleProp=e,d.className="le-input",p.append(d)}return p},qe={background:"color",backgroundImage:"url",textColor:"color",fontSize:"px",paddingX:"px",paddingY:"px",radius:"px",hidden:"toggle"},Qe=(e,t,a)=>{y.styleKey=e;let s=(window.liveEditStyles??{})[e]??{},p=document.createElement("div");p.className="le-section-heading",p.textContent="Style",x.append(p);let g=0;if((a?qn(a,t):t).forEach(c=>{let d=(window.liveEditStyleProps??{})[c]??qe[c];d&&(x.append(Ce(c,d,s[c],a)),g++)}),g===0){let c=document.createElement("div");c.className="le-hint",c.textContent="Nothing on this element can be restyled.",x.append(c)}},Ae=document.createElement("style");document.head.append(Ae);let Ze=(e,t)=>{let a=`[data-style="${e}"]`,s="",p="";for(let[g,c]of Object.entries(t))c&&(s+={hidden:"opacity:.45 !important;",backgroundImage:`background-image:url('${c}') !important;background-size:cover !important;background-position:center !important;`,background:`background:${c} !important;`,textColor:`color:${c} !important;`,fontSize:`font-size:${c}px !important;`,radius:`border-radius:${c}px !important;`,paddingX:`padding-left:${c}px !important;padding-right:${c}px !important;`,paddingY:`padding-top:${c}px !important;padding-bottom:${c}px !important;`}[g]??"",g==="paddingY"&&(p+=`section${a}>div{padding-top:0 !important;padding-bottom:0 !important}`));return s?p+`${a}{${s}}`:p},Le=()=>{if(!y?.styleKey)return;let e=Ne(),t=y.styleKey,a=Ze(t,e),s=Rn,p=(window.liveEditStyles??{})[t]??{};for(let[g,c]of Object.entries(e))zn(g,c,p)&&(g==="hidden"&&(a+=`body.editing [data-style="${t}"]{opacity:1 !important}`),s[g]&&(a+=`[data-style="${t}"]{${s[g]}:revert-layer !important}`),g==="paddingY"&&(a+=`[data-style="${t}"]{padding-top:revert-layer !important;padding-bottom:revert-layer !important}section[data-style="${t}"]>div{padding-top:revert-layer !important;padding-bottom:revert-layer !important}`),g==="paddingX"&&(a+=`[data-style="${t}"]{padding-left:revert-layer !important;padding-right:revert-layer !important}`));Ae.textContent=a},Te=()=>{Ae.textContent=""};x.addEventListener("input",()=>{y&&(y.dirty=!0),Le()}),x.addEventListener("change",()=>{y&&(y.dirty=!0),Le()});let Ne=()=>{let e={};return x.querySelectorAll("[data-style-prop]").forEach(t=>{if(t.type==="checkbox")e[t.dataset.styleProp]=t.checked?"1":"";else if(t.type==="color"){let a=t.closest("div").querySelector("input[type=checkbox]").checked;e[t.dataset.styleProp]=a?"":t.value}else e[t.dataset.styleProp]=t.value;if(t.dataset.kbCredit&&t.dataset.kbCreditFor===t.value)try{Object.assign(e,JSON.parse(t.dataset.kbCredit))}catch{}}),e},ue=null,he=()=>{!ue||!y||y.dirty||!P.classList.contains("is-open")||Z!=="Edit"||ue.isConnected&&$e(ue)},de=e=>e.dataset.editRegion?e.dataset.editRegion:e.dataset.editLabel?e.dataset.editLabel:e.querySelector(":scope > [data-style-edit]")?.dataset.editLabel??ae(e),$e=e=>{if(ue=e,e.dataset.editImg!==void 0)St(e);else if(e.dataset.edit!==void 0)it(e);else if(e.dataset.svgEdit!==void 0||e.dataset.editSvg!==void 0)sn(e);else if(e.dataset.editHref!==void 0)xt(e);else if(e.dataset.style!==void 0){let t=e.querySelector(":scope > [data-style-edit]");Et(t??e)}},Me=()=>new Promise(e=>{let t=l.modal({title:"Discard what you typed?",subtitle:"Your changes to this element have not been saved.",size:"is-narrow"}),a=!1,s=c=>{a||(a=!0,t.close(),e(c))},p=O("button","le-btn-outline","Keep editing");p.type="button",p.addEventListener("click",()=>s(!1));let g=O("button","le-btn-danger","Discard");g.type="button",g.addEventListener("click",()=>s(!0)),t.foot.hidden=!1,t.foot.append(p,g),p.focus(),t.card.querySelector(".le-close")?.addEventListener("click",()=>s(!1)),t.card.parentElement?.addEventListener("mousedown",c=>{c.target===t.card.parentElement&&s(!1)}),document.addEventListener("keydown",function c(d){d.key==="Escape"&&(document.removeEventListener("keydown",c,!0),s(!1))},!0)}),bt=e=>{if(!y?.dirty){e();return}Me().then(t=>{t&&e()})},mt=e=>bt(()=>{Te(),$e(e)}),F=null,U=e=>{let t=F;F=e??null;let a=[],s=e?.parentElement;for(;s&&s!==document.body;)s.dataset&&(s.dataset.edit!==void 0||s.dataset.style!==void 0)&&a.unshift(s),s=s.parentElement;let p=[];a.forEach(c=>{let d=de(c);if(p.length&&p[p.length-1].label===d){p[p.length-1].node=c;return}p.push({node:c,label:d})});let g=p.slice(-3);t&&t!==e&&document.contains(t)&&!g.some(c=>c.node===t)&&g.unshift({node:t,label:`\u2190 ${de(t)}`}),B.replaceChildren(),B.classList.toggle("is-visible",g.length>0),g.forEach((c,d)=>{let f=c.node;d>0&&B.append("\u203A");let u=document.createElement("button");u.type="button",u.textContent=c.label,u.className="le-crumb",u.addEventListener("click",()=>mt(f)),B.append(u)})},Z="Edit",Oe=e=>{Z=e,Object.entries(N).forEach(([t,a])=>{a.classList.toggle("is-on",t===e),a.setAttribute("aria-selected",t===e?"true":"false")}),W.classList.toggle("le-hidden",e!=="Edit"),l.drawerFoot.classList.toggle("le-hidden",e!=="Edit"),e==="Changes"&&Pe(),e==="History"&&ko()};Object.entries(N).forEach(([e,t])=>{t.addEventListener("click",()=>{if(e==="Edit"){Oe(e);return}bt(()=>Oe(e)),P.classList.contains("is-open")||yt()})});let K=(e,t)=>{console.warn(`[live-edit] ${t}:`,e);let a=String(e?.message??"");return/failed to fetch|networkerror|load failed/i.test(a)?"No connection just now. Nothing has been lost; try again in a moment.":/\b401\b|\b403\b|unauthor|forbidden/i.test(a)?"Your editing session has expired. Reload the page to carry on.":/\b429\b|too many/i.test(a)?"That was a lot at once. Give it a few seconds and try again.":`Could not ${t}. Nothing has been lost; try again in a moment.`},G=null,et=async()=>{if(window.liveEditApi)try{G=await(await D("/live-edit/credits",{method:"GET"})).json(),he()}catch(e){console.warn("[live-edit] could not read the credit balance:",e),G=null}},tt=async()=>{if(!(window.liveEditStyleProps&&window.liveEditStyles)&&window.liveEditApi)try{let t=await(await D("/live-edit/content",{method:"GET"})).json();t?.styleProps&&(window.liveEditStyleProps=t.styleProps),t?.styles&&(window.liveEditStyles=t.styles),he()}catch(e){console.warn("[live-edit] could not read what this site allows to be styled:",e)}},Ie=(e,t)=>{if(!G?.available||!t)return;let a=document.createElement("div");a.className="le-assist-head",a.append(nt("AI assist"),ge()),x.append(a),[["rewrite","Rewrite"],["shorten","Shorten"]].forEach(([s,p])=>{let g=G.costs?.[s]??1,c=document.createElement("button");c.type="button",c.className="le-assist";let d=document.createElement("span");d.textContent=p;let f=document.createElement("span");f.className="le-assist-cost",f.textContent=`${g} credit${g===1?"":"s"}`,c.append(d,f),(G.balance??0)<g&&(c.disabled=!0,f.classList.add("is-short"),c.title="Not enough credits"),c.addEventListener("click",()=>void _e(s,p,e,t,c,d)),x.append(c)})},ge=()=>{let e=document.createElement("span");return e.className="le-assist-balance",e.textContent=`${G?.balance??0} credits left`,e},nt=e=>{let t=document.createElement("div");return t.className="le-section-heading",t.textContent=e,t},Ue=()=>(document.querySelector('meta[property="og:site_name"]')?.content??document.querySelector('meta[name="application-name"]')?.content??(document.title??"").split(/\s+[|\u2013\u2014-]\s+/).pop()??"").replace(/\s+/g," ").trim().slice(0,120),ot=()=>(document.querySelector('meta[name="description"]')?.content??document.querySelector('meta[property="og:description"]')?.content??"").replace(/\s+/g," ").trim().slice(0,400),_e=async(e,t,a,s,p,g)=>{p.disabled=!0,g.textContent="Thinking\u2026";let c;try{c=await(await D("/live-edit/assist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:e,text:s.value,heading:We(a),role:ae(a),page:window.location.pathname,site:Ue(),about:ot()})})).json()}catch(d){p.disabled=!1,g.textContent=t,l.toast(K(d,"rewrite that"));return}if(typeof c?.balance=="number"&&G&&(G.balance=c.balance),!c?.text){p.disabled=!1,g.textContent=t,l.toast(at(c?.reason));return}s.value=c.text,s.dispatchEvent(new Event("input",{bubbles:!0})),s.focus(),p.disabled=!1,g.textContent=t,l.toast(`Rewritten. ${c.balance} credits left.`)},We=e=>(((e.closest("section, article, header, div[data-style]")??document.body).querySelector("h1, h2, h3")??document.querySelector("h1"))?.textContent??"").replace(/\s+/g," ").trim().slice(0,200),at=e=>({not_enough_credits:"Not enough credits for that. You can buy more from your account.",no_suggestion:"No suggestion for this one. Your words are unchanged.",not_configured:"Rewriting is not switched on for this site yet.",nothing_to_work_with:"There are no words here to rewrite yet."})[e]??"Could not rewrite that just now. Your words are unchanged.",Pe=async()=>{x.replaceChildren(te("Loading\u2026"));let e;try{e=await(await D("/live-edit/changes",{method:"GET"})).json()}catch(a){x.replaceChildren(te(K(a,"show your changes")));return}let t=e?.changes??[];if(t.length===0){x.replaceChildren(te("No unpublished changes."));return}x.replaceChildren(),t.forEach(a=>{let s=document.createElement("div");s.className="le-change";let p=document.createElement("div");p.className="le-row le-change-head";let g=document.createElement("span");g.className="le-change-label",g.textContent=wt(a);let c=document.createElement("button");if(c.type="button",c.className="le-chip-btn",c.textContent="Revert",c.addEventListener("click",()=>void xo(a,c)),p.append(g,c),s.append(p),fe(a)){s.append(ne(a)),x.append(s);return}if(a.before){let f=document.createElement("p");f.className="le-change-before",f.textContent=we(a.before),s.append(f)}let d=document.createElement("p");d.className="le-change-after",d.textContent=Xt(a)||"(empty)",s.append(d),x.append(s)})},we=e=>{let t=String(e??"").replace(/\s+/g," ").trim();return t.length>70?`${t.slice(0,70)}\u2026`:t},fe=e=>e.kind==="style"?!1:document.querySelector(`[data-edit-img="setting:${CSS.escape(e.key)}"]`)?!0:ut(e.after)||ut(e.before),ne=e=>{let t=document.createElement("div");t.className="le-change-pictures";let a=(s,p,g)=>{let c=document.createElement("figure");c.className=g;let d=document.createElement("figcaption");if(d.textContent=p,c.append(d),ut(s)){let u=document.createElement("img");return u.src=s,u.alt="",u.loading="lazy",u.addEventListener("error",()=>{u.remove();let w=document.createElement("span");w.className="le-change-missing",w.textContent="Cannot be shown",c.append(w)},{once:!0}),c.append(u),c}let f=document.createElement("span");return f.className="le-change-missing",f.textContent=String(s??"").trim()===""?"No picture":we(s),c.append(f),c};return e.before&&t.append(a(e.before,"Was","le-change-shot is-before")),t.append(a(e.after,"Now","le-change-shot is-after")),t},Gt=e=>document.querySelector(`[data-edit="setting:${CSS.escape(e.key)}"], [data-edit-img="setting:${CSS.escape(e.key)}"], [data-style="${CSS.escape(e.key)}"]`),wt=e=>{let t=Gt(e);return t?ae(t):e.kind==="style"?"Styling":fe(e)?"Picture":"Text"},Xt=e=>{let t=we(e.after),a=Gt(e);return!a||e.kind==="style"||fe(e)?t:zt(a).length>0&&we(a.textContent)||t},xo=async(e,t)=>{t.disabled=!0,t.textContent="Reverting\u2026";try{await D("/live-edit/changes",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:e.key,kind:e.kind})})}catch(a){t.disabled=!1,t.textContent="Revert",l.toast(K(a,"put that back"));return}I("Reverted \u2713")},Qt=()=>{let e=window.liveEditApi?.engine;if(!e)return null;let t=O("p","le-hint");return t.textContent=`Live Edit ${e}`,t.title="Quote this if you report a problem",t},ko=async()=>{x.replaceChildren(te("Loading\u2026"));let e;try{e=await(await D("/live-edit/versions",{method:"GET"})).json()}catch(s){x.replaceChildren(te(K(s,"show what has been published")));return}let t=e?.versions??[];if(t.length===0){x.replaceChildren(te("Nothing published yet. Your first publish will appear here."));let s=Qt();s&&x.append(s);return}x.replaceChildren(),t.forEach((s,p)=>{let g=document.createElement("div");g.className="le-version";let c=document.createElement("span");c.className=p===0?"le-version-dot is-latest":"le-version-dot";let d=document.createElement("div"),f=document.createElement("p");f.className="le-change-after",f.textContent=s.restored_from?`Restored version ${s.restored_from}`:`Published ${s.changes??0} change${s.changes===1?"":"s"}`;let u=document.createElement("p");u.className="le-change-when",u.textContent=Eo(s.published_at),d.append(f,u),g.append(c,d),x.append(g)});let a=Qt();a&&x.append(a)},te=e=>{let t=document.createElement("p");return t.className="le-hint",t.textContent=e,t},Eo=e=>{if(!e)return"";let t=Math.round((Date.now()-new Date(e).getTime())/1e3);return t<90?"Just now":t<3600?`${Math.round(t/60)} minutes ago`:t<86400?`${Math.round(t/3600)} hours ago`:t<86400*8?`${Math.round(t/86400)} days ago`:new Date(e).toLocaleDateString()},yt=()=>{He(),Tt(),P.classList.add("is-open"),l.toolbar.classList.add("is-compact"),Z==="Edit"&&x.querySelector("textarea, input:not([type=checkbox]), select")?.focus()},be=(e=!1)=>{if(!e&&y?.dirty){Me().then(t=>{t&&be(!0)});return}y?.restore?.(),Te(),P.classList.remove("is-open"),l.toolbar.classList.remove("is-compact"),y=null},So=()=>document.querySelectorAll("[data-edit], [data-edit-img], [data-edit-bg], [data-edit-href], [data-edit-icon], [data-edit-svg]"),vt=async(e,t=0)=>{try{if(e.cssRules){let a=[];for(let s of e.cssRules)s.styleSheet&&t<4?a.push(await vt(s.styleSheet,t+1)):a.push(s.cssText);return a.join("")}}catch{}if(!e.href)return"";try{let a=await fetch(e.href);if(!a.ok)return"";let s=await a.text();if(t>=4)return s;let p=[...s.matchAll(/@import\s+(?:url\(\s*(["']?)([^"')]+)\1\s*\)|(["'])([^"']+)\3)/gi)].map(c=>c[2]||c[4]).filter(Boolean),g=await Promise.all(p.map(c=>vt({href:new URL(c,e.href).href},t+1)));return s+g.join("")}catch{return""}},Co=null,Ao=async()=>{let e=new Map;return(await Promise.all([...document.styleSheets].map(a=>vt(a)))).forEach(a=>$n(a).forEach(s=>e.set(s.name,s.glyph))),[...e].map(([a,s])=>({name:a,glyph:s})).sort((a,s)=>a.name.localeCompare(s.name))},Zt=()=>Co??(Co=Ao()),en=()=>{document.querySelectorAll("[data-style]").forEach(e=>{if(e.hasAttribute("data-edit-bg"))return;let a=(getComputedStyle(e).backgroundImage||"").match(/url\((['"]?)(.*?)\1\)/),s=e.getBoundingClientRect(),p=a&&!a[2].startsWith("data:")&&s.width>=120&&s.height>=120;e.toggleAttribute("data-has-bg",!!p)})},Lo=()=>{document.querySelectorAll("[data-edit-icon]").forEach(e=>{let t=getComputedStyle(e,"::before").content;(t==="none"||t==="normal"||t==='""'||t==="")&&e.removeAttribute("data-edit-icon")})},Be=e=>{e&&Lo(),document.body.classList.toggle("editing",e),So().forEach(t=>{e?t.setAttribute("tabindex","0"):t.removeAttribute("tabindex")}),sessionStorage.setItem("tb_editing",e?"1":"0"),V.textContent=e?"Click any outlined text or image":"",V.parentElement?.classList.toggle("is-saying",e),!e&&typeof He=="function"&&He(),l.toolbar.classList.toggle("is-editing",e),Q.textContent=e?"Done editing":"Edit site",e?(en(),document.querySelector("[data-edit-icon]")&&Zt(),n?.base&&n?.site&&Promise.resolve().then(()=>(Wt(),_t)).then(t=>t.refreshBackgrounds({base:n.base,site:n.site,key:n.token})).then(t=>{t&&en()}).catch(t=>console.warn("[live-edit] could not look again for backgrounds:",t.message))):(Tt(),xe()),e||be(!0)},To=async()=>{let e=window.liveEditApi,t=await Promise.resolve().then(()=>(wo(),mo)).catch(()=>null);if(t?.forget(window),!e||!t){window.location.reload();return}let a=window.prompt("Your editing session has ended. Enter your email address and we will send you a new link.");a&&(await t.requestLink(e,a,window).catch(()=>{}),m("If that address can edit this site, a link is on its way.")),window.location.reload()},D=async(e,t)=>{let a=window.liveEditApi,s=a?Bn(e,t,a):null,p=s?s.init:Tn(i,t),g=typeof FormData<"u"&&p.body instanceof FormData,c={...p,signal:p.signal??Je(g?3e4*4:3e4)},d;try{d=await fetch(s?s.url:e,c)}catch(f){throw Ln(f)?new Error("That is taking too long. Your change is still here \u2014 check your connection and press Save again."):f}if(d.status===419||d.status===401)throw await To(),new Error("Your editing session has ended.");if(!d.ok){let f=await d.json().catch(()=>({}));throw new Error(f.error?.message??f.message??"Could not save. Try again.")}if(!Nn(d))throw new Error("That did not save. Reload the page and try again.");return d},No=(e,t)=>{if(!e?.element)return null;let a=s=>{let p=e.element.getAttribute(s);return p===null?null:{attr:s,marker:p}};if(e.kind==="image"){let s=t.querySelector("input[type=url]")?.value.trim(),p=t.querySelector("input[type=file]")?.files?.[0],g=a("data-edit-img")??a("data-edit-bg");return s&&g?{...g,kind:"image",value:s}:null}if(e.kind==="icon"){let s=a("data-edit-icon");return s&&e.value?{...s,kind:"icon",value:e.value}:null}if(e.kind==="setting"&&typeof e.savedValue=="string"){let s=a("data-edit");return!s||/<[a-z][\s\S]*>/i.test(e.savedValue)||e.element.hasAttribute("data-edit-attr")?null:{...s,kind:"text",value:e.savedValue}}return null},$o=async e=>{let t=window.liveEditApi?.builderUrl;if(!t||e?.kind!=="setting"||typeof e.savedValue!="string"||!e.element)return;let a=e.element.closest(".elementor-element[data-id]");if(a)try{await fetch(t,{method:"POST",headers:{"Content-Type":"application/json",...window.liveEditApi?.publishHeaders??{}},body:JSON.stringify({page:window.location.href,element:a.dataset.id,value:e.savedValue})})}catch(s){console.warn("[live-edit] could not tell the page builder about this change:",s.message)}},Oo=async()=>{if(!y)return;let e=l.saveButton;e.disabled=!0,e.textContent="Saving\u2026";let t=()=>{e.disabled=!1,e.textContent="Save changes"};try{if(y.kind==="setting"){let a=y.value??x.querySelector("textarea, input[name=icon]")?.value??"";if(typeof y.openedWith=="string"&&a===y.openedWith){t(),be();return}await D("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:y.key,value:y.savedValue=y.value??x.querySelector("textarea, input[name=icon]")?.value??"",locale:window.liveEditLocale})})}else if(y.kind==="record"){let a={};x.querySelectorAll("textarea, select, input[type=hidden][name]").forEach(s=>a[s.name]=s.value),await D("/live-edit/record",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:y.type,id:y.id,fields:a})})}else if(y.kind==="icon")await D("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:y.key,value:y.value})});else if(y.kind==="image"){let a=new FormData;a.append("target",y.target);let s=x.querySelector("input[type=file]").files[0],p=x.querySelector("input[type=url]").value.trim(),g=y.crop===vo,c=g?null:It(y.element);c&&(a.append("fitWidth",String(c.width)),a.append("fitHeight",String(c.height)),c.exact&&a.append("fitExact","1")),y.crop&&!g&&(a.append("cropX",String(y.crop.x)),a.append("cropY",String(y.crop.y)),a.append("cropWidth",String(y.crop.width)),a.append("cropHeight",String(y.crop.height)));let d=s!==void 0||p!==""&&p!==void 0;y.credit&&y.creditFor===y.target&&d&&xn(y.credit).forEach(([w,v])=>a.append(w,v));let f=[...x.querySelectorAll("[data-img-attr]")],u=kn(f);if(window.liveEditLocale&&a.append("locale",window.liveEditLocale),s?a.append("file",s):p&&a.append("url",p.startsWith("http")?p:`https://${p}`),u.forEach(w=>a.append(w.dataset.imgAttr,w.value)),!s&&!p&&u.length===0){t(),m(f.length>0?"Nothing has changed yet. Choose a picture, or edit the description.":"Choose a file from your computer or paste an image URL first.");return}await D("/live-edit/image",{method:"POST",body:a})}if(y.hrefKey){let a=x.querySelector("[data-link-field=href]").value.trim(),s=x.querySelector("[data-link-field=target]").checked;await D("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:y.hrefKey,value:a})}),y.targetKey&&await D("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:y.targetKey,value:s?"_blank":""})})}y.styleKey&&await D("/live-edit/style",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:y.styleKey,props:Ne()})}),await $o(y),En(No(y,x)),z("Saved \u2713",y.key??null,y.savedValue??null)}catch(a){t(),m(a.message)}finally{t()}};et(),tt();let O=(e,t,a)=>{let s=document.createElement(e);return t&&(s.className=t),a!=null&&(s.textContent=a),s},tn=e=>{let t=e.closest("section, article, header, div[data-style]");for(;t&&!t.querySelector("h1, h2, h3");)t=t.parentElement?.closest("section, article, header, div[data-style]")??null;let a=t?.querySelector("h1, h2, h3");return!t||!a?"":[...t.querySelectorAll("p, span, div, h4, h5, h6")].filter(p=>p.children.length===0).filter(p=>a.compareDocumentPosition(p)&Node.DOCUMENT_POSITION_PRECEDING).map(p=>(p.textContent??"").replace(/\s+/g," ").trim()).find(p=>p.length>3&&p.length<42)??""},Io=/^(the|and|with|for|your|our|from|that|this|they|them|will|have|more|about|into|just|than|then|when|what|where|very|been|here|there)$/,nn=e=>{let t=new Set((document.title??"").toLowerCase().split(/[^a-z0-9]+/i).filter(Boolean));return(e??"").toLowerCase().split(/[^a-z0-9]+/i).filter(a=>a.length>3&&!Io.test(a)&&!t.has(a))},Po=e=>{let t=nn(tn(e)).slice(0,3);if(t.length>0)return t.join(" ");let a=nn(We(e)).slice(0,3);return a.length>0?a.join(" "):"workplace"},on=e=>{let t=Po(e),a=(e.dataset.editLabel??"").toLowerCase().trim(),s=/hero|banner|header|cover/.test(a);return[...new Set([t,s?`${t} wide`:`${t} close up`,"workplace"].filter(Boolean))].slice(0,4)},Bo=e=>`${(tn(e)||We(e)||"This page").replace(/[.\s]+$/,"")}. Photographic, natural daylight, calm and editorial, soft neutral tones to match the rest of the site. No text.`,an=(e,t,a="Free photos",s="image")=>{let p=l.modal({title:`Replace ${s}`,subtitle:e.dataset.editLabel??ae(e)}),g=document.createElement("div");p.body.append(g),p.tabs.hidden=!1;let c=w=>{p.close(),t(w)},d={Upload:()=>jo(g,c),"Free photos":()=>void Ro(g,e,c),"Generate with AI":()=>Fo(g,e,c)},f=Object.keys(d).map(w=>{let v=document.createElement("button");return v.type="button",v.className="le-modal-tab",v.textContent=w,v.addEventListener("click",()=>u(w)),p.tabs.append(v),[w,v]}),u=w=>{f.forEach(([v,b])=>b.classList.toggle("is-on",v===w)),g.replaceChildren(),d[w]()};return u(d[a]?a:"Free photos"),p},jo=(e,t)=>{e.append(le({hint:"PNG, JPG or WEBP, or drag one here",onFile:d=>t({file:d})}));let a=O("div","le-row-tight"),s=document.createElement("input");s.type="url",s.className="le-search",s.placeholder="Or paste a link to a picture";let p=O("button","le-btn-outline","Use it");p.type="button";let g=()=>{let d=s.value.trim();d&&t({url:d.startsWith("http")?d:`https://${d}`})};p.addEventListener("click",g),s.addEventListener("keydown",d=>{d.key==="Enter"&&(d.preventDefault(),g())}),a.append(s,p),e.append(a);let c=O("p","le-hint","You can also drag a picture straight onto the image on the page.");c.style.marginTop="14px",e.append(c)},Ro=async(e,t,a)=>{let s=document.createElement("input");s.type="search",s.className="le-search",s.placeholder="Search free photographs";let p=document.createElement("div");p.className="le-chips";let g=document.createElement("div");g.className="le-grid";let c=document.createElement("p");c.className="le-hint",c.style.marginTop="16px",e.append(s,p,g,c);let d=()=>{g.replaceChildren();for(let u=0;u<6;u+=1)g.append(O("div","le-shimmer"))},f=async u=>{s.value=u,d();let w;try{w=await(await D(`/live-edit/photos?q=${encodeURIComponent(u)}`,{method:"GET"})).json()}catch(b){g.replaceChildren(te(K(b,"look for photographs")));return}let v=w?.photos??[];if(c.textContent=w?.source==="openverse"?"Free to use, including commercially. The photographer is credited automatically.":"Free to use under the Unsplash licence. The photographer is credited automatically.",v.length===0){g.replaceChildren(te(zo(w?.reason,u)));return}g.replaceChildren(),v.forEach(b=>{let E=document.createElement("button");E.type="button",E.className="le-pick";let S=document.createElement("img");S.className="le-pick-shot",S.src=b.thumb??b.full,S.alt=b.alt??"",S.loading="lazy";let L=O("span","le-pick-by",b.by?`Photo by ${b.by}`:"");E.append(S,L),E.addEventListener("click",()=>{b.downloadLocation&&D("/live-edit/photos/used",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({download_location:b.downloadLocation})}).catch(()=>{}),a({url:b.full,alt:b.alt??"",credit:b.credit??(b.by?`Photo by ${b.by}`:""),creditBy:b.by??"",creditUrl:b.byUrl??"",creditSource:b.source??"",creditSourceUrl:b.sourceUrl??""})}),g.append(E)})};on(t).forEach((u,w)=>{let v=document.createElement("button");v.type="button",v.className="le-chip",v.textContent=u,v.addEventListener("click",()=>void f(u)),p.append(v),w===0&&v.classList.add("is-on")}),s.addEventListener("keydown",u=>{u.key==="Enter"&&(u.preventDefault(),s.value.trim()&&f(s.value.trim()))}),await f(on(t)[0])},zo=(e,t)=>({not_configured:"Free photographs are not switched on for this site yet.",not_allowed:"The photo library would not accept this site\u2019s key. It needs setting up again.",unreachable:"Could not reach the photo library just now. Try again in a moment.",nothing_to_search_for:"Type what the picture should show."})[e]??`Nothing found for "${t}". Try fewer words.`,Fo=(e,t,a)=>{let s=Bo(t),p=O("div","le-suggest");p.append(O("div","le-eyebrow","Suggested for this spot"),O("div","le-suggest-text",s));let g=document.createElement("button");g.type="button",g.className="le-chip",g.style.marginTop="10px",g.textContent="Use this description",p.append(g);let c=document.createElement("textarea");c.className="le-textarea",c.placeholder="Describe the picture you want",g.addEventListener("click",()=>{c.value=s,c.focus()});let d=G?.costs?.generate_image??5,f=G?.balance??0,u=document.createElement("button");u.type="button",u.className="le-btn-publish",u.style.marginTop="14px",u.textContent=`Make a picture \xB7 ${d} credits`;let w=O("div","le-grid is-square");if(w.style.display="none",e.append(p,c,u,w),f<d){p.remove(),c.remove(),u.remove(),e.append(O("div","le-section-heading","Making pictures costs credits"),O("div","le-hint",`A picture costs ${d} credits. You have ${f}.`));let v=window.liveEditEditor?.console??null;if(v){let b=O("button","le-btn-publish","Buy credits");b.type="button",b.style.marginTop="14px",b.addEventListener("click",()=>{window.open(`${v.replace(/\/$/,"")}/billing`,"_blank","noopener")}),e.append(b)}e.append(te("Uploading your own picture and the free photo library cost nothing, and they are the other two tabs here."));return}{let v=O("div","le-hint",`${d} credits a picture \xB7 ${f} left`);e.insertBefore(v,u)}u.addEventListener("click",async()=>{let v=c.value.trim()||s;u.disabled=!0,u.textContent="Making\u2026",w.style.display="",w.replaceChildren();for(let S=0;S<4;S+=1)w.append(O("div","le-shimmer"));let b;try{b=await(await D("/live-edit/imagine",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:v})})).json()}catch(S){w.replaceChildren(te(K(S,"make a picture"))),u.disabled=!1,u.textContent="Try again \xB7 5 credits";return}let E=b?.images??[];if(typeof b?.balance=="number"&&(G={...G??{},balance:b.balance}),E.length===0){w.replaceChildren(te(Do(b?.reason))),u.disabled=!1,u.textContent="Try again \xB7 5 credits";return}w.replaceChildren(),E.forEach(S=>{let L=document.createElement("button");L.type="button",L.className="le-pick";let T=document.createElement("img");T.className="le-pick-shot",T.src=S,T.alt="",L.append(T,O("span","le-tag","MADE")),L.addEventListener("click",()=>a({url:S,credit:"",creditSource:"Generated"})),w.append(L)}),u.disabled=!1,u.textContent="Make four more \xB7 5 credits"})},Do=e=>({not_enough_credits:"Not enough credits to make a picture. You can buy more from your account.",not_configured:"Making pictures is not switched on for this site yet.",no_suggestion:"Nothing usable came back, so you have not been charged. Try describing it differently.",nothing_to_work_with:"Describe the picture you want first."})[e]??"Could not make a picture just now. You have not been charged.",je=null,qo=(e,t)=>{if(!t)return;let a=me(e),s=d=>[...d.childNodes].filter(f=>f.nodeType===3),p=s(e).map(d=>d.nodeValue),g=()=>{let d=s(e);return d.length!==p.length?!1:(d.forEach((f,u)=>{f.nodeValue=p[u]}),!0)},c=!1;y.restore=()=>{!c||!je||g()||je(e,a)},t.addEventListener("input",()=>{je&&(c=!0,g(),je(e,t.value,{keepRuns:!0}))}),je===null&&Promise.resolve().then(()=>(ft(),gt)).then(d=>je=d.applyValue).catch(d=>console.warn("[live-edit] could not preview words as you type:",d.message))},Mo=e=>{y.hrefKey=e.dataset.editHref,y.targetKey=e.dataset.editTarget;let t=document.createElement("div");t.className="le-field le-divided",t.append("Link");let a=document.createElement("input");a.type="text",a.dataset.linkField="href";let s=e.getAttribute("href")??"";a.value=s==="#"?"":s,a.placeholder="/contact or https://...",a.className="le-input le-link";let p=document.createElement("label");p.className="le-default";let g=document.createElement("input");g.type="checkbox",g.dataset.linkField="target",g.checked=e.getAttribute("target")==="_blank",p.append(g,"Open in a new tab"),t.append(a,p),x.append(t)},xt=e=>{y={kind:"link"},$.textContent=e.dataset.editLabel??"Link",x.replaceChildren(),q.classList.add("le-hidden"),ye(e)},it=e=>{let{kind:t,key:a,parts:s}=An(e.dataset.edit);if(x.replaceChildren(),q.classList.add("le-hidden"),t==="setting"){y={kind:t,key:a,element:e},$.textContent=e.dataset.editLabel??ae(e);let p=(window.liveEditRich?.settings??[]).includes(s[0]),g=jt({editValue:e.dataset.editValue,ownText:me(e),fullText:e.textContent}),c=p?g.trim():jn(e,g);y.openedWith=c;let d=e.dataset.editAs==="icon";if(x.append(d?Ee("icon","Icon",e.dataset.editValue??"",1,!1):Ee("value","Text",c,6,p)),!d&&!p){let f=zt(e).map(u=>`\u201C${u}\u201D`);if(f.length>0){let u=document.createElement("p");u.className="le-hint",u.textContent=`${f.join(", ")} ${f.length===1?"sits":"sit"} inside their own formatting and stay on the page \u2014 click the words themselves to change them. This box rewrites only what is around them, so there is no need to type them again.`,x.append(u)}}d||Ie(e,x.querySelector("textarea")),!d&&!p&&qo(e,x.querySelector("textarea"))}else{let[p,g]=s;y={kind:"record",type:p,id:Number(g)};let c=e.dataset.editLabel??"Item",d=JSON.parse(e.dataset.editValues??"{}"),f=d.title??d.question??d.label??d.number;if($.textContent=f?`${c}: ${f.slice(0,40)}`:c,Object.entries(d).forEach(([b,E])=>{let S=b.replace(/_/g," "),L=S.charAt(0).toUpperCase()+S.slice(1),T=(window.liveEditRich?.fields??[]).includes(`${p}.${b}`);x.append(Ee(b,L,E,b==="detail"||b==="answer"?6:3,T))}),window.liveEditPublishing){let b=document.createElement("div");b.className="le-hint le-immediate",b.textContent="Changes here go live as soon as you save, without publishing.",x.append(b)}e.hasAttribute("data-edit-deletable")&&(q.textContent=`Delete this ${c.toLowerCase()}`,q.classList.remove("le-hidden"));let u=document.createElement("div");u.className="le-row";let w=document.createElement("span");w.className="le-label",w.textContent="Order";let v=(b,E)=>{let S=document.createElement("button");return S.type="button",S.textContent=E,S.className="le-chip-btn",S.addEventListener("click",async()=>{(await(await D("/live-edit/record/move",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:y.type,id:y.id,direction:b})})).json()).moved?I("Reordered \u2713"):m(b==="up"?"Already first.":"Already last.")}),S};u.append(w,v("up","\u2191 Move up"),v("down","\u2193 Move down")),x.prepend(u)}ye(e)},Uo=e=>{let t=e.closest?.("[data-edit-item]"),a=t?.parentElement?.dataset?.editList?t.parentElement:e.closest?.("[data-edit-list]");if(!a?.dataset?.editList)return;let s=()=>[...a.children].filter(f=>f.dataset.editItem).map(f=>f.dataset.editItem),p=async(f,u)=>{try{await D("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:a.dataset.editList,value:JSON.stringify(f)})}),I(u)}catch(w){m(w.message)}},g=document.createElement("div");g.className="le-section-heading",g.textContent="List";let c=document.createElement("div");c.className="le-row";let d=document.createElement("button");if(d.type="button",d.className="le-chip-btn",d.textContent=t?"+ Add another":"+ Add item",d.addEventListener("click",()=>{let f=s(),u=t?f.indexOf(t.dataset.editItem):f.length-1;f.splice(u+1,0,"n"+Date.now().toString(36)),p(f,"Added \u2713")}),c.append(d),t){let f=document.createElement("button");f.type="button",f.className="le-btn-danger",f.textContent="Delete this item",f.addEventListener("click",()=>{window.confirm("Delete this item?")&&p(s().filter(u=>u!==t.dataset.editItem),"Deleted \u2713")}),c.append(f)}x.append(g,c)},kt=!1,_o=e=>{kt=!0,e.click(),window.setTimeout(()=>{kt=!1},0)},Wo=e=>{let t=Fn(e);if(t){let c=document.createElement("div");c.className="le-row";let d=document.createElement("button");d.type="button",d.className="le-chip-btn";let f=Dn(t);d.textContent=f===""?"Run this control":`Press \u201C${f}\u201D`,d.title="Runs the control so you can edit what it reveals",d.addEventListener("click",()=>{be(!0),_o(t)}),c.append(d),x.append(c)}let a=e.closest?.("a[href]"),s=a?.getAttribute("href");if(!s||s==="#"||s.startsWith("javascript:"))return;let p=document.createElement("div");p.className="le-row";let g=document.createElement("button");g.type="button",g.className="le-chip-btn",g.textContent="Open this link \u2192",g.addEventListener("click",()=>{window.location.href=a.href}),p.append(g),x.append(p)},ye=(e,{styleKey:t=null,styleOn:a=e}={})=>{e.dataset.editHref!==void 0&&Mo(e),Wo(e);let s=t??a.dataset.styleEdit??a.dataset.style,p=Pn(a.dataset.styleProps,window.liveEditStyleProps);s&&p.length&&Qe(s,p,a),Yo(e),Uo(e),U(e.dataset.styleEdit?e.closest("[data-style]")??e.parentElement:e),Oe("Edit"),yt()},Ho=e=>{let t=(me(e)||e.textContent||"").replace(/\s+/g," ").trim();if(t)return t.slice(0,28);let a=(e.getAttribute("aria-label")??e.getAttribute("title")??"").trim();if(a)return a.slice(0,28);let s=e.className.toString().match(/(?:social-icon-|fa-|bi-|icon-)([a-z][a-z0-9-]{2,})/i)?.[1]??[...e.querySelectorAll("[class]")].map(p=>p.className.toString().match(/(?:social-icon-|fa-|bi-|icon-)([a-z][a-z0-9-]{2,})/i)?.[1]).find(Boolean);return s?s.charAt(0).toUpperCase()+s.slice(1):de(e)},Yo=e=>{let t="[data-edit], [data-edit-img], [data-edit-bg], [data-edit-href], [data-edit-icon], [data-edit-svg]",a=[...e.querySelectorAll(t)].filter(c=>c.parentElement?.closest(t)===null||!e.contains(c.parentElement.closest(t))).filter(c=>c!==e&&c.getBoundingClientRect().width>0);if(a.length===0)return;let s=a.slice(0,24),p=document.createElement("div");p.className="le-section-heading",p.textContent=a.length>s.length?`Inside this \u2014 first ${s.length} of ${a.length}`:"Inside this",x.append(p);let g=document.createElement("div");g.className="le-row",s.forEach(c=>{let d=document.createElement("button");d.type="button",d.className="le-chip-btn",d.textContent=Ho(c),d.addEventListener("click",()=>mt(c)),g.append(d)}),x.append(g)},Et=e=>{y={kind:"style"};let t=e.dataset.styleEdit??e.dataset.style;$.textContent=e.dataset.editLabel??ae(e),x.replaceChildren(),q.classList.add("le-hidden"),ye(e,{styleKey:t})},rt=e=>{let t=getComputedStyle(e,"::before");return`${t.fontStyle} ${t.fontWeight} 20px ${t.fontFamily}`},rn=(e,t)=>{let a=e.cloneNode(!1);a.removeAttribute("data-edit-icon"),Object.assign(a.style,{position:"absolute",visibility:"hidden",pointerEvents:"none"}),(e.parentNode??document.body).append(a);let s=rt(a),p=[];return[...a.classList].forEach(g=>{g!==t&&(a.classList.remove(g),rt(a)!==s&&p.push(g),a.classList.add(g))}),a.remove(),p},Vo=(e,t,a,s)=>On([...e.classList],a,s,rn(e,s),rn(t,t.dataset.editIconCurrent)),Jo=(e,t)=>{let a=document.createElement("canvas").getContext("2d");return a.font=t,e.filter(({glyph:s})=>{let p=a.measureText(s);return(p.actualBoundingBoxAscent||0)+(p.actualBoundingBoxDescent||0)>0})},Ko=async e=>{let t=e.dataset.editIconCurrent;y={kind:"icon",key:e.dataset.editIcon.replace(/^setting:/,""),value:t,element:e},$.textContent="Icon",x.replaceChildren(),q.classList.add("le-hidden");let a=rt(e),s=await Zt();if(y?.element!==e)return;let p=new Map([[a,null]]);document.querySelectorAll("[data-edit-icon]").forEach(b=>{let E=rt(b);p.has(E)||p.set(E,b)});let g=In([...p].map(([b,E])=>({face:b,variant:E,icons:Jo(s,b)})));if(g.length===0){let b=document.createElement("div");b.className="le-hint",b.textContent="This theme loads its icons from somewhere this page cannot read, so they cannot be listed. Type the icon name instead.";let E=document.createElement("label");E.className="le-field",E.append("Icon name");let S=document.createElement("input");S.type="text",S.className="le-input",S.value=t??"",S.addEventListener("input",()=>{y.value=S.value.trim(),y.dirty=!0}),E.append(S,b),x.append(E),ye(e);return}let c=e.className;y.restore=()=>{e.className=c,e.dataset.editIconCurrent=t};let d=document.createElement("input");d.type="search",d.className="le-input",d.placeholder=`Search ${g.length} icons\u2026`;let f=document.createElement("div");f.className="le-icon-grid";let u=document.createElement("div");u.className="le-hint";let w=400,v=b=>{let E=b.trim().toLowerCase().replace(/\s+/g,"-"),S=E?g.filter(({name:L})=>L.includes(E)):g;if(f.replaceChildren(),S.slice(0,w).forEach(({name:L,glyph:T,face:R,variant:X})=>{let M=document.createElement("button");M.type="button",M.className="le-icon-choice",M.title=L.replace(/^[a-z]+-/,"").replace(/-/g," "),M.classList.toggle("is-current",L===t),M.style.font=R,M.textContent=T,M.addEventListener("click",()=>{e.className=c,e.dataset.editIconCurrent=t;let j=X?Vo(e,X,L,t):L;X?e.className=j:e.classList.replace(t,L),e.dataset.editIconCurrent=L,y.value=j,y.dirty=!0,f.querySelectorAll(".le-icon-choice").forEach(_=>_.classList.remove("is-current")),M.classList.add("is-current")}),f.append(M)}),S.length===0){let L=document.createElement("div");L.className="le-hint",L.textContent="No icon matches that name.",f.append(L)}u.textContent=S.length>w?`Showing ${w} of ${S.length}. Type to narrow it down.`:""};d.addEventListener("input",()=>v(d.value)),v(""),x.append(d,f,u),ye(e)},sn=e=>{let t=e.outerHTML;y={kind:"setting",key:e.dataset.editSvg.replace(/^setting:/,""),element:e},$.textContent=e.dataset.editLabel??"Drawing",x.replaceChildren(),q.classList.add("le-hidden");let a=()=>{e.outerHTML=t};y.restore=a;let s=new Set,p=[];document.querySelectorAll("svg").forEach(v=>{let b=v.outerHTML,E=b.replace(/\s+(class|style|width|height|data-[\w-]+)="[^"]*"/g,"");s.has(E)||v.getBoundingClientRect().width<4||(s.add(E),p.push(b))});let g=document.createElement("div");g.className="le-icon-grid";let c=null;p.slice(0,120).forEach(v=>{let b=document.createElement("button");b.type="button",b.className="le-icon-choice",b.innerHTML=v;let E=b.firstElementChild;E&&(E.removeAttribute("class"),E.setAttribute("width","20"),E.setAttribute("height","20")),b.classList.toggle("is-current",v===t),b.addEventListener("click",()=>{c=v,y.value=v,y.dirty=!0;let S=document.querySelector(`[data-edit-svg="${e.dataset.editSvg}"]`)??e,L=new DOMParser().parseFromString(v,"image/svg+xml").documentElement;["class","width","height","style","data-edit-svg","data-edit-label"].forEach(T=>{S.hasAttribute(T)&&L.setAttribute(T,S.getAttribute(T))}),S.replaceWith(L),g.querySelectorAll(".le-icon-choice").forEach(T=>T.classList.remove("is-current")),b.classList.add("is-current")}),g.append(b)});let d=document.createElement("label");d.className="le-field le-divided",d.append("Or paste an SVG");let f=document.createElement("textarea");f.className="le-input le-prose",f.placeholder='<svg viewBox="0 0 24 24">\u2026</svg>',f.addEventListener("input",()=>{f.value.trim()!==""&&(y.value=f.value.trim(),y.dirty=!0)});let u=document.createElement("div");u.className="le-hint",u.textContent="Anything that could run or fetch is stripped before it is saved.",d.append(f,u);let w=document.createElement("div");w.className="le-section-heading",w.textContent=p.length?"Drawings on this site":"No other drawings here",x.append(w,g,d),ye(e)},St=e=>{let t=e.dataset.editKind==="background";y={kind:"image",target:e.dataset.editImg??e.dataset.editBg,element:e},$.textContent=e.dataset.editLabel??(t?"Background image":"Image"),x.replaceChildren(),q.classList.add("le-hidden");let a=document.createElement("div");a.className="le-preview";let s=document.createElement("img");s.alt="",s.className="";let p=t?Se(e):e.currentSrc||e.getAttribute("src")||"",c=(p&&!p.startsWith("data:")?p:"")||e.dataset.editPreview;c?(s.src=c,a.append(s)):a.textContent="No image yet";let d=j=>{a.replaceChildren(s),s.src=j},f=le({onFile:j=>d(URL.createObjectURL(j))}),u=document.createElement("label");u.className="le-field",u.append("Or paste an image URL");let w=document.createElement("input");w.type="url",w.placeholder="https://...",w.className="le-input",w.addEventListener("change",()=>{let j=w.value.trim();j&&d(j.startsWith("http")?j:`https://${j}`)}),u.append(w);let v=document.createElement("div");v.className="le-hint",v.textContent="Nothing changes on your site until you publish.";let b=(j,_,Y,re)=>{let se=document.createElement("label");se.className="le-field le-divided",se.append(_);let H=document.createElement("input");if(H.type="text",H.dataset.imgAttr=j,H.value=Y??"",H.dataset.imgAttrWas=Y??"",H.className="le-input",se.append(H),re){let ee=document.createElement("span");ee.className="le-hint",ee.textContent=re,se.append(ee)}return se},E=O("div","le-ways"),S=()=>{x.querySelectorAll(".le-staged").forEach(_=>_.remove());let j=O("div","le-hint le-staged","This is a preview. Press Save changes to keep it.");x.prepend(j)},L=(j,_)=>new Promise(Y=>{let re=l.modal({title:"Which part of the picture?",subtitle:"The shape is the spot it has to fill. Drag to choose what stays in it."}),se=O("div","le-crop-stage");se.style.cssText="position:relative;display:inline-block;max-width:100%;line-height:0;touch-action:none;";let H=document.createElement("img");H.alt="",H.style.cssText="max-width:100%;max-height:52vh;display:block;",H.src=URL.createObjectURL(j);let ee=O("div","le-crop-frame");ee.style.cssText="position:absolute;border:2px solid #fff;box-shadow:0 0 0 9999px rgba(0,0,0,.45);cursor:move;",se.append(H,ee),re.body.append(se);let Ve=O("div","le-row");Ve.style.marginTop="14px";let ke=O("button","le-btn-publish","Use this part");ke.type="button";let Re=O("button","le-btn-outline","Whole picture");Re.type="button",Ve.append(ke,Re),re.body.append(Ve);let ie={x:0,y:0,width:0,height:0},dt=()=>{ee.style.left=`${ie.x}px`,ee.style.top=`${ie.y}px`,ee.style.width=`${ie.width}px`,ee.style.height=`${ie.height}px`},na=()=>{ie=wn({width:H.clientWidth,height:H.clientHeight},_),dt()};H.addEventListener("load",na);let ze=null;ee.addEventListener("pointerdown",ce=>{ze={x:ce.clientX,y:ce.clientY,at:{...ie}},ee.setPointerCapture(ce.pointerId),ce.preventDefault()}),ee.addEventListener("pointermove",ce=>{ze&&(ie=vn(ze.at,{x:ce.clientX-ze.x,y:ce.clientY-ze.y},{width:H.clientWidth,height:H.clientHeight}),dt())}),ee.addEventListener("pointerup",()=>{ze=null});let bn=ce=>{URL.revokeObjectURL(H.src),re.close(),Y(ce)};ke.addEventListener("click",()=>{bn(yn(ie,H.clientWidth,H.naturalWidth))}),Re.addEventListener("click",()=>bn(vo))}),T=({url:j,file:_,credit:Y,alt:re,creditBy:se,creditUrl:H,creditSource:ee,creditSourceUrl:Ve})=>{if(y.crop=null,_){let Re=new DataTransfer;Re.items.add(_),f.querySelector("input[type=file]").files=Re.files,d(URL.createObjectURL(_));let ie=It(y.element);ie&&L(_,ie.width/ie.height).then(dt=>{y.crop=dt})}else j&&(w.value=j,d(j));let ke=x.querySelector('[data-img-attr="alt"]');re&&ke&&ke.value.trim()===""&&(ke.value=re),y.credit={credit:Y??"",creditBy:se??"",creditUrl:H??"",creditSource:ee??"",creditSourceUrl:Ve??""},y.creditFor=y.target,X(y.credit),S()},R=O("p","le-credit"),X=j=>{let _=(j?.credit??"").trim();R.textContent=_,R.hidden=_===""};X({credit:pt(e,"data-edit-credit","editCredit")});let M=O("button","le-btn le-wide",t?"Replace background":"Replace image");if(M.type="button",M.addEventListener("click",()=>an(e,T,"Free photos",t?"background":"image")),E.append(M),f.hidden=!0,u.hidden=!0,x.append(a,R,E,f,u,v),y.target.startsWith("setting:")&&!t&&x.append(b("alt","Alt text",pt(e,"alt","editAlt"),"Describes the image for search engines and screen readers."),b("imgTitle","Title attribute",pt(e,"title","editTitle"),"Optional tooltip shown on hover.")),y.target.startsWith("setting:")){let j=document.createElement("button");j.type="button",j.textContent=t?"Remove background":"Remove image",j.className="le-btn-danger",j.addEventListener("click",async()=>{let _=t?"Remove this background image? The section keeps its layout and colour.":"Remove this image? The section keeps its layout; you can add a new image any time.";if(!window.confirm(_))return;let Y=new FormData;Y.append("target",y.target),Y.append("remove","1"),await D("/live-edit/image",{method:"POST",body:Y}),I("Removed \u2713")}),x.append(j)}ye(e)},ln=e=>e?.closest?.("a[data-edit], a[data-edit-href]")??null,Go=e=>{let t=e?.getAttribute("href")??"";return t!==""&&t!=="#"&&!t.startsWith("javascript:")},ve=null,Ct=!1,st=null,At=()=>{st&&(clearTimeout(st),st=null)},dn=()=>{At(),st=setTimeout(()=>{Ct||He()},140)},Xo=e=>{if(e===ve&&!J.classList.contains("hidden"))return;ve=e;let t=e.getBoundingClientRect();J.style.top=`${t.top+window.scrollY-10}px`,J.style.left=`${t.right+window.scrollX-10}px`,J.classList.add("is-visible")},He=()=>{J.classList.remove("is-visible"),ve=null},cn=e=>{if(!e?.closest)return null;let t=e.closest("[data-style-edit]");if(t)return{element:t,kind:"style"};let a=e.closest("[data-edit-img]");if(a)return{element:a,kind:"image"};let s=e.closest("[data-edit-icon]");if(s)return{element:s,kind:"icon"};let p=e.closest("[data-edit-svg]");if(p)return{element:p,kind:"svg"};let g=e.closest("[data-edit]");if(g)return{element:g,kind:"text"};let c=e.closest("[data-edit-href]:not([data-edit])");if(c)return{element:c,kind:"link"};let d=e.closest("[data-edit-bg]");if(d)return{element:d,kind:"image"};let f=e.closest("[data-style]:not([data-style-edit])");return f?{element:f,kind:"style"}:null},Qo=({element:e,kind:t})=>{t==="image"?St(e):t==="icon"?Ko(e):t==="svg"?sn(e):t==="text"?it(e):t==="link"?xt(e):Et(e)},Lt=null,xe=()=>l.hoverBox.classList.remove("is-visible"),Zo=e=>{let t=e.getBoundingClientRect();if(t.width<4||t.height<4){xe();return}Object.assign(l.hoverBox.style,{top:`${t.top}px`,left:`${t.left}px`,width:`${t.width}px`,height:`${t.height}px`}),l.hoverBox.classList.toggle("is-flipped",t.top<26),l.hoverLabel.textContent=e.dataset.editLabel??ae(e),l.hoverBox.classList.add("is-visible")};document.addEventListener("pointermove",e=>{if(!document.body.classList.contains("editing")){xe();return}if(e.target===l.root||l.root.contains(e.target)){xe();return}Lt||(Lt=requestAnimationFrame(()=>{Lt=null;let t=cn(e.target);t?Zo(t.element):xe()}))}),document.addEventListener("scroll",xe,!0),document.addEventListener("pointerleave",xe);let lt=null,Tt=()=>{oe.classList.remove("is-visible"),lt=null},ea=e=>{lt=e;let t=e.getBoundingClientRect();oe.style.top=`${Math.max(t.top,8)+8}px`,oe.style.left=`${t.left+8}px`,oe.classList.add("is-visible")};oe.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),lt&&Et(lt),Tt()}),document.addEventListener("pointerover",e=>{if(!document.body.classList.contains("editing"))return;let t=e.target.closest?.("[data-has-bg]");t&&ea(t);let a=ln(e.target);a&&Go(a)&&(At(),Xo(a))}),document.addEventListener("pointerout",e=>{document.body.classList.contains("editing")&&e.relatedTarget!==J&&(ln(e.relatedTarget)===ve&&ve||dn())}),J.addEventListener("pointerenter",()=>{Ct=!0,At()}),J.addEventListener("pointerleave",()=>{Ct=!1,dn()}),J.addEventListener("click",e=>{if(e.preventDefault(),e.stopPropagation(),!ve)return;let t=ve;t.dataset.edit!==void 0?it(t):xt(t),He()}),document.addEventListener("click",e=>{if(!document.body.classList.contains("editing")||kt||e.target===l.root||l.root.contains(e.target)||e.target.closest("[data-live-create]"))return;let t=cn(e.target);t&&(e.preventDefault(),e.stopImmediatePropagation(),Qo(t))},!0),document.addEventListener("keydown",e=>{if(e.key==="Escape"&&l.shadow.querySelector(".le-scrim")||(e.key==="Escape"&&P.classList.contains("is-open")&&be(),!document.body.classList.contains("editing"))||e.key!=="Enter"&&e.key!==" "||l.shadow.activeElement)return;let t=document.activeElement;t?.matches("[data-edit-img], [data-edit-bg]")?(e.preventDefault(),St(t)):t?.matches("[data-edit]")&&!t.matches("button, a")&&(e.preventDefault(),it(t))}),Q?.addEventListener("click",()=>Be(!document.body.classList.contains("editing"))),l.changesButton?.addEventListener("click",()=>{document.body.classList.contains("editing")||Be(!0),Oe("Changes"),yt()});let pn=e=>{if(window.liveEditPublishing){e(window.liveEditPublishing);return}C().then(()=>window.liveEditPublishing&&e(window.liveEditPublishing))};pn(e=>{let t=e.pending??0,a=()=>{l.publishButton.hidden=!1,l.previewButton.hidden=!1,l.publishLabel.textContent=t>0?"Publish":"Published",l.publishCount.textContent=String(t),l.publishCount.hidden=t===0,l.publishButton.disabled=t===0,l.publishButton.title=t>0?`Put ${t} change${t===1?"":"s"} live`:"Nothing is waiting to be published"};a();let s=async()=>{let g=t===1?"":"s",c=e.domain??window.location.host,d=l.modal({title:`Publish ${t} change${g}`,subtitle:`They go live on ${c} right away.`,size:"is-narrow"});d.body.append(te("Loading\u2026"));let f=O("button","le-btn-outline","Keep editing");f.type="button",f.addEventListener("click",()=>d.close());let u=O("button","le-btn-publish","Publish now");u.type="button",d.foot.hidden=!1,d.foot.append(f,u),u.focus();try{let b=(await(await D("/live-edit/changes",{method:"GET"})).json())?.changes??[],E=O("div","le-review");b.forEach(S=>{let L=O("div","le-review-row");L.append(O("div","le-review-what",wt(S)),O("div","le-review-to",Xt(S)||"(empty)")),E.append(L)}),d.body.replaceChildren(b.length>0?E:te("Nothing is waiting."))}catch(w){d.body.replaceChildren(te(K(w,"list what is waiting")))}u.addEventListener("click",async()=>{u.disabled=!0,f.disabled=!0,u.textContent="Publishing\u2026",d.allowDismiss(!1);try{await D("/live-edit/publish",{method:"POST"}),t=0,a(),d.close(),I(`Live on ${c} \u2713`)}catch(w){d.allowDismiss(!0),u.disabled=!1,f.disabled=!1,u.textContent="Try again",d.body.replaceChildren(te(K(w,"publish that")))}})};l.publishButton.addEventListener("click",()=>{t!==0&&(document.activeElement?.blur?.(),s())});let p=()=>{let g=document.body.classList.contains("editing");be(!0),Be(!1),l.toolbar.style.display="none";let c=document.createElement("div");c.className="le-back";let d=null,f=!1,u=!1,w=()=>{if(!(f||u)){d?.remove(),d=null;return}let X=new URL(window.location.href);X.searchParams.set("live-edit",u?"published":"off"),d?.remove(),d=document.createElement("div"),d.className=f?"le-phone":"le-whole";let M=document.createElement("iframe");M.src=X.toString(),M.title=u?"This page as a visitor is being served it":"This page on a phone",d.append(M),l.shadow.append(d)},v=(R,X)=>R.map(([M,j,_])=>{let Y=O("button","le-back-btn",M);return Y.type="button",_&&(Y.title=_),Y.addEventListener("click",()=>{R.buttons.forEach(re=>re.classList.remove("is-on")),Y.classList.add("is-on"),X(j),w()}),c.append(Y),Y}),b=[["Desktop",!1],["Phone",!0]];b.buttons=v(b,R=>{f=R}),b.buttons[0].classList.add("is-on"),c.append(O("span","le-back-sep"));let E=[["Your drafts",!1,"The page with your unpublished work applied"],["What's live",!0,"The page exactly as a visitor is being served it right now"]];E.buttons=v(E,R=>{u=R,c.classList.toggle("is-live",R)}),E.buttons[0].classList.add("is-on");let S=O("span","le-back-note",e.version?`Published version ${e.version}`:"Nothing published yet");if(c.append(S),e.previewUrl){let R=O("button","le-back-btn","Copy a link to this");R.type="button",R.title="A link that shows this unpublished version to somebody else",R.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(e.previewUrl),l.toast("Link copied \u2713")}catch{window.prompt("Copy this link:",e.previewUrl)}}),c.append(R)}let L=O("button","le-back-btn","Back to editing");L.type="button",L.addEventListener("click",()=>{d?.remove(),d=null,c.remove(),document.removeEventListener("keydown",T,!0),l.toolbar.style.display="",Be(g)});let T=R=>{R.key==="Escape"&&L.click()};document.addEventListener("keydown",T,!0),c.append(L),l.shadow.append(c),L.focus()};l.previewButton.addEventListener("click",p)});let ta=()=>{let e=document.querySelectorAll('nav, [role="navigation"], header ul'),t=new Map,a=s=>s.closest("#wpadminbar, #adminmenu, #wp-toolbar, #live-edit-ui, [data-no-edit], [data-live-edit-chrome]")!==null;return e.forEach(s=>{a(s)||s.querySelectorAll("a[href]").forEach(p=>{if(a(p))return;let g;try{g=new URL(p.getAttribute("href"),window.location.href)}catch{return}if(g.origin!==window.location.origin||/\.(pdf|zip|jpe?g|png|gif|svg|webp|mp4|mp3)$/i.test(g.pathname)||g.pathname===window.location.pathname&&g.hash)return;let c=(p.textContent??"").replace(/\s+/g," ").trim();c===""||c.length>22||t.has(g.pathname)||t.set(g.pathname,{label:c,href:g.href})})}),[...t.values()].slice(0,6)};(()=>{let e=ta();if(e.length<2)return;let t=window.location.pathname.replace(/\/$/,"");e.forEach(a=>{let s=O("button","le-page-btn",a.label);s.type="button",s.title=a.href,new URL(a.href).pathname.replace(/\/$/,"")===t?s.classList.add("is-on"):s.addEventListener("click",()=>{sessionStorage.setItem("tb_editing","1"),window.location.href=a.href}),l.pageSwitcher.append(s)}),l.pageSwitcher.hidden=!1})();let ja=(async()=>{let e=l.languagePicker;if(!e)return;let t;try{t=await(await D("/live-edit/translations",{method:"GET"})).json()}catch{return}let a=t?.locales??[],s=t?.default_locale??"en";if(a.length<2)return;a.forEach(u=>{let w=O("option",null,t?.names?.[u]??u.toUpperCase());w.value=u,e.append(w)});let p=window.liveEditLocale??s;e.value=p,e.hidden=!1;let g=(u,w)=>{if(document.querySelectorAll("[data-live-edit-stale]").forEach(b=>b.removeAttribute("data-live-edit-stale")),w===s)return 0;let v=0;return(u??[]).filter(b=>b.locale===w&&b.current===!1).forEach(b=>{document.querySelectorAll(`[data-edit="setting:${CSS.escape(b.key)}"]`).forEach(E=>{E.setAttribute("data-live-edit-stale",""),v++})}),v},c=t?.stale??[];if(g(c,p),(t?.counts?.stale??0)>0&&p===s){let u=Object.keys(t?.needing_review??{}).length;m(u===1?`1 translation may need updating since the ${s.toUpperCase()} changed.`:`${u} languages have translations that may need updating.`)}let f=0;e.addEventListener("change",async()=>{let u=e.value,w=++f;e.disabled=!0;try{let v=await(await D(`/live-edit/content?locale=${encodeURIComponent(u)}`,{method:"GET"})).json();if(w!==f)return;window.liveEditLocale=u;let{applyContent:b}=await Promise.resolve().then(()=>(ft(),gt));b(document,v?.settings??{});try{c=(await(await D("/live-edit/translations",{method:"GET"})).json())?.stale??c}catch{}let E=g(c,u);m(u===s?"Editing the original.":E>0?`Editing in ${e.options[e.selectedIndex]?.text??u}. ${E===1?"1 sentence on this page has":`${E} sentences on this page have`} fallen behind the original.`:`Editing in ${e.options[e.selectedIndex]?.text??u}. Saves here do not change the original.`)}catch{if(w!==f)return;e.value=window.liveEditLocale??s,m("Could not load that language. Nothing has been changed.")}finally{w===f&&(e.disabled=!1)}})})(),un=`live-edit:redo:${n?.site??window.location.host}`,Nt=()=>{try{return JSON.parse(sessionStorage.getItem(un)??"[]")}catch{return[]}},hn=e=>{try{sessionStorage.setItem(un,JSON.stringify(e.slice(-20)))}catch{}},Ye=()=>{l.undoButton.disabled=(window.liveEditPublishing?.pending??0)===0,l.redoButton.disabled=Nt().length===0};pn(Ye),Ye();let gn=async()=>{l.undoButton.disabled=!0;let e;try{e=((await(await D("/live-edit/changes",{method:"GET"})).json())?.changes??[])[0]}catch(a){l.toast(K(a,"undo that")),Ye();return}if(!e){l.toast("There is nothing left to undo. Everything is published."),Ye();return}let t=wt(e);try{await D("/live-edit/changes",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:e.key,kind:e.kind})})}catch(a){l.toast(K(a,"undo that")),Ye();return}hn([...Nt(),{key:e.key,kind:e.kind,value:e.after,label:t}]),I(`Undone: ${t}`)},fn=async()=>{let e=Nt(),t=e.pop();if(!t){l.toast("There is nothing to put back.");return}l.redoButton.disabled=!0;try{if(t.kind==="style")throw new Error("A styling change cannot be put back automatically yet.");await D("/live-edit/setting",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:t.key,value:t.value,locale:window.liveEditLocale})})}catch(a){l.toast(K(a,"put that back")),l.redoButton.disabled=!1;return}hn(e),I(`Put back: ${t.label}`)};l.undoButton.addEventListener("click",()=>void gn()),l.redoButton.addEventListener("click",()=>void fn()),document.addEventListener("keydown",e=>{!(e.metaKey||e.ctrlKey)||e.key.toLowerCase()!=="z"||(l.shadow.activeElement??document.activeElement)?.closest?.('input, textarea, [contenteditable="true"]')||(e.preventDefault(),e.shiftKey?fn():gn())}),l.closeButton.addEventListener("click",()=>be()),l.cancelButton.addEventListener("click",()=>be()),l.saveButton.addEventListener("click",Oo),q?.addEventListener("click",async()=>{!y||y.kind!=="record"||window.confirm("Delete this item?")&&(await D(`/live-edit/record/${y.type}/${y.id}`,{method:"DELETE"}),I("Deleted \u2713"))}),document.querySelectorAll("[data-live-create]").forEach(e=>{e.addEventListener("click",async()=>{await D("/live-edit/record/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:e.dataset.liveCreate})}),I("Added \u2713 \u2014 click it to edit")})});let $t=new URLSearchParams(window.location.search);if($t.has("edit")){$t.delete("edit");let e=$t.toString();window.history.replaceState(null,"",window.location.pathname+(e?`?${e}`:"")),Be(!0)}else Be(sessionStorage.getItem("tb_editing")==="1")}};window.liveEditDisplayedValue=n=>jt({editValue:n.dataset.editValue,ownText:me(n),fullText:n.textContent});var Kt=(()=>{let n=!1;return()=>{if(n)return;let o=new URLSearchParams(window.location.search).get("live-edit");o==="off"||o==="published"||(n=!0,Pa())}})();document.readyState==="complete"?Kt():(window.addEventListener("load",Kt,{once:!0}),window.setTimeout(Kt,2e3));export{vo as WHOLE_PICTURE};
