import{d as u,t as c,a7 as p,D as d,E as m,o as _,b as f,i as g}from"../modules/vue-DnAWxuyG.js";import{u as v}from"./context-Dcg5Nl8Z.js";import{b as w}from"./DrawingPreview-DuRB2LqL.js";import{_ as b}from"../index-3uLYG4F1.js";import"../modules/shiki-tV5qZE2O.js";const E=u({__name:"DrawingLayer",setup(i,{expose:t}){t();const{drauu:e,drawingEnabled:n,loadCanvas:a}=w(),o=v().$scale,r=c();p(()=>{e.mount(r.value,r.value.parentElement),d(o,l=>e.options.coordinateScale=1/l,{immediate:!0}),a()}),m(()=>{e.unmount()});const s={drauu:e,drawingEnabled:n,loadCanvas:a,scale:o,svg:r};return Object.defineProperty(s,"__isScriptSetup",{enumerable:!1,value:!0}),s}});function h(i,t,e,n,a,o){return _(),f("svg",{ref:"svg",class:g(["w-full h-full absolute top-0",{"pointer-events-none":!n.drawingEnabled,"touch-none":n.drawingEnabled}])},null,2)}const k=b(E,[["render",h],["__file","/home/runner/work/genaiscript/genaiscript/node_modules/@slidev/client/internals/DrawingLayer.vue"]]);export{k as default};
