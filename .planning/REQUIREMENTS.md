# Requirements: Cloud Native Days France — Website

**Defined:** 2026-04-18
**Core Value:** A first-time visitor should immediately understand what the event is, when and where it happens, and feel compelled to register — all within 5 seconds of landing.

## v1.2 Requirements

Requirements for Homepage Restructuring milestone. Each maps to roadmap phases.

### Hero

- [x] **HERO-01**: Hero section displays user-provided background image at ~75% opacity (replacing ambiance-10.jpg)
- [x] **HERO-02**: Hero section shows 3 CTAs: "Réservez votre place" (Primary Blue filled), "Voir le programme" (Blue outline), "Restez informé" (Accent Pink ghost, mail icon)

### Edition 2026

- [x] **ED26-01**: Homepage shows combined 2026 section with 3 photos, embedded film, and testimonial cards (replacing separate PastEditionSection + TestimonialsStrip)
- [x] **ED26-02**: 2026 section includes "Voir tous les replays →" link
- [x] **ED26-03**: 2026 section includes "Télécharger le bilan 2026 (PDF) →" link to one-pager

### Edition 2023

- [x] **ED23-01**: Homepage 2023 bloc shows only KCD logo + text link to /2023 page (no photos)

### Sponsors

- [x] **SPON-01**: Homepage shows Platinum sponsor logos with "Voir tous les sponsors →" link to /sponsors

### Layout

- [x] **LAYO-01**: Homepage sections follow order: Hero → Key Numbers → Édition 2026 → Mini-bloc 2023 → CFP → Sponsors Platinum

### Branding

- [x] **BRND-01**: Favicon displays the French flag instead of current icon

## v2 Requirements

Deferred to future milestones.

### Newsletter
- **NEWS-01**: Newsletter signup form with email capture and CRM integration (CLO-6 full scope)

### Content
- **CONT-01**: Real attendee testimonials replace fabricated placeholder quotes
- **CONT-02**: 2026 replays playlist URL confirmed and linked

## Out of Scope

| Feature | Reason |
|---------|--------|
| Newsletter backend integration | CLO-6 backend TBD — hero CTA is placeholder anchor for now |
| Hero pitch rewrite (CLO-19) | Deferred to separate content milestone |
| CFP page creation (CLO-22) | Separate milestone scope |
| Feature flags system (CLO-5) | Infrastructure work, separate milestone |
| Pricing/ticketing page (CLO-9) | Separate milestone scope |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| HERO-01 | Phase 25 | Complete (live; 25-01 shipped 2026-04-18) |
| HERO-02 | Phase 25 | Complete (live; 25-01 shipped 2026-04-18) |
| ED26-01 | Phase 23 + 26 | Complete (component shipped in 23-02; mounted on homepage in 26-01) |
| ED26-02 | Phase 23 + 26 | Complete (replays CTA shipped in 23-02; live on homepage via 26-01) |
| ED26-03 | Phase 23 + 26 | Complete (PDF CTA shipped in 23-02; live on homepage via 26-01) |
| ED23-01 | Phase 24 + 26 | Complete (component shipped in 24-03; mounted on homepage in 26-01) |
| SPON-01 | Phase 24 + 26 | Complete (foundation + component shipped in 24-01 + 24-02; mounted on homepage in 26-01) |
| LAYO-01 | Phase 26 | Complete (26-01 wired the order; 26-03 cleaned up orphan files) |
| BRND-01 | Phase 26 | Complete (26-02) |

**Coverage:**
- v1.2 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0

---
*Requirements defined: 2026-04-18*
*Last updated: 2026-04-19 — All 9 v1.2 requirements complete after Phase 26 closeout (26-03 orphan cleanup); ready for milestone audit*
