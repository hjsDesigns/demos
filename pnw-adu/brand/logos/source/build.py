#!/usr/bin/env python3
"""Reproducible six-concept SVG set. Run outline.swift first if font/text changes.
All logo lettering is stored as paths from Archivo wght=800, wdth=112, tracking=.04em.
This script creates vectors only; native canvas renders PNG previews separately.
"""
from pathlib import Path
import json
BASE = Path(__file__).resolve().parent.parent
FONT = json.loads((BASE/'source/wordmark-paths.json').read_text())
DARK, CREAM, AMBER, GOLD = '#1B2226', '#EDE5D5', '#D4954D', '#FFC46B'
CONCEPTS = [
 ('01-light-gable','Light Gable','A broad roofline, an open threshold and one warm window.',
  [('main','M16 110L128 22L240 110L220 136L128 64L36 136Z'),
   ('main','M50 132L82 156V220H50ZM174 156L206 132V220H174Z'),
   ('gold','M108 124H148V184H108Z')]),
 ('02-shared-wall','Shared Wall','Two spaces of different sizes meet along one structural wall.',
  [('main','M24 24H160V224H24ZM60 60V188H124V60Z'),
   ('amber','M124 96H232V224H124ZM160 132V188H196V132Z')]),
 ('03-timber-joint','Timber Joint','Two cut timbers interlock; the empty center is the extra room.',
  [('main','M24 24H160V60H60V124H124V160H24Z'),
   ('amber','M96 96H232V232H96V196H196V132H132V168H96Z'),
   ('main','M24 196H60V232H24Z')]),
 ('04-open-plan','Open Plan','An open floor plan draws the eye from the main space into the addition.',
  [('main','M24 24H232V120H196V60H60V196H120V232H24Z'),
   ('amber','M100 100H164V136H136V232H100Z'),
   ('amber','M164 160H232V232H156V196H196V160Z')]),
 ('05-twin-beams','Twin Beams','A compact P and A share the rhythm of two load-bearing frames.',
  [('main','M16 228V28H106L140 62V116L106 150H54V228ZM54 66V112H91L102 101V77L91 66Z'),
   ('amber','M110 228L161 28H192L244 228H204L195 188H157L148 228ZM165 152H187L176 100Z')]),
 ('06-window-cut','Window Cut','An N-to-U ribbon wraps around a single lit window.',
  [('main','M24 24H64L192 148V24H232V232H192L64 108V168Q64 192 88 192H144V232H88Q24 232 24 168Z'),
   ('gold','M106 26H146V66H106Z')]),
]

def mark(parts, tone):
 colors={'main': CREAM if tone=='dark' else DARK, 'amber':AMBER,'gold':GOLD if tone=='dark' else AMBER}
 return ''.join(f'<path fill="{colors[k]}" fill-rule="evenodd" d="{d}"/>' for k,d in parts)

def wordmark(x, y, width, color):
 bx,by,bw,bh = FONT['bbox']; s=width/bw
 return f'<g fill="{color}" transform="translate({x:.4f} {y:.4f}) scale({s:.8f}) translate({-bx:.4f} {-by:.4f})">'+''.join(f'<path d="{p}"/>' for p in FONT['paths'])+'</g>'

def svg(w,h,inner,title):
 return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-label="{title}"><title>{title} — PNW ADU concept</title><metadata>Archivo; wght=800; wdth=112; tracking=0.04em. Wordmark is outlined. Concept artwork, 2026-09-15.</metadata>{inner}</svg>\n'

