# Roadmap: Cloud Native Days France Website

## Overview

From design system approval through a fully deployed bilingual conference website. v1.0 (Phases 1-14) shipped the bilingual marketing site, programme, interactive schedule, and CFP/replay lifecycle. v1.1 (Phases 15-20) adds the "where we come from" story to the homepage: Stitch-designed past-edition sections (2026, 2023) with a lightbox-enabled photo gallery, a marquee-animated testimonials strip, a global accessibility baseline for motion, and a clean removal of the relocated 2026 block from the venue page.

## Milestones

- [x] **v1.0** — Cloud Native Days France 2027 site (bilingual marketing + programme + interactive schedule + CFP/replay lifecycle + SEO/legal). Shipped 2026-04-13. See [`milestones/v1.0-ROADMAP.md`](milestones/v1.0-ROADMAP.md).
- [ ] **v1.1** — Past Editions Showcase (Phases 15-20). In progress.

## Phases

**Phase Numbering:**
- Integer phases (1-14): v1.0 (shipped)
- Integer phases (15-20): v1.1 (current milestone)
- Decimal phases (e.g., 15.1): Urgent insertions (none yet)

<details>
<summary>Shipped v1.0 (Phases 1-14) - SHIPPED 2026-04-13</summary>

Full archive at [`milestones/v1.0-ROADMAP.md`](milestones/v1.0-ROADMAP.md).

</details>

### v1.1 Past Editions Showcase (In Progress)

**Milestone Goal:** Tell the "where we come from" story on the homepage with dedicated past-edition sections (2026, 2023), an animated testimonials strip, a global motion-reduction baseline, and a clean venue-page handoff.

- [x] **Phase 15: Stitch Full-Homepage Mock** - Design-gate: full-page mock of the new homepage (Hero -> KeyNumbers -> CFP -> 2026 -> 2023 -> Testimonials), validated by user, before any code (completed 2026-04-13)
- [x] **Phase 16: Foundation - Assets, i18n, A11y Baseline, Shared Shell** - Pre-optimize photos, add bilingual `editions.*`/`testimonials.*` keys, ship the global `prefers-reduced-motion` reset, and build the prop-driven `PastEditionSection.astro` shell (completed 2026-04-13)
- [x] **Phase 17: Integrate 2026 Edition Section on Homepage** - Render `Edition2026Section` on `/` and `/en/`, verify live in both locales (gates Phase 18) (completed 2026-04-13)
- [ ] **Phase 18: Venue Page Cleanup** - Remove the relocated 2026 block, orphaned imports/constants/assets, deprecated `venue.prev.*` keys, and audit/redirect old anchors (gated on Phase 17 verified live)
- [ ] **Phase 19: Integrate 2023 Edition Section + Lightbox** - 10-photo grid, KCD brand-history callout (with organizer sign-off), accessible lightbox overlay, placeholder stats with tracker
- [ ] **Phase 20: Animated Testimonials Strip** - Marquee testimonials with reduced-motion respect, pause-on-hover/focus, ARIA-hidden duplicated track, and clearly placeholder attributions

## Phase Details

### Phase 15: Stitch Full-Homepage Mock
**Goal**: User and implementer have a Stitch-approved, full-homepage visual contract that locks section order, spacing, brand-callout layout, marquee-vs-grid decision, and CFP placement before any code lands.
**Depends on**: v1.0 completion
**Requirements**: EDIT-06
**Success Criteria** (what must be TRUE):
  1. A single Stitch mock shows the full homepage (Hero -> KeyNumbers -> CFP -> 2026 -> 2023 -> Testimonials -> Footer) using only design-system tokens (no raw hex)
  2. CFP section's top edge sits within ~2 viewport heights on a 390x844 mobile mock
  3. 2026 and 2023 section variants are designed inside the same shared-shell rhythm (rail label, h2, stats, photos, optional video, optional brand callout)
  4. Testimonials strip layout (marquee direction, card style, pause affordance) is locked
  5. User has explicitly approved the mock and any open design questions are resolved
**Plans**: 4 plans
  - [x] 15-01-PLAN.md - Generate full-homepage Stitch mock (all 7 sections, DS tokens only) + user approval
  - [x] 15-02-PLAN.md - Generate 2026 vs 2023 variant detail screens within shared shell + user approval
  - [x] 15-03-PLAN.md - Generate testimonials marquee detail (direction, card, pause affordance) + user approval
  - [x] 15-04-PLAN.md - Update DESIGN.md with locked Homepage Layout Contract (D-01..D-12)
**UI hint**: yes

