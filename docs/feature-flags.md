# Feature Flags — Configuration Guide

This guide is the operator's manual for the CND France feature flag system. It covers how to add flags, change dates, override state in previews, debug issues, and understand the daily CI cron that keeps the production build in sync with the registry.

> **Status:** Describes the system introduced by the design spec at `docs/superpowers/specs/2026-04-23-feature-flags-design.md`. If anything here contradicts the code, the code wins — open a PR to update this guide.

---

## What feature flags do here

Flags gate two kinds of things:

- **Entire pages** (e.g. `/cfp`, `/tickets`, `/programme`). Before the flag activates, the URL renders a "coming soon" layout with localized copy and a newsletter CTA. After activation, the same URL renders the real page.
- **Individual UI elements** (e.g. the homepage countdown). Wrapped in `<FeatureGate>`, they simply appear or don't, with no fallback content.

All activations are **date-driven by default**. You set `opens` and optionally `closes`; the system flips state automatically. A daily CI cron detects the flip and redeploys within ≤24 hours of the target date. Env var overrides let you force a state for staging previews or emergency kill switches.

## What feature flags are NOT

- **Not a runtime service.** Flags resolve at build time. There's no LaunchDarkly, no API, no per-request evaluation. Flipping a flag requires a new build.
- **Not per-user targeting.** Every visitor sees the same state. No A/B buckets, no percentage rollouts.
- **Not staff-editable without a PR.** The registry is committed TypeScript. Strategic date changes go through code review. Staff can still flip state via env override (see below), but changing a `opens` date requires a developer.

---

## Where flags live

Single source of truth: **`src/config/flags.ts`**.

```ts
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
```

## Anatomy of a flag

Every flag entry has up to three fields:

| Field | Type | Required | Notes |
|---|---|---|---|
| `opens` | ISO-8601 string | Optional | Timestamp the flag becomes `active`. Omit to mean "active from the start". |
| `closes` | ISO-8601 string | Optional | Timestamp the flag becomes `ended`. Omit to mean "never closes". |
| `kind` | `"page" \| "element"` | **Required** | Drives the consumer contract. `"page"` flags MUST have matching i18n copy (see below). |

**Timezone convention.** Always use Europe/Paris offsets — `+02:00` in summer (CEST), `+01:00` in winter (CET). The rest of the codebase uses this convention; deviating breaks mental consistency.

**Seconds granularity.** Despite ISO-8601 allowing seconds, flips are effectively daily (see the CI cron section). Dates like `00:00:00` vs `23:59:59` matter for boundary testing but not for production flip timing.

## Flag states

```
        opens              closes
         ▼                   ▼
  ───────┤───────────────────┤────────
  pending       active          ended
```

- **`pending`** — `now < opens`. Page-kind flags render `<ComingSoonLayout>`. Element-kind flags render nothing.
- **`active`** — `opens ≤ now ≤ closes`. Page-kind flags render their real content. Element-kind flags render their wrapped slot.
- **`ended`** — `now > closes`. Same effect as `pending` for most use cases (content hidden or fallback shown). Distinct state exists so consumers can render different copy if they want (e.g. "CFP is closed, thanks for submitting" vs. "CFP opens soon").

Flags without `opens` and `closes` are permanently `active` (manual kill switch via env override only).

---

## How to add a new flag

### Page flag (gates a route)

Example: adding `sponsorship_pack` to gate a `/sponsorship` page until 2026-10-01.

1. **Register the flag** in `src/config/flags.ts`:
   ```ts
   sponsorship_pack: {
     opens: "2026-10-01T00:00:00+02:00",
     kind: "page",
   },
   ```

2. **Add i18n copy** in `src/i18n/ui.ts` (both `fr` and `en` dictionaries):
   ```ts
   "flags.sponsorship_pack.soon.title": "Les offres de sponsoring arrivent",
   "flags.sponsorship_pack.soon.body":  "Contactez-nous pour être prévenu·e de l'ouverture.",
   ```
   And the English mirror. The registry integrity test will fail CI if either locale is missing.

