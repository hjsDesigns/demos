// React Bits "Circular Carousel" (DavidHDev/react-bits, MIT + Commons Clause), ported to plain JS for Gage's site.
// The original (CircularCarousel.jsx / .css) sits beside this file. Everything that moves is the original code, in the
// original order, with the original numbers: the four presets, the cards bent from 8 strips (2.5 px overlap), the radius
// from chord and arc, the fit-to-container pass, the three intros (rise / assemble / spin), drift and its momentum blend,
// step autoplay, drag -> momentum -> snap (SPRING 118, critically damped, SETTLE_SPEED 9), the wheel, the keys, pause on
// hover, focus on click, pointer parallax, stretch, depth fade, inner shade, the swap crossfade and reduced motion.
// React's state and refs are plain variables; its JSX is DOM built once and patched where React would patch it.
// What is different:
//  - measure() reads the root's layout box (ResizeObserver border box) instead of getBoundingClientRect(): on Gage's page
//    the carousel sits inside a CSS-3D-transformed parent that scales it, and the visual size would scale it twice.
//  - for the same reason a drag turns screen pixels into layout pixels by that parent's scale, so the card stays under the
//    finger as it does in the original (on an untransformed page the scale is exactly 1 and the math is the original's).
//  - added: onCardEnter / onCardLeave / onActiveChange, the api (tiles, cardSize, setImage, setItems, pause, resume, goTo,
//    hold, destroy), and two options the component doesn't have: label (the aria-label it hardcodes, same default) and height
//    (sets the root's height; otherwise the root fills the host, the way it fills its parent in React).

const photo = id => `https://images.unsplash.com/${id}?w=900&q=80&auto=format&fit=max&sat=-100`;

const DEFAULT_ITEMS = [
  { src: photo('photo-1506744038136-46273834b3fb'), alt: 'Mist drifting through a mountain valley', title: 'Valley', subtitle: 'Landscape' },
  { src: photo('photo-1524504388940-b1c1722653e1'), alt: 'A woman with long hair in soft studio light', title: 'Portrait', subtitle: 'Studio' },
  { src: photo('photo-1486406146926-c627a92ad1ab'), alt: 'Glass towers seen from street level', title: 'Towers', subtitle: 'Architecture' },
  { src: photo('photo-1502680390469-be75c86b636f'), alt: 'A surfer carving inside a breaking wave', title: 'Swell', subtitle: 'Ocean' },
  { src: photo('photo-1487958449943-2429e8be8625'), alt: 'An angular white building against the sky', title: 'Facade', subtitle: 'Architecture' },
  { src: photo('photo-1509631179647-0177331693ae'), alt: 'A model in striped trousers leaning on a wall', title: 'Pose', subtitle: 'Editorial' },
  { src: photo('photo-1519681393784-d120267933ba'), alt: 'The Milky Way above snowy peaks', title: 'Night', subtitle: 'Sky' },
  { src: photo('photo-1485968579580-b6d095142e6e'), alt: 'A woman in a long coat on a city street', title: 'Street', subtitle: 'Editorial' },
  { src: photo('photo-1493246507139-91e8fad9978e'), alt: 'Mountains mirrored in a still lake', title: 'Mirror', subtitle: 'Landscape' },
  { src: photo('photo-1511818966892-d7d671e672a2'), alt: 'A glass skyscraper under a cloudy sky', title: 'Glass', subtitle: 'Architecture' }
];

const PRESETS = {
  cylinder: { axis: 'y', tilt: -5, perspective: 2500, curve: 1, spread: 1, inward: false, billboard: false, backfaces: true, window: 0 },
  orbit: { axis: 'y', tilt: -16, perspective: 1500, curve: 0, spread: 1.45, inward: false, billboard: true, backfaces: false, window: 0 },
  wheel: { axis: 'x', tilt: 0, perspective: 1800, curve: 0, spread: 1, inward: false, billboard: false, backfaces: true, window: 1.7 },
  panorama: { axis: 'y', tilt: 0, perspective: 0, curve: 1, spread: 1, inward: true, billboard: false, backfaces: false, window: 0 }
};

const INTRO_LENGTH = { assemble: 1500, rise: 1400, spin: 1800, none: 0 };
const TILES = 8;
const OVERLAP = 2.5;
const DRAG_THRESHOLD = 5;
const SPRING = 118;
const SETTLE_SPEED = 9;
const CAPTION_SPACE = 76;
const SWAP_LENGTH = 700;
const SWAP_SPREAD = 420;
const TO_RAD = Math.PI / 180;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const wrap = degrees => ((((degrees + 180) % 360) + 360) % 360) - 180;
const easeOut = t => 1 - Math.pow(1 - t, 4);
const easeOutQuint = t => 1 - Math.pow(1 - t, 5);

const rotateX = (p, degrees) => {
  const r = degrees * TO_RAD;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
};

const rotateY = (p, degrees) => {
  const r = degrees * TO_RAD;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
};

// the component's props with its defaults (+ the added options and hooks at the end)
const DEFAULTS = {
  items: DEFAULT_ITEMS,
  preset: 'cylinder',
  intro: 'rise',
  cardWidth: 220,
  aspectRatio: 1,
  gap: 25,
  curve: undefined,
  tilt: undefined,
  perspective: undefined,
  autoplay: 'drift',
  speed: 14,
  interval: 3,
  direction: 'left',
  draggable: true,
  momentum: 0.6,
  snap: true,
  pauseOnHover: true,
  focusOnClick: true,
  parallax: 0.3,
  stretch: 0.5,
  depthFade: 0.55,
  fadeColor: '#000000',
  innerShade: 0.6,
  cornerRadius: 12,
  captions: false,
  onChange: undefined,
  onItemClick: undefined,
  className: '',
  style: undefined,
  label: 'Image carousel',
  height: undefined,
  onCardEnter: undefined,
  onCardLeave: undefined,
  onActiveChange: undefined
};

