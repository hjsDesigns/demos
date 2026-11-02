// Float Viewer (2026-10-30): React Bits "Model Viewer" (reactbits.dev/components/model-viewer · ModelViewer.jsx · MIT +
// Commons Clause) joined with Prismic's Fizzi "FloatingCan" + "SodaCan" (github.com/prismicio-community/course-fizzi-next
// · Apache-2.0) and the drei <Float> the cans float on (@react-three/drei 9.111.3 · MIT), ported to plain JS on three r186.
// Originals unchanged: vendor/effects/reactbits/model-viewer/ (ModelViewer.jsx) and vendor/effects/prismic/fizzi/original/
// (FloatingCan.tsx, SodaCan.tsx, the scenes, Soda-can.gltf, the labels, lobby.hdr, and drei's Float.tsx under drei/).
// Licences: React Bits, MIT + Commons Clause · Fizzi, Apache-2.0 © Prismic (js/vendor/fizzi/LICENSE-fizzi.txt; this file states what
// changed) · drei, MIT © 2020 react-spring · three.js, MIT.
// Hayden (10/30): "the two skills and code I want you to copy are the model viewer and floating cans fizzy. I want you to
// kind of combine the two… we'll use that for some of the products Gage sends us."
//
// Kept exactly, Model Viewer: FOV 30 · the 1.3 s intro on an ease-out cubic ('rise': up from -0.45, 0.9 → 1, a -0.5 rad
// twist; 'spin': a -1.2π twist; 'none') · drag = 0.0065 rad a pixel, velocity blended 0.4 old / 0.6 new, no fling after an
// 80 ms hold, the coast e^(-4.5t), pitch held to ±65°, turntable pitch back to `tilt` at e^(-4t) · auto-rotate 0.4 rad/s
// once idle 2 s, eased in and out at e^(-2t) · hover tilt 0.15 rad across (0.6 of it up and down) at e^(-6t) · zoom 0.7-2
// on ctrl/⌘ + wheel or a pinch, at e^(-8t) · double-click glides home (startAngle, tilt) at e^(-7t) · the fit: the model
// scaled so its largest side is 2 and centred, camera distance = radius / (fit · tan 15° · min(1, aspect)), near/far =
// distance / 50 and × 50, offsetX / offsetY · its own bob, sin(1.3t) · float · 0.06 · NeutralToneMapping at `exposure`,
// a key light at (3, 5, 4) × 0.6 · frames only while something moves and the viewer is on screen · the 0.6 s fade-in ·
// reduced motion: no intro, no auto-rotate, no bob (a drag still turns it).
// Kept exactly, drei Float with Fizzi's FloatingCan numbers (speed 1.5, rotationIntensity 1, floatIntensity 1,
// floatingRange [-0.1, 0.1]): rotation x = cos(t/4 · speed)/8, y = sin(t/4 · speed)/8, z = sin(t/4 · speed)/20, each
// × rotationIntensity; lift = mapLinear(sin(t/4 · speed)/10, -0.1, 0.1, range) × floatIntensity; a random phase per object
// (0-10 000 s), applied to an inner group around the object, like <Float> wraps <SodaCan>.
// Kept exactly, Fizzi's SodaCan (shape 'can'): Soda-can.gltf (Draco) and its three parts by name (cylinder = the metal,
// cylinder_1 = the label sleeve, Tab), scaled 2 and turned -π; metal roughness 0.3, metalness 1, #bbbbbb; label roughness
// 0.15, metalness 0.7, flipY false; Fizzi's <Environment files="/hdr/lobby.hdr" environmentIntensity={1.5} /> is the
// default light (environment 'lobby').
// How they're joined: every object is a FloatingCan (Float around the shape) handed to its own Model Viewer stage, so it
// floats and sways like Fizzi's cans and turns, coasts and glides home like Model Viewer. Model Viewer's own bob is 0 by
// default here (Float floats it). Float's lift is carried over from Fizzi units to Model Viewer's 2-unit fit (× 2 / 1.3987,
// the can's height in Fizzi units), so any object bobs by the same share of its height as Fizzi's can, about ±7%.
// Changed: one canvas draws every object, each in its own box (scissored viewports, the way Fizzi's <View.Port> shares one
// canvas), so a row of products costs one WebGL context · boxes come from layout offsets and the hover tilt from
// offsetX/Y, both correct inside a CSS-3D-scaled parent (the original uses getBoundingClientRect) · the clocks only run
// while the viewer runs (no jump after a pause) · a drag cancels a glide that's still running (the original lets them
// fight) · the grab cursor comes back after a drag · ContactShadows not ported (no floor on a dark page) · glTF/glb only
// (no FBX/OBJ) · the 'studio' preset is not bundled (pass its .hdr as `environment`; vendor/effects/reactbits/model-viewer/
// keeps studio_small_03_1k.hdr) · no capture() (no preserveDrawingBuffer).
// Added: shape 'card' (an official cut-out product photo printed on both faces of a navy card: the site's thin blue line
// and corner ticks, a laminate sheen that catches the room as it turns), for products with no 3D model and no flat label ·
// faceOnHover: hovering (or tapping) a product glides it round to face you (`faceAngle`) on Model Viewer's own e^(-7t)
// glide · keys: focus faces it, ←/→ flick it, Enter faces it · environment 'tunnel' (a navy room with blue strip lights,
// for Gage's grid tunnel) · scene `lights` · onActive / onReady / onItemReady / onError · pause / resume / intro / face /
// settle / refresh / set / destroy.
// Added 2026-10-31 (for real product models, Gage's Supplements piece): boxes may overlap (the colour is cleared once a
// frame and only the depth per box, so a later item draws over an earlier one, the way Fizzi's cans pass in front of each
// other) · environment 'studio-tunnel' (the tunnel with a studio's white softboxes in it: true label colours, blue rims)
// · per item `pose` [x, y, z] degrees, a resting pose inside the spin (a bar can turn while tilted) · orbit: true, the
// tilt becomes the camera's height ('XYZ'), so an object turns upright with no wobble (Model Viewer's 'YXZ' makes a
// resting tilt circle round as it spins) · fitMode 'turntable': fits the object's height and its radius round the
// vertical, measured on its vertices after the pose, with room for the tilt and Float's lean and lift, instead of its
// bounding sphere (so a spinning product fills its box and never leaves it) · autoRotate 'sway': rock `swayAngle`
// degrees either side of facing you instead of turning right round · preloadModel(url) to decode a model early.
//
// API
//   const viewer = createFloatViewer(el, {
//     items: [{ key, slot: HTMLElement, shape: 'card' | 'can' | 'model' | 'object',
//               image, back: 'same' | url | null, alt   (card) · label (can) · url (model) · object: THREE.Object3D (object)
//               …any of the per-object settings below to override them for this one }],
//     environment: 'lobby' | 'tunnel' | 'studio-tunnel' | { base, line, glow, key, fill } | '.hdr url' | null,
//     environmentIntensity: 1.5,
//     exposure: 1, toneMapping: 'neutral' | 'aces' | 'none', dprCap: 2, lights: [{ type: 'directional' | 'point',
//     color, intensity, position: [x, y, z] }], keyLight: true, card: { …CARD overrides }, assets: { addons, gltf, lobby,
//     draco }, autoPause: true, introOnLoad: true, reducedMotion: (prefers-reduced-motion),
//     onReady(), onItemReady(key), onActive(key | null), onError(error, key),
//     per object (defaults = React Bits Model Viewer, then Fizzi's Float): autoRotate true, autoRotateSpeed 0.4,
//     autoRotateDelay 2, dragRotate true, turntable false, zoom true, minZoom 0.7, maxZoom 2, hoverTilt 0.15, float 0,
//     intro 'rise', startAngle -30, tilt 10, offsetX 0, offsetY 0, fit 0.8, resetOnDoubleClick true, floatEnabled true,
//     floatSpeed 1.5, rotationIntensity 1, floatIntensity 1, floatingRange [-0.1, 0.1], faceOnHover false, faceAngle 0,
//     orbit false, fitMode 'sphere' | 'turntable', swayAngle 30 (autoRotate: true | false | 'sway'); per item only: pose })
//   preloadModel(url, assets?)            fetch and decode a glTF/glb before a viewer needs it (shared cache)
//   viewer.pause() / viewer.resume()      stop / restart the frames (it also stops itself off screen and in a hidden tab)
//   viewer.intro({ stagger, fade })       replay the entrance (each object `stagger` s after the one before)
//   viewer.face(key?)                     glide one object (or all) round to face you
//   viewer.settle()                       let go of any drag or hover (a section closing)
//   viewer.refresh()                      measure the boxes again (layout moved without resizing)
//   viewer.set(patch)                     change any setting live; viewer.destroy()
//   viewer.canvas, viewer.renderer, viewer.scene, viewer.ready, viewer.failed (no WebGL: show your own fallback)
// The el holds the canvas (absolutely positioned over it, pointer-events none, made position: relative if static); each
// item's slot is a box inside el, and is what takes the pointer (give it pointer-events, touch-action pan-y is set).
import * as THREE from './three/three.module.min.js';

