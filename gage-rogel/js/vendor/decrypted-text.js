// React Bits "Decrypted Text" (DecryptedText.jsx · MIT + Commons Clause), ported to plain JS for Gage's opening line
// (Hayden 10/31: "Can we do decrypted text through the looking healthy and being healthy are two different goals").
// The original sits unchanged in vendor/effects/reactbits/decrypted-text/.
// Kept exactly: the cells (a hidden ghost of the real letter holds each width, the random glyph sits over it, squeezed
// with scaleX when it is wider than the letter it stands in for), the sequential / all-at-once runs, reveal directions
// (start / end / center / random), the reverse run, the fade effect's floor 0.16 / peak 0.62 / 6-letter lead, the settle
// transition, scrambleColor's color-mix tint, the flip effect's Web Animations, hover radius "heat", click once / toggle,
// view / inViewHover with IntersectionObserver, loop + loopDelay, reduced motion (no run: it just shows), the
// ResizeObserver refit and the sr-only copy of the text.
// Added: animateOn 'manual' (nothing triggers it; the page calls play() / hide() / reveal()), and the api.
//   const fx = createDecryptedText(el, { …the original's props })   // el's text becomes the text
//   fx.play()     scramble everything, then decrypt into the real words
//   fx.hide()     back to scrambled, no animation (ready for the next play)
//   fx.reveal()   the real words, no animation
//   fx.destroy()  stop, and put the plain text back
const FADE_FLOOR = 0.16;
const FADE_PEAK = 0.62;
const FADE_LEAD = 6;
const SETTLE = 'color 0.7s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1)';

const isSpace = char => /\s/.test(char);
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

const glyphWidths = new Map();
let measureContext = null;
const readFont = node => {
  const style = window.getComputedStyle(node);
  return { font: `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`, spacing: parseFloat(style.letterSpacing) || 0 };
};
const advance = (font, glyph) => {
  let widths = glyphWidths.get(font);
  if (!widths) {
    widths = new Map();
    glyphWidths.set(font, widths);
  }
  let width = widths.get(glyph);
  if (width === undefined) {
    measureContext = measureContext || document.createElement('canvas').getContext('2d');
    if (!measureContext) return 0;
    measureContext.font = font;
    width = measureContext.measureText(glyph).width;
    widths.set(glyph, width);
  }
  return width;
};
const flipFrames = (angle, opacity) => [
  { transform: `perspective(4em) translateZ(-0.42em) rotateX(${angle}deg) translateZ(0.42em)`, opacity },
  { transform: 'perspective(4em) translateZ(-0.42em) rotateX(0deg) translateZ(0.42em)', opacity: 1 }
];
const SR_ONLY = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';

