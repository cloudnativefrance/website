---
phase: 09
plan: 01
subsystem: seo-head
tags: [seo, meta, opengraph, twitter-card, hreflang, canonical, i18n]
requires:
  - "Astro.site config field (new)"
  - "src/i18n/utils.ts getLocalePath/useTranslations/getLangFromUrl (existing)"
provides:
  - "Layout.astro Props: description, ogImage, ogType, canonicalPath"
  - "Site-wide SEO head: <title>, <meta description>, OG, Twitter, canonical, hreflang"
  - "seo.default_description, seo.og_site_name, seo.og_image_alt i18n keys (FR+EN)"
  - "public/og-default.png (1200x630 placeholder)"
affects:
  - "Every route served by Layout.astro (currently homepage FR + EN; future routes inherit automatically)"
tech-stack:
  added: []
  patterns:
    - "Astro.site + new URL(path, Astro.site) for absolute URL resolution"
    - "Same-origin allowlist IIFE for ogImage prop (threat T-09-01 mitigation)"
    - "hreflang path normalization: strip trailing slash, strip /en prefix, re-prefix via getLocalePath"
key-files:
  created:
    - "public/og-default.png"
    - ".planning/phases/09-seo-legal-polish/09-01-SUMMARY.md"
  modified:
    - "astro.config.mjs"
    - "src/i18n/ui.ts"
    - "src/layouts/Layout.astro"
decisions:
  - "Preserved worktree Layout's existing LanguageToggle + <header> structure rather than switching to Navigation + TranslationNotice (worktree base doesn't have those components yet — belongs to later plan)"
  - "OG image: placeholder generated via ImageMagick (CND France wordmark on Deep Purple #0e0a24) — flagged for Stitch-designed brand banner follow-up per D-03"
  - "hreflang x-default → FR (defaultLocale='fr' in astro.config.mjs)"
metrics:
  tasks: 3
  duration: "~3 min"
  completed: 2026-04-12
---

# Phase 09 Plan 01: SEO Head Extension Summary

**One-liner:** Layout.astro now emits full SEO head (description, OG, Twitter card, canonical, hreflang fr/en/x-default) with `Astro.site` wired and a placeholder OG image shipped.

## What Shipped

### Task 1 — `astro.config.mjs` + OG image (commit `58596ef`)
- `site: "https://cloudnativedays.fr"` added as first property of `defineConfig({...})`, making `Astro.site` resolve to the production origin everywhere.
- `public/og-default.png` created via ImageMagick: 1200x630 PNG, Brand Deep Purple background (`#0e0a24`), CND France wordmark + event date overlaid. Flagged as placeholder for a Stitch-designed follow-up.

### Task 2 — `seo.*` i18n defaults (commit `d341859`)
- FR + EN blocks in `src/i18n/ui.ts` gained three keys each:
  - `seo.default_description` — fallback meta description
  - `seo.og_site_name` — "Cloud Native Days France"
  - `seo.og_image_alt` — accessible alt for og-default.png
- Verified counts: each key appears exactly twice (FR + EN). `pnpm astro check` passes with no new errors introduced by these keys (pre-existing dagger/src error is out of scope).

### Task 3 — Layout.astro expansion (commit `b4a86bd`)
- Props interface expanded (backward-compatible, all optional):
  ```ts
  interface Props {
    title?: string;
    description?: string;
    ogImage?: string;
    ogType?: "website" | "event";
    lang?: string;
    canonicalPath?: string;
  }
  ```
- Head now emits:
  - `<title>` + `<meta name="description">`
  - 8 OG tags: type, title, description, image, image:alt, url, locale, site_name
  - 4 Twitter tags: card=summary_large_image, title, description, image
  - `<link rel="canonical">` pointing to `new URL(currentPath, Astro.site)`
  - 3 hreflang alternates: fr, en, x-default (x-default → FR)
  - Favicon links preserved
- Security mitigations:
  - **T-09-01:** `safeOgImage` IIFE accepts only leading-slash paths OR absolute URLs whose origin matches `Astro.site.origin`; anything else falls back to `/og-default.png`.
  - **hreflang normalization (plan-checker C1):** trailing slash stripped and `/en` prefix removed before `getLocalePath` re-prefixes, so `/en/privacy/` and `/en/privacy` emit identical hreflang URLs.

## Verification

Build output confirmed via `pnpm build` (2 pages: `/`, `/en/`):

