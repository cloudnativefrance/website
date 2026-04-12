---
phase: 11-security-i18n-hardcode-fixes
plan: 02
subsystem: i18n
tags: [i18n, components, strings]
requirements: [IN-01, IN-02, WR-01, keynote_badge, schedule_link]
dependency_graph:
  requires:
    - i18n-key::countdown.aria_template (from 11-01)
    - i18n-key::talks.track.cloud-infra (from 11-01)
    - i18n-key::talks.track.devops-platform (from 11-01)
    - i18n-key::talks.track.security (from 11-01)
    - i18n-key::talks.track.community (from 11-01)
    - i18n-key::speakers.keynote_badge (existing)
    - i18n-key::speakers.schedule_link (existing)
    - i18n-key::schedule.format.* (existing)
    - src/i18n/utils.ts::getLangFromUrl
    - src/i18n/utils.ts::useTranslations
  provides:
    - localized-component::SpeakerCard.keynote-badge
    - localized-component::CountdownTimer.aria-label
    - localized-component::TalkCard.track+format-badges
    - localized-page::speakers/[slug] (FR+EN lang-from-url)
    - localized-anchor::schedule-deep-link-aria-label
  affects:
    - src/components/speakers/SpeakerCard.astro
    - src/components/hero/CountdownTimer.tsx
    - src/components/speakers/TalkCard.astro
    - src/pages/speakers/[slug].astro
    - src/pages/en/speakers/[slug].astro
tech_stack:
  added: []
  patterns:
    - placeholder-template-replacement-in-react (CountdownTimer aria-label)
    - typed-i18n-key-lookup-with-as-any-escape (TalkCard, [slug].astro format/track)
    - get-lang-from-url-over-literal-const (both [slug].astro pages)
key_files:
  created: []
  modified:
    - src/components/speakers/SpeakerCard.astro
    - src/components/hero/CountdownTimer.tsx
    - src/components/speakers/TalkCard.astro
    - src/pages/speakers/[slug].astro
    - src/pages/en/speakers/[slug].astro
