---
phase: 21-documentation-backfill-and-discovery-loop
milestone: v1.1
depends_on: [15, 16, 17, 18, 19, 20]
requirements: [EDIT-02, DOC-01]
created: 2026-04-14
audit_source: ../../v1.1-MILESTONE-AUDIT.md
---

# Phase 21 Context — Documentation Backfill + Discovery-Loop Fix

## Goal

Close all audit-driven gaps that block clean v1.1 archival, plus ship the one functional integration miss (homepage 2023 minimal block doesn't link to the new `/2023` page).

## Source of Truth

`v1.1-MILESTONE-AUDIT.md` §6 "Recommended actions before archival". Five concrete deliverables, all already enumerated as ROADMAP success criteria.

## Decisions (Locked)

### D-01: Two plans, not five
Group the four doc-debt items into one plan (21-01) and the functional discovery-loop fix into its own plan (21-02). Doc work and code work need different commit rhythms; mixing them adds reviewer noise.
- **21-01 — Documentation backfill** (4 commits): Phase 19 summaries · STATE.md reconciliation · REQUIREMENTS.md refresh · ROADMAP §v1.1 goal-line correction
- **21-02 — Discovery-loop fix** (1 commit): `PastEditionMinimal` adds "View 2023 edition →" CTA → `/2023` (FR) / `/en/2023` (EN) + Vitest assertion

### D-02: Phase 19 summary backfill — derive from artifacts, not git log
Each `19-0X-SUMMARY.md` summarizes from the corresponding `19-0X-PLAN.md` + the actual commits + `19-VALIDATION.md`. Match Phase 17/20 frontmatter style. No new analysis — strict reconciliation. The phase-level `19-SUMMARY.md` rolls up the five plan summaries.

### D-03: STATE.md reconciliation
Header section (Project Reference, Current Position, Progress bar) currently says "Phase 17 - EXECUTING" / "0 of 6". Frontmatter says `completed_phases: 6, percent: 100`. Fix the header to match frontmatter post-merge state. Add Phase 21/22 as upcoming.

### D-04: REQUIREMENTS.md traceability refresh
Flip the 19 shipped REQ-IDs to `Complete` (per audit §1 status column). The 3 organizer-content-gate rows (I18N-03 wording, EDIT-07 stats, EDIT-07 gallery URL) stay `pending` with a one-line note pointing to `phases/19-*/content-gates.md`.

### D-05: ROADMAP §v1.1 wording correction
Add a one-line note under the milestone goal: "Section order update (post-Stitch review): Testimonials renders **before** the past-edition sections (CFP → Testimonials → 2026 → 2023), not after as originally drafted." Don't rewrite history; document the correction.

### D-06: Discovery-loop CTA placement
Add a "View 2023 edition →" link inside `PastEditionMinimal.astro`, rendered alongside (or below) the existing playlist link. Use a `viewPageHref` prop so the component stays generic. Test: assert dist HTML at `/` and `/en/` contains an `<a href="/2023"` (FR) and `<a href="/en/2023"` (EN) inside the 2023 minimal section.

### D-07: Test extension target
Extend the existing `tests/build/homepage-2026-section.test.ts` (which already covers the 2023 minimal block at lines 100-130) with the new CTA assertion. No new test file.

### D-08: i18n key for the CTA
Add `editions.2023.view_page_cta` to `src/i18n/ui.ts` — FR: "Voir l'édition 2023 →", EN: "View the 2023 edition →". Same-commit FR+EN landing per I18N-01.

### D-09: Commit conventions
Match Phase 17/18/20 style:
- 21-01 commits: `docs(19-0X): backfill summary`, `docs(19): phase summary`, `docs(state): reconcile header with frontmatter post-v1.1 merge`, `docs(requirements): flip 19 v1.1 reqs to Complete`, `docs(roadmap): document post-Stitch testimonials placement`
- 21-02 commits: `feat(21-02): wire homepage 2023 minimal block to /2023 + i18n cta key`

## Gray Areas (Resolved)

| Item | Resolution | Source |
|------|-----------|--------|
| Should phase 19 summaries be a separate phase? | No — bundled into 21-01 to keep audit-closeout in one phase | D-01 |
| New i18n key vs reuse existing? | New key `editions.2023.view_page_cta` (semantically distinct from playlist CTA) | D-08 |
| Add new test file or extend existing? | Extend `homepage-2026-section.test.ts` | D-07 |
| Mark 19/20 complete in ROADMAP table? | Already done in `d6783f8` commit. No action. | — |

## Out of Scope (Phase 22 or later)

- Lightbox manual UAT checkboxes → Phase 22
- Stitch approval for `/2023` → Phase 22
- Lighthouse CLS measurement → Phase 22
- Playwright reduced-motion automation → Phase 22 (decision in 22-CONTEXT)
- Organizer content sign-offs (5 items) → external blockers, tracked in `phases/19-*/content-gates.md`

## Plans Anticipated

- **21-01-PLAN.md** — Documentation backfill (4 commits)
- **21-02-PLAN.md** — Homepage 2023 → `/2023` discovery-loop CTA (1 commit)

## Next Step

`/gsd-plan-phase 21` continues from here; no research needed (audit is the research).
