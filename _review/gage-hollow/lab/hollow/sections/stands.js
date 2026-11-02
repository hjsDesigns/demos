// Section 11 · the sponsor stands — behind Book a call (Hayden 11/1: "put those into the website
// as a section behind the book a call").
//
// Round 4 (Hayden 11/1 night): "I don't want the shine effect… I don't want the Lineage bars Mixed Berry to be there, the
// Hydrate electrolyte powder. It just needs to be Legion, like the name of the company that it is. And then I want his code…
// more of like a headline, and the bottom is also a headline, but just showcasing the company… clicking on the item will
// bring them to that website… they need to be brighter… facing more upwards than downwards."
// So: ONE product per brand (Legion's Pulse, Lineage's Chocolate bar), no swapping, no light sweep. Two headlines: on top
// "USE CODE GAGER · 15% OFF", at the foot the company's name. Tap the product (or the name) and the brand's site opens; a
// drag turns it. Lit brighter (exposure, a front key and a fill) and pitched a little upward (tilt -6, no orbit from above).
// The percent-off is the figure this file has carried (15% each) until Gage confirms it; Hayden's "fifty" on 11/1 was read
// as dictation for fifteen and flagged to him. The FTC line stays, small, at the foot.
//
// Round 3 kept: our own Float Viewer draws the products (js/vendor/float-viewer.js), one canvas per stand, scissored to its
// stage, paused off screen; Google <model-viewer> is gone (its shared position:fixed canvas rode the viewport in the tunnel).
// Turn capped at ±42° (yawLimit): the models carry the brands' real artwork only on the faces their photos show.
//
// Round 5 (Hayden 11/1 night, on the two headlines: "so fucking boring"): the words come alive and carry each brand's own colour.
// The code decodes in (the Decrypted Text port that opens the site), the percent counts up, and a tap on the code copies it and
// says COPIED. The company's name is set huge with Magic UI's Line Shadow Text (ported: the striped shadow that drifts, the
// same device Book a call uses) in the brand's own ink, Legion's red and Lineage's gold, read off their real packaging.
//
// Round 6 (Hayden 11/1 night): "the items aren't changing… I want the items to change every three seconds, but I want the
// transition to be smooth, where it doesn't look like it glitches… for every item that company owns, just go down the list."
// So the products cycle again, all of them, 3 s apart, under the two headlines that stay: the one leaving fades and lifts
// away (420 ms), then the next rises in (700 ms), never two at once, never a cut. The words never change: the code on top,
// the company at the foot.
//
// mountStands(host, opts) → { root, reveal(), pause(), resume(), destroy() }   opts: { swapMs: 3000, autoplay: true }
import { ensureCss, el, reduce } from './common.js?v=20261030e';
// the 3D viewer (three.js) loads only when a stand actually makes one: the safe phone build shows photos instead (11/1)
let FV = null;
const fv = () => FV || (FV = import('../../../js/vendor/float-viewer.js?v=20261031a'));
const PHOTO = { pulse: 'legion-pulse-blue-raspberry.png', pump: 'legion-pump-fruit-punch.png', hydrate: 'legion-hydrate-lemon-lime.png', bar: 'lineage-protein-bar-chocolate.png', 'bar-berry': 'lineage-protein-bar-mixed-berry-1800.png' };
const PHOTO_URL = n => new URL('../../../images/products/' + n, import.meta.url).href;
import { createDecryptedText } from '../../../js/vendor/decrypted-text.js?v=20261031a';

// paths resolve against THIS module (lab/hollow/sections/), so three levels up is the site root
const MODEL = name => new URL(`../../../models/${name}`, import.meta.url).href;
const YAW = 42;
const SWAP_MS = 3000, OUT_MS = 420, IN_MS = 700;

export const BRANDS = [
  { key: 'legion', name: 'Legion Athletics', code: 'GageR', pct: 15, site: 'https://legionathletics.com/', ink: '#5CB2FF',   // the site's blue (Hayden 11/1: "don't make that red… just put the blue over it")
    products: [
      { key: 'pulse', model: 'legion-pulse.glb', name: 'Pulse · Pre-Workout' },
      { key: 'pump', model: 'legion-pump.glb', name: 'Pump · Stim-Free Pre-Workout' },
      { key: 'hydrate', model: 'legion-hydrate.glb', name: 'Hydrate · Electrolyte Powder' } ] },
  { key: 'lineage', name: 'Lineage Provisions', code: 'GAGE10', pct: 15, site: 'https://lineageprovisions.com/', ink: '#5CB2FF',   // the site's blue for both brands
    products: [
      { key: 'bar', model: 'lineage-protein-bar.glb', name: 'The Lineage Bar · Chocolate' },
      { key: 'bar-berry', model: 'lineage-protein-bar-mixed-berry.glb', name: 'The Lineage Bar · Mixed Berry' } ] }
];

