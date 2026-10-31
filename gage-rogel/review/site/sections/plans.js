// Gage Rogel Fitness · section 8, the plans (Hayden 10/29):
//   "I do like the spots open with that animation on it. And then make each of these like not a debit card, but like the
//    size of one, and make it vertical. And then make the silver one silver, make the gold one gold, make the platinum one
//    platinum. Give it the three D pop… the three D card effect… make sure they like glimmers… You want to buy this kind
//    of card… their own nifty design cards… the 3D pop."
// Round 2 (Hayden 10/29, at the tunnel stop): "you're kind of just like 3D-ing the information, not the actual card itself…
//    I wanted it to like come towards the screen when I click on it… Platinum, I want to be like a light blue… for each one
//    that you click, the spots open will change… make it a little more metally… the base texture is not [shiny]."
// What it is:
//  - SPOTS OPEN n on the Aceternity Text Flipping Board's flaps (js/vendor/text-flipping-board.js, timing untouched), the
//    dream site's plans-row board. Each tier has its own count; the board flips to the popped card's count, and shows Gold's
//    (his recommended plan) when no card is out. The counts are PLACEHOLDERS until Gage gives real ones: the number cells
//    carry data-placeholder="spots-count".
// Round 3 (Hayden 10/30): "all three should start off the same size, and then whichever one my mouse clicks on should come
//    forward, be bigger, and like the 3D shouldn't just be for the… information inside of the card, but it should be on
//    the card itself."
//  - Silver, Gold and Platinum as vertical cards at bank-card proportions (54 x 85.6 mm), all the same size at rest.
//    Each card is ONE solid object that tilts toward the pointer with the React Bits Holo Card's own tilt, the same code
//    and numbers as js/vendor/holo-card.js (springs 150/16 for the tilt, 220/30 the light, 320/30 the lift, stepped at
//    240 Hz; up to 14deg each way; perspective 1100px; a 1.04 lift on hover; its shadow sliding opposite the tilt), then
//    settles flat when the pointer leaves. The metal, the foil, the highlight band and the printed face (words, his logo,
//    Apply) all tilt together; nothing floats off it. The face's foil is the Holo Card in external mode, aimed at the
//    same targets so it moves with the card, and drifting while nobody's on it so the cards keep glimmering at rest.
//  - Click (or tap, or Enter/Space on a focused card) and that card comes toward you: 1.18x, a deeper shadow, above its
//    neighbours, 0.45 s; again and it goes back; another card sends the first back. A popped card still tilts (without
//    the hover lift, so it stays in the box). Apply never pops a card. Nothing is popped on load.
// Round 4 (Hayden 10/30): "As far as you pulled it out, pull it out twice as much, and then give it a little more of the 3D
//    effect for the words. Nothing crazy." The pop is 1.36x from 35% down the card (it grows mostly downward, so the board
//    stays readable) with a deeper, lower shadow, above everything in the section; it may spill past the section box but
//    stays on screen at the tunnel stop. The card still tilts as one object, and the printed layers now sit a little above
//    the face (plans.css translateZ, no twists): title and price, then the logo, then the calls and the lines, then Apply,
//    so they parallax as it tilts.
//  - The metals: brushed steel, polished gold, icy-blue platinum. Each is painted at the card's real pixel size: reflection
//    bands, anisotropic grain, broad soft specular bands, a bright bevel lit from the top left, his tier emblem engraved.
//  - REAL data only: assets/his-demo-copy.json, "protocols" (his demo, 10/26): tiers, prices, the 90-day minimum, calls a
//    month, inclusions, Gold = Recommended. The faces shorten his inclusion lines to fit; the full lines are in PLANS.
// API:
//   const plans = mountPlans(host, { spots: { Silver: 3, Gold: 2, Platinum: 1 }, spotsPlaceholder: true,
//                                    onApply(plan, button) {}, dprCap: 2, autoplay: true })
//   plans.play()                          the heading's line reveal + the board flips in (call at the section's stop)
//   plans.pop('Silver' | null)            bring a card forward (null settles it); plans.popped = its name or null
//   plans.setSpots({ Silver, Gold, Platinum }, real = false)   any subset; a single number sets all three;
//                                         real = true drops the placeholder marks once they're Gage's counts
//   plans.spots                           the current counts
//   plans.pause() / plans.resume()        stop / restart the cards' loops (the foil and the tilt) when the section hides / shows
//   plans.destroy()
//   Apply: <button data-action="apply" data-plan="Silver|Gold|Platinum"> on each card (wire them, or pass onApply)
// The section is 150u x 72u (--u comes from the page). Nothing here measures with getBoundingClientRect: it sits inside the
// tunnel's CSS-3D-scaled layer, so sizes come from layout boxes and the pointer from offsetX/offsetY.

import { createHoloCard } from '../../../js/vendor/holo-card.js?v=20261030b';
import { FlapCell, BASE_COL_DELAY, BASE_STEP_MS, BASE_FLIP_S } from '../../../js/vendor/text-flipping-board.js?v=20261030b';

const VERSION = '20261030b';
const CSS_URL = new URL('./plans.css', import.meta.url).href.split('?')[0];
const LOGO_URL = new URL('../../../images/logo.png', import.meta.url).href;
const REDUCE = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

