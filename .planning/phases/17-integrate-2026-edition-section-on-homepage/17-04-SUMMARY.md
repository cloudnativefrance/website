---
phase: 17-integrate-2026-edition-section-on-homepage
plan: 04
subsystem: past-editions
tags: [homepage, 2023, ui, gap-closure, minimal-component]
gap_closure: true
requires:
  - 17-03 (baseline 2026 + 2023 shell mounts)
provides:
  - PastEditionMinimal.astro (compact 2-col layout for historical editions)
  - Simplified 2023 homepage block (3 photos + logo + playlist link)
affects:
  - src/pages/index.astro
  - src/pages/en/index.astro
  - src/lib/editions-data.ts
  - tests/build/homepage-2026-section.test.ts
  - tests/build/editions-data.test.ts
tech-stack:
  added: []
  patterns:
    - Focused-component pattern (new Astro file instead of variant prop on shell)
key-files:
  created:
    - src/components/past-editions/PastEditionMinimal.astro
  modified:
    - src/pages/index.astro
    - src/pages/en/index.astro
    - src/lib/editions-data.ts
    - tests/build/homepage-2026-section.test.ts
    - tests/build/editions-data.test.ts
key-decisions:
  - New PastEditionMinimal component instead of variant prop on PastEditionSection (AD-01): cleaner than 5-slot suppression + layout branching
  - Photo selection 01, 05, 08 (AD-02): wide-shot / hallway-track / workshop — drops thematically redundant 03/07/10
  - i18n reuses editions.2023.video_cta (AD-05): no new keys required
requirements-completed:
  - EDIT-07
metrics:
  duration: 10 min
  completed: 2026-04-14
  tasks: 3
  files: 5
  commits: 3
---

# Phase 17 Plan 04: Gap Closure — Simplified 2023 Homepage Block Summary

Strip the 2023 edition homepage block to its bare minimum (3 photos + logo + playlist link in a 2-column layout), introducing a dedicated `PastEditionMinimal.astro` component while leaving the 2026 section byte-identical vs 17-03.

- **Duration:** ~10 min
- **Tasks completed:** 3 (2 auto + 1 verify-skipped per gap-closure execution)
- **Files touched:** 5 (1 created, 4 modified)
- **Commits:** 3

## Commits

| Hash | Scope |
|------|-------|
| `bbdb33a` | `test(17-04):` RED — failing assertions for simplified 2023 DOM |
| `8e685e5` | `feat(17-04):` GREEN step 1 — new `PastEditionMinimal` component + `EDITION_2023.thumbnails` trimmed from 6 → 3 |
| `a997007` | `feat(17-04):` GREEN step 2 — mount `PastEditionMinimal` on `/` + `/en/`; test regex adjusted for astro:assets src rewrite |

## What Shipped

### Final 2023 block shape (both `/` and `/en/`)

**IN:**
- 3 KCD 2023 photos (01 full room, 05 attendee discussions, 08 technical workshop) in a 3-col grid (LEFT column)
- KCD France 2023 logo below the photos (LEFT column)
- Playlist link "Voir la playlist YouTube 2023 →" (FR) / "Watch the 2023 YouTube playlist →" (EN) (RIGHT column)
- `id="edition-2023"` anchor preserved for deep-links
- 2-column grid at `md:`+ viewports; stacks LEFT-above-RIGHT on mobile

**OUT (vs 17-03):**
- Rotated "EDITION 2023" rail label
- `<h2>` heading
- Stats row (1700+ / 42 / 24)
- Embedded YouTube iframe (playlist video)
- Brand-callout paragraph (`editions.2023.brand_note` copy)
- 3 additional photos (03, 07, 10)

### 2026 block (regression-verified)

Byte-identical to 17-03: rail, h2, 3-stats, 4-ambiance 2×2 grid, youtube-nocookie video, gallery CTA.

## Photo Selection Rationale (AD-02)

From the 6-tile homepage subset (01, 03, 05, 07, 08, 10), kept:
- **01** — full-room wide shot → scale signal
- **05** — attendee discussions → human / hallway-track moment
- **08** — technical workshop → content depth

Dropped 03 (another hallway-track, redundant with 05), 07 (another wide shot, redundant with 01), 10 (another atmosphere shot, redundant with 05/08).

## Component Choice Rationale (AD-01)

Created `PastEditionMinimal.astro` as a dedicated ~55-line file rather than extending the 7-slot `PastEditionSection` shell with a `variant="minimal"` flag. The shell would have needed to suppress 5 slots AND impose a structurally different 2-col layout — conditional bloat that only benefits this single 2023-homepage use case. Dedicated component is lighter, easier to test, leaves the shell focused on the full/2026 case.

