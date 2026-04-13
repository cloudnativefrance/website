# Project Research Summary

**Project:** Cloud Native Days France — Website
**Milestone:** v1.1 Past Editions Showcase
**Domain:** Astro content site — homepage marketing sections (past-edition recaps + testimonials)
**Researched:** 2026-04-13
**Confidence:** HIGH

> Supersedes v1.0 SUMMARY.md. Scoped to v1.1 addition on validated stack.

## Executive Summary

v1.1 is a brownfield content-and-layout addition: relocate the existing "previous edition" block from `/venue` onto the homepage, add a net-new 2023 edition section (10 photos, KCD brand-history callout, Centre Georges Pompidou venue), and introduce an animated testimonials strip with 3 placeholder FR quotes. It is a feature delivery on a fully-validated stack, not a stack decision.

**Approach:** Extract a shared `PastEditionSection.astro` shell, wrap in thin 2026/2023 variants. Testimonials default to pure-CSS `@keyframes` rotation with `prefers-reduced-motion` global reset (no React island unless Stitch requires JS). Photos ship through `astro:assets` `<Picture>` with AVIF/WebP/JPG fallback after ImageMagick pre-processing. Testimonials stay inline in `testimonials-data.ts`. New `editions.*` i18n namespace lands FR + EN together. **Zero new runtime dependencies.**

**Key risks:**
1. A11y regression — first animated component in codebase; zero existing `prefers-reduced-motion` handling.
2. LCP/CLS — 21 MB raw JPG masters must be pre-optimized before commit.
3. Content-gap window — venue block deleted before homepage 2026 verified.
4. FR→EN drift — FR fallback silently hides missing EN keys.
5. CFP CTA demotion on mobile if homepage section ordering not fixed in Stitch.

## Stack

**No new runtime dependencies.** All v1.1 needs are covered by v1.0 stack.

New code patterns (using existing tools):
- `astro:assets` `<Picture>` — 10-photo 2023 gallery (AVIF/WebP/JPG + responsive srcset)
- `astro:assets` `<Image>` — KCD 2023 logo
- `tw-animate-css` (already imported) — Tailwind 4 animation utilities
- CSS `@keyframes` + `prefers-reduced-motion` global reset

**Explicitly rejected:** Framer Motion, Swiper, AOS, tailwindcss-animate (legacy), yet-another-react-lightbox (deferred), shadcn carousel.

## Features (Scope)

**Must have (v1.1 MVP):**
- Homepage "2026 edition" section — direct port of venue `previous-edition` block
- Homepage "2023 edition" section — rail label, h2, KCD brand-history callout, 10-photo grid, gallery CTA
- Animated testimonials strip — 3 FR placeholder quotes, responsive, reduced-motion respected
- Venue page cleanup — remove relocated 2026 block + `venue.prev.*` keys
- FR + EN i18n coverage under `editions.*` / `testimonials.*`

**Should have:**
- Reverse-chronological ordering (2026 first, 2023 second)
- Subtle background-tone differentiation between editions
- Brand-history callout as visual card (KCD logo + "originally Kubernetes Community Days France" continuity signal)

**Deferred / out of scope:**
- Marquee-style animation (promote only if Stitch mandates + ≥6 real quotes)
- Click-to-zoom lightbox
- CSV-driven testimonials
- Per-edition routed pages
- Counter animations, parallax, autoplay

## Architecture

**Component layout:**
- `src/components/past-editions/PastEditionSection.astro` — shared shell
- `src/components/past-editions/Edition2026Section.astro` + `Edition2023Section.astro` — thin prop wrappers
- `src/components/testimonials/TestimonialsStrip.astro` (preferred) — pure-CSS
- `src/components/testimonials/testimonials-data.ts` — inline quotes
- `src/i18n/ui.ts` — new `editions.*` + `testimonials.*` keys (FR + EN)
- `src/assets/photos/kcd2023/` + `src/assets/logos/kcd2023/`
- Integration: `src/pages/index.astro`, `src/pages/en/index.astro`
- Cleanup: `src/pages/venue/index.astro` (lines 5–7, 24–26, 63–73, 216–283)

## Top 5 Pitfalls (HIGH severity)

