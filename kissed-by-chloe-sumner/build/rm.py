import os,functools,http.server,socketserver,socket,threading
from playwright.sync_api import sync_playwright
SITE=os.path.abspath(".")
with socket.socket() as s: s.bind(("127.0.0.1",0)); port=s.getsockname()[1]
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
class T(socketserver.ThreadingMixIn, socketserver.TCPServer): daemon_threads=True
T.allow_reuse_address=True
httpd=T(("127.0.0.1",port), functools.partial(Q,directory=SITE)); threading.Thread(target=httpd.serve_forever,daemon=True).start()
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={"width":390,"height":844},device_scale_factor=2,is_mobile=True,has_touch=True,reduced_motion="reduce")
    pg=ctx.new_page(); pg.goto(f"http://127.0.0.1:{port}/index.html",wait_until="load"); pg.wait_for_timeout(400)
    pg.screenshot(path="review/reduced-motion-390.png")
    print("clip-path on mark:", pg.evaluate("()=>getComputedStyle(document.querySelector('.ms-mark')).clipPath"))
    print("actions opacity:", pg.evaluate("()=>getComputedStyle(document.querySelector('.ms-actions')).opacity"))
    b.close()
