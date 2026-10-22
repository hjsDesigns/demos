"""Google reviews for Tacos los Queretaros (Edgewood) via a warmed persistent
Chromium profile. No CID was harvested on 9/6, so step 1 resolves the place from
a Maps search (the URL's !1s0x..:0x.. hex -> decimal cid), then step 2 loads the
plain /maps?cid= panel, which is the only view that renders review cards headlessly."""
import asyncio, json, os, re
from playwright.async_api import async_playwright

QUERY = "Tacos los Queretaros 3420 Meridian Ave E Edgewood WA"
PROFILE = "/private/tmp/claude-501/-Users-haydenstevenson/362c3c1e-fa95-49f1-8608-c4769305554e/scratchpad/tlq-profile"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "harvest-0906/greviews-pw.json")


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

        # warm the profile: consent + a plain maps load first
        await pg.goto("https://www.google.com/maps", wait_until="domcontentloaded", timeout=60000)
        await pg.wait_for_timeout(3500)
        for sel in ['button:has-text("Accept all")', 'button:has-text("Reject all")',
                    'form[action*="consent"] button']:
            try:
                if await pg.locator(sel).count():
                    await pg.locator(sel).first.click(); await pg.wait_for_timeout(3000); break
            except Exception:
                pass

        # step 1 — resolve the place
        await pg.goto("https://www.google.com/maps/search/" + QUERY.replace(" ", "+") + "?hl=en&gl=us",
                      wait_until="domcontentloaded", timeout=60000)
        await pg.wait_for_timeout(7000)
        url = pg.url
        print("SEARCH URL", url[:200])
        m = re.search(r"!1s(0x[0-9a-f]+):(0x[0-9a-f]+)", url)
        if not m:
            html = await pg.content()
            m = re.search(r"(0x[0-9a-f]{12,}):(0x[0-9a-f]{12,})", html)
        cid = None
        if m:
            cid = str(int(m.group(2), 16))
            print("CID", cid)
        else:
            print("CID NOT FOUND — staying on the search result panel")

        # step 2 — the cid panel
        if cid:
            await pg.goto(f"https://www.google.com/maps?cid={cid}&hl=en&gl=us",
                          wait_until="domcontentloaded", timeout=60000)
            await pg.wait_for_timeout(6000)
        print("TITLE", await pg.title())

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

        for _ in range(25):
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
        revs = []
        for i in range(min(n, 80)):
            c = cards.nth(i)

            async def g(sel, attr=None, c=c):
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
            if nm:
                revs.append(dict(name=nm, img=img, stars=st, when=wn, text=tx))
        json.dump(dict(cid=cid, reviews=revs), open(OUT, "w"), indent=1)
        print("REVIEWS", len(revs))
        for r in revs[:30]:
            print("|", r['name'], "|", r['stars'], "|", r['when'], "|",
                  (r['text'] or "").replace("\n", " ")[:140], "|", "IMG" if r['img'] else "no-img")
        await ctx.close()

asyncio.run(main())
