# Updating content — the sessions & CSV runbook

This guide is for anyone adding or editing speakers, sessions, sponsors, or team members.
Sessions and speakers are authored in **Pretalx** (`cfp.cloudnativedays.fr`); sponsors and
team are authored in **Google Sheets**. This doc is written for both developers (who edit the
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
| Speaker profiles | Pretalx | `PRETALX_BASE_URL` + `PRETALX_API_TOKEN` | `src/content/schedule/speakers-{year}.json` (no-Pretalx editions) |
| Sponsors | Google Sheet | `SPONSORS_CSV_URL_{2023,2026,2027}` | `src/content/sponsors/sponsors-{year}.csv` |
| Team members | Google Sheet | `TEAM_CSV_URL` | `src/content/team/team.csv` |

The env-var wiring for the Sheet-backed rosters lives in `src/lib/remote-csv.ts`. If the env var is set to a non-empty string, the CSV at that URL wins; otherwise the local fallback is used. This means development works offline; production reads live Sheets without redeploying for content edits (just a rebuild). The Pretalx snapshot fallback is refreshed with `pnpm sync:pretalx` rather than hand-edited — see the Sessions section below.

Ask a maintainer for the live Sheet URLs — they are not checked into this repo on purpose, to keep write access scoped. The rebuild hook that picks up a Sheet edit is documented in the separate [`cnd-platform`](https://github.com/cloudnativedays-france/cnd-platform) repository.

## Authoritative column shapes

**Always cross-reference** `src/content.config.ts` when editing. That file holds the Zod schema for each entity and is the single source of truth for required vs optional columns. The column lists below match the schema at the time of writing — if the schema and this runbook ever disagree, the schema wins and this file needs updating.

---

## Speakers

Speakers are authored in **Pretalx**, not in a Sheet. Two fields stay in this repo
because Pretalx has nowhere to put them.

| Field | Where it lives | Notes |
|---|---|---|
| `name`, `bio`, `photo_url` | Pretalx speaker profile | the Pretalx avatar wins; a committed `public/speakers/<slug>.jpg` is the fallback |
| `company`, `role`, `linkedin`, `github`, `bluesky`, `website` | Pretalx **speaker questions** | needs the API token to read — they are not public |
| `slug` | `src/data/speaker-slugs.ts` | URL identity. Never change a published one |
| `keynote`, `keynote_size` | `src/data/keynote-cast.ts` | the opening-keynote running order |

### How to add a speaker

1. Add them in Pretalx as a speaker on their talk. The site only ever sees people
   who appear in a **released** schedule version — but adding a speaker to a talk
   that is already released shows up in the export immediately, with no need to
   cut a new schedule version (verified when the keynote cast was added).
   Pretalx requires an email and a biography. Adding a co-speaker queues a
   notification in `Mails → Outbox` rather than sending it, so discard it there
   if the person should not be contacted.
2. Fill their `Entreprise`, `Rôle` and social answers on their Pretalx profile.
3. Add a line to `src/data/speaker-slugs.ts`, keyed by their **exact** Pretalx name:
   ```ts
   "Ada Lovelace": "ada-lovelace",
   ```
   Without it the build fails naming them — deliberately. Deriving a slug would
   produce `/intervenants/Ada%20Lovelace`, a 404 that renders as a working link.
4. Upload their portrait in Pretalx. Nothing needs committing — see
   "Speaker photos" below for the resolution order and the fallback.
5. Rebuild.

### Speaker photos

Pretalx owns portraits. `photoFor()` in `src/lib/speaker-source.ts` resolves:

```
Pretalx avatar?                      → optimised at build time into /_astro/
else public/speakers/<slug>.jpg?     → served from public/
else                                 → initials
```

The Pretalx one is downloaded and re-encoded by `SpeakerAvatar.astro`, so the
browser only ever talks to our origin — a portrait is never hotlinked from the
CFP host. `image.remotePatterns` in `astro.config.mjs` is what authorises that;
without the entry Astro silently declines to optimise and hands back the
original URL, which is how this first shipped with 65 hotlinks.

`public/speakers/` is a **shrinking fallback**, not a source. It covers the
people with no Pretalx avatar yet — 12 of 77 at the time of writing — and each
avatar uploaded moves one more person across with no code change. When none are
left the directory can be deleted outright.

It also covers a Pretalx avatar that cannot be read at build time, whether from
an outage or a corrupt upload. Without that rung an avatar outage would blank
65 of 77 faces in a release image while exiting 0.

**To change a published portrait:** upload it in Pretalx. That is now the whole
procedure — no commit, no rebuild of committed assets.

**A note on `bio`:** Pretalx requires one when creating a speaker and there is
no setting to make it optional; the CfP editor's required/optional toggles cover
submission fields, not speaker-profile fields.

### Adding someone to the opening keynote

`src/data/keynote-cast.ts` holds the running order per edition — who hosts
(`lead`), who is an invited guest (`guest`), who sits on the panel (`panel`). Those
drive three different card treatments. Add the slug to the right list; the
`keynote` boolean is derived from membership, so there is no second flag to keep
in step.

### Editions with no Pretalx event

2023 reads a frozen `src/content/schedule/speakers-{year}.json`. It is historical
and not meant to be extended.

---

## Sessions

Sessions are **not** edited in this repo or in a Sheet — they are authored in Pretalx
(`cfp.cloudnativedays.fr`). The site normalizes Pretalx's released-schedule export into a
`SessionRow` (see `src/lib/schedule.ts` and `src/lib/pretalx.ts`); the field-by-field mapping
lives there, not in a CSV header.

- **Title, room, format, start time, duration, track, language, description** — edited
  directly on the talk in Pretalx.
- **Speakers** — Pretalx's own speaker list for the talk, resolved to the site's speaker
  slugs via `src/data/speaker-slugs.ts`, keyed by the speaker's exact Pretalx name. A
  speaker must have an entry there before their talk will build — the failure is loud and
  names them.
- **Slides** — a talk resource (file or link) in Pretalx.
- **Replay** — a talk resource of type link, titled `Replay`, pointing at the YouTube/Vimeo
  URL. Setting this is what drives a talk onto `/replays`.
- **Status** — only talks in the released schedule version are exported; hiding a talk in
  Pretalx removes it from the site on the next build.

### How to add or edit a session

1. Edit the talk directly in Pretalx (title, room, slot, track, resources, …).
2. If speakers changed, confirm every speaker's Pretalx `name` has an entry in
   `src/data/speaker-slugs.ts` — a mismatch fails the build loudly rather than silently
   dropping the name.
3. Trigger a rebuild (see below). Production fetches the released schedule export live; there
   is no separate "publish" step like the Sheet-backed rosters have.

Editions with no public Pretalx event (2023, and 2027 until its event opens) read a frozen
`src/content/schedule/sessions-{year}.json` archive instead — that JSON is historical and is
not meant to be extended.

> **2027 landmine:** `sessions-2027.json` is intentionally `[]`. Do **not** regenerate it from
> the Sheet — that tab holds a contaminated scratch copy of the 2026 rows (identical ids, all
> dated 2026-02-03, one with a Linear URL pasted into its title). 2027 gets real data once its
> Pretalx event is public and `PRETALX_EVENT[2027]` is set in `src/lib/pretalx.ts`.

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
3. Normalize each talk into a `SessionRow`, resolving speaker names to slugs via
   `src/data/speaker-slugs.ts`.
4. Read the "Niveau de la présentation" answers (question 4) with the API token, for
   the scheduled talks only, and map them onto `level`.

**Speakers** (`src/lib/speaker-source.ts`):

1. Take the people from the same released export — that set is the allowlist, so a
   speaker on an unannounced submission cannot reach the site.
2. Read their company, role and social links from the Pretalx speaker questions, using
   the API token. Without a token these are empty and the build warns; with
   `PRETALX_TOKEN_REQUIRED=1` (set by the image build) it fails instead.
3. Merge in the two things Pretalx cannot own: the slug from `src/data/speaker-slugs.ts`,
   and the keynote role from `src/data/keynote-cast.ts`.
4. Editions with no Pretalx event read `src/content/schedule/speakers-{year}.json`.

### When Pretalx is down

The two failure kinds are treated differently, because only one of them is ours:

| Failure | Retried? | Under `PRETALX_TOKEN_REQUIRED=1` |
|---|---|---|
| No token, or a token that is rejected (401/403) | no — retrying cannot fix it | **always fatal** |
| Unreachable, timed out, 5xx, 429 | yes, three times with backoff | fatal, unless `PRETALX_ALLOW_DEGRADED=1` |
| Any other 4xx | no — the request is wrong | fatal, unless `PRETALX_ALLOW_DEGRADED=1` |

The public schedule read falls back to the committed
`src/content/schedule/pretalx-{year}.json` snapshot during an outage. The
authenticated reads have no equivalent — nothing authenticated is cached to
disk, by design — so a build during a sustained outage would ship a speakers
page with every affiliation blank and a schedule with no level chips.

That is a real regression, so it stays fatal by default and has to be chosen:

```bash
PRETALX_ALLOW_DEGRADED=1 docker build .   # Pretalx is down, ship anyway
```

Rebuild once Pretalx is back — nothing re-fetches on its own.

### Running locally with the Pretalx token

Speaker company/role/socials and talk levels are authenticated reads, so they need
a token. Once, per machine:

```bash
cp .env.example .env.local     # .env* is gitignored
$EDITOR .env.local             # paste the token into PRETALX_API_TOKEN
```

Then `pnpm dev`, `pnpm build` and `pnpm test` all pick it up with no prefix and
nothing to remember. A real environment variable still wins, so
`PRETALX_API_TOKEN=other pnpm build` overrides the file and CI is unaffected.

Without a token nothing breaks: the build warns and renders speakers with no
affiliation and a schedule with no level chips, which is fine for working on
layout. The production image sets `PRETALX_TOKEN_REQUIRED=1` so a release cannot
ship in that state.

Note that Astro exposes `.env` values through `import.meta.env`, not
`process.env`. The Pretalx code reads `process.env` so the same path works with
the Docker secret file, so `scripts/load-local-env.mjs` bridges the two from
`astro.config.mjs` and `vitest.config.ts`. Dropping a `.env.local` in without
that bridge would look correct and load nothing.

**Sponsors, team** (`src/lib/remote-csv.ts`):

1. If the corresponding env var (e.g. `SPONSORS_CSV_URL_2026`) is set and non-empty, fetch the CSV from that URL.
2. Otherwise, read the local file under `src/content/{…}/*.csv`.
3. Parse CSV, validate each row against the Zod schema in `src/content.config.ts`, skip invalid rows with a warning, expose a typed list to the rest of the code.

This means a production deploy with env vars set always reflects the latest Pretalx schedule and Sheet snapshots at build time. Rebuilding is the only "publish" action.

## Triggering a rebuild in production

The site image is built by `.github/workflows/build-image.yml` on every push. Actual deployment (pulling the new image, rolling restarts) is owned by the [`cnd-platform`](https://github.com/cloudnativedays-france/cnd-platform) repository — see its README for the rebuild webhook / GitOps cadence.

In development a rebuild is just `pnpm dev` hot-reload or `pnpm build` for a fresh bundle.
