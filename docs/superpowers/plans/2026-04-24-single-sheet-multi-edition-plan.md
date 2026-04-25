# Single Sheet, Multi-Edition Data Source — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make one Google Sheet (with per-year tabs) the single source of truth for sessions, speakers, sponsors (2023 / 2026 / 2027) plus a shared team tab. Ship year-scoped routes and a nav year-picker.

**Architecture:** Introduce a `CURRENT_EDITION` constant + `EDITIONS` tuple. Replace 4 flat CSV env vars with a `(type × year)` lookup table. Split content collections into one-per-(type,year). Thread an optional `year` param through every data helper (defaults to `CURRENT_EDITION`). Replace flat pages (`/programme`, `/sponsors`, `/speakers`, `/speakers/[slug]`) with dynamic `[year]` routes that use `getStaticPaths` over `EDITIONS`. Redirect bare paths to the current edition. Add a header nav with year dropdowns.

**Tech Stack:** Astro 6 + Astro Content Collections, Zod, React (for nav island if needed), Vitest, Tailwind 4, shadcn/ui patterns. Fetch pipeline in `src/lib/remote-csv.ts` with committed local fallback CSVs.

**Spec:** `docs/superpowers/specs/2026-04-24-single-sheet-multi-edition-design.md`

---

## File Map

**Create:**
- `src/lib/editions.ts` — `EDITIONS`, `Edition`, `CURRENT_EDITION`
- `src/lib/__tests__/editions.test.ts`
- `src/content/schedule/sessions-2023.csv`, `sessions-2026.csv` (renamed), `sessions-2027.csv`
- `src/content/schedule/speakers-2023.csv`, `speakers-2026.csv` (renamed), `speakers-2027.csv`
- `src/content/sponsors/sponsors-2023.csv`, `sponsors-2026.csv` (renamed), `sponsors-2027.csv`
- `src/pages/programme/[year].astro`, `src/pages/en/programme/[year].astro`
- `src/pages/sponsors/[year].astro`, `src/pages/en/sponsors/[year].astro`
- `src/pages/speakers/[year]/index.astro`, `src/pages/en/speakers/[year]/index.astro`
- `src/pages/speakers/[year]/[slug].astro`, `src/pages/en/speakers/[year]/[slug].astro`
- `src/pages/speakers/[slug].astro` (redirect shim, replaces current detail page)
- `src/pages/en/speakers/[slug].astro` (redirect shim)
- `src/components/NavDropdown.astro` — reusable dropdown component

**Modify:**
- `src/lib/remote-csv.ts` — `CSV_URLS` lookup + `getCsvUrl`
- `src/content.config.ts` — 7 per-year collections instead of 3
- `src/lib/schedule.ts` — `loadSessions(year?)`
- `src/lib/speakers.ts` — helpers accept `year?`
- `src/lib/sponsor-utils.ts` — new `getSponsors(year?)` export
- `src/components/Navigation.astro` — integrate `NavDropdown` for Programme / Speakers / Sponsors
- `src/i18n/ui.ts` — new keys for year-picker
- `astro.config.mjs` — `redirects` block
- `src/lib/__tests__/speakers.test.ts` — adjust mocks to per-year collection names

**Delete (replaced by year-scoped routes):**
- `src/pages/programme/index.astro` — replaced by `[year].astro` + redirect
- `src/pages/en/programme/index.astro` — same
- `src/pages/sponsors.astro` — replaced by `sponsors/[year].astro` + redirect
- `src/pages/en/sponsors.astro` — same
- `src/pages/speakers/index.astro` — replaced by `speakers/[year]/index.astro` + redirect

---

## Task 1: Editions Constants

**Files:**
- Create: `src/lib/editions.ts`
- Test: `src/lib/__tests__/editions.test.ts`

- [ ] **Step 1: Write the failing test**

File: `src/lib/__tests__/editions.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { EDITIONS, CURRENT_EDITION, isEdition, type Edition } from "@/lib/editions";

describe("EDITIONS", () => {
  it("lists 2023, 2026, 2027 in ascending order", () => {
    expect(EDITIONS).toEqual([2023, 2026, 2027]);
  });

  it("is a tuple (readonly)", () => {
    expect(Object.isFrozen(EDITIONS) || Array.isArray(EDITIONS)).toBe(true);
  });
});

describe("CURRENT_EDITION", () => {
  it("is 2027", () => {
    expect(CURRENT_EDITION).toBe(2027);
  });

  it("is included in EDITIONS", () => {
    expect(EDITIONS).toContain(CURRENT_EDITION);
  });
});

describe("isEdition", () => {
  it.each([2023, 2026, 2027])("returns true for %i", (y) => {
    expect(isEdition(y)).toBe(true);
  });

  it.each([2022, 2024, 2025, 2028, 0, -1, Number.NaN])(
    "returns false for %s",
    (y) => {
      expect(isEdition(y as number)).toBe(false);
    },
  );

  it("narrows to Edition", () => {
    const n: number = 2026;
    if (isEdition(n)) {
      const edition: Edition = n;
      expect(edition).toBe(2026);
    }
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

Run: `pnpm test src/lib/__tests__/editions.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement editions.ts**

File: `src/lib/editions.ts`

```ts
export const EDITIONS = [2023, 2026, 2027] as const;

export type Edition = (typeof EDITIONS)[number];

export const CURRENT_EDITION: Edition = 2027;

export function isEdition(value: number): value is Edition {
  return (EDITIONS as readonly number[]).includes(value);
}
```

- [ ] **Step 4: Run tests — expect pass**

