// Trust Welding · the opening, three attempts (arc · bead · flash). One engine, three readings of the same brief:
// black, through the helmet; three strikes of 1.5 s with 2 s between; the mark is his chrome emblem lit only by the welding;
// then the helmet lifts and the town is behind it. Every take ends pixel-for-pixel on the approved still (bg + emblem box).
// 2D canvas, wall-clock schedule, pauses when hidden, any scroll/tap/key skips to the end, reduced motion lands on the end.
const T = { lead: 0.5, strike: 1.5, gap: 2.0, lift: 0.9 };                      // Hayden's numbers
const PLACE = { desk: { cy: 0.53, h: 0.62 }, phone: { cy: 0.50, h: 0.34 } };   // the approved geometry (HERO-END-FRAME.md)
const PTS = { torch: [0.41, 0.46], left: [0.06, 0.50], right: [0.95, 0.50], crown: [0.50, 0.01] }; // inside the emblem box
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

function load(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }

export async function mount(host, take, opts = {}) {
  const phone = innerWidth / innerHeight < 0.75;
  const A = opts.assets || ''; const [bg, em] = await Promise.all([load(A + (phone ? 'bg-phone.jpg' : 'bg-desk.jpg')), load(A + (phone ? 'emblem-box-1200.png' : 'emblem-box.png'))]);
  const place = phone ? PLACE.phone : PLACE.desk;
  const cv = host.querySelector('canvas'), ctx = cv.getContext('2d', { alpha: false });
  const visor = host.querySelector('.visor');
  const dpr = Math.min(devicePixelRatio || 1, phone ? 1.25 : 1.5);
  let W = 0, H = 0, box = null, cover = null, k = 1;
  const maskC = document.createElement('canvas'), mctx = maskC.getContext('2d');     // where the light has reached (box space)
  const emC = document.createElement('canvas'), ectx = emC.getContext('2d');         // emblem ∩ mask
  const EMW = em.width, EMH = em.height;
  function size() {
    W = host.clientWidth; H = host.clientHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const s = Math.max(W / bg.width, H / bg.height), w = bg.width * s, h = bg.height * s; cover = { x: (W - w) / 2, y: (H - h) / 2, w, h };
    const bh = h * place.h, bw = bh * EMW / EMH; box = { x: cover.x + w / 2 - bw / 2, y: cover.y + h * place.cy - bh / 2, w: bw, h: bh };
    k = bw / 1095;                                                                   // px scale vs the 2560-wide reference
    maskC.width = emC.width = Math.round(bw * dpr); maskC.height = emC.height = Math.round(bh * dpr);
    mctx.setTransform(dpr, 0, 0, dpr, 0, 0); ectx.setTransform(dpr, 0, 0, dpr, 0, 0); mctx.clearRect(0, 0, bw, bh);
  }
  addEventListener('resize', size); size();
  const P = name => [box.x + PTS[name][0] * box.w, box.y + PTS[name][1] * box.h];  // a point of the emblem, in screen px

  // the schedule
  const order = take === 'bead' ? ['ringL', 'ringR', 'name'] : ['left', 'torch', 'right'];
  const strikes = order.map((p, i) => { const at = T.lead + i * (T.strike + T.gap); return { at, end: at + T.strike, p }; });
  const liftAt = strikes[2].end + 0.45, total = liftAt + T.lift;
  let t = 0, t0 = null, hiddenAt = null, done = false, lit = 0, raf = 0, last = 0, alive = true;
  document.addEventListener('visibilitychange', () => { if (document.hidden) hiddenAt = performance.now(); else if (hiddenAt !== null && t0 !== null) { t0 += performance.now() - hiddenAt; hiddenAt = null; wake(); } });

  // sparks
  const sparks = []; const MAXS = phone ? 260 : 420;
  function spawn(x, y, n, spread = 1, up = 1) {
    for (let i = 0; i < n && sparks.length < MAXS; i++) {
      const a = (Math.random() - 0.5) * Math.PI * 1.1 * spread, sp = (160 + Math.random() * 520) * k;
      sparks.push({ x, y, vx: Math.sin(a) * sp * 1.1, vy: -Math.abs(Math.cos(a)) * sp * up - 40 * k, age: 0, life: 0.35 + Math.random() * 0.8, w: 0.8 + Math.random() * 1.4 });
    }
  }
  function stepSparks(dt) {
    for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.age += dt; if (s.age > s.life) { sparks.splice(i, 1); continue; } s.vy += 1500 * k * dt; s.vx *= (1 - 1.4 * dt); s.x += s.vx * dt; s.y += s.vy * dt; }
  }
  function drawSparks(alpha) {
    if (!sparks.length) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (const s of sparks) { const u = s.age / s.life; const c = u < 0.35 ? `rgba(255,250,235,${(1 - u) * alpha})` : u < 0.7 ? `rgba(255,170,70,${(1 - u) * alpha})` : `rgba(255,70,20,${(1 - u) * 0.8 * alpha})`;
      ctx.strokeStyle = c; ctx.lineWidth = s.w * k; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 0.028, s.y - s.vy * 0.028); ctx.stroke(); }
    ctx.restore();
  }
  // the arc: a white core and a flickering blue-white glow; the only light in the room
  function drawArc(x, y, strength, alpha) {
    const f = 0.7 + 0.3 * hash(Math.floor(t * 90)); const r = (90 + 70 * f) * k * strength;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    let g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(210,240,255,${0.95 * alpha})`); g.addColorStop(0.18, `rgba(120,200,255,${0.55 * alpha})`); g.addColorStop(0.5, `rgba(40,120,220,${0.16 * alpha})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    const cr = (5 + 4 * f) * k; g = ctx.createRadialGradient(x, y, 0, x, y, cr * 2.2); g.addColorStop(0, `rgba(255,255,255,${alpha})`); g.addColorStop(0.5, `rgba(235,250,255,${0.9 * alpha})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(x - cr * 2.2, y - cr * 2.2, cr * 4.4, cr * 4.4);
    // a horizontal lens streak through the visor
    ctx.globalAlpha = 0.22 * alpha * f; const sw = 380 * k * strength; const sg = ctx.createLinearGradient(x - sw, y, x + sw, y); sg.addColorStop(0, 'rgba(120,200,255,0)'); sg.addColorStop(0.5, 'rgba(200,235,255,1)'); sg.addColorStop(1, 'rgba(120,200,255,0)');
    ctx.fillStyle = sg; ctx.fillRect(x - sw, y - 1.2 * k, 2 * sw, 2.4 * k); ctx.restore();
  }
  function drawEmber(x, y, since, alpha) {  // the cooling weld after an arc stops
    const u = Math.min(1, since / 1.7); if (u >= 1) return; const a = (1 - u) * alpha; const r = (26 - 10 * u) * k;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
    g.addColorStop(0, `rgba(255,${Math.round(200 - 150 * u)},${Math.round(120 - 110 * u)},${0.9 * a})`); g.addColorStop(0.35, `rgba(255,${Math.round(120 - 80 * u)},20,${0.35 * a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6); ctx.restore();
  }
  function smoke(x, y, since, alpha) {  // a thin grey wisp climbing from the spot after a strike
    const u = since / 2.4; if (u <= 0 || u >= 1) return; ctx.save(); ctx.globalAlpha = 0.16 * (1 - u) * alpha;
    for (let i = 0; i < 3; i++) { const r = (30 + 70 * u + i * 18) * k, dy = -(60 + 120 * u + i * 20) * k, dx = Math.sin(u * 4 + i) * 30 * k;
      const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r); g.addColorStop(0, 'rgba(170,180,190,1)'); g.addColorStop(1, 'rgba(170,180,190,0)'); ctx.fillStyle = g; ctx.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r); }
    ctx.restore();
  }
  // emblem through the mask (box space) → screen
  function emblemThrough(alpha, tint) {
    ectx.clearRect(0, 0, box.w, box.h); ectx.drawImage(em, 0, 0, box.w, box.h);
    ectx.save(); ectx.globalCompositeOperation = 'destination-in'; ectx.drawImage(maskC, 0, 0, box.w, box.h); ectx.restore();
    if (tint) { ectx.save(); ectx.globalCompositeOperation = 'source-atop'; ectx.fillStyle = tint; ectx.fillRect(0, 0, box.w, box.h); ectx.restore(); }
    ctx.save(); ctx.globalAlpha = alpha; ctx.drawImage(emC, box.x, box.y, box.w, box.h); ctx.restore();
  }
  function pool(name, a, R) {   // a radial pool of light on the mask
    const [px, py] = PTS[name]; const x = px * box.w, y = py * box.h; const g = mctx.createRadialGradient(x, y, 0, x, y, R);
    g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.45, `rgba(255,255,255,${a * 0.55})`); g.addColorStop(1, 'rgba(255,255,255,0)'); mctx.fillStyle = g; mctx.fillRect(x - R, y - R, 2 * R, 2 * R);
  }
  // bead paths (box space): the ring in two halves, then the name's baseline
  const ring = (u, half) => { const th = half === 'L' ? Math.PI - u * Math.PI / 2 : Math.PI / 2 - u * Math.PI / 2; return [0.50 * box.w + 0.415 * box.w * Math.cos(th), 0.50 * box.h - 0.455 * box.h * Math.sin(th)]; };
  const PATH = { ringL: u => ring(u, 'L'), ringR: u => ring(u, 'R'), name: u => [(0.04 + 0.92 * u) * box.w, 0.655 * box.h] };
  let beadTrail = [];  // [{x,y,at}] in box space, for the glow behind the head
  function beadStep(s, u0, u1) {  // lay the mask down along the path between u0 and u1
    const fn = PATH[s.p]; mctx.save(); mctx.strokeStyle = 'rgba(255,255,255,1)'; mctx.lineCap = 'round'; mctx.lineJoin = 'round';
    for (const [w, a] of [[0.17 * box.w, 0.35], [0.09 * box.w, 0.6], [0.035 * box.w, 1]]) { mctx.globalAlpha = a; mctx.lineWidth = w; mctx.beginPath(); let p = fn(Math.max(0, u0 - 0.002)); mctx.moveTo(p[0], p[1]); for (let i = 1; i <= 6; i++) { p = fn(u0 + (u1 - u0) * i / 6); mctx.lineTo(p[0], p[1]); } mctx.stroke(); }
    mctx.restore();
  }
  function drawBead() {  // the hot bead behind the head: white → orange → steel, by age
    if (!beadTrail.length) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (let i = 1; i < beadTrail.length; i++) { const a = beadTrail[i - 1], b = beadTrail[i]; const age = t - b.at; if (age > 2.2) continue; const u = age / 2.2;
      const col = u < 0.12 ? `rgba(255,245,225,${1 - u})` : u < 0.5 ? `rgba(255,${Math.round(190 - 150 * u)},${Math.round(90 - 80 * u)},${0.9 - 0.8 * u})` : `rgba(255,60,10,${0.35 * (1 - u)})`;
      ctx.strokeStyle = col; ctx.lineWidth = (7 - 4 * u) * k; ctx.beginPath(); ctx.moveTo(box.x + a.x, box.y + a.y); ctx.lineTo(box.x + b.x, box.y + b.y); ctx.stroke();
      if (u < 0.5) { ctx.lineWidth = (26 - 20 * u) * k; ctx.strokeStyle = `rgba(255,120,30,${0.18 * (1 - 2 * u)})`; ctx.beginPath(); ctx.moveTo(box.x + a.x, box.y + a.y); ctx.lineTo(box.x + b.x, box.y + b.y); ctx.stroke(); } }
    ctx.restore();
  }

  function render(now) {
    if (!alive) return; raf = 0;
    if (t0 === null) t0 = now; if (!done && !document.hidden) t = (now - t0) / 1000;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
    if (reduce) t = total;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    // the lift
    if (t >= liftAt) { lit = Math.min(1, (t - liftAt) / T.lift); } else lit = 0;
    const e = 1 - Math.pow(1 - lit, 3);
    if (visor) visor.style.transform = `translate3d(0, ${(-118 * e).toFixed(2)}%, 0)`;
    if (lit > 0) {
      const sc = 1 + 0.02 * (1 - e); ctx.save(); ctx.globalAlpha = e; ctx.drawImage(bg, cover.x + cover.w / 2 - cover.w * sc / 2, cover.y + cover.h / 2 - cover.h * sc / 2, cover.w * sc, cover.h * sc); ctx.restore();
      if (take === 'flash') { ctx.save(); ctx.globalAlpha = 0.55 * (1 - e); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore(); }   // the eye adjusting from the arc
      ctx.save(); ctx.globalAlpha = e; ctx.drawImage(em, box.x, box.y, box.w, box.h); ctx.restore();
    }
    let burning = false;
    if (lit < 1) {
      const pre = 1 - e;
      // mask
      if (take !== 'bead') mctx.clearRect(0, 0, box.w, box.h);
      for (const s of strikes) {
        const on = t >= s.at && t < s.end, since = t - s.end;
        if (on) burning = true;
        if (take === 'arc') {
          if (on) pool(s.p, 0.75 + 0.25 * hash(Math.floor(t * 60)), 0.5 * box.w);
          else if (since >= 0) pool(s.p, Math.max(0.1, 0.8 - since * 0.5), 0.5 * box.w);
        } else if (take === 'flash') {
          if (on) { mctx.fillStyle = `rgba(255,255,255,${0.85 + 0.15 * hash(Math.floor(t * 70))})`; mctx.fillRect(0, 0, box.w, box.h); }
          else if (since >= 0 && since < 2.0) { mctx.fillStyle = `rgba(255,255,255,${0.14 * (1 - since / 2.0)})`; mctx.fillRect(0, 0, box.w, box.h); }
        } else if (take === 'bead') {
          if (on) { const u1 = (t - s.at) / T.strike, u0 = Math.max(0, u1 - dt / T.strike); beadStep(s, u0, u1); const p = PATH[s.p](u1); beadTrail.push({ x: p[0], y: p[1], at: t }); if (beadTrail.length > 400) beadTrail.shift(); }
        }
      }
      // the emblem as the light shows it
      if (take === 'flash') { const anyOn = strikes.some(s => t >= s.at && t < s.end); emblemThrough(pre, anyOn ? 'rgba(170,215,255,0.28)' : 'rgba(110,70,190,0.55)'); }
      else emblemThrough(pre, null);
      if (take === 'bead') drawBead();
      // light, sparks, embers
      for (const s of strikes) {
        const on = t >= s.at && t < s.end, since = t - s.end;
        let x, y; if (take === 'bead') { const p = PATH[s.p](Math.min(1, Math.max(0, (t - s.at) / T.strike))); x = box.x + p[0]; y = box.y + p[1]; } else [x, y] = P(s.p);
        if (on) { drawArc(x, y, take === 'flash' ? 1.35 : 1, pre); spawn(x, y, take === 'flash' ? 14 : take === 'bead' ? 7 : 10, take === 'bead' ? 0.8 : 1); }
        else if (since >= 0) { drawEmber(x, y, since, pre); smoke(x, y, since, pre); }
      }
      stepSparks(dt); drawSparks(pre);
      if (take === 'flash' && burning) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.06 * pre; ctx.fillStyle = '#9fd6ff'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    }
    host.dataset.arc = burning ? '1' : '0';
    if (lit >= 1 && !done) { done = true; host.classList.add('is-lit'); opts.onDone && opts.onDone(); }
    if (!done || sparks.length) raf = requestAnimationFrame(render);
  }
  function wake() { if (!raf && alive) raf = requestAnimationFrame(render); }
  function skip() { if (done) return; if (t0 === null) t0 = performance.now(); t0 = Math.min(t0, performance.now() - liftAt * 1000); wake(); }
  function replay() { done = false; lit = 0; t = 0; t0 = null; last = 0; sparks.length = 0; beadTrail = []; mctx.clearRect(0, 0, box.w, box.h); host.classList.remove('is-lit'); if (visor) visor.style.transform = ''; wake(); }
  const keys = ev => { if (ev.key === ' ' || ev.key === 'Enter' || ev.key === 'Escape') skip(); };
  addEventListener('wheel', skip, { passive: true }); addEventListener('touchmove', skip, { passive: true }); cv.addEventListener('pointerdown', skip); addEventListener('keydown', keys);
  wake();
  return { skip, replay, destroy() { alive = false; cancelAnimationFrame(raf); } };
}
