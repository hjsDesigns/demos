// Kokonut UI "Scroll Index" (scroll-index.tsx, @dorianbaffier, MIT), ported to plain JS for Gage's site (2026-10-30).
// The original sits beside this file, unchanged. Kept exactly: the rail (280 px max), ticks placed at each section's scroll
// position (marked ahead / current / passed, one tab stop on the current one), the reader's head line riding the rail, the
// dock-like swell near the pointer (peak 1.6, reach 26 px, eased 0.35 a frame), the name tag that follows the pointer and
// flashes for 900 ms when you scroll into a new section, click a tick to jump (easeInOut, 300-650 ms), drag the rail to
// scrub, a flick that lands within 18 px of a tick settles on it, arrow keys between ticks, reduced motion jumps instantly.
// What is different (Gage's 3D tunnel has no headings to measure and is driven by Lenis):
//  - sections come in as data: [{ text, level, at }] where `at` is a scroll position, plus start/end of the scroll range;
//  - scroll is read/written through the page (getScroll / setScroll), so a jump moves Lenis and the camera follows;
//  - optional `count`: the name tag also says "3 of 9" (Hayden 10/30: "know where they are… and how far it's going to take");
//  - optional `side: 'left'`: the same rail mirrored onto the left edge (Hayden 10/30: "on the left side of the site").
// Colours come from CSS variables (see scroll-index.css), so a site uses its own palette.

const RAIL = 280;
const SWELL = 1.6;
const REACH = 26;
const SNAP = 18;
const FLASH = 900;

const easeInOut = t => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2);

function markTicks(ticks, active) {
  ticks.forEach((tick, i) => {
    if (!tick) return;
    let state = 'ahead';
    if (i === active) state = 'current';
    else if (i < active) state = 'passed';
    tick.dataset.state = state;
    tick.tabIndex = i === Math.max(active, 0) ? 0 : -1;
    if (i === active) tick.setAttribute('aria-current', 'location');
    else tick.removeAttribute('aria-current');
  });
}