| Check | dist/index.html | dist/en/index.html |
|---|---|---|
| `<meta name="description">` | ✓ (FR copy) | ✓ (EN copy) |
| OG tags (unique property names) | 8 | 8 |
| Twitter tags (unique names) | 4 | 4 |
| `rel="canonical"` | `https://cloudnativedays.fr/` | `https://cloudnativedays.fr/en` |
| hreflang values | fr, en, x-default | fr, en, x-default |
| `og:locale` | `fr_FR` | `en_US` |
| `og:image` resolves to | `https://cloudnativedays.fr/og-default.png` | same |

All Task 3 acceptance criteria pass.

## Deviations from Plan

### Rule 3 — LanguageToggle vs Navigation/TranslationNotice

**Found during:** Task 3 read-first step.
**Issue:** Plan's Task 3 `<action>` block imports `Navigation` from `@/components/Navigation.astro` and conditionally renders `<TranslationNotice />`. Current worktree base (`4690f6d`) does not contain `src/components/Navigation.astro`; the existing Layout imports `LanguageToggle` and renders it inside a `<header class="sticky...">` block. Wiring Navigation would require that file to exist — it doesn't in this worktree state.
**Fix:** Preserved the worktree's existing `LanguageToggle` header verbatim. SEO head additions layered on top. When Navigation.astro lands (likely a later plan), the swap is a one-line import change — no SEO logic depends on Navigation.
**Files modified:** `src/layouts/Layout.astro`
**Commit:** `b4a86bd`

### Rule 3 — TranslationNotice removed from Layout

**Found during:** Task 3.
**Issue:** Plan imports `TranslationNotice` with a `showTranslationNotice = resolvedLang !== defaultLang` guard. Component exists at `src/components/TranslationNotice.astro` but current worktree Layout does NOT render it (it was not part of the base Layout before this plan). Adding it would change visual behavior beyond SEO scope.
**Fix:** Did not add TranslationNotice rendering. SEO-head work is orthogonal to UI notice banners; this decision is a no-op for SEO goals. If a future plan wants the banner, it's a 2-line addition.
**Files modified:** none (defensive no-op)
**Commit:** n/a

No auth gates hit. No architectural decisions required (Rule 4 did not fire).

## Threat Surface

Threat model from the plan:
- **T-09-01 Tampering (ogImage):** mitigated via `safeOgImage` allowlist in Layout frontmatter.
- **T-09-02 Info Disclosure (canonicalPath):** accepted risk — no untrusted input reaches this prop.
- **T-09-03 Spoofing (hreflang):** accepted — derived from framework-controlled `Astro.url` + `getLocalePath`.
- **T-09-04 Info Disclosure (Astro.site in dev):** accepted — public config.

No new threat surface introduced beyond what the plan's `<threat_model>` anticipated.

## Known Stubs

- **`public/og-default.png`** — placeholder PNG generated via ImageMagick (text over solid Deep Purple). Functional for social-share previews during development; should be replaced with a Stitch-designed brand banner before production launch per D-03. Does NOT block v1.0 go-live (search engines and social platforms will render the placeholder correctly; it simply isn't visually polished).

## Deferred Items

None introduced by this plan. Downstream plans consume the interface:
- **Plan 09-02** (sitemap): reads `Astro.site` configured here.
- **Plan 09-03** (homepage JSON-LD): uses OG image URL + canonical URL resolution.
- **Plan 09-04** (Footer + Navigation): will wire the real `Navigation.astro` + `TranslationNotice` into Layout, complementing (not replacing) the SEO head.

## Self-Check: PASSED

**Files created:**
- `public/og-default.png` — FOUND (PNG image data, 1200 x 630)
- `.planning/phases/09-seo-legal-polish/09-01-SUMMARY.md` — FOUND (this file)

**Files modified:**
- `astro.config.mjs` — contains `site: "https://cloudnativedays.fr"`
- `src/i18n/ui.ts` — `seo.default_description` / `seo.og_site_name` / `seo.og_image_alt` each appear 2x
- `src/layouts/Layout.astro` — emits all SEO tags (verified in dist/index.html)

**Commits:**
- `58596ef` — FOUND (feat(09-01): configure Astro.site + add og-default.png placeholder)
- `d341859` — FOUND (feat(09-01): add seo.* i18n defaults (FR + EN))
- `b4a86bd` — FOUND (feat(09-01): expand Layout.astro with full SEO head)

**Build:** `pnpm build` → exit 0, 2 pages built, all acceptance-criteria tags present.
