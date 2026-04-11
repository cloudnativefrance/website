# Architecture Patterns

**Domain:** Conference website (Cloud Native Days France)
**Researched:** 2026-04-11

## Recommended Architecture

**Astro static site with React islands**, built at deploy time, served as pure HTML/CSS/JS from an Nginx container on Kubernetes.

```
                     Build Time                          Runtime
               +-----------------------+          +------------------+
               |  Content Collections  |          |                  |
               |  (Markdown + YAML)    |          |   Nginx (Alpine) |
               |         |             |          |   serves /dist   |
               |         v             |          |   static files   |
               |  Astro SSG Pipeline   |  ------> |                  |
               |  + React Islands      |  docker  |  Gzip, caching,  |
               |  + Tailwind CSS 4     |  build   |  try_files       |
               |  + i18n routing       |          |                  |
               +-----------------------+          +------------------+
                                                        |
                                                   K8s Deployment
                                                   + Ingress
```

All content is resolved at build time. No server-side runtime. The final Docker image contains only Nginx + static files (~30-50 MB).

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Content Collections** | Schema-validated data (speakers, talks, sponsors, team, schedule) | Astro pages via `getCollection()` |
| **Astro Pages** (`src/pages/`) | Route generation, i18n routing, static HTML output | Layouts, components, content collections |
| **Astro Layouts** (`src/layouts/`) | Page shells (BaseLayout, PageLayout) with head, nav, footer | Astro components, design tokens |
| **Astro Components** (`src/components/`) | Static UI blocks (speaker cards, sponsor grids, hero sections) | Content data passed as props |
| **React Islands** (`src/components/react/`) | Interactive UI only (schedule filter, search, mobile nav) | Hydrated via `client:visible` / `client:load` |
| **Design Tokens** (`src/styles/`) | Tailwind CSS 4 config + custom properties from DESIGN.md | All components via Tailwind classes |
| **i18n System** | Locale routing + UI string translations | Pages (folder structure), components (translation keys) |
| **Build Pipeline** | Astro build + Docker multi-stage | Content collections -> static output -> Nginx image |

### Data Flow

```
1. Content authored in Markdown/YAML files
       |
2. content.config.ts validates with Zod schemas
       |
3. Astro pages call getCollection('speakers'), getCollection('talks'), etc.
       |
4. Pages filter by locale (id.startsWith('fr/') or id.startsWith('en/'))
       |
5. Data passed as props to Astro components (static) or React islands (interactive)
       |
6. Astro renders everything to static HTML at build time
       |
7. React islands hydrate client-side only where needed (schedule, search)
       |
8. Output: /dist/ folder with all HTML, CSS, JS, images
       |
9. Docker COPY --from=build /app/dist -> Nginx serves it
```

## Project Structure

