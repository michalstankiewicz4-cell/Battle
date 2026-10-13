# Architecture

Steel Salvo — naval battle in pixel-art 3D. No dependencies except three.js (vendored), no network requests.

## File map
| Path | Role |
|---|---|
| `index.html` | Skeleton, CSP, meta; `#app` (canvas) and `#ui` (all UI built from JS) |
| `css/base.css`, `menu.css`, `hud.css` | Base, menu overlay, in-game HUD |
| `js/main.js` | Entry: `createApp()` |
| `js/version.js` | `VERSION` (read by `tools/check-version.mjs`) |
| `js/core/app.js` | Renderer, pipeline, world, rig, modes `menu`/`play`/`dead`, pause, frame loop, aim ray, events → HUD |
| `js/core/cameras.js` | Iso orthographic follow camera (yaw Q/E or RMB drag, wheel zoom) and menu showcase (perspective orbit) |
| `js/core/settings.js`, `storage.js`, `util.js` | Sanitised settings (`salvo:settings:v1`), localStorage wrappers, helpers |
| `js/core/sound.js` | Procedural Web Audio effects |
| `js/render/pixel-pipeline.js` | **Shared engine**: low-res target + palette/dither/outline/vignette shader (identical to Capital Quarantine) |
| `js/input/input.js` | Keys by `KeyboardEvent.code`, mouse NDC, LMB fire, RMB drag, wheel |
| `js/world/index.js` | World facade: light, ocean, islands, fx, combat, ships, wave director, water indicators |
| `js/world/constants.js` | `CLASSES` (dd/ca/bb stats and turret layouts), telegraph, edge, fire params |
| `js/world/ocean.js` | Wave function (JS + GLSL twins), ocean shader with shallows/surf from island lumps |
| `js/world/islands.js` | Procedural islands (ellipsoid lumps), `isLand`, `heightAt` |
| `js/world/models.js` | Ship meshes (extruded hull, superstructure, rotating turrets) |
| `js/world/ships.js` | Ship entity: movement, bobbing, turret traverse in arcs, damage, fires, repair, sinking |
| `js/world/combat.js` | Shells (ballistic arc, dispersion, island blocking, citadels/fires), torpedoes, `intercept()` |
| `js/world/ai.js` | Enemy navigation (range keeping, broadside, island feelers) and gunnery/torpedo leading |
| `js/world/fx.js` | Instanced particle pools (glow + lit): splashes, explosions, smoke, fire, foam, tracers |
| `js/ui/hud.js`, `menu.js`, `dom.js` | HUD, menu screens, DOM builder |
| `js/i18n/*` | `t()`, `bind()`; `en` (default) and `pl` |

## Conventions
- Units: 1 u ≈ 10 m; speeds shown as knots = u/s × 4; distances in the crosshair as km = u / 100.
- Heading `th`: forward = (sin th, cos th); turning left = `th` increasing. Local ship axes: +z bow, +x starboard.
- Turret arcs: `{c, w}` (centre, half-width) relative to the bow; traverse is clamped inside the arc so it never swings through the dead zone.
- Shells: horizontal speed constant, so `intercept()` gives the lead for both shells and torpedoes. Height is a parabola with apex ∝ distance; a shell below `islands.heightAt()` explodes on the island.
- Hit test: `hullHit()` (pointed bow, rounded stern) at the impact point.

## Waves
`waveRoster(n)`: fixed first five waves, then 3 + n/2 ships (max 7), more battleships later. AI skill `0.2 + 0.1·n` (max 1) reduces lead error and dispersion. Between waves: 9 s breather, +25% HP, +1 repair charge.

## Testing (headless)
Playwright (Python) + Chromium with `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`. Serve a copy whose `js/main.js` gets `window.__app = app;` appended; `__app.world.update(dt, t, ctl)` can be called in a loop to fast-forward (SwiftShader runs at ~2 fps).
