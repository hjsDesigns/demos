/* ============================================================
   PLATEAU JIU-JITSU — site.js (factory template, per-client fills)
   Nav toggle · live open/closed clock (Pacific) · scroll-reveal ·
   count-up numbers · contact form · THE WEEK BOARD (live class
   schedule) · THE PIECES (tap-a-piece signature).
   ============================================================ */

/* ------------------------------------------------------------
   HOURS CONFIG — class-derived (the gym is open when class is on).
   Source: live WellnessLiving schedule, 2026-09-04. Google's panel
   is WRONG (marks Monday closed) — do not copy from Google.
   Each day = a list of [open, close] windows in decimal 24h hours.
   null = closed. Saturday's occasional open mat is OFF-SITE at
   Combat Sport & Fitness, so it is NOT an open window here.
   ------------------------------------------------------------ */
var HOURS = {
  tz: 'America/Los_Angeles',
  days: {
    0: null,                                   // Sunday
    1: [[9, 10], [16.25, 19.5]],               // Monday    (Gi)
    2: [[9, 10], [16.25, 19.5]],               // Tuesday   (No-Gi)
    3: [[9, 10], [16.25, 19.5]],               // Wednesday (Gi)
    4: [[9, 10], [16.25, 19.5]],               // Thursday  (No-Gi)
    5: null,                                   // Friday
    6: null                                    // Saturday (open mat is at CSF, Enumclaw)
  }
};

/* THE WEEK BOARD — every class on the calendar, all taught by John.
   Times in decimal hours; source WellnessLiving 2026-09-04. */
var CLASSES = [
  { start: 9,     end: 10,    who: 'Adults',    mins: 60 },
  { start: 16.25, end: 16.92, who: 'Kids 5–7',  mins: 40 },
  { start: 17.17, end: 18.17, who: 'Kids 8–13', mins: 60 },
  { start: 18.25, end: 19.5,  who: 'Adults',    mins: 75 }
];
var CLASS_DAYS = { 1: 'Gi', 2: 'No-Gi', 3: 'Gi', 4: 'No-Gi' };

/* ------------------------------------------------------------
   CUSTOM CLOSE RULES — Labor Day 2026 is listed closed in WellnessLiving.
   ------------------------------------------------------------ */
function customClosure(p){
  if (p.y === 2026 && p.mo === 8 && p.d === 7) return 'Labor Day';
  return null;
}
function customClose(p, close){ return close; }


