---
phase: 19-integrate-2023-edition-section-and-lightbox
type: summary
status: complete
shipped: 2026-04-14
requirements: [EDIT-02, EDIT-03, EDIT-05, EDIT-07, A11Y-03, A11Y-04, I18N-03]
plans_shipped: 5
---

# Phase 19 Summary — Integrate 2023 Edition Section + Lightbox

**Completed:** 2026-04-14
**Status:** Complete (code shipped + static tests green; manual UAT + organizer content gates deferred)

## Overview

Shipped the dedicated `/2023` + `/en/2023` route tree with a 10-photo `astro:assets` `<Picture>` grid, KCD brand-history callout, external gallery CTA, and a keyboard-accessible `<div role="dialog">` lightbox overlay. Five sub-plans landed in 5 commits (Wave 1 scaffold → Wave 2 components → Wave 3 assembly). Homepage composition (Phase 17-04 `PastEditionMinimal` 2023 block) was left UNCHANGED — the dedicated route is additive.

## Plans

- **[19-01](19-01-SUMMARY.md)** — Scaffold `/2023` routes + extend `EDITION_2023` data (photos10, brandHistory, galleryUrl). Commit `5381719`.
- **[19-02](19-02-SUMMARY.md)** — `Edition2023PhotoGrid` + 10 unique descriptive alt keys FR+EN (A11Y-04). Commit `e00e99f`.
- **[19-03](19-03-SUMMARY.md)** — `KcdBrandHistoryCallout` component + brand-history i18n keys (I18N-03 TODO). Commit `a5b0736`.
- **[19-04](19-04-SUMMARY.md)** — `Edition2023Lightbox` Astro + vanilla TS (role=dialog, focus trap, Esc/Arrow/Tab). Commit `cce70fd`.
- **[19-05](19-05-SUMMARY.md)** — Route assembly + Vitest build tests + UAT + gates + VALIDATION. Commit `54b9dab`.

## Requirements Disposition

Per `v1.1-MILESTONE-AUDIT.md §1`:

| REQ-ID | Disposition | Note |
|--------|-------------|------|
| EDIT-02 | Complete | `/2023` + `/en/2023` 10-photo grid shipped; homepage compact block preserved. |
| EDIT-03 | Complete (structure) / ⚠ copy | Callout structure + logo + Pompidou mention shipped; exact FR+EN wording pending organizer (I18N-03). |
| EDIT-05 | Complete (static a11y) / ⚠ manual UAT | Static `role="dialog"` + focus-trap + Esc/Arrow/Tab assertions pass; 10-item manual keyboard journey deferred to Phase 22. |
| EDIT-07 | Complete (placeholder flagged) | `galleryPlaceholder: true`, tracker URL, visible PLACEHOLDER badge; real stats + gallery URL pending organizer. |
| A11Y-03 | Complete (static) | Dialog/aria-modal/focus-trap contract tested; browser keyboard UAT → Phase 22. |
| A11Y-04 | Complete | 10 unique descriptive alts FR+EN; banned `"Photo N"` patterns purged; legacy `thumbnail_alt.*` rewritten. |
| I18N-03 | ⚠ pending | Placeholder copy shipped under `TODO(19) I18N-03` markers at `src/i18n/ui.ts:254` + `:542` — organizer sign-off outstanding. |

## Content Gates Still Open

Copied verbatim from [`content-gates.md`](content-gates.md):

1. **KCD brand-history copy (I18N-03)** — placeholder awaiting organizer review at `src/i18n/ui.ts` `editions.2023.brand_history.body` FR+EN. Tracker: github issues/19.
2. **2023 stats verification (EDIT-07)** — values 1700+/42/24 ported from existing keys; organizer must confirm attendee/speaker/session counts. Tracker: github issues/19.
3. **Real photo-gallery URL (EDIT-07)** — currently points at YouTube playlist as interim target with `galleryPlaceholder: true`. Organizer to supply authoritative URL. Tracker: github issues/19.
4. **Stitch visual approval for `/2023` (D-03)** — Outstanding per CLAUDE.md Stitch-first rule; captured in Phase 22.

## Validation

`19-VALIDATION.md` maps all 5 success criteria to evidence. SC1 (route structure), SC4 (unique descriptive alts), SC5 (placeholder flags) all PASS via static build tests. SC2 (brand-history callout) PARTIAL — structural green, exact wording content-gated. SC3 (lightbox keyboard journey) PASS static + manual UAT deferred to Phase 22. `pnpm build` GREEN (156 pages); `pnpm test` 160/165 with 5 pre-existing SPKR-01 carry-over failures documented in STATE.md.

## Placeholders Awaiting Sign-Off

- **I18N-03** — KCD brand-history FR+EN copy (organizer).
- **EDIT-07** — 2023 stats (attendees / speakers / sessions).
- **EDIT-07** — Real 2023 photo-gallery URL.
- **D-03** — Stitch visual approval for `/2023` + `/en/2023`.
- **A11Y-03 / EDIT-05** — 10 manual lightbox keyboard-journey UAT items (`19-UAT.md`).

## Downstream Impact

- **Phase 21-02** wires the homepage `PastEditionMinimal` 2023 block to `/2023` + `/en/2023` (new "View 2023 edition →" CTA) so the discovery loop is complete — consumes the route delivered by this phase.
- **Phase 22** closes the 10 manual lightbox keyboard UAT items, captures Stitch approval for `/2023`, and records Lighthouse CLS ≤ 0.02 on the new routes.
