import{_ as v}from"./VClick-BIXZwz5N.js";import{d as y,y as S,o as f,b as $,e as t,f as k,i as x,h as P,c as b,k as c,l as w,q as C,s as I,a6 as z}from"../modules/vue-DnAWxuyG.js";import{_ as m,a9 as u}from"../index-3uLYG4F1.js";import{p as _,u as d,f as A}from"./context-Dcg5Nl8Z.js";import"../modules/shiki-tV5qZE2O.js";function p(e){return e.startsWith("/")?"/genaiscript/slides/msr-eng-may2024/"+e.slice(1):e}function B(e,n=!1,o="cover"){const r=e&&(e[0]==="#"||e.startsWith("rgb")),s={background:r?e:void 0,color:e&&!r?"white":void 0,backgroundImage:r?void 0:e?n?`linear-gradient(#0005, #0008), url(${p(e)})`:`url("${p(e)}")`:void 0,backgroundRepeat:"no-repeat",backgroundPosition:"center",backgroundSize:o};return s.background||delete s.background,s}const T=y({__name:"image-right",props:{image:{type:String},class:{type:String},backgroundSize:{type:String,default:"cover"}},setup(e,{expose:n}){n();const o=e,r=S(()=>B(o.image,!1,o.backgroundSize)),s={props:o,style:r};return Object.defineProperty(s,"__isScriptSetup",{enumerable:!1,value:!0}),s}}),j={class:"grid grid-cols-2 w-full h-full auto-rows-fr"};function L(e,n,o,r,s,a){return f(),$("div",j,[t("div",{class:x(["slidev-layout default",r.props.class])},[k(e.$slots,"default")],2),t("div",{class:"w-full h-full",style:P(r.style)},null,4)])}const E=m(T,[["render",L],["__file","/home/runner/work/genaiscript/genaiscript/node_modules/@slidev/client/layouts/image-right.vue"]]),N={__name:"2",setup(e,{expose:n}){n(),_(u);const{$slidev:o,$nav:r,$clicksContext:s,$clicks:a,$page:l,$renderContext:h,$frontmatter:g}=d(),i={$slidev:o,$nav:r,$clicksContext:s,$clicks:a,$page:l,$renderContext:h,$frontmatter:g,InjectedLayout:E,get frontmatter(){return u},get useSlideContext(){return d},get _provideFrontmatter(){return _},get _frontmatterToProps(){return A}};return Object.defineProperty(i,"__isScriptSetup",{enumerable:!1,value:!0}),i}},V=t("h1",null,"Empower Users with AI-Enhanced Scripts",-1),W=t("h2",null,null,-1),F=t("h3",null,"Scripting languages have had enormous impact",-1),J=t("ul",null,[t("li",null,"csh, bash, Perl, JavaScript, Python, etc.")],-1),O=t("p",null," ",-1),R=t("h3",null,[z("Current languages "),t("strong",null,"not AI aware")],-1),U=t("ul",null,[t("li",null,"They use AI via libraries, packages, etc.")],-1),q=t("p",null," ",-1),G=t("h3",null,"In GenAIScript, LLM is first-class component",-1),M=t("ul",null,[t("li",null,"With the leverage of JavaScript")],-1);function D(e,n,o,r,s,a){const l=v;return f(),b(r.InjectedLayout,C(I(r._frontmatterToProps(r.frontmatter,1))),{default:c(()=>[V,W,F,J,O,R,U,w(l,null,{default:c(()=>[q,G,M]),_:1})]),_:1},16)}const Z=m(N,[["render",D],["__file","/@slidev/slides/2.md"]]);export{Z as default};
