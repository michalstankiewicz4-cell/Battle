# Architecture and project context

Browser game **Steel Salvo** (working title): naval battle at sea, PvE against waves of AI warships, isometric view (orthographic projection), realistic 3D (PBR materials, procedural water). No dependencies except three.js (vendored locally), no network requests. The project started from the engine of Capital Quarantine (repo VS: camera approach, UI builder, i18n); **the game is developed for the realistic look only** (other styles were tried and removed in 0.3.0).

Published at: repo <https://github.com/michalstankiewicz4-cell/Battle>, site <https://michalstankiewicz4-cell.github.io/Battle/> (GitHub Pages, workflow `.github/workflows/static.yml`).

## Quick start for someone returning to the project
1. Read this file, then [`../TODO.md`](../TODO.md) and (for networking) [`MULTIPLAYER.md`](MULTIPLAYER.md).
2. Run locally: `py -m http.server 8000` in the repo folder, open `http://localhost:8000` (ES modules do not work from `file://`).
3. Enable the version guard once per clone: `git config core.hooksPath .githooks`.
4. Standing rules: see "Rules" below and [`../CLAUDE.md`](../CLAUDE.md).

## File map
| Path | Role |
|---|---|
| `index.html` | Skeleton, CSP, SEO (English: title, description, Open Graph, Twitter card, JSON-LD `VideoGame`, `noscript` text); empty `#app` (canvas) and `#ui` (all UI is built from JS) |
| `assets/` | `og-image.jpg` (1200×630 start-screen thumbnail), `icon.png` (512), `apple-touch-icon.png` (180), `favicon-32.png` |
| `site.webmanifest` | Web app manifest (name, icons, colours) |
| `css/base.css`, `css/menu.css`, `css/hud.css` | Base styles; menu/options overlay; in-game HUD |
| `js/main.js` | Entry point: `createApp()` |
| `js/version.js` | `VERSION` (semver) — must stay at this path (the check script reads it) |
| `js/core/app.js` | App shell: renderer, pipeline, world, camera rig, mode state machine (`menu`/`play`/`dead`), pause, aim ray, world events → HUD, frame loop |
| `js/core/cameras.js` | Camera rig: isometric ortho follow camera, gun camera / periscope (C), menu showcase (perspective orbit) |
| `js/core/salvo-cam.js` | Salvo camera: picture-in-picture behind the newest player shell/torpedo, second small post pipeline |
| `js/core/settings.js`, `storage.js`, `util.js` | Sanitised settings store, localStorage wrappers, small helpers (`clamp`, `wrapAngle`, `mulberry32`) |
| `js/core/sound.js` | Procedural Web Audio effects (no sound files) |
| `js/render/materials.js` | Material factory `mat(color, kind)` (PBR), procedural canvas textures (deck planks, weathering), `mergeBoxes`, `LIGHT` |
| `js/render/post.js` | `PostPipeline`: half-float target (optional MSAA, render scale) + post shader (bloom, ACES, gamma, vignette, grain); optional viewport for picture-in-picture |
| `js/input/input.js` | Keys by `KeyboardEvent.code`, mouse NDC, LMB fire, RMB/MMB drag, wheel |
| `js/world/index.js` | World facade (`createWorld`): light, ocean, islands, fx, combat, ships, wave director, water indicators |
| `js/world/constants.js` | `CLASSES` (dd/ca/bb/ss stats and turret layouts), `THROTTLE`, `EDGE`, `FIRE`, `DEPTHS`, `DIVE_RATE`, `CHARGE` |
| `js/world/ocean.js` | `waveAt()` (JS) and its GLSL twin; ocean shader with shallows and surf from the island list |
| `js/world/islands.js` | Procedural islands from ellipsoid lumps; `isLand()`, `heightAt()` |
| `js/world/models.js` | Ship meshes: extruded hull, superstructure per class, rotating turrets |
| `js/world/ships.js` | Ship entity: movement, bobbing, turret traverse in arcs, `hullHit()`, damage, fires, repair, sinking |
| `js/world/combat.js` | Shells (ballistic arc, dispersion, island blocking, citadel/fire rolls), torpedoes, `intercept()`, torpedo threat |
| `js/world/ai.js` | Enemy navigation (range keeping, broadside, island feelers) and gunnery/torpedo leading |
| `js/world/fx.js` | Two instanced particle pools (glow, lit): splashes, dirt, explosions, muzzle flash, smoke, fire, foam, tracers |
| `js/i18n/{index,en,pl}.js` | `t()`, `bind()`, `setLang()`; English (default/fallback) and Polish dictionaries |
| `js/ui/{dom,hud,menu}.js` | DOM builder `h()`, HUD, menu screens and options |
| `tools/check-version.mjs` | Version check before pushing |
| `.githooks/pre-push` | Runs the version check on every push |
| `vendor/` | three.js r0.186.1 + `SHA256.txt` + licence |
| `robots.txt`, `sitemap.xml` | SEO |
| `CHANGELOG.md` | Version history |

