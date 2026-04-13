# Phase 14: Project Documentation — Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Produce the new-contributor documentation surface the repo currently lacks: `README.md`, `CONTRIBUTING.md`, and a `docs/` directory with focused runbooks. Goal: a new contributor is productive in under 30 minutes.

**Not in scope** (confirmed with user):
- Deployment runbook — K8s manifests live in the separate `cnd-platform` repo per FNDN-07 deferral.
- i18n contribution guide — Phase 11 (security + i18n hardcode fixes) owns this.
- Comprehensive API docs — the code is small; well-named identifiers + existing docstrings are the spec.
- Changelog / release notes — no release cadence yet.
- Screenshots — age badly against Google Sheets UI changes; skip.
- Separate non-dev docs set — A1 decision below.
</domain>

<decisions>
## Implementation Decisions

### Audience

- **D-01 [A1]:** One combined doc set targeted at developers. The CSV-update runbook (`docs/updating-content.md`) is written in plain language so non-dev staff (content editors) can follow it too. No separate "editors only" doc — 2-3 people maintain content and they need one canonical guide, not two drift-prone ones.

### Existing docs positioning

- **D-02 [B1]:** Existing root-level docs stay where they are. `README.md` gains a "Further reading" section linking to `CLAUDE.md` (AI rules — must remain at root per Claude Code requirement), `DESIGN.md` (canonical design system — referenced by 14+ planning artifacts, moving would break refs), and `STITCH_WORKFLOW.md` (Stitch workflow guide). No reorganization; no summarizing-then-deleting.

### Runbook depth for `docs/updating-content.md`

- **D-03 [C3]:** Full content-editor onboarding. The runbook includes:
  1. Which Google Sheet is which (speakers, sessions, sponsors, team) with their canonical URLs exposed via the env vars in `src/lib/remote-csv.ts`.
  2. Step-by-step "how to add a speaker": append a row, fill required columns, hit File → Share → Publish to web → CSV, paste the published URL into the appropriate env var (or local fallback CSV for dev), trigger a rebuild.
  3. Same pattern for sessions, sponsors, team (one section per entity).
  4. What each column means, which are required, which are optional — mirror the Zod schemas in `src/content.config.ts` (copy the column shape, reference the schema file for source-of-truth).
  5. How the build picks the data source: env var if set, otherwise `src/content/{schedule,sponsors,team}/*.csv` fallback.
  6. How to trigger a rebuild in production (link to the cnd-platform repo's deploy docs rather than duplicating).
  7. NO screenshots — they rot against Google Sheets UI churn. Use plain-text step descriptions.

### Documentation structure

- **D-04:** Layout:
  - `README.md` — project overview, stack, quickstart (`pnpm install`, `pnpm dev`, `pnpm build`, `pnpm test`), where to find deeper docs.
  - `CONTRIBUTING.md` — the CSV source-of-truth rule (from CLAUDE.md), Stitch-first rule (from CLAUDE.md), i18n-key rule, PR/review flow, commit style.
  - `docs/repo-structure.md` — a tour of `src/pages`, `src/components`, `src/content` (CSV fallbacks), `src/lib`, `src/i18n`, `.planning/`, `tests/`.
  - `docs/updating-content.md` — the CSV runbook (per D-03).
  - `docs/testing.md` — `pnpm vitest run`, `pnpm astro check`, `pnpm astro build`, known pre-existing failures to ignore (content.config.ts Astro loader drift; 1 SPKR-01 fixture test left over — cross-reference Phase 13 deferred items).

### Scope guards

- **D-05:** Do NOT duplicate content that lives elsewhere. README quickstart references `package.json` scripts; it does not re-specify what `pnpm dev` does beyond one line. CONTRIBUTING rules link to CLAUDE.md rather than re-documenting them.
- **D-06:** Link from `README.md` to every other doc in the set so the surface is discoverable via one jump. Reverse-linking (each doc back to README) is optional — keep only what reduces navigation friction.
- **D-07:** Docs are markdown only. No MDX, no generated content, no scripts in this phase. The tech-debt cost must stay close to zero.

### Claude's Discretion

- Exact H1 / H2 structure inside each file.
- Whether `docs/testing.md` is one file or splits into `docs/testing.md` + `docs/known-issues.md` — small enough to be one file; planner picks.
- Whether CONTRIBUTING uses Conventional Commits verbatim or lists the patterns we actually use (`feat(NN-MM): ...`, `fix(...)...`, `docs(...): ...`).
- Tone: pragmatic, second-person, short paragraphs. No emoji unless absolutely necessary.
</decisions>

<canonical_refs>
## Canonical References

- `CLAUDE.md` — Design Rules (Stitch-first) + Data Rules (CSV source-of-truth); CONTRIBUTING must mirror these
- `DESIGN.md` — design system
- `STITCH_WORKFLOW.md` — Stitch-first workflow
- `package.json` — scripts (`dev`, `build`, `test`, `astro`)
- `Dockerfile` — multi-stage Astro → nginx (mentioned briefly in README; not rerun instructions)
- `src/lib/remote-csv.ts` — env vars `SCHEDULE_SESSIONS_CSV_URL`, `SCHEDULE_SPEAKERS_CSV_URL`, `SPONSORS_CSV_URL`, `TEAM_CSV_URL` — ALL listed in the CSV runbook
- `src/content/schedule/{sessions,speakers}.csv`, `src/content/sponsors/sponsors.csv`, `src/content/team/team.csv` — local fallback CSVs
- `src/content.config.ts` — Zod schemas (source of truth for required / optional columns)
- `.planning/phases/13-speaker-schema-drift-cleanup/13-02-SUMMARY.md` — records the residual SPKR-01 fixture drift that `docs/testing.md` needs to flag as a known non-blocking failure
- `.github/workflows/build-image.yml` — CI; mention in README's "CI" one-liner
- `.planning/ROADMAP.md` §Phase 14 — 6 success criteria

## Deferred Ideas

- Architecture diagram (entity-relationship for speakers/sessions/sponsors/team)
- Onboarding video / screencast
- Doc site generator (VitePress, Docusaurus) — current markdown surface is small enough that a static generator would be overkill
- Release process / changelog tooling — no release cadence yet
- i18n contribution guide — Phase 11 territory
</canonical_refs>
