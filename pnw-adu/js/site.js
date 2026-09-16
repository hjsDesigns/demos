/* ============================================================
   PNW ADU — site.js
   Nav toggle · scroll-reveal · the five bubbles (+ concept-render manifest) ·
   "Can I build one on my lot?" · the dusk map (label nudge + tap a town) ·
   contact form · the porch-light moth (idles at the render's real porch light).
   No store hours on a builder's site — the template clock is gone on purpose.
   ============================================================ */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = root.classList.contains('reduce');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var hasGsap = !!window.gsap;
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- mobile nav (toggle · Escape · outside-click · close on link) ---------- */
  var toggle = $('.nav-toggle'), nav = $('#main-nav');
  function setNav(open) { nav.classList.toggle('open', open); toggle.setAttribute('aria-expanded', open ? 'true' : 'false'); toggle.textContent = open ? '✕' : '☰'; }
  if (toggle && nav) {
    toggle.addEventListener('click', function (e) { e.stopPropagation(); setNav(!nav.classList.contains('open')); });
    $$('#main-nav a').forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
    document.addEventListener('click', function (e) { if (nav.classList.contains('open') && !nav.contains(e.target) && e.target !== toggle) setNav(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { setNav(false); toggle.focus(); } });
  }
  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  /* ---------- scroll-reveal ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      io.unobserve(en.target);
    });
  }, { threshold: .06, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(function (el) { io.observe(el); });

  /* ---------- #build — the five bubbles ----------
     The panel is always in place and opens on the first type at load (section 3 reads as the
     offerings list, not a gadget). Tap a bubble → its concept frame + one line + the 'Set up a consultation' link
     in place; tap the lit one → the panel closes to a hint but keeps its height (nothing jumps).
     Real renders: images/concepts/manifest.json lists what exists ({"garage":["garage-1.jpg"],…});
     read once, only named files are loaded, and each is appended only after it loads — no probing,
     no 404s in the console. */
  var BUILD = {
    'garage':       { t: 'Garage conversion',    l: 'The garage you don’t park in becomes a one-bedroom with its own door. Often the quickest way to a second home.' },
    'backyard':     { t: 'Backyard home',        l: 'A separate small house in the yard — its own porch, its own front door, forty feet from yours.' },
    'addon':        { t: 'Home add-on',          l: 'A new wing on the house with its own entrance. Shares a wall, not a life.' },
    'above-garage': { t: 'Above the garage',     l: 'An apartment over the garage, with a stair of its own. Parking below, a home above.' },
    'inside':       { t: 'Inside the house',     l: 'A basement or attic made into its own apartment, with its own door in. The house you have, holding one more home.' }
  };
  var bubbles = $$('.bubble'), panel = $('#buildPanel'), renders = $('#renders'), buildHint = $('#buildHint');
  var capEl = $('#conceptCap'), countEl = $('#conceptCount'), navEl = $('#conceptNav'), prevBtn = $('#conceptPrev'), nextBtn = $('#conceptNext');
  var manifest = null, manifestReq = null;
  function loadManifest() {
    if (manifestReq) return manifestReq;
    manifestReq = (window.fetch ? fetch('images/concepts/manifest.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : {}; }) : Promise.resolve({}))
      .catch(function () { return {}; })
      .then(function (m) { manifest = (m && typeof m === 'object') ? m : {}; return manifest; });
    return manifestReq;
  }
  /* manifest names → urls: 'frames/x' → images/frames/ (the q84 re-encodes the page loads), 'bubbles/x' → images/bubbles/,
     anything else → images/concepts/ (the originals) */
  function srcFor(name) {
    name = String(name).replace(/\.\.+/g, '').replace(/^\/+/, '');
    if (!/^[\w./-]+$/.test(name)) return '';
    return (/^(frames|bubbles)\//.test(name) ? 'images/' : 'images/concepts/') + name;
  }
  var CAP_FALLBACK = 'Another lot, same idea.';
  /* THE STRIP — stills only (Hayden, 9/14 evening: no push-in clips). One slot per frame, in manifest order; the
     first frame is the one-house render for that type with its "what changed" line under it; arrows + swipe move
     through the rest. Every open — a tap, a switch, close→open — starts on frame 1. */
  var strip = { type: null, slots: [], idx: 0, caps: {}, raf: 0 };
  function resetStrip() {
    strip.slots = []; strip.idx = 0;
    /* scrollLeft FIRST, while the strip is still laid out: written after `hidden` it is a no-op and Chromium
       brought the old offset (frame 2 / 3) back when the strip was un-hidden for the next type (9/14 review) */
    if (renders) { renders.scrollLeft = 0; renders.innerHTML = ''; renders.hidden = true; }
    if (navEl) navEl.hidden = true;
    if (capEl) capEl.textContent = ''; if (countEl) countEl.textContent = '';
  }
  function currentIdx() {
    var w = renders.clientWidth || 1;
    return Math.max(0, Math.min(strip.slots.length - 1, Math.round(renders.scrollLeft / w)));
  }
  function updateStrip() {
    if (!renders || !strip.slots.length) return;
    strip.idx = currentIdx();
    var slot = strip.slots[strip.idx], name = slot.getAttribute('data-name');
    if (capEl) capEl.textContent = strip.caps[name] || CAP_FALLBACK;
    if (countEl) countEl.textContent = (strip.idx + 1) + ' / ' + strip.slots.length;
    if (prevBtn) prevBtn.setAttribute('aria-disabled', strip.idx === 0 ? 'true' : 'false');
    if (nextBtn) nextBtn.setAttribute('aria-disabled', strip.idx === strip.slots.length - 1 ? 'true' : 'false');
  }
  function goTo(i) {
    if (!strip.slots.length) return;
    i = Math.max(0, Math.min(strip.slots.length - 1, i));
    var left = i * renders.clientWidth;
    if (renders.scrollTo) renders.scrollTo({ left: left, behavior: reduce ? 'auto' : 'smooth' }); else renders.scrollLeft = left;
    if (Math.abs(renders.scrollLeft - left) < 2) updateStrip();
  }
  /* PRELOAD (Hayden, 9/16: "when it loads I just need it to pop straight up with the snap of a finger" — the
     drawn blueprint underneath was showing in the gap while the manifest fetch + first image loaded). The
     manifest is fetched at load and every type's FIRST frame is warmed once the hero has finished, at low
     priority, so a tap paints from cache and the silhouette is never seen. */
  function warmFrames() {
    loadManifest().then(function (m) {
      Object.keys(BUILD).forEach(function (t) {
        var list = Array.isArray(m[t]) ? m[t] : [], url = list.length ? srcFor(list[0]) : '';
        if (!url) return;
        var im = new Image(); try { im.fetchPriority = 'low'; } catch (e) {}
        im.decoding = 'async'; im.src = url;
      });
    });
  }
  function whenIdle(fn) {
    if (window.requestIdleCallback) requestIdleCallback(fn, { timeout: 4000 }); else setTimeout(fn, 1200);
  }

  function showRenders(type) {
    if (!renders) return;
    loadManifest().then(function (m) {
      if (panel.getAttribute('data-type') !== type) return;
      var list = Array.isArray(m[type]) ? m[type] : [];
      resetStrip();
      strip.type = type;
      strip.caps = (m.captions && typeof m.captions === 'object') ? m.captions : {};
      /* appended in MANIFEST order up front (the strip's first frame is always the one-house render, never
         whichever file landed first); the strip is shown once the first one has loaded, a failed file drops out */
      list.forEach(function (name, i) {
        var url = srcFor(name); if (!url) return;
        var slot = document.createElement('div'); slot.className = 'slot' + (/-oh1\.jpg$/.test(String(name)) ? ' oh' : '');
        slot.setAttribute('data-name', String(name));
        var im = new Image();
        im.alt = BUILD[type].t + ' — concept render ' + (i + 1);
        im.decoding = 'async';
        im.onload = function () { if (panel.getAttribute('data-type') === type) { renders.hidden = false; if (i === 0) { renders.scrollLeft = 0; updateStrip(); } } };
        im.onerror = function () {
          if (slot.parentNode) slot.parentNode.removeChild(slot);
          strip.slots = strip.slots.filter(function (s) { return s !== slot; });
          if (navEl) navEl.hidden = strip.slots.length < 2;
          updateStrip();
        };
        im.src = url;
        slot.appendChild(im); renders.appendChild(slot); strip.slots.push(slot);
      });
      if (navEl) navEl.hidden = strip.slots.length < 2;
      updateStrip();
    });
  }
  if (renders) {
    renders.addEventListener('scroll', function () {
      if (strip.raf) return;
      strip.raf = requestAnimationFrame(function () { strip.raf = 0; updateStrip(); });
    }, { passive: true });
    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(strip.idx - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(strip.idx + 1); });
    window.addEventListener('resize', function () { if (strip.slots.length) renders.scrollLeft = strip.idx * renders.clientWidth; });
  }
  function openBuild(type, btn, animate) {
    var d = BUILD[type]; if (!d) return;
    bubbles.forEach(function (b) { var on = b === btn; b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.classList.toggle('is-on', on); });
    panel.setAttribute('data-type', type);
    $$('.silhouette', panel).forEach(function (s) { if (s.getAttribute('data-type') === type) s.removeAttribute('hidden'); else s.setAttribute('hidden', ''); });
    resetStrip();
    $('#buildTitle').textContent = d.t;
    $('#buildLine').textContent = d.l;
    var wasClosed = panel.classList.contains('is-closed');
    panel.classList.remove('is-closed'); panel.style.minHeight = ''; if (buildHint) buildHint.hidden = true;
    if (animate && hasGsap && !reduce) gsap.fromTo([$('#conceptWrap'), $('.build-copy', panel)], { opacity: 0, y: wasClosed ? 10 : 6 }, { opacity: 1, y: 0, duration: .4, ease: 'power3.out', overwrite: true });
    showRenders(type);
    /* phones: the panel sits ABOVE the bubbles, and on a short screen (375×667) a row-2 tap left the frame off the
       top — if the panel's top is under/above the header, bring it into view (scroll-margin-top clears the header) */
    if (animate) {
      var headerH = parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) || 72;
      if (panel.getBoundingClientRect().top < headerH) panel.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    }
  }
  function closeBuild() {
    var keep = panel.offsetHeight;                       // the panel keeps its height — the bubbles never jump
    bubbles.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); b.classList.remove('is-on'); });
    resetStrip();
    panel.style.minHeight = keep + 'px';
    panel.classList.add('is-closed'); panel.removeAttribute('data-type');
    if (buildHint) buildHint.hidden = false;
  }
  if (panel) {
    bubbles.forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.getAttribute('aria-pressed') === 'true') closeBuild(); else openBuild(b.getAttribute('data-type'), b, true);
      });
    });
    openBuild('garage', bubbles[0], false);
    /* warm the other four as soon as the opener is out of the way */
    var heroEl = document.querySelector('.hero');
    if (!heroEl || heroEl.classList.contains('is-done') || document.documentElement.classList.contains('reduce')) whenIdle(warmFrames);
    else {
      var seen = false, mo = new MutationObserver(function () {
        if (!seen && heroEl.classList.contains('is-done')) { seen = true; mo.disconnect(); whenIdle(warmFrames); }
      });
      mo.observe(heroEl, { attributes: true, attributeFilter: ['class'] });
      setTimeout(function () { if (!seen) { seen = true; mo.disconnect(); whenIdle(warmFrames); } }, 11000);
    }              // open on the first type at load: information first, tap to change
  }

  /* ---------- #lot — "Can I build one on my lot?" ----------
     Object + number, one line, the source. Copy = the brief's explainer table VERBATIM
     (Recon/pnw-adu.md §4, rules as of Sept 2026) — the brief is the source of truth; change it there first. */
  var LOT = {
    'king-town':      { w: 'King County · in town',            h: 'Yes — up to 2, 1,000 sq ft (up to 1,500 heated in the county)',
                        l: 'Enumclaw: 2, up to 1,000 sq ft', s: 'KCC 21A.08.030 · EMC 19.34' },
    'king-country':   { w: 'King County · out in the country', h: '1 — detached only if your lot meets the zone minimum',
                        l: 'Otherwise attached or in the house; forest zones no', s: 'KCC 21A.08.030 B.7.a(8)' },
    'pierce-town':    { w: 'Pierce County · in town',          h: 'Yes — up to 2, each up to 1,000 sq ft',
                        l: 'Buckley, Bonney Lake, Sumner, Orting have their own code — at least this generous', s: 'PCC 18A.37.120 · RCW 36.70A.681' },
    'pierce-country': { w: 'Pierce County · out in the country', h: 'Yes — 1, up to 1,250 sq ft',
                        l: 'Septic and well capacity decide the rest', s: 'PCC 18A.37.120' }
  };
  var tiles = $$('.tile'), lotHint = $('#lotHint'), lotAnswer = $('#lotAnswer'), lotCard = $('#lotCard');
  /* The card rests compact (the hint alone) and grows to fit the answer: the height is tweened between the
     two content states so the tiles under it slide, never jump (reduced-motion / no GSAP: instant). */
  function morphCard(change) {
    if (!lotCard || !hasGsap || reduce) { change(); return; }
    var h0 = lotCard.offsetHeight; change(); var h1 = lotCard.offsetHeight;
    if (Math.abs(h1 - h0) < 2) return;
    gsap.fromTo(lotCard, { height: h0 }, { height: h1, duration: .4, ease: 'power3.out', overwrite: true, onComplete: function () { lotCard.style.height = ''; } });
  }
  function openLot(k, btn) {
    var d = LOT[k]; if (!d) return;
    tiles.forEach(function (t) { var on = t === btn; t.setAttribute('aria-pressed', on ? 'true' : 'false'); t.classList.toggle('is-on', on); });
    morphCard(function () {
      $('#lotWhere').textContent = d.w; $('#lotHead').textContent = d.h; $('#lotLine').textContent = d.l; $('#lotSrc').textContent = d.s;
      lotHint.hidden = true; lotAnswer.hidden = false;
    });
    if (hasGsap && !reduce) gsap.fromTo(lotAnswer, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .35, ease: 'power3.out', overwrite: true });
    /* phones: the card sits ABOVE the tiles — with the tiles centred on a 375×667 screen the answer headline landed under the
       72 px header, tiles at the top left the card entirely above the viewport (9/15 verifier; Safari has no scroll anchoring).
       Same guard as the build panel: if the card's top is under the header, bring it into view (scroll-padding-top clears the header). */
    var headerH = parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) || 72;
    if (lotCard && lotCard.getBoundingClientRect().top < headerH) lotCard.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  }
  function closeLot() {
    tiles.forEach(function (t) { t.setAttribute('aria-pressed', 'false'); t.classList.remove('is-on'); });
    morphCard(function () { lotAnswer.hidden = true; lotHint.hidden = false; });
  }
  if (lotAnswer) tiles.forEach(function (t) {
    t.addEventListener('click', function () {
      if (t.getAttribute('aria-pressed') === 'true') closeLot(); else openLot(t.getAttribute('data-k'), t);
    });
  });

  /* ---------- #map — the dusk map: label nudge + tap a town ----------
     Towns are HTML labels on % positions inside the image plane (index.html). Each label has a preferred
     side (data-side) and eight candidates (r l t b tr tl br bl); layoutLabels() measures each label ONCE
     (width/height), computes the eight candidate rects arithmetically from the dot's centre and the town's
     --d/--dd offsets (the same numbers the CSS uses), scores them against every dot + every label already
     placed + the frame's edges, and keeps the first clean side (or the least-overlapping). DOM order is the
     priority order: the hub, the tight western cluster, the other build towns (rev 2, 9/15: the grey
     context towns and the Rainier glyph are gone — every label is a build town). Towns whose dot the frame
     crops away are .off. Labels stay visibility:hidden until the first layout (after the fonts are in), and re-lay on
     resize. Tap a build town → amber + "we build here"; the tag tries above / below / beside. Phone tags
     search nearby empty space instead of dimming a neighbouring label or dot. */
  var dmap = $('#dmap'), townsWrap = $('#towns'), towns = $$('.town', townsWrap), here = $('#here');
  var SIDES = ['r', 'l', 't', 'b', 'tr', 'tl', 'br', 'bl'];
  /* candidate tiers, in order of preference: the eight sides at the normal offset; the same 7 px further out
     (.far); then each of those slid 5 px along its side (.nup/.ndn/.nlf/.nrt — margins in the CSS) so a label
     boxed in by dots can still find a clean spot, then 10 px. 144 candidates per label, all arithmetic. */
  var TIERS = [{ far: 0, n: [0, 0], cls: '' }, { far: 7, n: [0, 0], cls: '' }];
  [['nup', 0, -5], ['ndn', 0, 5], ['nlf', -5, 0], ['nrt', 5, 0], ['nup2', 0, -10], ['ndn2', 0, 10], ['nlf2', -10, 0], ['nrt2', 10, 0]]
    .forEach(function (k) { TIERS.push({ far: 0, n: [k[1], k[2]], cls: k[0] }); TIERS.push({ far: 7, n: [k[1], k[2]], cls: k[0] }); });
  function rectOverlap(a, b) {
    var w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    return (w > 0 && h > 0) ? w * h : 0;
  }
  function grow(r, n) { return { left: r.left - n, top: r.top - n, right: r.right + n, bottom: r.bottom + n }; }
  function candidate(side, cx, cy, lw, lh, d, dd) {
    var l, t;
    switch (side) {
      case 'r':  l = cx + d;        t = cy - lh / 2; break;
      case 'l':  l = cx - d - lw;   t = cy - lh / 2; break;
      case 't':  l = cx - lw / 2;   t = cy - d - lh; break;
      case 'b':  l = cx - lw / 2;   t = cy + d;      break;
      case 'tr': l = cx + dd;       t = cy - dd - lh; break;
      case 'tl': l = cx - dd - lw;  t = cy - dd - lh; break;
      case 'br': l = cx + dd;       t = cy + dd;     break;
      default:   l = cx - dd - lw;  t = cy + dd;     break;   // bl
    }
    return { left: l, top: t, right: l + lw, bottom: t + lh };
  }
  var layoutRaf = 0;
  function layoutLabels() {
    if (!dmap || !towns.length) return;
    var box = dmap.getBoundingClientRect(); if (!box.width) return;
    var inner = grow(box, -4), dots = [], items = [];
    var creditEl = dmap.querySelector('.dmap-credit'), credit = creditEl ? grow(creditEl.getBoundingClientRect(), 2) : null;   // the imagery credit pill: a label never lands under it (Mt. Rainier did, 9/14 review)
    towns.forEach(function (t) {
      t.classList.remove('off');
      var r = t.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var off = cx < box.left || cx > box.right || cy < box.top || cy > box.bottom;
      t.classList.toggle('off', off);
      var l = t.querySelector('.tn'); if (l) l.classList.remove('hide');
      if (off || !l) return;
      var dot = t.querySelector('i'), dr = dot ? dot.getBoundingClientRect() : null; if (dr) dots.push(dr);   // raw; grown per item in hard()
      var cs = getComputedStyle(t), d = parseFloat(cs.getPropertyValue('--d')) || 13, dd = parseFloat(cs.getPropertyValue('--dd')) || 9;
      var lr = l.getBoundingClientRect(), pref = t.getAttribute('data-side') || 'r';
      var order = [pref].concat(SIDES.filter(function (s) { return s !== pref; }));
      /* two tiers: the eight sides at the normal offset, then the same eight pushed 7 px further out (a label a
         touch further from its dot still reads as its own in a tight cluster; overlapping a neighbour never does) */
      var cands = [];
      TIERS.forEach(function (tier) {
        order.forEach(function (s) {
          var c = candidate(s, cx + tier.n[0], cy + tier.n[1], lr.width, lr.height, d + tier.far, dd + tier.far);
          cands.push({ cls: s + (tier.far ? ' far' : '') + (tier.cls ? ' ' + tier.cls : ''), rect: c });
        });
      });
      items.push({ t: t, l: l, dot: dr, cands: cands, soft: false /* rev 2: no context/peak labels remain — every label is a build town */, rect: null, cls: null, score: Infinity });
    });
    function edgeDist(a, b) {                            // gap between two rects' edges (0 when they touch/overlap)
      var dx = Math.max(0, b.left - a.right, a.left - b.right), dy = Math.max(0, b.top - a.bottom, a.top - b.bottom);
      return Math.sqrt(dx * dx + dy * dy);
    }
    function hard(c, it) {                               // the frame's edge + every dot: never negotiable
      var s = (Math.max(0, inner.left - c.left) + Math.max(0, c.right - inner.right) + Math.max(0, inner.top - c.top) + Math.max(0, c.bottom - inner.bottom)) * 1000;
      /* ATTRIBUTION (9/15 phone review: "Sumner" sat 4.9 px from Lake Tapps' dot vs 7.5 px from its own): a label may
         kiss its OWN dot (1 px) but keeps a 7 px moat around every OTHER town's dot, and is never nearer a foreign dot
         than its own — a name that reads as the neighbour's is as wrong as one that overlaps it. */
      var own = it && it.dot ? it.dot : null, od = own ? edgeDist(c, own) : 0;
      for (var j = 0; j < dots.length; j++) {
        var foreign = dots[j] !== own;
        s += 3 * rectOverlap(c, grow(dots[j], foreign ? 7 : 1));
        if (own && foreign) { var fd = edgeDist(c, dots[j]); if (fd <= od) s += 2 * (od - fd) + 1; }
      }
      if (credit) s += 3 * rectOverlap(c, credit);
      return s;
    }
    function labelScore(c, skip) {                       // overlap with every OTHER placed label (skip = items to ignore)
      var s = 0;
      for (var j = 0; j < items.length; j++) { var o = items[j]; if (!o.rect || skip.indexOf(o) >= 0) continue; s += rectOverlap(c, grow(o.rect, 1)); }
      return s;
    }
    function bestFor(it, skip, extra) {                  // the first zero-score candidate, else the least-bad
      var best = null, bs = Infinity;
      for (var i = 0; i < it.cands.length; i++) {
        var c = it.cands[i], s = hard(c.rect, it) + labelScore(c.rect, skip) + (extra ? rectOverlap(c.rect, grow(extra, 1)) : 0);
        if (s < bs) { bs = s; best = c; }
        if (s === 0) break;
      }
      return { c: best, s: bs };
    }
    /* pass 1 — greedy in DOM order (the hub, the western cluster, the other build towns, then context) */
    items.forEach(function (it) { var b = bestFor(it, [it]); it.cls = b.c.cls; it.rect = b.c.rect; it.score = b.s; });
    /* pass 2 — one-level backtrack for a build label still touching something: try each of its candidates that
       is clean against the frame and the dots; every label it would overlap must have a clean side of its own
       with the new rect in place (a context label may simply hide) — if so, move them all together */
    items.forEach(function (it) {
      if (it.score === 0 || it.soft) return;
      for (var i = 0; i < it.cands.length; i++) {
        var c = it.cands[i]; if (hard(c.rect, it) > 0) continue;
        var conflicts = items.filter(function (o) { return o !== it && o.rect && rectOverlap(c.rect, grow(o.rect, 1)) > 0; });
        var moves = [], ok = true;
        for (var k = 0; k < conflicts.length && ok; k++) {
          var n = conflicts[k], m = bestFor(n, [n, it], c.rect);
          if (m.s === 0) moves.push({ n: n, c: m.c }); else if (n.soft) moves.push({ n: n, hide: true }); else ok = false;
        }
        if (!ok) continue;
        it.cls = c.cls; it.rect = c.rect; it.score = 0;
        moves.forEach(function (mv) { if (mv.hide) { mv.n.rect = null; mv.n.score = 1; } else { mv.n.cls = mv.c.cls; mv.n.rect = mv.c.rect; mv.n.score = 0; } });
        break;
      }
    });
    /* commit: (rev 2 — no soft context/peak labels remain). On a PHONE (the whole ring in a
       ≤372 px square, 9/14 evening) the western cluster's dots sit ≤30 px apart — four 14 px names cannot all fit — so a
       build label with no clean slot hides too: its dot stays (white, 44 px, tappable) and the "we build here" tag carries
       the name when it is pressed (placeHere). Never on desktop. */
    var phone = box.width < 400;
    items.forEach(function (it) {
      it.l.className = 'tn ' + (it.cls || 'r');
      if ((it.soft || phone) && (it.score > 0 || !it.rect)) it.l.classList.add('hide');
    });
    townsWrap.classList.add('placed');
    window.PNW_MAP = items;                                 // QA probe only (nothing on the page reads it)
    var selected = $('.town[aria-pressed="true"]');
    if (selected && here && !here.hidden) placeHere(selected);
  }
  function scheduleLayout() { if (layoutRaf) return; layoutRaf = requestAnimationFrame(function () { layoutRaf = 0; layoutLabels(); }); }
  if (dmap) {
    /* Nonblocking font CSS may arrive after fonts.ready has already resolved. Re-measure after later font loads too. */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutLabels, layoutLabels); else layoutLabels();
    if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', scheduleLayout);
    window.addEventListener('resize', scheduleLayout);
  }

  /* the "we build here" tag: sits above the pressed dot by default; when that would cover a neighbour's
     label or dot it tries below and beside (with the edge shifts), then hangs off the far end of the pressed
     town's OWN name (lbl-r / lbl-l), keeps the side with the least overlap that stays inside the FRAME, and
     uses a nearby empty position on phones if the standard anchors are crowded. The pressed town's own label is a hard conflict — the
     name you just tapped is never covered or dimmed (Sumner / Bonney Lake / Lake Tapps / Wilkeson vanished
     under the tag, 9/14 review). Measured, never guessed. */
  var tapTowns = towns.filter(function (t) { return t.tagName === 'BUTTON'; });
  function pct(x, y) {                                   // viewport px → % of the towns plane (the tag's positioning box)
    var tw = townsWrap.getBoundingClientRect();
    return { left: ((x - tw.left) / tw.width * 100).toFixed(3) + '%', top: ((y - tw.top) / tw.height * 100).toFixed(3) + '%' };
  }
  function placeHere(b) {
    var own = b.querySelector('.tn');
    var box = dmap ? dmap.getBoundingClientRect() : null, phone = !!box && window.matchMedia('(max-width:759px)').matches;
    /* A town whose name had to hide says its name in the tag. The compact phone check stays next to its lit name;
       even in the western cluster, neighbours keep their full contrast. */
    var hiddenName = own && own.classList.contains('hide') ? own.textContent : '';
    here.textContent = phone && box.width < 400 ? (hiddenName ? hiddenName + ' ✓' : '✓') : (hiddenName ? hiddenName + ' · ' : '') + 'we build here';
    var labels = towns.map(function (t) { return t.querySelector('.tn'); }).filter(Boolean);
    $$('.town .dim').forEach(function (l) { l.classList.remove('dim'); });
    var br = b.getBoundingClientRect(), bcx = br.left + br.width / 2, bcy = br.top + br.height / 2;
    var bx = box ? (bcx - box.left) / box.width * 100 : 50;
    var edge = bx > 72 ? ' edge-r' : bx < 28 ? ' edge-l' : '';
    var dots = towns.filter(function (t) { return t !== b && !t.classList.contains('off'); }).map(function (t) { return t.querySelector('i'); }).filter(Boolean);
    var credit = dmap && dmap.querySelector('.dmap-credit');
    /* anchors: on desktop the dot first (above / below / beside), then the far end of the pressed town's own name. On a PHONE
       (the whole ring in a ≤372 px square) the name anchors go FIRST: above the dot the tag dimmed up to three neighbours
       (Bonney Lake took Sumner, Lake Tapps and Auburn with it, 9/15 verifier); off the far end of the name it clears them. */
    var dotAnchor = { pos: pct(bcx, bcy), tries: ['here' + edge, 'here below' + edge, 'here side-r', 'here side-l', 'here', 'here below', 'here edge-l', 'here edge-r', 'here below edge-l', 'here below edge-r'] };
    var anchors = [];
    if (own && !own.classList.contains('hide')) {
      var lr = own.getBoundingClientRect(), ly = lr.top + lr.height / 2;
      anchors.push({ pos: pct(lr.right, ly), tries: ['here lbl-r'] });
      anchors.push({ pos: pct(lr.left, ly), tries: ['here lbl-l'] });
    }
    if (phone) anchors.push(dotAnchor); else anchors.unshift(dotAnchor);
    var best = null, bestScore = Infinity, bestRects = null, bestDots = null;
    var wasHidden = here.hidden; here.hidden = false; here.style.animation = 'none';
    function scoreAnchor(a) {
      if (best !== null && bestScore === 0) return;
      here.style.left = a.pos.left; here.style.top = a.pos.top;
      a.tries.forEach(function (cls) {
        if (best !== null && bestScore === 0) return;
        here.className = cls;
        var r = here.getBoundingClientRect(), score = 0, rects = [], drects = [];
        if (box) { score += (Math.max(0, box.left - r.left) + Math.max(0, r.right - box.right) + Math.max(0, box.top - r.top) + Math.max(0, r.bottom - box.bottom)) * 1e5; }
        labels.forEach(function (l) {
          var o = l.classList.contains('hide') ? 0 : rectOverlap(phone ? grow(r, 4) : r, l.getBoundingClientRect());
          rects.push(l === own ? 0 : o);
          score += (l === own ? 1000 : 1) * o;              // the pressed town's own name: never under the tag
        });
        dots.forEach(function (d) { var o = rectOverlap(phone ? grow(r, 4) : r, d.getBoundingClientRect()); drects.push(o); score += 25 * o; });   // a covered dot is someone's tap target — worth 25 covered-label pixels
        if (credit) score += 1000 * rectOverlap(grow(r, 4), credit.getBoundingClientRect());
        if (score < bestScore) { bestScore = score; best = { cls: cls, pos: a.pos }; bestRects = rects; bestDots = drects; }
      });
    }
    anchors.forEach(scoreAnchor);
    if (phone && bestScore > 0) {
      /* Expand from the pressed name in 8 px steps. Keep the closest clean position, with the pointer aimed
         back toward that name. This also handles font swaps and unusually narrow phone frames. */
      var nr = own && !own.classList.contains('hide') ? own.getBoundingClientRect() : br;
      for (var step = 8; step <= box.width && bestScore > 0; step += 8) {
        for (var dy = -step; dy <= step && bestScore > 0; dy += 8) {
          scoreAnchor({ pos: pct(nr.right + step, nr.top + nr.height / 2 + dy), tries: ['here lbl-r'] });
          scoreAnchor({ pos: pct(nr.left - step, nr.top + nr.height / 2 + dy), tries: ['here lbl-l'] });
        }
      }
    }
    here.style.left = best.pos.left; here.style.top = best.pos.top;
    here.className = best.cls; here.style.animation = ''; here.hidden = wasHidden;
    if (!phone && bestRects) labels.forEach(function (l, i) { if (bestRects[i] > 0 && l !== own) l.classList.add('dim'); });
    if (!phone && bestDots) dots.forEach(function (d, i) { if (bestDots[i] > 0) d.classList.add('dim'); });
  }
  /* in the western cluster (Puyallup · Sumner · Bonney Lake · Lake Tapps) the 44 px targets overlap, so a
     pointer tap resolves to the town whose DOT is nearest the tap point — the one the thumb was on — not
     whichever button happens to paint on top. A point INSIDE a town's name is that town (distance 0): the
     hub's label sits closer to Enumclaw's dot than to its own, so 'Buckley' lit Enumclaw (9/14 review).
     Keyboard activation (no coordinates) keeps the focused town. */
  function nearestTown(x, y) {
    var best = null, bd = Infinity;
    tapTowns.forEach(function (t) {
      var i = t.querySelector('i'); if (!i || t.classList.contains('off')) return;
      var l = t.querySelector('.tn'), d;
      if (l && !l.classList.contains('hide')) {
        var lr = l.getBoundingClientRect();
        if (x >= lr.left && x <= lr.right && y >= lr.top && y <= lr.bottom) d = 0;
      }
      if (d !== 0) { var r = i.getBoundingClientRect(), dx = r.left + r.width / 2 - x, dy = r.top + r.height / 2 - y; d = dx * dx + dy * dy; }
      if (d < bd) { bd = d; best = t; }
    });
    return best;
  }
  function toggleTown(b) {
    var on = b.getAttribute('aria-pressed') !== 'true';
    tapTowns.forEach(function (t) { t.setAttribute('aria-pressed', 'false'); t.classList.remove('is-on'); });
    $$('.town .dim').forEach(function (l) { l.classList.remove('dim'); });
    if (on) {
      b.setAttribute('aria-pressed', 'true'); b.classList.add('is-on');
      here.hidden = true;                                  // re-hide so the pop animation restarts on the chosen side
      placeHere(b);
      here.hidden = false;
    } else { here.hidden = true; }
  }
  tapTowns.forEach(function (b) {
    b.setAttribute('aria-label', b.querySelector('.tn').textContent);
    b.addEventListener('click', function (e) {
      var t = b;
      if (e && e.target && e.target.closest && e.target.closest('.tn')) { t = b; }                 // the name itself: this town, whatever dot is nearer
      else if (e && e.detail > 0 && typeof e.clientX === 'number') { var n = nearestTown(e.clientX, e.clientY); if (n) t = n; }
      toggleTown(t);
    });
  });
  /* hover follows the SAME rule as the tap (.hov, not :hover): at 1440 the Carbonado button paints over
     Wilkeson's dot, so :hover lit Carbonado while the tap lit Wilkeson (9/14 review). Mouse only — touch has no hover. */
  var hov = null;
  function setHov(t) { if (t === hov) return; if (hov) hov.classList.remove('hov'); hov = t; if (hov) hov.classList.add('hov'); }
  if (townsWrap) {
    townsWrap.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      var el = e.target && e.target.closest ? e.target.closest('button.town') : null;
      setHov(el ? nearestTown(e.clientX, e.clientY) : null);
    });
    townsWrap.addEventListener('pointerleave', function () { setHov(null); });
  }
  window.addEventListener('resize', function () { var on = $('.town[aria-pressed="true"]'); if (on && here && !here.hidden) requestAnimationFrame(function () { placeHere(on); }); });

  /* ---------- contact form ----------
     Demo mode (hidden access_key empty): show the thank-you, send nothing.
     Live mode (key filled at go-live by pages-golive.sh): POST to Web3Forms. */
  var form = $('.contact-form'), ok = $('.form-success');
  if (form && ok) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = form.querySelector('button[type=submit]'), keyEl = form.querySelector('[name=access_key]'), key = keyEl ? keyEl.value.trim() : '';
    function done() { ok.classList.add('show'); ok.setAttribute('role', 'status'); btn.disabled = true; }
    if (!key) { done(); return; }
    var label = btn.textContent; btn.disabled = true; btn.textContent = 'Sending…';
    var data = {}; new FormData(form).forEach(function (v, k) { data[k] = v; });
    data.subject = data.subject || ('Consultation request from pnw-adu.com');
    fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json(); }).then(function (j) { if (j && j.success) { done(); } else { throw new Error('send failed'); } })
      .catch(function () { btn.disabled = false; btn.textContent = label; ok.textContent = 'Couldn’t send just now — try again in a minute.'; ok.classList.add('show'); ok.setAttribute('role', 'alert'); });
  });

  /* ---------- the closing CTA: Set up a consultation → the form scrolls up (the anchor) and the cursor lands in Name ---------- */
  var bookWalk = $('#bookWalk');
  if (bookWalk && form) bookWalk.addEventListener('click', function () {
    var first = form.querySelector('input:not([type=hidden]):not([type=checkbox])');
    if (!first) return;
    setTimeout(function () { try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }, reduce ? 0 : 450);
  });

  /* ---------- THE MOTH — the porch-light sprinkle ----------
     One tiny moth. While the hero is on screen it does one thing: once the porch light is on (.is-lit,
     set by js/hero.js at the film's porch-light second) it idles in a small orbit BESIDE the render's real porch light — the
     sconce's position comes from hero.js as --lamp-x/--lamp-y (% of the hero box, recomputed from the
     render's own pixels on every resize, so it tracks object-fit). It never chases the pointer in the
     hero. Once #hero has scrolled off it follows the pointer/thumb at a lazy lag, and when the pointer
     rests (1.4 s) it drifts to a spot 26 px BESIDE the nearest lit thing in view ([data-lamp] that is
     .is-on, or data-lamp="always") — never on top of the thing it's drawn to. Never clickable, never
     in the way; removed under prefers-reduced-motion. */
  var moth = $('#moth');
  if (moth && !reduce) {
    var hero = $('#hero');
    var px = null, py = null, lastMove = -1e9, mx = -100, my = -100, vis = false, t0 = performance.now();
    window.addEventListener('pointermove', function (e) { if (e.pointerType === 'touch') return; px = e.clientX; py = e.clientY; lastMove = performance.now(); }, { passive: true });
    window.addEventListener('touchmove', function (e) { var t = e.touches[0]; if (t) { px = t.clientX; py = t.clientY; lastMove = performance.now(); } }, { passive: true });
    function heroInView() { var r = hero.getBoundingClientRect(); return r.bottom > 0; }
    /* the render's porch light, in viewport px — null until the light is on or when it's off screen
       (9/14 late: the sign board is gone, so nothing hangs over the sconce any more — the moth idles beside it). */
    function porchLight() {
      if (!hero.classList.contains('is-lit')) return null;
      var r = hero.getBoundingClientRect(), cs = getComputedStyle(hero);
      var lx = parseFloat(cs.getPropertyValue('--lamp-x')), ly = parseFloat(cs.getPropertyValue('--lamp-y'));
      if (isNaN(lx) || isNaN(ly)) return null;
      var x = r.left + r.width * lx / 100, y = r.top + r.height * ly / 100;
      if (y < 12 || y > window.innerHeight - 12) return null;
      return { x: x + 13, y: y - 7, r: 8 };                 // beside the sconce, a little above the bulb
    }
    function lampTarget() {
      if (heroInView()) return porchLight();
      var best = null, bd = 1e9, mid = window.innerHeight / 2, vw = window.innerWidth;
      $$('.is-on[data-lamp],[data-lamp="always"]').forEach(function (el) {
        var q = el.getBoundingClientRect();
        if (q.bottom < 0 || q.top > window.innerHeight || q.width === 0) return;
        var cy = q.top + q.height / 2, d = Math.abs(cy - mid);
        if (d < bd) {
          bd = d;
          var right = q.right + 26 + 12 < vw;                 // rest to the right of it, or the left near the edge
          best = { x: right ? q.right + 26 : q.left - 26, y: cy - 4, r: 9 };
        }
      });
      return best;
    }
    function frame(now) {
      requestAnimationFrame(frame);
      if (document.hidden) return;
      var t = (now - t0) / 1000, target = null;
      // follows a MOVING pointer, up and to its right (never under the cursor, never on the thing it just
      // pressed); 1.4 s after the pointer rests it drifts to beside the nearest lit thing instead
      var chasing = px !== null && (now - lastMove) < 1400 && !heroInView();
      if (chasing) {
        target = { x: px + 34 + 10 * Math.cos(t * 2.1) + 4 * Math.sin(t * 5.3), y: py - 30 + 8 * Math.sin(t * 3.1) };
      } else {
        var L = lampTarget();
        if (L) target = { x: L.x + L.r * Math.cos(t * 1.7) + 5 * Math.sin(t * 4.3), y: L.y + L.r * .55 * Math.sin(t * 2.3) + 4 * Math.cos(t * 3.9) };
      }
      if (target) {
        if (!vis) { vis = true; moth.classList.add('on'); if (mx < 0) { mx = target.x; my = target.y; } }
        mx += (target.x - mx) * .075; my += (target.y - my) * .075;
        moth.style.transform = 'translate(' + mx.toFixed(1) + 'px,' + my.toFixed(1) + 'px) rotate(' + (Math.sin(t * 2.4) * 14).toFixed(1) + 'deg)';
      } else if (vis) { vis = false; moth.classList.remove('on'); }
    }
    requestAnimationFrame(frame);
  }
})();
