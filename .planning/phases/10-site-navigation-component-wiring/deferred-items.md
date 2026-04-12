# Deferred Items — Phase 10

Out-of-scope issues discovered during execution of plan 10-01. Not caused by this plan's changes; logged here per the GSD scope-boundary rule.

## ~~Missing `@types/node` → `astro check` reports 16 errors~~ RESOLVED

- **Found:** while running the Phase 10 validation gate (`npm run astro check`)
- **Resolved:** 2026-04-12 (post-phase housekeeping)
- **Fix applied:** `pnpm add -D @types/node` (covers `fs`, `path`, `import.meta.dirname`, `__dirname`, `process` in vitest.config.ts and tests/build/*). Root `tsconfig.json` now also excludes `dagger/` — that sub-module has its own `package.json` + `tsconfig.json` and should not be type-checked by the root astro check. Result: `npm run astro check` exits with 0 errors (13 hints remain — see Zod section below).

## Zod deprecation warnings in `src/content.config.ts`

- 13 `ts(6385)` warnings about deprecated `.url()` / `.email()` signatures in Zod schemas.
- Pre-existing from Phase 2. Should be addressed when bumping Zod / Astro content config.

## Build warning: `/en/` route conflict

- `[WARN] Could not render /en from route /en/ as it conflicts with higher priority route /en`.
- Pre-existing Astro routing issue unrelated to Navigation work. Worth revisiting if EN homepage ever produces a blank response.
