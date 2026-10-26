# The laptop-and-Earth mark — recreate it exactly (Hayden → Codex, 2026-10-12)

Hayden's words tonight: "Remember the exact image I pasted… I put two images inside of each other and you said we weren't able to do that… I think Codex would do a better job of recreating it."

## The two source images (both pasted by Hayden on 2026-08-24)
1. `globe-reference-hayden-pasted-0824.png` — the globe he wants: a bold circular globe with solid continents (Americas facing), meridian/latitude lines, black on light. His instruction at the time: "Keep the MacBook image and then replace the globe inside of it with this globe. Retract this globe from the line and circle that it's already inside. Just the globe."
2. `laptop-mark-on-screen-hayden-photo-0824.jpg` — his phone photo of the laptop mark as it looked on screen: an open-laptop outline (rounded screen, base bar), with a globe centered on the screen. Top = white outline on black; bottom = black outline on light. Small versions at right.

## What to produce
- ONE mark: the laptop outline from image 2 with the globe from image 1 inside the screen, exactly, no reinterpretation. The globe keeps its continents and its lines; it is pulled out of whatever circle/line it sat in on the source and placed alone, centered on the screen, sized so it nearly touches the bezel.
- Two colorways: black on transparent, white on transparent. Flat, two-color, no gradients. SVG + PNG at 1024 / 256 / 64 / 32 / 16. A favicon set.
- Also: the mark in the new HJS palette — bone #EEF1E8 on the fir green #0F1F17 — for the site header and footer (`sites/hjs-designs/css/site.css` `.mark i` is where it would replace the "H" square).
- Deliver to `sites/hjs-designs/brand/logo/`.

## What Claude got wrong (so you don't repeat it)
`claude-attempt-*` in this folder is Claude's Aug 24 attempt: it kept the laptop but drew the globe as a ring with land and no meridians, and it left the whole thing as a perimeter-only line mark. Hayden said that was a recreation, not the thing. Match the pasted globe's construction — continents AND lines.

## Open question for Hayden (don't decide for him)
Where it lives: header left, footer, favicon. Claude's read: small in the header beside the wordmark, never in the hero. His call.

## When it's done — wire it in (Hayden, 10/13: "swap it for Codex's version once it's done")
The stand-in mark is live: `images/mark-laptop-earth-white.png`, referenced from `build.py` as `<img class="mark-img" …>` in the header and footer. To swap: save your bone-on-green PNG (512×512, transparent) over `images/mark-laptop-earth-white.png`, keep the filename, run `python3 build.py`, rsync to `demos-pages/hjs-designs/`, commit, `bash ~/website-factory/tools/pages-publish.sh`. Every page picks it up. Also drop the favicon set into `images/` and add the `<link rel="icon">` in `build.py`'s shell.
