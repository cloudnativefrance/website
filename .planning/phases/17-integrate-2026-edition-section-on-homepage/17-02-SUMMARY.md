---
phase: 17-integrate-2026-edition-section-on-homepage
plan: 02
subsystem: past-editions-data
tags: [data-module, refactor, editions, phase-17]
requires:
  - Phase 16 EDIT-04 (kcd2023 asset bundle)
  - Phase 16 editions.2026.stats.* i18n keys
provides:
  - src/lib/editions-data.ts (EDITION_2026 + EDITION_2023 exports)
  - EDIT-01 backbone data for Plan 17-03 homepage mount
affects:
  - src/pages/venue/index.astro (now imports from editions-data.ts; byte-identical render)
tech-stack:
  added: []
  patterns: [typed-readonly-const, as-const-satisfies, single-source-of-truth]
key-files:
  created:
    - src/lib/editions-data.ts
    - tests/build/editions-data.test.ts
  modified:
    - src/pages/venue/index.astro
decisions:
  - D-01 honored: editions-data.ts is the single source of truth for past-editions homepage data
  - D-02 honored: EDITION_2026 shape matches spec — youtubeId, galleryUrl, stats[3], thumbnails[3], placeholder:true, trackerIssueUrl
  - D-03 honored: EDITION_2023 stub shipped (placeholder:true + trackerIssueUrl only)
  - D-04 honored: trackerIssueUrl points to issue #3
  - D-05 honored: thumbnails reuse kcd2023_01/05/08 as placeholder masters
  - D-12 honored: venue page render byte-identical vs. pre-refactor (verified by `diff /tmp/venue-pre.html dist/venue/index.html` — empty diff)
metrics:
  duration: ~10m
  completed: 2026-04-13
  tasks: 2
  files_touched: 3
---

# Phase 17 Plan 02: Editions Data Module + Venue Page Refactor Summary

Introduce `src/lib/editions-data.ts` as the authoritative static-data module for past-editions homepage content (D-01), and refactor `src/pages/venue/index.astro` to consume it — preserving byte-identical rendered HTML for the venue page (D-12).

## What Shipped

- **`src/lib/editions-data.ts`** — new module exporting:
  - `EDITION_2026` (readonly via `as const satisfies`): youtubeId `qyMGuU2-w8o`, galleryUrl (ente album), 3 stats `1700+/50+/40+` keyed to `editions.2026.stats.*`, 3 thumbnails (kcd2023_01/05/08) keyed to `editions.2026.thumbnail_alt.*`, `placeholder: true`, `trackerIssueUrl` → github issue #3
  - `EDITION_2023` stub — placeholder for Phase 19 (filled with photos, brandCallout, featured video, stats post-event)
- **`tests/build/editions-data.test.ts`** — 7 assertions (shape, tracker URL, placeholder flag, stat literals, thumbnail imports resolve)
- **`src/pages/venue/index.astro`** — refactored: imports `EDITION_2026`, replaces 3 local constants (YOUTUBE_ID, GALLERY_URL, previousStats) with destructured references. Ambiance thumbnails preserved locally per D-12 note in plan (venue-local photos, not shared via data module).

## Byte-Identical Guarantee

Verified post-refactor:

```
diff /tmp/venue-pre.html dist/venue/index.html
# (empty output — byte-identical)
```

Pre-refactor snapshot (33620 bytes) == post-refactor `dist/venue/index.html`.

## Verification Results

| Check | Result |
|-------|--------|
| `pnpm vitest run tests/build/editions-data.test.ts` | 7/7 pass |
| `pnpm build` | clean (no new warnings/errors) |
| `diff /tmp/venue-pre.html dist/venue/index.html` | empty (byte-identical) |
| `pnpm exec astro check` | 3 pre-existing errors in `src/content.config.ts` (unrelated, out of scope per deviation rules); 0 new errors |
| Grep guards (no `qyMGuU2-w8o` / `1700+` literals in venue.astro) | pass |
| Ambiance import preservation | pass |

## Commits

| Task | Hash | Message |
|------|------|---------|
| 1 | `f76f21f` | feat(17-02): add editions-data.ts with EDITION_2026 + EDITION_2023 stub |
| 2 | `cf838c1` | refactor(17-02): venue page imports EDITION_2026 from editions-data.ts |

## Deviations from Plan

### Test assertion adjustment (Rule 1 — Bug in plan-supplied test code)

**Found during:** Task 1 verification
**Issue:** The plan's test block asserted `expect(thumb.src).toHaveProperty("src")` for kcd2023 image imports. In the vitest (node) environment used here, `ImageMetadata` imports resolve to a plain URL string (e.g., `/src/assets/photos/kcd2023/01.jpg`) rather than the runtime `{ src, width, height }` object Astro materializes during build. The original assertion failed.
**Fix:** Adapted the thumbnail assertion to tolerate either shape — extract the URL string (from `string` or `.src` field) and assert it contains `kcd2023` and the expected filename (`01.jpg`/`05.jpg`/`08.jpg`). This still proves each import resolves to the correct kcd2023 master and covers D-05 semantics.
**Files modified:** `tests/build/editions-data.test.ts`
**Commit:** `f76f21f` (part of Task 1)

No other deviations. Plan executed as specified.

## Known Stubs

- `EDITION_2023` is intentionally a placeholder-only stub (per D-03). Filled in Phase 19. Not rendered in Phase 17 — no user-visible stub impact.
- `EDITION_2026.placeholder: true` — intentional per D-02. Real recap content gated by tracker issue #3 (post-event).

## Handoff to Plan 17-03

Plan 17-03 (homepage mount) can now:
- `import { EDITION_2026 } from "@/lib/editions-data"`
- Wire props per D-09: `rail`, `heading`, `stats`, `video`, `photos`, `galleryCta`, `placeholder`, `trackerUrl`, `id`
- Add i18n keys `editions.2026.thumbnail_alt.{1,2,3}`, `editions.placeholder_badge_aria`, `editions.2026.video_caption` per D-14

## Self-Check: PASSED

- `src/lib/editions-data.ts` — FOUND
- `tests/build/editions-data.test.ts` — FOUND
- `src/pages/venue/index.astro` — MODIFIED (imports `@/lib/editions-data`; no literal `qyMGuU2-w8o` / `1700+`)
- Commit `f76f21f` — FOUND
- Commit `cf838c1` — FOUND
- `diff /tmp/venue-pre.html dist/venue/index.html` — EMPTY (byte-identical render)
- `pnpm vitest run tests/build/editions-data.test.ts` — 7/7 pass
