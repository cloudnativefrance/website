---
phase: 15-stitch-full-homepage-mock
plan: 02
completed: 2026-04-13
status: approved
---

# 15-02 Summary — 2026 + 2023 Variant Detail Screens

## Approved Artifacts

- **2026 variant — desktop:** `94b59cfb77ea4a3f9ff88c5c83c2d199` ("Edition 2026 — Desktop comparison")
- **2026 variant — mobile:** `ca4bff97fca241d6b7ba4e9892f8458c` ("Edition 2026 — Mobile comparison")
- **2023 variant — desktop + mobile side-by-side:** `9b0c7dd494534b44a602ad22e7db9121` ("Edition 2023 Comparison (Desktop & Mobile)")
- **Project:** `14858529831105057917` — **Design system:** `3926684191749761173`

## Iteration Count

1 iteration per variant (generated, approved without revisions).

## Decisions Amended During Review

None. D-01..D-06 + D-13 carried verbatim from 15-CONTEXT.md into both variants.

## Shared-Shell Confirmation

Both variants follow D-01 vertical order (rail → h2 → stats → media → optional callout) and D-02 left-rail treatment (rotated -90deg, uppercase, 0.05em tracking, Muted Foreground). Rails read as siblings — this locks the `PastEditionSection.astro` prop API contract for Phase 16.

## Variant Differences (Locked)

| Element | 2026 | 2023 |
|---------|------|------|
| Rail label | EDITION 2026 | EDITION 2023 |
| Media | Single video embed | Mosaic photos (D-04 2+3+5) + featured video (D-13) |
| Placeholder badge | Yes — Accent Pink top-right (D-06) | No |
| Brand callout | None | Full-width KCD band below video (D-05) |

## Downstream Consumers

- Phase 16 — `PastEditionSection.astro` shared-shell prop API
- Phase 17 — 2026 integration (uses 2026 variant contract + placeholder badge)
- Phase 19 — 2023 integration (uses 2023 variant contract + mosaic + featured video + playlist link + lightbox wiring)
- Plan 15-04 — DESIGN.md update will inline all three variant screen IDs
