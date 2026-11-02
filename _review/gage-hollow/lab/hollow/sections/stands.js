// Section 11 · the sponsor stands — behind Book a call (Hayden 11/1: "put those into the website
// as a section behind the book a call").
//
// Two stands, Legion and Lineage, each turning through that brand's products: a swap every 4.8 s,
// drag to turn one yourself, tap it to open the real shop page with Gage's code.
//
// WHY <model-viewer> AND NOT OUR OWN float-viewer (11/1): float-viewer.js draws nothing in the
// browser — its own library demo is blank too, before and after our yawLimit patch, with WebGL
// fine. Google's <model-viewer> (Apache-2.0) took the same .glb files unchanged, first try.
//
// WHY THE TURN IS CAPPED: the models carry the brands' own artwork on the faces their photos show.
// Neither brand publishes back-of-pack art (checked 11/1: what looks like it — Lineage's
// choc-pdp-NFP.jpg, Legion's "ingredients carousel" — is a marketing graphic, a nutrition table on
// a plain background, not a photo of the pack). So the camera is held to ±42° and no blank face can
// ever be turned into view. Three photos from Gage removes the cap. NEVER RECREATE: nothing here is
// drawn or invented; the labels are the brands' own photos re-projected (lab/3d/, PRODUCTS.md).
import { ensureCss, el, reduce } from './common.js?v=20261030e';

const MV = 'https://unpkg.com/@google/model-viewer@4.0.0/dist/model-viewer.min.js';
const HDR = '../../js/vendor/mv/studio_small_03_1k.hdr';   // Poly Haven studio_small_03, CC0
const YAW = 42;
const SWAP_MS = 4800;

export const BRANDS = [
  { key: 'legion', name: 'Legion Athletics', code: 'GageR', off: '15% off', products: [
    { model: '../../models/legion-pulse.glb', name: 'Pulse · Pre-Workout',
      what: 'Naturally sweetened pre-workout, 20 servings. Around 30 flavours.', price: '$49.99',
      url: 'https://legionathletics.com/products/supplements/pulse-pre-workout/' },
    { model: '../../models/legion-pump.glb', name: 'Pump · Stim-Free Pre-Workout',
      what: 'The same tub without the caffeine — for evening sessions.', price: '$39.99',
      url: 'https://legionathletics.com/products/supplements/pump-pre-workout/' },
    { model: '../../models/legion-hydrate.glb', name: 'Hydrate · Electrolyte Powder',
      what: 'Sugar-free electrolyte drink mix. Watermelon, Fruit Punch, Lemon Lime.', price: '$29.99',
      url: 'https://legionathletics.com/products/supplements/electrolyte-powder/' } ]},
  { key: 'lineage', name: 'Lineage Provisions', code: 'GAGE10', off: '15% off', products: [
    { model: '../../models/lineage-protein-bar.glb', name: 'The Lineage Bar · Chocolate',
      what: '20g grass-fed protein. Real food, no gums or syrups.', price: '$49 / 12 bars',
      url: 'https://lineageprovisions.com/products/lineage-bar-chocolate' },
    { model: '../../models/lineage-protein-bar-mixed-berry.glb', name: 'The Lineage Bar · Mixed Berry',
      what: 'Same bar, berry wrapper. One of five flavours.', price: '$49 / 12 bars',
      url: 'https://lineageprovisions.com/products/lineage-bar-mixed-berry' } ]}
];

const COPY = {
  k: ['His sponsors', 'Use his code'],
  title: 'What he actually takes',
  lede: 'Two brands Gage works with. Turn one to look at it; tap it to open their shop with his code.'
};

let cssLink = null;
function linkCss() {
  if (cssLink) return;
  cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.href = new URL('./stands.css?v=20261101a', import.meta.url).href;
  document.head.appendChild(cssLink);
}
let mvLoading = null;
function loadModelViewer() {
  if (customElements.get('model-viewer')) return Promise.resolve(true);
  if (mvLoading) return mvLoading;
  mvLoading = new Promise(res => {
    const s = document.createElement('script');
    s.type = 'module'; s.src = MV;
    s.onload = () => res(true);
    s.onerror = () => res(false);     // no 3D: the cards still read, with their photos' names
    document.head.appendChild(s);
  });
  return mvLoading;
}
export function preloadStands() { linkCss(); return loadModelViewer(); }

