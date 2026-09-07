/* fire.js — the wok on fire.
   Their sign's own flame (the one painted over the "o" in Wok) gets a real
   fire: canvas particles rising off that exact spot, an ignition burst on
   load, then a steady low flicker. Deterministic (seeded), autoplays once,
   pauses when the tab is hidden, and does nothing at all under
   prefers-reduced-motion (the CSS lands on the final frame: a warm glow). */
(function () {
  'use strict';
  var stage = document.getElementById('markStage');
  var canvas = document.getElementById('fireCanvas');
  var mark = stage && stage.querySelector('.mark');
  if (!stage || !canvas || !mark) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    stage.classList.add('is-lit'); return;
  }
  var ctx = canvas.getContext('2d');
  if (!ctx) { stage.classList.add('is-lit'); return; }

  /* seeded PRNG so every load plays the same fire */
  var seed = 0x7E12A;
  function rnd() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }

  /* where the flame lives on the sign, as fractions of the mark box:
     the painted flame sits over the "o" in Wok — its base is ~54% down,
     centred ~84.5% across; the fire licks up from there. */
  var FX = 0.845, FY = 0.56, SPREAD = 0.075;

  var W = 0, H = 0, dpr = 1, emitter = { x: 0, y: 0, w: 0, h: 0 };
  function size() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    var r = stage.getBoundingClientRect(), m = mark.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    emitter.x = (m.left - r.left) + m.width * FX;
    emitter.y = (m.top - r.top) + m.height * FY;
    emitter.w = m.width * SPREAD;
    emitter.h = m.height;          /* flame height scales with the mark */
  }
  size();
  var ro = window.ResizeObserver ? new ResizeObserver(size) : null;
  if (ro) ro.observe(stage); else window.addEventListener('resize', size);

  var P = [], EMBERS = [];
  function spawn(burst) {
    var x = emitter.x + (rnd() * 2 - 1) * emitter.w;
    var y = emitter.y + (rnd() - 0.5) * emitter.h * 0.08;
    var speed = (0.9 + rnd() * 0.8) * emitter.h * (burst ? 2.4 : 1.9);
    P.push({
      x: x, y: y,
      vx: (rnd() * 2 - 1) * emitter.h * 0.18,
      vy: -speed,
      life: 0, ttl: 0.42 + rnd() * 0.45,
      r: emitter.h * (0.10 + rnd() * 0.12) * (burst ? 1.25 : 1),
      wob: rnd() * 6.28
    });
    if (rnd() < (burst ? 0.35 : 0.05)) {
      EMBERS.push({ x: x, y: y, vx: (rnd() * 2 - 1) * emitter.h * 0.5, vy: -speed * (1.1 + rnd() * 0.6), life: 0, ttl: 1.2 + rnd() * 1.4, r: 1 + rnd() * 1.6 });
    }
  }

  /* colour ramp: pale-yellow core → orange → deep red → smoke-out.
     Each particle is a soft radial blob so the flame has no hard edges. */
  function rgb(t) {
    if (t < 0.2) return [255, 232, 150, 0.55 - t * 0.6];
    if (t < 0.5) return [255, 160, 40, 0.42 - (t - 0.2) * 0.5];
    if (t < 0.8) return [225, 70, 18, 0.28 - (t - 0.5) * 0.5];
    return [120, 18, 10, Math.max(0, 0.12 - (t - 0.8) * 0.6)];
  }
  function blob(x, y, r, t) {
    var c = rgb(t); if (c[3] <= 0.01 || r < 0.5) return;
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + c[3] + ')');
    g.addColorStop(0.55, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (c[3] * 0.45) + ')');
    g.addColorStop(1, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, r * 0.8, r * 1.3, 0, 0, 6.2832); ctx.fill();
  }

  var start = null, last = null, lit = false, running = true;
  function frame(ts) {
    if (!running) return;
    if (start === null) { start = ts; last = ts; }
    var dt = Math.min(0.05, (ts - last) / 1000); last = ts;
    var T = (ts - start) / 1000;

    /* timeline: 0–0.55 s dark, 0.55 s ignition burst, then steady;
       from 6 s the fire settles to a low idle */
    if (!lit && T > 0.55) { lit = true; stage.classList.add('is-lit'); for (var b = 0; b < 40; b++) spawn(true); }
    if (lit) {
      var rate = T < 6 ? 230 : 140;            /* particles per second */
      var n = rate * dt + (rnd() < (rate * dt) % 1 ? 1 : 0);
      for (var i = 0; i < n; i++) spawn(false);
    }

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (var k = P.length - 1; k >= 0; k--) {
      var p = P[k]; p.life += dt;
      var t = p.life / p.ttl;
      if (t >= 1) { P[k] = P[P.length - 1]; P.pop(); continue; }
      p.wob += dt * 8;
      p.x += (p.vx * (1 - t) + Math.sin(p.wob) * emitter.h * 0.16 * (1 - t * 0.5)) * dt;
      p.y += p.vy * dt;
      p.vy *= (1 - 0.5 * dt);
      blob(p.x, p.y, p.r * (1 - t * 0.85), t);
    }
    for (var e = EMBERS.length - 1; e >= 0; e--) {
      var q = EMBERS[e]; q.life += dt; var u = q.life / q.ttl;
      if (u >= 1) { EMBERS[e] = EMBERS[EMBERS.length - 1]; EMBERS.pop(); continue; }
      q.x += (q.vx + Math.sin(q.life * 9) * emitter.h * 0.3) * dt; q.y += q.vy * dt; q.vy *= (1 - 0.35 * dt);
      ctx.beginPath(); ctx.fillStyle = 'rgba(255,200,90,' + (1 - u) * 0.9 + ')';
      ctx.arc(q.x, q.y, q.r * (1 - u * 0.5), 0, 6.2832); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { running = false; }
    else if (!running) { running = true; last = null; start = start === null ? null : performance.now() - 7000; requestAnimationFrame(function (ts) { last = ts; frame(ts); }); }
  });
})();
