---
phase: 09
slug: seo-legal-polish
status: ready-for-ui-spec
captured: 2026-04-12
source: /gsd-discuss-phase 9 (interactive)
---

# Phase 9: SEO, Legal & Polish — Context

**Goal (from ROADMAP):** The site is discoverable by search engines, legally compliant, and complete with all navigational elements.

**Requirements:** META-01, META-02, META-03, META-04, META-05, META-06, META-07.

**ROADMAP dependency note:** The roadmap lists "Depends on: Phase 8" but this is **ordering preference only** — Phase 8 produces no assets Phase 9 consumes. Phase 9 is planned first because it's launch-critical (SEO + legal = go-live blockers), whereas Phase 8 (timeline adaptation, CFP indicator) is deferrable until closer to event day.

**Stitch-first rule (partial):**
- **Footer component** — Stitch-required (new site-wide visual block). UI-SPEC + mockup before code.
- **Legal pages** (CoC, Privacy, Terms) — Stitch-exempt. These are typographic content pages that reuse existing type tokens; no new visual surface. A single shared `LegalPageLayout` Astro component (prose-styled Tailwind wrapper) suffices.

---

<domain>
## Phase Boundary

**In scope:**
- **SEO infrastructure** — extend `src/layouts/Layout.astro` with `description`, `ogImage`, `ogType`, canonical URL, OG + Twitter card meta tags, hreflang FR/EN alternates.
- **Sitemap + robots** — `@astrojs/sitemap` integration; `public/robots.txt`.
- **JSON-LD Event schema** — embedded on homepage only (FR + EN), reflecting event date, venue, organizer, offers (ticketing URL).
- **Legal pages** — 3 new routes × 2 locales = 6 files: Code of Conduct, Privacy Policy, Terms of Service. Shared minimal `LegalPageLayout` for consistent prose typography.
- **Site-wide Footer** component — 3-column compact layout; rendered in `Layout.astro` below `<slot />`; replaces the current footer-less state.
- **i18n keys** — footer copy, legal page titles + headings, SEO meta defaults.
- **OG image asset** — single static 1200×630 PNG at `public/og-default.png` (CND France wordmark over hex-mesh background). Same image for all pages.

**Out of scope (deferred):**
- Per-page dynamic OG images (speaker faces, talk titles) — future polish phase.
- Newsletter signup / contact forms — no backend; would need infra not in scope.
- Analytics (Plausible, Matomo, etc.) — privacy posture is "no tracking at all"; if analytics is ever added, a separate phase updates the privacy policy.
- Cookie consent banner — not needed under current posture (no cookies set by the site itself; third-party `youtube-nocookie.com` embeds are nocookie variant).
- A11y audit beyond what Phase 1 established — separate polish phase if needed.
- Favicon redesign / PWA manifest — out of scope (`favicon.ico` + `favicon.svg` already exist in `public/`).
- Translation of legal pages beyond FR + EN — bilingual only.

</domain>

<decisions>
## Implementation Decisions

### D-01 — Legal page routes (symmetric English slugs)
- `/code-of-conduct` (FR) + `/en/code-of-conduct`
- `/privacy` (FR) + `/en/privacy`
- `/terms` (FR) + `/en/terms`
- Matches the Phase 4/5 symmetric-English-slug precedent; `getLocalePath` prefix-only resolution applies naturally. Nav-label translation (displayed text) is separate from URL slug.
- All three routes are direct `.astro` files at `src/pages/<slug>.astro` + `src/pages/en/<slug>.astro` (not dynamic routes).

### D-02 — Legal content source
- **Code of Conduct:** adopt **Contributor Covenant v2.1** — upstream English text at https://www.contributor-covenant.org/version/2/1/code_of_conduct/ ; official French translation at https://www.contributor-covenant.org/fr/version/2/1/code_of_conduct/ . Embed verbatim (community standard, preserves upstream trust). Add a project-specific "Reporting" section with a contact email for incident reporting (email placeholder flagged for user to fill).
- **Privacy Policy:** CNIL/GDPR-friendly template tailored to this site's data footprint:
  - Data controller: Cloud Native France (loi 1901 association) — address TBD (placeholder in plan).
  - Data collected at runtime: **none** (static site, no analytics, no cookies set by our domain).
  - Third-party embeds that may set cookies under their own terms:
    - Google Fonts (DM Sans) — served via Astro's Font integration; see their privacy policy.
    - `youtube-nocookie.com` embeds on venue page — nocookie variant, minimal tracking.
    - OpenStreetMap iframe on venue page — OSM Foundation privacy policy.
  - Build-time data sources: Google Sheets (via `SPONSORS_CSV_URL`, `TEAM_CSV_URL`, `SCHEDULE_SESSIONS_CSV_URL`, `SCHEDULE_SPEAKERS_CSV_URL`) — no runtime user data flows through these.
  - User rights (access, rectification, deletion, complaint to CNIL) explicitly listed.
  - "Last updated" date at top, changeable per version.