```
cndfrance-website/
├── src/
│   ├── content/                    # Content collections root
│   │   ├── speakers/
│   │   │   ├── fr/                 # French speaker bios (Markdown)
│   │   │   └── en/                 # English speaker bios (Markdown)
│   │   ├── talks/
│   │   │   ├── fr/                 # French talk descriptions (Markdown)
│   │   │   └── en/
│   │   ├── sponsors/
│   │   │   └── sponsors.yaml      # Sponsor data (language-neutral, logos + URLs)
│   │   ├── team/
│   │   │   └── team.yaml           # Organizer data (language-neutral)
│   │   └── schedule/
│   │       └── schedule.yaml       # Time slots, room assignments, talk refs
│   │
│   ├── content.config.ts           # defineCollection + Zod schemas for all collections
│   │
│   ├── i18n/
│   │   ├── ui.ts                   # UI string translations { fr: {...}, en: {...} }
│   │   └── utils.ts                # getLangFromUrl(), useTranslations(), etc.
│   │
│   ├── pages/
│   │   ├── index.astro             # FR homepage (default locale, no prefix)
│   │   ├── speakers.astro          # FR speakers page
│   │   ├── schedule.astro          # FR schedule page
│   │   ├── sponsors.astro          # FR sponsors page
│   │   ├── about.astro             # FR about/team page
│   │   ├── cfp.astro               # FR call for papers
│   │   ├── [slug].astro            # FR dynamic talk detail pages
│   │   └── en/
│   │       ├── index.astro         # EN homepage
│   │       ├── speakers.astro
│   │       ├── schedule.astro
│   │       ├── sponsors.astro
│   │       ├── about.astro
│   │       ├── cfp.astro
│   │       └── [slug].astro
│   │
│   ├── layouts/
│   │   ├── BaseLayout.astro        # HTML shell: <html>, <head>, meta, fonts, analytics
│   │   └── PageLayout.astro        # Extends Base: adds nav + footer + main slot
│   │
│   ├── components/
│   │   ├── Header.astro            # Site header with nav + language switcher
│   │   ├── Footer.astro            # Site footer with links, social, legal
│   │   ├── Hero.astro              # Landing hero section
│   │   ├── SpeakerCard.astro       # Individual speaker display
│   │   ├── SpeakerGrid.astro       # Grid layout of speaker cards
│   │   ├── TalkCard.astro          # Talk preview card
│   │   ├── SponsorTier.astro       # Sponsor logos grouped by tier
│   │   ├── TeamGrid.astro          # Organizer team grid
│   │   ├── LanguageSwitcher.astro  # FR/EN toggle (static, no JS needed)
│   │   ├── CTA.astro               # Call-to-action buttons (tickets, CFP)
│   │   └── react/
│   │       ├── ScheduleFilter.tsx  # Interactive schedule with track/time filtering
│   │       └── MobileNav.tsx       # Mobile hamburger menu (needs JS for toggle)
│   │
│   └── styles/
│       └── global.css              # Tailwind directives + design token custom properties
│
├── public/
│   ├── fonts/                      # Self-hosted fonts
│   ├── images/
│   │   ├── speakers/               # Speaker photos
│   │   ├── sponsors/               # Sponsor logos
│   │   └── og/                     # Open Graph images
│   └── favicon.svg
│
├── nginx/
│   └── nginx.conf                  # Gzip, caching headers, try_files, security headers
│
├── Dockerfile                      # Multi-stage: node build -> nginx serve
├── astro.config.mjs                # Astro config: React integration, i18n, Tailwind
├── tailwind.config.ts              # Design tokens, theme extension
├── tsconfig.json                   # Path aliases (@/* -> src/*)
└── package.json
```

## Content Collections Schema Design

The `src/content.config.ts` file defines all collections with Zod validation.

```typescript
import { defineCollection, z, reference } from 'astro:content';
import { glob, file } from 'astro/loaders';

// Speakers: Markdown files with frontmatter (one per speaker, per language)
const speakers = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/speakers' }),
  schema: z.object({
    name: z.string(),
    title: z.string(),           // Job title
    company: z.string(),
    photo: z.string(),           // Path in /public/images/speakers/
    social: z.object({
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
      github: z.string().optional(),
      mastodon: z.string().optional(),
    }).optional(),
    featured: z.boolean().default(false),
  }),
});

// Talks: Markdown files with frontmatter (one per talk, per language)
const talks = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/talks' }),
  schema: z.object({
    title: z.string(),
    speakerSlugs: z.array(z.string()),  // References to speaker file slugs
    track: z.enum(['keynote', 'cloud-native', 'platform', 'security', 'observability', 'community']),
    level: z.enum(['beginner', 'intermediate', 'advanced']),
    language: z.enum(['fr', 'en']),       // Talk delivery language
    duration: z.number(),                  // Minutes
    tags: z.array(z.string()).default([]),
  }),
});

// Sponsors: Single YAML file, language-neutral
const sponsors = defineCollection({
  loader: file('./src/content/sponsors/sponsors.yaml'),
  schema: z.object({
    name: z.string(),
    tier: z.enum(['platinum', 'gold', 'silver', 'bronze', 'community']),
    logo: z.string(),
    url: z.string().url(),
    description: z.string().optional(),
  }),
});

// Schedule: Single YAML file, references talks by slug
const schedule = defineCollection({
  loader: file('./src/content/schedule/schedule.yaml'),
  schema: z.object({
    day: z.coerce.date(),
    timeSlot: z.string(),        // "09:00-09:45"
    room: z.string(),
    talkSlug: z.string(),        // References a talk file slug
    type: z.enum(['talk', 'keynote', 'break', 'lunch', 'workshop', 'lightning']),
  }),
});

// Team: Single YAML file, language-neutral
const team = defineCollection({
  loader: file('./src/content/team/team.yaml'),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    photo: z.string().optional(),
    social: z.object({
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
      github: z.string().optional(),
    }).optional(),
  }),
});

export const collections = { speakers, talks, sponsors, schedule, team };
```

