# Roadmap: Cloud Native Days France — Website

## Milestones

- ✅ **v1.0 MVP** - Phases 1-14 (shipped 2026-04-13)
- ✅ **v1.1 Past Editions Showcase** - Phases 15-22 (shipped 2026-04-14)
- 🚧 **v1.2 Homepage Restructuring** - Phases 23-26 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-14) - SHIPPED 2026-04-13</summary>

See [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md) for full phase details.

</details>

<details>
<summary>✅ v1.1 Past Editions Showcase (Phases 15-22) - SHIPPED 2026-04-14</summary>

See [milestones/v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md) for full phase details.

</details>

### 🚧 v1.2 Homepage Restructuring (In Progress)

**Milestone Goal:** Restructure the homepage layout per validated Stitch mockup -- merge 2026 film+testimonials, add newsletter CTA, add sponsors platinum section, simplify 2023 bloc.

- [x] **Phase 23: Edition 2026 Combined Section** - New component merging photos, film, replays link, PDF link, and testimonials into one section [completed 2026-04-18]
- [ ] **Phase 24: Sponsors Platinum & Edition 2023** - Platinum sponsor logo strip and simplified 2023 mini-bloc
- [ ] **Phase 25: Hero Redesign** - New background image, adjusted opacity, and 3-CTA layout
- [ ] **Phase 26: Homepage Wiring** - Atomic section reorder across both locale homepages with accessibility check

## Phase Details

### Phase 23: Edition 2026 Combined Section
**Goal**: Visitors see a single, rich 2026 recap section with photos, embedded film, replay link, PDF download, and testimonial cards
**Depends on**: Nothing (first phase of v1.2)
**Requirements**: ED26-01, ED26-02, ED26-03
**Success Criteria** (what must be TRUE):
  1. Homepage displays a combined 2026 section with 3 photos and the embedded conference film
  2. Section includes a "Voir tous les replays" link pointing to the replays page/playlist
  3. Section includes a "Telecharger le bilan 2026 (PDF)" link that opens the one-pager PDF
  4. Testimonial cards render within the same section (replacing the old separate TestimonialsStrip)
**Plans**: 2 plans
  - [x] 23-01-data-and-i18n-PLAN.md — Mutate EDITION_2026 (3 thumbnails, replaysUrl, pdfUrl; drop ambiance-08) and add 4 new editions.2026.* i18n keys to fr+en (D-04..D-08) [completed 2026-04-18]
  - [x] 23-02-component-PLAN.md — Create src/components/past-editions/Edition2026Combined.astro with 6-block anatomy (rail, h2, mosaic, video, CTA row, testimonials) per UI-SPEC (D-01..D-03, D-11..D-14) [completed 2026-04-18]
**UI hint**: yes

### Phase 24: Sponsors Platinum & Edition 2023
**Goal**: Homepage shows Platinum sponsor logos and the 2023 edition bloc is reduced to a minimal logo-and-link format
**Depends on**: Phase 23
**Requirements**: SPON-01, ED23-01
**Success Criteria** (what must be TRUE):
  1. Homepage displays a Sponsors Platinum section showing logos of all Platinum-tier sponsors
  2. Sponsors section includes a "Voir tous les sponsors" link navigating to the /sponsors page
  3. The 2023 bloc shows only the KCD logo and a text link to /2023 (no photo grid)
  4. Sponsors section gracefully hides when no Platinum sponsors exist in the data
**Plans**: TBD
**UI hint**: yes

### Phase 25: Hero Redesign
**Goal**: Hero section uses the new background image at higher opacity and presents three distinct CTAs
**Depends on**: Phase 23
**Requirements**: HERO-01, HERO-02
**Success Criteria** (what must be TRUE):
  1. Hero background displays the user-provided image at approximately 75% opacity
  2. Hero shows 3 CTAs in a row: "Reservez votre place" (Primary Blue filled), "Voir le programme" (Blue outline), "Restez informe" (Accent Pink ghost with mail icon)
  3. The "Restez informe" CTA functions as a placeholder anchor (no backend integration required)
  4. CTA row is responsive and stacks gracefully on mobile viewports
**Plans**: TBD
**UI hint**: yes

### Phase 26: Homepage Wiring
**Goal**: Both FR and EN homepages display sections in the validated order and pass accessibility checks
**Depends on**: Phase 23, Phase 24, Phase 25
**Requirements**: LAYO-01, BRND-01
**Success Criteria** (what must be TRUE):
  1. Both /fr and /en homepages render sections in order: Hero, Key Numbers, Edition 2026, Mini-bloc 2023, CFP, Sponsors Platinum
  2. Old separate PastEditionSection and TestimonialsStrip imports are removed from homepage files
  3. WCAG AA contrast is maintained on the hero section with the new background and opacity
  4. Build completes with zero errors and no orphaned component imports
  5. Favicon displays the French flag
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 23 → 24 → 25 → 26

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 23. Edition 2026 Combined Section | v1.2 | 1/2 | In progress | - |
| 24. Sponsors Platinum & Edition 2023 | v1.2 | 0/? | Not started | - |
| 25. Hero Redesign | v1.2 | 0/? | Not started | - |
| 26. Homepage Wiring | v1.2 | 0/? | Not started | - |
