// Piece · Supplements: the products Gage is sponsored by, as real 3D models floating like Prismic's Fizzi cans (2026-10-31).
// Hayden (10/31): "for the brands I'm sponsored by, all of these should be 3D like how the shoe was just the shoe… they
// should be like The fizz… rotating like that… Life-like 3D." Then: the products live inside the method section's
// "Supplements" piece (tap it and it opens into the products floating like Fizzi); the separate sponsors section goes.
//
// What it is: Lineage's protein bar, Legion's Hydrate pouch and Legion's Pulse tub as glTF models (models/*.glb, built
// in Blender from the brands' own photos: lab/3d/, sources in lab/PRODUCTS.md), floating together in one stage like
// Fizzi's hero cans: each floats and sways on drei's Float with Fizzi's numbers and turns slowly on the spot, a drag
// spins it (React Bits Model Viewer's drag and coast), hovering or tapping one turns it round to face you, and the one in
// front passes over the others. One canvas (js/vendor/float-viewer.js) draws all three, only while the piece is shown.
// Under the stage, each product's name, its one line in the brand's own words and its official page.
//
// CODES: off by default (brief.json: they undercut the client-only discounts Gage sells). opts.showCodes shows his code
// and 15% under each product, sends the link through his referral link (rel="sponsored") and adds the commission line.
// FTC: the heading names the sponsorship and the one disclosure line (both brands named) is always on.
// PLACEHOLDER picks (root data-pick="placeholder") until Gage says which products he uses and may show.
//
// mountSupplements(el, opts) → { el, viewer, products, reveal(), pause(), resume(), close(), destroy(), setShowCodes(on) }
//   el: the box it fills (it needs a size: the opened Supplements card, about 39u x 70u, or any other box)
//   opts: { showCodes: false, onLink(product, event), lazy: true, autoplay: false, spin: 'turn' | 'sway',
//           copy: { kicker, title, hint, link, codeLink, code, commission }, products: SUPPLEMENTS, dprCap: 1.5,
//           isolate: true }
//   reveal()   the products rise in one after another and the words slide up (call it when the piece opens)
//   pause() / resume()   stop / restart the canvas (call them as the piece hides / shows: it can't see a flipped-away card)
//   close()    let go of any drag or hover (call it as the piece closes)
//   destroy()  give the WebGL context back and remove the piece
// lazy (default): the 3D (its WebGL context and the three models) is made on the first reveal(), so a card nobody opens
// costs nothing; until then, and without WebGL, the brands' photos show in its place. isolate (default): clicks, drags
// and keys inside the piece don't reach the card around it (so spinning a product never flips the card). autoplay: it
// reveals itself the first time it's properly on screen (a plain page with nothing to call reveal()).
// The piece sizes from its own box (CSS container queries): a tall box stacks the stage over the list, a wide one puts
// them side by side.
import { createFloatViewer, preloadModel } from '../../../js/vendor/float-viewer.js?v=20261031a';
import { el, lineReveal, reduce } from './common.js?v=20261030e';

const MODEL = name => new URL(`../../../models/${name}`, import.meta.url).href;
const IMG = name => new URL(`../../../images/products/${name}`, import.meta.url).href;

