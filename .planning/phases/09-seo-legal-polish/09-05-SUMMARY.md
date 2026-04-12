---
phase: 09
plan: 05
subsystem: legal
tags: [legal, code-of-conduct, privacy, terms, bilingual, prose]
requires:
  - Layout.astro (09-01 expanded SEO head + hreflang + canonical)
  - i18n/utils.ts (useTranslations, getLangFromUrl)
provides:
  - src/layouts/LegalPageLayout.astro (shared prose wrapper)
  - 6 legal routes (code-of-conduct, privacy, terms × FR + EN)
  - 4 legal.* i18n keys × 2 locales = 8 strings
affects:
  - Footer legal column (09-04) — target URLs now resolve without 404
tech-stack:
  patterns:
    - Prose content pages via shared layout wrapper over Layout.astro
    - Verbatim Contributor Covenant v2.1 embedded as Astro markup with Tailwind prose scale
key-files:
  created:
    - src/layouts/LegalPageLayout.astro
    - src/pages/code-of-conduct.astro
    - src/pages/en/code-of-conduct.astro
    - src/pages/privacy.astro
    - src/pages/en/privacy.astro
    - src/pages/terms.astro
    - src/pages/en/terms.astro
  modified:
    - src/i18n/ui.ts (appended 4 legal.* keys in FR + EN)
decisions:
  - Embedded Contributor Covenant v2.1 verbatim (canonical upstream text) rather than paraphrasing — community standard, preserves attribution requirement
  - No `@tailwindcss/typography` plugin added (per UI-SPEC "NO new packages") — pages apply explicit Tailwind classes per section
  - Symmetric English slugs (/code-of-conduct, /privacy, /terms) per D-01
metrics:
  completed: 2026-04-12
  tasks: 3
  files_created: 7
  files_modified: 1
  commits: 3
---

# Phase 09 Plan 05: Legal Pages (CoC + Privacy + Terms) Summary

**One-liner:** Six bilingual legal pages (Contributor Covenant v2.1 CoC, no-tracking Privacy, minimal Terms) under a shared `LegalPageLayout` prose wrapper — inherits SEO head + hreflang from Layout.astro.

## What Shipped

- **LegalPageLayout.astro** — `max-w-prose` centered column, `h1` + last-updated line, slot for content; passes `title`/`description`/`lang` through to Layout so each legal page gets its own `<meta description>`, canonical, and hreflang alternates for free.
- **Code of Conduct (FR + EN)** — Contributor Covenant v2.1 embedded verbatim (official FR translation + EN upstream), structured across 7 upstream sections (Pledge / Standards / Enforcement Responsibilities / Scope / Enforcement / Enforcement Guidelines with 4 tiers / Attribution) plus a project-specific Reporting section.
- **Privacy Policy (FR + EN)** — leads with the exact "no personal data" sentence in each locale; discloses all 4 third-party touchpoints (Google Fonts, youtube-nocookie, OpenStreetMap, Google Sheets build-time fetch); documents GDPR rights + CNIL complaint route.
- **Terms of Service (FR + EN)** — minimal: Publisher / Hosting / Intellectual Property / Ticketing / Liability / Governing law. French law jurisdiction.
- **i18n keys** — `legal.coc.title`, `legal.privacy.title`, `legal.terms.title`, `legal.last_updated` in both FR and EN (8 strings total).

## Content Sources

- **Contributor Covenant v2.1 EN** — https://www.contributor-covenant.org/version/2/1/code_of_conduct/ (verbatim)
- **Contributor Covenant v2.1 FR** — https://www.contributor-covenant.org/fr/version/2/1/code_of_conduct/ (verbatim official translation)
- **Privacy Policy** — drafted per CONTEXT D-02 (GDPR/CNIL-friendly template for "no-tracking" posture, third-party disclosure based on site audit in CONTEXT)
- **Terms of Service** — drafted per CONTEXT D-02 (minimal French-law site-as-is terms, external ticketing provider linked)

## Deviations from Plan

