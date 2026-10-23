# The Red Dog Saloon — handoff

18605 Renton-Maple Valley Rd, Maple Valley, WA 98038 · (425) 413-8600
Slug `red-dog-saloon-maple-valley` · no domain; Google's Website button points at Facebook (the pitch angle).

## Atmosphere pass 2026-09-06 — REBUILT FRESH from `~/website-factory/template/`

The previous pass (`versions/astra-draft-0905/`) was rejected. Nothing of its HTML or
CSS was reused. Its `CONTENT-BRIEF.md` and `research-sources/restaurantji.html` were
used as *research only*, alongside a fresh 46-frame Google-photo harvest in
`harvest-0906/`. Model build: `sites/captain-jacks-bar-and-grill/`.

### First, a correction to the brief I was handed
The task brief's photo map (g1 = hero, g15/g28 = menu boards, g36 = wrestling poster)
does **not** match the files in `harvest-0906/`; the numbering is shifted. What is
actually there, verified by eye:

| brief said | actually is |
|---|---|
| g1 hero exterior | g1 = the building at dusk, lights on (good, but g28 is better) |
| g15 menu board | g15 = a low-res 640×480 band shot (fails the photo-quality gate) |
| g28 chili-dog board | **g28 = the best exterior in the harvest** — blue sky, the sign, the door |
| g36 wrestling poster | g36 = the row of Harleys out front |

Real menu boards are **g18** (main board, fully legible, all prices) and **g31**
(chili-dog board). The wrestling poster is **g39** and is dated *Friday, June 22, 2018* —
a one-off from eight years ago, not a recurring event, so it is not on the page.

Also corrected: the brief's weekly slate (jam Sun, karaoke Mon/Wed/Sat, bingo Tue,
country jam Thu, $6 Sunday steak night) is **not sourced anywhere in the material I
have**. Only two nights survived: live music Fridays (their own banner) and karaoke
(named, but no day given). Everything else is in the ask-client list below, not on
the page.

### What was built
- **Ground: DARK (MIRROR LAW).** The room is genuinely dark — wood posts, plank walls,
  red vinyl stools, beer neon doing all the lighting (g3, g10, g42, g44, g46). Full
  `:root` swap plus the template's four dark-ground overrides swept at the bottom of
  `css/style.css`. Palette sampled from their own photos: `--brand #C43A2E` (the red on
  the roadside sign and the barn-red walls), `--warm #E9A63C` (the string lights over
  the beer garden), `--bg #17110E`, `--ink #F1E7D8`. **Zoned:** brand owns buttons and
  the nav CTA; warm owns eyebrows, highlighted words and prices. They never swap jobs.
- **Hero: `images/hero-stack-1.jpg` = harvest `g28`** — the barn-red building from the
  road, the sign on its pole, real sky. Exterior-hero default; the interiors are all
  further down the page. Nothing sits on the photo but the headline block. No vertical
  exterior frame exists in 46 photos, so phones get the documented **hero stack**:
  three real photos, `height:auto`, doubled track, constant linear scroll, reading
  outside → through the door (`g22`) → the room (`g10`).
- **The mark is a crop of their real sign** (`images/mark.jpg`, cut out of `g4`) — the
  red outlined "The RED DOG SALOON" with the little saloon-building drawing between RED
  and DOG. Never redrawn. It is the header lockup and the footer plate.
- **Type:** Oswald 400–700 (display) — the closest living relative of the fat outlined
  marquee letters on their sign and the "LIVE MUSIC EVERY FRIDAY NIGHT" banner — over
  Barlow 400–700 (body). Both weights pinned in the Google Fonts link.
- **Signature: THE CHILI-DOG BOARD** (`#signature`, section 5). Their genuine one-of-one:
  a second laminated board on the wall carrying five house chili dogs, one named after
  the town. Tap a name, that dog gets built on the bun — chili, cheese, bacon, jalapeños,
  sour cream, sauerkraut, each a real topping off the board. Tap again clears the plate.
  Five labelled pills, one tap, instant visible payoff, no instructions, result sits
  ABOVE the pills on phones. Every name, price and description is the board's own
  wording, verbatim. The chili dogs appear **only** here; the main board's food appears
  **only** in `#menu` — no item is on the page twice.
  (The brief's suggested tap-a-night strip was dropped: with only Friday day-certain it
  would have been a one-item strip, and building it out would have meant inventing nights.)
