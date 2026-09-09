import asyncio, json, os
from playwright.async_api import async_playwright
CID="13629777111836389513"
PROFILE="/private/tmp/claude-501/-Users-haydenstevenson/362c3c1e-fa95-49f1-8608-c4769305554e/scratchpad/wayne-profile"
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),"harvest-0906/photo-urls.json")
async def main():
    async with async_playwright() as p:
        ctx=await p.chromium.launch_persistent_context(PROFILE,headless=True,
            viewport={"width":1400,"height":1200},locale="en-US",timezone_id="America/Los_Angeles",
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            args=["--disable-blink-features=AutomationControlled"])
        pg=ctx.pages[0] if ctx.pages else await ctx.new_page()
        await pg.goto(f"https://www.google.com/maps?cid={CID}&hl=en&gl=us",wait_until="domcontentloaded",timeout=60000)
        await pg.wait_for_timeout(6000)
        # the tablist in the place panel has an Overview/Reviews/Photos tab set
        got=False
        for sel in ['div[role="tablist"] button:has-text("Photos")','button[aria-label*="Photos of"]','button[aria-label="Photos"]']:
            if await pg.locator(sel).count():
                await pg.locator(sel).first.click(); await pg.wait_for_timeout(5000); got=True; print("tab via",sel); break
        print("tab?",got,"URL",pg.url[:120])
        # category chooser -> All
        for sel in ['button[aria-label*="All"]','div[role="tablist"] button:has-text("All")']:
            try:
                if await pg.locator(sel).count():
                    await pg.locator(sel).first.click(); await pg.wait_for_timeout(3000); print("cat",sel); break
            except: pass
        for _ in range(25):
            try:
                fd=pg.locator('div[role="main"] > div > div[tabindex="-1"]').first
                if await fd.count(): await fd.evaluate("e=>e.scrollBy(0,2500)")
                else: await pg.mouse.wheel(0,2500)
            except: await pg.mouse.wheel(0,2500)
            await pg.wait_for_timeout(600)
        urls=await pg.evaluate("""[...document.querySelectorAll('*')].flatMap(e=>{
            const b=getComputedStyle(e).backgroundImage||''; const m=b.match(/url\\("?([^")]+)"?\\)/);
            return m&&m[1].includes('googleusercontent')?[m[1]]:[];
        }).concat([...document.images].map(i=>i.src).filter(s=>s&&s.includes('googleusercontent')))""")
        urls=[u for u in dict.fromkeys(urls) if '/a/' not in u and '/a-/' not in u]
        print("N",len(urls))
        for u in urls: print(u[:160])
        json.dump(urls,open(OUT,"w"),indent=1)
        await ctx.close()
asyncio.run(main())
