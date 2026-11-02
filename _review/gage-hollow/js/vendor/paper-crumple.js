// React Bits "Paper Crumple" (reactbits.dev/micro/paper-crumple · PaperCrumple.jsx · MIT + Commons Clause), ported to plain JS
// for Gage's results (2026-10-30). The original sits unchanged in vendor/effects/reactbits/paper-crumple/.
// Kept exactly: the crumple itself — the jittered paper grid with random diagonals, the 64-frame position-based crumple
// simulation with crease hinges and layer separation (createPaperPath, copied character for character below; it runs in a
// worker built from that same code), the creases a sheet keeps after it is smoothed out ("creased" memory, 0.18), the
// crease-aware normals, the grain bump map, the matte paper (front print, back plain #f4f0e8 stock), the paperLighting mix
// (a flat sheet shows its print unlit, light comes in as it folds), the springs (advance), the lights (hemisphere 1.35 +
// warm key 1.8 at -35°, shadows) and the 35° camera with 1 unit = 1 px.
// What is different (Hayden 10/30: "click on client's profile, animation happens. Paper shows up. Mouse goes off of it.
// Paper crumples up… put a trash can so the paper crumples up and goes in the trash can"):
//  - the page drives it (show / hide) instead of press-and-drag, and several sheets can be in the air at once (one per key);
//    two never cross: a sheet waits in the can until every other sheet on its way in has gone in;
//  - a digital trash can (ours, not React Bits': "more digital… rather than such a realistic one"): the tunnel's grid
//    wrapped round a can in the room's blue. show() lights a balled-up sheet up in it, pops it out and opens it flat on the
//    way (keeping its creases); hide() crumples it into a ball and tosses it back in, where it is deleted with a flash;
//  - sizes come from the layout box (offsetWidth/Height), so it works inside the tunnel's 3D-scaled sections;
//  - no floor shadow plane and no CSS drop-shadow (neither shows on a dark page; filtering a big canvas every frame costs);
//  - PCFShadowMap instead of PCFSoftShadowMap (three r186 removed the soft one and substitutes this, with a warning).
import * as THREE from './three/three.module.min.js';

