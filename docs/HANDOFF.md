# Handoff — resume work without the previous conversation

Read this first when picking the project up in a new session (or when the context was lost). It is the short version of
what the project is, what the owner decided, how work is done and what comes next. Details live in
[`ARCHITECTURE.md`](ARCHITECTURE.md); history in [`../CHANGELOG.md`](../CHANGELOG.md); plan in [`../TODO.md`](../TODO.md).

**Keep this file current:** when a decision is made, a feature lands or the next steps change, update the sections
below in the same push (it is part of every release, like the changelog).

## Snapshot (state as of v0.26.0, 2026-10-24)
- **What:** *Steel Salvo* (working title) — free naval battle browser game, PvE against endless waves of AI warships.
  Live: <https://michalstankiewicz4-cell.github.io/Battle/> · repo: <https://github.com/michalstankiewicz4-cell/Battle> (branch `main`,
  GitHub Pages deploys every push via `.github/workflows/static.yml`).
- **Tech:** plain ES modules, three.js r0.186.1 vendored in `vendor/`, no build step, no dependencies, no network.
  Strict CSP (`script-src 'self'`, `style-src 'self'`). UI built from JS with `h()`.
- **Playable:** 4 classes (destroyer, cruiser, battleship, submarine); ballistic gunnery with lead and dispersion; torpedoes;
  repair; fires and citadels; islands as cover; enemy AI with waves; gun camera with binoculars (C); submarine diving
  (Z/X), battery, periscope, depth charges; salvo camera (picture-in-picture); procedural sound; EN/PL UI; graphics
  settings with High/Light presets (and colour saturation); SEO + thumbnail.
- **Labs map:** `docs/labs.md` — five areas (models, environment, graphics and filters, special effects, tools); current
  focus: water and weather, graphics and filters, Błyskawica; the rest is "soon" on the labs page.
- **Labs** (`labs.html`, linked from the main menu): **Ship Lab** (`labs/ship.html`) — ORP Orzeł 1939 (submarine, `docs/ships/orzel.md`: diving, retractable 40 mm, pressure hull) and ORP Błyskawica as built 1937, 1:1
  from published figures (ShipKit `js/shipkit/`, research `docs/ships/blyskawica.md`; positions reconstructed from text,
  image hosts are blocked in the sandbox). **Model Doctor** (`labs/doctor.html`, `py tools/doctor.py`, golden
  `tools/doctor.golden.json`, `docs/doctor.md`) — 13 checks incl. inward-facing surfaces, holes (see-through), gun arcs, waterline, hull side, budget; every lab and
  game model is clean, Błyskawica only exceeds the in-game budget (33k triangles, 99 draw calls). **Water Lab**
  (`labs/water.html`, WaterKit, `docs/water.md`) — Gerstner sea, variants A/B side by side, cost of each effect; water
  bodies ocean / fjord / lake / river (shores from LandKit, current) / harbour water (oil) / ice (floes, lane);
  **foam with memory** (`js/env/foamkit.js`, v0.24.0: whitecaps → lace, wake for minutes, shell splashes, torpedo tracks;
  whitecap coverage calibrated to Monahan, checked in lab-check; inspired by Open Water, credited at the top of README).
  **Waterside Structures Lab** (`labs/structures.html`, `js/structkit/`, `docs/structures.md`) — jack-up drilling rig
  (Super 300 class, researched: `docs/structures/super300.md`), jacking, cantilever, cranes, underwater view; quays and
  breakwaters (`docs/structures/coastal.md`) with tetrapods/rock instanced, Błyskawica alongside. **Transformer** (`labs/transform.html`,
  `js/shipkit/transform.js`, `docs/transform.md`) — LOD0/1/2 (65 / 31 / 7 draw calls), 458 hitboxes for procedural
  destruction (the owner wants many), damage texture read by the materials; fleet of 24: 144 draw calls vs 1,741. **Look Lab** (`labs/look.html`, `docs/look.md`) — procedural ageing by surface
  (`js/shipkit/ageing.js`, baked occlusion/edges, no textures), cloudy sky with seven weathers that also set the sea, rain with squalls and sea fog,
  time of day from dawn to a moonlit night, lightning, navigation lights, gun flashes, SOS by searchlight shutters
  (`js/env/skykit.js`, `js/env/rainkit.js`, `js/shipkit/lights.js`), **Land Lab** (`labs/land.html`, `js/env/landkit.js`,
  `docs/land.md`) — procedural land and sea 0–100 %, wrap-around (torus) or bounded map, water bodies mixed by region
  (`js/env/regionkit.js`: layouts + mixed from the seed with rivers, lakes, fjords, ice; currents) and land biomes
  (northern, plains, desert, zones), sailing with grounding, camera look with presets Game clean / Cinematic / Bodycam (`js/render/look.js`), split compare, auto resolution.
