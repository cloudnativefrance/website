---
phase: 05
slug: sponsors-team
status: draft
shadcn_initialized: true
preset: project-native (CSS-native @theme in src/styles/global.css, no preset string)
created: 2026-04-12
covers_pages:
  - /sponsors (FR) + /en/sponsors (EN)
  - /team (FR) + /en/team (EN)
---

# Phase 5 — UI Design Contract: Sponsors & Team

> Visual and interaction contract for the Sponsors page and the Team page. Both pages share spacing, typography, and color tokens — only grid density and card anatomy differ. Produced by gsd-ui-researcher from CONTEXT.md (11 locked decisions), DESIGN.md, and existing component patterns. **Stitch-first**: these specs must be translated into two Stitch mockups and user-validated before coding begins.

---

## Design System

| Property | Value | Source |
|----------|-------|--------|
| Tool | shadcn (project-native) | `src/styles/global.css` |
| Preset | none — tokens live in `@theme inline` block of `global.css` | Phase 1 decision |
| Component library | shadcn/ui (Card, Separator available, not mandatory for this phase) | Phase 10 decision |
| Icon library | Lucide (inline SVGs in Astro, matches `SocialLinks.astro`) | Existing pattern |
| Font | DM Sans (via `--font-dm-sans`) | `DESIGN.md` §Typography |
| Theme | Dark-only, OKLCH tokens | `DESIGN.md` §Dark Theme Rationale |
| Image pipeline | Astro `<Image>` for `src/assets/*` — plain `<img>` for `/public/*` (logos currently `/sponsors/*` = public) | Stack locked |

---

## Spacing Scale

Declared values (all multiples of 4, lifted from `DESIGN.md` §Spacing Scale — do NOT introduce new values).

| Token | Tailwind | Value | Usage in this phase |
|-------|----------|-------|---------------------|
| `spacing-1` | `p-1` | 4px | Icon gaps inside social row |
| `spacing-2` | `gap-2` | 8px | Social-icon row gap, inline label spacing |
| `spacing-3` | `p-3` | 12px | Tight card inner padding (Community tier logos) |
| `spacing-4` | `p-4` / `gap-4` | 16px | Default card padding, grid gap (Silver tier) |
| `spacing-6` | `p-6` / `gap-6` | 24px | TeamMemberCard padding, Gold/Silver grid gaps |
| `spacing-8` | `p-8` / `gap-8` | 32px | Platinum card padding, Team group vertical rhythm between cards |
| `spacing-12` | `py-12` | 48px | Vertical spacing between tier/group sections |
| `spacing-16` | `py-16` | 64px | Page section padding (top/bottom of each tier block) |
| `spacing-24` | `py-24` | 96px | Page-level top/bottom padding, space around the sponsor CTA block |

### Grid gaps (per tier / group)

| Grid | Desktop gap | Tablet gap | Mobile gap |
|------|-------------|------------|-----------|
| Platinum (1 col) | n/a (single column, `spacing-8` below) | n/a | n/a |
| Gold (2 col) | `gap-8` (32px) | `gap-6` | `gap-6` |
| Silver (3–4 col) | `gap-6` (24px) | `gap-4` | `gap-4` |
| Community (5–6 col) | `gap-4` (16px) | `gap-3` | `gap-3` |
| Team cards | `gap-8` (32px) | `gap-6` | `gap-6` |

### Exceptions

- Social-icon row retains existing `p-2` (8px) hit target from `SocialLinks.astro` — ensures the ≥44px touch target requirement from `DESIGN.md` §Accessibility is met via composed padding.
- Sponsor logo `<img>` itself has **no padding** — padding is on the wrapping card so every tier shares a visual rhythm even when logos have different aspect ratios.

---

## Typography

Subset of the DESIGN.md scale (max 4 sizes, 2 weights declared **for new text in this phase**; existing page chrome is unaffected).

