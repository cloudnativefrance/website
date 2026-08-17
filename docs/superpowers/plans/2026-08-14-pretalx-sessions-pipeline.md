# Pretalx Sessions Pipeline (PR 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hand-maintained Google Sheet sessions tab with the public Pretalx released-schedule export, without changing a single pixel of the rendered programme page.

**Architecture:** A new `src/lib/pretalx.ts` fetches `schedule.json` from the self-hosted Pretalx at `cfp.cloudnativedays.fr` and normalizes it into the existing `SessionRow[]` shape. `loadSessions(year)` in `src/lib/schedule.ts` keeps its exact signature, so every consumer — `ScheduleGrid.astro`, `/replays`, `programme.ics.ts`, `speakers.ts` — is untouched. Editions with no Pretalx event (2023) read a frozen committed JSON archive instead.

**Tech Stack:** Astro 6, TypeScript 6, Vitest 4, `tsx` for scripts. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-14-programme-pretalx-and-redesign-design.md` (Part 1 only — Part 2 was dropped, Part 3 is PR 2).

## Global Constraints

- **Node built-ins only.** No new npm dependencies for this PR.
- **A build must never fail because Pretalx is unreachable.** Every network read falls back to a committed snapshot and logs which source it used.
- **No `new Date()`, `Date.now()` or timezone maths in parsers.** Session times carry a `+01:00` offset and are parsed by regex, matching the existing `formatTime` / `endTime` behaviour in `src/lib/schedule.ts:214-229`.
- **`SessionRow` keeps its exact shape**, plus one additive optional field (`trackColor`). No consumer changes in this PR.
- **`SessionRow.speakers` keeps holding Sheet slugs** (`petazzoni`, not `Jérôme Petazzoni`). Speaker URLs and `getTalksForSpeaker` depend on it.
- **Code, comments and identifiers in English.** Only user-facing site content is French.
- Conventional commits. Never co-author. Commit messages in English.
- Pretalx base URL: `https://cfp.cloudnativedays.fr`, overridable with `PRETALX_BASE_URL`.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/csv.ts` | **Create.** The RFC-4180 parser, extracted from its two current copies (`schedule.ts:44`, `content.config.ts:13`). |
| `src/lib/remote-fetch.ts` | **Create.** Generic timeout + fallback + memoised fetch. The transport, with no opinion about the payload. |
| `src/lib/pretalx.ts` | **Create.** Pretalx export types, `fetchScheduleExport`, the pure `toSessionRows` normalizer, and the speaker name→slug index. |
| `src/lib/remote-csv.ts` | **Modify.** `fetchCsvOrFallback` becomes a thin CSV-validating wrapper over `remote-fetch`. The `sessions` URL entries are removed. |
| `src/lib/schedule.ts` | **Modify.** `loadSessions` delegates to Pretalx or the archive; `parseCsv` deleted. Everything else unchanged. |
| `src/content.config.ts` | **Modify.** Imports `parseCsv` from `src/lib/csv.ts` instead of its own copy. |
| `src/content/schedule/pretalx-2026.json` | **Create.** Committed snapshot, refreshed by `pnpm sync:pretalx`. Doubles as the test fixture. |
| `src/content/schedule/sessions-2023.json` | **Create.** Frozen normalized archive; 2023 predates Pretalx. |
| `src/content/schedule/sessions-{2023,2026,2027}.csv` | **Delete**, once nothing reads them. |
| `scripts/sync-pretalx.ts` | **Create.** Refreshes the committed snapshots. |
| `scripts/pretalx-replay-checklist.ts` | **Create.** One-shot migration aid: emits the copy-paste list of replay URLs to enter in Pretalx. |
| `src/lib/__tests__/{csv,pretalx,remote-fetch}.test.ts` | **Create.** Unit coverage. |
| `tests/build/pretalx-parity.test.ts` | **Create.** Normalized output vs the live Sheet, field by field. |

**Import cycle note:** `pretalx.ts` needs the `SessionRow` type from `schedule.ts`, and `schedule.ts` imports `pretalx.ts` at runtime. Use `import type` in `pretalx.ts` — TypeScript erases it, so there is no runtime cycle. Do **not** convert it to a value import.

---

### Task 1: Replay-link checklist (unblocks the manual Pretalx work)

The 51 YouTube URLs live only in the Sheet. Pretalx has no field for them, so a human must
paste them into the Pretalx organiser UI as talk resources. This task produces that list
**first** so the manual work can proceed in parallel with the rest of the implementation.

**Files:**
- Create: `scripts/pretalx-replay-checklist.ts`
- Create: `docs/ops/pretalx-2026-replay-links.md` (generated output, committed, deleted after migration)

**Interfaces:**
- Consumes: nothing.
- Produces: nothing consumed by later tasks. Standalone.

- [ ] **Step 1: Write the script**

```ts
/**
 * One-shot migration aid for the Pretalx sessions migration.
 *
 * Replay URLs live only in the Google Sheet; Pretalx has no native field for
 * them, so they are entered by hand as talk resources of type "link" titled
 * "Replay". This emits that worklist, ordered by room then start time so it
 * matches the order the Pretalx organiser UI lists talks in.
 *
 * Run: pnpm tsx scripts/pretalx-replay-checklist.ts
 * Delete this script once the migration is done.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { parseCsv } from "../src/lib/csv";
import { getCsvUrl } from "../src/lib/remote-csv";

const YEAR = 2026;
const OUT = "docs/ops/pretalx-2026-replay-links.md";

const res = await fetch(getCsvUrl("sessions", YEAR));
if (!res.ok) throw new Error(`Sheet fetch failed: HTTP ${res.status}`);
const rows = parseCsv(await res.text());
const [header, ...body] = rows;
const col = (name: string) => header.indexOf(name);
const iId = col("id");
const iTitle = col("title");
const iRoom = col("room");
const iStart = col("start_time");
const iRec = col("recording_url");

const entries = body
  .filter((r) => (r[iId] ?? "").trim() && (r[iRec] ?? "").trim())
  .map((r) => ({
    code: r[iId].trim(),
    title: r[iTitle].trim(),
    room: r[iRoom].trim(),
    start: r[iStart].trim(),
    url: r[iRec].trim(),
  }))
  .sort((a, b) => a.room.localeCompare(b.room) || a.start.localeCompare(b.start));

const lines = [
  "# Pretalx replay links — 2026",
  "",
  `Generated from the live sessions Sheet. ${entries.length} talks with a recording.`,
  "",
  "For each row, open the talk in the Pretalx organiser UI, add a resource of type",
  "**link** titled exactly `Replay`, and paste the URL. Tick the box when done.",
  "",
  "| ✓ | Room | Start | Code | Title | Replay URL |",
  "|---|---|---|---|---|---|",
  ...entries.map(
    (e) =>
      `| [ ] | ${e.room} | ${e.start.slice(11, 16)} | \`${e.code}\` | ${e.title.replace(/\|/g, "\\|")} | ${e.url} |`,
  ),
  "",
];

