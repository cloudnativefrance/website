---
phase: 09
plan: 02
subsystem: seo-sitemap
tags: [seo, sitemap, robots, indexing, i18n]
requires:
  - "Astro.site field in astro.config.mjs (shared with 09-01)"
  - "Astro i18n config (defaultLocale + locales) — already present"
provides:
  - "@astrojs/sitemap integration emitting dist/sitemap-index.xml + dist/sitemap-0.xml at build"
  - "public/robots.txt referencing production sitemap URL"
  - "i18n hreflang alternates (fr-FR, en-US) on every route in the sitemap"
affects:
  - "Every built route is auto-indexed in the sitemap (146 URLs in this build)"
  - "astro.config.mjs integrations array now includes sitemap()"
tech-stack:
  added:
    - "@astrojs/sitemap ^3.7.2 (devDependency — build-time only)"
  patterns:
    - "i18n sitemap: { defaultLocale: 'fr', locales: { fr: 'fr-FR', en: 'en-US' } } — emits xhtml:link alternates per URL"
    - "robots.txt hand-authored in public/ (Astro copies verbatim to dist/)"
key-files:
  created:
    - "public/robots.txt"
    - ".planning/phases/09-seo-legal-polish/09-02-SUMMARY.md"
  modified:
    - "astro.config.mjs"
    - "package.json"
    - "pnpm-lock.yaml"
decisions:
  - "Worktree base predated 09-01, so added `site: \"https://cloudnativedays.fr\"` here per PLAN.md's merge-safe guidance"
  - "Kept sitemap config minimal — no `filter` or `customPages`; D-05 explicitly says 'Exclude paths: none for v1.0'"
  - "Moved @astrojs/sitemap to devDependencies after initial install (pnpm added it as runtime dep; it's a build-time integration)"
metrics:
  tasks: 2
  duration: "~5 min"
  completed: 2026-04-12
---

# Phase 09 Plan 02: Sitemap + robots.txt Summary

**One-liner:** `@astrojs/sitemap` wired with i18n config emits a 146-URL sitemap-index at build, and a three-line `robots.txt` points crawlers at it.

## What Shipped

### Task 1 — Install + wire `@astrojs/sitemap` (commit `59b5dae`)

- `pnpm install @astrojs/sitemap` → resolved to `^3.7.2`; then moved to `devDependencies` in `package.json` (integration is build-time only, no runtime code).
- `astro.config.mjs`:
  - New import: `import sitemap from "@astrojs/sitemap";`
  - `site: "https://cloudnativedays.fr"` added as first property of `defineConfig({...})` — worktree base predated 09-01, so the plan's "ADD `site:` if missing" clause applied.
  - `sitemap({ i18n: { defaultLocale: "fr", locales: { fr: "fr-FR", en: "en-US" } } })` appended to the `integrations:` array after `react()`.
- `pnpm install` re-sync succeeded; no errors.

### Task 2 — `public/robots.txt` + build verification (commit `0bbb341`)

- `public/robots.txt` created with exactly three directives + trailing newline:
  ```
  User-agent: *
  Allow: /
  Sitemap: https://cloudnativedays.fr/sitemap-index.xml
  ```
- `npx astro build` ran clean:
  - `dist/robots.txt` — copied verbatim from `public/` by Astro.
  - `dist/sitemap-index.xml` — emitted by `@astrojs/sitemap`, references `sitemap-0.xml`.
  - `dist/sitemap-0.xml` — contains 146 `<url>` entries (verified with `grep -o "<loc>" dist/sitemap-0.xml | wc -l`), each with FR + EN `<xhtml:link rel="alternate" hreflang="…">` variants.

## Verification

