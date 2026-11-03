// Trust Welding · the opening (Hayden 11/2): first person through the helmet. Black, no light at all. His mark in steel on the
// bench. Three strikes, 1.5 s each with 2 s between, and the arc is the only light — the plate, the bench and the sparks show only
// while the arc burns. Then the helmet lifts and the mark stands lit. Built in Three.js (deterministic; the timing is exact).
// mountHero(host, { variant: 'visor' | 'plate', mark: { top, sub }, onDone }) → { skip(), destroy() }
import * as THREE from './vendor/three.module.min.js';

const T = { lead: 0.5, strike: 1.5, gap: 2.0, lift: 0.9 };   // Hayden's numbers
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const PHONE = matchMedia('(max-aspect-ratio: 19/20)').matches;

// the mark, drawn once as a texture: embossed letters in the plate (bump + roughness), so the arc light reads them as steel
function markTextures(mark, display) {
  const W = 2048, H = 768, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.font = `700 300px ${display}`; const measured = g.measureText(mark.top).width || 2000;
  const PX = Math.min(300, Math.floor(300 * (W * 0.86) / measured)), SUB = Math.round(PX * 0.28);   // the name fits the plate with a margin
  g.fillStyle = '#808080'; g.fillRect(0, 0, W, H);            // bump: mid grey = flat
  const draw = (fill) => {
    g.fillStyle = fill; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `700 ${PX}px ${display}`; g.fillText(mark.top, W / 2, H * 0.42);
    g.font = `700 ${SUB}px ${display}`; g.letterSpacing = '22px'; g.fillText(mark.sub, W / 2, H * 0.78); g.letterSpacing = '0px';
    g.fillRect(W * 0.18, H * 0.615, W * 0.64, 10);           // the rule under the name, like the badge
  };
  draw('#f2f2f2');                                            // raised
  const bump = new THREE.CanvasTexture(c); bump.anisotropy = 8;
  const r = document.createElement('canvas'); r.width = W; r.height = H; const rg = r.getContext('2d');
  rg.fillStyle = '#b0b0b0'; rg.fillRect(0, 0, W, H);          // roughness: plate ~.69 (dull)
  rg.fillStyle = '#2a2a2a'; rg.textAlign = 'center'; rg.textBaseline = 'middle';   // letters polished ~.16
  rg.font = `700 ${PX}px ${display}`; rg.fillText(mark.top, W / 2, H * 0.42);
  rg.font = `700 ${SUB}px ${display}`; rg.letterSpacing = '22px'; rg.fillText(mark.sub, W / 2, H * 0.78); rg.letterSpacing = '0px';
  rg.fillRect(W * 0.18, H * 0.615, W * 0.64, 10);
  const rough = new THREE.CanvasTexture(r);
  const m = document.createElement('canvas'); m.width = W; m.height = H; const mg = m.getContext('2d');
  mg.fillStyle = '#6a6a6a'; mg.fillRect(0, 0, W, H);          // plate metalness ~.42
  mg.fillStyle = '#ffffff'; mg.textAlign = 'center'; mg.textBaseline = 'middle';   // letters: full chrome
  mg.font = `700 ${PX}px ${display}`; mg.fillText(mark.top, W / 2, H * 0.42);
  mg.font = `700 ${SUB}px ${display}`; mg.letterSpacing = '22px'; mg.fillText(mark.sub, W / 2, H * 0.78); mg.letterSpacing = '0px';
  mg.fillRect(W * 0.18, H * 0.615, W * 0.64, 10);
  const metal = new THREE.CanvasTexture(m);
  return { bump, rough, metal };
}

// a soft round glow for the arc and the embers
function glowSprite(color) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.25, color); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const m = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  return new THREE.Sprite(m);
}

