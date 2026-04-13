# Updating content — the CSV runbook

This guide is for anyone adding or editing speakers, sessions, sponsors, or team members. It is written for both developers (who edit the local CSV fallbacks) and content editors (who maintain the Google Sheets). You only need to know a bit of English and how to click "Publish to web" in Google Sheets.

## Which Google Sheet is which

The site draws all its roster data from four CSVs. In production each CSV is a Google Sheet published to the web and referenced via an environment variable. In development the site falls back to the committed files under `src/content/`.

| Entity | Env var | Local fallback |
|--------|---------|----------------|
| Conference sessions | `SCHEDULE_SESSIONS_CSV_URL` | `src/content/schedule/sessions.csv` |
| Speaker profiles | `SCHEDULE_SPEAKERS_CSV_URL` | `src/content/schedule/speakers.csv` |
| Sponsors | `SPONSORS_CSV_URL` | `src/content/sponsors/sponsors.csv` |
| Team members | `TEAM_CSV_URL` | `src/content/team/team.csv` |

The env-var wiring lives in `src/lib/remote-csv.ts`. If the env var is set to a non-empty string, the CSV at that URL wins; otherwise the local fallback is used. This means development works offline; production reads live Sheets without redeploying for content edits (just a rebuild).

Ask a maintainer for the live Sheet URLs — they are not checked into this repo on purpose, to keep write access scoped. The rebuild hook that picks up a Sheet edit is documented in the separate [`cnd-platform`](https://github.com/cloudnativedays-france/cnd-platform) repository.

## Authoritative column shapes

**Always cross-reference** `src/content.config.ts` when editing. That file holds the Zod schema for each entity and is the single source of truth for required vs optional columns. The column lists below match the schema at the time of writing — if the schema and this runbook ever disagree, the schema wins and this file needs updating.

---

## Speakers

Sheet columns (header row must match exactly):

```
slug,name,photo_url,company,role,bio,twitter,linkedin,github,bluesky,website,keynote
```

- **slug** (required) — URL-safe identifier used in `/speakers/{slug}`. Lowercase, hyphen-separated (e.g. `petazzoni`, `arthur-outhenin-chalandre`). Must be unique across the sheet. Never change an existing slug after it has been published — you will break inbound links.
- **name** (required) — Full display name with diacritics exactly as the speaker wants to be cited (e.g. `Jérôme Petazzoni`, `Aurélie Vache`).
- **photo_url** (optional) — absolute URL or site-relative path starting with `/`. Leave empty to fall back to the generated initials avatar.
- **company** (optional) — affiliation shown under the name.
- **role** (optional) — title shown alongside the company (combined as `{role} — {company}` on the card).
- **bio** (optional) — one or two paragraphs in the speaker's preferred language. Plain text; no HTML.
- **twitter, linkedin, github, bluesky, website** (optional) — absolute URLs only (`https://...`). Leave empty to hide the icon.
- **keynote** (optional, boolean) — set to `true` to pin this speaker to the keynote rail on the /speakers page; leave empty for regular speakers.

### How to add a speaker

1. Open the Speakers Google Sheet (ask a maintainer for the URL).
2. Append a new row at the bottom. Fill the columns above. Required fields are `slug` and `name`.
3. Click **File → Share → Publish to web → select the Speakers sheet → CSV → Publish**. Copy the resulting URL.
4. Verify the URL ends with `output=csv` or `gviz/tq?tqx=out:csv`. If the maintainer set the env var once, you can skip steps 3-4 — existing publishes auto-update when the sheet changes.
5. Trigger a rebuild in production (see below), or in development just re-run `pnpm dev` / `pnpm build`.

To add a speaker in development without touching the Sheet: append the row to `src/content/schedule/speakers.csv`, save, and re-run `pnpm dev`. The hot-reload will re-parse the CSV.

---

## Sessions

Sheet columns:

```
id,title,speakers,track,level,room,format,start_time,duration_min,tags,feedback_url,slides_url,recording_url,cover_image_url,language,status,description
```

- **id** (required) — short unique code (6 chars, e.g. `GJ89TV`). Stable across edits. Used internally for bookmarks and the recording permalink.
- **title** (required) — session title in the spoken language.
- **speakers** (required) — comma-separated list of speaker slugs from the Speakers sheet. Order is significant: the first slug is the primary speaker. E.g. `arthur-outhenin-chalandre,quentin-swiech` for a co-presentation.
- **track** (optional) — free-text theme used for colour-coding. Keep the set small.
- **level** (optional) — `beginner` / `intermediate` / `advanced` / empty.
- **room** (required) — physical room name (e.g. `Monet`, `Debussy`, `Piaf`, `Dumas`, `Ravel`).
- **format** (required) — one of `keynote`, `talk`, `lightning`, `workshop`.
- **start_time** (required) — ISO 8601 timestamp with timezone, e.g. `2026-02-03T09:00:00+01:00`.
- **duration_min** (required) — integer minutes.
- **tags** (optional) — comma-separated free-text tags.
- **feedback_url** (optional, set post-event) — Open Feedback link.
- **slides_url** (optional, set post-event) — public slide deck URL.
- **recording_url** (optional, set post-event) — YouTube / Vimeo / etc. permalink. Setting this is what drives a row to appear on `/replays` (see Phase 8 event lifecycle).
- **cover_image_url** (optional) — session-level hero image.
- **language** (optional) — `fr` or `en`.
- **status** (required) — `confirmed`, `tentative`, `cancelled`, or `hidden` (hidden rows are excluded at load time).
- **description** (optional) — abstract, markdown supported inside the modal.

### How to add a session

1. Confirm every speaker slug in your `speakers` column exists in the Speakers sheet. Missing speakers will render as a blank name on the session card.
2. Append the row. Required fields: `id`, `title`, `speakers`, `room`, `format`, `start_time`, `duration_min`, `status`.
3. Publish the Sheet as CSV (as above); trigger a rebuild.

---

## Sponsors

Sheet columns:

```
id,name,tier,logo,url,description_fr,description_en
```

- **id** (required) — URL-safe slug unique per sponsor.
- **name** (required) — display name.
- **tier** (required) — one of `platinum`, `gold`, `silver`, `bronze`, `partner` (mirror the Zod enum).
- **logo** (optional) — absolute URL or site-relative `/sponsors/filename.svg`.
- **url** (optional) — sponsor website; the logo becomes a clickable link when set.
- **description_fr, description_en** (optional) — short descriptions shown on the /sponsors page. Bilingual means both are filled; omit both to hide the description entirely.

### How to add a sponsor

1. If providing a new logo asset, commit it to `public/sponsors/{id}.svg` in the repo first.
2. Append the row to the Sheet. Ensure `tier` matches one of the accepted values.
3. Publish → rebuild.

---

## Team

Sheet columns:

```
id,name,role_fr,role_en,group,photo,social_linkedin,social_github,social_bluesky,social_twitter,social_website
```

- **id** (required) — unique slug.
- **name** (required) — display name.
- **role_fr, role_en** (required, bilingual) — role text in each locale (e.g. `role_fr: "Directrice de conférence"`, `role_en: "Conference Director"`).
- **group** (required) — role grouping for visual sectioning (e.g. `core`, `volunteers`).
- **photo** (optional) — absolute URL or `/team/{id}.jpg`.
- **social_linkedin, social_github, social_bluesky, social_twitter, social_website** (optional) — absolute URLs.

### How to add a team member

1. If providing a new photo, commit it to `public/team/{id}.jpg`.
2. Append the row. Both `role_fr` and `role_en` must be filled — no monolingual shipping.
3. Publish → rebuild.

---

## How the build resolves the source

At build time, `src/lib/remote-csv.ts` runs this logic per entity:

1. If the corresponding env var (e.g. `SCHEDULE_SESSIONS_CSV_URL`) is set and non-empty, fetch the CSV from that URL.
2. Otherwise, read the local file under `src/content/{…}/*.csv`.
3. Parse CSV, validate each row against the Zod schema in `src/content.config.ts`, skip invalid rows with a warning, expose a typed list to the rest of the code.

This means a production deploy with env vars set always reflects the latest Sheet snapshot at build time. Rebuilding is the only "publish" action.

## Triggering a rebuild in production

The site image is built by `.github/workflows/build-image.yml` on every push. Actual deployment (pulling the new image, rolling restarts) is owned by the [`cnd-platform`](https://github.com/cloudnativedays-france/cnd-platform) repository — see its README for the rebuild webhook / GitOps cadence.

In development a rebuild is just `pnpm dev` hot-reload or `pnpm build` for a fresh bundle.
