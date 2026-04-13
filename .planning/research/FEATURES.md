# Feature Research — v1.1 Past Editions Showcase

**Domain:** Conference / community-event website — homepage "look back" sections (past editions + testimonials)
**Researched:** 2026-04-13
**Confidence:** MEDIUM-HIGH — patterns are well-codified across the conference web (Beyond Tellerrand, FITC, Fourwaves, JSConf-style sites). Specific KubeCon / DevoxxFR / FOSDEM implementations confirmed via direct knowledge: KubeCon and FOSDEM rely on per-edition subdomains/archives rather than homepage retrospectives, while DevoxxFR keeps prior years as a dropdown menu link to old sites. Community-scale events (KCDs, DevFest, regional JSConfs) more commonly use the homepage retrospective pattern proposed here.

> **Note:** This file replaces the v1.0 broad-domain feature research with v1.1-specific scope. The v1.0 feature landscape is preserved in `milestones/v1.0-REQUIREMENTS.md`.

---

## Context Recap (existing v1.0 surfaces this milestone touches)

- `src/pages/index.astro` is currently minimal — just `<HeroSection />`, `<KeyNumbers client:idle />`, `<CfpSection />`. Plenty of vertical room to insert past-edition + testimonial sections without crowding.
- `src/pages/venue/index.astro` lines 217–283 already implement a "previous edition" block: rail label + h2 + 16:9 YouTube embed (col-span-2 on lg) + 3 stat cards in a side column + 3 ambiance thumbnails + gallery CTA. **This is the visual contract being moved**, so the 2026-edition homepage section should be a near-direct lift, not a rebuild.
- Stats already hardcoded in venue: 1700+ participants, 50+ talks, 40+ partners. Gallery URL and YouTube ID already wired.
- Photo assets live under `src/assets/photos/ambiance/` (ambiance-03/06/10 used today). 2023 photos will need a new asset directory (e.g. `src/assets/photos/2023/`).
- KCD logo + "originally named Kubernetes Community Days France" history note has no precedent in existing components — net-new.
- Brand: dark theme, DM Sans, geometric shapes, KCD + CND France logos already in design system.

---

## Feature Landscape

### Table Stakes (Users Expect These)

These are conventions that, if missing, make a community-event site feel under-cooked or untrustworthy. A first-time visitor evaluating "is this a real conference worth my Tuesday?" reads them as social proof.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Hero recap stats per edition (attendees / talks / sponsors)** | The "X attendees, Y talks, Z sponsors" triplet is the universal trust marker for community events. Already present in v1.0 venue page — proven asset, just relocate. | LOW | Reuse `previousStats` data shape from `venue/index.astro:63-67`. Stats values for 2023 still need to be sourced from organizer. |
| **Year/edition badge or rail label** | Users scanning a long homepage need an obvious chronological anchor ("ÉDITION 2026", "ÉDITION 2023"). The existing rail-label pattern (`text-xs uppercase tracking-[0.2em]` w/ tertiary color) is already the site's section-heading convention — reuse verbatim. | LOW | Already a design-system pattern used 6× in venue page. Zero new code, just consistent application. |
| **Photo strip / thumbnail grid linking to full gallery** | Photos > prose for "what was this like". Beyond Tellerrand and FITC both lean on this. The 2023 spec explicitly calls for 10 photos. | LOW-MED | LOW if it stays a static grid (3-col on desktop, 1-col on mobile, like venue:248-268). MED if a lightbox/modal viewer is added (out of scope per PROJECT.md — "static content only"). Recommend: 3-col grid → "Voir l'album complet" CTA → external Ente.io gallery. |
| **Video recap embed (YouTube/Vimeo)** | Standard for editions that have aftermovie content. Already wired for 2026 (`YOUTUBE_ID = "qyMGuU2-w8o"`). 2023 likely has no aftermovie — fine to omit and let photos carry the section. | LOW (2026) / N/A (2023) | Use `youtube-nocookie.com` embed (already done). Lazy-load. |
| **External photo gallery link** | Hosting 100+ photos inline kills page weight; offload to Ente.io/Flickr/Google Photos. CND already uses Ente.io album. | LOW | URL in `GALLERY_URL`. 2023 will need its own album URL. |
| **Static testimonial quotes (≥3, name + role + company)** | Community events rely heavily on social proof from past attendees. Even in temporary placeholder form, attribution is non-negotiable — anonymous quotes feel fabricated. | LOW | Inline TS array with `{ quote, author, role, company }`. PROJECT.md confirms inline/hardcoded is acceptable until real quotes land. |
| **Reduced-motion fallback for any animated testimonial strip** | Required by WCAG 2.2.2 (Pause, Stop, Hide). Tailwind ships `motion-safe:` and `motion-reduce:` variants — there's no excuse to skip this. Many users will literally feel sick from auto-scrolling content. | LOW | Wrap any animation in `motion-safe:animate-*` and provide a static stacked fallback. |
| **Mobile single-column collapse** | Photo-heavy sections must reflow to one column under ~640px. Existing venue page already does this (`grid-cols-1 md:grid-cols-3`). | LOW | Reuse existing responsive grid utilities. |

