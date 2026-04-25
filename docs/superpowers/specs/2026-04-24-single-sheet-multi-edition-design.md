# Single Google Sheet, Multi-Edition Data Source

**Date:** 2026-04-24
**Status:** Draft — awaiting user review

## Goal

Make one Google Sheet (with multiple tabs) the single upstream source of truth for every editable site entity — speakers, sessions, sponsors, team — across the three editions that will live on the site simultaneously: **2023**, **2026**, **2027**. Render a dedicated page per year for `programme`, `speakers`, and `sponsors`, wire them up via a nav dropdown (one entry per year, like a conference archive), and keep `team` as a single shared entity.

## Non-Goals

- Redesigning the visual language of the new year pages. They will reuse the existing `/programme`, `/speakers`, `/sponsors` layouts. Year-specific visual treatment is out of scope for this spec.
- Replacing `/2023` photo-recap page. It stays as-is; the new `/programme/2023`, `/speakers/2023`, `/sponsors/2023` are programme/roster/exhibitor pages, complementary to the recap.
- Restructuring how `sessions` reference `speakers`. Sessions still reference speakers by slug; speakers are year-scoped, so cross-year references are not possible (and not needed — a session in `sessions-2026` references slugs in `speakers-2026`).

## Context

Today's data flow:

- 4 separate Google Sheet publish URLs (env vars: `SCHEDULE_SESSIONS_CSV_URL`, `SCHEDULE_SPEAKERS_CSV_URL`, `SPONSORS_CSV_URL`, `TEAM_CSV_URL`). `SPONSORS_CSV_URL` and `TEAM_CSV_URL` are unset — build uses committed fallback CSVs.
- `sessions`, `speakers`, `sponsors`, `team` have **no year column**. All data is implicitly 2026.
- `/programme`, `/speakers`, `/sponsors`, `/team` (FR + EN mirror) all render "current" (= 2026 implicitly).
- `/2023` (FR) + `/en/2023` — photo-recap page driven by hardcoded `EDITION_2023` in `src/lib/editions-data.ts`. Has stats, 10 photos, brand-history callout. Not a programme page.

User reference for the end-state nav shape: dropdown menu exposing per-year entries (e.g., "Exposants 2026", "Exposants 2025", "Exposants 2023" in a single dropdown).

## Data Model

### Tab layout in the Google Sheet

Ten tabs, each published-to-web individually (each yields its own `gid=…` CSV URL):

| Tab               | Source of                                                                |
|-------------------|--------------------------------------------------------------------------|
| `sessions-2023`   | All 2023 sessions                                                         |
| `sessions-2026`   | All 2026 sessions (existing data migrates here)                           |
| `sessions-2027`   | All 2027 sessions (empty at first)                                        |
| `speakers-2023`   | 2023 speaker roster                                                       |
| `speakers-2026`   | 2026 speaker roster (existing data migrates here)                         |
| `speakers-2027`   | 2027 speaker roster (empty at first)                                      |
| `sponsors-2023`   | 2023 sponsor roster                                                       |
| `sponsors-2026`   | 2026 sponsor roster                                                       |
| `sponsors-2027`   | 2027 sponsor roster (empty at first)                                      |
| `team`            | Current organising team. Shared across the site. Not year-scoped.         |

Each tab preserves the **existing column schema** for its type. No new columns introduced — edition identity is encoded in the tab itself, not in a row column.

### Speaker slug uniqueness

Because speakers are year-scoped, slugs need only be unique **within a tab**. A speaker who returns in 2026 and 2027 has two rows (one per year) and may share the same slug across years, since each year's rows live in a separate collection. This is the natural consequence of the user's "one tab per year for speakers" choice.

## Code Changes

### 1. Single-edition constant

New file `src/lib/editions.ts`:

```ts
export const EDITIONS = [2023, 2026, 2027] as const;
export type Edition = (typeof EDITIONS)[number];
export const CURRENT_EDITION: Edition = 2027;
```

Consumed everywhere a route needs to redirect "bare → current" or a nav needs "what's the upcoming year."

### 2. `src/lib/remote-csv.ts`

Replace the 4 hardcoded URL exports with a lookup table:

```ts
export const CSV_URLS = {
  sessions: {
    2023: process.env.SESSIONS_CSV_URL_2023 || "",
    2026: process.env.SESSIONS_CSV_URL_2026 || "<prod publish URL>",
    2027: process.env.SESSIONS_CSV_URL_2027 || "",
  },
  speakers: { 2023: …, 2026: …, 2027: … },
  sponsors: { 2023: …, 2026: …, 2027: … },
  team:     process.env.TEAM_CSV_URL || "",
} as const;

export function getCsvUrl(
  type: "sessions" | "speakers" | "sponsors",
  year: Edition,
): string { … }
```

