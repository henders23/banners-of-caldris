# Banners of Caldris

**War for the Realm** is a single-player medieval campaign strategy game inspired by the territorial clarity of classic Risk. Command the Royal Lions across a 32-territory war table, build armies of infantry, archers, and cavalry, secure regional collections, and break three rival houses.

The game is designed for the browser with a direct Three.js war table and battle diorama. Devices without WebGL receive a complete illustrated command map and battlefield rather than a broken or reduced-control screen.

## Play

- [Live game](https://banners-of-caldris.paulhendrie.chatgpt.site)
- [Live forge ledger](https://banners-of-caldris.paulhendrie.chatgpt.site/progress)

## Core rules

Every turn opens with a named **omen** that changes the terms of that turn alone — extra muster points, free sellswords, blessed attacks, or rival houses recruiting harder. Then the turn runs in three steps:

1. **Muster** — gain `max(3, floor(territories / 3))` points plus bonuses from complete territorial collections, then place companies by clicking your own lands on the map. Infantry cost 1; archers and cavalry cost 2. Optionally seal one Royal Command: extra levies, a cavalry-led opening assault, or an archer-led defence.
2. **Conquer** — attack an adjacent enemy with up to three units while leaving one unit behind. Defenders roll up to two dice and win ties. Cavalry gain +1 while attacking; archers gain +1 while defending.
3. **Final movement** — once per turn, move any mix of units between connected friendly territories, leaving one unit behind.

**Momentum** rewards pressing an advantage: every territory captured in a turn lights the momentum meter, which adds +1 to your strongest attacking die for the rest of the turn and carries up to three points into the next muster.

Each chapter has its own victory condition, from securing two regions to breaking a rival house outright. Campaign progress and the current battle state persist locally in the browser.

## Campaign

The twelve-chapter story follows the exiled King Aldren Caerlyn's return from the Vale of Stoneford to Crownspire. Every chapter has its own connected 32-territory topology, route network and chokepoints, deployment, regional naming and palette, threat level, and mechanical field rule:

1. The Vale of Stoneford
2. The Amber Coast
3. The Fenward
4. The Ironspine
5. The Greenwood
6. The Red Plains
7. The Lakelands
8. The Border March
9. The Frostlands
10. The Broken Duchies
11. The King's Road
12. Crownspire

Locked fronts can be opened as **battlefield-intelligence skirmishes** from the campaign atlas. These previews use the chapter's real bordered political map, persistent territory labels, setup, rule, and AI pressure, but never overwrite the active campaign save or unlock progression. Sequential victories carry forward as bounded veteran units and periodic muster bonuses.

The in-game `/progress` ledger is the source of truth for which systems and chapters have completed adversarial play review.

## Local development

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. To run the production build plus all deterministic engine and UI tests:

```bash
npm test
```

## Deployment

The project builds for two hosts:

- **ChatGPT Sites / Cloudflare Workers** (`npm run build`) — runs `vinext build` through `scripts/build-verified.sh`, producing the `dist/` Worker bundle used by `worker/index.ts`.
- **Vercel** (`next build`) — `vercel.json` pins the build command so Vercel produces a standard `.next` output instead of the Worker bundle. The Vercel build never touches the Cloudflare-only sources (`worker/`, `db/`, `examples/`), which are excluded from `tsconfig.json`.

The shell scripts under `scripts/` must stay executable in git (mode `100755`); CI hosts execute them directly and a non-executable mode fails the build with exit code 126.

## Architecture

- `lib/game.ts` — deterministic campaign state, topology, combat, muster, momentum, omens, fortification, and rival AI
- `components/three-board.tsx` — interactive Three.js war table plus illustrated fallback
- `components/battle-diorama.tsx` — Three.js battle theatre plus illustrated fallback
- `components/game-shell.tsx` — title, campaign, council, board, save flow, rulebook, and reports. The board shows only what the current step needs; the objective, scout predictions and map layers live behind the war-room toggle.
- `tests/game-engine.test.mjs` — topology, orders, deterministic battle, fortification, and AI-report invariants

All gameplay randomness is seeded, so combat transcripts can be reproduced in tests and save files. Automated coverage also verifies that all twelve route graphs are distinct, connected and symmetric; field rules affect engine decisions; momentum and omens change real combat and muster arithmetic on the royal side only; and intelligence skirmishes cannot advance or overwrite the campaign.

## Accessibility and resilience

- Every territory is a labelled native button in fallback mode, and every territory carries a permanent name label in both modes.
- During muster, every land you can reinforce is ringed and marked with a `+`; one click places a company there.
- Critical information is repeated through icon, text, and colour.
- Reduced motion follows the operating-system preference and can be changed in the campaign menu.
- A WebGL failure automatically switches to an illustrated board without losing controls.

## Status

This repository contains the playable campaign build and its live evaluation ledger. The project deliberately distinguishes “implemented” from “fully audited”; see `/progress` for the current quality review and next largest gap.
