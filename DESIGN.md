# Cloud Native Days France -- Design System

> Single source of truth for all visual decisions. Every color, font, spacing, and component
> pattern used in the site must reference this file.

---

## Color Palette

All colors are derived from the Cloud Native Days France logo (`src/assets/logos/principal/logo.svg`).
Values are expressed in OKLCH for Tailwind CSS 4 compatibility.

### Logo Source Colors

| Name | Hex | OKLCH | Role |
|------|-----|-------|------|
| CND Red | #cf0822 | oklch(54.0% 0.216 25.2) | Accent, highlights, urgency |
| CND Blue | #4985e8 | oklch(62.5% 0.162 259.9) | Primary interactive color |
| CND Deep Purple | #20134d | oklch(24.6% 0.101 286.7) | Background family origin |
| CND Light Blue | #b8deff | oklch(88.4% 0.061 244.8) | Informational, subtle highlights |
| CND Pink | #ff8a9e | oklch(76.6% 0.142 10.1) | Warm community accent |
| White | #ffffff | oklch(100.0% 0.000 0) | Text on dark backgrounds |

### Semantic Token Map

These are the CSS custom properties wired into Tailwind 4 via `@theme inline` in `src/styles/global.css`. Light is the default; dark is opt-in via `.dark` on `<html>`.

| Token | Light value | Dark value | Usage |
|-------|-------------|-----------|-------|
| `--color-background` | oklch(97.5% 0.006 250) ≈ #f5f7fa | oklch(16.8% 0.052 286.4) ≈ #0e0a24 | Page background |
| `--color-foreground` | oklch(15.5% 0.040 268) ≈ #14182b | oklch(95.6% 0.023 291.3) ≈ #f0eeff | Primary text |
| `--color-card` | oklch(100% 0 0) ≈ #ffffff | oklch(22.5% 0.083 285.5) ≈ #1a1240 | Card and surface backgrounds |
| `--color-card-foreground` | oklch(15.5% 0.040 268) ≈ #14182b | oklch(95.6% 0.023 291.3) ≈ #f0eeff | Text on cards |
| `--color-popover` | oklch(100% 0 0) ≈ #ffffff | oklch(22.5% 0.083 285.5) ≈ #1a1240 | Dropdown/popover backgrounds |
| `--color-popover-foreground` | oklch(15.5% 0.040 268) ≈ #14182b | oklch(95.6% 0.023 291.3) ≈ #f0eeff | Text in popovers |
| `--color-secondary` | oklch(94.5% 0.011 250) ≈ #ebeff5 | oklch(27.1% 0.091 286.5) ≈ #251c50 | Secondary surfaces, hover states |
| `--color-secondary-foreground` | oklch(15.5% 0.040 268) ≈ #14182b | oklch(95.6% 0.023 291.3) ≈ #f0eeff | Text on secondary surfaces |
| `--color-muted` | oklch(94.5% 0.011 250) ≈ #ebeff5 | oklch(27.1% 0.091 286.5) ≈ #251c50 | Muted backgrounds |
| `--color-muted-foreground` | oklch(54.0% 0.025 257) ≈ #6b7280 | oklch(66.8% 0.047 290.8) ≈ #9490b0 | Secondary text, captions |
| `--color-border` | oklch(87.8% 0.014 250) ≈ #d8dde6 | oklch(30.8% 0.102 285.5) ≈ #2d2460 | Borders, dividers |
| `--color-input` | oklch(87.8% 0.014 250) ≈ #d8dde6 | oklch(30.8% 0.102 285.5) ≈ #2d2460 | Input field borders |
| `--color-ring` | oklch(62.5% 0.162 259.9) ≈ #4985e8 | (same — brand) | Focus rings |
| `--color-primary` | oklch(62.5% 0.162 259.9) ≈ #4985e8 | (same — brand) | Buttons, links, interactive elements |
| `--color-primary-foreground` | oklch(100% 0 0) ≈ #ffffff | (same — brand) | Text on primary backgrounds |
| `--color-accent` | oklch(76.6% 0.142 10.1) ≈ #ff8a9e | (same — brand) | Warm highlights, badges, special CTAs |
| `--color-accent-foreground` | oklch(16.8% 0.052 286.4) ≈ #0e0a24 | (same — brand) | Text on accent backgrounds |
| `--color-destructive` | oklch(54.0% 0.216 25.2) ≈ #cf0822 | (same — brand) | Error states, destructive actions |
| `--color-destructive-foreground` | oklch(100% 0 0) ≈ #ffffff | (same — brand) | Text on destructive backgrounds |
| `--color-chart-1` | oklch(62.5% 0.162 259.9) | (same — brand) | Chart color 1 (blue) |
| `--color-chart-2` | oklch(54.0% 0.216 25.2) | (same — brand) | Chart color 2 (red) |
| `--color-chart-3` | oklch(76.6% 0.142 10.1) | (same — brand) | Chart color 3 (pink) |
| `--color-chart-4` | oklch(88.4% 0.061 244.8) | (same — brand) | Chart color 4 (light blue) |
| `--color-chart-5` | oklch(24.6% 0.101 286.7) | (same — brand) | Chart color 5 (deep purple) |

