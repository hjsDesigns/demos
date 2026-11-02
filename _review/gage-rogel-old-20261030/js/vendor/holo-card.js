// React Bits "Holo Card" (DavidHDev/react-bits, MIT + Commons Clause), ported to plain JS (ES module, no React, no build).
// The original (HoloCard.jsx / HoloCard.css, registry HoloCard-JS-CSS) sits beside this file in
// website-factory/vendor/effects/reactbits/holo-card/. Everything from PRESETS down to compile() is the original source,
// byte for byte: the presets, PERSPECTIVE 1100, the 63/88 card ratio, both shaders, parseColor and compile. The component
// body is the original's useEffect in the original order: WebGL2 setup, the springs (tilt 150/16, light 220/30, lift 320/30,
// turn 170/20, stepped at 240 Hz), the idle drift (0.7 / 0.53 / 0.41 / 0.33 rad/s), the calm-out, the 2x DPR cap, the
// texture load, ResizeObserver + IntersectionObserver, and the same props with the same defaults.
// React's state and refs are plain variables; its JSX is DOM built once and patched where React would patch it.
// What is different (for Gage's tunnel, where the card sits inside a CSS-3D-scaled section):
//  - the pointer is read from offsetX/offsetY over the card's layout box (clientWidth/clientHeight) instead of
//    getBoundingClientRect(); offsetX is mapped through every ancestor transform, so the tilt follows the cursor in a
//    scaled parent, and on a flat page the numbers are exactly the original's. holo-card.css makes the rotor
//    pointer-events:none so the card's own box is always the event target.
//  - added api: set(props) (a re-render), flip(on?), pause()/resume() (stop the loop while the section is hidden),
//    aim(), destroy(). Added options: dprCap (default 2 = the original's cap); width/radius also take a CSS length
//    string (e.g. 'calc(var(--u)*32)'); a string radius is read back from the computed border radius for the shader.
//  - added option external (default false = the original): the card is only the foil layer of something else that tilts
//    (Gage's plan cards tilt with the Aceternity 3D Card). It doesn't listen to the pointer and never moves its rotor or
//    shadow; aim({ tiltX, tiltY, lightX, lightY }) gives the foil the angles (deg) and light (0-1) to spring to, aim(null)
//    hands it back to the idle drift, which then only moves the light and foil while the card itself stays still.

const PRESETS = ['bursts', 'stars', 'shards', 'cosmos', 'rainbow', 'swirl', 'glitter', 'gold'];
const PERSPECTIVE = 1100;
const CARD_RATIO = 63 / 88;

