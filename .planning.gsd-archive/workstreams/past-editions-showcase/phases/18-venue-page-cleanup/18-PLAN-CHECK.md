---
phase: 18-venue-page-cleanup
check_date: 2026-04-14
verdict: PASS
---

# Phase 18 Plan Check

## Verdict: PASS

Plans 18-01 and 18-02 together will achieve the Phase 18 goal.

## Success Criteria Coverage

| SC | Where addressed | Status |
|----|-----------------|--------|
| SC1 (block removed, separate commit) | 18-01 Tasks 1+2; no homepage file in `files_modified` | Covered |
| SC2 (grep zero + tsc green) | 18-01 Task 3 verify runs `tsc --noEmit` after deletion | Covered |
| SC3 (`venue.prev` zero) | 18-02 Task 1 verify + Task 2 test assertion | Covered |
| SC4 (anchor audit) | Explicitly deferred to 18-VERIFICATION.md per D-01; both plans state this | Covered (deferred, documented) |
| SC5 (`pnpm build` green, no broken `t()`) | 18-01 Task 3 and 18-02 Task 2 both run `pnpm build` | Covered |

## Dimension Findings

**Requirement coverage:** VENUE-01/02/04 -> 18-01; VENUE-03 -> 18-02. All four requirements from CONTEXT frontmatter are mapped.

**Truths quality:** Truths are specific and assertable (grep patterns, file paths, exact assertions). No vague items.

**Task sequencing (18-01):** Order is correct. Tasks 1+2 delete the block + all 8 orphaned symbols from both venue pages simultaneously (`EDITION_2026`, `ambiance0{3,6}`, `ambiance10`, plus locals). Because imports AND their call sites are removed in the same commit, there is no mid-task state where `tsc --noEmit` would fail with "unused import" or "undefined symbol". Task 3 creates the test and runs `tsc + build + vitest` as the green gate. Sound.

**Dependency:** 18-02 correctly declares `depends_on: ["18-01"]` and wave 2. Its test extension modifies the suite created in 18-01.

**Context compliance (D-01..D-05):**
- D-01 (2 commits): 18-01 ships commit A, 18-02 ships commit B. Anchor audit deferred to VERIFICATION per plan.
- D-02 (no filler): 18-01 Task 1 explicitly forbids filler link/divider; truth asserts clean ending on `venue.around.food_body`.
- D-03 (test assertion list): All source + dist assertions encoded; i18n assertion deferred with TODO (explicitly per D-05).
- D-04 (commit messages): Exact strings present in both plans' `<done>` blocks.
- D-05 (skip RED): Tests ship alongside deletion; no RED commit.

**Locale parity:** Both FR (`src/pages/venue/index.astro`) and EN (`src/pages/en/venue/index.astro`) covered as separate tasks; test suite asserts both dist outputs.

## Notes

None blocking. Plans are mechanical and well-scoped for pure-deletion work. Ready to execute.
