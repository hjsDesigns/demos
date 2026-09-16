/* Light-touch depth; the real photograph and all controls work without it. */
(function(){
 'use strict';
 var hero=document.querySelector('.hero-sunrise');if(!hero)return;
 var reduce=matchMedia('(prefers-reduced-motion:reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)'),frame=0,x=0,y=0;
 function reset(){x=y=0;hero.style.setProperty('--morning-x','0px');hero.style.setProperty('--morning-y','0px');hero.style.setProperty('--morning-scroll','0px');}
 function draw(){frame=0;if(reduce.matches||!fine.matches){reset();return;}var b=hero.getBoundingClientRect();hero.style.setProperty('--morning-x',x.toFixed(2)+'px');hero.style.setProperty('--morning-y',y.toFixed(2)+'px');hero.style.setProperty('--morning-scroll',Math.min(35,Math.max(0,-b.top)*.065).toFixed(2)+'px');}
 function schedule(){if(!frame)frame=requestAnimationFrame(draw);}
 hero.addEventListener('pointermove',function(e){if(reduce.matches||!fine.matches)return;var b=hero.getBoundingClientRect();x=((e.clientX-b.left)/b.width-.5)*18;y=((e.clientY-b.top)/b.height-.5)*10;schedule();});
 hero.addEventListener('pointerleave',function(){x=y=0;schedule();});
 window.addEventListener('scroll',schedule,{passive:true});reduce.addEventListener('change',reset);fine.addEventListener('change',reset);
 window.addEventListener('pagehide',function(){if(frame)cancelAnimationFrame(frame);});
})();
