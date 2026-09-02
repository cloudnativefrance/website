# Edition 2027 — PR 1: gating + build-arg plumbing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a production build structurally incapable of publishing 2027 programme or speaker data, and give staging a build-time switch that turns it all on.

**Architecture:** One helper, `isEditionLoadable(year)`, answers both "may this edition's data be fetched" and "may this page be shown", so the two can never disagree. Every 2027-capable route consults it — in `getStaticPaths`, not just in the page body, because a gated page still publishes the speaker's name in its URL. A new `FLAG_OVERRIDES` build-arg lets the staging image build with `programme=on` while production keeps pure date logic.

**Tech Stack:** Astro 5 (static output), TypeScript, Vitest, Docker + GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-02-edition-2027-preview-design.md`

## Global Constraints

- **The invariant:** no talk title, room, time, speaker name or speaker slug for a `preview`-access edition may appear in a production build. Every decision defers to this.
- Bilingual: every FR route change has an identical EN mirror. FR lives at `/`, EN at `/en/`.
- Conventional commits (`feat:`, `fix:`, `chore:`, `ci:`). Commit messages and PR text in English.
- Flags resolve from `process.env` at **build** time. The artifact is a static nginx image; a runtime env var on the pod changes nothing.
- `CURRENT_EDITION` stays `2026` in this PR. Changing it to 2027 un-hides the programme (see spec D-5).
- Dates use ISO-8601 with explicit Europe/Paris offsets (`+02:00` summer, `+01:00` winter).
- `src/lib/flags.ts` and `src/lib/editions.ts` must stay dependency-free (importable from React islands). Anything needing `node:fs` goes in a new module.
- Tests: `pnpm test` (Vitest). Unit tests in `src/lib/__tests__/`, source-shape guards in `tests/build/`.

## Deviations from the spec

Two refinements made while planning. Both are noted for the reviewer.

1. **`FLAG_OVERRIDES` is parsed in TypeScript, not expanded in shell.** Spec D-6 said the Dockerfile expands it into individual `FLAG_<NAME>` variables before `pnpm run build`. Parsing it in `flags.ts` instead makes it a pure, unit-testable function and keeps override semantics in the module that already owns them, rather than in an untestable Dockerfile `RUN` string.
2. **Spec D-1 (the `PRETALX_EVENT` shape change) moves from PR 2 into this PR.** `isEditionLoadable` cannot express its `access === "preview"` branch without it, and the change is small — three consumers. PR 2 then adds only the 2027 entry and the preview loader.

**Deliberately left to PR 2:** the *data-layer* half of spec D-3 — `loadSessions` and `loadSpeakers` themselves consulting `isEditionLoadable`. In this PR 2027 has no `PRETALX_EVENT` entry, so both already resolve to the empty frozen archives and there is nothing to gate. The check lands in PR 2 alongside the entry that makes it necessary.

---

### Task 1: `FLAG_OVERRIDES` parsing

**Files:**
- Modify: `src/lib/flags.ts:56-63` (`readEnvOverride`)
- Test: `src/lib/__tests__/flags.test.ts`

**Interfaces:**
- Consumes: `FLAGS`, `FlagName` from `@/config/flags` (already imported).
- Produces: `parseFlagOverrides(raw: string): Map<FlagName, "on" | "off">` — throws `Error` on an unknown flag name, a value other than `on`/`off`, or a duplicate name. `readEnvOverride(name)` keeps its existing signature `(name: FlagName) => "on" | "off" | undefined`.

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/__tests__/flags.test.ts`:

```ts
import { parseFlagOverrides, readEnvOverride } from "@/lib/flags";

describe("parseFlagOverrides", () => {
  it("returns an empty map for an empty or whitespace string", () => {
    expect(parseFlagOverrides("").size).toBe(0);
    expect(parseFlagOverrides("   ").size).toBe(0);
  });

  it("parses a single override", () => {
    expect(parseFlagOverrides("programme=on")).toEqual(
      new Map([["programme", "on"]]),
    );
  });

  it("parses several and tolerates whitespace around tokens", () => {
    expect(parseFlagOverrides(" programme=on , tickets=off ")).toEqual(
      new Map([
        ["programme", "on"],
        ["tickets", "off"],
      ]),
    );
  });

  it("throws on an unknown flag name, naming the value", () => {
    expect(() => parseFlagOverrides("programe=on")).toThrow(/programe/);
  });

  it("throws on a value that is not on or off", () => {
    expect(() => parseFlagOverrides("programme=true")).toThrow(/true/);
  });

  it("throws on a malformed entry with no '='", () => {
    expect(() => parseFlagOverrides("programme")).toThrow(/programme/);
  });

  it("throws on a duplicated flag name rather than picking one", () => {
    expect(() => parseFlagOverrides("programme=on,programme=off")).toThrow(
      /programme/,
    );
  });
});

describe("readEnvOverride", () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it("returns undefined when neither source is set", () => {
    delete process.env.FLAG_PROGRAMME;
    delete process.env.FLAG_OVERRIDES;
    expect(readEnvOverride("programme")).toBeUndefined();
  });

  it("reads the individual FLAG_<NAME> variable", () => {
    process.env.FLAG_PROGRAMME = "on";
    expect(readEnvOverride("programme")).toBe("on");
  });

  it("reads FLAG_OVERRIDES when no individual variable is set", () => {
    delete process.env.FLAG_PROGRAMME;
    process.env.FLAG_OVERRIDES = "programme=on";
    expect(readEnvOverride("programme")).toBe("on");
  });

  it("lets the individual variable win over FLAG_OVERRIDES", () => {
    process.env.FLAG_PROGRAMME = "off";
    process.env.FLAG_OVERRIDES = "programme=on";
    expect(readEnvOverride("programme")).toBe("off");
  });

  it("returns undefined for a flag absent from a populated FLAG_OVERRIDES", () => {
    delete process.env.FLAG_TICKETS;
    process.env.FLAG_OVERRIDES = "programme=on";
    expect(readEnvOverride("tickets")).toBeUndefined();
  });
});
```

