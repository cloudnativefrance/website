# Updating content — the sessions & CSV runbook

This guide is for anyone adding or editing speakers, sessions, sponsors, or team members.
Sessions are authored in **Pretalx** (`cfp.cloudnativedays.fr`); speakers, sponsors, and team
are authored in **Google Sheets**. This doc is written for both developers (who edit the
local fallbacks) and content editors (who maintain the Sheets). You only need to know a bit
of English and how to click "Publish to web" in Google Sheets.

## Which source is which

Sessions come from Pretalx's released-schedule export, fetched at build time
(`src/lib/pretalx.ts`) with a committed snapshot fallback. The other three rosters are Google
Sheets published to the web and referenced via an environment variable; in development the
site falls back to the committed CSVs under `src/content/`.

| Entity | Source | Env var | Local fallback |
|--------|--------|---------|-----------------|
| Conference sessions | Pretalx | `PRETALX_BASE_URL` | `src/content/schedule/pretalx-{year}.json` |
| Speaker profiles | Google Sheet | `SPEAKERS_CSV_URL_{2023,2026,2027}` | `src/content/schedule/speakers-{year}.csv` |
| Sponsors | Google Sheet | `SPONSORS_CSV_URL_{2023,2026,2027}` | `src/content/sponsors/sponsors-{year}.csv` |
| Team members | Google Sheet | `TEAM_CSV_URL` | `src/content/team/team.csv` |

The env-var wiring for the Sheet-backed rosters lives in `src/lib/remote-csv.ts`. If the env var is set to a non-empty string, the CSV at that URL wins; otherwise the local fallback is used. This means development works offline; production reads live Sheets without redeploying for content edits (just a rebuild). The Pretalx snapshot fallback is refreshed with `pnpm sync:pretalx` rather than hand-edited — see the Sessions section below.

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

Sessions are **not** edited in this repo or in a Sheet — they are authored in Pretalx
(`cfp.cloudnativedays.fr`). The site normalizes Pretalx's released-schedule export into a
`SessionRow` (see `src/lib/schedule.ts` and `src/lib/pretalx.ts`); the field-by-field mapping
lives there, not in a CSV header.

- **Title, room, format, start time, duration, track, language, description** — edited
  directly on the talk in Pretalx.
- **Speakers** — Pretalx's own speaker list for the talk, resolved to the site's speaker
  slugs by matching against the Speakers Sheet's `name` column (see below). A speaker must
  have a row in that Sheet before their talk will build.
- **Slides** — a talk resource (file or link) in Pretalx.
- **Replay** — a talk resource of type link, titled `Replay`, pointing at the YouTube/Vimeo
  URL. Setting this is what drives a talk onto `/replays`.
- **Status** — only talks in the released schedule version are exported; hiding a talk in
  Pretalx removes it from the site on the next build.

### How to add or edit a session

1. Edit the talk directly in Pretalx (title, room, slot, track, resources, …).
2. If speakers changed, confirm every speaker's Pretalx `name` matches a row in the Speakers
   Sheet exactly — a mismatch fails the build loudly rather than silently dropping the name.
3. Trigger a rebuild (see below). Production fetches the released schedule export live; there
   is no separate "publish" step like the Sheet-backed rosters have.

Editions with no public Pretalx event (2023) read a frozen
`src/content/schedule/sessions-{year}.json` archive instead — that JSON is historical and is
not meant to be extended.

### Keeping the offline fallback fresh

If Pretalx is unreachable at build time, the build falls back to the committed snapshot at
`src/content/schedule/pretalx-{year}.json`. That snapshot does **not** update itself — refresh
it after schedule changes with:

```bash
pnpm sync:pretalx
```

Do not hand-edit the snapshot file; the next sync overwrites it.

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

Sessions and the Sheet-backed rosters resolve differently at build time.

**Sessions** (`src/lib/pretalx.ts`, `src/lib/schedule.ts`):

1. Fetch the Pretalx released-schedule export for the edition's event.
2. If that fetch fails or is invalid, fall back to the committed
   `src/content/schedule/pretalx-{year}.json` snapshot and warn in the build log.
3. Normalize each talk into a `SessionRow`, resolving speaker names against the Speakers
   Sheet.

**Speakers, sponsors, team** (`src/lib/remote-csv.ts`):

1. If the corresponding env var (e.g. `SPEAKERS_CSV_URL_2026`) is set and non-empty, fetch the CSV from that URL.
2. Otherwise, read the local file under `src/content/{…}/*.csv`.
3. Parse CSV, validate each row against the Zod schema in `src/content.config.ts`, skip invalid rows with a warning, expose a typed list to the rest of the code.

This means a production deploy with env vars set always reflects the latest Pretalx schedule and Sheet snapshots at build time. Rebuilding is the only "publish" action.

## Triggering a rebuild in production

The site image is built by `.github/workflows/build-image.yml` on every push. Actual deployment (pulling the new image, rolling restarts) is owned by the [`cnd-platform`](https://github.com/cloudnativedays-france/cnd-platform) repository — see its README for the rebuild webhook / GitOps cadence.

In development a rebuild is just `pnpm dev` hot-reload or `pnpm build` for a fresh bundle.
