# Handoff — resume work without the previous conversation

Read this first when picking the project up in a new session (or when the context was lost). It is the short version of
what the project is, what the owner decided, how work is done and what comes next. Details live in
[`ARCHITECTURE.md`](ARCHITECTURE.md); history in [`../CHANGELOG.md`](../CHANGELOG.md); plan in [`../TODO.md`](../TODO.md).

**Keep this file current:** when a decision is made, a feature lands or the next steps change, update the sections
below in the same push (it is part of every release, like the changelog).

## Snapshot (state as of v0.5.0, 2026-10-19)
- **What:** *Steel Salvo* (working title) — free naval battle browser game, PvE against endless waves of AI warships.
  Live: <https://michalstankiewicz4-cell.github.io/Battle/> · repo: <https://github.com/michalstankiewicz4-cell/Battle> (branch `main`,
  GitHub Pages deploys every push via `.github/workflows/static.yml`).
- **Tech:** plain ES modules, three.js r0.186.1 vendored in `vendor/`, no build step, no dependencies, no network.
  Strict CSP (`script-src 'self'`, `style-src 'self'`). UI built from JS with `h()`.
- **Playable:** 4 classes (destroyer, cruiser, battleship, submarine); ballistic gunnery with lead and dispersion; torpedoes;
  repair; fires and citadels; islands as cover; enemy AI with waves; gun camera with binoculars (C); submarine diving
  (Z/X), battery, periscope, depth charges; salvo camera (picture-in-picture); procedural sound; EN/PL UI; graphics
  settings with High/Light presets; SEO + thumbnail.
- **Labs (v0.5.0):** `labs.html` + `labs/ship.html` — model lab like the owner's *Space* repo labs. First model: ORP Błyskawica as built 1937, 1:1 from published figures (ShipKit in `js/shipkit/`, research sheet `docs/ships/blyskawica.md`). Positions are reconstructed from text sources (image hosts are blocked in the sandbox). The owner said the lab's **water will be dealt with later** — do not change it unasked.
- **Origin:** started from the engine of the owner's other game *Capital Quarantine* (repo `VS`), then diverged:
  the pixel-art pipeline was dropped, the look is now realistic only.

## Owner's decisions (do not reopen without being asked)
| Date | Decision |
|---|---|
| 2026-10-13 | Naval battle, PvE first ("something like a warship MMO", but no copied names/assets). Reuse the VS engine. |
| 2026-10-13 | Repo `Battle`, GitHub Pages. **Every push is a new version** (bump + changelog + check script). |
| 2026-10-13 | **English is the default language**, Polish only as an option in Options > Language. **All docs, code comments and UI source text in English.** |
| 2026-10-13 | Documentation follows the VS repo layout (README, ARCHITECTURE, TODO with P1–P3, MULTIPLAYER, CLAUDE.md, CHANGELOG). |
| 2026-10-18 | **Realistic graphics only.** Alternative styles (pixel, comic, watercolour) were tried and removed. Performance goes through settings (resolution, shadows, AA, glow, effects, water) and High/Light presets, not new styles. |
| 2026-10-18 | Gun camera on C ("view above the gun"), binoculars as a double round view; submarine with diving and a periscope instead of binoculars; salvo camera top-right. |
| 2026-10-18 | SEO and all metadata in English; start-screen thumbnail. |
| 2026-10-19 | Model lab ("like the Space labs"): detailed 1:1 real warships; first ORP Błyskawica (1937, the configuration known from warship games). Lab water: later. |

