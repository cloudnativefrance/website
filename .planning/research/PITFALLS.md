# Domain Pitfalls

**Domain:** Conference website (Cloud Native Days France)
**Stack:** Astro + React islands + Tailwind CSS 4 + shadcn/ui + i18n + Content Collections + Docker/K8s
**Researched:** 2026-04-11

## Critical Pitfalls

Mistakes that cause rewrites, launch delays, or major rework.

### Pitfall 1: React Context Not Shared Between Astro Islands

**What goes wrong:** shadcn/ui components that depend on React context (ThemeProvider, dropdown menus, dialogs, toast notifications) break silently when placed in separate Astro islands. Each `<astro-island>` is an independent React root -- they cannot share state, context, or communicate with each other.

**Why it happens:** Developers treat Astro islands like a normal React component tree. They put a `<ThemeProvider>` in one island and expect a `<Button>` in another island to receive the theme. Or they split a schedule filter and schedule list into separate islands, expecting shared state.

**Consequences:** Components render without styles, context values are undefined, interactive features fail silently in production (no build error). Hydration mismatch warnings in console.

**Prevention:**
- Group all components that need shared state into a single React island (one `.tsx` wrapper component)
- The interactive schedule (filter + list + detail) must be ONE island, not three
- shadcn/ui components that use Radix primitives (Dialog, DropdownMenu, Popover) must be composed inside a single `.tsx` file, then imported into `.astro` as one island
- Never call shadcn/ui components directly in `.astro` files -- always wrap in a `.tsx` component

**Detection:** Test every interactive component with `client:load` in dev mode. If a component renders but interactions fail (dropdown won't open, dialog won't close), this is likely the cause.

**Phase:** Must be established as an architectural rule in Phase 1 (foundation). Violating this later causes cascading rewrites.

**Confidence:** HIGH (verified via shadcn/ui GitHub discussions and Astro docs)

---

### Pitfall 2: i18n Content Duplication and Drift

**What goes wrong:** With bilingual FR/EN content, organizers create content in one language and forget to update the other. Pages go live with stale translations, missing speakers in one locale, or schedule mismatches between languages. Worse: no build-time check catches missing translations.

**Why it happens:** Astro's content collections validate schema per-file but have no built-in mechanism to enforce that every FR content file has a matching EN counterpart. When 30+ speakers and 40+ sessions are being added in the weeks before the conference, content parity falls apart.

**Consequences:** Attendees switching languages see different information. Missing pages return 404 in one locale. SEO suffers from incomplete hreflang coverage. Organizers lose trust in the website.

**Prevention:**
- Build a validation script (run at build time or in CI) that compares content file slugs across locale directories and fails if any translation is missing
- Use a shared YAML data file for structured data (speakers, schedule) with both FR and EN fields in the same file, rather than separate files per locale -- this makes drift physically impossible for data fields
- Reserve separate locale files only for long-form content (blog posts, about page prose)
- Add a `translationComplete: boolean` frontmatter field to flag incomplete translations and render a "this page is not yet translated" banner rather than a 404

**Detection:** Run `find src/content -name "*.md" | sort` grouped by locale and diff the slug lists. Any mismatch is a translation gap.

**Phase:** Must be designed in Phase 1 (content architecture) and enforced from Phase 2 (content population) onward.

**Confidence:** HIGH (well-documented pattern in multilingual static sites)

---

### Pitfall 3: Schedule Data Model That Cannot Handle Last-Minute Changes

**What goes wrong:** The schedule is modeled as static Markdown/YAML with hard-coded room assignments, time slots, and speaker references. Two weeks before the conference, a speaker cancels, rooms get reassigned, and a keynote is added. Every change requires editing multiple files, rebuilding, and redeploying. Under time pressure, mistakes cascade.

**Why it happens:** Developers design the data model for the happy path (fixed schedule) and underestimate the chaos of conference week. Schedule changes are the number one source of stress for conference organizers.

**Consequences:** Wrong information displayed to attendees. Frantic last-minute commits. Broken cross-references (talk references a speaker who was removed). Build failures at the worst possible time.

**Prevention:**
- Design the schedule as relational YAML: separate files for speakers, talks, rooms, and time slots, with ID-based references (not inline data)
- Build a schedule validation script that checks all cross-references resolve correctly before build
- Ensure the build + deploy pipeline is fast enough for emergency updates (target: under 3 minutes from git push to live). Multi-stage Docker build + pre-built base image helps
- Consider a "schedule version" or last-updated timestamp displayed on the site so attendees know the schedule is current
- Import from Sessionize or pretalx via a script rather than manual YAML editing, if using a CFP tool

