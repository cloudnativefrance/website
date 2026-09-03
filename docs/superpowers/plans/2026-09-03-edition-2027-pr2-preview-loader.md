# Edition 2027 — PR 2: the authenticated preview loader — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Read a non-public Pretalx event's *wip* schedule over the authenticated REST API and render it on staging, while a production build still fetches nothing.

**Architecture:** A second ingestion path (`src/lib/pretalx-preview.ts`) sits beside the anonymous agenda export. It resolves the unpublished schedule version, fetches its slots, joins them to confirmed submissions, and maps the result into the existing `SessionRow` / `SpeakerRecord` shapes — so no consumer changes. `loadSessions` / `loadSpeakers` gain the D-3 gate, which is where the invariant is actually enforced. Validation runs against `democon`, an existing non-public event on the live instance, selected by an env var that a production build refuses to honour.

**Tech Stack:** Astro 5 (static output), TypeScript, Vitest, Pretalx REST API.

**Spec:** `docs/superpowers/specs/2026-09-02-edition-2027-preview-design.md` — read D-1, D-2 and D-3 **including their correction blocks**, which reverse two of the original claims.

## Global Constraints

- **The invariant:** no talk title, room, time, speaker name or speaker slug for a `preview`-access edition may appear in a production build. Enforced by never *fetching*, not by hiding output.
- **Nothing from the authenticated path is ever written to disk.** Same rule as `pretalx-private.ts`. A speaker asking to be removed is handled by deleting them in Pretalx and rebuilding.
- **PII:** `/api/events/{slug}/speakers/` returns `email` and `internal_notes`. Read `code`, `name`, `biography`, `avatar_url`, `answers` and nothing else.
- **The released schedule is the allowlist** for authenticated reads (`pretalx-private.ts` rule 1). For a preview edition the *wip schedule's slots* take that role: never enumerate `/submissions/` and publish whatever comes back.
- `src/lib/flags.ts` and `src/lib/editions.ts` stay dependency-free (importable from React islands).
- `CURRENT_EDITION` stays 2026. `PRETALX_EVENT` gains **no** 2027 entry in this PR — that event does not exist yet and would 404 every build.
- Conventional commits, English. Never co-author; no attribution lines.
- Do NOT use `git commit --amend`; `git rev-parse HEAD` before and after committing.
- Baseline on this branch: `pnpm test` 47 files / 503 tests green; `pnpm exec astro check` 0 errors / 0 warnings.

## What PR 1 already built (do not rebuild)

| Symbol | Location |
|---|---|
| `isEditionLoadable(year)` / `resolveEditionLoadable(access, year, currentEdition, flagActive)` | `src/lib/edition-visibility.ts` |
| `assertEditionPublishable(year, label)` | `src/lib/edition-visibility.ts` |
| `PRETALX_EVENT: Partial<Record<Edition, {slug, access}>>`, `EditionAccess` | `src/lib/pretalx.ts` |
| `toLevel`, `durationToMinutes`, `toFormat`, `buildSpeakerResolver`, `SpeakerResolver` | `src/lib/pretalx.ts` |
| `requireToken()`, `SPEAKER_QUESTIONS`, `LEVEL_QUESTION_ID`, `reanchor()` | `src/lib/pretalx-private.ts` |
| Consumer sweep + `GUARDED_ROUTES` | `tests/build/edition-consumers.ts`, `tests/build/edition-2027-prod-isolation.test.ts` |

Reuse the mapper helpers rather than restating them — the two ingestion paths must not drift on format classification, level vocabulary or slug resolution.

## Measured API facts (verified 2026-09-03 against `democon`)

Do not re-derive these; they cost several probes.

| Fact | Consequence |
|---|---|
| `GET /api/events/{slug}/schedules/` → `[{id, version, published}]`; `wip` has `published: null` | The only way to identify the unreleased version |
| `GET /slots/` **defaults to the released schedule** — `?schedule=1` and `?schedule=2` return different rows | The filter is mandatory; omitting it renders last week's grid while looking correct |
| Slots nested under `/submissions/?expand=slots.room` return `schedule: null`, `is_visible: null` | Version selection is impossible from the submissions payload |
| `GET /slots/?schedule=<id>` rows carry `{id, room, start, end, submission, schedule, duration, is_visible}` | `room` here is an **id**, not an object — join via `/rooms/` |
| `GET /submissions/?state=confirmed&expand=slots.room,track,submission_type,speakers,answers.question` gives `title`, `description`, `duration`, `content_locale`, `tags`, `track{name,color}`, `submission_type{name}`, `speakers[{code,name,biography}]`, `answers[{question{id,...}}]` | Everything else in one paginated call |
| Localised fields are objects: `{"fr": "Monet"}` | Need a `localised()` picker |
| Pretalx caps page size at 50 and emits `http://` `next` links | Always follow `next` via the existing `reanchor()` |
| `democon`: `is_public: false`, 36 confirmed submissions, 36 slots per schedule, 59 speakers, **0 questions** | Ideal fixture; cannot exercise the question path |

---

### Task 1: Split `access` into two switches

**Files:**
- Modify: `src/lib/pretalx.ts` (`PRETALX_EVENT`)
- Modify: `src/pages/cfp.astro:11`, `src/pages/en/cfp.astro:11`
- Test: `src/lib/__tests__/pretalx-event.test.ts` (create)

**Interfaces:**
- Produces: `PRETALX_EVENT` entries gain optional `cfpOpen?: boolean`; `cfpEventUrl(): string` exported from `src/lib/pretalx.ts`.

Spec D-1's correction block is the authority. `access` means **only** "how the schedule is fetched" and flips when a schedule is *released*. `cfpOpen` means "submitters may reach this event" and flips months earlier.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/pretalx-event.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { PRETALX_EVENT, cfpEventUrl, pickCfpEvent, PRETALX_BASE } from "@/lib/pretalx";

describe("PRETALX_EVENT", () => {
  it("marks 2026 as public and as the current CFP target", () => {
    expect(PRETALX_EVENT[2026]).toEqual({
      slug: "2026",
      access: "public",
      cfpOpen: true,
    });
  });

  it("has no 2027 entry — that event does not exist yet", () => {
    expect(PRETALX_EVENT[2027]).toBeUndefined();
  });
});

