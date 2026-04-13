---
phase: 14-project-documentation
plan: 01
status: complete
requirements_completed: []
---

# 14-01 — Root-level docs (README + CONTRIBUTING)

## Files

- **new** `README.md` (72 lines) — project overview, stack, quickstart, data sources table, Further reading links
- **new** `CONTRIBUTING.md` (55 lines) — three non-negotiable rules + PR/commit flow + review flow

## ROADMAP success criteria (scoped to this plan)

| # | Criterion | Status |
|---|-----------|--------|
| 1 | README explains site, stack, quickstart, deeper-doc pointers | ✓ |
| 5 | CONTRIBUTING captures CSV rule, Stitch-first, i18n-key, PR flow | ✓ |
| 6 | README links → one-hop discoverable | ✓ (≥ 3 `docs/` links + CLAUDE/DESIGN/STITCH_WORKFLOW/CONTRIBUTING) |

## Decision enforcement

- **D-02 (existing root docs stay):** README's "Further reading" links to CLAUDE.md / DESIGN.md / STITCH_WORKFLOW.md at repo root, no moves.
- **D-05 (no duplication):** CONTRIBUTING opens with "Read `CLAUDE.md`. It holds the canonical Design Rules and Data Rules…" — grep-verified `CLAUDE.md` reference.
- **D-06 (one-hop discoverability):** `grep -c 'docs/' README.md` returns 10 (well above the ≥ 3 threshold).
- **D-07 (markdown only):** both files plain markdown; no MDX, no generators.
- **Global CLAUDE.md rule:** no co-author commits.

## Verify results

Both automated verify blocks PASS:
- README: all 17 grep checks + anti-TODO guard + `>= 3` docs/ links
- CONTRIBUTING: all 13 grep checks + anti-TODO guard

## Commits

1. `docs(14-01): add root README with stack, quickstart, and doc pointers`
2. `docs(14-01): add CONTRIBUTING with non-negotiable rules + PR/commit flow`

## Handoff to 14-02

The README references `docs/repo-structure.md`, `docs/updating-content.md`, and `docs/testing.md`. Those three files MUST exist when 14-02 lands or the links will 404. 14-02 is the Wave 2 plan that creates them.
