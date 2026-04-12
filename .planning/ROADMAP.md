# Roadmap: Cloud Native Days France Website

## Overview

From design system approval through a fully deployed bilingual conference website. Phase 1 is a formal design gate where visual identity is agreed upon in Google Stitch before any code beyond scaffolding is written. Static content pages build out progressively (hero, speakers, sponsors, team, venue). The interactive schedule -- the highest-complexity feature -- is isolated in its own phase. Event lifecycle features and SEO/legal polish close out the project.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Design System & Foundation** - Define visual identity in Stitch, scaffold Astro project, configure Tailwind/shadcn, set up Docker/K8s pipeline
- [ ] **Phase 2: Bilingual Architecture & Content Collections** - i18n routing, language toggle, Zod-validated content schemas for all data types
- [ ] **Phase 3: Hero & Landing** - Hero section with countdown, CTA, key numbers -- the first thing visitors see
- [x] **Phase 4: Speakers** - Speaker grid, individual pages, bilingual content, talk cross-references (completed 2026-04-11)
- [ ] **Phase 5: Sponsors & Team** - Tiered sponsor showcase and team page with role grouping
- [ ] **Phase 6: Venue & Previous Editions** - Venue details with map/transport/accessibility, plus past edition recap
- [ ] **Phase 7: Interactive Schedule** - Full schedule with filtering, timeline view, bookmarks, iCal export, Open Feedback links
- [ ] **Phase 8: Event Lifecycle** - Post-event replay mode, YouTube recording links, CFP status indicator
- [ ] **Phase 9: SEO, Legal & Polish** - Meta tags, structured data, hreflang, legal pages, footer, sitemap

## Phase Details

### Phase 1: Design System & Foundation
**Goal**: Visual identity is defined and approved, project is scaffolded and deployable, design tokens flow into code
**Depends on**: Nothing (first phase)
**Requirements**: DSGN-01, DSGN-02, DSGN-03, DSGN-04, DSGN-05, DSGN-06, FNDN-01, FNDN-05, FNDN-06
**Success Criteria** (what must be TRUE):
  1. DESIGN.md exists in repo with approved colors, typography, spacing, component patterns from Stitch
  2. Running `pnpm dev` starts an Astro 6 site with Tailwind 4, React islands, and shadcn/ui components rendering correctly
  3. Tailwind theme tokens (colors, spacing, typography, radii) match DESIGN.md values exactly
  4. A sample page renders correctly on mobile, tablet, and desktop viewports
  5. `docker build` produces a working Nginx image under 50MB; K8s manifests live in `cnd-platform` repo per GitOps decision
**Plans**: 4

Plans:
- [x] 01-01: Scaffold Astro 6 project with React + Tailwind 4 + shadcn/ui (FNDN-01)
- [x] 01-02: Design system in Stitch + DESIGN.md (DSGN-01, DSGN-02, DSGN-03, DSGN-04)
- [x] 01-03: Wire design tokens + responsive sample page (DSGN-05, DSGN-06, FNDN-05)
- [x] 01-04: Docker + Dagger + GitHub Actions CI (FNDN-06)

### Phase 2: Bilingual Architecture & Content Collections
**Goal**: Site supports French and English with validated content schemas ready for all data types
**Depends on**: Phase 1
**Requirements**: FNDN-02, FNDN-03, FNDN-04
**Success Criteria** (what must be TRUE):
  1. French pages serve at root paths (/) and English pages serve under /en/ with correct locale detection
  2. Language toggle is visible on all pages and switches between FR/EN preserving the current page
  3. Content collections for speakers, talks, sponsors, and team have Zod schemas that fail the build on invalid data
  4. Sample content entries in both FR and EN render correctly through the collection pipeline
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — i18n configuration, translation utilities, bilingual page routing (FNDN-02)
- [x] 02-02-PLAN.md — Language toggle component and Layout integration (FNDN-03)
- [x] 02-03-PLAN.md — Content collections with Zod schemas and sample bilingual data (FNDN-04)

