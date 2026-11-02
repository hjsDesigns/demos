// React Bits "Hold Button" (reactbits.dev/micro/hold-button, DavidHDev/react-bits, MIT + Commons Clause), ported to plain JS
// for Gage's site, 2026-10-30. The original (HoldButton.jsx / HoldButton.css / registry-HoldButton-JS-CSS.json) sits beside
// this file, unchanged. Everything that moves is the original, with its numbers: press and the liquid fill rises (linear
// over holdTime, 2 s), its crest a travelling wave (holdTime / 1100 cycles, 6 px); the button presses to 0.97 under a pointer
// (160 ms on the cubic-bezier(.23, 1, .32, 1) ease-out) and its glow grows over the hold; let go early and the fill snaps
// back (releaseTime, 200 ms, ease-out cubic); a release under 250 ms with no drift is a tap (onTap); dragging more than 10 px
// off the button, a cancelled pointer, a lost capture, the window losing focus or the tab hiding all cancel; at the end
// (and only after holdTime - 50 ms) it turns to the done label with the blur swap and one pulse ring (600 ms), calls onHold,
// and drains back after resetAfter (1.2 s; 0 = stays done). Keys: hold Space or Enter, Escape cancels a key hold. The
// screen-reader hint, the up direction, the reduced-motion and prefers-contrast rules are the original's.
// What is different:
//  - React's component is a function: createHoldButton(host, opts) builds the same <button> (same classes, data-phase /
//    data-input / data-direction / data-glow, the same inline --hb-* variables) and appends it to host.
//  - sizes: every px of the original is calc(var(--hb-px, 1px) * n) (hold-button.css), the radius and wave props too, so a
//    page can scale the whole button with one unit (1px = the original to the pixel). The 10 px drift slack is turned into
//    the same share of the button: 10 × the unit × the on-screen scale of its layout box (a CSS-3D-scaled parent).
//  - labels and icons may be strings or DOM nodes (the original renders its label three times: the button, the fill, the
//    crest; nodes are cloned for the copies).
//  - added: onComplete (called right after onHold; if it returns a promise the reset waits for it, and a rejection drains
//    the button back to idle the way a short hold does); api { el, phase, set(patch), reset({ instant }), destroy() }.
//    Options take the original's prop names (label = its children; colors: backgroundColor, fillColor, textColor,
//    fillTextColor; any CSS color, var() included).

const TAP_MS = 250;
const HIT_PAD = 10;
const LINEAR = t => t;
const EASE_OUT = t => 1 - Math.pow(1 - t, 3);
const U = n => `calc(var(--hb-px, 1px) * ${n})`;
let uid = 0;

const span = className => {
  const node = document.createElement('span');
  if (className) node.className = className;
  return node;
};
// a string, a number or a node, as React would render it (nodes cloned for the second and third copy)
const content = (value, copy) => {
  if (value === null || value === undefined || value === false) return null;
  if (value instanceof Node) return copy ? value.cloneNode(true) : value;
  return document.createTextNode(String(value));
};

