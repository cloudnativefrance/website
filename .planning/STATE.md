---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Homepage Restructuring
status: in progress
stopped_at: Phase 23 plans complete (data + i18n + component shipped); awaiting code review and verification
last_updated: "2026-04-18T10:45:00.000Z"
last_activity: 2026-04-18 -- Phase 23 plan 02 complete (Edition2026Combined.astro shipped)
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 2
  completed_plans: 2
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-18)

**Core value:** A first-time visitor should immediately understand what the event is, when and where it happens, and feel compelled to register -- all within 5 seconds of landing.
**Current focus:** Phase 23 - Edition 2026 Combined Section (execution complete; next: code review + verification)

## Current Position

Phase: 23 (1 of 4 in v1.2) -- Edition 2026 Combined Section
Plan: 2 of 2 in current phase (23-01 + 23-02 complete; awaiting code review and verification)
Status: Execution complete
Last activity: 2026-04-18 -- Phase 23 plan 02 complete (Edition2026Combined.astro 184-line pure-SSR component shipped)

Progress: [██████████] 100% (within Phase 23: 2/2 plans)

## Performance Metrics

**Velocity:**

- Total plans completed: 2 (v1.2)
- Average duration: ~10 min
- Total execution time: ~0.32 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 23 | 2/2 | ~19 min | ~10 min |

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
- [23-02]: YouTube aftermovie embed uses `youtube-nocookie.com/embed` per D-12 (privacy-respecting, no tracking cookies until play).
- [23-02]: Both external CTAs (replays + PDF) carry `target="_blank" rel="noopener noreferrer"` per D-11 (reverse-tabnabbing + Referer leak mitigation).
- [23-02]: Testimonials sub-block rendered with `<h3>` (not a second `<h2>`) to preserve single-h2-per-section heading hierarchy (Pitfall #8).
- [23-02]: Component NOT mounted to any page in Phase 23 — Phase 26 owns the homepage swap (CONTEXT D-01).

### Pending Todos

- Pre-existing `astro check` baseline carries 11 type errors (content.config zod loaders, Edition2023PhotoGrid implicit-any, TestimonialsStrip template-literal keys, orphan `editions.2026.gallery_cta` references in homepage files). Not in scope for plan 23-01 — see `23-01-SUMMARY.md` "Deferred Issues" for the per-file fix list.

### Blockers/Concerns

- Hero background image: user must provide the replacement image (blocks Phase 25)
- 2026 replays playlist URL: CONFIRMED & wired in `EDITION_2026.replaysUrl` as of 23-01 (ED26-02 data layer satisfied; visible CTA ships in 23-02)
- Newsletter anchor behavior: scroll-to-stub vs aria-disabled -- decide during Phase 25 planning

## Session Continuity

Last session: 2026-04-18T10:45:00.000Z
Stopped at: Phase 23 execution complete (both plans shipped); next: code review + phase verification, then advance to Phase 24
Resume file: .planning/phases/23-edition-2026-combined-section/23-02-SUMMARY.md