### Phase 3: Hero & Landing
**Goal**: A visitor landing on the homepage immediately understands what, when, where, and how to register
**Depends on**: Phase 2
**Requirements**: HERO-01, HERO-02, HERO-03, HERO-04
**Success Criteria** (what must be TRUE):
  1. Homepage displays event name, date (June 3, 2027), venue (CENTQUATRE-PARIS), and geometric background matching the design system
  2. Countdown timer shows days/hours/minutes/seconds remaining until the event and updates live
  3. A prominent CTA button links to the external registration/ticketing page
  4. Key numbers section displays 1700+ attendees, 50+ talks, 40+ partners in a visually distinct block
**Plans**: 2 plans

- [x] 03-01-PLAN.md — Hero section, countdown timer, translations (HERO-01, HERO-02, HERO-03)
- [x] 03-02-PLAN.md — Key numbers with animated counters, wire homepage (HERO-04)

### Phase 4: Speakers
**Goal**: Visitors can browse all speakers and read detailed profiles with links to their talks
**Depends on**: Phase 2
**Requirements**: SPKR-01, SPKR-02, SPKR-03, SPKR-04
**Success Criteria** (what must be TRUE):
  1. Speaker grid page shows all speakers with photo, name, and company in a responsive layout
  2. Clicking a speaker opens their individual page with bio, company, photo, social links, and talk abstract
  3. Speaker pages link to their talk(s) in the schedule (link targets may be placeholder until Phase 7)
  4. Speaker content exists in both fr/ and en/ subfolders as Markdown files, rendered per locale
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md — Speaker data layer: utility functions and sample content (SPKR-04)
- [x] 04-02-PLAN.md — Speaker grid page with components and i18n (SPKR-01)
- [x] 04-03-PLAN.md — Speaker profile pages with talk cross-references (SPKR-02, SPKR-03)

### Phase 5: Sponsors & Team
**Goal**: Sponsors see their brand represented by tier, and the organizing team is visible to attendees
**Depends on**: Phase 2
**Requirements**: SPNS-01, SPNS-02, SPNS-03, TEAM-01, TEAM-02, TEAM-03
**Success Criteria** (what must be TRUE):
  1. Sponsors page displays logos in distinct Platinum, Gold, Silver, and Community tier sections
  2. Each sponsor entry shows logo, short description, and clickable link to their website
  3. Team page displays 10-20 members with photo, name, role, and social links
  4. Team members are visually grouped by function (core, program committee, volunteers)
  5. Both sponsor and team data are managed via YAML content collections validated by Zod
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

### Phase 6: Venue & Previous Editions
**Goal**: Attendees can plan their trip and past attendees can relive last year's edition
**Depends on**: Phase 2
**Requirements**: VENU-01, VENU-02, VENU-03, VENU-04, EVNT-03
**Success Criteria** (what must be TRUE):
  1. Venue page shows CENTQUATRE-PARIS description with an embedded interactive map
  2. Transport options (metro, bus, train, parking) are clearly listed with relevant details
  3. Nearby hotels and restaurants section exists with practical suggestions
  4. Accessibility information is prominently displayed on the venue page
  5. Previous edition section shows video recap embed, photo gallery link, and key numbers from 2026
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

### Phase 7: Interactive Schedule
**Goal**: Attendees can explore, filter, and build a personal agenda from the full conference schedule
**Depends on**: Phase 4 (speaker data must exist)
**Requirements**: SCHD-01, SCHD-02, SCHD-03, SCHD-04, SCHD-05, SCHD-06, SCHD-07
**Success Criteria** (what must be TRUE):
  1. Schedule page displays all talks with time, title, speaker name, track, and room
  2. Talks can be filtered by track/tag and the view updates instantly
  3. Visual timeline view shows parallel tracks side by side with time slots aligned
  4. Users can bookmark talks (persisted in localStorage) and see their personal agenda
  5. Bookmarked talks can be exported as an iCal (.ics) file download
  6. On mobile, schedule displays as stacked tracks with tabs or swipe navigation
  7. Each talk links to its Open Feedback page via deep link
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD

### Phase 8: Event Lifecycle
**Goal**: The site adapts to the conference timeline -- before, during, and after the event
**Depends on**: Phase 7
**Requirements**: EVNT-01, EVNT-02, EVNT-04
**Success Criteria** (what must be TRUE):
  1. After the event date, the countdown switches to a "watch replays" message with YouTube playlist link
  2. Individual talks in the schedule show a "watch recording" link when a youtubeUrl is set
  3. CFP status indicator on the homepage links to Conference Hall and reflects current state (open/closed/coming soon)
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

