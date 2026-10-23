# HANDOFF — Teriyaki Wok & Sushi (Bonney Lake) · built 2026-09-06 overnight

**Confidence: 86 / 100.** Fresh template build, one page, QA green twice (23 pass / 0 fail / 0 warn).
Local: `~/website-factory/sites/teriyaki-wok-and-sushi/` · deploy copy in `~/website-factory/demos-pages/teriyaki-wok-and-sushi/`
`index.html` sha256 `6345ea342e6149a51b7d749af001d28fae4d5297bb4d92202595e41f98e60bca`

---

## READ THIS FIRST — the premise correction

The hit-list said menu11 was their only "website". **That is wrong.** They have a real, live,
own-domain site: **https://teriyakiwoksushiwa.com/** (HTTP 200, 14.4 KB, logo + 3 food photos +
address/phone/hours + same-domain ordering links). The Sept 6 recon dossier already caught this and
marked them **disqualified under the no-live-site filter**.

So this is **not** a "you have no website" pitch. It is a **redesign / upgrade** pitch, and it must
be framed that way at the door or Hayden gets corrected by the owner in the first thirty seconds.
Their existing site is one screen with no menu on it — the menu lives on a third-party ordering
platform. That gap is the whole sale.

---

## What was built

| | |
|---|---|
| **Type** | One page. 201-dish menu made browsable, so no second page earns its keep. |
| **Hero** | `images/hero.jpg` — a sushi/sashimi party platter on a table in their own dining room (bamboo screen + green booths behind it). **PROVISIONAL** (Batman hero clause). |
| **Palette** | Sampled off their own storefront photo. Roof teal `#4AC1DD` → `--brand #0E8FA6` (darkened for AA on cream); channel-letter yellow `#FEE916` → `--warm`; storefront shadow `#22364A` → `--ink #152229` / `--dark #11313B`; ground `--bg #F4ECDC` (one warm rice-paper cream). ZONED COLOR: teal owns everything functional, yellow owns eyebrows-on-dark, the highlighted word, the today row and the review star. The coral of the "fresh Sushi" window banner stays in the photos only. |
| **Fonts** | **Archivo Black** (display) + **Barlow** (body). Archivo Black was chosen after 4× upscaling a crop of the real sign — the channel letters are a heavy geometric grotesque (tall T, single-storey a, straight-legged k), not a slab or a script. Archivo Black ships one weight, so `font-weight:400` is pinned on every display element to stop faux-bold smearing. |
| **Signature** | **Build your bento** — five real bentos (B-3 … B-7) off their own ordering page. Every bento on their menu carries the identical four sides ("Comes with Rice, Salad, Gyoza, California Roll", verbatim), so the only real choice is the main — and the gadget is exactly that choice. Tap a labelled pill, the photo and the price change instantly. Five pills (the ≤5 chip law), no numbers, no modes, no legend. |
| **Menu** | Ten title cards, each headline its own tap target, unrolling the real items in place behind a downward chevron that flips up. **All 201 items are on the page** — 196 in the cards, the 5 teriyaki bentos in the gadget (they appear nowhere else, per NEVER TWICE). |
| **Hours** | All seven day rows, today lit, green/red status light off the live Pacific clock. Closed Mondays. |
| **Reviews** | Three real dated quotes, verbatim — see the caveat below. |

