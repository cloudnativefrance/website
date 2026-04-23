---
phase: 25-hero-redesign
plan: 01
subsystem: ui

tags: [astro, hero, i18n, tailwind, shadcn, accent-pink, responsive, accessibility, svg]

# Dependency graph
requires:
  - phase: 24-sponsors-platinum-edition-2023
    provides: "Accent Pink anchoring lockout (rule: bg-accent/text-accent/border-accent forbidden outside src/components/hero/**); buttonVariants pattern (cn() layered overlays on top of variant classes); Pattern A vs Pattern B arrow-glyph convention; sr-only sentinel pattern"
provides:
  - "ambiance-00.jpg hero background @ opacity-75 (HERO-01)"
  - "3-CTA hero row in DOM order: Register filled (Primary Blue) → Schedule outline (Blue) → Newsletter ghost (Accent Pink, leading mail SVG)"
  - "Newsletter placeholder anchor wired to in-section #newsletter-stub sentinel — swap-ready for CLO-6 backend"
  - "Mobile-first responsive stacking (flex-col gap-3 sm:flex-row sm:gap-4 md:gap-6)"
  - "2 new i18n keys (hero.cta.newsletter + hero.cta.newsletter_aria) in fr + en (PITFALLS #2 parity preserved)"
affects: [phase-26-homepage-restructuring, clo-6-newsletter-backend]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pink Ghost CTA = buttonVariants({ variant: 'ghost', size: 'lg' }) + cn(text-accent, hover:bg-accent/10 hover:text-accent, focus-visible:ring-accent/50, gap-2) — accent overlays layered AFTER variant classes via tailwind-merge"
    - "Hand-inlined lucide 'mail' SVG (MIT) with aria-hidden='true' focusable='false' as a leading icon inside flex-gap-2 anchor; no lucide-react import (site-wide convention)"
    - "Same-page placeholder anchor = href='#newsletter-stub' + sibling sr-only aria-hidden div inside hero section (no visual jump on click; CLO-6 swap-ready)"
    - "Single-<img> background opacity (opacity-75 directly on the <img>, NO additional dark overlay div); existing vertical wash + radial gradient + GeoBackground handle contrast scaffolding"

key-files:
  created:
    - src/assets/photos/ambiance/ambiance-00.jpg (4.4 MB user-provided hero background)
  modified:
    - src/i18n/ui.ts (+4 lines: 2 keys × 2 locales)
    - src/components/hero/HeroSection.astro (+36/-4 lines: 4 surgical edits — import rename, <img> src/opacity, CTA row container class, append Ghost CTA + sentinel)

key-decisions:
  - "[25-01] Background opacity locked to single <img> @ opacity-75 (no overlay div); contrast math passes AA over the existing vertical wash + radial gradient + GeoBackground scaffolding"
  - "[25-01] Mail icon hand-inlined as <svg> child of the anchor (lucide 'mail' geometry, MIT) — no lucide-react import added, mirrors Phase 23/24 site-wide convention"
  - "[25-01] Newsletter placeholder anchor = href='#newsletter-stub' paired with sibling <div id='newsletter-stub' class='sr-only' aria-hidden='true'> inside the hero section; same-page scroll within hero fold = no visual jump; CLO-6 swap-ready by changing href + deleting stub"
  - "[25-01] Ghost CTA focus ring overrides default ring-ring/50 to ring-accent/50 — identity match (Pink button, Pink ring); override scoped to single CTA via cn() class concat"
  - "[25-01] Mobile button widths kept intrinsic (no w-full) — UI-SPEC §Discretion Resolutions rejects w-full because it pushes Countdown out of the 80vh fold on small phones"
  - "[25-01] EN copy 'Stay in the loop' chosen over 'Stay informed' / 'Sign up for updates' / 'Keep me posted' — idiomatic EN matching the casual register of 'Get Your Ticket' / 'View Schedule'"
  - "[25-01] ambiance-10.jpg KEPT on disk and in src/lib/editions-data.ts (still consumed by PastEditionSection / Edition2026Combined per UI-SPEC §Data Module & Asset Changes)"