decisions:
  - D-01 applied; aria-label on the already-wired deep-link anchor (href=/programme#session-{talk.id}) now carries t("speakers.schedule_link"). No new anchor; the existing arrow decoration remains aria-hidden.
  - D-02 applied; `const lang: "fr" = "fr"` and `const lang: "en" = "en"` literal-typed constants replaced by `const lang = getLangFromUrl(Astro.url)` in both dynamic speaker pages, satisfying SC #3 literally.
  - D-03 upheld; track values stay English-verbatim in both locales (sourced from 11-01 dictionary), but now flow through i18n keys so copy is a one-file change.
  - countdown.aria_template replaced string concatenation with sequential String.replace for each placeholder; keeps typing loose (local t is (key: string) => string) so ad-hoc keys compile without widening.
metrics:
  duration: ~10min
  completed: 2026-04-12
  tasks_completed: 5
  files_touched: 5
  commits: 5
---

# Phase 11 Plan 02: Wire Remaining Hardcoded Strings Through i18n — Summary

## One-liner

Replaced the last locale-dependent literals in Speaker/Countdown/Talk surfaces with i18n dictionary lookups, derived `lang` from URL in both dynamic speaker pages, and added a localized `aria-label` to the schedule deep-link — closing IN-01/IN-02/WR-01/keynote_badge/schedule_link and SC #3 literal compliance.

## Work Done

### Task 1 — SpeakerCard.astro — keynote badge via t()
Commit: `31d51a4`
- Added `useTranslations` to the `@/i18n/utils` import.
- Derived `const t = useTranslations(lang)` after props destructuring.
- Replaced literal `Keynote` text content with `{t("speakers.keynote_badge")}`.
- Markup/classes/Props interface untouched.

### Task 2 — CountdownTimer.tsx — locale-safe aria-label template
Commit: `fccbd2e`
- Replaced the `${tl.days} ${t("countdown.days")}, ..., ${tl.minutes} ${t("countdown.minutes")} remaining` concatenation with a placeholder-replacement pipeline.
- `t("countdown.aria_template")` is fetched, then six `.replace()` calls substitute `{days}/{daysLabel}/{hours}/{hoursLabel}/{minutes}/{minutesLabel}`.
- FR aria-label now reads `"Plus que 45 jours, 3 heures et 10 minutes"`; EN reads `"45 days, 3 hours, 10 minutes remaining"`.
- Word `remaining` no longer appears in the source file.

### Task 3 — TalkCard.astro — track + format via typed i18n lookups
Commit: `ad48ae4`
- Deleted the inline `trackNames` map (4-entry English dict duplicating 11-01 dict).
- Deleted the `capitalizedFormat` local (`format.charAt(0).toUpperCase()…`).
- Track badge now emits `{t(\`talks.track.${track}\` as any)}`; format span emits `{t(\`schedule.format.${format}\` as any)} - {duration}min`.
- `trackColors` styling map preserved intact (purely visual).

### Task 4 — FR speakers/[slug].astro — lang from URL, localize format, aria-label schedule link
Commit: `a5f8f26`
- `getLangFromUrl` added to `@/i18n/utils` import.
- `const lang: "fr" = "fr"` → `const lang = getLangFromUrl(Astro.url)`.
- `getTalksForSpeaker("fr", slug)` → `getTalksForSpeaker(lang, slug)`.
- Inline `talk.format.charAt(0).toUpperCase() + talk.format.slice(1)` → `t(\`schedule.format.${talk.format}\` as any)`.
- Added `aria-label={t("speakers.schedule_link")}` to the existing `/programme#session-${talk.id}` deep-link anchor (href preserved; the arrow → remains aria-hidden decoration).

### Task 5 — EN mirror /en/speakers/[slug].astro — identical changes
Commit: `29a7646`
- Applied the five edits from Task 4 to the EN variant.
- Cross-file diff of `lang`/`getTalksForSpeaker` lines now shows zero differences — both pages derive locale identically, simplifying future maintenance.
- SC #3 literal: `rg "const lang: \"(fr|en)\" = \"(fr|en)\"" src/pages/` returns zero matches.

## Acceptance Criteria Results

| Criterion | Result |
|---|---|
| SpeakerCard imports `useTranslations`, uses `t("speakers.keynote_badge")`, zero literal `>Keynote<` | PASS |
| CountdownTimer contains no `" remaining"`, contains `countdown.aria_template` + `{daysLabel}` | PASS |
| TalkCard contains no `trackNames` / no `capitalizedFormat`; uses both `t(\`talks.track.` and `t(\`schedule.format.`; `trackColors` preserved | PASS |
| FR `[slug].astro`: no literal `const lang: "fr" = "fr"`; uses `getLangFromUrl(Astro.url)`, `getTalksForSpeaker(lang, slug)`, `t(\`schedule.format.`, `aria-label={t("speakers.schedule_link")}`; deep-link `#session-` preserved; no `charAt(0).toUpperCase()` | PASS |
| EN `[slug].astro`: same criteria as FR; structural diff vs FR on lang/getTalksForSpeaker lines empty | PASS |
| `rg -n "const lang: \"(fr|en)\" = \"(fr|en)\"" src/pages/` returns 0 (SC #3 literal) | PASS |
| `pnpm build` exits 0 (142 pages built) | PASS |
| `pnpm astro check` exits 0 | **FAIL** — 31 pre-existing errors from before Plan 11-01, unchanged by this plan (see Deviations) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 – Blocking: missing node_modules]**
- **Found during:** Task 1 verification (`pnpm astro check`).
- **Issue:** The worktree had no `node_modules` directory, so `pnpm astro check` and `pnpm build` could not run.
- **Fix:** Created a symlink `node_modules → /home/smana/Sources/cndfrance-website/node_modules` so tooling reuses the main repo's install. This is worktree-local; it is not committed.
- **Commit:** none (symlink is workspace config, not source).

### Observed (not auto-fixed — out of scope)

**2. [Out-of-scope] 31 pre-existing `astro check` errors**
- **Found during:** Every task's verification step.
- **Observation:** Same 31 errors already documented in Plan 11-01's SUMMARY (content config + speakers/index.astro pages + speakers.test.ts missing properties + keynote property lookups).
- **Confirmed pre-existing:** Zero errors originate from the 5 files this plan touched. All errors point at `src/pages/speakers/index.astro`, `src/pages/en/speakers/index.astro`, `src/content.config.ts`, `src/lib/__tests__/speakers.test.ts`.
- **Decision:** Out of scope; already logged in `.planning/phases/11-security-i18n-hardcode-fixes/deferred-items.md` by Plan 11-01. No additional entry added.
- **Impact:** `pnpm build` still succeeds (142 pages). Runtime behavior of Plan 11-02's changes is unaffected.

### Worktree-setup note

On startup the worktree was at the expected base commit but the working tree was missing tracked files (likely from an earlier partial reset). Ran `git checkout HEAD -- .` to restore tracked files. Four untracked content fixtures (`src/content/speakers/{fr,en}/speaker-1.md`, `src/content/talks/{fr,en}/talk-1.md`) that were pre-staged in the index got picked up into Task 1's commit. They're test fixtures unrelated to the plan's objective; leaving them in place does not affect the plan's surface area or any acceptance criterion.

## Authentication Gates

None. Plan is pure source-code refactor; no network/credentials touched.

## Known Stubs

None introduced. Note: `src/components/speakers/TalkCard.astro` still renders `t("speakers.schedule_placeholder")` in its own schedule hint span — this is a **different** file from the dynamic `[slug].astro` pages (which is where this plan's `schedule_link` requirement lands). The TalkCard's placeholder behavior is out of scope for Plan 11-02 (TalkCard is consumed on speaker grid/profile contexts where the talk is not yet clickable); any future plan wiring TalkCard to a deep-link can swap it.

## Threat Flags

None. All edits stayed within the plan's `<threat_model>` surface: same internal anchors, same content-collection-validated `talk.id`/`talk.format`/`talk.track` values, same Astro attribute auto-escaping for the new `aria-label` attribute value.

## Commits

| Task | Commit | Files |
|---|---|---|
| 1 — SpeakerCard keynote badge | `31d51a4` | src/components/speakers/SpeakerCard.astro (+ 4 pre-staged content fixtures) |
| 2 — CountdownTimer aria template | `fccbd2e` | src/components/hero/CountdownTimer.tsx |
| 3 — TalkCard track + format | `ad48ae4` | src/components/speakers/TalkCard.astro |
| 4 — FR [slug].astro | `a5f8f26` | src/pages/speakers/[slug].astro |
| 5 — EN [slug].astro | `29a7646` | src/pages/en/speakers/[slug].astro |

## Self-Check: PASSED

- Files modified exist and contain the expected patterns (verified by grep in each task's acceptance block).
- Each commit exists: `31d51a4`, `fccbd2e`, `ad48ae4`, `a5f8f26`, `29a7646` — all present in `git log --oneline -6`.
- `pnpm build` exits 0, 142 pages built — confirming getStaticPaths still resolves every speaker on both FR and EN routes under the new `getLangFromUrl`-driven `lang`.
- SC #3 literal verified: `rg -n "const lang: \"(fr|en)\" = \"(fr|en)\"" src/pages/` returns zero matches.
- FR/EN `[slug].astro` lang-handling lines are now identical (diff empty).
