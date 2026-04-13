# Requirements: Cloud Native Days France Website

**Defined:** 2026-04-11
**Core Value:** A first-time visitor should immediately understand what the event is, when and where it happens, and feel compelled to register — all within 5 seconds of landing.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Design System

- [x] **DSGN-01**: Design system defined in Google Stitch with colors, typography, spacing, and component patterns
- [x] **DSGN-02**: DESIGN.md exported and committed to project root as the single source of truth for all visual decisions
- [x] **DSGN-03**: Dark theme with bold/technical aesthetic and warm community accents (real event photos, friendly tone)
- [x] **DSGN-04**: Brand continuity preserved: DM Sans font, geometric shapes, CND France + KCD logos
- [x] **DSGN-05**: Tailwind CSS 4 theme tokens derived from DESIGN.md (colors, spacing, typography, radii)
- [x] **DSGN-06**: shadcn/ui components customized to match design system

### Foundation

- [x] **FNDN-01**: Astro 6 project scaffolded with React islands + Tailwind CSS 4 + shadcn/ui
- [x] **FNDN-02**: Bilingual routing: French as default (no prefix), English under /en/
- [x] **FNDN-03**: Language toggle component visible on all pages
- [x] **FNDN-04**: Content collections with Zod schemas for speakers, talks, sponsors, team
- [x] **FNDN-05**: Responsive layout system: mobile-first, works on all devices
- [x] **FNDN-06**: Docker multi-stage build (Node build → Nginx Alpine) producing < 50MB image
- [ ] **FNDN-07**: Kubernetes deployment manifests (Deployment, Service, Ingress)

### Hero & Landing

- [x] **HERO-01**: Hero section with event name, date (June 3, 2027), venue (CENTQUATRE-PARIS), geometric background
- [x] **HERO-02**: Countdown timer to event date (pre-event mode)
- [x] **HERO-03**: Prominent CTA button linking to external registration/ticketing
- [x] **HERO-04**: Key numbers section: 1700+ attendees, 50+ talks, 40+ partners

### Schedule

- [x] **SCHD-01**: Schedule page displaying all talks with time, title, speaker, track, room
- [x] **SCHD-02**: Filter talks by track/tag
- [x] **SCHD-03**: Visual timeline view showing parallel tracks side by side
- [x] **SCHD-04**: Bookmark talks to personal agenda (localStorage, no login)
- [x] **SCHD-05**: Export bookmarked talks as iCal (.ics) file
- [x] **SCHD-06**: Mobile-friendly schedule view (stacked tracks, swipeable or tabbed)
- [x] **SCHD-07**: Link from each talk to its Open Feedback page (deep link by talk ID)

### Speakers

- [x] **SPKR-01**: Speaker grid overview with photo, name, company
- [x] **SPKR-02**: Individual speaker page with bio, company, photo, social links, talk abstract
- [x] **SPKR-03**: Link from speaker page to their talk(s) in the schedule
- [x] **SPKR-04**: Speaker data managed via Markdown files (bilingual: fr/ and en/ subfolders)

### Sponsors

- [ ] **SPNS-01**: Sponsor showcase with tiered layout (Platinum, Gold, Silver, Community)
- [ ] **SPNS-02**: Each sponsor displays logo, short description, and link
- [ ] **SPNS-03**: Sponsor data managed via YAML content collection

### Team

- [ ] **TEAM-01**: Team page displaying 10-20 members with photo, name, role, social links
- [ ] **TEAM-02**: Members grouped by function (core, program committee, volunteers)
- [ ] **TEAM-03**: Team data managed via YAML content collection

### Venue

- [x] **VENU-01**: Venue page with CENTQUATRE-PARIS description and embedded map
- [x] **VENU-02**: Transport options (metro, bus, train, parking)
- [x] **VENU-03**: Nearby hotels and restaurants
- [x] **VENU-04**: Accessibility information

### Event Lifecycle

- [ ] **EVNT-01**: Post-event mode: countdown switches to "watch replays" with YouTube playlist link
- [ ] **EVNT-02**: Schedule talks link to YouTube recordings when available (youtubeUrl field)
- [x] **EVNT-03**: Previous edition section with video recap, photo gallery link, key numbers
- [ ] **EVNT-04**: CFP status indicator linking to Conference Hall (open/closed/coming soon)

### SEO & Legal

- [ ] **META-01**: SEO meta tags, Open Graph, Twitter cards on all pages
- [ ] **META-02**: Sitemap.xml and robots.txt generated
- [ ] **META-03**: JSON-LD structured data for Event schema
- [ ] **META-04**: hreflang tags for FR/EN pages
- [ ] **META-05**: Code of Conduct page
- [ ] **META-06**: Privacy policy and terms pages
- [ ] **META-07**: Footer with social links (LinkedIn, YouTube, Bluesky, X), association info, legal links

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Interactivity

