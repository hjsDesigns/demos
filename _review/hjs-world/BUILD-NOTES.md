# The HJS world — rebuilt from scratch, 2026-11-02

Hayden, 11/2: "restart entirely with the prompts that I've given you." Nothing from the first
attempt was carried over.

## The one architectural change

The first attempt was a **pre-rendered Blender film** that cut to a **live Three.js city**. He
rejected it twice, for two reasons that were really the same reason: *"I don't want like a big jump
cut from real life to digital world"* and *"there should be no increase or decrease in speed
throughout the entire camera motion."*

This build has **one scene and one camera path**. The laptop and the city are in the same Three.js
scene; the camera travels a single CatmullRom curve through both at a **linear** `t` — no easing, no
hand-off, no second renderer. Neither failure is possible any more, by construction.

## His prompts, and where each one lives

| What he asked for | Where it is |
|---|---|
| Closed MacBook, "Come on in", click to open | `index.html` `#invite`, `world.js` `begin()` |
| Start a lot higher up and further out | `CAM_A = (-40, 430, 742)` |
| A **blank** room, no flashing lights | the city is a `THREE.Group` with `visible = false` until the portal. A room shell could not do it — the neighbourhood and trees stand inside the room's own volume |
| Lid opens fully **before** the camera moves | phase `opening` (1.3 s) runs with the camera still |
| Sit there about half a second | phase `hold`, `HOLD_MS = 550` |
| One continuous motion, one speed | phase `travel`, `travelT` is linear over `TRAVEL_MS` |
| The **entire screen** is the portal | `portal()` — full-screen flash, city shown, room and laptop removed, camera never pauses |
| Arrive already at altitude | `CAM_D` is the arrival framing, sampled off his AskLex screenshot |
| Rainier **back right**, moon **a tad higher** | `(2600, 0, -5200)` and `(1480, 1260, -3200)` |
| The city **is** the website, like a video game | four district pins fly the camera and open that district's panel (`panels.js`) |
| The real printed card on the screen | `tex/hjs-screen-plate.png`, rendered from his own card SVG |

## What the AskLex teardown changed (their live bundle, read 10/30)

They use **no 3D models at all** — the whole city is procedural geometry, same as ours. What they
have that our first attempt did not: `envMap` ×108, `shadowMap` ×96, `aoMap` ×43, ~70 light objects,
and real CC0 PBR textures from ambientCG. So this build has an HDRI through `PMREMGenerator`,
shadows on, street and plaza point lights, and the same `Ground037` material they use.

## Checking it without a screenshot

Pane screenshots do not composite WebGL reliably, and a hidden pane composites nothing at all —
which cost several rounds on 11/1. So the build exposes a handle:

```js
window.__hjs.stats()
// { meshes, lights, lineSets, instanced, drawCalls, triangles, cityVisible, phase }
```

At v12, after the portal: **936 meshes, 46 lights, 8 line sets, 4 instanced meshes**, `cityVisible
true`, `phase "free"`. AskLex runs about 70 light objects, so the light count is in the right
country now.

## Honest gaps

- ~~Towers are plain blocks~~ — rebuilt 11/2 with a podium, one to three setbacks, a lip at each
  step, and either a mast or rooftop plant. That is the silhouette fix; whether it reads is still
  his call.
- Towers may still be darker than his reference; a second glass material would help.
- ~~No `aoMap` anywhere~~ — added 11/2 on the ground, the roads, the plaza, the Needle's base and
  the room floor. The catch: `aoMap` reads from the SECOND uv set, so a geometry carrying only `uv`
  renders no occlusion and warns about nothing. `withAO()` copies `uv` to `uv1`; verified all five
  meshes carry it. Only Grass004, PavingStones131 and Asphalt033 ship an AO map — Concrete034
  publishes none at any resolution (checked against ambientCG's API, not a failed download).
- The title block overlaps the skyline at some widths.
- The foreground is a wide empty green band; it wants a road or a treeline closer to camera.
- Phone build is tuned (no shadows, 1.5× dpr, 8 street lights) but **not yet looked at on a phone**.

## Where it lives
- Source: `sites/hjs-world-2/`
- Live: https://hjsdesigns.github.io/demos/_review/hjs-world/ (noindex)
- Assets and licences: `ASSETS.md` — every one CC0 or public domain, nothing bought, no account.
