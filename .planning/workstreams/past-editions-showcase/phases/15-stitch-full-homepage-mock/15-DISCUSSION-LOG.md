# Phase 15: Stitch Full-Homepage Mock - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-13
**Phase:** 15-stitch-full-homepage-mock
**Areas discussed:** Shared-shell rhythm, 2026 vs 2023 variants, Testimonials marquee design, CFP placement & density

---

## Gray Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Shared-shell rhythm | Vertical order / rail / spacing inside PastEditionSection | ✓ |
| 2026 vs 2023 variants | Differences between editions | ✓ |
| Testimonials marquee design | Direction, card, pause | ✓ |
| CFP placement & density | Layout + 2vh constraint | ✓ |

---

## Shared-Shell Rhythm

### Q1: Vertical order inside PastEditionSection

| Option | Description | Selected |
|--------|-------------|----------|
| Rail → h2 → stats → media → callout (Recommended) | Stats anchor heading; media in middle; callout closes | ✓ |
| Rail → h2 → media → stats → callout | Media leads; stats payoff below | |
| Rail → h2 → stats+media side-by-side → callout | Two-column desktop, stack mobile | |

**User's choice:** Rail → h2 → stats → media → callout

### Q2: Rail label style

| Option | Description | Selected |
|--------|-------------|----------|
| Vertical left rail (Recommended) | Rotated text down left edge — distinctive | ✓ |
| Horizontal eyebrow above h2 | Conventional small-caps line | |
| Pill / tag chip | Year tag pill above h2 | |

**User's choice:** Vertical left rail

### Q3: Section gap

| Option | Description | Selected |
|--------|-------------|----------|
| Generous 96/64px (Recommended) | Each section feels its own scene | ✓ |
| Tight 64/48px | Denser; helps CFP fit 2vh | |
| Mixed (tight after Hero, generous between editions) | Best of both | |

**User's choice:** Generous 96/64px (later refined to "mixed" via D-11 to satisfy CFP 2vh constraint)

---

## 2026 vs 2023 Variants

### Q1: 2023 photo grid layout

| Option | Description | Selected |
|--------|-------------|----------|
| Uniform 2x5 / 5x2 grid (Recommended) | Calm rhythm, predictable | |
| Asymmetric / mosaic | Editorial; hero + supporting tiles | ✓ |
| Horizontal scroll strip | Mobile-native single row | |

**User's choice:** Asymmetric / mosaic

### Q2: KCD brand-history callout placement

| Option | Description | Selected |
|--------|-------------|----------|
| Below photos, full-width band (Recommended) | "Why this matters" closer | ✓ |
| Side panel next to stats | Tighter; weaker on mobile | |
| Inline pill above stats | Compact badge; less storytelling | |

**User's choice:** Below photos, full-width band

### Q3: 2026 placeholder badge in mock

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, visible PLACEHOLDER badge (Recommended) | Mock shows dev/staging treatment | ✓ |
| No, show as final-looking | Polished only | |

**User's choice:** Visible PLACEHOLDER badge

---

## Testimonials Marquee

### Q1: Direction & speed

| Option | Description | Selected |
|--------|-------------|----------|
| Right → Left, slow drift (Recommended) | Conventional reading flow, ~40s loop | ✓ |
| Left → Right, slow drift | Reverses reading flow | |
| Two rows opposite directions | More motion, harder to read | |

**User's choice:** Right → Left, slow drift

### Q2: Card style