**Why this schema design:**
- Speakers and talks are Markdown (need body content for bios/abstracts) and bilingual (fr/en subfolders).
- Sponsors, schedule, and team are YAML (structured data only, no body text) and language-neutral.
- Cross-references use string slugs rather than Astro's `reference()` because schedule references talks which reference speakers across locale boundaries. Slug-based lookups are simpler and more explicit.

## i18n Architecture

Use Astro's built-in i18n routing with **French as default locale** (no URL prefix) and English as secondary (`/en/`).

```typescript
// astro.config.mjs
export default defineConfig({
  i18n: {
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
  },
  integrations: [react(), tailwind()],
  output: 'static',
});
```

### Translation layers

| Layer | Mechanism | Example |
|-------|-----------|---------|
| **Content** (talks, speakers) | Separate Markdown files in `fr/` and `en/` subfolders | `src/content/speakers/fr/jane-doe.md` vs `src/content/speakers/en/jane-doe.md` |
| **UI strings** (nav, buttons, labels) | TypeScript dictionary in `src/i18n/ui.ts` | `{ fr: { nav.schedule: "Programme" }, en: { nav.schedule: "Schedule" } }` |
| **Page routes** | Duplicate `.astro` files in `src/pages/` and `src/pages/en/` | `/schedule` (FR) vs `/en/schedule` (EN) |

### Language-aware content querying

```typescript
// In any .astro page:
const lang = getLangFromUrl(Astro.url);  // 'fr' or 'en'
const speakers = await getCollection('speakers', ({ id }) => id.startsWith(`${lang}/`));
```

### Language switcher

Static Astro component (no JS). Reads current path, swaps locale prefix:
- `/schedule` -> `/en/schedule`
- `/en/speakers` -> `/speakers`

## Patterns to Follow

### Pattern 1: Static-First, Island-Second

**What:** Default to Astro components (`.astro` files) for everything. Only reach for React (`.tsx`) when the component genuinely needs client-side interactivity.

**When:** Always. This is the core architectural discipline.

**Concrete rule:** If the component does not use `useState`, `useEffect`, event handlers beyond links, or client-side filtering/sorting, it must be an `.astro` file.

**Good candidates for React islands:**
- Schedule filter (track selection, time range, search across talks)
- Mobile navigation toggle
- Potentially: ticket purchase widget (if embedded)

**NOT React islands (common mistake):**
- Speaker cards, sponsor grids, hero sections, footers -- these are static.

### Pattern 2: Hydration Directive Selection

**What:** Choose the right `client:*` directive for each React island.

| Directive | Use When | Example |
|-----------|----------|---------|
| `client:load` | Must be interactive immediately on page load | Mobile nav toggle |
| `client:visible` | Below the fold, can wait until scrolled into view | Schedule filter on schedule page |
| `client:idle` | Not urgent, load when browser is idle | Search widget |

```astro
---
import ScheduleFilter from '../components/react/ScheduleFilter.tsx';
const schedule = await getCollection('schedule');
---
<ScheduleFilter client:visible schedule={schedule} />
```

### Pattern 3: Props Serialization Boundary

**What:** Data flows from Astro (build-time) to React islands via serializable props. Pass pre-filtered, pre-shaped data -- not raw collection objects.

