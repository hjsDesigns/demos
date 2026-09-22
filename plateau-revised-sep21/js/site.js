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
  { start: 16.25, end: 16 + 55/60, who: 'Kids 5–7',  mins: 40 },
  { start: 17 + 10/60, end: 18 + 10/60, who: 'Kids 8–13', mins: 60 },
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

  function nextScheduledClass(p){
    for(var offset=0;offset<=7;offset++){
      var day=(p.day+offset)%7;
      var date=new Date(p.y,p.mo,p.d+offset,12);
      var candidate={day:day,y:date.getFullYear(),mo:date.getMonth(),d:date.getDate()};
      if(!CLASS_DAYS[day]||customClosure(candidate)) continue;
      for(var i=0;i<CLASSES.length;i++){
        if(offset===0&&CLASSES[i].start<=p.h) continue;
        return {day:day,index:i,start:CLASSES[i].start,who:CLASSES[i].who,daysAway:offset};
      }
    }
    return null;
  }

  /* One current class and one next class, including the next teaching day. */
  function applyBoard(p){
    var cols=$$('.week-col'); if(!cols.length) return;
    var closure=customClosure(p), next=nextScheduledClass(p);
    cols.forEach(function(col){
      var d=parseInt(col.getAttribute('data-day'),10);
      var isToday=(d===p.day);
      col.classList.toggle('today',isToday);
      var rows=$$('.wk-row',col);
      rows.forEach(function(r,index){
        var entry=CLASSES[index];
        var s=entry?entry.start:parseFloat(r.getAttribute('data-start')), e=entry?entry.end:parseFloat(r.getAttribute('data-end'));
        r.classList.remove('now','next','done');
        var tag=$('.wk-tag',r); if(tag) tag.textContent='';
        if(isToday&&!closure){
          if(p.h>=s&&p.h<e){r.classList.add('now'); if(tag) tag.textContent='On the mat now';}
          else if(p.h>=e){r.classList.add('done');}
        }
        if(next&&next.day===d&&next.index===index){r.classList.add('next');if(tag) tag.textContent='Next up';}
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

  /* Motion → motion: the logo takes shape DURING the final camera movement.
     Media time drives the overlap, so there is no frozen frame before the handoff. */
  var film=$('#film'), heroF=$('#hero'), stageEl=$('.stage');
  if(film&&heroF&&stageEl&&heroF.getAttribute('data-hero')!=='capcut'){
    var requestedTransition=new URLSearchParams(location.search).get('transition');
    var transitionOptions=window.PLATEAU_TRANSITIONS||[];
    var treatment=transitionOptions.filter(function(o){return o.id===requestedTransition})[0]||transitionOptions[0]||{id:'soft-melt',opacity:[.05,.68],move:[.35,1],mountain:[.05,.68],board:[.16,.86],fade:[.05,.82],rate:.8};
    heroF.setAttribute('data-transition',treatment.id);
    var REAL={pawn:[.1573,.4685,.0932,.2731],knight:[.2948,.4093,.1021,.3352],king:[.4359,.25,.1161,.4926],bishop:[.5885,.3639,.099,.3787],rook:[.724,.4352,.1063,.3102]};
    // Measured image bounds during the camera pullback (media seconds).
    var TRACK=[
      {t:3.2,b:{pawn:[.0479,.4139,.1276,.3648],knight:[.2255,.3315,.1365,.4463],king:[.4141,.125,.1526,.6519],bishop:[.6156,.2713,.1318,.5074],rook:[.7964,.3657,.1354,.412]}},
      {t:3.6,b:{pawn:[.0771,.4287,.1177,.3389],knight:[.2469,.35,.1271,.4213],king:[.4203,.1602,.1427,.6083],bishop:[.6078,.2954,.1229,.4722],rook:[.775,.384,.1354,.3833]}},
      {t:4.4,b:{pawn:[.1302,.4546,.101,.2963],knight:[.2786,.3889,.1063,.3639],king:[.4297,.2213,.1214,.5315],bishop:[.5938,.3398,.1036,.413],rook:[.7375,.4176,.1109,.3352]}},
      {t:5.04,b:REAL}
    ];
    var ALPHA={pawn:[0,163/600,355/374,437/600]};
    var fReduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    var morphing=false, finished=false, rendered=false, frame=null, resizeFrame=0, motionFrame=0, startupTimer;
    var backgroundReady=false, backgroundStarted=false, backgroundPromise, morphStart=3.2, morphEnd=4.96;
    var filmScene=$('.film-scene',heroF), mountainEl=$('.st-mountains',stageEl), boardEl=$('.st-board',stageEl);
    var filmPieces=Object.keys(REAL).map(function(name){return {name:name,el:$('.st-piece.p-'+name,stageEl)}}).filter(function(p){return p.el});
    function pieceWindow(name){
      if(treatment.order==='center'){var delay=name==='king'?0:(name==='knight'||name==='bishop'?.14:.29);return [delay,delay+.52]}
      if(treatment.order==='left'){var delay=['pawn','knight','king','bishop','rook'].indexOf(name)*.09;return [delay,delay+.56]}
      return treatment.opacity;
    }
    // One shared geometry clock: the ridge, board and every piece settle together.
    var geometryStart=Math.max(treatment.move[0],treatment.fade[0]+.82*(treatment.fade[1]-treatment.fade[0]),treatment.mountain[0]+.82*(treatment.mountain[1]-treatment.mountain[0]));
    filmPieces.forEach(function(p){var w=pieceWindow(p.name);geometryStart=Math.max(geometryStart,w[0]+.82*(w[1]-w[0]))});
    var geometryTime=morphStart+geometryStart*(morphEnd-morphStart);
    var settleRate=(morphEnd-geometryTime)/1.35;

    filmPieces.forEach(function(p){p.el.style.transform='none';p.el.style.transition='none'});
    function target(p){
      var el=p.el,w=el.offsetWidth,h=el.offsetHeight,alpha=ALPHA[p.name]||[0,0,1,1];
      var ratio=el.naturalWidth&&el.naturalHeight?Math.min(w/el.naturalWidth,h/el.naturalHeight):1;
      var iw=el.naturalWidth?el.naturalWidth*ratio:w,ih=el.naturalHeight?el.naturalHeight*ratio:h;
      return {x:el.offsetLeft+(w-iw)/2+alpha[0]*iw,y:el.offsetTop+(h-ih)/2+alpha[1]*ih,w:alpha[2]*iw,h:alpha[3]*ih,left:el.offsetLeft,top:el.offsetTop};
    }
    function frameFilm(){
      var sr=stageEl.getBoundingClientRect(),br=film.parentElement.getBoundingClientRect();
      var vw=film.videoWidth||1920,vh=film.videoHeight||1080,pairs=[];
      filmPieces.forEach(function(p){var r=REAL[p.name],t=p.target=target(p);
        pairs.push([[vw*(r[0]+r[2]/2),vh*r[1]],[t.x+t.w/2,t.y]],[[vw*(r[0]+r[2]/2),vh*(r[1]+r[3])],[t.x+t.w/2,t.y+t.h]]);
      });
      var pm=[0,0],qm=[0,0];pairs.forEach(function(v){for(var i=0;i<2;i++){pm[i]+=v[0][i]/pairs.length;qm[i]+=v[1][i]/pairs.length}});
      var num=0,den=0;pairs.forEach(function(v){for(var i=0;i<2;i++){var d=v[0][i]-pm[i];num+=d*(v[1][i]-qm[i]);den+=d*d}});
      var scale=den?num/den:1;frame={x:qm[0]-scale*pm[0],y:qm[1]-scale*pm[1],w:vw*scale,h:vh*scale,stageWidth:sr.width};
      film.style.left=(sr.left-br.left+frame.x)+'px';film.style.top=(sr.top-br.top+frame.y)+'px';film.style.width=frame.w+'px';film.style.height=frame.h+'px';
      heroF.classList.add('is-film-framed');
    }
    function scheduleFrame(){cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(frameFilm)}
    function prepareBackground(){
      if(backgroundStarted) return backgroundPromise;
      if(!window.__startReel) return Promise.resolve();
      backgroundStarted=true;
      backgroundPromise=Promise.resolve(window.__startReel()).then(function(){backgroundReady=true},function(){backgroundReady=true});
      return backgroundPromise;
    }
    function finalMark(){
      if(finished) return;finished=true;clearTimeout(startupTimer);cancelAnimationFrame(motionFrame);
      if(filmScene){filmScene.style.transition='none';filmScene.style.opacity='0'}
      filmPieces.forEach(function(p){p.el.style.transform='none';p.el.style.opacity='1'});
      if(mountainEl){mountainEl.src='images/pieces/board.png';mountainEl.style.transform='none';mountainEl.style.opacity='1';mountainEl.style.maskImage='none';mountainEl.style.webkitMaskImage='none'}
      if(boardEl){boardEl.style.opacity='1';boardEl.style.transform='none'}
      heroF.classList.add('is-film-done','is-settled','is-bg');heroF.setAttribute('data-morph-progress','1');
      // The source is stopped only after it is completely invisible.
      film.pause();
      if(!fReduce) prepareBackground();
    }
    function smooth(p){p=Math.max(0,Math.min(1,p));return p*p*(3-2*p)}
    function range(progress,window){return smooth((progress-window[0])/(window[1]-window[0]))}
    function sourceBox(name,time){
      var a=TRACK[0],b=TRACK[TRACK.length-1];
      for(var i=1;i<TRACK.length;i++){if(time<=TRACK[i].t){a=TRACK[i-1];b=TRACK[i];break}}
      var u=Math.max(0,Math.min(1,(time-a.t)/(b.t-a.t)));return a.b[name].map(function(v,j){return v+(b.b[name][j]-v)*u});
    }
    function drawMorph(time){
      var progress=Math.max(0,Math.min(1,(time-morphStart)/(morphEnd-morphStart))),blend=smooth((progress-geometryStart)/(1-geometryStart));
      if(!morphing){
        morphing=true;filmScene.style.transition='none';heroF.classList.add('is-film-done','is-bg','is-morphing');
        heroF.setAttribute('data-morph-start-time',time.toFixed(3));
        heroF.setAttribute('data-morph-start-playing',String(!film.paused&&!film.ended));
      }
      filmPieces.forEach(function(p){
        var t=p.target,r=sourceBox(p.name,time),scale=r[3]*frame.h/t.h;
        var pieceOpacity=range(progress,pieceWindow(p.name));
        var pieceBlend=blend;
        var dx=frame.x+(r[0]+r[2]/2)*frame.w-(t.left+(t.x-t.left+t.w/2)*scale);
        var dy=frame.y+(r[1]+r[3])*frame.h-(t.top+(t.y-t.top+t.h)*scale);
        p.el.style.transform='translate('+(dx*(1-pieceBlend))+'px,'+(dy*(1-pieceBlend))+'px) scale('+(scale+(1-scale)*pieceBlend)+')';
        p.el.style.opacity=String(pieceOpacity);
      });
      if(mountainEl){
        // Register the logo summit on Rainier, then open into the logo's ridge line.
        var peakX=frame.x+frame.w*.52,peakY=frame.y+frame.h*.072,logoPeakX=frame.stageWidth*(679/1400);
        var ms=frame.w/frame.stageWidth;
        mountainEl.style.transformOrigin='48.5% 0';
        mountainEl.style.transform='translate('+((peakX-logoPeakX)*(1-blend))+'px,'+(peakY*(1-blend))+'px) scale('+(ms+(1-ms)*blend)+')';
        mountainEl.style.opacity=String(range(progress,treatment.mountain));
        if(treatment.order==='left'){
          var edge=range(progress,treatment.mountain)*125;
          var reveal='linear-gradient(90deg,#000 '+(edge-12)+'%,transparent '+(edge+12)+'%)';
          mountainEl.style.maskImage=reveal;mountainEl.style.webkitMaskImage=reveal;
        }
      }
      if(boardEl){
        var stageHeight=frame.stageWidth*872/1400,boardTop=stageHeight*(565/872);
        var tx=frame.x+frame.w/2-frame.stageWidth/2,ty=frame.y+frame.h*.74-boardTop;
        var sx=frame.w/frame.stageWidth,sy=(frame.h*.25)/(stageHeight-boardTop);
        boardEl.style.transformOrigin='50% 64.7936%';
        boardEl.style.transform='translate('+(tx*(1-blend))+'px,'+(ty*(1-blend))+'px) scale('+(sx+(1-sx)*blend)+','+(sy+(1-sy)*blend)+')';
        boardEl.style.opacity=String(range(progress,treatment.board));
      }
      filmScene.style.opacity=String(1-range(progress,treatment.fade));
      heroF.setAttribute('data-morph-progress',progress.toFixed(3));
      if(progress>=1) finalMark();
    }
    function motionTick(){
      if(finished) return;
      var time=film.currentTime;prepareBackground();
      // A short speed ramp leaves moving frames available for the gradual overlap.
      var rate=1.15-(1.15-treatment.rate)*smooth((time-2.9)/.3);if(time>=geometryTime) rate=settleRate;
      if(Math.abs(film.playbackRate-rate)>.005) film.playbackRate=rate;
      if(time>=morphStart) drawMorph(time);
      if(!finished) motionFrame=requestAnimationFrame(motionTick);
    }
    film.addEventListener('loadedmetadata',frameFilm);
    filmPieces.forEach(function(p){p.el.addEventListener('load',scheduleFrame,{once:true})});
    if(window.ResizeObserver){var filmLayoutObserver=new ResizeObserver(scheduleFrame);filmLayoutObserver.observe(stageEl);filmLayoutObserver.observe(heroF)}
    else window.addEventListener('resize',scheduleFrame);
    frameFilm();if(document.fonts&&document.fonts.ready) document.fonts.ready.then(scheduleFrame);
    if(fReduce) finalMark();
    else{
      film.muted=true;film.defaultMuted=true;film.playsInline=true;film.playbackRate=1.15;
      film.addEventListener('playing',function(){
        if(finished){film.pause();return}rendered=true;clearTimeout(startupTimer);heroF.classList.add('is-playing');film.classList.add('is-playing');prepareBackground();
        cancelAnimationFrame(motionFrame);motionFrame=requestAnimationFrame(motionTick);
      });
      film.addEventListener('ended',finalMark,{once:true});film.addEventListener('error',finalMark,{once:true});
      startupTimer=setTimeout(function(){if(!rendered) finalMark()},10000);
      requestAnimationFrame(function(){
        // Decode the incoming motion first; never enter the morph halfway through.
        Promise.race([prepareBackground(),new Promise(function(resolve){setTimeout(resolve,1800)})]).then(function(){
          if(finished) return;var fp=film.play();if(fp&&fp.catch) fp.catch(finalMark);
        },finalMark);
      });
    }
  }

  /* ---------- THE WEEK, LIVE: progress bar on the running class + the one-line "where the week is" readout ---------- */
  function trackNow(){
    var p=pacificNow(), line=$('#weekNow'); if(!line) return;
    var now=$('.wk-row.now'), next=nextScheduledClass(p);
    $$('.wk-row').forEach(function(r){var tag=$('.wk-tag',r);r.style.removeProperty('--pct');if(tag)tag.removeAttribute('data-left')});
    if(now){
      var rowIndex=$$('.wk-row',now.parentElement).indexOf(now), entry=CLASSES[rowIndex];
      var s0=entry?entry.start:parseFloat(now.getAttribute('data-start')), e0=entry?entry.end:parseFloat(now.getAttribute('data-end'));
      var pct=Math.max(0,Math.min(100,(p.h-s0)/(e0-s0)*100)), left=Math.max(1,Math.round((e0-p.h)*60));
      now.style.setProperty('--pct',pct.toFixed(1)+'%'); now.querySelector('.wk-tag').setAttribute('data-left',left+' min left');
      line.className='week-now is-on'; line.textContent='Right now · '+$('.wk-who',now).textContent+' on the mat · '+left+' min left';
    } else if(next){
      var when=next.daysAway===0?'today':next.daysAway===1?'tomorrow':dayName(next.day);
      line.className='week-now';line.textContent='Next up · '+next.who+' '+when+' at '+fmt(next.start)+' · '+CLASS_DAYS[next.day];
    } else {
      line.className='week-now';line.textContent='Call for the next class.';
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
      window.__startReel=function(){
        return ground.play().then(function(){
          if(!ground.requestVideoFrameCallback) return;
          return new Promise(function(resolve){ground.requestVideoFrameCallback(function(){resolve()})});
        }).catch(function(){});
      };
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
