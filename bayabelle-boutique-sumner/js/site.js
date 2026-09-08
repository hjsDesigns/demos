/* ============================================================
   BAYABELLE BOUTIQUE — site.js
   Nav toggle · live open/closed clock (Pacific) · scroll-reveal ·
   contact form · title-cards-unroll · LOOK AROUND (signature)
   ============================================================ */

/* ------------------------------------------------------------
   HOURS — their published hours, Mon–Sat 10–6 and Sun 11–4.
   Tuesday was confirmed live on the Google Maps panel on 2026-09-08
   ("Closed · Opens 10 AM"). 0 = Sunday … 6 = Saturday, decimal 24h.
   ------------------------------------------------------------ */
var HOURS = {
  tz: 'America/Los_Angeles',
  days: {
    0: [11, 16],                      // Sunday    11:00 AM – 4:00 PM
    1: [10, 18],                      // Monday    10:00 AM – 6:00 PM
    2: [10, 18],                      // Tuesday
    3: [10, 18],                      // Wednesday
    4: [10, 18],                      // Thursday
    5: [10, 18],                      // Friday
    6: [10, 18]                       // Saturday
  }
};

/* No holiday rules are published for this shop anywhere — the hours band
   says so on the page rather than guessing at one. Pass-throughs. */
function customClosure(p){ return null; }
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

  /* ---------- contact form (demo mode — access_key is empty on purpose) ---------- */
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

  /* ---------- SIGNATURE GADGET — LOOK AROUND ----------------------
     Four labelled pills, four real photographs of their own room. Tap a
     pill and the frame is standing there; tap the lit one again and you're
     back in the middle of the floor. One gesture, instant, no modes and
     nothing to read. TODDLER LAW. */
  var spots=$('#spots');
  if(spots){
    var frame=$('#viewerFrame'), label=$('#viewerLabel'), hint=$('#viewerHint');
    var pills=$$('.spot',spots), HOME='room', taps=0;
    function show(key){
      $$('img[data-spot]',frame).forEach(function(im){im.classList.toggle('on',im.getAttribute('data-spot')===key)});
      pills.forEach(function(b){
        var on=b.getAttribute('data-spot')===key;
        b.setAttribute('aria-pressed',on?'true':'false');
        if(on&&label) label.textContent=b.getAttribute('data-label')||'';
      });
    }
    pills.forEach(function(b){
      b.addEventListener('click',function(){
        var key=b.getAttribute('data-spot');
        show(b.getAttribute('aria-pressed')==='true' ? HOME : key);
        taps++;
        if(hint&&taps===1) hint.textContent='Tap the lit one again to come back.';
      });
    });
  }

})();
