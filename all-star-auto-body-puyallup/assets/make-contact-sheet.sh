#!/bin/sh
# Rebuilds assets/contact-sheet.html — a numbered grid of EVERY photo harvested
# from this business's Google listing (harvest-0906/), with the ones currently
# on the site framed in red, so Hayden can swap any pick by number.
set -e
cd "$(dirname "$0")/.."
python3 - <<'PY'
import glob, os, re
files=sorted(glob.glob("harvest-0906/g*.jpg"), key=lambda p:int(re.search(r'g(\d+)',p).group(1)))
used={"g29":"hero-stack-1 (desktop hero)","g57":"hero-stack-2","g24":"hero-stack-3","g19":"logo.png (real sign crop)",
      "g12":"work-teardown","g41":"BEFORE (slider)","g49":"AFTER (slider)","g35":"gallery-1","g33":"gallery-2",
      "g50":"gallery-3","g31":"gallery-4","g58":"about"}
rows=[]
for i,f in enumerate(files,1):
    key=os.path.basename(f)[:-4]; tag=used.get(key)
    cls=" on" if tag else ""
    extra='<br><span class="use">'+tag+'</span>' if tag else ''
    rows.append('<figure class="card'+cls+'"><img src="../'+f+'" loading="lazy" alt="'+key+'">'
                '<figcaption><b>'+str(i)+'</b> '+key+'.jpg'+extra+'</figcaption></figure>')
css = """body{margin:0;padding:24px;background:#17191C;color:#EFE8DC;font:15px/1.45 -apple-system,Helvetica,Arial,sans-serif}
h1{font-size:20px;margin:0 0 4px}p{margin:0 0 20px;color:#A2988A}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px}
.card{margin:0;background:#20242A;border:1px solid #2C3137;padding:10px;border-radius:10px}
.card.on{border-color:#B4271F;box-shadow:0 0 0 2px rgba(180,39,31,.35)}
.card img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block;border-radius:6px;background:#101214}
figcaption{margin-top:8px;font-family:ui-monospace,Menlo,monospace;font-size:12px;word-break:break-all}
figcaption b{display:inline-block;min-width:28px;color:#EE8F79;font-size:15px}
.use{color:#E5B45F;font-size:11px;letter-spacing:.06em;text-transform:uppercase}"""
html=("<!DOCTYPE html>\n<html lang=\"en\"><head><meta charset=\"utf-8\">"
 "<title>All Star Auto Body — contact sheet</title>"
 "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><style>"+css+"</style></head><body>"
 "<h1>All Star Auto Body — every harvested photo</h1>"
 "<p>"+str(len(files))+" photos pulled from their Google listing on 2026-09-06. The "+str(len(used))+
 " framed in red are the ones on the site right now — say a number and a slot to swap any of them "
 "(“41 for the hero”, “9 and 26 for the gallery”).</p><div class=\"grid\">\n"
 +"\n".join(rows)+"\n</div></body></html>")
open("assets/contact-sheet.html","w").write(html)
print("contact-sheet.html: "+str(len(files))+" photos, "+str(len(used))+" in use")
PY
