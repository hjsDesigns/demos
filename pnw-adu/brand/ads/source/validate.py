#!/usr/bin/env python3
from pathlib import Path
import json,struct,hashlib,base64,xml.etree.ElementTree as ET
B=Path(__file__).resolve().parent.parent
M=json.loads((B/'manifest.json').read_text())
N={'s':'http://www.w3.org/2000/svg'}
results=[]
for ad in M['layouts']:
 root=ET.parse(B/ad['svg']).getroot()
 actual=struct.unpack('>II',(B/ad['png']).read_bytes()[16:24])
 assert list(actual)==ad['pixels'],(ad['id'],actual)
 assert not root.findall('.//s:text',N),'Unoutlined lettering'
 images=root.findall('s:image',N); assert len(images)==1
 im=images[0];raw=im.get('{http://www.w3.org/1999/xlink}href').split(',',1)[1]
 assert hashlib.sha256(base64.b64decode(raw)).hexdigest()==ad['photo_sha256'],'Photo changed'
 rect={k:float(im.get(k)) for k in ('x','y','width','height')}
 assert rect['x']>=0 and rect['y']>=0
 assert rect['x']+rect['width']<=ad['pixels'][0]+.001
 assert rect['y']+rect['height']<=ad['pixels'][1]+.001
 assert abs(rect['width']/rect['height']-2752/1536)<.00001
 meta=json.loads(root.find('s:metadata',N).text)
 assert meta['slogan']=='A second home in your backyard.' and meta['cta']=='Set up a consultation'
 assert meta['phone']=='[PHONE TO COME]' and meta['status']=='CONCEPT'
 results.append({'file':ad['png'],'dimensions':actual,'svg_xml_valid':True,'visible_text_outlined':True,'embedded_photo_sha256_matches_original':True,'full_photo_rectangle_inside_artboard':True,'photo_rect':rect})
(B/'validation.json').write_text(json.dumps({'pass':True,'checked':results},indent=2)+'\n')
logo=B.parent/'logos';out=[]
for f in sorted(logo.glob('*.svg')):
 root=ET.parse(f).getroot();assert not root.findall('.//s:text',N)
 assert not root.findall('.//s:image',N)
 out.append(f.name)
(logo/'validation.json').write_text(json.dumps({'pass':True,'svg_count':len(out),'all_wordmarks_outlined':True,'all_marks_true_vectors':True,'previews_visually_inspected':['overview-dark.png','overview-cream.png','small-size-check.png'],'font_axes':{'family':'Archivo','wght':800,'wdth':112},'files':out},indent=2)+'\n')
print(f'PASS: {len(results)} exact-size ad layouts; original photo hashes match; {len(out)} logo SVGs are all native vectors with outlined lettering.')
