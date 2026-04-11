# Cloud Native Days France - Website Creation with Google Stitch + Claude Code

## Overview

This document describes the design-to-code workflow using **Google Stitch** (AI design platform) and **Claude Code** (AI coding agent) connected via **MCP** (Model Context Protocol). The process is based on the workflow popularized in recent tutorials and adapted for the Cloud Native Days France conference website.

---

## The Workflow: Step by Step

### Phase 1: Setup

#### 1a. Prerequisites

- **Node.js** >= 22.13.0 (we used mise: `mise install node@22.13.0 && mise use node@22.13.0`)
- **gcloud CLI** installed and authenticated

#### 1b. Google Cloud Authentication

**Important**: If you have a service account active, you must switch to a personal account
that has Owner/Editor role on the GCP project. Service accounts cannot enable APIs.

```bash
# Check current accounts
gcloud auth list

# Login with your personal Google account (opens browser)
gcloud auth login smaine.kahlouch@gmail.com

# Set the active account (if not already active)
gcloud config set account smaine.kahlouch@gmail.com

# Set up Application Default Credentials (opens browser)
gcloud auth application-default login

# Set the active GCP project
gcloud config set project cloud-native-computing-paris
```

#### 1c. Enable the Stitch API

The Stitch API must be enabled on the GCP project. This requires the Service Usage API first:

```bash
# Enable Service Usage API (required to enable other APIs)
gcloud services enable serviceusage.googleapis.com --project=cloud-native-computing-paris

# Enable the Stitch API
gcloud beta services enable stitch.googleapis.com --project=cloud-native-computing-paris
```

**Gotcha**: If you get a PERMISSION_DENIED error, make sure you're using your personal
account (not a service account) -- check with `gcloud auth list`.

#### 1d. Configure Stitch MCP

The `npx @_davideast/stitch-mcp init` wizard can hang after the auth method selection.
If it does, Ctrl+C and configure manually:

```bash
# 1. Verify setup health (all checks should pass)
npx @_davideast/stitch-mcp doctor

# 2. Register the MCP server with Claude Code
claude mcp add stitch -- npx @_davideast/stitch-mcp proxy
```

Doctor output should show all green checks:
```
✔ Google Cloud CLI: Installed (system)
✔ User Authentication: Authenticated: smaine.kahlouch@gmail.com
✔ Application Credentials: Present
✔ ADC Quota Project: Skipped (no ADC file)
✔ Active Project: Set: cloud-native-computing-paris
✔ Stitch API: Healthy (200)
```

#### 1e. Install Other MCP Servers

```bash
# Browser preview and UI verification
claude mcp add playwright -- npx @playwright/mcp@latest

# shadcn/ui component library
claude mcp add --transport http shadcn https://www.shadcn.io/api/mcp

# Tailwind CSS docs and utilities
claude mcp add tailwindcss-mcp-server -- npx -y tailwindcss-mcp-server

# Performance, SEO, and accessibility audits
claude mcp add lighthouse -- npx -y lighthouse-mcp

# Astro framework documentation
claude mcp add --transport http astro-docs https://mcp.docs.astro.build/mcp

# AI component generation (requires API key from https://21st.dev/magic/console)
claude mcp add magic --env API_KEY="YOUR_KEY" -- npx -y @21st-dev/magic@latest
```

Already available (pre-configured):
- **Context7** -- library documentation (React, Tailwind, Astro, etc.)

#### 1e. Open Google Stitch

