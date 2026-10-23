# Four Seasons Chinese Restaurant — content brief

820 Griffin Ave, Enumclaw, WA 98022 · (360) 825-6541
Dossier: `~/Documents/Obsidian Vault/Recon/four-seasons.md` (2026-09-04)
Built: Batman night 9, 2026-09-04. No re-scraping — every fact below traces to
the dossier or to one of their own photographs already in the harvest.

---

## The one sentence the buyer has to believe

**"Four Seasons is still there on Griffin Ave, the room still looks like this,
and the whole real menu — including the four dinners named after the seasons —
is one tap away."**

They have no website at all (their Google profile shows "Add website"; the
Facebook website field points at the Four Seasons *Hotels* corporate site). The
doubt isn't "is it good" — Yelp runs 2.6 and Google 3.9, a genuinely mixed
split. The doubt is **"is that place still open, and what does it cost."** So
the section order retires exactly that, in that order:

| # | section | the doubt it kills |
|---|---|---|
| 1 | `#hero` | is the room still like that → three real photos of it, moving |
| 2 | `#hours` | are they open → live green/red status, all 7 days, address |
| 3 | `#menu` | what do they have, what's it cost → their printed menu + 49 real prices |
| 4 | `#signature` | why go here and not anywhere → the four seasonal dinners |
| 5 | `#gallery` | what actually comes out → 6 real plates and one lantern |
| 6 | `#about` | is it worth the drive → the last of six sister restaurants |
| 7 | `#reviews` | who says so → five verbatim reviews, real names and dates |
| 8 | `#contact` | how do I order → phone, three steps, form |
| 9 | `#cta` | last push |

`#signature` sits at index 4 — the INTERACTIVE = SECTION 4 OR LOWER law.

---

## Hero — SUPERSEDED 2026-09-10 (hero-quality revision pass)

> **The HERO STACK described below no longer ships.** On 2026-09-10 the hero was
> rebuilt under HERO FIRST / HIGHEST QUALITY + CRISP RULE. The stack's desktop
> layer contained `hero-stack-1.jpg` (1600x783) over a blurred **cover** echo of
> itself, and that echo rendered at **1.077x native at 1440x900 and 1.241x at
> 768x1024**; on phones the stack ran `linear infinite`, which also breaks the
> one-event/never-loops rule.
>
> Route (a) was taken: the SAME real photograph of 820 Griffin was re-harvested
> from the business's own Google Business Profile photo tab at its native
> **4032x3024** (2026-09-04 had only ever saved it at 1920x1440). Provenance and
> every source URL: `harvest-0910/urls.txt`.
>
> The hero is now ONE idea, still the OUTSIDE of the store (EXTERIOR HERO DEFAULT,
> 9/4, respected), with two real crops of that native original:
> `images/hero-exterior-wide.jpg` 2800x1647 (desktop) and
> `images/hero-exterior-tall.jpg` 1400x2500 (phone), swapped by `<source media>`.
> Measured cover scale: 0.514 at 1440x900, 0.549 at 768x1024, 0.308 at 390x844 —
> nothing above native anywhere on the page (worst is 0.882).
>
> The mark is live type in the road sign's face (Yeseva One, chosen against a 4x
> upscale of the real sign; SIGN-FONT LAW + CRISP RULE). The opening event is
> "the four seasons come on" — four warm blooms landing in turn on the four real
> painted medallions on their front wall, then the four season lights and the
> name settle. 2.74s, once, never loops.
>
> `hero-stack-2.jpg` (the road sign with Mount Rainier) and `hero-stack-3.jpg`
> (the room) are still in `images/` but are no longer referenced by the page.
>
> Full write-up: `showroom/output/deep-wave-20260910/four-seasons/RESULT.md`.

## Hero pick — REVISED 2026-09-04 (Hayden: exterior, not the room)

Hayden's 2:35 AM note: *"I want them to be physical pictures of outside of the
store for the hero image rather than inside because we already have other photos
of inside the establishment."* The hero is now **the outside of 820 Griffin**.

**HERO STACK, three real photos, in walking order.**

