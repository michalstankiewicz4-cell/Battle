# Changelog

Versioning: `MAJOR.MINOR.PATCH`. Every push to the repository is a new version (number in `js/version.js` + an entry here).
The owner creates `vX.Y.Z` tags in GitHub Releases on commits from this history; pushing tags from a Claude session is blocked.
Bug fix = PATCH, new feature = MINOR, big change to gameplay or the save format = MAJOR.
Before every push run `node tools/check-version.mjs`; the `pre-push` hook in `.githooks/` runs it automatically (`git config core.hooksPath .githooks`).

## [0.21.0] - 2026-10-22
### Added
- **Plants Lab** (`labs/plants.html`): trees, palms, shrubs and grass grown from code at real scale — Norway spruce, Scots pine, silver birch, pedunculate oak, date palm, umbrella thorn acacia, common juniper, desert saltbush — with bark and foliage drawn on canvases, moving in the wind (trunks bend, gusts travel, leaves flutter, shadows follow), birch and oak turning in autumn.
- **Specimen** mode: one plant from a seed, size, detail, season, its impostor beside it; **Landscape** mode: a 2.4 km world with lakes in any biome or zones, spruce/pine forests with birch edges and juniper heath, oak copses on the plains, palm oases and acacias in the desert; full models near the camera (instanced, shadows) and **impostors** beyond (8 views × 3 variants, colour and normal atlases, lit by the sun); **grass** blades in tufts on a tile that follows the camera, by biome, slope and water.
- `js/env/plantkit.js` (species, growth, materials, wind) and `js/env/forestkit.js` (impostors, forest LOD, grass); research and rules in `docs/plants.md`.

## [0.20.0] - 2026-10-22
### Added
- **Land biomes** in the Land Lab: **plains** (relief pressed to a few tens of metres, long low swells and hummocks; meadows and farmland strips with hedges, a narrow beach), **desert** (dune fields with crests across the wind and slip faces, stepped plateaus and mesas with cliffs, desert varnish, wind ripples close up), the **northern** look as before, and **zones** mixing all three by region with a zone transition of 0.2–4 km. Heights and the terrain palette blend by biome (RegionKit biome weights, LandKit `setBiome`); the chart and the share list show them.
### Changed
- Rivers in *Mixed* meander (a swinging course down a chamfer distance-to-the-sea field), work on low land too, and their valleys end in a narrower bank.

## [0.19.0] - 2026-10-22
### Added
- **Water bodies mixed by region** in the Land Lab (`js/env/regionkit.js`): a region map gives every place a blend of ocean, fjord, lake, river, harbour water and ice plus a flow; the sea blends their looks, waves, ripples, foam, oil, ice cover and current with no seams, and the ship feels it (smaller waves in sheltered water, carried by the current, its status says what water it is in).
- Layouts: **river mouth** (river, estuary, brackish plume, sea), **lake with a canal** to the sea, **fjord entrance** over a sill with skerries, **sheltered bay** behind a sandy spit (harbour water with oil), **ice edge** (loose floes to pack ice with polynyas), and **mixed from the seed**: the terrain classified into open sea, lakes and fjords, with rivers carved from the hills to the sea (meandering, widening, current slowing to the mouth) and an ice edge from the north. *Transition* width 60–1,600 m.
- Chart tinted by water body with the waters' names; the share of each water listed.
### Changed
- WaterKit: ice cover per place (`gIceK`), far floes drawn as their average cover (no flicker), ripples/foam/oil drift with a regional current, foam streaks along the local flow.

