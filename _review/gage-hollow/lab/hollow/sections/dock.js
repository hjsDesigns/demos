// The section dock — React Bits "Dock" (reactbits.dev/components/dock, MIT + Commons Clause) crossed with React Bits "Gooey Nav"
// (reactbits.dev/components/gooey-nav), ported to plain JS on 2026-11-01 for Gage Rogel (Hayden: "Mix Gooey Nav and Dock, and put it
// in the bottom of Gage's site, and then put it for each section, but make sure it fits").
//
// From the Dock, unchanged: the macOS magnification — the pointer's x against each item's centre, mapped over ±distance to
// baseItemSize…magnification…baseItemSize, eased by a spring (mass 0.1, stiffness 150, damping 12), the panel that grows while
// hovered, the label that lifts 10 px in 0.2 s above the hovered item. From Gooey Nav, unchanged: the "effect" pair — a filter
// layer (blur 7px, contrast 100, lighten; a black field inset -75px so the goo has something to melt into) that bursts
// particleCount 15 points from the pill along noisy angles (particleDistances [90, 10], particleR 100, animationTime 600,
// timeVariance 300, colors 1·2·3·1·2·3·1·4) and a pill that scales in 0.3 s under the active item. Here the pill sits under the
// section's ICON instead of a word, the burst fires when the active section changes (a tap, or the camera arriving by scroll),
// and the colours are the room's blues. One item per section; sized to fit a phone in a row (see dock.css).
//
// mountDock(host, { items: [{ label, icon }], onPick(index), spring, magnification, distance, baseItemSize }) →
//   { el, setActive(index, { burst = true } = {}), destroy() }
import { el } from './common.js?v=20261030e';