const HERE = import.meta.url;
// where the loaders, Fizzi's can and its light live (the three addons are copies with `from 'three'` made relative)
const ASSETS = {
  addons: new URL('./three/addons/', HERE).href,
  gltf: new URL('./fizzi/Soda-can.gltf', HERE).href,
  lobby: new URL('./fizzi/lobby.hdr', HERE).href,
  draco: null // default: <addons>libs/draco/gltf/
};

const FOV = 30;
// a product whose model has artwork on only some faces turns within a limit instead of all the way round
function clampYaw(m, s) {
  const lim = (s.yawLimit || 0) * Math.PI / 180;
  if (lim <= 0) return false;
  const home = toRadians(s.startAngle);
  const hit = m.yaw < home - lim || m.yaw > home + lim;
  if (hit) { m.yaw = clamp(m.yaw, home - lim, home + lim); m.yawVelocity = 0; }
  return hit;
}
const INTRO_SECONDS = 1.3;
const DRAG_SPEED = 0.0065;
const PITCH_LIMIT = (65 * Math.PI) / 180;
const FIZZI_CAN_HEIGHT = 1.3987; // Soda-can.gltf is 0.69934 tall; SodaCan scales it by 2
const FLOAT_TO_FIT = 2 / FIZZI_CAN_HEIGHT; // Float's lift, from Fizzi units into Model Viewer's 2-unit fit
const toRadians = degrees => (degrees * Math.PI) / 180;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// React Bits Model Viewer's props, as it ships them
export const MODEL_VIEWER = Object.freeze({
  environmentIntensity: 1,
  exposure: 1,
  autoRotate: true,
  autoRotateSpeed: 0.4,
  autoRotateDelay: 2,
  dragRotate: true,
  turntable: false,
  zoom: true,
  minZoom: 0.7,
  maxZoom: 2,
  hoverTilt: 0.15,
  float: 0.3,
  intro: 'rise',
  startAngle: -30,
  tilt: 10,
  offsetX: 0,
  offsetY: 0,
  fit: 0.8,
  resetOnDoubleClick: true
});
// Fizzi's FloatingCan, as it ships (its <Float> props)
export const FLOATING_CAN = Object.freeze({ speed: 1.5, rotationIntensity: 1, floatIntensity: 1, floatingRange: [-0.1, 0.1] });

const DEFAULTS = {
  ...MODEL_VIEWER,
  float: 0, // Model Viewer's own bob is off: drei Float floats the object
  environment: 'lobby',
  environmentIntensity: 1.5, // Fizzi's Environment
  toneMapping: 'neutral',
  floatEnabled: true,
  floatSpeed: FLOATING_CAN.speed,
  rotationIntensity: FLOATING_CAN.rotationIntensity,
  floatIntensity: FLOATING_CAN.floatIntensity,
  floatingRange: FLOATING_CAN.floatingRange,
  faceOnHover: false,
  faceAngle: 0,
  orbit: false, // true: the tilt is the camera's height, not the object's lean (no wobble as it turns)
  fitMode: 'sphere', // 'turntable': fit the object's height and its turning radius instead of its bounding sphere (bigger)
  swayAngle: 30, // autoRotate 'sway': it rocks this many degrees either side of facing you instead of turning right round
  yawLimit: 0, // degrees either side of the start angle that DRAG and coast may reach; 0 = all the way round.
               // Set it when a product's model only carries artwork on the faces you have (a front-only
               // wrapper): the object still turns under the hand, it just never shows a blank back.
  keyboard: true,
  dprCap: 2, // Model Viewer's dpr [1, 2]
  keyLight: true,
  lights: [],
  card: null,
  autoPause: true,
  introOnLoad: true,
  onReady: null,
  onItemReady: null,
  onActive: null,
  onError: null
};
// the settings one item may override for itself
const PER_ITEM = [
  'autoRotate', 'autoRotateSpeed', 'autoRotateDelay', 'dragRotate', 'turntable', 'zoom', 'minZoom', 'maxZoom',
  'hoverTilt', 'float', 'intro', 'startAngle', 'tilt', 'offsetX', 'offsetY', 'fit', 'resetOnDoubleClick',
  'floatEnabled', 'floatSpeed', 'rotationIntensity', 'floatIntensity', 'floatingRange', 'faceOnHover', 'faceAngle', 'swayAngle', 'fitMode', 'orbit', 'yawLimit'
];

// ── shape 'card': an official product photo printed on a navy card, both faces (no 3D model, no flat label) ──
export const CARD = Object.freeze({
  bevel: 0.008, // the rounded rim, as a share of the card's height
  thickness: 0.018, // the slab between the two rims (≈ 3% of the height in all)
  radius: 0.05,
  padX: 0.1, // the photo's margins, as a share of the card's height
  padTop: 0.1,
  padBottom: 0.12,
  minAspect: 0.8,
  maxAspect: 1.6,
  faceHeight: 768, // the printed face, in texture pixels
  bg: ['#101b2c', '#080f19'],
  glow: 'rgba(6, 135, 255, 0.34)',
  glowEnd: 'rgba(6, 135, 255, 0)',
  line: 'rgba(92, 178, 255, 0.32)',
  tick: '#0687FF',
  shadow: 'rgba(0, 0, 0, 0.5)',
  body: '#0c1626',
  bodyMetalness: 0.7,
  bodyRoughness: 0.32,
  sheenRoughness: 0.22
});

function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`float-viewer: could not load ${src}`));
    img.src = src;
  });
}

// the photo's own edges (its opaque part), so the product fills the card whatever margin the file has
function alphaBox(img) {
  const W = img.naturalWidth || img.width;
  const H = img.naturalHeight || img.height;
  const full = { x: 0, y: 0, w: W, h: H };
  try {
    const k = Math.min(1, 256 / Math.max(W, H));
    const w = Math.max(1, Math.round(W * k));
    const h = Math.max(1, Math.round(H * k));
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data;
    let x0 = w;
    let y0 = h;
    let x1 = -1;
    let y1 = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (d[(y * w + x) * 4 + 3] > 10) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    if (x1 < 0) return full;
    const sx = W / w;
    const sy = H / h;
    const X0 = Math.max(0, (x0 - 1) * sx);
    const Y0 = Math.max(0, (y0 - 1) * sy);
    const X1 = Math.min(W, (x1 + 2) * sx);
    const Y1 = Math.min(H, (y1 + 2) * sy);
    return { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 };
  } catch {
    return full; // a tainted canvas (cross-origin without CORS): use the whole picture
  }
}

