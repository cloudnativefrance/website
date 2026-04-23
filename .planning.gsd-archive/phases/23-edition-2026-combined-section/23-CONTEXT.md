# Phase 23: Edition 2026 Combined Section - Context

**Gathered:** 2026-04-18
**Status:** Ready for planning (after UI-SPEC generation)

<domain>
## Phase Boundary

Build a new homepage section component `Edition2026Combined.astro` that merges, into one section:

1. 3 event photos (from `EDITION_2026.thumbnails`)
2. Embedded 2026 conference film (YouTube `EDITION_2026.youtubeId`)
3. "Voir tous les replays" link to the 2026 replays YouTube playlist
4. "Télécharger le bilan 2026 (PDF)" link to the one-pager PDF
5. Testimonial cards (from `TESTIMONIALS` array + i18n keys)

This section **replaces** the current separate `PastEditionSection` (2026 variant) + `TestimonialsStrip` on both `src/pages/index.astro` (FR) and `src/pages/en/index.astro` (EN).

**Mounting on the homepage is in scope for Phase 26 (Homepage Wiring)** — Phase 23 creates, props, styles, and i18n-keys the component but does not reorder the homepage.

Out of scope for this phase: Hero changes (Phase 25), Sponsors Platinum strip (Phase 24), 2023 mini-bloc simplification (Phase 24), favicon swap (Phase 26).

</domain>

<decisions>
## Implementation Decisions

### Component Architecture
- **D-01:** Create a **new purpose-built** `src/components/past-editions/Edition2026Combined.astro`. Do **not** modify the generic `PastEditionSection.astro` (its render order is LOCKED per Phase 16 D-08 and it still serves the dedicated `/2023` page).
- **D-02:** Pure Astro SSR, no hydration directives. Consistent with all other past-editions components.
- **D-03:** Testimonial cards render as **static cards within this section** (not the marquee). `TestimonialsStrip.astro` file stays on disk (may be reused later) but is **not imported by this component** and will be removed from homepage in Phase 26.

### Data Module Changes (`src/lib/editions-data.ts`)
- **D-04:** Trim `EDITION_2026.thumbnails` from 4 entries to **3 entries**: keep **ambiance-03, ambiance-06, ambiance-10**; **drop ambiance-08**. Matches ED26-01 "3 photos" requirement and keeps the data array size aligned with rendered output (no component-side slicing).
- **D-05:** Add `replaysUrl: "https://www.youtube.com/watch?v=lJXUhqHWCDo&list=PLmZ3gFl2Aqt_4_F40zEoUEweEctmtx4p2"` to `EDITION_2026`. This is the direct 2026 replays playlist URL, confirmed by user.
- **D-06:** Add `pdfUrl: "https://drive.google.com/file/d/1rlrY9EkulGSgeCPenyiN4ZnxWs5BXPBo/view"` to `EDITION_2026`. Confirmed in PROJECT.md (v1.2 scope notes). Hosted on Google Drive (external link, not copied into `public/`).

### i18n Keys (add to `src/i18n/ui.ts`, FR + EN)
- **D-07:** `editions.2026.replays_cta` — FR: "Voir tous les replays" / EN: "Watch all replays"
- **D-08:** `editions.2026.pdf_cta` — FR: "Télécharger le bilan 2026 (PDF)" / EN: "Download 2026 report (PDF)"
- **D-09:** Testimonial keys (`testimonials.N.quote`, `testimonials.N.attribution`) already exist from Phase 20; reuse as-is. Do **not** rename.
- **D-10:** Section heading key — use existing `editions.2026.*` namespace (e.g., reuse `editions.2026.heading` if present, or add `editions.2026.combined.heading`). Researcher/UI-SPEC should confirm which existing key to reuse.

### External Link Hygiene
- **D-11:** All external anchors (`replaysUrl`, `pdfUrl`, YouTube embed) use `target="_blank"` + `rel="noopener noreferrer"`, matching the established pattern in `PastEditionSection.astro` (`<a … rel="noopener" target="_blank">`).
- **D-12:** YouTube embed continues using `youtube-nocookie.com/embed/${id}` per existing privacy pattern.

