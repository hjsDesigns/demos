/* ============================================================
   WEBSITE FACTORY — site.js
   Nav toggle · live open/closed clock (Pacific time) · scroll-reveal ·
   count-up numbers · contact form success.
   The ONLY thing to edit per client is the HOURS block right below.
   ============================================================ */

/* ------------------------------------------------------------
   HOURS CONFIG  — fill from the client's Google listing.
   Days are 0=Sunday … 6=Saturday. Each day is [open, close] in
   decimal 24h hours (6.5 = 6:30 am, 18 = 6:00 pm, 23.5 = 11:30 pm).
   null = closed that day. Closing past midnight: use 26 for 2 am.
   ------------------------------------------------------------ */
var HOURS = {
  tz: 'America/Los_Angeles',          // Pacific, wherever the viewer is
  days: {                             // identical all 7 days — confirmed on Google AND Yelp
    0: [11, 20],                      // Sunday      11:00 am – 8:00 pm
    1: [11, 20],                      // Monday
    2: [11, 20],                      // Tuesday
    3: [11, 20],                      // Wednesday
    4: [11, 20],                      // Thursday
    5: [11, 20],                      // Friday
    6: [11, 20]                       // Saturday
  }
};

/* ------------------------------------------------------------
   CUSTOM CLOSE RULES HOOK  (optional — leave as-is for most clients)
   Two functions site.js calls every minute. `p` is the Pacific "now":
   {day, h, y, mo, d}  (day 0-6, h decimal hour, y year, mo month 0-11, d date)

   customClosure(p) → return a string to mark the whole day CLOSED
                      ("Closed today for Labor Day"), or null.
   customClose(p, close) → return an adjusted closing hour for today.

   Reference-build example (path in README, "HOURS config"): Friday closed
   at the earlier of 6 pm or SUNDOWN (NOAA sunset math), and US holidays
   from their rate sheet returned a closure string. Port that logic here
   only when the business actually has such a rule.
   ------------------------------------------------------------ */
function customClosure(p){ return null; }
function customClose(p, close){ return close; }


