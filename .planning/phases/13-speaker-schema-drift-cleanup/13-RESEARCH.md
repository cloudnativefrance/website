# Phase 13: Speaker Schema Drift Cleanup — Research

**Researched:** 2026-04-13
**Domain:** Astro 5 content collections → custom data-loader migration (CSV source-of-truth)
**Confidence:** HIGH (all findings grounded in direct reads of the working tree)

## Summary

Phase 13 closes a two-part tech-debt gap left by the Phase 10-ish migration from a
speakers-own-their-talk schema to the current **single-source sessions.csv** model:

1. **Grid pages dereference fields that no longer exist** on the speaker Zod schema
   (`talkTitle`, `talkTrack`, `talkDuration`). The fix is to join speakers → sessions
   at build time via the existing `loadSessions()` helper — never to re-introduce
   the dead columns.
2. **Two "build-output" test suites crash** before reaching their real assertions.
   `tests/build/speaker-talks.test.ts` depends on built HTML for seed slugs
   (`speaker-5`, `speaker-6`) that **no longer exist in speakers.csv**; Phase 13's
   CONTEXT D-08 says *"make failing tests pass without modifying assertions"* but
   research shows those assertions reference deleted fixture identities and cannot
   be satisfied without data regression. **This is the single biggest finding: the
   planner MUST surface this to the user before executing.**

There is a separate real bug inside `getCoSpeakersForTalk` that CONTEXT D-06 already
calls out (undefined-safety), plus a dead `getLocale` import in the unit test file
that has nothing to do with the CONTEXT-named SPKR tests.