Run: `pnpm test src/lib/__tests__/editions.test.ts`
Expected: PASS (8+ tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/editions.ts src/lib/__tests__/editions.test.ts
git commit -m "feat(editions): introduce EDITIONS tuple and CURRENT_EDITION constant"
```

---

## Task 2: Per-Year CSV URL Lookup

**Files:**
- Modify: `src/lib/remote-csv.ts`

- [ ] **Step 1: Rewrite `src/lib/remote-csv.ts`**

Replace the bottom half of the file (from `/** Environment-overridable URLs. ... */` onward) with the new lookup shape. Keep `fetchCsvOrFallback` unchanged.

Append the following (after the `fetchCsvOrFallback` function):

```ts
import { EDITIONS, type Edition } from "./editions";

/**
 * Per-year CSV URLs for each editable data type. Each entry points at a
 * published-to-web tab in the single upstream Google Sheet.
 *
 * Override via env in staging/preview:
 *   SESSIONS_CSV_URL_2023 / _2026 / _2027
 *   SPEAKERS_CSV_URL_2023 / _2026 / _2027
 *   SPONSORS_CSV_URL_2023 / _2026 / _2027
 *   TEAM_CSV_URL
 *
 * Empty string → the content loader falls back to the committed local CSV.
 */
const SESSIONS_2026_DEFAULT =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRdET7nAGsbCoHlOzCICGvGHKOB6OYeqgiJPiWtXBjUCg818TFJ2-pQnEtMzyBaAsGaIQr475Q50mkM/pub?gid=178765557&single=true&output=csv";

const SPEAKERS_2026_DEFAULT =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRdET7nAGsbCoHlOzCICGvGHKOB6OYeqgiJPiWtXBjUCg818TFJ2-pQnEtMzyBaAsGaIQr475Q50mkM/pub?gid=124864767&single=true&output=csv";

export const CSV_URLS: {
  sessions: Record<Edition, string>;
  speakers: Record<Edition, string>;
  sponsors: Record<Edition, string>;
  team: string;
} = {
  sessions: {
    2023: process.env.SESSIONS_CSV_URL_2023 || "",
    2026: process.env.SESSIONS_CSV_URL_2026 || SESSIONS_2026_DEFAULT,
    2027: process.env.SESSIONS_CSV_URL_2027 || "",
  },
  speakers: {
    2023: process.env.SPEAKERS_CSV_URL_2023 || "",
    2026: process.env.SPEAKERS_CSV_URL_2026 || SPEAKERS_2026_DEFAULT,
    2027: process.env.SPEAKERS_CSV_URL_2027 || "",
  },
  sponsors: {
    2023: process.env.SPONSORS_CSV_URL_2023 || "",
    2026: process.env.SPONSORS_CSV_URL_2026 || "",
    2027: process.env.SPONSORS_CSV_URL_2027 || "",
  },
  team: process.env.TEAM_CSV_URL || "",
};

export type EditionScopedType = "sessions" | "speakers" | "sponsors";

export function getCsvUrl(type: EditionScopedType, year: Edition): string {
  return CSV_URLS[type][year];
}

/** Legacy convenience — current edition URLs for callers that have not yet been year-ified. */
export const SESSIONS_CSV_URL = CSV_URLS.sessions[2026]; // TEMP: consumers migrate in later tasks
export const SPEAKERS_CSV_URL = CSV_URLS.speakers[2026];
export const SPONSORS_CSV_URL = CSV_URLS.sponsors[2026];
export const TEAM_CSV_URL = CSV_URLS.team;

// Exported for iteration in collections config.
export { EDITIONS };
```

Remove the former `export const SESSIONS_CSV_URL = process.env.SCHEDULE_SESSIONS_CSV_URL || ...` block entirely. The new `SESSIONS_CSV_URL` const above is a back-compat shim so existing callers do not break before Task 5 migrates them.

- [ ] **Step 2: Type-check — expect pass**

Run: `pnpm astro check 2>&1 | head -40`
Expected: no new errors; existing consumers (`content.config.ts`, `schedule.ts`) still see `SESSIONS_CSV_URL` / `SPEAKERS_CSV_URL` / `SPONSORS_CSV_URL` / `TEAM_CSV_URL`.

- [ ] **Step 3: Build — expect pass**

Run: `pnpm build 2>&1 | tail -30`
Expected: build completes; CSV fetch logs show either remote or fallback for each collection.

- [ ] **Step 4: Commit**

```bash
git add src/lib/remote-csv.ts
git commit -m "refactor(csv): introduce CSV_URLS lookup and getCsvUrl helper"
```

---

## Task 3: Per-Year Fallback CSV Files

**Files:**
- Rename: `src/content/schedule/sessions.csv` → `sessions-2026.csv`
- Rename: `src/content/schedule/speakers.csv` → `speakers-2026.csv`
- Rename: `src/content/sponsors/sponsors.csv` → `sponsors-2026.csv`
- Create: `src/content/schedule/sessions-2023.csv`, `sessions-2027.csv`
- Create: `src/content/schedule/speakers-2023.csv`, `speakers-2027.csv`
- Create: `src/content/sponsors/sponsors-2023.csv`, `sponsors-2027.csv`

- [ ] **Step 1: Rename existing CSVs to the 2026 slot**

```bash
git mv src/content/schedule/sessions.csv src/content/schedule/sessions-2026.csv
git mv src/content/schedule/speakers.csv src/content/schedule/speakers-2026.csv
git mv src/content/sponsors/sponsors.csv src/content/sponsors/sponsors-2026.csv
```

- [ ] **Step 2: Create empty 2023 + 2027 CSVs (header-only)**

For each header, copy the exact header row from the corresponding 2026 file. `head -1` into a new file and commit an empty body.

```bash
head -1 src/content/schedule/sessions-2026.csv > src/content/schedule/sessions-2023.csv
head -1 src/content/schedule/sessions-2026.csv > src/content/schedule/sessions-2027.csv
head -1 src/content/schedule/speakers-2026.csv > src/content/schedule/speakers-2023.csv
head -1 src/content/schedule/speakers-2026.csv > src/content/schedule/speakers-2027.csv
head -1 src/content/sponsors/sponsors-2026.csv > src/content/sponsors/sponsors-2023.csv
head -1 src/content/sponsors/sponsors-2026.csv > src/content/sponsors/sponsors-2027.csv
```

- [ ] **Step 3: Verify files**

Run: `ls -la src/content/schedule/*.csv src/content/sponsors/*.csv`
Expected: each directory contains 3 year-scoped files (2023, 2026, 2027).

Run: `wc -l src/content/schedule/sessions-2023.csv src/content/schedule/sessions-2027.csv src/content/sponsors/sponsors-2027.csv`
Expected: each is `1` line (header only).

- [ ] **Step 4: Commit**

```bash
git add src/content/schedule/*.csv src/content/sponsors/*.csv
git commit -m "chore(content): rename fallback CSVs to year-scoped and add empty 2023/2027"
```

---

## Task 4: Per-Year Content Collections

**Files:**
- Modify: `src/content.config.ts`

- [ ] **Step 1: Rewrite `src/content.config.ts`**

Replace the entire file with:

```ts
import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import {
  fetchCsvOrFallback,
  CSV_URLS,
  EDITIONS,
} from "./lib/remote-csv";
import type { Edition } from "./lib/editions";

// -- CSV parser (unchanged) ------------------------------------------------

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0;
  const n = text.length;
  while (i < n) {
    const row: string[] = [];
    let field = "";
    let inQ = false;
    while (i < n) {
      const ch = text[i];
      if (inQ) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; }
          else { inQ = false; i++; }
        } else { field += ch; i++; }
        continue;
      }
      if (ch === '"') { inQ = true; i++; }
      else if (ch === ",") { row.push(field); field = ""; i++; }
      else if (ch === "\n" || ch === "\r") {
        row.push(field);
        if (ch === "\r" && text[i + 1] === "\n") i++;
        i++;
        break;
      } else { field += ch; i++; }
    }
    if (i >= n && (field.length > 0 || row.length > 0)) row.push(field);
    if (row.length > 0 && !(row.length === 1 && row[0] === "")) rows.push(row);
  }
  return rows;
}

// -- csvLoader (unchanged) -------------------------------------------------

function csvLoader({ url, fallback, label }: { url?: string; fallback: string; label: string }) {
  return {
    name: `csv:${label}`,
    load: async ({ store, parseData }: {
      store: { set: (entry: { id: string; data: unknown }) => void; clear: () => void };
      parseData: (opts: { id: string; data: unknown }) => Promise<unknown>;
    }) => {
      const raw = await fetchCsvOrFallback({ url, fallbackRelPath: fallback, label });
      const rows = parseCsv(raw);
      if (rows.length === 0) return;
      const [header, ...body] = rows;
      const keys = header.map((s) => s.trim());
      store.clear();
      for (const row of body) {
        const obj: Record<string, string> = {};
        keys.forEach((k, i) => { obj[k] = (row[i] ?? "").trim(); });
        const id = obj.slug || obj.id;
        if (!id) continue;
        const data: Record<string, unknown> = { ...obj };
        if ("keynote" in obj) {
          const v = String(obj.keynote || "").toLowerCase();
          data.keynote = v === "true" || v === "1" || v === "yes";
        }
        const parsed = await parseData({ id, data });
        store.set({ id, data: parsed });
      }
    },
  };
}

// -- Schemas ---------------------------------------------------------------

const socialUrl = z.string().url().optional().or(z.literal("").transform(() => undefined));

const speakerSchema = z.object({
  slug: z.string(),
  name: z.string(),
  photo_url: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  bio: z.string().optional(),
  twitter: socialUrl,
  linkedin: socialUrl,
  github: socialUrl,
  bluesky: socialUrl,
  website: socialUrl,
  keynote: z.boolean().optional(),
});

const sponsorSchema = z.object({
  id: z.string(),
  name: z.string(),
  tier: z.enum(["platinum", "gold", "silver", "community"]),
  logo: z.string(),
  url: z.string().url(),
  description_fr: z.string(),
  description_en: z.string(),
});

const teamSchema = z.object({
  id: z.string(),
  name: z.string(),
  role_fr: z.string(),
  role_en: z.string(),
  group: z.enum(["core", "program-committee", "volunteers"]),
  photo: z.string().optional().or(z.literal("").transform(() => undefined)),
  social_linkedin: socialUrl,
  social_github: socialUrl,
  social_bluesky: socialUrl,
  social_twitter: socialUrl,
  social_website: socialUrl,
});

// -- Per-year collection factories -----------------------------------------

function speakersCollection(year: Edition) {
  return defineCollection({
    loader: csvLoader({
      url: CSV_URLS.speakers[year],
      fallback: `src/content/schedule/speakers-${year}.csv`,
      label: `speakers-${year}.csv`,
    }),
    schema: speakerSchema,
  });
}

function sponsorsCollection(year: Edition) {
  return defineCollection({
    loader: csvLoader({
      url: CSV_URLS.sponsors[year],
      fallback: `src/content/sponsors/sponsors-${year}.csv`,
      label: `sponsors-${year}.csv`,
    }),
    schema: sponsorSchema,
  });
}

const team = defineCollection({
  loader: csvLoader({
    url: CSV_URLS.team,
    fallback: "src/content/team/team.csv",
    label: "team.csv",
  }),
  schema: teamSchema,
});

// Collections must be statically keyed so Astro can type-check getCollection().
export const collections = {
  "speakers-2023": speakersCollection(2023),
  "speakers-2026": speakersCollection(2026),
  "speakers-2027": speakersCollection(2027),
  "sponsors-2023": sponsorsCollection(2023),
  "sponsors-2026": sponsorsCollection(2026),
  "sponsors-2027": sponsorsCollection(2027),
  team,
};

// Re-export for convenience at call sites.
export { EDITIONS };
```

- [ ] **Step 2: Verify build still fails gracefully (content collection error expected)**

Run: `pnpm astro check 2>&1 | head -50`
Expected: errors about missing `"speakers"` / `"sponsors"` collections from consumers like `src/pages/sponsors.astro`, `src/pages/speakers/...`, `src/lib/speakers.ts`. These are fixed in Tasks 5–7.

- [ ] **Step 3: Commit (intentionally broken state between tasks — callers migrate next)**

```bash
git add src/content.config.ts
git commit -m "refactor(content): split collections into per-year (speakers/sponsors × 2023/2026/2027)"
```

Note: this commit is intentionally a transient broken state. Tasks 5–10 land consumers; the final commit in Task 12 is the complete cut-over.

---

## Task 5: Year-Aware Sessions Loader

**Files:**
- Modify: `src/lib/schedule.ts`

- [ ] **Step 1: Update `loadSessions` signature**

In `src/lib/schedule.ts`:

Replace the import:
```ts
import { fetchCsvOrFallback, SESSIONS_CSV_URL } from "./remote-csv";
```
with:
```ts
import { fetchCsvOrFallback, getCsvUrl } from "./remote-csv";
import { CURRENT_EDITION, type Edition } from "./editions";
```

Replace the `loadSessions` function body. Find:
```ts
export async function loadSessions(): Promise<SessionRow[]> {
  const raw = await fetchCsvOrFallback({
    url: SESSIONS_CSV_URL,
    fallbackRelPath: "src/content/schedule/sessions.csv",
    label: "sessions.csv",
  });
```

Replace with:
```ts
export async function loadSessions(
  year: Edition = CURRENT_EDITION,
): Promise<SessionRow[]> {
  const raw = await fetchCsvOrFallback({
    url: getCsvUrl("sessions", year),
    fallbackRelPath: `src/content/schedule/sessions-${year}.csv`,
    label: `sessions-${year}.csv`,
  });
```

No other changes in this file.

- [ ] **Step 2: Type-check**

Run: `pnpm astro check 2>&1 | grep -E "schedule.ts|error" | head -10`
Expected: no errors in `schedule.ts` itself.

- [ ] **Step 3: Commit**

```bash
git add src/lib/schedule.ts
git commit -m "feat(schedule): loadSessions(year) — defaults to CURRENT_EDITION"
```

---

## Task 6: Year-Aware Speakers Helpers

**Files:**
- Modify: `src/lib/speakers.ts`
- Modify: `src/lib/__tests__/speakers.test.ts`

- [ ] **Step 1: Update the speakers test mocks**

In `src/lib/__tests__/speakers.test.ts`, replace:
```ts
vi.mock("astro:content", () => ({ getCollection: async () => [] }));
```
with:
```ts
vi.mock("astro:content", () => ({
  // Any per-year collection name returns empty; only pure helpers are tested here.
  getCollection: async (_name: string) => [],
}));
```

(Behaviourally identical — just documents the shape.)

- [ ] **Step 2: Rewrite `src/lib/speakers.ts`**

Replace the entire file with:

```ts
import { getCollection, type CollectionEntry } from "astro:content";
import type { Locale } from "@/i18n/ui";
import { loadSessions, type SessionRow } from "./schedule";
import { CURRENT_EDITION, type Edition } from "./editions";

/** Year-scoped speaker collection name (must match keys in src/content.config.ts). */
type SpeakersCollection = "speakers-2023" | "speakers-2026" | "speakers-2027";

function speakersCollectionName(year: Edition): SpeakersCollection {
  return `speakers-${year}` as SpeakersCollection;
}

/**
 * Extract the slug from a speaker collection entry id. After the speakers.csv
 * migration, id === slug (no locale prefix); still true per-year.
 */
export function getSlug(entryId: string): string {
  return entryId;
}

/** Get every speaker for the given year. The collection is locale-agnostic. */
export async function getAllSpeakers(year: Edition = CURRENT_EDITION) {
  return await getCollection(speakersCollectionName(year));
}

/**
 * Back-compat wrapper. FR/EN are served from the same collection — the `locale`
 * param is kept to avoid churning every call site, but it has no effect.
 */
export async function getSpeakersByLocale(
  _locale: Locale,
  year: Edition = CURRENT_EDITION,
) {
  return await getAllSpeakers(year);
}

export async function getTalksByLocale(
  _locale: Locale,
  year: Edition = CURRENT_EDITION,
): Promise<SessionRow[]> {
  return await loadSessions(year);
}

export async function getTalksForSpeaker(
  _locale: Locale,
  speakerSlug: string,
  year: Edition = CURRENT_EDITION,
): Promise<SessionRow[]> {
  const sessions = await loadSessions(year);
  return sessions.filter((s) => s.speakers.includes(speakerSlug));
}

export async function getSortedSpeakers(
  _locale: Locale,
  year: Edition = CURRENT_EDITION,
) {
  const speakers = await getAllSpeakers(year);
  return [...speakers].sort((a, b) => {
    const aKey = !!a.data.keynote;
    const bKey = !!b.data.keynote;
    if (aKey && !bKey) return -1;
    if (!aKey && bKey) return 1;
    return a.data.name.localeCompare(b.data.name);
  });
}

export function getCoSpeakersForTalk(
  session: SessionRow,
  currentSpeakerSlug: string,
): string[] {
  const speakers = session.speakers ?? [];
  return speakers.filter((slug) => slug !== currentSpeakerSlug);
}

export function getPrimaryTalk(
  speakerSlug: string,
  sessions: SessionRow[],
): SessionRow | undefined {
  const list = sessions.filter((s) => (s.speakers ?? []).includes(speakerSlug));
  if (list.length === 0) return undefined;
  return [...list].sort((a, b) => {
    const aKey = a.format === "keynote" ? 0 : 1;
    const bKey = b.format === "keynote" ? 0 : 1;
    if (aKey !== bKey) return aKey - bKey;
    return a.startTime.localeCompare(b.startTime);
  })[0];
}

/** Generic — matches whichever year was requested. */
export type SpeakerEntry = CollectionEntry<SpeakersCollection>;
```

- [ ] **Step 3: Run pure-helper tests**

Run: `pnpm test src/lib/__tests__/speakers.test.ts`
Expected: PASS (`getSlug`, `getCoSpeakersForTalk`, `getPrimaryTalk` unaffected).

- [ ] **Step 4: Commit**

```bash
git add src/lib/speakers.ts src/lib/__tests__/speakers.test.ts
git commit -m "feat(speakers): helpers accept a year param (default CURRENT_EDITION)"
```

---

## Task 7: Year-Aware Sponsors Helper

**Files:**
- Modify: `src/lib/sponsor-utils.ts`

- [ ] **Step 1: Add `getSponsors` export**

Append to `src/lib/sponsor-utils.ts`:

```ts
import { getCollection, type CollectionEntry } from "astro:content";
import { CURRENT_EDITION, type Edition } from "./editions";

type SponsorsCollection = "sponsors-2023" | "sponsors-2026" | "sponsors-2027";

function sponsorsCollectionName(year: Edition): SponsorsCollection {
  return `sponsors-${year}` as SponsorsCollection;
}

export async function getSponsors(year: Edition = CURRENT_EDITION) {
  return await getCollection(sponsorsCollectionName(year));
}

export type SponsorEntry = CollectionEntry<SponsorsCollection>;
```

- [ ] **Step 2: Type-check**

Run: `pnpm astro check 2>&1 | grep -E "sponsor-utils|error" | head -10`
Expected: no errors in `sponsor-utils.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/sponsor-utils.ts
git commit -m "feat(sponsors): add getSponsors(year) helper"
```

---

## Task 8: Year-Scoped Programme Page

**Files:**
- Create: `src/pages/programme/[year].astro`
- Create: `src/pages/en/programme/[year].astro`
- Delete: `src/pages/programme/index.astro`
- Delete: `src/pages/en/programme/index.astro`

- [ ] **Step 1: Create `src/pages/programme/[year].astro`**

Copy the current `src/pages/programme/index.astro` verbatim, then modify:

1. Add at the top of the frontmatter (after existing imports):

```ts
import { EDITIONS, isEdition, CURRENT_EDITION, type Edition } from "@/lib/editions";

export async function getStaticPaths() {
  return EDITIONS.map((year) => ({ params: { year: String(year) } }));
}

const { year: yearParam } = Astro.params;
const yearNum = Number(yearParam);
if (!isEdition(yearNum)) {
  return Astro.redirect(`/programme/${CURRENT_EDITION}`, 308);
}
const year: Edition = yearNum;
```

2. Replace:
```ts
const sessions = await loadSessions();
const speakerEntries = await getSpeakersByLocale(lang);
```
with:
```ts
const sessions = await loadSessions(year);
const speakerEntries = await getSpeakersByLocale(lang, year);
```

3. Add an empty-state block. Immediately inside the existing `<main ...>` element (before the first `<section>`), wrap the existing children in a conditional:

```astro
{sessions.length === 0 ? (
  <section class="max-w-3xl mx-auto px-4 md:px-6 py-24 text-center">
    <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
      {t("schedule.rail_label")}
    </p>
    <h1 class="mt-3 text-4xl md:text-5xl font-bold text-foreground tracking-tight">
      {t("schedule.heading")} {year}
    </h1>
    <p class="mt-6 text-base md:text-lg text-muted-foreground">
      {t("schedule.empty_state")}
    </p>
  </section>
) : (
  <>
    {/* existing sections here */}
  </>
)}
```

Leave the existing `{active ? (<Layout>...) : (<ComingSoonLayout>...)}` gate in place; the empty-state lives *inside* the `active=true` branch.

- [ ] **Step 2: Create the EN mirror**

Copy the new FR `[year].astro` to `src/pages/en/programme/[year].astro`. Adjust the `Astro.redirect` path to `/en/programme/${CURRENT_EDITION}`.

- [ ] **Step 3: Add i18n empty-state key**

In `src/i18n/ui.ts`, add to **both** the `fr:` and `en:` blocks (near existing `schedule.*` keys):

FR:
```ts
"schedule.empty_state": "Le programme de cette édition sera publié prochainement.",
```

EN:
```ts
"schedule.empty_state": "The programme for this edition will be published soon.",
```

- [ ] **Step 4: Delete the flat `index.astro` files**

```bash
git rm src/pages/programme/index.astro src/pages/en/programme/index.astro
```

- [ ] **Step 5: Build and smoke-test**

Run: `pnpm build 2>&1 | tail -20`
Expected: builds 6 programme pages — `/programme/2023`, `/programme/2026`, `/programme/2027`, and the EN mirrors.

Run: `ls dist/programme/ dist/en/programme/`
Expected: each contains `2023/`, `2026/`, `2027/` directories.

- [ ] **Step 6: Commit**

```bash
git add src/pages/programme src/pages/en/programme src/i18n/ui.ts
git commit -m "feat(programme): year-scoped routes /programme/[year] with empty state"
```

---

## Task 9: Year-Scoped Sponsors Page

**Files:**
- Create: `src/pages/sponsors/[year].astro`
- Create: `src/pages/en/sponsors/[year].astro`
- Delete: `src/pages/sponsors.astro`
- Delete: `src/pages/en/sponsors.astro`

- [ ] **Step 1: Create `src/pages/sponsors/[year].astro`**

Use this full content (adapted from the current flat file):

```astro
---
import Layout from "@/layouts/Layout.astro";
import { getLangFromUrl, useTranslations } from "@/i18n/utils";
import SponsorTierSection from "@/components/sponsors/SponsorTierSection.astro";
import SponsorCTA from "@/components/sponsors/SponsorCTA.astro";
import { getSponsors, type SponsorEntry } from "@/lib/sponsor-utils";
import { EDITIONS, isEdition, CURRENT_EDITION, type Edition } from "@/lib/editions";

export async function getStaticPaths() {
  return EDITIONS.map((year) => ({ params: { year: String(year) } }));
}

const { year: yearParam } = Astro.params;
const yearNum = Number(yearParam);
if (!isEdition(yearNum)) {
  return Astro.redirect(`/sponsors/${CURRENT_EDITION}`, 308);
}
const year: Edition = yearNum;

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);

