import os,functools,http.server,socketserver,socket,threading
from playwright.sync_api import sync_playwright
SITE=os.path.abspath(".")
with socket.socket() as s: s.bind(("127.0.0.1",0)); port=s.getsockname()[1]
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
class T(socketserver.ThreadingMixIn, socketserver.TCPServer): daemon_threads=True
T.allow_reuse_address=True
httpd=T(("127.0.0.1",port), functools.partial(Q,directory=SITE)); threading.Thread(target=httpd.serve_forever,daemon=True).start()
base=f"http://127.0.0.1:{port}/index.html"
with sync_playwright() as p:
    b=p.chromium.launch()
    for tag,w,h,mob in [("390",390,844,True),("1440",1440,900,False)]:
        ctx=b.new_context(viewport={"width":w,"height":h},device_scale_factor=2,is_mobile=mob,has_touch=mob)
        pg=ctx.new_page(); pg.goto(base,wait_until="load"); pg.wait_for_timeout(1800)
        pg.evaluate("document.querySelector('#signature').scrollIntoView({block:'start'})"); pg.wait_for_timeout(900)
        pg.click(".hanger:nth-of-type(1)"); pg.wait_for_timeout(1100)
        pg.screenshot(path=f"review/gadget-{tag}-boots.png")
        pg.click(".hanger:nth-of-type(5)"); pg.wait_for_timeout(1100)
        pg.screenshot(path=f"review/gadget-{tag}-junk.png")
        pg.click(".hanger:nth-of-type(5)"); pg.wait_for_timeout(900)
        pg.screenshot(path=f"review/gadget-{tag}-cleared.png")
        pg.evaluate("document.querySelector('#shop').scrollIntoView({block:'start'})"); pg.wait_for_timeout(700)
        for b2 in pg.query_selector_all(".board .unroll"): b2.click(); pg.wait_for_timeout(500)
        pg.wait_for_timeout(700)
        pg.screenshot(path=f"review/boards-{tag}-open.png", full_page=(tag=="1440"))
        print("ok",tag)
        ctx.close()
    b.close()
