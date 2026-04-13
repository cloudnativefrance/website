---
phase: 08-event-lifecycle
plan: 01
subsystem: event-lifecycle
tags: [cfp, i18n, config, replays, lifecycle]
dependency_graph:
  requires:
    - src/components/hero/CountdownTimer.tsx (TARGET_DATE parity)
    - src/i18n/utils.ts (getLocalePath pattern — mirrored, not imported)
  provides:
    - "@/lib/cfp — CFP state machine + replays path helper + single temporal anchor"
    - "17 new i18n keys (cfp.*, replays.*, nav.replays) in FR + EN"
  affects:
    - Phase 08-03 (CFP homepage section — imports from @/lib/cfp)
    - Phase 08-04 (/replays page + Navigation link — imports getReplaysPath, isPostEvent)
    - CountdownTimer rewire (08-04 replaces href="#replays" with getReplaysPath(lang))
tech_stack:
  added: []
  patterns:
    - "Build-time + client-runtime parity — CFP state derived from ISO date constants, same logic both contexts"
    - "Staff-editable config — three constants in src/lib/cfp.ts with a TODO(staff) marker are the only CFP edit surface (D-02)"
    - "Dependency-free config module — cfp.ts has zero imports so it can load in .astro and .tsx alike without pulling i18n"
key_files:
  created:
    - src/lib/cfp.ts
    - src/lib/__tests__/cfp.test.ts
  modified:
    - src/i18n/ui.ts
decisions:
  - "Kept cfp.ts dependency-free (no import of getLocalePath) — duplicated the 2-line path logic instead so the module stays safe for any context"
  - "Used UTF-8 literals (é, è, ô, ü) in new i18n keys, matching the dominant style of recent additions (sponsors, team, legal, footer) rather than the older \\uXXXX escapes"
  - "getCfpState treats both endpoints as inclusive (open when CFP_OPENS <= now <= CFP_CLOSES) — simpler mental model than half-open ranges"
metrics:
  duration: "~8 min"
  completed: "2026-04-13"
  commits: 3
requirements: [EVNT-04]
---

# Phase 08 Plan 01: CFP Config + i18n Keys Summary

Foundation module for Phase 8: `src/lib/cfp.ts` centralises the CFP date window, the post-event temporal anchor, and the locale-aware `/replays` path helper — giving staff a single file to edit when the CFP window is confirmed and giving downstream plans (08-03, 08-04) one import point instead of ad-hoc constants.

## What Shipped

### `src/lib/cfp.ts` (new)

Exports:

| Symbol | Type | Purpose |
|---|---|---|
| `TARGET_DATE` | `number` | Epoch ms of `2027-06-03T09:00:00+02:00`. Matches the CountdownTimer constant byte-for-byte so the countdown and the post-event flip cannot drift. |
| `CFP_OPENS` | `Date` | Placeholder ISO date (`2026-09-01T00:00:00+02:00`). Staff edits to activate CFP window. |
| `CFP_CLOSES` | `Date` | Placeholder ISO date (`2027-02-28T23:59:59+01:00`). Staff edits to close CFP window. |
| `CONFERENCE_HALL_URL` | `string` | Placeholder URL to the Conference Hall event page. Staff replaces `TODO_EVENT_ID`. |
| `CfpState` | type | `"coming-soon" \| "open" \| "closed"` |
| `getCfpState(now?)` | function | Pure state computation — comparing `now.getTime()` against the two date constants. Both endpoints inclusive. |
| `getReplaysPath(lang)` | function | `"fr"` → `/replays`, `"en"` → `/en/replays`. |
| `isPostEvent(now?)` | function | `now.getTime() > TARGET_DATE`. |

A visible `TODO(staff):` comment marks the three placeholders so the handoff surface is obvious.

### `src/i18n/ui.ts` (modified)

Added 17 new keys in both `ui.fr` and `ui.en` blocks with the exact UI-SPEC locked copy:

- `nav.replays` — placed next to other `nav.*` keys
- `cfp.heading`, `cfp.status.coming_soon`, `cfp.status.open`, `cfp.status.closed`, `cfp.description.coming_soon`, `cfp.description.open`, `cfp.closed.note`, `cfp.cta.notify`, `cfp.cta.submit`, `cfp.deadline` — grouped after `keynumbers.*`, before `speakers.*`
- `replays.heading`, `replays.lead`, `replays.back_to_schedule`, `replays.empty.heading`, `replays.empty.body`, `replays.watch` — grouped after `schedule.*`, before `team.*`

### Tests

`src/lib/__tests__/cfp.test.ts` — 14 vitest assertions covering every export and every boundary (before-open, at-open, mid, at-close, after-close, no-arg defaults, locale mapping, post-event polarity). All 14 pass.

## How to Edit Placeholder Dates

Staff flipping the CFP state only touches **three lines** in `src/lib/cfp.ts`:

```ts
export const CFP_OPENS = new Date("2026-09-01T00:00:00+02:00");
export const CFP_CLOSES = new Date("2027-02-28T23:59:59+01:00");
export const CONFERENCE_HALL_URL = "https://conference-hall.io/public/event/TODO_EVENT_ID";
```

Everything else (homepage section, CTA labels, deadline display, closed degradation) reads from these constants + the i18n keys. No other file needs to change to open or close the CFP window.

## Commits

| Hash | Type | Scope |
|---|---|---|
| `4e952c1` | test | RED — failing test for CFP state machine and replays path helper |
| `4c6da3a` | feat | GREEN — implement CFP state machine and replays path helper |
| `0f94bc6` | feat | 17 CFP + replays + nav i18n keys in FR and EN |

## Verification

- [x] `grep -c` returns 2 for every one of the 17 new keys in `src/i18n/ui.ts`
- [x] `grep -q "Submit a talk"`, `"Soumettre une conférence"`, `"CFP clôturé"`, `"CFP closed"` all pass
- [x] `src/lib/cfp.ts` grep acceptance criteria all pass (TARGET_DATE, CFP_OPENS, CFP_CLOSES, CONFERENCE_HALL_URL, getCfpState, getReplaysPath, isPostEvent, TODO(staff), 2027-06-03T09:00:00+02:00)
- [x] `pnpm astro check` reports zero errors involving `cfp.ts` or `ui.ts` (33 pre-existing errors in `src/pages/speakers/index.astro` are out of scope — see deferred-items.md)
- [x] `pnpm test src/lib/__tests__/cfp.test.ts` — 14/14 pass
- [x] No UI changes — homepage and /programme render identically

## Deviations from Plan

None — plan executed exactly as written. UTF-8 vs. `\uXXXX` style was a small judgment call explicitly allowed by the plan ("pick the style dominant in the same locale block"); chose UTF-8 to match recent additions.

## Deferred Issues

- 33 pre-existing `pnpm astro check` errors in `src/pages/speakers/index.astro` (missing `talkTitle` property). Not introduced by this plan. Logged in `.planning/phases/08-event-lifecycle/deferred-items.md`.
- Pre-existing failures in `tests/build/speaker-profile.test.ts` and `tests/build/speaker-talks.test.ts` (SPKR-02/03 suites). Not introduced by this plan. Logged in deferred-items.md.

## Self-Check: PASSED

- FOUND: `src/lib/cfp.ts`
- FOUND: `src/lib/__tests__/cfp.test.ts`
- FOUND: `src/i18n/ui.ts` (modified — 17 new keys each appear twice)
- FOUND commit: `4e952c1` (RED test)
- FOUND commit: `4c6da3a` (GREEN implementation)
- FOUND commit: `0f94bc6` (i18n keys)
