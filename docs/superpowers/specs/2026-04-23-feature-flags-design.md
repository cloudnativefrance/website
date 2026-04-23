# Feature Flags — Design Spec

**Date:** 2026-04-23
**Status:** Draft (pending user review)
**Supersedes:** the ad-hoc CFP state machine in `src/lib/cfp.ts` (`CFP_OPENS`, `CFP_CLOSES`, `getCfpState`)

## Goal

Introduce a typed feature-flag system that gates UI elements and entire routes behind configurable date windows. The system replaces today's one-off CFP date logic and extends it to ticketing, programme publication, and a homepage countdown element — with room for future flags.

## Non-goals

- Runtime remote flags (no LaunchDarkly / Unleash / GrowthBook). Site is SSG; rebuilds are cheap.
- Staff-editable flag registry via Google Sheet. Flags are dev-committed TypeScript; strategic dates change rarely and benefit from PR review.
- Notify-me email capture form. The existing Brevo-hosted newsletter button is reused as the notification CTA.
- Per-user targeting, A/B buckets, or percentage rollouts. Not needed for a static conference site.

## Constraints

- Astro 6 SSG. No SSR adapter is installed or planned.
- Bilingual FR/EN. Every page-kind flag must have copy in both locales.
- Deployed via Docker + nginx on Kubernetes. Build triggered by CI.
- The Europe/Paris timezone is the project-wide convention for all dates (every existing date constant uses an explicit `+01:00` or `+02:00` offset).

---

## Architecture overview

```
┌──────────────────────────────┐
│ src/config/flags.ts          │  typed registry — single source of truth
│   FLAGS = { cfp: {...}, ... }│
└──────────────┬───────────────┘
               │
   ┌───────────┴────────────────┐
   │                            │
   ▼                            ▼
┌──────────────────┐   ┌─────────────────────────┐
│ src/lib/flags.ts │   │ scripts/check-flag-     │
│   getFlagState() │   │ transitions.ts          │
│   isFlagActive() │   │   (CI daily cron)       │
└────────┬─────────┘   └─────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│ Consumers                                       │
│   ─ route files (cfp/tickets/programme.astro)   │
│   ─ <ComingSoonLayout> (page-kind flags)        │
│   ─ <FeatureGate>       (element-kind flags)    │
└─────────────────────────────────────────────────┘
```

**Flow:** Registry defines flags with date windows. Pure evaluator resolves state from the registry + current time + optional env override. Route files and components read `isFlagActive(name)` and render accordingly. A daily CI cron detects day-over-day transitions and triggers a redeploy, so the build flips without manual intervention.

---

## Section 1 — Flag registry

**Location:** `src/config/flags.ts`.

```ts
export interface FlagDefinition {
  /** ISO-8601 date-time with Europe/Paris offset. Optional — omit to mean "always open from the start". */
  opens?: string;
  /** ISO-8601 date-time with Europe/Paris offset. Optional — omit to mean "never closes". */
  closes?: string;
  /** Drives the consumer contract. "page" flags must have i18n soon-copy. "element" flags just hide/show. */
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

**Semantics:**
- Omitting `opens` → flag is `active` from the start, up to `closes` (or forever if also no `closes`).
- Omitting `closes` → flag stays `active` once `opens` is reached.
- Omitting both → flag is always `active` (the system supports pure on/off toggles by registering a flag with no dates and using the env override to flip it).

---

## Section 2 — State machine and evaluator

**Location:** `src/lib/flags.ts`.

```ts
export type FlagState = "pending" | "active" | "ended";

export function getFlagState(
  flag: FlagDefinition,
  now: Date = new Date(),
  override?: "on" | "off"
): FlagState;

export function isFlagActive(name: FlagName, now?: Date): boolean;
```

**Rules:**
- `pending` when `now < opens`.
- `active` when `opens ≤ now ≤ closes`. Missing `opens` treated as `-Infinity`; missing `closes` treated as `+Infinity`.
- `ended` when `now > closes`.
- Override `"on"` returns `"active"` regardless of dates. Override `"off"` returns `"ended"`.

`getFlagState` is a pure function — no imports beyond types, safe in both `.astro` server context and `.tsx` client islands. `isFlagActive` is the 90% convenience call: resolves the flag from the registry, applies the env override automatically, and returns a boolean.

---

## Section 3 — Environment variable overrides

Staff and developers can force a flag's state without editing dates, via a per-flag env variable. Useful for staging previews ("show me the real tickets page before the date") and emergency kill switches.

**Shape:** `FLAG_<FLAG_NAME_UPPERCASE>`. Values: `on`, `off`, or empty/unset (use date logic).

```bash
FLAG_CFP=on                 # force active
FLAG_TICKETS=off            # force ended
FLAG_PROGRAMME=             # use date logic
FLAG_HOMEPAGE_COUNTDOWN=on  # reveal the countdown early in a preview build
```

**Resolution order (high → low):** explicit argument to `getFlagState` → env var → date window.

**Astro env schema:** generated from the registry, so adding a flag doesn't require hand-editing `astro.config.mjs`.

```ts
// astro.config.mjs
import { generateFlagEnvSchema } from "./src/config/flags-env";