// React's style prop: numbers get px unless the property is unitless, custom properties go through setProperty
const UNITLESS = new Set([
  'animationIterationCount', 'aspectRatio', 'borderImageOutset', 'borderImageSlice', 'borderImageWidth', 'columnCount', 'columns',
  'flex', 'flexGrow', 'flexShrink', 'flexPositive', 'flexNegative', 'flexOrder', 'fontWeight', 'gridArea', 'gridRow', 'gridRowEnd',
  'gridRowStart', 'gridColumn', 'gridColumnEnd', 'gridColumnStart', 'lineClamp', 'lineHeight', 'opacity', 'order', 'orphans', 'scale',
  'tabSize', 'widows', 'zIndex', 'zoom', 'fillOpacity', 'floodOpacity', 'stopOpacity', 'strokeDasharray', 'strokeDashoffset',
  'strokeMiterlimit', 'strokeOpacity', 'strokeWidth'
]);
const applyStyle = (el, style) => {
  if (!style) return;
  if (typeof style === 'string') {
    el.style.cssText += `;${style}`;
    return;
  }
  for (const key of Object.keys(style)) {
    const value = style[key];
    if (value == null || typeof value === 'boolean' || value === '') continue;
    const custom = key.startsWith('--');
    const text = !custom && typeof value === 'number' && value !== 0 && !UNITLESS.has(key) ? `${value}px` : String(value).trim();
    if (custom || key.includes('-')) el.style.setProperty(key, text);
    else el.style[key] = text;
  }
};

const make = (tag, className) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  return el;
};
const place = (el, box) => {
  for (const key of Object.keys(box)) el.style[key] = `${box[key]}px`;
};

