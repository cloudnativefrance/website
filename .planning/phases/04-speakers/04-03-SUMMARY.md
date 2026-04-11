---
phase: 04-speakers
plan: 03
subsystem: ui
tags: [astro, components, speakers, profile, talks, bilingual, dynamic-routes]

# Dependency graph
requires:
  - phase: 04-speakers-01
    provides: "Speaker/talk query utilities (getTalksForSpeaker, getCoSpeakersForTalk, getSpeakersByLocale)"
  - phase: 04-speakers-02
    provides: "SpeakerAvatar, SocialLinks, SpeakerCard components and i18n keys"
provides:
  - "TalkCard component with track badge colors, format/duration display, and co-speaker links"
  - "SpeakerProfile component with avatar, social links, bio slot, and talks named slot"
  - "Dynamic speaker profile pages at /speakers/{slug} (FR) and /en/speakers/{slug} (EN)"
  - "Bidirectional co-speaker links between speaker profiles"
affects: [07-schedule]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Astro 6 render(entry) API for markdown content rendering", "Named slots for composable profile layout (bio + talks)"]

key-files:
  created:
    - src/components/speakers/TalkCard.astro
    - src/components/speakers/SpeakerProfile.astro
    - src/pages/speakers/[slug].astro
    - src/pages/en/speakers/[slug].astro
  modified: []

key-decisions:
  - "Used Astro 6 render(entry) standalone function instead of entry.render() method (API changed in Astro 5+)"
  - "Schedule link rendered as muted placeholder span (not a link) per D-07 until Phase 7"

patterns-established:
  - "Track badge color map as const Record in component frontmatter for 4 conference tracks"
  - "speakerMap pattern: build Map from getSpeakersByLocale for O(1) co-speaker name lookups"

requirements-completed: [SPKR-02, SPKR-03]

# Metrics
duration: 2min
completed: 2026-04-11
---

# Phase 4 Plan 3: Speaker Profile Pages Summary

**Individual speaker profile pages with talk cards, track badges, co-speaker cross-links, and bilingual dynamic routes at /speakers/{slug}**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-11T21:39:19Z
- **Completed:** 2026-04-11T21:41:05Z
- **Tasks:** 1 (of 2; Task 2 is a human-verify checkpoint)
- **Files modified:** 4

## Accomplishments
- Created TalkCard component with track badge color map (4 tracks), capitalized format display, duration, co-speaker links via getLocalePath, and muted schedule placeholder
- Created SpeakerProfile component with back link, large avatar, name/role/company, social links, bio slot, and named talks slot
- Built FR dynamic pages at /speakers/{slug} using getStaticPaths filtering fr/ speakers
- Built EN dynamic pages at /en/speakers/{slug} using getStaticPaths filtering en/ speakers
- Build generates all 12 speaker profile pages (6 FR + 6 EN) successfully
- Co-speaker relationships work bidirectionally (speaker-5 shows speaker-6 as co-speaker and vice versa)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create TalkCard, SpeakerProfile components and dynamic speaker pages** - `04ae405` (feat)

## Files Created/Modified
- `src/components/speakers/TalkCard.astro` - Talk card with track badge, format/duration, co-speaker links, schedule placeholder
- `src/components/speakers/SpeakerProfile.astro` - Full profile layout with avatar, social links, bio and talks slots
- `src/pages/speakers/[slug].astro` - FR dynamic speaker pages with getStaticPaths
- `src/pages/en/speakers/[slug].astro` - EN dynamic speaker pages with getStaticPaths

## Decisions Made
- Used Astro 6 `render(entry)` standalone function from `astro:content` instead of `entry.render()` method (the latter throws "not a function" in Astro 6)
- Schedule link is a `<span>` with `text-muted-foreground cursor-default` rather than an `<a>` tag, matching D-07 placeholder behavior

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Astro 6 render API call**
- **Found during:** Task 1 (build verification)
- **Issue:** Plan specified `speaker.render()` but Astro 6 changed the API to a standalone `render(entry)` function imported from `astro:content`
- **Fix:** Changed `const { Content } = await speaker.render()` to `const { Content } = await render(speaker)` with `render` imported from `astro:content`
- **Files modified:** src/pages/speakers/[slug].astro, src/pages/en/speakers/[slug].astro
- **Verification:** Build succeeds generating all 12 speaker pages
- **Committed in:** 04ae405 (part of task commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix for Astro 6 compatibility. No scope creep.

## Issues Encountered

None beyond the render API change documented above.

## User Setup Required

None - no external service configuration required.

## Known Stubs

- Schedule placeholder text ("Programme a venir" / "Schedule coming soon") rendered as non-interactive muted text. Will become a real link when Phase 7 (schedule) ships. This is intentional per D-07.

## Next Phase Readiness
- Speaker profile pages complete and building successfully
- Awaiting human-verify checkpoint (Task 2) for visual review of the full speaker browsing experience
- Phase 7 will need to wire schedule links from TalkCard to actual schedule anchors

---
*Phase: 04-speakers*
*Completed: 2026-04-11*
