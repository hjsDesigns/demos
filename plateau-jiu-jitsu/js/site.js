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

  applyStatus(); setInterval(applyStatus,60000);

  /* ---------- HERO VIDEO: their own footage. Phones get the vertical reel, desktop the square one;
     reduced motion keeps the poster frame and never loads a video. ---------- */
  var hv=$('#heroVid');
  if(hv){
    var noMotion=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    var phone=window.matchMedia('(max-width:760px)').matches;
    var echo=$('.hero-echo');
    if(phone){hv.poster='images/hero-poster-phone.jpg'; if(echo) echo.src='images/hero-poster-phone.jpg';}
    if(!noMotion){
      hv.src=phone?'videos/hero-phone.mp4':'videos/hero-desktop.mp4';
      hv.autoplay=true; hv.load();
      var pr=hv.play(); if(pr&&pr.catch) pr.catch(function(){});
    }
  }
  window.__site={pacificNow:pacificNow,computeStatus:computeStatus,HOURS:HOURS,CLASSES:CLASSES};

  /* ---------- scroll-reveal + count-up ---------- */
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(!en.isIntersecting)return;
      en.target.classList.add('in');
      $$('.count',en.target).forEach(function(c){
        if(c.dataset.done)return; c.dataset.done='1';
        var to=parseInt(c.getAttribute('data-to'),10), from=parseInt(c.getAttribute('data-from')||'0',10), t0=null;
        var reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
        if(reduce){c.textContent=to;return}
        function step(ts){if(!t0)t0=ts;var k=Math.min(1,(ts-t0)/1400);var e=1-Math.pow(1-k,3);c.textContent=Math.round(from+(to-from)*e);if(k<1)requestAnimationFrame(step)}
        requestAnimationFrame(step);
      });
      io.unobserve(en.target);
    });
  },{threshold:.06,rootMargin:'0px 0px -6% 0px'});
  $$('.reveal').forEach(function(el){io.observe(el)});

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

})();
