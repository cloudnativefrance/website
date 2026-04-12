---
phase: 11
slug: security-i18n-hardcode-fixes
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-12
approved: 2026-04-12
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x (already in devDependencies) — but Phase 11 relies on `astro check` + `astro build` as the primary validator |
| **Config file** | `vitest.config.*` (optional — no unit tests added in this phase; build IS the test) |
| **Quick run command** | `pnpm astro check` (~3s, catches typed i18n-key regressions) |
| **Full suite command** | `pnpm astro check && pnpm build` (~25s total, validates all pages render) |
| **Estimated runtime** | ~25 seconds |

Rationale: every modified surface in Phase 11 is a string swap where the typed `useTranslations` key inference catches missing keys at `astro check` time, and `astro build` walks every dynamic `getStaticPaths` route in both FR and EN. Adding Vitest units for literal replacements would duplicate the build's coverage at higher cost.

---

## Sampling Rate

- **After every task commit:** Run `pnpm astro check` (quick — per-task grep acceptance criteria embed the checks already)
- **After every plan wave:** Run `pnpm astro check && pnpm build`
- **Before `/gsd-verify-work`:** Full suite must be green + manual FR/EN spot-check (/, /en/, /speakers/*, /en/speakers/*, /programme, /en/programme)
- **Max feedback latency:** 25 seconds

---

## Per-Task Verification Map

| Task ID   | Plan | Wave | Requirement(s)                   | Threat Ref   | Secure Behavior                                                                                     | Test Type  | Automated Command | File Exists | Status     |
|-----------|------|------|----------------------------------|--------------|------------------------------------------------------------------------------------------------------|------------|---------------------------------------------------------------------------------------------------------------------------------|------------|------------|
| 11-01-01  | 01   | 1    | IN-02, WR-01                     | T-11-01/02   | New i18n values are plain text (no HTML) — safe for Astro `{expr}` + React child interpolation      | grep+check | `test $(grep -c '"countdown.aria_template"' src/i18n/ui.ts) -eq 2 && ... && pnpm astro check` (see 11-01-PLAN verify block)       | ✅         | ⬜ pending |
| 11-02-01  | 02   | 2    | keynote_badge                    | —            | N/A (pure string swap; Astro auto-escapes `{t(...)}`)                                               | grep+check | `grep -q 't("speakers.keynote_badge")' src/components/speakers/SpeakerCard.astro && ! grep -Pq '>\s*Keynote\s*<' ... && pnpm astro check` | ✅         | ⬜ pending |
| 11-02-02  | 02   | 2    | WR-01                            | —            | React child interpolation of i18n values — auto-escaped                                              | grep+check | `! grep -q '" remaining"' src/components/hero/CountdownTimer.tsx && grep -q 'countdown.aria_template' ... && pnpm astro check`  | ✅         | ⬜ pending |
| 11-02-03  | 02   | 2    | IN-02                            | —            | Typed `as any` cast follows repo precedent (ScheduleGrid.astro:168,227) — build fails if key absent | grep+check | `! grep -q 'trackNames' src/components/speakers/TalkCard.astro && grep -q 't(\`talks.track.' ... && pnpm astro check`            | ✅         | ⬜ pending |
| 11-02-04  | 02   | 2    | IN-01, schedule_link             | T-11-03/04/05| href is content-sourced (`talk.id`), aria-label is plain i18n text — both auto-escaped by Astro     | grep+check | `grep -q 'const lang = getLangFromUrl(Astro.url);' 'src/pages/speakers/[slug].astro' && grep -q 'aria-label={t("speakers.schedule_link")}' ... && pnpm astro check` | ✅         | ⬜ pending |
| 11-02-05  | 02   | 2    | IN-01, schedule_link             | T-11-03/04/05| Same as 11-02-04 (EN mirror)                                                                         | grep+check | Mirror of 11-02-04 on `src/pages/en/speakers/[slug].astro` + `rg -n "const lang: \"(fr\|en)\" = \"(fr\|en)\"" src/pages/` = zero matches + `pnpm build` | ✅         | ⬜ pending |
| 11-03-01  | 03   | 2    | IN-02                            | T-11-06/09   | `agendaRemoveLabel` flows into `innerHTML` template — mitigated by code-reviewed i18n source         | grep+check | `grep -q 'data-schedule-format-keynote={t("schedule.format.keynote")}' src/components/schedule/ScheduleGrid.astro && ! grep -q 'label: "KEYNOTE"' ... && pnpm build` | ✅         | ⬜ pending |
| 11-03-02  | 03   | 2    | CR-01, WR-02                     | T-11-07      | Audit-only: confirms `safeUrl()` scheme allowlist intact + twitter anchor rendered                  | grep       | `grep -q 'safeUrl' src/components/speakers/SocialLinks.astro && grep -Eq 'protocol === "http:"\|protocol === "https:"' ... && [ -z "$(git status --porcelain src/components/speakers/SocialLinks.astro)" ]` | ✅         | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No new test infrastructure needed. `pnpm astro check` and `pnpm build` are already wired (verified via `package.json` scripts: `"astro": "astro"`, `"build": "astro build"`). Vitest is installed but no phase-specific units are added — the build's typed i18n-key enforcement plus the per-task grep acceptance checks provide sufficient coverage for string-swap work.

**Confirmation completed during planning:**
- [x] `package.json` `scripts.build` = `astro build` (verified)
- [x] `package.json` `scripts.astro` = `astro` (supports `pnpm astro check`) (verified)
- [x] Vitest 4.1.4 in devDependencies (verified; unused for this phase)

---

## Manual-Only Verifications

| Behavior                                                                                              | Requirement(s)     | Why Manual                                               | Test Instructions                                                                                                                                                                                                                     |
|--------------------------------------------------------------------------------------------------------|--------------------|----------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| FR homepage countdown aria-label reads naturally ("Plus que 45 jours, 3 heures et 10 minutes")         | WR-01              | Screen-reader output / accessibility tree inspection     | `pnpm dev`, open `/`, devtools → inspect `<div role="timer">`, read `aria-label`. Expect "Plus que ..." construct.                                                                                                                     |
| EN homepage countdown aria-label reads naturally ("45 days, 3 hours, 10 minutes remaining")            | WR-01              | Same                                                     | Same on `/en/`.                                                                                                                                                                                                                       |
| Keynote badge pill renders on keynote speakers in both locales                                         | keynote_badge      | Visual presence check                                    | Visit `/speakers/` and `/en/speakers/`, locate any `isKeynote=true` speaker (e.g., opening keynote), confirm "Keynote" pill is visible.                                                                                                 |
| Talk row on speaker profile shows localized format + duration ("Keynote · 30 min")                     | IN-02              | Visual layout check                                      | Visit `/speakers/<keynote-slug>` and `/en/speakers/<keynote-slug>`, confirm talk row reads "Keynote · 30 min" (FR) and "Keynote · 30 min" (EN) — same because schedule.format.keynote is "Keynote" in both dictionaries.                |
| Schedule link anchor on speaker profile has `aria-label="Voir dans le programme"` (FR)                  | schedule_link      | Accessibility tree / devtools attribute inspect           | Visit `/speakers/<slug>`, hover the talk link, devtools → inspect `<a>` → confirm `aria-label="Voir dans le programme"` (and "View in schedule" on `/en/speakers/<slug>`).                                                             |
| Schedule deep-link actually anchors to the right session after click                                    | schedule_link      | Page scroll + session card focus check                    | From `/speakers/<slug>`, click talk link, confirm `/programme#session-<id>` loads and the target session card is visible/highlighted.                                                                                                   |
| Format chips on /programme render "Keynote" / "Talk" / "Lightning" / "Workshop" (not "KEYNOTE" etc.)   | IN-02 (schedule)   | Visual cue that data-* bridge is active                   | Visit `/programme` and `/en/programme`, confirm the four format chips show values in title case (or uppercase if CSS text-transform applied) — no locale difference since values are identical in both dicts.                         |
| Agenda drawer remove button has `aria-label="Retirer"` (FR) / `"Remove"` (EN)                          | IN-02 (schedule)   | Accessibility-only; requires bookmarking a session first  | Visit `/programme`, bookmark any session (bookmark icon), open agenda drawer, devtools → inspect `.agenda-remove` → confirm `aria-label="Retirer"` (FR) / `"Remove"` on `/en/programme`.                                                |
| Empty-agenda fallback paragraph renders the localized i18n value (no FR dead-code fallback visible)    | IN-02 (schedule)   | State check (requires clearing localStorage)              | Visit `/en/programme`, open agenda drawer with no bookmarks, confirm the empty-state paragraph shows the EN string "No sessions bookmarked yet..." (from `data-schedule-empty`), NOT "Votre agenda est vide." (the old FR fallback).    |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (every task has grep + astro check)
- [x] Wave 0 covers all MISSING references (none — pre-existing infrastructure suffices)
- [x] No watch-mode flags (all commands are `run`-mode)
- [x] Feedback latency < 25s (quick: ~3s; full: ~25s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-12 (planner)
