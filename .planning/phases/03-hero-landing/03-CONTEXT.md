# Phase 3: Hero & Landing - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the hero section and landing page — the first thing visitors see. Must pass the "5-second test": a visitor immediately understands what the event is, when and where it happens, and feels compelled to register. Covers requirements HERO-01 through HERO-04.

</domain>

<decisions>
## Implementation Decisions

### Hero Layout & Visual Impact
- **D-01:** Full-viewport hero — GeoBackground.astro fills the entire viewport, content centered over it. Bold, immersive, matches the energetic mood from Phase 1.
- **D-02:** Event photos from previous editions are available and can be used. Claude's discretion on whether and where to include them (e.g., community section below key numbers).

### Countdown Timer
- **D-03:** Card-based digits — individual cards for each unit (days, hours, minutes, seconds) using the deep purple card background from the design system. Clean, modern style.
- **D-04:** Post-event behavior: countdown disappears and is replaced by a "Watch Replays" / "Voir les replays" CTA linking to a YouTube playlist URL (placeholder for now).

### Key Numbers
- **D-05:** Animated counters on scroll — numbers count up from 0 when the section scrolls into view. This requires a React island for the intersection observer + animation logic.
- **D-06:** Three numbers: 1700+ attendees/participants, 50+ talks, 40+ partners/partenaires.

### CTA & Registration
- **D-07:** Primary CTA links to an external ticketing URL (placeholder `#register` until the real URL is provided).
- **D-08:** Secondary CTA "View Schedule" / "Voir le programme" links to the schedule page (placeholder `/schedule` or `/programme` — page will be built in a later phase).

### Claude's Discretion
- Event photo usage and placement (if any)
- Countdown card animation style (subtle pulse, static, etc.)
- Key numbers icon/illustration choices
- Responsive breakpoint behavior for hero elements
- Whether to include any additional decorative elements

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System
- `DESIGN.md` — Full design system tokens, hero section pattern spec, geometric background spec
- `.planning/phases/03-hero-landing/03-UI-SPEC.md` — Approved UI design contract: spacing, typography (4 sizes, 2 weights), color (60/30/10), copywriting, component specs

### Requirements
- `.planning/REQUIREMENTS.md` — HERO-01 through HERO-04 requirement details

### Prior Phase Outputs
- `src/components/patterns/GeoBackground.astro` — Existing geometric background component to reuse
- `src/i18n/ui.ts` — Bilingual UI string dictionaries
- `src/i18n/utils.ts` — getLangFromUrl, useTranslations, getLocalePath
- `src/layouts/Layout.astro` — Base layout with language toggle

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `GeoBackground.astro`: Geometric pattern component — use as hero background
- `Button` (shadcn/ui): CTA buttons with primary styling
- `Card` (shadcn/ui): Can be used for countdown digit cards and key number cards
- `Badge` (shadcn/ui): Can be used for the date badge (accent color)
- `useTranslations` / `getLangFromUrl`: Bilingual text infrastructure ready

### Established Patterns
- Astro 6 with React islands (`client:load` / `client:idle`) for interactive components
- Tailwind 4 CSS-native config via `@theme` directive
- Dark theme with deep purple background, primary blue for interactives, accent pink for highlights

### Integration Points
- `src/pages/index.astro` (FR) and `src/pages/en/index.astro` (EN) — hero replaces current placeholder content
- `src/layouts/Layout.astro` — hero lives inside this layout, below the sticky header

</code_context>

<specifics>
## Specific Ideas

- User has event photos from previous editions available — can provide them when needed
- Countdown uses card-based digits (not flip-clock or plain text)
- Key numbers animate on scroll (count-up effect) — React island
- Primary CTA is external ticketing link (placeholder until real URL provided)
- Secondary CTA is "View Schedule" linking to future schedule page

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-hero-landing*
*Context gathered: 2026-04-11*