## Modes and flow (`js/core/app.js`)
`menu` (start screen with the 3D showcase of the selected ship) → Set sail (`play`) → sunk (`dead`, results screen 3.5 s after sinking). Results: wave reached, ships sunk, damage, shell hit rate, time, score; best score and best wave are saved.
**Esc** never ends a battle: in `play` it pauses (`paused = true`, the world and camera get `dt = 0`) and opens the pause menu (Resume / Options / Quit to main menu); inside Options it goes back to the pause menu; on the pause menu it resumes. In `menu` mode Esc goes back one screen. No effect on the results screen.
World modes (`world.reset(mode, cls)`): `menu` (player ship circling slowly, no enemies), `play`. `reset()` removes all ships, shells, torpedoes and particles and creates the player ship at (0, 0).
Controls go to the world as one object per frame: `ctl = { thr, steer, aim, fire, weapon, repair }` (`thr` = telegraph step on key-down edge).

## UI and i18n
All UI is built with `h(tag, props, ...kids)` (`js/ui/dom.js`) — no `innerHTML`, no `style=` attributes (CSP `style-src 'self'`; dynamic sizes are set through `el.style.*`). Static text uses `bind(el, key)` / `tx(key)` and follows the language automatically; dynamic text (HUD, results) is recomputed with `t(key, params)`. **English is the default**; Polish is selected in Options > Language. Missing keys fall back to English, then to the key itself. Add a language: new dictionary in `js/i18n/`, register in `index.js` (`dicts`, `LANGS`) and in the settings sanitiser.
Screens (`js/ui/menu.js`): `main` (ship cards + buttons), `multi`, `pause`, `dead`, `options`, with a small history stack (`go`/`back`).
HUD (`js/ui/hud.js`): top line (wave, enemies, score, time, next-wave countdown), kill feed, banners, torpedo warning, ship panel (HP, telegraph, speed in knots, rudder), weapon panel (main battery, torpedoes, repair), crosshair (distance in km, flight time), enemy labels with HP bars, damage popups, minimap. Text updates about 10×/s; positions every frame.

## Settings (`js/core/settings.js`)
Stored in `localStorage` key `salvo:settings:v1`: `lang` (`en` default, `pl`), `gfx` (style `real`/`pixel`/`toon`/`paint`, pip (salvo camera), pixelH 140–540, levels, dither, edge, bright, showFps), `vol`, `mouse` (zoomSens, rotSens). Everything passes through `sanitize()` (clamps, whitelists). Change settings only via `settings.update(draft => …)`; listeners via `settings.onChange`.

## Graphics settings (Options > Graphics, all live)
One realistic look, tuned by settings instead of separate styles: render resolution (`scale`, post target size), anti-aliasing (`aa`, 4× MSAA), glow (`bloom` uniform), shadows (`renderer.shadowMap.enabled`; switching marks every material `needsUpdate`), effects density (`fx`, share of particles spawned), detailed water (`water`: ripple normals and noise-broken foam in the ocean shader, `uDetail`), salvo camera (`pip`). Presets in `GFX_PRESETS` (`settings.js`): **High** (default) and **Light** (70% resolution, no shadows/AA/glow, half the effects, simple water, no salvo camera).
Islands have a wobbly outline (`wobble()` in `islands.js`); the same function feeds the ocean shader (`uWob`) and `isLand()` / `heightAt()`, so surf, collisions and shell impacts match the visible shore.

## Rendering (`js/render/post.js`)
- three.js scene → half-float `WebGLRenderTarget` (render scale, MSAA) → full-screen shader: brightness, bloom (16 taps above 0.9), ACES tone mapping, gamma, vignette, film grain. Fire, flashes and the lighthouse lamp are HDR (> 1) so the bloom catches them.
- Works with orthographic (play) and perspective (menu showcase) cameras.
- The ocean is a custom `ShaderMaterial`: a 900×900 grid that follows the camera target snapped to its cell size, displaced by four directional sine waves (`waveAt` in JS is the same function, used for ship bobbing). Shallow water and surf are computed per fragment from up to 64 island lumps (`uLumps`).

