---
phase: 21-documentation-backfill-and-discovery-loop
plan: 02
milestone: v1.1
wave: 2
depends_on: ["21-01"]
requirements: [EDIT-02]
status: complete
completed: 2026-04-14
duration_minutes: ~15
commits:
  - hash: 14068e5
    subject: "feat(21-02): wire homepage 2023 minimal block to /2023 + i18n cta key"
files_modified:
  - src/i18n/ui.ts
  - src/components/past-editions/PastEditionMinimal.astro
  - src/pages/index.astro
  - src/pages/en/index.astro
  - tests/build/homepage-2026-section.test.ts
decisions:
  - "Single atomic commit per D-09 (not per-task) — doc-style grouping since all 5 files are one feature"
  - "New i18n key `editions.2023.view_page_cta` (D-08) — semantically distinct from `video_cta` (internal page vs external playlist)"
  - "Component stays generic (D-06) — zero `/2023` or `/en/2023` literals inside `PastEditionMinimal.astro`; href supplied via `viewPageHref` prop"
  - "Test extends existing `homepage-2026-section.test.ts` (D-07) rather than a new file — keeps 2023-block assertions co-located"
tags: [discovery-loop, homepage, i18n, past-editions, audit-closeout]
---

# Phase 21 Plan 02: Discovery-Loop CTA Summary

Closed v1.1-MILESTONE-AUDIT §3.2 gap by wiring the homepage 2023 minimal block to the dedicated `/2023` and `/en/2023` pages via a new "View 2023 edition →" CTA rendered alongside the existing YouTube playlist link. The `PastEditionMinimal.astro` component gained two optional props (`viewPageHref` + `viewPageLabel`) so the component stays generic — no edition-specific strings hardcoded inside the shell.

## What Shipped

- **i18n key pair** added to `src/i18n/ui.ts` (same commit, byte-distinct — I18N-01 compliant):
  - FR: `"editions.2023.view_page_cta": "Voir l'édition 2023 →"`
  - EN: `"editions.2023.view_page_cta": "View the 2023 edition →"`
- **`PastEditionMinimal.astro`** extended with two optional props (`viewPageHref?`, `viewPageLabel?`). Row 3 now renders a flex container holding the existing external playlist link plus a conditional internal `<a>` for the edition page. The internal link is SPA-style (no `target="_blank"`, no `rel="noopener"`) — deliberately distinct from the external playlist link.
- **Mount wiring**:
  - `src/pages/index.astro` → `viewPageHref: "/2023"`
  - `src/pages/en/index.astro` → `viewPageHref: "/en/2023"`
  - Labels sourced from `t("editions.2023.view_page_cta")` on both pages.
- **Test coverage** — 6 new assertions (3 × 2 locales) appended inside the existing `EDIT-07 / 17-04: 2023 simplified minimal block` describe:
  1. Locale-correct href present (`/2023` on FR, `/en/2023` on EN)
  2. Inverse-parity guard (FR section has no `/en/2023` link; EN section has no `/2023` link)
  3. Localized copy present (`Voir l'édition 2023` on FR, `View the 2023 edition` on EN) — regex tolerates straight apostrophe, curly apostrophe, and HTML-encoded `&#39;` / `&rsquo;` variants

## Component Genericity Check (D-06)

```bash
$ grep -cE '"/2023"|/en/2023' src/components/past-editions/PastEditionMinimal.astro
0
```

Zero hardcoded edition-year strings inside the component. The only literal `/2023` references in the plan's scope live in the mount sites (`src/pages/index.astro`, `src/pages/en/index.astro`) — where they belong.

## i18n Key Rationale (D-08)

The existing `editions.2023.video_cta` ("Voir la playlist YouTube 2023" / "Watch the 2023 YouTube playlist") is semantically wrong for this CTA — it calls out the external YouTube playlist. The new `view_page_cta` signals "navigate to the internal archive page" with its own copy and its own `→` glyph. Reusing `video_cta` would have been misleading once the two links sit side-by-side in Row 3.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test regex did not tolerate HTML-encoded apostrophe**
- **Found during:** Task 4 verification (vitest run)
- **Issue:** Astro renders `Voir l'édition` as `Voir l&#39;édition` in dist HTML. The plan-proposed regex `/Voir l['’]édition 2023/` missed the encoded form and the one FR test failed.
- **Fix:** Widened the FR regex to `/Voir l(?:['’]|&#39;|&rsquo;)édition 2023/` — tolerates straight, curly, or HTML-encoded apostrophe.
- **Files modified:** `tests/build/homepage-2026-section.test.ts`
- **Committed in:** 14068e5 (same atomic commit per D-09)

**2. [Rule 2 - Doc safety] Removed `/2023` reference from JSDoc on component prop**
- **Found during:** Task 2 verification grep
- **Issue:** Initial JSDoc wrote "e.g. /2023" which, while a comment, would have tripped future grep-audits hunting for hardcoded routes.
- **Fix:** Rephrased to "internal link to the dedicated edition page" (no year, no route).
- **Files modified:** `src/components/past-editions/PastEditionMinimal.astro`
- **Committed in:** 14068e5

## Verification

| Check | Result |
|-------|--------|
| `pnpm build` | Green — 156 pages (unchanged from 21-01 baseline) |
| `pnpm exec vitest run tests/build/homepage-2026-section.test.ts` | 18/18 passing (was 12; added 6) |
| `pnpm exec vitest run tests/build/i18n-parity.test.ts` | Green (new key has FR+EN entries, byte-distinct) |
| Component genericity grep | 0 hits — D-06 satisfied |
| Full suite `pnpm exec vitest run` | 188/193 passing — only pre-existing SPKR-01 carry-over failures (5 tests, unchanged from 21-01 baseline) |

## Test Assertion Deltas

Added inside `describe("EDIT-07 / 17-04: 2023 simplified minimal block", …)`, after the existing "2023 block renders playlist link to YouTube 2023 playlist" assertion:

1. `2023 block links to the dedicated /2023 page with a locale-correct href`
2. `2023 block view-page link does not leak the wrong locale (parity guard)`
3. `2023 block view-page link uses the localized CTA copy`

Each runs twice (FR + EN via the `pages` driver), for 6 total new it-blocks.

## Handoff

Phase 21 is complete:
- 21-01 (documentation backfill) — shipped via commits 0805274, ba38fbb, 512de96, 8762575, 2ee9711
- 21-02 (discovery-loop CTA) — shipped via commit 14068e5

Next:
1. `/gsd-verify-work 21` — confirm audit closure
2. `/gsd-plan-phase 22` — A11y UAT closeout (lightbox keyboard journey, Stitch approval for `/2023`, Lighthouse CLS, Playwright reduced-motion decision)

## Self-Check: PASSED

- `src/i18n/ui.ts` contains both FR and EN entries for `editions.2023.view_page_cta` — verified via grep (count = 2).
- `src/components/past-editions/PastEditionMinimal.astro` contains `viewPageHref` + `viewPageLabel` props, zero `/2023` literals — verified.
- `src/pages/index.astro` contains `viewPageHref: "/2023"` — verified.
- `src/pages/en/index.astro` contains `viewPageHref: "/en/2023"` — verified.
- `tests/build/homepage-2026-section.test.ts` contains 3 new it-blocks (EDIT-02 discovery-loop) — verified.
- Commit `14068e5` present in `git log` — verified.
- `pnpm build` succeeds with 156 pages — verified.
- All 34 tests in `homepage-2026-section.test.ts` + `i18n-parity.test.ts` pass — verified.
