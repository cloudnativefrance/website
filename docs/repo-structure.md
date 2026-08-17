# Repository structure

A short tour of the important directories. The site is small on purpose — reading the code is usually faster than reading documentation about the code — but this map helps you find the right file on day one.

## Top level

```
.
├── src/             Application source (see sections below)
├── tests/           Build-output integration tests (vitest)
├── public/          Static assets copied verbatim to /dist (favicons, robots.txt)
├── docs/            Contributor documentation (you are here)
├── .planning.gsd-archive/  Frozen GSD-era planning artifacts (read-only)
├── docs/superpowers/  Current specs and plans (Superpowers workflow)
├── .github/         CI workflows: test, build-image, build-ente-web, flag-cron
├── nginx/           Runtime nginx config baked into the Docker image
├── Dockerfile       Multi-stage Astro build → nginx:alpine runtime
├── astro.config.mjs Astro + integrations (React, sitemap, tailwind)
├── CLAUDE.md        Canonical Design Rules + Data Rules
├── DESIGN.md        Design system tokens and component patterns
├── STITCH_WORKFLOW.md  Google Stitch workflow
├── README.md        Project overview and quickstart
└── CONTRIBUTING.md  Contribution rules and PR flow
```

## src/pages

File-based routing. Every `.astro` file under `src/pages/` becomes a route. French routes live at the root (`src/pages/index.astro` → `/`); English mirrors live under `src/pages/en/` (`src/pages/en/index.astro` → `/en/`). Dynamic routes use `[slug].astro` — e.g. `src/pages/speakers/[slug].astro` generates one HTML page per speaker slug at build time.

## src/components

Shared UI. Most components are `.astro` (server-rendered, zero JS). Files ending in `.tsx` are React components used as interactive islands — look for `client:idle` or `client:visible` directives at their call sites. Components are grouped by feature: `cfp/`, `hero/`, `replays/`, `schedule/`, `speakers/`, `sponsors/`, `team/`, `venue/`.

## src/content

Local CSV/JSON fallbacks that stand in when the production Google Sheet env vars are unset, or the production Pretalx instance is unreachable (typical in dev).

**Sessions and speakers** come from Pretalx, not a Sheet. The committed offline fallback is `schedule/pretalx-{year}.json` (refreshed via `pnpm sync:pretalx`). Editions with no Pretalx event read frozen archives instead: `schedule/sessions-{year}.json` and `schedule/speakers-{year}.json` — currently 2023 (historical) and 2027 (both empty until its event opens). There are no speaker CSVs; those were removed when the pipeline moved to Pretalx.

**Sponsors and team** remain Sheet-backed: `sponsors/sponsors-{2023,2026,2027}.csv` and `team/team.csv`.

**These are fallbacks, not the source of truth** — editing them is acceptable in development, but content changes must land in Pretalx (sessions, speakers) or the Google Sheets (sponsors, team) for production. See `docs/updating-content.md`.

## src/lib

Framework-free helpers.

*Pretalx pipeline:* `pretalx.ts` (public released-schedule export + the pure normalizers), `pretalx-private.ts` (authenticated reads — speaker questions and talk levels — gated on an allowlist taken from the public export), `speaker-source.ts` (assembles a `SpeakerRecord`), `frozen-archive.ts` (the JSON archives for editions with no Pretalx event), `remote-fetch.ts` (fetch-with-fallback plumbing shared with the CSV path).

*Sheets pipeline:* `remote-csv.ts` fetches the sponsor and team CSVs with the local files as fallbacks; `csv.ts` parses them.

*Domain:* `schedule.ts` and `speakers.ts` expose the typed data (`loadSessions`, `getAllSpeakers`, …); `schedule-filter.ts` holds the pure filter predicate and slot grouping; `sponsor-utils.ts` and `track-pill.ts` are presentation helpers; `color-contrast.ts` backs the a11y contrast tests. `event.ts` holds the event anchor (`TARGET_DATE`, `isPostEvent`) and outbound URLs. `flags.ts` holds the pure flag-state evaluator (`getFlagState`, `isFlagActive`) — CFP date logic lives in `src/config/flags.ts`. `event-schema.ts` builds the JSON-LD payload. `site-env.ts` owns the single production-origin literal.

There is no `sponsors.ts` or `team.ts`; those collections are loaded declaratively in `src/content.config.ts`.

## src/i18n

Bilingual plumbing. `ui.ts` holds every translation string keyed by locale (FR = default, EN = fallback chain). `utils.ts` exposes `getLangFromUrl`, `useTranslations(lang)`, and `getLocalePath`. **Never hardcode a user-facing string** — always route it through a translation key. See `CONTRIBUTING.md`.

## src/content.config.ts

Zod schemas and loaders for every content collection: `speakers-{year}` (a `pretalx:speakers-{year}` loader, not CSV), `sponsors-{year}` and `team` (both CSV). This file is the source of truth for required vs optional fields — when `docs/updating-content.md` describes columns, it points here rather than duplicating the shape.

## tests/build

Build-output integration tests. These read HTML files from `dist/`, so `pnpm build` must run before `pnpm vitest run tests/build/*`. `speaker-profile.test.ts` and `speaker-talks.test.ts` each define a local `readPage()` that errors with a "Run 'pnpm build' first" message; newer files read `dist/` directly and surface a raw `ENOENT`. There is no shared helper.

Unit tests for pure helpers live next to the code: `src/lib/__tests__/*.test.ts`. Component tests that render through the Astro container API live at `src/components/**/__tests__/*.test.ts` and run in a separate Vitest project — see `docs/testing.md`.

## Planning artifacts

Current specs and plans live under `docs/superpowers/` (the Superpowers workflow: brainstorming → writing-plans → executing-plans). Historical GSD-era artifacts are frozen under `.planning.gsd-archive/` for reference and `git log --follow` traceability — do not resume authoring there. New contributors don't need to edit either.
