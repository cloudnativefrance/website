---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Homepage Restructuring
status: ready to execute
stopped_at: Phase 25 planned (1 plan, 1 wave; UI-SPEC + plan-checker both PASS)
last_updated: "2026-04-19T08:00:00.000Z"
last_activity: 2026-04-19 -- Phase 25 UI-SPEC approved + plan created and verified
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 6
  completed_plans: 5
  percent: 60
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-18)

**Core value:** A first-time visitor should immediately understand what the event is, when and where it happens, and feel compelled to register -- all within 5 seconds of landing.
**Current focus:** Phase 25 - Hero Redesign (planned, ready to execute)

## Current Position

Phase: 25 (3 of 4 in v1.2) -- Hero Redesign
Plan: 0 of 1 in current phase
Status: Ready to execute
Last activity: 2026-04-19 -- Phase 25 planned (UI-SPEC approved 5 PASS / 1 FLAG, plan-checker PASS, calibration on Accent Pink lockout endorsed as non-regression delta = 9)

Progress: [██████░░░░] 60% (5/5 plans scheduled so far in v1.2 complete — 2 in Phase 23, 3 in Phase 24; Phases 25 + 26 not yet planned)

## Performance Metrics

**Velocity:**

- Total plans completed: 5 (v1.2)
- Average duration: ~6 min
- Total execution time: ~0.55 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 23 | 2/2 | ~19 min | ~10 min |
| 24 | 3/3 | ~14 min | ~5 min |

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
- [24-02]: SponsorsPlatinumStrip.astro is data-agnostic — accepts pre-filtered `ReadonlyArray<CollectionEntry<"sponsors">>` as props; caller (Phase 26) owns `getCollection("sponsors")` + tier filter. Keeps the CSV-as-source-of-truth rule (CLAUDE.md) enforced at the page boundary, not inside reusable UI.
- [24-02]: Belt-and-braces empty-state guard wraps the entire `<section>` (not just the `<ul>`). When sponsors.length === 0 the component emits ZERO DOM — caller also guards, redundancy is intentional (T-24-10 / PITFALLS #3).
- [24-02]: No SponsorCard nesting — copied SponsorCard's interaction classes into a local `cardClasses` string. Rationale: homepage strip diverges from SponsorCard Platinum on 2 axes (max-w-[180px] max-h-16 vs [220px] max-h-20; p-6 md:p-7 vs p-8) — a shared component would force a new tier/prop, both of which scope-creep.
- [24-02]: Component NOT mounted to any page in Phase 24 — Phase 26 owns the homepage swap (same CONTEXT discipline as Phase 23).
- [24-03]: Edition2023Link.astro is fully prop-driven — no imports from @/lib/editions-data or @/i18n/utils. Caller (Phase 26) resolves i18n + locale-aware href before passing props. Keeps Stitch mockup → code 1:1 with no flag-driven branches.
- [24-03]: Pattern A arrow on /2023 CTA (trailing glyph lives in the i18n value editions.2023.view_page_cta). Template renders {viewPageLabel} alone — no decorative <span>. OPPOSITE of Pattern B used by 24-02; both coexist in the codebase. Rule: match the pattern the consumed i18n value already uses.
- [24-03]: h2 uses font-semibold + tracking-tight (NOT font-bold + uppercase + tracking-wider) — one notch lighter than the Sponsors strip h2 per UI-SPEC §Typography.
- [24-03]: Logo sits on bare background (no bg-card plate) per UI-SPEC §Discretion Resolutions. Default id="edition-2023" preserves existing /#edition-2023 deep-link resolution.
- [24-03]: Component NOT mounted to any page in Phase 24 — Phase 26 owns the homepage swap + PastEditionMinimal.astro deletion.

### Pending Todos

- Pre-existing `astro check` baseline carries 11 type errors (content.config zod loaders, Edition2023PhotoGrid implicit-any, TestimonialsStrip template-literal keys, orphan `editions.2026.gallery_cta` references in homepage files). Not in scope for plan 23-01 — see `23-01-SUMMARY.md` "Deferred Issues" for the per-file fix list.

### Blockers/Concerns

- Hero background image: user must provide the replacement image (blocks Phase 25)
- 2026 replays playlist URL: CONFIRMED & wired in `EDITION_2026.replaysUrl` as of 23-01 (ED26-02 data layer satisfied; visible CTA ships in 23-02)
- Newsletter anchor behavior: scroll-to-stub vs aria-disabled -- decide during Phase 25 planning

## Session Continuity

Last session: 2026-04-18T17:30:00.000Z
Stopped at: Phase 24 complete (all 3 plans shipped: 24-01 foundation, 24-02 SponsorsPlatinumStrip, 24-03 Edition2023Link). Astro check baseline unchanged (11 pre-existing errors), build green (156 pages). Phase 24 component layer is 100% done; mounting + PastEditionMinimal cleanup deferred to Phase 26 per CONTEXT D-01. Next: plan Phase 25 (Hero Redesign) — blocked on user-provided replacement background image.
Resume file: .planning/phases/24-sponsors-platinum-edition-2023/24-03-SUMMARY.md
