---
phase: 05
plan: 04
subsystem: navigation-wiring-and-phase-integration
tags: [navigation, wiring, integration, a11y]
requires:
  - 05-02 (sponsors pages at /sponsors + /en/sponsors)
  - 05-03 (team pages at /team + /en/team)
provides:
  - Live Partenaires + Equipe header links in both locales
  - Phase 5 integration gate (full `pnpm build` passes with 146 routes)
affects:
  - Closes D-10 (nav wiring) and final Phase 10 dead-link TODOs
  - Closes SPNS-01 + TEAM-01 routing acceptance criteria
tech-stack:
  added: []
  patterns:
    - Existing `getLocalePath(lang, path)` prefix-only transform (symmetric English slugs per D-01)
key-files:
  created:
    - .planning/phases/05-sponsors-team/05-04-SUMMARY.md
  modified:
    - src/components/Navigation.astro
decisions:
  - No change to `src/i18n/utils.ts` needed — D-01's symmetric English slugs (`/sponsors`, `/team` in both locales) are handled natively by prefix-only `getLocalePath`. Matches the `/speakers` precedent from Phase 4.
  - Pre-existing 33 `astro check` errors in Phase 4 speakers files are out of scope (SCOPE BOUNDARY). `pnpm build` itself succeeds — those are type-level warnings from stale test/index files, not runtime failures.
metrics:
  duration: ~4 min
  completed: 2026-04-12
requirements: [SPNS-01, TEAM-01]
---

# Phase 05 Plan 04: Navigation Wiring & Phase Integration Summary

Two-line diff in `src/components/Navigation.astro` flips the last two `dead: true` header placeholders to live routes, making the Phase 5 sponsor + team pages reachable from the site chrome. Final `pnpm build` is the phase-level integration gate — 146 routes emit cleanly, all D-01..D-11 decisions verified against the built HTML.

## Navigation.astro Diff (2 lines)

```diff
-  { key: "nav.sponsors" as const, path: "/",         dead: true  }, // Phase 5 pending (D-05)
+  { key: "nav.sponsors" as const, path: "/sponsors", dead: false },
   { key: "nav.venue"    as const, path: "/venue",    dead: false }, // Phase 6
-  { key: "nav.team"     as const, path: "/",         dead: true  }, // Phase 5 pending (D-05)
+  { key: "nav.team"     as const, path: "/team",     dead: false },
```

EN mirrors (`/en/sponsors`, `/en/team`) resolve via the existing `getLocalePath(lang, path)` — no route map extension needed (D-01 symmetric English slugs).

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `d210a82` | feat(05-04): wire sponsors + team nav to live routes |
| 2 | _(verification-only)_ | Phase integration gate — no file changes |

## Build Verification

```
22:10:07 [build] 146 page(s) built in 5.74s
22:10:07 [build] Complete!
```

**Route count:** 146 = 142 (Phase 10 baseline) + 2 sponsors + 2 team routes. Matches plan's success criteria.

**Four new routes present:**
- `dist/sponsors/index.html`
- `dist/en/sponsors/index.html`
- `dist/team/index.html`
- `dist/en/team/index.html`

### Nav Wiring Smoke Test

| Check | Result |
|-------|--------|
| `href="/sponsors"` in `dist/index.html` (FR home) | 1 match |
| `href="/en/sponsors"` in `dist/en/index.html` (EN home) | 1 match |
| `href="/team"` in `dist/index.html` | 1 match |
| `href="/en/team"` in `dist/en/index.html` | 1 match |

### Security Gate

| Check | Result |
|-------|--------|
| `href="javascript:"` anywhere in `dist/` | **0 matches** (zero tolerance, passes) |
| `target="_blank"` on sponsor anchors | present |
| Phase 5-02 `safeUrl` + `safeLogoPath` gating | confirmed via grep |

### Copy Verification

| Page | FR copy | EN copy |
|------|---------|---------|
| sponsors | "Nos partenaires" + "Nous contacter" ✓ | "Our sponsors" + "Contact us" ✓ |
| team | "Équipe principale" + "Bénévoles" ✓ | "Core Team" + "Volunteers" ✓ |

