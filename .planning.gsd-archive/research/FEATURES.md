# Feature Landscape

**Domain:** Conference website homepage restructuring (Cloud Native Days France v1.2)
**Researched:** 2026-04-15

> **Note:** This file replaces the v1.1 feature research with v1.2-specific scope (Homepage Restructuring). The v1.1 feature landscape informed the past-editions work that is now built and being restructured.

---

## Table Stakes

Features visitors expect from a well-structured conference homepage. Missing = looks incomplete or loses conversions.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| Hero with primary + secondary CTAs above fold | Standard on KubeCon, Web Summit, every major tech conference. Visitors decide in 5 seconds whether to stay. Already present with Register + Schedule buttons | Already built | Existing `HeroSection.astro` | No changes needed beyond the new 3rd CTA (see Differentiators) |
| Key numbers / social proof counters | "1700+ attendees, 50+ talks" immediately signals event scale and legitimacy. Universal trust marker for community events | Already built | Existing `KeyNumbers.tsx` (React island, `client:idle`) | Animated count-up on scroll intersection. Keep as-is |
| Past edition recap with video + photos | Proves the event is real, establishes quality bar. KubeCon Europe homepage prominently features "2025 Highlights" with video playlist + photo gallery | Already built | Existing `PastEditionSection.astro` with 2026 data | Being restructured into combined section (see Differentiators) |
| Sponsor logos on homepage | Sponsors expect homepage visibility — it is part of their sponsorship package. KubeCon shows all tiers (Diamond through Media Partners) on homepage. Swapcard documentation explicitly recommends "dedicated sections for sponsor logos directly on your event home page" | **Med** | Existing `SponsorTierSection.astro`, `SponsorCard.astro`, CSV-loaded sponsor data via `getCollection("sponsors")` | **NEW for v1.2.** Must filter sponsors by `tier === "platinum"`, reuse existing components, add "Voir tous les sponsors" link |
| CFP / Call for Participation section | Standard for tech conferences accepting submissions. 3-state machine already handles coming-soon/open/closed lifecycle | Already built | Existing `CfpSection.astro` | Being repositioned in section order (see Section Reordering below) |
| Section ordering following conversion funnel | Hero (what/when/where) -> social proof -> content proof -> engagement CTAs -> sponsors. KubeCon Europe order: Hero -> Thank You/Resources -> Highlights -> Photos -> Sponsors -> Email Signup -> Footer | **Low** | All sections already exist as components | **NEW ordering:** Hero -> Key Numbers -> Edition 2026 -> Mini-bloc 2023 -> CFP -> Sponsors Platinum. Validated in Stitch mockup |

## Differentiators

Features that set the homepage apart. Not mandatory but demonstrate polish and drive additional conversions.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| **3rd hero CTA "Restez informe"** (newsletter placeholder) | Captures leads from visitors not yet ready to register. Above-fold CTAs convert 304% better than below-fold (Contentsquare data). Accent Pink ghost button visually differentiates from primary Register CTA without competing for attention. Mail icon reinforces the "stay informed" intent | **Low** | Existing `HeroSection.astro`, existing `buttonVariants` with ghost variant, existing Accent Pink DS token | Placeholder anchor for now — newsletter backend (CLO-6) is explicitly out of scope. Additive: one button added to existing CTA `<div>`. i18n key needed for button label |
| **Combined Edition 2026 section** (photos + film + replays CTA + PDF + testimonial cards) | Consolidates social proof into one compelling narrative block instead of scattering photos, video, and testimonials across separate sections. Cards replace the marquee strip — cards let visitors read at their own pace vs marquee forcing temporal commitment. Adds two new CTAs: "Voir tous les replays" (YouTube playlist) and "Telecharger le bilan 2026 (PDF)" (one-pager download) | **Med** | Existing `PastEditionSection.astro` (needs restructuring to add testimonial cards + new CTAs), existing `TESTIMONIALS` data in `testimonials-data.ts`, YouTube playlist URL in `editions-data.ts`, PDF URL from Google Drive | Most complex feature. Merges two existing sections (PastEditionSection + TestimonialsStrip) into one. The marquee component (`TestimonialsStrip.astro`) is removed from homepage entirely. Testimonial cards are static — no animation, no carousel |
| **One-pager PDF download link** | Gives potential sponsors and decision-makers a shareable artifact — "forward this to your boss to justify the trip." Most conference sites link to YouTube/photos but rarely offer a downloadable summary. Low effort, high perceived professionalism | **Low** | External PDF on Google Drive (URL provided in PROJECT.md) | Simple `<a>` with download icon and descriptive text. Opens in new tab. No hosting needed — Google Drive serves the file |
| **Simplified 2023 mini-bloc** (logo + link only, no photos) | Reduces visual noise. Current version with 3 photos and playlist link competes with 2026 section for attention. KubeCon handles older editions with just an "Archive Link" line — one link is enough for historical reference. Visitors who care will click through to the dedicated `/2023` page | **Low** | Existing `PastEditionMinimal.astro` | Remove `photos` prop rendering, keep `logo` + `title` + `viewPageHref` link. Result is smaller than current component — net code deletion |

