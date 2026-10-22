# Homestead Brew (Sumner) — CONTENT BRIEF (fleet build 2026-10-08, one pass)

Source of every fact: `~/Documents/Obsidian Vault/Recon/homestead-brew-sumner.md`. Built from the dossier only.
Tier: $500–$750 standard pitch; built to the floor regardless.

## The one sentence the buyer needs to believe
"The little cabin in the McLendon lot is Sumner's best coffee, it's open at 5:30, and here's the board." Their name on the internet today is a GoDaddy for-sale page.

## Five customer connections → where they live on the page
1. **It's right there, early** (commuters, contractors heading into McLendon) → hours band headline "Up before the hardware store", 5:30 live status, Directions as the primary CTA.
2. **The sign / the homestead feeling** (a cedar cabin, a sunrise-over-Rainier emblem) → the hero: dawn lifts, the sun blooms, their real sign fans on ray by ray.
3. **Consistency** ("perfect every single time") → about copy, reviews line, the cup gadget showing the same five drinks.
4. **Local roaster** (Dillanos, Sumner) → proof chip, board intro, about copy, the Dillanos cups in the gallery.
5. **The people at the window** → about copy ("the people at the window remember you"), contact steps in their voice.

## Section order and why
1. **Hero — SUNRISE ON THE HOMESTEAD.** Ground = the real Yelp storefront photo, Upscayl 4x, softened (blur 5px) so its own sign reads as the echo under the crisp mark. Event = pre-dawn blue lifts (`.hero-dawn`, 1.9 s) + a sun blooms over the roofline (`.hero-sun`) + the REAL sign (`images/sign.jpg`, cut from the same photo, Upscayl ultrasharp-4x, never redrawn) fans on via a conic mask from the mountain's peak (0.95–2.3 s) → warm halo bloom (2.15 s) → sub + buttons rise (2.25–2.45 s). ~3 s, deterministic CSS, no loop; reduced motion = final frame. The mark IS the headline (sr-only h1). Nothing on the photo but the mark, one line, two buttons.
2. **Hours band** — all 7 rows (weekdays separate rows, law), live green/red status, address + "the small cedar cabin" landmark line, three proof chips (no rating here — NEVER TWICE with #reviews).
3. **The board** (`#menu`) — six real groups from the painted board, TITLE CARDS UNROLL (details/summary, downward chevron flips up). **No prices shipped**: the photographed board (Yelp cY51…) is out of date — a 2023 Yelp review says the board said $3.25 and the register said $4.75, and Restaurantji shows a newer dark board. Sizes line 12/16/20/24 oz + "prices are on the board at the window."
4. **Pick your cup** (`#signature`, section 4) — five real drinks (Latte, Mocha, White Zombie, Chai, Italian Soda); tap → the 24 oz cup fills with its color + layers (foam / whip / ice + cream); tap again → empties. One gesture, instant payoff, result above the pills on phones. OBJECT + its name only.
5. **Gallery** — six framed prints: inside the window, the bag, across the lot, iced americano, the DCR holiday cup, Italian soda. `align-items:start` so the landscape print doesn't stretch the row.
6. **About** — "The little cabin in the McLendon lot." No owner name exists anywhere reachable → the story is the stand's (what reviews + photos prove). Owner name held ASIDE as an ask, never on page.
7. **Reviews — VARIANT B.** 4.9 · 112 on Google (fleet-verified; Restaurantji mirrors it), one true line ("best I have ever had" — Lori T., Yelp, verbatim), link to Google. No name+photo pair was sourceable without the Browser pane (Yelp via Apple = initials only).
8. **Contact** — three steps, phone + directions (no email exists → no email line), form in demo mode. "Office & event orders" step is from a reviewer who catered a meeting with them.
9. **Last screen** — dark pre-dawn band ends on the mark again with a halo ("See you at the window"), four real numbers: 7 days · 12 hrs · 2 windows · 24 oz. Nothing repeated from above.

## Photos — PROVISIONAL (Hayden's numbers override)
hero = yelp-01 (storefront) · sign.jpg = crop of the same · gallery 1–6 = yelp-02, 06, 05, 03, 10, 07 · about = yelp-09. Unused: yelp-08 (a second DCR holiday cup). Never-shipped: yelp-04 (the stale price board), Restaurantji collages. Same photo never twice (the sign crop appears in hero + last band deliberately — the mark, not a photo).

## Design decisions
- **Fonts:** Bebas Neue (display) ≈ the sign's distressed condensed capitals — SIGN-FONT LAW, stated as an approximation read off a 4x crop (condensed, uniform stroke, squared counters). One weight → every display rule set to 400 with positive tracking. Body Karla. Repetition Ledger: Bebas 1 prior use, not in the last 3 rows.
- **Palette (sampled + eyeballed from the sign/cabin/interior):** ink #1C1915 · cream #F3EEE3 · timber amber #B9772F (functional) · sunrise gold #F0B04A (highlight on dark, today's row) · fir #4F6B4A (checks) · pre-dawn #1F2A3A (dark band, scrims). MIRROR LAW: knotty pine + light = cream ground.
- **NEVER TWICE audit:** hours (band only) · address (band + footer) · phone (contact + cta + footer) · rating/count (reviews only) · "McLendon" landmark (hero sub, band note, about, contact step — four different sentences, one fact; trim if Hayden calls it).
- Competitor scan skipped (token diet; references = the two builds Hayden named).

## Held ASIDE — never on the page
Owner name · founding year (Yelp "est. 2013" vs "22 years") · prices · punch-card detail (review-derived: 10 drinks → 11th half off) · weekend raffles (one review) · email.

## Higgsfield
Good fit — see the structured result / client note.


## 2026-10-12 — Coffee at the Cabin revision (Hayden review pending)

Hayden found the animation unnecessary and the full site lifeless. The approved full, straight cabin photograph remains exactly the same. Hero arrival, scroll-reveal and ambient CSS animation are disabled for this version; the cup-filling toy has been replaced, not merely hidden.

Body direction: the same cedar/cream/fir world now moves through three distinct real scenes: a behind-the-window Dillanos chapter, one iced drink paired with the actual food selection, and the across-the-lot cabin story. Warm amber and cream sections vary their visual pacing without a repeated card grid. Only one standalone drink photo remains in the body, and every photo is used once. The original animated version and shared CSS/JS are untouched.

Source boundary: all new content is grounded in the saved October 8 dossier above: Dillanos roasted in Sumner; actual menu items; drive-thru and walk-up windows; actual cabin photographs. No owner identity/history, prices, testimonials, customer outcomes or paid imagery added. Current hours and Google review destination are retained. Existing historical review score is unchanged. Native menu disclosures, mobile navigation, hours and maps remain functional.

- Main: `index.html`
- Named revision: `versions/coffee-at-the-cabin.html`
- Exact prior main and visual evidence: `handoffs/homestead-life-2026-10-12/`
- Shared dependencies unchanged, so previous named variants retain their design.
- Legacy site has no `brief.json`; spec marks it a pre-spec build. Spec passes with the two unused animation declarations in shared CSS noted; runtime checks confirm zero running animations at all four tested widths.