**Detection:** If changing one speaker's time slot requires editing more than 2 files, the data model is too coupled.

**Phase:** Data model design in Phase 1. Schedule import tooling in Phase 2. Fast CI/CD pipeline must be ready by Phase 3 (pre-conference).

**Confidence:** HIGH (universal conference website problem, documented across Jekyll-conference, Hoverboard, frab ecosystems)

---

### Pitfall 4: Tailwind CSS 4 + shadcn/ui Configuration Mismatch

**What goes wrong:** Tailwind CSS 4 moved from JavaScript config (`tailwind.config.js`) to CSS-first configuration with `@theme` directives. shadcn/ui's CLI generates components that may reference legacy Tailwind patterns. The Google Stitch design export may produce Tailwind v3 class names. These three systems clash.

**Why it happens:** Tailwind v4 renamed ~40% of utility classes (e.g., `bg-gradient-to-r` became `bg-linear-to-r`, `flex-shrink-0` became `shrink-0`). shadcn/ui's Astro installation path supports v4, but code examples and community snippets still reference v3 patterns. Google Stitch exports may use v3 classes.

**Consequences:** Classes silently produce no styles (no build error). Design breaks that are hard to diagnose. Developers waste hours wondering why a gradient or flex layout is not working.

**Prevention:**
- Run Tailwind's official upgrade tool (`npx @tailwindcss/upgrade`) on any imported code immediately
- Pin shadcn/ui initialization to `shadcn@latest` with explicit Tailwind v4 flag during `npx shadcn init`
- After importing Google Stitch designs, run a class audit: search for known v3 class names (`bg-gradient-to-`, `flex-shrink-`, `flex-grow-`, `overflow-ellipsis`) and replace
- Set up a linting rule or grep-based CI check for deprecated Tailwind v3 class names
- Keep browser DevTools open during styling -- a class that produces no CSS rule is the telltale sign

**Detection:** Inspect elements in browser DevTools. If a Tailwind class appears in the HTML but has no corresponding CSS rule, it is likely a v3 class that was renamed in v4.

**Phase:** Phase 1 (project setup). Must be resolved before any component development begins.

**Confidence:** HIGH (Tailwind v4 upgrade guide explicitly documents all renames)

---

## Moderate Pitfalls

### Pitfall 5: Over-Hydrating -- Too Many React Islands

**What goes wrong:** Developers coming from React SPAs make every component a `client:load` island. The speaker card gets an island. The countdown timer gets an island. The mobile nav gets an island. Each island ships its own React runtime copy, bloating the page.

**Prevention:**
- Default to zero JS: every component is an `.astro` component unless it has user interaction (click handlers, state changes, form inputs)
- The only components that should be React islands: schedule filter/search, mobile navigation hamburger (if animated), any form with validation, language switcher (if it has client-side logic)
- Static content like speaker bios, sponsor logos, venue info, and the agenda overview should be pure Astro/HTML
- Use `client:visible` instead of `client:load` for below-the-fold interactive components (schedule on the main page)

**Detection:** Run Lighthouse on the built site. If JS bundle exceeds 100KB for a content page, you are over-hydrating. Check the network tab for multiple `astro-island` script loads.

**Phase:** Phase 1 (architecture decisions) -- establish the rule. Enforce during Phase 2 (component development).

**Confidence:** HIGH (core Astro philosophy, documented extensively)

---

### Pitfall 6: Missing SEO Metadata for Bilingual Site

**What goes wrong:** The site launches without proper `hreflang` tags, canonical URLs, or localized Open Graph metadata. Google indexes only one language, or worse, treats FR and EN pages as duplicate content.

**Prevention:**
- Create a shared `<SEO>` Astro component used on every page that automatically generates:
  - `<link rel="alternate" hreflang="fr" href="...">` and `hreflang="en"`
  - `<link rel="canonical" href="...">` pointing to the current locale's URL
  - Localized `og:title`, `og:description`, `og:locale`
- Decide on URL strategy early: either `/fr/` and `/en/` prefixes for both (recommended for bilingual parity) or unprefixed default + `/en/` prefix. Use `prefixDefaultLocale: true` in Astro config for consistency
- Generate a sitemap with both locale URLs using `@astrojs/sitemap`

**Detection:** Use Google Search Console's URL Inspection tool post-launch. Run `curl -s <url> | grep hreflang` on every page template.

**Phase:** Phase 1 (layout/SEO component). Validate in Phase 3 (pre-launch QA).

**Confidence:** HIGH (standard multilingual SEO requirement)

---

### Pitfall 7: Docker Image That Rebuilds From Scratch Every Time