**Primary recommendation:** Do the grid migration + helper hardening in full, but
stop and escalate on the two build-output suites. They are not fixable within the
D-08 "don't change assertions" constraint — their fixtures are historical.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01** Talk info (title / track / duration / format / language / start time) is sourced exclusively from `sessions.csv` via `loadSessions()`. Speaker pages must NOT reference `talkTitle`, `talkTrack`, `talkDuration`, or any `talk*` field on the speaker record — those fields never existed in speakers.csv and must not be re-introduced to the Zod schema.
- **D-02** `keynote: boolean` on the speaker record stays — it is a legitimate speaker-level attribute (used by the grid to group keynotes first per Phase 4 D-02). Do not migrate it to sessions.
- **D-03** The `/speakers` and `/en/speakers` grid cards continue to display the speaker's primary talk info (title, track, duration). Data source: `sessions.find(s => s.speakers.includes(speaker.slug))` at build time. No UI redesign — existing card layout stays; only the data flow changes.
- **D-04** "Primary talk" selection when a speaker has multiple sessions: prefer keynote, then earliest `startTime`. Deterministic and testable.
- **D-05** When a speaker has zero sessions in the CSV: the card renders name + role + photo + keynote badge (if applicable), and the talk info block is omitted gracefully (no empty strings, no broken markup).
- **D-06** `getCoSpeakersForTalk` must defend against `undefined` / `null` speakers arrays — return `[]` early when the field is missing.
- **D-07** Add CSV-boundary validation in `loadSessions()` (or the Zod session schema): reject sessions with zero valid speakers. Logs a warning in dev, throws in CI. (Out-of-scope option — implementer's call during planning.)
- **D-08** Phase 13 makes `tests/build/speaker-profile.test.ts` and `tests/build/speaker-talks.test.ts` pass without modifying the tests' expectations. If a test's expected behavior is wrong (not just a data/helper bug), flag it inline and ask before changing the assertion.
- **D-09** No new test cases added beyond what's needed to cover the helper-hardening decision (D-06) — one or two focused `getCoSpeakersForTalk` unit tests in `src/lib/__tests__/speakers.test.ts` for the `undefined-speakers` edge case. Broader coverage is out of scope.

### Claude's Discretion

- The exact migration pattern on the grid page (inline `.find()` vs a pre-computed `Map<slug, SessionRow>` built once at module scope)
- How the primary-talk helper is named and where it lives (`src/lib/speakers.ts` vs a new helper file)
- Whether CSV-boundary validation (D-07) ships in Phase 13 or is deferred — both acceptable
- Whether to fix the pre-existing vitest config issue that causes the `src/lib/__tests__/speakers.test.ts` env mismatch (node env, no DOM needed)

### Deferred Ideas (OUT OF SCOPE)

- Dedicated schema migration tooling (Google Sheets validator in CI)
- Richer "See all my sessions" UI on speaker profiles when a speaker has 2+ sessions
- Backfill CSV `language` / `level` on existing sessions (data-ops, not code)
</user_constraints>

## Project Constraints (from CLAUDE.md)

1. **CSVs are the single source of truth** for speakers/sessions/sponsors/team. Never
   hardcode speaker/session data in `.astro`, `.ts`, or `.tsx`. All reads go through
   the CSV loaders (`loadSessions`, `getCollection("speakers")`, etc.).
2. **Schema changes must propagate end-to-end** — Google Sheet → CSV parser →
   Zod schema → downstream consumers. Phase 13 must NOT ship a schema change that
   lives only in Zod.
3. **Stitch-first for visual work** — Phase 13 is explicitly a data-flow migration
   with no UI redesign (CONTEXT D-03 "existing card layout stays"), so the
   stitch-first rule does not trigger here. Flag in the plan for the planner so
   no one wastes time on a Stitch review.

## Phase Requirements

(No formal REQ-IDs — Phase 13 is remediation of prior phases. CONTEXT decisions D-01..D-09 serve as the functional requirement set. SPKR-02 and SPKR-03 test IDs from Phase 4 are the named pass targets per D-08.)

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — speakers.csv and sessions.csv are the only stateful stores; neither contains `talk*` columns, so no data migration needed. Confirmed by `Read src/content/schedule/speakers.csv` (header row has no `talkTitle`/`talkTrack`/`talkDuration`). | none |
| Live service config | None. Google Sheets schema is already stale-free (the dead columns were removed from the sheet at the Phase 10 migration); the sole drift is in `.astro` code. | none |
| OS-registered state | None — this is a static site build. | none |
| Secrets / env vars | None touched. `SCHEDULE_SESSIONS_CSV_URL` / `SCHEDULE_SPEAKERS_CSV_URL` are read, not written. | none |
| Build artifacts | `dist/` output must be regenerated for the two build-output test suites (they read `dist/speakers/*/index.html`). Planner must wire `pnpm build` before `pnpm test` runs in the verification step. | rebuild before tests |

**Canonical question answered:** After every file in the repo is updated, what
runtime state still has the old string? → Nothing. This is a pure code fix.

## Standard Stack

The stack is **locked** — no new libraries. Everything below is already in use.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 5.x | Static builder, content collections | Project's framework; speakers use `defineCollection` with a custom CSV loader [VERIFIED: `src/content.config.ts`] |
| Zod (via `astro/zod`) | bundled with Astro 5 | Speaker-schema validation at the content-collection boundary | Already wired at `src/content.config.ts:87-107` [VERIFIED] |
| Vitest | — (not inspected) | Test runner, node env | `vitest.config.ts` — env "node", alias `@` → `./src` [VERIFIED: `vitest.config.ts`] |

### Supporting (already imported by target files)
| Library | Purpose | When to Use |
|---------|---------|-------------|
| `@/lib/schedule` — `loadSessions()` / `SessionRow` | Cached async session loader | The ONLY legitimate source of talk metadata; use in grid index pages [VERIFIED: `src/lib/schedule.ts:107`] |
| `@/lib/speakers` — existing helpers | Speaker collection queries | Extend here; do not create a new file unless the function is genuinely session-only |

### Alternatives Considered
None. CONTEXT locks the stack; the Claude's Discretion items are purely structural choices inside files that already exist.

**Installation:** No new packages. Do NOT run `pnpm add` anything in this phase.

## Architecture Patterns

### Project Structure (observed, not prescriptive)
```
src/
├── lib/
│   ├── schedule.ts           # loadSessions, SessionRow, list* helpers — canonical session source
│   ├── speakers.ts           # getAllSpeakers, getTalksForSpeaker, getCoSpeakersForTalk
│   └── __tests__/
│       └── speakers.test.ts  # unit tests (stale — see Common Pitfalls)
├── pages/
│   ├── speakers/index.astro           # FR grid (broken)
│   ├── speakers/[slug].astro          # FR profile (works, migrated in Phase 4)
│   ├── en/speakers/index.astro        # EN grid (broken, identical bug to FR)
│   └── en/speakers/[slug].astro       # EN profile (works)
├── content.config.ts                   # Zod schemas + csvLoader factory
└── content/schedule/
    ├── speakers.csv                    # columns: slug,name,photo_url,company,role,bio,twitter,linkedin,github,bluesky,website,keynote
    └── sessions.csv                    # speakers col is a comma-separated list of slugs
```

### Pattern 1: Build-time join by pre-computing a Map (prescribed)

**What:** In each grid page's frontmatter, load sessions once and build a
`Map<speakerSlug, SessionRow[]>` before the template runs. Look up per-speaker
sessions in O(1) in the template.

**When to use:** Any `.astro` page that renders a list of speakers and needs a
per-speaker session reference. Phase 4's `[slug].astro` doesn't need this pattern
because it only resolves one speaker, but the grid pages iterate ~65 speakers.

**Why prescribed over inline `sessions.find(...)`:** 65 speakers × ~30 sessions =
~2000 linear scans per page build. The Map is ~O(sessions) to build and
O(speakers) to look up — ~10× cheaper at build time and semantically clearer.
There is precedent: `src/pages/speakers/[slug].astro:27` already builds
`speakerNameBySlug` as a Map for the co-speaker name resolution — **follow the
same idiom**.

**Example:**
```ts
// Source: pattern adapted from src/pages/speakers/[slug].astro:27
// and src/components/schedule/ScheduleGrid.astro:55 (speakerNames: Map usage)
import { loadSessions, type SessionRow } from "@/lib/schedule";

const sessions = await loadSessions();

// Build slug → sessions[] map once (O(sessions))
const sessionsBySpeaker = new Map<string, SessionRow[]>();
for (const s of sessions) {
  for (const slug of s.speakers ?? []) {
    const list = sessionsBySpeaker.get(slug) ?? [];
    list.push(s);
    sessionsBySpeaker.set(slug, list);
  }
}

// Primary-talk selection per D-04: keynote first, then earliest startTime
function getPrimaryTalk(speakerSlug: string): SessionRow | undefined {
  const list = sessionsBySpeaker.get(speakerSlug) ?? [];
  if (list.length === 0) return undefined;
  return [...list].sort((a, b) => {
    const aKey = a.format === "keynote" ? 0 : 1;
    const bKey = b.format === "keynote" ? 0 : 1;
    if (aKey !== bKey) return aKey - bKey;
    return a.startTime.localeCompare(b.startTime);
  })[0];
}
```

### Pattern 2: Helper location

**Prescribed:** add `getPrimaryTalk(speakerSlug, sessions)` to `src/lib/speakers.ts`.

**Signature:**
```ts
export function getPrimaryTalk(
  speakerSlug: string,
  sessions: SessionRow[],
): SessionRow | undefined
```

**Rationale:**
- `src/lib/speakers.ts` already imports `SessionRow` from `./schedule`
  (line 3: `import { loadSessions, type SessionRow } from "./schedule";`) and
  already owns speaker↔session joining logic (`getTalksForSpeaker`, line 32).
- `src/lib/schedule.ts` is session-centric; it should not grow
  speaker-awareness.
- Do NOT create a new file. Existing file layout has one lib file per entity
  (`speakers.ts`, `schedule.ts`, `remote-csv.ts`, `cfp.ts`). A new
  `primary-talk.ts` would be out-of-pattern.

Take `sessions` as a parameter rather than calling `loadSessions()` internally
so the grid page can build the `Map` once and reuse it; this mirrors `getCoSpeakersForTalk(session, slug)` which is also parameter-driven.

### Pattern 3: Grid card conditional rendering (for D-05, zero-session speaker)

**What:** Wrap the talk-info block in a `{primaryTalk && (...)}` guard, not in
individual `{speaker.data.talkTitle && ...}` guards per field. One guard, one
scope — no broken markup when `primaryTalk` is `undefined`.

**Example (the `regular` grid card after migration):**
```astro
{primaryTalk && (
  <p class="mt-2 text-[13px] text-muted-foreground line-clamp-2">
    {primaryTalk.title}
  </p>
)}
```

For the keynote rail (which today has four independent `talkTitle`/`talkDuration`/`talkTrack` guards), collapse to one outer guard around the whole "quote + duration · track" block.

### Anti-Patterns to Avoid

- **Re-adding `talkTitle` / `talkTrack` / `talkDuration` to the Zod speakers
  schema.** Forbidden by D-01 and by CLAUDE.md § Data Rules (the CSV doesn't
  have them).
- **Denormalising sessions into speaker records at load time** (e.g., mutating
  `speaker.data` to include a `primaryTalk` field). The speaker collection is
  immutable from `getCollection("speakers")`; mutating its entries mutates the
  Astro collection cache. Pass the resolved `primaryTalk` alongside the speaker
  in a separate local structure instead.
- **Calling `loadSessions()` inside the `.map()` loop** on grid pages. Call it
  once in frontmatter.
- **`it.skip(...)` on failing tests** to make them green. D-08 forbids it.
- **Weakening the Zod schema** (e.g., making `speakers` an optional / nullable
  array on `SessionRow`) to silence the helper bug. D-06 says defend *at the
  helper*, not at the type. (Separately, if D-07 is adopted, the Zod schema
  for sessions gets *stricter*, not looser — reject zero-speaker rows.)
- **Using `.find(s => s.speakers.includes(slug))` inline in the template** for
  every speaker. Prefer the Map (Pattern 1).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Parsing sessions.csv | Ad-hoc fetch + CSV parse | `loadSessions()` [`src/lib/schedule.ts:107`] | Already handles remote/fallback fetch + RFC-4180-ish parse + status filtering + caching |
| Speaker collection access | `readFileSync` on CSV | `getAllSpeakers()` [`src/lib/speakers.ts:14`] / `getCollection("speakers")` | Runs through the Zod schema — any missing transform will surface as a build error, which is the whole point |
| "Speaker has this session" lookup inside a hot loop | `sessions.filter(...)` per speaker | Pre-computed `Map<slug, SessionRow[]>` (Pattern 1) | O(N×M) at build, already an established idiom in `speakerNameBySlug` (Phase 4) |
| Validating speakers list on a session | Inline `.filter(Boolean).length > 0` in every consumer | CSV-boundary check inside `loadSessions()` body (line 137-163) OR reject at Zod time if D-07 is adopted | One validation, one place; helpers stay thin |

**Key insight:** This phase is almost entirely *removing* hand-rolled surface
area (the dead `talk*` references). The only new helper is `getPrimaryTalk`,
which is 6 lines.

## Common Pitfalls

### Pitfall 1: **The two target tests cannot pass against current CSV data**  **(CRITICAL — escalate before executing)**

**What goes wrong:** `tests/build/speaker-profile.test.ts` and
`tests/build/speaker-talks.test.ts` assert on fixture identities that were
**deleted** from the working tree in an earlier migration:

| Test asserts | Actual state in `src/content/schedule/speakers.csv` |
|---|---|
| Slugs `speaker-1`..`speaker-6` must have built pages | Slugs are `petazzoni`, `vache`, `saboni`, ..., `victor-coutellier` (65 entries). **Zero overlap.** |
| `"Marie Laurent"`, `"Thomas Nguyen"`, `"Sarah Chen"`, `"Lucas Martin"`, `"Amina Diallo"`, `"David Moreau"` | Names in current CSV: `Jérôme Petazzoni`, `Aurélie Vache`, `Amine Saboni`, ... |
| `speaker-5` has a talk with title containing `"CI/CD"` | No such slug; no session with "CI/CD" in `sessions.csv` header row I inspected |
| `speaker-4` has two talks (Zero Trust + eBPF) | No such slug |
| FR i18n back-button text `"Retour aux speakers"` | Not verified; depends on i18n dict — **planner must grep `src/i18n` before asserting this is OK** |

**Why it happens:** The tests were authored against a 6-speaker sample content
set that was later replaced with the real CFP speaker list. The `talkTitle`
error in `src/pages/speakers/index.astro` and the `session.speakers`-undefined
error are both *downstream symptoms of the same historical event* — and the
tests are *upstream* artefacts of that same event.

**Why D-08 does not save us here:** D-08 says "make failing tests pass without
modifying the tests' expectations". The expectations reference deleted data.
The only ways to make them pass are:
1. **Restore the fixture speakers** (re-insert `speaker-1`..`speaker-6` rows
   into the CSVs) — but this contradicts D-01 (CSVs as SoT) and pollutes the
   real speaker list shown to users.
2. **Edit the assertions** — but D-08 forbids this without explicit user
   flag-and-ask.
3. **Swap to a separate fixture CSV only for test builds** — a sizable
   scope expansion (new fixture plumbing, build-mode detection,
   env-var-driven CSV path). Could be an option, but beyond "make the tests
   green".

**How to avoid:** The planner MUST NOT plan a Wave that blindly targets
"make `speaker-talks.test.ts` green". The plan should instead include:
- A **non-skippable escalation step** at the top of the wave: "Read both test
  files, verify fixture identities vs. `src/content/schedule/speakers.csv`,
  and present the planner's findings to the user with three options (restore
  fixtures / rewrite assertions against current CSV / migrate tests to a
  separate fixture dir)."