const RATIO = 54 / 85.6; // a bank card, stood on its end
const CORNER = 3.18 / 54; // its corner radius, as a share of its width
const FRAME = 3; // the Holo Card's sparkling rim, % of the width; the painted bevel matches it
const TILT = { max: 14, perspective: 1100, hoverScale: 1.04 }; // the Holo Card's own tiltMax, PERSPECTIVE and hoverScale
const REST_LIGHT = { mx: 0.32, my: 0.2 }; // where the metal's highlight band rests (reduced motion)
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const SPOTS_WORDS = 'SPOTS OPEN';
const DEFAULT_TIER = 'Gold'; // no card out: the board shows his recommended plan's count
const SPOTS_DEFAULT = { Silver: 3, Gold: 2, Platinum: 1 }; // PLACEHOLDERS until Gage gives his real counts

// ── his plans (assets/his-demo-copy.json → protocols) ──
const PLANS = [
  {
    name: 'Silver',
    tier: 'Tier 1',
    price: 399,
    calls: 2,
    recommended: false,
    face: ['Custom workout + nutrition plan', 'Supplement discount codes', 'Direct access to your coach'],
    full: [
      '2 hour-long check-in calls a month',
      'Custom workout plan built from your information',
      'Custom nutrition plan built from your information',
      'Coach-recommended supplements with client-only discount codes',
      'Direct access to your coach for questions and concerns'
    ]
  },
  {
    name: 'Gold',
    tier: 'Tier 2',
    price: 499,
    calls: 4,
    recommended: true,
    face: ['Weekly program adjustments', 'In-depth education on the why', 'Everything in Silver'],
    full: [
      '4 hour-long check-in calls a month',
      'Custom workout plan built from your information',
      'Custom nutrition plan built from your information',
      'Coach-recommended supplements with client-only discount codes',
      'Direct access to your coach for questions and concerns',
      'In-depth education on why your training and nutrition are set up the way they are',
      'Weekly program adjustments based on your needs'
    ]
  },
  {
    name: 'Platinum',
    tier: 'Tier 3',
    price: 799,
    calls: 8,
    recommended: false,
    face: ['Weekly program adjustments', 'In-depth education on the why', 'Everything in Silver'],
    full: [
      '8 hour-long check-in calls a month',
      'Custom workout plan built from your information',
      'Custom nutrition plan built from your information',
      'Coach-recommended supplements with client-only discount codes',
      'Direct access to your coach for questions and concerns',
      'In-depth education on why your training and nutrition are set up the way they are',
      'Weekly program adjustments based on your needs'
    ]
  }
];
const TERM = '90-day minimum';
const TIERS = PLANS.map(p => p.name);

// ── the three metals ──
// axis: the reflection gradient's direction (fractions of the card); stops: the reflections along it; grain: how brushed;
// bands / shades: broad soft specular and shadow bands [centre, half-width, alpha] across `slant`; ink / lite: the
// engraving (dark cut + its lit lower lip); spec: the highlight's tint. holo = the Holo Card's foil, unchanged.
const METALS = {
  Silver: {
    // brushed steel: grain runs sideways, so the light lands in tall soft bands that move across it
    seed: 11,
    axis: [0, 0, 1, 0.28],
    stops: [[0, '#d5dae0'], [0.11, '#a9b0b9'], [0.23, '#eef1f4'], [0.36, '#9aa2ac'], [0.49, '#d3d8de'], [0.61, '#f4f6f8'], [0.74, '#a3aab4'], [0.87, '#dfe3e7'], [1, '#959da8']],
    grain: 1.5,
    slant: 0.28,
    bands: [[0.22, 0.09, 0.34], [0.6, 0.12, 0.28], [0.86, 0.05, 0.2]],
    shades: [[0.38, 0.08, 0.14], [0.76, 0.07, 0.12]],
    pattern: 'honeycomb',
    ink: [22, 27, 34],
    lite: [255, 255, 255],
    spec: '255,255,255',
    holo: { preset: 'rainbow', foilColor: '#e2e6ec', intensity: 0.8, scale: 1, edgeSparkle: 0.8, glare: 0.5 }
  },
  Gold: {
    // polished gold: almost no grain, deep warm reflections corner to corner
    seed: 23,
    axis: [0, 0, 0.85, 1],
    stops: [[0, '#f3d27c'], [0.12, '#c89633'], [0.25, '#fff0bd'], [0.38, '#d4a240'], [0.5, '#efc964'], [0.62, '#fff5cf'], [0.75, '#bf8b2b'], [0.88, '#e8c35f'], [1, '#b5832a']],
    grain: 0.35,
    slant: 1,
    bands: [[0.25, 0.07, 0.42], [0.63, 0.1, 0.32]],
    shades: [[0.42, 0.06, 0.16], [0.8, 0.07, 0.14]],
    pattern: 'sunburst',
    ink: [42, 25, 3],
    lite: [255, 245, 214],
    spec: '255,246,220',
    holo: { preset: 'gold', foilColor: '#e2e6ec', intensity: 0.9, scale: 1, edgeSparkle: 0.9, glare: 0.55 }
  },
  Platinum: {
    // icy light blue (Hayden 10/29), polished, a finer brush
    seed: 37,
    axis: [0, 0, 0.85, 1],
    stops: [[0, '#a8d4ff'], [0.12, '#4a9eff'], [0.25, '#c9e5ff'], [0.38, '#3d93ff'], [0.5, '#92c8ff'], [0.62, '#d6ecff'], [0.75, '#2f87f5'], [0.88, '#9fceff'], [1, '#2a7ee8']],   // Rocket League blue (Hayden 10/30: "a little bit more blue"); navy ink stays >= 4:1 on the darkest band
    grain: 0.7,
    slant: 1,
    bands: [[0.24, 0.08, 0.38], [0.62, 0.1, 0.3]],
    shades: [[0.4, 0.07, 0.12], [0.79, 0.07, 0.1]],
    pattern: 'guilloche',
    ink: [11, 34, 54],
    lite: [255, 255, 255],
    spec: '238,250,255',
    holo: { preset: 'shards', foilColor: '#cfe6ff', intensity: 0.85, scale: 1, edgeSparkle: 1, glare: 0.6 }
  }
};

