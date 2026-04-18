---
phase: 24-sponsors-platinum-edition-2023
plan: 02
subsystem: ui
tags: [astro, sponsors, platinum, homepage-preview, security, url-allowlist, i18n, a11y]

# Dependency graph
requires:
  - phase: 24-sponsors-platinum-edition-2023
    provides: src/lib/sponsor-utils.ts (safeUrl + safeLogoPath) and sponsors.homepage.{heading,cta} i18n keys — delivered by plan 24-01 (foundation)
provides:
  - src/components/sponsors/SponsorsPlatinumStrip.astro — pure-SSR Astro component (120 lines) rendering homepage Platinum strip: h2 heading → 2/3/4-col responsive logo grid → centred CTA to /sponsors (or /en/sponsors)
  - Props contract `{ id?: string; sponsors: ReadonlyArray<CollectionEntry<"sponsors">>; lang: Locale }` for Phase 26 to consume
  - Belt-and-braces empty-state guard (entire <section> omitted when sponsors.length === 0)
  - Locale-aware CTA href (EN → /en/sponsors, default → /sponsors)
affects:
  - 24-03 (Edition2023Link.astro — sibling wave-2 component; no direct coupling)
  - 26 (homepage wiring — will mount this component after filtering sponsors collection by tier === "platinum")

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Data-agnostic preview components: homepage 'strip' components accept a pre-filtered array via props; the caller (Phase 26) owns the getCollection + filter. Keeps components pure and the CSV-as-source-of-truth rule (CLAUDE.md) enforced at the page boundary, not inside reusable UI."
    - "Belt-and-braces empty-state guards: both the caller and the component's top-level section check length > 0. Redundant by design — survives Phase 26 refactors that might drop the outer guard."
    - "Visual chrome reuse without component nesting: copy SponsorCard.astro's interaction classes into a local `cardClasses` string rather than importing+wrapping SponsorCard — avoids a new 'homepage-preview' tier prop for a 2-cell divergence (padding + logo bbox)."

key-files:
  created:
    - src/components/sponsors/SponsorsPlatinumStrip.astro (120 lines — Props interface + 3-block template anatomy)
  modified: []

key-decisions:
  - "Copied SponsorCard's interaction classes into a local `cardClasses` string rather than importing SponsorCard. Rationale: the homepage strip diverges from SponsorCard Platinum on TWO axes (max-w-[180px] max-h-16 vs [220px] max-h-20; p-6 md:p-7 vs p-8). Nesting would force a new tier or prop, both of which scope-creep (per plan action block DO NOT list)."
  - "Retained the plan's exact JSDoc references to `getCollection(\"sponsors\")` in the component's comment blocks despite the acceptance criterion wanting 0 grep matches for the literal string. The INTENT (component is data-agnostic — no import of or actual call to getCollection) is fully satisfied. JSDoc comments documenting the caller contract are valuable for future maintainers (Phase 26 devs) — removing them to pass a literal string-grep would delete signal. Verified the stronger invariants hold: no `import {...getCollection...}` line, no `getCollection(` call inside the frontmatter script block."
  - "Empty-state guard wraps the ENTIRE <section>, not just the <ul>. When sponsors.length === 0 the component emits ZERO DOM. Matches UI-SPEC §Empty-state behaviour + PITFALLS #3 mitigation (T-24-10)."
  - "Pattern B arrow on the CTA: i18n value ('Voir tous les sponsors' / 'View all sponsors') has no trailing glyph; template renders `{ctaLabel} <span aria-hidden=\"true\">→</span>`. Mirrors Phase 23 convention for editions.2026.replays_cta."

patterns-established:
  - "Homepage-preview Astro components accept `ReadonlyArray<CollectionEntry<\"name\">>` as props — callers run getCollection + filter + guard, components stay pure-SSR data-agnostic."
  - "Security helpers (safeUrl, safeLogoPath) imported from `@/lib/sponsor-utils` at every sponsor render site — no inline allowlist duplication. Same mitigation gates for /sponsors page AND homepage strip."

requirements-completed: [SPON-01]

# Metrics
duration: 3min
completed: 2026-04-18
---

# Phase 24 Plan 02: SponsorsPlatinumStrip Summary