- Only after the user picks an option does the actual test-fix work begin.

**Warning signs:** Any plan step that says "run `pnpm test tests/build/`" as
verification before resolving the fixture-identity question will fail with
the same error it does today, dressed up in new clothes.

### Pitfall 2: `session.speakers` can be undefined in TYPES but not in PRACTICE today

**What goes wrong:** CONTEXT D-06 says `getCoSpeakersForTalk` "throws
`TypeError: Cannot read properties of undefined (reading 'filter')` on one test".

**Root cause confirmed by read of `src/lib/schedule.ts:141-144`:**
```ts
speakers: (r[iSpeakers] ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean),
```
Live runtime `SessionRow.speakers` from `loadSessions()` is **always an array**
(possibly empty, never undefined). The Zod-typed `SessionRow` interface also
types it as `string[]` (not `string[] | undefined`, line 12).

**So where does `undefined` come from?** From the **test fixtures** in
`src/lib/__tests__/speakers.test.ts` — which inject objects shaped like:
```ts
{ id: "fr/talk-5", data: { title: "...", speaker: "speaker-5", cospeakers: ["speaker-6"], ... } }
```
Note the shape — `data.speaker` (singular) + `data.cospeakers` (plural), NOT a
`speakers: string[]` array. Those fixtures match a **previous** `talks` content
collection shape, not the current `SessionRow`. When `getCoSpeakersForTalk`
(which reads `session.speakers`, not `session.data.speakers`) is called with
one of these fixture objects, `session.speakers` is `undefined` → `.filter`
throws.