// brushed steel for the plate version's wall (a canvas of streaked noise)
function brushedTexture() {
  const W = 1024, H = 1024, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  g.fillStyle = '#6b7178'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 9000; i++) { const y = Math.random() * H, l = 40 + Math.random() * 300, a = 0.03 + Math.random() * 0.08, v = Math.random() > 0.5 ? 255 : 0; g.strokeStyle = `rgba(${v},${v},${v},${a})`; g.lineWidth = 1 + Math.random(); g.beginPath(); g.moveTo(Math.random() * W, y); g.lineTo(Math.random() * W + l, y); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); return t;
}

export function mountHero(host, opts = {}) {
  const o = { variant: 'visor', mark: { top: 'TRUST WELDING', sub: 'EST 2025' }, display: '"Russo One", "Arial Black", sans-serif', onDone: null, onStrike: null, ...opts };
  const plateV = o.variant === 'plate';
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, PHONE ? 1.25 : 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, 1);
  renderer.domElement.className = 'hero-gl';
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const cam = new THREE.PerspectiveCamera(PHONE ? 46 : 36, 1, 0.1, 40);
  // first person at the bench: eye above and in front, looking down at the plate
  const eye = plateV ? new THREE.Vector3(0, 0.78, 2.4) : new THREE.Vector3(0.0, 0.92, 3.0);
  cam.position.copy(eye); cam.lookAt(0, 0.42, 0);

  // the environment the lit steel reflects: three soft panels (a room), baked once
  const pm = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const panel = (w, h, x, y, z, ry, c) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); m.position.set(x, y, z); m.rotation.y = ry; envScene.add(m); };
  panel(8, 4, 0, 3.4, 0.5, 0, 0xcfd8e2); panel(4, 6, -5, 1, 0, Math.PI / 2, 0x2b3139); panel(4, 6, 5, 1, 0, -Math.PI / 2, 0x3a424c); panel(10, 10, 0, -2, 0, 0, 0x0b0d10);
  const env = pm.fromScene(envScene, 0.04).texture; scene.environment = env; pm.dispose();

  // the bench: a dark steel table top
  const benchMat = new THREE.MeshStandardMaterial({ color: 0x2a2e33, metalness: 0.6, roughness: 0.55, envMapIntensity: 0.35 });
  const bench = new THREE.Mesh(new THREE.BoxGeometry(6, 0.08, 2.4), benchMat); bench.position.set(0, -0.04, 0.2); scene.add(bench);

  // the mark in steel: a thick plate leaning back a little, letters embossed
  const tex = markTextures(o.mark, o.display);
  const plateMat = new THREE.MeshStandardMaterial({ color: 0x5a6169, metalness: 1.0, metalnessMap: tex.metal, roughness: 1.0, roughnessMap: tex.rough, bumpMap: tex.bump, bumpScale: 0.03, envMapIntensity: 0.0 });
  const plate = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.975, 0.06), plateMat);
  plate.position.set(0, 0.5, 0); plate.rotation.x = -0.07; scene.add(plate);
  // a cleaner steel for the edges
  plate.material = [benchMat, benchMat, benchMat, benchMat, plateMat, benchMat];

  if (plateV) {   // the brushed wall behind the plate (shown once the helmet lifts)
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(12, 7), new THREE.MeshStandardMaterial({ map: brushedTexture(), color: 0x7d858e, metalness: 0.75, roughness: 0.45, envMapIntensity: 0.0 }));
    wall.position.set(0, 2.2, -1.3); scene.add(wall); scene.userData.wall = wall;
  }

  // the three weld points, left to right along the name
  const pts = [new THREE.Vector3(-0.95, 0.56, 0.05), new THREE.Vector3(0.05, 0.58, 0.05), new THREE.Vector3(0.98, 0.56, 0.05)];
  const arc = new THREE.PointLight(0xdcf4ff, 0, 7, 2); scene.add(arc);
  const arcGlow = glowSprite('rgba(140,225,255,0.95)'); arcGlow.scale.set(0.001, 0.001, 1); scene.add(arcGlow);
  const embers = pts.map(p => { const l = new THREE.PointLight(0xff7a1a, 0, 2.5, 2); l.position.copy(p).add(new THREE.Vector3(0, 0, 0.12)); scene.add(l); const s = glowSprite('rgba(255,120,30,0.9)'); s.position.copy(p).add(new THREE.Vector3(0, 0, 0.08)); s.scale.set(0.001, 0.001, 1); scene.add(s); return { l, s, heat: 0 }; });

  // sparks: one pool, spawned from the live point while the arc burns, falling and dying
  const N = 420, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), vel = new Float32Array(N * 3), life = new Float32Array(N), age = new Float32Array(N);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const sparkMat = new THREE.PointsMaterial({ size: PHONE ? 0.05 : 0.04, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, sizeAttenuation: true });
  const sparks = new THREE.Points(geo, sparkMat); sparks.frustumCulled = false; scene.add(sparks);
  let cursor = 0;
  const spawn = (p, n) => {
    for (let k = 0; k < n; k++) {
      const i = cursor = (cursor + 1) % N, a = Math.random() * Math.PI * 2, up = 1.2 + Math.random() * 2.6, out = 0.4 + Math.random() * 1.9;
      pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z + 0.1;
      vel[i * 3] = Math.cos(a) * out; vel[i * 3 + 1] = up; vel[i * 3 + 2] = Math.sin(a) * out * 0.6 + 0.8;
      life[i] = 0.35 + Math.random() * 0.75; age[i] = 0;
      col[i * 3] = 1; col[i * 3 + 1] = 0.92; col[i * 3 + 2] = 0.75;
    }
  };
  for (let i = 0; i < N; i++) { age[i] = 9; life[i] = 1; pos[i * 3 + 1] = -5; }

  // the lit state: a cool key from above-left and a warm fill, both off until the helmet lifts
  const key = new THREE.DirectionalLight(0xe8f1ff, 0); key.position.set(-3.2, 2.6, 2.2); scene.add(key);
  const rim = new THREE.DirectionalLight(0xbfe4ee, 0); rim.position.set(1.5, 3.0, -2.5); scene.add(rim);
  const fill = new THREE.PointLight(0xffd6b0, 0, 9, 2); fill.position.set(2.5, 1.2, 2.2); scene.add(fill);
  const amb = new THREE.AmbientLight(0x9fb3c8, 0); scene.add(amb);

  // the schedule
  const strikes = [0, 1, 2].map(i => { const s = T.lead + i * (T.strike + T.gap); return { at: s, end: s + T.strike, p: pts[i] }; });
  const liftAt = strikes[2].end + 0.45;
  const total = liftAt + T.lift;
  let t = reduce ? total : 0, done = false, lit = 0, raf = 0, last = 0, alive = true, t0 = null, hiddenAt = null;
  document.addEventListener('visibilitychange', () => { if (document.hidden) hiddenAt = performance.now(); else if (hiddenAt !== null && t0 !== null) { t0 += performance.now() - hiddenAt; hiddenAt = null; wake(); } });
  const visor = host.querySelector('.visor');
  const noise = () => 0.55 + Math.random() * 0.45;

  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
    if (t0 === null) t0 = now - (reduce ? total * 1000 : 0);
    if (!done && !document.hidden) t = (now - t0) / 1000;
    // which strike burns now
    let burning = null;
    for (const s of strikes) if (t >= s.at && t < s.end) burning = s;
    if (burning) {
      const k = noise(), p = burning.p;
      arc.position.set(p.x + (Math.random() - 0.5) * 0.04, p.y + (Math.random() - 0.5) * 0.03, p.z + 0.16);
      arc.intensity = 5.5 * k; arcGlow.position.copy(arc.position); arcGlow.scale.setScalar(0.11 + 0.12 * k);
      spawn(p, 9 + Math.floor(Math.random() * 7));
      const e = embers[strikes.indexOf(burning)]; e.heat = 1;
      host.dataset.arc = '1';
    } else { arc.intensity = 0; arcGlow.scale.setScalar(0.001); host.dataset.arc = '0'; }
    // embers cool
    for (const e of embers) { e.heat = Math.max(0, e.heat - dt / 1.6); e.l.intensity = 1.6 * e.heat * e.heat; e.s.scale.setScalar(0.001 + 0.16 * e.heat); }
    // sparks fly
    for (let i = 0; i < N; i++) {
      if (age[i] >= life[i]) continue;
      age[i] += dt; vel[i * 3 + 1] -= 4.2 * dt;
      pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      if (pos[i * 3 + 1] < 0.005) { pos[i * 3 + 1] = 0.005; vel[i * 3 + 1] *= -0.35; vel[i * 3] *= 0.7; vel[i * 3 + 2] *= 0.7; }
      const f = 1 - age[i] / life[i]; col[i * 3] = f; col[i * 3 + 1] = 0.62 * f * f; col[i * 3 + 2] = 0.25 * f * f * f;
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    // the lift: the helmet goes up, the room comes on
    if (t >= liftAt && lit < 1) {
      lit = Math.min(1, (t - liftAt) / T.lift); const e = 1 - Math.pow(1 - lit, 3);
      if (visor) visor.style.transform = `translate3d(0, ${(-118 * e).toFixed(2)}%, 0)`;
      key.intensity = 2.4 * e; fill.intensity = 1.8 * e; amb.intensity = 0.22 * e; rim.intensity = 0.8 * e;
      plateMat.envMapIntensity = 1.1 * e; benchMat.envMapIntensity = 0.35 + 0.3 * e;
      if (scene.userData.wall) scene.userData.wall.material.envMapIntensity = 0.9 * e;
      if (lit >= 1 && !done) { done = true; o.onDone && o.onDone(); }
    }
    renderer.render(scene, cam);
    // after the lift nothing moves; render only while something changes (sparks dying, embers cooling)
    const busy = !done || embers.some(e => e.heat > 0.01) || age.some((a, i) => a < life[i]);
    raf = busy ? requestAnimationFrame(frame) : 0;
    if (!raf) last = 0;
  }
  const wake = () => { if (!raf && alive) { last = 0; raf = requestAnimationFrame(frame); } };

  function size() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    const a = w / h, vF = cam.fov * Math.PI / 180, hF = 2 * Math.atan(Math.tan(vF / 2) * a);
    const want = a < 0.95 ? 0.94 : 0.68, d = (2.6 / want / 2) / Math.tan(hF / 2);   // distance for the plate to fill that share of the width
    const dir = eye.clone().sub(new THREE.Vector3(0, 0.42, 0)).normalize();
    cam.position.copy(new THREE.Vector3(0, 0.42, 0).add(dir.multiplyScalar(Math.max(d, 1.6)))); cam.lookAt(0, 0.42, 0);
    renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px';
    wake();
  }
  size(); addEventListener('resize', size);

  // any scroll, tap or key skips to the lit mark (nobody waits ten seconds twice)
  function skip() { if (done) return; if (t0 === null) t0 = performance.now(); t0 = Math.min(t0, performance.now() - liftAt * 1000); wake(); }
  const skipKeys = e => { if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') skip(); };
  addEventListener('wheel', skip, { passive: true }); addEventListener('touchmove', skip, { passive: true });
  host.addEventListener('pointerdown', skip); addEventListener('keydown', skipKeys);
  if (reduce) { lit = 0; }
  wake();

  return {
    skip,
    get done() { return done; },
    destroy() { alive = false; cancelAnimationFrame(raf); removeEventListener('resize', size); removeEventListener('wheel', skip); removeEventListener('touchmove', skip); removeEventListener('keydown', skipKeys); renderer.dispose(); renderer.domElement.remove(); }
  };
}
export default mountHero;
