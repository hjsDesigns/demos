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
  tz: 'America/Los_Angeles',
  days: {
    0: [11, 22],   // Sunday     11 AM - 10 PM
    1: [11, 22],   // Monday
    2: [11, 22],   // Tuesday
    3: [11, 22],   // Wednesday
    4: [11, 24],   // Thursday   to midnight
    5: [11, 26],   // Friday     to 2 AM
    6: [11, 26]    // Saturday   to 2 AM
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
  function pacificNow(){
    var parts=new Intl.DateTimeFormat('en-US',{timeZone:HOURS.tz,weekday:'short',year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',hour12:false}).formatToParts(new Date());
    var o={};parts.forEach(function(p){o[p.type]=p.value});
    var days={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
    var h=parseInt(o.hour,10)%24, m=parseInt(o.minute,10);
    return {day:days[o.weekday], h:h+m/60, y:parseInt(o.year,10), mo:parseInt(o.month,10)-1, d:parseInt(o.day,10)};
  }
  function fmt(h){h=h%24;var ap=h>=12?'pm':'am';var hh=Math.floor(h)%12;if(hh===0)hh=12;var mm=Math.round((h%1)*60);if(mm===60){mm=0;hh=(hh%12)+1}return hh+(mm?':'+(mm<10?'0':'')+mm:'')+' '+ap}
  function dayName(d){return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d]}
  function hoursFor(day){return HOURS.days[day]||null}

  function computeStatus(){return {open:null,unknown:true,text:'Call to confirm bar and kitchen hours'};}
  function applyStatus(){
    var s=computeStatus(), p=pacificNow();
    var hp=$('#hdrLive'), ht=$('#hdrLiveText');
    if(hp&&ht){hp.className='hdr-live '+(s.open?'is-open':'is-closed');ht.innerHTML=(s.open?'Open':'Closed')+' <span class="txt-long">· '+s.text.replace(/^Open now · /,'').replace(/^Closed · /,'')+'</span>';}
    var sl=$('#statusLine'), st=$('#statusText');
    if(sl&&st){sl.className='live-line '+(s.unknown?'is-unknown':(s.open?'is-open':'is-closed'));st.textContent=s.text;}
    $$('#hoursList li[data-days]').forEach(function(li){li.classList.toggle('today',li.getAttribute('data-days').split(',').indexOf(String(p.day))>-1)});
  }
  applyStatus(); setInterval(applyStatus,60000);
  window.__site={pacificNow:pacificNow,computeStatus:computeStatus,HOURS:HOURS}; // handy in the console

  /* ---------- scroll-reveal + count-up ---------- */
  if('IntersectionObserver' in window){
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
  }

  /* ---------- contact form ----------
     Demo mode (hidden access_key empty): explain that nothing was sent.
     Live mode (key filled at go-live by pages-golive.sh): POST to Web3Forms from the visitor's
     browser -> lands in the owner's inbox. Failure falls back to "call or text us". */
  var form=$('.contact-form'), ok=$('.form-success');
  if(form&&ok){var configured=form.querySelector('[name=access_key]');if(configured&&configured.value.trim()){form.querySelector('button[type=submit]').disabled=false;form.querySelector('button[type=submit]').textContent='Send message';}
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var btn=form.querySelector('button[type=submit]'), keyEl=form.querySelector('[name=access_key]'), key=keyEl?keyEl.value.trim():'';
    function done(){ok.textContent='Message sent. Thank you.';ok.classList.add('show');ok.setAttribute('role','status');btn.disabled=true}
    if(!key){ok.textContent='Message not sent. Please use the phone link to contact the business.';ok.classList.add('show');ok.setAttribute('role','status');return}
    var label=btn.textContent; btn.disabled=true; btn.textContent='Sending\u2026';
    var data={}; new FormData(form).forEach(function(v,k){data[k]=v});
    data.subject=data.subject||('New message from your website ('+document.title+')');
    fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)})
      .then(function(r){return r.json()}).then(function(j){if(j&&j.success){done()}else{throw new Error('send failed')}})
      .catch(function(){btn.disabled=false;btn.textContent=label;ok.textContent='Couldn\u2019t send just now \u2014 call or text us instead.';ok.classList.add('show');ok.setAttribute('role','alert')});
  })}

  /* Reviews: 40 px/s; real cards only, with inert visual copies for the loop.
     Hover, keyboard focus and touch pause. Reduced motion keeps a scrollable strip. */
  (function(){
    var rb=$('#ribbon'), track=rb&&$('.ribbon-track',rb), PPS=40;
    if(!track) return;
    var media=window.matchMedia('(prefers-reduced-motion:reduce)');
    var original=document.createElement('div'); original.className='review-segment';
    $$('.rev',track).forEach(function(card){original.appendChild(card)});
    track.replaceChildren(original);
    function build(){
      $$('.review-copy',track).forEach(function(n){n.remove()});
      rb.classList.remove('gliding'); track.style.transform='';
      rb.scrollLeft=0;
      var cards=$$('.rev',original), width=original.getBoundingClientRect().width;
      if(media.matches||cards.length<2||!width) return;
      var copies=Math.ceil(rb.clientWidth/width)+1;
      for(var n=0;n<copies;n++){
        var copy=original.cloneNode(true); copy.classList.add('review-copy');
        copy.setAttribute('aria-hidden','true'); copy.setAttribute('inert','');
        $$('[id]',copy).forEach(function(el){el.removeAttribute('id')});
        $$('img',copy).forEach(function(img){img.alt='';img.loading='eager'});
        track.appendChild(copy);
      }
      track.style.setProperty('--review-distance',width+'px');
      track.style.setProperty('--review-duration',(width/PPS)+'s');
      rb.classList.add('gliding');
    }
    var frame;
    function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(build)}
    $$('.rev-face',original).forEach(function(img){
      img.loading='eager';
      function drop(){var card=img.closest('.rev');if(card)card.remove();schedule()}
      img.addEventListener('error',drop,{once:true});
      if(img.complete&&!img.naturalWidth) drop();
    });
    ['touchstart','touchmove'].forEach(function(event){rb.addEventListener(event,function(){rb.classList.add('held')},{passive:true})});
    ['touchend','touchcancel'].forEach(function(event){rb.addEventListener(event,function(){rb.classList.remove('held')},{passive:true})});
    document.addEventListener('visibilitychange',function(){rb.classList.toggle('page-hidden',document.hidden)});
    if(media.addEventListener) media.addEventListener('change',schedule);
    else media.addListener(schedule);
    if('ResizeObserver' in window){var observer=new ResizeObserver(schedule);observer.observe(rb);observer.observe(original)}
    else window.addEventListener('resize',schedule);
    window.addEventListener('load',schedule);
    if(document.fonts&&document.fonts.ready) document.fonts.ready.then(schedule);
    build();
  })();

  /* ---------- SIGNATURE GADGET ----------
     Per-client interactive code goes below this line (EA: day timeline +
     rate calculator). Keep it inside this IIFE so it can use $ / $$ / pacificNow. */

})();
