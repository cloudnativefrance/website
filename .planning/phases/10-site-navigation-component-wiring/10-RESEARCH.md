# Phase 10: Site Navigation & Component Wiring - Research

**Researched:** 2026-04-12
**Domain:** Astro navigation components, i18n integration, responsive nav patterns
**Confidence:** HIGH

## Summary

This phase wires up site-wide navigation into the existing `Layout.astro` header, consumes the already-defined `nav.*` i18n keys, places the `TranslationNotice` component on non-default-locale pages, and resolves orphaned shadcn components. No new libraries are needed -- everything builds on existing Astro components, Tailwind 4 utilities, and the i18n system from Phase 2.

The current header in `Layout.astro` is minimal: a sticky bar with only `LanguageToggle`. The nav component will replace this header content with logo + nav links + CTA button + language toggle. The i18n keys (`nav.home`, `nav.schedule`, `nav.speakers`, `nav.sponsors`, `nav.venue`, `nav.team`) are already defined in both FR and EN in `src/i18n/ui.ts`.

**Primary recommendation:** Build a single `Navigation.astro` component with desktop horizontal links and mobile hamburger/drawer, then update `Layout.astro` to use it. No React islands needed -- pure Astro + CSS/JS for the mobile toggle.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Desktop nav: CND France logo on the left, horizontal section links centered/inline, LanguageToggle on the right. Classic conference site pattern.
- **D-02:** Mobile nav: Claude's discretion -- pick the best mobile pattern (hamburger + drawer or dropdown) based on the 6-8 nav items.
- **D-03:** Active page: underline or accent color on the current/active nav link using the primary color.
- **D-04:** Scroll effect: keep the existing backdrop-blur-sm bg-background/90, add a subtle bottom border (border-border) when the user scrolls past the top.
- **D-05:** Show all 6 nav links (home, speakers, schedule, sponsors, venue, team) even if the target page doesn't exist yet. Dead links point to the homepage (or a relevant homepage anchor section).
- **D-06:** Add a placeholder CTA button in the nav (e.g., "Register") linking to `#` -- ready to wire up in Phase 12 (CTA & Brand Completion).
- **D-07:** TranslationNotice placement logic: Claude's discretion on when to show it (per-page fallback detection vs blanket non-default-language notice).
- **D-08:** Position: top of content area, directly below the sticky header, banner-style. Immediately visible.
- **D-09:** Keep shadcn card.tsx and separator.tsx in src/components/ui/ for future phases (sponsors, team, venue, schedule will likely use them). No removal.

### Claude's Discretion
- Mobile navigation pattern (hamburger + drawer vs dropdown overlay)
- TranslationNotice display logic (fallback-only vs language-wide)
- Exact styling details for nav links, hover states, transitions
- CTA button styling in the nav

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

## Standard Stack

### Core (already installed -- no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | ^6.1.5 | SSG framework | Already in project [VERIFIED: package.json] |
| tailwindcss | ^4.2.2 | Utility CSS | Already in project [VERIFIED: package.json] |
| @base-ui/react | ^1.3.0 | Headless UI primitives | Already in project, available if needed for accessible mobile menu [VERIFIED: package.json] |

### Supporting (already available)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^1.8.0 | Icons (hamburger, close) | Mobile menu toggle icon [VERIFIED: package.json] |
| class-variance-authority | ^0.7.1 | Variant styling | Nav link active/inactive states [VERIFIED: package.json] |
| shadcn button.tsx | n/a | CTA button component | Register CTA in nav [VERIFIED: src/components/ui/button.tsx] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pure Astro nav with inline `<script>` for mobile | React island for mobile nav | React adds hydration cost for a simple toggle; Astro `<script>` with `is:inline` or standard `<script>` is lighter and sufficient |
| Lucide React icons | Inline SVG hamburger/close | Lucide already installed but requires React; inline SVG avoids island entirely |

**No `npm install` needed.** All dependencies are already present.

## Architecture Patterns

### Recommended Component Structure

