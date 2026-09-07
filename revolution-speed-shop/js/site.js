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
/* REVOLUTION SPEED SHOP — HOURS ARE UNKNOWN.
   The Enumclaw shop's hours are not published anywhere: the Google profile is
   unclaimed, the shop's own domain is an empty redirect, and the only hours on
   record belong to the old Auburn address. Nothing here is guessed.
   So this build carries NO live status anywhere — no header pill, no green/red
   dot, no day rows. The #visit band says "call to confirm" instead. Every day
   below is null purely so the shared clock has something valid to read; no
   element on the page consumes it. When Scott gives real hours, fill these in,
   put the pill back in the header and the day-row list back in #visit. */
var HOURS = {
  tz: 'America/Los_Angeles',          // Pacific, wherever the viewer is
  days: {
    0: null,                          // Sunday      — unknown
    1: null,                          // Monday      — unknown
    2: null,                          // Tuesday     — unknown
    3: null,                          // Wednesday   — unknown
    4: null,                          // Thursday    — unknown
    5: null,                          // Friday      — unknown
    6: null                           // Saturday    — unknown
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
  applyStatus(); setInterval(applyStatus,60000);
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

  /* ---------- inquiry: prepare a local note until live delivery is configured ---------- */
  var form=$('.contact-form'), ok=$('.form-success');
  if(form&&ok){
    var btn=$('button[type=submit]',form), keyEl=$('[name=access_key]',form), note=$('.project-note',form), help=$('.form-fine',form);
    btn.disabled=false;
    if(keyEl&&keyEl.value.trim()){btn.textContent='Send it to Scott';help.textContent='Your message goes directly to the shop.';}
    function feedback(message,error){ok.textContent=message;ok.classList.add('show');ok.setAttribute('role',error?'alert':'status');}
    form.addEventListener('submit',function(e){
      e.preventDefault();if(btn.disabled||!form.reportValidity())return;
      var key=keyEl?keyEl.value.trim():'';
      if(!key){
        var fields=new FormData(form);
        var body=['Project: '+(fields.get('topic')||''),'Name: '+(fields.get('name')||''),'Phone: '+(fields.get('phone')||''),'Email: '+(fields.get('email')||''),'',fields.get('msg')||''].join('\n');
        var area=$('textarea',note);area.value=body;note.hidden=false;
        function selectNote(){area.focus();area.select();feedback('Your note is ready below. Select and copy it for your conversation with Scott; nothing has been sent.',false);}
        if(navigator.clipboard&&navigator.clipboard.writeText){
          navigator.clipboard.writeText(body).then(function(){feedback('Project note copied. Keep it handy when you call Scott; nothing has been sent.',false);}).catch(selectNote);
        }else selectNote();
        return;
      }
      var label=btn.textContent;btn.disabled=true;btn.textContent='Sending…';
      var data={};new FormData(form).forEach(function(v,k){data[k]=v});data.subject='Project inquiry — Revolution Speed Shop';
      fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)})
        .then(function(r){if(!r.ok)throw new Error('send failed');return r.json()})
        .then(function(result){if(!result||!result.success)throw new Error('send failed');feedback('Message sent. Scott can reply using the contact details you provided.',false);btn.textContent='Message sent';})
        .catch(function(){btn.disabled=false;btn.textContent=label;feedback('Could not send just now. Call (206) 465-4881 instead.',true);});
    });
  }

  /* ---------- SIGNATURE GADGET — "Pop a hood" (rebuilt 2026-09-06) ----------
     Tap one of three real engine-bay photographs from Scott's own Google
     uploads; the big frame swaps to it and brings its own caption with it.
     One gesture, one visible payoff, nothing to read first, nothing to type.
     Every caption describes what is visibly in that photograph — no invented
     horsepower, no borrowed magazine specs. */
  var dImg=$('#detailImg'), dNum=$('#detailNum'), dTxt=$('#detailTxt'), picks=$$('.detail-pick');
  if(dImg&&dNum&&dTxt&&picks.length){
    // preload so the swap is instant on the first tap
    picks.forEach(function(b){var i=new Image();i.src=b.getAttribute('data-img')});
    picks.forEach(function(btn){
      btn.addEventListener('click',function(){
        if(btn.getAttribute('aria-pressed')==='true')return;
        picks.forEach(function(o){o.setAttribute('aria-pressed', o===btn?'true':'false')});
        dImg.src=btn.getAttribute('data-img');
        dImg.alt=btn.getAttribute('data-alt');
        dNum.textContent=btn.getAttribute('data-num');
        dTxt.textContent=btn.getAttribute('data-txt');
        dImg.classList.remove('swap');
        void dImg.offsetWidth;            // restart the fade
        dImg.classList.add('swap');
      });
    });
  }

})();