// ── small helpers ──
const make = (tag, className, text) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text != null) el.textContent = text;
  return el;
};
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const rng = seed => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const layer = (W, H) => {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  return c;
};
function roundRect(x, l, t, w, h, r) {
  if (x.roundRect) return x.roundRect(l, t, w, h, r);
  x.moveTo(l + r, t);
  x.arcTo(l + w, t, l + w, t + h, r);
  x.arcTo(l + w, t + h, l, t + h, r);
  x.arcTo(l, t + h, l, t, r);
  x.arcTo(l, t, l + w, t, r);
  x.closePath();
}

// ── the card art (the Holo Card's image) ──
function grain(x, W, H, rnd, k) {
  // brushed: a narrow strip of noise stretched sideways into long streaks, then long hairlines that catch the light
  const nw = Math.max(12, Math.round(W / 40));
  const n = layer(nw, H);
  const nx = n.getContext('2d');
  const id = nx.createImageData(nw, H);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = 128 + (rnd() - 0.5) * 250;
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = 255;
  }
  nx.putImageData(id, 0, 0);
  x.save();
  x.globalCompositeOperation = 'overlay';
  x.globalAlpha = Math.min(0.46, 0.32 * k);
  x.imageSmoothingEnabled = true;
  x.imageSmoothingQuality = 'high';
  x.drawImage(n, 0, 0, W, H);
  x.restore();
  x.save();
  const hair = Math.max(1, W / 640);
  for (let i = 0, count = Math.round(H * 0.9 * k); i < count; i++) {
    const y = rnd() * H;
    const len = W * (0.3 + rnd() * 0.9);
    const x0 = -W * 0.15 + rnd() * W;
    const a = (0.03 + rnd() * 0.08) * Math.min(1.4, k);
    const col = rnd() < 0.6 ? '255,255,255' : '0,0,0';
    const g = x.createLinearGradient(x0, 0, x0 + len, 0);
    g.addColorStop(0, `rgba(${col},0)`);
    g.addColorStop(0.5, `rgba(${col},${a})`);
    g.addColorStop(1, `rgba(${col},0)`);
    x.fillStyle = g;
    x.fillRect(x0, y, len, hair);
  }
  x.restore();
}

function engraveStroke(l, M, hair, alpha) {
  // an engraved line: the lit lower lip first, then the dark cut
  l.save();
  l.translate(0, hair);
  l.strokeStyle = rgba(M.lite, alpha * 2.2);
  l.stroke();
  l.restore();
  l.strokeStyle = rgba(M.ink, alpha);
  l.stroke();
}

function fadeFromCorner(l, W, H, cx, cy, r, inner = 0.9) {
  const m = l.createRadialGradient(cx, cy, 0, cx, cy, r);
  m.addColorStop(0, `rgba(0,0,0,${inner})`);
  m.addColorStop(0.5, `rgba(0,0,0,${inner * 0.45})`);
  m.addColorStop(1, 'rgba(0,0,0,0)');
  l.globalCompositeOperation = 'destination-in';
  l.fillStyle = m;
  l.fillRect(0, 0, W, H);
  l.globalCompositeOperation = 'source-over';
}

const PATTERNS = {
  // Silver: his hex, as an engraved honeycomb in the top corner
  honeycomb(x, W, H, s, M, hair) {
    const c = layer(W, H);
    const l = c.getContext('2d');
    const r = 3.4 * s;
    const dx = Math.sqrt(3) * r;
    const dy = 1.5 * r;
    l.beginPath();
    for (let row = 0, y = -r; y < H * 0.55; row++, y += dy) {
      for (let cx = -dx + (row % 2 ? dx / 2 : 0); cx < W + dx; cx += dx) {
        for (let k = 0; k < 6; k++) {
          const a = -Math.PI / 2 + (k * Math.PI) / 3;
          const px = cx + r * Math.cos(a);
          const py = y + r * Math.sin(a);
          k ? l.lineTo(px, py) : l.moveTo(px, py);
        }
        l.closePath();
      }
    }
    l.lineWidth = hair;
    l.lineJoin = 'round';
    engraveStroke(l, M, hair, 0.2);
    fadeFromCorner(l, W, H, W * 1.02, -H * 0.02, H * 0.56);
    x.drawImage(c, 0, 0);
  },
  // Gold: an art-deco sunburst out of the top corner
  sunburst(x, W, H, s, M, hair) {
    const c = layer(W, H);
    const l = c.getContext('2d');
    const ox = W * 1.04;
    const oy = -H * 0.03;
    const R = Math.hypot(W, H) * 1.1;
    const n = 84;
    for (let i = 0; i < n; i++) {
      const a0 = ((78 + (116 * i) / n) * Math.PI) / 180;
      const a1 = ((78 + (116 * (i + 1)) / n) * Math.PI) / 180;
      l.beginPath();
      l.moveTo(ox, oy);
      l.lineTo(ox + R * Math.cos(a0), oy + R * Math.sin(a0));
      l.lineTo(ox + R * Math.cos(a1), oy + R * Math.sin(a1));
      l.closePath();
      l.fillStyle = i % 2 ? rgba(M.lite, 0.2) : rgba(M.ink, 0.075);
      l.fill();
    }
    fadeFromCorner(l, W, H, ox, oy, H * 0.62, 1);
    x.drawImage(c, 0, 0);
  },
  // Platinum: a guilloche rosette, the engraving on banknotes and the best watches, around the corner emblem
  guilloche(x, W, H, s, M, hair) {
    const c = layer(W, H);
    const l = c.getContext('2d');
    const cx = W * 0.83;
    const cy = 14.6 * s;
    l.lineWidth = hair * 0.85;
    const rings = [
      { R0: 15 * s, A: 3.6 * s, n: 9, lines: 20 },
      { R0: 27 * s, A: 5.2 * s, n: 12, lines: 26 },
      { R0: 40 * s, A: 6.4 * s, n: 15, lines: 30 }
    ];
    for (const g of rings) {
      for (let j = 0; j < g.lines; j++) {
        const ph = (j / g.lines) * Math.PI * 2;
        l.beginPath();
        for (let k = 0; k <= 900; k++) {
          const t = (k / 900) * Math.PI * 2;
          const r = g.R0 + g.A * Math.sin(g.n * t + ph) + g.A * 0.3 * Math.sin((2 * g.n + 1) * t - ph * 0.5);
          const px = cx + r * Math.cos(t);
          const py = cy + r * Math.sin(t);
          k ? l.lineTo(px, py) : l.moveTo(px, py);
        }
        l.strokeStyle = rgba(M.ink, 0.11);
        l.stroke();
      }
    }
    fadeFromCorner(l, W, H, cx, cy, 52 * s, 1);
    x.drawImage(c, 0, 0);
  }
};