const VERTEX = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT = `#version 300 es
precision highp float;

uniform sampler2D uArt;
uniform vec2 uSize;
uniform float uAspect;
uniform vec2 uTilt;
uniform vec2 uLight;
uniform float uDistance;
uniform int uPreset;
uniform float uIntensity;
uniform float uScale;
uniform float uEdge;
uniform float uFrame;
uniform float uRadius;
uniform float uGlare;
uniform vec3 uFoil;
uniform float uReady;

out vec4 outColor;

const float TAU = 6.28318530718;

struct Foil {
  float mask;
  float angle;
  float jitter;
  vec2 facet;
};

float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

vec2 hash2(vec2 p) {
  return vec2(hash(p), hash(p + 17.31));
}

vec3 hue(float t) {
  t = abs(fract(t * 0.5) * 2.0 - 1.0);
  vec3 c = mix(vec3(0.1, 0.25, 1.0), vec3(0.0, 0.85, 1.0), smoothstep(0.0, 0.25, t));
  c = mix(c, vec3(0.25, 1.0, 0.2), smoothstep(0.25, 0.45, t));
  c = mix(c, vec3(1.0, 0.92, 0.05), smoothstep(0.45, 0.65, t));
  c = mix(c, vec3(1.0, 0.45, 0.05), smoothstep(0.65, 0.85, t));
  return mix(c, vec3(0.95, 0.12, 0.3), smoothstep(0.85, 1.0, t));
}

Foil bursts(vec2 p) {
  vec2 q = mat2(0.7071068, 0.7071068, -0.7071068, 0.7071068) * (p - vec2(0.5, 0.5 * uAspect)) / (0.283 / uScale);
  vec2 d = fract(q) - 0.5;
  float u = length(d) / 0.49;
  float angle = atan(d.y, d.x);
  if (u < 0.12) {
    float ring = min(floor(u / 0.045 + 0.5), 2.0);
    float count = max(1.0, ring * 6.0);
    float spot = (floor(angle / TAU * count) + 0.5) / count * TAU;
    vec2 dot = vec2(cos(spot), sin(spot)) * ring * 0.045;
    float m = smoothstep(0.024, 0.012, length(d / 0.49 - dot));
    return Foil(m, angle, 0.5, vec2(0.0));
  }
  bool inner = u < 0.66;
  float slot = angle / TAU * (inner ? 56.0 : 72.0);
  bool shifted = mod(floor(slot), 2.0) > 0.5;
  vec2 band = inner ? (shifted ? vec2(0.45, 0.61) : vec2(0.33, 0.49)) : (shifted ? vec2(0.84, 0.99) : vec2(0.7, 0.85));
  float across = abs(u - (band.x + band.y) * 0.5) / ((band.y - band.x) * 0.5);
  float along = abs(fract(slot) - 0.5) * 2.0;
  float width = inner ? 0.72 : 0.6;
  float m = smoothstep(1.0, 0.78, across) * smoothstep(width, width - 0.2, along);
  return Foil(m, angle, 0.5, vec2(0.0));
}

Foil stars(vec2 p) {
  Foil best = Foil(0.0, 0.0, 0.0, vec2(0.0));
  vec2 g = p / (0.08 / uScale);
  vec2 base = floor(g);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 id = base + vec2(float(i), float(j));
      float pick = hash(id + 1.3);
      vec2 d = g - (id + 0.5 + (hash2(id) - 0.5) * 0.55);
      float m = smoothstep(0.07, 0.035, length(d));
      if (pick < 0.62) {
        float size = mix(0.16, 0.5, pow(hash(id + 9.0), 1.8));
        float sector = TAU / (pick < 0.3 ? 4.0 : 5.0);
        float k = abs(fract((atan(d.y, d.x) + hash(id + 4.0) * TAU) / sector) - 0.5) * 2.0;
        float edge = size * mix(1.0, 0.36, pow(k, 0.6));
        m = smoothstep(edge, edge * 0.8, length(d));
      }
      if (m > best.mask) best = Foil(m, hash(id + 6.0) * TAU, hash(id + 8.0), (hash2(id + 2.0) - 0.5) * 0.6);
    }
  }
  return best;
}

Foil shards(vec2 p) {
  vec2 g = p * 19.0 * uScale;
  vec2 base = floor(g);
  float best = 9.0;
  float second = 9.0;
  vec2 id = base;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 cell = base + vec2(float(i), float(j));
      float d = length(cell + 0.08 + hash2(cell) * 0.84 - g);
      if (d < best) {
        second = best;
        best = d;
        id = cell;
      } else if (d < second) {
        second = d;
      }
    }
  }
  float crack = smoothstep(0.015, 0.07, second - best);
  float shine = 0.25 + 0.75 * pow(hash(id + 7.7), 2.0);
  return Foil((0.2 + 0.8 * crack) * shine, hash(id + 3.17) * TAU, hash(id + 11.73), (hash2(id + 5.0) - 0.5) * 0.5);
}

Foil cosmos(vec2 p) {
  Foil best = Foil(0.0, 0.0, 0.0, vec2(0.0));
  vec2 g = p / (0.16 / uScale);
  vec2 base = floor(g);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 id = base + vec2(float(i), float(j));
      vec2 d = g - (id + 0.5 + (hash2(id) - 0.5) * 0.7);
      float size = mix(0.16, 0.52, hash(id + 2.0));
      float r = length(d);
      float m = max(smoothstep(0.05, 0.0, abs(r - size)), smoothstep(size, size - 0.04, r) * 0.22);
      if (m > best.mask) best = Foil(m, hash(id + 6.0) * TAU + atan(d.y, d.x) * 0.5, hash(id + 1.0), (hash2(id + 4.0) - 0.5) * 0.5);
    }
  }
  vec2 fine = p / (0.035 / uScale);
  vec2 cell = floor(fine);
  float dots = smoothstep(0.2, 0.1, length(fine - cell - 0.5 - (hash2(cell + 9.0) - 0.5) * 0.6)) * step(0.55, hash(cell + 2.0));
  if (dots > best.mask) best = Foil(dots, hash(cell) * TAU, hash(cell + 3.0), (hash2(cell + 7.0) - 0.5) * 0.6);
  return best;
}

Foil rainbow(vec2 p) {
  return Foil(0.86 + 0.14 * hash(floor(p * 700.0 * uScale)), 0.2, 0.5, vec2(0.0));
}

Foil swirl(vec2 p) {
  vec2 d = p - vec2(0.5, 0.42 * uAspect);
  float angle = atan(d.y, d.x);
  float rays = 0.55 + 0.45 * smoothstep(0.3, 0.7, abs(fract(angle / TAU * 60.0 * uScale) - 0.5) * 2.0);
  return Foil(rays, angle, length(d), vec2(0.0));
}

Foil glitter(vec2 p) {
  vec2 g = p * 72.0 * uScale;
  vec2 cell = floor(g);
  float size = mix(0.18, 0.4, hash(cell + 3.0));
  float m = smoothstep(size, size * 0.55, length(fract(g) - 0.5 - (hash2(cell) - 0.5) * 0.5)) * step(0.25, hash(cell + 5.0));
  return Foil(m, hash(cell + 7.0) * TAU, hash(cell + 9.0), (hash2(cell + 11.0) - 0.5) * 0.9);
}

Foil gold(vec2 p) {
  Foil flake = glitter(p * 0.8);
  if (flake.mask > 0.5) return flake;
  float etch = 0.55 + 0.45 * smoothstep(0.2, 0.8, abs(fract((p.x * 0.6 + p.y) * 140.0 * uScale) - 0.5) * 2.0);
  return Foil(etch, 0.9, 0.4, vec2(0.0));
}

vec3 sparkles(vec2 p, vec3 halfway, vec2 sweep, float awake) {
  vec2 g = p * 62.0;
  vec2 cell = floor(g);
  vec2 d = fract(g) - 0.5 - (hash2(cell) - 0.5) * 0.36;
  float spin = hash(cell + 3.0) * TAU;
  d = mat2(cos(spin), -sin(spin), sin(spin), cos(spin)) * d;
  vec2 a = abs(d);
  float hexagon = max(a.x * 0.866 + a.y * 0.5, a.y);
  float size = mix(0.22, 0.38, hash(cell + 2.0));
  float piece = smoothstep(size, size - 0.07, hexagon) * step(0.42, hash(cell + 4.0));
  vec3 facet = normalize(vec3((hash2(cell + 6.0) - 0.5) * 0.9, 1.0));
  float flash = pow(max(dot(facet, halfway), 0.0), 6.0);
  vec3 tint = hue(dot(sweep, vec2(cos(spin), sin(spin))) * 1.2 + dot(sweep, vec2(0.8, 0.6)) * 0.8 + hash(cell + 8.0) * 0.5);
  vec3 color = piece * tint * (0.3 + 1.6 * flash) * awake;
  vec2 fine = p * 210.0;
  vec2 speckCell = floor(fine);
  float speck = smoothstep(0.24, 0.0, length(fract(fine) - 0.5 - (hash2(speckCell) - 0.5) * 0.5)) * step(0.72, hash(speckCell + 1.0));
  float speckFlash = pow(max(dot(normalize(vec3((hash2(speckCell + 2.0) - 0.5) * 0.9, 1.0)), halfway), 0.0), 10.0);
  return color + vec3(1.2) * speck * speckFlash * (1.0 - piece);
}

void main() {
  vec2 uv = vec2(gl_FragCoord.x / uSize.x, 1.0 - gl_FragCoord.y / uSize.y);
  vec2 p = vec2(uv.x, uv.y * uAspect);
  vec2 center = vec2(0.5, 0.5 * uAspect);
  vec2 q = abs(p - center) - center + uRadius;
  float outside = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
  float pixel = 1.0 / uSize.x;
  float alpha = clamp(0.5 - outside / pixel, 0.0, 1.0);
  vec4 sampled = texture(uArt, uv);
  if (uReady > 0.5) alpha *= sampled.a;
  if (alpha <= 0.0) {
    outColor = vec4(0.0);
    return;
  }
  vec3 art = uReady > 0.5 ? pow(sampled.rgb, vec3(2.2)) : vec3(0.12);

  mat3 rx = mat3(1.0, 0.0, 0.0, 0.0, cos(uTilt.x), sin(uTilt.x), 0.0, -sin(uTilt.x), cos(uTilt.x));
  mat3 ry = mat3(cos(uTilt.y), 0.0, -sin(uTilt.y), 0.0, 1.0, 0.0, sin(uTilt.y), 0.0, cos(uTilt.y));
  mat3 turn = rx * ry;
  vec3 world = turn * vec3(p - center, 0.0);
  vec3 view = normalize(transpose(turn) * (vec3(0.0, 0.0, uDistance) - world));
  vec3 lamp = vec3((uLight - 0.5) * vec2(1.1, 1.1 * uAspect), 0.9);
  vec3 light = normalize(transpose(turn) * (lamp - world));
  vec3 halfway = normalize(light + view);
  vec2 sweep = light.xy + view.xy;
  float sheen = pow(max(halfway.z, 0.0), 10.0);
  float shine = pow(max(halfway.z, 0.0), 80.0);
  float frame = 1.0 - smoothstep(uFrame - pixel, uFrame + pixel, -outside);

  Foil f;
  if (uPreset == 0) f = bursts(p);
  else if (uPreset == 1) f = stars(p);
  else if (uPreset == 2) f = shards(p);
  else if (uPreset == 3) f = cosmos(p);
  else if (uPreset == 4) f = rainbow(p);
  else if (uPreset == 5) f = swirl(p);
  else if (uPreset == 6) f = glitter(p);
  else f = gold(p);

  vec3 metal = uPreset == 7 ? vec3(1.0, 0.74, 0.38) * dot(uFoil, vec3(0.3333)) * 1.15 : uFoil;
  vec4 look = uPreset == 0 ? vec4(0.25, 1.9, 0.12, 1.0)
    : uPreset == 1 ? vec4(0.6, 1.4, 0.3, 1.0)
    : uPreset == 2 ? vec4(0.9, 0.9, 0.6, 0.5)
    : uPreset == 3 ? vec4(0.7, 1.2, 0.35, 0.85)
    : uPreset == 4 ? vec4(0.0, 2.2, 0.0, 0.45)
    : uPreset == 5 ? vec4(1.6, 0.3, 0.0, 0.4)
    : uPreset == 6 ? vec4(0.9, 1.0, 0.6, 1.0)
    : vec4(0.3, 1.0, 0.2, 0.95);
  vec2 dir = vec2(cos(f.angle), sin(f.angle));
  float phase = dot(sweep, dir) * look.x + dot(sweep, vec2(0.8, 0.6)) * look.y + f.jitter * look.z;
  float spoke = 1.0;
  if (uPreset == 5) {
    float facing = dot(normalize(sweep + 0.0001), dir);
    phase = f.jitter * 2.4 + facing * 0.6 + length(sweep) * 0.8;
    spoke = 0.3 + 0.7 * smoothstep(0.25, 0.95, abs(facing));
  }
  vec3 tint = hue(phase);
  if (uPreset == 7) tint = mix(tint, metal, 0.65);
  float glint = pow(max(dot(normalize(vec3(f.facet, 1.0)), halfway), 0.0), 24.0) * step(0.001, length(f.facet));
  bool layered = uPreset == 2 || uPreset == 4 || uPreset == 5 || uPreset == 7;
  vec3 foil = (layered ? tint : mix(tint, vec3(1.0), 0.12)) * (1.15 + 0.3 * sheen) + metal * glint * 1.2;
  float tilted = smoothstep(0.02, 0.21, length(sin(uTilt)));
  float awake = mix(0.2, 1.0, tilted);
  float strength = uIntensity * f.mask * (1.0 - frame) * awake;
  float band = uPreset == 5 ? spoke : layered ? 0.25 + 0.75 * smoothstep(0.3, 0.95, 0.5 + 0.5 * cos(phase * TAU * 0.5 + 1.3)) : 1.0;
  vec3 color = layered
    ? 1.0 - (1.0 - art) * (1.0 - clamp(foil * look.w * band * strength, 0.0, 1.0))
    : mix(art, foil, clamp(strength * look.w, 0.0, 1.0));
  color += sparkles(p, halfway, sweep, mix(0.55, 1.0, tilted)) * uEdge * frame;
  color += uFoil * sheen * 0.12 * frame;
  color += vec3(sheen * 0.07 + shine * 0.3) * uGlare;
  color = pow(clamp(color, 0.0, 1.0), vec3(1.0 / 2.2));
  outColor = vec4(color * alpha, alpha);
}
`;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const parseColor = value => {
  const fallback = [0.78, 0.8, 0.84];
  if (typeof document === 'undefined') return fallback;
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return fallback;
  ctx.fillStyle = '#000000';
  ctx.fillStyle = value;
  const resolved = ctx.fillStyle;
  if (!resolved.startsWith('#') || resolved.length !== 7) return fallback;
  return [1, 3, 5].map(i => Math.pow(parseInt(resolved.slice(i, i + 2), 16) / 255, 2.2));
};

