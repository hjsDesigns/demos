// React Bits "Accordion Gallery" + "Flip Card" (DavidHDev/react-bits, MIT + Commons Clause), ported to plain JS and joined
// for Gage's site (Hayden 10/29: "combine the flip card and the accordion gallery… they click it and then it flips to the
// other side"). The gallery is the original: hovering opens a panel (one GSAP timeline, power3.out 0.6 s, expandRatio .52,
// ±8° tilt on the rest, parallax, grayscale + dim on the closed ones, the label's bar and text sliding in 0.06 s apart).
// Each panel is a Flip Card: click the open panel and it turns over on the card's own spring (stiffness 170, damping 20),
// with its pointer tilt (spring 240/24, mass .6), lift (1.03, spring 320/26), glare and shadow. Changes for one-tap use:
// no drag-to-flip, and an open card turns back over by itself when you move on to another panel. Added (Hayden 10/29):
// a resting state (defaultIndex -1) where every panel stays closed and even until the pointer is on one, and the
// gallery closes back to rest when the pointer leaves it (collapseOnLeave).
const TILT_SPRING = { stiffness: 240, damping: 24, mass: 0.6 };
const LIFT_SPRING = { stiffness: 320, damping: 26, mass: 1 };
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const snap = deg => Math.round(deg / 180) * 180;
const isBack = deg => Math.abs(Math.round(deg / 180)) % 2 === 1;

function makeSpring(value, cfg) { return { x: value, v: 0, to: value, k: cfg.stiffness, c: cfg.damping, m: cfg.mass || 1, rest: cfg.restDelta || 0.01 }; }
function stepSpring(s, dt) {   // a damped spring, integrated in small steps (what motion's spring animates)
  if (s.x === s.to && s.v === 0) return false;
  const n = Math.max(1, Math.ceil(dt / 0.004)), h = dt / n;
  for (let i = 0; i < n; i++) { const a = (-s.k * (s.x - s.to) - s.c * s.v) / s.m; s.v += a * h; s.x += s.v * h; }
  if (Math.abs(s.x - s.to) < s.rest && Math.abs(s.v) < s.rest * 10) { s.x = s.to; s.v = 0; return false; }
  return true;
}