export function createDecryptedText(el, opts = {}) {
  const o = {
    text: el.textContent,
    speed: 50,
    maxIterations: 10,
    sequential: false,
    revealDirection: 'start',
    useOriginalCharsOnly: false,
    characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+',
    className: '',
    parentClassName: '',
    encryptedClassName: '',
    animateOn: 'hover',
    clickMode: 'once',
    effect: 'scramble',
    scrambleColor: '',
    loop: false,
    loopDelay: 2000,
    hoverRadius: 0,
    ...opts
  };
  const original = el.textContent;
  const chars = Array.from(String(o.text ?? ''));
  const letters = chars.filter(char => !isSpace(char));
  const source = o.useOriginalCharsOnly ? Array.from(new Set(letters)) : Array.from(o.characters);
  const pool = source.length ? source : letters;
  const startsHidden = ['click', 'view', 'inViewHover', 'manual'].includes(o.animateOn);
  const hoverable = o.animateOn === 'hover' || o.animateOn === 'inViewHover';
  const local = hoverable && o.hoverRadius > 0;
  const step = Math.max(16, o.speed);
  const tinted = Boolean(o.scrambleColor);
  const fading = o.effect === 'fade';
  const flipping = o.effect === 'flip';
  const settles = tinted || fading;

  // ---- the markup (the original's JSX) ----
  const wrap = document.createElement('span');
  if (o.parentClassName) wrap.className = o.parentClassName;
  wrap.style.cssText = 'display:inline-block;white-space:pre-wrap';
  const sr = document.createElement('span');
  sr.style.cssText = SR_ONLY;
  sr.textContent = chars.join('');
  const vis = document.createElement('span');
  vis.setAttribute('aria-hidden', 'true');
  vis.style.display = 'inline';
  const cells = [];
  let word = null;
  chars.forEach((char, index) => {
    if (isSpace(char)) {
      vis.appendChild(document.createTextNode(char));
      word = null;
      return;
    }
    if (!word) {
      word = document.createElement('span');
      word.style.cssText = 'display:inline;white-space:nowrap';
      vis.appendChild(word);
    }
    const cell = document.createElement('span');
    cell.textContent = char;
    word.appendChild(cell);
    cells[index] = cell;
  });
  wrap.append(sr, vis);
  el.textContent = '';
  el.appendChild(wrap);

  // ---- state (the original's refs) ----
  let revealedNow = chars.map(char => !startsHidden || isSpace(char));
  let frame = {
    shown: chars.map((char, index) => (revealedNow[index] ? char : pool[(char.codePointAt(0) + index * 7) % pool.length])),
    revealed: revealedNow,
    tint: revealedNow.map(shown => (shown ? 0 : 1)),
    dim: revealedNow.map(shown => (shown ? 1 : FADE_FLOOR)),
    squeeze: revealedNow.map(() => 1)
  };
  let mask = frame.revealed.slice();
  let heat = chars.map(() => 0);
  let warmActive = false;
  let pointer = null;
  let run = null;
  let timer = null;
  let hold = null;
  let pending = null;
  let visible = true;
  let target = !startsHidden;
  let played = false;
  let previous = frame;
  let font = null;
  let centers = [];
  let destroyed = false;

  const revealOrder = () => {
    const order = [];
    chars.forEach((char, index) => {
      if (!isSpace(char)) order.push(index);
    });
    if (o.revealDirection === 'end') return order.reverse();
    if (o.revealDirection === 'center') {
      const middle = Math.floor(chars.length / 2);
      return order.sort((a, b) => Math.abs(a - middle) - Math.abs(b - middle));
    }
    if (o.revealDirection === 'random') {
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
    }
    return order;
  };
  const fit = (index, glyph) => {
    if (!font) font = readFont(wrap);
    const room = advance(font.font, chars[index] ?? glyph) + font.spacing;
    const need = advance(font.font, glyph) + font.spacing;
    return need > room + 0.01 ? Math.round(Math.max(0.05, room / need) * 1000) / 1000 : 1;
  };

  // ---- the original's render, done by hand ----
  function render(next) {
    chars.forEach((char, index) => {
      if (isSpace(char)) return;
      const cell = cells[index];
      const revealed = next.revealed[index] ?? true;
      cell.className = revealed ? o.className : o.encryptedClassName;
      cell.removeAttribute('style');
      if (!revealed || flipping) cell.style.cssText = 'position:relative;display:inline-block';
      if (settles) cell.style.transition = revealed ? SETTLE : `color 0.12s linear, opacity ${step}ms linear`;
      if (tinted && !revealed) {
        const amount = Math.round((next.tint[index] ?? 1) * 100);
        cell.style.color = amount >= 100 ? o.scrambleColor : `color-mix(in srgb, ${o.scrambleColor} ${amount}%, currentColor)`;
      }
      if (fading) cell.style.opacity = String(revealed ? 1 : next.dim[index] ?? FADE_FLOOR);
      if (revealed) {
        if (cell.dataset.state !== 'r') {
          cell.textContent = char;
          cell.dataset.state = 'r';
        }
        return;
      }
      if (cell.dataset.state !== 'e') {
        cell.textContent = '';
        const ghost = document.createElement('span');
        ghost.style.cssText = 'visibility:hidden';
        ghost.textContent = char;
        const glyph = document.createElement('span');
        cell.append(ghost, glyph);
        cell.dataset.state = 'e';
      }
      const glyph = cell.lastChild;
      const squeeze = next.squeeze[index] ?? 1;
      glyph.style.cssText = `position:absolute;top:0;left:50%;transform:translateX(-50%)${squeeze < 1 ? ` scaleX(${squeeze})` : ''}`;
      glyph.textContent = next.shown[index] ?? char;
    });
    // the flip effect (the original's layout effect)
    if (flipping && previous.shown !== next.shown && !prefersReducedMotion()) {
      next.revealed.forEach((revealed, index) => {
        const node = cells[index];
        if (!node || typeof node.animate !== 'function' || isSpace(chars[index] ?? ' ')) return;
        if (!revealed) {
          node.animate(flipFrames(58 + Math.random() * 26, 0.3), { duration: Math.min(step * 0.92, 240), easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)' });
        } else if (previous.revealed[index] === false) {
          node.animate(flipFrames(90, 0), { duration: Math.min(Math.max(step * 7, 360), 760), easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)' });
        }
      });
    }
    previous = next;
    frame = next;
  }

  const paint = () => {
    const ranks = run?.forward && o.sequential ? new Map(run.queue.map((index, rank) => [index, rank])) : null;
    const ramp = run?.forward && !o.sequential ? Math.min(1, run.iteration / Math.max(1, o.maxIterations)) : 0;
    const next = { shown: [], revealed: [], tint: [], dim: [], squeeze: [] };
    chars.forEach((char, index) => {
      const blank = isSpace(char);
      const hot = blank ? 0 : heat[index] || 0;
      const hidden = !blank && !mask[index];
      const scrambled = hidden || (hot > 0 && Math.random() < hot * 2);
      const glyph = scrambled ? pool[Math.floor(Math.random() * pool.length)] : char;
      next.revealed.push(!scrambled);
      next.shown.push(glyph);
      next.squeeze.push(scrambled ? fit(index, glyph) : 1);
      if (!scrambled) {
        next.tint.push(0);
        next.dim.push(1);
      } else if (!hidden) {
        const level = Math.min(1, hot * 1.5);
        next.tint.push(level);
        next.dim.push(1 - (1 - FADE_FLOOR) * level);
      } else {
        const rank = ranks?.get(index);
        const lift = rank === undefined ? ramp : Math.max(0, 1 - rank / FADE_LEAD);
        next.tint.push(1);
        next.dim.push(FADE_FLOOR + (FADE_PEAK - FADE_FLOOR) * lift);
      }
    });
    render(next);
  };
  const refit = () =>
    render({ ...frame, squeeze: frame.shown.map((glyph, index) => (frame.revealed[index] ? 1 : fit(index, glyph))) });

  const stopTicker = () => {
    clearInterval(timer);
    timer = null;
  };
  const ensureTicker = () => {
    if (timer || destroyed) return;
    timer = setInterval(tick, step);
  };
  const stopRun = () => {
    run = null;
    clearTimeout(hold);
    hold = null;
    pending = null;
  };
  const schedule = (task, delay) => {
    clearTimeout(hold);
    hold = setTimeout(() => {
      hold = null;
      if (visible) task();
      else pending = task;
    }, delay);
  };
  function startRun(forward, { from, cycle = false, lead = 0 } = {}) {
    stopRun();
    target = forward;
    if (from) mask = from;
    if (prefersReducedMotion()) {
      mask = chars.map(char => forward || isSpace(char));
      paint();
      return;
    }
    const order = forward ? revealOrder() : revealOrder().reverse();
    const queue = o.sequential ? order.filter(index => mask[index] !== forward) : [];
    run = { forward, cycle, iteration: 0, queue: [...new Array(lead).fill(null), ...queue] };
    paint();
    ensureTicker();
  }
  const finishRun = done => {
    if (!o.loop) return;
    if (done.forward) schedule(() => startRun(false, { cycle: true }), Math.max(0, o.loopDelay));
    else if (done.cycle) startRun(true, { cycle: true, lead: o.sequential ? Math.max(2, Math.round(320 / step)) : 0 });
  };
  const warm = () => {
    const box = pointer ? wrap.getBoundingClientRect() : null;
    const cool = 1 / Math.max(1, o.maxIterations);
    let active = false;
    chars.forEach((char, index) => {
      if (isSpace(char)) return;
      let goal = 0;
      const center = centers[index];
      if (box && center) {
        const distance = Math.hypot(box.left + center.x - pointer.x, box.top + center.y - pointer.y) / Math.max(1, o.hoverRadius);
        if (distance < 1) goal = 1 - distance * distance * (3 - 2 * distance);
      }
      const value = Math.max((heat[index] || 0) - cool, goal);
      heat[index] = value > 0.001 ? value : 0;
      if (heat[index] > 0) active = true;
    });
    warmActive = active;
  };
  function tick() {
    if (run) {
      run.iteration += 1;
      let next = mask;
      let done;
      if (o.sequential) {
        const index = run.queue.shift();
        if (index !== undefined && index !== null) {
          next = next.slice();
          next[index] = run.forward;
        }
        done = run.queue.length === 0;
      } else if (run.forward) {
        done = run.iteration >= o.maxIterations;
        if (done) next = chars.map(() => true);
      } else {
        const shownNow = [];
        next.forEach((shown, index) => {
          if (shown && !isSpace(chars[index])) shownNow.push(index);
        });
        const hideCount = Math.max(1, Math.ceil(chars.filter(char => !isSpace(char)).length / Math.max(1, o.maxIterations)));
        next = next.slice();
        for (let i = 0; i < hideCount && shownNow.length; i++) next[shownNow.splice(Math.floor(Math.random() * shownNow.length), 1)[0]] = false;
        done = shownNow.length === 0 || run.iteration >= o.maxIterations;
        if (done) next = chars.map(char => isSpace(char));
      }
      mask = next;
      if (done) {
        const finished = run;
        run = null;
        finishRun(finished);
      }
    }
    if (local) warm();
    else warmActive = false;
    paint();
    if (!run && !warmActive) stopTicker();
  }
  const measure = () => {
    const box = wrap.getBoundingClientRect();
    centers = chars.map((char, index) => {
      const cell = cells[index];
      if (isSpace(char) || !cell) return null;
      const rect = cell.getBoundingClientRect();
      return { x: rect.left - box.left + rect.width / 2, y: rect.top - box.top + rect.height / 2 };
    });
  };

  // ---- the original's events ----
  const trackPointer = event => {
    if (prefersReducedMotion()) return;
    if (!pointer) measure();
    pointer = { x: event.clientX, y: event.clientY };
    ensureTicker();
  };
  const onEnter = event => {
    if (local) return trackPointer(event);
    if (run) return;
    startRun(true, { from: chars.map(char => isSpace(char)) });
  };
  const onMove = event => {
    if (local) trackPointer(event);
  };
  const onLeave = () => {
    if (local) {
      pointer = null;
      return;
    }
    stopRun();
    target = true;
    mask = chars.map(() => true);
    paint();
    if (o.loop && o.animateOn === 'inViewHover') schedule(() => startRun(false, { cycle: true }), Math.max(0, o.loopDelay));
  };
  const onClick = () => {
    if (o.clickMode === 'toggle') return startRun(!target);
    if (!target) startRun(true);
  };
  if (hoverable) {
    wrap.addEventListener('mouseenter', onEnter);
    wrap.addEventListener('mousemove', onMove);
    wrap.addEventListener('mouseleave', onLeave);
  } else if (o.animateOn === 'click') wrap.addEventListener('click', onClick);

  let io = null;
  const viewTrigger = o.animateOn === 'view' || o.animateOn === 'inViewHover';
  if ((viewTrigger || o.loop) && typeof IntersectionObserver !== 'undefined') {
    io = new IntersectionObserver(
      entries => {
        visible = entries.some(entry => entry.isIntersecting);
        if (!visible) return;
        if (viewTrigger && !played) {
          played = true;
          startRun(true);
        }
        const resume = pending;
        pending = null;
        resume?.();
        if (!o.loop) io.disconnect();
      },
      { threshold: 0.1 }
    );
    io.observe(wrap);
  }
  const ro = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(() => {
        const metrics = readFont(wrap);
        glyphWidths.delete(metrics.font);
        font = metrics;
        refit();
      })
    : null;
  ro?.observe(wrap);

  // the reduced-motion start: a view/click/manual text that would start hidden just shows
  if (startsHidden && prefersReducedMotion() && o.animateOn !== 'click') {
    mask = chars.map(() => true);
    target = true;
  }
  paint();

  return {
    el: wrap,
    play() {
      startRun(true, { from: chars.map(char => isSpace(char)) });
    },
    hide() {
      stopRun();
      stopTicker();
      target = false;
      mask = chars.map(char => isSpace(char) || prefersReducedMotion());
      paint();
    },
    reveal() {
      stopRun();
      stopTicker();
      target = true;
      mask = chars.map(() => true);
      paint();
    },
    destroy() {
      destroyed = true;
      stopRun();
      stopTicker();
      io?.disconnect();
      ro?.disconnect();
      el.textContent = original;
    }
  };
}
export default createDecryptedText;
