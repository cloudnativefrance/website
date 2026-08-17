# Testing

Three commands cover the automated surface. Run them before opening a PR and keep them green for the code you touched.

## Commands

- **`pnpm test`** — alias for `pnpm vitest run`. Two Vitest projects (see `vitest.config.ts`):
  - `unit` — everything except the component tests: `src/lib/__tests__/*.test.ts` and the build-output integration tests in `tests/build/*.test.ts`.
  - `astro-components` — `src/components/**/__tests__/*.test.ts`, which render real components through the Astro container API.
- **`pnpm vitest run {file}`** — run a single test file. Useful for tight feedback loops: `pnpm vitest run src/lib/__tests__/schedule-filter.test.ts`.
- **`pnpm astro check`** — TypeScript + Astro diagnostics over the whole source tree. Catches schema drift, broken imports, type mismatches.
- **`pnpm astro build`** — end-to-end static bundle build. Produces `dist/` and surfaces any build-time runtime errors (CSV parse issues, i18n lookup misses, Astro component mount errors).

The build-output tests under `tests/build/` read from `dist/`. **Run `pnpm build` before running them** — roughly two dozen tests fail spuriously against a missing or stale `dist/`. There is no shared helper: `speaker-profile.test.ts` and `speaker-talks.test.ts` each define a local `readPage()` that throws a "Run 'pnpm build'" message, while newer files such as `programme-redesign.test.ts` call `readFileSync` directly and surface a raw `ENOENT`.

## The token-skip hazard

The authenticated Pretalx tests are gated on a token being present:

- `tests/build/pretalx-speakers.test.ts` — `describe.skipIf(!hasToken)`, 6 tests
- `tests/build/pretalx-levels.test.ts` — 3 tests, including the only assertion that the level allowlist actually filters

Without a token these **skip — they do not pass**. A green run proves nothing about them.

This matters because **CI has no `PRETALX_API_TOKEN`**: `.github/workflows/test.yml` sets no `env:` block, so every CI run skips all 9 and exits 0. The same job's `pnpm build` therefore also produces a `dist/` with no speaker companies, no roles and no level chips, and nothing asserts otherwise.

Locally the token comes from `.env.local` (see [`updating-content.md`](./updating-content.md#running-locally-with-the-pretalx-token)), so these run for real. Check the run's **skip count**, not just the pass count, before treating a green suite as clearance.

## Known failures

### Blocking — the keynote merge gates

`tests/build/pretalx-speakers.test.ts`:

- `MERGE GATE: every keynote cast member exists in Pretalx`
- `no speaker page that exists today silently disappears`

Both are **red on purpose** and must be green before this branch merges. Ten keynote speakers listed in `src/data/keynote-cast.ts` do not yet exist as people in Pretalx — they are currently folded into the "Keynote d'ouverture" submission, whose only declared speaker is the MC. Create them in the Pretalx organiser UI (`/speakers/` is read-only over the API) and both go green.

Do **not** reclassify these as non-blocking. Note also that they are token-gated, so per the section above they vanish silently in CI rather than failing.

### Non-blocking

None currently.

## What to do when a test fails in your PR

1. If the failure is one of the two keynote gates above → note it in the PR description, do not block on it.
2. If the failure is new → fix it. "New" means: did not exist before your branch; introduced by your changes; or was flagged as newly uncovered code.
3. Uncertain which bucket you're in? Rebase onto `main`, run the commands, and compare. If the same failure reproduces on `main`, it's pre-existing.

A font-fetch error (`Cannot fetch the given font file`) in the `astro-components` project means Astro's cached font URL has gone stale, usually after a `rm -rf .astro`. Clear `.astro/fonts` and re-run.

## What is NOT covered by automated tests

Visual correctness, copy tone, and Stitch-design fidelity are human-review concerns. The Stitch-first rule (see `CONTRIBUTING.md`) means visual work arrives with a design artefact reviewers can diff against the implementation — that IS the visual test.

Accessibility is partly covered and partly not. The build-output tests pin the *markup* that a11y behaviour rests on — the modal's `tabindex="-1"`/`role="dialog"`/`aria-modal`, the drawer's `inert`, the result count's `aria-live`. The **behaviour** — focus trapping, focus restore, Escape handling — is not tested, because there is no browser test runner in this repo. Changes to `src/components/schedule/schedule-ui.ts` around focus need manual keyboard verification.