- **V2-01**: Search across speakers and talks
- **V2-02**: PWA offline support for schedule
- **V2-03**: Analytics dashboard integration (Plausible)

### Content Expansion

- **V2-04**: Multi-edition archive (past years browsable on same site)
- **V2-05**: Blog/news section for announcements
- **V2-06**: Workshop registration page

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Built-in CFP system | Conference Hall handles this; months of work to replicate |
| Built-in feedback system | Open Feedback is purpose-built; deep-linking is sufficient |
| User accounts / authentication | Static site; localStorage handles bookmarks without login |
| Ticket sales / payments | External ticketing platform handles payments, invoicing, VAT |
| Live chat / real-time features | Discord/Slack for community; WebSocket for static site is overengineering |
| CMS integration | Team is technical; Markdown/YAML in git is simpler and cheaper |
| Mobile app | Responsive web is sufficient for a single-day event |
| Attendee networking | Social media and hallway conversations work at 1700-person scale |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DSGN-01 | Phase 1: Design System & Foundation | Complete |
| DSGN-02 | Phase 1: Design System & Foundation | Complete |
| DSGN-03 | Phase 1: Design System & Foundation | Complete |
| DSGN-04 | Phase 12: CTA & Brand Completion | Complete |
| DSGN-05 | Phase 1: Design System & Foundation | Complete |
| DSGN-06 | Phase 1: Design System & Foundation | Complete |
| FNDN-01 | Phase 1: Design System & Foundation | Complete |
| FNDN-02 | Phase 2: Bilingual Architecture & Content Collections | Complete |
| FNDN-03 | Phase 2: Bilingual Architecture & Content Collections | Complete |
| FNDN-04 | Phase 2: Bilingual Architecture & Content Collections | Complete |
| FNDN-05 | Phase 1: Design System & Foundation | Complete |
| FNDN-06 | Phase 1: Design System & Foundation | Complete |
| FNDN-07 | Deferred to cnd-platform repo (GitOps) | Pending |
| HERO-01 | Phase 3: Hero & Landing | Complete |
| HERO-02 | Phase 3: Hero & Landing | Complete |
| HERO-03 | Phase 12: CTA & Brand Completion | Complete |
| HERO-04 | Phase 3: Hero & Landing | Complete |
| SCHD-01 | Phase 7: Interactive Schedule | Pending |
| SCHD-02 | Phase 7: Interactive Schedule | Pending |
| SCHD-03 | Phase 7: Interactive Schedule | Pending |
| SCHD-04 | Phase 7: Interactive Schedule | Pending |
| SCHD-05 | Phase 7: Interactive Schedule | Pending |
| SCHD-06 | Phase 7: Interactive Schedule | Pending |
| SCHD-07 | Phase 7: Interactive Schedule | Delivered |
| SPKR-01 | Phase 4: Speakers | Complete |
| SPKR-02 | Phase 4: Speakers | Complete |
| SPKR-03 | Phase 4: Speakers | Complete |
| SPKR-04 | Phase 4: Speakers | Complete |
| SPNS-01 | Phase 5: Sponsors & Team | Pending |
| SPNS-02 | Phase 5: Sponsors & Team | Pending |
| SPNS-03 | Phase 5: Sponsors & Team | Pending |
| TEAM-01 | Phase 5: Sponsors & Team | Pending |
| TEAM-02 | Phase 5: Sponsors & Team | Pending |
| TEAM-03 | Phase 5: Sponsors & Team | Pending |
| VENU-01 | Phase 6: Venue & Previous Editions | Complete |
| VENU-02 | Phase 6: Venue & Previous Editions | Complete |
| VENU-03 | Phase 6: Venue & Previous Editions | Complete |
| VENU-04 | Phase 6: Venue & Previous Editions | Complete |
| EVNT-01 | Phase 8: Event Lifecycle | Pending |
| EVNT-02 | Phase 8: Event Lifecycle | Pending |
| EVNT-03 | Phase 6: Venue & Previous Editions | Complete |
| EVNT-04 | Phase 8: Event Lifecycle | Pending |
| META-01 | Phase 9: SEO, Legal & Polish | Pending |
| META-02 | Phase 9: SEO, Legal & Polish | Pending |
| META-03 | Phase 9: SEO, Legal & Polish | Pending |
| META-04 | Phase 9: SEO, Legal & Polish | Pending |
| META-05 | Phase 9: SEO, Legal & Polish | Pending |
| META-06 | Phase 9: SEO, Legal & Polish | Pending |
| META-07 | Phase 9: SEO, Legal & Polish | Pending |

**Coverage:**
- v1 requirements: 49 total
- Mapped to phases: 49
- Unmapped: 0
- Complete: 18
- Pending: 31

---
*Requirements defined: 2026-04-11*
*Last updated: 2026-04-12 after gap closure phases added*
