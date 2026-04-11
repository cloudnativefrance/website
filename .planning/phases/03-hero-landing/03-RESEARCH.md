# Phase 3: Hero & Landing - Research

**Researched:** 2026-04-11
**Domain:** Astro static pages + React islands (countdown timer, animated counters)
**Confidence:** HIGH

## Summary

Phase 3 transforms the current placeholder homepage into the production hero and landing page. The existing codebase already has a working hero structure in `src/pages/index.astro` and `src/pages/en/index.astro` with GeoBackground, CTA buttons, and stats cards -- these need to be refactored into proper components matching the UI spec rather than built from scratch.

The two interactive elements are a countdown timer (React island with `client:load` for immediate hydration) and animated key-number counters (React island with `client:idle` using IntersectionObserver). Both are standard React 19 patterns requiring no external libraries. The i18n infrastructure from Phase 2 is ready -- translation keys need to be added to `src/i18n/ui.ts` and all copy rendered through the `useTranslations` helper.

**Primary recommendation:** Build three new components (HeroSection.astro, CountdownTimer.tsx, KeyNumbers.tsx), add all translation keys to ui.ts, then replace the placeholder content in both index.astro pages with the new components. Keep the existing GeoBackground.astro unchanged.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Full-viewport hero -- GeoBackground.astro fills the entire viewport, content centered over it
- **D-02:** Event photos from previous editions are available; Claude's discretion on placement
- **D-03:** Card-based countdown digits using deep purple card background from design system
- **D-04:** Post-event behavior: countdown disappears, replaced by "Watch Replays" CTA (YouTube placeholder)
- **D-05:** Animated counters on scroll -- numbers count up from 0 when section scrolls into view (React island)
- **D-06:** Three numbers: 1700+ attendees, 50+ talks, 40+ partners
- **D-07:** Primary CTA links to external ticketing URL (placeholder `#register`)
- **D-08:** Secondary CTA "View Schedule" links to schedule page (placeholder until Phase 7)

### Claude's Discretion
- Event photo usage and placement (if any)
- Countdown card animation style (subtle pulse, static, etc.)
- Key numbers icon/illustration choices
- Responsive breakpoint behavior for hero elements
- Whether to include any additional decorative elements

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HERO-01 | Hero section with event name, date (June 3, 2027), venue (CENTQUATRE-PARIS), geometric background | GeoBackground.astro exists and works. UI spec defines full layout with Display typography (64px desktop / 36px mobile), date badge with accent color, radial gradient overlay. Both FR/EN index pages already have the skeleton. |
| HERO-02 | Countdown timer to event date (pre-event mode) | React island with `client:load`. Target: `2027-06-03T09:00:00+02:00`. Card-based digits per D-03. Post-event switch per D-04. `setInterval(1000)` with `aria-live="polite"` updated every 60s. |
| HERO-03 | Prominent CTA button linking to external registration/ticketing | shadcn Button size="lg" already styled with glow shadow in current code. Primary CTA: `#register` placeholder. Secondary CTA: locale-aware link to schedule page. |
| HERO-04 | Key numbers section: 1700+ attendees, 50+ talks, 40+ partners | Animated count-up React island with IntersectionObserver. Grid layout 1-col mobile / 3-col desktop. Card background with hover border transition. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Stitch-first rule:** Every new page or significant UI change must be designed in Google Stitch first, validated by the user, then implemented in code. After executing a phase that produces pages or UI components, present each page in Stitch for review before considering the work done.

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 6.1.5 | Static site framework | Already in use, SSG for content pages [VERIFIED: package.json] |
| React | 19.2.5 | Interactive islands (countdown, counters) | Already in use, `@astrojs/react` configured [VERIFIED: package.json] |
| Tailwind CSS | 4.2.2 | Styling with design tokens | Already configured via `@tailwindcss/vite` [VERIFIED: package.json] |
| shadcn/ui | 4.2.0 (nova preset) | Button, Card, Badge components | Already initialized with base-nova preset [VERIFIED: components.json, UI-SPEC] |
| lucide-react | 1.8.0 | Icon library | Already installed, can be used for key-number icons [VERIFIED: package.json] |

### No Additional Libraries Needed

