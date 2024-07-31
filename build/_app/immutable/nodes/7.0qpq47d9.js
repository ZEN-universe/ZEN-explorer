import{s as lt,r as N,e as k,a as O,c as y,m as X,g as B,b as Q,f as g,o as E,v as Ve,i as z,h as w,w as P,F as Se,x as Le,n as we}from"../chunks/scheduler.BXxlKFsS.js";import{S as nt,i as st,b as R,c as de,d as ue,m as me,t as v,a as H,e as _e,f as pe,g as fe}from"../chunks/index.ElVQI2Jj.js";import{S as ot,f as at,a as it,B as rt,g as De,r as $e}from"../chunks/utils.BGVeK_Qy.js";import{R as ct,A as ve}from"../chunks/Radio.CsVFdhy-.js";function Me(l){let t,s,c='<button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">Technology and Carrier Selection</button>',n,u,i,_,o="Technologies (for Capex/Opex)",a,d,e,m,b,S,Y,U,se='<button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">Data Selection</button>',te,K,Z,F,G,A,I,j="Aggregation",x,J,ae,re,le,he,ne,p=l[11].length>0&&ze(l),L=l[13].length>0&&je(l),C=l[15].length>0&&qe(l),$=l[18].length>0&&Ae(l),r=l[19].length>0&&Oe(l);function q(h){l[45](h)}function ee(h){l[46](h)}let oe={};l[20]!==void 0&&(oe.options=l[20]),l[21]!==void 0&&(oe.selected_option=l[21]),J=new ct({props:oe}),N.push(()=>R(J,"options",q)),N.push(()=>R(J,"selected_option",ee)),J.$on("selection-changed",l[47]);let V=l[21]==l[20][1]&&Be(l),T=l[6]&&Fe(l);return{c(){t=k("div"),s=k("h2"),s.innerHTML=c,n=O(),u=k("div"),i=k("div"),_=k("h3"),_.textContent=o,a=O(),p&&p.c(),d=O(),L&&L.c(),e=O(),C&&C.c(),m=O(),$&&$.c(),b=O(),r&&r.c(),S=O(),Y=k("div"),U=k("h2"),U.innerHTML=se,te=O(),K=k("div"),Z=k("div"),F=k("div"),G=k("div"),A=k("div"),I=k("h3"),I.textContent=j,x=O(),de(J.$$.fragment),le=O(),V&&V.c(),he=O(),T&&T.c(),this.h()},l(h){t=y(h,"DIV",{class:!0});var D=Q(t);s=y(D,"H2",{class:!0,"data-svelte-h":!0}),X(s)!=="svelte-c8inc9"&&(s.innerHTML=c),n=B(D),u=y(D,"DIV",{id:!0,class:!0,"data-bs-parent":!0});var ie=Q(u);i=y(ie,"DIV",{class:!0});var W=Q(i);_=y(W,"H3",{"data-svelte-h":!0}),X(_)!=="svelte-17gugf8"&&(_.textContent=o),a=B(W),p&&p.l(W),d=B(W),L&&L.l(W),e=B(W),C&&C.l(W),m=B(W),$&&$.l(W),b=B(W),r&&r.l(W),W.forEach(g),ie.forEach(g),D.forEach(g),S=B(h),Y=y(h,"DIV",{class:!0});var ke=Q(Y);U=y(ke,"H2",{class:!0,"data-svelte-h":!0}),X(U)!=="svelte-hz94lo"&&(U.innerHTML=se),te=B(ke),K=y(ke,"DIV",{id:!0,class:!0,"data-bs-parent":!0});var Ee=Q(K);Z=y(Ee,"DIV",{class:!0});var He=Q(Z);F=y(He,"DIV",{class:!0});var ge=Q(F);G=y(ge,"DIV",{class:!0});var Ie=Q(G);A=y(Ie,"DIV",{class:!0});var ye=Q(A);I=y(ye,"H3",{"data-svelte-h":!0}),X(I)!=="svelte-126hufg"&&(I.textContent=j),x=B(ye),ue(J.$$.fragment,ye),ye.forEach(g),Ie.forEach(g),le=B(ge),V&&V.l(ge),he=B(ge),T&&T.l(ge),ge.forEach(g),He.forEach(g),Ee.forEach(g),ke.forEach(g),this.h()},h(){E(s,"class","accordion-header"),E(i,"class","accordion-body"),E(u,"id","collapseTwo"),E(u,"class","accordion-collapse collapse"),E(u,"data-bs-parent","#accordionExample"),E(t,"class","accordion-item"),E(U,"class","accordion-header"),E(A,"class","col-6"),E(G,"class","row"),E(F,"class","accordion-body"),E(Z,"class","accordion-body"),E(K,"id","collapseThree"),E(K,"class","accordion-collapse collapse"),E(K,"data-bs-parent","#accordionExample"),E(Y,"class","accordion-item")},m(h,D){z(h,t,D),w(t,s),w(t,n),w(t,u),w(u,i),w(i,_),w(i,a),p&&p.m(i,null),w(i,d),L&&L.m(i,null),w(i,e),C&&C.m(i,null),w(i,m),$&&$.m(i,null),w(i,b),r&&r.m(i,null),z(h,S,D),z(h,Y,D),w(Y,U),w(Y,te),w(Y,K),w(K,Z),w(Z,F),w(F,G),w(G,A),w(A,I),w(A,x),me(J,A,null),w(F,le),V&&V.m(F,null),w(F,he),T&&T.m(F,null),ne=!0},p(h,D){h[11].length>0?p?(p.p(h,D),D[0]&2048&&v(p,1)):(p=ze(h),p.c(),v(p,1),p.m(i,d)):p&&(fe(),H(p,1,1,()=>{p=null}),_e()),h[13].length>0?L?(L.p(h,D),D[0]&8192&&v(L,1)):(L=je(h),L.c(),v(L,1),L.m(i,e)):L&&(fe(),H(L,1,1,()=>{L=null}),_e()),h[15].length>0?C?(C.p(h,D),D[0]&32768&&v(C,1)):(C=qe(h),C.c(),v(C,1),C.m(i,m)):C&&(fe(),H(C,1,1,()=>{C=null}),_e()),h[18].length>0?$?($.p(h,D),D[0]&262144&&v($,1)):($=Ae(h),$.c(),v($,1),$.m(i,b)):$&&(fe(),H($,1,1,()=>{$=null}),_e()),h[19].length>0?r?(r.p(h,D),D[0]&524288&&v(r,1)):(r=Oe(h),r.c(),v(r,1),r.m(i,null)):r&&(fe(),H(r,1,1,()=>{r=null}),_e());const ie={};!ae&&D[0]&1048576&&(ae=!0,ie.options=h[20],P(()=>ae=!1)),!re&&D[0]&2097152&&(re=!0,ie.selected_option=h[21],P(()=>re=!1)),J.$set(ie),h[21]==h[20][1]?V?(V.p(h,D),D[0]&3145728&&v(V,1)):(V=Be(h),V.c(),v(V,1),V.m(F,he)):V&&(fe(),H(V,1,1,()=>{V=null}),_e()),h[6]?T?(T.p(h,D),D[0]&64&&v(T,1)):(T=Fe(h),T.c(),v(T,1),T.m(F,null)):T&&(fe(),H(T,1,1,()=>{T=null}),_e())},i(h){ne||(v(p),v(L),v(C),v($),v(r),v(J.$$.fragment,h),v(V),v(T),ne=!0)},o(h){H(p),H(L),H(C),H($),H(r),H(J.$$.fragment,h),H(V),H(T),ne=!1},d(h){h&&(g(t),g(S),g(Y)),p&&p.d(),L&&L.d(),C&&C.d(),$&&$.d(),r&&r.d(),pe(J),V&&V.d(),T&&T.d()}}}function ze(l){let t,s="Transport",c,n,u,i,_;function o(e){l[30](e)}function a(e){l[31](e)}let d={};return l[12]!==void 0&&(d.selected_elements=l[12]),l[11]!==void 0&&(d.elements=l[11]),n=new ve({props:d}),N.push(()=>R(n,"selected_elements",o)),N.push(()=>R(n,"elements",a)),n.$on("selection-changed",l[32]),{c(){t=k("h4"),t.textContent=s,c=O(),de(n.$$.fragment)},l(e){t=y(e,"H4",{"data-svelte-h":!0}),X(t)!=="svelte-1tmas69"&&(t.textContent=s),c=B(e),ue(n.$$.fragment,e)},m(e,m){z(e,t,m),z(e,c,m),me(n,e,m),_=!0},p(e,m){const b={};!u&&m[0]&4096&&(u=!0,b.selected_elements=e[12],P(()=>u=!1)),!i&&m[0]&2048&&(i=!0,b.elements=e[11],P(()=>i=!1)),n.$set(b)},i(e){_||(v(n.$$.fragment,e),_=!0)},o(e){H(n.$$.fragment,e),_=!1},d(e){e&&(g(t),g(c)),pe(n,e)}}}function je(l){let t,s="Storage",c,n,u,i,_;function o(e){l[33](e)}function a(e){l[34](e)}let d={};return l[14]!==void 0&&(d.selected_elements=l[14]),l[13]!==void 0&&(d.elements=l[13]),n=new ve({props:d}),N.push(()=>R(n,"selected_elements",o)),N.push(()=>R(n,"elements",a)),n.$on("selection-changed",l[35]),{c(){t=k("h4"),t.textContent=s,c=O(),de(n.$$.fragment)},l(e){t=y(e,"H4",{"data-svelte-h":!0}),X(t)!=="svelte-hjv5od"&&(t.textContent=s),c=B(e),ue(n.$$.fragment,e)},m(e,m){z(e,t,m),z(e,c,m),me(n,e,m),_=!0},p(e,m){const b={};!u&&m[0]&16384&&(u=!0,b.selected_elements=e[14],P(()=>u=!1)),!i&&m[0]&8192&&(i=!0,b.elements=e[13],P(()=>i=!1)),n.$set(b)},i(e){_||(v(n.$$.fragment,e),_=!0)},o(e){H(n.$$.fragment,e),_=!1},d(e){e&&(g(t),g(c)),pe(n,e)}}}function qe(l){let t,s="Conversion",c,n,u,i,_;function o(e){l[36](e)}function a(e){l[37](e)}let d={};return l[16]!==void 0&&(d.selected_elements=l[16]),l[15]!==void 0&&(d.elements=l[15]),n=new ve({props:d}),N.push(()=>R(n,"selected_elements",o)),N.push(()=>R(n,"elements",a)),n.$on("selection-changed",l[38]),{c(){t=k("h4"),t.textContent=s,c=O(),de(n.$$.fragment)},l(e){t=y(e,"H4",{"data-svelte-h":!0}),X(t)!=="svelte-ad5jza"&&(t.textContent=s),c=B(e),ue(n.$$.fragment,e)},m(e,m){z(e,t,m),z(e,c,m),me(n,e,m),_=!0},p(e,m){const b={};!u&&m[0]&65536&&(u=!0,b.selected_elements=e[16],P(()=>u=!1)),!i&&m[0]&32768&&(i=!0,b.elements=e[15],P(()=>i=!1)),n.$set(b)},i(e){_||(v(n.$$.fragment,e),_=!0)},o(e){H(n.$$.fragment,e),_=!1},d(e){e&&(g(t),g(c)),pe(n,e)}}}function Ae(l){let t,s="Cost of Carrier",c,n,u,i,_;function o(e){l[39](e)}function a(e){l[40](e)}let d={};return l[7]!==void 0&&(d.selected_elements=l[7]),l[18]!==void 0&&(d.elements=l[18]),n=new ve({props:d}),N.push(()=>R(n,"selected_elements",o)),N.push(()=>R(n,"elements",a)),n.$on("selection-changed",l[41]),{c(){t=k("h3"),t.textContent=s,c=O(),de(n.$$.fragment)},l(e){t=y(e,"H3",{"data-svelte-h":!0}),X(t)!=="svelte-bhb6z8"&&(t.textContent=s),c=B(e),ue(n.$$.fragment,e)},m(e,m){z(e,t,m),z(e,c,m),me(n,e,m),_=!0},p(e,m){const b={};!u&&m[0]&128&&(u=!0,b.selected_elements=e[7],P(()=>u=!1)),!i&&m[0]&262144&&(i=!0,b.elements=e[18],P(()=>i=!1)),n.$set(b)},i(e){_||(v(n.$$.fragment,e),_=!0)},o(e){H(n.$$.fragment,e),_=!1},d(e){e&&(g(t),g(c)),pe(n,e)}}}function Oe(l){let t,s="Shed Demand",c,n,u,i,_;function o(e){l[42](e)}function a(e){l[43](e)}let d={};return l[8]!==void 0&&(d.selected_elements=l[8]),l[19]!==void 0&&(d.elements=l[19]),n=new ve({props:d}),N.push(()=>R(n,"selected_elements",o)),N.push(()=>R(n,"elements",a)),n.$on("selection-changed",l[44]),{c(){t=k("h3"),t.textContent=s,c=O(),de(n.$$.fragment)},l(e){t=y(e,"H3",{"data-svelte-h":!0}),X(t)!=="svelte-13kd4c5"&&(t.textContent=s),c=B(e),ue(n.$$.fragment,e)},m(e,m){z(e,t,m),z(e,c,m),me(n,e,m),_=!0},p(e,m){const b={};!u&&m[0]&256&&(u=!0,b.selected_elements=e[8],P(()=>u=!1)),!i&&m[0]&524288&&(i=!0,b.elements=e[19],P(()=>i=!1)),n.$set(b)},i(e){_||(v(n.$$.fragment,e),_=!0)},o(e){H(n.$$.fragment,e),_=!1},d(e){e&&(g(t),g(c)),pe(n,e)}}}function Be(l){let t,s="Location",c,n,u,i;function _(a){l[48](a)}let o={elements:l[3]};return l[4]!==void 0&&(o.selected_elements=l[4]),n=new ve({props:o}),N.push(()=>R(n,"selected_elements",_)),n.$on("selection-changed",l[49]),{c(){t=k("h3"),t.textContent=s,c=O(),de(n.$$.fragment)},l(a){t=y(a,"H3",{"data-svelte-h":!0}),X(t)!=="svelte-15gguv3"&&(t.textContent=s),c=B(a),ue(n.$$.fragment,a)},m(a,d){z(a,t,d),z(a,c,d),me(n,a,d),i=!0},p(a,d){const e={};d[0]&8&&(e.elements=a[3]),!u&&d[0]&16&&(u=!0,e.selected_elements=a[4],P(()=>u=!1)),n.$set(e)},i(a){i||(v(n.$$.fragment,a),i=!0)},o(a){H(n.$$.fragment,a),i=!1},d(a){a&&(g(t),g(c)),pe(n,a)}}}function Fe(l){let t,s="Year",c,n,u,i;function _(a){l[50](a)}let o={elements:l[2]};return l[6]!==void 0&&(o.selected_elements=l[6]),n=new ve({props:o}),N.push(()=>R(n,"selected_elements",_)),n.$on("selection-changed",l[51]),{c(){t=k("h3"),t.textContent=s,c=O(),de(n.$$.fragment)},l(a){t=y(a,"H3",{"data-svelte-h":!0}),X(t)!=="svelte-r9e7qt"&&(t.textContent=s),c=B(a),ue(n.$$.fragment,a)},m(a,d){z(a,t,d),z(a,c,d),me(n,a,d),i=!0},p(a,d){const e={};d[0]&4&&(e.elements=a[2]),!u&&d[0]&64&&(u=!0,e.selected_elements=a[6],P(()=>u=!1)),n.$set(e)},i(a){i||(v(n.$$.fragment,a),i=!0)},o(a){H(n.$$.fragment,a),i=!1},d(a){a&&(g(t),g(c)),pe(n,a)}}}function _t(l){let t,s,c,n;const u=[ut,dt],i=[];function _(o,a){return o[22].data.datasets.length==0||o[22].data.datasets[0].data.length==0?0:1}return t=_(l),s=i[t]=u[t](l),{c(){s.c(),c=Le()},l(o){s.l(o),c=Le()},m(o,a){i[t].m(o,a),z(o,c,a),n=!0},p(o,a){let d=t;t=_(o),t===d?i[t].p(o,a):(fe(),H(i[d],1,1,()=>{i[d]=null}),_e(),s=i[t],s?s.p(o,a):(s=i[t]=u[t](o),s.c()),v(s,1),s.m(c.parentNode,c))},i(o){n||(v(s),n=!0)},o(o){H(s),n=!1},d(o){o&&g(c),i[t].d(o)}}}function ft(l){let t,s='<div class="spinner-border center" role="status"><span class="visually-hidden">Loading...</span></div>';return{c(){t=k("div"),t.innerHTML=s,this.h()},l(c){t=y(c,"DIV",{class:!0,"data-svelte-h":!0}),X(t)!=="svelte-1a5ljpq"&&(t.innerHTML=s),this.h()},h(){E(t,"class","text-center")},m(c,n){z(c,t,n)},p:we,i:we,o:we,d(c){c&&g(t)}}}function dt(l){let t,s,c,n;function u(o){l[52](o)}function i(o){l[53](o)}let _={};return l[22]!==void 0&&(_.config=l[22]),l[5].detail.system.reference_year!==void 0&&(_.year_offset=l[5].detail.system.reference_year),t=new rt({props:_}),N.push(()=>R(t,"config",u)),N.push(()=>R(t,"year_offset",i)),{c(){de(t.$$.fragment)},l(o){ue(t.$$.fragment,o)},m(o,a){me(t,o,a),n=!0},p(o,a){const d={};!s&&a[0]&4194304&&(s=!0,d.config=o[22],P(()=>s=!1)),!c&&a[0]&32&&(c=!0,d.year_offset=o[5].detail.system.reference_year,P(()=>c=!1)),t.$set(d)},i(o){n||(v(t.$$.fragment,o),n=!0)},o(o){H(t.$$.fragment,o),n=!1},d(o){pe(t,o)}}}function ut(l){let t,s="No data with this selection.";return{c(){t=k("div"),t.textContent=s,this.h()},l(c){t=y(c,"DIV",{class:!0,"data-svelte-h":!0}),X(t)!=="svelte-1doxial"&&(t.textContent=s),this.h()},h(){E(t,"class","text-center")},m(c,n){z(c,t,n)},p:we,i:we,o:we,d(c){c&&g(t)}}}function mt(l){let t,s="Costs",c,n,u,i,_,o,a,d='<button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">Solution Selection</button>',e,m,b,S,Y,U,se,te,K,Z,F,G,A,I,j,x;function J(r){l[25](r)}function ae(r){l[26](r)}function re(r){l[27](r)}function le(r){l[28](r)}function he(r){l[29](r)}let ne={enabled:!l[9]&&!l[10]};l[0]!==void 0&&(ne.carriers=l[0]),l[1]!==void 0&&(ne.nodes=l[1]),l[2]!==void 0&&(ne.years=l[2]),l[5]!==void 0&&(ne.selected_solution=l[5]),l[9]!==void 0&&(ne.loading=l[9]),S=new ot({props:ne}),N.push(()=>R(S,"carriers",J)),N.push(()=>R(S,"nodes",ae)),N.push(()=>R(S,"years",re)),N.push(()=>R(S,"selected_solution",le)),N.push(()=>R(S,"loading",he)),S.$on("solution_selected",l[24]);let p=!l[10]&&!l[9]&&l[17]&&l[5]!=null&&Me(l);const L=[ft,_t],C=[];function $(r,q){return r[9]||r[10]?0:r[5]!=null?1:-1}return~(I=$(l))&&(j=C[I]=L[I](l)),{c(){t=k("h2"),t.textContent=s,c=O(),n=k("div"),u=k("div"),i=k("div"),_=k("div"),o=k("div"),a=k("h2"),a.innerHTML=d,e=O(),m=k("div"),b=k("div"),de(S.$$.fragment),Z=O(),p&&p.c(),F=O(),G=k("div"),A=k("div"),j&&j.c(),this.h()},l(r){t=y(r,"H2",{"data-svelte-h":!0}),X(t)!=="svelte-lt28jw"&&(t.textContent=s),c=B(r),n=y(r,"DIV",{class:!0});var q=Q(n);u=y(q,"DIV",{class:!0});var ee=Q(u);i=y(ee,"DIV",{class:!0,style:!0});var oe=Q(i);_=y(oe,"DIV",{class:!0,id:!0});var V=Q(_);o=y(V,"DIV",{class:!0});var T=Q(o);a=y(T,"H2",{class:!0,"data-svelte-h":!0}),X(a)!=="svelte-64kjki"&&(a.innerHTML=d),e=B(T),m=y(T,"DIV",{id:!0,class:!0,"data-bs-parent":!0});var h=Q(m);b=y(h,"DIV",{class:!0});var D=Q(b);ue(S.$$.fragment,D),D.forEach(g),h.forEach(g),T.forEach(g),Z=B(V),p&&p.l(V),V.forEach(g),oe.forEach(g),ee.forEach(g),q.forEach(g),F=B(r),G=y(r,"DIV",{class:!0});var ie=Q(G);A=y(ie,"DIV",{class:!0,style:!0});var W=Q(A);j&&j.l(W),W.forEach(g),ie.forEach(g),this.h()},h(){E(a,"class","accordion-header"),E(b,"class","accordion-body"),E(m,"id","collapseOne"),E(m,"class","accordion-collapse collapse show"),E(m,"data-bs-parent","#accordionExample"),E(o,"class","accordion-item solution-selection"),E(_,"class","accordion"),E(_,"id","accordionExample"),E(i,"class","filters"),Ve(i,"position","absolute"),Ve(i,"width","100%"),E(u,"class","col position-relative"),E(n,"class","row"),E(A,"class","col"),Ve(A,"margin-top","400px"),E(G,"class","row")},m(r,q){z(r,t,q),z(r,c,q),z(r,n,q),w(n,u),w(u,i),w(i,_),w(_,o),w(o,a),w(o,e),w(o,m),w(m,b),me(S,b,null),w(_,Z),p&&p.m(_,null),z(r,F,q),z(r,G,q),w(G,A),~I&&C[I].m(A,null),x=!0},p(r,q){const ee={};q[0]&1536&&(ee.enabled=!r[9]&&!r[10]),!Y&&q[0]&1&&(Y=!0,ee.carriers=r[0],P(()=>Y=!1)),!U&&q[0]&2&&(U=!0,ee.nodes=r[1],P(()=>U=!1)),!se&&q[0]&4&&(se=!0,ee.years=r[2],P(()=>se=!1)),!te&&q[0]&32&&(te=!0,ee.selected_solution=r[5],P(()=>te=!1)),!K&&q[0]&512&&(K=!0,ee.loading=r[9],P(()=>K=!1)),S.$set(ee),!r[10]&&!r[9]&&r[17]&&r[5]!=null?p?(p.p(r,q),q[0]&132640&&v(p,1)):(p=Me(r),p.c(),v(p,1),p.m(_,null)):p&&(fe(),H(p,1,1,()=>{p=null}),_e());let oe=I;I=$(r),I===oe?~I&&C[I].p(r,q):(j&&(fe(),H(C[oe],1,1,()=>{C[oe]=null}),_e()),~I?(j=C[I],j?j.p(r,q):(j=C[I]=L[I](r),j.c()),v(j,1),j.m(A,null)):j=null)},i(r){x||(v(S.$$.fragment,r),v(p),v(j),x=!0)},o(r){H(S.$$.fragment,r),H(p),H(j),x=!1},d(r){r&&(g(t),g(c),g(n),g(F),g(G)),pe(S),p&&p.d(),~I&&C[I].d()}}}let Ne="",pt="not_normalized",Pe=null,Ce="Techology / Carrier";function ht(l,t,s){let c=[],n=[],u=[],i=[],_=[],o=null,a=[],d=[],e=[],m=!1,b=!1,S=[],Y=[],U=[],se=[],te=[],K=[],Z,F,G,A,I,j,x=[],J=[],ae=[Ce,"Location"],re=ae[1],le={type:"line",data:{datasets:[]},options:{responsive:!0,scales:{x:{stacked:!0,title:{display:!0,text:"Year"}},y:{stacked:!0,title:{display:!0,text:Pe+" ["+Ne+"]"}}}}};async function he(){o!=null&&(s(10,b=!0),await Se(),s(17,A=await De(o.solution_name,"capex_yearly",o.scenario_name,o.detail.system.reference_year,o.detail.system.interval_between_years)),I=await De(o.solution_name,"opex_yearly",o.scenario_name,o.detail.system.reference_year,o.detail.system.interval_between_years),F=await De(o.solution_name,"cost_carbon_emissions_total",o.scenario_name,o.detail.system.reference_year,o.detail.system.interval_between_years),G=await De(o.solution_name,"cost_carrier",o.scenario_name,o.detail.system.reference_year,o.detail.system.interval_between_years),j=await De(o.solution_name,"shed_demand",o.scenario_name,o.detail.system.reference_year,o.detail.system.interval_between_years),$e(G.data,"node","location"),$e(j.data,"node","location"),s(10,b=!1))}function ne(){s(10,b=!0);let f=structuredClone(G.data);f.data=f.data.filter(M=>d.includes(M.carrier));let ce=structuredClone(j.data);ce.data=ce.data.filter(M=>e.includes(M.carrier)),Z=it(Ce,[["technology",A.data],["technology",I.data],["carrier",f],["carrier",ce]]);let be=new Set;for(const M of Z.data)be.add(M.location);s(3,i=Array.from(be)),s(10,b=!1)}function p(){s(10,b=!0);let f={},ce={};ne();let be=[...K,...se,...Y,...d,...e];re==ae[0]?(f.location=i,ce[Ce]=be):(f[Ce]=be,ce.location=_);let M=u.filter(tt=>!a.includes(tt)),et=pt=="normalized",Te=at(Z.data,f,ce,M,et);F.data.data.length>0&&Te.push({label:"Total Carbon Costs",data:F.data.data[0],type:"bar"}),Se().then(()=>{s(22,le.data={datasets:Te},le),s(22,le.options.scales.y.title.text=Pe+" ["+Ne+"]",le),s(10,b=!1)})}async function L(){if(o==null)return;await he(),s(10,b=!0);let f=new Set;for(const M of A.data.data)f.add(M[Ce]);for(const M of I.data.data)f.add(M[Ce]);s(11,S=o.detail.system.set_transport_technologies.filter(M=>f.has(M))),s(15,te=o.detail.system.set_conversion_technologies.filter(M=>f.has(M))),s(13,U=o.detail.system.set_storage_technologies.filter(M=>f.has(M))),s(12,Y=S),s(16,K=te),s(14,se=U);let ce=new Set;for(const M of G.data.data)ce.add(M.carrier);s(0,c=o.detail.system.set_carriers),s(18,x=o.detail.carriers_import.concat(o.detail.carriers_export).filter(M=>ce.has(M))),s(7,d=x);let be=new Set;for(const M of j.data.data)be.add(M.carrier);s(19,J=o.detail.carriers_demand.filter(M=>be.has(M))),s(8,e=J),s(1,n=o.detail.system.set_nodes),s(6,a=u),s(4,_=i),p(),s(10,b=!1)}function C(f){c=f,s(0,c)}function $(f){n=f,s(1,n)}function r(f){u=f,s(2,u)}function q(f){o=f,s(5,o)}function ee(f){m=f,s(9,m)}function oe(f){Y=f,s(12,Y)}function V(f){S=f,s(11,S)}const T=()=>{p()};function h(f){se=f,s(14,se)}function D(f){U=f,s(13,U)}const ie=()=>{p()};function W(f){K=f,s(16,K)}function ke(f){te=f,s(15,te)}const Ee=()=>{p()};function He(f){d=f,s(7,d)}function ge(f){x=f,s(18,x)}const Ie=()=>{p()};function ye(f){e=f,s(8,e)}function Re(f){J=f,s(19,J)}const Ye=()=>{p()};function Ge(f){ae=f,s(20,ae)}function Je(f){re=f,s(21,re)}const Ke=f=>{p()};function Qe(f){_=f,s(4,_)}const Ue=f=>{p()};function We(f){a=f,s(6,a)}const Xe=f=>{p()};function Ze(f){le=f,s(22,le)}function xe(f){l.$$.not_equal(o.detail.system.reference_year,f)&&(o.detail.system.reference_year=f,s(5,o))}return[c,n,u,i,_,o,a,d,e,m,b,S,Y,U,se,te,K,A,x,J,ae,re,le,p,L,C,$,r,q,ee,oe,V,T,h,D,ie,W,ke,Ee,He,ge,Ie,ye,Re,Ye,Ge,Je,Ke,Qe,Ue,We,Xe,Ze,xe]}class yt extends nt{constructor(t){super(),st(this,t,ht,mt,lt,{},null,[-1,-1])}}export{yt as component};
