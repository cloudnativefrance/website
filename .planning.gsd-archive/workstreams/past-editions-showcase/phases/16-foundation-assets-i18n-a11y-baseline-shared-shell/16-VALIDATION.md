---
phase: 16
slug: foundation-assets-i18n-a11y-baseline-shared-shell
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-13
approved: 2026-04-13
---

# Phase 16 — Validation Strategy

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | vitest 4.1.x |
| Config file | vitest.config.ts |
| Quick run command | `pnpm exec vitest run tests/build/i18n-parity.test.ts tests/build/a11y-motion-reset.test.ts tests/build/kcd2023-assets.test.ts tests/build/past-edition-shell.test.ts` |
| Full suite command | `pnpm test` |
| Estimated runtime | ~0.3 s (Phase 16 subset) / ~0.5 s (full suite) |

## Sampling Rate

- After every task commit: quick run command above
- After every plan wave: `pnpm test`
- Before `/gsd-verify-work`: full suite must be green (except documented v1.0 carry-over) AND `pnpm build` must exit 0 with no new warnings
- Max feedback latency: < 1 s (all 4 Phase-16 tests import source directly, no dist/ dep)

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Decision Refs | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|---------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | A11Y-05 | D-07 | T-16-03 | reduced-motion disables animations site-wide | CSS-grep | `grep -q "prefers-reduced-motion: reduce" src/styles/global.css` | ✅ | ✅ |
| 16-01-02 | 01 | 1 | I18N-01 | D-04, D-06 | T-16-01 | bilingual key parity in ui.ts | TS-check | `pnpm exec tsc --noEmit` | ✅ | ✅ |
| 16-01-03 | 01 | 1 | I18N-02 | D-05 | T-16-01 | drift detected at CI time | unit (Vitest) | `pnpm exec vitest run tests/build/i18n-parity.test.ts` | ✅ | ✅ |
| 16-01-04 | 01 | 1 | EDIT-04 (logo asset) | D-03 | T-16-02 | logo assets present | fs | `test -f src/assets/logos/kcd2023/logo.svg && test -f src/assets/logos/kcd2023/logo-dark.svg` | ✅ | ✅ |
| 16-01-05 | 01 | 1 | A11Y-05 (guard) | D-07 | T-16-03 | A11Y reset stays at top level (Pitfall 3) | unit (Vitest) | `pnpm exec vitest run tests/build/a11y-motion-reset.test.ts` | ✅ | ✅ |
| 16-02-01 | 02 | 1 | EDIT-04 (input) | D-02 | — | originals staged locally, never committed | manual gate | `ls ./_photo-drop/kcd2023/ \| grep -ciE "\.(jpe?g\|png\|webp\|heic\|avif)$"` (≥ 10) | n/a | ✅ |
| 16-02-02 | 02 | 1 | EDIT-04 (asset) | D-01, D-02, D-11 | T-16-04, T-16-05, T-16-06 | photo budget enforced at write time | fs/size | `test "$(ls src/assets/photos/kcd2023/*.jpg \| wc -l)" -eq 10 && test -z "$(find src/assets/photos/kcd2023 -name '*.jpg' -size +1024k)" && test "$(du -cb src/assets/photos/kcd2023/*.jpg \| tail -1 \| awk '{print $1}')" -le 7340032` | ✅ | ✅ |
| 16-02-03 | 02 | 1 | EDIT-04 (asset guard) | D-01, D-02, D-03 | T-16-06 | photo + logo budget enforced at CI time | unit (Vitest) | `pnpm exec vitest run tests/build/kcd2023-assets.test.ts` | ✅ | ✅ |
| 16-03-01 | 03 | 1 | EDIT-04 (shell) | D-08, D-10 | T-16-07, T-16-08, T-16-09 | shell contract + no-hydration + DS-tokens-only | astro check | `pnpm exec astro check 2>&1 \| tee /tmp/astro-check.log && ! grep -iE "error.*past-editions\|past-editions.*error" /tmp/astro-check.log` | ✅ | ✅ |
| 16-03-02 | 03 | 1 | EDIT-04 (shell guard) | D-09 | T-16-07, T-16-08, T-16-09 | shell exists + Props locked + renders nowhere | unit (Vitest) | `pnpm exec vitest run tests/build/past-edition-shell.test.ts` | ✅ | ✅ |
| 16-04-01 | 04 | 2 | all | D-11 | T-16-10 | zero-NEW-warnings build + Phase-16 tests green (v1.0 carry-over SPKR-01 out-of-scope per STATE.md) | build + test | `pnpm build` (exit 0) + `pnpm exec vitest run tests/build/i18n-parity.test.ts tests/build/a11y-motion-reset.test.ts tests/build/kcd2023-assets.test.ts tests/build/past-edition-shell.test.ts` | ✅ | ✅ |

Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky

## Wave 0 Requirements

- [x] Vitest framework already installed (vitest.config.ts at repo root)
- [x] `@` alias already wired
- [x] tests/build/ folder conventions already in use

Existing infrastructure covers all phase requirements — no Wave 0 scaffolding needed beyond the four new test files shipped in plans 01, 02, and 03.

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| prefers-reduced-motion reset actually disables a real animation in a real browser | A11Y-05 | No animated component ships in Phase 16 yet | Verified end-to-end in Phase 20 via Playwright `emulateMedia({ reducedMotion: 'reduce' })` on the testimonials marquee |
| KCD logo contrast on --color-secondary | D-03 / RESEARCH.md Pitfall 5 | Subjective contrast read; placeholder SVGs in use until official asset lands (I18N-03 gate) | Phase 19 visual review — not a Phase 16 blocker |
| User stages 10 photo originals into `_photo-drop/kcd2023/` | EDIT-04 (input) | Originals are local-only and never committed | Plan 16-02 Task 1 human gate — user confirmed originals via zip drop 2026-04-13 |

## Validation Sign-Off

- [x] All tasks have automated verify (or are explicit manual gates with shell verification command)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] No watch-mode flags
- [x] Feedback latency < 1 s (actual measured from the baseline run: 0.27 s for the Phase-16 subset)
- [x] `nyquist_compliant: true` set in frontmatter
- [x] `pnpm build` exits 0 with no NEW warnings attributable to Phase 16 files (154 pages built in 8.62 s)
- [x] Phase 16 test files pass: 15/15 tests green across `i18n-parity`, `a11y-motion-reset`, `kcd2023-assets`, `past-edition-shell`
- [x] Per-Task Verification Map covers every task across plans 16-01..16-04 (11 rows)

### Pre-existing Carry-Over (out of scope per STATE.md)

`tests/build/speakers-grid.test.ts` reports 5 failures (SPKR-01 fixture drift). STATE.md §"Carry-Over from v1.0 (not in v1.1)" explicitly lists this under P2 items deferred out of v1.1. Phase 16 does NOT touch `src/pages/speakers/**`, `src/content/schedule/**`, or any speaker-related code; these failures are not Phase-16 regressions. They remain tracked for a future dedicated fixture-update phase.

Approval: approved 2026-04-13
