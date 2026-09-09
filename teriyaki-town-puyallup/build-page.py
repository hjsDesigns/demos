#!/usr/bin/env python3
"""Assemble index.html for Teriyaki Town from the verified menu blocks.
Keeps the 119 real items out of hand-typed HTML so nothing can drift from
their own ordering page. Run: python3 build-page.py [hero_variant]
"""
import json, sys, os

B = json.load(open(os.path.join(os.path.dirname(__file__), 'harvest/menu-blocks.json')))
HERO = sys.argv[1] if len(sys.argv) > 1 else 'town-box'

CHEV = ('<span class="chev" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" '
        'stroke="currentColor" stroke-width="2.6" stroke-linecap="round" '
        'stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></span>')


def board(bid, title, when, key):
    return f'''        <div class="board reveal">
          <button class="unroll" type="button" aria-expanded="false" aria-controls="{bid}">
            <h3>{title}</h3>
            {CHEV}
          </button>
          <p class="when">{when}</p>
          <div class="rolled" id="{bid}">
            <ul>
{B[key]}
            </ul>
          </div>
        </div>'''


BOARDS = "\n\n".join([
    board('roll-teri',   'Teriyaki',        'Eighteen of them, with rice and salad',            'teri'),
    board('roll-tcombo', 'Teriyaki combos', 'Two things on one plate, with rice and salad',     'tcombo'),
    board('roll-wok',    'Chinese wok',     'Seventeen off the wok, with steamed rice',         'wok'),
    board('roll-wcombo', 'Wok combos',      'A wok dish plus chicken teriyaki, rice, no salad', 'wcombo'),
    board('roll-rice',   'Rice, noodles and bowls', 'Fried rice, yakisoba, teriyaki bowls, family dinners', 'rice'),
    board('roll-start',  'Starters, soup and sushi', 'Egg rolls through the roll list, and what to drink',  'start'),
])

# ---------------------------------------------------------------- heroes
HERO_TOWN_BOX = '''  <!-- ===================== #hero — "TOWN BOX" =====================
       EXTERIOR HERO DEFAULT (2026-09-04): every interior photo appears further
       down the page, so the opener is the actual building on 112th — their own
       three-dimensional channel letters, the OPEN neon lit behind the glass,
       real sky behind it. Nothing sits on the photo but the headline block and
       the two buttons.

       The one event: their sign is built in two pieces — the brushed red
       letters bolted flat to the fascia, and a separate blue lightbox on the
       end that says TOWN. So the wordmark arrives that way. The letters are
       already there; the blue box slides in from the right and lands with one
       small settle. 1.3 s, once, then nothing moves again.

       SIGN-FONT LAW + CRISP RULE: the headline is LIVE TYPE in Titan One, the
       closest sturdy Google face to the fat hand-brushed caps on the sign, in
       the sign's own red / white / blue. The real lettering is only ~230 px
       wide in the best photograph of it, so it is never blown up as a raster
       mark — the real sign stays in the photograph, uncropped, right above.
       ================================================================= -->
  <section class="hero v-town-box" id="hero">
    <h1 class="sr-only">Teriyaki Town — teriyaki and Chinese, 5605 112th St E, Puyallup, Washington</h1>

    <div class="tb-stage" aria-hidden="true">
      <picture>
        <source media="(max-width:820px)" srcset="images/storefront-tall.jpg" width="1125" height="1500">
        <img class="tb-shot" src="images/storefront-wide.jpg"
             alt="" width="1800" height="1012" fetchpriority="high" decoding="async">
      </picture>
      <div class="tb-scrim"></div>
    </div>

    <div class="tb-inner">
      <p class="tb-mark" aria-hidden="true">
        <span class="tb-teri">Teriyaki</span><span class="tb-box">Town</span>
      </p>
      <p class="tb-sub">Teriyaki, wok and rolled sushi, off 112th. Eat in or take it home.</p>
      <div class="tb-actions">
        <a href="#menu" class="btn btn-primary">See the whole menu</a>
        <a href="tel:2534452443" class="btn btn-cream">Call (253) 445-2443</a>
      </div>
    </div>
  </section>'''

