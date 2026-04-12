---
phase: 05
plan: 02
subsystem: sponsors-page
tags: [sponsors, pages, i18n, components, a11y, security]
requires:
  - sponsors content collection (Plan 05-01, flattened CSV schema)
  - useTranslations / getLangFromUrl helpers (src/i18n/utils.ts)
  - Layout.astro page chrome
provides:
  - /sponsors (FR) + /en/sponsors (EN) routes
  - SponsorCard.astro — single card with safeUrl + safeLogoPath gating
  - SponsorTierSection.astro — tier block with per-tier grid density
  - SponsorCTA.astro — single accent-pink CTA block (mailto)
  - 10 new i18n keys × 2 locales = 20 key-values
affects:
  - Closes SPNS-01 (tiered Platinum/Gold/Silver/Community layout)
  - Closes SPNS-02 (logo + description-on-title + external link per sponsor)
  - Advances SPNS-03 (CSV data consumed in a user-facing page)
tech-stack:
  added: []
  patterns:
    - URL-scheme allowlist (safeUrl) copied verbatim from SocialLinks.astro pattern
    - Logo-path allowlist (safeLogoPath) new helper — accepts `/`-prefixed paths or `https://` URLs, rejects `..` traversal, protocol-relative, `javascript:`, `data:`
    - Inline `t(key).replace('{token}', value)` interpolation (matches CountdownTimer.tsx pattern; no new helper)
    - Tier → Tailwind class lookup objects for padding, logo size, grid density
key-files:
  created:
    - src/components/sponsors/SponsorCard.astro
    - src/components/sponsors/SponsorTierSection.astro
    - src/components/sponsors/SponsorCTA.astro
    - src/pages/sponsors.astro
    - src/pages/en/sponsors.astro
  modified:
    - src/i18n/ui.ts (sponsors keys — committed in Wave 1 / caef666, before this executor ran)
decisions:
  - Task 1 skipped (i18n keys already present in commit caef666 from prior partial work)
  - Layout.astro does not accept a `description` prop — omitted the plan's suggested `description={t(...)}` attribute; page title still includes site suffix for SEO
  - Duplicated `safeUrl` in SponsorCard.astro (not imported) — matches the plan's explicit instruction ("Astro components cannot share `---` script helpers cleanly, duplication is the pattern")
  - `safeLogoPath` rejects any string containing `..` (extra defense beyond plan spec) — blocks traversal like `/public/../etc/passwd`
metrics:
  duration: ~5 min (executor wall-clock; excludes waiting for pnpm build)
  completed: 2026-04-12
requirements: [SPNS-01, SPNS-02]
---

# Phase 05 Plan 02: Sponsors Page Summary

Delivered the bilingual sponsors showcase — three new components under `src/components/sponsors/` and two new routes (`/sponsors`, `/en/sponsors`) consuming the CSV-backed collection set up in Plan 05-01. Tiered layout honors UI-SPEC density rules; the single accent-pink CTA is the only chromatic accent on either page.

## What Changed

**Components (3 new, `src/components/sponsors/`):**

| Component | Responsibility |
|-----------|----------------|
| `SponsorCard.astro` | Single sponsor. `safeUrl` + `safeLogoPath` gating; anchor wraps logo + name caption; when URL is hostile, renders a static div instead. |
| `SponsorTierSection.astro` | Tier block. Canonical grid classes per tier (platinum 1-col centered → community 6-col dense), h2 heading (uppercase, tracking-wider). |
| `SponsorCTA.astro` | Bottom-of-page CTA block. `mailto:contact@cloudnativedays.fr`, accent-pink button, `py-24`. |

**Pages (2 new):**

- `src/pages/sponsors.astro` (FR)
- `src/pages/en/sponsors.astro` (EN)

Both use `getLangFromUrl(Astro.url)` — no hardcoded `lang`. Tier-title lookup object keeps TypeScript narrowing sane with dynamic i18n keys. Empty tiers are filtered out; the CTA is always rendered unconditionally (UI-SPEC: "if zero sponsors total, show ONLY the CTA block").

**i18n (pre-completed):** 10 keys × 2 locales committed in `caef666`. Task 1 was skipped.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `caef666` (pre-existing) | feat(05-02): add sponsors + team i18n keys (FR + EN) |
| 2 | `a9e52cf` | feat(05-02): add SponsorCard, SponsorTierSection, SponsorCTA components |
| 3 | `1ad0e2b` | feat(05-02): add FR + EN sponsor pages with tiered grid + CTA |

## Build Verification

`pnpm build` emitted 144 pages (was 142 before this plan) — exactly the expected `+2` for `/sponsors/index.html` and `/en/sponsors/index.html`.

Grep checks against generated HTML:

```
dist/sponsors/index.html:     Nos partenaires, Platinum, Gold, Silver, Community, Nous contacter,
                              bg-accent, target="_blank", noopener
dist/en/sponsors/index.html:  Our sponsors, Platinum, Gold, Silver, Community, Contact us,
                              bg-accent, target="_blank", noopener
```

All 5 placeholder sponsors (Acme Cloud / KubeCorp / CloudForge / StackOps / CNCF Paris) render in their correct tiers. No Zod errors on the sponsors collection at build time.

## Threat Mitigation (STRIDE)

