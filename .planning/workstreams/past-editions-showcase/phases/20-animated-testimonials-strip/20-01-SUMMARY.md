# Plan 20-01 Summary — Data + Component Scaffold

**Date:** 2026-04-14
**Status:** Complete

## Commits
- `55038b1` feat(20-01): add testimonials-data.ts with 3 placeholder entries (TEST-03)
- `8cc92f7` feat(20-01): scaffold TestimonialsStrip.astro with dual-track markup (TEST-01)
- `055a80f` test(20-01): assert TEST-03 testimonials-data shape + i18n-key resolution

## Outcomes
- `src/lib/testimonials-data.ts` ships 3 typed placeholder entries with `TODO(testimonials-real-quotes)` tracker note in the file header.
- `src/components/testimonials/TestimonialsStrip.astro` renders dual `<ul class="marquee-track">` tracks (canonical + duplicate) with scaffold styling; CSS marquee animation + `prefers-reduced-motion` handling deferred to Plan 20-02.
- `tests/build/testimonials-data.test.ts` asserts: 3 entries, unique ids, all keys resolve in both locales, tracker string in source, attributions contain placeholder markers (fictive/fictif/placeholder/imaginaire).
- `pnpm build` green; `pnpm vitest run tests/build/testimonials-data.test.ts` 5/5 pass.

## Next
Plan 20-02 — marquee animation CSS + a11y attributes + source-level Vitest contract.
