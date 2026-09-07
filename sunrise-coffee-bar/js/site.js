/* ============================================================
   SUNRISE COFFEE BAR — site.js
   Nav · live open/closed light · scroll reveal · the energy builder.
   ============================================================ */

/* ------------------------------------------------------------
   HOURS CONFIG — days are 0=Sunday … 6=Saturday, decimal 24h.
   PROVISIONAL: opening times are sourced (directory listings for this
   address, plus a Google read showing an 8 AM Sunday); no one has read
   the sheet taped inside their own door yet. It is visible in
   harvest-0906/g12.jpg but too small to resolve — a phone photo of it
   on a drive-by settles this in one shot. See HANDOFF-CODEX.md.
   Change these AND the seven rows in index.html together.
   ------------------------------------------------------------ */
var HOURS = {
  tz: 'America/Los_Angeles',
  days: {
    0: [8, 13],
    1: [7, 13],
    2: [7, 13],
    3: [7, 13],
    4: [7, 13],
    5: [7, 13],
    6: [7, 13]
  }
};

function customClosure(p) { return null; }
function customClose(p, close) { return close; }

(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- mobile nav (toggle · Escape · outside-click · close on link) ---------- */
  var toggle = $('.nav-toggle'), nav = $('#main-nav');
  function setNav(open) {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    toggle.textContent = open ? '✕' : '☰';
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function (e) { e.stopPropagation(); setNav(!nav.classList.contains('open')); });
    $$('#main-nav a').forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('open') && !nav.contains(e.target) && e.target !== toggle) setNav(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setNav(false); toggle.focus(); }
    });
  }
  var yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- live open / closed (Pacific, regardless of the visitor's clock) ----------
     STATUS LIGHT LAW: green when open, red when closed. Never brand-coloured. */
  function pacificNow() {
    var f = new Intl.DateTimeFormat('en-US', {
      timeZone: HOURS.tz, hour12: false,
      weekday: 'short', hour: '2-digit', minute: '2-digit'
    }).formatToParts(new Date());
    var g = {}; f.forEach(function (p) { g[p.type] = p.value; });
    var map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    var h = parseInt(g.hour, 10); if (h === 24) h = 0;
    return { day: map[g.weekday], h: h + parseInt(g.minute, 10) / 60 };
  }
  function fmt(t) {
    var h = Math.floor(t) % 24, m = Math.round((t - Math.floor(t)) * 60);
    var ap = h >= 12 ? 'PM' : 'AM', hh = h % 12; if (hh === 0) hh = 12;
    return hh + (m ? ':' + (m < 10 ? '0' : '') + m : '') + ' ' + ap;
  }
  function computeStatus() {
    var p = pacificNow();
    var shut = customClosure(p);
    if (shut) return { open: false, text: shut };
    var today = HOURS.days[p.day];
    if (today) {
      var close = customClose(p, today[1]);
      if (p.h >= today[0] && p.h < close) {
        return { open: true, text: 'Open now · until ' + fmt(close) };
      }
      if (p.h < today[0]) return { open: false, text: 'Closed · opens ' + fmt(today[0]) };
    }
    /* find the next day that has hours */
    for (var i = 1; i <= 7; i++) {
      var d = (p.day + i) % 7, hrs = HOURS.days[d];
      if (!hrs) continue;
      var names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return { open: false, text: 'Closed · opens ' + (i === 1 ? 'tomorrow' : names[d]) + ' ' + fmt(hrs[0]) };
    }
    return { open: false, text: 'Closed' };
  }
  function paintStatus() {
    var s = computeStatus();
    var line = $('#statusLine'), txt = $('#statusText'), pill = $('#hdrLive'), pillTxt = $('#hdrLiveText');
    if (line && txt) {
      line.classList.toggle('is-open', s.open === true);
      line.classList.toggle('is-closed', s.open === false);
      txt.textContent = s.text;
    }
    if (pill && pillTxt) {
      pill.classList.toggle('is-open', s.open === true);
      pill.classList.toggle('is-closed', s.open === false);
      pillTxt.textContent = s.open ? 'Open now' : 'Closed';
    }
    var now = pacificNow();
    $$('#hoursList li').forEach(function (li) {
      li.classList.toggle('today', parseInt(li.getAttribute('data-days'), 10) === now.day);
    });
  }
  paintStatus();
  setInterval(paintStatus, 60000);
  window.__site = { computeStatus: computeStatus, HOURS: HOURS };

  /* ---------- scroll reveal ---------- */
  if (typeof IntersectionObserver !== 'undefined') {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- THE ENERGY BUILDER ----------
     Two rows of tappable colours, off their own Natural Energy board.
     Tap a base → the cup fills. Tap a topper → a layer lands on top.
     Tap the same one again → it clears. No numbers, no readback sentence. */
  var builder = $('#builder');
  if (builder) {
    var cup = $('.cup', builder), read = $('#builderRead');
    var picked = { base: null, top: null };

    function paintBuilder() {
      cup.style.setProperty('--base', picked.base ? picked.base.c : '#D6CDBD');
      cup.style.setProperty('--top', picked.top ? picked.top.c : '#EFE7DA');
      cup.classList.toggle('is-based', !!picked.base);
      cup.classList.toggle('is-topped', !!picked.top);
      var parts = [];
      if (picked.base) parts.push(picked.base.name);
      if (picked.top) parts.push(picked.top.name);
      if (parts.length) {
        read.textContent = parts.join(' + ');
        read.classList.remove('empty');
      } else {
        read.textContent = 'Tap a base';
        read.classList.add('empty');
      }
    }

    function wire(rowSel, slot) {
      var row = $(rowSel, builder);
      if (!row) return;
      $$('.pill', row).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var on = btn.getAttribute('aria-pressed') === 'true';
          $$('.pill', row).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
          if (on) {
            picked[slot] = null;
          } else {
            btn.setAttribute('aria-pressed', 'true');
            picked[slot] = { name: btn.getAttribute('data-name'), c: btn.getAttribute('data-c') };
          }
          paintBuilder();
        });
      });
    }
    wire('#baseRow', 'base');
    wire('#topRow', 'top');
    paintBuilder();
  }

  /* ---------- contact form (demo mode: shows the thank-you, sends nothing) ---------- */
  var form = $('.contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = $('.form-success', form);
      if (ok) ok.classList.add('show');
      form.reset();
    });
  }
})();
