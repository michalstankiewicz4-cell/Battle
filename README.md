# Steel Salvo (working title)

Naval battle browser game in pixel-art 3D — command a destroyer, cruiser or battleship against endless waves of AI warships. Built on the same engine as [Capital Quarantine](https://github.com/michalstankiewicz4-cell/VS): three.js (vendored), low-resolution render target with palette quantisation, Bayer dithering and depth outlines.

## Play locally
ES modules do not load from `file://`, so serve the folder:
```
py -m http.server 8000
```
and open <http://localhost:8000>.

## Controls
| Key | Action |
|---|---|
| W / S | Engine telegraph up / down (astern, stop, ¼, ½, ¾, full) |
| A / D | Rudder left / right (returns to centre when released) |
| Mouse | Aim (turrets traverse toward the cursor) |
| LMB | Fire selected weapon (hold to fire as turrets reload) |
| 1 / 2 | Main battery / torpedoes |
| R | Repair party (heals, puts out fires) |
| Q / E or RMB drag | Rotate camera |
| Wheel | Zoom |
| M | Mute |
| Esc | Pause |

Tips: lead moving targets — the crosshair shows distance and shell flight time. Islands block low shell arcs, so use them as cover. Watch for the torpedo warning and turn into or away from the spread.

## Docs
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — file map, systems, rules
- [`TODO.md`](TODO.md) — next steps (incl. multiplayer)
- [`CHANGELOG.md`](CHANGELOG.md)

## Licence notes
three.js r0.186.1 (MIT) in `vendor/` with checksum file.
