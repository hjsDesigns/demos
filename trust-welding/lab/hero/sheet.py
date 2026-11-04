#!/usr/bin/env python3
"""sheet.py OUT.jpg CELLW label=path [label=path ...] — a labelled contact sheet, 3 per row."""
import sys
from PIL import Image, ImageDraw
out, cw = sys.argv[1], int(sys.argv[2]); items = [a.split('=', 1) for a in sys.argv[3:]]
cells = []
for label, path in items:
    im = Image.open(path).convert('RGB'); s = cw / im.width; im = im.resize((cw, round(im.height * s)), Image.LANCZOS); cells.append((label, im))
cols = 3; rows = (len(cells) + cols - 1) // cols; rh = max(im.height for _, im in cells) + 26
sheet = Image.new('RGB', (cols * (cw + 10) + 10, rows * (rh + 10) + 10), (12, 14, 17)); d = ImageDraw.Draw(sheet)
for i, (label, im) in enumerate(cells):
    x = 10 + (i % cols) * (cw + 10); y = 10 + (i // cols) * (rh + 10)
    sheet.paste(im, (x, y)); d.text((x + 2, y + im.height + 6), label, fill=(200, 205, 210))
sheet.save(out, quality=86); print(out, sheet.size)