const COPY = {
  use: 'Use code',
  off: '% off',
  copied: 'Copied',
  copyHint: 'tap to copy',
  hint: 'drag to turn · tap to open',
  disclosure: 'Sponsored: Gage earns a commission when you buy with his codes.'   // FTC, always shown with sponsor products
};

let cssLink = null;
function linkCss() {
  if (cssLink) return;
  cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.href = new URL('./stands.css?v=20261101k', import.meta.url).href;
  document.head.appendChild(cssLink);
}
export function preloadStands() {   // decode the two models early (the site may call this as the camera comes near)
  linkCss();
  if (document.documentElement.dataset.tier === 'safe') return Promise.resolve([]);
  return fv().then(({ preloadModel }) => Promise.allSettled(BRANDS.flatMap(b => b.products.map(p => preloadModel(MODEL(p.model))))));
}

const ease = t => 1 - Math.pow(1 - t, 3);
// the model's height in its own units, read from its meshes' geometry bounds (so a fade's lift is a fraction of the product)
class Box3Lite {
  constructor(object) {
    let lo = Infinity, hi = -Infinity;
    object.updateWorldMatrix(true, true);
    object.traverse(n => {
      if (!n.isMesh || !n.geometry) return;
      if (!n.geometry.boundingBox) n.geometry.computeBoundingBox();
      const bb = n.geometry.boundingBox; if (!bb) return;
      lo = Math.min(lo, bb.min.y * n.scale.y + n.position.y); hi = Math.max(hi, bb.max.y * n.scale.y + n.position.y);
    });
    this.height = (hi > lo) ? hi - lo : 1;
  }
}
function solid(object) {   // after a fade: opaque again, so the depth sorting stays clean
  object.traverse(n => { if (!n.isMesh) return; const mats = Array.isArray(n.material) ? n.material : [n.material]; for (const m of mats) if (m) { m.opacity = 1; m.transparent = false; m.needsUpdate = true; } });
}
function setOpacity(object, a) {
  object.traverse(n => {
    if (!n.isMesh) return;
    const mats = Array.isArray(n.material) ? n.material : [n.material];
    for (const m of mats) if (m) { if (a < 1 && !m.transparent) { m.transparent = true; m.needsUpdate = true; } m.opacity = a; }
  });
}

