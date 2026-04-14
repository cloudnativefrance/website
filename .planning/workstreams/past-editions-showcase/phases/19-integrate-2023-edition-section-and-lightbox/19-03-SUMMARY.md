---
phase: 19-integrate-2023-edition-section-and-lightbox
plan: 03
type: summary
status: complete
shipped: 2026-04-14
requirements: [EDIT-03, I18N-03]
---

# 19-03 Summary — `KcdBrandHistoryCallout` component + brand-history i18n keys

## What Shipped

- New `src/components/past-editions/KcdBrandHistoryCallout.astro` — KCD 2023 logo (astro:assets `<Image>` + descriptive alt) + heading + body + venue mention, in the Stitch 15 secondary-tone band rhythm (logo left, body right).
- FR+EN keys `editions.2023.brand_history.heading`, `.body`, `.venue` in `src/i18n/ui.ts`:
  - EN body: contains "originally named Kubernetes Community Days France".
  - FR body: French counterpart.
  - Venue copy mentions Centre Georges Pompidou (FR+EN).
- Placeholder copy prefixed with `TODO(19) I18N-03 — placeholder …` markers referencing `content-gates.md`.

## Commits

- `a5b0736` feat(19-03): KcdBrandHistoryCallout component + brand-history i18n keys FR+EN (I18N-03 TODO)

## Validation

`19-VALIDATION.md` SC2 — PARTIAL: static structure asserted (logo + "originally named Kubernetes Community Days France" + Centre Georges Pompidou present); exact wording PENDING organizer sign-off (content gate).

## Content Gates / Placeholders

- **I18N-03 — KCD brand-history FR+EN copy** pending organizer review (see `content-gates.md` §1). TODO markers at `src/i18n/ui.ts:254` (FR) and `:542` (EN).

## Downstream Impact

- 19-05 mounts the callout inside `/2023` + `/en/2023` route assembly.
- Phase 22 captures Stitch visual approval for the full `/2023` page including this band.