### Differentiators (Competitive Advantage for a Community Event)

Things that make the "where we come from" story memorable rather than perfunctory. Not required, but well-aligned with CND France's "community-warm" brand axis from PROJECT.md.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Brand-history callout for 2023 ("originally named Kubernetes Community Days France")** | This is a genuine competitive moat — most conferences hide rebrands. Telling the KCD→CND story openly with the old logo signals continuity to early adopters and respect to the CNCF affiliation. | LOW | One short paragraph + KCD 2023 logo (asset needs sourcing) + Centre Georges Pompidou venue line. Strongly recommend giving this its own visual treatment (e.g. a bordered card with the KCD logo on the left, history blurb on the right) so it's not buried in body copy. |
| **Animated marquee testimonial strip** | Continuous horizontal scroll feels more "alive" than a static grid; common in modern community-event sites (JSConf-style). However, this is the single most contentious feature in the milestone — see Stitch design call-outs below. | MED | Aceternity UI's "Infinite Moving Cards" and Magic UI's `<Marquee>` are the de-facto patterns; both are React + Framer Motion + Tailwind. With shadcn/ui already in stack, recommend adapting Magic UI's pattern (zero-runtime CSS animation, no Framer Motion needed for a 3-quote duplicated loop). MUST gate behind `motion-safe:`. |
| **Edition-as-narrative ordering (newest first, then older)** | 2026 → 2023 reverse-chronological reads as "here's the most recent thing, and we have history". Forward-chronological (2023 → 2026) buries the most recent recap below historical context. | LOW | Just an ordering decision. Recommend 2026 first, 2023 second. |
| **Subtle visual differentiation between editions** | Rail label + slight background tone shift (e.g. 2023 section gets a `bg-card/40` wash) helps users feel the boundary on long scroll without needing harsh dividers. | LOW | One Tailwind class per section wrapper. |
| **Stats with units/icons (attendees / talks / sponsors)** | Slightly more scannable than bare numbers. Existing venue page is bare numbers — fine, but a small upgrade opportunity. | LOW | Optional. Defer unless Stitch mock pushes for it. |

### Anti-Features (Commonly Requested, Often Problematic)

