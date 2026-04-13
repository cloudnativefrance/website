# Phase 17: Integrate 2026 Edition Section on Homepage - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Mount the `PastEditionSection.astro` shell (Phase 16) on both `/` (FR) and `/en/` (EN) with 2026-variant props, placing it between the CFP section and where the 2023 section will later land. Extract the legacy `venue/index.astro` 2026 block data into a single data module both pages consume. The legacy venue block **stays visible and unchanged** at phase exit (deletion is Phase 18) to avoid a content-gap window.

Out of scope: 2023 section integration (Phase 19), marquee testimonials (Phase 20), legacy venue block deletion (Phase 18), real 2026 recap content (gated by tracker issue #3 — replaces placeholders post-event).

</domain>

<decisions>
## Implementation Decisions

### Data Module (v1.1 scope — past-editions static/hardcoded)

- **D-01 Single source of truth:** Create `src/lib/editions-data.ts` as the authoritative static-data module for past-editions homepage content. Exports `EDITION_2026` + `EDITION_2023` objects. Both `src/pages/index.astro`, `src/pages/en/index.astro`, AND `src/pages/venue/index.astro` import from it during the Phase 17 → Phase 18 transition window. This eliminates drift and makes the Phase 18 venue-block deletion a mechanical diff.
- **D-02 `EDITION_2026` shape:**
  ```ts
  export const EDITION_2026 = {
    youtubeId: "qyMGuU2-w8o",                 // ported verbatim from venue/index.astro
    galleryUrl: "<ported verbatim from venue/index.astro>",
    stats: [                                  // ported verbatim from venue/index.astro previousStats
      { value: "<N>", labelKey: "editions.2026.stats.participants" },
      { value: "<N>", labelKey: "editions.2026.stats.speakers" },
      { value: "<N>", labelKey: "editions.2026.stats.sessions" },
    ],
    thumbnails: [                             // 3 tiles per SC2 — placeholder reusing 2023 masters
      { src: photos.kcd2023_01, altKey: "editions.2026.thumbnail_alt.1" },
      { src: photos.kcd2023_05, altKey: "editions.2026.thumbnail_alt.2" },
      { src: photos.kcd2023_08, altKey: "editions.2026.thumbnail_alt.3" },
    ],
    placeholder: true,                        // drives visible PLACEHOLDER badge (D-06 Phase 15)
    trackerIssueUrl: "https://github.com/cloudnativefrance/website/issues/3",
  } as const;
  ```
  Exact stat values (participants/speakers/sessions) and galleryUrl are ported byte-for-byte from `src/pages/venue/index.astro` lines 24-25 + 63-67 — no invention. i18n labels live in `editions.2026.*` keys added in Phase 16.
- **D-03 `EDITION_2023` shape (stub only in Phase 17):** The module also exports `EDITION_2023` stub with minimum fields needed by Phase 19, but Phase 17 does NOT render it on the homepage. Phase 19 fills in photos, brandCallout, featured video (D-13 from Phase 15), and mounts it. The stub exists only so the data module file ships complete in Phase 17.

### Tracker Issue

- **D-04 Tracker URL:** `https://github.com/cloudnativefrance/website/issues/3` (created 2026-04-13, title "2026-recap-final-content", labeled `documentation`). Embedded as `EDITION_2026.trackerIssueUrl`. Surfaced via the `PLACEHOLDER` badge tooltip (and as the badge's anchor `href` so a click opens the tracker).

### 2026 Photo Thumbnails

- **D-05 Thumbnail choice:** Reuse 3 existing 2023 masters — `src/assets/photos/kcd2023/01.jpg`, `05.jpg`, `08.jpg` — as visual placeholders in the 2026 thumbnails slot. Rendered through `astro:assets` `<Image>`. Combined with the visible `PLACEHOLDER` badge (D-06 Phase 15), the reuse is honest and visually complete. Phase 17 tracker issue #3 gates the swap to real 2026 photos post-event.
- **D-06 Placeholder visual dimming:** Thumbnails in placeholder mode render at `opacity-70` with a subtle dark overlay (via `before:` pseudo using Background token at 20% opacity). This + the Accent Pink PLACEHOLDER badge signals "not final" to any visual reviewer.

### Shell Mounting

- **D-07 Homepage composition:** Both `/` (FR) and `/en/` (EN) mount `<PastEditionSection {...edition2026Props} id="edition-2026" />` inside `<main>` between `<CfpSection />` and the closing `</main>`. The 2023 section will slot below 2026 in Phase 19. Nothing else on the homepage changes (Hero, KeyNumbers, CFP stay as-is; testimonials + footer deferred).
- **D-08 Shell Props extension:** Minor, non-breaking extension of the Phase 16 D-08 Props interface — add `id?: string` (optional anchor id for deep linking). Default behavior unchanged. Plan 16's shell gets a one-line edit in Phase 17 to accept this prop.
- **D-09 2026-variant props wiring:**
  - `rail` ← `t("editions.rail.2026")` (Phase 16 i18n key)
  - `heading` ← `t("editions.2026.heading")`
  - `stats` ← `EDITION_2026.stats.map(s => ({ value: s.value, label: t(s.labelKey) }))`
  - `video` ← `{ youtubeId: EDITION_2026.youtubeId, caption: t("editions.2026.video_caption") }` (no playlistCta for 2026 — that's a 2023-variant D-13 feature)
  - `photos` ← `EDITION_2026.thumbnails.map(th => ({ src: th.src, alt: t(th.altKey), size: "small" }))` (3 small tiles, not the 2023 10-tile mosaic)
  - `galleryCta` ← `{ label: t("editions.2026.gallery_cta"), href: EDITION_2026.galleryUrl }`
  - `brandCallout` ← undefined (2026 variant has no callout per D-06 Phase 15)
  - `placeholder` ← `EDITION_2026.placeholder` (always `true` until tracker #3 closes)
  - `id` ← `"edition-2026"`

### Deep Link + Heading Hierarchy

- **D-10 Anchor id + scroll-margin:** Shell renders `<section id={Astro.props.id ?? undefined}>`. `scroll-margin-top: 5rem` (80px) added to `:target` globally in `src/styles/global.css` — accommodates the sticky nav (64-72px height) plus breathing room. Verified by Playwright / manual: `/#edition-2026` lands with the `<h2>` ~8px below the nav bottom edge.
- **D-11 Heading levels:** Homepage already has single `<h1>` in HeroSection. Shell's heading renders as `<h2>` (matches Phase 16 D-08). No skipped levels — Hero h1 → KeyNumbers h2 → CFP h2 → PastEditionSection h2. Verified by an a11y assertion test (new): `tests/build/homepage-heading-hierarchy.test.ts` reads the generated `dist/index.html` (after a build) and asserts h1/h2 ordering for both `/` and `/en/`.

### Legacy Venue Block (unchanged)

- **D-12 Venue block stays identical at phase exit:** Per SC5, `src/pages/venue/index.astro` lines 216-300 (the "Previous edition replay" `<section>`) remain rendered. Only the constants at the top (YOUTUBE_ID, GALLERY_URL, previousStats, thumbnails) are **replaced with imports from `src/lib/editions-data.ts`** — the rendered HTML is byte-identical. A visual-snapshot test (`tests/build/venue-block-unchanged.test.ts`) asserts the rendered venue markup hasn't drifted — reads `dist/venue/index.html` and greps for the YouTube iframe + stat numbers + gallery link.

### Placeholder Badge Link Behavior

- **D-13 Badge is an anchor:** The `PLACEHOLDER` badge rendered inside the shell (when `placeholder` prop is `true`) wraps the badge in `<a href={props.trackerUrl}>` when a URL is passed. The shell extends Props minimally: add optional `trackerUrl?: string`. `target="_blank" rel="noopener noreferrer"` for external links. Accessible: `aria-label={t("editions.placeholder_badge_aria")}` (new i18n key, added in this phase).

### New i18n Keys (Phase 17 additions)

- **D-14 Key additions (FR + EN in `src/i18n/ui.ts`):**
  - `editions.2026.thumbnail_alt.1`, `editions.2026.thumbnail_alt.2`, `editions.2026.thumbnail_alt.3` (placeholder alts for 2023 photo reuse — make it clear they're placeholders: "Photo d'archive KCD 2023 — placeholder en attente du recap 2026" / "KCD 2023 archive photo — placeholder pending the 2026 recap")
  - `editions.placeholder_badge_aria` (aria-label for the badge anchor)
  - `editions.2026.video_caption` (video thumbnail caption)
  - Any Phase 16 keys that aren't yet populated get filled in this phase if needed. All adhere to the I18N-02 parity test added in Phase 16.

### Build + Test Gate

- **D-15 Zero-new-warnings:** Same policy as Phase 16. Pre-existing SPKR-01 carry-over failures remain out of scope. Phase 17 adds these new test files:
  - `tests/build/homepage-2026-section.test.ts` — renders of `/` and `/en/` contain the shell with rail, h2, video iframe, 3 stats, 3 thumbnails, gallery CTA, placeholder badge with tracker link (SC1, SC2, SC4, EDIT-01, EDIT-06)
  - `tests/build/homepage-heading-hierarchy.test.ts` — h1/h2 ordering, no skipped levels (SC3)
  - `tests/build/venue-block-unchanged.test.ts` — legacy venue 2026 section still renders identical (SC5)

### Claude's Discretion

- Exact alt text strings for placeholder thumbnails (pick from recap / event vocabulary)
- Whether to use an `<a>` or `<button>` for the placeholder badge (use `<a>` since it points to an external tracker URL)
- Tailwind composition for opacity-70 + overlay on placeholder thumbnails (pick from existing utility classes)
- Whether to sort imports in editions-data.ts alphabetically or by logical grouping (pick logical)

### Folded Todos

None — Phase 17 scope is tight.

</decisions>

<canonical_refs>
## Canonical References

### Roadmap + Requirements
- `.planning/ROADMAP.md` §"Phase 17: Integrate 2026 Edition Section on Homepage" (goal + 5 success criteria)
- `.planning/REQUIREMENTS.md` — EDIT-01 (2026 section on homepage), EDIT-06 (reverse-chronological order)

### Upstream Artifacts
- `DESIGN.md` §"Homepage Layout Contract (v1.1)" — D-01..D-13 (especially D-01 shell order, D-03/D-11 gap rhythm, D-06 placeholder badge)
- `.planning/phases/15-stitch-full-homepage-mock/15-01-SUMMARY.md` (approved full-homepage Stitch screen `e23cde61c70c4b80b4e4d10fbfd9a14e` — visual target)
- `.planning/phases/16-foundation-assets-i18n-a11y-baseline-shared-shell/16-CONTEXT.md` §D-08 (shell Props interface — extend with `id?`, `trackerUrl?`)
- `src/components/past-editions/PastEditionSection.astro` (the shell to mount)

### Current Code (sources for the data extraction)
- `src/pages/venue/index.astro` lines 24-25, 63-90, 216-300 (legacy 2026 block — constants + render markup)
- `src/pages/index.astro`, `src/pages/en/index.astro` (homepage targets for mount)
- `src/i18n/ui.ts` (add D-14 new keys, match existing flat dot-string pattern)
- `src/styles/global.css` (add `:target` scroll-margin rule)
- `src/components/Navigation.astro` line 51 (sticky nav height — sets scroll-margin-top target)

### Tracker
- **GitHub issue #3:** https://github.com/cloudnativefrance/website/issues/3 — "2026-recap-final-content" — gates the placeholder-to-real content swap

### Project Rules
- `CLAUDE.md` — no co-author lines; CSV rule not applicable (past-editions are static per v1.1 scope); Stitch-first rule satisfied by Phase 15
- `.planning/STATE.md` §"v1.1 Scope Decisions" — past-editions static/hardcoded

### Downstream Awareness
- Phase 18 — deletes legacy venue block (relies on D-01/D-12 data extraction having landed)
- Phase 19 — fills `EDITION_2023` stub + mounts 2023 variant below 2026
- Phase 20 — adds testimonials below 2023

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable
- `PastEditionSection.astro` shell (Phase 16) — consumes 2026 props directly
- `src/assets/photos/kcd2023/*.jpg` (10 optimized masters) — 3 reused as 2026 placeholder thumbnails
- Phase 16 i18n `editions.2026.*` keys — mostly populated; this phase adds D-14 additions
- `useTranslations(lang)` helper — unchanged
- `astro:assets` `<Image>` component — already used across site for optimized images

### Established Patterns
- Data modules live in `src/lib/` (event-schema.ts, remote-csv.ts — same shape)
- Static imports of ImageMetadata from `src/assets/` for typed image references
- i18n keys flat dot-strings in `src/i18n/ui.ts`

### Integration Points
- Homepage `<main>` already hosts Hero + KeyNumbers + CFP — append shell after CFP
- `src/pages/venue/index.astro` imports 4 constants → replace with single `EDITION_2026` import + destructuring; render markup unchanged
- No CSV layer, no content collection — this is pure static data + component composition

</code_context>

<specifics>
## Specific Ideas

- The shell `id` prop is a cleaner API than wrapping the mount in an `<div id="edition-2026">` — avoids an extra DOM node and co-locates deep-link concerns with the section.
- Placing the scroll-margin-top on `:target` (not every section) scopes the effect to URL-fragment navigation; direct scrolls / intersection observers stay untouched.
- The badge-as-anchor pattern (D-13) turns the placeholder indicator into a hot-link for reviewers to click straight to the tracker — one less context switch.
- The venue-block-unchanged test is a cheap insurance against accidental drift — it greps `dist/venue/index.html` for byte-level checkpoints.

</specifics>

<deferred>
## Deferred Ideas

- **Real 2026 video, stats, photos** — gated by tracker #3; one-line data swap post-event
- **2023 section integration** — Phase 19
- **Legacy venue block deletion** — Phase 18
- **Marquee testimonials below editions** — Phase 20
- **Structured data (Event / VideoObject schema.org) for past editions** — revisit once real recap content lands; not in v1.1 scope
- **Client-side smooth-scroll for in-page anchor nav** — `scroll-behavior: smooth` already in global.css? verify during planning; if not present, deferred

</deferred>

---

*Phase: 17-integrate-2026-edition-section-on-homepage*
*Context gathered: 2026-04-13*
