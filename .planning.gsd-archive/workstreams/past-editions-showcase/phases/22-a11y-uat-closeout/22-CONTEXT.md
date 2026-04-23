---
phase: 22-a11y-uat-closeout
milestone: v1.1
depends_on: [21]
requirements: [A11Y-01, A11Y-03, EDIT-05]
created: 2026-04-14
---

# Phase 22 Context — A11y UAT Closeout

## Goal

Convert deferred manual a11y items into checked UAT outcomes (or documented defers) so v1.1 archives with explicit a11y validation evidence.

## Decisions (Locked)

### D-01: Manual-only phase (no code commits)
SC1, SC2, SC3 are manual browser/Stitch/Lighthouse passes. The "execution" is the user walking through a checklist; the artifact is the filled-in `19-UAT.md` + `content-gates.md` + a one-line Lighthouse capture.

### D-02: SC4 (Playwright reduced-motion + lightbox automation) deferred to v1.2
User decision 2026-04-14. Static a11y contracts in Phase 19/20 are sufficient to ship v1.1. Browser-level emulation needs a Playwright/test-runner setup that doesn't exist in the codebase yet — that scaffolding is its own phase. Document in `22-SUMMARY.md` with rationale.

### D-03: Single plan, not multiple
One `22-01-PLAN.md` enumerating the manual checklist. No wave split needed.

### D-04: Phase complete = checklist filled, not green
Items can land as `pass`, `fail`, or `n/a` with one-line evidence. A `fail` triggers a follow-up gap plan (out of scope here). The phase artifact is the filled checklist.

## Out of Scope

- Playwright test authoring → v1.2
- Organizer content sign-offs (5 items in `phases/19-*/content-gates.md`) → external blockers
- v1.0 carry-over (SPKR-01, etc.) → v1.2

## Plans Anticipated

- **22-01-PLAN.md** — Manual UAT checklist (lightbox keyboard journey, Stitch approval, Lighthouse CLS) + SC4 defer record

## Next Step

Plan + execute Phase 22.
