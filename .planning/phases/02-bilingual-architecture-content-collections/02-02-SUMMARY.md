---
phase: 02-bilingual-architecture-content-collections
plan: 02
subsystem: ui
tags: [astro, i18n, language-toggle, accessibility, a11y]

requires:
  - phase: 02-bilingual-architecture-content-collections/01
    provides: i18n utilities (getLangFromUrl, useTranslations, getLocalePath) and ui dictionary
provides:
  - LanguageToggle.astro segmented FR/EN navigation component
  - TranslationNotice.astro fallback banner for missing translations
  - Layout.astro with dynamic lang attribute and language toggle in header
affects: [03-content-pages, 04-speakers, 05-schedule, 06-sponsors]

tech-stack:
  added: []
  patterns: [astro-component-with-i18n, class-list-conditional-styling, sticky-header-layout]

key-files:
  created:
    - src/components/LanguageToggle.astro
    - src/components/TranslationNotice.astro
  modified:
    - src/layouts/Layout.astro

key-decisions:
  - "Layout already had dynamic lang via Astro.currentLocale -- no hardcoded lang='fr' to replace"

patterns-established:
  - "i18n component pattern: import getLangFromUrl + useTranslations, derive lang from Astro.url"
  - "Locale-aware links: use getLocalePath(lang, currentPath) for all locale switching"

requirements-completed: [FNDN-03]

duration: 1min
completed: 2026-04-11
---

# Phase 02 Plan 02: Language Toggle and Translation Notice Summary

**Accessible FR/EN segmented toggle in sticky header with fallback translation notice banner**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-11T19:52:20Z
- **Completed:** 2026-04-11T19:53:45Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- LanguageToggle renders segmented FR/EN control with aria-label and aria-current for accessibility
- TranslationNotice provides fallback banner with info icon and CTA link to original locale
- Layout.astro includes toggle in sticky header; html lang attribute is dynamic via Astro.currentLocale
- Build passes with correct cross-linking between / and /en/ pages

## Task Commits

Each task was committed atomically:

1. **Task 1: Create LanguageToggle and TranslationNotice components** - `5e8eacc` (feat)
2. **Task 2: Wire toggle into Layout and verify on all pages** - `4d5dee1` (feat)

## Files Created/Modified
- `src/components/LanguageToggle.astro` - Segmented FR/EN nav with anchor tags, aria attributes, conditional styling
- `src/components/TranslationNotice.astro` - Full-width fallback banner with info icon, heading, body, and CTA link
- `src/layouts/Layout.astro` - Added LanguageToggle import and sticky header wrapper

## Decisions Made
- Layout.astro already used Astro.currentLocale for dynamic lang -- no breaking change needed, just added the header and toggle import

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Node.js v22.8.0 not supported by Astro; resolved by installing v22.16.0 via mise

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Language toggle is wired into Layout and renders on all pages
- TranslationNotice is ready for use in content pages that lack translations
- All future pages using Layout.astro automatically get the toggle

---
*Phase: 02-bilingual-architecture-content-collections*
*Completed: 2026-04-11*
