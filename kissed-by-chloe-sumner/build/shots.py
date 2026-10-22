import sys, os, functools, http.server, socketserver, socket, threading, time
from playwright.sync_api import sync_playwright
SITE=os.path.abspath(".")
page_file=sys.argv[1] if len(sys.argv)>1 else "index.html"
tag=sys.argv[2] if len(sys.argv)>2 else "v"
full = "--full" in sys.argv
with socket.socket() as s:
    s.bind(("127.0.0.1",0)); port=s.getsockname()[1]
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
class T(socketserver.ThreadingMixIn, socketserver.TCPServer): daemon_threads=True
T.allow_reuse_address=True
httpd=T(("127.0.0.1",port), functools.partial(Q,directory=SITE))
threading.Thread(target=httpd.serve_forever,daemon=True).start()
base=f"http://127.0.0.1:{port}/{page_file}"
os.makedirs("review",exist_ok=True)
with sync_playwright() as p:
    b=p.chromium.launch()
    for name,w,h,mobile in [("390",390,844,True),("1440",1440,900,False)]:
        ctx=b.new_context(viewport={"width":w,"height":h},device_scale_factor=2,
                          is_mobile=mobile, has_touch=mobile)
        pg=ctx.new_page(); pg.goto(base,wait_until="load"); pg.wait_for_timeout(2500)
        if full:
            H=pg.evaluate("()=>document.body.scrollHeight")
            y=0
            while y<H:
                pg.evaluate(f"window.scrollTo(0,{y})"); pg.wait_for_timeout(240); y+=int(h*0.7)
            pg.evaluate("window.scrollTo(0,0)"); pg.wait_for_timeout(900)
        pg.screenshot(path=f"review/{tag}-{name}.png", full_page=full)
        print("shot", f"review/{tag}-{name}.png")
        ctx.close()
    b.close()