### Color Usage Guidelines

- **Primary blue** (`--color-primary`): All interactive elements -- buttons, links, active tabs, focus states.
- **Accent pink** (`--color-accent`): Sparingly for warmth -- event date badges, speaker count highlights, special CTAs like "Submit a Talk". Do not overuse; one accent per visual section maximum.
- **CND Red**: Reserved for the logo and destructive/error states only. Not for general UI accents.
- **Light blue**: Informational badges, subtle hover backgrounds, tag pills.
- **Background gradient**: For hero sections, consider a subtle gradient from `--color-background` to a slightly lighter purple to add depth without introducing new colors.

---

## Typography

### Font Family

**DM Sans** -- the existing CND France brand font. A geometric sans-serif with excellent readability at all sizes.

```
--font-sans: "DM Sans", ui-sans-serif, system-ui, sans-serif;
```

Load via Astro 6 built-in Fonts API using `fontProviders.google()` for automatic optimization, preloading, and fallback font generation.

### Type Scale

Bold and energetic -- headings are deliberately oversized for visual impact. Body text stays comfortable for reading.

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `--text-xs` | 12px (0.75rem) | 1.5 | 400 | Captions, fine print |
| `--text-sm` | 14px (0.875rem) | 1.5 | 400 | Secondary text, labels |
| `--text-base` | 16px (1rem) | 1.6 | 400 | Body text |
| `--text-lg` | 18px (1.125rem) | 1.6 | 400 | Large body, card descriptions |
| `--text-xl` | 20px (1.25rem) | 1.4 | 500 | Small headings, emphasized text |
| `--text-2xl` | 24px (1.5rem) | 1.3 | 600 | Section sub-headings (h4) |
| `--text-3xl` | 30px (1.875rem) | 1.3 | 600 | Section headings (h3) |
| `--text-4xl` | 36px (2.25rem) | 1.2 | 700 | Page headings (h2) |
| `--text-5xl` | 48px (3rem) | 1.1 | 700 | Hero sub-heading |
| `--text-6xl` | 64px (4rem) | 1.05 | 700 | Hero title |

### Font Weights

| Weight | Token | Usage |
|--------|-------|-------|
| 400 | Regular | Body text, paragraphs |
| 500 | Medium | Emphasized body, navigation links, button text |
| 600 | SemiBold | Sub-headings (h3, h4), card titles |
| 700 | Bold | Main headings (h1, h2), hero text |

### Letter Spacing

- Headings (h1-h2): `-0.02em` (tight, impactful)
- Sub-headings (h3-h4): `-0.01em` (slightly tight)
- Body: `0` (default)
- Uppercase labels/badges: `0.05em` (generous tracking)

---

## Spacing Scale

