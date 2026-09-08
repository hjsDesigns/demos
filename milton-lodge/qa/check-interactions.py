"""Actual viewport and menu-flow checks; no calls, orders or messages."""
import functools,http.server,json,threading
from pathlib import Path
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
   c=browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce')
   page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(url,wait_until='networkidle');page.evaluate('document.fonts.ready')
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   page.screenshot(path=str(SITE/f'qa/hero-{width}.png'))
   if width<=900:
    toggle=page.locator('.nav-toggle');toggle.click();assert toggle.get_attribute('aria-expanded')=='true'
    assert toggle.get_attribute('aria-label')=='Close navigation'
    page.keyboard.press('Escape');assert toggle.get_attribute('aria-expanded')=='false';assert toggle.evaluate('(e)=>e===document.activeElement')
    toggle.click();box=page.locator('#main-nav').bounding_box();page.mouse.click(8,min(height-10,box['y']+box['height']+32));assert toggle.get_attribute('aria-expanded')=='false'
    toggle.click();page.locator('#main-nav a[href="#signature"]').click();assert toggle.get_attribute('aria-expanded')=='false'
   ok(f'navigation {width}','Toggle/Escape/focus/outside click/link-close correct where applicable; no horizontal overflow.')
   for key,n in [('burgers',4),('barfood',4),('breakfast',2)]:
    button=page.locator(f'[data-menu="{key}"]');button.click()
    assert button.get_attribute('aria-pressed')=='true'
    assert page.locator('.menu-tabs button[aria-pressed="true"]').count()==1
    assert page.locator('.menu-panel:not([hidden])').count()==1
    assert page.locator(f'#menu-{key} .dish').count()==n
    assert page.locator('#'+button.get_attribute('aria-controls')).is_visible()
    assert button.inner_text() in page.locator('#menu-status').inner_text()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   page.locator('[data-menu="barfood"]').focus();page.keyboard.press('Enter');assert page.locator('#menu-barfood').is_visible()
   page.locator('[data-menu="breakfast"]').focus();page.keyboard.press('Space');assert page.locator('#menu-breakfast').is_visible()
   for im in page.locator('main img').all():
    if im.is_visible():im.scroll_into_view_if_needed()
    im.evaluate('(e)=>e.decode()');assert im.get_attribute('alt')
   for section in ['signature','gallery','about','contact']:
    page.evaluate('(id)=>window.scrollTo(0,document.getElementById(id).offsetTop-90)',section)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    page.screenshot(path=str(SITE/f'qa/{section}-{width}.png'))
   assert not errors,errors
   ok(f'menu and downstream flow {width}','All three categories/counts/selected states, keyboard Enter/Space, live announcement and image decode pass; menu/room/story/contact screenshots captured; no errors or overflow.')
   c.close()
  c=browser.new_context(viewport={'width':390,'height':844},java_script_enabled=False)
  page=c.new_page();page.goto(url,wait_until='networkidle')
  assert page.locator('.menu-tabs').is_hidden()
  assert page.locator('.menu-panel:visible').count()==3 and page.locator('.dish').count()==10
  assert page.locator('.story-copy').evaluate('(e)=>getComputedStyle(e).opacity')=='1'
  assert page.locator('form').count()==0 and page.locator('.price').count()==0
  assert page.locator('#statusLine').count()==0
  hrefs=page.locator('a').evaluate_all('es=>es.map(e=>e.getAttribute("href"))')
  assert len([h for h in hrefs if h=='tel:+12539224277'])==3
  assert any('destination=7320%20Pacific%20Hwy%20E' in h for h in hrefs)
  assert any('singleplatform.com/the-milton-lodge/menu' in h for h in hrefs)
  body=page.inner_text('body').lower();assert 'daily from 7 am' in body and 'current prices' in body and 'closing hours' in body
  assert 'open now' not in body and '11 pm' not in body and '10 pm' not in body
  assert 'captured september 5, 2026' in body
  ok('No JavaScript and factual boundaries','All10 real menu dishes and core copy remain; exact phone/maps/menu actions; no simulated ordering, unverified prices/closing status or invented review date.')
  browser.close()
finally:
 server.shutdown();(SITE/'qa/interactions.json').write_text(json.dumps(results,indent=2)+'\n')
