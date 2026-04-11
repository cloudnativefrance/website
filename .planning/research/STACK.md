# Technology Stack

**Project:** Cloud Native Days France Website
**Researched:** 2026-04-11

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Astro | 6.1.x | Static site generator | Current stable (released March 2026). Content Layer API is mature, built-in i18n routing, zero JS by default. Astro 6 is the right choice for a greenfield project -- no migration debt, latest Vite 7, and the ecosystem has caught up. Requires Node 22.12+. | HIGH |
| React | 19.x | Interactive islands (schedule, language toggle, mobile nav) | shadcn/ui requires React. Islands architecture means React only loads where interactivity is needed -- most pages ship zero JS. | HIGH |
| @astrojs/react | 5.0.x | Astro-React integration | Official integration, maintained by Astro core team. Enables `client:*` directives on React components. | HIGH |
| TypeScript | 5.7+ | Type safety | Astro 6 has first-class TS support. Content collection schemas use Zod 4 for validation. Non-negotiable for a multi-contributor project. | HIGH |

### Styling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | 4.x | Utility-first CSS | Already decided. V4 uses `@tailwindcss/vite` plugin (not the deprecated `@astrojs/tailwind` integration). CSS-first config via `@import "tailwindcss"`. | HIGH |
| @tailwindcss/vite | 4.x | Vite plugin for Tailwind 4 | The official way to use Tailwind 4 with Astro. Replaces the old `@astrojs/tailwind` integration which is deprecated. | HIGH |
| shadcn/ui | latest (CLI v4) | Pre-built accessible React components | Already decided. Provides buttons, cards, dialogs, tabs, sheets -- all accessible and Tailwind-native. CLI v4 released March 2026. Important caveat: shadcn components must live inside React islands (.tsx files), not directly in .astro files, because React context is not shared between islands. | HIGH |

### Content & Data

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Astro Content Layer API | built-in (v6) | Typed content collections | Define schemas with Zod 4 for speakers, talks, sponsors, team. Uses `glob()` loader for local Markdown/YAML. Legacy collections API is removed in v6 -- Content Layer is the only path. | HIGH |
| Zod | 4.x | Schema validation | Ships with Astro 6. Validates content frontmatter at build time. Import from `astro/zod` (not `astro:content` which is deprecated). | HIGH |
| Markdown + YAML frontmatter | -- | Content format | Speakers, talks, sponsors, team as `.md` files with typed frontmatter. YAML-only files supported too via glob loader for pure data (sponsor tiers, schedule slots). | HIGH |

### Internationalization (i18n)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Astro built-in i18n routing | built-in (v6) | Locale-prefixed routes, language detection | Provides `/fr/` and `/en/` URL prefixes, `Astro.currentLocale`, browser language detection via `Astro.preferredLocale`, and fallback configuration. This handles the routing layer. Note: Astro 6 changed `redirectToDefaultLocale` default to `false`. | HIGH |
| @inlang/paraglide-js | 2.15.x | UI string translations | Compiler-based i18n: translations become tree-shakable functions. Type-safe message keys -- build fails if a translation key is wrong. V2 works directly with Astro's built-in i18n (no separate adapter needed). Generates `messages/{lang}.json` files. | MEDIUM |

**i18n Strategy:** Astro's built-in routing handles locale-prefixed URLs and content duplication (one `.md` file per language per page). Paraglide handles UI strings (buttons, labels, navigation text). Content files live in `src/content/{collection}/{locale}/` structure.

**Why not astro-i18next:** Archived/unmaintained, incompatible with Astro 5+. Dead project.
**Why not manual JSON dictionaries:** Works for simple cases but lacks type safety, no build-time key validation, easy to miss translations. Paraglide solves all of these.

### Image Optimization

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| astro:assets (`<Image />`, `<Picture />`) | built-in (v6) | Image optimization | Built-in since Astro 3, replaces deprecated `@astrojs/image`. Automatic WebP/AVIF conversion, responsive sizes, lazy loading, CLS prevention. | HIGH |
| sharp | latest | Image processing service | Default image service in Astro. Fast, Node-native. Handles resizing, format conversion at build time. | HIGH |

