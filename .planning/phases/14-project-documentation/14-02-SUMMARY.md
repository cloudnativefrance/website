---
phase: 14-project-documentation
plan: 02
status: complete
requirements_completed: []
---

# 14-02 — docs/ runbooks

## Files

| Path | Lines | Purpose |
|------|-------|---------|
| `docs/repo-structure.md` | 57 | Source-tree tour (≤ 110 cap) |
| `docs/updating-content.md` | 149 | Full CSV editor runbook (D-03) |
| `docs/testing.md` | 34 | Test commands + documented non-blockers (≤ 100 cap) |

## ROADMAP success criteria (scoped to this plan)

| # | Criterion | Status |
|---|-----------|--------|
| 2 | `docs/repo-structure.md` maps all top-level dirs | ✓ — src/pages, src/components, src/content, src/lib, src/i18n, .planning, tests/build, Dockerfile all present |
| 3 | `docs/updating-content.md` covers 4 Sheets, env vars, rebuild | ✓ — 4 entity sections, all 4 env vars referenced, cnd-platform link for production rebuild |
| 4 | `docs/testing.md` covers 3 runners + known failures | ✓ — vitest / astro check / astro build; documents content.config.ts drift + SPKR-01 residual |

## Decision enforcement

- **D-01 (combined doc set):** `docs/updating-content.md` opens with "This guide is for anyone adding or editing…" — one runbook addresses both developers and content editors, no separate file.
- **D-03 (full editor onboarding):** per-entity H2 sections (Speakers / Sessions / Sponsors / Team) each ship a column list with required/optional semantics + a "How to add a {entity}" step list. No screenshots per D-03 (UI-churn liability).
- **D-05 (no duplication):** CSV runbook explicitly defers to `src/content.config.ts` as source of truth for column shapes (grep-verified). Testing doc defers to `CONTRIBUTING.md` for the Stitch-first rule.
- **D-07 (markdown only):** all three files plain `.md`, no MDX, no generators.
- **Line caps:** repo-structure = 57 (cap 110), testing = 34 (cap 100). Both well under.

## Verify results

All three automated verify blocks PASS:
- `docs/repo-structure.md`: 9 grep checks + anti-TODO + line-count cap
- `docs/updating-content.md`: 17 grep checks + anti-TODO
- `docs/testing.md`: 8 grep checks + anti-TODO + line-count cap

## Intentional omissions (flagged in files)

- No Google Sheet URLs committed. The runbook says "Ask a maintainer" — the URLs are operationally sensitive (write scope) and belong in deploy env, not docs.
- No screenshots (D-03 explicit).
- No "per-column regex validation" guidance — that lives in `src/content.config.ts` and the runbook points there.

## Commits

1. `docs(14-02): add docs/repo-structure.md — source-tree tour`
2. `docs(14-02): add docs/updating-content.md — full CSV editor runbook`
3. `docs(14-02): add docs/testing.md — test commands + known non-blockers`

## Closes the Phase 14 success criteria bundle

All 6 ROADMAP success criteria for Phase 14 now satisfied (3 from 14-01 + 3 from 14-02). README's "Further reading" links resolve to real files (one-hop discoverability verified via reading `dist/`-free markdown).
