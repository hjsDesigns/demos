/* ============================================================
   COMBAT SPORT & FITNESS — site.js
   Nav toggle · live open/closed clock (Pacific) · scroll-reveal ·
   contact form · the CLASS SCHEDULE (single source of truth for the
   schedule board, the "tonight on the mats" timeline and the header) ·
   fight-night countdown · program unroll · schedule filter.
   ============================================================ */

/* ---------- DOOR HOURS — from the gym's Google listing (Sept 2026) ---------- */
var HOURS = {
  tz: 'America/Los_Angeles',
  days: {
    0: null,          // Sunday — closed
    1: [17, 20],      // Monday 5–8 pm
    2: [17, 20],      // Tuesday
    3: [17, 20],      // Wednesday
    4: [17, 20],      // Thursday
    5: [17, 20.5],    // Friday 5–8:30 pm
    6: [11, 12.5]     // Saturday 11 am–12:30 pm
  }
};
function customClosure(p){ return null; }
function customClose(p, close){ return close; }

/* ---------- THE WEEKLY CLASS SCHEDULE — from combatsportfitness.com/schedule-1 ----------
   days: 0=Sun … 6=Sat · start in decimal hours · dur in minutes (published where the
   gym publishes it; MMA/open mat use 60/90 only to know when "now" ends). */
var SCHEDULE = [
  { id:'kids', name:'Kids Jiu-Jitsu',         type:'kids', days:[1,3,5], start:17,  dur:55, note:'ages roughly 5 and up · gi' },
  { id:'gi',   name:'Adult Gi Jiu-Jitsu',     type:'gi',   days:[1,3,5], start:18,  dur:90, note:'all levels' },
  { id:'nogi', name:'Adult No-Gi Jiu-Jitsu',  type:'nogi', days:[4],     start:18,  dur:90, note:'all levels' },
  { id:'mma',  name:'MMA',                    type:'mma',  days:[2,4],   start:17,  dur:60, note:'invite only' },
  { id:'open', name:'BJJ Open Mat',           type:'open', days:[6],     start:11,  dur:90, note:'rotating locations — ask a coach' }
];

/* ---------- NEXT FIGHT NIGHT — from the gym's own Instagram post (Aug 12, 2026) ---------- */
var NEXT_FIGHT = { when:'2026-09-19T19:00:00-07:00', label:'Excite Fight · Muckleshoot Casino Resort' };