- **Plants Lab** (`labs/plants.html`, `js/env/plantkit.js`, `js/env/forestkit.js`, `docs/plants.md`): eight species grown
  from code, wind, autumn, impostors, forests by biome, grass blades.
- **Pixel Studio** (`pixel/index.html`, `js/pixel/`, `css/pixel.css`, `docs/pixel.md`, check `py tools/pixel-check.py`):
  a separate pixel-art project (owner 2026-10-23: own folder reachable via Pages like the labs, **not in the game**, not on
  the labs page). Modes 3D model / Generate / Draw / hybrid, palettes, dither, selout, clean-up, Pixel Doctor, PNG/GIF export; Copy/Apply settings (JSON) so the owner can send an exact setup; one-column layout on narrow screens.
  Working loop agreed with the owner: Claude writes the rules and defaults, the owner tunes sliders and retouches in Draw,
  then sends feedback / settings JSON / retouched sprite text, and Claude turns that into better rules or Doctor checks.
  The game's "realistic only" rule does not apply to it.
  **Zombie Generator** (`pixel/zombies.html`, v0.25.0, `docs/zombies.md`): the owner wants to give it to the author of a
  zombie game he plays (Unity, sprite sheets 512×512, 6×2, hard alpha, pivot 9 px, 100 ppu — studied from the owner's
  installed demo; nothing of it is in the repo). Realistic (ray-marched SDF) or pixel art; Unity JSON + slicer + ZIP.
- **Origin:** started from the engine of the owner's other game *Capital Quarantine* (repo `VS`), then diverged:
  the pixel-art pipeline was dropped, the look is now realistic only.

