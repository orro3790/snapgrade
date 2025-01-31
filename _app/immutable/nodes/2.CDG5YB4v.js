import{a as k,d as S,b as z,t as D}from"../chunks/k1Fs_wS6.js";import"../chunks/DQUU7Vgp.js";import{y as b,g as U,r as H,s as F,a as R,b as M,c as W,E as Y,m as T,w as I,n as L,h as N,p as V,j as A,l as B,I as $,ah as q,D as G,ai as J,x as K,C as Q,z as X,ac as u,ae as p,ad as f}from"../chunks/D50j80jE.js";import{d as Z}from"../chunks/DsqZghxl.js";import{p as j,a as ee}from"../chunks/DdQu2sUC.js";function te(e){b&&U(e)!==null&&H(e)}let O=!1;function ae(){O||(O=!0,document.addEventListener("reset",e=>{Promise.resolve().then(()=>{var t;if(!e.defaultPrevented)for(const a of e.target.elements)(t=a.__on_r)==null||t.call(a)})},{capture:!0}))}function ne(e){var t=M,a=W;F(null),R(null);try{return e()}finally{F(t),R(a)}}function re(e,t,a,l=a){e.addEventListener(t,()=>ne(a));const n=e.__on_r;n?e.__on_r=()=>{n(),l(!0)}:e.__on_r=()=>l(!0),ae()}function oe(e,t,a,l,n){var o=e,c="",i;Y(()=>{if(c===(c=t()??"")){b&&T();return}i!==void 0&&($(i),i=void 0),c!==""&&(i=I(()=>{if(b){L.data;for(var s=T(),v=s;s!==null&&(s.nodeType!==8||s.data!=="");)v=s,s=N(s);if(s===null)throw V(),A;k(L,v),o=B(s);return}var h=c+"",m=S(h);k(U(m),m.lastChild),o.before(m)}))})}function se(e,t,a=t){var l=q();re(e,"input",n=>{var o=n?e.defaultValue:e.value;if(o=x(e)?w(o):o,a(o),l&&o!==(o=t())){var c=e.selectionStart,i=e.selectionEnd;e.value=o??"",i!==null&&(e.selectionStart=c,e.selectionEnd=Math.min(i,e.value.length))}}),(b&&e.defaultValue!==e.value||G(t)==null&&e.value)&&a(x(e)?w(e.value):e.value),J(()=>{var n=t();x(e)&&n===w(e.value)||e.type==="date"&&!n&&!e.value||n!==e.value&&(e.value=n??"")})}function x(e){var t=e.type;return t==="number"||t==="range"}function w(e){return e===""?null:+e}function ie(e,t,a){const l=e.target;t.content=l.value,a()(l.value)}var le=D('<div class="mx-auto max-w-4xl space-y-6 p-6"><div class="rounded-lg bg-white p-6 shadow-md"><div class="mb-4 flex items-center justify-between"><h2 class="flex items-center gap-2 text-xl font-semibold">Enhanced Essay Editor</h2> <div class="space-x-2"><button class="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Export as Word</button></div></div> <div class="mb-6"><h3 class="mb-2 text-lg font-medium">Correction Marks:</h3> <ul class="list-disc space-y-2 pl-6"><li>For major changes: Use <code>~~deleted text~~</code> and <code>[new text]</code></li> <li>For spelling corrections: Write the word, then the correction in exclamation marks: <code>word !correction!</code></li></ul></div> <div class="prose mb-4 max-w-none rounded bg-gray-50 p-4"><h4 class="mb-2 text-sm font-medium">Preview:</h4> <div class="preview-content"><!></div></div> <textarea class="h-64 w-full rounded-md border p-4 font-mono text-sm" placeholder="Enter your essay here..."></textarea></div></div>');function ce(e,t){K(t,!0);const a=j(t,"initialContent",3,""),l=j(t,"onContentChange",3,()=>{}),n=ee({content:a()||`Here are examples of the different correction types:

This is a ~~incorrect sentence~~ [better sentence].

This sentense !sentence! has a spelling error.

You can have multiple speling !spelling! erors !errors! in one line.

The ~~old text~~ [new text] can be mixed with speling !spelling! corrections.`});Q(()=>{a()&&(n.content=a())});function o(){let r=n.content;return r=r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),r=r.replace(/(\S+)\s+!([^!]+)!/g,(C,_,d)=>`<span class="correction-container">
              <span class="correction-text">${d}</span>
              <span class="underlined">${_}</span>
          </span>`),r=r.replace(/~~([^~]+)~~/g,'<span class="deleted">$1</span>'),r=r.replace(/\[([^\]]+)\]/g,'<span class="added">$1</span>'),r=r.replace(/\n/g,`

`),r}function c(){const r=`
          <!DOCTYPE html>
          <html>
              <head>
                  <meta charset="utf-8">
                  <title>Essay Corrections</title>
                  <style>
                      body {
                          line-height: 2.5;
                          font-size: 12pt;
                          font-family: "Times New Roman", serif;
                      }
                      .added { 
                          color: #008000; 
                      }
                      .deleted { 
                          color: #FF0000; 
                          text-decoration: line-through;
                      }
                      .correction-container {
                          position: relative;
                          display: inline-block;
                          margin: 0 2px;
                      }
                      .correction-text {
                          position: absolute;
                          top: -1.2em;
                          left: 0;
                          color: #0000FF;
                          font-size: 0.85em;
                          white-space: nowrap;
                      }
                      .underlined {
                          border-bottom: 1px wavy #FF0000;
                          text-decoration: underline;
                          text-decoration-style: wavy;
                          text-decoration-color: #FF0000;
                          display: inline-block;
                      }
                  </style>
              </head>
              <body>
                  ${o()}
              </body>
          </html>
      `,C=new Blob([r],{type:"application/msword"}),_=URL.createObjectURL(C),d=document.createElement("a");d.href=_,d.download="essay-with-corrections.doc",document.body.appendChild(d),d.click(),document.body.removeChild(d),URL.revokeObjectURL(_)}var i=le(),s=u(i),v=u(s),h=p(u(v),2),m=u(h);m.__click=c,f(h),f(v);var g=p(v,4),E=p(u(g),2),P=u(E);oe(P,o),f(E),f(g);var y=p(g,2);te(y),y.__input=[ie,n,l],f(s),f(i),se(y,()=>n.content,r=>n.content=r),z(e,i),X()}Z(["click","input"]);function he(e){ce(e,{})}export{he as component};
