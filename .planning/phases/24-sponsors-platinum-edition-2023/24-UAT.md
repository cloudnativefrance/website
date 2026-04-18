---
status: complete
phase: 24-sponsors-platinum-edition-2023
source:
  - 24-01-SUMMARY.md
  - 24-02-SUMMARY.md
  - 24-03-SUMMARY.md
started: "2026-04-18T19:45:00.000Z"
updated: "2026-04-18T20:00:00.000Z"
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: |
  Kill any running dev server. Run `bun run dev` from scratch. Dev server boots without errors, homepage at http://localhost:4321/ (FR) and http://localhost:4321/en/ (EN) both load without console errors, and the existing homepage sections render normally (Hero, Key Numbers, Edition 2026, CFP, etc.). Phase 24's two new components (SponsorsPlatinumStrip, Edition2023Link) are NOT yet mounted — you should see NO visual change on the homepage compared to before Phase 24.
result: pass

### 2. Sponsors Page Regression (SponsorCard Refactor)
expected: |
  Visit http://localhost:4321/sponsors and http://localhost:4321/en/sponsors. Every sponsor card renders its logo, name, and the link to the sponsor site (click a few — they open in a new tab with `rel=noopener`). The `SponsorCard` component was refactored in 24-01 to import `safeUrl` + `safeLogoPath` from the new `src/lib/sponsor-utils.ts` — behaviour should be identical to before: same allowlist, same null returns, same trim semantics. Nothing should look visually different from the pre-Phase-24 state.
result: pass

### 3. 2023 Edition Page + Mini-Bloc Unchanged
expected: |
  Visit http://localhost:4321/2023 (if it exists as a page) or confirm the existing `PastEditionMinimal` mini-bloc on the homepage (if mounted) still renders the same photo grid + YouTube playlist link as before — Phase 24 did NOT touch `PastEditionMinimal.astro` (Phase 26 will replace it with the new `Edition2023Link.astro`). The `Edition2023Link.astro` component exists in the codebase but is not yet mounted anywhere.
result: pass

### 4. i18n Key Parity (FR/EN Navigation)
expected: |
  Switch between FR (`/`) and EN (`/en/`) homepages. Navigation labels, section headings, and CTAs all render in the correct language. No placeholder strings like `[missing key]` or raw key paths appear. (The 2 new `sponsors.homepage.{heading,cta}` keys land in both locales but are not yet visible until Phase 26 mounts `SponsorsPlatinumStrip`.)
result: pass

### 5. Component File Inspection (Optional)
expected: |
  Skip unless you want to visually inspect the new components before Phase 26. The two new files live at `src/components/sponsors/SponsorsPlatinumStrip.astro` and `src/components/past-editions/Edition2023Link.astro`. Both are pure-SSR Astro, data-agnostic (prop-driven). Open them in your editor — do they look structurally sound, match the Stitch mockup you approved in the UI-SPEC phase, and use DS tokens only (no ad-hoc hex/rgb)? Type "skip" if you're comfortable waiting until Phase 26 mounts them.
result: skipped
reason: "User opted to defer visual inspection until Phase 26 mounts the components on the homepage"

## Summary

total: 5
passed: 4
issues: 0
pending: 0
skipped: 1

## Gaps

[none yet]
