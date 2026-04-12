---
phase: 09
plan: 04
subsystem: footer
tags: [footer, i18n, social-links, navigation, layout, a11y]
dependency-graph:
  requires:
    - src/layouts/Layout.astro (post-09-01 expanded Props + head)
    - src/components/Navigation.astro (nav.* keys + isActive pattern)
    - src/components/speakers/SocialLinks.astro (safeUrl allowlist pattern)
    - src/i18n/ui.ts (existing fr + en blocks)
    - src/i18n/utils.ts (getLangFromUrl, useTranslations, getLocalePath)
  provides:
    - src/components/Footer.astro (site-wide footer, rendered in every route)
    - 15 footer.* i18n keys × 2 locales (30 total)
  affects:
    - Every built page (152 pages) — footer now renders below <slot />
tech-stack:
  added: []
  patterns:
    - safeUrl() http/https allowlist (mirrors SocialLinks.astro, closes T-09-11 XSS)
    - target=_blank + rel=noopener noreferrer on external anchors (T-09-12)
    - Semantic landmark: <footer role="contentinfo"> — pairs with existing <header role="banner">
    - aria-current="page" on active-route link (mirrors Navigation.astro)
key-files:
  created:
    - src/components/Footer.astro
    - .planning/phases/09-seo-legal-polish/09-04-SUMMARY.md
  modified:
    - src/i18n/ui.ts (appended 30 footer.* keys)
    - src/layouts/Layout.astro (import + render <Footer />)
decisions:
  - Footer uses token-first palette (bg-background / text-muted-foreground / text-foreground / text-primary / border-border). Zero bg-card, zero accent-pink per 09-UI-SPEC.
  - Social URL placeholders embedded inline (safeUrl-filtered) and flagged as TODO for user to confirm before launch.
  - Bottom-row KCD affiliation is text-only (no KCD logo) per DESIGN.md §400 and D-04.
metrics:
  tasks_completed: 3
  tasks_total: 3
  commits: 3
  files_created: 2
  files_modified: 2
  built_pages: 152
  completed: 2026-04-12
---

# Phase 9 Plan 04: Footer Component Summary

Site-wide `<footer role="contentinfo">` component rendering on every route below `<slot />`; 3-column compact desktop grid (Brand / Quick Nav / Community + Legal), stacks to single column on mobile; 4 social anchors gated through safeUrl() allowlist; bottom row shows copyright + subtle KCD Community Days affiliation per D-04.

## What Shipped

### Task 1 — i18n keys (commit `6150d01`)
Appended 15 `footer.*` keys to BOTH `fr:` and `en:` blocks in `src/i18n/ui.ts`:

| Key | Purpose |
|-----|---------|
| `footer.tagline` | 1-line tagline under wordmark |
| `footer.association` | "Organisé par Cloud Native France (loi 1901)" / EN variant |
| `footer.nav.heading` | Column 2 heading |
| `footer.community.heading` | Column 3 upper heading |
| `footer.legal.heading` | Column 3 lower heading |
| `footer.legal.coc` / `.privacy` / `.terms` | Legal link labels |
| `footer.copyright` | Bottom-row left text |
| `footer.kcd_affiliation` | Bottom-row right text (KCD co-branding) |
| `footer.social.{linkedin,youtube,bluesky,twitter}_aria` | Social anchor aria-labels |
| `footer.landmark_aria` | `<footer>` aria-label |

No new `nav.*` keys added — Quick Nav column reuses existing `nav.home`, `nav.speakers`, `nav.schedule`, `nav.sponsors`, `nav.venue`, `nav.team`.

### Task 2 — Footer.astro (commit `1634432`)
Created `src/components/Footer.astro` (159 lines) matching 09-UI-SPEC contract:

