// Section · the products Gage is sponsored by (2026-10-30).
// Hayden (10/30): "the model viewer and floating cans fizzy. I want you to kind of combine the two… Gage should have
// products that he's attached to. I want us to retrieve those products, whether he's associated by sponsorship or it's his
// own product… put that as a section in the site." (10/30 AM: "he's sponsored by a few people for granola bars and or
// protein bars… and like supplements as far as hydration and energy… floating rotating like spaceship looking")
// What it is: his sponsors' products floating in the tunnel's blue light, on the Float Viewer (js/vendor/float-viewer.js:
// React Bits Model Viewer joined with Prismic Fizzi's FloatingCan / drei Float). Each one floats and sways like Fizzi's
// cans and slowly turns (Model Viewer's auto-rotate); hovering one (or tapping it) glides it round to face you; a drag
// spins it and it coasts. One canvas for the three, running only while the section is shown.
// The products and their sources: lab/PRODUCTS.md. Only the brands' own pictures (images/products/), printed on a navy
// card: neither brand publishes a flat label or a 3D model, so nothing is wrapped round a shape we'd have to guess.
// Which products: Lineage Provisions (his IG bio "@lineageprovisions GAGE10", his link page) → its protein bar; Legion
// Athletics (his link page; he's in Legion's athlete program) → Hydrate and Pulse, Hayden's "hydration and energy".
// PLACEHOLDER picks until Gage says which products he uses and his deals let him show (data-pick="placeholder").
// Words: the heading is the disclosure itself; the line under it is his own (his FAQ: "Every plan comes with … supplement
// recommendations"; his Supplement Guidance card: "Your stack grows over time as it makes sense for where you are.");
// what each product is comes from the brand's own page, no claims about results.
// CODES: off by default (brief.json's open question: they undercut the client-only discounts he sells). opts.showCodes
// shows his code and 15% under each product and sends the link through his referral link (rel="sponsored"); the
// disclosure then adds the commission line. FTC: the disclosure line is always on while a sponsor is shown.
//
// mountProducts(host, opts) → { el, viewer, reveal(), pause(), resume(), close(), destroy(), setShowCodes(on) }
//   opts: { showCodes: false, products: PRODUCTS, inTunnel: false, autoplay: true, dprCap: 1.5, onLink(product, event) }
//   reveal()   the heading's line reveal + the products rise in (the tunnel calls it as you arrive)
//   pause() / resume()   the canvas stops / starts (the tunnel calls these as the section hides / shows)
//   close()    lets go of any drag or hover (the tunnel calls it as you leave the stop)
// The section is 150u x 72u (--u comes from the page; phones stack the three as rows). Sizes come from layout boxes (it
// sits inside the tunnel's CSS-3D-scaled layer).
import { createFloatViewer } from '../../../js/vendor/float-viewer.js?v=20261030a';
import { ensureCss, el, lineReveal, reduce } from './common.js?v=20261030e';

const IMG = name => new URL(`../../../images/products/${name}`, import.meta.url).href;

export const PRODUCTS = [
  {
    key: 'lineage-protein-bar',
    brand: 'Lineage Provisions',
    name: 'Protein Bar',
    what: 'Real-food protein bar, 20g grass-fed protein',
    image: IMG('lineage-protein-bar-chocolate.png'),
    alt: 'The Lineage Protein Bar, Chocolate: a black wrapper with LINEAGE in white and an orange 20g tab',
    url: 'https://lineageprovisions.com/products/lineage-bar-chocolate',
    code: 'GAGE10',
    discount: '15% off',
    codeUrl: 'https://lineageprovisions.com/GAGE10'
  },
  {
    key: 'legion-hydrate',
    brand: 'Legion Athletics',
    name: 'Hydrate',
    what: 'Electrolyte drink mix, naturally sweetened and sugar-free',
    image: IMG('legion-hydrate-lemon-lime.png'),
    alt: 'Legion Hydrate electrolyte powder, Lemon Lime: a black and coral bag with a stick pack',
    url: 'https://legionathletics.com/products/supplements/electrolyte-powder/',
    code: 'GageR',
    discount: '15% off',
    codeUrl: 'https://legionathletics.rfrl.co/qmjr3'
  },
  {
    key: 'legion-pulse',
    brand: 'Legion Athletics',
    name: 'Pulse',
    what: 'Pre-workout, naturally sweetened and flavored',
    image: IMG('legion-pulse-blue-raspberry.png'),
    alt: 'Legion Pulse pre-workout, Blue Raspberry: a black tub with a coral label',
    url: 'https://legionathletics.com/products/supplements/pulse-pre-workout/',
    code: 'GageR',
    discount: '15% off',
    codeUrl: 'https://legionathletics.rfrl.co/qmjr3'
  }
];

