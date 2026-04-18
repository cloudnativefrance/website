---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Homepage Restructuring
status: in progress
stopped_at: Phase 24 plan 24-01 (foundation) complete; next up 24-02 SponsorsPlatinumStrip in wave 2
last_updated: "2026-04-18T17:13:28.000Z"
last_activity: 2026-04-18 -- Phase 24 plan 01 (foundation) executed and committed
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 5
  completed_plans: 3
  percent: 35
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-18)

**Core value:** A first-time visitor should immediately understand what the event is, when and where it happens, and feel compelled to register -- all within 5 seconds of landing.
**Current focus:** Phase 24 - Sponsors Platinum & Edition 2023 (planned, ready to execute)

## Current Position

Phase: 24 (2 of 4 in v1.2) -- Sponsors Platinum & Edition 2023
Plan: 1 of 3 in current phase (24-01 foundation shipped; 24-02 + 24-03 next in wave 2)
Status: In progress
Last activity: 2026-04-18 -- Phase 24 plan 01 executed: extracted safeUrl + safeLogoPath into src/lib/sponsor-utils.ts, refactored SponsorCard.astro, added sponsors.homepage.{heading,cta} keys in fr+en

Progress: [███░░░░░░░] 35% (3/5 plans in v1.2 complete — 2 in Phase 23, 1 in Phase 24)

## Performance Metrics

**Velocity:**

- Total plans completed: 3 (v1.2)
- Average duration: ~9 min
- Total execution time: ~0.45 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 23 | 2/2 | ~19 min | ~10 min |
| 24 | 1/3 | ~8 min | ~8 min |

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
- [23-fix]: Mosaic layout pattern adopted across PastEditionSection.astro AND Edition2026Combined.astro: hero col-span-12 / md:col-span-8 + md:row-span-2; medium+small col-span-6 / md:col-span-4 + md:row-span-1. Produces "1 large left + 2 stacked right" on desktop, robust against [hero, medium, medium] data shapes (was 6+4+4=14 wrap regression).
- [23-fix]: Featured-video max-width unified to max-w-4xl across both PastEditionSection and Edition2026Combined for visual balance with the wider hero photo.
- [24-01]: safeUrl + safeLogoPath extracted into src/lib/sponsor-utils.ts (named exports, no default); SponsorCard.astro imports from there; SocialLinks.astro keeps its own inline safeUrl copy by planner design (cross-component extraction deferred to v1.3 per Pitfall #12).
- [24-01]: sponsors.homepage.cta uses Pattern B (no arrow in i18n value; template renders `<span aria-hidden="true">→</span>`) — keeps the arrow accessibility-correct and locale-agnostic; mirrors Phase 23 convention for `editions.2026.replays_cta`.

### Pending Todos

- Pre-existing `astro check` baseline carries 11 type errors (content.config zod loaders, Edition2023PhotoGrid implicit-any, TestimonialsStrip template-literal keys, orphan `editions.2026.gallery_cta` references in homepage files). Not in scope for plan 23-01 — see `23-01-SUMMARY.md` "Deferred Issues" for the per-file fix list.

### Blockers/Concerns

- Hero background image: user must provide the replacement image (blocks Phase 25)
- 2026 replays playlist URL: CONFIRMED & wired in `EDITION_2026.replaysUrl` as of 23-01 (ED26-02 data layer satisfied; visible CTA ships in 23-02)
- Newsletter anchor behavior: scroll-to-stub vs aria-disabled -- decide during Phase 25 planning

## Session Continuity

Last session: 2026-04-18T17:13:28.000Z
Stopped at: Phase 24 plan 01 (foundation) complete — sponsor-utils.ts + SponsorCard refactor + 2 new i18n keys shipped; next: 24-02 (SponsorsPlatinumStrip.astro) and 24-03 (Edition2023Link.astro) in wave 2
Resume file: .planning/phases/24-sponsors-platinum-edition-2023/24-01-SUMMARY.md
