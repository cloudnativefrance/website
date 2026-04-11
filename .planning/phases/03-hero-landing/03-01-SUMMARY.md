---
phase: 03-hero-landing
plan: 01
subsystem: ui
tags: [astro, react, countdown, i18n, hero, tailwind]

requires:
  - phase: 01-design-system-foundation
    provides: "Design tokens, GeoBackground pattern, Button/Badge components"
  - phase: 02-bilingual-architecture
    provides: "i18n utils (useTranslations, getLangFromUrl, getLocalePath), ui.ts dictionary"
provides:
  - "HeroSection.astro full-viewport hero component"
  - "CountdownTimer.tsx React island with post-event mode"
  - "All hero/countdown/keynumbers translation keys in FR and EN"
affects: [03-hero-landing, landing-page-assembly]

tech-stack:
  added: []
  patterns: ["React island with client:load for above-the-fold interactive content", "buttonVariants on <a> tags for navigation-aware styled buttons"]

key-files:
  created:
    - src/components/hero/HeroSection.astro
    - src/components/hero/CountdownTimer.tsx
  modified:
    - src/i18n/ui.ts

key-decisions:
  - "Used buttonVariants on <a> tags instead of Button component for CTAs to ensure proper navigation semantics"
  - "Throttled aria-label updates to 60s while visual countdown updates every 1s for screen reader performance"

patterns-established:
  - "Hero component pattern: Astro wrapper with React island via client:load for interactive parts"
  - "Translation-only components: all visible text through t() helper, no hardcoded strings"

requirements-completed: [HERO-01, HERO-02, HERO-03]

duration: 3min
completed: 2026-04-11
---

# Phase 03 Plan 01: Hero Section Summary

**Full-viewport hero with bilingual countdown timer, GeoBackground, accent date badge, and dual CTA buttons**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-11T19:14:03Z
- **Completed:** 2026-04-11T19:17:30Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Added 14 bilingual translation keys (FR/EN) for hero, countdown, and key numbers sections
- Created CountdownTimer React island with card-based digits, 1s updates, post-event replay CTA, and accessible role="timer"
- Created HeroSection Astro component with GeoBackground, radial gradient overlay, translated content, and dual CTAs

## Task Commits

Each task was committed atomically:

1. **Task 1: Add all hero translation keys to ui.ts** - `ab21155` (feat)
2. **Task 2: Create CountdownTimer React island** - `5e25262` (feat)
3. **Task 3: Create HeroSection Astro component** - `463bd33` (feat)

## Files Created/Modified
- `src/i18n/ui.ts` - Added 14 hero/countdown/keynumbers translation keys in both FR and EN
- `src/components/hero/CountdownTimer.tsx` - React island countdown timer with card digits, post-event mode, role="timer" accessibility
- `src/components/hero/HeroSection.astro` - Full-viewport hero with GeoBackground, gradient overlay, Badge, CountdownTimer island, CTA buttons

## Decisions Made
- Used `buttonVariants()` on `<a>` tags instead of wrapping `<a>` inside `<Button>` -- the base-ui Button component does not support `asChild` and using native `<a>` ensures proper navigation semantics and accessibility
- Throttled aria-label updates on the countdown to every 60 seconds while the visual display updates every second, preventing excessive screen reader announcements

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `pnpm` not directly available in worktree agent environment due to mise trust issue; resolved by using `npx pnpm` for build verification

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- HeroSection ready to be integrated into landing page layout (Plan 02 or page assembly phase)
- CountdownTimer will automatically switch to post-event mode after June 3, 2027
- Key numbers translation keys are ready for the KeyNumbers component (separate plan)

## Self-Check: PASSED

All 3 created/modified files verified present. All 3 task commit hashes verified in git log.

---
*Phase: 03-hero-landing*
*Completed: 2026-04-11*
