# Phase 10: Site Navigation & Component Wiring - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-12
**Phase:** 10-site-navigation-component-wiring
**Areas discussed:** Navigation style & layout, Link targets & dead links, TranslationNotice placement, Orphaned component cleanup

---

## Navigation style & layout

| Option | Description | Selected |
|--------|-------------|----------|
| Logo left + horizontal links + toggle right | Classic conference nav: CND France logo on the left, nav links centered or inline, language toggle on the right | ✓ |
| Minimal centered links + toggle | No logo in nav — just centered navigation links with language toggle at the end | |
| You decide | Claude picks the best pattern | |

**User's choice:** Logo left + horizontal links + toggle right
**Notes:** None

### Mobile navigation pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Hamburger + slide-out drawer | Classic hamburger icon, full-height slide-out panel | |
| Hamburger + dropdown overlay | Lighter dropdown below header | |
| You decide | Claude picks based on number of nav items | ✓ |

**User's choice:** You decide (Claude's discretion)
**Notes:** None

### Active page distinction

| Option | Description | Selected |
|--------|-------------|----------|
| Underline or accent color on active link | Bottom border or text color change using primary accent | ✓ |
| Subtle weight change only | Slightly bolder, no color change | |
| You decide | Claude picks a style fitting the dark theme | |

**User's choice:** Underline or accent color on active link
**Notes:** None

### Scroll effect on sticky header

| Option | Description | Selected |
|--------|-------------|----------|
| Keep current blur + add subtle bottom border on scroll | Thin border-border line when scrolled past hero | ✓ |
| Keep as-is (blur only) | backdrop-blur-sm bg-background/90 is enough | |
| You decide | Claude picks based on visual testing | |

**User's choice:** Keep current blur + add subtle bottom border on scroll
**Notes:** None

---

## Link targets & dead links

| Option | Description | Selected |
|--------|-------------|----------|
| Show all links, dead ones go to homepage anchor | All 6 nav items visible, unbuilt sections link to homepage | ✓ |
| Show all links, dead ones are disabled/greyed | All visible but unbuilt ones muted and not clickable | |
| Only show links to existing pages | Nav shows only Home + Speakers now | |
| You decide | Claude picks most practical approach | |

**User's choice:** Show all links, dead ones go to homepage anchor
**Notes:** None

### Nav CTA button

| Option | Description | Selected |
|--------|-------------|----------|
| No CTA in nav for now | Phase 12 handles CTA. Keep nav clean. | |
| Add a placeholder CTA button | Styled button linking to # for now, ready for Phase 12 | ✓ |

**User's choice:** Add a placeholder CTA button
**Notes:** None

---

## TranslationNotice placement

| Option | Description | Selected |
|--------|-------------|----------|
| Only on content pages with fallback content | Show only when specific content fell back to another language | |
| On all pages when viewing non-default language | Show on every EN page as general notice | |
| You decide | Claude picks based on i18n fallback system | ✓ |

**User's choice:** You decide (Claude's discretion)
**Notes:** None

### Notice position

| Option | Description | Selected |
|--------|-------------|----------|
| Top of content area, below header | Banner-style directly below sticky nav | ✓ |
| Inline near the fallback content | Placed beside the content that fell back | |
| You decide | Claude picks based on implementation simplicity | |

**User's choice:** Top of content area, below header
**Notes:** None

---

## Orphaned component cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| Keep for future phases | Leave card.tsx and separator.tsx in ui/. Future phases may use them. | ✓ |
| Remove unused, reinstall when needed | Delete now, re-add with one command later | |
| You decide | Claude judges likelihood of future use | |

**User's choice:** Keep for future phases
**Notes:** None

---

## Claude's Discretion

- Mobile navigation pattern (hamburger + drawer vs dropdown overlay)
- TranslationNotice display logic (fallback-only vs language-wide)

## Deferred Ideas

None — discussion stayed within phase scope
