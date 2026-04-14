---
phase: 19-integrate-2023-edition-section-and-lightbox
plan: 04
type: summary
status: complete
shipped: 2026-04-14
requirements: [EDIT-05, A11Y-03]
---

# 19-04 Summary — `Edition2023Lightbox` (Astro + vanilla TS, keyboard-accessible dialog)

## What Shipped

- New `src/components/past-editions/Edition2023Lightbox.astro` — `<div role="dialog" aria-modal="true" aria-label>` overlay with close / prev / next buttons (each aria-labeled).
- Inline `<script>` controller wires:
  - Escape → close.
  - ArrowLeft / ArrowRight → navigate with wraparound.
  - Tab → focus trap cycling within the dialog.
  - Open handler stores originating `data-lightbox-trigger`, focuses close button on open.
  - Close handler restores focus to the originating trigger.
  - Body scroll locked while open.
- FR+EN i18n keys `editions.2023.lightbox.{close,prev,next,dialog_label,counter_template}`.
- Architecture choice: Astro + vanilla TS (no React) — matches `Navigation.astro` inline-script pattern; tiny bundle delta.

## Commits

- `cce70fd` feat(19-04): Edition2023Lightbox (Astro+vanilla TS) with role=dialog, focus trap, Esc/Arrow/Tab bindings + i18n keys

## Validation

`19-VALIDATION.md` SC3 — PASS (static) + manual UAT pending. `tests/build/edition-2023-lightbox-a11y.test.ts` asserts `role="dialog"`, `aria-modal`, aria-labels on close/prev/next, presence of `Escape` / `ArrowLeft` / `ArrowRight` / `Tab` branches + focus-return + body-scroll-lock in the compiled script. Full keyboard journey (10 items) deferred to `19-UAT.md` manual run → Phase 22.

## Content Gates / Placeholders

- Manual keyboard-journey UAT checkboxes (10 items) in `19-UAT.md` → Phase 22 closeout.

## Downstream Impact

- 19-05 mounts the lightbox component on `/2023` + `/en/2023`.
- Phase 22 closes the 10 manual keyboard items and records Lighthouse CLS.