## Cameras (`js/core/cameras.js`, `js/core/salvo-cam.js`)
- **Gun camera** (C during play): perspective; position above and 3.2×turret size behind the most forward turret (view forward of the beam) or the most aft one (view aft), at deck + superstructure height (`TOP` per class) + 0.9. Yaw/pitch from mouse movement under pointer lock (`input.onLook`), or right-drag without lock; pitch −0.6…+0.08 rad; wheel zoom ×1–×8 (FOV 52°/zoom). Entering starts the view looking at the current aim point. Aim = centre ray onto the sea when locked (else the cursor ray); above the horizon it goes to max range along the view. Esc releases pointer lock before the page sees the key, so a lock loss that the game did not cause pauses the run.
- **Binoculars** (ships): the gun camera starts at ×2; from ×1.5 up `hud.setOptic('bino')` shows two overlapping round views (`#scope.bino`: a black `.mask` whose two radial-gradient mask layers intersect, so only the circles stay clear), a wide hairline and the bearing; ×1 is the wide view without a mask. Labels are hidden outside the lenses (`inOptic`).
- **Periscope** (submarine): same mode, eye at the top of the attack periscope (≈0.4 u above the waves at periscope depth), slight sway, ×1.5 default zoom, CSS mask overlay (`#scope`), relative bearing. Refused / left automatically when the boat is deep.
- **Salvo camera**: follows the newest player shell already in flight (else the newest torpedo) from 6 u behind along its arc, holds 1.8 s on the impact; a new salvo takes over once its shells are 0.25 s out. Rendered into a 320×180 viewport (top right) by a second pipeline instance; `gfx.pip` toggles it.
- Perspective views get a sky dome (`world.sky`, horizon = fog colour) and fog 170–410 so the 900 u sea grid edge never shows; the iso view keeps 400–900.
- **Iso** (play, results): orthographic, offset `(0, 70, 52)` rotated by `yaw`, visible height 60 u at zoom 1, user zoom 0.4–2.2× (wheel), rotate with Q/E or right/middle-mouse drag. The target is the player ship shifted toward the aim point (up to 26 u) so the gunner sees further ahead.
- **Showcase** (menu): perspective camera orbiting the player ship slowly; the ship sits right of centre because the menu is on the left.

## World (`js/world/`)
- **Units and conventions**: 1 u ≈ 10 m; knots = u/s × 4; km = u / 100. Heading `th`: forward = (sin th, cos th); turning left = `th` increasing. Local ship axes: +z bow, +x starboard, waterline y = 0.
- **Sea**: playable area ±330 u (`EDGE`); ships are held at the edge. Start area (radius 70 u) is free of islands.
- **Islands** (`islands.js`): 11 clusters of 2–5 flattened ellipsoid lumps (seeded), vertex-coloured sand/grass/rock, trees. The same ellipses drive `isLand()` (ships, torpedoes, AI feelers, spawns) and `heightAt()` (shell impacts).
- **Ship classes** (`CLASSES` in `constants.js`):

| Class | HP | Speed | Main battery | Gun range | Torpedoes |
|---|---|---|---|---|---|
| Destroyer (dd) | 1700 | 38 kn | 2×1, 2.8 s | 1.15 km | 4, 24 s |
| Cruiser (ca) | 3600 | 31 kn | 3×2, 6.5 s | 1.55 km | 2, 45 s |
| Battleship (bb) | 7800 | 25 kn | 4×3, 13 s | 1.95 km | — |
| Submarine (ss) | 1500 | 29 kn surfaced | 1×1, 3.6 s (surfaced only) | 0.8 km | 4 bow/stern, 16 s |

- **Movement** (`ships.js`): telegraph `THROTTLE` = astern −¼, stop, ¼, ½, ¾, full; acceleration per class; rudder moves toward the input at `1/rudderT` per second and returns to centre when released; turn rate scales with speed. Bow probe against `isLand()` → grounding (speed reverses at −25%). Ships push each other apart; enemy contact causes ramming damage.
- **Turrets**: arc `{c, w}` relative to the bow (forward turrets c = 0, aft c = π, half-width 150°). Traverse is clamped inside the arc, so a turret never swings through its dead zone. A turret fires only when aimed within ~2° and reloaded.
- **Shells** (`combat.js`): one shell per barrel; aim beyond max range is clamped to max range. Dispersion: lateral `disp × (0.3 + 0.7·d/range)`, longitudinal 70% of that, triangular distribution. Horizontal speed is constant, height is a parabola with apex ∝ distance; a shell below `heightAt()` explodes on the island. Hit test at the impact point with `hullHit()` (pointed bow, rounded stern). Rolls: citadel (×3 damage, cruisers/battleships), fire (max 2 per ship, 18 s, 0.28% max HP/s).
- **Torpedoes**: spread of `n` from the broadside facing the target, only when the target bearing is 25°–155° off the bow; arm after 5 u; stop at land or max range. `torpThreat()` drives the HUD warning (enemy torpedo within 70 u on a collision course).
- **Lead**: `intercept()` solves the meeting time for a constant-speed projectile and a constant-velocity target; used by the AI for both shells and torpedoes.
- **AI** (`ai.js`): preferred range 55% (dd) / 70% (ca) / 80% (bb) of gun range; closes in when far, sails broadside in range, opens the range when too close, switches circling side every 25–50 s. Feelers ahead and ±35° steer away from islands. Lead error and extra dispersion shrink with `skill`.
- **Waves** (`index.js`): fixed first five waves (2 dd; dd + ca; ca + 2 dd; bb + 2 dd; 2 ca + 2 dd), then `3 + n/2` ships (max 7) with more battleships later. Skill `0.2 + 0.1·n` (max 1). Spawn 170–230 u from the player, off islands. Between waves: 9 s pause, +25% HP, +1 repair charge. Score: damage dealt + kill bonus (dd 800, ca 1300, bb 2200, ×(1 + 0.1·wave)).
- **Effects** (`fx.js`): two instanced pools, 900 glow + 2600 lit, ring-buffer slots (oldest is recycled when full). Camera-facing soft billboards with per-instance alpha (`aAlpha`), flat ones (foam, splash rings) lie on the water above the highest crest.

