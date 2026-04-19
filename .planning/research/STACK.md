# Stack Research — v1.2 Homepage Restructuring

**Domain:** Astro content site — homepage layout restructuring (section reorder, newsletter CTA, sponsors section, component refactoring)
**Researched:** 2026-04-15
**Confidence:** HIGH

> This file replaces the v1.1 stack research. v1.2 is a layout restructuring milestone on an already-validated stack — focus is only on what the new features need.

## TL;DR

**No new dependencies required.** Every v1.2 feature maps directly to existing codebase patterns:

- **Newsletter CTA** — Inline SVG mail icon + existing `buttonVariants` (placeholder anchor, no backend)
- **Sponsors Platinum section** — `getCollection("sponsors")` filter + existing `SponsorCard.astro`
- **One-pager PDF link** — Plain `<a>` tag to Google Drive URL
- **Section reordering** — Template composition in `index.astro`
- **Edition 2026 combined section** — New composite Astro component using existing sub-components

The `package.json` stays unchanged. Run `pnpm install` only if `node_modules` is stale.

## Existing Stack (validated, DO NOT change)

| Technology | Version | Purpose |
|------------|---------|---------|
| Astro | ^6.1.5 | Static site framework with content collections |
| React | ^19.2.5 | Interactive islands (CountdownTimer, KeyNumbers) |
| Tailwind CSS | ^4.2.2 | Utility-first styling with design tokens |
| shadcn/ui + cva | ^4.2.0 / ^0.7.1 | Component primitives (Button, Badge) |
| tw-animate-css | ^1.4.0 | CSS animation utilities |
| lucide-react | ^1.8.0 | Icon library (installed, currently unused in source) |

## Feature-by-Feature Analysis

### 1. Newsletter CTA (Hero Section)

**Need:** Ghost button with mail icon + "Restez informe" label, scrolling to a placeholder anchor.

**Decision: Inline SVG + existing `buttonVariants`**

The codebase uses inline SVG icons in Astro components consistently (verified in `CfpSection.astro` — lines 33-47 for the Send icon, lines 65-79 for the Arrow icon). `lucide-react` is in `package.json` but imported nowhere in `src/`. Since `HeroSection.astro` is a server-rendered `.astro` file (not a React island), importing `lucide-react` would require converting to React — unnecessary for a single icon.

```astro
<!-- Follows CfpSection inline SVG pattern -->
<a href="#newsletter" class={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-accent text-accent hover:bg-accent/10 ...")}>
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
       stroke-linejoin="round" aria-hidden="true">
    <rect width="20" height="16" x="2" y="4" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
  {t("hero.cta.newsletter")}
</a>
```

The "Accent Pink ghost button" from the Stitch mockup maps to Tailwind utility classes on the existing outline variant — not a new component or dependency.

**DO NOT add:** `astro-icon`, `lucide-astro`, `@iconify/react`, or any icon package. Inline SVG is the established pattern.

### 2. Sponsors Platinum Section (Homepage)

**Need:** Display platinum-tier sponsor logos on the homepage with a "see all sponsors" link.

**Decision: Reuse `getCollection("sponsors")` + existing `SponsorCard.astro` or simplified variant**

The exact data loading pattern exists in `src/pages/sponsors.astro`:

```typescript
const all = await getCollection("sponsors");
const platinum = all.filter((s) => s.data.tier === "platinum");
```

Create a new `SponsorsPlatinumStrip.astro` component that:
- Calls `getCollection("sponsors")` and filters `tier === "platinum"`
- Renders logos using existing `SponsorCard.astro` (or a logo-only simplified variant if the full card with description is too heavy for the homepage)
- Adds a CTA link to the `/sponsors` page

The sponsor schema already defines `tier: z.enum(["platinum", "gold", "silver", "community"])` — no schema changes needed. The CSV content collection pipeline handles data loading transparently.

**DO NOT add:** Any sponsor-specific library or data fetching layer.

### 3. One-Pager PDF Link

**Need:** External link to Google Drive PDF within the Edition 2026 section.

**Decision: Plain `<a>` tag + URL stored in `editions-data.ts`**

Add `onePagerUrl` to the `EDITION_2026` constant in `src/lib/editions-data.ts`, alongside the existing `youtubeId`, `galleryUrl`, and other metadata. Render as a standard external link:

```astro
<a href={EDITION_2026.onePagerUrl} target="_blank" rel="noopener noreferrer">
  {t("editions.2026.onepager_cta")} <span aria-hidden="true">→</span>
</a>
```

**DO NOT add:** PDF viewer libraries, iframe embeds, or Google Drive API integration.

### 4. Section Reordering

**Need:** Change homepage component order from current to target layout.

Current: `Hero → KeyNumbers → CfpSection → TestimonialsStrip → PastEditionSection(2026) → PastEditionMinimal(2023)`

Target: `Hero → KeyNumbers → Edition2026Combined → MiniBloc2023 → CfpSection → SponsorsPlatinum`

**Decision: Pure template changes in `index.astro`**

This is Astro component composition — reorder the component calls in the template. Each section is an independent server-rendered component with no shared state. Zero dependency impact.

### 5. Edition 2026 Combined Section

**Need:** Merge the separate PastEditionSection (photos + film) and TestimonialsStrip into one unified section, plus add "see all replays" and "download one-pager" CTAs.