env: {
  schema: {
    ...generateFlagEnvSchema(),   // expands to FLAG_CFP, FLAG_TICKETS, ... using envField.enum
  },
}
```

`generateFlagEnvSchema()` returns, for each flag in `FLAGS`, an `envField.enum({ context: "server", access: "public", values: ["on", "off", ""], optional: true, default: "" })`. Server-context only: overrides are consumed at build time and never shipped to the client.

---

## Section 4 — Route gating and layout

### Page-kind flags

Gated at the top of each page file. No redirects, no separate URLs. One URL per feature is preserved across the flip.

```astro
---
// src/pages/cfp.astro (and mirror in src/pages/en/cfp.astro)
import { isFlagActive } from "@/lib/flags";
import ComingSoonLayout from "@/components/flags/ComingSoonLayout.astro";
import RealCfpPage from "@/components/cfp/RealCfpPage.astro";  // extracted from today's inline content

const lang = "fr";
const cfpActive = isFlagActive("cfp");
---
{cfpActive
  ? <RealCfpPage />
  : <ComingSoonLayout flag="cfp" lang={lang} />}
```

Same pattern for `/tickets` (new), `/programme/index.astro` (wrap existing), and their `/en/` mirrors.

### `<ComingSoonLayout>` API

`src/components/flags/ComingSoonLayout.astro`:

```ts
interface Props {
  flag: FlagName;           // must be kind: "page"
  lang: "fr" | "en";
}
// optional <slot /> for per-flag illustration override
```

**Renders:**
- Standard site `<Layout>` (header, footer, locale switcher — so the page feels like the site).
- Hero block with title + body from i18n keys (`flags.<flag>.soon.title`, `flags.<flag>.soon.body`).
- Formatted `opens` date line: `Intl.DateTimeFormat(lang, { day: "numeric", month: "long", year: "numeric" }).format(opens)` interpolated into the shared `flags.soon.opens_on` key.
- Primary CTA button linking to the Brevo newsletter URL (shared with hero), labelled `flags.soon.notify_cta`.
- OpenGraph + meta tags using the soon-copy as title/description.
- **No countdown, no inline notify-me form.**

### Element-kind flags

`src/components/flags/FeatureGate.astro`:

```astro
---
import { isFlagActive } from "@/lib/flags";
import type { FlagName } from "@/config/flags";
interface Props { flag: FlagName; }
const { flag } = Astro.props;
const show = isFlagActive(flag);
---
{show && <slot />}
```

Usage on the homepage:

```astro
<FeatureGate flag="homepage_countdown">
  <CountdownTimer client:idle />
</FeatureGate>
```

### Newsletter URL extraction (cleanup bundled)

The Brevo form URL is currently a hardcoded inline string in `src/components/hero/HeroSection.astro`. As part of this phase, extract it to a named constant (`NEWSLETTER_URL` in `src/lib/event.ts` — see Section 6) so the hero and `<ComingSoonLayout>` import the same value.

### `cfp.cta.notify` fix (cleanup bundled)

`src/components/cfp/CfpSection.astro` currently renders a "Me notifier / Notify me" button pointing to `CONFERENCE_HALL_URL` (the submission platform — wrong target). Repointed to `NEWSLETTER_URL` in the same phase.

---

## Section 5 — i18n

All copy lives in `src/i18n/ui.ts` under a new `flags.*` namespace. Shared keys for chrome; per-flag keys for each page-kind flag's soon-copy.

**Shared keys (rendered once, used by every coming-soon page):**

```ts
"flags.soon.notify_cta": "Être prévenu·e",
"flags.soon.opens_on":   "Ouverture le {date}",  // {date} interpolated