**What goes wrong:** The Dockerfile does not leverage layer caching properly. Every content change (a speaker bio update) triggers a full `npm install` + `npm run build`, turning a 10-second content fix into a 3-5 minute deploy cycle. During conference week, this is painful.

**Prevention:**
- Use multi-stage Docker build: Stage 1 (deps) copies only `package.json` + `package-lock.json` and runs `npm ci`. Stage 2 (build) copies source and runs `astro build`. Stage 3 (runtime) uses `nginx:alpine` and copies only `dist/`
- Layer ordering matters: `COPY package*.json` before `COPY . .` so npm install is cached when only content changes
- Use `.dockerignore` to exclude `node_modules/`, `.git/`, and `dist/` from the build context
- For Kubernetes: use image pull policy `Always` with content-hash tags (not `latest`) so rollouts happen correctly
- Target total build+push+deploy time under 3 minutes

**Detection:** Time a content-only change from git push to live site. If it exceeds 3 minutes, investigate Docker layer caching.

**Phase:** Phase 1 (infrastructure setup). Optimize in Phase 3 (pre-conference stress testing).

**Confidence:** HIGH (standard Docker best practice, verified via Astro Docker recipe docs)

---

### Pitfall 8: Nginx Serving Astro Routes Incorrectly

**What goes wrong:** Astro's static build generates files like `/fr/speakers/index.html` and `/en/schedule/index.html`. Default Nginx config does not handle trailing slashes, locale prefixes, or custom 404 pages correctly. Users hit blank pages or the wrong 404.

**Prevention:**
- Configure `try_files $uri $uri/index.html $uri.html =404` in Nginx
- Set up locale-specific 404 pages: Astro can generate `/fr/404.html` and `/en/404.html`, and Nginx `error_page 404` can be configured per location block
- Enable gzip for HTML, CSS, JS, and JSON
- Set aggressive caching headers for `/_astro/` directory (hashed filenames = immutable) but no-cache for HTML files (so content updates are immediate)
- Test all routes after deployment -- especially locale-prefixed routes and the root `/` redirect

**Detection:** After deployment, `curl -I` every route pattern: `/`, `/fr/`, `/en/`, `/fr/speakers/`, a non-existent path. Verify correct status codes and content.

**Phase:** Phase 1 (deployment setup). Must be validated before any content goes live.

**Confidence:** HIGH (verified via Astro Nginx deployment guides)

---

### Pitfall 9: Google Stitch Design-to-Code Gap

**What goes wrong:** Google Stitch generates visually appealing prototypes but exports code that does not match Astro's component model, shadcn/ui's design tokens, or the site's Tailwind theme. Developers spend more time adapting exported code than building from scratch.

**Prevention:**
- Treat Google Stitch output as a visual reference and design token source (colors, spacing, typography), NOT as production code
- Extract the design system (color palette, font sizes, border radii, spacing scale) from Stitch and encode it into `@theme` in your global CSS file
- Build components using shadcn/ui primitives styled with your theme, referencing the Stitch mockup visually
- Do NOT copy-paste Stitch HTML/CSS into Astro components -- the DOM structure will not match Astro's component boundaries or shadcn/ui's markup patterns
- Keep the DESIGN.md as a living reference but expect 100% manual implementation

**Detection:** If you find yourself fighting the exported code (overriding inline styles, restructuring DOM), stop and rebuild from shadcn/ui primitives instead.

**Phase:** Phase 1 (design system setup). Affects all component development phases.

**Confidence:** MEDIUM (Google Stitch is experimental and actively evolving; code export quality may improve)

---

## Minor Pitfalls

### Pitfall 10: Content Collection Schema Too Rigid for Conference Reality

**What goes wrong:** The Zod schema for speakers requires fields like `company`, `bio`, `photo`, and `twitter`. But some speakers have not submitted their bio yet. Others do not have Twitter. The schema blocks the build for incomplete data.

**Prevention:**
- Make almost every field optional (`.optional()`) or provide sensible defaults (`.default("")`)
- Only require: `name`, `id/slug`, and `language`
- Use placeholder images for missing speaker photos rather than failing the build
- Add a `status: "confirmed" | "pending" | "cancelled"` field to handle speaker lifecycle
- Filter out `pending` speakers from the public-facing site but keep them in the data for organizer reference

**Detection:** Try building with a minimal speaker entry (name only). If the build fails, the schema is too strict.

**Phase:** Phase 1 (content schema design).

**Confidence:** HIGH (universal conference data management issue)

---

### Pitfall 11: Language Switcher Navigating to Wrong Page

