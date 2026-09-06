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
    0: [10, 16],                      // Sunday      10 am – 4 pm   (last season's posted gate hours)
    1: null,                          // Monday      closed
    2: null,                          // Tuesday     closed
    3: null,                          // Wednesday   closed
    4: null,                          // Thursday    closed
    5: [10, 19],                      // Friday      10 am – sunset (19 ≈ late-Sept sunset, Pacific)
    6: [10, 19]                       // Saturday    10 am – sunset
  }
};

/* ------------------------------------------------------------
   SEASON CONFIG — this farm is only open for a few weeks a year.
   `dates` holds THIS YEAR'S open days as 'YYYY-MM-DD' strings, straight
   from the family. While it is empty the page says only that the season
   has not been announced and shows NO green/red light — a status light is
   never shown unless it can be true (STATUS LIGHT LAW).
   Fill current dates AND verify current daily hours, then set hoursVerified true.
   The band then goes green on an open day, red on a closed one,
   and the day rows light up with today.
   Reference: the last two seasons ran Fridays, Saturdays and Sundays from
   late September to late October. 2026 dates: not published yet.
   ------------------------------------------------------------ */
var SEASON = {
  year: 2026,
  openingLine: '2026 dates have not been announced.',
  hoursVerified: false,                // Do not activate a clock using last year's approximate sunset hours.
  dates: []                           // e.g. ['2026-09-25','2026-09-26','2026-09-27', …]
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
  /* ---------- season gate ----------
     No dates on file → one neutral line, no light, no lit day row.
     Dates on file → the normal green/red clock, scoped to the open days. */
  function pacificISO(p){
    var mm=p.mo+1, dd=p.d;
    return p.y+'-'+(mm<10?'0':'')+mm+'-'+(dd<10?'0':'')+dd;
  }
  function seasonState(p){
    var list=(SEASON&&SEASON.dates)||[];
    if(!list.length) return {known:false};
    if(!SEASON.hoursVerified) return {known:false,pending:'Call to confirm this season’s gate hours.'};
    return {known:true, today:list.indexOf(pacificISO(p))>-1, list:list};
  }
  function applyStatus(){
    var p=pacificNow(), se=seasonState(p);
    var sl=$('#statusLine'), st=$('#statusText');
    if(!se.known){
      if(sl&&st){sl.className='live-line is-pending';st.textContent=se.pending||SEASON.openingLine;}
      $$('#hoursList li').forEach(function(li){li.classList.remove('today')});
      return;
    }
    var s=computeStatus();
    if(!se.today){
      var next=se.list.filter(function(d){return d>=pacificISO(p)}).sort()[0];
      s={open:false,text:next?('Closed today · next open day '+next):'Season is over for this year'};
    }
    if(sl&&st){sl.className='live-line '+(s.open?'is-open':'is-closed');st.textContent=s.text;}
    $$('#hoursList li[data-days]').forEach(function(li){
      li.classList.toggle('today',se.today&&li.getAttribute('data-days').split(',').indexOf(String(p.day))>-1)});
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
    if(keyEl&&keyEl.value.trim()){btn.textContent='Send it to the farm';help.textContent='Your message goes directly to the shop.';}
    function feedback(message,error){ok.textContent=message;ok.classList.add('show');ok.setAttribute('role',error?'alert':'status');}
    form.addEventListener('submit',function(e){
      e.preventDefault();if(btn.disabled||!form.reportValidity())return;
      var key=keyEl?keyEl.value.trim():'';
      if(!key){
        var fields=new FormData(form);
        var body=['Visit: '+(fields.get('topic')||''),'Name: '+(fields.get('name')||''),'Phone: '+(fields.get('phone')||''),'Email: '+(fields.get('email')||''),'',fields.get('msg')||''].join('\n');
        var area=$('textarea',note);area.value=body;note.hidden=false;
        function selectNote(){area.focus();area.select();feedback('Your note is ready below. Select and copy it for your conversation with the farm; nothing has been sent.',false);}
        if(navigator.clipboard&&navigator.clipboard.writeText){
          navigator.clipboard.writeText(body).then(function(){feedback('Visit note copied. Keep it handy when you call the farm; nothing has been sent.',false);}).catch(selectNote);
        }else selectNote();
        return;
      }
      var label=btn.textContent;btn.disabled=true;btn.textContent='Sending…';
      var data={};new FormData(form).forEach(function(v,k){data[k]=v});data.subject='Visit inquiry — Williams Family Farm';
      fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)})
        .then(function(r){if(!r.ok)throw new Error('send failed');return r.json()})
        .then(function(result){if(!result||!result.success)throw new Error('send failed');feedback('Message sent. the farm can reply using the contact details you provided.',false);btn.textContent='Message sent';})
        .catch(function(){btn.disabled=false;btn.textContent=label;feedback('Could not send just now. Call (509) 948-3246 instead.',true);});
    });
  }

  /* ---------- TITLE CARDS THAT UNROLL ----------
     Every row header is the tap target; the chevron flips. Rows are
     independent (opening one never closes another — no hidden modes). */
  $$('#unroll .ur-head').forEach(function(btn){
    var li=btn.parentNode, panel=document.getElementById(btn.getAttribute('aria-controls'));
    function setOpen(open){li.classList.toggle('open',open);btn.setAttribute('aria-expanded',String(open));panel.setAttribute('aria-hidden',String(!open));panel.inert=!open;}
    setOpen(false);
    btn.addEventListener('click',function(){setOpen(!li.classList.contains('open'))});
  });

  /* ---------- SIGNATURE GADGET — THE PUMPKIN LAUNCHER ----------
     One tap on the launcher throws a pumpkin across the field; it lands and
     stays there. No inputs, no readout, no modes. Fully deterministic: six
     preset shots in a fixed order that repeats, so a replay is identical. */
  (function(){
    var stage=$('#stage'), cannon=$('#cannon'), flyer=$('#flyer'), field=$('#pumpkins');
    if(!stage||!cannon||!flyer||!field) return;

    // Six landing spots are deterministic fractions; measure the actual muzzle at each launch.
    var SHOTS=[
      {x:.62,apex:.24},{x:.80,apex:.16},{x:.47,apex:.34},
      {x:.90,apex:.22},{x:.56,apex:.13},{x:.73,apex:.30}
    ];
    var GROUND=.84, MAXPUMPKINS=6, FLIGHT=820;
    var shot=0, flying=false;
    var reduce=window.matchMedia('(prefers-reduced-motion:reduce)');

    function drop(fx,fy){
      var b=stage.getBoundingClientRect();
      var dot=document.createElement('span');
      dot.style.left=(fx*100)+'%';dot.style.top=(fy*100)+'%';
      field.appendChild(dot);
      var dots=field.querySelectorAll('span');
      for(var i=0;i<dots.length-MAXPUMPKINS;i++) field.removeChild(dots[i]);
      if(reduce.matches) return;
      var puff=document.createElement('i');
      puff.className='puff';
      puff.style.left=(fx*100)+'%';puff.style.top=(fy*100)+'%';
      field.appendChild(puff);
      setTimeout(function(){if(puff.parentNode)puff.parentNode.removeChild(puff)},520);
    }

    function launch(){
      if(flying) return;
      var s=SHOTS[shot % SHOTS.length];shot++;
      var box=stage.getBoundingClientRect(), muzzle=$('.muzzle',cannon).getBoundingClientRect();
      var start={x:(muzzle.left+muzzle.width/2-box.left)/box.width,y:(muzzle.top+muzzle.height/2-box.top)/box.height};
      cannon.classList.remove('fire'); void cannon.offsetWidth; cannon.classList.add('fire');
      if(reduce.matches){drop(s.x,GROUND);$('#launch-status').textContent='Pumpkin '+shot+' landed in the field.';return;}
      flying=true;cannon.setAttribute('aria-disabled','true');$('#launch-status').textContent='Pumpkin launched.';
      var svg=flyer.firstElementChild;
      // quadratic bezier control point that puts the apex at s.apex
      var cx=(start.x+s.x)/2, cy=2*s.apex-(start.y+GROUND)/2;
      var t0=null;
      flyer.classList.add('fly');
      function step(ts){
        if(!t0)t0=ts;
        var t=Math.min(1,(ts-t0)/FLIGHT);
        var u=1-t;
        var x=u*u*start.x+2*u*t*cx+t*t*s.x;
        var y=u*u*start.y+2*u*t*cy+t*t*GROUND;
        var b=stage.getBoundingClientRect();
        svg.style.transform='translate('+(x*b.width)+'px,'+(y*b.height)+'px) rotate('+(t*680)+'deg)';
        if(t<1){requestAnimationFrame(step);}
        else{flyer.classList.remove('fly');flying=false;cannon.setAttribute('aria-disabled','false');drop(s.x,GROUND);$('#launch-status').textContent='Pumpkin '+shot+' landed in the field.';}
      }
      requestAnimationFrame(step);
    }

    cannon.addEventListener('click',launch);

  })();

})();
