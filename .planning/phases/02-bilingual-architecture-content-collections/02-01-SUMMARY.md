---
phase: 02-bilingual-architecture-content-collections
plan: 01
subsystem: i18n-routing
tags: [i18n, routing, astro, bilingual]
dependency_graph:
  requires: [01-design-system-foundation]
  provides: [i18n-config, translation-utils, bilingual-routing]
  affects: [all-subsequent-plans]
tech_stack:
  added: [astro-i18n]
  patterns: [locale-from-url, translation-dictionary, unprefixed-default-locale]
key_files:
  created:
    - src/i18n/ui.ts
    - src/i18n/utils.ts
    - src/pages/en/index.astro
  modified:
    - astro.config.mjs
    - src/layouts/Layout.astro
    - src/pages/index.astro
decisions:
  - Used Astro built-in i18n over Paraglide JS (simpler, no external dependency)
  - Dynamic lang attribute via Astro.currentLocale with prop override
metrics:
  duration: 2min
  completed: 2026-04-11T17:50:00Z
  tasks_completed: 2
  tasks_total: 2
  files_changed: 6
---

# Phase 02 Plan 01: i18n Routing and Translation Infrastructure Summary

Astro built-in i18n configured with FR as unprefixed default locale and EN under /en/, plus reusable translation dictionary and utility functions for all subsequent bilingual work.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Configure Astro i18n and create translation utilities | 42d91a2 | astro.config.mjs, src/i18n/ui.ts, src/i18n/utils.ts |
| 2 | Restructure pages for bilingual routing | 32ce6a0 | src/pages/index.astro, src/pages/en/index.astro, src/layouts/Layout.astro |

## What Was Built

### i18n Configuration (astro.config.mjs)
- `defaultLocale: "fr"` with `prefixDefaultLocale: false` -- French pages serve at root paths
- English pages serve under `/en/` prefix
- Fallback from EN to FR for missing translations

### Translation Dictionary (src/i18n/ui.ts)
- Exports: `languages`, `Locale` type, `defaultLang`, `ui` object
- 12 UI string keys covering nav, site metadata, language toggle, and fallback messages
- Both FR and EN dictionaries with identical key sets

### Utility Functions (src/i18n/utils.ts)
- `getLangFromUrl(url)` -- extracts locale from URL pathname
- `useTranslations(lang)` -- returns bound `t(key)` function with fallback
- `getLocalePath(lang, path)` -- builds locale-aware paths, strips existing prefixes

### Dynamic Layout (src/layouts/Layout.astro)
- `lang` prop added to Props interface
- `<html lang>` attribute resolves from: prop > `Astro.currentLocale` > `"fr"` fallback

### Bilingual Pages
- `src/pages/index.astro` -- French homepage at `/` with translated content
- `src/pages/en/index.astro` -- English homepage at `/en/` with original English content

## Verification Results

- `npx astro build` exits 0 (2 pages built)
- `dist/index.html` exists with `lang="fr"`
- `dist/fr/` directory does NOT exist (no /fr/ prefix)
- `dist/en/index.html` exists with `lang="en"`
- French page contains "3 juin 2027"
- English page contains "June 3, 2027"

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None -- all translation keys have real values, both pages render full content.

## Self-Check: PASSED

All 6 created/modified files verified present. Both commit hashes (42d91a2, 32ce6a0) confirmed in git log.