function tracePath(g, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  g.beginPath();
  g.moveTo(x + r, y);
  g.lineTo(x + w - r, y);
  g.arcTo(x + w, y, x + w, y + r, r);
  g.lineTo(x + w, y + h - r);
  g.arcTo(x + w, y + h, x + w - r, y + h, r);
  g.lineTo(x + r, y + h);
  g.arcTo(x, y + h, x, y + h - r, r);
  g.lineTo(x, y + r);
  g.arcTo(x, y, x + r, y, r);
  g.closePath();
}

// one printed face: the site's navy, the tunnel's blue glow, a thin blue line, two corner ticks, and the photo
function paintFace(img, box, faceAspect, o, capH) {
  const H = o.faceHeight;
  const W = Math.round(H * faceAspect);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, o.bg[0]);
  bg.addColorStop(1, o.bg[1]);
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  const cx = W / 2;
  const cy = H * 0.6;
  const glow = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.55);
  glow.addColorStop(0, o.glow);
  glow.addColorStop(1, o.glowEnd);
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);
  // the thin line, inset, following the card's corner
  const px = H / capH; // texture pixels per card unit
  const inset = H * 0.035;
  const lw = Math.max(2, H * 0.0026);
  g.strokeStyle = o.line;
  g.lineWidth = lw;
  tracePath(g, inset, inset, W - inset * 2, H - inset * 2, Math.max(2, o.radius * px - inset * 0.6));
  g.stroke();
  // corner ticks, top left and bottom right (the site's panels)
  const t = H * 0.06;
  const tw = Math.max(3, H * 0.006);
  const ti = inset * 1.9;
  g.strokeStyle = o.tick;
  g.lineWidth = tw;
  g.lineCap = 'square';
  g.beginPath();
  g.moveTo(ti, ti + t);
  g.lineTo(ti, ti);
  g.lineTo(ti + t, ti);
  g.moveTo(W - ti, H - ti - t);
  g.lineTo(W - ti, H - ti);
  g.lineTo(W - ti - t, H - ti);
  g.stroke();
  // the product, contained in the margins, with a soft shadow under it
  if (img) {
    const left = o.padX * H;
    const top = o.padTop * H;
    const cw = W - left * 2;
    const ch = H - top - o.padBottom * H;
    const scale = Math.min(cw / box.w, ch / box.h);
    const dw = box.w * scale;
    const dh = box.h * scale;
    g.save();
    g.shadowColor = o.shadow;
    g.shadowBlur = H * 0.035;
    g.shadowOffsetY = H * 0.012;
    g.drawImage(img, box.x, box.y, box.w, box.h, (W - dw) / 2, top + (ch - dh) / 2, dw, dh);
    g.restore();
  }
  return c;
}

function faceTexture(canvas, renderer) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return tex;
}

async function buildCard(spec, renderer, cardOptions) {
  const o = { ...CARD, ...(cardOptions || {}), ...(spec.card || {}) };
  const img = await loadImage(spec.image);
  const box = alphaBox(img);
  // the card hugs the product: its face is as wide as the photo needs at 78% of the height, within min/maxAspect
  const contentH = 1 - o.padTop - o.padBottom;
  const faceAspect = clamp((box.w / box.h) * contentH + o.padX * 2, o.minAspect, o.maxAspect);
  const capH = 1 - o.bevel * 2; // the printed face (the cap inside the rim), card height = 1
  const capW = faceAspect * capH;
  const front = faceTexture(paintFace(img, box, faceAspect, o, capH), renderer);
  let back = front;
  if (spec.back && spec.back !== 'same') {
    const backImg = await loadImage(spec.back);
    back = faceTexture(paintFace(backImg, alphaBox(backImg), faceAspect, o, capH), renderer);
  } else if (spec.back === null) {
    back = faceTexture(paintFace(null, null, faceAspect, o, capH), renderer);
  }

  const shape = roundedRect(capW, capH, o.radius);
  const body = new THREE.ExtrudeGeometry(shape, {
    depth: o.thickness,
    bevelEnabled: true,
    bevelThickness: o.bevel * 0.75,
    bevelSize: o.bevel,
    bevelSegments: 3,
    curveSegments: 12
  });
  body.translate(0, 0, -o.thickness / 2);
  const capZ = o.thickness / 2 + o.bevel * 0.75 + 0.0006;
  const faceGeo = new THREE.ShapeGeometry(shape, 12);
  const uv = faceGeo.attributes.uv;
  const pos = faceGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + capW / 2) / capW, (pos.getY(i) + capH / 2) / capH);
  uv.needsUpdate = true;
  const frontGeo = faceGeo.clone().translate(0, 0, capZ);
  const backGeo = faceGeo.clone().rotateY(Math.PI).translate(0, 0, -capZ); // turned: it reads the right way from behind
  faceGeo.dispose();

  const bodyMat = new THREE.MeshStandardMaterial({ color: o.body, metalness: o.bodyMetalness, roughness: o.bodyRoughness });
  const print = map => new THREE.MeshBasicMaterial({ map, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  // the laminate: reflection only (black, so no colour of its own), added over the print
  const sheen = () =>
    new THREE.MeshStandardMaterial({
      color: 0x000000,
      metalness: 0,
      roughness: o.sheenRoughness,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -2
    });
  const group = new THREE.Group();
  group.name = 'card';
  const bodyMesh = new THREE.Mesh(body, bodyMat);
  const frontMesh = new THREE.Mesh(frontGeo, print(front));
  const backMesh = new THREE.Mesh(backGeo, print(back));
  const frontSheen = new THREE.Mesh(frontGeo, sheen());
  const backSheen = new THREE.Mesh(backGeo, sheen());
  frontSheen.renderOrder = backSheen.renderOrder = 1;
  group.add(bodyMesh, frontMesh, backMesh, frontSheen, backSheen);
  group.userData.alt = spec.alt || '';
  return group;
}

// ── loaders (only fetched when a can or a model is asked for) ──
let gltfLoader = null;
const gltfCache = new Map();
async function getGltfLoader(assets) {
  if (gltfLoader) return gltfLoader;
  const [{ GLTFLoader }, { DRACOLoader }] = await Promise.all([
    import(`${assets.addons}loaders/GLTFLoader.js`),
    import(`${assets.addons}loaders/DRACOLoader.js`)
  ]);
  const draco = new DRACOLoader();
  draco.setDecoderPath(assets.draco || `${assets.addons}libs/draco/gltf/`);
  gltfLoader = new GLTFLoader().setDRACOLoader(draco);
  return gltfLoader;
}
function loadGltf(url, assets) {
  if (!gltfCache.has(url)) {
    const p = getGltfLoader(assets).then(loader => loader.loadAsync(url));
    p.catch(() => gltfCache.delete(url));
    gltfCache.set(url, p);
  }
  return gltfCache.get(url);
}

// Fizzi's SodaCan: the can's three parts, its metal, the label sleeve
async function buildCan(spec, renderer, assets) {
  const gltf = await loadGltf(spec.gltf || assets.gltf, assets);
  const label = await new THREE.TextureLoader().loadAsync(spec.label);
  label.flipY = false; // "Fixes upside down labels"
  label.colorSpace = THREE.SRGBColorSpace;
  label.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const meshes = [];
  gltf.scene.traverse(node => {
    if (node.isMesh) meshes.push(node);
  });
  // by name, as drei's useGLTF hands them to SodaCan (nodes.cylinder, nodes.cylinder_1, nodes.Tab); in file order if renamed
  const part = (name, i) => gltf.scene.getObjectByName(name) || meshes[i];
  const metalMaterial = new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 1, color: '#bbbbbb' });
  const group = new THREE.Group();
  group.name = 'soda-can';
  group.scale.setScalar(2);
  group.rotation.set(0, -Math.PI, 0);
  group.add(
    new THREE.Mesh(part('cylinder', 0).geometry, metalMaterial),
    new THREE.Mesh(part('cylinder_1', 1).geometry, new THREE.MeshStandardMaterial({ roughness: 0.15, metalness: 0.7, map: label })),
    new THREE.Mesh(part('Tab', 2).geometry, metalMaterial)
  );
  group.userData.sharedGeometry = true; // the geometry belongs to the cached glTF
  return group;
}

