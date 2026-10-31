// React Bits "Magic Bento" (DavidHDev/react-bits, MIT + Commons Clause), ported to plain JS for Gage's site, 2026-10-29.
// The original (MagicBento.jsx / MagicBento.css / registry-MagicBento-JS-CSS.json) sits beside this file. The engine is the
// original code in the original order with the original numbers: the themes, the grid (columns, row height, gap, dense flow,
// fold to 2 / 1 columns under MIN_CELL / MIN_PAIR), the intro (cells rise 16 px from .97 on the spring, 80 ms apart, a wave
// from the top-left corner 260 ms in), the edge light that eases after the pointer (50 ms follow, 120 / 400 ms fade), the
// spotlight inside the card under the pointer (140 / 320 ms), the click wave (1.1 s ring across every card's edge), the press
// spring (420 / 28 to .985), tilt and magnetism springs (170 / 20, 6 deg / 6 px), the stars, the keyboard, the
// visibility pause. React's state and refs are plain variables; its JSX is DOM built once.
// What is different:
//  - sizes come from layout boxes (offsetLeft/Top/Width/Height, clientWidth), never getBoundingClientRect(): on Gage's page
//    the grid sits inside a CSS-3D-scaled parent. The pointer is turned from screen px into the grid's layout px by that
//    parent's scale (root.offsetWidth / its on-screen width) every frame, so the light stays under the pointer while the
//    camera moves; on an untransformed page the scale is 1 and the math is the original's.
//  - the light is measured on each CARD's box (cell box + card offset) instead of the cell's: identical while the card fills
//    its cell (always, in the original), and it keeps working when a page grows a card past its cell (Gage's FAQ opens one).
//  - every px of the original is calc(var(--mb-px, 1px) * n) (magic-bento.css); JS-side px (spotlight radius, MIN_CELL,
//    MIN_PAIR, magnet, wave reach, star sizes and speeds) are multiplied by the same unit, read from a hidden probe.
//    rowHeight / gap / radius accept a number (design px) or a CSS length string.
//  - the six demo artworks (analytics, dashboard, collaboration, automation, integration, security) are not ported: items
//    take { title, description, label, icon, image, content: Node, colSpan, rowSpan, href, onClick }.
//  - added: introOnView (true = the original's IntersectionObserver gate; false = the page calls api.enter()), and the api
//    { el, cells, cards, enter(), replayIntro(), refresh(), destroy() }.