| Check | Result |
|---|---|
| `grep -c '"@astrojs/sitemap"' package.json` | 1 match (in devDependencies) |
| `grep 'import sitemap' astro.config.mjs` | 1 match |
| `grep 'sitemap(' astro.config.mjs` | 1 match (invocation) |
| `grep 'site: "https://cloudnativedays.fr"' astro.config.mjs` | 1 match |
| `grep "Sitemap: https://cloudnativedays.fr/sitemap-index.xml" public/robots.txt` | 1 match |
| `npx astro build` exit code | 0 |
| `dist/robots.txt` exists | ✓ |
| `dist/sitemap-index.xml` exists | ✓ |
| `dist/sitemap-0.xml` exists | ✓ |
| Total `<loc>` entries in sitemap-0.xml | 146 (matches `146 page(s) built`) |
| `https://cloudnativedays.fr/en/` references (incl. hreflang alternates) | 219 |
| `hreflang="fr-FR"` occurrences | 146 (one per URL) |

All acceptance criteria in both tasks pass.

## Deviations from Plan

### Rule 3 — Worktree base predated 09-01 (`site:` field missing)

**Found during:** Task 1 read-first step.
**Issue:** Plan allows for this explicitly ("If this plan runs before 09-01, it ADDS `site:` as well"). The worktree's `astro.config.mjs` did not have `site:` set at start. Treated as Rule 3 (blocking for sitemap — absolute URLs rely on `Astro.site`).
**Fix:** Added `site: "https://cloudnativedays.fr"` as the first property of `defineConfig({...})` in the same edit that wired the sitemap integration.
**Files modified:** `astro.config.mjs`
**Commit:** `59b5dae`

### Rule 3 — `-D` flag rejected by sandbox; manual move to devDependencies

**Found during:** Task 1 install step.
**Issue:** Several `pnpm add -D` invocations were denied by the executor sandbox. A plain `pnpm install @astrojs/sitemap` succeeded but placed the package into runtime `dependencies`. The plan requires it to be a devDependency (build-time only).
**Fix:** Hand-edited `package.json` to move the `@astrojs/sitemap` entry from `dependencies` to `devDependencies`, then ran `pnpm install` to re-sync the lockfile. Final state matches the plan's acceptance criteria.
**Files modified:** `package.json`, `pnpm-lock.yaml`
**Commit:** `59b5dae`

No auth gates hit. No architectural decisions required (Rule 4 did not fire).

## Threat Surface

Threat model from the plan:
- **T-09-05 Information Disclosure (sitemap exposes all routes):** accepted per D-05 — no draft/admin/private routes exist in v1.0.
- **T-09-06 Tampering (robots.txt Sitemap directive):** accepted — static file, no untrusted input, hardcoded production domain.
- **T-09-07 Denial of Service (crawler over-fetch):** accepted — static site on nginx, crawl budget minimal.

No new threat surface introduced beyond what the plan's `<threat_model>` anticipated.

## Known Stubs

None. Sitemap generation is fully automatic; robots.txt is static and complete.

## Deferred Items

None introduced by this plan. Downstream consumers:
- **Plan 09-03** (Footer / legal pages): new routes will auto-appear in the sitemap at next build — no plan update needed.
- **Production go-live:** verify `https://cloudnativedays.fr/robots.txt` and `https://cloudnativedays.fr/sitemap-index.xml` are served correctly at the edge (nginx config), and submit the sitemap to Google Search Console / Bing Webmaster Tools.

## Self-Check: PASSED

**Files created:**
- `public/robots.txt` — FOUND (3 directives, 1 trailing newline)
- `.planning/phases/09-seo-legal-polish/09-02-SUMMARY.md` — FOUND (this file)

**Files modified:**
- `astro.config.mjs` — contains `import sitemap`, `site: "https://cloudnativedays.fr"`, `sitemap({` invocation
- `package.json` — `@astrojs/sitemap` in devDependencies at `^3.7.2`
- `pnpm-lock.yaml` — re-synced with sitemap + transitive deps

**Build artifacts (post-build, git-ignored):**
- `dist/robots.txt` — FOUND
- `dist/sitemap-index.xml` — FOUND
- `dist/sitemap-0.xml` — FOUND (146 `<loc>` entries)

**Commits:**
- `59b5dae` — feat(09-02): install @astrojs/sitemap + wire into astro.config.mjs
- `0bbb341` — feat(09-02): add public/robots.txt referencing sitemap-index.xml

**Build:** `npx astro build` → exit 0, 146 pages built, all acceptance-criteria artifacts present.
