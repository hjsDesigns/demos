// React Bits "Stepper" (DavidHDev/react-bits, MIT + Commons Clause), ported to plain JS for Gage's site, 2026-10-29.
// The original (Stepper.jsx / Stepper.original.css / registry-Stepper-JS-CSS.json) sits beside this file (its CSS is
// renamed: macOS can't hold Stepper.css beside stepper.css). Everything that moves is the
// original code with the original numbers: the themes, the SPRING linear() curve and SETTLE, the gliding tile (transform /
// width / height 560 ms on the spring), the viewport height animation (560 ms spring, 200 ms SETTLE reduced), the panes
// (new one slides 36 px on the spring over 560 ms and fades 0 → 0 at 25% → 1 over 420 ms; the old one fades out in 140 ms
// and slides away in 200 ms), the drawn check (24-unit dash, 360 ms SETTLE), the footer that folds away when done, the
// 'tight' pass that drops the step titles when they don't fit, numbers / dots / bars, horizontal and vertical.
// React's state is plain variables; its JSX is DOM built once and patched where React would patch it (the old pane is the
// same element React keeps by key, re-classed as the leaving pane).
// What is different:
//  - steps are passed as data: steps: [{ title, description, icon, content: Node }] (the <Step> children), and
//    completedContent is a Node. nextButtonProps / backButtonProps can be a function of the current step; api.refresh()
//    re-reads them (what a React re-render would do).
//  - sizes: every px of the original is calc(var(--stepper-px, 1px) * n) (stepper.css); JS-side px (the 36 px slide, the
//    tight pass's 8 / 20 / 4 px, the 520 px fold) are multiplied by the same unit, read from a hidden 100-unit probe.
//    At 1px it is the original exactly.
//  - the 'tight' pass reads the badges' layout width (offsetWidth) instead of getBoundingClientRect(): on Gage's page the
//    stepper sits inside a CSS-3D-scaled parent, and a visual size would be scaled twice.
//  - the tile's ResizeObserver re-places it only when its segment really moved: its first report (it always reports once
//    when it starts observing, right after a step change) would otherwise swap in the no-glide transition and cancel the
//    glide (see gliderEffect()).
//  - go() compares with the latest requested step, so a callback may redirect (React's closure would see the stale one).
//  - transition may be a function ({ viewport, pane, leaving, from, to, direction, vertical, reduced, spring, settle,
//    finish }) for a page-made step change (Gage's Apply: the Image Generation Loader scan); 'slide' | 'fade' | 'none' as before.
//  - the tile stays hidden until it is measured against the track (before stepper.css loads, offsets are meaningless).
//  - api: { el, go(n), next(), back(), current, total, refresh(), relayout(), set(patch), destroy() }.