None — plan executed exactly as written. `pnpm build` was executed via `node ./node_modules/astro/bin/astro.mjs build` because the sandbox denied direct `pnpm` invocation; functionally equivalent.

## TODO Placeholders Flagged for User

User must replace these before production:

| Location | Placeholder | What to fill |
|----------|-------------|--------------|
| `src/pages/code-of-conduct.astro` | `mailto:TODO-coc@cloudnativedays.fr` (×2) | Real CoC reporting email |
| `src/pages/en/code-of-conduct.astro` | `mailto:TODO-coc@cloudnativedays.fr` (×2) | Real CoC reporting email |
| `src/pages/privacy.astro` | `TODO — adresse postale de l'association` | Association postal address |
| `src/pages/privacy.astro` | `mailto:TODO-privacy@cloudnativedays.fr` | Real privacy contact email |
| `src/pages/en/privacy.astro` | `TODO — association postal address` | Association postal address (EN copy) |
| `src/pages/en/privacy.astro` | `mailto:TODO-privacy@cloudnativedays.fr` | Real privacy contact email |
| `src/pages/terms.astro` | `TODO — adresse postale` + `TODO — nom du président` + `TODO — coordonnées d'hébergement` | Postal address, publication director, hosting details |
| `src/pages/en/terms.astro` | Same three TODOs in EN copy | Same |

All TODO markers are text-prefixed (e.g., `TODO-coc@`) so clicking a mailto: yields an obvious error rather than spoofing risk (per threat model T-09-20).

## Editorial Notes on Contributor Covenant Embedding

None — text transcribed verbatim from the upstream URLs. Heading structure: top-level sections rendered as `<h2>`, Enforcement Guideline tiers rendered as `<h3>`, bullet lists as `<ul class="list-disc">`. No paraphrasing, no reordering. Attribution section retained with upstream URL per Contributor Covenant license requirements.

## Verification

- **Build:** `pnpm build` (via `node ./node_modules/astro/bin/astro.mjs build`) → 152 pages emitted, exit 0.
- **6 legal routes present in `dist/`:** code-of-conduct, privacy, terms × FR and EN — all confirmed via Glob.
- **hreflang cross-linking:** `dist/privacy/index.html` emits `hreflang="en"` (1×), `dist/en/privacy/index.html` emits `hreflang="fr"` (1×) — inherited from Layout.astro.
- **Per-page meta description:** `<meta name="description"` present in `dist/privacy/index.html` (not the default site description — page-specific override via Layout Props).
- **TODO markers rendered:** 3 occurrences in `dist/code-of-conduct/index.html` (reporting email + attribution etc.).
- **CoC content load-bearing keywords:** verified via inspection — both CoC pages contain full Contributor Covenant section headings (Our Pledge / Notre engagement, Our Standards / Nos critères, Enforcement Guidelines / Directives d'application, 4 tiers Correction→Permanent Ban).

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1    | `d536fd6` | feat(09-05): add LegalPageLayout + legal.* i18n keys |
| 2    | `753502a` | feat(09-05): add Code of Conduct pages (FR + EN) |
| 3    | `78c3285` | feat(09-05): add Privacy Policy + Terms of Service pages (FR + EN) |

## Self-Check: PASSED

- Files created exist: `src/layouts/LegalPageLayout.astro`, 6 legal `.astro` pages — confirmed via Glob.
- ui.ts modification present: 8 `legal.*` entries (4 FR + 4 EN) — confirmed via file content.
- Commits exist on main: `d536fd6`, `753502a`, `78c3285` — confirmed via `git log`.
- Build output present: 6 legal routes in `dist/` — confirmed via Glob.
- No `{/* ... */}` placeholders committed in CoC page bodies (comment markers retained only as section-attribution annotations, not content gaps).

## Known Stubs

None. All legal prose is final content. TODO markers are editorial placeholders (emails, postal address, publisher name) awaiting organizer input — documented above; do not block launch of the rest of Phase 9 but must be filled before go-live.
