# Phase 20 Validation — Animated Testimonials Strip

**Date:** 2026-04-14
**Status:** PASS
**Requirements satisfied:** TEST-01, TEST-02, TEST-03, A11Y-01, A11Y-02

## Success Criteria Mapping

| SC | Criterion | Evidence |
|----|-----------|----------|
| SC1 | `/` and `/en/` render a testimonials strip with 3 placeholder quotes from `testimonials-data.ts` | `tests/build/homepage-testimonials-mount.test.ts` asserts 6 `<blockquote>` (3 canonical + 3 duplicate) in both `dist/index.html` and `dist/en/index.html`. Component reads from `TESTIMONIALS` in `src/lib/testimonials-data.ts` (3 entries, verified by `tests/build/testimonials-data.test.ts`). |
| SC2 | Duplicated-track infinite horizontal marquee, pauses on `:hover` and `:focus-within`; reduced-motion resolves `animation: none` | `tests/build/testimonials-strip-source.test.ts` asserts `@keyframes scroll-x`, `animation: scroll-x 40s linear infinite`, `:hover`/`:focus-within` → `animation-play-state: paused`, and `@media (prefers-reduced-motion: reduce) { animation: none; overflow-x: auto; scroll-snap-type: x mandatory }`. Playwright browser-level assertion deferred (source+dist contract is the Phase 20 gate — see 20-CONTEXT.md D-10). |
| SC3 | Duplicated track has `aria-hidden="true"`; all focusable descendants have `tabindex="-1"` equivalent (via `inert`) | `tests/build/testimonials-strip-source.test.ts` + `tests/build/homepage-testimonials-mount.test.ts` both assert the duplicate `<ul>` tag carries `aria-hidden="true"` AND `inert` (strictly stronger than per-descendant `tabindex="-1"` — `inert` removes the subtree from tab order AND the a11y tree). |
| SC4 | `testimonials-data.ts` attributions are clearly non-real; tracker issue referenced in file header | `tests/build/testimonials-data.test.ts` asserts `testimonials-real-quotes` tracker string in file header AND every attribution (FR + EN) contains a placeholder marker (`fictive` / `fictif` / `placeholder` / `imaginaire`). |
| SC5 | Zero JS bundle delta vs Phase 19 baseline OR documented justification | Component is a plain `.astro` SFC with no `client:*` directives. CSS is scoped-style block, no new runtime JS shipped. **Documented justification:** Phase 19 has not yet shipped, so a direct bundle-diff comparison against Phase 19 baseline is not applicable. The zero-JS component shape (no `client:idle`, no `client:load`, no `client:visible`) satisfies the spirit of SC5. Follow-up: re-run bundle diff once Phase 19 lands. |

## Requirement Coverage

- **TEST-01** — Strip mounted on `/` and `/en/`; dist assertions pass.
- **TEST-02** — Duplicated-track marquee with hover+focus pause; source and dist assertions pass.
- **TEST-03** — Typed 3-entry `testimonials-data.ts` with placeholder attributions; source test passes.
- **A11Y-01** — `prefers-reduced-motion` respected (global Phase 16 reset + local `animation: none` + overflow-x: auto scroll fallback).
- **A11Y-02** — Duplicate track `aria-hidden="true"` + `inert`.

## Decision Traceability

| D-ID | Locked in | Honored by |
|------|-----------|------------|
| D-01 | Data shape | Plan 20-01 Task 1 |
| D-02 | Tracker note | Plan 20-01 Task 1 |
| D-03 | 3 quotes | Plan 20-01 Task 1 + 20-01 Task 3 test |
| D-04 | Component location | Plan 20-01 Task 2 |
| D-05 | Dual-track markup | Plan 20-01 Task 2 |
| D-06 | `inert` on duplicate | Plan 20-01 Task 2 + 20-02 Task 2 test |
| D-07 | Marquee CSS | Plan 20-02 Task 1 |
| D-08 | Hover/focus pause | Plan 20-02 Task 1 + 20-02 Task 2 test |
| D-09 | Homepage mount | Plan 20-03 Task 1 |
| D-10 | Vitest-only gate | This VALIDATION |
| D-11 | 3-plan split | Executed as planned |
| D-12 | No new Stitch round | Visual contract inherited from 15-CONTEXT.md |

## Build + Test Evidence

- `pnpm build` — exits 0
- `pnpm vitest run tests/build/{testimonials-data,testimonials-strip-source,homepage-testimonials-mount}.test.ts` — 22/22 pass
- `pnpm vitest run tests/build/` — Phase 20 tests 22/22 pass. The pre-existing `speakers-grid.test.ts` failure (5 failed / 6 passed on that file) is unrelated to Phase 20: verified identical failure at baseline commit `95862ac` prior to any Phase 20 work.

## Placeholders Awaiting User Sign-Off

- Real testimonial quotes + real attributions — tracker issue `testimonials-real-quotes`; must be replaced before v1.2 ships.
- Optional: Playwright reduced-motion browser test (deferred to a future a11y-regression phase).
