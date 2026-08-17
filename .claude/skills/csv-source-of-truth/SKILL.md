---
name: csv-source-of-truth
description: Use when editing or creating code that reads or writes speaker, session, sponsor, or team data — or when the user asks to add/update one of those entities
---

# Session & CSV Source of Truth

## Overview

Sessions and speakers are authored in **Pretalx** (`cfp.cloudnativedays.fr`). Sponsors and
team members are authored in **Google Sheets** by staff. The site fetches both at build time.
Two speaker fields stay in the repo because Pretalx has nowhere to put them: the URL slug
(`src/data/speaker-slugs.ts`) and the opening-keynote running order
(`src/data/keynote-cast.ts`).
Hardcoding any row into `.astro`, `.ts`, or `.tsx` will drift within a day and mislead the
next person who updates the upstream expecting the site to follow. Always go through the
loader helpers.

## When to Use

Triggers:
- User asks "add session Y / speaker X / sponsor Z / team member W" (first instinct must be
  "edit Pretalx" for a session or speaker, "edit the Google Sheet" for a sponsor or team
  member — not "edit a file").
- Code touches `src/lib/pretalx.ts`, `src/lib/schedule.ts`, `src/lib/speakers.ts`,
  `src/lib/remote-csv.ts`, or any component rendering session/speaker/sponsor/team rows.
- A PR introduces a literal session title, speaker name, sponsor slug, or team member in a
  `.astro`/`.ts`/`.tsx` file.
- A Pretalx field or CSV column is being added, renamed, or removed.

When NOT to use:
- Writing tests that intentionally stub fixture rows (tests may hardcode via `vi.mock`).
- The committed fallbacks under `src/content/{schedule,sponsors,team}/` — they exist for
  offline/CI. Editing them is fine; they are not the source of truth.

## Core Rules

1. **Upstream first.** A session or speaker change starts in Pretalx; a sponsor or team
   change starts in the Google Sheet. If the user cannot edit upstream right now, say so —
   do not bypass by committing to a `.ts` file. The two exceptions are the speaker slug map
   and the keynote cast, which are repo-owned by design.
2. **Fetch via loaders, never inline.**
   - Sessions → `loadSessions(year)` from `src/lib/schedule.ts`
   - Speakers → `getCollection("speakers-<year>")` (helpers in `src/lib/speakers.ts`)
   - Sponsors → `getCollection("sponsors-<year>")`
   - Team → `getCollection("team")`
3. **Session-attached resources live in Pretalx.** Slides are talk resources; replays are
   talk resources of type link titled `Replay`. There is no Sheet column for either.
4. **Overrides are env-driven.** `PRETALX_BASE_URL`, `PRETALX_API_TOKEN`,
   `SPONSORS_CSV_URL_{2023,2026,2027}`, `TEAM_CSV_URL`. Never hardcode alternate URLs.
5. **Snapshots must be refreshed, not hand-edited.** `pnpm sync:pretalx` rewrites
   `src/content/schedule/pretalx-{year}.json`. The old sessions CSV fallback silently drifted
   to 50 rows against the Sheet's 51 precisely because it was maintained by hand.
6. **Schema changes are atomic.**
   - *Session field:* Pretalx field → the normalizer in `src/lib/pretalx.ts` → the
     `SessionRow` interface → all downstream consumers → refresh the snapshot.
   - *CSV column:* Sheet header → `src/content.config.ts` Zod schema → all consumers.
   Ship every layer together. A partial change either crashes the build or silently drops
   the column.

## Quick Reference

| Data | Source | Override | Loader / collection |
|---|---|---|---|
| Sessions | Pretalx released schedule export | `PRETALX_BASE_URL` | `loadSessions(year)` — `src/lib/schedule.ts` |
| Speakers | Pretalx (+ repo maps) | `PRETALX_API_TOKEN` | `getCollection("speakers-<year>")` |
| Sponsors | Google Sheet | `SPONSORS_CSV_URL_<year>` | `getCollection("sponsors-<year>")` |
| Team | Google Sheet | `TEAM_CSV_URL` | `getCollection("team")` |

Editions with no Pretalx event (2023, and 2027 until its event opens) read the frozen
`src/content/schedule/sessions-<year>.json` archive.

## Common Mistakes

- **Adding a session by editing a `.json` or `.ts` file** — it belongs in Pretalx. The JSON
  snapshots are generated; a hand edit is overwritten by the next `pnpm sync:pretalx`.
- **Pasting a speaker bio into `editions-data.ts` or a component** — breaks the next Sheet
  update. Put it in the Sheet and load via the helper.
- **Adding a replay URL to a code map** — it is a Pretalx talk resource.
- **Renaming a Sheet column without touching the Zod schema** — the build fails, or worse
  silently accepts `undefined`.
- **Treating the committed fallbacks as the source** — they only make offline builds work.
