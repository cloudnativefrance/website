# Project Research Summary

**Project:** Cloud Native Days France Website
**Domain:** Community-driven tech conference website (single-day, 1700+ attendees, bilingual FR/EN)
**Researched:** 2026-04-11
**Confidence:** HIGH

## Executive Summary

Cloud Native Days France needs a static, bilingual conference website built with Astro 6, React islands for interactivity, Tailwind CSS 4, and shadcn/ui components, served from Nginx on Kubernetes. This is a well-understood domain with mature tooling. The recommended approach is a zero-JS-by-default static site where React only loads for interactive features (schedule filtering, mobile nav). Content lives in Markdown/YAML files validated by Zod schemas at build time, with no CMS, no database, and no server-side runtime. The final Docker image is under 50MB.

The stack is high-confidence and current: Astro 6 (released March 2026) with its Content Layer API, Tailwind CSS 4 via the Vite plugin, and Paraglide JS 2 for type-safe UI translations. The architecture cleanly separates build-time content resolution from client-side interactivity through Astro's islands pattern. Every external service (CFP via Conference Hall, feedback via Open Feedback, ticketing via external platform) is integrated through links, not reimplemented.

The primary risks are: (1) React context isolation between Astro islands breaking shadcn/ui components that share state, (2) bilingual content drift where FR and EN translations fall out of sync before the conference, (3) a schedule data model too rigid for the last-minute changes that always happen at conferences, and (4) Tailwind v4 class name incompatibilities with v3-era code snippets and design exports. All four are preventable with upfront architectural decisions in Phase 1.

## Key Findings

### Recommended Stack

Astro 6 is the clear choice for a greenfield static conference site. It ships zero JavaScript by default, has built-in i18n routing, and its Content Layer API with Zod 4 validation provides type-safe content collections. React 19 is used exclusively for interactive islands (schedule filter, mobile nav), keeping most pages JS-free. Tailwind CSS 4 uses the new `@tailwindcss/vite` plugin (the `@astrojs/tailwind` integration is deprecated). shadcn/ui provides accessible, Tailwind-native React components.

**Core technologies:**
- **Astro 6.1.x:** Static site generator with i18n routing, Content Layer API, zero JS by default. Requires Node 22.12+.
- **React 19 + @astrojs/react 5:** Islands-only interactivity. shadcn/ui requires React.
- **Tailwind CSS 4 via @tailwindcss/vite:** CSS-first config, utility-first styling. Not the deprecated @astrojs/tailwind.
- **shadcn/ui (CLI v4):** Accessible component primitives. Must live inside React islands, never called directly in .astro files.
- **Paraglide JS 2.15.x:** Type-safe, tree-shakable UI string translations. Build fails on missing keys.
- **Nginx (Alpine):** Serves static files in production. Multi-stage Docker build, ~30-50MB final image.
- **pnpm 9:** Fast, strict package manager. Biome for linting/formatting.

### Expected Features

**Must have (table stakes):**
- Hero section with event name, date, venue, countdown, and ticket CTA
- Schedule page with track/tag filtering (single-day, multi-track timeline)
- Speaker profiles (grid + individual pages with bio, photo, social, talks)
- Sponsor/partner showcase with tiered layout (Platinum/Gold/Silver/Community)
- Venue page with map, transport, accessibility info
- Bilingual FR/EN support with language toggle
- Code of Conduct, legal/privacy pages
- Responsive mobile-first design
- Social links and newsletter signup

**Should have (differentiators):**
- Bookmarkable talks with localStorage personal agenda (no login needed)
- iCal export of personal agenda
- Visual timeline/swimlane view for parallel tracks (React island)
- Post-event replay mode (countdown becomes "watch replays", YouTube links per talk)
- Team page with roles and grouping
- Previous edition section (key numbers, video recap)
- Open Feedback deep links per talk

**Defer indefinitely (anti-features):**
- Built-in CFP system (use Conference Hall)
- Built-in feedback system (use Open Feedback)
- User accounts/authentication
- Ticket sales/payment processing
- CMS integration
- Mobile app / PWA
- Blog / news section
- Search functionality (50 talks fit on one page, filtering suffices)

### Architecture Approach

Static-first Astro site with React islands, built at deploy time into pure HTML/CSS/JS, served from Nginx in a Kubernetes pod. Content collections (Markdown for speakers/talks, YAML for sponsors/schedule/team) are validated by Zod schemas and resolved at build time. Data flows one-way: content files through Zod validation, into Astro pages via `getCollection()`, pre-shaped and passed as serializable props to React islands. Two-level layout hierarchy (BaseLayout for HTML shell, PageLayout for nav/footer/main). i18n uses folder-based routing (pages in `src/pages/` for FR, `src/pages/en/` for EN) plus locale-filtered content queries.

