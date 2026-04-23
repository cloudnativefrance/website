---
phase: 22-a11y-uat-closeout
plan: 01
subsystem: a11y-validation
tags: [a11y, uat, closeout, deferred]
gap_closure: true
requires:
  - 21 (documentation backfill complete)
provides:
  - Documented deferral record for manual a11y validation + Playwright automation
affects: []
tech-stack:
  added: []
key-files:
  modified:
    - .planning/workstreams/past-editions-showcase/STATE.md
  created:
    - 22-CONTEXT.md
    - 22-01-PLAN.md
    - 22-SUMMARY.md
key-decisions:
  - All manual UAT (lightbox keyboard journey, Stitch approval, Lighthouse CLS) deferred to post-ship validation — user choice 2026-04-14 to ship v1.1 now (D-05)
  - SC4 (Playwright reduced-motion + lightbox automation) deferred to v1.2 per CONTEXT D-02
requirements-completed: []
requirements-deferred: [A11Y-01-manual, A11Y-03-manual, EDIT-05-manual]
metrics:
  duration: 5 min
  completed: 2026-04-14
  tasks: 1 (deferral record only)
  files: 3
  commits: 2
---

# Phase 22 Summary — A11y UAT Closeout (Deferred)

## Outcome

**Phase closed with all manual + automation items deferred.** User decision 2026-04-14: ship v1.1 now, validate manually after deploy.

## What Was Planned

`22-01-PLAN.md` enumerated 4 tasks:
1. Lightbox keyboard journey (10 manual items)
2. Stitch visual approval for `/2023`
3. Lighthouse CLS measurement
4. SC4 Playwright defer record

## What Was Done

Only the deferral records (this summary + STATE update). No code changes.

## Deferred Items (tracked for v1.1.x patch or v1.2)

### D-05: Manual UAT post-ship (was Tasks 1, 2, 3)

- **10 lightbox keyboard-journey items** (`19-UAT.md`) — focus trap, Escape, Arrow wrap, Tab cycle, Shift+Tab wrap, backdrop close, screen-reader announcement
- **Photo-grid CLS check** under 3G throttling (`19-UAT.md`)
- **Lighthouse CLS** capture for `/2023` + `/en/2023` (mobile + desktop)
- **Stitch visual approval** for `/2023` (`19-*/content-gates.md` §4)

**Risk:** Static a11y contracts in `tests/build/edition-2023-lightbox-a11y.test.ts` and `tests/build/edition-2023-page.test.ts` cover the structural promises (role=dialog, aria-modal, aria-label, focus-return data attrs, alt-text uniqueness). Live browser keyboard journey is the unverified gap. Acceptable to ship since:
- Lightbox JS is contained (no critical-path code)
- Failure mode is degraded UX on `/2023` (not site-wide)
- Public announcement of `/2023` is gated separately on organizer content sign-offs
- Easy to patch if defects surface

### D-02: SC4 Playwright reduced-motion + lightbox automation → v1.2

Rationale (from CONTEXT D-02):
- No browser test runner exists in the codebase yet (Vitest is unit/build-time only)
- Adding Playwright + a CI lane is its own multi-task scaffolding phase, not a closeout item
- Static a11y contracts cover the structural promises in code; live emulation is a v1.2 hardening goal
- Shipping v1.1 is gated on functional delivery, not on browser-emulated automation

## Verification

- No source code changed (`git diff --stat src/ tests/` between Phase 21 exit and Phase 22 exit is empty)
- `pnpm build` still green (156 pages, no test changes)
- `19-UAT.md` checkboxes remain unchecked but documented as deferred
- `content-gates.md` §4 (Stitch) remains open but documented as deferred

## Follow-up Triggers

- Post-deploy: walk the 10 manual items in `19-UAT.md` against production. Any fail → patch.
- v1.2 planning: include "Browser test scaffolding (Playwright + CI lane)" as a phase, then port the deferred a11y items + Phase 20 reduced-motion check into automated coverage.

## Self-Check

- 22-CONTEXT.md exists with locked decisions
- 22-01-PLAN.md exists (now superseded by ship-now decision; kept as record of the alternative path)
- 22-SUMMARY.md (this file) documents the deferral
- STATE.md updated to mark Phase 22 closed-with-deferrals and v1.1 ready for milestone-complete