Things that look attractive in mockups but cause maintenance pain, accessibility regressions, or scope creep on a community-volunteer site.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Per-edition microsites or routed pages (`/2023`, `/2026`)** | "Archive every edition" feels right. KubeCon and FOSDEM do this. | PROJECT.md explicitly puts "Multi-edition archive" out of scope. Adds routing, content collections, navigation, SEO duplicate-content concerns. v1.1 is "tell the story on the homepage", not "build an archive". | Homepage section + external photo gallery URL is the approved scope. If demand grows, revisit in v2. |
| **Manual carousel for testimonials (prev/next arrows + dots)** | Standard "we've all seen it" pattern. | High accessibility cost (focus management, ARIA live regions, keyboard nav, slide announcements) for low payoff with only 3 quotes. WebAIM and Cantilever both discourage carousels generally. With 3 quotes you can just show all 3. | Static 3-col grid OR motion-safe marquee. Skip the carousel ceremony entirely. |
| **`<marquee>` HTML element** | "It's literally called marquee". | Deprecated, fails WCAG 2.2.2 — no pause control, no reduced-motion respect, screen reader chaos. | CSS `@keyframes` translateX with `motion-safe:` gate, or a vetted React component (Magic UI / Aceternity). |
| **Auto-rotating testimonial fade carousel (one-quote-at-a-time fade)** | Looks "premium". | Same accessibility cost as manual carousel + requires interval timer + announces unexpectedly to screen readers + users miss content if they scroll past during a fade. | Motion-safe marquee (continuous, predictable) or static grid. |
| **Lightbox / image modal for the 2023 photo grid** | Native feel, lets users zoom. | Adds JS, focus-trap logic, escape-key handling, swipe gestures on mobile. Out of scope per "static content only". External Ente.io gallery already has a built-in viewer. | "Voir l'album complet" CTA → external gallery. |
| **Live photo feed / Instagram embed** | "Show real-time community vibe". | Third-party iframe weight, GDPR cookie banner trigger, breaks when the embed API changes. | Static curated photos from the organizer's chosen gallery. |
| **Counter animations (numbers ticking up from 0 to 1700)** | "Looks dynamic". | Requires JS island for a purely decorative effect, fights reduced-motion preferences, often janks on mobile. The bare number IS impressive. | Render the number as text. Done. |
| **3D / parallax effects on photos** | Trend-driven request. | Performance hit on mid-range Android, motion-sickness trigger, doesn't survive a redesign. PROJECT.md targets "best Lighthouse scores" via Astro. | Static images with a subtle `group-hover:scale-[1.04]` (already used in venue page). |
| **Inline video autoplay on the recap embed** | "More engaging". | Battery drain, data usage, illegal in some browsers without mute, hostile UX. | Click-to-play YouTube embed (already correctly implemented). |

---

## Feature Dependencies

```
[Homepage layout shell] (existing index.astro)
    +- hosts -> [2026 Edition Section]
    |             +- reuses ----> [Venue page "previous" block code] (lift-and-shift)
    |             +- requires --> [Stats data] (already in venue/index.astro:63-67)
    |
    +- hosts -> [2023 Edition Section] (NEW)
    |             +- requires --> [2023 photo assets] (10 photos, NOT YET SOURCED)
    |             +- requires --> [KCD 2023 logo asset] (NOT YET SOURCED)
    |             +- requires --> [Brand-history copy FR + EN] (placeholder OK per PROJECT.md)
    |             +- requires --> [2023 Ente.io album URL] (or omit gallery CTA if none)
    |             +- requires --> [2023 stats] (attendees / talks at Pompidou — needs organizer input)
    |
    +- hosts -> [Animated Testimonials Strip] (NEW)
                  +- requires --> [3 FR placeholder quotes] (PROJECT.md confirms inline OK)
                  +- requires --> [Marquee component] (Magic UI pattern adapted, OR static grid)
                  +- requires --> [motion-reduce fallback] (non-negotiable accessibility gate)

[Venue page]
    +- cleanup -> [Remove "previous edition" block lines 217-283] (depends on 2026 section landing first)
```

### Dependency Notes

- **2026 section must land before venue cleanup**: don't delete the venue block until the homepage section is verified live, otherwise there's a window with no recap content anywhere.
- **2023 section is content-blocked**: photos, KCD logo, history copy, stats, and album URL all need organizer input. Can ship structurally with placeholder content (per PROJECT.md "placeholder content kept" language), but the 2023 section will visibly look "wip" until assets land. Flag for milestone planning.
- **Testimonials strip is design-blocked**: marquee vs static grid is a Stitch decision. Code for either is small (~100 lines), so don't pre-commit until design lands.
- **i18n strings**: every new section needs FR + EN entries in the i18n bundles (`src/i18n/`). Existing venue page already follows this pattern (`t("venue.prev.heading")` etc.) — repeat for `home.recap2026.*`, `home.recap2023.*`, `home.testimonials.*`.

---

## MVP Definition

### Launch With (v1.1)

The minimum that delivers the milestone goal of "tell the where-we-come-from story on the homepage."