### Phase 16: Foundation - Assets, i18n, A11y Baseline, Shared Shell
**Goal**: All shared groundwork that downstream UI phases depend on is in place: pre-optimized photo + logo assets, bilingual i18n namespaces with parity tests, the global `prefers-reduced-motion` reset (so the first animated component cannot regress a11y), and the prop-driven `PastEditionSection.astro` shell rendered nowhere yet.
**Depends on**: Phase 15
**Requirements**: EDIT-04, A11Y-05, I18N-01, I18N-02
**Success Criteria** (what must be TRUE):
  1. `src/assets/photos/kcd2023/` contains 10 pre-optimized JPG masters, each <=1 MB and total <=7 MB; KCD 2023 logo is in `src/assets/logos/kcd2023/`
  2. `src/i18n/ui.ts` has `editions.*` and `testimonials.*` keys present in both FR and EN with identical key counts; a Vitest assertion enforces parity and rejects byte-identical FR/EN values
  3. `src/styles/global.css` contains a global `prefers-reduced-motion: reduce` reset that disables animations and transitions site-wide as the documented baseline
  4. `src/components/past-editions/PastEditionSection.astro` exists as a `.astro` file (no `client:*` directive) accepting props for rail label, heading, stats, photos, optional video, optional brand callout, and optional gallery CTA
  5. `pnpm build` and the Vitest suite pass with zero new warnings
**Plans**: 4 plans
  - [x] 16-01-PLAN.md — A11y motion reset + i18n editions/testimonials keys + parity test + KCD logo assets
  - [x] 16-02-PLAN.md — Photo optimization pipeline + 10 KCD 2023 masters (human-gated on user-supplied originals)
  - [x] 16-03-PLAN.md — PastEditionSection.astro shell + renders-nowhere Vitest safeguard
  - [x] 16-04-PLAN.md — Zero-new-warnings build+test baseline gate + VALIDATION.md sign-off
**UI hint**: yes

### Phase 17: Integrate 2026 Edition Section on Homepage
**Goal**: Visitors landing on `/` and `/en/` see the relocated 2026 edition section rendered through the shared shell with content placeholder-flagged and tracker-issue logged, while the legacy venue block remains intentionally in place to prevent any content-gap window.
**Depends on**: Phase 16
**Requirements**: EDIT-01, EDIT-06
**Success Criteria** (what must be TRUE):
  1. `/` (FR) and `/en/` (EN) both render an `Edition2026Section` between the CFP section and the 2023 section position, in the order Stitch approved (reverse-chronological with 2026 first)
  2. The section displays rail label, heading, video embed (youtube-nocookie), stats, photo thumbnails, and external gallery CTA, all driven by `editions.2026.*` keys in the visitor's locale
  3. Heading hierarchy on the homepage is correct (single `<h1>`, `<h2>` for the section, no skipped levels) and `scroll-margin-top` lets `/#edition-2026` deep links land cleanly under the sticky nav
  4. Placeholder 2026 content is flagged in `editions-data.ts` (`placeholder: true`) with a visible dev/staging badge and a linked `2026-recap-final-content` tracker issue
  5. The legacy `venue/index.astro` 2026 block is still present and unchanged at this phase exit (cleanup deferred to Phase 18)
**Plans**: 3 plans
  - [x] 17-01-PLAN.md — Shell Props extension (id?, trackerUrl?) + placeholder-badge anchor + D-14 i18n keys + :target scroll-margin CSS
  - [x] 17-02-PLAN.md — Create src/lib/editions-data.ts + refactor venue/index.astro (byte-identical render) + editions-data Vitest
  - [x] 17-03-PLAN.md — Mount <PastEditionSection> on / and /en/ + 3 D-15 build tests (2026-section, heading-hierarchy, venue-unchanged) + VALIDATION.md
**UI hint**: yes

### Phase 18: Venue Page Cleanup
**Goal**: With homepage 2026 verified live in both locales, the venue page is stripped of the relocated block in three surgical, separately-revertable commits: section deletion + orphaned-symbol cleanup, then i18n-key sweep, with old anchors audited and redirected so no inbound link breaks.
**Depends on**: Phase 17
**Requirements**: VENUE-01, VENUE-02, VENUE-03, VENUE-04
**Success Criteria** (what must be TRUE):
  1. The "Previous edition 2026" block in `src/pages/venue/index.astro` is removed in a separate commit from any homepage change
  2. `grep -n "ambiance03\|ambiance06\|ambiance10\|YOUTUBE_ID\|GALLERY_URL\|previousStats\|thumbnails" src/pages/venue/index.astro` returns zero hits and `pnpm exec tsc --noEmit` passes
  3. `grep -rn "venue\.prev" src/` returns zero hits after the i18n sweep commit
  4. References to the old `#previous-edition` anchor are either redirected to `/#edition-2026` (server-side or in-page) or audited and confirmed absent across `src/`, footer, header, and mobile nav
  5. `pnpm build` succeeds with no orphaned `dist/` assets and no broken `t()` calls
