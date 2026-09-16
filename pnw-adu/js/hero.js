/* PNW ADU — hero "Day into sunset": the add-on farmhouse (Hayden's Higgsfield concept render — "that house is
   beautiful", 9/14 evening) as a MATCHED day / dusk pair. ONE slow one-way sweep on load — day → a warm golden
   sunset midpoint → dusk — then still, forever. No pointer code of any kind (Hayden, 9/15 rev 2: "I don't need my
   mouse to be the one that affects the daytime"). No-JS and prefers-reduced-motion never reach the motion branch:
   the CSS default IS the final frame (dusk). Nothing sits on the hero but the small concept tag and the sr-only h1.

   Three jobs here:
     1. PLACE — the porch sconce (the moth's idle spot, js/site.js) is anchored in the render's OWN pixels (FRAMES
        below) and pushed through the object-fit: cover maths into hero-box percentages (--lamp-x/-y) on load and
        every resize, so it stays on the sconce whatever the viewport crops.
     2. THE SWEEP — one GSAP timeline, ~8 s, deterministic, once (SWEEP below). Two numbers drive it:
          --dusk 0 → 1 (the dusk still over the day still, same composition to the pixel — ORB fit scale 1.000 /
                        shift ≤ .5 px, 9/14) over 7.4 s on power2.inOut after a .6 s breath on the day — slow in,
                        slow out; the windows come on in the last two seconds.
          --gold 0 → .55 → 0 (the warm grade layer .hero-grade, amber-orange, soft-light, plus a saturation lift on
                        the picture) — rises over the first half, holds through ~48–60 % of the sweep, and falls to
                        0 as the dusk frame takes over: the middle reads as SUNSET, not a crossfade.
        .is-lit (the moth wakes) at 60 % dusk; .is-done at the end. Starts only once both stills have decoded
        (4 s guard). Pauses while the tab is hidden and resumes where it was — it can never rest at a half state,
        because nothing else ever writes --dusk or --gold. Never loops.
     3. DEPTH — the depth layers load after BOTH window.load and the sweep, and the parallax arms the moment both
        cutouts have decoded (has-fg), easing into place if the page is already scrolled: the background group
        (#heroBg: day + dusk stills + the plugs) lags the scroll (translateY up to --plx, 60 px landscape / 48 px
        portrait, eased over ~2.7×plx of scroll) while the foreground (#heroFg: the house cut out WITH the ground
        below the horizon) rides with the page at 1× — sky and trees slide behind the house. The cutout and the
        plug are BOTH day/dusk pairs stacked the same way as the stills (every dusk layer sits at opacity --dusk
        over its day twin), so at rest they are the same pixels as the stills beneath. */
