# Changelog

Versioning: `MAJOR.MINOR.PATCH`. Every push to the repository is a new version (number in `js/version.js` + an entry here).
The owner creates `vX.Y.Z` tags in GitHub Releases on commits from this history; pushing tags from a Claude session is blocked.
Bug fix = PATCH, new feature = MINOR, big change to gameplay or the save format = MAJOR.
Before every push run `node tools/check-version.mjs`; the `pre-push` hook in `.githooks/` runs it automatically (`git config core.hooksPath .githooks`).

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
