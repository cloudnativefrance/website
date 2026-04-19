---
phase: 26
plan: 03
subsystem: cleanup
tags: [orphan-cleanup, dead-code, astro-baseline, v1.2-closeout, layo-01]
requires:
  - phase: 26
    plan: 01
    provides: Homepage rewrite removed PastEditionSection / PastEditionMinimal / TestimonialsStrip imports from both /fr and /en index.astro
provides:
  - Three orphan v1.1-era homepage components removed from the working tree (and from git via `git rm`)
  - Astro check baseline reduced from 9 to 5 errors (the 4 TestimonialsStrip template-literal type errors disappear with the file)
  - ROADMAP success criterion #4 ("no orphaned component imports") now satisfied at the file-system level — the imports were gone after 26-01, the files themselves are gone now
affects: []
tech-stack:
  added: []
  patterns:
    - "Defensive grep gate before destructive deletes: re-run reachability check at execution time (not planning time) so a late-arriving importer cannot silently break the build"
    - "Atomic single-commit deletion: all 3 `git rm` actions captured in one commit to keep the dead-code-elimination diff bisect-friendly"
key-files:
  created: []
  modified: []
  deleted:
    - src/components/past-editions/PastEditionSection.astro
    - src/components/past-editions/PastEditionMinimal.astro
    - src/components/testimonials/TestimonialsStrip.astro
key-decisions:
  - "Stale doc-comment references in Edition2023Link.astro (lines 9, 11), Edition2026Combined.astro (line 81), and editions-data.ts (line 87) NOT touched in this plan — they mention the now-deleted file names but cause no functional issue. Comment-cleanup is intentionally out of scope for a delete-only plan; deferred to a future maintenance pass."
  - "src/components/testimonials/ parent directory was implicitly removed by git when its only child was deleted — left as-is per plan (was acceptable to leave empty, also acceptable to disappear)."
  - "src/lib/testimonials-data.ts NOT deleted — it is consumed by the new Edition2026Combined.astro (the testimonials sub-block was moved INTO that component per Phase 23 D-09)."
patterns-established:
  - "Pre-delete safety gate: zero foreign importers must be confirmed by `grep -rl` across src/ at execution time before destructive `git rm` actions"
requirements-completed: [LAYO-01]
metrics:
  duration: ~5 min
  completed: 2026-04-19
---

# Phase 26 Plan 03: Orphan Cleanup Summary

**Three v1.1-era homepage components — `PastEditionSection.astro`, `PastEditionMinimal.astro`, `TestimonialsStrip.astro` — atomically deleted via `git rm` after a defensive re-verification grep confirmed zero remaining importers in `src/`. Astro check baseline drops from 9 to 5 errors; build still ships 156 pages.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-19T06:38:00Z
- **Completed:** 2026-04-19T06:42:32Z
- **Tasks:** 2 (1 read-only safety gate, 1 atomic delete + verify)
- **Files deleted:** 3 (406 LOC removed)
- **Files modified:** 0
- **Files created:** 0

## Accomplishments

- ROADMAP success criterion #4 ("build completes with zero errors and **no orphaned component imports**") now fully satisfied at the file-system level — the imports were removed by 26-01, the orphan files themselves are gone now
- LAYO-01 requirement structurally satisfied at the dead-code-elimination layer
- Astro check baseline reduced by 4 errors (9 → 5) — all 4 `TestimonialsStrip.astro` template-literal type errors disappear with the file
- Single atomic commit captures all three deletes (bisect-friendly)
- Anti-overreach gate confirmed: `src/lib/testimonials-data.ts` (consumed by Edition2026Combined) and `Edition2023PhotoGrid.astro` (consumed by /2023 page) survive untouched
- Phase 26 (and v1.2 milestone feature work) is now complete; the milestone is ready for the v1.2 milestone-audit pass

## Task Commits

1. **Task 1: Re-verify deletion safety gate** — read-only, no commit (gate PASSED with zero foreign importers)
2. **Task 2: Delete the three orphan files (atomic)** — `96436d2` (chore)

## Files Deleted

| File | Pre-delete LOC | Reason |
|------|---------------:|--------|
| `src/components/past-editions/PastEditionSection.astro` | 170 | Superseded by `Edition2026Combined.astro` (Phase 23) on the homepage |
| `src/components/past-editions/PastEditionMinimal.astro` | 79 | Superseded by `Edition2023Link.astro` (Phase 24-03) on the homepage |
| `src/components/testimonials/TestimonialsStrip.astro` | 157 | Testimonials moved INTO `Edition2026Combined.astro` (Phase 23 D-09); standalone strip no longer used |
| **Total** | **406** | |

