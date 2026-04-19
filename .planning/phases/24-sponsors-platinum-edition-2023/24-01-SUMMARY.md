---
phase: 24-sponsors-platinum-edition-2023
plan: 01
subsystem: ui
tags: [astro, typescript, i18n, security, url-allowlist, sponsors]

# Dependency graph
requires:
  - phase: 23-edition-2026-combined-section
    provides: Pattern B arrow-glyph convention (decorative span in template, not in i18n value) — reused for new sponsors.homepage.cta key
provides:
  - src/lib/sponsor-utils.ts module exporting safeUrl() + safeLogoPath() — single canonical source for Platinum strip + SponsorCard
  - sponsors.homepage.heading + sponsors.homepage.cta i18n keys in both fr and en locales (Pattern B arrow-free)
  - Behaviour-neutral refactor of SponsorCard.astro to import from @/lib/sponsor-utils
affects:
  - 24-02 (SponsorsPlatinumStrip.astro — will import safeUrl/safeLogoPath from this module)
  - 24-03 (Edition2023Link.astro — will consume neither module but unblocks 24-02)
  - 26 (homepage swap — will mount components that consume these keys + helpers)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "URL/path allowlist helpers live under src/lib/<domain>-utils.ts (shared across multiple component consumers)"
    - "i18n keys follow Pattern B: arrow glyphs rendered as decorative <span aria-hidden=\"true\">→</span> in templates, never carried in the translation value"

key-files:
  created:
    - src/lib/sponsor-utils.ts (51 lines — 2 named exports + audit-trail JSDoc)
  modified:
    - src/components/sponsors/SponsorCard.astro (+1/-40 — import swap for inline helpers)
    - src/i18n/ui.ts (+4 — 2 keys × 2 locales)

key-decisions:
  - "Extraction was planner-mandated (UI-SPEC §Design System → Reused utilities + §Data Module & Asset Changes → src/lib/sponsor-utils.ts NEW). Function bodies copied byte-identical to preserve T-05-02 + T-05-03 security-audit trail."
  - "Pattern B for sponsors.homepage.cta: arrow rendered template-side as <span aria-hidden=\"true\">→</span>, NOT baked into the translation value. Keeps the glyph accessibility-correct (aria-hidden) and locale-agnostic."
  - "SocialLinks.astro (src/components/speakers/) retains its own inline safeUrl copy by planner design (cross-boundary extraction deferred to a future v1.3 housekeeping pass per Pitfall #12 spirit)."

patterns-established:
  - "Shared security-helper extraction: when ≥2 consumers need the same allowlist, promote the helper into src/lib/<domain>-utils.ts rather than duplicating; the consumer closest to the inline original imports first (SponsorCard) to validate behaviour parity, then future consumers (SponsorsPlatinumStrip 24-02) import from the same module."
  - "i18n atomic parity: whenever a new key is introduced, the fr AND en blocks are both updated in the same commit (PITFALLS #2). A dynamic bun -e parity check + a grep-based parity fallback are both documented in the plan's verify task."

requirements-completed: [SPON-01]

# Metrics
duration: ~8min
completed: 2026-04-18
---

# Phase 24 Plan 01: Foundation Summary

**Extracted safeUrl + safeLogoPath into src/lib/sponsor-utils.ts (SponsorCard now imports the shared helpers), and seeded the 2 new sponsors.homepage.{heading,cta} i18n keys in both fr and en with Pattern B arrow-free copy — the Phase 24 component layer is now unblocked.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-18T17:05:XXZ
- **Completed:** 2026-04-18T17:13:28Z
- **Tasks:** 3 (Task 3 is verification-only)
- **Files modified:** 3 (1 created, 2 edited)

## Accomplishments

- **New shared module `src/lib/sponsor-utils.ts`** (51 lines): exports `safeUrl(raw)` and `safeLogoPath(raw)` — the same URL/path allowlist helpers that gate sponsor rendering. JSDoc blocks preserve the literal "T-05-02" and "T-05-03" threat-ID references (audit trail follows the function).
- **Refactored `src/components/sponsors/SponsorCard.astro`** to a single named import (`import { safeUrl, safeLogoPath } from "@/lib/sponsor-utils"`); inline definitions deleted. Template body, tier maps, prop interface, and every call site unchanged — pure refactor, zero behaviour change.
- **Added 2 i18n keys to both locale blocks** of `src/i18n/ui.ts`:
  - FR: `"sponsors.homepage.heading": "Nos partenaires Platinum"` + `"sponsors.homepage.cta": "Voir tous les sponsors"`
  - EN: `"sponsors.homepage.heading": "Our Platinum sponsors"` + `"sponsors.homepage.cta": "View all sponsors"`