const THEMES = {
  dark: {
    '--mb-surface': 'linear-gradient(180deg, #1a1820 0%, #121116 100%)',
    '--mb-edge': 'rgba(255, 255, 255, 0.07)',
    '--mb-highlight': 'rgba(255, 255, 255, 0.06)',
    '--mb-shadow': '0 24px 48px -28px rgba(0, 0, 0, 0.85), 0 8px 18px -12px rgba(0, 0, 0, 0.6)',
    '--mb-tile': 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
    '--mb-tile-edge': 'rgba(255, 255, 255, 0.07)',
    '--mb-tile-highlight': 'rgba(255, 255, 255, 0.12)',
    '--mb-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    '--mb-well': 'rgba(255, 255, 255, 0.03)',
    '--mb-well-edge': 'rgba(255, 255, 255, 0.06)',
    '--mb-ink': '#f4f4f5',
    '--mb-muted': 'rgba(244, 244, 245, 0.6)',
    '--mb-faint': 'rgba(244, 244, 245, 0.3)',
    '--mb-line': 'rgba(244, 244, 245, 0.1)',
    '--mb-secondary': '#a1a1aa',
    '--mb-secondary-ink': '#121016',
    '--mb-cursor-stroke': 'rgba(18, 16, 22, 0.9)',
    '--mb-ring': 'rgba(18, 16, 22, 0.85)',
    '--mb-focus': 'rgba(244, 244, 245, 0.5)',
    '--mb-glow-alpha': 0.85,
    '--mb-spot-alpha': 0.07
  },
  light: {
    '--mb-surface': 'linear-gradient(180deg, #ffffff 0%, #f7f7f9 100%)',
    '--mb-edge': 'rgba(24, 24, 27, 0.08)',
    '--mb-highlight': 'rgba(255, 255, 255, 1)',
    '--mb-shadow': '0 24px 48px -30px rgba(24, 24, 27, 0.28), 0 8px 18px -14px rgba(24, 24, 27, 0.16)',
    '--mb-tile': 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    '--mb-tile-edge': 'rgba(24, 24, 27, 0.08)',
    '--mb-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--mb-tile-shadow': '0 4px 10px -5px rgba(24, 24, 27, 0.22)',
    '--mb-well': 'rgba(24, 24, 27, 0.025)',
    '--mb-well-edge': 'rgba(24, 24, 27, 0.06)',
    '--mb-ink': '#18181b',
    '--mb-muted': 'rgba(24, 24, 27, 0.6)',
    '--mb-faint': 'rgba(24, 24, 27, 0.3)',
    '--mb-line': 'rgba(24, 24, 27, 0.08)',
    '--mb-secondary': '#71717a',
    '--mb-secondary-ink': '#ffffff',
    '--mb-cursor-stroke': '#ffffff',
    '--mb-ring': '#ffffff',
    '--mb-focus': 'rgba(24, 24, 27, 0.4)',
    '--mb-glow-alpha': 0.5,
    '--mb-spot-alpha': 0.035
  }
};

const INK = { dark: [244, 244, 245], light: [24, 24, 27] };
const MIN_CELL = 150;
const MIN_PAIR = 200;
const STAGGER = 80;
const TILT = 6;
const MAGNET = 6;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const U = n => `calc(var(--mb-px, 1px) * ${n})`;
const unitize = value => String(value).replace(/(-?\d*\.?\d+)px/g, (_, n) => U(n));
const len = value => (typeof value === 'number' ? U(value) : value);

