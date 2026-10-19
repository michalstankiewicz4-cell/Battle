# TODO

Legend: **P1** next, **P2** later, **P3** ideas. State as of v0.7.1. Context: [`docs/HANDOFF.md`](docs/HANDOFF.md), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Multiplayer (plan in [`docs/MULTIPLAYER.md`](docs/MULTIPLAYER.md))
- [ ] P2 Decision: co-op PvE and/or PvP, player count, P2P or server (the menu entry "Multiplayer" exists as "Soon")
- [ ] P2 Refactor: pure state + `step()` without three.js, deterministic RNG (shell dispersion, AI, spawns)
- [ ] P2 Transport layer + WebRTC (opt-in, CSP change, README note)
- [ ] P2 Lobby (room code), snapshots, interpolation, two-client tests

## Labs
- [ ] P1 Ship "transformer": optimize a ShipKit model for the game (merge, LOD levels, instancing, culling of tiny parts, texture atlas) with before/after stats and the doctor's budget (now 33k triangles / 99 draw calls)
- [ ] P1 Owner picks a water variant in the water lab → put that sea into the game (Gerstner waves shared by ships and the shader, wake, bow wave, foam; cheaper settings for Light)
- [ ] P1 Błyskawica as the player's destroyer in the game (transformer output, scale, mounts, tubes)
- [ ] P2 Water lab: ship shadows on water, persistent foam map, underwater view, shore interaction
- [ ] P2 Check Błyskawica positions against a profile drawing; 1941/1942 configurations as variants
- [ ] P3 Doctor: mount sweep check, elevation/blast zones, unused materials
- [ ] P3 More real ships in the lab

## Gameplay
- [ ] P1 Balance on a real GPU: class HP, reloads, dispersion, AI skill curve, wave size
- [ ] P1 Spotting / detection ranges (concealment); ships hidden on the minimap until spotted
- [ ] P2 Smoke screen for destroyers, hydro/radar for cruisers
- [ ] P2 AP vs HE shells (penetration vs fire chance), armour angles
- [ ] P2 Module damage (turrets, engine, rudder), flooding from torpedoes
- [ ] P2 Smarter AI: formations, retreat at low HP, hiding behind islands
- [ ] P3 Mission modes: convoy escort, capture points, boss battleship
- [ ] P2 Submarines: enemy submarines, sonar ping (shows ships through islands), torpedo depth settings, crash dive
- [ ] P2 Gun camera: lead indicator for moving targets, shell-drop markers, range ticks calibrated in metres
- [ ] P3 More ship types (tiers), aircraft carriers

## Look and sound
- [ ] P2 Day/night and weather (fog, rain) — reuse the sky cycle from Capital Quarantine
- [ ] P2 Shell trails and better splash/explosion effects at distance
- [ ] P2 Sound: distance attenuation, engine, music
- [ ] P1 Graphics: shadow map size option, automatic Light preset when FPS stays low
- [ ] P2 Ship hull textures with plates/portholes, wake as a continuous ribbon

## Menus and settings
- [ ] P2 Rebindable keys (as in Capital Quarantine), gamepad
- [ ] P3 More languages (add a dictionary in `js/i18n/` and an entry in `LANGS`)

## Technical
- [ ] P2 E2E: run `tools/e2e.py` in GitHub Actions on every push (Chromium + SwiftShader)
- [ ] P2 Performance: profile on weaker GPUs
- [ ] P2 Shared engine: move common files (dom, i18n, util) into one place used by both games
- [ ] P3 Save format versioning (`salvo:save:v1` → migrations)

## Operational
- [ ] Create `vX.Y.Z` tags in GitHub Releases (owner)
- [ ] Add the site to Google Search Console and submit `sitemap.xml` (owner)
- [ ] Final game name ("Steel Salvo" is a working title) — then update title/SEO/manifest/thumbnail

## Done (summary)
Ocean shader, islands, four ship classes, ballistic gunnery with dispersion and island cover, torpedoes with warning, repair party, fires and citadels, enemy AI, endless waves, HUD with minimap, menus with ship selection, options, procedural sound, GitHub Pages deploy, English UI with Polish option. Realistic graphics with detailed models and graphics settings (presets High/Light), gun camera with binoculars, submarine with diving, battery, periscope and depth charges, salvo camera, English SEO with thumbnail and icons, headless e2e test. Labs: Ship Lab (ORP Błyskawica 1:1, ShipKit), Model Doctor (all models clean), Water Lab (Gerstner sea, A/B compare); labs linked from the main menu. Details: `CHANGELOG.md`.
