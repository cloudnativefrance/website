---
phase: 23
plan: 02
type: execute
wave: 2
depends_on:
  - 23-01
files_modified:
  - src/components/past-editions/Edition2026Combined.astro
autonomous: true
requirements:
  - ED26-01
  - ED26-02
  - ED26-03
must_haves:
  truths:
    - "src/components/past-editions/Edition2026Combined.astro exists and compiles under bun run astro check"
    - "Component renders a single <section id='edition-2026'> with stacking order: rail → h2 → 3-photo mosaic → YouTube video → CTA row (replays + PDF) → testimonials (h3 + 3 cards)"
    - "Component uses youtube-nocookie.com/embed for the video embed (D-12)"
    - "Both external CTA <a> elements carry target=\"_blank\" and rel=\"noopener noreferrer\" (D-11)"
    - "Component is pure Astro SSR — zero client:* directives, zero React islands (D-02)"
    - "Component consumes EDITION_2026 and TESTIMONIALS via the Props interface from UI-SPEC §Props Interface; data assembly is in its own frontmatter"
    - "Component uses DS tokens only (bg-card, border-border, text-muted-foreground, text-foreground, text-primary, text-card-foreground) — no ad-hoc hex/rgb (D-13)"
    - "Component is NOT mounted to src/pages/index.astro or src/pages/en/index.astro — Phase 26 owns mounting"
    - "bun run astro check passes; bun run build passes"
  artifacts:
    - path: "src/components/past-editions/Edition2026Combined.astro"
      provides: "Purpose-built homepage section: photos + video + replays/PDF CTAs + testimonial cards"
      min_lines: 80
      contains: "youtube-nocookie.com/embed"
  key_links:
    - from: "src/components/past-editions/Edition2026Combined.astro"
      to: "src/lib/editions-data.ts"
      via: "import { EDITION_2026 } — supplies photos, youtubeId, replaysUrl, pdfUrl"
      pattern: "import\\s*\\{\\s*EDITION_2026\\s*\\}\\s*from\\s*\"@/lib/editions-data\""
    - from: "src/components/past-editions/Edition2026Combined.astro"
      to: "src/lib/testimonials-data.ts"
      via: "import { TESTIMONIALS } — supplies quote/attribution key references"
      pattern: "import\\s*\\{\\s*TESTIMONIALS\\s*\\}\\s*from\\s*\"@/lib/testimonials-data\""
    - from: "src/components/past-editions/Edition2026Combined.astro"
      to: "src/i18n/utils.ts"
      via: "useTranslations(lang) → t() for heading, rail, video_caption, replays_cta, pdf_cta, pdf_cta_aria, testimonials_heading, thumbnail_alt.{1,2,3}, testimonials.{0,1,2}.{quote,attribution}"
      pattern: "useTranslations\\(lang\\)"
---

<objective>
Create the new Astro SSR component `src/components/past-editions/Edition2026Combined.astro` that merges into one homepage section: 3 event photos, the 2026 conference film (YouTube embed), a "Voir tous les replays" external CTA, a "Télécharger le bilan 2026 (PDF)" external CTA, and 3 testimonial cards. The component is purpose-built (not an extension of `PastEditionSection.astro`) and is NOT mounted to any page in this phase — Phase 26 (Homepage Wiring) handles the atomic homepage swap.

Purpose: Satisfy ROADMAP Phase 23 goal ("Visitors see a single, rich 2026 recap section…") and the 4 success criteria (combined section with 3 photos + embedded film; replays link; PDF link; testimonial cards within the same section). Replaces the current separate `PastEditionSection` (2026 variant) + `TestimonialsStrip` marquee as the homepage 2026 block starting in Phase 26.

Output: One new Astro component file. No changes to existing components, pages, or data modules in this plan.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/23-edition-2026-combined-section/23-CONTEXT.md
@.planning/phases/23-edition-2026-combined-section/23-UI-SPEC.md
@.planning/phases/23-edition-2026-combined-section/23-PATTERNS.md
@.planning/phases/23-edition-2026-combined-section/23-01-SUMMARY.md
@.planning/research/ARCHITECTURE.md
@.planning/research/PITFALLS.md
@src/components/past-editions/PastEditionSection.astro
@src/components/testimonials/TestimonialsStrip.astro
@src/lib/editions-data.ts
@src/lib/testimonials-data.ts
@src/i18n/utils.ts