function specular(x, W, H, M) {
  // broad soft specular bands (screen) and the darker reflections between them (multiply), across the card's slant
  const band = (list, op, color) => {
    x.save();
    x.globalCompositeOperation = op;
    for (const [c, w, a] of list) {
      const g = x.createLinearGradient(0, 0, W, H * M.slant);
      g.addColorStop(Math.max(0, c - w), `rgba(${color},0)`);
      g.addColorStop(c, `rgba(${color},${a})`);
      g.addColorStop(Math.min(1, c + w), `rgba(${color},0)`);
      x.fillStyle = g;
      x.fillRect(0, 0, W, H);
    }
    x.restore();
  };
  band(M.bands, 'screen', M.spec);
  band(M.shades, 'multiply', '0,0,0');
  // a brighter top left, and the face curving away a touch at the edges
  x.save();
  x.globalCompositeOperation = 'screen';
  const r = x.createRadialGradient(W * 0.16, H * 0.06, 0, W * 0.16, H * 0.06, H * 0.62);
  r.addColorStop(0, `rgba(${M.spec},0.3)`);
  r.addColorStop(1, `rgba(${M.spec},0)`);
  x.fillStyle = r;
  x.fillRect(0, 0, W, H);
  x.restore();
  x.save();
  x.globalCompositeOperation = 'multiply';
  const v = x.createRadialGradient(W * 0.46, H * 0.42, H * 0.24, W * 0.5, H * 0.5, H * 0.78);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.22)');
  x.fillStyle = v;
  x.fillRect(0, 0, W, H);
  x.restore();
}

function bevel(x, W, H, M, hair) {
  // the chamfer between the card's edge and FRAME% in (where the Holo Card sparkles), lit from the top left:
  // bright top and left faces, darker bottom and right, a bright hairline on the very edge, a crisp step to the face
  const f = (FRAME / 100) * W;
  const r = CORNER * W;
  x.save();
  x.beginPath();
  roundRect(x, 0, 0, W, H, r);
  roundRect(x, f, f, W - 2 * f, H - 2 * f, Math.max(0, r - f));
  x.clip('evenodd');
  x.fillStyle = rgba(M.lite, 0.82);
  x.fillRect(0, 0, W, f);
  x.fillStyle = rgba(M.lite, 0.5);
  x.fillRect(0, 0, f, H);
  x.fillStyle = rgba(M.ink, 0.28);
  x.fillRect(0, H - f, W, f);
  x.fillStyle = rgba(M.ink, 0.2);
  x.fillRect(W - f, 0, f, H);
  x.restore();
  x.save();
  x.lineWidth = hair;
  x.beginPath();
  roundRect(x, hair / 2, hair / 2, W - hair, H - hair, r);
  x.strokeStyle = rgba(M.lite, 0.75);
  x.stroke();
  x.beginPath();
  roundRect(x, f, f, W - 2 * f, H - 2 * f, Math.max(0, r - f));
  x.strokeStyle = rgba(M.ink, 0.38);
  x.stroke();
  x.beginPath();
  roundRect(x, f + hair, f + hair, W - 2 * (f + hair), H - 2 * (f + hair), Math.max(0, r - f - hair));
  x.strokeStyle = rgba(M.lite, 0.7);
  x.stroke();
  x.restore();
}

