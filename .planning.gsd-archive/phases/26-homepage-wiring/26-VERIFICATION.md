---
phase: 26-homepage-wiring
verified_at: "2026-04-19"
status: verified
score: 5/5 success criteria + 2/2 requirements verified at integration level
re_verification: false
success_criteria:
  - id: 1
    text: "Both /fr and /en homepages render sections in order: Hero -> Key Numbers -> Edition 2026 -> Mini-bloc 2023 -> CFP -> Sponsors Platinum"
    status: verified
    evidence: "dist/index.html + dist/en/index.html: edition-2026 < edition-2023 < cfp < sponsors-homepage offsets confirmed via DOM scan (FR: 28531/33202/34001/35085 ; EN: 29381/34009/34809/35850). Hero + KeyNumbers also present (ambiance-00 background and React island markers confirmed)."
  - id: 2
    text: "Old separate PastEditionSection, PastEditionMinimal, and TestimonialsStrip imports REMOVED from homepage files"
    status: verified
    evidence: "src/pages/index.astro and src/pages/en/index.astro: zero greps for the three names. The 3 component files themselves are also deleted (Plan 26-03). Only stale doc-comments remain in 3 sibling files (IN-01 in REVIEW; advisory)."
  - id: 3
    text: "WCAG AA contrast maintained on hero (Phase 26 doesn't touch hero pixels — inherited from Phase 25)"
    status: verified
    evidence: "Phase 26 modifies only homepage files + favicon + 3 deletions; HeroSection.astro is untouched. Inherited contrast guarantee from Phase 25 (25-01-SUMMARY documents AA-conformant text-on-image at opacity-75). Live ambiance-00 background + 3 CTAs confirmed in dist/index.html."
  - id: 4
    text: "Build clean, no orphaned component imports"
    status: verified
    evidence: "bun run build exits 0, 156 pages built in 6.20s. Astro check: 5 errors (down from 11 baseline → 9 after 26-01 → 5 after 26-03). Remaining 5 are pre-existing baseline (content.config.ts Zod ×3, Edition2023PhotoGrid implicit-any ×2) — out of Phase 26 scope per STATE.md Pending Todos."
  - id: 5
    text: "Favicon displays the French flag"
    status: verified
    evidence: "public/favicon.svg shipped to dist/favicon.svg (347 bytes); 3 <rect> bands with #002654 / #FFFFFF / #ED2939 (official Élysée tricolor); square 1:1 viewBox; Layout.astro <link rel=icon type=image/svg+xml href=/favicon.svg /> already targets the file (untouched)."
requirements:
  - id: LAYO-01
    plans: [26-01, 26-03]
    status: satisfied
    evidence: "26-01 wired the v1.2 section order to both locale homepages (FR + EN diff exactly 2 hunks: Layout import depth + viewPageHref locale); 26-03 deleted the 3 orphan v1.1-era components after a re-verification grep gate."
  - id: BRND-01
    plans: [26-02]
    status: satisfied
    evidence: "favicon.svg is now a 3-band French tricolor with official government palette; ships unchanged into dist/."
code_quality:
  astro_check: "5 errors (down from 11 baseline; matches expected post-26-03 state). Remaining errors all pre-existing and out of Phase 26 scope (content.config.ts × 3, Edition2023PhotoGrid.astro × 2)."
  build: "exit 0, 156 pages in 6.20s"
  tests: "164 pass / 7 fail (6 distinct fail() + 1 unhandled astro:content import error). All 7 are pre-existing: SPKR-01 fixture drift × 5 (mock speakers vs real names), EDITION_2026 thumbnail count change × 1 (Phase 23 reduced from 4 to 3), and the speakers.test.ts astro:content import error. Phase-26-introduced test breakage was repaired in 73fdfa1 (4 build/test files updated)."
  review_status: "warnings (3 test-suite warnings RESOLVED in 73fdfa1; 4 info polish notes accepted/deferred)"
locale_parity:
  fr_2023_href: "/2023 present in dist/index.html"
  en_2023_href: "/en/2023 present in dist/en/index.html"
  fr_sponsors_href: "/sponsors present in dist/index.html"
  en_sponsors_href: "/en/sponsors present in dist/en/index.html"
  cross_locale_leak_check: "PASS — FR has zero /en/* hrefs from these mounts; EN has zero unprefixed /2023 or /sponsors hrefs from these mounts."