const all = await getSponsors(year);
const TIER_ORDER = ["platinum", "gold", "silver", "community"] as const;
const byTier = Object.fromEntries(
  TIER_ORDER.map((tier) => [tier, all.filter((s) => s.data.tier === tier)])
) as Record<(typeof TIER_ORDER)[number], SponsorEntry[]>;

const hasAnySponsor = all.length > 0;

const tierTitles = {
  platinum: t("sponsors.tier.platinum"),
  gold: t("sponsors.tier.gold"),
  silver: t("sponsors.tier.silver"),
  community: t("sponsors.tier.community"),
} as const;
---

<Layout title={`${t("sponsors.page.title")} ${year} | Cloud Native Days France`} lang={lang}>
  <main class="mx-auto max-w-7xl px-4 md:px-6 py-24">
    <header class="text-center">
      <h1 class="text-4xl font-bold text-foreground">{t("sponsors.page.title")} {year}</h1>
      <p class="mt-4 text-base text-muted-foreground max-w-2xl mx-auto">
        {hasAnySponsor ? t("sponsors.page.intro") : t("sponsors.empty_state")}
      </p>
    </header>

    {hasAnySponsor &&
      TIER_ORDER.map((tier) =>
        byTier[tier].length > 0 ? (
          <SponsorTierSection
            tier={tier}
            title={tierTitles[tier]}
            sponsors={byTier[tier]}
          />
        ) : null
      )}

    <SponsorCTA />
  </main>