export function createScrollIndex(host, opts = {}) {
  const o = {
    sections: [],                       // [{ text, level (2 or 3), at }]
    range: () => ({ start: 0, end: 1 }),
    getScroll: () => window.scrollY,
    setScroll: y => window.scrollTo(0, y),
    count: true,
    label: 'Sections',
    side: 'right',                      // added: 'left' mirrors the rail (ticks grow rightward, name tag on the right)
    ...opts
  };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const nav = document.createElement('nav');
  nav.className = 'si-nav' + (o.side === 'left' ? ' si-nav--left' : '');
  nav.setAttribute('aria-label', o.label);
  const rail = document.createElement('div');
  rail.className = 'si-rail';
  rail.style.height = RAIL + 'px';
  const head = document.createElement('span');
  head.className = 'si-head';
  head.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  label.className = 'si-label';
  label.setAttribute('aria-hidden', 'true');
  nav.append(rail);
  host.append(nav);

  let list = [];
  let ticks = [];
  let start = 0;
  let end = 1;
  let active = -1;
  let height = RAIL;
  let raf = 0;
  let tween = 0;
  let flashTimer = 0;
  let painted = false;
  let hover = null;
  let drag = null;
  const swell = [];

  const measure = () => {
    const r = o.range();
    start = r.start;
    end = Math.max(r.end, start + 1);
    list = o.sections.map(s => {
      const at = Math.min(Math.max(s.at, start), end);
      return { text: s.text, level: s.level || 2, at, pos: (at - start) / (end - start) };
    });
    height = rail.clientHeight || RAIL;
    rail.textContent = '';
    ticks = list.map((section, index) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'si-tick' + (section.level <= 2 ? ' si-tick--h2' : ' si-tick--h3');
      b.setAttribute('aria-label', section.text);
      b.dataset.state = 'ahead';
      b.tabIndex = index === 0 ? 0 : -1;
      b.style.top = (section.pos * 100).toFixed(3) + '%';
      b.innerHTML = '<span></span>';
      b.addEventListener('blur', () => label.style.setProperty('opacity', '0'));
      b.addEventListener('click', e => { if (e.detail === 0) api.jump(index); });   // pointer clicks are handled by the rail; this is the keyboard
      b.addEventListener('focus', () => api.show(index));
      b.addEventListener('keydown', e => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        e.preventDefault();
        const next = Math.min(Math.max(index + (e.key === 'ArrowDown' ? 1 : -1), 0), list.length - 1);
        ticks[next] && ticks[next].focus();
      });
      rail.append(b);
      return b;
    });
    rail.append(head, label);
    active = -1;
  };

  const fraction = () => Math.min(Math.max((o.getScroll() - start) / (end - start), 0), 1);

  const nearest = y => {
    let best = -1;
    let distance = Number.POSITIVE_INFINITY;
    list.forEach((s, i) => {
      const d = Math.abs(s.pos * height - y);
      if (d < distance) { distance = d; best = i; }
    });
    return { index: best, distance };
  };

  const placeLabel = (index, visible) => {
    const section = list[index];
    if (!section) { label.style.opacity = '0'; return; }
    const text = o.count ? `${section.text}<em>${index + 1} of ${list.length}</em>` : section.text;
    if (label.innerHTML !== text) label.innerHTML = text;
    label.style.transform = `translate3d(0, ${(section.pos * height).toFixed(1)}px, 0) translateY(-50%)`;
    label.style.opacity = visible ? '1' : '0';
  };

  const current = () => {   // the section the reader is in: the last one at or above where they are
    const scroll = o.getScroll() + 1;
    let index = -1;
    for (let i = 0; i < list.length; i++) if (list[i].at <= scroll) index = i;
    return index;
  };

  const paint = () => {
    raf = 0;
    head.style.transform = `translate3d(0, ${(fraction() * height).toFixed(1)}px, 0)`;
    const now = current();
    if (now !== active) {
      active = now;
      markTicks(ticks, active);
      if (painted && hover === null && !drag && active >= 0) {   // scrolling into a new section names it briefly
        placeLabel(active, true);
        window.clearTimeout(flashTimer);
        flashTimer = window.setTimeout(() => { if (hover === null && !drag) label.style.opacity = '0'; }, FLASH);
      }
    }
    let moving = false;   // ticks ease toward their swell, so the magnification follows the pointer smoothly
    ticks.forEach((tick, i) => {
      const y = (list[i] ? list[i].pos : 0) * height;
      const target = hover === null || reduceMotion ? 1 : 1 + SWELL * Math.exp(-((hover - y) ** 2) / (2 * REACH * REACH));
      const prev = swell[i] ?? 1;
      const value = prev + (target - prev) * 0.35;
      swell[i] = Math.abs(value - target) < 0.005 ? target : value;
      moving = moving || swell[i] !== target;
      tick.style.setProperty('--swell', swell[i].toFixed(3));
    });
    painted = true;
    if (moving) schedule();
  };

  function schedule() { if (!raf) raf = requestAnimationFrame(paint); }

  const stopTween = () => { cancelAnimationFrame(tween); tween = 0; };

  const scrollTo = target => {
    stopTween();
    const from = o.getScroll();
    const to = Math.min(Math.max(target, 0), end);
    if (reduceMotion || Math.abs(to - from) < 2) { o.setScroll(to); return; }
    const duration = Math.min(Math.max(260 + Math.abs(to - from) * 0.12, 300), 650);
    const begin = performance.now();
    const step = now => {
      const t = Math.min((now - begin) / duration, 1);
      o.setScroll(from + (to - from) * easeInOut(t));
      tween = t < 1 ? requestAnimationFrame(step) : 0;
    };
    tween = requestAnimationFrame(step);
  };

  const api = {
    jump: index => { const section = list[index]; if (section) scrollTo(section.at); },
    show: index => { hover = (list[index] ? list[index].pos : 0) * height; placeLabel(index, true); schedule(); }
  };

  const railY = e => Math.min(Math.max(e.clientY - rail.getBoundingClientRect().top, 0), height);
  const scrub = y => o.setScroll(start + (y / height) * (end - start));

  const onDown = e => {
    if (drag || e.button !== 0) return;
    e.preventDefault();
    rail.setPointerCapture(e.pointerId);
    stopTween();
    const y = railY(e);
    drag = { id: e.pointerId, moved: false, y, t: e.timeStamp, v: 0 };
    hover = y;
    rail.dataset.dragging = '';
    placeLabel(nearest(y).index, true);
    schedule();
  };
  const onMove = e => {
    const y = railY(e);
    if (drag && e.pointerId === drag.id) {
      const dt = Math.max(e.timeStamp - drag.t, 1);
      drag.v = drag.v * 0.4 + ((y - drag.y) / dt) * 0.6;
      drag.moved = drag.moved || Math.abs(y - drag.y) > 3;
      drag.y = y;
      drag.t = e.timeStamp;
      if (drag.moved) scrub(y);   // dragging the rail scrubs the page under it
    } else if (e.pointerType !== 'mouse') return;
    hover = y;
    placeLabel(nearest(y).index, true);
    schedule();
  };
  const onUp = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const { moved, y, v } = drag;
    drag = null;
    delete rail.dataset.dragging;
    if (e.pointerType !== 'mouse') { hover = null; placeLabel(-1, false); }
    const projected = moved ? y + v * 120 : y;   // where the flick was heading, then the tick nearest that
    const hit = nearest(projected);
    if (hit.index >= 0 && (!moved || hit.distance < SNAP)) api.jump(hit.index);
    schedule();
  };
  const onLeave = () => { if (drag) return; hover = null; placeLabel(-1, false); schedule(); };
  const onScroll = () => schedule();
  const onInput = () => stopTween();   // any scroll input of the reader's own cancels a jump in progress

  measure();
  paint();
  const resize = new ResizeObserver(() => { measure(); schedule(); });
  resize.observe(rail);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('wheel', onInput, { passive: true });
  window.addEventListener('touchstart', onInput, { passive: true });
  rail.addEventListener('pointerdown', onDown);
  rail.addEventListener('pointermove', onMove);
  rail.addEventListener('pointerup', onUp);
  rail.addEventListener('pointercancel', onUp);
  rail.addEventListener('pointerleave', onLeave);

  return {
    el: nav,
    jump: api.jump,
    refresh() { measure(); schedule(); },   // call when the scroll range changes
    setSections(next) { o.sections = next || []; measure(); schedule(); },   // new sections (e.g. after a resize moves their scroll positions)
    update: schedule,                      // call when the page scrolls without a scroll event (rare)
    destroy() {
      cancelAnimationFrame(raf); stopTween(); window.clearTimeout(flashTimer); resize.disconnect();
      window.removeEventListener('scroll', onScroll); window.removeEventListener('wheel', onInput); window.removeEventListener('touchstart', onInput);
      nav.remove();
    }
  };
}
export default createScrollIndex;