### SEO

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @astrojs/sitemap | 3.7.x | Sitemap generation | Official integration. Auto-generates `sitemap.xml` at build time. Supports i18n sitemaps with `xhtml:link` alternates. | HIGH |
| astro-seo | 0.8.x | SEO meta tag component | Convenient `<SEO />` component for `<head>`. Handles title, description, Open Graph, Twitter cards, canonical URLs in one place. Not strictly necessary (you can write meta tags manually), but reduces boilerplate across bilingual pages. | MEDIUM |
| Manual JSON-LD | -- | Structured data (Event schema) | Use `<script type="application/ld+json">` in layout. Schema.org Event type for the conference. No library needed -- it is just a JSON object in a script tag. | HIGH |

### Schedule & Calendar

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Custom React component | -- | Interactive schedule grid | Build a custom schedule component as a React island. Conference schedules have unique requirements (parallel tracks, time slots, filtering by track/tag, bookmarking). Generic calendar libraries (FullCalendar, react-big-calendar) are overkill and bring massive bundle sizes for what is essentially a filterable grid. | HIGH |
| ics | 3.11.x | iCal file generation | Lightweight (no dependencies), generates RFC 5545 compliant `.ics` files. Use for "Add to calendar" and "Export personal agenda" features. Called at build time to pre-generate `.ics` files per talk, or client-side for custom agenda export. | HIGH |

**Why not FullCalendar/react-big-calendar:** These are interactive calendar UIs for event management (creating/dragging events). A conference schedule is a read-only display with filtering -- fundamentally different use case. A custom component with Tailwind will be lighter, more on-brand, and easier to maintain.

### Docker & Deployment

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Node 22 (build stage) | 22-alpine | Build the Astro site | Astro 6 requires Node 22.12+. Alpine variant for smaller image. | HIGH |
| nginx (runtime stage) | alpine | Serve static files | Multi-stage Docker build: Node builds the site, nginx serves the `dist/` folder. Minimal attack surface, ~25MB final image. Enables gzip, caching headers, clean URL routing. | HIGH |

**Dockerfile strategy:** Two-stage build. Stage 1 (`node:22-alpine`): install deps, build. Stage 2 (`nginx:alpine`): copy `dist/` and `nginx.conf`. No Node.js in production image.

### Development Tools

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| pnpm | 9.x | Package manager | Faster installs, strict dependency resolution, disk-efficient. Works well with Docker layer caching. | HIGH |
| Biome | latest | Linter + formatter | Single tool replaces ESLint + Prettier. Fast (Rust-based), zero config for common cases. Supports TS, JSX, JSON, CSS. | MEDIUM |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework version | Astro 6 | Astro 5 | Greenfield project -- start on latest. Astro 5 patterns (legacy collections) are removed in 6, so starting with 5 means immediate migration debt. |
| i18n UI strings | Paraglide JS 2 | Manual JSON dictionaries | No type safety, no build-time validation of missing keys, no tree-shaking. Paraglide is small and solves real problems. |
| i18n UI strings | Paraglide JS 2 | astro-i18next | Archived, incompatible with Astro 5+. |
| Styling integration | @tailwindcss/vite | @astrojs/tailwind | @astrojs/tailwind is deprecated for Tailwind v4. Official docs recommend the Vite plugin. |
| Image optimization | Built-in astro:assets | @astrojs/image | @astrojs/image was deprecated in Astro 3. astro:assets is the built-in replacement. |
| Schedule display | Custom React component | FullCalendar / react-big-calendar | Overkill for read-only schedule display. Massive bundle, wrong abstraction. |
| iCal generation | ics | ical-generator | `ics` is simpler, lighter, focused on generation. `ical-generator` has more features but we only need basic event creation. |
| Linter | Biome | ESLint + Prettier | Two tools to configure vs one. Biome is faster. If team prefers ESLint, that works too -- not a critical decision. |
| Package manager | pnpm | npm | pnpm is faster and stricter. npm works fine too. Not a hill to die on. |