```
src/
  components/
    Navigation.astro        # NEW: Main nav component (desktop + mobile)
  layouts/
    Layout.astro            # MODIFIED: Replace header content with Navigation
  pages/
    index.astro             # MODIFIED: Add TranslationNotice logic
    en/index.astro          # MODIFIED: Add TranslationNotice
    speakers/index.astro    # MODIFIED: Add TranslationNotice
    en/speakers/index.astro # MODIFIED: Add TranslationNotice
    speakers/[slug].astro   # MODIFIED: Add TranslationNotice
    en/speakers/[slug].astro# MODIFIED: Add TranslationNotice
```

### Pattern 1: Astro Navigation Component (no React island)

**What:** A pure Astro component that renders the nav HTML server-side, with a small inline `<script>` for mobile menu toggle and scroll-border effect.

**When to use:** When navigation is primarily static links with minimal interactivity (toggle open/close, scroll detection). No state management needed beyond a boolean.

**Why Astro over React island:** The navigation has exactly two interactive behaviors: (1) mobile menu toggle, (2) scroll border effect. Both are trivially handled with vanilla JS in an Astro `<script>` tag. Using a React island would add unnecessary hydration cost for what is essentially a `classList.toggle()`.

**Example:**
```astro
---
// Source: project codebase patterns [VERIFIED: Layout.astro, LanguageToggle.astro]
import { getLangFromUrl, useTranslations, getLocalePath } from "@/i18n/utils";
import LanguageToggle from "@/components/LanguageToggle.astro";

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
const currentPath = Astro.url.pathname;

const navItems = [
  { key: "nav.home" as const, href: getLocalePath(lang, "/") },
  { key: "nav.speakers" as const, href: getLocalePath(lang, "/speakers") },
  { key: "nav.schedule" as const, href: getLocalePath(lang, "/") },  // dead link -> home
  { key: "nav.sponsors" as const, href: getLocalePath(lang, "/") },  // dead link -> home
  { key: "nav.venue" as const, href: getLocalePath(lang, "/") },     // dead link -> home
  { key: "nav.team" as const, href: getLocalePath(lang, "/") },      // dead link -> home
];
---

<header id="site-header" class="sticky top-0 z-50 backdrop-blur-sm bg-background/90 transition-[border-color] duration-200 border-b border-transparent">
  <nav class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
    <!-- Logo -->
    <a href={getLocalePath(lang, "/")} class="shrink-0">
      <img src="/logos/dark/logo.svg" alt="CND France" class="h-8" />
    </a>

    <!-- Desktop links -->
    <div class="hidden md:flex items-center gap-6">
      {navItems.map(({ key, href }) => (
        <a
          href={href}
          class:list={[
            "text-sm font-medium transition-colors hover:text-primary",
            currentPath === href
              ? "text-primary border-b-2 border-primary pb-0.5"
              : "text-muted-foreground",
          ]}
        >
          {t(key)}
        </a>
      ))}
    </div>

    <!-- Right side: CTA + Language Toggle -->
    <div class="flex items-center gap-3">
      <a href="#" class="hidden md:inline-flex ...">
        {t("hero.cta.register")}
      </a>
      <LanguageToggle />
      <!-- Mobile hamburger button -->
      <button id="mobile-menu-btn" class="md:hidden ..." aria-label="Menu">
        <!-- hamburger SVG -->
      </button>
    </div>
  </nav>

  <!-- Mobile menu panel -->
  <div id="mobile-menu" class="hidden md:hidden border-t border-border">
    {navItems.map(({ key, href }) => (
      <a href={href} class="block px-4 py-3 text-sm ...">{t(key)}</a>
    ))}
    <a href="#" class="block px-4 py-3 ...">{t("hero.cta.register")}</a>
  </div>
</header>

<script>
  // Mobile menu toggle
  const btn = document.getElementById("mobile-menu-btn");
  const menu = document.getElementById("mobile-menu");
  btn?.addEventListener("click", () => menu?.classList.toggle("hidden"));

  // Scroll border effect
  const header = document.getElementById("site-header");
  window.addEventListener("scroll", () => {
    header?.classList.toggle("border-border", window.scrollY > 0);
    header?.classList.toggle("border-transparent", window.scrollY === 0);
  }, { passive: true });
</script>
```

