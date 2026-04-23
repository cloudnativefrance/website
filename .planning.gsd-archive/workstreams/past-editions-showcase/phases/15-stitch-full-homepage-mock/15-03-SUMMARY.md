---
phase: 15-stitch-full-homepage-mock
plan: 03
completed: 2026-04-13
status: approved
---

# 15-03 Summary — Testimonials Marquee Detail

## Approved Artifact

- **Marquee screen (desktop + mobile side-by-side):** `53f270cebda347c98a08d680db43dac8` ("Testimonials Marquee Comparison")
- **Project:** `14858529831105057917` — **Design system:** `3926684191749761173`

## Iteration Count

1 iteration (generated, approved without revisions).

## Decisions Amended During Review

None. D-07, D-08, D-09 carried verbatim from 15-CONTEXT.md.

## Locked Marquee Contract

| Aspect | Specification |
|--------|---------------|
| Direction (D-07) | Right → Left, slow drift, ~40s loop, single row |
| Card style (D-08) | Quote-led. Card token bg, 1px Border, radius-lg (~8px), ~32px padding. Width ~340px desktop / ~280px mobile. Opening quote glyph (Muted Foreground, ~40% opacity), quote text ~20px Foreground medium, attribution "Prénom N. — Rôle" ~14px Muted. NO avatars. |
| Pause affordance (D-09) | Hover / focus-within only. No visible pause button. On hover: border → Primary Blue at 50%, shadow intensifies. `prefers-reduced-motion` handled globally (Phase 16). |
| Edge fades | Background-token gradients (~40-60px wide) on both horizontal edges |
| Gap between cards | ~24px |

## Downstream Consumer

- Phase 20 — Animated Testimonials Strip implementation will honor this visual contract.
- Plan 15-04 — DESIGN.md update will inline this marquee screen ID.
