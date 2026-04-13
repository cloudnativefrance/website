# Phase 15: Stitch Full-Homepage Mock - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Design-only gate: produce a single Stitch-approved, full-homepage visual contract (Hero → KeyNumbers → CFP → 2026 → 2023 → Testimonials → Footer) using only design-system tokens. No code lands in this phase. Output: approved Stitch screen(s) + DESIGN.md update locking section order, shared-shell rhythm, brand-callout layout, marquee-vs-grid decision, and CFP placement.

</domain>

<decisions>
## Implementation Decisions

### Shared-Shell Rhythm (PastEditionSection)
- **D-01:** Vertical order inside each PastEditionSection is **rail → h2 → stats → media → optional brand callout**. Stats sit high to anchor numbers near the heading; media (video for 2026, photo grid for 2023) carries visual weight in the middle; brand callout closes the section when present.
- **D-02:** Rail label ("EDITION 2026" / "EDITION 2023") is rendered as a **vertical left rail** (rotated text running down the section's left edge) — distinctive, signals "past editions" as a recurring series across the page.
- **D-03:** Default vertical breathing room between top-level homepage sections is **96px desktop / 64px mobile** ("generous"). See D-09 for the CFP exception.

### 2026 vs 2023 Variants
- **D-04:** 2023 photo grid uses an **asymmetric / mosaic layout**: one or two larger "hero" photos plus smaller supporting tiles (e.g., 2-up large + 3-up small + 5-up bottom row), totaling 10 photos. Editorial feel; each tile opens the lightbox (lightbox itself is Phase 19).
- **D-05:** 2023 KCD brand-history callout sits **below the photo grid as a full-width band** — closes the section as a "why this matters" moment with KCD logo + short history copy. (Organizer sign-off on copy is required before Phase 19 ships.)
- **D-13:** 2023 section also carries a **single featured video embed** placed **between the photo mosaic and the KCD brand-history callout**. Source: YouTube playlist `PLmZ3gFl2Aqt_Qo4EAITE1ewy1ww5jkU2h` (2023 session recordings). Homepage shows one featured thumbnail with a "Watch all 2023 sessions →" link pointing to the full playlist; individual-video lightbox handling is deferred to Phase 19.
- **D-06:** 2026 placeholder content carries a **visible "PLACEHOLDER" badge** in the Stitch mock so reviewers see the dev/staging treatment that will ship in Phase 17. Badge styling (color, position) is part of the design contract.

### Testimonials Marquee
- **D-07:** Marquee direction is **right → left, slow drift** (~40s loop). Single row. Conventional reading flow; slow enough to read a quote in passing.
- **D-08:** Card style is **quote-led**: large quote text dominates, small attribution (name — role) underneath. No avatars (we don't have them; placeholder quotes only). Treated as "card" with subtle background/border using DS tokens.
- **D-09:** Marquee pauses **on hover and on keyboard focus only** — no visible pause/play button. Combined with the global `prefers-reduced-motion` reset (Phase 16), this satisfies the a11y baseline without adding chrome.

### CFP Placement & Density
- **D-10:** CFP section is a **compact band**: headline + dates + single CTA in one tight row. No track lists, no countdown timer in this phase.
- **D-11:** **Mixed gap rhythm to satisfy the ~2vh mobile constraint**: Hero → KeyNumbers → CFP use **48px mobile gaps** (tightened); editions and testimonials below keep the 64px mobile / 96px desktop generous rhythm from D-03. Target: CFP section top sits within ~1688px on a 390×844 mobile mock.

### Section Order (locked by ROADMAP success criteria, restated for clarity)
- **D-12:** Final homepage section order is: **Hero → KeyNumbers → CFP → 2026 Edition → 2023 Edition → Testimonials → Footer**. Reverse-chronological for past editions (2026 first, 2023 second). Locked by EDIT-06.

### Claude's Discretion
- Exact stat-row layout (3-up inline vs grid) within the shared shell — Claude picks based on DS token spacing.
- Mosaic photo arrangement specifics (which photos are "hero" tiles) — Claude proposes; user approves in Stitch.
- Placeholder badge color/position within DS palette.
- Marquee card padding, border radius, shadow level — pick from DS tokens.
- CFP CTA copy ("Submit your talk →" vs "Soumettre une proposition →") — copy is locked elsewhere; design just reserves space.

### Folded Todos
None — no pending todos surfaced for Phase 15 scope.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & Requirements
- `.planning/ROADMAP.md` §"Phase 15: Stitch Full-Homepage Mock" — phase goal and 5 success criteria
- `.planning/REQUIREMENTS.md` — EDIT-06 (reverse-chronological section order)
- `.planning/PROJECT.md` — Stitch-first workflow, DM Sans + geometric shapes brand continuity, dark theme + warm accents

### Design System
- `DESIGN.md` (project root) — design tokens, typography scale, spacing grid; Phase 15 must update this with the locked full-homepage layout
- `CLAUDE.md` §"Design Rules" — Stitch-first mandate

### Stitch References
- `.claude/projects/-home-smana-Sources-cndfrance-website/memory/reference_stitch.md` — Stitch project + design system IDs for CND France 2027
- `.claude/projects/-home-smana-Sources-cndfrance-website/memory/feedback_stitch_ds_tokens.md` — never override DS colors in Stitch prompts; use token roles only

### v1.1 Milestone Context
- `.planning/STATE.md` §"v1.1 Scope Decisions" — static past-editions data, inline testimonials, marquee in scope, lightbox in scope, FR+EN parity mandatory

### Downstream Phases (read for awareness, not requirement)
- Phase 16 (Foundation) — implements `PastEditionSection.astro` shell whose props this mock locks
- Phase 17 (2026 integration) — uses 2026 mock variant
- Phase 19 (2023 integration + lightbox) — uses 2023 mock variant + brand callout layout
- Phase 20 (Testimonials marquee) — uses marquee mock layout

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **DS tokens** in `tailwind.config` / `src/styles/global.css` — Stitch mock must reference token roles (background, surface, accent, foreground) only, never raw hex.
- **Existing Hero, KeyNumbers, CFP** sections on current homepage — Stitch mock should preserve their established visual identity while harmonizing them into the new full-page rhythm.
- **DM Sans typography scale** + geometric shape vocabulary already established in v1.0.

### Established Patterns
- **Stitch-first workflow** — design in Stitch with DS tokens, validate with user, only then update DESIGN.md and proceed to implementation phases.
- **Token-only constraint** — no raw hex in Stitch prompts; rely on the imported design system.

### Integration Points
- This phase produces a **design contract**, not code. The contract feeds Phase 16's `PastEditionSection.astro` prop API and Phase 20's testimonials marquee component.

</code_context>

<specifics>
## Specific Ideas

- The vertical left rail label is the signature visual device that ties the past-editions sections together — it should read as a series, not as two unrelated sections.
- Mosaic photo grid intentionally chosen over uniform 2x5 to give the 2023 section editorial weight (it carries the brand-history moment).
- Marquee direction → quote-led card → hover-pause is the minimal-chrome path that keeps the testimonials section feeling lightweight while still motion-rich.
- CFP gap-tightening is a deliberate compromise: the 2vh constraint matters because CFP conversion is a primary KPI for the homepage.

</specifics>

<deferred>
## Deferred Ideas

- **CFP countdown timer** — considered and rejected for this phase; could revisit if conversion data warrants a more urgent CFP treatment in a later milestone.
- **Two-row opposite-direction marquee** — visually richer but harms readability; deferred unless future user research shows the single row underperforms.
- **CFP track list (FinOps / Platform / Security / etc.)** — belongs in a dedicated CFP page, not the homepage band.
- **Avatar-led testimonial cards** — requires real attendee photos we don't have; revisit when real testimonials replace placeholders.

</deferred>

---

*Phase: 15-stitch-full-homepage-mock*
*Context gathered: 2026-04-13*
