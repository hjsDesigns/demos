# Plateau Jiu-Jitsu — website handoff

Current website: https://hjsdesigns.github.io/demos/plateau-jiu-jitsu/
Handoff page: https://hjsdesigns.github.io/demos/plateau-jiu-jitsu/handoff/
Source ZIP: https://hjsdesigns.github.io/demos/plateau-jiu-jitsu/handoff/source.zip
File manifest: https://hjsdesigns.github.io/demos/plateau-jiu-jitsu/handoff/source-manifest.json

Source base revision: `f770104`.
This is a snapshot refreshed on request, with no automatic synchronization. The manifest records the exact packaged bytes; the website can change after this snapshot.

## Continue from this version

Use the current website and the accompanying ZIP as the starting point. This handoff provides context; the next requested change comes from the user. It does not authorize a redesign, publication, paid generation, or purchases.

This is a static HTML/CSS/JavaScript website. No build step or package installation is required. Unzip the archive, run `python3 -m http.server 8000` from its root, then open `http://localhost:8000/`. The existing Google Fonts require an internet connection; local photos and videos are included.

Pages: `index.html`, `schedule.html`, `classes.html`, `about.html`, and `contact.html`. `hero-type-options.html` contains comparison options only; none has been selected for the main website.

## Preserve the approved direction

- **Hero:** Keep `videos/portrait-shuffle-capcut-20260921.mp4`, the approved 1440 × 2560 CapCut export, approximately 5.233 seconds at its original 1× playback speed. Keep the existing stationary logo registration and direct opacity dissolve. Do not add a logo shift, zoom, intermediate treatment, or replacement animation.
- **Hero implementation:** Preserve `css/hero-capcut.css` and `js/hero-capcut.js`, including their current responsive registration. The video is positioned relative to the stationary logo; the ending dissolves into the logo and moving background. Keep the original multicolor logo and the pawn's **solid white head**.
- **Palette:** The page is white/light gray and black with **purple** accents. Current final tokens in `css/style.css`: `--brand: #6E3FB0`, `--brand-text: #5D3199`, `--brand-bright: #8050BE`, `--brand-2: #6E3FB0`, `--brand-2-bright: #A772DC`, and `--warm: #6E3FB0`. Preserve green for open status and red for closed status. The logo's original colored chess pieces stay intact.
- **Typography:** Anton for display type and Hanken Grotesk for body copy. Heading/subtitle alternatives remain choices for the user; do not silently apply one.
- **Programs:** Preserve the home-page order: Pre-K → ages 5–7 → ages 8–13 → Adults. Keep the current content and media with their programs.
- **Schedule:** Preserve the compact Friday/Saturday/Sunday rows beneath Monday–Thursday. Classes Monday–Thursday: Adults at 9:00 AM; kids 5–7 at 4:15 PM; kids 8–13 at 5:10 PM; Adults at 6:15 PM. Gi Monday/Wednesday, No-Gi Tuesday/Thursday. Friday and Sunday are closed. Saturday open mat is only some weeks, at 11 AM for ages 15+, at Combat Sport & Fitness in Enumclaw. Pre-K dates remain something visitors must ask about. Do not invent extra classes or schedules.
- **Interaction:** Keep the native mouse pointer and the current continuous review ribbon. Respect reduced-motion preferences.

## Work still awaiting direction

A wider desktop/Mac hero composition remains pending. The separate Mac background issue is also deferred. Do not change the accepted hero alignment as a workaround. No new media generation or spending is authorized by this handoff. Wait for the user's specific next instruction.

## Implementation notes

- Shared styling: `css/style.css`; home schedule styling: `css/schedule-summary.css`.
- Shared behavior: `js/site.js`; accepted hero behavior: `js/hero-capcut.js`.
- `hero-options.js` and older hero branches may remain in the source. The active home hero is identified by `data-hero="capcut"`; do not reactivate a legacy branch.
- `videos/bg-loop-soft.mp4` is loaded from video data attributes. Keep it when moving the site, even though it is not a normal `src` attribute in the initial HTML.
- The hero's chess film and soft action background are concept visuals. Do not represent them as documentary footage of the business.
- The current contact form is in demo mode: it displays success but does not deliver submissions. Connect form delivery only when requested. This source package does not supply private service credentials.
- Keep `noindex,nofollow` on preview pages. Check links, images, the class schedule, and layouts at 390 px and 1440 px after edits.

The archive includes only public website files and this brief. Unreferenced legacy clips, private working notes, and development history are not included. `source-manifest.json` identifies the exact packaged files with SHA-256 hashes.