- [ ] **2026 edition section on homepage** — direct port of venue/index.astro:217-283 (rail label + h2 + YouTube + stats column + 3 thumbnails + gallery CTA). Essential because it's the only existing recap content and the cleanest validation that the new layout works.
- [ ] **2023 edition section on homepage (structural)** — rail label + h2 + brand-history callout block (KCD logo + Pompidou venue + history blurb) + 10-photo grid + gallery CTA. Even with placeholder photos/copy, the structural skeleton must ship so the milestone delivers what its name says.
- [ ] **Testimonials section on homepage (static-grid baseline)** — 3 placeholder FR quotes in a responsive 3-col grid (1-col mobile, 3-col desktop). Static grid is the safe MVP regardless of whether the marquee animation makes the cut.
- [ ] **Venue page cleanup** — remove lines 217-283 from `src/pages/venue/index.astro` AFTER the homepage 2026 section is verified.
- [ ] **i18n bundles updated FR + EN** — every visible string in the new sections has translation keys.
- [ ] **Reduced-motion respect** — if any animation ships, it's gated behind `motion-safe:` and degrades to the static grid.

### Add After Validation (v1.1.x)

- [ ] **Marquee animation on testimonials** — promote from static grid IF Stitch design + user validation favors it AND motion-safe gate is verified. Trigger: design approval + at least 6 quotes (3 is too few for marquee to read as a "wall of love").
- [ ] **Real 2023 content** — replace placeholder photos / stats / history copy as organizer sources land. Trigger: organizer delivery.
- [ ] **2026 final aftermovie / final stats** — when the official 2026 recap content is finalized. Trigger: post-event content delivery.
- [ ] **Stat icons** — small visual upgrade if Stitch design adopts them.

### Future Consideration (v2+)

- Per-edition deep-link pages if archive demand emerges (currently scoped out).
- Speaker-attributed video testimonials (vs text quotes).
- Interactive timeline showing all editions on a horizontal scroll.

---

## Phase-Specific Warnings (Hand-off to Roadmap)

| Topic | Likely Pitfall | Mitigation |
|-------|---------------|------------|
| Animated testimonials | Shipping a marquee without `motion-reduce` fallback = WCAG 2.2.2 failure + risk of user complaints. | Hard requirement: any animation MUST be in a `motion-safe:` block AND degrade to a usable static grid. Add a Playwright a11y test that asserts the static grid renders when reduced motion is forced. |
| Animated testimonials | Hydrating a React island just for a CSS marquee is wasteful (Astro shines at zero-JS). | Implement marquee as a pure `.astro` component with CSS `@keyframes`, NOT as a React island. Magic UI's pattern translates 1:1 to vanilla CSS. |
| 2023 content | Section ships looking like an empty husk if photos/logo/stats are still missing on milestone day. | Require organizer to deliver assets BEFORE Stitch design phase, or accept that the section ships with visible "[placeholder photo]" tiles and call it out in the milestone definition of done. |
| Photo grid | 10 full-size 2023 photos = potential 5-10 MB of homepage image weight. | Use Astro's `<Image>` component (already in stack) with `loading="lazy"`, `decoding="async"`, and explicit `width`/`height` to prevent CLS. Convert to AVIF/WebP via Astro's built-in pipeline. |
| Section ordering on homepage | Inserting 2 large new sections will push the existing CFP section far below the fold; the CTA loses prominence. | Stitch design must explicitly address the new homepage scroll order: Hero -> KeyNumbers -> CFP (keep above-fold prominence) -> 2026 recap -> 2023 recap -> Testimonials -> (existing footer). Do NOT push CFP below the recap sections. |
| Brand-history callout | "Originally named Kubernetes Community Days France" is the kind of legal-adjacent copy that CNCF / KCD program may want to review. | Run the exact wording past CNCF/KCD France contacts before launch. Get sign-off in writing. |
| Venue page cleanup | Deleting the venue block before homepage verification leaves a content gap if homepage rollout is delayed. | Sequence: ship homepage 2026 section -> verify in production -> delete venue block in a follow-up PR. Do NOT bundle into one PR. |
| i18n | Forgetting an EN translation will trigger the FR fallback and leave English visitors with mixed-language content. | Pre-write all EN strings before component implementation. Lint check (existing pattern in v1.0) catches missing keys. |