- **Terms of Service:** minimal — site provided as-is, content licensed (reserve all rights), no user accounts, event-specific liability handled in ticket purchase terms (external, linked).
- All three pages bilingual (FR + EN). I (Claude) draft in the plan's action field; user reviews during execution/summary before merge.

### D-03 — OG / Twitter card: single static image
- **Asset:** `public/og-default.png` — 1200×630, CND France wordmark centered on hex-mesh background at Brand Deep Purple (`#0e0a24`). Same image across every page.
- **Meta tags in Layout.astro** (single source of truth):
  - `<meta property="og:type">` → `website` default, `event` override for homepage (via prop).
  - `<meta property="og:title">`, `og:description`, `og:image`, `og:url`, `og:locale` (`fr_FR` or `en_US`), `og:site_name`.
  - `<meta name="twitter:card">` → `summary_large_image`.
  - `<meta name="twitter:title">`, `twitter:description`, `twitter:image`.
- **Per-page props added to `Layout.astro` Props interface:** `description?: string`, `ogImage?: string`, `ogType?: string`.
- Phase 5's SUMMARY flagged that Layout had no `description` prop — Phase 9 closes that gap.
- Asset generation: Claude creates the PNG via a Stitch screen (since this is a brand visual) OR — simpler — wires up the meta path and flags the asset as a TODO for user to drop in. **Decision:** wire the meta path now; generate the actual PNG via Stitch as a follow-up if current brand assets don't already include a 1200×630 variant. The plan should check `public/` for any existing square/banner-shaped wordmark that could be repurposed; if found, reuse it.

### D-04 — Footer: 3-column compact, rendered in Layout.astro
- **Component:** `src/components/Footer.astro` — new site-wide visual block.
- **Rendered from:** `Layout.astro`, below `<slot />`, above `</body>`. Appears on every route automatically.
- **3 columns (desktop):**
  1. **Brand column** — CND France wordmark (small ~120px), 1-line tagline, association line: "Organisé par Cloud Native France (loi 1901)" / "Organized by Cloud Native France (loi 1901 non-profit)".
  2. **Quick nav column** — mirrors the header nav: Accueil, Conférenciers, Programme, Partenaires, Équipe, Lieu. Uses same i18n keys as `Navigation.astro` (`nav.home`, `nav.speakers`, etc.) — no duplication.
  3. **Community + legal column** — two stacked sub-blocks:
     - "Suivez-nous" / "Follow us" row of social icons (LinkedIn, YouTube, Bluesky, X/Twitter). Reuse `SocialLinks.astro` pattern or a simpler inline icon row. URLs are real organizer channels (placeholders for now, flagged for user to fill).
     - "Légal" / "Legal" vertical list: Code of Conduct, Privacy, Terms — links to the D-01 routes.
- **Bottom row** (full-width, below 3 columns, separated by subtle border-t):
  - Left: `© 2027 Cloud Native France` + "Association loi 1901"
  - Right: small "KubeCon Community Event" affiliation note (matches DESIGN.md KCD co-branding rules — subtle, not dominant).
- **Mobile:** collapses to single column with sections stacked in the same order (Brand → Quick nav → Community+Legal → Bottom row).
- **Visual rules:** muted text color for body links (`text-muted-foreground`); Primary Blue hover/focus states; no Accent Pink anywhere (reserved for CTAs on other pages per Phase 5 UI-SPEC rule).
- **Stitch-first applies** — UI-SPEC gate will generate a design contract + Stitch mockup before implementation.

### D-05 — Sitemap via `@astrojs/sitemap`
- Install `@astrojs/sitemap` (official Astro integration).
- Add to `astro.config.mjs` integrations array with i18n config (picks up `i18n.locales` automatically).
- Output: `dist/sitemap-index.xml` + `dist/sitemap-0.xml` (auto-generated at build time).
- Exclude paths: none for v1.0 (all public routes are indexable).
- `robots.txt`: manually authored at `public/robots.txt`:
  ```
  User-agent: *
  Allow: /
  Sitemap: https://cloudnativedays.fr/sitemap-index.xml
  ```
  (Production URL confirmed or flagged as placeholder if not finalized — check PROJECT.md or ROADMAP.md for the actual domain.)

### D-06 — hreflang tags in Layout.astro
- Emit for every page:
  ```html
  <link rel="alternate" hreflang="fr" href="https://{domain}/{fr-path}" />
  <link rel="alternate" hreflang="en" href="https://{domain}/en/{path}" />
  <link rel="alternate" hreflang="x-default" href="https://{domain}/{fr-path}" />
  ```