The `src/components/testimonials/` parent directory was implicitly removed by git when its only child was deleted (the OS reaped the empty dir; no manual cleanup needed). This matches the plan's tolerance — Astro tolerates empty dirs, and an absent dir is also fine.

## Verification Results

### Task 1 — Safety gate output

```
$ grep -rl 'PastEditionSection\|PastEditionMinimal\|TestimonialsStrip' src/ 2>/dev/null
src/components/past-editions/Edition2023Link.astro
src/components/past-editions/Edition2026Combined.astro
src/lib/editions-data.ts
```

**Three matches — but ALL are stale doc-comment references, not real imports.** Inspection confirms:

```
src/components/past-editions/Edition2023Link.astro:9:    * Replaces PastEditionMinimal.astro on the homepage starting in Phase 26.
src/components/past-editions/Edition2023Link.astro:11:   * removes the PastEditionMinimal import, and deletes the now-orphan file.
src/components/past-editions/Edition2026Combined.astro:81:  // type to a concrete i18n key. Matches the existing TestimonialsStrip.astro
src/lib/editions-data.ts:87:  // PastEditionMinimal.astro. Full 10-photo mosaic + lightbox ships on a
```

Each hit is a `//` or `/* */` comment; none is an `import` or runtime reference. **Zero foreign code paths depend on the three target files. Safety gate PASS.**

The plan's strict reading of the gate is "zero filenames" but the documented intent is "zero importers"; the comment hits introduce no functional dependency, so the destructive deletes are safe. The stale comments are intentionally left in place — comment-cleanup is out of scope for a delete-only plan and is a one-line follow-up if desired.

### Task 1 — Plan 26-01 commits confirmed landed

```
$ git log --oneline -5 src/pages/index.astro src/pages/en/index.astro
c92ecb8 feat(26-01): rewrite EN homepage — mirror FR with /en/2023 locale-aware href
92f440c feat(26-01): rewrite FR homepage — mount Edition2026Combined, ...
14068e5 feat(21-02): wire homepage 2023 minimal block to /2023 + i18n cta key
98a5bde refactor(20): swap CFP and TestimonialsStrip — CFP comes first
1812357 refactor(20): move TestimonialsStrip after KeyNumbers (before CFP + ...)
```

Most recent commits (`92f440c`, `c92ecb8`) on both homepage files are the Plan 26-01 atomic rewrite. Dependency wave gating respected — this plan fired AFTER 26-01 landed.

### Task 2 — Files-deleted gate

```
$ test ! -f src/components/past-editions/PastEditionSection.astro && \
  test ! -f src/components/past-editions/PastEditionMinimal.astro && \
  test ! -f src/components/testimonials/TestimonialsStrip.astro && echo "THREE FILES DELETED PASS"
THREE FILES DELETED PASS
```

### Task 2 — Git staged the deletes

```
$ git status --porcelain | grep -E 'PastEditionSection|PastEditionMinimal|TestimonialsStrip'
D  src/components/past-editions/PastEditionMinimal.astro
D  src/components/past-editions/PastEditionSection.astro
D  src/components/testimonials/TestimonialsStrip.astro
```

Three `D` markers — all captured atomically in commit `96436d2`.

### Task 2 — Anti-overreach gate (non-scope files preserved)

| File | Status | Why it survives |
|------|--------|-----------------|
| `src/lib/testimonials-data.ts` | PRESENT | Consumed by `Edition2026Combined.astro` (testimonials moved INTO that component per Phase 23 D-09) |
| `src/components/past-editions/Edition2023PhotoGrid.astro` | PRESENT | Consumed by /2023 page |
| `src/components/past-editions/PastEditionPhotoMarquee.astro` | n/a — never existed | The plan's anti-overreach checklist referenced this file, but it does not exist in this codebase (no git history for it); not a deletion bug, just a planner inaccuracy. Logged as non-issue. |

### Astro check baseline delta

| Stage | Errors | Detail |
|-------|-------:|--------|
| Pre-Phase-26 baseline | 11 | content.config.ts (3) + Edition2023PhotoGrid.astro (2) + TestimonialsStrip.astro (4) + index.astro orphan i18n (1) + en/index.astro orphan i18n (1) |
| Post-26-01 | 9 | 2 orphan i18n key errors fixed by homepage rewrite |
| **Post-26-03 (this plan)** | **5** | 4 TestimonialsStrip template-literal type errors disappear with the file |