export function mountStands(host, opts = {}) {
  ensureCss();
  linkCss();
  const PHONE_Q = window.matchMedia ? window.matchMedia('(max-aspect-ratio: 19/20)').matches : false;
  const SAFE = document.documentElement.dataset.tier === 'safe';   // [phone] the safe build: product photos, no 3D
  const o = { brands: BRANDS, dprCap: PHONE_Q ? 1.25 : 1.5, swapMs: SWAP_MS, autoplay: true, ...opts };   // [phone] 1.25x (11/1: memory)
  const still = reduce();

  const root = el('section', 'gs gs-stands');
  root.setAttribute('aria-label', 'The brands Gage works with');
  if (SAFE) root.dataset.photos = '';
  const inner = el('div', 'st-inner');
  const row = el('div', 'st-row');
  const stands = [];

  for (const b of o.brands) {
    const card = el('div', 'st-card');
    card.style.setProperty('--brand-ink', b.ink);
    // the headline on top: his code decodes in, the percent counts up, a tap copies the code
    const top = el('h3', 'st-code-line');
    const codeBtn = el('button', 'st-code'); codeBtn.type = 'button';
    const codeText = el('span', 'st-code-text', b.code);
    const codeNote = el('span', 'st-code-note', COPY.copyHint);
    codeBtn.append(codeText, codeNote);
    codeBtn.setAttribute('aria-label', `Copy the code ${b.code}`);
    const off = el('span', 'st-off');
    const offN = el('b', 'st-off-n', '0');
    off.append(offN, el('span', 'st-off-t', COPY.off));
    top.append(el('span', 'st-code-use', COPY.use), codeBtn, off);

    // the stage: one Float Viewer canvas; one slot per product on the same spot, only the shown one takes the pointer
    const stage = el('div', 'st-stage');
    const slots = b.products.map((p, i) => { const sl = el('div', 'st-slot' + (i ? '' : ' on')); sl.setAttribute('aria-hidden', 'true'); if (SAFE && PHOTO[p.key]) { const im = document.createElement('img'); im.src = PHOTO_URL(PHOTO[p.key]); im.alt = p.name; im.loading = 'lazy'; im.decoding = 'async'; sl.appendChild(im); } stage.appendChild(sl); return sl; });
    stage.append(el('div', 'st-drag', COPY.hint));

    // the headline at the foot: the company in its own ink with the drifting line shadow (Magic UI Line Shadow Text, ported), opens the site
    const brandLink = el('a', 'st-brand-line');
    const brandWord = el('span', 'st-brand-word', b.name);
    brandWord.dataset.text = b.name;
    brandLink.appendChild(brandWord);
    brandLink.href = b.site; brandLink.target = '_blank'; brandLink.rel = 'noopener sponsored';
    brandLink.setAttribute('aria-label', `Open ${b.name} (uses code ${b.code})`);

    card.append(top, stage, brandLink);
    row.appendChild(card);

    const st = { b, i: 0, viewer: null, objects: new Map(), heights: new Map(), raf: 0, swapRaf: 0, timer: null, swapT: 0, ro: null, countRaf: 0, copyT: 0 };
    stands.push(st);
    // the code: scrambled until the section arrives, then it decodes (the site's own opening-line device)
    st.fx = createDecryptedText(codeText, { animateOn: 'manual', sequential: true, revealDirection: 'start', speed: 42, effect: 'fade',
      scrambleColor: '#5CB2FF', characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>' });
    const count = () => {   // 0 → the percent, 900 ms, eased
      cancelAnimationFrame(st.countRaf);
      const t0 = performance.now(), ms = still ? 0 : 900;
      const tick = now => { const p = ms ? Math.min(1, (now - t0) / ms) : 1; offN.textContent = String(Math.round(ease(p) * b.pct)); if (p < 1) st.countRaf = requestAnimationFrame(tick); };
      st.countRaf = requestAnimationFrame(tick);
    };
    st.words = () => { st.fx.play(); count(); };
    st.wordsHide = () => { st.fx.hide(); offN.textContent = '0'; };
    codeBtn.addEventListener('click', e => {
      e.stopPropagation();
      const done = () => { codeBtn.classList.add('is-copied'); codeNote.textContent = COPY.copied; clearTimeout(st.copyT); st.copyT = setTimeout(() => { codeBtn.classList.remove('is-copied'); codeNote.textContent = COPY.copyHint; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(b.code).then(done, done); else done();
    });

    if (!SAFE) fv().then(({ createFloatViewer }) => {
    st.viewer = createFloatViewer(stage, {
      environment: 'studio-tunnel',
      environmentIntensity: 1.6,          // brighter (Hayden: "they seem kind of dark")
      exposure: 1.45,
      lights: [
        { type: 'directional', color: '#ffffff', intensity: 1.9, position: [-2.5, 3.5, 6] },   // the key, front left, higher and stronger
        { type: 'directional', color: '#eaf2ff', intensity: 0.9, position: [3, 1, 6] },        // a front fill so the label never falls dark
        { type: 'directional', color: '#0687FF', intensity: 2.2, position: [-4, 1.5, -4] },     // the tunnel's blue, behind left
        { type: 'directional', color: '#5CB2FF', intensity: 1.4, position: [4.5, 2, -3] }       // and behind right
      ],
      keyLight: false,
      turntable: true,
      orbit: false,                        // not seen from above any more
      tilt: -6,                            // pitched a little upward (Hayden: "facing more upwards than downwards")
      autoRotate: still ? false : 'sway',
      swayAngle: 20,
      autoRotateSpeed: 0.4,
      autoRotateDelay: 1.2,
      yawLimit: YAW,
      zoom: false,
      fitMode: 'turntable',
      fit: 1,
      faceOnHover: false,
      dprCap: o.dprCap,
      introOnLoad: false,
      items: b.products.map((p, i) => ({ key: p.key, slot: slots[i], shape: 'model', url: MODEL(p.model), startAngle: 0 })),
      onItemReady: key => {
        const it = (st.viewer.items || []).find(x => x.key === key);
        if (!it || !it.object) return;
        st.objects.set(key, it.object);
        const box = new Box3Lite(it.object); st.heights.set(key, box.height);
        const on = key === b.products[st.i].key;
        it.object.visible = on;
        if (!on) setOpacity(it.object, 0);
        if (on) card.dataset.ready = '';
        st.viewer.refresh && st.viewer.refresh();
      },
      onError: (err, key) => { console.warn('stands:', key, err); }
    });
    if (st.viewer.failed) root.dataset.flat = '';
    if (typeof ResizeObserver === 'function') { st.ro = new ResizeObserver(() => st.viewer && st.viewer.refresh && st.viewer.refresh()); st.ro.observe(stage); }
    }).catch(err => { console.warn('stands viewer', err); root.dataset.flat = ''; });

    // one product fades and lifts away, then the next rises in: never two at once, never a cut (Hayden: "smooth… doesn't glitch")
    const fadeTo = (obj, from, to, ms, done) => {
      const h = st.heights.get([...st.objects].find(([, o]) => o === obj)?.[0]) || 1;
      obj.visible = true;
      const t0 = performance.now();
      const tick = now => {
        const p = Math.min(1, (now - t0) / ms), e = ease(p);
        setOpacity(obj, from.a + (to.a - from.a) * e);
        obj.position.y = (from.y + (to.y - from.y) * e) * h;
        if (p < 1) st.swapRaf = requestAnimationFrame(tick);
        else { if (to.a === 0) obj.visible = false; else solid(obj); done && done(); }
      };
      cancelAnimationFrame(st.swapRaf);
      st.swapRaf = requestAnimationFrame(tick);
    };
    const show = n => {
      const next = (n + b.products.length) % b.products.length;
      if (next === st.i) return;
      const prev = st.objects.get(b.products[st.i].key), nxt = st.objects.get(b.products[next].key);
      st.i = next;
      slots.forEach((sl, j) => sl.classList.toggle('on', j === next));
      if (!nxt) { if (prev) prev.visible = false; return; }
      if (still || !prev) { if (prev) prev.visible = false; setOpacity(nxt, 1); nxt.position.y = 0; nxt.visible = true; solid(nxt); return; }
      fadeTo(prev, { a: 1, y: 0 }, { a: 0, y: 0.05 }, OUT_MS, () => fadeTo(nxt, { a: 0, y: -0.08 }, { a: 1, y: 0 }, IN_MS));
    };
    st.restart = () => { clearInterval(st.timer); if (!still && o.autoplay && b.products.length > 1) st.timer = setInterval(() => show(st.i + 1), o.swapMs); };
    st.stop = () => clearInterval(st.timer);

    // the entrance: the words come alive and the shown product rises in once
    st.reveal = () => {
      st.words();
      const obj = st.objects.get(b.products[st.i].key);
      if (!obj || still) return;
      fadeTo(obj, { a: 0, y: -0.1 }, { a: 1, y: 0 }, 900);
    };

    // a tap on the product opens the brand's site; a drag (the viewer's own handlers on the slot) turns it
    let down = null;
    stage.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
    stage.addEventListener('pointerup', e => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]); down = null;
      if (moved < 6) window.open(b.site, '_blank', 'noopener');
    });
    st.restart();
  }

  const disc = el('p', 'st-disc', COPY.disclosure);
  inner.append(row, disc);
  root.appendChild(inner);
  host.appendChild(root);
  requestAnimationFrame(() => stands.forEach(st => st.viewer && st.viewer.refresh && st.viewer.refresh()));

  return {
    root,
    reveal() { stands.forEach(st => st.reveal()); },
    pause() { stands.forEach(st => { st.stop(); st.viewer && st.viewer.pause && st.viewer.pause(); }); },
    resume() { stands.forEach(st => { st.restart(); if (st.viewer) { st.viewer.resume && st.viewer.resume(); st.viewer.refresh && st.viewer.refresh(); } }); },
    destroy() {
      stands.forEach(st => { st.stop(); cancelAnimationFrame(st.raf); cancelAnimationFrame(st.swapRaf); cancelAnimationFrame(st.countRaf); clearTimeout(st.copyT); st.fx && st.fx.destroy && st.fx.destroy(); st.ro && st.ro.disconnect(); st.viewer && st.viewer.destroy && st.viewer.destroy(); });
      root.remove();
    }
  };
}
export default mountStands;
