# Out & About Burgers — Puyallup (South Hill) · fresh build 2026-09-06 night

**Slug:** `out-and-about-burgers-puyallup` · **Tier 1** (Google's website button goes to Facebook only)
**sha256 index.html:** `828c86106c3d888383d11f6791efaae54a28e5186fae9934614e3bc3fbdb75b4`
**Confidence: 86 / 100**
**QA:** `qa/run.sh` green twice on the final file — 24 passed, 0 failed, 1 warning (the warning is the gold eyebrow on the three dark bands, which is the template's own `.section-dark .eyebrow{color:var(--warm)}` rule, not a bug).

---

## What was built

A one-page site on the factory template, warm-cream ground with three deep navy bands. Everything factual on the page came off their own signage or a source named below — no invented items, prices, hours, names or quotes.

| Section | What's in it |
|---|---|
| header | Their real painted oval (crop of `harvest-0906/g44.jpg`, ellipse-masked — cleaned, never redrawn) + live green/red open pill |
| `#hero` | The wagon. Art-directed: wide screens get the whole trailer broadside, phones get the portrait frame of the mark, contained whole |
| `#hours` | Deep navy band, live Pacific clock, address, **all seven day rows**, today lit, green-open / red-closed |
| `#services` | Wide storefront print + four cards: drive-thru only · skin-on fries · Cagney sauce · look for the U-Haul |
| `#menu` | The board photo + **19 real prices** in four groups, plus the eleven fountain flavours as a title-card unroll (downward chevron that flips up) |
| `#gallery` | Six framed prints, six different real photos, real captions |
| `#signature` | **The shake machine** (section 5, below the fold) — deep navy band |
| `#about` | The U-Haul-lot story + the honest ratings aggregate + link out to the live Google reviews |
| `#contact` | Three steps, phone, directions, form in demo mode |
| `#cta` | Deep navy closing band, two real numbers |

## Hero — file and why

**`images/hero-wide.jpg` (from `harvest-0906/g44.jpg`) on ≥761px · `images/hero.jpg` (from `harvest-0906/g19.jpg`) on phones.**

EXTERIOR HERO DEFAULT: it's the actual white catering wagon with its hand-painted oval, its red neon OPEN and its gravel lot — not an interior, and there is no interior to shoot. Two files because one crop could not serve both widths without breaking a law:

- The portrait frame (`g19`) is glorious on a phone — the mark fills the screen — but at 1440 it cover-crops down to *just* the oval, and the headline landed on top of the painted letters.
- The broadside (`g44`) is the right aspect for desktop and puts the oval up top with plain gravel under the type — but on a phone a 0.505-ratio crop sheared the "O" off "Out", which fails NEVER CROP THE IMPORTANT PART.

So: `<picture>` with a `min-width:761px` source. On phones the portrait frame is `object-fit:contain` against a blurred, warmed echo of itself (the letterbox prescription) so the whole oval reads and no letter is cut.

The photo carries the name, so the h1 says the thing the sign doesn't: **"Hot, Fresh & Local"** — their own three words, printed at the bottom of their own menu panel. Nothing else sits on the hero photo.

## Signature — the shake machine

Their board prints exactly five milkshake flavours and nothing else about them. Five big labelled pills, each with a colour swatch. Tap one: the paper cup fills in that colour and the flavour name lands under it in the display face. Tap the same one again: the cup empties. One gesture, an instant visible payoff, no instructions, no numbers to read, no sentence narrating the choice back, and it restates no fact that lives anywhere else on the page (the shake *prices* are in the menu; the *flavours* are only here).

## Hours source

**Their own posted window sign**, photographed twice in the harvest: `harvest-0906/g26.jpg` and `harvest-0906/g50.jpg` — "OPEN 11-8 DAILY / SUNDAY 11-7 / Drive Thru Only Please". Restaurantji (updated Aug 23, 2026) lists 11 AM–8 PM on all seven days; **where the two disagree — Sunday — the business's own sign wins**, and that's what shipped (Sun 11–7, Mon–Sat 11–8). Google Maps agrees on the 11 AM open. Cited in `facts.json` under `_hours_source` and in a comment at the top of `js/site.js`.

## Menu source

Read verbatim off the three printed panels bolted under the order window — `harvest-0906/g42.jpg`, shown on the page as `images/menu-board.jpg` with the caption "The board every price on this page was read from". The older hand-lettered board in `harvest-0906/g33.jpg` (hamburger $3.49, shakes $3.69) was **not** used — it is clearly superseded.

## PROVISIONAL / verify before the pitch

1. **"Black Raspberry"** — the last milkshake flavour is clipped by a bollard in the photo; the board reads "Black Raspbe…". Almost certainly Black Raspberry, but it is an inference from a partial word.
2. **Prices** are a September-2026 read of a hand-run stand's board. The page says so in the fine print ("call the window if you're counting to the dollar").
3. **Labor Day (Mon Sept 7)** — no source publishes holiday hours. Regular Monday hours (11–8) are shown. *Holiday unconfirmed.*
4. **`harvest-0906/g8.jpg` and `g40.jpg`** show a permanent red-roofed building with a forest mural and a carved version of the same oval sign. It may be a second location, or a neighbour. **Neither is used on the site** — do not add them until someone confirms.
5. **Reviews.** No card shipped. Restaurantji publishes its quotes anonymously; Nextdoor publishes initials only, no photos. Under the REVIEW ATTRIBUTION LAW that's a link-out, not a card — so the page carries "4.5 on Google · 2,193 reviews" and "Read the reviews on Google ↗". If Hayden wants testimonial cards, he needs a name + profile photo pair off the live Google listing.

## Ask client

- Owner / operator name (no source publishes one — the form's thank-you line is impersonal because of it)
- Their Facebook page URL (Google's website button points there, but the URL wasn't reachable to curl — the footer links the Google listing instead)
- An email address (the contact block ships phone + directions only)
- Year the wagon started
- Confirm the five milkshake flavours and the current prices
- Whether the red-roofed building next door is theirs

## Notes for the next pass

- `images/window.jpg` (the order window with the hours sign and someone working inside) is prepared and unused — a good candidate if a section ever needs another photo.
- 52 harvested originals sit in `harvest-0906/`; 13 are in play. Food photography is abundant; exterior photography is thin and mostly overcast — a sunny drive-by of the broadside would upgrade the desktop hero from a 960px upscale to native resolution.
- Contact form is in demo mode (empty `access_key`) as designed.

## Files

`index.html` · `css/style.css` (tokens sampled from the painted oval) · `js/site.js` (HOURS + unroll + shake machine) · `facts.json` · `assets/contact-sheet.html` (13 images) · `images/` (13) · `review-0906/` (390 scroll-through + tapped-gadget + open-unroll, 768 and 1440 with full-page)
