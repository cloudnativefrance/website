---
phase: 11-security-i18n-hardcode-fixes
verified: 2026-04-12T00:00:00Z
status: human_needed
score: 4/4 success criteria verified
overrides_applied: 0
---

# Phase 11: Security, i18n & Hardcode Fixes — Verification Report

**Phase Goal:** All hardcoded English strings use i18n, locale detection is consistent, and the SocialLinks XSS vector is closed.
**Verified:** 2026-04-12
**Status:** human_needed (all automated checks PASS; manual a11y/visual spot-checks remain per Validation contract)
**Re-verification:** No — initial verification

## Goal Achievement

### Success Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | SocialLinks.astro validates URLs before rendering href (no `javascript:` URIs) | VERIFIED | `safeUrl()` at `src/components/speakers/SocialLinks.astro:20-31` uses `new URL()` parser + explicit allowlist `u.protocol === "http:" \|\| u.protocol === "https:"` at L26; all 5 anchor hrefs (github/linkedin/bluesky/website/twitter) routed through it at L34-38 |
| 2 | All locale-dependent strings (track badges, keynote label, countdown aria-label) use i18n keys | VERIFIED | Track: `TalkCard.astro:41` `t(\`talks.track.${track}\` as any)`, keys at `src/i18n/ui.ts:61-64` (fr) and `:202-205` (en). Keynote: `SpeakerCard.astro:36` `t("speakers.keynote_badge")`. Countdown aria-label: `CountdownTimer.tsx:45-52` uses `countdown.aria_template` placeholder pipeline; keys at `ui.ts:34-35` + `:175-176`. Schedule format chips: `ScheduleGrid.astro:114-117` data-* bridge + reader at `:903-906`. Agenda remove: `ScheduleGrid.astro:118` + reader at `:908` + consumer at `:1136`. Empty state: `:119` + reader at `:1090` (migrated from broken `document.documentElement` path). |
| 3 | All page data calls use `getLangFromUrl` result instead of hardcoded 'fr'/'en' | VERIFIED | `src/pages/speakers/[slug].astro:21` `const lang = getLangFromUrl(Astro.url);` then `getTalksForSpeaker(lang, slug)` at :24. Mirror at `src/pages/en/speakers/[slug].astro:21,24`. Programme pages already use `getLangFromUrl` (`programme/index.astro:8`, `en/programme/index.astro:8`). `rg "const lang:\s*\"(fr\|en)\"\s*=\s*\"(fr\|en)\"" src/pages/` returns zero matches. |
| 4 | `twitter` field in SocialLinks is either rendered or removed from Props | VERIFIED — rendered | `twitter?: string` in Props at `SocialLinks.astro:8`; flows through `safeUrl` at L38; conditional render block L135-147 with X/Twitter SVG icon (L143-145) and `aria-label="Twitter / X profile"` (L140) |

