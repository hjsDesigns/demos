#!/usr/bin/env python3
"""Trust Welding hero stills: the exact chrome emblem (images/emblem.png, never redrawn) composited over a backdrop.
compose.py --bg BACKDROP --out BASENAME --size WxH --place CX,CY,H [--anchor 0..1] [--halo 0.3] [--shadow] [--reflect]
           [--grade cool] [--emblem images/emblem.png] [--quality 90]
CX,CY = emblem centre as fractions of the frame; H = emblem height as a fraction of the frame height.
--anchor = where the backdrop's vertical crop sits when cover-fitting (0 top, .5 centre, 1 bottom)."""
import argparse, sys
from PIL import Image, ImageFilter, ImageEnhance, ImageOps, ImageChops, ImageDraw

def cover(im, W, H, anchor=0.5):
    s = max(W / im.width, H / im.height)
    nw, nh = max(W, round(im.width * s)), max(H, round(im.height * s))
    im = im.resize((nw, nh), Image.LANCZOS)
    x = (nw - W) // 2; y = round((nh - H) * anchor)
    return im.crop((x, y, x + W, y + H))

def grade_cool(im):
    """A hard grade for an amateur daylight photo: contrast up, shadows cooled, sky deepened, darker overall, soft vignette, a touch of clarity."""
    im = ImageEnhance.Contrast(im).enhance(1.28)
    im = ImageEnhance.Color(im).enhance(0.82)
    im = ImageEnhance.Brightness(im).enhance(0.80)
    r, g, b = im.split()
    b = b.point(lambda v: min(255, int(v * 1.06 + 4)))
    r = r.point(lambda v: int(v * 0.96))
    im = Image.merge('RGB', (r, g, b))
    im = im.filter(ImageFilter.UnsharpMask(radius=2.2, percent=70, threshold=2))
    W, H = im.size
    vig = Image.new('L', (W, H), 0); d = ImageDraw.Draw(vig)
    d.ellipse((-W * 0.18, -H * 0.28, W * 1.18, H * 1.28), fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(min(W, H) * 0.22))
    dark = Image.new('RGB', (W, H), (6, 8, 11))
    return Image.composite(im, dark, vig.point(lambda v: 60 + v * 195 // 255))

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--bg', required=True); p.add_argument('--out', required=True); p.add_argument('--size', required=True)
    p.add_argument('--place', required=True); p.add_argument('--anchor', type=float, default=0.5)
    p.add_argument('--halo', type=float, default=0.0); p.add_argument('--shadow', action='store_true'); p.add_argument('--reflect', action='store_true')
    p.add_argument('--grade', default='none'); p.add_argument('--emblem', default='../../images/emblem.png'); p.add_argument('--quality', type=int, default=90)
    a = p.parse_args()
    W, H = map(int, a.size.lower().split('x')); cx, cy, eh = map(float, a.place.split(','))
    bg = Image.open(a.bg).convert('RGB')
    bg = cover(bg, W, H, a.anchor)
    if a.grade == 'cool': bg = grade_cool(bg)
    em = Image.open(a.emblem).convert('RGBA'); em = em.crop(em.split()[-1].getbbox())
    h = round(H * eh); w = round(em.width * h / em.height)
    em = em.resize((w, h), Image.LANCZOS)
    x = round(W * cx - w / 2); y = round(H * cy - h / 2)
    out = bg.convert('RGBA')
    if a.halo > 0:  # a soft dark pool behind the emblem so chrome reads over a bright sky (the scrim lives under the mark, never on the photo)
        halo = Image.new('L', (W, H), 0); d = ImageDraw.Draw(halo)
        d.ellipse((x - w * 0.25, y - h * 0.30, x + w * 1.25, y + h * 1.30), fill=int(255 * a.halo))
        halo = halo.filter(ImageFilter.GaussianBlur(max(w, h) * 0.22))
        out = Image.composite(Image.new('RGBA', (W, H), (4, 6, 9, 255)), out, halo)
    if a.shadow:  # the emblem's own silhouette, blurred and dropped a little: it hangs in front of the view
        sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); mask = em.split()[-1].point(lambda v: int(v * 0.55))
        sh.paste((0, 0, 0, 255), (x + round(w * 0.012), y + round(h * 0.035)), mask)
        sh = sh.filter(ImageFilter.GaussianBlur(h * 0.035)); out = Image.alpha_composite(out, sh)
    if a.reflect:  # standing on brushed steel: a squashed, faded, blurred mirror image below it
        rf = ImageOps.flip(em).resize((w, round(h * 0.55)), Image.LANCZOS).filter(ImageFilter.GaussianBlur(2.2))
        grad = Image.linear_gradient('L').rotate(180).resize((w, rf.height))  # bright at top, dark at bottom
        alpha = ImageChops.multiply(rf.split()[-1], grad.point(lambda v: int(v * 0.42)))
        rf.putalpha(alpha); layer = Image.new('RGBA', (W, H), (0, 0, 0, 0)); layer.paste(rf, (x, y + h - round(h * 0.02)), rf)
        out = Image.alpha_composite(out, layer)
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0)); layer.paste(em, (x, y), em)
    out = Image.alpha_composite(out, layer).convert('RGB')
    out.save(a.out + '.jpg', quality=a.quality, optimize=True, progressive=True)
    print(f'{a.out}.jpg {W}x{H} emblem {w}x{h} at ({x},{y})')

if __name__ == '__main__': main()