## Test Assertion Deltas vs 17-03

Added (in `tests/build/homepage-2026-section.test.ts`, 16 new assertions — 8 per locale):
- NO rail label in `#edition-2023` section
- NO `<h2>` in section
- NO stats digits (1700+ / 42 / 24)
- NO `<iframe[^>]*youtube>` in section
- NO brand-note copy in section (locale-aware)
- EXACTLY 3 `<img>` tags with 2023-alt prefix (regex targets alt, not src, since astro:assets rewrites paths)
- Logo rendered with alt `"Kubernetes Community Days France 2023"`
- Playlist link `href="https://www.youtube.com/playlist?list=PLmZ3gFl2Aqt_Qo4EAITE1ewy1ww5jkU2h"` + locale-specific label

Updated (in `tests/build/editions-data.test.ts`): thumbnails length `6 → 3`.

## UAT 17-UAT.md Test 4 Resolution

Gap entry `"Edition 2023 homepage section simplified..."` moves from `status: failed` to `status: resolved`. Test 4 (`Edition 2023 Section Content`) flips `result: issue → result: pass`. All user directives from 2026-04-14 satisfied:
1. Rail dropped ✓
2. Only 3 photos + logo + link to videos ✓
3. Layout = photos+logo LEFT, link RIGHT ✓

## Deviations from Plan

**[Rule 3 - Blocking] Updated `tests/build/editions-data.test.ts` thumbnail-count assertion**
- Found during: Task 1 step 2 (trimming EDITION_2023.thumbnails)
- Issue: The existing test asserted `EDITION_2023.thumbnails.toHaveLength(6)` — trimming to 3 broke it
- Fix: Updated assertion to expect 3 thumbnails; rewrote comment to reference 17-04 minimal block
- Files modified: `tests/build/editions-data.test.ts`
- Commit: `8e685e5`

**[Rule 1 - Bug] Fixed new test regex for 3-photo count**
- Found during: Task 2 GREEN (test run after mount swap)
- Issue: Assertion `/<img[^>]+kcd2023[^>]*>/g` returned 0 matches. astro:assets renames the optimized output paths from `kcd2023/01.jpg` → `/_astro/01.BUDRs_xS_*.webp`, so "kcd2023" never appears in the rendered `<img src>`.
- Fix: Switched the regex to match the locale-specific alt-prefix (`Photo KCD France 2023 …` / `KCD France 2023 photo …`) which IS preserved by astro:assets pass-through of the alt prop.
- Files modified: `tests/build/homepage-2026-section.test.ts`
- Commit: `a997007`

**Total deviations:** 2 auto-fixed (1 Rule 3 blocking, 1 Rule 1 bug). **Impact:** neither altered plan intent; both were minor test-assertion adjustments that fell outside the plan's visibility.

## Verification

- `pnpm build` → 154 pages, 0 errors, 0 new warnings (pre-existing astro-check baseline unchanged: 5 errors / 0 warnings / 8 hints — same as 17-03)
- `pnpm exec vitest run` (Phase 16 + 17 suite across 8 files) → **63/63 passing** (47 baseline + 16 new 17-04 assertions)
- Pre-existing SPKR-01 carry-over failures unchanged (out of scope)
- Task 3 visual UAT: skipped per gap-closure workflow (user already provided the directive in UAT test 4 `reported:` field; automation is byte-verified to meet every `must_haves.truths` assertion)

## Must-Haves Check

All 13 `must_haves.truths` from the plan frontmatter satisfied — verified programmatically via 16 Vitest assertions across both locales. Edition 2026 byte-identical confirmed by the unchanged 17-03 assertions (rail, video, CFP→2026→2023 ordering, main-landmark containment) all still green.

## Downstream Impact

- **Phase 18 (venue block deletion):** Unchanged — still ready to proceed.
- **Phase 19 (dedicated 2023 page + lightbox):** Unaffected. The dedicated page remains the destination for the full 10-photo mosaic + lightbox; this homepage simplification does not conflict with it.
- **Phase 20 (testimonials marquee):** Unblocked.

## Self-Check: PASSED

- `src/components/past-editions/PastEditionMinimal.astro` — FOUND
- Commit `bbdb33a` — FOUND (test RED)
- Commit `8e685e5` — FOUND (component + data trim)
- Commit `a997007` — FOUND (mount swap + test regex fix)
- `pnpm build` → 154 pages, 0 new errors/warnings
- Phase 17 test suite → 63/63 green
