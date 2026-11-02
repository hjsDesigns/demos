// Gage hollow site · section 6 (results): an Electric Border ON each photo card's own edges (Hayden 10/30: "I need an
// electric border for each photo, not for the entire section" → "I just want to keep the barrier on there at all times…
// on specific edges… not hovering above").
// attachCardBorders(cc, opts) → { setActive(on), refresh(), destroy() }   cc = the api createCircularCarousel returned
//   opts: { color: '#5CB2FF', glowColor: '#0687FF', inset: 5, dpr: ≤ 1.25, hideBelow: -0.15 }
// How: ONE card-sized React Bits Electric Border (js/vendor/electric-border.js) is drawn off screen, steady (no intro, no
// pointer play), its line set 5 px inside the card's edge with the card's corner radius. After each of its frames, that
// frame's card area is copied onto every card you can see, strip by strip, the way card-fx's overlayCard paints the
// before/after: each bent front strip shows its own slice, so the border sits exactly on the photo's edges and follows its
// curve (left edge on the first strip, right on the last, top and bottom along all of them). Nothing outside the card is
// copied, so no glow spills off the photo. The strip canvases sit above the photo and any refine overlay, under the
// carousel's own shade (side cards still dim with depth).
// One render for six cards: to keep them from flickering in step, cards take the frame plain, mirrored side to side,
// top to bottom or both (no two neighbours alike). Cards turned away (cos < -0.15) aren't painted; everything you can see
// always has its border, through the spin, hover-to-front and the deck.
// setActive(false) pauses the border (the strips keep their last frame); setActive(true) carries on (no sweep, no intro).
import { createElectricBorder } from '../../../js/vendor/electric-border.js?v=20261030h';

const NUM = '(-?\\d*\\.?\\d+(?:e[-+]?\\d+)?)';
const ROT_Y = new RegExp(`rotateY\\(${NUM}deg\\)`);
const MARGIN = 24;   // the source's canvas reach past the card (the port's smallest): only the card area is ever copied
const VARIANTS = [[1, 1], [-1, 1], [1, -1], [-1, -1], [-1, 1], [1, -1]];   // plain, mirror x, mirror y, both, …
const wrap = a => ((a % 360) + 540) % 360 - 180;
const rotY = t => {
  const m = ROT_Y.exec(t || '');
  return m ? parseFloat(m[1]) : 0;
};

export function attachCardBorders(cc, opts = {}) {
  const o = {
    color: '#5CB2FF',
    glowColor: '#0687FF',
    inset: 5,
    dpr: Math.min(1.25, window.devicePixelRatio || 1),
    hideBelow: -0.15,
    ...opts
  };
  let active = true;
  let cards = [];   // { card, layers: [{ c, ctx, t }], flip }
  let source = null;   // { host, border, W, H }

  const radiusOf = card => parseFloat(getComputedStyle(card).getPropertyValue('--cc-radius')) || 12;

  // the strip canvases: one per front strip, above the photo (and a refine overlay, which goes in right after the photo),
  // below the carousel's shade
  const layersFor = i => {
    const { height: H } = cc.cardSize;
    return cc.tiles(i).map(t => {
      const c = document.createElement('canvas');
      c.className = 'cc-border-strip';
      c.setAttribute('aria-hidden', 'true');
      c.width = Math.max(1, Math.round(t.size * o.dpr));
      c.height = Math.max(1, Math.round(H * o.dpr));
      Object.assign(c.style, { position: 'absolute', left: '0', top: '0', width: `${t.size}px`, height: `${H}px`, pointerEvents: 'none' });
      const shade = t.frame.querySelector('.circular-carousel__shade');
      t.frame.insertBefore(c, shade || null);
      return { c, ctx: c.getContext('2d'), t };
    });
  };

  const clearCards = () => {
    cards.forEach(entry => entry.layers.forEach(L => L.c.remove()));
    cards = [];
  };
  const buildCards = () => {
    clearCards();
    cards = cc.cards.map((card, i) => ({ card, layers: layersFor(i), flip: VARIANTS[i % VARIANTS.length] }));
  };

  // copy the source's card area onto every card you can see, each strip its own slice
  const paint = canvas => {
    if (!active || !source) return;
    const list = cc.cards;
    if (list.length !== cards.length || list.some((card, i) => cards[i]?.card !== card)) buildCards();
    const { W, H } = source;
    const k = canvas.width / (W + MARGIN * 2);
    const ring = list[0]?.parentNode;
    const turn = rotY(ring?.style.transform);
    for (const entry of cards) {
      const facing = Math.cos((wrap(rotY(entry.card.style.transform) + turn) * Math.PI) / 180);
      if (facing < o.hideBelow) continue;
      const [fx, fy] = entry.flip;
      for (const L of entry.layers) {
        const { c, ctx, t } = L;
        // which slice: mirrored cards read theirs from the other side
        const x = fx > 0 ? t.offset : W - t.offset - t.size;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.setTransform(fx, 0, 0, fy, fx > 0 ? 0 : c.width, fy > 0 ? 0 : c.height);
        ctx.drawImage(canvas, (MARGIN + x) * k, MARGIN * k, t.size * k, H * k, 0, 0, c.width, c.height);
      }
    }
  };

  const buildSource = () => {
    if (source) {
      source.border.destroy();
      source.host.remove();
    }
    const { width: W, height: H } = cc.cardSize;
    const radius = cc.cards[0] ? radiusOf(cc.cards[0]) : 12;
    // drawn where nobody looks; the frames go out through onRender (same task, so the WebGL buffer is still there)
    const host = document.createElement('div');
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = `position:fixed;left:-100000px;top:0;width:${W}px;height:${H}px;border-radius:${radius}px;pointer-events:none;`;
    document.body.appendChild(host);
    const border = createElectricBorder(host, {
      color: o.color,
      glowColor: o.glowColor,
      radius,
      offset: -o.inset,   // the line just inside the photo's edge; its outer glow is cut off with everything past the card
      margin: MARGIN,
      dprCap: o.dpr,
      intro: false,   // steady from the first frame, no sweep around
      interactive: false,
      arcs: 0.6,
      offscreen: true,
      onRender: paint
    });
    source = { host, border, W, H };
  };

  buildCards();
  buildSource();

  return {
    setActive(on) {
      active = !!on;
      if (!source) return;
      if (active) source.border.resume();
      else source.border.pause();
    },
    // after the carousel's card size changed: new strip canvases and a new source
    refresh() {
      buildCards();
      buildSource();
      if (!active) source.border.pause();
    },
    destroy() {
      active = false;
      clearCards();
      if (source) {
        source.border.destroy();
        source.host.remove();
        source = null;
      }
    }
  };
}

export default attachCardBorders;
