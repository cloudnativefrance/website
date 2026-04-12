---
phase: 11-security-i18n-hardcode-fixes
plan: 01
subsystem: i18n
tags: [i18n, strings, foundation]
requirements: [IN-02, WR-01]
dependency_graph:
  requires:
    - src/i18n/utils.ts::useTranslations
    - src/i18n/ui.ts (existing flat dictionary shape)
  provides:
    - i18n-key::countdown.aria_template
    - i18n-key::talks.track.cloud-infra
    - i18n-key::talks.track.devops-platform
    - i18n-key::talks.track.security
    - i18n-key::talks.track.community
    - i18n-key::schedule.agenda.remove
  affects:
    - src/components/hero/CountdownTimer.tsx (Plan 11-02 consumer)
    - src/components/speakers/SpeakerCard.astro (Plan 11-02 consumer)
    - src/components/speakers/TalkCard.astro (Plan 11-02 consumer)
    - src/components/schedule/ScheduleGrid.astro (Plan 11-03 consumer)
tech_stack:
  added: []
  patterns:
    - flat-dot-delimited-i18n-dictionary (extended)
    - placeholder-template-for-locale-safe-aria-labels (countdown.aria_template)
    - english-verbatim-via-i18n-keys (D-03 track names)
key_files:
  created: []
  modified:
    - src/i18n/ui.ts
decisions:
  - D-03 applied: talks.track.* values are English-verbatim in both FR and EN locales (CNCF community convention), but routed through i18n keys so future rephrasing is a one-file edit.
  - countdown.aria_template uses placeholder tokens ({days}, {daysLabel}, etc.) rather than glue-word concatenation, per research Pattern 2 — enables proper FR word order ("Plus que X jours, Y heures et Z minutes").
metrics:
  duration: ~6min
  completed: 2026-04-12
  tasks_completed: 1
  files_touched: 1
  entries_added: 12
---

# Phase 11 Plan 01: i18n Key Foundation — Summary

## One-liner

Extended `src/i18n/ui.ts` with 6 new keys (12 entries across FR+EN) that Plan 11-02 and Plan 11-03 will consume — countdown aria template, four talks.track.* values, and schedule.agenda.remove.

## Work Done

### Task 1 — Add six new i18n keys to both fr and en branches

Commit: `3713a0f`

Added to both the `fr` and `en` sibling objects in `src/i18n/ui.ts`:

| Key | FR value | EN value |
|---|---|---|
| `countdown.aria_template` | `"Plus que {days} {daysLabel}, {hours} {hoursLabel} et {minutes} {minutesLabel}"` | `"{days} {daysLabel}, {hours} {hoursLabel}, {minutes} {minutesLabel} remaining"` |
| `talks.track.cloud-infra` | `"Cloud & Infra"` | `"Cloud & Infra"` |
| `talks.track.devops-platform` | `"DevOps & Platform"` | `"DevOps & Platform"` |
| `talks.track.security` | `"Security"` | `"Security"` |
| `talks.track.community` | `"Community"` | `"Community"` |
| `schedule.agenda.remove` | `"Retirer"` | `"Remove"` |

**Placement preserved existing namespace grouping:**
- `countdown.aria_template` inserted after `countdown.seconds` in both branches.
- `talks.track.*` inserted between the last `speakers.*` entry (`speakers.not_found`) and the first `venue.*` entry — keeps them siblings of speaker-oriented content but namespaced `talks.*` to avoid colliding with schedule free-text track names.
- `schedule.agenda.remove` inserted directly after `schedule.agenda.empty`.

No existing keys reordered, renamed, or removed. File still ends with `} as const;`.

## Acceptance Criteria Results

| Criterion | Result |
|---|---|
| `grep -c '"countdown.aria_template"' ui.ts` = 2 | PASS (2) |
| `grep -c '"talks.track.cloud-infra"' ui.ts` = 2 | PASS (2) |
| `grep -c '"talks.track.devops-platform"' ui.ts` = 2 | PASS (2) |
| `grep -c '"talks.track.security"' ui.ts` = 2 | PASS (2) |
| `grep -c '"talks.track.community"' ui.ts` = 2 | PASS (2) |
| `grep -c '"schedule.agenda.remove"' ui.ts` = 2 | PASS (2) |
| `grep '"talks.track.cloud-infra": "Cloud & Infra"' ui.ts` = 2 lines (D-03 verbatim) | PASS |
| `grep '"schedule.agenda.remove": "Retirer"' ui.ts` = 1 line | PASS |
| `grep '"schedule.agenda.remove": "Remove"' ui.ts` = 1 line | PASS |
| File ends with `} as const;` | PASS |
| `pnpm astro check` exits 0 | **FAIL** — see Deviations below. Errors are pre-existing and unrelated to `ui.ts`. Zero new errors introduced by this edit. |

## Deviations from Plan

### Observed (not auto-fixed — out of scope)

**1. [Out-of-scope] Pre-existing `pnpm astro check` errors in unrelated files**
- **Found during:** Task 1 verification (`pnpm astro check`).
- **Observation:** 31 TypeScript errors reported by `astro check`, located in:
  - `src/content.config.ts`
  - `src/pages/speakers/index.astro` (properties `talkTitle`, `talkTrack`, `talkDuration` missing from inferred speaker type)
  - `src/pages/en/speakers/index.astro` (same)
  - `src/lib/__tests__/speakers.test.ts`
- **Confirmed pre-existing:** `git stash push -- src/i18n/ui.ts && pnpm astro check` reproduced the same **31 errors** without this plan's edit. Zero errors originate from `src/i18n/ui.ts`.
- **Decision:** Documented in `deferred-items.md` and left for a future cleanup plan or the phase verifier. Scope boundary applies — these errors are not caused by Plan 11-01's changes.
- **Impact on downstream plans:** None. The new keys are valid members of the flat dictionary; `useTranslations` will resolve them; Plan 11-02 / 11-03 can call `t("countdown.aria_template")`, `` t(`talks.track.${track}` as any) ``, and `t("schedule.agenda.remove")` with proper typing.

No auto-fix applied (Rules 1–3 scope: "only directly caused by current task's changes"). No architectural ask (Rule 4) warranted — fix belongs to a separate cleanup plan.

## Deferred Issues

Logged in `.planning/phases/11-security-i18n-hardcode-fixes/deferred-items.md`:
- 31 pre-existing `astro check` errors in speaker index pages + content config + speakers test.

## Known Stubs

None. All added entries are final user-facing copy (FR localized where needed; track names English-verbatim per D-03).

## Self-Check: PASSED

- `src/i18n/ui.ts` contains all 6 new keys × 2 locales = 12 entries (verified by grep counts above)
- Commit `3713a0f` exists: confirmed via `git log --oneline -1` → `3713a0f feat(11-01): add i18n keys...`
- `src/i18n/ui.ts` still ends with `} as const;`
- No existing keys removed or reordered (diff is purely additive, +14 lines)