## How the owner works (preferences)
- Talks in **Polish, short messages**; reply in Polish, concisely, and say what was and was not verified.
- Iterative: small requests, frequent corrections mid-task. Do what was asked, nothing else ("change only what was asked").
- Wants changes **pushed straight to GitHub** once tested ("wyślij na gh"); state the version number in the reply.
- Develops on Windows (PowerShell, `py`), repos in `C:\Users\micha\vsrepos\`.
- Likes dark/atmospheric UI, self-contained code without CDNs.

## How to work in this repo
1. `git pull --rebase origin main` (the owner sometimes edits workflows on GitHub).
2. Make the change; keep the folder structure (file map in `ARCHITECTURE.md`); new UI strings in **both** `js/i18n/en.js` and `pl.js`.
3. Test: `py tools/e2e.py` (headless, ~10–20 min without a GPU; light graphics by default). For a new feature add a check there.
4. Bump `js/version.js` (PATCH fix, MINOR feature, MAJOR big change), add the `CHANGELOG.md` entry, update docs
   (`README.md` for players, `ARCHITECTURE.md` for code, `TODO.md`, **this file**), run `node tools/check-version.mjs`.
5. Commit (end the message with the Co-Authored-By line used in history) and push to `main`; wait for the Pages workflow
   (`gh run list -R michalstankiewicz4-cell/battle -L 1`). Do not push tags (the owner makes Releases).
6. If the start screen changed noticeably: `py tools/og-image.py` to refresh `assets/og-image.jpg`.

## Gotchas learned the hard way
- **Headless rendering is slow** (SwiftShader, ~1–5 s per frame at full settings). Drive time with the fake clock
  (`__step(n)` in the init script of `tools/e2e.py`), use a small viewport and light settings, and give screenshots a long
  timeout. Never rely on real time passing (`sleep`) — game time would advance only a little.
- Playwright `page.screenshot` needs the **real** `performance.now` and `requestAnimationFrame`: the fake clock queues only
  the callback named `frame` and must be switched off (`window.__fake=0`) before a screenshot.
- `pkill -f <pattern>` in a shell whose own command line contains the pattern kills that shell (exit 144). Kill by PID.
- Esc while the pointer is locked is consumed by the browser (it releases the lock); the game treats an unexpected lock
  loss in the gun camera as "pause".
- The salvo camera is drawn into the main canvas and **copied** into a DOM canvas in `#pip`, so HUD masks (periscope,
  binoculars) never cover it. Its size must match the CSS frame (`pipSize()` in `salvo-cam.js`).
- Shells and torpedoes use their own reach rules for submarines (`shellable()`, `torpable()` in `ships.js`); new weapons must
  respect them.
- Flat foam particles sit at y = 0.47, above the highest wave crest (the four waves sum to 0.45); lower and waves cut them.
- The island outline is wobbly (`wobble()`); the ocean shader, `isLand()` and `heightAt()` must keep using the same function.
- CSP forbids inline styles: set sizes via `el.style.*` (CSSOM), never `style=` attributes; no `innerHTML`.
- GitHub push from the Claude sandbox needs the Claude GitHub App on the repo; a 403 means access lapsed — ask the owner to
  reconnect GitHub in claude.ai settings (Connectors), do not work around it.
- Commits made from the Claude sandbox use `Claude <noreply@anthropic.com>` as author/committer (the sandbox flags other identities as unverified).

## Next steps (from TODO, highest first)
1. **P1** Balance on a real GPU (class HP, reloads, dispersion, AI skill curve, wave size); real-GPU performance check.
   Hint from `tools/e2e.py`: a destroyer or a surfaced submarine placed 0.7 km from wave 1 (two destroyers) sinks within ~15 s while hitting little — early AI is probably too accurate / too deadly at close range.
2. **P1** Spotting / detection for surface ships (concealment, minimap shows only spotted ships).
3. **P1** Graphics: shadow-map size option, automatic Light preset when FPS stays low.
4. **P2** Destroyer smoke screen, cruiser hydro/radar; AP/HE shells; module damage; smarter AI.
5. **P2** Enemy submarines, sonar ping; gun-camera lead indicator.
6. Owner tasks: Google Search Console + sitemap; `vX.Y.Z` tags in Releases.

## Open questions for the owner
- Final game name (currently "Steel Salvo", working title).
- Multiplayer: co-op PvE, PvP or both; P2P or server (see `MULTIPLAYER.md`).
- Should the gun camera keep the binoculars at ×1.5+ only, or always?
