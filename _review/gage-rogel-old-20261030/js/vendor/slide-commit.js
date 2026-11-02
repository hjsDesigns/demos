// React Bits "Slide Commit" (DavidHDev/react-bits, MIT + Commons Clause), ported to plain JS for Gage's site, 2026-10-29.
// The original (SlideCommit.jsx / SlideCommit.css / registry-SlideCommit-JS-CSS.json) sits beside this file. Everything that
// moves is the original: the handle is a clip-path over the capsule that follows the drag, squashes against the left wall
// (8% max over 110 px) and swells 3% under a mouse; letting go short of the end springs it home (k = 260 + speed/100 * 640,
// mass .9, critical damping less returnBounce); reaching the end commits: onConfirm runs, a promise turns the arrow into the
// spinner (at least 300 ms), then the capsule unfurls back across into the done state with the tick (commit spring) and a
// 2.6% landing dip; a rejection shakes it (0 -5 5 -3 3 -1 0 px over .45 s) and shows the error text. Keys: arrows, End, Home.
// motion's MotionValue / animate() / spring are reproduced below from motion 12's source, so the curves are the original's.
// What is different:
//  - sizes come from layout boxes, and a drag turns screen px into layout px by a transformed parent's scale (the original
//    already divides by rect.width / width; here the reference is the track's layout width).
//  - every px of the original is calc(var(--sc-px, 1px) * n) (slide-commit.css); JS-side px (the pad, the squash distance,
//    the shake) are multiplied by the same unit, read from a hidden probe. width / height / radius are design px; the
//    travel is measured from the root's layout box, so a page's CSS may stretch the root (Gage: width 100% of its card).
//  - added: nudgeOnTap (off by default): a tap with no slide starts the handle on its way and springs it home, so a tap
//    answers too (Hayden's toddler law); api { el, phase, setLabel(), setDoneLabel(), setDisabled(), relayout(), reset(),
//    destroy() }.

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
const PAD = 4;
const SQUASH_MAX = 0.08;
const SQUASH_DIV = 110;
const SWELL = 1.03;
const MIN_PENDING = 300;
const EASE_OUT = [0.23, 1, 0.32, 1];
const SHAKE = [0, -5, 5, -3, 3, -1, 0];
const U = n => `calc(var(--sc-px, 1px) * ${n})`;

