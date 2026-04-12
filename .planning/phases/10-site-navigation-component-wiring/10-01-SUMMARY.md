---
phase: 10-site-navigation-component-wiring
plan: 01
subsystem: ui

tags: [astro, i18n, navigation, tailwind, shadcn]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Design system tokens (deep purple background, Primary Blue), Tailwind 4 config, font pipeline
  - phase: 02-i18n
    provides: getLangFromUrl, useTranslations, getLocalePath helpers; nav.* keys in FR and EN; TranslationNotice component; LanguageToggle component
  - phase: 03-shadcn
    provides: button.tsx, card.tsx, separator.tsx primitives
provides:
  - Navigation.astro site-wide header with desktop inline links + mobile hamburger drawer
  - Layout.astro wiring with conditional TranslationNotice on non-default locale
  - Retention README for orphaned shadcn card/separator
  - Visual style locked via Stitch screens 906272..., 435707..., d53079...
affects: [hero, speakers, schedule, sponsors, venue, team, footer]

# Tech tracking
tech-stack:
  added: [@astrojs/check, typescript (devDep, enables astro check gate)]
  patterns:
    - "Astro component with embedded <script> for progressive enhancement (hamburger toggle + scroll listener)"
    - "getLocalePath() for every nav link — never hardcode /en/"
    - "Stitch-first revision loop: design changes validated in Stitch before code"

key-files:
  created:
    - src/components/Navigation.astro
    - src/components/ui/README.md
    - .planning/phases/10-site-navigation-component-wiring/deferred-items.md
  modified:
    - src/layouts/Layout.astro
    - src/components/LanguageToggle.astro
    - package.json
    - pnpm-lock.yaml

key-decisions:
  - "Nav links pure white (not muted-foreground) — user feedback via Stitch revision"
  - "LanguageToggle rewritten as minimal text-only FR / EN (no chip/pill) per Stitch revision"
  - "Scroll divider uses 15% white opacity + drop shadow for visibility over deep purple bg (border-border too subtle)"
  - "TranslationNotice placed OUTSIDE sticky header (scrolls with content) per D-08 and RESEARCH Pitfall 4"
  - "Dead links (schedule, sponsors, venue, team) point at getLocalePath(lang, '/') placeholder per D-05 until owning phases land"
  - "Orphan shadcn card.tsx/separator.tsx retained per D-09 with README documenting consuming phases"

patterns-established:
  - "Design iteration happens in Stitch first (project 14858529831105057917), then ports to code — never prescribe hex values that conflict with the locked design system"
  - "Visible dividers on dark-purple bg use white/15 opacity + drop shadow, not the default border token"

requirements-completed: []

# Metrics
duration: ~1h (including Stitch revision loop)
completed: 2026-04-12
---

# Phase 10: Site Navigation Component Wiring Summary

**Site-wide sticky header with i18n'd nav, mobile hamburger drawer, visible scroll divider, and minimal text-only language toggle — wired into Layout with conditional TranslationNotice on EN pages.**

## Performance

- **Duration:** ~1h (including Stitch revision loop after first visual review)
- **Completed:** 2026-04-12
- **Tasks:** 3 code tasks + 1 human-verify checkpoint
- **Files modified:** 5 (plus dev-dep additions)

## Accomplishments

- New `Navigation.astro` — sticky header with logo, 6 i18n nav links (FR/EN), active-link underline, mobile hamburger drawer with body scroll lock, scroll-triggered divider, embedded `LanguageToggle`, Register CTA
- `Layout.astro` now renders `<Navigation />` + conditional `<TranslationNotice />` on non-default locales
- Visual design validated in Stitch (three screens: default, scrolled, EN+banner) before each code revision
- Orphan shadcn `card.tsx` / `separator.tsx` documented for retention in `src/components/ui/README.md`
- Header style revised after first review to match Stitch feedback: white nav links, visible scroll divider, minimal toggle

## Task Commits

1. **Task 1: Create Navigation.astro** — `e7f8ec4` (feat)
2. **Task 2: Wire Navigation + TranslationNotice into Layout** — `628ac62` (feat)
3. **Task 3: Document shadcn orphan retention** — `425df36` (docs)
4. **Phase gate unblock: add @astrojs/check + typescript dev deps** — `105d2fe` (chore)
5. **Stitch-approved visual revisions: white links, visible scroll divider, minimal language toggle** — `b0949d0` (refactor)

## Files Created/Modified

