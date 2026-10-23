from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image
import zipfile,hashlib,json,re
site=Path(__file__).resolve().parents[1]
index=(site/'index.html').read_text()
assets=set(re.findall(r'(?:src|href)="((?:images|css|js)/[^"]+)"',index));files=['index.html']+sorted(assets)
package=site/'packages/milton-lodge-preview.zip'
with zipfile.ZipFile(package,'w',zipfile.ZIP_DEFLATED) as z:
 for name in files:z.write(site/name,name)
for f in (site/'images').glob('*.jpg'):
 assert f.stat().st_size>20000
 with Image.open(f) as im:im.verify()
with zipfile.ZipFile(package) as z:
 for name in files:assert z.read(name)==(site/name).read_bytes()
 assert len([v for v in z.namelist() if v.endswith('.jpg')])==9
with sync_playwright() as p:
 b=p.chromium.launch()
 for width in [390,1440]:
  page=b.new_page(viewport={'width':width,'height':844},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto((site/'artifact.html').as_uri(),wait_until='networkidle')
  assert page.locator('main img').count()==9
  for im in page.locator('main img').all():
   assert im.get_attribute('src').startswith('data:image/')
   if im.is_visible():im.scroll_into_view_if_needed()
   im.evaluate('(e)=>e.decode()')
  for key in ['burgers','barfood','breakfast']:
   button=page.locator(f'[data-menu="{key}"]');button.click()
   assert page.locator(f'#menu-{key}').is_visible()
   assert page.locator('.menu-panel:not([hidden])').count()==1
  if width==390:
   assert page.locator('.hero-mobile').is_visible()
   assert page.locator('.hero-mobile').evaluate('(e)=>getComputedStyle(e).objectFit')=='contain'
   page.locator('.nav-toggle').click();assert page.locator('.nav-toggle').get_attribute('aria-expanded')=='true';page.keyboard.press('Escape')
  else:assert page.locator('.hero-desktop').is_visible()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  assert not errors,errors
  page.close()
 b.close()
sha=hashlib.sha256((site/'index.html').read_bytes()).hexdigest()
logs=[(site/f'qa/factory-green-{i}.log').read_text() for i in [1,2]]
assert all('QA: 20 passed, 0 failed, 0 warnings' in t and sha in t for t in logs)
cls=[re.search(r'cumulative layout shift = ([.\d]+)',t).group(1) for t in logs]
result={'business':'Milton Lodge Bar and Grill','slug':'milton-lodge','status':'local-preview-ready-for-batch-review','site_dir':str(site),'proposed_price':1500,'original_price_range':[1000,1500],'public_deploy':False,'outreach':False,'index_sha256':sha,'package':str(package),'standalone':str(site/'artifact.html'),'real_business_photos_used':8,'genuine_logo_assets':1,'accepted_photo_candidates':11,'photo_source':'Exact Milton Restaurantji gallery; source URLs and credits in photo-manifest.json','photo_limits':['Current exterior unavailable; old Milton Tavern image excluded','Owner photo rights/currentness/choices pending'],'factory_qa':[{'pass':20,'fail':0,'warn':0,'cls':v} for v in cls],'interaction_viewports':[360,390,736,768,1024,1440],'interactions':'Mobile nav Escape/outside/link close and focus; all3 menu categories/counts/selected state/live announcement/Enter/Space; all images; downstream sections; no-JS10 dishes. Passed.','artifact_qa':'390 and1440; all9 embedded image assets, menu choices, mobile nav and uncropped phone hero, no overflow or page errors. ZIP source bytes matched.','owner_confirm':['Current weekly/kitchen/holiday closing hours','Current menu prices and availability','Current owner identity; historical Shawna Bell verified2018 only','Exact Google review publication dates; capture date labeled','Photo approval/rights and new exterior photo','Actual existing ordering provider, if any'],'board_row_proposed':{'stage':'demo-ready (local, pending Hayden batch review)','tier':'$1,500 proposed; original$1,000–$1,500','link':'Local preview; no public URL','next_action':'Hayden batch review; confirm menu prices/full hours/current owner and photo choices','last_touch':'2026-09-05 research/build; no outreach'}}
(site/'BUILD-RESULT.json').write_text(json.dumps(result,indent=2)+'\n')
(site/'qa/package-check.json').write_text(json.dumps({'result':'pass','public_files':files,'real_business_photo_count':8,'logo_count':1,'zip_bytes':package.stat().st_size,'artifact_bytes':(site/'artifact.html').stat().st_size,'index_sha256':sha,'artifact_viewports':[390,1440]},indent=2)+'\n')
print(json.dumps({'sha256':sha,'factory_qa':'20/0/0 twice','cls':cls,'zip_bytes':package.stat().st_size,'photos':8,'logo':1,'artifact_check':'pass'},indent=2))