**Implication for D-06:** The D-06 fix (guard against undefined) is correct
and cheap — it also defends against a future Zod schema change or a bad CSV
row. But it will NOT make `src/lib/__tests__/speakers.test.ts` pass on its
own, because that test file also:
- imports a no-longer-exported `getLocale` (line 98) → module import crashes
- mocks a `talks` collection (line 193: `getCollection("talks")`) that no
  longer exists
- expects `getTalksForSpeaker` to return objects with `data.speaker` /
  `data.cospeakers` shape
- has 30+ assertions against fixture identities that do not match reality

**Recommendation:** D-09 allows "one or two focused `getCoSpeakersForTalk`
unit tests for the undefined-speakers edge case". The minimal path is:
  1. Delete the entire existing `src/lib/__tests__/speakers.test.ts` content
     (it is stale top-to-bottom).
  2. Write a new ~30-line test file covering `getCoSpeakersForTalk` with
     three cases: normal array, empty array, undefined.
  3. Escalate to the user: "The existing speakers unit test is fully stale;
     we are replacing its contents, not patching it. D-09 allows this."

### Pitfall 3: `keynote.data.talkTitle` on nullable keynote

The keynote rail logic is `const keynote = speakers.find((s) => s.data.keynote);`
→ nullable. Today's template guards with `{keynote && (...)}` at the outer
level, then `{keynote.data.talkTitle && (...)}` inside. After migration, the
`primaryKeynoteTalk` will *also* be nullable (the keynote speaker might have
no session, or more than one). Outer guard stays; inner guard becomes
`{primaryKeynoteTalk && (...)}`.