## Installation

```bash
# Create project
pnpm create astro@latest cndfrance-website -- --template minimal

# Core integrations
pnpm add @astrojs/react react react-dom
pnpm add -D @tailwindcss/vite tailwindcss

# shadcn/ui (run after project setup)
pnpm dlx shadcn@latest init -t astro

# i18n
pnpm add @inlang/paraglide-js
# Then run: npx @inlang/paraglide-js init

# SEO & sitemap
pnpm add @astrojs/sitemap astro-seo

# Calendar export
pnpm add ics

# Dev tools
pnpm add -D @biomejs/biome typescript @types/react @types/react-dom
```

## Key Configuration

### astro.config.mjs

```typescript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import paraglide from '@inlang/paraglide-astro';

export default defineConfig({
  site: 'https://cloudnativedays.fr',
  output: 'static',
  i18n: {
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
    routing: {
      prefixDefaultLocale: false, // /about = French, /en/about = English
    },
  },
  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: 'fr',
        locales: { fr: 'fr-FR', en: 'en-US' },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

### Content Collection Schema (src/content.config.ts)

```typescript
import { defineCollection, z } from 'astro/zod';
import { glob } from 'astro/loaders';

const speakers = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/speakers' }),
  schema: z.object({
    name: z.string(),
    company: z.string().optional(),
    bio: z.string(),
    photo: z.string(),
    social: z.object({
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
      github: z.string().optional(),
      bluesky: z.string().optional(),
    }).optional(),
  }),
});

const talks = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/talks' }),
  schema: z.object({
    title: z.string(),
    speaker: z.string(), // references speaker id
    track: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    room: z.string(),
    language: z.enum(['fr', 'en']),
    level: z.enum(['beginner', 'intermediate', 'advanced']),
    tags: z.array(z.string()),
  }),
});
```

### Dockerfile

```dockerfile
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM nginx:alpine AS runtime
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
```

## Version Pinning Strategy

Pin major versions in `package.json` to avoid breaking changes:

```json
{
  "astro": "^6.1.0",
  "@astrojs/react": "^5.0.0",
  "@astrojs/sitemap": "^3.7.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "tailwindcss": "^4.0.0",
  "@tailwindcss/vite": "^4.0.0",
  "@inlang/paraglide-js": "^2.15.0",
  "ics": "^3.11.0",
  "astro-seo": "^0.8.0"
}
```

## Sources

- [Astro 6 stable release](https://astro.build/blog/astro-6/) - March 2026
- [Astro 6 upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v6/) - Breaking changes, Node 22 requirement
- [Astro i18n routing docs](https://docs.astro.build/en/guides/internationalization/) - Built-in locale routing
- [Astro content collections docs](https://docs.astro.build/en/guides/content-collections/) - Content Layer API
- [Astro Docker recipe](https://docs.astro.build/en/recipes/docker/) - Multi-stage Dockerfile
- [Astro images docs](https://docs.astro.build/en/guides/images/) - astro:assets, sharp default
- [Tailwind CSS 4 Astro guide](https://tailwindcss.com/docs/installation/framework-guides/astro) - @tailwindcss/vite setup
- [shadcn/ui Astro installation](https://ui.shadcn.com/docs/installation/astro) - CLI v4, React islands caveat
- [shadcn/cli v4 changelog](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4) - March 2026
- [Paraglide JS Astro guide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/astro) - V2 setup without adapter
- [@inlang/paraglide-js npm](https://www.npmjs.com/package/@inlang/paraglide-js) - v2.15.3
- [@astrojs/sitemap npm](https://www.npmjs.com/package/@astrojs/sitemap) - v3.7.2
- [@astrojs/react npm](https://www.npmjs.com/package/@astrojs/react) - v5.0.3
- [ics npm](https://www.npmjs.com/package/ics) - v3.11.0, iCal generation
- [Astro SEO complete guide](https://eastondev.com/blog/en/posts/dev/20251202-astro-seo-complete-guide/) - Meta tags + JSON-LD patterns
