# Feature Flags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a typed, date-windowed feature flag system that subsumes the ad-hoc CFP state machine in `src/lib/cfp.ts`, adds three new page-gated flags (`cfp`, `tickets`, `programme`) with bilingual "coming-soon" pages, one element-gated flag (`homepage_countdown`), env-var overrides for staging and emergency kill, and a daily GH Actions cron that auto-redeploys on state transitions.

**Architecture:** Typed registry in `src/config/flags.ts` is the single source of truth. Pure `getFlagState` evaluator in `src/lib/flags.ts` resolves state from registry + current time + env override. Page-kind flags use `<ComingSoonLayout>` in route files; element-kind flags use `<FeatureGate>` wrappers. Daily GH Actions cron runs a transition-detection script and triggers the existing `build-image.yml` workflow (via `workflow_call`) when any flag flips between runs.

**Tech Stack:** Astro 6 SSG, React 19 islands, TypeScript 6, Tailwind 4, Vitest. No SSR adapter. pnpm. Node 22. GitHub Actions + Flux CD (build triggers image push; Flux deploys to K8s).

---

## Pre-flight findings (surfaced during planning)

The spec's acceptance criteria mention `/cfp`, `/tickets`, and `/programme` routes. Reality check against the current codebase:

| Route | Status today | Plan |
|---|---|---|
| `/cfp` | Does NOT exist. CFP lives as a homepage section (`CfpSection.astro`) with its own internal 3-state UI. | **Create new `/cfp.astro` + `/en/cfp.astro`** that render `ComingSoonLayout` when pending/ended and a detailed CFP page when active. Homepage `CfpSection` stays as-is (migrated to the new flag API internally — it has its own 3-state inline rendering that differs visually from the standalone page treatment). |
| `/tickets` | Does NOT exist. Hero button links to the external `https://tickets.cloudnativedays.fr/`. | **Create new `/tickets.astro` + `/en/tickets.astro`.** Pending: `ComingSoonLayout` with Brevo CTA. Active: redirect (`Astro.redirect(TICKETING_URL, 302)`) to the external ticketing platform. Hero button behavior unchanged. |
| `/programme` | EXISTS. Renders the schedule index. | **Gate the existing file** — add `isFlagActive("programme")` at the top; render `ComingSoonLayout` when pending, keep the current content when active. Same for `/en/programme/`. |

**Nav integration:** `/cfp` and `/tickets` are new routes but adding them to `Navigation.astro` is **out of scope** for this plan — they're discoverable via the hero section and existing CTAs. If you want them in nav, that's a separate small PR.

**Stitch-first rule:** `<ComingSoonLayout>` is a new visual component. **Task 8 blocks on user approval of a Stitch mockup.** Do not implement `ComingSoonLayout.astro` until the mockup is validated. `<FeatureGate>` is a logic wrapper with zero visual output — no Stitch needed.

**CI deploy mechanism:** Confirmed during planning. The repo has a single workflow (`.github/workflows/build-image.yml`) that builds and pushes a Docker image on push to `main`. Deployment is handled by the `cnd-platform` repo via Flux CD (watches image tags and applies to K8s). The flag cron needs to trigger a new image build. **Approach:** add `workflow_call:` to `build-image.yml` (non-breaking — existing push/PR triggers continue to work) so `flag-cron.yml` can invoke it via `uses: ./.github/workflows/build-image.yml`.

---

## File structure

**New files:**

| Path | Responsibility |
|---|---|
| `src/config/flags.ts` | Typed registry (`FLAGS`) + `FlagDefinition` type + `FlagName` type. Single source of truth for flag dates. |
| `src/config/flags-env.ts` | `generateFlagEnvSchema()` — consumes `FLAGS` and emits Astro `envField.enum` entries for `astro.config.mjs`. |
| `src/lib/flags.ts` | Pure evaluator: `getFlagState`, `isFlagActive`, `FlagState` type, `resolveOverride` helper. |
| `src/components/flags/FeatureGate.astro` | Thin wrapper: renders slot when flag is active. |
| `src/components/flags/ComingSoonLayout.astro` | Shared page layout for pending/ended page-kind flags. i18n-driven copy, Brevo CTA, formatted `opens` date. |
| `src/pages/cfp.astro` | New FR route. Gated: pending → `ComingSoonLayout`; active → real CFP page content; ended → closed copy. |
| `src/pages/en/cfp.astro` | EN mirror. |
| `src/pages/tickets.astro` | New FR route. Pending → `ComingSoonLayout`; active → `Astro.redirect(TICKETING_URL, 302)`. |
| `src/pages/en/tickets.astro` | EN mirror. |
| `scripts/check-flag-transitions.ts` | CLI: exits with `should-rebuild=true\|false` after comparing `getFlagState(flag, -24h)` vs `getFlagState(flag, now)`. |
| `.github/workflows/flag-cron.yml` | Daily cron + `workflow_dispatch`; runs the transition script; invokes `build-image.yml` on transition. |
| `src/lib/__tests__/flags.test.ts` | Unit tests for `getFlagState` boundaries, env override resolution. |
| `src/lib/__tests__/flags-registry.test.ts` | Integrity checks: i18n completeness (page-kind only), `opens < closes`, env schema coverage. |
| `src/pages/__tests__/flag-routes.test.ts` | Smoke tests per gated route × state (snapshot or string-contains). |

**Files renamed:**

| From | To | Notes |
|---|---|---|
| `src/lib/cfp.ts` | `src/lib/event.ts` | Prune `getCfpState`, `CFP_OPENS`, `CFP_CLOSES`, `CfpState`. Add `NEWSLETTER_URL`. Keep `TARGET_DATE`, `isPostEvent`, `getReplaysPath`, `CONFERENCE_HALL_URL`. |
| `src/lib/__tests__/cfp.test.ts` | `src/lib/__tests__/event.test.ts` | Drop tests for removed exports. Keep `TARGET_DATE`, `getReplaysPath`, `isPostEvent`, `CONFERENCE_HALL_URL` tests. Add `NEWSLETTER_URL` test. |

**Files modified:**

| Path | Why |
|---|---|
| `astro.config.mjs` | Wire `env.schema` via `generateFlagEnvSchema()`. |
| `src/components/hero/HeroSection.astro` | Replace inline Brevo URL string with `NEWSLETTER_URL` import from `@/lib/event`. |
| `src/components/Navigation.astro` | Replace `import { TARGET_DATE } from "@/lib/cfp"` with `@/lib/event`. (No `getCfpState` call in nav currently — verified in planning.) |
| `src/components/cfp/CfpSection.astro` | Replace `getCfpState` with `getFlagState(FLAGS.cfp)`; map old state names (`"coming-soon" | "open" | "closed"` → `"pending" | "active" | "ended"`) in the JSX; repoint `cfp.cta.notify` button to `NEWSLETTER_URL`. |
| `src/pages/programme/index.astro` | Wrap with `isFlagActive("programme")` gate. |
| `src/pages/en/programme/index.astro` | Same. |
| `src/pages/index.astro` | Wrap `CountdownTimer` in `<FeatureGate flag="homepage_countdown">`. **Do NOT wrap `CfpSection`** — its internal 3-state UI already handles pending rendering on the homepage (shows "Bientôt ouvert" badge + coming-soon copy). Standalone `/cfp` route (Task 10) uses `ComingSoonLayout` instead. |
| `src/pages/en/index.astro` | Same. |
| `src/i18n/ui.ts` | Add `flags.*` namespace keys in both FR and EN blocks. |
| `.github/workflows/build-image.yml` | Add `workflow_call:` trigger so `flag-cron.yml` can invoke it. |
| `docs/feature-flags.md` | Final reconciliation: update any section where implementation deviates from the drafted guide. |

---

## Task decomposition

### Task 1: Create flag registry types and static data

