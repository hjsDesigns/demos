# The Log Cabin Pub — Sumner, WA · handoff

**Built:** 2026-09-06 night (Puyallup twenty, second ten) · fresh from `~/website-factory/template/`
**Slug:** `log-cabin-pub-sumner` · one page · **not published, not committed**
**sha256 (index.html):** `21ad2c6d00ee524e4ca3e6317264a78bd53b100a9d8b4f3beec5c097efb69d8a`
**QA:** `qa/run.sh sites/log-cabin-pub-sumner` — **25 passed / 0 failed / 0 warnings, twice in a row**
**Confidence: 86 / 100**

---

## What was built

A dark-ground redesign demo for a bar & grill with its own website, https://logcabinsumner.com/. The October 23 handoff establishes that its /events page is a placeholder; the earlier Linktree-only premise was incorrect. Confirm the existing provider before pitching a redesign.
Sections, in order: hero → hours → the rooms (cream) → menu (dark) → **games signature (cream)** →
about (dark) → reviews (cream) → contact → CTA → footer. Dark and warm-cream bands alternate the
whole way down.

**Ground — MIRROR LAW.** Dark tavern brown (`--bg #17120E`) with warm amber (`--brand-text #E3A44A`).
The room genuinely is dark: stained plank walls, black ceiling, neon over the pool tables, amber
pendants over the bar. Their own printed menu is white-on-black, so the menu band is the darkest on
the page — it mirrors the thing they hand you. The daylight rooms (beer garden) and the games sit on
warm cream bands so the page is never dark-on-dark.

**Type.** Bevan (display) + Barlow (body), weights pinned to what the faces ship. Bevan is a heavy
wood-type slab — picked after cropping and 2× upscaling their real logo and reading the letterforms
as a condensed flared slab, not a sans (EXACT LOGO-FONT MATCH).

**Header mark.** `images/logo.png` is their **real circular LOG CABIN PUB badge**, cropped straight
out of page 1 of their own menu PDF and keyed off the black to alpha. Nothing was redrawn
(NEVER RECREATE).

---

## Hero — `images/hero.jpg` (harvest `g57.jpg`, cropped)

Their **real roadside sign on E Valley Hwy**, shot from the lot: real building lot, real sky.
Chosen because the brief ranked the roadside sign first if sharp enough — it is (laplacian variance
598, 1920×2560 native portrait) — and because EXTERIOR HERO DEFAULT applies: interiors appear all
over the page below.

Cropped to `(330, 0, 1920, 1858)` to drop the parked FJ Cruiser in the lower-left; the sign itself is
whole and uncropped. The phone scrim is tuned so the badge and the sign's own **"eats | drinks |
games"** stay in daylight up top while the reader board goes near-black under the headline block —
the sign stays legible and nothing but the headline block sits on the photo.