**Why:** React islands receive props as JSON. Keep the data minimal to reduce page weight.

```astro
---
// In schedule.astro - shape data at build time
const scheduleData = schedule.map(s => ({
  time: s.data.timeSlot,
  room: s.data.room,
  title: talks.find(t => t.id.includes(s.data.talkSlug))?.data.title,
  track: talks.find(t => t.id.includes(s.data.talkSlug))?.data.track,
  speaker: /* resolved speaker name */,
}));
---
<ScheduleFilter client:visible data={scheduleData} />
```

### Pattern 4: Shared Layout Chain

**What:** Two-level layout hierarchy: `BaseLayout` -> `PageLayout`.

```
BaseLayout.astro
├── <html lang={lang}>
├── <head> (meta, fonts, OG tags, analytics)
├── <body>
│   └── <slot />            # PageLayout fills this
│
PageLayout.astro (extends BaseLayout)
├── <Header />
├── <main><slot /></main>   # Page content fills this
└── <Footer />
```

Every page uses `PageLayout`. Only deviate for special pages (e.g., a full-bleed landing page might use `BaseLayout` directly).

### Pattern 5: Year-Over-Year Content Rotation

**What:** Design content collections so conference content can be archived and reset annually.

**How:** Content lives in the repo (not a CMS). Each year:
1. Archive previous year's content to a `content/archive/2025/` folder (or a git tag).
2. Clear current content folders.
3. Schema stays the same; only data changes.

Keep schemas stable across years. The site structure and components should not need changes year-to-year, only content.

## Anti-Patterns to Avoid

### Anti-Pattern 1: React for Everything

**What:** Using React components where Astro components suffice.
**Why bad:** Ships unnecessary JavaScript. Breaks the zero-JS-by-default benefit. Makes components harder to maintain (need hydration directives, can't share Astro context).
**Instead:** Default to `.astro`. Only use React when you need `useState` or browser APIs.

### Anti-Pattern 2: Shared React Context Across Islands

**What:** Trying to use React Context to share state between separate React islands on the same page.
**Why bad:** Each island is an independent React root. Context does not cross island boundaries. This is a fundamental Astro constraint.
**Instead:** Use URL query parameters, `nanostores` (a lightweight reactive store), or lift shared state to Astro page level and pass as props to each island.

### Anti-Pattern 3: Dynamic Routes for Translated Pages

**What:** Using `[lang]/schedule.astro` with dynamic locale parameter instead of explicit locale folders.
**Why bad:** Loses Astro's built-in i18n routing benefits (automatic locale detection, `getRelativeLocaleUrl()` helpers, middleware support). Requires manual locale resolution in every page.
**Instead:** Use the folder-based pattern: `pages/schedule.astro` (FR) + `pages/en/schedule.astro` (EN). Each page imports a shared component and passes the locale.

### Anti-Pattern 4: Fat Islands

**What:** Passing entire collection arrays to React islands, or making islands responsible for data fetching.
**Why bad:** Bloats HTML payload (data serialized inline). React hydration downloads all data again.
**Instead:** Pre-filter and shape data in Astro page frontmatter. Pass only what the island needs.

### Anti-Pattern 5: CMS for Conference Content

**What:** Using a headless CMS (Contentful, Sanity, etc.) for speaker/talk data.
**Why bad:** Adds operational complexity for content that changes once per year. Creates a runtime dependency for a static site. Content review is harder (no PR-based workflow).
**Instead:** Markdown + YAML in Git. Content changes go through PRs. Build validates with Zod schemas.

## Docker Deployment Architecture

### Multi-Stage Dockerfile

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine AS runtime
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
```

### Nginx Configuration Essentials

```nginx
worker_processes auto;
events { worker_connections 1024; }

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    sendfile      on;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;

    server {
        listen 8080;
        server_name _;
        root /usr/share/nginx/html;

        # Astro generates /page/index.html for /page routes
        location / {
            try_files $uri $uri/index.html =404;
        }

        # Cache static assets aggressively (Astro hashes filenames)
        location /_astro/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        error_page 404 /404.html;
    }
}
```

### Kubernetes Deployment

Standard Deployment + Service + Ingress. The container is stateless, horizontally scalable, and fast to start (~100ms).

Key considerations:
- **Liveness/readiness probes:** HTTP GET on `/` (Nginx responds instantly)
- **Resource limits:** Very low (50m CPU, 64Mi RAM is generous for Nginx)
- **Ingress:** TLS termination via cert-manager, host-based routing
- **Image size:** ~30-50 MB total (Alpine Nginx + static files)
- **Rollout:** Standard rolling update. New build = new image tag.

## Build Order (Dependencies Between Components)

This defines what must be built first and informs phase ordering in the roadmap.

```
Phase 1: Foundation (no dependencies)
├── Astro project scaffolding
├── Tailwind CSS 4 + design tokens from DESIGN.md
├── BaseLayout + PageLayout
├── astro.config.mjs with i18n config
└── content.config.ts with Zod schemas