- `x-default` → FR (because `defaultLocale: "fr"` in astro.config.mjs).
- Compute URLs via `Astro.url` + `getLocalePath` — Layout needs access to both current path and the opposite-locale path.
- Canonical link tag also emitted: `<link rel="canonical" href="{current-full-url}" />`.

### D-07 — JSON-LD Event schema on homepage
- Inline `<script type="application/ld+json">` block in homepage only (both FR + EN variants).
- Schema type: `Event` (from schema.org) with:
  - `name`: "Cloud Native Days France 2027"
  - `startDate`: `2027-06-03T09:00:00+02:00`
  - `endDate`: `2027-06-03T19:00:00+02:00`
  - `eventAttendanceMode`: `OfflineEventAttendanceMode`
  - `eventStatus`: `EventScheduled`
  - `location`: `Place` — CENTQUATRE-PARIS, 5 rue Curial, 75019 Paris, geo coords `48.8899, 2.3702`
  - `organizer`: `Organization` — Cloud Native France, URL `https://cloudnativedays.fr`
  - `offers`: `Offer` — ticket URL `https://tickets.cloudnativedays.fr/` (from Phase 12)
  - `image`: OG image URL
  - `description`: short event pitch (use homepage meta description)
- Keep a single JSON-LD helper (`src/lib/event-schema.ts`) that renders the JSON — homepage imports it.

### D-08 — Layout.astro prop surface expansion
New `Layout.astro` Props interface (v2):
```ts
interface Props {
  title?: string;
  description?: string;      // NEW — META-01
  ogImage?: string;          // NEW — META-01, defaults to /og-default.png
  ogType?: "website" | "event";  // NEW — homepage passes "event", rest default "website"
  lang?: string;
  canonicalPath?: string;    // NEW — override for canonical URL computation if needed
}
```
Every existing page that currently calls Layout without these props continues to work (all optional with defaults). Plan should audit existing callers and pass `description` where missing (speakers, sponsors, team, venue, schedule, hero).

### D-09 — Font subsetting + preload (polish carryover)
- Current state: `<Font cssVariable="--font-dm-sans" preload />` in Layout.astro — already optimized.
- No change in Phase 9; included here to confirm the polish piece is already handled.

### D-10 — Accessibility baseline (polish)
- Phase 9 **does not** do a full a11y audit — that's a separate polish cycle.
- Footer must meet existing a11y bar: semantic `<footer role="contentinfo">` landmark, visible focus rings on links, sufficient contrast (muted-foreground already hits WCAG AA against background).
- Legal pages use semantic `<h1>`, `<h2>`, `<p>` hierarchy; no flashy styling.

### D-11 — Production domain placeholder
- Sitemap URLs, hreflang hrefs, canonical tags, JSON-LD URLs — all need the **production domain**.
- **Source of truth:** check `PROJECT.md` and ROADMAP.md for the canonical production URL. If "cloudnativedays.fr" is confirmed, use it. If not, use that as a placeholder and flag in deferred-items for user to confirm before go-live.
- Avoid hardcoding — put in a config constant (e.g., `SITE_URL` in `astro.config.mjs` via `site:` field) that everything else reads from `Astro.site`.

### Claude's Discretion (implementation details)
- Exact Tailwind spacing tokens for footer padding, column gaps, icon sizes — derive from design tokens during Stitch review.
- Whether legal pages share a single `LegalPageLayout.astro` wrapper or just use Layout directly with inline prose styling — prefer a wrapper if the 3 pages have repeated structural elements (headings, last-updated date, TOC).
- Whether to include a TOC / anchor links on legal pages (nice-to-have for long CoC text; skip for the other two).
- Exact Open Graph image generation approach — reuse an existing banner if present; otherwise generate via Stitch as a follow-up item.
- Whether `@astrojs/sitemap` needs custom config beyond i18n defaults — likely no, but verify at plan time.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before acting.**

### In-repo (authoritative)
- `src/layouts/Layout.astro` — the single entry point being extended with new meta + footer slot.
- `src/components/Navigation.astro` — pattern for site-wide component (imported from Layout); footer should match its conventions.
- `src/i18n/utils.ts` — `getLocalePath`, `useTranslations`, `getLangFromUrl`. Used for hreflang URL computation.
- `src/i18n/ui.ts` — existing keys; footer and legal page titles extend this.
- `src/components/speakers/SocialLinks.astro` — social icon rendering pattern + `safeUrl` allowlist; reuse or mirror for footer social row.
- `astro.config.mjs` — add `@astrojs/sitemap` integration here + `site:` field for production URL.
- `.planning/PROJECT.md` — "Cloud Native France (loi 1901)" association info; stack decisions.
- `.planning/REQUIREMENTS.md:81-87` — META-01..07 checkbox set.
- `DESIGN.md` — Logo Usage section (KCD co-branding rules apply to the footer "KubeCon Community Event" note).
- `public/favicon.ico` / `public/favicon.svg` — existing assets; plan should ensure Layout references these.
- `.planning/phases/05-sponsors-team/05-02-SUMMARY.md` — flags Layout's missing `description` prop; Phase 9 closes this.