### Pattern 2: Active Page Detection

**What:** Compare `Astro.url.pathname` against nav link `href` to determine active state.

**When to use:** Every nav render.

**Approach:** Exact match for home, `startsWith` for section pages (e.g., `/speakers/alice` should highlight "Speakers").

```astro
---
// Source: Astro routing conventions [VERIFIED: existing page structure]
function isActive(currentPath: string, href: string): boolean {
  if (href === "/" || href === "/en" || href === "/en/") {
    return currentPath === href || currentPath === href + "/";
  }
  return currentPath.startsWith(href);
}
---
```

### Pattern 3: TranslationNotice Placement

**What:** Show the existing `TranslationNotice.astro` component on English pages as a blanket notice.

**Recommendation for Claude's discretion (D-07):** Use a **blanket non-default-language approach** -- show TranslationNotice on all `/en/` pages. Rationale: the site currently has partial translations, and a blanket notice is simpler, more honest, and avoids per-page fallback detection complexity. The component already handles its own i18n text.

**Placement (D-08):** In `Layout.astro`, render TranslationNotice immediately after the `<header>` and before `<slot />`, conditionally when `lang !== defaultLang`.

```astro
---
// In Layout.astro
import TranslationNotice from "@/components/TranslationNotice.astro";
import { defaultLang } from "@/i18n/ui";

const showTranslationNotice = resolvedLang !== defaultLang;
---
<header>...</header>
{showTranslationNotice && <TranslationNotice />}
<slot />
```

### Anti-Patterns to Avoid

- **React island for navigation:** Adds hydration cost for a simple toggle. Use Astro `<script>` for the hamburger menu. [ASSUMED: based on Astro best practices for minimal interactivity]
- **Separate nav components per locale:** The i18n system already handles translations -- one component serves both locales via `useTranslations()`. [VERIFIED: src/i18n/utils.ts]
- **Hardcoded link labels:** Always use `t("nav.xxx")` keys, never raw strings. [VERIFIED: nav keys exist in ui.ts]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scroll detection | Custom IntersectionObserver setup | Simple `window.scroll` listener with `{ passive: true }` | Only need "scrolled past top" boolean, not complex intersection logic |
| Mobile menu animation | CSS animation library | Tailwind `hidden` toggle + optional `transition` classes | Simple show/hide is sufficient for MVP |
| Active link detection | Router-based active state | `Astro.url.pathname` comparison | Astro is SSG -- path is known at build time |
| CTA button | Custom button HTML | shadcn `Button` component or its variant classes | Already available and styled for the design system |

## Common Pitfalls

### Pitfall 1: Logo Asset Path
**What goes wrong:** Using `import` for the logo in an Astro component vs using a public path, or referencing the wrong logo variant.
**Why it happens:** Astro supports both `src/assets/` imports (optimized) and `public/` references. The logos are in `src/assets/logos/`.
**How to avoid:** Use Astro's `Image` component with an import from `src/assets/logos/dark/logo.svg` for the dark-theme nav logo, OR use inline SVG. Since this is a dark-theme site, use the `dark/` variant. [VERIFIED: src/assets/logos/dark/ contains logo.svg and logo-notext.svg]
**Warning signs:** Logo appears as broken image or wrong colors on dark background.

### Pitfall 2: Dead Link Paths with Locale Prefix
**What goes wrong:** Dead links for missing pages (schedule, sponsors, venue, team) don't account for locale prefix.
**Why it happens:** Forgetting to use `getLocalePath()` for dead links pointing to home.
**How to avoid:** Always use `getLocalePath(lang, "/")` for dead links, never hardcode `/` or `/en/`. [VERIFIED: getLocalePath handles locale prefix correctly in utils.ts]
**Warning signs:** EN page nav links jump back to FR homepage.

