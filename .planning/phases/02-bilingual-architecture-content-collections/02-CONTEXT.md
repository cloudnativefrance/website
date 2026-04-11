# Phase 2: Bilingual Architecture & Content Collections - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up bilingual routing (FR default at `/`, EN under `/en/`), a visible language toggle on all pages, and Zod-validated content collections for speakers, talks, sponsors, and team data.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
- i18n approach: Choose between Astro's built-in i18n, Paraglide JS 2, or manual routing based on research (STATE.md flagged Paraglide JS 2 as MEDIUM confidence with Astro 6 — evaluate and fall back if needed)
- Content collection schemas: Design Zod schemas for speakers, talks, sponsors, team with appropriate bilingual content structure
- Language toggle: Design and placement (Claude decides style, position, behavior)
- Translation workflow: How missing translations are handled, fallback behavior
- Bilingual content file structure: Separate files per locale or single file with locale fields

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project
- `.planning/REQUIREMENTS.md` — FNDN-02, FNDN-03, FNDN-04 requirement details
- `DESIGN.md` — Design system tokens for language toggle component styling

### Phase 1 Outputs
- `astro.config.mjs` — Current Astro 6 config (no i18n setup yet)
- `src/layouts/Layout.astro` — Base layout where language toggle will be added
- `src/pages/index.astro` — Current page structure to be adapted for i18n routing

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Layout.astro`: Base layout with DM Sans font, dark theme — language toggle goes here
- `Button`, `Badge` components from shadcn/ui — can be used for toggle styling

### Established Patterns
- Astro 6 with React islands (`client:load`/`client:idle` for interactive components)
- Tailwind 4 CSS-native config via `@theme` directive
- No content collections exist yet — greenfield

### Integration Points
- `astro.config.mjs` — i18n config will be added here
- `src/pages/` — routing structure will be reorganized for locale prefixes
- `src/layouts/Layout.astro` — language toggle added to header area

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — user chose to skip discussion and proceed to planning

</deferred>

---

*Phase: 02-bilingual-architecture-content-collections*
*Context gathered: 2026-04-11*
