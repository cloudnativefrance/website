# Phase 20: Animated Testimonials Strip — Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship the final v1.1 homepage section: a marquee-animated testimonials strip on `/` (FR) and `/en/` (EN) rendering 3 placeholder quotes from a typed `testimonials-data.ts` array, with WCAG 2.2.2 motion handling (reduced-motion respected, pause on hover AND focus, duplicated track hidden from AT) and zero-JS delivery (`.astro` + CSS only). Mount sits after the 2023 section per D-12 Phase 15.

Out of scope: real testimonial copy (tracker issue `testimonials-real-quotes`), avatar variant (deferred in Phase 15), Playwright reduced-motion browser test (Vitest build-time covers the source + dist contract; Playwright already established in Phase 16 for cross-browser can be added later).

</domain>

<decisions>
## Implementation Decisions

### Data Shape (TEST-03)

- **D-01 `src/lib/testimonials-data.ts` — typed array of 3 placeholder quotes.** Per user task instructions (prompt), the file lives at `src/lib/testimonials-data.ts`. Each entry references i18n keys rather than inlining copy (D-06 Phase 16 locks placeholder copy to `testimonials.*` keys in `ui.ts`). Shape:
  ```ts
  export interface Testimonial {
    id: string;
    quoteKey: `testimonials.${number}.quote`;
    attributionKey: `testimonials.${number}.attribution`;
  }
  export const TESTIMONIALS: readonly Testimonial[] = [
    { id: "t0", quoteKey: "testimonials.0.quote", attributionKey: "testimonials.0.attribution" },
    { id: "t1", quoteKey: "testimonials.1.quote", attributionKey: "testimonials.1.attribution" },
    { id: "t2", quoteKey: "testimonials.2.quote", attributionKey: "testimonials.2.attribution" },
  ] as const;
  ```
- **D-02 Placeholder flag + tracker note.** File header contains a `TODO(testimonials-real-quotes)` comment pointing at the tracker issue and stating "Attributions are fabricated — replace before v1.2." Phase 20 SC4 satisfied.
- **D-03 Three quotes only (TEST-01).** `testimonials.{0,1,2}` are used; 3, 4, 5 remain in `ui.ts` for future expansion without a parity-test churn.

### Component (A11Y-01, A11Y-02, TEST-02)

- **D-04 Component location.** `src/components/testimonials/TestimonialsStrip.astro` — plain Astro SFC, no `client:*` directive, zero JS (SC5 zero-bundle-delta truth).
- **D-05 Markup shape.**
  ```html
  <section class="testimonials-strip" aria-label={t("testimonials.heading")}>
    <h2>{t("testimonials.heading")}</h2>
    <div class="marquee" role="region">
      <ul class="marquee-track" aria-label="...">
        <!-- canonical 3 quotes -->
        <li>…</li>
      </ul>
      <ul class="marquee-track" aria-hidden="true" inert>
        <!-- duplicate 3 quotes — no tabindex needed because inert removes them -->
        <li tabindex="-1">…</li>
      </ul>
    </div>
  </section>
  ```
  Two sibling `<ul>`s inside a flex container make the translateX(-50%) math work (each track is 100% of the flex row; translating -50% slides exactly one track width).
- **D-06 `inert` attribute used on the duplicate track.** `inert` (2022 baseline) removes the subtree from the tab order and the a11y tree — strictly stronger than `aria-hidden` + `tabindex="-1"` per-descendant. Still add `aria-hidden="true"` for belt-and-braces (A11Y-02 wording).
- **D-07 CSS animation.**
  ```css
  @keyframes scroll-x {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .marquee { display: flex; overflow: hidden; }
  .marquee-track { display: flex; gap: 2rem; flex: 0 0 auto; animation: scroll-x 40s linear infinite; }
  .marquee:hover .marquee-track,
  .marquee:focus-within .marquee-track { animation-play-state: paused; }
  @media (prefers-reduced-motion: reduce) {
    .marquee { overflow-x: auto; scroll-snap-type: x mandatory; }
    .marquee-track { animation: none; }
    .marquee-track > li { scroll-snap-align: start; }
  }
  ```
  The global Phase 16 A11y reset already neutralizes `animation-duration` for reduced-motion; Phase 20's local rule adds `animation: none` plus a horizontal-scroll fallback (per user task rule 7). Both layers are defensive.
- **D-08 Pause affordance (D-09 Phase 15).** Hover AND `:focus-within` pause the animation. No visible play/pause button — minimal chrome, already approved in Stitch mock.

### Mount (TEST-01)

- **D-09 Homepage mount.** Add `<TestimonialsStrip />` inside `<main>` on `src/pages/index.astro` AND `src/pages/en/index.astro`, after `<PastEditionMinimal {...edition2023MinimalProps} />` (current end of main). Per D-12 Phase 15: Hero → KeyNumbers → CFP → 2026 → 2023 → Testimonials.

### Tests (Vitest build-time only)

