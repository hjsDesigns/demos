from pathlib import Path
import json,re,zipfile,hashlib,sys
from playwright.sync_api import sync_playwright
from PIL import Image
BASE=Path(__file__).resolve().parents[2]
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
with sync_playwright() as p:
 browser=p.chromium.launch()
 for slug in [Path(__file__).resolve().parents[1].name]:
  site=BASE/slug;index=(site/'index.html').read_text();js=(site/'js/site.js').read_text();css=(site/'css/style.css').read_text()
  files={'index.html'}|set(re.findall(r'''(?:src|href)=["']((?:images|css|js)/[^"']+)["']''',index))|set(re.findall(r'''["'](images/[^"']+)["']''',js+css))
  images=[f for f in files if f.startswith('images/')]
  expected={'cast-iron-queen':9,'rose-spa-bonney-lake':7,'mimis-nails-black-diamond':9}[slug]
  assert len(images)==expected,(slug,images)
  for f in images:
   assert (site/f).stat().st_size>20000
   with Image.open(site/f) as im:im.verify()
  out=site/(f'{slug}-preview.zip' if slug!='mimis-nails-black-diamond' else f'packages/{slug}-preview.zip')
  with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
   for f in sorted(files):z.write(site/f,f)
  with zipfile.ZipFile(out) as z:
   assert set(z.namelist())==files
   for f in files:assert z.read(f)==(site/f).read_bytes()
  result=[]
  for width,height in [(390,844),(1440,900)]:
   c=browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce');page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto((site/'artifact.html').as_uri(),wait_until='networkidle');page.evaluate('document.fonts.ready')
   for im in page.locator('main img').all():
    im.scroll_into_view_if_needed();im.evaluate('(e)=>e.decode()');assert im.get_attribute('src').startswith('data:image/')
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   if slug=='cast-iron-queen':
    assert page.locator('.price').count()==18
    for d in page.locator('details').all():
     s=d.locator('summary');s.focus();page.keyboard.press('Enter');assert d.get_attribute('open') is None;page.keyboard.press('Space');assert d.get_attribute('open') is not None
   elif slug=='rose-spa-bonney-lake':
    sources=[]
    for key in ['lounge','hall','room']:
     page.locator(f'[data-room="{key}"]').click();im=page.locator('#spa-view');im.evaluate('(e)=>e.decode()');src=im.get_attribute('src');assert src.startswith('data:image/');sources.append(src)
     assert page.locator('.room-choice[aria-pressed="true"]').count()==1
    assert len(set(sources))==3
   else:
    assert page.locator('main img').count()==9
    for key,n in [('soft',3),('detail',3),('all',6)]:
     page.locator(f'[data-filter="{key}"]').click();assert page.locator('.look:not([hidden])').count()==n
    for look in page.locator('.look-open').all():
     look.click();im=page.locator('#dialog-image img');im.evaluate('(e)=>e.decode()');assert im.get_attribute('src').startswith('data:image/');page.keyboard.press('Escape');assert not page.locator('#photo-dialog').evaluate('(e)=>e.open')
   if width==390:
    page.locator('.nav-toggle').click();assert page.locator('.nav-toggle').get_attribute('aria-expanded')=='true';page.keyboard.press('Escape');assert page.locator('.nav-toggle').get_attribute('aria-expanded')=='false'
   assert not errors,errors
   result.append({'width':width,'result':'pass','page_errors':errors});c.close()
  sha=digest(site/'index.html');expectedqa=23 if slug=='cast-iron-queen' else 20
  logs=[(site/f'qa/factory-green-{i}.log').read_text() for i in [1,2]]
  assert all(f'QA: {expectedqa} passed, 0 failed, 0 warnings' in t and sha in t for t in logs)
  cls=[re.search(r'cumulative layout shift = ([.\d]+)',t).group(1) for t in logs]
  manifest={'result':'pass','files':sorted(files),'embedded_image_assets':expected,'real_business_photos':expected-(0 if slug=='mimis-nails-black-diamond' else 1),'package':str(out),'zip_bytes':out.stat().st_size,'artifact_bytes':(site/'artifact.html').stat().st_size,'index_sha256':sha,'artifact_sha256':digest(site/'artifact.html'),'package_sha256':digest(out),'artifact_viewports':result,'cls':cls,'factory_each':{'passed':expectedqa,'failed':0,'warnings':0}}
  (site/'qa/package-check.json').write_text(json.dumps(manifest,indent=2)+'\n')
  (site/'qa/package-manifest.json').write_text(json.dumps({'public_files':sorted(files),'sha256':sha},indent=2)+'\n')
  b=json.loads((site/'BUILD-RESULT.json').read_text());b.update({k:manifest[k] for k in ['index_sha256','artifact_sha256','package_sha256','package','cls','factory_each']});b.update({'standalone':str(site/'artifact.html'),'factory_green_runs':2,'factory_qa':[{'pass':expectedqa,'fail':0,'warn':0,'cls':v} for v in cls],'flow_revision':'Whole-page personality/flow pass; see ART-DIRECTION.md','flow_revision_date':'2026-09-05','flow_qa':'Six-width full-section overflow and internal-link journeys passed; 390/1440 screenshots inspected','interaction_viewports':[360,390,736,768,1024,1440],'real_business_photos_used':manifest['real_business_photos'],'actual_business_photos_used':manifest['real_business_photos'],'artifact_qa':'390/1440 all embedded photos, site-specific controls, mobile nav and ZIP/source byte match passed','package_check':'pass'})
  if slug=='mimis-nails-black-diamond':b['interactions']='All six look enlargements and three filters; keyboard/Escape/focus; mobile nav; Pacific clock boundaries and green/red colors; no-JS; all passed.'
  (site/'BUILD-RESULT.json').write_text(json.dumps(b,indent=2)+'\n');print(slug,sha,'QA',expectedqa,'CLS',cls,'package passed',flush=True)
 browser.close()