## Anti-Features

Features to explicitly NOT build in this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Newsletter signup form with email input on homepage | Backend not ready (CLO-6 deferred). A broken or unconnected form erodes trust instantly. Placeholder anchor is honest and sets expectation | Ghost button CTA that anchors to a future signup section or opens an external form when backend ships |
| Full sponsor grid on homepage (all tiers) | Clutters homepage, dilutes Platinum tier exclusivity. With fewer sponsors than KubeCon, showing all tiers makes the page look sparse. Platinum-only preserves premium feel and drives traffic to `/sponsors` for the full showcase | Platinum logos only + "Voir tous les sponsors" link to dedicated page |
| Auto-rotating sponsor carousel | Carousels have < 1% click-through on non-first slides (NNGroup). Static grid is cleaner, faster, and fully accessible without complex ARIA live regions | Static Platinum logo grid using existing `SponsorTierSection` component |
| Testimonial marquee on homepage | Being replaced by static cards in the combined 2026 section. Marquee requires temporal commitment from the reader, fights reduced-motion preferences, and with only 3 quotes looks thin (needs 6+ for continuous-loop visual effect). Cards are scannable and accessible by default | Static testimonial cards embedded within the Edition 2026 section |
| Parallax or scroll-triggered section animations | Adds JS weight to a zero-JS Astro page, breaks `prefers-reduced-motion`, increases complexity for marginal visual gain on a content-driven homepage | Clean section transitions with consistent `py-16 md:py-24` spacing. Let content breathe |
| Social media feed embed (LinkedIn/X) | Third-party iframe weight, GDPR cookie banner trigger, breaks when embed API changes, stale if not updated | Static social links in footer (already built) |
| Inline video autoplay | Battery drain, data usage, hostile UX. Illegal in some browsers without mute | Click-to-play YouTube embed (already correctly implemented with youtube-nocookie.com) |

---

## Feature Dependencies

```
Hero 3rd CTA "Restez informe" ─────> (standalone, no deps on other new features)
    └── Needs: i18n key "hero.cta.newsletter" in FR + EN

Combined Edition 2026 Section ─────> Requires restructuring of PastEditionSection.astro
    ├── Testimonial cards ──────────> Requires: TESTIMONIALS data (exists in testimonials-data.ts)
    │                                  Cards replace marquee — TestimonialsStrip.astro removed from index
    ├── "Voir tous les replays" CTA > Requires: YouTube playlist URL (exists in editions-data.ts)
    └── "Telecharger le bilan" CTA ─> Requires: Google Drive PDF URL (provided in PROJECT.md)

Mini-bloc 2023 simplification ─────> Modifies PastEditionMinimal.astro (remove photos rendering)
    └── Keeps: logo + title + viewPageHref (link to /2023)

Sponsors Platinum on homepage ─────> Requires: getCollection("sponsors") filtered by tier
    ├── Reuses: SponsorTierSection.astro + SponsorCard.astro (no changes needed)
    └── "Voir tous les sponsors" ──> Links to /sponsors page (exists)

Section reordering (index.astro) ──> Depends on ALL above being ready
    ├── Remove: TestimonialsStrip import + render
    ├── Add: SponsorTierSection import + render (filtered platinum)
    └── Reorder: Hero → KeyNumbers → Edition2026 → Mini2023 → CFP → SponsorsPlatinum
```

