#!/bin/sh
python3 - <<'PY'
from pathlib import Path
import json
p=Path('.');records=json.loads((p/'research/photo-manifest.json').read_text());rows=[]
for v in records:
 if not v['accepted']:continue
 rows.append(f'<figure><img src="../images/{v["file"]}" alt="{v["reason"]}"><figcaption><b>{v["id"]:02d}</b> {v["file"]}<br>{v["width"]} × {v["height"]}<br>{v["credit"]}<br>{v["reason"]}</figcaption></figure>')
(p/'assets/contact-sheet.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Milton Lodge — provisional photo selection</title><style>body{margin:0;padding:30px;font:16px system-ui;background:#eee7d6;color:#292721}h1{font-size:30px}p{max-width:75ch}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:18px}figure{margin:0;background:#f6efdf;padding:10px}img{width:100%;height:280px;object-fit:contain}figcaption{padding:12px 0;font-size:13px}b{font-size:20px}</style><h1>Milton Lodge · Milton</h1><p>11 accepted actual-business candidates. Source IDs are preserved. Provisional hero: 08 desktop / 03 mobile. Eight distinct actual photos used on the page, plus the genuine logo. Excluded old Milton Tavern storefront, dated graphics, stock-like promo images, screenshots and collages. Current exterior remains unavailable.</p><div class="grid">'''+''.join(rows)+'</div></html>')
print('Contact sheet:11 accepted photos, original source IDs preserved')
PY
