import re,json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image
base=Path(__file__).resolve().parents[2]
with sync_playwright() as p:
 browser=p.chromium.launch()
 for slug in [Path(__file__).resolve().parents[1].name]:
  site=base/slug;results=[]
  for w,h in [(360,800),(390,844),(736,1024),(768,1024),(1024,900),(1440,900)]:
   c=browser.new_context(viewport={'width':w,'height':h},reduced_motion='reduce');page=c.new_page();errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
   page.goto((site/'index.html').as_uri(),wait_until='networkidle');page.evaluate('document.fonts.ready')
   for section in page.locator('main>section').all():
    section.scroll_into_view_if_needed()
    for im in section.locator('img').all():im.evaluate('(e)=>e.decode()')
    bad=section.evaluate('e=>Array.from(e.querySelectorAll("h1,h2,h3,p,a,button,figure,img,.price")).filter(x=>{let r=x.getBoundingClientRect();return r.width&&r.height&&(r.left < -1 || r.right > innerWidth+1 || x.scrollWidth>x.clientWidth+2)}).map(x=>({tag:x.tagName,cls:x.className,text:x.textContent.slice(0,70)}))')
    assert not bad,(slug,w,section.get_attribute('id'),bad)
    if w in [390,1440]:
     page.evaluate('(e)=>scrollTo(0,Math.max(0,e.offsetTop-86))',section.element_handle());page.screenshot(path=str(site/f'qa/flow-{section.get_attribute("id")}-{w}.png'))
   hrefs=page.locator('a').evaluate_all('es=>es.map(e=>e.getAttribute("href"))')
   for href in hrefs:
    if href.startswith('#'):assert page.locator(href).count()==1,(slug,href)
    elif not re.match(r'(https?:|tel:|mailto:|data:)',href):assert (site/href.split('?')[0].split('#')[0]).is_file(),(slug,href)
   assert not errs,errs
   page.evaluate('scrollTo(0,0)')
   if w in [390,1440]:
    path=site/f'qa/flow-after-{w}.png';page.screenshot(path=str(path),full_page=True)
    im=Image.open(path);im.thumbnail((w//2,9000));im.convert('RGB').save(site/f'qa/flow-after-{w}.jpg')
   results.append({'width':w,'result':'pass','sections_checked':page.locator('main>section').count(),'internal_links':'all resolve','page_errors':errs});c.close()
  (site/'qa/flow-journeys.json').write_text(json.dumps(results,indent=2)+'\n');print(slug,'flow passed',flush=True)
 browser.close()
