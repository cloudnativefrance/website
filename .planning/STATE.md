---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Homepage Restructuring (SHIPPED)
status: milestone-complete
stopped_at: v1.2 archived — milestones/v1.2-{ROADMAP,REQUIREMENTS,MILESTONE-AUDIT}.md created; ROADMAP collapsed to one-line entry; REQUIREMENTS.md removed (fresh one comes with /gsd-new-milestone); PROJECT.md evolved to mark v1.2 shipped; git tag v1.2 pushed (commit 79dc707)
last_updated: "2026-04-19T09:50:00.000Z"
last_activity: 2026-04-19 -- v1.2 milestone closed and archived (PR #4 merged, tag v1.2 pushed, archives written, REQUIREMENTS.md removed)
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 9
  completed_plans: 9
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-18)

**Core value:** A first-time visitor should immediately understand what the event is, when and where it happens, and feel compelled to register -- all within 5 seconds of landing.
**Current focus:** v1.2 milestone audit (all 4 phases / 9 plans complete; awaiting milestone-audit pass)

## Current Position

Phase: 26 (4 of 4 in v1.2) -- Homepage Wiring -- COMPLETE
Plan: 3 of 3 in Phase 26 complete (26-01 homepage rewrite + 26-02 favicon swap + 26-03 orphan cleanup)
Status: Feature-complete (awaiting v1.2 milestone audit)
Last activity: 2026-04-19 -- Plan 26-03 shipped (3 orphan v1.1-era components deleted; astro check 9 -> 5; v1.2 feature-complete)

Progress: [██████████] 100% (9/9 plans complete in v1.2: 2 in Phase 23, 3 in Phase 24, 1 in Phase 25, 3 in Phase 26)

## Performance Metrics

**Velocity:**

- Total plans completed: 9 (v1.2)
- Average duration: ~5.5 min
- Total execution time: ~0.85 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 23 | 2/2 | ~19 min | ~10 min |
| 24 | 3/3 | ~14 min | ~5 min |
| 25 | 1/1 | ~4 min | ~4 min |
| 26 | 3/3 | ~14 min | ~4.7 min |

## Accumulated Context

### Decisions