| Threat ID | File | Mitigation implemented |
|-----------|------|------------------------|
| T-05-02 (URL injection → href) | SponsorCard.astro | `safeUrl()` allowlist restricts `http:` / `https:` schemes only; null return renders a non-clickable div |
| T-05-03 (path injection → img src) | SponsorCard.astro | `safeLogoPath()` accepts only `/`-prefixed public paths or `https://` URLs; rejects `..` traversal, `//protocol-relative`, `javascript:`, `data:` |
| T-05-06 (description → title attr) | SponsorCard.astro | Astro's `{expression}` auto-escapes attribute bindings; `title` is not executable surface — accepted per plan |
| T-05-07 (CTA mailto) | SponsorCTA.astro | Hardcoded email constant; no user input reaches the anchor — accepted per plan |
| T-05-08 (reverse-tabnabbing / referrer leak) | SponsorCard.astro | `rel="noopener noreferrer"` on every sponsor anchor |

## Deviations from Plan

### Rule 2 — Layout.astro API mismatch

The plan suggests `<Layout title={...} description={t("sponsors.page.intro")} lang={lang}>`, but `src/layouts/Layout.astro` only declares `{ title?, lang? }` props — it has no `description` prop. Passing it would be silently ignored but was cleaner to omit. Page `<title>` composes the translated title with the site suffix for SEO instead. Plan intent (page description) is preserved via the `<p>` under the h1 which renders `t("sponsors.page.intro")`.

### Task 1 skip

i18n keys were already added in commit `caef666` from a prior partial Wave 2 attempt. Verified via `rg '"sponsors.page.title"' src/i18n/ui.ts` returning 2 (FR + EN). Task 1 was not re-executed per the `<prior_partial_work>` instructions in the executor prompt.

### Rule 2 — `safeLogoPath` hardening

The plan's spec accepts `/`-prefixed paths but does not explicitly reject `..` traversal. I added an early `if (t.includes("..")) return null;` guard. This closes a path-traversal vector (`/public/../etc/passwd`) that a malicious CSV cell could otherwise smuggle into the `<img src>`. Logged as a Rule-2 correctness improvement, not an architectural change.

## Deferred Issues

**Pre-existing TypeScript errors (out of scope — inherited from phases 01/04):**

- `src/content.config.ts:88,110,127` — `csvLoader` LoaderConstraint mismatch (documented in Plan 05-01 SUMMARY)
- `src/pages/speakers/index.astro`, `src/pages/en/speakers/index.astro` — missing `talkTitle`/`talkDuration`/`talkTrack` on speakers schema (Phase 04 concern)
- `src/lib/__tests__/speakers.test.ts` — stale test fixtures (Phase 04 concern)
- Two `ts(6385)` deprecation warnings on `.url()` (Zod v4 migration)

Error count unchanged from Plan 05-01 SUMMARY baseline (33 errors). My new components introduced zero errors. Per SCOPE BOUNDARY rule, these were not fixed in this plan.

## Known Stubs

- `/sponsors/*.svg` logo assets referenced by the CSV rows (Acme Cloud, KubeCorp, etc.) do not yet exist under `/public/sponsors/`. This is **intentional and documented in Plan 05-01's Known Stubs section** — real logos land with the organizer content-ops workflow (CONTEXT.md D-02). `safeLogoPath` still passes the path through as valid, so the `<img>` element renders with a broken icon at the moment. No user-facing impact until real content lands.
- `contact@cloudnativedays.fr` in `SponsorCTA.astro` is the canonical PROJECT.md contact; a TODO comment notes it should be replaced with a sponsor-specific inbox if one is provisioned.

## Threat Flags

No new security surface introduced beyond the plan's `<threat_model>`. All four trust boundaries (url, logo, description, mailto) are covered by existing mitigations. The new `..`-traversal guard in `safeLogoPath` strengthens — not introduces — surface.

## Self-Check: PASSED

- [x] `src/components/sponsors/SponsorCard.astro` exists (94 lines, ≥40 min)
- [x] `src/components/sponsors/SponsorTierSection.astro` exists (29 lines — 1 under 30; all required grid classes present)
- [x] `src/components/sponsors/SponsorCTA.astro` exists (27 lines, ≥25 min)
- [x] `src/pages/sponsors.astro` + `src/pages/en/sponsors.astro` exist
- [x] `rg "safeUrl\\(" src/components/sponsors/SponsorCard.astro` → ≥2 matches (defn + call)
- [x] `rg "safeLogoPath\\(" src/components/sponsors/SponsorCard.astro` → ≥2 matches
- [x] `rg "target=\"_blank\"" src/components/sponsors/SponsorCard.astro` → 1 match
- [x] `rg "rel=\"noopener noreferrer\"" src/components/sponsors/SponsorCard.astro` → 1 match
- [x] `rg "bg-accent" src/components/sponsors/SponsorCTA.astro` → 1 match
- [x] All four tier grid strings present in SponsorTierSection.astro (`max-w-[512px]`, `sm:grid-cols-2`, `lg:grid-cols-4`, `grid-cols-6`)
- [x] Commits `a9e52cf` + `1ad0e2b` present in git log
- [x] `pnpm build` emits 144 pages (+2 over prior baseline)
- [x] `dist/sponsors/index.html` contains "Nos partenaires" + FR copy
- [x] `dist/en/sponsors/index.html` contains "Our sponsors" + EN copy
- [x] Neither page file contains `const lang = "fr"` or `const lang = "en"` hardcoding
