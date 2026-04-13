---
phase: 17-integrate-2026-edition-section-on-homepage
plan: 03
completed: 2026-04-14
status: complete
---

# 17-03 Summary — Homepage Mount (2026 + 2023) + Shell Refinements

## Commits

| Commit | Scope |
|--------|-------|
| `98253c4` | Initial 2026-only mount on `/` and `/en/` |
| `09b756a` | Scope expansion: both 2026 + 2023 mounted, shell grid refinements, Hero h1, 3 new Vitest files |
| `a787b82` | Grid refinement: 2026 swap ambiance05→08 for variety, 2023 uniform 3×2 medium grid |

## What Shipped

### Homepage composition (both `/` and `/en/`)

`<HeroSection>` → `<KeyNumbers>` → `<CfpSection>` → `<PastEditionSection>` (2026) → `<PastEditionSection>` (2023)

### 2026 section (real content, ported from legacy venue block)

- Rail: "EDITION 2026" rotated
- h2: `editions.2026.heading` i18n key
- Stats: 1700+ / 50+ / 40+ (3-up)
- Photos: 4 ambiance tiles (`ambiance-03/08/06/10`) in 2×2 grid (size `hero`)
- Video: youtube-nocookie embed `qyMGuU2-w8o`, compact (`max-w-2xl`)
- Gallery CTA: Ente album link (same as legacy venue)
- `id="edition-2026"` anchor, `placeholder: false` (real recap content)

### 2023 section (real KCD France 2023 content)

- Rail: "EDITION 2023" rotated
- h2: `editions.2023.heading` i18n key
- Stats: 1700+ / 42 / 24 (3-up)
- Photos: 6 KCD 2023 masters (`01, 03, 05, 07, 08, 10`) in uniform 3×2 grid (size `medium`)
- Video: playlist embed (`videoseries?list=PLmZ3gFl2Aqt_Qo4EAITE1ewy1ww5jkU2h`) + "Watch all 2023 sessions" CTA
- Brand callout: KCD France 2023 logo + `editions.2023.brand_note` copy
- `id="edition-2023"` anchor, `placeholder: false`

### Shell refinements (during this plan)

- Extended `PastEditionSection.astro` photo grid with `[grid-auto-rows:12rem] md:[grid-auto-rows:14rem]` — forces uniform tile heights regardless of image aspect ratio
- Tightened video frame to `max-w-2xl mx-auto` — smaller, centered embed (per user review)
- Constrained brand-callout logo to `w-32 md:w-40` + mobile-centered alignment

### Hero heading (SC3 fix)

- Added visually-hidden `<h1 class="sr-only">{t("hero.title")}</h1>` to `HeroSection.astro` — gives homepage a single valid `<h1>` without altering the existing visual hero

### New Vitest files

| File | Coverage |
|------|----------|
| `tests/build/homepage-2026-section.test.ts` | Both pages contain `#edition-2026` anchor, youtube-nocookie video, 2023 playlist embed, CFP → 2026 → 2023 ordering, main-landmark containment (10 tests) |
| `tests/build/homepage-heading-hierarchy.test.ts` | Both pages have exactly one `<h1>`, no skipped heading levels (4 tests) |
| `tests/build/venue-block-unchanged.test.ts` | Legacy venue 2026 block still renders YouTube iframe, 3 stat tiles, gallery CTA, rail label (4 tests) |

## Deviations from 17-CONTEXT.md

Mid-execution user feedback forced three decision revisions:

1. **D-02 + D-03 scope expansion:** Originally Phase 17 was to mount 2026 only; Phase 19 would add 2023. User directed both sections to land together so the homepage shows Edition 2026 followed by Edition 2023, each with its own content. `EDITION_2023` data module (originally stub per D-03) was filled with real content in this plan.
2. **D-05 reversal:** Originally 2026 was to reuse 3 KCD 2023 photos as placeholders under a PLACEHOLDER badge. User clarified the ambiance photos from the legacy venue block ARE real 2026 content. Flipped `EDITION_2026.placeholder` to `false`, swapped the 3 kcd2023 masters for 4 ambiance photos, removed the PLACEHOLDER badge + `trackerUrl` wiring on the 2026 mount.
3. **D-04 (tracker issue #3) deferred:** With 2026 no longer flagged as placeholder, the tracker-URL surface disappears from the UI. Issue #3 remains open on GitHub as a placeholder for a future "real 2026 recap assets arrive and we want to swap" event — not wired to the UI in this phase.

Grid layout iterated twice:
- First pass: `2 hero + 3 medium + 5 small` per Phase 15 D-04 → messy at narrow viewports
- Second pass: `2 hero + 2 medium + 2 small` 6-photo subset → still uneven (col-span gaps left empty cells)
- Final (approved): `6 medium` uniform 3×2 grid for 2023, `4 hero` uniform 2×2 for 2026

## Verification

- `pnpm build` → 154 pages, 0 errors, 0 new warnings (pre-existing `src/content.config.ts` Zod13 carry-over unchanged)
- Phase-16 + Phase-17 Vitest suites: **47/47 passing** across 8 files:
  - `i18n-parity.test.ts` · `editions-data.test.ts` · `past-edition-shell.test.ts` · `a11y-motion-reset.test.ts` · `kcd2023-assets.test.ts` · `homepage-2026-section.test.ts` · `homepage-heading-hierarchy.test.ts` · `venue-block-unchanged.test.ts`
- `pnpm exec astro check` → no new errors in past-editions / homepage files
- User visual approval 2026-04-14 after grid refinement (commit `a787b82`)

## Downstream Impact

- **Phase 18 (venue block deletion):** Ready to proceed. `editions-data.ts` is the single source for 2026 content; venue/index.astro still imports from it — Phase 18 deletes the venue's previous-edition `<section>` (lines 216-300) and the deprecated `thumbnails` constants. Byte-identical test (`venue-block-unchanged.test.ts`) must be deleted/repurposed in Phase 18 since the block goes away.
- **Phase 19 (2023 lightbox):** Originally the 2023 mount was scheduled here. Mount already lands in 17-03; Phase 19 now adds only the lightbox overlay on tile clicks + the full 10-photo gallery page.
- **Phase 20 (Testimonials marquee):** Mounts after 2023 in the homepage composition; unblocked.
