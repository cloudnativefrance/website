---
phase: 09
slug: seo-legal-polish
status: draft
shadcn_initialized: true
preset: project-native (CSS-native @theme in src/styles/global.css, no preset string)
created: 2026-04-12
covers_components:
  - src/components/Footer.astro (PRIMARY — Stitch-gated)
  - src/layouts/LegalPageLayout.astro (SECONDARY — prose wrapper, Stitch-exempt)
covers_pages:
  - /code-of-conduct + /en/code-of-conduct (via LegalPageLayout)
  - /privacy + /en/privacy (via LegalPageLayout)
  - /terms + /en/terms (via LegalPageLayout)
---

# Phase 9 — UI Design Contract: Footer + Legal Pages

> Visual and interaction contract for (1) the site-wide Footer component rendered from `Layout.astro` and (2) the shared `LegalPageLayout.astro` wrapper for the three legal pages. Produced by `gsd-ui-researcher` from CONTEXT.md (11 locked decisions — all D-0x), DESIGN.md (KCD co-branding rules §379-394), Phase 5 UI-SPEC (typography and color conventions), and existing patterns in `Navigation.astro` + `SocialLinks.astro`.
>
> **Stitch-first:** The Footer REQUIRES a Stitch mockup + user validation before `/gsd-plan-phase 9` runs. Legal pages are Stitch-exempt per CONTEXT.md D-04 — prose pages on existing tokens introduce no new visual surface.

---

## Design System

| Property | Value | Source |
|----------|-------|--------|
| Tool | shadcn (project-native) | `src/styles/global.css` + `components.json` |
| Preset | none — tokens live in `@theme inline` block of `global.css` | Phase 1 decision |
| Component library | shadcn/ui (Button + Separator available; Footer does not require them — pure Astro/Tailwind is sufficient) | Phase 10 decision |
| Icon library | Inline SVG (lucide geometry, copied locally per `SocialLinks.astro` pattern — Footer stays zero-JS, no React island) | Existing pattern |
| Font | DM Sans via `--font-dm-sans` | Phase 1 |
| Theme | Dark-only, OKLCH tokens | DESIGN.md |
| Rendering | Pure Astro, zero client JS | Footer is static markup |

---

## Spacing Scale

Declared values (all multiples of 4, lifted from DESIGN.md — no new tokens).

| Token | Tailwind | Value | Usage in this phase |
|-------|----------|-------|---------------------|
| `spacing-2` | `gap-2` / `p-2` | 8px | Social-icon row gap; icon hit-target padding (≥44px composed) |
| `spacing-3` | `gap-3` / `mt-3` | 12px | Gap between social row and legal list inside Community column |
| `spacing-4` | `gap-4` / `py-4` | 16px | Inter-item gap in Quick nav list; bottom-row vertical padding |
| `spacing-6` | `gap-6` / `py-6` | 24px | Column-to-column gap on tablet; mobile stacked-section gap |
| `spacing-8` | `gap-8` / `mt-8` | 32px | Column gap between the 3 columns on desktop; gap between 3-col grid and bottom row |
| `spacing-12` | `py-12` | 48px | Footer vertical padding (top and bottom of the 3-col grid block) |
| `spacing-16` | `py-16` | 64px | Reserved — NOT used in footer (too large for compact density per D-04) |

### Exceptions

- Social-icon anchors keep `p-2` (8px) padding around a 20×20 icon → 36px inner + surrounding 8px gap ≥ 44px tap zone (matches `SocialLinks.astro` contract and DESIGN.md §Accessibility).
- `max-w-7xl` content container (same as `Navigation.astro:44`) — keeps footer horizontally aligned with header.

### Footer block sizing

| Region | Mobile | Tablet | Desktop |
|--------|--------|--------|---------|
| Outer vertical padding | `py-12` (48px) | `py-12` | `py-12` |
| Horizontal padding | `px-4` | `px-6` | `px-6` |
| Column gap (3-col grid) | n/a (stacks) | `gap-8` | `gap-12` (48px — compact but breathable) |
| Stacked-section gap on mobile | `gap-10` (40px) | — | — |
| Bottom-row top border spacer | `pt-6 mt-8` | `pt-6 mt-8` | `pt-6 mt-8` |

---

## Typography

Subset of the DESIGN.md scale. **Exactly 4 sizes, 2 weights** declared for new text in the footer; legal pages inherit these plus one `display` size for page h1.

