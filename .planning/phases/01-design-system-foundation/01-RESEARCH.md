# Phase 1: Design System & Foundation - Research

**Researched:** 2026-04-11
**Domain:** Astro 6 + Tailwind CSS 4 + shadcn/ui scaffolding, design system, Docker/K8s deployment
**Confidence:** HIGH

## Summary

This phase scaffolds the Astro 6 project with React islands, Tailwind CSS 4, and shadcn/ui, defines the visual identity through Google Stitch (producing DESIGN.md), wires design tokens into code, and creates the Docker/K8s deployment pipeline. The stack is well-established and all components have official first-class integration paths.

Astro 6 (current: v6.1.2, released March 2026) introduces a built-in Fonts API that simplifies self-hosting DM Sans with automatic optimization -- this replaces the older Fontsource npm approach. Tailwind CSS 4 uses a CSS-native `@theme` directive instead of JavaScript config files, and shadcn/ui has full Tailwind v4 support with OKLCH colors and `tw-animate-css` replacing the deprecated `tailwindcss-animate`. The Docker target of under 50MB is achievable with a Node 22 build stage and nginx:alpine runtime stage (typically 40-45MB).

**Primary recommendation:** Use `pnpm` throughout, scaffold with `pnpm create astro@latest`, add React + Tailwind via `pnpm astro add`, then initialize shadcn/ui with `pnpm dlx shadcn@latest init -t astro`. Use Astro 6's built-in Fonts API for DM Sans. Define all design tokens in `src/styles/global.css` using Tailwind 4's `@theme` directive.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Bold and energetic mood -- vibrant colors, strong contrasts, dynamic feel (think KubeCon energy)
- Extract primary colors from the existing Cloud Native Days France logo
- Event photos from previous editions will be provided as atmosphere reference
- Typography and spacing: Claude's discretion, consistent with bold/energetic direction
- Geometric background patterns must complement the logo-derived color palette and bold/energetic mood
- Target domain: `2027.cloudnativedays.fr` initially (root `cloudnativedays.fr` later after 2026 site archival)
- Basic auth protection on the site until public event announcement
- K8s manifests live in `cnd-platform` repo (GitOps with Flux CD), NOT in the website repo
- Website repo contains only Dockerfile and build config
- Existing infra: NGINX ingress controller (`ingressClassName: public`), cert-manager with Let's Encrypt, Flux CD kustomizations
- Container image built via GitHub Actions on merge to main, pushed to GHCR (ghcr.io)
- Reference workflow for image builds: `Smana/cloud-native-ref` repo `.github/workflows/build-container-images.yml`

