---
phase: 17
slug: integrate-2026-edition-section-on-homepage
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-13
approved: 2026-04-14
---

# Phase 17 — Validation Strategy

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | vitest 4.1.x |
| Config file | vitest.config.ts |
| Quick run command | `pnpm exec vitest run tests/build/i18n-parity.test.ts tests/build/editions-data.test.ts tests/build/past-edition-shell.test.ts tests/build/homepage-2026-section.test.ts tests/build/homepage-heading-hierarchy.test.ts tests/build/venue-block-unchanged.test.ts tests/build/a11y-motion-reset.test.ts tests/build/kcd2023-assets.test.ts` |
| Measured runtime | 0.37 s (8 files, 47 tests) |

## Per-Task Verification Map

| Task | Plan | Wave | Requirement | Decision Refs | Test / Verify Command | Status |
|------|------|------|-------------|---------------|-----------------------|--------|
| 17-01-01 | 01 | 1 | EDIT-01 | D-14 | `pnpm exec vitest run tests/build/i18n-parity.test.ts` | ✅ |
| 17-01-02 | 01 | 1 | EDIT-01 | D-08, D-13 | `pnpm exec vitest run tests/build/past-edition-shell.test.ts` | ✅ |
| 17-01-03 | 01 | 1 | EDIT-01 | D-10 | `grep -q ":target" src/styles/global.css` | ✅ |
| 17-02-01 | 02 | 1 | EDIT-01 | D-01, D-02, D-03, D-04, D-05 (superseded) | `pnpm exec vitest run tests/build/editions-data.test.ts` | ✅ |
| 17-02-02 | 02 | 1 | EDIT-01 | D-12 | `pnpm exec vitest run tests/build/venue-block-unchanged.test.ts` | ✅ |
| 17-03-01 | 03 | 2 | EDIT-01, EDIT-06 | D-07, D-09 | `pnpm exec vitest run tests/build/homepage-2026-section.test.ts` | ✅ |
| 17-03-02a | 03 | 2 | EDIT-01 | D-11 (SC3) | `pnpm exec vitest run tests/build/homepage-heading-hierarchy.test.ts` | ✅ |
| 17-03-02b | 03 | 2 | EDIT-02, EDIT-03 | (user-requested expansion) | `pnpm exec vitest run tests/build/editions-data.test.ts` (covers EDITION_2023 real content assertions) | ✅ |
| 17-03-03 | 03 | 2 | all | D-11 (Phase 16), D-15 | `pnpm build && pnpm exec vitest run tests/build/*.test.ts` | ✅ |

Status legend: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky

## Validation Sign-Off

- [x] All tasks have automated verify (grep / Vitest / build commands)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] No watch-mode flags
- [x] Feedback latency < 1 s per test file
- [x] `nyquist_compliant: true` set in frontmatter
- [x] `pnpm build` exits 0 with no new warnings from Phase 17 files
- [x] Phase 17 Vitest files pass: 47/47 green across 8 files
- [x] Per-Task Verification Map covers every task across plans 17-01..17-03 (9 rows)

## Deviations (recorded in summaries)

1. **Scope expansion:** Phase 17 originally mounted 2026 only; user redirected to mount both 2026 + 2023 in the same phase. Phase 19 retains the 2023 lightbox + full gallery page.
2. **2026 placeholder reversal:** `EDITION_2026.placeholder` flipped to `false`; ambiance photos from the legacy venue block are real 2026 content. Tracker issue #3 remains open on GitHub but is no longer wired to the UI (D-04 deferred).
3. **Grid layout:** iterated to a uniform 3×2 grid for 2023 (all `size: medium`) and 2×2 grid for 2026 (all `size: hero`) after two review rounds.
4. **Hero h1 (SC3 fix):** added visually-hidden `<h1>` to `HeroSection.astro` — small scope creep needed to satisfy heading hierarchy success criterion.

### Pre-existing Carry-Over (out of scope per STATE.md)

`tests/build/speakers-grid.test.ts` still reports 5 failures (SPKR-01 fixture drift, v1.0 carry-over). Not touched by Phase 17.

Approval: approved 2026-04-14
