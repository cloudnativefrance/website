# Phase 13: Speaker Schema Drift Cleanup — Context

**Gathered:** 2026-04-13
**Status:** Ready for research

<domain>
## Phase Boundary

Close the v1.0 milestone audit's sole remaining code gap: 33 `pnpm astro check` errors in `src/pages/(en/)speakers/index.astro` (`talkTitle` / `talkTrack` / `talkDuration` dereferenced on speaker records) and 2 failing test suites (`tests/build/speaker-profile.test.ts`, `tests/build/speaker-talks.test.ts`) caused by `session.speakers` being undefined for some rows.

**Not in scope:** schema changes on the Google Sheets themselves, redesigning the speaker grid visuals, adding new test cases beyond the currently-failing SPKR-02/03.
</domain>

<decisions>
## Implementation Decisions

### Source-of-truth alignment (MANDATED by CLAUDE.md § Data Rules)

- **D-01:** Talk info (title / track / duration / format / language / start time) is sourced exclusively from `sessions.csv` via `loadSessions()`. Speaker pages must NOT reference `talkTitle`, `talkTrack`, `talkDuration`, or any `talk*` field on the speaker record — those fields never existed in speakers.csv and must not be re-introduced to the Zod schema.
- **D-02:** `keynote: boolean` on the speaker record stays — it is a legitimate speaker-level attribute (used by the grid to group keynotes first per Phase 4 D-02). Do not migrate it to sessions.

### Grid behavior (decision: A1 — keep talk info on cards)

- **D-03:** The `/speakers` and `/en/speakers` grid cards continue to display the speaker's primary talk info (title, track, duration). Data source: `sessions.find(s => s.speakers.includes(speaker.slug))` at build time. No UI redesign — the existing card layout stays; only the data flow changes.
- **D-04:** "Primary talk" selection when a speaker has multiple sessions: prefer keynote, then earliest `startTime`. Deterministic and testable.
- **D-05:** When a speaker has zero sessions in the CSV: the card renders name + role + photo + keynote badge (if applicable), and the talk info block is omitted gracefully (no empty strings, no broken markup).

### Co-speaker helper hardening (fixes SPKR-03)

- **D-06:** `getCoSpeakersForTalk` must defend against `undefined` / `null` speakers arrays — return `[]` early when the field is missing. Today it throws `TypeError: Cannot read properties of undefined (reading 'filter')` on one test.
- **D-07:** Add CSV-boundary validation in `loadSessions()` (or the Zod session schema): reject sessions with zero valid speakers. Logs a warning in dev, throws in CI. Bad data gets caught at the data layer rather than leaking into render code. Out-of-scope option — implementer's call during planning.

### Test-suite scope lock (fixes SPKR-02 + SPKR-03)

- **D-08 [REVISED 2026-04-13]:** The failing tests assert on fixture speakers (slugs `speaker-1..6`, names "Marie Laurent" / "Amina Diallo" / "Thomas Nguyen" / …) that no longer exist in `speakers.csv` — the CSV now holds 65 real CFP speakers (`petazzoni`, `vache`, `saboni`, …). The original D-08 ("don't change assertions") is infeasible. **User-selected resolution: Option B** — rewrite the test assertions to target 3–4 real speakers from the current roster. Pick speakers whose sessions have stable characteristics (e.g., keynote + known co-speaker pairs) so assertions aren't brittle to future CFP churn. `src/lib/__tests__/speakers.test.ts` is stale top-to-bottom (imports a removed `getLocale`, mocks a non-existent `talks` collection); replace its content with ~30 lines of minimal coverage targeting the helper functions + the D-06 `undefined-speakers` edge case.
- **D-09 [REVISED]:** Beyond the hardening tests for D-06, include whatever new cases are needed so rewritten `speaker-profile.test.ts` + `speaker-talks.test.ts` continue to verify SPKR-02 (profile pages exist per speaker) and SPKR-03 (bidirectional co-speakers). Keep the tests invariant-friendly where possible — prefer "every speaker with ≥1 session shows a talk card" over "speaker-X shows talk Y".
- **D-10 [NEW]:** Real-speaker test fixtures must be picked from `speakers.csv` rows that are unlikely to churn — keynotes first (they're rarely dropped), or speakers with canonical co-presented talks. Document the chosen anchor speakers in the test file's header comment so future data-ops can spot-check them before removing rows.

### Claude's Discretion

- The exact migration pattern on the grid page (inline `.find()` vs a pre-computed `Map<slug, SessionRow>` built once at module scope)
- How the primary-talk helper is named and where it lives (`src/lib/speakers.ts` vs a new helper file)
- Whether CSV-boundary validation (D-07) ships in Phase 13 or is deferred — default is **defer** under option B (we are not otherwise touching `src/lib/schedule.ts`). Planner may still ship it if the helper-hardening tests are easier to write with a validator present.
- Whether to fix the pre-existing vitest config issue that causes the `src/lib/__tests__/speakers.test.ts` env mismatch (it's node env currently, no DOM needed) — planner's call
</decisions>

<canonical_refs>
## Canonical References

- `.planning/v1.0-MILESTONE-AUDIT.md` — the audit that surfaced this gap
- `.planning/phases/04-speakers/04-CONTEXT.md` — Phase 4's locked decisions (D-01 grid layout, D-02 keynote-first sort, D-04 social icons) still apply
- `.planning/phases/04-speakers/deferred-items.md` — original log of the 33 errors
- `.planning/phases/08-event-lifecycle/deferred-items.md` — carried-forward log
- `src/lib/schedule.ts` — `loadSessions()` + `SessionRow` interface (authoritative)
- `src/lib/speakers.ts` — `getCoSpeakersForTalk` and related helpers
- `src/content/schedule/speakers.csv` — actual columns (slug, name, photo_url, company, role, bio, social URLs, keynote)
- `src/content/schedule/sessions.csv` — actual columns (see `SessionRow` in schedule.ts)
- `CLAUDE.md § Data Rules` — source-of-truth rule

## Deferred Ideas

- Dedicated schema migration tooling (Google Sheets validator in CI)
- Richer "See all my sessions" UI on speaker profiles when a speaker has 2+ sessions (currently profile shows all via inline cards — confirm this is already the case, don't redesign)
- Backfill CSV `language` / `level` on existing sessions (data-ops, not code)
</canonical_refs>
