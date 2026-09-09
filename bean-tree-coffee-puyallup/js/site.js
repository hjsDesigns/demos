/* ============================================================
   THE BEAN TREE COFFEE CO — site.js
   Nav toggle · live open/closed clock (Pacific) · scroll-reveal ·
   count-up · contact form · THE SEASON CUP (signature)
   ============================================================ */

/* ------------------------------------------------------------
   HOURS — Google Maps (place page read 2026-09-07: "Opens 4:30 AM Mon")
   and Restaurantji (all seven rows) agree exactly, so these are the two
   independent sources this page runs on.

   CONFLICT NOTED, NOT SHIPPED: the painted board on the side of the
   stand (harvest-0906/g1.jpg) still reads M-F 5AM-7PM, SAT 5:30AM-7PM,
   SUN 6AM-6PM. That's the older, permanent sign; the live listings win.
   On the ask-client list in HANDOFF-CODEX.md.

   0 = Sunday … 6 = Saturday. Decimal 24h.
   ------------------------------------------------------------ */
var HOURS = {
  tz: 'America/Los_Angeles',
  days: {
    0: [6, 17],                       // Sunday     6:00 AM – 5:00 PM
    1: [4.5, 18],                     // Monday     4:30 AM – 6:00 PM
    2: [4.5, 18],                     // Tuesday
    3: [4.5, 18],                     // Wednesday
    4: [4.5, 18],                     // Thursday
    5: [4.5, 18],                     // Friday
    6: [5.5, 18]                      // Saturday   5:30 AM – 6:00 PM
  }
};

/* No holiday rule is published anywhere reachable — Labor Day hours are
   unconfirmed, so the clock runs the regular Monday row. */
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
    if(hp&&ht){hp.className='hdr-live '+(s.open?'is-open':'is-closed');ht.textContent=s.open?'Open now':'Closed';}
    var sl=$('#statusLine'), st=$('#statusText');
    if(sl&&st){sl.className='live-line '+(s.open?'is-open':'is-closed');st.textContent=s.text;}
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
        var to=parseInt(c.getAttribute('data-to'),10), from=parseInt(c.getAttribute('data-from')||'0',10), t0=null;
        var show=function(n){c.textContent=n.toLocaleString('en-US')};
        if(REDUCE()){show(to);return}
        function step(ts){if(!t0)t0=ts;var k=Math.min(1,(ts-t0)/1400);var e=1-Math.pow(1-k,3);show(Math.round(from+(to-from)*e));if(k<1)requestAnimationFrame(step)}
        requestAnimationFrame(step);
      });
      io.unobserve(en.target);
    });
  },{threshold:.06,rootMargin:'0px 0px -6% 0px'});
  $$('.reveal').forEach(function(el){io.observe(el)});

  /* ---------- TITLE CARDS UNROLL ------------------------------------
     Every heading painted on their board is the tap target. The chevron
     flips down-to-up, the real items roll out in place. Independent
     cards — opening one never closes another, so there are no modes. */
  $$('.bcard .unroll').forEach(function(btn){
    btn.addEventListener('click',function(){
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  });

  /* ---------- contact form ---------- */
  var form=$('.contact-form');
  if(form){form.addEventListener('submit',function(e){
    e.preventDefault();
    form.classList.add('sent');
    var b=form.querySelector('button[type=submit]'); if(b) b.disabled=true;
  })}

  /* ---------- SIGNATURE — THE SEASON CUP --------------------------
     The Bean Tree redesigns its cup for every season; five of their own
     cups are on the frame. TODDLER LAW: one tap on a labelled pill, the
     photo swaps instantly, no modes, no legend, nothing to read. */
  var pills=$('#cupPills'), shot=$('#cupShot'), cap=$('#cupCap');
  if(pills&&shot&&cap){
    var buttons=$$('.cup-pill',pills), shots=$$('img',shot);
    function show(season, title, caption){
      shots.forEach(function(im){im.classList.toggle('on', im.getAttribute('data-season')===season)});
      buttons.forEach(function(b){b.setAttribute('aria-pressed', b.getAttribute('data-season')===season?'true':'false')});
      cap.innerHTML='<b></b>';
      cap.firstChild.textContent=title;
      cap.appendChild(document.createTextNode(caption));
    }
    buttons.forEach(function(b){
      b.addEventListener('click',function(){
        show(b.getAttribute('data-season'), b.getAttribute('data-title'), b.getAttribute('data-cap'));
      });
    });
  }

})();
