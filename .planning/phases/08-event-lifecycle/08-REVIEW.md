---
phase: 08-event-lifecycle
reviewed: 2026-04-13T00:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - src/lib/cfp.ts
  - src/lib/__tests__/cfp.test.ts
  - src/i18n/ui.ts
  - src/components/cfp/CfpSection.astro
  - src/components/replays/RecordingCard.astro
  - src/pages/replays/index.astro
  - src/pages/en/replays/index.astro
  - src/components/hero/CountdownTimer.tsx
  - src/components/Navigation.astro
  - src/pages/index.astro
  - src/pages/en/index.astro
  - astro.config.mjs
findings:
  critical: 0
  warning: 2
  info: 5
  total: 7
status: issues_found
---

# Phase 8: Code Review Report

**Reviewed:** 2026-04-13
**Depth:** standard
**Files Reviewed:** 12 (incl. astro.config.mjs)
**Status:** issues_found (advisory — no blockers)

## Summary

Phase 8 delivers the CFP homepage section, the /replays page, and the post-event
navigation reveal. The implementation is clean and well-documented. `src/lib/cfp.ts`
is a textbook single-source-of-truth module with tight, deterministic tests.
`TARGET_DATE` is shared with the Navigation reveal script via a `data-target-date`
attribute, which correctly avoids drift.

No **Critical** findings. Two **Warnings** concern behavioral drift risks (a
duplicated `TARGET_DATE` literal in CountdownTimer and near-duplicated
replays `index.astro` files between locales). Five **Info** items cover minor
DRY / polish opportunities.

Overall: ship-ready. All findings are advisory refactors, not blockers.

## Warnings

### WR-01: `TARGET_DATE` duplicated in CountdownTimer.tsx — drift risk