// the stage: where each product floats. place: its box's centre (x as % of the stage's width, y as % of its height) and
// its size (a square, % of the stage's height), for a tall piece and a wide one. The sizes keep the three at their real
// relative sizes (pouch 19.8 cm tall, tub 14.4 cm, bar 15 cm long; the bar, in front, a touch larger) once the Float
// Viewer's turntable fit has kept room in each box for the float's lean and lift. Later ones pass in front. pool: where
// its light pool sits below the box's centre (share of the box). still: how big the brand's photo shows in the box until
// the model is ready (so photo and model match as one fades into the other). hit: the part of its box that takes the
// pointer (inset top, right, bottom, left, % of the box), so a box that overlaps another doesn't steal the pointer.
export const SUPPLEMENTS = [
  {
    key: 'legion-hydrate',
    brand: 'Legion Athletics',
    name: 'Hydrate',
    what: 'Electrolyte drink mix, naturally sweetened and sugar-free',
    model: MODEL('legion-hydrate.glb'),
    image: IMG('legion-hydrate-lemon-lime.png'),
    alt: 'Legion Hydrate electrolyte powder, Lemon Lime: a black and coral stand-up pouch',
    url: 'https://legionathletics.com/products/supplements/electrolyte-powder/',
    code: 'GageR',
    discount: '15% off',
    codeUrl: 'https://legionathletics.rfrl.co/qmjr3',
    place: { tall: [31, 46, 100], wide: [30, 47, 100] },
    pool: 0.33,
    still: 0.74,
    hit: [17, 27, 15, 27],
    pose: [0, 0, 4],
    startAngle: 24
  },
  {
    key: 'legion-pulse',
    brand: 'Legion Athletics',
    name: 'Pulse',
    what: 'Pre-workout, naturally sweetened and flavored',
    model: MODEL('legion-pulse.glb'),
    image: IMG('legion-pulse-blue-raspberry.png'),
    alt: 'Legion Pulse pre-workout, Blue Raspberry: a black tub with a coral label',
    url: 'https://legionathletics.com/products/supplements/pulse-pre-workout/',
    code: 'GageR',
    discount: '15% off',
    codeUrl: 'https://legionathletics.rfrl.co/qmjr3',
    place: { tall: [72, 41, 72], wide: [71, 41, 72] },
    pool: 0.33,
    still: 0.71,
    hit: [17, 20, 15, 20],
    pose: [0, 0, -3],
    startAngle: -28
  },
  {
    key: 'lineage-protein-bar',
    brand: 'Lineage Provisions',
    name: 'Protein Bar',
    what: 'Real-food protein bar, 20g grass-fed protein',
    model: MODEL('lineage-protein-bar.glb'),
    image: IMG('lineage-protein-bar-chocolate.png'),
    alt: 'The Lineage Protein Bar, Chocolate: a black wrapper with LINEAGE in white and an orange 20g tab',
    url: 'https://lineageprovisions.com/products/lineage-bar-chocolate',
    code: 'GAGE10',
    discount: '15% off',
    codeUrl: 'https://lineageprovisions.com/GAGE10',
    place: { tall: [51, 75, 80], wide: [51, 75, 80] },
    pool: 0.2,
    still: 0.9,
    hit: [32, 12, 30, 12],
    pose: [0, 0, -6],
    startAngle: -16
  }
];

const COPY = {
  kicker: ['Supplements', 'Sponsors'],
  title: 'Brands I’m sponsored by',
  hint: 'Drag one to spin it',
  link: 'Official page',
  codeLink: 'Shop with my code',
  code: 'Code',
  commission: 'If you use my codes, I may earn a commission.'
};

// supplements.css, linked once
const CSS = new URL('./supplements.css?v=20261031a', import.meta.url);
function linkCss() {
  const has = [...document.querySelectorAll('link[rel="stylesheet"]')].find(node => {
    try {
      return new URL(node.href, location.href).pathname === CSS.pathname;
    } catch {
      return false;
    }
  });
  if (has) return Promise.resolve();
  const node = document.createElement('link');
  node.rel = 'stylesheet';
  node.href = CSS.href;
  const ready = new Promise(resolve => {
    node.addEventListener('load', resolve, { once: true });
    node.addEventListener('error', resolve, { once: true });
  });
  document.head.appendChild(node);
  return ready;
}

// showing, as far as CSS can say (the tunnel hides what it has flown past with visibility: hidden)
const shown = node => {
  if (!node.isConnected) return false;
  if (node.checkVisibility) return node.checkVisibility({ visibilityProperty: true, checkVisibilityCSS: true });
  return getComputedStyle(node).visibility !== 'hidden';
};

const brandList = names => {
  const list = [...new Set(names)];
  return list.length > 1 ? `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}` : list[0] || '';
};

/** Fetch and decode the three models ahead of time (e.g. as the camera nears the method section). */
export function preloadSupplements(products = SUPPLEMENTS) {
  return Promise.allSettled(products.map(p => preloadModel(p.model)));
}

