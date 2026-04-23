---
status: testing
phase: 17-integrate-2026-edition-section-on-homepage
source:
  - 17-01-SUMMARY.md
  - 17-02-SUMMARY.md
  - 17-03-SUMMARY.md
started: 2026-04-14T05:20:00Z
updated: 2026-04-14T05:20:00Z
---

## Current Test

number: 3
name: Edition 2026 Section Content
expected: |
  The Edition 2026 block shows a rotated "EDITION 2026" rail on the left, an h2 heading, three stats (1700+, 50+, 40+), four ambiance photos in a 2×2 uniform grid, a compact YouTube (no-cookie) video, and a "gallery" CTA linking to the Ente album. No PLACEHOLDER badge.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running dev server. Run `pnpm build` from clean state. Build completes with no new errors/warnings. Then `pnpm dev` and load http://localhost:4321/ — homepage renders without console errors.
result: pass

### 2. Homepage Section Order (FR)
expected: On `/`, scrolling down shows sections in this order — Hero → KeyNumbers → CFP → Edition 2026 → Edition 2023. No legacy venue section mixed in.
result: pass

### 3. Edition 2026 Section Content
expected: The Edition 2026 block shows a rotated "EDITION 2026" rail on the left, an h2 heading, three stats (1700+, 50+, 40+), four ambiance photos in a 2×2 uniform grid, a compact YouTube (no-cookie) video, and a "gallery" CTA linking to the Ente album. No PLACEHOLDER badge.
result: [pending]

### 4. Edition 2023 Section Content
expected: The Edition 2023 block shows a rotated "EDITION 2023" rail, h2 heading, three stats (1700+, 42, 24), six KCD 2023 photos in a uniform 3×2 medium grid, the 2023 playlist video embed with "Watch all 2023 sessions" CTA, and a KCD France 2023 brand-callout (logo + note).
result: issue
reported: "2023 section has too many things — it happened many years ago. Keep only: 3 photos, the logo, and the link to the videos."
severity: major

### 5. Deep-Link Anchor Scroll
expected: Visiting `/#edition-2026` or `/#edition-2023` scrolls to that section with ~80px clearance below the sticky nav (no overlap with nav bar). Works on both FR and EN homepages.
result: [pending]

### 6. English Homepage Parity
expected: `/en/` shows the same section order and layout as `/`, with all 2026/2023 copy, rails, stats labels, and CTAs rendered in English. No FR strings leak through.
result: [pending]

### 7. Homepage Heading Hierarchy
expected: The homepage has exactly one `<h1>` (it may be visually hidden but present in DOM), and no heading levels are skipped. Use browser DevTools → Accessibility tab or view-source to confirm.
result: [pending]

### 8. Legacy Venue Page Intact
expected: `/venue` (or `/en/venue`) still renders the pre-existing 2026 block with stats, YouTube iframe, gallery CTA, and rail — unchanged from before Phase 17.
result: [pending]

### 9. Reduced-Motion Respect
expected: With OS "reduce motion" enabled, no autoplay, transform-heavy animations, or scroll-jacking occur on the homepage sections.
result: [pending]

## Summary

total: 9
passed: 2
issues: 1
pending: 6
skipped: 0

## Gaps

- truth: "Edition 2023 homepage section simplified: no rail, no h2/heading, no stats, no embedded video, no brand-note paragraph. Two-column layout — LEFT: 3 KCD 2023 photos + KCD 2023 logo; RIGHT: text link/CTA to the 2023 videos playlist. Section anchor id=edition-2023 preserved."
  status: failed
  reason: "User directives (2026-04-14): (1) Drop the rail. (2) Keep only 3 photos + logo + link to videos. (3) Layout = 3 photos + logo on LEFT, link to videos on RIGHT."
  severity: major
  test: 4
  artifacts:
    - src/pages/index.astro
    - src/pages/en/index.astro
    - src/components/past-editions/PastEditionSection.astro
    - src/lib/editions-data.ts
  missing:
    - 2-column compact variant of PastEditionSection (or a new lightweight PastEditionMinimal component)
    - Photo count reduction 6→3 (pick 3 of the current 01/03/05/07/08/10 masters)
    - Remove rail/h2/stats/video-embed/brand-callout from 2023 mount
    - Keep i18n for the "Watch all 2023 sessions" CTA (existing editions.2023.video_cta key)
