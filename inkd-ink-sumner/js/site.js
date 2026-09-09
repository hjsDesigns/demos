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
  // Ink'd Ink. — from the live Google panel (her own listing; the panel read
  // "Closed · Opens 12 PM" on 2026-09-08). Appointment only inside these hours.
  days: {
    0: [12, 21],                      // Sunday     12 – 9 pm
    1: [12, 21],                      // Monday     12 – 9 pm
    2: [12, 21],                      // Tuesday    12 – 9 pm
    3: [12, 21],                      // Wednesday  12 – 9 pm
    4: [12, 21],                      // Thursday   12 – 9 pm
    5: [12, 18],                      // Friday     12 – 6 pm
    6: [12, 18]                       // Saturday   12 – 6 pm
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

  /* ---------- unrolling title cards (#services) ----------
     The whole title row is the tap target; the chevron flips up. */
  $$('.roll .roll-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var roll = btn.parentNode;
      var open = !roll.classList.contains('open');
      roll.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* ---------- SIGNATURE GADGET — the work wall ----------
     Five labelled chips. Tap one: the wall rebuilds and the count under it
     changes. Tap the lit one again: everything comes back. Nothing to read
     first, nothing hidden, no second mode. */
  (function(){
    var wall = $('#works'); if(!wall) return;
    var chips = $$('.chipbar .chip');
    var items = $$('.work', wall);
    var tally = $('#workTally');
    var current = 'all';
    var lastCols = 0;
    var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

    /* Each piece's shape, straight off the <img> width/height attributes, so the
       layout is pure arithmetic — no measuring, no race with image loading. */
    items.forEach(function(fig, i){
      var im = fig.querySelector('img');
      var w = parseFloat(im && im.getAttribute('width')) || 4;
      var h = parseFloat(im && im.getAttribute('height')) || 5;
      fig._ratio = (h / w) + 0.18;        /* + the caption's share of the card */
      fig._i = i;
    });

    function label(n){ return n + (n === 1 ? ' piece showing' : ' pieces showing'); }
    function colCount(n){
      var w = window.innerWidth;
      var max = w >= 900 ? 3 : 2;
      return Math.max(1, Math.min(max, n));
    }

    /* Deal the visible pieces into the shortest column, tallest first (that's
       what keeps the columns level — filling in source order left a half-empty
       third column on the small filters). Each column is then put back into
       source order, so the wall still reads top-to-bottom the way it's written.
       Result: even columns, no dead space, and a two-piece filter fills the row
       instead of stacking in one corner (which is what CSS column-count did). */
    function layout(visible){
      var cols = colCount(visible.length);
      lastCols = cols;
      var boxes = [], heights = [], packs = [], i;
      wall.textContent = '';
      for(i = 0; i < cols; i++){
        var d = document.createElement('div');
        d.className = 'wcol';
        wall.appendChild(d); boxes.push(d); heights.push(0); packs.push([]);
      }
      visible.slice().sort(function(a, b){ return b._ratio - a._ratio || a._i - b._i; })
        .forEach(function(fig){
          var k = 0;
          for(i = 1; i < cols; i++){ if(heights[i] < heights[k] - 0.0001) k = i; }
          packs[k].push(fig);
          heights[k] += fig._ratio;
        });
      packs.forEach(function(pack, c){
        pack.sort(function(a, b){ return a._i - b._i; })
            .forEach(function(fig){ boxes[c].appendChild(fig); });
      });
    }

    function apply(cat){
      current = cat;
      var visible = items.filter(function(fig){
        return cat === 'all' || fig.getAttribute('data-cat') === cat;
      });
      items.forEach(function(fig){ fig.hidden = visible.indexOf(fig) === -1; });
      layout(visible);
      chips.forEach(function(c){ c.setAttribute('aria-pressed', c.getAttribute('data-cat') === cat ? 'true' : 'false'); });
      if(tally) tally.textContent = label(visible.length);
      if(!reduce){
        wall.classList.remove('is-filtering');
        void wall.offsetWidth;            /* restart the stagger */
        wall.classList.add('is-filtering');
      }
    }

    chips.forEach(function(c){
      c.addEventListener('click', function(){
        var cat = c.getAttribute('data-cat');
        apply(cat === current && cat !== 'all' ? 'all' : cat);
      });
    });

    var rt;
    window.addEventListener('resize', function(){
      clearTimeout(rt);
      rt = setTimeout(function(){
        var visible = items.filter(function(f){ return !f.hidden; });
        if(colCount(visible.length) !== lastCols) layout(visible);
      }, 180);
    });

    apply('all');
  })();

})();
