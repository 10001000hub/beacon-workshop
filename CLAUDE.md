# CLAUDE.md

Read `AGENTS.md` first — it holds the commands, layout, invariants and git rules for this repo. Then `docs/HANDOFF.md` for the current state and next action.

Short version:
- Spec `docs/PRODUCT_SPEC.md` is canonical; do not edit it.
- Verify with `npm run check` before claiming anything; record results in `docs/VERIFY.md` honestly (NOT RUN is never PASS).
- Keep grading deterministic, storage limited to the two `beacon-workshop.*` keys, rendering textContent-only, and the app free of network/AI calls.
- No push, remote, deploy, merge or license change without the owner.
- Reply to the owner in Japanese.