| Role | Token | Size | Weight | Line Height | Used For |
|------|-------|------|--------|-------------|----------|
| Page title (h1) | `text-4xl` | 36px | 700 | 1.2 | `Nos partenaires` / `Our sponsors`, `L'équipe` / `The team` |
| Section heading (h2) | `text-2xl` | 24px | 600 | 1.3 | Tier names (`Platinum`, `Gold`, `Silver`, `Community`), team group names (`Équipe principale`, `Comité de programme`, `Bénévoles`) |
| Card name (h3) | `text-lg` | 18px | 600 | 1.4 | TeamMember name; SponsorCard caption (sponsor name under logo) |
| Meta / role | `text-sm` | 14px | 400 | 1.5 | TeamMember role, sponsor CTA body copy |
| Page lead / intro | `text-base` | 16px | 400 | 1.6 | Optional 1-sentence page intro under h1 |

Weights: **400 (Regular)** + **600 (SemiBold)**. **700 reserved for h1 only** (bringing total weights used in body/cards to the DESIGN-mandated 2).

### Letter spacing

- Tier names (h2 on sponsors page) use `tracking-wider` + `uppercase` to distinguish them from team group headings, which are Title Case with default tracking. Same size and weight, different texture — readable at a glance which page you're on.
- Team group names: Title Case, default tracking.

---

## Color

Strictly sourced from `global.css` OKLCH tokens. No new palette entries.

| Role | Token | Usage in this phase |
|------|-------|---------------------|
| Dominant (60%) | `--color-background` (deep purple `oklch(16.8% 0.052 286.4)`) | Page background behind both pages |
| Secondary (30%) | `--color-card` (`oklch(22.5% 0.083 285.5)`) | Every SponsorCard surface, every TeamMemberCard surface, sponsor CTA block background |
| Borders | `--color-border` (`oklch(30.8% 0.102 285.5)`) | 1px default border on all cards; thin `<hr>` divider between tier blocks if Stitch mockup adopts dividers (see Sponsor page wireframe) |
| Accent (10%) | `--color-accent` (pink `oklch(76.6% 0.142 10.1)`) | **Reserved for exactly TWO elements on these pages**: (1) the "Devenez partenaire" / "Become a sponsor" CTA button on the sponsors page; (2) nothing else. Tier headings stay foreground — do NOT tint them pink. |
| Primary interactive | `--color-primary` (`oklch(62.5% 0.162 259.9)`) | Card hover border (50% opacity), focus ring, any text link inside the sponsor CTA block |
| Foreground | `--color-foreground` | All h1/h2/h3 text |
| Muted foreground | `--color-muted-foreground` | Team role line, sponsor name caption below logo, CTA body sentence |
| Destructive | `--color-destructive` | NOT USED in this phase (no destructive actions exist) |

### Accent reserved for (explicit list)

- The single global sponsor CTA button at the bottom of `/sponsors` / `/en/sponsors` (label: `Devenez partenaire` / `Become a sponsor`).

That is the only accent usage on these two pages. No pink text, no pink borders, no pink badges. Tier labels, group labels, and card states stay neutral to let logos and faces carry the visual weight.

### Logo background treatment

Sponsor logos render on `--color-card` directly. No per-tier colored hover glow (DESIGN.md §Sponsor Card mentions "tier color" but the four logo colors are NOT in the design system — enforcing a single neutral card treatment keeps us token-pure). Hover uses the standard card border transition to `--color-primary/50`.

---

## Copywriting Contract

All strings live in `src/i18n/ui.ts`. No hardcoded English or French in components.

### Sponsors page

| Element | i18n key (proposed) | FR | EN |
|---------|---------------------|----|----|
| Page h1 | `sponsors.page.title` | Nos partenaires | Our sponsors |
| Page intro (optional 1-liner under h1) | `sponsors.page.intro` | Merci aux organisations qui rendent Cloud Native Days France possible. | Thanks to the organizations making Cloud Native Days France possible. |
| Tier heading — Platinum | `sponsors.tier.platinum` | Platinum | Platinum |
| Tier heading — Gold | `sponsors.tier.gold` | Gold | Gold |
| Tier heading — Silver | `sponsors.tier.silver` | Silver | Silver |
| Tier heading — Community | `sponsors.tier.community` | Community | Community |
| CTA block heading | `sponsors.cta.heading` | Devenez partenaire | Become a sponsor |
| CTA block body | `sponsors.cta.body` | Associez votre marque à l'événement cloud-native francophone de référence. Contactez l'équipe pour recevoir le dossier partenaires. | Put your brand alongside the leading French-speaking cloud-native event. Contact the team to receive the sponsor prospectus. |
| **Primary CTA button** | `sponsors.cta.button` | **Nous contacter** | **Contact us** |
| CTA external link target | n/a | `mailto:contact@cloudnativedays.fr` (fallback — planner confirms with `PROJECT.md` at plan time; if missing, flag a TODO) | same |
| SponsorCard aria-label pattern | `sponsors.card.aria` | `Visiter le site de {name} (nouvelle fenêtre)` | `Visit {name}'s website (opens in a new window)` |
| Empty page state | n/a | Not rendered — if zero sponsors total, show ONLY the CTA block with unchanged copy. No "coming soon" placeholder. |

