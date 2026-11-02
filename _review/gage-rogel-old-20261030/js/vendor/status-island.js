/*
 * Kokonut UI, Status Island. MIT License
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
 */
// Kokonut UI "Status Island" (kokonutui.com/docs/navigation/status-island, @dorianbaffier, v1.0.0, MIT), ported to plain JS
// for Gage's site, 2026-10-30. The original (status-island.tsx / registry-status-island.json) sits beside this file.
// Everything that moves is the original with its numbers: the island springs to the size of what it holds (MORPH: motion's
// spring, duration 0.45, bounce 0.18, resolved to stiffness and damping by motion's own root-finding), the task in the pill
// swaps on SWAP (0.22 s, ease [0.23, 1, 0.32, 1]; the old one lifted out and leaving up 6 px with a 4 px blur, the new one
// rising 6 px out of a blur), up to MAX_PEEK 2 tasks peek out behind it (opacity 1 - 0.3n, y -5n px, scale 1 - 0.06n, on
// MORPH), hover / focus / tap opens the list of everything (320 px, fading in out of a blur 0.05 s late), a tap elsewhere or
// Escape closes it (focus handed between the pill and the list), the icons (progress ring with its 250 ms ease-out, a
// spinner when the length isn't known, the drawn tick 0.3 s after 0.08 s, the error mark), the percent's rolling digits
// (200 ms, keyed from the right), the action chip, the polite announcement of new tasks and status changes, and done tasks
// leaving after dismissAfter (4 s), paused while the list is open and restarted when it is read.
// motion's MotionValue / animate() / spring are reproduced below from motion 12's source; SWAP tweens are WAAPI on the
// same cubic-bezier. MotionConfig reducedMotion="user" is kept: under reduced motion transforms and size jump, opacity and
// blur still fade.
// What is different:
//  - React's tasks prop becomes a small store: push(task), update(id, patch), remove(id), set(tasks); done tasks are
//    removed after dismissAfter (autoRemove, the demo's onDismiss) and onDismiss(id) is still called.
//  - motion's layout animation is done by springing the island's width and height (MORPH) to its content's own size, the
//    content keeping its natural size inside the clipped box, so nothing stretches (motion's scale correction does the same).
//  - every px is calc(var(--isl-px, 1px) * n) (status-island.css); colours are --isl-* variables (defaults = the original's
//    dark mode).
//  - added: rest: { content: Node | () => Node } is what the island shows when there are no tasks (the original hides);
//    open() / close() / tasks / destroy().

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
const MORPH = { type: 'spring', duration: 0.45, bounce: 0.18 };
const SWAP = { duration: 0.22, ease: [0.23, 1, 0.32, 1] };
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
// Tasks that peek out behind the island when it is closed.
const MAX_PEEK = 2;
const NS = 'http://www.w3.org/2000/svg';

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
};
const svg = (className, inner) => {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('aria-hidden', 'true');
  s.setAttribute('class', className);
  s.setAttribute('fill', 'none');
  s.setAttribute('viewBox', '0 0 16 16');
  s.innerHTML = inner;
  return s;
};
function describe(task) {
  return [task.label, task.detail].filter(Boolean).join(', ');
}
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// a WAAPI tween on motion's SWAP (0.22 s, ease [0.23, 1, 0.32, 1]); under reduced motion transforms jump (MotionConfig
// reducedMotion="user" keeps opacity and filter, drops transform)
const swap = (node, from, to, delay = 0) => {
  const reduce = reducedMotion();
  const strip = frame => (reduce ? Object.fromEntries(Object.entries(frame).filter(([k]) => k !== 'transform')) : frame);
  return node.animate([strip(from), strip(to)], { duration: SWAP.duration * 1000, easing: EASE_OUT, delay: delay * 1000, fill: 'both' });
};