export function mountSupplements(host, opts = {}) {
  const o = {
    showCodes: false, onLink: null, lazy: true, autoplay: false, spin: 'turn', copy: null, products: SUPPLEMENTS, dprCap: 1.5,
    isolate: true, ...opts
  };
  const copy = { ...COPY, ...(o.copy || {}) };
  const products = o.products;
  const cssReady = linkCss();

  const root = el('section', 'sp');
  root.setAttribute('aria-label', copy.title);
  root.dataset.pick = 'placeholder';
  root.dataset.ready = 'false';
  const inner = el('div', 'sp-inner');

  // ---- heading: the sponsorship, said plainly
  const head = el('header', 'sp-head');
  const k = el('p', 'sp-k');
  copy.kicker.forEach((word, i) => {
    if (i) k.append(el('span', 'sp-k-dot', '·'));
    k.append(el('span', '', word));
  });
  const h = el('h3', 'sp-title', copy.title);
  const hint = el('p', 'sp-hint', copy.hint);
  head.append(k, h, hint);

  // ---- the stage: one box per product (where it floats, and what takes the pointer); the canvas covers the stage
  const stage = el('div', 'sp-stage');
  const items = new Map();
  products.forEach((p, i) => {
    const place = p.place || { tall: [50, 50, 100], wide: [50, 50, 100] };
    const at = node => {
      ['tall', 'wide'].forEach(shape => {
        const [cx, cy, size] = place[shape] || place.tall;
        node.style.setProperty(`--${shape}-cx`, cx);
        node.style.setProperty(`--${shape}-cy`, cy);
        node.style.setProperty(`--${shape}-s`, size);
      });
      return node;
    };
    // back to front: the blue light it floats in (a soft pool under it), the brand's photo until its model is ready (and
    // for good without WebGL), then (over the canvas) the box that takes the pointer
    const pool = at(el('span', 'sp-pool'));
    pool.setAttribute('aria-hidden', 'true');
    pool.style.setProperty('--py', p.pool ?? 0.3);
    const still = at(el('img', 'sp-still'));
    Object.assign(still, { src: p.image, alt: '', decoding: 'async', draggable: false });
    still.style.setProperty('--still', p.still ?? 0.7);
    const slot = at(el('div', 'sp-slot'));
    slot.dataset.product = p.key;
    slot.setAttribute('role', 'img');
    slot.setAttribute('aria-label', p.alt);
    if (p.hit) slot.style.setProperty('--hit', `inset(${p.hit.map(v => `${v}%`).join(' ')} round 9%)`);
    slot.style.zIndex = String(2 + i);
    stage.append(pool, still, slot);
    items.set(p.key, { product: p, slot, pool, still, row: null });
  });

  // ---- the list: each product's brand, name, one line and link
  const list = el('ul', 'sp-list');
  for (const p of products) {
    const row = el('li', 'sp-row');
    row.dataset.product = p.key;
    const brand = el('p', 'sp-brand', p.brand);
    const line = el('div', 'sp-line');
    const name = el('h4', 'sp-name', p.name);
    const a = el('a', 'sp-link');
    a.target = '_blank';
    const label = el('span', '', copy.link);
    const arrow = el('span', 'sp-arrow', '↗');
    arrow.setAttribute('aria-hidden', 'true');
    a.append(label, arrow);
    a.addEventListener('click', event => o.onLink?.(p, event));
    line.append(name, a);
    const what = el('p', 'sp-what', p.what);
    const code = el('p', 'sp-code');
    row.append(brand, line, what, code);
    list.appendChild(row);
    Object.assign(items.get(p.key), { row, a, label, code });
  }

  // ---- the disclosure, always there while a sponsor is shown
  const foot = el('p', 'sp-foot');
  inner.append(head, stage, list, foot);
  root.appendChild(inner);
  host.appendChild(root);

  // inside a card that flips on a click: keep the piece's clicks, drags and keys to itself (so spinning a product doesn't
  // flip or tilt the card, and Enter on a link opens it instead of turning the card over). Never the wheel: the page
  // scrolls on it.
  const stop = event => event.stopPropagation();
  const isolated = o.isolate ? ['click', 'dblclick', 'pointerdown', 'pointermove', 'pointerup', 'keydown'] : [];
  isolated.forEach(type => root.addEventListener(type, stop));

  let codesOn = false;
  function setShowCodes(on) {
    codesOn = !!on;
    root.dataset.codes = codesOn ? 'on' : 'off';
    for (const it of items.values()) {
      const p = it.product;
      const withCode = codesOn && p.code && p.codeUrl;
      it.a.href = withCode ? p.codeUrl : p.url;
      it.a.rel = withCode ? 'sponsored noopener' : 'noopener';
      it.label.textContent = withCode ? copy.codeLink : copy.link;
      it.a.setAttribute('aria-label', `${p.brand} ${p.name}: ${it.label.textContent} (opens in a new tab)`);
      it.code.replaceChildren();
      it.code.hidden = !withCode;
      if (withCode) {
        it.code.append(el('span', 'sp-code-k', copy.code), el('b', '', p.code));
        if (p.discount) it.code.append(el('span', 'sp-code-off', `· ${p.discount}`));
      }
    }
    foot.textContent = `Disclosure: ${brandList(products.map(p => p.brand))} sponsor me.${codesOn ? ` ${copy.commission}` : ''}`;
  }
  setShowCodes(o.showCodes);

  // ---- the one the pointer is on: its row lights up, and hovering a row turns its product to face you
  let activeKey = null;
  function light(key) {
    activeKey = key;
    for (const [k2, it] of items) {
      const on = k2 === key;
      it.row.classList.toggle('is-active', on);
      it.slot.classList.toggle('is-active', on);
      it.pool.classList.toggle('is-active', on);
    }
  }
  for (const [key, it] of items) {
    it.row.addEventListener('pointerenter', () => {
      light(key);
      viewer?.face(key);
    });
    it.row.addEventListener('pointerleave', () => {
      if (activeKey === key) light(null);
    });
    it.row.addEventListener('focusin', () => {
      light(key);
      viewer?.face(key);
    });
    it.row.addEventListener('focusout', event => {
      if (!it.row.contains(event.relatedTarget) && activeKey === key) light(null);
    });
  }

  // ---- the 3D: one Float Viewer over the stage, made on the first reveal() (or now, with lazy: false)
  let viewer = null;
  let alive = true;
  let paused = false;
  function start() {
    if (viewer || !alive) return viewer;
    viewer = createFloatViewer(stage, {
      environment: 'studio-tunnel', // the tunnel's navy and blue strips, with a studio's white softboxes for true labels
      environmentIntensity: 1,
      exposure: 1.05,
      lights: [
        { type: 'directional', color: '#ffffff', intensity: 1.1, position: [-3, 4, 5] }, // the key, front left
        { type: 'directional', color: '#0687FF', intensity: 2.6, position: [-4, 1.5, -4] }, // the tunnel's blue, behind left
        { type: 'directional', color: '#5CB2FF', intensity: 1.6, position: [4.5, 2, -3] } // and behind right
      ],
      keyLight: false,
      turntable: true, // they turn upright, on the spot
      orbit: true, // seen from a little above as they turn, without wobbling
      autoRotate: o.spin === 'sway' ? 'sway' : true,
      autoRotateSpeed: 0.45,
      autoRotateDelay: 1.2,
      zoom: false, // the wheel belongs to the page
      fitMode: 'turntable',
      fit: 1, // the turntable fit already keeps room for Fizzi's lean and lift, and the camera's tilt
      tilt: 8,
      faceOnHover: true,
      faceAngle: 0,
      dprCap: o.dprCap,
      paused,
      items: products.map(p => ({
        key: p.key,
        slot: items.get(p.key).slot,
        shape: 'model',
        url: p.model,
        pose: p.pose,
        startAngle: p.startAngle ?? -20
      })),
      onItemReady: key => {
        const it = items.get(key);
        if (it) {
          it.slot.dataset.ready = '';
          it.still.dataset.ready = '';
        }
        const done = i => i.slot.hasAttribute('data-ready') || i.slot.hasAttribute('data-failed');
        if ([...items.values()].every(done)) root.dataset.ready = 'true';
      },
      onActive: key => light(key),
      onError: (error, key) => {
        if (key && items.get(key)) items.get(key).slot.dataset.failed = '';
      }
    });
    if (viewer.failed) root.dataset.flat = ''; // no WebGL: the brands' photos stay, still
    cssReady.then(() => requestAnimationFrame(() => viewer?.refresh()));
    return viewer;
  }
  if (!o.lazy) start();

  // ---- the entrance
  let cancelReveal = () => {};
  let revealing = false;
  function reveal() {
    if (!alive || !shown(root)) return;
    start();
    if (paused) api.resume();
    if (revealing) return;
    cancelReveal();
    revealing = true;
    root.classList.remove('is-in');
    void root.offsetWidth;
    root.classList.add('is-in');
    cancelReveal = lineReveal([h], {
      onDone: () => {
        revealing = false;
      }
    });
    if (!reduce() && viewer && !viewer.failed) viewer.intro({ stagger: 0.16 });
  }

  // a plain page (nothing calls reveal()): the first time the stage is properly on screen, reveal it
  let seen = null;
  if (o.autoplay && 'IntersectionObserver' in window) {
    seen = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting && e.intersectionRatio >= 0.5)) {
          seen.disconnect();
          seen = null;
          reveal();
        }
      },
      { threshold: [0.5] }
    );
    seen.observe(stage);
  }

  const api = {
    el: root,
    get viewer() {
      return viewer;
    },
    products,
    reveal,
    pause() {
      paused = true;
      viewer?.pause();
    },
    resume() {
      paused = false;
      if (alive) viewer?.resume();
    },
    close() {
      viewer?.settle();
      light(null);
    },
    setShowCodes,
    get showCodes() {
      return codesOn;
    },
    destroy() {
      if (!alive) return;
      alive = false;
      cancelReveal();
      seen?.disconnect();
      isolated.forEach(type => root.removeEventListener(type, stop));
      viewer?.destroy();
      viewer = null;
      root.remove();
    }
  };
  return api;
}

export default mountSupplements;
