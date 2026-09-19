<!--
IMPLEMENTATION-HANDOFF [MZ09] A038
Coverage: O01-O08, I01-I09, R01-R12, T01-T17. Defects: D01-D14; B01-B04. Prerequisites: MZ01-MZ08.
Specifications/evidence: S01-S09 and root MEZCAL_IMPLEMENTATION_HANDOFF.md.
1. Treat existing production descriptions and August checkpoint numbers as historical documentation, not current runtime evidence. Current SSH authentication to the web/indexer hosts failed; obtain the approved deployment identity before claiming the running revision, queue, database or chain tip.
2. Resume the exact prepared worktrees and source-annotation index. Complete the dependency-ordered repair packages, preserve legitimate prior PR work and the original cold PostgreSQL recovery directory, and keep all secrets outside build inputs and handoff artifacts.
3. Execute the real application journeys on Signet, or a precisely justified supported Testnet. Require Bitcoin confirmation plus protocol-indexed state, durable worker/persistence readback, UI usability and reload/reconnect; component test counts are not end-to-end acceptance.
4. After every applicable required row passes, deploy the accepted revisions through the existing authorized production process in upstream/schema/indexer/API/frontend order with backups and executable rollback. Validate mainnet-specific configuration offline without mainnet functional transactions.
5. Publish actual deployed artifact/commit receipts, service health, fresh checkpoint/hash agreement and public index/trade/portfolio route exposure. Finish and merge legitimate release-related work only after gates; never claim source annotations, a plan, a merged PR or a historical release is the completed release.
Verification: Follow bundled RELEASE_AND_ROLLBACK.md; record public GET index/holders, authenticated authority readiness, deployed revisions and service receipts. Do not reset, deploy or merge in this preparation stage.
Preparation annotation only; no implemented or released functionality is claimed.
-->
# Mezcal

A cleaner pour for Bitcoin assets.

Mezcal brings Runes-inspired assets to Bitcoin through readable UTF-8 JSON placed directly after `OP_RETURN`. Etchings, mints, and output allocations come together in a format people can inspect and communities can rally around.

## Explore

- [Enter the Mezcal experience](https://bitcoinuniverse.github.io/mezcal/)
- [Visit Mezcal](https://mezcal.sh)
- [Discover Bitcoin Universe](https://github.com/bitcoinuniverse)

## Why it stands out

- **Readable by design.** The Mezcalstone is JSON, making the intent easier to inspect.
- **Bitcoin-native ownership.** Asset amounts are allocated to transaction outputs.
- **Made for expressive launches.** Etching, mint terms, edicts, and pointers shape how an asset enters the world and moves.

## Stay in control

Before signing, check the asset identity, amount, destination output, pointer, recipient, and miner fee. The final transaction shape determines allocation, and malformed details can invalidate the asset action even when the Bitcoin transaction itself confirms.

## Visual credit

The favicon and green, yellow, gold, and black visual cues displayed on the site celebrate the [official Mezcal experience](https://mezcal.sh). Mezcal names and artwork remain associated with their respective creators.