**Files:**
- Create: `src/config/flags.ts`
- Test: `src/lib/__tests__/flags-registry.test.ts` (bootstrap — only the "registry exports expected shape" test for now; integrity tests land in Task 6)

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/flags-registry.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { FLAGS, type FlagDefinition, type FlagName } from "@/config/flags";

describe("flag registry", () => {
  it("exports FLAGS as a non-empty record", () => {
    expect(typeof FLAGS).toBe("object");
    expect(Object.keys(FLAGS).length).toBeGreaterThan(0);
  });

  it("includes the four spec-required flags", () => {
    const names = Object.keys(FLAGS) as FlagName[];
    expect(names).toContain("cfp");
    expect(names).toContain("tickets");
    expect(names).toContain("programme");
    expect(names).toContain("homepage_countdown");
  });

  it("every flag has a kind of 'page' or 'element'", () => {
    for (const [name, flag] of Object.entries(FLAGS)) {
      expect(["page", "element"]).toContain(flag.kind);
    }
  });

  it("date strings parse to valid dates", () => {
    for (const [name, flag] of Object.entries(FLAGS)) {
      if (flag.opens) {
        expect(new Date(flag.opens).toString()).not.toBe("Invalid Date");
      }
      if (flag.closes) {
        expect(new Date(flag.closes).toString()).not.toBe("Invalid Date");
      }
    }
  });

  it("when both opens and closes are set, opens < closes", () => {
    for (const [name, flag] of Object.entries(FLAGS)) {
      if (flag.opens && flag.closes) {
        expect(new Date(flag.opens).getTime()).toBeLessThan(
          new Date(flag.closes).getTime(),
        );
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/lib/__tests__/flags-registry.test.ts`
Expected: FAIL — "Cannot find module '@/config/flags'".

- [ ] **Step 3: Implement the registry**

Create `src/config/flags.ts`:

```ts
/**
 * Feature flag registry — single source of truth.
 *
 * Each entry describes a date-windowed flag with an optional opens/closes
 * boundary and a kind that determines how the flag is consumed:
 *
 *   - "page"    — gates an entire route. Must have matching i18n copy under
 *                 flags.<name>.soon.{title,body} in both FR and EN.
 *   - "element" — gates a single UI element via <FeatureGate>. No i18n required.
 *
 * Dates use ISO-8601 with explicit Europe/Paris offsets (+02:00 summer / +01:00 winter)
 * matching the convention used throughout the codebase.
 *
 * Omitting `opens` → active from the start.
 * Omitting `closes` → never closes.
 * Omitting both + no env override → always active.
 *
 * See docs/feature-flags.md for the operator's guide.
 */

export interface FlagDefinition {
  /** ISO-8601 timestamp with Europe/Paris offset. */
  opens?: string;
  /** ISO-8601 timestamp with Europe/Paris offset. */
  closes?: string;
  /** Drives consumer contract and i18n-completeness enforcement. */
  kind: "page" | "element";
}

export const FLAGS = {
  cfp: {
    opens: "2026-09-01T00:00:00+02:00",
    closes: "2027-02-28T23:59:59+01:00",
    kind: "page",
  },
  tickets: {
    opens: "2027-01-15T00:00:00+01:00",
    kind: "page",
  },
  programme: {
    opens: "2027-04-01T09:00:00+02:00",
    kind: "page",
  },
  homepage_countdown: {
    opens: "2026-07-01T00:00:00+02:00",
    kind: "element",
  },
} as const satisfies Record<string, FlagDefinition>;

export type FlagName = keyof typeof FLAGS;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/lib/__tests__/flags-registry.test.ts`
Expected: PASS (5 assertions).

- [ ] **Step 5: Commit**

```bash
git add src/config/flags.ts src/lib/__tests__/flags-registry.test.ts
git commit -m "feat(flags): add typed flag registry with cfp/tickets/programme/homepage_countdown"
```

---

### Task 2: State machine evaluator (`getFlagState`)

**Files:**
- Create: `src/lib/flags.ts`
- Test: `src/lib/__tests__/flags.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/flags.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getFlagState, type FlagState } from "@/lib/flags";
import type { FlagDefinition } from "@/config/flags";

const pageFlag = (opens?: string, closes?: string): FlagDefinition => ({
  kind: "page",
  opens,
  closes,
});

describe("getFlagState", () => {
  const OPENS = "2026-09-01T00:00:00+02:00";
  const CLOSES = "2027-02-28T23:59:59+01:00";
  const opensDate = new Date(OPENS);
  const closesDate = new Date(CLOSES);

  it("returns 'pending' strictly before opens", () => {
    const before = new Date(opensDate.getTime() - 1000);
    expect(getFlagState(pageFlag(OPENS, CLOSES), before)).toBe("pending");
  });

  it("returns 'active' at opens (inclusive lower bound)", () => {
    expect(getFlagState(pageFlag(OPENS, CLOSES), opensDate)).toBe("active");
  });

  it("returns 'active' mid-window", () => {
    const mid = new Date((opensDate.getTime() + closesDate.getTime()) / 2);
    expect(getFlagState(pageFlag(OPENS, CLOSES), mid)).toBe("active");
  });

  it("returns 'active' at closes (inclusive upper bound)", () => {
    expect(getFlagState(pageFlag(OPENS, CLOSES), closesDate)).toBe("active");
  });

  it("returns 'ended' strictly after closes", () => {
    const after = new Date(closesDate.getTime() + 1000);
    expect(getFlagState(pageFlag(OPENS, CLOSES), after)).toBe("ended");
  });

  it("returns 'active' forever when closes is missing and now >= opens", () => {
    const farFuture = new Date("2099-01-01T00:00:00Z");
    expect(getFlagState(pageFlag(OPENS), farFuture)).toBe("active");
  });

  it("returns 'active' always when opens and closes are both missing", () => {
    const anyDate = new Date("1999-01-01T00:00:00Z");
    expect(getFlagState(pageFlag(), anyDate)).toBe("active");
  });

  it("returns 'pending' when opens is missing but closes is set and now is before closes... wait that makes no sense — skip", () => {
    // No opens means always-started; so state is decided by closes only.
    const flagWithOnlyCloses = pageFlag(undefined, CLOSES);
    const before = new Date("2026-01-01T00:00:00Z");
    expect(getFlagState(flagWithOnlyCloses, before)).toBe("active");
    const after = new Date(closesDate.getTime() + 1000);
    expect(getFlagState(flagWithOnlyCloses, after)).toBe("ended");
  });

  describe("override resolution", () => {
    it("returns 'active' when override is 'on' regardless of pending dates", () => {
      const farFuture = pageFlag("2099-01-01T00:00:00Z");
      const now = new Date("2026-01-01T00:00:00Z");
      expect(getFlagState(farFuture, now, "on")).toBe("active");
    });

    it("returns 'ended' when override is 'off' regardless of active dates", () => {
      const active = pageFlag(OPENS, CLOSES);
      expect(getFlagState(active, opensDate, "off")).toBe("ended");
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/lib/__tests__/flags.test.ts`
Expected: FAIL — "Cannot find module '@/lib/flags'".

- [ ] **Step 3: Implement the evaluator**

Create `src/lib/flags.ts`:

```ts
/**
 * Pure, dependency-free flag state evaluator.
 *
 * Safe to import from both server (.astro) and client (.tsx) contexts — does
 * not pull in any other module beyond the typed registry.
 *
 * State machine:
 *   pending  —  now < opens
 *   active   —  opens <= now <= closes   (bounds inclusive)
 *   ended    —  now > closes
 *
 * Missing opens is treated as -Infinity; missing closes as +Infinity.
 *
 * Override semantics ("on" -> active, "off" -> ended) short-circuit the date
 * logic. This is how env vars (FLAG_<NAME>=on|off) force state at build time.
 */

import { FLAGS, type FlagDefinition, type FlagName } from "@/config/flags";

export type FlagState = "pending" | "active" | "ended";

export function getFlagState(
  flag: FlagDefinition,
  now: Date = new Date(),
  override?: "on" | "off",
): FlagState {
  if (override === "on") return "active";
  if (override === "off") return "ended";

  const t = now.getTime();
  const opens = flag.opens ? new Date(flag.opens).getTime() : Number.NEGATIVE_INFINITY;
  const closes = flag.closes ? new Date(flag.closes).getTime() : Number.POSITIVE_INFINITY;

  if (t < opens) return "pending";
  if (t <= closes) return "active";
  return "ended";
}

/**
 * Convenience: resolve a flag by name, apply the env override automatically,
 * and return `true` when the flag is `active`.
 *
 * This is the 90% call site. Page and component consumers use this; tests
 * and the transition-detection script call `getFlagState` directly.
 */
export function isFlagActive(name: FlagName, now: Date = new Date()): boolean {
  const flag = FLAGS[name];
  const override = readEnvOverride(name);
  return getFlagState(flag, now, override) === "active";
}

/**
 * Read `FLAG_<NAME_UPPERCASE>` from the build-time environment.
 * Returns `"on"` or `"off"` when the value is exactly those strings; otherwise `undefined`.
 *
 * Astro's Vite-powered env substitution inlines `import.meta.env.FLAG_*` at
 * build time; the values come from the `env.schema` block in astro.config.mjs
 * (generated by src/config/flags-env.ts).
 */
export function readEnvOverride(name: FlagName): "on" | "off" | undefined {
  const key = `FLAG_${name.toUpperCase()}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (import.meta.env as any)[key];
  if (raw === "on") return "on";
  if (raw === "off") return "off";
  return undefined;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/lib/__tests__/flags.test.ts`
Expected: PASS (9 assertions).

- [ ] **Step 5: Commit**

```bash
git add src/lib/flags.ts src/lib/__tests__/flags.test.ts
git commit -m "feat(flags): add getFlagState evaluator + isFlagActive + env override resolution"
```

---

### Task 3: Env schema generator + astro.config.mjs wiring

**Files:**
- Create: `src/config/flags-env.ts`
- Modify: `astro.config.mjs`

- [ ] **Step 1: Write the failing test**

Append to `src/lib/__tests__/flags-registry.test.ts`:

```ts
import { generateFlagEnvSchema } from "@/config/flags-env";

describe("generateFlagEnvSchema", () => {
  it("emits one entry per flag in FLAGS", () => {
    const schema = generateFlagEnvSchema();
    for (const name of Object.keys(FLAGS)) {
      const key = `FLAG_${name.toUpperCase()}`;
      expect(schema[key]).toBeDefined();
    }
  });

  it("every entry has context 'server' and access 'public'", () => {
    const schema = generateFlagEnvSchema();
    for (const key of Object.keys(schema)) {
      expect(schema[key].context).toBe("server");
      expect(schema[key].access).toBe("public");
    }
  });

  it("every entry allows values 'on', 'off', and empty string", () => {
    const schema = generateFlagEnvSchema();
    for (const key of Object.keys(schema)) {
      expect(schema[key].values).toContain("on");
      expect(schema[key].values).toContain("off");
      expect(schema[key].values).toContain("");
    }
  });

  it("every entry is optional with empty-string default", () => {
    const schema = generateFlagEnvSchema();
    for (const key of Object.keys(schema)) {
      expect(schema[key].optional).toBe(true);
      expect(schema[key].default).toBe("");
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/lib/__tests__/flags-registry.test.ts`
Expected: FAIL — "Cannot find module '@/config/flags-env'".

- [ ] **Step 3: Implement the generator**

Create `src/config/flags-env.ts`:

```ts
/**
 * Generates the `env.schema` block for astro.config.mjs from the flag registry.
 *
 * Consumed only at build time. The output is spread into the Astro config's
 * env.schema field so that adding a flag automatically surfaces a typed
 * FLAG_<NAME> env var without hand-editing astro.config.mjs.
 *
 * NOTE: This module intentionally returns plain objects (not envField() calls)
 * because astro.config.mjs wraps them. Astro's `envField.enum` type is not
 * exported in a shape that's easily parameterised — the Astro config can call
 * envField.enum(schema[key]) itself. This keeps this module testable without
 * pulling in `astro/config` (which is slow and pulls Vite into the test env).
 */

import { FLAGS } from "@/config/flags";

export interface FlagEnvEntry {
  context: "server";
  access: "public";
  values: readonly ["on", "off", ""];
  optional: true;
  default: "";
}

export function generateFlagEnvSchema(): Record<string, FlagEnvEntry> {
  const schema: Record<string, FlagEnvEntry> = {};
  for (const name of Object.keys(FLAGS)) {
    const key = `FLAG_${name.toUpperCase()}`;
    schema[key] = {
      context: "server",
      access: "public",
      values: ["on", "off", ""] as const,
      optional: true,
      default: "",
    };
  }
  return schema;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/lib/__tests__/flags-registry.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire into astro.config.mjs**

Read current `astro.config.mjs` first to understand existing structure. Then modify it:

```js
// astro.config.mjs
import { defineConfig, envField } from "astro/config";
import { generateFlagEnvSchema } from "./src/config/flags-env.ts";

// ... existing imports and integrations ...

const flagSchema = generateFlagEnvSchema();
const flagEnvFields = Object.fromEntries(
  Object.entries(flagSchema).map(([key, entry]) => [key, envField.enum(entry)]),
);

export default defineConfig({
  // ... existing config ...
  env: {
    schema: {
      ...flagEnvFields,
    },
  },
});
```

If `env.schema` already exists in the config, merge `flagEnvFields` into it rather than overwriting.

- [ ] **Step 6: Verify Astro picks up the schema**

Run: `pnpm astro sync`
Expected: exits 0, generates `.astro/env.d.ts` containing `FLAG_CFP`, `FLAG_TICKETS`, etc.

Run: `pnpm tsc --noEmit`
Expected: exits 0 — no type errors.

- [ ] **Step 7: Commit**

```bash
git add src/config/flags-env.ts src/lib/__tests__/flags-registry.test.ts astro.config.mjs
git commit -m "feat(flags): generate astro env schema from registry for FLAG_* overrides"
```

---

### Task 4: Add i18n keys for page-kind flags

**Files:**
- Modify: `src/i18n/ui.ts`
- Test: extend `src/lib/__tests__/flags-registry.test.ts`

- [ ] **Step 1: Write the failing integrity test**

Append to `src/lib/__tests__/flags-registry.test.ts`:

```ts
import { ui } from "@/i18n/ui";

describe("i18n completeness (page-kind flags)", () => {
  const LOCALES = ["fr", "en"] as const;

  it("every page-kind flag has matching soon.title and soon.body in every locale", () => {
    for (const [name, flag] of Object.entries(FLAGS)) {
      if (flag.kind !== "page") continue;
      for (const locale of LOCALES) {
        const titleKey = `flags.${name}.soon.title`;
        const bodyKey = `flags.${name}.soon.body`;
        expect(
          ui[locale][titleKey],
          `Missing ${titleKey} in locale ${locale}`,
        ).toBeTruthy();
        expect(
          ui[locale][bodyKey],
          `Missing ${bodyKey} in locale ${locale}`,
        ).toBeTruthy();
      }
    }
  });

  it("shared coming-soon chrome keys exist in every locale", () => {
    for (const locale of LOCALES) {
      expect(ui[locale]["flags.soon.notify_cta"]).toBeTruthy();
      expect(ui[locale]["flags.soon.opens_on"]).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/lib/__tests__/flags-registry.test.ts`
Expected: FAIL — missing `flags.*` keys in `ui.fr` and `ui.en`.

- [ ] **Step 3: Add keys to `src/i18n/ui.ts`**

Locate the FR block (around line 31 per grep) and add these keys at the end of the block before the closing brace:

```ts
// --- Feature flags (coming-soon layout) ---
"flags.soon.notify_cta":     "Être prévenu·e",
"flags.soon.opens_on":       "Ouverture le {date}",

"flags.cfp.soon.title":       "L'appel à propositions arrive",
"flags.cfp.soon.body":        "Inscrivez-vous à la newsletter pour être alerté·e dès l'ouverture.",

"flags.tickets.soon.title":   "La billetterie arrive",
"flags.tickets.soon.body":    "Les inscriptions ouvrent le 15 janvier 2027.",

"flags.programme.soon.title": "Le programme arrive",
"flags.programme.soon.body":  "Le programme complet sera dévoilé en avril 2027.",
```

Locate the EN block (around line 334) and add the symmetric keys:

```ts
// --- Feature flags (coming-soon layout) ---
"flags.soon.notify_cta":     "Notify me",
"flags.soon.opens_on":       "Opens on {date}",

"flags.cfp.soon.title":       "The Call for Proposals is coming",
"flags.cfp.soon.body":        "Subscribe to the newsletter and we'll let you know as soon as it opens.",

"flags.tickets.soon.title":   "Ticketing is coming",
"flags.tickets.soon.body":    "Registration opens on 15 January 2027.",

"flags.programme.soon.title": "The programme is coming",
"flags.programme.soon.body":  "The full programme will be unveiled in April 2027.",
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/lib/__tests__/flags-registry.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/ui.ts src/lib/__tests__/flags-registry.test.ts
git commit -m "feat(flags): add FR/EN i18n copy for cfp/tickets/programme coming-soon pages"
```

---

### Task 5: Atomic CFP → event.ts migration

**This task is intentionally large** because it must be atomic — renaming `cfp.ts` without updating its three consumers would break the build. Follow the steps in order; commit only at the end.

**Files:**
- Rename: `src/lib/cfp.ts` → `src/lib/event.ts`
- Rename: `src/lib/__tests__/cfp.test.ts` → `src/lib/__tests__/event.test.ts`
- Modify: `src/lib/event.ts` (prune deletions, add `NEWSLETTER_URL`)
- Modify: `src/lib/__tests__/event.test.ts` (drop tests for removed exports, add `NEWSLETTER_URL` test)
- Modify: `src/components/hero/HeroSection.astro` (swap inline URL for import)
- Modify: `src/components/Navigation.astro` (update import path)
- Modify: `src/components/cfp/CfpSection.astro` (swap `getCfpState` for `getFlagState(FLAGS.cfp)`, update state-name mapping, repoint `cfp.cta.notify`)

- [ ] **Step 1: Rename the file (git-aware)**

```bash
git mv src/lib/cfp.ts src/lib/event.ts
git mv src/lib/__tests__/cfp.test.ts src/lib/__tests__/event.test.ts
```

- [ ] **Step 2: Edit `src/lib/event.ts` — prune removed exports, add `NEWSLETTER_URL`**

Replace the file's contents with:

```ts
/**
 * Event-lifecycle constants + helpers.
 *
 * Formerly cfp.ts; renamed when the ad-hoc CFP state machine was subsumed by
 * the feature flag system (src/lib/flags.ts, src/config/flags.ts). This file
 * now holds only the event anchor (TARGET_DATE, isPostEvent), outbound URLs,
 * and locale-aware path helpers. CFP date logic lives in FLAGS.cfp.
 */

/**
 * Epoch ms for 2027-06-03T09:00:00+02:00 (Cloud Native Days France 2027 start).
 *
 * MUST match src/components/hero/CountdownTimer.tsx so the countdown and
 * post-event flip share a single temporal anchor.
 */
export const TARGET_DATE = new Date("2027-06-03T09:00:00+02:00").getTime();

export const CONFERENCE_HALL_URL =
  "https://conference-hall.io/public/event/TODO_EVENT_ID";

/**
 * Hosted Brevo newsletter signup form.
 *
 * Used by the hero's "Restez informé" button and by <ComingSoonLayout>'s
 * "Notify me" CTA. Extracted from an inline string in HeroSection.astro
 * when the feature flag system landed.
 */
export const NEWSLETTER_URL =
  "https://d820b57b.sibforms.com/serve/MUIFAMhQae0KzNYxFvx6QSRhBI9sMf8V95ghzeac7poMILWncQNi6r_1yx56s6zfRIyfhiGqhx24CmxsMTthOrreePBCipj7yL0_QdwgtcZxfkzzebIQKjwCga2lb7IOvyDV9qZBzHh-wJVW5k8zHIKorqxmkJDZ3-wxP_jPo7z-0nQBCgoiXjTLPwEAMI52iPoy5OLEibdt3bnF";

/**
 * Return the locale-aware path to the /replays page.
 *
 * Kept dependency-free (no import from @/i18n/utils) so this module stays
 * loadable from both server (.astro) and client (.tsx) contexts without
 * pulling the full i18n dictionary into client bundles.
 */
export function getReplaysPath(lang: "fr" | "en"): string {
  return lang === "fr" ? "/replays" : "/en/replays";
}

/**
 * Whether the event has already happened (used to flip CTAs to "Watch replays").
 */
export function isPostEvent(now: Date = new Date()): boolean {
  return now.getTime() > TARGET_DATE;
}
```

- [ ] **Step 3: Edit `src/lib/__tests__/event.test.ts` — drop removed-export tests, add `NEWSLETTER_URL` test**

Replace the file's contents with:

```ts
/**
 * Unit tests for src/lib/event.ts (formerly cfp.ts).
 *
 * Covers: TARGET_DATE, CONFERENCE_HALL_URL, NEWSLETTER_URL, getReplaysPath, isPostEvent.
 * CFP state logic is tested in src/lib/__tests__/flags.test.ts against getFlagState(FLAGS.cfp).
 */

import { describe, it, expect } from "vitest";
import {
  TARGET_DATE,
  CONFERENCE_HALL_URL,
  NEWSLETTER_URL,
  getReplaysPath,
  isPostEvent,
} from "@/lib/event";

describe("TARGET_DATE", () => {
  it("matches the CountdownTimer constant exactly (2027-06-03T09:00:00+02:00)", () => {
    expect(TARGET_DATE).toBe(
      new Date("2027-06-03T09:00:00+02:00").getTime(),
    );
  });
});

describe("outbound URLs", () => {
  it("CONFERENCE_HALL_URL is a string starting with https://", () => {
    expect(typeof CONFERENCE_HALL_URL).toBe("string");
    expect(CONFERENCE_HALL_URL.startsWith("https://")).toBe(true);
  });

  it("NEWSLETTER_URL is a string starting with https://", () => {
    expect(typeof NEWSLETTER_URL).toBe("string");
    expect(NEWSLETTER_URL.startsWith("https://")).toBe(true);
  });
});

describe("getReplaysPath", () => {
  it("returns /replays for the default (fr) locale", () => {
    expect(getReplaysPath("fr")).toBe("/replays");
  });

  it("returns /en/replays for the en locale", () => {
    expect(getReplaysPath("en")).toBe("/en/replays");
  });
});

describe("isPostEvent", () => {
  it("returns false for dates before TARGET_DATE", () => {
    expect(isPostEvent(new Date("2026-01-01T00:00:00Z"))).toBe(false);
  });

  it("returns true for dates after TARGET_DATE", () => {
    expect(isPostEvent(new Date("2027-06-04T00:00:00Z"))).toBe(true);
  });

  it("defaults to the current Date when called with no argument", () => {
    expect(typeof isPostEvent()).toBe("boolean");
  });
});
```

- [ ] **Step 4: Update `src/components/hero/HeroSection.astro`**

Find the inline Brevo URL at line 94 (`href="https://d820b57b.sibforms.com/..."`) and the existing import block (lines 1-9). Apply the edit:

Add the import:
```astro
import { NEWSLETTER_URL } from "@/lib/event";
```

Replace the inline URL in the href:
```astro
<a
  href={NEWSLETTER_URL}
  target="_blank"
  rel="noopener noreferrer"
  ...
```

- [ ] **Step 5: Update `src/components/Navigation.astro`**

Change line 3:
```astro
// Before:
import { TARGET_DATE } from "@/lib/cfp";
// After:
import { TARGET_DATE } from "@/lib/event";
```

- [ ] **Step 6: Update `src/components/cfp/CfpSection.astro`**

Replace the import and state resolution (lines 1-11):

```astro
---
import { getLangFromUrl, useTranslations } from "@/i18n/utils";
import { CONFERENCE_HALL_URL, NEWSLETTER_URL } from "@/lib/event";
import { FLAGS } from "@/config/flags";
import { getFlagState } from "@/lib/flags";

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
const state = getFlagState(FLAGS.cfp);
const CFP_CLOSES = new Date(FLAGS.cfp.closes!);
const localeTag = lang === "fr" ? "fr-FR" : "en-US";
const deadline = new Intl.DateTimeFormat(localeTag, {
  year: "numeric",
  month: "long",
  day: "numeric",
}).format(CFP_CLOSES);
const deadlineLine = t("cfp.deadline").replace("{date}", deadline);
const hasRealConferenceHall = !CONFERENCE_HALL_URL.includes("TODO_EVENT_ID");
const ariaOpen = `${t("cfp.status.open")} — ${t("cfp.description.open")}`;
const ariaComing = `${t("cfp.status.coming_soon")} — ${t("cfp.description.coming_soon")}`;
---
```

Then update the three state comparisons in the JSX below:
- `{state === "open" && (` → `{state === "active" && (`
- `{state === "coming-soon" && (` → `{state === "pending" && (`
- `{state === "closed" && (` → `{state === "ended" && (`

Repoint the `cfp.cta.notify` button (around line 119) — change `href={CONFERENCE_HALL_URL}` to `href={NEWSLETTER_URL}`:

```astro
{hasRealConferenceHall && (
  <a
    href={NEWSLETTER_URL}
    target="_blank"
    rel="noopener noreferrer"
    class="..."
  >
    {t("cfp.cta.notify")}
  </a>
)}
```

(The `hasRealConferenceHall` gate still controls *visibility* of the section as a whole — we just repoint the notify button to the newsletter.)

- [ ] **Step 7: Run the full test suite**

Run: `pnpm test`
Expected: all tests pass. `flags.test.ts`, `flags-registry.test.ts`, and `event.test.ts` all green.

- [ ] **Step 8: Run `astro sync` and type-check**

Run: `pnpm astro sync && pnpm tsc --noEmit`
Expected: exits 0.

- [ ] **Step 9: Commit**

```bash
git add src/lib/event.ts src/lib/__tests__/event.test.ts \
        src/components/hero/HeroSection.astro \
        src/components/Navigation.astro \
        src/components/cfp/CfpSection.astro
git commit -m "refactor(flags): rename cfp.ts to event.ts and migrate CfpSection to flag API

Atomic migration: CFP_OPENS/CFP_CLOSES/getCfpState/CfpState removed from
event.ts (formerly cfp.ts). CfpSection now reads state from FLAGS.cfp via
getFlagState. State vocabulary migrated: coming-soon/open/closed -> pending/active/ended.

- Extract NEWSLETTER_URL from inline string in HeroSection.astro
- Repoint cfp.cta.notify button to NEWSLETTER_URL (was pointing at
  CONFERENCE_HALL_URL, the submission platform, which was incorrect)
- Update Navigation.astro import path for TARGET_DATE"
```

---

### Task 6: `<FeatureGate>` component

**Files:**
- Create: `src/components/flags/FeatureGate.astro`

- [ ] **Step 1: Write the implementation**

FeatureGate has no props validation worth unit-testing beyond the route-integration tests (Task 13). Implement directly:

Create `src/components/flags/FeatureGate.astro`:

```astro
---
/**
 * Conditional render wrapper driven by a feature flag.
 *
 * Usage:
 *   <FeatureGate flag="homepage_countdown">
 *     <CountdownTimer client:idle />
 *   </FeatureGate>
 *
 * Renders the slot only when `isFlagActive(flag)` returns true. Resolves
 * the flag at build time via the registry + any FLAG_<NAME> env override.
 */
import { isFlagActive } from "@/lib/flags";
import type { FlagName } from "@/config/flags";

interface Props {
  flag: FlagName;
}

const { flag } = Astro.props;
const show = isFlagActive(flag);
---

{show && <slot />}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/flags/FeatureGate.astro
git commit -m "feat(flags): add FeatureGate wrapper for element-kind flags"
```

---

### Task 7: Gate homepage CountdownTimer behind `homepage_countdown`

**Files:**
- Modify: `src/components/hero/HeroSection.astro`

- [ ] **Step 1: Wrap CountdownTimer**

Open `src/components/hero/HeroSection.astro`. Locate the `<CountdownTimer client:idle ... />` usage. Import `FeatureGate` and wrap:

Add to the imports:
```astro
import FeatureGate from "@/components/flags/FeatureGate.astro";
```

Wrap the CountdownTimer usage:
```astro
<FeatureGate flag="homepage_countdown">
  <CountdownTimer client:idle />
</FeatureGate>
```

- [ ] **Step 2: Verify build still succeeds**

Run: `pnpm build`
Expected: exits 0. No regressions.

- [ ] **Step 3: Smoke-test locally**

Run: `pnpm dev` and visit `http://localhost:4321/`.

Because `homepage_countdown.opens = "2026-07-01"` and today is 2026-04-23, the countdown should be HIDDEN. Verify.

Then test the env override:
```bash
# Stop dev server. Create .env.local with:
echo "FLAG_HOMEPAGE_COUNTDOWN=on" > .env.local
pnpm dev
```
Visit `/` — countdown should now be visible. Delete `.env.local` when done.

- [ ] **Step 4: Commit**

```bash
git add src/components/hero/HeroSection.astro
git commit -m "feat(flags): gate homepage countdown behind homepage_countdown flag"
```

---

### Task 8: Stitch mockup approval gate for `<ComingSoonLayout>`

**This task BLOCKS on user input. Do not implement `ComingSoonLayout.astro` until step 4 is complete.**

**Files:** none (produces a Stitch screen).

- [ ] **Step 1: Generate Stitch mockup**

Use the Stitch MCP tools to generate a mockup of the coming-soon page layout. Bind to the existing CND France 2027 design system (see `reference_stitch.md` memory for project + DS IDs). Use DS token roles only — no hex colors.

Prompt outline:
> "Coming-soon page for CND France 2027. Same header and footer as the site. Hero section centered on desktop, left-aligned on mobile: large heading ({flags.<flag>.soon.title}), body paragraph ({flags.<flag>.soon.body}, ~1-2 sentences), a line beneath the body reading '{flags.soon.opens_on}' with a formatted date (example: 'Ouverture le 1 septembre 2026'), and a primary button labelled {flags.soon.notify_cta} (e.g., 'Être prévenu·e'). No countdown. Typography scale matches the site's hero. Primary button uses the accent token."

Produce FR and EN variants (just swap the copy — same layout).

- [ ] **Step 2: Present the mockup to the user**

Link the Stitch screen ID or share the URL. Ask: "Does this coming-soon layout look right? Approve or describe changes."

- [ ] **Step 3: Wait for user approval**

Do not proceed to Task 9 until the user confirms the mockup is acceptable. If the user requests changes, iterate on the Stitch mockup before moving on.

- [ ] **Step 4: Record the approved Stitch screen ID**

Add a note to `docs/feature-flags.md` under "Reference" — something like:
> Stitch mockup: `<screen-id>` (CND France 2027 DS, approved YYYY-MM-DD).

Commit the docs note separately:
```bash
git add docs/feature-flags.md
git commit -m "docs(flags): reference approved Stitch mockup for ComingSoonLayout"
```

---

### Task 9: Implement `<ComingSoonLayout>`

**Files:**
- Create: `src/components/flags/ComingSoonLayout.astro`

- [ ] **Step 1: Implement based on the approved Stitch mockup**

Create `src/components/flags/ComingSoonLayout.astro`:

```astro
---
/**
 * Shared "coming soon" layout for page-kind flags.
 *
 * Used by route files when a page-kind flag is not `active`:
 *
 *   {isFlagActive("cfp")
 *     ? <RealCfpPage />
 *     : <ComingSoonLayout flag="cfp" lang={lang} />}
 *
 * Reads copy from src/i18n/ui.ts under the flags.<name>.soon.{title,body}
 * namespace. Formats the opens date in the requested locale. Renders a
 * newsletter CTA pointing at the hosted Brevo form.
 */
import Layout from "@/layouts/Layout.astro";
import { FLAGS, type FlagName } from "@/config/flags";
import { useTranslations } from "@/i18n/utils";
import { NEWSLETTER_URL } from "@/lib/event";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface Props {
  flag: FlagName;
  lang: "fr" | "en";
}

const { flag, lang } = Astro.props;
const t = useTranslations(lang);
const flagDef = FLAGS[flag];

if (flagDef.kind !== "page") {
  throw new Error(
    `<ComingSoonLayout> received non-page flag "${flag}". Only page-kind flags may be used.`,
  );
}

const title = t(`flags.${flag}.soon.title` as Parameters<typeof t>[0]);
const body = t(`flags.${flag}.soon.body` as Parameters<typeof t>[0]);
const notifyCta = t("flags.soon.notify_cta");

const localeTag = lang === "fr" ? "fr-FR" : "en-US";
const opensDate = flagDef.opens ? new Date(flagDef.opens) : null;
const formattedOpens = opensDate
  ? new Intl.DateTimeFormat(localeTag, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(opensDate)
  : null;
const opensLine = formattedOpens
  ? t("flags.soon.opens_on").replace("{date}", formattedOpens)
  : null;
---

<Layout title={title} description={body}>
  <main>
    <section class="relative flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center md:py-24">
      <div class="mx-auto max-w-2xl flex flex-col items-center gap-6">
        <h1 class="text-3xl md:text-4xl font-bold leading-tight tracking-[-0.02em] text-foreground">
          {title}
        </h1>
        <p class="text-base md:text-lg text-muted-foreground leading-[1.6] max-w-[60ch]">
          {body}
        </p>
        {opensLine && (
          <p class="text-sm text-muted-foreground">{opensLine}</p>
        )}
        <a
          href={NEWSLETTER_URL}
          target="_blank"
          rel="noopener noreferrer"
          class={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "h-[52px] px-8 text-lg font-bold",
          )}
        >
          {notifyCta}
        </a>
      </div>
    </section>
  </main>
</Layout>
```

Important: **if the approved Stitch mockup differs from this scaffold** (different layout, additional elements, different token usage), adjust the implementation to match the mockup. This code is a starting point, not authoritative — the Stitch mockup is the spec.

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/flags/ComingSoonLayout.astro
git commit -m "feat(flags): add ComingSoonLayout for page-kind flag coming-soon pages"
```

---

### Task 10: Create `/cfp` route

**Files:**
- Create: `src/pages/cfp.astro`
- Create: `src/pages/en/cfp.astro`

**Design note:** Because `CfpSection.astro` already encapsulates the full CFP content with its own 3-state UI (open/coming-soon/closed sections), the standalone `/cfp` page can simply render `CfpSection` when the flag is active, and `ComingSoonLayout` when pending/ended. This avoids duplicating CFP content in two places.

- [ ] **Step 1: Create `src/pages/cfp.astro`**

```astro
---
import Layout from "@/layouts/Layout.astro";
import CfpSection from "@/components/cfp/CfpSection.astro";
import ComingSoonLayout from "@/components/flags/ComingSoonLayout.astro";
import { isFlagActive } from "@/lib/flags";
import { useTranslations } from "@/i18n/utils";

const lang = "fr";
const t = useTranslations(lang);
const active = isFlagActive("cfp");
---

{active ? (
  <Layout title={t("cfp.heading")} description={t("cfp.description.open")}>
    <main>
      <CfpSection />
    </main>
  </Layout>
) : (
  <ComingSoonLayout flag="cfp" lang={lang} />
)}
```

- [ ] **Step 2: Create `src/pages/en/cfp.astro`**

```astro
---
import Layout from "@/layouts/Layout.astro";
import CfpSection from "@/components/cfp/CfpSection.astro";
import ComingSoonLayout from "@/components/flags/ComingSoonLayout.astro";
import { isFlagActive } from "@/lib/flags";
import { useTranslations } from "@/i18n/utils";

const lang = "en";
const t = useTranslations(lang);
const active = isFlagActive("cfp");
---

{active ? (
  <Layout title={t("cfp.heading")} description={t("cfp.description.open")}>
    <main>
      <CfpSection />
    </main>
  </Layout>
) : (
  <ComingSoonLayout flag="cfp" lang={lang} />
)}
```

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: exits 0. Both routes present in `dist/`.

- [ ] **Step 4: Smoke-test**

Run: `pnpm dev`. Visit `/cfp` and `/en/cfp` — should render the coming-soon layout (CFP flag is pending until 2026-09-01).

Then test activation:
```bash
FLAG_CFP=on pnpm dev
```
Visit `/cfp` — should render the real CFP content.

- [ ] **Step 5: Commit**

```bash
git add src/pages/cfp.astro src/pages/en/cfp.astro
git commit -m "feat(flags): add /cfp route gated by the cfp flag"
```

---

### Task 11: Create `/tickets` route

**Files:**
- Create: `src/pages/tickets.astro`
- Create: `src/pages/en/tickets.astro`

**Design note:** When `tickets` is active, the page redirects to the external ticketing URL. When pending, it renders `ComingSoonLayout`. Astro SSG supports `Astro.redirect()` at build-time via `export const output = 'server'` per-route OR via the redirects feature. Because the site is fully static, we use the **redirects** config in `astro.config.mjs` conditionally OR implement as a meta refresh + JS fallback.

**Simplest approach:** render a minimal page with `<meta http-equiv="refresh">` when active. Works with SSG, no server needed. For non-JS clients, also include a visible link.

- [ ] **Step 1: Create `src/pages/tickets.astro`**

```astro
---
import Layout from "@/layouts/Layout.astro";
import ComingSoonLayout from "@/components/flags/ComingSoonLayout.astro";
import { isFlagActive } from "@/lib/flags";
import { useTranslations } from "@/i18n/utils";

const lang = "fr";
const t = useTranslations(lang);
const active = isFlagActive("tickets");
const TICKETING_URL = "https://tickets.cloudnativedays.fr/";
---

{active ? (
  <Layout title={t("hero.cta.register")} description="">
    <meta http-equiv="refresh" content={`0; url=${TICKETING_URL}`} />
    <main class="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center gap-4">
      <p class="text-base text-muted-foreground">
        <a href={TICKETING_URL} target="_blank" rel="noopener noreferrer" class="underline">
          {TICKETING_URL}
        </a>
      </p>
    </main>
  </Layout>
) : (
  <ComingSoonLayout flag="tickets" lang={lang} />
)}
```

- [ ] **Step 2: Create `src/pages/en/tickets.astro`**

Same structure with `lang = "en"`.

- [ ] **Step 3: Verify build**

Run: `pnpm build`.
Expected: exits 0.

- [ ] **Step 4: Smoke-test**

Run: `pnpm dev`. Visit `/tickets` and `/en/tickets` — coming-soon.
Then `FLAG_TICKETS=on pnpm dev` — visit `/tickets`, should meta-refresh to the external URL within 0s.

- [ ] **Step 5: Commit**

```bash
git add src/pages/tickets.astro src/pages/en/tickets.astro
git commit -m "feat(flags): add /tickets route with coming-soon gate and meta-refresh when active"
```

---

### Task 12: Gate existing `/programme` routes

**Files:**
- Modify: `src/pages/programme/index.astro`
- Modify: `src/pages/en/programme/index.astro`

- [ ] **Step 1: Read each file to understand current structure**

Read both files. Identify the frontmatter + the page body.

- [ ] **Step 2: Wrap with the flag gate**

For each file, add to the imports:
```astro
import ComingSoonLayout from "@/components/flags/ComingSoonLayout.astro";
import { isFlagActive } from "@/lib/flags";
```

Wrap the entire rendered body in a ternary on `isFlagActive("programme")`. Render `ComingSoonLayout` when pending, the existing content when active.

Template:
```astro
---
// ... existing imports ...
import ComingSoonLayout from "@/components/flags/ComingSoonLayout.astro";
import { isFlagActive } from "@/lib/flags";

const lang = "fr";  // or "en"
// ... existing data loading ...
const active = isFlagActive("programme");
---

{active ? (
  <Layout title={...} ...>
    <!-- existing body -->
  </Layout>
) : (
  <ComingSoonLayout flag="programme" lang={lang} />
)}
```

- [ ] **Step 3: Verify build + smoke test**

Run: `pnpm build` → exits 0.
Run: `pnpm dev` → `/programme` and `/en/programme` render coming-soon (flag opens 2027-04-01, currently pending).
Run: `FLAG_PROGRAMME=on pnpm dev` → real programme content renders.

- [ ] **Step 4: Commit**

```bash
git add src/pages/programme/index.astro src/pages/en/programme/index.astro
git commit -m "feat(flags): gate /programme routes behind programme flag"
```

---

### Task 13: Route integration tests

**Files:**
- Create: `src/pages/__tests__/flag-routes.test.ts`

- [ ] **Step 1: Write tests**

Create `src/pages/__tests__/flag-routes.test.ts`:

```ts
/**
 * Smoke tests per gated route × state. Mocks the clock + env to exercise
 * each branch. Assertions are string-contains on the rendered HTML, keeping
 * the tests resilient to styling changes.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import CfpPage from "@/pages/cfp.astro";
import TicketsPage from "@/pages/tickets.astro";
import ProgrammePage from "@/pages/programme/index.astro";

describe("/cfp route", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders coming-soon layout before CFP opens", async () => {
    vi.setSystemTime(new Date("2026-08-15T12:00:00+02:00"));
    const container = await AstroContainer.create();
    const html = await container.renderToString(CfpPage);
    expect(html).toContain("L'appel à propositions arrive");
  });

  it("renders real CFP content during the active window", async () => {
    vi.setSystemTime(new Date("2026-10-01T12:00:00+02:00"));
    const container = await AstroContainer.create();
    const html = await container.renderToString(CfpPage);
    // The active branch of CfpSection renders the "CFP ouvert" badge copy.
    expect(html).toContain("CFP ouvert");
  });
});

describe("/tickets route", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("renders coming-soon before tickets open", async () => {
    vi.setSystemTime(new Date("2026-12-01T12:00:00+01:00"));
    const container = await AstroContainer.create();
    const html = await container.renderToString(TicketsPage);
    expect(html).toContain("La billetterie arrive");
  });

  it("renders meta-refresh redirect when tickets are active", async () => {
    vi.setSystemTime(new Date("2027-02-01T12:00:00+01:00"));
    const container = await AstroContainer.create();
    const html = await container.renderToString(TicketsPage);
    expect(html).toContain("http-equiv=\"refresh\"");
    expect(html).toContain("tickets.cloudnativedays.fr");
  });
});

describe("/programme route", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("renders coming-soon before programme is published", async () => {
    vi.setSystemTime(new Date("2027-03-01T12:00:00+01:00"));
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProgrammePage);
    expect(html).toContain("Le programme arrive");
  });
});
```

**Note on `AstroContainer`:** Astro's experimental container API renders components server-side without a full server. If `astro/container` is unavailable or misbehaves in this repo's version, fall back to rendering the modules as plain functions with mocked imports, or use `@astrojs/test-utils`. Validate with `pnpm test` — if the container import fails, Task 13 becomes a separate plan item.

- [ ] **Step 2: Run tests**

Run: `pnpm test src/pages/__tests__/flag-routes.test.ts`
Expected: PASS (5 assertions).

If the Astro container import fails: log the failure in `docs/feature-flags.md` under "Known gaps" and convert these tests into Playwright smoke tests in a follow-up plan.

- [ ] **Step 3: Commit**

```bash
git add src/pages/__tests__/flag-routes.test.ts
git commit -m "test(flags): smoke tests for /cfp, /tickets, /programme gating"
```

---

### Task 14: Transition-detection script

**Files:**
- Create: `scripts/check-flag-transitions.ts`

- [ ] **Step 1: Implement the script**

Create `scripts/check-flag-transitions.ts`:

```ts
/**
 * Daily GH Actions cron helper — determines whether any flag's state changed
 * in the last 24 hours. Emits GitHub Actions output `should-rebuild=true|false`
 * and logs the transition for audit.
 *
 * Usage:
 *   pnpm tsx scripts/check-flag-transitions.ts
 *   pnpm tsx scripts/check-flag-transitions.ts --dry-run    (skip the output write)
 */

import * as fs from "node:fs";
import { FLAGS, type FlagDefinition } from "../src/config/flags.ts";
import { getFlagState } from "../src/lib/flags.ts";

const DRY_RUN = process.argv.includes("--dry-run");
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

const now = new Date();
const yesterday = new Date(now.getTime() - TWENTY_FOUR_HOURS_MS);

let shouldRebuild = false;

for (const [name, flag] of Object.entries(FLAGS) as Array<[string, FlagDefinition]>) {
  // No override in CI-cron context; pure date-driven comparison.
  const before = getFlagState(flag, yesterday);
  const after = getFlagState(flag, now);
  if (before !== after) {
    console.log(`${name}: ${before} → ${after} (at ${now.toISOString()})`);
    shouldRebuild = true;
  }
}

if (!shouldRebuild) {
  console.log("No flag transitions in the last 24h.");
}

if (!DRY_RUN) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    fs.appendFileSync(outputFile, `should-rebuild=${shouldRebuild}\n`);
  } else {
    console.log(`should-rebuild=${shouldRebuild}`);
  }
}

process.exit(0);
```

- [ ] **Step 2: Dry-run locally**

Run: `pnpm tsx scripts/check-flag-transitions.ts --dry-run`
Expected: exits 0, prints "No flag transitions in the last 24h." (unless today is exactly 2026-07-01 — the `homepage_countdown` opens-date — in which case it prints a transition for that flag).

- [ ] **Step 3: Commit**

```bash
git add scripts/check-flag-transitions.ts
git commit -m "feat(flags): add daily CI transition-detection script"
```

---

### Task 15: Enable `workflow_call` on `build-image.yml`

**Files:**
- Modify: `.github/workflows/build-image.yml`

- [ ] **Step 1: Add workflow_call trigger**

Open `.github/workflows/build-image.yml`. The current `on:` block (lines 4-17) triggers on push and PR. Add `workflow_call:` so the flag cron can invoke it:

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'public/**'
      - 'package.json'
      - 'pnpm-lock.yaml'
      - 'astro.config.mjs'
      - 'Dockerfile'
      - 'nginx/**'
  pull_request:
    branches: [main]
  workflow_call:        # ← added for flag-cron.yml
  workflow_dispatch:    # ← added for manual "rebuild now" trigger
```

No other changes to the workflow. Existing jobs and steps are unaffected.

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/build-image.yml
git commit -m "ci: enable workflow_call and workflow_dispatch on build-image.yml"
```

---

### Task 16: Create `flag-cron.yml`

**Files:**
- Create: `.github/workflows/flag-cron.yml`

- [ ] **Step 1: Write the workflow**

Create `.github/workflows/flag-cron.yml`:

```yaml
# Daily feature-flag transition check.
# Runs at 22:05 UTC (≈ 00:05 Europe/Paris in summer) and 23:05 UTC (≈ 00:05 CET in winter)
# to cover DST. Invokes build-image.yml only when a flag transition is detected.
name: Feature flag transition check

on:
  schedule:
    - cron: "5 22 * * *"   # 22:05 UTC = 00:05 CEST (summer)
    - cron: "5 23 * * *"   # 23:05 UTC = 00:05 CET  (winter)
  workflow_dispatch:

jobs:
  check-transitions:
    runs-on: ubuntu-latest
    outputs:
      should-rebuild: ${{ steps.check.outputs.should-rebuild }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          run_install: false
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - id: check
        run: pnpm tsx scripts/check-flag-transitions.ts

  rebuild:
    needs: check-transitions
    if: needs.check-transitions.outputs.should-rebuild == 'true'
    uses: ./.github/workflows/build-image.yml
    secrets: inherit
    permissions:
      contents: read
      packages: write
      security-events: write
```

- [ ] **Step 2: Validate the YAML**

Run: `pnpm tsx -e "import('yaml').then(m => m.parse(require('fs').readFileSync('.github/workflows/flag-cron.yml', 'utf8')))"`
(Or just inspect the file for indentation sanity.)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/flag-cron.yml
git commit -m "ci: daily feature-flag cron triggers build-image.yml on state transitions"
```

- [ ] **Step 4: Manual trigger after merge**

After this branch ships to `main`, trigger the workflow once manually from the GitHub Actions UI (`Run workflow` on `flag-cron`). It should:
1. Run the check script and find no transitions (since the opens dates are all in the future).
2. Skip the `rebuild` job (conditional on `should-rebuild == 'true'`).
3. Exit green.

If any transition is unexpectedly detected, the script's log identifies which flag — investigate before deploying.

---

### Task 17: Reconcile `docs/feature-flags.md` with shipped code

**Files:**
- Modify: `docs/feature-flags.md`

- [ ] **Step 1: Diff spec-vs-implementation**

Re-read `docs/feature-flags.md` front-to-back. For each claim, verify it matches the shipped code. Likely areas of drift:

- Import paths (e.g., the guide says `import ComingSoonLayout from "@/components/flags/ComingSoonLayout.astro"` — verify the alias works in the actual tsconfig paths).
- The exact API of `isFlagActive(name, now?)` — verify the signature in `src/lib/flags.ts`.
- The env var names (`FLAG_CFP`, `FLAG_HOMEPAGE_COUNTDOWN`) — verify case matches what `src/config/flags-env.ts` generates.
- The troubleshooting examples — make sure the paths and grep targets are accurate.
- Stitch mockup reference from Task 8.

- [ ] **Step 2: Fix any discrepancies inline**

Edit `docs/feature-flags.md` to match reality.

- [ ] **Step 3: Commit**

```bash
git add docs/feature-flags.md
git commit -m "docs(flags): reconcile configuration guide with shipped implementation"
```

---

### Task 18: Final verification

No files modified. This task is a checklist.

- [ ] **Step 1: Full test suite**

Run: `pnpm test`
Expected: all tests pass. Note the count — should include the new `flags.test.ts`, `flags-registry.test.ts`, `event.test.ts` (renamed), and `flag-routes.test.ts`.

- [ ] **Step 2: Type check**

Run: `pnpm astro sync && pnpm tsc --noEmit`
Expected: 0 type errors beyond the pre-existing 5 baseline issues noted in the archived STATE.md (content.config.ts Zod regression + Edition2023PhotoGrid implicit-any).

- [ ] **Step 3: Production build**

Run: `pnpm build`
Expected: exits 0. Verify these paths exist in `dist/`:
- `dist/cfp/index.html` (or `dist/cfp.html`)
- `dist/en/cfp/index.html`
- `dist/tickets/index.html`
- `dist/en/tickets/index.html`
- `dist/programme/index.html`
- `dist/en/programme/index.html`

- [ ] **Step 4: Env override smoke tests**

Build with each override and inspect the HTML:

```bash
FLAG_CFP=on pnpm build
grep -c "CFP ouvert" dist/cfp/index.html   # Should be > 0 (active branch rendered)
grep -c "L'appel à propositions arrive" dist/cfp/index.html   # Should be 0

pnpm build   # back to default
grep -c "L'appel à propositions arrive" dist/cfp/index.html   # Should be > 0
```

Repeat for `FLAG_TICKETS=on` and `FLAG_PROGRAMME=on`.

- [ ] **Step 5: Run the transition script against CI simulation**

```bash
pnpm tsx scripts/check-flag-transitions.ts --dry-run
```
Expected: exits 0 with "No flag transitions in the last 24h."

- [ ] **Step 6: No regressions in existing flows**

Run: `pnpm dev` and visually verify:
- `/` — homepage renders; CountdownTimer is HIDDEN (pending until 2026-07-01).
- `/en/` — same, English.
- `/speakers`, `/sponsors`, `/team`, `/venue`, `/2023`, `/code-of-conduct`, `/privacy`, `/terms`, `/replays` — all render, no errors.
- Hero "Restez informé" button — still works (now using `NEWSLETTER_URL` import).
- `CfpSection` on `/` — renders coming-soon branch (CFP flag pending), button points to `NEWSLETTER_URL` not `CONFERENCE_HALL_URL`.

- [ ] **Step 7: Confirm with user before opening PR**

Present a short summary to the user:
- What was built (18 commits, ~10 new files, ~6 files modified, 1 rename)
- Test counts (how many flags.*, event.*, flag-routes.* tests pass)
- Any discovered gaps or follow-ups (e.g., nav integration for `/cfp` and `/tickets`, optional Task 13 Astro container fallback)

Ask: "Ready to open a PR to `main`?" Wait for user input before running `gh pr create`.

---

## Self-review notes

Spec coverage confirmed section-by-section:

- **Section 1 (Registry)** → Task 1.
- **Section 2 (State machine)** → Task 2.
- **Section 3 (Env overrides)** → Task 3.
- **Section 4 (Route gating + ComingSoonLayout + FeatureGate + newsletter URL extraction + cfp.cta.notify fix)** → Tasks 5, 6, 7, 8, 9, 10, 11, 12.
- **Section 5 (i18n)** → Task 4.
- **Section 6 (CFP migration)** → Task 5.
- **Section 7 (CI cron)** → Tasks 14, 15, 16.
- **Section 8 (Testing)** → Tasks 1 (registry), 2 (evaluator), 3 (env schema), 4 (i18n), 13 (route integration), distributed.

Acceptance-criteria coverage:
- `/cfp`, `/tickets`, `/programme` routes gated → Tasks 10, 11, 12.
- `FLAG_<NAME>=on|off` flips state → Tasks 3 (schema), 7, 10-12 (consumers), 18 (verification).
- Homepage countdown gated by `homepage_countdown` → Task 7.
- `cfp.ts` renamed to `event.ts`, `getCfpState` removed, 3 consumers migrated → Task 5.
- Test layers → Tasks 1, 2, 3, 4, 13.
- `check-flag-transitions.ts --dry-run` exits 0 → Task 14, 18.
- `flag-cron.yml` manual dispatch without triggering a deploy → Task 16 step 4.
- `docs/feature-flags.md` in lockstep with code → Task 17.

No placeholder strings, no "similar to Task N" references.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-23-feature-flags-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