(function(){
  'use strict';
  document.documentElement.classList.add('js');
  var $=function(s,r){return (r||document).querySelector(s)};
  var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};

  /* ---------- mobile nav ---------- */
  var toggle=$('.nav-toggle'), nav=$('#main-nav');
  function setNav(open){nav.classList.toggle('open',open);toggle.setAttribute('aria-expanded',open?'true':'false');toggle.textContent=open?'✕':'☰'}
  if(toggle&&nav){
    toggle.addEventListener('click',function(e){e.stopPropagation();setNav(!nav.classList.contains('open'))});
    $$('#main-nav a').forEach(function(a){a.addEventListener('click',function(){setNav(false)})});
    document.addEventListener('click',function(e){if(nav.classList.contains('open')&&!nav.contains(e.target)&&e.target!==toggle)setNav(false)});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&nav.classList.contains('open')){setNav(false);toggle.focus()}});
  }
  var y=$('#year'); if(y) y.textContent=new Date().getFullYear();

  /* ---------- Pacific time, wherever the viewer is ---------- */
  // Pitch/demo switch: ?demo=17.5 (hour, Pacific) [&day=1-6] [&date=YYYY-MM-DD]
  var DEMO=(function(){try{var q=new URLSearchParams(location.search);if(!q.has('demo'))return null;
    var h=parseFloat(q.get('demo'));var d=parseInt(q.get('day')||'3',10);if(isNaN(h))return null;var o={day:d,h:h,y:2026,mo:8,d:9};
    var ds=q.get('date');if(ds&&/^\d{4}-\d{2}-\d{2}$/.test(ds)){var dt=new Date(ds+'T12:00:00');o.y=dt.getFullYear();o.mo=dt.getMonth();o.d=dt.getDate();o.day=dt.getDay()}
    return o}catch(e){return null}})();
  function pacificNow(){
    if(DEMO) return DEMO;
    var parts=new Intl.DateTimeFormat('en-US',{timeZone:HOURS.tz,weekday:'short',year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',hour12:false}).formatToParts(new Date());
    var o={};parts.forEach(function(p){o[p.type]=p.value});
    var days={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
    var h=parseInt(o.hour,10)%24, m=parseInt(o.minute,10);
    return {day:days[o.weekday], h:h+m/60, y:parseInt(o.year,10), mo:parseInt(o.month,10)-1, d:parseInt(o.day,10)};
  }
  function fmt(h){h=h%24;var ap=h>=12?'pm':'am';var hh=Math.floor(h)%12;if(hh===0)hh=12;var mm=Math.round((h%1)*60);if(mm===60){mm=0;hh=(hh%12)+1}return hh+(mm?':'+(mm<10?'0':'')+mm:'')+' '+ap}
  function dayName(d){return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d]}
  function windowsFor(day){var w=HOURS.days[day];if(!w)return null;return (typeof w[0]==='number')?[w]:w}

  /* Multi-window status: inside a window → open; between windows → "back at"; before → "opens"; after → next day. */
  function computeStatus(){
    var p=pacificNow(), d=p.day, h=p.h;
    var closure=customClosure(p);
    if(closure) return {open:false,text:'Closed today for '+closure};
    var today=windowsFor(d);
    if(today){
      for(var i=0;i<today.length;i++){
        var w=today[i], close=customClose(p,w[1]);
        if(h>=w[0]&&h<close) return {open:true,text:'Open now · til '+fmt(close),soon:(close-h)<=0.5};
        if(h<w[0]) return {open:false,text:(i===0?'Opens today at ':'Back at ')+fmt(w[0])};
      }
    }
    for(var k=1;k<=7;k++){
      var nd=(d+k)%7, nw=windowsFor(nd);
      if(nw){var label=k===1?'tomorrow':dayName(nd);return {open:false,text:'Closed · opens '+label+' at '+fmt(nw[0][0])}}
    }
    return {open:false,text:'Closed'};
  }
  function applyStatus(){
    var s=computeStatus(), p=pacificNow();
    var hp=$('#hdrLive'), ht=$('#hdrLiveText');
    if(hp&&ht){hp.className='hdr-live '+(s.open?'is-open':'is-closed');ht.innerHTML=(s.open?'Open':'Closed')+' <span class="txt-long">· '+s.text.replace(/^Open now · /,'').replace(/^Closed · /,'')+'</span>';}
    var sl=$('#statusLine'), st=$('#statusText');
    if(sl&&st){sl.className='live-line '+(s.open?'is-open':'is-closed');st.textContent=s.text;}
    $$('#hoursList li[data-days]').forEach(function(li){li.classList.toggle('today',li.getAttribute('data-days').split(',').indexOf(String(p.day))>-1)});
    applyBoard(p);
  }

  /* ---------- THE WEEK BOARD (live) ----------
     Today's column lights up. The class running right now says "On the mat now";
     the next one today says "Next up". Done classes dim. Fri/Sat/Sun: nothing lit,
     the whole board points at the next class day. */
  function applyBoard(p){
    var cols=$$('.week-col'); if(!cols.length) return;
    var closure=customClosure(p);
    cols.forEach(function(col){
      var d=parseInt(col.getAttribute('data-day'),10);
      var isToday=(d===p.day);
      col.classList.toggle('today',isToday);
      var rows=$$('.wk-row',col), nextMarked=false;
      rows.forEach(function(r){
        var s=parseFloat(r.getAttribute('data-start')), e=parseFloat(r.getAttribute('data-end'));
        r.classList.remove('now','next','done');
        var tag=$('.wk-tag',r); if(tag) tag.textContent='';
        if(!isToday||closure) return;
        if(p.h>=s&&p.h<e){r.classList.add('now'); if(tag) tag.textContent='On the mat now';}
        else if(p.h>=e){r.classList.add('done');}
        else if(!nextMarked){r.classList.add('next'); nextMarked=true; if(tag) tag.textContent='Next up';}
      });
    });
    var note=$('#weekNote');
    if(note){
      if(closure){note.textContent='Closed today for '+closure+'.';}
      else if(CLASS_DAYS[p.day]){note.textContent='Today is a '+CLASS_DAYS[p.day]+' day.';}
      else {
        var k=1; while(!CLASS_DAYS[(p.day+k)%7]) k++;
        var nd=(p.day+k)%7;
        note.textContent='No classes today. Back on the mat '+(k===1?'tomorrow':dayName(nd))+' at 9 am — a '+CLASS_DAYS[nd]+' day.';
      }
    }
  }

  /* ---------- THE FILM: plays once over the reel; near its end it contracts into the mark's box and hardens to grey;
     then the mark takes over (.is-film-done drives every later beat). Blocked autoplay / reduced motion / errors
     hand off immediately so the mark always arrives. ---------- */
  var film=$('#film'), stageEl=$('.stage'), heroF=$('#hero');
  if(film&&heroF&&stageEl){
    /* where the five real pieces sit in the film's last frame (fractions of the frame), measured 2026-09-21 */
    var REAL={"pawn": [0.171, 0.448, 0.083, 0.269], "knight": [0.3094, 0.4006, 0.0828, 0.3137], "king": [0.4516, 0.2521, 0.0969, 0.472], "bishop": [0.6, 0.347, 0.092, 0.368], "rook": [0.733, 0.423, 0.1, 0.292]};
    var fReduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches, handed=false, settled=false;
    function frameRect(){ var hr=heroF.getBoundingClientRect(), contain=window.matchMedia('(max-width:760px)').matches, ar=16/9;
      var rw=contain?Math.min(hr.width,hr.height*ar):Math.max(hr.width,hr.height*ar), rh=rw/ar;
      return {x:hr.left+(hr.width-rw)/2, y:hr.top+(hr.height-rh)/2, w:rw, h:rh}; }
    function overlay(){ /* put every vector piece exactly on its real twin: same height, same bottom-centre */
      var fr=frameRect(), sr=stageEl.getBoundingClientRect();
      Object.keys(REAL).forEach(function(n){ var el=$('.st-piece.p-'+n,stageEl); if(!el) return; var b=REAL[n];
        var bx=fr.x+b[0]*fr.w, by=fr.y+b[1]*fr.h, bw=b[2]*fr.w, bh=b[3]*fr.h;
        var nx=sr.left+el.offsetLeft, ny=sr.top+el.offsetTop, nw=el.offsetWidth, nh=el.offsetHeight;
        var k=bh/nh, dx=(bx+bw/2)-(nx+nw*k/2), dy=(by+bh)-(ny+nh*k);
        el.style.transition='none'; el.style.transformOrigin='0 0';
        el.style.transform='translate('+dx.toFixed(2)+'px,'+dy.toFixed(2)+'px) scale('+k.toFixed(4)+')';
        void el.offsetWidth; el.style.transition='opacity .9s cubic-bezier(.4,0,.2,1)'; el.style.opacity='1'; });
    }
    function settle(){ if(settled) return; settled=true;
      $$('.st-piece',stageEl).forEach(function(el){ el.style.transition='transform .8s cubic-bezier(.4,0,.2,1)'; el.style.transform='none'; });
      heroF.classList.add('is-settled'); }
    function handoff(){ if(handed) return; handed=true;
      if(fReduce){ heroF.classList.add('is-film-done','is-settled'); return; }
      overlay(); heroF.classList.add('is-film-done'); film.classList.add('is-gone'); if(window.__startReel) window.__startReel();
      setTimeout(settle,950); }
    if(fReduce){ handoff(); }
    else{
      film.muted=true; film.defaultMuted=true; film.playsInline=true;
      film.addEventListener('playing',function(){film.classList.add('is-playing')},{once:true});
      film.addEventListener('timeupdate',function(){ if(film.duration&&film.currentTime>=film.duration-0.95) handoff(); });
      film.addEventListener('ended',handoff,{once:true});
      film.addEventListener('error',handoff,{once:true});
      var fp=film.play(); if(fp&&fp.catch) fp.catch(handoff);
      setTimeout(function(){ if(film.paused&&!handed) handoff(); },2500);
    }
  }

  /* ---------- THE WEEK, LIVE: progress bar on the running class + the one-line "where the week is" readout ---------- */
  function trackNow(){
    var p=pacificNow(), line=$('#weekNow'); if(!line) return;
    var now=$('.wk-row.now'), nxt=$('.week-col.today .wk-row.next');
    $$('.wk-row').forEach(function(r){r.style.removeProperty('--pct');r.querySelector('.wk-tag').removeAttribute('data-left')});
    if(now){
      var s0=parseFloat(now.getAttribute('data-start')), e0=parseFloat(now.getAttribute('data-end'));
      var pct=Math.max(0,Math.min(100,(p.h-s0)/(e0-s0)*100)), left=Math.max(1,Math.round((e0-p.h)*60));
      now.style.setProperty('--pct',pct.toFixed(1)+'%'); now.querySelector('.wk-tag').setAttribute('data-left',left+' min left');
      line.className='week-now is-on'; line.textContent='Right now · '+$('.wk-who',now).textContent+' on the mat · '+left+' min left';
    } else if(nxt){
      line.className='week-now'; line.textContent='Next up · '+$('.wk-time',nxt).textContent+' '+$('.wk-who',nxt).textContent+' · '+(CLASS_DAYS[p.day]||'');
    } else {
      var k=1; while(!CLASS_DAYS[(p.day+k)%7]) k++; var nd=(p.day+k)%7;
      line.className='week-now'; line.textContent='No classes right now · back '+(k===1?'tomorrow':dayName(nd))+' at 9 am · '+CLASS_DAYS[nd];
    }
  }
  applyStatus(); trackNow(); setInterval(function(){applyStatus();trackNow()},30000);

  /* ---------- program cards: hover (or focus) plays the clip; on phones it plays when the card is opened ---------- */
  $$('.program').forEach(function(card){
    var v=$('video',card); if(!v) return;
    function play(){ v.play().catch(function(){}); }
    function stop(){ v.pause(); }
    card.addEventListener('mouseenter',play); card.addEventListener('mouseleave',stop);
    card.addEventListener('focusin',play); card.addEventListener('focusout',stop);
    card.addEventListener('toggle',function(){ card.open?play():stop(); });
  });

  /* ---------- THE SETUP hero: the ground is their own footage, pre-blurred, plays ONCE and holds on its last
     frame (never loops). Poster = the final frame unless the film will actually play. Reduced motion / save-data /
     blocked autoplay all land on the final frame. The mark sequence itself is pure CSS keyframes. ---------- */
  var ground=$('#ground'), hero=$('#hero');
  if(ground&&hero){
    var reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    var saveData=!!(navigator.connection&&navigator.connection.saveData);
    var phone=window.matchMedia('(max-width:760px)').matches;
    var src=phone?ground.getAttribute('data-phone'):ground.getAttribute('data-desktop');
    var endPoster=phone?ground.getAttribute('data-phone-poster'):ground.getAttribute('poster');
    var startPoster=phone?ground.getAttribute('data-phone-opening'):ground.getAttribute('data-opening-poster');
    function groundDone(){hero.classList.add('is-done')}
    ground.poster=endPoster;
    if(!reduce&&!saveData){
      ground.poster=startPoster; ground.muted=true; ground.defaultMuted=true; ground.playsInline=true;
      ground.src=src; ground.load();
      ground.addEventListener('playing',function(){hero.classList.add('is-playing')},{once:true});
      window.__startReel=function(){ground.play().catch(function(){})};
      ground.addEventListener('playing',groundDone,{once:true});
      ground.addEventListener('error',function(){ground.poster=endPoster;groundDone()},{once:true});
      if(!$('#film')){ var pr=ground.play(); if(pr&&pr.catch) pr.catch(function(){ground.poster=endPoster;groundDone()}); }
      document.addEventListener('visibilitychange',function(){if(document.hidden)ground.pause();else ground.play().catch(function(){})});
      var reels=$$('.band-reel');reels.forEach(function(v){v.muted=true;v.play().catch(function(){})});
    } else groundDone();
  }

  window.__site={pacificNow:pacificNow,computeStatus:computeStatus,HOURS:HOURS,CLASSES:CLASSES};

  /* ---------- scroll-reveal + count-up ---------- */
  // Reveal a photo only once its pixels are ready. Cached images and slow lazy loads
  // share the same fade; an image error still releases its caption and alt text.
  function photoReady(img){
    return new Promise(function(resolve){
      function loaded(){
        img.removeEventListener('load',loaded);img.removeEventListener('error',loaded);
        if(img.naturalWidth&&typeof img.decode==='function')img.decode().catch(function(){}).then(resolve);
        else resolve();
      }
      if(img.complete){loaded();return;}
      img.addEventListener('load',loaded,{once:true});img.addEventListener('error',loaded,{once:true});
      img.loading='eager';
    });
  }
  function enterReveal(el){
    el.classList.add('in');
    $$('.count',el).forEach(function(c){
      if(c.dataset.done)return;c.dataset.done='1';
      var to=parseInt(c.getAttribute('data-to'),10),from=parseInt(c.getAttribute('data-from')||'0',10),t0=null;
      if(window.matchMedia('(prefers-reduced-motion:reduce)').matches){c.textContent=to;return;}
      function step(ts){if(!t0)t0=ts;var k=Math.min(1,(ts-t0)/1400);var e=1-Math.pow(1-k,3);c.textContent=Math.round(from+(to-from)*e);if(k<1)requestAnimationFrame(step);}
      requestAnimationFrame(step);
    });
  }
  function revealWhenReady(el){
    if(el.dataset.revealPending)return;el.dataset.revealPending='1';
    if(!el.classList.contains('photo-reveal')||window.matchMedia('(prefers-reduced-motion:reduce)').matches){enterReveal(el);return;}
    Promise.all($$('img',el).map(photoReady)).then(function(){requestAnimationFrame(function(){enterReveal(el);});});
  }
  var reveals=$$('.reveal');
  reveals.forEach(function(el){if(el.matches('.storefront,.print,.door'))el.classList.add('photo-reveal');});
  if(typeof IntersectionObserver==='function'){
    var io=new IntersectionObserver(function(entries){entries.forEach(function(en){if(!en.isIntersecting)return;io.unobserve(en.target);revealWhenReady(en.target);});},{threshold:.06,rootMargin:'0px 0px -6% 0px'});
    reveals.forEach(function(el){io.observe(el);});
  }else{reveals.forEach(enterReveal);}

  /* ---------- contact form (demo mode until go-live fills access_key) ---------- */
  var form=$('.contact-form'), ok=$('.form-success');
  if(form&&ok){form.addEventListener('submit',function(e){
    e.preventDefault();
    var btn=form.querySelector('button[type=submit]'), keyEl=form.querySelector('[name=access_key]'), key=keyEl?keyEl.value.trim():'';
    function done(){ok.classList.add('show');ok.setAttribute('role','status');btn.disabled=true}
    if(!key){done();return}
    var label=btn.textContent; btn.disabled=true; btn.textContent='Sending…';
    var data={}; new FormData(form).forEach(function(v,k){data[k]=v});
    data.subject=data.subject||('New message from your website ('+document.title+')');
    fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)})
      .then(function(r){return r.json()}).then(function(j){if(j&&j.success){done()}else{throw new Error('send failed')}})
      .catch(function(){btn.disabled=false;btn.textContent=label;ok.textContent='Couldn’t send just now — call or text us instead.';ok.classList.add('show');ok.setAttribute('role','alert')});
  })}

  /* ---------- SIGNATURE: THE PIECES ----------
     Their own logo, cut into its five real pieces. One tap: the piece lifts and
     lights, and its line appears in the panel ABOVE the board. Tap again (or tap
     another) to clear/switch. No modes, no numbers to type, nothing to win. */
  var board=$('#pieceBoard'), pieces=$$('.piece',board), out=$('#pieceOut');
  if(board&&pieces.length&&out){
    var title=$('.po-title',out), line=$('.po-line',out), hint=$('.po-hint',out);
    var stagger=0;
    function clearAll(){pieces.forEach(function(b){b.classList.remove('up');b.setAttribute('aria-pressed','false')});out.classList.remove('has');board.classList.remove('picked')}
    function pick(btn){
      var on=btn.classList.contains('up');
      clearAll();
      if(on) return;
      btn.classList.add('up'); btn.setAttribute('aria-pressed','true'); board.classList.add('picked');
      title.textContent=btn.getAttribute('data-title'); line.textContent=btn.getAttribute('data-line');
      out.style.setProperty('--pc',btn.getAttribute('data-color')); out.classList.add('has');
    }
    pieces.forEach(function(b,i){
      b.style.setProperty('--i',i);
      b.addEventListener('click',function(){pick(b)});
    });
    // pieces rise onto the board once, when the section scrolls in (their mark, animated)
    var pio=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){board.classList.add('set');pio.disconnect()}})},{threshold:.35});
    pio.observe(board);
  }


  /* ---------- reviews ribbon: pure CSS marquee; a finger on it pauses it (hover pauses via CSS) ---------- */
  var track=$('#rvTrack');
  if(track){
    track.addEventListener('touchstart',function(){track.classList.add('is-held')},{passive:true});
    track.addEventListener('touchend',function(){setTimeout(function(){track.classList.remove('is-held')},1200)},{passive:true});
  }

  /* ---------- the cursor: dot follows exactly, ring lags; grows over anything tappable; the big buttons pull toward it.
     Desktop pointers only — touch devices never see it. ---------- */
  var dot=$('.cur-dot'), ring=$('.cur-ring');
  if(dot&&ring&&window.matchMedia('(pointer:fine)').matches&&!window.matchMedia('(prefers-reduced-motion:reduce)').matches){
    document.documentElement.classList.add('cur');
    var mx=-100,my=-100,rx=-100,ry=-100,shown=false;
    document.addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;if(!shown){shown=true;document.body.classList.remove('cur-hidden')}dot.style.transform='translate('+mx+'px,'+my+'px) translate(-50%,-50%)'},{passive:true});
    document.addEventListener('mouseleave',function(){document.body.classList.add('cur-hidden')});
    document.addEventListener('mousedown',function(){ring.classList.add('is-down')});document.addEventListener('mouseup',function(){ring.classList.remove('is-down')});
    (function loop(){rx+=(mx-rx)*.18;ry+=(my-ry)*.18;ring.style.transform='translate('+rx+'px,'+ry+'px) translate(-50%,-50%)';requestAnimationFrame(loop)})();
    document.addEventListener('mouseover',function(e){ring.classList.toggle('is-over',!!e.target.closest('a,button,summary,label,.rv-card,.program,.week-col'))});
    $$('.hero-actions .btn,.cta-actions .btn').forEach(function(b){
      b.addEventListener('mousemove',function(e){var r=b.getBoundingClientRect();var dx=(e.clientX-(r.left+r.width/2))/r.width,dy=(e.clientY-(r.top+r.height/2))/r.height;b.style.transform='translate('+(dx*10)+'px,'+(dy*8)+'px)'});
      b.addEventListener('mouseleave',function(){b.style.transform=''});
    });
  }

})();