**Decision: New composite `Edition2026Section.astro` component**

Composes existing building blocks:
- Photo grid layout (pattern from `PastEditionSection.astro`)
- YouTube embed (pattern from `PastEditionSection.astro`)
- Testimonials cards (data from `src/lib/testimonials-data.ts`)
- CTA links (plain `<a>` tags with arrow icons)

All sub-components and data sources already exist. This is a layout composition task, not a technology decision.

### 6. Mini-Bloc 2023 Simplification

**Need:** Reduce `PastEditionMinimal` from "logo + 3 photos + playlist link" to "logo + text link only."

**Decision: Modify props passed to `PastEditionMinimal.astro` or create slimmer variant**

Either simplify the existing component to conditionally hide photos when an empty array is passed, or create `PastEdition2023Minimal.astro` with only logo + link. The component is already well-structured with clear prop boundaries.

## i18n Keys to Add

New keys needed in `src/i18n/ui.ts` (both `fr` and `en` objects):

| Key | FR Value | EN Value |
|-----|----------|----------|
| `hero.cta.newsletter` | Restez informe | Stay informed |
| `editions.2026.onepager_cta` | Telecharger le bilan 2026 (PDF) | Download 2026 report (PDF) |
| `editions.2026.replays_cta` | Voir tous les replays | Watch all replays |
| `sponsors.homepage.heading` | Nos partenaires Platinum | Our Platinum sponsors |
| `sponsors.homepage.cta` | Voir tous les partenaires | See all sponsors |

## Data Changes (No Schema Changes)

| File | Change | Type |
|------|--------|------|
| `src/lib/editions-data.ts` | Add `onePagerUrl` field to `EDITION_2026` | Data addition |
| `src/i18n/ui.ts` | Add ~5 new translation keys per locale | Data addition |

## What NOT to Add

| Temptation | Why Not | Instead |
|------------|---------|---------|
| `astro-icon` / `lucide-astro` | One mail icon does not justify a dep. The project has `lucide-react` already unused | Inline SVG (established pattern in CfpSection) |
| Email/newsletter JS SDK | Newsletter backend is explicitly deferred (CLO-6) | Placeholder `#newsletter` anchor |
| State management (nanostores) | No client-side interactivity for any v1.2 feature | Everything is static Astro |
| `@astrojs/image` or image packages | Already using `astro:assets` built-in `<Image>` / `<Picture>` | Built-in Astro image pipeline |
| PDF.js or pdf-embed library | One-pager links to Google Drive externally | Plain `<a>` tag with `target="_blank"` |
| CSS animation library | `tw-animate-css` already installed, and v1.2 has no new animations beyond hover states | Existing Tailwind transitions |
| React island for sponsors section | Sponsor logos are static, server-rendered data | Astro `.astro` component with `getCollection` |

## Integration Points

### Content Collection (sponsors on homepage)
- `getCollection("sponsors")` available in any `.astro` file frontmatter
- Filter `tier === "platinum"` — enum already in Zod schema
- No schema changes, no new CSV columns, no loader modifications

### i18n
- Add keys to both `fr` and `en` objects in `src/i18n/ui.ts`
- Follow existing dot-delimited lowercase key pattern
- Use `useTranslations(lang)` in components (standard pattern)

### Edition Data
- Add `onePagerUrl: "https://drive.google.com/file/d/1rlrY9EkulGSgeCPenyiN4ZnxWs5BXPBo/view"` to `EDITION_2026` in `src/lib/editions-data.ts`
- Check if `replaysUrl` already exists or add it (YouTube playlist URL for "see all replays" CTA)

### Hero Section
- Add third CTA button after existing Register + Schedule buttons in `HeroSection.astro`
- Use `cn(buttonVariants({ variant: "outline", size: "lg" }), "accent-pink-classes")` for styling
- Pink accent: `border-accent text-accent hover:bg-accent/10` using existing design tokens

## Installation

```bash
# No new packages needed. Existing lockfile is sufficient.
# Only run if node_modules is stale:
pnpm install
```

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| No new deps needed | HIGH | All patterns verified in existing codebase source files |
| Sponsor data loading | HIGH | Exact `getCollection` + tier filter pattern in `sponsors.astro` |
| Icon approach | HIGH | Inline SVG pattern verified in `CfpSection.astro` (6 inline SVGs) |
| Newsletter CTA | HIGH | Placeholder anchor — no integration complexity |
| i18n additions | HIGH | Established pattern, additive key changes only |
| Section composition | HIGH | Astro component composition is the core architecture pattern |

## Sources

- Existing codebase verified: `src/pages/sponsors.astro` (sponsor loading pattern), `src/components/cfp/CfpSection.astro` (inline SVG pattern), `src/pages/index.astro` (section composition), `src/components/hero/HeroSection.astro` (CTA button pattern), `src/content.config.ts` (sponsor schema) — all HIGH confidence
- Project spec: `.planning/PROJECT.md` v1.2 milestone definition — HIGH confidence
- Package manifest: `package.json` dependency audit — HIGH confidence

---
*Stack research for: v1.2 Homepage Restructuring (Astro + React islands + Tailwind 4 + shadcn/ui)*
*Researched: 2026-04-15*