**Major components:**
1. **Content Collections** -- Schema-validated speakers, talks, sponsors, schedule, team data
2. **Astro Pages + Layouts** -- Route generation, i18n routing, static HTML output with shared layout chain
3. **Static Astro Components** -- Speaker cards, sponsor grids, hero, footer (zero JS)
4. **React Islands** -- Schedule filter and mobile nav only, hydrated via `client:visible`/`client:load`
5. **Build Pipeline** -- Multi-stage Docker: Node 22 builds, Nginx Alpine serves, deployed to K8s

### Critical Pitfalls

1. **React context isolation between islands** -- Each Astro island is an independent React root. shadcn/ui components sharing context (ThemeProvider, dialogs, dropdowns) must be composed inside a single .tsx wrapper, never split across islands. The schedule filter+list+detail must be ONE island. Establish this rule in Phase 1.

2. **Bilingual content drift** -- No build-time check ensures every FR file has an EN counterpart. Use shared YAML for structured data (both languages in one file) and build a CI validation script that diffs slug lists across locale directories. Add `translationComplete` frontmatter field for graceful degradation.

3. **Schedule data model too rigid** -- Design schedule as relational YAML with ID-based cross-references (separate files for speakers, talks, rooms, time slots). Build a validation script for reference integrity. Ensure build+deploy under 3 minutes for emergency updates during conference week.

4. **Tailwind v4 class name incompatibilities** -- ~40% of utility classes were renamed from v3. shadcn/ui CLI v4 supports v4, but community snippets and design exports may use v3 classes. Run `npx @tailwindcss/upgrade` on all imported code. Add CI grep check for deprecated class names.

5. **Over-hydration** -- Default to .astro for everything. React only for schedule filter, mobile nav, and forms with validation. If JS bundle exceeds 100KB on a content page, something is wrong.

## Implications for Roadmap

### Phase 1: Foundation and Design System
**Rationale:** Everything depends on project scaffolding, Tailwind/shadcn configuration, i18n setup, content schemas, and the Docker pipeline. Getting these wrong means rework in every subsequent phase.
**Delivers:** Working Astro 6 project with Tailwind 4, React integration, i18n routing, content collection schemas, BaseLayout/PageLayout, Docker multi-stage build, Nginx config, and design tokens from DESIGN.md.
**Addresses:** Project scaffolding, responsive layout foundation, bilingual routing structure.
**Avoids:** Pitfalls #1 (establish island rules), #4 (validate Tailwind v4 config), #7 (Docker layer caching from day one), #10 (flexible content schemas).

### Phase 2: Static Content Pages
**Rationale:** Depends on Phase 1 schemas and layouts. All static pages can be built in parallel since they share the same layout chain and content query patterns. This is the bulk of the site.
**Delivers:** Homepage with hero/CTA/countdown, speaker grid and individual pages, sponsor tier showcase, venue page, Code of Conduct, legal pages, team page, header/footer/language switcher, previous edition section.
**Addresses:** All table stakes features except schedule interactivity. Team page and previous edition (differentiators).
**Avoids:** Pitfalls #2 (content parity validation in CI), #5 (all components are .astro, no React yet), #6 (SEO component on all pages from the start), #11 (test language switcher on every page type).

### Phase 3: Interactive Schedule
**Rationale:** Depends on Phase 2 content (talks, speakers must exist). The schedule is the most complex feature -- a React island with filtering, bookmarking, and timeline view. Deserves its own phase.
**Delivers:** Schedule page with track/tag filtering, visual timeline view with parallel tracks, talk bookmarking (localStorage), iCal export of personal agenda, Open Feedback deep links per talk.
**Addresses:** Schedule table stake + all schedule differentiators (bookmarks, iCal, timeline).
**Avoids:** Pitfalls #1 (single island for entire schedule), #3 (relational data model with validation), #12 (explicit timezone labels, ISO 8601 storage).

### Phase 4: Event Lifecycle and Polish
**Rationale:** Post-event features, SEO validation, performance tuning, and accessibility audit. These are finishing touches that depend on all content and interactive features being in place.
**Delivers:** Post-event replay mode (YouTube links per talk, countdown toggle), Conference Hall CFP status indicator, JSON-LD structured data (Event schema), Open Graph images, Lighthouse performance audit, accessibility audit, 404 pages.
**Addresses:** Post-event replay mode, CFP integration (differentiators). SEO and performance polish.
**Avoids:** Pitfall #8 (full route testing with curl after deploy), #6 (final hreflang/canonical validation).

### Phase Ordering Rationale

