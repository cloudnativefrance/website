# Phase 16: Foundation - Assets, i18n, A11y Baseline, Shared Shell - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship the shared groundwork every downstream v1.1 UI phase depends on. Five deliverables, no application pages: (1) pre-optimized KCD-2023 photo + logo assets, (2) bilingual `editions.*` and `testimonials.*` i18n namespaces with a parity test, (3) the global `prefers-reduced-motion` reset in `global.css`, (4) the prop-driven `PastEditionSection.astro` shell rendered nowhere yet, (5) green `pnpm build` + Vitest suite with zero new warnings.

Out of scope: any page integration (Phases 17/19), the lightbox overlay (Phase 19), the testimonials marquee implementation (Phase 20), real 2026 content.

</domain>

<decisions>
## Implementation Decisions

### Photo + Logo Assets (EDIT-04 support)

- **D-01 Optimization pipeline:** Add `scripts/optimize-photos.ts` using `sharp` (quality ≈ 80, maxWidth 2400). Runs manually; commits the ≤1 MB JPG masters under `src/assets/photos/kcd2023/NN.jpg` (zero-padded indices `01..10`). Astro Image handles runtime variants (responsive srcsets / AVIF / WebP) at build time — no pre-committed responsive variants. Total committed size ≤ 7 MB (success criterion 1).
- **D-02 Photo sources:** 10 source images from the 2023 KCD France gallery, selected to match the Stitch mock mosaic rhythm (2 hero + 3 medium + 5 small — D-04 from Phase 15). Originals are NOT committed; the script is reproducible so future editions can re-run.
- **D-03 KCD 2023 logo:** Download the official KCD 2023 SVG from the KCD program asset kit. Commit to `src/assets/logos/kcd2023/logo.svg` + `logo-dark.svg` (dark-background variant). If the official asset is not retrievable at build time, ship a placeholder SVG built from DS tokens + a TODO note in DESIGN.md §Logo Usage pointing at the missing asset; the organizer provides the final file before Phase 19 merges (I18N-03 already gates that merge).

### i18n Structure (I18N-01, I18N-02)

- **D-04 Key structure:** Stay flat dot-strings matching the existing `src/i18n/ui.ts` conventions. Add to both `fr` and `en` objects in the same commit:
  - `editions.2026.heading`, `editions.2026.video_caption`, `editions.2026.stats.participants`, `editions.2026.stats.speakers`, `editions.2026.stats.sessions`, `editions.2026.placeholder_badge`
  - `editions.2023.heading`, `editions.2023.gallery_cta`, `editions.2023.video_caption`, `editions.2023.video_cta`, `editions.2023.stats.participants`, `editions.2023.stats.speakers`, `editions.2023.stats.sessions`, `editions.2023.brand_note` (I18N-03 — organizer sign-off required before Phase 19 ships)
  - `editions.rail.2026`, `editions.rail.2023` (rail label copy)
  - `testimonials.heading`, `testimonials.pause_hint`, and `testimonials.0.quote`…`testimonials.5.quote` + `testimonials.0.attribution`…`testimonials.5.attribution` (6 placeholder quotes — aligns with v1.1 scope decision "testimonials stay inline as placeholders").
- **D-05 Parity test:** `tests/build/i18n-parity.test.ts` (Vitest). Two assertions:
  1. `Object.keys(ui.fr).sort()` deep-equals `Object.keys(ui.en).sort()` — key-count parity.
  2. For every key, `ui.fr[k] !== ui.en[k]` (byte-different) — catches accidental FR paste into EN. Failure messages list the offending keys explicitly so CI output is actionable.
- **D-06 Testimonial copy location:** Placeholder quote bodies + attributions live in `src/i18n/ui.ts` under the `testimonials.*` namespace (NOT a separate `testimonials-data.ts`). The v1.1 scope note ("testimonials inline in testimonials-data.ts") is superseded here because keeping everything in `ui.ts` makes the parity test trivial and matches existing conventions. Phase 20 reads from `useTranslations()` like every other component.

### A11y Baseline (A11Y-05)

