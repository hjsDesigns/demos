# Wayne's Inn Bar & Grill — HANDOFF (fresh build, 2026-09-06 night)

**Slug** `waynes-inn-puyallup` · 1902 E Main Ave, Puyallup WA 98372 · (253) 848-3466
**sha256 index.html** `f64027fed5e9543b0bc18ab828d26bb391ca1f607ae700dd1094bc69206fede2`
**QA** `qa/run.sh` green twice, 25 passed / 0 failed / 0 warnings, identical hash both runs.
**Screens** `review-0906/` — `m*.png` at 390 (scrolled through first so every reveal fired), `d*.png` at 1440, plus `m-board-lit.png` / `d-board-lit.png` (the gadget switched on) and `d-gallery-settled.png`.
**Confidence 88.**

## ⚠️ Read this before Monday morning

**Wayne's does not open until 3:00 PM on Mondays.** Every other day it opens at 11 (Sat/Sun at 9). If the Labor Day walk-in route hits Wayne's in the morning, nobody will be there. Put it at the end of the day, or call first.
Holiday hours are **unconfirmed** — no source publishes a Labor Day exception, so the page shows the regular Monday 3 PM open.

## What was built

One page on the factory template, dark ground.

- **Ground — MIRROR LAW, dark.** The room genuinely is dark (green LED strip down the ceiling, disco ball, beer neon, dark wood — harvest g4/g9), so `--bg/--ink` are flipped and the whole page sits on the navy of their own pole sign. Full dark-ground sweep done: `.card .ico`, `.story-copy .lede`, `.site-footer`, `.btn-cream` all overridden at the bottom of `css/style.css`.
- **Palette** sampled off the sign after perspective-flattening it: navy field `#1A1E2A`, the salmon "INN" `#E07A52`, warm white lettering `#ECE6DC`. Status green `#3ED16B` is the room's own ceiling LED, which also satisfies the STATUS LIGHT LAW (green open / red closed).
- **Type** Oswald 500/600/700 (sturdy condensed) + Barlow 400–700. The template's 800 weight and negative tracking are overridden — Oswald has neither.
- **Header mark** = their real pole sign, perspective-corrected out of `harvest-0906/g11.jpg` and lightly cleaned (saturation/contrast/brightness only). **Not redrawn.** Reads legibly at 44px desktop / 36px phone.
- **Hero** `images/hero.jpg` — the exterior from E Main with the whole pole sign and the reader board reading **FOOTBALL HERE**, exactly the EXTERIOR-HERO DEFAULT. Headline block only: no chips, no badges, no address on the photo. The headline is the sign's own promise verbatim — *Pizza · Sandwiches · Lunch · Dinner*. Phones get `hero-tall.jpg`, a 3:4 crop framed on the sign + the building; nothing important is cropped in either.
  **Deliberate crop:** the source frame has a Neil Walter Company **"AVAILABLE"** for-lease sign planted on the lawn. Both hero crops stop left of it — a pitch page must never read "this building is for lease."
- **Hours band** all seven rows, today lit, live green/red dot, address + Maps link, two rating chips. Hours appear here and nowhere else.
- **What's here** — four cards (pool/darts/cornhole · karaoke Wed/Fri/Sat · the beer garden · trivia) plus one wide framed print of the beer garden.
- **Menu, inline, verbatim** — 29 priced items read straight off `harvest-0906/g12.jpg` (the laminated menu on the table): 14 sandwiches, 7 burgers, 2 steaks, 5 pizza, 1 side, plus all the substitution pricing in the fine print. Every price is listed in `facts.json` and QA checks the count and the values. Three framed food prints above it.
- **Signature — the reader board.** Their pole sign carries a hand-set changeable-letter board. This is that object. It answers exactly one question off the same Pacific clock the hours band uses: *is karaoke tonight?* The nights come from Wayne's own hand-set sidewalk A-frame, photographed in `harvest-0906/g11.jpg` (bottom right, partly behind the Neil Walter "AVAILABLE" sign): `KARAOKE ★ 8PM` / `WED.FRI.SAT`. So the mapping in `js/site.js` is — Wed (3) / Fri (5) / Sat (6) → `KARAOKE / TONIGHT`; Thu (4) → `KARAOKE / FRIDAY`; Sun (0) / Mon (1) / Tue (2) → `KARAOKE / WEDNESDAY`. The JS walks forward to the next night in `KARAOKE_DAYS=[3,5,6]`, so it's deterministic — no invented events, no hours in the gadget. **Do not revert this to Fri/Sat** — the g9 stage banner disagrees and loses; see the first ask-client item. The no-JS fallback baked into `index.html` is the day list `WED·FRI·SAT`, never `TONIGHT`, so the board is still true on all seven days with JS off or before the script runs; `site.js` overwrites both lines on load. One tap: lamps come on and the letters clack into their slots. Tap again: lights out. No chips, no legend, no cycling states.
- **The room** — 2×2 scrapbook of four real prints.
- **Reviews** — aggregate only (see below).
- **Find us** — two big tap tiles (call / directions) + the demo-mode form. Address and hours are not repeated here.

## Photos — 9 real, all from tonight's harvest

hero + phone hero (g11) · beer garden (g8) · burger (g5) · NY strip (g2) · tater tots (g1) · the room (g4) · house salad at the taps (g6) · two pints (g3) · crinkle fries (g7). Header/footer mark is a crop of g11. No photo used twice.

