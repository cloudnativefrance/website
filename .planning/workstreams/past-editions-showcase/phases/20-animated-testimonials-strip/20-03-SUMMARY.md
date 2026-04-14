# Plan 20-03 Summary — Homepage Mount + VALIDATION

**Date:** 2026-04-14
**Status:** Complete

## Commits
- `1785d90` feat(20-03): mount TestimonialsStrip on / and /en/ after 2023 section (TEST-01)
- `5d631f2` test(20-03): assert TEST-01 homepage testimonials mount on both locales
- (docs commit lands with VALIDATION in next commit)

## Outcomes
- Both `src/pages/index.astro` and `src/pages/en/index.astro` import and render `<TestimonialsStrip />` at the end of `<main>`, after `<PastEditionMinimal {...edition2023MinimalProps} />`. Section order honored (D-12 Phase 15).
- `dist/index.html` contains FR heading "Ils en parlent mieux que nous", 6 `<blockquote>`, canonical + duplicate tracks, duplicate carries `aria-hidden="true"` AND `inert`.
- `dist/en/index.html` contains EN heading "They said it better than we could", 6 `<blockquote>`, same a11y attributes.
- `tests/build/homepage-testimonials-mount.test.ts`: 9/9 pass.
- Phase 20 total: 22/22 tests passing across three new files.
- Pre-existing failure in `speakers-grid.test.ts` confirmed identical at baseline `95862ac` (unrelated to Phase 20).

## Phase 20 complete
All 5 success criteria satisfied; VALIDATION.md committed; branch ready to push.