### External (content source)
- **Contributor Covenant v2.1 (EN):** `https://www.contributor-covenant.org/version/2/1/code_of_conduct/`
- **Contributor Covenant v2.1 (FR):** `https://www.contributor-covenant.org/fr/version/2/1/code_of_conduct/`
- **CNIL GDPR checklist:** `https://www.cnil.fr/fr/rgpd-par-ou-commencer`
- **Schema.org Event:** `https://schema.org/Event` (field reference for JSON-LD)
- **@astrojs/sitemap docs:** `https://docs.astro.build/en/guides/integrations-guide/sitemap/`
- **Google hreflang guide:** `https://developers.google.com/search/docs/specialty/international/localized-versions` (for pattern correctness)

### Prior phase CONTEXT (for consistency)
- `.planning/phases/04-speakers/04-CONTEXT.md`
- `.planning/phases/05-sponsors-team/05-CONTEXT.md` — D-01 (symmetric English slugs — pattern applied here), D-04 (security posture for external URLs — apply to social links in footer).
- `.planning/phases/10-site-navigation-component-wiring/10-CONTEXT.md` — `nav.*` i18n key conventions, active-route highlighting pattern (reuse for footer quick-nav column).

</canonical_refs>

<specifics>
## Specific Ideas

- **Contributor Covenant is load-bearing:** the user explicitly asked for the community standard, not a custom CoC. Embed v2.1 verbatim with a project-specific "Reporting" section pointing at an organizer email. This signals to attendees and speakers that the conference takes inclusion seriously via an established, legible framework.
- **Privacy posture is "no tracking at all":** the privacy policy should lean into this. First sentence: "Ce site ne collecte aucune donnée personnelle au moment de votre visite." / "This site collects no personal data during your visit." Third-party embeds disclosed with their own privacy links.
- **Footer density matters:** 3 columns compact, not a wall of links. The KubeCon Community Event mention at the bottom is small and tasteful, matching DESIGN.md's lockup rule (KCD never dominates).
- **hreflang on every page — including the new legal pages:** this is the thing that most sites get wrong; Phase 9 gets it right because Layout.astro is the single chokepoint.
- **OG image is a mild concern:** the best outcome is an existing brand asset we can crop to 1200×630. If nothing suitable exists, use the Stitch design system to generate a new one — this can be a follow-up task after the rest of the phase ships.

</specifics>

<deferred>
## Deferred Ideas (not this phase)

- **Per-page dynamic OG images** — require runtime or build-time image generation (Satori/@vercel/og). Nice-to-have for social unfurls on speaker/talk/session links; revisit as a polish phase.
- **Analytics integration** — currently "no tracking at all" posture. If the organizers want basic visit counts later, add Plausible or Matomo via a separate phase that also updates the privacy policy.
- **Cookie consent banner** — not needed under current posture (no first-party cookies; third-party embeds are nocookie variants). Revisit only if analytics lands.
- **Contact form / newsletter signup** — no backend; requires infra not in scope.
- **Full a11y audit + WCAG compliance report** — separate polish phase with dedicated scope.
- **Multi-language beyond FR + EN** — out of scope per PROJECT.md.
- **RSS feed of talks or blog** — no blog exists; not requested.
- **PWA manifest + offline support** — event-oriented static site; offline-first not a goal.

</deferred>

---

## Next Steps

1. **`/gsd-ui-phase 9`** — Generate UI-SPEC.md for the Footer component (other deliverables are infrastructure/content, no design contract needed). User validates Stitch mockup of the footer.
2. **`/gsd-plan-phase 9`** — Planner reads this CONTEXT + Footer UI-SPEC → produces PLAN.md files. Expected structure:
   - Plan 09-01: Layout.astro extension (meta + OG + hreflang + canonical + JSON-LD hook)
   - Plan 09-02: Sitemap integration + robots.txt
   - Plan 09-03: Footer component + wiring into Layout
   - Plan 09-04: Legal pages (CoC + Privacy + Terms) + i18n
   - Plan 09-05: Homepage JSON-LD + deferred-items cleanup
   - (Planner's call on whether to collapse to fewer plans or split differently.)
3. **`/gsd-execute-phase 9`** — Ship it.
4. (Before production deploy) User confirms production domain + organizer email + social URLs for footer placeholders.

---

*Phase: 09-seo-legal-polish*
*Context gathered: 2026-04-12 via /gsd-discuss-phase*