### Pitfall 4: Multiple keynotes in the data

Today `speakers.csv` has exactly one `keynote: true` row (`petazzoni`).
Template uses `.find(...)` — so if a second keynote is ever added, only the
first one will render. Out of scope for Phase 13 per CONTEXT (no UI redesign),
but worth a one-line code comment as you touch the block.

### Pitfall 5: i18n strings are assumed, not verified

The test `speaker-profile.test.ts` asserts `"Retour aux speakers"` (FR) and
`"Back to speakers"` (EN). Neither is confirmed in this research (no `src/i18n`
audit). **Planner must grep `src/i18n` for `speakers.back` before estimating
effort on test fixes** — if the key has drifted, the tests fail for yet
another reason.

### Pitfall 6: `content.config.ts` has its own `parseCsv` — duplicated

Noted for context only: CSV parsing is duplicated between `src/lib/schedule.ts`
and `src/content.config.ts` (explicit comment at line 11-13 of
`content.config.ts` says this is intentional). Any parser bug must be fixed in
both places. Phase 13 does not need parser changes — flagging for future
phases only.

### Pitfall 7: Build must precede test run

`tests/build/*.test.ts` all read from `dist/`:
```ts
const DIST = resolve(import.meta.dirname, "../../dist");
```
If the planner wires `pnpm test` as verification, it must also wire `pnpm build`
immediately prior. This is project convention (see
`tests/build/speakers-grid.test.ts:16-22` error message: "Run 'pnpm build'
before running tests").

## Co-Speaker Helper Audit

### Current implementation (`src/lib/speakers.ts:50-55`)
```ts
export function getCoSpeakersForTalk(
  session: SessionRow,
  currentSpeakerSlug: string,
): string[] {
  return session.speakers.filter((slug) => slug !== currentSpeakerSlug);
}
```

### Undefined-path enumeration

| Caller | Risk path |
|---|---|
| `src/pages/speakers/[slug].astro:61` (production FR profile) | Calls with `talk` returned from `getTalksForSpeaker` → goes through `loadSessions()` → `speakers` is always `string[]`. **No risk today.** |
| `src/pages/en/speakers/[slug].astro:61` (production EN profile) | Same as above. **No risk today.** |
| `src/lib/__tests__/speakers.test.ts:270,277,284,290,291` (unit test) | Injects fixture objects that **do not have** a `session.speakers` array (shape mismatch — fixture has `data.speaker` singular). **This is where the crash comes from.** |

### All call sites (verified via `Grep "getCoSpeakersForTalk"`)
- `src/pages/speakers/[slug].astro:61` — production
- `src/pages/en/speakers/[slug].astro:61` — production
- `src/lib/__tests__/speakers.test.ts:270, 277, 284, 290, 291` — stale unit test

No other call sites. The helper is NOT used on the grid index pages today and
should NOT be added there by the migration (grid cards show "this speaker's
own talk", not co-speakers).

### Prescribed D-06 fix (one-liner defense + named-return decision)

```ts
export function getCoSpeakersForTalk(
  session: SessionRow,
  currentSpeakerSlug: string,
): string[] {
  const speakers = session.speakers ?? [];
  return speakers.filter((slug) => slug !== currentSpeakerSlug);
}
```

**Return-shape decision:** return `[]`, do NOT throw.
- The only production callers (`[slug].astro`) use the result to decide
  whether to render a "co-speakers" section. An empty array is the natural
  "no co-speakers" signal — a throw would crash the entire page build on one
  bad row.
- CONTEXT D-07 (optional, planner's discretion) proposes a CSV-boundary
  validator that *does* throw / warn. That is the right layer for noisy
  failure.
- A named error (e.g., `throw new MissingSpeakersError(session.id)`) would
  conflate two concerns: "helper got weird data" vs "our CSV is wrong". Keep
  them separate.

## Optional D-07 Implementation (if adopted)

### Where the check goes
`src/lib/schedule.ts`, inside the `.filter(...)` chain at line 163:

```ts
  return body
    .map((r): SessionRow => ({ ...existing... }))
    .filter((s) => s.status !== "hidden" && s.id)
    .filter((s) => {                                  // NEW
      if (s.speakers.length === 0) {
        const msg = `sessions.csv row ${s.id} has no valid speakers`;
        if (process.env.NODE_ENV === "production" || process.env.CI) {
          throw new Error(msg);
        }
        // Dev: warn but don't crash the local build
        console.warn(`[loadSessions] ${msg}`);
        return false;                                  // drop the row
      }
      return true;
    });
```

### Why not Zod?
The sessions collection is NOT a Zod-validated Astro content collection. It is
loaded by `loadSessions()` directly — there is no `sessions` in
`src/content.config.ts` (verified: `export const collections = { speakers, sponsors, team };`
at line 147). Adding a Zod schema for sessions would be a bigger refactor;
out of scope. The boundary check at `loadSessions()` return is the correct
layer.

### Discretion call
**Ship D-07 in Phase 13 IF** the planner is already touching `schedule.ts` for
other reasons; otherwise **defer**. The helper-level guard (D-06) already
protects production render paths. Pick one or the other — not both
simultaneously — to keep blast radius minimal.

## Code Examples

### FR grid migration (full frontmatter before/after sketch)

**Before** (current `src/pages/speakers/index.astro:1-15`):
```astro
---
import { getSpeakersByLocale, getSlug } from "@/lib/speakers";
// ...
const speakers = await getSpeakersByLocale(lang);
const keynote = speakers.find((s) => s.data.keynote);
const regular = speakers
  .filter((s) => !s.data.keynote)
  .sort((a, b) => a.data.name.localeCompare(b.data.name));
---
```

**After** (prescribed):
```astro
---
import { getSpeakersByLocale, getSlug, getPrimaryTalk } from "@/lib/speakers";
import { loadSessions, type SessionRow } from "@/lib/schedule";
// ...
const speakers = await getSpeakersByLocale(lang);
const sessions = await loadSessions();

const keynote = speakers.find((s) => s.data.keynote);
const keynotePrimaryTalk = keynote ? getPrimaryTalk(getSlug(keynote.id), sessions) : undefined;

const regular = speakers
  .filter((s) => !s.data.keynote)
  .sort((a, b) => a.data.name.localeCompare(b.data.name))
  .map((s) => ({
    entry: s,
    primaryTalk: getPrimaryTalk(getSlug(s.id), sessions),
  }));
---
```

Template changes:
- `{keynote.data.talkTitle && ...}` → `{keynotePrimaryTalk && ...}` using
  `keynotePrimaryTalk.title`.
- `{keynote.data.talkDuration ...}` → `keynotePrimaryTalk.durationMin`.
- `{keynote.data.talkTrack ...}` → `keynotePrimaryTalk.track`.
- `regular.map((speaker) => ...)` → `regular.map(({ entry, primaryTalk }) => ...)`.
  Inside: `{speaker.data.talkTitle && ...}` → `{primaryTalk && <p>{primaryTalk.title}</p>}`.

### Hardened `getCoSpeakersForTalk`
See "Co-Speaker Helper Audit > Prescribed D-06 fix" above.

### `getPrimaryTalk` helper
```ts
// src/lib/speakers.ts — append after getCoSpeakersForTalk
import type { SessionRow } from "./schedule";

/**
 * Pick the "primary" session for a speaker's grid card (per Phase 13 D-04):
 *   1. Prefer keynote format
 *   2. Then earliest startTime (ISO-8601 lexicographic sort is correct since
 *      all sessions are same-offset +01:00)
 * Returns undefined when the speaker has no sessions (grid card hides the
 * talk block per D-05).
 */
export function getPrimaryTalk(
  speakerSlug: string,
  sessions: SessionRow[],
): SessionRow | undefined {
  const list = sessions.filter((s) => s.speakers.includes(speakerSlug));
  if (list.length === 0) return undefined;
  return [...list].sort((a, b) => {
    const aKey = a.format === "keynote" ? 0 : 1;
    const bKey = b.format === "keynote" ? 0 : 1;
    if (aKey !== bKey) return aKey - bKey;
    return a.startTime.localeCompare(b.startTime);
  })[0];
}
```

**Design note:** takes `sessions` as a parameter (not calling `loadSessions()`
internally) so the grid page can call `loadSessions()` once and reuse. This
matches the existing idiom of `getCoSpeakersForTalk(session, slug)` —
helpers receive pre-loaded data; they don't fetch.

### Replacement unit tests (minimal, per D-09)

```ts
// src/lib/__tests__/speakers.test.ts — NEW CONTENT (replace file)
import { describe, it, expect } from "vitest";
import { getCoSpeakersForTalk } from "../speakers";
import type { SessionRow } from "../schedule";

const baseSession: SessionRow = {
  id: "T1",
  title: "x",
  speakers: ["a", "b", "c"],
  track: "", level: "", room: "", format: "talk",
  startTime: "2026-02-03T09:00:00+01:00", durationMin: 30,
  tags: [], feedbackUrl: "", slidesUrl: "", recordingUrl: "",
  coverImageUrl: "", language: "", status: "confirmed", description: "",
};

describe("getCoSpeakersForTalk", () => {
  it("returns all speakers except the current one", () => {
    expect(getCoSpeakersForTalk(baseSession, "a")).toEqual(["b", "c"]);
  });
  it("returns empty array when the session has a single speaker", () => {
    expect(getCoSpeakersForTalk({ ...baseSession, speakers: ["a"] }, "a")).toEqual([]);
  });
  it("returns empty array when session.speakers is undefined (D-06)", () => {
    const broken = { ...baseSession, speakers: undefined as unknown as string[] };
    expect(getCoSpeakersForTalk(broken, "a")).toEqual([]);
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Talk info stored on speaker row (`talkTitle` etc.) | Talk info stored on session row; speakers join by `speakers: string[]` | Phase 10-ish migration (per CONTEXT + commit history) | Phase 13 is the last code path still reading the old shape |
| `speakers` collection with FR/EN locale prefix (`fr/speaker-1`) | Single locale-agnostic speakers collection; slug = id | Post-Phase-10 refactor (confirmed: `getSlug` in current `speakers.ts:9` is a no-op identity function) | The unit test in `src/lib/__tests__/speakers.test.ts` is stale because it still tests `getLocale` which no longer exists |
| Separate `talks` content collection | `sessions.csv` + `loadSessions()` (not a content collection) | Same refactor | `content.config.ts` does not register `sessions`; the test's `mockGetCollection("talks")` is unreachable |

**Deprecated / outdated in-tree:**
- `getLocale` export (referenced in `.planning/phases/04-speakers/04-*` plan docs, in `src/lib/__tests__/speakers.test.ts`, and in Phase 4 verification — **no longer exists** in `src/lib/speakers.ts`). Import crash on run.
- Speaker schema fields `talkTitle` / `talkTrack` / `talkDuration` — never re-introduce.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | ISO-8601 lexicographic sort is valid for `startTime` comparison | `getPrimaryTalk` example | LOW — all current sessions use `+01:00` offset (verified by sampling `sessions.csv`), so lex sort matches chronological. If future sessions cross timezones, switch to `new Date(startTime).getTime()`. [ASSUMED based on sampled data] |
| A2 | The 33 `astro check` errors are *only* in the two grid index files | Overall scope | MEDIUM — I did not run `pnpm astro check` (per instructions); I verified `talkTitle`/`talkTrack`/`talkDuration` live only in `speakers/index.astro` + `en/speakers/index.astro` via Grep. If a third file surfaces, error count may change. [VERIFIED via Grep] |
| A3 | i18n strings `"Retour aux speakers"` / `"Back to speakers"` still exist in `src/i18n` | Pitfall 5 | MEDIUM — not verified. Planner must grep. [ASSUMED] |
| A4 | `process.env.CI` is set in CI but not locally | D-07 optional implementation | LOW — standard GitHub Actions convention. [ASSUMED — industry standard] |
| A5 | `speakers-grid.test.ts` is NOT in Phase 13 scope even though it has the same stale-fixture problem | Pitfall 1 escalation | LOW — CONTEXT names only `speaker-profile` and `speaker-talks`. Flagged to planner so it can be explicitly noted in verification as "expected-to-remain-stale until separate phase". [VERIFIED against CONTEXT.md] |
| A6 | No Google Sheet changes are needed for this phase | CLAUDE.md compliance | LOW — the columns being removed from code never existed in the sheet (that's why they fail). [VERIFIED against speakers.csv header] |

## Open Questions

1. **D-08 conflict: fixture-identity vs "don't change assertions"**
   - What we know: Both target test files assert on speaker slugs/names that are absent from the current CSV (Pitfall 1).
   - What's unclear: whether the user wants (a) assertion rewrites, (b) a separate test-fixture CSV, or (c) to descope these tests.
   - Recommendation: Surface to user at `/gsd-discuss-phase` revisit OR as a first-wave "escalate" task with the three options laid out. Do NOT let the planner silently pick a path.

2. **D-07 adoption (Claude's discretion)**
   - What we know: the validator is cheap (~10 lines at `loadSessions()` return).
   - What's unclear: whether the user wants strict-CI, warn-dev failure modes, or neither.
   - Recommendation: Planner picks "ship it" IF already touching `schedule.ts`, else defer. Either is acceptable per CONTEXT.

3. **Should `src/lib/__tests__/speakers.test.ts` be replaced wholesale or patched?**
   - What we know: The file is stale top-to-bottom (Pitfall 2 detail). Patching is impossible without a full rewrite.
   - What's unclear: whether the user sees "replace an 300-line test file" as scope creep beyond D-09.
   - Recommendation: Include in the escalation (Open Q #1) — the two build-output tests and this unit test are all symptoms of the same migration.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| pnpm | `pnpm build` / `pnpm test` / `pnpm astro check` | — | — | — |
| Node | All build/test steps | — | — | — |
| Network access to Google Sheets published URLs | `loadSessions()` in a fresh build | ✓ (CSV fallback exists) | — | `src/content/schedule/sessions.csv` — always present, used on fetch failure [VERIFIED: `src/lib/remote-csv.ts` pattern referenced in CLAUDE.md] |

**Skipped probes:** per instructions ("Do not run `pnpm` commands"), `pnpm --version`, `node --version`, and network probes were not executed. The project is known to work in CI per git history; dependencies are assumed present.

**Missing dependencies with no fallback:** None expected.

**Missing dependencies with fallback:** Network → local CSV; already handled.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (version not probed; `vitest.config.ts` exists) |
| Config file | `vitest.config.ts` — env: `node`, alias `@` → `./src` |
| Quick run command | `pnpm vitest run src/lib/__tests__/speakers.test.ts` |
| Full suite command | `pnpm build && pnpm test` (build required because `tests/build/*` reads `dist/`) |

### Phase Requirements → Test Map
| Decision | Behavior | Test Type | Automated Command | File Exists? |
|----------|----------|-----------|-------------------|-------------|
| D-01 / D-03 (grid uses sessions join) | `pnpm astro check` clean on `src/pages/(en/)speakers/index.astro` | typecheck | `pnpm astro check 2>&1 \| grep -E 'speakers/index.astro'` (expect 0 lines) | n/a — ambient |
| D-04 (primary-talk selection) | Keynote preferred, else earliest | unit | new test in `src/lib/__tests__/speakers.test.ts` (OPTIONAL per D-09 — CONTEXT says "minimal new tests", so this is author's-call; recommend skipping and relying on visual/build-output check) | ❌ Wave 0 |
| D-05 (zero-session speaker graceful render) | Grid renders name+role+photo, omits talk block | build-output | Rebuild + grep-assert on any speaker with no sessions (none exist in current data, but logic must not crash) | n/a — covered by `pnpm build` succeeding |
| D-06 (getCoSpeakersForTalk undefined safety) | Returns `[]` on `session.speakers === undefined` | unit | `pnpm vitest run src/lib/__tests__/speakers.test.ts -t "undefined"` | ❌ Wave 0 (file to be rewritten) |
| D-07 (optional CSV boundary validator) | Zero-speaker session dropped in dev, throws in CI | unit (if shipped) | optional test on `loadSessions()` | ❌ Wave 0 if shipped |
| D-08 (SPKR-02 / SPKR-03 pass) | Build-output assertions | build-output | `pnpm build && pnpm vitest run tests/build/speaker-profile.test.ts tests/build/speaker-talks.test.ts` | ✅ — but **blocked by Pitfall 1 escalation** |

### Sampling Rate
- **Per task commit:** `pnpm astro check` on the edited file; `pnpm vitest run src/lib/__tests__/speakers.test.ts` if helpers changed.
- **Per wave merge:** `pnpm build && pnpm test` full.
- **Phase gate:** `pnpm astro check` returns 0 errors globally; `pnpm test` all green (modulo the escalated build-output suites).

### Wave 0 Gaps
- [ ] `src/lib/__tests__/speakers.test.ts` — replace content wholesale (stale against current API). Covers D-06.
- [ ] Framework install: none needed; Vitest already wired.
- [ ] `pnpm build` must run before `tests/build/*.test.ts` — planner must sequence this in verification.

## Security Domain

`security_enforcement` config not inspected; phase is purely code-reshape of
existing trusted inputs (CSVs already under maintainer control). No new
external inputs, no new auth surface, no new crypto. ASVS categories:

| ASVS Category | Applies | Notes |
|---------------|---------|-------|
| V5 Input Validation | yes (existing) | CSV parse + Zod are already in place; CSV content is maintainer-authored, not user input. No changes in this phase beyond the optional D-07 hardening. |
| V2/V3/V4/V6 | no | No auth, sessions, access control, or crypto in this phase. |

**Known threat patterns for this change:** none introduced. The migration
*narrows* the data surface (deletes unused fields). The optional D-07
validator is defense-in-depth, not a new threat surface.

## Sources

### Primary (HIGH confidence, all via direct file Read in this session)
- `src/lib/schedule.ts` — `loadSessions`, `SessionRow`, CSV parser, format/level/room/track/level helpers, ICS builders. [VERIFIED]
- `src/lib/speakers.ts` — current 7-function (actually 6-function post-refactor) speaker API. [VERIFIED]
- `src/content.config.ts` — Zod schema for speakers, sponsors, team. No `sessions` collection. [VERIFIED]
- `src/pages/speakers/index.astro`, `src/pages/en/speakers/index.astro` — the two broken files. [VERIFIED]
- `src/pages/speakers/[slug].astro`, `src/pages/en/speakers/[slug].astro` — working profile pages (reference idiom for `Map<slug, name>`). [VERIFIED]
- `src/content/schedule/speakers.csv` — actual header row, 65 real speakers. [VERIFIED]
- `src/content/schedule/sessions.csv` (header only due to size) — confirms `speakers` is CSV-of-slugs. [VERIFIED]
- `src/components/schedule/ScheduleGrid.astro` (first 80 lines) — confirms `Map<slug, name>` idiom for speaker resolution. [VERIFIED]
- `tests/build/speaker-profile.test.ts`, `tests/build/speaker-talks.test.ts`, `tests/build/speakers-grid.test.ts` — all three are stale. [VERIFIED]
- `src/lib/__tests__/speakers.test.ts` — stale (uses removed `getLocale`, imports non-existent APIs). [VERIFIED]
- `vitest.config.ts` — node env, `@` alias. [VERIFIED]
- `.planning/phases/13-speaker-schema-drift-cleanup/13-CONTEXT.md` — locked decisions. [VERIFIED]
- `.planning/phases/08-event-lifecycle/deferred-items.md` — historical error log. [VERIFIED]
- `CLAUDE.md` — Data Rules. [VERIFIED]

### Secondary
- Not used. No Context7 / WebFetch / WebSearch performed — the stack is locked and all answers live in-repo.

### Tertiary
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every library in the "Standard Stack" table is already
  imported at a verified line in the current tree.
- Architecture patterns: HIGH — Pattern 1 (Map) is an established idiom
  (`speakerNameBySlug` at `src/pages/speakers/[slug].astro:27`; `speakerNames`
  Map consumed at `ScheduleGrid.astro:11,55`).
- Pitfalls: HIGH for Pitfall 1 (grepped, confirmed), HIGH for Pitfall 2 (read the
  test file and the current `speakers.ts`), MEDIUM for Pitfall 5 (did not grep
  i18n).
- Test-suite escalation (Pitfall 1): HIGH — direct side-by-side comparison of
  test fixture slugs/names with the current CSV.

**Research date:** 2026-04-13
**Valid until:** 2026-05-13 (30 days — working-tree-grounded findings are
stable until the CSVs or test files change)
