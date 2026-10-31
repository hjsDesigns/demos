// Skiper UI "Smooth caret input" (skiper-ui.com/v1/skiper106, by gxuri), ported to plain JS for Gage's site, 2026-10-30.
// LICENSE (Skiper UI's own words on that page): "Free to use and modify in both personal and commercial projects.
// Attribution to Skiper UI is required when using the free version. No attribution required with Skiper UI Pro."
// So a site that ships this needs a visible credit to Skiper UI (see README.md beside this file).
// The original (skiper106.tsx / registry-skiper106.json) sits beside this file. Everything that moves is the original: the
// native caret is hidden (caret-color: transparent) and a 2 px bar, 0.9em tall, follows the caret on a spring
// (stiffness 500, damping 30, mass 0.5; reduced motion 10000 / 100 / 0.1), its x measured from a hidden span carrying the
// input's exact font (password dots counted as dots), the field scrolled so the caret stays in view, hidden while text is
// selected or the input is blurred, re-measured on selection change, typing, scroll, font load and resize.
// motion's MotionValue / useSpring / spring are reproduced below from motion 12's source.
// What is different:
//  - dialkit (the demo's live tweak panel) is not part of a site: its defaults are the options here (fontSize 24, the
//    spring, placeholder "smooth input", type text). The demo's second "normal input" is not ported.
//  - every px of the original is calc(var(--si-px, 1px) * n) (smooth-input.css); colours are --si-* variables (Skiper's
//    theme tokens muted2 / muted3 / primary are not published, so the defaults are close dark greys and white).
//  - placeholder: '' is kept empty (the original always falls back to "smooth input").
//  - added: multiline: true puts the same caret on a <textarea> (x and y on the same spring, placed with a hidden mirror of
//    the box so wrapped lines land right). api: { el, input, value, set(v), focus(), destroy() }.

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
const U = n => `calc(var(--si-px, 1px) * ${n})`;
const UA = typeof navigator === 'undefined' ? '' : navigator.userAgent;
const PASSWORD_CHAR = /firefox|fxios/i.test(UA) ? '\u25CF' : '\u2022';

// motion's useSpring(source, config): every change of the source starts a spring from where the follower is, carrying its
// velocity (restDelta 0.001, restSpeed 0.01, then the config)
function follow(source, config) {
  const value = new MotionValue(source.get());
  source.on(target => {
    animate(value, target, { type: 'spring', restDelta: 0.001, restSpeed: 0.01, ...config, velocity: value.getVelocity() });
  });
  return value;
}

