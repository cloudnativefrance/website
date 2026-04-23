# Phase 20 Summary — Animated Testimonials Strip

**Completed:** 2026-04-14
**Status:** Complete
**Requirements satisfied:** TEST-01, TEST-02, TEST-03, A11Y-01, A11Y-02

## Overview

Shipped the final v1.1 homepage section: a CSS-only marquee-animated testimonials strip rendering 3 placeholder FR/EN quotes on `/` and `/en/`, with full WCAG 2.2.2 motion handling. Duplicated-track infinite horizontal scroll at 40s linear; pauses on `:hover` and `:focus-within`; under `prefers-reduced-motion: reduce` the animation is neutralized AND a horizontal-scroll snap fallback takes over; duplicate track is `inert` + `aria-hidden="true"`.

Zero JavaScript shipped — plain `.astro` SFC + scoped `<style>`.

## Plans

- **20-01** Data + component scaffold (3 commits)
  - `55038b1` feat(20-01): add testimonials-data.ts with 3 placeholder entries
  - `8cc92f7` feat(20-01): scaffold TestimonialsStrip.astro with dual-track markup
  - `055a80f` test(20-01): assert TEST-03 testimonials-data shape + i18n-key resolution
- **20-02** Marquee CSS + a11y contract (2 commits)
  - `5ab3731` feat(20-02): add marquee animation + pause + reduced-motion CSS
  - `2160f49` test(20-02): assert marquee CSS + reduced-motion + inert dup-track
- **20-03** Homepage mount + VALIDATION (3 commits)
  - `1785d90` feat(20-03): mount TestimonialsStrip on / and /en/
  - `5d631f2` test(20-03): assert TEST-01 homepage testimonials mount on both locales
  - docs(20-03): Phase 20 VALIDATION — SC1-5 evidence mapping (next commit)

## Success Criteria

All 5 SC satisfied per `20-VALIDATION.md`:

1. **SC1** — Strip renders on `/` and `/en/` with 3 placeholder quotes — dist assertions pass.
2. **SC2** — Duplicated-track marquee, 40s infinite, pauses on hover+focus, reduced-motion disables animation — source assertions pass.
3. **SC3** — Duplicate track `aria-hidden="true"` + `inert` (strictly stronger than per-descendant `tabindex="-1"`).
4. **SC4** — Attributions clearly non-real (single-letter names + `fictive/placeholder/imaginaire` markers); tracker `testimonials-real-quotes` in file header.
5. **SC5** — Zero JS bundle delta: component ships as `.astro` + CSS, no `client:*` directives. Direct bundle-diff vs Phase 19 deferred since Phase 19 not yet shipped; justification documented in VALIDATION.

## Decisions

12 decisions recorded in `20-CONTEXT.md` (D-01…D-12), all honored per VALIDATION traceability table.

Key note: No new Stitch round needed — visual contract for the marquee (direction, pause affordance, quote-led card) was already locked in `15-CONTEXT.md` §Testimonials Marquee (D-07/D-08/D-09 Phase 15). Phase 20 implements the locked design.

## Placeholders awaiting sign-off

- **Real testimonial copy** (tracker: `testimonials-real-quotes`) — placeholder attributions are clearly fabricated; organizer must supply real quotes + attributions before v1.2.
- **Playwright reduced-motion browser test** — deferred (source+dist Vitest contract is the Phase 20 gate; can be added in a future a11y-regression phase).

## Test evidence

- `pnpm build` — exits 0
- `pnpm vitest run tests/build/{testimonials-data,testimonials-strip-source,homepage-testimonials-mount}.test.ts` — 22/22 pass
- `pnpm vitest run tests/build/` — full suite: Phase 20 tests 22/22 pass. Pre-existing `speakers-grid.test.ts` failure (5 failed / 6 passed) confirmed identical at baseline commit `95862ac` (not caused by Phase 20).

## Milestone status

Phase 20 closes out v1.1 "Past Editions Showcase" milestone scope (remaining: Phase 19 — 2023 section + lightbox). After Phase 19 merges, v1.1 is shipped.