mkdirSync("docs/ops", { recursive: true });
writeFileSync(OUT, lines.join("\n"), "utf8");
console.log(`Wrote ${entries.length} entries to ${OUT}`);
```

- [ ] **Step 2: Run it**

Run: `pnpm tsx scripts/pretalx-replay-checklist.ts`
Expected: `Wrote 51 entries to docs/ops/pretalx-2026-replay-links.md`

If the count is not 51, stop — the Sheet has changed since this plan was written and the
rest of the plan's fixtures need re-checking.

> **Note:** this script imports `parseCsv` from `src/lib/csv.ts`, which Task 2 creates.
> Run Task 2 first if you are executing strictly in order; the script is placed first only
> because its *output* unblocks the human work.

- [ ] **Step 3: Commit**

```bash
git add scripts/pretalx-replay-checklist.ts docs/ops/pretalx-2026-replay-links.md
git commit -m "chore(programme): generate the Pretalx replay-link worklist

Replay URLs exist only in the Sheet and have to be entered into Pretalx
by hand as talk resources. Emit the list up front so that work can run in
parallel with the pipeline implementation."
```

---

### Task 2: Extract the CSV parser

Two byte-identical copies of the parser exist. One is about to be deleted with
`loadSessions`; the other stays for speakers, sponsors and team. Extract before deleting so
the surviving copy is the tested one.

**Files:**
- Create: `src/lib/csv.ts`
- Create: `src/lib/__tests__/csv.test.ts`
- Modify: `src/content.config.ts:11-43` (delete local copy, import instead)

**Interfaces:**
- Produces: `parseCsv(text: string): string[][]` — used by Task 1, Task 5 and `content.config.ts`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/__tests__/csv.test.ts
import { describe, it, expect } from "vitest";
import { parseCsv } from "../csv";

describe("parseCsv", () => {
  it("splits plain rows", () => {
    expect(parseCsv("a,b\n1,2")).toEqual([["a", "b"], ["1", "2"]]);
  });

  it("keeps commas and newlines inside quoted fields", () => {
    expect(parseCsv('a,b\n"x,y","line1\nline2"')).toEqual([
      ["a", "b"],
      ["x,y", "line1\nline2"],
    ]);
  });

  it("unescapes doubled quotes", () => {
    expect(parseCsv('a\n"say ""hi"""')).toEqual([["a"], ['say "hi"']]);
  });

  it("handles CRLF and a missing trailing newline", () => {
    expect(parseCsv("a,b\r\n1,2")).toEqual([["a", "b"], ["1", "2"]]);
  });

  it("drops fully blank lines", () => {
    expect(parseCsv("a\n\nb")).toEqual([["a"], ["b"]]);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm vitest run src/lib/__tests__/csv.test.ts`
Expected: FAIL — `Failed to resolve import "../csv"`

- [ ] **Step 3: Create the module**

Create `src/lib/csv.ts` with the exact body currently at `src/lib/schedule.ts:44-103`,
exported and re-documented:

```ts
/**
 * Minimal CSV parser — handles RFC-4180-style quoted fields with escaped `""`.
 * Not a general purpose CSV lib; tailored to the shape of the published
 * Google Sheet tabs (speakers, sponsors, team).
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0;
  const n = text.length;

  while (i < n) {
    const row: string[] = [];
    let field = "";
    let inQuotes = false;

    while (i < n) {
      const ch = text[i];

      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i += 2;
          } else {
            inQuotes = false;
            i++;
          }
        } else {
          field += ch;
          i++;
        }
        continue;
      }

      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ",") {
        row.push(field);
        field = "";
        i++;
      } else if (ch === "\n" || ch === "\r") {
        row.push(field);
        if (ch === "\r" && text[i + 1] === "\n") i++;
        i++;
        break;
      } else {
        field += ch;
        i++;
      }
    }

    if (i >= n && (field.length > 0 || row.length > 0)) {
      row.push(field);
    }

    if (row.length > 0 && !(row.length === 1 && row[0] === "")) {
      rows.push(row);
    }
  }

  return rows;
}
```

- [ ] **Step 4: Run the test**

Run: `pnpm vitest run src/lib/__tests__/csv.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Point content.config.ts at it**

In `src/content.config.ts`, delete the local `parseCsv` (lines 11–43, including the
`// -- CSV parser (unchanged) --` banner) and add to the import block at the top:

```ts
import { parseCsv } from "./lib/csv";
```

- [ ] **Step 6: Verify nothing broke**

Run: `pnpm test && pnpm astro check`
Expected: all existing tests pass; `astro check` reports 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/csv.ts src/lib/__tests__/csv.test.ts src/content.config.ts
git commit -m "refactor(csv): extract the shared CSV parser

The RFC-4180 parser existed as two byte-identical copies, in schedule.ts
and content.config.ts. One is about to be deleted with the sessions CSV
loader, so extract and test the survivor first."
```

---

### Task 3: Generic fetch-with-fallback transport

`fetchCsvOrFallback` already implements timeout, memoisation and fallback, but validates
the body as CSV. Pretalx needs the same transport with JSON validation.

**Files:**
- Create: `src/lib/remote-fetch.ts`
- Create: `src/lib/__tests__/remote-fetch.test.ts`
- Modify: `src/lib/remote-csv.ts:1-70`

**Interfaces:**
- Produces: `fetchTextOrFallback(opts: FetchTextOptions): Promise<string>` where
  `FetchTextOptions = { url?: string; fallbackRelPath: string; label?: string; timeoutMs?: number; validate?: (body: string) => void }`.
  `validate` throws to reject a body that arrived with HTTP 200 but is not what was asked
  for; throwing triggers the fallback exactly like a network error.
- Consumed by: `remote-csv.ts` (Task 3), `pretalx.ts` (Task 5).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/__tests__/remote-fetch.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { fetchTextOrFallback, __clearCacheForTests } from "../remote-fetch";

const DIR = "src/lib/__tests__/tmp-remote-fetch";
const REL = `${DIR}/fallback.txt`;

function withFallback(body: string) {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(REL, body, "utf8");
}

afterEach(() => {
  __clearCacheForTests();
  vi.unstubAllGlobals();
  rmSync(DIR, { recursive: true, force: true });
});

describe("fetchTextOrFallback", () => {
  it("reads the local file when no URL is configured", async () => {
    withFallback("local body");
    const out = await fetchTextOrFallback({ url: undefined, fallbackRelPath: REL });
    expect(out).toBe("local body");
  });

  it("returns the remote body on success", async () => {
    withFallback("local body");
    vi.stubGlobal("fetch", async () => new Response("remote body", { status: 200 }));
    const out = await fetchTextOrFallback({ url: "https://example.test/a", fallbackRelPath: REL });
    expect(out).toBe("remote body");
  });

  it("falls back on a non-2xx response", async () => {
    withFallback("local body");
    vi.stubGlobal("fetch", async () => new Response("nope", { status: 503 }));
    const out = await fetchTextOrFallback({ url: "https://example.test/b", fallbackRelPath: REL });
    expect(out).toBe("local body");
  });

  it("falls back when validate throws", async () => {
    withFallback("local body");
    vi.stubGlobal("fetch", async () => new Response("<html>login</html>", { status: 200 }));
    const out = await fetchTextOrFallback({
      url: "https://example.test/c",
      fallbackRelPath: REL,
      validate: (body) => {
        if (!body.startsWith("{")) throw new Error("not JSON");
      },
    });
    expect(out).toBe("local body");
  });

  it("memoises by URL so one build fetches once", async () => {
    withFallback("local body");
    let calls = 0;
    vi.stubGlobal("fetch", async () => {
      calls++;
      return new Response("remote body", { status: 200 });
    });
    const url = "https://example.test/d";
    await fetchTextOrFallback({ url, fallbackRelPath: REL });
    await fetchTextOrFallback({ url, fallbackRelPath: REL });
    expect(calls).toBe(1);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm vitest run src/lib/__tests__/remote-fetch.test.ts`
