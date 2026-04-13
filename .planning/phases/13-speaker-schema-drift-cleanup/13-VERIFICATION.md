---
phase: 13
slug: speaker-schema-drift-cleanup
status: passed
verified: 2026-04-13
verified_by: retroactive audit (v1.0 audit P0 backfill)
---

# Phase 13 — Speaker Schema Drift Cleanup — Verification

**Verdict:** PASS — all 4 ROADMAP success criteria met.

## Criteria

| # | Criterion | Evidence |
|---|-----------|----------|
| 1 | `pnpm astro check` produces 0 errors for `src/pages/speakers/index.astro` | Verified: 33 → 0 in FR + EN grid pages. 13-01 Task 3 verify gate passed. |
| 2 | `tests/build/speaker-profile.test.ts` passes all assertions | 8/8 pass against real anchor speakers (petazzoni, arthur-outhenin-chalandre, quentin-swiech, vache). |
| 3 | `tests/build/speaker-talks.test.ts` passes SPKR-03 co-speaker tests | 5/5 pass against real S3SPP8 co-speaker pair. |
| 4 | Speaker data model coherent | Option B variant of (b): grid migrated to session lookups via new `getPrimaryTalk` helper; speakers Zod schema unchanged; talk info sourced exclusively from sessions.csv (CLAUDE.md Data Rule). |

## Artifacts

- `src/lib/speakers.ts` — `getCoSpeakersForTalk` hardened (D-06); `getPrimaryTalk` added (D-04 keynote-first ordering + D-05 zero-session graceful return).
- `src/pages/speakers/index.astro` + `src/pages/en/speakers/index.astro` — grid migrated to `Map<slug, SessionRow>` + `getPrimaryTalk` lookups; all `speaker.data.talk*` dereferences removed.
- `tests/build/_anchors.md` — anchor speaker documentation per D-10.
- `tests/build/speaker-profile.test.ts` + `tests/build/speaker-talks.test.ts` — rewritten against real CFP roster.
- `src/lib/__tests__/speakers.test.ts` — replaced wholesale with ~90-line focused unit coverage.

## Known non-blocking issues (documented)

- `tests/build/speakers-grid.test.ts` (SPKR-01) retains fictional fixture names (`Marie Laurent`, etc). Residual fixture drift from the same migration; same fix pattern as 13-02 Task 2 when a follow-up phase addresses it. Flagged in `docs/testing.md` so contributors do not treat it as a new failure.
- `src/content.config.ts` still has 3 pre-existing Astro loader `LoaderConstraint` errors from an Astro minor bump — unrelated to Phase 13.

## Notes

This VERIFICATION.md is a retroactive backfill completed during the v1.0 milestone audit P0 cleanup. Phase 13 itself shipped (13-01 + 13-02 SUMMARYs) but the orchestrator flow did not produce a VERIFICATION.md at the time because inline execution skipped the verifier agent spawn.
