/* ============================================================
   ALL STAR AUTO BODY — Puyallup, WA — site.js
   Nav toggle · live open/closed clock (Pacific) · scroll-reveal ·
   count-up · contact form · title-cards-unroll · THE LINE (before/after)
   ============================================================ */

/* ------------------------------------------------------------
   HOURS — 0 = Sunday … 6 = Saturday. Decimal 24h (10.5 = 10:30 am).
     [open, close]  both known
     [open, null]   opening time known, closing time NOT published
     null           confirmed closed
     '?'            nothing published for that day

   SOURCE (2026-09-08): the full seven-day table off All Star's own Google
   Maps place page, read out of the rendered hours table (headless Chromium —
   curl and every directory mirror are Cloudflare-walled, which is why the
   2026-09-06 recon could only see "Opens 10 AM Mon"). Mon–Fri 10 AM – 7 PM,
   Saturday 11 AM – 5 PM, Sunday closed. Nothing here is invented; if the shop
   tells Hayden different at the counter, change these seven lines and nothing
   else. The live light is GREEN only when provably open and RED only when
   provably closed — a day with no published hours would go NEUTRAL grey.
   ------------------------------------------------------------ */
var HOURS = {
  tz: 'America/Los_Angeles',
  days: {
    0: null,           // Sunday     — closed
    1: [10, 19],       // Monday     — 10:00 AM – 7:00 PM
    2: [10, 19],       // Tuesday
    3: [10, 19],       // Wednesday
    4: [10, 19],       // Thursday
    5: [10, 19],       // Friday
    6: [11, 17]        // Saturday   — 11:00 AM – 5:00 PM
  },
  phone: '(206) 928-1600',
  tel: '+12069281600'
};

/* Holiday hook — nothing published for this shop, so nothing is claimed.
   Return {unknown:true,text:'…'} for a date to hand the day back as NEUTRAL. */
function customClosure(p){
  return null;
}
function customClose(p, close){ return close; }