### Claude's Discretion
- Geometric pattern style choice
- Typography selection (weight, family) within bold/energetic direction
- Spacing scale and component sizing
- shadcn/ui component selection and customization depth for initial baseline
- Nginx configuration details for the static site image
- Docker image optimization approach (target: under 50MB per success criteria)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DSGN-01 | Design system defined in Google Stitch with colors, typography, spacing, and component patterns | Stitch MCP tools available (`create_design_system`, `apply_design_system`, `generate_screen_from_text`). Workflow documented in STITCH_WORKFLOW.md. |
| DSGN-02 | DESIGN.md exported and committed to project root as single source of truth | Stitch exports DESIGN.md with color strategy, typography rationale, spacing scale, layout constraints, component patterns. Manual export or MCP `get_screen` path. |
| DSGN-03 | Dark theme with bold/technical aesthetic and warm community accents | Tailwind 4 dark mode via `.dark` class on `:root`. shadcn/ui ships updated OKLCH dark mode colors. `@theme inline` maps CSS variables for light/dark. |
| DSGN-04 | Brand continuity: DM Sans font, geometric shapes, CND France + KCD logos | Astro 6 built-in Fonts API with `fontProviders.google()` or `fontProviders.fontsource()` for DM Sans. Register in Tailwind via `@theme inline { --font-sans: var(--font-dm-sans); }`. |
| DSGN-05 | Tailwind CSS 4 theme tokens derived from DESIGN.md | `@theme` directive in `global.css` defines `--color-*`, `--font-*`, `--spacing`, `--radius-*` as CSS custom properties. No JS config file needed. |
| DSGN-06 | shadcn/ui components customized to match design system | `pnpm dlx shadcn@latest init -t astro` scaffolds. Components use CSS variables from `global.css`. Theming via `:root` / `.dark` custom properties. |
| FNDN-01 | Astro 6 project scaffolded with React islands + Tailwind CSS 4 + shadcn/ui | `pnpm create astro@latest` + `pnpm astro add react` + `pnpm astro add tailwind`. Astro 6.1.2 is current. Requires Node 22+. |
| FNDN-05 | Responsive layout system: mobile-first, works on all devices | Tailwind 4 default breakpoints: `sm:40rem`, `md:48rem`, `lg:64rem`, `xl:80rem`, `2xl:96rem`. Mobile-first by default. |
| FNDN-06 | Docker multi-stage build (Node build -> Nginx Alpine) producing < 50MB image | Official Astro Docker recipe: Node 22 build stage + `nginx:alpine` runtime. Typically 40-45MB. Gzip enabled in nginx.conf. |
| FNDN-07 | Kubernetes deployment manifests (Deployment, Service, Ingress) | Manifests go in `cnd-platform` repo per user decision. Website repo has only Dockerfile + nginx config. Basic auth via ingress annotation or middleware. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | 6.1.x | Framework | Latest stable, built-in Fonts API, Vite 7, Node 22+ |
| @astrojs/react | 5.x | React islands | Official integration, enables `client:load` / `client:visible` hydration |
| @tailwindcss/vite | 4.x | Tailwind CSS 4 via Vite plugin | CSS-native config with `@theme`, no JS config file needed |
| tailwindcss | 4.x | Utility-first CSS | `@theme` directive, OKLCH colors, CSS variables |
| react / react-dom | 19.x | Interactive components | shadcn/ui requires React; Astro 6 + @astrojs/react 5.x pairs with React 19 |
| shadcn/ui | latest CLI | Accessible component primitives | Tailwind v4 + React 19 support, OKLCH colors, `data-slot` pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tw-animate-css | latest | CSS animations for shadcn | Replaces deprecated `tailwindcss-animate`. Import in global.css. |
| tailwind-merge | latest | Merge Tailwind classes | Used internally by shadcn/ui `cn()` utility |
| clsx | latest | Conditional classnames | Used internally by shadcn/ui `cn()` utility |
| @radix-ui/* | latest | Headless UI primitives | Installed per-component by shadcn CLI |
| lucide-react | latest | Icons | Default icon set for shadcn/ui |
| prettier | latest | Code formatting | With `prettier-plugin-astro` and `prettier-plugin-tailwindcss` |
| prettier-plugin-astro | latest | Astro file formatting | Must be listed before tailwind plugin |
| prettier-plugin-tailwindcss | latest | Tailwind class sorting | Must be last in prettier plugins array |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Astro Fonts API | @fontsource-variable/dm-sans npm | Fontsource works but Astro 6 Fonts API is built-in, auto-optimizes fallbacks, and generates preload hints. Use the built-in API. |
| tw-animate-css | tailwindcss-animate | tailwindcss-animate is deprecated for Tailwind v4. Must use tw-animate-css. |
| pnpm | npm | pnpm is faster, uses less disk. User's STITCH_WORKFLOW.md already shows pnpm commands. |

**Installation:**
```bash
# Scaffold
pnpm create astro@latest cndfrance-website -- --template minimal --install --git

# Add integrations
pnpm astro add react
pnpm astro add tailwind

# Initialize shadcn/ui (creates components.json, global.css theme, cn utility)
pnpm dlx shadcn@latest init -t astro

# Add baseline components
pnpm dlx shadcn@latest add button card badge separator

# Dev tooling
pnpm add -D prettier prettier-plugin-astro prettier-plugin-tailwindcss
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── assets/              # Static assets (logos, images, fonts)
│   ├── logos/           # CND France logo, KCD logo
│   └── images/          # Event photos
├── components/          # Astro components
│   ├── ui/              # shadcn/ui components (auto-generated)
│   ├── layout/          # Header, Footer, Navigation
│   └── patterns/        # Geometric backgrounds, decorative elements
├── layouts/
│   └── Layout.astro     # Base layout with Font component, global CSS
├── lib/
│   └── utils.ts         # cn() utility from shadcn
├── pages/
│   └── index.astro      # Sample landing page
└── styles/
    └── global.css       # Tailwind import + @theme tokens + dark mode vars
nginx/
    └── nginx.conf       # Nginx configuration for static serving
Dockerfile               # Multi-stage build
.dockerignore            # Exclude node_modules, dist, .git
```

### Pattern 1: Astro 6 with Tailwind 4 (CSS-native config)
**What:** Tailwind 4 uses `@theme` directive in CSS instead of `tailwind.config.mjs`
**When to use:** All Tailwind theming in this project
**Example:**
```css
/* src/styles/global.css */
@import "tailwindcss";
@import "tw-animate-css";