function emblem(x, count, right, cy, h, M, hair) {
  // his tier emblem, from his own demo: one, two or three hexes with a ring (viewBox 76 x 32), engraved
  const k = h / 32;
  const centers = count === 1 ? [38] : count === 2 ? [26.7, 49.3] : [15.5, 38, 60.5];
  const ox = right - (centers[centers.length - 1] + 11.3) * k;
  const oy = cy - 16 * k;
  const draw = (dy, hexFill, stroke, ring) => {
    for (const c of centers) {
      x.beginPath();
      [[c, 3], [c + 11.3, 9.5], [c + 11.3, 22.5], [c, 29], [c - 11.3, 22.5], [c - 11.3, 9.5]].forEach(([px, py], i) =>
        i ? x.lineTo(ox + px * k, oy + py * k + dy) : x.moveTo(ox + px * k, oy + py * k + dy)
      );
      x.closePath();
      if (hexFill) {
        x.fillStyle = hexFill;
        x.fill();
      }
      x.lineWidth = 1.6 * k;
      x.lineJoin = 'round';
      x.strokeStyle = stroke;
      x.stroke();
      x.beginPath();
      x.arc(ox + c * k, oy + 16 * k + dy, 6.5 * k, 0, Math.PI * 2);
      x.lineWidth = 1.4 * k;
      x.strokeStyle = ring;
      x.stroke();
    }
  };
  draw(hair * 1.4, null, rgba(M.lite, 0.75), rgba(M.lite, 0.65));
  draw(0, rgba(M.ink, 0.12), rgba(M.ink, 0.85), rgba(M.ink, 0.72));
}

function paintArt(plan, W, H) {
  const M = METALS[plan.name];
  const c = layer(W, H);
  const x = c.getContext('2d');
  const s = W / 100; // 1 s = 1% of the card's width
  const hair = Math.max(1, W / 520);
  const rnd = rng(M.seed);
  const [ax0, ay0, ax1, ay1] = M.axis;
  const g = x.createLinearGradient(ax0 * W, ay0 * H, ax1 * W, ay1 * H);
  for (const [o, col] of M.stops) g.addColorStop(o, col);
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  grain(x, W, H, rnd, M.grain);
  PATTERNS[M.pattern](x, W, H, s, M, hair);
  specular(x, W, H, M);
  bevel(x, W, H, M, hair);
  // the emblem sits in the top-right corner, level with his logo (card padding 2.9 of 34.7 card units, logo 4.4 tall)
  emblem(x, plan.calls === 2 ? 1 : plan.calls === 4 ? 2 : 3, W - (2.9 / 34.7) * W, ((2.9 + 2.2) / 34.7) * W, 9.2 * s, M, hair);
  return c;
}

const toURL = canvas =>
  new Promise(resolve => {
    if (!canvas.toBlob) return resolve(canvas.toDataURL('image/png'));
    canvas.toBlob(b => resolve(b ? URL.createObjectURL(b) : canvas.toDataURL('image/png')), 'image/png');
  });

// ── the stylesheet: plans.css (which @imports the three effect stylesheets), added once if the page hasn't linked it ──
function ensureCss() {
  const have = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find(l => l.href.split('?')[0] === CSS_URL);
  const link = have || Object.assign(document.createElement('link'), { rel: 'stylesheet', href: `${CSS_URL}?v=${VERSION}` });
  if (!have) document.head.appendChild(link);
  if (link.sheet) return Promise.resolve();
  return new Promise(resolve => {
    link.addEventListener('load', resolve, { once: true });
    link.addEventListener('error', resolve, { once: true });
    setTimeout(resolve, 4000);
  });
}

// spot counts: an object with any of the tiers, or one value for all three
const readSpots = (value, base) => {
  const out = { ...base };
  if (value == null) return out;
  if (typeof value === 'object') {
    for (const t of TIERS) if (value[t] != null) out[t] = String(value[t]);
  } else for (const t of TIERS) out[t] = String(value);
  return out;
};

// ── the whole-card tilt: the Holo Card's own motion (holo-card.js tick: same springs, steps, targets, drift, calm-out),
// moving a layer that carries the whole card instead of the Holo Card's rotor. c = { card, tilt, shadow, band, popped } ──
const springStep = (value, velocity, target, stiffness, damping, dt) => {
  const next = velocity + ((target - value) * stiffness - velocity * damping) * dt;
  return [value + next * dt, next];
};

