/**
 * Script inline de <head>: decide el nivel de efectos antes de pintar (ver lib/quality.ts).
 * `?efectos=full|lite|still` en la URL fuerza un nivel (para probar cómo se ve en un equipo modesto).
 */
export const QUALITY_KEY = 'foro:quality';

export const QUALITY_SCRIPT = `(function(){try{
var d=document.documentElement,n=navigator,m=window.matchMedia;
var q='full';
var forced=new URLSearchParams(location.search).get('efectos');
if(forced==='full'||forced==='lite'||forced==='still')q=forced;
else if(m('(prefers-reduced-motion: reduce)').matches)q='still';
else{
var saved=sessionStorage.getItem('${QUALITY_KEY}');
var weak=(n.hardwareConcurrency&&n.hardwareConcurrency<=4)||(n.deviceMemory&&n.deviceMemory<=4)||(n.connection&&n.connection.saveData)||m('(pointer: coarse)').matches;
q=saved==='lite'||weak?'lite':'full';
}
d.dataset.quality=q;
}catch(e){document.documentElement.dataset.quality='full';}})();`;