- **Menu inline with prices**, all 18 read off the photographed board `g18`: burgers,
  wings, salads etc, appetizers. Verified twice at 4× upscale.
- **Photos: 0 → 16 on the page**, all from `harvest-0906`, all ≥1238px on the short
  edge, no photo twice, no identifiable customer faces (excluded: g17, g20, g26, g30,
  g33, g35, g37, g38, g40 — all show customers; g12/g15/g33 also fail the 600px gate;
  g32 is a bathroom soap dispenser; g43 is shot through a windscreen). The band photos
  used (g5, g29) show performers on a public stage at a distance.
- **Reviews:** no named-reviewer + real-profile-photo pair could be sourced for this
  listing, so per the 2026-09-06 review law the score is the object (4.4 / 448 on
  Google) and the three quotes are cited to the listing and the month posted — never
  dressed up with an invented name or a fabricated face. Link out to the live listing.

### PROVISIONAL — confirm before this goes live
- **Sunday's closing time.** The seven-day set on the page is Restaurantji's for this
  exact address, page-stamped "Updated on: Aug 17, 2026": Mon–Thu 12 PM–12 AM,
  Fri–Sat 12 PM–2 AM, **Sun 12 PM–11 PM**. The brief I was handed says Google shows
  **Sunday noon–2 AM**. Only Sunday disagrees; the live open/closed light is driven by
  this table, so a wrong Sunday close shows a wrong light. One phone call settles it.
- **Karaoke has no day on the page** because none is sourced. The card says to ring the
  bar. If karaoke really is Mon/Wed/Sat, that card becomes much stronger.
- The 4.4 / 448 Google figures came from the brief, not from a source I could open
  myself; Restaurantji separately shows 4.5 from 178 ratings. Re-read the Google
  listing before the link goes to an owner.
- Facebook URL uses the numeric page id `173757529301739` (linked by Restaurantji and
  Bandsintown). Worth one click to confirm it lands on their page.
- "A hooped cover sits over the whole stage, so a wet night doesn't cancel anything" is
  a description of what the photos show, not a claim the bar has made.

### Ask-client list (nothing below is on the page)
1. **Sunday close — 11 PM or 2 AM?** And is the kitchen's last call earlier than the bar's?
2. **Which nights is karaoke?** And are bingo, a Sunday jam, a Thursday country jam or a
   $6 Sunday steak night real? All four were in the lead notes with no source behind them.
3. **Owner's name and the story.** The listing shows an owner as "Sharon L." — unverified,
   so no owner is named anywhere on the site. An About paragraph in her words is the
   single biggest upgrade available.
4. **Are the board prices current?** Both boards were photographed by customers, undated.
5. **Three named Google reviews** the owner is happy to feature, so the review block can
   carry real names and real profile photos instead of the aggregate.
6. **An email address** for the contact form (needed for the Web3Forms key at go-live).
7. Is there a printed weekly events calendar? If so, photograph it — the events section
   is built to take four to six real nights.
8. Photo rights for the harvested Google photos before this is published anywhere public.

### State
- QA `qa/run.sh` — **25 passed, 0 failed, 0 warnings, twice in a row** on the final file.
  390 / 768 / 1440 all clean, CLS 0.004, console clean, no `[SLOT` and no `[PLACEHOLDER`.
- Screenshots for the parent: `review-0906/390-full.png`, `390-signature.png`,
  `390-closed-hours.png` (red light, closed state), `1440-full.png`, `1440-signature.png`.
- sha256 `index.html` — `e77baba0e628f6c2750dd6de10e25287cca8e6c3f1434dac1c1a51844dc00cdb`
- **Not published.** No deploy, no demos-pages, no git, no outreach.
