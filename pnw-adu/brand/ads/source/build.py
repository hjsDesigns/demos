#!/usr/bin/env python3
"""Exact-format ad composition with unchanged original farmhouse photography.
Vector composition only. No raster-editing or image generation occurs in this script.
"""
from pathlib import Path
import base64,json,hashlib,xml.etree.ElementTree as ET
BASE=Path(__file__).resolve().parent.parent
BRAND=BASE.parent
SITE=BRAND.parent
DARK,CREAM,AMBER,GOLD='#1B2226','#EDE5D5','#D4954D','#FFC46B'
TEXT=json.loads((BASE/'source/text-paths.json').read_text())
WORD=json.loads((BRAND/'logos/source/wordmark-paths.json').read_text())
PHOTO=SITE/'images/hero/dusk-wide.jpg'
PHOTO_DATA='data:image/jpeg;base64,'+base64.b64encode(PHOTO.read_bytes()).decode()
SHA=hashlib.sha256(PHOTO.read_bytes()).hexdigest()
LAYOUTS=[]

def outlines(data,x,y,scale,color=CREAM):
 bx,by,bw,bh=data['bbox']
 return f'<g fill="{color}" transform="translate({x:.3f} {y:.3f}) scale({scale:.8f}) translate({-bx:.4f} {-by:.4f})">'+''.join(f'<path d="{p}"/>' for p in data['paths'])+'</g>'
def text(t,x,y,fs,color=CREAM):
 return outlines(TEXT[t],x,y,fs/1000,color)
def textfit(t,x,y,w,color=CREAM):
 return outlines(TEXT[t],x,y,w/TEXT[t]['bbox'][2],color)
def word(x,y,w):
 return outlines(WORD,x,y,w/WORD['bbox'][2])
def mark(x,y,size):
 return f'<g transform="translate({x} {y}) scale({size/256:.6f})"><path fill="{CREAM}" fill-rule="evenodd" d="M24 24H160V224H24ZM60 60V188H124V60Z"/><path fill="{AMBER}" fill-rule="evenodd" d="M124 96H232V224H124ZM160 132V188H196V132Z"/></g>'
def image(x,y,w):
 h=w*1536/2752
 return f'<image x="{x}" y="{y}" width="{w}" height="{h:.4f}" preserveAspectRatio="xMidYMid meet" xlink:href="{PHOTO_DATA}"/>',h
def phone(x,y,w,h,fs):
 tw=TEXT['[PHONE TO COME]']['bbox'][2]*fs/1000
 th=TEXT['[PHONE TO COME]']['bbox'][3]*fs/1000
 return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="0" fill="none" stroke="{AMBER}" stroke-width="2"/>'+text('[PHONE TO COME]',x+(w-tw)/2,y+(h-th)/2,fs,AMBER)
def slogan(lines,x,y,maxwidth,step=None):
 fs=maxwidth/max(TEXT[t]['bbox'][2] for t in lines)*1000
 step=step or fs*1.03
 return ''.join(text(t,x,y+i*step,fs) for i,t in enumerate(lines)),fs

def save(slug,title,w,h,body,physical=None,details=None):
 width,height=(f'{physical[0]}in',f'{physical[1]}in') if physical else (str(w),str(h))
 meta={'status':'CONCEPT','brand':'PNW ADU','logo':'02 Shared Wall; unselected concept','slogan':'A second home in your backyard.','cta':'Set up a consultation','phone':'[PHONE TO COME]','font':{'family':'Archivo','wght':800,'wdth':112,'logo_tracking_em':.04,'ad_tracking_em':0},'photo_source':'images/hero/dusk-wide.jpg','photo_sha256':SHA,'photo_treatment':'original embedded JPEG, full frame, no architecture crop','pixels':[w,h],'physical_inches':physical,'notes':details}
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{width}" height="{height}" viewBox="0 0 {w} {h}" role="img" aria-label="{title}"><title>{title} — CONCEPT</title><metadata>{json.dumps(meta).replace("&","&amp;").replace("<","&lt;")}</metadata><rect width="{w}" height="{h}" fill="{DARK}"/>{body}</svg>\n'
 (BASE/f'{slug}.svg').write_text(svg)
 meta.update({'id':slug,'title':title,'svg':f'{slug}.svg','png':f'{slug}.png'})
 LAYOUTS.append(meta)