- v1.0 shipped 2026-04-13: 14 phases, 48/49 requirements
- v1.1 shipped 2026-04-14: 8 phases, 20/22 requirements (2 organizer content gates pending)
- [v1.2 init]: Homepage restructured per validated Stitch mockup "Homepage Mockup v2"
- [v1.2 init]: Newsletter CTA is placeholder anchor only (CLO-6 backend deferred)
- [v1.2 init]: One-pager PDF hosted via Google Drive link
- [23-01]: Used the clean `playlist?list=…` URL form for `EDITION_2026.replaysUrl` (vs. `watch?v=…&list=…`).
- [23-01]: `editions.2026.thumbnail_alt.4` left in both locales as orphan (clean-up deferred per UI-SPEC §Accessibility checklist).
- [23-01]: `EDITION_2026.stats` array preserved despite UI-SPEC dropping the stats row (data kept for future consumers; cleanup deferred to v1.3).
- [23-02]: YouTube aftermovie embed uses `youtube-nocookie.com/embed` per D-12 (privacy-respecting, no tracking cookies until play).
- [23-02]: Both external CTAs (replays + PDF) carry `target="_blank" rel="noopener noreferrer"` per D-11 (reverse-tabnabbing + Referer leak mitigation).
- [23-02]: Testimonials sub-block rendered with `<h3>` (not a second `<h2>`) to preserve single-h2-per-section heading hierarchy (Pitfall #8).
- [23-02]: Component NOT mounted to any page in Phase 23 — Phase 26 owns the homepage swap (CONTEXT D-01).
- [23-fix]: Mosaic layout pattern adopted across PastEditionSection.astro AND Edition2026Combined.astro: hero col-span-12 / md:col-span-8 + md:row-span-2; medium+small col-span-6 / md:col-span-4 + md:row-span-1. Produces "1 large left + 2 stacked right" on desktop, robust against [hero, medium, medium] data shapes (was 6+4+4=14 wrap regression).
- [23-fix]: Featured-video max-width unified to max-w-4xl across both PastEditionSection and Edition2026Combined for visual balance with the wider hero photo.
- [24-01]: safeUrl + safeLogoPath extracted into src/lib/sponsor-utils.ts (named exports, no default); SponsorCard.astro imports from there; SocialLinks.astro keeps its own inline safeUrl copy by planner design (cross-component extraction deferred to v1.3 per Pitfall #12).
- [24-01]: sponsors.homepage.cta uses Pattern B (no arrow in i18n value; template renders `<span aria-hidden="true">→</span>`) — keeps the arrow accessibility-correct and locale-agnostic; mirrors Phase 23 convention for `editions.2026.replays_cta`.
- [24-02]: SponsorsPlatinumStrip.astro is data-agnostic — accepts pre-filtered `ReadonlyArray<CollectionEntry<"sponsors">>` as props; caller (Phase 26) owns `getCollection("sponsors")` + tier filter. Keeps the CSV-as-source-of-truth rule (CLAUDE.md) enforced at the page boundary, not inside reusable UI.
- [24-02]: Belt-and-braces empty-state guard wraps the entire `<section>` (not just the `<ul>`). When sponsors.length === 0 the component emits ZERO DOM — caller also guards, redundancy is intentional (T-24-10 / PITFALLS #3).
- [24-02]: No SponsorCard nesting — copied SponsorCard's interaction classes into a local `cardClasses` string. Rationale: homepage strip diverges from SponsorCard Platinum on 2 axes (max-w-[180px] max-h-16 vs [220px] max-h-20; p-6 md:p-7 vs p-8) — a shared component would force a new tier/prop, both of which scope-creep.
- [24-02]: Component NOT mounted to any page in Phase 24 — Phase 26 owns the homepage swap (same CONTEXT discipline as Phase 23).
- [24-03]: Edition2023Link.astro is fully prop-driven — no imports from @/lib/editions-data or @/i18n/utils. Caller (Phase 26) resolves i18n + locale-aware href before passing props. Keeps Stitch mockup → code 1:1 with no flag-driven branches.
- [24-03]: Pattern A arrow on /2023 CTA (trailing glyph lives in the i18n value editions.2023.view_page_cta). Template renders {viewPageLabel} alone — no decorative <span>. OPPOSITE of Pattern B used by 24-02; both coexist in the codebase. Rule: match the pattern the consumed i18n value already uses.
- [24-03]: h2 uses font-semibold + tracking-tight (NOT font-bold + uppercase + tracking-wider) — one notch lighter than the Sponsors strip h2 per UI-SPEC §Typography.
- [24-03]: Logo sits on bare background (no bg-card plate) per UI-SPEC §Discretion Resolutions. Default id="edition-2023" preserves existing /#edition-2023 deep-link resolution.
- [24-03]: Component NOT mounted to any page in Phase 24 — Phase 26 owns the homepage swap + PastEditionMinimal.astro deletion.
- [25-01]: Background opacity locked to single `<img>` @ `opacity-75` (no overlay div); contrast math passes AA over the existing vertical wash + radial gradient + GeoBackground scaffolding.
- [25-01]: Mail icon hand-inlined as `<svg>` child of the anchor (lucide "mail" geometry, MIT) — NO `lucide-react` import added (mirrors Phase 23/24 site-wide convention; package.json unchanged).
- [25-01]: Newsletter placeholder anchor = `href="#newsletter-stub"` paired with sibling `<div id="newsletter-stub" class="sr-only" aria-hidden="true">` inside the hero section; same-page scroll within hero fold = no visual jump; CLO-6 swap-ready by changing href + deleting stub.
- [25-01]: Ghost CTA focus ring overrides default `ring-ring/50` to `ring-accent/50` — identity match (Pink button, Pink ring); override scoped to single CTA via cn() class concat.
- [25-01]: Mobile button widths kept intrinsic (no `w-full`) — UI-SPEC §Discretion Resolutions rejects `w-full` because it pushes Countdown out of the 80vh fold on small phones.
- [25-01]: EN copy "Stay in the loop" chosen over alternatives — idiomatic EN matching the casual register of "Get Your Ticket" / "View Schedule".
- [25-01]: ambiance-10.jpg KEPT on disk and in `src/lib/editions-data.ts` (still consumed by PastEditionSection / Edition2026Combined per UI-SPEC §Data Module & Asset Changes).
- [25-01]: Hero ships LIVE with this commit chain (component already mounted on both /fr and /en homepages pre-edit; unlike Phase 23/24 deferred-mount components).
- [26-01]: Both /fr and /en homepages rewired to v1.2 section order (Hero -> KeyNumbers -> Edition2026Combined -> Edition2023Link -> CFP -> SponsorsPlatinumStrip). Sponsor data loaded at page boundary via getCollection + tier === "platinum" filter (CSV-as-source-of-truth per CLAUDE.md). Locale-aware hrefs hardcoded (FR=/2023, EN=/en/2023) — no JSX ternaries. FR/EN diff is exactly 2 hunks (Layout depth + viewPageHref).
- [26-01]: Edition2026Combined mounted with zero props — component resolves its own data/i18n defaults (idiomatic homepage usage per Phase 23 contract).
- [26-01]: Belt-and-braces SponsorsPlatinumStrip empty-state guard — caller wraps with {platinumSponsors.length > 0 && ...} alongside the component's internal guard (intentional redundancy per Phase 24).
- [26-01]: Astro check baseline 11 -> 9 (orphan editions.2026.gallery_cta and editions.2023.gallery_cta references gone). Build green at 156 pages.
- [26-02]: favicon.svg replaced with 3-band French tricolor SVG (#002654 / #FFFFFF / #ED2939). Square 1:1 viewBox (3x3) chosen over real-flag 2:3 — browsers render favicons into a square slot. shape-rendering=crispEdges keeps band boundaries pixel-sharp. No prefers-color-scheme variant (national flag has no dark-mode form). 347 bytes.
- [26-02]: public/favicon.ico left untouched as legacy fallback (modern browsers prefer SVG via Layout.astro line 92; .ico declared on line 93 stays for IE/Edge < 79). User can later regenerate .ico from new SVG via ImageMagick if pixel-perfect legacy parity matters.
- [26-02]: src/layouts/Layout.astro untouched — existing <link rel="icon" type="image/svg+xml" href="/favicon.svg" /> already pointed at the right path; swap is purely the file body (zero plumbing changes).
- [26-03]: Three v1.1-era orphan homepage components deleted atomically via `git rm` (PastEditionSection.astro + PastEditionMinimal.astro + TestimonialsStrip.astro; 406 LOC removed). Pre-delete safety gate (grep across src/) returned only stale doc-comment references (Edition2023Link.astro lines 9/11, Edition2026Combined.astro line 81, editions-data.ts line 87) — no functional importers; gate passed.
- [26-03]: Astro check baseline reduced from 9 to 5 errors — the 4 TestimonialsStrip template-literal type errors disappear with the file. Remaining 5 errors all out of scope for v1.2: content.config.ts (3) + Edition2023PhotoGrid.astro (2). Slated for v1.3 baseline-cleanup phase.
- [26-03]: src/components/testimonials/ parent directory was implicitly removed by git when its only child was deleted. Anti-overreach gate confirmed src/lib/testimonials-data.ts (consumed by Edition2026Combined) and Edition2023PhotoGrid.astro (consumed by /2023 page) survive untouched.
- [26-03]: Stale doc-comment references in Edition2023Link.astro / Edition2026Combined.astro / editions-data.ts mentioning the deleted file names left in place — comment cleanup intentionally out of scope for a delete-only plan.

### Pending Todos

- Pre-existing `astro check` baseline now carries 5 type errors (down from 11 → 9 → 5 across 26-01 and 26-03). Remaining: content.config.ts Zod 13 LoaderConstraint regression (3) + Edition2023PhotoGrid.astro implicit-any on .map((p, i) => ...) callback parameters (2). All 5 are out of scope for v1.2 — slated for a v1.3 baseline-cleanup phase.
- Stale doc-comment references to the deleted v1.1 components (Edition2023Link.astro lines 9/11, Edition2026Combined.astro line 81, editions-data.ts line 87) — one-line follow-up if it bothers anyone; absorbed by the next refactor that touches those lines anyway.
- v1.2 milestone audit (mirroring v1.0 / v1.1 audit format): subjective UATs across all 4 phases, accessibility check, Lighthouse, full-page Stitch comparison.

### Blockers/Concerns

- Hero background image: RESOLVED — user-provided ambiance-00.jpg shipped in 25-01 (4.4 MB, opacity-75)
- 2026 replays playlist URL: CONFIRMED & wired in `EDITION_2026.replaysUrl` as of 23-01 (ED26-02 data layer satisfied; visible CTA ships in 23-02)
- Newsletter anchor behavior: RESOLVED — chose same-page anchor (`href="#newsletter-stub"` + in-hero sentinel `<div>`) per UI-SPEC §Discretion Resolutions; CLO-6 backend swap is a single-commit href change

## Session Continuity

Last session: 2026-04-19T06:42:32.000Z
Stopped at: Plan 26-03 complete — 3 orphan v1.1-era homepage components deleted atomically via `git rm` (PastEditionSection.astro + PastEditionMinimal.astro + TestimonialsStrip.astro; 406 LOC removed). Safety-gate grep confirmed zero foreign importers (only stale doc-comment references remained, no functional dependencies). Astro check baseline dropped 9 -> 5 errors (4 TestimonialsStrip template-literal errors gone with the file); build still ships 156 pages. Anti-overreach gate confirmed src/lib/testimonials-data.ts and Edition2023PhotoGrid.astro survive untouched. **Phase 26 COMPLETE — v1.2 milestone is feature-complete (9/9 plans across 4 phases).** Next: v1.2 milestone audit pass (subjective UATs, a11y, Lighthouse, Stitch comparison).
Resume file: .planning/phases/26-homepage-wiring/26-03-SUMMARY.md
