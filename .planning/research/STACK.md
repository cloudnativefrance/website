# Stack Research — v1.1 Past Editions Showcase

**Domain:** Astro content site — static marketing sections (past-edition showcases + testimonials)
**Researched:** 2026-04-13
**Confidence:** HIGH

> This file replaces the v1.0 stack research (archived with the v1.0 milestone). v1.1 is a feature addition to an already-validated stack — focus is only on what the new sections need.

## TL;DR

**No new runtime dependencies are required.** The existing stack already covers every v1.1 need:

- **Images** — `astro:assets` `<Image>` / `<Picture>` / `getImage` (built into Astro 6.1.5)
- **Testimonial rotation** — CSS keyframes / Tailwind 4 utilities + the already-installed `tw-animate-css@1.4.0`
- **Lightbox** — not recommended for v1.1 (see "What NOT to Use"). If a lightbox is later deemed necessary, add `yet-another-react-lightbox` as a single React island — but ship v1.1 without it.
- **Accessibility primitives** — `@base-ui/react@1.3.0` is already installed for interactive controls; animations gate on `prefers-reduced-motion` via CSS (no JS library needed).

Everything else is CSS + Astro built-ins.

## Recommended Stack (v1.1 additions / usage patterns)

### Core Technologies — already installed, used differently in v1.1

| Technology | Version (installed) | Purpose in v1.1 | Why Recommended |
|------------|---------------------|-----------------|-----------------|
| `astro` `<Image>` (from `astro:assets`) | 6.1.5 | Single optimized JPG/WebP with `width`+`height` (layout-shift free) for the KCD 2023 logo and any in-flow photo that renders only one format | Simplest API, prevents CLS, default `loading="lazy"` + `decoding="async"`. Already the documented pattern in `src/assets/photos/README.md`. |
| `astro` `<Picture>` (from `astro:assets`) | 6.1.5 | The 10-photo 2023 gallery — emits multi-format `<picture>` with AVIF + WebP fallbacks and responsive `srcset` | Per Astro docs: "generate a `<picture>` tag with multiple formats and/or sizes". AVIF alone is insufficient (Safari < 16), so a `<picture>` with AVIF → WebP → original JPG is the correct modern pattern. |
| `astro` `getImage()` | 6.1.5 | Only if we need a URL for CSS `background-image` on a hero-style edition banner (not required by current scope) | Server-only helper for cases where HTML `<img>` is not the output target. Keep in toolbox, unused for now. |
| `tw-animate-css` | 1.4.0 | CSS-only utility classes for the testimonial fade/slide animation (e.g. `animate-in fade-in slide-in-from-right` pattern) | Already imported in `src/styles/global.css` (`@import "tw-animate-css"`). Provides the shadcn-style animation utilities that Tailwind 4 dropped from core. Zero JS cost. |
| `@base-ui/react` | 1.3.0 | Only if we add interactive gallery nav (prev/next buttons, focus-trapped dialog). Not needed for autoplay-only rotation | Already a dependency (the shadcn "base-nova" style is built on Base UI). Accessible primitives — use before reaching for any new lib. |

### Supporting Libraries — NEW, only if specific triggers are met

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| *(none required for v1.1)* | — | — | — |
| `yet-another-react-lightbox` | ^3.22.0 | Click-to-zoom photo gallery with keyboard nav, swipe, focus trap | **DEFER.** Only add if product decides clicking a photo must open a full-screen zoomed viewer. For v1.1 grid-only display, skip it. ~15 KB gz React island. |
| `embla-carousel-react` | ^8.5.2 | Swipeable carousel (used by shadcn `carousel`) | **DEFER.** Only add if 2023 photos need to be a swipeable slider on mobile instead of a CSS grid. Current spec = grid, so not needed. |

### Development Tools — no changes

| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest 4.1 | Unit tests | No changes for v1.1 |
| Playwright | E2E | Add visual regression cases for the two new homepage sections once Stitch mocks are approved |
| Lighthouse CI | Perf budget | Re-check LCP after ~21 MB of originals are added — see "Version Compatibility & Budget" below |

## Installation

```bash
# Nothing to install for v1.1 core features.

# Only if lightbox is approved later (NOT in current scope):
# pnpm add yet-another-react-lightbox
```

## Implementation Patterns

### 1. 2023 photo gallery — 10 JPGs, ~21 MB of originals