const THEMES = {
  dark: {
    '--stepper-frame': 'rgba(38, 35, 46, 0.66)',
    '--stepper-frame-edge': 'rgba(255, 255, 255, 0.08)',
    '--stepper-frame-highlight': 'rgba(255, 255, 255, 0.07)',
    '--stepper-frame-shadow': '0 22px 44px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)',
    '--stepper-tile': 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
    '--stepper-tile-edge': 'rgba(255, 255, 255, 0.07)',
    '--stepper-tile-highlight': 'rgba(255, 255, 255, 0.12)',
    '--stepper-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    '--stepper-well': 'rgba(255, 255, 255, 0.07)',
    '--stepper-track': 'rgba(255, 255, 255, 0.1)',
    '--stepper-ink': '#f4f4f5',
    '--stepper-muted': 'rgba(244, 244, 245, 0.55)',
    '--stepper-faint': 'rgba(255, 255, 255, 0.22)',
    '--stepper-ring': 'rgba(244, 244, 245, 0.3)',
    '--stepper-solid': '#f4f4f5',
    '--stepper-solid-ink': '#18181b',
    '--stepper-hover': 'brightness(1.12)',
    '--stepper-hover-fill': 'rgba(255, 255, 255, 0.04)',
    '--stepper-solid-hover': 'brightness(0.9)',
    '--stepper-press': 'brightness(0.85)'
  },
  light: {
    '--stepper-frame': 'rgba(240, 240, 243, 0.8)',
    '--stepper-frame-edge': 'rgba(24, 24, 27, 0.07)',
    '--stepper-frame-highlight': 'rgba(255, 255, 255, 0.95)',
    '--stepper-frame-shadow': '0 22px 44px -22px rgba(24, 24, 27, 0.3), 0 6px 16px -10px rgba(24, 24, 27, 0.16)',
    '--stepper-tile': 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    '--stepper-tile-edge': 'rgba(24, 24, 27, 0.08)',
    '--stepper-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--stepper-tile-shadow': '0 4px 10px -5px rgba(24, 24, 27, 0.25)',
    '--stepper-well': 'rgba(24, 24, 27, 0.05)',
    '--stepper-track': 'rgba(24, 24, 27, 0.08)',
    '--stepper-ink': '#27272a',
    '--stepper-muted': 'rgba(39, 39, 42, 0.55)',
    '--stepper-faint': 'rgba(24, 24, 27, 0.16)',
    '--stepper-ring': 'rgba(24, 24, 27, 0.28)',
    '--stepper-solid': '#27272a',
    '--stepper-solid-ink': '#ffffff',
    '--stepper-hover': 'brightness(0.97)',
    '--stepper-hover-fill': 'rgba(24, 24, 27, 0.035)',
    '--stepper-solid-hover': 'brightness(1.3)',
    '--stepper-press': 'brightness(0.92)'
  }
};

const SPRING =
  'linear(0, 0.0603, 0.2033, 0.3821, 0.5633, 0.7258, 0.8584, 0.9574, 1.0242, 1.0634, 1.0809, 1.0828, 1.0747, 1.0613, 1.046, 1.0313, 1.0186, 1.0085, 1.0012, 0.9965, 0.994, 0.9931, 0.9933, 0.9941, 0.9953, 0.9966, 0.9978, 0.9988, 1)';
