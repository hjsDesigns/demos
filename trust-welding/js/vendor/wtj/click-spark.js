/*
 * Click Spark — vanilla port of React Bits ClickSpark (reactbits.dev/animations/click-spark)
 * Source: https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/ClickSpark/ClickSpark.jsx
 * fetched 2026-11-05. License: MIT + Commons Clause (c) 2026 David Haz — use inside a site is allowed;
 * never sell or redistribute the component itself. The engine below is the original's draw code, line for line:
 * same EASINGS, GRAVITY 500, MAX_BURSTS 32, REDUCED_MS 320, same spark jitter/reach/scale/life math,
 * same per-burst canvas sizing. Only the React wrapper is replaced by ClickSpark.attach(root, opts).
 *
 * Usage: const s = ClickSpark.attach(el, {sparkColor:['#fff','#FFD27A'], shape:'streak', gravity:1.2, ...});
 *        s.spark(x, y)   // fire one burst at x,y relative to el (center if omitted)
 *        s.destroy()
 * attach() listens to the root's pointer/click like the original; pass {auto:false} to only fire via s.spark().
 */
(function (global) {
  'use strict';
  var EASINGS = {
    linear: function (t) { return t; },
    'ease-in': function (t) { return t * t; },
    'ease-out': function (t) { return 1 - Math.pow(1 - t, 3); },
    'ease-in-out': function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    spring: function (t) { return 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2); }
  };
  var SHAPES = ['line', 'streak', 'dot', 'star'];
  var MAX_BURSTS = 32, GRAVITY = 500, REDUCED_MS = 320;
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function smoothstep(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function toColors(v) { var l = (Array.isArray(v) ? v : [v]).filter(Boolean); return l.length ? l : ['#ffffff']; }
  function starPath(ctx, x, y, r, rot) {
    var pinch = r * 0.16; ctx.beginPath(); ctx.moveTo(x + Math.cos(rot) * r, y + Math.sin(rot) * r);
    for (var i = 1; i <= 4; i++) { var a = rot + (i * Math.PI) / 2, mid = a - Math.PI / 4;
      ctx.quadraticCurveTo(x + Math.cos(mid) * pinch, y + Math.sin(mid) * pinch, x + Math.cos(a) * r, y + Math.sin(a) * r); }
    ctx.closePath();
  }
  function channels(ctx, color) {
    ctx.fillStyle = color; var n = String(ctx.fillStyle);
    var hex = /^#([0-9a-f]{6})$/i.exec(n);
    if (hex) { var v = parseInt(hex[1], 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
    var rgb = /^rgba?\(([^)]+)\)$/i.exec(n);
    if (rgb) return rgb[1].split(',').slice(0, 3).map(function (p) { return parseFloat(p); });
    return [0, 0, 0];
  }
  function settingsFrom(o) {
    o = o || {};
    var d = function (k, v) { return o[k] === undefined ? v : o[k]; };
    var easing = d('easing', 'ease-out'), shape = d('shape', 'line');
    return {
      colors: toColors(d('sparkColor', '#fff')),
      size: Math.max(0, d('sparkSize', 14)),
      radius: Math.max(0, d('sparkRadius', 30)) * Math.max(0, d('extraScale', 1)),
      count: clamp(Math.round(d('sparkCount', 8)), 1, 64),
      width: Math.max(0.5, d('sparkWidth', 2)),
      duration: Math.max(60, d('duration', 500)),
      ease: EASINGS[easing] || EASINGS['ease-out'],
      shape: SHAPES.indexOf(shape) >= 0 ? shape : 'line',
      randomness: clamp(d('randomness', 0.2), 0, 1),
      gravity: Math.max(0, d('gravity', 0)),
      spread: clamp(d('spread', 360), 0, 360),
      direction: d('direction', 0),
      glow: clamp(d('glow', 0), 0, 1),
      ring: !!d('ring', false),
      disabled: !!d('disabled', false)
    };
  }
  function attach(root, opts) {
    opts = opts || {};
    var s0 = settingsFrom(opts);
    if (getComputedStyle(root).position === 'static') root.style.position = 'relative';
    var layer = document.createElement('span');
    layer.setAttribute('aria-hidden', 'true');
    Object.assign(layer.style, { position: 'absolute', inset: '0', zIndex: opts.layer === 'back' ? -1 : 5, overflow: 'visible', pointerEvents: 'none' });
    root.appendChild(layer);
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var bursts = [], raf = 0, lastPress = { time: -1e9, x: 0, y: 0 };
    function drop(s, sec) { return 0.5 * s.gravity * GRAVITY * sec * sec; }
    function position(b, sp, dist, sec) { return [b.x + Math.cos(sp.angle) * dist, b.y + Math.sin(sp.angle) * dist + drop(b.settings, sec)]; }
    function drawSpark(ctx, b, sp, el) {
      var s = b.settings, life = reduced ? REDUCED_MS : s.duration * sp.life, p = el / life;
      if (p >= 1) return false;
      var e = reduced ? 0.55 : s.ease(clamp(p, 0, 1)), sec = reduced ? 0 : el / 1000;
      var dist = s.radius * sp.reach * e, width = s.width * sp.scale;
      var fade = reduced ? 1 - p : 1 - smoothstep(s.shape === 'line' ? 0.55 : 0.7, 1, p);
      if (fade <= 0) return true;
      ctx.strokeStyle = sp.color; ctx.fillStyle = sp.color;
      if (s.shape === 'line') {
        var len = s.size * sp.scale * (reduced ? 0.5 : Math.pow(1 - p, 1.6));
        var a = position(b, sp, dist, sec), c = position(b, sp, dist + Math.max(0.01, len), sec);
        ctx.lineCap = 'round';
        if (sp.glow > 0) { ctx.globalAlpha = fade * 0.14 * sp.glow; ctx.lineWidth = width * 4.5; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke(); }
        ctx.globalAlpha = fade; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke();
        return true;
      }
      if (s.shape === 'streak') {
        var lag = reduced ? 0 : Math.min(el, 70 + s.size * 4 * sp.scale);
        var back = reduced ? 0.4 : s.ease(clamp((el - lag) / life, 0, 1));
        var h = position(b, sp, dist, sec), t = position(b, sp, s.radius * sp.reach * back, Math.max(0, sec - lag / 1000));
        var dx = h[0] - t[0], dy = h[1] - t[1], L = Math.hypot(dx, dy) || 1;
        var nx = (-dy / L) * width * 0.5, ny = (dx / L) * width * 0.5;
        var paint = function (sw, alpha) {
          var g = ctx.createLinearGradient(t[0], t[1], h[0], h[1]); g.addColorStop(0, sp.clear); g.addColorStop(1, sp.color);
          ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(t[0], t[1]);
          ctx.lineTo(h[0] + nx * sw, h[1] + ny * sw); ctx.lineTo(h[0] - nx * sw, h[1] - ny * sw); ctx.closePath(); ctx.fill();
          ctx.fillStyle = sp.color; ctx.beginPath(); ctx.arc(h[0], h[1], width * 0.5 * sw, 0, Math.PI * 2); ctx.fill();
        };
        if (sp.glow > 0) paint(3.2, fade * 0.16 * sp.glow);
        paint(1, fade); return true;
      }
      if (s.shape === 'dot') {
        var q = position(b, sp, dist, sec), r = width * 1.25 * (1 - 0.5 * e);
        if (sp.glow > 0) { ctx.globalAlpha = fade * 0.18 * sp.glow; ctx.beginPath(); ctx.arc(q[0], q[1], r * 2.6, 0, Math.PI * 2); ctx.fill(); }
        ctx.globalAlpha = fade; ctx.beginPath(); ctx.arc(q[0], q[1], r, 0, Math.PI * 2); ctx.fill(); return true;
      }
      var z = position(b, sp, dist, sec);
      var tw = reduced ? 1 - p : Math.pow(Math.sin(Math.PI * clamp(p * 1.1, 0, 1)), 0.7);
      var rad = s.size * 0.6 * sp.scale * tw, rot = sp.angle + sp.spin * p * Math.PI * 0.5;
      if (rad <= 0.05) return true;
      if (sp.glow > 0) { ctx.globalAlpha = fade * 0.2 * sp.glow; ctx.beginPath(); ctx.arc(z[0], z[1], rad * 1.1, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = fade; starPath(ctx, z[0], z[1], rad, rot); ctx.fill(); return true;
    }
    function drawRing(ctx, b, el) {
      var s = b.settings, life = reduced ? REDUCED_MS : s.duration * 0.8, p = el / life;
      if (p >= 1) return false;
      var r = 2 + s.radius * 0.6 * (reduced ? 0.6 : EASINGS['ease-out'](p));
      ctx.globalAlpha = Math.pow(1 - p, 2) * 0.7; ctx.strokeStyle = (b.sparks[0] && b.sparks[0].color) || s.colors[0];
      ctx.lineWidth = Math.max(0.5, s.width * (1 - p) * 0.9); ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, Math.PI * 2); ctx.stroke(); return true;
    }
    function remove(b) { b.canvas.remove(); var i = bursts.indexOf(b); if (i >= 0) bursts.splice(i, 1); }
    function frame(now) {
      raf = 0;
      bursts.slice().forEach(function (b) {
        var el = Math.max(0, now - b.start), ctx = b.ctx; // FIX vs original: rAF's frame time can predate a burst spawned mid-frame -> negative elapsed -> negative ring radius -> canvas arc() throws
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, b.canvas.width, b.canvas.height);
        ctx.setTransform(b.ratio, 0, 0, b.ratio, -b.left * b.ratio, -b.top * b.ratio);
        var alive = false;
        if (b.settings.ring && drawRing(ctx, b, el)) alive = true;
        b.sparks.forEach(function (sp) { if (drawSpark(ctx, b, sp, el)) alive = true; });
        ctx.globalAlpha = 1; if (!alive) remove(b);
      });
      if (bursts.length) raf = requestAnimationFrame(frame);
    }
    function spawn(cx, cy) {
      var s = s0; if (s.disabled) return;
      var rect = root.getBoundingClientRect();
      var offset = Math.floor(Math.random() * s.colors.length), full = s.spread >= 359.5;
      var arc = (s.spread * Math.PI) / 180, heading = ((s.direction - 90) * Math.PI) / 180;
      var step = full ? (Math.PI * 2) / s.count : s.count > 1 ? arc / (s.count - 1) : 0;
      var sparks = [];
      for (var i = 0; i < s.count; i++) {
        var base = full ? heading + step * i : s.count > 1 ? heading - arc / 2 + step * i : heading;
        var jit = (Math.random() - 0.5) * s.randomness;
        sparks.push({ angle: base + jit * (step || arc || 1) * 0.9, reach: 1 + (Math.random() - 0.5) * 0.7 * s.randomness,
          scale: 1 + (Math.random() - 0.5) * 0.8 * s.randomness, life: 1 + (Math.random() - 0.5) * 0.5 * s.randomness,
          spin: Math.random() - 0.5, color: s.colors[(i + offset) % s.colors.length], clear: '', glow: 0 });
      }
      var longest = s.duration * (1 + 0.25 * s.randomness), fall = drop(s, longest / 1000);
      var reach = s.radius * (1 + 0.35 * s.randomness) * (s.ease === EASINGS.spring ? 1.15 : 1) + s.size * (1 + 0.4 * s.randomness) + s.width * (s.glow > 0 ? 6 : 2) + 6;
      var box = { left: Math.max(cx - reach, 0), top: Math.max(cy - reach, 0), right: Math.min(cx + reach, window.innerWidth), bottom: Math.min(cy + reach + fall, window.innerHeight) };
      if (box.right - box.left < 1 || box.bottom - box.top < 1) return;
      var ratio = Math.min(window.devicePixelRatio || 1, 2), canvas = document.createElement('canvas');
      canvas.width = Math.ceil((box.right - box.left) * ratio); canvas.height = Math.ceil((box.bottom - box.top) * ratio);
      Object.assign(canvas.style, { position: 'absolute', left: (box.left - rect.left) + 'px', top: (box.top - rect.top) + 'px',
        width: (box.right - box.left) + 'px', height: (box.bottom - box.top) + 'px', display: 'block', pointerEvents: 'none' });
      canvas.setAttribute('aria-hidden', 'true'); layer.appendChild(canvas);
      var ctx = canvas.getContext('2d'); if (!ctx) { canvas.remove(); return; }
      sparks.forEach(function (sp) { var c = channels(ctx, sp.color); sp.clear = 'rgba(' + c[0] + ', ' + c[1] + ', ' + c[2] + ', 0)';
        sp.glow = s.glow * (0.35 + 0.65 * ((0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255)); });
      bursts.push({ x: cx, y: cy, start: performance.now(), sparks: sparks, settings: Object.assign({}, s), canvas: canvas, ctx: ctx, ratio: ratio, left: box.left, top: box.top });
      while (bursts.length > MAX_BURSTS) remove(bursts[0]);
      if (!raf) raf = requestAnimationFrame(frame);
    }
    function onPointerDown(e) { if (e.pointerType !== 'mouse' || e.button !== 0) return; lastPress = { time: performance.now(), x: e.clientX, y: e.clientY }; spawn(e.clientX, e.clientY); }
    function onClick(e) {
      if ('pointerType' in e && e.pointerType === 'mouse') return;
      if (e.detail === 0) { var t = e.target instanceof Element ? e.target : root, r = t.getBoundingClientRect(); spawn(r.left + r.width / 2, r.top + r.height / 2); return; }
      var recent = performance.now() - lastPress.time < 700 && Math.hypot(e.clientX - lastPress.x, e.clientY - lastPress.y) < 12;
      if (!recent) spawn(e.clientX, e.clientY);
    }
    if (opts.auto !== false) { root.addEventListener('pointerdown', onPointerDown); root.addEventListener('click', onClick); }
    return {
      spark: function (x, y) { var r = root.getBoundingClientRect(); spawn(r.left + (x == null ? r.width / 2 : x), r.top + (y == null ? r.height / 2 : y)); },
      destroy: function () { cancelAnimationFrame(raf); root.removeEventListener('pointerdown', onPointerDown); root.removeEventListener('click', onClick); bursts.slice().forEach(remove); layer.remove(); }
    };
  }
  global.ClickSpark = { attach: attach, EASINGS: EASINGS };
})(window);