Base unit: **4px**. All spacing values are multiples of 4.

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-0` | 0px | Reset |
| `--spacing-1` | 4px (0.25rem) | Tight inner gaps |
| `--spacing-2` | 8px (0.5rem) | Icon gaps, compact padding |
| `--spacing-3` | 12px (0.75rem) | Small padding, list spacing |
| `--spacing-4` | 16px (1rem) | Default padding, card internal |
| `--spacing-5` | 20px (1.25rem) | Medium padding |
| `--spacing-6` | 24px (1.5rem) | Section internal spacing |
| `--spacing-8` | 32px (2rem) | Card padding, component gaps |
| `--spacing-10` | 40px (2.5rem) | Between components |
| `--spacing-12` | 48px (3rem) | Section padding |
| `--spacing-16` | 64px (4rem) | Section gaps |
| `--spacing-20` | 80px (5rem) | Large section spacing |
| `--spacing-24` | 96px (6rem) | Page section padding (top/bottom) |

### Container Widths

| Breakpoint | Max Width |
|------------|-----------|
| Default (mobile) | 100% with 16px horizontal padding |
| `sm` (640px) | 640px |
| `md` (768px) | 768px |
| `lg` (1024px) | 1024px |
| `xl` (1280px) | 1280px |
| `2xl` (1440px) | 1280px (content does not exceed this) |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Small elements (badges, tags) |
| `--radius-md` | 6px | Default (buttons, inputs, cards) |
| `--radius-lg` | 8px | Larger cards, modals |
| `--radius-xl` | 12px | Featured cards, hero elements |
| `--radius-full` | 9999px | Pills, avatars, circular elements |

Default `--radius`: **6px** -- slightly rounded, modern but not bubbly. Consistent with a technical aesthetic.

---

## Shadows

Shadow style depends on mode. Light mode uses traditional drop shadows (subtle dark shadows on lighter surfaces). Dark mode uses elevation through lighter surfaces and optional glow effects on CTAs.

| Token | Light value | Dark value | Usage |
|-------|-------------|-----------|-------|
| `--shadow-sm` | `0 1px 2px rgba(20, 24, 43, 0.05)` | `0 1px 2px oklch(0% 0 0 / 0.3)` | Subtle lift for small elements |
| `--shadow-md` | `0 4px 12px rgba(20, 24, 43, 0.07)` | `0 4px 12px oklch(0% 0 0 / 0.4)` | Cards, dropdowns |
| `--shadow-lg` | `0 8px 24px rgba(20, 24, 43, 0.09)` | `0 8px 24px oklch(0% 0 0 / 0.5)` | Modals, elevated panels |
| `--shadow-glow-primary` | `none` (light has no glows) | `0 0 20px oklch(62.5% 0.162 259.9 / 0.3)` | Glow effect on primary CTAs (dark only) |
| `--shadow-glow-accent` | `none` (light has no glows) | `0 0 20px oklch(76.6% 0.142 10.1 / 0.25)` | Glow effect on accent elements (dark only) |

---

## Component Patterns

### Buttons

#### Primary Button
- Background: `--color-primary` (blue)
- Text: `--color-primary-foreground` (white)
- Border radius: `--radius-md` (6px)
- Padding: `12px 24px` (spacing-3 vertical, spacing-6 horizontal)
- Font: DM Sans 500 (medium), `--text-base`
- Hover: Lighten background by ~10% (increase OKLCH lightness)
- Active: Darken by ~5%
- Focus: `--color-ring` with 2px offset ring
- Transition: `background-color 150ms ease, transform 100ms ease`
- Hover transform: `translateY(-1px)` for subtle lift

#### Secondary Button
- Background: `--color-secondary`
- Text: `--color-secondary-foreground`
- Border: 1px solid `--color-border`
- Same radius, padding, and font as primary

#### Accent Button (special CTAs)
- Background: `--color-accent` (pink)
- Text: `--color-accent-foreground` (dark)
- Same dimensions as primary
- Use sparingly: "Submit a Talk", "Register Now"

#### Ghost Button
- Background: transparent
- Text: `--color-foreground`
- Hover: `--color-secondary` background
- For navigation and toolbar actions

#### Sizes
| Size | Padding | Font Size | Height |
|------|---------|-----------|--------|
| sm | `8px 16px` | 14px | 36px |
| md (default) | `12px 24px` | 16px | 44px |
| lg | `16px 32px` | 18px | 52px |

### Cards

- Background: `--color-card`
- Border: 1px solid `--color-border`
- Border radius: `--radius-lg` (8px)
- Padding: `--spacing-6` (24px)
- Hover: Border color transitions to `--color-primary` at 50% opacity
- Transition: `border-color 200ms ease`

#### Speaker Card
- Avatar: 64px circle with `--radius-full`
- Name: `--text-lg`, weight 600
- Company: `--text-sm`, `--color-muted-foreground`
- Talk title: `--text-base`, weight 500, `--color-foreground`

#### Sponsor Card
- Logo: centered, max-height varies by tier (Platinum: 56px, Gold: 48px, Silver: 40px)
- Background: `--color-card` with subtle hover glow matching tier color
- Border radius: `--radius-md`

### Badges / Tags

- Background: `--color-secondary`
- Text: `--color-primary` or `--color-accent` depending on category
- Font: `--text-xs`, weight 500, uppercase, `letter-spacing: 0.05em`
- Padding: `4px 10px`
- Border radius: `--radius-full` (pill shape)

#### Track Badges (schedule)
Use distinct hues from the palette for each track:
- Cloud Infrastructure: `--color-primary` (blue)
- DevOps & Platform: `--color-accent` (pink)
- Security: CND Red (destructive)
- Community: `--color-chart-4` (light blue)

### Navigation

- Background: `--color-background` with `backdrop-filter: blur(12px)` and 90% opacity
- Sticky top, z-index 50
- Links: `--color-muted-foreground`, hover `--color-foreground`
- Active link: `--color-primary` with bottom border indicator
- Mobile: hamburger menu, slide-in panel from right
- Font: `--text-sm`, weight 500

### Hero Section

- Full viewport height (100vh) on desktop, auto on mobile
- Background: `--color-background` with geometric pattern overlay (see below)
- Event name: `--text-6xl` (64px), weight 700, `--color-foreground`
- Date/location: `--text-xl`, `--color-muted-foreground`
- Countdown: individual digit cards using `--color-card` background
- CTA buttons: Primary ("Register") and Accent ("Submit a Talk")

---

## Geometric Background Pattern

**Style: Hex mesh network** -- a cloud-native reference evoking interconnected nodes and services.

### Description
A subtle, low-opacity pattern of hexagonal cells connected by thin lines, reminiscent of molecular structures and network topologies. The pattern sits behind content as a texture, never competing for attention.

### Implementation
- SVG-based, tileable pattern
- Stroke color: `--color-border` at 30-40% opacity
- Optional: subtle gradient fill on a few hexagons using `--color-primary` at 5-8% opacity
- Pattern should be most visible in the hero section and fade/disappear in content-heavy sections
- Consider a radial gradient mask so the pattern is strongest at the center/top and fades at edges

### Specifications
- Hex cell size: ~60px across (desktop), ~40px (mobile)
- Stroke width: 1px
- Node dots at intersections: 2px circles at `--color-primary` / 15% opacity
- Connection lines: 1px at `--color-border` / 20% opacity
- Total pattern opacity on page: 10-20% max

---

## Light Default + Dark Opt-in Rationale

The 2027 edition refreshes the brand to a light-default visual identity, with dark preserved as an opt-in choice via the navigation toggle. Reasoning:

1. **Brand refresh.** A lighter visual identity reads as a deliberate evolution from the previous dark-only site — fresh, current, and distinct from prior editions.
2. **Reader comfort.** Dark sites are harder to read in bright environments — outdoor venues, daylight, projector views, bright lobbies. Light mode covers these reading contexts.
3. **Inclusivity.** Not every visitor prefers dark; offering a choice is a baseline UX courtesy.
4. **Accessibility maintained.** Brand hues (`--color-primary`, `--color-accent`, `--color-destructive`) are unchanged across modes — they meet WCAG AA contrast against both backgrounds. Mode-specific tokens are tuned to keep all text combinations at AA or above.

The light palette is the **Cool Gray** direction: cool blue-gray surfaces (`#f5f7fa` background, `#d8dde6` borders) with deep cool blue-black text (`#14182b`) — crisp, modern, developer-tooling adjacent. The primary brand blue (`#4985e8`) feels native against the cool surface family.

