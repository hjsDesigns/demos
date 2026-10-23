/* A slight perspective response on photographs, never on the approved still hero.
   Pointer-only; no continuous loop and no motion when reduced motion is requested. */
(function(){
 'use strict';
 var allowed=window.matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)');
 document.querySelectorAll('[data-depth]').forEach(function(frame){
  var pending=0,last;
  function clear(){if(pending)cancelAnimationFrame(pending);pending=0;frame.style.removeProperty('--depth-x');frame.style.removeProperty('--depth-y');}
  frame.addEventListener('pointermove',function(event){
   if(!allowed.matches)return;last=event;
   if(!pending)pending=requestAnimationFrame(function(){pending=0;var r=frame.getBoundingClientRect();frame.style.setProperty('--depth-x',((.5-(last.clientY-r.top)/r.height)*3).toFixed(2)+'deg');frame.style.setProperty('--depth-y',(((last.clientX-r.left)/r.width-.5)*4).toFixed(2)+'deg');});
  });
  frame.addEventListener('pointerleave',clear);allowed.addEventListener('change',clear);
 });
})();