| Option | Description | Selected |
|--------|-------------|----------|
| Quote-led (Recommended) | Large quote, small attribution | ✓ |
| Author-led | Avatar + name prominent (we don't have avatars) | |
| Minimal quote-only | No card border | |

**User's choice:** Quote-led

### Q3: Pause affordance

| Option | Description | Selected |
|--------|-------------|----------|
| Pause on hover/focus only (Recommended) | Minimal chrome | ✓ |
| Visible pause/play button | More discoverable | |
| Both | Maximally accessible | |

**User's choice:** Pause on hover/focus only

---

## CFP Placement & Density

### Q1: CFP layout feel

| Option | Description | Selected |
|--------|-------------|----------|
| Compact band (Recommended) | Headline + dates + CTA in one row | ✓ |
| Card with copy + tracks list + CTA | More informative; taller | |
| Split: copy left / countdown right | Adds urgency; needs JS | |

**User's choice:** Compact band

### Q2: Resolving 2vh gap conflict

| Option | Description | Selected |
|--------|-------------|----------|
| Tighten gaps before CFP only (Recommended) | 48px mobile Hero→CFP, 64px below | ✓ |
| Keep generous gaps everywhere | Treat 2vh as soft | |
| Compact KeyNumbers row | Shrink stats vertical footprint | |

**User's choice:** Tighten gaps before CFP only

---

## Claude's Discretion

- Stat-row layout (3-up inline vs grid)
- Mosaic photo arrangement specifics (which tiles are "hero")
- Placeholder badge color/position within DS palette
- Marquee card padding, border radius, shadow level
- CFP CTA copy reservation (copy itself is locked elsewhere)

## Deferred Ideas

- CFP countdown timer
- Two-row opposite-direction marquee
- CFP track list on homepage
- Avatar-led testimonial cards (until real testimonials arrive)

---

## Execution Log

### 2026-04-13 — 15-01 Task 1: Full-homepage mock generated

- **Stitch screen ID:** `f05b5cf59da64439bbbde201f90c5c22`
- **Project:** `14858529831105057917` (Cloud Native Days France 2027)
- **Design system:** `3926684191749761173` (token-only prompt, no raw hex injected)
- **Device:** MOBILE (390x844 target)
- **Prompt:** full homepage (Hero → KeyNumbers → CFP → 2026 → 2023 → Testimonials → Footer) with D-01..D-12 locked decisions verbatim. CFP compact band, 48px Hero→KeyNumbers→CFP mobile gaps (D-11), 64px below (D-03), vertical left rail labels (D-02), asymmetric 2+3+5 mosaic (D-04), full-width KCD callout band (D-05), PLACEHOLDER pink badge on 2026 (D-06), right-to-left quote-led marquee with hover-pause hint (D-07/D-08/D-09).
- **Preview:** open the Stitch canvas for project 14858529831105057917 and select screen `f05b5cf59da64439bbbde201f90c5c22`.
- **Iteration:** 1 (awaiting user approval).

### 2026-04-13 — 15-01 Iteration 2: Add featured video to 2023 section (D-13)

- **Trigger:** User surfaced YouTube playlist `PLmZ3gFl2Aqt_Qo4EAITE1ewy1ww5jkU2h` for 2023 sessions. New decision D-13 recorded in 15-CONTEXT.md: one featured video embed between the 10-photo mosaic and the KCD callout, with "Watch all 2023 sessions →" link to the playlist.
- **Previous screen:** `f05b5cf59da64439bbbde201f90c5c22` (iteration 1)
- **New screen (current):** `e23cde61c70c4b80b4e4d10fbfd9a14e` ("Mobile Homepage — Updated 2023 Section")
- **Changes:** 2023 section now shows photos → featured video thumbnail (16:9, Card surface, play-button overlay, Muted caption) → "Watch all 2023 sessions →" Primary Blue link → KCD history band. 64px vertical rhythm preserved. Other sections unchanged.

### 2026-04-13 — 15-01 approved (screen e23cde61c70c4b80b4e4d10fbfd9a14e)

User explicitly approved Stitch screen e23cde61c70c4b80b4e4d10fbfd9a14e as the locked full-homepage visual contract for v1.1. All 10 checklist points + D-13 video addition confirmed. Iteration count: 2 (initial generation + D-13 video insertion).

### 2026-04-13 — 15-02 Tasks 1+2: Variant detail screens generated

- **2026 variant (desktop):** `94b59cfb77ea4a3f9ff88c5c83c2d199` — "Edition 2026 — Desktop comparison"
- **2026 variant (mobile):** `ca4bff97fca241d6b7ba4e9892f8458c` — "Edition 2026 — Mobile comparison"
- **2023 variant (desktop + mobile side-by-side):** `9b0c7dd494534b44a602ad22e7db9121` — "Edition 2023 Comparison (Desktop & Mobile)"
- **Shared-shell locked:** all three screens follow D-01 vertical order (rail → h2 → stats → media → [callout]) and D-02 left-rail treatment (rotated -90deg, Muted Foreground, 0.05em tracking).
- **Variant-specific:** 2026 has PLACEHOLDER pink badge (D-06) + video media, no callout; 2023 has mosaic photos (D-04) + featured video (D-13) + full-width KCD callout band (D-05).
- **Iteration:** 1 (awaiting user approval).

### 2026-04-13 — 15-03 Task 1: Testimonials marquee detail generated

- **Marquee screen (desktop + mobile side-by-side):** `53f270cebda347c98a08d680db43dac8` — "Testimonials Marquee Comparison"
- D-07 locked: right-to-left drift, ~40s loop, single row.
- D-08 locked: quote-led cards (~340px desktop / ~280px mobile), opening quote glyph, Foreground quote text, small Muted attribution "Prénom N. — Rôle", no avatars.
- D-09 locked: no visible pause button; one card shown in hover state (Primary Blue border at 50% + stronger shadow) with annotation "Marquee pauses on :hover and :focus-within. No pause button. Reduced-motion handled globally."
- **Iteration:** 1 (awaiting user approval).

### 2026-04-13 — 15-02 approved (screens 94b59cfb77ea4a3f9ff88c5c83c2d199, ca4bff97fca241d6b7ba4e9892f8458c, 9b0c7dd494534b44a602ad22e7db9121)

User explicitly approved both variant detail screens. 2026 variant desktop 94b59cfb77ea4a3f9ff88c5c83c2d199 + mobile ca4bff97fca241d6b7ba4e9892f8458c; 2023 variant 9b0c7dd494534b44a602ad22e7db9121. Shared-shell rhythm confirmed — rails read as siblings, D-01..D-06 + D-13 all locked.

### 2026-04-13 — 15-03 approved (screen 53f270cebda347c98a08d680db43dac8)

User explicitly approved testimonials marquee detail screen 53f270cebda347c98a08d680db43dac8. D-07 direction, D-08 quote-led card style, D-09 hover-pause affordance all locked.
