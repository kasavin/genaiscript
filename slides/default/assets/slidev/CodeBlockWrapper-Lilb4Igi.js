import{B as A,C as B}from"../modules/unplugin-icons-DJQcemFL.js";import{d as I,t as E,ay as N,C as b,a7 as q,y as k,aD as M,o as p,b as S,f as V,c as x,g as D,i as z,h as K}from"../modules/vue-5zUxC7u2.js";import{v as w,ai as R,C as W,ar as j,as as O,_ as P}from"../index-Ct1KZwhB.js";import{u as U}from"./context-26M2oKEA.js";const X=I({__name:"CodeBlockWrapper",props:{ranges:{type:Array,default:()=>[]},finally:{type:[String,Number],default:"last"},startLine:{type:Number,default:1},lines:{type:Boolean,default:w.lineNumbers},at:{type:[String,Number],default:"+1"},maxHeight:{type:String,default:void 0}},setup(d,{expose:i}){i();const t=d,{$clicksContext:e}=U(),n=E(),a=R();N(()=>{e.unregister(a)}),b(()=>{var o;(o=n.value)==null||o.classList.toggle("slidev-code-line-numbers",t.lines)}),q(()=>{var m;if(!e||!((m=t.ranges)!=null&&m.length))return;const o=e.calculateSince(t.at,t.ranges.length-1);e.register(a,o);const r=k(()=>o?Math.max(0,e.current-o.start+1):W),l=k(()=>t.finally==="last"?t.ranges.at(-1):t.finally.toString());b(()=>{if(!n.value)return;let g=t.ranges[r.value]??l.value;const _=g==="hide";n.value.classList.toggle(j,_),_&&(g=t.ranges[r.value+1]??l.value);const y=n.value.querySelector(".shiki"),v=Array.from(y.querySelectorAll("code > .line")),H=v.length;if(O(g,H,t.startLine,s=>[v[s]]),t.maxHeight){const s=Array.from(y.querySelectorAll(".line.highlighted"));s.reduce((C,L)=>L.offsetHeight+C,0)>n.value.offsetHeight?s[0].scrollIntoView({behavior:"smooth",block:"start"}):s.length>0&&s[Math.round((s.length-1)/2)].scrollIntoView({behavior:"smooth",block:"center"})}})});const{copied:u,copy:c}=M();function f(){var r,l;const o=(l=(r=n.value)==null?void 0:r.querySelector(".slidev-code"))==null?void 0:l.textContent;o&&c(o)}const h={props:t,clicks:e,el:n,id:a,copied:u,copy:c,copyCode:f,get configs(){return w}};return Object.defineProperty(h,"__isScriptSetup",{enumerable:!1,value:!0}),h}}),F=["title"];function G(d,i,t,e,n,a){const u=A,c=B;return p(),S("div",{ref:"el",class:z(["slidev-code-wrapper relative group",{"slidev-code-line-numbers":e.props.lines}]),style:K({"max-height":e.props.maxHeight,"overflow-y":e.props.maxHeight?"scroll":void 0,"--start":e.props.startLine})},[V(d.$slots,"default"),e.configs.codeCopy?(p(),S("button",{key:0,class:"slidev-code-copy absolute top-0 right-0 transition opacity-0 group-hover:opacity-20 hover:!opacity-100",title:e.copied?"Copied":"Copy",onClick:i[0]||(i[0]=f=>e.copyCode())},[e.copied?(p(),x(u,{key:0,class:"p-2 w-8 h-8"})):(p(),x(c,{key:1,class:"p-2 w-8 h-8"}))],8,F)):D("v-if",!0)],6)}const $=P(X,[["render",G],["__file","/home/runner/work/genaiscript/genaiscript/node_modules/@slidev/client/builtin/CodeBlockWrapper.vue"]]);export{$ as _};
