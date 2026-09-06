#!/bin/sh
python3 - <<'PY'
from pathlib import Path
import json
p=Path('.')
r=json.loads((p/'research/photo-manifest.json').read_text())
rows=[]
for v in r:
 if v['selection'].startswith('rejected'):continue
 rows.append(f'<figure><img src="../images/{v["file"]}" alt="Candidate {v["id"]}: Mimi’s Nails work"><figcaption><b>{v["id"]:02d}</b> {v["file"]}<br>{v["width"]} × {v["height"]} · {v["photo_credit"]}</figcaption></figure>')
(p/'assets/contact-sheet.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mimi’s Nails — provisional photo selection</title><style>body{margin:0;padding:30px;font:16px system-ui;background:#f6efe5;color:#302737}h1{font-size:30px}p{max-width:75ch}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:18px}figure{margin:0;background:#fbf5ec;padding:10px}img{width:100%;height:280px;object-fit:contain}figcaption{padding:12px 0;font-size:14px}b{font-size:20px}</style><h1>Mimi’s Nails · Black Diamond</h1><p>20 accepted candidates from the exact-location gallery. Numbers match original harvest IDs, with weak and duplicate candidates omitted. Provisional hero: 27. Services: 13. Twelve additional looks on the page. Interior/exterior unavailable; no other salon’s photos used.</p><div class="grid">'''+''.join(rows)+'</div></html>')
print('Contact sheet: 20 accepted candidates; original source IDs preserved')
PY