- Phase 1 before everything: Content schemas, i18n routing, and the island isolation rule are load-bearing architectural decisions. Every subsequent phase depends on them.
- Phase 2 before Phase 3: The schedule React island needs talk and speaker content to exist. Building static pages first also validates the content model before adding interactivity.
- Phase 3 isolated: The schedule is the highest-complexity, highest-risk feature. It combines React islands, client-side state (bookmarks), iCal generation, and cross-referenced data. Isolating it reduces blast radius.
- Phase 4 last: Post-event mode and polish require the complete site. SEO and performance auditing is meaningless on an incomplete site.
- CI/CD parallel with Phase 1: The Docker pipeline should be functional from Phase 1 so every subsequent phase can be deployed and tested.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Interactive Schedule):** The schedule timeline view, bookmark persistence, and iCal export involve client-side state management across a single complex React island. Research the `ics` library API and `nanostores` for potential cross-island state if bookmarks need to appear in the header.

Phases with standard patterns (skip deeper research):
- **Phase 1 (Foundation):** All tooling is well-documented with official guides. Astro 6, Tailwind 4, Docker multi-stage builds are established patterns.
- **Phase 2 (Static Content Pages):** Standard Astro content collections + static components. No novel patterns.
- **Phase 4 (Event Lifecycle):** Post-event toggle is a content flag. SEO and performance are standard checklists.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies are current stable releases with official documentation. Astro 6, React 19, Tailwind 4, shadcn/ui CLI v4 all released and documented. |
| Features | HIGH | Based on analysis of 6+ comparable conferences (KubeCon, Devoxx, Rejekts, Bergen, Web Summit). Table stakes are unambiguous. |
| Architecture | HIGH | Astro islands + static build + Nginx is a well-documented, battle-tested pattern. Content collections with Zod validation are first-party Astro features. |
| Pitfalls | HIGH | All critical pitfalls are verified via official docs, GitHub discussions, or well-documented patterns in multilingual static sites. |

**Overall confidence:** HIGH

### Gaps to Address

- **Paraglide JS 2 with Astro 6:** Confidence is MEDIUM. The integration works but is less battle-tested than the rest of the stack. If issues arise, fallback to a manual TypeScript dictionary (`src/i18n/ui.ts`) is straightforward and documented in the architecture research.
- **Google Stitch design export quality:** Confidence is MEDIUM. Stitch is experimental. Plan to use its output as visual reference and design token source only, not production code.
- **Conference Hall / Open Feedback deep link formats:** Need to verify exact URL patterns for per-talk deep linking during Phase 3 planning. These are external services with their own URL schemes.
- **Schedule data import:** If organizers use a CFP tool (Conference Hall, Sessionize) that can export structured data, a one-time import script could save significant manual YAML authoring. Worth investigating during Phase 3 planning.

## Sources

### Primary (HIGH confidence)
- [Astro 6 stable release](https://astro.build/blog/astro-6/) -- Framework choice, Content Layer API, Node 22 requirement
- [Astro i18n Routing docs](https://docs.astro.build/en/guides/internationalization/) -- Locale routing, prefixDefaultLocale
- [Astro Content Collections docs](https://docs.astro.build/en/guides/content-collections/) -- Schema design, glob loader
- [Astro Islands Architecture](https://docs.astro.build/en/concepts/islands/) -- Hydration directives, island isolation
- [Astro Docker Recipe](https://docs.astro.build/en/recipes/docker/) -- Multi-stage build pattern
- [Tailwind CSS 4 Astro guide](https://tailwindcss.com/docs/installation/framework-guides/astro) -- @tailwindcss/vite setup
- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide) -- Class name renames
- [shadcn/ui Astro Installation](https://ui.shadcn.com/docs/installation/astro) -- CLI v4, React islands caveat
- [ics npm](https://www.npmjs.com/package/ics) -- iCal generation

### Secondary (MEDIUM confidence)
- [Paraglide JS Astro guide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/astro) -- V2 integration
- [shadcn/ui React Context in Astro Discussion](https://github.com/shadcn-ui/ui/discussions/3740) -- Island isolation confirmation
- [Building a Bilingual Site with Astro](https://tobias-schaefer.com/blog/astro-bilingual-workflow/) -- Content duplication patterns
- [Google Stitch Complete Guide](https://www.nxcode.io/resources/news/google-stitch-complete-guide-vibe-design-2026) -- Design export limitations

### Tertiary (LOW confidence)
- [Managing Last-Minute Session Changes](https://www.ctimeetingtech.com/how-to-manage-last-minute-session-changes-event-software/) -- Conference operations insight (not tech-specific)

---
*Research completed: 2026-04-11*
*Ready for roadmap: yes*
