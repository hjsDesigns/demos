// Before → after on a Circular Carousel card (Gage's results, Hayden 10/29). The carousel bends each card from strips,
// so an effect is drawn once into a hidden full-size card and copied slice by slice onto that card's strips.
// Two effects, both React Bits: Refine Frame (its downward sweep with the 28px soft edge, 14 bands, glint, 400 ms a step)
// cut to three pixel layers as Hayden asked (pixelated → mildly → nearly clear → the real photo), and Morph Slider
// (melt), slowed down ("doesn't need to feel like an instant switch").
import { createMorphSlider } from './morph-slider.js?v=20261029d';

const EDGE = 28, STRIPS = 14;
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
function cover(img, W, H) {   // Refine Frame's crop math
  const k = Math.max(W / img.naturalWidth, H / img.naturalHeight), sw = W / k, sh = H / k;
  return [(img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh];
}
function level(img, W, H, block) {   // one pixel level, made the way Refine Frame makes them
  const full = document.createElement('canvas'); full.width = W; full.height = H;
  const fc = full.getContext('2d'), [sx, sy, sw, sh] = cover(img, W, H);
  if (block <= 1) { fc.imageSmoothingEnabled = true; fc.imageSmoothingQuality = 'high'; fc.drawImage(img, sx, sy, sw, sh, 0, 0, W, H); return full; }
  const small = document.createElement('canvas'); small.width = Math.max(1, Math.round(W / block)); small.height = Math.max(1, Math.round(H / block));
  const sc = small.getContext('2d'); sc.imageSmoothingEnabled = true; sc.imageSmoothingQuality = 'high'; sc.drawImage(img, sx, sy, sw, sh, 0, 0, small.width, small.height);
  fc.imageSmoothingEnabled = false; fc.drawImage(small, 0, 0, W, H); return full;
}

// canvases laid over each front strip of one card; paint(src) copies the matching slice of a full-card canvas onto each
export function overlayCard(cc, index) {
  const { width: cw, height: ch } = cc.cardSize, dpr = Math.min(2, window.devicePixelRatio || 1);
  const layers = cc.tiles(index).map(t => {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(t.size * dpr)); c.height = Math.max(1, Math.round(ch * dpr));
    Object.assign(c.style, { position: 'absolute', left: '0', top: '0', width: t.size + 'px', height: ch + 'px', pointerEvents: 'none' });
    t.frame.insertBefore(c, t.img.nextSibling);   // under the carousel's own shade, so depth fade still applies
    return { c, ctx: c.getContext('2d'), t };
  });
  return {
    paint(src) { const kx = src.width / cw, ky = src.height / ch; for (const L of layers) L.ctx.drawImage(src, L.t.offset * kx, 0, L.t.size * kx, ch * ky, 0, 0, L.c.width, L.c.height); },
    remove() { layers.forEach(L => L.c.remove()); }
  };
}

// Refine Frame, three layers: before → after@24px → after@10px → after@4px → after
export async function refineFx({ before, after, width, height, blocks = [24, 10, 4], stageDuration = 400, onFrame }) {
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.round(width * dpr), H = Math.round(height * dpr);
  const [bi, ai] = await Promise.all([loadImg(before), loadImg(after)]);
  const levels = [level(bi, W, H, 1), ...blocks.map(b => level(ai, W, H, Math.max(2, Math.round(b * dpr)))), level(ai, W, H, 1)];
  const out = document.createElement('canvas'); out.width = W; out.height = H;
  const ctx = out.getContext('2d'), n = levels.length - 1;
  const glint = ctx.createLinearGradient(0, 0, W, 0);
  for (const [at, a] of [[0, 0], [0.08, 0.1], [0.2, 0.7], [0.32, 1], [0.68, 1], [0.8, 0.7], [0.92, 0.1], [1, 0]]) glint.addColorStop(at, `rgba(255, 255, 255, ${a})`);
  let p = 0, target = 0, raf = 0, last = 0, done = null;
  function draw() {
    const L = p * n, i = Math.min(n, Math.floor(L + 1e-6)), frac = L - i;
    ctx.globalAlpha = 1; ctx.drawImage(levels[i], 0, 0);
    if (i < n && frac > 0) {
      const edge = EDGE * dpr, front = frac * (H + edge) - edge / 2, top = Math.max(0, Math.floor(front - edge / 2));
      if (top > 0) ctx.drawImage(levels[i + 1], 0, 0, W, top, 0, 0, W, top);
      const sh = edge / STRIPS;
      for (let k = 0; k < STRIPS; k++) {
        const y = front - edge / 2 + k * sh; if (y + sh <= 0 || y >= H) continue;
        const t = 1 - (k + 0.5) / STRIPS; ctx.globalAlpha = t * t * (3 - 2 * t);
        const y0 = Math.max(0, y), h0 = Math.min(H, y + sh) - y0; if (h0 > 0) ctx.drawImage(levels[i + 1], 0, y0, W, h0, 0, y0, W, h0);
      }
      ctx.globalAlpha = 1;
      if (front > 0 && front < H) { ctx.fillStyle = glint; ctx.globalAlpha = 0.12; ctx.fillRect(0, front - 2 * dpr, W, 4 * dpr); ctx.globalAlpha = 0.3; ctx.fillRect(0, front - dpr, W, 2 * dpr); ctx.globalAlpha = 1; }
    }
    onFrame && onFrame(out);
  }
  function tick(now) {
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
    const back = target < p, rate = (back ? 2 : 1) / (n * (stageDuration / 1000)), step = rate * dt;   // going back runs twice as fast
    if (Math.abs(target - p) <= step) p = target; else p += back ? -step : step;
    draw();
    if (p !== target) raf = requestAnimationFrame(tick); else { raf = 0; last = 0; const d = done; done = null; d && d(); }
  }
  draw();
  return {
    canvas: out,
    run(to) { target = to; return new Promise(r => { done = r; if (!raf) { last = 0; raf = requestAnimationFrame(tick); } }); },
    get progress() { return p; },
    destroy() { cancelAnimationFrame(raf); }
  };
}

// Morph Slider between the two photos (melt), slowed down; drawn off screen and copied onto the card
export function morphFx({ before, after, width, height, duration = 1.4, ease = 'power2.inOut', onFrame }) {
  const host = document.createElement('div');
  Object.assign(host.style, { position: 'fixed', left: '-10000px', top: '0', width: width + 'px', height: height + 'px', pointerEvents: 'none' });
  document.body.appendChild(host);
  const m = createMorphSlider(host, { images: [before, after], duration, ease, drift: 0, vignette: 0, dprCap: 2, onRender: c => onFrame && onFrame(c) });
  let settle = 0;
  return {
    get canvas() { return host.querySelector('canvas'); },
    run(to) { m.resume(); m.show(to); clearTimeout(settle); return new Promise(r => { settle = setTimeout(() => { r(); }, duration * 1000 + 80); }); },
    pause() { m.pause(); },
    destroy() { m.destroy(); host.remove(); }
  };
}
