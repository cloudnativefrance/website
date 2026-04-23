---
phase: 17-integrate-2026-edition-section-on-homepage
plan: 01
subsystem: past-editions
tags: [shell, i18n, css, a11y, deep-link]
requirements: [EDIT-01]
dependency_graph:
  requires:
    - Phase 16 PastEditionSection.astro shell (D-08)
    - Phase 16 editions.* i18n keys
    - A11Y-05 reduced-motion baseline
  provides:
    - Shell `id?` + `trackerUrl?` Props extension (non-breaking)
    - D-14 i18n keys (3 thumbnail alts + placeholder badge aria)
    - Global `:target { scroll-margin-top: 5rem }` rule
  affects:
    - Plan 17-03 (homepage mount) — consumes new props
    - Phase 18 venue-block deletion (unaffected)
tech_stack:
  added: []
  patterns:
    - Optional props default to undefined (backwards compatible)
    - Anchor-wrapped badge when trackerUrl set, span-only fallback
    - aria-label sourced via useTranslations(lang)
key_files:
  created: []
  modified:
    - src/components/past-editions/PastEditionSection.astro
    - src/styles/global.css
    - src/i18n/ui.ts
    - tests/build/past-edition-shell.test.ts
decisions:
  - D-08: id?: string optional anchor prop
  - D-13: trackerUrl?: string optional anchor wrap for PLACEHOLDER badge
  - D-14: 4 new i18n keys (3 thumbnail alts + aria) in FR + EN, non-identical
  - D-10: :target scroll-margin-top = 5rem (80px nav clearance)
metrics:
  tasks: 3
  commits: 4
  files_changed: 4
  completed: 2026-04-13
---

# Phase 17 Plan 01: Shell Extension + i18n + Scroll Margin Summary

Non-breaking extension of the Phase 16 PastEditionSection.astro shell adds optional `id` and `trackerUrl` props so Plan 17-03 can mount `<PastEditionSection id="edition-2026" trackerUrl={...}>` with a clickable PLACEHOLDER badge; pairs with 4 new D-14 i18n keys (FR + EN, non-identical) and a global `:target { scroll-margin-top: 5rem }` rule for clean deep-link landing below the sticky nav.

## What Shipped

1. **i18n keys (D-14)** — `editions.2026.thumbnail_alt.1/2/3` + `editions.placeholder_badge_aria` added to both `fr` and `en` blocks of `src/i18n/ui.ts`. Values differ per locale; I18N-02 parity test stays green.
2. **Shell Props extension (D-08, D-13)** — `src/components/past-editions/PastEditionSection.astro` now accepts `id?: string` (rendered as `<section id={id}>`) and `trackerUrl?: string` (when set AND `placeholder=true`, wraps the badge in `<a href target="_blank" rel="noopener noreferrer" aria-label={t("editions.placeholder_badge_aria")}>`). Span-only badge path preserved for backwards compat. `useTranslations(lang)` wired via `getLangFromUrl(Astro.url)`.
3. **Test extension** — `tests/build/past-edition-shell.test.ts` gains 3 new assertions (Props interface has `id?`/`trackerUrl?`, `<section id={id}>` renders, badge-as-anchor with `href={trackerUrl}` + aria-label). `REQUIRED_PROP_NAMES` extended to include `"id"` and `"trackerUrl"`.
4. **Global CSS rule (D-10)** — Appended `:target { scroll-margin-top: 5rem }` to `src/styles/global.css` after the A11Y-05 reduced-motion block (which remains untouched). Scopes the offset to URL-fragment navigation only.

## Verification

- `pnpm exec vitest run tests/build/past-edition-shell.test.ts tests/build/i18n-parity.test.ts tests/build/a11y-motion-reset.test.ts` — 13/13 passing
- `pnpm build` — 154 pages built, no new warnings
- `pnpm exec astro check` — 3 pre-existing errors in `src/content.config.ts` (unrelated, LoaderConstraint type drift); zero new past-editions errors

## Commits

| # | Hash    | Message                                                                |
| - | ------- | ---------------------------------------------------------------------- |
| 1 | a8a3f62 | feat(17-01): add D-14 i18n keys for 2026 thumbnail alts + aria         |
| 2 | e773c39 | test(17-01): extend past-edition-shell test for D-08 id + D-13 trackerUrl |
| 3 | 83ffc43 | feat(17-01): extend PastEditionSection shell with id + trackerUrl props |
| 4 | 4c0617e | feat(17-01): add global :target scroll-margin-top rule (D-10)          |

TDD flow on Task 2: test committed failing (RED, e773c39), shell committed passing (GREEN, 83ffc43).

## Deviations from Plan

None — plan executed exactly as written. Values and patterns copied verbatim from plan decisions.

Note: The plan's frontmatter `must_haves.truths[3]` mentions "5 new D-14 i18n keys" but the task action specifies only 4 (3 thumbnail alts + 1 aria-label) because `editions.2026.video_caption` was already present (line 217 FR / 467 EN per Phase 16). 4 keys were added as the plan Task 1 action explicitly directed, which matches CONTEXT.md D-14.

## Known Stubs

None — this plan ships only prop plumbing, i18n strings, and CSS. No UI-rendered data placeholders introduced.

## Self-Check: PASSED

- src/components/past-editions/PastEditionSection.astro: FOUND
- src/styles/global.css: FOUND (contains `:target` + `scroll-margin-top: 5rem`)
- src/i18n/ui.ts: FOUND (4 new keys present twice each)
- tests/build/past-edition-shell.test.ts: FOUND (extended)
- Commit a8a3f62: FOUND
- Commit e773c39: FOUND
- Commit 83ffc43: FOUND
- Commit 4c0617e: FOUND
