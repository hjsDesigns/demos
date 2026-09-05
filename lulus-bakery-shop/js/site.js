/* ============================================================
   LULÚ'S BAKERY SHOP — site.js
   Nav toggle · scroll-reveal · unrolling title cards · contact form.

   NO HOURS CLOCK ON PURPOSE. The only hours anywhere in the recon come
   from an unverified search snippet, so this page carries no hours band
   and no live open/closed pill — a wrong "Open now" is worse than none.
   When Lulú confirms her real week, drop the template's HOURS config and
   #hours band back in and the clock works as it does on every other
   factory site.
   ============================================================ */
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

  /* ---------- scroll-reveal ---------- */
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(!en.isIntersecting)return;
      en.target.classList.add('in');
      io.unobserve(en.target);
    });
  },{threshold:.06,rootMargin:'0px 0px -6% 0px'});
  $$('.reveal').forEach(function(el){io.observe(el)});

  /* ---------- unrolling title cards (TITLE CARDS UNROLL + ARROW LAW) ----------
     One tap on the heading itself, the real list rolls out in place, the
     chevron flips. Tap again and it closes. Nothing to decode. */
  $$('.unroll-btn').forEach(function(btn){
    btn.addEventListener('click',function(){
      var body=document.getElementById(btn.getAttribute('aria-controls'));
      if(!body)return;
      var open=btn.getAttribute('aria-expanded')==='true';
      btn.setAttribute('aria-expanded',open?'false':'true');
      body.hidden=open;
    });
  });

  /* ---------- contact form ----------
     DEMO MODE (hidden access_key empty): show the thank-you, send nothing.
     At go-live pages-golive.sh fills the key and it posts to Web3Forms,
     landing in the owner's inbox. */
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
      .catch(function(){btn.disabled=false;btn.textContent=label;ok.textContent='Couldn’t send just now — call or text us instead.';ok.classList.add('show');ok.setAttribute('role','alert')});
  })}

})();