export function mountStands(host, opts = {}) {
  ensureCss();
  linkCss();
  const o = { products: BRANDS, swapMs: SWAP_MS, autoplay: true, ...opts };
  const still = reduce();

  const root = el('section', 'gs gs-stands');
  root.setAttribute('aria-label', 'The brands Gage works with');
  const inner = el('div', 'st-inner');

  const head = el('div', 'st-head');
  const k = el('p', 'gs-k');
  k.append(el('span', '', COPY.k[0]), el('span', 'gs-k-dot', '·'), el('span', '', COPY.k[1]));
  head.append(k, el('h3', 'gs-h', COPY.title), el('p', 'gs-p', COPY.lede));

  const row = el('div', 'st-row');
  const stands = [];

  for (const b of o.products) {
    const card = el('div', 'st-card');
    const brand = el('div', 'st-brand');
    brand.append(el('b', '', b.name), el('span', 'st-code', b.code), el('span', 'st-off', b.off));

    const stage = el('div', 'st-stage');
    const views = b.products.map((p, i) => {
      const m = document.createElement('model-viewer');
      m.setAttribute('src', new URL(p.model, import.meta.url).href);
      m.setAttribute('alt', p.name);
      m.setAttribute('environment-image', new URL(HDR, import.meta.url).href);
      m.setAttribute('shadow-intensity', '0.9');
      m.setAttribute('shadow-softness', '0.8');
      m.setAttribute('exposure', '1.05');
      m.setAttribute('tone-mapping', 'neutral');
      m.setAttribute('camera-controls', '');
      m.setAttribute('disable-zoom', ''); m.setAttribute('disable-pan', '');
      m.setAttribute('interaction-prompt', 'none');
      m.setAttribute('min-field-of-view', '26deg');
      m.setAttribute('max-field-of-view', '26deg');
      m.setAttribute('min-camera-orbit', `-${YAW}deg 72deg auto`);
      m.setAttribute('max-camera-orbit', `${YAW}deg 96deg auto`);
      m.setAttribute('camera-orbit', '0deg 84deg auto');
      // eager for all of them: the section only mounts when the camera is already near, and
      // inside the tunnel's 3D transform model-viewer's own lazy IntersectionObserver never fires
      m.setAttribute('loading', 'eager');
      m.setAttribute('reveal', 'auto');
      if (!i) m.classList.add('on');
      m.addEventListener('load', () => { m.dataset.loaded = '1'; });
      return m;
    });
    stage.append(...views, el('div', 'st-drag', 'drag to turn'));

    const cap = el('div', 'st-cap');
    const nm = el('h4', 'st-nm'), what = el('p', 'st-what'), price = el('span', 'st-price');
    const go = el('div', 'st-go');
    const shop = el('a', '', 'Open the shop ↗');
    shop.target = '_blank'; shop.rel = 'noopener';
    const dotBox = el('div', 'st-dots');
    const dots = b.products.map((p, i) => {
      const d = el('button'); d.type = 'button';
      if (!i) d.className = 'on';
      d.setAttribute('aria-label', 'Show ' + p.name);
      dotBox.appendChild(d); return d;
    });
    go.append(shop, dotBox);
    cap.append(nm, what, price, go);
    card.append(brand, stage, cap);
    row.appendChild(card);

    const st = { b, views, i: 0, timer: null, touched: false, rest: null, sway: null };
    stands.push(st);

    const paint = () => {
      const p = b.products[st.i];
      nm.textContent = p.name; what.textContent = p.what; price.textContent = p.price;
      shop.href = p.url;
      views.forEach((m, j) => m.classList.toggle('on', j === st.i));
      dots.forEach((d, j) => d.classList.toggle('on', j === st.i));
    };
    const show = (n, byHand) => {
      const next = (n + b.products.length) % b.products.length;
      if (next === st.i) return;
      cap.classList.add('fade');
      setTimeout(() => { st.i = next; paint(); cap.classList.remove('fade'); }, 280);
      if (byHand) restart();
    };
    const restart = () => {
      clearInterval(st.timer);
      if (!still && o.autoplay) st.timer = setInterval(() => show(st.i + 1), o.swapMs);
    };
    st.show = show; st.restart = restart; st.stop = () => clearInterval(st.timer);

    dots.forEach((d, j) => d.onclick = e => { e.stopPropagation(); show(j, true); });
    // drag turns it; a tap opens the shop. Told apart by how far the pointer moved.
    let down = null;
    stage.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
    stage.addEventListener('pointerup', e => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]); down = null;
      if (moved < 6) window.open(b.products[st.i].url, '_blank', 'noopener');
    });
    if (!still) {
      let t = 0;
      st.sway = setInterval(() => {
        const m = views[st.i];
        if (!m || st.touched || !m.dataset.loaded) return;
        t += 0.05;
        m.cameraOrbit = `${(Math.sin(t) * 22).toFixed(2)}deg 84deg auto`;
      }, 60);
      views.forEach(m => m.addEventListener('camera-change', e => {
        if (e.detail && e.detail.source === 'user-interaction') {
          st.touched = true; clearTimeout(st.rest);
          st.rest = setTimeout(() => { st.touched = false; }, 4000);
        }
      }));
    }
    paint();
  }

  inner.append(head, row);
  root.appendChild(inner);
  host.appendChild(root);

  loadModelViewer().then(ok => { root.dataset.mv = ok ? 'ready' : 'unavailable'; });
  stands.forEach(st => st.restart());

  return {
    root,
    pause() { stands.forEach(st => st.stop()); },
    resume() { stands.forEach(st => st.restart()); },
    destroy() {
      stands.forEach(st => { st.stop(); clearInterval(st.sway); clearTimeout(st.rest); });
      root.remove();
    }
  };
}
export default mountStands;