2. **Open Google Stitch** at [stitch.withgoogle.com](https://stitch.withgoogle.com)
   - Switch from **App mode** to **Web mode** using the bottom toolbar (unlocks web-specific prompts and higher-tier model access)
   - Select the highest Pro-tier Gemini model available in the dropdown for complex creative work

### Phase 2: Inspiration & Reference Gathering

3. **Source design inspiration** from curated sites:
   - [Godly.website](https://godly.website) -- full-page web compositions, curated design excellence
   - [Dribbble](https://dribbble.com) -- search "conference landing page", "tech event website"
   - [Pinterest](https://pinterest.com) -- search "landing page", "web UI", "tech conference design"
   - Browse competitor/peer conference websites (see [Inspiration Sites](#inspiration-sites) below)

4. **Screenshot your favorite layouts** -- a concrete visual reference does more than any amount of descriptive text

5. **Upload the reference** to Stitch via the chat upload icon, or paste a live website URL directly

### Phase 3: Prompt & Generate the Design

6. **Write a tight brief** combining your reference with specifics:
   > "Create a landing page for Cloud Native Days France, a cloud-native tech conference. Use the style from the attached screenshot. I want a bold hero section with the event date, a speakers grid, a schedule overview, a partners/sponsors section, and a footer with social links. The aesthetic should be modern, technical, and energetic."

7. **Generate the design** -- Stitch produces a complete canvas with layout, typography, colors, and component structure in ~15 seconds

### Phase 4: Design System Customization

8. **Open the Design System panel** (right side) -- Stitch auto-generates a theme with:
   - Seed color and full palette
   - Typography scale (font families, weights, sizes H1-H6)
   - Spacing system
   - Corner radius and component rules

9. **Customize the theme** without writing CSS:
   - Click the theme name to adjust seed color
   - Toggle Light/Dark mode
   - Override fonts (e.g., switch to DM Sans to match the existing CND brand)
   - Adjust the color palette to match conference branding

10. **Review the DESIGN.md artifact** -- a structured markdown file that captures every design decision:
    - Color strategy (primary, secondary, accent, semantic colors)
    - Typography rationale (font families, type scale, line heights)
    - Spacing scale (base units, named values: xs, sm, md, lg, xl)
    - Layout constraints (container widths, grid, responsive breakpoints)
    - Component patterns (buttons, cards, navigation states)
    - Visual effects (border radius, shadows)

### Phase 5: Iterate & Explore Variants

11. **Generate variants**: Right-click any frame > Variants > set count to 3, push the Creative Range slider, choose which dimensions to mutate (layout, color, images, typography)

12. **Regenerate specific sections**: Right-click individual components and choose "Regenerate" for fresh iterations

13. **Edit in-place**: Use the pencil icon to click into components. Activate **Live Mode** to provide real-time spoken or typed feedback to refine the design

### Phase 6: Export to Claude Code

Two paths available:

#### Option A: MCP Live Connection (Recommended)
- With the Stitch MCP server running, ask Claude Code:
  > "Connect to my Stitch project and implement the landing page design"
- Claude Code fetches design data automatically through the MCP proxy
- Three MCP tools are exposed:
  - `build_site` -- maps screens to routes, returns design HTML
  - `get_screen_code` -- retrieves screen HTML content
  - `get_screen_image` -- downloads screenshot as base64

#### Option B: DESIGN.md + Code Export (Manual but reliable)
- Export DESIGN.md from Stitch and save it to the project root
- Click a frame > More > Export > Code to Clipboard
- Paste the exported code into Claude Code with build instructions

### Phase 7: Build with Claude Code

14. **Provide Claude Code the design context**:
    - The DESIGN.md file is read automatically if placed at the project root
    - Add instructions in CLAUDE.md to always reference DESIGN.md for UI generation

15. **Generate the full site**:
    > "Build this as a responsive website using [framework]. Follow the design system in DESIGN.md strictly. Use only the colors, fonts, and spacing values defined there."

16. **Integrate UI component libraries** if needed (e.g., 21st.dev for polished primitives)

17. **Iterate** by reviewing against the Stitch design and providing refinements

### Phase 8: Deploy

18. Build a Docker image and deploy to a **Kubernetes cluster** (self-hosted)
    - Astro builds to static files or SSR with a Node adapter
    - For static: use an nginx container serving the `dist/` folder
    - For SSR: use `@astrojs/node` adapter with a Node.js container
    - Create k8s manifests (Deployment, Service, Ingress) or use Helm

---

## Inspiration Sites

Conference websites to draw design ideas from:

### Primary Inspiration

| Site | Why | Design Notes |
|------|-----|-------------|
| [KubeCon + CloudNativeCon Europe](https://events.linuxfoundation.org/kubecon-cloudnativecon-europe/) | Premier cloud-native event, professional authority | Blue palette, modular type scale, mega-menu navigation, hero banner with gradient overlays, sponsor grid layouts |
| [Cloud Native Rejekts](https://cloud-native.rejekts.io/) | Community-driven, playful yet technical | Single-page vertical design, countdown timer, bold taglines, decorative dots/x elements, high contrast palette |
| [DevOpsCon](https://devopscon.io/) | Multi-city tech conference, energetic brand | Red-orange accent (#d74117), deep navy backgrounds, card-based layouts, sticky CTAs, slide-in animations |

### Additional Inspiration Sources

| Site | Category |
|------|----------|
| [Devoxx](https://devoxx.com) | Developer conference, bold and colorful |
| [Web Summit](https://websummit.com) | Large-scale event, sleek and minimal |
| [GitHub Universe](https://githubuniverse.com) | Tech event, dark theme with vibrant accents |
| [Godly.website](https://godly.website) | Curated web design gallery |
| [Dribbble "conference website"](https://dribbble.com/search/conference-website) | Community design showcase |

---

## Design System Foundations for Cloud Native Days France

### Existing Brand Elements (from current site)

- **Font**: DM Sans (weights 300-700)
- **Navigation**: mix-blend-mode difference effect on links
- **Branding**: CND France logo + KCD affiliation logo
- **Layout**: Multi-section responsive design with geometric shapes
- **Social**: LinkedIn, YouTube, Bluesky, X (Twitter)

### Proposed Design Direction

| Token | Value | Rationale |
|-------|-------|-----------|
| **Primary font** | DM Sans | Keep brand continuity |
| **Display font** | Consider Space Grotesk or Inter | Modern geometric sans-serif pairs well with DM Sans |
| **Primary color** | TBD in Stitch | Should evoke cloud/tech (blues, teals) or French identity |
| **Accent color** | TBD in Stitch | High-energy contrast for CTAs and highlights |
| **Background** | Dark theme preferred | Aligns with tech/developer aesthetic, makes colors pop |
| **Geometric elements** | Keep from current site | Abstract shapes reinforce cloud-native / infrastructure theme |
| **Layout** | Single-page with anchor nav | Conference sites benefit from scrollable overview + detail pages |

### Sections to Design

1. **Hero** -- Event name, date, location, CTA (register / CFP), animated or geometric background
2. **About / Highlights** -- Key numbers (1700+ attendees, 50+ talks, 40+ partners), event tagline
3. **Speakers** -- Grid of featured speakers with photo, name, company, talk title
4. **Schedule / Program** -- Track-based or timeline view of the conference day
5. **Partners / Sponsors** -- Tiered grid (Platinum, Gold, Silver, Community)
6. **Venue** -- CENTQUATRE-PARIS location, map embed, how to get there
7. **Previous Edition** -- Video recap, photo gallery link, testimonials
8. **Footer** -- Social links, association info, legal links (privacy, CoC, terms)

---

## Key Stitch Commands Reference

| Command | Purpose |
|---------|---------|
| `npx @_davideast/stitch-mcp init` | Configure auth, gcloud, and MCP settings |
| `npx @_davideast/stitch-mcp proxy` | Run MCP proxy server for Claude Code |
| `npx @_davideast/stitch-mcp serve -p <id>` | Local dev server for design previews |
| `npx @_davideast/stitch-mcp site -p <id>` | Generate an Astro project from screens |
| `npx @_davideast/stitch-mcp screens -p <id>` | List and browse project screens |
| `npx @_davideast/stitch-mcp doctor` | Diagnose configuration issues |

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Framework** | Astro | Content-heavy site, zero JS by default, 99.2 Lighthouse score |
| **Interactive islands** | React | Only for interactive components (schedule filter, search) |
| **Styling** | Tailwind CSS 4 | Utility-first, pairs with shadcn/ui |
| **Components** | shadcn/ui | Accessible, production-ready React + Tailwind primitives |
| **Design** | Google Stitch | AI design generation, DESIGN.md export |
| **Deployment** | Kubernetes (self-hosted) | Dockerized Astro build on user's own cluster |

## Next Steps

1. ~~Set up Stitch MCP in Claude Code~~ (done -- manual config)
2. ~~Install supporting MCP servers~~ (done -- playwright, shadcn, tailwind, lighthouse, astro-docs)
3. **Get 21st.dev Magic API key** and install the MCP server
4. **Finalize Stitch MCP** -- verify doctor shows all green
5. **Browse inspiration sites** and screenshot 2-3 layouts that feel right
6. **Open Stitch in Web mode** and upload references with a tailored prompt
7. **Iterate on the design** using variants and live editing
8. **Export DESIGN.md** and review the design system tokens
9. **Initialize the project** with GSD for structured planning
10. **Build with Claude Code** using MCP connection or manual export
11. **Containerize and deploy** to Kubernetes
