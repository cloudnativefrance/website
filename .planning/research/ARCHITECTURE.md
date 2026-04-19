# Architecture Patterns: v1.2 Homepage Restructuring

**Domain:** Conference website homepage restructuring
**Researched:** 2026-04-15
**Confidence:** HIGH (all findings based on direct codebase analysis)

## Current Homepage Architecture

Both `src/pages/index.astro` (FR) and `src/pages/en/index.astro` (EN) share identical structure, differing only in import paths and locale-specific `viewPageHref` values.

### Current Section Order
```
HeroSection           (Astro SSR)
KeyNumbers            (React island, client:idle)
CfpSection            (Astro SSR)
TestimonialsStrip     (Astro SSR, CSS marquee)
PastEditionSection    (Astro SSR — 2026 edition)
PastEditionMinimal    (Astro SSR — 2023 edition)
```

### Target Section Order (v1.2 Stitch mockup)
```
HeroSection           (MODIFY — new bg image, +opacity, +3rd CTA)
KeyNumbers            (UNCHANGED)
Edition2026Combined   (NEW — photos + film + replays CTA + PDF CTA + testimonial cards)
Edition2023Minimal    (MODIFY — reduce to logo + text link only, remove photos)
CfpSection            (UNCHANGED)
SponsorsPlatinumStrip (NEW — Platinum tier logos + "Voir tous les sponsors" link)
```

## Component Integration Map

### 1. HeroSection — MODIFY `src/components/hero/HeroSection.astro`

**Changes required:**
- Swap `ambiance-10.jpg` import to new background image (user provides)
- Increase opacity from `opacity-[0.55]` to `opacity-[0.75]`
- Add 3rd CTA button: "Restez informe" ghost button (Accent Pink) with mail icon
- 3rd CTA is a placeholder `#newsletter` anchor (no backend, CLO-6 deferred)

**Integration pattern:** Pure in-place edit. No new component needed. The CTA button follows the existing `buttonVariants()` pattern with `variant: "outline"` or a custom ghost variant. Add i18n key `hero.cta.newsletter` to `src/i18n/ui.ts`.

**Data flow:** No new data dependencies. The anchor href is hardcoded `#newsletter` (or a future section id).

```astro
<!-- Pattern for the 3rd CTA -->
<a
  href="#newsletter"
  class={cn(
    buttonVariants({ variant: "outline", size: "lg" }),
    "h-[52px] px-8 text-lg font-bold border-accent text-accent"
  )}
>
  <MailIcon class="w-5 h-5 mr-2" />
  {t("hero.cta.newsletter")}
</a>
```

### 2. Edition2026Combined — NEW `src/components/past-editions/Edition2026Combined.astro`

**Why new component (not refactoring PastEditionSection):**
- `PastEditionSection.astro` is a generic prop-driven shell used for both editions. Its render order (rail -> h2 -> stats -> photos -> video -> brandCallout -> galleryCta) is documented as "LOCKED, D-08".
- The v1.2 design merges testimonials INTO this section and adds two new CTAs (replays + PDF). This breaks the generic shell's contract.
- Creating a dedicated `Edition2026Combined.astro` avoids destabilizing the generic shell, which may still be used on the `/2023` dedicated page.

**Subcomponents:**
- Reuse: photo mosaic logic from `PastEditionSection` (copy the grid pattern, not import the component)
- Reuse: `EDITION_2026` data from `src/lib/editions-data.ts` (photos, youtubeId, stats)
- Reuse: `TESTIMONIALS` array from `src/lib/testimonials-data.ts`
- New: testimonial cards rendered as a static grid (not marquee) within the section

**Data flow:**
```
editions-data.ts (EDITION_2026)  ──┐
                                   ├──> Edition2026Combined.astro
testimonials-data.ts (TESTIMONIALS)┘         │
                                             ├── 3 photos (from EDITION_2026.thumbnails)
i18n/ui.ts (new keys)  ────────────────────  ├── YouTube embed (EDITION_2026.youtubeId)
                                             ├── "Voir tous les replays" link (new i18n key)
                                             ├── "Telecharger le bilan 2026 (PDF)" link (hardcoded URL)
                                             └── Testimonial cards (TESTIMONIALS array, t() for quotes)
```

**Props interface:**
```typescript
interface Props {
  id?: string;
  heading: string;
  stats: Array<{ value: string; label: string }>;
  photos: Array<{ src: ImageMetadata; alt: string; size?: "hero" | "medium" | "small" }>;
  video: { youtubeId: string; caption: string };
  replaysCta: { label: string; href: string };
  pdfCta: { label: string; href: string };
  testimonials: Array<{ quote: string; attribution: string }>;
}
```

**Testimonials integration decision:** Render as static cards within the section, NOT as the existing CSS marquee. The marquee (`TestimonialsStrip`) is a standalone full-width component with animation. The v1.2 design shows testimonial cards embedded within the 2026 section. This means:
- `TestimonialsStrip.astro` is REMOVED from both homepage files
- Testimonial data is consumed directly in `Edition2026Combined.astro`
- Cards use existing `--color-card` / `--color-border` DS tokens