**Excluded on purpose:**
- **g9** (karaoke night) — the crowd's faces are identifiable at print size, so it is **pitch-only**, never on the page. Its stage banner is **not** the nights source: the only legible text is `…G EVERY FRIDAY & SATURDAY NIGHT`, and the subject word runs off the left edge of the frame, so this photo never actually shows the banner saying KARAOKE. The sidewalk A-frame in g11 is the source (it names karaoke, the hour and three nights outright); the banner is the older sign and is logged as a conflict in the ask-client list below.
- **g10** (Seahawks RC monster truck in the box) — a raffle/prize prop with no source explaining it. Skipped.

## PROVISIONAL / judgement calls

1. **Hours** come from one site (Restaurantji — its visible hours block *and* its schema.org `openingHours`, updated 2026-08-17), corroborated only on Sunday (9 AM–2 AM) by the Google/Yelp read in the recon dossier. MapQuest returned the wrong business; Google/Yelp are bot-walled to curl. Worth confirming Monday's 3 PM at the bar.
2. **Trivia, pool tables, darts, cornhole, beer garden** all come from Restaurantji's write-up of the place (which is itself summarised from customer reviews). The beer garden is additionally proven by g8. Trivia has **no day** attached anywhere, so the page never claims one.
3. Restaurantji's summary also mentions a **Sunday pool tournament**. Single, second-hand source — **kept off the page entirely** rather than risk a wrong claim in front of the owner. Worth asking; it would be a good second line for the reader board.
4. **The room photo (g4)** contains customers at ~30px on screen, mostly turned away, in low light. Judged not identifiable at print size — but it's Hayden's call if he wants it swapped.
5. **Beer garden print (g8)** has two heavily defocused people in the background. Same judgement.
6. No `[PLACEHOLDER]` text anywhere on the page — everything unknown was left off.

## Ask-client list

- **⚠️ WHICH KARAOKE NIGHTS? (g9 vs g11 — settle this before go-live, and do not silently "fix" the build to match g9.)** Two of Wayne's own signs disagree, and the page follows the newer one:
  - `harvest-0906/g11.jpg` — the **sidewalk A-frame** out on E Main, hand-set: `SAT ★ SUN` / `BREAKFAST` / `THUR TRIVIA 7PM` / `KARAOKE ★ 8PM` / `WED.FRI.SAT`. (Left ~2 characters of each line are hidden behind the Neil Walter "AVAILABLE" sign; `D.FRI.SAT` reads as `WED.FRI.SAT` on the same 2-character offset as `EAKFAST` → `BREAKFAST` and `UR TRIVIA` → `THUR TRIVIA`.) **Three nights.**
  - `harvest-0906/g9.jpg` — the **banner over the stage**, indoors: `…G EVERY FRIDAY & SATURDAY NIGHT`. **Two nights**, and the subject word is cut off by the frame, so it is not even provably the karaoke banner. The Restaurantji write-up agrees with the banner ("karaoke on Fridays and Saturdays") — same two nights, and also older than the A-frame.
  - **The A-frame wins** — it is the sign facing the street, it names karaoke explicitly with an hour, and it lists the extra night. The page copy, `facts.json` and `js/site.js` (`KARAOKE_DAYS=[3,5,6]`) all say Wed/Fri/Sat. If the owner says the banner is right, change all three together; do not change one.
  - Side note for whoever asks: that same A-frame line reads `THUR TRIVIA 7PM`, which is a *day for trivia* — see PROVISIONAL #2/#3, which were written before the sign was read this closely. The page still claims no trivia night and **should not** gain one off a partly-occluded sign alone; ask the owner at the same time.
- **Owner's name** — nowhere in any source. The form's thank-you says "somebody at Wayne's" rather than a name; the site has no owner story or About section for the same reason.
- **Is there a Sunday pool tournament?** (see #3 above) — and what night is trivia?
- **Karaoke start time** — the A-frame in g11 says `KARAOKE ★ 8PM`, and the page uses 8 PM. Confirm it's still current (the indoor banner names no hour at all).
- **Monday 3 PM open** — confirm, plus holiday hours.
- **Menu currency** — prices read off the table menu September 2026; confirm nothing has moved, and whether there are more Sides than the Loaded Baked Potato (the photographed page lists only one).
- **Facebook / Instagram** — no verified social URL found, so the footer carries no social row.
- **Email** — none found; the contact form is in demo mode until a Web3Forms key is set at go-live.

## Missing / would fix with more material

- **No photo of a pool table, a dart board or a cornhole set** — the strongest "what's here" claim has no image behind it. One drive-by shot fixes it.
- **No named verbatim review.** Restaurantji publishes review text with dates but no reviewer names, and Google is bot-walled to curl. Rather than put words in an anonymous mouth, the reviews band is the honest aggregate: Google 4.0/482, Restaurantji 4.3/162, the 62/24/2/4/8 star split, and Food 4.4 / Atmosphere 4.6 / Service 4.6. If a named Google review can be pulled through the Browser pane later, it drops straight into that section.
- **No daytime exterior.** The one exterior in the harvest is at dusk under a flat grey sky. It works, but a bright morning shot of the building would be a better hero.

## The pitch angle (unchanged from the dossier, and it got stronger)

They **pay for waynesinn.com** and it serves a 114-byte GoDaddy parking page — confirmed again tonight (`HTTP 200, 114 bytes, no title`). Google's "Add website" slot is empty. This is a **handoff**, not a build-from-nothing: they have the domain, they have 482 Google reviews, they have a menu worth reading, and none of it is anywhere on the web. The reader board on the page is their own sign doing on the internet what it already does on East Main.