describe("pickCfpEvent", () => {
  it("returns the newest edition flagged cfpOpen", () => {
    expect(
      pickCfpEvent({
        2026: { slug: "2026", access: "public", cfpOpen: true },
        2027: { slug: "2027", access: "preview", cfpOpen: true },
      }),
    ).toBe("2027");
  });

  it("ignores access entirely — a preview edition can own the CFP", () => {
    expect(
      pickCfpEvent({
        2026: { slug: "2026", access: "public" },
        2027: { slug: "2027", access: "preview", cfpOpen: true },
      }),
    ).toBe("2027");
  });

  it("throws when no edition is flagged, rather than guessing", () => {
    expect(() => pickCfpEvent({ 2026: { slug: "2026", access: "public" } })).toThrow(
      /cfpOpen/,
    );
  });

  it("lets the newest win when two editions claim the CFP", () => {
    // Overlap is legitimate during a handover: the 2027 CFP can open while the
    // 2026 event is still flagged. Newest wins, deliberately, rather than being
    // an error someone has to clear before shipping.
    expect(
      pickCfpEvent({
        2026: { slug: "2026", access: "public", cfpOpen: true },
        2027: { slug: "2027", access: "preview", cfpOpen: true },
      }),
    ).toBe("2027");
  });
});

describe("cfpEventUrl", () => {
  it("builds an absolute URL with a trailing slash", () => {
    expect(cfpEventUrl()).toBe(`${PRETALX_BASE}/2026/`);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test pretalx-event`
Expected: FAIL — `cfpEventUrl` / `pickCfpEvent` are not exported.

- [ ] **Step 3: Implement**

In `src/lib/pretalx.ts`, replace the `PRETALX_EVENT` block:

```ts
export type EditionAccess = "public" | "preview";

export interface PretalxEventEntry {
  slug: string;
  /**
   * How the schedule is fetched — and ONLY that.
   *
   *   "public"  — a schedule has been RELEASED; the anonymous agenda export at
   *               /<slug>/schedule/export/schedule.json serves it.
   *   "preview" — no released schedule; readable only through the authenticated
   *               REST API, and only in a build where the `programme` flag is active.
   *
   * Flips when a schedule is released, NEVER merely when the event becomes
   * visible to submitters — the export does not exist until a release, so an
   * early flip would 404 and fall back to a snapshot that does not exist.
   */
  access: EditionAccess;
  /**
   * Whether submitters may reach this event. Drives the /cfp link and nothing
   * else, so it can be turned on months before any schedule exists.
   */
  cfpOpen?: boolean;
}

/**
 * Editions with a Pretalx event. 2023 predates the instance. 2027 is added here
 * once its event exists; until then the fetch would 404 on every build, so it is
 * deliberately absent rather than mapped and failing.
 */
export const PRETALX_EVENT: Partial<Record<Edition, PretalxEventEntry>> = {
  2026: { slug: "2026", access: "public", cfpOpen: true },
};

/**
 * The event slug /cfp points submitters at: the newest edition flagged `cfpOpen`.
 *
 * Deliberately independent of `access`. When the 2027 event opens for proposals it
 * will be `access: "preview"` (nothing released yet) and `cfpOpen: true` — pointing
 * the CFP at it must not disturb how the programme is fetched or whether it renders.
 */
export function pickCfpEvent(
  events: Partial<Record<Edition, PretalxEventEntry>> = PRETALX_EVENT,
): string {
  const open = Object.entries(events)
    .filter(([, e]) => e?.cfpOpen)
    .sort(([a], [b]) => Number(b) - Number(a));
  if (open.length === 0) {
    throw new Error(
      "[pretalx] no edition in PRETALX_EVENT is flagged cfpOpen — /cfp has nowhere " +
        "to send submitters. Set cfpOpen on the edition currently accepting proposals.",
    );
  }
  return open[0][1]!.slug;
}

export function cfpEventUrl(): string {
  return `${PRETALX_BASE}/${pickCfpEvent()}/`;
}
```

- [ ] **Step 4: Point both CFP pages at it**

In `src/pages/cfp.astro` and `src/pages/en/cfp.astro`, replace line 11:

```ts
import { cfpEventUrl } from "@/lib/pretalx";
const CFP_URL = cfpEventUrl();
```

Both files also print the bare host+path as visible copy (`cfp.cloudnativedays.fr/2026`). Derive that from the same source rather than leaving a second hardcoded year:

```astro
<p class="mt-4 text-xs text-muted-foreground">{CFP_URL.replace(/^https?:\/\//, "").replace(/\/$/, "")}</p>
```

- [ ] **Step 5: Run tests**

Run: `pnpm test pretalx-event && pnpm exec astro check`
Expected: PASS, 0 type errors.

- [ ] **Step 6: Verify the rendered page is unchanged**

Run: `pnpm build >/dev/null 2>&1 && grep -o "cfp.cloudnativedays.fr/2026" dist/cfp/index.html | head -2`
Expected: still `cfp.cloudnativedays.fr/2026` — this task must be behaviour-neutral today.

- [ ] **Step 7: Commit**

```bash
git add src/lib/pretalx.ts src/pages/cfp.astro src/pages/en/cfp.astro \
        src/lib/__tests__/pretalx-event.test.ts
git commit -F - <<'MSG'
feat(pretalx): split the access marker into two switches

access meant three things that move on different days: how the schedule is
fetched, whether the edition may load, and where /cfp points. The 2027 event
must accept submissions months before any schedule is released, and the
anonymous export does not exist until a release — so one flip could not serve
both without 404ing.

access now means "how the schedule is fetched" alone; cfpOpen drives the /cfp
target. /cfp derives its URL rather than hardcoding a year.
MSG
```

---

### Task 2: The data-layer gate (spec D-3)

**Files:**
- Modify: `src/lib/schedule.ts` (`loadSessions`)
- Modify: `src/lib/speaker-source.ts` (`loadSpeakers`)
- Test: `src/lib/__tests__/data-layer-gate.test.ts` (create)

**Interfaces:**
- Consumes: `isEditionLoadable(year)` from `src/lib/edition-visibility.ts`.
- Produces: no signature change. `loadSessions(year)` / `loadSpeakers(year)` return the frozen archive for a non-loadable edition.

This is where the invariant is actually enforced. PR 1 gated the routes; the final review found `src/content.config.ts:200` calls `loadSpeakers(2027)` unconditionally on every build — a non-route consumer no route gate can protect.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/data-layer-gate.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// The gate must short-circuit BEFORE any network call. Stubbing fetch and
// asserting it was never invoked is the only test that proves "never fetched"
// rather than "fetched and discarded".
const fetchSpy = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchSpy);
  fetchSpy.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("loadSessions / loadSpeakers gate", () => {
  it("returns the frozen archive and issues no fetch for a non-loadable edition", async () => {
    vi.doMock("@/lib/edition-visibility", () => ({
      isEditionLoadable: () => false,
      assertEditionPublishable: () => {},
    }));
    vi.doMock("@/lib/pretalx", async (orig) => {
      const actual = await orig<typeof import("@/lib/pretalx")>();
      return {
        ...actual,
        PRETALX_EVENT: { 2027: { slug: "democon", access: "preview" } },
      };
    });

    const { loadSessions } = await import("@/lib/schedule");
    const { loadSpeakers } = await import("@/lib/speaker-source");

    await expect(loadSessions(2027)).resolves.toEqual([]);
    await expect(loadSpeakers(2027)).resolves.toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("still reads a loadable public edition through its normal path", async () => {
    vi.doMock("@/lib/edition-visibility", () => ({
      isEditionLoadable: () => true,
      assertEditionPublishable: () => {},
    }));
    const { loadSessions } = await import("@/lib/schedule");
    // 2026 falls back to the committed snapshot when fetch is stubbed out.
    const rows = await loadSessions(2026);
    expect(rows.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test data-layer-gate`
Expected: FAIL — the first case fetches (or throws on the missing `pretalx-2027.json`).

- [ ] **Step 3: Implement in `src/lib/schedule.ts`**

In `loadSessions`, before touching `event`:

```ts
export async function loadSessions(
  year: Edition = CURRENT_EDITION,
): Promise<SessionRow[]> {
  const event = PRETALX_EVENT[year];
  let rows: SessionRow[];
  // The invariant lives here, not in the routes: src/content.config.ts loads
  // speakers on every build and is not a route, so a route-only gate cannot
  // protect it. A non-loadable edition reads its frozen archive and issues no
  // request at all — there is then nothing in memory for any consumer to leak.
  if (event && isEditionLoadable(year)) {
    const doc = await fetchScheduleExport(year, event.slug);
    ...unchanged...
  } else {
    rows = loadArchivedSessions(year);
  }
  return rows.filter((s) => s.status !== "hidden" && s.id);
}
```

Add `import { isEditionLoadable } from "./edition-visibility";`.

- [ ] **Step 4: Implement in `src/lib/speaker-source.ts`**

```ts
export async function loadSpeakers(year: Edition): Promise<SpeakerRecord[]> {
  const event = PRETALX_EVENT[year];
  // See the matching comment in schedule.ts's loadSessions.
  if (!event || !isEditionLoadable(year)) return loadArchivedSpeakers(year);
  ...unchanged...
}
```

- [ ] **Step 5: Check for an import cycle**

`edition-visibility.ts` imports `PRETALX_EVENT` from `pretalx.ts`; `schedule.ts` and `speaker-source.ts` now import `edition-visibility.ts`. `pretalx.ts` imports `schedule.ts` **type-only** (erased), so no runtime cycle exists — but verify:

Run: `pnpm exec astro check && pnpm build 2>&1 | grep -i "circular" || echo "no cycle"`
Expected: `no cycle`, 0 type errors.

- [ ] **Step 6: Run the full suite**

Run: `pnpm test`
Expected: 503 + the new cases, all green.

- [ ] **Step 7: Update the docstring PR 1 corrected**

`src/lib/edition-visibility.ts` says the data layer does not consult this rule yet. It does now — make the comment true again.

- [ ] **Step 8: Commit**

```bash
git add src/lib/schedule.ts src/lib/speaker-source.ts src/lib/edition-visibility.ts \
        src/lib/__tests__/data-layer-gate.test.ts
git commit -F - <<'MSG'
feat(editions): enforce the visibility rule in the data layer

Routes were gated in PR 1, but src/content.config.ts loads speakers on every
build and is not a route — no route gate can protect it. The gate now sits in
loadSessions and loadSpeakers, so a non-loadable edition issues no request and
nothing exists in memory for any consumer to leak.

The test stubs fetch and asserts it was never called: "never fetched" is the
property, and only that assertion proves it rather than "fetched and discarded".
MSG
```

---

### Task 3: The fixture switch

**Files:**
- Create: `src/lib/preview-fixture.ts`
- Test: `src/lib/__tests__/preview-fixture.test.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `resolvePreviewFixture(env, siteOrigin): { year: Edition; slug: string } | undefined`, and `fixtureEvent(year): PretalxEventEntry | undefined`.

`democon` is a real non-public event on the live instance with 36 confirmed submissions — the only way to exercise the preview path before the 2027 event exists. It is selected by env var, never committed into `PRETALX_EVENT`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/preview-fixture.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { resolvePreviewFixture } from "@/lib/preview-fixture";
import { PROD_ORIGIN } from "@/lib/site-env";

describe("resolvePreviewFixture", () => {
  it("is inert when the env var is unset", () => {
    expect(resolvePreviewFixture({}, undefined)).toBeUndefined();
  });

  it("maps the configured edition to the fixture slug", () => {
    expect(
      resolvePreviewFixture({ PRETALX_PREVIEW_SLUG: "democon" }, undefined),
    ).toEqual({ year: 2027, slug: "democon" });
  });

  it("accepts an explicit edition", () => {
    expect(
      resolvePreviewFixture(
        { PRETALX_PREVIEW_SLUG: "democon", PRETALX_PREVIEW_EDITION: "2027" },
        undefined,
      ),
    ).toEqual({ year: 2027, slug: "democon" });
  });

  it("REFUSES to apply on a production build, throwing rather than ignoring", () => {
    expect(() =>
      resolvePreviewFixture({ PRETALX_PREVIEW_SLUG: "democon" }, PROD_ORIGIN),
    ).toThrow(/production/i);
  });

  it("rejects an edition outside the union", () => {
    expect(() =>
      resolvePreviewFixture(
        { PRETALX_PREVIEW_SLUG: "democon", PRETALX_PREVIEW_EDITION: "1999" },
        undefined,
      ),
    ).toThrow(/1999/);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test preview-fixture`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement**

Create `src/lib/preview-fixture.ts`:

```ts
/**
 * Development-only fixture selection for the preview path.
 *
 * The 2027 Pretalx event does not exist yet, but `democon` — an existing
 * non-public event on the same instance, 36 confirmed submissions across a wip
 * and a released schedule — exercises exactly the code path 2027 will use.
 * Pointing an edition at it is a VALIDATION affordance and never a committed
 * fact, which is why it lives in an env var and not in `PRETALX_EVENT`.
 *
 * It throws rather than silently ignoring itself on a production build. A
 * fixture that quietly disabled itself would let a misconfigured pipeline look
 * like it was validating something it was not.
 */
import { isEdition, type Edition } from "./editions";
import { isProductionOrigin } from "./site-env";
import type { PretalxEventEntry } from "./pretalx";

const DEFAULT_FIXTURE_EDITION = 2027;

export function resolvePreviewFixture(
  env: Record<string, string | undefined>,
  siteOrigin: string | undefined,
): { year: Edition; slug: string } | undefined {
  const slug = env.PRETALX_PREVIEW_SLUG?.trim();
  if (!slug) return undefined;

  if (isProductionOrigin(siteOrigin)) {
    throw new Error(
      `[preview] PRETALX_PREVIEW_SLUG=${slug} is set on a PRODUCTION build. ` +
        `The fixture exists for local and staging validation only — unset it, or ` +
        `build for a non-production origin.`,
    );
  }

  const raw = env.PRETALX_PREVIEW_EDITION?.trim();
  const year = raw ? Number(raw) : DEFAULT_FIXTURE_EDITION;
  if (!isEdition(year)) {
    throw new Error(
      `[preview] PRETALX_PREVIEW_EDITION=${raw} is not a known edition. ` +
        `Known editions: 2023, 2026, 2027.`,
    );
  }
  return { year, slug };
}

/** The synthetic PRETALX_EVENT entry the fixture stands in for. */
export function fixtureEvent(
  year: Edition,
  env: Record<string, string | undefined> = process.env,
  siteOrigin: string | undefined = process.env.PUBLIC_SITE_URL,
): PretalxEventEntry | undefined {
  const fixture = resolvePreviewFixture(env, siteOrigin);
  if (!fixture || fixture.year !== year) return undefined;
  return { slug: fixture.slug, access: "preview" };
}
```

- [ ] **Step 4: Document it**

Append to `.env.example`:

```bash
# Validation fixture for the unreleased-programme path (local / staging only).
# Points an edition at an existing non-public Pretalx event so the authenticated
# preview reader can be exercised before the real event exists. Refused on a
# production build.
# PRETALX_PREVIEW_SLUG=democon
# PRETALX_PREVIEW_EDITION=2027
```

- [ ] **Step 5: Run tests**

Run: `pnpm test preview-fixture && pnpm exec astro check`
Expected: PASS, 0 type errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/preview-fixture.ts src/lib/__tests__/preview-fixture.test.ts .env.example
git commit -F - <<'MSG'
feat(preview): env-var fixture for the unreleased-programme path

The 2027 Pretalx event does not exist yet, but democon — non-public, 36
confirmed submissions, a wip and a released schedule — exercises the same code
path. Selecting it via env keeps it out of PRETALX_EVENT, so no committed
config can ever point the site at a demo event.

It throws on a production build rather than disabling itself: a fixture that
quietly opted out would let a misconfigured pipeline look like it was
validating something it was not.
MSG
```

---

### Task 4: The preview API client

**Files:**
- Create: `src/lib/pretalx-preview-api.ts`
- Test: `src/lib/__tests__/pretalx-preview-api.test.ts`

**Interfaces:**
- Consumes: `requireToken()`, `reanchor()` from `src/lib/pretalx-private.ts`; `PRETALX_BASE` from `src/lib/pretalx.ts`.
- Produces:
  ```ts
  export interface PreviewSlot { id: number; submission: string; room: number; start: string; end: string; duration: number; is_visible: boolean; schedule: number }
  export interface PreviewSubmission { code: string; title: string; description: string | null; abstract?: string | null; duration: number; content_locale: string; tags: string[]; state: string; track: { name: Localised; color: string } | null; submission_type: { name: Localised } | null; speakers: Array<{ code: string; name: string; biography: string | null }>; answers: Array<{ question: { id: number }; answer: string }> }
  export type Localised = Record<string, string> | string
  export function localised(v: Localised | null | undefined): string
  export async function fetchWipScheduleId(slug: string, token: string): Promise<number>
  export async function fetchPreviewSlots(slug: string, scheduleId: number, token: string): Promise<PreviewSlot[]>
  export async function fetchPreviewSubmissions(slug: string, token: string): Promise<PreviewSubmission[]>
  export async function fetchRoomNames(slug: string, token: string): Promise<Map<number, string>>
  ```

**The load-bearing detail:** `GET /slots/` defaults to the *released* schedule. Omitting `?schedule=<wip id>` renders last week's grid while looking entirely correct. `fetchWipScheduleId` must throw when no unpublished version exists — silence there is the worst failure mode in this PR.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/__tests__/pretalx-preview-api.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  localised,
  fetchWipScheduleId,
  fetchPreviewSlots,
} from "@/lib/pretalx-preview-api";

const TOKEN = "t0ken";
let calls: string[] = [];

function jsonOnce(body: unknown) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
}

beforeEach(() => {
  calls = [];
});
afterEach(() => vi.unstubAllGlobals());

describe("localised", () => {
  it("prefers fr", () => expect(localised({ fr: "Monet", en: "Monet EN" })).toBe("Monet"));
  it("falls back to the first present value", () =>
    expect(localised({ en: "Only English" })).toBe("Only English"));
  it("passes a plain string through", () => expect(localised("Piaf")).toBe("Piaf"));
  it("returns empty for null/undefined/empty", () => {
    expect(localised(null)).toBe("");
    expect(localised(undefined)).toBe("");
    expect(localised({})).toBe("");
  });
});

describe("fetchWipScheduleId", () => {
  it("returns the version whose published is null", async () => {
    vi.stubGlobal("fetch", (u: string) => {
      calls.push(u);
      return jsonOnce({
        count: 2,
        next: null,
        results: [
          { id: 9, version: "v1.0", published: "2025-06-22T09:57:42+02:00" },
          { id: 12, version: "wip", published: null },
        ],
      });
    });
    await expect(fetchWipScheduleId("democon", TOKEN)).resolves.toBe(12);
  });

  it("THROWS when every version is published — never falls back to a release", async () => {
    vi.stubGlobal("fetch", () =>
      jsonOnce({
        count: 1,
        next: null,
        results: [{ id: 9, version: "v1.0", published: "2025-06-22T09:57:42+02:00" }],
      }),
    );
    await expect(fetchWipScheduleId("democon", TOKEN)).rejects.toThrow(/unpublished/i);
  });
});

describe("fetchPreviewSlots", () => {
  it("pins the request to the given schedule id", async () => {
    vi.stubGlobal("fetch", (u: string) => {
      calls.push(u);
      return jsonOnce({ count: 0, next: null, results: [] });
    });
    await fetchPreviewSlots("democon", 12, TOKEN);
    expect(calls[0]).toContain("schedule=12");
  });

  it("follows pagination, re-anchoring the next link onto the configured origin", async () => {
    let page = 0;
    vi.stubGlobal("fetch", (u: string) => {
      calls.push(u);
      page += 1;
      return page === 1
        ? jsonOnce({
            count: 2,
            next: "http://cfp.cloudnativedays.fr/api/events/democon/slots/?page=2",
            results: [{ id: 1, submission: "AAA", room: 1, start: "s", end: "e", duration: 30, is_visible: true, schedule: 12 }],
          })
        : jsonOnce({
            count: 2,
            next: null,
            results: [{ id: 2, submission: "BBB", room: 1, start: "s", end: "e", duration: 30, is_visible: true, schedule: 12 }],
          });
    });
    const slots = await fetchPreviewSlots("democon", 12, TOKEN);
    expect(slots.map((s) => s.submission)).toEqual(["AAA", "BBB"]);
    expect(calls).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test pretalx-preview-api`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement**

Create `src/lib/pretalx-preview-api.ts`. Model the paginated walk on `fetchAllPages` in `pretalx-private.ts` — read that function first and mirror its `MAX_PAGES` backstop, its `reanchor()` call on `next`, and its timeout handling rather than inventing a second style.

```ts
/**
 * Authenticated reads of an UNRELEASED schedule.
 *
 * `pretalx.ts` is the public path: the released agenda export, fetched
 * anonymously. `pretalx-private.ts` reads non-public question answers for an
 * event whose schedule IS released. This module is the third case — an event
 * with no released schedule at all, whose grid exists only as a wip version.
 *
 * Two rules inherited from `pretalx-private.ts`, both enforced here:
 *
 * 1. **The wip schedule's slots are the allowlist.** With a token,
 *    `/submissions/` returns rejected and pending proposals too. Only
 *    submissions that appear in a slot of the wip schedule may reach the site.
 * 2. **Nothing is cached to disk.** Fetched at build time and discarded.
 */
```

Then the four fetchers. `fetchWipScheduleId` throws when no `published: null` version exists:

```ts
export async function fetchWipScheduleId(slug: string, token: string): Promise<number> {
  const versions = await fetchAllPages<{ id: number; version: string; published: string | null }>(
    `${PRETALX_BASE}/api/events/${slug}/schedules/`,
    token,
    `schedules for ${slug}`,
  );
  const wip = versions.find((v) => v.published === null);
  if (!wip) {
    throw new Error(
      `[preview] event "${slug}" has no unpublished schedule version. A preview ` +
        `edition renders the wip schedule; refusing to fall back to a released one, ` +
        `which would silently show an older grid than the organisers are editing.`,
    );
  }
  return wip.id;
}
```

`fetchPreviewSlots` MUST include `?schedule=${scheduleId}`.

- [ ] **Step 4: Run tests**

Run: `pnpm test pretalx-preview-api`
Expected: PASS.

- [ ] **Step 5: Prove it against the live fixture**

Run:
```bash
set -a; . ./.env.local; set +a
pnpm exec tsx -e '
import { fetchWipScheduleId, fetchPreviewSlots, fetchRoomNames } from "./src/lib/pretalx-preview-api";
import { requireToken } from "./src/lib/pretalx-private";
const t = requireToken();
const id = await fetchWipScheduleId("democon", t);
const slots = await fetchPreviewSlots("democon", id, t);
const rooms = await fetchRoomNames("democon", t);
console.log({ wipScheduleId: id, slots: slots.length, everySlotOnWip: slots.every(s => s.schedule === id), rooms: [...rooms.values()] });
'
```
Expected: `wipScheduleId` is the `published: null` id, `slots: 36`, `everySlotOnWip: true`. Record the output in your report. If `everySlotOnWip` is false the `?schedule=` filter is not being applied — stop and report.

- [ ] **Step 6: Commit**

```bash
git add src/lib/pretalx-preview-api.ts src/lib/__tests__/pretalx-preview-api.test.ts
git commit -F - <<'MSG'
feat(preview): authenticated client for an unreleased schedule

GET /slots/ defaults to the RELEASED schedule, and the slots nested under
/submissions/?expand= return schedule: null — so the wip version has to be
resolved explicitly and passed as a filter. Omitting it renders last week's
grid while looking entirely correct, which is why fetchWipScheduleId throws
rather than falling back to a released version.
MSG
```

---

### Task 5: The mapper

**Files:**
- Create: `src/lib/pretalx-preview.ts`
- Test: `src/lib/__tests__/pretalx-preview.test.ts`

**Interfaces:**
- Consumes: everything Task 4 produces; `toFormat`, `durationToMinutes`, `toLevel`, `buildSpeakerResolver` from `src/lib/pretalx.ts`; `LEVEL_QUESTION_ID`, `SPEAKER_QUESTIONS` from `src/lib/pretalx-private.ts`.
- Produces:
  ```ts
  export interface PreviewEdition { sessions: SessionRow[]; speakers: SpeakerRecord[] }
  export async function loadPreviewEdition(year: Edition, slug: string): Promise<PreviewEdition>
  ```
  Memoised per `(year, slug)` for the process lifetime — Astro invokes loaders many times per build and every page must see the same data.

**Field mapping** (`SessionRow` ← join of slot + submission):

| Field | Source |
|---|---|
| `id` | `submission.code` |
| `title`, `description`, `tags` | `submission.*` (`description ?? abstract ?? ""`) |
| `speakers` | `submission.speakers[].name` → `buildSpeakerResolver()` |
| `track`, `trackColor` | `localised(track.name)`, `track.color` |
| `level` | answer whose `question.id === LEVEL_QUESTION_ID[year]` → `toLevel()`; `""` when unconfigured |
| `room` | `localised(rooms.get(slot.room))` |
| `format` | `toFormat(localised(submission_type.name), durationMin)` |
| `startTime` | `slot.start` |
| `durationMin` | `durationToMinutes` is for `"HH:MM"` strings — the REST API gives `submission.duration` as **minutes already**, so use it directly and do NOT route it through that helper |
| `language` | `submission.content_locale` when `"fr"`/`"en"`, else `""` |
| `status` | `slot.is_visible === false` → `"hidden"`, else `"confirmed"` |
| `feedbackUrl`, `slidesUrl`, `recordingUrl`, `coverImageUrl` | `""` — none exist before the event |

**Missing question ids.** `democon` has zero questions, and 2027's ids cannot be read until its event exists. So: when `LEVEL_QUESTION_ID[year]` / `SPEAKER_QUESTIONS[year]` are absent, the preview path logs one warning per build and yields empty levels and affiliations — it does NOT throw. That is a deliberate divergence from `pretalx-private.ts`, justified because a preview edition is by definition not yet fully configured, and the alternative makes the fixture unusable. The moment the edition's entry lands in `PRETALX_EVENT`, the existing fatal behaviour applies on the public path.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/pretalx-preview.test.ts` with a hand-built fixture (no network):

```ts
import { describe, it, expect } from "vitest";
import { toPreviewSessions } from "@/lib/pretalx-preview";

const rooms = new Map([[1, "Monet"], [2, "Piaf"]]);

const submission = {
  code: "ABC123",
  title: "Scaling etcd",
  description: "How we did it",
  duration: 30,
  content_locale: "fr",
  tags: ["ops"],
  state: "confirmed",
  track: { name: { fr: "Infrastructure" }, color: "#edbb45" },
  submission_type: { name: { fr: "Talk" } },
  speakers: [{ code: "S1", name: "Ada Lovelace", biography: "bio" }],
  answers: [{ question: { id: 4 }, answer: "Intermédiaire" }],
};

const slot = {
  id: 1, submission: "ABC123", room: 1,
  start: "2027-06-03T10:30:00+02:00", end: "2027-06-03T11:00:00+02:00",
  duration: 30, is_visible: true, schedule: 12,
};

const resolve = () => "ada-lovelace";

describe("toPreviewSessions", () => {
  it("joins a slot to its submission", () => {
    const [row] = toPreviewSessions([slot], [submission], rooms, resolve, 4);
    expect(row).toMatchObject({
      id: "ABC123",
      title: "Scaling etcd",
      speakers: ["ada-lovelace"],
      track: "Infrastructure",
      trackColor: "#edbb45",
      level: "intermediate",
      room: "Monet",
      startTime: "2027-06-03T10:30:00+02:00",
      durationMin: 30,
      language: "fr",
      status: "confirmed",
    });
  });

  it("marks an invisible slot hidden so the shared exit filter drops it", () => {
    const [row] = toPreviewSessions(
      [{ ...slot, is_visible: false }], [submission], rooms, resolve, 4);
    expect(row.status).toBe("hidden");
  });

  it("leaves level empty when no question id is configured", () => {
    const [row] = toPreviewSessions([slot], [submission], rooms, resolve, undefined);
    expect(row.level).toBe("");
  });

  it("drops a slot whose submission is absent rather than emitting a blank row", () => {
    expect(toPreviewSessions([{ ...slot, submission: "GONE" }], [submission], rooms, resolve, 4))
      .toEqual([]);
  });

  it("orders by start time, then room", () => {
    const later = { ...slot, id: 2, submission: "ABC123", start: "2027-06-03T14:00:00+02:00" };
    const rows = toPreviewSessions([later, slot], [submission], rooms, resolve, 4);
    expect(rows.map((r) => r.startTime)).toEqual([
      "2027-06-03T10:30:00+02:00",
      "2027-06-03T14:00:00+02:00",
    ]);
  });

  it("never emits a submission that has no slot in the wip schedule", () => {
    const extra = { ...submission, code: "NOTSCHEDULED" };
    const rows = toPreviewSessions([slot], [submission, extra], rooms, resolve, 4);
    expect(rows.map((r) => r.id)).toEqual(["ABC123"]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test pretalx-preview`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `toPreviewSessions` and `loadPreviewEdition`**

Export `toPreviewSessions(slots, submissions, rooms, resolveSpeaker, levelQuestionId)` as a pure function so the tests above need no network, with `loadPreviewEdition` as the memoised I/O wrapper around it. The slot list is the allowlist — iterate slots, look up submissions, never the reverse.

- [ ] **Step 4: Run tests**

Run: `pnpm test pretalx-preview`
Expected: PASS, all 6 cases.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pretalx-preview.ts src/lib/__tests__/pretalx-preview.test.ts
git commit -m "feat(preview): map a wip schedule into SessionRow and SpeakerRecord"
```

---

### Task 6: Wire it in and validate end to end

**Files:**
- Modify: `src/lib/schedule.ts`, `src/lib/speaker-source.ts`
- Modify: `tests/build/edition-consumers.ts` (declare the new modules)
- Test: `tests/build/preview-path.test.ts` (create)

**Interfaces:**
- Consumes: `loadPreviewEdition` (Task 5), `fixtureEvent` (Task 3), the gate (Task 2).

- [ ] **Step 1: Resolve the event through the fixture**

In both loaders, the entry becomes `PRETALX_EVENT[year] ?? fixtureEvent(year)`, and an entry with `access: "preview"` routes to `loadPreviewEdition` instead of `fetchScheduleExport`:

```ts
const event = PRETALX_EVENT[year] ?? fixtureEvent(year);
if (event && isEditionLoadable(year)) {
  rows = event.access === "preview"
    ? (await loadPreviewEdition(year, event.slug)).sessions
    : await (async () => { /* existing public path, unchanged */ })();
} else {
  rows = loadArchivedSessions(year);
}
```

Keep the public branch byte-identical — this is a routing change, not a rewrite.

- [ ] **Step 2: Write the guard test**

Create `tests/build/preview-path.test.ts` asserting that the preview branch is unreachable when the gate is closed, mirroring `edition-2027-prod-isolation.test.ts`'s style: stub `fetch`, set `PRETALX_PREVIEW_SLUG=democon`, leave the `programme` flag inactive, and assert `loadSessions(2027)` returns `[]` with no fetch issued.

- [ ] **Step 3: Declare the new modules in the consumer sweep**

`tests/build/edition-consumers.ts` enumerates every module that reaches session/speaker data. Add `src/lib/pretalx-preview.ts` and `src/lib/pretalx-preview-api.ts` to the non-route consumer list so the sweep stays exhaustive.

- [ ] **Step 4: Validate against democon, gate closed (production shape)**

Run:
```bash
PRETALX_PREVIEW_SLUG=democon pnpm build >/dev/null 2>&1
find dist -path '*2027*' -name '*.html' | sort
```
Expected: only the three 2027 index pages and their `/en/` mirrors — **no per-speaker paths**. The fixture is set and still nothing is fetched, because the flag is off. Record the output.

- [ ] **Step 5: Validate against democon, gate open (staging shape)**

Run:
```bash
PRETALX_PREVIEW_SLUG=democon FLAG_OVERRIDES=programme=on pnpm build 2>&1 | tail -30
```
Expect this to **fail** on unmapped speaker slugs — democon's 59 generated speakers are absent from `src/data/speaker-slugs.ts`, and `buildSpeakerResolver` throws by design. That failure is the correct behaviour and is exactly what PR 3's slug generator exists to solve.

To see the grid render, add the fixture's speakers temporarily:
```bash
pnpm exec tsx -e '
import { fetchPreviewSubmissions } from "./src/lib/pretalx-preview-api";
import { requireToken } from "./src/lib/pretalx-private";
const subs = await fetchPreviewSubmissions("democon", requireToken());
const names = [...new Set(subs.flatMap(s => s.speakers.map(p => p.name)))].sort();
const slugify = (n) => n.toLowerCase().normalize("NFD")
  .replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
console.log(names.map(n => `  "${n}": "${slugify(n)}",`).join("\n"));
'
```
Paste the output into `src/data/speaker-slugs.ts` **on a scratch commit you do not push**, rebuild, confirm `/programme/2027` renders democon's grid with rooms, tracks and times, screenshot or record the session count, then `git reset --hard` to drop it. Report what you saw.

- [ ] **Step 6: Full suite and type check**

Run: `pnpm test && pnpm exec astro check`
Expected: green, 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/schedule.ts src/lib/speaker-source.ts tests/build/edition-consumers.ts \
        tests/build/preview-path.test.ts
git commit -F - <<'MSG'
feat(preview): route preview editions through the authenticated reader

loadSessions and loadSpeakers now send an access: "preview" edition to
loadPreviewEdition instead of the anonymous export. The public branch is
unchanged — this is routing, not a rewrite.

Validated against democon: gate closed, nothing is fetched and no 2027 speaker
path is emitted; gate open, the wip schedule renders.
MSG
```

---

## Definition of done

- [ ] `pnpm test` green; `pnpm exec astro check` 0 errors.
- [ ] `PRETALX_PREVIEW_SLUG=democon pnpm build` emits no 2027 speaker path.
- [ ] `PRETALX_PREVIEW_SLUG=democon PUBLIC_SITE_URL=https://cloudnativedays.fr pnpm build` **fails**, naming the fixture and production.
- [ ] `/cfp` still shows `cfp.cloudnativedays.fr/2026`.
- [ ] The democon grid was seen rendering on the throwaway slug commit, and that commit is gone.
- [ ] `PRETALX_EVENT` still has no 2027 entry.

---

### Task 7: Navigation follows the live edition, with 2026 kept reachable

**Files:**
- Modify: `src/components/Navigation.astro:66-81` (the `programmeDD` block)
- Modify: `astro.config.mjs` (the `/programme` and `/intervenants` redirects)
- Modify: `src/i18n/ui.ts` (FR + EN)
- Test: `tests/build/nav-live-edition.test.ts` (create)

**Interfaces:**
- Consumes: `isEditionLoadable(year)` from `src/lib/edition-visibility.ts`, `EDITIONS` from `src/lib/editions.ts`.
- Produces: `featuredEdition(now?: Date): Edition` exported from `src/lib/edition-visibility.ts` — the newest edition whose programme may be shown.

**Why not `CURRENT_EDITION`.** The nav currently points at `CURRENT_EDITION` (2026). That constant must stay 2026 — moving it forward re-opens the production gate, which is the trap PR 1's guard test exists to catch. So "which programme is live" needs its own derivation, and the newest loadable edition is exactly it: 2026 in production, 2027 on staging where the flag is on. The staging-only behaviour is then a consequence of the existing flag rather than a second switch that could drift.

**What the user sees.** On staging, the Programme dropdown's first entry becomes the 2027 programme, and a new entry keeps the finished 2026 edition one click away. In production nothing changes at all — the featured edition is still 2026 and the archive entry is absent, because an archive link to the edition you are already showing is noise.

- [ ] **Step 1: Write the failing test**

Create `tests/build/nav-live-edition.test.ts`:

```ts
/**
 * Guards that the Programme nav follows the LIVE edition rather than
 * CURRENT_EDITION, and that finished editions stay reachable once a newer one
 * is featured.
 *
 * Source-shape guard, matching the other tests/build specs: a full build per
 * case is too slow, and the property is structural.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { featuredEdition, archivedEditions } from "@/lib/edition-visibility";

const NAV = readFileSync(
  resolve(import.meta.dirname, "../../src/components/Navigation.astro"),
  "utf-8",
);

describe("featuredEdition", () => {
  it("is the newest loadable edition", () => {
    // With the programme flag inactive, 2027 is not loadable, so 2026 leads.
    expect(featuredEdition(new Date("2026-09-03T12:00:00+02:00"))).toBe(2026);
  });

  it("moves to 2027 once the programme flag has opened", () => {
    expect(featuredEdition(new Date("2027-04-02T12:00:00+02:00"))).toBe(2027);
  });
});

describe("archivedEditions", () => {
  it("is empty while the featured edition is the newest one shown", () => {
    expect(archivedEditions(new Date("2026-09-03T12:00:00+02:00"))).toEqual([2023]);
  });

  it("includes 2026 once 2027 is featured", () => {
    expect(archivedEditions(new Date("2027-04-02T12:00:00+02:00"))).toEqual([2026, 2023]);
  });
});

describe("Navigation.astro", () => {
  it("derives the programme link from featuredEdition, not CURRENT_EDITION", () => {
    expect(NAV).toContain("featuredEdition");
    const dd = NAV.slice(NAV.indexOf("const programmeDD"), NAV.indexOf("</script>"));
    expect(dd).not.toMatch(/programmeBase\}\/\$\{CURRENT_EDITION\}/);
  });

  it("offers an archive entry per finished edition", () => {
    expect(NAV).toContain("archivedEditions");
    expect(NAV).toContain("nav.programme.submenu.archive");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test nav-live-edition`
Expected: FAIL — `featuredEdition` is not exported.

- [ ] **Step 3: Add the two derivations**

In `src/lib/edition-visibility.ts`:

```ts
/**
 * The edition whose programme the site currently leads with.
 *
 * Deliberately NOT `CURRENT_EDITION`, which must stay pinned to the last
 * edition with public data — moving it forward re-opens the production gate
 * (see the guard test in edition-visibility.test.ts). This asks the live
 * question instead: which is the newest edition we are allowed to show? On
 * production that is 2026; on staging, where the programme flag is forced on,
 * it is 2027. The staging-only behaviour therefore falls out of the existing
 * flag rather than needing a second switch to keep in step.
 */
export function featuredEdition(now?: Date): Edition {
  const shown = [...EDITIONS].sort((a, b) => b - a).filter((y) => isEditionLoadable(y, now));
  // EDITIONS always contains at least one past edition, so `shown` is non-empty.
  return shown[0] ?? CURRENT_EDITION;
}

/** Finished editions, newest first — everything shown that is not the headline. */
export function archivedEditions(now?: Date): Edition[] {
  const featured = featuredEdition(now);
  return [...EDITIONS].sort((a, b) => b - a).filter((y) => y !== featured && isEditionLoadable(y, now));
}
```

**Deliberate reversal, flag it in your report.** PR 1's final review removed
`isEditionLoadable`'s `now` parameter as dead, and that was correct at the time — nothing
called it. `featuredEdition` and `archivedEditions` are its callers, and the tests above
cannot pin flag-dependent behaviour without injecting a clock. Reinstate it:

```ts
export function isEditionLoadable(year: Edition, now?: Date): boolean {
```

- [ ] **Step 4: Rework the nav dropdown**

In `src/components/Navigation.astro`, replace the `CURRENT_EDITION` uses inside `programmeDD` (lines 78 and 80) with the featured edition, and append one archive entry per finished edition:

```ts
const featured = featuredEdition();
const archives = archivedEditions();
...
    items: [
      { href: `${programmeBase}/${featured}`,  label: t("nav.programme.submenu.programme"),    current: onProgramme },
      { href: cfpPath,                          label: t("nav.programme.submenu.cfp"),          current: onCfp },
      { href: `${speakersBase}/${featured}`,    label: t("nav.programme.submenu.intervenants"), current: onSpeakers },
      // Finished editions stay one click away once a newer programme leads.
      // Only editions that were themselves the headline programme qualify:
      // 2023 predates that and has its own dedicated /2023 retrospective, which
      // the About menu already links. `>= CURRENT_EDITION` expresses that
      // without hardcoding a year — it yields [] in production and [2026] on
      // staging, which is exactly the requirement.
      ...archives
        .filter((y) => y >= CURRENT_EDITION)
        .map((y) => ({
          href: `${programmeBase}/${y}`,
          label: t("nav.programme.submenu.archive").replace("{year}", String(y)),
          current: currentPath === `${programmeBase}/${y}`,
        })),
    ],
```

- [ ] **Step 5: Add the i18n key in both locales**

`src/i18n/ui.ts`, next to the other `nav.programme.submenu.*` entries:

```ts
// fr
"nav.programme.submenu.archive": "Programme {year}",
// en
"nav.programme.submenu.archive": "Schedule {year}",
```

The registry parity test enforces both locales; a missing one fails CI.

- [ ] **Step 6: Make the bare `/programme` redirect follow the featured edition**

`astro.config.mjs` hardcodes `"/programme": "/programme/2026"`. On staging that would send visitors to the archive rather than the live programme. The config already imports from `src/`, so compute it:

```js
import { featuredEdition } from "./src/lib/edition-visibility.ts";
const featured = featuredEdition();
...
  redirects: {
    "/programme":    `/programme/${featured}`,
    "/intervenants": `/intervenants/${featured}`,
    "/en/programme": `/en/programme/${featured}`,
    "/en/speakers":  `/en/speakers/${featured}`,
    ...unchanged entries...
  },
```

Leave the `/sponsors`, `/partenaires` and slug-rename redirects exactly as they are — sponsors have their own flag and year submenu.

- [ ] **Step 7: Verify both shapes**

Run:
```bash
pnpm build >/dev/null 2>&1
grep -o 'href="/programme/20[0-9][0-9]"' dist/index.html | sort -u
```
Expected (production): only `/programme/2026`, and no archive entry.

Run:
```bash
FLAG_OVERRIDES=programme=on pnpm build >/dev/null 2>&1
grep -o 'href="/programme/20[0-9][0-9]"' dist/index.html | sort -u
grep -c "Programme 2026" dist/index.html
```
Expected (staging): both `/programme/2027` and `/programme/2026`, with "Programme 2026" present as the archive label. Record both outputs.

- [ ] **Step 8: Confirm 2026 still renders in full**

Run: `grep -c "session-card" dist/programme/2026/index.html`
Expected: a non-zero card count, identical to the count before this task — record both
numbers. This task must not change what `/programme/2026` renders, only how it is reached.

- [ ] **Step 9: Run the full suite**

Run: `pnpm test && pnpm exec astro check`
Expected: green, 0 errors.

- [ ] **Step 10: Commit**

```bash
git add src/lib/edition-visibility.ts src/components/Navigation.astro src/i18n/ui.ts \
        astro.config.mjs src/lib/__tests__/edition-visibility.test.ts \
        tests/build/nav-live-edition.test.ts
git commit -F - <<'MSG'
feat(nav): lead with the live edition, keep finished ones reachable

The Programme dropdown pointed at CURRENT_EDITION, which must stay pinned to
2026 — moving it forward re-opens the production gate. So "which programme is
live" gets its own derivation: the newest loadable edition. Production still
leads with 2026; staging, where the programme flag is forced on, leads with
2027 and keeps Programme 2026 one click away.

The bare /programme redirect follows the same value, so it no longer lands on
the archive when a newer programme is live.
MSG
```
