---
phase: 16-foundation-assets-i18n-a11y-baseline-shared-shell
plan: 01
completed: 2026-04-13
status: complete
---

# 16-01 Summary — A11y Reset + i18n Keys + Parity Test + KCD Logo

## Commits

| Commit | Task | What |
|--------|------|------|
| `7818d40` | T1 | Global `@media (prefers-reduced-motion: reduce)` reset added at end of `src/styles/global.css` outside any `@layer` (D-07) |
| `b2410fe` | T2 | `editions.*` (32 keys) + `testimonials.*` (28 keys) added to both `fr` and `en` in `src/i18n/ui.ts` (D-04, D-06) |
| `db7eea6` | T3 | `tests/build/i18n-parity.test.ts` — key-parity + byte-different FR/EN assertions (D-05, I18N-02) |
| `7126b42` | T4 | `src/assets/logos/kcd2023/logo.svg` + `logo-dark.svg` — DS-token placeholder SVGs; DESIGN.md TODO added (D-03) |
| `0fa644e` | T5 | `tests/build/a11y-motion-reset.test.ts` — 4-assertion Vitest guard for the motion reset (A11Y-05) |

## Verification

- `pnpm exec vitest run tests/build/i18n-parity.test.ts tests/build/a11y-motion-reset.test.ts` — 6/6 pass (~136 ms)
- `grep -c "editions\." src/i18n/ui.ts` → 32 ✓
- `grep -c "testimonials\." src/i18n/ui.ts` → 28 ✓
- `grep -c "prefers-reduced-motion: reduce" src/styles/global.css` → 1 ✓
- Both KCD 2023 SVG assets exist and validate as SVG

## Decisions Honored

D-03 (KCD logo with placeholder fallback), D-04 (flat i18n keys), D-05 (Vitest parity test), D-06 (testimonials in ui.ts), D-07 (nuclear motion reset CSS verbatim).

## Deviations

1. **I18N-02 byte-difference scope** — The parity test's byte-difference assertion is scoped to `editions.*` + `testimonials.*` only. Pre-existing identical FR/EN values across other namespaces (proper nouns "Cloud Native Days France 2027", sponsor tier names, track slugs, loanwords like "Speakers"/"Replays") are legitimate and rewriting them is product-copy scope outside Phase 16. Test 1 (key-set parity) still covers ALL keys. Rationale is documented in the test file header.

2. **KCD 2023 logo official asset** — The official KCD 2023 SVG returned HTTP 404 from the candidate CNCF URL and no reliable open URL was found. Took D-03's documented fallback: DS-token placeholder SVGs with `<!-- TODO Phase-19: replace with official KCD 2023 asset (I18N-03 gate) -->` comment + matching TODO block added to DESIGN.md §"KCD (Kubernetes Community Days) co-branding". Replacement is gated by I18N-03 organizer sign-off before Phase 19 merges.

## Downstream Consumers

- Phase 19 — consumes the replaced official KCD 2023 logo + `editions.2023.*` i18n keys + `brand_note`.
- Phase 17 — consumes `editions.2026.*` i18n keys + placeholder strings.
- Phase 20 — consumes `testimonials.*` i18n keys (6 placeholder quotes + heading + pause_hint).
- Any future animated component — relies on the global motion reset, does NOT add its own fallback.