| slot | source | why |
|---|---|---|
| `hero-stack-1.jpg` | `gmap-exterior-building.jpg` (Google Maps listing photo) | **The pick.** The whole building from the parking lot: shingled pagoda roof, the four painted medallions along the front wall, the lit marquee reading "Lunch Specials 12-3 Mon-Sat", and *The Four Seasons* in script at the far end. The walk-up. Also the desktop hero. |
| `hero-stack-2.jpg` | `gmap-exterior-sign.jpg` (Google Maps listing photo) | the sign at the road — FOUR SEASONS / Chinese Restaurant & Bar, the reader board, **820** on the base, Mount Rainier over the trees. Fully legible at 390 wide. |
| `hero-stack-3.jpg` | `yelp_28` | the payoff: the room you walk into, lanterns lit. Kept in the hero rather than dropped, so it is not lost from the page. |

**Both exterior frames are listing comps** — Google Maps user uploads on the
business's own listing, not photographs Hayden or the client took. A drive-by
shoot would replace them with owned frames; until then they are the only
exterior photography that exists for this business.

**Crops (NEVER CROP THE IMPORTANT PART):**
- Building: dead sky trimmed off the top only (`y 500→1440` of 1920×1440), then
  1900×930 at q80. Building, medallions, marquee and wordmark all whole.
- Sign: a lens/awning obstruction sat in the top-left corner of the original, so
  the frame is cropped in from the left and top (`500,120 → 1920,1440`),
  1420×1320 at q80. Sign, the 820 plaque and Rainier all whole; obstruction gone.

**Desktop treatment — letterbox, not a crop.** The building frame is 2.04:1
against a hero that is 1.73:1, so a cover-crop would have eaten the left-hand
medallions. Frame 1 is `object-fit:contain` over a blurred, darkened echo of
itself (`.hero-echo`). Phones keep the existing conveyor: `height:auto`,
`contain`, track doubled, `linear infinite`, no crop at any width. The hero
scrim was eased on both breakpoints — it had been tuned for a dark interior and
was crushing a daylight photograph.

**Displaced interiors.** `yelp_22` and `yelp_04` left the hero and now ship as
`gallery-7` / `gallery-8`, opening the "Inside 820 Griffin" gallery ahead of the
lantern and the plates. Nothing appears twice on the page.

**STOREFRONT-BELOW-HOURS** is now satisfied by the hero itself, so the offerings
section keeps their real printed menu on their own table.

Nothing sits on the photo but the headline block.

---

## Design decisions

**Ground: DARK.** The cream-never-white law allows a dark ground "only when the
interior IS dark." This interior genuinely is: green-painted walls, dark green
vinyl booths, a woven lattice ceiling, low carved-lantern light. MIRROR LAW,
interior first. The cream on the page is their **printed menu paper**, used as
the text colour rather than the ground.

Because this is a dark-ground build, the three shared template rules the README
warns about were swept in this site's own CSS (never the shared file): the
footer background, the About lede colour, and the `.card .ico` / `.face .ini`
pair — plus every `color:#fff` on an amber-filled surface, which was flipped to
`var(--dark)` for contrast.

**Palette — every hex PIL-sampled from their own photographs:**

| token | hex | sampled from |
|---|---|---|
| `--bg` | `#142219` | the dining-room wall / booth green (`hero-stack-1`, read `#15251A`–`#17291D`) |
| `--bg-2` | `#0E1912` | the deeper green in the same frame's shadows (`#102016`) |
| `--paper` | `#1C2E22` | one notch up from `--bg` for cards |
| `--ink` | `#EDE6D4` | their printed menu paper (`menu-sheet`, read `#E6E6DF` / `#D1D3C6`) |
| `--brand` | `#E0913F` | the amber glow off the lit tiki lanterns (`gallery-1`, read `#E6833B`) |
| `--accent` | `#C4703C` | the honey-copper booth trim and tabletop (`#BE6841` / `#633C2E`) |
| `--warm` | `#E8C98F` | the lit lantern face itself (`gallery-1`, read `#E3CA92`) |
| `--dark` | `#0A130D` | the darkest shadow in the room (`#12110D`, warmed green) |
| `--china` | `#8FA0B8` | the blue floral rim on their own dinner plates |

No red anywhere. The Milton Wok build (9/2, the other Chinese restaurant in the
factory) is cream-ground and red-led; this one is dark-ground and green-led, and
shares no font, no signature move and no ground with it.

**Type: Trirong 600/700/800 (display) + Work Sans 400–800 (body).** Both first
use in the factory (diffed against every `--display` / `--body` in
`sites/*/css/style.css`).