The countdown timer and animated counters require only React built-in hooks (`useState`, `useEffect`, `useRef`, `useCallback`) and the browser IntersectionObserver API. No animation libraries are needed.

## Architecture Patterns

### Component Structure
```
src/
  components/
    hero/
      HeroSection.astro        # Main hero wrapper (Astro, no client JS)
      CountdownTimer.tsx        # React island, client:load
      KeyNumbers.tsx            # React island, client:idle (below fold)
    patterns/
      GeoBackground.astro       # Existing, no changes
    ui/
      button.tsx                # Existing shadcn Button
      card.tsx                  # Existing shadcn Card
      badge.tsx                 # Existing shadcn Badge
  pages/
    index.astro                 # FR homepage -- imports HeroSection + KeyNumbers
    en/
      index.astro               # EN homepage -- imports HeroSection + KeyNumbers
  i18n/
    ui.ts                       # Add hero translation keys
    utils.ts                    # Existing, no changes
```

### Pattern 1: Astro Wrapper + React Island
**What:** HeroSection.astro is a pure Astro component that handles layout, GeoBackground placement, and static content. It embeds CountdownTimer.tsx as a React island with `client:load`.
**When to use:** When most content is static but one piece needs client-side interactivity.
**Example:** [VERIFIED: existing pattern in current index.astro]
```astro
---
// HeroSection.astro
import CountdownTimer from "./CountdownTimer";
import { getLangFromUrl, useTranslations } from "@/i18n/utils";
const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
---
<section class="relative min-h-[80vh] lg:min-h-screen ...">
  <GeoBackground class="absolute inset-0" />
  <div class="relative z-10 ...">
    <h1>{t("hero.title")}</h1>
    <CountdownTimer
      client:load
      targetDate="2027-06-03T09:00:00+02:00"
      lang={lang}
    />
  </div>
</section>
```

### Pattern 2: Passing Lang Prop to React Islands
**What:** The `lang` variable is extracted in the Astro frontmatter via `getLangFromUrl()` and passed as a prop to React islands. The React component imports the `ui` dictionary directly to look up translations.
**Why:** React components cannot call Astro's `useTranslations` hook. They need the raw dictionary.
**Example:** [VERIFIED: existing i18n/ui.ts and utils.ts patterns]
```tsx
// CountdownTimer.tsx
import { ui, type Locale } from "@/i18n/ui";

interface Props {
  targetDate: string;
  lang: Locale;
}

export default function CountdownTimer({ targetDate, lang }: Props) {
  const t = (key: string) => (ui[lang] as Record<string, string>)[key];
  // ...
}
```

### Pattern 3: IntersectionObserver for Scroll-Triggered Animation
**What:** KeyNumbers.tsx uses a `useRef` + `useEffect` with IntersectionObserver to detect when the section enters the viewport. Once visible, it triggers a count-up animation using `requestAnimationFrame`.
**When to use:** Scroll-triggered animations that should only play once.
**Example:** [ASSUMED -- standard React pattern]
```tsx
const ref = useRef<HTMLDivElement>(null);
const [visible, setVisible] = useState(false);

useEffect(() => {
  const el = ref.current;
  if (!el) return;
  const observer = new IntersectionObserver(
    ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
    { threshold: 0.3 }
  );
  observer.observe(el);
  return () => observer.disconnect();
}, []);
```

### Anti-Patterns to Avoid
- **Hydrating static content as React:** The hero title, subtitle, date badge, and CTA links are static -- they belong in HeroSection.astro, not in a React component. Only CountdownTimer and KeyNumbers need React.
- **Using `client:load` for below-fold content:** KeyNumbers is below the fold. Use `client:idle` to defer hydration and avoid blocking the initial render.
- **Importing the full ui dictionary into the client bundle:** Pass only the needed lang string as a prop. The React component imports `ui` from `@/i18n/ui` which is tree-shaken at build time, but be conscious of bundle size.
- **Using `setInterval` without cleanup:** Always return a cleanup function from `useEffect` that clears the interval.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Button component | Custom button styles | shadcn Button (already has glow, lg size, outline variant) | Already customized with design system tokens, has a11y built in [VERIFIED: button.tsx] |
| Card component | Custom card divs | shadcn Card (already styled with border, bg, hover) | Consistent border-radius, padding, transitions [VERIFIED: card.tsx] |
| Badge component | Custom pill spans | shadcn Badge (already pill-shaped with variants) | Uppercase tracking, focus ring, variants [VERIFIED: badge.tsx] |
| Date formatting | Manual string building | `Intl.DateTimeFormat` or hardcoded strings in ui.ts | The date is fixed (June 3, 2027), so hardcoded bilingual strings in the translation dictionary are simplest and avoid locale edge cases |
| Responsive layout | Custom media queries | Tailwind responsive prefixes (sm:, lg:) | Already established in the codebase [VERIFIED: index.astro] |

