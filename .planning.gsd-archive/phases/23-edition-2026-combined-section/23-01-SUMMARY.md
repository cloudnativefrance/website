---
phase: 23-edition-2026-combined-section
plan: 01
subsystem: ui
tags: [astro, i18n, editions-data, edition-2026, ssr]

requires:
  - phase: 17-past-editions
    provides: EDITION_2026 typed const + editions.2026.* i18n key namespace
  - phase: 20-testimonials
    provides: testimonials.N.* i18n keys (reused as-is by 23-02)
provides:
  - EDITION_2026.replaysUrl (2026 YouTube replays playlist) for the future Edition2026Combined component
  - EDITION_2026.pdfUrl (Google Drive bilan PDF) for the future Edition2026Combined component
  - EDITION_2026.thumbnails trimmed to 3 entries (ambiance-03 hero, ambiance-06 medium, ambiance-10 medium) per UI-SPEC §3
  - 4 new editions.2026.* i18n keys in fr+en (replays_cta, pdf_cta, pdf_cta_aria, testimonials_heading)
  - thumbnail_alt.3 copy now describes the overall venue view (matches ambiance-10 in slot 3)
affects: [23-02, 26-homepage-wiring]

tech-stack:
  added: []
  patterns:
    - "i18n key parity gate: bun -e parity check confirms Object.keys(ui.fr) === Object.keys(ui.en) before declaring i18n work done (PITFALLS #2)."
    - "Orphan-import discipline: deleting a thumbnail entry deletes its source import in the same edit to avoid Astro bundling unused assets (PITFALLS #12 applied to 2026)."

key-files:
  created: []
  modified:
    - src/lib/editions-data.ts
    - src/i18n/ui.ts

key-decisions:
  - "Used the clean playlist?list= URL form for replaysUrl (per CONTEXT §Specific Ideas), not the watch?v=…&list= variant."
  - "Kept thumbnail_alt.4 in both locales as an orphan key — UI-SPEC §Accessibility checklist defers clean-up to a future housekeeping task."
  - "Left EDITION_2026.stats untouched even though UI-SPEC drops the stats row from the future component (data is preserved for any other future consumer; UI-SPEC §Data Module Changes recommends this)."

patterns-established:
  - "Atomic data + i18n plan: shipping data shape changes and the matching FR+EN i18n keys in the same plan keeps the upstream component plan from ever seeing a half-wired interface."
  - "Pre-existing astro check baseline: 11 type errors exist on main (from src/content.config.ts loader signatures, Edition2023PhotoGrid implicit-any params, TestimonialsStrip template-literal key types, and 2 orphan editions.2026.gallery_cta references in homepage files). Plan 23-01 adds 0 new errors — verified with a stash-baseline check."

requirements-completed: [ED26-01, ED26-02, ED26-03]

duration: 7min
completed: 2026-04-18
---

# Phase 23 Plan 01: Data + i18n Foundation Summary

**EDITION_2026 const exposes 3 photos + replaysUrl + pdfUrl, and 4 new editions.2026.* i18n keys (FR + EN) land atomically — clearing the way for plan 23-02 to consume both interfaces.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-04-18T08:26:00Z (approx)
- **Completed:** 2026-04-18T08:33:22Z
- **Tasks:** 3 / 3
- **Files modified:** 2

## Accomplishments

