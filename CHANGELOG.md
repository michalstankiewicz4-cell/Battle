# Changelog

Versioning: `MAJOR.MINOR.PATCH`. Every push to the repository is a new version (number in `js/version.js` + an entry here).
The owner creates `vX.Y.Z` tags in GitHub Releases on commits from this history; pushing tags from a Claude session is blocked.
Bug fix = PATCH, new feature = MINOR, big change to gameplay or the save format = MAJOR.
Before every push run `node tools/check-version.mjs`; the `pre-push` hook in `.githooks/` runs it automatically (`git config core.hooksPath .githooks`).

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