Headline is **their own words**: "What happens here, stays here." is the Log Cabin Pub's Linktree bio
verbatim, and the same line hangs as a tin sign on their bar wall (shown in #about, harvest `g58`).

---

## Signature — "Pick a game" (section 5, cream band)

Their roadside sign literally sells the place as **"eats | drinks | games"** and **"entertainment |
beer garden"** — so the games are the signature. Four labelled pills; tap one and its real photo
swaps in directly above, with one plain line under it.

| Pill | Real photo | Sourced from |
|---|---|---|
| Pool | `game-pool.jpg` | harvest `g47` — racked table, no faces |
| Shuffleboard | `game-shuffleboard.jpg` | harvest `g27` — full-length table beside the arcade cabinet |
| Ping pong | `game-pingpong.jpg` | harvest `g33` — set up under the beer-garden roof |
| The stage | `game-stage.jpg` | harvest `g37` — a real band playing on their covered stage |

Toddler law: one obvious tap, instant visible payoff, no modes, no cycling, no legend, no readback
sentence. Tapping the already-active pill is a no-op, not a toggle. Verified in Playwright through
all four states plus a repeat-tap.

---

## Menu — verbatim, with prices

Every item and price is transcribed from **the pub's own ALL DAY MENU and BREAKFAST PDFs**, which
they publish on their Linktree:

- `ugc.production.linktr.ee/b11198e8-…_LOG-CABIN-MENU.black.pdf`
- `ugc.production.linktr.ee/301ad2a0-…_LOG-CABIN-BREAKFAST-MENU.black.pdf`

All three menu pages were **rendered to images and read visually** before any price was used — the
raw text extraction scrambled the item↔price pairing, so it was not trusted. 49 items across five
title-card unrolls (TITLE CARDS UNROLL; downward chevron flips up, ARROW LAW). Prices are printed
bare, without `$`, exactly as their menu prints them.

`facts.json` scopes `price_selector` to `.unroll[open] .menu-list .price` (12 appetizer prices),
because collapsed `<details>` render no text for the QA harness to read. See `price_note` there.

---

## Hours — all seven rows, green/red light

| | |
|---|---|
| Sun | 8:00 am – 2:00 am |
| Mon–Fri | 10:00 am – 2:00 am |
| Sat | 8:00 am – 2:00 am |

**Source: Restaurantji listing for Log Cabin Pub, Sumner — page last updated 2026-04-27.** Google
Maps did not show Monday hours on the night of the recon; Restaurantji did, and it is the only dated
source reachable without a browser. `js/site.js` `HOURS` uses `26` for the 2 am close so the live
light stays green after midnight. Status dot is `--status-open` green / `--status-closed` red
(STATUS LIGHT LAW).

> ⚠️ **LABOR DAY (Mon Sept 7) — HOLIDAY HOURS UNCONFIRMED.** No source published holiday hours.
> The page shows regular Monday hours (10 am – 2 am). Worth a phone call before Hayden walks in.

---

## Reviews — honest aggregate, no invented faces

4.1 ★ / 958 Google reviews (verified on the Maps place page) plus the Restaurantji sub-scores
(Food 4.4 / Service 4.2 / Atmosphere 4.0 from 181 ratings), and a link out to the live reviews.

**No named testimonial is shown.** Google and Yelp are bot-walled to curl, and the Restaurantji
reviews subpage returned a Cloudflare interstitial — so no reviewer's real name could be paired with
that same reviewer's published profile photo. Under the REVIEW ATTRIBUTION LAW (9/6) that means no
quote block at all rather than a manufactured face, fabricated initials or an anonymous quote strip.
**If Hayden wants named reviews on this site, they need one browser pass over the Google reviews tab.**

---

## PROVISIONAL / not on the page

Nothing invented and no visible placeholders. These are known-unknown and were deliberately kept off:

- **Owner story / owner name.** Not sourceable by curl. `#about` carries only observable, sourced
  facts. The menu has a **"Don's Signature Chicken"** salad — possibly an owner or a cook, but that
  is a guess and was not written anywhere on the page.
- **Founding year.** A featured (unnamed) August-2023 review says *"Been going there periodically
  since 1979!"* — suggestive, not a sourced founding date, so it is not on the page.
- **Contact form** is in demo mode (`access_key=""`): it shows the thank-you and sends nothing until
  go-live wires a Web3Forms key against the owner's email.
- **No email address** anywhere for this business — the contact block uses phone / directions /
  their Facebook events page instead.

## Ask-client list

1. **Labor Day hours** — open regular Monday hours on Sept 7?
2. **The chalkboard specials.** Legible in harvest `g31` but from an undated photo, so none of it
   shipped. Worth confirming and adding: **Happy Hour 3–7 M–F**, **free tacos on Fridays**, a
   **"blue collar breakfast"** till 11 am, and **DJ / dance, Top 40 + requests, Wed through Sat**.
   That last one would make a real "what's on" board — it just needs the owner to confirm it's current.
3. **Owner's name and the pub's story** — how long, who runs it, where the log-cabin name comes from.
4. **A named review + their profile photo** for a real testimonial block.
5. **Menu currency** — are the PDF prices current?
6. Whether they want the **Facebook events feed** surfaced on the page rather than just linked.

## What I'd still fix with better photos

- **A dusk exterior of the building itself.** The hero is the roadside sign; there is no good frame
  of the actual building front in the 60-photo harvest. A dusk shot with the neon on would be a
  stronger opener than a daytime sign against an industrial yard.
- **The bar room up front is the weakest set.** `g22` is the best interior available and it is soft
  (sharpness 217). A clean, lit shot down the bar would lift #rooms a lot.
- **A band actually playing to a crowd.** `g37` is real but distant and dim; the stage is one of
  their best assets and deserves a better frame.

---

## Files

```
index.html                  the page (no [SLOT / [PLACEHOLDER remain)
css/style.css               :root retokenized dark + DARK-GROUND SWEEP + .section-cream
                            + unroll + signature + reviews blocks
js/site.js                  HOURS filled (7 days, 2 am closes) + the "Pick a game" gadget
facts.json                  true, with a `sources` block naming every claim's origin
images/                     13 real photos + the logo cropped from their own menu PDF
assets/contact-sheet.html   regenerated (13 images)
harvest-0906/               the 60 original Google photos + sheet.jpg
review-0906/                13 shots @390 (scrolled through first) + 4 signature states + 11 @1440
```

**Sources used:** Restaurantji (hours, aggregate, sub-scores, socials) · linktr.ee/log_cabin_pub
(bio/tagline, both menu PDFs, Facebook + Instagram, events link) · their own menu PDFs (all prices)
· Google Maps place page (rating, phone, address — from the recon). MapQuest returned the wrong
business; Restaurantji's reviews subpage and Yelp were Cloudflare-walled. Research took ~11 minutes.


## October 23, 2026 — Codex Friday finish (current source)

Converted the 4 saved Google name/photo pairs to a continuous 40 px/s ribbon. No playback/navigation controls; hover, touch and keyboard focus pause; reduced motion leaves a manual reading rail; resizing remeasures the loop. Dynamic duplicate is presentation-only, inert and aria-hidden, not an additional review. Review dates remain the source snapshot, explicitly disclosed.

Added four evidence-backed facts from HANDOFF-CODEX.md photos g47/g27/g37 and own BREAKFAST PDF; facts.json sources.sign_copy/menu. No room plan, dated event schedule or current seasonal special was invented; explicit gaps live in brief.json → missing. Replaced the inactive message form with verified phone actions. Content remains visible if JavaScript fails.

Google actions: clearly disclosed name/address Maps searches because no verified listing ID or direct review-writing URL is stored. Source-only changes; no publication or visual/runtime verification.

**Premise correction:** logcabinsumner.com exists; logcabinsumner.com/events is a placeholder per handoff/FINAL.md and route evidence. This is an existing-site upgrade conversation. No no-website claim is valid. Older handoff QA/hero/review descriptions above are historical, not the state of this revision.
