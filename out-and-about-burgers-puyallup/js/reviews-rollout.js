/* Continuous review ribbon. One genuine source set plus an inert visual repeat. */
(function(){
 const section=document.querySelector('#reviews'),track=section&&section.querySelector('.rr-track');if(!track)return;
 const cards=Array.from(track.children),controls=section.querySelector('.rr-controls'),pause=section.querySelector('[data-rr-pause]'),reduce=matchMedia('(prefers-reduced-motion:reduce)');
 const group=document.createElement('div');group.className='rr-group';cards.forEach(c=>group.appendChild(c));track.appendChild(group);
 const repeat=group.cloneNode(true);repeat.classList.add('rr-repeat');repeat.setAttribute('aria-hidden','true');repeat.setAttribute('inert','');repeat.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));track.appendChild(repeat);
 track.setAttribute('aria-label','Google reviews. Pause to read or swipe through them.');track.removeAttribute('aria-roledescription');controls.hidden=false;
 let userPaused=false,hover=false,focus=false,visible=false,position=0,last=0,span=0;
 function measure(){span=group.getBoundingClientRect().width;if(span){position=track.scrollLeft%span;track.scrollLeft=position}}
 function isPaused(){return userPaused||hover||focus||reduce.matches||!visible||document.hidden}
 function label(){pause.textContent=reduce.matches?'Motion off':userPaused?'Play reviews':'Pause reviews';pause.disabled=reduce.matches;pause.setAttribute('aria-label',reduce.matches?'Automatic motion disabled by your reduced motion preference':pause.textContent);pause.setAttribute('aria-pressed',String(userPaused));track.classList.toggle('rr-reduced',reduce.matches)}
 pause.addEventListener('click',()=>{userPaused=!userPaused;position=track.scrollLeft;label()});
 track.addEventListener('pointerdown',()=>{userPaused=true;position=track.scrollLeft;label()},{passive:true});
 track.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)>0){userPaused=true;position=track.scrollLeft;label()}},{passive:true});
 track.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();userPaused=true;label();let target=track.scrollLeft+(e.key==='ArrowRight'?180:-180);if(e.key==='Home')target=0;if(e.key==='End')target=span-track.clientWidth;track.scrollTo({left:Math.max(0,target),behavior:reduce.matches?'instant':'smooth'})});
 track.addEventListener('scroll',()=>{if(isPaused())position=track.scrollLeft},{passive:true});
 track.addEventListener('mouseenter',()=>hover=true);track.addEventListener('mouseleave',()=>{hover=false;position=track.scrollLeft});
 section.addEventListener('focusin',()=>focus=true);section.addEventListener('focusout',()=>setTimeout(()=>{focus=section.contains(document.activeElement);position=track.scrollLeft},0));
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting},{threshold:.15}).observe(track);
 function frame(now){const delta=last?Math.min(now-last,64):0;last=now;if(!isPaused()&&span>0){position=(position+delta*.020)%span;track.scrollLeft=position}requestAnimationFrame(frame)}
 reduce.addEventListener('change',()=>{label();measure()});window.addEventListener('resize',measure);new ResizeObserver(measure).observe(group);label();measure();requestAnimationFrame(frame);
})();
