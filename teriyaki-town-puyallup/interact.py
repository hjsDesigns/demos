import asyncio, os
from playwright.async_api import async_playwright
SITE = os.path.dirname(os.path.abspath(__file__))
URL = "file://" + os.path.join(SITE, "index.html")

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width":390,"height":844}, device_scale_factor=2,
            is_mobile=True, has_touch=True,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1")
        pg = await ctx.new_page()
        errs = []
        pg.on("console", lambda m: errs.append(m.type + ": " + m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
        await pg.goto(URL, wait_until="load"); await pg.wait_for_timeout(2500)

        # --- gadget ---
        await pg.locator("#signature").scroll_into_view_if_needed(); await pg.wait_for_timeout(700)
        print("rest chip:", await pg.locator("#plateChip").inner_text(), "| name:", await pg.locator("#plateName").inner_text())
        codes = []
        for i in range(5):
            btn = pg.locator(".plate").nth(i)
            await btn.click(); await pg.wait_for_timeout(420)
            codes.append((await pg.locator("#plateChip").inner_text(), await pg.locator("#plateName").inner_text(),
                          await pg.locator("#plateShown").get_attribute("data-on"),
                          await btn.get_attribute("aria-pressed")))
        for c in codes: print("  tap ->", c)
        # tap the same one again clears
        await pg.locator(".plate").nth(4).click(); await pg.wait_for_timeout(300)
        print("re-tap clears:", await pg.locator("#plateChip").inner_text(),
              "| pressed:", await pg.locator(".plate").nth(4).get_attribute("aria-pressed"))
        await pg.locator("#signature").screenshot(path=os.path.join(SITE,"review/gadget-390.png"))
        # one selected, for the shot
        await pg.locator(".plate").nth(0).click(); await pg.wait_for_timeout(600)
        await pg.locator("#signature").screenshot(path=os.path.join(SITE,"review/gadget-390-on.png"))

        # --- unroll cards ---
        await pg.locator("#menu").scroll_into_view_if_needed(); await pg.wait_for_timeout(500)
        for i in range(6):
            u = pg.locator(".board .unroll").nth(i)
            await u.click(); await pg.wait_for_timeout(320)
            exp = await u.get_attribute("aria-expanded")
            rolled_h = await pg.locator(".board .rolled").nth(i).evaluate("e=>e.getBoundingClientRect().height")
            print(f"  board {i}: expanded={exp} height={round(rolled_h)}")
        await pg.locator(".board").nth(0).screenshot(path=os.path.join(SITE,"review/board-open-390.png"))
        # close one again
        await pg.locator(".board .unroll").nth(0).click(); await pg.wait_for_timeout(500)
        print("board 0 closed:", await pg.locator(".board .unroll").nth(0).get_attribute("aria-expanded"),
              round(await pg.locator(".board .rolled").nth(0).evaluate("e=>e.getBoundingClientRect().height")))

        # --- nav ---
        await pg.evaluate("window.scrollTo(0,0)"); await pg.wait_for_timeout(400)
        await pg.locator(".nav-toggle").click(); await pg.wait_for_timeout(450)
        print("nav open:", await pg.locator("#main-nav").evaluate("e=>e.classList.contains('open')"))
        await pg.screenshot(path=os.path.join(SITE,"review/nav-390.png"))
        await pg.locator(".nav-toggle").click(); await pg.wait_for_timeout(350)

        # --- anchors + images ---
        bad = await pg.evaluate("""() => {
          const out={anchors:[],imgs:[],alt:[]};
          document.querySelectorAll('a[href^="#"]').forEach(a=>{
            const id=a.getAttribute('href').slice(1);
            if(id && !document.getElementById(id)) out.anchors.push(a.getAttribute('href'));
          });
          document.querySelectorAll('img').forEach(i=>{
            if(!i.complete || i.naturalWidth===0) out.imgs.push(i.getAttribute('src'));
            if(!i.hasAttribute('alt')) out.alt.push(i.getAttribute('src'));
          });
          return out;
        }""")
        print("broken anchors:", bad["anchors"])
        print("broken images:", bad["imgs"])
        print("missing alt:", bad["alt"])
        print("h-overflow:", await pg.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth"))
        print("console errors:", errs)
        await b.close()

asyncio.run(main())
