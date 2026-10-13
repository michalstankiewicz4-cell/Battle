# Guidance for the assistant working in this repo

Project: browser naval battle game "Steel Salvo" (working title), PvE for now. Engine shared with Capital Quarantine (repo VS): three.js from `vendor/`, `js/render/pixel-pipeline.js`, `js/ui/dom.js`, `js/i18n/index.js`, `js/core/util.js`. Full context: `docs/ARCHITECTURE.md`; plan: `TODO.md`.

## Standing rules (same as the land game)
- Every push = a new version: bump `js/version.js`, add an entry at the top of `CHANGELOG.md`, run `node tools/check-version.mjs`.
- No external scripts/CDNs; CSP `script-src 'self'`, `style-src 'self'` (set styles via CSSOM, never `style=` attributes or `innerHTML`).
- Reply to the owner in Polish, concisely. Everything in the repo (UI, comments, docs) is in English; Polish only as the optional UI language in `js/i18n/pl.js`.
- Put new UI strings in both `js/i18n/en.js` and `pl.js`.
- Avoid names of existing games; no copied assets.
- Headless tests: Playwright + SwiftShader (see `docs/ARCHITECTURE.md`).
