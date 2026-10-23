/* Short, replayable sign ignition. Fixed particle budget; no idle animation loop.
   The emitter tracks the flame over the O in the actual 720×194 sign artwork. */
(() => {
 'use strict';
 const hero=document.getElementById('hero'),button=document.getElementById('ignitionSign'),canvas=document.getElementById('ignitionFlame');
 if(!hero||!button||!canvas)return;
 const context=canvas.getContext('2d'),motion=matchMedia('(prefers-reduced-motion: reduce)');
 let raf=0,start=0,last=0,particles=[],visible=true,width=0,height=0,seed=731;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const colors=['#FFF2B3','#FFD351','#FF883A','#F25A25'];
 function size(){const box=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);width=box.width;height=box.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);context?.setTransform(dpr,0,0,dpr,0,0);}
 function stop(){cancelAnimationFrame(raf);raf=0;particles=[];context?.clearRect(0,0,width,height);hero.classList.remove('ignition-playing');}
 function frame(now){
  if(motion.matches||document.hidden||!visible){stop();return;}
  if(!start){start=now;last=now;}const age=(now-start)/1000,dt=Math.min((now-last)/1000,.04);last=now;
  if(age>4.2){stop();return;}
  const signHeight=height/2.1,flameX=width*.853,flameY=signHeight*1.43;
  if(age>1.2&&age<3.1){const count=age<1.55?5:2;for(let i=0;i<count&&particles.length<72;i++)particles.push({x:flameX+(random()-.5)*width*.035,y:flameY,vx:(random()-.5)*signHeight*.24,vy:-(.48+random()*.55)*signHeight,r:signHeight*(.055+random()*.065),life:0,ttl:.45+random()*.55,c:Math.floor(random()*colors.length),w:random()*6.3});}
  context.clearRect(0,0,width,height);context.globalCompositeOperation='lighter';
  particles=particles.filter(p=>{p.life+=dt;const t=p.life/p.ttl;if(t>=1)return false;p.x+=(p.vx+Math.sin(p.w+p.life*9)*signHeight*.05)*dt;p.y+=p.vy*dt;const r=Math.max(.1,p.r*(1-t*.65));context.globalAlpha=(1-t)*.65;const g=context.createLinearGradient(p.x,p.y+r,p.x,p.y-r*2.1);g.addColorStop(0,colors[p.c]);g.addColorStop(1,'#F25A2500');context.fillStyle=g;const tip=p.x+Math.sin(p.w+p.life*8)*r*.35;context.beginPath();context.moveTo(p.x,p.y+r*.8);context.bezierCurveTo(p.x-r*.65,p.y+r*.1,p.x-r*.4,p.y-r*.7,tip,p.y-r*2.1);context.bezierCurveTo(p.x+r*.1,p.y-r*.7,p.x+r*.7,p.y+r*.3,p.x,p.y+r*.8);context.fill();return true;});
  context.globalAlpha=1;context.globalCompositeOperation='source-over';raf=requestAnimationFrame(frame);
 }
 function play(){stop();if(motion.matches||!context||document.hidden)return;size();start=0;last=0;seed=731;void hero.offsetWidth;hero.classList.add('ignition-playing');raf=requestAnimationFrame(frame);}
 button.addEventListener('click',play);
 motion.addEventListener('change',()=>{stop();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 new ResizeObserver(()=>{if(raf)size();}).observe(button);
 if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible)stop();},{threshold:.05}).observe(hero);
 if(context)play();
})();