const COPY = {
  k: ['Fuel', 'Sponsors'],
  title: 'Brands I’m sponsored by',
  lede: 'Every plan comes with supplement recommendations. Your stack grows over time as it makes sense for where you are.',
  hint: 'Drag one to spin it.',
  link: 'Official page',
  codeLink: 'Shop with my code',
  code: 'Code',
  commission: 'If you use my codes, I may earn a commission.'
};

// products.css, linked once (sections.css, via ensureCss, carries the shared .gs type)
const CSS = new URL('./products.css?v=20261030a', import.meta.url);
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

// showing, as far as CSS goes (the tunnel hides a section it has flown past with visibility: hidden)
const shown = node => {
  if (!node.isConnected) return false;
  if (node.checkVisibility) return node.checkVisibility({ visibilityProperty: true, checkVisibilityCSS: true });
  return getComputedStyle(node).visibility !== 'hidden';
};

const brandList = names => {
  const list = [...new Set(names)];
  return list.length > 1 ? `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}` : list[0] || '';
};

export function mountProducts(host, opts = {}) {
  const o = { showCodes: false, products: PRODUCTS, inTunnel: false, autoplay: true, dprCap: 1.5, onLink: null, ...opts };
  const products = o.products;
  const sharedCss = ensureCss();
  const ownCss = linkCss();

  const root = el('section', 'gs gs-products');
  root.setAttribute('aria-label', COPY.title);
  root.dataset.pick = 'placeholder'; // the three products are placeholder picks until Gage confirms them
  const inner = el('div', 'pr-inner');

  // ---- the heading (it is the disclosure, in plain sight) and his line ----
  const head = el('header', 'pr-head');
  const titleBox = el('div', 'pr-title');
  const k = el('p', 'gs-k');
  k.append(el('span', '', COPY.k[0]), el('span', 'gs-k-dot', '·'), el('span', '', COPY.k[1]));
  const h = el('h3', 'gs-h', COPY.title);
  titleBox.append(k, h);
  const side = el('div', 'pr-side');
  const lede = el('p', 'gs-p pr-lede', COPY.lede);
  const hint = el('p', 'pr-hint', COPY.hint);
  side.append(lede, hint);
  head.append(titleBox, side);

  // ---- the row: one stage (the 3D box) and one caption per product; the canvas covers the row ----
  const row = el('div', 'pr-row');
  row.setAttribute('role', 'list');
  const bays = new Map();
  for (const p of products) {
    const bay = el('article', 'pr-bay');
    bay.setAttribute('role', 'listitem');
    bay.dataset.product = p.key;
    const stage = el('div', 'pr-stage');
    stage.setAttribute('role', 'img');
    stage.setAttribute('aria-label', p.alt);
    // the brand's own picture, shown until the 3D card is ready (and kept if WebGL isn't there)
    const still = el('img', 'pr-still');
    Object.assign(still, { src: p.image, alt: '', decoding: 'async', draggable: false });
    stage.appendChild(still);
    const cap = el('div', 'pr-cap');
    const brand = el('p', 'pr-brand', p.brand);
    const name = el('h4', 'pr-name', p.name);
    const what = el('p', 'pr-what', p.what);
    const links = el('p', 'pr-links');
    const a = el('a', 'pr-link');
    a.target = '_blank';
    const label = el('span', '', COPY.link);
    const arrow = el('span', 'pr-arrow', '↗');
    arrow.setAttribute('aria-hidden', 'true');
    a.append(label, arrow);
    a.addEventListener('click', event => o.onLink?.(p, event));
    const code = el('span', 'pr-code');
    links.append(a, code);
    cap.append(brand, name, what, links);
    bay.append(stage, cap);
    row.appendChild(bay);
    bays.set(p.key, { bay, stage, a, label, code, product: p });
  }

  // ---- the disclosure line, always there while a sponsor is shown ----
  const foot = el('p', 'pr-foot');
  inner.append(head, row, foot);
  root.appendChild(inner);
  host.appendChild(root);

  let codesOn = false;
  function setShowCodes(on) {
    codesOn = !!on;
    root.dataset.codes = codesOn ? 'on' : 'off';
    for (const { a, label, code, product: p } of bays.values()) {
      const withCode = codesOn && p.code && p.codeUrl;
      a.href = withCode ? p.codeUrl : p.url;
      a.rel = withCode ? 'sponsored noopener' : 'noopener';
      label.textContent = withCode ? COPY.codeLink : COPY.link;
      a.setAttribute('aria-label', `${p.brand} ${p.name}: ${label.textContent} (opens in a new tab)`);
      code.replaceChildren();
      code.hidden = !withCode;
      if (withCode) {
        code.append(el('span', 'pr-code-k', COPY.code), el('b', '', p.code));
        if (p.discount) code.append(el('span', 'pr-code-off', `· ${p.discount}`));
      }
    }
    const brands = brandList(products.map(p => p.brand));
    foot.textContent = `Disclosure: ${brands} sponsor me.${codesOn ? ` ${COPY.commission}` : ''}`;
  }
  setShowCodes(o.showCodes);

  // ---- the 3D: one Float Viewer over the row ----
  const viewer = createFloatViewer(row, {
    environment: 'tunnel', // the room's navy with its blue strip lights, so the cards pick up the tunnel as they turn
    environmentIntensity: 1,
    lights: [
      { type: 'directional', color: '#0687FF', intensity: 2.4, position: [-4, -2.5, -4] }, // a blue rim from behind, low left
      { type: 'directional', color: '#5CB2FF', intensity: 1.2, position: [4, 2, -3] }
    ],
    turntable: true, // they spin upright, like a product on a turntable
    zoom: false, // the wheel belongs to the tunnel
    fit: 1,
    startAngle: -20,
    faceOnHover: true,
    faceAngle: 0,
    dprCap: o.dprCap,
    items: products.map(p => ({ key: p.key, slot: bays.get(p.key).stage, shape: 'card', image: p.image, alt: p.alt })),
    onItemReady: key => {
      const b = bays.get(key);
      if (b) b.bay.dataset.ready = '';
    },
    onActive: key => {
      for (const [k2, b] of bays) b.bay.classList.toggle('is-active', k2 === key);
    },
    onError: (error, key) => {
      if (key && bays.get(key)) bays.get(key).bay.dataset.failed = '';
    }
  });
  if (viewer.failed) root.dataset.flat = ''; // no WebGL: the brands' pictures stay, still
  Promise.all([sharedCss, ownCss]).then(() => requestAnimationFrame(() => viewer.refresh()));

  let cancelReveal = () => {};
  let revealing = false;
  function reveal() {
    if (revealing || !shown(root)) return;
    cancelReveal();
    revealing = true;
    cancelReveal = lineReveal([h, lede], {
      onDone: () => {
        revealing = false;
      }
    });
    if (!reduce()) viewer.intro({ stagger: 0.12 });
  }

  // a plain page (no tunnel to call reveal()): the first time the row is properly on screen, reveal it
  let seen = null;
  if (o.autoplay && !o.inTunnel && 'IntersectionObserver' in window) {
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
    seen.observe(row);
  }

  return {
    el: root,
    viewer,
    products,
    reveal,
    pause() {
      viewer.pause();
    },
    resume() {
      viewer.resume();
    },
    close() {
      viewer.settle();
    },
    setShowCodes,
    get showCodes() {
      return codesOn;
    },
    destroy() {
      cancelReveal();
      seen?.disconnect();
      viewer.destroy();
      root.remove();
    }
  };
}

export default mountProducts;
