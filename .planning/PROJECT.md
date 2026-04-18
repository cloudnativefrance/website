# Cloud Native Days France — Website

## Current State

**v1.1 shipped 2026-04-14** — 8 phases (15–22), 22 plans, 20/22 requirements satisfied (2 organizer content gates pending: I18N-03 brand-history wording, EDIT-07 stats + gallery URL). Audit: PASS_WITH_GAPS (manual a11y UAT + Playwright deferred to v1.2 per ship-now decision). Build green at 156 pages. See [`milestones/v1.1-ROADMAP.md`](milestones/v1.1-ROADMAP.md), [`milestones/v1.1-REQUIREMENTS.md`](milestones/v1.1-REQUIREMENTS.md), and [`milestones/v1.1-MILESTONE-AUDIT.md`](milestones/v1.1-MILESTONE-AUDIT.md).

<details>
<summary>v1.0 (archived) — shipped 2026-04-13</summary>

14 phases, 33 plans, 48/49 requirements satisfied (FNDN-07 deferred to `cnd-platform` repo by design). Audit passed. See [`milestones/v1.0-ROADMAP.md`](milestones/v1.0-ROADMAP.md) and [`milestones/v1.0-REQUIREMENTS.md`](milestones/v1.0-REQUIREMENTS.md).

</details>

## What This Is

The conference website for Cloud Native Days France, a community-driven cloud-native tech conference held at CENTQUATRE-PARIS (104). The site serves as the primary information hub for attendees, speakers, and sponsors — featuring event details, an interactive schedule, speaker profiles, sponsor showcase, and team presentation. Built with Astro + React islands + Tailwind CSS 4, designed in Google Stitch, deployed on Kubernetes.

## Core Value

A first-time visitor should immediately understand what the event is, when and where it happens, and feel compelled to register — all within 5 seconds of landing.

## Current Milestone: v1.2 Homepage Restructuring

**Goal:** Restructure the homepage layout per validated Stitch mockup — merge 2026 film+testimonials, add newsletter CTA, add sponsors platinum section, simplify 2023 bloc.

**Target features:**
- Hero: swap background image (user provides) + increase opacity ~75% + add 3rd CTA "Restez informé" (Accent Pink ghost button, mail icon, newsletter placeholder anchor)
- Section reorder: Hero → Key Numbers → Édition 2026 → Mini-bloc 2023 → CFP → Sponsors Platinum
- Édition 2026 combined section: 3 photos + film + "Voir tous les replays →" + "Télécharger le bilan 2026 (PDF) →" (one-pager link) + testimonials cards
- Mini-bloc 2023: reduce to logo + text link only (remove photos)
- Sponsors Platinum: new homepage section showing Platinum tier logos + "Voir tous les sponsors →" link

**Scope notes:**
- Stitch mockup "Homepage Mockup v2 — Restructured Sections" (Accent Pink CTA version) is the design reference
- Newsletter backend (CLO-6) is out of scope — hero CTA is placeholder anchor for now
- One-pager PDF: https://drive.google.com/file/d/1rlrY9EkulGSgeCPenyiN4ZnxWs5BXPBo/view
- Linear issues: CLO-14, CLO-16, CLO-23, CLO-26, partial CLO-6

**Deferred:**
- P1: Subjective visual UATs for 7 phases (~18 tests)
- P2: SPKR-01 fixture drift, Zod 13 `LoaderConstraint` errors, organizer content placeholders
- Newsletter backend integration (CLO-6 full scope)

## Requirements

<details>
<summary>v1.0 requirement history (archived — see <code>milestones/v1.0-REQUIREMENTS.md</code> for the full ledger)</summary>

### Validated

- [x] Bilingual site (French + English) with language toggle — Validated in Phase 2: Bilingual Architecture & Content Collections
- [x] Modular content architecture: speakers, talks, sponsors, team as Markdown/YAML content collections — Validated in Phase 2: Bilingual Architecture & Content Collections

### Active (now all shipped under v1.0)

- [x] Bold, technical yet community-warm aesthetic (dark theme, geometric shapes, real event photos)
- [x] Bilingual site (French + English) with language toggle
- [x] Hero section with event name, date (June 3, 2027), venue (CENTQUATRE-PARIS), countdown, and CTA
- [x] Interactive schedule: filterable by track, bookmarkable talks, personal agenda export (iCal), visual timeline with parallel tracks
- [x] Speaker profiles: grid overview + individual pages with bio, company, talk abstract, social links
- [x] Sponsor/partner showcase: tiered layout (Platinum, Gold, Silver, Community) with logo, description, link
- [x] Team page: photos, roles, social links, grouped by function (core, program committee, volunteers) — ~10-20 people
- [x] Venue page: map, transport options, nearby hotels, accessibility info
- [x] Previous edition section: video recap, photo gallery link, key numbers
- [x] Footer: social links (LinkedIn, YouTube, Bluesky, X), association info, legal pages (privacy, CoC, terms)
- [x] Modular content architecture: speakers, talks, sponsors, team as Markdown/YAML content collections
- [x] Responsive design: mobile-first, works on all devices
- [x] External tool integration: links to Conference Hall (CFP) and Open Feedback
- [x] Post-event mode: countdown switches to "watch replays" with YouTube playlist link

### Deferred

- Kubernetes deployment manifests (FNDN-07) — owned by sibling `cnd-platform` GitOps repo

</details>

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
| Astro over Next.js/plain React | Content-heavy site, zero JS by default, best Lighthouse scores, content collections built-in | Validated in v1.0 |
| Markdown/YAML over CMS | Team is technical, git workflow preferred, no external dependency | Evolved to CSV-source-of-truth (Google Sheets → CSV → Zod loaders) in v1.0 |
| K8s deployment over Vercel | Organizer self-hosts, aligns with cloud-native identity | Validated; manifests live in cnd-platform repo (GitOps split) |
| Google Stitch for design | AI-native design tool, free tier, DESIGN.md export for Claude Code | Validated; Stitch-first workflow enforced via CLAUDE.md |
| Dark theme with warm accents | Bold/technical feel + community warmth, aligns with developer aesthetic | Validated in v1.0 |
| shadcn/ui components | Accessible, production-ready, pairs with Tailwind, customizable | Validated in v1.0 |
| Runtime TARGET_DATE pattern | Single artifact transitions pre-event → post-event automatically | Validated in Phase 8 |
| Single-locale schema with FR fallback | Avoids duplicating FR content when EN is missing | Validated in v1.0 |

---
*Last updated: 2026-04-18 — v1.2 milestone initialized (Homepage Restructuring).*