- `EDITION_2026` now carries `replaysUrl` (2026 YouTube playlist, D-05) and `pdfUrl` (Google Drive bilan, D-06).
- Photo mosaic shrunk from 4 entries (with `ambiance-08`) to 3 entries (`ambiance-03` hero, `ambiance-06` medium, `ambiance-10` medium) per D-04 + UI-SPEC §3.
- The `ambiance-08` import is fully removed — Astro/Sharp will not bundle the unused asset (PITFALLS #12).
- 4 new keys (`replays_cta`, `pdf_cta`, `pdf_cta_aria`, `testimonials_heading`) added to BOTH the `fr` and `en` blocks in the same commit (PITFALLS #2 mitigation).
- `thumbnail_alt.3` rewritten in both locales to describe the overall venue view, matching the ambiance-10 photo that now occupies slot 3.
- FR/EN key parity verified programmatically (249 keys per locale, zero diff).
- Production `bun run build` exits 0 with zero references to the dropped ambiance-08 in the build log.

## Task Commits

Each task was committed atomically:

1. **Task 1: Mutate EDITION_2026 const** — `a6b406d` (feat)
2. **Task 2: Add 4 new editions.2026.* i18n keys + rewrite thumbnail_alt.3** — `9f4a52f` (feat)
3. **Task 3: Verify fr/en parity + type-check + build** — no source mutation; verification only (parity check + `bun run build` exits 0)

**Plan metadata:** _to be added by the final docs commit_

## Files Created/Modified

- `src/lib/editions-data.ts` — Removed `ambiance08` import; added `replaysUrl` + `pdfUrl` after `galleryUrl`; replaced 4-entry `thumbnails` with the 3-entry asymmetric-mosaic version (hero + 2× medium).
- `src/i18n/ui.ts` — Added 4 new `editions.2026.*` keys to both the `fr` (line 219+) and `en` (line 512+) blocks; rewrote `editions.2026.thumbnail_alt.3` in both locales so it matches ambiance-10's overall-venue framing.

## Decisions Made

- **Playlist URL form:** Used `https://www.youtube.com/playlist?list=PLmZ3gFl2Aqt_4_F40zEoUEweEctmtx4p2` (the clean form) instead of the `watch?v=…&list=…` variant from CONTEXT D-05, per the CONTEXT §Specific Ideas note that recommends the clean form. This matches what the executor copy/UI-SPEC said verbatim.
- **`thumbnail_alt.4` left orphan:** The key is still present in both locales because UI-SPEC §Accessibility checklist explicitly defers clean-up to a separate housekeeping task. The orphan does no runtime harm.
- **`stats` array preserved:** Even though UI-SPEC drops the stats row from the future Edition2026Combined component, the underlying data is left in `EDITION_2026` for any future consumer (UI-SPEC §Data Module Changes recommends this). Cleanup deferred to v1.3.

## Deviations from Plan

None — the action blocks for both Task 1 and Task 2 were applied verbatim. The only point worth flagging is the pre-existing `astro check` baseline; see "Issues Encountered" below.

## Issues Encountered

- **Pre-existing `astro check` errors on baseline (11 errors).** A stash-baseline check confirmed these all exist on `main@92734c7` before any plan 23-01 edits:
  - `src/content.config.ts` (3× `ts(2322)`): zod loader signature drift.
  - `src/components/past-editions/Edition2023PhotoGrid.astro` (2× `ts(7006)`): implicit `any` on `.map((p, i) => …)` params.
  - `src/components/testimonials/TestimonialsStrip.astro` (4× `ts(2345)`): template-literal `testimonials.${number}.quote` rejected by the strict union type generated from `ui.fr`.
  - `src/pages/index.astro` + `src/pages/en/index.astro` (2× `ts(2345)`): both pages reference an `editions.2026.gallery_cta` key that was never added to `ui.ts`.
  Per scope-boundary rules in `execute-plan.md`, these are pre-existing failures in unrelated files and were NOT auto-fixed. Logged here for the next phase that touches those files. The acceptance-criteria gate "`bun run astro check` exits 0" is not satisfied for this reason — but plan 23-01's edits added zero new errors (stash-baseline diff: 11 → 11). The `bun run build` gate (which is the production-quality gate) exits 0 cleanly.

## Deferred Issues

The 11 pre-existing `astro check` errors above will need a dedicated housekeeping plan to clear:

| File | Error count | Suggested fix |
|------|-------------|----------------|
| `src/content.config.ts` | 3 | Update zod loader return-type signature to match the current `LoaderConstraint<{ id: string }>` shape. |
| `src/components/past-editions/Edition2023PhotoGrid.astro` | 2 | Annotate `.map((p, i) => …)` params with the right tuple type from `EDITION_2023.photos10`. |
| `src/components/testimonials/TestimonialsStrip.astro` | 4 | Replace template-literal key access with a `keyof typeof ui.fr` narrowing or split the union into a const-asserted array of literal keys. |
| `src/pages/index.astro` + `src/pages/en/index.astro` | 2 | Either add `editions.2026.gallery_cta` to both locales (if the legacy 2026 placeholder is still wanted) or drop the reference (Phase 26 will rewire these pages anyway). |

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Plan 23-02 (`Edition2026Combined.astro`) is unblocked.** All 4 new i18n keys exist in both locales; `EDITION_2026.replaysUrl`, `EDITION_2026.pdfUrl`, and the 3-entry mosaic are ready for component consumption per UI-SPEC §Caller-side data assembly.
- **No homepage files were touched** (`src/pages/index.astro`, `src/pages/en/index.astro` still mount the legacy `PastEditionSection` for 2026 + `TestimonialsStrip`). Phase 26 owns the homepage rewire.
- **`TestimonialsStrip.astro` and `PastEditionSection.astro` are untouched** — current homepage layout still renders identically to what shipped at `92734c7`.

## Self-Check: PASSED

- `src/lib/editions-data.ts` exists and contains `replaysUrl` + `pdfUrl` + 3-entry thumbnails (verified via Read).
- `src/i18n/ui.ts` contains all 4 new keys in both locales (verified via grep counts: `replays_cta`, `pdf_cta`, `pdf_cta_aria`, `testimonials_heading` each return 2; FR/EN key counts equal at 249 each via runtime parity check).
- Commit `a6b406d` exists in `git log --oneline -5` (Task 1).
- Commit `9f4a52f` exists in `git log --oneline -5` (Task 2).
- `bun run build` exits 0 with no `ambiance-08` references in the build log.

---
*Phase: 23-edition-2026-combined-section*
*Completed: 2026-04-18*
