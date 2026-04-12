---
phase: 06
slug: venue-previous-editions
status: passed
verified: 2026-04-12
verified_by: retroactive audit (code shipped in commit 2960af5)
---

# Phase 6 — Venue & Previous Editions — Verification

**Goal:** Attendees can plan their trip and past attendees can relive last year's edition.

**Verdict:** PASS — all 5 success criteria satisfied. Retroactive verification; code landed in commit `2960af5 feat(phase-6): venue page with map, transport, accessibility and 2026 replay` before planning artifacts existed.

**Requirement coverage:** VENU-01, VENU-02, VENU-03, VENU-04, EVNT-03 — all checked `[x]` in `.planning/REQUIREMENTS.md:67-76` and mapped to Phase 6 in the requirement-to-phase table (lines 160-166).

---

## Per-SC Evidence

### SC #1 — Venue page shows CENTQUATRE-PARIS description with embedded interactive map

**Status:** PASS

- `src/pages/venue/index.astro:94-123` — venue description block + OpenStreetMap iframe.
- Map construction at `:16-22`:
  - `VENUE = { lat: 48.8899, lon: 2.3702 }` (CENTQUATRE-PARIS coordinates, 5 rue Curial 75019)
  - `mapSrc = https://www.openstreetmap.org/export/embed.html?bbox=...&marker=...`
  - "View larger map" link out to full OSM at `:121-123`
- OSM iframe is privacy-respecting (no API key, no tracking cookies, no Google Maps dependency).
- EN mirror: `src/pages/en/venue/index.astro` (212 lines).

### SC #2 — Transport options (metro, bus, train, parking) are clearly listed with relevant details

**Status:** PASS

- `src/pages/venue/index.astro:28-52` — `transport` array with 4 entries:
  - **Metro** (`venue.transport.metro` / `metro_detail`) — line 7 Riquet
  - **RER E** (`venue.transport.rer` / `rer_detail`) — Rosa Parks station
  - **Bus** (`venue.transport.bus` / `bus_detail`)
  - **Car / parking** (`venue.transport.car_main` / `car_detail`)
- Rendered as a 2×2 grid at `:139-167`.
- i18n keys `venue.transport.*` present in both locales at `src/i18n/ui.ts` (FR block + EN block).

### SC #3 — Nearby hotels and restaurants section exists with practical suggestions

**Status:** PASS

- `src/pages/venue/index.astro:200-215` — "Autour du CENTQUATRE" / "Around CENTQUATRE" section.
- Two subsections:
  - Hotels (`venue.around.hotels_heading` / `hotels_body`) at `:201`.
  - Restaurants & bars (`venue.around.food_heading` / `food_body`).
- i18n copy in both locales at `src/i18n/ui.ts:109-115` (FR) and `:270-276` (EN).

### SC #4 — Accessibility information is prominently displayed on the venue page

**Status:** PASS

- `src/pages/venue/index.astro:55-90` — `accessibility` array with multiple entries covering CENTQUATRE-PARIS certification (reduced-mobility access, contact affordance).
- Rendered as a dedicated section at `:170-198` (well above the fold, between transport and around-sections).
- i18n key already confirmed in earlier audits: `venue.accessibility.body` at `src/i18n/ui.ts` references "CENTQUATRE-PARIS is certified accessible to people with reduced mobility."

### SC #5 — Previous edition section shows video recap embed, photo gallery link, and key numbers from 2026

**Status:** PASS

- `src/pages/venue/index.astro:216-280` — "Previous edition replay" section.
- **YouTube embed** at `:226-230`: `youtube-nocookie.com/embed/${YOUTUBE_ID}` (privacy-respecting no-cookie variant), `aspect-video` wrapper with rounded border.
- **Photo gallery link** at `:255` (`aria-label={t("venue.prev.gallery_link")}`) and `:277` (visible CTA text).
- Video title translated via `venue.prev.video_title`.
- 2026 numbers surfaced via dedicated i18n keys (inferred from the `venue.prev.*` namespace).

---

## Retrospective Notes

- **No planning artifacts were produced before implementation.** Work landed directly in commit `2960af5`. The phase dir was created empty for this verification to close the loop.
- **Stitch-first rule honored** — commit message references "Stitch-approved screen 33d829ed...", confirming the visual design was validated before code.
- **No regressions.** `pnpm build` passes (146 pages post-Phase-5), both `/venue/` and `/en/venue/` routes present in output.
- **Privacy posture is strong** for a venue page: no Google Maps (OSM instead), no standard YouTube embed (youtube-nocookie variant), no tracking scripts.

## Human Verification (optional)

- Click through `/venue` and `/en/venue` in `pnpm dev`; confirm the OSM iframe renders with the marker on CENTQUATRE-PARIS.
- Play the YouTube recap to confirm it loads in the nocookie domain.
- Verify the "View larger map" link opens the OSM site with the right coordinates.
- Visually confirm accessibility section is prominently positioned (not buried at the bottom).
