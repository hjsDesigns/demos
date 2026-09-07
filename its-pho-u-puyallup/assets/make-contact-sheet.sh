#!/bin/sh
# Rebuilds assets/contact-sheet.html from the full Google Maps harvest
# (harvest-0906/), marking which photos the site is currently using.
set -e
cd "$(dirname "$0")/.."
python3 - <<'PY'
import os,glob,html
from PIL import Image
used={"g15":"hero (desktop)","g16":"hero (phone) + header mark","g49":"menu strip — phở","g12":"menu strip — bánh mì",
 "g10":"menu strip — spring rolls","g6":"gallery — the room","g27":"gallery — vermicelli","g52":"gallery — fried rolls",
 "g4":"gallery — boba","g20":"gallery — fried rice","g7":"about — menu cover","g43":"signature — the bowl",
 "g14":"signature — garnish crops","g5":"menu prices (transcribed, not shown)","g3":"menu cover (alt of g7)"}
files=sorted(glob.glob("harvest-0906/g*.jpg"), key=lambda f:int(''.join(c for c in os.path.basename(f)[1:] if c.isdigit())))
rows=[]
for f in files:
    k=os.path.splitext(os.path.basename(f))[0]
    try: w,h=Image.open(f).size
    except Exception: w=h=0
    tag=f'<span class="use">IN USE · {html.escape(used[k])}</span>' if k in used else ''
    rows.append(f'<figure{" class=on" if k in used else ""}><img src="../{f}" loading="lazy" alt=""><figcaption><b>{k}</b> <span class="dim">{w}&times;{h}</span>{tag}</figcaption></figure>')
doc=f"""<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>It's Phở U — contact sheet</title>
<meta name="viewport" content="width=device-width,initial-scale=1"><style>
body{{margin:0;padding:24px;background:#F7F0E0;color:#241A12;font:15px/1.45 -apple-system,Helvetica,Arial,sans-serif}}
h1{{font-size:21px;margin:0 0 4px}}p{{margin:0 0 20px;color:#6E6455}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:18px}}
figure{{margin:0;background:#FDF8EC;border:1px solid #DFD2B8;padding:10px;border-radius:10px}}
figure.on{{border:2px solid #256B62;background:#EAF2EE}}
figure img{{width:100%;aspect-ratio:4/3;object-fit:cover;display:block;border-radius:6px;background:#EFE5CF}}
figcaption{{margin-top:8px;font-family:ui-monospace,Menlo,monospace;font-size:12px}}
figcaption b{{display:inline-block;min-width:34px;color:#C4392B;font-size:15px}}
.dim{{color:#6E6455;font-size:11px}}
.use{{display:block;margin-top:5px;color:#1A544D;font-weight:700;font-size:11px;letter-spacing:.04em}}
</style></head><body>
<h1>It's Phở U — photo contact sheet</h1>
<p>{len(files)} photos harvested from Google Maps on 2026-09-06. Green frames are the {len(used)} in use on the site.
Say the number + the slot to swap one (&ldquo;g30 for the hero, g21 for the gallery&rdquo;).</p>
<div class="grid">{''.join(rows)}</div></body></html>"""
open("assets/contact-sheet.html","w",encoding="utf-8").write(doc)
print("contact sheet: %d photos, %d in use" % (len(files), len(used)))
PY
