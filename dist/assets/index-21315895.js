var q=Object.defineProperty;var z=(c,t,e)=>t in c?q(c,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):c[t]=e;var a=(c,t,e)=>(z(c,typeof t!="symbol"?t+"":t,e),e);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function e(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(n){if(n.ep)return;n.ep=!0;const i=e(n);fetch(n.href,i)}})();class I{constructor(t,e){a(this,"currentPage","");var s;this.defaultPage=t,this.pages=e;for(const n in e)(s=document.getElementById("app"))==null||s.appendChild(e[n].htmlElement),e[n].hide();window.onhashchange=n=>{this.onOpen()},location.hash.slice(1)==""?location.hash="#"+t:this.onOpen()}onOpen(){var o,l,d;let t={},e=this.defaultPage,n=location.hash.slice(1).split("&");n.length>0&&(e=n[0],n=n.splice(1));for(const r of n){let p=r.split("="),_=decodeURIComponent(p[0]),m=decodeURIComponent(p[1]);t[_]=m}let i=this.currentPage!=e;i&&(console.log("Hide page: "+this.currentPage),(o=this.pages[this.currentPage])==null||o.hide(),this.currentPage=e,console.log("Show page: "+e),(l=this.pages[this.currentPage])==null||l.show()),console.log("Calling page.update with: "+JSON.stringify(t)),(d=this.pages[this.currentPage])==null||d.update(t,i)}static open(t,e){window.setTimeout(()=>{let s="";for(let n in e)s+="&"+encodeURIComponent(n)+"="+encodeURIComponent(e[n]);location.hash="#"+encodeURIComponent(t)+s},200)}static back(){history.back()}}class u{constructor(){}static APPLY_COUNTED(t,e){return e.replace("{count}",t.toString())}}a(u,"TIME_LOCALE","en"),a(u,"TIME_YESTERDAY","yesterday"),a(u,"TIME_HOURS_AGO","{count} hour(s) ago"),a(u,"TIME_MINUTES_AGO","{count} minute(s) ago"),a(u,"TIME_SECONDS_AGO","{count} second(s) ago"),a(u,"TIME_TODAY_AT","today at"),a(u,"TIME_JUST_NOW","just now"),a(u,"APPNAME","Knowledgebase"),a(u,"LOGIN_KNOWN_CONNECTIONS","Reuse Connection"),a(u,"LOGIN_SESSION_NAME","Session Name"),a(u,"LOGIN_API_ENDPOINT_LABEL","API Endpoint URL"),a(u,"LOGIN_API_TOKEN_LABEL","API Token"),a(u,"LOGIN_SUBMIT","Add Connection"),a(u,"LOGIN_ERROR_MISSING_INPUTS","You must provide all fields (session name, api endpoint and api token)."),a(u,"LOGIN_ERROR_LOGIN_FAILED","The provided login information is wrong. Is the URL and API token correct?"),a(u,"LOGIN_OFFLINE_MODAL_QUESTION","Cannot connect to server. Do you want to continue in offline mode? Offline mode might show you outdated files and data."),a(u,"LOGIN_OFFLINE_MODAL_CONFIRM","Continue offline"),a(u,"LOGIN_OFFLINE_MODAL_CANCEL","Return to login"),a(u,"SEARCH_FILETREE_IS_NULL","Cannot retrieve list of files. Maybe you have a weak internet connection."),a(u,"SEARCH_PLACEHOLDER","Search (Keyword, Keyword, Keyword)"),a(u,"SEARCH_LAST_MODIFIED","modified"),a(u,"SEARCH_CREATED","created"),a(u,"SEARCH_NUM_RESULTS","files found"),a(u,"SEARCH_OFFLINE","(<span style='color: red'>offline</span>)"),a(u,"SEARCH_MORE_RESULTS","Click here to show more results!"),a(u,"SETTINGS_TITLE","Settings"),a(u,"SETTINGS_GENERAL","General"),a(u,"SETTINGS_CONNECTION","Connection"),a(u,"SETTINGS_SELECT_SERVER","Select server"),a(u,"SETTINGS_DISPLAY","Display"),a(u,"SETTINGS_SHOW_TXT_PREVIEWS","Show previews for text documents"),a(u,"SETTINGS_SHOW_IMG_PREVIEWS","Show previews for images"),a(u,"SETTINGS_SHOW_PDF_PREVIEWS","Show previews for PDFs"),a(u,"SETTINGS_AUTOLOGIN","Autoconnect to last server"),a(u,"UPLOAD_TITLE","Upload File"),a(u,"UPLOAD_FOLDERNAME","Foldername"),a(u,"UPLOAD_FILENAME","Filename"),a(u,"UPLOAD_FILE","File"),a(u,"UPLOAD_SEND","Upload"),a(u,"UPLOAD_FAILED","Upload failed. Reasons could be: The file already exists, the folder is invalid or the server is currently unreachable."),a(u,"EDIT_READ_FILE_ERROR","Cannot read file. Maybe your internet connection is too weak.");class b extends u{}a(b,"TIME_LOCALE","de"),a(b,"APPNAME","Wissensdatenbank");let h=u;function J(){switch(localStorage.language){case"de":h=b;break;case"en":case"us":default:h=u;break}}class g{constructor(t){a(this,"apiEndpoint","");a(this,"sessionToken","");this.session_name=t,this.loadSessionConfig()}getSessionName(){return this.session_name}loadSessionConfig(){if(localStorage.webfs_sessions){let t=JSON.parse(localStorage.webfs_sessions);if(this.session_name in t){let e=t[this.session_name];this.apiEndpoint=e.apiEndpoint,this.sessionToken=e.sessionToken}}}writeSessionConfig(t,e){this.apiEndpoint=t,this.sessionToken=e;let s={};localStorage.webfs_sessions&&(s=JSON.parse(localStorage.webfs_sessions)),s[this.session_name]={apiEndpoint:this.apiEndpoint,sessionToken:e},localStorage.webfs_sessions=JSON.stringify(s)}removeSession(){if(localStorage.webfs_sessions){let t=JSON.parse(localStorage.webfs_sessions);t.indexOf(this.session_name)>=0&&t.remove(this.session_name)}}async request(t){t.append("token",this.sessionToken);const e={method:"POST",body:t};try{return await fetch(this.apiEndpoint,e)}catch{return console.log("Cannot reach server. It appears you are offline."),null}}async ping(){let t=new FormData;t.append("cmd","ping"),t.append("uri",".");let e=await this.request(t);return e==null?!1:e.status!=200?(console.error(e.text()),!1):await e.text()=="pong"}async login(t,e){let s=new FormData;s.append("cmd","login"),s.append("uri","."),s.append("token",e);const n={method:"POST",body:s};let i;try{i=await fetch(t,n)}catch{return alert("Cannot connect to server. Do you have a working internet connection?"),!1}if(i.status!=200)return console.error(i.text()),!1;let o=await i.text();return this.writeSessionConfig(t,o),!0}buildFileTree(t){return t}async list(t){let e=new FormData;e.append("cmd","list"),e.append("uri",t);let s=await this.request(e);return s==null?null:s.status!=200?(console.error(s.text()),null):await s.json()}async walk(t){let e=new FormData;e.append("cmd","walk"),e.append("uri",t);let s=await this.request(e);if(s==null)return null;if(s.status!=200)return console.error(s.text()),null;let n=await s.json();return this.buildFileTree(n)}async md5(t){let e=new FormData;e.append("cmd","md5"),e.append("uri",t);let s=await this.request(e);return s==null?null:s.status!=200?(console.error(s.text()),null):s.text()}async open(t){let e=new FormData;e.append("cmd","open"),e.append("uri",t);let s=await this.request(e);return s==null?!1:s.status!=200?(console.error(s.text()),!1):(await s.text(),!0)}async readTxt(t){let e=new FormData;e.append("cmd","read"),e.append("uri",t);let s=await this.request(e);return s==null?null:s.status!=200?(console.error(s.text()),null):s.text()}readURL(t,e=0){let s="";return e!=0&&(s="&subsample=1&width="+e.toFixed(0)+"&height="+e.toFixed(0)),this.apiEndpoint+"?token="+encodeURIComponent(this.sessionToken)+"&cmd=read&uri="+encodeURIComponent(t)+s}read(t,e="_self"){function s(o,l,d){let r=document.createElement("input");r.type="hidden",r.name=l,r.value=d,o.appendChild(r)}let n=document.getElementsByTagName("body")[0],i=document.createElement("form");i.action=this.apiEndpoint,i.method="post",i.target=e,s(i,"cmd","read"),s(i,"token",this.sessionToken),s(i,"uri",t),n.appendChild(i),i.submit(),n.removeChild(i)}async putTxt(t,e,s){return this.putFile(t,e,s)}async putFile(t,e,s){let n="",i=new FormData;i.append("cmd","write"),i.append("operation","write"),i.append("uri",t),i.append("file",e),i.append("md5",s+","+n);let o=await this.request(i);return o==null?!1:o.status!=200?(console.error(o.text()),!1):(await o.text(),!0)}async mkdir(t){let e=new FormData;e.append("cmd","write"),e.append("operation","mkdir"),e.append("uri",t);let s=await this.request(e);return s==null?!1:s.status!=200?(console.error(s.text()),!1):(await s.text(),!0)}async rmdir(t){let e=new FormData;e.append("cmd","write"),e.append("operation","rmdir"),e.append("uri",t);let s=await this.request(e);return s==null?!1:s.status!=200?(console.error(s.text()),!1):(await s.text(),!0)}async mv(t,e){let s=new FormData;s.append("cmd","write"),s.append("operation","mv"),s.append("uri",t),s.append("target",e);let n=await this.request(s);return n==null?!1:n.status!=200?(console.error(n.text()),!1):(await n.text(),!0)}async rm(t,e){let s=new FormData;s.append("cmd","write"),s.append("operation","rm"),s.append("uri",t),s.append("md5",e);let n=await this.request(s);return n==null?!1:n.status!=200?(console.error(n.text()),!1):(await n.text(),!0)}}a(g,"instance",null);class w{constructor(t,e="",s=""){a(this,"parent",null);a(this,"htmlElement");a(this,"displayStyle","none");this.htmlElement=document.createElement(t),this.htmlElement.innerHTML=e,s!=""&&this.setClass(s)}add(t){this.htmlElement.appendChild(t.htmlElement),t.parent=this}remove(t){this.htmlElement.removeChild(t.htmlElement),t.parent=null}isVisible(){return this.htmlElement.style.display.toLowerCase()!="none"}hide(){this.isVisible()&&(this.displayStyle=this.htmlElement.style.display,this.htmlElement.style.display="None")}show(){this.displayStyle.toLowerCase()!="none"&&(this.htmlElement.style.display=this.displayStyle)}update(t,e){}select(){this.setClass("selected")}unselect(){this.unsetClass("selected")}setClass(t){this.htmlElement.classList.contains(t)||this.htmlElement.classList.add(t)}unsetClass(t){this.htmlElement.classList.contains(t)||this.htmlElement.classList.remove(t)}}class E extends w{constructor(t,e=""){super("a",t,e),this.htmlElement.onclick=s=>{s.stopPropagation(),this.onClick()}}onClick(){console.log("Buttom::onClick: Not implemented! Must be implemented by subclass.")}}class K extends w{constructor(...t){super("div");for(const e of t)this.add(e)}submit(){let t=new FormData;for(const e in this.htmlElement.children){let s=this.htmlElement.children[e];s instanceof HTMLInputElement&&t.append(s.name,s.value)}this.onSubmit(t)}onSubmit(t){console.log("Form::onSubmit: Not implemented! Must be implemented by subclass."),console.log(t)}}class O extends w{constructor(t,e,s,n=""){super("input"),this.htmlElement.name=t,this.htmlElement.placeholder=e,this.htmlElement.type=s,n!=""&&this.setClass(n),this.htmlElement.oninput=()=>{this.onChange(this.htmlElement.value)},this.htmlElement.onchange=()=>{this.onChangeDone(this.htmlElement.value)}}value(t=void 0){return t!==void 0&&(this.htmlElement.value=t),this.htmlElement.value}onChange(t){}onChangeDone(t){}}class v extends w{constructor(t,e=""){super("label",t,e)}}class N extends w{constructor(e,s,n="",i=!1){super("div");a(this,"checkbox");this.checkbox=new w("input"),this.checkbox.htmlElement.name=e,this.checkbox.htmlElement.type="checkbox",this.checkbox.htmlElement.checked=i,n!=""&&this.setClass(n),this.checkbox.htmlElement.onchange=()=>{this.onChange(this.checkbox.htmlElement.checked)},this.add(this.checkbox);let o=new w("label");o.htmlElement.innerHTML=s,this.add(o)}onChange(e){console.log("Checkbox::onChange: Not implemented! Must be implemented by subclass.")}value(e=void 0){return e!==void 0&&(this.checkbox.htmlElement.checked=e),this.checkbox.htmlElement.checked}}class $ extends E{onClick(){this.parent.submit()}}let Q='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z"/></svg>',X='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--! Font Awesome Pro 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>';class B extends w{constructor(e,s){var n;super("div");a(this,"container");this.setClass(e),this.container=new w("div"),this.container.setClass(s),this.container.add(this),(n=document.getElementById("global"))==null||n.appendChild(this.container.htmlElement)}dispose(){var e;this.onExit(),(e=document.getElementById("global"))==null||e.removeChild(this.container.htmlElement)}onExit(){}update(){}}class Z extends B{constructor(t,e,s,n,i){super(t,e),this.add(new w("p",s));let o=new E(n);o.onClick=()=>{this.dispose(),this.onConfirm()},this.add(o);let l=new E(i);l.onClick=()=>{this.dispose(),this.onCancel()},this.add(l)}onConfirm(){console.log("ConfirmCancelPopup::onConfirm not implemented. Must be implemented by subclass.")}onCancel(){console.log("ConfirmCancelPopup::onCancel not implemented. Must be implemented by subclass.")}}class W extends B{constructor(t,e,s=""){super(t,e);let n=new E(X,s);n.onClick=this.dispose.bind(this),this.add(n)}update(){}}class ee extends w{constructor(){super("div");a(this,"connections");this.setClass("loginView"),this.connections=new w("div"),this.add(this.connections);let e=new K(new v(h.LOGIN_SESSION_NAME,"loginLabel"),new O("sessionName","myserver","text","loginInput"),new v(h.LOGIN_API_ENDPOINT_LABEL,"loginLabel"),new O("apiEndpoint","https://myserver/webfs/api.php","url","loginInput"),new v(h.LOGIN_API_TOKEN_LABEL,"loginLabel"),new O("apiToken","a4ef9...","password","loginInput"),new $(h.LOGIN_SUBMIT,"buttonWide"));e.setClass("loginForm"),e.onSubmit=this.onCreateSession.bind(this),this.add(e)}update(e,s){if(this.connections.htmlElement.innerHTML="",localStorage.kb_sessions){let n=JSON.parse(localStorage.kb_sessions);n.length>0&&this.connections.add(new v(h.LOGIN_KNOWN_CONNECTIONS,"loginLabel"));for(const i of n){let o=new E(i,"loginKnownConnectionButton");o.onClick=()=>{V(i)},this.connections.add(o)}if(n.length>0){let i=new w("hr");i.setClass("loginDivider"),this.connections.add(i)}}}async onCreateSession(e){let s=e.get("sessionName"),n=e.get("apiEndpoint"),i=e.get("apiToken");if(s==""||n==""||i==""||s==null||n==null||i==null){alert(h.LOGIN_ERROR_MISSING_INPUTS);return}let o=new g(s);if(await o.login(n,i)){let l=[];localStorage.kb_sessions&&(l=JSON.parse(localStorage.kb_sessions)),l.push(s),localStorage.kb_sessions=JSON.stringify(l),g.instance=o,I.back()}else alert(h.LOGIN_ERROR_LOGIN_FAILED)}}async function V(c,t=!1){console.log("Connecting to: "+c);let e=new g(c);if(await e.ping())g.instance=e,localStorage.kb_last_session=c,t||I.back();else{let s=new Z("popupContent","popupContainer",h.LOGIN_OFFLINE_MODAL_QUESTION,h.LOGIN_OFFLINE_MODAL_CONFIRM,h.LOGIN_OFFLINE_MODAL_CANCEL);return new Promise(n=>{s.onConfirm=()=>{g.instance=e,localStorage.kb_last_session=c,t||I.back(),n()},s.onCancel=()=>{n()}})}}async function te(){if(localStorage.kb_sessions){let c=JSON.parse(localStorage.kb_sessions);if(c.length>0){let t=c[0];localStorage.kb_last_session&&(t=localStorage.kb_last_session),await V(t,!0)}}}const se=6,ne=6,ie=10,oe=12,le=.001,k=31557600,x=2629800,A=86400,M=3600,P=60;function ae(c,t="long"){let e=new Date;const s=G(e,c),{hours:n,minutes:i,seconds:o}=s;let l=new Date(e.toISOString().substring(0,10)),d=new Date(c.toISOString().substring(0,10));const r=G(l,d),{years:p,months:_,days:m}=r;return p>100?"unknown":p>0||_>ne?H(c,{includeYear:!0,length:t}):_>0||m>se?H(c,{includeYear:!1,length:t}):m>1?c.toLocaleDateString(h.TIME_LOCALE,{weekday:t}):m===1?h.TIME_YESTERDAY:n>oe?h.TIME_TODAY_AT+" "+c.toLocaleTimeString(h.TIME_LOCALE,{hour:"numeric",minute:"2-digit"}):n>0?h.APPLY_COUNTED(n,h.TIME_HOURS_AGO):i>0?h.APPLY_COUNTED(i,h.TIME_MINUTES_AGO):o>ie?h.APPLY_COUNTED(o,h.TIME_SECONDS_AGO):h.TIME_JUST_NOW}function H(c,{includeYear:t,length:e}){const s=c.toLocaleDateString(h.TIME_LOCALE,{month:e});let i=`${c.getDate().toString()}. ${s}`;return t&&(i+=` ${c.getFullYear()}`),i}function U(c){return Math.floor(c*le)}function G(c,t){const e={years:0,months:0,days:0,hours:0,minutes:0,seconds:0};let s=U(c.valueOf())-U(t.valueOf());return e.years=Math.floor(s/k),s-=e.years*k,e.months=Math.floor(s/x),s-=e.months*x,e.days=Math.floor(s/A),s-=e.days*A,e.hours=Math.floor(s/M),s-=e.hours*M,e.minutes=Math.floor(s/P),s-=e.minutes*P,e.seconds=s,e}let re='<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40H456c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1H416 392c-22.1 0-40-17.9-40-40V448 384c0-17.7-14.3-32-32-32H256c-17.7 0-32 14.3-32 32v64 24c0 22.1-17.9 40-40 40H160 128.1c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2H104c-22.1 0-40-17.9-40-40V360c0-.9 0-1.9 .1-2.8V287.6H32c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"/></svg>',Y='<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/></svg>',F='<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M287.9 0c9.2 0 17.6 5.2 21.6 13.5l68.6 141.3 153.2 22.6c9 1.3 16.5 7.6 19.3 16.3s.5 18.1-5.9 24.5L433.6 328.4l26.2 155.6c1.5 9-2.2 18.1-9.6 23.5s-17.3 6-25.3 1.7l-137-73.2L151 509.1c-8.1 4.3-17.9 3.7-25.3-1.7s-11.2-14.5-9.7-23.5l26.2-155.6L31.1 218.2c-6.5-6.4-8.7-15.9-5.9-24.5s10.3-14.9 19.3-16.3l153.2-22.6L266.3 13.5C270.4 5.2 278.7 0 287.9 0zm0 79L235.4 187.2c-3.5 7.1-10.2 12.1-18.1 13.3L99 217.9 184.9 303c5.5 5.5 8.1 13.3 6.8 21L171.4 443.7l105.2-56.2c7.1-3.8 15.6-3.8 22.6 0l105.2 56.2L384.2 324.1c-1.3-7.7 1.2-15.5 6.8-21l85.9-85.1L358.6 200.5c-7.8-1.2-14.6-6.1-18.1-13.3L287.9 79z"/></svg>',j='<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 448 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M64 32C64 14.3 49.7 0 32 0S0 14.3 0 32V64 368 480c0 17.7 14.3 32 32 32s32-14.3 32-32V352l64.3-16.1c41.1-10.3 84.6-5.5 122.5 13.4c44.2 22.1 95.5 24.8 141.7 7.4l34.7-13c12.5-4.7 20.8-16.6 20.8-30V66.1c0-23-24.2-38-44.8-27.7l-9.6 4.8c-46.3 23.2-100.8 23.2-147.1 0c-35.1-17.6-75.4-22-113.5-12.5L64 48V32z"/></svg>',R='<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 448 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M48 24C48 10.7 37.3 0 24 0S0 10.7 0 24V64 350.5 400v88c0 13.3 10.7 24 24 24s24-10.7 24-24V388l80.3-20.1c41.1-10.3 84.6-5.5 122.5 13.4c44.2 22.1 95.5 24.8 141.7 7.4l34.7-13c12.5-4.7 20.8-16.6 20.8-30V66.1c0-23-24.2-38-44.8-27.7l-9.6 4.8c-46.3 23.2-100.8 23.2-147.1 0c-35.1-17.6-75.4-22-113.5-12.5L48 52V24zm0 77.5l96.6-24.2c27-6.7 55.5-3.6 80.4 8.8c54.9 27.4 118.7 29.7 175 6.8V334.7l-24.4 9.1c-33.7 12.6-71.2 10.7-103.4-5.4c-48.2-24.1-103.3-30.1-155.6-17.1L48 338.5v-237z"/></svg>',ce='<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M64 480H448c35.3 0 64-28.7 64-64V160c0-35.3-28.7-64-64-64H288c-10.1 0-19.6-4.7-25.6-12.8L243.2 57.6C231.1 41.5 212.1 32 192 32H64C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64z"/></svg>',de='<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 448 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M246.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 109.3V320c0 17.7 14.3 32 32 32s32-14.3 32-32V109.3l73.4 73.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-128-128zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32v64c0 53 43 96 96 96H352c53 0 96-43 96-96V352c0-17.7-14.3-32-32-32s-32 14.3-32 32v64c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V352z"/></svg>';class he extends w{constructor(){super("div");a(this,"searchField");a(this,"results");a(this,"fileTree",null);a(this,"isOffline",!1);a(this,"favouritesOnly",!1);a(this,"todoOnly",!1);this.searchField=new O("search",h.SEARCH_PLACEHOLDER,"search","searchInput"),this.searchField.onChange=r=>{this.updateSearchResults()},this.searchField.onChangeDone=r=>{I.open("search",{q:r})},this.add(this.searchField),this.results=new w("div"),this.results.setClass("searchResults"),this.add(this.results);let e=new w("div","","searchBottomNavbar"),s=new E(re,"searchBottomNavbarIcon");s.onClick=()=>{this.searchField.htmlElement.value="",this.searchField.onChangeDone("")},e.add(s);let n=new E(ce,"searchBottomNavbarIcon");n.onClick=()=>{this.searchField.htmlElement.value="/",this.searchField.onChangeDone("/")},e.add(n);let i=new E(F,"searchBottomNavbarIcon");i.onClick=()=>{this.favouritesOnly=!this.favouritesOnly,this.favouritesOnly?i.htmlElement.innerHTML=Y:i.htmlElement.innerHTML=F,this.updateSearchResults()},e.add(i);let o=new E(R,"searchBottomNavbarIcon");o.onClick=()=>{this.todoOnly=!this.todoOnly,this.todoOnly?o.htmlElement.innerHTML=j:o.htmlElement.innerHTML=R,this.updateSearchResults()},e.add(o),this.add(e);let l=new E(de,"searchUploadButton");l.onClick=()=>{let r="/",p=this.searchField.value().split(",").map(_=>_.trim());for(let _ of p)if(_.startsWith("/")){r=_;break}new fe(r,"",this.triggerFullUpdate.bind(this))},this.add(l);let d=new E(Q,"settingsOpen");d.onClick=()=>{let r=new pe;r.onExit=this.updateSearchResults.bind(this)},this.add(d)}triggerFullUpdate(){this.update({q:this.searchField.value()},!0)}async update(e,s){var n;if(g.instance==null){I.open("login",{});return}if(s)if(this.fileTree=await((n=g.instance)==null?void 0:n.walk(".")),this.fileTree==null){let i=g.instance.getSessionName(),o=localStorage["kb_filetree_cache_"+i];o&&(this.fileTree=JSON.parse(o)),this.isOffline=!0}else{let i=g.instance.getSessionName(),o=JSON.stringify(this.fileTree);localStorage["kb_filetree_cache_"+i]=o,this.isOffline=!1}this.searchField.value(e.q),this.updateSearchResults()}async updateSearchResults(e=50){let s=this.searchField.value();if(this.results.htmlElement.innerHTML="",this.fileTree==null){alert(h.SEARCH_FILETREE_IS_NULL);return}let n=this.flatten(this.fileTree);n=this.sortFilesByLastModified(n),n=this.sortFilesByRelevance(n,s),n=n.filter(o=>{let l=D(o.filepath).filename;return!(this.favouritesOnly&&!l.includes(".fav")||this.todoOnly&&!l.includes(".todo"))}),this.showNumResults(n);let i=n.length;n=n.slice(0,e);for(let o of n)this.results.add(new ue(o.filepath,o.modified!=null?ae(o.modified):"",o.isFolder,this.searchField,this.triggerFullUpdate.bind(this)));if(i>e){let o=new w("div");o.htmlElement.innerText=h.SEARCH_MORE_RESULTS,o.setClass("searchMoreResults"),o.htmlElement.onclick=()=>{this.updateSearchResults(e+25)},this.results.add(o)}}showNumResults(e){let s=new w("div"),n="";this.isOffline&&(n=" "+h.SEARCH_OFFLINE),s.htmlElement.innerHTML=e.length+" "+h.SEARCH_NUM_RESULTS+n,s.setClass("searchNumResults"),this.results.add(s)}sortFilesByRelevance(e,s){let n=s.toLowerCase().split(",").map(l=>l.trim()),i=[];for(let l of e){let{filename:d,folder:r}=D(l.filepath);d=d.toLowerCase(),r=r.toLowerCase();var o=0;for(let p of n){if(p==""){o+=1;continue}let _=p.startsWith("/"),m=p.substring(1);m==""&&(m="."),!_&&d.includes(p)&&(o+=100,l.isFolder&&(o+=10)),_&&l.isFolder&&d.includes(m)&&l.filepath.toLowerCase()!=m&&(o+=125,d==m&&(o+=25)),_&&r==m&&(o+=100,l.isFolder&&(o+=10))}o>0&&(d.includes(".fav")&&(o+=3),d.includes(".todo")&&(o+=4),i.push({filepath:l.filepath,modified:l.modified,isFolder:l.isFolder,score:o}))}return i.sort((l,d)=>d.score-l.score)}sortFilesByLastModified(e){return e.sort((s,n)=>s.modified==null?1:n.modified==null?-1:n.modified.toISOString().localeCompare(s.modified.toISOString()))}flatten(e,s="",n=[]){for(const i in e){const o=e[i];typeof o!="string"?(n=this.flatten(o,s+i+"/",n),n.push({filepath:s+i,modified:null,isFolder:!0})):n.push({filepath:s+i,modified:new Date(o),isFolder:!1})}return n}}class ue extends w{constructor(t,e,s,n,i){super("div"),this.setClass("searchResult");let{filename:o,folder:l}=D(t),d=o.split(".");s&&d.push("DIR");let r=d[d.length-1].toLowerCase();if(localStorage.kb_allow_img_previews=="true"&&(r=="png"||r=="jpg"||r=="jpeg"||r=="tiff"||r=="tif")||localStorage.kb_allow_pdf_previews=="true"&&r=="pdf"){let f=document.createElement("img");f.classList.add("searchResultPreview"),f.onerror=()=>{let S=document.createElement("div");S.innerHTML="<BR>"+r.toUpperCase(),S.classList.add("searchResultPreview"),this.htmlElement.replaceChild(S,this.htmlElement.childNodes[0])},f.src=g.instance.readURL(t,256),this.htmlElement.appendChild(f)}else if(localStorage.kb_allow_txt_previews=="true"&&(r=="txt"||r=="md"||r=="py"||r=="csv"||r=="json")){let f=document.createElement("div");f.style.fontSize="1em",f.style.textAlign="left",f.innerHTML="loading...",me.getTxtPreview(t).then(S=>{let L=S.split(`
`);L=L.map((C,y,T)=>C.startsWith("#")?"<b style='font-size: 1.2em'>"+C+"</b>":C),S=L.join("<BR>"),f.innerHTML=S}),f.classList.add("searchResultPreview"),this.htmlElement.appendChild(f)}else{let f=document.createElement("div");f.innerHTML="<BR>"+r.toUpperCase(),f.classList.add("searchResultPreview"),this.htmlElement.appendChild(f)}let p=document.createElement("div");p.classList.add("searchResultMeta"),this.htmlElement.appendChild(p);let _=document.createElement("div");if(_.innerText=o.replace(".todo","").replace(".fav",""),_.classList.add("searchResultFilename"),p.appendChild(_),e!=""){let f=document.createElement("div");f.innerText=h.SEARCH_LAST_MODIFIED+": "+e,f.classList.add("searchResultModified"),p.appendChild(f)}let m=document.createElement("div");if(m.innerText=l,m.classList.add("searchResultFolder"),p.appendChild(m),this.htmlElement.onclick=()=>{s?(n.htmlElement.value="/"+t,n.onChange(n.htmlElement.value),n.onChangeDone(n.htmlElement.value)):I.open("edit",{folder:l,filename:o})},!s){let f=new w("div","","searchResultFlagButtonContainer"),S=o.includes(".fav"),L=new E(S?Y:F,"searchResultFlagButton");L.onClick=async()=>{if(g.instance!=null){if(S)await g.instance.mv(t,t.replace(".fav",""));else{let T=t.split(".");T.splice(T.length-1,0,"fav"),await g.instance.mv(t,T.join("."))}i()}},f.add(L);let C=o.includes(".todo"),y=new E(C?j:R,"searchResultFlagButton");y.onClick=async()=>{if(g.instance!=null){if(C)await g.instance.mv(t,t.replace(".todo",""));else{let T=t.split(".");T.splice(T.length-1,0,"todo"),await g.instance.mv(t,T.join("."))}i()}},f.add(y),this.add(f)}}}function D(c){let t=c.split("/"),e=t.pop(),s=t.join("/");return s==""&&(s="."),{filename:e,folder:s}}class me{constructor(){}static async getTxtPreview(t){let e=JSON.parse(localStorage.getItem("kb_preview_cache")||"{}");if(e[t])return e[t];let s=await g.instance.readTxt(t);if(s!=null){let n=s.split(`
`).slice(0,13);n=n.map((o,l,d)=>o.slice(0,40)),s=n.join(`
`);let i=JSON.parse(localStorage.getItem("kb_preview_cache")||"{}");return i[t]=s,localStorage.setItem("kb_preview_cache",JSON.stringify(i)),s}return"error loading preview"}static async getImgPreview(t){return""}}class pe extends W{constructor(){super("fullscreenPopupContent","fullscreenPopupContainer","fullscreenPopupExitBtn"),this.add(new w("div",h.SETTINGS_TITLE,"popupTitle")),this.add(new w("div",h.SETTINGS_GENERAL,"popupSubtitle")),this.add(new w("div",h.SETTINGS_DISPLAY,"popupSubtitle"));let t=new N("showTxtPreviews",h.SETTINGS_SHOW_TXT_PREVIEWS,"settingsCheckbox",localStorage.kb_allow_txt_previews=="true");t.onChange=o=>{localStorage.kb_allow_txt_previews=o},this.add(t);let e=new N("showImgPreviews",h.SETTINGS_SHOW_IMG_PREVIEWS,"settingsCheckbox",localStorage.kb_allow_img_previews=="true");e.onChange=o=>{localStorage.kb_allow_img_previews=o},this.add(e);let s=new N("showPDFPreviews",h.SETTINGS_SHOW_PDF_PREVIEWS,"settingsCheckbox",localStorage.kb_allow_pdf_previews=="true");s.onChange=o=>{localStorage.kb_allow_pdf_previews=o},this.add(s),this.add(new w("div",h.SETTINGS_CONNECTION,"popupSubtitle"));let n=new E(h.SETTINGS_SELECT_SERVER,"buttonWide");n.onClick=()=>{this.dispose(),I.open("login",{})},this.add(n);let i=new N("autoLogin",h.SETTINGS_AUTOLOGIN,"settingsCheckbox",localStorage.kb_autologin=="true");i.onChange=o=>{localStorage.kb_autologin=o},this.add(i)}update(){}}class fe extends W{constructor(t,e,s){super("fullscreenPopupContent","fullscreenPopupContainer","fullscreenPopupExitBtn"),this.setClass("upload"),this.add(new w("div",h.UPLOAD_TITLE,"popupTitle")),this.add(new v(h.UPLOAD_FOLDERNAME));let n=new O("foldername",t,"text");n.value(t),this.add(n),this.add(new v(h.UPLOAD_FILENAME));let i=new O("filename",e,"text");i.value(e),this.add(i),this.add(new v(h.UPLOAD_FILE));let o=new O("file","","file","fileInput");o.onChangeDone=d=>{if(i.value()==""){let r=d.replaceAll("\\","/").split("/");i.value(r[r.length-1])}},this.add(o);let l=new E(h.UPLOAD_SEND,"buttonWide");l.onClick=async()=>{if(g.instance==null)return;l.htmlElement.disabled=!0;let d=o.htmlElement.files[0],r=n.value();r.endsWith("/")&&(r=r.slice(0,r.length-1));let p=i.value(),_=r+"/"+p,m=await g.instance.putFile(_,d,"");l.htmlElement.disabled=!1,m?(this.dispose(),s()):alert(h.UPLOAD_FAILED)},this.add(l)}update(){}}function we(c){let t="",e=c.split(`
`),s="",n=[0],i=0,o=[];for(let l of e){let d=l,r=l.length-l.trim().length;if(l.trim()=="")s!="<BR>"&&!s.startsWith("<h")&&(l="<BR>");else for(;r<n[i];)i-=1,n.pop(),t+=o.pop();if(s.startsWith(">")&&!l.startsWith(">")&&(i-=1,n.pop(),t+=o.pop()),l.startsWith("##"))l="<h2>"+l.slice(2).trim()+"</h2>";else if(l.startsWith("#"))l="<h1>"+l.slice(2).trim()+"</h1>";else if(l.startsWith(">")){let p="";s.startsWith(">")||(i+=1,n.push(r),p="<div class='markdownNoteElement'>",o.push("</div>")),l=p+l.slice(1).trim()}else if(l.trim().startsWith("* ")||l.trim().startsWith("- ")){let p="";r>n[i]&&(i+=1,n.push(r),p="<ul>",o.push("</ul>")),l=p+"<li>"+l.trim().slice(2).trim()+"</li>"}s=d,n[i]=r,t+=" "+_e(l)}return t}function _e(c){let t="",e=!1,s=!1,n=!1,i=0,o=0,l=0,d=!1,r=0,p="",_="";for(let m of c){if(l==0&&m=="!")d=!0,r=t.length;else if(m=="[")l=1,p="",_="",d||(r=t.length);else if(l==0&&d)d=!1;else if(l==1&&m=="]")l=2;else if(l==1)p+=m;else if(l==2&&m=="(")l=3;else if(l==2)l=0;else if(l==3&&m==")"){t=t.slice(0,r),d?t+="<image src='"+_+"' alt='"+p+"' />":t+="<a href='"+_+"'>"+p+"</a>",l=0,d=!1;continue}else l==3&&(_+=m);if(m=="*"||m=="_")e?(m=="*"&&i>0&&(i-=1),m=="_"&&o>0&&(o-=1),i==0&&s?(t+="</b>",s=!1,e=!1):i==0&&o==0&&n&&(t+="</i>",n=!1,e=!1)):(m=="*"&&(i+=1),m=="_"&&(o+=1));else if(!e&&m==" "&&i>0){for(let f=0;f<i;f++)t+="*";i=0,t+=m}else if(!e&&m==" "&&o>0){for(let f=0;f<i;f++)t+="_";o=0,t+=m}else!e&&m!="*"&&(o>0||i>0)&&(e=!0,i>=2?(t+="<b>",s=!0):(t+="<i>",n=!0)),t+=m}return t}class ge extends w{constructor(){super("div","","editPage")}async update(t,e){var o;if(g.instance==null){I.open("login",{});return}this.htmlElement.innerHTML="";let s=t.folder+"/"+t.filename,n=t.filename.split("."),i=n[n.length-1].toLowerCase();if(i=="png"||i=="jpg"||i=="jpeg"||i=="tiff"||i=="tif"){let l=new w("div","","editImageBackground"),d=new w("img","","editImageView"),r=i=="tiff"||i=="tif"?-1:0;d.htmlElement.src=g.instance.readURL(s,r),d.htmlElement.onload=()=>{let p=d.htmlElement.width,_=d.htmlElement.height,m=window.innerWidth,f=window.innerHeight,S=p/m,L=_/f,C=S>L?S:L;d.htmlElement.width=p/C,d.htmlElement.height=_/C},l.add(d),this.add(l)}else if(i=="txt"||i=="md"||i=="py"||i=="csv"||i=="json"){let l=await g.instance.readTxt(s);if(l==null){alert(h.EDIT_READ_FILE_ERROR);return}let d=new w("div","","editTextOutput"),r="";i=="md"?r=we(l):r=l.replaceAll(`
`,"<BR>"),d.htmlElement.innerHTML=r,this.add(d)}else{let l=new w("iframe","","editIFrame");l.htmlElement.name="editIFrame",this.add(l),(o=g.instance)==null||o.read(s,"editIFrame")}}hide(){super.hide()}}async function Ee(){J(),document.getElementsByTagName("title")[0].innerHTML=h.APPNAME,localStorage.kb_autologin=="true"&&await te(),new I("search",{search:new he,login:new ee,edit:new ge})}Ee();