### Team page

| Element | i18n key (proposed) | FR | EN |
|---------|---------------------|----|----|
| Page h1 | `team.page.title` | L'équipe | The team |
| Page intro (optional) | `team.page.intro` | Les bénévoles qui organisent Cloud Native Days France. | The volunteers organizing Cloud Native Days France. |
| Group heading — Core | `team.group.core` | Équipe principale | Core Team |
| Group heading — Program Committee | `team.group.program_committee` | Comité de programme | Program Committee |
| Group heading — Volunteers | `team.group.volunteers` | Bénévoles | Volunteers |
| TeamMemberCard social-row aria | existing `SocialLinks.astro` aria-labels — no new keys | — | — |
| Empty group state | n/a | Not rendered — empty groups are hidden entirely (same rule as sponsor tiers). |
| Whole-page empty state | `team.page.empty` | L'équipe sera annoncée prochainement. | The team will be announced soon. |

### Destructive / confirmation copy

**None.** Neither page has destructive actions. No confirmation dialogs, no delete operations, no stateful user actions. This row exists in the contract to explicitly record "not applicable."

---

## Component Inventory

New components introduced by this phase:

| Component | Path | Props | Reuses |
|-----------|------|-------|--------|
| `SponsorCard.astro` | `src/components/sponsors/SponsorCard.astro` | `{ sponsor: CollectionEntry<"sponsors">, lang: Locale }` | — |
| `SponsorTierSection.astro` | `src/components/sponsors/SponsorTierSection.astro` | `{ tier, sponsors, lang, title }` | `SponsorCard` |
| `SponsorCTA.astro` | `src/components/sponsors/SponsorCTA.astro` | `{ lang: Locale }` | shadcn `Button` (optional) |
| `TeamMemberCard.astro` | `src/components/team/TeamMemberCard.astro` | `{ member: CollectionEntry<"team">, lang: Locale }` | `SpeakerAvatar`, `SocialLinks` |
| `TeamGroupSection.astro` | `src/components/team/TeamGroupSection.astro` | `{ group, members, lang, title }` | `TeamMemberCard` |

Pages:

| Page | Path | Locale |
|------|------|--------|
| Sponsors (FR) | `src/pages/sponsors.astro` | fr |
| Sponsors (EN) | `src/pages/en/sponsors.astro` | en |
| Team (FR) | `src/pages/team.astro` | fr |
| Team (EN) | `src/pages/en/team.astro` | en |

Navigation wiring (Phase 10 leftover, closed here):

- `src/components/Navigation.astro:15` — set `path: "/sponsors"`, `dead: false`.
- `src/components/Navigation.astro:17` — set `path: "/team"`, `dead: false`.
- Both resolved to EN mirrors via `getLocalePath(lang, path)`.

---

## Layout & Grid — Sponsors page

### Responsive grid columns per tier

| Tier | Mobile (<640) | Tablet (640–1024) | Desktop (≥1024) | Logo max-width |
|------|---------------|-------------------|-----------------|----------------|
| Platinum | 1 col | 1 col | 1 col, centered, max-w `512px` container | **220px** (target 200–240px) |
| Gold | 1 col | 2 col | 2 col | **160px** |
| Silver | 2 col | 3 col | 4 col | **120px** |
| Community | 3 col | 4 col | 6 col | **88px** (target 80–96px) |

Tailwind grid classes (one canonical expression per tier to avoid drift):