(function(){
  'use strict';
  document.documentElement.classList.add('js');
  var $=function(s,r){return (r||document).querySelector(s)};
  var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};

  /* ---------- mobile nav (toggle · Escape · outside-click · close on link) ---------- */
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
  // Pitch/demo switch: ?demo=15.75 (hour, Pacific) [&day=1-6] [&date=YYYY-MM-DD]
  // freezes the clock so "Open now" can be shown after hours. No UI exposes it.
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
    // still inside yesterday's after-midnight hours? (e.g. a bar closing at 2 am = 26)
    var yd=(d+6)%7, yh=hoursFor(yd);
    if(yh&&yh[1]>24&&h<yh[1]-24) return {open:true,text:'Open now · til '+fmt(yh[1])};
    var today=hoursFor(d);
    if(today){
      var close=customClose(p,today[1]);
      if(h>=today[0]&&h<close) return {open:true,text:'Open now · til '+fmt(close),soon:(close-h)<=1};
      if(h<today[0]) return {open:false,text:'Opens today at '+fmt(today[0])};
    }
    // find the next open day
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
  window.__site={pacificNow:pacificNow,computeStatus:computeStatus,HOURS:HOURS}; // handy in the console

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

  /* ---------- contact form ----------
     Demo mode (hidden access_key empty): show the thank-you, send nothing.
     Live mode (key filled at go-live by pages-golive.sh): POST to Web3Forms from the visitor's
     browser -> lands in the owner's inbox. Failure falls back to "call or text us". */
  var form=$('.contact-form'), ok=$('.form-success');
  if(form&&ok){form.addEventListener('submit',function(e){
    e.preventDefault();
    var btn=form.querySelector('button[type=submit]'), keyEl=form.querySelector('[name=access_key]'), key=keyEl?keyEl.value.trim():'';
    function done(){ok.classList.add('show');ok.setAttribute('role','status');btn.disabled=true}
    if(!key){done();return}
    var label=btn.textContent; btn.disabled=true; btn.textContent='Sending\u2026';
    var data={}; new FormData(form).forEach(function(v,k){data[k]=v});
    data.subject=data.subject||('New message from your website ('+document.title+')');
    fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)})
      .then(function(r){return r.json()}).then(function(j){if(j&&j.success){done()}else{throw new Error('send failed')}})
      .catch(function(){btn.disabled=false;btn.textContent=label;ok.textContent='Couldn\u2019t send just now \u2014 call or text us instead.';ok.classList.add('show');ok.setAttribute('role','alert')});
  })}

  /* ---------- SIGNATURE GADGET ----------
     Per-client interactive code goes below this line (EA: day timeline +
     rate calculator). Keep it inside this IIFE so it can use $ / $$ / pacificNow. */

  /* ---------- TITLE CARDS UNROLL (ARROW LAW: chevron, never a plus) ---------- */
  $$('.roll-btn').forEach(function(btn){
    btn.addEventListener('click',function(){
      var panel=document.getElementById(btn.getAttribute('aria-controls'));
      var open=btn.getAttribute('aria-expanded')==='true';
      btn.setAttribute('aria-expanded', open?'false':'true');
      if(panel) panel.classList.toggle('open', !open);
    });
  });

  /* ---------- SIGNATURE: THE MEAT BOARD ----------
     Their real seven-meat board (ASADA-STEAK … CHICHARRON EN SALSA ROJA-PORK IN
     RED SAUCE, photographed on the truck) turned into the question people
     actually ask at the window. One tap on a meat: it drops into the tortilla,
     onion and cilantro rain on after it, a lime lands, and the truck's own
     English translation shows. Tap the same meat again and it clears.
     No inputs, no units, no numbers to read — Toddler Law. */
  (function(){
    var tortilla=$('#mbTortilla'), fill=$('#mbFill'), garnish=$('#mbGarnish'), lime=$('#mbLime'),
        label=$('#mbLabel'), chips=$$('.mb-chip');
    if(!tortilla||!fill||!garnish||!label||!chips.length) return;

    var MEAT={
      asada:      ['#5A3A28','#6E4A33','#492E1F'],
      adobada:    ['#A8412A','#BC5233','#8E3220'],
      carnitas:   ['#B0713C','#C4854A','#965C2E'],
      pollo:      ['#C99646','#D8A957','#B37F36'],
      cabeza:     ['#6B4630','#7D563C','#583625'],
      lengua:     ['#8A6257','#9C7367','#755049'],
      chicharron: ['#9B2C1E','#B23A28','#821F14']
    };
    /* Fixed, hand-placed scatter — deterministic, so every load and every replay
       renders pixel-identical (APPROVED IS LOCKED). No Math.random anywhere. */
    var SPOTS=[[30,30,20,15],[52,26,18,14],[24,50,22,16],[47,48,21,15],[68,42,19,14],
               [36,66,20,15],[57,66,19,14],[18,38,16,12],[64,58,17,13],[41,17,16,12],
               [70,28,15,12],[28,72,16,12],[52,78,15,12],[43,36,17,13]];
    var ONION=[[35,24,7],[60,34,6],[26,44,6],[50,58,7],[68,50,6],[38,74,6],[45,42,6]];
    var HERB =[[44,22,7],[30,38,6],[62,26,6],[35,56,7],[57,72,6],[70,62,6],[22,60,6]];

    var active=null;

    function clear(){
      tortilla.classList.remove('on');
      fill.innerHTML=''; garnish.innerHTML='';
      label.innerHTML='<span class="mb-es">&mdash;</span><span class="mb-en">tap a meat below</span>';
      chips.forEach(function(c){c.setAttribute('aria-pressed','false')});
      active=null;
    }

    function serve(chip){
      var key=chip.getAttribute('data-meat'), cols=MEAT[key];
      if(!cols) return;
      fill.innerHTML=''; garnish.innerHTML='';
      /* force a reflow so the drop animation restarts cleanly on a fast re-tap */
      tortilla.classList.remove('on'); void tortilla.offsetWidth;

      SPOTS.forEach(function(s,i){
        var el=document.createElement('span');
        el.style.cssText='left:'+s[0]+'%;top:'+s[1]+'%;width:'+s[2]+'%;height:'+s[3]+'%;'+
          'background:'+cols[i%3]+';transform-origin:50% 50%;animation-delay:'+(i*26)+'ms;'+
          'box-shadow:inset 0 -3px 6px -2px rgba(0,0,0,.35)';
        fill.appendChild(el);
      });
      ONION.forEach(function(s,i){
        var el=document.createElement('span');
        el.style.cssText='left:'+s[0]+'%;top:'+s[1]+'%;width:'+s[2]+'%;height:'+s[2]+'%;'+
          'background:#F6F1E4;animation-delay:'+(380+i*22)+'ms;box-shadow:inset 0 0 0 1px rgba(0,0,0,.08)';
        garnish.appendChild(el);
      });
      HERB.forEach(function(s,i){
        var el=document.createElement('span');
        el.style.cssText='left:'+s[0]+'%;top:'+s[1]+'%;width:'+s[2]+'%;height:'+s[2]+'%;'+
          'background:#4A7A2E;animation-delay:'+(430+i*22)+'ms';
        garnish.appendChild(el);
      });

      tortilla.classList.add('on');
      label.innerHTML='<span class="mb-es">'+chip.getAttribute('data-es')+'</span>'+
                      '<span class="mb-en">'+chip.getAttribute('data-en')+'</span>';
      chips.forEach(function(c){c.setAttribute('aria-pressed', c===chip?'true':'false')});
      active=key;
    }

    chips.forEach(function(chip){
      chip.addEventListener('click',function(){
        if(active===chip.getAttribute('data-meat')){clear();return}
        serve(chip);
      });
    });
  })();

})();
