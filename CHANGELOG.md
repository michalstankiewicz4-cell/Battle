# Changelog

Versioning: `MAJOR.MINOR.PATCH`. Every push to the repository is a new version (number in `js/version.js` + an entry here).
The owner creates `vX.Y.Z` tags in GitHub Releases on commits from this history; pushing tags from a Claude session is blocked.
Bug fix = PATCH, new feature = MINOR, big change to gameplay or the save format = MAJOR.
Before every push run `node tools/check-version.mjs`; the `pre-push` hook in `.githooks/` runs it automatically (`git config core.hooksPath .githooks`).

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