Dark mode is preserved from the previous edition: deep purple-tinted background (`#0e0a24`), card surfaces stepping up the purple lightness ladder. Visitors who prefer it click the sun/moon button in the navigation; their choice is persisted in `localStorage` and survives across the FR ↔ EN locale switch.

The OS `prefers-color-scheme` media query is intentionally NOT honored on first visit — the new light brand is what every visitor sees by default. Per-user override is via the toggle, not via OS detection.

---

## Accessibility Notes

- All text meets WCAG 2.1 AA contrast ratios against their respective backgrounds:
  - Foreground on background: ~15:1 (exceeds AAA)
  - Muted foreground on background: ~5.5:1 (exceeds AA)
  - Primary on background: ~6:1 (exceeds AA)
  - Accent on background: ~8:1 (exceeds AA)
- Focus indicators use a visible ring (`--color-ring`) with 2px offset
- Interactive elements have minimum 44px touch targets on mobile
- Color is never the sole indicator of state -- always paired with text, icons, or shape changes

---

## Token Export Reference

For `src/styles/global.css`, wire these values into Tailwind 4's `@theme` directive:

```css
@theme {
  /* Light is the default — :root holds the light palette */
  --color-background: oklch(97.5% 0.006 250);
  --color-foreground: oklch(15.5% 0.040 268);
  --color-card: oklch(100% 0 0);
  --color-card-foreground: oklch(15.5% 0.040 268);
  --color-popover: oklch(100% 0 0);
  --color-popover-foreground: oklch(15.5% 0.040 268);
  --color-secondary: oklch(94.5% 0.011 250);
  --color-secondary-foreground: oklch(15.5% 0.040 268);
  --color-muted: oklch(94.5% 0.011 250);
  --color-muted-foreground: oklch(54.0% 0.025 257);
  --color-border: oklch(87.8% 0.014 250);
  --color-input: oklch(87.8% 0.014 250);
  --color-ring: oklch(62.5% 0.162 259.9);

  /* Brand hues — same in light and dark, defined once */
  --color-primary: oklch(62.5% 0.162 259.9);
  --color-primary-foreground: oklch(100% 0 0);
  --color-accent: oklch(76.6% 0.142 10.1);
  --color-accent-foreground: oklch(16.8% 0.052 286.4);
  --color-destructive: oklch(54.0% 0.216 25.2);
  --color-destructive-foreground: oklch(100% 0 0);
  --color-chart-1: oklch(62.5% 0.162 259.9);
  --color-chart-2: oklch(54.0% 0.216 25.2);
  --color-chart-3: oklch(76.6% 0.142 10.1);
  --color-chart-4: oklch(88.4% 0.061 244.8);
  --color-chart-5: oklch(24.6% 0.101 286.7);

  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --font-sans: "DM Sans", ui-sans-serif, system-ui, sans-serif;
}

/* Dark opt-in — overrides the mode-specific tokens; brand hues inherit */
.dark {
  --color-background: oklch(16.8% 0.052 286.4);
  --color-foreground: oklch(95.6% 0.023 291.3);
  --color-card: oklch(22.5% 0.083 285.5);
  --color-card-foreground: oklch(95.6% 0.023 291.3);
  --color-popover: oklch(22.5% 0.083 285.5);
  --color-popover-foreground: oklch(95.6% 0.023 291.3);
  --color-secondary: oklch(27.1% 0.091 286.5);
  --color-secondary-foreground: oklch(95.6% 0.023 291.3);
  --color-muted: oklch(27.1% 0.091 286.5);
  --color-muted-foreground: oklch(66.8% 0.047 290.8);
  --color-border: oklch(30.8% 0.102 285.5);
  --color-input: oklch(30.8% 0.102 285.5);
}
```

