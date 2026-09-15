/* PNW ADU — hero "Day into night": the add-on farmhouse (Hayden's Higgsfield concept render — "that house is
   beautiful", 9/14 evening) as a MATCHED day / dusk pair. One deterministic event on load, then still, then a toy.
   No-JS and prefers-reduced-motion never reach the motion branch: the CSS default IS the final frame (dusk).
   Nothing sits on the hero but the small concept tag, the one mono hint, and the sr-only h1.

   Four jobs here:
     1. PLACE — the porch sconce (the moth's idle spot, js/site.js) is anchored in the render's OWN pixels (FRAMES
        below) and pushed through the object-fit: cover maths into hero-box percentages (--lamp-x/-y) on load and
        every resize, so it stays on the sconce whatever the viewport crops.
     2. THE EVENT — day → dusk ONCE: the dusk still (over the day still, same composition to the pixel — ORB fit
        scale 1.000 / shift ≤ .5 px, 9/14) goes opacity 0 → 1 over 2.6 s on a power2.in ease, so the sky cools
        first and the windows "come on" late in the sweep; .is-lit (the moth wakes) at 60% dusk; done at ~2.85 s.
        Starts only once both stills have decoded (4 s guard). Never loops.
     3. THE TOY — "drag the day into night": after the event, ONE number (--dusk, 0 = day … 1 = dusk) follows the
        pointer's x across the hero. Touch / pen: press and drag sideways (8 px before it takes, so a tap does
        nothing), released → a .3 s settle onto where the finger was, then 2 s later it eases back to dusk.
        Mouse: a hover-move sweeps it with no click and no lag (the flashlight pattern); 2 s after the pointer
        leaves it eases back to dusk. The one mono hint fades after the first drag. Toddler Law: one gesture,
        instant payoff, no modes. touch-action: pan-y on the hero keeps vertical scrolling native.
     4. DEPTH — the depth layers load in finish(), after the event, and the parallax arms the moment both cutouts
        have decoded (has-fg), easing into place if the page is already scrolled: the background group (#heroBg: day + dusk stills + the plugs) lags the scroll (translateY
        up to --plx, 60 px landscape / 48 px portrait, eased over ~2.7×plx of scroll) while the foreground (#heroFg:
        the house cut out WITH the ground below the horizon) rides with the page at 1× — sky and trees slide behind
        the house. The cutout and the plug are BOTH day/dusk pairs stacked the same way as the stills, so the toy
        keeps working over the depth layers (every dusk layer sits at opacity --dusk over its day twin). */
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
  var dusk = 1;
  function setDusk(v) {
    v = v < 0 ? 0 : v > 1 ? 1 : v; dusk = v;
    hero.style.setProperty('--dusk', v.toFixed(3));
    hero.classList.toggle('is-lit', v >= .6);           // the porch light reads as ON from 60% dusk (the moth wakes / sleeps)
  }

  var state = 'pending';                                  // pending → event → done
  /* exposed for the QA / bounds probe only (nothing on the page calls it) */
  window.PNW_HERO = { fit: fit, frames: FRAMES, frame: frameName, state: function () { return state; }, shift: bgShift, dusk: function () { return dusk; } };

  place();
  window.addEventListener('resize', place);

  var reduce = root.classList.contains('reduce') || !window.gsap;
  if (reduce) {                                            // reduced-motion / no GSAP: the dusk still, no event, no toy, no parallax
    hero.classList.add('is-lit', 'is-done'); state = 'done';
    if (mq) (mq.addEventListener ? mq.addEventListener('change', place) : mq.addListener(place));
    return;
  }

  /* ---------- depth: the cutout + plug, day and dusk, for the showing orientation ---------- */
  var st = null, layers = null, fgFrame = '';
  function loadFg() {
    if (!fgWrap || !plugWrap || !bg || !window.ScrollTrigger) return;
    var name = frameName(), f = FRAMES[name];
    if (fgFrame === name) return; fgFrame = name;
    hero.classList.remove('has-fg');
    if (!layers) {
      layers = {};
      [['fgDay', fgWrap, 'l-day'], ['fgDusk', fgWrap, 'l-dusk'], ['plugDay', plugWrap, 'l-day'], ['plugDusk', plugWrap, 'l-dusk']].forEach(function (d) {
        var img = new Image(); img.alt = ''; img.decoding = 'async'; img.className = d[2]; d[1].appendChild(img); layers[d[0]] = img;
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
     created (a thumb that scrolled during the event), ScrollTrigger sets its progress at once — the sky snapped ~48 px in one
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
  /* the depth layers load AFTER the event (the only heavy decode otherwise scheduled inside the 2.6 s ramp); has-fg gates the parallax */
  function finish() { if (state === 'done') return; state = 'done'; hero.classList.add('is-done'); loadFg(); }

  /* ---------- the event: day → dusk, once ---------- */
  var tl = null, o = { v: 0 };
  function ready(img) {
    return new Promise(function (res) {
      function dec() { (img.decode ? img.decode().catch(function () {}) : Promise.resolve()).then(res, res); }
      if (img.complete && img.naturalWidth) { dec(); return; }
      img.addEventListener('load', dec, { once: true });
      img.addEventListener('error', res, { once: true });
    });
  }
  function runEvent() {
    if (state !== 'pending') return; state = 'event';
    setDusk(0);
    tl = gsap.timeline({ paused: true, onComplete: finish })
      .to(o, { v: 1, duration: 2.6, ease: 'power2.in', onUpdate: function () { setDusk(o.v); } }, 0.25);   // a breath on the day, then the light goes
    /* start only once both stills are decoded — the 0.25 s hold is on the DAY house, not on a blank box.
       A 4 s guard means a slow network still gets the event rather than never. */
    Promise.race([Promise.all([ready(dayImg), ready(duskImg)]), new Promise(function (res) { setTimeout(res, 4000); })])
      .then(function () { place(); tl.play(0); });
  }
  runEvent();

  /* ---------- the toy: drag (or hover) the day into night ---------- */
  var toy = { pressed: false, ptr: null, x0: 0, moved: false, travel: 0, lastX: null, dragged: false, idle: null, tw: null };
  function frac(e) { var r = hero.getBoundingClientRect(), f = (e.clientX - r.left) / r.width; return f < 0 ? 0 : f > 1 ? 1 : f; }
  function killTw() { if (toy.tw) { toy.tw.kill(); toy.tw = null; } clearTimeout(toy.idle); }
  function firstDrag() { if (toy.dragged) return; toy.dragged = true; hero.classList.add('has-dragged'); }
  function follow(e) { killTw(); setDusk(frac(e)); }
  function tweenTo(v, dur, ease) { killTw(); var s = { v: dusk }; toy.tw = gsap.to(s, { v: v, duration: dur, ease: ease, onUpdate: function () { setDusk(s.v); }, onComplete: function () { toy.tw = null; } }); }
  function idle() { clearTimeout(toy.idle); toy.idle = setTimeout(function () { tweenTo(1, 1.6, 'power2.inOut'); }, 2000); }   // back to dusk — the sell — 2 s after the hand leaves
  function release(e) { tweenTo(e ? frac(e) : dusk, .3, 'power2.out'); idle(); }                                                // the .3 s settle, then the idle clock
  function onDown(e) {
    if (state !== 'done') return;
    if (e.pointerType === 'mouse') { follow(e); return; }                        // a mouse already follows on move
    /* the running return-to-dusk tween is NOT killed here: a tap, or a vertical scroll starting on the hero
       (pointerdown → the browser takes the pan → pointercancel), must leave it running — killing it froze the
       hero at a half-lit frame (--dusk stuck at .77 / .47, 9/15 verifier). It dies in onMove once the drag takes. */
    toy.pressed = true; toy.ptr = e.pointerId; toy.x0 = e.clientX; toy.moved = false;
  }
  function onMove(e) {
    if (state !== 'done') return;
    if (e.pointerType === 'mouse') {
      if (toy.lastX !== null) { toy.travel += Math.abs(e.clientX - toy.lastX); if (toy.travel >= 40) firstDrag(); }
      toy.lastX = e.clientX; follow(e); return;
    }
    if (!toy.pressed || e.pointerId !== toy.ptr) return;
    if (!toy.moved) {
      if (Math.abs(e.clientX - toy.x0) < 8) return;                               // a tap, or a scroll starting: nothing happens
      toy.moved = true; firstDrag(); killTw();                                     // the drag has taken: now the hand owns the light
      try { hero.setPointerCapture(e.pointerId); } catch (x) {}
    }
    follow(e);
  }
  function onUp(e) {
    if (e.pointerType === 'mouse') return;                                        // mouse: pointerleave runs the idle clock
    if (!toy.pressed || e.pointerId !== toy.ptr) return;
    toy.pressed = false;
    if (toy.moved) release(e.type === 'pointercancel' ? null : e);                // a tap / a scroll: whatever was running (the ease back to dusk) keeps running
  }
  function onLeave(e) { if (e.pointerType === 'mouse' && state === 'done') { toy.lastX = null; idle(); } }
  hero.addEventListener('pointerdown', onDown);
  hero.addEventListener('pointermove', onMove);
  hero.addEventListener('pointerup', onUp);
  hero.addEventListener('pointercancel', onUp);
  hero.addEventListener('pointerleave', onLeave);

  /* the frame flips (a phone rotates): re-place the sconce; the depth layers reload for the new pair (the <picture>
     stills already switched — a mid-event crossfade simply continues on the new pair). */
  function onFrameChange() {
    place();
    if (state === 'done') { fgFrame = ''; loadFg(); }
  }
  if (mq) (mq.addEventListener ? mq.addEventListener('change', onFrameChange) : mq.addListener(onFrameChange));

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (tl) tl.pause(); }
    else if (tl && tl.progress() < 1) tl.resume();
  });
})();