Add `afterEach` to the existing vitest import at the top of the file:

```ts
import { describe, it, expect, afterEach } from "vitest";
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test flags.test`
Expected: FAIL — `parseFlagOverrides` is not exported from `@/lib/flags`.

- [ ] **Step 3: Implement**

In `src/lib/flags.ts`, replace the existing `readEnvOverride` with:

```ts
/**
 * Parse a `FLAG_OVERRIDES` string into per-flag overrides.
 *
 * Format: `name=on,name2=off`. One build-arg carries every override, so adding
 * a flag needs no Dockerfile or workflow edit.
 *
 * Every malformed input throws rather than being skipped. A typo like
 * `programe=on` that silently did nothing would be indistinguishable from the
 * feature not working — and on the `programme` flag specifically, the symptom
 * of a swallowed typo is a staging site that looks correctly empty.
 */
export function parseFlagOverrides(raw: string): Map<FlagName, "on" | "off"> {
  const out = new Map<FlagName, "on" | "off">();
  for (const token of raw.split(",")) {
    const entry = token.trim();
    if (!entry) continue;
    const eq = entry.indexOf("=");
    if (eq === -1) {
      throw new Error(
        `[flags] FLAG_OVERRIDES entry "${entry}" is malformed — expected <name>=on|off`,
      );
    }
    const name = entry.slice(0, eq).trim();
    const value = entry.slice(eq + 1).trim();
    if (!(name in FLAGS)) {
      throw new Error(
        `[flags] FLAG_OVERRIDES names unknown flag "${name}". Known flags: ${Object.keys(FLAGS).join(", ")}`,
      );
    }
    if (value !== "on" && value !== "off") {
      throw new Error(
        `[flags] FLAG_OVERRIDES value for "${name}" is "${value}" — expected on or off`,
      );
    }
    if (out.has(name as FlagName)) {
      throw new Error(
        `[flags] FLAG_OVERRIDES sets "${name}" twice — remove the duplicate rather than relying on order`,
      );
    }
    out.set(name as FlagName, value);
  }
  return out;
}

/**
 * Read from node's `process.env` at build time — safe in server contexts,
 * returns undefined in client contexts where `process` is not defined.
 *
 * Astro 5's typed env vars declared with `context: "server"` are not
 * exposed via `import.meta.env`; they are only reachable through the
 * `astro:env/server` module (which requires static per-variable imports).
 * Reading `process.env` directly avoids that constraint and works for any
 * dynamically-derived key such as `FLAG_${name.toUpperCase()}`.
 *
 * Two sources, in precedence order:
 *
 *   1. `FLAG_<NAME>` — the documented local-development mechanism (`.env.local`).
 *   2. `FLAG_OVERRIDES` — the image-level build-arg used by CI.
 *
 * Individual variables win so that a developer's local override still beats
 * one inherited from a build configuration.
 */
export function readEnvOverride(name: FlagName): "on" | "off" | undefined {
  if (typeof process === "undefined") return undefined;

  const direct = process.env[`FLAG_${name.toUpperCase()}`];
  if (direct === "on") return "on";
  if (direct === "off") return "off";

  const bundle = process.env.FLAG_OVERRIDES;
  if (!bundle) return undefined;
  return parseFlagOverrides(bundle).get(name);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test flags.test`
Expected: PASS, including every pre-existing case in the file.

- [ ] **Step 5: Commit**

```bash
git add src/lib/flags.ts src/lib/__tests__/flags.test.ts
git commit -m "feat(flags): accept a FLAG_OVERRIDES bundle

One build-arg can now carry every flag override, so making a build differ
from production no longer needs a Dockerfile or workflow edit per flag.
Individual FLAG_<NAME> variables still win, keeping .env.local authoritative
for local development. Malformed entries throw: a swallowed typo is
indistinguishable from the feature not working."
```

---

### Task 2: Thread `FLAG_OVERRIDES` through the image build

**Files:**
- Modify: `Dockerfile` (after the `PUBLIC_SITE_URL` block, before the `RUN … pnpm run build`)
- Modify: `.github/workflows/build-image.yml:70-73` (`build-args`)
- Test: `tests/build/flag-overrides-plumbing.test.ts` (create)

**Interfaces:**
- Consumes: `parseFlagOverrides` / `readEnvOverride` from Task 1 (via the build reading `process.env.FLAG_OVERRIDES`).
- Produces: build-arg `FLAG_OVERRIDES`, empty by default. Staging builds pass `programme=on`.

- [ ] **Step 1: Write the failing test**

Create `tests/build/flag-overrides-plumbing.test.ts`:

```ts
/**
 * Guards the FLAG_OVERRIDES build-arg wiring.
 *
 * Source-shape guard rather than a build assertion, matching noindex-guard.test.ts
 * — running `docker build` per case is far too slow for CI.
 *
 * What this protects: this wiring is the ONLY thing that makes the staging image
 * differ from production. If the build-arg stops reaching `pnpm run build`, the
 * failure is silent and symmetrical — staging quietly stops showing the 2027
 * programme, which looks exactly like "the programme is not ready yet".
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DOCKERFILE = readFileSync(
  resolve(import.meta.dirname, "../../Dockerfile"),
  "utf-8",
);
const WORKFLOW = readFileSync(
  resolve(import.meta.dirname, "../../.github/workflows/build-image.yml"),
  "utf-8",
);

describe("Dockerfile FLAG_OVERRIDES", () => {
  it("declares the build-arg with an empty default", () => {
    expect(DOCKERFILE).toMatch(/^ARG FLAG_OVERRIDES=$/m);
  });

  it("promotes it to an ENV so the build step sees it", () => {
    expect(DOCKERFILE).toMatch(/^ENV FLAG_OVERRIDES=\$FLAG_OVERRIDES$/m);
  });

  it("sets the ENV before the build runs, not after", () => {
    const env = DOCKERFILE.indexOf("ENV FLAG_OVERRIDES=");
    const build = DOCKERFILE.indexOf("pnpm run build");
    expect(env).toBeGreaterThan(-1);
    expect(build).toBeGreaterThan(env);
  });

  it("declares it after pnpm install so the dependency layer stays cached", () => {
    const install = DOCKERFILE.indexOf("pnpm install --frozen-lockfile");
    expect(DOCKERFILE.indexOf("ARG FLAG_OVERRIDES=")).toBeGreaterThan(install);
  });
});

describe("build-image.yml FLAG_OVERRIDES", () => {
  it("passes the build-arg", () => {
    expect(WORKFLOW).toContain("FLAG_OVERRIDES=");
  });

  it("enables the programme flag only for the staging branch", () => {
    expect(WORKFLOW).toMatch(
      /FLAG_OVERRIDES=\$\{\{\s*github\.ref_name == 'staging' && 'programme=on' \|\| ''\s*\}\}/,
    );
  });

  it("keeps the token a secret rather than a build-arg", () => {
    // Regression guard: build-args land in image history, readable by anyone who
    // can pull the image. Adding FLAG_OVERRIDES next to PUBLIC_SITE_URL must not
    // tempt anyone to move the token there too.
    //
    // Scoped to the build-args block by indentation rather than by regexing the
    // whole file: `secrets: pretalx_token=` legitimately appears later on, so a
    // `[\s\S]*` scan would match it and the assertion could never pass.
    const lines = WORKFLOW.split("\n");
    const start = lines.findIndex((l) => l.trim().startsWith("build-args:"));
    expect(start).toBeGreaterThan(-1);
    const indent = lines[start].search(/\S/);
    const block: string[] = [];
    for (const line of lines.slice(start + 1)) {
      if (line.trim() && line.search(/\S/) <= indent) break;
      block.push(line);
    }
    expect(block.join("\n")).toContain("FLAG_OVERRIDES=");
    expect(block.join("\n")).not.toContain("pretalx_token");
    expect(WORKFLOW).toMatch(/secrets:\s*\|\s*\n\s*pretalx_token=/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test flag-overrides-plumbing`
Expected: FAIL — `ARG FLAG_OVERRIDES=` is not in the Dockerfile.

- [ ] **Step 3: Edit the Dockerfile**

Insert immediately after the existing `ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL` line:

```dockerfile
# Feature-flag overrides for this image, as `name=on,name2=off`.
#
# Flags resolve from process.env at BUILD time and the artifact is a static
# nginx image, so a Kubernetes-level env var on the running pod cannot change
# them — the override has to be present when the image is built. Empty by
# default so an argument-less `docker build` still produces the production
# site, driven purely by the dates in src/config/flags.ts.
#
# One bundle rather than one ARG per flag: adding a flag needs no edit here.
# An unknown name or a value other than on/off fails the build (src/lib/flags.ts).
ARG FLAG_OVERRIDES=
ENV FLAG_OVERRIDES=$FLAG_OVERRIDES
```

- [ ] **Step 4: Edit the workflow**

In `.github/workflows/build-image.yml`, extend the `build-args` block:

```yaml
          build-args: |
            PUBLIC_SITE_URL=${{ github.ref_name == 'staging' && 'https://staging.cloudnativedays.fr' || '' }}
            FLAG_OVERRIDES=${{ github.ref_name == 'staging' && 'programme=on' || '' }}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm test flag-overrides-plumbing`
Expected: PASS.

- [ ] **Step 6: Verify the override actually reaches a build**

Run: `FLAG_OVERRIDES=programme=on pnpm build 2>&1 | tail -20`
Expected: the build succeeds. Then confirm the flag was honoured:

Run: `grep -rl "schedule.filter" dist/programme/2027/index.html`
Expected: the file matches (the real grid rendered, not the Coming Soon layout). Without the override it will not match — check that too:

Run: `pnpm build >/dev/null 2>&1 && grep -c "flags.programme" dist/programme/2027/index.html || true`
Expected: the Coming Soon copy is present instead.

> Note: in this PR 2027 has no sessions, so "the real grid" is the empty-state
> section. The distinguishing marker is that it is NOT `ComingSoonLayout`.

- [ ] **Step 7: Commit**

```bash
git add Dockerfile .github/workflows/build-image.yml tests/build/flag-overrides-plumbing.test.ts
git commit -m "ci: thread FLAG_OVERRIDES into the image build

Closes the gap docs/feature-flags.md called out as an open decision: flag
overrides resolve at build time, so making staging differ from production
requires the value to be present when the image is built. Staging now builds
with programme=on; every other branch keeps pure date logic."
```

---

### Task 3: `PRETALX_EVENT` access + `isEditionLoadable`

**Files:**
- Modify: `src/lib/pretalx.ts:16-23` (`PRETALX_EVENT`)
- Modify: `src/lib/schedule.ts:72` (reads `PRETALX_EVENT[year]`)
- Modify: `src/lib/speaker-source.ts:90` (reads `PRETALX_EVENT[year]`)
- Modify: `scripts/sync-pretalx.ts:33-36` (iterates `PRETALX_EVENT`)
- Create: `src/lib/edition-visibility.ts`
- Test: `src/lib/__tests__/edition-visibility.test.ts` (create)