/** A number whose digits roll to their new value. */
function rollingNumber() {
  const root = el('span', 'isl-roll');
  root.setAttribute('aria-hidden', 'true');
  const columns = [];   // indexed from the right, so the ones stay the ones when a digit is added
  const column = () => {
    const cell = el('span', 'isl-roll-cell');
    const strip = el('span', 'isl-roll-strip');
    for (const d of '0123456789') strip.appendChild(el('span', 'isl-roll-digit', d));
    cell.appendChild(strip);
    return { cell, strip };
  };
  return {
    el: root,
    set(value) {
      const text = String(value);
      while (columns.length < text.length) {
        const c = column();
        columns.push(c);
        root.insertBefore(c.cell, root.firstChild);
      }
      while (columns.length > text.length) columns.pop().cell.remove();
      text.split('').forEach((char, i) => {
        const c = columns[text.length - 1 - i];
        c.strip.style.transform = `translateY(${-Number(char) * 10}%)`;
      });
    }
  };
}

function taskIcon(task) {
  if (task.status === 'done') {
    const s = svg('isl-icon isl-icon--done', '<circle cx="8" cy="8" fill="currentColor" opacity="0.18" r="8"/><path d="M4.75 8.25 7 10.5l4.25-4.75" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" pathLength="1" stroke-dasharray="1" stroke-dashoffset="0"/>');
    // motion's pathLength 0 → 1 (0.3 s, ease [0.23, 1, 0.32, 1], delay 0.08)
    const path = s.querySelector('path');
    path?.animate?.([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 300, easing: EASE_OUT, delay: 80, fill: 'backwards' });
    return s;
  }
  if (task.status === 'error') {
    return svg('isl-icon isl-icon--error', '<circle cx="8" cy="8" fill="currentColor" opacity="0.18" r="8"/><path d="M8 4.5v4" stroke="currentColor" stroke-linecap="round" stroke-width="1.75"/><circle cx="8" cy="11.25" fill="currentColor" r="1"/>');
  }
  const known = typeof task.progress === 'number';
  const circumference = 2 * Math.PI * 6;
  const s = svg(`isl-icon isl-ring${known ? '' : ' isl-ring--spin'}`, `<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-opacity="0.18" stroke-width="2"/><circle class="isl-ring-arc" cx="8" cy="8" r="6" stroke="currentColor" stroke-dasharray="${circumference}" stroke-linecap="round" stroke-width="2"/>`);
  return s;
}
// the ring's arc follows progress (250 ms ease-out), so the ring is kept and only its offset changes
function setRing(icon, task) {
  const arc = icon.querySelector('.isl-ring-arc');
  if (!arc) return;
  const known = typeof task.progress === 'number';
  const circumference = 2 * Math.PI * 6;
  const progress = known ? Math.min(1, Math.max(0, task.progress ?? 0)) : 0.25;
  arc.style.strokeDashoffset = String(circumference * (1 - progress));
}

// one task's row: icon, label · detail, trailing (action button, or rolling percent while running). inert = the pill's
// copy, where the action shows as a label (the pill itself is a button)
function taskRow(task, inert) {
  const row = el('div', inert ? 'isl-row isl-row--pill' : 'isl-row');
  let icon = null;
  let iconKey = '';
  const text = el('span', 'isl-label');
  const trailWrap = inert ? el('span', 'isl-trail-pad') : null;
  let trailKey = '';
  let trailing = null;
  let roll = null;
  const update = t => {
    const known = typeof t.progress === 'number';
    const key = `${t.status}${t.status === 'running' ? (known ? '-known' : '-spin') : ''}`;
    if (key !== iconKey) {
      const next = taskIcon(t);
      if (icon) icon.replaceWith(next);
      else row.insertBefore(next, row.firstChild);
      icon = next;
      iconKey = key;
    }
    if (t.status === 'running') setRing(icon, t);
    text.replaceChildren(document.createTextNode(t.label));
    if (t.detail) text.appendChild(el('span', 'isl-detail', ` · ${t.detail}`));
    // trailing
    const tk = t.action ? `action:${t.action.label}` : t.status === 'running' && known ? 'percent' : '';
    const host = inert ? trailWrap : row;
    if (tk !== trailKey) {
      trailing?.remove();
      trailing = null;
      roll = null;
      let node = null;
      if (t.action && inert) node = el('span', 'isl-trailing isl-chip isl-chip--inert', t.action.label);
      else if (t.action) {
        node = el('button', 'isl-trailing isl-chip', t.action.label);
        node.type = 'button';
        node.addEventListener('click', event => {
          event.stopPropagation();
          row.__task?.action?.onClick?.();
        });
      } else if (tk === 'percent') {
        node = el('span', 'isl-trailing isl-percent');
        roll = rollingNumber();
        node.append(roll.el, document.createTextNode('%'));
      }
      if (node) host.appendChild(node);
      trailing = node;
      trailKey = tk;
    }
    if (roll) roll.set(Math.round(Math.min(1, Math.max(0, t.progress)) * 100));
    row.__task = t;
  };
  row.appendChild(text);
  if (trailWrap) row.appendChild(trailWrap);
  update(task);
  return { el: row, update };
}

