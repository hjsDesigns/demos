/* ═══════════════════════════════════════════════════════════════
   NITRATE — Stevensonbuilt
   Vanilla. No dependencies. Everything here is an enhancement:
   with JS off the page is complete, readable and fully navigable.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var doc  = document;
  var reduced = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
  var canHover = window.matchMedia
    ? window.matchMedia('(hover: hover) and (pointer: fine)').matches : true;

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel));
  }

  /* ── 1. HEADER: goes solid once the gate scrolls away ───────── */
  (function header() {
    var el = $('.site-header');
    if (!el) return;
    var on = false;
    function check() {
      var want = window.pageYOffset > 40;
      if (want !== on) { on = want; el.classList.toggle('stuck', on); }
    }
    window.addEventListener('scroll', check, { passive: true });
    check();
  })();

  /* ── 2. NAV: one button, escape, outside click, resize reset ── */
  (function nav() {
    var btn  = $('.nav-toggle');
    var menu = $('#main-nav');
    if (!btn || !menu) return;

    function setOpen(open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.classList.toggle('open', open);
      doc.body.classList.toggle('nav-open', open);
    }
    function isOpen() { return btn.getAttribute('aria-expanded') === 'true'; }

    btn.addEventListener('click', function () { setOpen(!isOpen()); });

    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) { setOpen(false); btn.focus(); }
    });
    doc.addEventListener('click', function (e) {
      if (!isOpen()) return;
      if (menu.contains(e.target) || btn.contains(e.target)) return;
      setOpen(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860 && isOpen()) setOpen(false);
    });
  })();

  /* ── 3. ENTRANCES: crop marks draw, blocks rise, rules sweep ─── */
  (function entrances() {
    /* work tiles get their entrance assigned here so that a JS-off
       visitor never meets a hidden element. */
    $$('.build').forEach(function (b, i) {
      b.classList.add('rise');
      b.style.setProperty('--d', String(i % 3));
    });
    $$('.rise[data-d]').forEach(function (el) {
      el.style.setProperty('--d', el.getAttribute('data-d'));
    });
    $$('.exits .rise').forEach(function (el, i) {
      el.style.setProperty('--d', String(i));
    });

    var targets = $$('.rise, .house, .house h2');

    if (!('IntersectionObserver' in window) || reduced) {
      targets.forEach(function (el) { el.classList.add('in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    targets.forEach(function (el) { io.observe(el); });

    /* the opening act plays immediately — never wait for a scroll.
       Called twice on purpose: rAF is throttled in a background tab,
       so the timeout guarantees the curtain always goes up.        */
    function openingAct() {
      $$('.gate-act .rise').forEach(function (el) { el.classList.add('in'); });
    }
    requestAnimationFrame(openingAct);
    window.setTimeout(openingAct, 300);

    /* last-resort safety net: nothing that is already on screen is
       allowed to stay invisible, whatever the observer did or didn't do. */
    window.setTimeout(function () {
      targets.forEach(function (el) {
        if (el.classList.contains('in')) return;
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
      });
    }, 2500);
  })();

  /* ── 4. THE PROJECTOR ────────────────────────────────────────
     The work wall is printed in violet duotone. Wherever the
     pointer goes, the colour comes back. Move it, and you are
     running the projector across nine real shops. On a phone there
     is no pointer, so the build passing the middle of the screen
     lights up on its own as you scroll.                          */
  (function projector() {
    var wall = $('#wall');
    if (!wall || reduced) return;

    if (canHover) {
      $$('.shot', wall).forEach(function (shot) {
        var rect = null, raf = 0, px = 0, py = 0;

        function measure() { rect = shot.getBoundingClientRect(); }
        function paint() {
          raf = 0;
          if (!rect) measure();
          shot.style.setProperty('--mx', (px - rect.left) + 'px');
          shot.style.setProperty('--my', (py - rect.top) + 'px');
        }
        shot.addEventListener('pointerenter', function (e) {
          measure();
          px = e.clientX; py = e.clientY;
          paint();
          shot.style.setProperty('--r', '120px');
        });
        shot.addEventListener('pointermove', function (e) {
          px = e.clientX; py = e.clientY;
          if (!raf) raf = requestAnimationFrame(paint);
        });
        shot.addEventListener('pointerleave', function () {
          shot.style.setProperty('--r', '0px');
        });
      });
      return;
    }

    /* touch: whatever is crossing the middle band of the screen is lit */
    if (!('IntersectionObserver' in window)) {
      $$('.build', wall).forEach(function (b) { b.classList.add('is-live'); });
      return;
    }
    var live = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        en.target.classList.toggle('is-live', en.isIntersecting);
      });
    }, { rootMargin: '-42% 0px -42% 0px', threshold: 0 });
    $$('.build', wall).forEach(function (b) { live.observe(b); });
  })();

  /* ── 5. THE WIPE: the house goes dark between pages ──────────── */
  (function wipe() {
    if (reduced) return;

    var panel = doc.createElement('div');
    panel.className = 'wipe';
    panel.setAttribute('aria-hidden', 'true');
    doc.body.appendChild(panel);

    window.addEventListener('pageshow', function () {
      panel.className = 'wipe';
    });

    doc.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      var a = e.target.closest ? e.target.closest('a') : null;
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || a.target === '_blank' || a.hasAttribute('download')) return;
      if (href.charAt(0) === '#' || /^(tel:|mailto:|javascript:)/i.test(href)) return;
      if (a.host && a.host !== window.location.host) return;

      e.preventDefault();
      panel.classList.add('out');
      window.setTimeout(function () { window.location.href = a.href; }, 320);
    });
  })();

})();
