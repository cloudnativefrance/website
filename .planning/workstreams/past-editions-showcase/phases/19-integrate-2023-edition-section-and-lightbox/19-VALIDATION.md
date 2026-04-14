# Phase 19 — Validation

## Success Criteria mapping (from ROADMAP §Phase 19)

| # | Success Criterion | Evidence | Status |
|---|---|---|---|
| 1 | `/2023` (FR) and `/en/2023` (EN) render a 10-photo `<Picture>` grid (AVIF/WebP/JPG, capped widths, aspect-[4/3] for CLS <=0.02), with rail + h2 + external gallery CTA | `tests/build/edition-2023-page.test.ts` §"SC1: /2023 structure" — asserts single `<h1>`, rail label, `data-edition-2023-photo-grid`, 10 trigger buttons, `aspect-[4/3]` class count, gallery CTA text | PASS |
| 2 | KCD brand-history callout shows KCD 2023 logo + "originally named Kubernetes Community Days France" + Centre Georges Pompidou; FR+EN wording has documented organizer sign-off | Static assertions pass; wording marked `TODO(19) I18N-03` pending organizer review — see `content-gates.md` §1 | PARTIAL — content gate |
| 3 | Click any photo → lightbox with `role="dialog"` + `aria-label`, focus trapped, Escape closes, Arrow keys navigate, Tab cycles, focus returns to thumbnail | `tests/build/edition-2023-lightbox-a11y.test.ts` — asserts `role="dialog"`, `aria-modal`, `aria-label`, close/prev/next aria-labels, Escape/ArrowLeft/ArrowRight/Tab branches in inline script, originTrigger focus-return, body-scroll-lock. Full keyboard journey validated manually in `19-UAT.md`. | PASS (static) + manual UAT pending |
| 4 | Every 2023 photo + KCD logo carry unique descriptive alt in FR+EN (no "photo 1/2" patterns) | `tests/build/edition-2023-page.test.ts` §"SC4: unique descriptive alt" — 10 distinct long-string alts each appearing exactly twice (grid + lightbox); zero `alt="Photo 1"` / `alt="photo N"` matches. 10 new `editions.2023.photo_alt.01..10` keys + rewritten `editions.2023.thumbnail_alt.1..10` to replace the banned "Photo KCD France 2023 —" prefix inherited from Phase 16. | PASS |
| 5 | Placeholder 2023 stats + gallery URL flagged in `editions-data.ts` with tracker issue | `EDITION_2023.galleryPlaceholder === true`, `trackerUrl === "https://github.com/cloudnativefrance/website/issues/19"`, visible PLACEHOLDER badge in dist HTML. See `content-gates.md` §2-3. | PASS |

## Build + Test Status

- `pnpm build` — GREEN (156 pages, incl. new `/2023/index.html` + `/en/2023/index.html`)
- `pnpm test` — 160/165 pass; 5 failures are pre-existing SPKR-01 carry-over from v1.0 (documented in STATE.md "Carry-Over from v1.0"). Phase 19 adds 25 new assertions across `edition-2023-page.test.ts`, `edition-2023-lightbox-a11y.test.ts`, and `editions-data.test.ts` extensions — all green.

## Known Gaps / Carry-Over

- Lightbox keyboard behaviour (focus trap wrap, focus return on close, arrow key wraparound) requires a real browser for deterministic assertion — enumerated in `19-UAT.md` as manual items.
- Stitch visual approval for `/2023` is OUTSTANDING (D-03). User must review the live worktree before merge.
- Three content gates await organizer sign-off (brand-history wording, stats, gallery URL) — tracked in `content-gates.md`.

## Files Changed

- `src/lib/editions-data.ts` (extended `EDITION_2023`)
- `src/pages/2023.astro` (new FR route)
- `src/pages/en/2023.astro` (new EN route)
- `src/components/past-editions/Edition2023PhotoGrid.astro` (new)
- `src/components/past-editions/KcdBrandHistoryCallout.astro` (new)
- `src/components/past-editions/Edition2023Lightbox.astro` (new, Astro + vanilla TS)
- `src/i18n/ui.ts` (Phase 19 keys FR+EN + rewritten thumbnail_alt.* values for A11Y-04)
- `tests/build/edition-2023-page.test.ts` (new)
- `tests/build/edition-2023-lightbox-a11y.test.ts` (new)
- `tests/build/editions-data.test.ts` (extended)
- `tests/build/homepage-2026-section.test.ts` (updated: alt-prefix check replaced by structural figure-count after A11Y-04 rewrite)
