---
phase: 05
plan: 03
subsystem: team-page
tags: [team, pages, i18n, components, a11y, wave-2]
requires:
  - 05-01 (flattened team schema + team.csv with edge-case rows)
  - Phase 4 SpeakerAvatar + SocialLinks (reused unchanged)
provides:
  - /team (FR) and /en/team (EN) routes
  - TeamMemberCard + TeamGroupSection components
  - End-to-end consumption of team CSV data layer (closes TEAM-03)
affects:
  - Build output: +2 routes (146 pages total)
tech-stack:
  added: []
  patterns:
    - Reshape flat CSV social_* fields into nested `social` object for SocialLinks reuse
    - Override child component size via tailwind-merge (class prop) — no Phase 4 regressions
    - Explicit enum→i18n-key map (program-committee → program_committee) per D-09
key-files:
  created:
    - src/components/team/TeamMemberCard.astro
    - src/components/team/TeamGroupSection.astro
    - src/pages/team.astro
    - src/pages/en/team.astro
  modified: []
decisions:
  - Used tailwind-merge class override (`class="w-28 h-28"`) instead of wrapping SpeakerAvatar in a sized div; SpeakerAvatar's default w-16 h-16 would win over a wrapper div. twMerge dedupes correctly, and this keeps SpeakerAvatar untouched.
  - Layout component does not accept a `description` prop; omitted from page calls (title + lang only).
metrics:
  duration: ~15min
  completed: 2026-04-12
  tasks: 2 (Task 1 already complete on HEAD)
  files: 4 created
---

# Phase 05 Plan 03: Team Page Summary

Built the FR/EN team page with three group sections (Core Team → Program Committee → Volunteers) using two new components that reuse Phase 4's `SpeakerAvatar` (initials fallback) and `SocialLinks` (XSS-hardened) without modification.

## What Shipped

### Components (2)

- **`src/components/team/TeamMemberCard.astro`** (40 lines) — Compact member card. 112px avatar via class-override (`class="w-28 h-28"` passed to SpeakerAvatar; tailwind-merge in `cn()` dedupes against the default `w-16 h-16`). Name, localized role (`role_fr` / `role_en`), SocialLinks row. Flat `social_*` fields are reshaped into the nested `social` object SocialLinks expects. No hover lift (D-10: dark pattern on non-clickable cards).
- **`src/components/team/TeamGroupSection.astro`** (22 lines) — Group block with `h2` heading + responsive grid `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8`. Title rendered in Title Case, default tracking (distinct from sponsor tiers which are uppercase tracking-wider).

### Pages (2)

- **`src/pages/team.astro`** (FR) and **`src/pages/en/team.astro`** (EN) — Byte-identical structure; lang derived from URL via `getLangFromUrl(Astro.url)` (no hardcoded locale const). Both:
  - Call `getCollection("team")`
  - Partition entries by hardcoded `GROUP_ORDER = ["core", "program-committee", "volunteers"]`
  - Render only non-empty groups (inline `byGroup[g].length > 0 ? ... : null`)
  - Show whole-page empty state (`team.page.empty`) when no members exist
  - Map enum values to i18n keys explicitly (`program-committee` → `program_committee`) per D-09

### i18n (0 new — already present)

Task 1 (adding `team.page.*` and `team.group.*` keys) was completed in commit `caef666` prior to this plan run. Verified `grep -c '"team.group.core"' src/i18n/ui.ts` returns 2 (FR + EN). **Skipped.**

## Commits

| Task | Name | Commit |
| --- | --- | --- |
| 1 | Add team i18n keys | `caef666` (pre-existing) |
| 2 | Build TeamMemberCard + TeamGroupSection | `74b198c` |
| 3 | Build FR + EN team pages | `63f1086` |

## Verification Results