**Interfaces:**
- Consumes: `PRETALX_EVENT` (new shape), `CURRENT_EDITION`, `isFlagActive`.
- Produces:
  - `type EditionAccess = "public" | "preview"`
  - `PRETALX_EVENT: Partial<Record<Edition, { slug: string; access: EditionAccess }>>`
  - `resolveEditionLoadable(access: EditionAccess | undefined, year: Edition, currentEdition: Edition, flagActive: boolean): boolean` — pure
  - `isEditionLoadable(year: Edition, now?: Date): boolean` — the wrapper every consumer calls

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/edition-visibility.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { resolveEditionLoadable } from "@/lib/edition-visibility";

const CURRENT = 2026 as const;

describe("resolveEditionLoadable", () => {
  it("loads a past edition with no Pretalx event (2023)", () => {
    expect(resolveEditionLoadable(undefined, 2023, CURRENT, false)).toBe(true);
  });

  it("loads the current public edition regardless of the flag", () => {
    expect(resolveEditionLoadable("public", 2026, CURRENT, false)).toBe(true);
  });

  it("refuses a preview edition while the flag is inactive", () => {
    expect(resolveEditionLoadable("preview", 2027, CURRENT, false)).toBe(false);
  });

  it("loads a preview edition once the flag is active", () => {
    expect(resolveEditionLoadable("preview", 2027, CURRENT, true)).toBe(true);
  });

  it("refuses an unmapped future edition while the flag is inactive", () => {
    expect(resolveEditionLoadable(undefined, 2028, CURRENT, false)).toBe(false);
  });

  it("checks preview access BEFORE CURRENT_EDITION", () => {
    // The spec's D-5 trap: moving CURRENT_EDITION to 2027 must not un-hide a
    // preview edition. With currentEdition === 2027 the arithmetic branch
    // (year > currentEdition) would say "loadable"; access must win.
    expect(resolveEditionLoadable("preview", 2027, 2027, false)).toBe(false);
  });

  it("still gates a FUTURE public edition on the flag", () => {
    // `access` decides how the data is fetched; the flag decides when it is
    // published. Making the 2027 event public in Pretalx — which happens months
    // before the announcement, so the CFP can point at it — must not publish
    // the programme on the site.
    expect(resolveEditionLoadable("public", 2027, CURRENT, false)).toBe(false);
    expect(resolveEditionLoadable("public", 2027, CURRENT, true)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test edition-visibility`
Expected: FAIL — cannot resolve `@/lib/edition-visibility`.

- [ ] **Step 3: Create the module**

Create `src/lib/edition-visibility.ts`:

```ts
/**
 * May an edition's data be fetched, and may its pages be shown?
 *
 * One question, one answer, one function — used by the data layer
 * (`loadSessions`, `loadSpeakers`) and by every route gate. Splitting it in two
 * is how "the page is hidden but the data is published" happens.
 *
 * This lives here rather than in `editions.ts` because it needs `PRETALX_EVENT`,
 * which transitively pulls in `node:fs` via `remote-fetch.ts`. `editions.ts` is
 * dependency-free and safe to import from a React island; keeping it that way is
 * the point. No island imports it today, which is exactly why the trap would be
 * set silently.
 */
import { CURRENT_EDITION, type Edition } from "./editions";
import { isFlagActive } from "./flags";
import { PRETALX_EVENT, type EditionAccess } from "./pretalx";

/**
 * The rule, as a pure function of its four inputs, so the whole truth table is
 * testable without mocking a module registry or a clock.
 *
 * Order matters. `access === "preview"` is checked FIRST, before the
 * `year > currentEdition` arithmetic. Otherwise moving `CURRENT_EDITION` to
 * 2027 — an edit that looks like routine housekeeping at launch time — would
 * make the arithmetic branch return true and un-hide the entire unannounced
 * programme in production.
 */
export function resolveEditionLoadable(
  access: EditionAccess | undefined,
  // Plain numbers, not `Edition`: this is a year comparison, and the
  // "unmapped future edition" branch exists exactly for years that are not
  // yet in the `Edition` union. `isEditionLoadable` is the typed entry point.
  year: number,
  currentEdition: number,
  flagActive: boolean,
): boolean {
  if (access === "preview") return flagActive;
  // Everything else — a public event, or no Pretalx event at all (2023, or an
  // edition listed in EDITIONS before its event exists). A PAST edition always
  // renders; a FUTURE one waits for the flag even when its Pretalx event is
  // already public, because `access` decides how the data is fetched and the
  // flag decides when it is published. Making the event public in Pretalx must
  // not, by itself, publish the programme on the site.
  return year <= currentEdition || flagActive;
}

/** Whether `year`'s sessions and speakers may be loaded and rendered. */
export function isEditionLoadable(year: Edition, now?: Date): boolean {
  return resolveEditionLoadable(
    PRETALX_EVENT[year]?.access,
    year,
    CURRENT_EDITION,
    isFlagActive("programme", now),
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test edition-visibility`
Expected: PASS, all 7 cases.

- [ ] **Step 5: Change the `PRETALX_EVENT` shape**

In `src/lib/pretalx.ts`, replace the `PRETALX_EVENT` block:

```ts
/**
 * How an edition's Pretalx event may be read.
 *
 *   "public"  — the event's released schedule is served anonymously at
 *               /<slug>/schedule/export/schedule.json.
 *   "preview" — the event is not public. Its schedule is readable only through
 *               the authenticated REST API, and only in a build where the
 *               `programme` flag is active (see src/lib/edition-visibility.ts).
 *
 * This single word decides the fetch path, whether the edition may be loaded in
 * a production build at all, and which event /cfp links submitters to. Flipping
 * "preview" to "public" moves all three together.
 */
export type EditionAccess = "public" | "preview";

/**
 * Editions with a Pretalx event. 2023 predates the instance and reads a frozen
 * archive. 2027 is added here — as `preview` — once its event exists; until
 * then the fetch would 404 on every build, so it is deliberately absent rather
 * than mapped and failing.
 */
export const PRETALX_EVENT: Partial<
  Record<Edition, { slug: string; access: EditionAccess }>
> = {
  2026: { slug: "2026", access: "public" },
};
```

- [ ] **Step 6: Update the three consumers**

`src/lib/schedule.ts` — in `loadSessions`, replace `const slug = PRETALX_EVENT[year];` and its `if (slug)` guard:

```ts
  const event = PRETALX_EVENT[year];
  let rows: SessionRow[];
  if (event) {
    const doc = await fetchScheduleExport(year, event.slug);
```

…and the `loadLevelAnswers(year, slug, scheduled)` call becomes `loadLevelAnswers(year, event.slug, scheduled)`.

`src/lib/speaker-source.ts` — in `loadSpeakers`:

```ts
  const event = PRETALX_EVENT[year];
  if (!event) return loadArchivedSpeakers(year);

  const doc = await fetchScheduleExport(year, event.slug);
  const people = peopleInSchedule(doc);
  const enrichment = await loadSpeakerEnrichment(year, event.slug, new Set(people.keys()));
```

`scripts/sync-pretalx.ts` — the loop header:

```ts
for (const [yearStr, event] of Object.entries(PRETALX_EVENT)) {
  const year = Number(yearStr) as Edition;
  const url = scheduleExportUrl(event.slug);
```

(the `slug as string` cast on the old `scheduleExportUrl` call goes away).

- [ ] **Step 7: Verify nothing else reads the old shape**

Run: `grep -rn "PRETALX_EVENT" src scripts --include=*.ts`
Expected: only the definition plus the three consumers above. Then:

Run: `pnpm astro check 2>&1 | tail -20`
Expected: no new type errors.

- [ ] **Step 8: Run the full suite**

Run: `pnpm test`
Expected: PASS. `pretalx.test.ts` and `speakers.test.ts` exercise these paths; if either constructs a `PRETALX_EVENT`-shaped literal, update it to the new shape.

- [ ] **Step 9: Commit**

```bash
git add src/lib/pretalx.ts src/lib/schedule.ts src/lib/speaker-source.ts \
        scripts/sync-pretalx.ts src/lib/edition-visibility.ts \
        src/lib/__tests__/edition-visibility.test.ts
git commit -m "feat(editions): make edition visibility one explicit rule

PRETALX_EVENT entries now carry an access marker, and isEditionLoadable turns
it into the single answer to both 'may this be fetched' and 'may this be
shown' — the two questions drift apart otherwise, which is how a hidden page
ends up serving published data.

Preview access is checked before the year > CURRENT_EDITION arithmetic, so
moving CURRENT_EDITION forward at launch cannot un-hide an unannounced
edition."
```

---

### Task 4: Programme routes consult `isEditionLoadable`

**Files:**
- Modify: `src/pages/programme/[year].astro:8,42-46`
- Modify: `src/pages/en/programme/[year].astro:8,36-40`
- Test: `tests/build/edition-gating.test.ts` (create)

**Interfaces:**
- Consumes: `isEditionLoadable` from Task 3.
- Produces: nothing new. Removes the local `isUpcomingEdition` / `programmeReady` arithmetic.

- [ ] **Step 1: Write the failing test**

Create `tests/build/edition-gating.test.ts`:

```ts
/**
 * Guards the edition gate on every 2027-capable route.
 *
 * Source-shape guard: a full build per case is too slow, and the property being
 * guarded is structural — that each route asks isEditionLoadable, and that the
 * per-speaker routes ask it in getStaticPaths rather than only in the body.
 *
 * A gated page body is not enough for a [slug] route: it still emits one HTML
 * file per speaker, publishing the speaker's name in the URL, in dist/ and in
 * the sitemap. A "coming soon" body over a URL that names the person is a leak.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (rel: string) =>
  readFileSync(resolve(import.meta.dirname, "../../", rel), "utf-8");

const PROGRAMME_ROUTES = [
  "src/pages/programme/[year].astro",
  "src/pages/en/programme/[year].astro",
];

describe.each(PROGRAMME_ROUTES)("%s", (rel) => {
  const source = read(rel);

  it("imports isEditionLoadable", () => {
    expect(source).toContain("isEditionLoadable");
    expect(source).toContain("@/lib/edition-visibility");
  });

  it("derives readiness from it", () => {
    expect(source).toMatch(
      /const\s+programmeReady\s*=\s*isEditionLoadable\(\s*year\s*\)/,
    );
  });

  it("no longer gates on the year > CURRENT_EDITION arithmetic", () => {
    expect(source).not.toContain("isUpcomingEdition");
    expect(source).not.toMatch(/year\s*>\s*CURRENT_EDITION/);
  });

  it("does not load sessions for an edition it will not render", () => {
    expect(source).toMatch(/programmeReady\s*\?\s*await loadSessions\(year\)/);
  });

  it("still falls back to ComingSoonLayout", () => {
    expect(source).toContain('<ComingSoonLayout flag="programme"');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test edition-gating`
Expected: FAIL — the routes do not mention `isEditionLoadable`.

- [ ] **Step 3: Edit the FR programme route**

In `src/pages/programme/[year].astro`, add to the imports:

```ts
import { isEditionLoadable } from "@/lib/edition-visibility";
```

Replace the data-loading lines and the gate computation. The gate must be computed **before** the loads so a non-loadable edition is never fetched:

```ts
const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);

// One rule for "may this edition be fetched" and "may this page be shown", so
// the two cannot disagree. See src/lib/edition-visibility.ts.
const programmeReady = isEditionLoadable(year);

const sessions = programmeReady ? await loadSessions(year) : [];
const speakerEntries = programmeReady ? await getSpeakersByLocale(lang, year) : [];
```

Then delete these three lines further down:

```ts
const isUpcomingEdition = year > CURRENT_EDITION;
const programmeReady = !isUpcomingEdition || isFlagActive("programme");
```

…and the now-unused `isFlagActive` import. Keep the `CURRENT_EDITION` import — it is still used by the `Astro.redirect` and the `<ComingNotice>` condition.

- [ ] **Step 4: Mirror it in the EN route**

Apply the identical change to `src/pages/en/programme/[year].astro`. The only differences are the redirect path (`/en/programme/…`) and that its `speakerInfo` block has no comment; leave both as they are.

- [ ] **Step 5: Run the tests**

Run: `pnpm test edition-gating`
Expected: PASS.

Run: `pnpm astro check 2>&1 | tail -20`
Expected: no unused-import errors for `isFlagActive`.

- [ ] **Step 6: Commit**

```bash
git add src/pages/programme/\[year\].astro src/pages/en/programme/\[year\].astro \
        tests/build/edition-gating.test.ts
git commit -m "refactor(programme): gate on isEditionLoadable

Replaces the year > CURRENT_EDITION arithmetic with the shared rule, and skips
the session load entirely for an edition the page will not render."
```

---

### Task 5: Gate the speaker routes

**Files:**
- Modify: `src/pages/intervenants/[year]/index.astro`
- Modify: `src/pages/en/speakers/[year]/index.astro`
- Modify: `src/pages/intervenants/[year]/[slug].astro:13-27`
- Modify: `src/pages/en/speakers/[year]/[slug].astro:13-27`
- Modify: `src/pages/intervenants/[slug].astro:14-32`
- Modify: `src/pages/en/speakers/[slug].astro:14-31`
- Test: `tests/build/edition-gating.test.ts` (extend)

**Interfaces:**
- Consumes: `isEditionLoadable` from Task 3, `ComingSoonLayout` (`flag`, `lang` props).
- Produces: nothing new.

- [ ] **Step 1: Write the failing tests**

Append to `tests/build/edition-gating.test.ts`:

```ts
const SPEAKER_INDEX_ROUTES = [
  "src/pages/intervenants/[year]/index.astro",
  "src/pages/en/speakers/[year]/index.astro",
];

describe.each(SPEAKER_INDEX_ROUTES)("%s", (rel) => {
  const source = read(rel);

  it("imports isEditionLoadable and ComingSoonLayout", () => {
    expect(source).toContain("isEditionLoadable");
    expect(source).toContain("ComingSoonLayout");
  });

  it("renders ComingSoonLayout for a non-loadable edition", () => {
    expect(source).toContain('<ComingSoonLayout flag="programme"');
  });

  it("does not load speakers for an edition it will not render", () => {
    expect(source).toMatch(
      /speakersReady\s*\?\s*await getSpeakersByLocale\(lang,\s*year\)/,
    );
  });
});

const SPEAKER_DETAIL_ROUTES = [
  "src/pages/intervenants/[year]/[slug].astro",
  "src/pages/en/speakers/[year]/[slug].astro",
  "src/pages/intervenants/[slug].astro",
  "src/pages/en/speakers/[slug].astro",
];

describe.each(SPEAKER_DETAIL_ROUTES)("%s", (rel) => {
  const source = read(rel);

  it("filters editions in getStaticPaths, not only in the body", () => {
    const paths = source.slice(
      source.indexOf("getStaticPaths"),
      source.indexOf("---", source.indexOf("getStaticPaths")),
    );
    expect(paths).toContain("isEditionLoadable");
  });

  it("skips a non-loadable edition before enumerating its speakers", () => {
    expect(source).toMatch(/if\s*\(!isEditionLoadable\(year\)\)\s*continue;/);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test edition-gating`
Expected: FAIL on the six new route describes.

- [ ] **Step 3: Gate the two speaker index pages**

In `src/pages/intervenants/[year]/index.astro`, add the imports:

```ts
import ComingSoonLayout from "@/components/flags/ComingSoonLayout.astro";
import { isEditionLoadable } from "@/lib/edition-visibility";
```

Replace the speaker load with a gated one:

```ts
const speakersReady = isEditionLoadable(year);
const speakers = speakersReady ? await getSpeakersByLocale(lang, year) : [];
```

Wrap the existing `<Layout>…</Layout>` markup so the whole page becomes:

```astro
{speakersReady ? (
<Layout title={`${t("speakers.heading")} ${year} | ${t("site.title")}`}>
  ... existing markup unchanged ...
</Layout>
) : (
  <ComingSoonLayout flag="programme" lang={lang} />
)}
```

Apply the same change to `src/pages/en/speakers/[year]/index.astro`, which loads
one thing more than the FR page — gate that too:

```ts
const speakersReady = isEditionLoadable(year);
const speakers = speakersReady ? await getSpeakersByLocale(lang, year) : [];
const sessions: SessionRow[] = speakersReady ? await loadSessions(year) : [];
```

> The `programme` flag is reused rather than a new one being added: it is already
> `kind: "page"` with `flags.programme.soon.{title,body}` present in both locales,
> which `flags-registry.test.ts` keeps enforcing. A new flag would need new i18n
> copy and would let the speakers reveal drift out of step with the schedule.

- [ ] **Step 4: Filter the two per-year speaker detail routes**

In `src/pages/intervenants/[year]/[slug].astro`, add the import:

```ts
import { isEditionLoadable } from "@/lib/edition-visibility";
```

…and add one line inside the `getStaticPaths` loop:

```ts
  for (const year of EDITIONS) {
    if (!isEditionLoadable(year)) continue;
    const speakers = await getAllSpeakers(year);
```

Apply the identical change to `src/pages/en/speakers/[year]/[slug].astro`.

- [ ] **Step 5: Filter the two flat redirect shims**

In `src/pages/intervenants/[slug].astro`, add the same import and the same guard inside its `getStaticPaths` loop:

```ts
  for (const year of EDITIONS) {
    if (!isEditionLoadable(year)) continue;
    const speakers = await getAllSpeakers(year);
```

Extend the file's existing docstring with a sentence:

```
 * Editions that are not loadable are skipped: this route would otherwise emit
 * one redirect page per speaker slug, publishing an unannounced edition's
 * speaker names as URLs.
```

Apply the identical change to `src/pages/en/speakers/[slug].astro`.

- [ ] **Step 6: Run the tests**

Run: `pnpm test edition-gating`
Expected: PASS.

- [ ] **Step 7: Verify against a real build, both ways**

Run: `pnpm build >/dev/null 2>&1 && ls dist/intervenants/`
Expected: `2023/`, `2026/`, `2027/` plus per-slug directories — and `dist/intervenants/2027/` contains only `index.html`, no per-speaker directories.

Run: `FLAG_OVERRIDES=programme=on pnpm build >/dev/null 2>&1 && ls dist/intervenants/2027/`
Expected: identical for now (2027 has no speakers in this PR), which is the correct pre-PR-2 state. Record both outputs in the task notes.

- [ ] **Step 8: Commit**

```bash
git add src/pages/intervenants src/pages/en/speakers tests/build/edition-gating.test.ts
git commit -m "feat(speakers): gate speaker routes on edition visibility

The per-speaker routes filter in getStaticPaths rather than in the page body:
a gated body still emits one HTML file per speaker, publishing the name in the
URL, in dist/ and in the sitemap. The flat redirect shims enumerate every
edition, so they need the same filter.

Reuses the programme flag rather than adding one, so the speakers reveal
cannot drift out of step with the schedule."
```

---

### Task 6: Pin the ICS feed to a loadable edition

**Files:**
- Modify: `src/pages/programme.ics.ts`
- Test: `tests/build/edition-gating.test.ts` (extend)

**Interfaces:**
- Consumes: `isEditionLoadable`, `CURRENT_EDITION`.
- Produces: nothing new.

- [ ] **Step 1: Write the failing test**

Append to `tests/build/edition-gating.test.ts`:

```ts
describe("src/pages/programme.ics.ts", () => {
  const source = read("src/pages/programme.ics.ts");

  it("names the edition it serves instead of defaulting implicitly", () => {
    expect(source).toMatch(/loadSessions\(year\)/);
    expect(source).not.toMatch(/loadSessions\(\)/);
  });

  it("refuses to serve a non-loadable edition", () => {
    expect(source).toContain("isEditionLoadable");
    expect(source).toMatch(/throw new Error/);
  });

  it("derives the filename from that edition rather than hardcoding a year", () => {
    expect(source).toMatch(/cnd-france-\$\{year\}\.ics/);
    expect(source).not.toContain("cnd-france-2027.ics");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test edition-gating`
Expected: FAIL — the route calls `loadSessions()` and hardcodes `cnd-france-2027.ics`.

- [ ] **Step 3: Implement**

Replace `src/pages/programme.ics.ts` entirely:

```ts
import type { APIRoute } from "astro";
import { buildIcs, loadSessions } from "@/lib/schedule";
import { CURRENT_EDITION } from "@/lib/editions";
import { isEditionLoadable } from "@/lib/edition-visibility";

/**
 * The calendar feed serves one edition: the current one.
 *
 * It has no flag gate of its own — a static build cannot serve a 404, so there
 * is no "coming soon" state to fall back to. Instead it asserts that the
 * edition it serves may be published at all, and fails the build if not. That
 * turns a future edit ("point the feed at next year") from a silent leak of an
 * unannounced schedule into a red build.
 */
export const GET: APIRoute = async () => {
  const year = CURRENT_EDITION;
  if (!isEditionLoadable(year)) {
    throw new Error(
      `[programme.ics] refusing to serve edition ${year}: it is not publicly ` +
        `loadable. This feed has no coming-soon state — pin it to a public edition.`,
    );
  }

  const all = await loadSessions(year);
  const sessions = all.filter((s) => s.status !== "cancelled");
  return new Response(buildIcs(sessions), {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="cnd-france-${year}.ics"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
};
```

- [ ] **Step 4: Run the tests**

Run: `pnpm test edition-gating`
Expected: PASS.

- [ ] **Step 5: Verify the generated feed**

Run: `pnpm build >/dev/null 2>&1 && head -5 dist/programme.ics && grep -c BEGIN:VEVENT dist/programme.ics`
Expected: a valid VCALENDAR header and the 2026 session count (51 minus any cancelled).

- [ ] **Step 6: Commit**

```bash
git add src/pages/programme.ics.ts tests/build/edition-gating.test.ts
git commit -m "fix(ics): pin the calendar feed to a loadable edition

The feed relied on loadSessions()'s implicit CURRENT_EDITION default and
advertised a filename for a different year than the content. It now names the
edition it serves and fails the build rather than publishing one that is not
allowed to be public — a static build has no 404 to fall back on."
```

---

### Task 7: The prod-isolation guard

**Files:**
- Create: `tests/build/edition-2027-prod-isolation.test.ts`

**Interfaces:**
- Consumes: `resolveEditionLoadable` (Task 3), the route sources (Tasks 4–6).
- Produces: nothing. This is the invariant's regression test and the last gate before the PR.

- [ ] **Step 1: Write the test**

This one is written and expected to pass immediately — it asserts the property the previous six tasks built. Create `tests/build/edition-2027-prod-isolation.test.ts`:

```ts
/**
 * The invariant, as a test.
 *
 *   No fact about a preview-access edition — a talk title, a room, a time, a
 *   speaker name, a speaker slug in a URL — may appear in a production build.
 *
 * Enforced structurally rather than by inspecting rendered output: a production
 * build never fetches the data, so a template bug, a stray getStaticPaths entry
 * or a sitemap filter mistake cannot leak what was never loaded.
 *
 * If you are here because this test failed, do not relax it. It is the only
 * thing standing between an unannounced programme and cloudnativedays.fr.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolveEditionLoadable } from "@/lib/edition-visibility";

const read = (rel: string) =>
  readFileSync(resolve(import.meta.dirname, "../../", rel), "utf-8");

/** Every route that can reach a preview edition's sessions or speakers. */
const GUARDED_ROUTES = [
  "src/pages/programme/[year].astro",
  "src/pages/en/programme/[year].astro",
  "src/pages/intervenants/[year]/index.astro",
  "src/pages/en/speakers/[year]/index.astro",
  "src/pages/intervenants/[year]/[slug].astro",
  "src/pages/en/speakers/[year]/[slug].astro",
  "src/pages/intervenants/[slug].astro",
  "src/pages/en/speakers/[slug].astro",
  "src/pages/programme.ics.ts",
];

describe("preview editions are unreachable in a production build", () => {
  it("is not loadable with the programme flag inactive, whatever the year", () => {
    for (const year of [2026, 2027, 2028] as const) {
      for (const current of [2026, 2027] as const) {
        expect(resolveEditionLoadable("preview", year, current, false)).toBe(false);
      }
    }
  });

  it("becomes loadable only when the flag is active", () => {
    expect(resolveEditionLoadable("preview", 2027, 2026, true)).toBe(true);
  });

  it.each(GUARDED_ROUTES)("%s consults the shared rule", (rel) => {
    expect(read(rel)).toContain("isEditionLoadable");
  });

  it.each(GUARDED_ROUTES)("%s imports it from the one module", (rel) => {
    expect(read(rel)).toContain("@/lib/edition-visibility");
  });

  it("no route reimplements the rule with its own flag check", () => {
    for (const rel of GUARDED_ROUTES) {
      const source = read(rel);
      expect(source, `${rel} calls isFlagActive directly`).not.toContain(
        'isFlagActive("programme")',
      );
    }
  });
});

describe("the archives a production build falls back to stay empty", () => {
  it.each(["sessions", "speakers"])("%s-2027.json is an empty array", (kind) => {
    const raw = read(`src/content/schedule/${kind}-2027.json`);
    expect(JSON.parse(raw)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it**

Run: `pnpm test edition-2027-prod-isolation`
Expected: PASS. Any failure names the route that is missing its gate — fix the route, not the test.

- [ ] **Step 3: Run the whole suite**

Run: `pnpm test`
Expected: PASS, no regressions in the 15 unit suites or 25 build suites.

- [ ] **Step 4: Verify both builds end to end**

Run: `pnpm build 2>&1 | grep -E "\[speakers\]|\[sessions\]|\[remote\]"`
Expected: 2023 and 2026 load; nothing fetches 2027.

Run: `FLAG_OVERRIDES=programme=on pnpm build 2>&1 | grep -E "\[speakers\]|\[sessions\]"`
Expected: identical (2027 still has no Pretalx event in this PR) — plus `/programme/2027` now rendering the real empty state rather than Coming Soon.

- [ ] **Step 5: Confirm no 2027 speaker artifact exists in a production build**

Run: `pnpm build >/dev/null 2>&1 && find dist -path '*2027*' -name '*.html' | head -20`
Expected: only `dist/programme/2027/index.html`, `dist/intervenants/2027/index.html`, `dist/partenaires/2027/index.html` and their `/en/` mirrors — all Coming Soon or sponsor-pending pages, no per-speaker paths.

- [ ] **Step 6: Commit**

```bash
git add tests/build/edition-2027-prod-isolation.test.ts
git commit -m "test: guard the 2027 production-isolation invariant

Asserts that a preview-access edition is unloadable with the programme flag
inactive regardless of CURRENT_EDITION, that all nine reachable routes consult
the shared rule rather than reimplementing it, and that the archives a
production build falls back to are still empty."
```

---

## Definition of done

- [ ] `pnpm test` passes.
- [ ] `pnpm astro check` reports no new errors.
- [ ] `pnpm build` produces no 2027 speaker path in `dist/`.
- [ ] `FLAG_OVERRIDES=programme=on pnpm build` renders `/programme/2027` and `/intervenants/2027` as real pages.
- [ ] `FLAG_OVERRIDES=nonsense=on pnpm build` fails with a message naming `nonsense`.
- [ ] PR description states that this PR ships the gating with no 2027 data, and that PR 2 is blocked on the Pretalx 2027 event existing.