<interfaces>
<!-- Props interface (UI-SPEC §Props Interface, verbatim). Executor MUST export this from the component. -->
```typescript
import type { ImageMetadata } from "astro";

export interface Props {
  /** Anchor id for deep-linking. Recommended: "edition-2026". */
  id?: string;
  /** Localised rail label, e.g. t("editions.rail.2026"). */
  rail: string;
  /** Localised h2 copy, e.g. t("editions.2026.heading"). */
  heading: string;
  /** Localised h3 copy for the testimonials sub-section. */
  testimonialsHeading: string;
  /** 3 photos in render order. Size assignments per UI-SPEC §3. */
  photos: ReadonlyArray<{ src: ImageMetadata; alt: string; size: "hero" | "medium" }>;
  /** YouTube embed config — uses youtube-nocookie. */
  video: { youtubeId: string; caption: string };
  /** External CTA: 2026 replays YouTube playlist. */
  replaysCta: { label: string; href: string };
  /** External CTA: Google Drive one-pager PDF. */
  pdfCta: { label: string; href: string; ariaLabel: string };
  /** Testimonials list. Component slices to first 3 if longer. */
  testimonials: ReadonlyArray<{ quote: string; attribution: string }>;
}
```

<!-- Data assembly (inside the component's frontmatter — Phase 23 approach): -->
<!-- The component resolves its OWN i18n + data instead of requiring callers to thread everything. -->
<!-- This simplifies the Phase 26 mount site to <Edition2026Combined /> with no props. -->
<!-- BUT we still declare the Props interface above for future flexibility (UI-SPEC §Props Interface). -->
```ts
import { EDITION_2026 } from "@/lib/editions-data";
import { TESTIMONIALS } from "@/lib/testimonials-data";
import { getLangFromUrl, useTranslations } from "@/i18n/utils";

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);

// Derive the render-ready data from imports + i18n:
// Literal string keys pass through t() directly (they match keyof (typeof ui)[typeof defaultLang]).
// Variable-typed keys (p.altKey: string, item.quoteKey: `testimonials.${number}.quote`) need a cast — project convention is `as any` (see src/components/schedule/ScheduleGrid.astro lines 174, 233: `t(`schedule.format.${fmt}` as any)`).
const photos = EDITION_2026.thumbnails.map((p) => ({
  src: p.src,
  alt: t(p.altKey as any),
  size: p.size as "hero" | "medium",
}));
const video = {
  youtubeId: EDITION_2026.youtubeId,
  caption: t("editions.2026.video_caption"),
};
const replaysCta = {
  label: t("editions.2026.replays_cta"),
  href: EDITION_2026.replaysUrl,
};
const pdfCta = {
  label: t("editions.2026.pdf_cta"),
  href: EDITION_2026.pdfUrl,
  ariaLabel: t("editions.2026.pdf_cta_aria"),
};
const testimonials = TESTIMONIALS.slice(0, 3).map((item) => ({
  quote: t(item.quoteKey as any),
  attribution: t(item.attributionKey as any),
}));
const rail = t("editions.rail.2026");
const heading = t("editions.2026.heading");
const testimonialsHeading = t("editions.2026.testimonials_heading");
const { id = "edition-2026" } = Astro.props as Props;
```

**Type-cast note (verified against the codebase):** Literal string keys like `"editions.2026.replays_cta"` match `t()`'s parameter type `keyof (typeof ui)[typeof defaultLang]` directly — NO cast needed. Variable-typed keys do need casts:
- `p.altKey` — typed as plain `string` in `Thumbnail` (see `src/lib/editions-data.ts` line 34). Use `as any`.
- `item.quoteKey` / `item.attributionKey` — typed as template literal ``` `testimonials.${number}.quote` ``` in `Testimonial` (see `src/lib/testimonials-data.ts` lines 16-17). Use `as any`.

The `as any` cast is the established project convention — see `src/components/schedule/ScheduleGrid.astro` lines 174 (`t(`schedule.format.${fmt}` as any)`) and 233 (`t(`schedule.level.${lv}` as any)`). Do NOT invent `as Parameters<typeof t>[0]`, `as keyof typeof ui.fr`, or any other cast form — match the established pattern.

<!-- colSpan map (UI-SPEC §3 — OVERRIDES the analog's md:col-span-4 for medium): -->
```ts
const colSpan = {
  hero:   "col-span-12 md:col-span-6",
  medium: "col-span-6  md:col-span-3",
} as const;
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Create Edition2026Combined.astro with all 6 blocks per UI-SPEC stacking order</name>
  <files>src/components/past-editions/Edition2026Combined.astro</files>

  <read_first>
    - .planning/phases/23-edition-2026-combined-section/23-UI-SPEC.md §"Component Anatomy & Layout" (stacking order diagram + block-by-block contract), §"Copywriting Contract" (i18n keys), §"Responsive behaviour", §"Accessibility checklist", §"Props Interface"
    - .planning/phases/23-edition-2026-combined-section/23-PATTERNS.md §"Edition2026Combined.astro (CREATE — Astro SSR section)" in full — it contains verbatim code excerpts for imports, section container, rail, heading, mosaic grid, YouTube embed, CTA row, testimonial cards
    - src/components/past-editions/PastEditionSection.astro (full file — the primary analog; copy its section container line 54, rail lines 76-80, h2 lines 83-85, mosaic grid lines 47-52 + 98-112, iframe lines 115-127; do NOT copy the playlistCta lines 128-137)
    - src/components/testimonials/TestimonialsStrip.astro (full file — extract card styling tokens from lines 83-101; do NOT copy the marquee CSS at lines 25-44, 70-82, 104-132, 135-156)
    - src/components/past-editions/PastEditionMinimal.astro (reference for DS-token discipline)
    - src/lib/editions-data.ts (post Task 23-01-1; confirms thumbnails/replaysUrl/pdfUrl shape)
    - src/lib/testimonials-data.ts (read full file — confirms TESTIMONIALS shape: each item has `quoteKey` and `attributionKey`)
    - src/i18n/utils.ts (confirms `getLangFromUrl(Astro.url)` + `useTranslations(lang)` pattern and any type narrowing used for keys)
    - src/i18n/ui.ts (post Task 23-01-2; confirms the 4 new keys resolve in both fr and en)
  </read_first>

  <action>
    Create `src/components/past-editions/Edition2026Combined.astro` with the following exact structure. The component is pure Astro SSR, resolves its own i18n + data (so Phase 26 can mount it with no props), and exports a `Props` interface for future flexibility.

    **Frontmatter (between `---` fences):**

    ```astro
    ---
    import { Image } from "astro:assets";
    import type { ImageMetadata } from "astro";
    import { EDITION_2026 } from "@/lib/editions-data";
    import { TESTIMONIALS } from "@/lib/testimonials-data";
    import { getLangFromUrl, useTranslations } from "@/i18n/utils";

    export interface Props {
      id?: string;
      rail?: string;
      heading?: string;
      testimonialsHeading?: string;
      photos?: ReadonlyArray<{ src: ImageMetadata; alt: string; size: "hero" | "medium" }>;
      video?: { youtubeId: string; caption: string };
      replaysCta?: { label: string; href: string };
      pdfCta?: { label: string; href: string; ariaLabel: string };
      testimonials?: ReadonlyArray<{ quote: string; attribution: string }>;
    }

    const lang = getLangFromUrl(Astro.url);
    const t = useTranslations(lang);

    const props = Astro.props as Props;

    const id = props.id ?? "edition-2026";
    const rail = props.rail ?? t("editions.rail.2026");
    const heading = props.heading ?? t("editions.2026.heading");
    const testimonialsHeading = props.testimonialsHeading ?? t("editions.2026.testimonials_heading");
    const photos = props.photos ?? EDITION_2026.thumbnails.map((p) => ({
      src: p.src,
      alt: t(p.altKey as any),
      size: p.size as "hero" | "medium",
    }));
    const video = props.video ?? {
      youtubeId: EDITION_2026.youtubeId,
      caption: t("editions.2026.video_caption"),
    };
    const replaysCta = props.replaysCta ?? {
      label: t("editions.2026.replays_cta"),
      href: EDITION_2026.replaysUrl,
    };
    const pdfCta = props.pdfCta ?? {
      label: t("editions.2026.pdf_cta"),
      href: EDITION_2026.pdfUrl,
      ariaLabel: t("editions.2026.pdf_cta_aria"),
    };
    const testimonials = props.testimonials ?? TESTIMONIALS.slice(0, 3).map((item) => ({
      quote: t(item.quoteKey as any),
      attribution: t(item.attributionKey as any),
    }));

    const colSpan = {
      hero: "col-span-12 md:col-span-6",
      medium: "col-span-6 md:col-span-3",
    } as const;
    ---
    ```

    **Type-cast pattern (verified against the codebase):**
    - Literal string keys like `t("editions.2026.replays_cta")` need NO cast — they already satisfy `t()`'s parameter type `keyof (typeof ui)[typeof defaultLang]`.
    - Variable-typed keys DO need a cast. Project convention is `as any`:
      - `p.altKey` is typed `string` in `src/lib/editions-data.ts` line 34 (`type Thumbnail = { src: ImageMetadata; altKey: string; size: ... }`).
      - `item.quoteKey` / `item.attributionKey` are template-literal types in `src/lib/testimonials-data.ts` lines 16-17.
    - The `as any` form matches `src/components/schedule/ScheduleGrid.astro` line 174 (`t(\`schedule.format.${fmt}\` as any)`) and line 233 (`t(\`schedule.level.${lv}\` as any)`) — these are the only analogs in the codebase where a variable is passed to `t()`. Do NOT introduce a stricter cast form; match the established pattern.

    **Template body (after the closing `---`):** reproduce the UI-SPEC Component Anatomy order exactly. Use this scaffold:

    ```astro
    <section id={id} class="relative max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-16 md:py-24">
      {/* 1. Rotated rail (decorative, hidden on mobile) */}
      <p
        class="absolute left-0 top-24 hidden md:block rotate-[-90deg] origin-top-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
      >
        {rail}
      </p>

      {/* 2. Section heading (single h2 per UI-SPEC Pitfall 8 mitigation) */}
      <h2
        class="text-3xl md:text-4xl font-bold text-foreground tracking-tight"
        style="letter-spacing:-0.02em;"
      >
        {heading}
      </h2>

      {/* 3. Photo mosaic — 3 thumbnails, 1 hero + 2 medium */}
      {photos && photos.length > 0 && (
        <div class="mt-12 grid grid-cols-12 gap-3 md:gap-4 [grid-auto-rows:12rem] md:[grid-auto-rows:14rem]">
          {photos.map((p) => (
            <figure
              class={`${colSpan[p.size]} row-span-1 overflow-hidden rounded-md bg-card border border-border`}
            >
              <Image
                src={p.src}
                alt={p.alt}
                widths={[400, 800, 1200]}
                sizes="(min-width: 768px) 33vw, 100vw"
                class="w-full h-full object-cover"
              />
            </figure>
          ))}
        </div>
      )}

      {/* 4. YouTube video embed (youtube-nocookie per D-12) */}
      {video && (
        <figure class="mt-12 max-w-2xl mx-auto">
          <div class="relative aspect-video w-full overflow-hidden rounded-md bg-card">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}`}
              title={video.caption}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              class="absolute inset-0 h-full w-full"
            />
          </div>
          <figcaption class="mt-3 text-sm text-muted-foreground">{video.caption}</figcaption>
        </figure>
      )}

      {/* 5. CTA row — replays + PDF, stacked mobile, side-by-side desktop */}
      <div class="mt-8 flex flex-col sm:flex-row gap-4 sm:gap-8 max-w-2xl mx-auto">
        <a
          href={replaysCta.href}
          class="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          rel="noopener noreferrer"
          target="_blank"
        >
          {replaysCta.label} <span aria-hidden="true">→</span>
        </a>
        <a
          href={pdfCta.href}
          class="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          rel="noopener noreferrer"
          target="_blank"
          aria-label={pdfCta.ariaLabel}
        >
          {pdfCta.label} <span aria-hidden="true">→</span>
        </a>
      </div>

      {/* 6. Testimonials block — h3 + 3-up grid, static cards (no marquee) */}
      {testimonials.length > 0 && (
        <div class="mt-12">
          <h3 class="text-xl md:text-2xl font-semibold text-foreground tracking-tight">
            {testimonialsHeading}
          </h3>
          <ul class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 list-none p-0">
            {testimonials.map((item) => (
              <li class="rounded-md border border-border bg-card text-card-foreground p-6 md:p-7">
                <blockquote class="text-base md:text-lg italic leading-relaxed text-card-foreground m-0">
                  {item.quote}
                </blockquote>
                <p class="mt-4 text-sm text-muted-foreground m-0">{item.attribution}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
    ```

    **DO NOT:**
    - Add any `client:*` directive (component is pure SSR — D-02).
    - Import `TestimonialsStrip.astro`, `PastEditionSection.astro`, or any other analog (copy patterns, do not extend — D-01, D-03).
    - Import `lucide-react` or any icon library (inline SVG only; the `→` is a plain text arrow — per UI-SPEC §Design System).
    - Add a `<style>` block with marquee keyframes or any `@media (prefers-reduced-motion)` override (global CSS at `global.css` lines 103-112 handles it).
    - Use `bg-accent`, `text-accent`, or `border-accent` anywhere (accent Pink is reserved for Phase 25 Hero — UI-SPEC §Color).
    - Add any ad-hoc hex/rgb color; only DS tokens from the whitelist (UI-SPEC §Design System token whitelist).
    - Modify `src/pages/index.astro`, `src/pages/en/index.astro`, or any other existing file — mounting is Phase 26's job (CONTEXT §Phase Boundary).
    - Add a stats row inside this component — UI-SPEC Discretion Resolutions drops it because KeyNumbers sits directly above in the new homepage order.
  </action>

  <verify>
    <automated>bun run astro check &amp;&amp; bun run build</automated>
  </verify>

  <acceptance_criteria>
    - File `src/components/past-editions/Edition2026Combined.astro` exists
    - `wc -l src/components/past-editions/Edition2026Combined.astro` returns >= 80 lines
    - `grep -c 'youtube-nocookie.com/embed' src/components/past-editions/Edition2026Combined.astro` returns exactly 1
    - `grep -c 'rel="noopener noreferrer"' src/components/past-editions/Edition2026Combined.astro` returns exactly 2 (one per CTA anchor)
    - `grep -c 'target="_blank"' src/components/past-editions/Edition2026Combined.astro` returns exactly 2
    - `grep -c 'client:' src/components/past-editions/Edition2026Combined.astro` returns 0 (zero hydration directives)
    - `grep -c 'import.*from.*"@/lib/editions-data"' src/components/past-editions/Edition2026Combined.astro` returns exactly 1
    - `grep -c 'import.*from.*"@/lib/testimonials-data"' src/components/past-editions/Edition2026Combined.astro` returns exactly 1
    - `grep -c 'import.*useTranslations.*from.*"@/i18n/utils"' src/components/past-editions/Edition2026Combined.astro` returns exactly 1
    - `grep -cE 'id=\{?["\x27]?edition-2026["\x27]?' src/components/past-editions/Edition2026Combined.astro` returns at least 1 (default id fallback)
    - `grep -n '<h2' src/components/past-editions/Edition2026Combined.astro` returns exactly 1 match (Pitfall 8: single h2 per section)
    - `grep -n '<h3' src/components/past-editions/Edition2026Combined.astro` returns exactly 1 match (testimonials sub-heading)
    - `grep -c 'aria-label=' src/components/past-editions/Edition2026Combined.astro` returns at least 1 (PDF anchor aria-label)
    - `grep -n 'bg-accent\|text-accent\|border-accent' src/components/past-editions/Edition2026Combined.astro` returns 0 matches (accent reserved for Hero)
    - `grep -nE '#[0-9a-fA-F]{3,8}|rgb\(|rgba\(' src/components/past-editions/Edition2026Combined.astro` returns 0 matches (DS tokens only, no ad-hoc colors)
    - `grep -c 'TESTIMONIALS' src/components/past-editions/Edition2026Combined.astro` returns at least 1
    - `grep -c 'EDITION_2026' src/components/past-editions/Edition2026Combined.astro` returns at least 1
    - `grep -c 'editions.2026.replays_cta' src/components/past-editions/Edition2026Combined.astro` returns exactly 1
    - `grep -c 'editions.2026.pdf_cta' src/components/past-editions/Edition2026Combined.astro` returns at least 2 (pdf_cta label + pdf_cta_aria)
    - `grep -c 'editions.2026.testimonials_heading' src/components/past-editions/Edition2026Combined.astro` returns exactly 1
    - `grep -c 'col-span-12 md:col-span-6' src/components/past-editions/Edition2026Combined.astro` returns at least 1 (hero mosaic slot)
    - `grep -c 'col-span-6  md:col-span-3\|col-span-6 md:col-span-3' src/components/past-editions/Edition2026Combined.astro` returns at least 1 (medium slot uses md:col-span-3 per UI-SPEC override — NOT md:col-span-4)
    - `grep -n 'md:col-span-4' src/components/past-editions/Edition2026Combined.astro` returns 0 matches (analog's medium value must NOT appear)
    - `grep -c 'src/pages/index.astro\|src/pages/en/index.astro' src/components/past-editions/Edition2026Combined.astro` returns 0 (the component does not reference page files; this also prevents accidental mounting)
    - `git status --porcelain src/pages/` returns empty (no page files modified in this plan)
    - `bun run astro check` exits with code 0
    - `bun run build` exits with code 0
  </acceptance_criteria>

  <done>
    `src/components/past-editions/Edition2026Combined.astro` is a pure-SSR component that renders the 6-block anatomy from UI-SPEC (rail → h2 → 3-photo mosaic → YouTube → replays+PDF CTAs → testimonials h3 + 3 cards). Both `bun run astro check` and `bun run build` pass. No homepage file was modified; Phase 26 will mount the component. The component can be rendered today as `<Edition2026Combined />` with no props (defaults resolve from EDITION_2026 + TESTIMONIALS + i18n), OR fully prop-driven for future callers.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Snapshot verify — full-stack astro check + build + homepage-untouched check</name>
  <files>(no file modifications — final verification task)</files>

  <read_first>
    - src/components/past-editions/Edition2026Combined.astro (the file just created — smoke-check by eye against UI-SPEC §Component Anatomy)
    - src/pages/index.astro (confirm UNTOUCHED — Phase 26 owns this)
    - src/pages/en/index.astro (confirm UNTOUCHED — Phase 26 owns this)
    - .planning/phases/23-edition-2026-combined-section/23-UI-SPEC.md §"Accessibility checklist"
  </read_first>

  <action>
    1. Run `bun run astro check` and capture exit code. Must be 0.
    2. Run `bun run build` and capture exit code. Must be 0. Confirm the build output does not mention `ambiance-08` (orphan import fully removed by plan 23-01-1) and does not warn about an unused import from the new component.
    3. Run `git status --porcelain` — the output must only list:
       - `src/components/past-editions/Edition2026Combined.astro` (new)
       - `src/lib/editions-data.ts` (modified by plan 23-01-1)
       - `src/i18n/ui.ts` (modified by plan 23-01-2)
       - Any `.planning/phases/23-*/23-0X-SUMMARY.md` files produced along the way.

       The output MUST NOT list `src/pages/index.astro`, `src/pages/en/index.astro`, `src/components/past-editions/PastEditionSection.astro`, or `src/components/testimonials/TestimonialsStrip.astro`. If any of those four files appear, the plan has violated its scope (Phase 26 owns mounting) — revert the offending change before signing off.
    4. Spot-check the accessibility checklist from UI-SPEC §Accessibility: read the new component and confirm — single `<h2>`, `<h3>` for testimonials sub-head, every photo has an `alt` prop threaded from `t(...)`, iframe has a `title`, PDF anchor has `aria-label`, both external CTAs have `target="_blank" rel="noopener noreferrer"`, section has `id="edition-2026"`, zero `client:*` directives. Report any deviation.

    No file modifications in this task.
  </action>

  <verify>
    <automated>bun run astro check &amp;&amp; bun run build</automated>
  </verify>

  <acceptance_criteria>
    - `bun run astro check` exits with code 0
    - `bun run build` exits with code 0
    - `git status --porcelain src/pages/index.astro` returns empty
    - `git status --porcelain src/pages/en/index.astro` returns empty
    - `git status --porcelain src/components/past-editions/PastEditionSection.astro` returns empty
    - `git status --porcelain src/components/testimonials/TestimonialsStrip.astro` returns empty
    - `git status --porcelain src/components/past-editions/Edition2026Combined.astro` shows the file as new/added (`A` or `??`)
    - Accessibility spot-check: single h2, single h3, all photos have alt, iframe has title, PDF anchor has aria-label, both CTAs have target+rel, section has id="edition-2026", zero `client:*` — all confirmed via read-back and grep (criteria duplicated from Task 1 for belt-and-suspenders)
  </acceptance_criteria>

  <done>
    Full-stack astro check and build are green. The only files touched across Phase 23 are `src/lib/editions-data.ts`, `src/i18n/ui.ts`, and the new `Edition2026Combined.astro` (plus SUMMARY files). Homepage files are untouched, preserving Phase 26's atomic mount surface. Phase 23 is complete.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Visitor browser ↔ third-party host (YouTube, Google Drive) | User clicks an anchor or loads an iframe sourced from an external origin; the rendered HTML passes user navigation into untrusted territory. |
| Build-time data module ↔ compiled Astro component | `EDITION_2026.replaysUrl` / `pdfUrl` are typed-const string literals committed to source; no runtime input crosses this boundary in Phase 23. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-23-01 | Information Disclosure | External-CTA anchors (`<a href={replaysUrl}>`, `<a href={pdfUrl}>`) | mitigate | Both anchors carry `target="_blank" rel="noopener noreferrer"` (D-11). `noopener` prevents the new tab from accessing `window.opener` (reverse-tabnabbing); `noreferrer` strips the Referer header so the external host does not receive the homepage URL. Verified via acceptance-criteria grep in Task 1 (`grep -c 'rel="noopener noreferrer"' returns exactly 2`). |
| T-23-02 | Information Disclosure | YouTube video iframe | mitigate | Iframe `src` uses `https://www.youtube-nocookie.com/embed/${id}` (D-12) — YouTube's privacy-enhanced mode that does NOT set tracking cookies until the user actually plays the video. No additional `rel` attributes required on `<iframe>` (they apply to `<a>`). Verified by acceptance-criteria grep in Task 1 (`grep -c 'youtube-nocookie.com/embed' returns 1`). |
| T-23-03 | Denial of Service (availability of linked content) | External Google Drive PDF link and YouTube playlist link | accept | If Drive removes the PDF or the YouTube playlist becomes private, the CTA click leads to a broken destination. No fallback copy in this phase — browser-level error surface is acceptable (UI-SPEC §Copywriting Contract "Error state: N/A"). Risk is low-value: the one-pager and replays list are organizer-controlled resources, rotated by the organizer if broken. Accepted because adding fallback UI would scope-creep into content-state management. |

No user input is accepted, no form is rendered, no auth surface exists. Spoofing / Tampering / Repudiation / Elevation-of-privilege do not apply to a pure-SSR content component.
</threat_model>

<verification>
- `src/components/past-editions/Edition2026Combined.astro` exists with all 6 blocks in UI-SPEC order.
- `bun run astro check` and `bun run build` both exit 0.
- No homepage file, no existing component, no data module beyond the 23-01 edits was touched.
- Accessibility checklist satisfied (single h2, h3 sub-head, alt text, iframe title, aria-label on PDF, external-link hygiene, anchor id, zero hydration).
- Threat model documented; mitigations verifiable via grep acceptance criteria in Task 1.
</verification>

<success_criteria>
All four ROADMAP Phase 23 success criteria addressed by the output of plans 23-01 + 23-02 together:
1. **Homepage combined 2026 section with 3 photos + embedded film** — component renders the 3-photo mosaic (photos block) and YouTube iframe (video block) within one `<section>`. Mounting is Phase 26.
2. **"Voir tous les replays" link** — CTA row renders `<a href={replaysUrl}>` with `editions.2026.replays_cta` label (FR/EN).
3. **"Télécharger le bilan 2026 (PDF)" link** — CTA row renders `<a href={pdfUrl}>` with `editions.2026.pdf_cta` label and aria-label (FR/EN).
4. **Testimonial cards within the same section** — testimonials block renders h3 + 3-up grid from TESTIMONIALS, replacing the old separate TestimonialsStrip marquee when Phase 26 swaps the homepage.

Additional success: pure-SSR discipline, DS-token-only styling, external-link hygiene, threat model documented, homepage files untouched.
</success_criteria>

<output>
After completion, create `.planning/phases/23-edition-2026-combined-section/23-02-SUMMARY.md` covering:
- Component scaffolded (path + line count + first/last 10 lines excerpt).
- Stacking order confirmed against UI-SPEC §Component Anatomy.
- Astro check + build exit codes.
- Accessibility checklist pass/fail line-by-line (single h2, h3 sub-head, alt text present on all 3 photos, iframe title, PDF aria-label, target+rel pair on both CTAs, anchor id, zero hydration).
- Threat mitigation verification (the 3 grep-verifiable mitigations from the threat model).
- Confirmation that `src/pages/*.astro` were NOT modified (Phase 26's domain).
</output>
