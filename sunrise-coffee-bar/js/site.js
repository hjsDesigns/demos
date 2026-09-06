/* ============================================================
   WEBSITE FACTORY — site.js
   Nav, progressive content, accessible disclosures and honest local notes.
   Live inquiry delivery requires a configured owner inbox.
   ============================================================ */

/* ------------------------------------------------------------
   HOURS CONFIG  — fill from the client's Google listing.
   Days are 0=Sunday … 6=Saturday. Each day is [open, close] in
   decimal 24h hours (6.5 = 6:30 am, 18 = 6:00 pm, 23.5 = 11:30 pm).
   null = closed that day. Closing past midnight: use 26 for 2 am.
   ------------------------------------------------------------ */
/* Current Sunrise schedule is unverified. Historical source hours are preserved in facts.json. */
var HOURS={tz:'America/Los_Angeles',verified:false,days:{}};

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

  /* Conflicting predecessor/current sources cannot drive a live status light. */
  function computeStatus(){return {open:null,text:'Current hours unconfirmed'}}
  window.__site={computeStatus:computeStatus,HOURS:HOURS};

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
    if(keyEl&&keyEl.value.trim()){btn.textContent='Send message';help.textContent='Your message goes to the configured shop inbox.';}
    if(keyEl&&keyEl.value.trim()){$('[name=name]',form).required=true;$('[name=email]',form).required=true;}
    function feedback(message,error){ok.textContent=message;ok.classList.add('show');ok.setAttribute('role',error?'alert':'status');}
    form.addEventListener('submit',function(e){
      e.preventDefault();if(btn.disabled||!form.reportValidity())return;
      var key=keyEl?keyEl.value.trim():'';
      if(!key){
        var fields=new FormData(form);
        var body=['Visit: '+(fields.get('topic')||''),'Name: '+(fields.get('name')||''),'Phone: '+(fields.get('phone')||''),'Email: '+(fields.get('email')||''),'',fields.get('msg')||''].join('\n');
        var area=$('textarea',note);area.value=body;note.hidden=false;
        function selectNote(){area.focus();area.select();feedback('Your note is ready below. Select and copy it for your visit; nothing has been sent.',false);}
        if(navigator.clipboard&&navigator.clipboard.writeText){
          navigator.clipboard.writeText(body).then(function(){feedback('Visit note copied. Keep it handy for your visit; nothing has been sent.',false);}).catch(selectNote);
        }else selectNote();
        return;
      }
      var label=btn.textContent;btn.disabled=true;btn.textContent='Sending…';
      var data={};new FormData(form).forEach(function(v,k){data[k]=v});data.subject='Visit inquiry — Sunrise Coffee Bar';
      fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)})
        .then(function(r){if(!r.ok)throw new Error('send failed');return r.json()})
        .then(function(result){if(!result||!result.success)throw new Error('send failed');feedback('Message sent. The shop can reply using the contact details you provided.',false);btn.textContent='Message sent';})
        .catch(function(){btn.disabled=false;btn.textContent=label;feedback('Could not send just now. Save your note and ask in person instead.',true);});
    });
  }

  /* A single open card per group, with closed content removed from the accessibility tree. */
  function disclosureGroup(selector,buttonSelector,panelSelector){
    var cards=$$(selector);
    function setOpen(card,open){
      card.classList.toggle('open',open);
      $(buttonSelector,card).setAttribute('aria-expanded',String(open));
      var panel=$(panelSelector,card);panel.setAttribute('aria-hidden',String(!open));panel.inert=!open;
    }
    cards.forEach(function(card){
      var button=$(buttonSelector,card);if(!button)return;
      setOpen(card,false);
      button.addEventListener('click',function(){
        var open=!card.classList.contains('open');
        cards.forEach(function(other){setOpen(other,other===card&&open)});
      });
    });
  }
  disclosureGroup('.tcard','.tcard-tap','.tcard-panel');
  disclosureGroup('.shake','.shake-tap','.shake-panel');
})();
