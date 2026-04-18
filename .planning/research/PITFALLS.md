# Domain Pitfalls

**Domain:** Homepage restructuring on multi-locale Astro conference site (v1.2)
**Researched:** 2026-04-15

---

## Critical Pitfalls

Mistakes that cause broken builds, runtime errors, or user-visible regressions.

### Pitfall 1: Dual Homepage Files Diverge During Section Reorder

**What goes wrong:** `src/pages/index.astro` (FR) and `src/pages/en/index.astro` (EN) are near-identical copies that must stay in lockstep. The v1.2 reorder (Hero -> Key Numbers -> Edition 2026 -> Mini-bloc 2023 -> CFP -> Sponsors Platinum) requires changing section order, imports, and prop assembly in both files identically. Editing one and forgetting the other causes one locale to show the old layout.

**Why it happens:** Astro file-based i18n uses separate page files per locale. Today the only difference between the two files is the import path depth (`../layouts` vs `../../layouts`) and locale-specific hrefs (`/2023` vs `/en/2023`). Any restructuring change must be applied twice. Under time pressure, the second file is forgotten.

**Consequences:** FR visitors see the new layout; EN visitors see the old one (or vice versa). If a removed component is still imported in one file, the build may still pass but the page renders stale content. In the worst case, a removed import causes a build error on one locale only.

**Prevention:**
1. Edit both files in the same commit. Never mark a homepage task as done until both are updated.
2. After every change, run `diff src/pages/index.astro src/pages/en/index.astro` — only the import path and locale-specific hrefs should differ.
3. Consider extracting shared section ordering and prop assembly into `src/lib/homepage-sections.ts` so both pages import the same structure. This eliminates the dual-maintenance problem entirely.

**Detection:** `diff` both files after every homepage PR. A CI check that diffs the two files (ignoring known locale differences) catches drift automatically.

### Pitfall 2: i18n Key Drift Between `fr` and `en` Objects

**What goes wrong:** New i18n keys for newsletter CTA (`hero.cta.newsletter`), sponsor section (`sponsors.homepage.*`), PDF link (`editions.2026.pdf_cta`), and simplified 2023 bloc are added to the `fr` object in `ui.ts` but forgotten in `en`. The `useTranslations` helper silently falls back to FR (line 21 of `utils.ts`: `ui[lang][key] ?? ui[defaultLang][key]`). English pages render French strings with no build error.

**Why it happens:** `ui.ts` is a single file with two ~300-key flat objects. No compile-time check enforces matching keys between locales. The silent FR fallback masks the bug during development.

**Consequences:** English visitors see French fragments ("Restez informe", "Telecharger le bilan 2026") mixed into an English page.

**Prevention:**
1. Add every new key to both `fr` and `en` in the same commit — never split.
2. Add a build-time or test-time check: `Object.keys(ui.fr)` must exactly match `Object.keys(ui.en)`. A vitest unit test is the simplest approach.
3. In PR review, count new keys per locale — numbers must match.

**Detection:** Search for keys in `fr` absent from `en`: compare key arrays programmatically. Manual: visit `/en/` and search rendered HTML for French diacritics in the new sections.

### Pitfall 3: Empty Sponsor Collection Renders Broken Homepage Section

**What goes wrong:** The new Sponsors Platinum homepage section calls `getCollection("sponsors")` and filters for `tier === "platinum"`. If the CSV has zero platinum sponsors (or the CSV fetch fails and the fallback CSV is empty), the section renders a heading with no logos beneath it — or worse, an empty grid with allocated whitespace.

**Why it happens:** The sponsors CSV is fetched from a remote Google Sheets URL at build time (`content.config.ts` line 110-114). Network failures, rate limits, or a temporarily empty sheet cause an empty array. The existing `/sponsors` page has a guard (`hasAnySponsor`); a new homepage section built separately may omit it.

**Consequences:** Homepage shows "Nos partenaires" heading with empty space. Looks broken, especially for the most expensive sponsor tier.

