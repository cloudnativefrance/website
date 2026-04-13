---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Past Editions Showcase
status: defining_requirements
stopped_at: milestone initialized — requirements next
last_updated: "2026-04-13T00:00:00.000Z"
last_activity: 2026-04-13 -- v1.1 milestone started (Past Editions Showcase)
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-13 for v1.1 initialization)

**Core value:** A first-time visitor should immediately understand what the event is, when and where it happens, and feel compelled to register -- all within 5 seconds of landing.
**Current focus:** v1.1 Past Editions Showcase — defining requirements

## Current Position

Milestone: v1.1 — Past Editions Showcase
Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-04-13 — Milestone v1.1 started

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table and the v1.0 archive at `.planning/milestones/v1.0-ROADMAP.md`.

### v1.1 Scope Decisions

- Past-editions content is **static / hardcoded**, not CSV or content collection (2027 upcoming edition keeps CSV-first)
- Testimonials are **temporary placeholder quotes** — data source deferred
- **Stitch-first** workflow applies to every homepage change (move, new section, testimonials)
- 2026 homepage content is placeholder until real 2026 recap arrives

### Carry-Over from v1.0 (not in v1.1)

- P1: Subjective visual UATs for 7 phases (01, 02, 03, 04, 05, 09, 11) — ~18 tests
- P2: SPKR-01 fixture drift in `tests/build/speakers-grid.test.ts`
- P2: Zod 13 `LoaderConstraint` errors in `src/content.config.ts`
- P2: Organizer content placeholders (CONFERENCE_HALL_URL, ticketing URL, legal TODOs, social URLs, og-default.png)
- Deferred: FNDN-07 Kubernetes manifests — owned by `cnd-platform` GitOps repo

## Session Continuity

Last session: 2026-04-13 — v1.1 milestone initialized
Stopped at: milestone initialized — defining requirements
Resume action: continue `/gsd-new-milestone` through REQUIREMENTS.md + ROADMAP.md