### 3. Edition2023Minimal — MODIFY `src/components/past-editions/PastEditionMinimal.astro`

**Changes required:**
- Remove the photos grid (ROW 2 in current component)
- Keep: logo + title (ROW 1)
- Keep: playlist link + view-page CTA (ROW 3)
- Result: logo + title + text links only

**Integration pattern:** Simplify the existing component. The `photos` prop becomes optional (or ignored). Since this component is only consumed by the two homepage files, breaking changes are safe.

**Simpler approach:** Make `photos` prop optional and conditionally render ROW 2. Homepage callers stop passing photos. The `/2023` dedicated page (if it uses this component) can still pass photos.

### 4. SponsorsPlatinumStrip — NEW `src/components/sponsors/SponsorsPlatinumStrip.astro`

**Why new component (not reusing SponsorTierSection):**
- `SponsorTierSection.astro` renders a full section with `<h2>`, tier-specific grid, and `SponsorCard` subcomponents. It is designed for the `/sponsors` page context.
- The homepage needs a lighter strip: Platinum logos in a row + a "Voir tous les sponsors" link. Different visual density, no descriptions, no card chrome.
- However, the data source is identical: `getCollection("sponsors")` filtered by `tier === "platinum"`.

**Data flow:**
```
getCollection("sponsors")
  .filter(s => s.data.tier === "platinum")
    ──> SponsorsPlatinumStrip.astro
          ├── Logo images (sponsor.data.logo via safeLogoPath)
          ├── Links (sponsor.data.url via safeUrl)
          └── "Voir tous les sponsors" CTA (i18n key + locale-aware /sponsors path)
```

**Key integration detail:** The sponsors collection uses the CSV loader pipeline (`content.config.ts` -> `csvLoader` -> `SPONSORS_CSV_URL`). The homepage needs an `await getCollection("sponsors")` call in the page frontmatter, just like `src/pages/sponsors.astro` does. This is an Astro content collection call, fully supported in `.astro` page frontmatter.

**Pattern:**
```astro
<!-- In index.astro frontmatter -->
const allSponsors = await getCollection("sponsors");
const platinumSponsors = allSponsors.filter(s => s.data.tier === "platinum");

<!-- In template -->
{platinumSponsors.length > 0 && (
  <SponsorsPlatinumStrip sponsors={platinumSponsors} lang={lang} />
)}
```

**Logo rendering:** Reuse the `safeLogoPath()` and `safeUrl()` utility functions from `SponsorCard.astro`. Extract them to a shared `src/lib/sponsor-utils.ts` to avoid duplication.

### 5. Newsletter CTA Placeholder — NO NEW COMPONENT

The newsletter CTA is a ghost button in the Hero section pointing to `#newsletter`. No section, no form, no component. When CLO-6 (newsletter backend) ships later, a `NewsletterSection.astro` can be added and the anchor updated.

## Component Boundaries Summary

| Component | Action | Location | Hydration |
|-----------|--------|----------|-----------|
| `HeroSection.astro` | MODIFY | `src/components/hero/` | None (Astro SSR) |
| `KeyNumbers.tsx` | UNCHANGED | `src/components/hero/` | `client:idle` |
| `Edition2026Combined.astro` | **CREATE** | `src/components/past-editions/` | None (Astro SSR) |
| `PastEditionMinimal.astro` | MODIFY | `src/components/past-editions/` | None (Astro SSR) |
| `CfpSection.astro` | UNCHANGED | `src/components/cfp/` | None (Astro SSR) |
| `SponsorsPlatinumStrip.astro` | **CREATE** | `src/components/sponsors/` | None (Astro SSR) |
| `TestimonialsStrip.astro` | REMOVE from homepage | `src/components/testimonials/` | None (keep file for potential reuse) |
| `sponsor-utils.ts` | **CREATE** | `src/lib/` | N/A (utility) |

## Data Flow Changes

### New i18n Keys Required (both FR and EN)

```
hero.cta.newsletter          — "Restez informe" / "Stay informed"
editions.2026.replays_cta    — "Voir tous les replays" / "Watch all replays"
editions.2026.pdf_cta        — "Telecharger le bilan 2026 (PDF)" / "Download 2026 report (PDF)"
sponsors.homepage.heading    — "Nos sponsors" / "Our sponsors"
sponsors.homepage.view_all   — "Voir tous les sponsors" / "View all sponsors"
```

### New Data Constants

In `src/lib/editions-data.ts`, add:
```typescript
// Add to EDITION_2026
replaysUrl: "https://www.youtube.com/playlist?list=...",  // 2026 replays playlist
pdfUrl: "https://drive.google.com/file/d/1rlrY9EkulGSgeCPenyiN4ZnxWs5BXPBo/view",
```

### Homepage Frontmatter Changes

