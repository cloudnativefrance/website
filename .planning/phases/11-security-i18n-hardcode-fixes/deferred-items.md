# Phase 11 — Deferred Items (out of scope)

## Pre-existing `pnpm astro check` errors (discovered during Plan 11-01 verification)

`pnpm astro check` reports **31 errors** that existed BEFORE Plan 11-01's edit to `src/i18n/ui.ts`. Confirmed via `git stash` of `ui.ts` — same 31 errors reproduce without the edit. Zero errors originate from `ui.ts`.

Affected files:
- `src/content.config.ts`
- `src/pages/speakers/index.astro` (properties `talkTitle`, `talkTrack`, `talkDuration` not on inferred type)
- `src/pages/en/speakers/index.astro` (same)
- `src/lib/__tests__/speakers.test.ts`

Root cause (not investigated in depth): speaker content schema in `content.config.ts` appears to lack the `talk*` fields that `index.astro` references. Likely drift from a previous phase restructure.

**Decision:** Deferred — outside Plan 11-01 scope (i18n key additions). Plan 11-02 / 11-03 do not depend on these being green. The phase verifier or a future cleanup plan should address them.