**File:** `src/components/hero/CountdownTimer.tsx:16`
**Issue:** `src/lib/cfp.ts` exists explicitly to be the single source of truth
for `TARGET_DATE` (its own docblock says "MUST match
src/components/hero/CountdownTimer.tsx so the countdown and post-event flip share
a single temporal anchor"). Yet `CountdownTimer.tsx:16` still declares its own
local `const TARGET_DATE = new Date("2027-06-03T09:00:00+02:00").getTime();`.
The file already imports `getReplaysPath` from `@/lib/cfp`, so pulling
`TARGET_DATE` from the same module costs nothing and eliminates the drift risk
the docblock is actively warning about. If someone updates the event date in
`cfp.ts`, the countdown will silently continue targeting the old date.
**Fix:**
```ts
import { getReplaysPath, TARGET_DATE } from "@/lib/cfp";
// delete local const TARGET_DATE = ...
```

### WR-02: `src/pages/replays/index.astro` and `src/pages/en/replays/index.astro` are byte-near-identical

**File:** `src/pages/replays/index.astro` and `src/pages/en/replays/index.astro`
**Issue:** The two locale pages are structurally identical (same imports, same
`trackColor`, same header, same render tree). Only the language inferred via
`getLangFromUrl(Astro.url)` differs — and that is already locale-aware. Any
future change (empty-state polish, header adjustment, track grouping tweak) has
to be applied in both files, and the diff will trigger WR-style findings in
future phases. The cleanest fix is to extract a single `ReplaysPage.astro`
component and have both route files render it. A lighter fix is to extract
just `trackColor` (now triplicated: ScheduleGrid, RecordingCard, both replay
pages) into `src/lib/schedule.ts` or a small utility module.
**Fix:** Either
```astro
---
// src/pages/replays/index.astro (and en/replays/index.astro)
import ReplaysPage from "@/components/replays/ReplaysPage.astro";
---
<ReplaysPage />
```
or, minimally, export `trackColor` once from `@/lib/schedule.ts` and import it
in all three call sites.

## Info

### IN-01: `trackColor` is triplicated verbatim

**File:** `src/components/replays/RecordingCard.astro:17-25`,
`src/pages/replays/index.astro:25-32`, `src/pages/en/replays/index.astro:24-31`
(and originally `src/components/schedule/ScheduleGrid.astro:95-103`).
**Issue:** Same 7-line hash-to-HSL function copy-pasted four times, with a
comment that explicitly notes "Duplicated (not imported) to keep this component
self-contained." That rationale is weak once a third and fourth copy appear.
**Fix:** Export `trackColor(name: string): string` from `@/lib/schedule.ts`
alongside `SessionRow` and `loadSessions`. Import in all four call sites.

### IN-02: `CountdownTimer` `updateAriaLabel` always-true guard

**File:** `src/components/hero/CountdownTimer.tsx:44`
**Issue:** The condition `now - lastAriaUpdate.current >= 60000 || lastAriaUpdate.current === 0`
is fine, but the `lastAriaUpdate.current = 0;` set on line 60 just before the
initial call is a subtle pattern: it works because line 44's second clause
catches it, but a reader has to trace two scopes to see why. A clearer form is
to always run the first update and then gate subsequent ones by elapsed time.
Not a bug — just a readability nit. (Pre-existing; untouched by Phase 8 beyond
adding the `getReplaysPath` import.)
**Fix:** Optional — simplify to an explicit `isFirst` flag or rely solely on
the 60s threshold check.

### IN-03: `CfpSection.astro` — `hasRealConferenceHall` hides *both* CTAs when URL is a placeholder

**File:** `src/components/cfp/CfpSection.astro:19,57-81,117-124`
**Issue:** When `CONFERENCE_HALL_URL` still contains `TODO_EVENT_ID`, both the
"Submit a talk" (state=open) CTA and the "Notify me" (state=coming-soon) CTA
are suppressed. The coming-soon "Notify me" button does not actually point to
Conference Hall semantically — it's a notify/subscribe flow — so gating it on
`hasRealConferenceHall` couples two independent things. In the current
coming-soon state this leaves the section with heading + description only, no
action. Probably acceptable (the description says "Inscrivez-vous pour être
notifié·e" but offers nothing to click), but worth flagging. If there's a
future newsletter/notify URL, it should be a separate constant.
**Fix:** Split into `CFP_NOTIFY_URL` (e.g., newsletter signup) and
`CONFERENCE_HALL_URL`, or explicitly document that the coming-soon CTA is
intentionally hidden until a notify mechanism exists.

### IN-04: `CfpSection.astro` — `aria-label` on the status pill duplicates visible text

**File:** `src/components/cfp/CfpSection.astro:30,90`
**Issue:** The status pill `<span>` has both visible text (`{t("cfp.status.open")}`)
and `aria-label={ariaOpen}` where `ariaOpen = "${t('cfp.status.open')} — ${t('cfp.description.open')}"`.
Since the description is already rendered in the visible `<p>` below, the
screen-reader-only `aria-label` on the pill causes it to announce the
description twice (once via the pill, once when reaching the `<p>`). Minor UX
nit for assistive tech.
**Fix:** Drop `aria-label` from the pill — the visible text is sufficient,
and the following `<p>` carries the description. Or, if enrichment is desired,
use `aria-describedby` pointing to the `<p>`.

### IN-05: `Navigation.astro` reveal script — `targetDate` falsy on NaN but condition still safe

**File:** `src/components/Navigation.astro:170-179`
**Issue:** `Number(undefined)` is `NaN`, and `NaN > targetDate` is always `false`
— so the guard is robust. However, the short-circuit `if (targetDate && ...)` is
slightly misleading: `NaN` is falsy, which is the only reason this works (and
`0` would also be falsy, correctly skipping the reveal). Not a bug. Consider
`Number.isFinite(targetDate)` for explicitness.
**Fix:**
```ts
if (Number.isFinite(targetDate) && Date.now() > targetDate) { ... }
```

---

## Notes on scope explicitly not flagged

- **`loadSessions()` called on every request at build time** — fine, it's a
  build-time SSG page; no runtime cost.
- **`new Intl.DateTimeFormat(...)` called per-render** — negligible; Phase 8
  scope excludes perf.
- **CountdownTimer's 1s `setInterval`** — pre-existing Phase 2 behavior,
  unchanged by Phase 8.
- **`session.recordingUrl !== ""`** — confirmed `recordingUrl` is always a
  string per `src/lib/schedule.ts:28,157`, so the filter is safe (no undefined
  access).
- **Sitemap filter regex** — `/\/replays\/?$/` correctly matches both
  `/replays` and `/replays/`, and the `/en/` variant is handled by a second
  alternation. Trailing-slash-agnostic, LGTM.
- **`i18n/ui.ts`** — 17 new keys added consistently in both `fr` and `en`
  blocks; parity checked visually. No orphan keys.

---

_Reviewed: 2026-04-13_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