## [0.18.0] - 2026-10-22
### Added
- **ORP Orzeł** (1939, as delivered) in the Ship Lab — the Polish ocean-going submarine from De Schelde, Vlissingen, 1:1 from published figures (84 × 6.70 × 4.17 m, 1,110 / 1,473 t): double hull with a flat casing, limber holes, raked stem with a net cutter and jumping wires, streamlined conning tower with an open bridge and periscope standard, "85A" and the bronze name on the tower, the bell, 105 mm/41 Bofors in a shielded mount forward of the tower, twin 40 mm Bofors on an elevator in a watertight well in the tower (with its cover), two trainable twin torpedo mounts between the hulls, bow and stern tube shutters, folding bow hydroplanes, stern planes, twin screws, rudder. Inside the outer hull (lab only): the pressure hull with its outside frames every 0.55 m, the tower trunk and the bow and stern tube nests. Research sheet `docs/ships/orzel.md`.
- **Diving** in the Ship Lab: Surfaced, Decks awash, Periscope depth (keel 12 m) and Deep — at the real rate or fast; the 40 mm sinks into its well and the cover closes, the bow planes rig out, the periscopes rise, the ensign is struck; the status line gives the keel depth and how much periscope shows.
- Ship Lab works per ship: camera presets, dimension labels and part names come from each ship module's `view`; the signal lamp shows only for a ship that has one; `labs/ship.html?ship=orzel` opens Orzeł; a tile on the labs page.
- ShipKit parts: `deckGun105` (submarine deck gun), `lettering`, `ensign` (shared), `bofors40` without a splinter tub, `torpedoTubes` with any number and length of tubes.

## [0.17.0] - 2026-10-22
### Added
- **Quay walls** in the Waterside Structures Lab: gravity block wall (precast blocks in courses on a rubble bed), steel sheet-pile wall (U-profile piles) or open piled deck (deck on Ø 1 m steel piles over a rock revetment); capping beam with a safety kerb, tee-head bollards every 15 m, cylindrical rubber fenders on chains, recessed ladders, crane rails, lighting masts, paved apron; length and cope level. **ORP Błyskawica moored alongside** on the fenders with bow and stern lines and springs.
- **Breakwaters**: rubble mound armoured with two layers of **tetrapods** (rock on the lee side) or of **rock**, toe berm, crown wall with a recurved parapet; or **caissons** on a rubble bed with a superstructure, wave wall and a tetrapod berm (the mixed type built at Gdańsk); round head with a red harbour light (IALA A); length, crest level, armour unit mass 2–25 t. Thousands of units instanced (a 180 m breakwater: ~2,200 tetrapods, ~4,600 rocks, nine draw calls).
- The sea reads each structure's heights (baked to a texture): turquoise shallows and surf along slopes and toes, calm water and no water over quays and crests. Each structure keeps its own water depth; structure settings come from `PARAMS`; camera presets per structure.
- StructKit `coastal.js` (tetrapod and rock geometry, `layUnits`, `instanced`, bollards, fenders, ladders, masts, `sweepZ`) and a splash-zone material (wet and weedy below the water). Research sheet `docs/structures/coastal.md`; the lab check builds every type.