The existing `SCHEDULE_SESSIONS_CSV_URL` / `SCHEDULE_SPEAKERS_CSV_URL` env vars migrate to the new `SESSIONS_CSV_URL_2026` / `SPEAKERS_CSV_URL_2026` slots (production value unchanged). Old env vars are dropped — no backwards compat.

`fetchCsvOrFallback` signature is unchanged; callers just pass a different `url` and `fallbackRelPath` per year.

### 3. `src/content.config.ts`

Currently 3 collections (`speakers`, `sponsors`, `team`). Becomes 7:

- `speakers-2023`, `speakers-2026`, `speakers-2027`
- `sponsors-2023`, `sponsors-2026`, `sponsors-2027`
- `team`

The `csvLoader` factory stays as-is — each collection passes its own `(url, fallback, label)` triple. Zod schemas per type are unchanged.

**Collection naming:** use hyphenated names (`"speakers-2023"`) — Astro supports hyphens in collection names, and it mirrors the tab names, which makes the `remote-csv.ts` → `content.config.ts` wiring trivially inspectable.

### 4. `src/lib/schedule.ts`

- `loadSessions()` → `loadSessions(year: Edition = CURRENT_EDITION)`.
- Looks up the URL via `getCsvUrl("sessions", year)`.
- Fallback path becomes `src/content/schedule/sessions-${year}.csv`.

### 5. `src/lib/speakers.ts`

Helpers that currently assume a single `speakers` collection accept a year:

- `getSpeakersByLocale(lang: Locale, year: Edition = CURRENT_EDITION)`
- `getSpeakerBySlug(slug: string, year: Edition = CURRENT_EDITION)`
- Any other current helpers — follow the same default-to-CURRENT pattern.

Internally, `getSpeakersByLocale(lang, 2026)` calls `getCollection("speakers-2026")`.

### 6. Sponsor helper

`src/lib/sponsor-utils.ts` gets a `getSponsors(year: Edition = CURRENT_EDITION)` export that wraps `getCollection("sponsors-${year}")`. Existing callers pass no year (default) and nothing changes at call-sites until the route migration happens.

### 7. Local fallback CSVs

Under `src/content/schedule/`, `src/content/sponsors/` — one CSV per year, e.g. `sessions-2023.csv`, `sessions-2026.csv`, `sessions-2027.csv`, etc. Existing `sessions.csv`, `speakers.csv`, `sponsors.csv` → rename `*-2026.*`. New empty `*-2023.*` and `*-2027.*` files with header-only rows so offline builds succeed.

### 8. Redirects

Bare paths redirect to `CURRENT_EDITION`. Astro supports redirects in `astro.config.mjs`:

```js
redirects: {
  "/programme": "/programme/2027",
  "/speakers":  "/speakers/2027",
  "/sponsors":  "/sponsors/2027",
  "/en/programme": "/en/programme/2027",
  "/en/speakers":  "/en/speakers/2027",
  "/en/sponsors":  "/en/sponsors/2027",
}
```

Bare `/2023` keeps its current photo-recap page (redirect is **not** added for `/2023`). The new `/programme/2023`, `/speakers/2023`, `/sponsors/2023` pages link back to `/2023` as "Revoir l'édition 2023" / "Relive the 2023 edition".

## Routes

### Year-scoped dynamic routes

Implemented with Astro `[year].astro` + `getStaticPaths` that returns `EDITIONS.map((year) => ({ params: { year: String(year) } }))`:

**Sponsors:**
- `src/pages/sponsors/[year].astro` (FR)
- `src/pages/en/sponsors/[year].astro` (EN)

**Programme:**
- `src/pages/programme/[year].astro`
- `src/pages/en/programme/[year].astro`

**Speakers index:**
- `src/pages/speakers/[year]/index.astro`
- `src/pages/en/speakers/[year]/index.astro`

**Speaker detail:**
- `src/pages/speakers/[year]/[slug].astro`
- `src/pages/en/speakers/[year]/[slug].astro`

The existing `src/pages/speakers/[slug].astro` and `src/pages/speakers/index.astro` are replaced by the year-scoped variants. Same for the flat `/sponsors.astro` — replaced by `/sponsors/[year].astro`.

### Breaking URL change: speaker detail pages

`/speakers/[slug]` URLs (e.g., `/speakers/petazzoni`) are replaced by `/speakers/[year]/[slug]` (e.g., `/speakers/2026/petazzoni`). Any existing external link to a bare-slug speaker URL will 404. To avoid the break, add a shim page `src/pages/speakers/[slug].astro` whose sole job is to call `Astro.redirect("/speakers/" + CURRENT_EDITION + "/" + slug, 301)`. Same for `/en/speakers/[slug]`. This keeps inbound links and search-indexed URLs working through the transition.

