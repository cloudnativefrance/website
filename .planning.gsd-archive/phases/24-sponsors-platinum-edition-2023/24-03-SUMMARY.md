---
phase: 24-sponsors-platinum-edition-2023
plan: 03
subsystem: ui
tags: [astro, past-editions, edition-2023, homepage-preview, i18n, a11y]

# Dependency graph
requires:
  - phase: 24-sponsors-platinum-edition-2023
    provides: None — consumes only EXISTING i18n keys (editions.2023.compact_title + editions.2023.view_page_cta) and EXISTING EDITION_2023.brandLogo (via caller-supplied prop)
provides:
  - src/components/past-editions/Edition2023Link.astro — pure-SSR Astro component (60 lines) rendering minimal homepage 2023 bloc: KCD logo + h2 + single text link to /2023
  - Props contract `{ id?: string; heading: string; logo: ImageMetadata; logoAlt: string; viewPageLabel: string; viewPageHref: string }` for Phase 26 to consume
  - Pattern A arrow convention (glyph already in viewPageLabel, template does NOT add a second <span>)
affects:
  - 26 (homepage wiring — will mount this component with `heading={t("editions.2023.compact_title")}, logo={EDITION_2023.brandLogo}, viewPageLabel={t("editions.2023.view_page_cta")}, viewPageHref={lang === "en" ? "/en/2023" : "/2023"}` and remove the PastEditionMinimal import)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Prop-driven minimal-bloc components: homepage pointer components accept fully-resolved i18n strings + locale-aware href from the caller. No `useTranslations` or `@/lib/editions-data` import inside the component — keeps the Stitch mockup → code mapping 1:1 with zero flag-driven branches."
    - "Pattern A arrow-glyph convention: when the i18n value already ends with ' →' the template renders `{label}` alone and MUST NOT add a decorative `<span aria-hidden=\"true\">→</span>`. Coexists with Pattern B (Phase 23 / plan 24-01/24-02) — rule is 'do not duplicate; match the pattern the i18n value already uses'."

key-files:
  created:
    - src/components/past-editions/Edition2023Link.astro (60 lines — Props interface + 2-block template anatomy)
  modified: []

key-decisions:
  - "Fully prop-driven component — zero imports from `@/lib/editions-data`, `@/i18n/utils`, or `@/i18n/ui`. Caller (Phase 26) resolves i18n and the locale-aware href before passing props. Rationale: UI-SPEC §\"Decision: NEW component or modify PastEditionMinimal?\" → keeps the Stitch mockup → code mapping 1:1 with no flag-driven branches; lets Phase 26 delete `PastEditionMinimal.astro` cleanly as an orphan."
  - "Pattern A arrow on the /2023 CTA (the trailing ' →' is IN the i18n value editions.2023.view_page_cta = 'Voir l'édition 2023 →' / 'View the 2023 edition →'), so the template renders `{viewPageLabel}` alone — NO `<span aria-hidden=\"true\">→</span>`. This is the OPPOSITE of plan 24-02 (SponsorsPlatinumStrip) which uses Pattern B. Both coexist; the rule is 'do not duplicate — match the pattern the i18n value already uses'."
  - "h2 uses `font-semibold` + `tracking-tight` (NOT `font-bold` + `uppercase` + `tracking-wider` — that's the Sponsors strip h2). One notch lighter per UI-SPEC §Typography — the 2023 bloc is a pointer, not a showcase."
  - "Logo sits on bare background — zero `bg-card` plate. UI-SPEC §Discretion Resolutions: 'the KCD logo PNG already has its own coloured backdrop; a `bg-card` plate would compete visually.'"
  - "Default `id=\"edition-2023\"` preserved from the current PastEditionMinimal mount site in `index.astro`, so existing deep links `/#edition-2023` still resolve via `:target { scroll-margin-top: 5rem; }` in `global.css`."
  - "NOT mounted on any page in Phase 24 — Phase 26 owns the homepage swap + the PastEditionMinimal import/file removal (same CONTEXT D-01 discipline as Phase 23)."