const spring = (value = 0) => ({ value, target: value, velocity: 0 });
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const finite = (value, fallback) => (Number.isFinite(value) ? value : fallback);
function advance(s, dt, duration, instant) {
  if (instant || duration <= 0) {
    s.value = s.target;
    s.velocity = 0;
    return false;
  }
  const omega = 8 / Math.max(0.06, duration);
  const offset = s.value - s.target;
  const term = s.velocity + omega * offset;
  const decay = Math.exp(-omega * dt);
  s.value = s.target + (offset + term * dt) * decay;
  s.velocity = (s.velocity - omega * term * dt) * decay;
  if (Math.abs(s.value - s.target) < 0.0001 && Math.abs(s.velocity) < 0.001) {
    s.value = s.target;
    s.velocity = 0;
    return false;
  }
  return true;
}
function randomSource(seed) {
  let value = seed | 0;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let n = Math.imul(value ^ (value >>> 15), 1 | value);
    n = (n + Math.imul(n ^ (n >>> 7), 61 | n)) ^ n;
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}
function createPaperPath(rest, triangles, shortSide, density, sharpness, depth, seed) {
  const count = rest.length / 3;
  const points = Float64Array.from(rest);
  const previous = Float64Array.from(rest);
  const before = Float64Array.from(rest);
  const edges = [];
  const hinges = [];
  const adjacency = new Map();
  const random = randomSource(seed);
  const guides = Array.from({ length: density }, () => {
    const angle = random() * Math.PI * 2;
    return { x: Math.cos(angle), y: Math.sin(angle), phase: random() * Math.PI * 2, weight: random() * 0.6 + 0.4 };
  });
  for (let t = 0; t < triangles.length; t += 3) {
    for (let k = 0; k < 3; k++) {
      const a = triangles[t + k],
        b = triangles[t + ((k + 1) % 3)],
        opposite = triangles[t + ((k + 2) % 3)];
      const key = Math.min(a, b) * count + Math.max(a, b);
      const other = adjacency.get(key);
      if (!other) {
        adjacency.set(key, { a, b, opposite });
        const length = Math.hypot(rest[a * 3] - rest[b * 3], rest[a * 3 + 1] - rest[b * 3 + 1]);
        edges.push(a * 3, b * 3, length);
      } else {
        const c = other.opposite * 3,
          d = opposite * 3;
        const length = Math.hypot(rest[c] - rest[d], rest[c + 1] - rest[d + 1]);
        const mx = (rest[c] + rest[d]) * 0.5,
          my = (rest[c + 1] + rest[d + 1]) * 0.5;
        let weakness = 0;
        for (const guide of guides) {
          const distance = Math.abs(Math.sin(((mx * guide.x + my * guide.y) / shortSide) * 4 + guide.phase));
          weakness = Math.max(weakness, Math.exp(-distance * distance * 80) * guide.weight);
        }
        hinges.push(c, d, length, 0.12 + (1 - weakness) * 0.75);
      }
    }
  }
  const spacing = Math.sqrt((shortSide * shortSide) / count);
  const thickness = shortSide * 0.008;
  const samples = [rest.slice()];
  const frameCount = 64;
  const stepsPerFrame = 3;
  const totalSteps = frameCount * stepsPerFrame;
  let initialRadius = 0;
  for (let i = 0; i < rest.length; i += 3)
    initialRadius = Math.max(initialRadius, Math.hypot(rest[i] / 0.94, rest[i + 1] / 1.02));
  initialRadius *= 1.02;
  function constrain(list, stride, stiffness, reverse) {
    for (let n = 0; n < list.length; n += stride) {
      const edge = reverse ? list.length - stride - n : n;
      const a = list[edge],
        b = list[edge + 1];
      const dx = points[b] - points[a],
        dy = points[b + 1] - points[a + 1],
        dz = points[b + 2] - points[a + 2];
      const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (length < 0.000001) continue;
      const weight = stride === 4 ? list[edge + 3] : 1;
      const amount = (1 - list[edge + 2] / length) * 0.5 * stiffness * weight;
      points[a] += dx * amount;
      points[b] -= dx * amount;
      points[a + 1] += dy * amount;
      points[b + 1] -= dy * amount;
      points[a + 2] += dz * amount;
      points[b + 2] -= dz * amount;
    }
  }
  function separateLayers() {
    const margin = thickness * 2;
    for (let t = 0; t < triangles.length; t += 3) {
      const a = triangles[t] * 3,
        b = triangles[t + 1] * 3,
        c = triangles[t + 2] * 3;
      const ax = points[a],
        ay = points[a + 1],
        az = points[a + 2];
      const bx = points[b] - ax,
        by = points[b + 1] - ay,
        bz = points[b + 2] - az;
      const cx = points[c] - ax,
        cy = points[c + 1] - ay,
        cz = points[c + 2] - az;
      let nx = by * cz - bz * cy,
        ny = bz * cx - bx * cz,
        nz = bx * cy - by * cx;
      const length = Math.hypot(nx, ny, nz);
      if (length < 0.0000001) continue;
      nx /= length;
      ny /= length;
      nz /= length;
      const minX = Math.min(ax, points[b], points[c]) - margin;
      const maxX = Math.max(ax, points[b], points[c]) + margin;
      const minY = Math.min(ay, points[b + 1], points[c + 1]) - margin;
      const maxY = Math.max(ay, points[b + 1], points[c + 1]) + margin;
      const minZ = Math.min(az, points[b + 2], points[c + 2]) - margin;
      const maxZ = Math.max(az, points[b + 2], points[c + 2]) + margin;
      const bb = bx * bx + by * by + bz * bz,
        cc = cx * cx + cy * cy + cz * cz;
      const bc = bx * cx + by * cy + bz * cz;
      const determinant = bb * cc - bc * bc;
      if (determinant < 0.0000000001) continue;
      for (let p = 0; p < points.length; p += 3) {
        if (p === a || p === b || p === c) continue;
        if (
          points[p] < minX ||
          points[p] > maxX ||
          points[p + 1] < minY ||
          points[p + 1] > maxY ||
          points[p + 2] < minZ ||
          points[p + 2] > maxZ
        )
          continue;
        const rx = rest[p] - (rest[a] + rest[b] + rest[c]) / 3;
        const ry = rest[p + 1] - (rest[a + 1] + rest[b + 1] + rest[c + 1]) / 3;
        if (rx * rx + ry * ry < spacing * spacing * 6) continue;
        const dx = points[p] - ax,
          dy = points[p + 1] - ay,
          dz = points[p + 2] - az;
        const distance = dx * nx + dy * ny + dz * nz;
        const previousDistance =
          (before[p] - before[a]) * nx + (before[p + 1] - before[a + 1]) * ny + (before[p + 2] - before[a + 2]) * nz;
        const side = previousDistance >= 0 ? 1 : -1;
        if (distance * side >= thickness || Math.abs(distance) > margin) continue;
        const pb = dx * bx + dy * by + dz * bz,
          pc = dx * cx + dy * cy + dz * cz;
        const u = (cc * pb - bc * pc) / determinant;
        const v = (bb * pc - bc * pb) / determinant;
        if (u < 0 || v < 0 || u + v > 1) continue;
        const w = 1 - u - v;
        const correction = (thickness * side - distance) / (1 + w * w + u * u + v * v);
        for (let axis = 0; axis < 3; axis++) {
          const normal = axis === 0 ? nx : axis === 1 ? ny : nz;
          const movement = normal * correction;
          points[p + axis] += movement;
          points[a + axis] -= movement * w;
          points[b + axis] -= movement * u;
          points[c + axis] -= movement * v;
        }
      }
    }
  }
  for (let step = 1; step <= totalSteps; step++) {
    const progress = step / totalSteps;
    const compression = progress * progress * (3 - 2 * progress);
    const radius = initialRadius * (1 - compression) + shortSide * (0.19 - depth * 0.025) * compression;
    before.set(points);
    for (let i = 0; i < points.length; i += 3) {
      const x = rest[i] / shortSide,
        y = rest[i + 1] / shortSide;
      let buckle = 0;
      for (const guide of guides) buckle += Math.sin((x * guide.x + y * guide.y) * 5 + guide.phase) * guide.weight;
      for (let axis = 0; axis < 3; axis++) {
        const velocity = (points[i + axis] - previous[i + axis]) * 0.55;
        previous[i + axis] = points[i + axis];
        points[i + axis] += clamp(velocity, -spacing * 0.15, spacing * 0.15);
      }
      points[i + 2] += (buckle / density) * shortSide * 0.0007 * Math.sin(progress * Math.PI);
    }
    for (let pass = 0; pass < 18; pass++) {
      constrain(hinges, 4, 0.45 * (1 - sharpness * 0.4), pass % 2 === 0);
      for (let i = 0; i < points.length; i += 3) {
        const x = points[i] / 0.94,
          y = points[i + 1] / 1.02,
          z = points[i + 2] / 0.86;
        const distance = Math.hypot(x, y, z);
        if (distance > radius) {
          const push = (1 - radius / distance) * 0.55;
          points[i] -= points[i] * push;
          points[i + 1] -= points[i + 1] * push;
          points[i + 2] -= points[i + 2] * push;
        }
      }
      constrain(edges, 3, 1, pass % 2 !== 0);
      if (pass === 8 || pass === 17) separateLayers();
    }
    for (let h = 0; h < hinges.length; h += 4) {
      const a = hinges[h],
        b = hinges[h + 1];
      const length = Math.hypot(points[a] - points[b], points[a + 1] - points[b + 1], points[a + 2] - points[b + 2]);
      if (length < hinges[h + 2] * 0.86) hinges[h + 2] += (length - hinges[h + 2]) * 0.12;
    }
    if (step % stepsPerFrame === 0) samples.push(Float32Array.from(points));
  }
  const folded = Float64Array.from(points);
  for (let step = 1; step <= 80; step++) {
    const t = step / 80;
    const unfold = t * t * (3 - 2 * t);
    for (let pass = 0; pass < 12; pass++) {
      for (let i = 0; i < points.length; i++) {
        const target = folded[i] + (rest[i] - folded[i]) * unfold;
        points[i] += (target - points[i]) * (i % 3 === 2 ? 0.04 : 0.22);
      }
      constrain(hinges, 4, 0.7, pass % 2 === 0);
      constrain(edges, 3, 1, pass % 2 !== 0);
    }
  }
  const creased = Float32Array.from(points);
  return { samples, creased };
}

