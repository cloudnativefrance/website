# Phase 4: Speakers - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Speaker grid overview page, individual speaker profile pages, bilingual content using existing Markdown content collections, and talk cross-references. This phase delivers the speaker browsing experience — visitors can see who's speaking, learn about them, and discover their talks.

</domain>

<decisions>
## Implementation Decisions

### Speaker Grid Layout
- **D-01:** Compact card grid — photo (circle or rounded square), name, company. 3-4 columns on desktop, 2 on tablet, 1 on mobile. Clicking opens individual speaker page.
- **D-02:** Keynotes first, then alphabetical — keynote speakers featured at the top of the grid, remaining speakers sorted A-Z by name. Requires filtering talks by `format: "keynote"` to identify keynote speakers.

### Speaker Profile Page
- **D-03:** Focused card layout — large photo + name/role/company at top, bio section below, then talk card(s). Single-column centered, mobile-first.
- **D-04:** Social links as icon row — small icons (GitHub, LinkedIn, Bluesky, website) in a horizontal row below the speaker name. Uses existing `socialSchema` fields from content.config.ts.

### Speaker Data & Photos
- **D-05:** 5-8 sample speakers for development — mix of keynote and regular speakers, both FR and EN versions. Enough to test grid layout, sorting, and keynote-first grouping.
- **D-06:** Placeholder avatars — use generated initials-based or generic silhouette avatars during development. Real photos added later when speaker data is finalized. Component should gracefully handle missing `photo` field.

### Talk Cross-References
- **D-07:** Inline talk cards on speaker profiles — each talk shown as a card with title, track badge, format, duration. Links to schedule page (Phase 7) when it exists; placeholder/disabled link for now.
- **D-08:** Co-speakers shown on all profiles — a co-presented talk appears on both the primary speaker and all co-speakers' pages. Each profile shows co-speakers' names as clickable links to their profiles.

### Claude's Discretion
- Photo aspect ratio and crop treatment (circle vs rounded square)
- Track badge color mapping (cloud-infra, devops-platform, security, community)
- Speaker page URL structure (e.g., `/speakers/jane-doe` or `/speakers/speaker-1`)
- Grid card hover effects

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Content Schemas
- `src/content.config.ts` — Zod schemas for speakers (name, company, role, photo, bio, social) and talks (title, speaker, cospeakers, track, format, duration, tags)

### Sample Content
- `src/content/speakers/fr/speaker-1.md` — Example FR speaker Markdown structure
- `src/content/speakers/en/speaker-1.md` — Example EN speaker Markdown structure
- `src/content/talks/fr/talk-1.md` — Example FR talk with speaker reference

### Design System
- `DESIGN.md` — Full design tokens, component patterns, typography scale
- `.planning/phases/03-hero-landing/03-CONTEXT.md` — Card-based visual style decisions (carry forward)

### Requirements
- `.planning/REQUIREMENTS.md` — SPKR-01 through SPKR-04 requirement details

### i18n
- `src/i18n/ui.ts` — Translation key pattern (add speaker-specific keys here)
- `src/i18n/utils.ts` — `getLangFromUrl`, `useTranslations`, `getLocalePath` helpers

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Card`, `Badge`, `Button` (shadcn/ui) — card-based layout for speaker grid and talk cards
- `GeoBackground.astro` — could be used as subtle page background
- `src/i18n/utils.ts` — bilingual routing and translation helpers
- `LanguageToggle.astro` — already in Layout, works with speaker pages

### Established Patterns
- Astro 6 with React islands (`client:load`/`client:idle`) for interactive components
- Content collections with `glob` loader for bilingual Markdown files (speakers, talks)
- Translation keys in `src/i18n/ui.ts` for UI labels
- Talk references speaker by filename slug: `speaker: "speaker-1"`

### Integration Points
- `src/pages/speakers/` — new directory for speaker grid and dynamic pages
- `src/pages/en/speakers/` — EN mirror pages
- `src/content/speakers/{fr,en}/` — speaker Markdown files (already seeded with 1 sample)
- `src/content/talks/{fr,en}/` — talk files with `speaker` and `cospeakers` fields for cross-referencing

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches following existing patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-speakers*
*Context gathered: 2026-04-11*
