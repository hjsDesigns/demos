/* Same CapCut footage, native speed, fixed registration and opacity only. */
(function(){
  'use strict';
  var hero=document.querySelector('#hero[data-hero="capcut"]');if(!hero)return;
  var film=hero.querySelector('#film'),scene=hero.querySelector('.film-scene');
  var stage=hero.querySelector('.stage'),mark=stage.querySelector('.stationary-mark');
  var reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  var done=false,started=false,backgroundStarted=false,raf=0,timer=0,resizeFrame=0;
  var clamp=function(x){return Math.max(0,Math.min(1,x))};
  var ease=function(x){x=clamp(x);return x*x*(3-2*x)};
  // Best fixed uniform fit of the endpoint to the intact logo. Playback never changes it.
  function register(){
    var sr=stage.getBoundingClientRect(),hr=scene.getBoundingClientRect();
    var width=sr.width*1.09337,height=width*2560/1440;
    film.style.left=(sr.left-hr.left-sr.width*.01102)+'px';
    film.style.top=(sr.top-hr.top-sr.height*.59829)+'px';
    film.style.width=width+'px';film.style.height=height+'px';
    hero.dataset.registration='fixed';
  }
  function startBackground(){
    if(backgroundStarted||reduced||!window.__startReel)return;
    backgroundStarted=true;window.__startReel();
  }
  function finish(){
    if(done)return;done=true;clearTimeout(timer);cancelAnimationFrame(raf);
    scene.style.opacity='0';scene.style.visibility='hidden';mark.style.opacity='1';
    hero.style.setProperty('--hero-dissolve','1');
    hero.dataset.morphProgress='1';hero.classList.add('is-film-done','is-bg','is-settled');
    film.pause();startBackground();
  }
  function draw(){
    if(done)return;
    var end=Math.min((film.duration||5.233333)-1/30,5.2);
    var start=end-1.15,p=clamp((film.currentTime-start)/(end-start)),d=ease(p);
    if(film.currentTime>2.9)startBackground();
    if(p>0){
      if(!hero.classList.contains('is-morphing')){
        hero.classList.add('is-film-done','is-bg','is-morphing');
        hero.dataset.morphStartPlaying=String(!film.paused&&!film.ended);
        hero.dataset.morphStartTime=film.currentTime.toFixed(3);
      }
      mark.style.opacity=String(d);scene.style.opacity=String(1-d);
      hero.style.setProperty('--hero-dissolve',String(d));
      hero.dataset.morphProgress=p.toFixed(3);
    }
    if(p>=1)finish();else raf=requestAnimationFrame(draw);
  }
  function resize(){cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(register)}
  film.addEventListener('loadedmetadata',register);
  if(window.ResizeObserver){var observer=new ResizeObserver(resize);observer.observe(hero);observer.observe(stage)}
  else window.addEventListener('resize',resize);
  film.addEventListener('playing',function(){
    if(done){film.pause();return}
    started=true;clearTimeout(timer);hero.classList.add('is-playing','capcut-ready');
    cancelAnimationFrame(raf);draw();
  });
  film.addEventListener('ended',finish,{once:true});film.addEventListener('error',finish,{once:true});
  document.addEventListener('visibilitychange',function(){
    if(document.hidden){film.pause();cancelAnimationFrame(raf)}else if(!done&&started)film.play().catch(finish);
  });
  film.playbackRate=1;film.muted=true;
  // Resolve typography before playback so the logo cannot drift while fonts arrive.
  var fonts=document.fonts?Promise.race([document.fonts.ready,new Promise(function(r){setTimeout(r,1600)})]):Promise.resolve();
  fonts.then(function(){
    register();if(reduced){finish();return}
    timer=setTimeout(function(){if(!started)finish()},8000);
    film.play().catch(finish);
  });
})();