(function () {
  'use strict';
  var hero = document.getElementById('hero'); if (!hero) return;
  var root = document.documentElement, $ = function (id) { return document.getElementById(id); };
  var dayImg = $('heroDay'), duskImg = $('heroDusk');
  var bg = $('heroBg'), fgWrap = $('heroFg'), plugWrap = $('heroPlug');
  if (!dayImg || !duskImg) { hero.classList.add('is-lit', 'is-done'); return; }

  /* Which frame is showing — MUST match the <source media> in index.html and the @media in style.css. */
  var mq = window.matchMedia ? matchMedia('(max-aspect-ratio: 1/1)') : null;
  function frameName() { return mq && mq.matches ? 'tall' : 'wide'; }

  /* Natural-pixel anchors, measured on the renders (hero2-*-wide 2752×1536, hero2-*-tall 1856×2304; NOTES.md):
       house   — leftmost porch-roof tip → rightmost wall, from the cut's alpha ≥128 (QA bounds probe). The tall
                 frame's right wing runs off the render's own edge, so its house ends at the frame edge.
       horizon — the far-field / lawn line (render px): the foreground layer is the house + everything below this
                 line; the sky, trees and far field above it are the background that lags.
       lamp    — the wall sconce beside the porch door (the moth's idle spot, js/site.js).
       fg/plug — the depth assets for that orientation, day + dusk (all in images/hero/). */
  var FRAMES = {
    wide: { w: 2752, h: 1536, house: [569, 2682], horizon: 1140, lamp: { x: 1436, y: 940 },
            fg: { day: 'images/hero/fg-day-wide.webp', dusk: 'images/hero/fg-dusk-wide.webp' },
            plug: { day: 'images/hero/plug-day-wide.webp', dusk: 'images/hero/plug-dusk-wide.webp' } },
    tall: { w: 1856, h: 2304, house: [310, 1855], horizon: 1530, lamp: { x: 1228, y: 1345 },
            fg: { day: 'images/hero/fg-day-tall.webp', dusk: 'images/hero/fg-dusk-tall.webp' },
            plug: { day: 'images/hero/plug-day-tall.webp', dusk: 'images/hero/plug-dusk-tall.webp' } }
  };

  /* THE SWEEP's timing, in seconds. hold = the breath on the day before anything moves; dusk = how long --dusk takes
     0 → 1 (power2.inOut); goldUp / goldHold / goldDown = the grade's rise, plateau and fall (sine.inOut, starting with
     the dusk tween). Total = hold + dusk = 8.0 s. Peak gold (.55) sits at 3.4–4.6 s of the 8 s (≈ 43–58 % of the
     sweep); dusk is only ~.29 → .50 there, so the sky is still half bright behind the orange — sunset, not a
     crossfade — and the windows come on after the gold has gone (gold reaches 0 at 7.6 s, dusk 1 at 8.0 s). */
  var SWEEP = { hold: .3, duskDelay: .8, dusk: 2.9, goldUp: 1.4, goldHold: .6, goldDown: 1.5, peak: .55 };   // 9/16 (Hayden: "two times quicker") — every number halved, so the shape is identical at 4.0 s instead of 8.0. 9/15: dusk waits behind the gold so the day sky still shows under the peak (it was cancelling the grade's warm top)

  function plx() { return parseFloat(getComputedStyle(hero).getPropertyValue('--plx')) || 0; }
  /* how far the background group is currently translated (0 at rest; the parallax moves it) */
  function bgShift() { if (!bg) return 0; return (bg.getBoundingClientRect().top - hero.getBoundingClientRect().top) + plx(); }

  /* object-fit: cover maths for the <img> box. object-position is read from the stylesheet so CSS stays the
     single source of truth (percentages only). Returns the scale + offsets that map render px → hero px,
     with any parallax shift of the background removed (the anchors belong to the static house layer). */
  function fit() {
    var f = FRAMES[frameName()], r = duskImg.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    var bw = r.width, bh = r.height, s = Math.max(bw / f.w, bh / f.h);
    var pos = (getComputedStyle(duskImg).objectPosition || '50% 50%').split(/\s+/);
    var px = parseFloat(pos[0]) / 100, py = parseFloat(pos[1] || '50%') / 100;
    if (isNaN(px)) px = .5; if (isNaN(py)) py = .5;
    return { f: f, s: s, W: hr.width, H: hr.height,
             offX: (r.left - hr.left) + (bw - f.w * s) * px, offY: (r.top - hr.top) - bgShift() + (bh - f.h * s) * py };
  }
  function toHero(F, x, y) { return { x: F.offX + x * F.s, y: F.offY + y * F.s }; }

  function place() {
    var F = fit(), L = toHero(F, F.f.lamp.x, F.f.lamp.y);
    hero.style.setProperty('--lamp-x', (L.x / F.W * 100).toFixed(2) + '%');
    hero.style.setProperty('--lamp-y', (L.y / F.H * 100).toFixed(2) + '%');
  }

  /* ---------- the light: ONE number drives the dusk still, the dusk cutout and the dusk plug ---------- */
  var dusk = 1, gold = 0;
  function setDusk(v) {
    v = v < 0 ? 0 : v > 1 ? 1 : v; dusk = v;
    hero.style.setProperty('--dusk', v.toFixed(3));
    hero.classList.toggle('is-lit', v >= .6);           // the porch light reads as ON from 60% dusk (the moth wakes)
  }
  /* the sunset grade: --gold drives .hero-grade's opacity and the saturation lift (.is-grading keeps the filter off
     the picture entirely while gold is 0 — before the sweep and forever after it) */
  function setGold(v) {
    v = v < 0 ? 0 : v > 1 ? 1 : v; gold = v;
    hero.style.setProperty('--gold', v.toFixed(3));
    hero.classList.toggle('is-grading', v > .002);
  }

  var state = 'pending';                                  // pending → sweep → done
  /* exposed for the QA / bounds probe only (nothing on the page calls it) */
  window.PNW_HERO = { fit: fit, frames: FRAMES, frame: frameName, state: function () { return state; }, shift: bgShift, dusk: function () { return dusk; }, gold: function () { return gold; }, sweep: SWEEP };

  place();
  window.addEventListener('resize', place);

  var reduce = root.classList.contains('reduce') || !window.gsap;
  if (reduce) {                                            // reduced-motion / no GSAP: the dusk still, no sweep, no parallax
    hero.classList.add('is-lit', 'is-done'); state = 'done';
    if (mq) (mq.addEventListener ? mq.addEventListener('change', place) : mq.addListener(place));
    return;
  }

  /* ---------- depth: the cutout + plug, day and dusk, for the showing orientation ---------- */
  var st = null, layers = null, fgFrame = '', pageLoaded = document.readyState === 'complete';
  function loadFg() {
    if (!pageLoaded || state !== 'done' || !fgWrap || !plugWrap || !bg || !window.ScrollTrigger) return;
    var name = frameName(), f = FRAMES[name];
    if (fgFrame === name) return; fgFrame = name;
    hero.classList.remove('has-fg');
    if (!layers) {
      layers = {};
      [['fgDay', fgWrap, 'l-day'], ['fgDusk', fgWrap, 'l-dusk'], ['plugDay', plugWrap, 'l-day'], ['plugDusk', plugWrap, 'l-dusk']].forEach(function (d) {
        var img = new Image(); img.alt = ''; img.decoding = 'async'; img.fetchPriority = 'low'; img.className = d[2]; d[1].appendChild(img); layers[d[0]] = img;
      });
    }
    var n = 0;
    function one() { if (++n === 4 && fgFrame === name) { hero.classList.add('has-fg'); startParallax(); } }
    function ready(img, src) {
      img.onload = null; img.onerror = null;
      img.src = src;
      (img.decode ? img.decode() : Promise.resolve()).then(one, function () { /* a failed layer: no depth, the still stays whole */ });
    }
    ready(layers.fgDay, f.fg.day); ready(layers.fgDusk, f.fg.dusk); ready(layers.plugDay, f.plug.day); ready(layers.plugDusk, f.plug.dusk);
  }
  /* Armed the moment .has-fg lands (both cutouts decoded) — the 9/14 "still jumped under a scroll" was the WHOLE still moving
     before the cutout existed, which the has-fg gate already prevents. If the page is already scrolled when the trigger is
     created (a thumb that scrolled during the sweep), ScrollTrigger sets its progress at once — the sky snapped ~48 px in one
     frame while the house stayed put (9/15 verifier) — so the group is eased from 0 into place over .45 s before the scrub
     takes over; any scroll during that ease hands control to the scrub straight away. */
  var easeTw = null;
  function startParallax() {
    if (st) { ScrollTrigger.refresh(); return; }
    gsap.registerPlugin(ScrollTrigger);
    st = gsap.to(bg, { y: function () { return plx(); }, ease: 'sine.out',
      scrollTrigger: { start: 0, end: function () { return Math.round(plx() * 2.7); }, scrub: .45, invalidateOnRefresh: true,
        onUpdate: function () { if (easeTw) { easeTw.kill(); easeTw = null; } } } });
    var y0 = parseFloat(gsap.getProperty(bg, 'y')) || 0;
    if (y0 > 0.5) easeTw = gsap.fromTo(bg, { y: 0 }, { y: y0, duration: .45, ease: 'sine.out', overwrite: false, onComplete: function () { easeTw = null; } });
  }
  /* Wait for both gates in either order: no cutout request competes with the initial page load or the 8 s sweep.
     Defer one task after window.load so its dispatch completes before any depth src is assigned. */
  if (!pageLoaded) window.addEventListener('load', function () {
    setTimeout(function () { pageLoaded = true; loadFg(); }, 0);
  }, { once: true });
  function finish() { if (state === 'done') return; state = 'done'; hero.classList.add('is-done'); loadFg(); }

  /* ---------- the sweep: day → sunset → dusk, once (timing: SWEEP, declared above) ---------- */
  var tl = null, o = { d: 0, g: 0 };
  function ready(img) {
    return new Promise(function (res) {
      function dec() { (img.decode ? img.decode().catch(function () {}) : Promise.resolve()).then(res, res); }
      if (img.complete && img.naturalWidth) { dec(); return; }
      img.addEventListener('load', dec, { once: true });
      img.addEventListener('error', res, { once: true });
    });
  }
  function runSweep() {
    if (state !== 'pending') return; state = 'sweep';
    setDusk(0); setGold(0);
    var t0 = SWEEP.hold, S = SWEEP;
    tl = gsap.timeline({ paused: true, onComplete: function () { setDusk(1); setGold(0); finish(); } })
      .to(o, { d: 1, duration: S.dusk, ease: 'power2.inOut', onUpdate: function () { setDusk(o.d); } }, t0 + S.duskDelay)
      .to(o, { g: S.peak, duration: S.goldUp, ease: 'sine.inOut', onUpdate: function () { setGold(o.g); } }, t0)
      .to(o, { g: 0, duration: S.goldDown, ease: 'sine.inOut', onUpdate: function () { setGold(o.g); } }, t0 + S.goldUp + S.goldHold);
    /* start only once both stills are decoded — the .6 s hold is on the DAY house, not on a blank box.
       A 4 s guard means a slow network still gets the sweep rather than never. */
    Promise.race([Promise.all([ready(dayImg), ready(duskImg)]), new Promise(function (res) { setTimeout(res, 4000); })])
      .then(function () { place(); tl.play(0); });
  }
  runSweep();

  /* the frame flips (a phone rotates): re-place the sconce; the depth layers reload for the new pair (the <picture>
     stills already switched — a mid-sweep crossfade simply continues on the new pair). */
  function onFrameChange() {
    place();
    if (state === 'done') { fgFrame = ''; loadFg(); }
  }
  if (mq) (mq.addEventListener ? mq.addEventListener('change', onFrameChange) : mq.addListener(onFrameChange));

  /* a hidden tab pauses the sweep and resumes it from the same frame — never a jump, never a stall (a paused
     timeline resumes the moment the tab is visible; nothing else can write --dusk / --gold) */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (tl) tl.pause(); }
    else if (tl && tl.progress() < 1) tl.resume();
  });
})();
