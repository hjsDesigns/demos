/* Gage Rogel Fitness — the hero's life, ported from Gage's own demo (10/26) and spread across the whole opener:
   (1) a honeycomb that lights up under the pointer; (2) a particle field that winds into a DNA helix and
   decodes into his real GF mark, reacting to the pointer. Both pause out of view and under reduced motion. */
(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hero = document.getElementById('hero');
  if (!hero) return;

  /* ---------- honeycomb field ---------- */
  (function(){
    var cv = document.getElementById('hexfield');
    if (!cv || !cv.getContext || reduce) return;
    var ctx = cv.getContext('2d'), W = 0, H = 0, cells = {}, raf = null;
    function size(){ W = hero.clientWidth; H = hero.clientHeight; var dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function hexPath(cx, cy){ ctx.moveTo(cx, cy - 33); ctx.lineTo(cx + 28, cy - 17); ctx.lineTo(cx + 28, cy + 17); ctx.lineTo(cx, cy + 33); ctx.lineTo(cx - 28, cy + 17); ctx.lineTo(cx - 28, cy - 17); ctx.closePath(); }
    function frame(){
      raf = null; ctx.clearRect(0, 0, W, H); var any = false;
      for (var key in cells) {
        var v = cells[key] *= 0.93; if (v < 0.02) { delete cells[key]; continue; } any = true;
        var rc = key.split(','), r = +rc[0], c = +rc[1], cx = 28 + 56 * c - (r & 1 ? 28 : 0), cy = 33 + 50 * r;
        ctx.beginPath(); hexPath(cx, cy);
        ctx.fillStyle = 'rgba(6,135,255,' + (v * 0.16).toFixed(3) + ')'; ctx.fill();
        ctx.strokeStyle = 'rgba(92,178,255,' + (v * 0.6).toFixed(3) + ')'; ctx.lineWidth = 1; ctx.stroke();
      }
      if (any) raf = requestAnimationFrame(frame);
    }
    hero.addEventListener('pointermove', function(e){
      var rect = hero.getBoundingClientRect(), x = e.clientX - rect.left, y = e.clientY - rect.top, r0 = Math.round((y - 33) / 50);
      for (var r = r0 - 2; r <= r0 + 2; r++) { if (r < 0) continue; var off = (r & 1) ? 28 : 0, c0 = Math.round((x - 28 + off) / 56);
        for (var c = c0 - 2; c <= c0 + 2; c++) { var cx = 28 + 56 * c - off, cy = 33 + 50 * r, d = Math.sqrt((cx - x) * (cx - x) + (cy - y) * (cy - y));
          if (d < 120) { var key = r + ',' + c, val = 1 - d / 120; cells[key] = Math.max(cells[key] || 0, val); } } }
      if (!raf) raf = requestAnimationFrame(frame);
    }, { passive: true });
    size(); if ('ResizeObserver' in window) new ResizeObserver(size).observe(hero); else window.addEventListener('resize', size);
  })();

  /* ---------- the specimen: helix → his mark → helix, across the opener ---------- */
  (function(){
    var canvas = document.getElementById('specimen');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var HELIX_DUR = 6, LOGO_DUR = 5, TURNS = 2.4, TILT = -0.32, RUNGS = 26, CX = 0.46;
    var PAIRS = [['#5CB2FF', '#0687FF'], ['#BFE3FF', '#2A7BD6']];
    var W = 0, H = 0, parts = [], raf = null, inView = true, ready = false, phase = 'helix', phaseT = 0, d0 = 1, locked = false;
    var mouse = { x: 0, y: 0, on: false }, img = new Image();
    function logoTargets(){
      var tw = Math.round(Math.min(W * 0.26, 360)), th = Math.round(img.naturalHeight * (tw / img.naturalWidth));
      var off = document.createElement('canvas'); off.width = tw; off.height = th; var o = off.getContext('2d'); o.drawImage(img, 0, 0, tw, th);
      var d; try { d = o.getImageData(0, 0, tw, th).data; } catch (err) { return []; }
      var gap = tw < 320 ? 3 : 4, ox = W * CX - tw / 2, oy = (H - th) / 2, pts = [];
      for (var y = 0; y < th; y += gap) for (var x = 0; x < tw; x += gap) { var i = (y * tw + x) * 4; if (d[i + 3] > 120 && d[i + 2] > 140 && d[i] < 120) pts.push([ox + x + (Math.random() - 0.5), oy + y + (Math.random() - 0.5)]); }
      return pts;
    }
    function build(scatter){
      var pts = logoTargets(), old = parts; parts = new Array(pts.length);
      for (var i = 0; i < pts.length; i++) {
        var r = Math.random(), o = old[i], kind = i % 10;
        var p = { lx: pts[i][0], ly: pts[i][1], vx: 0, vy: 0, s: r < 0.1 ? 2.2 : 1.6, c: r < 0.07 ? '#EAF5FF' : (r < 0.32 ? '#5CB2FF' : '#0687FF'), dl: Math.random() * 0.7 };
        if (kind < 4) { p.k = 0; p.u = Math.random(); p.hc = '#5CB2FF'; } else if (kind < 8) { p.k = 1; p.u = Math.random(); p.hc = '#0687FF'; }
        else { var rung = (Math.random() * RUNGS) | 0, pair = PAIRS[rung % 2]; p.k = 2; p.u = (rung + 0.5) / RUNGS; p.t = Math.random(); p.hc = p.t < 0.5 ? pair[0] : pair[1]; }
        if (o) { p.x = o.x; p.y = o.y; } else { p.x = Math.random() * W; p.y = Math.random() * H; p.vx = (Math.random() - 0.5) * 4; p.vy = (Math.random() - 0.5) * 4; }
        parts[i] = p;
      }
      if (scatter) setPhase('helix');
    }
    var hx = [0, 0, 0];
    function helixPos(p, rot){
      var span = Math.min(W * 0.55, H) * 0.78, R = Math.min(W * 0.55, H) * 0.15, ly = (p.u - 0.5) * span, th = p.u * TURNS * Math.PI * 2 + rot, sx = Math.sin(th), cz = Math.cos(th), lx, z;
      if (p.k === 0) { lx = R * sx; z = cz; } else if (p.k === 1) { lx = -R * sx; z = -cz; } else { lx = R * sx * (1 - 2 * p.t); z = cz * (1 - 2 * p.t); }
      var ct = Math.cos(TILT), st = Math.sin(TILT); hx[0] = W * CX + lx * ct - ly * st; hx[1] = H / 2 + lx * st + ly * ct; hx[2] = z; return hx;
    }
    function setPhase(ph){ phase = ph; phaseT = 0; locked = false; d0 = 1; for (var i = 0; i < parts.length; i++) parts[i].dl = Math.random() * (ph === 'logo' ? 0.5 : 0.7); }
    function draw(){
      ctx.clearRect(0, 0, W, H); ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < parts.length; i++) { var p = parts[i];
        if (phase === 'helix') { var z = p.z === undefined ? 1 : p.z, f = (z + 1) / 2; ctx.globalAlpha = 0.22 + 0.78 * f; ctx.fillStyle = p.hc; var sz = p.s * (0.75 + 0.6 * f); ctx.fillRect(p.x, p.y, sz, sz); }
        else { ctx.globalAlpha = 1; ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.s, p.s); } }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    var lastNow = 0;
    function frame(now){
      raf = null; var dt = lastNow ? Math.min(0.05, (now - lastNow) / 1000) : 0.016; lastNow = now; phaseT += dt; var rot = now / 1000 * 0.9;
      var sum = 0, kS = phase === 'helix' ? 0.045 : 0.02, damp = phase === 'helix' ? 0.8 : 0.85;
      for (var i = 0; i < parts.length; i++) { var p = parts[i], tx, ty;
        if (phase === 'helix') { var h = helixPos(p, rot); tx = h[0]; ty = h[1]; p.z = h[2]; } else { tx = p.lx; ty = p.ly; }
        var dx = tx - p.x, dy = ty - p.y; if (phaseT > p.dl) { p.vx += dx * kS; p.vy += dy * kS; }
        if (mouse.on) { var mx = p.x - mouse.x, my = p.y - mouse.y, d2 = mx * mx + my * my; if (d2 < 6400) { var dd = Math.sqrt(d2) || 1, f = (80 - dd) / 80 * 2.4; p.vx += mx / dd * f; p.vy += my / dd * f; } }
        p.vx *= damp; p.vy *= damp; p.x += p.vx; p.y += p.vy; if (locked) { p.x += (Math.random() - 0.5) * 0.25; p.y += (Math.random() - 0.5) * 0.25; }
        sum += Math.abs(dx) + Math.abs(dy); }
      draw();
      var avg = parts.length ? sum / parts.length : 0;
      if (phase === 'helix') { if (phaseT >= HELIX_DUR) setPhase('logo'); }
      else { if (!locked) { d0 = Math.max(d0, avg); if ((avg < 1.2 && phaseT > 1) || (phaseT > 3.5 && avg < d0 * 0.04)) locked = true; } if (phaseT >= LOGO_DUR) toHelix(); }
      start();
    }
    function start(){ if (reduce || raf || !inView || document.hidden || !parts.length) return; raf = requestAnimationFrame(frame); }
    function renderStatic(){ for (var i = 0; i < parts.length; i++) { var p = parts[i]; p.x = p.lx; p.y = p.ly; } phase = 'logo'; draw(); }
    function resize(first){
      var nw = Math.round(hero.clientWidth), nh = Math.round(hero.clientHeight); if (!nw || !nh) return; if (!first && nw === W && nh === H) return;
      W = nw; H = nh; var dpr = Math.min(window.devicePixelRatio || 1, 2); canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!ready) return; if (reduce) { build(false); renderStatic(); return; } build(first); start();
    }
    function toHelix(){ var cx = W * CX, cy = H / 2; for (var i = 0; i < parts.length; i++) { var p = parts[i], dx = p.x - cx, dy = p.y - cy, d = Math.sqrt(dx * dx + dy * dy) || 1, f = 3 + Math.random() * 6; p.vx += dx / d * f; p.vy += dy / d * f; } setPhase('helix'); }
    hero.addEventListener('pointermove', function(e){ var r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = !reduce; }, { passive: true });
    function leave(){ mouse.on = false; }
    hero.addEventListener('pointerleave', leave); hero.addEventListener('pointerup', function(e){ if (e.pointerType === 'touch') leave(); }); hero.addEventListener('pointercancel', leave);
    if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ inView = es[0].isIntersecting; if (inView) lastNow = 0; start(); }).observe(hero);
    document.addEventListener('visibilitychange', function(){ lastNow = 0; start(); });
    if ('ResizeObserver' in window) new ResizeObserver(function(){ resize(false); }).observe(hero); else window.addEventListener('resize', function(){ resize(false); });
    img.onload = function(){ ready = true; resize(true); };
    img.src = canvas.getAttribute('data-logo') || 'images/logo.png';
  })();
})();