- **D-07 prefers-reduced-motion reset:** Add a nuclear global media query at the end of `src/styles/global.css`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```
  This is the documented site-wide baseline. The testimonials marquee (D-09 from Phase 15) and any future animated component rely on this reset — components MUST NOT redefine their own motion fallback.

### PastEditionSection Shell (EDIT-04)

- **D-08 Component location + shape:** `src/components/past-editions/PastEditionSection.astro`. Plain `.astro` file, zero `client:*` directives. Single `Props` interface with independent optional slots:
  ```ts
  interface Props {
    rail: string;              // rotated left-rail label ("EDITION 2026")
    heading: string;           // h2 text
    stats: Array<{ value: string; label: string }>;  // 3-up stat tiles
    photos?: Array<{ src: ImageMetadata; alt: string; size?: "hero" | "medium" | "small" }>;  // undefined for 2026 variant
    video?: { youtubeId: string; caption: string; playlistCta?: { label: string; href: string } };  // both 2026 (single featured) and 2023 (featured below photos) use this
    brandCallout?: { logo: ImageMetadata; logoAlt: string; body: string };  // only 2023 for now
    galleryCta?: { label: string; href: string };  // optional "View full gallery →" link (future)
    placeholder?: boolean;     // when true, renders the PLACEHOLDER badge (D-06 Phase 15)
  }
  ```
  Consumers opt into slots; the shell renders them in the locked D-01 order (rail → h2 → stats → photos → video → brandCallout → galleryCta). If `photos` is undefined AND `video` is present, the shell renders the video as primary media (2026 behavior); if `photos` is present, the mosaic renders first then the video beneath it (2023 behavior per D-13 from Phase 15).
- **D-09 Shell renders nowhere:** Phase 16 ships the shell file only. Phase 17 mounts `<PastEditionSection …>` on the homepage with 2026 props; Phase 19 does the same with 2023 props. A build-time safeguard — the shell is NOT imported by any page — is verified by success criterion 4.
- **D-10 Styling source:** Rail rotation (D-02 from Phase 15), gap rhythm (D-03/D-11 from Phase 15), photo mosaic layout (D-04 from Phase 15), brand-callout full-width band (D-05 from Phase 15), placeholder badge (D-06 from Phase 15) are all implemented here as Tailwind utility classes + scoped `<style>` blocks. All values come from existing DS tokens (no new tokens).

### Build + Test Gate (success criterion 5)

- **D-11 Zero-new-warnings policy:** `pnpm build` and `pnpm test` must exit 0 with no new warnings introduced by this phase's code. Pre-existing v1.0 warnings are documented out-of-scope (see STATE.md carry-over list).

### Claude's Discretion

- Photo filenames (numeric `01.jpg`..`10.jpg` lock for deterministic mosaic placement).
- `sharp` exact config knobs beyond quality/maxWidth — mozjpeg on/off, chroma subsampling — pick for smallest file under 1 MB ceiling.
- Tailwind class composition inside the shell — pick the least-custom shape.
- Exact placeholder text for 2026 `editions.2026.*` strings — free to write sensible FR/EN copy that satisfies the byte-different rule; Phase 17 replaces with real recap.
- Placeholder quote bodies + attributions (testimonials 0..5) — free to invent sensible FR/EN placeholder personas; Phase 20 doesn't require real quotes.

### Folded Todos

None surfaced for Phase 16 scope.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap + Requirements

- `.planning/ROADMAP.md` §"Phase 16: Foundation - Assets, i18n, A11y Baseline, Shared Shell" — phase goal and 5 success criteria
- `.planning/REQUIREMENTS.md` — EDIT-04, A11Y-05, I18N-01, I18N-02 (also awareness: EDIT-05, I18N-03)

### Upstream Design Contract (Phase 15)

- `DESIGN.md` §"Homepage Layout Contract (v1.1)" — D-01..D-13 verbatim + Stitch screen IDs. The shell, gap rhythm, rail treatment, mosaic spec, marquee card specs ALL live here.
- `.planning/phases/15-stitch-full-homepage-mock/15-CONTEXT.md` — full decision rationale
- `.planning/phases/15-stitch-full-homepage-mock/15-01-SUMMARY.md`, `15-02-SUMMARY.md`, `15-03-SUMMARY.md` — approved Stitch screen IDs

### Existing Code Conventions

- `src/i18n/ui.ts` — flat dot-string shape (match)
- `src/styles/global.css` — where the prefers-reduced-motion reset lands
- `src/components/speakers/SpeakerCard.astro`, `SpeakerProfile.astro` — representative prop-driven Astro component patterns
- `tests/build/speakers-grid.test.ts` — existing Vitest pattern for the new i18n parity test

### Project Rules

- `CLAUDE.md` — CSV rules do not apply (no CSV data in Phase 16); Stitch-first rule has already been satisfied by Phase 15 for anything visual downstream consumes
- `.planning/STATE.md` §"v1.1 Scope Decisions" — FR+EN mandatory, testimonials placeholder; note D-06 supersedes the "testimonials-data.ts" line

### Downstream Consumers (read for awareness)

- Phase 17 (2026 integration) — mounts shell with 2026 props on homepage
- Phase 19 (2023 integration + lightbox) — mounts shell with 2023 props; lightbox reuses `photos` slot click handler
- Phase 20 (Testimonials marquee) — reads `testimonials.*` i18n keys added in this phase

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/i18n/ui.ts` (420 lines, flat dot-strings, FR + EN) — direct target for I18N-01 additions
- `src/styles/global.css` — direct target for A11Y-05
- `src/components/speakers/` — pattern template for prop-driven Astro component (Props interface, scoped styles, no `client:*`)
- `src/assets/logos/` (principal, dark, print) — existing logo folder convention; new `kcd2023/` subfolder follows this

