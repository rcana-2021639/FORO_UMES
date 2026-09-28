/**
 * Script de arranque, inline en <head> (se ejecuta mientras se lee el HTML, antes del primer
 * pintado y antes de que React hidrate). Hace tres cosas:
 *
 * 1. Nivel de efectos (ver lib/quality.ts). `?efectos=full|lite|still` en la URL lo fuerza.
 *
 * 2. Entradas animadas de todo el sitio. Cualquier elemento con `data-reveal="tipo"` (o los hijos
 *    directos de un `data-reveal-stagger="tipo"`) entra animado la primera vez que aparece en
 *    pantalla. Detalles que importan:
 *    - Se anima con la Web Animations API: NUNCA se tocan atributos, clases ni estilos del HTML,
 *      así que React no ve diferencias al hidratar y no hay parpadeo (el elemento se retiene en su
 *      estado inicial desde que el parser lo inserta, antes de que se pinte).
 *    - Un solo IntersectionObserver y un solo MutationObserver para todo el sitio; cada animación
 *      corre una vez, en el compositor (opacidad y transformaciones) y se descarta al terminar.
 *    - Lo que entra junto se encadena en orden de lectura (el título antes que el párrafo).
 *    - `data-reveal-group` agrupa piezas (palabras de un título): el grupo es el disparador y sus
 *      piezas entran en cascada. `data-reveal-delay` y `data-reveal-step` en milisegundos.
 *    - Sin JavaScript o con menos movimiento no se oculta nada.
 *
 * 3. Fotos que terminan de cargar después de la entrada aparecen con un fundido (sin tocar el DOM).
 */
export const QUALITY_KEY = 'foro:quality';

