---
phase: 26
plan: 02
subsystem: branding
tags: [favicon, branding, brnd-01, france, tricolor, static-asset]
requires: []
provides: [tricolor-favicon]
affects: [public/favicon.svg]
tech-stack:
  added: []
  patterns: [inline-svg-favicon, square-viewbox, crispEdges-rendering]
key-files:
  created: []
  modified:
    - public/favicon.svg
decisions:
  - "Used contemporary French government palette (#002654 / #FFFFFF / #ED2939) — same blue + red used on Élysée brand assets (lighter saturation than 1976-2020 navy/red variant)"
  - "Square 1:1 viewBox (3x3) instead of real-flag 2:3 — browsers render favicons into a square slot; 2:3 would either letterbox or stretch"
  - "shape-rendering=crispEdges keeps band boundaries pixel-sharp at favicon sizes (16x16/32x32/48x48)"
  - "No prefers-color-scheme variant — a national flag has no dark-mode form (previous monogram needed it as a single-colour glyph; tricolor doesn't)"
  - "public/favicon.ico left untouched as legacy fallback — regenerating .ico from new SVG requires graphics tooling; user can drop a custom .ico later for pixel-perfect legacy parity"
  - "src/layouts/Layout.astro untouched — existing <link rel=\"icon\" type=\"image/svg+xml\" href=\"/favicon.svg\" /> already targets the right path; swap is purely the file body"
metrics:
  duration: ~3 min
  completed: 2026-04-19
---

# Phase 26 Plan 02: Favicon Swap Summary

Swapped `public/favicon.svg` from the generic 'A'-monogram to a 3-band French tricolor (Bleu de France / White / Rouge de France) so browser tabs, bookmarks, and Apple touch-icon contexts surface the French flag, satisfying BRND-01 at the asset layer with zero plumbing changes (`Layout.astro` already pointed at `/favicon.svg`).

## What Shipped

### `public/favicon.svg` (5 lines, 347 bytes)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 3" shape-rendering="crispEdges">
    <title>Drapeau de la France — Cloud Native Days France</title>
    <rect x="0" y="0" width="1" height="3" fill="#002654" />
    <rect x="1" y="0" width="1" height="3" fill="#FFFFFF" />
    <rect x="2" y="0" width="1" height="3" fill="#ED2939" />
</svg>
```

### Untouched (intentional)

- `public/favicon.ico` — git-clean (legacy fallback retained for IE/old Edge < 79)
- `src/layouts/Layout.astro` — git-clean (existing `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` on line 92 already loads the new file; `<link rel="icon" type="image/x-icon" href="/favicon.ico" />` on line 93 still points at the unchanged legacy fallback)

## .ico vs .svg Compatibility Note

- **Modern browsers (~99% of traffic)** — Chrome ≥80, Firefox ≥41, Safari ≥9, Edge ≥79 prefer the SVG declaration on Layout line 92 → see the new tricolor immediately on next page load.
- **Legacy browsers (~1%)** — IE 11 / Edge < 79 fall back to the unchanged `public/favicon.ico` → keep showing the old monogram .ico.
- If pixel-perfect legacy parity matters, the user can later drop a custom `.ico` regenerated from the new SVG via ImageMagick / Pillow.

## Verification

| Check | Result |
|-------|--------|
| `#002654` present | 1 occurrence |
| `#FFFFFF` present | 1 occurrence |
| `#ED2939` present | 1 occurrence |
| `<rect>` count | 3 (blue/white/red) |
| `prefers-color-scheme` | 0 (correct — flag has no dark variant) |
| Square viewBox | 3 x 3 (1:1) |
| `Layout.astro` diff | 0 files changed |
| `favicon.ico` diff | 0 files changed |
| `bun run build` | exit 0, 156 pages built in 6.52s |
| `dist/favicon.svg` | byte-identical to `public/favicon.svg` (347 bytes) |

## Deviations from Plan

None — plan executed exactly as written.

## Threat Model Compliance

- **T-26-07 (Tampering)** — mitigated: only `<svg>`, `<title>`, 3 `<rect>` elements present; grep `<rect>` count == 3 confirms no extra-element injection.
- **T-26-08 (Information Disclosure)** — mitigated: no external `href`, no `<image>` element, no `<script>` element; favicon does not phone home.
- **T-26-09 (XSS)** — accepted: file body has no `<script>`; browsers also disable script execution for SVGs loaded as `<link rel="icon">`.
- **T-26-10 (DoS)** — accepted: 347 bytes, cannot exhaust client memory.

## Next Plan Readiness

Plan 26-03 (orphan component cleanup) is independent of this plan and can run next (or in parallel under wave 1 in the orchestrator's wave mapping). No shared file surface — favicon swap touches only `public/favicon.svg`; orphan cleanup operates on `src/components/**` legacy files.

## Self-Check: PASSED

- `public/favicon.svg` exists at expected path: FOUND
- Commit `a05b034` exists in git log: FOUND