function createTilt(c) {
  const state = {
    tiltX: 0,
    tiltY: 0,
    tiltVX: 0,
    tiltVY: 0,
    lightX: REST_LIGHT.mx,
    lightY: REST_LIGHT.my,
    lightVX: 0,
    lightVY: 0,
    lift: 1,
    liftV: 0,
    clock: Math.random() * 40
  };
  let pointer = { x: 0.5, y: 0.5, inside: false };
  let raf = 0;
  let last = 0;
  let calm = 0;
  let held = false;
  let alive = true;

  // write a transform only when it changes, with tiny values snapped to 0: a card at rest stops being an "animating"
  // layer, so the browser re-rasterises its floating words crisp
  const fixed = (v, d) => (Math.abs(v) < 0.5 * 10 ** -d ? 0 : v).toFixed(d);
  let lastTilt = '';
  let lastShadow = '';
  const paint = () => {
    const tilt = `perspective(${TILT.perspective}px) scale(${fixed(state.lift, 4)}) rotateX(${fixed(state.tiltX, 3)}deg) rotateY(${fixed(state.tiltY, 3)}deg)`;
    if (tilt !== lastTilt) {
      c.tilt.style.transform = tilt;
      lastTilt = tilt;
    }
    const shadow = `translate(${fixed(-state.tiltY * 0.7, 2)}px, ${fixed(state.tiltX * 0.7, 2)}px) scale(${fixed(0.9 + (state.lift - 1) * 1.5, 4)})`;
    if (shadow !== lastShadow) {
      c.shadow.style.transform = shadow;
      lastShadow = shadow;
    }
    c.band.style.transform = `translateX(${(((state.lightX - 1.26) / 2.6) * 100).toFixed(3)}%)`; // band centre follows the light
  };

  const tick = now => {
    raf = 0;
    if (!alive || held) return;
    const dt = Math.min(1 / 30, Math.max(1 / 240, (now - last) / 1000));
    last = now;
    let targetX = 0;
    let targetY = 0;
    let lightX = REST_LIGHT.mx;
    let lightY = REST_LIGHT.my;
    let lift = 1;
    const drifting = !REDUCE && !pointer.inside; // at rest the card sits flat; only the light drifts over the metal
    if (pointer.inside && !REDUCE) {
      targetX = (0.5 - pointer.y) * 2 * TILT.max;
      targetY = (pointer.x - 0.5) * 2 * TILT.max;
      lightX = pointer.x;
      lightY = pointer.y;
      lift = c.popped ? 1 : TILT.hoverScale; // a popped card is already forward: no extra lift, so it stays in the box
    } else if (drifting) {
      state.clock += dt;
      const t = state.clock;
      lightX = 0.5 + Math.sin(t * 0.41) * 0.42;
      lightY = 0.38 + Math.sin(t * 0.33 + 0.6) * 0.3;
    }
    const steps = Math.ceil(dt / (1 / 240));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      [state.tiltX, state.tiltVX] = springStep(state.tiltX, state.tiltVX, targetX, 150, 16, h);
      [state.tiltY, state.tiltVY] = springStep(state.tiltY, state.tiltVY, targetY, 150, 16, h);
      [state.lightX, state.lightVX] = springStep(state.lightX, state.lightVX, lightX, 220, 30, h);
      [state.lightY, state.lightVY] = springStep(state.lightY, state.lightVY, lightY, 220, 30, h);
      [state.lift, state.liftV] = springStep(state.lift, state.liftV, lift, 320, 30, h);
    }
    paint();
    const motion =
      Math.abs(state.tiltVX) +
      Math.abs(state.tiltVY) +
      Math.abs(state.liftV) * 40 +
      (Math.abs(state.lightVX) + Math.abs(state.lightVY)) * 60 +
      Math.abs(state.tiltX - targetX) +
      Math.abs(state.tiltY - targetY);
    calm = motion > 0.02 ? 0 : calm + dt;
    if (!drifting && !pointer.inside && calm > 0.3) return;
    raf = requestAnimationFrame(tick);
  };

  const wake = () => {
    if (raf || !alive || held) return;
    calm = 0;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };

  paint();
  wake();
  return {
    /** The pointer at (x, y), 0-1 across the card. */
    aim(x, y) {
      pointer = { x, y, inside: true };
      wake();
    },
    leave() {
      pointer = { ...pointer, inside: false };
      wake();
    },
    wake,
    pause() {
      held = true;
      cancelAnimationFrame(raf);
      raf = 0;
    },
    resume() {
      if (!held) return;
      held = false;
      wake();
    },
    destroy() {
      alive = false;
      cancelAnimationFrame(raf);
    }
  };
}

