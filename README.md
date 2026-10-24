# Steel Salvo

> **Inspiration for the sea:** [Open Water](https://github.com/Leonxlnx/open-water) by Leonxlnx (MIT) — a physically based WebGL2 ocean. Ideas taken from it (written anew here, not copied): foam with memory in two stages (active breaking and residual lace), whitecap coverage calibrated to Monahan & O'Muircheartaigh, and the next steps on the list (sun glitter as sparkles, FFT waves, cloud shadows and rain cells, AgX tone mapping).

Naval battle at sea: command a destroyer, cruiser, battleship or submarine against waves of AI warships (PvE). Isometric view with a gun camera and periscope, realistic 3D (three.js, PBR materials, procedural water). Started from the engine of [Capital Quarantine](https://github.com/michalstankiewicz4-cell/VS). Play: <https://michalstankiewicz4-cell.github.io/Battle/>

"Steel Salvo" is a working title.

Controls: W/S engine telegraph, A/D rudder, mouse aim, left mouse fire, 1 main battery, 2 torpedoes, R repair party, C gun camera (periscope on a submarine), Z/X rise/dive (submarine), Q/E or right-mouse drag rotate the camera, wheel zoom, M mute, Esc pause.

**Documentation:** [`docs/HANDOFF.md`](docs/HANDOFF.md) (start here when resuming work) · [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) (context and files) · [`TODO.md`](TODO.md) · [`docs/MULTIPLAYER.md`](docs/MULTIPLAYER.md) · [`CLAUDE.md`](CLAUDE.md) (assistant rules) · [`CHANGELOG.md`](CHANGELOG.md)

## Running locally
ES modules need a web server (they do not work from `file://`):
- VS Code: the *Live Server* extension → "Open with Live Server",
- or in the project folder: `py -m http.server 8000` and open `http://localhost:8000`.

## Menus and options
Start screen: ship selection (destroyer / cruiser / battleship / submarine with their stats), Set sail (PvE), Multiplayer (coming soon), Options. Esc pauses a battle (it never ends it); in menus Esc goes back. Options: Language (English by default, Polski available), Graphics (presets High / Light, render resolution, effects density, brightness, colour saturation, shadows, anti-aliasing, glow, detailed water, salvo camera, FPS counter — all apply immediately), Audio, Mouse. Settings are saved locally in the browser.

## How to play
- **Ships:** the destroyer is fast and carries torpedoes; the cruiser is an all-rounder with quick-firing guns; the battleship is slow and tough with devastating salvos and no torpedoes; the submarine hides under water and attacks with bow and stern torpedoes.
- **Guns:** turrets turn toward the cursor at the class traverse speed and only inside their firing arcs. Shells fly for a few seconds, so lead moving targets — the crosshair shows the distance and the shell flight time. Low trajectories hit islands, so islands are cover.
- **Torpedoes:** fired as a spread from the broadside; the fan on the water turns green when the tubes bear. A red warning appears when an enemy torpedo is heading for you.
- **Repair party:** heals over 10 s and puts out fires; limited charges with a cooldown.
- **Gun camera (C):** a view from above your turret through binoculars; the mouse turns it (the screen centre is the aim point), the wheel zooms (×1 = wide view without binoculars). Click into the game if the mouse does not turn the view.
- **Salvo camera:** a small view in the top-right corner follows your newest shell (or torpedo) to the target.
- **Submarine:** Z rises, X dives (surface → periscope depth → deep). Shells cannot reach you below the surface and torpedoes cannot reach you deep, but the battery runs down under water and destroyers drop depth charges when they find you. Torpedoes fire from the bow and stern; the deck gun only works on the surface. C gives the periscope (not when deep).
- **Waves:** each wave is larger and the AI aims better. After a wave you get +25% HP and one repair charge back. Score = damage dealt + a bonus per ship sunk.

## Labs
How to use them: [`docs/GUIDE.md`](docs/GUIDE.md).
Five areas — models, environment, graphics and filters, special effects, tools — mapped in `docs/labs.md`.
[`labs.html`](https://michalstankiewicz4-cell.github.io/Battle/labs.html) — model workshop: detailed 1:1 reconstructions of real warships built from code. **ORP Błyskawica (1937)** and the submarine **ORP Orzeł (1939)** in the [Ship Lab](https://michalstankiewicz4-cell.github.io/Battle/labs/ship.html) (orbit, presets, dimensions, part toggles, trainable mounts, a signal lamp keying Morse with its shutters, diving to periscope depth with the 40 mm retracting into its well, the pressure hull inside, sources). Research: `docs/ships/`. The [Water Lab](https://michalstankiewicz4-cell.github.io/Battle/labs/water.html) compares variants of the sea and its interaction with the ship (and water bodies: ocean, fjord, lake, river with a current) (sea states, reflections, foam, bow wave, wake, spray, ship motion) side by side — see `docs/water.md`. The [Transformer](https://michalstankiewicz4-cell.github.io/Battle/labs/transform.html) makes the lab ship game-ready — three levels of detail, 458 hitboxes for procedural destruction, damage in the shader, fleet test — see `docs/transform.md`. The [Land Lab](https://michalstankiewicz4-cell.github.io/Battle/labs/land.html) generates land and sea from a seed — 0 to 100 % land, islands, archipelagos, coasts, fjords, highlands with erosion, beaches and surf — on a wrap-around map (sail out one side, in at the other) or one bounded by buoys, mountains or a wall, mixes water bodies by region (a river mouth with its plume, a lake and canal, a fjord over its sill, a harbour bay behind a spit, an ice edge, or rivers, lakes and fjords from the seed) with seamless transitions and currents, shapes the land by biome (northern, plains with fields, desert with dunes and mesas, or zones of all three), and lets you sail ORP Błyskawica through it — see `docs/land.md`. The [Waterside Structures Lab](https://michalstankiewicz4-cell.github.io/Battle/labs/structures.html) builds static structures in the water at real scale — a jack-up drilling rig (Super 300 class) that jacks up and down in any water depth, quay walls (with ORP Błyskawica alongside) and breakwaters of rock, tetrapods or caissons — see `docs/structures.md`. The [Plants Lab](https://michalstankiewicz4-cell.github.io/Battle/labs/plants.html) grows trees, palms, shrubs and grass from code — spruce, pine, birch, oak, date palm, acacia, juniper, saltbush — moving in the wind, with autumn colours, impostors far away and forests, copses and oases placed by biome — see `docs/plants.md`. The [Look Lab](https://michalstankiewicz4-cell.github.io/Battle/labs/look.html) tries the photoreal side: procedural ageing by surface (rust streaks, chipped paint, salt, greyed wood, patina), a cloudy sky with seven weathers (rain, squalls and sea fog included) that also set the sea, time of day from dawn to a moonlit night, lightning, navigation lights, gun flashes, an SOS by searchlight, and a camera look from clean to cinematic and bodycam, each effect switchable and compared side by side — see `docs/look.md`. The [Model Doctor](https://michalstankiewicz4-cell.github.io/Battle/labs/doctor.html) examines every lab and game ship for repeating model mistakes (inside-out shapes, flicker, floating pieces, guns firing into their own ship, fittings through the hull, over budget) — see `docs/doctor.md`.

## Testing
## Pixel Studio
A separate pixel-art project in this repo, not part of the game: [Pixel Studio](https://michalstankiewicz4-cell.github.io/Battle/pixel/) — pixel art from 3D models, generators, a pixel editor and the hybrid of the three, checked by a Pixel Doctor, exported as PNG or GIF with a transparent background. See `docs/pixel.md`; check: `py tools/pixel-check.py`. Inside it, the [Zombie Generator](https://michalstankiewicz4-cell.github.io/Battle/pixel/zombies.html) makes original zombies as Unity sprite sheets (realistic or pixel art) — `docs/zombies.md`.

`py tools/e2e.py` runs a headless smoke test of the whole game (needs `pip install playwright` and `playwright install chromium`); `py tools/og-image.py` regenerates the thumbnail; `py tools/lab-check.py` checks the labs; `py tools/doctor.py` runs the model doctor against `tools/doctor.golden.json`. Details: "Testing" in `docs/ARCHITECTURE.md`.

## Structure
- `js/main.js` – entry point; `js/core/` – app shell and mode state machine, camera rig, settings, storage, procedural sound,
- `js/world/` – ocean, islands, ship models and entities, shells and torpedoes, enemy AI, particle effects, wave director,
- `js/render/` – materials and procedural textures (`materials.js`) and the post-process (`post.js`: bloom, tone mapping),
- `js/input/` – keyboard and mouse,
- `js/i18n/` – English (default) and Polish strings,
- `js/ui/` – menus, options and HUD,
- `labs.html`, `labs/`, `js/labs/`, `css/lab.css` – the labs (one controller per page; how to use them: `docs/GUIDE.md`),
- `js/shipkit/` – ships from code, transformer, ageing, lights; `js/env/` – sky, weather, sea and land kits; `js/tools/` – model doctor,
- `pixel/`, `js/pixel/`, `css/pixel.css` – Pixel Studio (separate pixel-art project, not part of the game; `docs/pixel.md`),
- `tools/` – version check, lab check, end-to-end test, thumbnail generator; `assets/` – thumbnail and icons,
- `vendor/` – three.js 0.186.1 (MIT) vendored locally; SHA-256 sums in `vendor/SHA256.txt`.

## Security and privacy
- no external scripts, CDNs or network requests; the CSP in `index.html` only allows resources from the same origin,
- no `eval`, no `innerHTML`, no inline styles (styles are set through CSSOM),
- nothing leaves the browser; only settings and the best score are stored in `localStorage`.

## Versioning
The version lives in `js/version.js` (shown in the main menu and the FPS counter), history in `CHANGELOG.md`; every push is a new version (the owner creates `vX.Y.Z` tags in GitHub Releases).
Before every push: bump the version, add a changelog entry and run `node tools/check-version.mjs`.

## SEO
Everything in English: title, description, keywords, Open Graph / Twitter cards and JSON-LD (`VideoGame`) in `index.html`; thumbnail `assets/og-image.jpg` (1200×630, start screen); icons in `assets/`; `site.webmanifest`; `robots.txt`; `sitemap.xml` (with the image). After deployment add the site in Google Search Console ("URL prefix" type) and submit the sitemap. When the start screen changes noticeably, regenerate the thumbnail (see "Testing" in `docs/ARCHITECTURE.md`).
