---
phase: 19-integrate-2023-edition-section-and-lightbox
plan: 02
type: summary
status: complete
shipped: 2026-04-14
requirements: [EDIT-02, A11Y-04, I18N-01, I18N-02]
---

# 19-02 Summary — `Edition2023PhotoGrid` + unique descriptive alt text

## What Shipped

- New `src/components/past-editions/Edition2023PhotoGrid.astro` — 10 photos rendered via `astro:assets <Picture>` (AVIF/WebP/JPG), each tile an `<button data-lightbox-trigger>` with `aspect-[4/3]` for CLS <=0.02.
- 10 new i18n keys `editions.2023.photo_alt.01..10` (FR+EN) — each descriptive (e.g. "Opening keynote on the main stage at Centre Georges Pompidou"), not "Photo N".
- Legacy `editions.2023.thumbnail_alt.{1,5,8}` rewritten to unique descriptive alts so existing homepage consumers (Phase 16/17) keep rendering and no new banned alt patterns slip in (A11Y-04).
- `tests/build/editions-data.test.ts` extended with `photos10.length === 10` + 10 distinct `altKey` assertion.
- I18N-02 parity test still green.

## Commits

- `e00e99f` feat(19-02): Edition2023PhotoGrid + 10 unique alt keys FR+EN (A11Y-04) + data tests

## Validation

`19-VALIDATION.md` SC4 (unique descriptive alt FR+EN — 10 distinct long-string alts) passes via `tests/build/edition-2023-page.test.ts` §"SC4". `tests/build/homepage-2026-section.test.ts` was updated (alt-prefix assertion → structural figure-count) to cover the thumbnail_alt rewrite.

## Content Gates / Placeholders

None — this plan has no organizer-content dependency.

## Downstream Impact

- 19-04 wires the lightbox to the `data-lightbox-trigger` buttons shipped here.
- 19-05 mounts the grid on `/2023` + `/en/2023`.
- 21-02 discovery-loop CTA reuses the 2023 i18n namespace.