All visual decisions in this file ship as token pairs (light value + dark value) for mode-specific tokens, and as single values for brand-stable hues. Never introduce a hardcoded color in component code that doesn't have a semantic token — use `text-foreground`, `border-border`, `bg-card`, etc. The shadcn `@custom-variant dark (&:is(.dark *))` is wired in `global.css`, so any Tailwind utility prefixed with `dark:` will work as expected.

The only intentional exception is overlays whose dark scrim is the design (image lightboxes, modal backdrops). These keep their hardcoded `bg-black/N` and `text-white` because the scrim color is independent of the page theme. See `src/components/past-editions/Edition2023Lightbox.astro` for the canonical example.

---

## Logo Usage

### CND France logo

Three canonical variants live in `src/assets/logos/`:

| Variant | Path | When to use |
|---|---|---|
| Full wordmark | `principal/logo.svg` (light bg) or `dark/logo.svg` (dark bg) | Hero, press kit, email signatures — any primary identification |
| Compact mark | `principal/logo-notext.svg` / `dark/logo-notext.svg` | Nav header at mobile sizes, favicon-like contexts, space-constrained corners |
| Print | `print/` | Print-only material — vector sources |

**Sizing:** render the full wordmark at 320–400 px wide on desktop hero anchors, 160–200 px on secondary pages, 32–40 px tall in horizontal headers. Compact mark: 32 px tall for mobile nav, larger only inside brand lockups.

