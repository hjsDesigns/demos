/* Continuous review ribbon. One genuine source set plus an inert visual repeat. */
(function(){
 const section=document.querySelector('#reviews'),track=section&&section.querySelector('.rr-track');if(!track)return;
 const cards=Array.from(track.children),controls=section.querySelector('.rr-controls'),pause=section.querySelector('[data-rr-pause]'),reduce=matchMedia('(prefers-reduced-motion:reduce)');
 const group=document.createElement('div');group.className='rr-group';cards.forEach(c=>group.appendChild(c));track.appendChild(group);
 const repeat=group.cloneNode(true);repeat.classList.add('rr-repeat');repeat.setAttribute('aria-hidden','true');repeat.setAttribute('inert','');repeat.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));track.appendChild(repeat);
 track.setAttribute('aria-label','Google reviews. Pause to read or swipe through them.');track.removeAttribute('aria-roledescription');controls.hidden=false;
 let speed=40; // REVIEW_SPEED_DEFAULT_PX_PER_SECOND
 let userPaused=false,motionOptIn=false,hover=false,focus=false,visible=false,position=0,last=0,span=0;
 function measure(){span=group.getBoundingClientRect().width;if(span){position=track.scrollLeft%span;track.scrollLeft=position}}
 function isPaused(){return userPaused||hover||focus||(reduce.matches&&!motionOptIn)||!visible||document.hidden}
 function label(){const preferencePaused=reduce.matches&&!motionOptIn;pause.textContent=(userPaused||preferencePaused)?'Play reviews':'Pause reviews';pause.disabled=false;pause.setAttribute('aria-label',preferencePaused?'Play reviews: enable motion for this ribbon':pause.textContent);pause.setAttribute('aria-pressed',String(userPaused||preferencePaused));track.classList.toggle('rr-reduced',preferencePaused)}
 pause.addEventListener('click',()=>{if(userPaused||(reduce.matches&&!motionOptIn)){userPaused=false;motionOptIn=true}else{userPaused=true}position=track.scrollLeft;label();measure()});
 track.addEventListener('pointerdown',()=>{userPaused=true;position=track.scrollLeft;label()},{passive:true});
 track.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)>0){userPaused=true;position=track.scrollLeft;label()}},{passive:true});
 track.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();userPaused=true;label();let target=track.scrollLeft+(e.key==='ArrowRight'?180:-180);if(e.key==='Home')target=0;if(e.key==='End')target=span-track.clientWidth;track.scrollTo({left:Math.max(0,target),behavior:reduce.matches?'instant':'smooth'})});
 track.addEventListener('scroll',()=>{if(isPaused())position=track.scrollLeft},{passive:true});
 track.addEventListener('mouseenter',()=>hover=true);track.addEventListener('mouseleave',()=>{hover=false;position=track.scrollLeft});
 track.addEventListener('focusin',()=>focus=true);track.addEventListener('focusout',()=>setTimeout(()=>{focus=track.contains(document.activeElement);position=track.scrollLeft},0));
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting},{threshold:.15}).observe(track);
 function frame(now){const delta=last?Math.min(now-last,64):0;last=now;if(!isPaused()&&span>0){position=(position+delta*speed/1000)%span;track.scrollLeft=position}requestAnimationFrame(frame)}

 if(location.hostname==='127.0.0.1'&&new URLSearchParams(location.search).has('reviewSpeed')){
  const panel=document.createElement('div');panel.className='review-speed-editor';
  panel.style.cssText='margin:18px 0;padding:16px;border:1px solid currentColor;border-radius:12px;display:flex;flex-wrap:wrap;gap:10px;align-items:center';
  panel.innerHTML='<strong style="width:100%">Review speed · preview controls</strong><button type="button" data-slower aria-label="Slower reviews">− Slower</button><output aria-live="polite"></output><button type="button" data-faster aria-label="Faster reviews">Faster +</button><input aria-label="Review speed" type="range" min="5" max="60" step="5" style="width:100%"><button type="button" data-save>Save as default</button><small role="status" style="width:100%"></small>';
  panel.querySelectorAll('button').forEach(button=>button.style.cssText='min-height:44px;padding:10px 14px;border:1px solid currentColor;border-radius:22px;background:transparent;color:inherit;font:inherit;cursor:pointer');
  controls.after(panel);
  const slider=panel.querySelector('input'),output=panel.querySelector('output'),status=panel.querySelector('small'),save=panel.querySelector('[data-save]');
  function show(){slider.value=speed;output.textContent=(speed/20).toFixed(2).replace(/0$/,'')+'×';}
  function change(value){speed=Math.max(5,Math.min(60,Number(value)));userPaused=false;motionOptIn=true;label();show();status.textContent='Previewing — save when this pace feels right.';}
  panel.querySelector('[data-slower]').onclick=()=>change(speed-5);
  panel.querySelector('[data-faster]').onclick=()=>change(speed+5);
  slider.oninput=()=>change(slider.value);
  save.onclick=async()=>{save.disabled=true;status.textContent='Saving…';try{const r=await fetch('/api/review-speed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({speed})});const result=await r.json();if(!r.ok)throw Error(result.error||'Save failed');status.textContent='Saved. This is the default pace for future builds.';}catch(e){status.textContent='Not saved: '+e.message;}finally{save.disabled=false}};
  show();
 }
 reduce.addEventListener('change',()=>{label();measure()});window.addEventListener('resize',measure);new ResizeObserver(measure).observe(group);label();measure();requestAnimationFrame(frame);
})();