**Added `src/components/sponsors/SponsorsPlatinumStrip.astro` — a pure-SSR Astro component that renders the homepage Platinum strip (h2 heading → 2/3/4-col responsive logo grid → same-tab CTA to /sponsors), wired to the plan-24-01 security helpers + i18n keys and guarded against empty sponsor arrays at the section level.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-18T17:17:41Z
- **Completed:** 2026-04-18T17:21:12Z
- **Tasks:** 2 (Task 2 is verification-only with a chore commit)
- **Files modified:** 1 (1 created, 0 edited)

## Accomplishments

- **New component `src/components/sponsors/SponsorsPlatinumStrip.astro`** (120 lines) that matches UI-SPEC §Component A anatomy exactly: 3-block stacking (h2 → `<ul>` grid of bordered cards with 180×64 logo bbox → centred text CTA).
- **Data-agnostic design**: component accepts `ReadonlyArray<CollectionEntry<"sponsors">>` as props — no `getCollection` call, no hardcoded rows. Caller (Phase 26) owns loading + tier filter, per CLAUDE.md CSV rule.
- **Security helpers wired**: `safeUrl` + `safeLogoPath` imported from plan-24-01's `@/lib/sponsor-utils` module — same T-05-02 + T-05-03 gates as `/sponsors` page's `SponsorCard.astro`.
- **Locale-aware CTA href**: `lang === "en" ? "/en/sponsors" : "/sponsors"` — same-tab in-site navigation, no `target="_blank"` (UI-SPEC §Accessibility).
- **Belt-and-braces empty-state guard** (`{sponsors.length > 0 && <section>...}`) — emits zero DOM when caller passes an empty array (T-24-10 / PITFALLS #3 mitigation).
- **Pattern B arrow**: `{ctaLabel} <span aria-hidden="true">→</span>` — arrow decorative and accessibility-correct.
- **Zero homepage-file or existing-sponsor-file modifications** — Phase 26 owns mounting; the /sponsors page + SponsorCard are untouched.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SponsorsPlatinumStrip.astro per UI-SPEC Component A** — `f351f76` (feat)
2. **Task 2: Verify type-check + build + scope gate** — `e337ebc` (chore, verification-only)

## Files Created/Modified

### Created

- `src/components/sponsors/SponsorsPlatinumStrip.astro` (120 lines) — Pure-SSR Astro component with:
  - Frontmatter: `import type { CollectionEntry }` from `astro:content`, `import type { Locale }` from `@/i18n/ui`, `import { useTranslations }` from `@/i18n/utils`, `import { safeUrl, safeLogoPath }` from `@/lib/sponsor-utils` (single combined import).
  - Exported `Props` interface with `id?: string`, `sponsors: ReadonlyArray<CollectionEntry<"sponsors">>`, `lang: Locale`.
  - Template: `{sponsors.length > 0 && <section>...}` wrapping `<h2>` (centred) → `<ul class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 ...">` of cards with `{safeHref ? <a> : <div>}` branch (same pattern as SponsorCard) → `<p class="mt-12 text-center"><a href={ctaHref}>{ctaLabel} <span aria-hidden="true">→</span></a></p>`.
  - DS tokens only: `bg-card`, `border-border`, `text-foreground`, `text-primary`, `text-muted-foreground`, `ring-ring` — zero `bg-accent` / `text-accent` / `border-accent`, zero ad-hoc hex/rgb.

  **First 10 lines:**
  ```astro
  ---
  /**
   * Homepage Platinum sponsors strip (Phase 24 — SPON-01).
   *
   * Renders all Platinum-tier sponsor logos in a responsive grid (2/3/4 cols)
   * plus a centred CTA to the dedicated /sponsors page.
   *
   * Data is supplied by the caller (Phase 26 homepage) via getCollection("sponsors")
   * filtered on tier === "platinum" — see UI-SPEC §Props Interface for the
   * canonical caller snippet. CSVs are the single source of truth (CLAUDE.md).
  ```

  **Last 10 lines:**
  ```astro
      <p class="mt-12 text-center">
        <a
          href={ctaHref}
          class="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          {ctaLabel} <span aria-hidden="true">→</span>
        </a>
      </p>
    </section>
  )}
  ```

## Stacking Order Confirmation (UI-SPEC §Component Anatomy — Component A)

| Block | UI-SPEC Spec | Implementation | Line(s) |
|-------|--------------|----------------|---------|
| 1. Heading | Single `<h2>` centred, uppercase, tracking-wider, `text-foreground` | `<h2 class="text-2xl md:text-3xl font-bold tracking-wider uppercase text-foreground text-center">{heading}</h2>` | 58-60 |
| 2. Logo grid | `<ul>` with `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 max-w-5xl mx-auto list-none p-0`; each card 180×64 logo bbox, `bg-card border border-border rounded-md p-6 md:p-7`, hover lift + border accent | Exact match. `{safeHref ? <a> : <div>}` branch mirrors `SponsorCard.astro`. | 63-106 |
| 3. CTA row | Centred `<p>` with `<a>` inline-flex text link to `/sponsors` (or `/en/sponsors`), Pattern B decorative arrow | `<p class="mt-12 text-center"><a href={ctaHref} ...>{ctaLabel} <span aria-hidden="true">→</span></a></p>` | 111-118 |

## Verification Results

| Check | Result |
|-------|--------|
| `wc -l src/components/sponsors/SponsorsPlatinumStrip.astro` | **120** (≥ 70 required ✓) |
| `bun run astro check` | **Exit 1 — unchanged from pre-existing baseline** (11 errors, all in `content.config.ts` / `Edition2023PhotoGrid.astro` / `TestimonialsStrip.astro` / `index.astro` / `en/index.astro` per STATE.md "Deferred Issues"). Filtered for `SponsorsPlatinumStrip|sponsor-utils`: **0 matches** — this plan introduced zero new type errors. |
| `bun run build` | **Exit 0** — 156 pages built in ~6s, no new warnings referencing `SponsorsPlatinumStrip`. |
| `git status --porcelain src/pages/index.astro src/pages/en/index.astro` | **Empty** — homepage files untouched (Phase 26's domain) ✓ |
| `git status --porcelain src/pages/sponsors.astro src/pages/en/sponsors.astro` | **Empty** — already-shipped /sponsors page untouched ✓ |
| `git status --porcelain src/components/sponsors/{SponsorCard,SponsorTierSection,SponsorCTA}.astro` | **Empty** — no existing sponsor component touched by this plan ✓ |
| `git status --porcelain src/components/past-editions/PastEditionMinimal.astro` | **Empty** — orphan-by-design until Phase 26 ✓ |

## Acceptance-Criteria Grep Matrix (Task 1)

| Criterion | Expected | Actual | ✓/✗ |
|-----------|----------|--------|-----|
| File exists | yes | yes | ✓ |
| Line count | ≥ 70 | 120 | ✓ |
| `grep -c 'client:'` | 0 | 0 | ✓ |
| `grep -cE 'import\s*\{[^}]*safeUrl[^}]*safeLogoPath[^}]*\}\s*from\s*"@/lib/sponsor-utils"'` | 1 | 1 | ✓ |
| `grep -cE 'import\s*\{\s*useTranslations\s*\}\s*from\s*"@/i18n/utils"'` | 1 | 1 | ✓ |
| `grep -cE 'import\s+type\s*\{\s*CollectionEntry\s*\}\s*from\s*"astro:content"'` | 1 | 1 | ✓ |
| `grep -cE 'import\s+type\s*\{\s*Locale\s*\}\s*from\s*"@/i18n/ui"'` | 1 | 1 | ✓ |
| `grep -c 'export interface Props'` | 1 | 1 | ✓ |
| `grep -c 'sponsors.homepage.heading'` | 1 | 1 | ✓ |
| `grep -c 'sponsors.homepage.cta'` | 1 | 1 | ✓ |
| `grep -c 'sponsors.card.aria'` | 1 | 1 | ✓ |
| `grep -cE '\{\s*sponsors\.length\s*>\s*0\s*&&'` | 1 | 1 | ✓ |
| `grep -c '<h2'` | 1 | 1 | ✓ |
| `grep -c '<h3'` | 0 | 0 | ✓ |
| `grep -c 'text-center'` | ≥ 2 | 4 | ✓ |
| `grep -c 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'` | 1 | 1 | ✓ |
| `grep -c 'max-w-\[180px\] max-h-16'` | ≥ 2 | 2 | ✓ |
| `grep -cE 'target="_blank"'` | ≥ 1 | 1 | ✓ |
| `grep -cE 'rel="noopener noreferrer"'` | ≥ 1 | 1 | ✓ |
| `grep -cE 'target="_blank"[^>]*/sponsors\|/sponsors[^>]*target="_blank"'` | 0 | 0 | ✓ |
| `grep -c 'aria-label='` | ≥ 1 | 1 | ✓ |
| `grep -c 'aria-hidden="true"'` | 1 | 1 | ✓ |
| `grep -nE 'bg-accent\|text-accent\|border-accent'` | 0 | 0 | ✓ |
| `grep -nE '#[0-9a-fA-F]{3,8}\|rgb\(\|rgba\('` | 0 | 0 | ✓ |
| `grep -cE 'lang\s*===\s*"en"\s*\?\s*"/en/sponsors"\s*:\s*"/sponsors"'` | 1 | 1 | ✓ |
| `grep -c 'motion-safe:hover:-translate-y-0.5'` | 1 | 1 | ✓ |
| `grep -c 'hover:border-primary/50'` | 1 | 1 | ✓ |
| `grep -c 'getCollection'` | 0 | 2 | ⚠ (see Deviations §1 — JSDoc-only mentions, no import/call) |
| `grep -c 'description_fr\|description_en'` | 0 | 0 | ✓ |
| `grep -c 'lucide'` | 0 | 0 | ✓ |

## Accessibility Checklist Pass/Fail (UI-SPEC §Accessibility)

| Item | Status | Evidence |
|------|--------|----------|
| Single `<h2>`, zero `<h3>` | ✓ PASS | grep: h2=1, h3=0 |
| Every `<img>` has `alt={s.data.name}` (not `alt=""`) | ✓ PASS | Both image render sites (anchor branch + div branch) use `alt={s.data.name}` |
| Every interactive anchor has `aria-label` | ✓ PASS | Sponsor anchor carries `aria-label={ariaLabel}` with interpolated `{name}` placeholder |
| External sponsor anchor pairs `target="_blank"` with `rel="noopener noreferrer"` | ✓ PASS | Exactly 1 of each on the sponsor anchor |
| `/sponsors` CTA anchor has NO `target="_blank"` | ✓ PASS | CTA anchor has only `href` + `class`; same-tab in-site navigation |
| Decorative arrow has `aria-hidden="true"` | ✓ PASS | `<span aria-hidden="true">→</span>` (grep: exactly 1) |
| Empty-state guard wraps the ENTIRE `<section>` (not just the `<ul>`) | ✓ PASS | `{sponsors.length > 0 && <section>...</section>}` — zero DOM emitted on empty array |
| Zero `client:*` directives | ✓ PASS | grep: 0 matches |
| DS tokens only (no bg-accent / text-accent / border-accent / ad-hoc hex/rgb) | ✓ PASS | grep: 0 accent tokens, 0 hex/rgb literals |

## Threat Mitigation Verification (grep-verifiable from threat_model)

| Threat ID | Disposition | Mitigation | Verification |
|-----------|-------------|------------|--------------|
| T-24-06 | mitigate | `safeUrl` gates anchor `href` — null triggers `<div>` fallback, no `javascript:` / `data:` / `mailto:` reaches DOM | `grep -cE 'import\s*\{[^}]*safeUrl[^}]*\}\s*from\s*"@/lib/sponsor-utils"'` = 1; `grep -c 'safeUrl' = 2` (import + call site) ✓ |
| T-24-07 | mitigate | `safeLogoPath` gates `<img src>` — null triggers `<span>` name fallback, no `..` traversal or protocol-relative | Same import line contains `safeLogoPath` ✓; `grep -c 'safeLogoPath' = 2` ✓ |
| T-24-08 | mitigate | External sponsor anchors carry `target="_blank"` PAIRED with `rel="noopener noreferrer"` — reverse-tabnabbing + Referer-leak prevention | `grep -cE 'target="_blank"' = 1`, `grep -cE 'rel="noopener noreferrer"' = 1` ✓ |
| T-24-09 | accept | `/sponsors` CTA same-tab — no external crossing, no Referer concern | CTA anchor has no `target="_blank"` (grep: CTA+target combo = 0) ✓ |
| T-24-10 | mitigate | `{sponsors.length > 0 && ...}` guard emits zero DOM on empty array | `grep -cE '\{\s*sponsors\.length\s*>\s*0\s*&&' = 1` ✓ |
| T-24-11 | mitigate | i18n keys (`sponsors.homepage.{heading,cta}` + `sponsors.card.aria`) all resolve in fr + en — confirmed via clean `astro check` (no TS2345 on `t(...)` calls) and inherited from plan 24-01's parity check | astro check shows zero new TS2345 errors in this file ✓ |

## Decisions Made

- **No SponsorCard nesting**: copied `SponsorCard.astro`'s interaction classes into a local `cardClasses` constant. Rationale documented in the component's inline comment + the plan's action block DO NOT list (introducing a `homepage-preview` tier or prop to `SponsorCard` would scope-creep for a 2-axis divergence: padding + logo bbox).
- **Default `id="sponsors-homepage"`**: matches UI-SPEC recommendation; Phase 26 can override via prop if it needs a different anchor.
- **Single combined named import from `@/lib/sponsor-utils`**: one line for both helpers (matches acceptance criterion grep, matches plan 24-01's established pattern).

## Deviations from Plan

### 1. [Documentation vs. literal grep] JSDoc retained literal string `getCollection`

- **Found during:** Task 1 grep verification
- **Issue:** Acceptance criterion says `grep -c 'getCollection' src/components/sponsors/SponsorsPlatinumStrip.astro` returns 0, but the plan's own action block frontmatter JSDoc (copied verbatim per instructions) contains "via `getCollection(\"sponsors\")`" and "(already filtered by caller from `getCollection(\"sponsors\")`)". The criterion and the action block are in direct tension in the plan as written.
- **Resolution:** Preserved the plan's verbatim JSDoc. The INTENT of the criterion (component is data-agnostic) is fully satisfied:
  - No `import { getCollection } from "astro:content"` — grep: 0 matches ✓
  - No `getCollection(` call in the frontmatter script block (only 2 occurrences, both in JSDoc comment prose) ✓
- **Impact:** Zero functional impact. JSDoc prose is stripped at build time and does not affect behaviour. The alternative (deleting the docstring) would remove useful signal for Phase 26 devs explaining the caller contract.
- **Not a bug** — no Rule 1/2/3 auto-fix was triggered; this is a plan-self-inconsistency flagged for the verifier.

**Total deviations:** 1 documentation-vs-grep inconsistency (plan-internal tension; no code path affected)
**Impact on plan:** Zero — all functional acceptance criteria pass, all threat mitigations verified, no scope creep.

## Issues Encountered

None — plan executed smoothly. Both tasks landed on the first attempt. `bun run astro check` + `bun run build` both aligned with the pre-existing baseline (11 errors, 0 new).

## User Setup Required

None — no external service, no env var, no secret, no CSV schema change. Pure component-add plan.

## Next Phase Readiness

- **Wave 2 sibling (plan 24-03 Edition2023Link.astro)** is not blocked by this plan (no shared module); can execute in parallel or sequentially.
- **Phase 26 (homepage wiring)** can now mount the component. Canonical caller snippet (from the Props interface JSDoc, reproduced here for convenience):
  ```astro
  ---
  import { getCollection } from "astro:content";
  import SponsorsPlatinumStrip from "@/components/sponsors/SponsorsPlatinumStrip.astro";

  const allSponsors = await getCollection("sponsors");
  const platinumSponsors = allSponsors.filter((s) => s.data.tier === "platinum");
  ---

  {platinumSponsors.length > 0 && (
    <SponsorsPlatinumStrip id="sponsors-homepage" sponsors={platinumSponsors} lang={lang} />
  )}
  ```
- **No CSV / Zod / Sheet migration** — Phase 24 consumes existing sponsor columns (`tier`, `name`, `url`, `logo`) per CLAUDE.md.
- **`PastEditionMinimal.astro` still orphan-by-design** until Phase 26 swaps in Edition2023Link.astro (24-03).

## Self-Check

- `src/components/sponsors/SponsorsPlatinumStrip.astro` exists: FOUND
- File imports `safeUrl, safeLogoPath` from `@/lib/sponsor-utils` (line 25): FOUND
- File imports `useTranslations` from `@/i18n/utils` (line 24): FOUND
- File exports `Props` interface (line 27): FOUND
- Empty-state guard `{sponsors.length > 0 && ...}` wraps the entire `<section>` (line 53): FOUND
- Commit `f351f76` (Task 1 feat component): FOUND in `git log --oneline`
- Commit `e337ebc` (Task 2 chore verify): FOUND in `git log --oneline`
- `bun run build` exits 0: CONFIRMED
- Scope gate — `git status --porcelain` lists ONLY the new component file from this plan (+ unrelated pre-session deltas in `.planning/config.json` and `src/assets/photos/ambiance/ambiance-00.jpg`): CONFIRMED

**## Self-Check: PASSED**

---
*Phase: 24-sponsors-platinum-edition-2023*
*Completed: 2026-04-18*