Expected: FAIL — `Failed to resolve import "../remote-fetch"`

- [ ] **Step 3: Write the module**

```ts
// src/lib/remote-fetch.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Fetch a text payload from a remote URL with a build-tolerant fallback: if the
 * remote is unreachable, slow, or returns something that fails `validate`, use
 * the committed repo copy at `fallbackRelPath`.
 *
 * Logs which source was used so build logs make data provenance obvious.
 *
 * Results are memoised per URL for the process lifetime — Astro calls loaders
 * multiple times during a single build, and every page must see the same
 * snapshot.
 */
const CACHE = new Map<string, Promise<string>>();
const DEFAULT_TIMEOUT_MS = 8000;

export interface FetchTextOptions {
  url?: string;
  fallbackRelPath: string;
  label?: string;
  timeoutMs?: number;
  /** Throw to reject a body that arrived HTTP 200 but is not what we asked for. */
  validate?: (body: string) => void;
}

/** Test-only: drop the memo so cases can stub `fetch` independently. */
export function __clearCacheForTests(): void {
  CACHE.clear();
}

export async function fetchTextOrFallback({
  url,
  fallbackRelPath,
  label = fallbackRelPath,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  validate,
}: FetchTextOptions): Promise<string> {
  const cacheKey = url || `file:${fallbackRelPath}`;
  const cached = CACHE.get(cacheKey);
  if (cached) return cached;

  const promise = (async () => {
    const fallbackPath = join(process.cwd(), fallbackRelPath);
    if (!url) {
      const body = readFileSync(fallbackPath, "utf8");
      console.log(`[remote] ${label}: using local fallback (no URL configured, ${body.length} bytes)`);
      return body;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
        headers: { "User-Agent": "cndfrance-website-build/1.0" },
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.text();
      validate?.(body);
      console.log(`[remote] ${label}: fetched remote (${body.length} bytes)`);
      return body;
    } catch (err) {
      clearTimeout(timer);
      const msg = err instanceof Error ? err.message : String(err);
      const body = readFileSync(fallbackPath, "utf8");
      console.warn(`[remote] ${label}: remote fetch failed (${msg}); using local fallback (${body.length} bytes)`);
      return body;
    }
  })();

  CACHE.set(cacheKey, promise);
  return promise;
}
```

- [ ] **Step 4: Run the test**

Run: `pnpm vitest run src/lib/__tests__/remote-fetch.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Rewrite `fetchCsvOrFallback` as a thin wrapper**

In `src/lib/remote-csv.ts`, delete the `CACHE`, `DEFAULT_TIMEOUT_MS`, `FetchOptions` and
the whole body of `fetchCsvOrFallback` (lines 1–70), and replace with:

```ts
import { fetchTextOrFallback } from "./remote-fetch";

export interface FetchOptions {
  url?: string;
  fallbackRelPath: string;
  label?: string;
  timeoutMs?: number;
}

/** CSV-validating wrapper over the shared transport. */
export async function fetchCsvOrFallback(opts: FetchOptions): Promise<string> {
  return fetchTextOrFallback({
    ...opts,
    validate: (body) => {
      if (!body || body.length < 20 || !body.includes(",")) {
        throw new Error("Response does not look like CSV");
      }
    },
  });
}
```

Leave the rest of `remote-csv.ts` (the `CSV_URLS` map and `getCsvUrl`) untouched for now —
Task 6 removes the `sessions` entries.

- [ ] **Step 6: Verify the whole suite and a real build**

Run: `pnpm test && pnpm build`
Expected: all tests pass; the build log now shows `[remote] speakers-2026.csv: fetched remote (...)` lines and completes.

- [ ] **Step 7: Commit**

```bash
git add src/lib/remote-fetch.ts src/lib/__tests__/remote-fetch.test.ts src/lib/remote-csv.ts
git commit -m "refactor(remote): extract the fetch-with-fallback transport

Timeout, memoisation and local-fallback logic were welded to CSV parsing.
Pretalx needs the same behaviour with JSON validation, so split transport
from payload validation and keep fetchCsvOrFallback as a thin wrapper."
```

---

### Task 4: The normalizer (pure)

The heart of the PR. No I/O — a function from the Pretalx document to `SessionRow[]`, so it
can be tested against a committed fixture without a network.

**Files:**
- Create: `src/lib/pretalx.ts`
- Create: `src/lib/__tests__/pretalx.test.ts`
- Create: `src/content/schedule/pretalx-2026.json`

**Interfaces:**
- Consumes: `SessionRow`, `SessionFormat` types from `src/lib/schedule.ts` (via `import type`).
- Produces:
  - `type PretalxScheduleExport` — the parsed document.
  - `toSessionRows(doc: PretalxScheduleExport, resolveSpeaker: SpeakerResolver): SessionRow[]`
  - `type SpeakerResolver = (personName: string, talkCode: string) => string`
  - `PRETALX_BASE`, `PRETALX_EVENT`

- [ ] **Step 1: Commit the fixture**

The fixture is the committed snapshot itself — one file serving both roles, so the tests
also guard the snapshot the build falls back to.

```bash
mkdir -p src/content/schedule
curl -sS --fail -m 30 \
  "https://cfp.cloudnativedays.fr/2026/schedule/export/schedule.json" \
  | python3 -m json.tool > src/content/schedule/pretalx-2026.json
