# River Road Lodge — handoff (fresh build, 2026-09-06 night)

**Business:** River Road Lodge (Google name) — formerly, and still signed as, **R&R Lounge**
**Address:** 7824 River Rd E, Puyallup, WA 98371 · **Phone:** (253) 770-0669
**Slug:** `river-road-lodge-puyallup` · one page, built from `~/website-factory/template/`
**sha256 index.html:** `69ee45dbcd8635678bfd44284acb9f188480fc5286b2161682a74dca0b829b83`
**QA:** `qa/run.sh` — 22 passed / 0 failed / 0 warnings, green on three consecutive runs.
**Screenshots:** `review-0906/` — 390 (18 frames, scrolled through first so reveals fired) and 1440 (12 frames).
**Not published. demos-pages untouched. No git.**

---

## What was built

**Ground — MIRROR LAW, dark.** The room genuinely is dark: worn plank floor, whiskey-barrel
tables, low ceiling and a red neon tube running the whole length of it doing most of the
lighting. Tokens sampled off their own fascia badge (orange on black over red metal siding)
and off the ceiling neon in their photographs: `--bg #17110F`, `--bg-2 #100C0A`,
`--paper #221A17`, `--brand #E9611F` (sign orange), `--ink #F3E9DE`.
All four dark-ground overrides from the template README were swept (`.card .ico`/`.face .ini`,
`.story-copy .lede`, `.site-footer`, `.btn-cream`) plus the status band, hours list, proof
chips, print frames and form fields.

**ZONED COLOR.** Orange owns the wordmark, eyebrows and buttons. A second token, `--neon
#FF2E4C` (the ceiling tube), owns exactly one thing — the short glowing rule under every
section eyebrow, the recurring signature device (COHESION LAW). Green/red stay reserved for
the live open/closed light (STATUS LIGHT LAW): green dot when open, red when closed.

**Hero — `images/hero.jpg` / `images/hero-wide.jpg`, both cut from harvest `g27`.**
Their building at night: red siding, the OPEN tube, Rolling Rock and Corona neon in the
windows, Bud Light/Seahawks banners down the covered patio. Chosen over `g26` (the lit
roadside sign, which the parent flagged as a hero candidate) because **g26 is genuinely
out of focus at 1:1** — soft enough to read as a mistake at hero scale. g27 is the sharpest
frame in the set and it is still the exterior at night, which is when this bar is alive.
It is a vertical original (1800×4000), so the phone gets a true portrait frame and the
desktop a wide band cut from the same negative — no hero stack needed. Nothing sits over
the photo but the headline block.

**Header mark — `images/logo.png`, a straight crop of the oval badge on their own building
fascia (`g19`), leveled 11° and nothing else.** Never redrawn (NEVER RECREATE). That badge
is also where three facts on this page come from: **EST 1985**, **PUYALLUP WA.**, and the
"BAR · DARTS · POOL" lettering beside it — which is how darts got onto the page.

**Type:** Oswald (condensed display, matches the compressed lettering on their fascia) +
Barlow. Weights pinned to what Oswald actually ships — the template's `font-weight:800`
would have synthesised a fake bold, and its `-.015em` tracking closes an already-narrow
face; both corrected in the site block.

**Page order:** hero → hours band (all 7 rows, live light, address) → what's inside (4 photo
tiles) → the stage (4 prints + an honest "no printed calendar, call and ask") → every week
(2 sourced items only) → kitchen → the room after dark → reviews → find us + the name-change
note → closing band → footer.

**Signature:** none invented. Per the brief, the one-of-one is the stage, carried as a photo
strip of four real prints with plain captions. No gadget — there is no sourced weekly slate
to build one on, and a picker over unsourced content would have failed the toddler bar.

**Photos: 19 distinct, none used twice, every section carries one.**
g27 (hero, two crops) · g19 (badge) · g14 g16 g38 g8 (tiles) · g4 g18 g22 g24 (stage) ·
g28 (Thursday poster) · g6 g34 (kitchen) · g5 g36 g25 (the room) · g9 g20 g1 (find us).

**Faces.** Everyone shown on the stage is a performer mid-set. `g38` (karaoke) was cropped
to the KaraFun lyric screen and the red ceiling tube alone — the two identifiable singers
are outside the crop. `g20` was cropped to the old painted sign band, dropping the people
standing beside the bikes. `g37`, `g29`, `g32`, `g35`, and the crowd frames `g12/g13/g30/
g33/g39` were excluded for identifiable customers.

---

## Facts and where each came from