**Prevention:**
1. Always guard: `{platinumSponsors.length > 0 && <SponsorsHomepage ... />}`. The entire section (heading included) must be conditional.
2. Reuse the same `getCollection("sponsors")` + tier-filtering pattern from `sponsors.astro` rather than inventing a new approach.
3. Test by temporarily renaming the fallback CSV (`src/content/sponsors/sponsors.csv`) and building — verify the homepage renders without errors or empty sections.

**Detection:** Build with `SPONSORS_CSV_URL` pointed at a 404 URL and an empty local fallback. The homepage must render cleanly.

---

## Moderate Pitfalls

### Pitfall 4: Removing Photos from PastEditionMinimal Breaks Component Interface

**What goes wrong:** v1.2 reduces the 2023 mini-bloc to "logo + text link only (remove photos)." But `PastEditionMinimal.astro` requires `photos: Array<{ src: ImageMetadata; alt: string }>` in its `Props` interface (line 17). Passing an empty array renders an empty `grid grid-cols-3` with allocated vertical space. The component has no conditional rendering for an empty photos array.

**Why it happens:** The component was designed for the 3-photo variant. Its layout assumes photos are always present.

**Prevention:**
1. Option A (preferred): Create a new simpler component `PastEditionLink.astro` for the logo-only variant. Leave `PastEditionMinimal` unchanged for any future consumer that needs photos.
2. Option B: Make `photos` optional in the `Props` interface and wrap the photo grid in `{photos && photos.length > 0 && ...}`. This works but dilutes the component's original contract.
3. Before modifying `PastEditionMinimal`, check all consumers: `grep -rn "PastEditionMinimal" src/` — currently only `index.astro` and `en/index.astro`. The `/2023` and `/en/2023` pages use the full `PastEditionSection`, not `PastEditionMinimal`.

**Detection:** Build and visually inspect — an empty 3-column grid leaves a visible gap.

### Pitfall 5: Newsletter CTA Placeholder Creates a Dead Link

**What goes wrong:** The hero gets a 3rd CTA "Restez informe" as a placeholder anchor. If it points to `#newsletter` with no matching `id="newsletter"` element on the page, clicking it does nothing — no scroll, no feedback, no error. This is worse than having no CTA because it erodes user trust.

**Why it happens:** The newsletter backend (CLO-6) is explicitly out of scope for v1.2. The CTA is a "wire later" placeholder.

**Prevention:**
1. Best: use `href="#newsletter"` AND add a small "coming soon" section with `id="newsletter"` at the bottom of the page. The scroll gives users feedback that the click worked.
2. Alternative: render the CTA as a `disabled` button with `aria-disabled="true"` and a tooltip "Bientot disponible". This communicates intent without creating a dead interaction.
3. Never use `href="#"` alone — it scrolls to page top.
4. Add a `<!-- TODO(CLO-6): wire newsletter signup -->` comment in the hero component to track the deferred integration.

**Detection:** Click the CTA — if nothing visible happens, the implementation is wrong.

### Pitfall 6: External PDF Link (Google Drive) — Availability, Caching, and Accessibility

**What goes wrong:** "Telecharger le bilan 2026 (PDF)" links to `https://drive.google.com/file/d/1rlrY9EkulGSgeCPenyiN4ZnxWs5BXPBo/view`. This has several failure modes:
- The `/view` URL opens the Google Drive viewer, not a direct download — confusing for users expecting a file save.
- Google throttles heavily-shared files; unauthenticated access can be blocked.
- File owner can revoke sharing at any time, breaking the link silently with no build error.
- Screen readers cannot convey that the link opens a PDF in a new tab without explicit labeling.

**Prevention:**
1. Preferred: host the PDF as a static asset in `public/bilan-2026.pdf` for complete reliability and zero external dependency. File size is small (one-pager).
2. If Google Drive is kept: use the export URL format (`/uc?export=download&id=FILE_ID`) or accept that users see the Drive viewer.
3. Add accessible labeling: `aria-label="Telecharger le bilan 2026 (PDF, nouvelle fenetre)"` or visible text "(PDF)".
4. Add `rel="noopener" target="_blank"`.
5. Test the link in an incognito browser to verify public sharing is enabled.

