# Guidance for the assistant (Claude Code) working in this repo

Project: browser game "Steel Salvo" (working title) — naval battle, PvE first (three.js, realistic look). Started from the engine of Capital Quarantine (repo VS). Full context: `docs/ARCHITECTURE.md`; plan: `TODO.md`, `docs/MULTIPLAYER.md`.

## Standing rules (from the owner)
- **Every push = a new version**: bump `js/version.js`, add an entry at the top of `CHANGELOG.md`, run `node tools/check-version.mjs`, then push to `main`; state the version number in your reply.
- **Do not push tags** (the owner creates tags in Releases).
- No external scripts/CDNs; CSP `script-src 'self'`, `style-src 'self'` (set styles via CSSOM, never `style=` attributes or `innerHTML`). three.js only locally from `vendor/`.
- **Graphics: realistic look only.** Do not add alternative visual styles; performance and taste go through graphics settings (resolution, shadows, anti-aliasing, glow, effects, water detail) and the High/Light presets.
- Change only what was asked.
- Reply to the owner in Polish, concisely; say what was and was not verified. Everything in the repo (UI, code comments, docs) is in English; **English is the default UI language**, Polish exists only as the optional interface language in `js/i18n/pl.js` (Options > Language).
- Keep the module/folder structure (see the file map in `docs/ARCHITECTURE.md`); put new UI strings in both `js/i18n/en.js` and `pl.js`.
- Avoid names and assets of existing games.

## Practice
- The remote `main` may be ahead (workflow changes): `git pull --rebase origin main`.
- Headless tests: see "Testing" in `docs/ARCHITECTURE.md` (Playwright + SwiftShader).
