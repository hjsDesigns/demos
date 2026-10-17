/* A silent, locked-camera cinemagraph: flowing falls, pool and creek; faint mist and gentle fern movement. */
(()=>{
 const hero=document.querySelector('#hero'),video=hero?.querySelector('video.hero-motion'),button=hero?.querySelector('.hero-motion-toggle');
 if(!hero||!video||!button)return;
 const speed=document.querySelector('[data-hero-speed]'),speedLabel=document.querySelector('[data-hero-speed-label]');
 const speedKey='hjs-hidden-falls-review-speed';
 function applySpeed(value,save=false){
  const parsed=Number(value),rate=Number.isFinite(parsed)?Math.min(1.25,Math.max(.25,parsed)):.75;
  video.defaultPlaybackRate=rate;video.playbackRate=rate;
  if(speed)speed.value=String(rate);
  if(speedLabel)speedLabel.textContent=Math.round(rate*100)+'%';
  if(save&&speed){try{localStorage.setItem(speedKey,String(rate));}catch(e){}}
 }
 let startingSpeed=.75;
 if(speed){try{const saved=localStorage.getItem(speedKey);if(saved!==null)startingSpeed=Number(saved);}catch(e){}}
 applySpeed(startingSpeed);
 speed?.addEventListener('input',()=>applySpeed(speed.value,true));
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let visible=true,paused=false,userEnabled=false,blocked=false,failed=false;
 video.muted=true;video.defaultMuted=true;video.playsInline=true;video.autoplay=!reduced.matches;
 function label(){
  const ready=video.readyState>=2;
  button.hidden=failed;button.disabled=!ready;
  button.textContent=!ready?'Loading background…':!video.paused?'Pause background':'Play background';
  button.setAttribute('aria-pressed',String(video.paused));
  hero.dataset.motion=failed?'still':!ready?'loading':!video.paused?'playing':blocked?'needs-play':reduced.matches&&!userEnabled?'reduced':paused?'paused':'idle';
  video.classList.toggle('is-ready',ready&&!failed&&(!reduced.matches||userEnabled));
 }
 function update(){
  const play=!failed&&!paused&&visible&&!document.hidden&&(!reduced.matches||userEnabled);
  if(play&&video.paused){const promise=video.play();if(promise)promise.then(()=>{blocked=false;label();}).catch(()=>{blocked=true;label();});}
  else if(!play&&!video.paused)video.pause();
  label();
 }
 button.addEventListener('click',()=>{if(video.paused){paused=false;userEnabled=true;blocked=false;}else paused=true;update();});
 for(const event of ['loadeddata','canplay','playing','pause'])video.addEventListener(event,()=>{label();if(event==='loadeddata')update();});
 video.addEventListener('error',()=>{failed=true;video.pause();label();});
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update();},{threshold:.02}).observe(hero);
 document.addEventListener('visibilitychange',update);
 reduced.addEventListener('change',()=>{userEnabled=false;video.autoplay=!reduced.matches;update();});
 update();
})();
