/*
 * Kokonut UI, Slot Picker. MIT License
 * 
 * Copyright (c) 2025 kokonutUI
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * Icons: Lucide (ISC License), Copyright (c) Lucide Contributors 2022; portions Copyright (c) Cole Bemis 2013-2022 (Feather, MIT).
 */
// Kokonut UI "Slot Picker" (kokonutui.com/docs/inputs/slot-picker, @dorianbaffier, v2.0.0, MIT), ported to plain JS for
// Gage's site, 2026-10-30. The original (slot-picker.tsx / registry-slot-picker.json) sits beside this file. Everything that
// moves is the original with its numbers: quarter-hour starts (STEP 15), 0.8 px a minute on the day rail, a click drops the
// meeting into the nearest gap where it fits, a drag carries it and it hops over busy blocks instead of sliding under them,
// the length switch grows it in place (or moves it to the closest gap that fits), the day strip with "Xh free" (whole and
// half hours) or "Full", the hatched hours outside a day and the labelled "Busy" blocks, the dashed ghost under a mouse,
// arrow keys / Home / End move a placed meeting, Enter on the empty rail drops it in the first gap, the sliding pill and day
// ring (motion layoutId) and the meeting's y / height on the spring (0.35 s, no bounce), the confirm bar's text and button
// swapping on the 0.18 s ease-out (AnimatePresence popLayout, 8 / 6 px), Confirm → Booked.
// motion's MotionValue / animate() / spring are reproduced below from motion 12's source.
// What is different:
//  - sizes: every px of the original is calc(var(--sp-px, 1px) * n) (slot-picker.css); the rail's minute positions are
//    written the same way; the pointer is read as a fraction of the rail's on-screen height, so a CSS-3D-scaled parent
//    doesn't change which minute is under the finger. Highlights are placed from offsetLeft / offsetTop (layout boxes).
//  - layoutId is done as one highlight element per group that springs between buttons (left / top / width / height, so its
//    rounded corners never stretch, as motion's own corner correction keeps them).
//  - lucide-react icons are inlined (lucide-static 0.468.0, ISC). Tailwind classes are written out in slot-picker.css with
//    the original's dark-mode colours as --sp-* variables.
//  - added: lengths: false hides the length switch (one length on offer); setDays(days), relayout(), value; the demo data
//    and helpers are exported.

// ---- motion 12, the parts this component uses ----
const MAX_VELOCITY_DELTA = 30;
let ticking = false;
let frameTime = 0;
const now = () => (ticking ? frameTime : performance.now());
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

