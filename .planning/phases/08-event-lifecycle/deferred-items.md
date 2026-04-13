## 08-01 deferred (pre-existing, out of scope)

- `pnpm astro check` reports 33 errors in `src/pages/speakers/index.astro` (missing `talkTitle` and related properties). Pre-existing, unrelated to cfp.ts or ui.ts.
- `pnpm test` reports pre-existing failures in `tests/build/speaker-profile.test.ts` and `tests/build/speaker-talks.test.ts` (SPKR-02/03). Unrelated to Phase 08 work.

These were not introduced by plan 08-01. New test `src/lib/__tests__/cfp.test.ts` passes 14/14.