// ---------------------------------------------------------------------------------------------------------------------
// Everything above this line is the original, character for character. Below: the original component's sheet (mesh,
// materials, deform, lights, camera) re-used for several sheets at once and driven by the page, plus our digital trash can.
// ---------------------------------------------------------------------------------------------------------------------

const easeOutCubic = t => 1 - (1 - t) ** 3;
const easeInCubic = t => t * t * t;
const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOutBack = (t, s = 1.1) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2;

// the original createPaperPath, run in a worker made from the very same functions (0.3-0.6 s of math off the main thread)
function crumplePath(original, indices, shortSide, foldTotal, sharpness, depth, seed) {
  const args = [original, indices, shortSide, foldTotal, sharpness, depth, seed];
  const inline = () =>
    new Promise(resolve =>
      (window.requestIdleCallback || (f => setTimeout(f, 60)))(() => resolve(createPaperPath(...args)), { timeout: 1500 })
    );
  let worker;
  try {
    const source =
      'const clamp = ' + clamp.toString() + ';\n' + randomSource.toString() + '\n' + createPaperPath.toString() +
      '\nonmessage = e => { const r = createPaperPath(...e.data); postMessage(r, [...r.samples.map(x => x.buffer), r.creased.buffer]); };';
    const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    worker = new Worker(url);
    URL.revokeObjectURL(url);
  } catch {
    return inline();
  }
  return new Promise(resolve => {
    worker.onmessage = e => (worker.terminate(), resolve(e.data));
    worker.onerror = e => (e.preventDefault(), worker.terminate(), inline().then(resolve));
    worker.postMessage([Float32Array.from(original), indices, shortSide, foldTotal, sharpness, depth, seed]);
  });
}

// the sheet's mesh data, built exactly as the original builds it (one model serves every sheet of the same shape)
function paperModel(o) {
  const aspect = o.aspect;
  const shortSide = Math.min(1, aspect);
  const resolution = Math.round(clamp(finite(o.detail, 64) / 4, 8, 24));
  const columns = Math.max(8, Math.round(resolution / Math.max(1, aspect)));
  const rows = Math.max(8, Math.round(resolution * Math.min(1, aspect)));
  const rng = randomSource(finite(o.seed, 7));
  const sharpness = clamp(finite(o.foldSharpness, 0.6), 0, 1);
  const foldTotal = Math.round(clamp(finite(o.foldCount, 6), 3, 16));
  const depth = clamp(finite(o.wrinkleDepth, 0.65), 0, 2);
  const count = (columns + 1) * (rows + 1);
  const original = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);
  const indices = [];
  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col <= columns; col++) {
      const index = row * (columns + 1) + col;
      const u = (col + (col > 0 && col < columns ? (rng() - 0.5) * 0.5 : 0)) / columns;
      const v = (row + (row > 0 && row < rows ? (rng() - 0.5) * 0.5 : 0)) / rows;
      const x = u - 0.5,
        y = (v - 0.5) * aspect;
      original[index * 3] = x;
      original[index * 3 + 1] = y;
      uvs[index * 2] = u;
      uvs[index * 2 + 1] = v;
      if (col < columns && row < rows) {
        const a = index,
          b = index + 1,
          c = index + columns + 1,
          d = c + 1;
        if (rng() > 0.5) indices.push(a, b, d, a, d, c);
        else indices.push(a, b, c, b, d, c);
      }
    }
  }
  const ready = crumplePath(original, indices, shortSide, foldTotal, sharpness, depth, finite(o.seed, 7));
  const renderUvs = new Float32Array(indices.length * 2);
  const incidentFaces = Array.from({ length: count }, () => []);
  for (let i = 0; i < indices.length; i++) {
    renderUvs[i * 2] = uvs[indices[i] * 2];
    renderUvs[i * 2 + 1] = uvs[indices[i] * 2 + 1];
    incidentFaces[indices[i]].push(Math.floor(i / 3) * 3);
  }
  const grainData = new Uint8Array(128 * 128 * 4);   // the original's grain, from the same random stream
  for (let i = 0; i < grainData.length; i += 4) {
    const value = 100 + Math.floor(rng() * 155);
    grainData[i] = grainData[i + 1] = grainData[i + 2] = value;
    grainData[i + 3] = 255;
  }
  const model = { aspect, shortSide, sharpness, count, original, indices, path: null, renderUvs, incidentFaces, grainData };
  model.ready = ready.then(path => (model.path = path));
  return model;
}