## Decision Coverage Matrix (D-01..D-11)

| Decision | Topic | Status | Evidence |
|----------|-------|--------|----------|
| D-01 | Symmetric English slugs (`/sponsors`, `/team` in both locales) | ✅ | 4 built routes under `dist/sponsors`, `dist/en/sponsors`, `dist/team`, `dist/en/team`. No `getLocalePath` extension required. | Plan 05-02 + 05-03 |
| D-02 | CSV data source + env-var remote URLs | ✅ | `src/content/sponsors/sponsors.csv` + `src/content/team/team.csv` exist; `SPONSORS_CSV_URL` + `TEAM_CSV_URL` in `src/lib/remote-csv.ts`. YAML files removed. | Plan 05-01 |
| D-03 | Tier size hierarchy (220/160/120/88 px logo widths) | ✅ | Built `dist/sponsors/index.html` contains all four `max-w-[220px]`, `max-w-[160px]`, `max-w-[120px]`, `max-w-[88px]` tokens. | Plan 05-02 |
| D-04 | Description as native `title=` tooltip | ✅ | Sponsor anchors in `dist/sponsors/index.html` have `title="..."` attributes. | Plan 05-02 |
| D-05 | Empty-tier hiding + single global CTA | ✅ | Page conditionally renders tier sections; `SponsorCTA.astro` always rendered unconditionally. | Plan 05-02 |
| D-06 | New `TeamMemberCard.astro` (not reusing SpeakerCard) | ✅ | `src/components/team/TeamMemberCard.astro` exists. | Plan 05-03 |
| D-07 | Photo-optional w/ initials fallback via SpeakerAvatar | ✅ | Plan 05-03 SUMMARY verifies `>CL<` / `>EG<` initials render for photo-less rows. | Plan 05-03 |
| D-08 | Group order: Core → Program Committee → Volunteers | ✅ | Built `dist/team/index.html` heading order: line 1 "Équipe principale", line 7 "Comité de programme", line 13 "Bénévoles". | Plan 05-03 |
| D-09 | Group heading copy keys (`team.group.*`) | ✅ | `Comité de programme` (FR) + `Program Committee` (EN) present in built HTML. | Plan 05-03 + i18n commit caef666 |
| D-10 | Nav wiring (Navigation.astro lines 15 + 17) | ✅ | This plan — commit `d210a82`. Zero `dead: true` and zero `Phase 5 pending` in `src/components/Navigation.astro`. | Plan 05-04 |
| D-11 | CSV row order preserved (no auto-sort) | ✅ | No sort operation exists in Plans 05-02 / 05-03 page code (verified by inspection; collections iterate `getCollection()` directly in CSV order). | Plans 05-02 + 05-03 |

**All 11 decisions implemented.**

## Task 1 Verification (Nav Wiring)

| Acceptance criterion | Result |
|----------------------|--------|
| `rg 'path: "/sponsors"' src/components/Navigation.astro` → 1 | ✅ line 15 |
| `rg 'path: "/team"' src/components/Navigation.astro` → 1 | ✅ line 17 |
| `rg 'dead: true' src/components/Navigation.astro` → 0 | ✅ |
| `rg 'Phase 5 pending' src/components/Navigation.astro` → 0 | ✅ |
| `/en/sponsors/index.html` emitted | ✅ |
| `/en/team/index.html` emitted | ✅ |

## Task 2 Verification (Phase Integration)

| Acceptance criterion | Result |
|----------------------|--------|
| `pnpm build` exits 0 | ✅ (146 pages) |
| 4 new built HTML files exist | ✅ |
| Zero `href="javascript:"` in `dist/` | ✅ |
| FR `/sponsors/index.html` contains "Nos partenaires" + "Nous contacter" | ✅ |
| EN `/en/sponsors/index.html` contains "Our sponsors" + "Contact us" | ✅ |
| FR `/team/index.html` contains "Équipe principale" + "Bénévoles" | ✅ |
| EN `/en/team/index.html` contains "Core Team" + "Volunteers" | ✅ |
| All 11 D-XX decisions confirmed | ✅ (matrix above) |
| `pnpm astro check` exits 0 | ❌ **33 pre-existing errors** — see Deferred Issues |

