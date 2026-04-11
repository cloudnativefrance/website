# Phase 2: Bilingual Architecture & Content Collections - Research

**Researched:** 2026-04-11
**Domain:** Astro 6 i18n routing, content collections, Zod schemas
**Confidence:** HIGH

## Summary

Astro 6 has mature built-in i18n support that covers all requirements for this phase: locale-prefixed routing, locale detection via `Astro.currentLocale`, URL generation helpers, and fallback behavior. The built-in approach is the clear winner over Paraglide JS 2 -- Paraglide adds bundle-size optimization for translation strings, but this site is statically generated (SSG) so bundle size is irrelevant for UI strings. Astro's native i18n handles routing directly without an extra dependency.

Content collections in Astro 6 use the Content Layer API (`src/content.config.ts`) with `glob()` and `file()` loaders and Zod schemas. The bilingual content strategy uses language subdirectories within each collection (`src/content/speakers/fr/`, `src/content/speakers/en/`), with the locale extracted from the file path at query time.

**Primary recommendation:** Use Astro's built-in i18n routing (`prefixDefaultLocale: false`, `defaultLocale: "fr"`) combined with a simple TypeScript dictionary for UI strings and language-subfolder content collections for data. No external i18n library needed.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
None -- all decisions are at Claude's discretion for this phase.

### Claude's Discretion
- i18n approach: Choose between Astro's built-in i18n, Paraglide JS 2, or manual routing based on research (STATE.md flagged Paraglide JS 2 as MEDIUM confidence with Astro 6 -- evaluate and fall back if needed)
- Content collection schemas: Design Zod schemas for speakers, talks, sponsors, team with appropriate bilingual content structure
- Language toggle: Design and placement (Claude decides style, position, behavior)
- Translation workflow: How missing translations are handled, fallback behavior
- Bilingual content file structure: Separate files per locale or single file with locale fields

### Deferred Ideas (OUT OF SCOPE)
None

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FNDN-02 | Bilingual routing: French as default (no prefix), English under /en/ | Astro 6 built-in i18n with `defaultLocale: "fr"`, `prefixDefaultLocale: false` handles this natively |
| FNDN-03 | Language toggle component visible on all pages | Custom Astro component using anchor tags, placed in Layout.astro header; UI-SPEC defines exact design |
| FNDN-04 | Content collections with Zod schemas for speakers, talks, sponsors, team | Astro 6 Content Layer API with `glob()` loader for speakers/talks (Markdown), `file()` loader for sponsors/team (YAML) |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | 6.1.5 | i18n routing + content collections | Already installed; built-in i18n is sufficient for 2-locale SSG site [VERIFIED: node_modules] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| astro/zod | (bundled) | Schema validation for content collections | Astro re-exports Zod -- import from `astro/zod`, no separate install [VERIFIED: Astro docs] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Built-in i18n | Paraglide JS 2 | Paraglide optimizes translation bundle size via tree-shaking, but this is SSG -- HTML is pre-rendered, no runtime JS for translations. Extra dependency with MEDIUM confidence Astro 6 compat. Not worth the risk. |
| Built-in i18n | i18next | Not compatible with Astro 5+ as of early 2025. Would require adapter. Overkill for 2 locales. |
| Manual routing | Built-in i18n | Manual routing gives more control but reinvents `Astro.currentLocale`, `getRelativeLocaleUrl()`, and fallback middleware. No reason to hand-roll. |

**Installation:**
```bash
# No new packages needed -- Astro 6.1.5 includes everything
```

**Version verification:** Astro 6.1.5 installed locally (confirmed). Latest on npm: 6.1.5. [VERIFIED: npm registry + node_modules]

## Architecture Patterns

### Recommended Project Structure
```
src/
  i18n/
    ui.ts              # UI string dictionaries (nav, labels, common text)
    utils.ts           # getLangFromUrl(), useTranslations(), getLocalePath()
  content/
    speakers/
      fr/
        speaker-1.md
      en/
        speaker-1.md
    talks/
      fr/
        talk-1.md
      en/
        talk-1.md
    sponsors/
      sponsors.yaml     # Single YAML file, locale-independent (logos + URLs)
    team/
      team.yaml          # Single YAML file, locale-independent (photos + links)
  content.config.ts      # Collection definitions + Zod schemas
  pages/
    index.astro          # FR homepage (default locale, no prefix)
    en/
      index.astro        # EN homepage
  layouts/
    Layout.astro         # Updated with lang attribute + language toggle
  components/
    LanguageToggle.astro # FR/EN segmented toggle
    TranslationNotice.astro  # Missing translation fallback banner
```