**Detection:** Open the link in incognito — if it shows a "request access" page, sharing is misconfigured.

### Pitfall 7: Hero Background Opacity Change Causes WCAG Contrast Failure

**What goes wrong:** The current hero uses `opacity-[0.55]` on the background image with a dark gradient overlay. Increasing to ~75% (`opacity-[0.75]`) makes the photo more visible but reduces contrast between the overlay and white text. The existing gradient wash (`color-mix(in oklch, var(--color-background) 80%, transparent)`) may not compensate enough, causing WCAG AA contrast failures (4.5:1 for body text, 3:1 for large text).

**Prevention:**
1. After changing opacity, run Lighthouse or axe DevTools on the hero section. Check contrast on: title, subtitle badge, description paragraph, and CTA button text.
2. If contrast fails, strengthen the gradient overlay — adjust `color-mix` from 80% to 85-90% — rather than reverting the opacity.
3. Test on both a bright external monitor and a low-contrast laptop screen.
4. The Stitch mockup is the reference — match it, but verify programmatically.

**Detection:** Lighthouse accessibility audit flags contrast issues. Chrome DevTools color picker shows contrast ratio when inspecting text elements.

### Pitfall 8: Merging Testimonials into Edition 2026 Section Breaks Heading Hierarchy

**What goes wrong:** Currently TestimonialsStrip is a standalone section with its own `<h2 id="testimonials-heading">`. Merging it into the Edition 2026 combined section means it should become `<h3>` (sub-heading under the 2026 `<h2>`). If it stays `<h2>`, the heading hierarchy is technically correct but semantically misleading. If it is removed entirely, screen readers lose the landmark.

**Why it happens:** Copy-pasting the existing TestimonialsStrip component into the combined section preserves its original heading level.

**Prevention:**
1. When merging, change testimonials heading from `<h2>` to `<h3>` if it becomes a sub-section of Edition 2026.
2. Preserve `id="testimonials-heading"` on whatever element replaces it — any existing anchors or aria references still resolve.
3. Run `pa11y` or Lighthouse accessibility — check heading hierarchy reads h1 -> h2 -> h2 -> h2 (Key Numbers -> Edition 2026 -> CFP -> Sponsors) without skipped levels.

**Detection:** Chrome DevTools Accessibility tree -> Headings view. Must show a clean descending hierarchy.

---

## Minor Pitfalls

### Pitfall 9: Section Reorder Breaks Existing Anchor Links

**What goes wrong:** Moving sections changes their vertical position on the page. Any bookmarked anchors (`#edition-2026`, `#testimonials-heading`) still resolve but land at unexpected scroll positions. External links or skip-nav references may become confusing.

**Prevention:** Audit all `id` attributes in affected sections before reordering. Preserve existing IDs even when sections move. If merging testimonials into the 2026 section, keep both `id="edition-2026"` and `id="testimonials-heading"`.

### Pitfall 10: Sponsor Logo Images Served Unoptimized on Homepage

**What goes wrong:** The existing `SponsorCard.astro` is a full card layout (name, description, link). The homepage only needs platinum tier logos. Reusing `SponsorCard` adds unnecessary layout weight. Building a new logo-only strip without using `astro:assets` Image component serves raw PNGs/SVGs without optimization.

**Prevention:** Create a lightweight `SponsorLogoStrip.astro` component for the homepage that uses `<Image>` from `astro:assets` (if raster logos) or simple `<img>` (if SVGs). Extract only the logo + link rendering from the existing sponsor data. Include a "Voir tous les sponsors" link to `/sponsors` (or `/en/sponsors` for EN locale).

### Pitfall 11: Orphaned Imports After Removing TestimonialsStrip from Standalone Position

**What goes wrong:** If TestimonialsStrip is merged into the Edition 2026 combined section, the standalone `<TestimonialsStrip />` import in both `index.astro` files must be removed. If the component import stays but the JSX usage is removed, ESLint/TS may only warn (not error). If the import is removed but the JSX reference stays, the build breaks.

