# Testing

Three commands cover the automated surface. Run them before opening a PR and keep them green for the code you touched.

## Commands

- **`pnpm test`** — alias for `pnpm vitest run`. Runs every unit test (`src/lib/__tests__/*.test.ts`) and every build-output integration test (`tests/build/*.test.ts`).
- **`pnpm vitest run {file}`** — run a single test file. Useful for tight feedback loops: `pnpm vitest run src/lib/__tests__/cfp.test.ts`.
- **`pnpm astro check`** — TypeScript + Astro diagnostics over the whole source tree. Catches schema drift, broken imports, type mismatches.
- **`pnpm astro build`** — end-to-end static bundle build. Produces `dist/` and surfaces any build-time runtime errors (CSV parse issues, i18n lookup misses, Astro component mount errors).

The build-output tests under `tests/build/` read from `dist/` via a `readPage(relativePath)` helper. **Run `pnpm astro build` before running them.** If `dist/` is stale, the helper throws with a "Run 'pnpm build' before running tests" message pointing at the exact missing path.

## Known pre-existing failures (non-blocking)

Do not fix these in an unrelated PR. They are documented, scoped, and tracked.

### `pnpm astro check` — 3 errors in `src/content.config.ts`

Three `ts(2322) LoaderConstraint` errors on the Astro glob loaders at roughly lines 88, 110, 127. They come from an Astro minor bump that changed the loader's return-type constraint. Behavior is unaffected — loaders still run correctly, the CSV pipeline still produces the right shapes at runtime. Surface drift only. Cleanup pass belongs to a later housekeeping phase.

### `pnpm vitest run tests/build/speakers-grid.test.ts` — SPKR-01 failures

The grid test (`tests/build/speakers-grid.test.ts`) still asserts on fixture speaker names (`Marie Laurent`, `Thomas Nguyen`, etc.) that were replaced with the real 65-speaker CFP roster. Phase 13 closed SPKR-02 and SPKR-03 by rewriting the profile + co-speaker tests against real anchors (see `.planning/phases/13-speaker-schema-drift-cleanup/13-02-SUMMARY.md`) but intentionally left SPKR-01 for a follow-up. Residual drift from the same migration — same fix pattern as 13-02 Task 2 when we get to it.

## What to do when a test fails in your PR

1. If the failure is one of the two listed above → note it in the PR description, do not block on it.
2. If the failure is new → fix it. "New" means: did not exist before your branch; introduced by your changes; or was flagged as newly uncovered code.
3. Uncertain which bucket you're in? Rebase onto `main`, run the commands, and compare. If the same failure reproduces on `main`, it's pre-existing.

## What is NOT covered by automated tests

Visual correctness, copy tone, accessibility beyond keyboard semantics, and Stitch-design fidelity are all human-review concerns. The Stitch-first rule (see `CONTRIBUTING.md`) means visual work arrives with a design artefact reviewers can diff against the implementation — that IS the visual test.