# Yard sign: brand > benefit > whole farmhouse > action, viewed from the street.
s=mark(130,130,320)+word(600,215,1615)
s+=f'<path stroke="{AMBER}" stroke-width="5" d="M160 570H2240"/>'
hd,fs=slogan(['A second home','in your backyard.'],160,745,2080,275);s+=hd
pic,ih=image(0,1430,2400);s+=pic
s+=textfit('Set up a consultation',160,2940,2080)
s+=phone(160,3190,2080,225,115)
s+=text('CONCEPT',160,3480,45,AMBER)
save('01-yard-sign-24x36','24 × 36 inch yard sign',2400,3600,s,[24,36], '100 px per inch concept PNG; not a production print release.')

# Truck: a wide door-panel arrangement, with full-frame image at the right.
s=mark(52,57,170)+word(285,95,1180)
s+=f'<path stroke="{AMBER}" stroke-width="3" d="M80 300H1720"/>'
hd,fs=slogan(['A second home','in your','backyard.'],80,422,610,100);s+=hd
pic,ih=image(705,362,1095);s+=pic
s+=textfit('Set up a consultation',80,1007,840)
s+=phone(1035,987,685,108,44)
s+=text('CONCEPT',80,1150,20,AMBER)
save('02-truck-door-36x24','36 × 24 inch truck-door panel',1800,1200,s,[36,24], 'Flat 36 × 24 inch panel assumption; final vehicle and door measurements pending. 50 px per inch concept PNG.')

# Social: headline at the top, the entire farmhouse across the middle, CTA below.
s=mark(40,48,123)+word(210,78,796)
hd,fs=slogan(['A second home','in your backyard.'],64,260,952,115);s+=hd
pic,ih=image(0,498,1080);s+=pic
s+=textfit('Set up a consultation',64,1150,952)
s+=phone(64,1245,680,65,30)
s+=text('CONCEPT',841,1281,23,AMBER)
save('03-social-1080x1350','1080 × 1350 social post',1080,1350,s)

# Theater: quiet left column with a generous, uncropped farmhouse frame to the right.
s=mark(50,47,150)+word(245,78,982)
s+=f'<path stroke="{AMBER}" stroke-width="3" d="M80 265H1840"/>'
hd,fs=slogan(['A second home','in your','backyard.'],80,365,630,112);s+=hd
pic,ih=image(754,308,1166);s+=pic
s+=textfit('Set up a consultation',80,800,600)
s+=phone(80,900,600,91,38)
s+=text('CONCEPT',1713,1030,25,AMBER)
save('04-theater-1920x1080','1920 × 1080 theater slide',1920,1080,s)

(BASE/'manifest.json').write_text(json.dumps({'date':'2026-09-15','layouts':LAYOUTS},indent=2)+'\n')
# PNG gallery avoids slow browser parsing of four embedded SVG photographs.
cards=''.join(f'<article><h2>{i+1:02d} / {r["title"]}</h2><img src="{r["png"]}" alt="{r["title"]}: A second home in your backyard. Set up a consultation. Concept artwork."><p><a href="{r["svg"]}">Editable SVG source</a> · <a href="{r["png"]}">PNG concept preview</a></p></article>' for i,r in enumerate(LAYOUTS))
(BASE/'index.html').write_text('''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PNW ADU / Four ad concepts</title><style>*{box-sizing:border-box}body{margin:0;background:#151B1F;color:#EDE5D5;font:16px/1.5 system-ui,sans-serif}main{max-width:1280px;padding:44px 24px;margin:auto}h1{font-size:clamp(28px,5vw,54px);margin:0}h2{font-size:22px}p{color:#B9C1C3}article{margin-top:48px;border-top:1px solid #394349;padding-top:24px}img{display:block;width:auto;max-width:100%;max-height:1000px;margin:auto}a{color:#E8B978;text-underline-offset:4px}</style></head><body><main><h1>PNW ADU / four ad concepts.</h1><p>Shared Wall mark · exact Archivo lettering · the original full farmhouse frame.<br>Concepts for review. Phone is pending. Truck-panel dimensions are provisional.</p>'''+cards+'</main></body></html>')
print('Wrote four exact-size SVG compositions; whole dusk frame embedded unchanged.')