export const QUALITY_SCRIPT = `(function(){
var d=document.documentElement,w=window,q='full';
try{
  var forced=new URLSearchParams(location.search).get('efectos');
  if(forced==='full'||forced==='lite'||forced==='still')q=forced;
  else if(w.matchMedia('(prefers-reduced-motion: reduce)').matches)q='still';
  else{
    var n=navigator,saved=null;
    try{saved=sessionStorage.getItem('${QUALITY_KEY}')}catch(e){}
    var weak=(n.hardwareConcurrency&&n.hardwareConcurrency<=4)||(n.deviceMemory&&n.deviceMemory<=4)||(n.connection&&n.connection.saveData)||w.matchMedia('(pointer: coarse)').matches;
    q=saved==='lite'||weak?'lite':'full';
  }
}catch(e){}
d.setAttribute('data-quality',q);
d.classList.add('js');
if(q==='still'||!('IntersectionObserver' in w)||!('MutationObserver' in w)||!Element.prototype.animate)return;
try{
var lite=q==='lite',
EASE='cubic-bezier(0.16,1,0.3,1)',
POP='cubic-bezier(0.34,1.56,0.64,1)',
FOLD='cubic-bezier(0.215,0.61,0.355,1)',
WIPE='cubic-bezier(0.77,0,0.175,1)';
function up(){return [[{opacity:0,translate:'0 34px',offset:0}],1000,EASE,70];}
function fx(kind,el){
  switch(kind){
    case 'fade':return [[{opacity:0,offset:0}],900,EASE,60];
    case 'down':return [[{opacity:0,translate:'0 -26px',offset:0}],1000,EASE,60];
    case 'left':return [[{opacity:0,translate:'-46px 0',offset:0}],1100,EASE,70];
    case 'right':return [[{opacity:0,translate:'46px 0',offset:0}],1100,EASE,70];
    case 'scale':return [[{opacity:0,scale:'0.9',translate:'0 22px',offset:0}],1100,EASE,80];
    case 'pop':return [[{opacity:0,scale:'0.4',offset:0}],850,POP,60];
    case 'blur':return lite?up():[[{opacity:0,filter:'blur(14px)',translate:'0 18px',offset:0}],1150,EASE,90];
    case 'tilt':return lite?up():[[{opacity:0,transform:'perspective(1100px) rotateX(-26deg) translateY(60px)',offset:0}],1250,EASE,85];
    case 'swing':return lite?up():[[{opacity:0,transform:'perspective(1200px) rotateY(-34deg) rotateX(10deg) translateY(40px)',offset:0}],1400,EASE,90];
    case 'clip':return [[{clipPath:'inset(100% 0% 0% 0%)'},{clipPath:'inset(0% 0% 0% 0%)'}],1300,WIPE,110];
    case 'rise':return [[{translate:'0 135%',rotate:'5deg',offset:0}],1150,EASE,42];
    case 'line':return [[{scale:'0 1',offset:0}],1300,WIPE,90];
    case 'ms-dot':return [[{scale:'0',offset:0}],750,POP,100];
    case 'ms-date':return [[{opacity:0,translate:'-12px 0',offset:0}],850,EASE,0];
    case 'ms-stem':return [[{scale:'1 0',offset:0}],700,EASE,110];
    case 'ms-card':
      var top=!el.closest('[data-side="bottom"]');
      return lite?[[{opacity:0,translate:top?'0 30px':'0 -30px',offset:0}],900,EASE,0]:[[{opacity:0,transform:'perspective(900px) rotateX('+(top?88:-88)+'deg) rotateY(0deg) translateZ(0px)',offset:0}],1250,EASE,0];
    case 'deck':return [[{opacity:0,translate:'0 80px',rotate:'8deg',offset:0}],1600,EASE,0];
    case 'fold':
      var h=el.getAttribute('data-fold-hinge'),r=h==='top'?'rotateX(-92deg)':h==='left'?'rotateY(92deg)':h==='right'?'rotateY(-92deg)':'rotateX(92deg)';
      return lite?[[{opacity:0,translate:'0 0.4em',offset:0}],800,EASE,40]:[[{opacity:0,transform:r,'--fold-crease':0.5,offset:0}],800,FOLD,55];
    default:return up();
  }
}
var held=new Map(),members=new Map(),fired=new WeakSet(),done=new WeakSet(),pend=new Set();
var io=new IntersectionObserver(function(list){
  var ts=[];
  for(var i=0;i<list.length;i++)if(list[i].isIntersecting)ts.push(list[i].target);
  if(!ts.length)return;
  ts.sort(function(a,b){return a===b?0:(a.compareDocumentPosition(b)&4?-1:1)});
  var t=0;
  for(var k=0;k<ts.length;k++){
    var trg=ts[k],ms=fire(trg),step=0,own=num(trg,'data-reveal-step'),first=null;
    var base=num(trg,'data-reveal-delay')||0;
    for(var m=0;m<ms.length;m++){
      var hh=held.get(ms[m]);if(!hh)continue;
      if(!first)first=hh;
      show(ms[m],base+t+step);
      step=Math.min(step+(own!=null?own:hh.step),900);
    }
    if(first)t=Math.min(t+(first.step||60),560);
  }
},{rootMargin:'0px 0px -7% 0px',threshold:0});
function num(el,a){var v=el.getAttribute&&el.getAttribute(a);return v==null||v===''?null:+v;}
function fire(trg){
  io.unobserve(trg);pend.delete(trg);fired.add(trg);
  var ms=members.get(trg);members.delete(trg);
  if(!ms)return [trg];
  return held.has(trg)?[trg].concat(ms):ms;
}
function show(el,delay){
  var hh=held.get(el);if(!hh)return;
  held.delete(el);done.add(el);
  for(var i=0;i<hh.a.length;i++){hh.a[i].effect.updateTiming({delay:delay});hh.a[i].play();}
}
function kindOf(el){
  var k=el.getAttribute('data-reveal');
  if(k==null){var p=el.parentElement;k=p&&p.getAttribute('data-reveal-stagger');}
  return k||'up';
}
function add(el){
  if(held.has(el)||done.has(el))return;
  var kind=kindOf(el);if(kind==='none')return;
  var f=fx(kind,el),a=[];
  try{
    a.push(el.animate(f[0],{duration:f[1],easing:f[2],fill:'backwards'}));
    if(kind==='clip'){
      var img=el.querySelector('img,video');
      if(img)a.push(img.animate([{scale:'1.28',offset:0}],{duration:1700,easing:EASE,fill:'backwards'}));
    }
  }catch(e){return;}
  for(var i=0;i<a.length;i++)a[i].pause();
  held.set(el,{a:a,step:f[3]});
  var g=el.closest('[data-reveal-group]'),trg=g&&g!==el?g:el;
  if(fired.has(trg)){show(el,0);return;}
  if(trg!==el){var l=members.get(trg);if(!l){l=[];members.set(trg,l);}l.push(el);}
  pend.add(trg);io.observe(trg);
}
function drop(el){
  var hh=held.get(el);
  if(hh){for(var i=0;i<hh.a.length;i++)hh.a[i].cancel();held.delete(el);}
  if(pend.has(el)){io.unobserve(el);pend.delete(el);members.delete(el);}
}
var SEL='[data-reveal],[data-reveal-stagger]>*';
function scanAdd(node){
  if(node.nodeType!==1)return;
  if(node.matches(SEL))add(node);
  if(node.firstElementChild){var l=node.querySelectorAll(SEL);for(var i=0;i<l.length;i++)add(l[i]);}
}
// Lo que sale del documento (cambio de página, filtro) suelta su animación y su observación.
// Un nodo que solo se movió de sitio sigue conectado y conserva todo.
function scanDrop(node){
  if(node.nodeType!==1||node.isConnected||!(held.size||pend.size))return;
  drop(node);
  if(node.firstElementChild){var l=node.querySelectorAll(SEL+',[data-reveal-group]');for(var i=0;i<l.length;i++)drop(l[i]);}
}
new MutationObserver(function(recs){
  for(var i=0;i<recs.length;i++){
    var r=recs[i],j;
    for(j=0;j<r.removedNodes.length;j++)scanDrop(r.removedNodes[j]);
    for(j=0;j<r.addedNodes.length;j++)scanAdd(r.addedNodes[j]);
  }
}).observe(d,{childList:true,subtree:true});
function revealAll(){pend.forEach(function(trg){var ms=fire(trg);for(var i=0;i<ms.length;i++)show(ms[i],0);});}
w.addEventListener('beforeprint',revealAll);
// Red de seguridad: si algo quedó retenido en pantalla (disparador sin tamaño), se muestra igual
w.addEventListener('load',function(){setTimeout(function(){
  var vh=w.innerHeight;
  pend.forEach(function(trg){var b=trg.getBoundingClientRect();if(b.bottom>0&&b.top<vh){var ms=fire(trg);for(var i=0;i<ms.length;i++)show(ms[i],0);}});
},2500);});
document.addEventListener('load',function(e){
  var t=e.target;
  if(!t||t.tagName!=='IMG'||!t.hasAttribute('data-nimg')||t.hasAttribute('data-no-fade'))return;
  for(var p=t;p&&p!==d;p=p.parentElement)if(held.has(p))return;
  t.animate([{opacity:0,scale:'1.035',offset:0}],{duration:lite?450:750,easing:EASE});
},true);
w.__reveal={all:revealAll};
}catch(e){}
})();`;
