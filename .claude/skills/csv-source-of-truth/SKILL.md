---
name: csv-source-of-truth
description: Use when editing or creating code that reads or writes speaker, session, sponsor, or team data — or when the user asks to add/update one of those entities
---

# CSV Source of Truth

## Overview

Speakers, sessions, sponsors, and team members are authored in **Google Sheets** by staff. The site fetches the published CSVs at build time. Hardcoding any row into `.astro`, `.ts`, or `.tsx` will drift from the Sheet within a day and mislead the next person who updates the Sheet expecting the site to follow. Always go through the loader helpers.

## When to Use

Triggers:
- User asks "add speaker X / session Y / sponsor Z / team member W" (first instinct must be "edit the Google Sheet", not "edit a file").
- Code touches `src/lib/schedule.ts`, `src/lib/speakers.ts`, `src/lib/remote-csv.ts`, or any component that renders speaker/session/sponsor/team rows.
- A PR introduces a literal speaker name, session title, sponsor slug, or team member in a `.astro`/`.ts`/`.tsx` file.
- A CSV column is being added, renamed, or removed.

When NOT to use:
- Writing tests that intentionally stub fixture rows (tests are allowed to hardcode via `vi.mock`).
- Local fallback CSVs under `src/content/{schedule,sponsors,team}/*.csv` (these exist for offline/CI — editing them is fine, but they are not the source of truth).

## Core Rules

1. **Sheet first.** Any data change starts in the upstream Google Sheet. If the user can't edit the Sheet right now, say so — don't bypass by committing to a `.ts` file.
2. **Fetch via loaders, never inline.**
   - Sessions → `loadSessions()` from `src/lib/schedule.ts`
   - Speakers → `getCollection("speakers")` (via `src/lib/speakers.ts` helpers like `getSlug`)
   - Sponsors → `getCollection("sponsors")`
   - Team → `getCollection("team")`
3. **URL overrides are env-driven.** `SCHEDULE_SESSIONS_CSV_URL`, `SCHEDULE_SPEAKERS_CSV_URL`, `SPONSORS_CSV_URL`, `TEAM_CSV_URL` — use these for staging/preview; don't hardcode alternate URLs.
4. **Schema changes are atomic across 4 layers.** Adding/renaming a column requires updating, in order:
   1. The Google Sheet (column header)
   2. The CSV parser (`src/lib/remote-csv.ts` or the relevant loader)
   3. The Zod schema (`src/content.config.ts` or the inline schema in the loader)
   4. All downstream consumers (`.astro` components, page templates, tests)
   Ship all four together. A partial change will either crash the build or silently drop the column.

## Quick Reference

| Data | Source CSV URL env var | Loader / collection |
|---|---|---|
| Sessions | `SCHEDULE_SESSIONS_CSV_URL` | `loadSessions()` — `src/lib/schedule.ts:107` |
| Speakers | `SCHEDULE_SPEAKERS_CSV_URL` | `getCollection("speakers")` + helpers in `src/lib/speakers.ts` |
| Sponsors | `SPONSORS_CSV_URL` | `getCollection("sponsors")` |
| Team | `TEAM_CSV_URL` | `getCollection("team")` |

Local fallbacks (offline/CI only): `src/content/{schedule,sponsors,team}/*.csv`.

## Common Mistakes

- **Pasting a speaker bio into `editions-data.ts` or a component** — breaks the next Sheet update. Put it in the Sheet, regenerate the CSV, load via the helper.
- **Renaming a Sheet column without touching the Zod schema** — the build will fail or, worse, silently accept `undefined`. Update all 4 layers in the same commit.
- **Hardcoding a CSV URL in code** — if staging needs a different sheet, use the env var override, not a code edit.
- **Treating `src/content/**/*.csv` as the source** — those are fallbacks. The Sheet is the source; the fallback just makes offline builds work.