```
Platinum:   grid grid-cols-1
Gold:       grid grid-cols-1 sm:grid-cols-2
Silver:     grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4
Community:  grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6
```

### SponsorCard anatomy

- Wrapper: `<a href={sponsor.url} target="_blank" rel="noopener noreferrer" title={sponsor.description[lang]} aria-label={t('sponsors.card.aria', { name })}>`.
- Inner: flex column, `items-center`, `justify-center`.
- `<img src={sponsor.logo} alt={sponsor.name}>` with tier-specific `max-h` and `max-w` utility classes.
- Sponsor name caption: `<span class="text-sm text-muted-foreground mt-2 text-center">{sponsor.name}</span>`.
- **No visible description** — `title` attribute only (D-04).
- Card padding: Platinum `p-8`, Gold `p-6`, Silver `p-4`, Community `p-3`.

### SponsorCard states

| State | Treatment |
|-------|-----------|
| Default | `bg-card`, `border border-border`, `rounded-lg` (8px) |
| Hover | `border-primary/50`, `motion-safe:-translate-y-0.5`, transition `200ms ease` — matches existing SpeakerCard hover contract |
| Focus-visible | `outline-none`, `ring-2 ring-ring ring-offset-2 ring-offset-background` |
| Active | No extra treatment (instant navigation away) |
| Loading image | Browser-native; no skeleton (logos are ≤10KB SVG/PNG) |

### Empty tier handling (D-05)

```astro
{sponsorsInTier.length > 0 && (
  <SponsorTierSection tier="gold" sponsors={sponsorsInTier} ... />
)}
```

No heading rendered if array is empty. No placeholder text. No padding reservation.

### Sponsor CTA block (always rendered at page bottom)

- Full-width `<section>` with `py-24` vertical padding.
- Centered content column max-width `640px`.
- Heading (`text-2xl`, weight 600, foreground), body (`text-base`, muted-foreground), then the **single accent button** (`bg-accent text-accent-foreground`, `px-6 py-3`, `rounded-md`).
- Button label uses `sponsors.cta.button` key ("Nous contacter" / "Contact us").
- Links to `mailto:contact@cloudnativedays.fr` (planner may substitute if PROJECT.md specifies a different address; if unknown, plan flags a TODO for user to fill in).

### ASCII wireframe — sponsors page (desktop ≥1024)

```
┌───────────────────────────────────────────────────────────────────┐
│  [Navigation header — unchanged]                                  │
└───────────────────────────────────────────────────────────────────┘

                       Nos partenaires                      ← h1 36/700
        Merci aux organisations qui rendent ... possible.   ← text-base muted
                                                              (py-24 above this)

    ─────────────  PLATINUM  ─────────────                  ← h2 24/600 uppercase
                                                              (py-16 section)
            ┌─────────────────────────┐
            │                         │
            │      [ LOGO 220px ]     │   ← p-8 card, centered
            │                         │
            │        Acme Cloud       │   ← text-sm muted caption
            └─────────────────────────┘

    ─────────────    GOLD    ─────────────                  ← h2 24/600 uppercase
                                                              (py-16 section)
      ┌─────────────────┐   ┌─────────────────┐
      │  [ LOGO 160px ] │   │  [ LOGO 160px ] │              ← 2-col, gap-8
      │    KubeCorp     │   │   CloudForge    │
      └─────────────────┘   └─────────────────┘

    ─────────────   SILVER   ─────────────                  (hidden if empty)
      ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
      │ LOGO   │ │ LOGO   │ │ LOGO   │ │ LOGO   │           ← 4-col, gap-6
      │ name   │ │ name   │ │ name   │ │ name   │
      └────────┘ └────────┘ └────────┘ └────────┘

    ─────────────  COMMUNITY  ─────────────                 (hidden if empty)
      ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐
      │  │ │  │ │  │ │  │ │  │ │  │                        ← 6-col, gap-4, p-3
      └──┘ └──┘ └──┘ └──┘ └──┘ └──┘

                       ─────────────                        (py-24)
                    Devenez partenaire                      ← h2 24/600
          Associez votre marque à l'événement ...           ← text-sm muted
                   [ Nous contacter ]                       ← accent button
```

