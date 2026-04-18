---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Homepage Restructuring
status: in progress
stopped_at: Phase 23 plan 01 complete (data + i18n foundation shipped)
last_updated: "2026-04-18T08:33:22.000Z"
last_activity: 2026-04-18 -- Phase 23 plan 01 complete
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 2
  completed_plans: 1
  percent: 50
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-18)

**Core value:** A first-time visitor should immediately understand what the event is, when and where it happens, and feel compelled to register -- all within 5 seconds of landing.
**Current focus:** Phase 23 - Edition 2026 Combined Section

## Current Position

Phase: 23 (1 of 4 in v1.2) -- Edition 2026 Combined Section
Plan: 1 of 2 in current phase (23-01 complete; next: 23-02 component)
Status: In progress
Last activity: 2026-04-18 -- Phase 23 plan 01 complete (data + i18n foundation shipped)

Progress: [█████░░░░░] 50% (within Phase 23: 1/2 plans)

## Performance Metrics

**Velocity:**

- Total plans completed: 1 (v1.2)
- Average duration: ~7 min
- Total execution time: ~0.12 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 23 | 1/2 | ~7 min | ~7 min |

## Accumulated Context

### Decisions

- v1.0 shipped 2026-04-13: 14 phases, 48/49 requirements
- v1.1 shipped 2026-04-14: 8 phases, 20/22 requirements (2 organizer content gates pending)
- [v1.2 init]: Homepage restructured per validated Stitch mockup "Homepage Mockup v2"
- [v1.2 init]: Newsletter CTA is placeholder anchor only (CLO-6 backend deferred)
- [v1.2 init]: One-pager PDF hosted via Google Drive link
- [23-01]: Used the clean `playlist?list=…` URL form for `EDITION_2026.replaysUrl` (vs. `watch?v=…&list=…`).
- [23-01]: `editions.2026.thumbnail_alt.4` left in both locales as orphan (clean-up deferred per UI-SPEC §Accessibility checklist).
- [23-01]: `EDITION_2026.stats` array preserved despite UI-SPEC dropping the stats row (data kept for future consumers; cleanup deferred to v1.3).

### Pending Todos

- Pre-existing `astro check` baseline carries 11 type errors (content.config zod loaders, Edition2023PhotoGrid implicit-any, TestimonialsStrip template-literal keys, orphan `editions.2026.gallery_cta` references in homepage files). Not in scope for plan 23-01 — see `23-01-SUMMARY.md` "Deferred Issues" for the per-file fix list.

### Blockers/Concerns

- Hero background image: user must provide the replacement image (blocks Phase 25)
- 2026 replays playlist URL: CONFIRMED & wired in `EDITION_2026.replaysUrl` as of 23-01 (ED26-02 data layer satisfied; visible CTA ships in 23-02)
- Newsletter anchor behavior: scroll-to-stub vs aria-disabled -- decide during Phase 25 planning

## Session Continuity

Last session: 2026-04-18T08:33:22.000Z
Stopped at: Phase 23 plan 01 complete (data + i18n foundation shipped); next plan 23-02 (Edition2026Combined.astro component)
Resume file: .planning/phases/23-edition-2026-combined-section/23-02-component-PLAN.md
