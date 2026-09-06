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
/* THUNDER RAIL STABLES — the hours posted on their own Facebook page.
   NOTE: this is a barn, not a shop. The page shows NO live open/closed light
   (no #statusLine, no #hdrLive in the markup) because the owner lives on site
   and lessons run by appointment — these rows exist so the 7-day table is
   complete and site.js can light today's row. Confirm with Kelly before
   go-live; see HANDOFF-CODEX.md. */
var HOURS = {
  tz: 'America/Los_Angeles',          // Pacific, wherever the viewer is
  days: {
    0: [9, 21],                       // Sunday      9 am – 9 pm
    1: [9, 21],                       // Monday      9 am – 9 pm
    2: [8, 21],                       // Tuesday     8 am – 9 pm
    3: [9, 21],                       // Wednesday   9 am – 9 pm
    4: [8, 19],                       // Thursday    8 am – 7 pm
    5: [9, 21],                       // Friday      9 am – 9 pm
    6: [9, 21]                        // Saturday    9 am – 9 pm
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

  /* ---------- TITLE CARDS UNROLL ----------
     The heading IS the tap target; the chevron flips up (ARROW LAW).
     Cards open independently — no accordion, nothing closes behind you. */
  function setRoll(roll, open){
    var head=$('.roll-head',roll), body=$('.roll-body',roll);
    if(!head||!body)return;
    roll.classList.toggle('open',open);
    head.setAttribute('aria-expanded',open?'true':'false');
    body.hidden=!open;
  }
  $$('.roll').forEach(function(roll){
    var head=$('.roll-head',roll);
    if(!head)return;
    setRoll(roll,false);
    head.addEventListener('click',function(){setRoll(roll,!roll.classList.contains('open'))});
  });

  /* ---------- SIGNATURE GADGET — "which program fits" ----------
     Tap a picture, get a route. Deliberately does NOT restate the program's
     details (those live once, in the cards above): the payoff is one line and
     a button that scrolls to the matching card and opens it. Tap again clears. */
  var PICKS={
    kid:{
      title:'Start with a lesson.',
      line:'Ask about current camp dates and the school-year homeschool club, too.',
      go:'roll-lessons', label:'Open riding lessons'
    },
    adult:{
      title:'Lessons, whatever your level.',
      line:'Beginners through advanced, in whichever discipline you want to learn.',
      go:'roll-lessons', label:'Open riding lessons'
    },
    owner:{
      title:'Bring the horse.',
      line:'Full, partial and self care, plus training — and haul-ins are welcome if you just want the arena.',
      go:'roll-boarding', label:'Open boarding & training'
    }
  };
  var out=$('#pickerOut'), picks=$$('.pick');
  var IDLE='<p class="picker-idle">Pick a picture and we’ll point you at the right program.</p>';
  function clearPicks(){
    picks.forEach(function(b){b.setAttribute('aria-pressed','false')});
    out.classList.remove('has'); out.innerHTML=IDLE;
  }
  if(out&&picks.length){
    picks.forEach(function(btn){
      btn.addEventListener('click',function(){
        var key=btn.getAttribute('data-pick'), data=PICKS[key];
        if(!data)return;
        if(btn.getAttribute('aria-pressed')==='true'){clearPicks();return}   // tap again clears
        picks.forEach(function(b){b.setAttribute('aria-pressed',b===btn?'true':'false')});
        out.classList.add('has');
        out.innerHTML='<h3>'+data.title+'</h3><p>'+data.line+'</p>'+
          '<a class="btn btn-primary" href="#'+data.go+'" data-go="'+data.go+'">'+data.label+' ↓</a>';
        var go=$('[data-go]',out);
        if(go) go.addEventListener('click',function(event){
          var target=document.getElementById(data.go);
          if(target){event.preventDefault();setRoll(target,true);target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});$('.roll-head',target).focus({preventScroll:true});} // carry keyboard focus to the opened program
        });
      });
    });
  }

})();