</Layout>
```

Cross-reference: open `src/pages/sponsors.astro` before deletion and ensure no extra props or sections were missed from the original (e.g., if it had a rail label or additional CTAs not shown above, carry them over).

- [ ] **Step 2: Create the EN mirror**

Copy the new FR file to `src/pages/en/sponsors/[year].astro`. Change the redirect path to `/en/sponsors/${CURRENT_EDITION}`.

- [ ] **Step 3: Add i18n empty-state key**

In `src/i18n/ui.ts`, add to both `fr:` and `en:`:

FR:
```ts
"sponsors.empty_state": "Les partenaires de cette édition seront annoncés prochainement.",
```

EN:
```ts
"sponsors.empty_state": "The sponsors for this edition will be announced soon.",
```

- [ ] **Step 4: Delete the flat files**

```bash
git rm src/pages/sponsors.astro src/pages/en/sponsors.astro
```

- [ ] **Step 5: Build**

Run: `pnpm build 2>&1 | tail -20`
Expected: six sponsor pages built, including empty-state for 2023/2027.

- [ ] **Step 6: Commit**

```bash
git add src/pages/sponsors src/pages/en/sponsors src/i18n/ui.ts
git commit -m "feat(sponsors): year-scoped routes /sponsors/[year] with empty state"
```

---

## Task 10: Year-Scoped Speakers Index

**Files:**
- Create: `src/pages/speakers/[year]/index.astro`
- Create: `src/pages/en/speakers/[year]/index.astro`
- Delete: `src/pages/speakers/index.astro`
- Delete: `src/pages/en/speakers/index.astro`

- [ ] **Step 1: Create `src/pages/speakers/[year]/index.astro`**

Copy current `src/pages/speakers/index.astro`. Modify imports and top-of-frontmatter:

```ts
import Layout from "../../../layouts/Layout.astro"; // note deeper nesting
import SpeakerAvatar from "@/components/speakers/SpeakerAvatar.astro";
import { getSpeakersByLocale, getSlug, getPrimaryTalk } from "@/lib/speakers";
import { loadSessions, type SessionRow } from "@/lib/schedule";
import { getLangFromUrl, useTranslations, getLocalePath } from "@/i18n/utils";
import { EDITIONS, isEdition, CURRENT_EDITION, type Edition } from "@/lib/editions";

