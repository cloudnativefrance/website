# Plan 20-02 Summary — Marquee CSS + A11y Contract

**Date:** 2026-04-14
**Status:** Complete

## Commits
- `5ab3731` feat(20-02): add marquee animation + pause + reduced-motion CSS (TEST-02, A11Y-01)
- `2160f49` test(20-02): assert marquee CSS + reduced-motion + inert dup-track (A11Y-01/02, TEST-02)

## Outcomes
- `@keyframes scroll-x` translating 0 → -50% at 40s linear infinite.
- `.marquee:hover` and `.marquee:focus-within` pause via `animation-play-state: paused`.
- `@media (prefers-reduced-motion: reduce)` local block sets `animation: none`, enables `overflow-x: auto` + `scroll-snap-type: x mandatory` with per-card `scroll-snap-align: start`.
- Edge mask gradient (4rem fade on both sides) for visual polish.
- `tests/build/testimonials-strip-source.test.ts`: 8/8 pass — covers keyframes, duration, pause selectors, reduced-motion block, dual-track uls, duplicate `aria-hidden="true"` + `inert`, canonical track is not hidden.

## Next
Plan 20-03 — homepage mount on `/` and `/en/` + dist-level assertions + VALIDATION.md.