---

## Explicit Stitch Design Call-outs (Will Be Contentious)

Per CLAUDE.md "Stitch-first" rule, these decisions MUST be designed in Stitch and validated before any code lands:

1. **Marquee vs static grid for testimonials** — biggest open question. Recommend Stitch presents BOTH variants side-by-side for user choice. Static grid is safer; marquee is more "alive" but adds complexity and a11y overhead. With only 3 placeholder quotes, marquee may look thin (the visual effect needs >=6 cards to read as continuous).
2. **2023 brand-history callout layout** — is the KCD logo a small badge inline with the heading? A large left-aligned card with body-right? A full-width banner above the photo grid? Each carries different brand weight.
3. **Photo grid shape for 2023** — 10 photos is awkward (not 3x3, not 4x3). Options: 5x2 grid, 3-2-3-2 mixed-row masonry, "hero photo + 9-thumbnail" pattern, or capping visible to 9 with "+1 more" link. Stitch must resolve.
4. **Section dividers / background tone shifts** — how does the eye know section 2026 ended and 2023 began? Rail label alone? Color wash? Geometric shape divider (matches brand)?
5. **Homepage scroll order with CFP** — see warning above. CFP CTA must not be demoted by these new sections.
6. **2026 section: keep venue page's exact 2/3 + 1/3 layout, or rethink for homepage context?** — venue page had the YouTube on left + stats stacked on right. On homepage with more horizontal real estate available, this could become a wider 3-column hero. Stitch decides.

---

## Sources

- [9 Great Examples of Conference Website Designs — Fourwaves](https://fourwaves.com/blog/conference-website-designs/) — past-edition archival as trust marker; Beyond Tellerrand timeline + video archive pattern
- [22 Best Conference Website Design Examples — Colorlib](https://colorlib.com/wp/conference-website-design/) — community-warm visual conventions
- [Best Conference Websites of 2025 — mycodelesswebsite](https://mycodelesswebsite.com/conference-websites/) — homepage layout conventions, video integration, CTA prominence
- [Carousel UX Best Practices — Cantilever](https://www.cantilever.co/article/website-carousel-dos-donts-alternatives-best-practices) — carousels actively discouraged for testimonials; complexity vs payoff
- [WebAIM: Animation and Carousels](https://webaim.org/techniques/carousels/) — accessibility cost of auto-rotating content
- ["marquee" elements must not be used | WCAG 2.2.2 — GetWCAG](https://getwcag.com/en/accessibility-guide/marquee) — `<marquee>` deprecated, fails WCAG
- [prefers-reduced-motion — CSS-Tricks](https://css-tricks.com/almanac/rules/m/media/prefers-reduced-motion/) — media query pattern
- [Design accessible animation and movement — Pope Tech](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/) — Pause/Stop/Hide controls required even with reduced motion
- [Modern and Accessible <marquee> with TailwindCSS — olavihaapala.fi](https://olavihaapala.fi/2021/02/23/modern-marquee.html) — Tailwind `motion-safe:` / `motion-reduce:` pattern
- [Marquee — Magic UI](https://magicui.design/docs/components/marquee) — pure-CSS marquee pattern, recommended adaptation target for our Astro stack
- [Infinite Moving Cards — Aceternity UI](https://ui.aceternity.com/components/infinite-moving-cards) — alternative React + Framer Motion implementation (heavier than Magic UI for our use)
- [Shadcn Marquee — shadcnspace](https://shadcnspace.com/components/marquee) — shadcn-ecosystem variant for ref
- [The Infinite Marquee — Ryan Mulligan](https://ryanmulligan.dev/blog/css-marquee/) — canonical CSS-only infinite marquee technique
- [Gallery Layout Best Practices — onewebcare](https://onewebcare.com/blog/gallery-layout-best-practices/) — grid vs masonry vs full-screen slider tradeoffs
- [Archive design pattern — UI-Patterns](https://ui-patterns.com/patterns/Archive) — chronological archive UX rationale