const compile = (gl, type, source) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
};

// ── the component (HoloCard.jsx from `export default function HoloCard` down), as plain DOM ──────────────────────────

const DEFAULTS = {
  image: undefined,
  backImage: undefined,
  alt: '',
  preset: 'bursts',
  intensity: 0.85,
  scale: 1,
  edgeSparkle: 0.8,
  frame: 4,
  glare: 0.5,
  foilColor: '#e2e6ec',
  width: 320,
  radius: 14,
  tiltMax: 14,
  hoverScale: 1.04,
  idle: true,
  shadow: true,
  className: '',
  style: undefined,
  dprCap: 2, // added: the original hardcodes Math.min(devicePixelRatio, 2)
  external: false // added: foil-only layer driven by aim() (see the header)
};

// React's inline-style rules: custom properties take the value as written, plain numbers get px except unitless keys
const UNITLESS = new Set(['opacity', 'zIndex', 'flex', 'flexGrow', 'flexShrink', 'order', 'lineHeight', 'fontWeight', 'zoom', 'aspectRatio', 'scale']);
const cssValue = (key, value) => (typeof value === 'number' && !key.startsWith('--') && !UNITLESS.has(key) ? `${value}px` : String(value));
const cssLength = value => (typeof value === 'number' ? `${value}px` : String(value));
const make = (tag, className) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
};
const setAttr = (node, name, value) => {
  if (value === undefined || value === null) node.removeAttribute(name);
  else node.setAttribute(name, String(value));
};
const setStyle = (node, key, value) => {
  if (key.startsWith('--')) {
    if (value === undefined || value === null) node.style.removeProperty(key);
    else node.style.setProperty(key, cssValue(key, value));
  } else node.style[key] = value === undefined || value === null ? '' : cssValue(key, value);
};

