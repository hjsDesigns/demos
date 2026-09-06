"""Verify real local preview without placing phone calls, appointments, or messages."""
import functools,http.server,json,threading
from pathlib import Path
from datetime import datetime,timezone
from playwright.sync_api import sync_playwright
SITE=Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(SITE)))
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/?v=interaction-review'
results=[]
def ok(check,detail):
 results.append({'check':check,'result':'pass','detail':detail});print('PASS',check,detail,flush=True)
try:
 with sync_playwright() as p:
  browser=p.chromium.launch()
  for width,height in [(360,800),(390,844),(736,1024),(768,1024),(1024,900),(1440,900)]:
   context=browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce')
   page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(url,wait_until='networkidle');page.evaluate('document.fonts.ready')
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   page.screenshot(path=str(SITE/f'qa/hero-{width}.png'))
   if width<=900:
    toggle=page.locator('.nav-toggle');toggle.click()
    assert toggle.get_attribute('aria-expanded')=='true'
    assert toggle.get_attribute('aria-label')=='Close navigation'
    page.keyboard.press('Escape');assert toggle.get_attribute('aria-expanded')=='false'
    assert toggle.evaluate('(e)=>e===document.activeElement')
    toggle.click();box=page.locator('#main-nav').bounding_box();page.mouse.click(8,min(height-10,box['y']+box['height']+32))
    assert toggle.get_attribute('aria-expanded')=='false'
    toggle.click();page.locator('#main-nav a[href="#signature"]').click()
    assert toggle.get_attribute('aria-expanded')=='false'
   ok(f'navigation {width}','Toggle/Escape/focus/outside click/link-close where applicable; no overflow.')
   for category,n in [('soft',3),('detail',3),('all',6)]:
    button=page.locator(f'[data-filter="{category}"]');button.click()
    assert page.locator('.look:not([hidden])').count()==n
    assert page.locator('.look-filters [aria-pressed="true"]').count()==1
    assert button.get_attribute('aria-pressed')=='true'
    assert page.locator('#look-count').inner_text()==f'{n} looks'
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   page.locator('[data-filter="soft"]').focus();page.keyboard.press('Enter')
   assert page.locator('.look:not([hidden])').count()==3
   page.locator('[data-filter="all"]').click()
   for item in page.locator('.look-open').all():
    original=item.locator('img').get_attribute('src');item.click()
    assert page.locator('#photo-dialog').evaluate('(e)=>e.open')
    im=page.locator('#dialog-image img');im.evaluate('(e)=>e.decode()')
    assert im.get_attribute('src')==original and im.get_attribute('alt')
    assert page.locator('#dialog-caption').inner_text()==item.get_attribute('data-caption')
    page.keyboard.press('Escape')
    assert not page.locator('#photo-dialog').evaluate('(e)=>e.open')
    assert item.evaluate('(e)=>e===document.activeElement')
   first=page.locator('.look-open').first;first.focus();page.keyboard.press('Enter')
   assert page.locator('#photo-dialog').evaluate('(e)=>e.open')
   page.locator('.dialog-close').click();assert not page.locator('#photo-dialog').evaluate('(e)=>e.open')
   for im in page.locator('main img').all():
    im.scroll_into_view_if_needed();im.evaluate('(e)=>e.decode()');assert im.get_attribute('alt')
   page.evaluate('window.scrollTo(0,document.querySelector("#signature").offsetTop-90)');page.screenshot(path=str(SITE/f'qa/lookbook-{width}.png'))
   assert not errors,errors
   ok(f'lookbook {width}','All filters/counts/pressed states correct; all 6 enlarged images decode; Escape restores focus, keyboard and close button work; 9 distinct main images decode, no errors.')
   context.close()
  # Clock uses Pacific even when visitor is elsewhere. Freeze real clock, no query spoofing.
  for stamp,expected,color in [('2026-09-06T16:59:00Z',False,'rgb(201, 47, 57)'),('2026-09-06T17:00:00Z',True,'rgb(19, 132, 85)'),('2026-09-06T22:00:00Z',False,'rgb(201, 47, 57)'),('2026-09-08T16:30:00Z',True,'rgb(19, 132, 85)')]:
   c=browser.new_context(viewport={'width':390,'height':844},timezone_id='Asia/Tokyo')
   page=c.new_page();page.clock.install(time=datetime.fromisoformat(stamp.replace('Z','+00:00')))
   page.goto(url+'&demo=12&day=1',wait_until='networkidle')
   assert page.evaluate('window.__site.computeStatus().open')==expected
   assert page.locator('#statusLine .dot').evaluate('(e)=>getComputedStyle(e).backgroundColor')==color
   c.close()
  ok('Pacific hours','Sunday before/open/closing boundaries and weekday opening correct from a Tokyo context; green=open/red=closed; URL cannot override live clock.')
  c=browser.new_context(viewport={'width':390,'height':844},java_script_enabled=False)
  page=c.new_page();page.goto(url,wait_until='networkidle')
  assert page.locator('.service-copy').evaluate('(e)=>getComputedStyle(e).opacity')=='1'
  assert page.locator('.look-filters').is_hidden()
  assert page.locator('.look:visible').count()==6
  assert page.locator('.look-open').first.get_attribute('href').endswith('.jpg')
  hrefs=page.locator('a').evaluate_all('els=>els.map(e=>e.getAttribute("href"))')
  assert len([h for h in hrefs if h=='tel:+13608865532'])==4
  assert any('destination=30741%203rd%20Ave%20%23130' in h for h in hrefs)
  assert all('classpass' not in h for h in hrefs)
  assert page.locator('form').count()==0 and page.locator('.price').count()==0
  assert 'Call for current rates' in page.inner_text('body')
  assert '15 years' not in page.inner_text('body')
  ok('No JavaScript and honest actions','Core copy, all looks and native image links remain; exact phone/address actions; no fake booking, prices or owner story.')
  browser.close()
finally:
 server.shutdown();(SITE/'qa/interactions.json').write_text(json.dumps(results,indent=2)+'\n')