const parseRgb = value => {
  if (!value) return null;
  const text = String(value).trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  if (hex) {
    const full = hex[1].length === 3 ? hex[1].replace(/./g, digit => digit + digit) : hex[1];
    return [0, 2, 4].map(index => parseInt(full.slice(index, index + 2), 16));
  }
  const numbers = text.match(/[\d.]+/g);
  if (numbers && numbers.length >= 3 && /^(rgba?\(|[\d.\s,]+$)/i.test(text)) {
    return numbers.slice(0, 3).map(channel => clamp(Math.round(parseFloat(channel)), 0, 255));
  }
  return null;
};

const inkFor = rgb => {
  const [r, g, b] = rgb.map(channel => channel / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55 ? '#121016' : '#ffffff';
};

const REPLAY = new Set([
  'magic-bento-draw',
  'magic-bento-fade',
  'magic-bento-grow',
  'magic-bento-pop',
  'magic-bento-select',
  'magic-bento-wait',
  'magic-bento-run',
  'magic-bento-check',
  'magic-bento-rail',
  'magic-bento-switch-track',
  'magic-bento-switch-knob'
]);

const FLOW = new Set(['magic-bento-wait', 'magic-bento-run', 'magic-bento-check', 'magic-bento-rail', 'magic-bento-fade']);

const finite = animation => {
  const timing = animation.effect?.getTiming?.();
  return timing ? timing.iterations !== Infinity : false;
};

const nameOf = animation => animation.animationName || '';

const el = (tag, className) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
};
const put = (parent, value) => {
  if (value instanceof Node) parent.appendChild(value);
  else if (value !== undefined && value !== null && value !== false) parent.textContent = String(value);
};

export function createMagicBento(host, opts = {}) {
  const o = {
    items: [],
    columns: 4,
    rowHeight: 200,
    gap: 12,
    radius: 20,
    theme: 'dark',
    glowColor: undefined,
    textAutoHide: true,
    enableBorderGlow: true,
    enableSpotlight: true,
    spotlightRadius: 300,
    enableStars: false,
    particleCount: 24,
    enableTilt: false,
    enableMagnetism: false,
    clickEffect: true,
    intro: true,
    introOnView: true,
    disableAnimations: false,
    onItemClick: undefined,
    className: '',
    style: null,
    ...opts
  };
  const items = o.items || [];
  const palette = o.theme === 'light' ? 'light' : 'dark';
  const glow = parseRgb(o.glowColor) ?? INK[palette];
  const settings = {
    columns: Math.max(1, Math.round(o.columns)),
    enableBorderGlow: o.enableBorderGlow,
    enableSpotlight: o.enableSpotlight,
    spotlightRadius: Math.max(40, o.spotlightRadius),
    enableStars: o.enableStars,
    particleCount: clamp(Math.round(o.particleCount), 0, 120),
    enableTilt: o.enableTilt,
    enableMagnetism: o.enableMagnetism,
    clickEffect: o.clickEffect,
    intro: o.intro,
    disableAnimations: o.disableAnimations,
    glow
  };
  let cols = settings.columns;

  // ---- DOM (the JSX) ----
  const root = el('div', `magic-bento ${o.className}`.trim());
  if (o.textAutoHide) root.dataset.autohide = '';
  if (!o.disableAnimations) root.dataset.motion = '';
  if (o.intro && !o.disableAnimations) root.dataset.intro = '';
  const ink = INK[palette];
  const accent = parseRgb(o.glowColor) ?? ink;
  const corner = Math.max(0, o.radius);
  const vars = {
    ...THEMES[palette],
    '--mb-glow-rgb': glow.join(', '),
    '--mb-accent-rgb': accent.join(', '),
    '--mb-accent-ink': inkFor(accent),
    '--mb-radius': U(corner),
    '--mb-inner-radius': U(Math.round(clamp(corner * 0.5, 6, 12))),
    '--mb-pad': U(Math.round(clamp(corner * 0.85, 14, 20))),
    '--mb-spot-size': U(Math.max(40, o.spotlightRadius)),
    '--mb-border-size': U(Math.round(Math.max(40, o.spotlightRadius) * 0.75))
  };
  for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, unitize(value));
  const layoutGrid = () => {
    const span = Math.max(1, cols);
    root.style.gridTemplateColumns = `repeat(${span}, minmax(0, 1fr))`;
    root.style.gridAutoRows = span === 1 ? `minmax(${len(o.rowHeight)}, auto)` : len(o.rowHeight);
    root.style.gap = len(typeof o.gap === 'number' ? Math.max(0, o.gap) : o.gap);
    cells.forEach((cell, index) => {
      const entry = items[index] ?? {};
      cell.style.gridColumn = `span ${Math.min(span, Math.max(1, Math.round(entry.colSpan ?? 1)))}`;
      cell.style.gridRow = `span ${Math.max(1, Math.round(entry.rowSpan ?? 1))}`;
    });
  };
  if (o.style) for (const [name, value] of Object.entries(o.style)) {
    if (name.startsWith('--')) root.style.setProperty(name, value);
    else root.style[name] = value;
  }
  const probe = el('span', 'magic-bento__probe');
  probe.setAttribute('aria-hidden', 'true');
  root.appendChild(probe);
  const unit = () => (probe.offsetWidth || 100) / 100;

  const cells = [];
  const cards = [];
  const stars = [];
  items.forEach((item, index) => {
    const entry = item ?? {};
    const clickable = Boolean(entry.href || entry.onClick || o.onItemClick);
    const cell = el('div', 'magic-bento__cell');
    const card = el(entry.href ? 'a' : 'div', 'magic-bento__card');
    if (clickable) card.dataset.clickable = '';
    if (entry.image) card.dataset.image = '';
    if (entry.href) {
      card.href = entry.href;
      if (entry.target) card.target = entry.target;
      if (entry.rel) card.rel = entry.rel;
    } else if (clickable) {
      card.setAttribute('role', 'button');
      card.tabIndex = 0;
      if (entry.title) card.setAttribute('aria-label', typeof entry.title === 'string' ? entry.title : card.textContent);
    }
    if (clickable) {
      card.addEventListener('click', event => {
        entry.onClick?.(event);
        o.onItemClick?.(entry, index);
      });
    }
    if (entry.image) {
      const img = el('img', 'magic-bento__image');
      img.src = entry.image;
      img.alt = '';
      img.draggable = false;
      card.appendChild(img);
      card.appendChild(el('span', 'magic-bento__scrim'));
    }
    if (o.enableSpotlight) card.appendChild(el('span', 'magic-bento__light'));
    if (o.enableStars) {
      const canvas = el('canvas', 'magic-bento__stars');
      canvas.setAttribute('aria-hidden', 'true');
      card.appendChild(canvas);
      stars[index] = canvas;
    }
    const content = el('div', 'magic-bento__content');
    if (entry.content) put(content, entry.content);
    else {
      if (entry.icon || entry.label) {
        const head = el('div', 'magic-bento__header');
        if (entry.icon) {
          const icon = el('span', 'magic-bento__icon');
          put(icon, entry.icon);
          head.appendChild(icon);
        }
        if (entry.label) {
          const label = el('span', 'magic-bento__label');
          put(label, entry.label);
          head.appendChild(label);
        }
        content.appendChild(head);
      }
      if (entry.visual instanceof Node) {
        const visual = el('div', 'magic-bento__visual');
        visual.setAttribute('aria-hidden', 'true');
        visual.appendChild(entry.visual);
        content.appendChild(visual);
      }
      if (entry.title || entry.description) {
        const text = el('div', 'magic-bento__text');
        if (entry.title) {
          const h = el('h3', 'magic-bento__title');
          put(h, entry.title);
          text.appendChild(h);
        }
        if (entry.description) {
          const p = el('p', 'magic-bento__description');
          put(p, entry.description);
          text.appendChild(p);
        }
        content.appendChild(text);
      }
    }
    card.appendChild(content);
    card.appendChild(el('span', 'magic-bento__rim'));
    card.appendChild(el('span', 'magic-bento__border'));
    cell.appendChild(card);
    root.appendChild(cell);
    cells[index] = cell;
    cards[index] = card;
  });
  layoutGrid();
  host.appendChild(root);

  // ---- the engine (the original's layout effect) ----
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion = !settings.disableAnimations && !reduced;
  const playIntro = motion && settings.intro;
  if (motion) root.dataset.motion = '';
  else delete root.dataset.motion;
  if (playIntro) root.dataset.intro = '';
  else delete root.dataset.intro;

  const pointer = { x: -1e5, y: -1e5, cx: -1e5, cy: -1e5, inside: false, down: -1 };
  const light = { x: -1e5, y: -1e5, near: 0, ready: false };
  const states = [];
  const wave = { x: 0, y: 0, t: -1, duration: 1.1, reach: 800 };
  let rects = [];
  let bounds = null;
  let dirty = true;
  let raf = 0;
  let last = 0;
  let visible = true;
  let entered = !playIntro;
  let settleTimer = 0;
  let introTimer = 0;
  let k = 1;
  const lastFlow = [];

  const stateFor = index => {
    if (!states[index]) {
      states[index] = {
        hot: 0,
        rx: 0,
        ry: 0,
        tx: 0,
        ty: 0,
        vrx: 0,
        vry: 0,
        vtx: 0,
        vty: 0,
        press: 1,
        vpress: 0,
        stars: 0,
        particles: null,
        active: false,
        written: {}
      };
    }
    return states[index];
  };

  const write = (element, state, name, value) => {
    if (state.written[name] === value) return;
    state.written[name] = value;
    element.style.setProperty(name, value);
  };

  // screen px → the grid's layout px (the scale a transformed parent applies; 1 on a flat page)
  const toLocal = (clientX, clientY) => {
    const r = root.getBoundingClientRect();
    const kx = r.width > 0 ? root.offsetWidth / r.width : 1;
    const ky = r.height > 0 ? root.offsetHeight / r.height : 1;
    return [(clientX - r.left) * kx, (clientY - r.top) * ky];
  };

  const measure = () => {
    dirty = false;
    k = unit();
    const width = root.offsetWidth;
    const height = root.offsetHeight;
    bounds = { left: 0, top: 0, right: width, bottom: height };
    rects = cards.map((card, index) => {
      const cell = cells[index];
      if (!card || !cell) return null;
      return {
        left: cell.offsetLeft + card.offsetLeft,
        top: cell.offsetTop + card.offsetTop,
        width: card.offsetWidth,
        height: card.offsetHeight
      };
    });
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    stars.forEach((canvas, index) => {
      const rect = rects[index];
      if (!canvas || !rect) return;
      const w = Math.max(1, Math.round(rect.width * ratio));
      const h = Math.max(1, Math.round(rect.height * ratio));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    });
  };

  const seed = (index, rect) => {
    const count = settings.particleCount;
    const state = stateFor(index);
    if (state.particles && state.particles.length === count) return state.particles;
    state.particles = Array.from({ length: count }, () => ({
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      vx: (Math.random() - 0.5) * 6 * k,
      vy: (-4 - Math.random() * 10) * k,
      size: (0.6 + Math.random() * 1.1) * k,
      phase: Math.random() * Math.PI * 2,
      rate: 1.2 + Math.random() * 2.4
    }));
    return state.particles;
  };

  const drawStars = (index, rect, state, lx, ly, dt, now) => {
    const canvas = stars[index];
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const ratio = canvas.width / Math.max(1, rect.width);
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (state.stars < 0.004) return;
    const s = settings;
    const particles = seed(index, rect);
    const reach = s.spotlightRadius * 0.75 * k;
    const [r, g, b] = s.glow;
    const edge = 4 * k;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    for (const particle of particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      if (particle.y < -edge) {
        particle.y = rect.height + edge;
        particle.x = Math.random() * rect.width;
      }
      if (particle.x < -edge) particle.x = rect.width + edge;
      if (particle.x > rect.width + edge) particle.x = -edge;
      const distance = Math.hypot(particle.x - lx, particle.y - ly) / reach;
      if (distance >= 1) continue;
      const falloff = 1 - distance * distance * (3 - 2 * distance);
      const twinkle = 0.55 + 0.45 * Math.sin(now * 0.001 * particle.rate + particle.phase);
      const alpha = state.stars * falloff * twinkle;
      if (alpha < 0.01) continue;
      context.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
    }
  };

  const replay = (card, filter) => {
    if (!motion || !card.getAnimations) return;
    for (const animation of card.getAnimations({ subtree: true })) {
      if (!filter.has(nameOf(animation)) || !finite(animation)) continue;
      const target = animation.effect instanceof KeyframeEffect ? animation.effect.target : null;
      if (target instanceof Element && target.classList.contains('magic-bento__cursor')) continue;
      animation.currentTime = 0;
      animation.play();
    }
  };

  const startWave = (x, y, duration) => {
    if (!motion || !bounds) return;
    wave.x = x;
    wave.y = y;
    wave.t = 0;
    wave.duration = duration;
    wave.reach =
      Math.max(
        Math.hypot(x - bounds.left, y - bounds.top),
        Math.hypot(x - bounds.right, y - bounds.top),
        Math.hypot(x - bounds.left, y - bounds.bottom),
        Math.hypot(x - bounds.right, y - bounds.bottom)
      ) +
      140 * k;
  };

  const frame = now => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    if (dirty) measure();
    const s = settings;
    let busy = false;
    if (pointer.inside) [pointer.x, pointer.y] = toLocal(pointer.cx, pointer.cy);

    const margin = s.spotlightRadius * 0.5 * k;
    const near =
      pointer.inside &&
      bounds &&
      pointer.x > bounds.left - margin &&
      pointer.x < bounds.right + margin &&
      pointer.y > bounds.top - margin &&
      pointer.y < bounds.bottom + margin
        ? 1
        : 0;
    if (!light.ready && near) {
      light.x = pointer.x;
      light.y = pointer.y;
      light.ready = true;
    }
    const follow = 1 - Math.exp(-dt / 0.05);
    light.x += (pointer.x - light.x) * follow;
    light.y += (pointer.y - light.y) * follow;
    const fade = 1 - Math.exp(-dt / (near > light.near ? 0.12 : 0.4));
    light.near += (near - light.near) * fade;
    if (Math.abs(near - light.near) < 0.002) light.near = near;
    else busy = true;
    if (Math.abs(pointer.x - light.x) + Math.abs(pointer.y - light.y) > 0.3) busy = true;

    let waveRadius = 0;
    let waveAlpha = 0;
    if (wave.t >= 0) {
      wave.t += dt;
      const progress = Math.min(1, wave.t / wave.duration);
      waveRadius = wave.reach * (1 - Math.pow(1 - progress, 2.2));
      waveAlpha = Math.pow(1 - progress, 1.3);
      if (progress >= 1) {
        wave.t = -1;
        waveAlpha = 0;
      } else busy = true;
    }

    cards.forEach((card, index) => {
      const rect = rects[index];
      if (!card || !rect) return;
      const state = stateFor(index);
      const lx = light.x - rect.left;
      const ly = light.y - rect.top;
      const px = pointer.x - rect.left;
      const py = pointer.y - rect.top;
      const inside = pointer.inside && entered && px >= 0 && py >= 0 && px <= rect.width && py <= rect.height;

      if (inside !== state.active) {
        state.active = inside;
        if (inside) {
          card.dataset.active = '';
          if (now - (lastFlow[index] || -1e9) > 3200 && card.querySelector('.magic-bento__steps')) {
            lastFlow[index] = now;
            replay(card, FLOW);
          }
        } else delete card.dataset.active;
      }

      const hotTarget = inside && s.enableSpotlight ? 1 : 0;
      state.hot += (hotTarget - state.hot) * (1 - Math.exp(-dt / (hotTarget > state.hot ? 0.14 : 0.32)));
      if (Math.abs(hotTarget - state.hot) < 0.002) state.hot = hotTarget;
      else busy = true;

      const u = clamp(px / Math.max(1, rect.width), 0, 1) - 0.5;
      const v = clamp(py / Math.max(1, rect.height), 0, 1) - 0.5;
      const tilt = inside && s.enableTilt && motion;
      const magnet = inside && s.enableMagnetism && motion;
      const targets = [
        tilt ? -v * 2 * TILT : 0,
        tilt ? u * 2 * TILT : 0,
        magnet ? u * 2 * MAGNET * k : 0,
        magnet ? v * 2 * MAGNET * k : 0
      ];
      const keys = [
        ['rx', 'vrx'],
        ['ry', 'vry'],
        ['tx', 'vtx'],
        ['ty', 'vty']
      ];
      const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
      const h = dt / steps;
      keys.forEach(([key, velocity], j) => {
        for (let step = 0; step < steps; step++) {
          state[velocity] += (170 * (targets[j] - state[key]) - 20 * state[velocity]) * h;
          state[key] += state[velocity] * h;
        }
        if (Math.abs(targets[j] - state[key]) < 0.002 && Math.abs(state[velocity]) < 0.01) {
          state[key] = targets[j];
          state[velocity] = 0;
        } else busy = true;
      });
      const pressTarget = pointer.down === index && s.clickEffect && motion ? 0.985 : 1;
      for (let step = 0; step < steps; step++) {
        state.vpress += (420 * (pressTarget - state.press) - 28 * state.vpress) * h;
        state.press += state.vpress * h;
      }
      if (Math.abs(pressTarget - state.press) < 0.0002 && Math.abs(state.vpress) < 0.001) {
        state.press = pressTarget;
        state.vpress = 0;
      } else busy = true;

      write(card, state, '--mb-x', `${lx.toFixed(1)}px`);
      write(card, state, '--mb-y', `${ly.toFixed(1)}px`);
      write(card, state, '--mb-near', (s.enableBorderGlow ? light.near : 0).toFixed(3));
      write(card, state, '--mb-hot', state.hot.toFixed(3));
      write(card, state, '--mb-rx', `${state.rx.toFixed(3)}deg`);
      write(card, state, '--mb-ry', `${state.ry.toFixed(3)}deg`);
      write(card, state, '--mb-tx', `${state.tx.toFixed(2)}px`);
      write(card, state, '--mb-ty', `${state.ty.toFixed(2)}px`);
      write(card, state, '--mb-press', state.press.toFixed(4));
      write(card, state, '--mb-wx', `${(wave.x - rect.left).toFixed(1)}px`);
      write(card, state, '--mb-wy', `${(wave.y - rect.top).toFixed(1)}px`);
      write(card, state, '--mb-wr', `${waveRadius.toFixed(1)}px`);
      write(card, state, '--mb-wa', waveAlpha.toFixed(3));

      if (s.enableStars && stars[index]) {
        const starTarget = inside && motion ? 1 : 0;
        state.stars += (starTarget - state.stars) * (1 - Math.exp(-dt / (starTarget ? 0.3 : 0.5)));
        if (state.stars < 0.004 && !starTarget) state.stars = 0;
        if (state.stars > 0 || starTarget) {
          drawStars(index, rect, state, lx, ly, dt, now);
          state.drawn = true;
          busy = true;
        } else if (state.drawn) {
          drawStars(index, rect, state, lx, ly, dt, now);
          state.drawn = false;
        }
      }
    });

    if (busy && visible) raf = requestAnimationFrame(frame);
  };

  const wake = () => {
    if (raf || !visible) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const cardIndex = target => {
    if (!(target instanceof Element)) return -1;
    const card = target.closest('.magic-bento__card');
    return card instanceof HTMLElement ? cards.indexOf(card) : -1;
  };

  const onPointerMove = event => {
    pointer.cx = event.clientX;
    pointer.cy = event.clientY;
    pointer.inside = true;
    wake();
  };

  const onPointerOut = event => {
    if (event.relatedTarget) return;
    pointer.inside = false;
    pointer.down = -1;
    wake();
  };

  const onPointerDown = event => {
    pointer.cx = event.clientX;
    pointer.cy = event.clientY;
    pointer.inside = true;
    pointer.down = cardIndex(event.target);
    wake();
  };

  const release = () => {
    if (pointer.down < 0) return;
    pointer.down = -1;
    wake();
  };

  const activate = (index, x, y) => {
    const card = cards[index];
    if (!card) return;
    if (settings.clickEffect) {
      if (dirty) measure();
      startWave(x, y, 1.1);
      replay(card, REPLAY);
      lastFlow[index] = performance.now();
    }
    wake();
  };

  const onClick = event => {
    const index = cardIndex(event.target);
    const card = cards[index];
    if (!card) return;
    if (dirty) measure();
    if (event.detail === 0) {
      const rect = rects[index];
      activate(index, rect.left + rect.width / 2, rect.top + rect.height / 2);
    } else {
      const [x, y] = toLocal(event.clientX, event.clientY);
      activate(index, x, y);
    }
  };

  const onKeyDown = event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = cards[cardIndex(event.target)];
    if (!card || event.target !== card || card.tagName === 'A') return;
    event.preventDefault();
    card.click();
  };

  const onScroll = () => {
    dirty = true;
    wake();
  };

  const resizeObserver = new ResizeObserver(() => {
    const width = root.clientWidth;
    const gap = parseFloat(getComputedStyle(root).columnGap) || 0;
    const kk = unit();
    const cell = count => (width - gap * (count - 1)) / count;
    const next =
      cell(settings.columns) >= MIN_CELL * kk ? settings.columns : settings.columns >= 2 && cell(2) >= MIN_PAIR * kk ? 2 : 1;
    if (next !== cols) {
      cols = next;
      layoutGrid();
      sync();
    }
    dirty = true;
    wake();
  });
  resizeObserver.observe(root);

  const enter = () => {
    if (entered && root.dataset.entered === '') return;
    entered = true;
    root.dataset.entered = '';
    let order = 0;
    cells.forEach(cell => {
      if (!cell) return;
      cell.style.setProperty('--mb-delay', `${order++ * STAGGER}ms`);
      cell.dataset.state = 'in';
    });
    if (dirty) measure();
    clearTimeout(introTimer);
    clearTimeout(settleTimer);
    introTimer = window.setTimeout(() => {
      if (bounds) startWave(bounds.left, bounds.top, 1.7);
      wake();
    }, 260);
    settleTimer = window.setTimeout(() => {
      cells.forEach(cell => cell?.style.setProperty('--mb-delay', '0ms'));
    }, order * STAGGER + 2600);
    wake();
  };

  let gate = null;
  if (playIntro && o.introOnView && typeof IntersectionObserver !== 'undefined') {
    gate = new IntersectionObserver(
      (entries, observer) => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        observer.disconnect();
        enter();
      },
      { threshold: 0.15 }
    );
    gate.observe(root);
  } else if (!playIntro) {
    cells.forEach(cell => {
      if (!cell) return;
      cell.style.setProperty('--mb-delay', '0ms');
      cell.dataset.state = 'in';
    });
    root.dataset.entered = '';
    if (motion) {
      for (const animation of root.getAnimations ? root.getAnimations({ subtree: true }) : []) {
        if (REPLAY.has(nameOf(animation)) && finite(animation)) animation.finish();
      }
    }
  }

  const visibility = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    if (visible) {
      dirty = true;
      wake();
    }
  });
  visibility.observe(root);

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('pointerup', release, { passive: true });
  window.addEventListener('pointercancel', release, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true, capture: true });
  window.addEventListener('resize', onScroll, { passive: true });
  document.addEventListener('pointerout', onPointerOut);
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKeyDown);

  function sync() {
    cells.forEach(cell => {
      if (!cell || (!entered && playIntro)) return;
      if (cell.dataset.state !== 'in') {
        cell.style.setProperty('--mb-delay', '0ms');
        cell.dataset.state = 'in';
      }
    });
    dirty = true;
    wake();
  }

  return {
    el: root,
    cells,
    cards,
    enter,
    // added: hide the cells and run the intro again (a page that brings the grid in more than once)
    replayIntro() {
      if (!playIntro) return;
      entered = false;
      delete root.dataset.entered;
      cells.forEach(cell => {
        if (!cell) return;
        delete cell.dataset.state;
        cell.style.setProperty('--mb-delay', '0ms');
      });
      void root.offsetWidth;
      enter();
    },
    refresh() {
      dirty = true;
      wake();
    },
    destroy() {
      cancelAnimationFrame(raf);
      window.clearTimeout(settleTimer);
      window.clearTimeout(introTimer);
      gate?.disconnect();
      visibility.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
      document.removeEventListener('pointerout', onPointerOut);
      root.removeEventListener('click', onClick);
      root.removeEventListener('keydown', onKeyDown);
      root.remove();
    }
  };
}

export default createMagicBento;