**Prevention:** After any component removal or relocation, run `pnpm build` immediately. Check for unused import warnings with `noUnusedLocals: true` in tsconfig. Apply changes to both FR and EN homepage files atomically.

### Pitfall 12: `editions-data.ts` Photo Imports Still Bundled After Homepage Simplification

**What goes wrong:** `EDITION_2023.thumbnails` imports 3 KCD 2023 photos used by PastEditionMinimal. If the v1.2 mini-bloc no longer shows photos, these imports remain in `editions-data.ts`, and Astro/Sharp still processes them (producing dist assets no page references). The `/2023` page uses `photos10`, not `thumbnails`, so the 3-photo array becomes dead code.

**Prevention:** After confirming no consumer uses `EDITION_2023.thumbnails`, remove the array and its 3 imports from `editions-data.ts`. Verify with `grep -rn "thumbnails" src/` that no other file references it (the 2026 section uses `EDITION_2026.thumbnails` which is separate). Check `dist/_astro/` output before and after — processed images for removed photos should disappear.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Hero CTA addition (newsletter placeholder) | Pitfall 5: Dead anchor link with no user feedback | Add `id="newsletter"` target section or use disabled button variant |
| Hero background opacity change | Pitfall 7: WCAG contrast failure on white text | Run Lighthouse after change; strengthen gradient if contrast fails |
| Section reorder (all sections) | Pitfall 1: Dual-file divergence between FR and EN homepage | Edit both files atomically; `diff` after every change |
| New i18n keys (newsletter, sponsors, PDF) | Pitfall 2: Keys missing in one locale, silent FR fallback | Add to both `fr` and `en` in same commit; add key-count test |
| Edition 2026 combined section (film + testimonials + photos) | Pitfall 8: Heading hierarchy broken when merging sections | Change testimonials `<h2>` to `<h3>` inside combined section |
| Mini-bloc 2023 simplification (remove photos) | Pitfall 4: PastEditionMinimal requires photos prop | Create new simpler `PastEditionLink.astro` or make photos optional |
| Mini-bloc 2023 simplification (remove photos) | Pitfall 12: Orphaned photo imports in editions-data.ts | Remove `EDITION_2023.thumbnails` array if no consumer remains |
| Sponsors Platinum on homepage | Pitfall 3: Empty collection renders broken section | Conditional render: `{platinumSponsors.length > 0 && ...}` |
| Sponsors Platinum on homepage | Pitfall 10: Unoptimized logos or wrong component reuse | Build lightweight logo-only component, not full SponsorCard |
| External PDF link (bilan 2026) | Pitfall 6: Google Drive availability and a11y | Host in `public/` or add aria-label with file type indicator |
| All homepage changes | Pitfall 1 + 2: Stale EN file + missing EN i18n keys | Diff both index files + count keys as final step of every task |

---

## Sources

- Codebase inspection: `src/pages/index.astro` (74 lines), `src/pages/en/index.astro` (73 lines) — confirmed near-identical structure with only path/href differences
- `src/i18n/ui.ts` — ~300 keys per locale, FR fallback at `utils.ts` line 21
- `src/i18n/utils.ts` — `useTranslations` silent fallback behavior confirmed
- `src/components/past-editions/PastEditionMinimal.astro` — `photos` is required in Props interface (line 17), grid is `grid-cols-3` (line 45)
- `src/components/hero/HeroSection.astro` — current opacity `opacity-[0.55]` at line 28, gradient overlay at line 32
- `src/components/testimonials/TestimonialsStrip.astro` — standalone `<h2 id="testimonials-heading">` at line 22
- `src/content.config.ts` lines 109-147 — sponsors collection uses csvLoader with remote URL + local fallback
- `src/pages/sponsors.astro` — existing `hasAnySponsor` guard pattern (line 36)
- `src/lib/editions-data.ts` — EDITION_2023.thumbnails 3-photo array (lines 76-80)
- WCAG 2.1 AA contrast requirements (4.5:1 body text, 3:1 large text)
- Google Drive sharing URL behavior — `/view` vs `/uc?export=download` patterns
