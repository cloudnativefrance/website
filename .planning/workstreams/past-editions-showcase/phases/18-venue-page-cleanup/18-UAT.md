---
status: complete
phase: 18-venue-page-cleanup
source:
  - 18-01-SUMMARY.md
  - 18-02-SUMMARY.md
started: 2026-04-14T07:55:00Z
updated: 2026-04-14T07:55:00Z
---

## Current Test

(none — all 5 tests complete)

## Tests

### 1. Venue Page Cold Load (FR)
expected: On http://localhost:4321/venue the page renders without console errors and shows no trace of the "Previous edition 2026" block (no rotated rail, no 1700+/50+/40+ stats, no YouTube video, no ambiance photos, no "Voir la galerie complète" CTA). The page still has its hero, transport, accessibility, map, and "Autour du CENTQUATRE" sections.
result: pass

### 2. Venue Page EN Parity
expected: On http://localhost:4321/en/venue the page similarly shows no "2026 edition — replay" block, no stats, no video, no ambiance photos, no "View the full 2026 gallery" link — everything else renders in English.
result: pass

### 3. Homepage 2026 Section Still Intact
expected: On http://localhost:4321/ and /en/ the `Edition 2026` section (rail + h2 + 3 stats + 2×2 ambiance grid + youtube-nocookie video + gallery CTA) is unchanged from Phase 17.
result: pass

### 4. Previous-Edition Anchor Audit
expected: No link anywhere in the site (footer, header, mobile nav, in-page copy) points to `#previous-edition`. Navigate through the header/footer and confirm nothing breaks or 404s.
result: pass

### 5. Visual Page-End on Venue
expected: Venue page ends cleanly on the last existing section (no visual gap, no floating divider, no empty whitespace suggesting removed content). Scroll through both `/venue` and `/en/venue` to confirm.
result: pass

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0

## Gaps

(none yet)