### Phase 9: SEO, Legal & Polish
**Goal**: The site is discoverable by search engines, legally compliant, and complete with all navigational elements
**Depends on**: Phase 8
**Requirements**: META-01, META-02, META-03, META-04, META-05, META-06, META-07
**Success Criteria** (what must be TRUE):
  1. Every page has correct SEO meta tags, Open Graph tags, and Twitter card metadata
  2. Sitemap.xml and robots.txt are generated at build time and accessible
  3. JSON-LD structured data for Event schema is present on the homepage
  4. hreflang tags correctly link FR and EN versions of every page
  5. Code of Conduct, privacy policy, and terms pages exist and are linked from the footer
  6. Footer displays social links (LinkedIn, YouTube, Bluesky, X), association info, and legal links on all pages
**Plans**: TBD

Plans:
- [ ] 09-01: TBD

### Phase 10: Site Navigation & Component Wiring
**Goal**: Visitors can navigate between all site sections, and orphaned components from earlier phases are wired into the UI
**Depends on**: Phase 3
**Requirements**: (integration gaps — no new requirements)
**Gap Closure:** Closes integration gaps from v1.0 audit
**Success Criteria** (what must be TRUE):
  1. A navigation/header component exists with links to all major sections (home, speakers, sponsors, team, venue, schedule)
  2. nav.* i18n keys are consumed by the navigation component in both FR and EN
  3. TranslationNotice component is placed on relevant pages
  4. Orphaned shadcn Card/Separator components are either integrated into pages or removed

**Plans**: 1 plan

Plans:
- [x] 10-01-PLAN.md — Navigation.astro + Layout wiring + TranslationNotice placement + orphan retention doc (SC-01, SC-02, SC-03, SC-04)

### Phase 11: Security & i18n Hardcode Fixes
**Goal**: All hardcoded English strings use i18n, locale detection is consistent, and the SocialLinks XSS vector is closed
**Depends on**: Phase 4
**Requirements**: (tech debt — closes CR-01, IN-01, IN-02, WR-01, WR-02, keynote_badge, schedule_link)
**Gap Closure:** Closes integration and tech debt gaps from v1.0 audit
**Success Criteria** (what must be TRUE):
  1. SocialLinks.astro validates URLs before rendering href attributes (no javascript: URIs)
  2. All locale-dependent strings (track badges, keynote label, countdown aria-label) use i18n translation keys
  3. All page data calls use getLangFromUrl result instead of hardcoded 'fr'/'en'
  4. twitter field in SocialLinks is either rendered or removed from the Props type

Plans:
- [ ] 11-01: TBD

### Phase 12: CTA & Brand Completion
**Goal**: Hero CTA buttons are functional and brand identity documentation is complete
**Depends on**: Phase 3
**Requirements**: HERO-03, DSGN-04
**Gap Closure:** Closes requirement and flow gaps from v1.0 audit
**Success Criteria** (what must be TRUE):
  1. "Register" CTA links to the external ticketing page (or a clearly marked placeholder page if URL not yet available)
  2. "View Schedule" CTA either links to a working route or is conditionally hidden until Phase 7 builds /programme
  3. DESIGN.md includes KCD logo usage guidelines (placement, dimensions, co-branding rules)
  4. All satisfied requirements in REQUIREMENTS.md have updated checkboxes

Plans:
- [ ] 12-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order. Phases 4, 5, 6 can execute in parallel (all depend on Phase 2, not each other).

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Design System & Foundation | 0/4 | Planned | - |
| 2. Bilingual Architecture & Content Collections | 0/3 | Planned | - |
| 3. Hero & Landing | 0/? | Not started | - |
| 4. Speakers | 3/3 | Complete   | 2026-04-11 |
| 5. Sponsors & Team | 0/? | Not started | - |
| 6. Venue & Previous Editions | 1/1 | Complete   | 2026-04-12 |
| 7. Interactive Schedule | 0/? | Not started | - |
| 8. Event Lifecycle | 0/? | Not started | - |
| 9. SEO, Legal & Polish | 0/? | Not started | - |
| 10. Site Navigation & Component Wiring | 1/1 | Complete   | 2026-04-12 |
| 11. Security & i18n Hardcode Fixes | 0/? | Not started | - |
| 12. CTA & Brand Completion | 1/1 | Complete   | 2026-04-12 |