const SETTLE = 'cubic-bezier(0.22, 1, 0.36, 1)';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const U = n => `calc(var(--stepper-px, 1px) * ${n})`;
const unitize = value => String(value).replace(/(-?\d*\.?\d+)px/g, (_, n) => U(n));
const size = value => (typeof value === 'number' ? U(value) : value);
const reducedNow = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const readableOn = color => {
  let hex = String(color || '')
    .trim()
    .replace('#', '');
  if (hex.length === 3) hex = hex.replace(/./g, c => c + c);
  if (!/^[0-9a-f]{6}$/i.test(hex)) return '#ffffff';
  const [r, g, b] = [0, 2, 4].map(index => {
    const c = parseInt(hex.slice(index, index + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#18181b' : '#ffffff';
};

const ease = () =>
  typeof CSS !== 'undefined' && CSS.supports?.('transition-timing-function', 'linear(0, 1)')
    ? SPRING
    : 'cubic-bezier(0.34, 1.4, 0.64, 1)';

// @hugeicons/core-free-icons 4.3.3 paths, drawn the way <HugeiconsIcon> draws them (24 grid, no fill, round caps, the
// strokeWidth the call passes on the svg and on every path)
const ICONS = {
  ArrowLeft01Icon: ['M15 6C15 6 9.00001 10.4189 9 12C8.99999 13.5812 15 18 15 18'],
  ArrowRight01Icon: ['M9.00005 6C9.00005 6 15 10.4189 15 12C15 13.5812 9 18 9 18'],
  Tick02Icon: ['M5 14L8.5 17.5L19 6.5']
};
const NS = 'http://www.w3.org/2000/svg';
const hugeicon = (name, px, strokeWidth) => {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('color', 'currentColor');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', strokeWidth);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'stepper__icon');
  svg.style.width = U(px);
  svg.style.height = U(px);
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

// <Check />: the tick draws itself in when it mounts
function check() {
  const span = document.createElement('span');
  span.className = 'stepper__check';
  span.appendChild(hugeicon('Tick02Icon', 16, 2.4));
  const path = span.querySelector('path');
  if (path && typeof path.animate === 'function' && !reducedNow()) {
    path.style.strokeDasharray = '24';
    path.animate([{ strokeDashoffset: 24 }, { strokeDashoffset: 0 }], { duration: 360, easing: SETTLE });
  }
  return span;
}

const el = (tag, className) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
};
const setData = (node, name, on) => {
  if (on) node.setAttribute(name, '');
  else node.removeAttribute(name);
};

export function createStepper(host, opts = {}) {
  const o = {
    steps: [],
    initialStep: 1,
    onStepChange: () => {},
    onFinalStepCompleted: () => {},
    indicator: 'numbers',
    orientation: 'horizontal',
    transition: 'slide',
    linear: false,
    disableStepIndicators: false,
    renderStepIndicator: null,
    showFooter: true,
    backButtonText: 'Back',
    nextButtonText: 'Continue',
    completeButtonText: 'Complete',
    backButtonProps: {},
    nextButtonProps: {},
    completedContent: null,
    theme: 'dark',
    accentColor: undefined,
    frame: true,
    radius: 24,
    width: 440,
    className: '',
    stepCircleContainerClassName: '',
    stepContainerClassName: '',
    contentClassName: '',
    footerClassName: '',
    style: null,
    ...opts
  };

  const steps = (o.steps || []).filter(Boolean);
  const total = steps.length;
  let internal = o.initialStep;
  let current = clamp(Math.round(internal), 1, total + 1);
  const vertical = o.orientation === 'vertical';
  const kind = vertical ? 'numbers' : o.indicator;
  const labelled = steps.some(entry => entry.title);

  let compact = false;
  let tight = false;
  let reached = current;
  let view = { step: current, previous: null, direction: 1, id: 0 };
  const labelWidths = [];
  let placed = false;
  let heightRef = 0;
  let destroyed = false;

  // ---- DOM (the JSX, built once) ----
  const root = el('div');
  host.appendChild(root);
  const probe = el('span', 'stepper__probe');
  probe.setAttribute('aria-hidden', 'true');
  root.appendChild(probe);
  const unit = () => (probe.offsetWidth || 100) / 100;

  const applyVars = () => {
    for (const [name, value] of Object.entries(THEMES[o.theme] ?? THEMES.dark)) root.style.setProperty(name, unitize(value));
    root.style.setProperty('--stepper-radius', U(Math.max(0, o.radius)));
    root.style.setProperty('--stepper-spring', SPRING);
    root.style.setProperty('--stepper-width', size(o.width));
    if (o.accentColor) {
      root.style.setProperty('--stepper-solid', o.accentColor);
      root.style.setProperty('--stepper-solid-ink', readableOn(o.accentColor));
    }
    if (o.style) for (const [name, value] of Object.entries(o.style)) {
      if (name.startsWith('--')) root.style.setProperty(name, value);
      else root.style[name] = value;
    }
  };
  applyVars();

  const header = el('div', `stepper__header stepper__header--${kind} ${o.stepContainerClassName}`.trim());
  root.appendChild(header);
  const body = el('div', 'stepper__body');
  root.appendChild(body);
  const viewport = el('div', `stepper__viewport ${o.contentClassName}`.trim());
  viewport.setAttribute('aria-live', 'polite');
  body.appendChild(viewport);
  let paneEl = el('div', 'stepper__pane');
  paneEl.tabIndex = -1;
  viewport.appendChild(paneEl);
  let leavingEl = null;

  let footerWrap = null;
  let backBtn = null;
  let nextBtn = null;
  if (o.showFooter) {
    footerWrap = el('div', 'stepper__footer-wrap');
    const clip = el('div', 'stepper__footer-clip');
    const footer = el('div', `stepper__footer ${o.footerClassName}`.trim());
    backBtn = el('button', 'stepper__button stepper__button--back');
    backBtn.type = 'button';
    nextBtn = el('button', 'stepper__button stepper__button--next');
    nextBtn.type = 'button';
    footer.append(backBtn, nextBtn);
    clip.appendChild(footer);
    footerWrap.appendChild(clip);
    body.appendChild(footerWrap);
    backBtn.addEventListener('click', event => {
      const props = buttonProps(o.backButtonProps);
      props.onClick?.(event);
      if (!event.defaultPrevented) go(current - 1);
    });
    nextBtn.addEventListener('click', event => {
      const props = buttonProps(o.nextButtonProps);
      props.onClick?.(event);
      if (!event.defaultPrevented) go(current + 1);
    });
  }
  if (o.frame) {
    const rim = el('span', 'stepper__rim');
    rim.setAttribute('aria-hidden', 'true');
    root.appendChild(rim);
  }

  // header: numbers (track + glider + segments), dots or bars
  let track = null;
  let glider = null;
  const marks = [];
  if (kind === 'dots' || kind === 'bars') {
    const wrap = el('div', kind === 'dots' ? 'stepper__dots' : 'stepper__bars');
    header.appendChild(wrap);
    steps.forEach((entry, index) => {
      const number = index + 1;
      const button = el('button', kind === 'dots' ? 'stepper__dot' : 'stepper__bar');
      button.type = 'button';
      button.setAttribute('aria-label', entry.title ? `Step ${number}: ${entry.title}` : `Step ${number}`);
      const inner = kind === 'dots' ? el('span', 'stepper__dot-mark') : el('span', 'stepper__bar-track');
      let fill = null;
      if (kind === 'bars') {
        fill = el('span', 'stepper__bar-fill');
        inner.appendChild(fill);
      }
      button.appendChild(inner);
      button.addEventListener('click', () => go(number));
      wrap.appendChild(button);
      marks.push({ button, inner, fill });
    });
  } else {
    track = el('div', 'stepper__track');
    glider = el('span', 'stepper__glider');
    glider.setAttribute('aria-hidden', 'true');
    track.appendChild(glider);
    header.appendChild(track);
    steps.forEach((entry, index) => {
      const number = index + 1;
      const custom = typeof o.renderStepIndicator === 'function';
      const seg = el(custom ? 'div' : 'button', 'stepper__segment');
      if (!custom) {
        seg.type = 'button';
        seg.setAttribute('aria-label', typeof entry.title === 'string' ? `Step ${number}: ${entry.title}` : `Step ${number}`);
        seg.addEventListener('click', () => go(number));
      }
      const badge = custom ? null : el('span', 'stepper__badge');
      if (badge) seg.appendChild(badge);
      const textEl = el('span', 'stepper__text');
      const titleEl = el('span', 'stepper__title');
      if (entry.title) {
        if (entry.title instanceof Node) titleEl.appendChild(entry.title);
        else titleEl.textContent = entry.title;
      }
      textEl.appendChild(titleEl);
      let descEl = null;
      if (entry.description) {
        descEl = el('span', 'stepper__description');
        descEl.textContent = entry.description;
      }
      track.appendChild(seg);
      marks.push({ seg, badge, textEl, titleEl, descEl, status: null, custom, indicator: null });
    });
  }

  const buttonProps = props => (typeof props === 'function' ? props(current) || {} : props || {});
  const reachable = number =>
    !o.disableStepIndicators && number !== current && (!o.linear || number <= Math.min(reached, total));

  const paneContent = number => (number > total ? (o.completedContent ?? null) : steps[number - 1]?.content ?? null);
  const fill = (pane, number) => {
    const content = paneContent(number);
    if (content) pane.appendChild(content);
  };
  fill(paneEl, view.step);

  // ---- render: what React re-renders on every state change ----
  function render() {
    if (destroyed) return;
    current = clamp(Math.round(internal), 1, total + 1);
    const completed = current > total;
    const rail = vertical && !compact;
    if (current > reached) reached = current;

    root.className = `stepper stepper--${rail ? 'vertical' : 'horizontal'}${o.frame ? ' stepper--framed' : ''} ${o.stepCircleContainerClassName} ${o.className}`
      .replace(/\s+/g, ' ')
      .trim();
    setData(root, 'data-completed', completed);

    steps.forEach((entry, index) => {
      const number = index + 1;
      const status = completed || number < current ? 'complete' : number === current ? 'active' : 'upcoming';
      const m = marks[index];
      if (kind === 'dots' || kind === 'bars') {
        m.button.dataset.status = status;
        if (number === current) m.button.setAttribute('aria-current', 'step');
        else m.button.removeAttribute('aria-current');
        m.button.disabled = !reachable(number);
        if (kind === 'dots') m.inner.dataset.status = status;
        else setData(m.fill, 'data-filled', completed || number <= current);
        return;
      }
      m.seg.dataset.status = status;
      if (m.custom) {
        const next = o.renderStepIndicator({ step: number, currentStep: current, onStepClick: clicked => go(clicked) });
        if (m.indicator) m.indicator.remove();
        m.indicator = next instanceof Node ? next : null;
        if (m.indicator) m.seg.insertBefore(m.indicator, m.seg.firstChild);
      } else {
        if (number === current) m.seg.setAttribute('aria-current', 'step');
        else m.seg.removeAttribute('aria-current');
        m.seg.disabled = !reachable(number);
        if (m.status !== status) {
          // the badge: a check when complete (it mounts, so it draws), the step's icon, or its number
          m.badge.dataset.status = status;
          m.badge.replaceChildren();
          if (status === 'complete') m.badge.appendChild(check());
          else if (entry.icon) {
            const glyph = el('span', 'stepper__glyph');
            if (entry.icon instanceof Node) glyph.appendChild(entry.icon);
            else glyph.textContent = entry.icon;
            m.badge.appendChild(glyph);
          } else m.badge.textContent = String(number);
        }
      }
      m.status = status;
      m.titleEl.dataset.status = status;
      const showText = entry.title && !(tight && !rail);
      if (showText && !m.textEl.isConnected) m.seg.appendChild(m.textEl);
      if (!showText && m.textEl.isConnected) m.textEl.remove();
      if (m.descEl) {
        if (rail && !m.descEl.isConnected) m.textEl.appendChild(m.descEl);
        if (!rail && m.descEl.isConnected) m.descEl.remove();
      }
    });
    if (track) track.dataset.layout = rail ? 'rail' : 'row';

    let changed = false;
    if (view.step !== current) {
      view = { step: current, previous: view.step, direction: current > view.step ? 1 : -1, id: view.id + 1 };
      // React keeps the old pane by its key and renders it as the leaving pane; the one before it unmounts
      if (leavingEl) leavingEl.remove();
      leavingEl = paneEl;
      leavingEl.className = 'stepper__pane stepper__pane--leaving';
      leavingEl.setAttribute('aria-hidden', 'true');
      leavingEl.removeAttribute('tabindex');
      paneEl = el('div', 'stepper__pane');
      paneEl.tabIndex = -1;
      fill(paneEl, view.step);
      viewport.appendChild(paneEl);
      changed = true;
    }

    if (footerWrap) {
      setData(footerWrap, 'data-hidden', completed);
      if (completed) footerWrap.setAttribute('aria-hidden', 'true');
      else footerWrap.removeAttribute('aria-hidden');
      const isLast = current === total;
      const backProps = buttonProps(o.backButtonProps);
      const nextProps = buttonProps(o.nextButtonProps);
      backBtn.className = `stepper__button stepper__button--back ${backProps.className || ''}`.trim();
      nextBtn.className = `stepper__button stepper__button--next ${nextProps.className || ''}`.trim();
      setData(backBtn, 'data-hidden', current <= 1);
      backBtn.disabled = !!backProps.disabled;
      nextBtn.disabled = !!nextProps.disabled;
      backBtn.tabIndex = completed ? -1 : backProps.tabIndex ?? 0;
      nextBtn.tabIndex = completed ? -1 : nextProps.tabIndex ?? 0;
      const backLabel = el('span');
      backLabel.textContent = o.backButtonText;
      backBtn.replaceChildren(hugeicon('ArrowLeft01Icon', 16, 2), backLabel);
      const nextLabel = el('span');
      nextLabel.textContent = isLast ? o.completeButtonText : o.nextButtonText;
      nextBtn.replaceChildren(nextLabel, hugeicon(isLast ? 'Tick02Icon' : 'ArrowRight01Icon', 16, 2));
      for (const [btn, props] of [[backBtn, backProps], [nextBtn, nextProps]]) {
        for (const [name, value] of Object.entries(props)) {
          if (name === 'className' || name === 'onClick' || name === 'disabled' || name === 'tabIndex') continue;
          if (value === undefined || value === null || value === false) btn.removeAttribute(name);
          else btn.setAttribute(name, value === true ? '' : value);
        }
      }
    }

    // layout effects, in the original's order
    if (changed) transitionEffect();
    gliderEffect();
  }

  // ---- the measure pass (fold to compact, drop titles when they don't fit) ----
  const measure = () => {
    if (destroyed) return;
    const k = unit();
    const folded = vertical && root.clientWidth < 520 * k;
    let dirty = false;
    if (folded !== compact) {
      compact = folded;
      dirty = true;
    }
    let nextTight;
    if (!track || !labelled || (vertical && !folded)) nextTight = false;
    else {
      const segments = marks.slice(0, total).map(m => m.seg);
      if (!tight) {
        segments.forEach((segment, index) => {
          const title = marks[index].titleEl;
          labelWidths[index] = title && segment?.contains(title) ? title.scrollWidth + 8 * k : 0;
        });
      }
      const badges = segments.reduce((sum, segment) => sum + (segment?.firstElementChild?.offsetWidth ?? 22 * k) + 20 * k, 0);
      const labels = labelWidths.slice(0, total).reduce((sum, value) => sum + (value || 0), 0);
      const room = track.clientWidth - 8 * k - 4 * k * Math.max(0, total - 1);
      nextTight = badges + labels > room + 0.5;
    }
    if (nextTight !== tight) {
      tight = nextTight;
      dirty = true;
    }
    if (dirty) render();
  };
  const measureObserver = new ResizeObserver(measure);
  measureObserver.observe(root);

  // ---- the viewport's last height (the height animation starts from it) ----
  heightRef = viewport.offsetHeight;
  const heightObserver = new ResizeObserver(() => {
    heightRef = viewport.offsetHeight;
  });
  heightObserver.observe(viewport);

  // ---- pane transition ----
  function transitionEffect() {
    if (view.id === 0) return;
    const pane = paneEl;
    const leaving = leavingEl;
    const id = view.id;
    const reduced = reducedNow();
    const mode = typeof o.transition === 'function' ? 'custom' : o.transition === 'none' ? 'none' : reduced ? 'fade' : o.transition;
    const finish = () => {
      if (view.id !== id || view.previous === null) return;
      view = { ...view, previous: null };
      if (leavingEl === leaving) {
        leaving.remove();
        leavingEl = null;
      }
    };
    if (leaving && pane && leaving.contains(document.activeElement)) pane.focus({ preventScroll: true });
    // added: a page-made transition. It gets the same pieces the built-in ones use and calls finish() when it is done
    if (typeof o.transition === 'function') {
      for (const element of [viewport, pane, leaving]) element?.getAnimations().forEach(animation => animation.cancel());
      o.transition({ viewport, pane, leaving, from: heightRef, to: viewport.offsetHeight, direction: view.direction, vertical, reduced, spring: ease(), settle: SETTLE, finish });
      return;
    }
    if (!viewport || typeof viewport.animate !== 'function' || mode === 'none') {
      finish();
      return;
    }
    for (const element of [viewport, pane, leaving]) element?.getAnimations().forEach(animation => animation.cancel());
    const from = heightRef;
    const to = viewport.offsetHeight;
    const spring = ease();
    if (Math.abs(from - to) > 0.5) {
      viewport.animate([{ height: `${from}px` }, { height: `${to}px` }], {
        duration: reduced ? 200 : 560,
        easing: reduced ? SETTLE : spring
      });
    }
    const axis = vertical ? 'Y' : 'X';
    const shift = mode === 'slide' ? 36 * unit() : 0;
    if (pane) {
      if (shift) {
        pane.animate([{ transform: `translate${axis}(${view.direction * shift}px)` }, { transform: 'none' }], {
          duration: 560,
          easing: spring
        });
      }
      pane.animate([{ opacity: 0 }, { opacity: 0, offset: 0.25 }, { opacity: 1 }], {
        duration: 420,
        easing: 'ease-out'
      });
    }
    if (leaving) {
      leaving.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 140,
        easing: 'cubic-bezier(0.2, 0, 0.4, 1)',
        fill: 'forwards'
      });
      const exit = leaving.animate([{ transform: 'none' }, { transform: `translate${axis}(${-view.direction * shift}px)` }], {
        duration: 200,
        easing: 'cubic-bezier(0.4, 0, 1, 1)',
        fill: 'forwards'
      });
      exit.onfinish = finish;
    } else finish();
  }

  // ---- the gliding tile ----
  let gliderObserver = null;
  let gliderKey = '';
  let placeTile = null;
  function gliderEffect() {
    const completed = current > total;
    const key = [current, total, completed, kind, labelled, vertical, compact, tight].join('|');
    if (key === gliderKey) return;
    gliderKey = key;
    gliderObserver?.disconnect();
    if (!track || !glider) return;
    let at = '';
    const metrics = segment => `${segment.offsetLeft},${segment.offsetTop},${segment.offsetWidth},${segment.offsetHeight}`;
    const place = animate => {
      const segment = marks[Math.min(current, total) - 1]?.seg;
      if (!segment) return;
      const spring = ease();
      glider.style.transition = animate
        ? `transform 560ms ${spring}, width 560ms ${spring}, height 560ms ${spring}, opacity 200ms ease`
        : 'opacity 200ms ease';
      glider.style.transform = `translate3d(${segment.offsetLeft}px, ${segment.offsetTop}px, 0)`;
      glider.style.width = `${segment.offsetWidth}px`;
      glider.style.height = `${segment.offsetHeight}px`;
      // offsets only mean something once the track is the segments' offsetParent (stepper.css applied); until then the
      // tile stays hidden instead of sitting at a stale spot
      glider.style.opacity = completed || segment.offsetParent !== track ? '0' : '1';
      at = metrics(segment);
    };
    placeTile = place;
    place(placed && !reducedNow());
    placed = true;
    // a ResizeObserver also reports once as soon as it starts observing. Re-placing on a report that changed nothing would
    // swap in the no-glide transition right after a step change and cancel the running glide (CSS drops a running
    // transition whose property leaves transition-property), so the tile is only re-placed when its segment really moved
    gliderObserver = new ResizeObserver(() => {
      const segment = marks[Math.min(current, total) - 1]?.seg;
      if (segment && metrics(segment) !== at) place(false);
    });
    gliderObserver.observe(track);
  }

  // ---- go ----
  function go(target) {
    const next = clamp(target, 1, total + 1);
    // the latest requested step (not the last rendered one), so a callback can redirect: go() inside onStepChange /
    // onFinalStepCompleted wins over the go() that called it
    if (next === clamp(Math.round(internal), 1, total + 1)) return;
    internal = next;
    if (next > total) o.onFinalStepCompleted();
    else o.onStepChange(next);
    render();
  }

  render();
  measure();
  if (document.fonts?.ready) document.fonts.ready.then(() => measure());

  return {
    el: root,
    go,
    next: () => go(current + 1),
    back: () => go(current - 1),
    get current() {
      return current;
    },
    get total() {
      return total;
    },
    refresh: render,
    // added: measure again and re-place the tile without a glide (call once the page's CSS has loaded or the layout jumped)
    relayout() {
      heightRef = viewport.offsetHeight;
      measure();
      placeTile?.(false);
    },
    set(patch = {}) {
      Object.assign(o, patch);
      applyVars();
      render();
    },
    destroy() {
      destroyed = true;
      measureObserver.disconnect();
      heightObserver.disconnect();
      gliderObserver?.disconnect();
      root.remove();
    }
  };
}

export default createStepper;
