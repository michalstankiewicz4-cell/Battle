# Changelog

Versioning: `MAJOR.MINOR.PATCH`. Every push is a new version (number in `js/version.js` + an entry here). Bug fix = PATCH, new feature = MINOR, big gameplay/save change = MAJOR.

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
