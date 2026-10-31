// Comet Dial, React Bits (reactbits.dev/micro/comet-dial), MIT + Commons Clause.
// Plain-JS port 2026-10-29 for a dial the PAGE drives (no dragging): createCometDial(el, opts) → { set(value), get(), destroy() }.
// The constants, the arc math and the paint loop (lit arc, head, the K-segment comet) are the original source, unchanged.
// motion's spring is replaced by the same physics (stiffness k, damping crit·(1−bounce), mass 1), integrated in small steps.
const R = 80;
const K = 12;
const V_FULL = 4;
const TAU_V = 0.05;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const decimalsOf = step => {
  const s = String(step);
  const i = s.indexOf('.');
  return i === -1 ? 0 : s.length - i - 1;
};
const pointAt = deg => {
  const a = (deg * Math.PI) / 180;
  return [100 + Math.cos(a) * R, 100 + Math.sin(a) * R];
};
const arcPath = (a0, a1) => {
  const [x0, y0] = pointAt(a0);
  const [x1, y1] = pointAt(a1);
  return `M ${x0.toFixed(3)} ${y0.toFixed(3)} A ${R} ${R} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(3)} ${y1.toFixed(3)}`;
};

export function createCometDial(host, opts = {}) {
  const o = { value: 0, min: 0, max: 100, step: 1, unit: '%', label: 'Level', accent: '#f5f5f5', ink: '#fdfdfd', size: 250,
    sweep: 320, thickness: 5, speed: 25, tapBounce: 0.2, cometReach: 180, cometWidth: 12, ...opts };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const { min, max, step, sweep, thickness, cometReach, cometWidth, unit } = o;
  const range = Math.max(1e-9, max - min);
  const gap = 360 - sweep;
  const start = 90 + gap / 2;
  const end = start + sweep;
  const decimals = decimalsOf(step);
  const k = 200 + (clamp(o.speed, 0, 100) / 100) * 700;
  const crit = 2 * Math.sqrt(k);
  const snap = v => (step > 0 ? clamp(Math.round((v - min) / step) * step + min, min, max) : clamp(v, min, max));

  const NS = 'http://www.w3.org/2000/svg';
  const root = document.createElement('div');
  root.className = 'comet-dial';
  root.style.setProperty('--cd-accent', o.accent);
  root.style.setProperty('--cd-ink', o.ink);
  root.style.setProperty('--cd-size', `${o.size}px`);
  root.style.setProperty('--cd-figure', `${Math.round(o.size * 0.16)}px`);
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'comet-dial__ring'); svg.setAttribute('viewBox', '0 0 200 200'); svg.setAttribute('role', 'meter');
  svg.setAttribute('aria-label', o.label); svg.setAttribute('aria-valuemin', min); svg.setAttribute('aria-valuemax', max);
  const mk = (cls, extra = {}) => { const p = document.createElementNS(NS, 'path'); if (cls) p.setAttribute('class', cls); for (const [a, v] of Object.entries(extra)) p.setAttribute(a, v); return p; };
  svg.appendChild(mk('comet-dial__track', { d: arcPath(start, end), 'stroke-width': thickness }));
  const lit = mk('comet-dial__lit', { 'stroke-width': thickness }); svg.appendChild(lit);
  const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'comet-dial__comet'); svg.appendChild(g);
  const comet = Array.from({ length: K }, () => { const p = mk(null); p.style.opacity = 0; g.appendChild(p); return p; });
  const head = document.createElementNS(NS, 'circle'); head.setAttribute('class', 'comet-dial__head'); head.setAttribute('r', thickness * 1.8); svg.appendChild(head);
  const readout = document.createElement('div'); readout.className = 'comet-dial__readout'; readout.setAttribute('aria-hidden', 'true');
  readout.innerHTML = `<span class="comet-dial__value"><span class="comet-dial__figure"></span>${unit ? `<span class="comet-dial__unit">${unit}</span>` : ''}</span>`;
  const figure = readout.querySelector('.comet-dial__figure');
  root.append(svg, readout); host.appendChild(root);

  // the reading (what's drawn) springs toward the target
  const sp = { x: snap(o.value), v: 0, to: snap(o.value), bounce: o.tapBounce };
  const L = { raf: 0, last: 0, v: 0, rPrev: null, text: '' };
  const animating = () => Math.abs(sp.to - sp.x) > 1e-3 || Math.abs(sp.v) > 1e-3;
  function stepSpring(dt) {
    const c = crit * (1 - clamp(sp.bounce, 0, 0.9));
    const n = Math.max(1, Math.ceil(dt / (1 / 240))), h = dt / n;
    for (let i = 0; i < n; i++) { const a = -k * (sp.x - sp.to) - c * sp.v; sp.v += a * h; sp.x += sp.v * h; }
    if (!animating()) { sp.x = sp.to; sp.v = 0; }
  }
  function paint(now) {   // original paint, with the spring stepped here
    const dt = clamp((now - L.last) / 1000, 0, 0.05);
    L.last = now;
    if (reduce) { sp.x = sp.to; sp.v = 0; } else stepSpring(dt);
    const r = sp.x;
    const vRaw = L.rPrev == null || dt === 0 || reduce ? 0 : (r - L.rPrev) / dt / range;
    L.rPrev = r;
    L.v += (vRaw - L.v) * (1 - Math.exp(-dt / TAU_V));
    const v = L.v;
    const s = clamp(Math.abs(v) / V_FULL, 0, 1);
    const dir = Math.sign(v) || 1;
    const f = clamp((r - min) / range, 0, 1);
    const ang = start + f * sweep;
    lit.setAttribute('d', f > 0.0005 ? arcPath(start, ang) : '');
    const [cx, cy] = pointAt(ang);
    head.setAttribute('cx', cx.toFixed(3)); head.setAttribute('cy', cy.toFixed(3));
    const seg = (cometReach * s) / K;
    for (let j = 0; j < K; j++) {
      const el = comet[j];
      let a0 = dir > 0 ? ang - (j + 1) * seg : ang + j * seg;
      let a1 = dir > 0 ? ang - j * seg : ang + (j + 1) * seg;
      a0 = clamp(a0, start, end);
      a1 = clamp(a1, start, end);
      if (seg < 0.01 || a1 - a0 < 0.01) { if (el.style.opacity !== '0') el.style.opacity = '0'; continue; }
      const w = 1 - j / K;
      el.setAttribute('d', arcPath(a0, a1));
      el.setAttribute('stroke-width', (thickness + cometWidth * w * s).toFixed(2));
      el.style.opacity = (w * s).toFixed(3);
    }
    const shown = clamp(r, min, max).toFixed(decimals);
    if (shown !== L.text) { L.text = shown; figure.textContent = shown; svg.setAttribute('aria-valuenow', shown); svg.setAttribute('aria-valuetext', `${snap(sp.to)}${unit}`); }
    const moving = animating() || Math.abs(v) > 0.002;
    if (!moving) for (const el of comet) if (el.style.opacity !== '0') el.style.opacity = '0';
    L.raf = moving ? requestAnimationFrame(paint) : 0;
  }
  function wake() { if (L.raf) return; L.last = performance.now(); L.rPrev = null; L.raf = requestAnimationFrame(paint); }
  L.last = performance.now(); paint(performance.now());
  return {
    set(value, bounce = o.tapBounce) { sp.to = snap(value); sp.bounce = bounce; wake(); },
    get: () => sp.to,
    el: root,
    destroy() { cancelAnimationFrame(L.raf); root.remove(); }
  };
}