const onColor = hex => {
  const raw = hex.replace('#', '');
  const full = raw.length === 3 ? [...raw].map(ch => ch + ch).join('') : raw.slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return '#ffffff';
  const yiq = (((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000;
  return yiq >= 128 ? '#111111' : '#ffffff';
};
const velocityOf = hist => {
  if (hist.length < 2) return 0;
  const [t0, x0] = hist[0];
  const [t1, x1] = hist[hist.length - 1];
  return ((x1 - x0) / Math.max(1, t1 - t0)) * 1000;
};
const finePointer = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
const interpolate = (v, [i0, i1], [o0, o1]) => {
  const p = i1 === i0 ? 1 : clamp((v - i0) / (i1 - i0), 0, 1);
  return o0 + (o1 - o0) * p;
};

// @hugeicons/core-free-icons 4.3.3, drawn as <HugeiconsIcon> draws them
const ICONS = {
  ArrowRight02Icon: ['M18.5 12L4.99997 12', 'M13 18C13 18 19 13.5811 19 12C19 10.4188 13 6 13 6'],
  Tick02Icon: ['M5 14L8.5 17.5L19 6.5']
};
const NS = 'http://www.w3.org/2000/svg';
const hugeicon = (name, size, strokeWidth) => {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', strokeWidth);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'slide-commit__icon');
  svg.style.width = U(size);
  svg.style.height = U(size);
  for (const d of ICONS[name]) {
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-width', strokeWidth);
    svg.appendChild(path);
  }
  return svg;
};
const spinner = size => {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'slide-commit__spinner');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.width = U(size);
  svg.style.height = U(size);
  svg.innerHTML =
    '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-opacity="0.25"/>' +
    '<path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>';
  return svg;
};
const span = (className, text) => {
  const node = document.createElement('span');
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

export function createSlideCommit(host, opts = {}) {
  const o = {
    label: 'Slide to pay',
    doneLabel: 'Paid',
    errorLabel: 'Payment failed',
    onConfirm: undefined,
    onDone: undefined,
    onError: undefined,
    trackColor: '#262626',
    handleColor: '#f5f5f5',
    successColor: '#22c55e',
    dangerColor: '#e5484d',
    width: 280,
    height: 56,
    radius: 28,
    speed: 50,
    returnBounce: 0.38,
    landingDip: 0.026,
    holdMs: 1500,
    disabled: false,
    icon: undefined,
    className: '',
    nudgeOnTap: false,
    ...opts
  };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let phase = 'idle';
  let held = false;
  let hot = false;
  let timer = 0;
  let homeTimer = 0;
  let run = 0;
  let unwatch = null;
  let grip = null;
  let lastPercent = 0;

  // ---- DOM (the JSX) ----
  const root = document.createElement('div');
  root.className = `slide-commit${o.className ? ` ${o.className}` : ''}`;
  const probe = span('slide-commit__probe');
  probe.setAttribute('aria-hidden', 'true');
  const trackEl = document.createElement('div');
  trackEl.className = 'slide-commit__track';
  const labelEl = span('slide-commit__label');
  labelEl.setAttribute('aria-hidden', 'true');
  const plainEl = span('slide-commit__text slide-commit__text--plain');
  const errorEl = span('slide-commit__text slide-commit__text--error');
  labelEl.append(plainEl, errorEl);
  const capsule = document.createElement('div');
  capsule.className = 'slide-commit__capsule';
  capsule.setAttribute('role', 'slider');
  capsule.setAttribute('aria-valuemin', '0');
  capsule.setAttribute('aria-valuemax', '100');
  capsule.setAttribute('aria-valuenow', '0');
  const content = document.createElement('div');
  content.className = 'slide-commit__content';
  const arrowEl = span('slide-commit__arrow');
  arrowEl.setAttribute('aria-hidden', 'true');
  const spinEl = span('slide-commit__spin');
  spinEl.setAttribute('aria-hidden', 'true');
  const doneEl = span('slide-commit__done');
  doneEl.setAttribute('aria-hidden', 'true');
  const doneText = span();
  content.append(arrowEl, spinEl, doneEl);
  capsule.appendChild(content);
  const srEl = span('slide-commit__sr');
  srEl.setAttribute('aria-live', 'polite');
  trackEl.append(labelEl, capsule, srEl);
  root.append(trackEl, probe);
  host.appendChild(root);
  const unit = () => (probe.offsetWidth || 100) / 100;

  // design-px geometry (the original's constants); JS math runs in layout px = design px × unit
  const r = clamp(o.radius, 0, o.height / 2);
  const gripRDesign = Math.max(0, r - PAD);
  const fontSize = clamp(Math.round(o.height * 0.25), 13, 17);
  const iconSize = Math.round((o.height - PAD * 2) * 0.42);
  const geo = () => {
    // the root's layout box (o.width × o.height design px unless the page's CSS sizes it), so a page can stretch it
    const k = unit();
    const W = root.offsetWidth || o.width * k;
    const H = root.offsetHeight || o.height * k;
    const GRIP = H - PAD * 2 * k;
    const INNER = W - PAD * 2 * k;
    return { k, GRIP, INNER, TRAVEL: Math.max(1, INNER - GRIP), gripR: gripRDesign * k };
  };
  const spring = () => {
    const k0 = 260 + (clamp(o.speed, 0, 100) / 100) * 640;
    const mass = 0.9;
    const critical = 2 * Math.sqrt(k0 * mass);
    const commitSpring = { type: 'spring', stiffness: k0, damping: critical, mass };
    return { commitSpring, homeSpring: { ...commitSpring, damping: critical * (1 - clamp(o.returnBounce, 0, 0.5)) } };
  };

  const applyStyle = () => {
    root.style.width = U(o.width);
    root.style.height = U(o.height);
    const vars = {
      '--sc-track': o.trackColor,
      '--sc-ink': o.handleColor,
      '--sc-ok': o.successColor,
      '--sc-no': o.dangerColor,
      '--sc-on-ink': onColor(o.handleColor),
      '--sc-on-ok': onColor(o.successColor),
      '--sc-on-no': onColor(o.dangerColor),
      '--sc-radius': U(r),
      '--sc-grip-r': U(gripRDesign),
      '--sc-pad': U(PAD),
      '--sc-font': U(fontSize)
    };
    for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value);
  };
  applyStyle();

  const labelText = () => (typeof o.label === 'string' ? o.label : 'Slide to confirm');
  const fillText = () => {
    plainEl.textContent = o.label;
    errorEl.textContent = o.errorLabel;
    capsule.setAttribute('aria-label', labelText());
    arrowEl.replaceChildren(o.icon instanceof Node ? o.icon : hugeicon('ArrowRight02Icon', iconSize, 2));
    spinEl.replaceChildren(spinner(iconSize));
    doneText.textContent = o.doneLabel;
    doneEl.replaceChildren(hugeicon('Tick02Icon', Math.round((o.height - PAD * 2) * 0.38), 2.5), doneText);
  };
  fillText();

  // ---- motion values ----
  const x = new MotionValue(0);
  const anchor = new MotionValue(0);
  const shown = new MotionValue(1);
  const spin = new MotionValue(0);
  const pulse = new MotionValue(1);
  const shake = new MotionValue(0);
  const doneOpacity = new MotionValue(0);
  const doneScale = new MotionValue(reduce ? 1 : 0.95);

  let queued = false;
  const paint = () => {
    queued = false;
    const { k, GRIP, INNER, TRAVEL, gripR } = geo();
    const v = x.get();
    const seen = clamp(v, 0, TRAVEL);
    const edge = seen + GRIP + clamp(anchor.get() - seen, 0, TRAVEL);
    capsule.style.clipPath = `inset(0 ${INNER - edge}px 0 0 round ${gripR}px)`;
    content.style.transform = `translateX(${(seen + edge) / 2 - INNER / 2}px)`;
    const swell = hot && !held && phase === 'idle' && !reduce ? SWELL : 1;
    const q = 1 - Math.min(SQUASH_MAX, Math.max(0, -v) / (SQUASH_DIV * k));
    capsule.style.transform = `scale(${q * swell}, ${swell / q})`;
    capsule.style.transformOrigin = `${seen}px 50%`;
    labelEl.style.opacity = interpolate(seen, [0, TRAVEL * 0.55], [1, 0]);
    arrowEl.style.opacity = shown.get() * clamp(1 - (seen - TRAVEL * 0.55) / (TRAVEL * 0.4), 0, 1);
    spinEl.style.opacity = spin.get();
    doneEl.style.opacity = doneOpacity.get();
    doneEl.style.transform = `scale(${doneScale.get()})`;
    trackEl.style.transform = `translateX(${shake.get() * k}px) scale(${pulse.get()})`;
    const percent = Math.round((seen / TRAVEL) * 100);
    if (percent !== lastPercent) {
      lastPercent = percent;
      capsule.setAttribute('aria-valuenow', String(percent));
      capsule.setAttribute('aria-valuetext', `${labelText()}, ${percent}%`);
    }
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    queueMicrotask(paint);
  };
  [x, anchor, shown, spin, pulse, shake, doneOpacity, doneScale].forEach(mv => mv.on(schedule));

  const state = () => {
    root.dataset.phase = phase;
    if (held) root.dataset.held = '';
    else delete root.dataset.held;
    if (o.disabled) root.dataset.disabled = '';
    else delete root.dataset.disabled;
    capsule.tabIndex = o.disabled ? -1 : 0;
    if (phase === 'pending') capsule.setAttribute('aria-busy', 'true');
    else capsule.removeAttribute('aria-busy');
    if (o.disabled) capsule.setAttribute('aria-disabled', 'true');
    else capsule.removeAttribute('aria-disabled');
    srEl.textContent = phase === 'pending' ? 'Working' : phase === 'done' ? o.doneLabel : phase === 'error' ? o.errorLabel : '';
    schedule();
  };
  const setPhase = next => {
    const wasDone = phase === 'done';
    phase = next;
    const done = phase === 'done';
    if (done !== wasDone) {
      animate(doneOpacity, done ? 1 : 0, { duration: 0.2, ease: EASE_OUT });
      animate(doneScale, done || reduce ? 1 : 0.95, { duration: 0.2, ease: EASE_OUT });
    }
    state();
  };
  state();

  // ---- the original's handlers ----
  const local = clientX => {
    const rect = trackEl.getBoundingClientRect();
    if (!rect || !rect.width) return 0;
    return (clientX - rect.left) * (trackEl.offsetWidth / rect.width);
  };

  const goHome = velocity => {
    const { homeSpring } = spring();
    if (reduce) animate(x, 0, { duration: 0.2, ease: EASE_OUT });
    else animate(x, 0, { ...homeSpring, velocity: Math.min(0, velocity) });
  };

  const settle = () => {
    setPhase('idle');
    animate(shown, 1, { duration: 0.2, delay: 0.12 });
    if (reduce) anchor.set(0);
    else animate(anchor, 0, { type: 'spring', duration: 0.3, bounce: 0 });
  };

  const resolve = viaKey => {
    setPhase('done');
    anchor.set(x.get());
    animate(spin, 0, { duration: 0.12 });
    if (reduce) x.set(0);
    else {
      animate(x, 0, spring().commitSpring);
      if (!viaKey && o.landingDip > 0) {
        animate(pulse, [1, 1 - o.landingDip, 1], { duration: 0.46, times: [0, 0.62, 1], ease: EASE_OUT, delay: 0.1 });
      }
    }
    o.onDone?.();
    if (o.holdMs > 0) timer = setTimeout(settle, o.holdMs);
  };

  const reject = reason => {
    setPhase('error');
    o.onError?.(reason);
    animate(spin, 0, { duration: 0.12 });
    animate(shown, 1, { duration: 0.2, delay: 0.12 });
    if (reduce) goHome(0);
    else {
      animate(shake, SHAKE, { duration: 0.45, ease: EASE_OUT });
      homeTimer = setTimeout(() => {
        if (!grip) goHome(0);
      }, 300);
    }
    timer = setTimeout(() => setPhase('idle'), Math.max(o.holdMs, 1500));
  };

  const commit = viaKey => {
    clearTimeout(timer);
    const id = ++run;
    x.set(geo().TRAVEL);
    let out;
    try {
      out = o.onConfirm?.();
    } catch (reason) {
      reject(reason);
      return;
    }
    const pending = out && typeof out.then === 'function' ? out : null;
    if (!pending) {
      animate(shown, 0, { duration: 0.12 });
      resolve(viaKey);
      return;
    }
    setPhase('pending');
    animate(shown, 0, { duration: 0.2 });
    animate(spin, 1, { duration: 0.2 });
    const t0 = performance.now();
    const later = fn => {
      setTimeout(() => {
        if (id === run) fn();
      }, Math.max(0, MIN_PENDING - (performance.now() - t0)));
    };
    pending.then(
      () => later(() => resolve(viaKey)),
      reason => later(() => reject(reason))
    );
  };

  const down = e => {
    if (o.disabled || grip || phase === 'pending' || phase === 'done' || e.button !== 0) return;
    x.stop();
    grip = { id: e.pointerId, grab: null, moved: false, hist: [] };
    held = true;
    state();
    try {
      trackEl.setPointerCapture(e.pointerId);
    } catch {}
    unwatch?.();
    const onMove = ev => ev.isTrusted && move(ev);
    const onUp = ev => ev.isTrusted && up(ev);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    unwatch = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      unwatch = null;
    };
  };

  const move = e => {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    const at = local(e.clientX);
    if (g.grab === null) {
      g.grab = at - x.get();
      return;
    }
    const next = clamp(at - g.grab, 0, geo().TRAVEL);
    if (Math.abs(next - x.get()) > 0.5) g.moved = true;
    g.hist.push([e.timeStamp, next]);
    if (g.hist.length > 4) g.hist.shift();
    x.set(next);
  };

  const up = e => {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    grip = null;
    unwatch?.();
    try {
      trackEl.releasePointerCapture(e.pointerId);
    } catch {}
    held = false;
    state();
    if (x.get() >= geo().TRAVEL) commit(false);
    else if (g.moved) goHome(velocityOf(g.hist));
    else if (o.nudgeOnTap && phase === 'idle' && !reduce) {
      // added (nudgeOnTap): a tap with no slide shows which way to go: the handle starts the trip and springs home
      animate(x, geo().TRAVEL * 0.22, { ...spring().commitSpring, velocity: 0 }).then(() => {
        if (!grip && phase === 'idle') goHome(0);
      });
    }
  };

  const onKeyDown = e => {
    if (o.disabled || phase === 'pending' || phase === 'done') return;
    const { TRAVEL } = geo();
    const step = TRAVEL / 10;
    if (e.key === 'End') {
      e.preventDefault();
      commit(true);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(TRAVEL, x.get() + step);
      x.set(next);
      if (next >= TRAVEL) commit(true);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      x.set(Math.max(0, x.get() - step));
    } else if (e.key === 'Home' || e.key === 'Escape') {
      e.preventDefault();
      if (grip) up({ pointerId: grip.id });
      else x.set(0);
    }
  };

  trackEl.addEventListener('pointerdown', down);
  capsule.addEventListener('pointerenter', e => {
    if (e.pointerType === 'mouse' && finePointer()) {
      hot = true;
      schedule();
    }
  });
  capsule.addEventListener('pointerleave', () => {
    hot = false;
    schedule();
  });
  capsule.addEventListener('keydown', onKeyDown);
  const observer = new ResizeObserver(schedule);
  observer.observe(root);
  schedule();

  return {
    el: root,
    get phase() {
      return phase;
    },
    setLabel(label) {
      o.label = label;
      fillText();
      schedule();
    },
    setDoneLabel(label) {
      o.doneLabel = label;
      fillText();
      state();
    },
    setDisabled(disabled) {
      o.disabled = !!disabled;
      state();
    },
    // added: re-read the layout box (call once the page's CSS has loaded)
    relayout: () => schedule(),
    // added: back to the start (the original only returns there by itself after holdMs)
    reset() {
      clearTimeout(timer);
      clearTimeout(homeTimer);
      run += 1;
      grip = null;
      unwatch?.();
      held = false;
      x.jump(0);
      anchor.jump(0);
      shown.jump(1);
      spin.jump(0);
      shake.jump(0);
      pulse.jump(1);
      setPhase('idle');
    },
    destroy() {
      clearTimeout(timer);
      clearTimeout(homeTimer);
      unwatch?.();
      run += 1;
      observer.disconnect();
      root.remove();
    }
  };
}

export default createSlideCommit;
