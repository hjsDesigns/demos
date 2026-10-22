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
  days: {   // Google Business panel, read 2026-10-21 (matches RestaurantGuru + Restaurantji). Ask-client: Placejoys says 8 pm, Apple 7 pm.
    0: [6, 16],                       // Sunday     6 am – 4 pm
    1: [6, 15],                       // Monday     6 am – 3 pm
    2: [6, 17],                       // Tuesday    6 am – 5 pm
    3: [6, 17],                       // Wednesday
    4: [6, 17],                       // Thursday
    5: [6, 17],                       // Friday
    6: [6, 17]                        // Saturday
  }};

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

  /* ---------- reviews: manual, native-swipe carousel; real faces required ----------
     No autoplay, clones, or wraparound. A failed real avatar removes its card;
     if every avatar fails, the live Google reviews link takes over. */
  var reviews=$('#reviews'), reviewCarousel=reviews&&$('.review-carousel',reviews);
  var reviewTrack=reviewCarousel&&$('.review-track',reviewCarousel);
  if(reviewTrack){
    var reviewControls=$('.review-controls',reviewCarousel);
    var reviewPrev=$('.review-prev',reviewCarousel), reviewNext=$('.review-next',reviewCarousel);
    var reviewDots=$('.review-dots',reviewCarousel), reviewPosition=$('.review-position',reviewCarousel);
    var reviewFallback=$('.rev-linkout',reviews), reviewCards=$$('.rev',reviewTrack);
    var reviewIndex=0, reviewScrollFrame=0;

    function reviewLeft(card){
      return reviewTrack.scrollLeft+card.getBoundingClientRect().left-
        reviewTrack.getBoundingClientRect().left-reviewTrack.clientLeft;
    }
    function setReview(index){
      reviewIndex=Math.max(0,Math.min(index,reviewCards.length-1));
      if(reviewPrev) reviewPrev.disabled=reviewIndex===0;
      if(reviewNext) reviewNext.disabled=reviewIndex>=reviewCards.length-1;
      if(reviewDots) $$('button[data-review-index]',reviewDots).forEach(function(dot,i){
        if(i===reviewIndex) dot.setAttribute('aria-current','true');
        else dot.removeAttribute('aria-current');
      });
      var position=reviewCards.length?(reviewIndex+1)+' / '+reviewCards.length:'0 / 0';
      if(reviewPosition&&reviewPosition.textContent!==position) reviewPosition.textContent=position;
    }
    function goToReview(index,instant){
      if(!reviewCards.length)return;
      setReview(index);
      var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      reviewTrack.scrollTo({left:reviewLeft(reviewCards[reviewIndex]),behavior:instant||reduce?'instant':'smooth'});
    }
    function refreshReviews(preferredCard,align){
      reviewCards=$$('.rev',reviewTrack);
      reviewCards.forEach(function(card,i){card.setAttribute('aria-label',(i+1)+' of '+reviewCards.length)});
      if(reviewDots&&$$('button[data-review-index]',reviewDots).length!==reviewCards.length){
        var focusedDot=document.activeElement, restoreDotFocus=reviewDots.contains(focusedDot);
        reviewDots.textContent='';
        reviewCards.forEach(function(card,i){
          var dot=document.createElement('button');
          dot.type='button';dot.setAttribute('data-review-index',String(i));
          dot.setAttribute('aria-controls',reviewTrack.id);dot.setAttribute('aria-label','Go to review '+(i+1));
          reviewDots.appendChild(dot);
        });
      }
      var preferredIndex=preferredCard?reviewCards.indexOf(preferredCard):-1;
      setReview(preferredIndex>=0?preferredIndex:reviewIndex);
      var loaded=reviewCards.filter(function(card){var img=$('.rev-face',card);return img&&img.complete&&img.naturalWidth>0}).length;
      if(reviewControls) reviewControls.hidden=loaded<2;
      reviewCarousel.hidden=reviewCards.length===0;
      if(reviewFallback){reviewFallback.hidden=reviewCards.length>0;if(!reviewCards.length)reviewFallback.classList.add('in')}
      if(align&&reviewCards.length)goToReview(reviewIndex,true);
      if(restoreDotFocus){
        if(reviewControls&&!reviewControls.hidden){$$('button[data-review-index]',reviewDots)[reviewIndex].focus()}
        else if(reviewCards.length)reviewTrack.focus();
        else if(reviewFallback){var link=$('a',reviewFallback);if(link)link.focus()}
      }
    }
    if(reviewPrev) reviewPrev.addEventListener('click',function(){goToReview(reviewIndex-1,false)});
    if(reviewNext) reviewNext.addEventListener('click',function(){goToReview(reviewIndex+1,false)});
    if(reviewDots) reviewDots.addEventListener('click',function(e){
      var dot=e.target.closest('button[data-review-index]');
      if(dot&&reviewDots.contains(dot))goToReview(parseInt(dot.getAttribute('data-review-index'),10),false);
    });
    reviewTrack.addEventListener('keydown',function(e){
      if(e.target!==reviewTrack||e.altKey||e.ctrlKey||e.metaKey)return;
      var target=reviewIndex;
      if(e.key==='ArrowLeft')target--;
      else if(e.key==='ArrowRight')target++;
      else if(e.key==='Home')target=0;
      else if(e.key==='End')target=reviewCards.length-1;
      else return;
      e.preventDefault();goToReview(target,false);
    });
    reviewTrack.addEventListener('scroll',function(){
      if(reviewScrollFrame)return;
      reviewScrollFrame=requestAnimationFrame(function(){
        reviewScrollFrame=0;
        var nearest=0, distance=Infinity;
        reviewCards.forEach(function(card,i){
          var delta=Math.abs(reviewLeft(card)-reviewTrack.scrollLeft);
          if(delta<distance){distance=delta;nearest=i}
        });
        setReview(nearest);
      });
    },{passive:true});
    window.addEventListener('resize',function(){goToReview(reviewIndex,true)});
    reviewCards.forEach(function(card){
      var img=$('.rev-face',card);
      function drop(){
        if(!card.parentNode)return;
        var selectedCard=reviewCards[reviewIndex];
        console.error('REVIEW ATTRIBUTION LAW: reviewer avatar failed to load ('+(img?img.getAttribute('src'):'missing image')+
          ') — that review card was removed. Re-harvest the real profile photo, use a different '+
          'attributable review, or ship .rev-linkout. Never substitute initials or a stock face.');
        card.parentNode.removeChild(card);refreshReviews(selectedCard,true);
      }
      if(!img){drop();return}
      // Load all small profile photos even when their cards start off screen.
      img.loading='eager';
      img.addEventListener('error',drop,{once:true});
      img.addEventListener('load',function(){refreshReviews(null,false)},{once:true});
      if(img.complete&&img.naturalWidth===0)drop();
    });
    refreshReviews(null,false);
  }

  /* ---------- SIGNATURE GADGET ---------- */
  /* What's in a name? — tap a house-favorite's name, the card above shows what's on the plate + price.
     Tap the same name again to clear. One gesture, instant payoff (TODDLER LAW). */
  var chips=$$('#nameChips button'), card=$('#plateCard');
  if(card&&chips.length){
    chips.forEach(function(b){b.addEventListener('click',function(){
      var on=b.getAttribute('aria-pressed')==='true';
      chips.forEach(function(x){x.setAttribute('aria-pressed','false')});
      if(on){card.classList.remove('on');return}
      b.setAttribute('aria-pressed','true');
      $('#plateName').textContent=b.textContent;
      $('#platePrice').textContent=b.getAttribute('data-price');
      $('#plateDesc').textContent=b.getAttribute('data-desc');
      card.classList.remove('on');void card.offsetWidth;card.classList.add('on');
    })});
  }
  /* (end signature)
     Per-client interactive code goes below this line (EA: day timeline +
     rate calculator). Keep it inside this IIFE so it can use $ / $$ / pacificNow. */

})();
