---
phase: 18-venue-page-cleanup
plan: 02
subsystem: i18n
tags: [refactor, deletion, i18n, regression-tests]
requires: [18-01]
provides:
  - src/i18n/ui.ts with all 16 orphaned venue.prev.* keys removed (8 FR + 8 EN)
  - tests/build/venue-cleanup.test.ts extended with SC3 i18n-sweep assertion
affects:
  - src/i18n/ui.ts
  - tests/build/venue-cleanup.test.ts
tech_stack:
  added: []
  patterns: [source-level negative-match regex guard]
key_files:
  created: []
  modified:
    - src/i18n/ui.ts
    - tests/build/venue-cleanup.test.ts
  deleted: []
decisions:
  - "Single atomic commit covering both tasks (deletion + test) per PLAN success criterion #4."
metrics:
  duration_minutes: 3
  tasks_completed: 2
  files_modified: 2
  files_created: 0
  files_deleted: 0
  completed_date: 2026-04-14
commits:
  - hash: 2c21eb4
    message: "refactor(18-02): remove venue.prev.* i18n keys (FR + EN)"
requirements: [VENUE-03]
---

# Phase 18 Plan 02: Venue.prev i18n Sweep Summary

Closed Roadmap SC3 by deleting the 16 now-orphaned `venue.prev.*` translation keys from `src/i18n/ui.ts` (8 FR lines 136–143 + 8 EN lines 404–411) and extending the Phase 18 regression suite with an assertion that enforces zero `venue.prev` matches in the i18n table.

## Changes

- **`src/i18n/ui.ts`**: removed 16 lines — the complete FR and EN `venue.prev.*` blocks (rail_label, heading, video_title, participants, talks, partners, thumb_alt, gallery_link × 2 locales). Surrounding keys (`venue.around.food_body`, `schedule.heading`) are byte-identical. Minimal diff: 16 deletions, 0 insertions/reorders.
- **`tests/build/venue-cleanup.test.ts`**: removed the `TODO(18-02)` comment; added a new `describe("18-02 / SC3: src/i18n/ui.ts is free of venue.prev.* keys")` block with one `it` asserting `content.match(/venue\.prev/g) ?? []` has length 0. Suite grows from 10 → 11 tests, all green.

## Verification Evidence

- `grep -rn "venue\.prev" src/` → exit code 1 (zero hits). **Roadmap SC3 ✓**.
- `pnpm exec vitest run tests/build/venue-cleanup.test.ts` → **11/11 passed** in 103ms (post-build).
- `pnpm build` → green, **154 page(s) built in 4.60s**, no broken `t()` lookups, no orphaned asset warnings. **Roadmap SC5 re-verified ✓**.
- `git diff --stat src/i18n/ui.ts` → `1 file changed, 16 deletions(-)` (no whitespace/reorder noise).
- Single commit `2c21eb4` on `main` — separately-revertable per D-01.

## Deviations from Plan

None — plan executed exactly as written.

## Authentication Gates

None.

## Known Stubs

None.

## Threat Flags

None — pure deletion of unused i18n string literals. No network surface, auth path, or trust boundary changes.

## Next

Phase 18 complete (2/2 plans). All five roadmap success criteria for Phase 18 are now satisfied:
- SC1, SC2, SC5 → closed by 18-01
- SC3 → closed by 18-02 (this plan)
- SC4 → documented in 18-CONTEXT.md scouting (zero inbound refs, no redirect needed)

Ready for `/gsd-verify-work 18` to ratify the phase, then `/gsd-plan-phase 19` (or parallelize 19/20 since Phase 16 is already landed).

## Self-Check: PASSED

- `[ -f src/i18n/ui.ts ]` → FOUND
- `[ -f tests/build/venue-cleanup.test.ts ]` → FOUND
- `git log --oneline | grep 2c21eb4` → FOUND
- `grep -rn "venue\.prev" src/` → zero matches (SC3 ✓)