class MotionValue {
  constructor(value) {
    this.current = value;
    this.updatedAt = now();
    this.prevFrameValue = undefined;
    this.prevUpdatedAt = undefined;
    this.listeners = new Set();
    this.animation = null;
  }
  get() {
    return this.current;
  }
  set(value) {
    const time = now();
    if (this.updatedAt !== time) {
      this.prevFrameValue = this.current;
      this.prevUpdatedAt = this.updatedAt;
    }
    this.current = value;
    this.updatedAt = time;
    this.listeners.forEach(listener => listener(value));
  }
  jump(value) {
    this.stop();
    this.current = value;
    this.updatedAt = now();
    this.prevFrameValue = undefined;
    this.prevUpdatedAt = undefined;
    this.listeners.forEach(listener => listener(value));
  }
  getVelocity() {
    const time = now();
    if (this.prevFrameValue === undefined || time - this.updatedAt > MAX_VELOCITY_DELTA) return 0;
    const delta = Math.min(this.updatedAt - this.prevUpdatedAt, MAX_VELOCITY_DELTA);
    return delta ? ((this.current - this.prevFrameValue) * 1000) / delta : 0;
  }
  stop() {
    if (this.animation) {
      this.animation.halt();
      this.animation = null;
    }
  }
  on(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

const calcBezier = (t, a1, a2) => (((1.0 - 3.0 * a2 + 3.0 * a1) * t + (3.0 * a2 - 6.0 * a1)) * t + 3.0 * a1) * t;
const cubicBezier = (mX1, mY1, mX2, mY2) => {
  if (mX1 === mY1 && mX2 === mY2) return t => t;
  const getTForX = x => {
    let lower = 0;
    let upper = 1;
    let currentX;
    let currentT;
    let i = 0;
    do {
      currentT = lower + (upper - lower) / 2.0;
      currentX = calcBezier(currentT, mX1, mX2) - x;
      if (currentX > 0.0) upper = currentT;
      else lower = currentT;
    } while (Math.abs(currentX) > 0.0000001 && ++i < 12);
    return currentT;
  };
  return t => (t === 0 || t === 1 ? t : calcBezier(getTForX(t), mY1, mY2));
};
const NAMED = {
  linear: t => t,
  easeIn: cubicBezier(0.42, 0, 1, 1),
  easeOut: cubicBezier(0, 0, 0.58, 1),
  easeInOut: cubicBezier(0.42, 0, 0.58, 1)
};
const toEase = ease =>
  typeof ease === 'function' ? ease : Array.isArray(ease) ? cubicBezier(...ease) : NAMED[ease] || NAMED.easeOut;

const calcAngularFreq = (undampedFreq, dampingRatio) => undampedFreq * Math.sqrt(1 - dampingRatio * dampingRatio);
function findSpring({ duration = 800, bounce = 0.3, velocity = 0, mass = 1 }) {
  let envelope;
  let derivative;
  const safeMin = 0.001;
  let dampingRatio = clamp(1 - bounce, 0.05, 1);
  duration = clamp(duration / 1000, 0.01, 10);
  if (dampingRatio < 1) {
    envelope = undampedFreq => {
      const exponentialDecay = undampedFreq * dampingRatio;
      const delta = exponentialDecay * duration;
      const a = exponentialDecay - velocity;
      const b = calcAngularFreq(undampedFreq, dampingRatio);
      const c = Math.exp(-delta);
      return safeMin - (a / b) * c;
    };
    derivative = undampedFreq => {
      const exponentialDecay = undampedFreq * dampingRatio;
      const delta = exponentialDecay * duration;
      const d = delta * velocity + velocity;
      const e = Math.pow(dampingRatio, 2) * Math.pow(undampedFreq, 2) * duration;
      const f = Math.exp(-delta);
      const g = calcAngularFreq(Math.pow(undampedFreq, 2), dampingRatio);
      const factor = -envelope(undampedFreq) + safeMin > 0 ? -1 : 1;
      return (factor * ((d - e) * f)) / g;
    };
  } else {
    envelope = undampedFreq => {
      const a = Math.exp(-undampedFreq * duration);
      const b = (undampedFreq - velocity) * duration + 1;
      return -safeMin + a * b;
    };
    derivative = undampedFreq => {
      const a = Math.exp(-undampedFreq * duration);
      const b = (velocity - undampedFreq) * (duration * duration);
      return a * b;
    };
  }
  let undampedFreq = 5 / duration;
  for (let i = 1; i < 12; i++) undampedFreq = undampedFreq - envelope(undampedFreq) / derivative(undampedFreq);
  duration = duration * 1000;
  if (isNaN(undampedFreq)) return { stiffness: 100, damping: 10, duration };
  const stiffness = Math.pow(undampedFreq, 2) * mass;
  return { stiffness, damping: dampingRatio * 2 * Math.sqrt(mass * stiffness), duration };
}

function springGenerator(options) {
  const keyframes = options.keyframes;
  const origin = keyframes[0];
  const target = keyframes[keyframes.length - 1];
  let spring = { velocity: -((options.velocity || 0) / 1000), stiffness: 100, damping: 10, mass: 1, isResolvedFromDuration: false };
  const physics = ['stiffness', 'damping', 'mass'].some(key => options[key] !== undefined);
  for (const key of ['stiffness', 'damping', 'mass']) if (options[key] !== undefined) spring[key] = options[key];
  if (!physics && (options.duration !== undefined || options.bounce !== undefined)) {
    spring = { ...spring, ...findSpring({ duration: options.duration, bounce: options.bounce, velocity: spring.velocity }), mass: 1, isResolvedFromDuration: true };
  }
  const { stiffness, damping, mass, duration, isResolvedFromDuration } = spring;
  const initialVelocity = spring.velocity || 0.0;
  const dampingRatio = damping / (2 * Math.sqrt(stiffness * mass));
  const initialDelta = target - origin;
  const undampedAngularFreq = Math.sqrt(stiffness / mass) / 1000;
  const granular = Math.abs(initialDelta) < 5;
  const restSpeed = options.restSpeed ?? (granular ? 0.01 : 2);
  const restDelta = options.restDelta ?? (granular ? 0.005 : 0.5);
  let resolveSpring;
  if (dampingRatio < 1) {
    const angularFreq = calcAngularFreq(undampedAngularFreq, dampingRatio);
    resolveSpring = t => {
      const envelope = Math.exp(-dampingRatio * undampedAngularFreq * t);
      return (
        target -
        envelope *
          (((initialVelocity + dampingRatio * undampedAngularFreq * initialDelta) / angularFreq) * Math.sin(angularFreq * t) +
            initialDelta * Math.cos(angularFreq * t))
      );
    };
  } else if (dampingRatio === 1) {
    resolveSpring = t => target - Math.exp(-undampedAngularFreq * t) * (initialDelta + (initialVelocity + undampedAngularFreq * initialDelta) * t);
  } else {
    const dampedAngularFreq = undampedAngularFreq * Math.sqrt(dampingRatio * dampingRatio - 1);
    resolveSpring = t => {
      const envelope = Math.exp(-dampingRatio * undampedAngularFreq * t);
      const freqForT = Math.min(dampedAngularFreq * t, 300);
      return (
        target -
        (envelope *
          ((initialVelocity + dampingRatio * undampedAngularFreq * initialDelta) * Math.sinh(freqForT) +
            dampedAngularFreq * initialDelta * Math.cosh(freqForT))) /
          dampedAngularFreq
      );
    };
  }
  return t => {
    const current = resolveSpring(t);
    let done;
    if (!isResolvedFromDuration) {
      let currentVelocity = t === 0 ? initialVelocity : 0.0;
      if (dampingRatio < 1) {
        const prevT = Math.max(t - 5, 0);
        currentVelocity = t === 0 ? initialVelocity * 1000 : ((current - resolveSpring(prevT)) * 1000) / (t - prevT);
      }
      done = Math.abs(currentVelocity) <= restSpeed && Math.abs(target - current) <= restDelta;
    } else done = t >= duration;
    return { done, value: done ? target : current };
  };
}

function keyframesGenerator({ duration = 300, keyframes, times, ease = 'easeInOut' }) {
  const fn = toEase(ease);
  const count = keyframes.length;
  const offsets = times && times.length === count ? times : keyframes.map((_, i) => i / (count - 1));
  const at = offsets.map(offset => offset * duration);
  return t => {
    if (t >= duration) return { done: true, value: keyframes[count - 1] };
    let i = 1;
    while (i < count - 1 && t > at[i]) i++;
    const span = at[i] - at[i - 1];
    const p = span > 0 ? clamp((t - at[i - 1]) / span, 0, 1) : 1;
    return { done: false, value: keyframes[i - 1] + (keyframes[i] - keyframes[i - 1]) * fn(p) };
  };
}

const running = new Set();
let tickRaf = 0;
const tick = timestamp => {
  tickRaf = 0;
  frameTime = timestamp;
  ticking = true;
  for (const animation of [...running]) animation.step(timestamp);
  ticking = false;
  if (running.size) tickRaf = requestAnimationFrame(tick);
};

// animate(value, target | keyframes, options): motion's defaults (ease 'easeOut', velocity = the value's own velocity)
function animate(value, target, options = {}) {
  const keyframes = Array.isArray(target) ? target.slice() : [value.get(), target];
  if (keyframes[0] === null || keyframes[0] === undefined) keyframes[0] = value.get();
  const o = { ease: 'easeOut', velocity: value.getVelocity(), ...options };
  const duration = o.duration !== undefined ? o.duration * 1000 : undefined;
  const delay = (o.delay || 0) * 1000;
  const next =
    o.type === 'spring' && keyframes.length === 2
      ? springGenerator({ ...o, duration, keyframes })
      : keyframesGenerator({ duration: duration ?? 300, keyframes, times: o.times, ease: o.ease });
  value.stop();
  let resolve;
  const finished = new Promise(r => (resolve = r));
  const start = performance.now();
  const animation = {
    step(timestamp) {
      const elapsed = timestamp - start - delay;
      if (elapsed < 0) {
        value.set(keyframes[0]);
        return;
      }
      const state = next(elapsed);
      value.set(state.value);
      if (state.done) {
        running.delete(animation);
        if (value.animation === animation) value.animation = null;
        resolve();
      }
    },
    halt() {
      running.delete(animation);
    },
    then: (onResolve, onReject) => finished.then(onResolve, onReject)
  };
  value.animation = animation;
  running.add(animation);
  if (!tickRaf) tickRaf = requestAnimationFrame(tick);
  return animation;
}

// ---- the component ----
const EASE_OUT = [0.23, 1, 0.32, 1];
const EASE_OUT_CSS = 'cubic-bezier(0.23, 1, 0.32, 1)';
/** Meetings start on the quarter hour. */
const STEP = 15;
/** Height of one minute on the day rail, in (design) px. */
const PX = 0.8;
const U = n => `calc(var(--sp-px, 1px) * ${n})`;

const h = (hours, minutes = 0) => hours * 60 + minutes;

const DEMO_DAYS = [
  { date: '2026-11-02', open: [h(9), h(17)], busy: [[h(9), h(10)], [h(12), h(13, 30)], [h(15), h(16)]] },
  { date: '2026-11-03', open: [h(9), h(17)], busy: [[h(9), h(9, 30)], [h(10), h(10, 45)], [h(11, 30), h(12)], [h(13), h(14)], [h(16), h(17)]] },
  { date: '2026-11-04', open: [h(9), h(13)], busy: [[h(9, 30), h(10)], [h(10, 30), h(11)], [h(11, 30), h(12)], [h(12, 30), h(13)]] },
  { date: '2026-11-05', open: [h(10), h(17)], busy: [[h(11), h(12)], [h(14), h(14, 30)], [h(15, 30), h(17)]] },
  { date: '2026-11-06', open: [h(9), h(15)], busy: [[h(9), h(11)], [h(12), h(12, 30)]] }
];

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parse = iso => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const longDate = iso => {
  const date = parse(iso);
  return `${WEEKDAY[date.getUTCDay()]}, ${MONTH[date.getUTCMonth()]} ${date.getUTCDate()}`;
};
const clock = (minutes, suffix = true) => {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(wrapped / 60);
  const mins = wrapped % 60;
  const twelve = hours % 12 || 12;
  const time = mins ? `${twelve}:${String(mins).padStart(2, '0')}` : `${twelve}`;
  return suffix ? `${time}${hours >= 12 ? 'pm' : 'am'}` : time;
};
/** "10:30 – 11am", dropping the first am/pm when both ends share it. */
const range = (start, minutes) => {
  const end = start + minutes;
  const same = start < h(12) === end <= h(12);
  return `${clock(start, !same)} – ${clock(end)}`;
};
const lengthLabel = minutes => (minutes < 60 ? `${minutes} min` : `${minutes / 60} hr`);

/** Every quarter hour where the whole meeting fits. */
function startsFor(day, minutes) {
  const out = [];
  for (let t = day.open[0]; t + minutes <= day.open[1]; t += STEP) {
    if (!day.busy.some(([a, b]) => t < b && t + minutes > a)) out.push(t);
  }
  return out;
}
/** The start that fits closest to where the hand is. */
function nearest(starts, target) {
  let best = null;
  for (const s of starts) {
    if (best === null || Math.abs(s - target) < Math.abs(best - target)) best = s;
  }
  return best;
}
function freeMinutes(day) {
  const busy = day.busy.reduce((sum, [a, b]) => sum + Math.max(0, Math.min(b, day.open[1]) - Math.max(a, day.open[0])), 0);
  return day.open[1] - day.open[0] - busy;
}

// lucide-static 0.468.0 (ISC), drawn as lucide-react draws them
const LUCIDE = {
  ArrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  Check: '<path d="M20 6 9 17l-5-5"/>',
  Globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>'
};
const icon = (name, className, strokeWidth = 2) => {
  const span = document.createElement('span');
  span.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="${className}">${LUCIDE[name]}</svg>`;
  return span.firstChild;
};
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
};

// AnimatePresence initial={false} mode="popLayout" with { opacity, y } in/out: the old child pops out of the layout and
// leaves (opacity 1 → 0, y 0 → -dy) while the new one comes in (opacity 0, y dy → 1, 0), both on the fade transition
function presence(parent, dy, fade) {
  let current = null;
  let key;
  return (nextKey, build) => {
    if (current && nextKey === key) return current;
    const old = current;
    key = nextKey;
    current = build();
    if (!old) {
      parent.appendChild(current);
      return current;
    }
    const duration = fade.duration * 1000;
    const box = { left: old.offsetLeft, top: old.offsetTop, width: old.offsetWidth, height: old.offsetHeight };
    Object.assign(old.style, { position: 'absolute', left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px`, margin: '0' });
    parent.appendChild(current);
    if (duration > 0) {
      const out = old.animate([{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: `translateY(${-dy}px)` }], { duration, easing: EASE_OUT_CSS, fill: 'forwards' });
      out.onfinish = () => old.remove();
      current.animate([{ opacity: 0, transform: `translateY(${dy}px)` }, { opacity: 1, transform: 'translateY(0)' }], { duration, easing: EASE_OUT_CSS });
    } else old.remove();
    return current;
  };
}