| Fact | Source |
|---|---|
| All 7 days of hours | Restaurantji listing for this address — listing name "River Road Lodge", filed under the old slug `rnr-lounge`, page updated Aug 17 2026, JSON-LD `openingHours` verbatim: `Mo 12:00-24:00, Tu 12:00-24:00, We 12:00-2:00, Th 12:00-2:00, Fr 12:00-2:00, Sa 9:00-2:00, Su 9:00-24:00`. Google's own hours agree. |
| Kitchen item names (no prices) | Restaurantji "Customers' Favorites" for the same listing, verbatim. |
| Thirsty Thursday · $2 Busch drafts | **Their own wall poster**, read off harvest `g28`/`g4`/`g21`: "THIRSTY THURSDAY / EVERY THURSDAY / $2 BUSCH DRAFTS". |
| Karaoke on weekends, with a DJ | Atly and Restaurantji both describe it as a weekend fixture with a DJ. No weekday is named anywhere, so the page says "weekends" and nothing more precise. |
| Pool tables | Atly, a Restaurantji review, and visible in `g16`/`g32`. |
| Darts | Their own fascia sign, "BAR · DARTS · POOL" (`g19`). |
| Motorcycle parking out front | Atly: "ample motorcycle parking right in front". |
| 4.3 / 228 Google reviews | The parent's own Google read, passed in the task brief. |
| Michael B., March 3 2026 · Bobby O., September 23 2024 | Verbatim, with names and dates, via the Roadtrippers mirror of their Yelp reviews. |
| Est. 1985 (footer only) | The oval badge on their own building. |

---

## PROVISIONAL — flag these before the site goes anywhere near live

1. **The 9 AM Saturday and Sunday opens.** Only the two Google-derived sources carry them;
   `usarestaurants.info` says Sat opens at 12 PM and Roadtrippers compresses the week
   differently. A 9 AM weekend open for a bar is unusual enough to be worth one phone call.
2. **4.3 / 228.** No mirror corroborates 228 — Restaurantji publishes **4.1 / 116**. The page
   ships the Google number the parent read directly; if it has moved, it is one edit.
3. **No star ratings on the two reviews.** The mirror they came from does not publish star
   counts, so none are claimed rather than invented. Add them once someone can open Yelp
   or Google directly.
4. **"Est. 1985"** is read off their sign, not off a record. Confirm with the owner.
5. **The Facebook link in the footer** points at `profile.php?id=100086200014378`, the current
   "RIVER ROAD LODGE Bar n Grill" page id (the old `R & R Lounge` page, id 100069235771264,
   still exists separately). Facebook is bot-walled, so this was not opened and confirmed —
   click it once before this link goes out.
6. **LABOR DAY (Mon Sept 7) — HOLIDAY UNCONFIRMED.** No source publishes holiday hours. The
   page shows the regular Monday row (12:00 PM – 12:00 AM) and the live light will run off
   that. If Hayden walks in Monday morning, **the bar does not open until noon.**
7. **The rename date is unknown.** The page says only that the directories haven't caught up
   — which is true and is the whole pitch angle. No date is asserted.

## Ask-client list (batched, for the walk-in)

- Menu **prices** — nothing is published anywhere. The kitchen list ships with names only.
- **Which nights do bands actually play?** There is a stage, amps and a drum kit in five
  separate photos and no published schedule at all. A real weekly or monthly slate is the
  single biggest upgrade this page can get.
- **Karaoke — which nights, what time?** "Weekends" is all that's sourced.
- Confirm the **9 AM weekend open** and whether **Labor Day** is normal hours.
- Is **Thirsty Thursday still running**, and is it still $2?
- **Owner name.** Not found: the WA LCB licensee XLSX path 404'd and the SODA endpoint
  returned nothing before the research budget ran out; the licensee entity for 7824 River
  Rd E is very likely retrievable in another five minutes if it matters for the pitch.
- Confirm the **Est. 1985** on the sign, and get the **current Facebook URL** from them.
- One unattributed Restaurantji review mentions a **tattoo shop next door** — real
  neighbourhood colour, but unattributed and unverified, so it is not on the page.

## What I'd still fix with more material

1. **A band night with a date on it.** Everything else on this page is specific; the stage
   section has to end with "call and ask" because nothing is published. One flyer photo or
   one sentence from the owner turns that into the strongest block on the site.
2. **A daylight exterior with the roadside sign sharp and in frame.** `g9` is sharp but is
   the sign alone against sky; `g26` has the sign lit above the building but is out of
   focus. A drive-by shot of the building with the new sign would give a second, brighter
   hero option.
3. **Menu prices**, which would let the kitchen section become a real priced list rather
   than a name list.

**Confidence: 82 / 100.** Hours, the weekly Thursday, the food names, both reviews, the
badge, darts and the rename angle are all sourced and citable. The gaps are prices, the
band schedule, and the 9 AM weekend open.