**Pre-processing (mandatory):** Run the existing ImageMagick recipe from `src/assets/photos/README.md` on each 2023 photo before committing. Targets: long edge ≤ 2400 px, quality 82, stripped EXIF. Expected end-size per photo ~300–850 KB (masters stored in `src/assets/photos/2023/`), which Astro then re-encodes to AVIF/WebP variants at build time.

**Rendering:**

```astro
---
import { Picture } from "astro:assets";
import photo01 from "@/assets/photos/2023/kcd-2023-01.jpg";
---
<Picture
  src={photo01}
  alt="Audience at KCD France 2023, Centre Georges Pompidou"
  formats={["avif", "webp"]}
  fallbackFormat="jpg"
  widths={[480, 800, 1200, 1600]}
  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
  loading="lazy"
  decoding="async"
/>
```

- Use `<Picture>` (not `<Image>`) for gallery photos so AVIF-capable browsers get AVIF and Safari < 16 / older Edge fall back gracefully.
- Use `<Image>` for the single KCD 2023 logo PNG — one format is enough.
- `loading="lazy"` + `decoding="async"` are defaults in Astro 6 — explicit for clarity.
- **Do not** import photos from `public/` — it bypasses optimization (already called out in the existing photos README).

### 2. Testimonial strip — CSS-only rotation (recommended)

Three hardcoded French quotes + transform/opacity transitions driven by CSS keyframes. No JS, no React island, no extra dependency.

```css
/* src/styles/global.css or a colocated <style> block */
@keyframes testimonial-cycle {
  0%, 28%   { opacity: 1; transform: translateY(0); }
  33%, 100% { opacity: 0; transform: translateY(-8px); }
}

@media (prefers-reduced-motion: reduce) {
  .testimonial-slide { animation: none !important; opacity: 1; }
}
```

Each slide gets `animation-delay` offset by 1/3 of total cycle. Pure CSS → works in Astro SSR with no hydration cost, and `prefers-reduced-motion` is honoured automatically.

**Alternative considered:** a React island using state + `setInterval`. Rejected — adds JS runtime + hydration for three strings that never change.

**`tw-animate-css` usage:** The Tailwind-animate utilities (`animate-in`, `fade-in`, `slide-in-from-bottom-2`, etc.) are available for one-shot entrance animations if the team prefers composing utilities over a keyframe. Both are fine; pick one and stay consistent.

### 3. `prefers-reduced-motion` — gap in current codebase

**Finding:** grep across `src/` shows **zero** existing uses of `prefers-reduced-motion` or `motion-reduce:` utilities. v1.1 is the first feature that animates, so this becomes a net-new accessibility baseline to establish.

