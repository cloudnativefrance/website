# v1.1 Requirements — Past Editions Showcase

**Milestone:** v1.1
**Goal:** Tell the "where we come from" story on the homepage with dedicated past-edition sections (2026, 2023) plus an animated testimonials strip, and clean up the venue tab.
**Created:** 2026-04-13

> REQ-IDs use v1.1 category namespaces (`EDIT-*`, `TEST-*`, `A11Y-*`, `VENUE-*`, `I18N-*`) — independent from v1.0 IDs archived in `milestones/v1.0-REQUIREMENTS.md`.

## Active — Milestone v1.1

### Past Editions (EDIT-*)

- [ ] **EDIT-01**: User sees a "2026 edition" section on the homepage (both `/` and `/en/`) with rail label, heading, video embed, stats, photo thumbnails, and external gallery CTA — content ported from the current venue tab block (placeholder until real 2026 recap arrives)
- [ ] **EDIT-02**: User sees a "2023 edition" section on the homepage (both `/` and `/en/`) with rail label, heading, 10 pre-optimized KCD 2023 photos, external gallery CTA, and the KCD brand-history callout card
- [ ] **EDIT-03**: 2023 brand-history callout includes the KCD 2023 logo, the note "originally named Kubernetes Community Days France", and the Centre Georges Pompidou venue mention
- [ ] **EDIT-04**: Past-edition sections use a shared `PastEditionSection.astro` shell parameterized by props (rail label, heading, stats, photos, optional video, optional brand callout, optional gallery CTA)
- [ ] **EDIT-05**: User can click any 2023 photo to open it in a lightbox overlay (keyboard-accessible, Escape closes, arrow keys navigate, focus returned to trigger on close)
- [ ] **EDIT-06**: Sections render reverse-chronologically on the homepage (2026 first, 2023 second) after existing Hero / KeyNumbers / CFP sections, per Stitch-approved order
- [ ] **EDIT-07**: 2023 section ships with visibly-marked placeholder values for stats (attendees / talks / sponsors) and external gallery URL until organizer supplies final data — tracker issue logged in repo

### Testimonials (TEST-*)

- [ ] **TEST-01**: User sees a testimonials strip on the homepage (both `/` and `/en/`) rendering the 3 temporary FR placeholder quotes from inline data
- [ ] **TEST-02**: Testimonials animate in a marquee-style infinite horizontal scroll (duplicated track for seamless loop), paused on hover and on keyboard focus
- [ ] **TEST-03**: Testimonial quotes live in a typed `testimonials-data.ts` array (not CSV, not content collection) with clearly non-real attributions indicating placeholder status

### Accessibility (A11Y-*)

- [ ] **A11Y-01**: All animated content (testimonials marquee, any decorative motion) respects `prefers-reduced-motion` — animations disabled or drastically reduced when the user opts out; verified by Playwright under emulated reduced-motion media
- [ ] **A11Y-02**: Marquee duplicated track clones are `aria-hidden="true"` and `tabindex="-1"` so screen readers and tab order see only the canonical quote set once
- [ ] **A11Y-03**: Lightbox traps focus while open, restores focus to the trigger thumbnail on close, supports keyboard navigation (Esc, Arrow keys, Tab cycles within), and exposes `role="dialog"` + `aria-label`
- [ ] **A11Y-04**: All new photos and logos carry descriptive, unique `alt` text in both FR and EN (no "photo 1 / photo 2" patterns)
- [ ] **A11Y-05**: Global `prefers-reduced-motion` reset added to `src/styles/global.css` before any animated component lands (establishes baseline for current and future animations)

### Venue Cleanup (VENUE-*)

- [ ] **VENUE-01**: "Previous edition 2026" block removed from `src/pages/venue/index.astro` after the homepage 2026 section is verified live — delivered as a separate commit from the homepage addition
- [ ] **VENUE-02**: Orphaned imports, constants, and asset references (`ambiance03/06/10`, `YOUTUBE_ID`, `GALLERY_URL`, `previousStats`, `thumbnails`) removed from the venue page in the same cleanup commit
- [ ] **VENUE-03**: Deprecated `venue.prev.*` i18n keys removed from `src/i18n/ui.ts` after homepage integration verified and `grep` confirms no remaining consumers
- [ ] **VENUE-04**: Any external anchors pointing at the old venue `#previous-edition` anchor either redirect to the homepage section or are audited and confirmed absent

### Bilingual (I18N-*)

- [ ] **I18N-01**: New i18n namespaces `editions.*` and `testimonials.*` added to `src/i18n/ui.ts` with FR and EN values in the same commit (no FR-only landings hiding behind the FR fallback)
- [ ] **I18N-02**: Vitest assertion in the test suite verifies `editions.*` and `testimonials.*` key counts are identical across `fr` and `en` locales and no EN value is byte-identical to its FR counterpart (catches accidental FR copy-paste)
- [ ] **I18N-03**: KCD/CNCF brand-history wording in `editions.2023.brand_note` (FR + EN) has written sign-off from the organizer before the Phase 6 PR merges

## Future Requirements (deferred)

- Real 2026 recap content — final video, stats, and photos to replace EDIT-01 placeholders
- Real testimonial quotes — replace TEST-03 placeholders with organizer-validated quotes (potentially attributed and with avatar)
- Real 2023 stats + gallery URL — fill EDIT-07 placeholders
- Testimonials sourced from CSV or content collection (only if volume grows beyond ~10 quotes)
- Per-edition routed pages (`/editions/2023`, `/editions/2026`)

## Out of Scope

- Multi-edition archive or routed per-edition microsites — past editions remain homepage-only (per PROJECT.md)
- CSV or content-collection-backed past editions — static hardcoded content is explicit v1.1 scope
- Internationalization of testimonial quotes into EN — placeholder quotes stay FR-only until real content
- Autoplay video on past-edition sections — YouTube embed remains click-to-play as in v1.0
- Counter animations, parallax scrolling, 3D effects on past-edition sections
- Embedded Instagram / X social walls — not in milestone scope
- Past-edition CFP archives or speaker lists — focus is visual recap, not data archaeology

## Traceability

| REQ-ID | Phase | Status |
|---|---|---|
| EDIT-01 | Phase 17 | pending |
| EDIT-02 | Phase 19 | pending |
| EDIT-03 | Phase 19 | pending |
| EDIT-04 | Phase 16 | pending |
| EDIT-05 | Phase 19 | pending |
| EDIT-06 | Phase 15 | pending |
| EDIT-07 | Phase 19 | pending |
| TEST-01 | Phase 20 | pending |
| TEST-02 | Phase 20 | pending |
| TEST-03 | Phase 20 | pending |
| A11Y-01 | Phase 20 | pending |
| A11Y-02 | Phase 20 | pending |
| A11Y-03 | Phase 19 | pending |
| A11Y-04 | Phase 19 | pending |
| A11Y-05 | Phase 16 | pending |
| VENUE-01 | Phase 18 | pending |
| VENUE-02 | Phase 18 | pending |
| VENUE-03 | Phase 18 | pending |
| VENUE-04 | Phase 18 | pending |
| I18N-01 | Phase 16 | pending |
| I18N-02 | Phase 16 | pending |
| I18N-03 | Phase 19 | pending |

_Traceability populated by roadmapper 2026-04-13._
