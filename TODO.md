# TODO

Legend: **P1** next, **P2** later, **P3** ideas. State as of v0.3.0. Context: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Multiplayer (plan in [`docs/MULTIPLAYER.md`](docs/MULTIPLAYER.md))
- [ ] P2 Decision: co-op PvE and/or PvP, player count, P2P or server (the menu entry "Multiplayer" exists as "Soon")
- [ ] P2 Refactor: pure state + `step()` without three.js, deterministic RNG (shell dispersion, AI, spawns)
- [ ] P2 Transport layer + WebRTC (opt-in, CSP change, README note)
- [ ] P2 Lobby (room code), snapshots, interpolation, two-client tests

## Gameplay
- [ ] P1 Balance on a real GPU: class HP, reloads, dispersion, AI skill curve, wave size
- [ ] P1 Spotting / detection ranges (concealment); ships hidden on the minimap until spotted
- [ ] P2 Smoke screen for destroyers, hydro/radar for cruisers
- [ ] P2 AP vs HE shells (penetration vs fire chance), armour angles
- [ ] P2 Module damage (turrets, engine, rudder), flooding from torpedoes
- [ ] P2 Binocular (zoomed) view for long-range shots
- [ ] P2 Smarter AI: formations, retreat at low HP, hiding behind islands
- [ ] P3 Mission modes: convoy escort, capture points, boss battleship
- [ ] P2 Submarines: enemy submarines, sonar ping (shows ships through islands), torpedo depth settings, crash dive
- [ ] P2 Gun camera: lead indicator for moving targets, shell-drop markers
- [ ] P3 More ship types (tiers), aircraft carriers

## Look and sound
- [ ] P2 Day/night and weather (fog, rain) — reuse the sky cycle from Capital Quarantine
- [ ] P2 Shell trails and better splash/explosion effects at distance
- [ ] P2 Sound: distance attenuation, engine, music
- [ ] P1 Graphics: shadow map size option, automatic Light preset when FPS stays low
- [ ] P2 Ship hull textures with plates/portholes, wake as a continuous ribbon, sky dome for the menu camera
- [ ] P2 Toon/watercolour: outlines in the perspective menu camera (depth is non-linear there)

## Menus and settings
- [ ] P2 Rebindable keys (as in Capital Quarantine), gamepad
- [ ] P3 More languages (add a dictionary in `js/i18n/` and an entry in `LANGS`)

## Technical
- [ ] P1 E2E test script in the repo (Playwright) instead of ad-hoc scripts
- [ ] P2 Performance: profile on weaker GPUs
- [ ] P2 Shared engine: move common files (dom, i18n, util) into one place used by both games
- [ ] P3 Save format versioning (`salvo:save:v1` → migrations)

## Operational
- [ ] Create `vX.Y.Z` tags in GitHub Releases (owner)
- [ ] Thumbnail `assets/og-image.png` and icon
- [ ] Add the site to Google Search Console and submit `sitemap.xml`

## Done (summary)
Ocean shader, islands, three ship classes, ballistic gunnery with dispersion and island cover, torpedoes with warning, repair party, fires and citadels, enemy AI, endless waves, HUD with minimap, menus with ship selection, options, procedural sound, GitHub Pages deploy, English UI with Polish option. Realistic graphics with detailed models and graphics settings (presets High/Light), gun camera, submarine with periscope, salvo camera. Details: `CHANGELOG.md`.