**On the logo font — EXACT LOGO-FONT MATCH law, discharged:** their printed
lockup was cropped from `yelp_15` and upscaled 5× before any claim was made. It
is a **bold transitional serif, high stroke contrast, vertical stress, bracketed
serifs, spurred S** — a Times/Nimbus-class face, i.e. the Word default of a
printed menu. Trirong is **NOT claimed as a match to it.** It is chosen for the
room. The real lockup is not redrawn: it **ships as an image crop** of their own
menu, background knocked out and the letters recoloured to the menu-paper cream
(`images/logo.png`), used in the header and the footer. NEVER RECREATE satisfied.

**Recurring device (COHESION LAW): the lattice.** Their ceiling and every booth
back is a woven wood lattice. It is drawn as a fine hairline cross-hatch band
under every single eyebrow on the page, in `--accent-soft`, masked to fade right.

---

## Signature — THE FOUR SEASONS TABLE

Their one-of-one is not the room and not the bar. It is that the restaurant is
named **Four Seasons** and its family-style dinners are named **Spring, Summer,
Autumn and Winter** — and each one puts **one more dish** on the table than the
last: 5 → 6 → 7 → 8. That is real, printed, verifiable and belongs to nobody else.

Four labelled buttons. One tap lays that dinner's real dishes onto a honey-wood
tabletop as drawn plates with the blue china rim, staggered 90 ms apart; the
price and the dish count land under it; the lantern glow over the table takes
that season's colour. Tap the lit season again (or the table) and it clears.

- **Toddler law:** 4 chips (≤5), labelled pills not glyphs, one obvious tap,
  instant animated payoff, tap again clears, no instructions past one line.
- **Object + number only** — plates and `$19.50` / `5 dishes`. The pick is never
  narrated back in a sentence.
- **Not an estimator** — nothing to type, no units, no domain knowledge.
- **Not a restatement** — the family-style dinners appear **only here**, never in
  `#menu`. NEVER TWICE holds.
- Phone: the table sits **above** the chips (the result-above-the-swatches rule).
- `prefers-reduced-motion`: plates land on the final frame with no animation.
- Every season colour is a `:root` token; the JS sets `data-season`, not a hex.

Deliberately **not** Milton Wok's THE LOUNGE (9/2 — a dark room, one tap, the
lights come on). Different object, different interaction, different payoff.