- **D-10 Test strategy.** Vitest source + dist assertions only; Playwright reduced-motion browser test is nice-to-have but NOT a Phase 20 gate (the source-level `@media (prefers-reduced-motion: reduce) { animation: none }` + global Phase 16 reset are byte-asserted from the component file and from `dist/*.html`'s inlined/referenced CSS). Three test files:
  - `tests/build/testimonials-data.test.ts` — TEST-03: exactly 3 entries, all quoteKey/attributionKey resolve to existing `ui.fr` + `ui.en` keys, placeholder banner in source header, no fabricated full names in attribution bodies (attributions use single-letter first names per existing `ui.ts` placeholders).
  - `tests/build/testimonials-strip-source.test.ts` — A11Y-01/02/TEST-02: component file contains `animation:` keyframe + `aria-hidden="true"` on duplicate + `inert` + `:hover` + `:focus-within` + reduced-motion media block.
  - `tests/build/homepage-testimonials-mount.test.ts` — TEST-01: `dist/index.html` and `dist/en/index.html` both render the strip (heading text present in the correct locale + at least 6 `<blockquote>` or `<p class="quote">` elements i.e. 3 canonical + 3 duplicate).

### Planning Split

- **D-11 Three plans, single wave-chain.** (Plan 20-01 data + component scaffold with dummy markup) → (Plan 20-02 marquee CSS + a11y attributes + source-contract test) → (Plan 20-03 homepage mount + dist assertion tests + VALIDATION + SUMMARY). Each plan produces one atomic commit per task per the Phase 17 template.

### Stitch

- **D-12 No new Stitch round.** The testimonials marquee visual contract is already locked in `15-CONTEXT.md` §"Testimonials Marquee" (D-07/D-08/D-09 Phase 15: right→left drift, quote-led card, pause-on-hover/focus). Phase 20 implements the locked design; no new mock needed.

### Claude's Discretion

- Card padding, border-radius, shadow level — pick from DS tokens (Phase 15 decision left to implementer).
- Exact animation duration — 40s linear infinite (user task rule 7).
- Gap between cards — 2rem baseline, adjust if cards look cramped.
- Quote typography scale — pick largest body-size token that fits 3 lines on mobile.

### Folded Todos

None — no pending todos surfaced for Phase 20 scope.

</decisions>

<canonical_refs>
## Canonical References

### Roadmap & Requirements
- `.planning/workstreams/past-editions-showcase/ROADMAP.md` §Phase 20 — goal + 5 success criteria
- `.planning/workstreams/past-editions-showcase/REQUIREMENTS.md` — TEST-01, TEST-02, TEST-03, A11Y-01, A11Y-02

### Design
- `.planning/workstreams/past-editions-showcase/phases/15-stitch-full-homepage-mock/15-CONTEXT.md` §Testimonials Marquee (D-07/D-08/D-09) — visual contract already locked
- `.planning/workstreams/past-editions-showcase/phases/16-foundation-assets-i18n-a11y-baseline-shared-shell/16-CONTEXT.md` §A11y Baseline (D-07) — global prefers-reduced-motion reset

### Plan Template
- `.planning/workstreams/past-editions-showcase/phases/17-integrate-2026-edition-section-on-homepage/17-03-PLAN.md` — frontmatter + must_haves.truths + task list style

### Existing Code
- `src/i18n/ui.ts` lines 241-266 (FR) + 499-524 (EN) — `testimonials.*` keys already exist (Phase 16)
- `src/styles/global.css` lines 101-115 — A11Y-05 reduced-motion reset (Phase 16)
- `src/pages/index.astro` + `src/pages/en/index.astro` — homepage composition (Phases 17 + 17-04)

### Tracker
- `testimonials-real-quotes` — repo-level tracker issue to replace fabricated attributions. File header comment references this.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 16 already shipped 6 placeholder `testimonials.*` FR+EN pairs in `ui.ts`. Phase 20 uses the first 3 (`testimonials.{0,1,2}`).
- Phase 16 already shipped the global `@media (prefers-reduced-motion: reduce)` reset in `global.css`; the component adds a local defensive reset (`animation: none; overflow-x: auto`).
- Phase 17-04 shipped `PastEditionMinimal.astro`; the testimonials strip sits below it.

### Established Patterns
- Plain Astro SFCs (no `client:*`) for zero-JS components — matches `PastEditionSection.astro`, `PastEditionMinimal.astro`, `CfpSection.astro`.
- Vitest build-time tests against source files + `dist/*.html` — matches Phase 17 template (no Playwright required at the Vitest gate).
- i18n copy lives in `ui.ts`; `.ts` data files hold shape only — matches D-06 Phase 16.

### Integration Points
- Homepage mount at end of `<main>` on both locales.
- `useTranslations()` resolves `quoteKey`/`attributionKey` at render time inside the component.

</code_context>

<specifics>
## Specific Ideas

- `inert` is the strong primitive for hiding the duplicate track; `aria-hidden="true"` is the belt-and-braces backup (and the explicit A11Y-02 success criterion).
- Using an `<ul>` inside the `<div class="marquee">` means the duplicate track is also an `<ul>` — screen readers that ignore `inert` (older assistive tech) only see the canonical list via `aria-hidden`.
- Zero-JS animation via pure CSS keyframes is intentional: SC5 asserts zero homepage bundle delta vs Phase 19 baseline (though Phase 19 is not yet shipped; we compare to current main's bundle manifest as a proxy and accept the "or documented justification" escape hatch in SC5 if a bundle tool reports non-zero due to unrelated diffs).

</specifics>

<deferred>
## Deferred Ideas

- Playwright reduced-motion browser test — source-level assertion covers the contract; browser-level test can land in a follow-up a11y-regression phase.
- Avatar variant — rejected in Phase 15 (no real attendee photos available).
- Two-row counter-direction marquee — rejected in Phase 15.
- Manual play/pause button — rejected in Phase 15 (hover+focus pause is sufficient).
- Real testimonial copy — tracker issue `testimonials-real-quotes`; outside Phase 20 scope.

</deferred>

---

*Phase: 20-animated-testimonials-strip*
*Context gathered: 2026-04-14*