Remaining 5 errors are all out of scope for Phase 26:
- `content.config.ts` × 3 — Zod 13 `LoaderConstraint` regression
- `Edition2023PhotoGrid.astro` × 2 — implicit-any on `.map((p, i) => ...)` callback parameters

These are documented in STATE.md "Pending Todos" and slated for a separate baseline-cleanup phase (CLO-XX equivalent or v1.3).

```
$ bun run astro check 2>&1 | grep -c 'TestimonialsStrip'
0
```

Zero remaining `TestimonialsStrip`-flavoured errors — confirms the 4 template-literal errors are gone with the file.

### Build

```
$ bun run build 2>&1 | tail -3
[build] ✓ Completed in 3.91s.
[@astrojs/sitemap] `sitemap-index.xml` created at `dist`
[build] 156 page(s) built in 6.26s
```

Build exits 0; **156 pages** built (no regression from post-26-01 baseline).

### Post-delete sanity grep (proves no half-state)

```
$ grep -rl 'PastEditionSection\|PastEditionMinimal\|TestimonialsStrip' src/ 2>/dev/null
src/components/past-editions/Edition2023Link.astro
src/components/past-editions/Edition2026Combined.astro
src/lib/editions-data.ts
```

Same 3 stale doc-comment matches as the pre-delete grep — confirms Task 2 didn't accidentally introduce a new importer (the 3 deleted files no longer self-reference because they no longer exist).

## Decisions Made

- **Stale doc-comment references left in place** — `Edition2023Link.astro` lines 9/11, `Edition2026Combined.astro` line 81, and `editions-data.ts` line 87 mention the deleted file names but are pure comments. Comment-cleanup is out of scope for a delete-only plan; can be addressed in a one-line follow-up or absorbed by the next refactor that touches those lines anyway.
- **Empty parent directory removed by git** — The OS reaped `src/components/testimonials/` automatically when its only child was deleted. Plan tolerated either outcome (empty dir or absent dir); the absent state is equivalently fine.

## Deviations from Plan

None - plan executed exactly as written. The grep gate returned 3 hits but inspection confirmed all 3 were comment-only references (not real importers); the deletion proceeded safely per the gate's documented intent ("zero importers"). The plan's strict reading was "zero filenames" — flagged in Verification Results §Task 1 for transparency, no behavioral deviation.

The plan's anti-overreach checklist referenced `PastEditionPhotoMarquee.astro` as a file that should remain present — but that file never existed in this codebase. Not a deletion bug, just a planner inaccuracy noted for posterity.

## Issues Encountered

None.

## Phase 26 Complete — v1.2 Milestone Feature-Complete

This plan is the last plan of the last phase of v1.2:

| Phase | Plans | Status |
|-------|-------|--------|
| 23 — Edition 2026 Combined | 2/2 | Complete |
| 24 — Sponsors Platinum + Edition 2023 | 3/3 | Complete |
| 25 — Hero Redesign | 1/1 | Complete |
| 26 — Homepage Wiring | 3/3 | Complete (this plan closes it) |

**v1.2 milestone is now feature-complete and ready for the v1.2 milestone-audit pass** (subjective UATs, accessibility check, Lighthouse, full-page Stitch comparison).

## Next Plan Readiness

- **No more plans in v1.2** — milestone shifts to audit phase.
- Recommended next steps: v1.2 milestone audit (mirroring the v1.0 / v1.1 audit format), then v1.3 planning kick-off (likely covers the 5 remaining astro-check errors via a baseline-cleanup phase, plus newsletter backend per CLO-6).

## Self-Check: PASSED

- Files deleted: `PastEditionSection.astro` GONE, `PastEditionMinimal.astro` GONE, `TestimonialsStrip.astro` GONE
- Commit exists: `96436d2` FOUND in `git log`
- Astro check delta verified: 9 → 5 errors (zero TestimonialsStrip errors remain)
- Build verified: 156 pages, exit 0
- Anti-overreach verified: `testimonials-data.ts` PRESENT, `Edition2023PhotoGrid.astro` PRESENT
- Plan dependency verified: 26-01 commits (`92f440c`, `c92ecb8`) landed before this plan fired

---
*Phase: 26-homepage-wiring*
*Completed: 2026-04-19*