async function buildModel(spec, assets) {
  const gltf = await loadGltf(spec.url, assets);
  const object = gltf.scene.clone(true);
  object.userData.sharedGeometry = true; // the cached glTF's geometry stays for the next viewer (its materials and textures
  // are disposed with this viewer, which frees them on this viewer's GPU only: another viewer showing it uploads them again)
  return object;
}

/** Start fetching and decoding a glTF/glb before any viewer needs it (the next viewer to show it gets it at once). */
export function preloadModel(url, assetOptions) {
  return loadGltf(url, { ...ASSETS, ...(assetOptions || {}) });
}

// ── light ──
// 'tunnel': a navy room with the grid's blue strip lights running away down the floor, ceiling and walls, plus a soft
// panel overhead, made into an environment map (so metal and gloss pick up the tunnel's blue as they turn)
// 'studio-tunnel' (added 2026-10-31, for real products): the same room with a photo studio's white softboxes in it, a key
// up front-left, a fill on the right and a strip overhead, so labels keep their true colours while the plastic and film
// still catch the tunnel's blue. The object form takes { base, line, glow, key, fill } (key / fill 0 = the plain tunnel).
const STUDIO_TUNNEL = { key: 1.0, fill: 0.45 };
function tunnelEnvironment(renderer, o = {}) {
  const base = new THREE.Color(o.base || '#070B12');
  const line = new THREE.Color(o.line || '#0687FF');
  const glow = new THREE.Color(o.glow || '#5CB2FF');
  const room = new THREE.Scene();
  const trash = [];
  const add = (geometry, color, intensity, place, side = THREE.DoubleSide) => {
    const material = new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(intensity), side });
    const mesh = new THREE.Mesh(geometry, material);
    place(mesh);
    room.add(mesh);
    trash.push(geometry, material);
  };
  const white = new THREE.Color('#ffffff');
  const facing = (x, y, z) => m => {
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
  };
  if (o.key > 0) {
    add(new THREE.PlaneGeometry(3.4, 2.4), white, 3.2 * o.key, facing(-2.7, 3.2, 3.3)); // the key softbox
    add(new THREE.PlaneGeometry(0.35, 6.5), white, 2.2 * o.key, m => {
      m.position.set(0.6, 4.9, 0.4); // a strip light overhead: the long highlight down a tub's shoulder or a wrapper's edge
      m.rotation.x = Math.PI / 2;
    });
  }
  if (o.fill > 0) add(new THREE.PlaneGeometry(2.6, 3.2), white, 1.9 * o.fill, facing(3.8, 0.4, 2.2));
  add(new THREE.BoxGeometry(10, 10, 10), base, 1, () => {}, THREE.BackSide);
  const lengthwise = new THREE.PlaneGeometry(0.1, 10);
  const alongWall = new THREE.PlaneGeometry(10, 0.1);
  for (const v of [-3.2, -1.6, 0, 1.6, 3.2]) {
    add(lengthwise, line, 5, m => {
      m.position.set(v, -4.95, 0);
      m.rotation.x = -Math.PI / 2;
    });
    add(lengthwise, line, 5, m => {
      m.position.set(v, 4.95, 0);
      m.rotation.x = Math.PI / 2;
    });
    add(alongWall, line, 5, m => {
      m.position.set(-4.95, v, 0);
      m.rotation.y = Math.PI / 2;
    });
    add(alongWall, line, 5, m => {
      m.position.set(4.95, v, 0);
      m.rotation.y = -Math.PI / 2;
    });
  }
  add(new THREE.PlaneGeometry(4, 2.5), glow, 2.2, m => {
    m.position.set(0, 4.6, 2.5);
    m.rotation.x = Math.PI / 2;
  });
  add(new THREE.PlaneGeometry(6, 3), glow, 0.6, m => {
    m.position.set(0, 0.5, 4.95);
    m.rotation.y = Math.PI;
  });
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(room, 0.04);
  pmrem.dispose();
  trash.forEach(t => t.dispose());
  return { texture: target.texture, dispose: () => target.dispose() };
}

async function loadEnvironment(env, renderer, assets) {
  if (!env) return null;
  if (env === 'studio-tunnel') return tunnelEnvironment(renderer, STUDIO_TUNNEL);
  if (env === 'tunnel' || typeof env === 'object') return tunnelEnvironment(renderer, typeof env === 'object' ? env : {});
  const url = env === 'lobby' ? assets.lobby : env;
  const { HDRLoader } = await import(`${assets.addons}loaders/HDRLoader.js`);
  const texture = await new HDRLoader().loadAsync(url);
  texture.mapping = THREE.EquirectangularReflectionMapping; // three turns it into a PMREM for the standard materials
  return { texture, dispose: () => texture.dispose() };
}

// Model Viewer's measure: largest side to 2 units, centred
function measure(object) {
  const box = new THREE.Box3().setFromObject(object);
  const extent = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = 2 / Math.max(extent.x, extent.y, extent.z, 0.0001);
  return { scale, center, radius: (extent.length() / 2) * scale, floor: (extent.y / 2) * scale };
}

// (added) a turntable's bounds: the object's half-height and its radius round the vertical axis, measured on its own
// vertices after Model Viewer's centring and scaling and the item's resting pose; tighter than the bounding sphere, so a
// product turning on the spot can fill its box and still never leave it
function turntableBounds(object, b, quaternion) {
  const v = new THREE.Vector3();
  let hy = 0;
  let rxz = 0;
  object.updateMatrixWorld(true);
  object.traverse(node => {
    const position = node.isMesh && node.geometry && node.geometry.attributes.position;
    if (!position) return;
    for (let i = 0; i < position.count; i++) {
      v.fromBufferAttribute(position, i).applyMatrix4(node.matrixWorld).sub(b.center).multiplyScalar(b.scale).applyQuaternion(quaternion);
      if (Math.abs(v.y) > hy) hy = Math.abs(v.y);
      const r = Math.hypot(v.x, v.z);
      if (r > rxz) rxz = r;
    }
  });
  return hy > 0 && rxz > 0 ? { hy, rxz } : null;
}

function disposeObject(object) {
  if (!object) return;
  const shared = object.userData.sharedGeometry;
  object.traverse(node => {
    if (!node.isMesh) return;
    if (!shared) node.geometry?.dispose();
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      if (!material) continue;
      for (const key of ['map', 'emissiveMap', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'alphaMap']) material[key]?.dispose?.();
      material.dispose();
    }
  });
}

// a point on the box in its own layout pixels (offsetX/Y are measured in the element's untransformed box, so this holds
// inside a CSS-3D-scaled parent)
function localPoint(event, node) {
  if (event.target === node) return { x: event.offsetX, y: event.offsetY };
  const r = node.getBoundingClientRect();
  return {
    x: ((event.clientX - r.left) / Math.max(r.width, 1)) * node.offsetWidth,
    y: ((event.clientY - r.top) / Math.max(r.height, 1)) * node.offsetHeight
  };
}