export function createAccordionFlip(host, options = {}) {
  const o = Object.assign({
    items: [], defaultIndex: 2, accentColor: '#ffffff', overlayColor: '#060010', textColor: '#ffffff', gap: 10, radius: 16,
    expandRatio: 0.52, duration: 0.6, ease: 'power3.out', parallax: 0.5, tilt: 8, stagger: 0.06, grayscale: true,
    cardTilt: true, tiltMax: 12, glare: true, glareOpacity: 0.22, hoverScale: 1.03, perspective: 1100, stiffness: 170, damping: 20,
    // shadow off (Hayden 10/29): inside the gallery's 3D the card's floor shadow cut through a tilted card as a hard dark line
    background: '#27272a', color: '#f5f5f5', shadow: false, shadowColor: '#000000', shadowOpacity: 0.45, backHint: 'Tap to flip back',
    collapseOnLeave: false, restGray: 0, restDim: 0.12
  }, options);
  const gsap = window.gsap;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const count = o.items.length;
  let active = o.defaultIndex < 0 ? -1 : clamp(o.defaultIndex, 0, count - 1), tl = null, first = true, mediaSize = 320;

  host.classList.add('accordion-flip');
  Object.entries({ '--ag-accent': o.accentColor, '--ag-overlay': o.overlayColor, '--ag-text': o.textColor, '--ag-gap': o.gap + 'px', '--ag-radius': o.radius + 'px',
    '--fc-radius': o.radius + 'px', '--fc-bg': o.background, '--fc-ink': o.color, '--fc-shadow': o.shadowColor, '--fc-shadow-o': o.shadowOpacity, '--fc-glare': o.glareOpacity })
    .forEach(([k, v]) => host.style.setProperty(k, v));
  host.setAttribute('role', 'list');
  host.setAttribute('aria-label', o.label || 'Gallery');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  host.innerHTML = o.items.map((it, i) => `
    <div class="af-panel" role="listitem" tabindex="0" aria-label="${esc(it.label)}: tap to flip for details">
      ${o.shadow ? '<span class="af-shadow" aria-hidden="true"></span>' : ''}
      <div class="af-rotor">
        <div class="af-face af-face--front">
          <span class="ag-panel__frame">
            <span class="ag-panel__media"><img src="${esc(it.image)}" alt="${esc(it.alt || it.label)}" draggable="false"></span>
            <span class="ag-panel__overlay" aria-hidden="true"></span>
          </span>
          <span class="ag-panel__label" aria-hidden="true"><span class="ag-panel__bar"></span><span class="ag-panel__text">${esc(it.label)}</span></span>
          <span class="af-rest" aria-hidden="true">${esc(it.label)}</span>
          ${o.glare ? '<span class="af-glare" aria-hidden="true"></span>' : ''}
        </div>
        <div class="af-face af-face--back" aria-hidden="true" inert>
          <div class="af-back">
            ${it.tag ? `<p class="af-back__tag">${esc(it.tag)}</p>` : ''}
            <h4 class="af-back__title">${esc(it.title || it.label)}</h4>
            <p class="af-back__text">${esc(it.text || '')}</p>
            ${o.backHint ? `<span class="af-back__hint">${esc(o.backHint)}</span>` : ''}
          </div>
          ${o.glare ? '<span class="af-glare" aria-hidden="true"></span>' : ''}
        </div>
      </div>
    </div>`).join('');

  const panels = [...host.querySelectorAll('.af-panel')];
  const cards = panels.map(p => ({
    el: p, rotor: p.querySelector('.af-rotor'), shadow: p.querySelector('.af-shadow'),
    front: p.querySelector('.af-face--front'), back: p.querySelector('.af-face--back'),
    media: p.querySelector('.ag-panel__media'), bar: p.querySelector('.ag-panel__bar'), text: p.querySelector('.ag-panel__text'),
    turn: makeSpring(0, { stiffness: o.stiffness, damping: o.damping, restDelta: 0.05 }),
    tx: makeSpring(0, TILT_SPRING), ty: makeSpring(0, TILT_SPRING), lift: makeSpring(1, LIFT_SPRING), sheen: makeSpring(0, LIFT_SPRING),
    shown: false
  }));

  // ---- the gallery (the original's applyLayout)
  function applyLayout(animate) {
    const r = clamp(o.expandRatio, 0.2, 0.9), grow = count > 1 ? (r * (count - 1)) / (1 - r) : 1;
    tl && tl.kill();
    const dur = animate && !reduce ? o.duration : 0;
    tl = gsap.timeline();
    host.classList.toggle('af-has-active', active >= 0);
    if (active < 0) {   // at rest: every panel closed and even, in color, no tilt
      cards.forEach(c => {
        c.el.classList.remove('af-panel--active'); c.el.setAttribute('aria-current', 'false');
        tl.to(c.el, { flexGrow: 1, rotateY: 0, duration: dur, ease: o.ease }, 0);
        tl.to(c.media, { xPercent: -50, yPercent: -50, x: 0, y: 0, '--ag-gray': o.restGray, '--ag-dim': o.restDim, duration: dur, ease: o.ease }, 0);
        tl.to([c.bar, c.text], { opacity: 0, x: -14, duration: dur * 0.6, ease: o.ease }, 0);
      });
      return;
    }
    cards.forEach((c, i) => {
      const on = i === active, rot = on ? 0 : i < active ? o.tilt : -o.tilt;
      c.el.classList.toggle('af-panel--active', on);
      c.el.setAttribute('aria-current', on ? 'true' : 'false');
      tl.to(c.el, { flexGrow: on ? grow : 1, rotateY: rot, duration: dur, ease: o.ease }, 0);
      const drift = Math.max(-1.5, Math.min(1.5, active - i)), shift = drift * o.parallax * mediaSize * 0.06;
      tl.to(c.media, { xPercent: -50, yPercent: -50, x: on ? 0 : shift, y: 0, '--ag-gray': o.grayscale ? (on ? 0 : 1) : 0, '--ag-dim': on ? 0 : 0.35, duration: dur, ease: o.ease }, 0);
      if (on) tl.to([c.bar, c.text], { opacity: 1, x: 0, duration: dur, ease: o.ease, stagger: reduce ? 0 : o.stagger }, 0);
      else tl.to([c.bar, c.text], { opacity: 0, x: -14, duration: dur * 0.6, ease: o.ease }, 0);
    });
  }
  function measure() {   // layout size, not the on-screen size (it may sit inside a 3D-scaled section)
    const usable = Math.max(host.clientWidth - o.gap * (count - 1), 120);
    mediaSize = Math.max(140, usable * clamp(o.expandRatio, 0.2, 0.9) * 1.22);
    host.style.setProperty('--ag-media-size', mediaSize + 'px');
    applyLayout(!first);
    first = false;
  }
  const ro = new ResizeObserver(measure);
  ro.observe(host);
  measure();

  // ---- the flip cards (the original's springs and transform)
  let raf = 0, last = 0;
  function render(c) {
    const turn = c.turn.x;
    c.rotor.style.transform = `perspective(${o.perspective}px) scale(${c.lift.x.toFixed(4)}) rotateX(${c.tx.x.toFixed(3)}deg) rotateY(${(turn + c.ty.x).toFixed(3)}deg)`;
    c.rotor.style.setProperty('--fc-sheen', c.sheen.x.toFixed(3));
    if (c.shadow) { const f = Math.abs(Math.cos(turn * Math.PI / 180)); c.shadow.style.transform = `scaleX(${(0.08 + 0.92 * f).toFixed(3)})`; c.shadow.style.opacity = (0.1 + 0.9 * f * f).toFixed(3); }
  }
  function loop(t) {
    const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016); last = t;
    let moving = false;
    for (const c of cards) { let m = false; for (const s of [c.turn, c.tx, c.ty, c.lift, c.sheen]) m = stepSpring(s, dt) || m; if (m) render(c); moving = moving || m; }
    raf = moving ? requestAnimationFrame(loop) : 0;
    if (!raf) last = 0;
  }
  const wake = () => { if (!raf) { last = 0; raf = requestAnimationFrame(loop); } };
  function settle(c, to, instant) {
    c.turn.to = to;
    if (instant || reduce) { c.turn.x = to; c.turn.v = 0; render(c); } else wake();
    const next = isBack(to);
    if (next === c.shown) return;
    c.shown = next;
    c.el.classList.toggle('af-panel--flipped', next);
    c.front.toggleAttribute('inert', next); c.front.setAttribute('aria-hidden', String(next));
    c.back.toggleAttribute('inert', !next); c.back.setAttribute('aria-hidden', String(!next));
    if (reduce) c.el.dataset.fade = next ? 'back' : 'front';
  }
  const flip = (c, instant) => { const base = snap(c.turn.to); settle(c, isBack(base) ? base - 180 : base + 180, instant); };
  const rest = c => { c.tx.to = 0; c.ty.to = 0; c.sheen.to = 0; c.lift.to = 1; wake(); };
  function setActive(i) {
    if (i === active) return;
    cards.forEach((c, k) => { if (k !== i && c.shown) flip(c, false); });   // the open card turns back over as it closes
    active = i;
    applyLayout(true);
  }

  if (o.collapseOnLeave) {   // the pointer leaves the gallery: everything closes back to rest
    host.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch') setActive(-1); });
    host.addEventListener('focusout', e => { if (!host.contains(e.relatedTarget)) setActive(-1); });
  }
  cards.forEach((c, i) => {
    if (reduce) c.el.dataset.fade = 'front';
    c.el.addEventListener('pointerenter', e => { setActive(i); if (!reduce && e.pointerType !== 'touch') { c.lift.to = o.hoverScale; wake(); } });
    c.el.addEventListener('pointerleave', () => rest(c));
    c.el.addEventListener('pointermove', e => {
      if (!o.cardTilt || reduce || e.pointerType === 'touch' || i !== active) return;
      const r = c.el.getBoundingClientRect(), px = clamp((e.clientX - r.left) / r.width, 0, 1), py = clamp((e.clientY - r.top) / r.height, 0, 1);
      c.tx.to = (0.5 - py) * 2 * o.tiltMax; c.ty.to = (px - 0.5) * 2 * o.tiltMax; c.sheen.to = 1;
      c.rotor.style.setProperty('--fc-gx', (px * 100).toFixed(1) + '%'); c.rotor.style.setProperty('--fc-gy', (py * 100).toFixed(1) + '%');
      wake();
    });
    c.el.addEventListener('click', e => { if (i !== active) { setActive(i); return; } flip(c, e.detail === 0); });
    c.el.addEventListener('focus', () => setActive(i));
    c.el.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); panels[(i + 1) % count].focus(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); panels[(i - 1 + count) % count].focus(); }
      else if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); if (i === active) flip(c, true); }
    });
    render(c);
  });

  return {
    get active() { return active; },
    get flipped() { return cards.map(c => c.shown); },
    open(i) { setActive(i < 0 ? -1 : clamp(i, 0, count - 1)); },
    flip(i) { const c = cards[i]; if (!c) return; if (i !== active) setActive(i); flip(c, false); },
    closeAll() { cards.forEach(c => { if (c.shown) flip(c, false); }); },
    destroy() { ro.disconnect(); tl && tl.kill(); cancelAnimationFrame(raf); host.innerHTML = ''; }
  };
}