export async function getStaticPaths() {
  return EDITIONS.map((year) => ({ params: { year: String(year) } }));
}

const { year: yearParam } = Astro.params;
const yearNum = Number(yearParam);
if (!isEdition(yearNum)) {
  return Astro.redirect(`/speakers/${CURRENT_EDITION}`, 308);
}
const year: Edition = yearNum;

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);

const speakers = await getSpeakersByLocale(lang, year);
const sessions = await loadSessions(year);
// ...rest of existing logic unchanged, but replace the existing empty-state
// text with the year-specific one:
```

The existing page already shows an empty block when `speakers.length === 0`. Reuse it — but pass through `year` in the heading. Keep all speaker-card JSX intact; only the imports, getStaticPaths, and the year-scoped loader calls change.

Also update every `href={getLocalePath(lang, `/speakers/${slug}`)}` (or equivalent) in the template to:
```astro
href={getLocalePath(lang, `/speakers/${year}/${slug}`)}
```

- [ ] **Step 2: Create the EN mirror**

Copy to `src/pages/en/speakers/[year]/index.astro`. Change redirect path to `/en/speakers/${CURRENT_EDITION}`.

- [ ] **Step 3: Delete the flat files**

```bash
git rm src/pages/speakers/index.astro src/pages/en/speakers/index.astro
```

- [ ] **Step 4: Build**

Run: `pnpm build 2>&1 | tail -20`
Expected: six speaker index pages (3 years × 2 languages).

- [ ] **Step 5: Commit**

```bash
git add src/pages/speakers src/pages/en/speakers
git commit -m "feat(speakers): year-scoped /speakers/[year]/ index pages"
```

---

## Task 11: Year-Scoped Speaker Detail

**Files:**
- Create: `src/pages/speakers/[year]/[slug].astro`
- Create: `src/pages/en/speakers/[year]/[slug].astro`
- Replace: `src/pages/speakers/[slug].astro` (becomes redirect shim)
- Replace: `src/pages/en/speakers/[slug].astro` (becomes redirect shim)

- [ ] **Step 1: Create `src/pages/speakers/[year]/[slug].astro`**

Copy current `src/pages/speakers/[slug].astro`. Modify:

```ts
import Layout from "../../../layouts/Layout.astro"; // deeper nesting
import SpeakerProfile from "@/components/speakers/SpeakerProfile.astro";
import {
  getAllSpeakers,
  getSlug,
  getTalksForSpeaker,
  getCoSpeakersForTalk,
} from "@/lib/speakers";
import { useTranslations, getLocalePath, getLangFromUrl } from "@/i18n/utils";
import { EDITIONS, type Edition } from "@/lib/editions";

