# Phase 23: Edition 2026 Combined Section — Pattern Map

**Mapped:** 2026-04-18
**Files analyzed:** 3 (1 create + 2 modify)
**Analogs found:** 3 / 3 (all have exact-role + similar data-flow matches inside the same codebase)

## File Classification

| File | Action | Role | Data Flow | Closest Analog | Match Quality |
|------|--------|------|-----------|----------------|---------------|
| `src/components/past-editions/Edition2026Combined.astro` | CREATE | component (Astro SSR section) | build-time / request-response (no async) | `src/components/past-editions/PastEditionSection.astro` (+ `src/components/testimonials/TestimonialsStrip.astro` for card chrome) | exact role, partial-flow — analog carries all mosaic + video + CTA patterns; card shell imported from TestimonialsStrip |
| `src/lib/editions-data.ts` | MODIFY | data / config (typed const module) | build-time static | itself — mutation only; no structural analog needed | in-place edit |
| `src/i18n/ui.ts` | MODIFY | config (i18n dictionary) | build-time static | itself (block at lines 206–219 FR / 495–508 EN) | in-place edit |

## Pattern Assignments

### `src/components/past-editions/Edition2026Combined.astro` (CREATE — Astro SSR section)

**Primary analog:** `src/components/past-editions/PastEditionSection.astro`
**Secondary analog (card chrome only):** `src/components/testimonials/TestimonialsStrip.astro`

Per D-01 + Anti-Pattern 1 in ARCHITECTURE.md, this is a **purpose-built** component. Copy the patterns verbatim — do **not** import or extend the analog files.

#### Imports + i18n boot (PastEditionSection.astro lines 14–16, 44–45)

```astro
---
import { Image } from "astro:assets";
import type { ImageMetadata } from "astro";
import { getLangFromUrl, useTranslations } from "@/i18n/utils";

// ...props destructure...

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
---
```

**Notes:**
- Same import order (astro:assets → types → i18n utils) as every past-editions component.
- Path alias `@/i18n/utils` is the project convention (see `src/i18n/utils.ts` — `useTranslations` returns `t(key)` with silent FR fallback, line 20).
- No React, no hydration, no `client:*`. Pure Astro SSR per D-02.

#### Section container + anchor id (PastEditionSection.astro line 54)

```astro
<section id={id} class="relative max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-16 md:py-24">
```

**Verbatim copy.** UI-SPEC §Spacing-Scale locks this container as "matches `PastEditionSection.astro` line 54 — locked rhythm with neighbours". Recommended `id="edition-2026"` per UI-SPEC accessibility checklist.

#### Rotated rail label (PastEditionSection.astro lines 76–80)

```astro
<p
  class="absolute left-0 top-24 hidden md:block rotate-[-90deg] origin-top-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
>
  {rail}
</p>
```

**Verbatim copy.** UI-SPEC §Discretion Resolutions: "KEEP rail (`editions.rail.2026`)".

#### Section heading h2 (PastEditionSection.astro lines 83–85)

```astro
<h2 class="text-3xl md:text-4xl font-bold text-foreground tracking-tight" style="letter-spacing:-0.02em;">
  {heading}
</h2>
```

**Verbatim copy.** UI-SPEC §Typography locks this line as the reference.

#### Photo mosaic grid + `colSpan` map (PastEditionSection.astro lines 47–52, 98–112)

```ts
/** Tailwind col-span map for mosaic sizes. */
const colSpan = {
  hero: "col-span-12 md:col-span-6",
  medium: "col-span-6 md:col-span-4",   // ⚠ UI-SPEC §3 overrides to "col-span-6  md:col-span-3"
  small: "col-span-6 md:col-span-3",
} as const;
```

```astro
{photos && photos.length > 0 && (
  <div class="mt-12 grid grid-cols-12 gap-3 md:gap-4 [grid-auto-rows:12rem] md:[grid-auto-rows:14rem]">
    {photos.map((p) => (
      <figure class={`${colSpan[p.size ?? "small"]} row-span-1 overflow-hidden rounded-md bg-card border border-border`}>
        <Image
          src={p.src}
          alt={p.alt}
          widths={[400, 800, 1200]}
          sizes="(min-width: 768px) 33vw, (min-width: 768px) 33vw, 100vw"
          class="w-full h-full object-cover"
        />
      </figure>
    ))}
  </div>
)}
```