**Score:** 4/4 success criteria verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/i18n/ui.ts` | 6 new keys × 2 locales | VERIFIED | `countdown.aria_template`, `talks.track.{cloud-infra,devops-platform,security,community}`, `schedule.agenda.remove` present in both `fr` and `en` branches |
| `src/components/speakers/SocialLinks.astro` | safeUrl + twitter render | VERIFIED | Unchanged by new plans (per Task 2 audit); protections from earlier partial landing intact |
| `src/components/speakers/SpeakerCard.astro` | keynote badge via t() | VERIFIED | L36 uses i18n key; no literal `>Keynote<` remains |
| `src/components/speakers/TalkCard.astro` | track + format via t() | VERIFIED | `trackNames` map deleted; `capitalizedFormat` deleted; typed `as any` lookups at L41,44 |
| `src/components/hero/CountdownTimer.tsx` | aria-label template | VERIFIED | Placeholder pipeline L45-52; no `" remaining"` literal; React child interpolation auto-escaped |
| `src/components/schedule/ScheduleGrid.astro` | data-* bridge (6 attrs) + consumers | VERIFIED | 6 attrs on `.schedule-root` L113-119; formatPalette reads at L903-906; agendaRemoveLabel at L908; emptyLabel migrated to `root?.getAttribute` at L1090 (bug fix); injected button aria-label at L1136 uses template var |
| `src/pages/speakers/[slug].astro` | getLangFromUrl + aria-label | VERIFIED | L21, L70 |
| `src/pages/en/speakers/[slug].astro` | mirror of FR | VERIFIED | L21, L70 (identical) |
| `src/pages/programme/index.astro` | redundant `data-schedule-empty` removed | VERIFIED | Not present; page now only carries `data-schedule-active-singular/plural` |
| `src/pages/en/programme/index.astro` | same | VERIFIED | Same |

### Key Link Verification

| From | To | Via | Status |
|------|----|----|--------|
| SpeakerCard | i18n dict | `t("speakers.keynote_badge")` | WIRED |
| CountdownTimer | i18n dict | `ui[lang]["countdown.aria_template"]` + 6 `.replace()` | WIRED (placeholder-template pattern consumes all 6 tokens) |
| TalkCard | i18n dict | `t(\`talks.track.${track}\`)` + `t(\`schedule.format.${format}\`)` | WIRED |
| [slug].astro (FR/EN) | speakers lib | `getTalksForSpeaker(lang, slug)` — lang from URL | WIRED |
| [slug].astro deep-link | /programme anchor | `href=/programme#session-${talk.id}` + `aria-label={t("speakers.schedule_link")}` | WIRED |
| ScheduleGrid client script | i18n dict | data-* bridge on `.schedule-root` → `root?.getAttribute(...)` | WIRED (6 attrs, all read; latent bug at old emptyLabel reader fixed) |
| ScheduleGrid injected agenda button | agendaRemoveLabel | template literal in `innerHTML` | WIRED |
| SocialLinks anchors | external URLs | `safeUrl()` → `new URL()` + protocol allowlist | WIRED (XSS T-11-07 closed) |

### Behavioral Spot-Checks

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| `pnpm build` succeeds (142 pages) | Documented in 11-02 + 11-03 SUMMARYs | PASS | PASS |
| `rg "const lang:" src/pages/` = 0 | Grep of repo | 0 matches | PASS |
| Anti-pattern: `label: "KEYNOTE"` | Grep of ScheduleGrid.astro | 0 matches | PASS |
| Anti-pattern: `aria-label="Remove"` (literal) | Grep of ScheduleGrid.astro | 0 matches | PASS |
| Anti-pattern: `Votre agenda est vide` | Grep of ScheduleGrid.astro | 0 matches | PASS |
| `document.documentElement.getAttribute("data-schedule-empty")` | Grep for broken reader path | 0 matches (migrated to `root?.getAttribute`) | PASS |

### Requirements Coverage

| Requirement | Plans | Status | Evidence |
|-------------|-------|--------|----------|
| IN-01 | 11-02 | SATISFIED | getLangFromUrl on [slug].astro FR+EN; aria-label on schedule deep-link |
| IN-02 | 11-01, 11-02, 11-03 | SATISFIED | Track + format + keynote + agenda strings flow through i18n |
| CR-01 | 11-03 (audit) | SATISFIED | safeUrl protocol allowlist audit intact |
| WR-01 | 11-01, 11-02 | SATISFIED | Countdown aria_template in both locales; placeholder pipeline |
| WR-02 | 11-03 (audit) | SATISFIED | twitter anchor renders with icon + aria-label |
| keynote_badge | 11-02 | SATISFIED | SpeakerCard L36 |
| schedule_link | 11-02 | SATISFIED | [slug].astro FR+EN L70 |

### Anti-Patterns Found

None. The `as any` escape hatches in TalkCard and [slug].astro template-literal i18n keys are pre-approved (D-03 + existing repo precedent at ScheduleGrid.astro:168,227), and the build enforces that all resolved keys exist via inferred `ui` dictionary typing. 31 pre-existing `pnpm astro check` errors logged in `deferred-items.md` are out of scope for Phase 11 (content config, speakers index pages, speakers test) and not introduced by any of Phase 11's plans.

### Human Verification Required

Per `11-VALIDATION.md` Manual-Only section — all items still pending:

1. **FR countdown aria-label natural phrasing** — `pnpm dev`, open `/`, inspect `<div role="timer">`, expect `aria-label="Plus que 45 jours, 3 heures et 10 minutes"` (screen-reader output check)
2. **EN countdown aria-label natural phrasing** — Same on `/en/`, expect `"45 days, 3 hours, 10 minutes remaining"`
3. **Keynote badge visibility** — Visit `/speakers/` and `/en/speakers/`, confirm `Keynote` pill renders on keynote speakers
4. **Talk row localized format+duration** — `/speakers/<keynote-slug>` shows "Keynote · 30 min" (FR+EN identical per D-03)
5. **Schedule deep-link aria-label** — Hover talk link on `/speakers/<slug>`, devtools → `aria-label="Voir dans le programme"` (FR) / `"View in schedule"` (EN)
6. **Schedule deep-link actually anchors** — Click link, confirm `/programme#session-<id>` loads and the target session is visible
7. **Format chips title-case** — `/programme` and `/en/programme` chips render `Keynote`/`Talk`/`Lightning`/`Workshop` (proves data-* bridge live, not the old "KEYNOTE" fallback)
8. **Agenda remove aria-label** — Bookmark a session, open agenda drawer, devtools → `.agenda-remove` → `aria-label="Retirer"` (FR) / `"Remove"` (EN)
9. **Empty-agenda fallback localized** — `/en/programme` with cleared localStorage shows EN string from `data-schedule-empty` (NOT the removed `"Votre agenda est vide."` dead-code fallback)

### Gaps Summary

No gaps. All four success criteria are met by static evidence in the repository; the 3-plan execution plus pre-landed partial work fully closes the phase's goal surface. A latent bug (broken `document.documentElement.getAttribute("data-schedule-empty")` reader + redundant page-level setter never forwarded by ScheduleGrid) was fixed in passing by Plan 11-03. Status is `human_needed` only because the accessibility/visual spot-checks from the Validation contract require a running dev server and a screen-reader / devtools inspection pass that cannot be automated in this verification.

---

_Verified: 2026-04-12_
_Verifier: Claude (gsd-verifier)_
