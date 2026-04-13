# Contributing to Cloud Native Days France Website

Welcome — this document is the short version of the rules and the PR/commit conventions used throughout the repo.

## Before you start

Read [`CLAUDE.md`](CLAUDE.md). It holds the canonical Design Rules and Data Rules enforced throughout this repository. The rest of this file summarizes those rules for human contributors and adds the PR/commit conventions we follow.

## The three non-negotiable rules

### 1. CSVs are the single source of truth

Never hardcode speaker, session, sponsor, or team data in `.astro`, `.ts`, or `.tsx` files. Always fetch it through the CSV loader helpers (`loadSessions`, speaker / sponsor / team equivalents under `src/lib/`). If you need to add or rename a column, update the Google Sheet, the CSV parser, the Zod schema in `src/content.config.ts`, and every downstream consumer in the same PR — a partial change ships broken types.

The full editor runbook — which Sheet backs which entity, how to publish CSV, how to trigger a rebuild — lives at [`docs/updating-content.md`](docs/updating-content.md).

### 2. Stitch-first for any visual change

Every new page or significant UI change is designed in Google Stitch first, validated with a maintainer, then implemented in code. Never skip straight to code for visual work. After executing a phase that produces pages or UI components, present each page in Stitch for review before considering the work done.

- Tooling setup, project IDs, and the `mcp__stitch__*` integration: [`STITCH_WORKFLOW.md`](STITCH_WORKFLOW.md)
- Design tokens, typography, spacing scale, component patterns: [`DESIGN.md`](DESIGN.md)

Prompts must reference design-system token roles (Background, Primary Blue, Accent Pink, Card surface, etc.) or quote the exact hex already in the locked design system. Never introduce a new hex in a Stitch prompt — it overrides the locked tokens and has to be re-edited out.

### 3. No hardcoded FR / EN strings

All locale-dependent text uses i18n translation keys in `src/i18n/ui.ts` consumed via `useTranslations(lang)`. Do not ship a string in one language only — add both FR and EN entries in the same PR. This applies to UI copy, aria labels, alt text, SEO descriptions, and meta tags.

## PR and commit flow

- **Branching.** Work on a feature branch named for the phase/plan you're working on — e.g. `phase-14/docs`, `gsd/phase-13-speaker-schema-drift-cleanup`. Open a PR against `main`.
- **Commit message style.** Conventional Commits **with phase-plan scope**, as used throughout this repo. Examples:
  - `docs(14-01): add root README`
  - `feat(04-02): speaker grid with keynote rail`
  - `fix(11-01): validate social links before rendering href`
  - `test(13-02): rewrite speaker tests against real roster`
  - `refactor(13-01): migrate speaker grid to session lookups`
- One logical change per commit. Commits should tell a readable story when reviewed in order.
- **Do NOT co-author commits.** No `Co-Authored-By:` lines on commits produced through assistants. No "Generated with Claude Code" trailers.
- **Before opening a PR**, run these three commands and make sure they are green for the code you touched:
  - `pnpm test` — vitest unit + build-output suites
  - `pnpm astro check` — TypeScript + Astro type diagnostics
  - `pnpm build` — end-to-end static bundle build

See [`docs/testing.md`](docs/testing.md) for what each command covers and which pre-existing failures are documented non-blockers. Do not fix non-blocking failures in an unrelated PR — flag them and move on.

- Keep PRs focused — one phase, one plan where possible. Wide PRs make review harder and roll-backs more expensive.
- Do NOT force-push to `main` or to shared feature branches. Force-push your own branch before it has been reviewed if you need to rebase.

## Review flow

At least one maintainer review before merge. For Stitch-first changes, the PR description must include a link to the Stitch screen(s) or an exported screenshot so reviewers can diff the design against the implementation.

If review surfaces an issue with a locked design decision (e.g. a CONTEXT.md D-number), open the discussion there rather than changing the decision in the PR — decisions are phase-level and should move deliberately.
