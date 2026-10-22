# Pioneer Antique Mall — HANDOFF (fresh build, 2026-09-06 night)

**Slug** `pioneer-antique-mall-puyallup` · 113 S Meridian, Puyallup, WA 98371 · (253) 380-4021
**sha256 index.html** `95831a95c4d0f2006c9ce815e2c5a5547d4921fab0023415282eb8f393d5841f`
**QA** `qa/run.sh` — 22 passed, 0 failed, 0 warnings, twice in a row on the final file.
**Screenshots** `review-0906/` — 390 (14 frames, scroll-through, 2x DPR) and 1440 (10 frames), plus the signature gadget engaged at both widths.
**Confidence 84 / 100.**

---

## 🚩 LOUD FLAG — MONDAY (Labor Day) IS A REAL RISK

Hayden is walking this Monday. Two **undated handwritten notes** are in their own Google photo harvest, both taped to this door:

- `g1` — *"Sorry Closed Till Monday - We Will Be at Monroe Junk Hunt Show"*
- `g22` — *"We Will Be Closed on Mon. & Tue. Working on an Estate"*

So this shop **has closed on a Monday (and a Tuesday) at least twice**, for buying trips and estate work. Neither note is dated, and **no source anywhere publishes Labor Day hours** — holiday status UNCONFIRMED. **Call (253) 380-4021 before driving to this one.** The page carries an honest, non-negative version of this in the hours band ("They buy whole estates and travel out to shows… a call first is never wasted") rather than hiding it.

## 🚩 LOUD FLAG — THREE DIFFERENT PHONE NUMBERS

| Source | Number |
|---|---|
| Google Business Profile (on the page) | **(253) 380-4021** |
| Their own door card, `g23` | 253-445-8330 |
| yellowpages / superpages / Visit Pierce County | (253) 770-0981 |

Google's is the one that ships. **Confirm at the counter before anything goes to print or to an owner.**

---

## What was built

One page, fresh from `~/website-factory/template/`. Order: hero → hours (deep band) → what's inside → the floor (gallery) → **the wall** (signature) → we buy (brand band) → reviews → visit → closing band → footer.

**Ground — MIRROR LAW.** The room is *lit*, not dark: blush-pink walls, skylights, incandescent bulbs. But everything in it is walnut, brass and aged paper. So: warm cream ground (`--bg #F4EBDB`, sampled off their ceiling and their own beige building), with depth from three deep **walnut** bands (hours · the wall · the closing band) and one band in the **faded red of the ANTIQUES letters painted on their storefront** (`--brand #A33B32`). Nothing is cream-on-cream. Brass `--warm #D8A75B` carries the highlighted words and eyebrows on dark.

**Type.** Young Serif 400 (display — sturdy old-style serif, the only weight it ships) + Karla 400/500/700. Weights pinned to what the faces actually have.

**Header mark — TYPESET, deliberately.** This business has no logo anywhere. The only lettering on the building is the generic word **ANTIQUES**, which is not their name — cropping it would be a mark that says nothing. NEVER RECREATE forbids drawing one. So the name is set in Young Serif. *Ask the owner whether a mark exists (a card, a bag, a booth banner) — that's a real upgrade.*

**Hero — `images/hero-stack-1.jpg` ← harvest `g7`, cropped (0,235,1920,1395).**
Exterior default: the interiors run all the way down the page, so the opener is the real building with the red **ANTIQUES** letters, at golden hour on what looks like a downtown car-show night. Recropped once because the first crop lost the letters to the cover-fit. Headline block only — no eyebrow, no chips.
**Phones get the HERO STACK** (no vertical exterior exists): three real photos in walk-in order — outside (`g7`) → the fair-wall aisle (`g16`) → the case aisle (`g18`) — `height:auto`, seamless conveyor, nothing cropped.

**Signature — "The wall."** Their own wall above the cases, one real photograph (`g17`), four labelled pills. Tap a name and the wall zooms and centres on that piece; tap it again to pull back out. Caption card sits **under** the photo, never over it, with reserved height so nothing shifts. Toddler test: one obvious labelled tap, instant visible payoff, four chips, one-line hint, no modes. It's section 5. Every caption was read off a 4× crop of the real photo:
1. **The fair board** — hand-painted 50th Western Washington Fair board, "Day and Night", "Sept 19-27", Third Prize judging ribbons either side.
2. **Dental Laboratory** — an old "Puyallup Dental Laboratory" sign on the shelf.
3. **The carved pole** — carved cedar pole beside the round town centennial sign.
4. **The green lamp** — green enamel shop lamp over the case aisle.

