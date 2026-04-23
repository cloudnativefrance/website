# Deferred Items — Phase 18

## Pre-existing test failures (out of scope for 18-01)

- `tests/build/speakers-grid.test.ts`: 5 failing tests against EN speaker grid
  (order + presence of names). Present on HEAD before 18-01 changes. Unrelated
  to venue cleanup. Belongs to a future speakers-page fix phase.

## Pre-existing tsc errors (out of scope for 18-01)

- `src/content.config.ts` lines 110, 127: `TS2322` on Astro content loader
  typing. Pre-existing on HEAD. Astro content-collection API drift, not caused
  by this plan. `pnpm build` is green regardless (Astro's own type pipeline
  accepts the config).
