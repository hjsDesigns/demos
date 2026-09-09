import asyncio, sys, os
from playwright.async_api import async_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8791/index.html"
TAG = sys.argv[2] if len(sys.argv) > 2 else "cur"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "review")
os.makedirs(OUT, exist_ok=True)

async def shoot(p, w, h, mobile, name):
    b = await p.chromium.launch()
    ctx = await b.new_context(viewport={"width": w, "height": h}, device_scale_factor=2,
                              is_mobile=mobile, has_touch=mobile,
                              user_agent=("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 "
                                          "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1") if mobile else None)
    pg = await ctx.new_page()
    errs = []
    pg.on("console", lambda m: errs.append(m.type + ": " + m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
    await pg.goto(URL, wait_until="networkidle", timeout=60000)
    await pg.wait_for_timeout(1200)
    await pg.evaluate("()=>{document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'))}")
    # scroll through to trigger lazy images
    hgt = await pg.evaluate("()=>document.body.scrollHeight")
    y = 0
    while y < hgt:
        await pg.evaluate(f"window.scrollTo(0,{y})")
        await pg.wait_for_timeout(220)
        y += h
    await pg.evaluate("window.scrollTo(0,0)")
    await pg.wait_for_timeout(700)
    await pg.screenshot(path=os.path.join(OUT, name), full_page=True)
    bad = await pg.evaluate("()=>Array.from(document.images).filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.getAttribute('src'))")
    print(name, "height", hgt, "brokenimgs", bad)
    for e in errs[:10]:
        print("  CONSOLE", e)
    await b.close()

async def main():
    async with async_playwright() as p:
        await shoot(p, 390, 844, True, f"{TAG}-390.png")
        await shoot(p, 1440, 900, False, f"{TAG}-1440.png")

asyncio.run(main())