### Styling & Tokens
- **D-13:** DS tokens only — `--color-card`, `--color-border`, `--color-muted-foreground`, `--color-foreground`, `--color-primary`, `--radius`. No ad-hoc colors or overrides.
- **D-14:** Maintain existing max-width container pattern (`max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-16 md:py-24`) to match visual rhythm with neighboring sections.

### Claude's Discretion
- **Layout / spatial arrangement** — stacking order of heading, photos, video, CTAs, testimonial cards → **deferred to Stitch mockup via `/gsd-ui-phase 23`** (Stitch-first rule).
- **Testimonial card visual treatment** — grid columns, hover behavior, typography details → **deferred to Stitch mockup via UI-SPEC**.
- **CTA placement / grouping** — under video vs. dedicated row vs. section bottom → **deferred to Stitch mockup via UI-SPEC**.
- **Stats row** — whether to keep the 3-stat row (`1700+ / 50+ / 40+`) inside this combined section → UI-SPEC decides based on Stitch reference.
- **Photo mosaic sizing** — `size: "hero" | "medium" | "small"` per photo → UI-SPEC decides, then data module updates accordingly.
- **Heading copy / rail label** — exact text and whether to keep the rotated rail from `PastEditionSection` → UI-SPEC decides.
- **Loading / empty states** — component has no async data (data is imported at build); no loading state needed.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Guidelines
- `CLAUDE.md` — Stitch-first rule + CSV-source-of-truth rule (testimonials & sponsors come from typed data modules, no hardcoding)
- `.planning/PROJECT.md` — v1.2 milestone scope, key decisions, PDF URL constant
- `.planning/REQUIREMENTS.md` — ED26-01, ED26-02, ED26-03 (requirement IDs this phase must address)
- `.planning/ROADMAP.md` (Phase 23 section) — Phase goal + 4 success criteria

### Research
- `.planning/research/ARCHITECTURE.md` §"Edition2026Combined — NEW" — component props interface, integration map, data-flow diagram, anti-patterns 1-4
- `.planning/research/SUMMARY.md` — build-order context (Edition2026Combined sits in Phase 2 of the milestone build order)
- `.planning/research/PITFALLS.md` — dual-homepage divergence, i18n key drift, empty-state guards, hero opacity contrast (latter applies to Phase 25 but worth awareness)
- `.planning/research/FEATURES.md` — feature-level intent for the combined section
- `.planning/research/STACK.md` — no stack additions; confirms Astro SSR component with zero hydration

### Existing Components (source of truth for patterns)
- `src/components/past-editions/PastEditionSection.astro` — **read first** to understand existing conference-recap layout patterns (mosaic `colSpan`, YouTube embed, section container classes, external-link attributes). Copy patterns, do **not** import/extend.
- `src/components/testimonials/TestimonialsStrip.astro` — **read first** to extract the static card styling (card shell, quote italic, attribution muted) that the new component will reuse without the marquee animation.
- `src/components/past-editions/PastEditionMinimal.astro` — reference for the DS-token-only discipline (see Phase 17-04 lessons).

### Data & i18n
- `src/lib/editions-data.ts` — existing `EDITION_2026` constant; will be mutated in this phase (D-04, D-05, D-06)
- `src/lib/testimonials-data.ts` — existing `TESTIMONIALS` array; consumed as-is by the new component
- `src/i18n/ui.ts` — add `editions.2026.replays_cta` + `editions.2026.pdf_cta` (FR + EN)
- `src/i18n/utils.ts` — `getLangFromUrl` + `useTranslations` pattern (established in all past-editions components)