export function mountPlans(host, opts = {}) {
  const o = { spots: SPOTS_DEFAULT, spotsPlaceholder: true, onApply: null, dprCap: 2, autoplay: true, ...opts };
  const cssReady = ensureCss();

  const root = make('div', 'pl-sec');
  root.setAttribute('data-section', 'plans');
  const heading = make('h3', 'pl-h', 'Pick your coaching plan');
  const spots = make('div', 'pl-spots tfb tfb--dark');
  spots.setAttribute('role', 'img');
  const flaps = make('div', 'pl-flaps');
  flaps.setAttribute('aria-hidden', 'true');
  spots.appendChild(flaps);
  const row = make('ul', 'pl-row');
  root.append(heading, spots, row);
  host.appendChild(root);

  let popped = null; // the name of the card that's out, or null (nothing on load)

  // ── the cards: one solid card each (shadow + a tilt layer carrying the foil, the highlight and the printed face) ──
  const cards = PLANS.map(plan => {
    const M = METALS[plan.name];
    const li = make('li', `pl-plan pl-${plan.name.toLowerCase()}`);
    li.dataset.plan = plan.name;
    li.dataset.popped = 'false';
    const card = make('div', 'pl-card');
    card.tabIndex = 0;
    card.setAttribute('role', 'group');
    card.setAttribute('aria-label', `${plan.name} plan, $${plan.price} a month`);
    const shadow = make('span', 'pl-shadow');
    shadow.setAttribute('aria-hidden', 'true');
    const tilt = make('div', 'pl-tilt');
    const sheen = make('div', 'pl-sheen');
    sheen.setAttribute('aria-hidden', 'true');
    const band = make('i', 'pl-band');
    sheen.appendChild(band);
    const print = make('div', 'pl-print');

    // the printed face, flat on the metal
    const logo = make('div', 'pl-logo');
    const img = make('img');
    img.src = LOGO_URL;
    img.alt = '';
    img.draggable = false;
    img.decoding = 'async';
    logo.setAttribute('aria-hidden', 'true');
    logo.appendChild(img);

    const title = make('div', 'pl-title pl-face');
    title.append(make('h4', 'pl-name', plan.name), make('p', 'pl-tier', plan.recommended ? `${plan.tier} · Recommended` : plan.tier));

    const price = make('div', 'pl-price pl-face');
    const amt = make('p', 'pl-amt');
    amt.append(make('b', '', `$${plan.price}`), make('span', '', '/ month'));
    price.append(amt, make('p', 'pl-term', TERM));

    const calls = make('div', 'pl-calls pl-face');
    const callrow = make('p', 'pl-callrow');
    callrow.append(make('b', '', String(plan.calls)), make('span', '', 'hour-long check-in calls a month'));
    const meter = make('span', 'pl-meter');
    meter.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 8; i++) meter.appendChild(make('i', i < plan.calls ? 'on' : ''));
    calls.append(callrow, meter);

    const incl = make('ul', 'pl-incl pl-face');
    for (const line of plan.face) incl.appendChild(make('li', '', line));

    const apply = make('button', 'pl-apply');
    apply.type = 'button';
    apply.textContent = `Apply for ${plan.name}`;
    apply.dataset.action = 'apply';
    apply.dataset.plan = plan.name;
    apply.addEventListener('click', () => o.onApply && o.onApply(plan.name, apply));

    print.append(logo, title, price, calls, incl, apply);
    tilt.append(sheen, print);
    card.append(shadow, tilt);
    li.appendChild(card);
    row.appendChild(li);

    // the metal and its foil: the Holo Card in external mode, at the bottom of the tilt layer
    const holo = createHoloCard(tilt, {
      ...M.holo,
      external: true,
      frame: FRAME,
      width: '100%',
      radius: 'var(--pl-radius)',
      shadow: false,
      idle: true,
      dprCap: o.dprCap,
      style: { '--hc-ratio': RATIO, '--hc-radius': 'var(--pl-radius)' }
    });
    tilt.insertBefore(holo.el, tilt.firstChild);
    holo.el.setAttribute('aria-hidden', 'true');

    const entry = { plan, li, card, tilt, shadow, band, holo, apply, url: null, popped: false, motion: null };
    entry.motion = createTilt(entry);

    // the pointer, in the card's own layout pixels (offsetX is mapped through every ancestor transform); the card tilts
    // toward it and the foil gets the very same targets, so both spring together
    const track = e => {
      if (e.pointerType === 'touch' && e.type === 'pointermove' && !e.buttons) return;
      let x = e.offsetX;
      let y = e.offsetY;
      for (let n = e.target; n && n !== card && card.contains(n); n = n.offsetParent) {
        x += n.offsetLeft;
        y += n.offsetTop;
      }
      const nx = clamp(x / Math.max(1, card.clientWidth), 0, 1);
      const ny = clamp(y / Math.max(1, card.clientHeight), 0, 1);
      card.classList.add('is-hover');
      entry.motion.aim(nx, ny);
      holo.aim({ tiltX: (0.5 - ny) * 2 * TILT.max, tiltY: (nx - 0.5) * 2 * TILT.max, lightX: nx, lightY: ny });
    };
    const leave = () => {
      card.classList.remove('is-hover');
      entry.motion.leave();
      holo.aim(null);
    };
    card.addEventListener('pointerenter', track);
    card.addEventListener('pointermove', track);
    card.addEventListener('pointerdown', track);
    card.addEventListener('pointerleave', leave);
    card.addEventListener('pointercancel', leave);

    // click / tap the card: it comes forward (or goes back). Apply applies and never pops.
    card.addEventListener('click', e => {
      if (e.target && e.target.closest && e.target.closest('.pl-apply')) return;
      setPopped(popped === plan.name ? null : plan.name);
    });
    // keyboard: Enter / Space on the focused card does the same; Escape sends it back
    card.addEventListener('keydown', e => {
      if (e.target !== card) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (!e.repeat) setPopped(popped === plan.name ? null : plan.name);
      } else if (e.key === 'Escape' && popped === plan.name) setPopped(null);
    });
    return entry;
  });

  // ── which card is out ──
  function setPopped(name) {
    popped = name && TIERS.includes(name) ? name : null;
    for (const c of cards) {
      const on = c.plan.name === popped;
      c.popped = on;
      c.li.classList.toggle('is-popped', on);
      c.li.dataset.popped = String(on);
      c.motion.wake();
    }
    showTier(popped || DEFAULT_TIER);
  }

  // ── paint the metal at the card's real pixel size (crisp: one texel per canvas pixel) ──
  let painted = 0;
  let painting = null;
  let again = false;
  let alive = true;
  const paint = async () => {
    const w = cards[0].card.clientWidth;
    if (!w || !alive) return;
    const pr = Math.min(window.devicePixelRatio || 1, o.dprCap);
    const W = Math.round(w * pr);
    if (painted && Math.abs(W - painted) / painted < 0.06) return;
    painted = W;
    const H = Math.round(W / RATIO);
    for (const c of cards) {
      const url = await toURL(paintArt(c.plan, W, H));
      if (!alive) return URL.revokeObjectURL(url);
      const old = c.url;
      c.url = url;
      c.holo.set({ image: url });
      if (old && old.startsWith('blob:')) setTimeout(() => URL.revokeObjectURL(old), 3000);
    }
  };
  const repaint = () => {
    if (painting) {
      again = true;
      return;
    }
    painting = cssReady
      .then(paint)
      .catch(() => {})
      .finally(() => {
        painting = null;
        if (again && alive) {
          again = false;
          repaint();
        }
      });
  };
  let resizeTimer = 0;
  const sizeWatch = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(repaint, painted ? 250 : 0);
  });
  sizeWatch.observe(cards[0].card);
  repaint();

  // ── SPOTS OPEN n: one count per tier, the board shows the popped card's (Gold's when none is out) ──
  let spotsOf = readSpots(o.spots, readSpots(SPOTS_DEFAULT, {}));
  let placeholder = o.spotsPlaceholder;
  let shownTier = DEFAULT_TIER;
  let shownValue = spotsOf[shownTier];
  let cells = [];
  let busyUntil = 0;
  const markBoard = () => {
    spots.setAttribute('aria-label', `Spots open, ${shownTier}: ${shownValue}`);
    spots.dataset.spots = shownValue;
    spots.dataset.spotsTier = shownTier;
    if (placeholder) spots.setAttribute('data-placeholder', 'spots-count');
    else spots.removeAttribute('data-placeholder');
    for (const c of cells) {
      if (c.isNumber && placeholder) c.cell.el.setAttribute('data-placeholder', 'spots-count');
      else c.cell.el.removeAttribute('data-placeholder');
    }
  };
  const buildBoard = () => {
    cells.forEach(c => c.cell.clearTimers());
    flaps.textContent = '';
    cells = [];
    const text = `${SPOTS_WORDS} ${shownValue}`.toUpperCase();
    [...text].forEach((ch, col) => {
      if (ch === ' ') return flaps.appendChild(make('span', 'pl-gap'));
      const cell = new FlapCell();
      flaps.appendChild(cell.el);
      cell.setTarget(ch, 0, BASE_STEP_MS, true);
      cells.push({ cell, ch, col, isNumber: col > SPOTS_WORDS.length });
    });
    markBoard();
  };
  const runTime = list => Math.max(0, ...list.map(c => c.col)) * BASE_COL_DELAY + 39 * BASE_STEP_MS + BASE_FLIP_S * 1350;
  const flipIn = (only = null) => {
    if (REDUCE) return;
    const list = only ? cells.filter(only) : cells;
    list.forEach(({ cell }) => cell.setTarget(' ', 0, BASE_STEP_MS, true));
    list.forEach(({ cell, ch, col }) => cell.setTarget(ch, col * BASE_COL_DELAY, BASE_STEP_MS));
    busyUntil = performance.now() + runTime(list);
  };
  const flipNumber = value => {
    if (value === shownValue) return markBoard();
    const widthChanged = value.length !== shownValue.length;
    shownValue = value;
    if (widthChanged) {
      buildBoard();
      return flipIn(c => c.isNumber);
    }
    const digits = [...value];
    cells
      .filter(c => c.isNumber)
      .forEach((c, i) => {
        c.ch = digits[i];
        if (REDUCE) c.cell.setTarget(c.ch, 0, BASE_STEP_MS, true);
        else c.cell.setTarget(c.ch, i * BASE_COL_DELAY, BASE_STEP_MS);
      });
    busyUntil = Math.max(busyUntil, performance.now() + 39 * BASE_STEP_MS + BASE_FLIP_S * 1350);
    markBoard();
  };
  function showTier(tier) {
    shownTier = tier;
    flipNumber(spotsOf[tier]);
  }
  buildBoard();
  // touch the board and it flips again (once it has finished)
  spots.addEventListener('pointerenter', () => {
    if (performance.now() > busyUntil) flipIn();
  });

  // ── the heading: Pegassi's line reveal, like the rest of the site (GSAP SplitText, if the page has it) ──
  let split = null;
  let splitTw = null;
  const revealHeading = () => {
    const S = window.SplitText;
    const G = window.gsap;
    if (!S || !G || REDUCE) return;
    if (splitTw) splitTw.kill();
    if (split) split.revert();
    split = S.create(heading, { type: 'lines', mask: 'lines' });
    split.lines.forEach(l => {
      l.style.paddingBlock = '.5em';
    });
    (split.masks || []).forEach(k => {
      k.style.marginBlock = '-.5em';
    });
    G.set(split.lines, { yPercent: 100 });
    splitTw = G.to(split.lines, {
      yPercent: 0,
      duration: 1.75,
      ease: 'expo.out',
      stagger: 0.1,
      onComplete: () => {
        if (split) split.revert();
        split = null;
        splitTw = null;
      }
    });
  };

  const play = () => {
    revealHeading();
    flipIn();
  };

  // first time the board is properly on screen, flip it in (the tunnel should still call play() at the stop)
  let seen = null;
  if (o.autoplay && 'IntersectionObserver' in window) {
    seen = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting && e.intersectionRatio >= 0.5)) {
          seen.disconnect();
          seen = null;
          flipIn();
        }
      },
      { threshold: [0.5] }
    );
    seen.observe(spots);
  }

  return {
    el: root,
    cards: cards.map(c => ({ plan: c.plan.name, el: c.li, card: c.card, holo: c.holo, apply: c.apply })),
    plans: PLANS,
    play,
    /** Bring a card forward by name ('Silver' | 'Gold' | 'Platinum'); null settles whichever is out. */
    pop(name) {
      setPopped(name || null);
    },
    get popped() {
      return popped;
    },
    get spots() {
      return { ...spotsOf };
    },
    /** New counts: { Silver, Gold, Platinum } (any subset) or one number for all; real = true once they're Gage's. */
    setSpots(values, real = false) {
      spotsOf = readSpots(values, spotsOf);
      if (real) placeholder = false;
      flipNumber(spotsOf[shownTier]);
    },
    pause() {
      cards.forEach(c => {
        c.holo.pause();
        c.motion.pause();
      });
    },
    resume() {
      cards.forEach(c => {
        c.holo.resume();
        c.motion.resume();
      });
    },
    destroy() {
      alive = false;
      clearTimeout(resizeTimer);
      sizeWatch.disconnect();
      if (seen) seen.disconnect();
      if (splitTw) splitTw.kill();
      if (split) split.revert();
      cells.forEach(c => c.cell.clearTimers());
      cards.forEach(c => {
        c.motion.destroy();
        c.holo.destroy();
        if (c.url && c.url.startsWith('blob:')) URL.revokeObjectURL(c.url);
      });
      root.remove();
    }
  };
}

export default mountPlans;
