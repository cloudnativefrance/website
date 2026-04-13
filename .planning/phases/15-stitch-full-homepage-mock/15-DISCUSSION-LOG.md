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