| Role | Token | Size | Weight | Line Height | Used For |
|------|-------|------|--------|-------------|----------|
| Column heading | `text-sm` | 14px | **600** (SemiBold) | 1.4 | Footer column labels: "Navigation", "Suivez-nous / Follow us", "Légal / Legal" — `uppercase tracking-wider` |
| Body link | `text-sm` | 14px | **400** (Regular) | 1.5 | Every nav link, legal link, tagline text |
| Fine print | `text-xs` | 12px | **400** (Regular) | 1.5 | Bottom row (`© 2027 ...`, "KubeCon Community Event" affiliation) |
| Association line | `text-sm` | 14px | **400** (Regular) | 1.5 | "Organisé par Cloud Native France (loi 1901)" under the wordmark |

Footer uses **400 (Regular)** + **600 (SemiBold)**. No 700 weight anywhere in the footer.

### Legal pages (LegalPageLayout.astro) — prose scale

Max 4 sizes, 2 weights — matches Phase 5 typography contract.

| Role | Token | Size | Weight | Line Height | Used For |
|------|-------|------|--------|-------------|----------|
| Page title (h1) | `text-4xl` | 36px | **700** | 1.2 | Each legal page title |
| Section heading (h2) | `text-2xl` | 24px | **600** | 1.3 | CoC sections (Our Pledge, Our Standards...), Privacy section headings |
| Sub-heading (h3) | `text-lg` | 18px | **600** | 1.4 | Rare sub-grouping inside CoC (Enforcement Responsibilities, etc.) |
| Body | `text-base` | 16px | **400** | 1.7 (prose — more generous than footer) | Paragraphs, lists |
| Meta (last-updated) | `text-sm` | 14px | **400** | 1.5 | "Last updated 2026-XX-XX" line under the h1 |

Weights: **400 + 600** for body/cards; **700 isolated to legal page h1** (same convention as Phase 5 — a single display weight is allowed without breaking the 2-weight rule for ongoing reading text).

### Prose measure

- `max-w-prose` (Tailwind default ≈65ch) centers the text column on `LegalPageLayout`. No additional container; the `<main>` wraps with `mx-auto px-4 py-16`.
- Paragraph spacing: `mt-4` between paragraphs; `mt-8` before `<h2>`; `mt-6` before `<h3>`.
- Lists: `list-disc ml-6 space-y-2` — flush-left bullet hierarchy typical of legal content.

---

## Color

Strictly sourced from `global.css` OKLCH tokens. No new palette entries.

| Role | Token | Usage in this phase |
|------|-------|---------------------|
| Dominant (60%) | `--color-background` (deep purple `oklch(16.8% 0.052 286.4)`) | Page background — **footer uses this same token** (no separate footer surface; relies on the `pt-6 mt-8 border-t` divider to demarcate the bottom row from the 3-col block above) |
| Secondary (30%) | `--color-card` (`oklch(22.5% 0.083 285.5)`) | **Not used in the footer** (would create a visible "card" band inconsistent with the compact, quiet density D-04 requests). Retained for legal pages' optional future callouts — unused in v1. |
| Borders | `--color-border` (`oklch(30.8% 0.102 285.5)`) | Single `border-t` between the 3-col grid and the bottom row. No other borders in the footer. |
| Accent (10%) | `--color-accent` (pink `oklch(76.6% 0.142 10.1)`) | **NOT USED anywhere in the footer.** Explicitly reserved for CTAs on other pages per Phase 5 convention. |
| Primary interactive | `--color-primary` (blue `oklch(62.5% 0.162 259.9)`) | Link hover + focus color on **every** interactive element in the footer (nav links, legal links, social icons) |
| Foreground | `--color-foreground` | Brand wordmark alt-text presentation fallback; column headings text color |
| Muted foreground | `--color-muted-foreground` (`oklch(66.8% 0.047 290.8)`) | Default text color for all body links, association line, tagline, and bottom-row fine print |
| Destructive | `--color-destructive` | **NOT USED** — no destructive actions exist in the footer or legal pages |

### 60 / 30 / 10 rationale for the footer

- **60% dominant:** the footer surface itself is `bg-background` — visually the footer is a *quiet continuation* of the page, not a differentiated card. Chosen per D-04: "compact, not a wall of links." The `border-t` on the bottom row is the only surface-break.
- **30% secondary:** intentionally absent inside the footer. It's still the dominant surface on cards throughout the rest of the site (speakers, sponsors, team), so the global ratio holds. The footer's neutrality is what lets it stay unobtrusive.
- **10% accent:** reserved for CTAs elsewhere. Footer is informational, not conversional — no accent belongs here.

### Footer background — rationale for chosen option

Two options were considered:

| Option | Surface | Pro | Con | Decision |
|--------|---------|-----|-----|----------|
| **A: `bg-background`** (same as page) | Dominant | Quiet, compact, matches "not a wall of links" D-04 intent; no extra visual weight at the bottom of every page | Less visually demarcated from main content | **CHOSEN** |
| B: `bg-card` | Secondary | Visually separates footer as a distinct band | Introduces a second "card" band below the page; competes with actual card surfaces on sponsor/team pages; adds weight | Rejected |

**Choice: A — `bg-background`.** The `border-t` above the bottom row provides sufficient demarcation. The Stitch mockup must render Option A; Option B is documented here only for traceability.

### Accent reserved for (explicit list — footer scope)

**Nothing.** The footer contains zero accent-pink pixels. This is the explicit contract: any pink in the footer mockup is a regression.

### Link color contract

| State | Color |
|-------|-------|
| Default | `text-muted-foreground` |
| Hover | `text-primary` (instant via `transition-colors duration-150`) |
| Focus-visible | `text-primary` + `outline-none ring-2 ring-ring ring-offset-2 ring-offset-background rounded-sm` |
| Active-route (Quick nav column) | `text-primary` — matches `Navigation.astro` active-state color without the bottom-border underline (which belongs to the header's active-nav affordance, not the footer) |

---

## Copywriting Contract

All strings live in `src/i18n/ui.ts`. No hardcoded French or English in components.

### Footer — new i18n keys

| Element | Proposed key | FR | EN |
|---------|-------------|----|----|
| Brand tagline (1 line under wordmark) | `footer.tagline` | Cloud Native, DevOps et IA — entre praticiens. | Cloud Native, DevOps and AI — from practitioners. |
| Association line | `footer.association` | Organisé par Cloud Native France (loi 1901) | Organized by Cloud Native France (loi 1901 non-profit) |
| Quick nav column heading | `footer.nav.heading` | Navigation | Navigation |
| Community column heading | `footer.community.heading` | Suivez-nous | Follow us |
| Legal column heading | `footer.legal.heading` | Légal | Legal |
| Legal link — CoC | `footer.legal.coc` | Code de conduite | Code of Conduct |
| Legal link — Privacy | `footer.legal.privacy` | Confidentialité | Privacy |
| Legal link — Terms | `footer.legal.terms` | Mentions légales | Terms |
| Copyright line | `footer.copyright` | © 2027 Cloud Native France · Association loi 1901 | © 2027 Cloud Native France · loi 1901 non-profit |
| KCD affiliation note | `footer.kcd_affiliation` | Événement officiel KubeCon Community Days | Official KubeCon Community Days event |
| Social aria — LinkedIn | `footer.social.linkedin_aria` | LinkedIn Cloud Native France (nouvelle fenêtre) | Cloud Native France on LinkedIn (new window) |
| Social aria — YouTube | `footer.social.youtube_aria` | YouTube Cloud Native France (nouvelle fenêtre) | Cloud Native France on YouTube (new window) |
| Social aria — Bluesky | `footer.social.bluesky_aria` | Bluesky Cloud Native France (nouvelle fenêtre) | Cloud Native France on Bluesky (new window) |
| Social aria — X/Twitter | `footer.social.twitter_aria` | X Cloud Native France (nouvelle fenêtre) | Cloud Native France on X (new window) |
| Footer landmark label | `footer.landmark_aria` | Pied de page | Site footer |

### Quick nav column — REUSES existing `nav.*` keys

No new keys introduced for the Quick nav column. Reuses exactly: `nav.home`, `nav.speakers`, `nav.schedule`, `nav.sponsors`, `nav.team`, `nav.venue`. Order mirrors `Navigation.astro:11-18`: Home → Speakers → Schedule → Sponsors → Venue → Team. (Same order as header for muscle memory.)

### Social URLs (placeholders — user fills before production)

| Platform | Placeholder value | Post-launch source |
|----------|-------------------|--------------------|
| LinkedIn | `https://www.linkedin.com/company/cloud-native-france/` | User to confirm |
| YouTube | `https://www.youtube.com/@cloudnativedays` | User to confirm |
| Bluesky | `https://bsky.app/profile/cloudnativedays.fr` | User to confirm |
| X / Twitter | `https://x.com/cloudnativedays` | User to confirm |

Each URL passes through the `safeUrl()` allowlist pattern from `SocialLinks.astro` (http/https only). Unknown schemes → link hidden. This re-uses the Phase 5 D-04 security posture.

### Legal pages — new i18n keys

| Element | Proposed key | FR | EN |
|---------|-------------|----|----|
| CoC page title | `legal.coc.title` | Code de conduite | Code of Conduct |
| CoC last-updated label | `legal.last_updated` | Dernière mise à jour : {date} | Last updated: {date} |
| Privacy page title | `legal.privacy.title` | Politique de confidentialité | Privacy Policy |
| Terms page title | `legal.terms.title` | Mentions légales | Terms of Service |

Actual legal **body content** is prose, not i18n strings — each page is an `.astro` file that writes the prose inline (one per locale). This follows the Phase 2 precedent for long-form bilingual content (speakers/talks bios are in content collections; legal prose is page-local because it does not cross-reference anything).

### Copywriting contract table (template-mandated)

| Element | Copy |
|---------|------|
| Primary CTA | **None** — footer is informational. (Primary CTA for Phase 9 overall is the Contributor Covenant "Reporting" email link on the CoC page — `mailto:` flagged for user to fill.) |
| Empty state heading | **Not applicable** — the footer has no empty state; every region renders unconditionally. Legal pages are prose with fixed content; empty-state does not apply. |
| Empty state body | Not applicable |
| Error state | **Not applicable** — no runtime data fetches, no user actions that can fail. Broken social URL → `safeUrl()` returns null → icon hidden (silent degradation, no error surface). |
| Destructive confirmation | **Not applicable** — no destructive actions in this phase. |

---

## Component Inventory

New components introduced by this phase:

| Component | Path | Props | Reuses |
|-----------|------|-------|--------|
| `Footer.astro` | `src/components/Footer.astro` | none (reads `lang` from `Astro.url` internally, matches `Navigation.astro` pattern) | `safeUrl()` helper pattern from `SocialLinks.astro`; inline lucide-geometry SVGs |
| `FooterSocialLinks.astro` *(optional — planner's discretion)* | `src/components/FooterSocialLinks.astro` | `{ lang: Locale }` | `safeUrl()` | Created only if inlining all 4 social icons directly inside `Footer.astro` exceeds ~60 lines of markup. Otherwise inline. |
| `LegalPageLayout.astro` | `src/layouts/LegalPageLayout.astro` | `{ title: string, lastUpdated: string, lang?: string }` | wraps `Layout.astro`; adds `<main class="mx-auto max-w-prose px-4 py-16">` + h1 + last-updated + `<slot />` |

Legal pages (3 × 2 locales = 6 files):

| Page | Path |
|------|------|
| CoC FR | `src/pages/code-of-conduct.astro` |
| CoC EN | `src/pages/en/code-of-conduct.astro` |
| Privacy FR | `src/pages/privacy.astro` |
| Privacy EN | `src/pages/en/privacy.astro` |
| Terms FR | `src/pages/terms.astro` |
| Terms EN | `src/pages/en/terms.astro` |

Layout integration:

- `src/layouts/Layout.astro` — import `Footer.astro` and render `<Footer />` after the `<slot />`, inside `<body>`, before `</body>`. Footer appears on every route automatically.

---

## Footer — Layout & Grid

### Responsive breakpoints

| Breakpoint | Layout |
|------------|--------|
| Mobile (<768px) | Single column — all sections stacked in order: Brand → Quick nav → Community/Legal → Bottom row |
| Tablet (768–1024px) | 3-column grid with `gap-8`; bottom row full-width below |
| Desktop (≥1024px) | 3-column grid with `gap-12`; bottom row full-width below |

Tailwind: `grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 lg:gap-12`.

### Column 1 — Brand

Top-to-bottom:

1. **Wordmark** — `<img src={logoFull.src}>` (same dark-variant logo as `Navigation.astro`). Size: `h-8` (32px) — matches header. Rationale: D-04 says "~120px" for the wordmark width; at its natural aspect ratio, `h-8` resolves to roughly 110-130px wide (the `logo.svg` wordmark is approximately 4:1), which lands in the target band. Specifying **height** instead of width yields a crisper match with the header logo height and avoids CLS from aspect-ratio calculations.
2. **Tagline** — `<p class="text-sm text-muted-foreground mt-4">{t('footer.tagline')}</p>` — 1 line, may wrap on narrow screens, does not truncate.
3. **Association line** — `<p class="text-sm text-muted-foreground mt-3">{t('footer.association')}</p>`.

### Column 2 — Quick nav

Top-to-bottom:

1. **Column heading** — `<h2 class="text-sm font-semibold uppercase tracking-wider text-foreground">{t('footer.nav.heading')}</h2>`.
2. **Nav list** — `<ul class="mt-4 space-y-3">` — one `<li>` per nav item. Each `<a>` uses `text-sm text-muted-foreground hover:text-primary transition-colors duration-150 focus-visible:...`. Active route highlighted `text-primary` (matching `Navigation.astro` active-state color logic via the same `isActive()` helper).

Order matches `Navigation.astro`: Home, Speakers, Schedule, Sponsors, Venue, Team.

### Column 3 — Community + Legal (stacked sub-blocks)

Top-to-bottom:

1. **"Follow us" sub-block**:
   - `<h2 class="text-sm font-semibold uppercase tracking-wider text-foreground">{t('footer.community.heading')}</h2>`
   - `<ul class="mt-4 flex items-center gap-2" role="list">` containing 4 social anchors (LinkedIn, YouTube, Bluesky, X/Twitter). Each `<a>` uses `p-2 text-muted-foreground hover:text-primary transition-colors duration-150 focus-visible:...` wrapping a 20×20 inline SVG. `aria-label` from i18n. `target="_blank" rel="noopener noreferrer"` on every link.
2. **"Legal" sub-block** (below the social row, `mt-8`):
   - `<h2 class="text-sm font-semibold uppercase tracking-wider text-foreground">{t('footer.legal.heading')}</h2>`
   - `<ul class="mt-4 space-y-3">` — 3 `<li>` items: Code of Conduct, Privacy, Terms. Same link styling as Quick nav.

### Bottom row (full width, below the 3-col grid)

- `<div class="mt-8 pt-6 border-t border-border flex flex-col md:flex-row md:items-center md:justify-between gap-3">`
- **Left:** `<p class="text-xs text-muted-foreground">{t('footer.copyright')}</p>`
- **Right:** `<p class="text-xs text-muted-foreground">{t('footer.kcd_affiliation')}</p>` — per DESIGN.md §379-394 (KCD co-branding rules):
  - Text-only treatment (no KCD logo in v1 — asset not yet in repo per DESIGN.md §400).
  - Muted foreground color + `text-xs` = visually subordinate to copyright on the left. KCD "never dominates" is satisfied by treating the affiliation as fine print, not a logo-lockup.
  - When the KCD logo asset lands in `src/assets/logos/kcd/`, a follow-up phase can upgrade this to a text+logo lockup per DESIGN.md lockup rules (`[CND France] | [KCD]`). For Phase 9 v1.0, text is sufficient and carries no co-branding liability.

### Footer root element

```astro
<footer role="contentinfo" aria-label={t('footer.landmark_aria')}
  class="bg-background text-muted-foreground mt-24">
  <div class="mx-auto max-w-7xl px-4 md:px-6 py-12">
    <!-- 3-col grid here -->
    <!-- bottom row here -->
  </div>
</footer>
```

- `mt-24` (96px) above the footer separates it generously from page content — covers the "compact footer should not crowd the last section" case on short pages. This is the only footer-specific spacing above `spacing-16`; justified because it's vertical gap, not footer density.

### ASCII wireframe — desktop (≥1024px)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                              [ page content ends ]                             │
│                                                                                │
│                              (mt-24 vertical gap)                              │
│                                                                                │
│  ┌─ FOOTER ───────────────────────────────────────────────────────────────┐    │
│  │                                                                        │    │
│  │  [CND France wordmark]      NAVIGATION           SUIVEZ-NOUS          │    │
│  │                                                                        │    │
│  │  Cloud Native, DevOps et    · Accueil            [in] [▶] [🦋] [𝕏]   │    │
│  │  IA — entre praticiens.     · Conférenciers                            │    │
│  │                             · Programme                                │    │
│  │  Organisé par Cloud         · Partenaires        LÉGAL                 │    │
│  │  Native France (loi 1901)   · Lieu                                     │    │
│  │                             · Équipe             · Code de conduite    │    │
│  │                                                  · Confidentialité    │    │
│  │                                                  · Mentions légales   │    │
│  │                                                                        │    │
│  │  ────────────────────────────────────────────────────────────────      │    │
│  │  © 2027 Cloud Native France · Association loi 1901                     │    │
│  │                                   Événement officiel KubeCon Com...    │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────────────────┘
```

### ASCII wireframe — mobile (<768px)

```
┌──────────────────────────────────┐
│  [ page content ends ]           │
│                                  │
│  (mt-24)                         │
│  ┌─ FOOTER ────────────────────┐ │
│  │                             │ │
│  │  [CND France wordmark]      │ │
│  │                             │ │
│  │  Cloud Native, DevOps et    │ │
│  │  IA — entre praticiens.     │ │
│  │                             │ │
│  │  Organisé par Cloud Native  │ │
│  │  France (loi 1901)          │ │
│  │                             │ │
│  │  ─────── (gap-10) ───────   │ │
│  │                             │ │
│  │  NAVIGATION                 │ │
│  │  · Accueil                  │ │
│  │  · Conférenciers            │ │
│  │  · Programme                │ │
│  │  · Partenaires              │ │
│  │  · Lieu                     │ │
│  │  · Équipe                   │ │
│  │                             │ │
│  │  ─────── (gap-10) ───────   │ │
│  │                             │ │
│  │  SUIVEZ-NOUS                │ │
│  │  [in] [▶] [🦋] [𝕏]          │ │
│  │                             │ │
│  │  LÉGAL                      │ │
│  │  · Code de conduite         │ │
│  │  · Confidentialité          │ │
│  │  · Mentions légales         │ │
│  │                             │ │
│  │  ─── border-t ───           │ │
│  │  © 2027 Cloud Native...     │ │
│  │  Événement officiel Kub...  │ │
│  └─────────────────────────────┘ │
└──────────────────────────────────┘
```

### Footer states

| State | Treatment |
|-------|-----------|
| Default | Static; no animation, no hover on container |
| Link hover | `text-muted-foreground → text-primary` via `transition-colors duration-150` |
| Link focus-visible | Same color change + `ring-2 ring-ring ring-offset-2 ring-offset-background rounded-sm` |
| Active route (Quick nav) | Link color is `text-primary` (no underline — underline is reserved for the header's active-nav affordance) |
| Print | Inherits browser default; no special print styles |
| Reduced motion | `transition-colors duration-150` is safe (color transitions are not motion) — no `motion-safe:` wrapping needed |

---

## Legal Pages — Layout & Content Shape

### `LegalPageLayout.astro` anatomy

```astro
---
import Layout from "./Layout.astro";
interface Props { title: string; lastUpdated: string; lang?: string; }
const { title, lastUpdated, lang } = Astro.props;
---
<Layout title={title} lang={lang} description={/* SEO desc from each page */}>
  <main class="mx-auto max-w-prose px-4 py-16">
    <h1 class="text-4xl font-bold leading-tight">{title}</h1>
    <p class="text-sm text-muted-foreground mt-2">
      {/* "Last updated: YYYY-MM-DD" via i18n `legal.last_updated` with {date} */}
    </p>
    <div class="prose-invert mt-8">
      <slot />
    </div>
  </main>
</Layout>
```

Utility classes applied to `<slot />` children by the page itself (Astro doesn't style children implicitly without `@tailwindcss/typography`; we use explicit classes on `<h2>`/`<h3>`/`<p>`/`<ul>` to keep dependencies minimal — NO new packages added by Phase 9). Specifically:

- `<h2>`: `text-2xl font-semibold mt-8`
- `<h3>`: `text-lg font-semibold mt-6`
- `<p>`: `text-base leading-relaxed mt-4` (implicit color = `text-foreground` inherited)
- `<ul>`: `list-disc ml-6 mt-4 space-y-2`
- `<a>`: `text-primary hover:underline focus-visible:...`
- Anchor-link headings on CoC (`id` + optional `#` affordance) — planner's discretion per CONTEXT D-11.

### ASCII wireframe — legal page (all three share this shape)

```
┌──────────────────────────────────────┐
│  [ Navigation header — unchanged ]  │
└──────────────────────────────────────┘

         ┌─ max-w-prose (~65ch) ─┐
         │                       │
         │  Code de conduite     │   ← h1 text-4xl weight 700
         │  Last updated: ...    │   ← text-sm muted
         │                       │
         │  Our Pledge           │   ← h2 text-2xl weight 600
         │                       │
         │  We as members ...    │   ← body text-base leading-relaxed
         │  (paragraphs)         │
         │                       │
         │  Our Standards        │   ← h2
         │  • Examples of ...    │   ← bullet list
         │  • Positive ...       │
         │                       │
         │  Enforcement          │   ← h2
         │  Responsibilities     │
         │  ...                  │
         │                       │
         └───────────────────────┘

[ Footer — always rendered below ]
```

### Legal-page states

| State | Treatment |
|-------|-----------|
| Default | Static prose; no interactive elements except in-prose `<a>` tags (e.g., Privacy policy links to youtube-nocookie.com, Google Fonts privacy page) |
| In-prose link hover | `text-primary → underline` (follows prose-invert convention) |
| Missing locale | Layout's `TranslationNotice` component handles the fallback banner — pages are authored in both FR + EN so this should not trigger |

---

## Stitch Mockup Requirements (Stitch-first rule, CLAUDE.md)

Footer requires Stitch validation before `/gsd-plan-phase 9`. Legal pages are Stitch-exempt per CONTEXT.md (no new visual surface; reuse existing type scale). Use the CND France 2027 Stitch project (see MEMORY `reference_stitch.md`) and design-system tokens **without overriding** (per `feedback_stitch_ds_tokens.md`).

### Footer mockup — desktop (1280px artboard)

Must show:

1. Footer rendered at the bottom of a tall page (use `/sponsors` or `/team` context so the reviewer sees the `mt-24` gap above and the footer against `--color-background`).
2. **3-column grid** with `gap-12` between columns.
3. **Column 1:** CND France wordmark at `h-8` natural size, tagline + association text in muted foreground.
4. **Column 2:** "NAVIGATION" heading (uppercase, tracking-wider, 14px, SemiBold); 6-item vertical list with one item in active-route color (text-primary) to demonstrate the active state.
5. **Column 3:** "SUIVEZ-NOUS" heading + horizontal row of 4 social icons (LinkedIn, YouTube, Bluesky, X/Twitter) at 20px geometry with 8px padding around each. Below (separated by `mt-8`): "LÉGAL" heading + 3-item vertical list.
6. **Bottom row:** `border-t`, then `© 2027 Cloud Native France · Association loi 1901` on the left and `Événement officiel KubeCon Community Days` on the right, both at 12px muted-foreground.
7. **Hover state** shown on one social icon — color transitions to `text-primary`.
8. Background throughout: `--color-background` (Option A, per Color section rationale).
9. **Explicitly no pink anywhere** — any accent-pink in the mockup is a regression.

### Footer mockup — mobile (375px artboard)

Must show:

1. Single-column stack in order: Brand → Quick nav → Community+Legal → Bottom row.
2. Gap between stacked sections: `gap-10` (40px).
3. Bottom row collapses to two stacked `<p>` tags, both left-aligned (no `justify-between` behavior at this breakpoint).
4. Social icon row wraps onto one line (4 icons × `p-2` + `gap-2` easily fits in 375px - px-4).
5. Header of page NOT shown (scroll position is page-end).

### Stitch deliverables checklist (capture before planner runs)

- [ ] Desktop 1280px mockup (3-col + bottom row) — screenshot saved in phase folder as `09-footer-desktop.png` or linked in Stitch.
- [ ] Mobile 375px mockup (stacked) — screenshot saved as `09-footer-mobile.png` or linked.
- [ ] Hover state screenshot on one social icon.
- [ ] Active-route state screenshot (one nav link in `text-primary`).
- [ ] User sign-off recorded in phase notes before `/gsd-plan-phase 9` is invoked.

Legal pages: **no Stitch mockup required.** A plain-text review of the rendered prose at `max-w-prose` against existing typography tokens is sufficient during execution.

---

## Accessibility Contract

### Footer

- Wraps the entire footer in `<footer role="contentinfo" aria-label={t('footer.landmark_aria')}>` — exactly one `contentinfo` landmark per page (existing `<header>` provides `banner`; this completes the pair).
- Column headings are real `<h2>` elements so screen readers render the footer in the outline. (Page-level `<h1>` remains the page title; footer h2s nest under the page structure.)
- Social-icon anchors carry `aria-label` from i18n (`footer.social.*_aria`); no reliance on SVG titles.
- All footer links use `target="_blank" rel="noopener noreferrer"` ONLY on external URLs (social). Internal nav and legal links open in the same tab (no `target="_blank"`).
- Focus ring visible on every link: `ring-2 ring-ring ring-offset-2 ring-offset-background rounded-sm`.
- Minimum touch target for social icons: 20px icon + `p-2` (8px) padding = 36px inner; composed with `gap-2` on the row yields ≥44px tap zone per DESIGN.md §Accessibility.
- Muted-foreground (`oklch(66.8% 0.047 290.8)`) on background (`oklch(16.8% 0.052 286.4)`) hits WCAG AA for normal text per DESIGN.md §Accessibility (contrast verified in Phase 1).
- Active-route link (Quick nav column) uses `aria-current="page"` in addition to the visual color change — matches `Navigation.astro:58` convention.
- Reduced motion: only `transition-colors` used, no translate/scale — `prefers-reduced-motion` has no effect to suppress.

### Legal pages

- Semantic `<main>` wraps the prose; single `<h1>` per page.
- Heading hierarchy respected: `<h1>` → `<h2>` → `<h3>` (no `<h4>` in the content).
- `max-w-prose` (~65ch) enforces the WCAG recommended reading measure.
- Body text `leading-relaxed` (1.625) ≥ WCAG 2.1 SC 1.4.12 minimum of 1.5.
- In-prose links have underline-on-hover AND color change (not color-only affordance).
- No keyboard traps; no JS; pure static prose.

---

## Interaction & Animation

| Element | Animation | Notes |
|---------|-----------|-------|
| Footer link hover | `transition-colors duration-150` | Color-only, no motion |
| Footer link focus | Instant ring (no transition) | Standard pattern |
| Footer mount | None — static render | |
| Section reveal | None — not a scroll-triggered component | |
| Legal-page prose | None | Static content pages |

No JavaScript is added by Phase 9 for the Footer or legal pages. The only new script-loading in Phase 9 is the JSON-LD `<script type="application/ld+json">` block on the homepage (per CONTEXT.md D-07) — that is a data-island, not a UI interaction.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none (Footer is pure Astro + Tailwind; LegalPageLayout is pure Astro) | not required (no new first-party blocks) |
| Third-party | none | not applicable |

No shadcn blocks added. No third-party blocks. Vetting gate: not triggered.

---

## Cross-Phase Dependencies

| Consumer | Depends on |
|----------|-----------|
| Planner (09) | This UI-SPEC + CONTEXT.md D-01..D-11 |
| Executor (09) | This UI-SPEC + planner's PLAN.md files |
| UI Auditor (post-ship) | This UI-SPEC as ground truth; mocks flagged below as acceptance gates |
| Future phases (any new site-wide chrome) | May extend `footer.*` i18n namespace; may add KCD logo lockup when asset lands in `src/assets/logos/kcd/` per DESIGN.md §400 |

---

## Acceptance Criteria (Footer)

For the executor/auditor:

1. Footer renders on every route (home, speakers, speaker detail, sponsors, team, venue, schedule, legal pages, and any 404).
2. `<footer role="contentinfo">` appears exactly once per page.
3. All text sourced from `src/i18n/ui.ts` — zero hardcoded copy in `Footer.astro`.
4. Nav column uses the same `nav.*` keys and same `isActive()` logic as `Navigation.astro`, with active link colored `text-primary` and carrying `aria-current="page"`.
5. All 4 social URLs pass through a `safeUrl()` (http/https only) check; broken or hostile schemes silently hide the icon.
6. Bottom row contains the KubeCon affiliation text as muted `text-xs` on the right (no KCD logo image in v1; text-only per DESIGN.md §400).
7. Stitch mockup (desktop + mobile) reviewed and approved by user prior to code.
8. Lighthouse/axe scan shows no new a11y violations on any page after footer lands.
9. No `bg-card` surface introduced in the footer; footer background is `bg-background` only.
10. No `--color-accent` (pink) pixels anywhere in the rendered footer.

## Acceptance Criteria (Legal pages)

1. Three routes × two locales = 6 `.astro` pages, each using `LegalPageLayout.astro`.
2. Prose renders at `max-w-prose` (~65ch) centered.
3. Each page has `<h1>` = localized title and a "Last updated: YYYY-MM-DD" line.
4. CoC content matches Contributor Covenant v2.1 verbatim (EN + official FR) with a project-specific "Reporting" section appended (email flagged `TODO` for user to fill).
5. Privacy policy leads with "This site collects no personal data during your visit." + discloses third-party embeds + names data controller (address `TODO` flagged).
6. All three pages accessible from the footer's Legal column on every other page.
7. No Stitch mockup required; visual review of rendered prose is sufficient.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS (all 15 new footer keys + 4 legal keys defined; nav keys reused; empty/error/destructive explicitly marked Not Applicable with justification)
- [ ] Dimension 2 Visuals: PASS (desktop + mobile wireframes; column anatomy; states table; Stitch deliverables checklist)
- [ ] Dimension 3 Color: PASS (60/30/10 preserved globally; footer neutralized on background; accent explicitly reserved-for = nothing in footer; option B rejected with rationale)
- [ ] Dimension 4 Typography: PASS (footer: 4 sizes, 2 weights 400/600; legal pages: 4 sizes + display 700 isolated to h1 per Phase 5 precedent)
- [ ] Dimension 5 Spacing: PASS (all values from existing DESIGN.md scale; no new tokens; `mt-24` above footer justified as vertical gap not footer density)
- [ ] Dimension 6 Registry Safety: PASS (no new shadcn blocks; no third-party blocks; vetting gate not triggered)

**Approval:** pending — awaits gsd-ui-checker, then user sign-off on Footer Stitch mockups (desktop + mobile) before `/gsd-plan-phase 9`.

---

*Phase 09-seo-legal-polish — UI design contract. Footer is the sole Stitch-gated deliverable; LegalPageLayout is a prose wrapper on existing tokens. Together they close META-05, META-06, META-07.*