## ROADMAP Phase 5 Success Criteria Traceability

| Criterion | Implemented By | Status |
|-----------|---------------|--------|
| 1. Sponsors displayed in tiers (Platinum/Gold/Silver/Community) | Plan 05-02 (SponsorTierSection) | ✅ |
| 2. Each sponsor has logo + description + external link | Plan 05-02 (SponsorCard) | ✅ |
| 3. Team 10–20 members with photo + name + role + socials | Plan 05-03 (TeamMemberCard + CSV rows) | ✅ |
| 4. Team grouped by function (Core / PC / Volunteers) | Plan 05-03 (TeamGroupSection + D-08 order) | ✅ |
| 5. Managed via content collections | Plan 05-01 (CSV-backed collections) | ✅ |

All 5 ROADMAP success criteria satisfied.

## Per-Plan Links

- [05-01-SUMMARY.md](./05-01-SUMMARY.md) — CSV data layer migration
- [05-02-SUMMARY.md](./05-02-SUMMARY.md) — Sponsors page (SponsorCard, SponsorTierSection, SponsorCTA, 2 routes)
- [05-03-SUMMARY.md](./05-03-SUMMARY.md) — Team page (TeamMemberCard, TeamGroupSection, 2 routes)
- [05-04-SUMMARY.md](./05-04-SUMMARY.md) — **This plan** (nav wiring + phase integration gate)

## Deviations from Plan

None — plan executed exactly as written. 2-line nav diff applied, integration gate run, all decisions verified.

## Deferred Issues

**Pre-existing `pnpm astro check` errors (33, unchanged from Plans 05-01 / 05-02 / 05-03 SUMMARYs):**

These live entirely outside the files touched by this plan and are already documented in prior summaries. Per SCOPE BOUNDARY rule, they are not fixed here:

- `src/pages/speakers/index.astro`, `src/pages/en/speakers/index.astro` — reference `talkTitle`, `talkDuration`, `talkTrack` that don't exist on the post-05-01 speakers schema. (Phase 4 follow-up.)
- `src/lib/__tests__/speakers.test.ts` — stale test fixtures. (Phase 4 follow-up.)
- `src/content.config.ts:88,110,127` — `csvLoader` LoaderConstraint type mismatch. (Plan 05-01.)
- Two `ts(6385)` Zod `.url()` deprecation warnings. (Zod v4 migration.)

`pnpm build` itself succeeds (146 pages emitted) — these are type-surface warnings, not build failures.

## Known Stubs

None introduced by this plan. Downstream stubs (placeholder sponsor logos under `/public/sponsors/`, `contact@cloudnativedays.fr` email) are inherited from Plans 05-01 / 05-02 and already documented there — they will land via organizer content-ops.

## Threat Flags

None. This plan introduced no new trust boundaries — it flipped two boolean flags in a known-good component. Phase-level security check (`rg 'href="javascript:" dist/'` = 0) confirms Plan 05-02's `safeUrl` + `safeLogoPath` guards held across the final build.

## Self-Check: PASSED

**File modified exists and contains expected changes:**
- FOUND: `src/components/Navigation.astro` — `path: "/sponsors"` line 15, `path: "/team"` line 17, zero `dead: true`, zero `Phase 5 pending`

**Commit exists:**
- FOUND: `d210a82` — feat(05-04): wire sponsors + team nav to live routes

**Build artifacts exist:**
- FOUND: `dist/sponsors/index.html`
- FOUND: `dist/en/sponsors/index.html`
- FOUND: `dist/team/index.html`
- FOUND: `dist/en/team/index.html`

**Nav wiring visible in rendered HTML:**
- FOUND: `href="/sponsors"` in `dist/index.html`
- FOUND: `href="/en/sponsors"` in `dist/en/index.html`
- FOUND: `href="/team"` in `dist/index.html`
- FOUND: `href="/en/team"` in `dist/en/index.html`