node -e "const d=require('./src/content/schedule/pretalx-2026.json');const t=d.schedule.conference.days.flatMap(x=>Object.values(x.rooms).flat());console.log('talks:',t.length)"
```

Expected: `talks: 51`

- [ ] **Step 2: Add the `trackColor` field to `SessionRow`**

In `src/lib/schedule.ts`, inside `interface SessionRow`, after the `track` field:

```ts
  /** Optional thematic track (e.g. 'FinOps'). Free text; empty when not classified. */
  track: string;
  /**
   * Curated per-track accent colour from Pretalx, as a hex string. Undefined for
   * archived editions and unclassified talks. Carried but not yet rendered — the
   * schedule redesign (PR 2) consumes it and drops the name-hash fallback.
   */
  trackColor?: string;
```

- [ ] **Step 3: Write the failing tests**

```ts
// src/lib/__tests__/pretalx.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { toSessionRows, type PretalxScheduleExport } from "../pretalx";

const doc = JSON.parse(
  readFileSync("src/content/schedule/pretalx-2026.json", "utf8"),
) as PretalxScheduleExport;

// The real index is built from the speakers Sheet (Task 5). Here we only need a
// resolver that is deterministic, so lowercase-hyphenate and assert on that.
const resolve = (name: string) =>
  name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

describe("toSessionRows", () => {
  const rows = toSessionRows(doc, resolve);

  it("returns every released talk", () => {
    expect(rows).toHaveLength(51);
  });

  it("uses the Pretalx code as the session id, matching existing bookmarks", () => {
    expect(rows.map((r) => r.id)).toContain("9H9WKR");
    expect(rows.every((r) => /^[A-Z0-9]{6}$/.test(r.id))).toBe(true);
  });

  it("derives formats the way the Sheet was hand-classified", () => {
    const count = (f: string) => rows.filter((r) => r.format === f).length;
    expect(count("keynote")).toBe(1);
    expect(count("talk")).toBe(29);
    expect(count("lightning")).toBe(21);
  });

  it("classifies short sessions as lightning even when their type is not Éclair", () => {
    const shorts = rows.filter((r) => r.durationMin <= 15);
    expect(shorts).toHaveLength(21);
    expect(shorts.every((r) => r.format === "lightning")).toBe(true);
  });

  it("converts HH:MM durations to minutes", () => {
    const keynote = rows.find((r) => r.format === "keynote");
    expect(keynote?.durationMin).toBe(75);
    expect(rows.find((r) => r.id === "9H9WKR")?.durationMin).toBe(45);
  });

  it("preserves the ISO offset instead of shifting to the build machine's zone", () => {
    const s = rows.find((r) => r.id === "9H9WKR");
    expect(s?.startTime).toBe("2026-02-03T10:30:00+01:00");
  });

  it("carries the feedback URL the Sheet never had", () => {
    expect(rows.every((r) => r.feedbackUrl.startsWith("https://"))).toBe(true);
  });

  it("carries the curated track colour", () => {
    const s = rows.find((r) => r.id === "9H9WKR");
    expect(s?.track).toBe("Infrastructure et opérations");
    expect(s?.trackColor).toBe("#edbb45");
  });

  it("resolves speakers through the resolver, never raw names", () => {
    const s = rows.find((r) => r.id === "9H9WKR");
    expect(s?.speakers).toEqual(["nicolas-vermande"]);
  });

  it("absolutises relative attachment URLs", () => {
    const withSlides = rows.filter((r) => r.slidesUrl);
    expect(withSlides.length).toBeGreaterThanOrEqual(1);
    expect(withSlides.every((r) => r.slidesUrl.startsWith("https://"))).toBe(true);
  });

  it("sorts by start time then room for a deterministic order", () => {
    const starts = rows.map((r) => r.startTime);
    expect([...starts].sort()).toEqual(starts);
  });

  it("marks every exported talk confirmed", () => {
    expect(rows.every((r) => r.status === "confirmed")).toBe(true);
  });
});
```

- [ ] **Step 4: Run and watch it fail**

Run: `pnpm vitest run src/lib/__tests__/pretalx.test.ts`
Expected: FAIL — `Failed to resolve import "../pretalx"`

- [ ] **Step 5: Write the normalizer**

```ts
// src/lib/pretalx.ts
import type { Edition } from "./editions";
// Type-only: schedule.ts imports this module at runtime, so a value import here
// would create a cycle. TypeScript erases `import type`.
import type { SessionFormat, SessionLanguage, SessionRow } from "./schedule";

export const PRETALX_BASE =
  process.env.PRETALX_BASE_URL || "https://cfp.cloudnativedays.fr";

/**
 * Editions whose Pretalx event is public. 2023 predates the instance; 2027 is
 * added here the day its event goes public — until then the fetch would 404 on
 * every build, so it is deliberately absent rather than mapped and failing.
 */
export const PRETALX_EVENT: Partial<Record<Edition, string>> = {
  2026: "2026",
};

export function scheduleExportUrl(slug: string): string {
  return `${PRETALX_BASE}/${slug}/schedule/export/schedule.json`;
}

// -- Export document shape (c3voc/frab schema, as emitted by pretalx 2026.2.1) --

export interface PretalxResource {
  title: string;
  url: string;
  type?: string;
}

export interface PretalxPerson {
  code: string;
  name: string;
  public_name?: string;
  avatar?: string | null;
  biography?: string | null;
}

export interface PretalxTalk {
  code: string;
  title: string;
  subtitle?: string;
  /** ISO 8601 start, offset included, e.g. 2026-02-03T10:30:00+01:00 */
  date: string;
  /** "HH:MM" */
  duration: string;
  room: string;
  track: string | null;
  type: string;
  language: string;
  abstract: string | null;
  description: string | null;
  logo: string | null;
  url: string;
  feedback_url?: string;
  persons: PretalxPerson[];
  links?: PretalxResource[];
  attachments?: PretalxResource[];
}

export interface PretalxScheduleExport {
  schedule: {
    version: string;
    conference: {
      title: string;
      tracks: { name: string; slug: string; color: string }[];
      days: { date: string; rooms: Record<string, PretalxTalk[]> }[];
    };
  };
}

/** Maps a Pretalx person name to the speaker slug the site routes on. */
export type SpeakerResolver = (personName: string, talkCode: string) => string;

// -- Normalization ---------------------------------------------------------

/** "01:15" -> 75. Throws rather than silently yielding NaN. */
export function durationToMinutes(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) throw new Error(`Pretalx: unparseable duration ${JSON.stringify(hhmm)}`);
  return Number(m[1]) * 60 + Number(m[2]);
}

/**
 * Submission type alone is not enough: two 10-minute sessions are typed
 * "Conférence" / "Retour d'expérience". Duration is the honest signal, and this
 * rule reproduces the Sheet's hand-classification on all 51 talks.
 */
export function toFormat(type: string, durationMin: number): SessionFormat {
  if (/^keynote/i.test(type)) return "keynote";
  if (durationMin <= 15) return "lightning";
  return "talk";
}

