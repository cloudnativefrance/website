# Phase 19: Integrate 2023 Edition Section + Lightbox (dedicated page) — Context

**Gathered:** 2026-04-14
**Status:** Executing autonomously

<domain>
## Phase Boundary

Ship a dedicated bilingual 2023 edition page at `/2023` (FR) and `/en/2023` (EN) that tells the KCD France 2023 story:
- 10-photo responsive `<Picture>` grid rendered via `astro:assets` with AVIF/WebP/JPG, capped widths, dimension-reserved tiles (CLS <=0.02)
- KCD brand-history callout (logo + "originally named Kubernetes Community Days France" + Centre Georges Pompidou mention)
- Keyboard-accessible lightbox (role="dialog", aria-label, focus trap, Escape/Arrow/Tab, focus return)
- Unique FR + EN descriptive alt text per photo — no "photo 1 / photo 2" patterns
- Placeholder stats + gallery URL flagged with tracker issue

The homepage 2023 minimal block (17-04) stays untouched — Phase 19 does NOT modify `src/pages/index.astro` or `src/pages/en/index.astro`. The dedicated page is a new entry point; the homepage keeps its compact recap teaser.

Out of scope: homepage mutation, real stats/gallery URL fetch, testimonial marquee (Phase 20), venue cleanup (Phase 18 — already shipped).
</domain>

<decisions>
## Implementation Decisions

### Routing (new)

- **D-01 Dedicated 2023 page:** `src/pages/2023.astro` (FR) + `src/pages/en/2023.astro` (EN). Mirrors the layout pattern used for `/team`, `/sponsors`, etc. Uses `Layout.astro` + `canonicalPath: "/2023"` so hreflang alternates resolve cleanly.
- **D-02 Homepage teaser link:** The homepage minimal 2023 block (17-04) already links to the YouTube playlist. We DO NOT change its CTA — Phase 18 UAT signed off on the current shape. A future phase may add a "read the full 2023 recap" link to `/2023` but that's deferred.
- **D-03 Stitch-first flag:** This is a new page. **Stitch visual approval is OUTSTANDING** — user must review the live worktree before merge. Proceed with coding using design-system tokens and Stitch 15-CONTEXT rhythm (rail → h2 → stats → photo grid → brand callout → gallery CTA) as the reference. Document in CONTEXT + content-gates.md.

### Data Module Extensions

- **D-04 Extend `EDITION_2023` in `src/lib/editions-data.ts`:**
  - Add `photos10`: Array<{ src, altKey, size }> — all 10 KCD 2023 masters with per-photo alt keys (`editions.2023.photo_alt.01` .. `.10`). Keep the existing `thumbnails` 3-photo array for the homepage minimal block — do NOT break it.
  - Add `galleryUrl: string` — PLACEHOLDER value pointing to the YouTube playlist (already known) with a `galleryPlaceholder: true` flag + `trackerUrl` to GitHub issue for real photo-gallery URL.
  - Add `realStats: { placeholder: true, trackerUrl: string }` sibling — existing `stats` values (1700+/42/24) are reasonable but unverified; flag via tracker.
  - Add `brandHistory: { logo, logoAltKey, bodyKey, venueKey }` — references i18n keys for organizer-signoff-gated copy.
- **D-05 Tracker URL:** `https://github.com/cloudnativefrance/website/issues/19` (conceptual — noted in content-gates.md; organizer to create before merge).

### i18n (new keys, FR + EN in same commit)

- **D-06 Per-photo alt keys:** Replace existing generic `editions.2023.thumbnail_alt.1..10` (which use the banned "Photo KCD France 2023 — ..." prefix) with unique descriptive alts. Keep the existing `thumbnail_alt.1/5/8` keys as aliases pointing to the new descriptive strings so the homepage minimal block (consumers of `editions-data.ts.thumbnails[*].altKey`) keeps rendering. New keys: `editions.2023.photo_alt.01` .. `.10` — each with a distinct FR + EN sentence describing a plausible scene (opening keynote on the Pompidou stage, hallway conversations, sponsor booth, Q&A, etc.). I18N-02 parity test enforces byte-diff.
- **D-07 Page-level keys:** `editions.2023.page.title`, `editions.2023.page.meta_description`, `editions.2023.page.rail`, `editions.2023.page.heading`, `editions.2023.page.intro`, `editions.2023.brand_history.heading`, `editions.2023.brand_history.body`, `editions.2023.brand_history.venue`, `editions.2023.gallery_cta_placeholder_tooltip`, `editions.2023.lightbox.close`, `editions.2023.lightbox.prev`, `editions.2023.lightbox.next`, `editions.2023.lightbox.dialog_label`, `editions.2023.lightbox.counter_template` (e.g. "{index} / {total}").

### Photo Grid

- **D-08 `<Picture>` vs `<Image>`:** Use `astro:assets` `<Picture>` (multi-format AVIF/WebP/JPG) on the dedicated page to meet SC1 explicitly. Homepage minimal block keeps `<Image>` (unchanged from 17-04).
- **D-09 Layout:** Responsive CSS grid — 1 col on <640px, 2 cols on sm, 3 cols on md, 4 cols on lg. Each tile uses `aspect-[4/3]` to reserve dimensions (CLS <=0.02). Tiles are `<button type="button">` triggers that open the lightbox (a11y-friendly, natural tab order).
- **D-10 Widths:** `widths={[400, 600, 900, 1200]}`, `sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"`.

### Brand-History Callout