**What goes wrong:** Astro's `getRelativeLocaleUrl()` does not always produce the correct URL for switching languages on the current page. It may redirect to the root of the other locale instead of the equivalent page, or produce double-prefixed URLs like `/en/en/speakers`.

**Prevention:**
- Build a custom language switcher component that constructs the alternate URL by replacing the locale prefix in `Astro.url.pathname`
- Test the switcher on every page template (home, speakers list, individual speaker, schedule, blog post)
- Handle edge cases: what if a page exists in FR but not EN? Redirect to the EN home page with a notice rather than 404

**Detection:** Click the language switcher on every page type during QA. Verify the URL in the address bar matches expectations.

**Phase:** Phase 2 (component development). Must be QA'd in Phase 3.

**Confidence:** MEDIUM (reported in community, Astro's i18n routing has improved but edge cases remain)

---

### Pitfall 12: Forgetting Time Zones in Schedule Display

**What goes wrong:** Schedule times are stored without timezone information. The site displays "10:00" but does not specify CET/CEST. Attendees in other timezones (remote viewers, international speakers checking the schedule) see ambiguous times.

**Prevention:**
- Store all times in ISO 8601 with timezone offset (e.g., `2026-10-15T10:00:00+02:00`)
- Display times with explicit timezone label ("10:00 CEST")
- If showing times in the interactive schedule React island, use `Intl.DateTimeFormat` with `timeZone: 'Europe/Paris'` to ensure correct display regardless of the viewer's locale
- Since this is a static site, server rendering uses build-time timezone -- make sure it matches the conference timezone

**Detection:** View the schedule with browser timezone set to UTC. Times should still show Paris time with the CEST label.

**Phase:** Phase 2 (schedule component). Minor but embarrassing if wrong.

**Confidence:** HIGH (common web development timezone issue)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Foundation / Setup | Tailwind v4 config clash with shadcn/ui and Stitch exports (#4) | Run upgrade tool on all imported code, validate v4 classes |
| Foundation / Setup | Docker layer caching not configured (#7) | Multi-stage build with proper COPY ordering from day one |
| Content Architecture | Schema too rigid for real conference data (#10) | Make fields optional, use status field for speaker lifecycle |
| Content Architecture | i18n content drift between FR/EN (#2) | Shared YAML for structured data, validation script in CI |
| Component Development | Over-hydration (#5) | Default to .astro, React only for interactive features |
| Component Development | Islands context isolation breaks shadcn/ui (#1) | One island per interactive feature, never split shared state |
| Schedule Feature | Data model too coupled for last-minute changes (#3) | Relational YAML with ID references, validation script |
| Schedule Feature | Timezone display ambiguity (#12) | ISO 8601 with offset, explicit timezone labels |
| i18n / SEO | Missing hreflang and canonical tags (#6) | Shared SEO component on all pages |
| i18n / SEO | Language switcher navigation bugs (#11) | Custom switcher with pathname manipulation, test all routes |
| Deployment / QA | Nginx misconfiguration for locale routes (#8) | Test all route patterns with curl after deploy |
| Design System | Stitch-to-code gap wastes development time (#9) | Use Stitch as visual reference only, build with shadcn/ui |

## Sources

- [Astro i18n Routing Docs](https://docs.astro.build/en/guides/internationalization/)
- [Astro Content Collections Docs](https://docs.astro.build/en/guides/content-collections/)
- [Astro Islands Architecture](https://docs.astro.build/en/concepts/islands/)
- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [shadcn/ui Astro Installation](https://ui.shadcn.com/docs/installation/astro)
- [shadcn/ui React Context in Astro Discussion](https://github.com/shadcn-ui/ui/discussions/3740)
- [Astro Docker Recipe](https://docs.astro.build/en/recipes/docker/)
- [Astro Build Performance Optimization](https://www.bitdoze.com/astro-ssg-build-optimization/)
- [Astro Dev Server Slow with Content Collections](https://github.com/withastro/astro/issues/10269)
- [Astro Nginx Caching Headers](https://aaronjbecker.com/posts/astro-static-nginx-caching-headers/)
- [Google Stitch Complete Guide](https://www.nxcode.io/resources/news/google-stitch-complete-guide-vibe-design-2026)
- [Jekyll Conference Theme](https://github.com/DigitaleGesellschaft/jekyll-theme-conference) (data model patterns)
- [Managing Last-Minute Session Changes](https://www.ctimeetingtech.com/how-to-manage-last-minute-session-changes-event-software/)
- [Astro i18n Complete Guide](https://eastondev.com/blog/en/posts/dev/20251202-astro-i18n-guide/)
- [Tailwind v4 Migration Breaking Changes](https://designrevision.com/blog/tailwind-4-migration)