## Common Pitfalls

### Pitfall 1: Countdown Hydration Mismatch
**What goes wrong:** The server renders the countdown with a stale time (build time), then React hydrates with the current time, causing a visible flash/jump.
**Why it happens:** Astro SSG builds the HTML at build time. The countdown values are stale by the time a user loads the page.
**How to avoid:** Render the countdown with empty/zero values or a loading skeleton on the server side. Use `suppressHydrationWarning` on the countdown container, or render nothing server-side and let React populate on mount. Since this is `client:load`, the React island renders client-side only -- Astro does not SSR React islands by default, so this is actually a non-issue with `client:load`.
**Warning signs:** Different numbers flashing briefly on page load.

### Pitfall 2: setInterval Drift
**What goes wrong:** `setInterval(fn, 1000)` can drift over time, showing incorrect seconds.
**Why it happens:** JavaScript timers are not perfectly accurate; each tick can be slightly delayed.
**How to avoid:** On each tick, recalculate the remaining time from `Date.now()` vs the target date, rather than decrementing a counter. This self-corrects on every tick.
**Warning signs:** Countdown shows negative values or skips seconds.

### Pitfall 3: Timezone-Dependent Countdown
**What goes wrong:** Users in different timezones see different remaining times.
**Why it happens:** Using `new Date("2027-06-03")` without timezone info defaults to local timezone.
**How to avoid:** Always use the full ISO string with timezone offset: `2027-06-03T09:00:00+02:00` (CEST). The `Date` constructor handles the conversion to UTC internally.
**Warning signs:** Countdown shows ~24 hours more/less than expected for users in distant timezones.

### Pitfall 4: Count-Up Animation Janky on Low-End Devices
**What goes wrong:** The animated counter feels choppy or causes layout shifts.
**Why it happens:** Using `setInterval` for animation instead of `requestAnimationFrame`, or animating too many DOM updates.
**How to avoid:** Use `requestAnimationFrame` with an easing function (ease-out looks best for count-up). Duration of ~2 seconds is standard. Animate the text content only, not layout properties. Use `will-change: contents` sparingly.
**Warning signs:** Numbers visibly stuttering during count-up.

### Pitfall 5: aria-live Region Chattering
**What goes wrong:** Screen readers announce the countdown every second, making the page unusable.
**Why it happens:** `aria-live="polite"` on a region that updates every second.
**How to avoid:** Per UI spec: update the `aria-label` text every 60 seconds, not every second. The visual update can still be every second, but the accessible announcement should be throttled.
**Warning signs:** Screen reader users complaining about excessive announcements.

## Code Examples

### Countdown Timer Core Logic
```tsx
// Source: Standard React pattern [ASSUMED]
import { useState, useEffect, useCallback } from "react";
import { ui, type Locale } from "@/i18n/ui";

const TARGET = new Date("2027-06-03T09:00:00+02:00").getTime();

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(): TimeLeft | null {
  const diff = TARGET - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function CountdownTimer({ lang }: { lang: Locale }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(calcTimeLeft);

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!timeLeft) {
    // Post-event state
    return (/* "Watch Replays" CTA */);
  }

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-label={`${timeLeft.days} days, ${timeLeft.hours} hours remaining`}
    >
      {/* Digit cards */}
    </div>
  );
}
```

### Count-Up Animation Hook
```tsx
// Source: Standard React + rAF pattern [ASSUMED]
function useCountUp(target: number, duration = 2000, start: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;
    const startTime = performance.now();
    let raf: number;

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);

  return value;
}
```