## Submarine (`ss`)
- `ship.sub = { level, y, batt, ghost }`: `level` is the ordered depth (Z −1 / X +1), `y` the keel offset moving toward `DEPTHS[level].y` at `DIVE_RATE`; `depthLevel()` gives the band actually reached (surface > −0.35, periscope > −2.6, deep). Speed × `DEPTHS[band].speed`; battery drain per band (charges on the surface); a flat battery forces `level = 0`.
- Reach: `shellable()` (y > −0.6) for shells and the deck gun, `torpable()` (y > −2.6) for torpedoes; deep boats skip ship–ship collisions. Diving clears fires.
- Torpedo tubes (`torps.bow`): bow and stern, ±35°; launched from the bow or stern; not when deep.
- AI (`ai.js`): detection radius per band (`DEPTHS[].detect`); `seen` keeps the last known position; destroyers steer straight at a detected submerged boat and drop depth charges (around their own position, ±3 u) within `CHARGE.dropR` (6 u) every `CHARGE.cd` (2.6 s; fuse 1.6 s, radius 8 u, falloff, ×0.8 when deep); cruisers and battleships turn away; no gunfire at submerged boats, no torpedoes at deep ones.
- Rendering: under water the player's boat swaps to a translucent depth-test-off material (`setGhost` in `models.js`), periscope meshes (`name = 'scope'`) keep their own; enemies never see a ghost because they are never submarines.

## Persistence (localStorage)
- `salvo:save:v1` — `{ best, bestWave, cls }` (best score, best wave, last selected ship)
- `salvo:settings:v1` — settings
Storage errors are swallowed (private mode etc.).

## Privacy and security
- CSP in `index.html`: `script-src 'self'`, `style-src 'self'`, no external scripts/CDNs, no `eval`/`innerHTML`/inline styles, no API keys.
- No network requests; nothing is collected or sent.

## Versioning (standing rule)
Every push to `main` is a new semver version: bump `js/version.js`, add an entry at the top of `CHANGELOG.md`, run `node tools/check-version.mjs` (the `pre-push` hook in `.githooks/` runs it automatically after `git config core.hooksPath .githooks`), then push. The owner creates `vX.Y.Z` tags in GitHub Releases.
When the remote `main` is ahead (e.g. a workflow change): `git pull --rebase origin main`.

## Testing (headless)
Playwright (Python) with Chromium and `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist` gives working WebGL2 without a GPU (about 2 fps). Pattern: `py -m http.server` on a copy of the site whose `js/main.js` gets `window.__app = app;` appended (the app object exposes `world`, `settings`, `input`, `rig`, `menu`, `progress`, `mode`, `paused`, `startRun(cls)`…). Fast-forward by calling `__app.world.update(0.05, t, ctl)` in a loop inside `page.evaluate`, then take screenshots. For identical comparison shots, seed `Math.random` and drive the frame loop with a fake clock from an init script (queue only the callback named `frame`, and restore the real `performance.now` before `page.screenshot`, which needs it). Full-resolution frames are slow under SwiftShader: use a small viewport (e.g. 800×450) and a long screenshot timeout. Thumbnail: render the start screen at a 1200×630 viewport (fake clock, ~160 frames so the showcase settles, battleship selected via `salvo:save:v1`, hide the `.info` best-score line), save as `assets/og-image.jpg`. Listen to `pageerror` and `console` errors. Scope button selectors to `.screen:not([hidden])`.

## Attributions
three.js (MIT), vendored in `vendor/`. All models, textures, effects and sounds are generated in code.
