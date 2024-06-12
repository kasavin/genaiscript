import{d as g,a7 as x,ay as C,F as $,o as B,c as V,az as w,v as i,aA as h,aB as z,l as I,ad as G,aC as M}from"../modules/vue-5zUxC7u2.js";import{ai as T,_ as F,aj as D,ak as E,C as L}from"../index-Ct1KZwhB.js";import{u as j}from"./context-26M2oKEA.js";const O=g({__name:"VClickGap",props:{size:{type:[String,Number],default:1}},setup(l,{expose:s}){s();const o=l,{$clicksContext:c}=j(),d=T();let a=+o.size;Number.isNaN(a)&&(console.warn(`[slidev] Invalid size for VClickGap: ${o.size}`),a=1),x(()=>{const p=c.currentOffset+a-1;c.register(d,{max:p,delta:a})}),C(()=>{c.unregister(d)});const t={props:o,clicks:c,id:d,get delta(){return a},set delta(p){a=p},Fragment:$};return Object.defineProperty(t,"__isScriptSetup",{enumerable:!1,value:!0}),t}});function K(l,s,o,c,d,a){return B(),V(c.Fragment)}const P=F(O,[["render",K],["__file","/home/runner/work/genaiscript/genaiscript/node_modules/@slidev/client/builtin/VClickGap.vue"]]),b=["ul","ol"],R=g({props:{depth:{type:[Number,String],default:1},every:{type:[Number,String],default:1},at:{type:[Number,String],default:"+1"},hide:{type:Boolean,default:!1},fade:{type:Boolean,default:!1},handleSpecialElements:{type:Boolean,default:!0}},render(){var N,S;const l=+this.every,s=D(this.at),o=typeof s=="string";if(!s){console.warn("[slidev] Invalid at prop for v-clicks component:",s);return}const c=w("click"),d=(n,e)=>G(n,[[c,e,"",{hide:this.hide,fade:this.fade}]]),a=n=>n.flatMap(e=>h(e)&&typeof e.type=="symbol"&&Array.isArray(e.children)?a(e.children):[e]);let t=(S=(N=this.$slots).default)==null?void 0:S.call(N);if(!t)return;t=a(E(t));const p=(n,e=1)=>a(n).map(r=>{if(!h(r))return r;if(b.includes(r.type)&&Array.isArray(r.children)){const u=f(r.children,e+1);return i(r,{},u)}return i(r)});let A=1,y=0;const f=(n,e=1)=>a(n).map(r=>{if(!h(r)||r.type===z)return r;const u=+s+Math.ceil(A++/l)-1;let _;e<+this.depth&&Array.isArray(r.children)?_=i(r,{},p(r.children,e)):_=i(r);const v=u-y;return y=u,d(_,o?v>=0?`+${v}`:`${v}`:u)}),m=()=>I(P,{size:+s+Math.ceil((A-1)/l)-1-y});if(this.handleSpecialElements){if(t.length===1&&b.includes(t[0].type)&&Array.isArray(t[0].children))return i(t[0],{},[...f(t[0].children),m()]);if(t.length===1&&t[0].type==="table"){const n=t[0];if(Array.isArray(n.children))return i(n,{},n.children.map(e=>h(e)?e.type==="tbody"&&Array.isArray(e.children)?i(e,{},[...f(e.children),m()]):i(e):e))}}return[...f(t),m()]}}),H=g({props:{at:{type:[Number,String],default:"+1"},hide:{type:Boolean,default:!1},fade:{type:Boolean,default:!1},wrapText:{type:Function,default:l=>i("span",l)}},render(){return i(R,{every:L,at:this.at,hide:this.hide,fade:this.fade,handleSpecialElements:!1},{default:()=>{var l,s;return(s=(l=this.$slots).default)==null?void 0:s.call(l).map(o=>o.type===M?this.wrapText(o):o)}})}});export{H as _};