### Empty-state

When a year's tab is empty (likely: 2023 programme data we may never backfill; 2027 before CFP opens), the page renders a localised "À venir" / "Coming soon" message rather than crashing or 404'ing. This keeps all 9 pages link-safe from the nav dropdown even before content arrives.

## Navigation

Update the header nav component (TBD during planning — verify existing nav implementation). For each of **Programme**, **Speakers**, **Exposants**, replace the single link with a dropdown:

- **Trigger:** text label + chevron.
- **Menu:** list of years in descending order (2027 — highlighted as current — then 2026, 2023).
- **Behaviour:** click-to-open on mobile (tap-outside-to-close); on desktop, hover-and-focus with a short close delay.
- **A11y:** `aria-haspopup="menu"`, `aria-expanded` toggled, arrow-key navigation, Escape closes, focus returns to trigger.
- **Label text:** i18n keys (e.g., `nav.programme.2027`, falling back to a generic `"Programme {year}"` if no per-year label is defined).

Team and Contact remain single links.

## Migration Order

Five steps. Steps 1–4 are atomic commits, each leaving the site building and existing routes working. Step 5 is the user's out-of-band Sheet-population task — happens after all code has landed.

1. **Introduce `editions.ts` + lookup tables + rename fallback CSVs.** No new routes yet, no collection-config changes. Existing consumers default to `CURRENT_EDITION`. Verification: dev server renders `/programme`, `/sponsors`, `/speakers` identically to before.
2. **Refactor `content.config.ts` + helpers.** Split collections, thread `year` params through `loadSessions`, `getSpeakersByLocale`, `getSponsors`. Update `/programme`, `/speakers`, `/sponsors` consumers to call with an explicit year (`CURRENT_EDITION`). Existing URLs still work (same paths, same rendered output).
3. **Introduce year-scoped dynamic routes + redirects.** Move existing pages to `[year].astro`. Add astro.config redirects. Verification: `/programme` → `/programme/2027`, all 3 years' pages build with 0-row fallback CSVs.
4. **Add nav dropdown.** Verification: manual click-through on all 6 dropdown targets (3 FR + 3 EN).
5. **Populate Google Sheet tabs (user task, out of band).** The 2026 tabs are populated from migrated existing data; 2023 and 2027 tabs start empty or with backfilled data as the user adds it. Once sheets are published, set the env vars in the production build.

## Testing

- **Unit (Vitest):** `loadSessions(year)` resolves the right URL for each year (mock `fetchCsvOrFallback`). `getSpeakersByLocale(lang, year)` returns the right collection. `getCsvUrl("type", year)` returns the right env var precedence.
- **Component:** existing programme/speakers/sponsors component tests keep passing with `vi.mock("astro:content")` updated to mock the per-year collections.
- **Build/smoke:** `pnpm build` must succeed with empty 2023/2027 fallback CSVs. Crawl the built `dist/` for expected HTML output at `/programme/2023`, `/programme/2026`, `/programme/2027` (and EN mirrors, and sponsors, and speakers).
- **Manual dev-server check:** open every new route, verify nav dropdowns open/close, redirects work.

## Open Questions for Implementation Plan

These are deferred to `writing-plans`:

- What does the empty-state look like visually? (Short copy + link back to home? Let Stitch inform this.)
- Nav dropdown: is it an existing shadcn/ui menu component, or does it need a new React island? (Depends on current nav implementation — check.)
- Does `/2023`'s Ente gallery-URL / playlist-URL stay in `editions-data.ts`, or do those move to a new `editions-{year}.json` alongside the CSV tabs? (For now: stay in `editions-data.ts` — out of scope.)
- `src/lib/editions-data.ts` has `EDITION_2026.stats` and `EDITION_2023.stats` hardcoded (participant counts, etc.). Does this also move to the Sheet? (For now: **no**. Stats are low-churn, appear on the homepage only, and are not user-authored content. Revisit if the user asks.)

## Success Criteria

- All four data types (sessions, speakers, sponsors, team) flow from a single Google Sheet URL (different tabs → different `gid` CSV URLs).
- Navigating to `/programme/2023` renders the 2023 programme (or empty-state); same for 2026, 2027, and for speakers + sponsors.
- The nav header exposes year-pick dropdowns for Programme, Speakers, Exposants.
- No hardcoded speaker/session/sponsor/team rows remain in `.astro`/`.ts`/`.tsx` files (tests excepted).
- `pnpm build` passes; `pnpm test` passes.