## Owner's decisions (do not reopen without being asked)
| Date | Decision |
|---|---|
| 2026-10-13 | Naval battle, PvE first ("something like a warship MMO", but no copied names/assets). Reuse the VS engine. |
| 2026-10-13 | Repo `Battle`, GitHub Pages. **Every push is a new version** (bump + changelog + check script). |
| 2026-10-13 | **English is the default language**, Polish only as an option in Options > Language. **All docs, code comments and UI source text in English.** |
| 2026-10-13 | Documentation follows the VS repo layout (README, ARCHITECTURE, TODO with P1–P3, MULTIPLAYER, CLAUDE.md, CHANGELOG). |
| 2026-10-18 | **Realistic graphics only.** Alternative styles (pixel, comic, watercolour) were tried and removed. Performance goes through settings (resolution, shadows, AA, glow, effects, water) and High/Light presets, not new styles. (The separate Pixel Studio, 2026-10-23, is outside the game and not affected.) |
| 2026-10-18 | Gun camera on C ("view above the gun"), binoculars as a double round view; submarine with diving and a periscope instead of binoculars; salvo camera top-right. |
| 2026-10-18 | SEO and all metadata in English; start-screen thumbnail. |
| 2026-10-19 | Model lab ("like the Space labs"): detailed 1:1 real warships; first ORP Błyskawica (1937, the configuration known from warship games). |
| 2026-10-19 | Model doctor like in Space, adapted to the game, with all options; Błyskawica analysed and fixed. |
| 2026-10-19 | Water lab before putting Błyskawica into the game; labs linked from the main menu. |
| 2026-10-19 | Ships fixed with the doctor (done, v0.7.1); then a **"transformer"** that optimizes a ship so it does not choke the GPU and the browser (done, v0.8.0). |
| 2026-10-21 | Labs grouped into areas (models, environment incl. land/water/sky/weather/time of day/space, graphics and filters, special effects, tools). Now: water and weather, graphics and filters, Błyskawica; the rest soon. Bodycam/photoreal look via a Look Lab (proposed; lens effects mainly for first-person views — owner to confirm). |
| 2026-10-22 | Biomes: plains (flat but not perfectly) and desert first. **Plants and rocks as objects go to their own labs** (Plants Lab, Rocks Lab); grass as ground colour stays in the terrain, grass blades belong to the Plants Lab. |
| 2026-10-22 | Mixing water types = the region layer (transitions and joins), not yet the final map generator. Later: **biomes** (e.g. desert) and **other planets** too. |
| 2026-10-22 | ORP Orzeł (submarine) with solid research after quays and breakwaters. Later: a Paint Lab — paint schemes and camouflage kept separate from the ship, fitted or reassigned to any ship. More labs are welcome where they make sense. |
| 2026-10-21 | Everything built that touches the water (quays, piers, breakwaters, harbours) goes to a **waterside-buildings lab**; the Water Lab keeps the water itself (oil, ice). |
| 2026-10-21 | Water types: one WaterKit, each body (ocean, fjord, lake, river, then harbour, ice) a preset + its own feature in the Water Lab; the Land Lab later mixes them by region. Keep a professional folder layout (`js/env` kits, `js/tools`, `js/labs` = one controller per page) and a user guide (`docs/GUIDE.md`). |
| 2026-10-21 | Next lab: land and terrain (procedural, sea and land mixed), map as a torus (wrap-around) or bounded by barriers — to choose in the lab. |
| 2026-10-21 | Labs continue first; their results will later be merged into another project (owner's plan). Fixed simulation tick + render interpolation noted for multiplayer (later, `MULTIPLAYER.md` §7); no frame generation. |
| 2026-10-21 | LOD yes; **many hitboxes**, because procedural destruction is planned. Primitives only as the far level, never instead of the detailed model. |

## How the owner works (preferences)
- Talks in **Polish, short messages**; reply in Polish, concisely, and say what was and was not verified.
- Iterative: small requests, frequent corrections mid-task. Do what was asked, nothing else ("change only what was asked").
- Wants changes **pushed straight to GitHub** once tested ("wyślij na gh"); state the version number in the reply.
- Develops on Windows (PowerShell, `py`), repos in `C:\Users\micha\vsrepos\`.
- Likes dark/atmospheric UI, self-contained code without CDNs.

## How to work in this repo
1. `git pull --rebase origin main` (the owner sometimes edits workflows on GitHub).
2. Make the change; keep the folder structure (file map in `ARCHITECTURE.md`); new UI strings in **both** `js/i18n/en.js` and `pl.js`.
3. Test: `py tools/e2e.py` (game, headless, ~10–20 min without a GPU); `py tools/lab-check.py` (labs); `py tools/doctor.py` (models). Do not run them in parallel (CPU contention makes timing checks flaky). For a new feature add a check.
4. Bump `js/version.js` (PATCH fix, MINOR feature, MAJOR big change), add the `CHANGELOG.md` entry, update docs
   (`README.md` for players, `ARCHITECTURE.md` for code, `TODO.md`, **this file**), run `node tools/check-version.mjs`.
5. Commit (end the message with the Co-Authored-By line used in history) and push to `main`; wait for the Pages workflow
   (`gh run list -R michalstankiewicz4-cell/battle -L 1`). Do not push tags (the owner makes Releases).
6. If the start screen changed noticeably: `py tools/og-image.py` to refresh `assets/og-image.jpg`.

## Gotchas learned the hard way
- **Headless rendering is slow** (SwiftShader, ~1–5 s per frame at full settings). Drive time with the fake clock
  (`__step(n)` in the init script of `tools/e2e.py`), use a small viewport and light settings, and give screenshots a long
  timeout. Never rely on real time passing (`sleep`) — game time would advance only a little.
- Playwright `page.screenshot` needs the **real** `performance.now` and `requestAnimationFrame`: the fake clock queues only
  the callback named `frame` and must be switched off (`window.__fake=0`) before a screenshot.
- `pkill -f <pattern>` in a shell whose own command line contains the pattern kills that shell (exit 144). Kill by PID.
- Esc while the pointer is locked is consumed by the browser (it releases the lock); the game treats an unexpected lock
  loss in the gun camera as "pause".
- The salvo camera is drawn into the main canvas and **copied** into a DOM canvas in `#pip`, so HUD masks (periscope,
  binoculars) never cover it. Its size must match the CSS frame (`pipSize()` in `salvo-cam.js`).
- Shells and torpedoes use their own reach rules for submarines (`shellable()`, `torpable()` in `ships.js`); new weapons must
  respect them.
- Flat foam particles sit at y = 0.47, above the highest wave crest (the four waves sum to 0.45); lower and waves cut them.
- The island outline is wobbly (`wobble()`); the ocean shader, `isLand()` and `heightAt()` must keep using the same function.
- CSP forbids inline styles: set sizes via `el.style.*` (CSSOM), never `style=` attributes; no `innerHTML`.
- GitHub push from the Claude sandbox needs the Claude GitHub App on the repo; a 403 means access lapsed — ask the owner to
  reconnect GitHub in claude.ai settings (Connectors), do not work around it.
