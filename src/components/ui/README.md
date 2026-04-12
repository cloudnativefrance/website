# shadcn/ui components

Components in this directory are installed via the shadcn CLI and customised to match the CND France design system (DESIGN.md, Phase 1).

## Retention notes (Phase 10, D-09)

Some components are intentionally retained even if not yet consumed by a page:

| Component | Status | Intended consumers |
|-----------|--------|-------------------|
| `button.tsx`    | In use | Hero CTAs, Navigation Register CTA |
| `badge.tsx`     | In use | Speaker keynote badge, talk tracks |
| `card.tsx`      | Retained (no current consumer) | Phase 5 (Sponsor tiers, Team members), Phase 6 (Venue info blocks), Phase 7 (Schedule talk cards) |
| `separator.tsx` | Retained (no current consumer) | Phase 5 (Team section dividers), Phase 6 (Venue section dividers), Phase 7 (Schedule day dividers) |

Per Phase 10 decision D-09, `card.tsx` and `separator.tsx` are kept in place rather than removed; re-installing them later via `npx shadcn@latest add` would re-introduce the same components without our design-system customisations.

Do not delete or modify these files outside of their owning future phases.
