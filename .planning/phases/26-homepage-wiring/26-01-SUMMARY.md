---
phase: 26-homepage-wiring
plan: 01
subsystem: ui
tags: [astro, homepage, i18n, sponsors, content-collections]

requires:
  - phase: 23-edition-2026-combined
    provides: Edition2026Combined.astro component (zero-prop, self-resolving from EDITION_2026 + i18n)
  - phase: 24-sponsors-platinum-edition-2023
    provides: SponsorsPlatinumStrip.astro (data-agnostic, lang-aware) + Edition2023Link.astro (caller-resolves)
  - phase: 25-hero-redesign
    provides: HeroSection.astro live on both homepages
provides:
  - Both /fr and /en homepages render the v1.2 section order: Hero -> KeyNumbers -> Edition2026Combined -> Edition2023Link -> CFP -> SponsorsPlatinumStrip
  - Page-boundary sponsor CSV filter (CSV-as-source-of-truth per CLAUDE.md)
  - 2 of 11 pre-existing astro-check baseline errors eliminated (orphan editions.*.gallery_cta references gone)
affects: [26-02-favicon-swap, 26-03-orphan-cleanup]

tech-stack:
  added: []
  patterns:
    - "Page-boundary CSV filter: getCollection + .filter at the page level, never inside reusable components"
    - "FR/EN twin-file parity: identical structure, only Layout import depth + locale-aware hrefs differ"

key-files:
  created: []
  modified:
    - src/pages/index.astro
    - src/pages/en/index.astro

key-decisions:
  - "Edition2026Combined mounted with zero props — component resolves its own data/i18n defaults (idiomatic homepage usage per Phase 23 contract)"
  - "Sponsor data loaded at page boundary via getCollection(\"sponsors\") + .filter((s) => s.data.tier === \"platinum\") — keeps CSV-as-source-of-truth rule enforced where data crosses into UI"
  - "Locale-aware hrefs hardcoded as literals (/2023 in FR file, /en/2023 in EN file) — no lang ternaries in JSX; matches the file-boundary discipline"
  - "Belt-and-braces SponsorsPlatinumStrip empty-state guard: caller wraps with {platinumSponsors.length > 0 && ...} even though component has its own guard (intentional redundancy per Phase 24)"

patterns-established:
  - "Atomic two-file homepage rewrites: FR + EN twins, diff must equal exactly 2 hunks (Layout depth + viewPageHref locale)"

requirements-completed: [LAYO-01]

duration: 6min
completed: 2026-04-18
---

# Phase 26 Plan 01: Homepage Rewrite Summary

**Both FR and EN homepages atomically rewired to v1.2 section order with Edition2026Combined, Edition2023Link, and SponsorsPlatinumStrip mounted; sponsors filtered at page boundary; orphan editions.*.gallery_cta references eliminated.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-04-18T08:32:00Z
- **Completed:** 2026-04-18T08:34:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Both homepages now render the validated Stitch v1.2 section order: Hero -> KeyNumbers -> Edition2026Combined -> Edition2023Link -> CFP -> SponsorsPlatinumStrip (CFP moved DOWN, was after KeyNumbers)
- Three Phase 23/24 components (Edition2026Combined, Edition2023Link, SponsorsPlatinumStrip) mounted live for the first time
- PastEditionSection / PastEditionMinimal / TestimonialsStrip imports fully removed from both homepage files (orphan files themselves are deleted in Plan 26-03)
- Sponsor CSV-as-source-of-truth invariant enforced at the page boundary via getCollection + lowercase tier filter
- Pre-existing astro-check baseline reduced from 11 to 9 errors (the 2 orphan editions.*.gallery_cta references are gone)

## Task Commits

1. **Task 1: Rewrite src/pages/index.astro (FR)** - `92f440c` (feat)
2. **Task 2: Rewrite src/pages/en/index.astro (EN)** - `c92ecb8` (feat)

## Files Created/Modified

- `src/pages/index.astro` - FR homepage rewired to v1.2 layout, sponsor page-boundary filter, /2023 hardcoded
- `src/pages/en/index.astro` - EN homepage twin of FR, only Layout depth + viewPageHref="/en/2023" differ

## Verification Results

### Astro check baseline delta

- **Before:** 11 errors (per STATE.md baseline)
- **After:** 9 errors
- **Delta:** -2 (the orphan `editions.2026.gallery_cta` and `editions.2023.gallery_cta` references in both homepage files are gone)
- **Orphan-key check:** `bun run astro check 2>&1 | grep -c 'editions\.2026\.gallery_cta\|editions\.2023\.gallery_cta'` returns 0

### FR/EN structural parity proof

```
$ diff src/pages/index.astro src/pages/en/index.astro
2c2
< import Layout from "../layouts/Layout.astro";
---
> import Layout from "../../layouts/Layout.astro";
43c43
<       viewPageHref="/2023"
---
>       viewPageHref="/en/2023"
```

Exactly 2 hunks. FR/EN parity invariant satisfied.

### Grep matrix (both files)

| Check | FR | EN |
|-------|----|----|
| `PastEditionSection` count | 0 | 0 |
| `PastEditionMinimal` count | 0 | 0 |
| `TestimonialsStrip` count | 0 | 0 |
| `Edition2026Combined` count >= 2 | PASS | PASS |
| `Edition2023Link` count >= 2 | PASS | PASS |
| `SponsorsPlatinumStrip` count >= 2 | PASS | PASS |
| `editions.2026.gallery_cta` count | 0 | 0 |
| `editions.2023.gallery_cta` count | 0 | 0 |
| `getCollection("sponsors")` count | 1 | 1 |
| `s.data.tier === "platinum"` count | 1 | 1 |
| `viewPageHref="/2023"` (FR) / `viewPageHref="/en/2023"` (EN) | 1 | 1 |
| Section order awk assertion (e26<e23<cfp<spp) | PASS | PASS |

### Build

- `bun run build` exits 0
- 156 pages built (no regression)

## Decisions Made

None beyond what the plan specified — the plan's canonical caller snippets were used verbatim. All 4 key decisions in the frontmatter were inherited from upstream Phase 23/24 contracts.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Plan Readiness

- **Plan 26-02 (favicon swap):** Independent of this plan, can run in parallel (was wave 1 alongside 26-01).
- **Plan 26-03 (orphan cleanup):** UNBLOCKED. The three to-be-deleted component files (`PastEditionSection.astro`, `PastEditionMinimal.astro`, `TestimonialsStrip.astro`) are now confirmed orphaned at the homepage layer. Plan 26-03 should re-run `grep -rl` across `src/` to verify zero remaining importers project-wide before deleting.

## Self-Check: PASSED

- Files exist: `src/pages/index.astro` FOUND, `src/pages/en/index.astro` FOUND
- Commits exist: `92f440c` FOUND, `c92ecb8` FOUND
- Astro check delta verified: 11 -> 9 errors
- Build verified: 156 pages

---
*Phase: 26-homepage-wiring*
*Completed: 2026-04-18*
