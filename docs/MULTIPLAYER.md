# Multiplayer — plan and decisions

Status: **idea / not started** (as of v0.4.2). The game is single-player today, fully client-side (static hosting on GitHub Pages, no backend). The main menu lists "Multiplayer" as "Soon".

## Starting constraints
- Static hosting → no game server; networking needs either P2P (WebRTC) or an external relay/server.
- Privacy rule: **no network requests without explicit consent**; the CSP has `connect-src 'self'` today. Every network feature must be opt-in, change the CSP deliberately and be described in the README.
- The simulation uses `Math.random` (shell dispersion, AI decisions, wave spawns, fire/citadel rolls) — this must be seeded before synchronising.

## Options (simplest first)
| Option | Description | Pros | Cons |
|---|---|---|---|
| A. P2P co-op (WebRTC, authoritative host) | One player hosts, others connect over a DataChannel; manual signalling or a small relay | No game server, low cost | NAT/TURN may be needed, host = single point of failure, cheating |
| B. Light server (WebSocket relay / Cloudflare Durable Object) | Server relays messages or holds room state | Stable connections, room codes | Needs a backend, costs, CSP `connect-src` |
| C. Authoritative server (Node, server-side simulation) | Server computes ships, shells and AI; clients render | Cheat resistant, fair PvP | Most cost and work |
| D. Asynchronous (leaderboard) | Scores only | Cheapest | Not live multiplayer |

**Starting recommendation:** option A for 2–4 player co-op PvE; option C (or B) before PvP, because PvP needs server-side hit validation.

## What to prepare in code
1. **Separate simulation from rendering**: ships, shells and torpedoes are already plain objects (`js/world/ships.js`, `combat.js`), but meshes and effects are created alongside. Extract pure state and a `step(state, inputs, dt)` function.
2. **Deterministic RNG** (`mulberry32` from `js/core/util.js`) seeded per room; shells carry their seed so every client draws the same dispersion.
3. **Input as commands**: `{tick, thr, steer, aim, fire, weapon, repair}` — this is already the shape of `ctl` passed to `world.update()`.
4. **Several players**: `world.player` → an array; AI targets the nearest or most dangerous player; the camera follows the local ship.
5. **Message protocol** (versioned JSON): `hello`, `snapshot` (10–20 Hz: ship positions, headings, speed, HP, turret yaw), `input`, `event` (salvo fired with seed, torpedo launched, hit, sunk), `ping`. Validate every message.
6. **Shells as events**: send the salvo (origin, aim point, seed, time), not each shell; clients simulate the flight locally; the host decides hits.
7. **Interpolation**: local ship predicted, remote ships interpolated (~100 ms buffer). Ships are slow, so this is forgiving.
   **Fixed simulation step + render interpolation** (owner, 2026-10-21, for later): today the loop uses a variable
   delta time (capped at 50 ms) — fine for single player and high-refresh monitors. For multiplayer the simulation should
   run at a fixed tick (30 or 60 Hz, accumulator loop: `while (acc >= STEP) { step(state, inputs, STEP); acc -= STEP; }`)
   and rendering should draw the state interpolated between the last two ticks (`alpha = acc / STEP`: positions lerped,
   headings and turret angles slerped/shortest-angle). Same inputs + same seed → same result on every client (lockstep
   possible, replays, desync checks by state hash). It does not add frames or performance by itself (every frame is
   still rendered in full); image-based frame generation (reprojection) was considered and rejected for WebGL.
8. **Submarines**: sync `sub.level`, `sub.y` and `sub.batt`; detection (`DEPTHS[].detect`) must be decided by the host per viewer, and a hidden boat must not be sent to clients that cannot see it (otherwise PvP is trivially cheatable). Depth charges are events like salvos.
9. **Cameras**: the gun camera, periscope and salvo camera are local only (no sync needed); the salvo camera follows the local player's shells.

## Open questions (for the owner)
- Co-op PvE, PvP, or both? How many players?
- Shared score or per player? Respawn in co-op?
- External server/relay acceptable, or P2P only?
- Room codes only, or a public room list?

## Steps (proposed order)
1. Refactor: pure state and `step()` without three.js (no behaviour change; comparison test).
2. Seeded RNG + a "replay with seed" mode as a regression test.
3. Two local players (second ship, second control scheme) — checks the data model without a network.
4. Transport layer (`send/onmessage`) with an in-memory fake → then WebRTC.
5. Lobby: room code, connection, start; opt-in and a network notice in the menu.
6. Synchronisation: input → host, snapshots and events → clients.
7. Tests: two headless clients (Playwright) in one test, state comparison.