export function createCircularCarousel(host, options = {}) {
  // a prop left undefined takes its default, as with the original's destructuring
  const o = { ...DEFAULTS };
  for (const key of Object.keys(options || {})) if (options[key] !== undefined) o[key] = options[key];
  const {
    preset, intro, cardWidth, aspectRatio, gap, curve, tilt, perspective, autoplay, speed, interval, direction, draggable,
    momentum, snap, pauseOnHover, focusOnClick, parallax, stretch, depthFade, fadeColor, innerShade, cornerRadius, captions
  } = o;

  // ---------- the component body ----------
  const incoming = o.items && o.items.length ? o.items : DEFAULT_ITEMS;
  let list = incoming;
  let leaving = null;
  const shape = PRESETS[preset] ? preset : 'cylinder';
  const layout = PRESETS[shape];
  const axis = layout.axis;
  const tiltValue = tilt ?? layout.tilt;
  const curveValue = layout.billboard ? 0 : clamp(curve ?? layout.curve, 0, 1);
  const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let reduced = Boolean(query && query.matches);

  const cardW = Math.max(40, cardWidth);
  const cardH = cardW / clamp(aspectRatio, 0.2, 5);
  const along = axis === 'x' ? cardH : cardW;
  let count;
  let step;
  let radius;
  let tiles;

  const geometry = () => {
    count = list.length;
    step = 360 / count;

    // radius (useMemo)
    const n = Math.max(count, 3);
    const pitch = (along + gap) * layout.spread;
    const chord = pitch / (2 * Math.sin(Math.PI / n));
    const arc = (n * pitch) / (2 * Math.PI);
    radius = Math.max(chord + (arc - chord) * curveValue, along * 0.6);

    // tiles (useMemo)
    const total = curveValue > 0.001 ? TILES : 1;
    const length = along / total;
    const bend = curveValue > 0.001 ? radius / curveValue : 0;
    tiles = Array.from({ length: total }, (_, index) => {
      const start = index * length - (index > 0 ? OVERLAP / 2 : 0);
      const end = (index + 1) * length + (index < total - 1 ? OVERLAP / 2 : 0);
      const center = (start + end) / 2 - along / 2;
      const alpha = bend ? center / bend : 0;
      const shift = bend ? bend * Math.sin(alpha) : center;
      const sink = bend ? bend * (1 - Math.cos(alpha)) : 0;
      const depth = layout.inward ? sink : -sink;
      const turn = ((layout.inward ? -alpha : alpha) * 180) / Math.PI;
      const move =
        axis === 'x'
          ? `translate3d(0px, ${shift}px, ${depth}px) rotateX(${-turn}deg)`
          : `translate3d(${shift}px, 0px, ${depth}px) rotateY(${turn}deg)`;
      return { index, total, start, end, size: end - start, move };
    });
  };
  geometry();

  let settings;
  const computeSettings = () => {
    settings = {
      count,
      step,
      radius,
      layout,
      axis,
      tilt: tiltValue,
      perspective: layout.inward ? radius : (perspective ?? layout.perspective),
      cardW,
      cardH,
      intro: reduced ? 'none' : intro in INTRO_LENGTH ? intro : 'rise',
      autoplay: reduced ? 'off' : autoplay,
      speed,
      interval: Math.max(0.5, interval),
      draggable,
      momentum: clamp(momentum, 0, 1),
      snap,
      pauseOnHover,
      parallax: reduced ? 0 : clamp(parallax, 0, 1),
      stretch: reduced ? 0 : clamp(stretch, 0, 1),
      depthFade: clamp(depthFade, 0, 1),
      captions,
      reduced
    };
  };
  computeSettings();

  const dragSign = layout.inward ? -1 : 1;
  const directionSign = (direction === 'right' ? 1 : -1) * dragSign;

  const state = {
    angle: 0,
    velocity: 0,
    target: null,
    dir: 0,
    press: null,
    drag: false,
    hover: false,
    pointer: { inside: false, x: 0, y: 0 },
    yaw: 0,
    pitch: 0,
    intro: null,
    introDone: false,
    holdUntil: 0,
    held: false, // added: hold(true) brakes autoplay the way pause-on-hover does, for a page that decides when (Gage 10/29)
    stepAt: 0,
    suppressClick: false,
    wheelTimer: 0,
    fit: 1,
    shift: 0,
    drop: 0,
    last: 0
  };
  let active = 0; // activeRef / the active state
  let ready = false; // readyRef / the ready state
  let raf = 0;
  let visible = true;
  let halted = false; // pause()
  let destroyed = false;
  let layoutBox = null; // the root's layout border box, from the ResizeObserver
  let pending = null; // the image preload in flight
  let leavingTimer = 0;
  let sourcesKey = incoming.map(item => item.src).join('|');
  let hovered = -1; // the card the hooks last reported as entered
  let mouse = null; // the mouse's last viewport position

  // ---------- the JSX ----------
  const root = make('div', `circular-carousel ${o.className}`.trim());
  applyStyle(root, o.style);
  if (o.height != null) root.style.height = typeof o.height === 'number' ? `${o.height}px` : String(o.height);
  root.style.setProperty('--cc-fade', fadeColor);
  root.style.setProperty('--cc-radius', `${Math.max(0, cornerRadius)}px`);
  root.style.setProperty('--cc-inner', (1 - clamp(innerShade, 0, 1)).toFixed(3));
  root.setAttribute('role', 'region');
  root.setAttribute('aria-roledescription', 'carousel');
  root.setAttribute('aria-label', o.label);
  root.tabIndex = 0;
  root.setAttribute('data-axis', axis);
  root.setAttribute('data-shape', shape);
  if (draggable) root.setAttribute('data-draggable', '');

  const view = make('div', 'circular-carousel__view');
  const stage = make('div', 'circular-carousel__stage');
  const camera = make('div', 'circular-carousel__camera');
  const ring = make('div', 'circular-carousel__ring');
  camera.appendChild(ring);
  stage.appendChild(camera);
  view.appendChild(stage);
  root.appendChild(view);

  let cards = []; // cardRefs
  let strips = []; // per card: { front: [tile], back: [tile] }

  const makePhoto = (className, src, photoStyle) => {
    const img = make('img', className);
    img.alt = '';
    img.draggable = false;
    img.decoding = 'async';
    place(img, photoStyle);
    img.src = src;
    return img;
  };

  const renderTile = (item, tile, back) => {
    const strip = back ? tile.total - 1 - tile.index : tile.index;
    const first = strip === 0;
    const last = strip === tile.total - 1;
    const r = 'var(--cc-radius)';
    const frameRadius =
      axis === 'x'
        ? `${first ? r : 0} ${first ? r : 0} ${last ? r : 0} ${last ? r : 0}`
        : `${first ? r : 0} ${last ? r : 0} ${last ? r : 0} ${first ? r : 0}`;
    const offset = back ? along - tile.end : tile.start;
    const size = tile.size;
    const box =
      axis === 'x'
        ? { left: -cardW / 2, top: -size / 2, width: cardW, height: size }
        : { left: -size / 2, top: -cardH / 2, width: size, height: cardH };
    const photoStyle =
      axis === 'x'
        ? { left: 0, top: -offset, width: cardW, height: cardH }
        : { left: -offset, top: 0, width: cardW, height: cardH };
    const flip = axis === 'x' ? ' rotateX(180deg)' : ' rotateY(180deg)';

    const el = make('div', 'circular-carousel__tile');
    place(el, box);
    el.style.transform = tile.move + (back ? flip : '');
    el.setAttribute('aria-hidden', 'true');
    const frame = make('div', 'circular-carousel__frame');
    frame.style.height = `${axis === 'x' ? size : cardH}px`;
    frame.style.borderRadius = frameRadius;
    const img = makePhoto('circular-carousel__photo', item.src, photoStyle);
    frame.appendChild(img);
    let inner = null;
    if (back) {
      inner = make('div', 'circular-carousel__inner');
      frame.appendChild(inner);
    }
    const shade = make('div', 'circular-carousel__shade');
    frame.appendChild(shade);
    el.appendChild(frame);
    return { el, frame, img, inner, shade, offset, size, photoStyle, gone: null };
  };

  const cardLabel = (item, index) => `${item.title || item.alt || `Image ${index + 1}`}, ${index + 1} of ${count}`;

  const buildCards = () => {
    ring.textContent = '';
    cards = [];
    strips = [];
    list.forEach((item, index) => {
      const card = make('div', 'circular-carousel__card');
      card.setAttribute('data-cc-index', String(index));
      card.setAttribute('role', 'group');
      card.setAttribute('aria-roledescription', 'slide');
      card.setAttribute('aria-label', cardLabel(item, index));
      const front = tiles.map(tile => renderTile(item, tile, false));
      const back = layout.backfaces ? tiles.map(tile => renderTile(item, tile, true)) : [];
      for (const tile of front) card.appendChild(tile.el);
      for (const tile of back) card.appendChild(tile.el);
      ring.appendChild(card);
      cards.push(card);
      strips.push({ front, back });
    });
  };
  buildCards();

  // caption (Digits) + the live region
  let caption = null;
  let titleEl = null;
  let digitsEl = null;
  let totalEl = null;
  const makeTitle = current => {
    const title = make('span', 'circular-carousel__title');
    const text = current.title || current.alt;
    if (text || text === 0) title.appendChild(document.createTextNode(String(text)));
    if (current.subtitle) {
      const subtitle = make('span', 'circular-carousel__subtitle');
      subtitle.textContent = current.subtitle;
      title.appendChild(subtitle);
    }
    return title;
  };
  const setDigits = value => {
    const chars = String(value).padStart(2, '0').split('');
    while (digitsEl.children.length > chars.length) digitsEl.lastElementChild.remove();
    chars.forEach((digit, index) => {
      const shift = `translateY(${-Number(digit) * 10}%)`;
      const cell = digitsEl.children[index];
      if (cell) {
        cell.firstElementChild.style.transform = shift;
        return;
      }
      const fresh = make('span', 'circular-carousel__digit');
      const reel = make('span', 'circular-carousel__reel');
      for (const n of '0123456789') {
        const figure = make('span');
        figure.textContent = n;
        reel.appendChild(figure);
      }
      reel.style.transform = shift;
      fresh.appendChild(reel);
      digitsEl.appendChild(fresh);
    });
  };
  if (captions) {
    caption = make('div', 'circular-carousel__caption');
    caption.setAttribute('aria-hidden', 'true');
    titleEl = makeTitle(list[active] || list[0]);
    const countEl = make('span', 'circular-carousel__count');
    digitsEl = make('span', 'circular-carousel__digits');
    const slash = make('span', 'circular-carousel__slash');
    slash.textContent = '/';
    totalEl = make('span');
    countEl.append(digitsEl, slash, totalEl);
    caption.append(titleEl, countEl);
    root.appendChild(caption);
  }
  const live = make('div', 'circular-carousel__live');
  live.setAttribute('aria-live', 'polite');
  live.setAttribute('aria-atomic', 'true');
  root.appendChild(live);

  // what React re-renders when active or list changes (the title is keyed by active, so a new active replays its animation)
  const refreshCaption = remount => {
    const current = list[active] || list[0];
    const label = current ? current.title || current.alt || `Image ${active + 1}` : '';
    live.textContent = `${label}, ${active + 1} of ${count}`;
    if (!caption || !current) return;
    const next = makeTitle(current);
    if (remount) {
      caption.replaceChild(next, titleEl);
      titleEl = next;
    } else titleEl.replaceChildren(...next.childNodes);
    setDigits(active + 1);
    totalEl.textContent = String(count).padStart(2, '0');
  };
  refreshCaption(false);

  // ---------- state setters ----------
  const setReady = value => {
    ready = value;
    root.toggleAttribute('data-ready', value);
  };
  const setDragging = value => root.toggleAttribute('data-dragging', value);

  const applyLeaving = () => {
    strips.forEach((card, index) => {
      const gone = leaving ? leaving.items[index] : null;
      for (const tile of card.front.concat(card.back)) {
        if (tile.gone) {
          tile.gone.remove();
          tile.gone = null;
        }
        if (!gone) continue;
        const img = makePhoto('circular-carousel__photo circular-carousel__photo--leaving', gone.src, tile.photoStyle);
        img.style.animationDelay = `${Math.round(leaving.delays[index])}ms`;
        tile.frame.insertBefore(img, tile.inner || tile.shade);
        tile.gone = img;
      }
    });
  };
  const setLeaving = value => {
    leaving = typeof value === 'function' ? value(leaving) : value;
    applyLeaving();
    clearTimeout(leavingTimer);
    if (leaving) leavingTimer = setTimeout(() => setLeaving(null), SWAP_LENGTH + SWAP_SPREAD + 80);
  };

  const setList = next => {
    if (next === list) return;
    const previousCount = list.length;
    list = next;
    if (next.length !== previousCount) {
      setHovered(-1); // its card is about to be replaced
      geometry();
      computeSettings();
      buildCards();
      measure();
      wake();
    } else {
      list.forEach((item, index) => {
        const card = strips[index];
        for (const tile of card.front.concat(card.back)) if (tile.img.getAttribute('src') !== item.src) tile.img.src = item.src;
        cards[index].setAttribute('aria-label', cardLabel(item, index));
      });
    }
    refreshCaption(false);
  };

  // ---------- the main layout effect ----------
  const nearest = angle => Math.round(angle / settings.step) * settings.step;

  const measure = () => {
    const s = settings;
    const rect = layoutBox || { width: root.offsetWidth, height: root.offsetHeight };
    if (!rect.width || !rect.height) return;
    const room = s.captions ? CAPTION_SPACE : 0;
    const width = rect.width * 0.94;
    const height = (rect.height - room) * 0.92;
    const P = s.perspective;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    if (s.layout.inward) {
      minX = -width / 2;
      maxX = width / 2;
      minY = -s.cardH / 2;
      maxY = s.cardH / 2;
    } else {
      const corners = [
        [-s.cardW / 2, -s.cardH / 2],
        [s.cardW / 2, -s.cardH / 2],
        [-s.cardW / 2, s.cardH / 2],
        [s.cardW / 2, s.cardH / 2]
      ];
      const limit = s.layout.window ? s.layout.window * s.step : 180;
      for (let a = -limit; a <= limit; a += limit / 24) {
        for (const [cx, cy] of corners) {
          let p;
          if (s.axis === 'x') {
            p = rotateY(rotateX([cx, cy, s.radius], -a), s.tilt);
          } else if (s.layout.billboard) {
            const c = rotateY([0, 0, s.radius], a);
            p = rotateX([c[0] + cx, cy, c[2]], s.tilt);
          } else {
            p = rotateX(rotateY([cx, cy, s.radius], a), s.tilt);
          }
          p = [p[0], p[1], p[2] - s.radius];
          if (p[2] >= P * 0.95) continue;
          const k = P / (P - p[2]);
          minX = Math.min(minX, p[0] * k);
          maxX = Math.max(maxX, p[0] * k);
          minY = Math.min(minY, p[1] * k);
          maxY = Math.max(maxY, p[1] * k);
        }
      }
    }
    const spanX = Math.max(maxX - minX, 1);
    const spanY = Math.max(maxY - minY, 1);
    const fit = Math.min(1, width / spanX, height / spanY);
    state.fit = fit;
    state.shift = -((minY + maxY) / 2) * fit - room / 2;
    state.drop = s.axis === 'x' ? (rect.width / fit) * 0.55 + s.cardW : (rect.height / fit) * 0.55 + s.cardH;
    stage.style.perspective = `${P}px`;
    stage.style.transform = `translate3d(0, ${state.shift}px, 0) scale(${fit})`;
  };

  const introCard = (elapsed, landing) => {
    if (!state.intro) return { radius: 1, lift: 0 };
    const type = state.intro.type;
    const reach = Math.abs(wrap(landing + state.angle));
    if (type === 'assemble') {
      const delay = (reach / 180) * 420;
      const p = easeOut(clamp((elapsed - delay) / 1080, 0, 1));
      return { radius: 1 + 0.6 * (1 - p), lift: 0 };
    }
    if (type === 'rise') {
      const delay = (reach / 180) * 480;
      const p = easeOutQuint(clamp((elapsed - delay) / 900, 0, 1));
      return { radius: 1, lift: (1 - p) * state.drop };
    }
    if (type === 'spin') {
      const p = easeOut(clamp(elapsed / INTRO_LENGTH.spin, 0, 1));
      return { radius: 1 + 0.28 * (1 - p), lift: 0 };
    }
    return { radius: 1, lift: 0 };
  };

  const advance = (s, dt, now) => {
    if (!state.introDone && ready) {
      if (!state.intro) {
        if (s.intro === 'none') state.introDone = true;
        else state.intro = { type: s.intro, start: now };
      }
      if (state.intro && now - state.intro.start >= INTRO_LENGTH[state.intro.type]) {
        state.intro = null;
        state.introDone = true;
      }
    }

    const paused = (s.pauseOnHover && state.hover) || state.held || state.drag || now < state.holdUntil;
    const cruise = s.autoplay === 'drift' && !paused && !state.intro ? s.speed * state.dir : 0;
    let busy = Boolean(state.intro) || state.drag;

    if (state.drag || state.intro) {
      state.velocity = state.drag ? state.velocity : 0;
    } else if (state.target !== null) {
      let remaining = dt;
      const damping = 2 * Math.sqrt(SPRING);
      while (remaining > 0) {
        const h = Math.min(remaining, 1 / 240);
        const accel = SPRING * (state.target - state.angle) - damping * state.velocity;
        state.velocity += accel * h;
        state.angle += state.velocity * h;
        remaining -= h;
      }
      if (Math.abs(state.target - state.angle) < 0.004 && Math.abs(state.velocity) < 0.03) {
        state.angle = state.target;
        state.velocity = 0;
        state.target = null;
      }
      busy = true;
    } else {
      const tau = 0.18 + s.momentum * 1.5;
      state.velocity += (cruise - state.velocity) * (1 - Math.exp(-dt / tau));
      state.angle += state.velocity * dt;
      if (cruise === 0 && s.snap && Math.abs(state.velocity) < SETTLE_SPEED) {
        state.target = nearest(state.angle);
      }
      busy = busy || cruise !== 0 || Math.abs(state.velocity) > 0.01 || state.target !== null;
    }

    if (s.autoplay === 'step' && !paused && !state.intro && state.introDone) {
      if (!state.stepAt) state.stepAt = now + s.interval * 1000;
      if (now >= state.stepAt) {
        state.target = (state.target ?? nearest(state.angle)) + s.step * state.dir;
        state.stepAt = now + s.interval * 1000;
      }
      busy = true;
    } else {
      state.stepAt = 0;
    }

    if (now < state.holdUntil) busy = true;

    const ease = 1 - Math.exp(-dt / 0.35);
    const aimYaw = state.pointer.inside ? state.pointer.x * s.parallax * 9 : 0;
    const aimPitch = state.pointer.inside ? -state.pointer.y * s.parallax * 6 : 0;
    state.yaw += (aimYaw - state.yaw) * ease;
    state.pitch += (aimPitch - state.pitch) * ease;
    if (Math.abs(aimYaw - state.yaw) > 0.01 || Math.abs(aimPitch - state.pitch) > 0.01) busy = true;

    return busy;
  };

  const render = (s, now) => {
    const elapsed = state.intro ? now - state.intro.start : 0;
    const swell = 1 + s.stretch * 0.12 * Math.min(1, Math.abs(state.velocity) / 420);
    let spinOffset = 0;
    if (state.intro?.type === 'spin') {
      const p = easeOut(clamp(elapsed / INTRO_LENGTH.spin, 0, 1));
      spinOffset = -300 * state.dir * (1 - p);
    } else if (state.intro?.type === 'assemble') {
      const p = easeOut(clamp(elapsed / INTRO_LENGTH.assemble, 0, 1));
      spinOffset = -32 * state.dir * (1 - p);
    }
    const angle = state.angle + spinOffset;
    const R = s.radius * swell;

    if (s.axis === 'x') {
      camera.style.transform = `translate3d(0, 0, ${-R}px) rotateY(${s.tilt + state.yaw}deg) rotateX(${state.pitch}deg)`;
      ring.style.transform = `rotateX(${-angle}deg)`;
    } else if (s.layout.inward) {
      camera.style.transform = `translate3d(0, 0, ${s.perspective - 1}px) rotateX(${s.tilt + state.pitch}deg) rotateY(${state.yaw}deg)`;
      ring.style.transform = `rotateY(${angle}deg)`;
    } else {
      camera.style.transform = `translate3d(0, 0, ${-R}px) rotateX(${s.tilt + state.pitch}deg) rotateY(${state.yaw}deg)`;
      ring.style.transform = `rotateY(${angle}deg)`;
    }

    for (let index = 0; index < s.count; index++) {
      const card = cards[index];
      if (!card) continue;
      const base = index * s.step;
      const mod = introCard(elapsed, base);
      const r = R * mod.radius;
      let transform;
      if (s.axis === 'x') {
        transform = `rotateX(${-base}deg) translateZ(${r}px)`;
      } else if (s.layout.inward) {
        transform = `rotateY(${base}deg) translateZ(${-r}px)`;
      } else {
        transform = `rotateY(${base}deg) translateZ(${r}px)`;
        if (s.layout.billboard) transform += ` rotateY(${-(base + angle)}deg)`;
      }
      if (mod.lift) transform += s.axis === 'x' ? ` translateX(${mod.lift}px)` : ` translateY(${mod.lift}px)`;
      card.style.transform = transform;

      const world = wrap(base + angle);
      const facing = Math.cos(world * TO_RAD);
      if (s.layout.inward) card.style.visibility = Math.abs(world) > 86 ? 'hidden' : '';
      const fade = s.depthFade * Math.pow((1 - facing) / 2, 1.25);
      card.style.setProperty('--cc-depth', fade.toFixed(3));
    }

    const index = ((Math.round(-state.angle / s.step) % s.count) + s.count) % s.count || 0;
    if (index !== active) {
      active = index;
      refreshCaption(true); // setActive(index): React re-renders the caption and live region…
      queueMicrotask(wake); // …and its every-render effect wakes the loop
      o.onChange?.(index);
      o.onActiveChange?.(index);
    }
  };

  const frame = now => {
    raf = 0;
    const s = settings;
    const dt = state.last ? Math.min((now - state.last) / 1000, 0.05) : 1 / 60;
    state.last = now;
    const busy = advance(s, dt, now);
    render(s, now);
    if (busy && visible && !halted && !document.hidden) raf = requestAnimationFrame(frame);
    else state.last = 0;
    settleHover(busy); // added (card hooks)
  };

  const wake = () => {
    if (!raf && visible && !halted && !destroyed && !document.hidden) raf = requestAnimationFrame(frame);
  };

  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
      state.last = 0;
    } else wake();
  };

  const resize = new ResizeObserver(entries => {
    const entry = entries[entries.length - 1];
    const size = entry && entry.borderBoxSize && (entry.borderBoxSize[0] || entry.borderBoxSize);
    layoutBox = size && size.inlineSize !== undefined ? { width: size.inlineSize, height: size.blockSize } : { width: root.offsetWidth, height: root.offsetHeight };
    measure();
    wake();
  });

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) wake();
    else {
      cancelAnimationFrame(raf);
      raf = 0;
      state.last = 0;
    }
  });

  const onWheel = event => {
    const s = settings;
    if (!s.draggable) return;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : 0;
    if (!delta) return;
    event.preventDefault();
    const perPixel = 180 / (Math.PI * s.radius * state.fit);
    state.target = null;
    state.angle -= delta * perPixel * (s.layout.inward ? -1 : 1);
    state.velocity = -delta * perPixel * (s.layout.inward ? -1 : 1) * 30;
    state.holdUntil = performance.now() + 1600;
    clearTimeout(state.wheelTimer);
    state.wheelTimer = setTimeout(() => {
      if (settings.snap) state.target = nearest(state.angle + state.velocity * 0.12);
      wake();
    }, 140);
    wake();
  };

  // ---------- the handlers ----------
  const focusIndex = index => {
    const s = settings;
    let target = -index * s.step;
    target += 360 * Math.round((state.angle - target) / 360);
    state.target = target;
    state.holdUntil = performance.now() + 2800;
    wake();
  };

  const stepBy = delta => {
    const s = settings;
    const base = state.target ?? Math.round(state.angle / s.step) * s.step;
    state.target = base - delta * s.step * (s.layout.inward ? -1 : 1);
    state.holdUntil = performance.now() + 2800;
    wake();
  };

  const updatePointer = event => {
    const rect = root.getBoundingClientRect();
    const pointer = state.pointer;
    pointer.x = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    pointer.y = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
  };

  // added: the card hooks
  const cardAt = node => {
    const card = node && node.closest ? node.closest('[data-cc-index]') : null;
    return card && ring.contains(card) ? Number(card.getAttribute('data-cc-index')) : -1;
  };
  const setHovered = index => {
    if (index === hovered) return;
    const previous = hovered;
    hovered = index;
    if (previous >= 0 && cards[previous]) o.onCardLeave?.(previous, cards[previous]);
    if (index >= 0 && cards[index]) o.onCardEnter?.(index, cards[index]);
  };
  const hoverAt = (x, y) => {
    const scope = root.getRootNode && root.getRootNode().elementFromPoint ? root.getRootNode() : document;
    setHovered(cardAt(scope.elementFromPoint(x, y)));
  };
  // once the ring stops turning (with snap on, the original's loop keeps running at rest, so "stopped" means the angle
  // held still for a frame), the hooks catch up with a mouse that hasn't moved: cards slid under it without an event
  let restAngle = NaN;
  let rested = false;
  const settleHover = busy => {
    const still = !busy || (!state.intro && state.angle === restAngle);
    restAngle = state.angle;
    if (!still) rested = false;
    else if (!rested) {
      rested = true;
      if (mouse && state.pointer.inside && !state.drag && (o.onCardEnter || o.onCardLeave)) hoverAt(mouse.x, mouse.y);
    }
  };
  const handlePointerOver = event => {
    if (!state.drag) setHovered(cardAt(event.target));
  };
  // added: screen px per layout px along the drag axis (1 unless a transformed parent scales the carousel)
  const visualScale = s => {
    const size = layoutBox || { width: root.offsetWidth, height: root.offsetHeight };
    if (!size.width || !size.height) return 1;
    const rect = root.getBoundingClientRect();
    const k = s.axis === 'x' ? rect.height / size.height : rect.width / size.width;
    return Number.isFinite(k) && k > 0 && Math.abs(k - 1) > 0.001 ? k : 1;
  };

  const handlePointerDown = event => {
    state.suppressClick = false;
    if (!draggable || event.button !== 0) return;
    state.press = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      angle: state.angle,
      moved: false,
      origin: 0,
      scale: 1,
      samples: [{ time: performance.now(), angle: state.angle }]
    };
  };

  const handlePointerMove = event => {
    if (event.pointerType === 'mouse') {
      state.pointer.inside = true;
      updatePointer(event);
      mouse = { x: event.clientX, y: event.clientY };
    }
    const press = state.press;
    if (!press || press.id !== event.pointerId) {
      wake();
      return;
    }
    const s = settings;
    const delta = s.axis === 'x' ? event.clientY - press.y : event.clientX - press.x;
    const cross = s.axis === 'x' ? event.clientX - press.x : event.clientY - press.y;
    if (!press.moved) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return;
      if (Math.abs(cross) > Math.abs(delta) * 1.2 && event.pointerType !== 'mouse') {
        state.press = null;
        return;
      }
      press.moved = true;
      press.origin = delta;
      press.scale = visualScale(s);
      state.drag = true;
      state.target = null;
      state.velocity = 0;
      setDragging(true);
      try {
        root.setPointerCapture(event.pointerId);
      } catch {}
    }
    const perPixel = 180 / (Math.PI * s.radius * state.fit * press.scale);
    state.angle = press.angle + (delta - press.origin) * perPixel * (s.layout.inward ? -1 : 1);
    const now = performance.now();
    press.samples.push({ time: now, angle: state.angle });
    while (press.samples.length > 2 && now - press.samples[0].time > 110) press.samples.shift();
    wake();
  };

  const releasePointer = event => {
    const press = state.press;
    if (!press || press.id !== event.pointerId) return;
    state.press = null;
    if (!press.moved) return;
    state.drag = false;
    setDragging(false);
    state.suppressClick = true;
    const s = settings;
    const first = press.samples[0];
    const last = press.samples[press.samples.length - 1];
    const span = (last.time - first.time) / 1000;
    const velocity = span > 0.008 ? clamp((last.angle - first.angle) / span, -1400, 1400) : 0;
    state.velocity = velocity;
    if (Math.abs(velocity) > 60) state.dir = Math.sign(velocity);
    const coasting = s.autoplay === 'drift' && !(s.pauseOnHover && state.hover && event.pointerType === 'mouse');
    if (s.snap && !coasting) {
      const tau = 0.18 + s.momentum * 1.5;
      state.target = Math.round((state.angle + velocity * tau * 0.55) / s.step) * s.step;
    }
    wake();
    // added: the drag is over, so the card hooks catch up with what is under the pointer now (a lifted finger is gone)
    if (event.type === 'pointerup' && event.pointerType !== 'touch') hoverAt(event.clientX, event.clientY);
    else setHovered(-1);
  };

  const handlePointerEnter = event => {
    if (event.pointerType !== 'mouse') return;
    state.hover = true;
    wake();
  };

  const handlePointerLeave = event => {
    if (event.pointerType === 'mouse') {
      state.hover = false;
      state.pointer.inside = false;
    }
    wake();
    if (!state.drag) setHovered(-1);
  };

  const handleClick = event => {
    if (state.suppressClick) {
      state.suppressClick = false;
      return;
    }
    const card = event.target.closest?.('[data-cc-index]');
    if (!card) return;
    const index = Number(card.getAttribute('data-cc-index'));
    if (focusOnClick) focusIndex(index);
    o.onItemClick?.(list[index], index);
  };

  const handleKeyDown = event => {
    const forward = axis === 'x' ? 'ArrowDown' : 'ArrowRight';
    const backward = axis === 'x' ? 'ArrowUp' : 'ArrowLeft';
    if (event.key === forward) stepBy(1);
    else if (event.key === backward) stepBy(-1);
    else if (event.key === 'Home') focusIndex(0);
    else if (event.key === 'End') focusIndex(count - 1);
    else if (event.key === 'Enter' || event.key === ' ') o.onItemClick?.(list[active], active);
    else return;
    event.preventDefault();
  };

  const onReducedMotion = () => {
    reduced = query.matches;
    computeSettings();
    wake();
  };

  // the [sourcesKey] effect: preload (max 16, 2.4 s cap), then a fresh intro, or a crossfade when the count is unchanged
  const syncSources = next => {
    if (pending) pending.cancelled = true;
    const run = { cancelled: false };
    pending = run;
    const smooth = ready && next.length === list.length;
    if (!smooth) {
      setReady(false);
      setLeaving(null);
      setList(next);
    }
    const sources = next.slice(0, 16).map(item => item.src);
    const load = src =>
      new Promise(resolve => {
        const image = new Image();
        image.decoding = 'async';
        image.onload = () => (image.decode ? image.decode().then(resolve, resolve) : resolve());
        image.onerror = resolve;
        image.src = src;
      });
    const timeout = new Promise(resolve => setTimeout(resolve, 2400));
    Promise.race([Promise.all(sources.map(load)), timeout]).then(() => {
      if (run.cancelled) return;
      if (smooth) {
        const previous = list;
        const s = settings;
        if (!s.reduced && previous !== next) {
          setLeaving(current => ({
            id: (current?.id || 0) + 1,
            items: previous,
            delays: previous.map((_, index) => (Math.abs(wrap(index * s.step + state.angle)) / 180) * SWAP_SPREAD)
          }));
        }
        setList(next);
        wake();
        return;
      }
      state.introDone = false;
      state.intro = null;
      setReady(true);
      wake();
    });
  };

  // ---------- mount ----------
  root.addEventListener('pointerdown', handlePointerDown);
  root.addEventListener('pointermove', handlePointerMove);
  root.addEventListener('pointerup', releasePointer);
  root.addEventListener('pointercancel', releasePointer);
  root.addEventListener('pointerenter', handlePointerEnter);
  root.addEventListener('pointerleave', handlePointerLeave);
  root.addEventListener('pointerover', handlePointerOver);
  root.addEventListener('click', handleClick);
  root.addEventListener('keydown', handleKeyDown);
  host.appendChild(root);

  resize.observe(root);
  io.observe(root);
  root.addEventListener('wheel', onWheel, { passive: false });
  document.addEventListener('visibilitychange', onVisibility);
  measure();
  render(settings, performance.now());
  wake();
  measure(); // the [radius, cardW, cardH, …] layout effect
  wake();
  query?.addEventListener?.('change', onReducedMotion);
  state.dir = directionSign; // the [directionSign] effect
  wake();
  syncSources(incoming);

  return {
    get active() {
      return active;
    },
    get cards() {
      return cards.slice();
    },
    // the card's FRONT strips in strip order; offset = where along the card the strip starts (px), size = its length (px)
    tiles(index) {
      const card = strips[index];
      return card ? card.front.map(tile => ({ el: tile.el, frame: tile.frame, img: tile.img, offset: tile.offset, size: tile.size })) : [];
    },
    get cardSize() {
      return { width: cardW, height: cardH };
    },
    // swaps the photo on every strip of the card (front and back) in one go; each strip keeps its slice of the card
    setImage(index, src) {
      const card = strips[index];
      if (!card) return Promise.resolve();
      list = list.slice();
      list[index] = { ...list[index], src };
      for (const tile of card.front.concat(card.back)) tile.img.src = src;
      const img = card.front[0] && card.front[0].img;
      return img && img.decode ? img.decode().catch(() => {}) : Promise.resolve();
    },
    // the original's items-prop change: same srcs = nothing; same count = crossfade; new count = fresh intro
    setItems(items) {
      const next = items && items.length ? items : DEFAULT_ITEMS;
      const key = next.map(item => item.src).join('|');
      if (key === sourcesKey) return;
      sourcesKey = key;
      syncSources(next);
    },
    // freezes the loop the way going off screen does; resume() picks up from there
    pause() {
      if (halted) return;
      halted = true;
      cancelAnimationFrame(raf);
      raf = 0;
      state.last = 0;
    },
    resume() {
      if (!halted || destroyed) return;
      halted = false;
      wake();
    },
    // added: brakes autoplay exactly like pause-on-hover (drift eases out and snaps to the nearest card) until hold(false);
    // for a page that only wants certain cards to stop the ring (Gage 10/29: only the one front and center)
    hold(on) {
      state.held = Boolean(on);
      wake();
    },
    // what a focus click does: spring to that card and hold for 2.8 s before autoplay resumes
    goTo(index) {
      const n = list.length;
      const i = ((Math.round(Number(index)) % n) + n) % n;
      if (Number.isNaN(i)) return;
      focusIndex(i);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (pending) pending.cancelled = true;
      cancelAnimationFrame(raf);
      raf = 0;
      resize.disconnect();
      io.disconnect();
      clearTimeout(state.wheelTimer);
      clearTimeout(leavingTimer);
      root.removeEventListener('wheel', onWheel);
      document.removeEventListener('visibilitychange', onVisibility);
      query?.removeEventListener?.('change', onReducedMotion);
      root.remove();
    }
  };
}

export default createCircularCarousel;