### Translation Keys to Add
```typescript
// Source: UI-SPEC copywriting contract [VERIFIED: 03-UI-SPEC.md]
// Add to src/i18n/ui.ts under fr: and en:
// FR keys:
"hero.title": "Cloud Native Days France",
"hero.subtitle": "3 juin 2027",
"hero.venue": "CENTQUATRE-PARIS",
"hero.cta.register": "Reservez votre place",
"hero.cta.schedule": "Voir le programme",
"countdown.days": "jours",
"countdown.hours": "heures",
"countdown.minutes": "minutes",
"countdown.seconds": "secondes",
"keynumbers.heading": "L'evenement en chiffres",
"keynumbers.attendees": "Participants",
"keynumbers.talks": "Talks",
"keynumbers.partners": "Partenaires",
"hero.post_event": "L'evenement est termine !",
"hero.cta.replays": "Voir les replays",
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React islands SSR'd by Astro | Astro client directives render islands client-side only (no SSR) | Astro 2+ (2023) | No hydration mismatch for dynamic content like countdown [VERIFIED: Astro docs] |
| Class components for timers | Hooks (useEffect + setInterval) | React 16.8+ (2019) | Cleaner cleanup, no lifecycle method boilerplate |
| Intersection Observer polyfill | Native IntersectionObserver | All modern browsers (2020+) | No polyfill needed, 97%+ browser support [ASSUMED] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | IntersectionObserver has 97%+ browser support and needs no polyfill | State of the Art | Very low -- would only affect ancient browsers. Can add polyfill if needed. |
| A2 | Astro React islands with `client:load` render client-side only (no SSR) | Pitfall 1 | Medium -- if Astro SSRs the React component, there could be hydration mismatch. Verify with a quick test. |
| A3 | `requestAnimationFrame` with ease-out cubic provides smooth count-up animation | Code Examples | Low -- if janky, can adjust duration or easing function. |

## Open Questions

1. **Stitch-first workflow for this phase**
   - What we know: CLAUDE.md requires Stitch design validation before code
   - What's unclear: Whether the UI-SPEC.md is sufficient as the "Stitch validation" or if a separate Stitch mockup is still needed
   - Recommendation: The UI-SPEC is detailed enough to code from. Present the implemented result in Stitch for review after coding, per the CLAUDE.md rule "present each page in Stitch for review before considering the work done."

2. **Post-event replay URL**
   - What we know: D-04 says use a YouTube playlist URL placeholder
   - What's unclear: What placeholder URL to use
   - Recommendation: Use `#replays` as the placeholder href, same pattern as `#register` for the ticketing URL.

3. **Schedule page route for secondary CTA**
   - What we know: D-08 says link to `/programme` (FR) or `/en/schedule` (EN)
   - What's unclear: Whether these routes exist yet
   - Recommendation: Use `getLocalePath(lang, "programme")` which will produce `/programme` for FR and `/en/programme` for EN. The page will 404 until Phase 7 builds it, which is acceptable per D-08.

## Sources

### Primary (HIGH confidence)
- `src/pages/index.astro` -- existing hero structure, component imports, styling patterns
- `src/pages/en/index.astro` -- EN mirror page structure
- `src/components/patterns/GeoBackground.astro` -- existing background component API
- `src/i18n/ui.ts` + `src/i18n/utils.ts` -- translation dictionary structure and utility functions
- `src/components/ui/button.tsx`, `card.tsx`, `badge.tsx` -- shadcn component APIs and variants
- `package.json` -- React 19.2.5, Astro 6.1.5, Tailwind 4.2.2 confirmed
- `DESIGN.md` -- full design token reference
- `03-UI-SPEC.md` -- component specs, copywriting contract, interaction contract

### Secondary (MEDIUM confidence)
- `03-CONTEXT.md` -- user decisions D-01 through D-08

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and verified in package.json
- Architecture: HIGH -- extending established patterns already in the codebase
- Pitfalls: HIGH -- well-known React timer/animation patterns with documented solutions

**Research date:** 2026-04-11
**Valid until:** 2026-05-11 (stable stack, no moving parts)
