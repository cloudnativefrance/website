---
phase: 18-venue-page-cleanup
plan: 01
subsystem: venue-page
tags: [refactor, deletion, venue, locale-parity, regression-tests]
requires: [17-03, 17-04]
provides:
  - FR venue page without the previous-edition block and without 4 orphaned imports + 4 orphaned locals
  - EN venue page with identical cleanup (locale parity)
  - tests/build/venue-cleanup.test.ts regression suite (10 assertions, all green)
affects:
  - src/pages/venue/index.astro
  - src/pages/en/venue/index.astro
  - tests/build/venue-cleanup.test.ts (new)
  - tests/build/venue-block-unchanged.test.ts (deleted — obsolete Phase 17 guard)
tech_stack:
  added: []
  patterns: [dist-level regex grep, source-level negative-match guard]
key_files:
  created:
    - tests/build/venue-cleanup.test.ts
  modified:
    - src/pages/venue/index.astro
    - src/pages/en/venue/index.astro
  deleted:
    - tests/build/venue-block-unchanged.test.ts
decisions:
  - "Deleted the Phase 17 guard test `venue-block-unchanged.test.ts` as part of this plan (Rule 3 — blocking): its whole purpose was to assert the block we just deleted."
  - "Added deferred-items.md to track pre-existing unrelated failures (speakers-grid tests, content.config.ts tsc errors) so 18-02 isn't distracted by them."
metrics:
  duration_minutes: 7
  tasks_completed: 3
  files_modified: 2
  files_created: 1
  files_deleted: 1
  completed_date: 2026-04-14
commits:
  - hash: 42ee04f
    message: "refactor(18-01): delete previous-edition 2026 block from venue pages + orphan cleanup"
requirements: [VENUE-01, VENUE-02, VENUE-04]
---

# Phase 18 Plan 01: Venue Previous-Edition Block Deletion Summary

Removed the relocated "Previous edition 2026" block from both `src/pages/venue/index.astro` (FR) and `src/pages/en/venue/index.astro` (EN) plus all orphaned imports/locals, and replaced the Phase 17 byte-identity guard test with a Phase 18 regression suite. Content ownership is now unambiguous: homepage owns past editions, venue owns venue.

## Changes

- **`src/pages/venue/index.astro`**: dropped `EDITION_2026` import, three `ambiance-03/06/10` photo imports, `YOUTUBE_ID` / `GALLERY_URL` / `previousStats` / `thumbnails` frontmatter locals, the stale "Labels stay on..." comment, and the 68-line `<!-- 6. Previous edition replay -->` `<section>`. Page now ends cleanly on the neighborhood section (`venue.around.food_body`). No filler content added (D-02).
- **`src/pages/en/venue/index.astro`**: mirror cleanup — removed the 3 ambiance imports, the hardcoded `YOUTUBE_ID` / `GALLERY_URL` constants, `previousStats` / `thumbnails` locals, and the equivalent `<section>` block.
- **`tests/build/venue-cleanup.test.ts` (new)**: Vitest suite encoding all D-03 source-level and dist-level regression assertions (minus the `venue.prev` i18n assertion deferred to 18-02 via TODO comment). Groups 2 source-level checks (zero orphan-symbol matches on each venue source file) and 8 dist-level checks (4 patterns × 2 locales: `1700+`, `youtube-nocookie`, `youtube.com/embed`, `CND France 2026`). 10/10 green.
- **`tests/build/venue-block-unchanged.test.ts` (deleted)**: obsolete Phase 17 guard — it asserted the now-deleted block was still rendered byte-identical. Removing it is a mechanical consequence of deletion, not a scope creep.

## Verification Evidence

- `grep -nE "EDITION_2026|ambiance03|ambiance06|ambiance10|YOUTUBE_ID|GALLERY_URL|previousStats|thumbnails|venue\.prev" src/pages/venue/index.astro src/pages/en/venue/index.astro` → exit 1 (zero hits). Roadmap SC2 half #1 ✓.
- `pnpm build` → green, **154 page(s) built in 6.09s**, no orphaned asset warnings, no broken `t()` calls. Roadmap SC5 ✓.
- `pnpm exec vitest run tests/build/venue-cleanup.test.ts` → **10/10 passed** in 107ms.
- Roadmap SC3 (`venue.prev` i18n sweep) intentionally deferred to 18-02 per D-01.
- Roadmap SC4 (anchor audit) documented in 18-CONTEXT.md scouting (zero inbound references to `#previous-edition`; no redirect needed).

## Deviations from Plan

### Rule 3 – Blocking: removed obsolete guard test
**Found during:** Task 3 test-suite authoring
**Issue:** `tests/build/venue-block-unchanged.test.ts` (Phase 17 / D-12 artifact) asserts the legacy venue 2026 block still renders byte-identical. Deleting the block causes all 4 of its `it` cases to fail at the next `pnpm test` run — `pnpm build` stays green but the test suite does not.
**Fix:** Deleted the file as part of this commit. The test's entire purpose was to gate Phase 17 → Phase 18; now that 18-01 ships, it is a dead gate. The new `venue-cleanup.test.ts` replaces it with the inverse guarantee (block stays deleted).
**Files modified:** `tests/build/venue-block-unchanged.test.ts` (deleted)
**Commit:** 42ee04f

### Rule 4 would-be ask: `pnpm exec tsc --noEmit` has pre-existing errors
**Found during:** Task 3 verification
**Issue:** `tsc --noEmit` emits `TS5101` (baseUrl deprecation) and 2 `TS2322` errors in `src/content.config.ts` lines 110/127. Both present on HEAD before 18-01 started (verified via `git stash`).
**Resolution:** Scope Boundary — out of scope for a venue-page deletion plan. Logged to `.planning/phases/18-venue-page-cleanup/deferred-items.md`. Astro's own build pipeline (`pnpm build`) completes green, which is what actually ships.
**Files modified:** `.planning/phases/18-venue-page-cleanup/deferred-items.md` (new)

### Rule 4 would-be ask: 5 pre-existing failures in `tests/build/speakers-grid.test.ts`
**Found during:** full `pnpm test` verification
**Issue:** 5 assertions against the EN speakers grid fail on HEAD before 18-01 (verified via `git stash` + re-run).
**Resolution:** Unrelated subsystem. Logged to deferred-items.md.
**Files modified:** none (deferred)

## Known Stubs

None.

## Threat Flags

None — this is pure deletion of read-only rendered content (YouTube iframe + static stats + external gallery anchor). No new network surface, no new trust boundary, no new auth path.

## Self-Check: PASSED

- `[ -f src/pages/venue/index.astro ]` → FOUND
- `[ -f src/pages/en/venue/index.astro ]` → FOUND
- `[ -f tests/build/venue-cleanup.test.ts ]` → FOUND
- `[ ! -f tests/build/venue-block-unchanged.test.ts ]` → FOUND deleted
- `git log --oneline | grep 42ee04f` → FOUND