1. **21 MB raw JPG masters shipped through `astro:assets`** — LCP cliff + git bloat. Run ImageMagick recipe (long edge ≤2400 px, Q82, strip EXIF) BEFORE `git add`. Enforce `find src/assets/photos/kcd2023 -size +1M` returns nothing.
2. **Animated testimonials without `prefers-reduced-motion` fallback** — WCAG 2.2.2 fail. Add global reset to `src/styles/global.css` BEFORE the component. Wrap animations in `@media (prefers-reduced-motion: no-preference)`. Playwright-assert computed `animation: none` under emulated reduced motion.
3. **Venue block deleted before homepage 2026 verified in prod** — content gap. Rigid sequence: (a) land homepage 2026, verify live, (b) delete venue block in separate PR, (c) sweep i18n keys in third PR.
4. **Missing EN translations silently masked by FR fallback** — `/en/` ships mixed-language content. Require FR + EN keys in same commit; Vitest assertion on key count parity and non-identical values.
5. **10-photo grid without dimension reservation** — CLS regression. Always import via `astro:assets`, wrap in `aspect-[3/2] overflow-hidden`, set `sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"`, cap `widths={[480, 800]}`.

## Roadmap Phase Implications

| # | Phase | Rationale | Addresses |
|---|---|---|---|
| 0 | Stitch full-homepage mock | CLAUDE.md gate; resolve marquee-vs-grid, section order, brand callout layout | Stitch drift, CFP demotion |
| 1 | Asset prep (pre-optimize photos + logo) | Biggest LCP lever; unblocks 2023 section | Pitfall 1, git bloat |
| 2 | Shared `PastEditionSection.astro` shell | Build once; `.astro` only (no React) | Pitfall: over-hydration |
| 3 | i18n `editions.*` + `testimonials.*` keys | FR + EN lockstep; can parallel Phase 2 | Pitfall 4 |
| 4 | Integrate `Edition2026Section` on `/` + `/en/` | Lowest-risk section first; validates shell | Content placeholders, scroll anchors |
| 5 | Remove 2026 block from venue page | Surgical separate commit gated on Phase 4 live | Pitfall 3, orphaned imports |
| 6 | Integrate `Edition2023Section` (parallelizable w/ Phase 5 after Phase 2) | Content-blocked on organizer assets + brand sign-off | Pitfall 2, brand legal |
| 7 | Delete `venue.prev.*` keys | Final cleanup after 4+5 verified | Pitfall 5, key collisions |
| 8 | `TestimonialsStrip` (.astro + CSS, parallel from Phase 3) | Independent of 2026/2023 sequence | A11y, placeholder authenticity |

**Critical path:** 0 → 2 → 4 → 5. Phases 6 and 8 parallelize.

### Research-Phase Flags

- **Phase 8:** additional research only if Stitch mandates marquee — validate Magic UI CSS pattern against Tailwind 4 + WCAG 2.2.2 pause-control.
- **Phase 6:** additional research only if interactive photo behavior (lightbox, carousel) added — currently out of scope.
- Phases 1, 2, 3, 4, 5, 7: standard patterns, no research-phase needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | No new deps; all APIs verified in repo + Astro 6 docs |
| Features | MEDIUM-HIGH | Well-codified pattern; open questions are explicit Stitch deliverables |
| Architecture | HIGH | File paths + line numbers verified; shell+wrapper is direct fit |
| Pitfalls | HIGH | Each tied to grep, file:line, or external standard (WCAG, MDN, Astro docs) |

**Overall:** HIGH on approach; MEDIUM on content readiness (2023 organizer assets + brand sign-off pending).

## Gaps to Address in Requirements

- 2023 asset sourcing timeline (photos already supplied via zip; logo supplied; history blurb + stats + Ente.io album URL pending organizer)
- KCD/CNCF brand-history wording sign-off — gate before Phase 6 PR
- Marquee vs static grid decision — Stitch deliverable, default to static grid
- Final homepage section order — Stitch must keep CFP within ~2 viewport heights on 390×844
- Real testimonial quotes — placeholders ship by design; milestone exit is "tracker issue exists"

---
*Research completed: 2026-04-13 — ready for REQUIREMENTS.md + ROADMAP.md authoring.*