3. **Gate the route** in `src/pages/sponsorship.astro` (and `src/pages/en/sponsorship.astro`):
   ```astro
   ---
   import { isFlagActive } from "@/lib/flags";
   import ComingSoonLayout from "@/components/flags/ComingSoonLayout.astro";
   import RealSponsorshipPage from "@/components/sponsorship/RealSponsorshipPage.astro";

   const lang = "fr";
   const active = isFlagActive("sponsorship_pack");
   ---
   {active
     ? <RealSponsorshipPage />
     : <ComingSoonLayout flag="sponsorship_pack" lang={lang} />}
   ```

4. **Add a Layer 3 route test** in the matching `__tests__/` dir — one assertion per state (pending and active).

5. **Commit** — the CI cron picks up the new flag automatically. No workflow file edits needed.

### Element flag (gates a component)

Example: adding `sponsor_platinum_strip` to hide the platinum sponsor row until at least one signed deal.

1. **Register the flag**:
   ```ts
   sponsor_platinum_strip: {
     kind: "element",
     // No opens/closes — purely manual via env override.
   },
   ```
   (If you want date-driven: add `opens` and `closes` like any other flag.)

2. **Wrap the element** in `src/pages/index.astro` (and the `/en/` mirror):
   ```astro
   <FeatureGate flag="sponsor_platinum_strip">
     <SponsorsPlatinumStrip sponsors={platinumSponsors} />
   </FeatureGate>
   ```

3. **Commit**. If the flag has dates, the cron handles it. If it's manual, flip it via `FLAG_SPONSOR_PLATINUM_STRIP=on` at build time.

### Checklist before shipping

- [ ] Registered in `src/config/flags.ts`
- [ ] i18n keys added in both `fr` and `en` (page-kind only)
- [ ] Route or component wrapped with `isFlagActive` / `<FeatureGate>`
- [ ] Test added (Layer 3 for routes, visual spot-check for elements)
- [ ] `pnpm test` passes (registry integrity test validates i18n completeness)
- [ ] No hardcoded dates outside `src/config/flags.ts`

---

## Changing a flag's dates

1. Edit the constant in `src/config/flags.ts`.
2. Commit and merge to `main`.
3. The existing deploy pipeline ships the change.
4. **If the new date is in the future**, the daily cron will detect the transition and redeploy at that date. You don't need to schedule anything.
5. **If the new date is in the past**, the flip is immediate on the current build — no additional work.

**If you need the flip right now** (not at midnight Europe/Paris): trigger the deploy workflow manually (`gh workflow run flag-cron.yml` or the UI equivalent). It'll detect the transition and redeploy within minutes.

---

## Env variable overrides

Each flag has a matching `FLAG_<NAME_UPPERCASE>` env variable. Values:

| Value | Effect |
|---|---|
| `on` | Force `active` regardless of dates |
| `off` | Force `ended` regardless of dates |
| *(empty or unset)* | Use date logic |

Flag names with underscores become uppercase with underscores preserved: `homepage_countdown` → `FLAG_HOMEPAGE_COUNTDOWN`.

### Use cases

**Staging preview** — preview the real page before the date:
```bash
FLAG_TICKETS=on pnpm build
# or set FLAG_TICKETS=on in the staging env at the K8s level
```

**Emergency kill switch** — hide a page immediately without editing dates:
```bash
FLAG_CFP=off pnpm build && deploy
```
Then leave the override in place until you decide whether to roll back the date change or fix the underlying issue.

**Local development** — preview the real page locally:
```bash
# in .env.local (git-ignored)
FLAG_PROGRAMME=on
```
Then `pnpm dev` sees the override.

### Type safety

The env schema is generated from the registry via `generateFlagEnvSchema()` in `astro.config.mjs`. Adding a flag auto-adds its env var to the schema. Unknown overrides (typo in the var name) are flagged by `astro sync` / build output.

### Resolution order

