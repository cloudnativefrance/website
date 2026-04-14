---
phase: 19-integrate-2023-edition-section-and-lightbox
plan: 01
type: summary
status: complete
shipped: 2026-04-14
requirements: [EDIT-02, EDIT-07]
---

# 19-01 Summary — Scaffold `/2023` routes + extend `EDITION_2023` data

## What Shipped

- New FR route `src/pages/2023.astro` (Layout + h1 + minimal stats skeleton). Full assembly deferred to 19-05.
- New EN route `src/pages/en/2023.astro` (FR/EN parity at scaffold time).
- Extended `src/lib/editions-data.ts` `EDITION_2023` shape with:
  - `photos10[]` — all 10 kcd2023 masters with per-tile `altKey` references.
  - `brandHistory` — sub-object pointing at i18n keys for heading/body/venue.
  - `galleryUrl` + `galleryPlaceholder: true` + `trackerUrl` (GitHub issue #19).
- Homepage consumer (17-04 `thumbnails` 3-photo array) left UNCHANGED (truth asserted in 19-01-PLAN).

## Commits

- `5381719` feat(19-01): scaffold /2023 + /en/2023 routes + extend EDITION_2023 (photos10, brandHistory, galleryUrl)

## Validation

Covered by `19-VALIDATION.md` SC1 (page structure asserted in `tests/build/edition-2023-page.test.ts`) and SC5 (placeholder flags asserted in `tests/build/editions-data.test.ts`). Full route assembly lands in 19-05.

## Content Gates / Placeholders

- `EDITION_2023.galleryPlaceholder = true` with `trackerUrl` → see `content-gates.md` §3 (real gallery URL pending organizer).
- 2023 stats (1 700+ / 42 / 24) ported from existing i18n — flagged pending verification → see `content-gates.md` §2.

## Downstream Impact

- 19-02 consumes `EDITION_2023.photos10` + `altKey` references for the photo grid.
- 19-03 consumes `EDITION_2023.brandHistory` for the KCD callout.
- 19-05 completes full route assembly on top of this scaffold.