Both `index.astro` and `en/index.astro` need:
1. `import { getCollection } from "astro:content"` — for sponsor data
2. `const allSponsors = await getCollection("sponsors")` — new async call
3. Remove `TestimonialsStrip` import
4. Add `Edition2026Combined` import
5. Add `SponsorsPlatinumStrip` import
6. Update section ordering in template

## Suggested Build Order

Build order follows dependency chains: shared utilities first, then data, then components bottom-up, then page wiring last.

### Phase 1: Foundation (no visual changes yet)
1. **Extract `sponsor-utils.ts`** — pull `safeLogoPath()` and `safeUrl()` from `SponsorCard.astro` into `src/lib/sponsor-utils.ts`. Update `SponsorCard` to import from shared utility. This unblocks the new Platinum strip without code duplication.
2. **Add i18n keys** — add all new keys to `src/i18n/ui.ts` (FR and EN). Unblocks all components.
3. **Add data constants** — add `replaysUrl` and `pdfUrl` to `EDITION_2026` in `editions-data.ts`.

### Phase 2: New Components (can be built in parallel)
4. **Create `Edition2026Combined.astro`** — the largest new component. Combines photos, video, CTAs, and testimonial cards. Test in isolation.
5. **Create `SponsorsPlatinumStrip.astro`** — small component, depends on sponsor-utils.ts from Phase 1.

### Phase 3: Modify Existing Components
6. **Simplify `PastEditionMinimal.astro`** — make photos optional, remove photo grid when not provided.
7. **Modify `HeroSection.astro`** — new background image, opacity bump, 3rd CTA button.

### Phase 4: Wire Homepage (depends on all above)
8. **Update `src/pages/index.astro`** — new imports, sponsor collection query, section reordering, remove TestimonialsStrip.
9. **Update `src/pages/en/index.astro`** — mirror changes from index.astro with EN-specific hrefs.

### Phase 5: Cleanup
10. **Verify TestimonialsStrip** — confirm it is no longer imported anywhere. Keep the file (may be useful elsewhere) but remove from homepage.

**Rationale for this order:**
- Phase 1 has zero visual impact, pure prep work, safe to ship
- Phase 2 components can be developed independently (no mutual deps)
- Phase 3 modifications are low-risk (small diffs to existing files)
- Phase 4 is the integration point where everything comes together — done last so all pieces are ready
- Phase 5 is cleanup that can happen after visual validation

## Anti-Patterns to Avoid

### Anti-Pattern 1: Modifying PastEditionSection for 2026-specific needs
**What:** Adding testimonials, extra CTAs, or conditional rendering to the generic `PastEditionSection.astro`.
**Why bad:** The render order is documented as "LOCKED, D-08". Adding 2026-specific logic creates a god component that handles two different layouts via flags. The `/2023` page still needs the original shell.
**Instead:** Create `Edition2026Combined.astro` as a purpose-built component.

### Anti-Pattern 2: Duplicating safeUrl/safeLogoPath in the Platinum strip
**What:** Copy-pasting the URL validation functions from `SponsorCard.astro`.
**Why bad:** Two copies to maintain, security-critical code that must stay in sync.
**Instead:** Extract to `src/lib/sponsor-utils.ts`, import in both consumers.

### Anti-Pattern 3: Inline sponsor data instead of using the collection
**What:** Hardcoding Platinum sponsor logos/URLs in the homepage or editions-data.ts.
**Why bad:** Violates the CSV-is-source-of-truth rule from CLAUDE.md. Sponsor data changes frequently; the Google Sheet must remain authoritative.
**Instead:** Use `getCollection("sponsors")` in the page frontmatter, filter by tier.

### Anti-Pattern 4: Making TestimonialsStrip configurable for both marquee and card layouts
**What:** Adding a `variant="cards"` prop to TestimonialsStrip to serve both the old marquee and the new card layout.
**Why bad:** The marquee relies on CSS `@keyframes scroll-x`, duplicate tracks with `inert`, and edge-fade masks. Card layout needs none of this. Coupling them creates maintenance burden.
**Instead:** Inline testimonial cards in `Edition2026Combined.astro`. The data source (`TESTIMONIALS` array + i18n keys) is shared; the rendering is separate.

## Scalability Considerations

| Concern | Current (v1.2) | Future |
|---------|----------------|--------|
| Sponsor count | Filter in frontmatter, render N logos | If 10+ Platinum sponsors, add horizontal scroll or grid wrapping |
| Testimonials | 3 static cards | If organizer adds more, consider pagination or randomized selection at build |
| Homepage sections | 6 sections, manageable | If more editions are added, consider a loop-based renderer over an editions array |
| Dual locale sync | Manual mirror of index.astro / en/index.astro | Consider extracting shared frontmatter to a helper function to reduce drift |

## Sources

- Direct codebase analysis of `src/pages/index.astro`, `src/pages/en/index.astro`
- Direct codebase analysis of all affected components in `src/components/`
- `src/content.config.ts` for sponsor collection schema and loader pipeline
- `src/lib/editions-data.ts` for edition data structure
- `src/lib/testimonials-data.ts` for testimonial data structure
- `.planning/PROJECT.md` for v1.2 scope and requirements