patterns-established:
  - "Pink Ghost CTA accent-overlay pattern (text-accent + hover:bg-accent/10 hover:text-accent + focus-visible:ring-accent/50 + gap-2 on top of buttonVariants({ variant: 'ghost', size: 'lg' })) — reusable for any future hero-only Pink ghost button"
  - "Placeholder anchor pattern: href='#sentinel-id' + sibling <div id='sentinel-id' class='sr-only' aria-hidden='true'> inside the same section ⇒ valid HTML, valid keyboard focus target, swap-ready when backend lands"
  - "Single <img>-opacity background approach for hero-style sections (no overlay div) when existing gradient/SVG layers already provide AA contrast scaffolding"

requirements-completed: [HERO-01, HERO-02]

# Metrics
duration: 4min
completed: 2026-04-18
---

# Phase 25 Plan 01: Hero Redesign Summary

**Live hero now renders ambiance-00.jpg @ opacity-75 with a 3-CTA row (Register filled / Schedule outline / Newsletter ghost-with-mail-icon), mobile-first stacking, and a swap-ready #newsletter-stub anchor — all in one atomic plan with fr+en parity preserved.**

## Performance

- **Duration:** ~4 min (224 s wall clock from first edit to final task commit)
- **Started:** 2026-04-18T22:56:15Z
- **Completed:** 2026-04-18T22:59:59Z
- **Tasks:** 2 (both committed atomically; no checkpoints; no deviations)
- **Files modified:** 2 (`src/i18n/ui.ts`, `src/components/hero/HeroSection.astro`)
- **Files created:** 1 (`src/assets/photos/ambiance/ambiance-00.jpg`)

## Accomplishments