const VIDEO_HOST = /(?:youtube\.com|youtu\.be|vimeo\.com)/i;
const SLIDES_LABEL = /slide|deck|pr[ée]sentation/i;
const REPLAY_LABEL = /replay|vid[ée]o|video|rediff/i;

/** Pretalx emits uploaded files as site-relative paths; links are absolute. */
function absolutise(url: string): string {
  return url.startsWith("http://") || url.startsWith("https://")
    ? url
    : `${PRETALX_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

function pickResource(
  talk: PretalxTalk,
  match: (r: PretalxResource) => boolean,
): string {
  // Organisers should not have to care whether something was uploaded as a file
  // or pasted as a URL, so scan both buckets.
  const all = [...(talk.links ?? []), ...(talk.attachments ?? [])];
  const hit = all.find(match);
  return hit ? absolutise(hit.url) : "";
}

export function toSessionRows(
  doc: PretalxScheduleExport,
  resolveSpeaker: SpeakerResolver,
): SessionRow[] {
  const conference = doc.schedule.conference;
  const trackColor = new Map(conference.tracks.map((t) => [t.name, t.color]));

  const rows: SessionRow[] = [];
  for (const day of conference.days) {
    for (const talks of Object.values(day.rooms)) {
      for (const talk of talks) {
        const durationMin = durationToMinutes(talk.duration);
        const track = talk.track ?? "";
        rows.push({
          id: talk.code,
          title: talk.title,
          speakers: talk.persons.map((p) => resolveSpeaker(p.name, talk.code)),
          track,
          trackColor: trackColor.get(track),
          level: "",
          room: talk.room,
          format: toFormat(talk.type, durationMin),
          startTime: talk.date,
          durationMin,
          tags: [],
          feedbackUrl: talk.feedback_url ?? "",
          slidesUrl: pickResource(talk, (r) => SLIDES_LABEL.test(r.title)),
          recordingUrl: pickResource(
            talk,
            (r) => VIDEO_HOST.test(r.url) || REPLAY_LABEL.test(r.title),
          ),
          coverImageUrl: talk.logo ? absolutise(talk.logo) : "",
          language: (talk.language as SessionLanguage) || "",
          // The export contains only talks in the released schedule version.
          status: "confirmed",
          description: talk.description ?? talk.abstract ?? "",
        });
      }
    }
  }

  // The export groups by room, so impose a stable order the site can rely on.
  return rows.sort(
    (a, b) => a.startTime.localeCompare(b.startTime) || a.room.localeCompare(b.room),
  );
}
```

- [ ] **Step 6: Run the tests**

Run: `pnpm vitest run src/lib/__tests__/pretalx.test.ts`
Expected: PASS, 12 tests.

If the `trackColor` assertion fails, read the actual value out of the fixture
(`node -e "..."`) and correct the test — Pretalx colours are organiser-editable.

- [ ] **Step 7: Commit**

```bash
git add src/lib/pretalx.ts src/lib/__tests__/pretalx.test.ts \
        src/content/schedule/pretalx-2026.json src/lib/schedule.ts
git commit -m "feat(pretalx): normalize the released schedule export into SessionRow

Pure mapping, no I/O, tested against the committed 2026 export which
doubles as the build's offline fallback. Formats derive from submission
type plus duration, which reproduces the Sheet's hand-classification on
all 51 talks."
```

---

### Task 5: Speaker resolution and the fetch layer

**Files:**
- Modify: `src/lib/pretalx.ts` (append)
- Modify: `src/lib/__tests__/pretalx.test.ts` (append)

**Interfaces:**
- Consumes: `fetchTextOrFallback` (Task 3), `parseCsv` (Task 2), `getCsvUrl` from `remote-csv.ts`.
- Produces:
  - `buildSpeakerResolver(csvText: string): SpeakerResolver`
  - `loadSpeakerResolver(year: Edition): Promise<SpeakerResolver>`
  - `fetchScheduleExport(year: Edition, slug: string): Promise<PretalxScheduleExport>`

- [ ] **Step 1: Write the failing tests**

```ts
// append to src/lib/__tests__/pretalx.test.ts
import { buildSpeakerResolver } from "../pretalx";

describe("buildSpeakerResolver", () => {
  // The Sheet uses hand-shortened slugs. Slugifying the Pretalx name would give
  // "jerome-petazzoni" and 404; exact name match is what actually works (67/67).
  const csv = [
    "slug,name,company",
    "petazzoni,Jérôme Petazzoni,Enix",
    "nicolas-vermande,Nicolas Vermande,Staticvoid",
  ].join("\n");

  it("maps an exact Pretalx name to the Sheet slug", () => {
    const resolve = buildSpeakerResolver(csv);
    expect(resolve("Jérôme Petazzoni", "GJ89TV")).toBe("petazzoni");
    expect(resolve("Nicolas Vermande", "9H9WKR")).toBe("nicolas-vermande");
  });

  it("throws with the name and talk code when a speaker is unknown", () => {
    const resolve = buildSpeakerResolver(csv);
    // Emitting the raw name would render /intervenants/Someone%20New — a 404
    // that looks like a working link. Fail the build instead.
    expect(() => resolve("Someone New", "ABC123")).toThrow(/Someone New/);
    expect(() => resolve("Someone New", "ABC123")).toThrow(/ABC123/);
  });

  it("tolerates surrounding whitespace on both sides", () => {
    const resolve = buildSpeakerResolver("slug,name\n a-b , Ada Lovelace \n");
    expect(resolve("Ada Lovelace", "X")).toBe("a-b");
  });
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `pnpm vitest run src/lib/__tests__/pretalx.test.ts -t buildSpeakerResolver`
Expected: FAIL — `buildSpeakerResolver is not a function`

- [ ] **Step 3: Implement**

Append to `src/lib/pretalx.ts`. The three `import` lines go in the **existing import block at
the top of the file**, not next to the functions — ESM hoists them regardless, and mixing
them into the body makes the module's dependencies hard to see:

```ts
import { parseCsv } from "./csv";
import { fetchTextOrFallback } from "./remote-fetch";
import { getCsvUrl } from "./remote-csv";
```

```ts
/**
 * Build a Pretalx-name -> site-slug resolver from the speakers Sheet.
 *
 * The Sheet's `speakers` column holds slugs, and speaker URLs plus
 * getTalksForSpeaker() route on them, so the normalizer must emit slugs too.
 * Slugifying the Pretalx name is not good enough: the Sheet uses shortened
 * slugs ("petazzoni" for "Jérôme Petazzoni") and that approach misses 8 of 67.
 * Exact match on the `name` column hits 67/67.
 */
export function buildSpeakerResolver(csvText: string): SpeakerResolver {
  const rows = parseCsv(csvText);
  const index = new Map<string, string>();
  if (rows.length > 0) {
    const [header, ...body] = rows;
    const iSlug = header.findIndex((h) => h.trim() === "slug");
    const iName = header.findIndex((h) => h.trim() === "name");
    if (iSlug >= 0 && iName >= 0) {
      for (const row of body) {
        const name = (row[iName] ?? "").trim();
        const slug = (row[iSlug] ?? "").trim();
        if (name && slug) index.set(name, slug);
      }
    }
  }

  return (personName, talkCode) => {
    const slug = index.get(personName.trim());
    if (!slug) {
      throw new Error(
        `Pretalx speaker "${personName}" (talk ${talkCode}) has no row in the ` +
          `speakers Sheet. Add a row with a matching \`name\`, or correct the ` +
          `spelling on one side — emitting the raw name would produce a 404 link.`,
      );
    }
    return slug;
  };
}

export async function loadSpeakerResolver(year: Edition): Promise<SpeakerResolver> {
  const csvText = await fetchTextOrFallback({
    url: getCsvUrl("speakers", year),
    fallbackRelPath: `src/content/schedule/speakers-${year}.csv`,
    label: `speakers-${year}.csv (slug index)`,
  });
  return buildSpeakerResolver(csvText);
}

export async function fetchScheduleExport(
  year: Edition,
  slug: string,
): Promise<PretalxScheduleExport> {
  const body = await fetchTextOrFallback({
    url: scheduleExportUrl(slug),
    fallbackRelPath: `src/content/schedule/pretalx-${year}.json`,
    label: `pretalx-${year}.json`,
    validate: (text) => {
      const doc = JSON.parse(text) as Partial<PretalxScheduleExport>;
      const days = doc?.schedule?.conference?.days;
      if (!Array.isArray(days) || days.length === 0) {
        throw new Error("Pretalx export has no schedule days");
      }
    },
  });
  return JSON.parse(body) as PretalxScheduleExport;
}
```

- [ ] **Step 4: Run the tests**

Run: `pnpm vitest run src/lib/__tests__/pretalx.test.ts`
Expected: PASS, 15 tests.

- [ ] **Step 5: Verify the real speakers Sheet resolves all 67**

```bash
pnpm tsx -e "
import { fetchScheduleExport, loadSpeakerResolver, toSessionRows } from './src/lib/pretalx';
const doc = await fetchScheduleExport(2026, '2026');
const resolve = await loadSpeakerResolver(2026);
const rows = toSessionRows(doc, resolve);
console.log('sessions:', rows.length);
console.log('speaker refs:', new Set(rows.flatMap(r => r.speakers)).size);
"
```

Expected:
```
sessions: 51
speaker refs: 67
```

A thrown error here names the speaker whose spelling differs between Pretalx and the Sheet
— fix the data, not the code.

- [ ] **Step 6: Commit**

```bash
git add src/lib/pretalx.ts src/lib/__tests__/pretalx.test.ts
git commit -m "feat(pretalx): resolve session speakers to Sheet slugs

Speaker URLs and getTalksForSpeaker route on the Sheet's slug column, so
the normalizer must emit slugs. Slugifying Pretalx names misses 8 of 67
because the Sheet shortens them (petazzoni, vermande); exact name match
hits 67/67. An unresolved name throws rather than emitting a 404 link."
```

---

### Task 6: Swap `loadSessions` over

**Files:**
- Modify: `src/lib/schedule.ts:1-169`
- Create: `src/content/schedule/sessions-2023.json`
- Create: `src/content/schedule/sessions-2027.json`
- Modify: `src/lib/remote-csv.ts` (drop the `sessions` entries)
- Delete: `src/content/schedule/sessions-{2023,2026,2027}.csv`

**Interfaces:**
- Consumes: `fetchScheduleExport`, `loadSpeakerResolver`, `toSessionRows`, `PRETALX_EVENT`.
- Produces: `loadSessions(year?: Edition): Promise<SessionRow[]>` — **unchanged signature**.

- [ ] **Step 1: Freeze 2023 and 2027 as JSON archives**

2023 predates Pretalx and will never change. 2027 has no public Pretalx event yet, and its
CSV is header-only.

```bash
pnpm tsx -e "
import { writeFileSync } from 'node:fs';
import { loadSessions } from './src/lib/schedule';
for (const y of [2023, 2027] as const) {
  const rows = await loadSessions(y);
  writeFileSync('src/content/schedule/sessions-' + y + '.json', JSON.stringify(rows, null, 2) + '\n');
  console.log(y, rows.length, 'sessions frozen');
}
"
```

Expected:
```
2023 6 sessions frozen
2027 0 sessions frozen
```

Run this **before** editing `loadSessions` — it uses the current CSV implementation to
produce the archives.

- [ ] **Step 2: Write the failing test**

```ts
// append to src/lib/__tests__/pretalx.test.ts
import { loadSessions } from "../schedule";

describe("loadSessions archive path", () => {
  it("reads the frozen JSON for an edition with no Pretalx event", async () => {
    const rows = await loadSessions(2023);
    expect(rows).toHaveLength(6);
    expect(rows[0].id).toBeTruthy();
    expect(rows.every((r) => r.recordingUrl.startsWith("https://"))).toBe(true);
  });

  it("returns an empty array for an edition with no data at all", async () => {
    await expect(loadSessions(2027)).resolves.toEqual([]);
  });
});
```

- [ ] **Step 3: Run and watch it fail**

Run: `pnpm vitest run src/lib/__tests__/pretalx.test.ts -t "archive path"`
Expected: FAIL — the CSV loader still runs and `src/content/schedule/sessions-2023.csv` is
about to be deleted; at this point the test may pass accidentally. Delete the three session
CSVs now to make the failure real:

```bash
git rm src/content/schedule/sessions-2023.csv \
       src/content/schedule/sessions-2026.csv \
       src/content/schedule/sessions-2027.csv
pnpm vitest run src/lib/__tests__/pretalx.test.ts -t "archive path"
```

Expected: FAIL — `ENOENT ... sessions-2023.csv`

- [ ] **Step 4: Rewrite `loadSessions`**

In `src/lib/schedule.ts`, delete the `parseCsv` function (lines 44–103) and replace the
imports and `loadSessions` (lines 1–3 and 105–169) with:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CURRENT_EDITION, type Edition } from "./editions";
import {
  PRETALX_EVENT,
  fetchScheduleExport,
  loadSpeakerResolver,
  toSessionRows,
} from "./pretalx";
import { ui, type Locale } from "@/i18n/ui";
import { useTranslations } from "@/i18n/utils";
```

and

```ts
/**
 * Load all sessions for an edition.
 *
 * Editions with a public Pretalx event are fetched from its released schedule
 * export at build time, falling back to the committed snapshot when Pretalx is
 * unreachable. Editions without one (2023, and 2027 until its event opens) read
 * a frozen JSON archive.
 */
export async function loadSessions(
  year: Edition = CURRENT_EDITION,
): Promise<SessionRow[]> {
  const slug = PRETALX_EVENT[year];
  if (!slug) return loadArchivedSessions(year);

  const [doc, resolveSpeaker] = await Promise.all([
    fetchScheduleExport(year, slug),
    loadSpeakerResolver(year),
  ]);
  return toSessionRows(doc, resolveSpeaker).filter(
    (s) => s.status !== "hidden" && s.id,
  );
}

/** Frozen archive for editions that predate — or do not yet have — a Pretalx event. */
function loadArchivedSessions(year: Edition): SessionRow[] {
  const path = join(process.cwd(), `src/content/schedule/sessions-${year}.json`);
  try {
    const rows = JSON.parse(readFileSync(path, "utf8")) as SessionRow[];
    console.log(`[schedule] sessions-${year}.json: ${rows.length} archived sessions`);
    return rows;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[schedule] sessions-${year}.json unreadable (${msg}); rendering empty`);
    return [];
  }
}
```

- [ ] **Step 5: Run the tests**

Run: `pnpm vitest run src/lib/__tests__/pretalx.test.ts`
Expected: PASS, 17 tests.

- [ ] **Step 6: Drop the dead sessions URLs**

In `src/lib/remote-csv.ts`: delete the `sessions` key from the `CSV_URLS` object and its
type, delete the `export const SESSIONS_CSV_URL = ...` line, and narrow

```ts
export type EditionScopedType = "sessions" | "speakers" | "sponsors";
```

to

```ts
export type EditionScopedType = "speakers" | "sponsors";
```

Also delete the `SESSIONS_CSV_URL_{2023,2026,2027}` lines from the doc comment above
`SHEET_BASE`.

`scripts/pretalx-replay-checklist.ts` from Task 1 calls `getCsvUrl("sessions", 2026)`. It
has served its purpose by now; if the checklist is complete, delete the script in this
commit. If it is not, keep the sessions URL until it is and note the follow-up.

- [ ] **Step 7: Verify the whole app**

```bash
pnpm test && pnpm astro check && pnpm build
```

Expected: tests pass, 0 type errors, build succeeds. The build log must show
`[remote] pretalx-2026.json: fetched remote (…)`.

- [ ] **Step 8: Verify the page is visually unchanged**

```bash
pnpm dev --port 4321 &
sleep 6
chromium --headless --disable-gpu --hide-scrollbars --virtual-time-budget=5000 \
  --window-size=1440,3400 --screenshot=/tmp/after.png http://localhost:4321/programme/2026
