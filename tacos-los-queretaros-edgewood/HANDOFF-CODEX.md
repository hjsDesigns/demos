# Tacos los Queretaros — Edgewood, WA · HANDOFF

Fresh build, 2026-09-06 night (Puyallup ten). One page, from `~/website-factory/template/`.
Not published, not git-committed, `demos-pages` untouched.

- **sha256 index.html** `61cea190b74b068b6ad7eea69a11ef9b46209380b5c0b5967fddaa1f75f1c411`
- **QA** `qa/run.sh` — 20 passed / 0 failed / 1 warning, green twice in a row on the same file (identical hash both runs).
- **Screenshots** `review-0906/` — 390 (9 sections + tapped gadget + unrolled menu), 768 (4), 1440 (9).
- **Confidence 88 / 100.**

## What was built

| | |
|---|---|
| **Ground** | Warm cream `#F6ECD8` (their logo's own state-outline cream), deeper cream `#EBDCBD` for alternating bands, and **two deep blue-black bands** `#0E1728` sampled from the banner bolted to the trailer — the hours band and the closing band. MIRROR LAW: the "room" is a sunny grass lot, so cream, not dark. |
| **Zoned color** | BLUE `#0B6491` (their trailer) owns identity — eyebrows, `h2 em`, group rules, stat digits. RED `#C2261A` (the "Taquería" lettering) owns everything functional — buttons, links, prices, the "today" marker, the picked plate. They never swap roles. Gold `#E0A82E` (the taco mascot's shell) is used for star glyphs only. |
| **Type** | Alfa Slab One (display — one weight, pinned to 400) + Barlow 400/500/600/700. h3/h4 hand off to Barlow 700 so subheads stay readable under a slab. |
| **Header mark** | `images/logo.png` — cropped straight off the menu board on their own trailer window (harvest `g35`), blue field knocked to transparent. **Not redrawn.** |
| **Hero** | `images/hero.jpg` ← harvest `g36`, right 10% cropped off (removed a distant figure). A plate of tacos held up in front of the blue trailer and the white tent, clear sky. Portrait, so the phone gets the whole frame; on desktop it is positioned to keep the sharp plate in shot with the trailer soft behind it (that shot's own depth of field). Nothing on the photo but the headline block — no eyebrow, no chips. |
| **Photos** | **13 real photos**, all from tonight's Google harvest, none repeated: hero, the menu board, the banner on the trailer, 4 signature plates, 5 tent/lot/counter prints, the logo crop. Frames with an identifiable face were excluded — `g22` was cropped to drop the man at the window, `g12` and `g6` are hands/arms only. |
| **Signature** | **"What are you hungry for?"** — section 4, tap one of four real plates and the name + board price land in the slot above it (the answer sits ABOVE the photos on a phone). Tap the same plate again and it clears. Object + number only, no sentence read back, no instructions. Verified: tap → switch → tap-again-clears, all deterministic, console clean. |
| **Menu** | Every line transcribed from the board on the trailer window (`g11`, `g4`) with the blank vendor template (`g35`) used for exact spellings. Two groups open (items 2–21 + the two marker additions); Side order, the green marker sign, Meat options and Kids are **unroll cards** (Captain Jack's pattern, downward chevron, ARROW LAW) so the phone isn't 65 rows of list before it reaches a photo. |
| **Reviews** | Aggregate only — 4.8 / 30 Google reviews, plus Restaurantji's Food 4.7 · Service 4.8 · Atmosphere 4.6 across 21 ratings. **No quote is printed**: no review text with a reviewer's name attached could be pulled from anywhere (see blocked sources). |

## The pitch angle (Tier 1)

Google's website buttons on their profile hand visitors to **orderdindin.com** and **online.skytab.com** — rented ordering platforms. No domain of their own resolves. Everything on this page — the whole priced board, the ten meats, the hours, the tent — currently lives nowhere they control.

Three specifics this demo gets right that a stranger couldn't fake: the **Pizza Birria** named on their own banner; the **34 numbered items, 2 through 35**, at the exact prices taped to the board; and their **"Pay with cash & save!"** window notice, quoted verbatim.

## PROVISIONAL — check before the owner sees it

1. **Veggie Burrito $14.99** — added to the board in marker; the leading digit is genuinely ambiguous in the photo (could read 1 or 4-crossed). Everything else on the board is legible and double-checked at 2× zoom. *This is the one number I'd want confirmed before printing.*
2. **Labor Day (Mon Sept 7) — HOLIDAY UNCONFIRMED.** No source publishes holiday hours. The page shows regular Monday hours (10 AM – 10 PM) per the brief.
3. **Mulitas photo** (`g26`) — a stack of griddled, birria-tinted tortilla pairs with onion and consommé. Reads as mulitas with high confidence, but it's the one dish label derived from the picture rather than from a caption.
4. **Google 4.8 / 30 vs Restaurantji 4.7 / 21** — two different counts on two different platforms, both true, both cited on the page. Not a conflict, but worth knowing if the owner asks.

## Ask-client list

- **Kids menu prices.** Items 22, 23 and 27 are taped over or scribbled out in every photo; 24/25 read $7.99 and 26 reads $4.99. The whole group ships **without prices** rather than half-priced. Get all six.
- **Meat upcharges.** The handwritten add-ons beside Lengua, Tripa, Cabeza etc. are covered with blue tape. Meat options ship as a plain list with no upcharges.
- **Owner's name.** Not published anywhere reachable. No owner story is on the page — nothing invented in its place.
- **Named reviews.** If they'll point at three Google reviews they like, the reviews band gets real quotes with monogram avatars instead of only the score.
- **Veggie Burrito price** (see PROVISIONAL 1).
- **Holiday hours** — do they close, or shorten, on Labor Day / Thanksgiving / Christmas?
- **Catering / party trays.** Two harvest photos show big party platters (`g17`, `g20`) — is that a real service with a real price? Not claimed anywhere on the page.
- **Socials.** None found. If they run a Facebook or Instagram, the footer gets a link.

## Research trail (curl → WebFetch, ~9 minutes)

| Source | Result |
|---|---|
| restaurantji.com/wa/edgewood/tacos-los-queretaros- | **HIT** — hours (all 7 days 10–10, updated 2026-07-11), address, phone, 4.7/21 + sub-scores. No review bodies published. |
| Their own trailer banner + menu board (harvest photos) | **HIT** — the whole priced menu, address, phone, the seven banner dishes, the cash-price notice. Primary source for the page. |
| yelp.com (curl + WebFetch) | 403 blocked |
| tripadvisor / zmenu / menupix | 403 blocked |
| nicelocal | 404 |
| orderdindin.com | reachable but no per-restaurant page found |

## Files

```
index.html          the page (one page — no genuinely distinct areas here)
css/style.css       :root retheme + a documented site layer (metric-matched font
                    fallbacks, dark hours band, board/menu, the picker, the score card)
js/site.js          HOURS filled 10–10 × 7 · the unroll handler · the picker
facts.json          every fact on the page, with its source
images/             13 files, named per the contract
assets/contact-sheet.html
review-0906/        23 screenshots
```

## One note on the QA warning

The single WARN is `eyebrow labels take the brand token` — the eyebrows are blue, not `--brand-text` red. That is deliberate: ZONED COLOR puts identity in blue and every functional element in red, and mixing them would break the rule the whole page is built on. Every eyebrow is the right size, weight and tracking; only the hue differs from the checker's expectation.

## If more photos come in

1. A **sharp, wide exterior of the trailer from the road** would replace the desktop hero framing outright — the one wide frame in the harvest (`g30`) is sharp but portrait, and the current hero's background is softly out of focus at desktop crop.
2. **The owner at the window.** No person appears on this page at all, which is the one thing that would warm it up — and every current frame with a visible face was excluded.
3. **Anything from the last few months.** The whole harvest looks like April 2026; a summer-evening shot under the string lights would carry the tent section.