## Laws deliberately applied
- Hours + live status + address = one band directly under the hero; nothing on the hero photo but the headline block.
- Storefront photo opens the offerings section directly under the hours band (the hero isn't the building).
- `#signature` is section 6 — well below the "section 4 or lower" line.
- One cream, never white. No dark ground (their room is bright: light walls, wood, daylight storefront).
- Title cards unroll; the affordance is a chevron, never a plus.
- Every photo shown whole (`object-fit: contain` in the bento stage, natural aspect in the prints).

---

## PROVISIONAL — needs Hayden's eye

**Hero pick (Claude's, unaided).** `hero.jpg` = the party platter in their dining room. It was chosen
because it is the only photo that carries both the room (the walk-in feeling) and the product.
Runner-ups, in order:
1. `images/gallery-3.jpg` — the wide sashimi platter on a cedar board (1800×800, the best-resolution
   food shot they own; currently the full-width gallery print).
2. `images/storefront.png` — the exterior. **Rejected as hero** because it is a 500 px circle crop
   with the sign truncated to "Teriyaki W". EXTERIOR HERO DEFAULT would normally win here; it lost to
   the crop. A drive-by shoot of the Unit L storefront would flip this decision immediately.

**Photo provenance — read before this goes public.**
- All 5 site photos (`hero`, `gallery-1/2/3`, `storefront`) come from **their own domain's**
  CloudFront bucket. They are real photos of this restaurant, but they look upscaled/AI-smoothed at
  full size — do not describe them as original photography.
- The 5 bento gadget photos come from **their own menu11 ordering page**, whose provider prints
  "The images shown below are for illustration purposes only." They read as genuine in-restaurant
  shots (their plates, their tables), but that disclaimer exists.
- **Only 2 of the 5 bento photos show an actual boxed bento** (chicken B-3, salmon B-6). Beef, pork
  and short rib show the main *plated*, and the gadget says so in a small italic note under the price
  so nothing on screen claims to be a picture it isn't. **Best single upgrade: three photos of the
  beef, pork and short rib bentos** — then delete the `note` strings in `js/site.js`.
- Plateau Jiu-Jitsu's plaza exterior was checked and **not used**: same plaza, same teal roof, but it
  shows units H/I/J and no Teriyaki signage. It does not clearly show this storefront.

**Reviews carry no faces and no names.** Google is bot-walled to curl; Restaurantji publishes the
three quotes with star ratings and month/year but **no reviewer names anywhere**. Rather than invent
names or ship a grey silhouette, the quotes are presented as a quote strip (verbatim text + stars +
date + "Customer reviews, quoted as written"), not as review cards. **The moment Hayden can read the
Google listing on his phone, swap in 3 named reviews with initial-disc avatars** — that is the single
biggest trust upgrade left on the page.

**`4.4 on Google · 646 reviews`** in the proof chips comes from the hunt sheet in the client note. It
was **not** re-verified this session (Google blocked). Restaurantji's own aggregate is 3.9 / 208, which
is a different corpus. Verify before the pitch or drop the chip.

**Monday closed** comes from Restaurantji only — their own site simply omits Monday. Single-source.

---

## [PLACEHOLDER — ask client] — nothing invented, nothing shown on the page

| Unknown | Where it would go |
|---|---|
| Owner's name | `#about` (there is deliberately no owner story — the section is about the kitchen instead) |
| Founding year / how long in Bonney Lake | `#cta` count-up slot 1, and the About lede |
| A public email address | `#contact` contact-lines (the email line was **removed**, not left blank) and the footer |
| Facebook / Instagram URLs | Footer socials. The client note records "FB /teriyakiwok" — **unverified, so not linked.** The footer carries the real ordering link instead. |
| Reviewer names for the 3 quotes | `#about` quote strip → convert to proper review cards with initial discs |
| Whether Monday is really closed | `#hours` row 2 + `HOURS.days[1]` in `js/site.js` |
| Whether the lunch combos are still $12.95 and what the drink upcharge is | The source line reads "NO DRINK$11.95 WITH DRINK$13.95" against a $12.95 price — self-contradictory, so **the description was stripped** and only the $12.95 shipped. |
| Photos of the beef / pork / short-rib bentos | `images/bento-beef.jpg`, `-pork.jpg`, `-shortrib.jpg` |
| A clean exterior photo and a logo file | `images/storefront.png` (truncated sign) and the header, which is a **typographic wordmark** — no logo was drawn or recreated, per the never-recreate law. |

## Known rough edges to polish
1. **Their own typos are shipped verbatim** (the law is verbatim item names): `C-6 Stir-Fried Almond Chicken6`, `Sp, Rainbow Roll`, `Catepillar`, `Philli Grunch`, `B-3 … California Rol`, `Bake Salmon`. They make the menu read as genuinely theirs, but confirm with the owner before public — some may be real names, some are keying errors.
2. `hero.jpg` was Lanczos-upscaled 1000→1800 px so the browser isn't doing the stretching. It adds no detail; a real hero photo is the fix.
3. The bento stage's `4/3` frame letterboxes the two portrait shots (chicken, salmon) against cream. Correct per never-crop, but consistent bento photography would make it disappear.
4. `#services` and `#menu` sit adjacent and both describe the food — services is the 10-second read, the menu is the prices. If it reads as doubled to Hayden, cut the services grid, not the menu.
5. The three review quotes have their emoji stripped (the source text carried ♥️ and 😋).

## The pitch, in two lines
They have 646 Google reviews and a real website that doesn't have their menu on it — the 201 dishes
and every price live on a third-party ordering platform their customers have to go find.
This page puts the whole menu, the prices and the bento box on their own front door, with a live
open/closed clock, and still hands the order off to the ordering system they already pay for.

**Ticket: $1,000–$1,500 (pitch $1,500).** Frame it as a redesign, never as "you have no website."

## QA
`qa/run.sh` — **23 pass / 0 fail / 0 warn, twice, identical hash.** CLS 0.011. 390 / 768 / 1440 clean,
no horizontal overflow, console clean, all 10 images load, all 12 internal anchors resolve.
Separate headless interaction pass (phone + desktop): all 10 title cards open and close, chevrons
rotate 180°, all 5 bento pills swap photo + name + price + note correctly, status dot renders
`rgb(220,38,38)` red while closed. No console errors.

## Palette revision 2026-09-06 evening (Claude, tokens only)
Hayden: "kind of bland." Warmer rice-paper cream --bg #F6E7CB, sand alt bands --bg-2 #E7D2A8, cards #FFF8E8, lines #D8C39A, deeper lacquer teal --dark #0A3B47, yellow #F6CF12, hours tint #CFE7EC. Previous tokens saved at versions/style-before-palette-0906.css. Published to GitHub Pages.

---

# Atmosphere pass 2026-09-06 (bring it up to Captain Jack's)

**Confidence: 90 / 100.** QA `24 pass / 0 fail / 0 warn`, twice, identical hash.
`index.html` sha256 `2c81650f9df81d82252414b705f0e2045623af7fb37142bb994f2636fa3550ab`
Screenshots the parent should read: `review-0906/` (390 fold, 390 full, nine 390 section shots, 1440 full).
Nothing was published, `demos-pages/` was not touched, nothing was committed.

## What changed

| | Before | After |
|---|---|---|
| **Ground** | one warm rice-paper cream (`--bg #F6E7CB`), sand alt bands | **DARK** — walnut-charcoal `--bg #1B1613`, `--bg-2 #120F0D`, cards `--paper #241D18`, `--dark #0A0807`, and one deep lacquer-teal band `--tint #0A2C34` under the hours. Full token swap; the whole stylesheet was rewritten dark-first on the Captain Jack's architecture, so there is no `var(--dark)`-on-dark and no cream-assumed scrim left anywhere. |
| **Hero** | `images/hero.jpg` — a party platter, Lanczos-upscaled 1000→1800, PROVISIONAL | `images/hero-exterior.jpg` = **harvest-0906/g1**, a sharp 1920×1440 exterior with the whole "fresh Sushi · Teriyaki Wok" sign in full sun. EXTERIOR HERO DEFAULT, and the interiors now live below it. |
| **Header mark** | a typographic wordmark (no logo) | **a keyed crop of their real channel letters** off g1 — `images/sign-mark.png`, 720×194, alpha-keyed so the yellow letters and the flame over the "o" survive and the facade drops out. Nothing redrawn (NEVER RECREATE). Used in the header and the footer only. |
| **Type** | Archivo Black + Barlow | unchanged, and re-confirmed against a 4× crop of the sign (heavy geometric grotesque, flat-topped T, straight-legged k). Archivo Black ships one weight; `font-weight:400` is pinned on every display element. Headline scale raised to Jack's: `clamp(36px, 6.2vw, 66px)`. |
| **Photos** | 5 site photos, all from their CloudFront bucket, upscaled / AI-smoothed, incl. a 500 px circle-cropped storefront | **9 fresh full-size Google photos, each used exactly once**, all in mounted prints with real captions. The old 5 are deleted from `images/`. |
| **Signature** | Build your bento | **kept** — it is their own real offer (B-3…B-7, identical four sides, so the only choice is the main). Restyled dark; the stage now has a warm-white lightbox mount so their white-background product shots don't float as a slab. |
| **Menu** | 10 unroll cards, 201 items | **all 201 kept verbatim**, spliced through untouched, now two-column inside each opened card on desktop. |
| **Cut** | — | the four template-default icon cards in `#services` (icon + heading + sentence). Their content was folded into `#about` as a real three-station list with real counts. |
| **Added** | — | **10 more real dishes** transcribed verbatim from `harvest-0906/g7`, a photo of their **printed in-house menu**: Tartare & Tataki (4) and the Carpaccio menu (6, $25–$45 toro). **These are on no online source** — the ordering page does not list them. Also a `#reviews` section, and a CTA numbers band (201 / 56 / 6). |

**Photo allocation (never the same photo twice):** g1 hero · g6 the dining room in `#about` · g7 the printed menu page in `#menu` · g8 + g5 + g3 the dish strip under the menu · g2 + g4 + g9 the `#gallery` prints. Images before → after: 10 → 15 (9 real photos + the sign mark + 5 bento shots).

## PROVISIONAL — needs Hayden's eye

- **The dark-ground call, stated honestly.** The parent brief called g6 "a DARK room." It is a **mixed-brightness** room: white acoustic-tile ceiling, grey concrete floor, cream vinyl chairs — but reddish-walnut live-edge tables, a charcoal wall behind the counter, ten black menu boards, red sushi lanterns, and every single food photo they own is shot on that dark walnut. The ground mirrors **the tables and the food photography**, not the ceiling. It is the right call for this page (the keyed yellow sign mark and the teal only exist on a dark ground) but it is a judgement, not a fact — if Hayden reads the room as light, the fix is a warm-cream `--bg` swap plus re-tuning `--brand-text` and the hours band, ~20 minutes.
- **`4.4 on Google · 646 reviews`** still comes from the hunt sheet and was **not** re-verified (Google is bot-walled). Verify before the pitch or drop the chip.
- **Monday closed** is still single-source (Restaurantji); their own site simply omits Monday.
- **Bento photo honesty note kept:** only chicken and salmon show an actual boxed bento; beef, pork and short rib show the main plated, and the gadget says so in an italic line under the price.
- **The printed-menu prices are written without a `$` on the menu itself** (just "16", "25"). They ship as `$16` / `$25`, which is the plain reading — confirm with the owner if he wants them exactly as printed.
- **Their own typos still ship verbatim** (`Sp, Rainbow Roll`, `Catepillar`, `Philli Grunch`, `Bake Salmon`, `C-6 …Chicken6`). Confirm before public.

## [PLACEHOLDER — ask client] — nothing invented, nothing shown on the page

| Unknown | Where it would go |
|---|---|
| Owner's name and how long they've been in Bonney Lake | `#about` lede, and the CTA numbers band |
| A public email address | `#contact` contact-lines (removed, not left blank) and the footer |
| Facebook / Instagram URLs | Footer socials — the client note's "FB /teriyakiwok" is unverified, so it is not linked |
| **Reviewer names for the three quotes** | `#reviews`. No source publishes names, so no names and no invented monogram discs are shown — the section says so on the page. The moment Hayden can read the Google listing on his phone, swap in 3 named reviews with initial discs. Biggest trust upgrade left. |
| Whether Monday is really closed | `#hours` row 2 + `HOURS.days[1]` in `js/site.js` |
| Whether the lunch combos are still $12.95 and what the drink upcharge is | the source line contradicts itself, so only the $12.95 ships |
| Photos of the beef / pork / short-rib bentos | `images/bento-beef.jpg`, `-pork.jpg`, `-shortrib.jpg`; then delete the `note` strings in `js/site.js` |
| A photo of the sushi bar itself, and one of the kitchen/grill | `#about` (a second print) — the harvest has no shot of either |

## Pitch framing — unchanged and still load-bearing

They **have** a live own-domain site (`teriyakiwoksushiwa.com`). This is a **redesign**, never "you have no website." The gap is the whole sale: their site is one screen with no menu on it, while 201 dishes and every price live on a third-party ordering platform their customers have to go find — and ten more dishes (the tataki and carpaccio lists) exist only on the paper menu at the table. **Ticket $1,000–$1,500, pitch $1,500.**


## October 23, 2026 — Codex Friday finish (current source)

Converted the 4 saved Google name/photo pairs to a continuous 40 px/s ribbon. No playback/navigation controls; hover, touch and keyboard focus pause; reduced motion leaves a manual reading rail; resizing remeasures the loop. Dynamic duplicate is presentation-only, inert and aria-hidden, not an additional review. Review dates remain the source snapshot, explicitly disclosed.

Added four evidence-backed facts from facts.json _sourced_facts: items_on_menu 201, sushi_rolls 56, sashimi_cuts 10, five B-3…B-7 mains and identical sides; own menu11 ordering source. No room plan, dated event schedule or current seasonal special was invented; explicit gaps live in brief.json → missing. Replaced the inactive message form with verified phone and ordering actions. Content remains visible if JavaScript fails.

Google actions: saved verified CID listing; a direct write-review URL remains unavailable. Source-only changes; no publication or visual/runtime verification.

**Duplicate-mark flag:** The repeated sign-mark.png was an authentic mark in header/footer, not duplicated business photography. Kept the genuine header mark and Friday hero. Replaced only the redundant small footer image with a clearer plain business-name label; checker is unchanged. Also removed the unsourced no-reservations promise.
