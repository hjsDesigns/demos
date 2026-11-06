#!/usr/bin/env python3
"""One frame of the opening: through the hood, the arc lit, welding on the FULL logo.

The logo is images/emblem-1000.png untouched, placed at the exact spot and scale it
holds in the approved hero (pick-golden), so when the hood lifts it does not move.
Everything else — the shade cast, the arc, the heat, the sparks, the smoke — is light
laid over it. The rod and gloved hand are lifted from the photographic plate.

  python3 weld-frame.py --lit 1.0 --out out/lit.jpg
  --lit 0  = the dark second between beads (hood down, no arc)
"""
import argparse, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 2560, 1440
HERO = '../../images/hero/pick-golden-desk.jpg'
EMBLEM = '../../images/emblem-1000.png'
PLATE = '../refs/hood-hero.png'

# the emblem's place in the approved hero, measured off pick-golden-desk.jpg
E_CX, E_CY, E_H = 0.510, 0.520, 0.596
# the weld point = the logo's own arc burst
ARC = (0.4525, 0.480)
# the two spots Hayden welds, in frame pixels
SPOTS = {'t': (817, 830), 'mask': (1215, 468)}

# the hood: a horizontal window, nothing drawn around it, the body opaque to every edge
HOOD_W, HOOD_AR, HOOD_Y = 0.75, 1.90, 0.520

SHADE_FAR  = np.array([16.0, 26.0, 18.0])    # the green-amber auto-darkening cast, far from the arc
SHADE_NEAR = np.array([236.0, 242.0, 226.0]) # what the arc actually puts on the steel
HEAT       = np.array([255.0, 138.0, 34.0])


def radial(cx, cy, rx, ry, p=2.0):
    """A falloff map, 1 at (cx,cy) dying to 0 at the radii."""
    x = (np.arange(W) - cx) / rx
    y = (np.arange(H) - cy) / ry
    d = np.sqrt(x[None, :] ** 2 + y[:, None] ** 2)
    return np.clip(1.0 - d, 0.0, 1.0) ** p


def hood_mask():
    w = int(W * HOOD_W); h = int(w / HOOD_AR)
    cx, cy = W / 2, H * HOOD_Y
    box = (cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2)
    m = Image.new('L', (W, H), 0)
    ImageDraw.Draw(m).rounded_rectangle(box, radius=int(h * 0.09), fill=255)
    m = m.filter(ImageFilter.GaussianBlur(3.5))              # a lens edge, never a drawn line
    inner = Image.new('L', (W, H), 0)
    pad = h * 0.055
    ImageDraw.Draw(inner).rounded_rectangle(
        (box[0] + pad, box[1] + pad, box[2] - pad, box[3] - pad), radius=int(h * 0.07), fill=255)
    inner = inner.filter(ImageFilter.GaussianBlur(h * 0.11))  # light dies toward the glass edge
    return np.asarray(m, np.float32) / 255.0, np.asarray(inner, np.float32) / 255.0


def place_emblem():
    em = Image.open(EMBLEM).convert('RGBA')
    em = em.crop(em.split()[-1].getbbox())
    h = round(H * E_H); w = round(em.width * h / em.height)
    em = em.resize((w, h), Image.LANCZOS)
    x = round(W * E_CX - w / 2); y = round(H * E_CY - h / 2)
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    layer.paste(em, (x, y), em)
    return layer, (x, y, w, h)


def sparks(n, ox, oy, scale):
    """Spatter thrown off the puddle: short warm streaks, hottest at the source."""
    img = Image.new('RGB', (W, H), 0); d = ImageDraw.Draw(img)
    rnd = random.Random(7)
    for _ in range(n):
        a = rnd.uniform(-math.pi, math.pi)
        r = (rnd.random() ** 0.45) * scale
        x, y = ox + math.cos(a) * r, oy + math.sin(a) * r * 0.72 + r * 0.25   # gravity pulls them down
        ln = rnd.uniform(4, 26) * (1 - r / scale * 0.6)
        f = max(0.0, 1 - r / scale)
        c = (int(255 * f + 90), int((200 * f + 60) * f + 30), int(60 * f))
        d.line((x, y, x - math.cos(a) * ln, y - math.sin(a) * ln * 0.72), fill=c,
               width=1 if rnd.random() < .7 else 2)
    return np.asarray(img.filter(ImageFilter.GaussianBlur(0.6)), np.float32)


def smoke(ox, oy, scale):
    img = Image.new('L', (W, H), 0); d = ImageDraw.Draw(img)
    rnd = random.Random(19)
    for i in range(26):
        t = i / 25
        x = ox + math.sin(t * 4.1) * scale * 0.30 * t + rnd.uniform(-20, 20)
        y = oy - t * scale * 1.45
        r = scale * (0.10 + t * 0.34)
        d.ellipse((x - r, y - r * .8, x + r, y + r * .8), fill=int(58 * (1 - t * .72)))
    return np.asarray(img.filter(ImageFilter.GaussianBlur(scale * 0.10)), np.float32) / 255.0