**Recommendation:** add a global CSS reset at the top of `src/styles/global.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

This single block covers the testimonial rotation, any `tw-animate-css` utility, and future animations. Tailwind 4 also supports the `motion-reduce:` variant for per-utility opt-outs if a component needs finer control.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| CSS keyframes for testimonial rotation | **Framer Motion / `motion`** (`^11`) | Reject for v1.1 — ~35 KB gz React dep for three rotating strings. Revisit only if we later need gesture-driven or layout animations. |
| CSS keyframes + `tw-animate-css` | **`motion-primitives`** / **`auto-animate`** | Reject — more weight for the same visual result. Use only if we adopt list reorder animations elsewhere. |
| Astro `<Picture>` for gallery | **`unpic`** / **`@unpic/astro`** | Only relevant if we hosted photos on a remote CDN (Cloudinary/Imgix). We self-host masters in `src/assets/`, so Astro's built-in pipeline wins. |
| Astro built-in image pipeline | **Sharp vs Squoosh service** | Astro uses Sharp by default; no action needed. Squoosh is only relevant if deploying to an environment where Sharp's native binary fails (K8s container already ships glibc, so Sharp works). |
| Raw CSS grid for the 10-photo layout | **shadcn `carousel`** (Embla) | Use carousel only if product explicitly wants a swipeable mobile UX. For a homepage "scroll the page" overview, a responsive CSS grid is simpler, more SEO-friendly, and zero-JS. |
| No lightbox for v1.1 | **`yet-another-react-lightbox`** | Only if click-to-zoom is confirmed as a user need. If adopted, wrap in an Astro island with `client:visible` and gate on `prefers-reduced-motion` for its internal transitions. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Raw `<img>` tags pointing to `public/` for gallery photos | Bypasses Astro's AVIF/WebP pipeline; ~10× larger payload; causes CLS without explicit width/height | `astro:assets` `<Picture>` on files under `src/assets/photos/2023/` |
| **Framer Motion** / `motion` for v1.1 | 35 KB gz + React hydration for 3 static quotes is overkill; bloats LCP | CSS `@keyframes` with `prefers-reduced-motion` guard |
| **Swiper.js** | Heavy (~50 KB), last-resort option. Dated API, duplicates what shadcn/Embla already solves | If a carousel is ever needed: shadcn `carousel` (Embla) added via `npx shadcn add carousel` |
| **AOS (Animate On Scroll)** | IntersectionObserver already gives you this in ~10 lines; AOS adds JS + global CSS | Native `IntersectionObserver` inside a tiny Astro `<script>` block, or CSS `animation-timeline: view()` where supported |
| `react-image-gallery` / `lightgallery` | jQuery-era ergonomics, large bundles, not Tailwind-friendly | Defer lightbox; if ever needed, use `yet-another-react-lightbox` |
| `tailwindcss-animate` (the old plugin) | Superseded in Tailwind 4 — the plugin system changed. `tw-animate-css` is the Tailwind-4-native port | `tw-animate-css@1.4.0` (already installed) |
| Shipping unprocessed 21 MB of JPG masters | Will destroy LCP and waste Sharp CPU even after optimization | Run the ImageMagick pre-processing recipe from `src/assets/photos/README.md` before committing |

## Stack Patterns by Variant

**If testimonials become dynamic (CSV-driven) later:**
- Keep CSS rotation; only the data source changes.
- Load via a new `loadTestimonials()` helper next to `loadSessions` / `loadSpeakers` (same CSV-first pattern as the rest of the site).
- v1.1 keeps them inline per the milestone brief.

**If product wants click-to-zoom on gallery photos:**
- Add `yet-another-react-lightbox` (^3.22) as a single React island, `client:visible`.
- Confirm Base UI does not double-trap focus when the lightbox opens.

**If mobile experience needs swipe instead of vertical scroll:**
- `npx shadcn add carousel` → adds `embla-carousel-react` + the shadcn `carousel` wrapper.
- Render the carousel only below `md` via `md:hidden`, keep CSS grid for desktop.

## Version Compatibility & Budget

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `astro@6.1.5` | `@astrojs/react@5.0.3`, `@tailwindcss/vite@4.2.2`, Node ≥ 22.12 | Image pipeline uses Sharp by default; container already has glibc, no action needed. |
| `tw-animate-css@1.4.0` | `tailwindcss@4.2.2` | Already imported via `@import "tw-animate-css"` in `global.css`. Do NOT replace with legacy `tailwindcss-animate`. |
| `@base-ui/react@1.3.0` | `react@19.2.5` | Already satisfies React 19 peer. Use for any interactive control added (e.g. lightbox trigger). |
| Lighthouse budget | Current LCP target from v1.0 | Re-measure after adding the 2023 gallery; if LCP regresses, lazy-init the gallery below the fold (`content-visibility: auto` + `loading="lazy"` already handle this) before reaching for any JS lib. |

## Integration Notes — Astro Islands

- **Homepage remains 0-JS by default.** The testimonial rotation is pure CSS, so it does not require a React island. `<Picture>` is a server-rendered Astro component — also zero JS.
- **Only island if a lightbox or carousel is added.** Use `client:visible` (not `client:load`) to defer hydration until the section scrolls into view — critical because both features live below the fold on the homepage.
- **No shared state** between the 2026 and 2023 sections — each is an independent Astro component, safe to swap/reorder during the Stitch design iterations.

## Sources

- Astro 6 Images guide — https://docs.astro.build/en/guides/images/ — verified `<Image>` vs `<Picture>` vs `getImage()` recommendations, default lazy loading, responsive layout support (HIGH)
- Existing repo doc — `src/assets/photos/README.md` — authoritative ImageMagick pre-processing recipe already used for v1.0 photos (HIGH)
- Existing `package.json` + `src/styles/global.css` — confirmed `tw-animate-css@1.4.0` is imported and `@base-ui/react@1.3.0` is installed (HIGH)
- Existing `components.json` — confirmed shadcn "base-nova" style, Base UI backbone, lucide icons (HIGH)
- MDN `prefers-reduced-motion` — https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion — verified the global CSS reset pattern (HIGH)
- Repo grep results — confirmed **no existing** `prefers-reduced-motion` handling, making v1.1 the baseline (HIGH)

---
*Stack research for: v1.1 Past Editions Showcase (Astro + React islands + Tailwind 4 + shadcn/ui, static marketing sections)*
*Researched: 2026-04-13*
