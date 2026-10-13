# Steel Salvo

Naval battle at sea: command a destroyer, cruiser or battleship against waves of AI warships (PvE). Isometric view, low-resolution 3D with a pixel-art filter (three.js) — the same engine as [Capital Quarantine](https://github.com/michalstankiewicz4-cell/VS). Play: <https://michalstankiewicz4-cell.github.io/Battle/>

"Steel Salvo" is a working title.

Controls: W/S engine telegraph, A/D rudder, mouse aim, left mouse fire, 1 main battery, 2 torpedoes, R repair party, Q/E or right-mouse drag rotate the camera, wheel zoom, M mute, Esc pause.

**Documentation:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) (context and files) · [`TODO.md`](TODO.md) · [`docs/MULTIPLAYER.md`](docs/MULTIPLAYER.md) · [`CLAUDE.md`](CLAUDE.md) (assistant rules) · [`CHANGELOG.md`](CHANGELOG.md)

## Running locally
ES modules need a web server (they do not work from `file://`):
- VS Code: the *Live Server* extension → "Open with Live Server",
- or in the project folder: `py -m http.server 8000` and open `http://localhost:8000`.

## Menus and options
Start screen: ship selection (destroyer / cruiser / battleship with their stats), Set sail (PvE), Multiplayer (coming soon), Options. Esc pauses a battle (it never ends it); in menus Esc goes back. Options: Language (English by default, Polski available), Graphics (pixel-art filter, FPS counter), Audio, Mouse. Settings are saved locally in the browser.

## How to play
- **Ships:** the destroyer is fast and carries torpedoes; the cruiser is an all-rounder with quick-firing guns; the battleship is slow and tough with devastating salvos and no torpedoes.
- **Guns:** turrets turn toward the cursor at the class traverse speed and only inside their firing arcs. Shells fly for a few seconds, so lead moving targets — the crosshair shows the distance and the shell flight time. Low trajectories hit islands, so islands are cover.
- **Torpedoes:** fired as a spread from the broadside; the fan on the water turns green when the tubes bear. A red warning appears when an enemy torpedo is heading for you.
- **Repair party:** heals over 10 s and puts out fires; limited charges with a cooldown.
- **Waves:** each wave is larger and the AI aims better. After a wave you get +25% HP and one repair charge back. Score = damage dealt + a bonus per ship sunk.

## Structure
- `js/main.js` – entry point; `js/core/` – app shell and mode state machine, camera rig, settings, storage, procedural sound,
- `js/world/` – ocean, islands, ship models and entities, shells and torpedoes, enemy AI, particle effects, wave director,
- `js/render/` – pixel-art pipeline (low-res target + final shader), shared with Capital Quarantine,
- `js/input/` – keyboard and mouse,
- `js/i18n/` – English (default) and Polish strings,
- `js/ui/` – menus, options and HUD,
- `vendor/` – three.js 0.186.1 (MIT) vendored locally; SHA-256 sums in `vendor/SHA256.txt`.

## Security and privacy
- no external scripts, CDNs or network requests; the CSP in `index.html` only allows resources from the same origin,
- no `eval`, no `innerHTML`, no inline styles (styles are set through CSSOM),
- nothing leaves the browser; only settings and the best score are stored in `localStorage`.

## Versioning
The version lives in `js/version.js` (shown in the main menu and the FPS counter), history in `CHANGELOG.md`; every push is a new version (the owner creates `vX.Y.Z` tags in GitHub Releases).
Before every push: bump the version, add a changelog entry and run `node tools/check-version.mjs`.

## SEO
Tags in `index.html`, `robots.txt`, `sitemap.xml`. A thumbnail (`assets/og-image.png`) is still to do. After deployment add the site in Google Search Console ("URL prefix" type) and submit the sitemap.
