# TODO

Legend: **P1** next, **P2** later, **P3** ideas. State as of v0.8.1 Context: [`docs/HANDOFF.md`](docs/HANDOFF.md), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Multiplayer (plan in [`docs/MULTIPLAYER.md`](docs/MULTIPLAYER.md))
- [ ] P2 Decision: co-op PvE and/or PvP, player count, P2P or server (the menu entry "Multiplayer" exists as "Soon")
- [ ] P2 Refactor: pure state + `step()` without three.js, deterministic RNG (shell dispersion, AI, spawns)
- [ ] P2 Transport layer + WebRTC (opt-in, CSP change, README note)
- [ ] P2 Fixed simulation tick (30/60 Hz accumulator) + render interpolation between ticks; state hash for desync checks (see MULTIPLAYER.md §7)
- [ ] P2 Lobby (room code), snapshots, interpolation, two-client tests

## Pixel Studio (separate project, `docs/pixel.md`)
- [ ] P2 Owner tries it; then: palette editor/import, layers, selection and move, per-frame timing, 3×3 tile preview, canopy normals for trees, more 3D subjects

## Labs (map: [`docs/labs.md`](docs/labs.md))
- [x] Look Lab v0.9.0: procedural ageing with baked shading, cloudy sky and weather (wind → sea), tone/exposure/bloom, lens effects, bodycam look, automatic resolution
- [x] Rain (streaks, rings on the sea, wet ship, curtains on the horizon, squalls) and sea fog with visibility in km (v0.10.0)
- [x] Time of day: dawn, dusk, night with stars and the moon; colour saturation in the game's options, vibrance in the Look Lab (v0.11.0)
- [x] Lightning and thunder, navigation lights, gun flashes lighting ship and sea, SOS by searchlight shutters (Look Lab, Ship Lab) (v0.12.0)
- [x] Land Lab v0.13.0: procedural land and sea (0–100 %), five shapes, erosion, beaches, shallows and surf, wrap-around (torus) or bounded map (buoys, mountains, wall), sailing with grounding
- [ ] P1 Land Lab next: rivers and lakes, cliffs and rocky shores (overhang-free cliff faces), harbours and towns, vegetation (trees as instanced impostors), ground vehicles / free walk for the 100 % land case; terrain LOD beyond the far grid
- [x] Water bodies in the Water Lab: ocean, fjord, lake, river (current, shore streaming over the ground, mirrored walls) (v0.14.0)
- [x] Harbour water with oil sheen, ice and pack ice with the ship's lane (v0.15.0)
- [x] Waterside Structures Lab with a jack-up drilling rig, Super 300 class (v0.16.0)
- [ ] P2 **Paint Lab** (owner, for later): ship paint schemes and camouflage as their own data — design a scheme, fit it to a ship, assign it to another one (dazzle, Admiralty disruptive, peacetime grey, period markings)
- [x] **ORP Orzeł** (submarine, 1939) in the Ship Lab with research (`docs/ships/orzel.md`): diving, retractable 40 mm, pressure hull (v0.18.0)
- [ ] P2 Orzeł: check against a profile drawing/photos when available; May 1940 state; ORP Sęp variant; periscope wake in the Water Lab
- [x] Quays (gravity, sheet-pile, piled deck; Błyskawica alongside) and breakwaters (rock, tetrapods, caissons + tetrapod berm; round head with a light) (v0.17.0)
- [ ] P2 Structures next: piers and jetties, harbours (cranes, sheds), lighthouses; rig details (rack teeth, deck lighting, well-test flame); structures in the model doctor
- [x] Land Lab mixes the water bodies by region: layouts (river mouth, lake and canal, fjord sill, harbour bay, ice edge) and mixed from the seed (lakes, fjords, carved rivers with currents, ice edge), seamless transitions (v0.19.0)
- [x] Land biomes: northern, plains (flat, gently rolling, meadows and fields), desert (dunes, plateaus, mesas), zones; rivers meander (v0.20.0)
- [x] **Plants Lab** (v0.21.0): eight species, wind, autumn, impostors, forests by biome, grass blades
- [ ] P2 Plants next: undergrowth (ferns, heather, reeds), dead wood, smooth model↔impostor cross-fade, autumn impostors, plants in the Land Lab and the game
- [ ] P1 **Rocks Lab** (owner 2026-10-22): boulders, scree, outcrops and cliff faces as objects, placed by biome and slope
- [ ] P2 More biomes (tundra, tropical, volcanic…), later other planets (sky, water and biome bundles); the game's map generator on top (scale, spawns, balance)
- [ ] P2 Environment: fog banks, spray in high wind; sky and weather panels in the water lab
- [ ] P1 Owner picks an ageing level and a look → into the game's materials and graphics settings (lens effects for first-person views)
- [ ] P1 Procedural destruction on the transformer's hitboxes: damage model, spread to neighbours, debris, fire and smoke
- [ ] P2 Transformer: instancing of repeated fittings and merged mount materials on LOD0 (~30 draw calls)
- [x] Ships and sea in the game: metres, WaterKit sea with foam memory, Błyskawica (destroyer) and Orzeł (submarine) (v0.29.0)
- [ ] P1 Real models for the cruiser and battleship; the transformer's hitboxes and damage texture in battle (per ship, not shared)
- [ ] P2 Owner picks a water variant in the water lab → put that sea into the game (Gerstner waves shared by ships and the shader, wake, bow wave, foam; cheaper settings for Light)
- [ ] P1 Błyskawica as the player's destroyer in the game (transformer output, scale, mounts, tubes)
- [x] Water lab: foam with memory (FoamKit: whitecaps → lace, wake for minutes, shell splashes, torpedo tracks), whitecaps calibrated to Monahan (v0.24.0)
- [ ] P1 Sea after Open Water (owner's order 2026-10-24): sun glitter as sparkles + slope-variance roughness → FFT waves as the High preset → cloud shadows and rain cells → AgX tone mapping
- [ ] P2 Water lab: ship shadows on water, underwater view, shore interaction
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