(function(){
  'use strict';
  document.documentElement.classList.add('js');
  var $=function(s,r){return (r||document).querySelector(s)};
  var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};

  /* ---------- mobile nav ---------- */
  var toggle=$('.nav-toggle'), nav=$('#main-nav');
  function setNav(open){nav.classList.toggle('open',open);toggle.setAttribute('aria-expanded',open?'true':'false');toggle.textContent=open?'✕':'☰'}
  if(toggle&&nav){
    toggle.addEventListener('click',function(e){e.stopPropagation();setNav(!nav.classList.contains('open'))});
    $$('#main-nav a').forEach(function(a){a.addEventListener('click',function(){setNav(false)})});
    document.addEventListener('click',function(e){if(nav.classList.contains('open')&&!nav.contains(e.target)&&e.target!==toggle)setNav(false)});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&nav.classList.contains('open')){setNav(false);toggle.focus()}});
  }
  var y=$('#year'); if(y) y.textContent=new Date().getFullYear();

  /* ---------- Pacific time, wherever the viewer is (?demo=18.5&day=3 freezes the clock for pitches) ---------- */
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
    var yd=(d+6)%7, yh=hoursFor(yd);
    if(yh&&yh[1]>24&&h<yh[1]-24) return {open:true,text:'Open now · til '+fmt(yh[1])};
    var today=hoursFor(d);
    if(today){
      var close=customClose(p,today[1]);
      if(h>=today[0]&&h<close) return {open:true,text:'Open now · til '+fmt(close)};
      if(h<today[0]) return {open:false,text:'Opens today at '+fmt(today[0])};
    }
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

  /* ---------- scroll-reveal ---------- */
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(en){if(!en.isIntersecting)return;en.target.classList.add('in');io.unobserve(en.target)});
  },{threshold:.06,rootMargin:'0px 0px -6% 0px'});
  $$('.reveal').forEach(function(el){io.observe(el)});

  /* ---------- contact form (demo mode until go-live wires the key) ---------- */
  var form=$('.contact-form'), ok=$('.form-success');
  if(form&&ok){form.addEventListener('submit',function(e){
    e.preventDefault();
    var btn=form.querySelector('button[type=submit]'), keyEl=form.querySelector('[name=access_key]'), key=keyEl?keyEl.value.trim():'';
    function done(){ok.classList.add('show');ok.setAttribute('role','status');btn.disabled=true}
    if(!key){done();return}
    var label=btn.textContent; btn.disabled=true; btn.textContent='Sending…';
    var data={}; new FormData(form).forEach(function(v,k){data[k]=v});
    data.subject=data.subject||('New message from your website ('+document.title+')');
    fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)})
      .then(function(r){return r.json()}).then(function(j){if(j&&j.success){done()}else{throw new Error('send failed')}})
      .catch(function(){btn.disabled=false;btn.textContent=label;ok.textContent='Couldn’t send just now — call us instead.';ok.classList.add('show');ok.setAttribute('role','alert')});
  })}

  /* ============================================================
     TONIGHT ON THE MATS — today's classes from SCHEDULE, clock-driven:
     done rows dimmed, the one running lit "happening now", the next one
     tagged "up next". Home page only (#dayLine).
     ============================================================ */
  function todaysClasses(day){
    return SCHEDULE.filter(function(c){return c.days.indexOf(day)>-1}).sort(function(a,b){return a.start-b.start});
  }
  function renderDayLine(){
    var ul=$('#dayLine'); if(!ul) return;
    var p=pacificNow(), list=todaysClasses(p.day), head=$('#dayHead');
    if(head) head.innerHTML='<b>'+dayName(p.day)+'</b><span>'+(list.length?list.length+' class'+(list.length>1?'es':'')+' today':'no classes today')+'</span>';
    if(!list.length){
      // next day with a class
      var nx=null; for(var i=1;i<=7&&!nx;i++){var nd=(p.day+i)%7;var l=todaysClasses(nd);if(l.length)nx={day:nd,first:l[0],i:i}}
      ul.innerHTML=''; var wrap=$('#dayEmpty'); if(wrap){wrap.hidden=false; wrap.innerHTML='<b>Rest day</b>'+(nx?('Next up: '+nx.first.name+' '+(nx.i===1?'tomorrow':dayName(nx.day))+' at '+fmt(nx.first.start)+'.'):'')}
      return;
    }
    var wrap2=$('#dayEmpty'); if(wrap2) wrap2.hidden=true;
    var nowFound=false, nextFound=false;
    ul.innerHTML=list.map(function(c){
      var end=c.start+c.dur/60, cls='', tag='';
      if(p.h>=end){cls='done'}
      else if(p.h>=c.start){cls='now';tag='<span class="tag">Happening now</span>';nowFound=true}
      else if(!nextFound){cls='next';tag='<span class="tag">Up next</span>';nextFound=true}
      return '<li class="'+cls+'"><span class="n">'+c.name+tag+'</span><span class="t">'+fmt(c.start)+'</span><span class="d">'+c.note+'</span></li>';
    }).join('');
  }
  renderDayLine(); setInterval(renderDayLine,60000);

  /* ============================================================
     THE WEEK BOARD (schedule.html): built from SCHEDULE so it can never
     disagree with the timeline. Today's column + the running slot lit.
     One-tap filter: tap a class type → only those light up; tap again → all.
     ============================================================ */
  var week=$('#week');
  if(week){
    var p0=pacificNow();
    var order=[1,2,3,4,5,6,0];
    week.innerHTML=order.map(function(d){
      var list=todaysClasses(d);
      var slots=list.map(function(c){
        var end=c.start+c.dur/60, now=(d===p0.day&&p0.h>=c.start&&p0.h<end);
        return '<div class="slot'+(now?' now':'')+'" data-type="'+c.type+'"><b>'+c.name+'</b><span>'+fmt(c.start)+(c.dur&&c.type!=='mma'&&c.type!=='open'?' · '+c.dur+' min':'')+'</span>'+(c.type==='mma'||c.type==='open'?'<i>'+c.note+'</i>':'')+'</div>';
      }).join('');
      var doors=hoursFor(d);
      return '<div class="wday'+(d===p0.day?' today':'')+'"><h3>'+dayName(d).slice(0,3)+(d===p0.day?'<small>today</small>':'')+'</h3>'+(slots||'<div class="rest">no classes</div>')+(doors?'<div class="rest">doors '+fmt(doors[0])+' – '+fmt(doors[1])+'</div>':'')+'</div>';
    }).join('');
    var active=null;
    $$('.filter button').forEach(function(b){
      b.addEventListener('click',function(){
        var t=b.getAttribute('data-type');
        active=(active===t)?null:t;
        $$('.filter button').forEach(function(x){x.classList.toggle('on',x.getAttribute('data-type')===active);x.setAttribute('aria-pressed',x.getAttribute('data-type')===active?'true':'false')});
        week.classList.toggle('filtered',!!active);
        $$('.slot',week).forEach(function(s){s.classList.toggle('hit',!!active&&s.getAttribute('data-type')===active)});
      });
    });
  }

  /* ============================================================
     PROGRAM CARDS UNROLL (classes.html) — the headline is the tap target,
     a downward chevron that flips (Arrow Law). Multiple can be open.
     ============================================================ */
  $$('.program h2 button').forEach(function(b){
    b.addEventListener('click',function(){
      var card=b.closest('.program'), open=!card.classList.contains('open');
      card.classList.toggle('open',open); b.setAttribute('aria-expanded',open?'true':'false');
    });
  });

  /* ============================================================
     FIGHT-NIGHT COUNTDOWN — real event from the gym's own post.
     #fightCd (home teaser: "15 days") · #countdown (events page: d/h/m/s)
     ============================================================ */
  function tick(){
    var target=new Date(NEXT_FIGHT.when).getTime(), now=Date.now(), diff=target-now;
    var d=Math.max(0,Math.floor(diff/864e5)), h=Math.max(0,Math.floor(diff%864e5/36e5)), m=Math.max(0,Math.floor(diff%36e5/6e4)), s=Math.max(0,Math.floor(diff%6e4/1e3));
    var t=$('#fightCd'); if(t){t.innerHTML=diff>0?(d+'<small>days out</small>'):'Fight<small>night</small>'}
    var c=$('#countdown'); if(c){
      if(diff>0){c.classList.remove('done');c.innerHTML='<div><b>'+d+'</b><span>days</span></div><div><b>'+h+'</b><span>hrs</span></div><div><b>'+m+'</b><span>min</span></div><div><b>'+s+'</b><span>sec</span></div>'}
      else{c.classList.add('done');c.innerHTML='<div><b>Fight night</b><span>doors are open</span></div>'}
    }
  }
  if($('#fightCd')||$('#countdown')){tick();setInterval(tick,1000)}

  window.__site={pacificNow:pacificNow,computeStatus:computeStatus,HOURS:HOURS,SCHEDULE:SCHEDULE};
})();