patterns-established:
  - "Prop-driven minimal-bloc pattern: caller resolves i18n + locale, component stays pure-SSR + data-agnostic. Reused by Edition2023Link + future minimal 2022/2021 blocs if added."
  - "Pattern A / Pattern B coexistence: the codebase now formally carries both arrow-glyph conventions documented side-by-side (plan 24-02 = B, plan 24-03 = A). The rule for future components is to MATCH the pattern the consumed i18n value already uses, never duplicate."

requirements-completed: [ED23-01]

# Metrics
duration: ~3min
completed: 2026-04-18
---

# Phase 24 Plan 03: Edition2023Link Summary

**Added `src/components/past-editions/Edition2023Link.astro` — a pure-SSR Astro component (60 lines) that renders the homepage minimal 2023 bloc (KCD logo + h2 + single text link to /2023), fully prop-driven (no `@/lib/editions-data` or `@/i18n/utils` imports), using Pattern A arrow (trailing glyph lives in the i18n value, template does NOT duplicate it). PastEditionMinimal.astro untouched (orphan-by-design until Phase 26); homepage files untouched (Phase 26's domain).**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-18T17:26:33Z
- **Completed:** 2026-04-18T17:30:XXZ
- **Tasks:** 2 (Task 2 is verification-only)
- **Files modified:** 1 (1 created, 0 edited)

## Accomplishments

- **New component `src/components/past-editions/Edition2023Link.astro`** (60 lines) matching UI-SPEC §Component B anatomy exactly: 2-block stacking (header row with KCD logo + h2 → CTA row with single text link to /2023).
- **Fully prop-driven**: component imports only `Image` from `astro:assets` and `ImageMetadata` type from `astro` — zero imports of `@/lib/editions-data`, `@/i18n/utils`, or `@/i18n/ui`. The Phase 26 caller resolves i18n + locale-aware href.
- **Pattern A arrow compliance**: template renders `{viewPageLabel}` alone. Zero `<span aria-hidden="true">→</span>` — the arrow lives in the i18n value (`editions.2023.view_page_cta` = `"Voir l'édition 2023 →"` / `"View the 2023 edition →"`).
- **Same-tab in-site CTA**: `/2023` anchor has NO `target="_blank"` and NO `rel=` — in-site navigation per UI-SPEC §Accessibility.
- **DS tokens only**: `text-foreground`, `text-primary`, `ring-ring`, `bg-background` (implicit). Zero `bg-card` (UI-SPEC §Discretion Resolutions: logo sits on bare background), zero `bg-accent` / `text-accent` / `border-accent`, zero ad-hoc hex/rgb.
- **h2 typography one notch lighter** than the Sponsors strip: `font-semibold` + `tracking-tight` (NOT `font-bold` + `uppercase` + `tracking-wider`). Per UI-SPEC §Typography.
- **Default id="edition-2023"** preserved so existing deep links `/#edition-2023` continue to work via `:target { scroll-margin-top: 5rem; }` in `global.css`.
- **Zero DOM beyond ED23-01 spec**: no photo grid, no `<figure>`, no `<img>` (the single logo goes through Astro `<Image>`), no playlist link, no YouTube embed, no brand-history prose, no stats.
- **Zero `client:*` directives** — pure SSR.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Edition2023Link.astro per UI-SPEC Component B** — `c0e045f` (feat)
2. **Task 2: Verify type-check + build + scope gate** — `269bcd4` (chore, verification-only)

## Files Created/Modified

### Created

- `src/components/past-editions/Edition2023Link.astro` (60 lines) — Pure-SSR Astro component with:
  - Frontmatter: `import { Image } from "astro:assets"`, `import type { ImageMetadata } from "astro"`. No other imports.
  - Exported `Props` interface with `id?: string`, `heading: string`, `logo: ImageMetadata`, `logoAlt: string`, `viewPageLabel: string`, `viewPageHref: string`.
  - Template: single `<section id={id} class="relative max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-16 md:py-24">` wrapping two child blocks — header row (`<div class="flex flex-col sm:flex-row sm:items-center sm:gap-6 gap-4">` with a `w-20 md:w-24 shrink-0` logo container + `<h2 class="text-2xl md:text-3xl font-semibold text-foreground tracking-tight leading-tight">`) and CTA row (`<p class="mt-6">` with a single `<a href={viewPageHref}>` using inline-flex text-link classes).

  **First 10 lines:**
  ```astro
  ---
  /**
   * Homepage minimal 2023 bloc (Phase 24 — ED23-01).
   *
   * Renders ONLY the KCD 2023 brand logo + h2 title + single text link to /2023.
   * No photos, no playlist link, no brand-history prose — the dedicated /2023 page
   * is the canonical deep-dive destination (this component is a pointer to it).
   *
   * Replaces PastEditionMinimal.astro on the homepage starting in Phase 26.
   * Phase 24 only BUILDS this component; Phase 26 (Homepage Wiring) mounts it,
  ```

  **Last 10 lines:**
  ```astro
    {/* 2. CTA row — single text link to /2023. Arrow is ALREADY in viewPageLabel (Pattern A) — do NOT add a decorative <span>. */}
    <p class="mt-6">
      <a
        href={viewPageHref}
        class="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
      >
        {viewPageLabel}
      </a>
    </p>
  </section>
  ```

## Stacking Order Confirmation (UI-SPEC §Component Anatomy — Component B)

| Block | UI-SPEC Spec | Implementation | Line(s) |
|-------|--------------|----------------|---------|
| 1. Header row | KCD logo (`w-20 md:w-24 shrink-0`, `<Image src={logo} alt={logoAlt} />`) + h2 (`font-semibold` + `tracking-tight`, NOT `font-bold` + uppercase). Stacks on mobile (`flex-col`), flex-row from `sm:` upward (`sm:flex-row sm:items-center sm:gap-6 gap-4`). | `<div class="flex flex-col sm:flex-row sm:items-center sm:gap-6 gap-4">` wrapping logo div + `<h2 class="text-2xl md:text-3xl font-semibold text-foreground tracking-tight leading-tight">` | 43-50 |
| 2. CTA row | Single `<a>` inline-flex text link to `/2023` (or `/en/2023`). Pattern A arrow — glyph already in `viewPageLabel`; template renders `{viewPageLabel}` alone (no decorative span). `mt-6` above. Same-tab (no `target="_blank"`, no `rel=`). | `<p class="mt-6"><a href={viewPageHref} class="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">{viewPageLabel}</a></p>` | 52-59 |

## Verification Results

| Check | Result |
|-------|--------|
| `wc -l src/components/past-editions/Edition2023Link.astro` | **60** (≥ 40 required ✓) |
| `bun run astro check` | **Exit 1 — unchanged from pre-existing baseline** (11 errors, all in `content.config.ts` / `Edition2023PhotoGrid.astro` / `TestimonialsStrip.astro` / `index.astro` / `en/index.astro` per STATE.md "Pending Todos"). Filtered for `Edition2023Link`: **0 matches** — this plan introduced zero new type errors. |
| `bun run build` | **Exit 0** — 156 pages built in ~6.6s, no new warnings referencing `Edition2023Link`. |
| `git status --porcelain src/pages/index.astro src/pages/en/index.astro` | **Empty** — homepage files untouched (Phase 26's domain) ✓ |
| `git status --porcelain src/components/past-editions/PastEditionMinimal.astro` | **Empty** — orphan-by-design until Phase 26 deletes it ✓ |
| `git status --porcelain src/components/past-editions/PastEditionSection.astro` | **Empty** — not in 24-03's scope ✓ |
| `git status --porcelain src/lib/editions-data.ts` | **Empty** — data module untouched by this plan ✓ |
| `git status --porcelain src/i18n/ui.ts` | **Empty** — i18n untouched by this plan (reuses existing `editions.2023.compact_title` + `editions.2023.view_page_cta` keys) ✓ |
| `git status --porcelain` (overall) | Only pre-existing deltas (`.planning/config.json` + `ambiance-00.jpg`) + this plan's docs commit ✓ |

### Astro-check pre-existing baseline (unchanged from plan 24-02)

For traceability, the 11 errors surfaced by `bun run astro check` are ALL pre-existing:

- `src/content.config.ts` (3×) — Zod 13 `LoaderConstraint` regression
- `src/components/past-editions/Edition2023PhotoGrid.astro` (2×) — implicit-any on `.map((p, i) => …)`
- `src/components/testimonials/TestimonialsStrip.astro` (4×) — template-literal keys not narrowable to the `ui` union
- `src/pages/index.astro` (1×) — orphan `editions.2026.gallery_cta` reference
- `src/pages/en/index.astro` (1×) — same

None originate from `src/components/past-editions/Edition2023Link.astro`. Same 11-error count before and after this plan → no regression.

## Acceptance-Criteria Grep Matrix (Task 1)

| Criterion | Expected | Actual | ✓/✗ |
|-----------|----------|--------|-----|
| File exists | yes | yes | ✓ |
| Line count | ≥ 40 | 60 | ✓ |
| `grep -c 'client:'` | 0 | 0 | ✓ |
| `grep -cE 'import\s*\{\s*Image\s*\}\s*from\s*"astro:assets"'` | 1 | 1 | ✓ |
| `grep -cE 'import\s+type\s*\{\s*ImageMetadata\s*\}\s*from\s*"astro"'` | 1 | 1 | ✓ |
| `grep -c 'export interface Props'` | 1 | 1 | ✓ |
| `grep -cE '<Image\s'` | 1 | 1 | ✓ |
| `grep -c 'alt='` | ≥ 1 | 1 | ✓ |
| `grep -c '<h2'` | 1 | 1 | ✓ |
| `grep -c '<h3'` | 0 | 0 | ✓ |
| `grep -c 'font-semibold'` | ≥ 2 | 2 | ✓ |
| `grep -cE 'font-bold\|uppercase\|tracking-wider'` | 0 | 0 | ✓ |
| `grep -c 'tracking-tight'` | ≥ 1 | 1 | ✓ |
| `grep -c 'w-20 md:w-24'` | 1 | 1 | ✓ |
| `grep -c 'shrink-0'` | 1 | 1 | ✓ |
| `grep -cE '<a\b'` (adjusted — raw `<a ` fails due to newline after `<a`) | 1 | 1 | ✓ |
| `grep -c 'href='` | 1 | 1 | ✓ |
| `grep -cE 'target="_blank"'` | 0 | 0 | ✓ |
| `grep -cE '\brel='` | 0 | 0 | ✓ |
| `grep -cE 'aria-hidden="true"[^>]*>→'` | 0 | 0 | ✓ |
| `grep -cE '<span[^>]*>→</span>'` | 0 | 0 | ✓ |
| `grep -cE '<figure\b\|<img\b\|grid-cols-3\|grid-cols-6'` | 0 | 0 | ✓ |
| `grep -cE 'bg-accent\|text-accent\|border-accent'` | 0 | 0 | ✓ |
| `grep -cE 'bg-card'` | 0 | 0 | ✓ |
| `grep -cE '#[0-9a-fA-F]{3,8}\|rgb\(\|rgba\('` | 0 | 0 | ✓ |
| `grep -cE 'import.*from.*"@/lib/editions-data"'` | 0 | 0 | ✓ |
| `grep -cE 'import.*from.*"@/i18n/utils"'` | 0 | 0 | ✓ |
| `grep -cE 'import.*PastEditionMinimal'` | 0 | 0 | ✓ |
| `grep -cE 'id=\{?["\x27]?edition-2023["\x27]?\|id=\{id\}'` | ≥ 1 | 1 | ✓ |
| `grep -cE 'playlist\|youtube'` (raw, whole file) | 0 | 1 | ⚠ (see Deviations §1 — JSDoc-only, template body = 0) |

## Accessibility Checklist Pass/Fail (UI-SPEC §Accessibility)

| Item | Status | Evidence |
|------|--------|----------|
| Single `<h2>`, zero `<h3>` | ✓ PASS | grep: h2=1, h3=0 |
| `<Image>` carries non-empty `alt={logoAlt}` | ✓ PASS | Line 46 — caller passes e.g. `"Kubernetes Community Days France 2023"` |
| `/2023` CTA has NO `target="_blank"` | ✓ PASS | Line 53-56 anchor carries only `href` + `class` — same-tab in-site navigation |
| `/2023` CTA has NO `rel=` attribute | ✓ PASS | In-site same-tab; no Referer or tabnabbing concern |
| Pattern A arrow — no duplicate `<span aria-hidden="true">→</span>` | ✓ PASS | grep: 0 matches. Arrow lives in `viewPageLabel` i18n value. |
| Default `id="edition-2023"` preserved for deep links | ✓ PASS | Line 35 destructuring defaults to `"edition-2023"`; `:target { scroll-margin-top: 5rem; }` in `global.css` line 117 handles offset |
| Zero `client:*` directives | ✓ PASS | grep: 0 matches |
| DS tokens only — no bg-accent / text-accent / border-accent / ad-hoc hex/rgb / bg-card | ✓ PASS | grep: 0 accent tokens, 0 hex/rgb literals, 0 bg-card |

## ED23-01 Compliance Gate

**Requirement:** "Homepage 2023 bloc shows only KCD logo + text link to /2023 page (no photos)"

| Grep | Expected | Actual | Note |
|------|----------|--------|------|
| `grep -cE '<figure\b\|<img\b\|grid-cols-3\|grid-cols-6\|playlist\|youtube\|photos' src/components/past-editions/Edition2023Link.astro` (whole file) | 0 | 1 | One match on JSDoc line 6 ("No photos, no playlist link") documenting what the component OMITS |
| Template-body-only grep (after the closing `---` fence) | 0 | **0** | Zero forbidden tokens in the rendered DOM surface ✓ |

**ED23-01 satisfied** — the rendered template body contains exactly: 1 `<Image>` (KCD logo, optimised via `astro:assets`), 1 `<h2>`, 1 `<a>` (to `/2023`). No `<figure>`, no bare `<img>`, no photo grid, no `<iframe>`, no playlist href. The single JSDoc-prose match on "photos/playlist" is the component's self-documenting statement of what it intentionally does NOT render.

## Threat Mitigation Verification (grep-verifiable from threat_model)

| Threat ID | Disposition | Mitigation | Verification |
|-----------|-------------|------------|--------------|
| T-24-12 | accept | `/2023` CTA same-tab — no external crossing, no Referer concern, no reverse-tabnabbing surface | `grep -cE 'target="_blank"' Edition2023Link.astro` = 0 ✓ |
| T-24-13 | accept | `viewPageHref` is caller-supplied (Phase 26 hardcodes `lang === "en" ? "/en/2023" : "/2023"`); no runtime user input flows to this prop | Verified at caller contract level — Phase 24 component does not add a runtime-input source |
| T-24-14 | accept | `logo` is typed `ImageMetadata` — missing PNG fails at BUILD time (`bun run build` caught it if the path broke) | `bun run build` exits 0 ✓ |
| T-24-15 | accept | No new i18n keys added; `editions.2023.compact_title` + `editions.2023.view_page_cta` exist in BOTH fr + en (ui.ts lines 225/231 fr, 519/525 en) | i18n parity inherited from plan 24-01 check |
| T-24-16 | accept | KCD logo is intentionally non-interactive (UI-SPEC §Interaction states); text-link CTA immediately below provides the single clickable path | Anchor count = 1 (only the CTA) ✓ |

No user input accepted at runtime. No form, no auth surface, no destructive action, no external anchor.

## Deviations from Plan

### 1. [Documentation vs. literal grep] JSDoc retains literal strings "photos" and "playlist"

- **Found during:** Task 2 ED23-01 compliance grep sweep.
- **Issue:** The acceptance criterion `grep -cE '<figure\b|<img\b|grid-cols-3|grid-cols-6|playlist|youtube|photos' src/components/past-editions/Edition2023Link.astro` expects a return of 0, but the plan's action block frontmatter JSDoc (copied verbatim per instructions) contains the literal phrase **"No photos, no playlist link, no brand-history prose"** on line 6. The criterion and the action block are in direct tension in the plan as written.
- **Resolution:** Preserved the plan's verbatim JSDoc. The INTENT of the criterion (ED23-01 = "no photos / no playlist in the rendered bloc") is fully satisfied:
  - Zero `<figure>`, zero `<img>`, zero `grid-cols-3/6`, zero `playlist|youtube` in the template body (after the closing `---` fence). Template-scoped grep returns 0 ✓.
  - The single match lives in a JSDoc prose comment documenting what the component INTENTIONALLY OMITS — stripped at build time, zero DOM impact.
- **Impact:** Zero functional impact. Identical deviation classification to plan 24-02's deviation #1 (documentation-vs-grep tension) — both are plan-internal inconsistencies between verbose JSDoc text and literal greps; both leave the rendered output fully compliant.
- **Not a bug** — no Rule 1/2/3 auto-fix was triggered.

### 2. [Regex tooling] Raw `grep -c '<a '` returned 0 due to newline after `<a`

- **Found during:** Task 1 acceptance-criteria grep sweep.
- **Issue:** The UI-SPEC-derived anatomy puts `<a` on its own line followed by indented `href=` / `class=` attributes (multi-line anchor formatting — standard for readability). The criterion's literal `grep -c '<a '` pattern (with a trailing space) does not match `<a\n      href=...`.
- **Resolution:** Used the stronger word-boundary pattern `grep -cE '<a\b'` which correctly returns 1 (the single `/2023` CTA anchor). Verified visually by reading line 53 of the file.
- **Impact:** Zero — the INTENT of the acceptance criterion (exactly 1 anchor in the component) is fully satisfied. This is a literal-grep tooling quirk, not a compliance issue.

**Total deviations:** 2 documentation / tooling inconsistencies (plan-internal tensions). No code path affected. All functional acceptance criteria pass. All threat mitigations verified. No scope creep.

## Issues Encountered

None — plan executed smoothly. Both tasks landed on the first attempt. `bun run astro check` + `bun run build` both aligned with the pre-existing baseline (11 errors, 0 new).

## User Setup Required

None — no external service, no env var, no secret, no CSV schema change. Pure component-add plan consuming existing i18n keys + existing data module asset.

## Next Phase Readiness

- **Phase 26 (homepage wiring)** can now mount the component. Canonical caller snippet:
  ```astro
  ---
  import { EDITION_2023 } from "@/lib/editions-data";
  import Edition2023Link from "@/components/past-editions/Edition2023Link.astro";
  // lang + t already in scope via getLangFromUrl / useTranslations
  ---

  <Edition2023Link
    id="edition-2023"
    heading={t("editions.2023.compact_title")}
    logo={EDITION_2023.brandLogo}
    logoAlt="Kubernetes Community Days France 2023"
    viewPageLabel={t("editions.2023.view_page_cta")}
    viewPageHref={lang === "en" ? "/en/2023" : "/2023"}
  />
  ```
- **No CSV / Zod / Sheet migration** — Phase 24 consumes existing `EDITION_2023.brandLogo` and existing `editions.2023.*` i18n keys.
- **`PastEditionMinimal.astro` remains orphan-by-design** until Phase 26 swaps in `Edition2023Link.astro` and deletes the old file.
- **Sibling component in wave 2 (SponsorsPlatinumStrip from plan 24-02)** completed — Phase 24 component layer is now 100% done. Ready for Phase 25 (Hero v1.2) and Phase 26 (Homepage Wiring) to proceed.

## Self-Check

- `src/components/past-editions/Edition2023Link.astro` exists: FOUND
- Component line count = 60 (≥ 40 required): FOUND
- `export interface Props` declared (line 21): FOUND
- `import { Image } from "astro:assets"` (line 19): FOUND
- `import type { ImageMetadata } from "astro"` (line 20): FOUND
- Single `<h2>`, zero `<h3>`: FOUND (h2 line 47, no h3)
- Single `<a>` anchor to viewPageHref (line 53): FOUND
- No `target="_blank"`, no `rel=`, no duplicate arrow span: FOUND (all 0 matches)
- No `<figure>`, no `<img>` (only `<Image>`), no `grid-cols-3/6`, no `playlist|youtube` in template body: FOUND (all 0 matches in scoped grep)
- Default `id="edition-2023"` in destructure (line 35): FOUND
- Commit `c0e045f` (Task 1 feat component): FOUND in `git log --oneline`
- Commit `269bcd4` (Task 2 chore verify): FOUND in `git log --oneline`
- `bun run astro check`: 11 errors, unchanged from baseline: CONFIRMED
- `bun run build`: exit 0, 156 pages built: CONFIRMED
- Scope gate — `git status --porcelain` lists ONLY pre-existing deltas (`.planning/config.json`, `ambiance-00.jpg`): CONFIRMED

**## Self-Check: PASSED**

---
*Phase: 24-sponsors-platinum-edition-2023*
*Completed: 2026-04-18*
