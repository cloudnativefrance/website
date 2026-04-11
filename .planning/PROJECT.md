# Cloud Native Days France — Website

## What This Is

The conference website for Cloud Native Days France, a community-driven cloud-native tech conference held at CENTQUATRE-PARIS (104). The site serves as the primary information hub for attendees, speakers, and sponsors — featuring event details, an interactive schedule, speaker profiles, sponsor showcase, and team presentation. Built with Astro + React islands + Tailwind CSS 4, designed in Google Stitch, deployed on Kubernetes.

## Core Value

A first-time visitor should immediately understand what the event is, when and where it happens, and feel compelled to register — all within 5 seconds of landing.

## Requirements

### Validated

- [x] Bilingual site (French + English) with language toggle — Validated in Phase 2: Bilingual Architecture & Content Collections
- [x] Modular content architecture: speakers, talks, sponsors, team as Markdown/YAML content collections — Validated in Phase 2: Bilingual Architecture & Content Collections

### Active

- [ ] Bold, technical yet community-warm aesthetic (dark theme, geometric shapes, real event photos)
- [x] Bilingual site (French + English) with language toggle
- [ ] Hero section with event name, date (June 3, 2027), venue (CENTQUATRE-PARIS), countdown, and CTA
- [ ] Interactive schedule: filterable by track, bookmarkable talks, personal agenda export (iCal), visual timeline with parallel tracks
- [ ] Speaker profiles: grid overview + individual pages with bio, company, talk abstract, social links
- [ ] Sponsor/partner showcase: tiered layout (Platinum, Gold, Silver, Community) with logo, description, link
- [ ] Team page: photos, roles, social links, grouped by function (core, program committee, volunteers) — ~10-20 people
- [ ] Venue page: map, transport options, nearby hotels, accessibility info
- [ ] Previous edition section: video recap, photo gallery link, key numbers
- [ ] Footer: social links (LinkedIn, YouTube, Bluesky, X), association info, legal pages (privacy, CoC, terms)
- [x] Modular content architecture: speakers, talks, sponsors, team as Markdown/YAML content collections
- [ ] Responsive design: mobile-first, works on all devices
- [ ] External tool integration: links to Conference Hall (CFP) and Open Feedback
- [ ] Post-event mode: countdown switches to "watch replays" with YouTube playlist link

### Out of Scope

- Multi-edition archive — current edition only, past editions linked externally
- Built-in CFP or feedback system — keep Conference Hall and Open Feedback as external tools
- CMS integration — content managed via Markdown/YAML files in git
- User accounts or authentication — static site, no login
- Ticket sales — handled by external ticketing platform
- Mobile app — web only
- Real-time features — no live chat, no WebSocket

## Context

- Cloud Native Days France is organized by the Cloud Native France association (loi 1901)
- Affiliated with KCD (Kubernetes Community Days)
- 2026 edition: 1700+ attendees, 50+ talks, 40+ partners — single-day event
- Next edition: June 3, 2027 at CENTQUATRE-PARIS (104), Paris
- Existing brand: DM Sans font, geometric shapes, CND France + KCD logos
- Current site: functional but outdated look, hard to maintain, limited schedule display
- Design workflow: Google Stitch for design → DESIGN.md → Claude Code for implementation
- Deployment: self-hosted on organizer's Kubernetes cluster (Docker container)
- Social presence: LinkedIn, YouTube, Bluesky, X (Twitter)

## Constraints

- **Tech stack**: Astro + React (islands) + Tailwind CSS 4 + shadcn/ui — decided
- **Content format**: Markdown/YAML files, no external CMS — git-based workflow
- **Deployment**: Must run as a Docker container on Kubernetes — no Vercel/Netlify
- **Design tool**: Google Stitch for design, DESIGN.md as handoff artifact
- **Brand continuity**: Keep DM Sans, geometric shapes, CND France + KCD logos
- **Languages**: French and English, content duplicated per locale
- **Budget**: Minimal — free/open-source tools preferred

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Astro over Next.js/plain React | Content-heavy site, zero JS by default, best Lighthouse scores, content collections built-in | — Pending |
| Markdown/YAML over CMS | Team is technical, git workflow preferred, no external dependency | — Pending |
| K8s deployment over Vercel | Organizer self-hosts, aligns with cloud-native identity | — Pending |
| Google Stitch for design | AI-native design tool, free tier, DESIGN.md export for Claude Code | — Pending |
| Dark theme with warm accents | Bold/technical feel + community warmth, aligns with developer aesthetic | — Pending |
| shadcn/ui components | Accessible, production-ready, pairs with Tailwind, customizable | — Pending |

---
*Last updated: 2026-04-11 after Phase 2 completion — bilingual i18n routing, language toggle, content collections*