- `pnpm astro check` — no new errors in team components/pages (33 pre-existing errors in `src/pages/speakers/index.astro` from Phase 5-01 speakers schema mismatch, out of scope — Rule 4 boundary)
- `pnpm build` — succeeded, 146 pages built, both `/team/index.html` and `/en/team/index.html` emitted
- Initials fallback verified in built HTML: `>CL<` for chloe-leroy (no photo), `>EG<` for erin-garcia (no photo, no socials — row still renders with name + role only, since SocialLinks returns null for empty)
- No `accent-pink` class anywhere in created files (verified with grep)
- No hover lift class (no `hover:-translate-y-*`) on team cards

## Build Route Count

Before: 144 routes (approximate — stable baseline)
After: 146 routes — `+/team/`, `+/en/team/`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] SpeakerAvatar sizing approach**

- **Found during:** Task 2
- **Issue:** Plan text suggested wrapping SpeakerAvatar in a sized `<div class="w-28 h-28">` to hit the 112px UI-SPEC target, but SpeakerAvatar applies its own `w-16 h-16` on its inner element — a wrapper div cannot override child sizing.
- **Fix:** Used the component's existing `class` prop (passed through `cn()` → tailwind-merge), which dedupes the sizing classes. `class="w-28 h-28"` correctly overrides the default `w-16 h-16`. Zero modifications to SpeakerAvatar — Phase 4 stability preserved per the plan's explicit constraint.
- **Files modified:** Only `TeamMemberCard.astro` (the new file).
- **Commit:** `74b198c`

**2. [Rule 3 - Blocking] Layout component lacks `description` prop**

- **Found during:** Task 3
- **Issue:** Plan sample page code passes `description={t("team.page.intro")}` to `<Layout>`, but `Layout.astro`'s Props interface only declares `title` and `lang`.
- **Fix:** Omitted the `description` prop. The intro text still renders as the first paragraph inside `<main>` via `t("team.page.intro")`, so the user-facing content is unchanged.
- **Files modified:** `src/pages/team.astro`, `src/pages/en/team.astro`.
- **Commit:** `63f1086`

### Out-of-scope observations (not fixed)

- `src/pages/speakers/index.astro` and several other speakers files reference `talkTitle`, `talkDuration`, `talkTrack`, `photo_url`, etc. properties that no longer exist on the post-05-01 speakers schema. 33 `astro check` errors. This is pre-existing damage from Plan 05-01's schema migration that Plan 05-03 did not cause. Not in scope — belongs to a Phase 5 or Phase 4 follow-up plan.

## Threat Model Status

All T-05-04, T-05-06, T-05-09, T-05-10 dispositions from the plan's `<threat_model>` honored:

- **T-05-04 (XSS on social href):** Mitigated by SocialLinks' existing `safeUrl()` allowlist (untouched) + Zod `socialUrl` schema from 05-01.
- **T-05-06 (text XSS):** Astro auto-escapes; no `set:html` used.
- **T-05-09 (photo src):** Residual risk accepted for v1.0 per plan.
- **T-05-10 (hover-lift dark pattern):** Mitigated — TeamMemberCard has zero `hover:` classes.

No new threat surface introduced.

## Success Criteria

- [x] TEAM-01 complete — members display with photo OR initials, name, role, socials
- [x] TEAM-02 complete — three groups in fixed order, empty groups hidden
- [x] TEAM-03 complete — CSV data layer from Plan 05-01 consumed end-to-end
- [x] No Phase 4 component regressions (SpeakerAvatar, SocialLinks byte-identical)
- [x] All team page copy sourced from i18n/ui.ts
- [x] NO accent-pink anywhere in created files

## Self-Check: PASSED

**Files exist:**
- FOUND: src/components/team/TeamMemberCard.astro
- FOUND: src/components/team/TeamGroupSection.astro
- FOUND: src/pages/team.astro
- FOUND: src/pages/en/team.astro

**Commits exist:**
- FOUND: 74b198c (components)
- FOUND: 63f1086 (pages)
- FOUND: caef666 (i18n keys, pre-existing)

**Build artifacts exist:**
- FOUND: dist/team/index.html
- FOUND: dist/en/team/index.html