### Critical Sequencing Note

Section reordering is the final step — it wires everything together in `index.astro`. Each individual feature can be developed and tested in isolation before the final reorder commit.

---

## MVP Recommendation

All five features form a single coherent homepage restructure validated by the Stitch mockup "Homepage Mockup v2 — Restructured Sections." They should ship together as v1.2.

**Build sequence (based on dependencies and risk):**

1. **Hero 3rd CTA** — Zero dependencies, smallest change (~30 min), immediately testable in isolation
2. **Mini-bloc 2023 simplification** — Net code deletion (~20 min), reduces visual weight before the bigger changes land
3. **Sponsors Platinum section** — New homepage section (~1-2 hours), but fully reuses existing components and CSV data pipeline. Only new code is the data filtering + "voir tous" link in `index.astro`
4. **Combined Edition 2026 section** — Most complex (~3-4 hours): restructure PastEditionSection to include testimonial cards + replays CTA + PDF link. This is where the marquee-to-cards transition happens
5. **Section reordering in index.astro** — Final wiring (~15 min): rearrange component imports/renders, remove standalone TestimonialsStrip

**Total estimated effort: 5-7 hours of implementation.**

**Defer to future milestones:**
- Newsletter backend integration (CLO-6): infrastructure decision pending
- Real testimonials from post-2026 attendee feedback: organizer content gate
- Sponsor interaction tracking / click analytics: out of scope for static Astro site

---

## Sources

- [KubeCon + CloudNativeCon Europe homepage](https://events.linuxfoundation.org/kubecon-cloudnativecon-europe/) — section ordering reference: Hero -> Resources -> Highlights -> Photos -> Sponsors -> Email Signup -> Footer (HIGH confidence, directly observed)
- [Gevme: Best Practices for Event Websites](https://www.gevme.com/en/blog/best-practices-for-designing-a-high-converting-website-for-events/) — conversion funnel ordering, social proof placement
- [Contentsquare CTA Best Practices](https://contentsquare.com/blog/cta-best-practices/) — above-fold CTAs convert 304% better than below-fold
- [WiserNotify CTA Statistics 2026](https://wisernotify.com/blog/call-to-action-stats/) — CTA conversion benchmarks, 2-5 word ideal length
- [Nonprofit Learning Lab: Sponsor Spotlight](https://www.nonprofitlearninglab.org/post-1/how-to-spotlight-event-sponsors-on-your-nonprofit-website) — tiered sponsor visibility strategy, homepage section patterns
- [Swapcard: Highlighting Sponsors on Homepage](https://help.swapcard.com/en/articles/9291529-highlighting-your-sponsors-on-the-event-home-page) — banner ads and logo grids for sponsor sections
- [Elegant Themes: Best Sponsorship Page](https://www.elegantthemes.com/blog/wordpress/how-to-create-the-best-sponsorship-page-possible) — tiered display with different visual weight per level
- Existing codebase analysis: `src/pages/index.astro`, `src/components/hero/HeroSection.astro`, `src/components/past-editions/PastEditionSection.astro`, `src/components/past-editions/PastEditionMinimal.astro`, `src/components/testimonials/TestimonialsStrip.astro`, `src/components/sponsors/SponsorTierSection.astro`, `src/components/sponsors/SponsorCard.astro`
