---
phase: 19-integrate-2023-edition-section-and-lightbox
plan: 05
type: summary
status: complete
shipped: 2026-04-14
requirements: [EDIT-02, EDIT-03, EDIT-05, EDIT-07, A11Y-03, A11Y-04, I18N-03]
---

# 19-05 Summary — Assembly of `/2023` + `/en/2023` + regression harness + gates docs

## What Shipped

- `/2023` (FR) + `/en/2023` (EN) compose: rail → h1 → intro → stats → 10-photo grid → brand-history callout → gallery CTA → lightbox.
- New regression tests:
  - `tests/build/edition-2023-page.test.ts` — SC1 (route structure: single `<h1>`, rail label, `data-edition-2023-photo-grid`, 10 triggers, `aspect-[4/3]`, gallery CTA) + SC4 (unique descriptive alts: 10 distinct long-string alts each appearing twice — grid + lightbox — zero banned patterns).
  - `tests/build/edition-2023-lightbox-a11y.test.ts` — static a11y contract for the dialog + keyboard bindings.
- Phase documentation:
  - `content-gates.md` — 3 organizer-content gates (brand-history wording, stats, gallery URL) + Stitch visual-approval gate.
  - `19-UAT.md` — 10 manual keyboard-journey items (focus trap, Escape, arrow wraparound, Tab cycle, backdrop close, screen-reader announcement, Lighthouse CLS).
  - `19-VALIDATION.md` — 5 success criteria mapped to evidence.

## Commits

- `54b9dab` feat(19-05): assemble /2023 page + Vitest build tests (page structure + lightbox a11y) + UAT + gates + VALIDATION

## Validation

`pnpm build` GREEN (156 pages, incl. new `/2023/index.html` + `/en/2023/index.html`). `pnpm test` 160/165 — 5 failures are pre-existing SPKR-01 carry-over (documented in STATE.md). Phase 19 adds 25 new green assertions.

## Content Gates / Placeholders

- I18N-03 FR+EN brand copy — organizer sign-off.
- EDIT-07 stats verification + real gallery URL.
- D-03 Stitch visual approval for `/2023`.
- A11Y-03 / EDIT-05 10 manual keyboard UAT items.

See `content-gates.md` for the canonical list.

## Downstream Impact

- 21-02 wires the homepage `PastEditionMinimal` 2023 block to `/2023` (discovery-loop CTA), using the route delivered here.
- Phase 22 closes the 10 manual UAT items + Stitch approval + Lighthouse CLS capture.