**UI-SPEC override (§3 Photo mosaic):** use `medium: "col-span-6 md:col-span-3"` (not `md:col-span-4`) so the 1×hero + 2×medium row fills exactly 12 columns on desktop (6 + 3 + 3). Keep everything else verbatim.

#### YouTube embed (PastEditionSection.astro lines 115–127, drop the `playlistCta` sibling)

```astro
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
      ></iframe>
    </div>
    <figcaption class="mt-3 text-sm text-muted-foreground">{video.caption}</figcaption>
  </figure>
)}
```

**Drop the `playlistCta` block (PastEditionSection.astro lines 128–137)** — CTAs live in the dedicated CTA row below (UI-SPEC §Block 4). Keep `youtube-nocookie.com/embed/${id}` per D-12 and `loading="lazy"` per privacy pattern.

#### Gallery-CTA anchor pattern — apply twice (PastEditionSection.astro lines 152–162)

```astro
<a
  href={galleryCta.href}
  class="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
  rel="noopener"
  target="_blank"
>
  {galleryCta.label} <span aria-hidden="true">→</span>
</a>
```

**UI-SPEC §Block 5 adaptation** — wrap TWO anchors in a flex row:

```astro
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
```

**Pattern notes:**
- Analog uses `rel="noopener"`; D-11 and PITFALLS.md #6 require `rel="noopener noreferrer"` — **upgrade to the full `noopener noreferrer` pair** on both new CTAs.
- PDF CTA carries `aria-label` for screen-reader "(PDF, new window)" affordance (PITFALLS.md #6).
- Note the analog uses `inline-block` in line 131 for the `playlistCta` variant and `inline-flex items-center gap-2` for the gallery CTA (line 156) — use the **gallery CTA flavor** (with arrow span) for both new CTAs.

#### Testimonial cards block — copy card chrome only (TestimonialsStrip.astro lines 83–101)

From `TestimonialsStrip.astro`, extract the static card style tokens (border + radius + background + italic quote + muted attribution) but **drop** the marquee animation, duplicate track, mask-image, and `prefers-reduced-motion` overrides.

```astro
<!-- UI-SPEC Block 6 — static 3-up grid -->
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
```

**Translated tokens from the analog's `<style>` block:**

| Analog CSS (TestimonialsStrip.astro) | New Tailwind equivalent | Source line |
|--------------------------------------|-------------------------|-------------|
| `padding: 1.75rem` | `p-6 md:p-7` (24/28px) | line 86 |
| `border: 1px solid var(--color-border)` | `border border-border` | line 87 |
| `border-radius: var(--radius)` | `rounded-md` | line 88 |
| `background: var(--color-card)` | `bg-card` | line 89 |
| `color: var(--color-card-foreground)` | `text-card-foreground` | line 90 |
| `font-size: 1.125rem; line-height: 1.6; font-style: italic` on `.quote` | `text-base md:text-lg italic leading-relaxed` | lines 93–96 |
| `.attribution` font-size 0.875rem + muted-foreground | `text-sm text-muted-foreground` | lines 98–101 |

**Do NOT copy** lines 25–44 (marquee tracks, duplicate track, `inert`, `aria-hidden`), lines 70–82 (marquee flex), lines 104–132 (keyframes, mask-image, animation), lines 135–156 (hover/focus pause, `prefers-reduced-motion` fallback). These are marquee-only concerns; UI-SPEC §Block 6 explicitly drops them.

**Heading level:** `<h3>`, not `<h2>` — PITFALLS.md #8 ("Merging Testimonials into Edition 2026 Section Breaks Heading Hierarchy"). The section `<h2>` is the 2026 heading; testimonials become a sub-section.

**Defensive guard:** `testimonials.length > 0` wraps the whole block (UI-SPEC §Copywriting Contract: "Empty state heading: Not user-facing — testimonials are a static const (`TESTIMONIALS` array of length 3) … If the array is ever empty (defensive only), guard …").

**List reset:** include `list-none p-0` on the `<ul>` and `m-0` on `<blockquote>` / `<p>` — the analog's CSS-scoped reset (`.marquee-track { margin: 0; padding: 0; list-style: none; }`, line 80) is not inherited when we switch to Tailwind. Without these resets the cards will carry default UA `<ul>` / `<blockquote>` spacing.

#### Props interface (UI-SPEC §Props Interface, supersedes ARCHITECTURE.md draft)

```typescript
import type { ImageMetadata } from "astro";

export interface Props {
  id?: string;
  rail: string;
  heading: string;
  testimonialsHeading: string;
  photos: ReadonlyArray<{ src: ImageMetadata; alt: string; size: "hero" | "medium" }>;
  video: { youtubeId: string; caption: string };
  replaysCta: { label: string; href: string };
  pdfCta: { label: string; href: string; ariaLabel: string };
  testimonials: ReadonlyArray<{ quote: string; attribution: string }>;
}
```

**Key differences vs. `PastEditionSection.Props`:**
- `stats` removed (UI-SPEC Discretion: stats row dropped — `KeyNumbers` sits directly above this section).
- `brandCallout`, `galleryCta`, `placeholder`, `trackerUrl` removed (2026-specific, no placeholder state).
- `photos` size narrowed to `"hero" | "medium"` (no "small"); `size` is **required** (matches UI-SPEC mosaic assignment).
- `replaysCta` + `pdfCta` (new) replace the analog's single `video.playlistCta` + `galleryCta`.
- `testimonials` + `testimonialsHeading` (new).

---

### `src/lib/editions-data.ts` (MODIFY — typed const mutation, D-04/D-05/D-06)

**Analog:** self (in-place mutation). No new structural pattern — the file already uses the canonical `as const satisfies ReadonlyArray<Thumbnail>` pattern.

#### Current state (lines 25–56) — relevant excerpt

```ts
import ambiance03 from "@/assets/photos/ambiance/ambiance-03.jpg";
import ambiance06 from "@/assets/photos/ambiance/ambiance-06.jpg";
import ambiance08 from "@/assets/photos/ambiance/ambiance-08.jpg";   // ← line 27, will become orphan
import ambiance10 from "@/assets/photos/ambiance/ambiance-10.jpg";
// ...
export const EDITION_2026 = {
  youtubeId: "qyMGuU2-w8o",
  galleryUrl:
    "https://albums.ente.io/?t=QRX4L3WBSD#5jsodRK1mQbqS83qJMd2sVBZr9oW4Bzgm9DuVP6MowY5",
  stats: [
    { value: "1700+", labelKey: "editions.2026.stats.participants" },
    { value: "50+",   labelKey: "editions.2026.stats.speakers" },
    { value: "40+",   labelKey: "editions.2026.stats.sessions" },
  ] as const satisfies ReadonlyArray<Stat>,
  thumbnails: [
    { src: ambiance03, altKey: "editions.2026.thumbnail_alt.1", size: "hero" },
    { src: ambiance08, altKey: "editions.2026.thumbnail_alt.2", size: "hero" },
    { src: ambiance06, altKey: "editions.2026.thumbnail_alt.3", size: "hero" },
    { src: ambiance10, altKey: "editions.2026.thumbnail_alt.4", size: "hero" },
  ] as const satisfies ReadonlyArray<Thumbnail>,
  placeholder: false,
} as const;
```

#### Target state — three edits

1. **Remove `ambiance08` import** (line 27). It becomes orphan after D-04 — leaving it in causes Astro to still bundle the asset (PITFALLS.md #12 logic applied to 2026 instead of 2023).
2. **Add `replaysUrl`** after `galleryUrl` (D-05). Use the clean playlist URL form per CONTEXT specifics.
3. **Add `pdfUrl`** after `replaysUrl` (D-06).
4. **Replace `thumbnails`** with a 3-element array in the new order + new `size` values (D-04 + UI-SPEC §3). Preserve `as const satisfies ReadonlyArray<Thumbnail>`.

```ts
export const EDITION_2026 = {
  youtubeId: "qyMGuU2-w8o",
  galleryUrl:
    "https://albums.ente.io/?t=QRX4L3WBSD#5jsodRK1mQbqS83qJMd2sVBZr9oW4Bzgm9DuVP6MowY5",
  // NEW (D-05) — 2026 replays YouTube playlist
  replaysUrl:
    "https://www.youtube.com/playlist?list=PLmZ3gFl2Aqt_4_F40zEoUEweEctmtx4p2",
  // NEW (D-06) — one-pager bilan 2026 PDF on Google Drive
  pdfUrl:
    "https://drive.google.com/file/d/1rlrY9EkulGSgeCPenyiN4ZnxWs5BXPBo/view",
  stats: [
    { value: "1700+", labelKey: "editions.2026.stats.participants" },
    { value: "50+",   labelKey: "editions.2026.stats.speakers" },
    { value: "40+",   labelKey: "editions.2026.stats.sessions" },
  ] as const satisfies ReadonlyArray<Stat>,
  // CHANGED (D-04 + UI-SPEC §3) — 3 entries, sized for asymmetric mosaic
  thumbnails: [
    { src: ambiance03, altKey: "editions.2026.thumbnail_alt.1", size: "hero"   },
    { src: ambiance06, altKey: "editions.2026.thumbnail_alt.2", size: "medium" },
    { src: ambiance10, altKey: "editions.2026.thumbnail_alt.3", size: "medium" },
  ] as const satisfies ReadonlyArray<Thumbnail>,
  placeholder: false,
} as const;
```

**Alt-key reassignment note (UI-SPEC §i18n Key Manifest):**
- Slot 2 now uses `thumbnail_alt.2` ("moment de networking") for `ambiance06` — copy still matches; no i18n edit needed.
- Slot 3 now uses `thumbnail_alt.3` ("session technique") for `ambiance10` — copy semi-matches but is acceptable (overall view is close to "session" framing). If exact fidelity is desired, either:
  - (a) update FR/EN `thumbnail_alt.3` copy to "vue générale de l'événement" / "overall event view"; OR
  - (b) remap slot 3 to reference `thumbnail_alt.4` in `editions-data.ts` (its current copy already says "vue générale").
- `thumbnail_alt.4` becomes orphan; UI-SPEC allows leaving it — clean-up deferred.
- **Planner decision point:** pick (a) OR (b) OR "leave as-is" — all three satisfy A11Y. `(a)` is simplest for copy consistency and documented in UI-SPEC §i18n Key Manifest table row for slot 3.

**Anti-pattern reminder (CLAUDE.md + Anti-Pattern 3 in ARCHITECTURE.md):** Do **not** add inline testimonial data here — testimonials stay in `src/lib/testimonials-data.ts`. Keep data modules single-purpose.

---

### `src/i18n/ui.ts` (MODIFY — 4 new keys × 2 locales, D-07/D-08 + UI-SPEC)

**Analog:** self. Match existing `editions.2026.*` key block style verbatim.

#### FR block — insert after line 218 (current last `editions.2026.*` key)

Existing pattern (lines 206–219):
```ts
    "editions.rail.2026": "EDITION 2026",
    "editions.rail.2023": "EDITION 2023",
    "editions.2026.heading": "Edition 2026 — replay et bilan",
    "editions.2026.video_caption":
      "Aftermovie officiel de Cloud Native Days France 2026",
    "editions.2026.stats.participants": "1\u00a0850+ participants",
    // ...
    "editions.2026.thumbnail_alt.4": "Photo CND France 2026 — vue générale de l'événement",
    "editions.placeholder_badge_aria": "...",
```

New FR keys (insert between the `thumbnail_alt.4` line and the `editions.placeholder_badge_aria` line):

```ts
    "editions.2026.replays_cta": "Voir tous les replays",
    "editions.2026.pdf_cta": "Télécharger le bilan 2026 (PDF)",
    "editions.2026.pdf_cta_aria": "Télécharger le bilan 2026 (PDF, nouvelle fenêtre)",
    "editions.2026.testimonials_heading": "Ils en parlent mieux que nous",
```

#### EN block — insert after line 507 (current last `editions.2026.*` key)

New EN keys (insert between `thumbnail_alt.4` and `editions.placeholder_badge_aria` — mirroring FR):

```ts
    "editions.2026.replays_cta": "Watch all replays",
    "editions.2026.pdf_cta": "Download 2026 report (PDF)",
    "editions.2026.pdf_cta_aria": "Download 2026 report (PDF, new window)",
    "editions.2026.testimonials_heading": "They said it better than we could",
```

**Quote style:** double-quotes + trailing comma on every entry (matches surrounding block; lints consistent).
**Special characters:** FR uses real Unicode em-dash `—` and accented characters (`é`, `è`, `ê`) inline — keep, matches lines 208 + 218.

---

## Shared Patterns

### Pattern: i18n boot (Astro SSR components)

**Source:** `src/i18n/utils.ts` lines 8–22 (consumed by every past-editions component — see `PastEditionSection.astro` lines 16, 44–45; `PastEditionMinimal.astro` does **not** use it because it receives all strings via props).

**Apply to:** `Edition2026Combined.astro` (only new file touching i18n directly).

```astro
---
import { getLangFromUrl, useTranslations } from "@/i18n/utils";
const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
---
```

**PITFALLS.md #2 reminder:** `useTranslations` silently falls back to FR (`ui[lang][key] ?? ui[defaultLang][key]`, line 20 of `utils.ts`). **Therefore all 4 new keys MUST land in both `fr` and `en` in the same commit.** The planner should add a final task: "Verify `Object.keys(ui.fr)` count equals `Object.keys(ui.en)` count after this phase ships."

**Caller-side vs component-side t() decision:** The UI-SPEC props interface threads pre-translated strings (label, heading, ariaLabel) through props — the component itself does NOT call `t()` on those. But the UI-SPEC "Caller-side data assembly" example is consumed by Phase 26 wiring, not Phase 23. **For Phase 23 the component may still import `useTranslations` to pass through alt text during prop assembly inside its frontmatter** — the planner should decide whether the component resolves its own i18n (simpler) or accepts fully-resolved props (cleaner Phase-26 wiring). The UI-SPEC §Props Interface favors the fully-resolved-props approach.

### Pattern: External link hygiene (D-11 + PITFALLS.md #6)

**Source:** `PastEditionSection.astro` line 132 (`rel="noopener"`) — **upgrade to `rel="noopener noreferrer"`** per CONTEXT D-11.

**Apply to:** every outbound `<a>` in `Edition2026Combined.astro` (replays CTA, PDF CTA) and the YouTube `<iframe>` embed uses `youtube-nocookie.com` per D-12 (no extra `rel`).

```astro
<a href={...} rel="noopener noreferrer" target="_blank" aria-label={...}>
  {label} <span aria-hidden="true">→</span>
</a>
```

**PDF-only extra:** `aria-label={pdfCta.ariaLabel}` so SR users hear "(PDF, new window)".

### Pattern: DS tokens only (D-13 + `feedback_stitch_ds_tokens` memory)

**Source:** `TestimonialsStrip.astro` `<style>` block (lines 46–101) + `PastEditionSection.astro` Tailwind classes — both use `var(--color-*)` / `bg-card` / `text-muted-foreground` exclusively.

**Apply to:** all surfaces in `Edition2026Combined.astro`. Whitelist from UI-SPEC §Color: `--color-background`, `--color-foreground`, `--color-card`, `--color-card-foreground`, `--color-secondary`, `--color-muted`, `--color-muted-foreground`, `--color-border`, `--color-primary`, `--color-accent` (RESERVED OUT — do not use), `--radius`, `--font-sans`. **No ad-hoc hex/rgb values.**

### Pattern: `prefers-reduced-motion` is handled globally

**Source:** `global.css` lines 103–112 (per UI-SPEC §Block 6). The new component has no JS animation and no custom `@keyframes`; therefore no local reduced-motion media query is needed.

**Apply to:** `Edition2026Combined.astro` — do NOT copy the `@media (prefers-reduced-motion)` block from `TestimonialsStrip.astro` lines 143–156; it targets the marquee animation which this component does not have.

## No Analog Found

None — all three files have clear in-codebase analogs (two for the new component, in-place for the two modifications).

## Metadata

**Analog search scope:**
- `src/components/past-editions/*.astro` (3 files: `PastEditionSection.astro`, `PastEditionMinimal.astro`, and any adjacent)
- `src/components/testimonials/*.astro` (1 file: `TestimonialsStrip.astro`)
- `src/lib/editions-data.ts`, `src/lib/testimonials-data.ts`
- `src/i18n/ui.ts`, `src/i18n/utils.ts`

**Files scanned:** 8 (3 components + 2 data modules + 2 i18n files + CONTEXT/UI-SPEC/ARCHITECTURE/PITFALLS docs)

**Pattern extraction date:** 2026-04-18