manifest={'date':'2026-09-15','status':'concept; no primary mark selected','typography':{'family':'Archivo','wght':800,'wdth':112,'tracking_em':0.04,'source':'../fonts/Archivo-Variable.ttf','license':'../fonts/Archivo-OFL.txt','portable':'all logo typography outlined via CoreText'},'colors':{'ground':DARK,'cream':CREAM,'cedar':AMBER,'window':GOLD},'concepts':[]}
for slug,title,desc,parts in CONCEPTS:
 row={'id':slug,'name':title,'rationale':desc,'files':{}}
 for tone in ('dark','cream'):
  ground = DARK if tone=='dark' else CREAM
  ink = CREAM if tone=='dark' else DARK
  # Square artboard allows clear review of the symbol and the exact mark face.
  preview = f'<rect width="1200" height="900" fill="{ground}"/><g transform="translate(440 150) scale(1.25)">{mark(parts,tone)}</g>'+wordmark(225,570,750,ink)
  f=BASE/f'{slug}-{tone}.svg'; f.write_text(svg(1200,900,preview,title))
  row['files'][f'preview_{tone}']=f'{slug}-{tone}.png'
  # Transparent horizontal lockup, ready to place on a sign or ad layout.
  lockup = f'<g transform="translate(30 52) scale(1)">{mark(parts,tone)}</g>'+wordmark(330,128,820,ink)
  (BASE/f'{slug}-lockup-{tone}.svg').write_text(svg(1200,360,lockup,title))
  row['files'][f'lockup_{tone}']=f'{slug}-lockup-{tone}.svg'
  (BASE/f'{slug}-mark-{tone}.svg').write_text(svg(256,256,mark(parts,tone),title+' symbol'))
  row['files'][f'mark_{tone}']=f'{slug}-mark-{tone}.svg'
 # A true one-color separation proves the shape is independent of color effects.
 mono=''.join(f'<path fill="{DARK}" fill-rule="evenodd" d="{d}"/>' for _,d in parts)
 (BASE/f'{slug}-mark-mono.svg').write_text(svg(256,256,mono,title+' one-color symbol'))
 row['files']['mark_mono']=f'{slug}-mark-mono.svg'
 manifest['concepts'].append(row)
(BASE/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
# One lean review page, with dark/cream pairs and direct source downloads.
cards=''.join(f'''<article><header><h2>{i:02d} / {title}</h2><p>{desc}</p></header><div class="pair"><img src="{slug}-dark.png" alt="{title}, cream and amber logo on charcoal"><img src="{slug}-cream.png" alt="{title}, charcoal and amber logo on cream"></div><footer><a href="{slug}-lockup-dark.svg">Dark SVG</a><a href="{slug}-lockup-cream.svg">Cream SVG</a><a href="{slug}-mark-mono.svg">One-color mark</a></footer></article>''' for i,(slug,title,desc,parts) in enumerate(CONCEPTS,1))
html='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PNW ADU / Six mark concepts</title><style>@font-face{font-family:Archivo;src:url(../fonts/Archivo-Variable.ttf)}*{box-sizing:border-box}body{margin:0;background:#151B1F;color:#EDE5D5;font:16px/1.5 system-ui,sans-serif}.wrap{max-width:1500px;margin:auto;padding:48px 28px}.intro{margin:0 0 40px}.intro small{color:#D4954D;letter-spacing:.12em;text-transform:uppercase}h1,h2{font-family:Archivo,sans-serif;font-weight:800;font-stretch:112%;font-variation-settings:'wdth' 112,'wght' 800}h1{font-size:clamp(32px,5vw,60px);margin:10px 0}h2{font-size:22px;margin:0}p{margin:8px 0 0;color:#B9C1C3}article{border-top:1px solid #394349;margin-top:36px;padding-top:28px}header{margin-bottom:22px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}.pair img{width:100%;height:auto;display:block}footer{display:flex;gap:24px;flex-wrap:wrap;margin-top:15px}a{color:#E8B978;text-underline-offset:4px}article:last-child{padding-bottom:32px}@media(max-width:680px){.wrap{padding:24px 18px}.pair{grid-template-columns:1fr}h2{font-size:20px}}</style></head><body><main class="wrap"><div class="intro"><small>PNW ADU · concept study · 15 September 2026</small><h1>Six ways to make the mark.</h1><p>Archivo 800 / width 112. All lettering is outlined in the SVG sources.<br>Concepts for review; no website logo has been replaced.</p></div>'''+cards+'</main></body></html>'
(BASE/'index.html').write_text(html)
print('Wrote 6 concepts, 42 SVG files and preview gallery.')