- **fr/en parity preserved**: 250 keys in each locale, zero drift (PITFALLS #2 invariant holds).

## Task Commits

Each task was committed atomically:

1. **Task 1a: Create src/lib/sponsor-utils.ts** — `5c04786` (refactor)
2. **Task 1b: SponsorCard imports shared helpers** — `bc6b4a0` (refactor)
3. **Task 2: Add sponsors.homepage.{heading,cta} keys in fr + en** — `c914433` (feat)
4. **Task 3: Verification-only** — no commit (astro check + build + parity check, all green)

## Files Created/Modified

### Created

- `src/lib/sponsor-utils.ts` (51 lines) — exports `safeUrl` + `safeLogoPath`, both with verbatim bodies extracted from `SponsorCard.astro` lines 20-31 and 39-53 (only `export` keyword added). JSDoc header references both T-05-02 + T-05-03 mitigations. No default export (matches `editions-data.ts` / `utils.ts` module convention).

  **First 5 lines:**
  ```ts
  /**
   * Sponsor URL & logo-path allowlist helpers.
   *
   * Extracted from src/components/sponsors/SponsorCard.astro (Phase 24-01) so
   * that the Phase 24 SponsorsPlatinumStrip.astro can import the same gates
  ```

  **Last 5 lines:**
  ```ts
    } catch {
      /* fallthrough */
    }
    return null;
  }
  ```

  **Named exports:** `safeUrl`, `safeLogoPath` (no default export).

### Modified

- `src/components/sponsors/SponsorCard.astro` — diff stat `+1/-40` (1 insertion = single combined import line; 40 deletions = inline `safeUrl` JSDoc + body + `safeLogoPath` JSDoc + body + blank lines). Template body (lines after the closing `---` fence) entirely unchanged — still `{safeHref ? <a> : <div>}` branch with the same `<img>` ladder and `<span>` fallback.
- `src/i18n/ui.ts` — `+4/-0` (2 keys inserted into the FR block immediately after `sponsors.card.aria`, 2 matching keys inserted into the EN block at the equivalent position). No existing keys touched.

## i18n Edits Applied

| Key | Locale | Value | Arrow? |
|-----|--------|-------|--------|
| `sponsors.homepage.heading` | fr | "Nos partenaires Platinum" | n/a |
| `sponsors.homepage.heading` | en | "Our Platinum sponsors" | n/a |
| `sponsors.homepage.cta` | fr | "Voir tous les sponsors" | **no** (Pattern B) |
| `sponsors.homepage.cta` | en | "View all sponsors" | **no** (Pattern B) |

Verified via: `grep -cE '"sponsors\.homepage\.cta":\s*"[^"]*→' src/i18n/ui.ts` → `0` (no locale carries the glyph in the value).

## Verification Results

| Check | Result |
|-------|--------|
| `bun run astro check` | Exit 1 — **unchanged from pre-existing baseline** (11 errors in `content.config.ts` / `Edition2023PhotoGrid.astro` / `TestimonialsStrip.astro` / homepage `editions.2026.gallery_cta` orphan references, per STATE.md "Deferred Issues"). Filtered for `sponsor-utils\|SponsorCard\|ui\.ts`: **0 matches** — my modified files introduce zero new type errors. |
| `bun run build` | Exit 0 — 156 pages built in 6.34s, no warnings about orphan references to `safeUrl`/`safeLogoPath`, no "unused import" warnings for the new SponsorCard import. |
| fr/en dynamic parity (`bun -e` import check) | `fr count: 250`, `en count: 250`, `only in fr: []`, `only in en: []` — PITFALLS #2 invariant holds. |
| Grep parity fallback (`grep -cE '^\s{4}"sponsors\.homepage\.(heading\|cta)"' src/i18n/ui.ts`) | `4` (2 keys × 2 locales) ✓ |
| `git status --porcelain src/pages/` | empty — no homepage file modified (Phase 26's domain) ✓ |
| `git status --porcelain src/components/past-editions/` | empty — `PastEditionMinimal.astro` untouched (orphan-by-design until Phase 26) ✓ |
| `git status --porcelain src/components/sponsors/SponsorTierSection.astro` | empty — unrelated sibling not modified ✓ |

### Astro-check pre-existing baseline

For traceability, the 11 errors surfaced by `bun run astro check` are ALL pre-existing (documented in STATE.md under "Pending Todos / Pre-existing `astro check` baseline carries 11 type errors"):

- `src/content.config.ts` (3×) — Zod 13 `LoaderConstraint` regression
- `src/components/past-editions/Edition2023PhotoGrid.astro` (2×) — implicit-any on `.map((p, i) => …)`
- `src/components/testimonials/TestimonialsStrip.astro` (4×) — template-literal keys not narrowable to the `ui` union
- `src/pages/index.astro` (1×) — orphan `editions.2026.gallery_cta` reference
- `src/pages/en/index.astro` (1×) — same

None originate from `src/lib/sponsor-utils.ts`, `src/components/sponsors/SponsorCard.astro`, or the `sponsors.*` block of `src/i18n/ui.ts`. Same 11-error count before and after this plan → no regression.

## Decisions Made

- **Kept `SocialLinks.astro` untouched** — per the plan's action block ("do NOT touch `src/components/speakers/SocialLinks.astro` — it has its own copy of the same `safeUrl` pattern by design; extraction across that boundary is a separate v1.3 housekeeping task per Pitfall #12 spirit").
- **Split Task 1 into 2 atomic commits** (one for the new module, one for the SponsorCard refactor) to make each commit independently revertable. This matches the commit_pattern provided by the orchestrator (`refactor(24-01): extract ...` + `refactor(24-01): SponsorCard imports ...`).
- **Named exports only** in `sponsor-utils.ts` (no `export default`) — mirrors sibling module conventions (`utils.ts`, `editions-data.ts`) and matches the acceptance criterion `grep -n 'export default' src/lib/sponsor-utils.ts` returns 0.

## Deviations from Plan

None — plan executed exactly as written. Every acceptance criterion in all three tasks passed on the first attempt. No auto-fix rules (Rule 1/2/3) triggered. No architectural decisions (Rule 4) needed.

## Issues Encountered

- **`bun run --bun -e <script>` arg shape** — `bun run` with `-e` flag printed the help screen instead of executing the inline script. Switched to the plain `bun -e '<script>'` form, which executed cleanly and produced the expected `fr count: 250 / en count: 250 / only in fr: [] / only in en: []` parity output. This is a tool-usage quirk, not a plan issue.
- **Pre-commit hook created an upstream commit (`77d4125 docs(state): record phase 24 planned`)** — observed during `git log` after Task 1a. This commit was made by a hook on a concurrent state edit; the working tree still shows `.planning/config.json` and `src/assets/photos/ambiance/ambiance-00.jpg` as pre-existing deltas (listed in the initial gitStatus). No action needed — the foundation commits for 24-01 stacked cleanly on top.

## Self-Check

- `src/lib/sponsor-utils.ts` exists: FOUND
- `src/components/sponsors/SponsorCard.astro` imports from `@/lib/sponsor-utils`: FOUND (line 5)
- 4 new i18n key insertions: FOUND (lines 94-95 fr, 390-391 en)
- Commit `5c04786` (sponsor-utils.ts create): FOUND in `git log --oneline`
- Commit `bc6b4a0` (SponsorCard refactor): FOUND in `git log --oneline`
- Commit `c914433` (i18n keys): FOUND in `git log --oneline`

**## Self-Check: PASSED**

## User Setup Required

None — no external service, no env var, no secret. This is a pure-refactor + i18n-key-add plan.

## Next Phase Readiness

- **24-02 (SponsorsPlatinumStrip.astro)** is unblocked: it can `import { safeUrl, safeLogoPath } from "@/lib/sponsor-utils"` and `t("sponsors.homepage.heading")` / `t("sponsors.homepage.cta")` without any further ground-laying.
- **24-03 (Edition2023Link.astro)** is unblocked: it doesn't consume `sponsor-utils.ts` but it depends on the foundation being green before wave 2 starts.
- **No homepage file (`src/pages/index.astro`, `src/pages/en/index.astro`) modified** — Phase 26 owns the mounting + section reorder + orphan-import cleanup.
- **No `PastEditionMinimal.astro` change** — it remains in use by both homepage files until Phase 26 swaps in `Edition2023Link`, then deletes the orphan.
- **No CSV / Zod / Sheet migration** — Phase 24 reads the existing `tier`, `name`, `url`, `logo`, `description_fr/en` columns per CLAUDE.md ("CSVs are the single source of truth"); no data-layer change.

---
*Phase: 24-sponsors-platinum-edition-2023*
*Completed: 2026-04-18*
