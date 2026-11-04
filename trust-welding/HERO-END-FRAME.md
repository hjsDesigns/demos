# Trust Welding — the hero's end frame (spec for the animation session)

Written 2026-11-03 late, hero-image session. The still is the frame the visitor sees when the welding helmet lifts. Everything before the lift is the animation session's; this file fixes what it must land on. Nothing here is approved by Hayden yet: the PICK below is Claude's call under the hero-autonomy law, and his word flips it.

## 1. The pick (and the alternate)

| | file (web size) | master | what it is |
|---|---|---|---|
| **PICK · desktop** | `lab/hero/out/t-golden-A-desk.jpg` 2560×1440 | `lab/hero/src/t-desk-golden.png` 5504×3072 | the whole town from Hayden's screenshot angle, last light, Rainier dead centre; the chrome emblem the centerpiece |
| **PICK · phone** | `lab/hero/out/t-golden-A-phone.jpg` 1080×1920 | `lab/hero/src/t-phone-golden.png` 1536×2752 | same, reframed tall |
| alternate · desktop | `lab/hero/out/t-clear-A-desk.jpg` | `lab/hero/src/t-desk-clear.png` | same angle, clear late morning ("as clear as possible, no fog") |
| alternate · phone | `lab/hero/out/t-clear-A-phone.jpg` | `lab/hero/src/t-phone-clear.png` | |

The backdrop is a **Nano Banana Pro concept render** (Higgsfield, job ids in `lab/hero/jobs.json`), made from Hayden's Google Earth screenshot as the viewpoint reference and a real Commons photo of the north face as the mountain reference. It is **not a photograph of Enumclaw** and is never presented as one: the briefing and any pitch note carry the line *"town backdrop is a concept render; a real aerial replaces it when we have one"*. When a real frame lands (licensed, or Hayden's drone morning), it drops into the same geometry below and nothing else changes.

The emblem is `images/emblem.png` (2000×2000, transparent; ink bounds x 72–1929, y 243–1757 → 1857×1514). It is **never redrawn**: every still here is the exact file composited over the backdrop by `lab/hero/compose.py`. Treat it as a separate layer in the animation too.

## 2. Geometry (the emblem never moves across the lift)

Fractions are of the full frame; "emblem box" = the ink bounds above, scaled uniformly.

| frame | emblem centre (x, y) | emblem box height | emblem box (px) | top-left (px) |
|---|---|---|---|---|
| desktop 2560×1440 (16:9) | 0.50, 0.53 | 0.62 of frame height | 1095×893 | (732, 317) |
| phone 1080×1920 (9:16) | 0.50, 0.50 | 0.34 of frame height | 801×653 | (140, 634) |
| any 16:9 | 0.50, 0.53 | 0.62 H | width = 1.2266 × height | centre minus half |
| any 9:16 | 0.50, 0.50 | 0.34 H | same ratio | |

Behind the emblem: a soft dark pool (black at 25% in the middle, Gaussian-blurred to ~22% of the emblem size) so chrome reads over the bright sky, and the emblem's own silhouette as a shadow offset 1.2% right / 3.5% down of the box, blurred 3.5% of the height, 55% black. Both are in `compose.py` (`--halo 0.25 --shadow`); the animation can fade them in with the backdrop.

Key points **inside the emblem box** (fractions of box width/height, ±2%), for the strikes and any light:
- the welder's torch, where the real blue spark bursts: (0.41, 0.46)
- the gear ring's left tooth tip (0.06, 0.50) · right tooth tip (0.95, 0.50) · ring crown (0.50, 0.01)
- the name TRUST WELDING: y 0.57–0.68, full width
- the rule under the name: y 0.74 · EST 2025: y 0.79–0.86, x 0.30–0.70

Where the backdrop's own landmarks sit (PICK, desktop): Rainier's summit at about (0.37, 0.12); the horizon ridge line at y ≈ 0.30; the dark hill in the middle ground at (0.40, 0.44), fully covered by the emblem; the town fills y 0.55–1.0. Phone: summit (0.45, 0.11), ridge y ≈ 0.25, town from y 0.52 down. Nothing in either frame competes with the emblem's centre.

## 3. What the first-person welder sees before the lift

- **Black.** The visor vignette (the `.visor` DOM layer from the current build: radial vignette, lens border, black bottom band) over a black field. No backdrop, no town, no sky. The helmet is ON the whole time; nothing of it lies on the bench (the C composition's bench helmet is a prop in that concept only).
- **The emblem is already there, exactly in its end position**, unlit. Chrome in the dark is black; it only exists where an arc lights it.
- **Three strikes** are the only light (Hayden's schedule stands: 0.5 s lead, 1.5 s each, 2 s between). Suggested points, in order, so the strikes read as finishing the mark: the torch point (0.41, 0.46) → the left tooth tip (0.06, 0.50) → the right tooth tip (0.95, 0.50). Each strike lights the chrome around it (specular on the gear, the figure, the letters) and throws sparks; between strikes only the cooling ember glow at the last point remains. The visor border brightens while an arc burns (`[data-arc="1"]`).
- **The lift** (0.9 s, the hero's own easing): the visor layer rises out of frame; in the same beat the backdrop fades up from black (and may settle from 1.03 → 1.00 scale, backdrop only), the halo and shadow fade in, the ambient light comes up so the whole emblem reads as chrome. The emblem does not move, scale or re-light-position; the town simply appears behind it. End state = the PICK still, pixel for pixel.
- Skip (any scroll / tap / key) and reduced motion land directly on the PICK still.

## 4. Below the hero (standing rule from the body session, 11/3)

Photos scroll on the left, one continuous steel panel holds on the right, white words unfold, a section every seven photos. The hero hands off on a black-to-steel edge at the bottom of the frame; the header lights the moment the visitor is past the opening.

## 5. Other compositions on file (for the record)

`lab/hero/out/`: `a-bluehour-A` (blue hour, town lights, emblem centred), `b-morning-B` (clear morning, mountain first, emblem low), `c-bench-C` (the bench and the open bay door, emblem standing on brushed steel with a reflection), `t-clear-A/B` and `t-golden-A/B` (screenshot angle, two moods, centred / low), `real-north-face-A/B` (a real Commons photo, graded hard, zero credits; the honest fallback). Gallery: https://hjsdesigns.github.io/demos/trust-welding/lab/hero.html
