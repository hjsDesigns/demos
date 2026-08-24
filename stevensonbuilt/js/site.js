/* Site behaviour. Everything here is an enhancement — the page is
   complete and readable with this file deleted. */
(function () {

  /* ---------------------------------------------------------------
     Reveal on scroll.
     Modern browsers run this off `animation-timeline: view()` in CSS,
     entirely on the compositor, and never reach this code. This is the
     fallback for everything else.
     --------------------------------------------------------------- */
  var native = CSS.supports && CSS.supports('animation-timeline', 'view()');
  var still  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!native && !still && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    document.querySelectorAll('.reveal').forEach(function (el) {
      /* Anything already scrolled past on load is shown outright, so a
         deep link or a restored scroll position never lands on blanks. */
      if (el.getBoundingClientRect().top < window.innerHeight) { el.classList.add('in'); return; }
      io.observe(el);
    });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------------------------------------------------------------
     Pricing: three tier discs drive one shelf of industries.
     One tap, one visible result. The shelf is in the HTML already and
     defaults to the first tier, so this only ever swaps labels and hrefs.
     --------------------------------------------------------------- */
  var tiers = document.querySelectorAll('.tier[data-tier]');
  var shelf = document.getElementById('shelf');
  if (tiers.length && shelf) {
    var title = shelf.querySelector('h3[data-shelf-title]');
    var blurb = shelf.querySelector('p[data-shelf-blurb]');
    var links = shelf.querySelectorAll('.industry');

    function choose(btn) {
      var tier = btn.dataset.tier;

      tiers.forEach(function (t) {
        t.setAttribute('aria-pressed', String(t === btn));
      });

      if (title) title.textContent = btn.dataset.title || title.textContent;
      if (blurb) blurb.textContent = btn.dataset.blurb || blurb.textContent;

      links.forEach(function (a) {
        var href = a.dataset['tier' + tier];
        if (href && href !== '#') {
          a.href = href;
          a.target = '_blank';
          a.rel = 'noopener';
          a.removeAttribute('data-soon');
        } else {
          a.href = '#';
          a.removeAttribute('target');
          a.setAttribute('data-soon', '');
        }
      });
    }

    tiers.forEach(function (btn) {
      btn.addEventListener('click', function () {
        choose(btn);
        /* Only chase the shelf if it isn't already on screen — otherwise
           tapping a second tier yanks the page for no reason. */
        var box = shelf.getBoundingClientRect();
        if (box.top > window.innerHeight * 0.72) {
          shelf.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
        }
      });
    });

    var start = document.querySelector('.tier[aria-pressed="true"]') || tiers[0];
    choose(start);
  }

  /* ---------------------------------------------------------------
     Industry orbs with no demo yet: don't navigate to nowhere.
     --------------------------------------------------------------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.industry[data-soon]');
    if (a) e.preventDefault();
  });

})();
