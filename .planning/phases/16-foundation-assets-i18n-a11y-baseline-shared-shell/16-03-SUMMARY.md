---
phase: 16
plan: 03
subsystem: past-editions
tags: [astro, component, shell, edit-04, d-08, d-09, d-10]
requirements: [EDIT-04]
dependency-graph:
  requires: []
  provides:
    - "src/components/past-editions/PastEditionSection.astro (prop-driven shell)"
    - "tests/build/past-edition-shell.test.ts (D-09 safeguard)"
  affects:
    - "Phase 17 — mounts shell with 2026 props on homepage"
    - "Phase 19 — mounts shell with 2023 props (photos + brandCallout)"
tech-stack:
  added: []
  patterns:
    - "Prop-driven .astro shell with locked Props interface (D-08)"
    - "Independent optional slots rendered in fixed order"
    - "youtube-nocookie.com iframe with whitelisted allow attrs (T-16-07/08)"
    - "Vitest text-only safeguard (Pitfall 2 — no .astro SFC import)"
key-files:
  created:
    - "src/components/past-editions/PastEditionSection.astro"
    - "tests/build/past-edition-shell.test.ts"
  modified: []
decisions:
  - "ImageMetadata imported from 'astro' top-level (Pitfall 4) — not 'astro:assets'"
  - "Doc comment uses 'No hydration directives' rather than 'No client:*' to avoid false positive in plan grep '! grep -q client:'"
  - "Shell file marked rendered-nowhere via PAGES_DIR walk in Vitest, not via build-output diff (faster, deterministic)"
metrics:
  duration: ~6 minutes
  completed: 2026-04-13
  tasks_completed: 2
  files_created: 2
  files_modified: 0
  commits: 2
---

# Phase 16 Plan 03: Shared PastEditionSection Shell + D-09 Safeguard Summary

Prop-driven `PastEditionSection.astro` shell created with the locked D-08 Props interface; Vitest safeguard enforces shell exists, has all 8 Props names, ships no hydration, and is imported by zero `src/pages/**` files.

## Render Order (D-08, locked)

1. PLACEHOLDER badge (when `placeholder === true`)
2. Rotated rail label (rail prop, hidden < md breakpoint)
3. `<h2>` heading
4. 3-up stats `<dl>`
5. Photo mosaic `<div class="grid-cols-12">` (when `photos` present)
6. Featured video `<figure>` + youtube-nocookie iframe + optional playlist CTA (when `video` present)
7. Brand callout `<aside class="bg-secondary">` with logo + body (when `brandCallout` present)
8. Gallery CTA `<a>` (when `galleryCta` present)

All 8 D-08 prop names verified present by safeguard test:
`rail`, `heading`, `stats`, `photos`, `video`, `brandCallout`, `galleryCta`, `placeholder`.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Create PastEditionSection.astro shell (D-08 / D-10) | `b1be20f` | src/components/past-editions/PastEditionSection.astro |
| 2 | Add shell-exists + renders-nowhere Vitest safeguard (D-09) | `87bfb00` | tests/build/past-edition-shell.test.ts |

## Verification Results

- `test -f src/components/past-editions/PastEditionSection.astro` — passes
- `grep -q "interface Props"` + 8 prop-name greps — pass
- `grep -E "#[0-9a-fA-F]{3,8}"` — no matches (D-10 DS tokens only)
- `grep "client:"` — 0 matches (no hydration)
- `pnpm exec astro check` — 0 errors mentioning `past-editions` (3 pre-existing `src/content.config.ts` errors are out-of-scope, documented in STATE.md carry-over list per D-11)
- `pnpm exec vitest run tests/build/past-edition-shell.test.ts` — **4/4 tests pass in 108 ms**

## Safeguard Test Count

**4 tests**, all passing:
1. `EDIT-04: PastEditionSection shell › exists at src/components/past-editions/PastEditionSection.astro`
2. `EDIT-04: PastEditionSection shell › declares the locked D-08 Props interface with all 8 prop names`
3. `EDIT-04: PastEditionSection shell › has no client:* directive (D-08: pure Astro, no hydration)`
4. `D-09: shell is rendered nowhere in Phase 16 › no src/pages/** file imports PastEditionSection`

## Deviations from Plan

None — plan executed exactly as written. One trivial wording change inside the file's leading doc comment ("No hydration directives" instead of "No client:* directives") to keep the plan's literal `! grep -q "client:"` acceptance check truthful; functional behavior unchanged.

## Threat Model Status

All STRIDE entries from plan honored:
- T-16-07 (Information Disclosure, YouTube iframe): mitigated via `youtube-nocookie.com` domain.
- T-16-08 (Tampering, iframe src concat): build-time prop only; no runtime user input path.
- T-16-09 (XSS, prop interpolation): accepted — Astro auto-escapes; no `set:html` in shell.

No new threat surface flags discovered.

## Self-Check: PASSED

- FOUND: src/components/past-editions/PastEditionSection.astro
- FOUND: tests/build/past-edition-shell.test.ts
- FOUND commit: b1be20f
- FOUND commit: 87bfb00