const ICONS = {   // lucide (ISC), 24-box strokes
  goal: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  coach: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  results: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  story: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  method: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  plans: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
  apply: '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
  book: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  sponsors: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>'
};
const svgIcon = name => {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor');
  s.setAttribute('stroke-width', '1.8'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round');
  s.setAttribute('aria-hidden', 'true'); s.innerHTML = ICONS[name] || ICONS.goal; return s;
};

let cssLink = null;
function linkCss() {
  if (cssLink) return;
  cssLink = document.createElement('link'); cssLink.rel = 'stylesheet';
  cssLink.href = new URL('./dock.css?v=20261101e', import.meta.url).href;
  document.head.appendChild(cssLink);
}

// Motion's spring, solved per frame (the Dock's useSpring: mass 0.1, stiffness 150, damping 12)
function spring(value, target, state, s, dt, lo, hi) {   // semi-implicit Euler in 1/480 s sub-steps: stable at any frame rate
  const k = s.stiffness, c = s.damping, m = s.mass;
  const n = Math.max(1, Math.ceil(dt / (1 / 480))), h = dt / n;
  let x = value;
  for (let i = 0; i < n; i++) { state.v += ((-k * (x - target) - c * state.v) / m) * h; x += state.v * h; }
  if (x < lo) { x = lo; state.v = 0; } else if (x > hi) { x = hi; state.v = 0; }   // never past the two sizes
  return x;
}
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function mountDock(host, opts = {}) {
  linkCss();
  const o = {
    items: [], onPick: null,
    spring: { mass: 0.1, stiffness: 150, damping: 12 }, magnification: 64, distance: 160, baseItemSize: 44, panelHeight: 58,
    // Gooey Nav
    animationTime: 600, particleCount: 15, particleDistances: [90, 10], particleR: 100, timeVariance: 300, colors: [1, 2, 3, 1, 2, 3, 1, 4],
    ...opts
  };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const outer = el('div', 'gdock');
  outer.setAttribute('role', 'toolbar'); outer.setAttribute('aria-label', 'Sections');
  const panel = el('div', 'gdock-panel');
  const fx = el('span', 'gdock-effect gdock-filter'); fx.setAttribute('aria-hidden', 'true');
  const pill = el('span', 'gdock-effect gdock-pill'); pill.setAttribute('aria-hidden', 'true');
  panel.append(fx, pill);
  const items = o.items.map((it, i) => {
    const b = el('button', 'gdock-item'); b.type = 'button';
    b.setAttribute('aria-label', it.label);
    const ic = el('span', 'gdock-icon'); ic.appendChild(svgIcon(it.icon));
    const lab = el('span', 'gdock-label', it.label);
    b.append(ic, lab);
    b.addEventListener('click', () => { setActive(i, { burst: true }); o.onPick && o.onPick(i); }, { passive: true });
    panel.appendChild(b);
    return { el: b, size: o.baseItemSize, state: { v: 0 }, target: o.baseItemSize };
  });
  outer.appendChild(panel);
  host.appendChild(outer);
  requestAnimationFrame(() => requestAnimationFrame(() => outer.classList.add('is-in')));   // rises in on load

  // the Dock's magnification: pointer x against each item's centre
  let mouseX = Infinity, hovered = false, raf = 0, last = 0;
  const tick = now => {
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
    let moving = false;
    for (const it of items) {
      let target = o.baseItemSize;
      if (mouseX !== Infinity) {
        const r = it.el.getBoundingClientRect();
        const d = mouseX - (r.left + r.width / 2);
        const t = clamp(Math.abs(d) / o.distance, 0, 1);
        target = o.baseItemSize + (o.magnification - o.baseItemSize) * (1 - t);
      }
      const next = reduce ? target : spring(it.size, target, it.state, o.spring, dt, Math.min(o.baseItemSize, o.magnification), Math.max(o.baseItemSize, o.magnification));
      if (Math.abs(next - it.size) > 0.05 || Math.abs(it.state.v) > 0.5) moving = true;
      it.size = next;
      it.el.style.width = it.el.style.height = it.size.toFixed(2) + 'px';
    }
    placeEffect(false);
    raf = moving || hovered ? requestAnimationFrame(tick) : 0;
    if (!raf) last = 0;
  };
  const wake = () => { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } };
  panel.addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; hovered = true; mouseX = e.clientX; outer.classList.add('is-hover'); wake(); });
  panel.addEventListener('pointerleave', () => { hovered = false; mouseX = Infinity; outer.classList.remove('is-hover'); wake(); });

  // Gooey Nav's effect: the pill and the filter sit exactly on the active item
  let active = -1;
  function placeEffect(force) {
    if (active < 0) return;
    const r = items[active].el.getBoundingClientRect(), pr = panel.getBoundingClientRect();
    const st = { left: (r.left - pr.left) + 'px', top: (r.top - pr.top) + 'px', width: r.width + 'px', height: r.height + 'px' };
    Object.assign(fx.style, st); Object.assign(pill.style, st);
  }
  const noise = n => n / 2 - Math.random() * n;
  const getXY = (distance, pointIndex, totalPoints) => { const angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180); return [distance * Math.cos(angle), distance * Math.sin(angle)]; };
  const createParticle = (i, t, d, r) => {
    const rotate = noise(r / 10);
    return { start: getXY(d[0], o.particleCount - i, o.particleCount), end: getXY(d[1] + noise(7), o.particleCount - i, o.particleCount), time: t, scale: 1 + noise(0.2), color: o.colors[Math.floor(Math.random() * o.colors.length)], rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10 };
  };
  const timers = new Set();
  function makeParticles(element) {
    const d = o.particleDistances, r = o.particleR, bubbleTime = o.animationTime * 2 + o.timeVariance;
    element.style.setProperty('--time', `${bubbleTime}ms`);
    for (let i = 0; i < o.particleCount; i++) {
      const t = o.animationTime * 2 + noise(o.timeVariance * 2);
      const p = createParticle(i, t, d, r);
      element.classList.remove('active');
      const t1 = setTimeout(() => {
        const particle = document.createElement('span'), point = document.createElement('span');
        particle.classList.add('gdock-particle');
        particle.style.setProperty('--start-x', `${p.start[0]}px`); particle.style.setProperty('--start-y', `${p.start[1]}px`);
        particle.style.setProperty('--end-x', `${p.end[0]}px`); particle.style.setProperty('--end-y', `${p.end[1]}px`);
        particle.style.setProperty('--time', `${p.time}ms`); particle.style.setProperty('--scale', `${p.scale}`);
        particle.style.setProperty('--color', `var(--color-${p.color}, white)`); particle.style.setProperty('--rotate', `${p.rotate}deg`);
        point.classList.add('gdock-point'); particle.appendChild(point); element.appendChild(particle);
        requestAnimationFrame(() => element.classList.add('active'));
        const t2 = setTimeout(() => { try { element.removeChild(particle); } catch {} timers.delete(t2); }, p.time);
        timers.add(t2); timers.delete(t1);
      }, 30);
      timers.add(t1);
    }
  }
  function setActive(i, { burst = true } = {}) {
    if (i === active || i < 0 || i >= items.length) return;
    items.forEach((it, j) => it.el.classList.toggle('active', j === i));
    active = i;
    placeEffect(true);
    if (burst && !reduce) {
      fx.querySelectorAll('.gdock-particle').forEach(p => p.remove());
      pill.classList.remove('active'); void pill.offsetWidth; pill.classList.add('active');
      makeParticles(fx);
    } else { pill.classList.add('active'); }
  }
  const onResize = () => placeEffect(true);
  addEventListener('resize', onResize);
  wake();

  return {
    el: outer,
    setActive,
    destroy() { cancelAnimationFrame(raf); timers.forEach(clearTimeout); removeEventListener('resize', onResize); outer.remove(); }
  };
}
export default mountDock;