### UI Contract (to be generated)
- `.planning/phases/23-edition-2026-combined-section/23-UI-SPEC.md` — **NOT YET GENERATED**. Layout, testimonial card visual, CTA placement, heading copy, and rail decision live here. Run `/gsd-ui-phase 23` before planning.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets (copy patterns, don't import/extend)
- `PastEditionSection.astro` photo mosaic — `grid-cols-12`, `[grid-auto-rows]`, `colSpan` map for `"hero" | "medium" | "small"` variants. Reuse the grid classes verbatim.
- `PastEditionSection.astro` YouTube embed — `youtube-nocookie.com/embed/${id}` with aspect-video figure, lazy-loaded iframe. Reuse verbatim.
- `PastEditionSection.astro` galleryCta pattern — `text-sm font-semibold text-primary hover:underline` with trailing `<span aria-hidden="true">→</span>`. Use for both replays and PDF CTAs.
- `TestimonialsStrip.astro` card styles — border + radius + background token (`--color-card` + `--color-border`), italic blockquote, muted-foreground attribution. Extract the card shell, drop the marquee track/animation.
- `useTranslations(lang)` + `getLangFromUrl(Astro.url)` — standard i18n boot pattern used by every past-editions component. Copy verbatim.

### Established Patterns
- **Zero hydration for past-editions components** — no `client:*` directives. Pure Astro SSR.
- **i18n keys in `src/i18n/ui.ts`** — add keys to BOTH `fr` and `en` dictionaries; EN silently falls back to FR if missing (PITFALLS.md #2).
- **External links** — `target="_blank" rel="noopener noreferrer"` on every outbound anchor (Drive, YouTube, external playlists).
- **DS tokens only** — never hardcode hex/rgb colors; use `--color-*` variables. Re-enforced by `feedback_stitch_ds_tokens` memory.
- **Component consolidation** — when a design merges multiple sections, create ONE new purpose-built component rather than flagging the generic shell (anti-pattern #1 in ARCHITECTURE.md).

### Integration Points
- **Not integrated in this phase.** Component must be self-contained and ready for mounting.
- Phase 26 will wire this component into `src/pages/index.astro` and `src/pages/en/index.astro` alongside the Sponsors Platinum strip (Phase 24) and hero changes (Phase 25), atomically.
- Testimonials currently live inside `TestimonialsStrip.astro` (homepage marquee). Phase 26 removes that import; Phase 23 does not touch the current homepage files.

</code_context>

<specifics>
## Specific Ideas

- **Stitch reference:** "Homepage Mockup v2 — Restructured Sections" (Accent Pink CTA version) per PROJECT.md. This is the design anchor for the UI-SPEC generation step that must precede planning.
- **Replays URL (direct playlist):** `https://www.youtube.com/watch?v=lJXUhqHWCDo&list=PLmZ3gFl2Aqt_4_F40zEoUEweEctmtx4p2` — provided by user. Use the `list=` playlist URL, not the `watch?v=` single-video URL when wiring the CTA link (strip `watch?v=…&` and use `playlist?list=…` form for cleanliness).
- **PDF URL:** `https://drive.google.com/file/d/1rlrY9EkulGSgeCPenyiN4ZnxWs5BXPBo/view` — one-pager "Bilan 2026" Google Drive link from PROJECT.md. External link, not hosted locally.
- **Photo set:** Final 3 thumbnails = `ambiance-03`, `ambiance-06`, `ambiance-10` (in that order, unless UI-SPEC reorders).

</specifics>

<deferred>
## Deferred Ideas

### For Phase 25 (Hero Redesign)
- **New hero background image is already in place:** `src/assets/photos/ambiance/ambiance-00.jpg` (user added during this discussion). Unblocks HERO-01. Phase 25 planning should point `HeroSection.astro` at this asset.

### For Phase 26 (Homepage Wiring)
- Remove `TestimonialsStrip` import from both `src/pages/index.astro` and `src/pages/en/index.astro`.
- Remove the old 2026 `PastEditionSection` mount from both homepage pages.
- Mount `Edition2026Combined` in the new slot per `LAYO-01` order: Hero → Key Numbers → **Edition 2026 Combined** → Mini-bloc 2023 → CFP → Sponsors Platinum.

### For a later milestone (v1.3 / content cycle)
- **CONT-01 real testimonials** — testimonials currently fabricated (see `testimonials-data.ts` TODO). Replace attributions + quote copy with organizer-validated real quotes. Out of scope here — Phase 23 keeps the existing placeholder data.
- **Stable i18n-only heading** — if a future phase wants locale-specific rail / heading variants, revisit the rail pattern.

### Not in scope now
- Newsletter form / section (CLO-6 backend deferred; hero CTA is placeholder anchor — handled in Phase 25).
- `/2026` dedicated page (no requirement for v1.2).
- Replays playlist thumbnail/preview gallery inside this section (current design uses a single embed + CTA).

</deferred>

---

*Phase: 23-edition-2026-combined-section*
*Context gathered: 2026-04-18*