- **D-11 Component:** New `src/components/past-editions/KcdBrandHistoryCallout.astro` (small, local). Accepts `logo, logoAlt, heading, body, venue`. Renders a two-column band (logo left, text right) using the DS `bg-secondary / text-secondary-foreground` tokens (same as the shell's existing brand-callout). No new tokens.

### Lightbox

- **D-12 Implementation choice:** **Astro component + vanilla TypeScript `<script>`** (no React island) for tiny bundle delta and zero hydration cost. Fully inline in the page template. Lightbox state is DOM-driven: data attributes + focus trap in ~90 LOC. Component: `src/components/past-editions/Edition2023Lightbox.astro`. Justification: (a) no existing React island on this page would justify pulling the React runtime; (b) the entire surface is a modal overlay with simple keyboard bindings — classic vanilla JS territory; (c) matches Navigation.astro's inline-script pattern already in use.
- **D-13 A11y contract:**
  - `role="dialog"`, `aria-modal="true"`, `aria-label={t("editions.2023.lightbox.dialog_label")}`
  - Opening: stores `document.activeElement` as `originTrigger`, focuses the close button
  - Closing: returns focus to `originTrigger`
  - Keyboard: Escape closes; ArrowLeft/ArrowRight navigate (wraps); Tab cycles within dialog (close, prev, next, photo region are focusable)
  - Body scroll locked via `document.body.classList.add("overflow-hidden")` while open
  - Each photo tile button has unique `aria-label` = the photo's alt text
- **D-14 Focus trap:** Minimal implementation — listen for `keydown` Tab on the dialog, find first/last focusable, wrap when hit. Inert attribute NOT used (widest-browser compat); instead, `aria-hidden="true"` on `<main>` siblings while open + focus trap.

### Tests

- **D-15 Build tests (Vitest, dist HTML assertions):**
  - `tests/build/edition-2023-page.test.ts` — `/2023/index.html` and `/en/2023/index.html` contain the rail, h2, 10 photos (count distinct `<img>` or picture sources by alt regex), gallery CTA, brand-history callout with Pompidou mention + "originally named", lightbox `role="dialog"` present (hidden by default), unique alt-text count (10 unique values per locale, zero matches for "photo 1"/"photo 2" patterns).
  - `tests/build/edition-2023-lightbox-a11y.test.ts` — static assertions: `role="dialog"`, `aria-modal="true"`, `aria-label` non-empty, close/prev/next buttons have aria-labels, focus-trap script present, keyboard-handler keywords (`Escape`, `ArrowLeft`, `ArrowRight`).
  - Extend `tests/build/editions-data.test.ts` with `EDITION_2023.photos10.length === 10` and all 10 distinct `altKey` values.
- **D-16 Manual UAT:** Lightbox keyboard behaviour (focus trap, focus return, arrow wraparound) is hard to unit-test via dist grep. Listed as manual items in `19-UAT.md`.

### Content Gates

- **D-17:** `content-gates.md` lists (a) brand-history FR + EN wording awaiting organizer sign-off (I18N-03), (b) 2023 stats placeholder awaiting organizer confirmation (EDIT-07), (c) gallery URL placeholder awaiting organizer (EDIT-07). Each item uses `TODO(19)` marker in source + tracker URL.

### Nav Link Audit

- **D-18:** Do NOT add `/2023` to primary `Navigation.astro`. The homepage minimal block's existing playlist link remains the single discoverable entry from the homepage. A follow-up UX phase may add a footer link or homepage "read more" CTA. Documented — not blocking.
</decisions>

<canonical_refs>
- `.planning/workstreams/past-editions-showcase/ROADMAP.md` §Phase 19
- `.planning/workstreams/past-editions-showcase/REQUIREMENTS.md` EDIT-02, EDIT-03, EDIT-05, EDIT-07, A11Y-03, A11Y-04, I18N-03
- `src/components/past-editions/PastEditionSection.astro` (shell pattern reference)
- `src/lib/editions-data.ts` (existing shape to extend)
- `src/assets/photos/kcd2023/01.jpg ... 10.jpg` (10 pre-optimized masters from Phase 16)
- `src/assets/logos/kcd2023/logo-color.png` (brand callout logo)
- `src/i18n/ui.ts` lines 220-240 (FR), 478-498 (EN) — existing `editions.2023.*` keys
- `src/styles/global.css` :target / scroll-margin (already present)
- `src/components/Navigation.astro` (inline-script vanilla-JS pattern reference for lightbox)
</canonical_refs>

<plans>
- 19-01: route scaffolds (`/2023` FR + `/en/2023` EN, Layout composition) + data-module extension (photos10 + brandHistory shape) + nav-link audit decision
- 19-02: 10-photo `<Picture>` grid component (`Edition2023PhotoGrid.astro`) + 10 unique alt i18n keys FR+EN (replacing "photo 1/2" placeholders) + data-module test extension
- 19-03: KCD brand-history callout component (`KcdBrandHistoryCallout.astro`) + Pompidou venue + "originally named" copy keys (flagged for organizer sign-off)
- 19-04: Lightbox component (`Edition2023Lightbox.astro`, Astro + vanilla TS) + dialog a11y + keyboard bindings + focus trap
- 19-05: Page assembly (compose grid + callout + lightbox + gallery CTA + stats), build tests, content-gates.md, UAT.md, VALIDATION.md
</plans>

---

*Phase: 19-integrate-2023-edition-section-and-lightbox*
*Context gathered: 2026-04-14*