export function createHoloCard(host, options = {}) {
  let props = { ...DEFAULTS, ...options };

  // useState
  let ratio = CARD_RATIO;
  let ready = false;
  let flipped = false;
  // useRef
  let settings = null; // settingsRef
  let pointer = { x: 0.5, y: 0.5, inside: false }; // pointerRef
  let wake = null; // wakeRef
  let load = null; // loadRef
  let flipOn = false; // flipRef

  // the JSX tree: root > [shadow] + rotor > front (img + canvas) + [back]
  const root = make('div');
  const rotor = make('div', 'holo-card__rotor');
  const front = make('div', 'holo-card__face holo-card__face--front');
  const canvas = make('canvas');
  let shadowEl = null; // shadowRef
  let frontImg = null;
  let back = null;
  let styleKeys = [];
  front.appendChild(canvas);
  rotor.appendChild(front);
  root.appendChild(rotor);
  host.appendChild(root);

  // added: a CSS-length radius (e.g. calc(var(--u)*2)) is read back in px for the shader
  const radiusPx = () => {
    if (typeof props.radius === 'number') return Math.max(0, props.radius);
    return Math.max(0, parseFloat(getComputedStyle(root).borderTopLeftRadius) || 0);
  };

  const render = () => {
    const { image, backImage, alt, preset, intensity, scale, edgeSparkle, frame, glare, foilColor, width, radius, tiltMax, hoverScale, idle, shadow, className, style } = props;
    const flippable = Boolean(backImage);

    settings = {
      preset: Math.max(0, PRESETS.indexOf(preset)),
      intensity: clamp(intensity, 0, 1),
      scale: clamp(scale, 0.25, 4),
      edgeSparkle: clamp(edgeSparkle, 0, 1),
      frame: clamp(frame, 0, 20) / 100,
      glare: clamp(glare, 0, 1),
      foil: parseColor(foilColor),
      radius: 0,
      tiltMax: clamp(tiltMax, 0, 45),
      hoverScale: clamp(hoverScale, 0.8, 1.3),
      idle
    };
    flipOn = flippable && flipped;

    root.className = `holo-card${className ? ` ${className}` : ''}`;
    setAttr(root, 'role', flippable ? 'button' : 'img');
    setAttr(root, 'tabindex', flippable ? 0 : undefined);
    setAttr(root, 'aria-label', alt || undefined);
    setAttr(root, 'aria-pressed', flippable ? flipped : undefined);
    setAttr(root, 'data-ready', ready ? '' : undefined);
    setAttr(root, 'data-flippable', flippable ? '' : undefined);

    const next = { '--hc-w': cssLength(width), '--hc-ratio': ratio, '--hc-radius': cssLength(radius), ...(style || {}) };
    for (const key of styleKeys) if (!(key in next)) setStyle(root, key, null);
    for (const key of Object.keys(next)) setStyle(root, key, next[key]);
    styleKeys = Object.keys(next);
    settings.radius = radiusPx();

    if (shadow && !shadowEl) {
      shadowEl = make('span', 'holo-card__shadow');
      shadowEl.setAttribute('aria-hidden', 'true');
      root.insertBefore(shadowEl, rotor);
    } else if (!shadow && shadowEl) {
      shadowEl.remove();
      shadowEl = null;
    }

    if (image) {
      if (!frontImg) {
        frontImg = make('img');
        frontImg.alt = '';
        frontImg.draggable = false;
        front.insertBefore(frontImg, canvas);
      }
      if (frontImg.getAttribute('src') !== image) frontImg.src = image;
    } else if (frontImg) {
      frontImg.remove();
      frontImg = null;
    }

    if (flippable) {
      if (!back) {
        back = make('div', 'holo-card__face holo-card__face--back');
        const img = make('img');
        img.alt = '';
        img.draggable = false;
        back.appendChild(img);
        rotor.appendChild(back);
      }
      const img = back.firstChild;
      if (img.getAttribute('src') !== backImage) img.src = backImage;
    } else if (back) {
      back.remove();
      back = null;
    }
  };

  // a React re-render plus the two small effects: useEffect(() => wakeRef.current?.()) and useEffect(load, [image])
  let lastImage = props.image;
  const update = () => {
    render();
    wake?.();
    if (props.image !== lastImage) {
      lastImage = props.image;
      load?.(props.image);
    }
  };
  const setReady = value => {
    if (value === ready) return;
    ready = value;
    update();
  };
  const setRatio = value => {
    if (value === ratio) return;
    ratio = value;
    update();
  };

  render();

  // ── the mount effect ──
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
  let program = null;
  let texture = null;
  let buffer = null;
  const uniforms = {};
  let textureReady = false;

  if (gl) {
    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    if (vertex && fragment) {
      program = gl.createProgram();
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.bindAttribLocation(program, 0, 'position');
      gl.linkProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.deleteProgram(program);
        program = null;
      }
    }
    if (program) {
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
      for (const name of [
        'uArt',
        'uSize',
        'uAspect',
        'uTilt',
        'uLight',
        'uDistance',
        'uPreset',
        'uIntensity',
        'uScale',
        'uEdge',
        'uFrame',
        'uRadius',
        'uGlare',
        'uFoil',
        'uReady'
      ]) {
        uniforms[name] = gl.getUniformLocation(program, name);
      }
    }
  }

  const state = {
    tiltX: 0,
    tiltY: 0,
    tiltVX: 0,
    tiltVY: 0,
    lightX: 0.36,
    lightY: 0.26,
    lightVX: 0,
    lightVY: 0,
    lift: 1,
    liftV: 0,
    turn: 0,
    turnV: 0,
    clock: Math.random() * 40
  };
  let raf = 0;
  let last = 0;
  let visible = true;
  let alive = true;
  let calm = 0;
  let held = false; // added: pause()
  let aimed = null; // added: external mode's targets, from aim()
  const external = Boolean(props.external);

  const draw = () => {
    if (!gl || !program) return;
    const s = settings;
    const w = canvas.width;
    const h = canvas.height;
    if (!w || !h) return;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(uniforms.uArt, 0);
    gl.uniform2f(uniforms.uSize, w, h);
    gl.uniform1f(uniforms.uAspect, h / w);
    gl.uniform2f(uniforms.uTilt, (state.tiltX * Math.PI) / 180, ((state.tiltY + state.turn) * Math.PI) / 180);
    gl.uniform2f(uniforms.uLight, state.lightX, state.lightY);
    gl.uniform1f(uniforms.uDistance, PERSPECTIVE / Math.max(1, canvas.clientWidth));
    gl.uniform1i(uniforms.uPreset, s.preset);
    gl.uniform1f(uniforms.uIntensity, s.intensity);
    gl.uniform1f(uniforms.uScale, s.scale);
    gl.uniform1f(uniforms.uEdge, s.edgeSparkle);
    gl.uniform1f(uniforms.uFrame, s.frame);
    gl.uniform1f(uniforms.uRadius, s.radius / Math.max(1, canvas.clientWidth));
    gl.uniform1f(uniforms.uGlare, s.glare);
    gl.uniform3f(uniforms.uFoil, s.foil[0], s.foil[1], s.foil[2]);
    gl.uniform1f(uniforms.uReady, textureReady ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const spring = (value, velocity, target, stiffness, damping, dt) => {
    const next = velocity + ((target - value) * stiffness - velocity * damping) * dt;
    return [value + next * dt, next];
  };

  const tick = now => {
    raf = 0;
    if (!alive) return;
    const dt = Math.min(1 / 30, Math.max(1 / 240, (now - last) / 1000));
    last = now;
    const s = settings;
    let targetX = 0;
    let targetY = 0;
    let lightX = 0.36;
    let lightY = 0.26;
    let lift = 1;
    const drifting = s.idle && !reduce && !pointer.inside && !aimed;
    if (aimed && !reduce) {
      // added: external mode, the angles and light come from whatever tilts the card
      targetX = aimed.tiltX;
      targetY = aimed.tiltY;
      lightX = aimed.lightX;
      lightY = aimed.lightY;
      lift = s.hoverScale;
    } else if (pointer.inside && !reduce) {
      targetX = (0.5 - pointer.y) * 2 * s.tiltMax;
      targetY = (pointer.x - 0.5) * 2 * s.tiltMax;
      lightX = pointer.x;
      lightY = pointer.y;
      lift = s.hoverScale;
    } else if (drifting) {
      state.clock += dt;
      const t = state.clock;
      targetX = Math.sin(t * 0.7) * s.tiltMax * 0.28;
      targetY = Math.sin(t * 0.53 + 1.2) * s.tiltMax * 0.4;
      lightX = 0.5 + Math.sin(t * 0.41) * 0.42;
      lightY = 0.38 + Math.sin(t * 0.33 + 0.6) * 0.3;
    }
    const steps = Math.ceil(dt / (1 / 240));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      [state.tiltX, state.tiltVX] = spring(state.tiltX, state.tiltVX, targetX, 150, 16, h);
      [state.tiltY, state.tiltVY] = spring(state.tiltY, state.tiltVY, targetY, 150, 16, h);
      [state.lightX, state.lightVX] = spring(state.lightX, state.lightVX, lightX, 220, 30, h);
      [state.lightY, state.lightVY] = spring(state.lightY, state.lightVY, lightY, 220, 30, h);
      [state.lift, state.liftV] = spring(state.lift, state.liftV, lift, 320, 30, h);
      [state.turn, state.turnV] = reduce
        ? [flipOn ? 180 : 0, 0]
        : spring(state.turn, state.turnV, flipOn ? 180 : 0, 170, 20, h);
    }
    if (!external) {
      rotor.style.transform = `perspective(${PERSPECTIVE}px) scale(${state.lift}) rotateX(${state.tiltX}deg) rotateY(${state.tiltY + state.turn}deg)`;
      if (shadowEl) {
        shadowEl.style.transform = `translate(${-state.tiltY * 0.7}px, ${state.tiltX * 0.7}px) scale(${0.9 + (state.lift - 1) * 1.5})`;
      }
    }
    if (Math.cos(((state.tiltY + state.turn) * Math.PI) / 180) > -0.05) draw();
    const motion =
      Math.abs(state.tiltVX) +
      Math.abs(state.tiltVY) +
      Math.abs(state.liftV) * 40 +
      Math.abs(state.turnV) +
      (Math.abs(state.lightVX) + Math.abs(state.lightVY)) * 60 +
      Math.abs(state.tiltX - targetX) +
      Math.abs(state.tiltY - targetY);
    calm = motion > 0.02 ? 0 : calm + dt;
    if (!visible || held || (!drifting && !pointer.inside && !aimed && calm > 0.3)) return;
    raf = requestAnimationFrame(tick);
  };

  wake = () => {
    if (raf || !alive || held) return;
    calm = 0;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, props.dprCap);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    if (typeof props.radius !== 'number') settings.radius = radiusPx();
    draw();
    wake?.();
  };

  load = src => {
    textureReady = false;
    setReady(false);
    if (!src) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => {
      if (!alive) return;
      if (img.naturalWidth && img.naturalHeight) setRatio(img.naturalWidth / img.naturalHeight);
      if (!gl || !program) return;
      try {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        textureReady = true;
        setReady(true);
        draw();
        wake?.();
      } catch {
        textureReady = false;
      }
    };
    img.src = src;
  };
  load(props.image);

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const visibility = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    if (visible) wake?.();
  });
  visibility.observe(root);
  resize();

  // ── the event handlers ──
  const track = e => {
    if (e.pointerType === 'touch' && e.type === 'pointermove' && !e.buttons) return;
    // changed: offsetX/offsetY over the layout box, so a CSS-3D-scaled parent can't throw the pointer off
    let x = e.offsetX;
    let y = e.offsetY;
    for (let node = e.target; node && node !== root && root.contains(node); node = node.offsetParent) {
      x += node.offsetLeft;
      y += node.offsetTop;
    }
    pointer = {
      x: clamp(x / Math.max(1, root.clientWidth), 0, 1),
      y: clamp(y / Math.max(1, root.clientHeight), 0, 1),
      inside: true
    };
    wake?.();
  };

  const leave = () => {
    pointer = { ...pointer, inside: false };
    wake?.();
  };

  const toggle = () => {
    if (Boolean(props.backImage)) {
      flipped = !flipped;
      update();
    }
  };

  const keydown = e => {
    if (!props.backImage || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    if (!e.repeat) toggle();
  };

  if (!external) {
    root.addEventListener('pointerenter', track);
    root.addEventListener('pointermove', track);
    root.addEventListener('pointerdown', track);
    root.addEventListener('pointerleave', leave);
    root.addEventListener('pointercancel', leave);
    root.addEventListener('click', toggle);
    root.addEventListener('keydown', keydown);
  }

  return {
    el: root,
    canvas,
    /** Change any prop, like a React re-render (a new image reloads the texture). */
    set(next) {
      props = { ...props, ...next };
      update();
    },
    /** Turn the card over (only when it has a backImage). No argument toggles. */
    flip(on) {
      if (!props.backImage) return;
      const value = on === undefined ? !flipped : Boolean(on);
      if (value === flipped) return;
      flipped = value;
      update();
    },
    /** Stop the loop (e.g. while its section is hidden); resume() picks it back up. */
    pause() {
      held = true;
      cancelAnimationFrame(raf);
      raf = 0;
    },
    resume() {
      if (!held) return;
      held = false;
      wake?.();
    },
    get paused() {
      return held;
    },
    /** External mode: spring the foil to these angles (deg) and light (0-1); null returns it to the idle drift. */
    aim(target) {
      aimed = target
        ? {
            tiltX: Number(target.tiltX) || 0,
            tiltY: Number(target.tiltY) || 0,
            lightX: target.lightX == null ? 0.36 : clamp(Number(target.lightX), 0, 1),
            lightY: target.lightY == null ? 0.26 : clamp(Number(target.lightY), 0, 1)
          }
        : null;
      wake?.();
    },
    destroy() {
      alive = false;
      cancelAnimationFrame(raf);
      wake = null;
      load = null;
      resizeObserver.disconnect();
      visibility.disconnect();
      root.removeEventListener('pointerenter', track);
      root.removeEventListener('pointermove', track);
      root.removeEventListener('pointerdown', track);
      root.removeEventListener('pointerleave', leave);
      root.removeEventListener('pointercancel', leave);
      root.removeEventListener('click', toggle);
      root.removeEventListener('keydown', keydown);
      if (gl) {
        gl.deleteTexture(texture);
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        gl.getExtension('WEBGL_lose_context')?.loseContext(); // added: free the context now, not at GC
      }
      root.remove();
    }
  };
}

export default createHoloCard;