**Photos: 11 used, each exactly once.** hero stack (g7, g16, g18) · what's inside (g6, g19, g3) · gallery (g4, g14, g21) · the wall (g17) · we buy (g11). All from tonight's harvest at 1800px.

---

## 🚩 PHOTOS DELIBERATELY EXCLUDED — READ THIS

**Six harvest photos carry a price tag that reads "Tacoma Antique Center at Fife"** — a *different business*: `g5` (Spider-Man #1 CBCS 9.8), `g8` (teapot), `g9` (Elvis print, three such tags), `g10` (Hulk), `g15` (Tomb of Dracula), `g20` (collector plates). The brief flagged g8's tag; I checked every close-up and found the same tag on all six. Either a vendor sells at both malls and reuses their tags, or Google merged photos from two shops onto this listing. Either way, **none of them ship** — an owner spotting a rival's tag on his own website is a dead pitch.

The cost: **there is no usable in-store comics photo.** The comics case is real (Visit Pierce County's antiques guide: *"a wide selection of comic books"*, plus Google's own line), so it's named in the copy — but it carries no photo. **Worth a phone shot on the walk-in.**

Also excluded: `g2` (a military vehicle on a trailer), `g12` / `g13` (drinks and a bar interior — not this business), `g1` / `g22` (the handwritten CLOSED notes — used as evidence only), `g23` (the door card — the hours source, but it shows a conflicting phone number, so it stays off the page).

---

## PROVISIONAL (verify before an owner send)

| Item | Why |
|---|---|
| **Hero building** | The red ANTIQUES lettering is on a two-storey building matching "two floors", and `g11` looks out at Wicked Pie Pizza (114 S Meridian, directly opposite 113) — consistent, but **not proof** the lettering is theirs and not a neighbour's. The grey pickup is a visitor's car-show truck, not the shop's. |
| **`images/inside-1.jpg` (g6)** | The "MORE ANTIQUES UP STAIRS" sign — the best proof of two floors on the page. Its room reads different from the pink-walled floor (tan carpet, cream walls), so it's probably the *other* floor. Confirm it's their building. |
| **Facebook link** | `facebook.com/puyallupantiques/` — titled "Pioneer Antiques \| Puyallup WA". Almost certainly them; not verified (FB is bot-walled). Drop it if wrong. |
| **"Indigenous-owned" chip** | Google Business Profile attribute. Confirm the wording the owner wants. |
| **Sunday 12–6** | From the paper *taped over* the door card's etched "10AM–6PM SAT–SUN". Taped note is newer, so it wins — but it is a piece of paper. |

## Ask-client list

1. Which phone number is live (three in circulation — see above).
2. Labor Day / holiday hours, and how often estate work closes the shop.
3. Owner's name, and how long the mall has been at 113 S Meridian.
4. Is there a logo or mark anywhere? (Currently typeset.)
5. Number of vendor booths — a real number would carry the "what's inside" section.
6. Booth-space rental: is space available, and what does it cost? (A vendor-recruitment line is a strong reason for them to *want* a site.)
7. Email address (none published — the form ships in demo mode, and there's no email line on the page).
8. Comics: is the case a permanent fixture, and whose booth is it?
9. The minor-age line on their door sign ("…and younger must be accompanied by a parent") — the age was illegible, so it's not on the page.

## Pitch angle

**They have no website at all** — Google's "Add website" slot is empty. Every antique hunter within an hour searches before driving. Two things this demo gives them that nothing else does: the **hours are correct and live** (their real door card, including the taped Sunday change, with a green/red light), and the **"we buy gold, silver, coins, jewelry & watches" counter finally has a page** — that's the highest-margin thing they do and right now it exists only on a yellow card in a window. Tier 3, $1,500–$2,500.

## What I'd still fix with more photos

1. A real photo of the **comics case** (the one named category with no image).
2. A daylight exterior of the **actual storefront door** — proof the ANTIQUES lettering is theirs, and a cleaner hero than a car-show night shot.
3. A photo of the **second floor** itself, so "two floors" is shown rather than signposted.
4. Named Google reviews with real profile images — currently the honest 4.1/49 aggregate links out, per the 2026-09-06 review law.