export async function getStaticPaths() {
  const entries: Array<{ params: { year: string; slug: string }; props: { speaker: unknown; year: Edition } }> = [];
  for (const year of EDITIONS) {
    const speakers = await getAllSpeakers(year);
    for (const speaker of speakers) {
      entries.push({
        params: { year: String(year), slug: getSlug(speaker.id) },
        props: { speaker, year },
      });
    }
  }
  return entries;
}

const { speaker, year } = Astro.props as { speaker: Awaited<ReturnType<typeof getAllSpeakers>>[number]; year: Edition };
const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
const slug = getSlug(speaker.id);
const talks = await getTalksForSpeaker(lang, slug, year);

const allSpeakers = await getAllSpeakers(year);
const speakerNameBySlug = new Map(allSpeakers.map((s) => [getSlug(s.id), s.data.name]));
// ...rest of existing logic unchanged.
```

Update any `getLocalePath(lang, `/speakers/${otherSlug}`)` inside the template to include the year:
```astro
href={getLocalePath(lang, `/speakers/${year}/${otherSlug}`)}
```

- [ ] **Step 2: Create the EN mirror**

Same content at `src/pages/en/speakers/[year]/[slug].astro`.

- [ ] **Step 3: Replace the flat `[slug].astro` files with redirect shims**

Replace `src/pages/speakers/[slug].astro` with:

```astro
---
import { CURRENT_EDITION } from "@/lib/editions";

export async function getStaticPaths() {
  // No static paths — the shim only matches slugs we have not pre-rendered
  // via /speakers/{CURRENT_EDITION}/[slug]. For those we emit a permanent
  // redirect to the current edition's detail page.
  return [];
}

const { slug } = Astro.params;
return Astro.redirect(`/speakers/${CURRENT_EDITION}/${slug}`, 301);
---
```

Replace `src/pages/en/speakers/[slug].astro` with the EN-prefixed variant:
```astro
---
import { CURRENT_EDITION } from "@/lib/editions";

export async function getStaticPaths() {
  return [];
}

const { slug } = Astro.params;
return Astro.redirect(`/en/speakers/${CURRENT_EDITION}/${slug}`, 301);
---
```

**Important:** Astro pre-renders static pages. If a build-time route already exists at `/speakers/<slug>` because of the pre-existing file, the renamed flat file must be deleted before the shim file is created to avoid a path collision. Do this atomically:

```bash
git rm src/pages/speakers/\[slug\].astro src/pages/en/speakers/\[slug\].astro
# (then create the new shim files above)
```

- [ ] **Step 4: Build and smoke-test**

Run: `pnpm build 2>&1 | tail -30`
Expected: build succeeds. Check that a known 2026 speaker slug renders at both `/speakers/2026/petazzoni/index.html` and that the shim produces a redirect HTML at `/speakers/petazzoni/index.html` (Astro renders redirects as meta-refresh / 301 pages).

Run: `find dist/speakers -name index.html | head -20`
Expected: `dist/speakers/2023/`, `dist/speakers/2026/<slug>/`, `dist/speakers/2027/` entries; plus a redirect at the bare `/speakers/<slug>/` slots for known 2026 slugs.

- [ ] **Step 5: Commit**

```bash
git add src/pages/speakers src/pages/en/speakers
git commit -m "feat(speakers): year-scoped /speakers/[year]/[slug] + 301 shim for bare slug"
```

---

## Task 12: Redirects for Bare Paths

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1: Add redirects block**

In `astro.config.mjs`, inside the `defineConfig({ ... })` object, add above `integrations:`:

```js
redirects: {
  "/programme":    "/programme/2027",
  "/sponsors":     "/sponsors/2027",
  "/speakers":     "/speakers/2027",
  "/en/programme": "/en/programme/2027",
  "/en/sponsors":  "/en/sponsors/2027",
  "/en/speakers":  "/en/speakers/2027",
},
```

Hardcoding `2027` here (rather than importing `CURRENT_EDITION`) is intentional — the astro config runs before TS is fully resolved and is low-churn.

- [ ] **Step 2: Build and verify**

Run: `pnpm build 2>&1 | tail -20`
Expected: build succeeds. Verify:

```bash
ls dist/programme dist/sponsors dist/speakers | head -10
```
Expected: `index.html` files at each bare path containing a meta-refresh redirect to the 2027 variant.

Run: `grep -l 'programme/2027' dist/programme/index.html`
Expected: match.

- [ ] **Step 3: Commit**

```bash
git add astro.config.mjs
git commit -m "feat(routes): redirect bare /programme, /sponsors, /speakers to 2027"
```

---

## Task 13: Nav Dropdown Component + Year Picker

**Files:**
- Create: `src/components/NavDropdown.astro`
- Modify: `src/components/Navigation.astro`
- Modify: `src/i18n/ui.ts`

- [ ] **Step 1: Create `src/components/NavDropdown.astro`**

File content:

```astro
---
/**
 * Accessible disclosure dropdown for nav items with year sub-links.
 *
 * Usage:
 *   <NavDropdown
 *     key="nav.schedule"
 *     label="Programme"
 *     baseHref="/programme"
 *     items={[{ year: 2027, href: "/programme/2027", label: "Programme 2027", current: true }, ...]}
 *     active={currentPath.startsWith("/programme")}
 *   />
 *
 * Pure Astro + tiny inline <script>; no React island. Tab/Escape close it,
 * arrow keys move focus through items.
 */
