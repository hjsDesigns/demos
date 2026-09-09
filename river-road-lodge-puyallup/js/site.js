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
/* RIVER ROAD LODGE — hours confirmed 2026-09-06 from the Restaurantji listing
   for this address (filed under the old `rnr-lounge` slug, listing name
   "River Road Lodge", page updated Aug 17 2026), JSON-LD openingHours:
   Mo/Tu 12:00-24:00 · We/Th/Fr 12:00-2:00 · Sa 9:00-2:00 · Su 9:00-24:00.
   Google's own hours agree. Closes past midnight = 26 (2 AM). */
var HOURS = {
  tz: 'America/Los_Angeles',          // Pacific, wherever the viewer is
  days: {
    0: [9, 24],                       // Sunday      9:00 AM – 12:00 AM
    1: [12, 24],                      // Monday     12:00 PM – 12:00 AM
    2: [12, 24],                      // Tuesday    12:00 PM – 12:00 AM
    3: [12, 26],                      // Wednesday  12:00 PM –  2:00 AM
    4: [12, 26],                      // Thursday   12:00 PM –  2:00 AM
    5: [12, 26],                      // Friday     12:00 PM –  2:00 AM
    6: [9, 26]                        // Saturday    9:00 AM –  2:00 AM
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

  /* ---------- SIGNATURE GADGET: THE DART BOARD ----------
     Their fascia sign reads BAR - DARTS - POOL. Bar and pool each have a
     photograph on this page; no frame in the harvest shows the board, so the
     board is built here instead. One gesture: tap it. A dart sticks where you
     tapped, the wedge lights, the number reads out. Three darts shows the
     total; the next tap clears. Nothing typed, no legend, no prize. */
  (function(){
    var svg=$('#dartBoard'); if(!svg) return;
    var numEl=$('#dartNum'), lblEl=$('#dartLbl'), pipEl=$('#dartPips');
    var NS='http://www.w3.org/2000/svg';
    var ORDER=[20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];
    var C=200, R_OUT=176, R_NUM=186, R_DBL_O=170, R_DBL_I=158,
        R_TRP_O=104, R_TRP_I=92, R_BULL_O=17, R_BULL_I=7;
    var css=getComputedStyle(document.documentElement);
    function tok(n,f){var v=css.getPropertyValue(n).trim(); return v||f}
    var DARK=tok('--bg-2','#100C0A'), BONE=tok('--ink','#F3E9DE'),
        ORANGE=tok('--brand','#E9611F'), NEON=tok('--neon','#FF2E4C'),
        LINE=tok('--line','#3A2C25');

    function pt(r,deg){var a=(deg-90)*Math.PI/180; return [C+r*Math.cos(a), C+r*Math.sin(a)]}
    function ring(r0,r1,a0,a1){
      var p0=pt(r1,a0),p1=pt(r1,a1),p2=pt(r0,a1),p3=pt(r0,a0);
      return 'M'+p0+'A'+r1+' '+r1+' 0 0 1 '+p1+'L'+p2+'A'+r0+' '+r0+' 0 0 0 '+p3+'Z';
    }
    function add(tag,attrs,cls){
      var e=document.createElementNS(NS,tag);
      for(var k in attrs) e.setAttribute(k,attrs[k]);
      if(cls) e.setAttribute('class',cls);
      svg.appendChild(e); return e;
    }
    function seg(g,a0,a1,r0,r1,fill){
      var e=document.createElementNS(NS,'path');
      e.setAttribute('d',ring(r0,r1,a0,a1)); e.setAttribute('fill',fill);
      g.appendChild(e); return e;
    }
    add('circle',{cx:C,cy:C,r:198,fill:DARK,stroke:LINE});
    var segs={};
    for(var i=0;i<20;i++){
      var a0=i*18-9, a1=i*18+9, n=ORDER[i], odd=(i%2===1);
      var body=odd?BONE:DARK, ringc=odd?ORANGE:NEON;
      var g=add('g',{},'wedge');
      seg(g,a0,a1,R_TRP_O,R_DBL_I,body); seg(g,a0,a1,R_BULL_O,R_TRP_I,body);
      seg(g,a0,a1,R_DBL_I,R_DBL_O,ringc); seg(g,a0,a1,R_TRP_I,R_TRP_O,ringc);
      segs[n]=g;
      var np=pt(R_NUM,i*18);
      add('text',{x:np[0],y:np[1]},'num').textContent=n;
    }
    add('circle',{cx:C,cy:C,r:R_BULL_O,fill:NEON});
    add('circle',{cx:C,cy:C,r:R_BULL_I,fill:ORANGE});
    add('circle',{cx:C,cy:C,r:R_DBL_O,fill:'none',stroke:LINE,'stroke-width':1});

    var darts=[], scores=[], lit=null;
    function clear(){
      darts.forEach(function(d){d.parentNode&&d.parentNode.removeChild(d)});
      darts=[]; scores=[]; pipEl.innerHTML='';
      if(lit){lit.classList.remove('lit'); lit=null}
      numEl.textContent='—'; numEl.classList.remove('is-miss');
      lblEl.textContent='Tap the board. That’s your dart.';
    }
    function stick(x,y){
      var g=document.createElementNS(NS,'g');
      g.setAttribute('transform','translate('+x.toFixed(1)+','+y.toFixed(1)+')');
      g.innerHTML='<g class="dart">'+
        '<line x1="0" y1="0" x2="20" y2="-29" stroke="'+DARK+'" stroke-width="7" stroke-linecap="round"/>'+
        '<line x1="0" y1="0" x2="20" y2="-29" stroke="'+BONE+'" stroke-width="4" stroke-linecap="round"/>'+
        '<polygon points="20,-29 36,-35 29,-48 15,-38" fill="'+ORANGE+'" stroke="'+DARK+'" stroke-width="2" stroke-linejoin="round"/>'+
        '<circle cx="0" cy="0" r="4.4" fill="'+NEON+'" stroke="'+DARK+'" stroke-width="1.6"/></g>';
      svg.appendChild(g); darts.push(g);
    }
    function throwAt(x,y){
      if(scores.length>=3){clear(); return}
      var dx=x-C, dy=y-C, r=Math.sqrt(dx*dx+dy*dy);
      var a=(Math.atan2(dy,dx)*180/Math.PI+90+360)%360;
      var n=ORDER[Math.floor((a+9)/18)%20], score=0, label='Missed the board';
      if(r<=R_BULL_I){score=50; label='Bullseye'}
      else if(r<=R_BULL_O){score=25; label='Outer bull'}
      else if(r>R_OUT){score=0; label='Off the board'}
      else if(r>=R_DBL_I&&r<=R_DBL_O){score=n*2; label='Double '+n}
      else if(r>=R_TRP_I&&r<=R_TRP_O){score=n*3; label='Treble '+n}
      else {score=n; label=String(n)}
      stick(x,y);
      if(lit) lit.classList.remove('lit');
      if(score&&r<=R_OUT&&r>R_BULL_O){lit=segs[n]; lit.classList.add('lit')} else {lit=null}
      scores.push(score);
      var pip=document.createElement('i'); pip.textContent=score; pipEl.appendChild(pip);
      numEl.textContent=score; numEl.classList.toggle('is-miss',score===0);
      lblEl.textContent=label;
      if(scores.length===3){
        var t=scores.reduce(function(a,b){return a+b},0);
        numEl.textContent=t; numEl.classList.remove('is-miss');
        lblEl.textContent='Three darts · tap to clear';
      }
    }
    function local(ev){
      var b=svg.getBoundingClientRect(), s=400/b.width;
      return [(ev.clientX-b.left)*s, (ev.clientY-b.top)*s];
    }
    svg.addEventListener('click',function(ev){var p=local(ev); throwAt(p[0],p[1])});
    svg.addEventListener('keydown',function(ev){
      if(ev.key!=='Enter'&&ev.key!==' ') return;
      ev.preventDefault();
      var a=Math.random()*360, r=Math.random()*R_DBL_O, p=pt(r,a);
      throwAt(p[0],p[1]);
    });
    clear();
  })();

})();