csv_source_of_truth:
  pattern: "getCollection(\"sponsors\").filter((s) => s.data.tier === \"platinum\")"
  fr_pages_count: 1
  en_pages_count: 1
  rendered_sponsors: ["Acme Cloud", "NebulaStack"]
  evidence: "Both homepage files filter sponsors at the page boundary; both Platinum sponsors from src/content/sponsors/sponsors.csv (acme-cloud, nebula-stack) render in dist/index.html and dist/en/index.html. CLAUDE.md CSV-as-source-of-truth invariant honoured."
scope_discipline:
  files_touched_outside_planning: 10
  expected_set:
    - public/favicon.svg
    - src/components/past-editions/PastEditionMinimal.astro (deleted)
    - src/components/past-editions/PastEditionSection.astro (deleted)
    - src/components/testimonials/TestimonialsStrip.astro (deleted)
    - src/pages/en/index.astro
    - src/pages/index.astro
    - tests/build/homepage-2026-section.test.ts (rewritten)
    - tests/build/homepage-testimonials-mount.test.ts (rewritten)
    - tests/build/past-edition-shell.test.ts (deleted)
    - tests/build/testimonials-strip-source.test.ts (deleted)
  unexpected_drift: "none — components themselves untouched; no cross-pollination into i18n/utils, sponsor-utils, editions-data, or Layout."
human_visual_uat: pending
v1_2_milestone_status: feature-complete
human_verification:
  - test: "Run /gsd-verify-work 26 — full visual UAT on /fr + /en homepages, mobile real-device, Stitch comparison"
    expected: "Both homepages match the validated 'Homepage Mockup v2 — Restructured Sections' (Accent Pink CTA) Stitch design; 3 CTAs render correctly on mobile; tricolor favicon visible in browser tab"
    why_human: "Visual + mobile-device + accessibility audit cannot be programmatically verified"
  - test: "Lighthouse audit on /fr and /en homepages"
    expected: "Performance, A11y, Best Practices, SEO scores within v1.1 baseline (no regression)"
    why_human: "Lighthouse runs against a live server; not in scope of static-build verification"
  - test: "WCAG AA contrast spot-check on hero with new ambiance-00 background"
    expected: "Hero h1 + 3 CTA labels + tagline all clear AA against the @opacity-75 background overlay"
    why_human: "Phase 25 documented AA conformance for the hero pixel composition; mounting on the homepage doesn't change the pixels but the milestone-end audit should re-confirm with axe-devtools or Stark"
---

# Phase 26: Homepage Wiring Verification Report

**Phase Goal:** Both FR and EN homepages display sections in the validated v1.2 order and pass accessibility checks.
**Verified:** 2026-04-19
**Status:** verified
**Re-verification:** No — initial verification

## Goal-Backward Analysis

Phase 26 is the integration layer for the entire v1.2 milestone — Phases 23–25 built the visual primitives (Edition2026Combined, Edition2023Link, SponsorsPlatinumStrip, redesigned hero, tricolor favicon source); Phase 26 mounts them. The goal is therefore an INTEGRATION-level claim about both live pages, not a code-level claim about individual files.

Working backward from the goal:
1. **What must be TRUE?** Both `/` and `/en/` render the validated section order with the new components mounted, sponsor data flows from CSV, hrefs are locale-correct, and the favicon ships as a French tricolor.
2. **What must EXIST?** Two rewritten homepage files, one new favicon SVG, three deleted orphan components, an unbroken test suite (after the 73fdfa1 fix-up).
3. **What must be WIRED?** Components must mount in JSX (not just be imported); sponsors must flow from `getCollection("sponsors")` through the `tier === "platinum"` filter into the `<SponsorsPlatinumStrip>` prop and ultimately produce sponsor cards in the rendered HTML; locale-aware hrefs must produce `/2023` in FR and `/en/2023` in EN with no cross-locale leak.

All three levels verified at the **build artefact** layer (`dist/index.html` + `dist/en/index.html`), not just at the source layer — this is the strongest possible static verification short of running the dev server.

## Criterion-by-Criterion Results

### SC-1: Section order (Hero -> Key Numbers -> Edition 2026 -> Mini-bloc 2023 -> CFP -> Sponsors Platinum)

**Status:** VERIFIED at integration level

DOM offset scan on built artefacts:

| Locale | edition-2026 | edition-2023 | cfp | sponsors-homepage | Order |
|--------|-------------:|-------------:|----:|------------------:|:------|
| FR (`dist/index.html`) | 28531 | 33202 | 34001 | 35085 | PASS |
| EN (`dist/en/index.html`) | 29381 | 34009 | 34809 | 35850 | PASS |

Hero and KeyNumbers also confirmed present (ambiance-00 background reference + React island markers). The legacy DOM order (CFP before 2026/2023, asserted by the pre-73fdfa1 SC1 test) is fully replaced by the v1.2 order — Plan 26-01 reordered CFP DOWN and the test suite was updated accordingly in 73fdfa1.

### SC-2: PastEditionSection / PastEditionMinimal / TestimonialsStrip imports REMOVED

**Status:** VERIFIED

`grep -rn 'PastEditionSection|PastEditionMinimal|TestimonialsStrip' src/` returns 4 hits, all in stale doc-comments (`Edition2023Link.astro:9,11`; `Edition2026Combined.astro:81`; `editions-data.ts:87`). Zero live `import` statements; zero JSX mounts. The orphan source files themselves are deleted (Plan 26-03 commit `96436d2`). Tests directory: zero matches (the 4 broken/stale tests fixed in 73fdfa1).

### SC-3: WCAG AA hero contrast (Phase 25 inheritance)

**Status:** VERIFIED structurally; flagged for human re-confirmation in milestone audit

Phase 26 does not touch hero pixels. `git log --pretty=format: --name-only 0a8dfe0..HEAD` confirms `src/components/hero/HeroSection.astro` and the rest of `src/components/hero/` are untouched in Phase 26's commit range. The Phase 25 contract (ambiance-00.jpg @ opacity-75 + 3 CTAs documented as AA-conformant) ships LIVE on both homepages — confirmed via `ambiance-00` regex hit + 3 CTA text matches (Réservez / programme / informé) in `dist/index.html`.

The strict pixel-level AA spot-check is part of the v1.2 milestone audit (`/gsd-verify-work 26` + axe/Stark), not the per-phase verification.

### SC-4: Build clean, no orphaned component imports

**Status:** VERIFIED

| Stage | astro check errors | Trend |
|-------|-------------------:|:------|
| Pre-Phase-26 baseline | 11 | — |
| After 26-01 (homepage rewrite) | 9 | −2 (orphan editions.*.gallery_cta references gone) |
| After 26-03 (orphan delete) | **5** | −4 (TestimonialsStrip template-literal type errors gone with the file) |

Remaining 5 errors all pre-existing and OUT of Phase 26 scope:
- `src/content.config.ts` × 3 (Zod 13 `LoaderConstraint` regression)
- `src/components/past-editions/Edition2023PhotoGrid.astro` × 2 (implicit-any on `.map((p, i) => ...)` callback)

`bun run build` exits 0 and ships **156 pages** in 6.20s — no regression from the v1.1 baseline.

### SC-5: Favicon displays the French flag

**Status:** VERIFIED

`public/favicon.svg` is a 347-byte inline SVG with:
- 3 `<rect>` elements (left blue / middle white / right red)
- Official France-government palette `#002654` (Bleu de France) / `#FFFFFF` / `#ED2939` (Rouge de France)
- Square 1:1 viewBox `0 0 3 3` (renders cleanly in browser favicon slots)
- No `<script>`, no external `href`, no `prefers-color-scheme` (correct — flag has no dark variant)
- `<title>` for AT users (FR-only; IN-04 minor i18n nit, advisory)

`dist/favicon.svg` is byte-identical to `public/favicon.svg`. `src/layouts/Layout.astro` is git-clean — the existing `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` already targets the new file. Modern browsers (~99% of traffic) see the new flag immediately; legacy IE / Edge < 79 retain the old `.ico` fallback (intentional; user can drop a custom `.ico` later if needed).

## Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|--------------|-------------|--------|----------|
| LAYO-01 | 26-01, 26-03 | Homepage sections follow v1.2 order | satisfied | 26-01 wired the order on both locales (diff exactly 2 hunks); 26-03 deleted the orphan files; ROADMAP SC-1 + SC-4 pass |
| BRND-01 | 26-02 | Favicon displays the French flag | satisfied | 26-02 swapped favicon.svg with the official tricolor palette; ROADMAP SC-5 pass |

Both requirements traced to plans, executed, and verified at the build artefact layer. Cross-checked against `.planning/REQUIREMENTS.md` traceability table — no orphaned requirements for Phase 26.