- **Layout:** `max-w-7xl px-4 md:px-6 py-12 mt-24`; desktop 3-col `grid md:grid-cols-3`; mobile stacks.
- **Column 1 (Brand):** Full logo (`h-8`), tagline, association line.
- **Column 2 (Quick Nav):** Mirrors Navigation.astro order (Home → Speakers → Schedule → Sponsors → Venue → Team). Active route: `text-primary` + `aria-current="page"`. Inactive: `text-muted-foreground hover:text-primary`.
- **Column 3 (Community + Legal):** Row of 4 social icons (inline lucide-geometry + brand SVG paths for Bluesky + X), then legal link list (CoC / Privacy / Terms).
- **Bottom row:** `border-t border-border`, copyright left, KCD affiliation right.
- **Accessibility:** `<footer role="contentinfo" aria-label>`, visible focus rings (`ring-ring ring-offset-background`), `role="list"` on all ULs, `aria-current="page"`, `aria-label` on every social anchor from i18n.
- **Security (T-09-11, T-09-12):** Every social URL flows through `safeUrl()` which accepts only `http:` / `https:` protocols — `javascript:`, `data:`, etc. → null → icon hidden. All social anchors carry `target="_blank" rel="noopener noreferrer"`.
- **Zero client JS.** Pure Astro.

### Task 3 — Layout.astro wire-up (commit `831dd27`)
Added `import Footer from "@/components/Footer.astro";` alongside existing Navigation + TranslationNotice imports; rendered `<Footer />` inside `<body>`, directly after `<slot />`, before `</body>`. No other Layout.astro changes.

## Verification

Build: `pnpm build` → 152 pages (matches pre-footer count; footer is global, adds zero routes). Built output sampled:

| Page | `role="contentinfo"` count | Copy |
|------|---------------------------|------|
| `dist/index.html` | 1 | FR ("Événement officiel KubeCon Community Days") |
| `dist/en/index.html` | 1 | EN ("Official KubeCon Community Days event") |
| `dist/sponsors/index.html` | 1 | — |
| `dist/venue/index.html` | 1 | — |
| `dist/programme/index.html` | 1 | — |
| `dist/speakers/index.html` | 1 | — |

Exactly one contentinfo landmark per page. Copy localized per route. Sitemap still generates (`dist/sitemap-index.xml`).

## Stitch Gate

Footer Stitch mockup `774d72bae8a14c9cb35e611ce1460326` (CND France 2027 project, design system asset 3926684191749761173) was approved by user on 2026-04-12 (DS tokens only — zero new hexes, zero Accent Pink). Implementation matches the approved contract.

## Deviations from Plan

None — plan executed exactly as written.

### Auth gates
None.

### Deferred Issues (out of scope per Rule Scope Boundary)
- `pnpm astro check` reports 33 pre-existing errors in unrelated files (`src/pages/speakers/index.astro` — missing `talkDuration` / `talkTitle` fields on speakers collection schema; others in routes not touched by this plan). These errors exist on `main` prior to this plan and are out of scope for 09-04. Logged for a future phase cleanup. Not caused by this plan — `src/components/Footer.astro`, `src/i18n/ui.ts`, and `src/layouts/Layout.astro` changes contribute zero new type errors; `pnpm build` exits 0 (Astro's default `check` strictness ≠ build strictness).

## TODO — User action before production launch

**Social URL placeholders** in `src/components/Footer.astro` — confirm/replace before launch:

| Platform | Placeholder URL in source |
|----------|----------------------------|
| LinkedIn | `https://www.linkedin.com/company/cloud-native-france/` |
| YouTube  | `https://www.youtube.com/@cloudnativedays` |
| Bluesky  | `https://bsky.app/profile/cloudnativedays.fr` |
| X/Twitter| `https://x.com/cloudnativedays` |

If any URL is invalid, `safeUrl()` returns null → that icon is silently hidden. No breakage risk; worst case is a missing icon.

## Requirements Closed

- **META-07** ✓ — Footer with social links (LinkedIn, YouTube, Bluesky, X), association info, legal page links, site-wide.

## Self-Check: PASSED

- `src/components/Footer.astro` — FOUND
- `src/i18n/ui.ts` (30 footer.* keys) — FOUND (`rg -c '"footer\.' src/i18n/ui.ts` → 30)
- `src/layouts/Layout.astro` import + render — FOUND
- Commits:
  - `6150d01` feat(09-04): add 15 footer.* i18n keys (FR + EN) — FOUND
  - `1634432` feat(09-04): add site-wide Footer component — FOUND
  - `831dd27` feat(09-04): wire Footer into Layout.astro — FOUND
- Build: 152 pages, contentinfo landmark present on sampled FR + EN routes — VERIFIED