```

Compare against the pre-migration screenshot. Expected differences: **none in layout**. The
only functional change is that the session modal's feedback button now appears.

- [ ] **Step 9: Commit**

```bash
git add -A src/lib/schedule.ts src/lib/remote-csv.ts src/content/schedule/
git commit -m "feat(programme): load sessions from Pretalx instead of the Sheet

loadSessions keeps its signature, so ScheduleGrid, /replays, the ICS route
and the speaker pages are untouched. Editions without a Pretalx event read
a frozen JSON archive, which retires the last CSV session source and lets
parseCsv go with it.

Feedback URLs now render for all 51 talks; the Sheet never carried them."
```

---

### Task 7: Parity guard, sync script, and docs

**Files:**
- Create: `scripts/sync-pretalx.ts`
- Create: `tests/build/pretalx-parity.test.ts`
- Modify: `package.json` (scripts)
- Modify: `CLAUDE.md`
- Modify: `.claude/skills/csv-source-of-truth/SKILL.md`

**Interfaces:**
- Consumes: everything above.
- Produces: `pnpm sync:pretalx`.

- [ ] **Step 1: Write the parity test**

This is the test that proves the swap was faithful. It is network-dependent by design — it
compares the new pipeline against the Sheet it replaces — so it is skipped when offline.

```ts
// tests/build/pretalx-parity.test.ts
/**
 * Guards the Sheet -> Pretalx migration: the normalized output must match the
 * live Sheet field-by-field on everything the Sheet actually carried.
 *
 * Network-dependent on purpose. Skipped when the Sheet is unreachable so CI in
 * a sandbox does not fail on it.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { parseCsv } from "@/lib/csv";
import { getCsvUrl } from "@/lib/remote-csv";
import { loadSessions } from "@/lib/schedule";

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRdET7nAGsbCoHlOzCICGvGHKOB6OYeqgiJPiWtXBjUCg818TFJ2-pQnEtMzyBaAsGaIQr475Q50mkM/pub?gid=178765557&single=true&output=csv";

let sheet: Record<string, string>[] | null = null;

beforeAll(async () => {
  try {
    const res = await fetch(SHEET_URL, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return;
    const [header, ...body] = parseCsv(await res.text());
    sheet = body
      .map((row) => Object.fromEntries(header.map((h, i) => [h.trim(), (row[i] ?? "").trim()])))
      .filter((r) => r.id);
  } catch {
    sheet = null;
  }
});

describe("Pretalx output matches the Sheet it replaced", () => {
  it("has the same talks", async () => {
    if (!sheet) return;
    const rows = await loadSessions(2026);
    expect(new Set(rows.map((r) => r.id))).toEqual(new Set(sheet.map((r) => r.id)));
  });

  it("agrees on every field the Sheet carried", async () => {
    if (!sheet) return;
    const rows = await loadSessions(2026);
    const bySheetId = new Map(sheet.map((r) => [r.id, r]));
    const mismatches: string[] = [];

    for (const row of rows) {
      const s = bySheetId.get(row.id);
      if (!s) continue;
      const check = (field: string, mine: unknown, theirs: unknown) => {
        if (String(mine) !== String(theirs)) {
          mismatches.push(`${row.id} ${field}: pretalx=${JSON.stringify(mine)} sheet=${JSON.stringify(theirs)}`);
        }
      };
      check("title", row.title, s.title);
      check("room", row.room, s.room);
      check("start", row.startTime, s.start_time);
      check("duration", row.durationMin, Number(s.duration_min));
      check("format", row.format, s.format);
      check("language", row.language, s.language);
      check("track", row.track, s.track);
      check("speakers", row.speakers.join(","), s.speakers);
    }

    expect(mismatches).toEqual([]);
  });

  it("does not lose recordings", async () => {
    if (!sheet) return;
    const rows = await loadSessions(2026);
    const sheetCount = sheet.filter((r) => r.recording_url).length;
    expect(rows.filter((r) => r.recordingUrl).length).toBeGreaterThanOrEqual(sheetCount);
  });
});
```

- [ ] **Step 2: Run it**

Run: `pnpm vitest run tests/build/pretalx-parity.test.ts`
Expected: PASS, 3 tests.

**The third test is the merge gate.** It fails until all 51 replay links from Task 1 have
been entered into Pretalx. A failure here is a data problem, not a code problem — finish
the checklist. If PR 1 must merge before that work completes, take the escape hatch
documented in the spec (`docs/superpowers/specs/2026-08-14-programme-pretalx-and-redesign-design.md`,
*Migration checklist*) rather than weakening this test.

- [ ] **Step 3: Write the sync script**

```ts
/**
 * Refresh the committed Pretalx snapshots that builds fall back to when the
 * instance is unreachable. Run before a release so the fallback cannot silently
 * drift the way the old sessions CSV did.
 *
 * Run: pnpm sync:pretalx
 */