export function createHoldButton(host, opts = {}) {
  const o = {
    label: 'Hold to delete',
    doneLabel: 'Deleted',
    icon: null,
    doneIcon: null,
    backgroundColor: '#27272a',
    fillColor: '#5227FF',
    textColor: '#f5f5f5',
    fillTextColor: '#ffffff',
    size: 'md',
    radius: 14,
    fillDirection: 'right',
    holdTime: 2000,
    releaseTime: 200,
    pressScale: 0.97,
    wave: true,
    waveAmplitude: 6,
    glow: true,
    resetAfter: 1200,
    disabled: false,
    onHold: undefined,
    onTap: undefined,
    onComplete: undefined,
    className: '',
    ...opts
  };
  if (opts.children !== undefined && opts.label === undefined) o.label = opts.children;

  let phase = 'idle';
  let input = null;
  let alive = true;
  let run = 0; // added: a reset() makes a pending onComplete promise stale
  const gesture = { pointerId: null, start: 0, rect: null, pad: HIT_PAD };
  const timers = { complete: 0, reset: 0 };
  const motion = { raf: 0, p: 0, from: 0, to: 0, start: 0 };
  const hintId = `hold-button-hint-${++uid}`;

  // ---- the JSX ----
  const button = document.createElement('button');
  button.type = 'button';
  const pulse = span('hold-button__pulse');
  pulse.setAttribute('aria-hidden', 'true');
  const label = span('hold-button__label');
  const clip = span('hold-button__clip');
  clip.setAttribute('aria-hidden', 'true');
  const fill = span('hold-button__fill');
  const fillLabel = span('hold-button__label hold-button__label--fill');
  fill.appendChild(fillLabel);
  const crest = span('hold-button__crest');
  crest.setAttribute('aria-hidden', 'true');
  const crestLabel = span('hold-button__label hold-button__label--fill');
  crest.appendChild(crestLabel);
  clip.append(fill, crest);
  const hint = span('hold-button__sr');
  hint.id = hintId;
  const probe = span('hold-button__probe');
  probe.setAttribute('aria-hidden', 'true');
  button.append(pulse, label, clip, hint, probe);
  host.appendChild(button);

  // the labels fragment, rendered into the button, the fill and the crest
  let idleSpans = [];
  let doneSpans = [];
  const paintLabels = () => {
    idleSpans = [];
    doneSpans = [];
    [label, fillLabel, crestLabel].forEach((target, copy) => {
      const idle = span('hold-button__idle');
      if (o.icon) {
        const ic = span('hold-button__icon');
        ic.appendChild(content(o.icon, copy));
        idle.appendChild(ic);
      }
      const text = content(o.label, copy);
      if (text) idle.appendChild(text);
      const done = span('hold-button__done');
      if (o.doneIcon) {
        const ic = span('hold-button__icon');
        ic.appendChild(content(o.doneIcon, copy));
        done.appendChild(ic);
      }
      const doneText = content(o.doneLabel, copy);
      if (doneText) done.appendChild(doneText);
      target.replaceChildren(idle, done);
      idleSpans.push(idle);
      doneSpans.push(done);
    });
    hint.textContent = `Press and hold for ${Math.round(o.holdTime / 100) / 10} seconds to confirm`;
    paintPhase();
  };

  // what a React re-render with new props writes
  const paintProps = () => {
    const direction = o.fillDirection === 'up' ? 'up' : 'right';
    button.disabled = !!o.disabled;
    button.className = `hold-button hold-button--${o.size}${o.className ? ` ${o.className}` : ''}`;
    button.dataset.direction = direction;
    if (o.glow) button.dataset.glow = 'true';
    else delete button.dataset.glow;
    button.setAttribute('aria-describedby', hintId);
    const vars = {
      '--hb-radius': U(o.radius),
      '--hb-bg': o.backgroundColor,
      '--hb-fill': o.fillColor,
      '--hb-text': o.textColor,
      '--hb-fill-text': o.fillTextColor,
      '--hb-hold': `${o.holdTime}ms`,
      '--hb-cycles': String(o.holdTime / 1100),
      '--hb-release': `${o.releaseTime}ms`,
      '--hb-press': String(o.pressScale),
      '--hb-wave': U(o.wave ? o.waveAmplitude : 0)
    };
    for (const [name, value] of Object.entries(vars)) button.style.setProperty(name, value);
  };
  // what a React re-render with a new phase / input writes
  function paintPhase() {
    button.dataset.phase = phase;
    if (input) button.dataset.input = input;
    else delete button.dataset.input;
    idleSpans.forEach(node => node.setAttribute('aria-hidden', String(phase === 'done')));
    doneSpans.forEach(node => node.setAttribute('aria-hidden', String(phase !== 'done')));
  }

  // the original's effect while holding: the window losing focus or the tab hiding cancels the hold
  const cancel = () => release({ drifted: true });
  const onVisibility = () => {
    if (document.hidden) cancel();
  };
  let watching = false;
  const watch = on => {
    if (on === watching) return;
    watching = on;
    if (on) {
      window.addEventListener('blur', cancel);
      document.addEventListener('visibilitychange', onVisibility);
    } else {
      window.removeEventListener('blur', cancel);
      document.removeEventListener('visibilitychange', onVisibility);
    }
  };

  const go = (next, kind = null) => {
    phase = next;
    input = kind;
    paintPhase();
    watch(phase === 'holding');
  };

  const clearTimers = () => {
    clearTimeout(timers.complete);
    clearTimeout(timers.reset);
  };

  const drive = (to, duration, ease) => {
    const m = motion;
    cancelAnimationFrame(m.raf);
    m.from = m.p;
    m.to = to;
    m.start = performance.now();
    const step = now => {
      const t = duration > 0 ? Math.min(1, (now - m.start) / duration) : 1;
      m.p = m.from + (m.to - m.from) * ease(t);
      button.style.setProperty('--hb-p', m.p.toFixed(4));
      if (t < 1) {
        m.raf = requestAnimationFrame(step);
        return;
      }
      m.raf = 0;
      if (m.to === 1) complete();
    };
    m.raf = requestAnimationFrame(step);
  };

  const drain = () => {
    go('idle');
    drive(0, o.releaseTime, EASE_OUT);
  };

  const complete = () => {
    if (phase !== 'holding') return;
    if (performance.now() - gesture.start < o.holdTime - 50) return;
    clearTimers();
    go('done', input);
    o.onHold?.();
    const later = () => {
      if (o.resetAfter > 0) timers.reset = setTimeout(drain, o.resetAfter);
    };
    // added: onComplete; a promise holds the reset until it settles, a rejection drains the button back
    let out;
    try {
      out = o.onComplete?.();
    } catch (error) {
      out = Promise.reject(error);
    }
    if (out && typeof out.then === 'function') {
      const id = run;
      out.then(
        () => {
          if (id === run && phase === 'done') later();
        },
        () => {
          if (id === run && phase === 'done') drain();
        }
      );
    } else later();
  };

  const begin = kind => {
    if (o.disabled || phase !== 'idle') return false;
    gesture.start = performance.now();
    gesture.rect = button.getBoundingClientRect();
    // the original's 10 px, as the same share of the button here (its unit, and the parent's on-screen scale)
    const unit = (probe.offsetWidth || 100) / 100;
    const scale = button.offsetWidth ? gesture.rect.width / button.offsetWidth : 1;
    gesture.pad = HIT_PAD * unit * (scale || 1);
    go('holding', kind);
    drive(1, o.holdTime, LINEAR);
    timers.complete = setTimeout(complete, o.holdTime + 100);
    return true;
  };

  function release({ drifted = false } = {}) {
    if (phase !== 'holding') return;
    clearTimers();
    const held = performance.now() - gesture.start;
    go('idle');
    drive(0, o.releaseTime, EASE_OUT);
    if (!drifted && held < TAP_MS) o.onTap?.();
  }

  // ---- the original's handlers ----
  const onPointerDown = e => {
    if (e.button !== 0 || !e.isPrimary || gesture.pointerId !== null) return;
    if (!begin('pointer')) return;
    gesture.pointerId = e.pointerId;
    try {
      button.setPointerCapture(e.pointerId);
    } catch {}
  };

  const endPointer = (e, options) => {
    if (e.pointerId !== gesture.pointerId) return;
    gesture.pointerId = null;
    try {
      if (button.hasPointerCapture(e.pointerId)) button.releasePointerCapture(e.pointerId);
    } catch {}
    release(options);
  };

  const onPointerMove = e => {
    if (e.pointerId !== gesture.pointerId) return;
    const r = gesture.rect;
    if (!r) return;
    const pad = gesture.pad;
    const out = e.clientX < r.left - pad || e.clientX > r.right + pad || e.clientY < r.top - pad || e.clientY > r.bottom + pad;
    if (out) endPointer(e, { drifted: true });
  };

  const onPointerLeave = e => {
    if (e.pointerType !== 'touch') endPointer(e, { drifted: true });
  };

  const onKeyDown = e => {
    if (e.key === 'Escape') {
      if (input === 'key') release({ drifted: true });
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!e.repeat) begin('key');
    }
  };

  const onKeyUp = e => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (input === 'key') release();
    }
  };

  const onPointerUp = e => endPointer(e);
  const onPointerCancel = e => endPointer(e, { drifted: true });
  const onLostCapture = e => endPointer(e, { drifted: true });
  const onContextMenu = e => e.preventDefault();
  button.addEventListener('pointerdown', onPointerDown);
  button.addEventListener('pointermove', onPointerMove);
  button.addEventListener('pointerup', onPointerUp);
  button.addEventListener('pointercancel', onPointerCancel);
  button.addEventListener('lostpointercapture', onLostCapture);
  button.addEventListener('pointerleave', onPointerLeave);
  button.addEventListener('keydown', onKeyDown);
  button.addEventListener('keyup', onKeyUp);
  button.addEventListener('contextmenu', onContextMenu);

  // the original's layout effect: the button's own size, for the crest's wave
  const measure = () => {
    button.style.setProperty('--hb-w', `${button.offsetWidth}px`);
    button.style.setProperty('--hb-h', `${button.offsetHeight}px`);
  };
  paintProps();
  paintLabels();
  measure();
  const ro = new ResizeObserver(measure);
  ro.observe(button);

  return {
    el: button,
    get phase() {
      return phase;
    },
    /** New props, as a React re-render with them (label, doneLabel, disabled, colors, holdTime, …). */
    set(patch = {}) {
      if (!alive) return;
      const relabel = ['label', 'children', 'doneLabel', 'icon', 'doneIcon', 'holdTime'].some(key => key in patch);
      Object.assign(o, patch);
      if ('children' in patch && !('label' in patch)) o.label = patch.children;
      if (o.disabled && phase === 'holding') {
        // added: a button disabled mid-hold lets go (as a drift: no tap, no completion)
        if (gesture.pointerId !== null) {
          const id = gesture.pointerId;
          gesture.pointerId = null;
          try {
            if (button.hasPointerCapture(id)) button.releasePointerCapture(id);
          } catch {}
        }
        release({ drifted: true });
      }
      paintProps();
      if (relabel) paintLabels();
    },
    /** Back to idle: the original's own reset step (the fill drains over releaseTime), or at once with { instant: true }. */
    reset({ instant = false } = {}) {
      if (!alive) return;
      run += 1;
      clearTimers();
      if (gesture.pointerId !== null) {
        const id = gesture.pointerId;
        gesture.pointerId = null;
        try {
          if (button.hasPointerCapture(id)) button.releasePointerCapture(id);
        } catch {}
      }
      go('idle');
      if (instant) {
        cancelAnimationFrame(motion.raf);
        motion.raf = 0;
        motion.p = 0;
        button.style.setProperty('--hb-p', '0');
      } else drive(0, o.releaseTime, EASE_OUT);
    },
    destroy() {
      alive = false;
      run += 1;
      clearTimers();
      cancelAnimationFrame(motion.raf);
      watch(false);
      ro.disconnect();
      button.removeEventListener('pointerdown', onPointerDown);
      button.removeEventListener('pointermove', onPointerMove);
      button.removeEventListener('pointerup', onPointerUp);
      button.removeEventListener('pointercancel', onPointerCancel);
      button.removeEventListener('lostpointercapture', onLostCapture);
      button.removeEventListener('pointerleave', onPointerLeave);
      button.removeEventListener('keydown', onKeyDown);
      button.removeEventListener('keyup', onKeyUp);
      button.removeEventListener('contextmenu', onContextMenu);
      button.remove();
    }
  };
}

export default createHoldButton;
