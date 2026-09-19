# Mezcal implementation handoff

Preparation only: executable behavior is unchanged. No functional repair, real test-network acceptance or public release is claimed.

Prepared repository: mezcal

Worktree: `D:/universe/mezcal/.worktrees/mezcal-20260919-0419`

Branch: `prep/mezcal-20260919-0419`

Original baseline: `f4d50adf7308e277ab290ac2b6b4c9f4836a5676`

Complete handoff directory: `D:/universe/core/audits/implementation-prep-mezcal-20260919-0419/core_HANDOFF_2026-09-19`

Open that directory/ZIP and read `IMPLEMENTATION_PROMPT.md`, `BASELINES.json`, `annotation-index.json`, `WORK_PACKAGES.md`, `SOURCE_REGISTER.json`, `BLOCKERS.json`, `coverage/MEZCAL_COVERAGE.json` and `RELEASE_AND_ROLLBACK.md`. The final BASELINES.json outside the repository records the exact preparation commit without a self-referential commit hash. Resume this isolated prepared worktree, not the concurrently modified original worktree.

This repository has 1 applied IMPLEMENTATION-HANDOFF markers. Follow their numbered local steps and shared work-package contracts. Foundation MZ05 -> MZ02 -> MZ01/MZ03 -> MZ04 -> MZ06 -> MZ05 wallet completion/MZ08 -> MZ07 -> MZ09. Source annotations are not executable placeholders or a substitute for implementation.

Verified defects include the public upstream 404, route/auth mismatch, sale actualPrice/totalPrice mismatch, post-spend registration using an unspent proof, missing durable pending intentions, incomplete inventory/PSBT proof and flex-mint rollback loss. Preserve existing checks, exact allocation corrections and legitimate concurrent PR work.

Runtime SSH authentication and real isolated Signet setup remain blocked; wallet-version research has targeted gaps. Full backend type checking reports five network-type errors in the unchanged Marketplace remote-composition test file. Review the already-concurrent related work before integration rather than replacing it. Targeted component tests are not end-to-end proof.

Implement and verify every required applicable row on real Signet, with exact justified Testnet only when supported dependency constraints require it. Then merge and publicly release the accepted Mainnet revisions using the authorized process. Mainnet functional test transactions are not required. GO requires both complete functional acceptance and actual public Mainnet release, not a plan or a build.
