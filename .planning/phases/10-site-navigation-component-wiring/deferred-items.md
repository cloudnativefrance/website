# Deferred Items — Phase 10

Out-of-scope issues discovered during execution of plan 10-01. Not caused by this plan's changes; logged here per the GSD scope-boundary rule.

## Missing `@types/node` → `astro check` reports 16 errors

- **Found:** while running the Phase 10 validation gate (`npm run astro check`)
- **Affected files (all pre-existing, not touched by 10-01):**
  - `vitest.config.ts` — `__dirname`, `path` not found
  - `dagger/src/index.ts` — `process` not found, `@dagger.io/dagger` missing declarations
  - `tests/build/speaker-profile.test.ts` — `fs`, `path`, `import.meta.dirname`
  - `tests/build/speaker-talks.test.ts` — same
  - `tests/build/speakers-grid.test.ts` — same
- **Fix (future phase):** `pnpm add -D @types/node` and add `"types": ["node"]` to the relevant `tsconfig.json`. Also install `@dagger.io/dagger` if the dagger module is still in use.
- **Impact on Phase 10:** none. `npm run build` succeeds; only the stricter `astro check` reports these errors. All Phase 10 artifacts (`Navigation.astro`, `Layout.astro`, `src/components/ui/README.md`) pass typecheck cleanly.

## Zod deprecation warnings in `src/content.config.ts`

- 13 `ts(6385)` warnings about deprecated `.url()` / `.email()` signatures in Zod schemas.
- Pre-existing from Phase 2. Should be addressed when bumping Zod / Astro content config.

## Build warning: `/en/` route conflict

- `[WARN] Could not render /en from route /en/ as it conflicts with higher priority route /en`.
- Pre-existing Astro routing issue unrelated to Navigation work. Worth revisiting if EN homepage ever produces a blank response.