## Data-Flow Trace (Level 4)

| Artefact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|:------|
| `<SponsorsPlatinumStrip sponsors={platinumSponsors}>` | `platinumSponsors` | `getCollection("sponsors").filter(s => s.data.tier === "platinum")` | YES — 2 platinum sponsors (Acme Cloud + NebulaStack) render in both FR and EN dist HTML | FLOWING |
| `<Edition2026Combined />` (zero-prop) | `EDITION_2026.thumbnails` + `TESTIMONIALS` | Component-internal default resolution from `@/lib/editions-data` and `@/lib/testimonials-data` | YES — 3 picture/img tags + YouTube iframe + replays text + PDF text all present in dist HTML | FLOWING |
| `<Edition2023Link logo={EDITION_2023.brandLogo}>` | `EDITION_2023.brandLogo` | `@/lib/editions-data` (KCD logo import) | YES — KCD logo rendered with locale-correct `/2023` or `/en/2023` href | FLOWING |
| `<HeroSection />` (Phase 25 inheritance) | Phase 25 i18n keys + ambiance-00.jpg | Untouched in Phase 26 | YES — ambiance-00 background reference + 3 CTAs (Reserve / Schedule / Newsletter) present | FLOWING |

All four data-flow traces produce real, non-empty output in the built artefacts. No HOLLOW or DISCONNECTED artefacts.

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|:------|
| Build produces 156 pages | `bun run build` | exit 0, 156 pages in 6.20s | PASS |
| Astro check matches expected baseline | `bun run astro check` | 5 errors (target met) | PASS |
| Built FR homepage exists | `ls dist/index.html` | exists | PASS |
| Built EN homepage exists | `ls dist/en/index.html` | exists | PASS |
| Favicon ships to dist | `ls dist/favicon.svg` | exists, 347 bytes (byte-identical to source) | PASS |
| Both Platinum sponsors render | grep `Acme Cloud` + `NebulaStack` in dist HTML | both present in FR + EN | PASS |
| Locale parity (no /en/* leak in FR) | grep `href="/en/2023"` and `href="/en/sponsors"` in dist/index.html | not found (clean) | PASS |
| Locale parity (no unprefixed leak in EN) | grep `href="/2023"` and `href="/sponsors"` in dist/en/index.html | not found (clean) | PASS |
| Test suite | `bun test` | 164 pass / 7 fail / 1 error (all 7 fails pre-existing; 73fdfa1 cleared the Phase-26-introduced ones) | PASS for Phase 26 scope |

## Scope Discipline

Files touched across all Phase 26 commits (`0a8dfe0..HEAD`, excluding `.planning/`):

- `public/favicon.svg` (rewrite — Plan 26-02)
- `src/pages/index.astro` (rewrite — Plan 26-01)
- `src/pages/en/index.astro` (rewrite — Plan 26-01)
- `src/components/past-editions/PastEditionMinimal.astro` (deleted — Plan 26-03)
- `src/components/past-editions/PastEditionSection.astro` (deleted — Plan 26-03)
- `src/components/testimonials/TestimonialsStrip.astro` (deleted — Plan 26-03)
- `tests/build/homepage-2026-section.test.ts` (rewritten — fix-up 73fdfa1)
- `tests/build/homepage-testimonials-mount.test.ts` (rewritten — fix-up 73fdfa1)
- `tests/build/past-edition-shell.test.ts` (deleted — fix-up 73fdfa1)
- `tests/build/testimonials-strip-source.test.ts` (deleted — fix-up 73fdfa1)

**No drift outside the expected set.** Phase 23/24/25 components themselves are untouched (`Edition2026Combined.astro`, `Edition2023Link.astro`, `SponsorsPlatinumStrip.astro`, `HeroSection.astro` all clean — composition-only phase as advertised). `Layout.astro`, `editions-data.ts`, `testimonials-data.ts`, `sponsor-utils.ts`, i18n files all untouched.

## CLAUDE.md Compliance

CSV-as-source-of-truth rule: **honoured at the page boundary.** Both homepages route sponsor data exclusively through `getCollection("sponsors")` and apply the lowercase `tier === "platinum"` filter at the page level — no hardcoded sponsor names, logos, or URLs anywhere in `src/pages/index.astro` or `src/pages/en/index.astro`. The `SponsorsPlatinumStrip` component is data-agnostic (Phase 24 design decision); the page filter keeps tier selection out of the reusable component.

Stitch-first rule: Phase 26 inherits Stitch validation from Phases 23/24/25 (each validated their visual primitives in Stitch); the homepage composition itself is the validated "Homepage Mockup v2 — Restructured Sections" (Accent Pink CTA version) per `.planning/PROJECT.md`.

## REVIEW Disposition (26-REVIEW.md status: warnings)

| Finding | Category | Disposition |
|---------|----------|-------------|
| WR-01: 2 test files `readFileSync` deleted source paths | Bug — cross-file regression | **RESOLVED** in 73fdfa1 (both files deleted) |
| WR-02: `homepage-testimonials-mount.test.ts` asserts old marquee DOM | Bug — stale DOM contract | **RESOLVED** in 73fdfa1 (rewritten for new contract) |
| WR-03: `homepage-2026-section.test.ts` SC1 ordering contradicts v1.2 order | Bug — stale ordering contract | **RESOLVED** in 73fdfa1 (assertions updated to e26 < e23 < cfp) |
| IN-01: Stale doc-comment refs to deleted components | Code quality / housekeeping | Accepted; out of scope for delete-only plans (advisory) |
| IN-02: `EDITION_2023.thumbnails` orphan data field | Dead code | Accepted; flagged for v1.3 baseline-cleanup pass |
| IN-03: `siteUrl` + sponsor-loader duplication across FR/EN files | Minor DRY | Accepted by design (Phase 26 FR/EN parity invariant — duplication is the contract) |
| IN-04: Favicon `<title>` is FR-only | Minor i18n nit | Accepted; impact negligible |

All 3 warnings cleared by the in-phase 73fdfa1 fix-up; 4 info findings deferred or accepted by design.

## Outstanding Items

1. **Human visual UAT** — separate `/gsd-verify-work 26` step covering:
   - Mobile real-device check of both homepages
   - Full Stitch comparison ("Homepage Mockup v2 — Restructured Sections")
   - Accessibility audit (axe-devtools + Stark or equivalent)
   - Tricolor favicon visible in browser tab
2. **Lighthouse audit** on `/` and `/en/` against v1.1 baseline (no regression).
3. **Pre-existing baseline backlog** — 5 astro-check errors + 7 unit-test failures, all out of Phase 26 scope:
   - `content.config.ts` Zod 13 `LoaderConstraint` regression × 3
   - `Edition2023PhotoGrid.astro` implicit-any × 2
   - SPKR-01 fixture drift × 5 (mock speakers vs real names)
   - EDITION_2026 thumbnail-count test × 1 (Phase 23 reduced from 4 to 3 by design — test needs updating)
   - `speakers.test.ts` astro:content import error
   - All documented in STATE.md "Pending Todos"; recommend a v1.3 baseline-cleanup phase.

## v1.2 Milestone Handoff

Phase 26 is the FINAL phase of v1.2:

| Phase | Goal | Status |
|-------|------|:------|
| 23 — Edition 2026 Combined Section | Combined recap with photos + film + replays + PDF + testimonials | Complete |
| 24 — Sponsors Platinum + Edition 2023 | Platinum logo strip + minimalised 2023 bloc | Complete |
| 25 — Hero Redesign | New background + 3-CTA layout | Complete (live) |
| 26 — Homepage Wiring | Atomic section reorder + accessibility check | **Complete (this report)** |

**v1.2 milestone is now feature-complete and ready for the milestone audit pass.**

Recommended next steps for the user:
1. Run `/gsd-verify-work 26` for the visual + mobile + a11y UAT (covers SC-3 strict spot-check and outstanding human-verification items above).
2. Run `/gsd-audit-milestone v1.2` to mirror the v1.0 / v1.1 audit format (LIGHTHOUSE + accessibility + Stitch parity + REQUIREMENTS coverage).
3. Run `/gsd-complete-milestone v1.2` once UAT + audit pass.
4. Plan v1.3 kick-off — likely scope: 5-error astro-check baseline cleanup, the SPKR-01 fixture drift fix, EDITION_2026 thumbnail-count test update, and CLO-6 newsletter backend integration.

---

_Verified: 2026-04-19_
_Verifier: Claude (gsd-verifier)_
_Note: All 5 ROADMAP success criteria verified at INTEGRATION level (built `dist/` artefacts), not just at source-code level. Both requirements (LAYO-01, BRND-01) satisfied. v1.2 feature-complete pending milestone audit + visual UAT._
