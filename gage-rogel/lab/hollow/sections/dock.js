// The section dock — React Bits "Dock" (reactbits.dev/components/dock, MIT + Commons Clause), ported to plain JS for Gage Rogel on
// 2026-11-01 (Hayden: "put it in the bottom of Gage's site… for each section"). It began as Dock × Gooey Nav; Hayden pulled the goo
// the same night ("it only makes it more of a hassle and it doesn't even look that good") and the magnification ("it should be
// like even"), so what remains of the Dock is its panel, its items and the label that lifts 10 px in 0.2 s above the hovered item;
// the active section is a plain blue highlight that slides between items (CSS transition). The spring code stays for a site that
// wants the magnification back (magnification > baseItemSize turns it on; solved in 1/480 s sub-steps so it never blows up).
//
// mountDock(host, { items: [{ label, icon }], onPick(index), spring, magnification, distance, baseItemSize }) →
//   { el, setActive(index), destroy() }
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
  cssLink.href = new URL('./dock.css?v=20261101h', import.meta.url).href;
  document.head.appendChild(cssLink);
}

// Motion's spring (mass 0.1, stiffness 150, damping 12), semi-implicit Euler in 1/480 s sub-steps: stable at any frame rate
function spring(value, target, state, s, dt, lo, hi) {
  const k = s.stiffness, c = s.damping, m = s.mass;
  const n = Math.max(1, Math.ceil(dt / (1 / 480))), h = dt / n;
  let x = value;
  for (let i = 0; i < n; i++) { state.v += ((-k * (x - target) - c * state.v) / m) * h; x += state.v * h; }
  if (x < lo) { x = lo; state.v = 0; } else if (x > hi) { x = hi; state.v = 0; }
  return x;
}
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function mountDock(host, opts = {}) {
  linkCss();
  const o = { items: [], onPick: null, spring: { mass: 0.1, stiffness: 150, damping: 12 }, magnification: 44, distance: 160, baseItemSize: 44, ...opts };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const magnifies = o.magnification !== o.baseItemSize;

  const outer = el('div', 'gdock');
  outer.setAttribute('role', 'toolbar'); outer.setAttribute('aria-label', 'Sections');
  const panel = el('div', 'gdock-panel');
  const pill = el('span', 'gdock-pill'); pill.setAttribute('aria-hidden', 'true');
  panel.appendChild(pill);
  const items = o.items.map((it, i) => {
    const b = el('button', 'gdock-item'); b.type = 'button';
    b.setAttribute('aria-label', it.label);
    const ic = el('span', 'gdock-icon'); ic.appendChild(svgIcon(it.icon));
    const lab = el('span', 'gdock-label', it.label);
    b.append(ic, lab);
    b.addEventListener('click', () => { setActive(i); o.onPick && o.onPick(i); }, { passive: true });
    panel.appendChild(b);
    return { el: b, size: o.baseItemSize, state: { v: 0 } };
  });
  outer.appendChild(panel);
  host.appendChild(outer);
  requestAnimationFrame(() => requestAnimationFrame(() => outer.classList.add('is-in')));   // rises in

  // the Dock's magnification (off on Gage: magnification === baseItemSize keeps every item the same size)
  let mouseX = Infinity, hovered = false, raf = 0, last = 0;
  const tick = now => {
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
    let moving = false;
    for (const it of items) {
      let target = o.baseItemSize;
      if (mouseX !== Infinity) {
        const r = it.el.getBoundingClientRect();
        const t = clamp(Math.abs(mouseX - (r.left + r.width / 2)) / o.distance, 0, 1);
        target = o.baseItemSize + (o.magnification - o.baseItemSize) * (1 - t);
      }
      const next = reduce ? target : spring(it.size, target, it.state, o.spring, dt, Math.min(o.baseItemSize, o.magnification), Math.max(o.baseItemSize, o.magnification));
      if (Math.abs(next - it.size) > 0.05 || Math.abs(it.state.v) > 0.5) moving = true;
      it.size = next;
      it.el.style.width = it.el.style.height = it.size.toFixed(2) + 'px';
    }
    placePill();
    raf = moving || hovered ? requestAnimationFrame(tick) : 0;
    if (!raf) last = 0;
  };
  const wake = () => { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } };
  if (magnifies) {
    panel.addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; hovered = true; mouseX = e.clientX; wake(); });
    panel.addEventListener('pointerleave', () => { hovered = false; mouseX = Infinity; wake(); });
  }

  // the highlight sits exactly under the active item and slides when it changes (dock.css transition)
  let active = -1;
  function placePill() {
    if (active < 0) return;
    const r = items[active].el.getBoundingClientRect(), pr = panel.getBoundingClientRect();
    Object.assign(pill.style, { left: (r.left - pr.left) + 'px', top: (r.top - pr.top) + 'px', width: r.width + 'px', height: r.height + 'px' });
  }
  function setActive(i) {
    if (i === active || i < 0 || i >= items.length) return;
    items.forEach((it, j) => it.el.classList.toggle('active', j === i));
    active = i;
    placePill();
    pill.classList.add('active');
  }
  const onResize = () => placePill();
  addEventListener('resize', onResize);
  if (magnifies) wake(); else items.forEach(it => { it.el.style.width = it.el.style.height = o.baseItemSize + 'px'; });

  return { el: outer, setActive, destroy() { cancelAnimationFrame(raf); removeEventListener('resize', onResize); outer.remove(); } };
}
export default mountDock;