def rod_and_hand(ax, ay, length=470, deg=-34.0):
    """The electrode, coming in over the work from upper right and fading into the dark.
    Drawn rather than lifted, so it lands wherever the bead is."""
    import math as _m
    t = _m.radians(deg); dx, dy = _m.cos(t), _m.sin(t)
    px, py = -dy, dx                                    # perpendicular
    fx, fy = ax + dx * length, ay + dy * length         # the far end, out toward the glove
    img = Image.new('RGB', (W, H), 0); d = ImageDraw.Draw(img)
    for off, wid, col in ((-2.0, 0.60, (168, 170, 162)),   # the lit side, facing the arc
                          ( 1.4, 0.95, (54, 58, 54))):     # the shaded body
        a = (ax + px * off * 6, ay + py * off * 6)
        w0, w1 = 4.0 * wid, 13.0 * wid
        d.polygon([(a[0] + px * w0, a[1] + py * w0), (a[0] - px * w0, a[1] - py * w0),
                   (fx - px * w1, fy - py * w1), (fx + px * w1, fy + py * w1)], fill=col)
    img = img.filter(ImageFilter.GaussianBlur(1.3))
    a = np.asarray(img, np.float32)
    # it fades out toward the far end: only the stub near the puddle is lit by it
    fade = np.clip(1.0 - radial(ax, ay, length * 1.15, length * 1.15, 1.0), 0, 1)
    a *= (1.0 - fade)[:, :, None] ** 1.4
    tip = radial(ax + dx * 26, ay + dy * 26, 46, 46, 2.0)[:, :, None]
    return a + tip * np.array([255.0, 196.0, 96.0])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--lit', type=float, default=1.0)
    ap.add_argument('--spot', default='t', choices=sorted(SPOTS))
    ap.add_argument('--out', default='out/lit.jpg')
    a = ap.parse_args()
    lit = max(0.0, min(1.0, a.lit))

    if lit <= 0.001:   # his rule: off means off — the screen is black
        Image.new('RGB', (W, H), (0, 0, 0)).save(a.out, quality=93)
        print(f'{a.out} {W}x{H} · black'); return
    emb, (ex, ey, ew, eh) = place_emblem()
    alpha = np.asarray(emb.split()[-1], np.float32)[:, :, None] / 255.0
    lum = np.asarray(emb.convert('L'), np.float32)[:, :, None] / 255.0
    lum = lum ** 0.82                                         # keep the engraving readable in the dark

    ax, ay = SPOTS[a.spot]
    fall = radial(ax, ay, ew * 1.35, ew * 1.35, 1.8)[:, :, None]
    heat = radial(ax, ay, ew * 0.17, ew * 0.17, 2.6)[:, :, None]

    # the steel, lit only by the arc
    col = SHADE_FAR + (SHADE_NEAR - SHADE_FAR) * fall * (0.25 + 0.75 * lit)
    col = col + (HEAT - col) * heat * lit
    steel = col * lum

    # the field behind it: the room is there, but through #10 glass it is almost nothing
    pl = Image.open(PLATE).convert('L').resize((W, H), Image.LANCZOS)
    bg = np.asarray(pl, np.float32)[:, :, None] * np.array([0.085, 0.125, 0.090])
    bg = bg * (0.45 + 2.1 * fall * lit)

    frame = bg * (1 - alpha) + steel * alpha

    if lit > 0.02:
        # the puddle: a hard white core with its bloom
        core = radial(ax, ay, ew * 0.055, ew * 0.055, 2.2)[:, :, None]
        bloom = radial(ax, ay, ew * 0.60, ew * 0.60, 2.4)[:, :, None]
        frame += core * np.array([255.0, 252.0, 240.0]) * lit
        frame += bloom * np.array([110.0, 128.0, 104.0]) * lit
        frame += np.asarray(Image.fromarray(np.clip(frame, 0, 255).astype(np.uint8))
                            .filter(ImageFilter.GaussianBlur(26)), np.float32) * 0.17 * lit
        frame += smoke(ax, ay, ew * 0.45)[:, :, None] * np.array([150.0, 160.0, 140.0]) * lit
        frame += sparks(340, ax, ay, ew * 0.46) * lit
        frame += rod_and_hand(ax, ay) * (0.55 + 0.45 * lit)

    m_out, m_in = hood_mask()
    # the glass itself carries a faint cast, so the window reads against the shell
    frame += m_in[:, :, None] * np.array([8.0, 15.0, 10.0]) * (0.45 + 0.55 * lit)
    sheen = np.clip(1.0 - np.abs((np.arange(W)[None, :] * 0.55 + np.arange(H)[:, None] * 1.5)
                                 / 1850.0 - 1.0) * 2.4, 0, 1) ** 2
    frame += (sheen * m_in)[:, :, None] * np.array([5.0, 9.0, 6.0])   # light across the lens
    frame *= (0.38 + 0.62 * m_in)[:, :, None]     # the glass darkens toward its frame
    frame *= m_out[:, :, None]                    # the hood body: opaque, to every edge

    img = Image.fromarray(np.clip(frame, 0, 255).astype(np.uint8))
    img = img.filter(ImageFilter.UnsharpMask(radius=1.6, percent=45, threshold=3))
    n = np.asarray(img, np.float32) + np.random.default_rng(3).normal(0, 3.4, (H, W, 1))  # film grain
    Image.fromarray(np.clip(n, 0, 255).astype(np.uint8)).save(a.out, quality=93,
                                                              optimize=True, progressive=True)
    print(f'{a.out} {W}x{H} · emblem {ew}x{eh} at ({ex},{ey}) · arc ({int(ax)},{int(ay)}) · lit {lit}')


if __name__ == '__main__':
    main()