export function createSmoothInput(host, opts = {}) {
  const o = {
    type: 'text',
    placeholder: 'smooth input',
    value: undefined,
    defaultValue: '',
    onChange: undefined,
    onBlur: undefined,
    fontSize: 24,
    spring: { type: 'spring', stiffness: 500, damping: 30, mass: 0.5 },
    className: '',
    wrapperClassName: '',
    attrs: {},
    multiline: false,
    rows: 3,
    ...opts
  };
  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- the JSX ----
  const wrapper = document.createElement('div');
  wrapper.className = `smooth-input${o.multiline ? ' smooth-input--multi' : ''} ${o.wrapperClassName}`.trim();
  const container = document.createElement('div');
  container.className = 'smooth-input__box';
  container.style.caretColor = 'transparent';
  container.style.fontSize = typeof o.fontSize === 'number' ? U(o.fontSize) : o.fontSize;
  const input = document.createElement(o.multiline ? 'textarea' : 'input');
  for (const [name, value] of Object.entries(o.attrs || {})) {
    if (value === false || value === undefined || value === null) continue;
    input.setAttribute(name, value === true ? '' : value);
  }
  if (!o.multiline) input.type = o.type;
  else input.rows = o.rows;
  input.placeholder = o.placeholder ?? 'smooth input';   // '' allowed (the original falls back to "smooth input")
  input.className = `smooth-input__field ${o.className}`.trim();
  input.value = o.value !== undefined ? String(o.value) : String(o.defaultValue ?? '');
  const measure = document.createElement('span');
  measure.className = 'smooth-input__measure';
  measure.setAttribute('aria-hidden', 'true');
  const caret = document.createElement('div');
  caret.className = 'smooth-input__caret';
  container.append(input, measure, caret);
  wrapper.appendChild(container);
  host.appendChild(wrapper);

  const caretX = new MotionValue(0);
  const caretY = new MotionValue(0);
  const caretOpacity = new MotionValue(0);
  const springConfig = prefersReducedMotion ? { type: 'spring', stiffness: 10000, damping: 100, mass: 0.1 } : o.spring;
  const springCaretX = follow(caretX, springConfig);
  const springCaretY = follow(caretY, springConfig);
  let queued = false;
  const paint = () => {
    queued = false;
    caret.style.transform = o.multiline
      ? `translate(${springCaretX.get()}px, ${springCaretY.get()}px)`
      : `translateX(${springCaretX.get()}px)`;
    caret.style.opacity = String(caretOpacity.get());
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    queueMicrotask(paint);
  };
  [springCaretX, springCaretY, caretOpacity].forEach(mv => mv.on(schedule));
  paint();

  const syncMeasureSpan = () => {
    const styles = window.getComputedStyle(input);
    const isPassword = input.type === 'password';
    let fontSize = styles.fontSize;
    if (PASSWORD_CHAR === '\u2022' && isPassword && !/chrome|chromium|crios/i.test(UA)) {
      fontSize = `${parseFloat(fontSize) + 6.25}px`;
    }
    measure.style.font = `${styles.fontStyle} ${styles.fontWeight} ${fontSize} ${styles.fontFamily}`;
    measure.style.letterSpacing = styles.letterSpacing;
    measure.style.fontFeatureSettings = styles.fontFeatureSettings;
    measure.style.fontVariationSettings = styles.fontVariationSettings;
  };

  const measurePrefixWidth = text => {
    syncMeasureSpan();
    measure.textContent = text;
    const paddingLeft = parseFloat(window.getComputedStyle(input).paddingLeft) || 0;
    return text.length > 0 ? measure.offsetWidth + paddingLeft : paddingLeft - 1;
  };

  const scrollCaretIntoView = (target, absoluteWidth) => {
    const styles = window.getComputedStyle(target);
    const paddingLeft = parseFloat(styles.paddingLeft) || 0;
    const paddingRight = parseFloat(styles.paddingRight) || 0;
    const maxScroll = Math.max(0, target.scrollWidth - target.clientWidth);
    const visibleRight = target.scrollLeft + target.clientWidth - paddingRight;
    const visibleLeft = target.scrollLeft + paddingLeft;
    if (absoluteWidth > visibleRight) {
      target.scrollLeft = Math.min(absoluteWidth - target.clientWidth + paddingRight, maxScroll);
      return;
    }
    if (absoluteWidth < visibleLeft) target.scrollLeft = Math.max(0, absoluteWidth - paddingLeft);
  };

  const getCaretIndex = target => {
    const selectionStart = target.selectionStart ?? 0;
    const selectionEnd = target.selectionEnd ?? 0;
    if (selectionStart === selectionEnd) return selectionStart;
    return target.selectionDirection === 'backward' ? selectionStart : selectionEnd;
  };

  // added (multiline): the same caret on a textarea, placed with a hidden mirror of the box (wrapped lines and all)
  let mirror = null;
  const caretInTextarea = (target, index) => {
    if (!mirror) {
      mirror = document.createElement('div');
      mirror.className = 'smooth-input__mirror';
      mirror.setAttribute('aria-hidden', 'true');
      container.appendChild(mirror);
    }
    const styles = window.getComputedStyle(target);
    for (const prop of ['fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'fontFamily', 'lineHeight',
      'letterSpacing', 'wordSpacing', 'textTransform', 'textIndent', 'tabSize', 'paddingTop', 'paddingRight', 'paddingBottom',
      'paddingLeft', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'boxSizing',
      'fontFeatureSettings', 'fontVariationSettings']) mirror.style[prop] = styles[prop];
    mirror.style.width = `${target.offsetWidth}px`;
    mirror.textContent = target.value.slice(0, index);
    const mark = document.createElement('span');
    mark.textContent = '​';
    mirror.appendChild(mark);
    const lineHeight = parseFloat(styles.lineHeight) || parseFloat(styles.fontSize) * 1.2;
    const fontSize = parseFloat(styles.fontSize) || 16;
    return {
      x: mark.offsetLeft - target.scrollLeft,
      y: mark.offsetTop - target.scrollTop + (lineHeight - fontSize * 0.9) / 2,
      visible:
        mark.offsetTop - target.scrollTop >= -1 && mark.offsetTop - target.scrollTop + lineHeight <= target.clientHeight + 1
    };
  };

  const updateCaretFromInput = target => {
    const selectionStart = target.selectionStart ?? 0;
    const selectionEnd = target.selectionEnd ?? 0;
    const hasSelection = selectionStart !== selectionEnd;
    const caretIndex = getCaretIndex(target);
    if (o.multiline) {
      const at = caretInTextarea(target, caretIndex);
      caretX.set(at.x);
      caretY.set(at.y);
      caretOpacity.set(!at.visible || hasSelection ? 0 : 1);
      return;
    }
    const isPassword = target.type === 'password';
    const textBeforeCaret = isPassword ? PASSWORD_CHAR.repeat(caretIndex) : target.value.slice(0, caretIndex);
    const absoluteWidth = measurePrefixWidth(textBeforeCaret);
    if (absoluteWidth === null) return;
    scrollCaretIntoView(target, absoluteWidth);
    const styles = window.getComputedStyle(target);
    const paddingLeft = parseFloat(styles.paddingLeft) || 0;
    const paddingRight = parseFloat(styles.paddingRight) || 0;
    const caretPosition = absoluteWidth - target.scrollLeft;
    const minX = paddingLeft - 1;
    const maxX = target.clientWidth - paddingRight;
    const isCaretVisible = caretPosition >= minX && caretPosition <= maxX + 1;
    caretX.set(Math.min(caretPosition, maxX));
    if (!isCaretVisible || hasSelection) {
      caretOpacity.set(0);
      return;
    }
    caretOpacity.set(1);
  };

  const updateCaretIfFocused = () => {
    if (document.activeElement === input) updateCaretFromInput(input);
  };
  const handleSelectionChange = () => {
    if (document.activeElement !== input) return;
    requestAnimationFrame(() => {
      if (document.activeElement === input) updateCaretFromInput(input);
    });
  };
  const onInput = e => {
    o.onChange?.(e);
    requestAnimationFrame(() => updateCaretFromInput(input));
  };
  const onBlurInput = e => {
    caretOpacity.set(0);
    o.onBlur?.(e);
  };
  input.addEventListener('input', onInput);
  input.addEventListener('blur', onBlurInput);
  input.addEventListener('focus', updateCaretIfFocused);
  input.addEventListener('scroll', updateCaretIfFocused);
  document.addEventListener('selectionchange', handleSelectionChange);
  document.fonts?.addEventListener?.('loadingdone', updateCaretIfFocused);
  void document.fonts?.ready.then(updateCaretIfFocused);
  const resizeObserver = new ResizeObserver(updateCaretIfFocused);
  resizeObserver.observe(container);
  updateCaretIfFocused();

  return {
    el: wrapper,
    input,
    get value() {
      return input.value;
    },
    set(value) {
      input.value = String(value ?? '');
      updateCaretIfFocused();
    },
    focus(options) {
      input.focus(options);
    },
    destroy() {
      input.removeEventListener('input', onInput);
      input.removeEventListener('blur', onBlurInput);
      input.removeEventListener('focus', updateCaretIfFocused);
      input.removeEventListener('scroll', updateCaretIfFocused);
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.fonts?.removeEventListener?.('loadingdone', updateCaretIfFocused);
      resizeObserver.disconnect();
      wrapper.remove();
    }
  };
}

export default createSmoothInput;
