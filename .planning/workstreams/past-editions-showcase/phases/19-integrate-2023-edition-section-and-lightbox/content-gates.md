# Phase 19 — Content Gates (awaiting sign-off)

Each item below ships with a clearly-labelled `TODO(19)` placeholder in source + a tracker URL. None of these block the phase from merging to `phase-19` branch, but **all three must be resolved before the dedicated `/2023` page is announced publicly**.

## 1. KCD brand-history copy (I18N-03)

- **Status:** PLACEHOLDER awaiting organizer review
- **Locations:**
  - `src/i18n/ui.ts` → `editions.2023.brand_history.body` (FR) — prefixed `TODO(19) I18N-03 — placeholder en attente de la relecture organisateur`
  - `src/i18n/ui.ts` → `editions.2023.brand_history.body` (EN) — prefixed `TODO(19) I18N-03 — placeholder awaiting organizer review`
- **Required:** Organizer (@cloudnativefrance maintainers) reviews the exact wording around:
  - "originally named Kubernetes Community Days France"
  - The 2026 rebrand rationale ("reflect the breadth of the French-speaking cloud-native ecosystem")
- **Owner:** Organizer team
- **Tracker:** https://github.com/cloudnativefrance/website/issues/19 (subtask — brand-history copy)

## 2. 2023 stats — participants / speakers / sessions (EDIT-07)

- **Status:** Values (1 700+ / 42 / 24) ported from existing `editions.2023.stats.*` keys; these are reasonable but not independently verified
- **Location:** `src/lib/editions-data.ts` → `EDITION_2023.stats`
- **Required:** Organizer confirms exact attendee / speaker / session counts for KCD France 2023, or flags these for revision
- **Owner:** Organizer team
- **Tracker:** https://github.com/cloudnativefrance/website/issues/19 (subtask — stats verification)

## 3. Real photo-gallery URL (EDIT-07)

- **Status:** `EDITION_2023.galleryUrl` currently points to the YouTube playlist (reasonable interim target); `galleryPlaceholder: true` + visible PLACEHOLDER badge signals "not final"
- **Location:** `src/lib/editions-data.ts` → `EDITION_2023.galleryUrl` / `galleryPlaceholder` / `trackerUrl`
- **Required:** Organizer provides the authoritative 2023 photo-gallery URL (Ente, Flickr, Google Photos, etc.) → replace `galleryUrl` and flip `galleryPlaceholder` to `false`
- **Owner:** Organizer team
- **Tracker:** https://github.com/cloudnativefrance/website/issues/19 (subtask — gallery URL)

## 4. Stitch visual approval for `/2023` page (D-03)

- **Status:** OUTSTANDING — per CLAUDE.md Stitch-first rule
- **Required:** User reviews the live `/2023` + `/en/2023` worktree build and either approves the visual rhythm as-is or requests a Stitch round-trip before merge
- **Owner:** User (project lead)
- **Tracker:** (no issue; resolved in-PR review)