Explicitly skipped: floor-plan map (MAP ACCURACY — two interior frames is not a
plan), tradition countdown (the Maui Room's karaoke nights are sourced only to a
possibly-stale second Facebook page), estimator (banned), animated-mark opener
(the lit dining room is a stronger opener than a wordmark, and "the sign comes
on" has run several times this fortnight).

---

## Slot → source

| what | source |
|---|---|
| Name, address, phone | dossier frontmatter + their own printed menu (`yelp_15`) |
| Hours, all 7 rows + `HOURS` config | dossier Hours table (Yelp + Google cross-confirmed) and their menu's own "Monday – Saturday: 12noon – 8pm / Sunday: Close" |
| "Open on holiday Sundays" note | their printed menu, verbatim parenthetical |
| Proof chips | 3.9 Google + 124 Yelp reviews (dossier); take-out from the menu's own "take out add $1.50" lines and the takeout-box photo |
| Every menu price (49) | read off `images/menu-sheet.jpg` = `yelp_14`, dated January 2024 |
| Family-style dinner contents + prices | same sheet, centre panel, zoomed 4× to transcribe |
| "No checks · Visa, Mastercard, Discover" | their menu's own line + the card logos printed on it |
| Owner story, five sister restaurants | Rick S., Yelp, Feb 12 2025, verbatim |
| Bing / Ming / Helen / Sara | Yelp Q&A signed "Bing P., Business Owner" + Jody P.'s review |
| "Maui Room" second name | the literal title of their own secondary Facebook page |
| Five review quotes | dossier Reviews section, verbatim |
| Facebook link | primary page, 975 followers |

**Menu photos deliberately NOT used:** `yelp_24`, `yelp_25` and `yelp_27` are
**older printings** of the same menu with different prices (Almond Chicken 12.50
vs 16.00) and different hours (11am–10pm). Shipping them would have contradicted
the live page. Only the January 2024 sheet was transcribed.

---

## Photos — PROVISIONAL picks (Hayden picks the photos; batch mode picked for him)

Every one opened and looked at before it shipped. 11 photos ship; all 30
harvested came from Yelp's own `biz_photos` carousel for this business.

| file | source | note |
|---|---|---|
| `hero-stack-1/2/3` | `gmap-exterior-building` / `gmap-exterior-sign` / `yelp_28` | outside, the sign, then the room (revised 9/4) |
| `gallery-7` / `gallery-8` | `yelp_22` / `yelp_04` | the two room frames displaced from the hero |
| `menu-sheet.jpg` | `yelp_14` | the real printed menu, opens the offerings section |
| `gallery-1` … `gallery-6` | `yelp_30`, `yelp_09`, `yelp_29`, `yelp_06`, `yelp_05`, `yelp_16` | lantern close-up + five plates |
| `about.jpg` | `yelp_01` | shrimp fried rice in the takeout box |
| `logo.png` | crop of `yelp_15` | their real printed wordmark, recoloured only |

**Rejected:** `yelp_23` (a different brand's logo across the diner's shirt),
`yelp_24` / `yelp_25` / `yelp_27` (stale menus, see above), `yelp_20` and
`yelp_18` (fingers / half a plate — NEVER CROP THE IMPORTANT PART),
`yelp_03` / `yelp_10` (near-duplicates of `yelp_01`).

**Exterior (added 2026-09-04):** two Google Maps listing photos of the building
now open the site — see the revised hero section above. They are listing comps,
not the client's or Hayden's own photography; a drive-by shoot would upgrade
them. The offerings section keeps the printed menu.

---

## Deliberately omitted rather than invented

- **Founding year / "40 years"** — nowhere sourced. No `est.` line, and the
  template's four count-up numbers were **deleted entirely** rather than filled
  with metrics. Every honest number already lives once on the page.
- **Per-review star ratings** — the source listing did not expose them per
  review. Names and dates ship; stars do not. The aggregate lives once, in the
  proof chips.
- **Maui Room hours, karaoke, DJ nights, "open till 2am"** — sourced only to a
  secondary Facebook page whose hours contradict the primary listing. The page
  states only the verifiable fact: that second name exists on their own page.
- **Full bar / banquet room** — inferred in recon, never confirmed. Not on the page.
- **Instagram** — none found. The footer social row carries Facebook only.
- **Email address** — none known. The email line was deleted from contact and footer.
- **A services card grid** — every card would have been a guess. Section deleted.

No `[PLACEHOLDER — ask client]` string appears anywhere on the page.

---

## Ask client (batched, for the call)

1. **The Maui Room.** Their second Facebook page advertises noon–2am Friday and
   Saturday with karaoke and a DJ. Is that current, or is the page stale? It is
   the single best angle this business has and the site is currently silent on it.
2. **Founding year**, and whether the "last of Dynasty's / Ming Tree / Forbidden
   City / Lotus Tree / The Great Wall" story is right — it came from a customer's
   review, not from them.
3. **Bing and Ming's surnames**, and Helen's and Sara's, if they want them named.
4. **Menu date.** The prices shipped are from the January 2024 printing. Is there
   a newer sheet?
5. **Photographs.** No exterior shot of the building exists online, and no photo
   of the Maui Room lit up. A drive-by (front of the building, and the bar at
   night) would upgrade this build more than anything else.
6. **Google review count.** One pull showed 594 next to a 3.9 rating, which looks
   high; the page ships the rating without a count for that reason.

## QA

`~/website-factory/qa/run.sh` — 23 passed, 0 failed, 0 warnings, twice in a row.
Screenshots at 390 / 768 / 1440 eyeballed: hero fills the phone screen carrying
only the headline block, seven hours rows with today lit, nothing doubled, the
signature reads as a table you tap.


## October 23, 2026 — Codex Friday finish (current source)

Converted the 5 saved Google name/photo pairs to a continuous 40 px/s ribbon. No playback/navigation controls; hover, touch and keyboard focus pause; reduced motion leaves a manual reading rail; resizing remeasures the loop. Dynamic duplicate is presentation-only, inert and aria-hidden, not an additional review. Review dates remain the source snapshot, explicitly disclosed.

Added four evidence-backed facts from CONTENT-BRIEF.md: printed January 2024 menu, family dinners, dining-room photos; existing index #menu/#signature/#gallery. No room plan, dated event schedule or current seasonal special was invented; explicit gaps live in brief.json → missing. Replaced the inactive message form with verified phone actions. Content remains visible if JavaScript fails.

Google actions: clearly disclosed name/address Maps searches because no verified listing ID or direct review-writing URL is stored. Source-only changes; no publication or visual/runtime verification.

**History attribution:** Removed the unsourced survivor headline and unpaired Rick S. Yelp quote from the public story. The room, printed dishes and named staff remain; founding history needs owner confirmation. The source menu is explicitly dated January 2024; no current-price guarantee added.
