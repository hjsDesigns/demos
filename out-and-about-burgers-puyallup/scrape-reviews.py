"""Google reviews for Out & About Burgers via a warmed persistent Chromium
profile. No cid on file, so this searches Maps first, opens the place, then
reads the review cards (name + real profile image + stars + date + text)."""
import asyncio, json, os
from playwright.async_api import async_playwright

Q = "Out & About Burgers, 14214 Meridian E, Puyallup, WA 98373"
PROFILE = "/private/tmp/claude-501/-Users-haydenstevenson/362c3c1e-fa95-49f1-8608-c4769305554e/scratchpad/oab-profile"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reviews2.json")


async def main():
    os.makedirs(PROFILE, exist_ok=True)
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context(
            PROFILE, headless=True,
            viewport={"width": 1400, "height": 1200},
            locale="en-US", timezone_id="America/Los_Angeles",
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                       "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            args=["--disable-blink-features=AutomationControlled"])
        pg = ctx.pages[0] if ctx.pages else await ctx.new_page()

        await pg.goto("https://www.google.com/maps", wait_until="domcontentloaded", timeout=60000)
        await pg.wait_for_timeout(3500)
        for sel in ['button:has-text("Accept all")', 'button:has-text("Reject all")',
                    'form[action*="consent"] button']:
            try:
                if await pg.locator(sel).count():
                    await pg.locator(sel).first.click(); await pg.wait_for_timeout(3000); break
            except Exception:
                pass

        url = "https://www.google.com/maps/search/" + Q.replace(" ", "+") + "?hl=en&gl=us"
        await pg.goto(url, wait_until="domcontentloaded", timeout=60000)
        await pg.wait_for_timeout(7000)
        print("URL", pg.url[:160])
        print("TITLE", await pg.title())

        # if a result list came back, open the first card
        try:
            res = pg.locator('a[href*="/maps/place/"]')
            if await res.count():
                await res.first.click()
                await pg.wait_for_timeout(6000)
                print("clicked result ->", pg.url[:160])
        except Exception as e:
            print("no result click", e)

        opened = False
        for sel in ['button[aria-label*="Reviews for"]',
                    'div[role="tablist"] button:has-text("Reviews")',
                    'button:has-text("Reviews")',
                    'button[jsaction*="moreReviews"]']:
            try:
                if await pg.locator(sel).count():
                    await pg.locator(sel).first.click(); await pg.wait_for_timeout(5000)
                    opened = True; print("opened via", sel); break
            except Exception:
                pass
        print("opened?", opened)

        for _ in range(60):
            try:
                f = pg.locator('div[role="feed"]')
                if await f.count():
                    await f.first.evaluate("e=>e.scrollBy(0,3500)")
                else:
                    await pg.mouse.wheel(0, 3000)
            except Exception:
                await pg.mouse.wheel(0, 3000)
            await pg.wait_for_timeout(750)

        try:
            more = pg.locator('button[aria-label="See more"]')
            for i in range(min(await more.count(), 40)):
                try:
                    await more.nth(i).click(); await pg.wait_for_timeout(90)
                except Exception:
                    pass
        except Exception:
            pass

        cards = pg.locator('div[data-review-id]')
        n = await cards.count(); print("CARDS", n)
        revs, seen = [], set()
        for i in range(min(n, 120)):
            c = cards.nth(i)

            async def g(sel, attr=None):
                try:
                    l = c.locator(sel).first
                    if not await l.count():
                        return ""
                    return (await l.get_attribute(attr)) if attr else (await l.inner_text()).strip()
                except Exception:
                    return ""
            nm = await g('.d4r55')
            img = await g('img[src*="googleusercontent"]', 'src')
            st = await g('span[role="img"]', 'aria-label')
            wn = await g('.rsqaWe')
            tx = await g('.wiI7pd')
            key = (nm, tx)
            if nm and key not in seen:
                seen.add(key)
                revs.append(dict(name=nm, img=img, stars=st, when=wn, text=tx))
        json.dump(revs, open(OUT, "w"), indent=1)
        print("REVIEWS", len(revs))
        for r in revs[:40]:
            print("|", r['name'], "|", r['stars'], "|", r['when'], "|",
                  (r['text'] or "").replace("\n", " ")[:130], "|", "IMG" if r['img'] else "no-img")
        await ctx.close()

asyncio.run(main())
