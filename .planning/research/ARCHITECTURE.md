# Architecture Integration — v1.1 Past Editions Showcase

**Researched:** 2026-04-13
**Milestone:** v1.1 (brownfield, adding to shipped v1.0)
**Confidence:** HIGH (verified against actual files)

## Executive Summary

The codebase follows a **domain-grouped component folder convention** (`src/components/{domain}/`), with Astro components for static content and React islands only for interactive UI. i18n uses a **flat-key dotted namespace** in `src/i18n/ui.ts` (FR + EN), consumed via `t("namespace.key")` on both `/` (FR) and `/en/` (EN) pages. Both locale homepages are **structurally identical** — any new homepage component will Just Work bilingually as long as it uses `t()` internally.

The 2026 recap block is already a self-contained section (`src/pages/venue/index.astro` lines 216–283) using `t("venue.prev.*")` keys and 3 `ambiance-*.jpg` images. It is **cleanly extractable**.

2026 and 2023 share the same shape, so **a shared `PastEditionSection.astro` is worth extracting**. No React island is needed for either past-edition section; the animated testimonials strip warrants `client:visible`.

## Recommended Component Layout

New domain folder: **`src/components/past-editions/`**

| File | Type | Purpose |
|---|---|---|
| `past-editions/PastEditionSection.astro` | Astro | Shared shell: rail label, heading, description, stats, photo grid, optional video, optional CTA, optional brand logo + note |
| `past-editions/Edition2026Section.astro` | Astro | Thin wrapper passing 2026 props |
| `past-editions/Edition2023Section.astro` | Astro | Thin wrapper for 2023 |
| `testimonials/TestimonialsStrip.tsx` | React island | Animated strip with `client:visible` |
| `testimonials/testimonials-data.ts` | TS | Inline hardcoded quote array |

## 2026 Block Extraction — Refactor Steps

Current block deps in `src/pages/venue/index.astro`: imports lines 5–7, constants 24–26, arrays 63–73, section 216–283, keys `venue.prev.*`.

Order (minimizes regression):
1. Build `PastEditionSection.astro` with props API.
2. Add `editions.2026.*` keys alongside old `venue.prev.*`.
3. Create `Edition2026Section.astro`, render on both homepages, verify FR + EN.
4. Delete 2026 block from venue page (imports, constants, arrays, section).
5. Clean up old `venue.prev.*` keys.

Doing step 3 before step 4 means both blocks coexist for one commit — zero "block disappeared" regression risk.

## Bilingual Copy Strategy

Extend `src/i18n/ui.ts` with `editions.*` namespace. Matches flat-key convention; FR fallback built into `useTranslations`.

```
editions.rail_label
editions.2026.rail_label | heading | video_title | stats.{participants,talks,partners} | thumb_alt | gallery_link
editions.2023.rail_label | heading | brand_note | venue | history_blurb | thumb_alt | brand_logo_alt
testimonials.rail_label | heading
```

Testimonial quotes stay inline in `testimonials-data.ts` (3 FR placeholders) per milestone scope.

## Asset Placement

- 10 photos → `src/assets/photos/kcd2023/kcd2023-01.jpg` … `kcd2023-10.jpg`
- KCD 2023 logo → `src/assets/logos/kcd2023/logo.png` (or `.svg`)

**Hard gate:** pre-optimize (1920px @ Q80, ~200 KB each, ~2 MB total) before commit. 21 MB raw not acceptable.

## Testimonials Island Decision

React island with `client:visible`. Matches `KeyNumbers`/`CountdownTimer` pattern. Pure-CSS marquee viable if Stitch mandates zero-JS — decide at design time.

## Homepage Integration — Final Shape

```astro
<Layout ...>
  <main>
    <HeroSection />
    <KeyNumbers client:idle lang={lang} />
    <CfpSection />
    <Edition2026Section />
    <Edition2023Section />
    <TestimonialsStrip client:visible lang={lang} />
  </main>
</Layout>
```

Final order decided in Stitch.

## Phase Sequencing

| # | Phase | Unblocks | Blocked by |
|---|---|---|---|
| 0 | Stitch designs: 2026, 2023, testimonials, cleaned venue | 1, 2, 4, 6, 8 | — |
| 1 | Asset prep — pre-optimize photos + logo | 6 | 0 |
| 2 | Build `PastEditionSection.astro` | 4, 6 | 0 |
| 3 | Add i18n `editions.*` keys (alongside `venue.prev.*`) | 4, 6 | — |
| 4 | Build + integrate `Edition2026Section.astro` (FR + EN) | 5 | 2, 3 |
| 5 | Remove 2026 block from venue page | 7 | 4 |
| 6 | Build + integrate `Edition2023Section.astro` | — | 1, 2, 3 |
| 7 | Delete `venue.prev.*` keys, bilingual pass on /venue | — | 5 |
| 8 | Build + integrate `TestimonialsStrip.tsx` | — | 0 |

**Critical path:** 0 → 2 → 4 → 5. Phases 6 and 8 parallelize after 2 lands.
**Highest regression risk:** Phase 5 (venue deletion). Separate commit for surgical `git revert`.

## Files Summary

**New:** `PastEditionSection.astro`, `Edition2026Section.astro`, `Edition2023Section.astro`, `TestimonialsStrip.tsx`, `testimonials-data.ts`, 10 `kcd2023-*.jpg`, KCD 2023 logo.
**Modified:** `src/pages/index.astro`, `src/pages/en/index.astro`, `src/pages/venue/index.astro`, `src/i18n/ui.ts`.
**Unchanged:** `src/content/`, `src/lib/`, `src/layouts/`, `astro.config.mjs`, CSV loaders.
