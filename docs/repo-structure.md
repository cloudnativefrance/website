# Repository structure

A short tour of the important directories. The site is small on purpose — reading the code is usually faster than reading documentation about the code — but this map helps you find the right file on day one.

## Top level

```
.
├── src/             Application source (see sections below)
├── tests/           Build-output integration tests (vitest)
├── public/          Static assets copied verbatim to /dist (favicons, robots.txt)
├── docs/            Contributor documentation (you are here)
├── .planning/       GSD workflow artifacts — roadmap, phases, plans, summaries
├── .github/         CI workflows (currently: build-image.yml → Docker image)
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

Local CSV fallbacks that stand in when the production Google Sheet env vars are unset (typical in dev). One CSV per entity: `schedule/sessions.csv`, `schedule/speakers.csv`, `sponsors/sponsors.csv`, `team/team.csv`. **These are fallbacks, not the source of truth** — editing them is acceptable in development but content changes must land in the Google Sheets for production. See `docs/updating-content.md`.

## src/lib

Framework-free helpers. `remote-csv.ts` fetches the Google Sheet CSVs (with the local files as fallbacks). `schedule.ts`, `speakers.ts`, `sponsors.ts`, `team.ts` parse and expose typed data (`loadSessions`, `getAllSpeakers`, etc.). `cfp.ts` holds the event lifecycle constants (`TARGET_DATE`, `CFP_OPENS`, `getCfpState`). `event-schema.ts` builds the JSON-LD structured-data payload.

## src/i18n

Bilingual plumbing. `ui.ts` holds every translation string keyed by locale (FR = default, EN = fallback chain). `utils.ts` exposes `getLangFromUrl`, `useTranslations(lang)`, and `getLocalePath`. **Never hardcode a user-facing string** — always route it through a translation key. See `CONTRIBUTING.md`.

## src/content.config.ts

Zod schemas for the four CSV-backed entities. This file is the source of truth for required vs optional columns — when `docs/updating-content.md` describes columns, it points here rather than duplicating the shape.

## tests/build

Build-output integration tests. These read HTML files from `dist/`, so `pnpm build` must run before `pnpm vitest run tests/build/*`. The test helper `readPage(relativePath)` handles path resolution and will error with a "Run 'pnpm build' first" message when `dist/` is stale or missing.

Unit tests for pure helpers live next to the code: `src/lib/__tests__/*.test.ts`.

## .planning

The GSD (get-shit-done) workflow lives here. Each phase has its own directory under `.planning/phases/` containing the phase's CONTEXT.md, RESEARCH.md, PLAN.md files, SUMMARY.md files, and a VERIFICATION.md. `.planning/ROADMAP.md` is the master phase list; `.planning/STATE.md` tracks which phase is active and the cumulative plan/task count. New contributors don't need to edit any of these — they're generated and maintained by the workflow commands.