// our trash can, "more digital" (Hayden 10/30: "rather than such a realistic one"): the tunnel's own grid wrapped round a
// can, glowing ribs and rings in the room's blue over a faint glass shell that glows at its edges. A paper that lands is
// deleted with a flash; one that comes out lights up in the can first. 1 unit tall, standing on y = 0.
const CAN = { top: 0.43, bottom: 0.35, floor: 0.02 };
function buildCan(o) {
  const radiusAt = y => CAN.bottom + (CAN.top - CAN.bottom) * y;
  const glassColor = new THREE.Color(o.canColor);
  const lineColor = new THREE.Color(o.canGlow);
  const pivot = new THREE.Group();
  const holder = new THREE.Group();
  pivot.add(holder);
  const disposables = [];
  const keep = x => (disposables.push(x), x);
  const profile = [];
  for (let k = 0; k <= 20; k++) {
    const y = k / 20;
    profile.push(new THREE.Vector2(radiusAt(y), y));
  }
  const uniforms = { uColor: { value: glassColor }, uFlash: { value: 0 } };
  const glass = new THREE.Mesh(
    keep(new THREE.LatheGeometry(profile, 72)),
    keep(
      new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        vertexShader: [
          'varying vec3 vN; varying vec3 vV; varying float vY;',
          'void main() {',
          '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
          '  vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vY = position.y;',
          '  gl_Position = projectionMatrix * mv;',
          '}'
        ].join('\n'),
        fragmentShader: [
          'uniform vec3 uColor; uniform float uFlash; varying vec3 vN; varying vec3 vV; varying float vY;',
          'void main() {',
          '  float edge = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.4);',
          '  float a = (0.03 + 0.5 * edge) * (0.55 + 0.45 * vY) + uFlash * (0.1 + 0.4 * edge);',
          '  gl_FragColor = vec4(uColor, clamp(a, 0.0, 1.0));',
          '  #include <colorspace_fragment>',
          '}'
        ].join('\n')
      })
    )
  );
  glass.renderOrder = 2;
  const ribs = 28,
    rings = [0.2, 0.4, 0.6, 0.8];
  const points = [];
  for (let i = 0; i < ribs; i++) {
    const a = (i / ribs) * Math.PI * 2,
      s = Math.sin(a),
      c = Math.cos(a);
    points.push(radiusAt(0) * s, 0, radiusAt(0) * c, radiusAt(1) * s, 1, radiusAt(1) * c);
  }
  for (const y of rings) {
    const r = radiusAt(y);
    for (let i = 0; i < 72; i++) {
      const a0 = (i / 72) * Math.PI * 2,
        a1 = ((i + 1) / 72) * Math.PI * 2;
      points.push(r * Math.sin(a0), y, r * Math.cos(a0), r * Math.sin(a1), y, r * Math.cos(a1));
    }
  }
  const gridGeometry = keep(new THREE.BufferGeometry());
  gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  const gridMaterial = keep(
    new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  const grid = new THREE.LineSegments(gridGeometry, gridMaterial);
  grid.renderOrder = 3;
  const band = (r, y, tube, opacity) => {   // the mouth and the foot: crisp glowing bands
    const geometry = keep(new THREE.TorusGeometry(r, tube, 8, 120));
    geometry.rotateX(Math.PI / 2);
    geometry.translate(0, y, 0);
    const material = keep(
      new THREE.MeshBasicMaterial({ color: lineColor, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = 4;
    return mesh;
  };
  const mouth = band(CAN.top, 1, 0.007, 0.95);
  const foot = band(CAN.bottom, 0, 0.005, 0.6);
  const floorGeometry = keep(new THREE.CircleGeometry(CAN.bottom, 64));
  floorGeometry.rotateX(-Math.PI / 2);
  floorGeometry.translate(0, CAN.floor, 0);
  const floorMaterial = keep(
    new THREE.MeshBasicMaterial({
      color: glassColor,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.renderOrder = 1;
  holder.add(floor, glass, grid, mouth, foot);
  let size = 1;
  return {
    pivot,
    size(h) {
      size = h;
      holder.scale.setScalar(h);
    },
    set(level) {   // 0 = its resting glow, 1 = the flash when a paper goes in or comes out
      uniforms.uFlash.value = level;
      gridMaterial.opacity = 0.38 + 0.45 * level;
      floorMaterial.opacity = 0.1 + 0.45 * level;
      foot.material.opacity = 0.6 + 0.4 * level;
      holder.scale.setScalar(size * (1 + 0.018 * level));
    },
    dispose: () => disposables.forEach(x => x.dispose())
  };
}

// createPaperToss(host, options) → { show(key, image), hide(key), hideAll(instant), state(key), pause(), resume(), refresh(),
//   ready (promise), destroy() }
// host: a positioned box; the canvas fills it. options.layout(width, height) returns, in that box's px from its top-left:
//   { paper: { width, x, y, rotation (deg) }, can: { x, bottom, height } }
// image: a canvas or image with the paper's aspect (height / width = options.aspect), drawn edge to edge.
// Two papers never cross (Hayden 10/30: "the paper ball is going through the sheet"): a paper waits in the can until every
// other paper in the air has gone in.
export function createPaperToss(host, options = {}) {
  const o = {
    aspect: 11 / 8.5,
    detail: 64,
    seed: 7,
    foldCount: 6,
    foldSharpness: 0.6,
    wrinkleDepth: 0.65,
    creaseStrength: 0.18,
    paperColor: '#f4f0e8',
    roughness: 0.92,
    paperTexture: 0.08,
    lightIntensity: 1.8,
    lightAngle: -35,
    shadow: true,
    crumpleAmount: 1,
    crumpleDuration: 0.55,
    openDuration: 0.6,
    popDuration: 0.78,
    tossDuration: 0.62,
    appearDuration: 0.22,
    vanishDuration: 0.2,
    canColor: '#0687FF',
    canGlow: '#5CB2FF',
    layout: (w, h) => ({ paper: { width: w * 0.72, x: w * 0.55, y: h * 0.4, rotation: -2.5 }, can: { x: w * 0.24, bottom: h - 2, height: h * 0.28 } }),
    onState: null,
    ...options
  };
  const canvas = document.createElement('canvas');
  canvas.className = 'paper-toss-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none';
  host.append(canvas);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch (error) {
    canvas.remove();
    throw error instanceof Error ? error : new Error('WebGL is unavailable.');
  }
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = o.shadow;
  renderer.shadowMap.type = THREE.PCFShadowMap;   // the original asks for PCFSoftShadowMap; r186 removed it and uses this (with radius) instead

  const model = paperModel(o);
  const grain = new THREE.DataTexture(model.grainData, 128, 128);
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.repeat.set(5, 5 * model.aspect);
  grain.magFilter = THREE.LinearFilter;
  grain.minFilter = THREE.LinearFilter;
  grain.needsUpdate = true;
  const depthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, alphaTest: 0.04, side: THREE.DoubleSide });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 10000);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xa4a0b0, 1.35));
  const light = new THREE.DirectionalLight(0xfffaf0, Math.max(0, finite(o.lightIntensity, 1.8)));
  light.castShadow = o.shadow;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.bias = -0.0002;
  light.shadow.normalBias = 0.6;
  light.shadow.radius = 3;
  scene.add(light, light.target);
  const can = buildCan(o);
  scene.add(can.pivot);

  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduceMotion = media.matches;
  const sheets = new Map();
  let width = 1,
    height = 1,
    focal = 1,
    L = null;
  let frame = 0,
    lastTime = 0,
    paused = false,
    disposed = false,
    contextLost = false;
  let pendingShow = null;
  const glow = { t: 1, amp: 0 };
  const pulse = amp => {
    const now = glow.amp > 0 ? glow.amp * Math.exp(-glow.t * 7) : 0;
    glow.amp = Math.max(now, amp);
    glow.t = 0;
  };
  const v = new THREE.Vector3(),
    q = new THREE.Quaternion(),
    qSpin = new THREE.Quaternion();

  // the page's layout, in world units (1 = 1 px at z = 0, y up, origin in the middle of the box)
  function place() {
    const box = o.layout(width, height);
    const paperWidth = Math.max(40, box.paper.width);
    const canHeight = Math.max(30, box.can.height);
    const ball = paperWidth * 0.17;   // a full crumple's radius (the path squeezes into ~0.17 of the sheet's width)
    const canX = box.can.x - width / 2,
      canFoot = height / 2 - box.can.bottom;
    const dz = canHeight * CAN.top + ball * 0.6 + 24;   // the open sheet hangs in front of the can, never through it
    const k = (focal - dz) / focal;   // so it still lands where the page asked, at the size it asked for
    L = {
      paperWidth,
      ball,
      scale: paperWidth * k,
      display: new THREE.Vector3((box.paper.x - width / 2) * k, (height / 2 - box.paper.y) * k, dz),
      rest: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, THREE.MathUtils.degToRad(finite(box.paper.rotation, -2.5)))),
      inside: new THREE.Vector3(canX, canFoot + canHeight * CAN.floor + ball * 0.92, 0),
      rimY: canFoot + canHeight,
      canX,
      opening: canHeight * CAN.top * 0.96
    };
    can.pivot.position.set(canX, canFoot, 0);
    can.size(canHeight);
    for (const s of sheets.values()) {
      applyScale(s);
      if (s.state === 'open' && !s.flight) s.group.position.copy(L.display), s.group.quaternion.copy(L.rest);
      if (s.state === 'in' || s.pendingPop) s.group.position.copy(L.inside);
    }
  }
  function resize() {
    width = Math.max(1, host.offsetWidth || 1);
    height = Math.max(1, host.offsetHeight || 1);
    camera.aspect = width / height;
    focal = height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    camera.position.z = focal;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    const reach = Math.max(width, height);
    const angle = THREE.MathUtils.degToRad(finite(o.lightAngle, -35));
    light.position.set(Math.sin(angle) * reach, Math.cos(angle) * reach, reach * 4);
    light.shadow.camera.left = light.shadow.camera.bottom = -reach;
    light.shadow.camera.right = light.shadow.camera.top = reach;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = reach * 6;
    light.shadow.camera.updateProjectionMatrix();
    place();
    wake();
  }

  // one sheet per key, built like the original's sheet
  function makeSheet(key) {
    const { indices, count } = model;
    const positions = new Float32Array(count * 3);
    const renderPositions = new Float32Array(indices.length * 3);
    const renderNormals = new Float32Array(indices.length * 3);
    const faceNormals = new Float32Array(indices.length);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(renderPositions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('normal', new THREE.BufferAttribute(renderNormals, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('uv', new THREE.BufferAttribute(model.renderUvs, 2));
    const materialOptions = {
      roughness: clamp(finite(o.roughness, 0.92), 0, 1),
      metalness: 0,
      bumpMap: grain,
      bumpScale: clamp(finite(o.paperTexture, 0.08), 0, 1) * 0.32,
      alphaTest: 0.04,
      alphaToCoverage: true,
      flatShading: false
    };
    const frontMaterial = new THREE.MeshStandardMaterial({ ...materialOptions, side: THREE.FrontSide });
    const backMaterial = new THREE.MeshStandardMaterial({ ...materialOptions, side: THREE.BackSide, color: o.paperColor });
    const lighting = { value: 0 };
    for (const material of [frontMaterial, backMaterial]) {
      material.onBeforeCompile = shader => {
        shader.uniforms.paperLighting = lighting;
        shader.fragmentShader = 'uniform float paperLighting;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <map_fragment>',
          `
          #include <map_fragment>
          #ifdef USE_MAP
            if (vMapUv.x < 0.0 || vMapUv.x > 1.0 || vMapUv.y < 0.0 || vMapUv.y > 1.0) discard;
            ${material === backMaterial ? 'diffuseColor.rgb = diffuse;' : ''}
          #endif
        `
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <opaque_fragment>',
          `
          outgoingLight = mix(diffuseColor.rgb, outgoingLight, paperLighting);
          #include <opaque_fragment>
        `
        );
      };
      material.customProgramCacheKey = () => `paper-${material === backMaterial ? 'stock' : 'print'}`;
    }
    const front = new THREE.Mesh(geometry, frontMaterial);
    const back = new THREE.Mesh(geometry, backMaterial);
    front.castShadow = o.shadow;
    front.receiveShadow = o.shadow;
    back.receiveShadow = o.shadow;
    front.customDepthMaterial = depthMaterial;
    const group = new THREE.Group();
    group.add(front, back);
    group.visible = false;
    scene.add(group);
    const n = sheets.size;   // each ball tumbles its own way
    const axis = new THREE.Vector3(Math.sin(n * 2.1 + 0.7), Math.cos(n * 1.7 + 0.3), 0.45 * Math.sin(n * 3.3)).normalize();
    const s = {
      key, group, geometry, frontMaterial, backMaterial, lighting, positions, renderPositions, renderNormals, faceNormals,
      texture: null, image: null, state: 'in', amount: spring(1), memory: spring(0), dur: o.crumpleDuration,
      clock: 0, flight: null, openAt: null, launchAt: null, wait: 0, pendingPop: false, fx: null, grow: 1,
      axis, spin: Math.PI * (1.4 + (n % 3) * 0.25), previousAmount: -1, previousMemory: -1
    };
    sheets.set(key, s);
    if (L) applyScale(s), group.position.copy(L.inside);
    return s;
  }
  function applyScale(s) {
    s.group.scale.setScalar(L.scale * Math.max(0.001, s.grow));
  }
  function setImage(s, image) {
    if (!image || s.image === image) return;
    if (s.texture) s.texture.dispose();
    const texture = image instanceof HTMLCanvasElement ? new THREE.CanvasTexture(image) : new THREE.Texture(image);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    texture.needsUpdate = true;
    s.texture = texture;
    s.image = image;
    s.frontMaterial.map = s.backMaterial.map = texture;
    s.frontMaterial.needsUpdate = s.backMaterial.needsUpdate = true;
  }
  function deform(s) {   // the original's deform(), per sheet
    const { amount, memory } = s;
    if (!model.path) return;
    if (amount.value === s.previousAmount && memory.value === s.previousMemory) return;
    s.previousAmount = amount.value;
    s.previousMemory = memory.value;
    const { path, original, indices, incidentFaces, sharpness } = model;
    const { positions, faceNormals, renderPositions, renderNormals } = s;
    const fold = clamp(amount.value, 0, 1);
    const frame = fold * (path.samples.length - 1);
    const lower = Math.floor(frame);
    const upper = Math.min(lower + 1, path.samples.length - 1);
    const mix = frame - lower;
    const from = path.samples[lower];
    const to = path.samples[upper];
    for (let i = 0; i < positions.length; i++) {
      positions[i] = from[i] + (to[i] - from[i]) * mix;
      positions[i] += (path.creased[i] - original[i]) * memory.value * (1 - fold);
    }
    for (let face = 0; face < indices.length; face += 3) {
      const a = indices[face] * 3,
        b = indices[face + 1] * 3,
        c = indices[face + 2] * 3;
      const bx = positions[b] - positions[a],
        by = positions[b + 1] - positions[a + 1],
        bz = positions[b + 2] - positions[a + 2];
      const cx = positions[c] - positions[a],
        cy = positions[c + 1] - positions[a + 1],
        cz = positions[c + 2] - positions[a + 2];
      const nx = by * cz - bz * cy,
        ny = bz * cx - bx * cz,
        nz = bx * cy - by * cx;
      const length = Math.hypot(nx, ny, nz) || 1;
      faceNormals[face] = nx / length;
      faceNormals[face + 1] = ny / length;
      faceNormals[face + 2] = nz / length;
    }
    for (let i = 0; i < indices.length; i++) {
      const source = indices[i] * 3;
      const face = Math.floor(i / 3) * 3;
      let nx = 0,
        ny = 0,
        nz = 0;
      for (const neighbor of incidentFaces[indices[i]]) {
        const dot =
          faceNormals[face] * faceNormals[neighbor] +
          faceNormals[face + 1] * faceNormals[neighbor + 1] +
          faceNormals[face + 2] * faceNormals[neighbor + 2];
        const weight = THREE.MathUtils.smoothstep(dot, 0.88 - (1 - sharpness) * 0.18, 0.98);
        nx += faceNormals[neighbor] * weight;
        ny += faceNormals[neighbor + 1] * weight;
        nz += faceNormals[neighbor + 2] * weight;
      }
      const length = Math.hypot(nx, ny, nz) || 1;
      renderPositions[i * 3] = positions[source];
      renderPositions[i * 3 + 1] = positions[source + 1];
      renderPositions[i * 3 + 2] = positions[source + 2];
      renderNormals[i * 3] = nx / length;
      renderNormals[i * 3 + 1] = ny / length;
      renderNormals[i * 3 + 2] = nz / length;
    }
    s.geometry.attributes.position.needsUpdate = true;
    s.geometry.attributes.normal.needsUpdate = true;
    s.geometry.computeBoundingSphere();
    s.lighting.value = THREE.MathUtils.smoothstep(fold + memory.value, 0, 0.4);
  }

  const insideCan = p => p.y < L.rimY + L.ball * 0.9 && Math.abs(p.x - L.canX) < L.opening + L.ball;
  function airTime(except) {   // how long until every other paper on its way in has gone into the can
    let longest = 0;
    for (const s of sheets.values()) {
      if (s === except || s.state !== 'away') continue;
      let left = 0;
      if (s.launchAt !== null) left = Math.max(0, s.launchAt - s.clock) + o.tossDuration + o.vanishDuration;
      else if (s.flight) left = (1 - s.flight.t) * s.flight.dur + o.vanishDuration;
      else if (s.fx) left = (1 - s.fx.t) * s.fx.dur;
      longest = Math.max(longest, left);
    }
    return longest ? longest + 0.05 : 0;
  }
  function pop(s) {   // out of the can (or from wherever it is), up, and open on the display spot
    const from = s.group.position.clone();
    let hold = 0;   // stay over the can until the ball clears the rim, so it never passes through the can's side
    if (insideCan(from)) {
      const need = (L.rimY + L.ball * 1.05 - from.y) / Math.max(1, L.display.y - from.y);
      while (hold < 0.6 && easeOutBack(hold) < need) hold += 0.01;
    }
    s.flight = { kind: 'pop', from, fromQ: s.group.quaternion.clone(), t: 0, dur: o.popDuration * (hold ? 1 : 0.8), hold };
    s.openAt = (hold ? hold + (1 - hold) * 0.35 : 0.06) * s.flight.dur;   // it opens once it is on its way across, not over the can
    s.launchAt = null;
  }
  function toss(s) {   // from where it is, a throw that drops through the middle of the can's mouth
    const from = s.group.position.clone();
    const to = L.inside.clone();
    let lift = 0;
    if (!insideCan(from)) {
      const cross = 0.86;   // where it passes the rim, as a share of the throw
      const rim = L.rimY + L.ball * 0.4;
      lift = (rim - from.y - (to.y - from.y) * cross) / (4 * cross * (1 - cross));
      lift = clamp(lift, L.ball * 0.6, L.paperWidth * 1.2);
    }
    s.flight = { kind: 'toss', from, to, fromQ: s.group.quaternion.clone(), t: 0, dur: o.tossDuration * (lift ? 1 : 0.5), lift };
  }
  function pose(s, f) {
    const t = f.t;
    if (f.kind === 'pop') {
      const lateral = f.hold ? easeInOutCubic(clamp((t - f.hold) / (1 - f.hold), 0, 1)) : easeOutCubic(t);
      const rise = easeOutBack(t);
      v.set(
        f.from.x + (L.display.x - f.from.x) * lateral,
        f.from.y + (L.display.y - f.from.y) * rise,
        f.from.z + (L.display.z - f.from.z) * lateral
      );
      qSpin.setFromAxisAngle(s.axis, s.spin * (1 - easeOutCubic(t)));
      q.copy(qSpin).multiply(L.rest);
      s.group.quaternion.copy(f.fromQ).slerp(q, easeOutCubic(t));
    } else {
      v.set(
        f.from.x + (f.to.x - f.from.x) * t,
        f.from.y + (f.to.y - f.from.y) * t + 4 * f.lift * t * (1 - t),
        f.from.z + (f.to.z - f.from.z) * t
      );
      qSpin.setFromAxisAngle(s.axis, s.spin * t);
      s.group.quaternion.copy(qSpin).multiply(f.fromQ);
    }
    s.group.position.copy(v);
  }
  function step(s, dt) {
    if (s.state === 'in') return false;
    const instant = reduceMotion;
    if (s.pendingPop) {   // waiting in the can for the air to clear; then it lights up and rises
      if (s.wait > 0 && !instant) {
        s.wait -= dt;
        return true;
      }
      if (!s.fx) {
        s.fx = { kind: 'appear', t: 0, dur: o.appearDuration };
        s.group.visible = true;
        pulse(0.8);
      }
    }
    let moving = advance(s.amount, dt, s.dur, instant);
    moving = advance(s.memory, dt, s.dur, instant) || moving;
    if (s.fx) {
      const fx = s.fx;
      fx.t = instant ? 1 : Math.min(1, fx.t + dt / fx.dur);
      s.grow = fx.kind === 'appear' ? easeOutBack(fx.t, 1.6) : 1 - easeInCubic(fx.t);
      if (fx.t >= 1) {
        s.fx = null;
        s.grow = 1;
        if (fx.kind === 'appear') {
          s.pendingPop = false;
          s.clock = 0;
          pop(s);
        } else {   // deleted: back to sleep in the can
          s.state = 'in';
          s.group.visible = false;
          applyScale(s);
          o.onState && o.onState(s.key, 'in');
          return false;
        }
      }
      applyScale(s);
      moving = true;
    }
    if (!s.pendingPop) s.clock += dt;
    if (s.openAt !== null && s.clock >= s.openAt) {   // clear of the can: it opens, keeping the creases it has from before
      s.openAt = null;
      s.dur = o.openDuration;
      s.amount.target = 0;
      s.memory.target = Math.max(s.memory.value, clamp(finite(o.creaseStrength, 0.18), 0, 1));
      moving = true;
    }
    if (s.launchAt !== null && s.clock >= s.launchAt) {   // balled up: throw it
      s.launchAt = null;
      toss(s);
    }
    const f = s.flight;
    if (f) {
      f.t = instant ? 1 : Math.min(1, f.t + dt / f.dur);
      pose(s, f);
      if (f.t >= 1) {
        s.flight = null;
        if (f.kind === 'toss') {   // in the can: deleted with a flash
          s.fx = { kind: 'vanish', t: 0, dur: o.vanishDuration };
          pulse(1);
        } else {
          s.state = 'open';
          s.group.position.copy(L.display);
          o.onState && o.onState(s.key, 'open');
        }
      }
      moving = true;
    }
    deform(s);
    return moving || s.openAt !== null || s.launchAt !== null || !!s.fx || s.pendingPop;
  }
  function stepCan(dt) {
    if (glow.amp <= 0) return false;
    glow.t += dt;
    const level = glow.amp * Math.exp(-glow.t * 7);
    can.set(level);
    if (level < 0.01) {
      glow.amp = 0;
      can.set(0);
      return false;
    }
    return true;
  }
  function render(time) {
    frame = 0;
    if (disposed || paused || contextLost || document.hidden) return;
    const dt = lastTime ? Math.min(0.04, (time - lastTime) / 1000) : 1 / 60;
    lastTime = time;
    let moving = false;
    for (const s of sheets.values()) moving = step(s, dt) || moving;
    moving = stepCan(dt) || moving;
    renderer.render(scene, camera);
    if (moving) wake();
    else lastTime = 0;
  }
  function wake() {
    if (!frame && !disposed && !paused && !contextLost && !document.hidden) frame = requestAnimationFrame(render);
  }
  function sleep(s) {
    s.state = 'in';
    s.flight = s.fx = null;
    s.openAt = s.launchAt = null;
    s.pendingPop = false;
    s.wait = 0;
    s.grow = 1;
    s.group.visible = false;
    if (L) applyScale(s), s.group.position.copy(L.inside);
  }

  const api = {
    canvas,
    ready: model.ready,
    show(key, image) {
      if (!model.path) {   // the crumple is still being worked out (a few hundred ms after start): show it the moment it is
        pendingShow = { key, image };
        model.ready.then(() => {
          if (pendingShow && pendingShow.key === key && !disposed) {
            pendingShow = null;
            api.show(key, image);
          }
        });
        return;
      }
      pendingShow = null;
      const s = sheets.get(key) || makeSheet(key);
      setImage(s, image);
      if (s.state === 'out' || s.state === 'open') return;
      if (s.state === 'in') {   // balled up in the can
        s.group.position.copy(L.inside);
        s.group.quaternion.setFromAxisAngle(s.axis, s.spin).multiply(L.rest);
        s.amount.value = s.amount.target = clamp(finite(o.crumpleAmount, 1), 0, 1);
        s.amount.velocity = 0;
        s.previousAmount = -1;
        deform(s);
        s.grow = 0;
        applyScale(s);
        s.group.visible = false;
        s.wait = airTime(s);
        s.pendingPop = true;
        s.fx = s.flight = null;
        s.openAt = null;
      } else {   // it was on its way into the can: it turns round where it is
        s.pendingPop = false;
        s.fx = null;
        s.grow = 1;
        applyScale(s);
        s.clock = 0;
        pop(s);
      }
      s.state = 'out';
      s.dur = o.openDuration;
      s.launchAt = null;
      o.onState && o.onState(key, 'out');
      wake();
    },
    hide(key) {
      if (pendingShow && pendingShow.key === key) pendingShow = null;
      const s = sheets.get(key);
      if (!s || s.state === 'in' || s.state === 'away') return;
      if (s.pendingPop) {   // it never left the can
        sleep(s);
        o.onState && o.onState(key, 'in');
        return;
      }
      s.state = 'away';
      s.clock = 0;
      s.openAt = null;
      s.flight = s.fx = null;
      s.grow = 1;
      applyScale(s);
      s.dur = o.crumpleDuration;
      s.amount.target = clamp(finite(o.crumpleAmount, 1), 0, 1);
      s.launchAt = insideCan(s.group.position) ? 0 : o.crumpleDuration * 0.48;   // ball it up, then throw
      o.onState && o.onState(key, 'away');
      wake();
    },
    hideAll(instant = false) {
      pendingShow = null;
      for (const s of sheets.values()) {
        if (instant) {
          sleep(s);
          s.amount.value = s.amount.target = 1;
          s.memory.value = s.memory.target = Math.max(s.memory.value, o.creaseStrength);
        } else api.hide(s.key);
      }
      wake();
    },
    state: key => (sheets.get(key) || { state: 'in' }).state,
    pause() {
      paused = true;
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    },
    resume() {
      if (!paused) return;
      paused = false;
      wake();
    },
    refresh: resize,
    debugStep(seconds = 1 / 60) {   // tests: one frame by hand (a hidden tab runs no animation frames)
      for (const s of sheets.values()) step(s, seconds);
      stepCan(seconds);
      renderer.render(scene, camera);
    },
    destroy() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      media.removeEventListener('change', motionChange);
      for (const s of sheets.values()) {
        s.geometry.dispose();
        s.frontMaterial.dispose();
        s.backMaterial.dispose();
        if (s.texture) s.texture.dispose();
      }
      can.dispose();
      grain.dispose();
      depthMaterial.dispose();
      light.shadow.dispose();
      renderer.dispose();
      canvas.remove();
    }
  };
  function visibility() {
    lastTime = 0;
    if (!document.hidden) wake();
  }
  function motionChange() {
    reduceMotion = media.matches;
    wake();
  }
  canvas.addEventListener('webglcontextlost', e => {
    e.preventDefault();
    contextLost = true;
  });
  canvas.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    for (const s of sheets.values()) s.previousAmount = -1;
    wake();
  });
  document.addEventListener('visibilitychange', visibility);
  media.addEventListener('change', motionChange);
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  return api;
}
export default createPaperToss;