import { writeFileSync } from "node:fs";
import { PRETALX_EVENT, scheduleExportUrl } from "../src/lib/pretalx";
import type { Edition } from "../src/lib/editions";

let failed = false;

for (const [yearStr, slug] of Object.entries(PRETALX_EVENT)) {
  const year = Number(yearStr) as Edition;
  const url = scheduleExportUrl(slug as string);
  const out = `src/content/schedule/pretalx-${year}.json`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const doc = await res.json();
    const talks = doc.schedule.conference.days.flatMap((d: { rooms: Record<string, unknown[]> }) =>
      Object.values(d.rooms).flat(),
    );
    if (talks.length === 0) throw new Error("export contains no talks");
    writeFileSync(out, JSON.stringify(doc, null, 2) + "\n", "utf8");
    const recordings = talks.filter((t: { links?: { url: string }[] }) =>
      (t.links ?? []).some((l) => /youtube\.com|youtu\.be|vimeo\.com/i.test(l.url)),
    ).length;
    console.log(`${out}: ${talks.length} talks, ${recordings} with a replay link`);
  } catch (err) {
    failed = true;
    console.error(`${out}: FAILED — ${err instanceof Error ? err.message : String(err)}`);
  }
}

if (failed) process.exit(1);
```

- [ ] **Step 4: Register the script**

In `package.json`, add to `"scripts"`:

```json
    "sync:pretalx": "tsx scripts/sync-pretalx.ts",
