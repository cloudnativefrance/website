# Phase 10: Site Navigation & Component Wiring - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire up site-wide navigation so visitors can move between all major sections, consume the existing nav.* i18n keys, place the TranslationNotice component on relevant pages, and resolve orphaned shadcn components. This is an integration/wiring phase — no new content pages are created.

</domain>

<decisions>
## Implementation Decisions

### Navigation style & layout
- **D-01:** Desktop nav: CND France logo on the left, horizontal section links centered/inline, LanguageToggle on the right. Classic conference site pattern.
- **D-02:** Mobile nav: Claude's discretion — pick the best mobile pattern (hamburger + drawer or dropdown) based on the 6-8 nav items.
- **D-03:** Active page: underline or accent color on the current/active nav link using the primary color.
- **D-04:** Scroll effect: keep the existing backdrop-blur-sm bg-background/90, add a subtle bottom border (border-border) when the user scrolls past the top.

### Link targets & dead links
- **D-05:** Show all 6 nav links (home, speakers, schedule, sponsors, venue, team) even if the target page doesn't exist yet. Dead links point to the homepage (or a relevant homepage anchor section).
- **D-06:** Add a placeholder CTA button in the nav (e.g., "Register") linking to `#` — ready to wire up in Phase 12 (CTA & Brand Completion).

### TranslationNotice placement
- **D-07:** TranslationNotice placement logic: Claude's discretion on when to show it (per-page fallback detection vs blanket non-default-language notice).
- **D-08:** Position: top of content area, directly below the sticky header, banner-style. Immediately visible.

### Orphaned component cleanup
- **D-09:** Keep shadcn card.tsx and separator.tsx in src/components/ui/ for future phases (sponsors, team, venue, schedule will likely use them). No removal.

### Claude's Discretion
- Mobile navigation pattern (hamburger + drawer vs dropdown overlay)
- TranslationNotice display logic (fallback-only vs language-wide)
- Exact styling details for nav links, hover states, transitions
- CTA button styling in the nav

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Navigation & layout
- `src/layouts/Layout.astro` — Base layout with sticky header; nav component will be added here
- `src/i18n/ui.ts` — Contains nav.home, nav.schedule, nav.speakers, nav.sponsors, nav.venue, nav.team keys in both FR and EN
- `src/i18n/utils.ts` — i18n utility functions (getLangFromUrl, useTranslations, getLocalePath)

### Components to wire
- `src/components/TranslationNotice.astro` — Existing translation fallback notice; needs placement on pages
- `src/components/LanguageToggle.astro` — Already in header; nav must coexist with it

### Design tokens
- `src/styles/global.css` — Tailwind 4 theme tokens (OKLCH colors, spacing, typography)
- `DESIGN.md` — Design system reference for visual decisions

No external specs — requirements fully captured in decisions above

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `LanguageToggle.astro`: Already in the sticky header — nav component must integrate alongside it
- `TranslationNotice.astro`: Fully built with i18n support, just needs placement
- `shadcn/ui button.tsx, badge.tsx`: Available for CTA button and potential nav badges
- `nav.*` i18n keys: All 6 section names already translated in both FR and EN

### Established Patterns
- Astro components for static UI (LanguageToggle, TranslationNotice, SpeakerCard)
- React islands only for interactive elements (none in nav currently)
- Tailwind 4 CSS-native @theme with OKLCH colors
- Sticky header with backdrop-blur-sm bg-background/90

### Integration Points
- `Layout.astro` header — nav component replaces the current minimal header
- All pages — TranslationNotice needs conditional rendering
- `src/pages/` and `src/pages/en/` — existing pages for link targets (index, speakers)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for conference site navigation.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-site-navigation-component-wiring*
*Context gathered: 2026-04-12*