Phase 2: Content + Static Pages (depends on Phase 1)
├── Content collection data files (speakers, talks, sponsors, team, schedule YAML/MD)
├── Static Astro components (SpeakerCard, SponsorTier, TalkCard, etc.)
├── All static pages (homepage, speakers, sponsors, about, CFP)
├── Header + Footer + LanguageSwitcher
└── i18n: UI string translations + language-aware content queries

Phase 3: Interactive Islands (depends on Phase 2 content schemas)
├── ScheduleFilter React component
├── MobileNav React component
├── Integration with Astro pages via client:* directives
└── Props serialization (build-time data shaping)

Phase 4: Deployment (depends on Phase 1 minimally, can parallel with 2-3)
├── Dockerfile (multi-stage build)
├── nginx.conf
├── Kubernetes manifests (Deployment, Service, Ingress)
└── CI/CD pipeline (build image, push, deploy)

Phase 5: Polish (depends on all above)
├── SEO: Open Graph images, meta tags, structured data
├── Performance: Lighthouse audit, image optimization
├── Accessibility audit
└── 404 page, redirects
```

## Scalability Considerations

| Concern | At launch | At 10K concurrent visitors | Notes |
|---------|-----------|---------------------------|-------|
| **Server load** | Single replica, Nginx handles thousands of req/s | HPA scales replicas, but likely unnecessary | Static files + CDN make this a non-issue |
| **Build time** | <30 seconds for ~50 pages | Same (static build, not per-request) | Only rebuilds on content change |
| **Content volume** | ~50 speakers, ~40 talks | Same (conference scale is bounded) | Content collections handle thousands of entries easily |
| **i18n** | 2 locales, ~2x pages | Same | Astro generates all locale pages at build time |

For a conference website, scalability is not a meaningful concern. The entire site is static. If traffic spikes during ticket sales, Nginx + K8s HPA handles it trivially. The real "scaling" challenge is year-over-year maintainability, addressed by the content rotation pattern above.

## Sources

- [Astro Content Collections docs](https://docs.astro.build/en/guides/content-collections/) - HIGH confidence
- [Astro i18n Routing docs](https://docs.astro.build/en/guides/internationalization/) - HIGH confidence
- [Astro Islands Architecture](https://docs.astro.build/en/concepts/islands/) - HIGH confidence
- [Astro Project Structure](https://docs.astro.build/en/basics/project-structure/) - HIGH confidence
- [Astro Docker Recipe](https://docs.astro.build/en/recipes/docker/) - HIGH confidence
- [shadcn/ui Astro Installation](https://ui.shadcn.com/docs/installation/astro) - HIGH confidence
- [Building a Bilingual Site with Astro](https://tobias-schaefer.com/blog/astro-bilingual-workflow/) - MEDIUM confidence
- [Astro i18n Complete Guide (2026)](https://www.maviklabs.com/blog/internationalization-astro-2026/) - MEDIUM confidence
- [Live Content Collections Deep Dive](https://astro.build/blog/live-content-collections-deep-dive/) - MEDIUM confidence (not needed for this project, but relevant for future)
