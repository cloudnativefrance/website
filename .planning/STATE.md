---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Past Editions Showcase
status: executing
stopped_at: Phase 15 context gathered
last_updated: "2026-04-13T20:20:28.855Z"
last_activity: 2026-04-13 -- Phase 16 planning complete
progress:
  total_phases: 6
  completed_phases: 1
  total_plans: 8
  completed_plans: 4
  percent: 50
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-13 for v1.1 initialization)

**Core value:** A first-time visitor should immediately understand what the event is, when and where it happens, and feel compelled to register -- all within 5 seconds of landing.
**Current focus:** Phase 15 — stitch-full-homepage-mock

## Current Position

Milestone: v1.1 — Past Editions Showcase (Phases 15-20)
Phase: 15 (stitch-full-homepage-mock) — EXECUTING
Plan: 1 of 4
Status: Ready to execute
Last activity: 2026-04-13 -- Phase 16 planning complete

Progress: [░░░░░░░░░░] 0% (0 of 6 v1.1 phases complete)

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table and the v1.0 archive at `.planning/milestones/v1.0-ROADMAP.md`.

### v1.1 Scope Decisions

- Past-editions content is **static / hardcoded**, not CSV or content collection (2027 upcoming edition keeps CSV-first)
- Testimonials are **temporary placeholder quotes** — data stays inline in `testimonials-data.ts`
- **Stitch-first** workflow applies to every homepage change (Phase 15 gates all UI work)
- 2026 homepage content is placeholder until real 2026 recap arrives — tracker issue required
- Lightbox on 2023 photos IS in scope (overrides research "defer" recommendation)
- Marquee animation on testimonials IS in scope (overrides research "static grid" default)
- Bilingual (FR + EN) mandatory — FR+EN land together, never FR-only

### v1.1 Hard Sequencing (from ARCHITECTURE.md + PITFALLS.md)

- Stitch full-homepage mock BEFORE any code (Phase 15)
- Asset pre-optimization + global `prefers-reduced-motion` reset BEFORE any component (Phase 16)
- Shared `PastEditionSection.astro` shell BEFORE 2026 or 2023 variants (Phase 16)
- 2026 homepage integration verified live BEFORE venue block deletion (Phase 17 → Phase 18)
- Phases 19 (2023+lightbox) and 20 (testimonials) parallelize after Phase 16

### Carry-Over from v1.0 (not in v1.1)

- P1: Subjective visual UATs for 7 phases (01, 02, 03, 04, 05, 09, 11) — ~18 tests
- P2: SPKR-01 fixture drift in `tests/build/speakers-grid.test.ts`
- P2: Zod 13 `LoaderConstraint` errors in `src/content.config.ts`
- P2: Organizer content placeholders (CONFERENCE_HALL_URL, ticketing URL, legal TODOs, social URLs, og-default.png)
- Deferred: FNDN-07 Kubernetes manifests — owned by `cnd-platform` GitOps repo

### Blockers/Concerns

- Phase 19 content gate: KCD/CNCF brand-history FR+EN wording requires organizer sign-off before merge (I18N-03)
- Phase 19 content gate: 2023 final stats + gallery URL pending — ship with placeholder + tracker (EDIT-07)
- Phase 17 content gate: Real 2026 recap pending — ship with placeholder + tracker

## Session Continuity

Last session: 2026-04-13T18:23:15.555Z
Stopped at: Phase 15 context gathered
Resume action: `/gsd-plan-phase 15` (Stitch Full-Homepage Mock)
