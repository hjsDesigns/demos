/* ============================================================
   WEBSITE FACTORY — site.js
   Nav toggle · scroll-reveal ·
   count-up numbers · contact form success.
   ============================================================ */

/* No HOURS config: Nana's is a mobile bakery with no published open/close
   hours. There is no live status pill and no hours band anywhere on this
   page - the ordering rhythm in #order carries it instead. */



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

  /* ---------- SIGNATURE GADGET — BUILD A BOX ----------
     Tap a picture, it drops in the box; tap it again, it comes back out.
     Every item and price is off Nana's own menu sheet, and the $20 line is
     her real free-delivery minimum. Object + number only — no sentence
     narrating the pick back at the visitor. */
  var picksEl=$('#picks'), insideEl=$('#inside'), emptyEl=$('#boxEmpty'),
      totalEl=$('#boxTotal'), shipEl=$('#boxShip');
  if(picksEl&&insideEl&&totalEl&&shipEl){
    var FREE=20, chosen=[];
    function render(){
      $$('.bx',insideEl).forEach(function(n){n.remove()});
      var total=0;
      chosen.forEach(function(c){
        total+=c.price;
        var row=document.createElement('div');
        row.className='bx'; row.setAttribute('data-k',c.k);
        var im=document.createElement('img'); im.src=c.img; im.alt='';
        var b=document.createElement('b'); b.textContent=c.label;
        var pr=document.createElement('span'); pr.textContent='$'+c.price;
        row.appendChild(im); row.appendChild(b); row.appendChild(pr);
        insideEl.appendChild(row);
      });
      if(emptyEl) emptyEl.style.display = chosen.length ? 'none' : '';
      totalEl.textContent='$'+total;
      var free = total>=FREE;
      shipEl.classList.toggle('free',free);
      shipEl.textContent = free ? 'Free delivery — you’re there'
                                : (total ? 'Add $'+(FREE-total)+' for free delivery'
                                         : 'Free delivery at $'+FREE);
    }
    $$('.pick',picksEl).forEach(function(btn){
      btn.setAttribute('aria-pressed','false');
      btn.addEventListener('click',function(){
        var k=btn.getAttribute('data-k'), on=btn.classList.contains('on');
        if(on){ chosen=chosen.filter(function(c){return c.k!==k}); }
        else{
          var img=btn.querySelector('img');
          chosen.push({k:k,price:parseInt(btn.getAttribute('data-price'),10),
                       label:btn.getAttribute('data-label'),img:img?img.getAttribute('src'):''});
        }
        btn.classList.toggle('on',!on);
        btn.setAttribute('aria-pressed',(!on)?'true':'false');
        render();
      });
    });
    render();
  }

})();