HERO_PINNED = '''  <!-- ===================== #hero — "PINNED" =====================
       Candidate B. The wall of handwritten notes their customers have left,
       floor to ceiling in the dining room, full bleed. One event: a single
       cream card drops onto the wall and pins itself, carrying the wordmark.
       ================================================================= -->
  <section class="hero v-pinned" id="hero">
    <h1 class="sr-only">Teriyaki Town — teriyaki and Chinese, 5605 112th St E, Puyallup, Washington</h1>

    <div class="pn-stage" aria-hidden="true">
      <img class="pn-shot" src="images/note-wall.jpg" alt="" width="1400" height="680"
           fetchpriority="high" decoding="async">
      <div class="pn-scrim"></div>
    </div>

    <div class="pn-inner">
      <div class="pn-card">
        <p class="tb-mark" aria-hidden="true">
          <span class="tb-teri">Teriyaki</span><span class="tb-box">Town</span>
        </p>
        <p class="pn-sub">Teriyaki and Chinese off 112th. The wall behind this is all theirs.</p>
      </div>
      <div class="tb-actions">
        <a href="#menu" class="btn btn-primary">See the whole menu</a>
        <a href="tel:2534452443" class="btn btn-cream">Call (253) 445-2443</a>
      </div>
    </div>
  </section>'''

HEROES = {'town-box': HERO_TOWN_BOX, 'pinned': HERO_PINNED}

PAGE = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Teriyaki Town — teriyaki and Chinese on 112th, South Hill Puyallup</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="Teriyaki Town at 5605 112th St E in Puyallup — the whole menu with prices, the hours, and the wall of notes their customers left. Open Monday to Saturday, closed Sunday. (253) 445-2443.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<!-- Titan One (display — the fat brushed caps on their outside sign) + Barlow (body).
     Must match --display / --body in css/style.css. -->
<link href="https://fonts.googleapis.com/css2?family=Titan+One&family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css?v=VSTAMP">
<link rel="stylesheet" href="css/hero.css?v=VSTAMP">
</head>
<body>

<!-- ===================== HEADER / NAV ===================== -->
<header class="site-header">
  <div class="header-inner">
    <a class="logo" href="#top" aria-label="Teriyaki Town — home">
      <span class="wm"><span class="wm-teri">Teriyaki</span><span class="wm-box">Town</span></span>
    </a>
    <div class="nav-wrap">
      <span class="hdr-live" id="hdrLive"><span class="dot"></span><span id="hdrLiveText">checking…</span></span>
      <button class="nav-toggle" aria-expanded="false" aria-label="Menu">☰</button>
      <nav class="main-nav" id="main-nav">
        <a href="#hours">Hours</a>
        <a href="#menu">The menu</a>
        <a href="#wall">The wall</a>
        <a href="#signature">Order by number</a>
        <a href="#contact" class="nav-cta">Find us</a>
      </nav>
    </div>
  </div>
</header>

<span id="top"></span>
<main>