- `src/components/Navigation.astro` — created; sticky header + mobile drawer + scroll listener
- `src/components/LanguageToggle.astro` — rewritten as minimal text-only FR / EN per Stitch revision
- `src/layouts/Layout.astro` — swapped inline header for `<Navigation />` + conditional `<TranslationNotice />`
- `src/components/ui/README.md` — created; documents D-09 retention
- `package.json` + `pnpm-lock.yaml` — added `@astrojs/check` + `typescript` (phase gate unblock)
- `.planning/phases/10-site-navigation-component-wiring/deferred-items.md` — logs pre-existing astro-check errors outside phase scope

## Decisions Made

Same as key-decisions above. Most notable: the initial pass followed UI-SPEC.md directly but the user flagged that every visual change must go through Stitch first. Memory rule updated to enforce Stitch validation before code AND during revision loops. Secondary memory rule added: never override locked design-system hexes in Stitch prompts — refer to tokens by role only.

## Deviations from Plan

### Auto-fixed Issues

**1. [Blocking dependency] Added `@astrojs/check` and `typescript` as devDependencies**
- **Found during:** Task 2 phase gate (`npm run astro check` failed because astro-check itself was missing)
- **Issue:** The `<verification>` gate required `npm run astro check` but the package wasn't installed; phase gate couldn't run without it
- **Fix:** `pnpm add -D @astrojs/check typescript`
- **Files modified:** `package.json`, `pnpm-lock.yaml`
- **Verification:** `npm run astro check` now runs; 16 pre-existing errors in `tests/build/`, `vitest.config.ts`, `dagger/src/index.ts` logged to `deferred-items.md` as out-of-scope for Phase 10
- **Committed in:** `105d2fe`

**2. [Stitch revision — visual feedback loop] Revised header styling after first visual review**
- **Found during:** Task 4 human-verify
- **Issue:** Three visual gaps vs. user expectations — nav links were muted grey not white; scroll divider invisible (`border-border` too subtle on deep purple bg); language toggle too prominent (chip style)
- **Fix:** (a) nav links now `text-white` with blue active underline only; (b) scroll state uses `border-white/15` + `shadow-[0_4px_12px_rgba(0,0,0,0.2)]`; (c) `LanguageToggle.astro` rewritten as text-only FR / EN with 40% opacity on the inactive locale, no background/border/pill. Design validated via Stitch screens before coding.
- **Files modified:** `src/components/Navigation.astro`, `src/components/LanguageToggle.astro`
- **Verification:** `npm run build` exits 0; Stitch screens approved (`906272514638449181edf54eaf927cff`, `435707227df84d4e81050e7fe803e7f4`, `d53079c0e8274d2090a3786ee8283e36`)
- **Committed in:** `b0949d0`

---

**Total deviations:** 2 auto-fixed (1 blocking dep, 1 visual revision loop)
**Impact on plan:** Both necessary — the dep unblocked the phase gate; the Stitch revision aligned the implementation with the user's approved design. No scope creep. `LanguageToggle.astro` modification was adjacent to the plan's files but necessary to honor the approved design.

## Issues Encountered

- Initial implementation followed `10-UI-SPEC.md` directly without a Stitch pass. User correctly flagged this breaks the Stitch-first rule. Memory (`feedback_stitch_first.md`) updated to make the rule absolute: every visible UI change must go through Stitch, including revision loops.
- First Stitch generation overrode design-system colors with a conflicting navy hex. User caught it; regenerated the screens using only design-system tokens. Memory (`feedback_stitch_ds_tokens.md`) added to prevent recurrence.

## User Setup Required

None.

## Next Phase Readiness

- Site-wide navigation is now the integration point for future phases (5 sponsors/team, 6 venue, 7 schedule). Dead links in `navItems` must be flipped to real paths as each owning phase lands.
- Photo assets delivered and optimized to `src/assets/photos/` (10 ambiance + 2 speakers) — ready for consumption by future gallery/speakers/venue/about pages via Astro `<Image>`. Not tied to Phase 10.
- Speakers list using real CND 2026 data (via OpenFeedback) is an open item — logged as a follow-up, needs phase assignment and the OpenFeedback URL.
- Pre-existing astro-check errors in `tests/`, `vitest.config.ts`, `dagger/` are tracked in `deferred-items.md` and should be resolved in a housekeeping phase (missing `@types/node`).

---
*Phase: 10-site-navigation-component-wiring*
*Completed: 2026-04-12*
