// Shared bits for the Gage hollow-site sections 9-11 (apply, book, faq). 2026-10-29.
export const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// sections.css (which @imports the four ports' CSS) is linked once, unless the page already links it. Resolves when the
// sheet and its @imports have loaded, so the gadgets can measure again (they are built right away, before it arrives).
const CSS_VERSION = '20261030e';
let cssReady = null;
export function ensureCss() {
  if (cssReady) return cssReady;
  const href = new URL(`./sections.css?v=${CSS_VERSION}`, import.meta.url);
  const link = [...document.querySelectorAll('link[rel="stylesheet"]')].find(node => {
    try {
      return new URL(node.href, location.href).pathname === href.pathname;
    } catch {
      return false;
    }
  });
  const loaded = node => {
    try {
      return !!node.sheet && node.sheet.cssRules.length >= 0;
    } catch {
      return !!node.sheet;
    }
  };
  if (link && loaded(link)) return (cssReady = Promise.resolve());
  const node = link || Object.assign(document.createElement('link'), { rel: 'stylesheet', href: href.href });
  cssReady = new Promise(resolve => {
    node.addEventListener('load', () => resolve(), { once: true });
    node.addEventListener('error', () => resolve(), { once: true });
  });
  if (!link) document.head.appendChild(node);
  return cssReady;
}

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

// Pegassi's line reveal, the site's text entrance: every line slides up out of its own mask, 1.75 s expo.out, 0.1 s apart.
// Without GSAP + SplitText (or with reduced motion) the text just shows. Returns a cancel function.
export function lineReveal(targets, { delay = 0, onDone } = {}) {
  const list = (Array.isArray(targets) ? targets : [targets]).filter(Boolean);
  const gsap = window.gsap;
  const SplitText = window.SplitText;
  if (!list.length || reduce() || !gsap || !SplitText) {
    onDone?.();
    return () => {};
  }
  let split = SplitText.create(list, { type: 'lines', mask: 'lines' });
  split.lines.forEach(line => {
    line.style.paddingBlock = '.5em';
  });
  (split.masks || []).forEach(mask => {
    mask.style.marginBlock = '-.5em';
  });
  gsap.set(split.lines, { yPercent: 100 });
  let tween = gsap.to(split.lines, {
    yPercent: 0,
    duration: 1.75,
    ease: 'expo.out',
    stagger: 0.1,
    delay,
    onComplete: () => {
      if (split) split.revert();
      split = null;
      tween = null;
      onDone?.();
    }
  });
  return () => {
    if (tween) tween.kill();
    if (split) split.revert();
    tween = null;
    split = null;
  };
}

// Hugeicons (MIT) paths used by the sections, drawn the way <HugeiconsIcon> draws them
const PATHS = {
  ArrowDown01Icon: ['M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9'],
  Tick02Icon: ['M5 14L8.5 17.5L19 6.5']
};
export function icon(name, strokeWidth = 1.8) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', strokeWidth);
  svg.setAttribute('aria-hidden', 'true');
  for (const d of PATHS[name] || []) {
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);
  }
  return svg;
}

// true once the element is on screen, rendered, and drawn at least `scale` of its layout size (close enough to read)
export function closeEnough(node, scale = 0.6) {
  if (!node.isConnected) return false;
  if (node.checkVisibility && !node.checkVisibility({ visibilityProperty: true, opacityProperty: false })) return false;
  const r = node.getBoundingClientRect();
  if (!r.width || r.right < 0 || r.bottom < 0 || r.left > innerWidth || r.top > innerHeight) return false;
  return r.width >= node.offsetWidth * scale;
}
