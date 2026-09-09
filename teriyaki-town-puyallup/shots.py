import asyncio, sys, os
from playwright.async_api import async_playwright

SITE = os.path.dirname(os.path.abspath(__file__))
jobs = []  # (url, outfile, width, height, mobile, full)

def add(rel, out, w=390, h=844, mobile=True, full=False):
    jobs.append(("file://" + os.path.join(SITE, rel), os.path.join(SITE, out), w, h, mobile, full))

for a in sys.argv[1:]:
    parts = a.split(":")
    rel, out = parts[0], parts[1]
    w = int(parts[2]) if len(parts) > 2 else 390
    full = len(parts) > 3 and parts[3] == "full"
    add(rel, out, w, 844 if w < 500 else 900, w < 500, full)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for url, out, w, h, mobile, full in jobs:
            ctx = await b.new_context(
                viewport={"width": w, "height": h},
                device_scale_factor=2,
                is_mobile=mobile, has_touch=mobile,
                user_agent=("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 "
                            "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1") if mobile else None)
            pg = await ctx.new_page()
            await pg.goto(url, wait_until="load", timeout=45000)
            await pg.wait_for_timeout(2500)
            if full:
                # walk the page so IntersectionObserver fires every .reveal
                total = await pg.evaluate("document.body.scrollHeight")
                y = 0
                while y < total:
                    await pg.evaluate(f"window.scrollTo(0,{y})")
                    await pg.wait_for_timeout(230)
                    y += int(h * 0.8)
                    total = await pg.evaluate("document.body.scrollHeight")
                await pg.evaluate("window.scrollTo(0,0)")
                await pg.wait_for_timeout(900)
            os.makedirs(os.path.dirname(out), exist_ok=True)
            await pg.screenshot(path=out, full_page=full)
            print("shot", out, w, "full" if full else "")
            await ctx.close()
        await b.close()

asyncio.run(main())