**Plans**: TBD

### Phase 19: Integrate 2023 Edition Section + Lightbox
**Goal**: Visitors see a fully-rendered 2023 KCD France edition on `/` and `/en/` -- 10-photo responsive grid, KCD brand-history callout, Centre Georges Pompidou venue mention, organizer-signed brand wording, placeholder stats with tracker -- and can click any photo to open a keyboard-accessible lightbox.
**Depends on**: Phase 16 (shell + assets + i18n + a11y reset). Phase 17 (for placement context). Parallelizable with Phase 18 and Phase 20 once Phase 16 lands.
**Requirements**: EDIT-02, EDIT-03, EDIT-05, EDIT-07, A11Y-03, A11Y-04, I18N-03
**Success Criteria** (what must be TRUE):
  1. `/` (FR) and `/en/` (EN) both render an `Edition2023Section` after the 2026 section with rail label, h2, 10-photo `astro:assets` `<Picture>` grid (AVIF/WebP/JPG, capped widths, dimension-reserved tiles, CLS delta <=0.02 vs v1.0 baseline), and external gallery CTA
  2. The KCD brand-history callout displays the KCD 2023 logo, the "originally named Kubernetes Community Days France" note, and the Centre Georges Pompidou venue mention; FR + EN wording has documented organizer sign-off in `.planning/milestones/v1.1-*`
  3. Clicking any 2023 photo opens a lightbox overlay with `role="dialog"` + `aria-label`, focus trapped while open, Escape closes, Arrow keys navigate, Tab cycles within, and focus returns to the originating thumbnail on close
  4. Every 2023 photo and the KCD logo carry unique descriptive `alt` text in FR and EN (sourced from `editions-data.ts`, no "photo 1 / photo 2" patterns)
  5. Placeholder 2023 stats and gallery URL are flagged in `editions-data.ts` (`placeholder: true`) and a tracker issue exists in the repo
**Plans**: TBD
**UI hint**: yes

### Phase 20: Animated Testimonials Strip
**Goal**: Visitors see a marquee-animated testimonials strip on `/` and `/en/` rendering 3 clearly-placeholder FR quotes, with WCAG-2.2.2-compliant motion handling (reduced-motion respected, pause on hover and focus, duplicated track hidden from assistive tech) so no a11y regression ships.
**Depends on**: Phase 16 (a11y reset + i18n keys + shell pattern). Parallelizable with Phase 18 and Phase 19.
**Requirements**: TEST-01, TEST-02, TEST-03, A11Y-01, A11Y-02
**Success Criteria** (what must be TRUE):
  1. `/` and `/en/` both render a testimonials strip displaying the 3 placeholder FR quotes from `src/components/testimonials/testimonials-data.ts`
  2. The strip animates as a duplicated-track infinite horizontal marquee, pauses on `:hover` and `:focus-within`, and a Playwright test under `emulateMedia({ reducedMotion: 'reduce' })` asserts computed `animation` resolves to `none`
  3. The duplicated track has `aria-hidden="true"` and all focusable descendants inside it have `tabindex="-1"`; tabbing through the homepage focuses each quote at most once
  4. `testimonials-data.ts` attributions are clearly non-real (no fabricated full names or company domains); a `testimonials-real-quotes` tracker issue is referenced in the file's header comment
  5. Homepage JS bundle delta vs Phase 19 baseline is zero (component ships as `.astro` + CSS) OR documented justification exists for an island
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 15 -> 16 -> 17 -> 18 (and in parallel: 19, 20 after 16) -> milestone exit.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-14 (archived) | v1.0 | 33/33 | Shipped | 2026-04-13 |
| 15. Stitch Full-Homepage Mock | v1.1 | 4/4 | Complete   | 2026-04-13 |
| 16. Foundation - Assets, i18n, A11y Baseline, Shared Shell | v1.1 | 4/4 | Complete   | 2026-04-13 |
| 17. Integrate 2026 Edition Section on Homepage | v1.1 | 3/3 | Complete   | 2026-04-13 |
| 18. Venue Page Cleanup | v1.1 | 0/TBD | Not started | - |
| 19. Integrate 2023 Edition Section + Lightbox | v1.1 | 0/TBD | Not started | - |
| 20. Animated Testimonials Strip | v1.1 | 0/TBD | Not started | - |