```

- [ ] **Step 5: Run it**

Run: `pnpm sync:pretalx`
Expected: `src/content/schedule/pretalx-2026.json: 51 talks, 51 with a replay link`

If the replay count is below 51, the Task 1 checklist is incomplete.

- [ ] **Step 6: Update the docs**

In `CLAUDE.md`, replace the `**Data pipeline**` bullet with:

```markdown
- **Data pipeline**: sessions come from the self-hosted Pretalx released-schedule export
  (`src/lib/pretalx.ts`), fetched at build time with a committed snapshot fallback in
  `src/content/schedule/pretalx-{year}.json` — refresh it with `pnpm sync:pretalx`.
  Speakers, sponsors and team are still published Google Sheet CSVs via
  `src/lib/remote-csv.ts`. Env overrides: `PRETALX_BASE_URL`,
  `SPEAKERS_CSV_URL_{2023,2026,2027}`, `SPONSORS_CSV_URL_{2023,2026,2027}`, `TEAM_CSV_URL`.
  Editions with no Pretalx event read a frozen `src/content/schedule/sessions-{year}.json`.
```

`.claude/skills/csv-source-of-truth/SKILL.md` must stop describing sessions as
Sheet-authored — left unchanged it will tell future sessions to edit a tab that no longer
feeds the site.

While rewriting it, note that it is **already stale in two other ways**: it names env vars
that do not exist (`SCHEDULE_SESSIONS_CSV_URL`, `SCHEDULE_SPEAKERS_CSV_URL` — the real ones
are per-edition, `SPEAKERS_CSV_URL_2026`), and it says `getCollection("speakers")` when the
collections are per-year (`speakers-2026`). Fix all three. Replace the file with:

````markdown
---
name: csv-source-of-truth
description: Use when editing or creating code that reads or writes speaker, session, sponsor, or team data — or when the user asks to add/update one of those entities
---

# Session & CSV Source of Truth

## Overview

Sessions are authored in **Pretalx** (`cfp.cloudnativedays.fr`). Speakers, sponsors and team
members are authored in **Google Sheets** by staff. The site fetches both at build time.
Hardcoding any row into `.astro`, `.ts`, or `.tsx` will drift within a day and mislead the
next person who updates the upstream expecting the site to follow. Always go through the
loader helpers.

## When to Use

Triggers:
- User asks "add session Y / speaker X / sponsor Z / team member W" (first instinct must be
  "edit Pretalx" for a session, "edit the Google Sheet" for the rest — not "edit a file").
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

1. **Upstream first.** A session change starts in Pretalx; a speaker/sponsor/team change
   starts in the Google Sheet. If the user cannot edit upstream right now, say so — do not
   bypass by committing to a `.ts` file.
2. **Fetch via loaders, never inline.**
   - Sessions → `loadSessions(year)` from `src/lib/schedule.ts`
   - Speakers → `getCollection("speakers-<year>")` (helpers in `src/lib/speakers.ts`)
   - Sponsors → `getCollection("sponsors-<year>")`
   - Team → `getCollection("team")`
3. **Session-attached resources live in Pretalx.** Slides are talk resources; replays are
   talk resources of type link titled `Replay`. There is no Sheet column for either.
4. **Overrides are env-driven.** `PRETALX_BASE_URL`, `SPEAKERS_CSV_URL_{2023,2026,2027}`,
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
| Speakers | Google Sheet | `SPEAKERS_CSV_URL_<year>` | `getCollection("speakers-<year>")` |
| Sponsors | Google Sheet | `SPONSORS_CSV_URL_<year>` | `getCollection("sponsors-<year>")` |
| Team | Google Sheet | `TEAM_CSV_URL` | `getCollection("team")` |

Editions with no Pretalx event (2023) read the frozen
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
````

- [ ] **Step 7: Full verification**

```bash
pnpm test && pnpm astro check && pnpm build
```

Expected: all tests pass, 0 type errors, build succeeds.

- [ ] **Step 8: Commit**

```bash
git add scripts/sync-pretalx.ts tests/build/pretalx-parity.test.ts package.json \
        CLAUDE.md .claude/skills/csv-source-of-truth/SKILL.md src/content/schedule/
git commit -m "feat(programme): add the Pretalx snapshot sync and parity guard

sync:pretalx refreshes the committed fallback so it cannot drift silently
the way the sessions CSV did — it was 50 rows against the Sheet's 51. The
parity test compares normalized output against the live Sheet field by
field and gates the merge on replay links being entered in Pretalx.

The csv-source-of-truth skill would otherwise keep directing edits to a
Sheet tab that no longer feeds the site."
```

---

## Done when

- `pnpm test`, `pnpm astro check` and `pnpm build` all pass.
- `/programme/2026` is visually identical to the pre-migration screenshot, with the feedback
  button now present in the session modal.
- `/programme/2023` still renders its 6 sessions; `/replays` still lists 51 recordings.
- No `sessions-*.csv` remains, and `parseCsv` exists in exactly one place.
- `git grep -n "SESSIONS_CSV_URL"` returns nothing.