// a box's offset inside el, walking offsetParents (el must be positioned; borders of boxes in between are counted)
function offsetWithin(node, root) {
  let x = 0;
  let y = 0;
  let n = node;
  while (n && n !== root) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent;
    if (n && n !== root) {
      x += n.clientLeft;
      y += n.clientTop;
    }
  }
  if (n === root) return { x, y };
  // root isn't an offsetParent of the box (a fixed box, or el not positioned): fall back to the screen, scaled to layout
  const a = node.getBoundingClientRect();
  const b = root.getBoundingClientRect();
  const k = root.offsetWidth / Math.max(b.width, 1);
  return { x: (a.left - b.left) * k, y: (a.top - b.top) * k };
}

export function createFloatViewer(el, options = {}) {
  const { items: specs = [], assets: assetOptions, ...rest } = options;
  const S = { ...DEFAULTS, ...rest };
  const assets = { ...ASSETS, ...(assetOptions || {}) };
  const motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  if (options.reducedMotion === undefined) S.reducedMotion = !!motionQuery?.matches;

  const canvas = document.createElement('canvas');
  canvas.className = 'float-viewer__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'absolute',
    left: '0',
    top: '0',
    width: '100%',
    height: '100%',
    display: 'block',
    pointerEvents: 'none',
    opacity: S.intro === 'none' ? '1' : '0',
    transition: S.intro === 'none' ? 'none' : 'opacity 0.6s ease'
  });

  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (error) {
    S.onError?.(error, null);
    return {
      failed: true,
      ready: false,
      canvas: null,
      renderer: null,
      scene: null,
      pause() {},
      resume() {},
      intro() {},
      face() {},
      settle() {},
      refresh() {},
      set() {},
      destroy() {}
    };
  }
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false; // frame() clears: the colour once a frame, the depth once per box (so boxes may overlap)
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const applyLook = () => {
    renderer.toneMapping =
      S.toneMapping === 'aces' ? THREE.ACESFilmicToneMapping : S.toneMapping === 'none' ? THREE.NoToneMapping : THREE.NeutralToneMapping;
    renderer.toneMappingExposure = S.exposure;
  };
  applyLook();

  const madeRelative = getComputedStyle(el).position === 'static';
  if (madeRelative) el.style.position = 'relative';
  el.insertBefore(canvas, el.firstChild);

  const scene = new THREE.Scene();
  scene.environmentIntensity = S.environmentIntensity;
  const sceneLights = [];
  if (S.keyLight) {
    const key = new THREE.DirectionalLight(0xffffff, 0.6); // Model Viewer's <directionalLight position={[3, 5, 4]} intensity={0.6} />
    key.position.set(3, 5, 4);
    sceneLights.push(key);
  }
  for (const L of S.lights || []) {
    const light =
      L.type === 'point'
        ? new THREE.PointLight(L.color ?? 0xffffff, L.intensity ?? 1, L.distance ?? 0, L.decay ?? 2)
        : new THREE.DirectionalLight(L.color ?? 0xffffff, L.intensity ?? 1);
    if (L.position) light.position.fromArray(L.position);
    sceneLights.push(light);
  }
  sceneLights.forEach(light => scene.add(light));

  let alive = true;
  let running = options.paused !== true;
  let onScreen = true;
  let raf = 0;
  let lastTime = 0;
  let elapsed = 0; // Float's clock (state.clock in drei), running only while frames run
  let needsMeasure = true;
  let frameCount = 0;
  let shown = false;
  let active = null;
  let environment = null;
  const size = { w: 0, h: 0, pr: 0 };

  const envReady = loadEnvironment(S.environment, renderer, assets)
    .then(env => {
      if (!alive) return env?.dispose();
      environment = env;
      scene.environment = env ? env.texture : null;
    })
    .catch(error => {
      S.onError?.(error, null);
      console.warn('float-viewer: environment', error);
    });

  const items = specs.map((spec, index) => makeItem(spec, index));

  function makeItem(spec, index) {
    const s = Object.create(S);
    for (const key of PER_ITEM) if (spec[key] !== undefined) s[key] = spec[key];
    const it = {
      index,
      key: spec.key ?? String(index),
      spec,
      slot: spec.slot,
      s,
      root: new THREE.Group(),
      floatGroup: new THREE.Group(),
      tiltGroup: new THREE.Group(),
      spinGroup: new THREE.Group(),
      drei: new THREE.Group(), // drei Float's inner group (matrixAutoUpdate false)
      pose: new THREE.Group(), // the object's own resting pose (spec.pose, degrees), inside the spin: a tilted bar spins tilted
      fit: new THREE.Group(),
      camera: new THREE.PerspectiveCamera(FOV, 1, 0.01, 100),
      rect: { x: 0, y: 0, w: 0, h: 0 },
      object: null,
      bounds: null,
      ready: false,
      failed: false,
      floatOffset: spec.floatOffset ?? Math.random() * 10000,
      hovering: false,
      pointers: new Map(),
      pinchStart: 0,
      zoomStart: 1,
      tap: null,
      unbind: null,
      // Model Viewer's motionRef
      m: {
        yaw: toRadians(s.startAngle),
        pitch: toRadians(s.tilt),
        yawVelocity: 0,
        pitchVelocity: 0,
        zoom: 1,
        zoomGoal: 1,
        tiltX: 0,
        tiltY: 0,
        tiltGoalX: 0,
        tiltGoalY: 0,
        spinSpeed: 0,
        idle: 0,
        dragging: false,
        intro: s.intro === 'none' ? 1 : 0,
        wait: 0,
        clock: 0,
        reset: null,
        swayPhase: 0,
        swayBlend: 0
      }
    };
    it.drei.matrixAutoUpdate = false;
    it.root.add(it.floatGroup);
    it.floatGroup.add(it.tiltGroup);
    it.tiltGroup.add(it.spinGroup);
    it.spinGroup.add(it.drei);
    it.drei.add(it.pose);
    it.pose.add(it.fit);
    if (Array.isArray(spec.pose)) it.pose.rotation.set(...spec.pose.map(d => toRadians(d || 0)), 'XYZ');
    it.root.visible = false;
    scene.add(it.root);
    if (it.slot) it.unbind = bind(it);
    load(it);
    return it;
  }

  async function load(it) {
    try {
      await envReady;
      const spec = it.spec;
      const shape = spec.shape || (spec.object ? 'object' : spec.url ? 'model' : spec.label ? 'can' : 'card');
      let object;
      if (shape === 'card') object = await buildCard(spec, renderer, S.card);
      else if (shape === 'can') object = await buildCan(spec, renderer, assets);
      else if (shape === 'model') object = await buildModel(spec, assets);
      else object = spec.object;
      if (!object) throw new Error(`float-viewer: nothing to show for ${it.key}`);
      if (!alive) {
        if (shape !== 'object') disposeObject(object);
        return;
      }
      it.ownsObject = shape !== 'object';
      const b = measure(object); // measured before it's placed, like Model Viewer's useMemo(measure)
      it.bounds = b;
      if (it.s.fitMode === 'turntable') it.turntable = turntableBounds(object, b, it.pose.quaternion);
      it.fit.scale.setScalar(b.scale);
      it.fit.position.set(-b.center.x * b.scale, -b.center.y * b.scale, -b.center.z * b.scale);
      it.fit.add(object);
      it.object = object;
      if (!S.introOnLoad) it.m.intro = 1;
      it.ready = true;
      if (!shown) {
        shown = true;
        canvas.style.opacity = '1';
      }
      S.onItemReady?.(it.key);
      if (items.every(i => i.ready || i.failed)) S.onReady?.();
      needsMeasure = true;
      invalidate();
    } catch (error) {
      it.failed = true;
      S.onError?.(error, it.key);
      console.warn('float-viewer:', it.key, error);
      if (items.every(i => i.ready || i.failed)) S.onReady?.();
    }
  }

  // ── the pointer, Model Viewer's handlers on each item's box ──
  function bind(it) {
    const node = it.slot;
    node.style.touchAction = 'pan-y';
    const grab = () => (it.s.dragRotate ? 'grab' : '');
    node.style.cursor = grab();
    if (S.keyboard && !node.hasAttribute('tabindex')) node.tabIndex = 0;

    const onDown = event => {
      const s = it.s;
      const m = it.m;
      it.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, t: event.timeStamp });
      if (event.pointerType !== 'mouse') it.tap = { id: event.pointerId, x: event.clientX, y: event.clientY, t: event.timeStamp };
      if (it.pointers.size === 2 && s.zoom) {
        const [a, b] = [...it.pointers.values()];
        it.pinchStart = Math.hypot(a.x - b.x, a.y - b.y);
        it.zoomStart = m.zoomGoal;
        m.dragging = false;
      } else if (it.pointers.size === 1 && s.dragRotate && (event.pointerType !== 'mouse' || event.button === 0)) {
        m.dragging = true;
        m.yawVelocity = 0;
        m.pitchVelocity = 0;
        m.reset = null; // a drag takes over from a glide still running
        node.setPointerCapture?.(event.pointerId);
        node.style.cursor = 'grabbing';
      }
      m.idle = 0;
      setActive(it);
      invalidate();
    };

    const onMove = event => {
      const s = it.s;
      const m = it.m;
      if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
        const p = localPoint(event, node);
        const nx = (p.x / Math.max(node.offsetWidth, 1)) * 2 - 1;
        const ny = (p.y / Math.max(node.offsetHeight, 1)) * 2 - 1;
        m.tiltGoalX = ny * s.hoverTilt * 0.6;
        m.tiltGoalY = nx * s.hoverTilt;
      }
      const last = it.pointers.get(event.pointerId);
      if (last) {
        const dx = event.clientX - last.x;
        const dy = event.clientY - last.y;
        const elapsedSeconds = Math.max((event.timeStamp - last.t) / 1000, 1 / 240);
        last.x = event.clientX;
        last.y = event.clientY;
        last.t = event.timeStamp;
        if (it.pointers.size === 2 && s.zoom && it.pinchStart > 0) {
          const [a, b] = [...it.pointers.values()];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          m.zoomGoal = clamp((it.zoomStart * distance) / it.pinchStart, Math.min(s.minZoom, s.maxZoom), Math.max(s.minZoom, s.maxZoom));
        } else if (m.dragging) {
          m.yaw += dx * DRAG_SPEED;
          if (clampYaw(m, s)) m.yawVelocity = 0;
          else m.yawVelocity = m.yawVelocity * 0.4 + ((dx * DRAG_SPEED) / elapsedSeconds) * 0.6;
          if (!s.turntable) {
            m.pitch = clamp(m.pitch + dy * DRAG_SPEED, -PITCH_LIMIT, PITCH_LIMIT);
            m.pitchVelocity = m.pitchVelocity * 0.4 + ((dy * DRAG_SPEED) / elapsedSeconds) * 0.6;
          }
          m.idle = 0;
        }
      }
      if (it.tap && it.tap.id === event.pointerId && Math.hypot(event.clientX - it.tap.x, event.clientY - it.tap.y) > 8) it.tap = null;
      invalidate();
    };

    const onUp = event => {
      const m = it.m;
      const last = it.pointers.get(event.pointerId);
      if (last && event.timeStamp - last.t > 80) {
        m.yawVelocity = 0;
        m.pitchVelocity = 0;
      }
      it.pointers.delete(event.pointerId);
      if (it.pointers.size < 2) it.pinchStart = 0;
      if (it.pointers.size === 0) {
        m.dragging = false;
        node.style.cursor = grab();
      }
      // a tap with a finger or pen (no drag) turns it to face you, as hovering does with a mouse
      const tap = it.tap;
      it.tap = null;
      if (event.type === 'pointerup' && tap && tap.id === event.pointerId && event.timeStamp - tap.t < 350 && it.s.faceOnHover) face(it);
      invalidate();
    };

    const onEnter = event => {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      it.hovering = true;
      if (it.s.faceOnHover && !it.m.dragging) face(it);
      setActive(it);
      invalidate();
    };

    const onLeave = event => {
      it.m.tiltGoalX = 0;
      it.m.tiltGoalY = 0;
      if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
        it.hovering = false;
        if (!it.m.dragging && active === it) setActive(null);
      }
      invalidate();
    };

    const onWheel = event => {
      const s = it.s;
      if (!s.zoom || !(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      const m = it.m;
      m.zoomGoal = clamp(m.zoomGoal * Math.exp(-event.deltaY * 0.01), Math.min(s.minZoom, s.maxZoom), Math.max(s.minZoom, s.maxZoom));
      m.idle = 0;
      invalidate();
    };

    const onDoubleClick = () => {
      const s = it.s;
      if (!s.resetOnDoubleClick) return;
      const m = it.m;
      const turns = Math.round((m.yaw - toRadians(s.startAngle)) / (Math.PI * 2));
      m.reset = { yaw: toRadians(s.startAngle) + turns * Math.PI * 2, pitch: toRadians(s.tilt) };
      m.zoomGoal = 1;
      m.yawVelocity = 0;
      m.pitchVelocity = 0;
      m.idle = 0;
      invalidate();
    };

    // keys (added): focus from the keyboard faces it, ←/→ give it a flick, Enter/Space face it again (a click's focus
    // doesn't: it would start a glide under the drag that click begins)
    const onFocus = () => {
      if (!S.keyboard || it.pointers.size > 0) return;
      let keyed = true;
      try {
        keyed = node.matches(':focus-visible');
      } catch {}
      if (!keyed) return;
      if (it.s.faceOnHover) face(it);
      setActive(it);
    };
    const onBlur = () => {
      if (active === it && !it.hovering) setActive(null);
    };
    const onKey = event => {
      if (!S.keyboard) return;
      const m = it.m;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        m.reset = null;
        m.yawVelocity += event.key === 'ArrowLeft' ? -3 : 3;
        m.idle = 0;
        invalidate();
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        face(it);
      }
    };

    node.addEventListener('pointerdown', onDown);
    node.addEventListener('pointermove', onMove);
    node.addEventListener('pointerup', onUp);
    node.addEventListener('pointercancel', onUp);
    node.addEventListener('pointerenter', onEnter);
    node.addEventListener('pointerleave', onLeave);
    // a blocking wheel listener only where zoom is on (read once, here), so it never slows the page's own scrolling
    const wheel = !!it.s.zoom;
    if (wheel) node.addEventListener('wheel', onWheel, { passive: false });
    node.addEventListener('dblclick', onDoubleClick);
    node.addEventListener('focus', onFocus);
    node.addEventListener('blur', onBlur);
    node.addEventListener('keydown', onKey);
    return () => {
      node.removeEventListener('pointerdown', onDown);
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerup', onUp);
      node.removeEventListener('pointercancel', onUp);
      node.removeEventListener('pointerenter', onEnter);
      node.removeEventListener('pointerleave', onLeave);
      if (wheel) node.removeEventListener('wheel', onWheel);
      node.removeEventListener('dblclick', onDoubleClick);
      node.removeEventListener('focus', onFocus);
      node.removeEventListener('blur', onBlur);
      node.removeEventListener('keydown', onKey);
      node.style.cursor = '';
      node.style.touchAction = '';
    };
  }

  function setActive(it) {
    if (active === it) return;
    active = it;
    S.onActive?.(it ? it.key : null);
  }

  // glide round to face you: Model Viewer's double-click glide, aimed at faceAngle instead of startAngle
  function face(it) {
    const s = it.s;
    const m = it.m;
    if (m.dragging) return;
    const target = toRadians(s.faceAngle);
    const turns = Math.round((m.yaw - target) / (Math.PI * 2));
    m.reset = { yaw: target + turns * Math.PI * 2, pitch: toRadians(s.tilt) };
    m.yawVelocity = 0;
    m.pitchVelocity = 0;
    m.idle = 0;
    invalidate();
  }

  // ── one frame of one object: Model Viewer's useFrame, then drei Float's ──
  function step(it, dt) {
    const s = it.s;
    const m = it.m;
    const reduce = S.reducedMotion;
    m.clock += dt;
    m.idle += dt;
    if (it.hovering && s.faceOnHover) m.idle = 0; // it waits, facing you, until the pointer leaves

    if (m.intro < 1) {
      if (m.wait > 0) m.wait -= dt;
      else m.intro = reduce ? 1 : Math.min(1, m.intro + dt / INTRO_SECONDS);
    }
    const eased = 1 - Math.pow(1 - m.intro, 3);

    if (m.reset) {
      m.yaw += (m.reset.yaw - m.yaw) * (1 - Math.exp(-dt * 7));
      m.pitch += (m.reset.pitch - m.pitch) * (1 - Math.exp(-dt * 7));
      if (Math.abs(m.reset.yaw - m.yaw) < 0.001 && Math.abs(m.reset.pitch - m.pitch) < 0.001) m.reset = null;
    } else if (!m.dragging) {
      const decay = Math.exp(-dt * 4.5);
      m.yaw += m.yawVelocity * dt;
      clampYaw(m, s);
      m.pitch = clamp(m.pitch + m.pitchVelocity * dt, -PITCH_LIMIT, PITCH_LIMIT);
      m.yawVelocity *= decay;
      m.pitchVelocity *= decay;
      if (s.turntable) m.pitch += (toRadians(s.tilt) - m.pitch) * (1 - Math.exp(-dt * 4));
    }

    if (s.autoRotate === 'sway') {
      // (added) rock either side of facing you instead of turning right round: eased in once it's idle, let go the moment
      // it's dragged; its peak speed is autoRotateSpeed, so 'sway' and a full turn feel the same pace
      const idle = !reduce && !m.dragging && !m.reset && m.idle > Math.max(0, s.autoRotateDelay);
      m.swayBlend += ((idle ? 1 : 0) - m.swayBlend) * (1 - Math.exp(-dt * 1.5));
      if (m.swayBlend > 0.001) {
        const amp = toRadians(s.swayAngle);
        m.swayPhase += dt * (s.autoRotateSpeed / Math.max(amp, 0.05));
        const front = toRadians(s.faceAngle);
        const home = front + Math.round((m.yaw - front) / (Math.PI * 2)) * Math.PI * 2;
        m.yaw += (home + amp * Math.sin(m.swayPhase) - m.yaw) * (1 - Math.exp(-dt * 3 * m.swayBlend));
      }
      m.spinSpeed = 0;
    } else {
      const spinning = s.autoRotate && !reduce && !m.dragging && m.idle > Math.max(0, s.autoRotateDelay);
      m.spinSpeed += ((spinning ? s.autoRotateSpeed : 0) - m.spinSpeed) * (1 - Math.exp(-dt * 2));
      m.yaw += m.spinSpeed * dt;
      clampYaw(m, s);
    }

    m.zoom += (m.zoomGoal - m.zoom) * (1 - Math.exp(-dt * 8));
    m.tiltX += (m.tiltGoalX - m.tiltX) * (1 - Math.exp(-dt * 6));
    m.tiltY += (m.tiltGoalY - m.tiltY) * (1 - Math.exp(-dt * 6));

    const aspect = it.rect.w / Math.max(it.rect.h, 1);
    const halfView = Math.tan(toRadians(FOV) / 2);
    const fit = Math.max(s.fit, 0.05);
    const tt = s.fitMode === 'turntable' ? it.turntable : null;
    // 'turntable' (added): far enough that the object's top and bottom, and its widest point at any turn, stay inside
    // the box even on the side nearest the camera; otherwise Model Viewer's fit of the bounding sphere
    let fitDistance;
    if (tt) {
      // its height as seen: the resting tilt and Float's lean (x up to 1/8 rad) show some of its top, Float's lift moves it
      const lean = Math.min(Math.abs(toRadians(s.tilt)) + (s.floatEnabled ? 0.125 * s.rotationIntensity : 0), 1.2);
      const lift = s.floatEnabled ? 0.1 * s.floatIntensity * FLOAT_TO_FIT : 0;
      const hy = tt.hy * Math.cos(lean) + tt.rxz * Math.sin(lean) + lift;
      fitDistance = tt.rxz + Math.max(hy / (fit * halfView), tt.rxz / (fit * halfView * aspect));
    } else {
      fitDistance = it.bounds.radius / (fit * halfView * Math.min(1, aspect));
    }
    const distance = fitDistance / m.zoom;
    const camera = it.camera;
    camera.aspect = aspect;
    camera.position.set(0, 0, distance);
    camera.near = distance / 50;
    camera.far = distance * 50;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    const halfHeight = fitDistance * halfView;
    it.root.position.set(s.offsetX * halfHeight * aspect, s.offsetY * halfHeight, 0);

    const intro = s.intro;
    const rise = intro === 'rise' ? (1 - eased) * -0.45 : 0;
    const grow = intro === 'rise' ? 0.9 + 0.1 * eased : 1;
    const twist = intro === 'spin' ? (1 - eased) * -Math.PI * 1.2 : intro === 'rise' ? (1 - eased) * -0.5 : 0;
    const bob = reduce ? 0 : Math.sin(m.clock * 1.3) * s.float * 0.06;
    it.floatGroup.position.y = rise + bob;
    it.floatGroup.scale.setScalar(grow);
    it.tiltGroup.rotation.set(m.tiltX, m.tiltY, 0);
    // Model Viewer turns the object, then its pitch ('YXZ'), so a resting tilt circles round as it spins; orbit (added)
    // pitches the view instead ('XYZ'): the object spins upright and is seen from `tilt` above, like a camera on a turntable
    it.spinGroup.rotation.set(m.pitch, m.yaw + twist, 0, s.orbit ? 'XYZ' : 'YXZ');

    // drei Float (Fizzi's FloatingCan)
    const floating = s.floatEnabled && s.floatSpeed !== 0 && !reduce;
    const d = it.drei;
    if (floating) {
      const t = it.floatOffset + elapsed;
      const speed = s.floatSpeed;
      const ri = s.rotationIntensity;
      d.rotation.x = (Math.cos((t / 4) * speed) / 8) * ri;
      d.rotation.y = (Math.sin((t / 4) * speed) / 8) * ri;
      d.rotation.z = (Math.sin((t / 4) * speed) / 20) * ri;
      let y = Math.sin((t / 4) * speed) / 10;
      y = THREE.MathUtils.mapLinear(y, -0.1, 0.1, s.floatingRange?.[0] ?? -0.1, s.floatingRange?.[1] ?? 0.1);
      d.position.y = y * s.floatIntensity * FLOAT_TO_FIT;
      d.updateMatrix();
    } else if (d.position.y !== 0 || d.rotation.x !== 0 || d.rotation.y !== 0 || d.rotation.z !== 0) {
      d.position.set(0, 0, 0);
      d.rotation.set(0, 0, 0);
      d.updateMatrix(); // reduced motion: still
    }

    return (
      m.intro < 1 ||
      m.dragging ||
      !!m.reset ||
      Math.abs(m.yawVelocity) + Math.abs(m.pitchVelocity) > 0.0005 ||
      Math.abs(m.zoomGoal - m.zoom) > 0.0005 ||
      Math.abs(m.tiltGoalX - m.tiltX) + Math.abs(m.tiltGoalY - m.tiltY) > 0.0005 ||
      m.spinSpeed > 0.0005 ||
      (s.autoRotate && !reduce) ||
      (s.float > 0 && !reduce) ||
      floating
    );
  }

  function measureAll() {
    needsMeasure = false;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const pr = Math.min(window.devicePixelRatio || 1, Math.max(1, S.dprCap));
    if (w !== size.w || h !== size.h || pr !== size.pr) {
      size.w = w;
      size.h = h;
      size.pr = pr;
      renderer.setPixelRatio(pr);
      renderer.setSize(Math.max(1, w), Math.max(1, h), false);
    }
    for (const it of items) {
      if (!it.slot || !it.slot.isConnected) {
        it.rect.w = it.rect.h = 0;
        continue;
      }
      const p = offsetWithin(it.slot, el);
      it.rect.x = p.x;
      it.rect.y = p.y;
      it.rect.w = it.slot.offsetWidth;
      it.rect.h = it.slot.offsetHeight;
    }
  }

  function frame(now) {
    raf = 0;
    if (!alive || !running || !onScreen || document.hidden) {
      lastTime = 0;
      return;
    }
    const raw = lastTime ? Math.max(0, (now - lastTime) / 1000) : 0;
    lastTime = now;
    const dt = Math.min(raw, 0.05); // Model Viewer's Math.min(delta, 0.05)
    elapsed += Math.min(raw, 0.1);
    if (needsMeasure || ++frameCount % 30 === 0) measureAll();

    let settling = false;
    renderer.setScissorTest(false);
    renderer.clear();
    for (const it of items) {
      if (!it.ready || it.rect.w < 2 || it.rect.h < 2) continue;
      if (step(it, dt)) settling = true;
      const r = it.rect;
      const y = size.h - r.y - r.h;
      renderer.setViewport(r.x, y, r.w, r.h);
      renderer.setScissor(r.x, y, r.w, r.h);
      renderer.setScissorTest(true);
      // only the depth is cleared per box (the colour was cleared once, above), so boxes may overlap: each object draws
      // over the ones before it, the way Fizzi's cans pass in front of each other (items later in the list are in front)
      renderer.clear(false, true, false);
      it.root.visible = true;
      renderer.render(scene, it.camera);
      it.root.visible = false;
    }
    renderer.setScissorTest(false);
    if (settling) invalidate();
    else lastTime = 0;
  }

  function invalidate() {
    if (!raf && alive && running && onScreen && !document.hidden) raf = requestAnimationFrame(frame);
  }

  // ── watching: size, being on screen, the tab, reduced motion ──
  const sizeWatch = typeof ResizeObserver === 'function' ? new ResizeObserver(() => {
    needsMeasure = true;
    invalidate();
  }) : null;
  if (sizeWatch) {
    sizeWatch.observe(el);
    items.forEach(it => it.slot && sizeWatch.observe(it.slot));
  }
  const viewWatch =
    S.autoPause && typeof IntersectionObserver === 'function'
      ? new IntersectionObserver(entries => {
          onScreen = entries.some(entry => entry.isIntersecting);
          if (onScreen) invalidate();
        })
      : null;
  viewWatch?.observe(el);
  const onTab = () => {
    if (!document.hidden) invalidate();
  };
  document.addEventListener('visibilitychange', onTab);
  const onWindow = () => {
    needsMeasure = true;
    invalidate();
  };
  window.addEventListener('resize', onWindow);
  document.fonts?.ready?.then(() => alive && onWindow());
  const onMotion = () => {
    if (options.reducedMotion !== undefined) return;
    S.reducedMotion = !!motionQuery.matches;
    invalidate();
  };
  motionQuery?.addEventListener?.('change', onMotion);
  const onLost = event => {
    event.preventDefault();
    cancelAnimationFrame(raf);
    raf = 0;
  };
  const onRestored = () => {
    needsMeasure = true;
    invalidate();
  };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);

  invalidate();

  return {
    canvas,
    renderer,
    scene,
    failed: false,
    get ready() {
      return items.length > 0 && items.every(it => it.ready || it.failed);
    },
    get items() {
      return items.map(it => ({ key: it.key, slot: it.slot, ready: it.ready, failed: it.failed, object: it.object }));
    },
    get active() {
      return active ? active.key : null;
    },
    get paused() {
      return !running;
    },
    pause() {
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
      lastTime = 0;
    },
    resume() {
      if (!alive) return;
      running = true;
      needsMeasure = true;
      invalidate();
    },
    /** Replay the entrance: each object rises in `stagger` s after the one before; `fade` fades the canvas in again. */
    intro({ stagger = 0, fade = true } = {}) {
      items.forEach((it, i) => {
        if (it.s.intro === 'none') return;
        it.m.intro = 0;
        it.m.wait = i * Math.max(0, stagger);
      });
      if (fade && shown && S.intro !== 'none' && !S.reducedMotion) {
        canvas.style.transition = 'none';
        canvas.style.opacity = '0';
        void canvas.offsetWidth;
        canvas.style.transition = 'opacity 0.6s ease';
        canvas.style.opacity = '1';
      }
      invalidate();
    },
    /** Glide one object (by key) or all of them round to face you. */
    face(key) {
      items.forEach(it => {
        if (key == null || it.key === key) face(it);
      });
    },
    /** Let go of any drag or hover (a section closing). */
    settle() {
      items.forEach(it => {
        for (const id of it.pointers.keys()) it.slot?.releasePointerCapture?.(id);
        it.pointers.clear();
        it.pinchStart = 0;
        it.tap = null;
        it.hovering = false;
        it.m.dragging = false;
        it.m.tiltGoalX = it.m.tiltGoalY = 0;
        if (it.slot) it.slot.style.cursor = it.s.dragRotate ? 'grab' : '';
      });
      setActive(null);
      invalidate();
    },
    refresh() {
      needsMeasure = true;
      invalidate();
    },
    set(patch = {}) {
      Object.assign(S, patch);
      if ('environmentIntensity' in patch) scene.environmentIntensity = S.environmentIntensity;
      if ('toneMapping' in patch || 'exposure' in patch) applyLook();
      if ('dprCap' in patch) needsMeasure = true;
      invalidate();
    },
    destroy() {
      if (!alive) return;
      alive = false;
      cancelAnimationFrame(raf);
      raf = 0;
      sizeWatch?.disconnect();
      viewWatch?.disconnect();
      document.removeEventListener('visibilitychange', onTab);
      window.removeEventListener('resize', onWindow);
      motionQuery?.removeEventListener?.('change', onMotion);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      items.forEach(it => {
        it.unbind?.();
        if (it.ownsObject) disposeObject(it.object);
      });
      environment?.dispose();
      scene.environment = null;
      renderer.dispose();
      renderer.forceContextLoss(); // give the WebGL context back now (browsers keep only a handful)
      canvas.remove();
      if (madeRelative) el.style.position = '';
    }
  };
}

export default createFloatViewer;