/**
 * Booking a meeting on a real day rail. Click a free gap and the meeting lands there; drag it and it hops over what's
 * already booked instead of sliding under it. Change the length and it grows in place, moving only if it no longer fits.
 */
export function createSlotPicker(mount, opts = {}) {
  const o = {
    host: { name: 'Lena Ortiz', title: 'Product walkthrough', city: 'Lisbon', offset: 300 },
    days: DEMO_DAYS,
    durations: [30, 60, 90],
    timezone: 'Eastern Time, New York',
    onBook: undefined,
    className: '',
    lengths: true,
    ...opts
  };
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let days = o.days;
  let minutes = o.durations[0] ?? 30;
  let dayIndex = 0;
  let start = null;
  let ghost = null;
  let dragging = false;
  let booked = false;
  let grab = 0;

  const spring = reduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.35, bounce: 0 };
  const fade = { duration: reduceMotion ? 0 : 0.18, ease: EASE_OUT };
  const go = (mv, to) => (spring.duration === 0 ? mv.jump(to) : animate(mv, to, spring));

  // ---- the JSX ----
  const root = el('div', `slot-picker ${o.className}`.trim());
  const probe = el('span', 'slot-picker__probe');
  probe.setAttribute('aria-hidden', 'true');
  root.appendChild(probe);
  const unit = () => (probe.offsetWidth || 100) / 100;

  const head = el('div', 'sp-head');
  const initials = o.host.name.split(' ').map(p => p[0]).join('').slice(0, 2);
  const headText = el('div', 'sp-head-text');
  headText.append(el('p', 'sp-title', o.host.title), el('p', 'sp-sub', `with ${o.host.name}`));
  head.append(el('span', 'sp-avatar', initials), headText);
  root.appendChild(head);

  // the length switch, its pill sliding to the picked length (layoutId)
  const lengths = el('div', 'sp-lengths');
  const pill = el('span', 'sp-lengths-pill');
  lengths.appendChild(pill);
  const lengthButtons = o.durations.map(d => {
    const b = el('button', 'sp-length', lengthLabel(d));
    b.type = 'button';
    b.addEventListener('click', () => pickMinutes(d));
    lengths.appendChild(b);
    return b;
  });
  if (o.lengths) root.appendChild(lengths);

  // the day strip, its ring sliding to the picked day (layoutId)
  const strip = el('div', 'sp-days');
  const ring = el('span', 'sp-day-ring');
  strip.appendChild(ring);
  let dayButtons = [];
  root.appendChild(strip);

  // the day rail
  const railRow = el('div', 'sp-railrow');
  const hoursCol = el('div', 'sp-hours');
  hoursCol.setAttribute('aria-hidden', 'true');
  const rail = el('div', 'sp-rail');
  railRow.append(hoursCol, rail);
  root.appendChild(railRow);
  const first = el('button', 'sp-first');
  first.type = 'button';
  first.addEventListener('click', event => placeFirst(event));
  const lines = el('div', 'sp-lines');
  const blocks = el('div', 'sp-blocks');
  const ghostEl = el('div', 'sp-ghost');
  const ghostLabel = el('span', 'sp-ghost-label');
  ghostEl.appendChild(ghostLabel);
  const meeting = el('div', 'sp-meeting');
  const meetingBtn = el('button', 'sp-meeting-btn');
  meetingBtn.type = 'button';
  const meetingCheck = icon('Check', 'sp-meeting-check', 3);
  const meetingText = el('span', 'sp-meeting-text');
  meetingBtn.append(meetingCheck, meetingText);
  meeting.appendChild(meetingBtn);
  meetingBtn.addEventListener('keydown', event => onKey(event));
  rail.append(lines, blocks);

  const tz = el('p', 'sp-tz');
  tz.append(icon('Globe', 'sp-tz-icon'), document.createTextNode(o.timezone));
  root.appendChild(tz);

  // the confirm bar
  const bar = el('div', 'sp-confirm');
  const barText = el('div', 'sp-confirm-text');
  const confirmBtn = el('button', 'sp-confirm-btn');
  confirmBtn.type = 'button';
  bar.append(barText, confirmBtn);
  root.appendChild(bar);
  const swapText = presence(barText, 8, fade);
  const swapLabel = presence(confirmBtn, 6, fade);
  confirmBtn.addEventListener('click', () => {
    const day = days[dayIndex];
    if (!day || start === null || booked) return;
    o.onBook?.({ date: day.date, start, minutes });
    booked = true;
    render();
  });
  mount.appendChild(root);

  // ---- motion values: the two sliding highlights and the meeting ----
  const pillX = new MotionValue(0);
  const pillW = new MotionValue(0);
  const ringX = new MotionValue(0);
  const ringY = new MotionValue(0);
  const ringW = new MotionValue(0);
  const ringH = new MotionValue(0);
  const meetY = new MotionValue(0);
  const meetH = new MotionValue(0);
  let queued = false;
  const paint = () => {
    queued = false;
    pill.style.transform = `translateX(${pillX.get()}px)`;
    pill.style.width = `${pillW.get()}px`;
    ring.style.transform = `translate(${ringX.get()}px, ${ringY.get()}px)`;
    ring.style.width = `${ringW.get()}px`;
    ring.style.height = `${ringH.get()}px`;
    meeting.style.transform = `translateY(${U(meetY.get())})`;
    meeting.style.height = U(meetH.get());
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    queueMicrotask(paint);
  };
  [pillX, pillW, ringX, ringY, ringW, ringH, meetY, meetH].forEach(mv => mv.on(schedule));

  // ---- derived ----
  const span = () => ({ from: Math.min(...days.map(d => d.open[0])), to: Math.max(...days.map(d => d.open[1])) });
  const startsNow = () => (days[dayIndex] ? startsFor(days[dayIndex], minutes) : []);

  const buildDays = () => {
    dayButtons.forEach(b => b.remove());
    dayButtons = days.map((d, i) => {
      const b = el('button', 'sp-day');
      b.type = 'button';
      b.append(el('span', 'sp-day-week'), el('span', 'sp-day-date'), el('span', 'sp-day-free'));
      b.addEventListener('click', () => pickDay(i));
      strip.appendChild(b);
      return b;
    });
  };

  let builtFor = null;
  const buildRail = () => {
    const { from, to } = span();
    const height = (to - from) * PX;
    hoursCol.style.height = U(height);
    rail.style.height = U(height);
    const hours = [];
    for (let t = Math.ceil(from / 60) * 60; t <= to; t += 60) hours.push(t);
    hoursCol.replaceChildren(...hours.map(t => {
      const label = el('span', 'sp-hour', clock(t));
      label.style.top = U((t - from) * PX);
      return label;
    }));
    lines.replaceChildren(...hours.map(t => {
      const line = el('span', 'sp-line');
      line.style.top = U((t - from) * PX);
      return line;
    }));
  };

  // a meeting already in the calendar, or the hours outside the day
  const blocked = (span2, from, label) => {
    const height = (span2[1] - span2[0]) * PX;
    const node = el('div', `sp-block${label ? ' sp-block--busy' : ''}`);
    node.style.top = U((span2[0] - from) * PX);
    node.style.height = U(height);
    if (label && height >= 20) node.appendChild(el('span', 'sp-block-label', label));
    return node;
  };
  const buildBlocks = () => {
    const day = days[dayIndex];
    const { from, to } = span();
    const nodes = [];
    if (day && day.open[0] > from) nodes.push(blocked([from, day.open[0]], from));
    if (day && day.open[1] < to) nodes.push(blocked([day.open[1], to], from));
    day?.busy.forEach(s => nodes.push(blocked(s, from, 'Busy')));
    blocks.replaceChildren(...nodes);
    builtFor = dayIndex;
  };

  // ---- render: what React re-renders ----
  let meetingKey = null;
  function render() {
    const day = days[dayIndex];
    const { from } = span();
    const starts = startsNow();

    lengthButtons.forEach((b, i) => {
      const on = o.durations[i] === minutes;
      b.setAttribute('aria-pressed', String(on));
    });

    dayButtons.forEach((b, i) => {
      const d = days[i];
      const date = parse(d.date);
      const full = startsFor(d, minutes).length === 0;
      // Whole and half hours read better than 4.25h.
      const halves = Math.floor(freeMinutes(d) / 30);
      const free = `${Math.floor(halves / 2) || ''}${halves % 2 ? '½' : ''}`;
      b.setAttribute('aria-pressed', String(i === dayIndex));
      b.disabled = full;
      if (full) b.dataset.full = '';
      else delete b.dataset.full;
      b.children[0].textContent = WEEKDAY[date.getUTCDay()];
      b.children[1].textContent = String(date.getUTCDate());
      b.children[2].textContent = full ? 'Full' : `${free || 0}h free`;
    });

    if (builtFor !== dayIndex) buildBlocks();
    rail.classList.toggle('is-dragging', dragging);

    // keyboard way in before anything is placed
    if (start === null) {
      first.setAttribute('aria-label', `${day ? longDate(day.date) : 'Day'}: no time picked. Press Enter to place a ${lengthLabel(minutes)} meeting in the first free gap.`);
      if (!first.isConnected) rail.appendChild(first);
    } else if (first.isConnected) first.remove();

    if (ghost !== null && start !== ghost) {
      ghostEl.style.top = U((ghost - from) * PX);
      ghostEl.style.height = U(minutes * PX);
      ghostLabel.textContent = range(ghost, minutes);
      if (!ghostEl.isConnected) rail.appendChild(ghostEl);
    } else if (ghostEl.isConnected) ghostEl.remove();

    if (start !== null) {
      const y = (start - from) * PX;
      const hh = minutes * PX;
      if (meetingKey !== dayIndex || !meeting.isConnected) {
        // key={dayIndex}: a new day mounts a new block, already where it belongs
        meetingKey = dayIndex;
        meetY.jump(y);
        meetH.jump(hh);
        rail.appendChild(meeting);
      } else {
        if (meetY.get() !== y) go(meetY, y);
        if (meetH.get() !== hh) go(meetH, hh);
      }
      meetingBtn.setAttribute('aria-label', `${longDate(day?.date ?? '')}, ${range(start, minutes)}. Arrow keys move it.`);
      meetingBtn.classList.toggle('is-booked', booked);
      meetingBtn.classList.toggle('is-grab', !(booked || dragging));
      meetingCheck.style.display = booked ? '' : 'none';
      meetingText.textContent = range(start, minutes);
    } else if (meeting.isConnected) {
      meeting.remove();
      meetingKey = null;
    }

    // the confirm bar
    const hostTime =
      start !== null && o.host.offset
        ? `${clock(start + o.host.offset)} for ${o.host.name.split(' ')[0]}${o.host.city ? ` in ${o.host.city}` : ''}`
        : null;
    const text = swapText(start === null ? 'none' : 'some', () => el('div', 'sp-confirm-line'));
    text.replaceChildren();
    if (start === null || !day) text.appendChild(el('p', 'sp-hint', 'Click a free gap, then drag it to move.'));
    else {
      text.appendChild(el('p', 'sp-picked', `${longDate(day.date)} · ${range(start, minutes)}`));
      if (hostTime) text.appendChild(el('p', 'sp-hosttime', hostTime));
    }
    confirmBtn.disabled = start === null;
    confirmBtn.classList.toggle('is-booked', booked);
    swapLabel(booked ? 'booked' : 'confirm', () => {
      const label = el('span', 'sp-confirm-label');
      if (booked) label.append(icon('Check', 'sp-confirm-icon', 2.5), document.createTextNode('Booked'));
      else label.append(document.createTextNode('Confirm'), icon('ArrowRight', 'sp-confirm-icon'));
      return label;
    });

    placeHighlights(true);
  }

  // the two sliding highlights follow their picked button (layoutId): spring between, jump on first paint / resize
  let highlightsPlaced = false;
  function placeHighlights(animateIt) {
    const lb = lengthButtons[o.durations.indexOf(minutes)];
    const db = dayButtons[dayIndex];
    // only a changed target moves (a re-render with the same pick leaves a running slide alone)
    const move = (mv, to) => {
      if (animateIt && highlightsPlaced) {
        if (mv.target === to) return;
        mv.target = to;
        go(mv, to);
      } else {
        mv.target = to;
        mv.jump(to);
      }
    };
    if (lb) {
      move(pillX, lb.offsetLeft);
      move(pillW, lb.offsetWidth);
    }
    if (db) {
      move(ringX, db.offsetLeft);
      move(ringY, db.offsetTop);
      move(ringW, db.offsetWidth);
      move(ringH, db.offsetHeight);
    }
    highlightsPlaced = !!(lb || db) && root.isConnected && root.offsetWidth > 0;
  }

  // ---- the original's handlers ----
  /** Minutes on the rail under the pointer. */
  const minuteAt = event => {
    const { from, to } = span();
    const rect = rail.getBoundingClientRect();
    return rect.height ? from + ((event.clientY - rect.top) / rect.height) * (to - from) : from;
  };
  const place = next => {
    start = next;
    booked = false;
  };
  const onDown = event => {
    if (event.button !== 0) return;
    const at = minuteAt(event);
    const starts = startsNow();
    const onBlock = start !== null && at >= start && at <= start + minutes;
    // Grab the meeting where you held it; a click elsewhere drops it there.
    grab = onBlock && start !== null ? at - start : minutes / 2;
    if (!onBlock) place(nearest(starts, at - minutes / 2));
    try {
      rail.setPointerCapture(event.pointerId);
    } catch {}
    dragging = true;
    ghost = null;
    render();
  };
  const onMove = event => {
    const at = minuteAt(event);
    const starts = startsNow();
    if (dragging) {
      const next = nearest(starts, at - grab);
      if (next !== start) {
        place(next);
        render();
      }
      return;
    }
    const over = start !== null && at >= start && at <= start + minutes;
    const nextGhost = event.pointerType === 'mouse' && !over && !booked ? nearest(starts, at - minutes / 2) : null;
    if (nextGhost !== ghost) {
      ghost = nextGhost;
      render();
    }
  };
  const onKey = event => {
    if (start === null) return;
    const starts = startsNow();
    const index = starts.indexOf(start);
    const moves = {
      ArrowUp: starts[Math.max(0, index - 1)],
      ArrowDown: starts[Math.min(starts.length - 1, index + 1)],
      Home: starts[0],
      End: starts.at(-1)
    };
    if (event.key in moves) {
      event.preventDefault();
      place(moves[event.key] ?? start);
      render();
    }
  };
  const pickMinutes = next => {
    minutes = next;
    const day = days[dayIndex];
    if (day && start !== null) {
      // Grow in place when it fits; otherwise move to the closest gap.
      const fits = startsFor(day, next);
      place(fits.includes(start) ? start : nearest(fits, start));
    }
    render();
  };
  // Keyboard way in before anything is placed: Enter or Space on the rail drops the meeting in the first free gap, then
  // the arrows move it.
  const placeFirst = event => {
    const starts = startsNow();
    if (event.detail !== 0 || starts.length === 0) return;
    place(starts[0]);
    render();
    requestAnimationFrame(() => meetingBtn.focus());
  };
  const pickDay = index => {
    dayIndex = index;
    place(null);
    render();
  };

  rail.addEventListener('pointerdown', onDown);
  rail.addEventListener('pointermove', onMove);
  rail.addEventListener('pointerup', () => {
    dragging = false;
    render();
  });
  rail.addEventListener('pointercancel', () => {
    dragging = false;
    render();
  });
  rail.addEventListener('pointerleave', () => {
    if (ghost !== null) {
      ghost = null;
      render();
    }
  });

  buildDays();
  buildRail();
  render();
  const resizeObserver = new ResizeObserver(() => placeHighlights(false));
  resizeObserver.observe(root);

  return {
    el: root,
    get value() {
      const day = days[dayIndex];
      return start === null || !day ? null : { date: day.date, start, minutes, booked };
    },
    // added: new days (same shape as the original's prop); the pick is cleared
    setDays(next) {
      days = next;
      dayIndex = 0;
      place(null);
      builtFor = null;
      buildDays();
      buildRail();
      render();
    },
    relayout: () => placeHighlights(false),
    destroy() {
      resizeObserver.disconnect();
      root.remove();
    }
  };
}

export { DEMO_DAYS, clock, range, longDate };
export default createSlotPicker;