```
override arg (used in tests) > env var > date window
```

If `FLAG_CFP=on` is set AND `CFP_OPENS` is in the future, the flag is `active`. The env var always wins unless a test explicitly passes an override argument to `getFlagState`.

---

## How the daily CI cron works

**Workflow:** `.github/workflows/flag-cron.yml`

```yaml
on:
  schedule:
    - cron: "5 22 * * *"   # 22:05 UTC ≈ 00:05 Europe/Paris (CEST, summer)
    - cron: "5 23 * * *"   # 23:05 UTC ≈ 00:05 Europe/Paris (CET, winter)
  workflow_dispatch:
```

Runs twice daily — DST coverage. The transition check is idempotent, so no double-deploys.

**What it does** (pseudocode of `scripts/check-flag-transitions.ts`):

```ts
for (const [name, flag] of Object.entries(FLAGS)) {
  const before = getFlagState(flag, new Date(Date.now() - 24 * 60 * 60 * 1000));
  const after  = getFlagState(flag, new Date());
  if (before !== after) {
    console.log(`${name}: ${before} → ${after}`);
    shouldRebuild = true;
  }
}
```

If `shouldRebuild === true`, the workflow invokes the main deploy pipeline. Otherwise, it exits with no side effects — safe to run daily.

**Audit trail** — every run's logs show which flags transitioned, giving you a timestamped history in GitHub Actions of every flip in production.

**Manual trigger** — if you need a redeploy out-of-band:
```bash
gh workflow run flag-cron.yml
```
Or use the GitHub UI: Actions → flag-cron → Run workflow.

---

## Testing locally

### Unit tests (clock injection)

All flag logic is pure — inject `now` in tests, no real clocks:

```ts
import { describe, test, expect } from "vitest";
import { getFlagState } from "@/lib/flags";
import { FLAGS } from "@/config/flags";

test("cfp is pending in august 2026", () => {
  expect(getFlagState(FLAGS.cfp, new Date("2026-08-15T12:00:00+02:00"))).toBe("pending");
});

test("cfp is active on open date", () => {
  expect(getFlagState(FLAGS.cfp, new Date("2026-09-01T00:00:00+02:00"))).toBe("active");
});
```

### Vitest fake clock (for route integration tests)

```ts
import { vi, beforeEach, afterEach } from "vitest";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-30"));  // pretend we're before CFP opens
});
afterEach(() => { vi.useRealTimers(); });
```

### Previewing the real page locally before its date

Set the env override in `.env.local`:

```bash
# .env.local (git-ignored)
FLAG_CFP=on
FLAG_TICKETS=on
```

Then `pnpm dev` — `/cfp` and `/tickets` render their real content even though the actual date hasn't arrived.

---

## Common recipes

### Show a new "coming soon" page that flips on date X
Add a page-kind flag with `opens: "<date>"`. Follow the page flag checklist above. Nothing else.

### Hide an element until a date
Add an element-kind flag with `opens: "<date>"`, wrap the element in `<FeatureGate>`. One-line change in each consumer.

### Show an element only during a date window
Add an element-kind flag with BOTH `opens` and `closes`. The wrapped element appears only inside the window.

### Force-activate a flag in staging
Set `FLAG_<NAME>=on` in your staging deploy's environment. Production remains unaffected.

### Kill a flag immediately without waiting for the cron
```bash
FLAG_<NAME>=off pnpm build && deploy
```
Or commit a date change pushing `closes` into the past and manually trigger `flag-cron.yml`.

### Temporarily disable a flag for a weekend
Set `FLAG_<NAME>=off` in the env, trigger a deploy. Revert (unset the env var, deploy again) when done.

### Add a permanent editorial toggle with no dates
Register the flag with no `opens` or `closes`:
```ts
show_old_testimonials: { kind: "element" },
```
Flip via env override only. Registry stays truthful about which toggles are manual vs date-driven.

---

## Troubleshooting