/**
 * A pill that reports background work. It reshapes itself as tasks change and opens into a list of everything in flight
 * on hover, focus or tap.
 */
export function createStatusIsland(mount, opts = {}) {
  const o = { tasks: [], onDismiss: undefined, dismissAfter: 4000, autoRemove: true, rest: null, className: '', ...opts };
  let tasks = [...(o.tasks || [])];
  let open = false;
  const doneAt = new Map();
  const lastStatus = new Map();
  const timers = [];
  let focusList = false;
  let focusPill = false;
  let skipOpen = false;

  // ---- the JSX ----
  const root = el('div', `status-island ${o.className}`.trim());
  const output = el('output', 'isl-sr');
  output.setAttribute('aria-live', 'polite');
  root.appendChild(output);
  mount.appendChild(root);

  let wrap = null;   // the island (AnimatePresence key="island")
  let body = null;
  let peeks = [];
  let content = null;   // the list, the pill button, or (added) the resting content
  let contentKind = '';
  let pillSlot = null;   // AnimatePresence mode="popLayout" inside the pill
  let pillKey = '';
  let pillRow = null;
  let listRows = new Map();
  const bodyW = new MotionValue(0);
  const bodyH = new MotionValue(0);
  let sized = false;
  const paintBody = () => {
    if (!body) return;
    body.style.width = `${bodyW.get()}px`;
    body.style.height = `${bodyH.get()}px`;
  };
  bodyW.on(paintBody);
  bodyH.on(paintBody);

  const current = () => tasks.at(-1);
  const expanded = () => open && tasks.length > 0;

  const buildIsland = () => {
    wrap = el('div', 'isl-island');
    body = el('div', 'isl-body');
    wrap.appendChild(body);
    body.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') setOpen(true);
    });
    body.addEventListener('pointerleave', event => {
      if (event.pointerType === 'mouse') setOpen(false);
    });
    body.addEventListener('focusout', event => {
      if (!body.contains(event.relatedTarget)) setOpen(false);
    });
    body.addEventListener('focusin', event => {
      if (skipOpen) {
        skipOpen = false;
        return;
      }
      if (event.target === content && contentKind === 'pill') focusList = true;
      if (contentKind === 'rest') return;   // added: the resting buttons don't open a list
      setOpen(true);
    });
    body.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        focusPill = body.contains(document.activeElement);
        setOpen(false);
      }
    });
    root.appendChild(wrap);
    sized = false;
    swap(wrap, { opacity: 0, transform: 'translateY(8px)', filter: 'blur(4px)' }, { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' });
  };

  const removeIsland = () => {
    const leaving = wrap;
    wrap = null;
    body = null;
    peeks = [];
    content = null;
    contentKind = '';
    pillSlot = null;
    pillKey = '';
    pillRow = null;
    listRows = new Map();
    const a = swap(leaving, { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }, { opacity: 0, transform: 'translateY(8px)', filter: 'blur(4px)' });
    a.onfinish = () => leaving.remove();
  };

  // the peeking layers behind the closed island, on the MORPH spring (initial={false}: a new layer starts where it belongs)
  const syncPeeks = () => {
    const behind = Math.max(0, Math.min(tasks.length - 1, MAX_PEEK));
    while (peeks.length > behind) peeks.pop().node.remove();
    while (peeks.length < behind) {
      const i = peeks.length;
      const node = el('div', 'isl-peek');
      node.setAttribute('aria-hidden', 'true');
      node.style.zIndex = String(-1 - i);
      const layer = { node, opacity: new MotionValue(0), y: new MotionValue(0), scale: new MotionValue(1) };
      const paint = () => {
        node.style.opacity = String(layer.opacity.get());
        node.style.transform = `translateY(${layer.y.get()}px) scale(${layer.scale.get()})`;
      };
      [layer.opacity, layer.y, layer.scale].forEach(mv => mv.on(paint));
      layer.target = (ex => ({ opacity: ex ? 0 : 1 - (i + 1) * 0.3, y: ex ? 0 : -(i + 1) * 5, scale: 1 - (i + 1) * 0.06 }))(expanded());
      layer.opacity.jump(layer.target.opacity);
      layer.y.jump(layer.target.y);
      layer.scale.jump(layer.target.scale);
      wrap.insertBefore(node, body);
      peeks.push(layer);
    }
    const ex = expanded();
    peeks.forEach((layer, i) => {
      const t = { opacity: ex ? 0 : 1 - (i + 1) * 0.3, y: ex ? 0 : -(i + 1) * 5, scale: 1 - (i + 1) * 0.06 };
      for (const k of ['opacity', 'y', 'scale']) {
        if (layer.target[k] === t[k]) continue;
        layer.target[k] = t[k];
        if (reducedMotion() && k !== 'opacity') layer[k].jump(t[k]);
        else animate(layer[k], t[k], MORPH);
      }
    });
  };

  const buildList = () => {
    const ul = el('ul', 'isl-list');
    ul.setAttribute('aria-label', 'Tasks');
    ul.tabIndex = -1;
    listRows = new Map();
    swap(ul, { opacity: 0, filter: 'blur(4px)' }, { opacity: 1, filter: 'blur(0px)' }, 0.05);
    return ul;
  };
  const syncList = () => {
    const ids = new Set(tasks.map(t => t.id));
    for (const [id, row] of listRows) if (!ids.has(id)) { row.li.remove(); listRows.delete(id); }
    tasks.forEach(task => {
      let row = listRows.get(task.id);
      if (!row) {
        const li = el('li');
        const r = taskRow(task, false);
        li.appendChild(r.el);
        row = { li, row: r };
        listRows.set(task.id, row);
      } else row.row.update(task);
      content.appendChild(row.li);   // keeps the order oldest first
    });
  };

  const buildPill = () => {
    const button = el('button', 'isl-pill');
    button.type = 'button';
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', () => setOpen(true));
    pillSlot = button;
    pillKey = '';
    pillRow = null;
    return button;
  };
  const syncPill = () => {
    const task = current();
    content.setAttribute('aria-label', `${describe(task)}. ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}, show all`);
    const key = `${task.id}-${task.status}`;
    if (key === pillKey && pillRow) {
      pillRow.row.update(task);
      return;
    }
    const old = pillRow;
    const holder = el('div', 'isl-pill-content');
    const row = taskRow(task, true);
    holder.appendChild(row.el);
    pillRow = { holder, row };
    const first = !pillKey;
    pillKey = key;
    if (old) {
      // mode="popLayout": the old one is lifted out of the layout and leaves while the new one comes in
      Object.assign(old.holder.style, { position: 'absolute', left: `${old.holder.offsetLeft}px`, top: `${old.holder.offsetTop}px`, width: `${old.holder.offsetWidth}px` });
      const a = swap(old.holder, { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }, { opacity: 0, transform: 'translateY(-6px)', filter: 'blur(4px)' });
      a.onfinish = () => old.holder.remove();
    }
    content.appendChild(holder);
    if (!first) swap(holder, { opacity: 0, transform: 'translateY(6px)', filter: 'blur(4px)' }, { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' });   // initial={false}
  };

  // added: what the island shows with no tasks, when the page gives it a resting face (otherwise it hides, as the original)
  const buildRest = () => {
    const holder = el('div', 'isl-rest');
    const node = typeof o.rest.content === 'function' ? o.rest.content() : o.rest.content;
    if (node) holder.appendChild(node);
    return holder;
  };

  // motion's `layout` on the island: its box springs (MORPH) to the size of what it now holds
  const morph = () => {
    if (!body || !content) return;
    const w = content.offsetWidth;
    const h = content.offsetHeight;
    if (!sized || reducedMotion()) {
      bodyW.jump(w);
      bodyH.jump(h);
      sized = true;
      return;
    }
    if (bodyW.target !== w) {
      bodyW.target = w;
      animate(bodyW, w, MORPH);
    }
    if (bodyH.target !== h) {
      bodyH.target = h;
      animate(bodyH, h, MORPH);
    }
  };

  function render() {
    const task = current();
    const showing = !!task || !!o.rest;
    if (showing && !wrap) buildIsland();
    if (!showing && wrap) removeIsland();
    if (!wrap) {
      syncAnnouncements();
      return;
    }
    const kind = !task ? 'rest' : expanded() ? 'list' : 'pill';
    if (kind !== contentKind) {
      const was = contentKind;
      content?.remove();
      content = kind === 'list' ? buildList() : kind === 'pill' ? buildPill() : buildRest();
      contentKind = kind;
      body.appendChild(content);
      if (kind === 'list' && focusList) {
        focusList = false;
        content.focus({ preventScroll: true });
      } else if (kind !== 'list' && was === 'list' && focusPill) {
        focusPill = false;
        skipOpen = true;
        content.focus({ preventScroll: true });
      }
    }
    if (kind === 'list') syncList();
    if (kind === 'pill') syncPill();
    syncPeeks();
    morph();
    syncAnnouncements();
    syncDismiss();
  }

  // Announce new tasks and status changes, not every progress tick.
  function syncAnnouncements() {
    for (const task of tasks) {
      if (lastStatus.get(task.id) !== task.status) {
        lastStatus.set(task.id, task.status);
        output.textContent = describe(task);
      }
    }
    const ids = new Set(tasks.map(task => task.id));
    for (const id of [...lastStatus.keys()]) {
      if (!ids.has(id)) {
        lastStatus.delete(id);
        doneAt.delete(id);
      }
    }
  }

  // Finished tasks leave on their own, but never while someone is reading.
  function syncDismiss() {
    timers.splice(0).forEach(t => clearTimeout(t));
    const dismiss = o.onDismiss || (o.autoRemove ? id => remove(id) : null);
    if (!dismiss || expanded()) return;
    const now = Date.now();
    for (const task of tasks) {
      if (task.status !== 'done') continue;
      const since = doneAt.get(task.id) ?? now;
      doneAt.set(task.id, since);
      const left = Math.max(0, o.dismissAfter - (now - since));
      timers.push(setTimeout(() => {
        o.onDismiss?.(task.id);
        if (o.autoRemove) remove(task.id);
      }, left));
    }
  }

  function setOpen(next) {
    if (open === next) return;
    const wasExpanded = expanded();
    open = next;
    // Reading restarts the clock, so a task doesn't vanish as the pointer leaves.
    if (expanded() && !wasExpanded) {
      const now = Date.now();
      for (const id of doneAt.keys()) doneAt.set(id, now);
    }
    render();
  }

  // A tap anywhere else closes the list on touch screens.
  const closeOutside = event => {
    if (!expanded()) return;
    if (!body?.contains(event.target)) setOpen(false);
  };
  document.addEventListener('pointerdown', closeOutside);

  function remove(id) {
    tasks = tasks.filter(task => task.id !== id);
    if (!tasks.length) open = false;
    render();
  }

  render();

  return {
    el: root,
    get tasks() {
      return tasks.map(t => ({ ...t }));
    },
    push(task) {
      tasks = [...tasks.filter(t => t.id !== task.id), { ...task }];
      render();
      return task.id;
    },
    update(id, patch) {
      tasks = tasks.map(task => (task.id === id ? { ...task, ...patch } : task));
      render();
    },
    remove,
    set(next) {
      tasks = [...next];
      if (!tasks.length) open = false;
      render();
    },
    open: () => setOpen(true),
    close: () => setOpen(false),
    destroy() {
      timers.splice(0).forEach(t => clearTimeout(t));
      document.removeEventListener('pointerdown', closeOutside);
      root.remove();
    }
  };
}

export default createStatusIsland;