/* Design tokens from DESIGN.md - dark theme as default */
:root {
  --background: oklch(0.145 0.015 285);
  --foreground: oklch(0.985 0.002 285);
  --primary: oklch(0.65 0.22 250);      /* derived from CND logo */
  --primary-foreground: oklch(0.985 0.002 285);
  --accent: oklch(0.75 0.18 45);         /* warm community accent */
  --accent-foreground: oklch(0.145 0.015 285);
  --card: oklch(0.185 0.015 285);
  --card-foreground: oklch(0.985 0.002 285);
  --muted: oklch(0.25 0.01 285);
  --muted-foreground: oklch(0.65 0.01 285);
  --border: oklch(0.3 0.01 285);
  --ring: oklch(0.65 0.22 250);
  --radius: 0.5rem;
  /* chart colors, sidebar colors, etc. */
}

/* @theme inline tells Tailwind to use these as utility classes
   without generating extra CSS custom properties */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --font-sans: var(--font-dm-sans);
}
```

### Pattern 2: Astro 6 Built-in Fonts API for DM Sans
**What:** Self-host DM Sans with automatic optimization via Astro config
**When to use:** Font registration (replaces manual Fontsource imports)
**Example:**
```javascript
// astro.config.mjs
import { defineConfig, fontProviders } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
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
```astro
<!-- src/layouts/Layout.astro -->
---
import { Font } from "astro:assets";
import "../styles/global.css";
---
<html lang="fr" class="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <Font cssVariable="--font-dm-sans" />
  </head>
  <body class="bg-background text-foreground font-sans antialiased">
    <slot />
  </body>
</html>
```

### Pattern 3: React Islands with Client Directives
**What:** React components hydrated selectively on the client
**When to use:** Interactive UI elements (navigation menus, countdown timers, schedule filters)
**Example:**
```astro
---
import { Button } from "@/components/ui/button";
import InteractiveNav from "@/components/layout/Navigation.tsx";
---
<!-- Static: renders to HTML only, no JS shipped -->
<Button>Static CTA</Button>

<!-- Interactive: hydrates immediately on page load -->
<InteractiveNav client:load />

<!-- Deferred: hydrates when visible in viewport -->
<HeavyComponent client:visible />
```

### Pattern 4: Docker Multi-Stage Build
**What:** Node 22 build stage + nginx:alpine runtime
**When to use:** Production container image
**Example:**
```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM nginx:alpine AS runtime
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
```