(function(){
  'use strict';
  document.documentElement.classList.add('js');
  var $=function(s,r){return (r||document).querySelector(s)};
  var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var REDUCE=function(){return window.matchMedia('(prefers-reduced-motion:reduce)').matches};

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
  var DEMO=(function(){try{var q=new URLSearchParams(location.search);if(!q.has('demo'))return null;
    var h=parseFloat(q.get('demo'));var d=parseInt(q.get('day')||'1',10);if(isNaN(h))return null;var o={day:d,h:h,y:2026,mo:8,d:14};
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
  function hoursFor(day){var v=HOURS.days[day];return (v===undefined)?'?':v}

  /* Three states, never a guess:
       open:true   → GREEN   (we can prove they are open right now)
       open:false  → RED     (we can prove they are closed right now)
       unknown     → NEUTRAL (nothing is published — say so, hand over the phone) */
  function computeStatus(){
    var p=pacificNow(), d=p.day, h=p.h;
    var holiday=customClosure(p);
    if(holiday) return holiday.unknown ? {unknown:true,text:holiday.text} : {open:false,text:'Closed today for '+holiday};

    var today=hoursFor(d);
    if(today==='?') return {unknown:true,text:'Hours for '+dayName(d)+' aren’t published — call the shop'};
    if(today===null) return {open:false,text:'Closed today'};

    var openAt=today[0], close=customClose(p,today[1]);
    if(h<openAt) return {open:false,text:'Closed · opens today at '+fmt(openAt)};
    if(close===null) return {unknown:true,text:'Opened at '+fmt(openAt)+' — call to catch them before they close'};
    if(h<close) return {open:true,text:'Open now · til '+fmt(close)};
    return {open:false,text:'Closed for the day'};
  }

  function applyStatus(){
    var s=computeStatus(), p=pacificNow();
    var cls = s.unknown ? 'is-unknown' : (s.open ? 'is-open' : 'is-closed');
    var short = s.unknown ? 'Call' : (s.open ? 'Open' : 'Closed');
    var hp=$('#hdrLive'), ht=$('#hdrLiveText');
    if(hp&&ht){hp.className='hdr-live '+cls;ht.textContent=short;}
    var sl=$('#statusLine'), st=$('#statusText');
    if(sl&&st){sl.className='live-line '+cls;st.textContent=s.text;}
    $$('#hoursList li[data-days]').forEach(function(li){li.classList.toggle('today',li.getAttribute('data-days').split(',').indexOf(String(p.day))>-1)});
  }
  applyStatus(); setInterval(applyStatus,60000);
  window.__site={pacificNow:pacificNow,computeStatus:computeStatus,HOURS:HOURS};

  /* ---------- scroll-reveal + count-up ---------- */
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(!en.isIntersecting)return;
      en.target.classList.add('in');
      $$('.count',en.target).forEach(function(c){
        if(c.dataset.done)return; c.dataset.done='1';
        var to=parseFloat(c.getAttribute('data-to')), dec=parseInt(c.getAttribute('data-dec')||'0',10), t0=null;
        var show=function(n){c.textContent=dec?n.toFixed(dec):Math.round(n).toLocaleString('en-US')};
        if(REDUCE()){show(to);return}
        function step(ts){if(!t0)t0=ts;var k=Math.min(1,(ts-t0)/1400);var e=1-Math.pow(1-k,3);show(to*e);if(k<1)requestAnimationFrame(step);else show(to)}
        requestAnimationFrame(step);
      });
      io.unobserve(en.target);
    });
  },{threshold:.06,rootMargin:'0px 0px -6% 0px'});
  $$('.reveal').forEach(function(el){
    /* Anything already at or above the fold on load — an #anchor jump, a
       restored scroll position, a deep link — has no intersection left to
       observe and would stay invisible for good. Show it outright. */
    if(el.getBoundingClientRect().top < window.innerHeight){el.classList.add('in');return}
    io.observe(el);
  });

  /* ---------- contact form (demo mode: access_key empty, nothing is sent) ---------- */
  var form=$('.contact-form'), ok=$('.form-success');
  if(form&&ok){form.addEventListener('submit',function(e){e.preventDefault();ok.classList.add('show');ok.setAttribute('role','status');form.querySelector('button[type=submit]').disabled=true})}

  /* ---------- TITLE CARDS UNROLL — the headline is the tap target ---------- */
  $$('.unroll').forEach(function(btn){
    var panel=document.getElementById(btn.getAttribute('aria-controls'));
    if(!panel) return;
    btn.addEventListener('click',function(){
      var open=btn.getAttribute('aria-expanded')==='true';
      btn.setAttribute('aria-expanded',open?'false':'true');
      panel.setAttribute('data-open',open?'0':'1');
    });
  });

  /* ---------- SIGNATURE — THE LINE -----------------------------------
     The picture on their own banner is one car split down the middle:
     wrecked on the left, finished on the right. This is that line, made
     draggable, over two real photos of ONE car (the red Nissan Altima in
     their own Google harvest, driver's side, before and after).
     Toddler law: one big grab handle that nudges itself until you touch it,
     drag or tap anywhere on the photo, instant payoff, no instructions. */
  var ba=$('#ba');
  if(ba){
    var grip=$('.ba-grip',ba), dragging=false;
    function setSplit(pct,mark){
      pct=Math.max(0,Math.min(100,pct));
      ba.style.setProperty('--split',pct.toFixed(2)+'%');
      if(grip) grip.setAttribute('aria-valuenow',Math.round(pct));
      if(mark) ba.classList.add('touched');
    }
    function fromEvent(e){
      var r=ba.getBoundingClientRect();
      var x=(e.touches&&e.touches[0]?e.touches[0].clientX:e.clientX)-r.left;
      setSplit(x/r.width*100,true);
    }
    function down(e){dragging=true;fromEvent(e);if(e.cancelable)e.preventDefault()}
    function move(e){if(!dragging)return;fromEvent(e);if(e.cancelable)e.preventDefault()}
    function up(){dragging=false}
    ba.addEventListener('mousedown',down);
    window.addEventListener('mousemove',move);
    window.addEventListener('mouseup',up);
    ba.addEventListener('touchstart',down,{passive:false});
    window.addEventListener('touchmove',move,{passive:false});
    window.addEventListener('touchend',up);
    if(grip){
      grip.addEventListener('click',function(e){e.stopPropagation()});
      grip.addEventListener('keydown',function(e){
        var cur=parseFloat(grip.getAttribute('aria-valuenow')||'50');
        if(e.key==='ArrowLeft'){setSplit(cur-6,true);e.preventDefault()}
        else if(e.key==='ArrowRight'){setSplit(cur+6,true);e.preventDefault()}
        else if(e.key==='Home'){setSplit(0,true);e.preventDefault()}
        else if(e.key==='End'){setSplit(100,true);e.preventDefault()}
      });
    }
    setSplit(50,false);
  }

})();