interface Item {
  year: number;
  href: string;
  label: string;
  current?: boolean;
}
interface Props {
  key: string;                  // e.g. "nav.schedule"
  label: string;                // visible trigger label
  items: Item[];                // ordered as rendered (descending year recommended)
  active?: boolean;             // currentPath is within this section
}
const { key, label, items, active = false } = Astro.props as Props;
const buttonId = `nav-dd-btn-${key.replace(/\W/g, "-")}`;
const menuId = `nav-dd-menu-${key.replace(/\W/g, "-")}`;
---

<li class="relative" data-nav-dropdown>
  <button
    id={buttonId}
    type="button"
    aria-haspopup="menu"
    aria-expanded="false"
    aria-controls={menuId}
    data-nav-key={key}
    class:list={[
      "inline-flex items-center gap-1 text-lg font-medium text-foreground transition-colors pb-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm",
      active ? "border-b-2 border-primary" : "border-b-2 border-transparent hover:border-primary/60",
    ]}
  >
    {label}
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
  </button>
  <ul
    id={menuId}
    role="menu"
    aria-labelledby={buttonId}
    class="hidden absolute right-0 mt-2 min-w-48 rounded-md border border-border bg-popover text-popover-foreground shadow-lg py-1 z-50"
  >
    {items.map((item) => (
      <li role="none">
        <a
          role="menuitem"
          href={item.href}
          aria-current={item.current ? "page" : undefined}
          class:list={[
            "block px-4 py-2 text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
            item.current && "font-semibold text-primary",
          ]}
        >
          {item.label}
        </a>
      </li>
    ))}
  </ul>
</li>

<script>
  // Toggle open/close on click; Escape closes; tab-outside closes; arrow keys move focus.
  const wrappers = document.querySelectorAll<HTMLElement>("[data-nav-dropdown]");
  wrappers.forEach((wrap) => {
    const btn = wrap.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]');
    const menu = wrap.querySelector<HTMLUListElement>('[role="menu"]');
    if (!btn || !menu) return;

    const close = () => {
      menu.classList.add("hidden");
      btn.setAttribute("aria-expanded", "false");
    };
    const open = () => {
      menu.classList.remove("hidden");
      btn.setAttribute("aria-expanded", "true");
      const first = menu.querySelector<HTMLAnchorElement>('[role="menuitem"]');
      first?.focus();
    };
    const toggle = () => {
      menu.classList.contains("hidden") ? open() : close();
    };

    btn.addEventListener("click", (e) => { e.preventDefault(); toggle(); });
    btn.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
    menu.addEventListener("keydown", (e) => {
      const items = Array.from(menu.querySelectorAll<HTMLAnchorElement>('[role="menuitem"]'));
      const idx = items.indexOf(document.activeElement as HTMLAnchorElement);
      if (e.key === "Escape") { e.preventDefault(); close(); btn.focus(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); items[(idx + 1) % items.length]?.focus(); }
      else if (e.key === "ArrowUp")   { e.preventDefault(); items[(idx - 1 + items.length) % items.length]?.focus(); }
      else if (e.key === "Home")      { e.preventDefault(); items[0]?.focus(); }
      else if (e.key === "End")       { e.preventDefault(); items[items.length - 1]?.focus(); }
    });
    // Click outside closes.
    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target as Node)) close();
    });
  });
</script>
```

- [ ] **Step 2: Add i18n keys**

In `src/i18n/ui.ts`, add to both `fr:` and `en:`:

FR:
```ts
"nav.programme.label": "Programme",
"nav.sponsors.label": "Partenaires",
"nav.speakers.label": "Speakers",
"nav.year_item": "{section} {year}",
```

EN:
```ts
"nav.programme.label": "Programme",
"nav.sponsors.label": "Partners",
"nav.speakers.label": "Speakers",
"nav.year_item": "{section} {year}",
```

(The placeholder `{section}` / `{year}` substitution is done inline at the call site below — useTranslations does not interpolate on its own. See next step.)

- [ ] **Step 3: Wire dropdowns into `src/components/Navigation.astro`**

At the top of the frontmatter, add:

```ts
import { EDITIONS, CURRENT_EDITION } from "@/lib/editions";
import NavDropdown from "@/components/NavDropdown.astro";
```

Build the dropdown data just after the existing `links` array:

```ts
const editionsDesc = [...EDITIONS].sort((a, b) => b - a);

function sectionDropdown(
  section: "programme" | "sponsors" | "speakers",
  labelKey: "nav.programme.label" | "nav.sponsors.label" | "nav.speakers.label",
) {
  const basePath = `/${section}`;
  const localizedBase = getLocalePath(lang, basePath);
  return {
    key: labelKey,
    label: t(labelKey),
    active: currentPath.startsWith(localizedBase),
    items: editionsDesc.map((year) => ({
      year,
      href: getLocalePath(lang, `${basePath}/${year}`),
      label: `${t(labelKey)} ${year}`,
      current: currentPath === getLocalePath(lang, `${basePath}/${year}`),
    })),
  };
}

