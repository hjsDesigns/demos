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
  days: {
    0: null,                          // Sunday      closed
    1: [8, 17],                       // Monday      8:00 am – 5:00 pm
    2: [8, 17],                       // Tuesday
    3: [8, 17],                       // Wednesday
    4: [8, 17],                       // Thursday
    5: [8, 17],                       // Friday
    6: null                           // Saturday    closed
  }
};

/* Year the shop dates to. Used to keep "82 years" from ever going stale. */
var FOUNDED = 1944;

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

  /* ---------- contact form (front-end success state only; wire a backend at launch) ---------- */
  var form=$('.contact-form'), ok=$('.form-success');
  if(form&&ok){form.addEventListener('submit',function(e){e.preventDefault();ok.classList.add('show');ok.setAttribute('role','status');form.querySelector('button[type=submit]').disabled=true})}

  /* ---------- years-in-business, computed so it can never go stale ---------- */
  var yn=$('#yearsNum');
  if(yn){var yrs=new Date().getFullYear()-FOUNDED; yn.setAttribute('data-to',String(yrs)); yn.textContent=String(yrs);}

  /* ---------- TITLE CARDS UNROLL (services) ----------
     The descriptor title IS the tap target; the real items roll out in
     place under it. Chevron only — never a plus sign. */
  $$('.svc-head').forEach(function(btn){
    btn.addEventListener('click',function(){
      var card=btn.closest('.svc-card');
      var open=!card.classList.contains('open');
      card.classList.toggle('open',open);
      btn.setAttribute('aria-expanded',open?'true':'false');
    });
  });

  /* ---------- SIGNATURE GADGET — THE GLASS CHECK ----------
     Two taps: where the damage is, how big it is. The windshield above
     shows it instantly; the verdict reads underneath. Rules of thumb the
     glass trade actually works from — quarter for chips, dollar bill for
     cracks, extra caution at the edge and in the driver's sightline. */
  var ws=$('#wsSvg'), dmgWrap=$('#dmgWrap'), dmg=$('#dmg'), dmgScale=$('#dmgScale'), verdict=$('#verdict');
  if(ws&&dmgWrap&&dmg&&dmgScale&&verdict){

    // where each zone sits on the glass, and how the mark is scaled there
    var ZONES={
      edge:   {x:64,  y:190, label:'near the edge'},
      driver: {x:140, y:118, label:"in the driver's sightline"},
      side:   {x:288, y:104, label:'out to the passenger side'}
    };
    var SCALE={small:.62, big:1.05, crack:1};

    var pick={zone:null,size:null};

    var ANSWERS={
      'edge|small':   ['maybe','Probably a replacement','Damage out at the edge sits in the band of glass that’s bonded to the body. Even a small one there tends to spread — and a repair on the bond line isn’t something to gamble on.'],
      'edge|big':     ['replace','Replacement','It’s big and it’s at the edge. That’s the combination the glass trade doesn’t repair — the windshield is part of what holds the roof up.'],
      'edge|crack':   ['replace','Replacement','A long crack running to the edge has already found the weak point. New glass.'],
      'driver|small': ['maybe','Your call, and we’ll help you make it','It’s small enough to repair. But a repair leaves a faint mark, and this one is right where your eyes live. Some people take the repair, some want new glass. Bring it by and look at it in daylight with us.'],
      'driver|big':   ['replace','Replacement','Bigger than a quarter and straight in front of you. A repair that size would leave something you’d notice every drive.'],
      'driver|crack': ['replace','Replacement','A crack that long across the driver’s view is a windshield, not a repair.'],
      'side|small':   ['repair','Usually a repair','A chip under quarter-size out of the driver’s sightline is the classic fixable one — the glass stays in the car and you’re not out a windshield.'],
      'side|big':     ['maybe','Could go either way','Over quarter-size is past the comfortable range for a repair, but it’s in the easiest spot on the glass. Worth having us look before you buy a windshield.'],
      'side|crack':   ['replace','Replacement','Once it’s a long crack rather than a chip, it’s new glass — wherever it is.']
    };

    function press(list,attr,value){
      list.forEach(function(b){ b.setAttribute('aria-pressed', b.getAttribute(attr)===value ? 'true':'false'); });
    }

    var reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;

    function render(first){
      var z=pick.zone, s=pick.size;
      // every tap moves or resizes the mark, so something visible happens either way
      if(z){ var p=ZONES[z]; dmgWrap.setAttribute('transform','translate('+p.x+','+p.y+')'); }
      ws.classList.toggle('is-crack', s==='crack');
      dmgScale.setAttribute('transform','scale('+(SCALE[s]||.8)+')');
      var show=!!(z||s);
      var wasOff=!dmg.classList.contains('on');
      dmg.classList.toggle('on', show);
      if(show && wasOff && !first && !reduce){        // pop it on only when it first appears
        dmg.classList.remove('pop'); void dmg.getBBox(); dmg.classList.add('pop');
      }
      if(!show) dmg.classList.remove('pop');

      ws.classList.remove('v-repair','v-maybe','v-replace');
      if(!z||!s){
        verdict.className='verdict is-empty';
        verdict.innerHTML='<span>'+(z||s?'One more tap — pick from the other row too.':'Pick one from each row and the answer shows up here.')+'</span>';
        return;
      }
      var a=ANSWERS[z+'|'+s];
      ws.classList.add('v-'+a[0]);
      verdict.className='verdict v-'+a[0];
      verdict.innerHTML=
        '<span class="tag">'+(a[0]==='repair'?'Fixable':a[0]==='maybe'?'Worth a look':'New glass')+'</span>'+
        '<h3>'+a[1]+'</h3>'+
        '<p>'+a[2]+'</p>'+
        '<a class="go" href="#contact">Tell us the year, make and model →</a>';
    }

    var zoneBtns=$$('.gopt[data-zone]'), sizeBtns=$$('.gopt[data-size]');
    zoneBtns.forEach(function(b){
      b.addEventListener('click',function(){
        pick.zone = (pick.zone===b.dataset.zone) ? null : b.dataset.zone;
        press(zoneBtns,'data-zone',pick.zone); render();
      });
    });
    sizeBtns.forEach(function(b){
      b.addEventListener('click',function(){
        pick.size = (pick.size===b.dataset.size) ? null : b.dataset.size;
        press(sizeBtns,'data-size',pick.size); render();
      });
    });
    render(true);
  }

})();
