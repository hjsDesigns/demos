// React Bits "Rubber Segment" (DavidHDev/react-bits, MIT + Commons Clause), ported to plain JS for Gage's site, 2026-10-29.
// The original (RubberSegment.jsx / RubberSegment.css / registry-RubberSegment-JS-CSS.json) sits beside this file. Everything
// that moves is the original: the thumb is a clip-path over a second copy of the labels (so the text inverts inside it), a
// tap stretches the thumb across to the new slot in 190 ms (EASE_OUT), hands off at 150 ms to the landing spring (0.3 s, no
// bounce) with the trailing edge squashing 3 px past and relaxing back (0.16 s), the thumb drags with rubber-band edges,
// flicks project with the glide constant, keys move it. motion's MotionValue / animate() / spring are reproduced below from
// motion 12's source (duration + bounce resolved to stiffness and damping by the same root-finding, tweens on the same
// cubic-bezier, velocity tracked the same way), so the curves are the original's.
// What is different:
//  - sizes come from layout boxes (offsetLeft / offsetWidth / the track's padding), never getBoundingClientRect(): on Gage's
//    page it sits inside a CSS-3D-scaled parent. A drag turns screen px into layout px by that parent's scale.
//  - every px of the original is calc(var(--rs-px, 1px) * n) (rubber-segment.css); JS-side px (squash, flick speed, dead
//    zone, slop, the velocity cap) are multiplied by the same unit, read from a hidden probe.
//  - added: value null = nothing picked yet (no thumb); the first pick opens the thumb out of the tapped slot's middle on the
//    original landing spring. items may carry a Node label (cloned for the thumb's copy). api: { el, value, set(value),
//    setItems(items, value), setDisabled(bool), relayout(), destroy() }.

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
const SPRING_UI = { type: 'spring', duration: 0.3, bounce: 0 };
const SPRING_MOMENTUM = { type: 'spring', duration: 0.4, bounce: 0.2 };
const SPRING_RELAX = { type: 'spring', duration: 0.16, bounce: 0 };
const DILATE = 0.19;
const HANDOFF = 0.15;
const FLICK = 110;
const MAX_VELOCITY = 2000;
const DEADZONE = 4;
const SLOP = 10;
const RUBBER = 0.55;
const SIZES = {
  sm: { height: 28, font: 12, pad: 10, min: 36 },
  md: { height: 36, font: 13, pad: 14, min: 44 },
  lg: { height: 44, font: 14, pad: 18, min: 48 }
};
const U = n => `calc(var(--rs-px, 1px) * ${n})`;

const rubber = (over, dim) => (over * dim * RUBBER) / (dim + RUBBER * Math.abs(over));
const project = (v, glide) => {
  const d = 1 - 0.1 * Math.pow(0.05, glide / 100);
  return ((v / 1000) * d) / (1 - d);
};
const velocityOf = (hist, time) => {
  const recent = hist.filter(([t]) => time - t <= 100);
  if (recent.length < 2) return 0;
  const [t0, x0] = recent[0];
  const [t1, x1] = recent[recent.length - 1];
  return t1 - t0 >= 8 ? ((x1 - x0) / (t1 - t0)) * 1000 : 0;
};
const nearestSlot = (slots, x) => {
  let best = 0;
  for (let i = 1; i < slots.length; i++) {
    if (Math.abs((slots[i].l + slots[i].r) / 2 - x) < Math.abs((slots[best].l + slots[best].r) / 2 - x)) best = i;
  }
  return best;
};