---

## Layout & Grid — Team page

### Responsive grid columns per group

| Device | Columns | Avatar size |
|--------|---------|-------------|
| Mobile (<640) | 1 col | 96px |
| Small tablet (640–768) | 2 col | 96px |
| Tablet (768–1024) | 3 col | 108px |
| Desktop (≥1024) | 4 col | 112px |
| Wide desktop (≥1280) | 5 col | 112px |

Tailwind: `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8`.

### TeamMemberCard anatomy

Top-to-bottom, centered:

1. **Avatar** — reuse `SpeakerAvatar.astro` with a new `"md"` size variant to add (or `lg` downscaled via a wrapper if the planner prefers not to modify SpeakerAvatar). Target **`w-28 h-28` (112px)** on desktop, rounded-full. Photo `object-cover`. Missing-photo fallback = initials-on-secondary (existing pattern).
2. **Name** (`<h3>`) — `text-lg` weight 600, foreground, `mt-4`, center-aligned.
3. **Role** — `text-sm`, `text-muted-foreground`, `mt-1`, `line-clamp-1` (truncate with ellipsis on overflow to preserve grid rhythm).
4. **Social row** — reuse `SocialLinks.astro` unmodified. Icons at existing 20×20 size with `p-2` hit target. `mt-3`.

Card wrapper: `bg-card border border-border rounded-lg p-6`, **no hover lift** (team cards are not clickable — they have clickable social icons inside but the card itself is static). Rationale: hover-lifting a non-link is a dark pattern.

### TeamMemberCard states

| State | Treatment |
|-------|-----------|
| Default | `bg-card border border-border rounded-lg p-6` |
| Hover (card itself) | No change — static card |
| Hover (social icon) | Existing `SocialLinks` pattern: `text-muted-foreground → text-primary` |
| Focus-visible (social icon) | Existing `SocialLinks` pattern |
| No photo | Initials circle on `bg-secondary` (existing `SpeakerAvatar` behavior) |
| No social links | Social row hidden (`SocialLinks` already returns null when `hasAny === false`) |

### Group section rendering

```astro
{groups.map(group =>
  membersInGroup.length > 0 && (
    <TeamGroupSection group={group} members={membersInGroup} ... />
  )
)}
```

Order: `["core", "program-committee", "volunteers"]` (D-08, hardcoded — not alphabetized).

Section layout: h2 heading, `mt-4` grid, `py-12` vertical padding between group sections.

### ASCII wireframe — team page (desktop ≥1024)

