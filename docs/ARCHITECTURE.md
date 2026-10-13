# Architecture and project context

Browser game **Steel Salvo** (working title): naval battle at sea, PvE against waves of AI warships, isometric view (orthographic projection), 3D rendered at low resolution with a pixel-art filter. No dependencies except three.js (vendored locally), no network requests. The engine (pixel pipeline, camera approach, UI builder, i18n) comes from Capital Quarantine (repo VS).

Published at: repo <https://github.com/michalstankiewicz4-cell/Battle>, site <https://michalstankiewicz4-cell.github.io/Battle/> (GitHub Pages, workflow `.github/workflows/static.yml`).

## Quick start for someone returning to the project
1. Read this file, then [`../TODO.md`](../TODO.md) and (for networking) [`MULTIPLAYER.md`](MULTIPLAYER.md).
2. Run locally: `py -m http.server 8000` in the repo folder, open `http://localhost:8000` (ES modules do not work from `file://`).
3. Enable the version guard once per clone: `git config core.hooksPath .githooks`.
4. Standing rules: see "Rules" below and [`../CLAUDE.md`](../CLAUDE.md).

## File map
| Path | Role |
|---|---|
| `index.html` | Skeleton, CSP, SEO meta; empty `#app` (canvas) and `#ui` (all UI is built from JS) |
| `css/base.css`, `css/menu.css`, `css/hud.css` | Base styles; menu/options overlay; in-game HUD |
| `js/main.js` | Entry point: `createApp()` |
| `js/version.js` | `VERSION` (semver) — must stay at this path (the check script reads it) |
| `js/core/app.js` | App shell: renderer, pipeline, world, camera rig, mode state machine (`menu`/`play`/`dead`), pause, aim ray, world events → HUD, frame loop |
| `js/core/cameras.js` | Camera rig: isometric ortho follow camera, menu showcase (perspective orbit) |
| `js/core/settings.js`, `storage.js`, `util.js` | Sanitised settings store, localStorage wrappers, small helpers (`clamp`, `wrapAngle`, `mulberry32`) |
| `js/core/sound.js` | Procedural Web Audio effects (no sound files) |
| `js/render/pixel-pipeline.js` | `PixelPipeline`: low-res target + final shader (palette, dither, depth outline, vignette) — **identical to Capital Quarantine** |
| `js/input/input.js` | Keys by `KeyboardEvent.code`, mouse NDC, LMB fire, RMB/MMB drag, wheel |
| `js/world/index.js` | World facade (`createWorld`): light, ocean, islands, fx, combat, ships, wave director, water indicators |
| `js/world/constants.js` | `CLASSES` (dd/ca/bb stats and turret layouts), `THROTTLE`, `EDGE`, `FIRE` |
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
Stored in `localStorage` key `salvo:settings:v1`: `lang` (`en` default, `pl`), `gfx` (pixelH 140–540, levels, dither, edge, bright, showFps), `vol`, `mouse` (zoomSens, rotSens). Everything passes through `sanitize()` (clamps, whitelists). Change settings only via `settings.update(draft => …)`; listeners via `settings.onChange`.

## Rendering (`js/render/pixel-pipeline.js`)
- three.js scene → `WebGLRenderTarget` of height `pixelH` (default 270 px here) with a `DepthTexture` → full-screen shader: brightness, quantisation to `levels` with 4×4 Bayer dithering, outline from depth differences (`edge`), vignette.
- Works with orthographic (play) and perspective (menu showcase) cameras.
- The ocean is a custom `ShaderMaterial`: a 900×900 grid that follows the camera target snapped to its cell size, displaced by four directional sine waves (`waveAt` in JS is the same function, used for ship bobbing). Shallow water and surf are computed per fragment from up to 64 island lumps (`uLumps`).

## Cameras (`js/core/cameras.js`)
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

- **Movement** (`ships.js`): telegraph `THROTTLE` = astern −¼, stop, ¼, ½, ¾, full; acceleration per class; rudder moves toward the input at `1/rudderT` per second and returns to centre when released; turn rate scales with speed. Bow probe against `isLand()` → grounding (speed reverses at −25%). Ships push each other apart; enemy contact causes ramming damage.
- **Turrets**: arc `{c, w}` relative to the bow (forward turrets c = 0, aft c = π, half-width 150°). Traverse is clamped inside the arc, so a turret never swings through its dead zone. A turret fires only when aimed within ~2° and reloaded.
- **Shells** (`combat.js`): one shell per barrel; aim beyond max range is clamped to max range. Dispersion: lateral `disp × (0.3 + 0.7·d/range)`, longitudinal 70% of that, triangular distribution. Horizontal speed is constant, height is a parabola with apex ∝ distance; a shell below `heightAt()` explodes on the island. Hit test at the impact point with `hullHit()` (pointed bow, rounded stern). Rolls: citadel (×3 damage, cruisers/battleships), fire (max 2 per ship, 18 s, 0.28% max HP/s).
- **Torpedoes**: spread of `n` from the broadside facing the target, only when the target bearing is 25°–155° off the bow; arm after 5 u; stop at land or max range. `torpThreat()` drives the HUD warning (enemy torpedo within 70 u on a collision course).
- **Lead**: `intercept()` solves the meeting time for a constant-speed projectile and a constant-velocity target; used by the AI for both shells and torpedoes.
- **AI** (`ai.js`): preferred range 55% (dd) / 70% (ca) / 80% (bb) of gun range; closes in when far, sails broadside in range, opens the range when too close, switches circling side every 25–50 s. Feelers ahead and ±35° steer away from islands. Lead error and extra dispersion shrink with `skill`.
- **Waves** (`index.js`): fixed first five waves (2 dd; dd + ca; ca + 2 dd; bb + 2 dd; 2 ca + 2 dd), then `3 + n/2` ships (max 7) with more battleships later. Skill `0.2 + 0.1·n` (max 1). Spawn 170–230 u from the player, off islands. Between waves: 9 s pause, +25% HP, +1 repair charge. Score: damage dealt + kill bonus (dd 800, ca 1300, bb 2200, ×(1 + 0.1·wave)).
- **Effects** (`fx.js`): instanced box particles, 900 glow + 2600 lit, ring-buffer slots (oldest is recycled when full).

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
Playwright (Python) with Chromium and `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist` gives working WebGL2 without a GPU (about 2 fps). Pattern: `py -m http.server` on a copy of the site whose `js/main.js` gets `window.__app = app;` appended (the app object exposes `world`, `settings`, `input`, `rig`, `menu`, `progress`, `mode`, `paused`, `startRun(cls)`…). Fast-forward by calling `__app.world.update(0.05, t, ctl)` in a loop inside `page.evaluate`, then take screenshots. Listen to `pageerror` and `console` errors. Scope button selectors to `.screen:not([hidden])`.

## Attributions
three.js (MIT), vendored in `vendor/`. All models, textures, effects and sounds are generated in code.