## [0.16.0] - 2026-10-21
### Added
- **Waterside Structures Lab** (`labs/structures.html`) and **StructKit** (`js/structkit/`): static structures in the water built from code at real scale (quays, piers, breakwaters, harbours and lighthouses next — owner: everything built that touches the water).
- **Jack-up drilling rig, Super 300 class** (researched from the operator's published specification sheet; layout reconstructed, every assumption in `docs/structures/super300.md`): triangular 82 × 82 × 8.5 m hull, three 157 m square truss legs with rack plates and 16.8 m spud cans, jack houses with pinion units, cantilevered drill floor with a 48.8 m derrick, top drive and BOP, three pedestal cranes (42.7 / 42.7 / 30.5 m booms), four-tier quarters, helideck (22.2 m, standard markings and perimeter lights), three enclosed lifeboats, silos, pipe deck, engine and mud modules, burner booms, railings and stairs; leg paint with marine growth below the splash zone.
- Lab: jack up / float for tow at the real LeTourneau rate × a speed factor, water depth 12–114 m, air gap, cantilever skid, working cranes, weather and day / dusk / night, cameras including an underwater view; specifications, sources and part toggles. Labs page tile, sitemap, guide section; `tools/lab-check.py` floats and jacks the rig.

## [0.15.0] - 2026-10-21
### Added
- Water Lab: **Ice and pack ice** — floes drifting with the water (snow-covered or bare ice, wet rims, irregular outlines), the waves damped under them, floes standing above the water, turquoise ice beside them; at full cover and large floes, pack ice with thin leads; the ship breaks a **lane** of brash ice behind its bow, widening astern. Sliders: ice cover, floe size, ice above water.
- **Harbour water** (murky) with **oil sheen**: drifting patches that calm the ripples and show thin-film colours changing with the viewing angle; the *Oil sheen* slider works on any water body.
- WaterKit: `GLSL_ICE` (`iceAt`), `uIce`, `uOil`; sea states and looks for harbour and arctic water. Lab check covers both bodies.
### Changed
- Owner's decision: everything built that touches the water (quays, piers, breakwaters, harbours, lighthouses) goes to a waterside-buildings lab (tile "soon" on the labs page); the Water Lab keeps the water itself.

## [0.14.0] - 2026-10-21
### Added
- **Water bodies** in the Water Lab: *Open ocean*, *Fjord* (dark still water, walls ~650 m mirrored in the planar reflection), *Lake* (fresh, peaty water, low hills), *River* (silty, 240 m wide, a **current** — the banks stream past at the speed over the ground, foam streaks along the flow); width, walls/banks and current sliders; *Harbour* and *Ice* listed as coming. Each variant A/B can be a different body.
- LandKit `generateWaterway` (a wrap-around channel: width, walls, steepness, depth, meander) and `uLandOff` (the map can stream under a fixed ship; terrain grids stay snapped to the map's lattice); WaterKit `WATER_BODIES`, looks Fjord / Lake / River, sea states for still water, `uCurrent`.
- **Labs guide** `docs/GUIDE.md` (how to open and drive every lab, what to try); linked from the labs page and the README.
### Changed
- **Folder layout**: environment kits moved to `js/env/` (`skykit`, `waterkit`, `rainkit`, `landkit`), the model doctor to `js/tools/`; `js/labs/` keeps one controller per lab page. Folder rules in `docs/ARCHITECTURE.md`.
- Short waves fade with distance in the wave shader (no more rings and moiré far away), shallows take the water's own colour, snow only on real heights, darker rock.

## [0.13.0] - 2026-10-21
### Added
- **Land Lab** (`labs/land.html`, owner's request): procedural land and sea from a seed, **0 to 100 % land** (exact share), shapes Islands / Archipelago / Coast / Fjords / Highlands, highest peaks, sea depth, roughness, droplet **erosion**; map 4–32 km, 256²–1024²; **wrap-around (torus)** map — sail out of one edge and in at the other, land and waves continue without a seam — or a **bounded** map with a buoy line, a mountain range or an invisible wall. Beaches, wet sand, muted grass, heather, scrub, rock, snow; turquoise shallows, surf, waves dying on the shore. Chart (click to move), ORP Błyskawica from the transformer with engine orders, rudder, grounding and barriers; cameras Chase, Bridge, Overview, Free flight; sky and weather; fog thinning with height. Docs: `docs/land.md`.
- **LandKit** (`js/labs/landkit.js`): `generateTerrain`, `heightTexture`, `terrainMeshes` (two camera-centred grids snapped to the heightmap, displaced in the shader, two draw calls), `sampleHeight`, `barrierBuoys`, `GLSL_LAND`; WaterKit `waterMaterial(u, { land })` for shallows and surf.
- Labs page: Land and coast tile; sky, weather and time of day point to the Look Lab. `tools/lab-check.py` checks the land lab (seam, land share, 100 % land, barrier, wrap).
## [0.12.0] - 2026-10-21
### Added
- **Signal lamp** (owner's request): the searchlight behind ORP Błyskawica's bridge keys Morse with a round venetian shutter fitted to the lamp — a ring on the lens rim and horizontal slats cut to the circle, swinging open and shut (~60 ms) with the operator's lever, a glow and a beam ahead only while open. Ship Lab: "Signal with the searchlight" (SOS or any short text, camera moves in front of the lamp); Look Lab: "Signal SOS".
- **Navigation lights** (masthead, green starboard / red port side lights, stern light, each only over its arc), on from sunset to sunrise or on/off.
- **Gun flashes**: "Fire a salvo (F)" trains the 120 mm mounts to one side and fires; flash and burning-gas cone at every muzzle, a short orange light on the ship and the sea.
- **Lightning and thunder**: bolts with branches and return strokes 1.5–6 km away lighting the clouds, the scene and the sea; frequency slider (Storm has it), "Lightning strike now", optional thunder sound after distance ÷ 343 m/s.
- `js/shipkit/lights.js` (`navLights`, `gunFlashes`, `signalLamp`, `morse`); ORP Błyskawica returns light `anchors` (no geometry change); WaterKit `uFlash`; SkyKit `uSkyBolt`; lab checks for the signal shutters, the salvo and a strike.
### Changed
- Plans: fixed simulation tick + render interpolation noted for multiplayer (`docs/MULTIPLAYER.md` §7, TODO P2); next lab: land and terrain (torus map or barriers).

## [0.11.0] - 2026-10-21
### Added
- **Time of day** in the Look Lab: a time slider (solar time at 55° N in late October) and Dawn / Morning / Noon / Afternoon / Dusk / Night buttons; the sun can go below the horizon (−18°). Dawn and dusk glow along the horizon, rose-lit clouds; stars from nautical twilight (hidden by cloud); the **moon** (new … full) with disc, halo, moonlit cloud edges, a moon path on the sea and blue moonlight with shadows; water, foam and fog darken with the daylight; searchlights glow at night; eye adaptation with manual exposure.
- **Colour saturation** in the game's Options > Graphics (0–160 %, Polish "Nasycenie barw"); **Vibrance** slider in the Look Lab.
- SkyKit: `sunAt(hour, lat, day)`; WaterKit: `uLight`. e2e checks that the saturation setting reaches the post shader.

## [0.10.0] - 2026-10-21
### Added
- **Rain** in the Look Lab (`js/labs/rainkit.js`): falling streaks around the camera in one draw call (up to 24k drops, slanted by the wind), rings from drops on the sea, a rougher sea with a duller glitter, the ship gets wet (darker paint, glossy upward faces, water running down the sides, sheltered spots stay dry), dark rain curtains on the horizon (also in the sea's reflections), the sun hidden; **squalls** make the rain come and go; **rain on the lens** adds droplets.
- **Sea fog and visibility** (km): one exponential-squared fog shared by the ship, the sea and the sky (a 260 m fog layer: lighter overhead, the sun a pale disc); fog and rain dim the sun and take away its glitter.
- Weathers **Rain** and **Sea fog**; Storm now rains. Visibility in the stats; "Rain off" in the cost measurement.
### Changed
- WaterKit: `uFogDen` (exponential fog, the old linear fog stays when 0) and `uRain`; SkyKit `applySky()` returns visibility, fog density and how much of the sun gets through.

## [0.9.0] - 2026-10-21
### Added
- **Look Lab** (`labs/look.html`): ORP Błyskawica on the sea under a cloudy sky with procedural ageing and a camera look; every effect switchable, split compare (clean on the left), cost of each effect, settings saved and copied as JSON. Docs: `docs/look.md`.
- **Procedural ageing** (`js/shipkit/ageing.js`): baked occlusion and edge exposure per vertex (`aWear`, ~0.3 s for the 1:1 ship) and per-surface rules from the material key — chalky paint, grime in corners, chipped edges, rust spots and streaks, hull plating and a salt band, greyed wood, faded canvas, brass patina, dark rope; one wear slider plus one per effect.
- **SkyKit** (`js/labs/skykit.js`): procedural cloud sky, five weathers (clear, fair, broken, overcast, storm), sun height and bearing, haze; the same sky drives the sea's reflections and the PMREM environment; the wind can set the sea state.
- **LookPipeline** (`js/render/look.js`): tone mapping ACES / AgX / Hable, automatic exposure, bloom from mipmaps, colour grading, vignette, grain, chromatic aberration, lens distortion, droplets and dirt, sun glare, sharpen; presets Game clean, Cinematic, Bodycam; automatic resolution (~60 fps). Bodycam camera with hand-held shake.
- WaterKit: `waterMaterial(u, { sky })` takes another sky function. Labs tile "Graphics and filters" opens the Look Lab; sitemap entry; `tools/lab-check.py` covers the Look Lab.

## [0.8.1] - 2026-10-21
### Changed
- Labs start screen grouped into five areas: **Models** (ORP Błyskawica; cruiser, submarine, aircraft and shore soon), **Environment** (water and weather; sky and clouds, weather in progress; time of day, land and coast, night sky and space soon), **Graphics and filters** (Look Lab next), **Special effects** (fire, water effects, smoke, destruction soon), **Tools** (Transformer, Model Doctor).
- `docs/labs.md`: map of areas, labs, kits and status, and how they fit together; README, ARCHITECTURE, HANDOFF and TODO point to it.

## [0.8.0] - 2026-10-21
### Added
- **Transformer** (`js/shipkit/transform.js`): turns a ShipKit lab ship into a game-ready `THREE.LOD` — LOD0 full detail merged per material (65 draw calls instead of 99), LOD1 from 170 m (12k triangles, 31 draw calls), LOD2 from 650 m made of primitives (2.7k triangles, 7 draw calls); mounts and guns stay their own groups and are driven on every level by `aim()`.
- **458 hitboxes** for ORP Błyskawica, ready for procedural destruction: hull compartments (4 m × side × bottom/belt/upper), superstructure, funnel, masts, platforms and fittings in a 3 m grid, one box per mount and per gun; volume, hit points, removable flag, neighbours; `raycast()` against the current pose.
- Damage drawn by the materials: every vertex knows its hitbox; a damage texture gives scorching, dented hull plating, buckling and collapse of superstructure, embers — no extra draw calls.
- **Transformer lab** (`labs/transform.html`): level table, show a level or by distance, LOD distances, fleet test up to 24 ships (24 ships: 144 draw calls and 57k triangles against 1,741 and 625k with lab models), hitbox overlay by kind, click to hit, salvo, repair, mount training. Docs: `docs/transform.md`.
- Model doctor examines LOD0–2 with per-level budgets; `tools/lab-check.py` checks the transformer (levels get cheaper, ≥ 300 hitboxes, a ray damages the hull); labs tile and sitemap entry.

## [0.7.4] - 2026-10-21
### Fixed
- ORP Błyskawica: V-shaped hole in the stern — the transom fan now closes across the top from deck edge to deck edge; the transom has its own vertices (flat shading, no rings from the sides' normals).
- Cowl ventilators: the bend now starts on the pipe and the mouth faces the intended way (it pointed backwards and sat beside the pipe); flared bell mouth with a dark inside.
### Added
- Model doctor: **seethrough** check (error) — views the model from 26 directions with ray grids and reports pieces whose back side is visible from outside (holes, missing caps, gaps); test bench case (a box with a missing side); golden file updated.

## [0.7.3] - 2026-10-20
### Fixed
- ORP Błyskawica's hull was see-through from outside (you looked at its inside): the lofted hull and the transom were wound inward and the deck surface faced down. Windings fixed in `js/shipkit/hull.js` (normals out and up), so the hull is lit correctly too. Forecastle-break bulkhead set 4 cm inside the plating (flicker), anchors stowed against the flared plating instead of buried in it. Lab thumbnail refreshed.
### Added
- Model doctor: **facing** check (error) for open one-sided surfaces whose faces point inward — what `inverted` could not see because it only tests closed shapes; a matching mistake on the test bench; golden file updated.

## [0.7.2] - 2026-10-19
### Changed
- Documentation tidied for a fresh start: `docs/HANDOFF.md` (one labs summary, current decisions, next steps led by the ship transformer, new gotchas: CSP vs Playwright on lab pages, unmerged ShipKit for the doctor, zoom-aware e2e aiming, no parallel test runs) and `TODO.md` (labs list deduplicated and ordered, done summary includes the labs).

## [0.7.1] - 2026-10-19
### Fixed
- Game ship models, after the model doctor (all four now clean): AA mounts no longer stand inside the destroyer's bridge or overlap torpedo mounts, boats and the battleship's secondaries (they are placed where the whole mount fits, on deck or on a deckhouse roof); no flicker where deckhouses, funnels and torpedo mounts met the deck; no windlass under the forward turret; flagstaff out of the aft gun's line of fire; submarine sail nose flicker.
- Turret training arcs where the barrels reached the own bridge or a pedestal: destroyer A ±145°, cruiser B ±130°, battleship B ±135° and Y ±145°.
- `tools/e2e.py`: turning the camera toward the target now works at any optics zoom (the periscope torpedo check failed intermittently).
### Changed
- Model doctor: needle triangles of a single box (a wire) and of the hull's flat cap no longer count as slivers; golden file updated.

## [0.7.0] - 2026-10-19
### Added
- **Water Lab** (`labs/water.html`): ORP Błyskawica at 1:1 on a Gerstner sea. Two variants side by side (split screen with a divider): sea state presets from calm to gale and long swell or custom (wave height, wavelength, choppiness, spread, direction, wave count); looks (North Atlantic, Baltic grey, tropical, storm slate or custom colours, sun glitter, ripples, crest foam, reflection, planar reflection of the ship, translucent water); ship interaction (speed up to 39 kn, heave/pitch/roll, bow wave and Kelvin waves, wake foam, hull foam, wet band on the hull, bow spray). Seven cameras incl. the bridge riding with the ship; light and time controls; water mesh detail, per-pixel normals and render settings; "Measure the cost of each effect"; settings remembered and copyable as JSON. Docs: `docs/water.md`.
- **WaterKit** (`js/labs/waterkit.js`): sea-state wave sets, one Gerstner function in GLSL and JS, polar water grid, water shader, ship wake/bow-wave/foam, wet hull material hook.
- Main menu: links to the ship lab, the water lab and all labs (EN/PL); labs start screen tile and Ship Lab link for the water lab; sitemap entry.
- `tools/e2e.py` checks the menu's lab links; `tools/lab-check.py` also opens the water lab (split screen, every effect, presets, bridge camera).

## [0.6.0] - 2026-10-19
### Added
- **Model Doctor** (`labs/doctor.html`, `js/labs/modeldoctor.js`, `js/labs/doctor.js`): examines every lab ship and every game class model for 11 kinds of mistakes — nan, inside-out shapes, **gun lines of fire blocked by the own ship inside the training arc**, flicker (coplanar faces), floating pieces, pieces below the waterline, fittings through the hull side, over the in-game budget, hidden pieces, specks, needle triangles. Findings name the piece and the source line that added it; clicking one lights the pieces up (and trains the mount to the blocked bearing with the line of fire drawn). Check filter, touch tolerance, budget sliders, allow-list (`userData.doctorOk`), JSON report, test bench with one mistake per check. Ported from the Space repo's ModelDoctor and adapted to the game. Docs: `docs/doctor.md`.
- `tools/doctor.py`: headless doctor with golden fingerprints and finding counts (`tools/doctor.golden.json`, `--update`, `--shots`); fails when a check stops finding its test-bench mistake.
- ShipKit `KIT.unmerged`: one mesh per piece with its source line (for the doctor). Mounts carry their group and real training arcs.
- Labs start screen: Tools section with the Model Doctor; Ship Lab bar links to it.
### Fixed
- ORP Błyskawica after the doctor's analysis: ventilators out of A's and Y's lines of fire; B mount on a barbette so it clears A's roof; mount training arcs limited where the barrels would hit the ship; torpedo tubes 1 clear of the 40 mm platform; wheelhouse windows follow the rounded front; flicker removed (deck plates, house bases, tube rings, searchlight lenses, shield hatch, shelter window, 40 mm pedestal, doors).
- `tools/lab-check.py` restores the detail level before the screenshots and the thumbnail.

## [0.5.0] - 2026-10-19
### Added
- **Labs**: `labs.html` start screen and the **Ship Lab** (`labs/ship.html`) — a model workshop separate from the game.
- First model: **ORP Błyskawica as built in 1937**, reconstructed 1:1 (114 m × 11.26 m) from published figures: lofted hull with forecastle break, raked stem, boot-top and anti-fouling; A/X/Y twin and B single 120 mm Bofors mounts, two triple torpedo mounts, 40 mm and 13.2 mm AA, bridge with rangefinder and searchlight towers, raked funnel with cap, tripod foremast and mainmast with rigging, boats, rails, mine rails, depth-charge racks, propellers, rudder, ensign and stern name. Research sheet with sources: `docs/ships/blyskawica.md`.
- Viewer: orbit camera with presets, sea or dry dock, dimension labels, 10 m grid, wireframe, sun and exposure controls, part toggles, train/elevate the mounts and "Action stations", detail level, model stats.
- **ShipKit** (`js/shipkit/`): hull lofting from line functions, reusable fittings, per-material merged parts.
- `tools/lab-check.py`: headless lab check with screenshots (`--thumb` regenerates `assets/labs/ship.jpg`); labs in the sitemap.

## [0.4.2] - 2026-10-18
### Added
- `docs/HANDOFF.md`: context-recovery note for resuming work without the previous conversation (state, the owner's decisions, working preferences, workflow, gotchas, next steps, open questions); `CLAUDE.md` and the README point to it first.
- `tools/e2e.py`: headless end-to-end smoke test (fake clock; load, language, all four classes, gun camera + binoculars, salvo camera, periscope + torpedoes, deep dive, depth charges, results screen); screenshots to `tools/out/`.
- `tools/og-image.py`: regenerates the start-screen thumbnail.
- `.gitignore` for test output.
### Changed
- Documentation brought up to date: README (submarine, testing, tools), ARCHITECTURE (file map, controls, HUD, settings, cameras, islands, testing), TODO (done items removed, new ones), MULTIPLAYER (submarines and cameras), CLAUDE.md (test and handoff rules).

## [0.4.1] - 2026-10-18
### Added
- Social/search thumbnail `assets/og-image.jpg` (1200×630) of the start screen, and icons: `assets/icon.png` (512), `assets/apple-touch-icon.png` (180), `assets/favicon-32.png`.
- Web app manifest `site.webmanifest` (name, icons, colours, fullscreen landscape); CSP allows `manifest-src 'self'`.
### Changed
- SEO in English: new title and description, keywords, robots directives, Open Graph and Twitter cards with the thumbnail and alt text, richer JSON-LD `VideoGame` data (screenshot, genres, offer, repository), `noscript` text with a short description and the controls, sitemap with the image entry and a fresh date.

## [0.4.0] - 2026-10-18
### Added
- Binocular view for ships: in the gun camera at zoom ×1.5 and more the picture is seen through two overlapping round lenses (black mask, horizontal hairline with range ticks, short vertical mark, relative bearing), like the periscope but doubled. The gun camera now starts at ×2; zooming out to ×1 gives the wide view without the mask. Enemy labels show only inside the lenses.

## [0.3.0] - 2026-10-18
### Added
- **Gun camera (C)**: perspective view from above the turret that faces the view direction (front turret when looking forward of the beam, aft turret when looking aft), high enough to clear the superstructure. The mouse turns the view with pointer lock and the screen centre is the aim point; the wheel zooms like binoculars (×1–×8); C goes back to the isometric view. Esc (which releases the pointer) pauses. Without pointer lock the cursor still aims and right-drag turns the view.
- **Submarine** (fourth ship class): low profile, bow and stern torpedo tubes (4 torpedoes, 16 s, fired within 35° of the bow or stern), a small deck gun usable only on the surface.
  - Diving with **Z** (rise) / **X** (dive): surface, periscope depth and deep. Depth changes take time; speed drops under water.
  - Battery: drains at periscope depth and when deep, charges on the surface; a flat battery forces the boat up.
  - Shells cannot hit a boat below the surface, torpedoes cannot hit a deep one; diving puts fires out; deep boats pass under ships.
  - Detection: enemies see a submerged boat only within 55 u (periscope depth) or 26 u (deep); when they lose contact they search the last known position. Destroyers run over a detected boat and drop depth charges; cruisers and battleships turn away.
  - Under water the player's boat is drawn as a dark translucent silhouette; periscopes stay visible and leave a small feather of foam.
  - **Periscope view** (C) instead of binoculars: round view in a black mask, hairlines with range ticks, relative bearing readout, zoom ×1.5 by default; not available when deep.
- **Salvo camera**: picture-in-picture in the top-right corner that rides behind the newest shell of the player's salvo (or torpedo) and holds on the impact for a moment; rendered in the same look as the main view. Can be turned off in Options > Graphics. Renders through a second small post pipeline.
- Sky dome and closer fog for perspective views (gun camera, periscope, salvo camera, menu) so the horizon blends in.
- Graphics settings, applied immediately: presets **High** / **Light** (for weaker computers), render resolution (50–100%), effects density, shadows, anti-aliasing, glow, detailed water, salvo camera.
### Removed
- Alternative graphics styles (pixel art, comic, watercolour) and the style picker: the game is developed for the realistic look only. The pixel-art pipeline and style code are in the git history (v0.2.0).
### Changed
- Shadow map updates once per frame (the scene can be rendered twice).
- Kill feed moves below the salvo camera while it is shown; the main menu has four ship cards.
- The salvo camera picture is copied into its HUD frame, so it stays visible above the periscope mask; it shrinks to 200×113 on windows up to 900 px wide.

## [0.2.0] - 2026-10-18
### Added
- Graphics styles, chosen in Options > Graphics (the game restarts on change; `?style=real|pixel|toon|paint` in the URL overrides it for previews):
  - **Realistic (new default)**: full resolution with MSAA, PBR materials with procedural weathering and deck planks, ACES tone mapping, bloom on fire and muzzle flashes, soft shadows, soft billboard smoke and foam; ocean with noise ripples, Fresnel sky reflection, sun glint, light through crests, cloud shadows and broken whitecaps.
  - **Pixel art**: the original low-resolution filter (shared with Capital Quarantine).
  - **Comic (cel)**: banded toon lighting, ink outlines, flat stylised water with drawn wave lines and ripple rings around islands.
  - **Watercolour**: Kuwahara filter, sepia ink edges, pigment granulation, paper grain and a ragged paper border.
- More detail in the non-pixel styles: ship railings, AA mounts, lifeboats, masts with radar, bridge windows, funnel caps, bollards, flags, round gun barrels; islands with a denser wobbly outline, wet sand, cliffs on steep slopes, instanced trees with trunks, shoreline rocks and a lighthouse.
### Fixed
- Volume defaulted to 0% for new players (empty settings were read as 0); it is 60% again.
- Surf and shallows now follow the real island outline; ship–island collisions and shell impacts use the same outline.
- Foam is drawn above the highest wave crest in the detailed styles, so waves no longer cut it.

## [0.1.1] - 2026-10-13
### Changed
- English is now always the default interface language (no browser-language detection); Polish is chosen in Options > Language.
- Documentation rewritten in English following the Capital Quarantine layout: `README.md`, `docs/ARCHITECTURE.md`, `TODO.md` (priorities P1–P3), new `docs/MULTIPLAYER.md`, `CLAUDE.md` with standing rules.
### Added
- Versioning guard: `.githooks/pre-push` runs `tools/check-version.mjs` and blocks a push without a version bump.
- SEO basics: canonical URL, `robots.txt`, `sitemap.xml`.

## [0.1.0] - 2026-10-13
### Added
- First playable version: PvE naval battle against endless waves of AI ships, built on the pixel-art engine of Capital Quarantine (three.js, `PixelPipeline`, isometric orthographic camera, `h()` UI builder, i18n).
- Three ship classes: destroyer (fast, torpedoes), cruiser (all-rounder), battleship (slow, heavy guns, no torpedoes).
- Ship handling: 6-step engine telegraph (W/S), rudder with shift time (A/D), wave bobbing, roll in turns, grounding on islands.
- Main battery: turrets traverse at class speed inside firing arcs, ballistic shells with flight time and dispersion; islands block low trajectories. Citadel hits and fires.
- Torpedoes (key 2): spread from the broadside, fan indicator, torpedo warning when an enemy torpedo is on a collision course.
- Repair party (R): heals over 10 s and puts out fires; limited charges with cooldown.
- Enemy AI: closes to its preferred range, sails broadside, avoids islands, leads the player with guns and torpedoes; skill grows with each wave. Between waves: +25% HP and one repair charge back.
- Ocean shader (waves, crest foam, shallows and surf around islands), procedural islands with trees, wakes, funnel smoke, splashes, explosions, fires.
- HUD: wave/score, kill feed, banners, ship panel (HP, telegraph, rudder), weapon panel, crosshair with distance and shell flight time, enemy labels with HP bars, damage popups, minimap.
- Menu with ship selection, pause (Esc), results screen with best score, options (language EN/PL, pixel-art filter, volume, mouse). Procedural Web Audio sounds (M mutes).