**Clear space:** maintain a margin around the logo equal to the height of the "F" in "FRANCE" (the shortest uppercase letter in the wordmark). No text, photo, or UI element inside that margin.

**Backgrounds:** the site renders the `principal/` (light-bg) variant by default. The `dark/` variant renders when a visitor opts into dark mode via the navigation toggle, and on dark surfaces in press kits, slide decks, and email signatures. Components consume both via the dual-render `dark:hidden` / `hidden dark:block` pattern (see `Navigation.astro`, `Footer.astro`, `HeroSection.astro` for examples) — never hardcode a single variant. Never recolor, add strokes, stretch, or rotate the logo.

**Prohibited:** drop shadows, gradients, outlines, opacity below 1.0, background plates with non-DS colors, AI-generated "reimaginings".

### KCD (Kubernetes Community Days) co-branding

Cloud Native Days France is an official Kubernetes Community Days event. When the KCD logo appears alongside the CND France logo:

**Placement:** side-by-side in a horizontal lockup, CND France on the left (primary), KCD on the right (affiliated), separated by a vertical hairline divider at 40 % white opacity over dark backgrounds, or 40 % black over light.

**Relative sizing:** KCD logo's cap height should match the "C" of "Cloud" in the CND France wordmark — do NOT make KCD larger than CND France on this site. On KCD-produced material, the inverse applies.

**Clear space between logos:** equal to the height of the KCD cap height.

**Acceptable lockups:**
- `[CND France] | [KCD]` — horizontal, header/footer/press
- `[CND France]` above `Official KCD Event` text — vertical, badges/sponsor decks
- `[CND France]` alone — always acceptable; KCD is never required on the primary site nav

**Prohibited co-branding:**
- Merging the two marks into a single combined glyph
- Placing KCD above CND France on CND France-owned surfaces
- Coloring the KCD logo in CND brand colors — use KCD's own palette (Kubernetes blue)
- Using KCD without current KCD program authorisation

**Source:** the KCD logo package lives in `src/assets/logos/kcd/`.

---

## Homepage Layout Contract

Top-to-bottom section order on the homepage:

1. Hero
2. KeyNumbers
3. Edition 2026 (heading → video → photo mosaic → outlined replays + gallery CTAs)
4. SponsorsPlatinumStrip (conditional, when platinum sponsors exist)
5. Footer (with newsletter CTA above the column grid)

CFP, Edition 2023 photo block, KCD brand-history callout, and Testimonials marquee are not currently mounted on the homepage. The CFP component is preserved for a dedicated page; Edition 2023 has its own `/2023` archive route.

Stitch design-system asset (CND France 2027 — Light B: Cool Gray): `12901276993553800542` in Stitch project `14858529831105057917`.

---

*This file is the design contract. All implementation must reference these values. Do not introduce colors, fonts, or spacing values that are not defined here.*
