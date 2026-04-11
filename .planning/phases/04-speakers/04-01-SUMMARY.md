---
phase: 04-speakers
plan: 01
subsystem: data
tags: [astro, content-collections, speakers, talks, bilingual, zod]

# Dependency graph
requires:
  - phase: 02-bilingual-architecture
    provides: "Content collection schemas (speakers, talks) with glob loader and Zod validation"
provides:
  - "Speaker/talk query utilities (getSlug, getLocale, getSpeakersByLocale, getTalksByLocale, getTalksForSpeaker, getSortedSpeakers, getCoSpeakersForTalk)"
  - "6 sample speakers in FR+EN with varied social links"
  - "8 sample talks in FR+EN covering all 4 tracks, keynote, lightning, workshop, and co-speaker scenarios"
affects: [04-02, 04-03, 07-schedule]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Locale-prefixed entry ID filtering with getSlug/getLocale helpers", "Keynote-first sorting via talk format cross-reference", "Co-speaker bidirectional query pattern"]

key-files:
  created:
    - src/lib/speakers.ts
    - src/content/speakers/fr/speaker-2.md
    - src/content/speakers/fr/speaker-3.md
    - src/content/speakers/fr/speaker-4.md
    - src/content/speakers/fr/speaker-5.md
    - src/content/speakers/fr/speaker-6.md
    - src/content/speakers/en/speaker-2.md
    - src/content/speakers/en/speaker-3.md
    - src/content/speakers/en/speaker-4.md
    - src/content/speakers/en/speaker-5.md
    - src/content/speakers/en/speaker-6.md
    - src/content/talks/fr/talk-2.md
    - src/content/talks/fr/talk-3.md
    - src/content/talks/fr/talk-4.md
    - src/content/talks/fr/talk-5.md
    - src/content/talks/fr/talk-6.md
    - src/content/talks/fr/talk-7.md
    - src/content/talks/fr/talk-8.md
    - src/content/talks/en/talk-2.md
    - src/content/talks/en/talk-3.md
    - src/content/talks/en/talk-4.md
    - src/content/talks/en/talk-5.md
    - src/content/talks/en/talk-6.md
    - src/content/talks/en/talk-7.md
    - src/content/talks/en/talk-8.md
  modified:
    - src/content/speakers/fr/speaker-1.md
    - src/content/speakers/en/speaker-1.md
    - src/content/talks/fr/talk-1.md
    - src/content/talks/en/talk-1.md

key-decisions:
  - "All speaker photo fields omitted (not empty string) to test D-06 placeholder avatar fallback"
  - "Fictional but plausible cloud-native speaker roster with realistic companies and roles"

patterns-established:
  - "getSlug strips locale prefix from entry ID for cross-collection joins"
  - "getSortedSpeakers derives keynote status from talk format field, not speaker field"
  - "getCoSpeakersForTalk combines speaker + cospeakers minus current for bidirectional display"

requirements-completed: [SPKR-04]

# Metrics
duration: 4min
completed: 2026-04-11
---

# Phase 4 Plan 1: Speaker Data Layer Summary

**7 speaker/talk query utilities plus 6 speakers and 8 talks in FR+EN covering keynote sorting, co-speakers, and all 4 conference tracks**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-11T21:21:41Z
- **Completed:** 2026-04-11T21:25:23Z
- **Tasks:** 2
- **Files modified:** 29

## Accomplishments
- Created `src/lib/speakers.ts` with 7 exported utility functions for querying speakers and talks by locale
- Built keynote-first sorting that derives keynote status from talk `format` field cross-reference
- Created 6 sample speakers (FR+EN) with varied social link configurations and no photo fields
- Created 8 talks (FR+EN) covering all 4 tracks (cloud-infra, devops-platform, security, community) and all formats (keynote, talk, lightning, workshop)
- Included co-speaker scenario (talk-5: speaker-5 + speaker-6) for D-08 testing
- Build passes with full Zod schema validation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create speaker utility functions** - `5fda7ea` (feat)
2. **Task 2: Create sample speaker and talk content** - `846d052` (feat)

## Files Created/Modified
- `src/lib/speakers.ts` - 7 query utilities: getSlug, getLocale, getSpeakersByLocale, getTalksByLocale, getTalksForSpeaker, getSortedSpeakers, getCoSpeakersForTalk
- `src/content/speakers/fr/speaker-{1-6}.md` - 6 FR speaker profiles (Marie Laurent, Thomas Nguyen, Sarah Chen, Lucas Martin, Amina Diallo, David Moreau)
- `src/content/speakers/en/speaker-{1-6}.md` - 6 EN speaker profiles (same roster)
- `src/content/talks/fr/talk-{1-8}.md` - 8 FR talks (2 keynotes, 4 talks, 1 lightning, 1 workshop)
- `src/content/talks/en/talk-{1-8}.md` - 8 EN talks (same structure)

## Decisions Made
- All speaker `photo` fields omitted entirely (not set to empty string) to properly test D-06 placeholder avatar component fallback
- Used fictional but plausible cloud-native companies (CloudScale, KubeForge, Observia, SecureOps, ContainerLab, PlatformHQ)
- Speaker-4 (Lucas Martin) has 2 talks (talk-4 + talk-6) to test multi-talk display
- Speaker-3 (Sarah Chen) has 2 talks (talk-3 + talk-8) including a workshop format
- Social URLs use plausible patterns (github.com, linkedin.com/in, bsky.app/profile, custom domains)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all content files have complete frontmatter and body text. All utility functions are fully implemented.

## Next Phase Readiness
- Speaker utility functions ready for import by grid page (04-02) and profile page (04-03)
- Sample data covers all required scenarios: keynote-first sorting, co-speaker display, all track badges, multi-talk speakers
- Build validated - Zod schemas pass for all 28 content files

---
*Phase: 04-speakers*
*Completed: 2026-04-11*