### Established Patterns

- Flat i18n keys in a single `ui.ts` file; `useTranslations(lang)` helper in `src/i18n/utils.ts`
- Vitest tests under `tests/build/` with naming `<feature>.test.ts`
- Astro components in `src/components/{topic}/`, `.astro` files plain (no `client:*` unless interactivity strictly required)
- Image optimization: existing images under `src/assets/` rely on Astro Image at build — no pre-commit scripts yet (Phase 16 introduces the first one)

### Integration Points

- `useTranslations()` consumer contract unchanged — new keys just become available
- Astro Image component already used site-wide — the shell uses it for photos + brand-callout logo
- No impact on existing CSV data loaders (CNDF homepage data is separate)

</code_context>

<specifics>
## Specific Ideas

- The shell MUST render nowhere in Phase 16 (success criterion 4) — a simple way to satisfy this safely is to include it in a Vitest file that imports the module to type-check the Props contract but does NOT render it, keeping the "shell exists as a file" truthy while avoiding accidental page mounting.
- The KCD 2023 logo dark-variant must work on `--color-background` (deep purple) without relying on a background plate — verify contrast against the brand-callout band background (`--color-secondary` or `--color-card`).
- The i18n parity test should surface missing and extra keys separately (not a single "mismatch" boolean) so devs can diagnose which locale is behind.
- The photo-optimization script should be idempotent — re-running it on already-optimized files should be a no-op or log "skipped".

</specifics>

<deferred>
## Deferred Ideas

- **Pre-committed responsive variants** — let Astro Image handle at build time; revisit only if build time becomes a bottleneck.
- **Automated KCD program logo fetcher** — manual download is fine for a one-time asset.
- **i18n namespace splitting into multiple files** — revisit if `ui.ts` crosses ~800 lines.
- **prefers-reduced-motion opt-out mechanism** — we have no animation that needs to escape the reset today; add only when a concrete case demands it.
- **Shell "variant" prop for future 2028 edition** — independent-slots API already supports this; no need to add a variant discriminator.
- **Skeleton/loading states for the shell** — not needed, the shell renders Astro-side (no client hydration).

</deferred>

---

*Phase: 16-foundation-assets-i18n-a11y-baseline-shared-shell*
*Context gathered: 2026-04-13*
