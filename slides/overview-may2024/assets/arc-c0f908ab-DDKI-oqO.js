import{w as ln,c as V}from"./path-39bad7e2-CbwjOpE9.js";import{aP as an,aQ as Z,aR as O,aS as rn,aT as y,aO as on,aU as z,aV as _,aW as un,aX as t,aY as sn,aZ as tn,a_ as fn}from"./slidev/Mermaid-CW-Mizm6.js";function cn(l){return l.innerRadius}function yn(l){return l.outerRadius}function gn(l){return l.startAngle}function mn(l){return l.endAngle}function pn(l){return l&&l.padAngle}function dn(l,h,D,S,v,R,W,a){var E=D-l,i=S-h,n=W-v,m=a-R,r=m*E-n*i;if(!(r*r<y))return r=(n*(h-R)-m*(l-v))/r,[l+r*E,h+r*i]}function J(l,h,D,S,v,R,W){var a=l-D,E=h-S,i=(W?R:-R)/z(a*a+E*E),n=i*E,m=-i*a,r=l+n,s=h+m,f=D+n,c=S+m,X=(r+f)/2,o=(s+c)/2,p=f-r,g=c-s,A=p*p+g*g,T=v-R,P=r*c-f*s,I=(g<0?-1:1)*z(fn(0,T*T*A-P*P)),Q=(P*g-p*I)/A,U=(-P*p-g*I)/A,w=(P*g+p*I)/A,d=(-P*p+g*I)/A,x=Q-X,e=U-o,u=w-X,Y=d-o;return x*x+e*e>u*u+Y*Y&&(Q=w,U=d),{cx:Q,cy:U,x01:-n,y01:-m,x11:Q*(v/T-1),y11:U*(v/T-1)}}function vn(){var l=cn,h=yn,D=V(0),S=null,v=gn,R=mn,W=pn,a=null,E=ln(i);function i(){var n,m,r=+l.apply(this,arguments),s=+h.apply(this,arguments),f=v.apply(this,arguments)-rn,c=R.apply(this,arguments)-rn,X=un(c-f),o=c>f;if(a||(a=n=E()),s<r&&(m=s,s=r,r=m),!(s>y))a.moveTo(0,0);else if(X>on-y)a.moveTo(s*Z(f),s*O(f)),a.arc(0,0,s,f,c,!o),r>y&&(a.moveTo(r*Z(c),r*O(c)),a.arc(0,0,r,c,f,o));else{var p=f,g=c,A=f,T=c,P=X,I=X,Q=W.apply(this,arguments)/2,U=Q>y&&(S?+S.apply(this,arguments):z(r*r+s*s)),w=_(un(s-r)/2,+D.apply(this,arguments)),d=w,x=w,e,u;if(U>y){var Y=sn(U/r*O(Q)),B=sn(U/s*O(Q));(P-=Y*2)>y?(Y*=o?1:-1,A+=Y,T-=Y):(P=0,A=T=(f+c)/2),(I-=B*2)>y?(B*=o?1:-1,p+=B,g-=B):(I=0,p=g=(f+c)/2)}var $=s*Z(p),j=s*O(p),C=r*Z(T),F=r*O(T);if(w>y){var G=s*Z(g),H=s*O(g),K=r*Z(A),L=r*O(A),q;if(X<an)if(q=dn($,j,K,L,G,H,C,F)){var M=$-q[0],N=j-q[1],k=G-q[0],b=H-q[1],nn=1/O(tn((M*k+N*b)/(z(M*M+N*N)*z(k*k+b*b)))/2),en=z(q[0]*q[0]+q[1]*q[1]);d=_(w,(r-en)/(nn-1)),x=_(w,(s-en)/(nn+1))}else d=x=0}I>y?x>y?(e=J(K,L,$,j,s,x,o),u=J(G,H,C,F,s,x,o),a.moveTo(e.cx+e.x01,e.cy+e.y01),x<w?a.arc(e.cx,e.cy,x,t(e.y01,e.x01),t(u.y01,u.x01),!o):(a.arc(e.cx,e.cy,x,t(e.y01,e.x01),t(e.y11,e.x11),!o),a.arc(0,0,s,t(e.cy+e.y11,e.cx+e.x11),t(u.cy+u.y11,u.cx+u.x11),!o),a.arc(u.cx,u.cy,x,t(u.y11,u.x11),t(u.y01,u.x01),!o))):(a.moveTo($,j),a.arc(0,0,s,p,g,!o)):a.moveTo($,j),!(r>y)||!(P>y)?a.lineTo(C,F):d>y?(e=J(C,F,G,H,r,-d,o),u=J($,j,K,L,r,-d,o),a.lineTo(e.cx+e.x01,e.cy+e.y01),d<w?a.arc(e.cx,e.cy,d,t(e.y01,e.x01),t(u.y01,u.x01),!o):(a.arc(e.cx,e.cy,d,t(e.y01,e.x01),t(e.y11,e.x11),!o),a.arc(0,0,r,t(e.cy+e.y11,e.cx+e.x11),t(u.cy+u.y11,u.cx+u.x11),o),a.arc(u.cx,u.cy,d,t(u.y11,u.x11),t(u.y01,u.x01),!o))):a.arc(0,0,r,T,A,o)}if(a.closePath(),n)return a=null,n+""||null}return i.centroid=function(){var n=(+l.apply(this,arguments)+ +h.apply(this,arguments))/2,m=(+v.apply(this,arguments)+ +R.apply(this,arguments))/2-an/2;return[Z(m)*n,O(m)*n]},i.innerRadius=function(n){return arguments.length?(l=typeof n=="function"?n:V(+n),i):l},i.outerRadius=function(n){return arguments.length?(h=typeof n=="function"?n:V(+n),i):h},i.cornerRadius=function(n){return arguments.length?(D=typeof n=="function"?n:V(+n),i):D},i.padRadius=function(n){return arguments.length?(S=n==null?null:typeof n=="function"?n:V(+n),i):S},i.startAngle=function(n){return arguments.length?(v=typeof n=="function"?n:V(+n),i):v},i.endAngle=function(n){return arguments.length?(R=typeof n=="function"?n:V(+n),i):R},i.padAngle=function(n){return arguments.length?(W=typeof n=="function"?n:V(+n),i):W},i.context=function(n){return arguments.length?(a=n??null,i):a},i}export{vn as d};
