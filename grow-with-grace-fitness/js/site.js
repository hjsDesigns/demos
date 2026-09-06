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
/* GROW WITH GRACE FITNESS — the clock is WIRED BUT OFF on this build.
   Why: the only sourced hours fact that exists for this business anywhere is a
   Google snippet saying she opens at 9 AM on Sundays. Six of seven days are
   unknown, and her own site says the mat-Pilates schedule goes out on Instagram
   and to text her for the current times. A green/red "Open now" dot built on
   that would be inventing most of the week, so #hours carries how each program
   runs instead, and the header pill + status line are removed from index.html.

   TO SWITCH THE LIVE CLOCK ON once Gracie confirms real hours (2 minutes):
     1. fill days below with her real [open, close] pairs (decimal hours),
     2. set LIVE_HOURS = true,
     3. in index.html put back the header pill and the status line:
          <span class="hdr-live" id="hdrLive"><span class="dot"></span><span id="hdrLiveText">checking…</span></span>
          <p class="live-line" id="statusLine"><span class="dot"></span><span id="statusText">checking hours…</span></p>
        and give each <li> in #hoursList a data-days="0,1,…" attribute so today lights.
   Nothing else changes — the whole status engine below is untouched template code. */
var LIVE_HOURS = false;

var HOURS = {
  tz: 'America/Los_Angeles',          // Pacific, wherever the viewer is
  days: {
    0: [9, null],                     // Sunday    — "opens 9 AM" (Google snippet, 2026-09-05). Close time UNKNOWN.
    1: null,                          // Monday    — UNKNOWN, ask client
    2: null,                          // Tuesday   — UNKNOWN, ask client
    3: null,                          // Wednesday — UNKNOWN, ask client
    4: null,                          // Thursday  — UNKNOWN, ask client
    5: null,                          // Friday    — UNKNOWN, ask client
    6: null                           // Saturday  — UNKNOWN, ask client
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
  function setNav(open){nav.classList.toggle('open',open);toggle.setAttribute('aria-expanded',open?'true':'false');toggle.setAttribute('aria-label',open?'Close menu':'Open menu');toggle.textContent=open?'✕':'☰'}
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
  // Clock off until Gracie confirms real hours — see the LIVE_HOURS note at the top.
  if(LIVE_HOURS){ applyStatus(); setInterval(applyStatus,60000); }
  window.__site={pacificNow:pacificNow,computeStatus:computeStatus,HOURS:HOURS}; // handy in the console

  /* ---------- scroll-reveal + count-up ---------- */
  var io=typeof IntersectionObserver!=='undefined'?new IntersectionObserver(function(entries){
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
  },{threshold:.06,rootMargin:'0px 0px -6% 0px'}):null;
  $$('.reveal').forEach(function(el){if(io)io.observe(el);else el.classList.add('in')});

  /* ---------- contact: a real email draft until live delivery is configured ---------- */
  var form=$('.contact-form'), ok=$('.form-success');
  if(form&&ok){
    var btn=form.querySelector('button[type=submit]'), keyEl=form.querySelector('[name=access_key]');
    var live=keyEl&&keyEl.value.trim();
    if(live){btn.textContent=form.getAttribute('data-send-label');$('.form-fine',form).textContent='Your message goes directly to the business.';}
    function feedback(message, error){ok.textContent=message;ok.classList.add('show');ok.setAttribute('role',error?'alert':'status');}
    form.addEventListener('submit',function(e){
      e.preventDefault();
      if(btn.disabled||!form.reportValidity())return;
      var key=keyEl?keyEl.value.trim():'';
      if(!key){
        var fields=new FormData(form), topic=fields.get('topic')||'Website inquiry';
        var body=['Name: '+(fields.get('name')||''),'Email: '+(fields.get('email')||''),'Phone: '+(fields.get('phone')||''),'',fields.get('msg')||''].join('\n');
        location.href=form.action.split('?')[0]+'?subject='+encodeURIComponent(topic)+'&body='+encodeURIComponent(body);
        feedback('Your email draft is ready to open. Send it from your email app to finish. If it does not open, use the email or phone link beside this form.',false);
        return;
      }
      var label=btn.textContent;btn.disabled=true;btn.textContent='Sending…';
      var data={};new FormData(form).forEach(function(v,k){data[k]=v});
      data.subject=data.subject||('New message from your website ('+document.title+')');
      fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)})
        .then(function(r){if(!r.ok)throw new Error('send failed');return r.json()})
        .then(function(j){if(!j||!j.success)throw new Error('send failed');feedback('Message sent. The business will reply using the contact details you provided.',false);btn.textContent='Message sent';})
        .catch(function(){btn.disabled=false;btn.textContent=label;feedback('Could not send just now. Use the email or phone link beside this form.',true);});
    });
  }

  /* ---------- TITLE CARDS THAT UNROLL (the four programs) ----------
     Each card's own title is the tap target; the chevron flips down→up.
     Copy inside is Gracie's, verbatim from her own site — nothing invented. */
  $$('.unroll-t').forEach(function(btn){
    var li=btn.parentNode, panel=document.getElementById(btn.getAttribute('aria-controls'));
    function setOpen(open){li.classList.toggle('open',open);btn.setAttribute('aria-expanded',String(open));panel.setAttribute('aria-hidden',String(!open));panel.inert=!open;}
    setOpen(false);
    btn.addEventListener('click',function(){setOpen(!li.classList.contains('open'))});
  });

  /* ---------- SIGNATURE GADGET — "What are you after?" ----------
     Tap one of four real photographs, the matching program appears instantly
     in the panel directly above them, tap the same one again to clear.
     Every line below is Gracie's own offer, worded from her own copy. */
  var GOALS={
    stronger:{name:'Personal training',
      line:'You and Gracie in person each week — goals first, then the plan, the proper form and the workouts that get you there.',
      msg:'Hi Gracie — I want to feel stronger. Can you tell me about 1:1 training?'},
    move:{name:'Mat Pilates classes',
      line:'Slow and controlled mat work in a small class on Cole Street. Text Gracie for current times and availability.',
      msg:'Hi Gracie — I’d like to move better. When is your next mat Pilates class?'},
    eat:{name:'Nutrition guidance',
      line:'Direction on eating to feel good rather than eating less — a balanced way of living you can actually keep.',
      msg:'Hi Gracie — I’d like some help with nutrition. How does that work?'},
    own:{name:'Workout programs',
      line:'A private library of her workouts with 24/7 access, done whenever your day allows.',
      msg:'Hi Gracie — I want to train on my own time. Can you tell me about the workout programs?'}
  };
  var picks=$$('.goal-pick'), out=$('#goalOut');
  if(picks.length&&out){
    var idle=$('.goal-idle',out), card=$('.goal-card',out),
        gName=$('#goalName'), gLine=$('#goalLine'), gBtn=$('#goalBtn'), current=null;
    picks.forEach(function(b){
      b.addEventListener('click',function(){
        var key=b.getAttribute('data-goal');
        picks.forEach(function(o){o.classList.remove('on');o.setAttribute('aria-pressed','false')});
        if(current===key){                       // tap the same picture again = clear
          current=null; card.hidden=true; idle.hidden=false; return;
        }
        current=key;b.classList.add('on');b.setAttribute('aria-pressed','true');
        var g=GOALS[key]; if(!g) return;
        gName.textContent=g.name;
        gLine.textContent=g.line;
        // "?&body=" is the one separator both iOS and Android accept.
        gBtn.href='sms:+12537400878?&body='+encodeURIComponent(g.msg);
        idle.hidden=true; card.hidden=false;
        card.style.animation='none'; void card.offsetWidth; card.style.animation='';
      });
    });
  }

})();
