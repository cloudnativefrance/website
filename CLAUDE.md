# CND France Website

## Design Rules

- **Stitch-first**: Every new page or significant UI change must be designed in Google Stitch first, validated by the user, then implemented in code. Never skip straight to code for visual work.
- After executing a phase that produces pages or UI components, present each page in Stitch for review before considering the work done.

## Data Rules

- **CSVs are the single source of truth** for speakers, sessions, sponsors, and team. Staff edit the corresponding Google Sheets; the site fetches the published CSV at build time (URLs in `src/lib/remote-csv.ts`, overridable via `SCHEDULE_SESSIONS_CSV_URL`, `SCHEDULE_SPEAKERS_CSV_URL`, `SPONSORS_CSV_URL`, `TEAM_CSV_URL`). Local fallback files under `src/content/{schedule,sponsors,team}/*.csv` exist for offline/CI builds only.
- Never hardcode speaker / session / sponsor / team data in `.astro`, `.ts`, or `.tsx` files. If you need a value in code, fetch it from the CSV loader helpers (`loadSessions`, speaker / sponsor / team equivalents) instead of duplicating a row.
- Schema changes (adding a CSV column, renaming a field) require the Google Sheet, the CSV parser, the Zod schema, and all downstream consumers to be updated together — do not ship one without the others.