### Pitfall 3: Mobile Menu Scroll Lock
**What goes wrong:** User opens mobile menu, page scrolls behind it, menu content becomes unreachable.
**Why it happens:** No `overflow-hidden` on body when menu is open.
**How to avoid:** Toggle `overflow-hidden` on `document.body` when mobile menu opens/closes. Or use a full-height overlay approach.
**Warning signs:** Mobile menu content scrolls away when user scrolls.

### Pitfall 4: TranslationNotice Below Sticky Header Gap
**What goes wrong:** TranslationNotice renders behind the sticky header or creates a visual gap.
**Why it happens:** Sticky header is `position: sticky; top: 0` -- content below it needs no special offset for static elements, but if TranslationNotice is inside the scrolling content, it works fine. If placed inside the header (sticky), it becomes part of the sticky block.
**How to avoid:** Place TranslationNotice OUTSIDE the `<header>` element, as the first child of `<main>` or between `</header>` and `<slot />` in Layout.astro. It should scroll with page content, not stick. [VERIFIED: D-08 says "top of content area, directly below the sticky header"]
**Warning signs:** Notice sticks to top or overlaps with header.

### Pitfall 5: Astro Script Deduplication
**What goes wrong:** Astro `<script>` tags in components are bundled and deduplicated -- they run once globally, not per component instance.
**Why it happens:** Astro's default script behavior bundles scripts.
**How to avoid:** This is actually desirable for the nav (only one instance). Use standard `<script>` (not `is:inline`). For event listeners, use `document.getElementById` which is instance-safe. [ASSUMED: Astro 6 script behavior consistent with Astro 4/5]
**Warning signs:** Multiple event listeners attached if script is `is:inline` and component used in multiple places.

## Code Examples

### Navigation Link Map with Dead Link Handling

```typescript
// Source: existing i18n system [VERIFIED: src/i18n/ui.ts, src/i18n/utils.ts]
// Maps nav keys to their paths. Pages that don't exist yet point to "/"
const navItems = [
  { key: "nav.home" as const, path: "/" },
  { key: "nav.speakers" as const, path: "/speakers" },
  { key: "nav.schedule" as const, path: "/" },   // Phase 7 (pending)
  { key: "nav.sponsors" as const, path: "/" },   // Phase 5 (pending)
  { key: "nav.venue" as const, path: "/" },       // Phase 6 (pending)
  { key: "nav.team" as const, path: "/" },        // Phase 5 (pending)
] as const;

// Generate locale-aware hrefs
const links = navItems.map(({ key, path }) => ({
  label: t(key),
  href: getLocalePath(lang, path),
}));
```

### Scroll Border Effect (Vanilla JS)

```javascript
// Source: D-04 scroll effect requirement
// Toggles border-border class on header when scrolled
const header = document.getElementById("site-header");
if (header) {
  const onScroll = () => {
    const scrolled = window.scrollY > 0;
    header.classList.toggle("border-border", scrolled);
    header.classList.toggle("border-transparent", !scrolled);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll(); // initial check
}
```

### Mobile Menu Toggle with Body Lock

