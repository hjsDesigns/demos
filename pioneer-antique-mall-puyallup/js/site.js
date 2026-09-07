/* ============================================================
   PIONEER ANTIQUE MALL — site.js
   Nav toggle · live open/closed clock (Pacific) · scroll-reveal ·
   contact form · THE WALL (tap a name, the wall moves in on it)
   ============================================================ */

/* ------------------------------------------------------------
   HOURS — read straight off the shop's own door card (harvest g23):
     "11AM – 6PM  MONDAY – FRIDAY"
     "10AM – 6PM  SAT – SUN"
   with the paper taped over the bottom of that same card:
     "SUNDAY  NEW HOURS  12 PM TO 6 PM"
   The taped note is newer than the etched card, so Sunday is 12–6.
   Google's listing independently agrees that Monday opens at 11 AM.
   0 = Sunday … 6 = Saturday. Decimal 24h.
   ------------------------------------------------------------ */
var HOURS = {
  tz: 'America/Los_Angeles',
  days: {
    0: [12, 18],                      // Sunday    12:00 PM – 6:00 PM  (taped note)
    1: [11, 18],                      // Monday    11:00 AM – 6:00 PM
    2: [11, 18],                      // Tuesday
    3: [11, 18],                      // Wednesday
    4: [11, 18],                      // Thursday
    5: [11, 18],                      // Friday
    6: [10, 18]                       // Saturday  10:00 AM – 6:00 PM
  }
};

/* No holiday rule is published anywhere for this shop and none was
   confirmed for Labor Day — so nothing is invented here. Two undated
   handwritten notes have appeared on their door in the past ("Sorry
   closed till Monday — we will be at Monroe Junk Hunt show" and "We will
   be closed on Mon. & Tue. Working on an estate"), which is why the
   hours band says to call first if you're driving in. */
function customClosure(p){ return null; }
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
    var h=parseFloat(q.get('demo'));var d=parseInt(q.get('day')||'3',10);if(isNaN(h))return null;var o={day:d,h:h};
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
  function hoursFor(day){return HOURS.days[day]||null}

  function computeStatus(){
    var p=pacificNow(), d=p.day, h=p.h;
    var closure=customClosure(p);
    if(closure) return {open:false,text:'Closed today for '+closure};
    var yd=(d+6)%7, yh=hoursFor(yd);
    if(yh&&yh[1]>24&&h<yh[1]-24) return {open:true,text:'Open now · til '+fmt(yh[1])};
    var today=hoursFor(d);
    if(today){
      var close=customClose(p,today[1]);
      if(h>=today[0]&&h<close) return {open:true,text:'Open now · til '+fmt(close),soon:(close-h)<=1};
      if(h<today[0]) return {open:false,text:'Opens today at '+fmt(today[0])};
    }
    for(var i=1;i<=7;i++){
      var nd=(d+i)%7, nh=hoursFor(nd);
      if(nh){var label=i===1?'tomorrow':dayName(nd);return {open:false,text:'Closed · opens '+label+' at '+fmt(nh[0])}}
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
  }
  applyStatus(); setInterval(applyStatus,60000);
  window.__site={pacificNow:pacificNow,computeStatus:computeStatus,HOURS:HOURS};

  /* ---------- scroll-reveal ---------- */
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(!en.isIntersecting)return;
      en.target.classList.add('in');
      io.unobserve(en.target);
    });
  },{threshold:.06,rootMargin:'0px 0px -6% 0px'});
  $$('.reveal').forEach(function(el){io.observe(el)});

  /* ---------- contact form ---------- */
  var form=$('.contact-form'), ok=$('.form-success');
  if(form&&ok){form.addEventListener('submit',function(e){e.preventDefault();ok.classList.add('show');ok.setAttribute('role','status');form.querySelector('button[type=submit]').disabled=true})}

  /* ---------- SIGNATURE — THE WALL --------------------------------
     One real photograph of the wall above their cases. Tap a name and
     the wall moves in on that piece; tap the same name again and it
     pulls back out. No modes, no legend, nothing to read to start.

     Geometry: the image is object-fit:cover inside a 4:3 frame and the
     source is 4:3, so image space == frame space. To bring a point p
     (fraction of the frame) to the middle at scale K we translate by
     (0.5 − p), clamped to ±(0.5 − 0.5/K) so the frame never shows an
     empty edge. ------------------------------------------------------ */
  var frame=$('#wallFrame');
  if(frame){
    var K=2.6, BOUND=0.5-0.5/K;
    var img=$('img',frame), cap=$('#wallCaption'), hint=$('#wallHint');
    var pills=$$('.wall-pill'), current=null;

    function clear(){
      current=null;
      frame.classList.remove('zoomed');
      img.style.removeProperty('--tx');
      img.style.removeProperty('--ty');
      cap.textContent='';
      cap.classList.remove('on');
      pills.forEach(function(p){p.setAttribute('aria-pressed','false')});
      hint.textContent='Tap a name';
    }

    function show(pill){
      var px=parseFloat(pill.getAttribute('data-x'))/100;
      var py=parseFloat(pill.getAttribute('data-y'))/100;
      var tx=Math.max(-BOUND,Math.min(BOUND,0.5-px));
      var ty=Math.max(-BOUND,Math.min(BOUND,0.5-py));
      img.style.setProperty('--tx',(tx*100).toFixed(2)+'%');
      img.style.setProperty('--ty',(ty*100).toFixed(2)+'%');
      cap.textContent=pill.getAttribute('data-cap');
      cap.classList.add('on');
      pills.forEach(function(p){p.setAttribute('aria-pressed',p===pill?'true':'false')});
      frame.classList.add('zoomed');
      hint.textContent='Tap it again to pull back out';
      current=pill;
    }

    pills.forEach(function(pill){
      pill.addEventListener('click',function(){
        if(current===pill){clear();return}
        show(pill);
      });
    });
  }

})();