### Anti-Patterns to Avoid
- **Do NOT create `tailwind.config.mjs`:** Tailwind 4 uses CSS `@theme` directive. A JS config file is the v3 pattern and will conflict.
- **Do NOT use `@astrojs/tailwind` integration:** That is the legacy Tailwind 3 integration. Tailwind 4 uses `@tailwindcss/vite` as a Vite plugin.
- **Do NOT use `tailwindcss-animate`:** Deprecated for Tailwind v4. Use `tw-animate-css` instead.
- **Do NOT use `@layer base` for CSS variables:** In Tailwind v4, move `:root` / `.dark` variables out of `@layer base`.
- **Do NOT use `hsl()` wrapper in @theme:** shadcn/ui v4 pattern stores full color values in `:root` variables and references them without wrapping in `@theme inline`.
- **Do NOT put K8s manifests in the website repo:** Per user decision, manifests go in `cnd-platform` repo.
- **Do NOT use `React.forwardRef`:** shadcn/ui with React 19 uses `React.ComponentProps` pattern with `data-slot` attributes instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Font loading & optimization | Custom @font-face + preload | Astro 6 Fonts API | Auto-generates fallbacks, preload hints, caches fonts locally |
| Component primitives | Custom buttons, cards, badges | shadcn/ui CLI components | Accessible, tested, Tailwind-themed, can be customized after install |
| CSS class merging | String concatenation | `cn()` utility (clsx + tailwind-merge) | Handles Tailwind class conflicts correctly |
| Dark mode toggle | Custom localStorage script | Tailwind `dark:` variant + class strategy | Built into Tailwind, shadcn/ui uses `.dark` class on root |
| Animations | Custom CSS keyframes | tw-animate-css | Integrates with Tailwind utilities, used by shadcn components |
| Docker layer caching | Manual cache management | Multi-stage build with separate COPY for package files | Standard Docker pattern, pnpm install cached when only source changes |

**Key insight:** shadcn/ui is not a component library you install -- it copies component source code into your project. This means you own the code and can customize freely, but you also need to manage updates manually via `shadcn add --overwrite`.

## Common Pitfalls

### Pitfall 1: Tailwind 4 Config Confusion
**What goes wrong:** Creating `tailwind.config.mjs` or using `@astrojs/tailwind` integration
**Why it happens:** Most tutorials and AI training data reference Tailwind v3 patterns
**How to avoid:** Use `@tailwindcss/vite` plugin in `astro.config.mjs` vite config. Define all theme values in CSS via `@theme` directive. No JS config file.
**Warning signs:** Seeing `content: [...]` configuration, `theme: { extend: {} }`, or `module.exports`

### Pitfall 2: Node.js Version in Docker
**What goes wrong:** Using `node:20` or `node:lts` (which may resolve to Node 20) in Dockerfile
**Why it happens:** Astro 6 requires Node 22+ but many Docker tutorials use `node:lts`
**How to avoid:** Explicitly use `node:22-alpine` in the build stage. Add `.node-version` or `engines` field in package.json.
**Warning signs:** Build failures with syntax errors or missing APIs

### Pitfall 3: shadcn/ui React Components in Astro Pages
**What goes wrong:** Using shadcn React components without `client:*` directive, getting static HTML with no interactivity
**Why it happens:** Astro strips all client JS by default -- React components render as static HTML
**How to avoid:** Use `client:load` for immediately interactive components. For purely visual components (badges, cards), static rendering is fine and preferred.
**Warning signs:** Buttons that don't respond to clicks, dropdowns that don't open

### Pitfall 4: CSS Variable Naming Mismatch
**What goes wrong:** shadcn/ui components reference CSS variables like `--background` but Tailwind utilities expect `--color-background`
**Why it happens:** The `@theme inline` directive maps `--color-X` to Tailwind utility `bg-X`, but shadcn components may reference raw `--background`
**How to avoid:** Follow the exact shadcn/ui Tailwind v4 pattern: define values in `:root` as `--background`, then map in `@theme inline` as `--color-background: var(--background)`.
**Warning signs:** Colors not applying, components rendering with wrong colors

