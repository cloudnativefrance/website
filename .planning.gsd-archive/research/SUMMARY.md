# Research Summary: v1.2 Homepage Restructuring

## Executive Summary

The v1.2 milestone is a pure homepage layout restructuring on a fully validated stack. **No new dependencies required.** Every feature maps to existing codebase patterns: Astro content collections for sponsor data, inline SVG for icons, plain anchors for external links, and Astro component composition for section reordering.

The target section order (Hero → Key Numbers → Edition 2026 Combined → Mini-bloc 2023 → CFP → Sponsors Platinum) follows the conversion funnel used by KubeCon and major tech conferences. Estimated effort: 5-7 hours total.

## Stack Additions

**None.** Astro 6.1.5 + React 19.2 + Tailwind 4.2 + shadcn/ui unchanged. All new components are server-rendered `.astro` with zero hydration.

## Feature Landscape

### Table Stakes
- Hero with 3-button CTA row (Register + Schedule + Newsletter placeholder)
- Sponsor logos on homepage — Platinum tier only
- Section ordering per conversion funnel, validated in Stitch mockup

### Differentiators
- Combined Edition 2026 section (photos + film + replays CTA + PDF + testimonial cards)
- One-pager PDF link ("Télécharger le bilan 2026")
- Simplified 2023 mini-bloc (logo + link only, no photo grid)

### Deferred
- Newsletter backend (CLO-6), real testimonials, sponsor analytics

## Architecture

### New Components
1. **`Edition2026Combined.astro`** — merges photos/video/replays CTA/PDF link/testimonial cards into one section
2. **`SponsorsPlatinumStrip.astro`** — Platinum logo strip, `getCollection("sponsors")` filtered by tier
3. **`sponsor-utils.ts`** — extract `safeLogoPath()` and `safeUrl()` to share between sponsor components

### Modified Components
4. **`HeroSection.astro`** — new background image, opacity ~75%, ghost newsletter CTA (Accent Pink)
5. **`PastEditionMinimal.astro`** — make `photos` optional, remove photo grid rendering

## Critical Pitfalls

1. **Dual homepage divergence** — FR/EN `index.astro` files must change atomically
2. **i18n key drift** — `useTranslations` silently falls back to FR for missing EN keys
3. **Empty sponsor section** — guard with `platinumSponsors.length > 0`
4. **Dead newsletter anchor** — use `aria-disabled` or add scroll target
5. **Hero opacity contrast** — verify WCAG AA after opacity bump

## Build Order

1. Foundation — i18n keys, data constants, sponsor-utils extraction
2. New components — Edition2026Combined, SponsorsPlatinumStrip
3. Modify existing — PastEditionMinimal (photos optional), HeroSection (bg + CTA)
4. Homepage wiring — both index.astro files atomically, section reorder
5. Cleanup — orphaned imports, accessibility audit, contrast check

## Gaps to Address

- Hero background image — user-provided, blocks Phase 3
- 2026 replays playlist URL — needs confirmation
- PDF hosting — Google Drive link vs `public/` static file
- Newsletter anchor behavior — scroll-to-stub vs `aria-disabled` button

## Confidence: HIGH

All patterns verified by direct codebase inspection. No phase requires additional research.