- **HERO-01 satisfied** — background swap to `ambiance-00.jpg` at `opacity-75` (single-`<img>` approach, no overlay) ships live (component is mounted on both homepages pre-edit).
- **HERO-02 satisfied** — 3-CTA row ships in DOM order Register filled (Primary Blue) → Schedule outline (Blue) → Newsletter ghost (Accent Pink with leading mail SVG); responsive stacking via `flex flex-col gap-3 sm:flex-row sm:gap-4 md:gap-6`.
- **Same-page placeholder anchor** — `href="#newsletter-stub"` paired with in-section `<div id="newsletter-stub" class="sr-only" aria-hidden="true">`; CLO-6 backend can swap the href + delete the stub in a single commit when it lands.
- **fr/en parity preserved** — `hero.cta.newsletter` + `hero.cta.newsletter_aria` ship in BOTH fr and en blocks of `src/i18n/ui.ts` in the same atomic plan as the component edit (PITFALLS #2 — no silent FR fallback window for EN visitors).
- **Phase 24 Accent Pink lockout honored** — non-hero `bg-accent|text-accent|border-accent` count holds at the planning-time baseline of exactly **9** (zero new leakage outside `src/components/hero/`).
- **Build green** — `bun run build` exits 0, 156 pages built; `bun run astro check` reports the existing 11-error baseline (zero NEW errors).

## Task Commits

Each task was committed atomically (auto-mode, sequential executor on main):

1. **Task 1: Add 2 new hero.cta.newsletter + hero.cta.newsletter_aria i18n keys to both fr and en locales** — `2ac1d8f` (feat)
2. **Task 2: Rebuild HeroSection.astro per UI-SPEC — ambiance-00 @ opacity-75 + 3-CTA row + Ghost mail SVG + #newsletter-stub anchor** — `b112d5d` (feat)

**Plan metadata commit:** to be created next (commits SUMMARY.md + STATE.md + ROADMAP.md + REQUIREMENTS.md).

## Files Created/Modified

### Created

- `src/assets/photos/ambiance/ambiance-00.jpg` (4.4 MB, user-provided hero background image; verified on disk pre-edit at planning time per STATE.md memory entry `project_v1_2_hero_bg`).

### Modified

- `src/i18n/ui.ts` — Added 4 new key/value lines:
  - FR (lines 36–37): `"hero.cta.newsletter": "Restez informé"` and `"hero.cta.newsletter_aria": "Restez informé des annonces Cloud Native Days France"`
  - EN (lines 334–335): `"hero.cta.newsletter": "Stay in the loop"` and `"hero.cta.newsletter_aria": "Stay informed about Cloud Native Days France announcements"`
  - Inserted immediately AFTER existing `"hero.logo_alt"` and BEFORE `"countdown.days"` in each block (keeps all `hero.*` keys grouped).
- `src/components/hero/HeroSection.astro` — 4 surgical edits (+36/-4):
  1. Frontmatter line 9: `import ambiance from "@/assets/photos/ambiance/ambiance-10.jpg"` → `import ambiance00 from "@/assets/photos/ambiance/ambiance-00.jpg"`
  2. `<img>` tag lines 22–29: `src={ambiance.src}` → `src={ambiance00.src}` and `opacity-[0.55]` → `opacity-75`
  3. CTA row container line 70: appended ` md:gap-6` to existing flex chain (final value: `flex flex-col gap-3 sm:flex-row sm:gap-4 md:gap-6`)
  4. Inserted (a) third Ghost CTA `<a href="#newsletter-stub" aria-label={t("hero.cta.newsletter_aria")} …>` containing hand-inlined mail SVG + label, AFTER the Schedule CTA's ternary `</a>` and BEFORE the row's closing `</div>`; AND (b) `<div id="newsletter-stub" class="sr-only" aria-hidden="true"></div>` AFTER the row's closing `</div>` and BEFORE the inner content container's closing `</div>`.

### NOT modified (verified)

- `src/pages/index.astro` and `src/pages/en/index.astro` — Phase 26 owns broader homepage section reordering.
- `src/components/ui/button.tsx` — `buttonVariants` reused as-is, no new variant added.
- `src/styles/global.css` — DS tokens unchanged.
- `package.json` — no new dependency added; `lucide-react` NOT imported (mail icon is hand-inlined SVG per UI-SPEC §Discretion Resolutions).
- `src/components/past-editions/*` — out of scope.
- `src/lib/editions-data.ts` — still references `ambiance-10.jpg`; that asset is KEPT on disk (PastEditionSection / Edition2026Combined still consume it via the data module).

## Asset Verification

- `src/assets/photos/ambiance/ambiance-00.jpg` confirmed on disk at 4,583,225 bytes (~4.4 MB), placed by user 2026-04-18 09:53 (matches planning-time check + STATE.md memory entry `project_v1_2_hero_bg`).
- `src/assets/photos/ambiance/ambiance-10.jpg` confirmed STILL on disk at 654,885 bytes — NOT deleted; still consumed by `src/lib/editions-data.ts` (loaded by PastEditionSection / Edition2026Combined). Removing it would break the past-editions data layer.

## Verification Results

### Task 1 — i18n grep gates (all PASS)

| Gate | Expected | Actual |
|------|----------|--------|
| `grep -c '"hero\.cta\.newsletter"' src/i18n/ui.ts` | 2 | 2 |
| `grep -c '"hero\.cta\.newsletter_aria"' src/i18n/ui.ts` | 2 | 2 |
| `grep -cE '"hero\.cta\.newsletter":\s*"Restez informé"' src/i18n/ui.ts` (FR) | 1 | 1 |
| `grep -cE '"hero\.cta\.newsletter":\s*"Stay in the loop"' src/i18n/ui.ts` (EN) | 1 | 1 |
| `grep -cE '"hero\.cta\.newsletter_aria":\s*"Restez informé des annonces Cloud Native Days France"' src/i18n/ui.ts` | 1 | 1 |
| `grep -cE '"hero\.cta\.newsletter_aria":\s*"Stay informed about Cloud Native Days France announcements"' src/i18n/ui.ts` | 1 | 1 |
| Glyph in i18n value (`grep -cE '…[→✉📩📧]'`) | 0 | 0 |
| Existing `hero.cta.register` preserved | 2 | 2 |
| Existing `hero.cta.schedule` preserved | 2 | 2 |
| Existing `hero.title` preserved | 2 | 2 |
| fr/en parity newsletter keys (`grep -cE '^\s{4}"hero\.cta\.newsletter(_aria)?"'`) | 4 | 4 |

### Task 2 — HeroSection grep gates (all PASS)

**Background image (HERO-01):**

| Gate | Expected | Actual |
|------|----------|--------|
| `grep -cE 'import\s+ambiance00\s+from\s+"@/assets/photos/ambiance/ambiance-00\.jpg"'` | 1 | 1 |
| `grep -c 'ambiance-10' src/components/hero/HeroSection.astro` | 0 | 0 |
| `grep -c 'ambiance00\.src'` | 1 | 1 |
| `grep -c 'opacity-75'` | 1 | 1 |
| `grep -c 'opacity-\[0\.55\]'` | 0 | 0 |

**3-CTA row (HERO-02):**

| Gate | Expected | Actual |
|------|----------|--------|
| `hero.cta.register` reference | 1 | 1 |
| `hero.cta.schedule` reference | 1 | 1 |
| `hero.cta.newsletter` (matches both label + aria_-prefixed key) | 2 | 2 |
| `t("hero.cta.newsletter")` (label call) | 1 | 1 |
| `t("hero.cta.newsletter_aria")` (aria call) | 1 | 1 |
| `variant: "ghost"` | 1 | 1 |
| `id="newsletter-stub"` (sentinel) | 1 | 1 |
| `class="sr-only"\s+aria-hidden="true"` (sentinel marker) | ≥1 | 1 |
| Total `newsletter-stub` references (1 in href + 1 in id) | 2 | 2 |

**Mail icon (Ghost CTA):**

| Gate | Expected | Actual |
|------|----------|--------|
| `aria-hidden="true"` (background `<img>` + sentinel `<div>` + mail `<svg>`) | ≥3 | 3 |
| `focusable="false"` (mail SVG only) | 1 | 1 |
| `viewBox="0 0 24 24"` (mail SVG geometry) | 1 | 1 |
| `<rect width="20" height="16"` (mail envelope rect) | 1 | 1 |
| `from "lucide-react"` (NO lucide-react import) | 0 | 0 |

**Responsive stacking (HERO-02 #4):**

| Gate | Expected | Actual |
|------|----------|--------|
| `flex flex-col gap-3 sm:flex-row sm:gap-4 md:gap-6` chain | 1 | 1 |

**Accent Pink lockout (non-regression):**

| Gate | Expected | Actual |
|------|----------|--------|
| Non-hero accent count (excludes `src/components/hero/**` and `src/components/ui/button.tsx`) | exactly 9 (planning baseline) | 9 |
| In-hero accent count (rises strictly above pre-edit baseline of 2) | > 2 | 4 (Badge line 57 + Ghost CTA lines 99–100; KeyNumbers.tsx line 93 was already counted in baseline) |

The 4 Ghost CTA accent overlay tokens are all present: `text-accent` (line 99), `hover:bg-accent/10 hover:text-accent` (line 100), and `focus-visible:ring-accent/50` (line 101). The `ring-accent/50` token is not matched by the `bg-/text-/border-accent` grep but is verified by direct inspection.

**No homepage / non-hero file modified:**

- `git status --porcelain src/pages/` — empty.
- `git status --porcelain src/styles/global.css` — empty.
- `git status --porcelain src/components/ui/button.tsx` — empty.
- `git status --porcelain package.json` — empty.
- `git status --porcelain | grep -E '^.M\s+src/components/' | grep -v 'src/components/hero/HeroSection.astro'` — empty.

### Build + type-check

| Gate | Expected | Actual |
|------|----------|--------|
| `bun run astro check` | 11/11 baseline errors, 0 NEW errors | 11 errors / 0 warnings / 9 hints (script exit 1, baseline preserved — see plan §Verification baseline language) |
| `bun run build` exit code | 0 | 0 |
| Pages built | 156 | 156 |

The 11 pre-existing `astro check` errors (content.config Zod loaders, Edition2023PhotoGrid implicit-any, TestimonialsStrip template-literal keys, orphan `editions.2026.gallery_cta` references in `src/pages/index.astro` and `src/pages/en/index.astro`) are deferred housekeeping per plan 23-01 — none touch `src/components/hero/HeroSection.astro` or `src/i18n/ui.ts`.

## Decisions Made

None new beyond the UI-SPEC's locked decisions and the planner's pre-locked discretion resolutions. The plan's action blocks were exhaustive enough to remove all mid-execution decision points. Key locked decisions reaffirmed at execution time:

1. Background opacity = single `<img>` @ `opacity-75` (no overlay div) — UI-SPEC §"Background opacity implementation (locked)".
2. Mail icon = hand-inlined SVG (lucide "mail" geometry) — NO `lucide-react` import.
3. Newsletter `href` = `#newsletter-stub` + in-hero sentinel `<div>` — NOT `aria-disabled` and NOT deferred to Phase 26.
4. Ghost CTA focus ring = `focus-visible:ring-accent/50` (identity match to Pink button), NOT default Blue ring.
5. Mobile button widths = intrinsic (NO `w-full` on `<sm:`) — preserves Countdown visibility in 80vh fold.
6. EN copy = "Stay in the loop" (idiomatic EN matching the casual register of existing CTA labels).
7. `ambiance-10.jpg` KEPT on disk (still required by PastEditionSection / Edition2026Combined via `src/lib/editions-data.ts`).

## Deviations from Plan

**None — plan executed exactly as written.**

All 4 surgical edits in Task 2 applied verbatim per the UI-SPEC §"Component Anatomy & Layout" tree. Both i18n key insertions in Task 1 landed at the exact byte position prescribed (after `hero.logo_alt`, before `countdown.days`). No auto-fixes triggered (Rules 1–3); no architectural escalations required (Rule 4).

## Issues Encountered

None. Both tasks ran clean on first attempt:

- Task 1: i18n keys added → all 11 grep gates PASS → `astro check` exits with the existing 11-error baseline (no new errors) → committed as `2ac1d8f`.
- Task 2: 4 surgical edits applied to `HeroSection.astro` → all background/CTA/mail-icon/responsive/accent grep gates PASS → `astro check` 11-error baseline preserved → `bun run build` exits 0 with 156 pages → committed as `b112d5d` (also captures the new `ambiance-00.jpg` asset).

## User Setup Required

None — no environment variables, no third-party service configuration, no schema migrations.

## Live Mount Status

**Hero ships live with this commit chain.** Unlike Phase 23 / Phase 24 components (left unmounted for Phase 26 to wire), `HeroSection.astro` is ALREADY mounted on both `src/pages/index.astro` and `src/pages/en/index.astro` (pre-edit). Visitors see the new `ambiance-00.jpg` background, the 3-CTA row, and the Pink Ghost newsletter button immediately after this plan's commits land on `main`.

## Next Phase Readiness

- **Phase 26 (Homepage section reordering)** — unblocked. The new hero is in place and ships live; Phase 26 owns broader page-level `<Hero /> <KeyNumbers /> <CFP /> <SponsorsPlatinumStrip /> <Edition2023Link /> <PastEditionSection />` reordering on both homepages. No Phase 25 → Phase 26 wiring step is required for HERO-01 / HERO-02.
- **CLO-6 (Newsletter backend, deferred)** — swap path is documented: change `href="#newsletter-stub"` → `href="/newsletter"` (or modal trigger) and delete the sentinel `<div id="newsletter-stub">` in a single commit; the Pink Ghost CTA chrome stays identical, no visual churn.
- **No blockers** for v1.2 close-out beyond Phase 26.

## Self-Check: PASSED

Verified post-write (commits + files exist on disk):

- `2ac1d8f` (Task 1) → `git log --oneline | grep 2ac1d8f` → FOUND
- `b112d5d` (Task 2) → `git log --oneline | grep b112d5d` → FOUND
- `src/assets/photos/ambiance/ambiance-00.jpg` → exists (4.4 MB)
- `src/i18n/ui.ts` → carries 2 new keys × 2 locales (verified via grep)
- `src/components/hero/HeroSection.astro` → 4 edits applied, file structurally intact (read post-edit, lines 1–127)
- `bun run build` → exit 0 (156 pages)

---

*Phase: 25-hero-redesign*
*Completed: 2026-04-18*