### Pitfall 5: Docker Image Size Exceeding 50MB
**What goes wrong:** Image size balloons past target
**Why it happens:** Including dev dependencies, node_modules, or source files in the final stage
**How to avoid:** Ensure `.dockerignore` excludes `node_modules`, `dist`, `.git`. Only copy `dist/` folder and `nginx.conf` to runtime stage. Use `--frozen-lockfile` to avoid generating new lockfile artifacts.
**Warning signs:** `docker images` showing size > 50MB. Run `docker history <image>` to find large layers.

### Pitfall 6: Stitch Design Gate Bypassed
**What goes wrong:** Jumping into code implementation before visual identity is approved
**Why it happens:** Eagerness to build; design step feels like overhead
**How to avoid:** This phase has a formal design gate. DESIGN.md must be approved before wiring tokens into code. Scaffolding can happen in parallel, but theme tokens must wait for approved DESIGN.md.
**Warning signs:** Placeholder colors/fonts in code, DESIGN.md not committed

## Code Examples

### shadcn/ui Button with Astro (static rendering, no client JS)
```astro
---
import { Button } from "@/components/ui/button";
---
<!-- This renders as static HTML -- perfect for CTAs that are just links -->
<a href="https://tickets.cloudnativedays.fr">
  <Button size="lg" class="bg-primary text-primary-foreground">
    Get Your Ticket
  </Button>
</a>
```

### Nginx Configuration for Static Astro Site
```nginx
worker_processes auto;

events {
  worker_connections 1024;
}

http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;
  sendfile on;

  server {
    listen 8080;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_min_length 1000;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css application/json application/javascript
               application/x-javascript text/xml application/xml
               application/xml+rss text/javascript image/svg+xml;

    # Cache static assets aggressively
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
      expires 1y;
      add_header Cache-Control "public, immutable";
    }

    # SPA-style fallback for clean URLs
    location / {
      try_files $uri $uri/index.html =404;
    }

    # Custom 404 page
    error_page 404 /404.html;
    location = /404.html {
      root /usr/share/nginx/html;
      internal;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  }
}
```

### GitHub Actions Workflow Pattern (from reference repo)
```yaml
# Pattern based on Smana/cloud-native-ref workflow
# Key elements to replicate:
# - Trigger on push to main (path filter on Dockerfile changes)
# - Docker Buildx for multi-platform (linux/amd64, linux/arm64)
# - GHCR authentication with GITHUB_TOKEN
# - Layer caching with type=gha
# - Tagging: latest + git SHA + semver if tagged
# - Trivy security scanning post-build
```