```javascript
// Source: standard mobile nav pattern
const btn = document.getElementById("mobile-menu-btn");
const menu = document.getElementById("mobile-menu");
const iconOpen = document.getElementById("icon-open");
const iconClose = document.getElementById("icon-close");

btn?.addEventListener("click", () => {
  const isOpen = !menu?.classList.contains("hidden");
  menu?.classList.toggle("hidden");
  iconOpen?.classList.toggle("hidden");
  iconClose?.classList.toggle("hidden");
  document.body.classList.toggle("overflow-hidden", !isOpen);
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Astro `<script is:inline>` for all client JS | Standard `<script>` (bundled, deduped) | Astro 2+ | Scripts are bundled and run once; `is:inline` only needed for truly inline scripts |
| React islands for all interactivity | Astro `<script>` for simple DOM manipulation | Astro philosophy | Avoids hydration cost for toggle/scroll behaviors |
| CSS-in-JS for nav active states | Tailwind `class:list` directive | Tailwind 3+ / Astro 2+ | No runtime CSS needed |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Astro 6 `<script>` tags behave same as Astro 4/5 (bundled, deduped) | Anti-Patterns, Pitfall 5 | LOW -- would only affect script placement strategy |
| A2 | `hero.cta.register` key is appropriate for nav CTA label | Code Examples | LOW -- can use any existing key or add a new `nav.cta` key |
| A3 | Hamburger + slide-down panel is better than full-screen overlay for 6-8 items | Mobile pattern recommendation | LOW -- either works, decision is Claude's discretion |

## Open Questions

1. **Logo variant for nav**
   - What we know: `src/assets/logos/dark/` has `logo.svg` (with text) and `logo-notext.svg`. The site is dark-themed.
   - What's unclear: Should nav use full logo or icon-only? Full logo may be wide for mobile.
   - Recommendation: Use `logo-notext.svg` on mobile (compact), full `logo.svg` on desktop. Or use full logo everywhere if it fits within the nav height (h-8 to h-10).

2. **CTA button i18n key**
   - What we know: `hero.cta.register` exists ("Reservez votre place" / "Get Your Ticket"). There's no dedicated `nav.cta` key.
   - What's unclear: Should the nav CTA use the same label as the hero CTA?
   - Recommendation: Reuse `hero.cta.register` for now. If a shorter label is needed (e.g., "Register" / "S'inscrire"), add a `nav.register` key.

## Project Constraints (from CLAUDE.md)

- **Stitch-first rule:** Every new page or significant UI change must be designed in Google Stitch first, validated by the user, then implemented in code. The navigation component is a significant UI change and should go through Stitch review.
- **No commit co-authoring** (global CLAUDE.md).
- **No Claude Code attribution** in PRs (global CLAUDE.md).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.4 |
| Config file | Implied by package.json scripts (no vitest.config.* found) |
| Quick run command | `npm run test` |
| Full suite command | `npm run test` |

### Phase Requirements to Test Map

This phase has no formal requirement IDs (it closes integration gaps). Behavioral validation:

| Behavior | Test Type | Automated Command | Notes |
|----------|-----------|-------------------|-------|
| Nav renders 6 links | Build + manual | `npm run build` | Verify no build errors; visual check |
| i18n keys consumed | Build | `npm run build` | TypeScript will error on invalid keys |
| TranslationNotice on EN pages | Manual | n/a | Visual verification on `/en/` pages |
| Active link highlighting | Manual | n/a | Visual verification |
| Mobile menu toggle | Manual | n/a | Interactive behavior |
| Scroll border effect | Manual | n/a | Interactive behavior |

### Sampling Rate
- **Per task commit:** `npm run build` (ensures no build errors)
- **Phase gate:** Build succeeds + visual inspection of FR and EN homepages + speakers page

## Security Domain

Not applicable for this phase. Navigation is purely static HTML links with no user input, authentication, or data processing. All links are hardcoded paths. The CTA button links to `#` (placeholder). No security controls needed.

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/layouts/Layout.astro`, `src/i18n/ui.ts`, `src/i18n/utils.ts`, `src/components/LanguageToggle.astro`, `src/components/TranslationNotice.astro` -- directly inspected
- `package.json` -- verified all dependency versions
- `src/assets/logos/` -- verified available logo variants
- `src/pages/` -- verified existing pages (home, speakers) and missing pages (schedule, sponsors, venue, team)

### Secondary (MEDIUM confidence)
- Astro component patterns (script handling, `class:list`) -- based on established Astro conventions consistent across versions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed, verified in package.json
- Architecture: HIGH -- builds entirely on existing patterns (Layout.astro, i18n utils, LanguageToggle)
- Pitfalls: HIGH -- derived from direct codebase inspection and standard web nav patterns

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (stable -- no external dependencies or fast-moving APIs)