- Lab pages (strict CSP) refuse Playwright's string predicates (`wait_for_function('…')` → "unsafe-eval"): open them with
  `new_page(bypass_csp=True)` as `tools/doctor.py` does. The labs expose `window.__lab`, `window.__water`, `window.__doctor`, `window.__tf`, `window.__look`.
- ShipKit merges pieces per material; the doctor needs `KIT.unmerged = true` (one mesh per piece + source line). After a
  model change run `py tools/doctor.py`; update the golden file (`--update`) only for intended changes.
- Generated geometry must be wound counter-clockwise seen from outside (normals out). The doctor's `facing` check catches
  open shells wound inward (`inverted` only sees closed shapes) and `seethrough` finds holes (missing caps); check new
  ShipKit generators with both. Orientation by intent (which way a vent faces) is not checkable: look at close-ups.
- `py tools/doctor.py` takes ~8 min headless (see-through ray grids on the 1:1 ship and its LOD levels); run it in the
  background. Adding a model to the doctor means new golden entries (`--update`, or copy the printed fingerprint).
- The e2e "look at the enemy" helper must close the gap in several passes: look sensitivity drops with the optics zoom.
- Shader uniforms shared between kits must have distinct names (SkyKit's `uSkyLow` once clashed with WaterKit's sea colour). Sparse
  bloom taps speckle; the look pipeline samples bloom from mipmaps of the scene target.
- Fog is one exponential-squared density shared by three.js `FogExp2`, the water shader (`uFogDen`) and the sky
  (`uSkyFog`); change it in `applySky()` only, or ship, sea and sky stop agreeing.
- GLSL 3: `out`, `in`, `sample` are reserved words — never name a variable so (a shader then fails to compile).
- A one-line `//` comment inside a JS object literal swallows the rest of the line: keep such comments at line ends.
- `FoamMap` needs float render targets (EXT_color_buffer_float; half floats lose the slow decay). Foam tests use
  `__water.simulate(sec)` (SwiftShader renders ~1 fps; a sim step without drawing is fast).
- Commits made from the Claude sandbox use `Claude <noreply@anthropic.com>` as author/committer (the sandbox flags other identities as unverified).

## Next steps (from TODO, highest first)
00. Owner's order (2026-10-21/22): structures lab: jack-up rig, quays and breakwaters done (piers, harbours, lighthouses
   later) → ORP Orzeł done (v0.18.0) → water bodies mixed by region in the Land Lab done (v0.19.0; it is the layer for
   transitions and joins, not the final map generator) → biomes northern/plains/desert/zones done (v0.20.0) → next ideas:
   Plants Lab done (v0.21.0) → Pixel Studio v1 (v0.22.0, separate project; owner wants to teach pixel art, iterate on it) → next: Rocks Lab, more biomes, later other planets; Paint Lab later; small fixes (ice look, fjord walls) later.
   More labs are welcome where they make sense.
   Sea after Open Water (owner 2026-10-24, "po kolei"): foam with memory + Beaufort/Monahan calibration done (v0.24.0)
   → sun glitter as sparkles → FFT waves as the High preset → cloud shadows and rain cells → AgX tone mapping.
0. **P1** Owner looks at the Look Lab on a real GPU: which wear level and look go into the game, confirm lens effects only
   for first-person views, which weathers and times of day the game gets; then night lighting (navigation lights, gun flashes) and lightning.
1. **P1** Procedural destruction on top of the transformer's hitboxes (damage model, spread to neighbours, falling
   debris, fire/smoke emitters) — owner's plan; scale decision: game to metres or model ×0.1 (asked 2026-10-21).
2. **P1** The owner picks a sea in the Water Lab ("Copy settings (JSON)") → that sea goes into the game.
3. **P1** Błyskawica as the player's destroyer (transformer output, scale 1 u ≈ 10 m, mounts and tubes mapped to the game).
4. **P1** Balance on a real GPU (class HP, reloads, dispersion, AI skill curve, wave size); real-GPU performance check.
   Hint from `tools/e2e.py`: early AI seems too accurate / too deadly at close range.
5. **P1** Spotting / detection for surface ships; graphics: shadow-map size option, auto Light preset at low FPS.
6. Owner tasks: Google Search Console + sitemap; `vX.Y.Z` tags in Releases.

## Open questions for the owner
- Final game name (currently "Steel Salvo", working title).
- Multiplayer: co-op PvE, PvP or both; P2P or server (see `MULTIPLAYER.md`).
- Should the gun camera keep the binoculars at ×1.5+ only, or always?