### tsconfig.json for Astro + React + shadcn/ui
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.mjs` (JS) | `@theme` directive in CSS | Tailwind CSS 4 (Jan 2025) | No JS config file. All theming in CSS. |
| `@astrojs/tailwind` integration | `@tailwindcss/vite` Vite plugin | Astro 5.2+ / Tailwind 4 | Remove old integration, add Vite plugin |
| `tailwindcss-animate` | `tw-animate-css` | March 2025 | Drop-in replacement, CSS import instead of plugin |
| `React.forwardRef` pattern | `React.ComponentProps` + `data-slot` | shadcn/ui + React 19 | Simpler component code, no forwardRef boilerplate |
| HSL color values | OKLCH color values | shadcn/ui + Tailwind v4 | Better perceptual uniformity, wider gamut |
| `@fontsource/dm-sans` npm package | Astro 6 built-in Fonts API | Astro 6 (March 2026) | Unified config, auto-optimization, preload hints |
| `@layer base { :root { ... } }` | `:root { ... }` outside layers | Tailwind v4 | Cascade layers mean `@layer base` is always lower specificity |
| Node 18/20 in Docker | Node 22+ required | Astro 6 (March 2026) | Update Docker base images |

**Deprecated/outdated:**
- `@astrojs/tailwind`: Legacy integration for Tailwind 3 only. Use `@tailwindcss/vite` for v4.
- `tailwindcss-animate`: Replaced by `tw-animate-css` for Tailwind v4.
- `React.forwardRef`: No longer needed with React 19; shadcn/ui uses direct `ComponentProps`.
- `Astro.glob()`: Removed in Astro 6; use content collections or `import.meta.glob()`.

## Open Questions

1. **Logo file availability**
   - What we know: User will provide the CND France logo for color extraction
   - What's unclear: Format (SVG/PNG), exact colors in the logo
   - Recommendation: Proceed with scaffolding; design tokens are filled in after Stitch design gate. Use placeholder colors in initial setup, clearly marked as `/* TODO: replace with logo-derived colors */`.

2. **K8s manifests scope**
   - What we know: Manifests go in `cnd-platform` repo, not the website repo. Flux CD manages deployment.
   - What's unclear: Whether success criteria item 5 ("K8s manifests exist for Deployment/Service/Ingress") means we create them in the platform repo or just document what's needed.
   - Recommendation: Create a `k8s/` directory with reference manifests and a README explaining they should be placed in `cnd-platform`. This satisfies the success criteria while respecting the GitOps boundary.

3. **Basic auth mechanism**
   - What we know: Site needs basic auth protection until public announcement
   - What's unclear: Whether to use nginx basic_auth in the container or K8s ingress annotation
   - Recommendation: Use nginx `auth_basic` directive in the container's nginx.conf, controlled by an environment variable or mounted secret. This keeps the auth self-contained. Alternative: NGINX ingress `nginx.ingress.kubernetes.io/auth-type: basic` annotation in the platform repo.

4. **Google Stitch MCP integration timing**
   - What we know: Stitch MCP is configured, tools are available
   - What's unclear: Whether user wants Claude to drive Stitch directly or prefers to create designs manually and export DESIGN.md
   - Recommendation: Plan for both paths. Tasks should support: (a) Claude using Stitch MCP tools to create/iterate design system, or (b) user providing an exported DESIGN.md manually.

## Sources

### Primary (HIGH confidence)
- Astro Docs (https://docs.astro.build) - Astro 6.1.2 version, Fonts API, React integration, Docker recipe, Tailwind 4 setup
- Tailwind CSS Docs (https://tailwindcss.com/docs/theme) - `@theme` directive, CSS variables, default theme values
- shadcn/ui Docs (https://ui.shadcn.com/docs/installation/astro) - Astro installation, Tailwind v4 migration guide
- shadcn/ui Tailwind v4 guide (https://ui.shadcn.com/docs/tailwind-v4) - CSS variable pattern, tw-animate-css, OKLCH colors
- Context7 `/tailwindlabs/tailwindcss.com` - Theme variable definitions, @theme examples
- Context7 `/withastro/docs` - React integration, islands architecture, client directives

### Secondary (MEDIUM confidence)
- Astro 6 release blog (https://astro.build/blog/astro-6/) - Breaking changes, new features confirmed
- Smana/cloud-native-ref workflow (GitHub) - CI pattern for container image builds, GHCR push, Trivy scanning

### Tertiary (LOW confidence)
- None -- all findings verified with primary or secondary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All versions verified against official docs, Astro 6.1.2 confirmed current
- Architecture: HIGH - Patterns from official Astro, Tailwind, and shadcn docs
- Pitfalls: HIGH - Based on documented breaking changes between Tailwind v3->v4, Astro 5->6
- Docker/K8s: HIGH - Official Astro Docker recipe + reference workflow from user's own repos

**Research date:** 2026-04-11
**Valid until:** 2026-05-11 (stable stack, monthly check recommended)