// en mirror
"flags.soon.notify_cta": "Notify me",
"flags.soon.opens_on":   "Opens on {date}",
```

**Per-flag keys (title + body, one pair per page-kind flag, both locales):**

```ts
"flags.cfp.soon.title":       "L'appel à propositions arrive",
"flags.cfp.soon.body":        "Inscrivez-vous à la newsletter pour être alerté·e dès l'ouverture.",
"flags.tickets.soon.title":   "La billetterie arrive",
"flags.tickets.soon.body":    "Les inscriptions ouvrent le 15 janvier 2027.",
"flags.programme.soon.title": "Le programme arrive",
"flags.programme.soon.body":  "Le programme complet sera dévoilé en avril 2027.",
// en mirror: equivalent keys with English copy
```

**Integrity check:** a parameterized vitest test asserts every `kind: "page"` flag has matching `title` + `body` keys in both `fr` and `en`. Missing copy fails CI, not production.

---

## Section 6 — CFP migration

Today's `src/lib/cfp.ts` bundles three concerns. Each is handled differently:

| Today | Destiny |
|---|---|
| `CFP_OPENS`, `CFP_CLOSES` | Deleted. Moved into `FLAGS.cfp.opens` / `.closes`. |
| `getCfpState()`, `CfpState` type | Deleted. Replaced by `getFlagState` / `FlagState`. Vocabulary shifts: `"coming-soon" | "open" | "closed"` → `"pending" | "active" | "ended"`. |
| `TARGET_DATE`, `isPostEvent()` | Kept. Not flags — they're the event anchor for the countdown and post-event CTA flip. |
| `CONFERENCE_HALL_URL`, `getReplaysPath()` | Kept. Outbound URLs and path helpers. |
| (new) `NEWSLETTER_URL` | Added alongside. Extracted from the inline string in `HeroSection.astro`. |

The file is renamed `src/lib/cfp.ts` → `src/lib/event.ts` since "cfp" becomes a misnomer once the CFP logic leaves. Imports updated in the same PR.

**Call sites updated atomically:**
- `src/components/hero/HeroSection.astro` — imports `NEWSLETTER_URL` instead of the inline string; no longer imports `getCfpState`.
- `src/components/Navigation.astro` — `getCfpState` call replaced by `isFlagActive("cfp")` (states collapse to boolean since nav only cares "show CFP link or not").
- `src/components/cfp/CfpSection.astro` — `getCfpState` call replaced by `getFlagState(FLAGS.cfp)` (keeps 3-state rendering); `cfp.cta.notify` repointed to `NEWSLETTER_URL`.
- `src/lib/__tests__/cfp.test.ts` — renamed to `flags.test.ts`; three existing boundary tests rewritten against the new API (same coverage).

**No deprecation shim.** Atomic migration in one PR; single-dev project, worth the small churn to avoid two concurrent APIs.

---

## Section 7 — CI rebuild scheduler

A daily GitHub Actions scheduled workflow triggers a production rebuild if (and only if) any flag's state changed in the last 24 hours.

**Workflow:** `.github/workflows/flag-cron.yml`

```yaml
on:
  schedule:
    - cron: "5 22 * * *"   # 22:05 UTC ≈ 00:05 Europe/Paris (summer)
    - cron: "5 23 * * *"   # 23:05 UTC ≈ 00:05 Europe/Paris (winter) — DST coverage
  workflow_dispatch:

jobs:
  maybe-rebuild:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - id: check
        run: pnpm tsx scripts/check-flag-transitions.ts
      - if: steps.check.outputs.should-rebuild == 'true'
        # invokes the existing deploy pipeline (exact dispatch target confirmed during planning)
        uses: ./.github/workflows/deploy.yml