### "My page still shows coming-soon after the opens date"
1. Check the latest GitHub Actions `flag-cron` runs — did the cron trigger a deploy on the right date?
2. Verify the deploy succeeded (not red in CI).
3. Check if an env override is active: `FLAG_<NAME>=off` on the production environment overrides the date.
4. Verify the date string parses correctly: `new Date("2026-09-01T00:00:00+02:00")` should return a valid `Date`, not `Invalid Date`.

### "My env override isn't being picked up"
1. Env var name is `FLAG_<FLAG_NAME_UPPERCASED>`. `homepage_countdown` → `FLAG_HOMEPAGE_COUNTDOWN`. Underscores preserved.
2. Override is read at **build time**. If you set it after the build, it has no effect. Rebuild.
3. Value must be `"on"` or `"off"` exactly. `"true"`, `"1"`, `"yes"` are ignored.
4. Check `astro.config.mjs` has the flag in its generated schema — running `astro sync` regenerates types and surfaces typos.

### "The registry integrity test is failing"
Most likely causes:
- Missing i18n copy for a `kind: "page"` flag. Add `flags.<name>.soon.title` and `.body` keys in both `fr` and `en`.
- `opens` after `closes`. Typo or wrong year.
- Invalid ISO date string.

The test output identifies which flag and which rule was violated.

### "I changed a date but the old date is still in production"
Verify the deploy pipeline ran after your merge. If yes, and the flag is still stale, the browser or CDN may be caching — hard-refresh, or bump the cache.

### "The countdown shows before July 2026"
The `homepage_countdown` flag gates the element, but if the flag is mis-wired (e.g., `isFlagActive` call is missing), the countdown renders unconditionally. Grep for `CountdownTimer` and verify it's wrapped in `<FeatureGate flag="homepage_countdown">`.

---

## Known gaps

### Route-level integration tests (deferred)

The plan originally called for Vitest route-rendering tests using Astro's experimental `astro/container` API. Attempting this revealed that Vitest cannot import `.astro` files without the Astro Vite plugin configured, and wiring that plugin into `vitest.config.ts` is non-trivial in Astro 6. Unit-level coverage is strong (state machine boundaries, registry integrity, i18n completeness), so the practical fix is Playwright E2E tests driven by env overrides:

```
FLAG_CFP=on pnpm build && pnpm preview
# Then a Playwright spec visits /cfp and asserts real CFP content renders.
# Repeat with FLAG_CFP unset to assert the coming-soon branch.
```

Filed as a follow-up; does not block the feature-flag landing.

---

## Reference

- **Design spec:** `docs/superpowers/specs/2026-04-23-feature-flags-design.md`
- **Registry:** `src/config/flags.ts`
- **Evaluator:** `src/lib/flags.ts`
- **Page layout:** `src/components/flags/ComingSoonLayout.astro`
- **Element wrapper:** `src/components/flags/FeatureGate.astro`
- **CI cron:** `.github/workflows/flag-cron.yml`
- **Transition script:** `scripts/check-flag-transitions.ts`
- **Tests:** `src/lib/__tests__/flags.test.ts`, `src/lib/__tests__/flags-registry.test.ts`, route tests per page

### Stitch mockups (approved 2026-04-23)

Design system: CND France 2027 (project `14858529831105057917`, DS asset `3926684191749761173`).

| Flag | Desktop | Mobile |
|---|---|---|
| CFP | `de33933bf91f468b86dc0e30bd78d4b3` | `d45aad98eab74977b8748dd8a3656233` |
| Tickets | `a1707a1c2aaa4c46ba39f5d329c09760` | `0b5848cd51bd4a9ab7093a3cdfac802c` |
| Programme | `651e93b6e6af45398ed96499fd65ecc1` | `859a969b510f4a8a8cd2c4882c20da37` |

All six screens share a single reusable shell: full-width hero with H1 + body + "Ouverture le {date}" line + accent-pink "Être prévenu·e" CTA on the site's existing hex-mesh background. `ComingSoonLayout.astro` implements this shell; only i18n copy varies between flags.
