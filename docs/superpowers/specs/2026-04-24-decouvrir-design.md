# Design spec — "Discover CND France" page

**Date:** 2026-04-24
**Issue:** CLO-52
**Owner:** Katia
**Status:** Approved, ready for implementation

---

## Context

The site has no page summarising what the event is: its values, its audience, and its atmosphere. This page fills that gap and serves as the entry point for visitors discovering CND France for the first time.

---

## Routes

| Locale | URL | File |
|--------|-----|------|
| French | `/decouvrir` | `src/pages/decouvrir.astro` |
| English | `/en/discover` | `src/pages/en/discover.astro` |

`hreflang` `fr`/`en` declared in `<head>` via the existing `Layout`. Same pattern as all other bilingual pages on the site.

---

## Page architecture

Single scrollable page. No submenu. HTML anchor IDs on each section (`id="photos"`, `id="values"`, etc.) for deep-linking.

Five sections in order:

### 1. Hero — Behind-the-scenes video

- Full-width YouTube iframe embed (video `A51PGVvrt_8`), 16:9 ratio
- Centered `<h1>` above or overlaid: "Découvrir CND France" / "Discover CND France"
- Subtitle placeholder: "L'événement cloud-native de référence en France" / "The reference cloud-native event in France"
- Component: `DiscoverVideoHero.astro`

### 2. 2026 ambiance photo gallery

- Source: `src/assets/photos/ambiance/` (11 files: `ambiance-00.jpg` to `ambiance-10.jpg`)
- Rendering: Astro `<Image>` with `widths` and `sizes` for responsive output
- Layout: CSS masonry grid — 3 columns desktop, 2 tablet, 1 mobile
- Lightbox on click (native `<dialog>`, no heavy dependency)
- Technical note: designed for future migration to self-hosted storage (CLO-13) — images stay as local imports, no external URLs
- Component: `PhotoGallery.astro`

### 3. Approach & values

- Two columns: text left, icons right (desktop) / stacked mobile
- Placeholder text (~80 words) covering: open source, CNCF ecosystem, digital sovereignty, diversity & inclusion, community first
- 2026 key numbers strip directly below the text: `2,000 participants · 50+ talks · 30+ speakers · 2 tracks`
- Slightly distinct background from page bg (token `card`)
- Component: `DiscoverValues.astro`

### 4. Who is it for?

- 3 profile cards in a horizontal grid (desktop) / stacked mobile:
  - **Developer** — Kubernetes, WASM, applied AI
  - **Ops / SRE** — Observability, Platform Engineering, FinOps
  - **Tech Lead / Architect** — Cloud strategy, distributed patterns, governance
- Each card: icon + title + 2-3 typical topics (placeholder)
- Component: `AudienceProfiles.astro`

### 5. 2026 Replays

- Section title: "Les talks 2026" / "2026 talks"
- Grid of 6 YouTube thumbnails (playlist `PLmZ3gFl2Aqt_4_F40zEoUEweEctmtx4p2`)
- Thumbnail URL pattern: `https://img.youtube.com/vi/{VIDEO_ID}/hqdefault.jpg`
- On hover: overlay with talk title
- CTA below: "Voir tous les replays →" / "Watch all replays →" pointing to `/replays`
- The 6 videos are defined statically in `src/data/replays.ts` (array of `{ id, title }`) — no YouTube API fetch, avoids quota issues. Initial selection: first 6 videos from playlist `PLmZ3gFl2Aqt_4_F40zEoUEweEctmtx4p2`, to be curated manually.
- Component: `ReplayGrid.astro`

---

## Navigation

- "Découvrir" / "Discover" link added to the main nav between Home and Programme (when Programme is published)
- "Découvrir l'événement" / "Discover the event" CTA on the homepage hero section (secondary button alongside the primary CTA)
- No submenu, no programme section on this page (the nav will have a dedicated Programme tab in 2027)

---

## i18n

Key prefix: `discover.*`

| Key | FR | EN |
|-----|----|----|
| `discover.page.title` | Découvrir CND France | Discover CND France |
| `discover.page.description` | L'événement cloud-native... | The cloud-native event... |
| `discover.hero.title` | Découvrir CND France | Discover CND France |
| `discover.hero.subtitle` | L'événement cloud-native de référence en France | The reference cloud-native event in France |
| `discover.gallery.title` | L'ambiance 2026 en images | 2026 in pictures |
| `discover.values.title` | Notre démarche | Our approach |
| `discover.values.body` | (placeholder ~80 words) | (placeholder ~80 words) |
| `discover.stats.participants` | participants | participants |
| `discover.stats.talks` | talks | talks |
| `discover.stats.speakers` | speakers | speakers |
| `discover.stats.tracks` | tracks | tracks |
| `discover.audience.title` | À qui ça s'adresse ? | Who is it for? |
| `discover.audience.dev.title` | Développeur·se | Developer |
| `discover.audience.dev.topics` | Kubernetes · WASM · IA | Kubernetes · WASM · AI |
| `discover.audience.ops.title` | Ops / SRE | Ops / SRE |
| `discover.audience.ops.topics` | Observabilité · Platform Eng · FinOps | Observability · Platform Eng · FinOps |
| `discover.audience.lead.title` | Tech Lead / Architecte | Tech Lead / Architect |
| `discover.audience.lead.topics` | Stratégie cloud · Patterns · Gouvernance | Cloud strategy · Patterns · Governance |
| `discover.replays.title` | Les talks 2026 | 2026 talks |
| `discover.replays.cta` | Voir tous les replays | Watch all replays |

---

## Components

All created under `src/components/discover/`:

| Component | Type | Reusable elsewhere |
|-----------|------|--------------------|
| `DiscoverVideoHero.astro` | Astro | Potentially team page (CLO-24) |
| `PhotoGallery.astro` | Astro | Yes — parameterised by folder |
| `DiscoverValues.astro` | Astro | No |
| `AudienceProfiles.astro` | Astro | No |
| `ReplayGrid.astro` | Astro | Yes — /replays page |

---

## Dependencies and non-dependencies

- **CLO-13** (self-hosted gallery): non-blocking. Gallery starts with local assets. Future migration = swap the source in `PhotoGallery.astro`.
- **CLO-14** (replays): non-blocking. The 6 videos are defined statically.
- **CLO-24** (behind-the-scenes video): already available (`A51PGVvrt_8`). `DiscoverVideoHero` can be shared with the team page.

---

## Out of scope

- No 2027 programme section (dedicated nav tab in 2027)
- No submenu under "Découvrir"
- No per-section analytics / tracking (out of scope for CLO-52)
- No separate `/decouvrir/photos` page (to reconsider after CLO-13)