```

**Transition-detection script:** `scripts/check-flag-transitions.ts`

Reads `FLAGS`, computes `getFlagState(flag, now - 24h)` vs `getFlagState(flag, now)` for every flag, sets `should-rebuild=true` on any diff, and logs the transition ("cfp: pending → active on 2026-09-01") to the Actions run output. ~20 lines.

**DST acceptability:** running twice daily (once at 22:05 UTC, once at 23:05 UTC) covers both CEST and CET. The transition check is idempotent — two cron fires on the same day at most trigger one rebuild (the second fire sees `should-rebuild=false` because the transition was already detected and deployed).

**Not in scope for this spec:** the exact dispatch mechanism (how `flag-cron.yml` invokes the existing deploy job). Confirmed during implementation planning by inspecting current `.github/workflows/*.yml`.

---

## Section 8 — Testing

Three layers, following the repo's existing Vitest + `src/lib/__tests__/` convention.

### Layer 1 — State machine (`src/lib/__tests__/flags.test.ts`)

Boundary-condition tests for `getFlagState` and `isFlagActive`, using injected `now` (no real clocks):

- `pending` before `opens`.
- `active` at `opens`, mid-window, and at `closes`.
- `ended` after `closes`.
- `active` forever when `closes` is missing.
- `active` always when both `opens` and `closes` are missing.
- Override `"on"` beats pending dates.
- Override `"off"` beats active dates.

### Layer 2 — Registry integrity (`src/lib/__tests__/flags-registry.test.ts`)

Parameterized test iterating `FLAGS`:

- Every `kind: "page"` flag has `flags.<name>.soon.title` and `.body` keys in both `fr` and `en`.
- `new Date(opens)` and `new Date(closes)` parse to valid dates (no typos).
- `opens < closes` when both are set.
- `generateFlagEnvSchema()` emits an entry for every flag.

### Layer 3 — Route integration (colocated with pages, or `src/pages/__tests__/`)

Smoke assertions per gated route × state:

- `/cfp` with flag pending → contains the soon-copy title.
- `/cfp` with flag active → contains the real CFP heading.
- Same pair for `/tickets`, `/programme`, and their `/en/` mirrors.

Clock mocked via Vitest's `vi.useFakeTimers()`. Six route × state combinations = twelve assertions (three routes × two locales × two states).

### Not tested

- `scripts/check-flag-transitions.ts` — a `--dry-run` smoke invocation in CI is sufficient. Its logic reduces to Layer 1's coverage.
- Visual regression on `<ComingSoonLayout>` — covered by the Stitch-first design review, not code tests.

### Migrated from `cfp.test.ts`

Three existing boundary tests for `getCfpState` become Layer 1 boundary tests against `getFlagState`. Same intent, new API.

---

## Open questions (for planning phase)

One non-blocking item to confirm during `writing-plans`:

1. **Exact dispatch target for `flag-cron.yml`.** Depends on the current layout of `.github/workflows/*`. Read the existing deploy workflow, then either reuse it via `uses:` or fire it via `workflow_dispatch`.

(Spec locks: `cfp.ts` → `event.ts` rename ships in the same PR as the flag work — atomic migration, self-contained diff.)

## Acceptance criteria

- `/cfp`, `/tickets`, `/programme` (and `/en/` mirrors) render the soon-layout before their respective `opens` date and the real content after, driven exclusively by the registry.
- `FLAG_<NAME>=on|off` env vars flip state at build time, overriding date logic. Verified by a build with `FLAG_TICKETS=on` that produces the real tickets page output even when `new Date() < opens`.
- The existing `CountdownTimer` on `/` and `/en/` only renders when `homepage_countdown` is active (flip starts 2026-07-01).
- `src/lib/cfp.ts` is deleted (or renamed `event.ts`); `getCfpState` no longer exists in the codebase; all three original call sites consume the new API.
- Vitest suite passes: Layer 1 (boundaries), Layer 2 (registry integrity, i18n completeness), Layer 3 (route branching).
- `scripts/check-flag-transitions.ts --dry-run` exits 0.
- `flag-cron.yml` is present and passes a manual `workflow_dispatch` run without triggering a deploy (no transitions pending at test time).
- `docs/feature-flags.md` is present and accurate: describes registry location, flag anatomy, add-a-flag checklist (page vs element), env overrides, CI cron behavior, local testing recipes, and troubleshooting. Kept in lockstep with the shipped code — any deviation during implementation must be reflected in the guide.

## Deliverables (must ship in the same PR)

Code:
- `src/config/flags.ts` — registry + `FlagDefinition` type.
- `src/config/flags-env.ts` — `generateFlagEnvSchema()` helper consumed by `astro.config.mjs`.
- `src/lib/flags.ts` — `getFlagState`, `isFlagActive`, `FlagState` type.
- `src/components/flags/ComingSoonLayout.astro`, `src/components/flags/FeatureGate.astro`.
- `scripts/check-flag-transitions.ts`.
- `.github/workflows/flag-cron.yml`.

Code migration:
- `src/lib/cfp.ts` renamed to `src/lib/event.ts`, with `getCfpState` / `CFP_OPENS` / `CFP_CLOSES` / `CfpState` removed and `NEWSLETTER_URL` added.
- All three consumers (`HeroSection.astro`, `Navigation.astro`, `CfpSection.astro`) updated to the new API.
- `cfp.cta.notify` button in `CfpSection.astro` repointed to `NEWSLETTER_URL`.
- Inline Brevo URL in `HeroSection.astro` replaced by import of `NEWSLETTER_URL`.

Tests:
- `src/lib/__tests__/flags.test.ts` (boundaries), `src/lib/__tests__/flags-registry.test.ts` (integrity + i18n completeness).
- Route integration tests per gated route × state.

i18n:
- New `flags.*` keys in both `fr` and `en` blocks of `src/i18n/ui.ts`.

Docs:
- `docs/feature-flags.md` — comprehensive configuration guide (already drafted alongside this spec; kept in sync during implementation).

## References

- `src/lib/cfp.ts` — the ad-hoc precursor being subsumed.
- `src/components/hero/HeroSection.astro` — hosts the Brevo URL to be extracted.
- `src/components/cfp/CfpSection.astro` — holds the mis-wired `cfp.cta.notify` to be fixed.
- Astro env schema docs: `envField.enum` with `context: "server"`, `access: "public"`.
- Existing newsletter form (Brevo): referenced from `HeroSection.astro` line 94.