export function createRubberSegment(host, opts = {}) {
  const o = {
    items: [],
    value: undefined,
    defaultValue: undefined,
    onChange: undefined,
    trackColor: '#27272a',
    thumbColor: '#fafafa',
    textColor: '#fafafa',
    activeTextColor: '#18181b',
    size: 'md',
    radius: 10,
    inset: 3,
    equalSlots: true,
    stretch: 100,
    squash: 3,
    speed: 1,
    glide: 75,
    draggable: true,
    disabled: false,
    className: '',
    ariaLabel: 'Segmented control',
    ...opts
  };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let list = [];
  let index = -1;
  const t = seconds => seconds / o.speed;

  const track = document.createElement('div');
  track.setAttribute('role', 'radiogroup');
  track.className = `rubber-segment${o.className ? ` ${o.className}` : ''}`;
  const probe = document.createElement('span');
  probe.className = 'rubber-segment__probe';
  probe.setAttribute('aria-hidden', 'true');
  const thumb = document.createElement('div');
  thumb.className = 'rubber-segment__thumb';
  thumb.setAttribute('aria-hidden', 'true');
  let itemEls = [];
  const unit = () => (probe.offsetWidth || 100) / 100;
  const insetPx = () => parseFloat(getComputedStyle(track).paddingLeft) || 0;

  const applyStyle = () => {
    const preset = SIZES[o.size] || SIZES.md;
    const thumbRadius = Math.max(0, o.radius - o.inset);
    track.setAttribute('aria-label', o.ariaLabel);
    if (o.disabled) track.setAttribute('aria-disabled', 'true');
    else track.removeAttribute('aria-disabled');
    if (o.equalSlots) track.dataset.equal = '';
    else delete track.dataset.equal;
    if (o.draggable && !o.disabled) track.dataset.draggable = '';
    else delete track.dataset.draggable;
    const vars = {
      '--rs-track': o.trackColor,
      '--rs-thumb': o.thumbColor,
      '--rs-ink': o.textColor,
      '--rs-ink-active': o.activeTextColor,
      '--rs-radius': U(o.radius),
      '--rs-inset': U(o.inset),
      '--rs-thumb-radius': U(thumbRadius),
      '--rs-h': U(preset.height),
      '--rs-font': U(preset.font),
      '--rs-pad': U(preset.pad),
      '--rs-min': U(preset.min)
    };
    for (const [name, value] of Object.entries(vars)) track.style.setProperty(name, value);
  };

  const slots = { current: [] };
  let box = null;
  let committed = -1;
  let handoff = 0;
  let drag = null;
  let gen = 0;

  const edgeL = new MotionValue(0);
  const edgeR = new MotionValue(0);
  const innerW = new MotionValue(0);
  let queued = false;
  const paint = () => {
    queued = false;
    thumb.style.clipPath = `inset(0 ${Math.max(0, innerW.get() - edgeR.get())}px 0 ${Math.max(0, edgeL.get())}px round var(--rs-thumb-radius))`;
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    queueMicrotask(paint);
  };
  edgeL.on(schedule);
  edgeR.on(schedule);
  innerW.on(schedule);

  const jumpTo = i => {
    clearTimeout(handoff);
    gen += 1;
    const s = slots.current[i];
    if (!s) {
      // added: nothing picked, no thumb
      edgeL.jump(0);
      edgeR.jump(0);
      return;
    }
    edgeL.jump(s.l);
    edgeR.jump(s.r);
  };

  const measure = () => {
    if (!track.isConnected) return;
    const inset = insetPx();
    slots.current = list.map((_, i) => {
      const item = itemEls[i];
      if (!item) return { l: 0, r: 0 };
      return { l: item.offsetLeft - inset, r: item.offsetLeft + item.offsetWidth - inset };
    });
    innerW.set(track.offsetWidth - inset * 2);
    jumpTo(committed);
  };

  const labelNode = (item, copy) => {
    const frag = document.createDocumentFragment();
    if (item.icon) frag.appendChild(item.icon instanceof Node ? (copy ? item.icon.cloneNode(true) : item.icon) : document.createTextNode(item.icon));
    if (item.label instanceof Node) frag.appendChild(copy ? item.label.cloneNode(true) : item.label);
    else if (item.label !== undefined && item.label !== null) frag.appendChild(document.createTextNode(String(item.label)));
    return frag;
  };

  const build = () => {
    track.replaceChildren();
    thumb.replaceChildren();
    itemEls = list.map((item, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('role', 'radio');
      button.className = 'rubber-segment__item';
      button.appendChild(labelNode(item, false));
      button.addEventListener('pointerdown', event => handlePointerDown(event, i));
      button.addEventListener('keydown', handleKeyDown);
      track.appendChild(button);
      const copy = document.createElement('span');
      copy.className = 'rubber-segment__item rubber-segment__copy';
      copy.appendChild(labelNode(item, true));
      thumb.appendChild(copy);
      return button;
    });
    track.appendChild(thumb);
    track.appendChild(probe);
    syncChecked();
  };

  const syncChecked = () => {
    itemEls.forEach((button, i) => {
      button.setAttribute('aria-checked', String(i === index));
      button.tabIndex = i === index || (index < 0 && i === 0) ? 0 : -1;
      button.disabled = !!o.disabled;
    });
  };

  const commit = i => {
    committed = i;
    if (i === index) return;
    index = i;
    syncChecked();
    o.onChange?.(list[i].value, i);
  };

  const land = (to, v, flick, withSquash) => {
    const b = slots.current[to];
    if (!b) return;
    const g = ++gen;
    const k = unit();
    const dir = Math.sign((b.l + b.r) / 2 - (edgeL.get() + edgeR.get()) / 2) || 1;
    const [lead, leadTo, trail, trailTo] = dir > 0 ? [edgeR, b.r, edgeL, b.l] : [edgeL, b.l, edgeR, b.r];
    const velocityFor = mv => clamp(v === null ? mv.getVelocity() : v, -MAX_VELOCITY * k, MAX_VELOCITY * k);
    animate(lead, leadTo, {
      ...(flick ? SPRING_MOMENTUM : SPRING_UI),
      duration: t(flick ? 0.4 : 0.3),
      velocity: velocityFor(lead)
    });
    const trailVelocity = velocityFor(trail);
    if (!withSquash || o.squash <= 0) {
      animate(trail, trailTo, { ...SPRING_UI, duration: t(0.3), velocity: trailVelocity });
      return;
    }
    animate(trail, trailTo + dir * o.squash * k, { ...SPRING_UI, duration: t(0.3), velocity: trailVelocity }).then(() => {
      if (gen === g) animate(trail, trailTo, { ...SPRING_RELAX, duration: t(0.16) });
    });
  };

  const travel = (from, to) => {
    const a = slots.current[from];
    const b = slots.current[to];
    if (!b) return;
    clearTimeout(handoff);
    gen += 1;
    if (reduce) {
      edgeL.jump(b.l);
      edgeR.jump(b.r);
      return;
    }
    if (!a) {
      // added: the first pick: the thumb opens out of the slot's middle on the landing spring
      const mid = (b.l + b.r) / 2;
      edgeL.jump(mid);
      edgeR.jump(mid);
      animate(edgeL, b.l, { ...SPRING_UI, duration: t(0.3), velocity: 0 });
      animate(edgeR, b.r, { ...SPRING_UI, duration: t(0.3), velocity: 0 });
      return;
    }
    const u = o.stretch / 100;
    const tween = { duration: t(DILATE), ease: EASE_OUT };
    animate(edgeL, b.l + (Math.min(a.l, b.l) - b.l) * u, tween);
    animate(edgeR, b.r + (Math.max(a.r, b.r) - b.r) * u, tween);
    handoff = setTimeout(() => land(to, null, false, true), t(HANDOFF) * 1000);
  };

  // screen px → layout px (a transformed parent's scale; 1 on a flat page)
  const localX = e => {
    const width = box && box.width ? box.width : track.offsetWidth;
    return (e.clientX - (box ? box.left : 0)) * (track.offsetWidth / (width || 1)) - insetPx();
  };

  const handlePointerDown = (e, i) => {
    if (o.disabled || drag || e.button !== 0) return;
    box = track.getBoundingClientRect();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    const x = localX(e);
    const onThumb = o.draggable && index >= 0 && x >= edgeL.get() && x <= edgeR.get();
    drag = { id: e.pointerId, x0: x, slot: i, onThumb, live: false, offset: 0, w: 0, hist: [[e.timeStamp, x]] };
    if (onThumb) {
      clearTimeout(handoff);
      gen += 1;
      edgeL.stop();
      edgeR.stop();
    } else if (!reduce) {
      e.currentTarget.dataset.pressed = '';
    }
  };

  const handlePointerMove = e => {
    const d = drag;
    if (!d || e.pointerId !== d.id || !d.onThumb) return;
    const x = localX(e);
    d.hist.push([e.timeStamp, x]);
    if (d.hist.length > 8) d.hist.shift();
    if (!d.live) {
      if (Math.abs(x - d.x0) < DEADZONE * unit()) return;
      d.live = true;
      d.offset = x - edgeL.get();
      d.w = edgeR.get() - edgeL.get();
      track.dataset.held = '';
    }
    const width = innerW.get();
    const l = x - d.offset;
    const maxL = width - d.w;
    if (reduce) {
      const c = clamp(l, 0, maxL);
      edgeL.set(c);
      edgeR.set(c + d.w);
    } else if (l < 0) {
      edgeL.set(0);
      edgeR.set(d.w - rubber(-l, d.w));
    } else if (l > maxL) {
      edgeR.set(width);
      edgeL.set(maxL + rubber(l - maxL, d.w));
    } else {
      edgeL.set(l);
      edgeR.set(l + d.w);
    }
  };

  const release = () => {
    const d = drag;
    drag = null;
    delete track.dataset.held;
    const item = itemEls[d.slot];
    if (item) delete item.dataset.pressed;
    return d;
  };

  const handlePointerUp = e => {
    const d = drag;
    if (!d || e.pointerId !== d.id) return;
    release();
    const x = localX(e);
    if (!d.live) {
      if (Math.abs(x - d.x0) <= SLOP * unit() && d.slot !== committed) {
        const from = committed;
        commit(d.slot);
        travel(from, d.slot);
      }
      return;
    }
    const v = velocityOf(d.hist, e.timeStamp);
    const flick = Math.abs(v) > FLICK * unit();
    let to = nearestSlot(slots.current, (edgeL.get() + edgeR.get()) / 2 + project(v, o.glide));
    if (flick && to === committed) to = clamp(to + Math.sign(v), 0, list.length - 1);
    commit(to);
    if (reduce) jumpTo(to);
    else land(to, v, flick, flick);
  };

  const handlePointerCancel = e => {
    const d = drag;
    if (!d || e.pointerId !== d.id) return;
    release();
    if (!d.live) return;
    if (reduce) jumpTo(committed);
    else land(committed, null, false, false);
  };

  function handleKeyDown(e) {
    if (o.disabled) return;
    const last = list.length - 1;
    let next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = Math.min(last, index + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = Math.max(0, index - 1);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    if (next === null) return;
    e.preventDefault();
    if (next === index) return;
    commit(next);
    jumpTo(next);
    itemEls[next]?.focus();
  }

  track.addEventListener('pointermove', handlePointerMove);
  track.addEventListener('pointerup', handlePointerUp);
  track.addEventListener('pointercancel', handlePointerCancel);
  track.addEventListener('lostpointercapture', handlePointerCancel);

  const setItems = (items, value) => {
    list = (items || []).map(item => (typeof item === 'string' ? { value: item, label: item } : item));
    const want = value !== undefined ? value : o.defaultValue !== undefined ? o.defaultValue : list[0]?.value;
    index = want === null ? -1 : Math.max(0, list.findIndex(item => item.value === want));
    committed = index;
    build();
    measure();
  };

  applyStyle();
  host.appendChild(track);
  setItems(o.items, o.value !== undefined ? o.value : o.defaultValue);
  const observer = new ResizeObserver(measure);
  observer.observe(track);
  if (document.fonts) document.fonts.ready.then(measure);

  return {
    el: track,
    get value() {
      return index >= 0 ? list[index]?.value : null;
    },
    set(value) {
      const i = value === null ? -1 : list.findIndex(item => item.value === value);
      if (i === index) return;
      index = i;
      committed = i;
      syncChecked();
      jumpTo(i);
    },
    setItems,
    // added: measure the slots again (call once the page's CSS has loaded)
    relayout: measure,
    setDisabled(disabled) {
      o.disabled = !!disabled;
      applyStyle();
      syncChecked();
    },
    destroy() {
      observer.disconnect();
      clearTimeout(handoff);
      edgeL.stop();
      edgeR.stop();
      track.remove();
    }
  };
}

export default createRubberSegment;