```
┌───────────────────────────────────────────────────────────────────┐
│  [Navigation header — unchanged]                                  │
└───────────────────────────────────────────────────────────────────┘

                          L'équipe                          ← h1 36/700
      Les bénévoles qui organisent Cloud Native Days France. ← text-base muted
                                                              (py-24 above)

    Équipe principale                                       ← h2 24/600 Title Case
                                                              (py-12 section)
    ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
    │   ( )   │ │   ( )   │ │   ( )   │ │   ( )   │        ← 4-col on lg,
    │  photo  │ │  photo  │ │  photo  │ │  photo  │          5-col on xl,
    │  112px  │ │  112px  │ │  112px  │ │  112px  │          gap-8
    │         │ │         │ │         │ │         │
    │ Alice M │ │ Bob D.  │ │ Chloe L │ │ Dan F.  │        ← text-lg 600
    │ Directr │ │ Program │ │ Ops Lea │ │ Sponsor │        ← text-sm muted
    │ [] [in] │ │ [] [in] │ │ [] [in] │ │ [] [in] │        ← SocialLinks
    └─────────┘ └─────────┘ └─────────┘ └─────────┘

    Comité de programme
    ┌─────────┐ ┌─────────┐ ┌─────────┐
    │         │ │         │ │         │
    │   ...   │ │   ...   │ │   ...   │
    └─────────┘ └─────────┘ └─────────┘

    Bénévoles
    ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
    │   EG    │ │   MH    │ │         │ │   PK    │ │   SR    │   ← initials fallback
    │ (init)  │ │ (init)  │ │  photo  │ │ (init)  │ │ (init)  │
    └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

---

## Stitch Mockup Requirements (Stitch-first rule, CLAUDE.md)

Before planning, two Stitch mockups must be produced and user-validated. Use the CND France 2027 Stitch project (see MEMORY reference_stitch.md) and design-system tokens **without overriding** (per `feedback_stitch_ds_tokens.md`):

### Sponsors mockup must show

1. Page h1 "Nos partenaires" at token `text-4xl / weight 700`.
2. All 4 tiers visible with at least 1 entry each (use placeholder logos at real pixel widths: 220 / 160 / 120 / 88).
3. Correct grid density per tier at desktop 1280px artboard.
4. One intentionally empty tier hidden to demonstrate empty-tier policy (D-05).
5. Sponsor CTA block at the bottom with the accent-pink button.
6. Card hover state shown on at least one logo (border-primary/50).

### Team mockup must show

1. Page h1 "L'équipe" at `text-4xl / weight 700`.
2. All three groups with headings in correct FR copy (D-09).
3. 4-column desktop grid, 5-col on xl artboard.
4. At least one card with initials fallback to demonstrate D-07.
5. SocialLinks row rendered with 2–3 icons at real scale.
6. Role line truncating with ellipsis on one member (for visual QA of the line-clamp).

### Stitch deliverables to capture before plan phase

- FR sponsors page screenshot at 1280px + 768px + 375px widths.
- FR team page screenshot at 1280px + 768px + 375px widths.
- User-approval checkbox recorded in phase notes before `/gsd-plan-phase 5` runs.

---

## Accessibility Contract

- Every sponsor card anchor carries `aria-label` describing destination ("Visit {name}'s website — opens in a new window").
- Every sponsor card anchor uses `target="_blank" rel="noopener noreferrer"` (matches Phase 12 security posture).
- Every logo `<img>` has `alt={sponsor.name}` (not empty — sponsors want their brand read aloud).
- Team cards are NOT interactive; only the social icons inside are. `SpeakerAvatar` already provides `aria-label` on the initials fallback.
- Focus rings on sponsor cards: `ring-2 ring-ring ring-offset-2 ring-offset-background` (matches SpeakerCard).
- Color contrast: all foreground text on `--color-card` and `--color-background` meets WCAG AA per DESIGN.md §Accessibility.
- Tier/group headings are real `<h2>` elements — not visual-only divs — so screen readers can outline the page.
- Minimum touch target for social icons: `p-2` + 20px icon = 36px hit-area; composed with surrounding gap yields ≥44px tap zone on mobile.
- Reduced motion: card hover lifts use `motion-safe:` prefix.

---

## Interaction & Animation

| Element | Animation | Notes |
|---------|-----------|-------|
| SponsorCard hover | `transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:border-primary/50` | Matches SpeakerCard |
| Social icon hover | `transition-colors duration-150` (existing) | No translate on icons |
| CTA button hover | Lighten background ~10% (DESIGN.md button spec), `motion-safe:hover:-translate-y-0.5` | Primary CTA pattern |
| Section reveal | **None** — static render, no scroll-triggered animation (deferred per CONTEXT.md `deferred` list) |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | `Button` (optional, for CTA), `Card` + `Separator` (already installed in Phase 10, optional use) | not required (first-party) |
| Third-party | none | not applicable |

No third-party blocks are introduced in this phase. Vetting gate: not triggered.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS (all strings i18n'd, CTA explicit, empty states defined)
- [ ] Dimension 2 Visuals: PASS (wireframes for both pages, card anatomy specified per tier/group)
- [ ] Dimension 3 Color: PASS (60/30/10 with accent reserved for ONE element: sponsor CTA)
- [ ] Dimension 4 Typography: PASS (4 sizes, 2 weights for body/cards, heading weight is declared and isolated)
- [ ] Dimension 5 Spacing: PASS (all values from existing spacing scale, no new tokens)
- [ ] Dimension 6 Registry Safety: PASS (shadcn official only, no third-party)

**Approval:** pending — awaits gsd-ui-checker then user sign-off on Stitch mockups before `/gsd-plan-phase 5`.

---

*Phase: 05-sponsors-team — UI design contract. Both pages share tokens; planner implements two pages, five new components, and closes two dead nav links.*