{HEROES[HERO]}

  <!-- ===================== #hours =====================
       Live Pacific clock, all seven days, today lit, address. Hours live
       HERE and nowhere else on the page (NEVER TWICE). -->
  <section class="status-band" id="hours">
    <div class="wrap">
      <div class="status-head">
        <p class="eyebrow">When to find us</p>
        <h2>Six days a week, <em>closed Sundays</em></h2>
        <p class="live-line" id="statusLine"><span class="dot"></span><span id="statusText">checking hours…</span></p>
        <p class="status-addr">
          5605 112th St E, Ste 100, Puyallup, WA 98373<br>
          <a href="https://www.google.com/maps/search/?api=1&amp;query=5605+112th+St+E+Ste+100%2C+Puyallup%2C+WA+98373" target="_blank" rel="noopener">Open in Maps ↗</a>
        </p>
        <div class="proof-row">
          <span class="proof"><span class="ico">✓</span> Dine in or take out</span>
          <span class="proof"><span class="ico">✓</span> Free wifi</span>
        </div>
        <p class="hours-note">Holidays can move these — worth a quick call before you drive over.</p>
      </div>
      <ul class="hours-list" id="hoursList">
        <li data-days="1"><span class="day">Monday</span><span class="time">10:30 AM – 9:00 PM</span></li>
        <li data-days="2"><span class="day">Tuesday</span><span class="time">10:30 AM – 9:00 PM</span></li>
        <li data-days="3"><span class="day">Wednesday</span><span class="time">10:30 AM – 9:00 PM</span></li>
        <li data-days="4"><span class="day">Thursday</span><span class="time">10:30 AM – 9:00 PM</span></li>
        <li data-days="5"><span class="day">Friday</span><span class="time">10:30 AM – 9:00 PM</span></li>
        <li data-days="6"><span class="day">Saturday</span><span class="time">10:30 AM – 8:30 PM</span></li>
        <li data-days="0"><span class="day">Sunday</span><span class="time">Closed</span></li>
      </ul>
    </div>
  </section>

  <!-- ===================== #menu — THE BOARD =====================
       The ground goes black here because their own menu boards are black with
       green type — the band is built to feel like standing under them. Every
       item name and every price is verbatim off their own ordering page, read
       8 September 2026. 119 items, nothing invented, nothing rounded.
       TITLE CARDS UNROLL: each headline is the tap target, chevron down. -->
  <section class="board-band" id="menu">
    <div class="wrap">
      <div class="section-head reveal">
        <p class="eyebrow">The board</p>
        <h2>All of it, <em>priced</em></h2>
        <p>Everything on the wall behind the counter, in the order it hangs there. Tap a heading to roll it out.</p>
      </div>

      <!-- The purpose-built object for this band: the actual counter, under the
           actual boards. The two full board photographs that used to sit here
           were cut — every counter code, every board price, the phone number
           and the wordmark are legible-ish inside them, which restated the whole
           page two sections early (NEVER TWICE), and at display size nobody
           could read them anyway. -->
      <figure class="counter-print reveal">
        <img src="images/counter.jpg" alt="The order counter at Teriyaki Town under the lit menu boards, a drinks cooler to one side and a red booth in the foreground" loading="lazy" width="1400" height="787">
        <figcaption>This is the whole board, in the order it hangs on that wall.</figcaption>
      </figure>

      <div class="boards">
{BOARDS}
      </div>

      <p class="menu-fine">Their fine print, not ours: “The price is subject to change without notice due to market fluctuation.”</p>

      <!-- The food photographs used to be a second strip inside #room, under a
           head about red booths and blue carpet. They belong to the board. -->
      <div class="plates-out">
        <figure class="reveal"><img src="images/spread.jpg" alt="A table covered in Teriyaki Town takeout containers mid-meal — rice, yakisoba, salad, soup and dipping sauce" loading="lazy" width="1400" height="1050"><figcaption>An order, opened up</figcaption></figure>
        <figure class="reveal"><img src="images/fried-rice.jpg" alt="House fried rice in a white clamshell takeout container" loading="lazy" width="1050" height="1400"><figcaption>Fried rice, to go</figcaption></figure>
        <figure class="reveal"><img src="images/soup.jpg" alt="A bowl of egg flower soup with a white spoon" loading="lazy" width="1400" height="680"><figcaption>Egg flower soup</figcaption></figure>
      </div>
    </div>
  </section>

  <!-- ===================== #wall — THE ONE OF ONE =====================
       Their dining room has a wall of handwritten notes customers have left,
       floor to ceiling. It is the most convincing thing about the place and it
       exists nowhere online. Shown as the photograph it is — never transcribed,
       never re-lettered, no quote cards built out of it.
       REVIEWS: no reviewer name + profile-image pair could be sourced (Yelp
       403s, the Google reviews pane would not render headlessly), so the page
       carries the honest aggregate and links out. No invented faces. -->
  <section class="section wall-band" id="wall">
    <div class="wrap">
      <div class="section-head reveal">
        <p class="eyebrow">The wall</p>
        <h2>People keep <em>leaving notes</em></h2>
        <p>One wall of the dining room is papered floor to ceiling with them. Nobody asked for that.</p>
      </div>
      <figure class="wall-print reveal">
        <img src="images/note-wall.jpg" alt="A wall in Teriyaki Town's dining room papered floor to ceiling with hundreds of handwritten notes left by customers, a lamp hanging in front of it and flowers on the ledge" loading="lazy" width="1400" height="680">
        <figcaption>The note wall, above the wainscot in the dining room.</figcaption>
      </figure>
      <!-- REVIEW ATTRIBUTION LAW (2026-09-06): every card below is a real Google
           reviewer — their published name, their own published profile image
           pulled from the same source, the quote verbatim, with the real star
           rating and the date Google shows. Nothing written, nothing stock. -->
      <p class="wall-bridge reveal">The ones who didn't have a pen on them left theirs on Google instead.</p>
      <ul class="revs reveal">
        <li class="rev">
          <div class="rev-who">
            <img src="images/reviewer-danice.jpg" alt="Danice Delarosa, who left this review on Google" loading="lazy" width="320" height="320">
            <div>
              <p class="rev-name">Danice Delarosa</p>
              <p class="rev-meta"><span class="rev-stars" aria-label="5 out of 5">★★★★★</span> Google · a year ago</p>
            </div>
          </div>
          <blockquote>best katsu i’ve had in puyallup !</blockquote>
        </li>
        <li class="rev">
          <div class="rev-who">
            <img src="images/reviewer-arnold.jpg" alt="Arnold Ruano, who left this review on Google" loading="lazy" width="320" height="320">
            <div>
              <p class="rev-name">Arnold Ruano</p>
              <p class="rev-meta"><span class="rev-stars" aria-label="5 out of 5">★★★★★</span> Google · a year ago</p>
            </div>
          </div>
          <blockquote>Honestly got to say absolutely love this place gonna be going regularly with my wife, really great service made the food 100x better.</blockquote>
        </li>
        <li class="rev">
          <div class="rev-who">
            <img src="images/reviewer-john.jpg" alt="John Kim, who left this review on Google" loading="lazy" width="320" height="320">
            <div>
              <p class="rev-name">John Kim</p>
              <p class="rev-meta"><span class="rev-stars" aria-label="5 out of 5">★★★★★</span> Google · a year ago</p>
            </div>
          </div>
          <blockquote>The short ribs were really good. Super tender and full of flavor. I thought they’d be expensive, but the prices felt fair, especially considering how everything’s gone up lately.</blockquote>
        </li>
      </ul>

      <div class="wall-out reveal">
        <p class="wall-rating"><span class="star">★</span> 4.1 across 255 ratings on Google</p>
        <a class="btn btn-line" href="https://www.google.com/maps/search/?api=1&amp;query=Teriyaki+Town+5605+112th+St+E+Puyallup+WA" target="_blank" rel="noopener">Read all of them ↗</a>
      </div>
    </div>
  </section>

  <!-- ===================== #signature — ORDER BY NUMBER =====================
       Section five, well below the fold (INTERACTIVE = SECTION 4 OR LOWER).
       Everything on their board is numbered — T1, T11, TC6, C1, C11 — and the
       regulars order by the number. So: five of their own plate photographs,
       cropped straight out of their own printed board, each still carrying its
       real code chip. Tap one, the number comes up big with what it is. Tap it
       again and it goes back. No prices, no hours, no address restated
       (NEVER TWICE) — the codes appear here and nowhere else on the page. -->
  <section class="section" id="signature">
    <div class="wrap">
      <div class="section-head reveal">
        <p class="eyebrow">At the counter</p>
        <h2>Everything here <em>has a number</em></h2>
        <p>The regulars don't read the board. They say the number. Tap a plate and you'll have one too.</p>
      </div>

      <div class="plate-wrap reveal">
        <div class="plate-shown" id="plateShown" data-on="0">
          <span class="plate-chip" id="plateChip">?</span>
          <p class="plate-name" id="plateName">Tap a plate.</p>
        </div>

        <ul class="plate-row" id="plateRow">
          <li><button class="plate" type="button" aria-pressed="false" data-code="T1" data-name="Chicken Teriyaki">
            <img src="images/dish-t1.jpg" alt="Chicken teriyaki on a pale green plate with two scoops of rice and a green salad — from Teriyaki Town's own menu board, marked T1" loading="lazy" width="870" height="534">
          </button></li>
          <li><button class="plate" type="button" aria-pressed="false" data-code="T11" data-name="Beef Short Ribs">
            <img src="images/dish-t11.jpg" alt="Grilled beef short ribs on a pale green plate with rice and salad — from Teriyaki Town's own menu board, marked T11" loading="lazy" width="870" height="534">
          </button></li>
          <li><button class="plate" type="button" aria-pressed="false" data-code="TC6" data-name="Chicken &amp; Prawn Teriyaki">
            <img src="images/dish-tc6.jpg" alt="A prawn skewer and sliced chicken teriyaki on one plate with rice and salad — from Teriyaki Town's own menu board, marked TC6" loading="lazy" width="892" height="534">
          </button></li>
          <li><button class="plate" type="button" aria-pressed="false" data-code="C1" data-name="Mongolian Beef">
            <img src="images/dish-c1.jpg" alt="Mongolian beef with onions and green onion beside two scoops of steamed rice — from Teriyaki Town's own menu board, marked C1" loading="lazy" width="892" height="534">
          </button></li>
          <li><button class="plate" type="button" aria-pressed="false" data-code="C11" data-name="Sweet &amp; Sour Chicken">
            <img src="images/dish-c11.jpg" alt="Sweet and sour chicken with peppers and pineapple beside steamed rice — from Teriyaki Town's own menu board, marked C11" loading="lazy" width="892" height="534">
          </button></li>
        </ul>
        <p class="plate-fine">Five of their own board photographs. Their fine print, not ours: “The pictures in menu may look different from reality.”</p>
      </div>
    </div>
  </section>

  <!-- ===================== #room =====================
       The walk-in. Three real photographs of the room, in the order you meet
       it: through the door, at the counter, then sat down. No owner story is
       published anywhere, so none is written here. -->
  <section class="section section-alt" id="room">
    <div class="wrap">
      <div class="section-head reveal">
        <p class="eyebrow">Inside</p>
        <h2>Red booths, <em>blue carpet</em></h2>
        <p>Butter-yellow walls, walnut wainscot, plants along the divider and a paper parasol over the far tables. Somewhere to sit down with it, not just a counter to stand at.</p>
      </div>
      <div class="room-strip room-pair">
        <figure class="reveal"><img src="images/room-wide.jpg" alt="Teriyaki Town's dining room — a row of red vinyl booths down one side, blue carpet, the lit menu boards on the back wall" loading="lazy" width="1400" height="1050"><figcaption>The room, from the door</figcaption></figure>
        <figure class="reveal"><img src="images/dining.jpg" alt="The dining side of Teriyaki Town — wood wainscot, potted plants on the divider, a paper parasol hanging from the ceiling" loading="lazy" width="787" height="1400"><figcaption>The far side, with the parasol</figcaption></figure>
      </div>
    </div>
  </section>

  <!-- ===================== #contact ===================== -->
  <section class="section" id="contact">
    <div class="wrap contact-wrap">
      <div class="contact-copy reveal">
        <p class="eyebrow">Come get it</p>
        <h2>Call it in, <em>or walk in</em></h2>
        <p>Ring the order ahead and it'll be on the counter. Big orders are fine — they cater and they'll take a party order.</p>
        <ul class="contact-list">
          <li><span class="lbl">Phone</span><a href="tel:2534452443">(253) 445-2443</a></li>
          <li><span class="lbl">Address</span><a href="https://www.google.com/maps/search/?api=1&amp;query=5605+112th+St+E+Ste+100%2C+Puyallup%2C+WA+98373" target="_blank" rel="noopener">5605 112th St E, Ste 100, Puyallup, WA 98373</a></li>
          <li><span class="lbl">Getting there</span><span>In the strip on 112th, across from McLendon Hardware.</span></li>
        </ul>
      </div>
      <form class="contact-form reveal" novalidate>
        <input type="hidden" name="access_key" value="">
        <input type="checkbox" name="botcheck" class="hidden" style="display:none">
        <label>Your name<input type="text" name="name" autocomplete="name" required></label>
        <label>Phone or email<input type="text" name="contact" autocomplete="tel" required></label>
        <label>What do you need?
          <select name="topic">
            <option>A party or catering order</option>
            <option>A question about the menu</option>
            <option>Something else</option>
          </select>
        </label>
        <label>Message<textarea name="message" rows="4" placeholder="How many people, and when for?"></textarea></label>
        <button type="submit" class="btn btn-primary">Send it over</button>
        <p class="form-success">Got it — they'll get back to you.</p>
      </form>
    </div>
  </section>

  <!-- ===================== #cta ===================== -->
  <!-- ===================== #cta =====================
       The static number grid that used to sit here restated the hours ("6 ·
       days a week") and the h2 restated them a third time. One number, in a
       sentence, and the two things a visitor actually does. -->
  <section class="cta-band" id="cta">
    <div class="wrap">
      <p class="eyebrow">Teriyaki Town</p>
      <h2>Come find <em>your number</em></h2>
      <p class="cta-line">A hundred and nineteen things on that board, and every regular walking in already knows which one is theirs.</p>
      <div class="cta-actions">
        <a href="tel:2534452443" class="btn btn-primary">Call (253) 445-2443</a>
        <a href="#menu" class="btn btn-cream">Back to the board</a>
      </div>
    </div>
  </section>

</main>

<footer class="site-header site-footer">
  <div class="wrap footer-inner">
    <span class="wm wm-foot"><span class="wm-teri">Teriyaki</span><span class="wm-box">Town</span></span>
    <p class="foot-line">Teriyaki and Chinese, 5605 112th St E, Ste 100, Puyallup, WA 98373 · <a href="tel:2534452443">(253) 445-2443</a></p>
    <p class="foot-fine">© <span id="year">2026</span> Teriyaki Town. Menu prices as published on their own ordering page, 8 September 2026.</p>
  </div>
</footer>

<script src="js/site.js?v=VSTAMP"></script>
</body>
</html>
'''

out = sys.argv[2] if len(sys.argv) > 2 else 'index.html'
open(os.path.join(os.path.dirname(__file__), out), 'w').write(PAGE)
print("wrote", out, "hero:", HERO, len(PAGE), "bytes")