### Pattern 1: Astro Built-in i18n Configuration

**What:** Configure i18n in astro.config.mjs for FR default, EN prefixed
**When to use:** This is the foundation -- must be done first

```typescript
// Source: https://docs.astro.build/en/guides/internationalization/
// astro.config.mjs
import { defineConfig, fontProviders } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  i18n: {
    defaultLocale: "fr",
    locales: ["fr", "en"],
    routing: {
      prefixDefaultLocale: false,
      // Astro 6 changed default to false (was true in v5)
      redirectToDefaultLocale: false,
    },
    fallback: {
      en: "fr", // Missing EN pages fall back to FR content
    },
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: "DM Sans",
      cssVariable: "--font-dm-sans",
      weights: [400, 500, 600, 700],
      styles: ["normal"],
      fallbacks: ["sans-serif"],
    },
  ],
});
```
[VERIFIED: Astro official docs + Astro 6 upgrade guide]

### Pattern 2: UI Translation Dictionary

**What:** Simple TypeScript object for UI strings (nav, labels, common text)
**When to use:** For all hardcoded UI text that is not content-collection data

```typescript
// src/i18n/ui.ts
export const languages = {
  fr: "FR",
  en: "EN",
} as const;

export type Locale = keyof typeof languages;

export const defaultLang: Locale = "fr";

export const ui = {
  fr: {
    "nav.home": "Accueil",
    "nav.schedule": "Programme",
    "nav.speakers": "Speakers",
    "nav.sponsors": "Partenaires",
    "nav.venue": "Lieu",
    "nav.team": "Equipe",
    "site.title": "Cloud Native Days France 2027",
    "site.description": "3 juin 2027 -- CENTQUATRE-PARIS",
    "toggle.aria": "Selecteur de langue",
    "fallback.heading": "Contenu non disponible en francais",
    "fallback.body": "Cette page n'a pas encore ete traduite. Consulter la version originale.",
    "fallback.cta": "Voir en anglais",
  },
  en: {
    "nav.home": "Home",
    "nav.schedule": "Schedule",
    "nav.speakers": "Speakers",
    "nav.sponsors": "Partners",
    "nav.venue": "Venue",
    "nav.team": "Team",
    "site.title": "Cloud Native Days France 2027",
    "site.description": "June 3, 2027 -- CENTQUATRE-PARIS",
    "toggle.aria": "Language selector",
    "fallback.heading": "Content not available in English",
    "fallback.body": "This page has not been translated yet. View the original version.",
    "fallback.cta": "View in French",
  },
} as const;
```
[CITED: https://docs.astro.build/en/recipes/i18n/]

### Pattern 3: i18n Utility Functions

**What:** Helper functions for locale detection, translation, and URL generation
**When to use:** In every page and component that needs locale-awareness

```typescript
// src/i18n/utils.ts
import { ui, defaultLang, type Locale } from "./ui";

export function getLangFromUrl(url: URL): Locale {
  const [, lang] = url.pathname.split("/");
  if (lang in ui) return lang as Locale;
  return defaultLang;
}

export function useTranslations(lang: Locale) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]): string {
    return ui[lang][key] || ui[defaultLang][key];
  };
}

export function getLocalePath(lang: Locale, path: string): string {
  const cleanPath = path.replace(/^\/(en|fr)\//, "/").replace(/^\/+/, "");
  if (lang === defaultLang) return `/${cleanPath}`;
  return `/${lang}/${cleanPath}`;
}
```
[CITED: https://docs.astro.build/en/recipes/i18n/]

### Pattern 4: Content Collections with Bilingual Structure

**What:** Zod-validated collections using Content Layer API
**When to use:** For all structured data (speakers, talks, sponsors, team)

```typescript
// src/content.config.ts
import { defineCollection } from "astro:content";
import { glob, file } from "astro/loaders";
import { z } from "astro/zod";

const speakers = defineCollection({
  loader: glob({ base: "./src/content/speakers", pattern: "**/*.md" }),
  schema: z.object({
    name: z.string(),
    company: z.string().optional(),
    role: z.string().optional(),
    photo: z.string().optional(),
    bio: z.string(),
    social: z.object({
      twitter: z.string().url().optional(),
      linkedin: z.string().url().optional(),
      github: z.string().url().optional(),
      bluesky: z.string().url().optional(),
      website: z.string().url().optional(),
    }).optional(),
  }),
});

const talks = defineCollection({
  loader: glob({ base: "./src/content/talks", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    speaker: z.string(),           // References speaker ID
    cospeakers: z.array(z.string()).optional(),
    track: z.enum(["cloud-infra", "devops-platform", "security", "community"]),
    format: z.enum(["talk", "lightning", "workshop", "keynote"]),
    duration: z.number(),           // Minutes
    room: z.string().optional(),
    startTime: z.string().optional(),
    tags: z.array(z.string()).optional(),
    youtubeUrl: z.string().url().optional(),
    feedbackUrl: z.string().url().optional(),
  }),
});

const sponsors = defineCollection({
  loader: file("src/content/sponsors/sponsors.yaml"),
  schema: z.object({
    name: z.string(),
    tier: z.enum(["platinum", "gold", "silver", "community"]),
    logo: z.string(),
    url: z.string().url(),
    description: z.object({
      fr: z.string(),
      en: z.string(),
    }),
  }),
});

const team = defineCollection({
  loader: file("src/content/team/team.yaml"),
  schema: z.object({
    name: z.string(),
    role: z.object({
      fr: z.string(),
      en: z.string(),
    }),
    group: z.enum(["core", "program-committee", "volunteers"]),
    photo: z.string().optional(),
    social: z.object({
      twitter: z.string().url().optional(),
      linkedin: z.string().url().optional(),
      github: z.string().url().optional(),
      bluesky: z.string().url().optional(),
    }).optional(),
  }),
});

export const collections = { speakers, talks, sponsors, team };
```
[VERIFIED: Astro content collections docs]

**Design decision: Bilingual content structure**

- **Speakers and talks** use **separate files per locale** in `fr/` and `en/` subdirectories. These have Markdown body content (bios, abstracts) that benefits from full-file separation. The file ID includes the locale path (e.g., `fr/speaker-1`), which is parsed to filter by locale at query time.
- **Sponsors and team** use **single YAML files with inline locale fields** (`description.fr`, `description.en`). These have minimal translatable text (one-line descriptions, role names) and no Markdown body. A single file is simpler to maintain.

### Pattern 5: Querying Bilingual Content

```typescript
// In an Astro page component
import { getCollection } from "astro:content";

// Get speakers for current locale
const lang = Astro.currentLocale ?? "fr";
const allSpeakers = await getCollection("speakers");
const speakers = allSpeakers.filter((s) => s.id.startsWith(`${lang}/`));
```
[VERIFIED: Astro content collections docs]

### Anti-Patterns to Avoid
- **Do not use `prefixDefaultLocale: true`:** Requirement FNDN-02 specifies French at root paths (`/`), not `/fr/`. Default locale must be unprefixed.
- **Do not use Paraglide or any external i18n library:** Adds complexity and a dependency with uncertain Astro 6 compatibility for zero benefit on an SSG site.
- **Do not put translations in JSON files loaded at runtime:** This is a static site. Translations are TypeScript objects imported at build time -- fully type-safe and tree-shakeable.
- **Do not duplicate entire page files for each locale:** Use the same page template and switch content based on `Astro.currentLocale`. Only create `en/` page stubs that reference the same layout.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Locale detection from URL | Custom regex parser | `Astro.currentLocale` | Built into Astro 6, always correct |
| Localized URL generation | String concatenation | `getRelativeLocaleUrl()` from `astro:i18n` | Handles edge cases (trailing slashes, base paths) |
| Schema validation | Manual type checks | Zod via `astro/zod` | Astro fails the build on invalid data automatically |
| Content querying | Manual file reading | `getCollection()` / `getEntry()` | Type-safe, cached, integrated with build pipeline |
| Fallback routing | Custom middleware | `i18n.fallback` config | Built-in, handles rewrites cleanly |

## Common Pitfalls

### Pitfall 1: Astro 6 redirectToDefaultLocale Breaking Change
**What goes wrong:** Upgrading from Astro 5 patterns or tutorials that assume `redirectToDefaultLocale: true` (old default). In Astro 6 the default changed to `false`.
**Why it happens:** Most blog posts and tutorials were written for Astro 4/5.
**How to avoid:** Explicitly set `redirectToDefaultLocale: false` in config (matches Astro 6 default, makes intent clear).
**Warning signs:** Redirect loops or unexpected 404s on the default locale.
[VERIFIED: https://github.com/withastro/astro/pull/14406]

### Pitfall 2: Forgetting html lang Attribute
**What goes wrong:** The `<html lang="fr">` is hardcoded in Layout.astro. EN pages render with `lang="fr"`, hurting SEO and accessibility.
**Why it happens:** Layout was built in Phase 1 before i18n existed.
**How to avoid:** Make `lang` dynamic: `<html lang={Astro.currentLocale ?? "fr"}>`.
**Warning signs:** Lighthouse accessibility warnings about language mismatch.

### Pitfall 3: Content Collection ID Collision
**What goes wrong:** Files like `fr/speaker-1.md` and `en/speaker-1.md` must have distinct IDs in the collection. With `glob()`, the ID is derived from the file path relative to `base`, so `fr/speaker-1` and `en/speaker-1` are naturally distinct.
**Why it happens:** Confusion between slug (filename) and ID (full relative path).
**How to avoid:** Use `s.id.startsWith("fr/")` to filter, and strip the locale prefix when matching FR/EN pairs.
**Warning signs:** Duplicate key errors or missing entries.

### Pitfall 4: Missing content.config.ts (Astro 6 vs Legacy)
**What goes wrong:** Using the old `src/content/config.ts` path instead of `src/content.config.ts` (at project root of `src/`).
**Why it happens:** Astro 5+ changed the location of the content config file.
**How to avoid:** File must be at `src/content.config.ts`, not inside `src/content/`.
**Warning signs:** Collections not detected, types not generated.
[VERIFIED: Astro content collections docs]

### Pitfall 5: YAML File Loader Requires id Field
**What goes wrong:** The `file()` loader for YAML expects each entry to have a unique `id` property. Without it, entries cannot be individually queried.
**Why it happens:** Unlike `glob()` which derives IDs from filenames, `file()` needs explicit IDs in the data.
**How to avoid:** Add an `id` field to each entry in the YAML array, or structure YAML as an object with keys as IDs.
**Warning signs:** Build errors about missing entry identifiers.
[VERIFIED: Astro content collections docs]

## Code Examples

### Language Toggle Component (Astro)
```astro
---
// src/components/LanguageToggle.astro
// Source: UI-SPEC phase 2, Astro i18n recipe
import { languages, type Locale } from "@/i18n/ui";
import { getLangFromUrl, getLocalePath } from "@/i18n/utils";

const currentLang = getLangFromUrl(Astro.url);
const currentPath = Astro.url.pathname;
---
<nav aria-label="Language selector" class="inline-flex items-center gap-0 rounded-md border border-border bg-secondary p-1">
  {Object.entries(languages).map(([lang, label]) => {
    const isActive = lang === currentLang;
    return (
      <a
        href={getLocalePath(lang as Locale, currentPath)}
        aria-current={isActive ? "true" : undefined}
        class:list={[
          "inline-flex min-w-[40px] items-center justify-center rounded-sm px-3 py-1.5 text-sm font-semibold uppercase tracking-widest transition-colors duration-150",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-secondary/80",
        ]}
      >
        {label}
      </a>
    );
  })}
</nav>
```

### Layout.astro with Dynamic Lang
```astro
---
// src/layouts/Layout.astro (updated)
import { Font } from "astro:assets";
import "../styles/global.css";
import LanguageToggle from "@/components/LanguageToggle.astro";

interface Props {
  title?: string;
}

const { title = "Cloud Native Days France 2027" } = Astro.props;
const lang = Astro.currentLocale ?? "fr";
---
<html lang={lang} class="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <Font cssVariable="--font-dm-sans" preload />
  </head>
  <body class="bg-background text-foreground font-sans antialiased min-h-screen">
    <header class="sticky top-0 z-50 flex items-center justify-end px-4 py-3 backdrop-blur-sm bg-background/90">
      <LanguageToggle />
    </header>
    <slot />
  </body>
</html>
```

### Sample Content Entry (Speaker, FR)
```markdown
---
# src/content/speakers/fr/speaker-1.md
name: "Jane Doe"
company: "Acme Cloud"
role: "Staff Engineer"
photo: "/speakers/jane-doe.jpg"
bio: "Experte en plateformes cloud-native avec 10 ans d'experience."
social:
  linkedin: "https://linkedin.com/in/janedoe"
  github: "https://github.com/janedoe"
---

Jane est une passionnee de Kubernetes et contribue activement a l'ecosysteme CNCF.
```

### Sample YAML Entry (Sponsors)
```yaml
# src/content/sponsors/sponsors.yaml
- id: acme-cloud
  name: Acme Cloud
  tier: platinum
  logo: /sponsors/acme-cloud.svg
  url: https://acmecloud.example.com
  description:
    fr: "Leader mondial des solutions cloud-native."
    en: "Global leader in cloud-native solutions."

- id: kube-corp
  name: KubeCorp
  tier: gold
  logo: /sponsors/kubecorp.svg
  url: https://kubecorp.example.com
  description:
    fr: "Solutions Kubernetes pour l'entreprise."
    en: "Enterprise Kubernetes solutions."
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `src/content/config.ts` | `src/content.config.ts` | Astro 5.0 | File location moved to project src root |
| `type: 'content'` / `type: 'data'` | `loader: glob()` / `loader: file()` | Astro 5.0 | Content Layer API replaces old collection types |
| `redirectToDefaultLocale: true` (default) | `redirectToDefaultLocale: false` (default) | Astro 6.0 | Prevents redirect loops; explicit config recommended |
| Paraglide JS 1 + @inlang/paraglide-astro | Paraglide JS 2 (no adapter needed) | Late 2024 | Simpler but still unnecessary for SSG 2-locale sites |

**Deprecated/outdated:**
- `@inlang/paraglide-astro` adapter: Superseded by Paraglide JS 2 which works without adapter [CITED: https://inlang.com/m/gerre34r/library-inlang-paraglideJs/astro]
- Old content collection API (`type: 'content'`): Replaced by loader-based API in Astro 5+ [VERIFIED: Astro docs]
- i18next with Astro: Not compatible with Astro 5+ [CITED: search results, Feb 2025]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Sponsors and team data is locale-independent except for short descriptions/roles | Architecture Patterns | If they need full Markdown bios, should use glob() with locale subdirs instead of file() |
| A2 | `file()` loader works with YAML arrays containing `id` fields | Code Examples | If YAML array format is not supported, would need object-keyed YAML or switch to glob() with individual files |

## Open Questions

1. **EN page stubs structure**
   - What we know: FR pages live at `src/pages/` root, EN pages under `src/pages/en/`
   - What's unclear: Whether EN pages should be full duplicates or thin wrappers that import a shared component
   - Recommendation: Use thin wrappers -- `src/pages/en/index.astro` imports the same sections as `src/pages/index.astro` but with `lang="en"` context. Keeps maintenance low.

2. **Navigation header scope**
   - What we know: UI-SPEC says toggle goes in header area of Layout.astro
   - What's unclear: Full navigation bar is not in scope for Phase 2 (nav links come in later phases)
   - Recommendation: Add a minimal header with just the language toggle. Later phases expand it into a full nav bar.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified -- this phase is purely code/config changes using already-installed Astro 6).

## Sources

### Primary (HIGH confidence)
- [Astro i18n docs](https://docs.astro.build/en/guides/internationalization/) - routing config, locale detection, helpers
- [Astro content collections docs](https://docs.astro.build/en/guides/content-collections/) - Content Layer API, glob/file loaders, Zod schemas
- [Astro i18n recipe](https://docs.astro.build/en/recipes/i18n/) - translation dictionary pattern, language picker
- [Astro 6 upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v6/) - redirectToDefaultLocale breaking change
- npm registry: astro@6.1.5 verified current

### Secondary (MEDIUM confidence)
- [Astro 6 redirectToDefaultLocale PR](https://github.com/withastro/astro/pull/14406) - breaking change details
- [Paraglide JS Astro docs](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/astro) - confirmed Paraglide JS 2 no longer needs adapter

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Astro built-in i18n is well-documented and verified for 6.x
- Architecture: HIGH - Content Layer API with glob/file loaders is the current standard, verified in docs
- Pitfalls: HIGH - Astro 6 breaking change verified via PR, content config location verified in docs
- Schemas: MEDIUM - Exact YAML file() loader behavior with arrays needs build-time validation (A2)

**Research date:** 2026-04-11
**Valid until:** 2026-05-11 (Astro 6 stable, slow-moving API)
