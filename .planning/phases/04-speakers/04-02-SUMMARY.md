---
phase: 04-speakers
plan: 02
subsystem: ui
tags: [astro, components, speakers, grid, bilingual, i18n, accessibility]

# Dependency graph
requires:
  - phase: 04-speakers-01
    provides: "Speaker/talk query utilities and sample content data"
provides:
  - "SpeakerAvatar component with photo/initials fallback (sm/lg sizes)"
  - "SocialLinks component with inline SVG icons and accessible labels"
  - "SpeakerCard component with keynote badge, hover/focus states"
  - "Speaker grid pages at /speakers/ (FR) and /en/speakers/ (EN)"
  - "12 speaker-related i18n keys in both FR and EN"
affects: [04-03]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Inline SVG icons in Astro components (no React dependency)", "Keynote slug set derived from talk format for badge display", "Motion-safe hover transforms for reduced-motion support"]

key-files:
  created:
    - src/components/speakers/SpeakerAvatar.astro
    - src/components/speakers/SocialLinks.astro
    - src/components/speakers/SpeakerCard.astro
    - src/pages/speakers/index.astro
    - src/pages/en/speakers/index.astro
  modified:
    - src/i18n/ui.ts

key-decisions:
  - "Used inline SVG icons instead of lucide-react since components are .astro files without React context"
  - "Bluesky icon uses official butterfly SVG path with fill=currentColor"

patterns-established:
  - "Speaker components use cn() utility for class merging with optional className prop"
  - "Grid pages derive keynote status locally from talk data for badge display"

requirements-completed: [SPKR-01]

# Metrics
duration: 3min
completed: 2026-04-11
---

# Phase 4 Plan 2: Speaker Grid Page Summary

**Speaker grid pages with avatar/card/social-links components, keynote-first sorting, responsive 4/3/2/1 column layout, and bilingual i18n keys**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-11T21:29:05Z
- **Completed:** 2026-04-11T21:31:50Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created SpeakerAvatar component with photo rendering or initials-based fallback (sm: 64px circle, lg: 128px rounded square)
- Created SocialLinks component with inline SVG icons for GitHub, LinkedIn, Bluesky, and website with accessible aria-labels and 44px touch targets
- Created SpeakerCard component with keynote badge, hover border/lift transitions, focus-visible ring, and full-card clickability via getLocalePath
- Built FR speaker grid page at /speakers/ with keynote-first sorted speakers
- Built EN speaker grid page at /en/speakers/ with keynote-first sorted speakers
- Added 12 speaker translation keys to both FR and EN locales (heading, subtext, badges, error states, etc.)
- Build passes generating all 4 routes including both speaker grid pages

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SpeakerAvatar, SocialLinks, and SpeakerCard components** - `c1dbc23` (feat)
2. **Task 2: Create speaker grid pages (FR + EN) and add i18n keys** - `17fe93c` (feat)

## Files Created/Modified
- `src/components/speakers/SpeakerAvatar.astro` - Avatar with photo/initials fallback, sm/lg sizes
- `src/components/speakers/SocialLinks.astro` - Icon row with GitHub, LinkedIn, Bluesky, website SVGs
- `src/components/speakers/SpeakerCard.astro` - Grid card with avatar, name, company, keynote badge
- `src/pages/speakers/index.astro` - FR speaker grid page with keynote-first sorting
- `src/pages/en/speakers/index.astro` - EN speaker grid page with keynote-first sorting
- `src/i18n/ui.ts` - Added 12 speaker-related translation keys to both locales

## Decisions Made
- Used inline SVG icons in Astro components rather than lucide-react (no React context available in .astro files)
- Bluesky uses official butterfly SVG path with fill=currentColor (other icons use stroke-based lucide paths)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None.

## Known Stubs

None - all components are fully implemented with real data bindings. Grid pages wire to getSortedSpeakers and display all 6 sample speakers.

## Self-Check: PASSED

---
*Phase: 04-speakers*
*Completed: 2026-04-11*
