# Phase 23: Edition 2026 Combined Section - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-18
**Phase:** 23-edition-2026-combined-section
**Areas discussed:** Section layout & order, Photo handling, Testimonial cards, CTA placement & replays URL

---

## Section Layout & Order

| Option | Description | Selected |
|--------|-------------|----------|
| Photos → Video → CTAs → Testimonials | Top photos as hook, video below, CTAs, testimonials. Conversion funnel. | |
| Video hero → Photos → Testimonials → CTAs | Film as hero drawing attention, photos supporting, social proof, then conversion. | |
| Two-column: Video + Photos side by side → CTAs → Testimonials | Desktop 2-col, stacks on mobile. More compact. | |
| You decide based on Stitch mockup | Defer to validated Stitch "Homepage Mockup v2 — Restructured Sections". | ✓ |

**User's choice:** Stitch mockup
**Notes:** Stitch-first rule applies — UI-SPEC phase will capture exact layout from the validated mockup.

---

## Photo Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Trim data to 3 photos | Remove one thumbnail from EDITION_2026.thumbnails; cleaner. | ✓ |
| Keep 4 in data, render 3 in component | Component slices. | |
| Show all 4 photos | Reinterpret ED26-01 as "3-4 photos". | |
| You decide | — | |

**User's choice:** Trim data to 3 photos

### Photo Pick (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| 03, 08, 10 (drop 06) | Strongest crowd/ambiance shots. | |
| 03, 06, 08 (drop 10) | Keep first 3 in current order. | |
| Keep current order, drop any 1 | Defer exact pick. | ✓ (user selected "drop 08") |

**User's choice:** Drop ambiance-08 → final set = ambiance-03, ambiance-06, ambiance-10
**Notes:** User typed "drop 08" in the Other field with notes "drop 08".

---

## Testimonial Cards

| Option | Description | Selected |
|--------|-------------|----------|
| Static 3-col grid (stacks on mobile) | Simple responsive grid, reuse existing card styling. | |
| Static cards + subtle hover lift | Grid with hover shadow/translate micro-interaction. | |
| Horizontal scroll strip (no animation) | overflow-x-auto with scroll-snap. | |
| You decide based on Stitch mockup | Defer to validated Stitch layout. | ✓ |

**User's choice:** Stitch mockup
**Notes:** Stitch-first rule — UI-SPEC will define testimonial card visual treatment.

---

## CTA Placement & Replays URL

### Replays URL Availability

| Option | Description | Selected |
|--------|-------------|----------|
| I'll provide the URL now | Direct input. | ✓ |
| Use 2023 playlist as temporary fallback | Interim URL with placeholder flag. | |
| Use placeholder anchor + content-gate flag | Link to channel with tracker. | |
| Skip the replays CTA for now | Defer ED26-02. | |

**User's choice:** Provided URL. First attempt: `https://www.youtube.com/@CloudNativeDaysFR/playlists` (channel landing). After clarification, user provided specific 2026 playlist: `https://www.youtube.com/watch?v=lJXUhqHWCDo&list=PLmZ3gFl2Aqt_4_F40zEoUEweEctmtx4p2`.
**Notes:** Use the `list=` portion when constructing the playlist URL in data module.

### CTA Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated CTA row below the video | Two inline anchors under the embed. | |
| Replays under video, PDF at section bottom | Mixed visual weights. | |
| Both at the very bottom of the section | Trailing CTA block. | |
| You decide based on Stitch mockup | Defer to UI-SPEC. | ✓ |

**User's choice:** Stitch mockup
**Notes:** Stitch-first rule — UI-SPEC will define CTA placement.

---

## Claude's Discretion

- Layout / stacking order → UI-SPEC
- Testimonial card visual treatment → UI-SPEC
- CTA placement and grouping → UI-SPEC
- Stats row inclusion (1700+ / 50+ / 40+) → UI-SPEC decides based on Stitch reference
- Photo mosaic sizing (hero/medium/small) → UI-SPEC
- Heading copy and rail label → UI-SPEC
- Loading / empty states → none needed (data is imported at build)

## Deferred Ideas

- Hero background image (`ambiance-00.jpg`) — ready for Phase 25 (HERO-01). Out of scope here.
- Real attendee testimonials (CONT-01) — placeholder copy retained in this phase; v2 content cycle will replace.
- Homepage wiring (import swap, section reorder) — Phase 26 handles atomically across FR + EN homepages.
