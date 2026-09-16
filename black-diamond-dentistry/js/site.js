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
  // Source: Google Business Profile (live panel, confirmed 2026-08-31).
  // NOTE: their own site's /our-office page disagrees on Thu/Fri — Google's
  // set is shipped because it's business-editable and matched the live
  // "Open · Closes 5 PM" panel exactly. Confirm with the practice.
  days: {
    0: null,                          // Sunday      Closed
    1: [8, 17],                       // Monday      8:00 AM – 5:00 PM
    2: [8, 17],                       // Tuesday     8:00 AM – 5:00 PM
    3: [8, 17],                       // Wednesday   8:00 AM – 5:00 PM
    4: [9, 15],                       // Thursday    9:00 AM – 3:00 PM
    5: [9, 15],                       // Friday      9:00 AM – 3:00 PM
    6: null                           // Saturday    Closed
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

  /* ---------- contact form (front-end success state only; wire a backend at launch) ---------- */
  var form=$('.contact-form'), ok=$('.form-success');
  if(form&&ok){form.addEventListener('submit',function(e){e.preventDefault();ok.classList.add('show');ok.setAttribute('role','status');form.querySelector('button[type=submit]').disabled=true})}

  /* ---------- SIGNATURE GADGET ----------
     Per-client interactive code goes below this line (EA: day timeline +
     rate calculator). Keep it inside this IIFE so it can use $ / $$ / pacificNow. */

  /* ---------- TITLE CARDS UNROLL (services) ----------
     The descriptor headline IS the tap target. One tap opens it in place,
     tapping again closes it. Chevron flips. No plus signs anywhere. */
  $$('.unroll-t').forEach(function(btn){
    btn.addEventListener('click',function(){
      var box=btn.closest('.unroll');
      var open=box.classList.toggle('open');
      btn.setAttribute('aria-expanded',open?'true':'false');
    });
  });

  /* ---------- SIGNATURE — "What brings you in?" ----------
     The counter conversation as a tool: one tap on a labeled button, the
     answer card fills instantly and their real door-decal diamond comes up
     behind it. No hidden modes, no readback of the choice, no scoring. */
  /* `topic` matches an existing <option> in the contact form's select, and
     `msg` is the sentence dropped into the message box — written in the
     PATIENT'S voice, because that is who ends up sending it. Both stay fully
     editable once they land in the form. */
  var ANSWERS={
    clean:{
      tag:'Everyday care',
      h:'A cleaning and a good look around',
      p:'The hygienist cleans, then Dr. Mike or Dr. Ashley goes over everything. It is the visit reviewers keep describing with the same two words: gentle, and kind.',
      topic:'A cleaning or checkup',
      msg:"I'm due for a cleaning and a checkup. What do you have open?"
    },
    hurt:{
      tag:'Everyday care',
      h:'Call, rather than wait it out',
      p:'Emergency care is one of the specific things patients thank this office for on Google. A tooth that has started aching is a phone call today, not a problem for next month.',
      topic:'Something hurts',
      msg:"One of my teeth has started hurting. I'd like to get in as soon as you can see me."
    },
    chip:{
      tag:'Cosmetic · Rebuilding',
      h:'Repair, cover, or replace',
      p:'How deep it goes decides which. A chipped front tooth can be covered with a Lumineer — a thin porcelain shell bonded over it. A tooth that is gone below the gum is implant territory, and they place those here too.',
      topic:'Cosmetic work',
      msg:"I've chipped or cracked a tooth and I'd like someone to take a look at it."
    },
    straight:{
      tag:'Cosmetic dentistry',
      h:'Clear aligners, not brackets',
      p:'Removable trays instead of metal braces. Same office as your cleanings, so nobody is sending you down the hill for it.',
      topic:'Cosmetic work',
      msg:"I'd like to hear about clear aligners for straightening my teeth."
    },
    jaw:{
      tag:'Jaw therapy',
      h:'The headaches most people never bring to a dentist',
      p:'Dr. Ashley does facial neuromodulator injections aimed at the muscles doing the clenching — that is TMJ and clenching therapy, and it is a different job from the cosmetic version of the same medicine.',
      topic:'Jaw pain or clenching',
      msg:"I've been clenching and getting headaches, and I'd like to ask about the jaw treatment."
    }
  };
  var gad=$('.gad'), gadBody=$('#gadBody'), gchips=$$('.gchip');

  /* Tapping the card's button carries the pick into the contact form: the
     message box is written for them (editable), the topic select is set to
     match, and they land on the form with the message ready. The button is a
     real link to #contact, so with JS off it still goes somewhere sensible. */
  function carryToForm(key){
    var a=ANSWERS[key]; if(!a) return;
    var form=$('.contact-form'); if(!form) return;
    var box=form.querySelector('textarea[name=msg]');
    var sel=form.querySelector('select[name=topic]');
    if(sel&&a.topic){
      $$('option',sel).forEach(function(o){if(o.value===a.topic||o.textContent.trim()===a.topic)sel.value=o.value});
    }
    var reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    var target=document.getElementById('contact');
    if(target) target.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
    if(box){
      box.value=a.msg;
      box.classList.remove('just-filled'); void box.offsetWidth; box.classList.add('just-filled');
      setTimeout(function(){
        try{box.focus({preventScroll:true})}catch(e){box.focus()}
        var n=box.value.length; try{box.setSelectionRange(n,n)}catch(e){}
      },reduce?0:520);
    }
  }

  if(gad&&gadBody&&gchips.length){
    gchips.forEach(function(chip){
      chip.addEventListener('click',function(){
        var key=chip.getAttribute('data-k'), a=ANSWERS[key];
        if(!a) return;
        var already=chip.getAttribute('aria-pressed')==='true';
        gchips.forEach(function(c){c.setAttribute('aria-pressed','false')});
        if(already){                                    // tap the lit one again = clear
          gad.classList.remove('is-on');
          gadBody.className='gad-body';
          gadBody.innerHTML='<p class="gad-empty">Pick one above and this card fills in.</p>';
          return;
        }
        chip.setAttribute('aria-pressed','true');
        gad.classList.add('is-on');
        gadBody.innerHTML='<p class="gad-tag">'+a.tag+'</p><h3>'+a.h+'</h3>'+
          '<p class="gad-text">'+a.p+'</p>'+
          '<a class="gad-go" href="#contact" data-k="'+key+'">Send this to the front desk →</a>';
        gadBody.className='gad-body';                   // restart the entrance cleanly
        void gadBody.offsetWidth;                       // force reflow so the animation always replays
        gadBody.className='gad-body pop';
        var go=gadBody.querySelector('.gad-go');
        if(go) go.addEventListener('click',function(e){e.preventDefault();carryToForm(key)});
      });
    });
  }

})();
