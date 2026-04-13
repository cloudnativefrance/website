---
phase: 13-speaker-schema-drift-cleanup
plan: 01
status: complete
requirements_completed: []
---

# 13-01 — Grid migration + helper hardening

## Astro-check delta

- **Before:** 33 errors in `src/pages/speakers/index.astro` + `src/pages/en/speakers/index.astro`
- **After:** 0 errors in those files
- **Remaining 9 errors in repo** (out of Phase 13 scope):
  - 3 in `src/content.config.ts` — `ts(2322) LoaderConstraint` drift from an Astro minor bump (pre-existing, unrelated to this phase)
  - 6 in `src/lib/__tests__/speakers.test.ts` — stale fixture shape; Plan 13-02 Task 4 replaces the file wholesale and these vanish

## Helper API (frozen for 13-02)

```ts
// src/lib/speakers.ts

export function getCoSpeakersForTalk(
  session: SessionRow,
  currentSpeakerSlug: string,
): string[] {
  const speakers = session.speakers ?? [];
  return speakers.filter((slug) => slug !== currentSpeakerSlug);
}

export function getPrimaryTalk(
  speakerSlug: string,
  sessions: SessionRow[],
): SessionRow | undefined {
  const list = sessions.filter((s) => (s.speakers ?? []).includes(speakerSlug));
  if (list.length === 0) return undefined;
  return [...list].sort((a, b) => {
    const aKey = a.format === "keynote" ? 0 : 1;
    const bKey = b.format === "keynote" ? 0 : 1;
    if (aKey !== bKey) return aKey - bKey;
    return a.startTime.localeCompare(b.startTime);
  })[0];
}
```

- **Returns `undefined`** when zero sessions (NOT `null`, NOT throws) — callers use `primary && (...)`.
- **Pure function**, takes `sessions: SessionRow[]` param (does NOT call `loadSessions` internally). Callers already hold the session list.

## Task 4 outcome

Both `src/pages/speakers/[slug].astro` and `src/pages/en/speakers/[slug].astro` are clean — grep for `speaker\.data\.talk(Title|Track|Duration)` returns no matches. Profile pages were already migrated in Phase 4 to source talks via `getTalksForSpeaker(lang, slug)`. **No changes made.** Confirmation-only step.

## D-07 deferral confirmed

CSV-boundary validation NOT shipped. `src/lib/schedule.ts` is byte-identical to its pre-plan state. Per CONTEXT § Claude's Discretion: deferred by default under option B because we are not otherwise touching schedule.ts.

## Commits

1. `37b59bc` test(13-01): RED — getCoSpeakersForTalk crashes on undefined speakers
2. `5fce508` feat(13-01): GREEN — getPrimaryTalk + getCoSpeakersForTalk undefined guard
3. `59c91e3` refactor(13-01): migrate speaker grid to sessions.csv lookups

## Build + runtime sanity

- `pnpm astro build` succeeds; 154 pages built in 5.69s
- `dist/speakers/` and `dist/en/speakers/` each contain 68 directories (one per speaker, incl. keynote)
- `dist/speakers/petazzoni/index.html` contains the string "Keynote" — primary-talk lookup working at build time for the keynote speaker

## Handoff to 13-02

- New test `src/lib/__tests__/speakers.test.ts` undefined-safety cases (lines appended at EOF) PASS. Plan 13-02 Task 4 must preserve D-06 coverage when it replaces the file wholesale.
- Anchor speakers for 13-02 test rewrite: `petazzoni` (confirmed keynote), other anchors TBD by 13-02 planner per D-10.