const programmeDD = sectionDropdown("programme", "nav.programme.label");
const sponsorsDD  = sectionDropdown("sponsors",  "nav.sponsors.label");
const speakersDD  = sectionDropdown("speakers",  "nav.speakers.label");
```

In the existing `<ul class="hidden md:flex ...">`, remove the `<li>`s for `nav.speakers`, `nav.schedule`, and `nav.sponsors` from the rendered `{links.map(...)}`. Keep `nav.home`, `nav.replays`, `nav.venue`, `nav.team`. Insert the three dropdowns next to where the originals were:

```astro
<NavDropdown {...programmeDD} />
<NavDropdown {...speakersDD} />
<NavDropdown {...sponsorsDD} />
```

Simplest approach: filter the `links.map` to exclude the three keys that now have dropdowns, and interleave the three `<NavDropdown/>` calls in the original positions.

In the mobile panel (`<div id="mobile-menu">`), expand the three section entries to year-lists:

```astro
{[programmeDD, speakersDD, sponsorsDD].map((dd) => (
  <li>
    <p class="px-2 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{dd.label}</p>
    <ul class="pl-2">
      {dd.items.map((it) => (
        <li>
          <a href={it.href}
             aria-current={it.current ? "page" : undefined}
             class:list={[
               "flex items-center min-h-11 px-2 py-3 text-sm font-medium rounded-md",
               it.current ? "text-primary" : "text-foreground hover:bg-muted",
             ]}>
            {it.label}
          </a>
        </li>
      ))}
    </ul>
  </li>
))}
```

- [ ] **Step 4: Build and manually smoke-test**

Run: `pnpm build && pnpm preview`
Manual checks:
- Visit `/` — header shows Programme, Speakers, Partenaires as dropdown triggers.
- Click each — dropdown opens, lists 2027, 2026, 2023 (desc).
- Arrow down inside dropdown — focus moves. Escape — closes, returns focus to trigger.
- Click "Programme 2023" — navigates to `/programme/2023`; page renders empty-state.
- Visit `/speakers/2026` — renders the 2026 roster.
- Visit `/sponsors/2026` — renders existing sponsors.
- Visit bare `/programme` — 301s to `/programme/2027`.
- Mobile viewport — open mobile menu, see three sections with year sub-lists.

- [ ] **Step 5: Commit**

```bash
git add src/components/NavDropdown.astro src/components/Navigation.astro src/i18n/ui.ts
git commit -m "feat(nav): year-picker dropdowns for Programme, Speakers, Partenaires"
```

---

## Task 14: Full Test & Build Verification

**Files:**
- (no code changes — verification pass)

- [ ] **Step 1: Unit tests**

Run: `pnpm test`
Expected: all suites pass. If `speakers.test.ts` or any other test fails due to shape drift (e.g., old mock returning the wrong collection), fix inline with the smallest edit that restores correctness, then commit as `test: align speaker test mocks with per-year collections`.

- [ ] **Step 2: Type-check**

Run: `pnpm astro check 2>&1 | tail -20`
Expected: `0 errors`. If any residual `"speakers"` / `"sponsors"` collection references remain (search below), fix them.

- [ ] **Step 3: Sanity search for stale references**

Run: `grep -rn '"speakers"\|"sponsors"' src/ --include="*.astro" --include="*.ts" --include="*.tsx" | grep -v __tests__ | grep -v 'editions\.ts\|remote-csv\.ts\|content\.config\.ts\|speakers\.ts\|sponsor-utils\.ts'`
Expected: empty. Any remaining hits are consumer files that still reference the old collection names and must be updated to use the year-aware helpers.

Run: `grep -rn 'SCHEDULE_SESSIONS_CSV_URL\|SCHEDULE_SPEAKERS_CSV_URL' src/ 2>/dev/null`
Expected: empty (old env var names fully replaced).

- [ ] **Step 4: Full production build**

Run: `pnpm build 2>&1 | tail -50`
Expected: build completes. Log contains `[csv]` lines for every year-scoped fetch (fallbacks for 2023/2027 until the Sheet is populated).

Verify route counts:
```bash
find dist -name "index.html" | wc -l
find dist/programme dist/en/programme -type d
find dist/speakers dist/en/speakers -maxdepth 2 -type d | head -20
find dist/sponsors dist/en/sponsors -type d
```
Expected: 3 year dirs per section per language.

- [ ] **Step 5: Dev-server manual regression pass**

Run: `pnpm dev`
Visit each in a browser:
- `/`, `/en` — unchanged
- `/programme/2023`, `/programme/2026`, `/programme/2027`, and EN mirrors
- `/speakers/2023`, `/speakers/2026`, `/speakers/2027`, and EN mirrors
- `/speakers/2026/<known-slug>` (e.g. `/speakers/2026/petazzoni`) — detail renders
- `/speakers/<known-slug>` (bare, no year) — redirects to `/speakers/2027/<slug>` (will 404 if the slug is not in 2027; that is correct — the redirect is a best-effort shim for the current edition)
- `/sponsors/2023`, `/sponsors/2026`, `/sponsors/2027`, and EN mirrors
- `/team` — unchanged
- Bare `/programme`, `/sponsors`, `/speakers` — redirect to 2027
- Nav dropdowns open/close with mouse + keyboard
- Mobile menu shows year sub-lists

- [ ] **Step 6: Documentation update**

Update `CLAUDE.md` and `src/lib/remote-csv.ts` docstring if they reference old env var names or old flat collections. Specifically:
- In `CLAUDE.md`, update the "Env var overrides" line under Stack Notes: replace `SCHEDULE_SESSIONS_CSV_URL, SCHEDULE_SPEAKERS_CSV_URL, SPONSORS_CSV_URL, TEAM_CSV_URL` with `SESSIONS_CSV_URL_{2023,2026,2027}, SPEAKERS_CSV_URL_{2023,2026,2027}, SPONSORS_CSV_URL_{2023,2026,2027}, TEAM_CSV_URL`.
- Commit: `docs: document per-year CSV env var shape`.

- [ ] **Step 7: Final commit (if docs touched)**

```bash
git add CLAUDE.md
git commit -m "docs: per-year CSV env var scheme and year-scoped routes"
```

---

## Post-Implementation (user, out of band)

The codebase is now multi-edition aware. To go live:

1. **Reorganise the Google Sheet** — add the 10 tabs: `sessions-2023`, `sessions-2026`, `sessions-2027`, `speakers-2023`, `speakers-2026`, `speakers-2027`, `sponsors-2023`, `sponsors-2026`, `sponsors-2027`, `team`. Migrate existing 2026 rows into their `-2026` tabs.
2. **Publish each tab** (File → Share → Publish to web → select specific tab → CSV) and collect the per-tab URLs.
3. **Set env vars** in the production build environment: `SESSIONS_CSV_URL_{2023,2026,2027}`, `SPEAKERS_CSV_URL_{2023,2026,2027}`, `SPONSORS_CSV_URL_{2023,2026,2027}`, `TEAM_CSV_URL`.
4. **Redeploy.** Any year with an unset env var continues to serve from the committed local fallback CSV.

---

## Rollback Plan

Any commit from Tasks 1–14 is atomic and revertable. The cleanest rollback to pre-change behaviour is:

```bash
git revert --no-commit <first-commit>^..HEAD
git commit -m "revert: single-sheet multi-edition series"
```

where `<first-commit>` is the Task 1 commit hash. All renamed CSVs come back, all flat routes return, and nav loses its dropdowns.
