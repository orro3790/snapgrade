var Kn=Array.isArray,un=Array.prototype.indexOf,zn=Array.from,Zn=Object.defineProperty,gt=Object.getOwnPropertyDescriptor,on=Object.getOwnPropertyDescriptors,Jn=Object.prototype,Wn=Array.prototype,fn=Object.getPrototypeOf;function Xn(t){return typeof t=="function"}const P=()=>{};function Qn(t){return t()}function ht(t){for(var n=0;n<t.length;n++)t[n]()}const y=2,Rt=4,$=8,dt=16,I=32,K=64,X=128,A=256,Q=512,h=1024,R=2048,Y=4096,M=8192,H=16384,_n=32768,St=65536,tr=1<<17,cn=1<<19,xt=1<<20,mt=Symbol("$state"),nr=Symbol("legacy props"),rr=Symbol("");function Dt(t){return t===this.v}function Ot(t,n){return t!=t?n==n:t!==n||t!==null&&typeof t=="object"||typeof t=="function"}function er(t,n){return t!==n}function Nt(t){return!Ot(t,this.v)}function vn(t){throw new Error("https://svelte.dev/e/effect_in_teardown")}function pn(){throw new Error("https://svelte.dev/e/effect_in_unowned_derived")}function hn(t){throw new Error("https://svelte.dev/e/effect_orphan")}function dn(){throw new Error("https://svelte.dev/e/effect_update_depth_exceeded")}function sr(){throw new Error("https://svelte.dev/e/hydration_failed")}function lr(t){throw new Error("https://svelte.dev/e/props_invalid_value")}function ar(){throw new Error("https://svelte.dev/e/state_descriptors_fixed")}function ur(){throw new Error("https://svelte.dev/e/state_prototype_fixed")}function En(){throw new Error("https://svelte.dev/e/state_unsafe_local_read")}function yn(){throw new Error("https://svelte.dev/e/state_unsafe_mutation")}let lt=!1;function or(){lt=!0}const fr=1,ir=2,_r=4,cr=8,vr=16,pr=1,hr=2,dr=4,Er=8,yr=16,wr=4,Tr=1,gr=2,wn="[",Tn="[!",gn="]",Ct={},mr=Symbol();function qt(t){console.warn("https://svelte.dev/e/hydration_mismatch")}let v=null;function At(t){v=t}function Ar(t,n=!1,r){v={p:v,c:null,e:null,m:!1,s:t,x:null,l:null},lt&&!n&&(v.l={s:null,u:null,r1:[],r2:Et(!1)})}function br(t){const n=v;if(n!==null){const a=n.e;if(a!==null){var r=_,e=f;n.e=null;try{for(var s=0;s<a.length;s++){var l=a[s];et(l.effect),rt(l.reaction),jt(l.fn)}}finally{et(r),rt(e)}}v=n.p,n.m=!0}return{}}function at(){return!lt||v!==null&&v.l===null}function Et(t,n){var r={f:0,v:t,reactions:null,equals:Dt,rv:0,wv:0};return r}function kr(t){return mn(Et(t))}function Ir(t,n=!1){var e;const r=Et(t);return n||(r.equals=Nt),lt&&v!==null&&v.l!==null&&((e=v.l).s??(e.s=[])).push(r),r}function mn(t){return f!==null&&!k&&f.f&y&&(m===null?Pn([t]):m.push(t)),t}function Rr(t,n){return f!==null&&!k&&at()&&f.f&(y|dt)&&(m===null||!m.includes(t))&&yn(),An(t,n)}function An(t,n){return t.equals(n)||(t.v,t.v=n,t.wv=Xt(),Pt(t,R),at()&&_!==null&&_.f&h&&!(_.f&(I|K))&&(b===null?Fn([t]):b.push(t))),n}function Pt(t,n){var r=t.reactions;if(r!==null)for(var e=at(),s=r.length,l=0;l<s;l++){var a=r[l],o=a.f;o&R||!e&&a===_||(T(a,n),o&(h|A)&&(o&y?Pt(a,Y):ot(a)))}}let D=!1;function Sr(t){D=t}let w;function j(t){if(t===null)throw qt(),Ct;return w=t}function xr(){return j(N(w))}function Dr(t){if(D){if(N(w)!==null)throw qt(),Ct;w=t}}function Or(t=1){if(D){for(var n=t,r=w;n--;)r=N(r);w=r}}function Nr(){for(var t=0,n=w;;){if(n.nodeType===8){var r=n.data;if(r===gn){if(t===0)return n;t-=1}else(r===wn||r===Tn)&&(t+=1)}var e=N(n);n.remove(),n=e}}var bt,Ft,Lt;function Cr(){if(bt===void 0){bt=window;var t=Element.prototype,n=Node.prototype;Ft=gt(n,"firstChild").get,Lt=gt(n,"nextSibling").get,t.__click=void 0,t.__className="",t.__attributes=null,t.__styles=null,t.__e=void 0,Text.prototype.__t=void 0}}function it(t=""){return document.createTextNode(t)}function _t(t){return Ft.call(t)}function N(t){return Lt.call(t)}function qr(t,n){if(!D)return _t(t);var r=_t(w);if(r===null)r=w.appendChild(it());else if(n&&r.nodeType!==3){var e=it();return r==null||r.before(e),j(e),e}return j(r),r}function Pr(t,n){if(!D){var r=_t(t);return r instanceof Comment&&r.data===""?N(r):r}return w}function Fr(t,n=1,r=!1){let e=D?w:t;for(var s;n--;)s=e,e=N(e);if(!D)return e;var l=e==null?void 0:e.nodeType;if(r&&l!==3){var a=it();return e===null?s==null||s.after(a):e.before(a),j(a),a}return j(e),e}function Lr(t){t.textContent=""}function Mt(t){var n=y|R,r=f!==null&&f.f&y?f:null;return _===null||r!==null&&r.f&A?n|=A:_.f|=xt,{ctx:v,deps:null,effects:null,equals:Dt,f:n,fn:t,reactions:null,rv:0,v:null,wv:0,parent:r??_}}function Mr(t){const n=Mt(t);return n.equals=Nt,n}function yt(t){var n=t.effects;if(n!==null){t.effects=null;for(var r=0;r<n.length;r+=1)O(n[r])}}function bn(t){for(var n=t.parent;n!==null;){if(!(n.f&y))return n;n=n.parent}return null}function Yt(t){var n,r=_;et(bn(t));try{yt(t),n=tn(t)}finally{et(r)}return n}function Ht(t){var n=Yt(t),r=(x||t.f&A)&&t.deps!==null?Y:h;T(t,r),t.equals(n)||(t.v=n,t.wv=Xt())}function kn(t){yt(t),G(t,0),T(t,H),t.v=t.deps=t.ctx=t.reactions=null}function Bt(t){_===null&&f===null&&hn(),f!==null&&f.f&A&&_===null&&pn(),wt&&vn()}function In(t,n){var r=n.last;r===null?n.last=n.first=t:(r.next=t,t.prev=r,n.last=t)}function B(t,n,r,e=!0){var s=(t&K)!==0,l=_,a={ctx:v,deps:null,nodes_start:null,nodes_end:null,f:t|R,first:null,fn:n,last:null,next:null,parent:s?null:l,prev:null,teardown:null,transitions:null,wv:0};if(r){var o=F;try{kt(!0),Tt(a),a.f|=_n}catch(g){throw O(a),g}finally{kt(o)}}else n!==null&&ot(a);var c=r&&a.deps===null&&a.first===null&&a.nodes_start===null&&a.teardown===null&&(a.f&(xt|X))===0;if(!c&&!s&&e&&(l!==null&&In(a,l),f!==null&&f.f&y)){var u=f;(u.effects??(u.effects=[])).push(a)}return a}function Yr(t){const n=B($,null,!1);return T(n,h),n.teardown=t,n}function Hr(t){Bt();var n=_!==null&&(_.f&I)!==0&&v!==null&&!v.m;if(n){var r=v;(r.e??(r.e=[])).push({fn:t,effect:_,reaction:f})}else{var e=jt(t);return e}}function Br(t){return Bt(),Rn(t)}function jr(t){const n=B(K,t,!0);return(r={})=>new Promise(e=>{r.outro?Dn(n,()=>{O(n),e(void 0)}):(O(n),e(void 0))})}function jt(t){return B(Rt,t,!1)}function Rn(t){return B($,t,!0)}function Ur(t,n=[],r=Mt){const e=n.map(r);return Sn(()=>t(...e.map(jn)))}function Sn(t,n=0){return B($|dt|n,t,!0)}function Vr(t,n=!0){return B($|I,t,!0,n)}function Ut(t){var n=t.teardown;if(n!==null){const r=wt,e=f;It(!0),rt(null);try{n.call(null)}finally{It(r),rt(e)}}}function Vt(t,n=!1){var r=t.first;for(t.first=t.last=null;r!==null;){var e=r.next;O(r,n),r=e}}function xn(t){for(var n=t.first;n!==null;){var r=n.next;n.f&I||O(n),n=r}}function O(t,n=!0){var r=!1;if((n||t.f&cn)&&t.nodes_start!==null){for(var e=t.nodes_start,s=t.nodes_end;e!==null;){var l=e===s?null:N(e);e.remove(),e=l}r=!0}Vt(t,n&&!r),G(t,0),T(t,H);var a=t.transitions;if(a!==null)for(const c of a)c.stop();Ut(t);var o=t.parent;o!==null&&o.first!==null&&Gt(t),t.next=t.prev=t.teardown=t.ctx=t.deps=t.fn=t.nodes_start=t.nodes_end=null}function Gt(t){var n=t.parent,r=t.prev,e=t.next;r!==null&&(r.next=e),e!==null&&(e.prev=r),n!==null&&(n.first===t&&(n.first=e),n.last===t&&(n.last=r))}function Dn(t,n){var r=[];$t(t,r,!0),On(r,()=>{O(t),n&&n()})}function On(t,n){var r=t.length;if(r>0){var e=()=>--r||n();for(var s of t)s.out(e)}else n()}function $t(t,n,r){if(!(t.f&M)){if(t.f^=M,t.transitions!==null)for(const a of t.transitions)(a.is_global||r)&&n.push(a);for(var e=t.first;e!==null;){var s=e.next,l=(e.f&St)!==0||(e.f&I)!==0;$t(e,n,l?r:!1),e=s}}}function Gr(t){Kt(t,!0)}function Kt(t,n){if(t.f&M){t.f^=M,t.f&h||(t.f^=h),z(t)&&(T(t,R),ot(t));for(var r=t.first;r!==null;){var e=r.next,s=(r.f&St)!==0||(r.f&I)!==0;Kt(r,s?n:!1),r=e}if(t.transitions!==null)for(const l of t.transitions)(l.is_global||n)&&l.in()}}const Nn=typeof requestIdleCallback>"u"?t=>setTimeout(t,1):requestIdleCallback;let tt=!1,nt=!1,ct=[],vt=[];function zt(){tt=!1;const t=ct.slice();ct=[],ht(t)}function Zt(){nt=!1;const t=vt.slice();vt=[],ht(t)}function $r(t){tt||(tt=!0,queueMicrotask(zt)),ct.push(t)}function Kr(t){nt||(nt=!0,Nn(Zt)),vt.push(t)}function Cn(){tt&&zt(),nt&&Zt()}const Jt=0,qn=1;let J=!1,W=Jt,U=!1,V=null,F=!1,wt=!1;function kt(t){F=t}function It(t){wt=t}let S=[],L=0;let f=null,k=!1;function rt(t){f=t}let _=null;function et(t){_=t}let m=null;function Pn(t){m=t}let d=null,E=0,b=null;function Fn(t){b=t}let Wt=1,st=0,x=!1;function Xt(){return++Wt}function z(t){var u;var n=t.f;if(n&R)return!0;if(n&Y){var r=t.deps,e=(n&A)!==0;if(r!==null){var s,l,a=(n&Q)!==0,o=e&&_!==null&&!x,c=r.length;if(a||o){for(s=0;s<c;s++)l=r[s],(a||!((u=l==null?void 0:l.reactions)!=null&&u.includes(t)))&&(l.reactions??(l.reactions=[])).push(t);a&&(t.f^=Q)}for(s=0;s<c;s++)if(l=r[s],z(l)&&Ht(l),l.wv>t.wv)return!0}(!e||_!==null&&!x)&&T(t,h)}return!1}function Ln(t,n){for(var r=n;r!==null;){if(r.f&X)try{r.fn(t);return}catch{r.f^=X}r=r.parent}throw J=!1,t}function Mn(t){return(t.f&H)===0&&(t.parent===null||(t.parent.f&X)===0)}function ut(t,n,r,e){if(J){if(r===null&&(J=!1),Mn(n))throw t;return}r!==null&&(J=!0);{Ln(t,n);return}}function Qt(t,n,r=0){var e=t.reactions;if(e!==null)for(var s=0;s<e.length;s++){var l=e[s];l.f&y?Qt(l,n,r+1):n===l&&(r===0?T(l,R):l.f&h&&T(l,Y),ot(l))}}function tn(t){var Z;var n=d,r=E,e=b,s=f,l=x,a=m,o=v,c=k,u=t.f;d=null,E=0,b=null,f=u&(I|K)?null:t,x=(u&A)!==0&&(!F||(s===null||c)&&t.parent!==null),m=null,At(t.ctx),k=!1,st++;try{var g=(0,t.fn)(),p=t.deps;if(d!==null){var i;if(G(t,E),p!==null&&E>0)for(p.length=E+d.length,i=0;i<d.length;i++)p[E+i]=d[i];else t.deps=p=d;if(!x)for(i=E;i<p.length;i++)((Z=p[i]).reactions??(Z.reactions=[])).push(t)}else p!==null&&E<p.length&&(G(t,E),p.length=E);if(at()&&b!==null&&!(t.f&(y|Y|R)))for(i=0;i<b.length;i++)Qt(b[i],t);return s!==null&&st++,g}finally{d=n,E=r,b=e,f=s,x=l,m=a,At(o),k=c}}function Yn(t,n){let r=n.reactions;if(r!==null){var e=un.call(r,t);if(e!==-1){var s=r.length-1;s===0?r=n.reactions=null:(r[e]=r[s],r.pop())}}r===null&&n.f&y&&(d===null||!d.includes(n))&&(T(n,Y),n.f&(A|Q)||(n.f^=Q),yt(n),G(n,0))}function G(t,n){var r=t.deps;if(r!==null)for(var e=n;e<r.length;e++)Yn(t,r[e])}function Tt(t){var n=t.f;if(!(n&H)){T(t,h);var r=_,e=v;_=t;try{n&dt?xn(t):Vt(t),Ut(t);var s=tn(t);t.teardown=typeof s=="function"?s:null,t.wv=Wt;var l=t.deps,a}catch(o){ut(o,t,r,e||t.ctx)}finally{_=r}}}function nn(){if(L>1e3){L=0;try{dn()}catch(t){if(V!==null)ut(t,V,null);else throw t}}L++}function rn(t){var n=t.length;if(n!==0){nn();var r=F;F=!0;try{for(var e=0;e<n;e++){var s=t[e];s.f&h||(s.f^=h);var l=[];en(s,l),Hn(l)}}finally{F=r}}}function Hn(t){var n=t.length;if(n!==0)for(var r=0;r<n;r++){var e=t[r];if(!(e.f&(H|M)))try{z(e)&&(Tt(e),e.deps===null&&e.first===null&&e.nodes_start===null&&(e.teardown===null?Gt(e):e.fn=null))}catch(s){ut(s,e,null,e.ctx)}}}function Bn(){if(U=!1,L>1001)return;const t=S;S=[],rn(t),U||(L=0,V=null)}function ot(t){W===Jt&&(U||(U=!0,queueMicrotask(Bn))),V=t;for(var n=t;n.parent!==null;){n=n.parent;var r=n.f;if(r&(K|I)){if(!(r&h))return;n.f^=h}}S.push(n)}function en(t,n){var r=t.first,e=[];t:for(;r!==null;){var s=r.f,l=(s&I)!==0,a=l&&(s&h)!==0,o=r.next;if(!a&&!(s&M))if(s&$){if(l)r.f^=h;else{var c=f;try{f=r,z(r)&&Tt(r)}catch(i){ut(i,r,null,r.ctx)}finally{f=c}}var u=r.first;if(u!==null){r=u;continue}}else s&Rt&&e.push(r);if(o===null){let i=r.parent;for(;i!==null;){if(t===i)break t;var g=i.next;if(g!==null){r=g;continue t}i=i.parent}}r=o}for(var p=0;p<e.length;p++)u=e[p],n.push(u),en(u,n)}function sn(t){var n=W,r=S;try{nn();const s=[];W=qn,S=s,U=!1,rn(r);var e=t==null?void 0:t();return Cn(),(S.length>0||s.length>0)&&sn(),L=0,V=null,e}finally{W=n,S=r}}async function zr(){await Promise.resolve(),sn()}function jn(t){var n=t.f,r=(n&y)!==0;if(r&&n&H){var e=Yt(t);return kn(t),e}if(f!==null&&!k){m!==null&&m.includes(t)&&En();var s=f.deps;t.rv<st&&(t.rv=st,d===null&&s!==null&&s[E]===t?E++:d===null?d=[t]:d.push(t))}else if(r&&t.deps===null&&t.effects===null){var l=t,a=l.parent;a!==null&&!(a.f&A)&&(l.f^=A)}return r&&(l=t,z(l)&&Ht(l)),t.v}function Un(t){var n=k;try{return k=!0,t()}finally{k=n}}const Vn=-7169;function T(t,n){t.f=t.f&Vn|n}function Zr(t){if(!(typeof t!="object"||!t||t instanceof EventTarget)){if(mt in t)pt(t);else if(!Array.isArray(t))for(let n in t){const r=t[n];typeof r=="object"&&r&&mt in r&&pt(r)}}}function pt(t,n=new Set){if(typeof t=="object"&&t!==null&&!(t instanceof EventTarget)&&!n.has(t)){n.add(t),t instanceof Date&&t.getTime();for(let e in t)try{pt(t[e],n)}catch{}const r=fn(t);if(r!==Object.prototype&&r!==Array.prototype&&r!==Map.prototype&&r!==Set.prototype&&r!==Date.prototype){const e=on(r);for(let s in e){const l=e[s].get;if(l)try{l.call(t)}catch{}}}}}function ln(t,n,r){if(t==null)return n(void 0),r&&r(void 0),P;const e=Un(()=>t.subscribe(n,r));return e.unsubscribe?()=>e.unsubscribe():e}const q=[];function Gn(t,n){return{subscribe:$n(t,n).subscribe}}function $n(t,n=P){let r=null;const e=new Set;function s(o){if(Ot(t,o)&&(t=o,r)){const c=!q.length;for(const u of e)u[1](),q.push(u,t);if(c){for(let u=0;u<q.length;u+=2)q[u][0](q[u+1]);q.length=0}}}function l(o){s(o(t))}function a(o,c=P){const u=[o,c];return e.add(u),e.size===1&&(r=n(s,l)||P),o(t),()=>{e.delete(u),e.size===0&&r&&(r(),r=null)}}return{set:s,update:l,subscribe:a}}function Jr(t,n,r){const e=!Array.isArray(t),s=e?[t]:t;if(!s.every(Boolean))throw new Error("derived() expects stores as input, got a falsy value");const l=n.length<2;return Gn(r,(a,o)=>{let c=!1;const u=[];let g=0,p=P;const i=()=>{if(g)return;p();const C=n(e?u[0]:u,a,o);l?a(C):p=typeof C=="function"?C:P},Z=s.map((C,ft)=>ln(C,an=>{u[ft]=an,g&=~(1<<ft),c&&i()},()=>{g|=1<<ft}));return c=!0,i(),function(){ht(Z),p(),c=!1}})}function Wr(t){let n;return ln(t,r=>n=r)(),n}export{dr as $,gt as A,_ as B,ur as C,fn as D,Kn as E,Sn as F,D as G,xr as H,St as I,Tn as J,Nr as K,j as L,Sr as M,Gr as N,Vr as O,Dn as P,w as Q,Ir as R,mt as S,P as T,mr as U,ln as V,Wr as W,Yr as X,Zn as Y,lr as Z,tr as _,Br as a,Nt as a0,I as a1,K as a2,et as a3,pr as a4,hr as a5,Er as a6,nr as a7,Mr as a8,yr as a9,O as aA,fr as aB,ir as aC,_r as aD,cr as aE,vr as aF,rr as aG,on as aH,Kr as aI,er as aJ,Ot as aK,dt as aL,_n as aM,Xn as aN,wr as aO,Or as aP,sn as aa,zr as ab,kr as ac,rt as ad,f as ae,_t as af,Tr as ag,gr as ah,it as ai,Cr as aj,wn as ak,N as al,Ct as am,gn as an,qt as ao,sr as ap,Lr as aq,zn as ar,jr as as,at,$n as au,Jr as av,M as aw,An as ax,$t as ay,On as az,Hr as b,ht as c,v as d,jt as e,Qn as f,jn as g,Zr as h,Mt as i,or as j,Pr as k,lt as l,br as m,qr as n,Dr as o,Ar as p,$r as q,Rn as r,Fr as s,Ur as t,Un as u,Jn as v,Wn as w,Et as x,ar as y,Rr as z};
